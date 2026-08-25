import * as fs from 'fs';
import * as path from 'path';

interface ActionChange {
  pkg: string;
  from: string | null;
  to: string | null;
  section: string;
  kind: 'changed' | 'added' | 'removed';
}

const ACTION_RE =
  /uses:\s*['"]?([a-zA-Z0-9\-_.]+\/[a-zA-Z0-9\-_.]+(?:\/[a-zA-Z0-9\-_.]+)*)@(['"]?[a-zA-Z0-9\-_.]+)/;

/**
 * Parses a YAML workflow file and extracts all GitHub Action references
 * in the format `owner/repo@ref` (or `owner/repo/path@ref`).
 *
 * @param content - raw YAML file content.
 * @returns a Map keyed by action reference (without the `@ref` suffix)
 *   mapping to the version/tag used.
 */
function extractActions(content: string): Map<string, string> {
  const actions = new Map<string, string>();
  for (const line of content.split('\n')) {
    const match = line.match(ACTION_RE);
    if (match) {
      const ref = match[2].replace(/^['"]|['"]$/g, '');
      actions.set(match[1], ref);
    }
  }
  return actions;
}

/**
 * Lists all workflow YAML files inside `.github/workflows/` of the given
 * directory, returning their absolute paths.
 *
 * @param dir - root directory (e.g. `/tmp/base_dir` or the repo root).
 * @returns sorted array of `.yml` / `.yaml` file paths, or an empty array
 *   if the workflows directory does not exist.
 */
function collectWorkflowFiles(dir: string): string[] {
  const workflowsDir = path.join(dir, '.github', 'workflows');
  if (!fs.existsSync(workflowsDir)) return [];
  return fs
    .readdirSync(workflowsDir)
    .filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))
    .map((f) => path.join(workflowsDir, f));
}

const baseDir = process.env.BASE_DIR || '/tmp/base_dir';
const headDir = process.env.HEAD_DIR || '/tmp/head_dir';

const baseFiles = new Map<string, Map<string, string>>();
const headFiles = new Map<string, Map<string, string>>();

for (const filePath of collectWorkflowFiles(baseDir)) {
  const rel = path.relative(baseDir, filePath);
  baseFiles.set(rel, extractActions(fs.readFileSync(filePath, 'utf8')));
}

for (const filePath of collectWorkflowFiles(headDir)) {
  const rel = path.relative(headDir, filePath);
  headFiles.set(rel, extractActions(fs.readFileSync(filePath, 'utf8')));
}

const allFiles = new Set([...baseFiles.keys(), ...headFiles.keys()]);

const changes: ActionChange[] = [];
const seen = new Set<string>();

for (const file of allFiles) {
  const baseActions = baseFiles.get(file) || new Map();
  const headActions = headFiles.get(file) || new Map();

  const allActions = new Set([...baseActions.keys(), ...headActions.keys()]);

  for (const action of allActions) {
    if (seen.has(action)) continue;
    seen.add(action);

    const baseRef = baseActions.get(action);
    const headRef = headActions.get(action);

    if (baseRef && headRef && baseRef !== headRef) {
      changes.push({
        pkg: action,
        from: baseRef,
        to: headRef,
        section: 'workflow',
        kind: 'changed',
      });
    } else if (!baseRef && headRef) {
      changes.push({
        pkg: action,
        from: null,
        to: headRef,
        section: 'workflow',
        kind: 'added',
      });
    } else if (baseRef && !headRef) {
      changes.push({
        pkg: action,
        from: baseRef,
        to: null,
        section: 'workflow',
        kind: 'removed',
      });
    }
  }
}

if (changes.length === 0) {
  if (fs.existsSync('/tmp/action_changes.json')) {
    fs.unlinkSync('/tmp/action_changes.json');
  }
  console.log('NO_CHANGES');
  process.exit(0);
}

fs.writeFileSync('/tmp/action_changes.json', JSON.stringify(changes, null, 2));
console.log('CHANGES_FOUND');
changes.forEach((c) =>
  console.log(
    `  ${c.pkg}: ${c.from || '(new)'} -> ${c.to || '(removed)'} (${c.section}, ${c.kind})`,
  ),
);
