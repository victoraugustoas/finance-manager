# Design

## Context

See proposal.md for motivation. The project default schema is the package `spec-driven` (`proposal → specs → design → tasks`). Artifact ids are free-form; a project-local schema resolves from `openspec/schemas/<name>/schema.yaml` ahead of the package. `openspec validate` ignores a non-`.md` file beside `spec.md`. It rejects another `.md` under `specs/` only when that file carries a delta section. `skip_specs: true` marks every artifact whose `generates` starts with `specs/` as skipped and forbids files in that tree.

The archive CLI merges only `spec.md`. `operations.archive.guidance` in `openspec/config.yaml` is injected into `openspec instructions archive` and the archive skill follows it when it does not conflict with the built-in sync and move. There are no domain specs yet. This change stays on `spec-driven` with `skip_specs: true`.

## Goals / Non-Goals

**Goals:**

- Make a forked schema the default for changes created after this one.
- Put a conditional BPMN artifact in the apply closure, so propose writes it when a capability's delta changes or retires a process.
- Keep the living diagram as `openspec/specs/<capability>/process.bpmn`, replaced or removed only when spec sync runs.
- Produce BPMN 2.0 XML that opens in bpmn.io, and an SVG picture of that same diagram.

**Non-Goals:**

- Rendering to PNG, executable BPMN, lanes, or a collaboration with more than one participant.
- Teaching the `openspec archive` CLI to merge XML.
- A runtime dependency of the Nest app on bpmn-js. The viewer is a devDependency used by `pnpm bpmn:svg`.
- Domain specs for the finance manager.
- Switching this change itself onto the new schema.

## Decisions

### Fork `spec-driven` as `spec-driven-bpmn`

Run `openspec schema fork spec-driven spec-driven-bpmn`. Set `schema: spec-driven-bpmn` in `openspec/config.yaml`.

A config `rules` entry can advise an existing artifact. It cannot add one. Editing the package schema would vanish on the next CLI upgrade. A fork keeps the four current artifacts and adds `bpmn`.

The fork does not track upstream `spec-driven`. After an OpenSpec upgrade, port instruction changes from the package schema by hand. `openspec schema validate spec-driven-bpmn` checks the fork structure.

### Artifact graph

```
proposal
   |
   +--> specs --+--> bpmn --+
   |                        |
   +--> design -------------+--> tasks
```

- `bpmn` generates `specs/**/process.*`, template `process.bpmn`, requires `specs`.
- `tasks` requires `specs`, `design`, and `bpmn`.

`generates` has to sit under `specs/` so a `skip_specs` change skips the artifact and must not contain `process.bpmn` or `process.retired`. The glob matches either file, so one of them marks the artifact done. The instruction still requires one verdict per capability in the change. The same gap already exists for `specs/**/*.md`.

The artifact instruction uses the conditional form ("create only if"), same as `design`. Create it when at least one capability's delta changes or retires a process. Otherwise skip it. Propose may still write `tasks`: a conditional dependency does not block its dependents.

**Changes the process** when the delta adds, reorders, or removes an activity or a path, changes the start or end, or changes the name or gateway condition of a step already drawn. The last case keeps the living XML from describing a step the spec no longer names.

**Does not change the process** when the delta only touches an invariant, query, filter, total, or data shape with no corresponding activity or path.

Per capability:

| Verdict | Files in the change |
|---|---|
| Changed | `specs/<capability>/process.bpmn` (full process after the change) and `process.svg` from `pnpm bpmn:svg` |
| Retired | `specs/<capability>/process.retired` (one line: why the process ended). No `process.bpmn` or `process.svg` for that capability |
| Unchanged | neither file |

Both files for the same capability is a conflict. The agent stops and fixes the change before archive.

A later change reads `openspec/specs/<capability>/process.bpmn` when it exists and preserves the `id` of every element whose step did not change. New steps get new ids.

### XML profile

One file, one `<process>`, `isExecutable="false"`. The process id is the capability path with `/` replaced by `-`. Elements are `startEvent`, `endEvent`, `task`, `exclusiveGateway`, and `sequenceFlow`. Task and flow names follow the wording of the requirements and scenarios. No lanes and no `participant`.

Include BPMNDI (`bpmndi`, `dc`, `di`) with left-to-right bounds. Semantic XML without the diagram interchange is valid BPMN and opens as an empty canvas in bpmn.io.

`pnpm bpmn:svg -- <file.bpmn>` opens the file in bpmn-js (headless Chromium) and writes `process.svg` from `saveSVG`. The same import is the validation: the command fails when `importXML` throws or returns warnings, and no SVG is written. The agent does not draw the SVG. A `.bpmn` without a sibling `.svg` is incomplete, and archive refuses to promote it. Retirement deletes both living files and removes the image link from the living spec Purpose. `bpmn-js` and `puppeteer` are devDependencies. The Nest app does not import them. The CLI in `scripts/bpmn-to-svg.mjs` only launches the viewer, checks the import, and prints the Markdown image link.

The SVG is a normal Markdown image. In the same directory the link is `![<process name>](process.svg)`, and that line lives in `## Purpose` so archive keeps it: the rebuilt spec is title, Purpose, and Requirements, and any other `##` section is dropped. A new capability puts the line in the delta Purpose. An existing capability edits `openspec/specs/<capability>/spec.md` directly, because a Purpose in the delta is ignored. `pnpm bpmn:svg -- <file.bpmn> --from <file.md>` prints the same link with a path relative to that markdown file.

A second `<process>` in the same file is allowed only when the spec describes two sequences that do not share a start. The template shipped with the fork is a minimal valid document: namespaces, an empty process, a start event connected to an end event, and diagram bounds for those two shapes.

### Archive promotes the file only together with spec sync

Add `operations.archive.guidance` to `openspec/config.yaml`. The skill already loads that list. The guidance:

- After spec sync has been verified and before `mv` of the change directory, walk each capability path in the change's `specs/` tree.
- `process.bpmn` and `process.retired` together: stop, do not archive.
- `process.bpmn` together with `process.svg`: copy both onto `openspec/specs/<capability>/`, replacing the previous files. `process.bpmn` without `process.svg` stops the archive.
- `process.retired` only: delete `openspec/specs/<capability>/process.bpmn` and `process.svg` when they exist.
- Neither file: leave the living diagram and its SVG as they are.
- Archive without spec sync: do not copy or delete living diagrams. The XML and the SVG stay inside the archived change.

Absence cannot mean deletion. The proposal treats a missing file as "leave the living diagram alone", so retirement needs `process.retired`.

Editing the living file during the change was rejected. An abandoned change would mutate the current process before archive. The change carries the full next XML, and promotion happens at sync, same moment the spec becomes current.

## Risks / Trade-offs

- [Fork drifts from package `spec-driven` after a CLI upgrade] → Re-read the package schema when upgrading OpenSpec and port instruction edits into `openspec/schemas/spec-driven-bpmn` before new changes are created.
- [A change that does not touch a process leaves `bpmn` as `ready`, so archive asks for confirmation] → Accepted. Same prompt `design` already produces when `design.md` is omitted. `skip_specs` changes do not hit this, because the artifact is `skipped`.
- [One matching file marks `bpmn` done even if another capability was missed] → The instruction states one verdict per capability. Review of the change is the check. No CI validator.
- [`openspec archive` on the CLI never copies XML] → Promotion lives in archive guidance used by the skill. Document that in the README convention note.
- [Hand-written BPMNDI can be valid and still look wrong] → Bounds only need to be non-overlapping and left-to-right so the file opens. Visual polish is out of scope.
- [Agent judgment of "changes the process" can drift from the scenarios] → The criterion above is the instruction text. The diagram is not a second spec; the `spec.md` remains the contract.

## Migration Plan

1. Fork the schema and add the `bpmn` artifact, the `tasks` dependency, the instruction, and `templates/process.bpmn`.
2. Point `openspec/config.yaml` at `spec-driven-bpmn` and add the archive guidance.
3. Run `openspec schema validate spec-driven-bpmn`.
4. Note the convention in the README: where `process.bpmn` lives, when it is written, and that CLI archive does not promote it.

No domain spec is rewritten. This change does not create a `process.bpmn`.

Rollback: set `schema: spec-driven` in `openspec/config.yaml` and remove the archive guidance. Changes already created with `spec-driven-bpmn` keep that schema in their `.openspec.yaml`. Delete `openspec/schemas/spec-driven-bpmn` only after those changes are archived or moved back.
