import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PANEL_PATH = path.join(ROOT, 'cavalry-script', 'AE Effects.js');

/**
 * Extracts and evaluates the generated panel's shared helper runtime and the
 * BUNDLED_RUNNERS table, so every bundled effect runner can be executed directly.
 */
function loadBundledRunners(panelCode) {
    const sharedMatch = panelCode.match(/var __AE_SHARED__ = \(function \(\) \{([\s\S]*?)\}\)\(\);/);
    assert.ok(sharedMatch, 'Generated panel must contain the __AE_SHARED__ runtime block');
    const shared = vm.runInNewContext('(function () {' + sharedMatch[1] + '})();', {}, { timeout: 5000 });

    const runnersMatch = panelCode.match(/var BUNDLED_RUNNERS = \{([\s\S]*?)\n    \};/);
    assert.ok(runnersMatch, 'Generated panel must contain a BUNDLED_RUNNERS table');
    const runners = new Function('__AE_SHARED__', 'return {' + runnersMatch[1] + '};')(shared);
    return { shared, runners };
}

/**
 * Permissive Cavalry api mock: implements the commonly probed surface with
 * plausible returns and falls back to recording no-op functions for anything
 * else, so every runner's happy path can execute without throwing.
 */
function makePermissiveApi() {
    const nodes = new Map();
    const connections = [];
    const customNames = {};
    const keyframes = [];
    let seq = 0;
    let selection = ['basicShape#1'];

    const base = {
        getSelection: () => selection.slice(),
        select: (ids) => { selection = Array.isArray(ids) ? ids.slice() : []; },
        getNiceName: (id) => 'Layer ' + id,
        getLayerType: (id) => (nodes.get(id) || {}).type || 'basicShape',
        getAllLayerTypes: () => ['basicShape', 'textShape', 'group', 'null', 'skslFilter', 'javaScriptDeformer'],
        create: (type) => {
            const id = `${type}#${++seq}`;
            nodes.set(id, {
                type,
                attrs: type === 'skslFilter' ? { code: '', padding: { x: 0, y: 0 }, inputs: null, 'inputs.0': 0 } : {},
                dyn: 1,
            });
            return id;
        },
        deleteLayer: (id) => { nodes.delete(id); },
        set: (id, payload) => {
            const node = nodes.get(id);
            if (node) Object.assign(node.attrs, payload);
            return true;
        },
        get: (id, attr) => (nodes.get(id) || { attrs: {} }).attrs[attr],
        getAttributes: (id) => {
            const node = nodes.get(id);
            if (!node) return [];
            return Object.keys(node.attrs).filter((k) => !/^inputs\.\d+$/.test(k));
        },
        getCustomAttributeName: (id, slot) => customNames[`${id}:${slot}`] || '',
        renameAttribute: (id, slot, name) => { customNames[`${id}:${slot}`] = name; return true; },
        addDynamic: (id, group) => {
            const node = nodes.get(id);
            if (!node) return null;
            let idx = 0;
            while (Object.keys(node.attrs).includes(`${group}.${idx}`)) idx++;
            const slot = `${group}.${idx}`;
            node.attrs[slot] = 0;
            return slot;
        },
        connect: (srcId, srcAttr, dstId, dstAttr) => {
            connections.push({ srcId, srcAttr, dstId, dstAttr });
            return true;
        },
        addFilter: (targetId, filterId) => {
            connections.push({ srcId: filterId, srcAttr: 'id', dstId: targetId, dstAttr: 'filters' });
            return true;
        },
        getInConnection: (id, attr) => {
            const c = connections.find((x) => x.dstId === id && x.dstAttr.split('.')[0] === String(attr).split('.')[0]);
            return c ? `${c.srcId}.${c.srcAttr}` : '';
        },
        getOutConnections: () => connections.map((c) => `${c.srcId}.${c.srcAttr} -> ${c.dstId}.${c.dstAttr}`),
        getCompLayers: () => [...nodes.keys()],
        keyframe: (id, frame, props) => { keyframes.push({ id, frame, props }); return true; },
        startUndoGroup: () => true,
        endUndoGroup: () => true,
        setValue: (id, attr, v) => {
            const node = nodes.get(id);
            if (node) node.attrs[attr] = v;
            return true;
        },
    };

    const calledUnknown = new Set();
    return {
        api: new Proxy(base, {
            get(target, prop) {
                if (prop in target) return target[prop];
                calledUnknown.add(String(prop));
                return () => undefined;
            },
        }),
        nodes,
        connections,
        calledUnknown,
    };
}

test('Bundled runners — generated panel exposes one runner per bundled effect', () => {
    const panelCode = fs.readFileSync(PANEL_PATH, 'utf8');
    const { runners } = loadBundledRunners(panelCode);
    const catalogMatch = panelCode.match(/var BUNDLED_EFFECTS = (\[[\s\S]*?\]);/);
    assert.ok(catalogMatch, 'Generated panel must contain the BUNDLED_EFFECTS catalog');
    const catalog = JSON.parse(catalogMatch[1]);

    assert.equal(Object.keys(runners).length, catalog.length);
    for (const item of catalog) {
        assert.equal(typeof runners[item.slug], 'function', `Missing runner for ${item.slug}`);
    }
});

test('Bundled runners — every effect runner executes against a permissive mock api', () => {
    const panelCode = fs.readFileSync(PANEL_PATH, 'utf8');
    const { runners } = loadBundledRunners(panelCode);

    const results = {};
    const prevApi = globalThis.api;
    for (const [slug, runner] of Object.entries(runners)) {
        const h = makePermissiveApi();
        globalThis.api = h.api;
        let res;
        assert.doesNotThrow(() => {
            res = runner({ mode: 'auto', params: {} });
        }, `Runner for "${slug}" threw`);
        results[slug] = res && typeof res === 'object' ? (res.ok === false ? 'reported-error' : 'ok') : 'no-result';
    }
    if (prevApi === undefined) delete globalThis.api; else globalThis.api = prevApi;

    // Runners must return structured results (not throw) even when the mock api is
    // minimal; effects that need richer selection context may report ok:false.
    const threw = Object.entries(results).filter(([, v]) => v === 'no-result');
    assert.deepEqual(threw, [], `Runners that returned no structured result: ${threw.map(([s]) => s).join(', ')}`);
});
