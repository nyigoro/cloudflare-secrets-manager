# Security Guide

This project is designed to make Cloudflare secret operations repeatable. It does not remove the need for careful secret handling.

## Security Model

Cloudflare Secrets Manager separates configuration into two categories:

- Secrets, which are uploaded to Cloudflare with `wrangler secret bulk`.
- Variables, which are plain-text values passed during deploy with `wrangler deploy --var`.

The repository stores templates and scripts. It should not store real secret values.

## Files That Must Stay Private

Never commit these files with real values:

```text
production.env
staging.env
*.env
.dev.vars
.secret-backups/
```

The `.gitignore` is configured to ignore them, but still check before committing:

```bash
git status --ignored --short
```

If you see real secret files under normal untracked files instead of ignored files, stop and fix `.gitignore` before committing.

## Secrets vs Variables

Use a secret for:

- API tokens.
- OAuth client secrets.
- Database URLs with credentials.
- JWT signing keys.
- Session secrets.
- Webhook signing secrets.
- Private service endpoints.
- Anything that would require rotation if posted publicly.

Use a variable for:

- Public API base URLs.
- Feature flags.
- Environment names.
- Public app names.
- Non-sensitive runtime tuning values.

If you are unsure, use a secret.

## Local Machine Hygiene

Recommended habits:

- Keep env files in the project root only when actively deploying.
- Use a password manager for canonical secret values.
- Prefer different credentials for staging and production.
- Avoid sharing env files over chat, email, or tickets.
- Keep `.secret-backups/` out of commits and uploads.
- Do not run variable preview commands against secret files.

## Command History

Avoid putting secret values directly in shell commands. Shell history can persist them.

Prefer env files:

```bash
wrangler secret bulk production.env
```

Avoid commands like:

```bash
wrangler secret put MY_SECRET_KEY
```

The interactive command can be safe, but it is easier to accidentally leak values when copying, pasting, or recording terminal sessions.

## Rotation Workflow

Use rotation when:

- A credential is old.
- A developer leaves the project.
- A secret may have been exposed.
- You are moving from staging to production credentials.
- You are changing providers or database users.

Recommended process:

1. Generate new values in the upstream provider.
2. Update `production.env` or `staging.env`.
3. Run the rotation helper.
4. Confirm the Worker still works.
5. Revoke the old values in the upstream provider.
6. Save audit notes outside this repository if required by your team.

Production Worker rotation:

```bash
bash rotate-secrets.sh production workers
```

Staging Worker rotation:

```bash
bash rotate-secrets.sh staging workers
```

Pages rotation:

```bash
bash rotate-secrets.sh production pages
```

## Incident Checklist

If a secret is accidentally committed:

1. Do not only delete the commit. Assume the secret is compromised.
2. Revoke or rotate the exposed credential at the provider.
3. Update the relevant env file with a new value.
4. Run the rotation helper.
5. Verify the Worker works with the new value.
6. Remove the secret from git history if needed.
7. Audit logs for suspicious use of the old credential.

If a secret is pasted into a public issue, chat, or log:

1. Rotate it immediately.
2. Delete the public copy if possible.
3. Treat deletion as cleanup, not as protection. The value should still be considered exposed.

## Publishing Safety

Before publishing to npm or creating a release, run:

```bash
git status --ignored --short
npm pack --dry-run
```

Confirm:

- `production.env` is not included.
- `staging.env` is not included.
- `production.vars.env` is not included unless you intentionally made it public.
- `staging.vars.env` is not included unless you intentionally made it public.
- `.secret-backups/` is not included.
- `node_modules/` is not included.

The package `files` list in `package.json` controls what npm includes. Keep it narrow.

## CI/CD Guidance

If you adapt this project for CI:

- Store CI secrets in the CI provider's encrypted secret store.
- Generate env files during the job, then delete them.
- Avoid printing env file contents.
- Run `npm pack --dry-run` in release jobs.
- Use least-privilege Cloudflare API tokens.
- Use separate Cloudflare API tokens for staging and production when possible.

Example CI shape:

```bash
printf '%s\n' "DATABASE_URL=$DATABASE_URL" > production.env
printf '%s\n' "JWT_SECRET=$JWT_SECRET" >> production.env
npm run deploy
rm -f production.env
```

## Cloudflare API Tokens

Prefer scoped Cloudflare API tokens instead of broad account tokens.

For Workers deployments, use a token with only the permissions needed for the target account and Worker. If you also manage Pages secrets, use permissions appropriate for Pages.

Store the token outside this repository.

## What The Backup Does And Does Not Contain

`rotate-secrets.sh` writes a backup of the current secret listing:

```text
.secret-backups/secret-list_production_workers_20260526_120000.txt
```

This helps you see what secret names existed before rotation.

It does not contain secret values because Cloudflare does not return secret values through `wrangler secret list`.

Even so, treat backup files as internal because secret names can reveal architecture details.
