# Drefit

Fitness coaching web app (Next.js 14, Auth.js v5, Paystack, WhatsApp reminders).

## Stack

- **Database:** Neon Postgres via the Vercel Marketplace (`drefit-db`), accessed with `pg`
  through a small data layer in `src/lib/db/` (`db.listDocuments/getDocument/createDocument/
  updateDocument/deleteDocument`, plus `Query` and `ID` helpers). Documents keep the
  `$id` / `$createdAt` / `$updatedAt` shape the app was written against; the mapping from
  app fields to snake_case columns lives in `src/lib/db/collections.json`.
- **Photos:** private Vercel Blob store (`drefit-photos`). Uploads are limited to images
  up to 5 MB and are only streamed back to their owner (`/api/progress/photos/[fileId]`).
- **Auth:** Auth.js v5 (Google + email/password with bcrypt), JWT sessions.
- The previous Appwrite backend is archived in `archive/appwrite/` (not built or imported).

## Local setup

```bash
npm install
cp .env.local.example .env.local   # or: vercel env pull .env.local
# point DATABASE_URL at a local Postgres for development, e.g.
#   createdb drefit_dev && DATABASE_URL=postgres://localhost/drefit_dev
npm run db:migrate                 # create/upgrade tables (idempotent)
npm run db:seed                    # workouts + 8-day diet plan, only into empty tables
npm run dev
```

> `vercel env pull` writes the **shared Preview/Production** Neon URL. Don't run the seed
> or tests against it; use a local database for development.

## Database migrations

- SQL files live in `db/migrations/` and are applied in name order by
  `scripts/migrate-db.mjs`. Each runs once in its own transaction and is recorded in
  `schema_migrations` (with a checksum). A Postgres advisory lock prevents concurrent runs.
  Migrations only add things (`CREATE ... IF NOT EXISTS`); never edit an applied file,
  add a new `0002_*.sql` instead.
- `npm run build` runs it automatically (`prebuild`). If `DATABASE_URL` is missing or the
  database is unreachable it logs a warning and the build continues, unless
  `MIGRATE_STRICT=1`.

Uniqueness enforced by the database: `payment_events.reference` (a Paystack charge is
applied at most once), `users.referral_code`, one `referrals` row per referred user,
`reminder_log (user_id, type, day)`, `progress_photos.file_id`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run db:migrate` | Apply pending SQL migrations (reads `.env.local`) |
| `npm run db:seed` | Seed workouts and diet plans if those tables are empty |
| `node --env-file=.env.local scripts/import-appwrite.mjs <dir> [--dry-run] [--confirm]` | Import Appwrite exports |
| `node --env-file=.env.local scripts/upload-photos-to-blob.mjs <dir> [--dry-run] [--confirm]` | Upload exported photos to Blob |
| `npm test` / `npm run lint` / `npx tsc --noEmit` | Checks |

## Migrating data from Appwrite

1. **Export** from the Appwrite console (database → each collection → export, or the CLI)
   one file per collection, named by collection id: `users`, `progressLogs`,
   `progressPhotos`, `workouts`, `workoutCompletions`, `dietPlans`, `communityPosts`,
   `communityComments`, `coachingMessages`, `loginAttempts`, `paymentEvents`,
   `reminderLog`, `referrals`, `firstWeekPlans` — as `.json` (array or
   `{ "documents": [...] }`), `.ndjson` or `.csv`. Put them in one folder.
   Download every file in the `progress-photos` storage bucket into a second folder,
   keeping the Appwrite file id as the file name (extension optional).
2. **Dry run:** `node --env-file=.env.local scripts/import-appwrite.mjs ./export --dry-run`
   validates every file and reports unknown fields without writing.
3. **Import:** same command with `--confirm` (required for any non-local database).
   Ids, timestamps and bcrypt password hashes are kept as-is, so existing logins keep
   working. Rows already present are skipped, so it is safe to re-run. Rows that clash
   on another unique key (e.g. a duplicated referral code) are listed as
   "NOT imported" for manual review.
4. **Photos:** `node --env-file=.env.local scripts/upload-photos-to-blob.mjs ./photos --confirm`
   uploads each file for photo rows that have no blob yet and links it. Re-runnable.

## Environment

See `.env.local.example`. Key variables: `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`,
`NEXTAUTH_SECRET`, `NEXTAUTH_URL` (production only: `https://drefit.vercel.app`; Preview
leaves it unset so the deployment's own host is used), `GOOGLE_CLIENT_ID/SECRET`,
`PAYSTACK_SECRET_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`, `RESEND_API_KEY`, `FROM_EMAIL`,
`ADMIN_EMAILS`, `CRON_SECRET`, WhatsApp variables.
