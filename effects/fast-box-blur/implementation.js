/**
 * One-Action Reusable Implementation & Applicator:
 * Adobe After Effects "Fast Box Blur" -> Cavalry 2.8+
 *
 * Implemented as a high-performance GPU SkSL Filter (`skslFilter`) with
 * multi-pass box iterations and directional support.
 */
(function () {
    /* @@BEGIN_SKSL@@ */
    var SKSL_SOURCE = "// Adobe After Effects \"Fast Box Blur\" (ADBE Box Blur2)\n// Reconstructed mathematically for Cavalry 2.8+ as a high-performance GPU SkSL Filter (`skslFilter`).\n//\n// Built-in Cavalry preamble uniforms (injected automatically by Cavalry runtime):\n//   `layer` (uniform shader) - Source layer texture sampler (layer.eval(coords))\n//   `resolution` (float2)   - Bounding dimensions in pixels (centered coordinate space)\n\nuniform shader layer;\n\n// Dynamic attribute uniforms (mapped to Cavalry `inputs.0`..`inputs.3`):\nuniform float BlurRadius;        // Box blur radius in pixels (default: 10.0, range: 0.0 to 500.0)\nuniform float Iterations;        // Number of box passes: 1=Box, 2=Triangle, 3=Cubic B-Spline (default: 1.0, range: 1.0 to 5.0)\nuniform float BlurDimensions;    // 0 = Both, 1 = Horizontal, 2 = Vertical\nuniform float RepeatEdgePixels;  // 0 = Off, 1 = On\n\nhalf4 sampleClamped(float2 coord, float2 halfRes, bool repeatEdges) {\n    if (repeatEdges) {\n        float2 c = clamp(coord, -halfRes + 0.5, halfRes - 0.5);\n        return layer.eval(c);\n    }\n    if (abs(coord.x) > halfRes.x || abs(coord.y) > halfRes.y) {\n        return half4(0.0);\n    }\n    return layer.eval(coord);\n}\n\nfloat computeBoxWeight(float dist, float radius, int iters) {\n    float normDist = abs(dist) / max(radius * float(iters), 1e-4);\n    if (normDist > 1.0) return 0.0;\n    if (iters <= 1) {\n        // Pure uniform rectangular box profile\n        return 1.0;\n    } else if (iters == 2) {\n        // Linear triangular profile (convolution of 2 boxes)\n        return 1.0 - normDist;\n    } else {\n        // Cubic B-spline profile (convolution of 3+ boxes)\n        float d = normDist * 2.0;\n        if (d <= 1.0) {\n            return (2.0 / 3.0) - d * d + 0.5 * d * d * d;\n        } else {\n            float t = 2.0 - d;\n            return (1.0 / 6.0) * t * t * t;\n        }\n    }\n}\n\nhalf4 main(float2 fragCoord) {\n    if (BlurRadius <= 0.001) {\n        return layer.eval(fragCoord);\n    }\n\n    float2 res = max(resolution, float2(1.0, 1.0));\n    float2 halfRes = res * 0.5;\n    bool repeatEdges = (RepeatEdgePixels > 0.5);\n\n    int iters = int(clamp(floor(Iterations + 0.5), 1.0, 5.0));\n    int dim = int(floor(BlurDimensions + 0.5));\n    float r = max(BlurRadius, 0.5);\n\n    half4 accum = sampleClamped(fragCoord, halfRes, repeatEdges);\n    float totalW = 1.0;\n\n    if (dim == 1) {\n        // Horizontal only (32-tap line)\n        for (int i = 1; i <= 16; i++) {\n            float dist = (float(i) / 16.0) * r * float(iters);\n            float w = computeBoxWeight(dist, r, iters);\n            half4 s1 = sampleClamped(fragCoord + float2(dist, 0.0), halfRes, repeatEdges);\n            half4 s2 = sampleClamped(fragCoord - float2(dist, 0.0), halfRes, repeatEdges);\n            accum += (s1 + s2) * half(w);\n            totalW += 2.0 * w;\n        }\n    } else if (dim == 2) {\n        // Vertical only (32-tap line)\n        for (int i = 1; i <= 16; i++) {\n            float dist = (float(i) / 16.0) * r * float(iters);\n            float w = computeBoxWeight(dist, r, iters);\n            half4 s1 = sampleClamped(fragCoord + float2(0.0, dist), halfRes, repeatEdges);\n            half4 s2 = sampleClamped(fragCoord - float2(0.0, dist), halfRes, repeatEdges);\n            accum += (s1 + s2) * half(w);\n            totalW += 2.0 * w;\n        }\n    } else {\n        // Horizontal and Vertical: separable cascaded cross-kernel with diagonal taps\n        for (int i = 1; i <= 12; i++) {\n            float dist = (float(i) / 12.0) * r * float(iters);\n            float w = computeBoxWeight(dist, r, iters);\n\n            half4 sH1 = sampleClamped(fragCoord + float2(dist, 0.0), halfRes, repeatEdges);\n            half4 sH2 = sampleClamped(fragCoord - float2(dist, 0.0), halfRes, repeatEdges);\n            half4 sV1 = sampleClamped(fragCoord + float2(0.0, dist), halfRes, repeatEdges);\n            half4 sV2 = sampleClamped(fragCoord - float2(0.0, dist), halfRes, repeatEdges);\n            accum += (sH1 + sH2 + sV1 + sV2) * half(w);\n            totalW += 4.0 * w;\n\n            // Diagonal corner taps for 2D square spatial expansion\n            float diagDist = dist * 0.7071;\n            float wDiag = w * 0.8;\n            half4 sD1 = sampleClamped(fragCoord + float2(diagDist, diagDist), halfRes, repeatEdges);\n            half4 sD2 = sampleClamped(fragCoord - float2(diagDist, diagDist), halfRes, repeatEdges);\n            half4 sD3 = sampleClamped(fragCoord + float2(diagDist, -diagDist), halfRes, repeatEdges);\n            half4 sD4 = sampleClamped(fragCoord - float2(diagDist, -diagDist), halfRes, repeatEdges);\n            accum += (sD1 + sD2 + sD3 + sD4) * half(wDiag);\n            totalW += 4.0 * wDiag;\n        }\n    }\n\n    return accum / half(totalW);\n}\n";
    /* @@END_SKSL@@ */

    var DEFAULTS = {
        blurRadius: 10.0,
        iterations: 1.0,
        blurDimensions: 0,
        repeatEdgePixels: 1
    };

    var TAG_SKSL = '[AE:Fast Box Blur]';

    function safeCall(fn, fallback) {
        try {
            return fn();
        } catch (err) {
            if (typeof globalThis !== 'undefined' && globalThis.AE_EFFECTS_DEBUG && typeof console !== 'undefined' && console.warn) {
                console.warn("[AE:Fast Box Blur]" + ' call failed: ' + (err && err.message ? err.message : err));
            }
            return fallback;
        }
    }

    function clampNum(v, lo, hi, fb) {
        var n = Number(v);
        if (!isFinite(n)) return fb;
        return n < lo ? lo : (n > hi ? hi : n);
    }

    function normalizeParams(raw) {
        var p = raw && typeof raw === 'object' ? raw : {};
        return {
            blurRadius: clampNum(p.blurRadius !== undefined ? p.blurRadius : p.BlurRadius, 0.0, 500.0, DEFAULTS.blurRadius),
            iterations: clampNum(p.iterations !== undefined ? p.iterations : p.Iterations, 1.0, 5.0, DEFAULTS.iterations),
            blurDimensions: clampNum(p.blurDimensions !== undefined ? p.blurDimensions : p.BlurDimensions, 0, 2, DEFAULTS.blurDimensions),
            repeatEdgePixels: clampNum(p.repeatEdgePixels !== undefined ? p.repeatEdgePixels : p.RepeatEdgePixels, 0, 1, DEFAULTS.repeatEdgePixels)
        };
    }

    var PARAM_SPECS = [
        { name: 'BlurRadius', key: 'blurRadius', type: 'double', default: DEFAULTS.blurRadius },
        { name: 'Iterations', key: 'iterations', type: 'double', default: DEFAULTS.iterations },
        { name: 'BlurDimensions', key: 'blurDimensions', type: 'double', default: DEFAULTS.blurDimensions },
        { name: 'RepeatEdgePixels', key: 'repeatEdgePixels', type: 'double', default: DEFAULTS.repeatEdgePixels }
    ];

    function calculatePadding(params) {
        var r = (params.blurRadius || 0.0) * (params.iterations || 1.0);
        var dim = Math.round(params.blurDimensions || 0);
        return {
            x: dim === 2 ? 0 : Math.ceil(r) + 10,
            y: dim === 1 ? 0 : Math.ceil(r) + 10
        };
    }

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
        if (layerType === 'skslFilter') return layerId;
        var linked = getConnectedNodes(layerId, 'filters', 'skslFilter');
        for (var i = 0; i < linked.length; i++) {
            var name = safeCall(function () { return api.getNiceName ? api.getNiceName(linked[i]) : (api.getName ? api.getName(linked[i]) : ''); }, '');
            if (name && (name.indexOf(TAG_SKSL) >= 0 || name.indexOf('Fast Box Blur') >= 0)) {
                return linked[i];
            }
        }
        return null;
    }

    function applyFastBoxBlurToLayer(layerId, comp, params, liveCode) {
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
        var targetRect = api.primitive('rectangle', 'Fast Box Blur Test Target');
        api.set(targetRect, {
            'generator.dimensions': { x: 250, y: 250 },
            'material.materialColor': { r: 90, g: 160, b: 240, a: 255 }
        });
        selection = [targetRect];
        createdTarget = true;
    }

    if (!selection.length) {
        var msg = 'AE Effects [Fast Box Blur]: No layer selected. Please select one or more layers in Cavalry.';
        var out = {
            ok: false,
            partial: false,
            effect: 'Fast Box Blur',
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

    var liveCode = SKSL_SOURCE.replace(/^\s*uniform\s+(?:float|float2|half4|bool)\s+[A-Za-z0-9_]+\s*;\s*(?:\r?\n)?/gm, '');

    var results = [];
    for (var s = 0; s < selection.length; s++) {
        var layerId = selection[s];
        var res = applyFastBoxBlurToLayer(layerId, comp, params, liveCode);
        results.push(res);
        appliedLayers.push(layerId);
    }

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
        effect: 'Fast Box Blur',
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
        console.log('AE Effects: Applied Fast Box Blur (skslFilter) to ' + results.length + ' layer(s)');
    }
    return summary;

    // Standard dual export shim (module exports for tests/CLI, global for panel runners).
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            apply: applyFastBoxBlurToLayer,
            normalizeParams: normalizeParams,
            calculatePadding: calculatePadding,
            PARAM_SPECS: PARAM_SPECS,
            DEFAULTS: DEFAULTS,
            SKSL_SOURCE: SKSL_SOURCE
        };
    } else {
        if (typeof globalThis !== 'undefined') {
            globalThis.AEFastBoxBlur = { apply: applyFastBoxBlurToLayer };
        }
    }
})();
