import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
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

/**
 * Helper functions the code generator hoists out of bundled effect runners.
 * Each runner originally re-declared byte-identical copies; hoisting collapses
 * them into the panel template's `__AE_SHARED__` runtime (variant-keyed, so a
 * runner always receives the exact implementation it shipped with).
 */
const HOIST_HELPER_NAMES = ['safeCall', 'clampNum', 'setAttrValue', 'bindDynamicSlot'];
const MARKER_LINE_RE = /^[ \t]*\/\* @@(?:BEGIN|END)_(?:SKSL|DEFORMER)@@ \*\/[ \t]*$/gm;

/**
 * Extracts the block for a top-level-in-IIFE `function <name>(...)` declaration
 * at the canonical 4-space indent used by all effect implementations.
 * Returns { body, start, end } or null.
 */
function extractFunctionBlock(source, name) {
    const marker = '    function ' + name + '(';
    const idx = source.indexOf(marker);
    if (idx === -1) return null;
    let depth = 0;
    const open = source.indexOf('{', idx);
    for (let i = open; i < source.length; i++) {
        const ch = source[i];
        if (ch === '{') depth++;
        else if (ch === '}') {
            depth--;
            if (depth === 0) return { name, body: source.slice(idx, i + 1), start: idx, end: i + 1 };
        }
    }
    return null;
}

/**
 * Names a hoisted function body may reference that resolve identically in every
 * execution context (JS builtins) — anything else must be a factory parameter.
 */
const HOIST_FREEVAR_ALLOWLIST = new Set([
    'console', 'globalThis', 'Math', 'Number', 'isFinite', 'isNaN', 'String',
    'Boolean', 'Object', 'Array', 'JSON', 'undefined', 'parseFloat', 'parseInt',
    'true', 'false', 'null', 'if', 'else', 'for', 'while', 'return', 'function',
    'var', 'typeof', 'new', 'in', 'of', 'break', 'continue', 'try', 'catch',
    'this', 'do', 'switch', 'case', 'default', 'delete', 'instanceof', 'void',
]);

/**
 * Statically executes `body` inside a recording sandbox to discover the global
 * identifiers it references that are NOT covered by `paramNames`. Returns the set
 * of free global names, or null if the body could not be analyzed safely (callers
 * must then keep the body inline).
 */
function analyzeFunctionBodyFreeVars(body, fnName, paramNames) {
    const globalsSeen = new Set();
    const memberProbe = new Proxy(function () {}, {
        get: () => memberProbe,
        has: () => true,
        apply: () => memberProbe,
        construct: () => memberProbe,
    });
    const sandbox = new Proxy({}, {
        get: (t, p) => {
            if (typeof p === 'string') globalsSeen.add(p);
            return memberProbe;
        },
        has: () => true,
    });
    let factory;
    try {
        factory = vm.runInNewContext(
            '(function () { ' + body + '\n return ' + fnName + '; })',
            sandbox,
            { timeout: 2000 }
        );
        factory.apply(memberProbe, paramNames.map(() => memberProbe));
    } catch (err) {
        const notDefined = /(\w+) is not defined/.exec(String((err && err.message) || ''));
        if (notDefined) {
            globalsSeen.add(notDefined[1]);
        } else {
            return null; // unexpected execution failure — do not hoist
        }
    }
    const free = new Set();
    for (const name of globalsSeen) {
        if (paramNames.includes(name) || HOIST_FREEVAR_ALLOWLIST.has(name)) continue;
        free.add(name);
    }
    return free;
}

/**
 * Collects the names a function body may reference that are declared at the
 * effect-IIFE top level (4-space indent `function`/`var` declarations). A hoisted
 * body must not reference any of these unless they are hoisted themselves.
 */
function collectTopLevelDeclaredNames(source) {
    const names = new Set();
    const re = /^    (?:function|var) ([A-Za-z0-9_$]+)/gm;
    let m;
    while ((m = re.exec(source)) !== null) names.add(m[1]);
    return names;
}

/**
 * Returns the identifiers referenced by `body` (conservative token scan).
 */
function collectReferencedIdentifiers(body) {
    const names = new Set();
    const re = /[A-Za-z_$][A-Za-z0-9_$]*/g;
    let m;
    while ((m = re.exec(body)) !== null) names.add(m[0]);
    return names;
}

/**
 * Prepares the bundled sources: strips embedded-sync marker comments, collects
 * hoistable helper variants, removes hoisted blocks, and builds the per-runner
 * alias preamble plus the shared variant factories.
 */
function prepareHoistedRunners(effects) {
    const variantUse = new Map(); // key -> { name, body, uses: [slugs] }
    const perEffect = effects.map((e) => {
        let code = e.source.replace(MARKER_LINE_RE, '');
        const tagMatch = code.match(/var TAG_[A-Z_]+ = '([^']+)'/);
        const tag = tagMatch ? tagMatch[1] : '[AE:' + e.aeName + ']';
        const blocks = {};
        for (const name of HOIST_HELPER_NAMES) {
            const block = extractFunctionBlock(code, name);
            if (!block) continue;
            let key;
            if (name === 'safeCall') {
                const normalized = block.body.replace(/console\.warn\("[^"]*" \+/, 'console.warn(TAG +');
                key = 'safeCall|' + sha256(normalized).slice(0, 8);
            } else {
                key = name + '|' + sha256(block.body).slice(0, 8);
            }
            blocks[name] = { ...block, key };
            if (!variantUse.has(key)) variantUse.set(key, { name, body: block.body, uses: [] });
            variantUse.get(key).uses.push(e.slug);
        }
        return { slug: e.slug, code, blocks, tag };
    });

    // Only variants shared by >= 2 effects are worth hoisting; unique bodies stay inline.
    const hoistedFactories = [];
    const hoistedExports = [];
    const factoryNameByKey = new Map();
    const hoistableKeys = new Set();

    // Pass 1 — dynamic gate: probe-execute each candidate body in a recording sandbox.
    for (const [key, info] of variantUse) {
        if (info.uses.length < 2) continue;
        if (info.name === 'safeCall' || info.name === 'clampNum') {
            // Static template implementations; both are dependency-free.
            hoistableKeys.add(key);
            continue;
        }
        const paramNames = info.name === 'setAttrValue' ? ['api', 'safeCall'] : ['api', 'safeCall', 'setAttrValue'];
        const fnNameMatch = /^    function ([A-Za-z0-9_]+)\(/.exec(info.body);
        const fnName = fnNameMatch ? fnNameMatch[1] : info.name;
        const freeVars = analyzeFunctionBodyFreeVars(info.body, fnName, paramNames);
        if (freeVars === null || freeVars.size > 0) {
            // Body references per-effect helpers (e.g. resolveColor) — must stay inline.
            continue;
        }
        hoistableKeys.add(key);
    }

    // Pass 2 — static gate: a variant may only be hoisted if, for EVERY effect using
    // it, the body references no per-effect top-level declaration outside the hoisted
    // set (catches lazily-taken branches the dynamic probe cannot reach).
    {
        const definedNamesBySlug = new Map(perEffect.map((pe) => [pe.slug, collectTopLevelDeclaredNames(pe.code)]));
        const hoistedNames = new Set(['safeCall', 'clampNum', 'setAttrValue', 'bindDynamicSlot']);
        for (const [key, info] of variantUse) {
            if (!hoistableKeys.has(key) || info.name === 'safeCall' || info.name === 'clampNum') continue;
            const bodyRefs = collectReferencedIdentifiers(info.body);
            for (const slug of info.uses) {
                const defined = definedNamesBySlug.get(slug) || new Set();
                for (const ref of bodyRefs) {
                    if (defined.has(ref) && !hoistedNames.has(ref)) {
                        hoistableKeys.delete(key);
                        break;
                    }
                }
                if (!hoistableKeys.has(key)) break;
            }
        }
    }

    // Pass 3 — emit one factory per remaining hoisted variant.
    for (const [key, info] of variantUse) {
        if (!hoistableKeys.has(key)) continue;
        if (info.name === 'safeCall' || info.name === 'clampNum') continue;
        const paramNames = info.name === 'setAttrValue' ? ['api', 'safeCall'] : ['api', 'safeCall', 'setAttrValue'];
        const hash = key.split('|')[1];
        const factoryName = 'make' + info.name.charAt(0).toUpperCase() + info.name.slice(1) + '_' + hash;
        factoryNameByKey.set(key, factoryName);
        const params = paramNames.join(', ');
        hoistedFactories.push(
            '        function ' + factoryName + '(' + params + ') {\n' +
            '            return ' + info.body + ';\n' +
            '        }'
        );
        hoistedExports.push('            ' + factoryName + ': ' + factoryName);
    }

    for (const pe of perEffect) {
        // Remove hoisted blocks (deepest-first by start offset to keep indices valid).
        const removals = Object.values(pe.blocks)
            .filter((b) => hoistableKeys.has(b.key))
            .sort((a, b) => b.start - a.start);
        for (const r of removals) {
            // Also swallow the trailing newline of the removed block to avoid blank gaps.
            let end = r.end;
            while (pe.code[end] === '\r') end++;
            if (pe.code[end] === '\n') end++;
            pe.code = pe.code.slice(0, r.start) + pe.code.slice(end);
        }

        // Build the alias preamble in dependency order.
        const preamble = [];
        if (pe.blocks.safeCall && hoistableKeys.has(pe.blocks.safeCall.key)) {
            preamble.push('    var safeCall = __AE_SHARED__.createSafeCall(' + JSON.stringify(pe.tag) + ');');
        }
        if (pe.blocks.clampNum && hoistableKeys.has(pe.blocks.clampNum.key)) {
            preamble.push('    var clampNum = __AE_SHARED__.clampNum;');
        }
        if (pe.blocks.setAttrValue && hoistableKeys.has(pe.blocks.setAttrValue.key)) {
            preamble.push('    var setAttrValue = __AE_SHARED__.' + factoryNameByKey.get(pe.blocks.setAttrValue.key) +
                '(typeof api !== "undefined" ? api : undefined, safeCall);');
        }
        if (pe.blocks.bindDynamicSlot && hoistableKeys.has(pe.blocks.bindDynamicSlot.key)) {
            preamble.push('    var bindDynamicSlot = __AE_SHARED__.' + factoryNameByKey.get(pe.blocks.bindDynamicSlot.key) +
                '(typeof api !== "undefined" ? api : undefined, safeCall, setAttrValue);');
        }

        if (preamble.length) {
            const iifeStart = pe.code.indexOf('(function () {');
            if (iifeStart !== -1) {
                const lineEnd = pe.code.indexOf('\n', iifeStart);
                if (lineEnd !== -1) {
                    pe.code = pe.code.slice(0, lineEnd + 1) + preamble.join('\n') + '\n' + pe.code.slice(lineEnd + 1);
                }
            }
        }
    }

    return {
        runners: perEffect.map((pe) => ({ slug: pe.slug, source: pe.code })),
        sharedVariants: hoistedFactories.join('\n\n'),
        sharedExports: hoistedExports.length ? ',\n' + hoistedExports.join(',\n') : '',
    };
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

    const prepared = prepareHoistedRunners(effects);
    const preparedBySlug = new Map(prepared.runners.map((r) => [r.slug, r.source]));

    const runnerEntries = effects.map((e) => {
        const source = preparedBySlug.get(e.slug) || e.source;
        const indented = source
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
        ['/* @@SHARED_VARIANTS@@ */', prepared.sharedVariants],
        ['/* @@SHARED_EXPORTS@@ */', prepared.sharedExports],
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
