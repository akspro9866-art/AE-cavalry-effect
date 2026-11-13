import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
    resolveProjectRoot,
    resolveCavalryScriptsDir,
    toForwardSlashes,
} from './lib/config.mjs';

const ROOT = resolveProjectRoot();
const PANEL_TEMPLATE_PATH = path.join(ROOT, 'templates', 'cavalry-panel', 'ae-effects-panel.js');
const EXCLUDED_STATUSES = new Set(['draft', 'failed', 'disabled', 'deprecated', 'broken']);

export { resolveCavalryScriptsDir };

function sha256(bufOrStr) {
    return createHash('sha256').update(bufOrStr).digest('hex');
}

function getTruncatedMtimeMs(filePath) {
    try {
        return Math.floor(fs.statSync(filePath).mtimeMs / 1000) * 1000;
    } catch {
        return null;
    }
}

function inferSupportedModes(entry) {
    const modes = ['auto'];
    const artifacts = entry.artifacts || {};
    const primary = String(entry.primaryStrategy || '').toLowerCase();
    const secondary = String(entry.secondaryStrategy || '').toLowerCase();

    if (artifacts.sksl || primary.includes('sksl')) modes.push('sksl');
    if (artifacts.deformer || primary.includes('deformer') || secondary.includes('deformer')) modes.push('deformer');
    if (artifacts.modifier || primary.includes('modifier') || secondary.includes('modifier')) modes.push('modifier');
    if (artifacts.rig || primary.includes('rig') || secondary.includes('rig')) modes.push('rig');
    return Array.from(new Set(modes));
}

export function collectEffectsForScript(libraryRoot = ROOT, options = {}) {
    const regPath = path.join(libraryRoot, 'effect-registry.json');
    if (!fs.existsSync(regPath)) {
        throw new Error(`effect-registry.json not found at ${regPath}`);
    }
    const registryMtime = getTruncatedMtimeMs(regPath);
    const registry = JSON.parse(fs.readFileSync(regPath, 'utf8'));
    const includeDrafts = options.includeAll === true;

    const collected = [];
    const skipped = [];

    for (const [slug, entry] of Object.entries(registry.effects || {})) {
        const status = String(entry.status || 'draft').toLowerCase();
        if (!includeDrafts && EXCLUDED_STATUSES.has(status)) {
            skipped.push({ slug, reason: `status is "${entry.status}"` });
            continue;
        }
        const entryRel = String(entry.entryScript || '');
        const entryAbs = path.resolve(libraryRoot, entryRel);
        if (!entryRel || !fs.existsSync(entryAbs)) {
            skipped.push({ slug, reason: `missing entryScript: ${entryRel}` });
            continue;
        }

        const code = fs.readFileSync(entryAbs, 'utf8');
        const mtime = getTruncatedMtimeMs(entryAbs);
        let description = '';
        if (entry.artifacts?.parameterMap) {
            const pmapAbs = path.resolve(libraryRoot, entry.artifacts.parameterMap);
            if (fs.existsSync(pmapAbs)) {
                try {
                    const pmap = JSON.parse(fs.readFileSync(pmapAbs, 'utf8'));
                    description = String(pmap.provenanceNote || '').trim();
                } catch {
                    // ignore optional metadata parse failures
                }
            }
        }

        collected.push({
            slug,
            aeName: entry.aeName || slug,
            aeMatchName: entry.aeMatchName || '',
            category: entry.aeCategory || 'Effects',
            version: entry.version || '1.0.0',
            status: entry.status || 'verified',
            primaryStrategy: entry.primaryStrategy || 'script',
            modes: inferSupportedModes(entry),
            metadata: entry.metadata || {},
            aliases: entry.aliases || [],
            entryScript: toForwardSlashes(entryRel),
            mtime,
            description,
            source: code,
        });
    }

    collected.sort((a, b) => {
        const catCmp = a.category.localeCompare(b.category);
        return catCmp !== 0 ? catCmp : a.aeName.localeCompare(b.aeName);
    });

    return { registry, registryMtime, collected, skipped };
}

export function buildCavalryScriptSource({
    effects,
    libraryRoot = ROOT,
    registryMtime = 0,
    panelTemplatePath = PANEL_TEMPLATE_PATH,
}) {
    const isCustomLibRoot = libraryRoot && path.resolve(libraryRoot) !== ROOT;
    const bundledLibRoot = isCustomLibRoot ? toForwardSlashes(libraryRoot) : '.';
    const catalogMeta = effects.map((e) => ({
        slug: e.slug,
        aeName: e.aeName,
        aeMatchName: e.aeMatchName,
        category: e.category,
        version: e.version,
        status: e.status,
        primaryStrategy: e.primaryStrategy,
        modes: e.modes,
        metadata: e.metadata || {},
        aliases: e.aliases || [],
        entryScript: e.entryScript,
        description: e.description,
    }));

    const bundledMtimes = {};
    for (const e of effects) {
        bundledMtimes[e.slug] = 0;
    }

    const runnerEntries = effects.map((e) => {
        const indented = e.source
            .split(/\r?\n/)
            .map((line) => (line.length ? '            ' + line : ''))
            .join('\n');
        return [
            `        ${JSON.stringify(e.slug)}: function (__EFFECT_CONFIG__) {`,
            '            var __DEFORMER_CONFIG__ = __EFFECT_CONFIG__;',
            '            var __MODIFIER_CONFIG__ = __EFFECT_CONFIG__;',
            '            var __RIG_CONFIG__ = __EFFECT_CONFIG__;',
            '            var __result = null;',
            '            var __iifeOut = (function () {',
            indented,
            '            })();',
            '            return (__result && typeof __result === "object") ? __result : __iifeOut;',
            '        }',
        ].join('\n');
    }).join(',\n');

    const contentDigest = sha256(JSON.stringify({ catalogMeta, runnerEntries })).slice(0, 16);
    const header = [
        '/**',
        ' * AE Effects — Native Cavalry UI Panel (Auto-Generated)',
        ' *',
        ' * Installed into Cavalry Scripts folder (Scripts -> AE Effects).',
        ' * Single-click any effect button to apply it directly to selected layer(s) in Cavalry.',
        ' *',
        ' * Generated by scripts/sync-cavalry-script.mjs',
        ` * Bundled Count: ${effects.length}`,
        ` * Content Hash : ${contentDigest}`,
        ' */',
    ].join('\n');

    let template = fs.readFileSync(panelTemplatePath, 'utf8');
    const replacements = [
        ['/* @@HEADER_COMMENT@@ */', header],
        ['/* @@DEFAULT_LIBRARY_ROOT@@ */', JSON.stringify(bundledLibRoot)],
        ['/* @@BUNDLED_EFFECTS@@ */', JSON.stringify(catalogMeta, null, 4)],
        ['/* @@BUNDLED_MTIMES@@ */', JSON.stringify(bundledMtimes, null, 4)],
        ['/* @@BUNDLED_RUNNERS@@ */', runnerEntries],
        ['/* @@REGISTRY_MTIME@@ */', '0'],
    ];

    for (const [token, val] of replacements) {
        if (!template.includes(token)) {
            throw new Error(`Panel template missing placeholder ${token}`);
        }
        template = template.replace(token, () => val);
    }
    return template;
}

export function syncCavalryScript(options = {}) {
    const libraryRoot = path.resolve(options.libraryRoot || ROOT);
    const repoScriptPath = path.resolve(options.repoScriptPath || path.join(libraryRoot, 'cavalry-script', 'AE Effects.js'));
    const scriptsDir = options.scriptsDir
        ? path.resolve(options.scriptsDir)
        : resolveCavalryScriptsDir({ override: process.env.CAVALRY_SCRIPTS_DIR });
    const deployedScriptPath = path.join(scriptsDir, 'AE Effects.js');

    const { collected, registryMtime, skipped } = collectEffectsForScript(libraryRoot, options);
    const scriptSource = buildCavalryScriptSource({
        effects: collected,
        libraryRoot,
        registryMtime,
        generatedAt: options.generatedAt,
    });

    const normalizeEol = (str) => (str ? str.replace(/\r\n/g, '\n') : '');

    if (options.check) {
        const repoExists = fs.existsSync(repoScriptPath);
        const deployedExists = fs.existsSync(deployedScriptPath);
        const normScript = normalizeEol(scriptSource);
        const repoMatches = repoExists && normalizeEol(fs.readFileSync(repoScriptPath, 'utf8')) === normScript;
        const deployedMatches = deployedExists ? normalizeEol(fs.readFileSync(deployedScriptPath, 'utf8')) === normScript : true;
        return {
            ok: repoMatches && deployedMatches,
            checkOnly: true,
            effectCount: collected.length,
            effects: collected.map((e) => ({ slug: e.slug, aeName: e.aeName, version: e.version, status: e.status })),
            skipped,
            repoScriptPath,
            deployedScriptPath,
            repoMatches,
            deployedMatches,
        };
    }

    fs.mkdirSync(path.dirname(repoScriptPath), { recursive: true });
    fs.writeFileSync(repoScriptPath, scriptSource, 'utf8');

    fs.mkdirSync(scriptsDir, { recursive: true });
    fs.writeFileSync(deployedScriptPath, scriptSource, 'utf8');

    const expectedHash = sha256(Buffer.from(scriptSource, 'utf8'));
    const repoReadBack = sha256(fs.readFileSync(repoScriptPath));
    const deployedReadBack = sha256(fs.readFileSync(deployedScriptPath));
    if (repoReadBack !== expectedHash || deployedReadBack !== expectedHash) {
        throw new Error('Verify-after-write failed: AE Effects.js digest mismatch on disk.');
    }

    return {
        ok: true,
        effectCount: collected.length,
        effects: collected.map((e) => ({ slug: e.slug, aeName: e.aeName, version: e.version, status: e.status })),
        skipped,
        repoScriptPath,
        deployedScriptPath,
        bytes: Buffer.byteLength(scriptSource, 'utf8'),
        sha256: expectedHash,
    };
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
    const args = process.argv.slice(2);
    const check = args.includes('--check');
    const includeAll = args.includes('--include-all');
    let scriptsDir;
    const dirIdx = args.indexOf('--scripts-dir');
    if (dirIdx >= 0 && args[dirIdx + 1]) scriptsDir = args[dirIdx + 1];

    const res = syncCavalryScript({ check, includeAll, scriptsDir });
    console.log(JSON.stringify(res, null, 2));
    if (!res.ok) process.exit(1);
}
