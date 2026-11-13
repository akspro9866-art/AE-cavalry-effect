import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EFFECT_DIR = path.join(ROOT, 'effects', 'pre-compose');

test('Pre-Compose — Selection validation & mock preCompose execution', () => {
    const implPath = path.join(EFFECT_DIR, 'implementation.js');
    const pmapPath = path.join(EFFECT_DIR, 'parameter-map.json');

    assert.ok(fs.existsSync(implPath));
    assert.ok(fs.existsSync(pmapPath));

    const impl = fs.readFileSync(implPath, 'utf8');

    class MockScene {
        constructor() {
            this.nodes = new Map();
            this.selection = [];
            this.counter = 0;
            const comp = { id: 'compNode#1', name: 'Composition 1' };
            this.nodes.set(comp.id, comp);
            this.activeComp = comp;
        }

        getActiveComp() { return this.activeComp.id; }
        getComps() { return [this.activeComp.id]; }
        getSelection() { return [...this.selection]; }
        select(ids) { this.selection = [...ids]; }
        getNiceName(id) { return this.nodes.get(id)?.name || id; }

        primitive(type, name) {
            const id = `${type}#${++this.counter}`;
            this.nodes.set(id, { id, type, name });
            return id;
        }

        preCompose(layerIds, name) {
            const id = `compositionReference#${++this.counter}`;
            this.nodes.set(id, { id, type: 'compositionReference', name, packagedLayers: layerIds });
            return id;
        }
    }

    const scene = new MockScene();

    // Test 1: Empty selection guard
    const sandbox1 = { api: scene, console: console };
    vm.createContext(sandbox1);
    const errRes = vm.runInContext(impl, sandbox1);
    assert.equal(errRes.ok, false);
    assert.ok(errRes.error.includes('No layer selected'));

    // Test 2: Active selection pre-composition
    const r1 = scene.primitive('rectangle', 'Child 1');
    const r2 = scene.primitive('rectangle', 'Child 2');
    scene.select([r1, r2]);

    const sandbox2 = { api: scene, console: console };
    vm.createContext(sandbox2);
    const okRes = vm.runInContext(impl, sandbox2);

    assert.equal(okRes.ok, true);
    assert.equal(okRes.workflow, 'Pre-Compose');
    assert.equal(okRes.packagedCount, 2);
    assert.ok(okRes.preCompId.startsWith('compositionReference#'));
    assert.deepEqual(scene.getSelection(), [okRes.preCompId]);
});
