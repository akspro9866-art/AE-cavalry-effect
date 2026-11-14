import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

import * as mathModel from '../effects/cc-light-sweep/math-model.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EFFECT_DIR = path.join(ROOT, 'effects', 'cc-light-sweep');

test('CC Light Sweep — Tier 1: Static validation & embedded code sync', () => {
    const skslPath = path.join(EFFECT_DIR, 'cc-light-sweep.sksl');
    const pmapPath = path.join(EFFECT_DIR, 'parameter-map.json');
    const implPath = path.join(EFFECT_DIR, 'implementation.js');

    assert.ok(fs.existsSync(skslPath));
    assert.ok(fs.existsSync(pmapPath));
    assert.ok(fs.existsSync(implPath));

    const sksl = fs.readFileSync(skslPath, 'utf8');
    assert.ok(sksl.includes('uniform shader layer;'));
    assert.ok(sksl.includes('uniform float CenterX;'));
    assert.ok(sksl.includes('uniform float CenterY;'));
    assert.ok(sksl.includes('uniform float Direction;'));
    assert.ok(sksl.includes('uniform float Width;'));
    assert.ok(sksl.includes('uniform half4 LightColor;'));
    assert.ok(sksl.includes('half4 main(float2 fragCoord)'));

    const pmap = JSON.parse(fs.readFileSync(pmapPath, 'utf8'));
    assert.equal(pmap.effectSlug, 'cc-light-sweep');
    assert.equal(pmap.parameters.length, 9);
});

test('CC Light Sweep — Tier 2: Mathematical invariants (Beam profiles & alpha gradients)', () => {
    const center = [0.0, 0.0];
    const width = 50.0;

    // 1. Point exactly on center line has intensity 1.0
    const bCenterLinear = mathModel.computeBeamIntensity([0, 0], center, 0.0, width, 0);
    assert.equal(bCenterLinear, 1.0);

    // 2. Point outside width has intensity 0.0
    const bOutside = mathModel.computeBeamIntensity([0, 30.0], center, 0.0, width, 0); // normal is (0, 1) for dir=0
    assert.equal(bOutside, 0.0);

    // 3. Smooth vs Sharp profiles at halfway (u = 0.5)
    // For dir = 0, normal is (0, 1). Point [0, 12.5] has d = 12.5 -> u = 1 - 12.5 / 25 = 0.5
    const bSmooth = mathModel.computeBeamIntensity([0, 12.5], center, 0.0, width, 1);
    const bSharp = mathModel.computeBeamIntensity([0, 12.5], center, 0.0, width, 2);
    // Smooth at 0.5 is 3*(0.25) - 2*(0.125) = 0.75 - 0.25 = 0.5
    assert.ok(Math.abs(bSmooth - 0.5) < 1e-4);
    // Sharp at 0.5 is 0.5^3 = 0.125
    assert.ok(Math.abs(bSharp - 0.125) < 1e-4);

    // 4. Alpha gradient detection
    const gradOnEdge = mathModel.computeAlphaGradient(1.0, 0.0, 0.5, 0.5);
    assert.equal(gradOnEdge, 0.5);
});

test('CC Light Sweep — Tier 3: Headless Mock Stallion execution & dynamic color slots', () => {
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
    const shape = scene.primitive('rectangle', 'Light Sweep Target');
    scene.select([shape]);

    const ctx = {
        api: scene,
        console: { log: () => {}, warn: () => {}, error: () => {} },
        __EFFECT_CONFIG__: { params: { direction: 45.0, width: 80.0, sweepIntensity: 1.5 } }
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
