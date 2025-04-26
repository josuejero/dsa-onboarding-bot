// snapshot.js
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname);
const OUT_FILE = path.join(ROOT, 'snapshot.txt');
let output = '';

/**
 * List of files or directories (relative to ROOT) to exclude.
 */
const excludes = [
  'node_modules',
  'dist',
  'snapshot.txt',
  'snapshot.js',
  'output.json',
  'package-lock.json'
];

/** Normalize and test whether relPath should be skipped */
function isExcluded(relPath) {
  const normRel = relPath.replace(/\\/g, '/');
  return excludes.some(ex => {
    const normEx = ex.replace(/\\/g, '/').replace(/\/$/, '');
    return normRel === normEx || normRel.startsWith(normEx + '/');
  });
}

/**
 * Build a textual directory tree.
 */
function buildTree(dir, prefix = '') {
  const entries = fs.readdirSync(dir).filter(name => {
    const rel = path.relative(ROOT, path.join(dir, name));
    return !isExcluded(rel);
  });
  entries.forEach((name, idx) => {
    const full = path.join(dir, name);
    const isLast = idx === entries.length - 1;
    const pointer = isLast ? '└── ' : '├── ';
    output += `${prefix}${pointer}${name}\n`;
    if (fs.statSync(full).isDirectory()) {
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      buildTree(full, newPrefix);
    }
  });
}

// 1) Dump directory structure
output += `Project directory structure:\n`;
buildTree(ROOT);
output += `\n`;

// 2) Recursively walk and dump files
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, name);
    const relPath = path.relative(ROOT, fullPath);
    if (isExcluded(relPath)) continue;

    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
    } else {
      // include .js, package.json, .env
      if (name.endsWith('.js') || relPath === '.env' || relPath === 'package.json') {
        const content = fs.readFileSync(fullPath, 'utf8');
        output += `\n=== ${relPath} ===\n`;
        output += content + '\n';
      }
    }
  }
}

// Start from the project root
walk(ROOT);

// Write out the snapshot
fs.writeFileSync(OUT_FILE, output, 'utf8');
console.log(`Snapshot written to ${OUT_FILE} (excluded: ${excludes.join(', ')})`);
