/**
 * One-Action Reusable Implementation & Applicator:
 * Adobe After Effects "Gradient Ramp" -> Cavalry 2.8+
 *
 * Implemented as a high-performance GPU SkSL Filter (`skslFilter`) with
 * spatial linear and radial vector projections, anti-banding scatter dither, and alpha blending.
 */
(function () {
    /* @@BEGIN_SKSL@@ */
    var SKSL_SOURCE = "// Adobe After Effects \"Gradient Ramp\" (ADBE Ramp)\n// Reconstructed mathematically for Cavalry 2.8+ as a high-performance GPU SkSL Filter (`skslFilter`).\n//\n// Built-in Cavalry preamble uniforms:\n//   `layer` (uniform shader) - Source layer texture sampler (layer.eval(coords))\n//   `resolution` (float2)   - Layer bounding dimensions in pixels\n\nuniform shader layer;\n\n// Dynamic attribute uniforms (mapped to Cavalry `inputs.0`..`inputs.12`):\nuniform float StartPointX;        // Start position X in pixels (default: -100.0)\nuniform float StartPointY;        // Start position Y in pixels (default: -100.0)\nuniform float4 StartColor;        // Start color RGBA (default: [0.0, 0.0, 0.0, 1.0])\n\nuniform float EndPointX;          // End position X in pixels (default: 100.0)\nuniform float EndPointY;          // End position Y in pixels (default: 100.0)\nuniform float4 EndColor;          // End color RGBA (default: [1.0, 1.0, 1.0, 1.0])\n\nuniform float RampShape;          // 0 = Linear Ramp, 1 = Radial Ramp\nuniform float RampScatter;        // Dither scatter percentage (default: 0.0, range: 0.0 to 100.0)\nuniform float BlendWithOriginal;  // Blend percentage (default: 0.0, range: 0.0 to 100.0)\n\nfloat pseudoRandom(float2 p) {\n    return fract(sin(dot(p, float2(12.9898, 78.233))) * 43758.5453);\n}\n\nhalf4 main(float2 fragCoord) {\n    half4 orig = layer.eval(fragCoord);\n\n    float2 p0 = float2(StartPointX, StartPointY);\n    float2 p1 = float2(EndPointX, EndPointY);\n\n    float t = 0.0;\n    if (RampShape > 0.5) {\n        // Radial Ramp\n        float r = length(p1 - p0);\n        float d = length(fragCoord - p0);\n        t = clamp(d / max(r, 0.001), 0.0, 1.0);\n    } else {\n        // Linear Ramp\n        float2 v = p1 - p0;\n        float lenSq = dot(v, v);\n        if (lenSq > 0.0001) {\n            t = clamp(dot(fragCoord - p0, v) / lenSq, 0.0, 1.0);\n        }\n    }\n\n    // Ramp scatter (spatial dithering)\n    if (RampScatter > 0.01) {\n        float noise = (pseudoRandom(fragCoord) - 0.5) * (RampScatter * 0.01) * 0.05;\n        t = clamp(t + noise, 0.0, 1.0);\n    }\n\n    half4 rampCol = half4(mix(StartColor, EndColor, t));\n\n    // When layer has alpha, modulate ramp by layer alpha or blend\n    float blendFactor = clamp(BlendWithOriginal * 0.01, 0.0, 1.0);\n\n    if (orig.a <= 0.001) {\n        // Transparent source region: display pure ramp\n        return rampCol;\n    }\n\n    // Composite ramp over layer, respecting original alpha\n    half4 rampModulated = rampCol * orig.a;\n    return mix(rampModulated, orig, half(blendFactor));\n}\n";
    /* @@END_SKSL@@ */

    var DEFAULTS = {
        startPointX: -100.0,
        startPointY: -100.0,
        startColor: { r: 0, g: 0, b: 0, a: 255 },
        endPointX: 100.0,
        endPointY: 100.0,
        endColor: { r: 255, g: 255, b: 255, a: 255 },
        rampShape: 0,
        rampScatter: 0.0,
        blendWithOriginal: 0.0
    };

    var TAG_SKSL = '[AE:Gradient Ramp]';

    function safeCall(fn, fallback) {
        try {
            return fn();
        } catch (err) {
            if (typeof globalThis !== 'undefined' && globalThis.AE_EFFECTS_DEBUG && typeof console !== 'undefined' && console.warn) {
                console.warn("[AE:Gradient Ramp]" + ' call failed: ' + (err && err.message ? err.message : err));
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
            startPointX: clampNum(p.startPointX !== undefined ? p.startPointX : p.StartPointX, -10000.0, 10000.0, DEFAULTS.startPointX),
            startPointY: clampNum(p.startPointY !== undefined ? p.startPointY : p.StartPointY, -10000.0, 10000.0, DEFAULTS.startPointY),
            startColor: resolveColor(p.startColor !== undefined ? p.startColor : p.StartColor, DEFAULTS.startColor),
            endPointX: clampNum(p.endPointX !== undefined ? p.endPointX : p.EndPointX, -10000.0, 10000.0, DEFAULTS.endPointX),
            endPointY: clampNum(p.endPointY !== undefined ? p.endPointY : p.EndPointY, -10000.0, 10000.0, DEFAULTS.endPointY),
            endColor: resolveColor(p.endColor !== undefined ? p.endColor : p.EndColor, DEFAULTS.endColor),
            rampShape: clampNum(p.rampShape !== undefined ? p.rampShape : p.RampShape, 0, 1, DEFAULTS.rampShape),
            rampScatter: clampNum(p.rampScatter !== undefined ? p.rampScatter : p.RampScatter, 0.0, 100.0, DEFAULTS.rampScatter),
            blendWithOriginal: clampNum(p.blendWithOriginal !== undefined ? p.blendWithOriginal : p.BlendWithOriginal, 0.0, 100.0, DEFAULTS.blendWithOriginal)
        };
    }

    var PARAM_SPECS = [
        { name: 'StartPointX', key: 'startPointX', type: 'double', default: DEFAULTS.startPointX },
        { name: 'StartPointY', key: 'startPointY', type: 'double', default: DEFAULTS.startPointY },
        { name: 'StartColor', key: 'startColor', type: 'color', default: DEFAULTS.startColor },
        { name: 'EndPointX', key: 'endPointX', type: 'double', default: DEFAULTS.endPointX },
        { name: 'EndPointY', key: 'endPointY', type: 'double', default: DEFAULTS.endPointY },
        { name: 'EndColor', key: 'endColor', type: 'color', default: DEFAULTS.endColor },
        { name: 'RampShape', key: 'rampShape', type: 'double', default: DEFAULTS.rampShape },
        { name: 'RampScatter', key: 'rampScatter', type: 'double', default: DEFAULTS.rampScatter },
        { name: 'BlendWithOriginal', key: 'blendWithOriginal', type: 'double', default: DEFAULTS.blendWithOriginal }
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

    function applyGradientRamp(targetLayerId, rawOptions) {
        if (!targetLayerId) {
            return {
                status: 'error',
                effect: 'gradient-ramp',
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
                effect: 'gradient-ramp',
                message: 'Failed to create skslFilter node in Cavalry'
            };
        }

        safeCall(function () {
            if (typeof api.setName === 'function') {
                api.setName(filterId, 'Gradient Ramp');
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
            effect: 'gradient-ramp',
            aeMatchName: 'ADBE Ramp',
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
            var __entryTarget = safeCall(function () { return api.primitive('rectangle', 'AE Gradient Ramp Test Target'); }, null);
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
                effect: 'Gradient Ramp',
                code: 'NO_SELECTION',
                error: 'AE Effects [Gradient Ramp]: No layer selected. Please select one or more layers in Cavalry.',
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
            __entryResults.push(applyGradientRamp(__entrySelection[__entryIdx], __entryParams));
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
            effect: 'Gradient Ramp',
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
            console.log('AE Effects: Applied Gradient Ramp (skslFilter) to ' + (__entryResults.length - __entryFailed) + ' layer(s)');
        }
        return __entrySummary;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            apply: applyGradientRamp,
            normalizeParams: normalizeParams,
            calculatePadding: calculatePadding,
            PARAM_SPECS: PARAM_SPECS,
            DEFAULTS: DEFAULTS,
            SKSL_SOURCE: SKSL_SOURCE
        };
    } else {
        if (typeof globalThis !== 'undefined') {
            globalThis.AEGradientRamp = { apply: applyGradientRamp };
        }
    }
})();
