import * as fs from 'fs';

interface PnpmDependencyItem {
  from?: string;
  version?: string;
}

interface PnpmListResult {
  dependencies?: Record<string, PnpmDependencyItem>;
  devDependencies?: Record<string, PnpmDependencyItem>;
  peerDependencies?: Record<string, PnpmDependencyItem>;
  optionalDependencies?: Record<string, PnpmDependencyItem>;
  packageManager?: string;
  engines?: Record<string, string> | string;
  [key: string]: unknown;
}

interface DependencyChange {
  pkg: string;
  from: string | null;
  to: string | null;
  section: string;
  kind: 'changed' | 'added' | 'removed' | 'lockfile-bump';
  specifier?: string | null;
}

const basePkgList: PnpmListResult =
  (JSON.parse(fs.readFileSync('/tmp/base_list.json', 'utf8')) as PnpmListResult[])[0] || {};
const headPkgList: PnpmListResult =
  (JSON.parse(fs.readFileSync('/tmp/head_list.json', 'utf8')) as PnpmListResult[])[0] || {};

const changes: DependencyChange[] = [];

const depSections = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
] as const;

for (const section of depSections) {
  const b = basePkgList[section] || {};
  const h = headPkgList[section] || {};

  for (const pkg of Object.keys(h)) {
    const baseItem = b[pkg];
    const headItem = h[pkg];

    if (baseItem && baseItem.version !== headItem.version) {
      changes.push({
        pkg,
        from: baseItem.version ?? null,
        to: headItem.version ?? null,
        section,
        kind: 'changed',
      });
    } else if (!baseItem && headItem) {
      changes.push({
        pkg,
        from: null,
        to: headItem.version ?? null,
        section,
        kind: 'added',
      });
    }
  }

  for (const pkg of Object.keys(b)) {
    const baseItem = b[pkg];
    const headItem = h[pkg];

    if (!headItem && baseItem) {
      changes.push({
        pkg,
        from: baseItem.version ?? null,
        to: null,
        section,
        kind: 'removed',
      });
    }
  }
}

for (const field of ['packageManager', 'engines'] as const) {
  const b = basePkgList[field];
  const h = headPkgList[field];
  if ((b || null) !== (h || null) && (b || h)) {
    changes.push({
      pkg: field,
      from: b == null ? null : String(b),
      to: h == null ? null : String(h),
      section: 'root',
      kind: b == null ? 'added' : h == null ? 'removed' : 'changed',
    });
  }
}

if (changes.length === 0) {
  if (fs.existsSync('/tmp/dep_changes.json')) {
    fs.unlinkSync('/tmp/dep_changes.json');
  }
  console.log('NO_CHANGES');
  process.exit(0);
}

fs.writeFileSync('/tmp/dep_changes.json', JSON.stringify(changes, null, 2));
console.log('CHANGES_FOUND');
changes.forEach((c) =>
  console.log(
    `  ${c.pkg}: ${c.from || '(new)'} -> ${c.to || '(removed)'} (${c.section}, ${c.kind})`,
  ),
);
