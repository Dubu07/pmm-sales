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

## D1 database configuration

`wrangler.jsonc` is currently configured with the real `pmm-sales-db` D1 database. The old placeholder is no longer present, and the initial migration has been applied to that database.

If deploying this project to a different Cloudflare account, create a new D1 database and replace the `database_id` in `wrangler.jsonc` before deploying.

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

Cloudflare will return a configuration block containing the new `database_id`. Replace the existing `database_id` in `wrangler.jsonc` with that value.

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

OpenNext warns that Windows is not fully supported for the Cloudflare build because the bundle step creates symlinks. Use WSL, or enable Windows Developer Mode before running `npm run build:cf`, `npm run check:cf`, or `npm run deploy`.

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

## Authentication

The application now requires an ID and password before pages or API routes can be used. Successful login creates a signed, HTTP-only session cookie that expires after seven days. This is a simple single-user login and does not yet provide multiple users or role-based permissions.

The request guard is intentionally kept in `middleware.ts`: the current OpenNext Cloudflare adapter does not support Next.js Node middleware, while this Edge-compatible middleware can protect the Worker deployment.

## Login configuration

Local credentials are stored in the ignored `.env.local` file.

For the deployed Worker, add these as runtime secrets in the Worker settings or with Wrangler. Do not commit them to `wrangler.jsonc` or the repository:

```text
AUTH_USER_ID
AUTH_PASSWORD
AUTH_SESSION_SECRET
```

The production values must be set in Cloudflare because `.env.local` is intentionally not deployed. From a terminal authenticated with Wrangler, set them individually and enter each value when prompted:

```bash
npx wrangler secret put AUTH_USER_ID
npx wrangler secret put AUTH_PASSWORD
npx wrangler secret put AUTH_SESSION_SECRET
```

Alternatively, add them under the Worker's **Settings > Variables and Secrets** in Cloudflare. Keep the values consistent between the Worker runtime and the Workers Builds environment, and preserve them on future deployments with Wrangler's `--keep-vars` option when applicable.

The **Workers Builds > Settings > Variables and secrets** section is for the build process and does not by itself create runtime secrets on the deployed Worker. To verify the runtime configuration without revealing values, run:

```bash
npx wrangler secret list --name pmm-sales
```

The output should include all three `AUTH_*` names.

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
