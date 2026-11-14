import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

import * as mathModel from '../effects/radial-blur/math-model.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EFFECT_DIR = path.join(ROOT, 'effects', 'radial-blur');

test('Radial Blur — Tier 1: Static validation & embedded code sync', () => {
    const skslPath = path.join(EFFECT_DIR, 'radial-blur.sksl');
    const pmapPath = path.join(EFFECT_DIR, 'parameter-map.json');
    const implPath = path.join(EFFECT_DIR, 'implementation.js');

    assert.ok(fs.existsSync(skslPath));
    assert.ok(fs.existsSync(pmapPath));
    assert.ok(fs.existsSync(implPath));

    const sksl = fs.readFileSync(skslPath, 'utf8');
    assert.ok(sksl.includes('uniform shader layer;'));
    assert.ok(sksl.includes('uniform float Amount;'));
    assert.ok(sksl.includes('uniform float BlurType;'));
    assert.ok(sksl.includes('uniform float CenterX;'));
    assert.ok(sksl.includes('half4 main(float2 fragCoord)'));

    const pmap = JSON.parse(fs.readFileSync(pmapPath, 'utf8'));
    assert.equal(pmap.effectSlug, 'radial-blur');
    assert.equal(pmap.parameters.length, 5);
});

test('Radial Blur — Tier 2: Mathematical invariants (Rotational symmetry, Zoom scale & padding)', () => {
    // 1. Spin mode preserves radial distance (length remains invariant under rotation)
    const rVec = [30.0, 40.0]; // length 50
    const { cw, ccw } = mathModel.computeSpinSampleOffsets(rVec, Math.PI / 6);
    const lenCw = Math.hypot(cw[0], cw[1]);
    const lenCcw = Math.hypot(ccw[0], ccw[1]);
    assert.ok(Math.abs(lenCw - 50.0) < 1e-4, 'Spin rotation must preserve radius');
    assert.ok(Math.abs(lenCcw - 50.0) < 1e-4);

    // 2. Zoom mode scales collinear with rVec
    const { zoomIn, zoomOut } = mathModel.computeZoomSampleOffsets(rVec, 0.2);
    assert.ok(Math.abs(Math.hypot(zoomIn[0], zoomIn[1]) - 40.0) < 1e-4);
    assert.ok(Math.abs(Math.hypot(zoomOut[0], zoomOut[1]) - 60.0) < 1e-4);

    // 3. Padding expands with amount
    const pad10 = mathModel.computePadding(10.0, 0);
    const pad50 = mathModel.computePadding(50.0, 0);
    assert.ok(pad50.x > pad10.x);
});

test('Radial Blur — Tier 3: Headless Mock Stallion execution & dynamic slots', () => {
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
    const shape = scene.primitive('rectangle', 'Radial Blur Target');
    scene.select([shape]);

    const ctx = {
        api: scene,
        console: { log: () => {}, warn: () => {}, error: () => {} },
        __EFFECT_CONFIG__: { params: { amount: 20.0, blurType: 1, centerX: 10.0 } }
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
