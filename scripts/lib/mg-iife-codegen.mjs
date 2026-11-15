/**
 * `_mg` IIFE codegen target (`scripts/lib/mg-iife-codegen.mjs`).
 *
 * Emits a SELF-CONTAINED, single-shot IIFE block that builds the lowered node
 * graph in Cavalry 2.8.0 through the `_mg` prelude helpers — with a plain
 * `api.*` fallback when the prelude is absent — so refclone and cavalry-mcp
 * can inject translated After Effects rigs directly over the Stallion bridge
 * (POST /post with `{ type: 'script', helpers: true }`). The raw node graph
 * JSON rides along as a `__aeRig` document so downstream tools can inspect or
 * re-wire the graph without re-parsing the script.
 */

import { toForwardSlashes } from './config.mjs';

/**
 * Build the IIFE emission for a lowered graph.
 *
 * @param {object} graph   lowerExpressionToNodes output
 * @param {object} [options] { layerId, targetAttribute, scriptId }
 * @returns {{ script: string, nodeGraph: object, scriptId: string }}
 */
export function buildMgIife(graph, options = {}) {
    const targetAttribute = graph.target ?? options.targetAttribute ?? 'position';
    const layerRef = options.layerId ?? graph.layerId ?? null;
    const scriptId = options.scriptId ?? `ae-rig-${Math.abs(hashSource(JSON.stringify(graph))) % 100000}`;
    const nodeGraph = {
        version: 1,
        scriptId,
        target: targetAttribute,
        layerId: layerRef,
        nodes: graph.nodes,
        connections: graph.connections,
        baked: graph.baked,
    };

    const lines = [];
    lines.push(`/* AE expression rig (${scriptId}) — emitted by AE-cavalry-effect lower-to-nodes v${graph.version ?? 1}; target ${targetAttribute} */`);
    lines.push('/* cavalry-mcp:atomic */');
    lines.push('(() => {');
    lines.push('  var __rig = ' + JSON.stringify(nodeGraph) + ';');
    lines.push('  var __target = ' + JSON.stringify(layerRef) + ';');
    lines.push('  var __attr = ' + JSON.stringify(targetAttribute) + ';');
    lines.push('  var __created = {};');
    lines.push('  var __useMg = (typeof _mg === "object" && _mg != null);');
    lines.push('  var __mk = function (node) {');
    lines.push('    var id;');
    lines.push('    if (__useMg && typeof _mg.layer === "function") {');
    lines.push('      id = _mg.layer(node.type, node.name);');
    lines.push('    } else {');
    lines.push('      id = api.create(node.type, node.name);');
    lines.push('    }');
    lines.push('    if (node.attrs) {');
    lines.push('      var keys = Object.keys(node.attrs);');
    lines.push('      var payload = {};');
    lines.push('      for (var k = 0; k < keys.length; k++) payload[keys[k]] = node.attrs[keys[k]];');
    lines.push('      api.set(id, payload);');
    lines.push('    }');
    lines.push('    __created[node.id] = id;');
    lines.push('    return id;');
    lines.push('  };');
    lines.push('  for (var i = 0; i < __rig.nodes.length; i++) __mk(__rig.nodes[i]);');
    lines.push('  for (var c = 0; c < __rig.connections.length; c++) {');
    lines.push('    var link = __rig.connections[c];');
    lines.push('    var from = __created[link.from];');
    lines.push('    if (!from || !__target) continue;');
    lines.push('    try { api.connect(from, "id", __target, link.attrPath); } catch (e) {}');
    lines.push('  }');
    lines.push('  return { scriptId: ' + JSON.stringify(scriptId) + ', attr: __attr, nodes: __created, baked: ' + JSON.stringify(graph.baked.map((entry) => entry.expression)) + ' };');
    lines.push('})()');

    return {
        script: lines.join('\n'),
        nodeGraph,
        scriptId,
    };
}

/** FNV-1a 32-bit over the graph JSON — stable script ids without deps. */
function hashSource(source) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < source.length; i++) {
        hash = Math.imul((hash ^ source.charCodeAt(i)) >>> 0, 0x01000193) >>> 0;
    }
    return hash | 0;
}

/** POSIX-normalised helper for callers that record emitted files. */
export function normalizeEmittedPath(p) {
    return toForwardSlashes(p);
}
