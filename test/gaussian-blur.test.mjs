import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

import * as mathModel from '../effects/gaussian-blur/math-model.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EFFECT_DIR = path.join(ROOT, 'effects', 'gaussian-blur');

test('Gaussian Blur — Tier 1: Static validation & embedded code sync', () => {
    const skslPath = path.join(EFFECT_DIR, 'gaussian-blur.sksl');
    const pmapPath = path.join(EFFECT_DIR, 'parameter-map.json');
    const implPath = path.join(EFFECT_DIR, 'implementation.js');

    assert.ok(fs.existsSync(skslPath));
    assert.ok(fs.existsSync(pmapPath));
    assert.ok(fs.existsSync(implPath));

    const sksl = fs.readFileSync(skslPath, 'utf8');
    assert.ok(sksl.includes('uniform shader layer;'));
    assert.ok(sksl.includes('half4 main(float2 fragCoord)'));

    const pmap = JSON.parse(fs.readFileSync(pmapPath, 'utf8'));
    assert.equal(pmap.effectSlug, 'gaussian-blur');
    assert.equal(pmap.parameters.length, 3);
});

test('Gaussian Blur — Tier 2: Mathematical invariants (Gaussian decay, normalization & sample counts)', () => {
    // 1. Exact sample counts
    assert.equal(mathModel.SAMPLE_COUNTS.twoDimensional.totalSamples, 37);
    assert.equal(mathModel.SAMPLE_COUNTS.horizontalOnly.totalSamples, 65);
    assert.equal(mathModel.SAMPLE_COUNTS.verticalOnly.totalSamples, 65);

    // 2. Monotonic Gaussian decay
    const b = 50.0;
    const w0 = mathModel.computeGaussianWeight(0.0, b);
    const w10 = mathModel.computeGaussianWeight(10.0, b);
    const w25 = mathModel.computeGaussianWeight(25.0, b);
    const w50 = mathModel.computeGaussianWeight(50.0, b);

    assert.equal(w0, 1.0);
    assert.ok(w10 < w0);
    assert.ok(w25 < w10);
    assert.ok(w50 < w25);

    // 3. Weight sum normalization
    const sum2D = mathModel.computeKernelWeightsSum(50.0, 0);
    const sumH = mathModel.computeKernelWeightsSum(50.0, 1);
    const sumV = mathModel.computeKernelWeightsSum(50.0, 2);
    assert.ok(sum2D > 1.0 && Number.isFinite(sum2D));
    assert.ok(sumH > 1.0 && Number.isFinite(sumH));
    assert.ok(sumV > 1.0 && Number.isFinite(sumV));

    // 4. Padding directional isolation
    const padBoth = mathModel.computePadding(50.0, 0);
    assert.ok(padBoth.x > 0 && padBoth.y > 0);

    const padH = mathModel.computePadding(50.0, 1);
    assert.ok(padH.x > 0 && padH.y === 0, 'Horizontal only must zero Y padding');

    const padV = mathModel.computePadding(50.0, 2);
    assert.ok(padV.x === 0 && padV.y > 0, 'Vertical only must zero X padding');

    // 5. Resolution benchmark simulations
    const bench256 = mathModel.benchmarkGaussianKernel(256, 256, 50.0, 0);
    const bench512 = mathModel.benchmarkGaussianKernel(512, 512, 50.0, 0);
    const bench1080p = mathModel.benchmarkGaussianKernel(1920, 1080, 50.0, 0);
    const bench4k = mathModel.benchmarkGaussianKernel(3840, 2160, 50.0, 0);

    assert.equal(bench256.totalTapsPerPixel, 37);
    assert.equal(bench512.totalTextureEvaluations, 512 * 512 * 37);
    assert.equal(bench1080p.totalTextureEvaluations, 1920 * 1080 * 37);
    assert.equal(bench4k.totalTextureEvaluations, 3840 * 2160 * 37);
});

test('Gaussian Blur — Tier 3: Headless Mock Stallion execution & dynamic slots', () => {
    const implSource = fs.readFileSync(path.join(EFFECT_DIR, 'implementation.js'), 'utf8');

    class MockScene {
        constructor() {
            this.nodes = new Map();
            this.connections = [];
            this.selection = [];
            this.counter = 0;
            const comp = { id: 'compNode#1', name: 'Composition 1' };
            this.nodes.set(comp.id, comp);
            this.activeComp = comp;
        }

        create(type, name) {
            const id = `${type}#${++this.counter}`;
            const node = { id, type, name, niceName: name, attrs: { inputs: null, 'inputs.0': 0 }, customNames: {} };
            this.nodes.set(id, node);
            return id;
        }

        primitive(type, name) {
            const id = `${type}#${++this.counter}`;
            this.nodes.set(id, { id, type, name, niceName: name, attrs: {} });
            return id;
        }

        getActiveComp() { return this.activeComp.id; }
        getSelection() { return [...this.selection]; }
        select(ids) { this.selection = [...ids]; }
        getLayerType(id) { return this.nodes.get(id)?.type || ''; }
        getNiceName(id) { return this.nodes.get(id)?.niceName || id; }
        getAttributes(id) { return Object.keys(this.nodes.get(id)?.attrs || {}); }
        getCustomAttributeName(id, attr) { return this.nodes.get(id)?.customNames[attr] || ''; }
        renameAttribute(id, attr, name) { if (this.nodes.has(id)) this.nodes.get(id).customNames[attr] = name; }

        addDynamic(id, group, type) {
            const node = this.nodes.get(id);
            let idx = 0;
            while (node.attrs.hasOwnProperty(`${group}.${idx}`)) idx++;
            const slot = `${group}.${idx}`;
            node.attrs[slot] = 0;
            return slot;
        }

        set(id, props) {
            const node = this.nodes.get(id);
            if (node) Object.assign(node.attrs, props);
        }

        connect(srcId, srcAttr, dstId, dstAttr) {
            this.connections.push({ srcId, srcAttr, dstId, dstAttr });
        }

        getConnected(dstId, dstAttr) {
            return this.connections.filter(c => c.dstId === dstId && c.dstAttr === dstAttr).map(c => c.srcId);
        }
    }

    const scene = new MockScene();
    const rect = scene.primitive('rectangle', 'Blur Target');
    scene.select([rect]);

    const sandbox = {
        api: scene,
        console: console,
        __EFFECT_CONFIG__: {
            params: { blurriness: 75.0, blurDimensions: 'Horizontal Only', repeatEdgePixels: 1 }
        }
    };
    vm.createContext(sandbox);
    const res = vm.runInContext(implSource, sandbox);

    assert.equal(res.ok, true);
    assert.equal(res.code, 'SUCCESS');
    assert.equal(res.effect, 'Gaussian Blur');
    assert.equal(res.appliedCount, 1);
    const filterId = res.results[0].filterId;
    assert.ok(filterId.startsWith('skslFilter#'));

    const filterNode = scene.nodes.get(filterId);
    assert.equal(filterNode.attrs['inputs.0'], 75.0);
    assert.equal(filterNode.attrs['inputs.1'], 1); // Horizontal
    assert.equal(filterNode.attrs['inputs.2'], 1); // Repeat edge pixels
    assert.ok(filterNode.attrs.padding.x > 0);
    assert.equal(filterNode.attrs.padding.y, 0);

    // Fault injection test: node creation failure
    const faultScene = new MockScene();
    faultScene.create = () => null; // Simulate failure to create skslFilter
    const rFault = faultScene.primitive('rectangle', 'Fault Target');
    faultScene.select([rFault]);

    const faultSandbox = {
        api: faultScene,
        console: console,
        __EFFECT_CONFIG__: { params: { blurriness: 20 } }
    };
    vm.createContext(faultSandbox);
    const faultRes = vm.runInContext(implSource, faultSandbox);
    assert.equal(faultRes.ok, false);
    assert.equal(faultRes.code, 'RUNTIME_EXCEPTION');
    assert.equal(faultRes.appliedCount, 0);
    assert.equal(faultRes.failedCount, 1);
});
