# Scope removal migration

This forward migration permanently deletes assignment, submission, grade, folder,
attachment, and application storage metadata. It does not delete external provider
objects or revoke external accounts. Take a verified PostgreSQL backup before
applying it. The migration history is preserved and this migration is intentionally
not applied automatically by the application.
