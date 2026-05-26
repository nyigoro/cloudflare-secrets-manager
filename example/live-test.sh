#!/bin/bash

set -e

WORKER_URL="${1:-}"
EXPECTED_SECRET="${2:-}"

if [ -z "$WORKER_URL" ] || [ -z "$EXPECTED_SECRET" ]; then
  echo "Usage: bash example/live-test.sh <worker-url> <expected-secret>"
  echo "Example: bash example/live-test.sh https://cloudflare-secrets-live-example.<subdomain>.workers.dev hello-from-cloudflare"
  exit 1
fi

TARGET_URL="${WORKER_URL%/}/check?expected=${EXPECTED_SECRET}"

echo "Checking deployed Worker at $TARGET_URL"
curl --fail --silent --show-error "$TARGET_URL"
echo ""
