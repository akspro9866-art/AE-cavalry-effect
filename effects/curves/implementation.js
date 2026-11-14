/**
 * One-Action Reusable Implementation & Applicator:
 * Adobe After Effects "Curves" -> Cavalry 2.8+
 *
 * Implemented as a high-performance GPU SkSL Filter (`skslFilter`) with
 * C1-continuous Catmull-Rom cubic spline interpolation across Master and RGB channels.
 */
(function () {
    /* @@BEGIN_SKSL@@ */
    var SKSL_SOURCE = "// Adobe After Effects \"Curves\" (ADBE CurvesCustom)\n// Reconstructed mathematically for Cavalry 2.8+ as a high-performance GPU SkSL Filter (`skslFilter`).\n//\n// Built-in Cavalry preamble uniforms:\n//   `layer` (uniform shader) - Source layer texture sampler (layer.eval(coords))\n//   `resolution` (float2)   - Layer bounding dimensions in pixels\n\nuniform shader layer;\n\n// Dynamic attribute uniforms (mapped to Cavalry `inputs.0`..`inputs.13`):\nuniform float MasterBlack;      // 0.0 point (Lift) (default: 0.0, range: 0.0 to 1.0)\nuniform float MasterShadows;    // 0.25 point (default: 0.25, range: 0.0 to 1.0)\nuniform float MasterMidtones;   // 0.50 point (default: 0.50, range: 0.0 to 1.0)\nuniform float MasterHighlights; // 0.75 point (default: 0.75, range: 0.0 to 1.0)\nuniform float MasterWhite;      // 1.0 point (Gain) (default: 1.0, range: 0.0 to 1.0)\n\nuniform float RedLift;   // Red channel black offset (default: 0.0, range: -1.0 to 1.0)\nuniform float RedMid;    // Red channel midtone offset (default: 0.0, range: -1.0 to 1.0)\nuniform float RedGain;   // Red channel white offset (default: 0.0, range: -1.0 to 1.0)\n\nuniform float GreenLift; // Green channel black offset (default: 0.0, range: -1.0 to 1.0)\nuniform float GreenMid;  // Green channel midtone offset (default: 0.0, range: -1.0 to 1.0)\nuniform float GreenGain; // Green channel white offset (default: 0.0, range: -1.0 to 1.0)\n\nuniform float BlueLift;  // Blue channel black offset (default: 0.0, range: -1.0 to 1.0)\nuniform float BlueMid;   // Blue channel midtone offset (default: 0.0, range: -1.0 to 1.0)\nuniform float BlueGain;  // Blue channel white offset (default: 0.0, range: -1.0 to 1.0)\n\nfloat evalCatmullRom(float x, float y0, float y1, float y2, float y3, float y4) {\n    float xc = clamp(x, 0.0, 1.0);\n    float segment = floor(xc * 4.0);\n    segment = min(segment, 3.0);\n    float t = (xc - segment * 0.25) * 4.0;\n\n    float p0, p1, p2, p3;\n    if (segment < 0.5) {\n        p1 = y0; p2 = y1;\n        p0 = y0 - (y1 - y0);\n        p3 = y2;\n    } else if (segment < 1.5) {\n        p0 = y0; p1 = y1; p2 = y2; p3 = y3;\n    } else if (segment < 2.5) {\n        p0 = y1; p1 = y2; p2 = y3; p3 = y4;\n    } else {\n        p0 = y2; p1 = y3; p2 = y4;\n        p3 = y4 + (y4 - y3);\n    }\n\n    float t2 = t * t;\n    float t3 = t2 * t;\n    float val = 0.5 * ((2.0 * p1) +\n                      (-p0 + p2) * t +\n                      (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * t2 +\n                      (-p0 + 3.0 * p1 - 3.0 * p2 + p3) * t3);\n    return clamp(val, 0.0, 1.0);\n}\n\nfloat evalChannelCurve(float c, float lift, float mid, float gain) {\n    float y0 = clamp(lift, 0.0, 1.0);\n    float y1 = clamp(0.25 + (lift * 0.75 + mid * 0.25), 0.0, 1.0);\n    float y2 = clamp(0.50 + mid, 0.0, 1.0);\n    float y3 = clamp(0.75 + (gain * 0.75 + mid * 0.25), 0.0, 1.0);\n    float y4 = clamp(1.0 + gain, 0.0, 1.0);\n    return evalCatmullRom(c, y0, y1, y2, y3, y4);\n}\n\nhalf4 main(float2 fragCoord) {\n    half4 col = layer.eval(fragCoord);\n    if (col.a <= 0.0001) {\n        return col;\n    }\n\n    // Unpremultiply alpha for true color grading\n    float3 rgb = float3(col.rgb) / float(col.a);\n\n    // 1. Master RGB Spline Curve\n    rgb.r = evalCatmullRom(rgb.r, MasterBlack, MasterShadows, MasterMidtones, MasterHighlights, MasterWhite);\n    rgb.g = evalCatmullRom(rgb.g, MasterBlack, MasterShadows, MasterMidtones, MasterHighlights, MasterWhite);\n    rgb.b = evalCatmullRom(rgb.b, MasterBlack, MasterShadows, MasterMidtones, MasterHighlights, MasterWhite);\n\n    // 2. Individual Channel Curves\n    rgb.r = evalChannelCurve(rgb.r, RedLift, RedMid, RedGain);\n    rgb.g = evalChannelCurve(rgb.g, GreenLift, GreenMid, GreenGain);\n    rgb.b = evalChannelCurve(rgb.b, BlueLift, BlueMid, BlueGain);\n\n    // Re-premultiply alpha\n    return half4(half3(rgb * float(col.a)), col.a);\n}\n";
    /* @@END_SKSL@@ */

    var DEFAULTS = {
        masterBlack: 0.0,
        masterShadows: 0.25,
        masterMidtones: 0.50,
        masterHighlights: 0.75,
        masterWhite: 1.0,
        redLift: 0.0, redMid: 0.0, redGain: 0.0,
        greenLift: 0.0, greenMid: 0.0, greenGain: 0.0,
        blueLift: 0.0, blueMid: 0.0, blueGain: 0.0
    };

    var TAG_SKSL = '[AE:Curves]';

    function safeCall(fn, fallback) {
        try {
            return fn();
        } catch (err) {
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
            masterBlack: clampNum(p.masterBlack !== undefined ? p.masterBlack : p.MasterBlack, 0.0, 1.0, DEFAULTS.masterBlack),
            masterShadows: clampNum(p.masterShadows !== undefined ? p.masterShadows : p.MasterShadows, 0.0, 1.0, DEFAULTS.masterShadows),
            masterMidtones: clampNum(p.masterMidtones !== undefined ? p.masterMidtones : p.MasterMidtones, 0.0, 1.0, DEFAULTS.masterMidtones),
            masterHighlights: clampNum(p.masterHighlights !== undefined ? p.masterHighlights : p.MasterHighlights, 0.0, 1.0, DEFAULTS.masterHighlights),
            masterWhite: clampNum(p.masterWhite !== undefined ? p.masterWhite : p.MasterWhite, 0.0, 1.0, DEFAULTS.masterWhite),
            redLift: clampNum(p.redLift !== undefined ? p.redLift : p.RedLift, -1.0, 1.0, DEFAULTS.redLift),
            redMid: clampNum(p.redMid !== undefined ? p.redMid : p.RedMid, -1.0, 1.0, DEFAULTS.redMid),
            redGain: clampNum(p.redGain !== undefined ? p.redGain : p.RedGain, -1.0, 1.0, DEFAULTS.redGain),
            greenLift: clampNum(p.greenLift !== undefined ? p.greenLift : p.GreenLift, -1.0, 1.0, DEFAULTS.greenLift),
            greenMid: clampNum(p.greenMid !== undefined ? p.greenMid : p.GreenMid, -1.0, 1.0, DEFAULTS.greenMid),
            greenGain: clampNum(p.greenGain !== undefined ? p.greenGain : p.GreenGain, -1.0, 1.0, DEFAULTS.greenGain),
            blueLift: clampNum(p.blueLift !== undefined ? p.blueLift : p.BlueLift, -1.0, 1.0, DEFAULTS.blueLift),
            blueMid: clampNum(p.blueMid !== undefined ? p.blueMid : p.BlueMid, -1.0, 1.0, DEFAULTS.blueMid),
            blueGain: clampNum(p.blueGain !== undefined ? p.blueGain : p.BlueGain, -1.0, 1.0, DEFAULTS.blueGain)
        };
    }

    var PARAM_SPECS = [
        { name: 'MasterBlack', key: 'masterBlack', type: 'double', default: DEFAULTS.masterBlack },
        { name: 'MasterShadows', key: 'masterShadows', type: 'double', default: DEFAULTS.masterShadows },
        { name: 'MasterMidtones', key: 'masterMidtones', type: 'double', default: DEFAULTS.masterMidtones },
        { name: 'MasterHighlights', key: 'masterHighlights', type: 'double', default: DEFAULTS.masterHighlights },
        { name: 'MasterWhite', key: 'masterWhite', type: 'double', default: DEFAULTS.masterWhite },
        { name: 'RedLift', key: 'redLift', type: 'double', default: DEFAULTS.redLift },
        { name: 'RedMid', key: 'redMid', type: 'double', default: DEFAULTS.redMid },
        { name: 'RedGain', key: 'redGain', type: 'double', default: DEFAULTS.redGain },
        { name: 'GreenLift', key: 'greenLift', type: 'double', default: DEFAULTS.greenLift },
        { name: 'GreenMid', key: 'greenMid', type: 'double', default: DEFAULTS.greenMid },
        { name: 'GreenGain', key: 'greenGain', type: 'double', default: DEFAULTS.greenGain },
        { name: 'BlueLift', key: 'blueLift', type: 'double', default: DEFAULTS.blueLift },
        { name: 'BlueMid', key: 'blueMid', type: 'double', default: DEFAULTS.blueMid },
        { name: 'BlueGain', key: 'blueGain', type: 'double', default: DEFAULTS.blueGain }
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

    function applyCurves(targetLayerId, rawOptions) {
        if (!targetLayerId) {
            return {
                status: 'error',
                effect: 'curves',
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
                effect: 'curves',
                message: 'Failed to create skslFilter node in Cavalry'
            };
        }

        safeCall(function () {
            if (typeof api.setName === 'function') {
                api.setName(filterId, 'Curves');
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
            effect: 'curves',
            aeMatchName: 'ADBE CurvesCustom',
            nodeId: filterId,
            targetLayerId: targetLayerId,
            connected: Boolean(connOk),
            codeConfigured: Boolean(codeSetOk),
            boundAttributes: boundAttributes,
            parameters: params,
            inspect: inspectPayload
        };
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            apply: applyCurves,
            normalizeParams: normalizeParams,
            calculatePadding: calculatePadding,
            PARAM_SPECS: PARAM_SPECS,
            DEFAULTS: DEFAULTS,
            SKSL_SOURCE: SKSL_SOURCE
        };
    } else {
        if (typeof globalThis !== 'undefined') {
            globalThis.AECurves = { apply: applyCurves };
        }
    }
})();
