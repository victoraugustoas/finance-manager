---
name: analyze-dependency-upgrade
description: >-
  Analyzes a dependency upgrade from vX.X.X to vY.Y.Y and produces a structured
  report covering breaking changes, deprecations, performance implications,
  new APIs, and project impact. Use when the user asks to evaluate a dependency
  bump, audit a version upgrade, or assess risks before updating a package.
---

# Analyze Dependency Upgrade

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
- "Analise as atualizações de actions nos workflows"
- "Check if the GitHub Actions in our workflows are up to date"
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
        ├─ reads PR diff → extracts GitHub Actions + versions from workflows
        ├─ reads package.json / lockfile / workflow files from the PR branch
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
3. Detect whether `package.json` or workflow files (`.github/workflows/*.yml`)
   were modified in the PR diff; skip the job and add a neutral comment if no
   dependency or action change is found.
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

## Inputs (when running manually / in CI)

When triggered via pull request, the skill **reads all inputs from the PR
context** injected as environment variables by the workflow. The agent must
not ask the user interactively for these values.

| Variable | Source | Description |
|---|---|---|
| `DEP_CHANGES` | workflow step | JSON array of `{pkg, from, to, section}` objects |
| `ACTION_CHANGES` | workflow step | JSON array of `{pkg, from, to, section}` objects for GitHub Actions |
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

Read `DEP_CHANGES` and `ACTION_CHANGES` (JSON arrays). For each entry:

- `pkg` — package name or action reference (e.g. `actions/checkout`).
- `from` — old version (may be `null` for newly added packages/actions; in that
  case, skip the breaking-change/deprecation analysis and only document
  the new addition).
- `to` — new version.
- `section` — which `package.json` section (`dependencies`,
  `devDependencies`, etc.) or `workflow` for GitHub Actions.

Entries with `section: "workflow"` are GitHub Actions version changes detected
in `.github/workflows/*.yml` files. These require a different changelog
strategy (see step 3).

If there is more than one changed package/action, produce a separate report
section per item under a `## <package>` heading, then a combined **Summary**
and **Risk assessment** at the top.

### 2. Read codebase state from the PR branch

The workflow checks out the PR branch, so the files on disk already reflect
the target state. Read:

- `package.json` — to confirm declared versions.
- `pnpm-lock.yaml` — to read the resolved (exact) versions, not just ranges.
- `.nvmrc` — Node.js version constraint.
- Config files relevant to the package (e.g. `.prettierrc`,
  `eslint.config.mjs`, `tsconfig.json`, `nest-cli.json`, etc).
- `.github/workflows/*.yml` — workflow files, to verify action versions and
  understand how changed actions are used in context.

### 3. Fetch the changelog / release notes

**For npm packages** — try in this order:

1. GitHub releases page for the target tag.
2. `CHANGELOG.md` on GitHub.
3. npm registry page.
4. Official vendor docs / blog.

**For GitHub Actions** (entries with `section: "workflow"`) — the `pkg` field
is the action reference (e.g. `actions/checkout`). Fetch release notes from:

1. GitHub releases page: `https://github.com/{owner}/{repo}/releases/tag/{version}`
   (use the `to` version as the tag).
2. GitHub releases list: `https://github.com/{owner}/{repo}/releases`
3. The action's README or documentation on GitHub.

If the version is a major tag (e.g. `v7`), also check if there is a rolling
`v7` tag pointing to the latest `v7.x.x` release.

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
- For workflow action changes, grep `.github/workflows/` for all usages of
  the changed action to understand how it is configured (inputs, `with:`,
  environment variables).
- Record all matches with `file:line` references.
- Categorize: **Will break** / **Will deprecate** / **No impact**.

### 6. Build the report

Assemble the Markdown report following the structure below. Include a
PR context header so readers know which PR triggered the analysis.

### 7. Output the report

**In CI (GitHub Actions):**
1. Write the Markdown report to `/tmp/dep_report.md`.
2. Write the JSON summary to `/tmp/dep_report.json` with the structure:
   ```json
   {
     "canAutoMerge": boolean,
     "packages": [
       { "pkg": "package-name", "risk": "Low", "action": "Proceed" }
     ]
   }
   ```
   Set `canAutoMerge` to `true` if and only if all packages have `risk: "Low"` and `action: "Proceed"`.

The workflow step will post `/tmp/dep_report.md` as a PR comment and use `/tmp/dep_report.json` to evaluate auto-merge. Do not write to the repository tree. Do not commit any file.

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
# Dependency Upgrade Analysis

> **PR**: [#<number> <title>](<url>)
> **Analyzed on**: <YYYY-MM-DD HH:MM UTC>
> **Triggered by**: push to `<branch>`

## Overall risk assessment

| Package / Action | From | To | Risk | Action |
|---|---|---|---|---|
| `<pkg or action>` | `<from>` | `<to>` | Low / Medium / High | Proceed / Caution / Hold |

_(one row per changed package or action)_

---

## `<package or action>` — <from> → <to>

> **Section**: `<dependencies | devDependencies | workflow | …>`
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
- For workflow action changes: check if the new version requires different
  permissions, runner versions, or input parameters.

### Project usage audit

- **Files importing the package** — count + representative `file:line` paths.
- **Workflows using the action** (if `section: "workflow"`) — list all
  `.github/workflows/*.yml` files that reference the action, with `file:line`.
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
- **Marker comment.** Do NOT add the HTML marker comment yourself in CI; the workflow prepends it automatically before posting.
- **One comment per PR.** The workflow updates the existing comment on re-runs; never post duplicates.
- **No emojis** unless the user asks.

## Quick command reference

```bash
# Detect version changes between base and HEAD (used by the workflow)
git diff origin/main...HEAD -- package.json

# Search for imports of a package in the codebase
rg "from '<package>'" src/

# Search for a specific deprecated symbol
rg '<symbol>' src/

# Search for GitHub Action usages in workflow files
rg "uses: <owner>/<repo>@" .github/workflows/

# Fetch latest release of a GitHub Action
gh api repos/<owner>/<repo>/releases/latest --jq '.tag_name'

# Post a PR comment manually (for local testing)
gh pr comment <number> --body "$(cat /tmp/dep_report.md)"

# Update an existing comment
gh api repos/<owner>/<repo>/issues/comments/<comment-id> -X PATCH -f body="<body>"

# List PR comments (to find the marker comment ID)
gh api repos/<owner>/<repo>/issues/<pr-number>/comments --jq '.[].id'
```
