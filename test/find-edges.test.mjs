import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

import * as mathModel from '../effects/find-edges/math-model.mjs';
import { createMockCavalry } from './lib/mock-cavalry.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EFFECT_DIR = path.join(ROOT, 'effects', 'find-edges');

test('Find Edges — Tier 1: Static validation & embedded code sync', () => {
    const skslPath = path.join(EFFECT_DIR, 'find-edges.sksl');
    const pmapPath = path.join(EFFECT_DIR, 'parameter-map.json');
    const implPath = path.join(EFFECT_DIR, 'implementation.js');

    assert.ok(fs.existsSync(skslPath));
    assert.ok(fs.existsSync(pmapPath));
    assert.ok(fs.existsSync(implPath));

    const sksl = fs.readFileSync(skslPath, 'utf8');
    assert.ok(sksl.includes('uniform shader layer;'));
    assert.ok(sksl.includes('uniform float Invert;'));
    assert.ok(sksl.includes('uniform float BlendWithOriginal;'));
    assert.ok(sksl.includes('half4 main(float2 fragCoord)'));

    const pmap = JSON.parse(fs.readFileSync(pmapPath, 'utf8'));
    assert.equal(pmap.effectSlug, 'find-edges');
    assert.equal(pmap.parameters.length, 2);
});

test('Find Edges — Tier 2: Mathematical invariants (Sobel Edge Response & Inversion)', () => {
    // 1. Uniform flat patch -> gradient must be 0
    const flatPatch = [
        [0.5, 0.5, 0.5],
        [0.5, 0.5, 0.5],
        [0.5, 0.5, 0.5]
    ];
    const gradFlat = mathModel.computeSobelGradient(flatPatch);
    assert.equal(gradFlat, 0.0);

    // On flat patch, invert=0 gives pure white (1.0)
    assert.equal(mathModel.calculateEdgeColor(gradFlat, 0), 1.0);
    // invert=1 gives pure black (0.0)
    assert.equal(mathModel.calculateEdgeColor(gradFlat, 1), 0.0);

    // 2. High-contrast sharp edge (black left, white right)
    const stepPatch = [
        [0.0, 0.0, 1.0],
        [0.0, 0.0, 1.0],
        [0.0, 0.0, 1.0]
    ];
    const gradStep = mathModel.computeSobelGradient(stepPatch);
    assert.ok(gradStep > 0.8, `Expected strong gradient, got ${gradStep}`);

    // On step edge, invert=0 gives dark edge
    assert.ok(mathModel.calculateEdgeColor(gradStep, 0) < 0.2);
    // invert=1 gives bright edge
    assert.ok(mathModel.calculateEdgeColor(gradStep, 1) > 0.8);
});

test('Find Edges — Tier 3: Headless Mock Stallion execution & dynamic slots', () => {
    const implSource = fs.readFileSync(path.join(EFFECT_DIR, 'implementation.js'), 'utf8');

    const { api: mockApi, createdNodes, nodeAttributes, customNames, connections } = createMockCavalry({ initialAttrs: ['code'] });

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
        invert: 1,
        blendWithOriginal: 20.0
    });

    assert.equal(result.status, 'success');
    assert.equal(result.effect, 'find-edges');
    assert.ok(result.nodeId);
    assert.equal(result.targetLayerId, 'target_layer_123');
    assert.equal(result.connected, true);
    assert.equal(result.codeConfigured, true);

    assert.ok(result.boundAttributes['Invert']);
    assert.ok(result.boundAttributes['BlendWithOriginal']);
});
