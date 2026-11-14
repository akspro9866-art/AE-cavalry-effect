/**
 * One-Action Reusable Implementation & Applicator:
 * Adobe After Effects "Venetian Blinds" -> Cavalry 2.8+
 *
 * Implemented as a high-performance GPU SkSL Filter (`skslFilter`) with
 * periodic directional stripes, linear transition wipe, and smoothstep edge feathering.
 */
(function () {
    /* @@BEGIN_SKSL@@ */
    var SKSL_SOURCE = "// Adobe After Effects \"Venetian Blinds\" (ADBE Venetian Blinds)\n// Reconstructed mathematically for Cavalry 2.8+ as a high-performance GPU SkSL Filter (`skslFilter`).\n//\n// Built-in Cavalry preamble uniforms:\n//   `layer` (uniform shader) - Source layer texture sampler (layer.eval(coords))\n//   `resolution` (float2)   - Layer bounding dimensions in pixels\n\nuniform shader layer;\n\n// Dynamic attribute uniforms (mapped to Cavalry `inputs.0`..`inputs.3`):\nuniform float TransitionCompletion; // Wipe progress percentage (default: 0.0, range: 0.0 to 100.0)\nuniform float Direction;            // Strip orientation angle in degrees (default: 90.0, range: -360.0 to 360.0)\nuniform float Width;                // Width of each blind strip in pixels (default: 20.0, range: 1.0 to 500.0)\nuniform float Feather;              // Edge softness in pixels (default: 0.0, range: 0.0 to 100.0)\n\nhalf4 main(float2 fragCoord) {\n    if (TransitionCompletion <= 0.001) {\n        return layer.eval(fragCoord);\n    }\n    if (TransitionCompletion >= 99.99) {\n        return half4(0.0);\n    }\n\n    half4 col = layer.eval(fragCoord);\n    if (col.a <= 0.001) {\n        return col;\n    }\n\n    float rad = Direction * 0.017453292519943295;\n    float2 norm = float2(cos(rad), sin(rad));\n\n    float s = dot(fragCoord, norm);\n    float w = max(Width, 1.0);\n\n    float pos = mod(s, w);\n    if (pos < 0.0) pos += w;\n    float t = pos / w; // Normalized fraction across strip [0, 1]\n\n    float comp = clamp(TransitionCompletion * 0.01, 0.0, 1.0);\n    float fNorm = clamp(Feather / w, 0.0, 0.49);\n\n    float mask;\n    if (fNorm <= 0.001) {\n        mask = t >= comp ? 1.0 : 0.0;\n    } else {\n        mask = smoothstep(comp - fNorm, comp + fNorm, t);\n    }\n\n    return col * half(mask);\n}\n";
    /* @@END_SKSL@@ */

    var DEFAULTS = {
        transitionCompletion: 0.0,
        direction: 90.0,
        width: 20.0,
        feather: 0.0
    };

    var TAG_SKSL = '[AE:Venetian Blinds]';

    function safeCall(fn, fallback) {
        try {
            return fn();
        } catch (err) {
            if (typeof globalThis !== 'undefined' && globalThis.AE_EFFECTS_DEBUG && typeof console !== 'undefined' && console.warn) {
                console.warn("[AE:Venetian Blinds]" + ' call failed: ' + (err && err.message ? err.message : err));
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
            transitionCompletion: clampNum(p.transitionCompletion !== undefined ? p.transitionCompletion : p.TransitionCompletion, 0.0, 100.0, DEFAULTS.transitionCompletion),
            direction: clampNum(p.direction !== undefined ? p.direction : p.Direction, -360.0, 360.0, DEFAULTS.direction),
            width: clampNum(p.width !== undefined ? p.width : p.Width, 1.0, 500.0, DEFAULTS.width),
            feather: clampNum(p.feather !== undefined ? p.feather : p.Feather, 0.0, 100.0, DEFAULTS.feather)
        };
    }

    var PARAM_SPECS = [
        { name: 'TransitionCompletion', key: 'transitionCompletion', type: 'double', default: DEFAULTS.transitionCompletion },
        { name: 'Direction', key: 'direction', type: 'double', default: DEFAULTS.direction },
        { name: 'Width', key: 'width', type: 'double', default: DEFAULTS.width },
        { name: 'Feather', key: 'feather', type: 'double', default: DEFAULTS.feather }
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

    function applyVenetianBlinds(targetLayerId, rawOptions) {
        if (!targetLayerId) {
            return {
                status: 'error',
                effect: 'venetian-blinds',
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
                effect: 'venetian-blinds',
                message: 'Failed to create skslFilter node in Cavalry'
            };
        }

        safeCall(function () {
            if (typeof api.setName === 'function') {
                api.setName(filterId, 'Venetian Blinds');
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
            effect: 'venetian-blinds',
            aeMatchName: 'ADBE Venetian Blinds',
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
            var __entryTarget = safeCall(function () { return api.primitive('rectangle', 'AE Venetian Blinds Test Target'); }, null);
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
                effect: 'Venetian Blinds',
                code: 'NO_SELECTION',
                error: 'AE Effects [Venetian Blinds]: No layer selected. Please select one or more layers in Cavalry.',
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
            __entryResults.push(applyVenetianBlinds(__entrySelection[__entryIdx], __entryParams));
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
            effect: 'Venetian Blinds',
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
            console.log('AE Effects: Applied Venetian Blinds (skslFilter) to ' + (__entryResults.length - __entryFailed) + ' layer(s)');
        }
        return __entrySummary;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            apply: applyVenetianBlinds,
            normalizeParams: normalizeParams,
            calculatePadding: calculatePadding,
            PARAM_SPECS: PARAM_SPECS,
            DEFAULTS: DEFAULTS,
            SKSL_SOURCE: SKSL_SOURCE
        };
    } else {
        if (typeof globalThis !== 'undefined') {
            globalThis.AEVenetianBlinds = { apply: applyVenetianBlinds };
        }
    }
})();
