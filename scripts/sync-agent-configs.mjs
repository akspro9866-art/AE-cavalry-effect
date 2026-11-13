import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveProjectRoot } from './lib/config.mjs';

const ROOT = resolveProjectRoot();
const CANONICAL_DIR = path.join(ROOT, 'agents', 'canonical');

const RULES_CANONICAL = path.join(CANONICAL_DIR, 'rules.md');
const WORKFLOW_AGENT_CANONICAL = path.join(CANONICAL_DIR, 'ae-cavalry-workflow-engineer.md');
const EFFECT_AGENT_CANONICAL = path.join(CANONICAL_DIR, 'ae-to-cavalry-effect-engineer.md');

export function getAgentSyncMappings(projectRoot = ROOT) {
    return [
        // Rules targets
        { src: RULES_CANONICAL, dst: path.join(projectRoot, 'AGENTS.md') },
        { src: RULES_CANONICAL, dst: path.join(projectRoot, '.cursorrules') },
        { src: RULES_CANONICAL, dst: path.join(projectRoot, '.cursor', 'rules', 'ae-effects.mdc') },
        { src: RULES_CANONICAL, dst: path.join(projectRoot, '.opencode', 'instructions.md') },
        { src: RULES_CANONICAL, dst: path.join(projectRoot, '.qoder', 'rules', 'AGENTS.md') },

        // Workflow Engineer Agent targets
        { src: WORKFLOW_AGENT_CANONICAL, dst: path.join(projectRoot, 'agents', 'ae-cavalry-workflow-engineer.md') },
        { src: WORKFLOW_AGENT_CANONICAL, dst: path.join(projectRoot, '.agents', 'agents', 'ae-cavalry-workflow-engineer.md') },
        { src: WORKFLOW_AGENT_CANONICAL, dst: path.join(projectRoot, '.qoder', 'agents', 'ae-cavalry-workflow-engineer.md') },

        // Effect Engineer Agent targets
        { src: EFFECT_AGENT_CANONICAL, dst: path.join(projectRoot, 'agents', 'ae-to-cavalry-effect-engineer.md') },
        { src: EFFECT_AGENT_CANONICAL, dst: path.join(projectRoot, '.agents', 'agents', 'ae-to-cavalry-effect-engineer.md') },
        { src: EFFECT_AGENT_CANONICAL, dst: path.join(projectRoot, '.qoder', 'agents', 'ae-to-cavalry-effect-engineer.md') },
    ];
}

export function syncAgentConfigs({ check = false, projectRoot = ROOT } = {}) {
    const mappings = getAgentSyncMappings(projectRoot);
    const diffs = [];

    for (const map of mappings) {
        if (!fs.existsSync(map.src)) {
            throw new Error(`Canonical agent source missing at ${map.src}`);
        }
        const srcContent = fs.readFileSync(map.src, 'utf8').replace(/\r\n/g, '\n');
        const dstExists = fs.existsSync(map.dst);
        const dstContent = dstExists ? fs.readFileSync(map.dst, 'utf8').replace(/\r\n/g, '\n') : '';

        if (!dstExists || srcContent !== dstContent) {
            diffs.push({ file: map.dst, exists: dstExists });
            if (!check) {
                fs.mkdirSync(path.dirname(map.dst), { recursive: true });
                fs.writeFileSync(map.dst, srcContent, 'utf8');
            }
        }
    }

    return {
        ok: diffs.length === 0,
        syncedCount: mappings.length - diffs.length,
        diffs,
    };
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
    const check = process.argv.includes('--check');
    const res = syncAgentConfigs({ check });
    console.log(JSON.stringify(res, null, 2));
    if (check && !res.ok) process.exit(1);
}
