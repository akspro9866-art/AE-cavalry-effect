import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

import * as mathModel from '../effects/cc-kaleida/math-model.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EFFECT_DIR = path.join(ROOT, 'effects', 'cc-kaleida');

test('CC Kaleida — Tier 1: Static validation & embedded code sync', () => {
    const skslPath = path.join(EFFECT_DIR, 'cc-kaleida.sksl');
    const pmapPath = path.join(EFFECT_DIR, 'parameter-map.json');
    const implPath = path.join(EFFECT_DIR, 'implementation.js');

    assert.ok(fs.existsSync(skslPath));
    assert.ok(fs.existsSync(pmapPath));
    assert.ok(fs.existsSync(implPath));

    const sksl = fs.readFileSync(skslPath, 'utf8');
    assert.ok(sksl.includes('uniform shader layer;'));
    assert.ok(sksl.includes('uniform float CenterX;'));
    assert.ok(sksl.includes('uniform float CenterY;'));
    assert.ok(sksl.includes('uniform float Size;'));
    assert.ok(sksl.includes('uniform float Rotation;'));
    assert.ok(sksl.includes('uniform float SegmentCount;'));
    assert.ok(sksl.includes('uniform float Mirroring;'));
    assert.ok(sksl.includes('half4 main(float2 fragCoord)'));

    const pmap = JSON.parse(fs.readFileSync(pmapPath, 'utf8'));
    assert.equal(pmap.effectSlug, 'cc-kaleida');
    assert.equal(pmap.parameters.length, 6);
});

test('CC Kaleida — Tier 2: Mathematical invariants (Polar Mapping & Seamless Borders)', () => {
    // 1. Center origin maps directly to center
    const c0 = mathModel.mapPolarCoordinates({ x: 0, y: 0 }, { centerX: 0, centerY: 0 });
    assert.ok(Math.abs(c0.x) < 1e-4);
    assert.ok(Math.abs(c0.y) < 1e-4);

    // 2. Test boundary continuity:
    // With N = 4 segments (alpha = 90 deg = PI/2),
    // angle 0 deg (t=0) and angle 90 deg (t=1) should both map to theta' = alpha/2 = 45 deg!
    const rDist = 100.0;
    // Angle 0 deg: point (100, 0)
    const pBoundary0 = mathModel.mapPolarCoordinates({ x: 100, y: 0 }, {
        centerX: 0, centerY: 0, size: 100, rotation: 0, segmentCount: 4, mirroring: 1
    });
    // Angle 90 deg: point (0, -100) in Cavalry coordinates (neg Y)
    const pBoundary90 = mathModel.mapPolarCoordinates({ x: 0, y: -100 }, {
        centerX: 0, centerY: 0, size: 100, rotation: 0, segmentCount: 4, mirroring: 1
    });

    // Both should yield radius 100 at angle 45 deg: x = 100 * cos(45) ~ 70.71, y = -100 * sin(45) ~ -70.71
    assert.ok(Math.abs(pBoundary0.x - 70.7106) < 1e-2);
    assert.ok(Math.abs(pBoundary0.y - (-70.7106)) < 1e-2);
    assert.ok(Math.abs(pBoundary90.x - 70.7106) < 1e-2);
    assert.ok(Math.abs(pBoundary90.y - (-70.7106)) < 1e-2);

    // Continuous match across sector boundary:
    assert.ok(Math.abs(pBoundary0.x - pBoundary90.x) < 1e-4);
    assert.ok(Math.abs(pBoundary0.y - pBoundary90.y) < 1e-4);
});

test('CC Kaleida — Tier 3: Headless Mock Stallion execution & dynamic slots', () => {
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
        centerX: 10.0,
        centerY: 20.0,
        size: 80.0,
        rotation: 45.0,
        segmentCount: 8.0,
        mirroring: 1
    });

    assert.equal(result.status, 'success');
    assert.equal(result.effect, 'cc-kaleida');
    assert.ok(result.nodeId);
    assert.equal(result.targetLayerId, 'target_layer_123');
    assert.equal(result.connected, true);
    assert.equal(result.codeConfigured, true);

    assert.ok(result.boundAttributes['CenterX']);
    assert.ok(result.boundAttributes['CenterY']);
    assert.ok(result.boundAttributes['Size']);
    assert.ok(result.boundAttributes['Rotation']);
    assert.ok(result.boundAttributes['SegmentCount']);
    assert.ok(result.boundAttributes['Mirroring']);
});
