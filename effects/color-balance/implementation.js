/**
 * One-Action Reusable Implementation & Applicator:
 * Adobe After Effects "Color Balance" -> Cavalry 2.8+
 *
 * Implemented as a high-performance GPU SkSL Filter (`skslFilter`) with
 * luminance-based tonal zone weighting and automatic luminosity preservation.
 */
(function () {
    /* @@BEGIN_SKSL@@ */
    var SKSL_SOURCE = "// Adobe After Effects \"Color Balance\" (ADBE Color Balance2)\n// Reconstructed mathematically for Cavalry 2.8+ as a high-performance GPU SkSL Filter (`skslFilter`).\n//\n// Built-in Cavalry preamble uniforms:\n//   `layer` (uniform shader) - Source layer texture sampler (layer.eval(coords))\n//   `resolution` (float2)   - Layer bounding dimensions in pixels\n\nuniform shader layer;\n\n// Dynamic attribute uniforms (mapped to Cavalry `inputs.0`..`inputs.9`):\nuniform float ShadowRed;          // Range: -100.0 to 100.0 (default: 0.0)\nuniform float ShadowGreen;        // Range: -100.0 to 100.0 (default: 0.0)\nuniform float ShadowBlue;         // Range: -100.0 to 100.0 (default: 0.0)\n\nuniform float MidtoneRed;         // Range: -100.0 to 100.0 (default: 0.0)\nuniform float MidtoneGreen;       // Range: -100.0 to 100.0 (default: 0.0)\nuniform float MidtoneBlue;        // Range: -100.0 to 100.0 (default: 0.0)\n\nuniform float HighlightRed;       // Range: -100.0 to 100.0 (default: 0.0)\nuniform float HighlightGreen;     // Range: -100.0 to 100.0 (default: 0.0)\nuniform float HighlightBlue;      // Range: -100.0 to 100.0 (default: 0.0)\n\nuniform float PreserveLuminosity; // 0 = Off, 1 = On (default: 1.0)\n\nfloat calcLuminance(float3 c) {\n    return dot(c, float3(0.299, 0.587, 0.114));\n}\n\nhalf4 main(float2 fragCoord) {\n    half4 col = layer.eval(fragCoord);\n    if (col.a <= 0.0001) {\n        return col;\n    }\n\n    float3 rgb = float3(col.rgb) / float(col.a);\n    float yIn = calcLuminance(rgb);\n\n    // Smooth luminance-based tonal weights\n    float ws = clamp(1.0 - 2.0 * yIn, 0.0, 1.0);\n    ws = ws * ws;\n\n    float wm = clamp(1.0 - abs(2.0 * yIn - 1.0), 0.0, 1.0);\n    wm = wm * wm;\n\n    float wh = clamp(2.0 * yIn - 1.0, 0.0, 1.0);\n    wh = wh * wh;\n\n    float sumW = max(ws + wm + wh, 1e-4);\n    ws /= sumW;\n    wm /= sumW;\n    wh /= sumW;\n\n    float3 deltaShadow = float3(ShadowRed, ShadowGreen, ShadowBlue) * 0.01;\n    float3 deltaMidtone = float3(MidtoneRed, MidtoneGreen, MidtoneBlue) * 0.01;\n    float3 deltaHighlight = float3(HighlightRed, HighlightGreen, HighlightBlue) * 0.01;\n\n    float3 delta = ws * deltaShadow + wm * deltaMidtone + wh * deltaHighlight;\n    float3 adjusted = clamp(rgb + delta, 0.0, 1.0);\n\n    if (PreserveLuminosity > 0.5) {\n        float yOut = calcLuminance(adjusted);\n        adjusted = clamp(adjusted + (yIn - yOut), 0.0, 1.0);\n    }\n\n    return half4(half3(adjusted * float(col.a)), col.a);\n}\n";
    /* @@END_SKSL@@ */

    var DEFAULTS = {
        shadowRed: 0.0, shadowGreen: 0.0, shadowBlue: 0.0,
        midtoneRed: 0.0, midtoneGreen: 0.0, midtoneBlue: 0.0,
        highlightRed: 0.0, highlightGreen: 0.0, highlightBlue: 0.0,
        preserveLuminosity: 1.0
    };

    var TAG_SKSL = '[AE:Color Balance]';

    function safeCall(fn, fallback) {
        try {
            return fn();
        } catch (err) {
            if (typeof globalThis !== 'undefined' && globalThis.AE_EFFECTS_DEBUG && typeof console !== 'undefined' && console.warn) {
                console.warn("[AE:Color Balance]" + ' call failed: ' + (err && err.message ? err.message : err));
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
            shadowRed: clampNum(p.shadowRed !== undefined ? p.shadowRed : p.ShadowRed, -100.0, 100.0, DEFAULTS.shadowRed),
            shadowGreen: clampNum(p.shadowGreen !== undefined ? p.shadowGreen : p.ShadowGreen, -100.0, 100.0, DEFAULTS.shadowGreen),
            shadowBlue: clampNum(p.shadowBlue !== undefined ? p.shadowBlue : p.ShadowBlue, -100.0, 100.0, DEFAULTS.shadowBlue),
            midtoneRed: clampNum(p.midtoneRed !== undefined ? p.midtoneRed : p.MidtoneRed, -100.0, 100.0, DEFAULTS.midtoneRed),
            midtoneGreen: clampNum(p.midtoneGreen !== undefined ? p.midtoneGreen : p.MidtoneGreen, -100.0, 100.0, DEFAULTS.midtoneGreen),
            midtoneBlue: clampNum(p.midtoneBlue !== undefined ? p.midtoneBlue : p.MidtoneBlue, -100.0, 100.0, DEFAULTS.midtoneBlue),
            highlightRed: clampNum(p.highlightRed !== undefined ? p.highlightRed : p.HighlightRed, -100.0, 100.0, DEFAULTS.highlightRed),
            highlightGreen: clampNum(p.highlightGreen !== undefined ? p.highlightGreen : p.HighlightGreen, -100.0, 100.0, DEFAULTS.highlightGreen),
            highlightBlue: clampNum(p.highlightBlue !== undefined ? p.highlightBlue : p.HighlightBlue, -100.0, 100.0, DEFAULTS.highlightBlue),
            preserveLuminosity: clampNum(p.preserveLuminosity !== undefined ? p.preserveLuminosity : p.PreserveLuminosity, 0, 1, DEFAULTS.preserveLuminosity)
        };
    }

    var PARAM_SPECS = [
        { name: 'ShadowRed', key: 'shadowRed', type: 'double', default: DEFAULTS.shadowRed },
        { name: 'ShadowGreen', key: 'shadowGreen', type: 'double', default: DEFAULTS.shadowGreen },
        { name: 'ShadowBlue', key: 'shadowBlue', type: 'double', default: DEFAULTS.shadowBlue },
        { name: 'MidtoneRed', key: 'midtoneRed', type: 'double', default: DEFAULTS.midtoneRed },
        { name: 'MidtoneGreen', key: 'midtoneGreen', type: 'double', default: DEFAULTS.midtoneGreen },
        { name: 'MidtoneBlue', key: 'midtoneBlue', type: 'double', default: DEFAULTS.midtoneBlue },
        { name: 'HighlightRed', key: 'highlightRed', type: 'double', default: DEFAULTS.highlightRed },
        { name: 'HighlightGreen', key: 'highlightGreen', type: 'double', default: DEFAULTS.highlightGreen },
        { name: 'HighlightBlue', key: 'highlightBlue', type: 'double', default: DEFAULTS.highlightBlue },
        { name: 'PreserveLuminosity', key: 'preserveLuminosity', type: 'double', default: DEFAULTS.preserveLuminosity }
    ];

    function calculatePadding() {
        return { x: 0, y: 0 };
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
        for (var idx = 0; idx < 32; idx++) {
            var slot = groupAttr + '.' + idx;
            var hasSlotInAttrs = attrs.indexOf(slot) >= 0;
            var curName = typeof api.getCustomAttributeName === 'function'
                ? safeCall(function () { return api.getCustomAttributeName(nodeId, slot); }, '')
                : '';
            var slotClaimed = claimedSlots && claimedSlots[slot];

            if (hasSlotInAttrs && curName === uniformName && !slotClaimed) {
                setAttrValue(nodeId, slot, setVal);
                return slot;
            }
            if (firstPlaceholder === null && !slotClaimed) {
                if (!hasSlotInAttrs) {
                    firstPlaceholder = slot;
                } else if (!curName || curName.indexOf(uniformName) === 0 || curName.indexOf('inputs.') === 0) {
                    firstPlaceholder = slot;
                }
            }
        }

        if (firstPlaceholder && typeof api.addDynamic === 'function') {
            var added = safeCall(function () {
                return api.addDynamic(nodeId, groupAttr, attrType);
            }, false);

            var resolvedSlot = typeof added === 'string' && added.length > 0 ? added : firstPlaceholder;
            if (typeof api.renameAttribute === 'function') {
                safeCall(function () {
                    api.renameAttribute(nodeId, resolvedSlot, uniformName);
                }, null);
            }
            setAttrValue(nodeId, resolvedSlot, setVal);
            return resolvedSlot;
        }

        return null;
    }

    function cleanShaderSource(raw) {
        return raw.replace(/^\s*uniform\s+[a-zA-Z0-9_]+\s+[a-zA-Z0-9_]+;\s*$/gm, function (match) {
            if (match.indexOf('uniform shader layer;') >= 0) {
                return match;
            }
            return '// ' + match.trim() + ' (dynamic attribute)';
        });
    }

    function applyColorBalance(targetLayerId, rawOptions) {
        if (!targetLayerId) {
            return {
                status: 'error',
                effect: 'color-balance',
                message: 'No target layer ID provided'
            };
        }

        var params = normalizeParams(rawOptions);
        var filterId = safeCall(function () {
            return api.create('skslFilter');
        }, null);

        if (!filterId) {
            return {
                status: 'error',
                effect: 'color-balance',
                message: 'Failed to create skslFilter node in Cavalry'
            };
        }

        safeCall(function () {
            if (typeof api.setName === 'function') {
                api.setName(filterId, 'Color Balance');
            }
        }, null);

        var shaderCode = cleanShaderSource(SKSL_SOURCE);
        var codeSetOk = setAttrValue(filterId, 'code', shaderCode);
        if (!codeSetOk) {
            codeSetOk = setAttrValue(filterId, 'shader', shaderCode);
        }

        var claimedSlots = {};
        var boundAttributes = {};

        for (var p = 0; p < PARAM_SPECS.length; p++) {
            var spec = PARAM_SPECS[p];
            var val = params[spec.key];
            var boundSlot = bindDynamicSlot(filterId, 'inputs', spec, val, claimedSlots);
            if (boundSlot) {
                claimedSlots[boundSlot] = true;
                boundAttributes[spec.name] = boundSlot;
            }
        }

        var connOk = safeCall(function () {
            if (typeof api.connect === 'function') {
                return api.connect(filterId, 'output', targetLayerId, 'filters');
            }
            return false;
        }, false);

        if (!connOk) {
            connOk = safeCall(function () {
                if (typeof api.addFilter === 'function') {
                    return api.addFilter(targetLayerId, filterId);
                }
                return false;
            }, false);
        }

        var inspectPayload = safeCall(function () {
            if (typeof api.getAttributes === 'function') {
                return {
                    filterId: filterId,
                    targetLayerId: targetLayerId,
                    attributes: api.getAttributes(filterId)
                };
            }
            return null;
        }, null);

        return {
            status: 'success',
            effect: 'color-balance',
            aeMatchName: 'ADBE Color Balance2',
            nodeId: filterId,
            targetLayerId: targetLayerId,
            connected: Boolean(connOk),
            codeConfigured: Boolean(codeSetOk),
            boundAttributes: boundAttributes,
            parameters: params,
            inspect: inspectPayload
        };
    }

    // Runner entry (panel / CLI / mock): when executed with __EFFECT_CONFIG__ present,
    // apply to the current selection and surface a structured summary via __result.
    if (typeof __EFFECT_CONFIG__ !== 'undefined' && __EFFECT_CONFIG__) {
        var __entryCfg = __EFFECT_CONFIG__ || {};
        var __entryParams = __entryCfg.params || {};
        var __entrySelection = safeCall(function () { return api.getSelection(); }, []) || [];
        var __entryCreated = false;
        if (!__entrySelection.length && __entryCfg.createTestTargetIfEmpty) {
            var __entryTarget = safeCall(function () { return api.primitive('rectangle', 'AE Color Balance Test Target'); }, null);
            if (__entryTarget) {
                safeCall(function () {
                    api.set(__entryTarget, { 'generator.dimensions': { x: 250, y: 250 } });
                }, null);
                safeCall(function () { api.select([__entryTarget]); }, null);
                __entrySelection = [__entryTarget];
                __entryCreated = true;
            }
        }
        if (!__entrySelection.length) {
            var __entryNoSel = {
                ok: false,
                partial: false,
                effect: 'Color Balance',
                code: 'NO_SELECTION',
                error: 'AE Effects [Color Balance]: No layer selected. Please select one or more layers in Cavalry.',
                appliedCount: 0,
                failedCount: 1,
                warnings: [],
                results: [],
                targets: []
            };
            try { __result = __entryNoSel; } catch (e) {}
            if (typeof console !== 'undefined' && console.warn) console.warn(__entryNoSel.error);
            return __entryNoSel;
        }
        var __entryResults = [];
        for (var __entryIdx = 0; __entryIdx < __entrySelection.length; __entryIdx++) {
            __entryResults.push(applyColorBalance(__entrySelection[__entryIdx], __entryParams));
        }
        safeCall(function () { api.select(__entrySelection); }, null);

        var __entryFailed = 0;
        var __entryWarnings = [];
        for (var __entryScan = 0; __entryScan < __entryResults.length; __entryScan++) {
            if (!__entryResults[__entryScan] || __entryResults[__entryScan].status !== 'success') {
                __entryFailed++;
            }
            if (__entryResults[__entryScan] && Array.isArray(__entryResults[__entryScan].warnings)) {
                __entryWarnings = __entryWarnings.concat(__entryResults[__entryScan].warnings);
            }
        }
        var __entryOk = __entryResults.length > 0 && __entryFailed === 0;
        var __entryPartial = __entryFailed > 0 && __entryFailed < __entryResults.length;
        var __entrySummary = {
            ok: __entryOk,
            partial: __entryPartial,
            effect: 'Color Balance',
            code: __entryOk ? 'SUCCESS' : (__entryPartial ? 'PARTIAL_SUCCESS' : 'RUNTIME_EXCEPTION'),
            error: __entryOk ? null : (__entryFailed + ' layer(s) failed'),
            strategy: 'skslFilter',
            appliedCount: __entryResults.length - __entryFailed,
            failedCount: __entryFailed,
            warnings: __entryWarnings,
            targets: __entrySelection.slice(),
            createdTarget: __entryCreated,
            results: __entryResults,
            params: __entryParams
        };
        try { __result = __entrySummary; } catch (e) {}
        if (typeof console !== 'undefined' && console.log) {
            console.log('AE Effects: Applied Color Balance (skslFilter) to ' + (__entryResults.length - __entryFailed) + ' layer(s)');
        }
        return __entrySummary;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            apply: applyColorBalance,
            normalizeParams: normalizeParams,
            calculatePadding: calculatePadding,
            PARAM_SPECS: PARAM_SPECS,
            DEFAULTS: DEFAULTS,
            SKSL_SOURCE: SKSL_SOURCE
        };
    } else {
        if (typeof globalThis !== 'undefined') {
            globalThis.AEColorBalance = { apply: applyColorBalance };
        }
    }
})();
