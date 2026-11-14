import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

import * as mathModel from '../effects/wave-warp/math-model.mjs';
import { createMockCavalry } from './lib/mock-cavalry.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EFFECT_DIR = path.join(ROOT, 'effects', 'wave-warp');

test('Wave Warp — Tier 1: Static validation & embedded code sync', () => {
    const skslPath = path.join(EFFECT_DIR, 'wave-warp.sksl');
    const pmapPath = path.join(EFFECT_DIR, 'parameter-map.json');
    const implPath = path.join(EFFECT_DIR, 'implementation.js');

    assert.ok(fs.existsSync(skslPath));
    assert.ok(fs.existsSync(pmapPath));
    assert.ok(fs.existsSync(implPath));

    const sksl = fs.readFileSync(skslPath, 'utf8');
    assert.ok(sksl.includes('uniform shader layer;'));
    assert.ok(sksl.includes('uniform float WaveType;'));
    assert.ok(sksl.includes('uniform float WaveHeight;'));
    assert.ok(sksl.includes('uniform float WaveWidth;'));
    assert.ok(sksl.includes('uniform float Direction;'));
    assert.ok(sksl.includes('uniform float WaveSpeed;'));
    assert.ok(sksl.includes('uniform float Phase;'));
    assert.ok(sksl.includes('uniform float Pinning;'));
    assert.ok(sksl.includes('half4 main(float2 fragCoord)'));

    const pmap = JSON.parse(fs.readFileSync(pmapPath, 'utf8'));
    assert.equal(pmap.effectSlug, 'wave-warp');
    assert.equal(pmap.parameters.length, 7);
});

test('Wave Warp — Tier 2: Mathematical invariants (Waveforms, Pinning, Displacement)', () => {
    // 1. Sine wave peak and trough
    const sinePeak = mathModel.evaluateWaveform(Math.PI * 0.5, 0);
    assert.ok(Math.abs(sinePeak - 1.0) < 1e-4);
    const sineTrough = mathModel.evaluateWaveform(Math.PI * 1.5, 0);
    assert.ok(Math.abs(sineTrough - (-1.0)) < 1e-4);

    // 2. Square wave
    const sq1 = mathModel.evaluateWaveform(Math.PI * 0.25, 1);
    const sq2 = mathModel.evaluateWaveform(Math.PI * 1.25, 1);
    assert.equal(sq1, 1.0);
    assert.equal(sq2, -1.0);

    // 3. Pinning: Top Edge pinned
    const halfRes = { x: 100, y: 100 };
    // Top coordinate (y = 100) -> pin factor should be 0 (no movement)
    const pinTopAtTop = mathModel.computePinFactor({ x: 0, y: 100 }, halfRes, 2);
    assert.ok(Math.abs(pinTopAtTop) < 1e-4);
    // Bottom coordinate (y = -100) -> pin factor should be 1 (full movement)
    const pinTopAtBottom = mathModel.computePinFactor({ x: 0, y: -100 }, halfRes, 2);
    assert.ok(Math.abs(pinTopAtBottom - 1.0) < 1e-4);

    // 4. Displacement calculation
    const disp = mathModel.calculateDisplacement({ x: 0, y: 0 }, { x: 200, y: 200 }, {
        waveType: 0,
        waveHeight: 20.0,
        waveWidth: 40.0,
        direction: 0.0, // propagates along +X, displaces along +Y
        phase: 90.0, // peak at x=0
        pinning: 0
    });
    // uProp = (1, 0), vTrans = (0, 1)
    assert.ok(Math.abs(disp.dx) < 1e-4);
    assert.ok(Math.abs(disp.dy - 20.0) < 1e-4);
});

test('Wave Warp — Tier 3: Headless Mock Stallion execution & dynamic slots', () => {
    const implSource = fs.readFileSync(path.join(EFFECT_DIR, 'implementation.js'), 'utf8');

    const { api: mockApi, createdNodes, nodeAttributes, customNames, connections } = createMockCavalry({ initialAttrs: ['code', 'padding'] });

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
        waveType: 0,
        waveHeight: 15.0,
        waveWidth: 60.0,
        direction: 45.0,
        phase: 180.0,
        pinning: 1
    });

    assert.equal(result.status, 'success');
    assert.equal(result.effect, 'wave-warp');
    assert.ok(result.nodeId);
    assert.equal(result.targetLayerId, 'target_layer_123');
    assert.equal(result.connected, true);
    assert.equal(result.codeConfigured, true);

    assert.ok(result.boundAttributes['WaveType']);
    assert.ok(result.boundAttributes['WaveHeight']);
    assert.ok(result.boundAttributes['WaveWidth']);
    assert.ok(result.boundAttributes['Direction']);
    assert.ok(result.boundAttributes['WaveSpeed']);
    assert.ok(result.boundAttributes['Phase']);
    assert.ok(result.boundAttributes['Pinning']);
    assert.ok(result.padding.x >= 35);
});
