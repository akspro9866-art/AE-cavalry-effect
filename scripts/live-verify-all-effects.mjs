// Explicit live-Cavalry opt-in gate: hosted runners never touch port 8080.
// The dedicated workflow_dispatch `live-verify` job sets CAVALRY_LIVE=true;
// without the gate this script exits 0 with a skip message so headless CI
// can neither hang nor fail on connection refused.
if (process.env.CAVALRY_LIVE !== 'true') {
    console.log('Live verification skipped: CAVALRY_LIVE !== "true" (set the env var, or run the workflow_dispatch live-verify job).');
    process.exit(0);
}
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    resolveProjectRoot,
    resolveStallionUrl,
    loadStallionBridge,
} from './lib/config.mjs';
import { verifyVisualParity } from './lib/visual-diff.mjs';

const ROOT = resolveProjectRoot();
const FRAMES_DIR = path.join(ROOT, 'frames');
const REF_DIR = path.join(ROOT, 'references', 'ae-renders');

if (!fs.existsSync(FRAMES_DIR)) {
    fs.mkdirSync(FRAMES_DIR, { recursive: true });
}

function isValidPng(filePath) {
    if (!fs.existsSync(filePath)) return { valid: false, reason: 'File does not exist' };
    const stat = fs.statSync(filePath);
    if (stat.size < 64) return { valid: false, reason: `File too small (${stat.size} bytes)` };
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(8);
    fs.readSync(fd, buf, 0, 8, 0);
    fs.closeSync(fd);
    const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47 &&
                  buf[4] === 0x0D && buf[5] === 0x0A && buf[6] === 0x1A && buf[7] === 0x0A;
    if (!isPng) return { valid: false, reason: 'Invalid PNG header signature' };
    return { valid: true, size: stat.size };
}

async function main() {
    const customUrl = process.argv.find((a, i, arr) => arr[i - 1] === '--url');
    const targetUrl = resolveStallionUrl({ override: customUrl });

    console.log('================================================================');
    console.log('TIER 4 & 5: LIVE CAVALRY 2.8 RUNTIME, WORKFLOW & PARITY AUDIT');
    console.log('================================================================');
    console.log(`Target: Live Cavalry 2.8 at ${targetUrl}`);

    const stallionRes = await loadStallionBridge();
    if (!stallionRes.available) {
        console.error(`\n✖ ABORTED: ${stallionRes.error}`);
        console.error('Please ensure cavalry-mcp is installed or set CAVALRY_MCP_PATH / STALLION_MODULE.');
        process.exit(1);
    }

    const stallion = stallionRes.module;
    const cfg = { ...stallion.loadConfig(), url: targetUrl };

    const isAlive = await stallion.pingStallion(cfg);
    if (!isAlive) {
        console.error(`\n✖ Live Cavalry Stallion bridge unreachable at ${targetUrl}.`);
        console.error('Please open Cavalry, start "Scripts -> Stallion", and ensure port 8080 is listening.');
        process.exit(1);
    }

    const regPath = path.join(ROOT, 'effect-registry.json');
    const registry = JSON.parse(fs.readFileSync(regPath, 'utf8'));

    const results = [];

    // Cleanup helper in live Cavalry
    async function cleanupScene() {
        const cleanupScript = `
            var layers = api.getCompLayers ? api.getCompLayers(false) : [];
            for (var i = 0; i < layers.length; i++) {
                try { api.deleteLayer(layers[i]); } catch (e) {}
            }
            __result = { cleaned: true };
        `;
        await stallion.runScriptWithResult(cleanupScript, cfg);
    }

    // 1. Audit Composition Operations (Null Object, Adjustment Layer, Pre-Compose)
    console.log('\n--- Section A: Composition & Workflow Operations ---');

    // A1: Null Object
    {
        console.log('Auditing: Null Object (null-object)...');
        await cleanupScene();
        const implSource = fs.readFileSync(path.join(ROOT, 'effects', 'null-object', 'implementation.js'), 'utf8');
        const testScript = `
            var r1 = api.primitive('rectangle', 'Null Test Rect 1');
            var r2 = api.primitive('rectangle', 'Null Test Rect 2');
            api.set(r1, { position: { x: -100, y: 50 } });
            api.set(r2, { position: { x: 100, y: 50 } });
            api.select([r1, r2]);

            var report = ${implSource};

            var p1 = api.getParent(r1);
            var p2 = api.getParent(r2);
            var sel = api.getSelection();

            __result = {
                report: report,
                p1: p1,
                p2: p2,
                selection: sel
            };
        `;
        const raw = await stallion.runScriptWithResult(testScript, cfg);
        const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
        const rep = data.result?.report || data.report || {};
        const nullId = rep.nullId;
        const p1Matches = data.result?.p1 === nullId || data.p1 === nullId;
        const p2Matches = data.result?.p2 === nullId || data.p2 === nullId;
        const selMatches = (data.result?.selection || data.selection)?.[0] === nullId;
        const ok = Boolean(rep.ok && nullId && p1Matches && p2Matches && selMatches);

        console.log(`  - Null Layer ID : ${nullId}`);
        console.log(`  - Parented r1   : ${p1Matches} (${data.result?.p1 || data.p1})`);
        console.log(`  - Parented r2   : ${p2Matches} (${data.result?.p2 || data.p2})`);
        console.log(`  - Selected Null : ${selMatches}`);
        console.log(`  - Centroid Pos  : ${JSON.stringify(rep.position)}`);

        results.push({
            slug: 'null-object',
            name: 'Null Object',
            type: 'workflow',
            ok,
            nodeId: nullId,
            details: `Parented 2 layers to ${nullId} at centroid`,
            aeParity: 'unverified',
        });
        await cleanupScene();
    }

    // A2: Adjustment Layer
    {
        console.log('Auditing: Adjustment Layer (adjustment-layer)...');
        await cleanupScene();
        const implSource = fs.readFileSync(path.join(ROOT, 'effects', 'adjustment-layer', 'implementation.js'), 'utf8');
        const testScript = `
            var r1 = api.primitive('rectangle', 'Adj Rect 1');
            var r2 = api.primitive('rectangle', 'Adj Rect 2');
            api.select([r1, r2]);

            var report = ${implSource};

            var groupId = report ? report.groupId : null;
            var filterId = report ? report.filterId : null;
            var p1 = api.getParent(r1);
            var p2 = api.getParent(r2);
            var filterIn = api.getInConnections ? api.getInConnections(groupId, 'filters') : null;

            __result = {
                report: report,
                groupId: groupId,
                filterId: filterId,
                p1: p1,
                p2: p2,
                filterIn: filterIn
            };
        `;
        const raw = await stallion.runScriptWithResult(testScript, cfg);
        const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
        const rep = data.result?.report || data.report || {};
        const groupId = rep.groupId;
        const filterId = rep.filterId;
        const p1Matches = (data.result?.p1 || data.p1) === groupId;
        const p2Matches = (data.result?.p2 || data.p2) === groupId;
        const ok = Boolean(rep.ok && groupId && filterId && p1Matches && p2Matches);

        console.log(`  - Group ID      : ${groupId}`);
        console.log(`  - Filter ID     : ${filterId}`);
        console.log(`  - Grouped r1    : ${p1Matches}`);
        console.log(`  - Grouped r2    : ${p2Matches}`);

        results.push({
            slug: 'adjustment-layer',
            name: 'Adjustment Layer',
            type: 'workflow',
            ok,
            nodeId: groupId,
            details: `Grouped 2 layers under ${groupId} with filter ${filterId}`,
            aeParity: 'unverified',
        });
        await cleanupScene();
    }

    // A3: Pre-Compose
    {
        console.log('Auditing: Pre-Compose (pre-compose)...');
        await cleanupScene();
        const implSource = fs.readFileSync(path.join(ROOT, 'effects', 'pre-compose', 'implementation.js'), 'utf8');
        const testScript = `
            var r1 = api.primitive('rectangle', 'PreComp Rect 1');
            var r2 = api.primitive('rectangle', 'PreComp Rect 2');
            api.select([r1, r2]);

            var report = ${implSource};
            var sel = api.getSelection();

            __result = {
                report: report,
                selection: sel
            };
        `;
        const raw = await stallion.runScriptWithResult(testScript, cfg);
        const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
        const rep = data.result?.report || data.report || {};
        const preCompId = rep.preCompId;
        const selMatches = (data.result?.selection || data.selection)?.[0] === preCompId;
        const ok = Boolean(rep.ok && preCompId && selMatches);

        console.log(`  - PreComp Ref ID: ${preCompId}`);
        console.log(`  - Selected Comp : ${selMatches}`);

        results.push({
            slug: 'pre-compose',
            name: 'Pre-Compose',
            type: 'workflow',
            ok,
            nodeId: preCompId,
            details: `Pre-composed 2 layers into ${preCompId}`,
            aeParity: 'unverified',
        });
        await cleanupScene();
    }

    // 2. Audit GPU Shader Effects (7 effects)
    console.log('\n--- Section B: GPU Shader Filter Effects ---');
    const shaderEffects = [
        {
            slug: 'gaussian-blur',
            name: 'Gaussian Blur',
            config: { params: { blurriness: 45.0, blurDimensions: 0, repeatEdgePixels: 1 } },
        },
        {
            slug: 'fractal-noise',
            name: 'Fractal Noise',
            config: { params: { fractalType: 1, contrast: 120.0, brightness: -5.0, complexity: 4.0, evolution: 45.0 } },
        },
        {
            slug: 'tint',
            name: 'Tint',
            config: { params: { mapBlackTo: { r: 255, g: 30, b: 0, a: 255 }, mapWhiteTo: { r: 0, g: 210, b: 255, a: 255 }, amount: 0.9 } },
        },
        {
            slug: 'cc-ball-action',
            name: 'CC Ball Action',
            config: { params: { scatter: 15.0, rotationAxis: 1, rotationAngle: 25.0, ballSize: 100.0, gridSpacing: 12.0 } },
        },
        {
            slug: 'cc-repetile',
            name: 'CC RepeTile',
            config: { params: { expandRight: 80.0, expandLeft: 40.0, expandUp: 40.0, expandDown: 80.0, tiling: 1 } },
        },
        {
            slug: 'deep-glow',
            name: 'Deep Glow',
            config: { params: { radius: 80.0, exposure: 1.1, threshold: 0.1, aberration: 0.25 } },
        },
        {
            slug: 'turbulent-displace',
            name: 'Turbulent Displace',
            config: { params: { displacement: 0, amount: 50.0, size: 75.0, complexity: 3.0, evolution: 30.0 } },
        },
    ];

    for (const eff of shaderEffects) {
        console.log(`\nAuditing GPU Effect: ${eff.name} (${eff.slug})...`);
        await cleanupScene();
        const implPath = path.join(ROOT, 'effects', eff.slug, 'implementation.js');
        const implSource = fs.readFileSync(implPath, 'utf8');
        const frameBase = path.join(FRAMES_DIR, `${eff.slug}-live`).replace(/\\/g, '/');

        const testScript = `
            var target = api.primitive('rectangle', 'Live_${eff.slug}_Rect');
            api.set(target, { 'position.x': 0, 'position.y': 0, 'size.x': 300, 'size.y': 300 });
            api.select([target]);

            var __EFFECT_CONFIG__ = ${JSON.stringify(eff.config)};
            var report = ${implSource};

            var filterEntry = (report && (report.results || report.applied)) ? (report.results || report.applied)[0] : null;
            var filterId = filterEntry ? (filterEntry.filterId || filterEntry.nodeId || filterEntry.deformerId) : null;
            var filterCode = filterId ? api.get(filterId, 'code') : '';
            var boundSlots = filterEntry ? (filterEntry.boundSlots || {}) : {};
            var slotValues = {};
            for (var k in boundSlots) {
                slotValues[k] = api.get(filterId, boundSlots[k]);
            }

            api.renderPNGFrame('${frameBase}', 100);

            __result = {
                ok: Boolean(report && report.ok === true),
                effect: report ? report.effect : null,
                targetId: target,
                filterId: filterId,
                boundSlots: boundSlots,
                slotValues: slotValues,
                hasCode: Boolean(filterCode && filterCode.length > 50),
                frameBase: '${frameBase}'
            };
        `;

        const raw = await stallion.runScriptWithResult(testScript, cfg);
        const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
        const res = data.result || data;

        const pngPath = `${frameBase}.png`;
        const pngAudit = isValidPng(pngPath);

        console.log(`  - Filter Node ID : ${res.filterId}`);
        console.log(`  - SkSL Uploaded  : ${res.hasCode}`);
        console.log(`  - PNG Frame Check: ${pngAudit.valid ? 'VALID PNG' : 'INVALID'} (${pngAudit.size || 0} bytes)`);

        // Tier 5 Parity Check against AE Reference Render (if available)
        const refPngPath = path.join(REF_DIR, `${eff.slug}.png`);
        const parity = verifyVisualParity({ referencePngPath: refPngPath, livePngPath: pngPath });
        let aeParityStatus = parity.status;
        if (parity.verified) {
            console.log(`  - AE Visual Parity: ${parity.passed ? 'PASSED' : 'DIVERGED'} (MAE: ${parity.metrics.mae}, PSNR: ${parity.metrics.psnr}dB, SSIM: ${parity.metrics.ssim})`);
        } else {
            console.log(`  - AE Visual Parity: Unverified (${parity.reason})`);
        }

        const isVerified = Boolean(res.ok && res.filterId && res.hasCode && pngAudit.valid);
        results.push({
            slug: eff.slug,
            name: eff.name,
            type: 'sksl-filter',
            ok: isVerified,
            nodeId: res.filterId,
            details: `Rendered ${pngAudit.size || 0} byte valid PNG frame`,
            aeParity: aeParityStatus,
        });

        await cleanupScene();
    }

    console.log('\n================================================================');
    console.log('TIER 4 & 5 VERIFICATION AUDIT SUMMARY');
    console.log('================================================================');
    console.log('| Effect Name          | Type        | Live Cavalry | AE Parity    | Status Details');
    console.log('|----------------------|-------------|--------------|--------------|----------------');
    for (const r of results) {
        const liveStatus = r.ok ? '✔ PASSED' : '✖ FAILED';
        console.log(`| ${r.name.padEnd(20)} | ${r.type.padEnd(11)} | ${liveStatus.padEnd(12)} | ${r.aeParity.padEnd(12)} | ${r.details}`);
    }
    console.log('================================================================\n');

    // Update effect-registry.json
    for (const r of results) {
        if (registry.effects[r.slug]) {
            registry.effects[r.slug].status = r.ok ? 'live-verified' : 'draft';
        }
    }
    fs.writeFileSync(regPath, JSON.stringify(registry, null, 2) + '\n', 'utf8');
    console.log('Updated effect-registry.json with validated live-verified statuses.');
}

main().catch((err) => {
    console.error('Fatal live verification error:', err);
    process.exit(1);
});
