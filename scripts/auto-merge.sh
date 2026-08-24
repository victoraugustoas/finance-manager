#!/usr/bin/env bash
set -euo pipefail

REPO="${1:-${REPO:-}}"
PR_NUMBER="${2:-${PR_NUMBER:-}}"

if [ -z "$REPO" ] || [ -z "$PR_NUMBER" ]; then
  echo "Usage: auto-merge.sh <REPO> <PR_NUMBER>"
  exit 1
fi

post_or_update_decision() {
  local body_file="$1"
  local existing
  existing=$(gh api \
    "repos/${REPO}/issues/${PR_NUMBER}/comments" \
    --paginate \
    --jq '.[] | select(.body | startswith("<!-- dependency-upgrade-decision -->")) | .id' \
    | head -1 || true)

  if [ -n "${existing}" ]; then
    jq -Rs --arg b "$(cat "$body_file")" '{body: $b}' \
      /dev/null > /tmp/am_payload.json
    gh api \
      "repos/${REPO}/issues/comments/${existing}" \
      -X PATCH \
      --input /tmp/am_payload.json > /dev/null
    echo "Updated decision comment #${existing}"
  else
    gh pr comment "$PR_NUMBER" \
      --body-file "$body_file" \
      --repo "$REPO" > /dev/null
    echo "Created decision comment"
  fi
}

CAN_AUTO_MERGE=$(jq -r '.canAutoMerge // false' /tmp/dep_report.json 2>/dev/null || echo "false")

if [ "$CAN_AUTO_MERGE" != "true" ]; then
  echo "Manual review required — not all packages are Low risk / Proceed."
  exit 0
fi

echo "All packages are Low risk / Proceed. Enabling native auto-merge..."

if gh pr merge "$PR_NUMBER" \
  --squash \
  --delete-branch \
  --auto \
  --repo "$REPO" 2>/dev/null; then
  echo "Auto-merge enabled for PR #${PR_NUMBER}; GitHub will merge once CI checks pass."
  cat > /tmp/am_decision.md <<'EOF'
<!-- dependency-upgrade-decision -->
**Auto-analysis**: all dependency upgrades assessed as Low risk / Proceed. Auto-merge enabled; GitHub will merge once CI checks pass.
EOF
  post_or_update_decision /tmp/am_decision.md || true
else
  echo "::warning::Auto-merge failed — branch protection or repo settings may require manual approval."
  cat > /tmp/am_decision.md <<'EOF'
<!-- dependency-upgrade-decision -->
**Auto-analysis passed** (all Low risk / Proceed) but native auto-merge could not be enabled. Manual review/merge required.
EOF
  post_or_update_decision /tmp/am_decision.md || true
fi
