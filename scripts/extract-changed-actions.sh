#!/usr/bin/env bash
set -euo pipefail

BASE="${1:-${BASE:-}}"
HEAD="${2:-${HEAD:-}}"

if [ -z "$BASE" ] || [ -z "$HEAD" ]; then
  echo "Usage: extract-changed-actions.sh <BASE_SHA> <HEAD_SHA>"
  exit 1
fi

mkdir -p /tmp/action_base/.github/workflows /tmp/action_head/.github/workflows

# Copy workflow files from base and head SHAs into separate temp directories.
# The TypeScript script compares .github/workflows/*.yml between the two.
for f in $(git ls-tree -r --name-only "$BASE" -- .github/workflows/ 2>/dev/null | grep -E '\.ya?ml$' || true); do
  git show "$BASE:$f" > "/tmp/action_base/$f" 2>/dev/null || true
done

for f in $(git ls-tree -r --name-only "$HEAD" -- .github/workflows/ 2>/dev/null | grep -E '\.ya?ml$' || true); do
  git show "$HEAD:$f" > "/tmp/action_head/$f" 2>/dev/null || true
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Point the TS script at the action-specific temp dirs via env vars
BASE_DIR=/tmp/action_base HEAD_DIR=/tmp/action_head \
  pnpm exec ts-node "$SCRIPT_DIR/extract-changed-actions.ts"

if [ ! -f /tmp/action_changes.json ]; then
  if [ -n "${GITHUB_OUTPUT:-}" ]; then
    echo "has_changes=false" >> "$GITHUB_OUTPUT"
  fi
else
  if [ -n "${GITHUB_OUTPUT:-}" ]; then
    echo "has_changes=true" >> "$GITHUB_OUTPUT"
    {
      echo "changes_json<<EOF"
      cat /tmp/action_changes.json
      echo
      echo "EOF"
    } >> "$GITHUB_OUTPUT"
  fi
fi
