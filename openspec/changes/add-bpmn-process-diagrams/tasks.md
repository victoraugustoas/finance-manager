# Tasks

## 1. Schema fork

- [x] 1.1 Fork `spec-driven` to `spec-driven-bpmn` and verify `openspec/schemas/spec-driven-bpmn/schema.yaml` exists
- [x] 1.2 Add the conditional `bpmn` artifact and make `tasks` require it, then verify `openspec schema validate spec-driven-bpmn` succeeds
- [x] 1.3 Add `templates/process.bpmn` as a minimal BPMN 2.0 document with diagram bounds, and verify the file is well-formed XML

## 2. Project default and archive

- [x] 2.1 Point `openspec/config.yaml` at `spec-driven-bpmn` and add archive guidance that promotes or retires `process.bpmn` only after spec sync, then verify `openspec instructions archive --change add-bpmn-process-diagrams --json` returns that guidance
- [x] 2.2 Document in the README where `process.bpmn` lives, when a change writes it, and that `openspec archive` on the CLI does not promote it, and verify the Conventions section states those three facts

## 3. Diagram image

- [x] 3.1 Render `process.svg` from `process.bpmn` with `pnpm bpmn:svg`, and verify `pnpm test` covers the template, a task with a gateway, and a sibling `.svg` write
- [x] 3.2 Print a Markdown image link for `process.svg`, including a path relative to another `.md` via `--from`, and verify the script spec expects `![process](process.svg)` and `![Transfer](specs/transfer/process.svg)`
- [x] 3.3 Validate each `.bpmn` with bpmn-js `importXML` and write `process.svg` from `saveSVG`, and verify the script spec accepts the template and rejects a diagram with a missing target
