import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EFFECT_DIR = path.join(ROOT, 'effects', 'adjustment-layer');

class MockScene {
    constructor() {
        this.nodes = new Map();
        this.selection = [];
        this.parents = new Map();
        this.connections = [];
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
        const node = { id, type, name, attrs: {}, customNames: {} };
        if (type === 'skslFilter') node.attrs['inputs.0'] = 0;
        this.nodes.set(id, node);
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

    renameAttribute(id, slot, newName) {
        const node = this.nodes.get(id);
        if (node) node.customNames[slot] = newName;
    }

    addDynamic(id, group, type) {
        const node = this.nodes.get(id);
        const slot = `${group}.1`;
        node.attrs[slot] = 0;
        return slot;
    }

    connect(srcId, srcPort, dstId, dstPort) {
        this.connections.push({ srcId, srcPort, dstId, dstPort });
    }

    parent(childId, parentId) {
        this.parents.set(childId, parentId);
        return true;
    }
}

test('Adjustment Layer — Static validation & group filter pipeline wiring', () => {
    const implPath = path.join(EFFECT_DIR, 'implementation.js');
    const pmapPath = path.join(EFFECT_DIR, 'parameter-map.json');

    assert.ok(fs.existsSync(implPath));
    assert.ok(fs.existsSync(pmapPath));

    const impl = fs.readFileSync(implPath, 'utf8');
    const scene = new MockScene();
    const l1 = scene.primitive('rectangle', 'Layer 1');
    const l2 = scene.primitive('rectangle', 'Layer 2');
    scene.select([l1, l2]);

    const sandbox = { api: scene, console: console };
    vm.createContext(sandbox);
    const res = vm.runInContext(impl, sandbox);

    assert.equal(res.ok, true);
    assert.equal(res.code, 'SUCCESS');
    assert.equal(res.workflow, 'Adjustment Layer');
    assert.equal(res.groupedCount, 2);
    assert.ok(res.groupId.startsWith('group#'));
    assert.ok(res.filterId.startsWith('skslFilter#'));

    // Check parented layers
    assert.equal(scene.getParent(l1), res.groupId);
    assert.equal(scene.getParent(l2), res.groupId);

    // Check filter connected to group's filters port
    const filterConn = scene.connections.find(c => c.srcId === res.filterId && c.dstId === res.groupId && c.dstPort === 'filters');
    assert.ok(filterConn, 'Filter must connect to group filters port');
});

test('Adjustment Layer — Empty selection wraps existing comp layers', () => {
    const impl = fs.readFileSync(path.join(EFFECT_DIR, 'implementation.js'), 'utf8');
    const scene = new MockScene();
    const l1 = scene.primitive('rectangle', 'Existing Layer 1');
    scene.select([]); // Deselect

    const sandbox = { api: scene, console: console };
    vm.createContext(sandbox);
    const res = vm.runInContext(impl, sandbox);

    assert.equal(res.ok, true);
    assert.equal(res.code, 'SUCCESS');
    assert.equal(res.groupedCount, 1);
    assert.equal(scene.getParent(l1), res.groupId);
});

test('Adjustment Layer — Fault injection: group creation failure', () => {
    const impl = fs.readFileSync(path.join(EFFECT_DIR, 'implementation.js'), 'utf8');
    const scene = new MockScene();
    scene.create = () => null; // Simulate creation failure

    const sandbox = { api: scene, console: console };
    vm.createContext(sandbox);
    const res = vm.runInContext(impl, sandbox);

    assert.equal(res.ok, false);
    assert.equal(res.code, 'GROUP_CREATION_FAILED');
    assert.equal(res.appliedCount, 0);
});
