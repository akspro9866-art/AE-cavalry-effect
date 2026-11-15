/**
 * AST → Cavalry node graph lowering (`scripts/lib/lower-to-nodes.mjs`).
 *
 * Recognised temporal/index expressions lower into WIRED procedural node
 * graphs instead of per-frame baked expressions:
 *
 *   wiggle(freq, amp[, octaves])              → `noise` behaviour node(s)
 *                                               (multi-dimensional amplitude
 *                                               fans out one noise per axis)
 *   valueAtTime(time − index·delay)           → `stagger` / index-offset node
 *                                               driven by the parsed delay
 *   linear(t, a, b, c, d) / ease*(...)        → `value2` Value-Remap node
 *                                               (in/out min/max wiring)
 *
 * Anything the lowering cannot express falls back to the per-frame baked
 * expression (the historical javaScriptModifier route) and is REPORTED, so
 * callers can see exactly what was baked vs wired. The node vocabulary is the
 * verified Cavalry 2.8.0 set from `references/cavalry-api.md`: noise,
 * oscillator, value, value2, valueBlend, spring, stagger, falloff, localTime.
 */

import { parseExpression, walkAst, programTailExpression, SyntaxError } from './expression-ast.mjs';

export const LOWERING_VERSION = 1;

/** Cavalry 2.8.0 layer attributes the graph can drive by default. */
const DEFAULT_TARGET_ATTRIBUTES = ['position', 'rotation', 'opacity', 'scale'];

let nodeCounter = 0;
function resetCounter() {
    nodeCounter = 0;
}
function nextNodeId(prefix) {
    nodeCounter += 1;
    return `${prefix}_${nodeCounter}`;
}

/** Best-effort static evaluation of an AST subtree with numeric bindings. */
function evaluate(node, bindings) {
    if (!node) return undefined;
    switch (node.type) {
        case 'Literal': return node.value;
        case 'Identifier': {
            if (node.name === 'time') return bindings.time;
            if (node.name === 'index') return bindings.index;
            return bindings[node.name];
        }
        case 'ArrayExpression': return node.elements.map((element) => evaluate(element, bindings));
        case 'UnaryExpression': {
            const value = evaluate(node.argument, bindings);
            if (node.operator === '-') return typeof value === 'number' ? -value : undefined;
            if (node.operator === '+') return value;
            if (node.operator === '!') return !value;
            return undefined;
        }
        case 'BinaryExpression': {
            const left = evaluate(node.left, bindings);
            const right = evaluate(node.right, bindings);
            if (typeof left === 'number' && typeof right === 'number') {
                switch (node.operator) {
                    case '+': return left + right;
                    case '-': return left - right;
                    case '*': return left * right;
                    case '/': return right !== 0 ? left / right : undefined;
                    case '%': return left % right;
                    default: return undefined;
                }
            }
            if (typeof left === 'string' && typeof right === 'string' && node.operator === '+') return left + right;
            return undefined;
        }
        default: return undefined;
    }
}

/** Render an AST subtree back to compact expression source (for baked output). */
function renderSource(node) {
    switch (node.type) {
        case 'Literal': return typeof node.value === 'string' ? JSON.stringify(node.value) : String(node.value);
        case 'Identifier': return node.name;
        case 'ArrayExpression': return `[${node.elements.map(renderSource).join(', ')}]`;
        case 'UnaryExpression': return `${node.operator}${renderSource(node.argument)}`;
        case 'BinaryExpression': return `${renderSource(node.left)} ${node.operator} ${renderSource(node.right)}`;
        case 'LogicalExpression': return `${renderSource(node.left)} ${node.operator} ${renderSource(node.right)}`;
        case 'ConditionalExpression': return `${renderSource(node.test)} ? ${renderSource(node.consequent)} : ${renderSource(node.alternate)}`;
        case 'MemberExpression': return `${renderSource(node.object)}.${node.property}`;
        case 'IndexExpression': return `${renderSource(node.object)}[${renderSource(node.index)}]`;
        case 'CallExpression': return `${renderSource(node.callee)}(${node.arguments.map(renderSource).join(', ')})`;
        default: return `<${node.type}>`;
    }
}

/** True when the callee is a bare identifier with this name. */
function isCall(node, name) {
    return node && node.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name === name;
}

/**
 * Recognise `time − index·delay` (and trivial variants) for the stagger
 * lowering: returns the delay AST node or null.
 */
function matchIndexOffset(argument) {
    if (!argument || argument.type !== 'BinaryExpression' || argument.operator !== '-') return null;
    const { left, right } = argument;
    if (!(left.type === 'Identifier' && left.name === 'time')) return null;
    if (right.type !== 'BinaryExpression' || right.operator !== '*') return null;
    const hasIndex = [right.left, right.right].some((operand) => operand.type === 'Identifier' && operand.name === 'index');
    if (!hasIndex) return null;
    const delay = right.left.type === 'Identifier' && right.left.name === 'index' ? right.right : right.left;
    return delay;
}

/**
 * Lower a parsed program into a Cavalry node graph.
 *
 * @param {string} source    the AE expression source
 * @param {object} [options]
 * @param {string} [options.targetAttribute='position'] attribute the graph drives
 * @param {string} [options.layerId]     layer the graph is built for
 * @param {number} [options.seed=1]      deterministic noise seed
 * @returns {{
 *   target: string, nodes: Array, connections: Array,
 *   baked: Array<{ expression: string, reason: string }>,
 *   wired: Array<{ kind: string, detail: object }>, loweredFully: boolean
 * }}
 */
export function lowerExpressionToNodes(source, options = {}) {
    const targetAttribute = options.targetAttribute ?? 'position';
    const seed = Number.isFinite(options.seed) ? Math.round(options.seed) : 1;
    resetCounter();

    const program = parseExpression(source);
    const nodes = [];
    const connections = [];
    const baked = [];
    const wired = [];
    const handled = new Set();

    const tail = programTailExpression(program);

    /** Lower `wiggle(freq, amp[, octaves])` into noise node(s). */
    function lowerWiggle(call) {
        const [freqNode, ampNode, octavesNode] = call.arguments;
        const frequency = evaluate(freqNode, {});
        const amplitude = evaluate(ampNode, {});
        if (!Number.isFinite(frequency) || amplitude === undefined) return false;
        const octaves = evaluate(octavesNode, {});
        const isVector = Array.isArray(amplitude);
        const axes = isVector && targetAttribute === 'position' ? ['x', 'y'] : ['x'];

        const nodeIds = [];
        for (let i = 0; i < axes.length; i++) {
            const id = nextNodeId('noise');
            const amp = isVector ? (amplitude[i] ?? amplitude[0]) : amplitude;
            nodes.push({
                id,
                type: 'noise',
                name: `wiggle_${targetAttribute}_${axes[i]}`,
                attrs: {
                    'generator.frequency': frequency,
                    strength: amp,
                    'generator.seed': seed + i,
                    ...(Number.isFinite(Number(octaves)) ? { 'generator.octaves': Math.round(Number(octaves)) } : {}),
                    'generator.timeScale': 1,
                },
            });
            connections.push({ attrPath: targetAttribute === 'position' ? `position.${axes[i]}` : targetAttribute, from: id });
            nodeIds.push(id);
        }
        handled.add(call);
        wired.push({ kind: 'wiggle', detail: { frequency, amplitude, nodes: nodeIds } });
        return true;
    }

    /** Lower `valueAtTime(time − index·delay)` into a stagger/index-offset node. */
    function lowerValueAtTime(call) {
        const [argument] = call.arguments;
        if (argument && argument.type === 'Identifier' && argument.name === 'time') {
            // valueAtTime(time) is the identity — nothing to lower.
            handled.add(call);
            wired.push({ kind: 'valueAtTime-identity', detail: {} });
            return true;
        }
        const delay = matchIndexOffset(argument);
        if (!delay) return false;
        const delayValue = evaluate(delay, {});
        const id = nextNodeId('stagger');
        nodes.push({
            id,
            type: 'stagger',
            name: `index_offset_${targetAttribute}`,
            attrs: {
                ...(Number.isFinite(delayValue) ? { offsetFrames: delayValue } : {}),
                lagFrames: Number.isFinite(delayValue) ? delayValue : 4,
            },
            ...(Number.isFinite(delayValue) ? {} : { delayExpression: renderSource(delay) }),
        });
        connections.push({ attrPath: targetAttribute, from: id, kind: 'index-offset' });
        handled.add(call);
        handled.add(argument);
        wired.push({ kind: 'stagger', detail: { delay: delayValue ?? renderSource(delay), nodes: [id] } });
        return true;
    }

    /** Lower `linear/ease/easeIn/easeOut(...)` into a Value-Remap (value2) node. */
    function lowerRemap(call) {
        const name = call.callee.name;
        const args = call.arguments;
        // linear(t, tMin, tMax, value1, value2[, eased])
        if (args.length < 5) return false;
        const tNode = args[0];
        const tMin = evaluate(args[1], {});
        const tMax = evaluate(args[2], {});
        const outMin = evaluate(args[3], {});
        const outMax = evaluate(args[4], {});
        if (tMin === undefined || tMax === undefined || outMin === undefined || outMax === undefined) return false;
        // The remap input must be a known driver (time/index) to wire procedurally.
        const driver = tNode.type === 'Identifier' && (tNode.name === 'time' || tNode.name === 'index') ? tNode.name : null;
        if (!driver) return false;
        const id = nextNodeId('value2');
        nodes.push({
            id,
            type: 'value2',
            name: `${name}_remap_${targetAttribute}`,
            attrs: {
                inMin: tMin,
                inMax: tMax,
                outMin: outMin,
                outMax: outMax,
                ...(name === 'ease' || name === 'easeIn' ? { easing: 'SlowIn' } : {}),
                ...(name === 'easeOut' ? { easing: 'SlowOut' } : {}),
            },
            driver,
        });
        connections.push({ attrPath: targetAttribute, from: id, kind: 'value-remap' });
        handled.add(call);
        wired.push({ kind: 'value-remap', detail: { driver, tMin, tMax, outMin, outMax, nodes: [id] } });
        return true;
    }

    // Walk the whole program and lower every recognised temporal/index call.
    walkAst(tail ?? program, (node) => {
        if (node.type !== 'CallExpression') return;
        if (handled.has(node)) return;
        if (isCall(node, 'wiggle')) {
            if (!lowerWiggle(node)) baked.push({ expression: renderSource(node), reason: 'wiggle arguments are not static' });
        } else if (isCall(node, 'valueAtTime')) {
            if (!lowerValueAtTime(node)) baked.push({ expression: renderSource(node), reason: 'valueAtTime argument is not a recognised time − index·delay pattern' });
        } else if (['linear', 'ease', 'easeIn', 'easeOut'].includes(node.callee?.name)) {
            if (!lowerRemap(node)) baked.push({ expression: renderSource(node), reason: 'remap arguments are not statically evaluable or the driver is not time/index' });
        }
    });

    // Whatever survived lowering stays as the baked residual expression.
    const residual = renderSource(tail ?? program);
    const loweredFully = handled.size > 0 && baked.length === 0;
    return {
        target: targetAttribute,
        layerId: options.layerId ?? null,
        nodes,
        connections,
        baked: baked.length ? [{ expression: residual, reason: baked.map((b) => `${b.expression}: ${b.reason}`).join('; ') }] : [],
        wired,
        loweredFully,
        version: LOWERING_VERSION,
    };
}

/**
 * Translate an AE expression with an explicit output target.
 *
 * @param {string} source
 * @param {object} [options]  { targetAttribute, layerId, seed,
 *   target: 'node-graph' | 'mg-iife' | 'baked' }
 */
export async function translateExpression(source, options = {}) {
    const target = options.target ?? 'node-graph';
    const graph = lowerExpressionToNodes(source, options);
    if (target === 'baked') {
        return { target, expression: graph.baked.length ? graph.baked[0].expression : source, graph };
    }
    if (target === 'mg-iife') {
        const { buildMgIife } = await import('./mg-iife-codegen.mjs');
        const emission = buildMgIife(graph, options);
        return { target, ...emission, graph };
    }
    return { target: 'node-graph', nodeGraph: graph, graph };
}

export { SyntaxError };
