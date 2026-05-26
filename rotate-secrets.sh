#!/bin/bash
# ============================================================
#  rotate-secrets.sh
#  Back up current secret names, upload new values, then verify.
# ============================================================

set -e

ENVIRONMENT="${1:-production}"
TARGET="${2:-workers}"
CONFIG_FILE="${3:-}"

fail() {
  echo "  ERROR: $1"
  exit 1
}

run_wrangler() {
  if command -v wrangler > /dev/null 2>&1; then
    if [ -n "$CONFIG_FILE" ]; then
      wrangler --config "$CONFIG_FILE" "$@"
    else
      wrangler "$@"
    fi
  elif command -v npx > /dev/null 2>&1; then
    if [ -n "$CONFIG_FILE" ]; then
      npx wrangler --config "$CONFIG_FILE" "$@"
    else
      npx wrangler "$@"
    fi
  else
    fail "wrangler is not installed. Run: npm install -g wrangler or npm install"
  fi
}

case "$ENVIRONMENT" in
  production)
    ENV_FILE="production.env"
    ENV_ARGS=()
    ;;
  staging)
    ENV_FILE="staging.env"
    ENV_ARGS=(--env staging)
    ;;
  *)
    fail "Unknown environment '$ENVIRONMENT'. Use 'production' or 'staging'."
    ;;
esac

case "$TARGET" in
  workers|pages)
    ;;
  *)
    fail "Unknown target '$TARGET'. Use 'workers' or 'pages'."
    ;;
esac

[ -f "$ENV_FILE" ] || fail "$ENV_FILE not found."

TIMESTAMP="$(date +"%Y%m%d_%H%M%S")"
BACKUP_DIR=".secret-backups"
BACKUP_FILE="$BACKUP_DIR/secret-list_${ENVIRONMENT}_${TARGET}_${TIMESTAMP}.txt"

mkdir -p "$BACKUP_DIR"

echo ""
echo "  Cloudflare Secrets Rotation"
echo "  Environment : $ENVIRONMENT"
echo "  Target      : $TARGET"
if [ -n "$CONFIG_FILE" ]; then
  echo "  Config      : $CONFIG_FILE"
fi
echo ""

echo "  [1/4] Backing up current secret listing..."
if [ "$TARGET" = "pages" ]; then
  run_wrangler pages secret list "${ENV_ARGS[@]}" > "$BACKUP_FILE" 2>&1 || true
else
  run_wrangler secret list "${ENV_ARGS[@]}" > "$BACKUP_FILE" 2>&1 || true
fi
echo "  Backup saved to: $BACKUP_FILE"

echo ""
echo "  [2/4] Secrets to rotate from $ENV_FILE:"
grep -v '^[[:space:]]*#' "$ENV_FILE" | grep -v '^[[:space:]]*$' | while IFS='=' read -r key _; do
  echo "    - $key"
done

echo ""
read -r -p "  [3/4] Proceed with rotation? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "  Rotation cancelled."
  exit 0
fi

echo ""
echo "  Uploading updated secrets..."
if [ "$TARGET" = "pages" ]; then
  run_wrangler pages secret bulk "$ENV_FILE" "${ENV_ARGS[@]}"
else
  run_wrangler secret bulk "$ENV_FILE" "${ENV_ARGS[@]}"
fi

echo ""
echo "  [4/4] Verifying secrets now stored in Cloudflare..."
if [ "$TARGET" = "pages" ]; then
  run_wrangler pages secret list "${ENV_ARGS[@]}"
else
  run_wrangler secret list "${ENV_ARGS[@]}"
fi

echo ""
echo "  Rotation complete."
echo "  Previous listing saved at: $BACKUP_FILE"
