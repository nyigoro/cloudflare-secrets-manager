# Configuration Guide

This guide explains every moving part in the repository: Wrangler config, secret files, variable files, helper scripts, and deployment behavior.

## Wrangler Configuration

The root `wrangler.toml` controls which Worker is deployed.

```toml
name = "nyigoro-secrets-manager"
main = "src/index.js"
compatibility_date = "2026-04-23"

[vars]
ENVIRONMENT = "production"

[env.staging]
name = "nyigoro-secrets-manager-staging"

[env.staging.vars]
ENVIRONMENT = "staging"
```

### `name`

The Worker name in Cloudflare. Change this before deploying your own Worker.

Production:

```toml
name = "my-worker"
```

Staging:

```toml
[env.staging]
name = "my-worker-staging"
```

### `main`

The Worker entry point:

```toml
main = "src/index.js"
```

If you move your Worker code, update this path.

### `compatibility_date`

The Cloudflare Workers compatibility date. Keep it current for new projects, but update deliberately for production Workers because compatibility changes can affect runtime behavior.

### `[vars]`

Variables declared directly in `wrangler.toml` are plain text. The deploy wrapper in this project can also pass variables from `*.vars.env` using `wrangler deploy --var`.

Use `wrangler.toml` vars for stable, non-secret values that rarely change. Use `*.vars.env` files for environment-specific values you want to manage alongside deploys.

## Secret Files

Default files:

| File | Environment | Purpose |
|---|---|---|
| `production.env` | Production | Encrypted Worker secrets |
| `staging.env` | Staging | Encrypted Worker secrets |
| `production.env.example` | Production template | Safe example secret names |
| `staging.env.example` | Staging template | Safe example secret names |

Example:

```env
MY_SECRET_KEY=replace-me
DATABASE_URL=postgres://app_user:replace_with_db_secret@host:5432/database
JWT_SECRET=replace-me
```

Secret files are consumed by:

```bash
wrangler secret bulk production.env
wrangler secret bulk staging.env --env staging
```

The helper scripts wrap those commands.

### Secret File Rules

- Use `KEY=value` lines.
- Keep one secret per line.
- Do not quote values unless the value itself needs quotes.
- Avoid comments on the same line as a value.
- Do not commit real secret files.
- Use different values for staging and production.

## Variable Files

Default files:

| File | Environment | Purpose |
|---|---|---|
| `production.vars.env` | Production | Plain-text deploy variables |
| `staging.vars.env` | Staging | Plain-text deploy variables |
| `production.vars.env.example` | Production template | Safe example values |
| `staging.vars.env.example` | Staging template | Safe example values |

Example:

```env
PUBLIC_APP_NAME=My Production Worker
PUBLIC_API_BASE_URL=https://api.example.com
FEATURE_SIGNUPS_ENABLED=true
```

Variable files are parsed with Node's `parseEnv` helper, then passed to Wrangler as:

```bash
wrangler deploy --var KEY:VALUE
```

### Variable File Rules

- Treat values as public operational config.
- Never store tokens, passwords, database credentials, or signing keys in variable files.
- Use strings for all values.
- Parse booleans in Worker code if needed.
- Preview before deploy with `npm run show-vars`.

## `manage-secrets.sh`

`manage-secrets.sh` is the main Bash helper.

Usage:

```bash
bash manage-secrets.sh <command> [options]
```

Commands:

| Command | Description |
|---|---|
| `sync` | Upload all secrets from an env file |
| `vars` | Show deploy-time variables from a vars file |
| `list` | List secret names currently stored for the Worker |
| `delete <KEY>` | Delete one secret by name |
| `deploy` | Sync secrets, apply variables, then deploy |
| `help` | Print help |

Options:

| Option | Description |
|---|---|
| `--config FILE` | Use a specific Wrangler config |
| `--env NAME` | Target a Wrangler environment, such as `staging` |
| `--env-file FILE` | Read secrets from a specific env file |
| `--vars-file FILE` | Read variables from a specific vars file |

Examples:

```bash
bash manage-secrets.sh sync
bash manage-secrets.sh vars --vars-file production.vars.env
bash manage-secrets.sh list --env staging
bash manage-secrets.sh delete MY_SECRET_KEY
bash manage-secrets.sh deploy --env staging --env-file staging.env --vars-file staging.vars.env
bash manage-secrets.sh deploy --config example/wrangler.toml --env-file example/live-test.env.example
```

### Inferred Variable Files

If `--vars-file` is omitted, `manage-secrets.sh` infers a vars file from the env file name:

| Env file | Inferred vars file |
|---|---|
| `production.env` | `production.vars.env` |
| `staging.env` | `staging.vars.env` |
| `example.env` | `example.vars.env` |
| `example.env.example` | `example.vars.env.example` |

If the inferred vars file does not exist, deploys continue without extra variables.

## `scripts/show-vars.mjs`

Prints parsed variables from a vars file:

```bash
node scripts/show-vars.mjs --vars-file production.vars.env
```

Behavior:

- Fails if `--vars-file` is missing.
- Exits successfully if the vars file does not exist.
- Prints `(none)` if the file exists but has no variables.
- Prints values, so do not point it at secret files.

## `scripts/deploy-with-vars.mjs`

Deploys a Worker with variables from an env-style file.

Basic usage:

```bash
node scripts/deploy-with-vars.mjs --vars-file production.vars.env
```

When `--env` is omitted, the wrapper passes `--env ""` to Wrangler. That explicitly targets the top-level production Worker and avoids Wrangler's warning when `wrangler.toml` also contains named environments such as `staging`.

Staging:

```bash
node scripts/deploy-with-vars.mjs --env staging --vars-file staging.vars.env
```

Custom config:

```bash
node scripts/deploy-with-vars.mjs --config example/wrangler.toml --vars-file production.vars.env
```

Dry run:

```bash
node scripts/deploy-with-vars.mjs --dry-run --vars-file production.vars.env
```

Keep existing deploy variables:

```bash
node scripts/deploy-with-vars.mjs --keep-vars --vars-file production.vars.env
```

Pass through extra Wrangler deploy flags:

```bash
node scripts/deploy-with-vars.mjs --vars-file production.vars.env -- --minify
```

Options:

| Option | Description |
|---|---|
| `--config FILE` | Pass `--config FILE` to Wrangler |
| `--env NAME` | Pass `--env NAME` to Wrangler. Omit it for the top-level production Worker |
| `--vars-file FILE` | Load plain-text variables from a file |
| `--keep-vars` | Pass `--keep-vars` to Wrangler |
| `--dry-run` | Pass `--dry-run` to Wrangler |
| `--` | Everything after this is passed to `wrangler deploy` |

## `rotate-secrets.sh`

Rotates secrets by uploading the current env file after saving a listing of existing secret names.

Usage:

```bash
bash rotate-secrets.sh <environment> <target> [config-file]
```

Arguments:

| Argument | Values | Default |
|---|---|---|
| `environment` | `production`, `staging` | `production` |
| `target` | `workers`, `pages` | `workers` |
| `config-file` | Path to Wrangler config | empty |

Examples:

```bash
bash rotate-secrets.sh production workers
bash rotate-secrets.sh staging workers
bash rotate-secrets.sh production pages
bash rotate-secrets.sh production workers example/wrangler.toml
```

Backups are written to:

```text
.secret-backups/secret-list_<environment>_<target>_<timestamp>.txt
```

The backup contains the previous secret listing from Cloudflare, not the secret values.

## Cloudflare Pages

This project includes npm shortcuts for Cloudflare Pages secrets:

```bash
npm run sync-secrets:pages
npm run list-secrets:pages
npm run rotate:pages
```

Pages commands use `wrangler pages secret ...`. Pages and Workers have different deployment models, so use the Pages commands only for Pages projects.

## Starter Worker

The root Worker in `src/index.js` is a template with four endpoints:

| Path | Description |
|---|---|
| `/` | Basic service response and route list |
| `/health` | Environment and secret-presence check |
| `/config` | Public config values |
| `/features` | Parsed feature flags |

It reads:

- `MY_SECRET_KEY`
- `DATABASE_URL`
- `JWT_SECRET`
- `PUBLIC_APP_NAME`
- `PUBLIC_API_BASE_URL`
- `ENVIRONMENT`
- `FEATURE_SIGNUPS_ENABLED`

Replace `src/index.js` with your actual Worker logic when you are ready.

## Live Example Worker

The `example/` Worker proves that secret upload and runtime access work.

It uses:

```env
LIVE_TEST_SECRET=hello-from-cloudflare
```

Deploy:

```bash
npm run example:deploy
```

Test:

```bash
npm run example:test-live -- https://<example-worker>.workers.dev hello-from-cloudflare
```

Read `example/README.md` for the complete walkthrough.

## Templates

The `templates/` directory provides reusable starting points for:

- Secret env files.
- Plain-text variable files.
- Wrangler configs.
- Worker entry points.
- GitHub Actions deployment.

Use them when starting a new Worker or when adapting this repository to an existing Worker:

```bash
cp templates/wrangler/production-staging.toml wrangler.toml
cp templates/workers/health-config-worker.js src/index.js
cp templates/secrets/api-worker.env.example production.env
cp templates/variables/web-api.vars.env.example production.vars.env
```

Read `docs/templates.md` for the full template catalog.
