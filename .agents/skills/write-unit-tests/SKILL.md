---
name: write-unit-tests
description: >-
  Writes or extends unit tests in TypeScript with Jest/ts-jest, aligned with
  Clean Architecture (domain, use cases, infra). Use when the user asks for unit
  tests, coverage for a class, stubs/mocks, or when creating `*.spec.ts` files
  in this repository.
disable-model-invocation: true
---

# Unit tests (finance-manager)

## Before writing code

1. Read the code under test and identify responsibilities (public API, side effects, `Result`).
2. Place the spec **next to** the source file: `Foo.spec.ts` alongside `Foo.ts` (project convention).
3. Run tests after implementing: `pnpm test` (or `pnpm test -- PathToSpec` to focus).

## Tooling and configuration

- **Runner**: Jest + ts-jest; `rootDir` is `src`; regex `.*\.spec\.ts$`.
- **Imports**: use the `@/…` alias like production code.
- **Environment**: `node` (no DOM).

## Test structure

- `describe('ClassOrFunctionName', () => { … })`.
- Nest `describe` blocks by method or behavior (`create()`, `execute()`, etc.).
- `it('should …', () => { … })` with a clear statement of expected behavior.
- **Arrange / Act / Assert**: set up data, invoke the unit, then `expect`.
- **Isolation**: `beforeEach` to reset mocks (`jest.fn().mockReset()` or `mockClear` as appropriate).

## Domain (entities, value objects, aggregates)

- No database, HTTP, or Prisma: instantiate or call static factories (`X.create()`, `Money.create()`).
- For types that return `Result`:
  - success: `expect(result.isSuccess).toBe(true)` and assertions on `result.value`;
  - failure: `expect(result.isFailure).toBe(true)` and `expect(result.errors[0].code).toBe(Errors.…)` (or the module’s equivalent).
- Cover happy paths, edge cases (zero, equality, reversed order), and explicit domain validation errors.

## Use cases

- External dependencies: **stubs/test doubles** (minimal subclass overriding the method) or typed `jest.fn()` when it fits.
- When validation fails **before** I/O, collaborators must **not** be invoked (`toHaveBeenCalledTimes(0)` / `not.toHaveBeenCalled()`).
- When the use case composes other services, assert DTO/output shape with `toEqual` on stable objects.

## Infrastructure (e.g., Prisma repository)

- Prefer mocking the **client** or the narrowest layer; test mapping and client calls, not real PostgreSQL.
- If the project has no established Prisma pattern, follow the existing spec in the same folder (imports, test names).

## Good practices

- One behavior per `it`; avoid overly long specs.
- Test names in English with `should …`, consistent with current specs.
- Do not test private details; test observable behavior.
- Avoid `any`; keep typing aligned with the code.

## Anti-patterns

- Disguised e2e tests (starting the app, real database) in a unit `*.spec.ts` file.
- Weak assertions (`expect(true).toBe(true)`) or “smoke-only” tests that skip domain invariants.
- Copying large chunks of production code just to “make the test work”—prefer extracting testable seams when needed (only when refactoring is explicitly in scope).

## Quick command reference

```bash
pnpm test
pnpm test -- Money.spec.ts
```

For system context details, see `AGENTS.md` at the repository root.
