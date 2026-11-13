/**
 * One-Action Reusable Implementation & Applicator:
 * Adobe After Effects "Gaussian Blur" -> Cavalry 2.8+
 *
 * Implemented as a high-performance GPU SkSL Filter (`skslFilter`) with
 * directional Gaussian diffusion and repeat edge pixels clamping.
 */
(function () {
    /* @@BEGIN_SKSL@@ */
    var SKSL_SOURCE = "// Adobe After Effects \"Gaussian Blur\" (ADBE Gaussian Blur 2)\n// Reconstructed mathematically for Cavalry 2.8+ as a high-performance GPU SkSL Filter (`skslFilter`).\n//\n// Built-in Cavalry preamble uniforms (injected automatically by Cavalry runtime):\n//   `layer` (uniform shader) - Source layer texture sampler (layer.eval(coords))\n//   `resolution` (float2)   - Bounding dimensions in pixels (centered coordinate space)\n\nuniform shader layer;\n\n// Dynamic attribute uniforms (mapped to Cavalry `inputs.0`..`inputs.2`):\nuniform float Blurriness;        // Standard deviation / blur radius in pixels (default: 50.0)\nuniform float BlurDimensions;    // 0 = Horizontal and Vertical, 1 = Horizontal Only, 2 = Vertical Only\nuniform float RepeatEdgePixels;  // 0 = Off, 1 = On (clamps sampling to border to prevent edge darkening)\n\nhalf4 sampleClamped(float2 coord, float2 halfRes, bool repeatEdges) {\n    if (repeatEdges) {\n        float2 c = clamp(coord, -halfRes + 0.5, halfRes - 0.5);\n        return layer.eval(c);\n    }\n    if (abs(coord.x) > halfRes.x || abs(coord.y) > halfRes.y) {\n        return half4(0.0);\n    }\n    return layer.eval(coord);\n}\n\nhalf4 main(float2 fragCoord) {\n    if (Blurriness <= 0.001) {\n        return layer.eval(fragCoord);\n    }\n\n    float2 res = max(resolution, float2(1.0, 1.0));\n    float2 halfRes = res * 0.5;\n    bool repeatEdges = (RepeatEdgePixels > 0.5);\n\n    // Standard After Effects Gaussian Blur standard deviation mapping\n    float sigma = max(Blurriness * 0.5, 0.5);\n    float twoSigmaSq = 2.0 * sigma * sigma;\n\n    float dim = floor(BlurDimensions + 0.5);\n\n    half4 accum = half4(0.0);\n    float totalWeight = 0.0;\n\n    // Center tap\n    half4 centerSample = sampleClamped(fragCoord, halfRes, repeatEdges);\n    accum += centerSample;\n    totalWeight += 1.0;\n\n    if (dim > 0.5 && dim < 1.5) {\n        // 1 = Horizontal Only (32-tap Gaussian kernel)\n        for (int i = 1; i <= 32; i++) {\n            float dist = float(i) * (sigma * 3.0 / 32.0);\n            float w = exp(-(dist * dist) / twoSigmaSq);\n            half4 s1 = sampleClamped(fragCoord + float2(dist, 0.0), halfRes, repeatEdges);\n            half4 s2 = sampleClamped(fragCoord - float2(dist, 0.0), halfRes, repeatEdges);\n            accum += (s1 + s2) * half(w);\n            totalWeight += 2.0 * w;\n        }\n    } else if (dim > 1.5) {\n        // 2 = Vertical Only (32-tap Gaussian kernel)\n        for (int i = 1; i <= 32; i++) {\n            float dist = float(i) * (sigma * 3.0 / 32.0);\n            float w = exp(-(dist * dist) / twoSigmaSq);\n            half4 s1 = sampleClamped(fragCoord + float2(0.0, dist), halfRes, repeatEdges);\n            half4 s2 = sampleClamped(fragCoord - float2(0.0, dist), halfRes, repeatEdges);\n            accum += (s1 + s2) * half(w);\n            totalWeight += 2.0 * w;\n        }\n    } else {\n        // 0 = Horizontal and Vertical (36-tap Vogel Golden-Spiral Isotropic Gaussian Kernel)\n        // Uniform 2D disc dispersion without concentric ring artifacts\n        float maxR = sigma * 3.0;\n        for (int i = 0; i < 36; i++) {\n            float fi = float(i);\n            float r = maxR * sqrt((fi + 0.5) / 36.0);\n            float phi = fi * 2.39996323; // Golden angle in radians\n            float2 offset = float2(cos(phi), sin(phi)) * r;\n\n            float w = exp(-(r * r) / twoSigmaSq);\n            half4 s = sampleClamped(fragCoord + offset, halfRes, repeatEdges);\n            accum += s * half(w);\n            totalWeight += w;\n        }\n    }\n\n    return accum / half(totalWeight);\n}\n";
    /* @@END_SKSL@@ */

    var DEFAULTS = {
        blurriness: 50.0,
        blurDimensions: 0,
        repeatEdgePixels: 1
    };

    var DIMENSIONS_MAP = {
        '0': 0, 'both': 0, 'horizontal and vertical': 0, 'all': 0,
        '1': 1, 'horizontal': 1, 'horizontal only': 1, 'h': 1,
        '2': 2, 'vertical': 2, 'vertical only': 2, 'v': 2
    };

    var TAG_SKSL = '[AE:Gaussian Blur]';

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
            blurriness: clampNum(p.blurriness !== undefined ? p.blurriness : p.Blurriness, 0.0, 1000.0, DEFAULTS.blurriness),
            blurDimensions: resolveEnum(p.blurDimensions !== undefined ? p.blurDimensions : p.BlurDimensions, DIMENSIONS_MAP, DEFAULTS.blurDimensions),
            repeatEdgePixels: resolveEnum(p.repeatEdgePixels !== undefined ? p.repeatEdgePixels : p.RepeatEdgePixels, { '0': 0, 'off': 0, 'false': 0, '1': 1, 'on': 1, 'true': 1 }, DEFAULTS.repeatEdgePixels)
        };
    }

    var PARAM_SPECS = [
        { name: 'Blurriness', key: 'blurriness', type: 'double', default: DEFAULTS.blurriness },
        { name: 'BlurDimensions', key: 'blurDimensions', type: 'double', default: DEFAULTS.blurDimensions },
        { name: 'RepeatEdgePixels', key: 'repeatEdgePixels', type: 'double', default: DEFAULTS.repeatEdgePixels }
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
            if (name && (name.indexOf(TAG_SKSL) >= 0 || name.indexOf('Gaussian Blur') >= 0)) {
                return linked[i];
            }
        }
        return null;
    }

    function calculatePadding(params) {
        var basePad = Math.ceil((params.blurriness || 0) * 1.8 + 20);
        var dim = Math.round(params.blurDimensions || 0);
        return {
            x: dim === 2 ? 0 : Math.min(basePad, 4096),
            y: dim === 1 ? 0 : Math.min(basePad, 4096)
        };
    }

    function applyGaussianBlurToLayer(layerId, comp, params, liveCode) {
        var filterId = findExistingFilter(layerId);
        var isNew = false;
        var targetName = safeCall(function () { return api.getNiceName ? api.getNiceName(layerId) : (api.getName ? api.getName(layerId) : layerId); }, layerId);

        if (!filterId) {
            filterId = api.create('skslFilter', TAG_SKSL + ' ' + targetName);
            isNew = true;
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
        api.set(filterId, filterProps);

        if (isNew) {
            api.connect(filterId, 'id', layerId, 'filters');
        }

        return {
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
        var targetRect = api.primitive('rectangle', 'Gaussian Blur Test Target');
        api.set(targetRect, {
            'generator.dimensions': { x: 250, y: 250 },
            'material.materialColor': { r: 80, g: 190, b: 120, a: 255 }
        });
        selection = [targetRect];
        createdTarget = true;
    }

    if (!selection.length) {
        var msg = 'AE Effects [Gaussian Blur]: No layer selected. Please select one or more layers in Cavalry.';
        var out = { ok: false, error: msg, appliedCount: 0 };
        try { __result = out; } catch (e) {}
        if (typeof console !== 'undefined' && console.warn) console.warn(msg);
        return out;
    }

    // Prepare SkSL code: strip uniform headers matching dynamic inputs
    var liveCode = SKSL_SOURCE.replace(/^\s*uniform\s+(?:float|float2|half4|bool)\s+[A-Za-z0-9_]+\s*;\s*(?:\r?\n)?/gm, '');

    var results = [];
    for (var s = 0; s < selection.length; s++) {
        var layerId = selection[s];
        var res = applyGaussianBlurToLayer(layerId, comp, params, liveCode);
        results.push(res);
        appliedLayers.push(layerId);
    }

    // Preserve original selection
    safeCall(function () { api.select(selection); }, null);

    var summary = {
        ok: true,
        effect: 'Gaussian Blur',
        strategy: 'skslFilter',
        appliedCount: results.length,
        targets: appliedLayers,
        createdTarget: createdTarget,
        results: results,
        params: params
    };

    try { __result = summary; } catch (e) {}
    if (typeof console !== 'undefined' && console.log) {
        console.log('AE Effects: Applied Gaussian Blur (skslFilter) to ' + results.length + ' layer(s)');
    }
    return summary;
})();
