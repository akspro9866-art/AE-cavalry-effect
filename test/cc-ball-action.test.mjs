import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

import * as mathModel from '../effects/cc-ball-action/math-model.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EFFECT_DIR = path.join(ROOT, 'effects', 'cc-ball-action');

test('CC Ball Action — Tier 1: Static validation & embedded code sync', () => {
    const skslPath = path.join(EFFECT_DIR, 'cc-ball-action.sksl');
    const pmapPath = path.join(EFFECT_DIR, 'parameter-map.json');
    const implPath = path.join(EFFECT_DIR, 'implementation.js');

    assert.ok(fs.existsSync(skslPath), 'cc-ball-action.sksl must exist');
    assert.ok(fs.existsSync(pmapPath), 'parameter-map.json must exist');
    assert.ok(fs.existsSync(implPath), 'implementation.js must exist');

    const sksl = fs.readFileSync(skslPath, 'utf8');
    assert.ok(sksl.includes('uniform shader layer;'));
    assert.ok(sksl.includes('uniform float Scatter;'));
    assert.ok(sksl.includes('uniform float RotationAxis;'));
    assert.ok(sksl.includes('uniform float RotationAngle;'));
    assert.ok(sksl.includes('uniform float BallSize;'));
    assert.ok(sksl.includes('uniform float GridSpacing;'));
    assert.ok(sksl.includes('uniform float InstabilityState;'));
    assert.ok(sksl.includes('half4 main(float2 fragCoord)'));

    const pmap = JSON.parse(fs.readFileSync(pmapPath, 'utf8'));
    assert.equal(pmap.effectSlug, 'cc-ball-action');
    assert.equal(pmap.parameters.length, 6);
});

test('CC Ball Action — Tier 2: Mathematical invariants (Sphere normals & padding)', () => {
    const R = 10.0;

    // Normal at sphere center (apex) is pure +Z (pointing directly at camera)
    const normCenter = mathModel.computeBallNormal(0.0, 0.0, R);
    assert.ok(normCenter !== null);
    assert.equal(normCenter[0], 0.0);
    assert.equal(normCenter[1], 0.0);
    assert.equal(normCenter[2], 1.0);

    // Normal at edge (R, 0) is pure +X
    const normEdgeX = mathModel.computeBallNormal(R, 0.0, R);
    assert.ok(normEdgeX !== null);
    assert.equal(normEdgeX[0], 1.0);
    assert.equal(normEdgeX[1], 0.0);
    assert.equal(normEdgeX[2], 0.0);

    // Unit length of 3D normal vector
    const normAng = mathModel.computeBallNormal(6.0, 8.0, R);
    assert.ok(normAng !== null);
    const lenSq = normAng[0] * normAng[0] + normAng[1] * normAng[1] + normAng[2] * normAng[2];
    assert.ok(Math.abs(lenSq - 1.0) < 1e-5, 'Normal must be normalized to unit length');

    // Outside radius returns null
    const normOutside = mathModel.computeBallNormal(12.0, 12.0, R);
    assert.equal(normOutside, null);

    // Lighting invariant: apex facing light is brighter than silhouette
    const lightApex = mathModel.computeBallLighting(normCenter);
    const lightEdge = mathModel.computeBallLighting(normEdgeX);
    assert.ok(lightApex > lightEdge);

    // Padding growth with Scatter and BallSize
    const pad0 = mathModel.computePadding(0.0, 10.0, 100.0);
    const padScatter = mathModel.computePadding(50.0, 10.0, 100.0);
    const padBigBalls = mathModel.computePadding(0.0, 10.0, 250.0);

    assert.ok(padScatter.x > pad0.x, 'Scatter must expand padding');
    assert.ok(padBigBalls.x > pad0.x, 'BallSize > 100% must expand padding');
});

test('CC Ball Action — Tier 3: Headless Mock Stallion execution & dynamic slots', () => {
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
    const rect = scene.primitive('rectangle', 'Ball Action Target');
    scene.select([rect]);

    const sandbox = {
        api: scene,
        console: console,
        __EFFECT_CONFIG__: {
            params: {
                scatter: 45.0,
                rotationAxis: 1.0,
                rotationAngle: 45.0,
                ballSize: 150.0,
                gridSpacing: 12.0,
                instabilityState: 88.0
            }
        }
    };
    vm.createContext(sandbox);
    const res = vm.runInContext(implSource, sandbox);

    assert.equal(res.ok, true);
    assert.equal(res.effect, 'CC Ball Action');
    assert.equal(res.appliedCount, 1);
    const filterId = res.results[0].filterId;
    assert.ok(filterId.startsWith('skslFilter#'));

    const filterNode = scene.nodes.get(filterId);
    assert.equal(filterNode.attrs['inputs.0'], 45.0);
    assert.equal(filterNode.attrs['inputs.1'], 1.0);
    assert.equal(filterNode.attrs['inputs.2'], 45.0);
    assert.equal(filterNode.attrs['inputs.3'], 150.0);
    assert.equal(filterNode.attrs['inputs.4'], 12.0);
    assert.equal(filterNode.attrs['inputs.5'], 88.0);
    assert.ok(filterNode.attrs.padding.x > 0);
    assert.ok(filterNode.attrs.padding.y > 0);
});
