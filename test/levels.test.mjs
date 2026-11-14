import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

import * as mathModel from '../effects/levels/math-model.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EFFECT_DIR = path.join(ROOT, 'effects', 'levels');

test('Levels — Tier 1: Static validation & embedded code sync', () => {
    const skslPath = path.join(EFFECT_DIR, 'levels.sksl');
    const pmapPath = path.join(EFFECT_DIR, 'parameter-map.json');
    const implPath = path.join(EFFECT_DIR, 'implementation.js');

    assert.ok(fs.existsSync(skslPath));
    assert.ok(fs.existsSync(pmapPath));
    assert.ok(fs.existsSync(implPath));

    const sksl = fs.readFileSync(skslPath, 'utf8');
    assert.ok(sksl.includes('uniform shader layer;'));
    assert.ok(sksl.includes('uniform float InputBlack;'));
    assert.ok(sksl.includes('uniform float InputWhite;'));
    assert.ok(sksl.includes('uniform float Gamma;'));
    assert.ok(sksl.includes('uniform float OutputBlack;'));
    assert.ok(sksl.includes('uniform float OutputWhite;'));
    assert.ok(sksl.includes('half4 main(float2 fragCoord)'));

    const pmap = JSON.parse(fs.readFileSync(pmapPath, 'utf8'));
    assert.equal(pmap.effectSlug, 'levels');
    assert.equal(pmap.parameters.length, 6);
});

test('Levels — Tier 2: Mathematical invariants (Remapping, Gamma, Monotonicity & Channel Isolation)', () => {
    // 1. Default identity
    for (const val of [0.0, 0.25, 0.5, 0.75, 1.0]) {
        const remapped = mathModel.remapLevel(val, 0, 255, 1.0, 0, 255);
        assert.ok(Math.abs(remapped - val) < 1e-4, `Expected identity for ${val}, got ${remapped}`);
    }

    // 2. Monotonicity: higher input must yield greater or equal output
    let prev = -1;
    for (let i = 0; i <= 100; i++) {
        const cur = mathModel.remapLevel(i / 100, 30, 220, 1.5, 10, 240);
        assert.ok(cur >= prev, `Monotonicity violated at step ${i}: ${cur} < ${prev}`);
        prev = cur;
    }

    // 3. Gamma > 1 brightens midtones, Gamma < 1 darkens midtones
    const midNormal = mathModel.remapLevel(0.5, 0, 255, 1.0, 0, 255);
    const midBright = mathModel.remapLevel(0.5, 0, 255, 2.0, 0, 255);
    const midDark = mathModel.remapLevel(0.5, 0, 255, 0.5, 0, 255);
    assert.ok(midBright > midNormal, 'Gamma 2.0 must brighten midtone 0.5');
    assert.ok(midDark < midNormal, 'Gamma 0.5 must darken midtone 0.5');

    // 4. Channel isolation
    const rgb = [0.5, 0.5, 0.5];
    const redOnly = mathModel.applyLevels(rgb, { channel: 1, gamma: 2.0 });
    assert.ok(redOnly[0] > rgb[0], 'Red channel must be brightened');
    assert.equal(redOnly[1], rgb[1], 'Green channel must be unchanged');
    assert.equal(redOnly[2], rgb[2], 'Blue channel must be unchanged');
});

test('Levels — Tier 3: Headless Mock Stallion execution & dynamic slots', () => {
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
    const shape = scene.primitive('rectangle', 'Target Rectangle');
    scene.select([shape]);

    const ctx = {
        api: scene,
        console: { log: () => {}, warn: () => {}, error: () => {} },
        __EFFECT_CONFIG__: { params: { gamma: 2.2, inputBlack: 15 } }
    };
    vm.createContext(ctx);

    const res = vm.runInContext(implSource, ctx);
    assert.equal(res.ok, true);
    assert.equal(res.appliedCount, 1);
    assert.equal(res.code, 'SUCCESS');

    // Verify filter node creation & connection
    const filterId = res.results[0].filterId;
    assert.ok(filterId);
    assert.equal(scene.connections.length, 1);
    assert.equal(scene.connections[0].from, `${filterId}.id`);
    assert.equal(scene.connections[0].to, `${shape}.filters`);

    // Verify idempotency on second run
    const res2 = vm.runInContext(implSource, ctx);
    assert.equal(res2.ok, true);
    assert.equal(res2.results[0].filterId, filterId, 'Must update existing filter without duplicate node creation');
});
