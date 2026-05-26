# Live Example Worker

This folder contains a real Cloudflare Worker you can deploy to verify that secret sync and runtime injection both work.

## What It Does

The Worker exposes two endpoints:

- `/` returns basic status and whether `LIVE_TEST_SECRET` exists.
- `/check?expected=hello-from-cloudflare` verifies that the runtime secret matches the expected throwaway value without returning the secret itself.

## Before You Start

1. Install Wrangler and log in:
   ```bash
   npm install -g wrangler
   wrangler login
   ```
2. Review the included throwaway secret file:
   ```env
   LIVE_TEST_SECRET=hello-from-cloudflare
   ```
   It lives in `example/live-test.env.example` and is what `npm run example:deploy` uses.
3. If needed, change the Worker name in `example/wrangler.toml` so it fits your account naming preferences.

## Deploy The Example

From the repo root:

```bash
bash manage-secrets.sh deploy --config example/wrangler.toml
```

Or with npm:

```bash
npm run example:deploy
```

Wrangler will print a `workers.dev` URL after a successful deploy.

## Run The Live Check

Replace the URL below with the one Wrangler printed:

```bash
node example/live-test.mjs https://<your-worker>.workers.dev hello-from-cloudflare
```

You can also inspect the status endpoint directly:

```bash
curl https://<your-worker>.workers.dev/
curl "https://<your-worker>.workers.dev/check?expected=hello-from-cloudflare"
```

Expected result from `/check`:

```json
{
  "ok": true,
  "secretPresent": true,
  "matchesExpected": true
}
```

## Cleanup

When you are done, remove the temporary secret from Cloudflare:

```bash
npm run example:delete-live-test
```

If you want to remove the example Worker too:

```bash
npm run example:delete-worker
```

If you want to test with a different throwaway value, edit `example/live-test.env.example` before syncing again.
