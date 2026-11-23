# Deployment

Use separate PostgreSQL databases for Development, Preview, and Production. Never put a personal email, password, or password hash in a Prisma migration. Migrations define shared structure; production role assignment is an explicit one-time bootstrap operation.

## Required Vercel variables

Configure these for the appropriate Vercel environment:

- `DATABASE_URL`: direct PostgreSQL connection used by Prisma migrations and scripts.
- `DATABASE_URL_POOLED`: pooled PostgreSQL connection used by the application at runtime.
- `BETTER_AUTH_SECRET`: at least 32 random bytes.
- `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL`: the deployed HTTPS origin.
- `EMAIL_MODE=resend`, `RESEND_API_KEY`, and `EMAIL_FROM` for production email.
- `REQUIRE_EMAIL_VERIFICATION=true` unless intentionally changed.

Hosted PostgreSQL URLs should require TLS. Do not expose direct or pooled connection strings as `NEXT_PUBLIC_*` variables.

## Production migration and permission synchronization

Link the local checkout to the Vercel project once:

```sh
npx vercel link
```

Run the forward migrations and the idempotent code-owned permission synchronization against Production:

```sh
npx vercel env run -e production -- npm run db:deploy
```

Then assign Admin to a deliberately selected existing Production user once:

```sh
npx vercel env run -e production -- npm run db:bootstrap-admin -- --email=alireza@gmail.com
```

The bootstrap is additive and idempotent: it preserves Teacher and Student roles. It refuses missing or deactivated users and never creates a password.

For a separate Preview database, use `-e preview` instead. Run migrations before deploying code that needs new columns:

```sh
npx vercel env run -e production -- npm run db:deploy
npx vercel deploy --prod
```

Do not put migrations in Vercel's Build Command: concurrent Preview/Production builds can race, and a failed database change should not be coupled to static compilation. Run `db:deploy` deliberately from CI or an authorized workstation after taking an appropriate database backup.

## Seed behavior

`npm run db:sync-permissions` is the production-safe seeder and is already included in `db:deploy`. It registers known capabilities and ensures default grants without deleting custom roles.

`npm run db:seed` is development-only sample data. It creates `example.test` users/classes and intentionally refuses production execution unless `ALLOW_DEVELOPMENT_SEED=true`; do not enable that flag for a real Production database.

The application build remains:

```sh
npm run build
```

The build generates Prisma Client but performs no live database query.
