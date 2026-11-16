# Classroom

Production-oriented Next.js foundation for an invitation-only class management system.

## Stack

Next.js 16 App Router, strict TypeScript, PostgreSQL, Prisma ORM 7, Better Auth, Tailwind CSS 4, accessible shadcn-style components, Zod, and Vitest. Runtime requests use pooled PostgreSQL; migrations use a separate direct connection.

## Local setup

1. Copy `.env.example` to `.env` and replace every placeholder.
2. Create an empty PostgreSQL database.
3. Run:

```sh
npm ci
npm run db:migrate
npm run db:seed
npm run dev
```

For local PostgreSQL, use `sslmode=disable` in both database URLs. Local authentication defaults to `EMAIL_MODE=local`: after registering, open `http://localhost:3000/api/dev/email-inbox`, copy the verification link from the JSON response, and open it in the browser. The mailbox is process-local and is cleared when the dev server restarts. Production must use `EMAIL_MODE=resend` with a verified sender.

The seed is idempotent, uses only `example.test` identities, never deletes existing records, and refuses production use unless `ALLOW_DEVELOPMENT_SEED=true` is explicitly set.

## Database rules

The reduced schema contains unique keys for enrollment and attendance, composite
foreign keys for sessions and class membership, and server validation for remaining
cross-record rules. Coursework and external storage integrations are out of scope.

## Verification

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

Migration tests execute the versioned SQL against a fresh embedded PostgreSQL instance. The build performs no live database query. Health endpoints are `/api/health/live` and `/api/health/ready`; readiness never exposes configuration or errors.

- [Application architecture](docs/architecture.md)
- [Authentication and access control](docs/auth-and-access-control.md)
- [Account recovery](docs/account-recovery.md)

