#!/bin/bash
# ============================================================
#  manage-secrets.sh
#  A helper script to manage Cloudflare Workers secrets
#  and deploy-time variables.
# ============================================================

set -e

ENV_FILE="production.env"
VARS_FILE=""
CONFIG_FILE=""
WRANGLER_ENV=""
SECRET_NAME=""
COMMAND="${1:-help}"

if [ $# -gt 0 ]; then
  shift
fi

print_help() {
  echo ""
  echo "  Cloudflare Secrets Manager"
  echo "  ========================================"
  echo "  Usage: bash manage-secrets.sh <command> [options]"
  echo ""
  echo "  Commands:"
  echo "    sync          Push all secrets from the env file to Cloudflare"
  echo "    vars          Show deploy-time variables from the vars file"
  echo "    list          List secret names currently stored for the Worker"
  echo "    delete <KEY>  Delete a specific secret by name"
  echo "    deploy        Sync secrets, apply variables, then deploy the Worker"
  echo "    help          Show this help message"
  echo ""
  echo "  Options:"
  echo "    --config FILE     Target a specific wrangler config"
  echo "    --env NAME        Target a Wrangler environment like staging"
  echo "    --env-file FILE   Read secrets from a different env file"
  echo "    --vars-file FILE  Read deploy-time variables from a different vars file"
  echo ""
  echo "  Examples:"
  echo "    bash manage-secrets.sh sync"
  echo "    bash manage-secrets.sh vars"
  echo "    bash manage-secrets.sh deploy --env staging --env-file staging.env --vars-file staging.vars.env"
  echo "    bash manage-secrets.sh delete LIVE_TEST_SECRET --config example/wrangler.toml"
  echo ""
}

fail() {
  echo "  ERROR: $1"
  exit 1
}

infer_vars_file() {
  case "$ENV_FILE" in
    *.env.example)
      printf "%s.vars.env.example" "${ENV_FILE%.env.example}"
      ;;
    *.env)
      printf "%s.vars.env" "${ENV_FILE%.env}"
      ;;
    *)
      printf ""
      ;;
  esac
}

check_env_file() {
  if [ ! -f "$ENV_FILE" ]; then
    fail "$ENV_FILE not found. Create it first using the env template."
  fi
}

check_wrangler() {
  if ! command -v wrangler > /dev/null 2>&1 && ! command -v npx > /dev/null 2>&1; then
    fail "wrangler is not installed. Run: npm install -g wrangler or npm install"
  fi
}

check_node() {
  if ! command -v node > /dev/null 2>&1; then
    fail "node is required for variable support. Install Node.js first."
  fi
}

check_worker_target() {
  if [ -n "$CONFIG_FILE" ]; then
    if [ ! -f "$CONFIG_FILE" ]; then
      fail "Config file not found: $CONFIG_FILE"
    fi
    return
  fi

  if [ ! -f "wrangler.toml" ] && [ ! -f "wrangler.json" ] && [ ! -f "wrangler.jsonc" ]; then
    fail "No Worker config found in this directory. Pass --config example/wrangler.toml or point to your own wrangler config."
  fi
}

run_wrangler() {
  local runner=()
  local args=()

  if command -v wrangler > /dev/null 2>&1; then
    runner=(wrangler)
  else
    runner=(npx wrangler)
  fi

  if [ -n "$CONFIG_FILE" ]; then
    args+=(--config "$CONFIG_FILE")
  fi

  if [ -n "$WRANGLER_ENV" ]; then
    args+=(--env "$WRANGLER_ENV")
  fi

  "${runner[@]}" "${args[@]}" "$@"
}

run_node_script() {
  node "$@"
}

while [ $# -gt 0 ]; do
  case "$1" in
    --config)
      [ $# -ge 2 ] || fail "Missing value for --config"
      CONFIG_FILE="$2"
      shift 2
      ;;
    --env)
      [ $# -ge 2 ] || fail "Missing value for --env"
      WRANGLER_ENV="$2"
      shift 2
      ;;
    --env-file)
      [ $# -ge 2 ] || fail "Missing value for --env-file"
      ENV_FILE="$2"
      shift 2
      ;;
    --vars-file)
      [ $# -ge 2 ] || fail "Missing value for --vars-file"
      VARS_FILE="$2"
      shift 2
      ;;
    *)
      if [ "$COMMAND" = "delete" ] && [ -z "$SECRET_NAME" ]; then
        SECRET_NAME="$1"
        shift
      else
        fail "Unknown argument: $1"
      fi
      ;;
  esac
done

if [ -z "$VARS_FILE" ]; then
  VARS_FILE="$(infer_vars_file)"
fi

case "$COMMAND" in
  sync)
    check_env_file
    check_wrangler
    check_worker_target
    echo "  Syncing secrets from $ENV_FILE to Cloudflare..."
    run_wrangler secret bulk "$ENV_FILE"
    echo "  Done. Run 'bash manage-secrets.sh list' with the same options to verify."
    ;;
  vars)
    check_node
    local_args=()
    if [ -n "$VARS_FILE" ]; then
      local_args+=(--vars-file "$VARS_FILE")
    fi
    run_node_script scripts/show-vars.mjs "${local_args[@]}"
    ;;
  list)
    check_wrangler
    check_worker_target
    echo "  Secrets currently configured for this Worker:"
    run_wrangler secret list
    ;;
  delete)
    [ -n "$SECRET_NAME" ] || fail "Provide the secret name. Example: bash manage-secrets.sh delete MY_SECRET_KEY"
    check_wrangler
    check_worker_target
    echo "  Deleting secret: $SECRET_NAME"
    run_wrangler secret delete "$SECRET_NAME"
    echo "  Secret '$SECRET_NAME' deleted."
    ;;
  deploy)
    check_env_file
    check_wrangler
    check_node
    check_worker_target
    deploy_args=()
    if [ -n "$CONFIG_FILE" ]; then
      deploy_args+=(--config "$CONFIG_FILE")
    fi
    if [ -n "$WRANGLER_ENV" ]; then
      deploy_args+=(--env "$WRANGLER_ENV")
    fi
    if [ -n "$VARS_FILE" ]; then
      deploy_args+=(--vars-file "$VARS_FILE")
    fi
    echo "  Step 1/2: Syncing secrets..."
    run_wrangler secret bulk "$ENV_FILE"
    echo "  Step 2/2: Deploying Worker with variables..."
    run_node_script scripts/deploy-with-vars.mjs "${deploy_args[@]}"
    echo "  Deployment complete."
    ;;
  help)
    print_help
    ;;
  *)
    print_help
    fail "Unknown command: $COMMAND"
    ;;
esac
