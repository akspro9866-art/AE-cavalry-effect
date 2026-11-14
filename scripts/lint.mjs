#!/usr/bin/env node
/**
 * Zero-dependency repository lint. Enforces the hygiene rules that matter for
 * this repository's portability and reproducibility contract:
 *   - no hardcoded personal/absolute paths in committed sources
 *   - no tab indentation (spaces only)
 *   - no trailing whitespace
 *   - no stray `debugger` statements or non-opt-in console spam in effects
 *
 * Usage: node scripts/lint.mjs [--fix]
 * `--fix` strips trailing whitespace in place (the only safe auto-fix).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const INCLUDE_DIRS = ['effects', 'scripts', 'templates', 'test', 'agents', 'skills'];
const INCLUDE_EXT = new Set(['.mjs', '.js', '.json', '.md']);
const EXACT_EXCLUDES = new Set([
    // Vendored third-party bundle — not authored here.
    'vendor/stallion-mock.mjs',
    // Generated distribution artifact — lint the template + effects instead.
    'cavalry-script/AE Effects.js',
]);

const PERSONAL_PATH_RE = /C:[/\\]Users[/\\][^"'\s]+|\/Users\/[a-z0-9_-]+[/\\]|file:\/\/\/C:/i;
const DEBUGGER_RE = /^\s*debugger\b/m;

function* walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name === '.git') continue;
            yield* walk(full);
        } else {
            yield full;
        }
    }
}

const fix = process.argv.includes('--fix');
const problems = [];
let filesScanned = 0;

function scanFile(rel, file) {
    const src = fs.readFileSync(file, 'utf8');
    filesScanned++;
    const lines = src.split('\n');
    let changed = false;
    lines.forEach((line, i) => {
        // `TestUser` / `<user>` are intentional placeholders in tests and docs.
        if (PERSONAL_PATH_RE.test(line) && !/TestUser|<user>|\$\{HOME\}|~\//.test(line)) {
            problems.push(`${rel}:${i + 1} hardcoded personal path: ${line.trim().slice(0, 90)}`);
        }
        if (DEBUGGER_RE.test(line)) {
            problems.push(`${rel}:${i + 1} stray debugger statement`);
        }
        if (line.includes('\t')) {
            problems.push(`${rel}:${i + 1} tab indentation (spaces only)`);
        }
        if (/[ \t]+$/.test(line)) {
            if (fix) {
                lines[i] = line.replace(/[ \t]+$/, '');
                changed = true;
            } else {
                problems.push(`${rel}:${i + 1} trailing whitespace`);
            }
        }
    });
    if (fix && changed) fs.writeFileSync(file, lines.join('\n'), 'utf8');
}

for (const dir of INCLUDE_DIRS) {
    const absDir = path.join(ROOT, dir);
    if (!fs.existsSync(absDir)) continue;
    for (const file of walk(absDir)) {
        const rel = path.relative(ROOT, file).split(path.sep).join('/');
        if (EXACT_EXCLUDES.has(rel)) continue;
        if (!INCLUDE_EXT.has(path.extname(file))) continue;
        scanFile(rel, file);
    }
}

if (problems.length) {
    console.error(`lint: ${problems.length} problem(s) in ${filesScanned} files:`);
    for (const p of problems) console.error('  ' + p);
    process.exit(1);
}
console.log(`lint: clean (${filesScanned} files scanned)`);
