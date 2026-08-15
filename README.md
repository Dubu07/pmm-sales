# PMM Sales & Invoice System — Cloudflare Edition

This version keeps the existing Next.js sales/invoice application but moves production hosting to **Cloudflare Workers** and production data to **Cloudflare D1**.

## Architecture

```text
Phone / Tablet / PC
        ↓ HTTPS
Cloudflare Workers
        ↓
Next.js via OpenNext
        ↓
Cloudflare D1
```

The host PC no longer needs to remain on after deployment.

## What changed

- Added `@opennextjs/cloudflare` deployment support.
- Added `wrangler.jsonc` with Worker name `pmm-sales`.
- `WORKER_SELF_REFERENCE` now correctly points to `pmm-sales`.
- Replaced the production local SQLite file with a Cloudflare D1 binding named `DB`.
- Kept the Prisma schema and Prisma ORM for normal database operations.
- Invoice create/edit operations use D1 `batch()` so their multi-step writes remain atomic.
- Added a D1 migration in `migrations/0001_initial.sql` with the default invoice types and company settings.
- Removed the local `.db` backup workflow from the UI.
- PDF logo loading now uses the Cloudflare static-assets binding instead of Node filesystem access.
- Removed Node-only route runtime declarations that are not supported by OpenNext Workers.

## Important before first deployment

`wrangler.jsonc` currently contains this placeholder D1 database ID:

```text
00000000-0000-0000-0000-000000000000
```

You must create the real D1 database and replace that value before deploying.

## One-time Cloudflare setup

Prerequisites:

- Node.js installed.
- A Cloudflare account.
- Wrangler authenticated to your Cloudflare account.

From the project directory:

```bash
npm install
npx wrangler login
npx wrangler d1 create pmm-sales-db
```

Cloudflare will return a configuration block containing the real `database_id`.

Open `wrangler.jsonc` and replace:

```jsonc
"database_id": "00000000-0000-0000-0000-000000000000"
```

with the ID Cloudflare returned.

Then initialize the production database:

```bash
npm run db:remote:apply
```

This creates the tables and seeds:

- Normal Invoice (`INV`)
- Consignment (`CS`)
- Replacement (`RP`)
- Default company settings

## Deploy from your computer

After the D1 database ID has been configured:

```bash
npm run deploy
```

The application will be deployed to the `pmm-sales` Worker and Cloudflare will provide a `*.workers.dev` address unless you attach a custom domain.

## Cloudflare Git / Workers Builds

If deploying from a Git repository through Cloudflare Workers Builds, commit the real D1 database ID in `wrangler.jsonc` first.

Recommended build settings:

```text
Build command:  npm run build:cf
Deploy command: npx @opennextjs/cloudflare deploy
```

The D1 migration should be applied once before the first application deployment:

```bash
npm run db:remote:apply
```

Afterward, normal application deployments do not need to recreate the database.

## Local development

Run:

```bash
npm install
npm run db:local:apply
npm run dev
```

or on Windows run:

```text
setup.bat
start.bat
```

The local D1 state is managed by Wrangler under `.wrangler/` rather than the old `data/pmm-sales.db` file.

For a closer-to-production runtime test:

```bash
npm run preview
```

## Useful commands

```bash
npm run dev              # Next.js local development
npm run preview          # Build and preview in the Workers runtime
npm run build:cf         # Build OpenNext output for Cloudflare
npm run deploy           # Build + deploy to Cloudflare Workers
npm run db:local:apply   # Apply D1 migrations locally
npm run db:remote:apply  # Apply D1 migrations to Cloudflare
npm run cf-typegen       # Generate Cloudflare binding types
```

## Custom domain

Once the Worker works on its `workers.dev` address, attach your custom domain/subdomain in Cloudflare, for example:

```text
sales.yourdomain.com
```

A Cloudflare Tunnel is not required for this cloud-hosted version.

## Authentication warning

**Login/authentication is intentionally not included in this migration increment.**

Do not treat the deployed URL as ready for sensitive production business data until the planned login/security increment is added. The next recommended enhancement is application authentication before broad use.

## Database notes

Cloudflare D1 is SQLite-compatible, but it is not a local SQLite file. Runtime access happens through the `DB` Worker binding.

Prisma ORM is retained for queries and simple writes. D1's native `batch()` API is used for invoice create/edit operations because D1 batches execute atomically while Prisma transactions are not relied upon for D1.

## Existing local data

This cloud database intentionally starts fresh. The old local SQLite database is not automatically imported. Historical/local data migration can be handled separately if needed later.

## Cloudflare compatibility check

Before the first production deployment, run:

```bash
npm run check:cf
```

This performs the OpenNext build and a Wrangler dry run so Cloudflare can report the generated Worker bundle information without publishing it. This is especially useful because this project includes Prisma, ExcelJS and PDF generation.

If Cloudflare reports that the generated Worker exceeds the limits of the plan you are using, do not redesign the whole application immediately. The first optimization target should be the heavier export/PDF dependencies, because the core invoice system itself does not depend on them.
