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
