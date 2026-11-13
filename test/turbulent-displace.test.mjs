import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';

import {
    DEFAULT_PARAMS,
    DISPLACEMENT_MODES,
    PINNING_MODES,
    evaluateDisplacement,
    normalizeParams,
} from '../effects/turbulent-displace/math-model.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EFFECT_DIR = path.join(ROOT, 'effects', 'turbulent-displace');
const CAVALRY_MCP_STALLION_URL = pathToFileURL('C:/Users/khada/cavalry-mcp/dist/bridge/stallion.js').href;
const STALLION_MOCK_URL = pathToFileURL('C:/Users/khada/stallion/dist/stallion-mock.mjs').href;

const skslCode = fs.readFileSync(path.join(EFFECT_DIR, 'turbulent-displace.sksl'), 'utf8');
const deformerCode = fs.readFileSync(path.join(EFFECT_DIR, 'turbulent-displace.deformer.js'), 'utf8');
const implCode = fs.readFileSync(path.join(EFFECT_DIR, 'implementation.js'), 'utf8');
const paramMap = JSON.parse(fs.readFileSync(path.join(EFFECT_DIR, 'parameter-map.json'), 'utf8'));
const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'effect-registry.json'), 'utf8'));

test('Tier 1 — Static validation of SkSL, Deformer, Applicator, Registry, and Sync', async () => {
    const { validateSkslSource, validateCavalryContextUsage } = await import(CAVALRY_MCP_STALLION_URL);

    // 1. Validate SkSL filter source
    const skslRes = validateSkslSource(skslCode);
    assert.equal(skslRes.valid, true, `Expected valid SkSL, got errors: ${skslRes.errors.join('; ')}`);
    assert.equal(skslRes.errors.length, 0);
    assert.ok(!/^\s*uniform\s+[^;\n]+=/m.test(skslCode), 'SkSL uniforms must not contain inline initializers');

    const uniformNames = skslRes.uniforms.map((u) => u.name);
    assert.ok(!uniformNames.includes('resolution'), 'SkSL must not redeclare built-in Cavalry `resolution` uniform');
    for (const reqUniform of [
        'layer', 'Displacement', 'Amount', 'Size',
        'Offset', 'Complexity', 'Evolution', 'CycleEvolution',
        'CycleRevolutions', 'RandomSeed', 'Pinning', 'ResizeLayer', 'Antialiasing',
    ]) {
        assert.ok(uniformNames.includes(reqUniform), `Missing uniform ${reqUniform}`);
    }

    // 2. Validate Deformer context usage (strictly console, ctx, cavalry, def)
    const defRes = validateCavalryContextUsage(deformerCode, 'javaScriptDeformer');
    assert.equal(defRes.valid, true, `Deformer context violation: ${defRes.forbiddenUsages.join(', ')}`);
    assert.deepEqual(defRes.forbiddenUsages, []);

    // 3. Validate Applicator script context usage
    const appRes = validateCavalryContextUsage(implCode, 'script');
    assert.equal(appRes.valid, true, `Applicator context violation: ${appRes.forbiddenUsages.join(', ')}`);

    // 4. Verify embedded SKSL_SOURCE & DEFORMER_SOURCE match standalone source files verbatim
    const skslLiteral = JSON.stringify(skslCode);
    const defLiteral = JSON.stringify(deformerCode);
    assert.ok(implCode.includes(`var SKSL_SOURCE = ${skslLiteral};`), 'Embedded SKSL_SOURCE out of sync with turbulent-displace.sksl');
    assert.ok(implCode.includes(`var DEFORMER_SOURCE = ${defLiteral};`), 'Embedded DEFORMER_SOURCE out of sync with turbulent-displace.deformer.js');

    // 5. Verify registry, parameter map, and plugin manifest consistency
    assert.equal(registry.effects['turbulent-displace'].aeMatchName, 'ADBE Turbulent Displace');
    assert.equal(paramMap.aeMatchName, 'ADBE Turbulent Displace');
    assert.ok(paramMap.parameters.length >= 12);

    const pluginJson = JSON.parse(fs.readFileSync('C:/Users/khada/.gemini/config/plugins/ae-to-cavalry-effect-engineer/plugin.json', 'utf8'));
    const allowedKeys = new Set(['name', 'displayName', 'version', 'description', 'suggestedPrompts', 'logo', 'author', 'homepage', 'repository', 'disabled']);
    for (const k of Object.keys(pluginJson)) {
        assert.ok(allowedKeys.has(k), `Unexpected plugin.json key: ${k}`);
    }
});

test('Tier 2 — Mathematical invariants: zero strength, periodicity, field geometry, pinning', () => {
    // 1. Amount == 0 guarantees exact zero displacement in all 9 modes
    for (let mode = 0; mode <= 8; mode++) {
        const [dx, dy] = evaluateDisplacement(137.4, 241.9, 500, 500, { displacement: mode, amount: 0 });
        assert.equal(dx, 0);
        assert.equal(dy, 0);
    }

    // 2. Negative Amount strictly negates displacement vector
    for (let mode = 0; mode <= 8; mode++) {
        const [px, py] = evaluateDisplacement(210, 175, 500, 500, { displacement: mode, amount: 65, complexity: 3.4 });
        const [nx, ny] = evaluateDisplacement(210, 175, 500, 500, { displacement: mode, amount: -65, complexity: 3.4 });
        assert.ok(Math.abs(px + nx) < 1e-12, `Mode ${mode} negative inversion mismatch X`);
        assert.ok(Math.abs(py + ny) < 1e-12, `Mode ${mode} negative inversion mismatch Y`);
    }

    // 3. Cycle Evolution seamless periodicity across arbitrary cycleRevolutions & base offsets
    for (const cycles of [1, 2, 3]) {
        const p0 = { cycleEvolution: true, cycleRevolutions: cycles, evolution: 17.5, complexity: 3.25 };
        const pEnd = { cycleEvolution: true, cycleRevolutions: cycles, evolution: 17.5 + 360 * cycles, complexity: 3.25 };
        const pHalf = { cycleEvolution: true, cycleRevolutions: cycles, evolution: 17.5 + 180 * cycles, complexity: 3.25 };
        const [d0x, d0y] = evaluateDisplacement(220, 260, 500, 500, p0);
        const [d1x, d1y] = evaluateDisplacement(220, 260, 500, 500, pEnd);
        const [dhx, dhy] = evaluateDisplacement(220, 260, 500, 500, pHalf);

        assert.ok(Math.abs(d0x - d1x) < 1e-9, `Cycle=${cycles} failed X loop continuity: ${d0x} vs ${d1x}`);
        assert.ok(Math.abs(d0y - d1y) < 1e-9, `Cycle=${cycles} failed Y loop continuity: ${d0y} vs ${d1y}`);
        assert.ok(Math.hypot(d0x - dhx, d0y - dhy) > 1.0, 'Half-cycle should genuinely differ from frame 0');
    }

    // 4. Non-cyclic Evolution does NOT repeat after 360 deg
    const [nc0x, nc0y] = evaluateDisplacement(-30, 10, 500, 500, { cycleEvolution: false, evolution: 0 });
    const [nc1x, nc1y] = evaluateDisplacement(-30, 10, 500, 500, { cycleEvolution: false, evolution: 360 });
    assert.ok(Math.hypot(nc0x - nc1x, nc0y - nc1y) > 0.5, 'Non-cyclic evolution must continue evolving past 360 deg');

    // 5. Horizontal & Vertical mode axis isolation
    const [hx, hy] = evaluateDisplacement(-70, 60, 500, 500, { displacement: DISPLACEMENT_MODES.horizontal, amount: 80 });
    assert.notEqual(hx, 0);
    assert.equal(hy, 0, 'Horizontal Displacement must produce zero dy');

    const [vx, vy] = evaluateDisplacement(-70, 60, 500, 500, { displacement: DISPLACEMENT_MODES.vertical, amount: 80 });
    assert.equal(vx, 0, 'Vertical Displacement must produce zero dx');
    assert.notEqual(vy, 0);

    // 6. Mathematical orthogonality between Bulge (-grad N) and Twist (curl N) at any point
    for (const [x, y] of [[-130, -110], [10, -10], [91, -61]]) {
        const [bx, by] = evaluateDisplacement(x, y, 500, 500, { displacement: DISPLACEMENT_MODES.bulge, complexity: 2.5 });
        const [tx, ty] = evaluateDisplacement(x, y, 500, 500, { displacement: DISPLACEMENT_MODES.twist, complexity: 2.5 });
        const bMag = Math.hypot(bx, by);
        const tMag = Math.hypot(tx, ty);
        assert.ok(bMag > 0.01 && tMag > 0.01);
        const dotNorm = Math.abs((bx * tx + by * ty) / (bMag * tMag));
        assert.ok(dotNorm < 1e-12, `Expected Bulge perp Twist, got normalized dot=${dotNorm}`);
    }

    // 7. Edge Pinning boundary locking in Centered Y-up Coordinates (px in [-W/2, +W/2], py in [-H/2, +H/2])
    // Pin All locks all 4 borders (-250, +250) strictly to 0 while interior (0, 0) stays displaced
    assert.deepEqual(evaluateDisplacement(-250, 0, 500, 500, { pinning: PINNING_MODES.all }), [0, 0]);
    assert.deepEqual(evaluateDisplacement(250, 0, 500, 500, { pinning: PINNING_MODES.all }), [0, 0]);
    assert.deepEqual(evaluateDisplacement(0, -250, 500, 500, { pinning: PINNING_MODES.all }), [0, 0]);
    assert.deepEqual(evaluateDisplacement(0, 250, 500, 500, { pinning: PINNING_MODES.all }), [0, 0]);
    const [icx, icy] = evaluateDisplacement(0, 0, 500, 500, { pinning: PINNING_MODES.all });
    assert.ok(Math.hypot(icx, icy) > 1.0, 'Center must still displace under Pin All');

    // Pin Horizontal locks X borders (-W/2 and +W/2) while top/bottom stay active
    assert.deepEqual(evaluateDisplacement(-250, 0, 500, 500, { pinning: PINNING_MODES.horizontal }), [0, 0]);
    assert.deepEqual(evaluateDisplacement(250, 0, 500, 500, { pinning: PINNING_MODES.horizontal }), [0, 0]);
    const [topMidX, topMidY] = evaluateDisplacement(0, 250, 500, 500, { pinning: PINNING_MODES.horizontal });
    assert.ok(Math.hypot(topMidX, topMidY) > 1.0, 'Top midpoint should still displace under Pin Horizontal');

    // Pin Left locks X=-250 while X=+250 remains free; Pin Top locks Y=+250 (+Y up) while Y=-250 remains free
    assert.deepEqual(evaluateDisplacement(-250, 0, 500, 500, { pinning: PINNING_MODES.left }), [0, 0]);
    const [rightMidX, rightMidY] = evaluateDisplacement(250, 0, 500, 500, { pinning: PINNING_MODES.left });
    assert.ok(Math.hypot(rightMidX, rightMidY) > 1.0);
    assert.deepEqual(evaluateDisplacement(0, 250, 500, 500, { pinning: PINNING_MODES.top }), [0, 0]);
    const [botMidX, botMidY] = evaluateDisplacement(0, -250, 500, 500, { pinning: PINNING_MODES.top });
    assert.ok(Math.hypot(botMidX, botMidY) > 1.0);

    // 8. Fractional Complexity continuity (no sharp jump around octave integer boundaries)
    const [c0x, c0y] = evaluateDisplacement(-60, -40, 500, 500, { complexity: 2.0 });
    const [c1x, c1y] = evaluateDisplacement(-60, -40, 500, 500, { complexity: 2.001 });
    assert.ok(Math.hypot(c1x - c0x, c1y - c0y) < 0.05, 'Fractional complexity jump detected at 2.0 -> 2.001');

    // 9. Huge Random Seed safety (float32 folding) & String Enum parsing
    const extreme = evaluateDisplacement(0, 0, 500, 500, { randomSeed: 987654321, complexity: 10 });
    assert.ok(Number.isFinite(extreme[0]) && Number.isFinite(extreme[1]));
    const parsed = normalizeParams({ displacement: 'Twist Smoother', pinning: 'Pin Left', antialiasing: 'High', cycleEvolution: true });
    assert.equal(parsed.displacement, 5);
    assert.equal(parsed.pinning, 4);
    assert.equal(parsed.antialiasing, 1);
    assert.equal(parsed.cycleEvolution, 1);
});

test('Tier 2 — JavaScript Deformer VM execution with Cavalry 2.8 Mesh & Path.pathData() API', () => {
    let resampledLen = null;
    let meshWritten = false;
    let falloffQueried = 0;
    let storedPathData = [
        { type: 'moveTo', point: { x: -100, y: -100 } },
        { type: 'lineTo', point: { x: 100, y: -100 } },
        { type: 'lineTo', point: { x: 100, y: 100 } },
        { type: 'lineTo', point: { x: -100, y: 100 } },
        { type: 'close' },
    ];

    const mockPath = {
        resample: (len) => { resampledLen = len; },
        pathData: () => structuredClone(storedPathData),
        setPathData: (pd) => { storedPathData = pd; },
    };
    const mockMesh = {
        count: () => 1,
        childMeshCount: () => 0,
        getPathAtIndex: () => mockPath,
        setPathAtIndex: () => {},
    };
    const sandbox = {
        console,
        ctx: { layerId: 'shape#1', niceName: 'Rect' },
        cavalry: {},
        def: {
            getBoundingBox: () => ({ x: 0, y: 0, width: 200, height: 200, left: -100, right: 100, top: 100, bottom: -100, centre: { x: 0, y: 0 } }),
            getRootMesh: () => mockMesh,
            setRootMesh: () => { meshWritten = true; },
            getFalloffAtPoint: () => { falloffQueried++; return 1.0; },
        },
        tdAmount: 60,
        tdDisp: 2, // Twist
        tdPinning: 1, // Pin All
        tdResampleLen: 6,
    };

    vm.runInNewContext(deformerCode, sandbox);
    assert.equal(resampledLen, 6);
    assert.equal(meshWritten, true);
    assert.ok(falloffQueried >= 4);

    // At boundary corners (-100,-100), Pin All locks displacement to ~0
    const p0 = storedPathData[0].point;
    assert.ok(Math.hypot(p0.x - (-100), p0.y - (-100)) < 1e-6);

    // Unpinned interior/free point must move cleanly
    storedPathData.splice(4, 0, { type: 'lineTo', point: { x: 25, y: -35 } });
    sandbox.tdPinning = 0;
    vm.runInNewContext(deformerCode, sandbox);
    const pFree = storedPathData[4].point;
    assert.ok(Math.hypot(pFree.x - 25, pFree.y - (-35)) > 1.0);
});

test('Tier 3 — Headless Stallion Mock Bridge: selection, attachment, idempotency, animation', async () => {
    const { startMockServer } = await import(STALLION_MOCK_URL);
    const { loadConfig, runScriptWithResult } = await import(CAVALRY_MCP_STALLION_URL);

    const mock = await startMockServer({ host: '127.0.0.1', port: 0 });
    const cfg = { ...loadConfig(), url: `http://${mock.host}:${mock.port}`, host: mock.host, port: mock.port };

    try {
        // 1. Empty selection fails cleanly with zero scene mutation
        const initialCount = mock.scene.layers.size;
        const emptyResp = JSON.parse(await runScriptWithResult(implCode, cfg));
        assert.equal(emptyResp.ok, true);
        assert.equal(emptyResp.result.ok, false);
        assert.match(emptyResp.result.error, /No layer selected/i);
        assert.equal(mock.scene.layers.size, initialCount);

        // 2. Select an existing rectangle shape and apply in default auto/sksl mode
        const shapeId = mock.api.primitive('rectangle', 'Hero Panel');
        mock.api.select([shapeId]);
        const customCfg1 = {
            mode: 'auto',
            params: {
                displacement: 'Twist',
                amount: 75,
                size: 140,
                complexity: 3.5,
                cycleEvolution: true,
                cycleRevolutions: 2,
                pinning: 'Pin Left',
                antialiasing: 'High',
            },
            animateEvolution: { startFrame: 0, endFrame: 60, startValue: 0, endValue: 720 },
        };
        const script1 = `var __EFFECT_CONFIG__ = ${JSON.stringify(customCfg1)};\n${implCode}`;
        const res1 = JSON.parse(await runScriptWithResult(script1, cfg));

        assert.equal(res1.ok, true);
        assert.equal(res1.result.ok, true);
        assert.equal(res1.result.appliedCount, 1);

        const app1 = res1.result.applied[0];
        assert.equal(app1.mechanism, 'skslFilter');
        assert.equal(app1.action, 'created');
        assert.equal(app1.targetId, shapeId);

        // Verify original shape is preserved & still selected
        assert.ok(['basicShape', 'rectangleShape'].includes(mock.api.getLayerType(shapeId)));
        assert.deepEqual(mock.api.getSelection(), [shapeId]);
        assert.ok(mock.scene.layers.has(app1.nodeId));
        assert.equal(mock.api.getLayerType(app1.nodeId), 'skslFilter');
        assert.equal(String(mock.api.getInConnection(shapeId, 'filters')).split('.')[0], app1.nodeId);

        // Verify keyframed evolution on bound attribute across frames
        const evoAttr = app1.boundAttrs.evolution;
        assert.ok(evoAttr, 'Expected evolution uniform to bind on mock skslFilter');
        assert.equal(mock.api.get(app1.nodeId, 'uniforms.Displacement'), 2);
        assert.equal(mock.api.get(app1.nodeId, 'uniforms.Amount'), 75);
        mock.api.setFrame(0);
        assert.equal(mock.api.get(app1.nodeId, evoAttr), 0);
        mock.api.setFrame(60);
        assert.equal(mock.api.get(app1.nodeId, evoAttr), 720);

        // 3. Repeat application updates idempotently (layer count does not increase)
        const countAfterFirst = mock.scene.layers.size;
        const customCfg2 = {
            mode: 'auto',
            params: { displacement: 'Bulge Smoother', amount: 110, size: 80 },
        };
        const res2 = JSON.parse(await runScriptWithResult(`var __EFFECT_CONFIG__ = ${JSON.stringify(customCfg2)};\n${implCode}`, cfg));
        assert.equal(res2.result.ok, true);
        assert.equal(res2.result.applied[0].action, 'updated');
        assert.equal(res2.result.applied[0].nodeId, app1.nodeId);
        assert.equal(mock.scene.layers.size, countAfterFirst);
        assert.equal(mock.api.get(app1.nodeId, 'uniforms.Displacement'), 4);
        assert.equal(mock.api.get(app1.nodeId, 'uniforms.Amount'), 110);

        // 4. Vector Deformer mode on a second shape + idempotency + evolution animation
        const textId = mock.api.create('textShape', 'AE Type');
        mock.api.select([textId]);
        const defCfg = {
            mode: 'deformer',
            params: { displacement: 'Turbulent', amount: 42, size: 60, complexity: 2.2 },
            animateEvolution: { keyframes: [{ frame: 0, value: 0 }, { frame: 30, value: 180 }, { frame: 60, value: 360 }] },
        };
        const defRes1 = JSON.parse(await runScriptWithResult(`var __EFFECT_CONFIG__ = ${JSON.stringify(defCfg)};\n${implCode}`, cfg));
        assert.equal(defRes1.result.ok, true);
        assert.equal(defRes1.result.applied[0].mechanism, 'javaScriptDeformer');
        assert.equal(defRes1.result.applied[0].action, 'created');
        const defNodeId = defRes1.result.applied[0].nodeId;
        assert.equal(String(mock.api.getInConnection(textId, 'deformers')).split('.')[0], defNodeId);
        assert.equal(mock.api.getLayerType(defNodeId), 'javaScriptDeformer');
        assert.ok(String(mock.api.get(defNodeId, 'expression')).includes('tdDisplacePoint'));

        const countAfterDef = mock.scene.layers.size;
        const defRes2 = JSON.parse(await runScriptWithResult(`var __EFFECT_CONFIG__ = ${JSON.stringify(defCfg)};\n${implCode}`, cfg));
        assert.equal(defRes2.result.applied[0].action, 'updated');
        assert.equal(defRes2.result.applied[0].nodeId, defNodeId);
        assert.equal(mock.scene.layers.size, countAfterDef);
        assert.deepEqual(mock.api.getSelection(), [textId]);
    } finally {
        await mock.close();
    }
});

test('Tier 1 & 3 — Library templates validation and CLI mock runner integration', async () => {
    const { validateSkslSource, validateCavalryContextUsage } = await import(CAVALRY_MCP_STALLION_URL);
    const tplSksl = fs.readFileSync(path.join(ROOT, 'templates', 'sksl-filter', 'filter-template.sksl'), 'utf8');
    const tplDef = fs.readFileSync(path.join(ROOT, 'templates', 'javascript-deformer', 'deformer-template.js'), 'utf8');
    assert.equal(validateSkslSource(tplSksl).valid, true);
    assert.equal(validateCavalryContextUsage(tplDef, 'javaScriptDeformer').valid, true);

    const cliOut = execFileSync(
        process.execPath,
        ['scripts/apply-effect.mjs', 'turbulent-displace', '--mock', '--param', 'displacement=Twist', '--param', 'amount=60', '--param', 'antialiasing=High'],
        { cwd: ROOT, encoding: 'utf8' }
    );
    const parsed = JSON.parse(cliOut);
    assert.equal(parsed.ok, true);
    assert.equal(parsed.result.ok, true);
    assert.equal(parsed.result.params.displacement, 2);
    assert.equal(parsed.result.params.amount, 60);
    assert.equal(parsed.result.params.antialiasing, 1);
});

test('Tier 2 — Live Cavalry 2.8 inputs.* dynamic slot binding & header stripping simulation', () => {
    const nodes = new Map([
        ['basicShape#1', { type: 'basicShape', niceName: 'Hero Rect', attrs: { filters: null }, inConns: { 'filters.0': '' } }],
        ['null#1', { type: 'null', niceName: 'Ctrl Null', attrs: { position: { x: 0, y: 0 }, is3d: false }, inConns: {} }],
    ]);
    let selectionIds = ['basicShape#1'];
    let nextSeq = 1;
    const keyframes = [];
    const api = {
        getSelection: () => selectionIds.slice(),
        select: (ids) => { selectionIds = ids.slice(); },
        deleteLayer: (id) => { nodes.delete(id); },
        startUndoGroup: () => {},
        endUndoGroup: () => {},
        getLayerType: (id) => nodes.get(id)?.type ?? '',
        getNiceName: (id) => nodes.get(id)?.niceName ?? id,
        create: (type, name) => {
            const id = `${type}#${nextSeq++}`;
            if (type === 'skslFilter') {
                nodes.set(id, {
                    type,
                    niceName: name,
                    attrs: { inputs: null, 'inputs.0': 0, code: '', padding: { x: 0, y: 0 } },
                    customNames: { 'inputs.0': 'n0' },
                    nextInputIdx: 1,
                });
            }
            return id;
        },
        connect: (srcId, _srcAttr, dstId, dstAttr) => {
            if (dstAttr === 'filters') nodes.get(dstId).inConns['filters.0'] = `${srcId}.id`;
        },
        getInConnection: (id, attr) => nodes.get(id)?.inConns?.[attr] ?? '',
        getCompLayers: () => [...nodes.keys()],
        getOutConnections: () => [],
        // Match real Cavalry 2.8: `api.getAttributes` lists `'inputs'` only, NOT `'inputs.0'..'inputs.N'`!
        getAttributes: (id) => Object.keys(nodes.get(id)?.attrs ?? {}).filter((k) => !/^inputs\.\d+$/.test(k)),
        getCustomAttributeName: (id, slot) => nodes.get(id)?.customNames?.[slot] ?? '',
        renameAttribute: (id, slot, newName) => { nodes.get(id).customNames[slot] = newName; },
        addDynamic: (id, arrAttr) => {
            const node = nodes.get(id);
            const slot = `${arrAttr}.${node.nextInputIdx++}`;
            node.attrs[slot] = 0;
            node.customNames[slot] = '';
            return slot;
        },
        set: (id, props) => { Object.assign(nodes.get(id).attrs, props); },
        keyframe: (id, frame, props) => { keyframes.push({ id, frame, props }); },
    };

    const runLiveSim = (cfgObj) => vm.runInNewContext(
        `var __EFFECT_CONFIG__ = ${JSON.stringify(cfgObj)};\nvar __result;\n${implCode}\n__result;`,
        { api }
    );

    const res1 = runLiveSim({
        mode: 'sksl',
        params: { displacement: 'Twist', amount: 80, resizeLayer: true },
        animateEvolution: { startFrame: 0, endFrame: 30, startValue: 0, endValue: 180 },
    });
    assert.equal(res1.ok, true);
    const app1 = res1.applied[0];
    assert.equal(app1.uniformMode, 'cavalry-inputs-array');
    assert.equal(app1.action, 'created');
    assert.equal(app1.boundAttrs.displacement, 'inputs.0');
    assert.equal(app1.boundAttrs.evolution, 'inputs.5');
    assert.equal(app1.boundAttrs.antialiasing, 'inputs.11');
    const filterNode = nodes.get(app1.nodeId);
    assert.equal(filterNode.customNames['inputs.0'], 'Displacement');
    assert.equal(filterNode.customNames['inputs.5'], 'Evolution');
    assert.equal(filterNode.attrs['inputs.0'], 2);
    assert.equal(filterNode.attrs['inputs.1'], 80);
    assert.equal(filterNode.attrs.padding.x, 100);
    assert.ok(!/^\s*uniform\s+(?:float|float2|bool)\s+[A-Za-z0-9_]+\s*;/m.test(filterNode.attrs.code), 'Live code must strip explicit uniform declarations');
    assert.equal(keyframes.length, 2);

    // Repeat apply via indexed `filters.0` lookup must reuse existing inputs.0..11 in place
    const res2 = runLiveSim({ mode: 'sksl', params: { displacement: 'Bulge', amount: 40, resizeLayer: false } });
    assert.equal(res2.applied[0].action, 'updated');
    assert.equal(res2.applied[0].nodeId, app1.nodeId);
    assert.equal(filterNode.nextInputIdx, 12, 'Idempotent update must not allocate extra inputs.* slots');
    assert.equal(filterNode.attrs['inputs.0'], 1);
    assert.equal(filterNode.attrs['inputs.1'], 40);
    assert.equal(filterNode.attrs.padding.x, 0);

    // Mixed selection containing a non-renderable `null` layer skips `null` cleanly with a warning without orphan nodes
    selectionIds = ['null#1', 'basicShape#1'];
    const resMixed = runLiveSim({ mode: 'sksl', params: { amount: 55 } });
    assert.equal(resMixed.ok, true);
    assert.equal(resMixed.appliedCount, 1);
    assert.equal(resMixed.warnings.length, 1);
    assert.match(resMixed.warnings[0], /Ctrl Null/);
    assert.deepEqual(selectionIds, ['null#1', 'basicShape#1']);

    // Selecting ONLY a `null` layer fails cleanly without mutating the scene
    selectionIds = ['null#1'];
    const nodeCountBeforeNullOnly = nodes.size;
    const resNullOnly = runLiveSim({ mode: 'sksl' });
    assert.equal(resNullOnly.ok, false);
    assert.equal(nodes.size, nodeCountBeforeNullOnly);
});
