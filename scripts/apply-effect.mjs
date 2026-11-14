import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    resolveProjectRoot,
    loadStallionBridge,
    loadStallionMock,
} from './lib/config.mjs';
import { loadConfig as loadClientConfig, runScriptWithResult } from './lib/stallion-client.mjs';

const ROOT = resolveProjectRoot();

function parseScalar(raw) {
    const s = String(raw).trim();
    if (s === 'true') return true;
    if (s === 'false') return false;
    if (s !== '' && Number.isFinite(Number(s))) return Number(s);
    return s;
}

function parseArgs(argv) {
    const out = { effect: null, mode: 'auto', params: {}, animate: null, mock: false, createTarget: false, list: false };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--list') { out.list = true; continue; }
        if (a === '--mock') { out.mock = true; continue; }
        if (a === '--create-target') { out.createTarget = true; continue; }
        if (a === '--mode' && argv[i + 1]) { out.mode = argv[++i]; continue; }
        if (a === '--params' && argv[i + 1]) { Object.assign(out.params, JSON.parse(argv[++i])); continue; }
        if (a === '--params-file' && argv[i + 1]) { Object.assign(out.params, JSON.parse(fs.readFileSync(argv[++i], 'utf8'))); continue; }
        if (a === '--param' && argv[i + 1]) {
            const pair = argv[++i];
            const eq = pair.indexOf('=');
            if (eq > 0) out.params[pair.slice(0, eq).trim()] = parseScalar(pair.slice(eq + 1));
            continue;
        }
        if (a === '--animate' && argv[i + 1]) { out.animate = JSON.parse(argv[++i]); continue; }
        if (!a.startsWith('--') && !out.effect) { out.effect = a; }
    }
    return out;
}

function resolveEffect(registry, query) {
    const normalized = String(query || '').trim().toLowerCase();
    if (registry.effects[normalized]) return { slug: normalized, entry: registry.effects[normalized] };
    for (const [slug, entry] of Object.entries(registry.effects)) {
        if (slug === normalized) return { slug, entry };
        if (String(entry.aeName || '').toLowerCase() === normalized) return { slug, entry };
        if (String(entry.aeMatchName || '').toLowerCase() === normalized) return { slug, entry };
        if (Array.isArray(entry.aliases) && entry.aliases.some((x) => String(x).toLowerCase() === normalized)) {
            return { slug, entry };
        }
    }
    return null;
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const registryPath = path.join(ROOT, 'effect-registry.json');
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

    if (args.list || !args.effect) {
        const names = Object.entries(registry.effects).map(([slug, e]) => ({
            slug,
            aeName: e.aeName,
            version: e.version,
            status: e.status,
            primaryStrategy: e.primaryStrategy,
        }));
        console.log(JSON.stringify({ effects: names }, null, 2));
        process.exit(args.effect || args.list ? 0 : 1);
    }

    const match = resolveEffect(registry, args.effect);
    if (!match) {
        console.error(`Unknown effect: "${args.effect}". Run with --list to see available effects.`);
        process.exit(1);
    }

    const entryPath = path.join(ROOT, match.entry.entryScript);
    const implBody = fs.readFileSync(entryPath, 'utf8');
    const injectedConfig = {
        mode: args.mode,
        params: args.params,
        animateEvolution: args.animate,
        createTestTargetIfEmpty: args.createTarget,
    };
    const script = `var __EFFECT_CONFIG__ = ${JSON.stringify(injectedConfig)};\n${implBody}`;

    if (args.mock) {
        // Mock mode runs fully self-contained: vendored mock server + zero-dep client.
        const mockRes = await loadStallionMock({ projectRoot: ROOT });
        if (!mockRes.available) {
            console.error(JSON.stringify({
                ok: false,
                error: mockRes.error,
            }, null, 2));
            process.exit(2);
        }
        const { startMockServer } = mockRes.module;
        const mock = await startMockServer({ host: '127.0.0.1', port: 0 });
        try {
            const targetId = mock.api.primitive('rectangle', 'Mock Demo Target');
            mock.api.select([targetId]);
            const cfg = { url: `http://${mock.host}:${mock.port}` };
            const raw = await runScriptWithResult(script, cfg, { helpers: true });
            const parsed = JSON.parse(raw);
            console.log(JSON.stringify({ runtime: 'stallion-mock', ...parsed }, null, 2));
            process.exit(parsed?.ok && parsed?.result?.ok ? 0 : 1);
        } finally {
            await mock.close();
        }
    }

    const stallionRes = await loadStallionBridge();
    if (!stallionRes.available) {
        console.error(JSON.stringify({
            ok: false,
            error: stallionRes.error,
        }, null, 2));
        process.exit(2);
    }
    const { loadConfig, runScriptWithResult: runBridgeScript, pingStallion } = stallionRes.module;

    const cfg = loadConfig();
    const alive = await pingStallion(cfg);
    if (!alive) {
        console.error(JSON.stringify({
            ok: false,
            error: `Live Stallion bridge unreachable at ${cfg.url}. Open Cavalry and start Scripts > Stallion, or pass --mock to inspect wiring in mock mode.`,
            url: cfg.url,
        }, null, 2));
        process.exit(2);
    }

    const raw = await runBridgeScript(script, cfg, { helpers: true });
    let parsed;
    try {
        parsed = JSON.parse(raw);
    } catch {
        parsed = { raw };
    }
    console.log(JSON.stringify({ runtime: 'live-cavalry', ...parsed }, null, 2));
    process.exit(parsed?.ok === false || parsed?.result?.ok === false ? 1 : 0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
