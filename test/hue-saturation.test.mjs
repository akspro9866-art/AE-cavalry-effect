import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

import * as mathModel from '../effects/hue-saturation/math-model.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EFFECT_DIR = path.join(ROOT, 'effects', 'hue-saturation');

test('Hue/Saturation — Tier 1: Static validation & embedded code sync', () => {
    const skslPath = path.join(EFFECT_DIR, 'hue-saturation.sksl');
    const pmapPath = path.join(EFFECT_DIR, 'parameter-map.json');
    const implPath = path.join(EFFECT_DIR, 'implementation.js');

    assert.ok(fs.existsSync(skslPath));
    assert.ok(fs.existsSync(pmapPath));
    assert.ok(fs.existsSync(implPath));

    const sksl = fs.readFileSync(skslPath, 'utf8');
    assert.ok(sksl.includes('uniform shader layer;'));
    assert.ok(sksl.includes('uniform float MasterHue;'));
    assert.ok(sksl.includes('uniform float MasterSaturation;'));
    assert.ok(sksl.includes('uniform float Colorize;'));
    assert.ok(sksl.includes('half4 main(float2 fragCoord)'));

    const pmap = JSON.parse(fs.readFileSync(pmapPath, 'utf8'));
    assert.equal(pmap.effectSlug, 'hue-saturation');
    assert.equal(pmap.parameters.length, 8);
});

test('Hue/Saturation — Tier 2: Mathematical invariants (Hue wrap, Grayscale desaturation & Colorize)', () => {
    // 1. Identity on defaults
    const red = [1.0, 0.0, 0.0];
    const redIdent = mathModel.applyHueSaturation(red, {});
    for (let i = 0; i < 3; i++) {
        assert.ok(Math.abs(redIdent[i] - red[i]) < 1e-4, `Expected identity for channel ${i}`);
    }

    // 2. 120-degree hue rotation: Red -> Green
    const redToGreen = mathModel.applyHueSaturation(red, { masterHue: 120.0 });
    assert.ok(Math.abs(redToGreen[0] - 0.0) < 1e-3);
    assert.ok(Math.abs(redToGreen[1] - 1.0) < 1e-3);
    assert.ok(Math.abs(redToGreen[2] - 0.0) < 1e-3);

    // 3. -100% Saturation produces perfect grayscale (R == G == B)
    const desat = mathModel.applyHueSaturation([0.8, 0.2, 0.4], { masterSaturation: -100.0 });
    assert.ok(Math.abs(desat[0] - desat[1]) < 1e-4);
    assert.ok(Math.abs(desat[1] - desat[2]) < 1e-4);

    // 4. Colorize mode
    const colorized = mathModel.applyHueSaturation([0.5, 0.5, 0.5], { colorize: true, colorizeHue: 240.0, colorizeSaturation: 100.0 });
    // Hue 240 is pure Blue in HSL
    assert.ok(colorized[2] > colorized[0]);
    assert.ok(colorized[2] > colorized[1]);
});

test('Hue/Saturation — Tier 3: Headless Mock Stallion execution & dynamic slots', () => {
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
    const shape = scene.primitive('rectangle', 'HueSat Target');
    scene.select([shape]);

    const ctx = {
        api: scene,
        console: { log: () => {}, warn: () => {}, error: () => {} },
        __EFFECT_CONFIG__: { params: { masterHue: 45.0, masterSaturation: 20.0 } }
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
