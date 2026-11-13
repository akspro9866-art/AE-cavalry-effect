import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

import * as mathModel from '../effects/cc-repetile/math-model.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EFFECT_DIR = path.join(ROOT, 'effects', 'cc-repetile');

test('CC RepeTile — Tier 1: Static validation & embedded code sync', () => {
    const skslPath = path.join(EFFECT_DIR, 'cc-repetile.sksl');
    const pmapPath = path.join(EFFECT_DIR, 'parameter-map.json');
    const implPath = path.join(EFFECT_DIR, 'implementation.js');

    assert.ok(fs.existsSync(skslPath));
    assert.ok(fs.existsSync(pmapPath));
    assert.ok(fs.existsSync(implPath));

    const sksl = fs.readFileSync(skslPath, 'utf8');
    assert.ok(sksl.includes('uniform shader layer;'));
    assert.ok(sksl.includes('half4 main(float2 fragCoord)'));

    const pmap = JSON.parse(fs.readFileSync(pmapPath, 'utf8'));
    assert.equal(pmap.effectSlug, 'cc-repetile');
    assert.equal(pmap.parameters.length, 6);

    const impl = fs.readFileSync(implPath, 'utf8');
    assert.ok(impl.includes('/* @@BEGIN_SKSL@@ */'));
    assert.ok(!impl.includes('var SKSL_SOURCE = "";'));
});

test('CC RepeTile — Tier 2: Mathematical invariants (Repeat, Flip Ping-Pong & Brick)', () => {
    // 1. Inside [0, 1] bounds, coordinates remain identity
    const inBounds = mathModel.mapRepeTileUV(0.35, 0.72, 1);
    assert.ok(Math.abs(inBounds.u - 0.35) < 1e-5);
    assert.ok(Math.abs(inBounds.v - 0.72) < 1e-5);

    // 2. Flip (Ping-Pong) reflection across boundary
    // At u = 1.05 (just across the right edge), must reflect inward to 0.95
    const rightFlip = mathModel.mapRepeTileUV(1.05, 0.5, 1);
    assert.ok(Math.abs(rightFlip.u - 0.95) < 1e-4, 'Right edge flip must reflect 1.05 to 0.95');

    // At u = -0.05 (just across the left edge), must reflect inward to 0.05
    const leftFlip = mathModel.mapRepeTileUV(-0.05, 0.5, 1);
    assert.ok(Math.abs(leftFlip.u - 0.05) < 1e-4, 'Left edge flip must reflect -0.05 to 0.05');

    // 3. Repeat (Modular periodic)
    const repeatUV = mathModel.mapRepeTileUV(2.4, 3.8, 0);
    assert.ok(Math.abs(repeatUV.u - 0.4) < 1e-4);
    assert.ok(Math.abs(repeatUV.v - 0.8) < 1e-4);

    // 4. Brick (50% horizontal stagger on alternate rows)
    const row0 = mathModel.mapRepeTileUV(0.2, 0.5, 3);
    const row1 = mathModel.mapRepeTileUV(0.2, 1.5, 3);
    assert.ok(Math.abs(row0.u - 0.2) < 1e-4);
    assert.ok(Math.abs(row1.u - 0.7) < 1e-4, 'Alternate brick row must shift u by 0.5');

    // 5. Padding calculation
    const pad = mathModel.computePadding(250, 400, 180, 120);
    assert.equal(pad.x, 400);
    assert.equal(pad.y, 180);
});

test('CC RepeTile — Tier 3: Headless Mock Stallion execution & dynamic slots', () => {
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
    const rect = scene.primitive('rectangle', 'RepeTile Target');
    scene.select([rect]);

    const sandbox = {
        api: scene,
        console: console,
        __EFFECT_CONFIG__: {
            params: {
                expandLeft: 300,
                expandRight: 350,
                expandUp: 220,
                expandDown: 240,
                tiling: 'Flip'
            }
        }
    };
    vm.createContext(sandbox);
    const res = vm.runInContext(implSource, sandbox);

    assert.equal(res.ok, true);
    assert.equal(res.effect, 'CC RepeTile');
    assert.equal(res.appliedCount, 1);
    const filterId = res.results[0].filterId;
    assert.ok(filterId.startsWith('skslFilter#'));

    const filterNode = scene.nodes.get(filterId);
    assert.equal(filterNode.attrs['inputs.0'], 300); // ExpandLeft
    assert.equal(filterNode.attrs['inputs.1'], 350); // ExpandRight
    assert.equal(filterNode.attrs['inputs.2'], 220); // ExpandUp
    assert.equal(filterNode.attrs['inputs.3'], 240); // ExpandDown
    assert.equal(filterNode.attrs['inputs.4'], 1);   // Tiling: Flip
    assert.equal(filterNode.attrs.padding.x, 350);
    assert.equal(filterNode.attrs.padding.y, 240);
});
