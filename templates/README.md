# Template Catalog

This directory contains copy-ready templates for common Cloudflare Workers secret-management setups.

All values are placeholders. Replace them before deploying.

## Quick Copies

Production secrets:

```bash
cp templates/secrets/api-worker.env.example production.env
```

Staging secrets:

```bash
cp templates/secrets/api-worker.env.example staging.env
```

Production plaintext variables:

```bash
cp templates/variables/web-api.vars.env.example production.vars.env
```

Staging plaintext variables:

```bash
cp templates/variables/web-api.vars.env.example staging.vars.env
```

Worker config:

```bash
cp templates/wrangler/production-staging.toml wrangler.toml
```

Worker code:

```bash
cp templates/workers/health-config-worker.js src/index.js
```

## Directories

| Directory | Purpose |
|---|---|
| `secrets/` | Env-file templates for encrypted Cloudflare secrets |
| `variables/` | Env-file templates for deploy-time plaintext variables |
| `wrangler/` | Wrangler config templates |
| `workers/` | Worker entry-point templates |
| `github-actions/` | CI deployment workflow templates |

## Safety Rules

- Do not put real secrets in files under `templates/`.
- Copy templates to environment-specific files before editing.
- Keep `production.env`, `staging.env`, and `.dev.vars` ignored.
- Run `npm pack --dry-run` before publishing.
