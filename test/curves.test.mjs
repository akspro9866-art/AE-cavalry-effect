import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

import * as mathModel from '../effects/curves/math-model.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EFFECT_DIR = path.join(ROOT, 'effects', 'curves');

test('Curves — Tier 1: Static validation & embedded code sync', () => {
    const skslPath = path.join(EFFECT_DIR, 'curves.sksl');
    const pmapPath = path.join(EFFECT_DIR, 'parameter-map.json');
    const implPath = path.join(EFFECT_DIR, 'implementation.js');

    assert.ok(fs.existsSync(skslPath));
    assert.ok(fs.existsSync(pmapPath));
    assert.ok(fs.existsSync(implPath));

    const sksl = fs.readFileSync(skslPath, 'utf8');
    assert.ok(sksl.includes('uniform shader layer;'));
    assert.ok(sksl.includes('uniform float MasterBlack;'));
    assert.ok(sksl.includes('uniform float MasterShadows;'));
    assert.ok(sksl.includes('uniform float MasterMidtones;'));
    assert.ok(sksl.includes('uniform float MasterHighlights;'));
    assert.ok(sksl.includes('uniform float MasterWhite;'));
    assert.ok(sksl.includes('uniform float RedLift;'));
    assert.ok(sksl.includes('uniform float RedMid;'));
    assert.ok(sksl.includes('uniform float RedGain;'));
    assert.ok(sksl.includes('half4 main(float2 fragCoord)'));

    const pmap = JSON.parse(fs.readFileSync(pmapPath, 'utf8'));
    assert.equal(pmap.effectSlug, 'curves');
    assert.equal(pmap.parameters.length, 14);
});

test('Curves — Tier 2: Mathematical invariants (Identity Spline & Tone Modification)', () => {
    // 1. Identity curve verification across all test points
    for (let x = 0.0; x <= 1.0; x += 0.1) {
        const y = mathModel.evalCatmullRom(x, 0.0, 0.25, 0.50, 0.75, 1.0);
        assert.ok(Math.abs(y - x) < 1e-4, `Identity failed at x=${x}: got ${y}`);
    }

    // 2. Control points exact pass-through
    assert.ok(Math.abs(mathModel.evalCatmullRom(0.0, 0.1, 0.3, 0.6, 0.8, 0.95) - 0.1) < 1e-4);
    assert.ok(Math.abs(mathModel.evalCatmullRom(0.25, 0.1, 0.3, 0.6, 0.8, 0.95) - 0.3) < 1e-4);
    assert.ok(Math.abs(mathModel.evalCatmullRom(0.50, 0.1, 0.3, 0.6, 0.8, 0.95) - 0.6) < 1e-4);
    assert.ok(Math.abs(mathModel.evalCatmullRom(0.75, 0.1, 0.3, 0.6, 0.8, 0.95) - 0.8) < 1e-4);
    assert.ok(Math.abs(mathModel.evalCatmullRom(1.0, 0.1, 0.3, 0.6, 0.8, 0.95) - 0.95) < 1e-4);

    // 3. Midtone boost produces smooth convex curve
    const midBoost = mathModel.evalCatmullRom(0.5, 0.0, 0.25, 0.70, 0.75, 1.0);
    assert.equal(midBoost, 0.70);

    // 4. Color curve application
    const cOut = mathModel.applyCurves({ r: 0.5, g: 0.5, b: 0.5, a: 1.0 }, {
        masterMidtones: 0.65,
        redMid: 0.1
    });
    assert.ok(cOut.r > cOut.g, 'Red midtone offset increased red channel');
    assert.ok(cOut.g > 0.5, 'Master midtone boosted green channel');
});

test('Curves — Tier 3: Headless Mock Stallion execution & dynamic slots', () => {
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
        masterBlack: 0.05,
        masterMidtones: 0.55,
        redGain: 0.1,
        blueLift: 0.02
    });

    assert.equal(result.status, 'success');
    assert.equal(result.effect, 'curves');
    assert.ok(result.nodeId);
    assert.equal(result.targetLayerId, 'target_layer_123');
    assert.equal(result.connected, true);
    assert.equal(result.codeConfigured, true);

    assert.ok(result.boundAttributes['MasterBlack']);
    assert.ok(result.boundAttributes['MasterMidtones']);
    assert.ok(result.boundAttributes['RedGain']);
    assert.ok(result.boundAttributes['BlueLift']);
});
