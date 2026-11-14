import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

import * as mathModel from '../effects/time-displacement/math-model.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EFFECT_DIR = path.join(ROOT, 'effects', 'time-displacement');

test('Time Displacement — Tier 1: Static validation & embedded code sync', () => {
    const skslPath = path.join(EFFECT_DIR, 'time-displacement.sksl');
    const pmapPath = path.join(EFFECT_DIR, 'parameter-map.json');
    const implPath = path.join(EFFECT_DIR, 'implementation.js');

    assert.ok(fs.existsSync(skslPath));
    assert.ok(fs.existsSync(pmapPath));
    assert.ok(fs.existsSync(implPath));

    const sksl = fs.readFileSync(skslPath, 'utf8');
    assert.ok(sksl.includes('uniform shader layer;'));
    assert.ok(sksl.includes('uniform float MaxDisplacementTime;'));
    assert.ok(sksl.includes('uniform float TimeResolution;'));
    assert.ok(sksl.includes('uniform float DisplacementChannel;'));
    assert.ok(sksl.includes('uniform float SpatialLagFactor;'));
    assert.ok(sksl.includes('half4 main(float2 fragCoord)'));

    const pmap = JSON.parse(fs.readFileSync(pmapPath, 'utf8'));
    assert.equal(pmap.effectSlug, 'time-displacement');
    assert.equal(pmap.parameters.length, 4);
});

test('Time Displacement — Tier 2: Mathematical invariants (Channel & Time Delta)', () => {
    // 1. Channel luminance extraction
    const luma = mathModel.extractChannel({ r: 1.0, g: 1.0, b: 1.0, a: 1.0 }, 4);
    assert.ok(Math.abs(luma - 1.0) < 1e-4);

    // 2. Neutral luminance (0.5) produces 0 time shift
    const dt0 = mathModel.calculateTimeDelta(0.5, 2.0, 30.0);
    assert.equal(dt0, 0.0);

    // 3. Peak white luminance (1.0) with maxTime = 2.0 produces +1.0 second shift
    const dtMax = mathModel.calculateTimeDelta(1.0, 2.0, 30.0);
    assert.equal(dtMax, 1.0);

    // 4. Black luminance (0.0) with maxTime = 2.0 produces -1.0 second shift
    const dtMin = mathModel.calculateTimeDelta(0.0, 2.0, 30.0);
    assert.equal(dtMin, -1.0);

    // 5. Quantization to 10 fps
    // (0.7 - 0.5) * 1.0 = 0.20 -> at 10 fps, 0.2 is exact frame 2
    const dtQuant = mathModel.calculateTimeDelta(0.7, 1.0, 10.0);
    assert.equal(dtQuant, 0.2);
});

test('Time Displacement — Tier 3: Headless Mock Stallion execution & secondary map linking', () => {
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
        timeDisplacementLayer: 'map_layer_999',
        maxDisplacementTime: 1.5,
        timeResolution: 24.0,
        displacementChannel: 4
    });

    assert.equal(result.status, 'success');
    assert.equal(result.effect, 'time-displacement');
    assert.ok(result.nodeId);
    assert.equal(result.targetLayerId, 'target_layer_123');
    assert.equal(result.connected, true);
    assert.equal(result.codeConfigured, true);
    assert.equal(result.timeDisplacementLayer, 'map_layer_999');
    assert.equal(result.mapConnected, true);

    assert.ok(result.boundAttributes['MaxDisplacementTime']);
    assert.ok(result.boundAttributes['TimeResolution']);
    assert.ok(result.boundAttributes['DisplacementChannel']);
    assert.ok(result.boundAttributes['SpatialLagFactor']);
});
