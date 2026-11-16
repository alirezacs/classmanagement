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

## Abuse controls

Better Auth’s sign-in, sign-up, and password-reset endpoints use database-backed `RateLimit` state, with stricter five-attempt / 15-minute rules. Invitation creation and acceptance use an independent `AbuseThrottle` table keyed by a one-way hash of route subject plus client source bucket. This makes limits persistent across serverless instances without persisting raw IP addresses or tokens.

