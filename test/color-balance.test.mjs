import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

import * as mathModel from '../effects/color-balance/math-model.mjs';
import { createMockCavalry } from './lib/mock-cavalry.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EFFECT_DIR = path.join(ROOT, 'effects', 'color-balance');

test('Color Balance — Tier 1: Static validation & embedded code sync', () => {
    const skslPath = path.join(EFFECT_DIR, 'color-balance.sksl');
    const pmapPath = path.join(EFFECT_DIR, 'parameter-map.json');
    const implPath = path.join(EFFECT_DIR, 'implementation.js');

    assert.ok(fs.existsSync(skslPath));
    assert.ok(fs.existsSync(pmapPath));
    assert.ok(fs.existsSync(implPath));

    const sksl = fs.readFileSync(skslPath, 'utf8');
    assert.ok(sksl.includes('uniform shader layer;'));
    assert.ok(sksl.includes('uniform float ShadowRed;'));
    assert.ok(sksl.includes('uniform float MidtoneGreen;'));
    assert.ok(sksl.includes('uniform float HighlightBlue;'));
    assert.ok(sksl.includes('uniform float PreserveLuminosity;'));
    assert.ok(sksl.includes('half4 main(float2 fragCoord)'));

    const pmap = JSON.parse(fs.readFileSync(pmapPath, 'utf8'));
    assert.equal(pmap.effectSlug, 'color-balance');
    assert.equal(pmap.parameters.length, 10);
});

test('Color Balance — Tier 2: Mathematical invariants (Partition of Unity & Tonal Zones)', () => {
    // 1. Partition of unity (weights sum to 1.0 everywhere)
    for (let y = 0.0; y <= 1.0; y += 0.1) {
        const w = mathModel.calculateTonalWeights(y);
        const sum = w.shadow + w.midtone + w.highlight;
        assert.ok(Math.abs(sum - 1.0) < 1e-4, `Weights sum failed at y=${y}: ${sum}`);
    }

    // 2. Zone dominance
    const darkW = mathModel.calculateTonalWeights(0.05);
    assert.ok(darkW.shadow > darkW.midtone && darkW.shadow > darkW.highlight);

    const midW = mathModel.calculateTonalWeights(0.5);
    assert.ok(midW.midtone > darkW.shadow && midW.midtone > midW.highlight);

    const brightW = mathModel.calculateTonalWeights(0.95);
    assert.ok(brightW.highlight > brightW.midtone && brightW.highlight > brightW.shadow);

    // 3. Luminosity preservation
    const cIn = { r: 0.5, g: 0.5, b: 0.5, a: 1.0 };
    const yInitial = mathModel.calcLuminance(cIn);
    const cBalanced = mathModel.applyColorBalance(cIn, {
        midtoneRed: 30.0,
        midtoneBlue: -20.0,
        preserveLuminosity: 1.0
    });
    const yFinal = mathModel.calcLuminance(cBalanced);
    assert.ok(Math.abs(yInitial - yFinal) < 1e-2, `Preserve luminosity failed: initial ${yInitial}, final ${yFinal}`);
});

test('Color Balance — Tier 3: Headless Mock Stallion execution & dynamic slots', () => {
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
        shadowBlue: 15.0,
        midtoneRed: 10.0,
        highlightRed: 20.0,
        preserveLuminosity: 1
    });

    assert.equal(result.status, 'success');
    assert.equal(result.effect, 'color-balance');
    assert.ok(result.nodeId);
    assert.equal(result.targetLayerId, 'target_layer_123');
    assert.equal(result.connected, true);
    assert.equal(result.codeConfigured, true);

    assert.ok(result.boundAttributes['ShadowBlue']);
    assert.ok(result.boundAttributes['MidtoneRed']);
    assert.ok(result.boundAttributes['HighlightRed']);
    assert.ok(result.boundAttributes['PreserveLuminosity']);
});
