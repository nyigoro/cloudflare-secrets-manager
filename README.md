# Cloudflare Secrets Manager

Cloudflare Secrets Manager is a small, scriptable toolkit for managing Cloudflare Workers secrets and deploy-time variables without using the Cloudflare dashboard for every change.

It gives you a repeatable workflow for:

- Uploading encrypted Worker secrets from local env files.
- Keeping production and staging secret sets separate.
- Previewing plain-text deploy-time variables before deploys.
- Deploying Workers with variables applied through Wrangler.
- Rotating secrets with a local backup of the previous secret listing.
- Running a live example Worker to verify that secret injection works.

The project is intentionally simple: it wraps Wrangler, keeps the behavior visible, and avoids hiding Cloudflare's underlying model.

## Contents

- [When To Use This](#when-to-use-this)
- [Install And Setup](#install-and-setup)
- [Secrets And Variables](#secrets-and-variables)
- [Quick Start](#quick-start)
- [Common Workflows](#common-workflows)
- [Templates](#templates)
- [Command Reference](#command-reference)
- [Project Layout](#project-layout)
- [Documentation](#documentation)
- [Security Notes](#security-notes)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## When To Use This

Use this project when you want a checked-in, repeatable workflow around Cloudflare Workers configuration.

It is useful for:

- Teams that want the same commands for local, staging, and production deployments.
- Projects that need many Cloudflare secrets and do not want to enter them one by one.
- Workers that use both encrypted secrets and non-secret config values.
- Developers who want an auditable rotation process.
- Starter Workers that need a known-good secret and variable setup.

This project is not a hosted secret manager and it does not store secret values remotely. Secret values remain in your local ignored env files until you upload them to Cloudflare with Wrangler.

## Install And Setup

### Recommended: clone the repository

This project works best as a repository or template because it contains scripts, example config files, and a starter Worker:

```bash
git clone https://github.com/nyigoro/cloudflare-secrets-manager.git
cd cloudflare-secrets-manager
npm install
npx wrangler login
```

### Install from npm

The package is also published on npm:

```bash
npm install cloudflare-secrets-manager
```

The npm package is most useful as a distributable copy of the scripts and examples. For day-to-day use, cloning the repository is usually more convenient because the npm scripts in `package.json` assume you are working from the project root.

### Requirements

- Node.js with `node` and `npm` available.
- Wrangler installed locally through `npm install`, or available globally as `wrangler`.
- A Cloudflare account with access to the target Worker or Pages project.
- A configured `wrangler.toml`, `wrangler.json`, or `wrangler.jsonc`.
- Bash for the shell helper scripts. On Windows, use Git Bash, WSL, or another Bash-compatible shell for `manage-secrets.sh` and `rotate-secrets.sh`.

## Secrets And Variables

Cloudflare Workers expose configuration to Worker code through the `env` object, but not every value should be managed the same way.

| Type | Stored in this project | Uploaded with | Visible in dashboard/API | Intended for |
|---|---|---|---|---|
| Secret | `production.env`, `staging.env` | `wrangler secret bulk` | Secret names only | Tokens, API keys, database URLs, JWT secrets |
| Variable | `production.vars.env`, `staging.vars.env` | `wrangler deploy --var KEY:VALUE` | Values are plain text | Public URLs, feature flags, environment names |

Use secrets for anything private. Use variables only for configuration that can safely be visible to operators and potentially returned by your Worker if your code exposes it.

## Quick Start

### 1. Install dependencies and log in

```bash
npm install
npx wrangler login
```

### 2. Configure your Worker name

Edit `wrangler.toml`:

```toml
name = "your-worker-name"
main = "src/index.js"
compatibility_date = "2026-04-23"

[vars]
ENVIRONMENT = "production"

[env.staging]
name = "your-worker-name-staging"

[env.staging.vars]
ENVIRONMENT = "staging"
```

### 3. Create secret files

Copy the production template:

```bash
cp production.env.example production.env
```

Then replace the placeholders:

```env
MY_SECRET_KEY=replace-with-a-real-secret
DATABASE_URL=postgres://app_user:replace_with_db_secret@host:5432/database
JWT_SECRET=replace-with-a-long-random-value
```

Copy the staging template:

```bash
cp staging.env.example staging.env
```

Then replace the placeholders:

```env
MY_SECRET_KEY=replace-with-a-staging-secret
DATABASE_URL=postgres://app_user:replace_with_db_secret@staging-host:5432/database
JWT_SECRET=replace-with-a-different-long-random-value
```

These files are ignored by git.

### 4. Create variable files

Copy the examples:

```bash
cp production.vars.env.example production.vars.env
cp staging.vars.env.example staging.vars.env
```

Example variable file:

```env
PUBLIC_APP_NAME=My Production Worker
PUBLIC_API_BASE_URL=https://api.example.com
FEATURE_SIGNUPS_ENABLED=true
```

### 5. Preview variables

```bash
npm run show-vars
npm run show-vars:staging
```

### 6. Dry-run deploys

```bash
npm run deploy:dry-run
npm run deploy:dry-run:staging
```

### 7. Upload secrets and deploy

Production:

```bash
npm run deploy
```

Staging:

```bash
npm run deploy:staging
```

## Common Workflows

### Sync production secrets only

```bash
npm run sync-secrets
```

This uploads values from `production.env` to the default Worker configured in `wrangler.toml`.

### Sync staging secrets only

```bash
npm run sync-secrets:staging
```

This uploads values from `staging.env` to the `staging` Wrangler environment.

### Preview deploy-time variables

```bash
npm run show-vars
```

This prints the variables that would be applied from `production.vars.env`.

### Deploy without uploading secrets

```bash
npm run deploy:dry-run
```

This runs the deploy wrapper with `--dry-run`. It is useful before a real release because it shows whether Wrangler accepts the target config and variables.

### Deploy with extra Wrangler flags

Pass additional Wrangler deploy arguments after `--`:

```bash
node scripts/deploy-with-vars.mjs --vars-file production.vars.env -- --minify
```

### Use a custom Wrangler config

```bash
bash manage-secrets.sh deploy --config path/to/wrangler.toml --env-file production.env --vars-file production.vars.env
```

### Rotate production Worker secrets

```bash
npm run rotate
```

The rotation helper:

1. Saves the current secret listing to `.secret-backups/`.
2. Shows which keys will be uploaded from the env file.
3. Requires you to type `yes`.
4. Uploads the new values.
5. Lists the resulting secret names.

## Templates

The repository includes a reusable template catalog in `templates/`:

| Path | Purpose |
|---|---|
| `production.env.example` | Root production secret template |
| `staging.env.example` | Root staging secret template |
| `templates/secrets/` | Minimal, API, and database secret templates |
| `templates/variables/` | Minimal, web API, and feature flag variable templates |
| `templates/wrangler/` | Basic, production/staging, and cron Worker configs |
| `templates/workers/` | Starter Worker implementations |
| `templates/github-actions/` | GitHub Actions deploy workflow template |

Common copies:

```bash
cp templates/secrets/api-worker.env.example production.env
cp templates/variables/web-api.vars.env.example production.vars.env
cp templates/wrangler/production-staging.toml wrangler.toml
cp templates/workers/health-config-worker.js src/index.js
```

See [Template Catalog](templates/README.md) and [Template Guide](docs/templates.md) for details.

## Command Reference

| Command | What it does |
|---|---|
| `npm run sync-secrets` | Upload `production.env` secrets to the default Worker |
| `npm run sync-secrets:staging` | Upload `staging.env` secrets to the staging Worker |
| `npm run sync-secrets:pages` | Upload production secrets to Cloudflare Pages |
| `npm run show-vars` | Print variables from `production.vars.env` |
| `npm run show-vars:staging` | Print variables from `staging.vars.env` |
| `npm run list-secrets` | List production Worker secret names |
| `npm run list-secrets:staging` | List staging Worker secret names |
| `npm run list-secrets:pages` | List Cloudflare Pages secret names |
| `npm run delete-secret -- KEY_NAME` | Delete one production Worker secret |
| `npm run delete-secret:staging -- KEY_NAME` | Delete one staging Worker secret |
| `npm run rotate` | Back up and rotate production Worker secrets |
| `npm run rotate:staging` | Back up and rotate staging Worker secrets |
| `npm run rotate:pages` | Back up and rotate production Pages secrets |
| `npm run deploy:dry-run` | Dry-run production deploy with variables |
| `npm run deploy:dry-run:staging` | Dry-run staging deploy with variables |
| `npm run deploy` | Sync production secrets, then deploy with production variables |
| `npm run deploy:staging` | Sync staging secrets, then deploy with staging variables |
| `npm run example:sync` | Upload the throwaway live-test secret |
| `npm run example:list` | List example Worker secret names |
| `npm run example:deploy` | Sync and deploy the live example Worker |
| `npm run example:test-live -- <url> <expected>` | Verify the example Worker's runtime secret |
| `npm run example:delete-live-test` | Delete the example live-test secret |
| `npm run example:delete-worker` | Delete the example Worker |

## Project Layout

```text
cloudflare-secrets-manager/
|-- docs/
|   |-- configuration.md
|   |-- getting-started.md
|   |-- publishing.md
|   |-- security.md
|   |-- templates.md
|   `-- troubleshooting.md
|-- example/
|   |-- live-test.env.example
|   |-- live-test.mjs
|   |-- live-test.sh
|   |-- README.md
|   |-- src/index.mjs
|   `-- wrangler.toml
|-- scripts/
|   |-- deploy-with-vars.mjs
|   `-- show-vars.mjs
|-- src/index.js
|-- templates/
|-- LICENSE
|-- manage-secrets.sh
|-- package.json
|-- production.env.example
|-- production.vars.env.example
|-- rotate-secrets.sh
|-- staging.env.example
|-- staging.vars.env.example
|-- wrangler.toml
`-- README.md
```

## Documentation

Read the detailed guides:

- [Getting Started](docs/getting-started.md)
- [Configuration Guide](docs/configuration.md)
- [Publishing And Release Guide](docs/publishing.md)
- [Security Guide](docs/security.md)
- [Template Guide](docs/templates.md)
- [Troubleshooting Guide](docs/troubleshooting.md)
- [Live Example Worker](example/README.md)

## Security Notes

- Never commit `production.env`, `staging.env`, `.dev.vars`, or any other file containing real secrets.
- Do not put private values in `*.vars.env` files.
- Review `git status --ignored --short` before publishing or creating releases.
- Treat `.secret-backups/` as sensitive operational history even though it stores secret names, not values.
- Rotate secrets immediately if an env file is accidentally committed, pasted into a ticket, or shared in chat.

See [Security Guide](docs/security.md) for the detailed model and incident checklist.

## Troubleshooting

Start with:

```bash
npm install
npx wrangler whoami
git status --ignored --short
npm run deploy:dry-run
```

See [Troubleshooting Guide](docs/troubleshooting.md) for common Wrangler, npm, shell, and Cloudflare errors.

## License

MIT. See [LICENSE](LICENSE).
