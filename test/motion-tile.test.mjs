import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

import * as mathModel from '../effects/motion-tile/math-model.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EFFECT_DIR = path.join(ROOT, 'effects', 'motion-tile');

test('Motion Tile — Tier 1: Static validation & embedded code sync', () => {
    const skslPath = path.join(EFFECT_DIR, 'motion-tile.sksl');
    const pmapPath = path.join(EFFECT_DIR, 'parameter-map.json');
    const implPath = path.join(EFFECT_DIR, 'implementation.js');

    assert.ok(fs.existsSync(skslPath));
    assert.ok(fs.existsSync(pmapPath));
    assert.ok(fs.existsSync(implPath));

    const sksl = fs.readFileSync(skslPath, 'utf8');
    assert.ok(sksl.includes('uniform shader layer;'));
    assert.ok(sksl.includes('uniform float TileCenterX;'));
    assert.ok(sksl.includes('uniform float TileCenterY;'));
    assert.ok(sksl.includes('uniform float TileWidth;'));
    assert.ok(sksl.includes('uniform float TileHeight;'));
    assert.ok(sksl.includes('uniform float OutputWidth;'));
    assert.ok(sksl.includes('uniform float OutputHeight;'));
    assert.ok(sksl.includes('uniform float MirrorEdges;'));
    assert.ok(sksl.includes('uniform float Phase;'));
    assert.ok(sksl.includes('half4 main(float2 fragCoord)'));

    const pmap = JSON.parse(fs.readFileSync(pmapPath, 'utf8'));
    assert.equal(pmap.effectSlug, 'motion-tile');
    assert.equal(pmap.parameters.length, 8);
});

test('Motion Tile — Tier 2: Mathematical invariants (Repeat, Mirroring & Padding)', () => {
    const res = { x: 200, y: 100 };

    // 1. Center coordinate (0, 0) maps to center (0, 0)
    const c0 = mathModel.mapCoordinate({ x: 0, y: 0 }, res, {
        tileWidth: 100, tileHeight: 100, mirrorEdges: 0
    });
    assert.ok(Math.abs(c0.x) < 1e-4);
    assert.ok(Math.abs(c0.y) < 1e-4);

    // 2. Repeat edge: Coordinate at x = 250 (one tile right, offset +50)
    // with mirrorEdges = 0, should map to +50
    const cRepeat = mathModel.mapCoordinate({ x: 250, y: 0 }, res, {
        tileWidth: 100, tileHeight: 100, mirrorEdges: 0, outputWidth: 400
    });
    assert.ok(Math.abs(cRepeat.x - 50.0) < 1e-4);

    // 3. Mirror edge: Coordinate at x = 250 (in tile index 1, offset 50 px from left edge)
    // in tile 0, normalized u goes 0 to 1; in tile 1 (mirrored), fx = 1 - fx.
    // At x = 250: ux = 250/200 + 0.5 = 1.75 -> tileIdx 1, fract 0.75 -> mirrored fx = 0.25 -> (0.25 - 0.5)*200 = -50
    const cMirror = mathModel.mapCoordinate({ x: 250, y: 0 }, res, {
        tileWidth: 100, tileHeight: 100, mirrorEdges: 1, outputWidth: 400
    });
    assert.ok(Math.abs(cMirror.x - (-50.0)) < 1e-4);

    // 4. Output boundary clipping: coordinate outside outputWidth returns null
    const cClipped = mathModel.mapCoordinate({ x: 500, y: 0 }, res, {
        tileWidth: 100, tileHeight: 100, outputWidth: 200 // max x is 200 * 0.5 * 2.0 = 200
    });
    assert.equal(cClipped, null);

    // 5. Padding expansion for 300% output width
    const pad = mathModel.calculatePadding(res, { outputWidth: 300, outputHeight: 200 });
    // padX = 200 * (3 - 1) * 0.5 + 10 = 210
    // padY = 100 * (2 - 1) * 0.5 + 10 = 60
    assert.equal(pad.x, 210);
    assert.equal(pad.y, 60);
});

test('Motion Tile — Tier 3: Headless Mock Stallion execution & dynamic slots', () => {
    const implSource = fs.readFileSync(path.join(EFFECT_DIR, 'implementation.js'), 'utf8');

    const createdNodes = [];
    const nodeAttributes = {};
    const customNames = {};
    const connections = [];

    const mockApi = {
        create: (type) => {
            const id = `${type}_${createdNodes.length + 1}`;
            createdNodes.push({ id, type });
            nodeAttributes[id] = ['code', 'padding'];
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

    const ctx = {
        api: mockApi,
        module: { exports: {} },
        exports: {}
    };
    vm.createContext(ctx);
    vm.runInContext(implSource, ctx);

    const applicator = ctx.module.exports;
    assert.ok(applicator && typeof applicator.apply === 'function');

    const result = applicator.apply('target_layer_123', {
        tileWidth: 50.0,
        tileHeight: 50.0,
        outputWidth: 300.0,
        outputHeight: 300.0,
        mirrorEdges: 1,
        phase: 45.0
    });

    assert.equal(result.status, 'success');
    assert.equal(result.effect, 'motion-tile');
    assert.ok(result.nodeId);
    assert.equal(result.targetLayerId, 'target_layer_123');
    assert.equal(result.connected, true);
    assert.equal(result.codeConfigured, true);

    assert.ok(result.boundAttributes['TileCenterX']);
    assert.ok(result.boundAttributes['TileCenterY']);
    assert.ok(result.boundAttributes['TileWidth']);
    assert.ok(result.boundAttributes['TileHeight']);
    assert.ok(result.boundAttributes['OutputWidth']);
    assert.ok(result.boundAttributes['OutputHeight']);
    assert.ok(result.boundAttributes['MirrorEdges']);
    assert.ok(result.boundAttributes['Phase']);
    assert.ok(result.padding.x >= 100);
});
