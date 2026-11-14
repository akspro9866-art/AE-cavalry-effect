/**
 * One-Action Reusable Implementation & Applicator:
 * Adobe After Effects "CC Kaleida" -> Cavalry 2.8+
 *
 * Implemented as a high-performance GPU SkSL Filter (`skslFilter`) with
 * polar coordinate decomposition, radial symmetry segments, and seamless bilateral mirroring.
 */
(function () {
    /* @@BEGIN_SKSL@@ */
    var SKSL_SOURCE = "// Adobe After Effects \"CC Kaleida\" (CC Kaleida)\n// Reconstructed mathematically for Cavalry 2.8+ as a high-performance GPU SkSL Filter (`skslFilter`).\n//\n// Built-in Cavalry preamble uniforms:\n//   `layer` (uniform shader) - Source layer texture sampler (layer.eval(coords))\n//   `resolution` (float2)   - Layer bounding dimensions in pixels\n\nuniform shader layer;\n\n// Dynamic attribute uniforms (mapped to Cavalry `inputs.0`..`inputs.5`):\nuniform float CenterX;      // Center X offset in pixels (default: 0.0)\nuniform float CenterY;      // Center Y offset in pixels (default: 0.0)\nuniform float Size;         // Scale factor percentage (default: 100.0, range: 1.0 to 500.0)\nuniform float Rotation;     // Rotation angle in degrees (default: 0.0, range: -360.0 to 360.0)\nuniform float SegmentCount; // Number of radial symmetry segments (default: 6.0, range: 2.0 to 36.0)\nuniform float Mirroring;    // 0 = Off, 1 = On (Alternating radial reflection)\n\nconst float PI = 3.141592653589793;\nconst float TWO_PI = 6.283185307179586;\n\nhalf4 main(float2 fragCoord) {\n    float2 center = float2(CenterX, CenterY);\n    float2 p = fragCoord - center;\n\n    float r = length(p);\n    if (r <= 0.001) {\n        return layer.eval(center);\n    }\n\n    float scale = max(Size * 0.01, 0.001);\n    r = r / scale;\n\n    float theta = atan(-p.y, p.x); // Inverted Y for Cavalry SkSL coordinate space\n    theta = mod(theta - (Rotation * 0.017453292519943295), TWO_PI);\n    if (theta < 0.0) theta += TWO_PI;\n\n    float nSeg = max(floor(SegmentCount + 0.5), 2.0);\n    float alpha = TWO_PI / nSeg;\n\n    float u = theta / alpha;\n    float segIdx = floor(u);\n    float t = fract(u);\n\n    if (Mirroring > 0.5) {\n        // Continuous bilateral reflection inside wedge\n        t = abs(2.0 * t - 1.0);\n    }\n\n    float mappedTheta = t * alpha * 0.5;\n\n    float2 mappedCoord;\n    mappedCoord.x = center.x + r * cos(mappedTheta) * scale;\n    mappedCoord.y = center.y - r * sin(mappedTheta) * scale;\n\n    return layer.eval(mappedCoord);\n}\n";
    /* @@END_SKSL@@ */

    var DEFAULTS = {
        centerX: 0.0,
        centerY: 0.0,
        size: 100.0,
        rotation: 0.0,
        segmentCount: 6.0,
        mirroring: 1
    };

    var TAG_SKSL = '[AE:CC Kaleida]';

    function safeCall(fn, fallback) {
        try {
            return fn();
        } catch (err) {
            if (typeof globalThis !== 'undefined' && globalThis.AE_EFFECTS_DEBUG && typeof console !== 'undefined' && console.warn) {
                console.warn("[AE:CC Kaleida]" + ' call failed: ' + (err && err.message ? err.message : err));
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
            centerX: clampNum(p.centerX !== undefined ? p.centerX : p.CenterX, -10000.0, 10000.0, DEFAULTS.centerX),
            centerY: clampNum(p.centerY !== undefined ? p.centerY : p.CenterY, -10000.0, 10000.0, DEFAULTS.centerY),
            size: clampNum(p.size !== undefined ? p.size : p.Size, 1.0, 500.0, DEFAULTS.size),
            rotation: clampNum(p.rotation !== undefined ? p.rotation : p.Rotation, -360.0, 360.0, DEFAULTS.rotation),
            segmentCount: clampNum(p.segmentCount !== undefined ? p.segmentCount : p.SegmentCount, 2.0, 36.0, DEFAULTS.segmentCount),
            mirroring: clampNum(p.mirroring !== undefined ? p.mirroring : p.Mirroring, 0, 1, DEFAULTS.mirroring)
        };
    }

    var PARAM_SPECS = [
        { name: 'CenterX', key: 'centerX', type: 'double', default: DEFAULTS.centerX },
        { name: 'CenterY', key: 'centerY', type: 'double', default: DEFAULTS.centerY },
        { name: 'Size', key: 'size', type: 'double', default: DEFAULTS.size },
        { name: 'Rotation', key: 'rotation', type: 'double', default: DEFAULTS.rotation },
        { name: 'SegmentCount', key: 'segmentCount', type: 'double', default: DEFAULTS.segmentCount },
        { name: 'Mirroring', key: 'mirroring', type: 'double', default: DEFAULTS.mirroring }
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

    function applyCCKaleida(targetLayerId, rawOptions) {
        if (!targetLayerId) {
            return {
                status: 'error',
                effect: 'cc-kaleida',
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
                effect: 'cc-kaleida',
                message: 'Failed to create skslFilter node in Cavalry'
            };
        }

        safeCall(function () {
            if (typeof api.setName === 'function') {
                api.setName(filterId, 'CC Kaleida');
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
            effect: 'cc-kaleida',
            aeMatchName: 'CC Kaleida',
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
            var __entryTarget = safeCall(function () { return api.primitive('rectangle', 'AE CC Kaleida Test Target'); }, null);
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
                effect: 'CC Kaleida',
                code: 'NO_SELECTION',
                error: 'AE Effects [CC Kaleida]: No layer selected. Please select one or more layers in Cavalry.',
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
            __entryResults.push(applyCCKaleida(__entrySelection[__entryIdx], __entryParams));
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
            effect: 'CC Kaleida',
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
            console.log('AE Effects: Applied CC Kaleida (skslFilter) to ' + (__entryResults.length - __entryFailed) + ' layer(s)');
        }
        return __entrySummary;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            apply: applyCCKaleida,
            normalizeParams: normalizeParams,
            calculatePadding: calculatePadding,
            PARAM_SPECS: PARAM_SPECS,
            DEFAULTS: DEFAULTS,
            SKSL_SOURCE: SKSL_SOURCE
        };
    } else {
        if (typeof globalThis !== 'undefined') {
            globalThis.AECCKaleida = { apply: applyCCKaleida };
        }
    }
})();
