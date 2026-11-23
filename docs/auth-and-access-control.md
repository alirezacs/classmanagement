# Authentication and class-level access control

## Account flows

- Teachers register at `/register`, verify their email, then sign in at `/sign-in`.
- A student follows `/invite/<opaque-token>`, creates or signs into the account matching the invitation email, and accepts the invitation through the authenticated, server-side acceptance route.
- Invitation acceptance never trusts a client-supplied class, user, recipient, or enrollment status. Invitation creation emails an opaque token and never returns it in the API response. Acceptance hashes the opaque token, atomically matches a pending, unexpired invitation to the authenticated email, consumes it once, and activates that user’s enrollment.
- Invalid, expired, revoked, reused, or wrong-recipient invitations return the same generic error. No class title, roster, recipient address, or invitation state is disclosed.
- Account settings are at `/app/settings`; password changes revoke other sessions. Recovery is documented in [account-recovery.md](account-recovery.md).

## Session security

Better Auth uses a seven-day database session with daily renewal. Cookies are HTTP-only, `SameSite=Lax`, path-scoped, and Secure in production. The short (five-minute) cookie session cache is encrypted (JWE); the server still keeps durable session state in PostgreSQL. The authentication origin is explicitly trusted, and callback URLs in application UI are internal paths only.

## Authorization boundary

`src/server/authorization.ts` is the only reusable access boundary for protected data. It provides:

- `requireAuthenticatedUser`
- `requireClassOwner`
- `requireActiveEnrollment`
- `requireClassAccess`
- access guards for class sessions and attendance.

Class access derives from ownership or an `ACTIVE` enrollment. A removed/withdrawn student fails the active-enrollment lookup immediately. Teacher-only mutations must call `requireTeacherWriteAccess`. Each protected Route Handler invokes a guard; UI visibility and redirects are not relied upon for security.

All denied resource access intentionally becomes `404 Not found`; callers cannot distinguish a nonexistent identifier from another teacher’s class, a removed enrollment, or another student’s private record.

## Database-backed roles and permissions

Better Auth establishes identity. Every protected request then reloads account state, roles, and permissions from PostgreSQL, so revocation does not require sign-out. Multiple roles are represented by `Role`, `Permission`, `UserRole`, and `RolePermission`; the system roles are Admin, Teacher, and Student.

A permission never replaces a record check. Teacher scope still requires class ownership, Student scope still requires an active enrollment, and global `*.any`/`*.all` permissions are explicit. `admin.access` only opens the Admin area. Resource mutations use `requireClassScopedPermission` with distinct owned/any keys for enrollments, invitations, sessions, and attendance.

Permission definitions live in `src/server/permissions.ts`; the Admin UI can compose roles only from that catalog. To add a feature:

1. Register a stable resource/action key and plain-language description.
2. Add it to a default role only when intended.
3. Enforce it in the service/data-access function together with ownership or enrollment predicates.
4. Protect every Route Handler or Server Action that reaches the operation.
5. Run `npm run db:sync-permissions` after deployment and add direct-call authorization tests.

Role assignment and permission editing enforce delegation: an operator cannot assign or modify a role whose current or proposed capabilities exceed the operator's own. Serializable transactions protect the last active user who holds `admin.access`, `roles.assign`, and `permissions.assign` together.

## Abuse controls

Better Auth’s sign-in, sign-up, and password-reset endpoints use database-backed `RateLimit` state, with stricter five-attempt / 15-minute rules. Invitation creation and acceptance use an independent `AbuseThrottle` table keyed by a one-way hash of route subject plus client source bucket. This makes limits persistent across serverless instances without persisting raw IP addresses or tokens.

