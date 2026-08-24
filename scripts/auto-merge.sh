#!/usr/bin/env bash
set -euo pipefail

REPO="${1:-${REPO:-}}"
PR_NUMBER="${2:-${PR_NUMBER:-}}"
HEAD_SHA="${3:-${HEAD_SHA:-}}"
RUN_ID="${4:-${RUN_ID:-${GITHUB_RUN_ID:-}}}"

if [ -z "$REPO" ] || [ -z "$PR_NUMBER" ] || [ -z "$HEAD_SHA" ]; then
  echo "Usage: auto-merge.sh <REPO> <PR_NUMBER> <HEAD_SHA> [RUN_ID]"
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

echo "All packages are Low risk / Proceed. Checking CI status..."

CHECKS=$(gh api \
  "repos/${REPO}/commits/${HEAD_SHA}/check-runs" \
  --jq "[.check_runs[] | select((.external_id | tostring) != \"${RUN_ID}\") | {name: .name, status: .status, conclusion: .conclusion}]")

echo "Check runs for ${HEAD_SHA} (excluding current workflow run ${RUN_ID}):"
echo "$CHECKS" | jq -r '.[] | "  \(.name): \(.status) (\(.conclusion // "pending"))"'

ALL_CHECKS_PASSED=true
while IFS= read -r line; do
  status=$(echo "$line" | jq -r '.status')
  conclusion=$(echo "$line" | jq -r '.conclusion // "pending"')
  name=$(echo "$line" | jq -r '.name')
  if [ "$status" != "completed" ]; then
    echo "Check '${name}' is still ${status}"
    ALL_CHECKS_PASSED=false
    break
  fi
  if [ "$conclusion" != "success" ] && [ "$conclusion" != "neutral" ] && [ "$conclusion" != "skipped" ]; then
    echo "Check '${name}' concluded: ${conclusion}"
    ALL_CHECKS_PASSED=false
    break
  fi
done < <(echo "$CHECKS" | jq -c '.[]')

if [ "$ALL_CHECKS_PASSED" != "true" ]; then
  echo "::warning::Not all CI checks passed. Deferring auto-merge."

  if gh pr merge "$PR_NUMBER" \
    --squash \
    --delete-branch \
    --auto \
    --repo "$REPO"; then
    echo "Auto-merge enabled for PR #${PR_NUMBER}; GitHub will merge once CI passes."
    cat > /tmp/am_decision.md <<'EOF'
<!-- dependency-upgrade-decision -->
**Auto-analysis**: all dependency upgrades assessed as Low risk / Proceed. CI checks still running — auto-merge enabled, merging once they pass.
EOF
    post_or_update_decision /tmp/am_decision.md || true
    exit 0
  fi

  echo "::warning::Native auto-merge unavailable (may be disabled in repository settings)."

  if gh pr merge "$PR_NUMBER" \
    --squash \
    --delete-branch \
    --repo "$REPO"; then
    echo "PR #${PR_NUMBER} merged and branch deleted."
    cat > /tmp/am_decision.md <<'EOF'
<!-- dependency-upgrade-decision -->
**Auto-analysis**: all dependency upgrades assessed as Low risk / Proceed. Merged.
EOF
  else
    echo "::warning::Merge deferred until CI checks pass."
    cat > /tmp/am_decision.md <<'EOF'
<!-- dependency-upgrade-decision -->
**Auto-analysis passed** (all Low risk / Proceed) but CI checks are not all passing. Merge deferred until checks pass.
EOF
  fi
  post_or_update_decision /tmp/am_decision.md || true
  exit 0
fi

echo "All CI checks passed. Attempting merge."

if gh pr merge "$PR_NUMBER" \
  --squash \
  --delete-branch \
  --auto \
  --repo "$REPO" 2>/dev/null; then
  echo "PR #${PR_NUMBER} auto-merge requested."
  cat > /tmp/am_decision.md <<'EOF'
<!-- dependency-upgrade-decision -->
**Auto-analysis**: all dependency upgrades assessed as Low risk / Proceed. All CI checks passed. Merging.
EOF
  post_or_update_decision /tmp/am_decision.md || true
elif gh pr merge "$PR_NUMBER" \
  --squash \
  --delete-branch \
  --repo "$REPO"; then
  echo "PR #${PR_NUMBER} merged and branch deleted."
else
  echo "::warning::Auto-merge failed — branch protection may require manual approval."
  cat > /tmp/am_decision.md <<'EOF'
<!-- dependency-upgrade-decision -->
**Auto-analysis passed** but merge failed. Branch protection likely requires manual approval.
EOF
  post_or_update_decision /tmp/am_decision.md || true
fi
