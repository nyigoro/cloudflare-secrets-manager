# Cloudflare Secrets Manager

Manage Cloudflare Workers secrets and deploy-time variables across production, staging, and live-test environments without touching the dashboard.

---

## Secrets vs Variables

- Secrets are encrypted and uploaded with `wrangler secret bulk`.
- Variables are plain-text bindings and are applied during `wrangler deploy`.

This project supports both:

- `production.env` and `staging.env` for secrets
- `production.vars.env` and `staging.vars.env` for plain-text variables

If you want a starting point for variables, use:

- `production.vars.env.example`
- `staging.vars.env.example`

---

## Quick Start

### 1. Install dependencies and log in
```bash
npm install
npx wrangler login
```

### 2. Set your Worker name

Edit [`wrangler.toml`](wrangler.toml) and change `name = "my-worker"` to your real Worker name.

### 3. Add your secrets

Use the included templates:

- `production.env` for production secrets
- `staging.env` for staging secrets

### 4. Add your variables

Create these optional plain-text variable files if you need non-secret config:

- `production.vars.env`
- `staging.vars.env`

The repo includes example templates:

- `production.vars.env.example`
- `staging.vars.env.example`

### 5. Preview variables and deploy
```bash
npm run show-vars
npm run deploy:dry-run
npm run deploy
```

For staging:

```bash
npm run show-vars:staging
npm run deploy:dry-run:staging
npm run deploy:staging
```

### 6. Run the included live example
```bash
npm run example:deploy
npm run example:test-live -- https://<your-worker>.workers.dev hello-from-cloudflare
```

The example uses the throwaway secret in `example/live-test.env.example`.

The starter Worker in `src/index.js` now includes:

- `/health` for a safe secret-presence check
- `/config` for non-secret runtime config
- `/features` for parsed feature flags

---

## Commands

| Command | What it does |
|---|---|
| `npm run sync-secrets` | Push `production.env` secrets to the default Worker |
| `npm run sync-secrets:staging` | Push `staging.env` secrets to the staging Worker |
| `npm run sync-secrets:pages` | Push production secrets to Cloudflare Pages |
| `npm run show-vars` | Show the variables that would be applied from `production.vars.env` |
| `npm run show-vars:staging` | Show the variables that would be applied from `staging.vars.env` |
| `npm run list-secrets` | List production secret names |
| `npm run list-secrets:staging` | List staging secret names |
| `npm run list-secrets:pages` | List Pages secret names |
| `npm run delete-secret -- KEY_NAME` | Delete one production secret |
| `npm run delete-secret:staging -- KEY_NAME` | Delete one staging secret |
| `npm run rotate` | Back up and rotate production Worker secrets |
| `npm run rotate:staging` | Back up and rotate staging Worker secrets |
| `npm run rotate:pages` | Back up and rotate production Pages secrets |
| `npm run deploy:dry-run` | Dry-run a production deploy with variables, without uploading secrets |
| `npm run deploy:dry-run:staging` | Dry-run a staging deploy with variables, without uploading secrets |
| `npm run deploy` | Sync production secrets and deploy with variables from `production.vars.env` if present |
| `npm run deploy:staging` | Sync staging secrets and deploy with variables from `staging.vars.env` if present |
| `npm run example:sync` | Push the throwaway live-test secret to the example Worker |
| `npm run example:list` | List secret names on the example Worker |
| `npm run example:deploy` | Deploy the example Worker |
| `npm run example:test-live -- <url> <expected>` | Verify the example Worker's runtime secret |
| `npm run example:delete-live-test` | Remove the example Worker's throwaway secret |
| `npm run example:delete-worker` | Delete the example Worker entirely |

---

## Helper Scripts

### `manage-secrets.sh`

The main helper now supports variables too:

```bash
bash manage-secrets.sh vars
bash manage-secrets.sh sync --env staging --env-file staging.env
bash manage-secrets.sh deploy --env staging --env-file staging.env --vars-file staging.vars.env
bash manage-secrets.sh delete MY_SECRET_KEY --config path/to/wrangler.toml
```

### `rotate-secrets.sh`

Rotation backs up the current secret listing into `.secret-backups/`, uploads the new values, and verifies the result:

```bash
bash rotate-secrets.sh production workers
bash rotate-secrets.sh staging workers
bash rotate-secrets.sh production pages
```

---

## Included Files

```text
cloudflare-secrets-manager/
|-- example/
|   |-- live-test.env.example <- Throwaway secret for the live example
|   |-- live-test.mjs         <- Cross-platform runtime verifier
|   |-- live-test.sh          <- Bash runtime verifier
|   |-- README.md             <- Example deployment guide
|   |-- src/index.mjs         <- Example Worker code
|   `-- wrangler.toml         <- Example Worker config
|-- scripts/
|   |-- deploy-with-vars.mjs  <- Deploy wrapper that applies Worker variables
|   `-- show-vars.mjs         <- Local variable preview helper
|-- src/index.js              <- Starter Worker for your real project
|-- production.env            <- Production secret template
|-- staging.env               <- Staging secret template
|-- production.vars.env.example <- Example production variables
|-- staging.vars.env.example  <- Example staging variables
|-- wrangler.toml             <- Multi-environment Worker config
|-- manage-secrets.sh         <- Secret sync/list/delete/deploy helper
|-- rotate-secrets.sh         <- Rotation helper with backups
|-- package.json              <- npm shortcuts
`-- README.md                 <- This file
```

---

## Security Rules

1. Never put sensitive values in `*.vars.env`. Use secrets for anything private.
2. Real secret files like `production.env`, `staging.env`, and `.dev.vars` stay ignored.
3. Variables are plain text and can be returned by your Worker if your code exposes them.
4. Delete throwaway example secrets or the example Worker when you are done.
