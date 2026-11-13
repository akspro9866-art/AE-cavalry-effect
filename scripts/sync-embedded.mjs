import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const effectsDir = path.join(ROOT, 'effects');

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

for (const slug of fs.readdirSync(effectsDir)) {
    const effectFolder = path.join(effectsDir, slug);
    if (!fs.statSync(effectFolder).isDirectory()) continue;

    const implPath = path.join(effectFolder, 'implementation.js');
    if (!fs.existsSync(implPath)) continue;

    let impl = fs.readFileSync(implPath, 'utf8');

    // Check for SKSL file
    const skslCandidate1 = path.join(effectFolder, `${slug}.sksl`);
    if (fs.existsSync(skslCandidate1) && impl.includes('/* @@BEGIN_SKSL@@ */')) {
        const skslSource = fs.readFileSync(skslCandidate1, 'utf8');
        impl = replaceBlock(impl, '/* @@BEGIN_SKSL@@ */', '/* @@END_SKSL@@ */', 'SKSL_SOURCE', skslSource, implPath);
    }

    // Check for Deformer file
    const deformerCandidate1 = path.join(effectFolder, `${slug}.deformer.js`);
    if (fs.existsSync(deformerCandidate1) && impl.includes('/* @@BEGIN_DEFORMER@@ */')) {
        const deformerSource = fs.readFileSync(deformerCandidate1, 'utf8');
        impl = replaceBlock(impl, '/* @@BEGIN_DEFORMER@@ */', '/* @@END_DEFORMER@@ */', 'DEFORMER_SOURCE', deformerSource, implPath);
    }

    fs.writeFileSync(implPath, impl, 'utf8');
    console.log(`Synced embedded sources into effects/${slug}/implementation.js`);
}
