/**
 * One-Action Reusable Implementation & Applicator:
 * Adobe After Effects "CC RepeTile" -> Cavalry 2.8+
 *
 * Implemented as a high-performance GPU SkSL Filter (`skslFilter`) with
 * dynamic canvas padding expansion and modular tiling math.
 */
(function () {
    /* @@BEGIN_SKSL@@ */
    var SKSL_SOURCE = "// Adobe After Effects \"CC RepeTile\" (ADBE CC RepeTile)\n// Reconstructed mathematically for Cavalry 2.8+ as a high-performance GPU SkSL Filter (`skslFilter`).\n//\n// Built-in Cavalry preamble uniforms (injected automatically by Cavalry runtime):\n//   `layer` (uniform shader) - Source layer texture sampler (layer.eval(coords))\n//   `resolution` (float2)   - Bounding dimensions in pixels (centered coordinate space)\n\nuniform shader layer;\n\n// Dynamic attribute uniforms (mapped to Cavalry `inputs.0`..`inputs.5`):\nuniform float ExpandLeft;    // Expansion distance to the left in pixels\nuniform float ExpandRight;   // Expansion distance to the right in pixels\nuniform float ExpandUp;      // Expansion distance upwards in pixels\nuniform float ExpandDown;    // Expansion distance downwards in pixels\nuniform float Tiling;        // 0=Repeat, 1=Flip, 2=Checker, 3=Brick, 4=Fold, 5=Unfold\nuniform float BlendBorders;  // Soft seam crossfading width (0.0 to 1.0)\n\nhalf4 main(float2 fragCoord) {\n    float2 res = max(resolution, float2(1.0, 1.0));\n    float2 halfRes = res * 0.5;\n\n    // Strict After Effects directional bounding box expansion check\n    // Pixels outside the specifically configured directional boundaries remain empty (alpha 0)\n    if (fragCoord.x < -halfRes.x - max(0.0, ExpandLeft) ||\n        fragCoord.x >  halfRes.x + max(0.0, ExpandRight) ||\n        fragCoord.y < -halfRes.y - max(0.0, ExpandUp) ||\n        fragCoord.y >  halfRes.y + max(0.0, ExpandDown)) {\n        return half4(0.0);\n    }\n\n    float2 uv = (fragCoord / res) + float2(0.5);\n\n    // If inside original layer bounds and no expansion active, pass through\n    if (uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0 &&\n        ExpandLeft <= 0.0 && ExpandRight <= 0.0 && ExpandUp <= 0.0 && ExpandDown <= 0.0) {\n        return layer.eval(fragCoord);\n    }\n\n    float2 mappedUv = uv;\n    float mode = floor(Tiling + 0.5);\n\n    if (mode < 0.5) {\n        // 0 = Repeat (Standard periodic tiling)\n        mappedUv = uv - floor(uv);\n    } else if (mode < 1.5) {\n        // 1 = Flip (Mirror reflection across seams - ping pong)\n        float2 k = floor(uv);\n        float2 f = uv - k;\n        float mx = mod(abs(k.x), 2.0);\n        float my = mod(abs(k.y), 2.0);\n        mappedUv.x = (mx == 0.0) ? f.x : (1.0 - f.x);\n        mappedUv.y = (my == 0.0) ? f.y : (1.0 - f.y);\n    } else if (mode < 2.5) {\n        // 2 = Checker (Alternating checkerboard tiles)\n        float2 k = floor(uv);\n        float2 f = uv - k;\n        float chk = mod(abs(k.x + k.y), 2.0);\n        mappedUv.x = (chk == 0.0) ? f.x : (1.0 - f.x);\n        mappedUv.y = (chk == 0.0) ? f.y : (1.0 - f.y);\n    } else if (mode < 3.5) {\n        // 3 = Brick (Staggered 50% horizontal offset on alternate rows)\n        float ky = floor(uv.y);\n        float shift = (mod(abs(ky), 2.0) == 0.0) ? 0.0 : 0.5;\n        float2 shifted = float2(uv.x + shift, uv.y);\n        mappedUv = shifted - floor(shifted);\n    } else if (mode < 4.5) {\n        // 4 = Fold (Symmetric inward fold)\n        mappedUv = abs(fract(uv * 0.5 + 0.5) * 2.0 - 1.0);\n    } else {\n        // 5 = Unfold (Outward unfold)\n        mappedUv = 1.0 - abs(fract(uv * 0.5) * 2.0 - 1.0);\n    }\n\n    float2 sampleCoord = (mappedUv - float2(0.5)) * res;\n    half4 color = layer.eval(sampleCoord);\n\n    // Optional seam blending\n    if (BlendBorders > 0.001) {\n        float seamW = BlendBorders * 0.12;\n        float dX = min(mappedUv.x, 1.0 - mappedUv.x);\n        float dY = min(mappedUv.y, 1.0 - mappedUv.y);\n        float edgeDist = min(dX, dY);\n        float blend = smoothstep(0.0, seamW, edgeDist);\n        color.a *= half(blend);\n    }\n\n    return color;\n}\n";
    /* @@END_SKSL@@ */

    var DEFAULTS = {
        expandLeft: 200.0,
        expandRight: 200.0,
        expandUp: 200.0,
        expandDown: 200.0,
        tiling: 1,
        blendBorders: 0.0
    };

    var TILING_MAP = {
        '0': 0, 'repeat': 0,
        '1': 1, 'flip': 1, 'ping-pong': 1, 'ping pong': 1, 'mirror': 1,
        '2': 2, 'checker': 2,
        '3': 3, 'brick': 3,
        '4': 4, 'fold': 4,
        '5': 5, 'unfold': 5
    };

    var TAG_SKSL = '[AE:CC RepeTile]';

    function safeCall(fn, fallback) {
        try {
            return fn();
        } catch (err) {
            return fallback;
        }
    }

    function clampNum(v, lo, hi, fb) {
        var n = Number(v);
        if (!isFinite(n)) return fb;
        return n < lo ? lo : (n > hi ? hi : n);
    }

    function resolveEnum(v, table, fb) {
        if (typeof v === 'number' && isFinite(v)) return Math.round(v);
        if (v === null || v === undefined) return fb;
        var key = String(v).toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
        return table.hasOwnProperty(key) ? table[key] : fb;
    }

    function normalizeParams(raw) {
        var p = raw && typeof raw === 'object' ? raw : {};
        return {
            expandLeft: clampNum(p.expandLeft !== undefined ? p.expandLeft : p.ExpandLeft, 0.0, 10000.0, DEFAULTS.expandLeft),
            expandRight: clampNum(p.expandRight !== undefined ? p.expandRight : p.ExpandRight, 0.0, 10000.0, DEFAULTS.expandRight),
            expandUp: clampNum(p.expandUp !== undefined ? p.expandUp : p.ExpandUp, 0.0, 10000.0, DEFAULTS.expandUp),
            expandDown: clampNum(p.expandDown !== undefined ? p.expandDown : p.ExpandDown, 0.0, 10000.0, DEFAULTS.expandDown),
            tiling: resolveEnum(p.tiling !== undefined ? p.tiling : p.Tiling, TILING_MAP, DEFAULTS.tiling),
            blendBorders: clampNum(p.blendBorders !== undefined ? p.blendBorders : p.BlendBorders, 0.0, 1.0, DEFAULTS.blendBorders)
        };
    }

    var PARAM_SPECS = [
        { name: 'ExpandLeft', key: 'expandLeft', type: 'double', default: DEFAULTS.expandLeft },
        { name: 'ExpandRight', key: 'expandRight', type: 'double', default: DEFAULTS.expandRight },
        { name: 'ExpandUp', key: 'expandUp', type: 'double', default: DEFAULTS.expandUp },
        { name: 'ExpandDown', key: 'expandDown', type: 'double', default: DEFAULTS.expandDown },
        { name: 'Tiling', key: 'tiling', type: 'double', default: DEFAULTS.tiling },
        { name: 'BlendBorders', key: 'blendBorders', type: 'double', default: DEFAULTS.blendBorders }
    ];

    function setAttrValue(nodeId, attrPath, val) {
        var payload = {};
        payload[attrPath] = val;
        var ok = safeCall(function () {
            api.set(nodeId, payload);
            return true;
        }, false);
        return Boolean(ok);
    }

    function bindDynamicSlot(nodeId, groupAttr, entry, val, claimedSlots) {
        var uniformName = entry.name;
        var attrType = entry.type || 'double';
        var setVal = Number(val);
        if (!isFinite(setVal)) setVal = entry.default !== undefined ? entry.default : 0;

        var attrs = safeCall(function () { return api.getAttributes(nodeId); }, []) || [];
        var directCandidates = ['uniforms.' + uniformName, 'dynamic.' + uniformName, groupAttr + '.' + uniformName, uniformName];
        for (var i = 0; i < directCandidates.length; i++) {
            if (attrs.indexOf(directCandidates[i]) >= 0 && setAttrValue(nodeId, directCandidates[i], setVal)) {
                return directCandidates[i];
            }
        }

        var firstPlaceholder = null;
        var hasGroupAttr = false;
        for (var a = 0; a < attrs.length; a++) {
            if (attrs[a] === groupAttr || attrs[a].indexOf(groupAttr + '.') === 0) {
                hasGroupAttr = true;
                break;
            }
        }

        for (var idx = 0; idx < 32; idx++) {
            var slot = groupAttr + '.' + idx;
            var hasSlotInAttrs = attrs.indexOf(slot) >= 0;
            var curName = typeof api.getCustomAttributeName === 'function'
                ? safeCall(function () { return api.getCustomAttributeName(nodeId, slot); }, '')
                : '';
            if (!hasSlotInAttrs && !curName) {
                if (hasGroupAttr && idx > 0) break;
                continue;
            }
            if (claimedSlots[slot]) continue;
            if (curName === uniformName) {
                claimedSlots[slot] = true;
                setAttrValue(nodeId, slot, setVal);
                return slot;
            }
            if (!firstPlaceholder && (!curName || /^n\d+$/.test(curName))) {
                firstPlaceholder = slot;
            }
        }

        if (firstPlaceholder) {
            claimedSlots[firstPlaceholder] = true;
            if (typeof api.renameAttribute === 'function') {
                safeCall(function () { api.renameAttribute(nodeId, firstPlaceholder, uniformName); }, null);
            }
            setAttrValue(nodeId, firstPlaceholder, setVal);
            return firstPlaceholder;
        }

        if (typeof api.addDynamic === 'function' && hasGroupAttr) {
            var added = safeCall(function () { return api.addDynamic(nodeId, groupAttr, attrType); }, null);
            var newSlot = (typeof added === 'string' && added.indexOf(groupAttr + '.') === 0) ? added : null;
            if (!newSlot) {
                var after = safeCall(function () { return api.getAttributes(nodeId); }, []) || [];
                for (var aIdx = 0; aIdx < 32; aIdx++) {
                    var cand = groupAttr + '.' + aIdx;
                    var candName = typeof api.getCustomAttributeName === 'function'
                        ? safeCall(function () { return api.getCustomAttributeName(nodeId, cand); }, '')
                        : '';
                    if ((after.indexOf(cand) >= 0 || candName) && attrs.indexOf(cand) < 0 && !claimedSlots[cand]) {
                        newSlot = cand;
                        break;
                    }
                }
            }
            if (newSlot) {
                claimedSlots[newSlot] = true;
                if (typeof api.renameAttribute === 'function') {
                    safeCall(function () { api.renameAttribute(nodeId, newSlot, uniformName); }, null);
                }
                setAttrValue(nodeId, newSlot, setVal);
                return newSlot;
            }
        }
        return null;
    }

    function extractLayerId(connStr) {
        if (!connStr || typeof connStr !== 'string') return null;
        var dotIdx = connStr.indexOf('.');
        return dotIdx >= 0 ? connStr.slice(0, dotIdx) : connStr;
    }

    function getConnectedNodes(targetId, portAttr, nodeType) {
        var ids = [];
        var seen = {};
        function pushConn(raw) {
            if (Array.isArray(raw)) {
                for (var r = 0; r < raw.length; r++) pushConn(raw[r]);
                return;
            }
            var id = extractLayerId(raw);
            if (id && !seen[id]) {
                seen[id] = true;
                ids.push(id);
            }
        }
        if (typeof api.getInConnections === 'function') {
            pushConn(safeCall(function () { return api.getInConnections(targetId, portAttr); }, null));
        }
        if (typeof api.getInConnection === 'function') {
            pushConn(safeCall(function () { return api.getInConnection(targetId, portAttr); }, null));
        }
        if (typeof api.getConnected === 'function') {
            pushConn(safeCall(function () { return api.getConnected(targetId, portAttr); }, null));
        }
        for (var pIdx = 0; pIdx < 16; pIdx++) {
            if (typeof api.getInConnection === 'function') {
                var idxConn = safeCall(function () { return api.getInConnection(targetId, portAttr + '.' + pIdx); }, null);
                if (idxConn) pushConn(idxConn);
            }
            if (typeof api.getConnected === 'function') {
                var idxConn2 = safeCall(function () { return api.getConnected(targetId, portAttr + '.' + pIdx); }, null);
                if (idxConn2) pushConn(idxConn2);
            }
        }
        if (ids.length) return ids;

        var all = safeCall(function () { return api.getCompLayers(false); }, []) || [];
        for (var i = 0; i < all.length; i++) {
            var id = all[i];
            var lType = safeCall(function () { return api.getLayerType ? api.getLayerType(id) : (api.getType ? api.getType(id) : ''); }, '');
            if (lType !== nodeType) continue;
            var outs = safeCall(function () { return api.getOutConnections(id, 'id'); }, []) || [];
            if (Array.isArray(outs)) {
                for (var j = 0; j < outs.length; j++) {
                    if (extractLayerId(String(outs[j])) === targetId) {
                        pushConn(id);
                        break;
                    }
                }
            }
        }
        return ids;
    }

    function findExistingFilter(layerId) {
        var layerType = safeCall(function () { return api.getLayerType ? api.getLayerType(layerId) : (api.getType ? api.getType(layerId) : ''); }, '');
        if (layerType === 'skslFilter') {
            return layerId;
        }
        var linked = getConnectedNodes(layerId, 'filters', 'skslFilter');
        for (var i = 0; i < linked.length; i++) {
            var name = safeCall(function () { return api.getNiceName ? api.getNiceName(linked[i]) : (api.getName ? api.getName(linked[i]) : ''); }, '');
            if (name && (name.indexOf(TAG_SKSL) >= 0 || name.indexOf('RepeTile') >= 0)) {
                return linked[i];
            }
        }
        return null;
    }

    function calculatePadding(params) {
        var padX = Math.max(params.expandLeft || 0, params.expandRight || 0);
        var padY = Math.max(params.expandUp || 0, params.expandDown || 0);
        return {
            x: Math.min(Math.ceil(padX), 10000),
            y: Math.min(Math.ceil(padY), 10000)
        };
    }

    function applyRepeTileToLayer(layerId, comp, params, liveCode) {
        var filterId = findExistingFilter(layerId);
        var isNew = false;
        var targetName = safeCall(function () { return api.getNiceName ? api.getNiceName(layerId) : (api.getName ? api.getName(layerId) : layerId); }, layerId);

        if (!filterId) {
            filterId = safeCall(function () { return api.create('skslFilter', TAG_SKSL + ' ' + targetName); }, null);
            isNew = true;
        }

        if (!filterId) {
            return {
                targetId: layerId,
                ok: false,
                error: 'Failed to create skslFilter node'
            };
        }

        var claimedSlots = {};
        var boundSlots = {};
        for (var i = 0; i < PARAM_SPECS.length; i++) {
            var spec = PARAM_SPECS[i];
            var val = params[spec.key];
            var slot = bindDynamicSlot(filterId, 'inputs', spec, val, claimedSlots);
            if (slot) {
                boundSlots[spec.name] = slot;
            }
        }

        var pad = calculatePadding(params);
        var filterProps = { code: liveCode, padding: pad };
        safeCall(function () { api.set(filterId, filterProps); }, null);

        if (isNew) {
            safeCall(function () { api.connect(filterId, 'id', layerId, 'filters'); }, null);
        }

        return {
            targetId: layerId,
            ok: true,
            filterId: filterId,
            isNew: isNew,
            boundSlots: boundSlots,
            padding: pad
        };
    }

    // MAIN EXECUTION BODY
    var config = (typeof __EFFECT_CONFIG__ !== 'undefined' && __EFFECT_CONFIG__) ? __EFFECT_CONFIG__ : {};
    var params = normalizeParams(config.params);

    var comp = safeCall(function () { return api.getActiveComp(); }, null);
    if (!comp) {
        var comps = safeCall(function () { return api.getCompLayers ? api.getCompLayers(false) : []; }, []);
        comp = comps && comps.length ? comps[0] : null;
    }

    var selection = safeCall(function () { return api.getSelection(); }, []) || [];
    var appliedLayers = [];
    var createdTarget = false;

    if (!selection.length && config.createTestTargetIfEmpty) {
        var targetRect = api.primitive('rectangle', 'CC RepeTile Test Target');
        api.set(targetRect, {
            'generator.dimensions': { x: 220, y: 160 },
            'material.materialColor': { r: 50, g: 150, b: 240, a: 255 }
        });
        selection = [targetRect];
        createdTarget = true;
    }

    if (!selection.length) {
        var msg = 'AE Effects [CC RepeTile]: No layer selected. Please select one or more layers in Cavalry.';
        var out = {
            ok: false,
            partial: false,
            effect: 'CC RepeTile',
            code: 'NO_SELECTION',
            error: msg,
            appliedCount: 0,
            failedCount: 1,
            warnings: [],
            results: [],
            targets: []
        };
        try { __result = out; } catch (e) {}
        if (typeof console !== 'undefined' && console.warn) console.warn(msg);
        return out;
    }

    // Prepare SkSL code: strip uniform headers matching dynamic inputs
    var liveCode = SKSL_SOURCE.replace(/^\s*uniform\s+(?:float|float2|half4|bool)\s+[A-Za-z0-9_]+\s*;\s*(?:\r?\n)?/gm, '');

    var results = [];
    for (var s = 0; s < selection.length; s++) {
        var layerId = selection[s];
        var res = applyRepeTileToLayer(layerId, comp, params, liveCode);
        results.push(res);
        appliedLayers.push(layerId);
    }

    // Preserve original selection
    safeCall(function () { api.select(selection); }, null);

    var failedCount = 0;
    for (var r = 0; r < results.length; r++) {
        if (results[r] && results[r].ok === false) failedCount++;
    }
    var isOk = results.length > 0 && failedCount === 0;
    var isPartial = failedCount > 0 && failedCount < results.length;

    var summary = {
        ok: isOk,
        partial: isPartial,
        effect: 'CC RepeTile',
        code: isOk ? 'SUCCESS' : (isPartial ? 'PARTIAL_SUCCESS' : 'RUNTIME_EXCEPTION'),
        error: isOk ? null : (failedCount + ' layer(s) failed'),
        strategy: 'skslFilter',
        appliedCount: results.length - failedCount,
        failedCount: failedCount,
        warnings: [],
        targets: appliedLayers,
        createdTarget: createdTarget,
        results: results,
        params: params
    };

    try { __result = summary; } catch (e) {}
    if (typeof console !== 'undefined' && console.log) {
        console.log('AE Effects: Applied CC RepeTile (skslFilter) to ' + results.length + ' layer(s)');
    }
    return summary;
})();
