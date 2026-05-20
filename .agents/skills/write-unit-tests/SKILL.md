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

## Dependency isolation (critical rule)

**Test only the unit under test. Every dependency it calls must be mocked.**

If `funA()` calls `funB()` internally, the test for `funA()` must mock `funB()` — it must never let `funB()` actually run. Letting a real dependency execute means the test is verifying the dependency's behavior, not `funA()`'s. When `funB()` breaks, `funA()`'s tests must not break.

```ts
// jest.mock must be at the top of the file — Jest hoists it before any import
import { funA } from '@/path/to/funA';
import { funB } from '@/path/to/funB';

jest.mock('@/path/to/funB');

// WRONG — funB runs for real (jest.mock is missing)
describe('funA', () => {
  it('should do X', async () => {
    const result = await funA(input); // funB executes internally
  });
});

// CORRECT — jest.mock replaces the module; jest.mocked gives a typed reference
describe('funA', () => {
  const mockFunB = jest.mocked(funB);

  beforeEach(() => {
    mockFunB.mockReset();
    mockFunB.mockResolvedValue(someFakeReturn);
  });

  it('should do X', async () => {
    const result = await funA(input);
    expect(mockFunB).toHaveBeenCalledWith(expectedArgs);
    expect(result).toEqual(expectedOutput);
  });

  it('should not call funB when validation fails', async () => {
    const result = await funA(invalidInput);
    expect(mockFunB).not.toHaveBeenCalled();
  });
});
```

What to assert on mocked dependencies:
- **Called**: `expect(mock).toHaveBeenCalledTimes(1)` / `toHaveBeenCalledWith(…)` — verify the unit delegates correctly.
- **Not called**: `expect(mock).not.toHaveBeenCalled()` — verify the unit skips the call when it should (e.g., validation failure path).
- **Never assert the return value of a mock as if it proves real behavior** — that only proves the mock was set up.

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

- Every injected dependency (repositories, services, event buses, etc.) must be a `jest.fn()` mock or a minimal stub — never the real implementation.
- Set the mock's return value to a controlled fake **before** calling `execute()`. This keeps the test deterministic and scoped to the use case's own logic.
- When validation fails **before** I/O, collaborators must **not** be invoked (`expect(mock).not.toHaveBeenCalled()`).
- When the use case delegates to another service, assert: (a) the delegate was called with the right arguments and (b) the use case returns/emits the expected output — not what the delegate does internally.
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

- **Letting dependencies run for real** inside a unit test — if `funA` calls `funB`, always mock `funB`. Otherwise the test is an accidental integration test and breaks for the wrong reasons.
- **Not asserting on mocks** — setting up a mock but never verifying it was called (or not called) leaves the interaction contract untested.
- Disguised e2e tests (starting the app, real database) in a unit `*.spec.ts` file.
- Weak assertions (`expect(true).toBe(true)`) or “smoke-only” tests that skip domain invariants.
- Copying large chunks of production code just to “make the test work”—prefer extracting testable seams when needed (only when refactoring is explicitly in scope).

## Quick command reference

```bash
pnpm test
pnpm test -- Money.spec.ts
```

For system context details, see `AGENTS.md` at the repository root.
