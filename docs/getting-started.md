# Getting Started

This guide walks through setting up Cloudflare Secrets Manager from a fresh checkout to a working production and staging deploy.

## Prerequisites

Install these before you begin:

- Node.js and npm.
- Git.
- Bash, if you plan to use `manage-secrets.sh` or `rotate-secrets.sh`.
- A Cloudflare account with permission to deploy the target Worker.
- Wrangler authentication on your machine.

Check the basics:

```bash
node --version
npm --version
git --version
```

Install dependencies and log in to Cloudflare:

```bash
npm install
npx wrangler login
npx wrangler whoami
```

If `npx wrangler whoami` prints your Cloudflare account, Wrangler is ready.

## Step 1: Configure The Worker

Open `wrangler.toml` and set names that are unique in your Cloudflare account.

Example:

```toml
name = "my-api-worker"
main = "src/index.js"
compatibility_date = "2026-04-23"

[vars]
ENVIRONMENT = "production"

[env.staging]
name = "my-api-worker-staging"

[env.staging.vars]
ENVIRONMENT = "staging"
```

The default environment deploys with `wrangler deploy`.

The staging environment deploys with:

```bash
npx wrangler deploy --env staging
```

## Step 2: Create Secret Files

Secrets are values Cloudflare encrypts and exposes to Worker code through `env`.

Create `production.env`:

```env
MY_SECRET_KEY=replace-with-production-value
DATABASE_URL=postgres://user:password@prod-host:5432/app
JWT_SECRET=replace-with-a-long-random-production-secret
```

Create `staging.env`:

```env
MY_SECRET_KEY=replace-with-staging-value
DATABASE_URL=postgres://user:password@staging-host:5432/app
JWT_SECRET=replace-with-a-long-random-staging-secret
```

Keep production and staging values different whenever possible. Sharing credentials across environments makes rotation and incident response harder.

## Step 3: Create Variable Files

Variables are plain-text deploy-time config values. They are not encrypted secrets.

Create production variables:

```bash
cp production.vars.env.example production.vars.env
```

Create staging variables:

```bash
cp staging.vars.env.example staging.vars.env
```

Example production variables:

```env
PUBLIC_APP_NAME=My Production Worker
PUBLIC_API_BASE_URL=https://api.example.com
FEATURE_SIGNUPS_ENABLED=true
```

Example staging variables:

```env
PUBLIC_APP_NAME=My Staging Worker
PUBLIC_API_BASE_URL=https://staging-api.example.com
FEATURE_SIGNUPS_ENABLED=false
```

Use variables for values that can be visible in logs, command history, Cloudflare metadata, or a public endpoint if your Worker exposes them.

## Step 4: Preview Variables

Preview production variables:

```bash
npm run show-vars
```

Preview staging variables:

```bash
npm run show-vars:staging
```

The preview command prints values, so do not use it for secrets.

## Step 5: Sync Secrets

Upload production secrets:

```bash
npm run sync-secrets
```

Upload staging secrets:

```bash
npm run sync-secrets:staging
```

Wrangler stores the secret values in Cloudflare. After upload, `wrangler secret list` shows secret names, not secret values.

## Step 6: Dry-Run Deploys

Dry-run production:

```bash
npm run deploy:dry-run
```

Dry-run staging:

```bash
npm run deploy:dry-run:staging
```

Dry-runs help catch problems in `wrangler.toml`, missing Worker entry files, invalid compatibility dates, and malformed `--var` arguments.

## Step 7: Deploy

Deploy production:

```bash
npm run deploy
```

Deploy staging:

```bash
npm run deploy:staging
```

These commands sync secrets first, then deploy with variables.

## Step 8: Verify Runtime Configuration

The starter Worker exposes these endpoints:

| Path | Purpose |
|---|---|
| `/` | Shows a template response and available endpoints |
| `/health` | Shows environment and whether expected secrets exist |
| `/config` | Shows non-secret public config |
| `/features` | Shows parsed feature flags |

After deploy, request your Worker:

```bash
curl https://<your-worker>.<your-subdomain>.workers.dev/health
```

The `/health` endpoint reports whether expected secrets are present without returning their values.

## Step 9: Run The Live Example

The `example/` directory contains a throwaway Worker that verifies a known secret.

Deploy it:

```bash
npm run example:deploy
```

Test it:

```bash
npm run example:test-live -- https://<example-worker>.workers.dev hello-from-cloudflare
```

Clean it up when finished:

```bash
npm run example:delete-live-test
npm run example:delete-worker
```

## Next Steps

After the first deploy:

- Replace `src/index.js` with your real Worker code.
- Add only the secret names your Worker actually needs.
- Add only public, non-sensitive variables to `*.vars.env`.
- Decide who can edit env files and who can deploy.
- Read `docs/security.md` before using this in production.
