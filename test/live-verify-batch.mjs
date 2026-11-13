import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STALLION_URL = pathToFileURL('C:/Users/khada/cavalry-mcp/dist/bridge/stallion.js').href;

async function run() {
    console.log('Connecting to live Cavalry at http://127.0.0.1:8080...');
    const stallion = await import(STALLION_URL);

    const gbImpl = fs.readFileSync(path.join(ROOT, 'effects', 'gaussian-blur', 'implementation.js'), 'utf8');
    const fnImpl = fs.readFileSync(path.join(ROOT, 'effects', 'fractal-noise', 'implementation.js'), 'utf8');
    const tintImpl = fs.readFileSync(path.join(ROOT, 'effects', 'tint', 'implementation.js'), 'utf8');
    const baImpl = fs.readFileSync(path.join(ROOT, 'effects', 'cc-ball-action', 'implementation.js'), 'utf8');

    const tests = [
        {
            name: 'Gaussian Blur',
            slug: 'gaussian-blur',
            layerName: 'Live_GB_Shape',
            impl: gbImpl,
            config: { params: { blurriness: 45.0, blurDimensions: 0, repeatEdgePixels: 1 } }
        },
        {
            name: 'Fractal Noise',
            slug: 'fractal-noise',
            layerName: 'Live_FN_Shape',
            impl: fnImpl,
            config: { params: { contrast: 110.0, brightness: -5.0, complexity: 4.0, evolution: 45.0 } }
        },
        {
            name: 'Tint',
            slug: 'tint',
            layerName: 'Live_Tint_Shape',
            impl: tintImpl,
            config: {
                params: {
                    mapBlackTo: { r: 255, g: 20, b: 20, a: 255 },
                    mapWhiteTo: { r: 20, g: 220, b: 255, a: 255 },
                    amount: 0.85
                }
            }
        },
        {
            name: 'CC Ball Action',
            slug: 'cc-ball-action',
            layerName: 'Live_BA_Shape',
            impl: baImpl,
            config: { params: { scatter: 30.0, ballSize: 115.0, gridSpacing: 14.0, instabilityState: 7.0 } }
        }
    ];

    const results = [];

    for (const t of tests) {
        console.log(`\n======================================================`);
        console.log(`Executing Live Cavalry Effect: ${t.name} (${t.slug})`);
        console.log(`======================================================`);

        const code = `
            var target = api.primitive('rectangle', '${t.layerName}');
            api.set(target, { 'position.x': 0, 'position.y': 0, 'size.x': 250, 'size.y': 250 });
            api.select([target]);

            var __EFFECT_CONFIG__ = ${JSON.stringify(t.config)};
            var res = (function() {
                ${t.impl}
            })();

            var sel = api.getSelection();
            var filterId = res && res.results && res.results[0] ? res.results[0].filterId : null;
            var filterAttrs = filterId ? api.getAttributes(filterId) : [];
            var filterCode = filterId ? api.get(filterId, 'code') : '';
            var input0 = filterId ? api.get(filterId, 'inputs.0') : null;

            return {
                res: res,
                target: target,
                filterId: filterId,
                filterAttrsCount: filterAttrs.length,
                hasCode: Boolean(filterCode && filterCode.length > 50),
                input0: input0
            };
        `;

        const execution = await stallion.runScriptWithExecution(code);
        const parsed = JSON.parse(execution.raw);

        if (!parsed.ok) {
            console.error(`Live execution FAILED for ${t.name}:`, parsed.error, parsed.stack);
            results.push({ name: t.name, slug: t.slug, ok: false, error: parsed.error });
            continue;
        }

        const data = parsed.result;
        console.log(`✔ ${t.name} applied successfully to live layer '${data.target}'!`);
        console.log(`  - Filter Node ID: ${data.filterId}`);
        console.log(`  - Attribute Count: ${data.filterAttrsCount}`);
        console.log(`  - Shader Uploaded: ${data.hasCode}`);
        console.log(`  - Primary Input (inputs.0): ${JSON.stringify(data.input0)}`);

        results.push({
            name: t.name,
            slug: t.slug,
            ok: true,
            target: data.target,
            filterId: data.filterId,
            hasCode: data.hasCode,
            input0: data.input0
        });
    }

    console.log('\n======================================================');
    console.log('LIVE CAVALRY VERIFICATION SUMMARY:');
    console.log('======================================================');
    let allOk = true;
    for (const r of results) {
        console.log(`  ${r.ok ? '✔' : '✖'} ${r.name.padEnd(16)}: ${r.ok ? 'PASSED (Target: ' + r.target + ', Filter: ' + r.filterId + ')' : 'FAILED (' + r.error + ')'}`);
        if (!r.ok) allOk = false;
    }
    console.log('======================================================');

    if (!allOk) {
        process.exitCode = 1;
    }
}

run().catch(err => {
    console.error('Fatal live test error:', err);
    process.exit(1);
});
