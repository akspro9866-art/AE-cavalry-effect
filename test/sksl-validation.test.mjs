import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'effect-registry.json'), 'utf8'));

/**
 * Collects every registered SkSL shader artifact.
 */
function collectShaders() {
    const shaders = [];
    for (const [slug, entry] of Object.entries(registry.effects)) {
        const skslRel = entry.artifacts && entry.artifacts.sksl;
        if (!skslRel) continue;
        const abs = path.join(ROOT, skslRel);
        assert.ok(fs.existsSync(abs), `Registered shader missing on disk: ${skslRel}`);
        shaders.push({ slug, abs, source: fs.readFileSync(abs, 'utf8') });
    }
    return shaders;
}

/**
 * Checks balanced delimiters outside comments. SkSL sources in this repo are
 * comment + code only (no string literals), so a comment-aware scan suffices.
 */
function findUnbalancedDelimiter(source) {
    let inBlockComment = false;
    let inLineComment = false;
    const stack = [];
    const pairs = { '}': '{', ')': '(', ']': '[' };
    for (let i = 0; i < source.length; i++) {
        const ch = source[i];
        const next = source[i + 1];
        if (inLineComment) {
            if (ch === '\n') inLineComment = false;
            continue;
        }
        if (inBlockComment) {
            if (ch === '*' && next === '/') { inBlockComment = false; i++; }
            continue;
        }
        if (ch === '/' && next === '/') { inLineComment = true; i++; continue; }
        if (ch === '/' && next === '*') { inBlockComment = true; i++; continue; }
        if (ch === '{' || ch === '(' || ch === '[') stack.push({ ch, i });
        else if (ch === '}' || ch === ')' || ch === ']') {
            const open = stack.pop();
            if (!open || open.ch !== pairs[ch]) {
                return `unbalanced '${ch}' at index ${i}`;
            }
        }
    }
    if (stack.length) return `unclosed '${stack[stack.length - 1].ch}' at index ${stack[stack.length - 1].i}`;
    return null;
}

test('Tier 1 — every registered SkSL shader is structurally valid and live-Cavalry safe', () => {
    const shaders = collectShaders();
    assert.ok(shaders.length >= 30, `expected ~32 registered shaders, found ${shaders.length}`);

    for (const { slug, source } of shaders) {
        // 1. Delimiter balance (comment-aware)
        const unbalanced = findUnbalancedDelimiter(source);
        assert.equal(unbalanced, null, `${slug}.sksl has ${unbalanced}`);

        // 2. Entry point present
        assert.ok(/half4\s+main\s*\(/.test(source), `${slug}.sksl missing half4 main entry point`);

        // 3. Live-Cavalry 2.8 rule: `layer` is the ONLY shader input. A second
        //    `uniform shader X;` compiles but never binds (verified live, see
        //    references/cavalry-api.md) — silently producing transparent samples.
        const shaderUniforms = [...source.matchAll(/uniform\s+shader\s+([A-Za-z0-9_]+)\s*;/g)].map((m) => m[1]);
        assert.deepEqual(shaderUniforms, ['layer'],
            `${slug}.sksl declares shader uniforms [${shaderUniforms}] — only 'layer' ever binds on live Cavalry`);

        // 4. `resolution` is pre-injected by Cavalry's hidden preamble; redeclaring breaks live compile.
        assert.ok(!/uniform\s+float2\s+resolution\s*;/.test(source), `${slug}.sksl redeclares built-in 'resolution'`);

        // 5. Cavalry does not accept integer uniforms.
        assert.ok(!/uniform\s+int\s/.test(source), `${slug}.sksl declares an unsupported 'uniform int'`);
    }
});

test('Tier 1 — SkSL loops have compile-time constant bounds (GPU hang safety)', () => {
    for (const { slug, source } of collectShaders()) {
        const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
        const forHeaders = [...code.matchAll(/for\s*\(([^;]*);([^;]*);([^)]*)\)/g)];
        for (const [, , cond] of forHeaders) {
            assert.ok(/\d/.test(cond),
                `${slug}.sksl loop condition "${cond.trim()}" has no constant bound — Cavalry SkSL requires constant loop bounds`);
        }
    }
});

test('Tier 1 — SkSL dynamic uniforms map 1:1 onto implementation PARAM_SPECS', () => {
    for (const { slug, abs, source } of collectShaders()) {
        const implPath = path.join(path.dirname(abs), 'implementation.js');
        const impl = fs.readFileSync(implPath, 'utf8');
        const specsMatch = impl.match(/var PARAM_SPECS = \[([\s\S]*?)\n    \];/);
        if (!specsMatch) continue; // deformer-coupled or non-standard effects checked elsewhere

        const uniformNames = [...source.matchAll(/uniform\s+(?:float|float2|float4|bool|half4)\s+([A-Za-z0-9_]+)\s*;/g)]
            .map((m) => m[1])
            .filter((n) => n !== 'resolution');
        const specNames = [...specsMatch[1].matchAll(/name:\s*'([A-Za-z0-9_]+)'/g)].map((m) => m[1]);

        const missingInSpecs = uniformNames.filter((n) => !specNames.includes(n));
        const missingInShader = specNames.filter((n) => !uniformNames.includes(n));
        assert.deepEqual(missingInSpecs, [], `${slug}: uniforms without a PARAM_SPECS entry: ${missingInSpecs}`);
        assert.deepEqual(missingInShader, [], `${slug}: PARAM_SPECS entries without a matching uniform: ${missingInShader}`);
    }
});
