/**
 * One-Action Reusable Implementation & Applicator:
 * Adobe After Effects "Hue/Saturation" -> Cavalry 2.8+
 *
 * Implemented as a high-performance GPU SkSL Filter (`skslFilter`) with
 * Master Hue rotation, saturation scaling, and Colorize mode.
 */
(function () {
    /* @@BEGIN_SKSL@@ */
    var SKSL_SOURCE = "// Adobe After Effects \"Hue/Saturation\" (ADBE HUE SATURATION)\n// Reconstructed mathematically for Cavalry 2.8+ as a high-performance GPU SkSL Filter (`skslFilter`).\n//\n// Built-in Cavalry preamble uniforms (injected automatically by Cavalry runtime):\n//   `layer` (uniform shader) - Source layer texture sampler (layer.eval(coords))\n//   `resolution` (float2)   - Bounding dimensions in pixels (centered coordinate space)\n\nuniform shader layer;\n\n// Dynamic attribute uniforms (mapped to Cavalry `inputs.0`..`inputs.7`):\nuniform float ChannelControl;      // 0 = Master\nuniform float MasterHue;           // Hue shift in degrees (default: 0.0, range: -180.0 to 180.0)\nuniform float MasterSaturation;    // Saturation shift percent (default: 0.0, range: -100.0 to 100.0)\nuniform float MasterLightness;     // Lightness shift percent (default: 0.0, range: -100.0 to 100.0)\nuniform float Colorize;            // 0 = Off, 1 = On\nuniform float ColorizeHue;         // Colorize Hue in degrees (default: 0.0, range: 0.0 to 360.0)\nuniform float ColorizeSaturation;  // Colorize Saturation percent (default: 50.0, range: 0.0 to 100.0)\nuniform float ColorizeLightness;   // Colorize Lightness percent (default: 0.0, range: -100.0 to 100.0)\n\nfloat3 rgbToHsl(float3 c) {\n    float maxC = max(c.r, max(c.g, c.b));\n    float minC = min(c.r, min(c.g, c.b));\n    float l = (maxC + minC) * 0.5;\n    float delta = maxC - minC;\n\n    if (delta <= 1e-5) {\n        return float3(0.0, 0.0, l);\n    }\n\n    float s = l > 0.5 ? delta / (2.0 - maxC - minC) : delta / (maxC + minC);\n    float h = 0.0;\n    if (maxC == c.r) {\n        h = (c.g - c.b) / delta + (c.g < c.b ? 6.0 : 0.0);\n    } else if (maxC == c.g) {\n        h = (c.b - c.r) / delta + 2.0;\n    } else {\n        h = (c.r - c.g) / delta + 4.0;\n    }\n    h /= 6.0;\n\n    return float3(h, s, l);\n}\n\nfloat hue2rgb(float p, float q, float t) {\n    if (t < 0.0) t += 1.0;\n    if (t > 1.0) t -= 1.0;\n    if (t < 1.0 / 6.0) return p + (q - p) * 6.0 * t;\n    if (t < 1.0 / 2.0) return q;\n    if (t < 2.0 / 3.0) return p + (q - p) * (2.0 / 3.0 - t) * 6.0;\n    return p;\n}\n\nfloat3 hslToRgb(float3 hsl) {\n    float h = hsl.x;\n    float s = hsl.y;\n    float l = hsl.z;\n\n    if (s <= 1e-5) {\n        return float3(l);\n    }\n\n    float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;\n    float p = 2.0 * l - q;\n\n    return float3(\n        hue2rgb(p, q, h + 1.0 / 3.0),\n        hue2rgb(p, q, h),\n        hue2rgb(p, q, h - 1.0 / 3.0)\n    );\n}\n\nhalf4 main(float2 fragCoord) {\n    half4 src = layer.eval(fragCoord);\n    if (src.a <= 0.0001) {\n        return src;\n    }\n\n    float alpha = float(src.a);\n    float3 straightRgb = float3(src.rgb) / max(alpha, 1e-4);\n    float3 hsl = rgbToHsl(straightRgb);\n\n    if (Colorize > 0.5) {\n        // Colorize Mode\n        hsl.x = fract(ColorizeHue / 360.0);\n        hsl.y = clamp(ColorizeSaturation / 100.0, 0.0, 1.0);\n        float cl = ColorizeLightness / 100.0;\n        if (cl > 0.0) {\n            hsl.z = hsl.z + (1.0 - hsl.z) * cl;\n        } else if (cl < 0.0) {\n            hsl.z = hsl.z * (1.0 + cl);\n        }\n    } else {\n        // Master Hue / Saturation / Lightness Mode\n        hsl.x = fract(hsl.x + MasterHue / 360.0 + 1.0);\n        float sat = MasterSaturation / 100.0;\n        if (sat > 0.0) {\n            hsl.y = hsl.y + (1.0 - hsl.y) * sat;\n        } else if (sat < 0.0) {\n            hsl.y = hsl.y * (1.0 + sat);\n        }\n        float lit = MasterLightness / 100.0;\n        if (lit > 0.0) {\n            hsl.z = hsl.z + (1.0 - hsl.z) * lit;\n        } else if (lit < 0.0) {\n            hsl.z = hsl.z * (1.0 + lit);\n        }\n    }\n\n    hsl.y = clamp(hsl.y, 0.0, 1.0);\n    hsl.z = clamp(hsl.z, 0.0, 1.0);\n\n    float3 finalRgb = clamp(hslToRgb(hsl), 0.0, 1.0);\n    return half4(half3(finalRgb * alpha), src.a);\n}\n";
    /* @@END_SKSL@@ */

    var DEFAULTS = {
        channelControl: 0,
        masterHue: 0.0,
        masterSaturation: 0.0,
        masterLightness: 0.0,
        colorize: 0,
        colorizeHue: 0.0,
        colorizeSaturation: 50.0,
        colorizeLightness: 0.0
    };

    var TAG_SKSL = '[AE:Hue/Saturation]';

    function safeCall(fn, fallback) {
        try {
            return fn();
        } catch (err) {
            if (typeof globalThis !== 'undefined' && globalThis.AE_EFFECTS_DEBUG && typeof console !== 'undefined' && console.warn) {
                console.warn("[AE:Hue/Saturation]" + ' call failed: ' + (err && err.message ? err.message : err));
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
            channelControl: clampNum(p.channelControl !== undefined ? p.channelControl : p.ChannelControl, 0, 6, DEFAULTS.channelControl),
            masterHue: clampNum(p.masterHue !== undefined ? p.masterHue : p.MasterHue, -180.0, 180.0, DEFAULTS.masterHue),
            masterSaturation: clampNum(p.masterSaturation !== undefined ? p.masterSaturation : p.MasterSaturation, -100.0, 100.0, DEFAULTS.masterSaturation),
            masterLightness: clampNum(p.masterLightness !== undefined ? p.masterLightness : p.MasterLightness, -100.0, 100.0, DEFAULTS.masterLightness),
            colorize: clampNum(p.colorize !== undefined ? p.colorize : p.Colorize, 0, 1, DEFAULTS.colorize),
            colorizeHue: clampNum(p.colorizeHue !== undefined ? p.colorizeHue : p.ColorizeHue, 0.0, 360.0, DEFAULTS.colorizeHue),
            colorizeSaturation: clampNum(p.colorizeSaturation !== undefined ? p.colorizeSaturation : p.ColorizeSaturation, 0.0, 100.0, DEFAULTS.colorizeSaturation),
            colorizeLightness: clampNum(p.colorizeLightness !== undefined ? p.colorizeLightness : p.ColorizeLightness, -100.0, 100.0, DEFAULTS.colorizeLightness)
        };
    }

    var PARAM_SPECS = [
        { name: 'ChannelControl', key: 'channelControl', type: 'double', default: DEFAULTS.channelControl },
        { name: 'MasterHue', key: 'masterHue', type: 'double', default: DEFAULTS.masterHue },
        { name: 'MasterSaturation', key: 'masterSaturation', type: 'double', default: DEFAULTS.masterSaturation },
        { name: 'MasterLightness', key: 'masterLightness', type: 'double', default: DEFAULTS.masterLightness },
        { name: 'Colorize', key: 'colorize', type: 'double', default: DEFAULTS.colorize },
        { name: 'ColorizeHue', key: 'colorizeHue', type: 'double', default: DEFAULTS.colorizeHue },
        { name: 'ColorizeSaturation', key: 'colorizeSaturation', type: 'double', default: DEFAULTS.colorizeSaturation },
        { name: 'ColorizeLightness', key: 'colorizeLightness', type: 'double', default: DEFAULTS.colorizeLightness }
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
        if (layerType === 'skslFilter') return layerId;
        var linked = getConnectedNodes(layerId, 'filters', 'skslFilter');
        for (var i = 0; i < linked.length; i++) {
            var name = safeCall(function () { return api.getNiceName ? api.getNiceName(linked[i]) : (api.getName ? api.getName(linked[i]) : ''); }, '');
            if (name && (name.indexOf(TAG_SKSL) >= 0 || name.indexOf('Hue/Saturation') >= 0)) {
                return linked[i];
            }
        }
        return null;
    }

    function applyHueSaturationToLayer(layerId, comp, params, liveCode) {
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
        var targetRect = api.primitive('rectangle', 'Hue/Saturation Test Target');
        api.set(targetRect, {
            'generator.dimensions': { x: 250, y: 250 },
            'material.materialColor': { r: 200, g: 80, b: 50, a: 255 }
        });
        selection = [targetRect];
        createdTarget = true;
    }

    if (!selection.length) {
        var msg = 'AE Effects [Hue/Saturation]: No layer selected. Please select one or more layers in Cavalry.';
        var out = {
            ok: false,
            partial: false,
            effect: 'Hue/Saturation',
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
        var res = applyHueSaturationToLayer(layerId, comp, params, liveCode);
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
        effect: 'Hue/Saturation',
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
        console.log('AE Effects: Applied Hue/Saturation (skslFilter) to ' + results.length + ' layer(s)');
    }
    return summary;

    // Standard dual export shim (module exports for tests/CLI, global for panel runners).
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            apply: applyHueSaturationToLayer,
            normalizeParams: normalizeParams,
            PARAM_SPECS: PARAM_SPECS,
            DEFAULTS: DEFAULTS,
            SKSL_SOURCE: SKSL_SOURCE
        };
    } else {
        if (typeof globalThis !== 'undefined') {
            globalThis.AEHueSaturation = { apply: applyHueSaturationToLayer };
        }
    }
})();
