# Template Guide

The `templates/` directory contains reusable starting points for Workers that need Cloudflare secrets, plaintext variables, and predictable deployment commands.

All template values are placeholders. Copy a template to the project root before editing it.

## Template Types

| Type | Directory | Use for |
|---|---|---|
| Secrets | `templates/secrets/` | Encrypted values uploaded with `wrangler secret bulk` |
| Plaintext variables | `templates/variables/` | Values passed during deploy and shown as `Plaintext` in Cloudflare |
| Wrangler configs | `templates/wrangler/` | Worker deployment configuration |
| Worker code | `templates/workers/` | Starter Worker entry points |
| GitHub Actions | `templates/github-actions/` | CI deployment workflows |

## Root Templates

The root includes two safe secret templates:

```text
production.env.example
staging.env.example
```

Use them for the default project workflow:

```bash
cp production.env.example production.env
cp staging.env.example staging.env
```

On PowerShell:

```powershell
Copy-Item production.env.example production.env
Copy-Item staging.env.example staging.env
```

Then replace every placeholder value.

## Secret Templates

### Minimal

File:

```text
templates/secrets/minimal.env.example
```

Use this when a Worker needs only one secret:

```bash
cp templates/secrets/minimal.env.example production.env
```

### API Worker

File:

```text
templates/secrets/api-worker.env.example
```

Includes:

- `API_TOKEN`
- `WEBHOOK_SIGNING_SECRET`
- `JWT_SECRET`

Use this for Workers that call third-party APIs, validate webhooks, or issue signed tokens.

### Database Worker

File:

```text
templates/secrets/database-worker.env.example
```

Includes:

- `DATABASE_URL`
- `DATABASE_READONLY_URL`
- `JWT_SECRET`
- `MIGRATION_TOKEN`

Use this when the Worker talks to a database or an API that proxies database access.

## Variable Templates

### Minimal Plaintext Variables

File:

```text
templates/variables/minimal.vars.env.example
```

Includes:

- `PUBLIC_APP_NAME`
- `ENVIRONMENT`

### Web API Plaintext Variables

File:

```text
templates/variables/web-api.vars.env.example
```

Includes public app metadata and a public API base URL.

Copy to production:

```bash
cp templates/variables/web-api.vars.env.example production.vars.env
```

Copy to staging:

```bash
cp templates/variables/web-api.vars.env.example staging.vars.env
```

Then change `ENVIRONMENT`, URLs, and feature values.

### Feature Flags

File:

```text
templates/variables/feature-flags.vars.env.example
```

Use this when feature flags are simple booleans that can be visible as plaintext Worker bindings.

Private rollout rules, private customer lists, or entitlement tokens should be secrets, not plaintext variables.

## Wrangler Templates

### Basic Worker

File:

```text
templates/wrangler/basic-worker.toml
```

Use this for a single-environment Worker:

```bash
cp templates/wrangler/basic-worker.toml wrangler.toml
```

### Production And Staging

File:

```text
templates/wrangler/production-staging.toml
```

Use this for the default project workflow:

```bash
cp templates/wrangler/production-staging.toml wrangler.toml
```

Then set:

- Production `name`
- Staging `env.staging.name`
- `compatibility_date`
- Worker `main` path if different

### Cron Worker

File:

```text
templates/wrangler/cron-worker.toml
```

Use this for a scheduled Worker:

```bash
cp templates/wrangler/cron-worker.toml wrangler.toml
```

Change the cron expression:

```toml
[triggers]
crons = ["*/15 * * * *"]
```

## Worker Code Templates

### Basic API Worker

File:

```text
templates/workers/basic-api-worker.js
```

Includes:

- `/health`
- `/proxy`
- Required-secret validation
- Example upstream API call with `API_TOKEN`

Copy it:

```bash
cp templates/workers/basic-api-worker.js src/index.js
```

### Health And Config Worker

File:

```text
templates/workers/health-config-worker.js
```

Includes:

- `/health`
- `/config`
- Secret-presence checks
- Feature flag parsing

This is the safest starting point for most projects because it verifies configuration without returning secret values.

### Scheduled Worker

File:

```text
templates/workers/scheduled-worker.js
```

Includes:

- A normal `fetch` handler for health/status checks.
- A `scheduled` handler for cron events.
- An example authenticated API call.

Pair it with:

```bash
cp templates/wrangler/cron-worker.toml wrangler.toml
cp templates/workers/scheduled-worker.js src/index.js
```

## GitHub Actions Template

File:

```text
templates/github-actions/deploy-worker.yml
```

This workflow:

1. Checks out the repository.
2. Installs Node dependencies.
3. Writes `production.env` from GitHub Actions secrets.
4. Runs `npm run deploy`.
5. Deletes the generated env file.

To use it:

```bash
mkdir -p .github/workflows
cp templates/github-actions/deploy-worker.yml .github/workflows/deploy-worker.yml
```

Configure these GitHub Actions secrets:

- `CLOUDFLARE_API_TOKEN`
- `MY_SECRET_KEY`
- `DATABASE_URL`
- `JWT_SECRET`
- `API_TOKEN`

Use a scoped Cloudflare API token with only the permissions needed to deploy the Worker.

## Recommended Starting Points

### Simple Worker

```bash
cp templates/wrangler/basic-worker.toml wrangler.toml
cp templates/workers/health-config-worker.js src/index.js
cp templates/secrets/minimal.env.example production.env
cp templates/variables/minimal.vars.env.example production.vars.env
```

### API Worker With Staging

```bash
cp templates/wrangler/production-staging.toml wrangler.toml
cp templates/workers/basic-api-worker.js src/index.js
cp templates/secrets/api-worker.env.example production.env
cp templates/secrets/api-worker.env.example staging.env
cp templates/variables/web-api.vars.env.example production.vars.env
cp templates/variables/web-api.vars.env.example staging.vars.env
```

### Scheduled Worker

```bash
cp templates/wrangler/cron-worker.toml wrangler.toml
cp templates/workers/scheduled-worker.js src/index.js
cp templates/secrets/api-worker.env.example production.env
cp templates/variables/minimal.vars.env.example production.vars.env
```

## Validation

After copying templates:

```bash
npm run show-vars
npm run deploy:dry-run
```

Then upload secrets and deploy:

```bash
npm run deploy
```

For staging:

```bash
npm run show-vars:staging
npm run deploy:dry-run:staging
npm run deploy:staging
```
