import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const workspaceRoot = process.cwd();
const srcRoot = path.join(workspaceRoot, 'src');

const commercialRoots = [
  path.join(srcRoot, 'components', 'Comercialpublico2', 'src'),
  path.join(srcRoot, 'components', 'Comercialprivado2', 'src'),
];

const globalSupabaseTargets = [
  path.join(srcRoot, 'lib', 'supabase.ts'),
  path.join(srcRoot, 'lib', 'supabase.tsx'),
  path.join(srcRoot, 'lib', 'supabase.js'),
  path.join(srcRoot, 'lib', 'supabase', 'index.ts'),
  path.join(srcRoot, 'lib', 'supabase', 'index.tsx'),
  path.join(srcRoot, 'lib', 'supabase', 'index.js'),
].map((p) => path.normalize(p));

const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

function walkFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
      continue;
    }

    if (sourceExtensions.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

function toPosixRelative(absPath) {
  return path.relative(workspaceRoot, absPath).split(path.sep).join('/');
}

function normalizeSpecifier(specifier) {
  return specifier.replaceAll('\\\\', '/').trim();
}

function isAliasToGlobalSupabase(specifier) {
  const normalized = normalizeSpecifier(specifier);
  return normalized === '@/lib/supabase' || normalized === '@/lib/supabase.ts' || normalized === 'src/lib/supabase';
}

function tryResolveSpecifier(filePath, specifier) {
  if (!specifier.startsWith('.')) return null;

  const basePath = path.resolve(path.dirname(filePath), specifier);
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    path.join(basePath, 'index.ts'),
    path.join(basePath, 'index.tsx'),
    path.join(basePath, 'index.js'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return path.normalize(candidate);
    }
  }

  return null;
}

function extractImports(content) {
  const regex = /(?:import|export)\s+(?:[^'";]+?\s+from\s+)?["']([^"']+)["']/g;
  const matches = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    const specifier = match[1];
    const before = content.slice(0, match.index);
    const line = before.split('\n').length;
    matches.push({ specifier, line });
  }

  return matches;
}

function main() {
  const violations = [];

  for (const root of commercialRoots) {
    if (!fs.existsSync(root)) continue;
    const files = walkFiles(root);

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf8');
      const imports = extractImports(content);

      for (const { specifier, line } of imports) {
        if (isAliasToGlobalSupabase(specifier)) {
          violations.push({
            filePath,
            line,
            specifier,
            reason: 'Alias aponta para src/lib/supabase (cliente global).',
          });
          continue;
        }

        const resolved = tryResolveSpecifier(filePath, specifier);
        if (!resolved) continue;

        if (globalSupabaseTargets.includes(resolved)) {
          violations.push({
            filePath,
            line,
            specifier,
            reason: 'Import relativo resolve para src/lib/supabase (cliente global).',
          });
        }
      }
    }
  }

  if (violations.length === 0) {
    console.log('✅ DB isolation check passed: nenhum import indevido de src/lib/supabase nos módulos comerciais.');
    process.exit(0);
  }

  console.error('❌ DB isolation check failed. Imports indevidos encontrados:\n');
  for (const violation of violations) {
    console.error(`- ${toPosixRelative(violation.filePath)}:${violation.line}`);
    console.error(`  import: ${violation.specifier}`);
    console.error(`  motivo: ${violation.reason}`);
  }

  console.error('\nAjuste para usar o wrapper local do módulo (ex.: ../lib/supabase) ou getDatabase(modulo).');
  process.exit(1);
}

main();
