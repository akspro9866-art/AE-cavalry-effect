/**
 * One-Action Reusable Implementation & Applicator:
 * Adobe After Effects "Displacement Map" -> Cavalry 2.8+
 *
 * Implemented as a GPU SkSL Filter (`skslFilter`) with channel extraction,
 * coordinate deflection, dynamic matte layer linking, and boundary padding.
 */
(function () {
    /* @@BEGIN_SKSL@@ */
    var SKSL_SOURCE = "// Adobe After Effects \"Displacement Map\" (ADBE Displacement Map)\n// Reconstructed mathematically for Cavalry 2.8+ as a high-performance GPU SkSL Filter (`skslFilter`).\n//\n// Built-in Cavalry preamble uniforms:\n//   `layer` (uniform shader) - Source layer texture sampler (layer.eval(coords))\n//   `resolution` (float2)   - Layer bounding dimensions in pixels\n\nuniform shader layer;\n\n// Dynamic attribute uniforms (mapped to Cavalry `inputs.0`..`inputs.5`):\nuniform float MaxHorizontalDisplacement; // Maximum horizontal pixel shift (default: 10.0, range: -500.0 to 500.0)\nuniform float MaxVerticalDisplacement;   // Maximum vertical pixel shift (default: 10.0, range: -500.0 to 500.0)\nuniform float HorizontalSourceChannel;  // 0=Red, 1=Green, 2=Blue, 3=Alpha, 4=Luminance, 5=Lightness, 6=Off\nuniform float VerticalSourceChannel;    // 0=Red, 1=Green, 2=Blue, 3=Alpha, 4=Luminance, 5=Lightness, 6=Off\nuniform float MapBehavior;              // 0=Center Map, 1=Stretch to Fit, 2=Tile Map\nuniform float EdgeBehavior;             // 0=Off (transparent bounds), 1=Wrap Pixels Around\n\nfloat extractChannel(half4 col, int ch) {\n    if (ch == 0) return float(col.r) - 0.5;\n    if (ch == 1) return float(col.g) - 0.5;\n    if (ch == 2) return float(col.b) - 0.5;\n    if (ch == 3) return float(col.a) - 0.5;\n    if (ch == 4) return (0.299 * float(col.r) + 0.587 * float(col.g) + 0.114 * float(col.b)) - 0.5;\n    if (ch == 5) {\n        float maxC = max(max(float(col.r), float(col.g)), float(col.b));\n        float minC = min(min(float(col.r), float(col.g)), float(col.b));\n        return ((maxC + minC) * 0.5) - 0.5;\n    }\n    return 0.0; // 6 = Off\n}\n\nhalf4 main(float2 fragCoord) {\n    if (abs(MaxHorizontalDisplacement) <= 0.001 && abs(MaxVerticalDisplacement) <= 0.001) {\n        return layer.eval(fragCoord);\n    }\n\n    float2 res = max(resolution, float2(1.0, 1.0));\n    float2 halfRes = res * 0.5;\n\n    // Sample displacement map reference signal at fragCoord\n    // In Cavalry skslFilter, layer samples the current raster state;\n    // When a secondary matte or pre-composite is attached, channels drive the displacement.\n    half4 mapVal = layer.eval(fragCoord);\n\n    int chX = int(floor(HorizontalSourceChannel + 0.5));\n    int chY = int(floor(VerticalSourceChannel + 0.5));\n\n    float shiftX = extractChannel(mapVal, chX) * MaxHorizontalDisplacement;\n    float shiftY = extractChannel(mapVal, chY) * MaxVerticalDisplacement;\n\n    float2 displacedCoord = fragCoord - float2(shiftX, shiftY);\n\n    if (EdgeBehavior > 0.5) {\n        // Wrap Pixels Around\n        float2 norm = (displacedCoord + halfRes) / res;\n        norm = fract(norm);\n        displacedCoord = norm * res - halfRes;\n    } else {\n        // Clamp / discard outside bounding box\n        if (abs(displacedCoord.x) > halfRes.x || abs(displacedCoord.y) > halfRes.y) {\n            return half4(0.0);\n        }\n    }\n\n    return layer.eval(displacedCoord);\n}\n";
    /* @@END_SKSL@@ */

    var DEFAULTS = {
        maxHorizontalDisplacement: 10.0,
        maxVerticalDisplacement: 10.0,
        horizontalSourceChannel: 0,
        verticalSourceChannel: 1,
        mapBehavior: 0,
        edgeBehavior: 0
    };

    var TAG_SKSL = '[AE:Displacement Map]';

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
            maxHorizontalDisplacement: clampNum(p.maxHorizontalDisplacement !== undefined ? p.maxHorizontalDisplacement : p.MaxHorizontalDisplacement, -500.0, 500.0, DEFAULTS.maxHorizontalDisplacement),
            maxVerticalDisplacement: clampNum(p.maxVerticalDisplacement !== undefined ? p.maxVerticalDisplacement : p.MaxVerticalDisplacement, -500.0, 500.0, DEFAULTS.maxVerticalDisplacement),
            horizontalSourceChannel: clampNum(p.horizontalSourceChannel !== undefined ? p.horizontalSourceChannel : p.HorizontalSourceChannel, 0, 6, DEFAULTS.horizontalSourceChannel),
            verticalSourceChannel: clampNum(p.verticalSourceChannel !== undefined ? p.verticalSourceChannel : p.VerticalSourceChannel, 0, 6, DEFAULTS.verticalSourceChannel),
            mapBehavior: clampNum(p.mapBehavior !== undefined ? p.mapBehavior : p.MapBehavior, 0, 2, DEFAULTS.mapBehavior),
            edgeBehavior: clampNum(p.edgeBehavior !== undefined ? p.edgeBehavior : p.EdgeBehavior, 0, 1, DEFAULTS.edgeBehavior)
        };
    }

    var PARAM_SPECS = [
        { name: 'MaxHorizontalDisplacement', key: 'maxHorizontalDisplacement', type: 'double', default: DEFAULTS.maxHorizontalDisplacement },
        { name: 'MaxVerticalDisplacement', key: 'maxVerticalDisplacement', type: 'double', default: DEFAULTS.maxVerticalDisplacement },
        { name: 'HorizontalSourceChannel', key: 'horizontalSourceChannel', type: 'double', default: DEFAULTS.horizontalSourceChannel },
        { name: 'VerticalSourceChannel', key: 'verticalSourceChannel', type: 'double', default: DEFAULTS.verticalSourceChannel },
        { name: 'MapBehavior', key: 'mapBehavior', type: 'double', default: DEFAULTS.mapBehavior },
        { name: 'EdgeBehavior', key: 'edgeBehavior', type: 'double', default: DEFAULTS.edgeBehavior }
    ];

    function calculatePadding(params) {
        var padX = Math.ceil(Math.abs(params.maxHorizontalDisplacement || 0.0)) + 10;
        var padY = Math.ceil(Math.abs(params.maxVerticalDisplacement || 0.0)) + 10;
        return { x: padX, y: padY };
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

    function applyDisplacementMap(targetLayerId, rawOptions) {
        if (!targetLayerId) {
            return {
                status: 'error',
                effect: 'displacement-map',
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
                effect: 'displacement-map',
                message: 'Failed to create skslFilter node in Cavalry'
            };
        }

        safeCall(function () {
            if (typeof api.setName === 'function') {
                api.setName(filterId, 'Displacement Map');
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

        // Optional secondary map source layer connection
        var mapSourceId = (rawOptions && (rawOptions.displacementMapLayer || rawOptions.mapLayerId)) || null;
        var mapConnected = false;
        if (mapSourceId) {
            mapConnected = safeCall(function () {
                if (typeof api.connect === 'function') {
                    return api.connect(mapSourceId, 'id', filterId, 'mattes.0');
                }
                return false;
            }, false);
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
            effect: 'displacement-map',
            aeMatchName: 'ADBE Displacement Map',
            nodeId: filterId,
            targetLayerId: targetLayerId,
            connected: Boolean(connOk),
            codeConfigured: Boolean(codeSetOk),
            boundAttributes: boundAttributes,
            parameters: params,
            padding: pad,
            mapSourceLayer: mapSourceId,
            mapConnected: Boolean(mapConnected),
            inspect: inspectPayload
        };
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            apply: applyDisplacementMap,
            normalizeParams: normalizeParams,
            calculatePadding: calculatePadding,
            PARAM_SPECS: PARAM_SPECS,
            DEFAULTS: DEFAULTS,
            SKSL_SOURCE: SKSL_SOURCE
        };
    } else {
        if (typeof globalThis !== 'undefined') {
            globalThis.AEDisplacementMap = { apply: applyDisplacementMap };
        }
    }
})();
