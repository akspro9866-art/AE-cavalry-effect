import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

import * as mathModel from '../effects/echo/math-model.mjs';
import { createMockCavalry } from './lib/mock-cavalry.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EFFECT_DIR = path.join(ROOT, 'effects', 'echo');

test('Echo — Tier 1: Static validation & embedded code sync', () => {
    const skslPath = path.join(EFFECT_DIR, 'echo.sksl');
    const pmapPath = path.join(EFFECT_DIR, 'parameter-map.json');
    const implPath = path.join(EFFECT_DIR, 'implementation.js');

    assert.ok(fs.existsSync(skslPath));
    assert.ok(fs.existsSync(pmapPath));
    assert.ok(fs.existsSync(implPath));

    const sksl = fs.readFileSync(skslPath, 'utf8');
    assert.ok(sksl.includes('uniform shader layer;'));
    assert.ok(sksl.includes('uniform float EchoTime;'));
    assert.ok(sksl.includes('uniform float NumberOfEchoes;'));
    assert.ok(sksl.includes('uniform float StartingIntensity;'));
    assert.ok(sksl.includes('uniform float Decay;'));
    assert.ok(sksl.includes('uniform float EchoOperator;'));
    assert.ok(sksl.includes('half4 main(float2 fragCoord)'));

    const pmap = JSON.parse(fs.readFileSync(pmapPath, 'utf8'));
    assert.equal(pmap.effectSlug, 'echo');
    assert.equal(pmap.parameters.length, 5);
});

test('Echo — Tier 2: Mathematical invariants (Operators & Decay Weighting)', () => {
    const s0 = { r: 0.8, g: 0.4, b: 0.2, a: 1.0 };
    const s1 = { r: 0.4, g: 0.8, b: 0.1, a: 1.0 };

    // 1. Add operator
    const addRes = mathModel.blendEcho(s0, s1, 0);
    assert.ok(Math.abs(addRes.r - 1.2) < 1e-4);
    assert.ok(Math.abs(addRes.g - 1.2) < 1e-4);

    // 2. Maximum operator
    const maxRes = mathModel.blendEcho(s0, s1, 1);
    assert.equal(maxRes.r, 0.8);
    assert.equal(maxRes.g, 0.8);

    // 3. Minimum operator
    const minRes = mathModel.blendEcho(s0, s1, 2);
    assert.equal(minRes.r, 0.4);
    assert.equal(minRes.g, 0.4);

    // 4. Series evaluation with decay = 0.5
    // Samples: [1.0, 1.0, 1.0]. Weights: 1.0, 0.5, 0.25 -> Add sum = 1.75
    const seriesSamples = [
        { r: 1.0, g: 1.0, b: 1.0, a: 1.0 },
        { r: 1.0, g: 1.0, b: 1.0, a: 1.0 },
        { r: 1.0, g: 1.0, b: 1.0, a: 1.0 }
    ];
    const seriesRes = mathModel.evaluateEchoSeries(seriesSamples, {
        numberOfEchoes: 3,
        startingIntensity: 1.0,
        decay: 0.5,
        echoOperator: 0 // Add
    });
    assert.ok(Math.abs(seriesRes.r - 1.75) < 1e-4);
});

test('Echo — Tier 3: Headless Mock Stallion execution & dynamic slots', () => {
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
        echoTime: -0.05,
        numberOfEchoes: 4.0,
        startingIntensity: 1.0,
        decay: 0.6,
        echoOperator: 3 // Screen
    });

    assert.equal(result.status, 'success');
    assert.equal(result.effect, 'echo');
    assert.ok(result.nodeId);
    assert.equal(result.targetLayerId, 'target_layer_123');
    assert.equal(result.connected, true);
    assert.equal(result.codeConfigured, true);

    assert.ok(result.boundAttributes['EchoTime']);
    assert.ok(result.boundAttributes['NumberOfEchoes']);
    assert.ok(result.boundAttributes['StartingIntensity']);
    assert.ok(result.boundAttributes['Decay']);
    assert.ok(result.boundAttributes['EchoOperator']);
});
