import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

import * as mathModel from '../effects/tint/math-model.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EFFECT_DIR = path.join(ROOT, 'effects', 'tint');

function assertCloseColor(actual, expected, eps = 1e-4) {
    for (let i = 0; i < 3; i++) {
        assert.ok(
            Math.abs(actual[i] - expected[i]) <= eps,
            `Channel ${i}: expected ${expected[i]}, got ${actual[i]}`
        );
    }
}

test('Tint — Tier 1: Static validation & embedded code sync', () => {
    const skslPath = path.join(EFFECT_DIR, 'tint.sksl');
    const pmapPath = path.join(EFFECT_DIR, 'parameter-map.json');
    const implPath = path.join(EFFECT_DIR, 'implementation.js');

    assert.ok(fs.existsSync(skslPath), 'tint.sksl must exist');
    assert.ok(fs.existsSync(pmapPath), 'parameter-map.json must exist');
    assert.ok(fs.existsSync(implPath), 'implementation.js must exist');

    const sksl = fs.readFileSync(skslPath, 'utf8');
    assert.ok(sksl.includes('uniform shader layer;'));
    assert.ok(sksl.includes('uniform half4 MapBlackTo;'));
    assert.ok(sksl.includes('uniform half4 MapWhiteTo;'));
    assert.ok(sksl.includes('uniform float Amount;'));
    assert.ok(sksl.includes('half4 main(float2 fragCoord)'));

    const pmap = JSON.parse(fs.readFileSync(pmapPath, 'utf8'));
    assert.equal(pmap.effectSlug, 'tint');
    assert.equal(pmap.parameters.length, 3);
});

test('Tint — Tier 2: Mathematical invariants (Rec. 601 luma & interpolation)', () => {
    const black = [0.1, 0.0, 0.2];
    const white = [0.9, 0.8, 1.0];

    // Identity when amount is 0
    const src1 = [0.4, 0.5, 0.6];
    const res0 = mathModel.applyTint(src1, black, white, 0.0);
    assertCloseColor(res0, src1);

    // Pure black input with amount=1 maps to MapBlackTo
    const blackInput = [0.0, 0.0, 0.0];
    const resBlack = mathModel.applyTint(blackInput, black, white, 1.0);
    assertCloseColor(resBlack, black);

    // Pure white input with amount=1 maps to MapWhiteTo
    const whiteInput = [1.0, 1.0, 1.0];
    const resWhite = mathModel.applyTint(whiteInput, black, white, 1.0);
    assertCloseColor(resWhite, white);

    // Luminance ordering: Green (0.587) > Red (0.299) > Blue (0.114)
    const gTint = mathModel.applyTint([0, 1, 0], [0, 0, 0], [1, 1, 1], 1.0);
    const rTint = mathModel.applyTint([1, 0, 0], [0, 0, 0], [1, 1, 1], 1.0);
    const bTint = mathModel.applyTint([0, 0, 1], [0, 0, 0], [1, 1, 1], 1.0);
    assert.ok(gTint[0] > rTint[0]);
    assert.ok(rTint[0] > bTint[0]);
});

test('Tint — Tier 3: Headless Mock Stallion execution & dynamic color slots', () => {
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
            node.attrs[slot] = type === 'color' ? { r: 0, g: 0, b: 0, a: 255 } : 0;
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
    const rect = scene.primitive('rectangle', 'Tint Target');
    scene.select([rect]);

    const targetBlack = { r: 255, g: 50, b: 0, a: 255 };
    const targetWhite = { r: 0, g: 200, b: 255, a: 255 };

    const sandbox = {
        api: scene,
        console: console,
        __EFFECT_CONFIG__: {
            params: {
                mapBlackTo: targetBlack,
                mapWhiteTo: targetWhite,
                amount: 0.75
            }
        }
    };
    vm.createContext(sandbox);
    const res = vm.runInContext(implSource, sandbox);

    assert.equal(res.ok, true);
    assert.equal(res.effect, 'Tint');
    assert.equal(res.appliedCount, 1);
    const filterId = res.results[0].filterId;
    assert.ok(filterId.startsWith('skslFilter#'));

    const filterNode = scene.nodes.get(filterId);
    assert.equal(filterNode.attrs['inputs.0'].r, targetBlack.r);
    assert.equal(filterNode.attrs['inputs.0'].g, targetBlack.g);
    assert.equal(filterNode.attrs['inputs.0'].b, targetBlack.b);
    assert.equal(filterNode.attrs['inputs.1'].r, targetWhite.r);
    assert.equal(filterNode.attrs['inputs.1'].g, targetWhite.g);
    assert.equal(filterNode.attrs['inputs.1'].b, targetWhite.b);
    assert.equal(filterNode.attrs['inputs.2'], 0.75);
});
