import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

import * as mathModel from '../effects/gradient-ramp/math-model.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EFFECT_DIR = path.join(ROOT, 'effects', 'gradient-ramp');

test('Gradient Ramp — Tier 1: Static validation & embedded code sync', () => {
    const skslPath = path.join(EFFECT_DIR, 'gradient-ramp.sksl');
    const pmapPath = path.join(EFFECT_DIR, 'parameter-map.json');
    const implPath = path.join(EFFECT_DIR, 'implementation.js');

    assert.ok(fs.existsSync(skslPath));
    assert.ok(fs.existsSync(pmapPath));
    assert.ok(fs.existsSync(implPath));

    const sksl = fs.readFileSync(skslPath, 'utf8');
    assert.ok(sksl.includes('uniform shader layer;'));
    assert.ok(sksl.includes('uniform float StartPointX;'));
    assert.ok(sksl.includes('uniform float4 StartColor;'));
    assert.ok(sksl.includes('uniform float EndPointX;'));
    assert.ok(sksl.includes('uniform float4 EndColor;'));
    assert.ok(sksl.includes('uniform float RampShape;'));
    assert.ok(sksl.includes('uniform float RampScatter;'));
    assert.ok(sksl.includes('uniform float BlendWithOriginal;'));
    assert.ok(sksl.includes('half4 main(float2 fragCoord)'));

    const pmap = JSON.parse(fs.readFileSync(pmapPath, 'utf8'));
    assert.equal(pmap.effectSlug, 'gradient-ramp');
    assert.equal(pmap.parameters.length, 9);
});

test('Gradient Ramp — Tier 2: Mathematical invariants (Linear & Radial Projections)', () => {
    // 1. Linear ramp: Start at (-100, 0), End at (100, 0)
    const t0 = mathModel.calculateT({ x: -100, y: 0 }, {
        startPointX: -100, startPointY: 0, endPointX: 100, endPointY: 0, rampShape: 0
    });
    assert.equal(t0, 0.0);

    const tMid = mathModel.calculateT({ x: 0, y: 50 }, { // orthogonal displacement shouldn't change t
        startPointX: -100, startPointY: 0, endPointX: 100, endPointY: 0, rampShape: 0
    });
    assert.ok(Math.abs(tMid - 0.5) < 1e-4);

    const t1 = mathModel.calculateT({ x: 100, y: 0 }, {
        startPointX: -100, startPointY: 0, endPointX: 100, endPointY: 0, rampShape: 0
    });
    assert.equal(t1, 1.0);

    // 2. Radial ramp: Center at (0, 0), End at (100, 0) (radius = 100)
    const tRadCenter = mathModel.calculateT({ x: 0, y: 0 }, {
        startPointX: 0, startPointY: 0, endPointX: 100, endPointY: 0, rampShape: 1
    });
    assert.equal(tRadCenter, 0.0);

    const tRadCirc = mathModel.calculateT({ x: 0, y: 100 }, { // point on circle
        startPointX: 0, startPointY: 0, endPointX: 100, endPointY: 0, rampShape: 1
    });
    assert.ok(Math.abs(tRadCirc - 1.0) < 1e-4);

    // 3. Color interpolation
    const c = mathModel.interpolateRamp({ x: 0, y: 0 }, {
        startPointX: -100, startPointY: 0, endPointX: 100, endPointY: 0, rampShape: 0,
        startColor: { r: 0.2, g: 0.4, b: 0.6, a: 1.0 },
        endColor: { r: 0.8, g: 0.8, b: 0.8, a: 1.0 }
    });
    assert.ok(Math.abs(c.r - 0.5) < 1e-4);
    assert.ok(Math.abs(c.g - 0.6) < 1e-4);
    assert.ok(Math.abs(c.b - 0.7) < 1e-4);
});

test('Gradient Ramp — Tier 3: Headless Mock Stallion execution & dynamic slots', () => {
    const implSource = fs.readFileSync(path.join(EFFECT_DIR, 'implementation.js'), 'utf8');

    const createdNodes = [];
    const nodeAttributes = {};
    const customNames = {};
    const connections = [];

    const mockApi = {
        create: (type) => {
            const id = `${type}_${createdNodes.length + 1}`;
            createdNodes.push({ id, type });
            nodeAttributes[id] = ['code'];
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
        startPointX: -50.0,
        startPointY: -50.0,
        startColor: { r: 10, g: 20, b: 30, a: 255 },
        endPointX: 50.0,
        endPointY: 50.0,
        endColor: { r: 200, g: 220, b: 240, a: 255 },
        rampShape: 1,
        rampScatter: 10.0,
        blendWithOriginal: 25.0
    });

    assert.equal(result.status, 'success');
    assert.equal(result.effect, 'gradient-ramp');
    assert.ok(result.nodeId);
    assert.equal(result.targetLayerId, 'target_layer_123');
    assert.equal(result.connected, true);
    assert.equal(result.codeConfigured, true);

    assert.ok(result.boundAttributes['StartPointX']);
    assert.ok(result.boundAttributes['StartColor']);
    assert.ok(result.boundAttributes['EndPointX']);
    assert.ok(result.boundAttributes['EndColor']);
    assert.ok(result.boundAttributes['RampShape']);
    assert.ok(result.boundAttributes['RampScatter']);
    assert.ok(result.boundAttributes['BlendWithOriginal']);
});
