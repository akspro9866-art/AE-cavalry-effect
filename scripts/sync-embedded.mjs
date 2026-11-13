import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveProjectRoot } from './lib/config.mjs';

const ROOT = resolveProjectRoot();
const EFFECTS_DIR = path.join(ROOT, 'effects');

const replaceBlock = (text, beginMarker, endMarker, varName, payload, filePath) => {
    const startIdx = text.indexOf(beginMarker);
    const endIdx = text.indexOf(endMarker);
    if (startIdx < 0 || endIdx < 0 || endIdx <= startIdx) {
        throw new Error(`Missing markers ${beginMarker} .. ${endMarker} in ${filePath}`);
    }
    const before = text.slice(0, startIdx + beginMarker.length);
    const after = text.slice(endIdx);
    const literal = `\n    var ${varName} = ${JSON.stringify(payload)};\n    `;
    return `${before}${literal}${after}`;
};

export function syncEmbeddedSources({ check = false, libraryRoot = ROOT } = {}) {
    const effDir = path.join(libraryRoot, 'effects');
    const regPath = path.join(libraryRoot, 'effect-registry.json');
    if (!fs.existsSync(regPath)) {
        throw new Error(`effect-registry.json not found at ${regPath}`);
    }
    const registry = JSON.parse(fs.readFileSync(regPath, 'utf8'));

    const diffs = [];
    const synced = [];

    for (const [slug, entry] of Object.entries(registry.effects || {})) {
        const effectFolder = path.join(effDir, slug);
        if (!fs.existsSync(effectFolder)) {
            throw new Error(`Effect directory missing for registered effect "${slug}" at ${effectFolder}`);
        }

        const implPath = path.join(effectFolder, 'implementation.js');
        if (!fs.existsSync(implPath)) {
            throw new Error(`implementation.js missing for effect "${slug}" at ${implPath}`);
        }

        const originalImpl = fs.readFileSync(implPath, 'utf8').replace(/\r\n/g, '\n');
        let updatedImpl = originalImpl;

        // Check for SKSL file
        const skslCandidate = path.join(effectFolder, `${slug}.sksl`);
        if (fs.existsSync(skslCandidate) && originalImpl.includes('/* @@BEGIN_SKSL@@ */')) {
            const skslSource = fs.readFileSync(skslCandidate, 'utf8').replace(/\r\n/g, '\n');
            updatedImpl = replaceBlock(updatedImpl, '/* @@BEGIN_SKSL@@ */', '/* @@END_SKSL@@ */', 'SKSL_SOURCE', skslSource, implPath);
        }

        // Check for Deformer file
        const deformerCandidate = path.join(effectFolder, `${slug}.deformer.js`);
        if (fs.existsSync(deformerCandidate) && originalImpl.includes('/* @@BEGIN_DEFORMER@@ */')) {
            const deformerSource = fs.readFileSync(deformerCandidate, 'utf8').replace(/\r\n/g, '\n');
            updatedImpl = replaceBlock(updatedImpl, '/* @@BEGIN_DEFORMER@@ */', '/* @@END_DEFORMER@@ */', 'DEFORMER_SOURCE', deformerSource, implPath);
        }

        if (originalImpl !== updatedImpl) {
            diffs.push({ slug, file: implPath });
            if (!check) {
                fs.writeFileSync(implPath, updatedImpl, 'utf8');
                synced.push(slug);
            }
        } else {
            synced.push(slug);
        }
    }

    return {
        ok: diffs.length === 0,
        syncedCount: synced.length,
        diffs,
    };
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
    const check = process.argv.includes('--check');
    const res = syncEmbeddedSources({ check });
    console.log(JSON.stringify(res, null, 2));
    if (check && !res.ok) process.exit(1);
}
