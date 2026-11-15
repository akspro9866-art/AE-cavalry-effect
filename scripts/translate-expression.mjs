#!/usr/bin/env node
/**
 * AE expression → Cavalry rig translator CLI.
 *
 *   node scripts/translate-expression.mjs "wiggle(2, 40)" --target mg-iife
 *   node scripts/translate-expression.mjs "linear(time, 0, 1, 100, 500)" --target node-graph
 *   node scripts/translate-expression.mjs --file expression.js --target mg-iife \
 *        --attribute rotation --layer shape#3 --seed 7 --out dist/rig.json
 *
 * Targets:
 *   node-graph  raw Cavalry node graph JSON (default)
 *   mg-iife     self-contained single-shot _mg prelude IIFE block + node graph JSON
 *   baked       per-frame baked expression (fallback route)
 */

import fs from 'node:fs';
import path from 'node:path';
import { translateExpression } from './lib/lower-to-nodes.mjs';
import { toForwardSlashes } from './lib/config.mjs';

function parseArgs(argv) {
    const args = { target: 'node-graph' };
    const positional = [];
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--target') args.target = argv[++i];
        else if (arg === '--attribute') args.targetAttribute = argv[++i];
        else if (arg === '--layer') args.layerId = argv[++i];
        else if (arg === '--seed') args.seed = Number(argv[++i]);
        else if (arg === '--file') args.file = argv[++i];
        else if (arg === '--out') args.out = argv[++i];
        else if (arg === '--help' || arg === '-h') args.help = true;
        else positional.push(arg);
    }
    args.source = args.file ? fs.readFileSync(args.file, 'utf8') : positional.join(' ');
    return args;
}

const args = parseArgs(process.argv.slice(2));
if (args.help || !args.source?.trim()) {
    console.log('Usage: node scripts/translate-expression.mjs "<expression>" [--target node-graph|mg-iife|baked] [--attribute position] [--layer <id>] [--seed N] [--file <path>] [--out <path>]');
    process.exit(args.help ? 0 : 1);
}

try {
    const result = await translateExpression(args.source, args);
    const payload = result.target === 'mg-iife'
        ? { target: result.target, scriptId: result.scriptId, script: result.script, nodeGraph: result.nodeGraph }
        : result.target === 'baked'
            ? { target: result.target, expression: result.expression, baked: result.graph.baked }
            : { target: result.target, nodeGraph: result.nodeGraph };
    const serialized = JSON.stringify(payload, null, 2);
    if (args.out) {
        const outPath = path.resolve(args.out);
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, serialized, 'utf8');
        console.log(`[translate] target=${result.target} -> ${toForwardSlashes(outPath)}`);
    } else {
        console.log(serialized);
    }
} catch (error) {
    console.error(`[translate] failed: ${error.message}`);
    process.exit(1);
}
