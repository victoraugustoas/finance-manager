#!/usr/bin/env bash
set -euo pipefail

BASE="${1:-${BASE:-}}"
HEAD="${2:-${HEAD:-}}"

if [ -z "$BASE" ] || [ -z "$HEAD" ]; then
  echo "Usage: extract-changed-packages.sh <BASE_SHA> <HEAD_SHA>"
  exit 1
fi

mkdir -p /tmp/base_dir /tmp/head_dir

git show "$BASE:package.json"     > /tmp/base_dir/package.json 2>/dev/null || echo '{}' > /tmp/base_dir/package.json
git show "$BASE:pnpm-lock.yaml"   > /tmp/base_dir/pnpm-lock.yaml 2>/dev/null || echo ''   > /tmp/base_dir/pnpm-lock.yaml
git show "$HEAD:package.json"     > /tmp/head_dir/package.json 2>/dev/null || cp ./package.json /tmp/head_dir/package.json
git show "$HEAD:pnpm-lock.yaml"   > /tmp/head_dir/pnpm-lock.yaml 2>/dev/null || cp ./pnpm-lock.yaml /tmp/head_dir/pnpm-lock.yaml

# COREPACK_ENABLE_STRICT=0 and --config.pm-on-fail=ignore bypass Corepack version check errors
# when comparing packageManager field changes across base and head directories.
COREPACK_ENABLE_STRICT=0 pnpm list --json --lockfile-only --config.pm-on-fail=ignore --dir /tmp/base_dir > /tmp/base_list.json 2>/dev/null || echo '[{}]' > /tmp/base_list.json
COREPACK_ENABLE_STRICT=0 pnpm list --json --lockfile-only --config.pm-on-fail=ignore --dir /tmp/head_dir > /tmp/head_list.json 2>/dev/null || echo '[{}]' > /tmp/head_list.json

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
pnpm exec ts-node "$SCRIPT_DIR/extract-changed-packages.ts"

if [ ! -f /tmp/dep_changes.json ]; then
  if [ -n "${GITHUB_OUTPUT:-}" ]; then
    echo "has_changes=false" >> "$GITHUB_OUTPUT"
  fi
else
  if [ -n "${GITHUB_OUTPUT:-}" ]; then
    echo "has_changes=true" >> "$GITHUB_OUTPUT"
    {
      echo "changes_json<<EOF"
      cat /tmp/dep_changes.json
      echo
      echo "EOF"
    } >> "$GITHUB_OUTPUT"
  fi
fi
