# Current architecture

Classroom is a Next.js App Router application backed by PostgreSQL and Prisma.
The active product scope is authentication, classes, enrollment, invitations,
sessions, scheduling, attendance, dashboards, and account settings.

Sessions use `DRAFT`, `COMPLETED`, or `CANCELLED` states. Cancelled sessions carry
a required reason. Each session stores its Entracte count; attendance supports the
session start checkpoint and before/after checkpoints for every Entracte.

Protected reads and mutations use server-side authorization at the data boundary.
Class ownership and active enrollment determine access. PostgreSQL is pooled for
Vercel-compatible deployments.

The database schema intentionally contains no coursework, file, or external storage
models. Historical migrations retain removed tables for auditability; the forward
scope-removal migration deletes that metadata when explicitly applied.

Application areas are separated at `/admin`, `/teacher`, and `/student`. Teacher and Student share the workspace component system; Admin uses a distinct warm accent and independently permission-gated data. Legacy `/app` is the authenticated landing resolver.

Existing operational features exposed to authorized administrators are archived class state, enrollment and invitation management, session generation, segmented attendance/private notes, and account activation state. Sensitive administrative changes write `AuditLog` records with actor, action, target, time, and minimal metadata. Passwords, hashes, tokens, reset URLs, and private note contents are excluded.
