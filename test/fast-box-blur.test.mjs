import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

import * as mathModel from '../effects/fast-box-blur/math-model.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EFFECT_DIR = path.join(ROOT, 'effects', 'fast-box-blur');

test('Fast Box Blur — Tier 1: Static validation & embedded code sync', () => {
    const skslPath = path.join(EFFECT_DIR, 'fast-box-blur.sksl');
    const pmapPath = path.join(EFFECT_DIR, 'parameter-map.json');
    const implPath = path.join(EFFECT_DIR, 'implementation.js');

    assert.ok(fs.existsSync(skslPath));
    assert.ok(fs.existsSync(pmapPath));
    assert.ok(fs.existsSync(implPath));

    const sksl = fs.readFileSync(skslPath, 'utf8');
    assert.ok(sksl.includes('uniform shader layer;'));
    assert.ok(sksl.includes('uniform float BlurRadius;'));
    assert.ok(sksl.includes('uniform float Iterations;'));
    assert.ok(sksl.includes('uniform float BlurDimensions;'));
    assert.ok(sksl.includes('half4 main(float2 fragCoord)'));

    const pmap = JSON.parse(fs.readFileSync(pmapPath, 'utf8'));
    assert.equal(pmap.effectSlug, 'fast-box-blur');
    assert.equal(pmap.parameters.length, 4);
});

test('Fast Box Blur — Tier 2: Mathematical invariants (Box iterations, B-spline & directional padding)', () => {
    // 1. Box iteration 1 = uniform weight 1.0 within radius
    const w1 = mathModel.computeBoxWeight(5.0, 10.0, 1);
    const w2 = mathModel.computeBoxWeight(8.0, 10.0, 1);
    assert.equal(w1, 1.0);
    assert.equal(w2, 1.0);

    // 2. Beyond radius = 0
    assert.equal(mathModel.computeBoxWeight(12.0, 10.0, 1), 0.0);

    // 3. Iterations = 2: linear triangular falloff
    const wTriCenter = mathModel.computeBoxWeight(0.0, 10.0, 2);
    const wTriHalf = mathModel.computeBoxWeight(10.0, 10.0, 2);
    assert.equal(wTriCenter, 1.0);
    assert.ok(Math.abs(wTriHalf - 0.5) < 1e-4);

    // 4. Directional padding isolation
    const padBoth = mathModel.computePadding(20.0, 2.0, 0);
    assert.equal(padBoth.x, 50); // 20 * 2 + 10
    assert.equal(padBoth.y, 50);

    const padH = mathModel.computePadding(20.0, 2.0, 1);
    assert.equal(padH.x, 50);
    assert.equal(padH.y, 0, 'Horizontal only must zero Y padding');

    const padV = mathModel.computePadding(20.0, 2.0, 2);
    assert.equal(padV.x, 0, 'Vertical only must zero X padding');
    assert.equal(padV.y, 50);
});

test('Fast Box Blur — Tier 3: Headless Mock Stallion execution & dynamic slots', () => {
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
        getName(id) { return this.nodes.get(id)?.name || id; }
        getNiceName(id) { return this.nodes.get(id)?.niceName || id; }
        getAttributes(id) { return Object.keys(this.nodes.get(id)?.attrs || {}); }
        getCustomAttributeName(id, attr) { return this.nodes.get(id)?.customNames?.[attr] || ''; }

        addDynamic(id, group, type) {
            const node = this.nodes.get(id);
            let idx = 0;
            while (node.attrs.hasOwnProperty(`${group}.${idx}`)) idx++;
            const slot = `${group}.${idx}`;
            node.attrs[slot] = type === 'color' ? { r: 255, g: 255, b: 255, a: 255 } : 0;
            return slot;
        }

        renameAttribute(id, attr, newName) {
            const node = this.nodes.get(id);
            node.customNames[attr] = newName;
            return true;
        }

        set(id, props) {
            const node = this.nodes.get(id);
            Object.assign(node.attrs, props);
            return true;
        }

        get(id, attr) { return this.nodes.get(id)?.attrs?.[attr]; }

        connect(fromId, fromAttr, toId, toAttr) {
            this.connections.push({ from: `${fromId}.${fromAttr}`, to: `${toId}.${toAttr}` });
            return true;
        }

        getInConnections(id, attr) {
            const prefix = `${id}.${attr}`;
            return this.connections.filter((c) => c.to.startsWith(prefix)).map((c) => c.from);
        }

        getCompLayers() { return Array.from(this.nodes.keys()); }
    }

    const scene = new MockScene();
    const shape = scene.primitive('rectangle', 'Box Blur Target');
    scene.select([shape]);

    const ctx = {
        api: scene,
        console: { log: () => {}, warn: () => {}, error: () => {} },
        __EFFECT_CONFIG__: { params: { blurRadius: 15.0, iterations: 2.0 } }
    };
    vm.createContext(ctx);

    const res = vm.runInContext(implSource, ctx);
    assert.equal(res.ok, true);
    assert.equal(res.appliedCount, 1);
    assert.equal(res.code, 'SUCCESS');

    const filterId = res.results[0].filterId;
    assert.ok(filterId);
    assert.equal(scene.connections.length, 1);
    assert.equal(scene.connections[0].from, `${filterId}.id`);
    assert.equal(scene.connections[0].to, `${shape}.filters`);
});
