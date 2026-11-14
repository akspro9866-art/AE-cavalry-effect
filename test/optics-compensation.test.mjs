import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

import * as mathModel from '../effects/optics-compensation/math-model.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EFFECT_DIR = path.join(ROOT, 'effects', 'optics-compensation');

test('Optics Compensation — Tier 1: Static validation & embedded code sync', () => {
    const skslPath = path.join(EFFECT_DIR, 'optics-compensation.sksl');
    const pmapPath = path.join(EFFECT_DIR, 'parameter-map.json');
    const implPath = path.join(EFFECT_DIR, 'implementation.js');

    assert.ok(fs.existsSync(skslPath));
    assert.ok(fs.existsSync(pmapPath));
    assert.ok(fs.existsSync(implPath));

    const sksl = fs.readFileSync(skslPath, 'utf8');
    assert.ok(sksl.includes('uniform shader layer;'));
    assert.ok(sksl.includes('uniform float FieldOfView;'));
    assert.ok(sksl.includes('uniform float ReverseLensDistortion;'));
    assert.ok(sksl.includes('uniform float ViewCenterX;'));
    assert.ok(sksl.includes('uniform float ViewCenterY;'));
    assert.ok(sksl.includes('half4 main(float2 fragCoord)'));

    const pmap = JSON.parse(fs.readFileSync(pmapPath, 'utf8'));
    assert.equal(pmap.effectSlug, 'optics-compensation');
    assert.equal(pmap.parameters.length, 4);
});

test('Optics Compensation — Tier 2: Mathematical invariants (Identity at FOV 0, Inversion)', () => {
    const res = { x: 200, y: 200 };

    // 1. FOV = 0 is identity
    const p0 = mathModel.distortCoordinate({ x: 50, y: 50 }, res, { fieldOfView: 0 });
    assert.equal(p0.x, 50);
    assert.equal(p0.y, 50);

    // 2. Center point is fixed regardless of FOV
    const pCenter = mathModel.distortCoordinate({ x: 0, y: 0 }, res, { fieldOfView: 60 });
    assert.equal(pCenter.x, 0);
    assert.equal(pCenter.y, 0);

    // 3. Forward distortion expands coordinates radially outward:
    // A point at radius r > 0 will be sampled from r' > r (or r' < r depending on forward/reverse definition)
    const pForward = mathModel.distortCoordinate({ x: 50, y: 0 }, res, {
        fieldOfView: 60, reverseLensDistortion: 0
    });
    // In forward (pincushion compensation / fisheye), tan(theta) / tan(theta_0) < theta / theta_0
    // so rPrime is compressed towards center, meaning sample point is closer to center
    assert.ok(pForward.x > 0 && pForward.x < 50.0);

    // 4. Reverse distortion expands sample point outward
    const pReverse = mathModel.distortCoordinate({ x: 50, y: 0 }, res, {
        fieldOfView: 60, reverseLensDistortion: 1
    });
    assert.ok(pReverse.x > 50.0);
});

test('Optics Compensation — Tier 3: Headless Mock Stallion execution & dynamic slots', () => {
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
        fieldOfView: 45.0,
        reverseLensDistortion: 1,
        viewCenterX: 0.0,
        viewCenterY: 0.0
    });

    assert.equal(result.status, 'success');
    assert.equal(result.effect, 'optics-compensation');
    assert.ok(result.nodeId);
    assert.equal(result.targetLayerId, 'target_layer_123');
    assert.equal(result.connected, true);
    assert.equal(result.codeConfigured, true);

    assert.ok(result.boundAttributes['FieldOfView']);
    assert.ok(result.boundAttributes['ReverseLensDistortion']);
    assert.ok(result.boundAttributes['ViewCenterX']);
    assert.ok(result.boundAttributes['ViewCenterY']);
});
