---
name: update-readme
description: Keeps README.md aligned with the real project—run after changes to src layout, dependencies, scripts, bounded contexts, env docs, conventions, infra, hooks, or CI—by refreshing only outdated sections using package.json, AGENTS.md, and the repo layout.
---

## When to use

This skill should be used **at the end of any task** that changes one of the following aspects of the project:

- Folder or module structure (`src/`)
- Dependencies (`package.json`)
- Available scripts (`package.json` → `scripts`)
- Bounded contexts (Account, Transaction, Category, Notifications, or new ones)
- Environment variables (when `.env.example` exists)
- Project conventions (naming, architecture, patterns)
- Infrastructure configuration (Docker, Prisma, database)
- Git hooks or CI/CD

## Goal

The `README.md` is the entry point for any developer. It must **accurately** reflect the current state of the project so that a new contributor can understand, install, and run the project without needing to ask questions.

## Expected README.md structure

The README.md should contain the following sections, in this order:

```markdown
# Finance Manager

Brief project description (1-2 sentences).

## Technologies

Table or list of main technologies with versions.

## Prerequisites

What needs to be installed before getting started (Node.js, pnpm, PostgreSQL, etc).

## Installation

Step-by-step guide to install and configure the project locally.

## Available scripts

Table with all `package.json` scripts and a brief description of each.

## Project structure

Directory tree with description of each relevant folder/context.

## Architecture

Brief explanation of the architecture (Clean Architecture + DDD), bounded contexts, and how they are organized.

## Conventions

Code conventions adopted (file naming, formatting, etc).

## Environment variables

Include this section only when the project ships `.env.example` (or equivalent documented env contract). List variables with descriptions from that file.

## Git Hooks

Description of configured hooks and what each one does.

## CI/CD

Description of the continuous integration pipeline.
```

## How to execute this skill

### 1. Collect updated information

Read the following files to get the current state of the project:

- `package.json` — scripts, dependencies, and versions
- `.nvmrc` — Node.js version
- `.env.example` — environment variables (if present)
- `AGENTS.md` — project overview, contexts, and conventions
- `tsconfig.json` — TypeScript configuration
- `.githooks/` — configured git hooks
- `.github/workflows/` — CI/CD pipelines

### 2. Map the directory structure

List the directories and files inside `src/` to reflect the current folder tree. Include only relevant directories and files (ignore `node_modules`, `dist`, `coverage`).

### 3. Update README.md

Based on the collected information, update **only the sections that changed**. Do not rewrite sections that are already correct.

Rules:

- Write in English
- Be concise and direct
- Use tables for lists with more than 3 items (scripts, variables, technologies)
- Versions should come from `package.json` or `.nvmrc`, never hardcoded
- Commands should be copy-pasteable (code blocks with `bash`)
- Do not include speculative information — only document what already exists in the code

### 4. Validate

After updating the README.md, verify:

- All documented commands work (`pnpm install`, `pnpm test`, `pnpm lint`, `pnpm build`)
- The mentioned directory paths exist
- The technology versions are correct
