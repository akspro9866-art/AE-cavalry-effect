import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

import * as mathModel from '../effects/fractal-noise/math-model.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EFFECT_DIR = path.join(ROOT, 'effects', 'fractal-noise');

test('Fractal Noise — Tier 1: Static validation & embedded code sync', () => {
    const skslPath = path.join(EFFECT_DIR, 'fractal-noise.sksl');
    const pmapPath = path.join(EFFECT_DIR, 'parameter-map.json');
    const implPath = path.join(EFFECT_DIR, 'implementation.js');

    assert.ok(fs.existsSync(skslPath));
    assert.ok(fs.existsSync(pmapPath));
    assert.ok(fs.existsSync(implPath));

    const sksl = fs.readFileSync(skslPath, 'utf8');
    assert.ok(sksl.includes('uniform shader layer;'));
    assert.ok(sksl.includes('half4 main(float2 fragCoord)'));

    const pmap = JSON.parse(fs.readFileSync(pmapPath, 'utf8'));
    assert.equal(pmap.effectSlug, 'fractal-noise');
    assert.equal(pmap.parameters.length, 14);
});

test('Fractal Noise — Tier 2: Mathematical invariants (Contrast, Brightness & Overflow)', () => {
    // 1. Contrast expansion
    const midVal = 0.0; // maps to 0.5
    const base = mathModel.remapContrastBrightness(midVal, 100, 0);
    assert.equal(base, 0.5);

    const hiContrast = mathModel.remapContrastBrightness(0.5, 200, 0);
    assert.ok(hiContrast > 0.75, 'High contrast must expand values outward');

    // 2. Brightness bias
    const bright = mathModel.remapContrastBrightness(midVal, 100, 20);
    assert.equal(bright, 0.7);

    // 3. Overflow clipping vs wrap
    const clipped = mathModel.applyOverflow(1.4, 0);
    assert.equal(clipped, 1.0);

    const wrapped = mathModel.applyOverflow(1.4, 2);
    assert.ok(Math.abs(wrapped - 0.4) < 1e-4);
});

test('Fractal Noise — Tier 3: Headless Mock Stallion execution & dynamic slots', () => {
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
            node.attrs[slot] = type === 'double2' ? { x: 0, y: 0 } : (type === 'bool' ? false : 0);
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
    const rect = scene.primitive('rectangle', 'Noise Target');
    scene.select([rect]);

    const sandbox = {
        api: scene,
        console: console,
        __EFFECT_CONFIG__: {
            params: {
                fractalType: 'Turbulent Smooth',
                contrast: 150,
                scale: 120,
                complexity: 7.0,
                evolution: 90
            }
        }
    };
    vm.createContext(sandbox);
    const res = vm.runInContext(implSource, sandbox);

    assert.equal(res.ok, true);
    assert.equal(res.effect, 'Fractal Noise');
    assert.equal(res.appliedCount, 1);
    const filterId = res.results[0].filterId;
    assert.ok(filterId.startsWith('skslFilter#'));

    const filterNode = scene.nodes.get(filterId);
    assert.equal(filterNode.attrs['inputs.0'], 1); // Turbulent Smooth
    assert.equal(filterNode.attrs['inputs.3'], 150); // Contrast
    assert.equal(filterNode.attrs['inputs.6'], 7.0); // Complexity
    assert.equal(filterNode.attrs['inputs.7'], 120); // Scale
    assert.equal(filterNode.attrs['inputs.9'], 90);  // Evolution
});
