/**
 * AE expression → Cavalry node graph translator tests (Tier 1/3) — run with `npm test`.
 *
 * Covers the deep AST temporal/index lowering: multi-dimensional wiggle() →
 * Noise behaviour nodes, valueAtTime(time − index·delay) → Stagger /
 * index-offset, linear()/ease() → Value Remap (value2), the mg-iife codegen
 * target, and the Tier 3 mock execution of an emitted IIFE.
 */

import test from 'node:test';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { tokenize, parseExpression, walkAst, SyntaxError } from '../scripts/lib/expression-ast.mjs';
import { lowerExpressionToNodes, translateExpression } from '../scripts/lib/lower-to-nodes.mjs';
import { buildMgIife } from '../scripts/lib/mg-iife-codegen.mjs';
import { createMockCavalry } from './lib/mock-cavalry.mjs';

test('the parser handles calls, arrays, member access and operators', () => {
    const program = parseExpression('wiggle(2, 40) + linear(time, 0, 1, [100, 100], [500, 500]) - Math.PI');
    assert.equal(program.type, 'Program');
    assert.equal(program.body.length, 1);
    const tail = program.body[0];
    assert.equal(tail.type, 'ExpressionStatement');
    assert.equal(tail.expression.type, 'BinaryExpression');
    assert.equal(tail.expression.operator, '-');

    const tokens = tokenize('valueAtTime(time - index * 5)');
    assert.deepEqual(tokens.filter((t) => t.type === 'identifier').map((t) => t.value), ['valueAtTime', 'time', 'index']);
});

test('syntax errors carry offsets', () => {
    assert.throws(() => parseExpression('wiggle(2,'), SyntaxError);
});

test('wiggle lowers into wired Noise behaviour nodes', () => {
    const graph = lowerExpressionToNodes('wiggle(2, 40)', { targetAttribute: 'position', seed: 5 });
    assert.equal(graph.loweredFully, true);
    assert.equal(graph.baked.length, 0);
    assert.equal(graph.nodes.length, 1);
    const noise = graph.nodes[0];
    assert.equal(noise.type, 'noise');
    assert.equal(noise.attrs['generator.frequency'], 2);
    assert.equal(noise.attrs.strength, 40);
    assert.equal(noise.attrs['generator.seed'], 5);
    assert.deepEqual(graph.connections, [{ attrPath: 'position.x', from: noise.id }]);
    assert.equal(graph.wired[0].kind, 'wiggle');
});

test('multi-dimensional wiggle fans out one noise node per axis', () => {
    const graph = lowerExpressionToNodes('wiggle(3, [25, 60])', { targetAttribute: 'position', seed: 1 });
    assert.equal(graph.nodes.length, 2, 'x and y each get a noise node');
    const [noiseX, noiseY] = graph.nodes;
    assert.equal(noiseX.type, 'noise');
    assert.equal(noiseX.attrs.strength, 25);
    assert.equal(noiseY.attrs.strength, 60);
    assert.deepEqual(graph.connections.map((c) => c.attrPath), ['position.x', 'position.y']);
    // Deterministic per-axis seeds.
    assert.equal(noiseY.attrs['generator.seed'], noiseX.attrs['generator.seed'] + 1);
});

test('valueAtTime(time - index * delay) lowers into a Stagger / index-offset node', () => {
    const graph = lowerExpressionToNodes('valueAtTime(time - index * 5)', { targetAttribute: 'position' });
    assert.equal(graph.nodes.length, 1);
    const stagger = graph.nodes[0];
    assert.equal(stagger.type, 'stagger');
    assert.equal(stagger.attrs.offsetFrames, 5);
    assert.equal(stagger.attrs.lagFrames, 5);
    assert.deepEqual(graph.connections, [{ attrPath: 'position', from: stagger.id, kind: 'index-offset' }]);
    assert.equal(graph.loweredFully, true);
});

test('valueAtTime with an unrecognised argument stays baked', () => {
    const graph = lowerExpressionToNodes('valueAtTime(time - thisComp.layer("other").transform.position[1])', { targetAttribute: 'position' });
    assert.equal(graph.nodes.length, 0);
    assert.equal(graph.baked.length, 1);
    assert.match(graph.baked[0].reason, /not a recognised time/);
});

test('linear() and ease() lower into Value Remap (value2) node graphs', () => {
    const linear = lowerExpressionToNodes('linear(time, 0, 2, 100, 500)', { targetAttribute: 'rotation' });
    assert.equal(linear.nodes.length, 1);
    const remap = linear.nodes[0];
    assert.equal(remap.type, 'value2');
    assert.equal(remap.attrs.inMin, 0);
    assert.equal(remap.attrs.inMax, 2);
    assert.equal(remap.attrs.outMin, 100);
    assert.equal(remap.attrs.outMax, 500);
    assert.equal(remap.driver, 'time');
    assert.deepEqual(linear.connections, [{ attrPath: 'rotation', from: remap.id, kind: 'value-remap' }]);

    const eased = lowerExpressionToNodes('ease(time, 0, 2, 100, 500)', { targetAttribute: 'opacity' });
    assert.equal(eased.nodes[0].attrs.easing, 'SlowIn', 'ease() defaults to a slow-in curve');
    const easeOut = lowerExpressionToNodes('easeOut(time, 0, 2, 100, 500)', { targetAttribute: 'opacity' });
    assert.equal(easeOut.nodes[0].attrs.easing, 'SlowOut');
});

test('mixed expressions lower the recognised calls and bake the residual', () => {
    const graph = lowerExpressionToNodes('wiggle(2, 40) + linear(time, 0, 1, 0, 50)', { targetAttribute: 'position' });
    assert.equal(graph.nodes.length, 2, 'one noise + one value2');
    assert.deepEqual(graph.nodes.map((n) => n.type), ['noise', 'value2']);
    assert.equal(graph.baked.length, 0);
    assert.equal(graph.wired.length, 2);
});

test('buildMgIife emits a self-contained single-shot _mg IIFE alongside the node graph', () => {
    const graph = lowerExpressionToNodes('wiggle(2, [20, 45])', { targetAttribute: 'position', layerId: 'shape#3', seed: 2 });
    const emission = buildMgIife(graph, { layerId: 'shape#3' });
    assert.match(emission.script, /\/\* cavalry-mcp:atomic \*\//, 'the block is single-shot over the Stallion bridge');
    assert.match(emission.script, /_mg\.layer/, 'it builds nodes through the _mg prelude');
    assert.match(emission.script, /api\.connect\(from, "id", __target, link\.attrPath\)/, 'it wires the graph to the target layer');
    assert.match(emission.script, /"layerId":"shape#3"/, 'the rig document carries the target layer');
    assert.equal(emission.nodeGraph.nodes.length, 2);
    assert.equal(emission.scriptId, emission.nodeGraph.scriptId);
    // Deterministic: same graph -> same script bytes.
    const again = buildMgIife(lowerExpressionToNodes('wiggle(2, [20, 45])', { targetAttribute: 'position', layerId: 'shape#3', seed: 2 }), { layerId: 'shape#3' });
    assert.equal(again.script, emission.script);
});

test('the emitted mg-iife executes against the Tier 3 mock and wires the rig', () => {
    const graph = lowerExpressionToNodes('wiggle(2, [20, 45]) + valueAtTime(time - index * 5)', { targetAttribute: 'position', layerId: 'shape_1', seed: 2 });
    const emission = buildMgIife(graph, { layerId: 'shape_1' });

    const mock = createMockCavalry({ initialAttrs: ['position', 'position.x', 'position.y'] });
    // A target layer the rig drives, mirroring a real Cavalry selection.
    const targetId = 'shape_1';
    mock.createdNodes.push({ id: targetId, type: 'basicShape' });
    mock.nodeAttributes[targetId] = ['position', 'position.x', 'position.y'];

    // The emitted script prefers _mg.layer; run it with a _mg shim over the mock.
    const created = [];
    const mgShim = {
        layer: (type, name) => {
            const id = mock.api.create(type);
            mock.api.setName(id, name);
            created.push(id);
            return id;
        },
    };
    // The bridge captures the trailing IIFE's value as the script's completion
    // value; vm.runInNewContext mirrors that exactly (new Function would hit
    // ASI: `return` followed by the header comments terminates the statement).
    const result = vm.runInNewContext(emission.script, { _mg: mgShim, api: mock.api });

    assert.equal(result.attr, 'position');
    assert.ok(Object.keys(result.nodes).length >= 3, 'noise x, noise y and stagger nodes are created');
    assert.ok(mock.connections.length >= 3, 'every behaviour node is connected to the target');
    assert.ok(created.length >= 3, 'the _mg prelude route created the nodes');
    assert.equal(result.baked.length, 0, 'nothing was baked — the whole expression is wired');
});

test('translateExpression dispatches on the target flag', async () => {
    const nodeGraph = await translateExpression('wiggle(2, 40)', { target: 'node-graph' });
    assert.equal(nodeGraph.target, 'node-graph');
    assert.ok(nodeGraph.nodeGraph.nodes.length === 1);

    const iife = await translateExpression('wiggle(2, 40)', { target: 'mg-iife', layerId: 'shape#9' });
    assert.equal(iife.target, 'mg-iife');
    assert.match(iife.script, /_mg\.layer/);
    assert.equal(iife.nodeGraph.layerId, 'shape#9');

    const baked = await translateExpression('wiggle(2, 40)', { target: 'baked' });
    assert.equal(baked.target, 'baked');
    assert.ok(baked.expression.includes('wiggle(2, 40)'));
});

test('walkAst visits every call site in compound programs', () => {
    const program = parseExpression('var offset = index * 5; valueAtTime(time - offset)');
    const calls = [];
    walkAst(program, (node) => {
        if (node.type === 'CallExpression') calls.push(node.callee.name);
    });
    assert.deepEqual(calls, ['valueAtTime']);
});
