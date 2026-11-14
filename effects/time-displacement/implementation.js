/**
 * One-Action Reusable Implementation & Applicator:
 * Adobe After Effects "Time Displacement" -> Cavalry 2.8+
 *
 * Implemented as a procedural GPU SkSL Filter (`skslFilter`) with
 * channel luminance mapping and temporal quantizing steps. The temporal delay is
 * projected as spatial phase latency (slit-scan); AE's Time Displacement Layer
 * input is not sampleable by Cavalry's single-input skslFilter (see technical-notes.md).
 */
(function () {
    /* @@BEGIN_SKSL@@ */
    var SKSL_SOURCE = "// Adobe After Effects \"Time Displacement\" (ADBE Time Displacement)\n// Reconstructed mathematically for Cavalry 2.8+ as a procedural GPU SkSL Filter (`skslFilter`).\n//\n// Approximation note: AE samples a secondary \"Time Displacement Layer\" per fragment.\n// Cavalry's skslFilter is single-input (verified live in 2.8: mattes.0 connections and\n// shader-type inputs.* dynamics do not bind layer content into SkSL), so the displacement\n// signal is derived from the filtered layer itself and the temporal delay is projected\n// as spatial phase latency (slit-scan).\n//\n// Built-in Cavalry preamble uniforms:\n//   `layer` (uniform shader) - Source layer texture sampler (layer.eval(coords))\n//   `resolution` (float2)   - Layer bounding dimensions in pixels\n\nuniform shader layer;\n\n// Dynamic attribute uniforms (mapped to Cavalry `inputs.0`..`inputs.3`):\nuniform float MaxDisplacementTime; // Maximum time shift in seconds (default: 1.0, range: -10.0 to 10.0)\nuniform float TimeResolution;      // Temporal sample discretization (default: 30.0, range: 1.0 to 120.0)\nuniform float DisplacementChannel; // 0=Red, 1=Green, 2=Blue, 3=Alpha, 4=Luminance (default: 4.0)\nuniform float SpatialLagFactor;    // Spatial displacement multiplier per second of lag (default: 20.0)\n\nfloat extractChannel(half4 col, int ch) {\n    if (ch == 0) return float(col.r);\n    if (ch == 1) return float(col.g);\n    if (ch == 2) return float(col.b);\n    if (ch == 3) return float(col.a);\n    // 4 = Luminance\n    return 0.299 * float(col.r) + 0.587 * float(col.g) + 0.114 * float(col.b);\n}\n\nhalf4 main(float2 fragCoord) {\n    if (abs(MaxDisplacementTime) <= 0.001) {\n        return layer.eval(fragCoord);\n    }\n\n    float2 res = max(resolution, float2(1.0, 1.0));\n    float2 halfRes = res * 0.5;\n\n    // Sample displacement signal\n    half4 mapCol = layer.eval(fragCoord);\n    int ch = int(floor(DisplacementChannel + 0.5));\n    float normVal = extractChannel(mapCol, ch);\n\n    // Continuous time delta centered at 0.5\n    float dt = (normVal - 0.5) * MaxDisplacementTime;\n\n    // Discretize time shift by TimeResolution\n    float resStep = max(TimeResolution, 1.0);\n    dt = floor(dt * resStep + 0.5) / resStep;\n\n    // In Cavalry single-pass SkSL without temporal texture volume,\n    // temporal lag is projected onto spatial phase propagation (slit-scan / wave lag)\n    float2 lagDisplacement = float2(0.0, dt * SpatialLagFactor);\n    float2 sampleCoord = fragCoord - lagDisplacement;\n\n    if (abs(sampleCoord.x) > halfRes.x || abs(sampleCoord.y) > halfRes.y) {\n        return half4(0.0);\n    }\n\n    return layer.eval(sampleCoord);\n}\n";
    /* @@END_SKSL@@ */

    var DEFAULTS = {
        maxDisplacementTime: 1.0,
        timeResolution: 30.0,
        displacementChannel: 4,
        spatialLagFactor: 20.0
    };

    var TAG_SKSL = '[AE:Time Displacement]';

    function safeCall(fn, fallback) {
        try {
            return fn();
        } catch (err) {
            if (typeof globalThis !== 'undefined' && globalThis.AE_EFFECTS_DEBUG && typeof console !== 'undefined' && console.warn) {
                console.warn("[AE:Time Displacement]" + ' call failed: ' + (err && err.message ? err.message : err));
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
            maxDisplacementTime: clampNum(p.maxDisplacementTime !== undefined ? p.maxDisplacementTime : p.MaxDisplacementTime, -10.0, 10.0, DEFAULTS.maxDisplacementTime),
            timeResolution: clampNum(p.timeResolution !== undefined ? p.timeResolution : p.TimeResolution, 1.0, 120.0, DEFAULTS.timeResolution),
            displacementChannel: clampNum(p.displacementChannel !== undefined ? p.displacementChannel : p.DisplacementChannel, 0, 4, DEFAULTS.displacementChannel),
            spatialLagFactor: clampNum(p.spatialLagFactor !== undefined ? p.spatialLagFactor : p.SpatialLagFactor, 0.0, 200.0, DEFAULTS.spatialLagFactor)
        };
    }

    var PARAM_SPECS = [
        { name: 'MaxDisplacementTime', key: 'maxDisplacementTime', type: 'double', default: DEFAULTS.maxDisplacementTime },
        { name: 'TimeResolution', key: 'timeResolution', type: 'double', default: DEFAULTS.timeResolution },
        { name: 'DisplacementChannel', key: 'displacementChannel', type: 'double', default: DEFAULTS.displacementChannel },
        { name: 'SpatialLagFactor', key: 'spatialLagFactor', type: 'double', default: DEFAULTS.spatialLagFactor }
    ];

    function calculatePadding(params) {
        var maxT = Math.abs(params.maxDisplacementTime || 1.0);
        var lag = params.spatialLagFactor !== undefined ? params.spatialLagFactor : 20.0;
        var pad = Math.ceil(maxT * lag * 0.5) + 10;
        return { x: 0, y: pad };
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

    function applyTimeDisplacement(targetLayerId, rawOptions) {
        if (!targetLayerId) {
            return {
                status: 'error',
                effect: 'time-displacement',
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
                effect: 'time-displacement',
                message: 'Failed to create skslFilter node in Cavalry'
            };
        }

        safeCall(function () {
            if (typeof api.setName === 'function') {
                api.setName(filterId, 'Time Displacement');
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

        var pad = calculatePadding(params);
        setAttrValue(filterId, 'padding', pad);

        var mapSourceId = (rawOptions && (rawOptions.timeDisplacementLayer || rawOptions.mapLayerId)) || null;
        var warnings = [];
        if (mapSourceId) {
            // Live Cavalry 2.8 probe: skslFilter exposes no second image input. Neither
            // `mattes.0` connections nor shader-type `inputs.*` dynamics bind layer
            // content into SkSL (mattes only mask where the filter applies), so AE's
            // "Time Displacement Layer" cannot drive the displacement signal.
            warnings.push('Time Displacement Layer was provided but Cavalry skslFilter cannot sample a secondary layer; ' +
                'the displacement signal is derived from the target layer itself (spatial slit-scan approximation).');
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
            effect: 'time-displacement',
            aeMatchName: 'ADBE Time Displacement',
            nodeId: filterId,
            targetLayerId: targetLayerId,
            connected: Boolean(connOk),
            codeConfigured: Boolean(codeSetOk),
            boundAttributes: boundAttributes,
            parameters: params,
            padding: pad,
            timeDisplacementLayer: mapSourceId,
            mapConnected: false,
            warnings: warnings,
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
            var __entryTarget = safeCall(function () { return api.primitive('rectangle', 'AE Time Displacement Test Target'); }, null);
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
                effect: 'Time Displacement',
                code: 'NO_SELECTION',
                error: 'AE Effects [Time Displacement]: No layer selected. Please select one or more layers in Cavalry.',
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
            __entryResults.push(applyTimeDisplacement(__entrySelection[__entryIdx], __entryParams));
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
            effect: 'Time Displacement',
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
            console.log('AE Effects: Applied Time Displacement (skslFilter) to ' + (__entryResults.length - __entryFailed) + ' layer(s)');
        }
        return __entrySummary;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            apply: applyTimeDisplacement,
            normalizeParams: normalizeParams,
            calculatePadding: calculatePadding,
            PARAM_SPECS: PARAM_SPECS,
            DEFAULTS: DEFAULTS,
            SKSL_SOURCE: SKSL_SOURCE
        };
    } else {
        if (typeof globalThis !== 'undefined') {
            globalThis.AETimeDisplacement = { apply: applyTimeDisplacement };
        }
    }
})();
