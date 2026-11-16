# Deployment

Configure separate PostgreSQL databases for development, preview, and production.
Required server variables are documented in `.env.example`: pooled/direct database
URLs, Better Auth secret and URL, public app URL, and email provider settings.

Deploy with `npm run build`. Apply migrations deliberately with `npx prisma migrate deploy`
after taking a backup; never reset or seed production automatically. The scope-removal
migration is destructive to legacy coursework and file metadata and is intentionally
not run by the app.
