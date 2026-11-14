/**
 * One-Action Reusable Implementation & Applicator:
 * Adobe After Effects "CC Ball Action" -> Cavalry 2.8+
 *
 * Implemented as a high-performance GPU SkSL Filter (`skslFilter`) with
 * spherical surface normals, Phong shading, 3D scatter, 3D axis rotation, and grid-aligned ray/coverage sorting.
 */
(function () {
    /* @@BEGIN_SKSL@@ */
    var SKSL_SOURCE = "// Adobe After Effects \"CC Ball Action\" (CC Ball Action)\n// Reconstructed mathematically for Cavalry 2.8+ as a high-performance GPU SkSL Filter (`skslFilter`).\n//\n// Built-in Cavalry preamble uniforms (injected automatically by Cavalry runtime):\n//   `layer` (uniform shader) - Source layer texture sampler (layer.eval(coords))\n//   `resolution` (float2)   - Bounding dimensions in pixels (centered coordinate space)\n\nuniform shader layer;\n\n// Dynamic attribute uniforms (mapped to Cavalry `inputs.0`..`inputs.5`):\nuniform float Scatter;           // Scatter displacement distance in pixels (default: 0.0, range: 0.0 to 1024.0)\nuniform float RotationAxis;      // 0 = X, 1 = Y, 2 = Z (default: 0)\nuniform float RotationAngle;     // 3D Grid rotation in degrees (default: 0.0)\nuniform float BallSize;          // Sphere radius percentage relative to grid (default: 100.0, range: 0.0 to 1000.0)\nuniform float GridSpacing;       // Distance between ball centers in pixels (default: 10.0, range: 1.0 to 100.0)\nuniform float InstabilityState;  // Pseudo-random seed for scatter field (default: 0.0, range: 0.0 to 10000.0)\n\n// Fast pseudo-random 3D hash generator for grid coordinates\nfloat3 ballHash3(float2 p, float seed) {\n    float3 q = float3(\n        dot(p, float2(127.1, 311.7)) + seed * 17.13,\n        dot(p, float2(269.5, 183.3)) + seed * 31.41,\n        dot(p, float2(419.2, 371.9)) + seed * 7.91\n    );\n    float3 s = sin(q) * 43758.5453;\n    return fract(s) * 2.0 - 1.0;\n}\n\nhalf4 main(float2 fragCoord) {\n    float S = max(1.0, GridSpacing);\n    float R = 0.5 * S * max(0.0, BallSize * 0.01);\n    if (R <= 0.001) {\n        return half4(0.0);\n    }\n\n    // Directional lighting vector (top-left key light)\n    float3 lightDir = normalize(float3(-0.4, -0.6, 0.7));\n    float3 viewDir = float3(0.0, 0.0, 1.0);\n\n    float2 baseCell = floor(fragCoord / S);\n    float maxZ = -1.0e9;\n    half4 bestColor = half4(0.0);\n\n    float rad = radians(RotationAngle);\n    float cosA = cos(rad);\n    float sinA = sin(rad);\n\n    // Scan immediate 3x3 grid cells to resolve overlap, 3D rotation, and scatter depth\n    for (int dy = -1; dy <= 1; dy++) {\n        for (int dx = -1; dx <= 1; dx++) {\n            float2 cell = baseCell + float2(float(dx), float(dy));\n            float2 cellCenter = (cell + 0.5) * S;\n\n            // Generate deterministic pseudo-random 3D scatter vector\n            float3 rnd = ballHash3(cell, InstabilityState);\n            float3 pos = float3(cellCenter.x + rnd.x * Scatter, cellCenter.y + rnd.y * Scatter, rnd.z * Scatter);\n\n            // Apply 3D Rotation (X, Y, or Z axis)\n            if (abs(RotationAngle) > 0.001) {\n                if (RotationAxis < 0.5) {\n                    // X-axis rotation\n                    float ny = pos.y * cosA - pos.z * sinA;\n                    float nz = pos.y * sinA + pos.z * cosA;\n                    pos.y = ny;\n                    pos.z = nz;\n                } else if (RotationAxis < 1.5) {\n                    // Y-axis rotation\n                    float nx = pos.x * cosA + pos.z * sinA;\n                    float nz = -pos.x * sinA + pos.z * cosA;\n                    pos.x = nx;\n                    pos.z = nz;\n                } else {\n                    // Z-axis rotation\n                    float nx = pos.x * cosA - pos.y * sinA;\n                    float ny = pos.x * sinA + pos.y * cosA;\n                    pos.x = nx;\n                    pos.y = ny;\n                }\n            }\n\n            float2 d = fragCoord - pos.xy;\n            float dist = length(d);\n\n            if (dist < R + 0.75) {\n                // Sphere silhouette antialiasing\n                float edge = smoothstep(R + 0.5, R - 0.5, dist);\n                if (edge > 0.0 && pos.z > maxZ) {\n                    float nx = d.x / R;\n                    float ny = d.y / R;\n                    float nz = sqrt(max(0.0, 1.0 - nx * nx - ny * ny));\n                    float3 norm = float3(nx, ny, nz);\n\n                    // Diffuse lighting (ambient + directional)\n                    float diff = max(0.0, dot(norm, lightDir));\n                    float lighting = 0.35 + 0.65 * diff;\n\n                    // Specular Phong highlight\n                    float3 reflectDir = reflect(-lightDir, norm);\n                    float spec = pow(max(0.0, dot(reflectDir, viewDir)), 16.0) * 0.45;\n\n                    // Sample source layer color at cell center\n                    half4 src = layer.eval(cellCenter);\n                    half3 shadedRgb = src.rgb * half(lighting) + half3(spec * lighting);\n\n                    bestColor = half4(clamp(shadedRgb, half3(0.0), half3(1.0)), src.a * half(edge));\n                    maxZ = pos.z;\n                }\n            }\n        }\n    }\n\n    return bestColor;\n}\n";
    /* @@END_SKSL@@ */

    var DEFAULTS = {
        scatter: 0.0,
        rotationAxis: 0.0,
        rotationAngle: 0.0,
        ballSize: 100.0,
        gridSpacing: 10.0,
        instabilityState: 0.0
    };

    var AXIS_MAP = {
        '0': 0, 'x': 0, 'x axis': 0, 'xaxis': 0,
        '1': 1, 'y': 1, 'y axis': 1, 'yaxis': 1,
        '2': 2, 'z': 2, 'z axis': 2, 'zaxis': 2
    };

    var TAG_SKSL = '[AE:CC Ball Action]';

    function safeCall(fn, fallback) {
        try {
            return fn();
        } catch (err) {
            if (typeof globalThis !== 'undefined' && globalThis.AE_EFFECTS_DEBUG && typeof console !== 'undefined' && console.warn) {
                console.warn("[AE:CC Ball Action]" + ' call failed: ' + (err && err.message ? err.message : err));
            }
            return fallback;
        }
    }

    function clampNum(v, lo, hi, fb) {
        var n = Number(v);
        if (!isFinite(n)) return fb;
        return n < lo ? lo : (n > hi ? hi : n);
    }

    function resolveEnum(v, table, fb) {
        if (typeof v === 'number' && isFinite(v)) return Math.round(v);
        if (v === null || v === undefined) return fb;
        var key = String(v).toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
        return table.hasOwnProperty(key) ? table[key] : fb;
    }

    function normalizeParams(raw) {
        var p = raw && typeof raw === 'object' ? raw : {};
        return {
            scatter: clampNum(p.scatter !== undefined ? p.scatter : p.Scatter, 0.0, 1024.0, DEFAULTS.scatter),
            rotationAxis: resolveEnum(p.rotationAxis !== undefined ? p.rotationAxis : p.RotationAxis, AXIS_MAP, DEFAULTS.rotationAxis),
            rotationAngle: clampNum(p.rotationAngle !== undefined ? p.rotationAngle : p.RotationAngle, -360.0, 360.0, DEFAULTS.rotationAngle),
            ballSize: clampNum(p.ballSize !== undefined ? p.ballSize : p.BallSize, 0.0, 1000.0, DEFAULTS.ballSize),
            gridSpacing: clampNum(p.gridSpacing !== undefined ? p.gridSpacing : p.GridSpacing, 1.0, 100.0, DEFAULTS.gridSpacing),
            instabilityState: clampNum(p.instabilityState !== undefined ? p.instabilityState : p.InstabilityState, 0.0, 10000.0, DEFAULTS.instabilityState)
        };
    }

    var PARAM_SPECS = [
        { name: 'Scatter', key: 'scatter', type: 'double', default: DEFAULTS.scatter },
        { name: 'RotationAxis', key: 'rotationAxis', type: 'double', default: DEFAULTS.rotationAxis },
        { name: 'RotationAngle', key: 'rotationAngle', type: 'double', default: DEFAULTS.rotationAngle },
        { name: 'BallSize', key: 'ballSize', type: 'double', default: DEFAULTS.ballSize },
        { name: 'GridSpacing', key: 'gridSpacing', type: 'double', default: DEFAULTS.gridSpacing },
        { name: 'InstabilityState', key: 'instabilityState', type: 'double', default: DEFAULTS.instabilityState }
    ];

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
            if (!hasSlotInAttrs && !curName) {
                if (hasGroupAttr && idx > 0) break;
                continue;
            }
            if (claimedSlots[slot]) continue;
            if (curName === uniformName) {
                claimedSlots[slot] = true;
                setAttrValue(nodeId, slot, setVal);
                return slot;
            }
            if (!firstPlaceholder && (!curName || /^n\d+$/.test(curName))) {
                firstPlaceholder = slot;
            }
        }

        if (firstPlaceholder) {
            claimedSlots[firstPlaceholder] = true;
            if (typeof api.renameAttribute === 'function') {
                safeCall(function () { api.renameAttribute(nodeId, firstPlaceholder, uniformName); }, null);
            }
            setAttrValue(nodeId, firstPlaceholder, setVal);
            return firstPlaceholder;
        }

        if (typeof api.addDynamic === 'function' && hasGroupAttr) {
            var added = safeCall(function () { return api.addDynamic(nodeId, groupAttr, attrType); }, null);
            var newSlot = (typeof added === 'string' && added.indexOf(groupAttr + '.') === 0) ? added : null;
            if (!newSlot) {
                var after = safeCall(function () { return api.getAttributes(nodeId); }, []) || [];
                for (var aIdx = 0; aIdx < 32; aIdx++) {
                    var cand = groupAttr + '.' + aIdx;
                    var candName = typeof api.getCustomAttributeName === 'function'
                        ? safeCall(function () { return api.getCustomAttributeName(nodeId, cand); }, '')
                        : '';
                    if ((after.indexOf(cand) >= 0 || candName) && attrs.indexOf(cand) < 0 && !claimedSlots[cand]) {
                        newSlot = cand;
                        break;
                    }
                }
            }
            if (newSlot) {
                claimedSlots[newSlot] = true;
                if (typeof api.renameAttribute === 'function') {
                    safeCall(function () { api.renameAttribute(nodeId, newSlot, uniformName); }, null);
                }
                setAttrValue(nodeId, newSlot, setVal);
                return newSlot;
            }
        }
        return null;
    }

    function extractLayerId(connStr) {
        if (!connStr || typeof connStr !== 'string') return null;
        var dotIdx = connStr.indexOf('.');
        return dotIdx >= 0 ? connStr.slice(0, dotIdx) : connStr;
    }

    function getConnectedNodes(targetId, portAttr, nodeType) {
        var ids = [];
        var seen = {};
        function pushConn(raw) {
            if (Array.isArray(raw)) {
                for (var r = 0; r < raw.length; r++) pushConn(raw[r]);
                return;
            }
            var id = extractLayerId(raw);
            if (id && !seen[id]) {
                seen[id] = true;
                ids.push(id);
            }
        }
        if (typeof api.getInConnections === 'function') {
            pushConn(safeCall(function () { return api.getInConnections(targetId, portAttr); }, null));
        }
        if (typeof api.getInConnection === 'function') {
            pushConn(safeCall(function () { return api.getInConnection(targetId, portAttr); }, null));
        }
        if (typeof api.getConnected === 'function') {
            pushConn(safeCall(function () { return api.getConnected(targetId, portAttr); }, null));
        }
        for (var pIdx = 0; pIdx < 16; pIdx++) {
            if (typeof api.getInConnection === 'function') {
                var idxConn = safeCall(function () { return api.getInConnection(targetId, portAttr + '.' + pIdx); }, null);
                if (idxConn) pushConn(idxConn);
            }
            if (typeof api.getConnected === 'function') {
                var idxConn2 = safeCall(function () { return api.getConnected(targetId, portAttr + '.' + pIdx); }, null);
                if (idxConn2) pushConn(idxConn2);
            }
        }
        if (ids.length) return ids;

        var all = safeCall(function () { return api.getCompLayers(false); }, []) || [];
        for (var i = 0; i < all.length; i++) {
            var id = all[i];
            var lType = safeCall(function () { return api.getLayerType ? api.getLayerType(id) : (api.getType ? api.getType(id) : ''); }, '');
            if (lType !== nodeType) continue;
            var outs = safeCall(function () { return api.getOutConnections(id, 'id'); }, []) || [];
            if (Array.isArray(outs)) {
                for (var j = 0; j < outs.length; j++) {
                    if (extractLayerId(String(outs[j])) === targetId) {
                        pushConn(id);
                        break;
                    }
                }
            }
        }
        return ids;
    }

    function findExistingFilter(layerId) {
        var layerType = safeCall(function () { return api.getLayerType ? api.getLayerType(layerId) : (api.getType ? api.getType(layerId) : ''); }, '');
        if (layerType === 'skslFilter') {
            return layerId;
        }
        var linked = getConnectedNodes(layerId, 'filters', 'skslFilter');
        for (var i = 0; i < linked.length; i++) {
            var name = safeCall(function () { return api.getNiceName ? api.getNiceName(linked[i]) : (api.getName ? api.getName(linked[i]) : ''); }, '');
            if (name && (name.indexOf(TAG_SKSL) >= 0 || name.indexOf('CC Ball Action') >= 0)) {
                return linked[i];
            }
        }
        return null;
    }

    function calculatePadding(params) {
        var s = params.scatter || 0;
        var g = params.gridSpacing || 10;
        var b = params.ballSize || 100;
        var r = 0.5 * g * (b / 100.0);
        var basePad = Math.ceil(s + Math.max(0, r - g * 0.5) + 20);
        var p = Math.min(Math.max(basePad, 0), 4096);
        return { x: p, y: p };
    }

    function applyCCBallActionToLayer(layerId, comp, params, liveCode) {
        var filterId = findExistingFilter(layerId);
        var isNew = false;
        var targetName = safeCall(function () { return api.getNiceName ? api.getNiceName(layerId) : (api.getName ? api.getName(layerId) : layerId); }, layerId);

        if (!filterId) {
            filterId = safeCall(function () { return api.create('skslFilter', TAG_SKSL + ' ' + targetName); }, null);
            isNew = true;
        }

        if (!filterId) {
            return {
                targetId: layerId,
                targetName: targetName,
                ok: false,
                error: 'Failed to create skslFilter node'
            };
        }

        var pad = calculatePadding(params);
        var basePayload = { code: liveCode, padding: pad };
        safeCall(function () { api.set(filterId, basePayload); }, null);

        var claimedSlots = {};
        var boundSlots = {};
        for (var i = 0; i < PARAM_SPECS.length; i++) {
            var entry = PARAM_SPECS[i];
            var val = params[entry.key];
            var slot = bindDynamicSlot(filterId, 'inputs', entry, val, claimedSlots);
            if (slot) boundSlots[entry.key] = slot;
        }

        var isAttached = false;
        var existingFilters = getConnectedNodes(layerId, 'filters', 'skslFilter');
        for (var j = 0; j < existingFilters.length; j++) {
            if (existingFilters[j] === filterId) {
                isAttached = true;
                break;
            }
        }

        if (!isAttached && layerId !== filterId) {
            safeCall(function () { api.connect(filterId, 'id', layerId, 'filters'); }, null);
        }

        return {
            targetId: layerId,
            targetName: targetName,
            filterId: filterId,
            ok: true,
            isNew: isNew,
            boundSlots: boundSlots,
            padding: pad
        };
    }

    var cfg = (typeof __EFFECT_CONFIG__ !== 'undefined' && __EFFECT_CONFIG__) ? __EFFECT_CONFIG__ : {};
    var params = normalizeParams(cfg.params || cfg);
    var activeComp = safeCall(function () { return api.getActiveComp(); }, 'compNode#1');

    var selection = safeCall(function () { return api.getSelection(); }, []) || [];
    var applied = [];

    var liveCode = (typeof SKSL_SOURCE === 'string' && SKSL_SOURCE.length > 0) ? SKSL_SOURCE : '';

    if (selection.length > 0) {
        for (var sIdx = 0; sIdx < selection.length; sIdx++) {
            applied.push(applyCCBallActionToLayer(selection[sIdx], activeComp, params, liveCode));
        }
    } else {
        var demoRect = safeCall(function () {
            var r = api.primitive('rectangle', 'CC Ball Action Demo');
            api.set(r, { 'position.x': 0, 'position.y': 0, 'size.x': 300, 'size.y': 300 });
            return r;
        }, null);
        if (demoRect) {
            applied.push(applyCCBallActionToLayer(demoRect, activeComp, params, liveCode));
            safeCall(function () { api.select([demoRect]); }, null);
        }
    }

    var failedCount = 0;
    for (var rIdx = 0; rIdx < applied.length; rIdx++) {
        if (applied[rIdx] && applied[rIdx].ok === false) failedCount++;
    }
    var isOk = applied.length > 0 && failedCount === 0;
    var isPartial = failedCount > 0 && failedCount < applied.length;

    var report = {
        ok: isOk,
        partial: isPartial,
        effect: 'CC Ball Action',
        slug: 'cc-ball-action',
        code: isOk ? 'SUCCESS' : (isPartial ? 'PARTIAL_SUCCESS' : 'RUNTIME_EXCEPTION'),
        error: isOk ? null : (failedCount + ' layer(s) failed'),
        appliedCount: applied.length - failedCount,
        failedCount: failedCount,
        warnings: [],
        targets: (function() { var t = []; for (var i = 0; i < applied.length; i++) t.push(applied[i].targetId); return t; })(),
        results: applied,
        params: params
    };

    try { __result = report; } catch (e) {}
    if (typeof console !== 'undefined' && console.log) {
        console.log('AE Effects: Applied CC Ball Action (skslFilter) to ' + applied.length + ' layer(s)');
    }

    return report;

    // Standard dual export shim (module exports for tests/CLI, global for panel runners).
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            apply: applyCCBallActionToLayer,
            normalizeParams: normalizeParams,
            calculatePadding: calculatePadding,
            PARAM_SPECS: PARAM_SPECS,
            DEFAULTS: DEFAULTS,
            SKSL_SOURCE: SKSL_SOURCE
        };
    } else {
        if (typeof globalThis !== 'undefined') {
            globalThis.AECcBallAction = { apply: applyCCBallActionToLayer };
        }
    }
})();
