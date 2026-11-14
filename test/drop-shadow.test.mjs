import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

import * as mathModel from '../effects/drop-shadow/math-model.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EFFECT_DIR = path.join(ROOT, 'effects', 'drop-shadow');

test('Drop Shadow — Tier 1: Static validation & embedded code sync', () => {
    const skslPath = path.join(EFFECT_DIR, 'drop-shadow.sksl');
    const pmapPath = path.join(EFFECT_DIR, 'parameter-map.json');
    const implPath = path.join(EFFECT_DIR, 'implementation.js');

    assert.ok(fs.existsSync(skslPath));
    assert.ok(fs.existsSync(pmapPath));
    assert.ok(fs.existsSync(implPath));

    const sksl = fs.readFileSync(skslPath, 'utf8');
    assert.ok(sksl.includes('uniform shader layer;'));
    assert.ok(sksl.includes('uniform half4 ShadowColor;'));
    assert.ok(sksl.includes('uniform float Opacity;'));
    assert.ok(sksl.includes('uniform float Direction;'));
    assert.ok(sksl.includes('uniform float Distance;'));
    assert.ok(sksl.includes('uniform float Softness;'));
    assert.ok(sksl.includes('half4 main(float2 fragCoord)'));

    const pmap = JSON.parse(fs.readFileSync(pmapPath, 'utf8'));
    assert.equal(pmap.effectSlug, 'drop-shadow');
    assert.equal(pmap.parameters.length, 6);
});

test('Drop Shadow — Tier 2: Mathematical invariants (Offset, Padding & Over compositing)', () => {
    // 1. Angle 0 degrees = pure positive X offset
    const [ox0, oy0] = mathModel.computeShadowOffset(0.0, 20.0);
    assert.ok(Math.abs(ox0 - 20.0) < 1e-4);
    assert.ok(Math.abs(oy0) < 1e-4);

    // 2. Angle 90 degrees = pure positive Y offset
    const [ox90, oy90] = mathModel.computeShadowOffset(90.0, 20.0);
    assert.ok(Math.abs(ox90) < 1e-4);
    assert.ok(Math.abs(oy90 - 20.0) < 1e-4);

    // 3. Padding calculation
    const pad = mathModel.computePadding(0.0, 20.0, 10.0);
    assert.equal(pad.x, Math.ceil(20 + 15) + 15); // 35 + 15 = 50

    // 4. Over composite: fully opaque foreground completely occludes shadow
    const srcOpaque = [1.0, 1.0, 1.0, 1.0];
    const shadowBlack = [0.0, 0.0, 0.0, 0.8];
    const compOpaque = mathModel.compositeOver(srcOpaque, shadowBlack);
    assert.equal(compOpaque[0], 1.0);
    assert.equal(compOpaque[1], 1.0);
    assert.equal(compOpaque[2], 1.0);
    assert.equal(compOpaque[3], 1.0);

    // Fully transparent foreground reveals pure shadow
    const srcTrans = [0.0, 0.0, 0.0, 0.0];
    const compTrans = mathModel.compositeOver(srcTrans, shadowBlack);
    assert.equal(compTrans[3], 0.8);
});

test('Drop Shadow — Tier 3: Headless Mock Stallion execution & dynamic color slots', () => {
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
            node.attrs[slot] = type === 'color' ? { r: 0, g: 0, b: 0, a: 255 } : 0;
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
    const shape = scene.primitive('rectangle', 'Shadow Target');
    scene.select([shape]);

    const ctx = {
        api: scene,
        console: { log: () => {}, warn: () => {}, error: () => {} },
        __EFFECT_CONFIG__: { params: { distance: 12.0, softness: 8.0, opacity: 75.0 } }
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
