# Archived: Appwrite backend (pre-Neon)

Drefit ran on Appwrite (database + storage) until the move to Neon Postgres
and Vercel Blob. This folder keeps the old code for reference only. Nothing
in the app, build or tests imports it, and it is excluded from TypeScript and
lint. Its dependencies (`appwrite`, `node-appwrite`) have been removed from
package.json, so these files will not run as-is.

| Archived file | Replaced by |
| --- | --- |
| `src-lib-appwrite/server.ts` (node-appwrite client) | `src/lib/db/client.ts` (Postgres via `pg`) |
| `src-lib-appwrite/client.ts` (unused browser client) | removed (no replacement needed) |
| `src-lib-appwrite/schema.ts` (collection ids + types) | `src/lib/db/schema.ts` + `src/lib/db/collections.json` |
| `scripts/migrate-appwrite.mjs` (prebuild) | `scripts/migrate-db.mjs` |
| `scripts/appwrite-security-schema.mjs`, `scripts/appwrite-upgrades-schema.mjs` | `db/migrations/0001_init.sql` |
| `scripts/seed-appwrite.mjs` | `scripts/seed-db.mjs` |
| Appwrite storage bucket `progress-photos` | private Vercel Blob store (`src/lib/photo-storage.ts`) |

Data is moved with `scripts/import-appwrite.mjs` and
`scripts/upload-photos-to-blob.mjs` (see the README "Migrating from Appwrite").
