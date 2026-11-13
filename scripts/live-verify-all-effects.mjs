import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STALLION_URL = pathToFileURL('C:/Users/khada/cavalry-mcp/dist/bridge/stallion.js').href;
const FRAMES_DIR = path.join(ROOT, 'frames');

if (!fs.existsSync(FRAMES_DIR)) {
    fs.mkdirSync(FRAMES_DIR, { recursive: true });
}

async function main() {
    console.log('================================================================');
    console.log('TIER 4: COMPREHENSIVE LIVE CAVALRY 2.8 RUNTIME & FRAME AUDIT');
    console.log('================================================================');
    console.log('Target: Live Cavalry 2.8 at http://127.0.0.1:8080');

    const stallion = await import(STALLION_URL);

    const effectsToVerify = [
        {
            name: 'Gaussian Blur',
            slug: 'gaussian-blur',
            layerName: 'Live_GaussianBlur_Rect',
            implPath: path.join(ROOT, 'effects', 'gaussian-blur', 'implementation.js'),
            frameBase: path.join(FRAMES_DIR, 'gaussian-blur-live').replace(/\\/g, '/'),
            config: {
                params: {
                    blurriness: 50.0,
                    blurDimensions: 0,
                    repeatEdgePixels: 1
                }
            }
        },
        {
            name: 'Fractal Noise',
            slug: 'fractal-noise',
            layerName: 'Live_FractalNoise_Rect',
            implPath: path.join(ROOT, 'effects', 'fractal-noise', 'implementation.js'),
            frameBase: path.join(FRAMES_DIR, 'fractal-noise-live').replace(/\\/g, '/'),
            config: {
                params: {
                    fractalType: 1, // Turbulent Smooth
                    contrast: 130.0,
                    brightness: -10.0,
                    complexity: 5.0,
                    evolution: 90.0,
                    invert: 0
                }
            }
        },
        {
            name: 'Tint',
            slug: 'tint',
            layerName: 'Live_Tint_Rect',
            implPath: path.join(ROOT, 'effects', 'tint', 'implementation.js'),
            frameBase: path.join(FRAMES_DIR, 'tint-live').replace(/\\/g, '/'),
            config: {
                params: {
                    mapBlackTo: { r: 255, g: 30, b: 0, a: 255 },
                    mapWhiteTo: { r: 0, g: 210, b: 255, a: 255 },
                    amount: 0.9
                }
            }
        },
        {
            name: 'CC Ball Action',
            slug: 'cc-ball-action',
            layerName: 'Live_CCBallAction_Rect',
            implPath: path.join(ROOT, 'effects', 'cc-ball-action', 'implementation.js'),
            frameBase: path.join(FRAMES_DIR, 'cc-ball-action-live').replace(/\\/g, '/'),
            config: {
                params: {
                    scatter: 20.0,
                    rotationAxis: 1, // Y-axis
                    rotationAngle: 30.0,
                    ballSize: 110.0,
                    gridSpacing: 14.0,
                    instabilityState: 15.0
                }
            }
        },
        {
            name: 'CC RepeTile',
            slug: 'cc-repetile',
            layerName: 'Live_CCRepeTile_Rect',
            implPath: path.join(ROOT, 'effects', 'cc-repetile', 'implementation.js'),
            frameBase: path.join(FRAMES_DIR, 'cc-repetile-live').replace(/\\/g, '/'),
            config: {
                params: {
                    expandRight: 100.0,
                    expandLeft: 50.0,
                    expandUp: 50.0,
                    expandDown: 100.0,
                    tiling: 1, // Flip ping-pong
                    blendBorders: 0.1
                }
            }
        },
        {
            name: 'Deep Glow',
            slug: 'deep-glow',
            layerName: 'Live_DeepGlow_Rect',
            implPath: path.join(ROOT, 'effects', 'deep-glow', 'implementation.js'),
            frameBase: path.join(FRAMES_DIR, 'deep-glow-live').replace(/\\/g, '/'),
            config: {
                params: {
                    radius: 80.0,
                    exposure: 1.2,
                    threshold: 0.1,
                    aberration: 0.3
                }
            }
        },
        {
            name: 'Turbulent Displace',
            slug: 'turbulent-displace',
            layerName: 'Live_TurbulentDisplace_Rect',
            implPath: path.join(ROOT, 'effects', 'turbulent-displace', 'implementation.js'),
            frameBase: path.join(FRAMES_DIR, 'turbulent-displace-live').replace(/\\/g, '/'),
            config: {
                params: {
                    displacement: 0,
                    amount: 60.0,
                    size: 80.0,
                    complexity: 3.5,
                    evolution: 45.0
                }
            }
        }
    ];

    const results = [];

    for (const eff of effectsToVerify) {
        console.log(`\n----------------------------------------------------------------`);
        console.log(`Auditing Live Effect: ${eff.name} (${eff.slug})`);
        console.log(`----------------------------------------------------------------`);

        const implSource = fs.readFileSync(eff.implPath, 'utf8');

        const code = `
            var target = api.primitive('rectangle', '${eff.layerName}');
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

            // Render GPU frame snapshot
            api.renderPNGFrame('${eff.frameBase}', 100);

            var auditResult = {
                ok: Boolean(report && report.ok === true),
                effect: report ? report.effect : null,
                targetId: target,
                filterId: filterId,
                boundSlots: boundSlots,
                slotValues: slotValues,
                hasCode: Boolean(filterCode && filterCode.length > 50),
                frameBase: '${eff.frameBase}'
            };
            __result = auditResult;
            return auditResult;
        `;

        const execution = await stallion.runScriptWithExecution(code);
        const parsed = JSON.parse(execution.raw);

        if (!parsed.ok) {
            console.error(`Live execution FAILED for ${eff.name}:`, parsed.error, parsed.stack);
            results.push({ name: eff.name, slug: eff.slug, ok: false, error: parsed.error });
            continue;
        }

        const res = parsed.result;
        const pngPath = `${eff.frameBase}.png`;
        const pngExists = fs.existsSync(pngPath);
        const pngSize = pngExists ? fs.statSync(pngPath).size : 0;

        console.log(`✔ Live Cavalry Application:`);
        console.log(`  - Target Layer ID: ${res.targetId}`);
        console.log(`  - Filter Node ID : ${res.filterId}`);
        console.log(`  - SkSL Uploaded  : ${res.hasCode}`);
        console.log(`  - Bound Slots    :`, JSON.stringify(res.boundSlots));
        console.log(`  - Frame Snapshot : ${pngPath} (${pngSize} bytes)`);

        const isVerified = res.ok && res.filterId && res.hasCode && pngExists && pngSize > 1000;
        results.push({
            name: eff.name,
            slug: eff.slug,
            ok: isVerified,
            targetId: res.targetId,
            filterId: res.filterId,
            pngPath: pngPath,
            pngSize: pngSize,
            error: isVerified ? null : 'Frame verification or slot verification incomplete'
        });
    }

    console.log('\n================================================================');
    console.log('TIER 4 LIVE VERIFICATION AUDIT SUMMARY:');
    console.log('================================================================');
    let allPassed = true;
    for (const r of results) {
        console.log(`  ${r.ok ? '✔ PASSED' : '✖ FAILED'} ${r.name.padEnd(20)} | Node: ${r.filterId || 'NONE'} | Frame: ${r.pngSize} bytes`);
        if (!r.ok) allPassed = false;
    }
    console.log('================================================================\n');

    if (!allPassed) {
        throw new Error('Tier 4 Live Cavalry verification failed for one or more effects.');
    }

    // Update effect-registry.json status to "live-verified"
    const regPath = path.join(ROOT, 'effect-registry.json');
    const registry = JSON.parse(fs.readFileSync(regPath, 'utf8'));

    for (const r of results) {
        if (registry.effects[r.slug]) {
            registry.effects[r.slug].status = 'live-verified';
        }
    }

    fs.writeFileSync(regPath, JSON.stringify(registry, null, 2) + '\n', 'utf8');
    console.log('Updated effect-registry.json with live-verified status for all audited effects.');
}

main().catch(err => {
    console.error('Fatal live verification error:', err);
    process.exit(1);
});
