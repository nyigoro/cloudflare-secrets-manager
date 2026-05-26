# Troubleshooting Guide

This guide lists common problems and the fastest checks for each one.

## First Checks

Run these from the project root:

```bash
git status --short --branch
git status --ignored --short
npm install
npx wrangler whoami
npm run deploy:dry-run
```

These commands answer most setup questions:

- Are you in the right repo?
- Are secret files ignored?
- Are dependencies installed?
- Is Wrangler authenticated?
- Does Wrangler accept the deploy config?

## `wrangler` Is Not Found

Symptom:

```text
wrangler is not installed
```

Fix:

```bash
npm install
npx wrangler --version
```

The helper scripts use global `wrangler` if available. If not, they fall back to `npx wrangler`.

## Not Logged In To Cloudflare

Symptom:

```text
You need to login
```

Fix:

```bash
npx wrangler login
npx wrangler whoami
```

If browser login is not possible, configure a Cloudflare API token in your shell according to Wrangler's authentication model.

## Env File Not Found

Symptom:

```text
ERROR: production.env not found. Create it first using the env template.
```

Fix:

```bash
New-Item production.env
```

Or on Bash:

```bash
touch production.env
```

Then add secrets:

```env
MY_SECRET_KEY=replace-me
DATABASE_URL=replace-me
JWT_SECRET=replace-me
```

For staging, create `staging.env`.

## Variables File Not Found

Symptom:

```text
No vars file found at production.vars.env.
```

This is not fatal. Deploys continue without extra plain-text variables.

Fix, if you want variables:

```bash
cp production.vars.env.example production.vars.env
```

On PowerShell:

```powershell
Copy-Item production.vars.env.example production.vars.env
```

## Bash Script Fails On Windows

Symptom:

```text
'bash' is not recognized
```

Fix options:

- Use Git Bash.
- Use WSL.
- Run the underlying npm scripts that do not require Bash.
- Run the Node helpers directly.

Examples:

```bash
node scripts/show-vars.mjs --vars-file production.vars.env
node scripts/deploy-with-vars.mjs --vars-file production.vars.env --dry-run
```

## Wrong Worker Is Deployed

Check `wrangler.toml`:

```toml
name = "your-production-worker"

[env.staging]
name = "your-staging-worker"
```

Production deploy:

```bash
npm run deploy
```

Staging deploy:

```bash
npm run deploy:staging
```

If you pass `--config`, verify the path points at the config you intend to use.

## Staging Secrets Uploaded To Production

This usually means the `--env staging` flag was missing.

Use:

```bash
npm run sync-secrets:staging
```

Or:

```bash
bash manage-secrets.sh sync --env staging --env-file staging.env
```

Then list staging secrets:

```bash
npm run list-secrets:staging
```

## Secret Exists But Worker Cannot Read It

Check:

1. The secret name in your env file exactly matches the name used in Worker code.
2. You uploaded to the same environment you deployed.
3. You redeployed after changing code that reads the secret.
4. The Worker is using the expected `wrangler.toml`.

List secrets:

```bash
npm run list-secrets
npm run list-secrets:staging
```

The list shows names only, not values.

## Variable Exists Locally But Worker Shows Old Value

Variables from `*.vars.env` are passed during deploy. Run a new deploy after editing variables:

```bash
npm run deploy
```

For staging:

```bash
npm run deploy:staging
```

Preview first:

```bash
npm run show-vars
```

## `deploy-with-vars.mjs` Reports Unknown Argument

The wrapper has its own options. Extra Wrangler deploy flags must come after `--`.

Correct:

```bash
node scripts/deploy-with-vars.mjs --vars-file production.vars.env -- --minify
```

Incorrect:

```bash
node scripts/deploy-with-vars.mjs --vars-file production.vars.env --minify
```

## `npm publish` Requires OTP

Symptom:

```text
This operation requires a one-time password.
```

Your npm account has two-factor authentication enabled. Complete browser authentication or provide a valid OTP:

```bash
npm publish --registry=https://registry.npmjs.org --otp=<code>
```

If you cannot access your authenticator, use npm recovery codes or npm account recovery.

## Package Does Not Include A File

Check `package.json`:

```json
"files": [
  "README.md",
  "docs/",
  "example/",
  "manage-secrets.sh",
  "production.vars.env.example",
  "rotate-secrets.sh",
  "scripts/",
  "src/",
  "staging.vars.env.example",
  "wrangler.toml"
]
```

Then run:

```bash
npm pack --dry-run
```

Only add files that are safe for public release.

## Package Includes Something Sensitive

Stop before publishing.

Check `.gitignore`, `package.json` `files`, and the `npm pack --dry-run` output.

Remove sensitive files from the package list and rotate any exposed values if they were published.

## GitHub Shows No License

GitHub detects licenses from a root `LICENSE` file. This repository uses MIT:

```text
LICENSE
```

If GitHub has not updated yet, wait a few minutes and refresh the repository page.

## npm Shows Old Metadata

npm package metadata is tied to published versions. If you add docs or a license after publishing `2.0.2`, you must publish a new version such as `2.0.3`.

Check the latest npm version:

```bash
npm view cloudflare-secrets-manager version license --registry=https://registry.npmjs.org
```

## Live Example Fails

Redeploy the example:

```bash
npm run example:deploy
```

Run the check:

```bash
npm run example:test-live -- https://<example-worker>.workers.dev hello-from-cloudflare
```

If it still fails:

- Confirm `example/wrangler.toml` has the Worker name you deployed.
- Confirm `LIVE_TEST_SECRET` exists with `npm run example:list`.
- Confirm the URL passed to `example:test-live` is the example Worker URL.
- Delete and redeploy the example Worker if needed.
