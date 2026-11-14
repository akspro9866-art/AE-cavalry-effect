/**
 * One-Action Reusable Implementation & Applicator:
 * Adobe After Effects "Optics Compensation" -> Cavalry 2.8+
 *
 * Implemented as a high-performance GPU SkSL Filter (`skslFilter`) with
 * spherical tangent radial lens warping, reversible barrel/pincushion projection, and boundary clipping.
 */
(function () {
    /* @@BEGIN_SKSL@@ */
    var SKSL_SOURCE = "// Adobe After Effects \"Optics Compensation\" (ADBE Optics Compensation)\n// Reconstructed mathematically for Cavalry 2.8+ as a high-performance GPU SkSL Filter (`skslFilter`).\n//\n// Built-in Cavalry preamble uniforms:\n//   `layer` (uniform shader) - Source layer texture sampler (layer.eval(coords))\n//   `resolution` (float2)   - Layer bounding dimensions in pixels\n\nuniform shader layer;\n\n// Dynamic attribute uniforms (mapped to Cavalry `inputs.0`..`inputs.3`):\nuniform float FieldOfView;           // Field of View angle in degrees (default: 0.0, range: 0.0 to 160.0)\nuniform float ReverseLensDistortion; // 0 = Expand / Fisheye, 1 = Contract / Barrel\nuniform float ViewCenterX;           // Optical center X in pixels (default: 0.0)\nuniform float ViewCenterY;           // Optical center Y in pixels (default: 0.0)\n\nconst float PI = 3.141592653589793;\n\nhalf4 main(float2 fragCoord) {\n    if (FieldOfView <= 0.01) {\n        return layer.eval(fragCoord);\n    }\n\n    float2 res = max(resolution, float2(1.0, 1.0));\n    float2 halfRes = res * 0.5;\n    float2 center = float2(ViewCenterX, ViewCenterY);\n\n    float2 p = fragCoord - center;\n    float dist = length(p);\n    if (dist <= 0.001) {\n        return layer.eval(fragCoord);\n    }\n\n    float diag = length(halfRes);\n    float normR = dist / max(diag, 1.0);\n\n    // Half angle clamped to safe range (< 85 degrees)\n    float fovClamped = clamp(FieldOfView, 0.1, 160.0);\n    float halfFovRad = (fovClamped * 0.5) * (PI / 180.0);\n    float tanHalfFov = tan(halfFovRad);\n\n    float rPrime;\n    if (ReverseLensDistortion > 0.5) {\n        // Reverse lens distortion: compress coordinates (barrel projection)\n        rPrime = atan(normR * tanHalfFov) / halfFovRad;\n    } else {\n        // Forward lens distortion: expand coordinates (pincushion/fisheye projection)\n        float theta = normR * halfFovRad;\n        if (theta >= 1.55) {\n            return half4(0.0); // Asymptote cutoff\n        }\n        rPrime = tan(theta) / max(tanHalfFov, 1e-4);\n    }\n\n    float2 distortedCoord = center + (p / dist) * (rPrime * diag);\n\n    // Discard coordinates shifted outside canvas bounds\n    if (abs(distortedCoord.x) > halfRes.x || abs(distortedCoord.y) > halfRes.y) {\n        return half4(0.0);\n    }\n\n    return layer.eval(distortedCoord);\n}\n";
    /* @@END_SKSL@@ */

    var DEFAULTS = {
        fieldOfView: 0.0,
        reverseLensDistortion: 0,
        viewCenterX: 0.0,
        viewCenterY: 0.0
    };

    var TAG_SKSL = '[AE:Optics Compensation]';

    function safeCall(fn, fallback) {
        try {
            return fn();
        } catch (err) {
            if (typeof globalThis !== 'undefined' && globalThis.AE_EFFECTS_DEBUG && typeof console !== 'undefined' && console.warn) {
                console.warn("[AE:Optics Compensation]" + ' call failed: ' + (err && err.message ? err.message : err));
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
            fieldOfView: clampNum(p.fieldOfView !== undefined ? p.fieldOfView : p.FieldOfView, 0.0, 160.0, DEFAULTS.fieldOfView),
            reverseLensDistortion: clampNum(p.reverseLensDistortion !== undefined ? p.reverseLensDistortion : p.ReverseLensDistortion, 0, 1, DEFAULTS.reverseLensDistortion),
            viewCenterX: clampNum(p.viewCenterX !== undefined ? p.viewCenterX : p.ViewCenterX, -10000.0, 10000.0, DEFAULTS.viewCenterX),
            viewCenterY: clampNum(p.viewCenterY !== undefined ? p.viewCenterY : p.ViewCenterY, -10000.0, 10000.0, DEFAULTS.viewCenterY)
        };
    }

    var PARAM_SPECS = [
        { name: 'FieldOfView', key: 'fieldOfView', type: 'double', default: DEFAULTS.fieldOfView },
        { name: 'ReverseLensDistortion', key: 'reverseLensDistortion', type: 'double', default: DEFAULTS.reverseLensDistortion },
        { name: 'ViewCenterX', key: 'viewCenterX', type: 'double', default: DEFAULTS.viewCenterX },
        { name: 'ViewCenterY', key: 'viewCenterY', type: 'double', default: DEFAULTS.viewCenterY }
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

    function applyOpticsCompensation(targetLayerId, rawOptions) {
        if (!targetLayerId) {
            return {
                status: 'error',
                effect: 'optics-compensation',
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
                effect: 'optics-compensation',
                message: 'Failed to create skslFilter node in Cavalry'
            };
        }

        safeCall(function () {
            if (typeof api.setName === 'function') {
                api.setName(filterId, 'Optics Compensation');
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
            effect: 'optics-compensation',
            aeMatchName: 'ADBE Optics Compensation',
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
            var __entryTarget = safeCall(function () { return api.primitive('rectangle', 'AE Optics Compensation Test Target'); }, null);
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
                effect: 'Optics Compensation',
                code: 'NO_SELECTION',
                error: 'AE Effects [Optics Compensation]: No layer selected. Please select one or more layers in Cavalry.',
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
            __entryResults.push(applyOpticsCompensation(__entrySelection[__entryIdx], __entryParams));
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
            effect: 'Optics Compensation',
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
            console.log('AE Effects: Applied Optics Compensation (skslFilter) to ' + (__entryResults.length - __entryFailed) + ' layer(s)');
        }
        return __entrySummary;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            apply: applyOpticsCompensation,
            normalizeParams: normalizeParams,
            calculatePadding: calculatePadding,
            PARAM_SPECS: PARAM_SPECS,
            DEFAULTS: DEFAULTS,
            SKSL_SOURCE: SKSL_SOURCE
        };
    } else {
        if (typeof globalThis !== 'undefined') {
            globalThis.AEOpticsCompensation = { apply: applyOpticsCompensation };
        }
    }
})();
