#!/usr/bin/env node
/**
 * One-off port: copies .legacy-ref bounded contexts into src/modules layout
 * and rewrites common import paths to the Genérico kernel.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const legacyRoot = path.join(root, '.legacy-ref');

const contextMap = {
  accounts: 'account',
  category: 'category',
  transactions: 'transaction',
  reporting: 'reporting',
};

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith('.ts')) files.push(full);
  }
  return files;
}

function rewrite(content, moduleName) {
  let s = content;
  s = s.replace(/from '@\/shared\/base'/g, "from '@/shared/base/result'");
  s = s.replace(/from '@\/shared\/base\/Result'/g, "from '@/shared/base/result'");
  s = s.replace(/from '@\/shared\/base\/AggregateRoot'/g, "from '@/shared/base/aggregate-root'");
  s = s.replace(/from '@\/shared\/base\/Entity'/g, "from '@/shared/base/entity'");
  s = s.replace(/from '@\/shared\/base\/Errors'/g, "from '@/shared/errors/legacy-error-codes'");
  s = s.replace(/from '@\/shared\/base\/CommandHandler'/g, "from '@/shared/base/UseCase'");
  s = s.replace(/from '@\/shared\/base\/QueryHandler'/g, "from '@/shared/base/UseCase'");
  s = s.replace(/from '@\/shared\/ValueObjects'/g, "from '@/shared/value-objects/money-compat'");
  s = s.replace(/from '@\/shared\/ValueObjects\/Money'/g, "from '@/shared/value-objects/money-compat'");
  s = s.replace(
    /from '@\/shared\/infra\/MapResultErrorToHttpException'/g,
    "from '@/shared/infra/map-result-error-to-http-exception'",
  );
  s = s.replace(/MapResultErrorToHttpException/g, 'MapResultErrorToHttpException');

  for (const [legacy, mod] of Object.entries(contextMap)) {
    s = s.replaceAll(`@/${legacy}/`, `@/modules/${mod}/`);
  }

  s = s.replace(/implements CommandHandler<([^,]+),\s*([^>]+)>/g, 'implements UseCase<$1, $2>');
  s = s.replace(/implements QueryHandler<([^,]+),\s*([^>]+)>/g, 'implements UseCase<$1, $2>');
  s = s.replace(/async handle\(/g, 'async execute(');

  return s;
}

function targetPath(legacyContext, relFromContext) {
  const moduleName = contextMap[legacyContext];
  const base = path.join(root, 'src', 'modules', moduleName);

  if (relFromContext.startsWith('core/model/')) {
    const file = path.basename(relFromContext).replace(/\.ts$/, '');
    const kebab = file.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    return path.join(base, moduleName, 'model', `${kebab}.entity.ts`);
  }
  if (relFromContext.startsWith('core/commands/')) {
    const parts = relFromContext.split('/');
    const handler = parts[2];
    const kebab = handler.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    return path.join(base, moduleName, 'use-case', `${kebab}.use-case.ts`);
  }
  if (relFromContext.startsWith('core/queries/')) {
    const parts = relFromContext.split('/');
    const name = parts[2];
    const kebab = name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    return path.join(base, moduleName, 'provider', `${kebab}.query.ts`);
  }
  if (relFromContext.includes('core/ports/repositories')) {
    return path.join(base, moduleName, 'provider', `${moduleName}.repository.ts`);
  }
  if (relFromContext.includes('core/ports/readers')) {
    const baseName = path.basename(relFromContext, '.ts');
    const kebab = baseName.replace(/Reader$/, '').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    return path.join(base, moduleName, 'provider', `${kebab}.query.ts`);
  }
  if (relFromContext.includes('infra/database/repositories')) {
    return path.join(base, 'infra', moduleName, 'provider', `prisma-${moduleName}.repository.ts`);
  }
  if (relFromContext.includes('infra/database/readers')) {
    const baseName = path.basename(relFromContext, '.ts').replace(/^Prisma/, '');
    const kebab = baseName.replace(/Reader$/, '').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    return path.join(base, 'infra', moduleName, 'provider', `prisma-${kebab}.query.ts`);
  }
  if (relFromContext.includes('infra/controllers')) {
    return path.join(base, 'infra', moduleName, `${moduleName}.controller.ts`);
  }
  if (relFromContext.includes('infra/dtos')) {
    const baseName = path.basename(relFromContext, '.ts');
    const kebab = baseName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    return path.join(base, 'infra', moduleName, 'dto', `${kebab}.http.dto.ts`);
  }
  if (relFromContext.includes('infra/module')) {
    return path.join(base, 'infra', `${moduleName}.module.ts`);
  }
  if (relFromContext.includes('core/service')) {
    const parts = relFromContext.split('/');
    const svc = parts[parts.length - 1].replace('.ts', '');
    const kebab = svc.replace(/\.service$/, '').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    return path.join(base, moduleName, 'service', `${kebab}.service.ts`);
  }

  return null;
}

for (const legacyContext of Object.keys(contextMap)) {
  const ctxDir = path.join(legacyRoot, legacyContext);
  if (!fs.existsSync(ctxDir)) continue;

  for (const file of walk(ctxDir)) {
    const rel = path.relative(ctxDir, file);
    if (rel.endsWith('.spec.ts')) continue;
    if (rel.includes('/commands/') && !rel.endsWith('.handler.ts') && !rel.endsWith('.command.ts')) continue;
    if (rel.includes('/queries/') && !rel.endsWith('.handler.ts') && !rel.endsWith('.query.ts') && !rel.endsWith('.result.ts')) continue;

    const dest = targetPath(legacyContext, rel);
    if (!dest) continue;

    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const raw = fs.readFileSync(file, 'utf8');
    fs.writeFileSync(dest, rewrite(raw, contextMap[legacyContext]));
    console.log('ported', rel, '->', path.relative(root, dest));
  }
}

console.log('done');
