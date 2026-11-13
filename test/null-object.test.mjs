import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EFFECT_DIR = path.join(ROOT, 'effects', 'null-object');

test('Null Object — Static validation, centroid math & mock parenting', () => {
    const implPath = path.join(EFFECT_DIR, 'implementation.js');
    const pmapPath = path.join(EFFECT_DIR, 'parameter-map.json');

    assert.ok(fs.existsSync(implPath), 'implementation.js must exist');
    assert.ok(fs.existsSync(pmapPath), 'parameter-map.json must exist');

    const impl = fs.readFileSync(implPath, 'utf8');

    // Mock Cavalry environment
    class MockScene {
        constructor() {
            this.nodes = new Map();
            this.selection = [];
            this.parents = new Map();
            this.counter = 0;
            const comp = { id: 'compNode#1', name: 'Composition 1' };
            this.nodes.set(comp.id, comp);
            this.activeComp = comp;
        }

        getActiveComp() { return this.activeComp.id; }
        getCompLayers() { return Array.from(this.nodes.keys()).filter(k => k !== 'compNode#1'); }
        getSelection() { return [...this.selection]; }
        select(ids) { this.selection = [...ids]; }
        getNiceName(id) { return this.nodes.get(id)?.name || id; }
        getLayerType(id) { return this.nodes.get(id)?.type || ''; }
        getParent(id) { return this.parents.get(id) || ''; }

        create(type, name) {
            const id = `${type}#${++this.counter}`;
            this.nodes.set(id, { id, type, name, attrs: {} });
            return id;
        }

        primitive(type, name) {
            const id = `${type}#${++this.counter}`;
            this.nodes.set(id, { id, type, name, attrs: {} });
            return id;
        }

        set(id, props) {
            const node = this.nodes.get(id);
            if (node) Object.assign(node.attrs, props);
        }

        get(id, attr) {
            const node = this.nodes.get(id);
            return node ? node.attrs[attr] : undefined;
        }

        getBoundingBox(id) {
            const node = this.nodes.get(id);
            const pos = node?.attrs?.position || { x: 0, y: 0 };
            return { x: pos.x - 50, y: pos.y - 50, width: 100, height: 100, centre: { x: pos.x, y: pos.y } };
        }

        parent(childId, parentId) {
            this.parents.set(childId, parentId);
            return true;
        }
    }

    const scene = new MockScene();
    const r1 = scene.primitive('rectangle', 'Target 1');
    const r2 = scene.primitive('rectangle', 'Target 2');
    scene.set(r1, { position: { x: -120, y: 40 } });
    scene.set(r2, { position: { x: 80, y: 60 } });
    scene.select([r1, r2]);

    const sandbox = { api: scene, console: console };
    vm.createContext(sandbox);
    const res = vm.runInContext(impl, sandbox);

    assert.equal(res.ok, true);
    assert.equal(res.workflow, 'Null Object');
    assert.equal(res.parentedCount, 2);
    // Centroid of -120 and 80 is -20, centroid of 40 and 60 is 50
    assert.equal(res.position.x, -20);
    assert.equal(res.position.y, 50);

    assert.equal(scene.getParent(r1), res.nullId);
    assert.equal(scene.getParent(r2), res.nullId);
    assert.deepEqual(scene.getSelection(), [res.nullId], 'Null must become selected');
});
