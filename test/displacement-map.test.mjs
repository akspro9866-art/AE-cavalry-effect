import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

import * as mathModel from '../effects/displacement-map/math-model.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EFFECT_DIR = path.join(ROOT, 'effects', 'displacement-map');

test('Displacement Map — Tier 1: Static validation & embedded code sync', () => {
    const skslPath = path.join(EFFECT_DIR, 'displacement-map.sksl');
    const pmapPath = path.join(EFFECT_DIR, 'parameter-map.json');
    const implPath = path.join(EFFECT_DIR, 'implementation.js');

    assert.ok(fs.existsSync(skslPath));
    assert.ok(fs.existsSync(pmapPath));
    assert.ok(fs.existsSync(implPath));

    const sksl = fs.readFileSync(skslPath, 'utf8');
    assert.ok(sksl.includes('uniform shader layer;'));
    assert.ok(sksl.includes('uniform float MaxHorizontalDisplacement;'));
    assert.ok(sksl.includes('uniform float MaxVerticalDisplacement;'));
    assert.ok(sksl.includes('uniform float HorizontalSourceChannel;'));
    assert.ok(sksl.includes('uniform float VerticalSourceChannel;'));
    assert.ok(sksl.includes('uniform float MapBehavior;'));
    assert.ok(sksl.includes('uniform float EdgeBehavior;'));
    assert.ok(sksl.includes('half4 main(float2 fragCoord)'));

    const pmap = JSON.parse(fs.readFileSync(pmapPath, 'utf8'));
    assert.equal(pmap.effectSlug, 'displacement-map');
    assert.equal(pmap.parameters.length, 6);
});

test('Displacement Map — Tier 2: Mathematical invariants (Channel Extraction & Deflection)', () => {
    // 1. Red channel centered at 0.5 -> 0 deflection
    const midRed = mathModel.extractChannel({ r: 0.5, g: 0.5, b: 0.5, a: 1.0 }, 0);
    assert.ok(Math.abs(midRed) < 1e-4);

    // 2. Full white pixel -> Luminance = 1.0 - 0.5 = +0.5
    const whiteLuma = mathModel.extractChannel({ r: 1.0, g: 1.0, b: 1.0, a: 1.0 }, 4);
    assert.ok(Math.abs(whiteLuma - 0.5) < 1e-4);

    // 3. Full black pixel -> Luminance = 0.0 - 0.5 = -0.5
    const blackLuma = mathModel.extractChannel({ r: 0.0, g: 0.0, b: 0.0, a: 1.0 }, 4);
    assert.ok(Math.abs(blackLuma - (-0.5)) < 1e-4);

    // 4. Deflection calculation
    const disp = mathModel.calculateDisplacement({ r: 1.0, g: 0.0, b: 0.0, a: 1.0 }, {
        maxHorizontalDisplacement: 20.0,
        maxVerticalDisplacement: 20.0,
        horizontalSourceChannel: 0, // Red = 1.0 -> (1.0 - 0.5) * 20 = +10
        verticalSourceChannel: 1    // Green = 0.0 -> (0.0 - 0.5) * 20 = -10
    });
    assert.ok(Math.abs(disp.dx - 10.0) < 1e-4);
    assert.ok(Math.abs(disp.dy - (-10.0)) < 1e-4);

    // 5. Padding
    const pad = mathModel.calculatePadding({ maxHorizontalDisplacement: 30, maxVerticalDisplacement: 40 });
    assert.equal(pad.x, 40);
    assert.equal(pad.y, 50);
});

test('Displacement Map — Tier 3: Headless Mock Stallion execution & secondary layer linking', () => {
    const implSource = fs.readFileSync(path.join(EFFECT_DIR, 'implementation.js'), 'utf8');

    const createdNodes = [];
    const nodeAttributes = {};
    const customNames = {};
    const connections = [];

    const mockApi = {
        create: (type) => {
            const id = `${type}_${createdNodes.length + 1}`;
            createdNodes.push({ id, type });
            nodeAttributes[id] = ['code', 'padding', 'mattes'];
            return id;
        },
        setName: (id, name) => {},
        set: (id, payload) => {
            for (const [k, v] of Object.entries(payload)) {
                if (!nodeAttributes[id].includes(k)) {
                    nodeAttributes[id].push(k);
                }
                nodeAttributes[id][`_val_${k}`] = v;
            }
            return true;
        },
        getAttributes: (id) => nodeAttributes[id] || [],
        addDynamic: (id, group, type) => {
            let idx = 0;
            while (nodeAttributes[id].includes(`${group}.${idx}`)) {
                idx++;
            }
            const slot = `${group}.${idx}`;
            nodeAttributes[id].push(slot);
            return slot;
        },
        renameAttribute: (id, slot, newName) => {
            customNames[`${id}:${slot}`] = newName;
            return true;
        },
        getCustomAttributeName: (id, slot) => {
            return customNames[`${id}:${slot}`] || '';
        },
        connect: (srcId, srcAttr, dstId, dstAttr) => {
            connections.push({ srcId, srcAttr, dstId, dstAttr });
            return true;
        }
    };

    const ctx = {
        api: mockApi,
        module: { exports: {} },
        exports: {}
    };
    vm.createContext(ctx);
    vm.runInContext(implSource, ctx);

    const applicator = ctx.module.exports;
    assert.ok(applicator && typeof applicator.apply === 'function');

    const result = applicator.apply('target_layer_123', {
        displacementMapLayer: 'secondary_map_456',
        maxHorizontalDisplacement: 25.0,
        maxVerticalDisplacement: 25.0,
        horizontalSourceChannel: 4, // Luminance
        verticalSourceChannel: 4,
        edgeBehavior: 1
    });

    assert.equal(result.status, 'success');
    assert.equal(result.effect, 'displacement-map');
    assert.ok(result.nodeId);
    assert.equal(result.targetLayerId, 'target_layer_123');
    assert.equal(result.connected, true);
    assert.equal(result.codeConfigured, true);
    assert.equal(result.mapSourceLayer, 'secondary_map_456');
    assert.equal(result.mapConnected, true);

    // Verify secondary map connection was recorded
    const matteConn = connections.find(c => c.srcId === 'secondary_map_456' && c.dstId === result.nodeId);
    assert.ok(matteConn);

    assert.ok(result.boundAttributes['MaxHorizontalDisplacement']);
    assert.ok(result.boundAttributes['MaxVerticalDisplacement']);
    assert.ok(result.boundAttributes['HorizontalSourceChannel']);
    assert.ok(result.boundAttributes['VerticalSourceChannel']);
    assert.ok(result.boundAttributes['MapBehavior']);
    assert.ok(result.boundAttributes['EdgeBehavior']);
});
