import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testDir = path.resolve(__dirname, '..', 'test');

const testFiles = fs
    .readdirSync(testDir)
    .filter((f) => f.endsWith('.test.mjs'))
    .sort()
    .map((f) => path.join(testDir, f));

const result = spawnSync(process.execPath, ['--test', ...testFiles], {
    stdio: 'inherit',
    env: process.env,
});

process.exit(result.status ?? 0);
