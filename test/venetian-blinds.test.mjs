import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

import * as mathModel from '../effects/venetian-blinds/math-model.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EFFECT_DIR = path.join(ROOT, 'effects', 'venetian-blinds');

test('Venetian Blinds — Tier 1: Static validation & embedded code sync', () => {
    const skslPath = path.join(EFFECT_DIR, 'venetian-blinds.sksl');
    const pmapPath = path.join(EFFECT_DIR, 'parameter-map.json');
    const implPath = path.join(EFFECT_DIR, 'implementation.js');

    assert.ok(fs.existsSync(skslPath));
    assert.ok(fs.existsSync(pmapPath));
    assert.ok(fs.existsSync(implPath));

    const sksl = fs.readFileSync(skslPath, 'utf8');
    assert.ok(sksl.includes('uniform shader layer;'));
    assert.ok(sksl.includes('uniform float TransitionCompletion;'));
    assert.ok(sksl.includes('uniform float Direction;'));
    assert.ok(sksl.includes('uniform float Width;'));
    assert.ok(sksl.includes('uniform float Feather;'));
    assert.ok(sksl.includes('half4 main(float2 fragCoord)'));

    const pmap = JSON.parse(fs.readFileSync(pmapPath, 'utf8'));
    assert.equal(pmap.effectSlug, 'venetian-blinds');
    assert.equal(pmap.parameters.length, 4);
});

test('Venetian Blinds — Tier 2: Mathematical invariants (Transition & Feather)', () => {
    // 1. Completion 0% -> 1.0 mask everywhere
    const m0 = mathModel.calculateMask({ x: 15, y: 35 }, { transitionCompletion: 0.0 });
    assert.equal(m0, 1.0);

    // 2. Completion 100% -> 0.0 mask everywhere
    const m100 = mathModel.calculateMask({ x: 15, y: 35 }, { transitionCompletion: 100.0 });
    assert.equal(m100, 0.0);

    // 3. Completion 50%, strip width 20, direction 0 (horizontal coordinate s = x)
    // At x = 5 (t = 0.25) -> should be hidden (0.0)
    const mAt5 = mathModel.calculateMask({ x: 5, y: 0 }, {
        transitionCompletion: 50.0, width: 20.0, direction: 0.0, feather: 0.0
    });
    assert.equal(mAt5, 0.0);

    // At x = 15 (t = 0.75) -> should be visible (1.0)
    const mAt15 = mathModel.calculateMask({ x: 15, y: 0 }, {
        transitionCompletion: 50.0, width: 20.0, direction: 0.0, feather: 0.0
    });
    assert.equal(mAt15, 1.0);

    // 4. Smooth feathering at transition boundary:
    // Boundary is at x = 10 (t = 0.5). With feather = 4 (fNorm = 0.2),
    // mask at t = 0.5 must be exactly 0.5
    const mMidFeather = mathModel.calculateMask({ x: 10, y: 0 }, {
        transitionCompletion: 50.0, width: 20.0, direction: 0.0, feather: 4.0
    });
    assert.ok(Math.abs(mMidFeather - 0.5) < 1e-4);
});

test('Venetian Blinds — Tier 3: Headless Mock Stallion execution & dynamic slots', () => {
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
        transitionCompletion: 35.0,
        direction: 45.0,
        width: 30.0,
        feather: 5.0
    });

    assert.equal(result.status, 'success');
    assert.equal(result.effect, 'venetian-blinds');
    assert.ok(result.nodeId);
    assert.equal(result.targetLayerId, 'target_layer_123');
    assert.equal(result.connected, true);
    assert.equal(result.codeConfigured, true);

    assert.ok(result.boundAttributes['TransitionCompletion']);
    assert.ok(result.boundAttributes['Direction']);
    assert.ok(result.boundAttributes['Width']);
    assert.ok(result.boundAttributes['Feather']);
});
