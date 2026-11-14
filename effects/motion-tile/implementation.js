/**
 * One-Action Reusable Implementation & Applicator:
 * Adobe After Effects "Motion Tile" -> Cavalry 2.8+
 *
 * Implemented as a high-performance GPU SkSL Filter (`skslFilter`) with
 * tile repeat, edge mirroring, phase stagger, and dynamic canvas padding.
 */
(function () {
    /* @@BEGIN_SKSL@@ */
    var SKSL_SOURCE = "// Adobe After Effects \"Motion Tile\" (ADBE Tile)\n// Reconstructed mathematically for Cavalry 2.8+ as a high-performance GPU SkSL Filter (`skslFilter`).\n//\n// Built-in Cavalry preamble uniforms:\n//   `layer` (uniform shader) - Source layer texture sampler (layer.eval(coords))\n//   `resolution` (float2)   - Layer bounding dimensions in pixels\n\nuniform shader layer;\n\n// Dynamic attribute uniforms (mapped to Cavalry `inputs.0`..`inputs.5`):\nuniform float TileCenterX;   // Tile center X offset in pixels (default: 0.0)\nuniform float TileCenterY;   // Tile center Y offset in pixels (default: 0.0)\nuniform float TileWidth;     // Tile width percentage (default: 100.0, range: 1.0 to 500.0)\nuniform float TileHeight;    // Tile height percentage (default: 100.0, range: 1.0 to 500.0)\nuniform float OutputWidth;   // Output width percentage (default: 100.0, range: 10.0 to 2000.0)\nuniform float OutputHeight;  // Output height percentage (default: 100.0, range: 10.0 to 2000.0)\nuniform float MirrorEdges;   // 0 = Repeat, 1 = Mirror Edges\nuniform float Phase;         // Horizontal tile shift per vertical row (default: 0.0, range: -360.0 to 360.0)\n\nhalf4 main(float2 fragCoord) {\n    float2 res = max(resolution, float2(1.0, 1.0));\n    float2 halfRes = res * 0.5;\n\n    // Check overall output bounds\n    float outScaleX = max(OutputWidth * 0.01, 0.01);\n    float outScaleY = max(OutputHeight * 0.01, 0.01);\n    float2 maxHalfRes = halfRes * float2(outScaleX, outScaleY);\n\n    if (abs(fragCoord.x) > maxHalfRes.x || abs(fragCoord.y) > maxHalfRes.y) {\n        return half4(0.0);\n    }\n\n    // Tile dimensions in pixels\n    float tScaleX = max(TileWidth * 0.01, 0.001);\n    float tScaleY = max(TileHeight * 0.01, 0.001);\n    float2 tileDim = res * float2(tScaleX, tScaleY);\n\n    // Center offset\n    float2 center = float2(TileCenterX, TileCenterY);\n    float2 p = fragCoord - center;\n\n    // Row index for phase offset\n    float row = floor(p.y / tileDim.y + 0.5);\n    float phaseOffset = (Phase / 360.0) * tileDim.x * row;\n    p.x -= phaseOffset;\n\n    // Normalized tile coordinates centered around zero\n    float ux = p.x / tileDim.x + 0.5;\n    float uy = p.y / tileDim.y + 0.5;\n\n    float tileIdxX = floor(ux);\n    float tileIdxY = floor(uy);\n\n    float fx = fract(ux);\n    float fy = fract(uy);\n\n    // Mirroring\n    if (MirrorEdges > 0.5) {\n        bool mirrorX = (abs(int(tileIdxX)) % 2) != 0;\n        bool mirrorY = (abs(int(tileIdxY)) % 2) != 0;\n        if (mirrorX) fx = 1.0 - fx;\n        if (mirrorY) fy = 1.0 - fy;\n    }\n\n    // Map back to layer pixel coordinates\n    float2 sampleCoord = (float2(fx, fy) - 0.5) * res;\n\n    return layer.eval(sampleCoord);\n}\n";
    /* @@END_SKSL@@ */

    var DEFAULTS = {
        tileCenterX: 0.0,
        tileCenterY: 0.0,
        tileWidth: 100.0,
        tileHeight: 100.0,
        outputWidth: 100.0,
        outputHeight: 100.0,
        mirrorEdges: 1,
        phase: 0.0
    };

    var TAG_SKSL = '[AE:Motion Tile]';

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
            tileCenterX: clampNum(p.tileCenterX !== undefined ? p.tileCenterX : p.TileCenterX, -10000.0, 10000.0, DEFAULTS.tileCenterX),
            tileCenterY: clampNum(p.tileCenterY !== undefined ? p.tileCenterY : p.TileCenterY, -10000.0, 10000.0, DEFAULTS.tileCenterY),
            tileWidth: clampNum(p.tileWidth !== undefined ? p.tileWidth : p.TileWidth, 1.0, 500.0, DEFAULTS.tileWidth),
            tileHeight: clampNum(p.tileHeight !== undefined ? p.tileHeight : p.TileHeight, 1.0, 500.0, DEFAULTS.tileHeight),
            outputWidth: clampNum(p.outputWidth !== undefined ? p.outputWidth : p.OutputWidth, 10.0, 2000.0, DEFAULTS.outputWidth),
            outputHeight: clampNum(p.outputHeight !== undefined ? p.outputHeight : p.OutputHeight, 10.0, 2000.0, DEFAULTS.outputHeight),
            mirrorEdges: clampNum(p.mirrorEdges !== undefined ? p.mirrorEdges : p.MirrorEdges, 0, 1, DEFAULTS.mirrorEdges),
            phase: clampNum(p.phase !== undefined ? p.phase : p.Phase, -360.0, 360.0, DEFAULTS.phase)
        };
    }

    var PARAM_SPECS = [
        { name: 'TileCenterX', key: 'tileCenterX', type: 'double', default: DEFAULTS.tileCenterX },
        { name: 'TileCenterY', key: 'tileCenterY', type: 'double', default: DEFAULTS.tileCenterY },
        { name: 'TileWidth', key: 'tileWidth', type: 'double', default: DEFAULTS.tileWidth },
        { name: 'TileHeight', key: 'tileHeight', type: 'double', default: DEFAULTS.tileHeight },
        { name: 'OutputWidth', key: 'outputWidth', type: 'double', default: DEFAULTS.outputWidth },
        { name: 'OutputHeight', key: 'outputHeight', type: 'double', default: DEFAULTS.outputHeight },
        { name: 'MirrorEdges', key: 'mirrorEdges', type: 'double', default: DEFAULTS.mirrorEdges },
        { name: 'Phase', key: 'phase', type: 'double', default: DEFAULTS.phase }
    ];

    function calculatePadding(params, res) {
        var resX = res ? Math.max(res.x || 100, 100) : 100;
        var resY = res ? Math.max(res.y || 100, 100) : 100;
        var outW = Math.max(params.outputWidth || 100.0, 100.0);
        var outH = Math.max(params.outputHeight || 100.0, 100.0);

        var padX = Math.ceil(resX * (outW / 100.0 - 1.0) * 0.5) + 10;
        var padY = Math.ceil(resY * (outH / 100.0 - 1.0) * 0.5) + 10;
        return {
            x: Math.max(0, padX),
            y: Math.max(0, padY)
        };
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

    function applyMotionTile(targetLayerId, rawOptions) {
        if (!targetLayerId) {
            return {
                status: 'error',
                effect: 'motion-tile',
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
                effect: 'motion-tile',
                message: 'Failed to create skslFilter node in Cavalry'
            };
        }

        safeCall(function () {
            if (typeof api.setName === 'function') {
                api.setName(filterId, 'Motion Tile');
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

        var pad = calculatePadding(params, null);
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
            effect: 'motion-tile',
            aeMatchName: 'ADBE Tile',
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

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            apply: applyMotionTile,
            normalizeParams: normalizeParams,
            calculatePadding: calculatePadding,
            PARAM_SPECS: PARAM_SPECS,
            DEFAULTS: DEFAULTS,
            SKSL_SOURCE: SKSL_SOURCE
        };
    } else {
        if (typeof globalThis !== 'undefined') {
            globalThis.AEMotionTile = { apply: applyMotionTile };
        }
    }
})();
