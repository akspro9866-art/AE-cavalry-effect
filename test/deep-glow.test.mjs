import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

import * as mathModel from '../effects/deep-glow/math-model.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EFFECT_DIR = path.join(ROOT, 'effects', 'deep-glow');

test('Tier 1 — Static validation: Deep Glow shader, parameter map, implementation & sync', () => {
    const skslPath = path.join(EFFECT_DIR, 'deep-glow.sksl');
    const paramMapPath = path.join(EFFECT_DIR, 'parameter-map.json');
    const implPath = path.join(EFFECT_DIR, 'implementation.js');

    assert.ok(fs.existsSync(skslPath), 'deep-glow.sksl must exist');
    assert.ok(fs.existsSync(paramMapPath), 'parameter-map.json must exist');
    assert.ok(fs.existsSync(implPath), 'implementation.js must exist');

    const sksl = fs.readFileSync(skslPath, 'utf8');
    assert.ok(sksl.includes('uniform shader layer;'), 'SkSL must declare uniform shader layer');
    assert.ok(sksl.includes('half4 main(float2 fragCoord)'), 'SkSL must define main function');
    assert.ok(sksl.includes('prefilterColor'), 'SkSL must implement threshold prefilter');
    assert.ok(sksl.includes('applyTint'), 'SkSL must implement Two-Tone tinting');
    assert.ok(sksl.includes('applyToneMap'), 'SkSL must implement tone mapping');

    const paramMap = JSON.parse(fs.readFileSync(paramMapPath, 'utf8'));
    assert.equal(paramMap.effectSlug, 'deep-glow');
    assert.equal(paramMap.parameters.length, 17, 'Must specify all 17 parameters');

    const impl = fs.readFileSync(implPath, 'utf8');
    assert.ok(impl.includes('/* @@BEGIN_SKSL@@ */'), 'implementation.js must have SKSL marker');
    assert.ok(impl.includes('applyDeepGlowToLayer'), 'implementation.js must implement applicator');
    assert.ok(!impl.includes('var SKSL_SOURCE = "";'), 'SKSL_SOURCE must be embedded and non-empty');
});

test('Tier 2 — Mathematical invariants: Zero exposure, inverse-square falloff & anamorphic stretch', () => {
    // 1. Zero exposure produces zero glow
    const baseRgb = [0.8, 0.4, 0.2];
    const zeroGlow = [0.0, 0.0, 0.0];
    const compAdd = mathModel.compositeGlow(baseRgb, 1.0, zeroGlow, 0, 1.0);
    assert.deepEqual(compAdd.rgb, baseRgb, 'Add blend with zero glow must equal base RGB');

    // 2. Inverse square falloff decays monotonically
    const radius = 100.0;
    const w0 = mathModel.computeGlowWeight(0.0, radius, 0);
    const w10 = mathModel.computeGlowWeight(10.0, radius, 0);
    const w50 = mathModel.computeGlowWeight(50.0, radius, 0);
    const w200 = mathModel.computeGlowWeight(200.0, radius, 0);

    assert.equal(w0, 1.0, 'Center weight must be 1.0');
    assert.ok(w10 < w0, 'Weight at 10px must be less than center');
    assert.ok(w50 < w10, 'Weight at 50px must be less than 10px');
    assert.ok(w200 < w50, 'Weight at 200px must be less than 50px');

    // 3. Anamorphic offset geometry
    const r = 50.0;
    const phi = 0.0; // along X axis
    // Unstretched
    const iso = mathModel.computeAnamorphicOffset(r, phi, 1.0, 0.0);
    assert.ok(Math.abs(iso.x - 50.0) < 1e-4);
    assert.ok(Math.abs(iso.y - 0.0) < 1e-4);

    // Stretched 3.0x along X
    const stretched = mathModel.computeAnamorphicOffset(r, phi, 3.0, 0.0);
    assert.ok(Math.abs(stretched.x - 150.0) < 1e-4, 'X must stretch 3x');
    assert.ok(Math.abs(stretched.y - 0.0) < 1e-4);

    // Rotated 90 degrees
    const rotated = mathModel.computeAnamorphicOffset(r, phi, 3.0, 90.0);
    assert.ok(Math.abs(rotated.x) < 1e-3, 'X must rotate to Y');
    assert.ok(Math.abs(rotated.y - 150.0) < 1e-3, 'Y must receive the 3x stretch');
});

test('Tier 2 — Mathematical invariants: Threshold knee, Saturation bias, Tint & Tone mapping', () => {
    // 1. Saturation metric
    assert.equal(mathModel.rgb2s([1, 1, 1]), 0.0, 'Pure white must have saturation 0.0');
    assert.equal(mathModel.rgb2s([1, 0, 0]), 1.0, 'Pure red must have saturation 1.0');
    assert.equal(mathModel.rgb2s([0.5, 0.5, 0.5]), 0.0, 'Gray must have saturation 0.0');

    // 2. Thresholding with knee
    const darkColor = [0.1, 0.1, 0.1];
    const brightColor = [0.9, 0.9, 0.9];
    const filteredDark = mathModel.prefilterColor(darkColor, 0.5, 0.1, 0.0);
    const filteredBright = mathModel.prefilterColor(brightColor, 0.5, 0.1, 0.0);
    assert.ok(filteredDark[0] < 1e-4, 'Dark color below threshold must be zeroed');
    assert.ok(filteredBright[0] > 0.85, 'Bright color above threshold must pass');

    // 3. Two-Tone Tinting
    const whiteGlow = [1.0, 1.0, 1.0];
    const goldTint = [1.0, 0.8, 0.4];
    const tinted = mathModel.applyTint(whiteGlow, 1, 0, goldTint, [0, 0, 1], 1.0); // Monocolor Multiply
    assert.ok(Math.abs(tinted[0] - 1.0) < 1e-4);
    assert.ok(Math.abs(tinted[1] - 0.8) < 1e-4);
    assert.ok(Math.abs(tinted[2] - 0.4) < 1e-4);

    // 4. Tone Mapping compression (monotonically compresses HDR dynamic range)
    const overbright = [5.0, 10.0, 20.0];
    for (let mode = 1; mode <= 4; mode++) {
        const mapped = mathModel.applyToneMap(overbright, mode);
        for (let c = 0; c < 3; c++) {
            assert.ok(!isNaN(mapped[c]), `ToneMap mode ${mode} channel ${c} must not be NaN`);
            assert.ok(isFinite(mapped[c]), `ToneMap mode ${mode} channel ${c} must be finite`);
            assert.ok(mapped[c] >= 0.0, `ToneMap mode ${mode} channel ${c} must be >= 0.0`);
            assert.ok(mapped[c] < overbright[c], `ToneMap mode ${mode} must compress input value ${overbright[c]}`);
            if (mode <= 3) {
                assert.ok(mapped[c] <= 1.05, `ToneMap mode ${mode} must stay within SDR gamut <= 1.05`);
            }
        }
    }
});

test('Tier 3 — Headless Mock Stallion execution: Selection, dynamic slots, idempotency & animation', () => {
    const implSource = fs.readFileSync(path.join(EFFECT_DIR, 'implementation.js'), 'utf8');

    // Build mock Cavalry environment
    class MockCavalryScene {
        constructor() {
            this.nodes = new Map();
            this.connections = [];
            this.keyframes = [];
            this.selection = [];
            this.counter = 0;

            const comp = { id: 'compNode#1', name: 'Composition 1' };
            this.nodes.set(comp.id, comp);
            this.activeComp = comp;
        }

        create(type, nameOrParent) {
            const id = `${type}#${++this.counter}`;
            const name = typeof nameOrParent === 'string' ? nameOrParent : '';
            const node = { id, type, name, niceName: name, attrs: {}, customNames: {} };
            if (type === 'skslFilter') {
                node.attrs['inputs'] = {};
                node.attrs['inputs.0'] = 0;
            }
            this.nodes.set(id, node);
            return id;
        }

        primitive(type, name) {
            const id = `${type}#${++this.counter}`;
            const node = { id, type, name, niceName: name, attrs: {} };
            this.nodes.set(id, node);
            return id;
        }

        getLayerType(nodeId) {
            const node = this.nodes.get(nodeId);
            return node ? node.type : '';
        }

        getNiceName(nodeId) {
            const node = this.nodes.get(nodeId);
            return (node && (node.niceName || node.name)) || nodeId;
        }

        getActiveComp() {
            return this.activeComp.id;
        }

        getSelection() {
            return [...this.selection];
        }

        select(ids) {
            this.selection = [...ids];
        }

        getAttributes(nodeId) {
            const node = this.nodes.get(nodeId);
            return node ? Object.keys(node.attrs) : [];
        }

        getCustomAttributeName(nodeId, attr) {
            const node = this.nodes.get(nodeId);
            return (node && node.customNames[attr]) || '';
        }

        renameAttribute(nodeId, attr, newName) {
            const node = this.nodes.get(nodeId);
            if (node) node.customNames[attr] = newName;
        }

        addDynamic(nodeId, group, type) {
            const node = this.nodes.get(nodeId);
            if (!node) return null;
            let idx = 0;
            while (node.attrs.hasOwnProperty(`${group}.${idx}`)) {
                idx++;
            }
            const slot = `${group}.${idx}`;
            node.attrs[slot] = type === 'color' ? { r: 255, g: 255, b: 255, a: 255 } : 0;
            return slot;
        }

        set(nodeId, props) {
            const node = this.nodes.get(nodeId);
            if (!node) return;
            for (const [k, v] of Object.entries(props)) {
                node.attrs[k] = v;
            }
        }

        get(nodeId, attr) {
            const node = this.nodes.get(nodeId);
            return node ? node.attrs[attr] : undefined;
        }

        connect(srcId, srcAttr, dstId, dstAttr) {
            this.connections.push({ srcId, srcAttr, dstId, dstAttr });
        }

        getConnected(nodeId, attr) {
            return this.connections
                .filter(c => c.dstId === nodeId && c.dstAttr === attr)
                .map(c => c.srcId);
        }

        getType(nodeId) {
            const node = this.nodes.get(nodeId);
            return node ? node.type : '';
        }

        getName(nodeId) {
            const node = this.nodes.get(nodeId);
            return (node && node.name) || '';
        }

        setName(nodeId, name) {
            const node = this.nodes.get(nodeId);
            if (node) node.name = name;
        }

        addKeyframe(nodeId, attr, frame, val) {
            this.keyframes.push({ nodeId, attr, frame, val });
        }
    }

    const scene = new MockCavalryScene();
    const mockRect = scene.primitive('rectangle', 'Target Rect');
    scene.select([mockRect]);

    // Test 1: First application creates skslFilter with 17 dynamic slots
    const sandbox1 = {
        api: scene,
        console: console,
        __EFFECT_CONFIG__: {
            params: {
                radius: 150.0,
                exposure: 1.5,
                aspectRatio: 2.0,
                tintMode: 2,
                tintColor: { r: 255, g: 180, b: 60, a: 255 },
                tintColorOuter: { r: 30, g: 120, b: 240, a: 255 }
            },
            animateExposure: { startFrame: 0, endFrame: 50, startValue: 0.0, endValue: 2.0 }
        }
    };

    vm.createContext(sandbox1);
    const res1 = vm.runInContext(implSource, sandbox1);

    assert.ok(res1.ok, 'Application must report ok');
    assert.equal(res1.appliedCount, 1);
    assert.equal(res1.strategy, 'skslFilter');
    const filterId = res1.results[0].filterId;
    assert.ok(filterId.startsWith('skslFilter#'), 'Created node must be skslFilter');
    assert.equal(res1.results[0].isNew, true, 'First apply must be new');

    // Verify dynamic slots were provisioned
    const filterNode = scene.nodes.get(filterId);
    assert.equal(filterNode.customNames['inputs.0'], 'Radius');
    assert.equal(filterNode.customNames['inputs.1'], 'Exposure');
    assert.equal(filterNode.attrs['inputs.0'], 150.0);
    assert.equal(filterNode.attrs['inputs.1'], 1.5);
    assert.equal(filterNode.attrs['inputs.5'], 2.0); // AspectRatio
    assert.equal(filterNode.attrs['inputs.11'].r, 255);
    assert.equal(filterNode.attrs['inputs.11'].g, 180);
    assert.equal(filterNode.attrs['inputs.11'].b, 60);
    assert.equal(filterNode.attrs['inputs.12'].r, 30);
    assert.equal(filterNode.attrs['inputs.12'].g, 120);
    assert.equal(filterNode.attrs['inputs.12'].b, 240);

    // Verify keyframes
    assert.equal(scene.keyframes.length, 2, 'Should create 2 keyframes for Exposure');
    assert.equal(scene.keyframes[0].frame, 0);
    assert.equal(scene.keyframes[1].frame, 50);

    // Test 2: Idempotency - applying second time updates existing filter without creating new one
    const sandbox2 = {
        api: scene,
        console: console,
        __EFFECT_CONFIG__: {
            params: { radius: 220.0, exposure: 3.0 }
        }
    };
    vm.createContext(sandbox2);
    const res2 = vm.runInContext(implSource, sandbox2);

    assert.ok(res2.ok);
    assert.equal(res2.results[0].isNew, false, 'Second apply must reuse existing filter');
    assert.equal(res2.results[0].filterId, filterId, 'Must update the exact same filter node');
    assert.equal(filterNode.attrs['inputs.0'], 220.0, 'Radius attribute must update to 220.0');
    assert.equal(filterNode.attrs['inputs.1'], 3.0, 'Exposure attribute must update to 3.0');
});
