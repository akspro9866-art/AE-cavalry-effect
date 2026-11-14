/**
 * Shared Tier 3 mock harness: a single canonical Cavalry `api` mock used by the
 * per-effect applicator tests.
 *
 * Background: effect tests originally contained ~30 hand-rolled copies of this mock
 * in two divergent dialects. This module is the single source of truth; new tests
 * must use it instead of defining inline mocks.
 *
 * Behavior contract (mirrors what Tier 3 needs to assert):
 * - `create(type)` registers a node with a deterministic `${type}_${n}` id and a
 *   configurable initial attribute list (`initialAttrs`).
 * - `set(id, payload)` records each value under a `_val_<attr>` key on the node's
 *   attribute list, so tests can assert *values*, not just attribute names.
 * - `addDynamic(id, group, type)` allocates the lowest free `<group>.N` slot.
 * - `connect(...)` records every connection in `connections` for graph assertions.
 */

/**
 * Creates a fresh mock Cavalry API scene.
 * @param {{ initialAttrs?: string[] }} [opts] Attributes present on created nodes.
 */
export function createMockCavalry({ initialAttrs = ['code'] } = {}) {
    const createdNodes = [];
    const nodeAttributes = {};
    const customNames = {};
    const connections = [];

    const api = {
        create: (type) => {
            const id = `${type}_${createdNodes.length + 1}`;
            createdNodes.push({ id, type });
            nodeAttributes[id] = initialAttrs.slice();
            return id;
        },
        setName: (id, name) => {},
        set: (id, payload) => {
            for (const [k, v] of Object.entries(payload)) {
                if (!nodeAttributes[id].includes(k)) {
                    nodeAttributes[id].push(k);
                }
                nodeAttributes[id][`_val_${k}`] = v;
            }
            return true;
        },
        getAttributes: (id) => nodeAttributes[id] || [],
        addDynamic: (id, group, type) => {
            let idx = 0;
            while (nodeAttributes[id].includes(`${group}.${idx}`)) {
                idx++;
            }
            const slot = `${group}.${idx}`;
            nodeAttributes[id].push(slot);
            return slot;
        },
        renameAttribute: (id, slot, newName) => {
            customNames[`${id}:${slot}`] = newName;
            return true;
        },
        getCustomAttributeName: (id, slot) => {
            return customNames[`${id}:${slot}`] || '';
        },
        connect: (srcId, srcAttr, dstId, dstAttr) => {
            connections.push({ srcId, srcAttr, dstId, dstAttr });
            return true;
        }
    };

    /**
     * Returns the last value recorded for `<id>`'s attribute `<key>`, or undefined.
     */
    const attrValue = (id, key) => {
        const rec = nodeAttributes[id];
        return rec ? rec[`_val_${key}`] : undefined;
    };

    /**
     * Returns a plain `{ attr: value }` map of everything recorded for `<id>`.
     */
    const attrValues = (id) => {
        const rec = nodeAttributes[id] || {};
        const out = {};
        for (const k of Object.keys(rec)) {
            if (k.indexOf('_val_') === 0) out[k.slice(5)] = rec[k];
        }
        return out;
    };

    return { api, createdNodes, nodeAttributes, customNames, connections, attrValue, attrValues };
}
