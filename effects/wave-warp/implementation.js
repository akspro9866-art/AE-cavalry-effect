/**
 * One-Action Reusable Implementation & Applicator:
 * Adobe After Effects "Wave Warp" -> Cavalry 2.8+
 *
 * Implemented as a high-performance GPU SkSL Filter (`skslFilter`) with
 * procedural coordinate displacement, multi-waveform support, directional propagation,
 * boundary edge pinning, and dynamic canvas padding.
 */
(function () {
    /* @@BEGIN_SKSL@@ */
    var SKSL_SOURCE = "// Adobe After Effects \"Wave Warp\" (ADBE Wave Warp)\n// Reconstructed mathematically for Cavalry 2.8+ as a high-performance GPU SkSL Filter (`skslFilter`).\n//\n// Built-in Cavalry preamble uniforms (injected automatically by Cavalry runtime):\n//   `layer` (uniform shader) - Source layer texture sampler (layer.eval(coords))\n//   `resolution` (float2)   - Bounding dimensions in pixels (centered coordinate space)\n\nuniform shader layer;\n\n// Dynamic attribute uniforms (mapped to Cavalry `inputs.0`..`inputs.6`):\nuniform float WaveType;    // 0 = Sine, 1 = Square, 2 = Triangle, 3 = Sawtooth, 4 = Circles, 5 = Semicircles\nuniform float WaveHeight;  // Amplitude of wave displacement in pixels (default: 10.0, range: -100.0 to 100.0)\nuniform float WaveWidth;   // Wavelength in pixels (default: 40.0, range: 1.0 to 500.0)\nuniform float Direction;   // Propagation angle in degrees (default: 90.0, range: -360.0 to 360.0)\nuniform float WaveSpeed;   // Animation rate (default: 1.0)\nuniform float Phase;       // Phase offset in degrees (default: 0.0, range: -360.0 to 360.0)\nuniform float Pinning;     // 0 = None, 1 = All, 2 = Top, 3 = Bottom, 4 = Left, 5 = Right\n\nfloat evaluateWaveform(float phi, int wType) {\n    float t = fract(phi * 0.15915494309189535); // phi / (2*pi)\n\n    if (wType == 1) {\n        // Square\n        return t < 0.5 ? 1.0 : -1.0;\n    } else if (wType == 2) {\n        // Triangle\n        return 2.0 * abs(2.0 * t - 1.0) - 1.0;\n    } else if (wType == 3) {\n        // Sawtooth\n        return 2.0 * t - 1.0;\n    } else if (wType == 4) {\n        // Circles\n        float x = 2.0 * t - 1.0;\n        return sqrt(max(1.0 - x * x, 0.0)) * 2.0 - 1.0;\n    } else if (wType == 5) {\n        // Semicircles\n        float x = t < 0.5 ? (4.0 * t - 1.0) : (4.0 * (t - 0.5) - 1.0);\n        float circ = sqrt(max(1.0 - x * x, 0.0));\n        return t < 0.5 ? circ : -circ;\n    }\n\n    // 0 = Sine\n    return sin(phi);\n}\n\nfloat computePinFactor(float2 coord, float2 halfRes, int pin) {\n    if (pin == 0) return 1.0;\n    float2 normDist = clamp((halfRes - abs(coord)) / max(halfRes, float2(1.0)), 0.0, 1.0);\n\n    if (pin == 1) {\n        // All Edges\n        return min(normDist.x, normDist.y);\n    } else if (pin == 2) {\n        // Top Edge (positive Y in Cavalry)\n        return clamp((halfRes.y - coord.y) / max(2.0 * halfRes.y, 1.0), 0.0, 1.0);\n    } else if (pin == 3) {\n        // Bottom Edge (negative Y in Cavalry)\n        return clamp((coord.y + halfRes.y) / max(2.0 * halfRes.y, 1.0), 0.0, 1.0);\n    } else if (pin == 4) {\n        // Left Edge (negative X in Cavalry)\n        return clamp((coord.x + halfRes.x) / max(2.0 * halfRes.x, 1.0), 0.0, 1.0);\n    } else if (pin == 5) {\n        // Right Edge (positive X in Cavalry)\n        return clamp((halfRes.x - coord.x) / max(2.0 * halfRes.x, 1.0), 0.0, 1.0);\n    }\n    return 1.0;\n}\n\nhalf4 main(float2 fragCoord) {\n    if (abs(WaveHeight) <= 0.001) {\n        return layer.eval(fragCoord);\n    }\n\n    float2 res = max(resolution, float2(1.0, 1.0));\n    float2 halfRes = res * 0.5;\n\n    float rad = Direction * 0.017453292519943295;\n    float2 uProp = float2(cos(rad), sin(rad));\n    float2 vTrans = float2(-sin(rad), cos(rad));\n\n    float s = dot(fragCoord, uProp);\n    float k = 6.283185307179586 / max(WaveWidth, 1.0);\n    float phi = s * k + Phase * 0.017453292519943295;\n\n    int wType = int(floor(WaveType + 0.5));\n    float waveVal = evaluateWaveform(phi, wType);\n\n    int pin = int(floor(Pinning + 0.5));\n    float pinFactor = computePinFactor(fragCoord, halfRes, pin);\n\n    float2 displacement = vTrans * (WaveHeight * waveVal * pinFactor);\n    float2 sampleCoord = fragCoord - displacement;\n\n    return layer.eval(sampleCoord);\n}\n";
    /* @@END_SKSL@@ */

    var DEFAULTS = {
        waveType: 0,
        waveHeight: 10.0,
        waveWidth: 40.0,
        direction: 90.0,
        waveSpeed: 1.0,
        phase: 0.0,
        pinning: 0
    };

    var TAG_SKSL = '[AE:Wave Warp]';

    function safeCall(fn, fallback) {
        try {
            return fn();
        } catch (err) {
            if (typeof globalThis !== 'undefined' && globalThis.AE_EFFECTS_DEBUG && typeof console !== 'undefined' && console.warn) {
                console.warn("[AE:Wave Warp]" + ' call failed: ' + (err && err.message ? err.message : err));
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
            waveType: clampNum(p.waveType !== undefined ? p.waveType : p.WaveType, 0, 5, DEFAULTS.waveType),
            waveHeight: clampNum(p.waveHeight !== undefined ? p.waveHeight : p.WaveHeight, -100.0, 100.0, DEFAULTS.waveHeight),
            waveWidth: clampNum(p.waveWidth !== undefined ? p.waveWidth : p.WaveWidth, 1.0, 500.0, DEFAULTS.waveWidth),
            direction: clampNum(p.direction !== undefined ? p.direction : p.Direction, -360.0, 360.0, DEFAULTS.direction),
            waveSpeed: clampNum(p.waveSpeed !== undefined ? p.waveSpeed : p.WaveSpeed, -10.0, 10.0, DEFAULTS.waveSpeed),
            phase: clampNum(p.phase !== undefined ? p.phase : p.Phase, -360.0, 360.0, DEFAULTS.phase),
            pinning: clampNum(p.pinning !== undefined ? p.pinning : p.Pinning, 0, 5, DEFAULTS.pinning)
        };
    }

    var PARAM_SPECS = [
        { name: 'WaveType', key: 'waveType', type: 'double', default: DEFAULTS.waveType },
        { name: 'WaveHeight', key: 'waveHeight', type: 'double', default: DEFAULTS.waveHeight },
        { name: 'WaveWidth', key: 'waveWidth', type: 'double', default: DEFAULTS.waveWidth },
        { name: 'Direction', key: 'direction', type: 'double', default: DEFAULTS.direction },
        { name: 'WaveSpeed', key: 'waveSpeed', type: 'double', default: DEFAULTS.waveSpeed },
        { name: 'Phase', key: 'phase', type: 'double', default: DEFAULTS.phase },
        { name: 'Pinning', key: 'pinning', type: 'double', default: DEFAULTS.pinning }
    ];

    function calculatePadding(params) {
        var pad = Math.ceil(Math.abs(params.waveHeight || 0.0)) + 20;
        return { x: pad, y: pad };
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

    function applyWaveWarp(targetLayerId, rawOptions) {
        if (!targetLayerId) {
            return {
                status: 'error',
                effect: 'wave-warp',
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
                effect: 'wave-warp',
                message: 'Failed to create skslFilter node in Cavalry'
            };
        }

        safeCall(function () {
            if (typeof api.setName === 'function') {
                api.setName(filterId, 'Wave Warp');
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
            effect: 'wave-warp',
            aeMatchName: 'ADBE Wave Warp',
            nodeId: filterId,
            targetLayerId: targetLayerId,
            connected: Boolean(connOk),
            codeConfigured: Boolean(codeSetOk),
            boundAttributes: boundAttributes,
            parameters: params,
            padding: pad,
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
            var __entryTarget = safeCall(function () { return api.primitive('rectangle', 'AE Wave Warp Test Target'); }, null);
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
                effect: 'Wave Warp',
                code: 'NO_SELECTION',
                error: 'AE Effects [Wave Warp]: No layer selected. Please select one or more layers in Cavalry.',
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
            __entryResults.push(applyWaveWarp(__entrySelection[__entryIdx], __entryParams));
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
            effect: 'Wave Warp',
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
            console.log('AE Effects: Applied Wave Warp (skslFilter) to ' + (__entryResults.length - __entryFailed) + ' layer(s)');
        }
        return __entrySummary;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            apply: applyWaveWarp,
            normalizeParams: normalizeParams,
            calculatePadding: calculatePadding,
            PARAM_SPECS: PARAM_SPECS,
            DEFAULTS: DEFAULTS,
            SKSL_SOURCE: SKSL_SOURCE
        };
    } else {
        if (typeof globalThis !== 'undefined') {
            globalThis.AEWaveWarp = { apply: applyWaveWarp };
        }
    }
})();
