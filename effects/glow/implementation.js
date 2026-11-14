/**
 * One-Action Reusable Implementation & Applicator:
 * Adobe After Effects "Glow" -> Cavalry 2.8+
 *
 * Implemented as a high-performance GPU SkSL Filter (`skslFilter`) with
 * luminance threshold gating, 24-tap Vogel spiral diffusion, and A/B color ramp looping.
 */
(function () {
    /* @@BEGIN_SKSL@@ */
    var SKSL_SOURCE = "// Adobe After Effects \"Glow\" (ADBE Glo2)\n// Reconstructed mathematically for Cavalry 2.8+ as a high-performance GPU SkSL Filter (`skslFilter`).\n//\n// Built-in Cavalry preamble uniforms (injected automatically by Cavalry runtime):\n//   `layer` (uniform shader) - Source layer texture sampler (layer.eval(coords))\n//   `resolution` (float2)   - Bounding dimensions in pixels (centered coordinate space)\n\nuniform shader layer;\n\n// Dynamic attribute uniforms (mapped to Cavalry `inputs.0`..`inputs.10`):\nuniform float GlowBasedOn;        // 0 = Color Channels, 1 = Alpha Channel\nuniform float GlowThreshold;      // Brightness threshold percent (default: 60.0, range: 0.0 to 100.0)\nuniform float GlowRadius;         // Diffusion radius in pixels (default: 10.0, range: 0.0 to 500.0)\nuniform float GlowIntensity;      // Intensity multiplier (default: 1.0, range: 0.0 to 10.0)\nuniform float CompositeOriginal;  // 0 = Behind, 1 = On Top, 2 = None\nuniform float GlowOperation;      // 0 = Add, 1 = Screen\nuniform float GlowColors;         // 0 = Original Colors, 1 = A & B Colors\nuniform half4 ColorA;             // Swatch A (default: RGB(255, 255, 255))\nuniform half4 ColorB;             // Swatch B (default: RGB(0, 0, 0))\nuniform float ColorLooping;       // Ramp cycles (default: 1.0)\nuniform float ColorPhase;         // Phase offset in degrees (default: 0.0)\n\nfloat extractGlowFactor(half4 s, float threshNorm, bool useAlpha) {\n    if (useAlpha) {\n        float a = float(s.a);\n        if (a <= threshNorm) return 0.0;\n        return clamp((a - threshNorm) / max(1.0 - threshNorm, 1e-4), 0.0, 1.0);\n    }\n    float a = max(float(s.a), 1e-4);\n    float3 unmult = float3(s.rgb) / a;\n    float luma = dot(unmult, float3(0.299, 0.587, 0.114));\n    if (luma <= threshNorm) return 0.0;\n    return clamp((luma - threshNorm) / max(1.0 - threshNorm, 1e-4), 0.0, 1.0);\n}\n\nhalf4 main(float2 fragCoord) {\n    half4 src = layer.eval(fragCoord);\n\n    if (GlowIntensity <= 0.001) {\n        return src;\n    }\n\n    float threshNorm = GlowThreshold / 100.0;\n    bool useAlpha = (GlowBasedOn > 0.5);\n    float maxR = max(GlowRadius, 1.0);\n\n    // 24-tap Vogel golden spiral for smooth multi-stage glow diffusion\n    half3 glowAccum = half3(0.0);\n    float glowAlphaAccum = 0.0;\n    float totalW = 0.0;\n\n    for (int i = 0; i < 24; i++) {\n        float fi = float(i);\n        float r = maxR * sqrt((fi + 0.5) / 24.0);\n        float phi = fi * 2.39996323; // Golden angle\n        float2 offset = float2(cos(phi), sin(phi)) * r;\n        float w = exp(-(r * r) / (2.0 * maxR * maxR * 0.3));\n\n        half4 tapCol = layer.eval(fragCoord + offset);\n        float factor = extractGlowFactor(tapCol, threshNorm, useAlpha);\n\n        glowAccum += tapCol.rgb * half(factor * w);\n        glowAlphaAccum += float(tapCol.a) * factor * w;\n        totalW += w;\n    }\n\n    float normW = max(totalW, 1e-4);\n    glowAccum = (glowAccum / half(normW)) * half(GlowIntensity);\n    float glowAlpha = clamp((glowAlphaAccum / normW) * GlowIntensity, 0.0, 1.0);\n\n    // Colorize A & B Colors mode\n    if (GlowColors > 0.5) {\n        float glowLuma = dot(float3(glowAccum), float3(0.299, 0.587, 0.114));\n        float t = fract(glowLuma * max(ColorLooping, 1.0) + ColorPhase / 360.0);\n        half3 mappedCol = mix(ColorA.rgb, ColorB.rgb, half(t));\n        glowAccum = mappedCol * half(glowAlpha);\n    }\n\n    // Compositing\n    int compMode = int(floor(CompositeOriginal + 0.5));\n    int opMode = int(floor(GlowOperation + 0.5));\n\n    if (compMode == 2) {\n        // None: Glow Only\n        return half4(glowAccum, half(glowAlpha));\n    }\n\n    half3 finalRgb = half3(0.0);\n    if (opMode == 0) {\n        // Add\n        finalRgb = src.rgb + glowAccum;\n    } else {\n        // Screen\n        finalRgb = src.rgb + glowAccum - (src.rgb * glowAccum);\n    }\n\n    float finalAlpha = max(float(src.a), glowAlpha);\n    return half4(clamp(finalRgb, half3(0.0), half3(1.0)), half(finalAlpha));\n}\n";
    /* @@END_SKSL@@ */

    var DEFAULTS = {
        glowBasedOn: 0,
        glowThreshold: 60.0,
        glowRadius: 10.0,
        glowIntensity: 1.0,
        compositeOriginal: 0,
        glowOperation: 0,
        glowColors: 0,
        colorA: { r: 255, g: 255, b: 255, a: 255 },
        colorB: { r: 0, g: 0, b: 0, a: 255 },
        colorLooping: 1.0,
        colorPhase: 0.0
    };

    var TAG_SKSL = '[AE:Glow]';

    function safeCall(fn, fallback) {
        try {
            return fn();
        } catch (err) {
            if (typeof globalThis !== 'undefined' && globalThis.AE_EFFECTS_DEBUG && typeof console !== 'undefined' && console.warn) {
                console.warn("[AE:Glow]" + ' call failed: ' + (err && err.message ? err.message : err));
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
            glowBasedOn: clampNum(p.glowBasedOn !== undefined ? p.glowBasedOn : p.GlowBasedOn, 0, 1, DEFAULTS.glowBasedOn),
            glowThreshold: clampNum(p.glowThreshold !== undefined ? p.glowThreshold : p.GlowThreshold, 0.0, 100.0, DEFAULTS.glowThreshold),
            glowRadius: clampNum(p.glowRadius !== undefined ? p.glowRadius : p.GlowRadius, 0.0, 500.0, DEFAULTS.glowRadius),
            glowIntensity: clampNum(p.glowIntensity !== undefined ? p.glowIntensity : p.GlowIntensity, 0.0, 10.0, DEFAULTS.glowIntensity),
            compositeOriginal: clampNum(p.compositeOriginal !== undefined ? p.compositeOriginal : p.CompositeOriginal, 0, 2, DEFAULTS.compositeOriginal),
            glowOperation: clampNum(p.glowOperation !== undefined ? p.glowOperation : p.GlowOperation, 0, 1, DEFAULTS.glowOperation),
            glowColors: clampNum(p.glowColors !== undefined ? p.glowColors : p.GlowColors, 0, 1, DEFAULTS.glowColors),
            colorA: resolveColor(p.colorA !== undefined ? p.colorA : p.ColorA, DEFAULTS.colorA),
            colorB: resolveColor(p.colorB !== undefined ? p.colorB : p.ColorB, DEFAULTS.colorB),
            colorLooping: clampNum(p.colorLooping !== undefined ? p.colorLooping : p.ColorLooping, 1.0, 10.0, DEFAULTS.colorLooping),
            colorPhase: clampNum(p.colorPhase !== undefined ? p.colorPhase : p.ColorPhase, 0.0, 360.0, DEFAULTS.colorPhase)
        };
    }

    var PARAM_SPECS = [
        { name: 'GlowBasedOn', key: 'glowBasedOn', type: 'double', default: DEFAULTS.glowBasedOn },
        { name: 'GlowThreshold', key: 'glowThreshold', type: 'double', default: DEFAULTS.glowThreshold },
        { name: 'GlowRadius', key: 'glowRadius', type: 'double', default: DEFAULTS.glowRadius },
        { name: 'GlowIntensity', key: 'glowIntensity', type: 'double', default: DEFAULTS.glowIntensity },
        { name: 'CompositeOriginal', key: 'compositeOriginal', type: 'double', default: DEFAULTS.compositeOriginal },
        { name: 'GlowOperation', key: 'glowOperation', type: 'double', default: DEFAULTS.glowOperation },
        { name: 'GlowColors', key: 'glowColors', type: 'double', default: DEFAULTS.glowColors },
        { name: 'ColorA', key: 'colorA', type: 'color', default: DEFAULTS.colorA },
        { name: 'ColorB', key: 'colorB', type: 'color', default: DEFAULTS.colorB },
        { name: 'ColorLooping', key: 'colorLooping', type: 'double', default: DEFAULTS.colorLooping },
        { name: 'ColorPhase', key: 'colorPhase', type: 'double', default: DEFAULTS.colorPhase }
    ];

    function calculatePadding(params) {
        var r = params.glowRadius || 0.0;
        var p = Math.ceil(r * 2.0 + 20);
        return { x: p, y: p };
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
            if (name && (name.indexOf(TAG_SKSL) >= 0 || (name.indexOf('Glow') >= 0 && name.indexOf('Deep') < 0))) {
                return linked[i];
            }
        }
        return null;
    }

    function applyGlowToLayer(layerId, comp, params, liveCode) {
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
        var targetRect = api.primitive('rectangle', 'Glow Test Target');
        api.set(targetRect, {
            'generator.dimensions': { x: 250, y: 250 },
            'material.materialColor': { r: 255, g: 180, b: 50, a: 255 }
        });
        selection = [targetRect];
        createdTarget = true;
    }

    if (!selection.length) {
        var msg = 'AE Effects [Glow]: No layer selected. Please select one or more layers in Cavalry.';
        var out = {
            ok: false,
            partial: false,
            effect: 'Glow',
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
        var res = applyGlowToLayer(layerId, comp, params, liveCode);
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
        effect: 'Glow',
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
        console.log('AE Effects: Applied Glow (skslFilter) to ' + results.length + ' layer(s)');
    }
    return summary;

    // Standard dual export shim (module exports for tests/CLI, global for panel runners).
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            apply: applyGlowToLayer,
            normalizeParams: normalizeParams,
            calculatePadding: calculatePadding,
            PARAM_SPECS: PARAM_SPECS,
            DEFAULTS: DEFAULTS,
            SKSL_SOURCE: SKSL_SOURCE
        };
    } else {
        if (typeof globalThis !== 'undefined') {
            globalThis.AEGlow = { apply: applyGlowToLayer };
        }
    }
})();
