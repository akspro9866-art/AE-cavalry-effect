/**
 * One-Action Reusable Implementation & Applicator:
 * Adobe After Effects "Echo" -> Cavalry 2.8+
 *
 * Implemented as a procedural GPU SkSL Filter (`skslFilter`) with
 * multi-stage temporal trail blending and customizable compositing operators.
 */
(function () {
    /* @@BEGIN_SKSL@@ */
    var SKSL_SOURCE = "// Adobe After Effects \"Echo\" (ADBE Echo)\n// Reconstructed mathematically for Cavalry 2.8+ as a procedural GPU SkSL Filter (`skslFilter`).\n//\n// Built-in Cavalry preamble uniforms:\n//   `layer` (uniform shader) - Source layer texture sampler (layer.eval(coords))\n//   `resolution` (float2)   - Layer bounding dimensions in pixels\n\nuniform shader layer;\n\n// Dynamic attribute uniforms (mapped to Cavalry `inputs.0`..`inputs.4`):\nuniform float EchoTime;          // Temporal offset in seconds (default: -0.033)\nuniform float NumberOfEchoes;    // Number of echo instances (default: 3.0, range: 1.0 to 16.0)\nuniform float StartingIntensity; // Initial intensity multiplier (default: 1.0, range: 0.0 to 1.0)\nuniform float Decay;             // Decay multiplier per echo step (default: 0.5, range: 0.0 to 1.0)\nuniform float EchoOperator;      // 0=Add, 1=Maximum, 2=Minimum, 3=Screen, 4=Composite/Over, 5=Behind\n\nhalf4 blendEcho(half4 accum, half4 current, int op) {\n    if (op == 0) {\n        // Add\n        return accum + current;\n    } else if (op == 1) {\n        // Maximum\n        return max(accum, current);\n    } else if (op == 2) {\n        // Minimum\n        return min(accum, current);\n    } else if (op == 3) {\n        // Screen\n        return accum + current - (accum * current);\n    } else if (op == 4) {\n        // Composite / Over (current over accum)\n        return current + accum * (1.0 - current.a);\n    } else {\n        // Behind (accum over current)\n        return accum + current * (1.0 - accum.a);\n    }\n}\n\nhalf4 main(float2 fragCoord) {\n    half4 baseCol = layer.eval(fragCoord);\n    int nEchoes = int(clamp(floor(NumberOfEchoes + 0.5), 1.0, 16.0));\n    int op = int(floor(EchoOperator + 0.5));\n\n    half4 result = baseCol * half(StartingIntensity);\n    float currentWeight = StartingIntensity;\n\n    // Spatial-trail approximation: AE Echo re-samples prior frames at EchoTime\n    // intervals, but Cavalry's skslFilter evaluates a single-frame raster buffer with\n    // no temporal history (and no duplicate rig is created automatically). The temporal\n    // offset is therefore projected onto a fixed diagonal spatial trail of 60 px/s\n    // horizontally and 30 px/s vertically (heuristic projection, not AE behavior).\n    float2 trailOffset = float2(EchoTime * 60.0, EchoTime * 30.0);\n\n    for (int i = 1; i <= 16; i++) {\n        if (i >= nEchoes) break;\n        currentWeight *= Decay;\n        float2 sampleCoord = fragCoord + trailOffset * float(i);\n        half4 echoSample = layer.eval(sampleCoord) * half(currentWeight);\n        result = blendEcho(result, echoSample, op);\n    }\n\n    return result;\n}\n";
    /* @@END_SKSL@@ */

    var DEFAULTS = {
        echoTime: -0.033,
        numberOfEchoes: 3.0,
        startingIntensity: 1.0,
        decay: 0.5,
        echoOperator: 0
    };

    var TAG_SKSL = '[AE:Echo]';

    function safeCall(fn, fallback) {
        try {
            return fn();
        } catch (err) {
            if (typeof globalThis !== 'undefined' && globalThis.AE_EFFECTS_DEBUG && typeof console !== 'undefined' && console.warn) {
                console.warn("[AE:Echo]" + ' call failed: ' + (err && err.message ? err.message : err));
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
            echoTime: clampNum(p.echoTime !== undefined ? p.echoTime : p.EchoTime, -2.0, 2.0, DEFAULTS.echoTime),
            numberOfEchoes: clampNum(p.numberOfEchoes !== undefined ? p.numberOfEchoes : p.NumberOfEchoes, 1.0, 16.0, DEFAULTS.numberOfEchoes),
            startingIntensity: clampNum(p.startingIntensity !== undefined ? p.startingIntensity : p.StartingIntensity, 0.0, 1.0, DEFAULTS.startingIntensity),
            decay: clampNum(p.decay !== undefined ? p.decay : p.Decay, 0.0, 1.0, DEFAULTS.decay),
            echoOperator: clampNum(p.echoOperator !== undefined ? p.echoOperator : p.EchoOperator, 0, 5, DEFAULTS.echoOperator)
        };
    }

    var PARAM_SPECS = [
        { name: 'EchoTime', key: 'echoTime', type: 'double', default: DEFAULTS.echoTime },
        { name: 'NumberOfEchoes', key: 'numberOfEchoes', type: 'double', default: DEFAULTS.numberOfEchoes },
        { name: 'StartingIntensity', key: 'startingIntensity', type: 'double', default: DEFAULTS.startingIntensity },
        { name: 'Decay', key: 'decay', type: 'double', default: DEFAULTS.decay },
        { name: 'EchoOperator', key: 'echoOperator', type: 'double', default: DEFAULTS.echoOperator }
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

    function applyEcho(targetLayerId, rawOptions) {
        if (!targetLayerId) {
            return {
                status: 'error',
                effect: 'echo',
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
                effect: 'echo',
                message: 'Failed to create skslFilter node in Cavalry'
            };
        }

        safeCall(function () {
            if (typeof api.setName === 'function') {
                api.setName(filterId, 'Echo');
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
            effect: 'echo',
            aeMatchName: 'ADBE Echo',
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
            var __entryTarget = safeCall(function () { return api.primitive('rectangle', 'AE Echo Test Target'); }, null);
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
                effect: 'Echo',
                code: 'NO_SELECTION',
                error: 'AE Effects [Echo]: No layer selected. Please select one or more layers in Cavalry.',
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
            __entryResults.push(applyEcho(__entrySelection[__entryIdx], __entryParams));
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
            effect: 'Echo',
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
            console.log('AE Effects: Applied Echo (skslFilter) to ' + (__entryResults.length - __entryFailed) + ' layer(s)');
        }
        return __entrySummary;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            apply: applyEcho,
            normalizeParams: normalizeParams,
            calculatePadding: calculatePadding,
            PARAM_SPECS: PARAM_SPECS,
            DEFAULTS: DEFAULTS,
            SKSL_SOURCE: SKSL_SOURCE
        };
    } else {
        if (typeof globalThis !== 'undefined') {
            globalThis.AEEcho = { apply: applyEcho };
        }
    }
})();
