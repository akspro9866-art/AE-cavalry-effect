/**
 * One-Action Reusable Implementation & Applicator:
 * Adobe After Effects "CC Light Sweep" -> Cavalry 2.8+
 *
 * Implemented as a high-performance GPU SkSL Filter (`skslFilter`) with
 * directional beam profile, alpha edge specular highlights, and additive compositing.
 */
(function () {
    /* @@BEGIN_SKSL@@ */
    var SKSL_SOURCE = "// Adobe After Effects \"CC Light Sweep\" (CC Light Sweep)\n// Reconstructed mathematically for Cavalry 2.8+ as a high-performance GPU SkSL Filter (`skslFilter`).\n//\n// Built-in Cavalry preamble uniforms (injected automatically by Cavalry runtime):\n//   `layer` (uniform shader) - Source layer texture sampler (layer.eval(coords))\n//   `resolution` (float2)   - Bounding dimensions in pixels (centered coordinate space)\n\nuniform shader layer;\n\n// Dynamic attribute uniforms (mapped to Cavalry `inputs.0`..`inputs.8`):\nuniform float CenterX;         // X coordinate of light sweep center (default: 0.0)\nuniform float CenterY;         // Y coordinate of light sweep center (default: 0.0)\nuniform float Direction;       // Sweep band angle in degrees (default: 30.0, range: -360.0 to 360.0)\nuniform float Shape;           // 0 = Linear, 1 = Smooth, 2 = Sharp\nuniform float Width;           // Width of the light band in pixels (default: 50.0, range: 1.0 to 500.0)\nuniform float SweepIntensity;  // Center light band intensity (default: 1.0, range: 0.0 to 10.0)\nuniform float EdgeIntensity;   // Edge bevel specular intensity (default: 2.0, range: 0.0 to 10.0)\nuniform float EdgeThickness;   // Edge detection sampling radius (default: 4.0, range: 0.0 to 50.0)\nuniform half4 LightColor;      // Color swatch of the sweeping beam (default: RGB(255, 255, 255))\n\nhalf4 main(float2 fragCoord) {\n    half4 src = layer.eval(fragCoord);\n    if (src.a <= 0.0001) {\n        return src;\n    }\n\n    float rad = Direction * 0.017453292519943295;\n    // Normal perpendicular to sweep direction\n    float2 normal = float2(-sin(rad), cos(rad));\n    float2 center = float2(CenterX, CenterY);\n\n    float d = abs(dot(fragCoord - center, normal));\n    float halfW = max(Width * 0.5, 0.5);\n\n    float beam = 0.0;\n    if (d < halfW) {\n        float u = 1.0 - (d / halfW);\n        int shp = int(floor(Shape + 0.5));\n        if (shp == 1) {\n            // Smoothstep\n            beam = u * u * (3.0 - 2.0 * u);\n        } else if (shp == 2) {\n            // Sharp\n            beam = u * u * u;\n        } else {\n            // Linear\n            beam = u;\n        }\n    }\n\n    // Alpha gradient for edge bevel highlight\n    float eps = max(EdgeThickness, 1.0);\n    float aRight = float(layer.eval(fragCoord + float2(eps, 0.0)).a);\n    float aLeft  = float(layer.eval(fragCoord - float2(eps, 0.0)).a);\n    float aUp    = float(layer.eval(fragCoord + float2(0.0, eps)).a);\n    float aDown  = float(layer.eval(fragCoord - float2(0.0, eps)).a);\n\n    float2 grad = float2(aRight - aLeft, aUp - aDown);\n    float edgeFactor = length(grad) * 0.5;\n\n    float lightContrib = (beam * SweepIntensity + edgeFactor * beam * EdgeIntensity);\n    half3 lightRgb = LightColor.rgb * half(lightContrib);\n\n    // Composite additively over source within alpha silhouette\n    float alpha = float(src.a);\n    half3 outRgb = clamp(src.rgb + lightRgb * half(alpha), half3(0.0), half3(1.0));\n\n    return half4(outRgb, src.a);\n}\n";
    /* @@END_SKSL@@ */

    var DEFAULTS = {
        centerX: 0.0,
        centerY: 0.0,
        direction: 30.0,
        shape: 0,
        width: 50.0,
        sweepIntensity: 1.0,
        edgeIntensity: 2.0,
        edgeThickness: 4.0,
        lightColor: { r: 255, g: 255, b: 255, a: 255 }
    };

    var TAG_SKSL = '[AE:CC Light Sweep]';

    function safeCall(fn, fallback) {
        try {
            return fn();
        } catch (err) {
            if (typeof globalThis !== 'undefined' && globalThis.AE_EFFECTS_DEBUG && typeof console !== 'undefined' && console.warn) {
                console.warn("[AE:CC Light Sweep]" + ' call failed: ' + (err && err.message ? err.message : err));
            }
            return fallback;
        }
    }

    function clampNum(v, lo, hi, fb) {
        var n = Number(v);
        if (!isFinite(n)) return fb;
        return n < lo ? lo : (n > hi ? hi : n);
    }

    function resolveColor(val, fallback) {
        if (!val) return fallback;
        if (typeof val === 'object' && val.r !== undefined && val.g !== undefined && val.b !== undefined) {
            return {
                r: clampNum(val.r, 0, 255, fallback.r),
                g: clampNum(val.g, 0, 255, fallback.g),
                b: clampNum(val.b, 0, 255, fallback.b),
                a: clampNum(val.a !== undefined ? val.a : 255, 0, 255, 255)
            };
        }
        if (Array.isArray(val) && val.length >= 3) {
            var scale = (val[0] <= 1 && val[1] <= 1 && val[2] <= 1 && (val[3] === undefined || val[3] <= 1)) ? 255 : 1;
            return {
                r: clampNum(val[0] * scale, 0, 255, fallback.r),
                g: clampNum(val[1] * scale, 0, 255, fallback.g),
                b: clampNum(val[2] * scale, 0, 255, fallback.b),
                a: clampNum(val.length >= 4 ? val[3] * scale : 255, 0, 255, 255)
            };
        }
        return fallback;
    }

    function normalizeParams(raw) {
        var p = raw && typeof raw === 'object' ? raw : {};
        return {
            centerX: Number.isFinite(Number(p.centerX !== undefined ? p.centerX : p.CenterX)) ? Number(p.centerX !== undefined ? p.centerX : p.CenterX) : DEFAULTS.centerX,
            centerY: Number.isFinite(Number(p.centerY !== undefined ? p.centerY : p.CenterY)) ? Number(p.centerY !== undefined ? p.centerY : p.CenterY) : DEFAULTS.centerY,
            direction: clampNum(p.direction !== undefined ? p.direction : p.Direction, -360.0, 360.0, DEFAULTS.direction),
            shape: clampNum(p.shape !== undefined ? p.shape : p.Shape, 0, 2, DEFAULTS.shape),
            width: clampNum(p.width !== undefined ? p.width : p.Width, 1.0, 500.0, DEFAULTS.width),
            sweepIntensity: clampNum(p.sweepIntensity !== undefined ? p.sweepIntensity : p.SweepIntensity, 0.0, 10.0, DEFAULTS.sweepIntensity),
            edgeIntensity: clampNum(p.edgeIntensity !== undefined ? p.edgeIntensity : p.EdgeIntensity, 0.0, 10.0, DEFAULTS.edgeIntensity),
            edgeThickness: clampNum(p.edgeThickness !== undefined ? p.edgeThickness : p.EdgeThickness, 0.0, 50.0, DEFAULTS.edgeThickness),
            lightColor: resolveColor(p.lightColor !== undefined ? p.lightColor : p.LightColor, DEFAULTS.lightColor)
        };
    }

    var PARAM_SPECS = [
        { name: 'CenterX', key: 'centerX', type: 'double', default: DEFAULTS.centerX },
        { name: 'CenterY', key: 'centerY', type: 'double', default: DEFAULTS.centerY },
        { name: 'Direction', key: 'direction', type: 'double', default: DEFAULTS.direction },
        { name: 'Shape', key: 'shape', type: 'double', default: DEFAULTS.shape },
        { name: 'Width', key: 'width', type: 'double', default: DEFAULTS.width },
        { name: 'SweepIntensity', key: 'sweepIntensity', type: 'double', default: DEFAULTS.sweepIntensity },
        { name: 'EdgeIntensity', key: 'edgeIntensity', type: 'double', default: DEFAULTS.edgeIntensity },
        { name: 'EdgeThickness', key: 'edgeThickness', type: 'double', default: DEFAULTS.edgeThickness },
        { name: 'LightColor', key: 'lightColor', type: 'color', default: DEFAULTS.lightColor }
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
        var setVal = val;
        if (attrType === 'color') {
            setVal = resolveColor(val, entry.default);
        } else {
            setVal = Number(val);
            if (!isFinite(setVal)) setVal = entry.default !== undefined ? entry.default : 0;
        }

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
            if (name && (name.indexOf(TAG_SKSL) >= 0 || name.indexOf('Light Sweep') >= 0)) {
                return linked[i];
            }
        }
        return null;
    }

    function applyLightSweepToLayer(layerId, comp, params, liveCode) {
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

        var filterProps = { code: liveCode };
        safeCall(function () { api.set(filterId, filterProps); }, null);

        if (isNew) {
            safeCall(function () { api.connect(filterId, 'id', layerId, 'filters'); }, null);
        }

        return {
            targetId: layerId,
            ok: true,
            filterId: filterId,
            isNew: isNew,
            boundSlots: boundSlots
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
        var targetRect = api.primitive('rectangle', 'Light Sweep Test Target');
        api.set(targetRect, {
            'generator.dimensions': { x: 250, y: 250 },
            'material.materialColor': { r: 50, g: 100, b: 200, a: 255 }
        });
        selection = [targetRect];
        createdTarget = true;
    }

    if (!selection.length) {
        var msg = 'AE Effects [CC Light Sweep]: No layer selected. Please select one or more layers in Cavalry.';
        var out = {
            ok: false,
            partial: false,
            effect: 'CC Light Sweep',
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
        var res = applyLightSweepToLayer(layerId, comp, params, liveCode);
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
        effect: 'CC Light Sweep',
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
        console.log('AE Effects: Applied CC Light Sweep (skslFilter) to ' + results.length + ' layer(s)');
    }
    return summary;

    // Standard dual export shim (module exports for tests/CLI, global for panel runners).
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            apply: applyLightSweepToLayer,
            normalizeParams: normalizeParams,
            PARAM_SPECS: PARAM_SPECS,
            DEFAULTS: DEFAULTS,
            SKSL_SOURCE: SKSL_SOURCE
        };
    } else {
        if (typeof globalThis !== 'undefined') {
            globalThis.AECcLightSweep = { apply: applyLightSweepToLayer };
        }
    }
})();
