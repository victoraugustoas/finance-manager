---
name: analyze-dependency-upgrade
description: >-
  Analyzes a dependency upgrade from vX.X.X to vY.Y.Y and produces a structured
  report covering breaking changes, deprecations, performance implications,
  new APIs, and project impact. Use when the user asks to evaluate a dependency
  bump, audit a version upgrade, or assess risks before updating a package.
---

# Analyze Dependency Upgrade (finance-manager)

Use this skill when the user wants to evaluate upgrading a dependency and needs
a structured impact report. The skill runs as a GitHub Actions workflow triggered
on a pull request: it reads the PR diff to identify the bumped package and
versions, then posts the final report as a PR comment via the GitHub API.

## When to use

Trigger this skill when the user says things like:

- "Quero atualizar o `prisma` da `5.x` para `6.x`, faça um relatório"
- "Analyze the upgrade of `nestjs` from `9.x` to `10.x`"
- "Audite a atualização da dependência `X` da versão `A` para `B`"
- "Posso atualizar o `typescript-eslint`? Gere um relatório de impacto"
- "Evaluate the upgrade of `<package>` from `<old>` to `<new>`"
- "Crie/atualize a análise de dependência para rodar no GitHub Actions"

## Architecture overview

```
PR opened / synchronized
        │
        ▼
.github/workflows/analyze-dependency-upgrade.yml
        │  triggers
        ▼
opencode (this skill)
        │
        ├─ reads PR diff via GitHub API → extracts package + versions
        ├─ reads package.json / lockfile from the PR branch
        ├─ fetches changelog (webfetch)
        ├─ greps codebase for impact
        ├─ builds report (Markdown)
        └─ posts report as PR comment via gh CLI
```

**Output**: a PR comment (not a file). The report is never committed to the
repository. If a previous report comment from this workflow already exists on
the PR, it is updated in-place (not duplicated).

## GitHub Actions workflow

The workflow file lives at
`.github/workflows/analyze-dependency-upgrade.yml`.

It must:

1. Trigger on `pull_request` events (`opened`, `synchronize`, `reopened`).
2. Check out the PR branch with full history.
3. Detect whether `package.json` was modified in the PR diff; skip the job and
   add a neutral comment if no dependency change is found.
4. Call the opencode agent (this skill) with the PR context injected as
   environment variables.
5. Post (or update) the report as a PR comment using `gh pr comment` or the
   GitHub REST API.

Required permissions:

```yaml
permissions:
  contents: read
  pull-requests: write
```

Required secrets / variables (set in repository Settings → Secrets):

| Name | Description |
|---|---|
| `OPENCODE_API_KEY` | API key for the opencode agent runner |

`GITHUB_TOKEN` is provided automatically by Actions and is sufficient for
posting PR comments.

### Workflow template

```yaml
name: Dependency Upgrade Analysis

on:
  pull_request:
    paths:
      - 'package.json'
    types: [opened, synchronize, reopened]

concurrency:
  group: dep-upgrade-analysis-${{ github.event.pull_request.number }}
  cancel-in-progress: true

permissions:
  contents: read
  pull-requests: write

jobs:
  analyze:
    name: Analyze dependency upgrade
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: Checkout PR branch
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Install pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: pnpm

      - name: Extract changed packages from PR diff
        id: diff
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          BASE=${{ github.event.pull_request.base.sha }}
          HEAD=${{ github.event.pull_request.head.sha }}

          # Fetch the base package.json for comparison
          git show $BASE:package.json > /tmp/package.base.json || echo '{}' > /tmp/package.base.json

          # Detect bumped packages: name, from version, to version (one per line)
          node - <<'EOF'
          const base = require('/tmp/package.base.json');
          const head = require('./package.json');

          const sections = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];
          const changes = [];

          for (const section of sections) {
            const b = base[section] || {};
            const h = head[section] || {};
            for (const pkg of Object.keys(h)) {
              if (h[pkg] !== b[pkg] && b[pkg]) {
                changes.push({ pkg, from: b[pkg].replace(/^\^|~/, ''), to: h[pkg].replace(/^\^|~/, ''), section });
              }
              if (!b[pkg] && h[pkg]) {
                changes.push({ pkg, from: null, to: h[pkg].replace(/^\^|~/, ''), section });
              }
            }
          }

          if (changes.length === 0) {
            console.log('NO_CHANGES');
            process.exit(0);
          }

          // Write as JSON for the next step
          const fs = require('fs');
          fs.writeFileSync('/tmp/dep_changes.json', JSON.stringify(changes, null, 2));
          console.log('CHANGES_FOUND');
          changes.forEach(c => console.log(`  ${c.pkg}: ${c.from} → ${c.to} (${c.section})`));
          EOF

          if [ ! -f /tmp/dep_changes.json ]; then
            echo "has_changes=false" >> $GITHUB_OUTPUT
          else
            echo "has_changes=true" >> $GITHUB_OUTPUT
            echo "changes_json=$(cat /tmp/dep_changes.json | jq -c .)" >> $GITHUB_OUTPUT
          fi

      - name: Skip if no dependency changes
        if: steps.diff.outputs.has_changes != 'true'
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          gh pr comment ${{ github.event.pull_request.number }} \
            --body "**Dependency Upgrade Analysis**: no \`package.json\` dependency changes detected in this PR." \
            --repo ${{ github.repository }} || true

      - name: Run opencode dependency analysis
        if: steps.diff.outputs.has_changes == 'true'
        id: analysis
        env:
          OPENCODE_API_KEY: ${{ secrets.OPENCODE_API_KEY }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          PR_NUMBER: ${{ github.event.pull_request.number }}
          PR_TITLE: ${{ github.event.pull_request.title }}
          PR_URL: ${{ github.event.pull_request.html_url }}
          REPO: ${{ github.repository }}
          DEP_CHANGES: ${{ steps.diff.outputs.changes_json }}
        run: |
          opencode run \
            --skill analyze-dependency-upgrade \
            --output /tmp/dep_report.md \
            "Analyze the dependency changes listed in the DEP_CHANGES env variable for this PR. \
             PR #${PR_NUMBER}: ${PR_TITLE} (${PR_URL}). \
             For each changed package, produce the full report following the skill structure. \
             Output only the final Markdown report to /tmp/dep_report.md."

      - name: Post or update PR comment
        if: steps.diff.outputs.has_changes == 'true'
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          MARKER="<!-- dependency-upgrade-analysis -->"
          REPORT=$(cat /tmp/dep_report.md)
          BODY="${MARKER}
          ${REPORT}"

          # Find existing comment from this workflow
          EXISTING=$(gh api \
            repos/${{ github.repository }}/issues/${{ github.event.pull_request.number }}/comments \
            --jq '.[] | select(.body | startswith("<!-- dependency-upgrade-analysis -->")) | .id' \
            | head -1)

          if [ -n "$EXISTING" ]; then
            # Update existing comment
            gh api \
              repos/${{ github.repository }}/issues/comments/${EXISTING} \
              -X PATCH \
              -f body="$BODY"
            echo "Updated existing comment #${EXISTING}"
          else
            # Create new comment
            gh pr comment ${{ github.event.pull_request.number }} \
              --body "$BODY" \
              --repo ${{ github.repository }}
            echo "Created new comment"
          fi
```

## Inputs (when running manually / in CI)

When triggered via pull request, the skill **reads all inputs from the PR
context** injected as environment variables by the workflow. The agent must
not ask the user interactively for these values.

| Variable | Source | Description |
|---|---|---|
| `DEP_CHANGES` | workflow step | JSON array of `{pkg, from, to, section}` objects |
| `PR_NUMBER` | `github.event.pull_request.number` | PR number |
| `PR_TITLE` | `github.event.pull_request.title` | PR title |
| `PR_URL` | `github.event.pull_request.html_url` | PR URL |
| `REPO` | `github.repository` | `owner/repo` slug |
| `GH_TOKEN` | `secrets.GITHUB_TOKEN` | Authentication for GitHub API calls |

When triggered manually (e.g. from a local opencode session), the user must
provide package name, current version, and target version. In that case,
follow the interactive workflow from the original skill behavior and post
the report in the chat instead of as a PR comment.

## Workflow

Execute the steps below in order. In CI, all inputs come from environment
variables — never prompt interactively.

### 1. Parse dep changes from context

Read `DEP_CHANGES` (JSON array). For each entry:

- `pkg` — package name.
- `from` — old version (may be `null` for newly added packages; in that
  case, skip the breaking-change/deprecation analysis and only document
  the new addition).
- `to` — new version.
- `section` — which `package.json` section (`dependencies`,
  `devDependencies`, etc.).

If there is more than one changed package, produce a separate report section
per package under a `## <package>` heading, then a combined **Summary** and
**Risk assessment** at the top.

### 2. Read codebase state from the PR branch

The workflow checks out the PR branch, so the files on disk already reflect
the target state. Read:

- `package.json` — to confirm declared versions.
- `pnpm-lock.yaml` — to read the resolved (exact) versions, not just ranges.
- `.nvmrc` — Node.js version constraint.
- Config files relevant to the package (e.g. `.prettierrc`, `prisma/schema.prisma`,
  `eslint.config.mjs`, `tsconfig.json`, `nest-cli.json`).

### 3. Fetch the changelog / release notes

Same strategy as the interactive version — try in this order:

1. GitHub releases page for the target tag.
2. `CHANGELOG.md` on GitHub.
3. npm registry page.
4. Official vendor docs / blog.

Use `webfetch` for each attempt. Do not invent URLs.

If all fetches fail, note it in the report and proceed with "changelog
unavailable — manual review required" for that section.

### 4. Extract relevant changes

From the fetched changelog, extract for the range `from → to`:

- **Breaking changes** — removed APIs, signature changes, dropped support.
- **Deprecations** — soft removals, `@deprecated` markers, rename-to-deprecate.
- **Performance** — speedups, memory wins, regressions, new defaults.
- **New APIs** — new exports, options, CLI flags.
- **Migration notes** — codemods, migration guides.

### 5. Detect project impact

Cross-reference every breaking change and deprecation against the codebase:

- Grep `src/`, `prisma/`, `test/`, `scripts/` for imports and symbol usage.
- Check config files for package-specific options.
- Record all matches with `file:line` references.
- Categorize: **Will break** / **Will deprecate** / **No impact**.

### 6. Build the report

Assemble the Markdown report following the structure below. Include a
PR context header so readers know which PR triggered the analysis.

### 7. Output the report

**In CI (GitHub Actions):** write the report to `/tmp/dep_report.md`. The
workflow step will post it as a PR comment. Do not write it to the
repository tree. Do not commit any file.

**Interactive / local:** print the report in the chat.

### 8. Idempotency

The workflow uses an HTML comment marker `<!-- dependency-upgrade-analysis -->`
at the top of the PR comment body. If the job runs again (e.g. on `synchronize`),
the existing comment is updated in-place rather than a new one being created.
The skill does not need to manage this — the shell step in the workflow handles it.

## Report structure

The Markdown report must contain the following sections in order. Use the
exact headings — they are part of the contract.

````markdown
<!-- dependency-upgrade-analysis -->

# Dependency Upgrade Analysis

> **PR**: [#<number> <title>](<url>)
> **Analyzed on**: <YYYY-MM-DD HH:MM UTC>
> **Triggered by**: push to `<branch>`

## Overall risk assessment

| Package | From | To | Risk | Action |
|---|---|---|---|---|
| `<pkg>` | `<from>` | `<to>` | Low / Medium / High | Proceed / Caution / Hold |

_(one row per changed package)_

---

## `<package-name>` — <from> → <to>

> **Section**: `<dependencies | devDependencies | …>`
> **Changelog**: <url>

### Summary

2–4 sentences: safe / needs care / risky, any blockers, headline new features.

### Breaking changes

Table or bullet list. Each entry:
- **Change** — short title.
- **Source** — changelog link.
- **Project impact** — `None` or `file:line` with description.

If none: "No breaking changes documented between `<from>` and `<to>`."

### Deprecations

Each entry:
- **API** — symbol name.
- **Deprecated since** / **Removal target** / **Replacement**.
- **Project impact** — `None` or `file:line`.

If none: "No new deprecations documented between `<from>` and `<to>`."

### Performance

Speedups, regressions, opt-ins. If changelog is silent:
"No performance changes documented between `<from>` and `<to>`. Consider
benchmarking before shipping."

### New APIs

Up to ~10 relevant new symbols / options, each with name, description,
relevance to this project, and docs link.

### Configuration & environment

- Node.js version compatibility (cross-check `.nvmrc`).
- Peer-dependency constraints.
- TypeScript constraints.
- Default config changes.
- Lockfile regeneration notes.

### Project usage audit

- **Files importing the package** — count + representative `file:line` paths.
- **APIs used** — main symbols / options referenced.
- **APIs NOT used** — capabilities the upgrade would unlock.

### Migration plan

Ordered checklist. If trivial, say so explicitly.

1. …
2. …

---

## References

- <url>
- <url>
````

## Ground rules

- **Do not invent URLs.** Only use links actually fetched or supplied.
- **Do not fabricate findings.** If a code search returns no matches, say so.
- **Cite everything.** Every breaking change and deprecation must link to its source.
- **No files committed.** The report lives only as a PR comment.
- **Marker comment.** Always start the output with `<!-- dependency-upgrade-analysis -->` so the workflow update logic works.
- **One comment per PR.** The workflow updates the existing comment on re-runs; never post duplicates.
- **No emojis** unless the user asks.
- **Project context is `finance-manager`** — NestJS + Prisma + PostgreSQL + TypeScript.
  Use this to focus changelog entries on relevant areas.

## Quick command reference

```bash
# Detect version changes between base and HEAD (used by the workflow)
git diff origin/main...HEAD -- package.json

# Search for imports of a package in the codebase
rg "from '<package>'" src/

# Search for a specific deprecated symbol
rg '<symbol>' src/

# Post a PR comment manually (for local testing)
gh pr comment <number> --body "$(cat /tmp/dep_report.md)"

# Update an existing comment
gh api repos/<owner>/<repo>/issues/comments/<comment-id> -X PATCH -f body="<body>"

# List PR comments (to find the marker comment ID)
gh api repos/<owner>/<repo>/issues/<pr-number>/comments --jq '.[].id'
```
