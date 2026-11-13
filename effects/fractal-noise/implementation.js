/**
 * One-Action Reusable Implementation & Applicator:
 * Adobe After Effects "Fractal Noise" -> Cavalry 2.8+
 *
 * Implemented as a high-performance GPU SkSL Filter (`skslFilter`) with
 * multi-octave 4D Simplex noise and contrast/brightness remapping.
 */
(function () {
    /* @@BEGIN_SKSL@@ */
    var SKSL_SOURCE = "// Adobe After Effects \"Fractal Noise\" (ADBE Fractal Noise)\n// Reconstructed mathematically for Cavalry 2.8+ as a high-performance GPU SkSL Filter (`skslFilter`).\n//\n// Built-in Cavalry preamble uniforms (injected automatically by Cavalry runtime):\n//   `layer` (uniform shader) - Source layer texture sampler (layer.eval(coords))\n//   `resolution` (float2)   - Bounding dimensions in pixels (centered coordinate space)\n\nuniform shader layer;\n\n// Dynamic attribute uniforms (mapped to Cavalry `inputs.0`..`inputs.13`):\nuniform float FractalType;       // 0=Basic, 1=Turbulent Smooth, 2=Turbulent Basic, 3=Turbulent Sharp, 4=Dynamic\nuniform float NoiseType;         // 0=Soft Linear, 1=Spline\nuniform float Invert;            // 0=Normal, 1=Inverted\nuniform float Contrast;          // Noise contrast multiplier (default: 100.0)\nuniform float Brightness;        // Noise brightness offset (default: 0.0)\nuniform float Overflow;          // 0=Clip, 1=Soft Clamp, 2=Wrap\nuniform float Complexity;        // Octaves of detail (default: 6.0, range: 1.0 to 10.0)\nuniform float Scale;             // Spatial noise scale in pixels (default: 100.0)\nuniform float2 Offset;           // 2D Spatial panning offset\nuniform float Evolution;         // Phase evolution in degrees\nuniform bool CycleEvolution;     // Whether evolution cycles seamlessly\nuniform float CycleRevolutions;  // Number of revolutions before cycling\nuniform float RandomSeed;        // Noise seed offset\nuniform float Opacity;           // Blend opacity over layer (default: 1.0)\n\nfloat4 mod289(float4 x) {\n    return x - floor(x * (1.0 / 289.0)) * 289.0;\n}\n\nfloat mod289(float x) {\n    return x - floor(x * (1.0 / 289.0)) * 289.0;\n}\n\nfloat perm4(float x) {\n    float w = mod289(x);\n    return mod289(((w * 34.0) + 1.0) * w);\n}\n\nfloat4 grad4Symmetric(float j) {\n    float idx = floor(j - floor(j * 0.03125) * 32.0);\n    float s0 = 1.0 - 2.0 * step(0.25, fract(idx * 0.5));\n    float s1 = 1.0 - 2.0 * step(0.25, fract(floor(idx * 0.5) * 0.5));\n    float s2 = 1.0 - 2.0 * step(0.25, fract(floor(idx * 0.25) * 0.5));\n    float z = floor(idx * 0.125);\n    float z0 = 1.0 - step(0.5, abs(z - 0.0));\n    float z1 = 1.0 - step(0.5, abs(z - 1.0));\n    float z2 = 1.0 - step(0.5, abs(z - 2.0));\n    float z3 = 1.0 - step(0.5, abs(z - 3.0));\n    return z0 * float4(0.0, s0, s1, s2)\n         + z1 * float4(s0, 0.0, s1, s2)\n         + z2 * float4(s0, s1, 0.0, s2)\n         + z3 * float4(s0, s1, s2, 0.0);\n}\n\nfloat snoise4(float4 v) {\n    float F4 = 0.309016994374947451;\n    float G4 = 0.1381966011250105;\n    float NOISE4_GAIN = 27.0;\n\n    float s = dot(v, float4(F4));\n    float4 i = floor(v + s);\n    float t0 = dot(i, float4(G4));\n    float4 x0 = v - i + t0;\n\n    float4 rank = float4(0.0);\n    float3 isX = step(x0.yzw, x0.xxx);\n    float3 isYZ = step(x0.zww, x0.yyz);\n    rank.x = isX.x + isX.y + isX.z;\n    rank.yzw = 1.0 - isX;\n    rank.y += isYZ.x + isYZ.y;\n    rank.zw += 1.0 - isYZ.xy;\n    rank.z += isYZ.z;\n    rank.w += 1.0 - isYZ.z;\n\n    float4 i1 = clamp(rank - 2.0, 0.0, 1.0);\n    float4 i2 = clamp(rank - 1.0, 0.0, 1.0);\n    float4 i3 = clamp(rank, 0.0, 1.0);\n\n    float4 x1 = x0 - i1 + G4;\n    float4 x2 = x0 - i2 + 2.0 * G4;\n    float4 x3 = x0 - i3 + 3.0 * G4;\n    float4 x4 = x0 - 1.0 + 4.0 * G4;\n\n    float4 mi = mod289(i);\n    float j0 = perm4(perm4(perm4(perm4(mi.w) + mi.z) + mi.y) + mi.x);\n    float j1 = perm4(perm4(perm4(perm4(mi.w + i1.w) + mi.z + i1.z) + mi.y + i1.y) + mi.x + i1.x);\n    float j2 = perm4(perm4(perm4(perm4(mi.w + i2.w) + mi.z + i2.z) + mi.y + i2.y) + mi.x + i2.x);\n    float j3 = perm4(perm4(perm4(perm4(mi.w + i3.w) + mi.z + i3.z) + mi.y + i3.y) + mi.x + i3.x);\n    float j4 = perm4(perm4(perm4(perm4(mi.w + 1.0) + mi.z + 1.0) + mi.y + 1.0) + mi.x + 1.0);\n\n    float m0 = max(0.6 - dot(x0, x0), 0.0);\n    float m1 = max(0.6 - dot(x1, x1), 0.0);\n    float m2 = max(0.6 - dot(x2, x2), 0.0);\n    float m3 = max(0.6 - dot(x3, x3), 0.0);\n    float m4 = max(0.6 - dot(x4, x4), 0.0);\n\n    float4 g0 = grad4Symmetric(j0);\n    float4 g1 = grad4Symmetric(j1);\n    float4 g2 = grad4Symmetric(j2);\n    float4 g3 = grad4Symmetric(j3);\n    float4 g4 = grad4Symmetric(j4);\n\n    float4 d0123 = float4(dot(g0, x0), dot(g1, x1), dot(g2, x2), dot(g3, x3));\n    float d4 = dot(g4, x4);\n\n    float4 mv = float4(m0, m1, m2, m3);\n    float4 mv2 = mv * mv;\n    float4 mv4 = mv2 * mv2;\n    float m4_2 = m4 * m4;\n    float m4_4 = m4_2 * m4_2;\n\n    return (dot(mv4, d0123) + m4_4 * d4) * NOISE4_GAIN;\n}\n\nhalf4 main(float2 fragCoord) {\n    float safeScale = max(Scale, 1.0);\n    float2 u = (fragCoord - Offset) / safeScale;\n\n    float seedFrac = fract(RandomSeed * 0.1031) * 47.0 + fract(RandomSeed * 0.0379) * 31.0;\n    float revs = Evolution / 360.0;\n\n    float zCoord = 0.0;\n    float wCoord = 0.0;\n    if (CycleEvolution) {\n        float cycles = max(floor(CycleRevolutions + 0.5), 1.0);\n        float theta = 6.283185307179586 * (revs / cycles);\n        float radius = 0.75 * cycles;\n        zCoord = seedFrac + radius * cos(theta);\n        wCoord = seedFrac * 0.61803398875 + radius * sin(theta);\n    } else {\n        zCoord = seedFrac + revs * 0.75;\n        wCoord = seedFrac * 0.61803398875 + 3.14159265;\n    }\n\n    float comp = clamp(Complexity, 1.0, 10.0);\n    float noiseSum = 0.0;\n    float amp = 1.0;\n    float freq = 1.0;\n    float totalAmp = 0.0;\n\n    for (int oct = 0; oct < 10; oct++) {\n        float foct = float(oct);\n        float w = clamp(comp - foct, 0.0, 1.0);\n        if (w <= 0.0) break;\n\n        float oz = zCoord + foct * 7.13;\n        float ow = wCoord + foct * 11.71;\n\n        float n = snoise4(float4(u * freq, oz, ow));\n\n        if (FractalType > 0.5 && FractalType < 1.5) {\n            n = abs(n); // 1 = Turbulent Smooth\n        } else if (FractalType > 1.5 && FractalType < 2.5) {\n            n = abs(n) * 2.0 - 1.0; // 2 = Turbulent Basic\n        } else if (FractalType > 2.5 && FractalType < 3.5) {\n            n = 1.0 - 2.0 * abs(n); // 3 = Turbulent Sharp (Ridge)\n        } else if (FractalType > 3.5) {\n            n = n * abs(n); // 4 = Dynamic\n        }\n\n        noiseSum += w * amp * n;\n        totalAmp += w * amp;\n\n        amp *= 0.5;\n        freq *= 2.0;\n    }\n\n    float val = totalAmp > 0.0 ? (noiseSum / totalAmp) : 0.0;\n\n    // Remap from [-1, 1] to normalized [0, 1]\n    float v = val * 0.5 + 0.5;\n\n    // Apply Contrast & Brightness\n    float cFactor = Contrast / 100.0;\n    float bOffset = Brightness / 100.0;\n    v = (v - 0.5) * cFactor + 0.5 + bOffset;\n\n    // Apply Invert (black becomes white, white becomes black)\n    if (Invert > 0.5) {\n        v = 1.0 - v;\n    }\n\n    // Apply Overflow\n    if (Overflow < 0.5) {\n        v = clamp(v, 0.0, 1.0); // 0 = Clip\n    } else if (Overflow < 1.5) {\n        v = 1.0 / (1.0 + exp(-4.0 * (v - 0.5))); // 1 = Soft Clamp\n    } else {\n        v = fract(v); // 2 = Wrap\n    }\n\n    half4 src = layer.eval(fragCoord);\n    half3 noiseRgb = half3(v);\n    half3 finalRgb = mix(src.rgb, noiseRgb, half(clamp(Opacity, 0.0, 1.0)));\n\n    return half4(finalRgb, src.a);\n}\n";
    /* @@END_SKSL@@ */

    var DEFAULTS = {
        fractalType: 0,
        noiseType: 0,
        invert: 0,
        contrast: 100.0,
        brightness: 0.0,
        overflow: 0,
        complexity: 6.0,
        scale: 100.0,
        offset: { x: 0.0, y: 0.0 },
        evolution: 0.0,
        cycleEvolution: false,
        cycleRevolutions: 1.0,
        randomSeed: 0.0,
        opacity: 1.0
    };

    var FRACTAL_TYPE_MAP = {
        '0': 0, 'basic': 0,
        '1': 1, 'turbulent smooth': 1, 'turbulentsmooth': 1,
        '2': 2, 'turbulent basic': 2, 'turbulentbasic': 2,
        '3': 3, 'dynamic': 3
    };

    var OVERFLOW_MAP = {
        '0': 0, 'clip': 0,
        '1': 1, 'soft clamp': 1, 'softclamp': 1,
        '2': 2, 'wrap': 2
    };

    var TAG_SKSL = '[AE:Fractal Noise]';

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

    function resolveEnum(v, table, fb) {
        if (typeof v === 'number' && isFinite(v)) return Math.round(v);
        if (v === null || v === undefined) return fb;
        var key = String(v).toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
        return table.hasOwnProperty(key) ? table[key] : fb;
    }

    function resolveBool(v, fb) {
        if (typeof v === 'boolean') return v;
        if (typeof v === 'number') return v >= 0.5;
        if (v === 'true' || v === '1' || v === 'on') return true;
        if (v === 'false' || v === '0' || v === 'off') return false;
        return fb;
    }

    function normalizeParams(raw) {
        var p = raw && typeof raw === 'object' ? raw : {};
        var offX = p.offset && p.offset.x !== undefined ? p.offset.x : (p.offsetX !== undefined ? p.offsetX : DEFAULTS.offset.x);
        var offY = p.offset && p.offset.y !== undefined ? p.offset.y : (p.offsetY !== undefined ? p.offsetY : DEFAULTS.offset.y);
        return {
            fractalType: resolveEnum(p.fractalType !== undefined ? p.fractalType : p.FractalType, FRACTAL_TYPE_MAP, DEFAULTS.fractalType),
            noiseType: clampNum(p.noiseType !== undefined ? p.noiseType : p.NoiseType, 0, 1, DEFAULTS.noiseType),
            invert: resolveEnum(p.invert !== undefined ? p.invert : p.Invert, { '0': 0, 'off': 0, 'false': 0, '1': 1, 'on': 1, 'true': 1 }, DEFAULTS.invert),
            contrast: clampNum(p.contrast !== undefined ? p.contrast : p.Contrast, 0.0, 1000.0, DEFAULTS.contrast),
            brightness: clampNum(p.brightness !== undefined ? p.brightness : p.Brightness, -100.0, 100.0, DEFAULTS.brightness),
            overflow: resolveEnum(p.overflow !== undefined ? p.overflow : p.Overflow, OVERFLOW_MAP, DEFAULTS.overflow),
            complexity: clampNum(p.complexity !== undefined ? p.complexity : p.Complexity, 1.0, 10.0, DEFAULTS.complexity),
            scale: clampNum(p.scale !== undefined ? p.scale : p.Scale, 1.0, 2000.0, DEFAULTS.scale),
            offset: { x: Number(offX) || 0, y: Number(offY) || 0 },
            evolution: clampNum(p.evolution !== undefined ? p.evolution : p.Evolution, -360000.0, 360000.0, DEFAULTS.evolution),
            cycleEvolution: resolveBool(p.cycleEvolution !== undefined ? p.cycleEvolution : p.CycleEvolution, DEFAULTS.cycleEvolution),
            cycleRevolutions: clampNum(p.cycleRevolutions !== undefined ? p.cycleRevolutions : p.CycleRevolutions, 1.0, 100.0, DEFAULTS.cycleRevolutions),
            randomSeed: clampNum(p.randomSeed !== undefined ? p.randomSeed : p.RandomSeed, 0.0, 100000.0, DEFAULTS.randomSeed),
            opacity: clampNum(p.opacity !== undefined ? p.opacity : p.Opacity, 0.0, 1.0, DEFAULTS.opacity)
        };
    }

    var PARAM_SPECS = [
        { name: 'FractalType', key: 'fractalType', type: 'double', default: DEFAULTS.fractalType },
        { name: 'NoiseType', key: 'noiseType', type: 'double', default: DEFAULTS.noiseType },
        { name: 'Invert', key: 'invert', type: 'double', default: DEFAULTS.invert },
        { name: 'Contrast', key: 'contrast', type: 'double', default: DEFAULTS.contrast },
        { name: 'Brightness', key: 'brightness', type: 'double', default: DEFAULTS.brightness },
        { name: 'Overflow', key: 'overflow', type: 'double', default: DEFAULTS.overflow },
        { name: 'Complexity', key: 'complexity', type: 'double', default: DEFAULTS.complexity },
        { name: 'Scale', key: 'scale', type: 'double', default: DEFAULTS.scale },
        { name: 'Offset', key: 'offset', type: 'double2', default: DEFAULTS.offset },
        { name: 'Evolution', key: 'evolution', type: 'double', default: DEFAULTS.evolution },
        { name: 'CycleEvolution', key: 'cycleEvolution', type: 'bool', default: DEFAULTS.cycleEvolution },
        { name: 'CycleRevolutions', key: 'cycleRevolutions', type: 'double', default: DEFAULTS.cycleRevolutions },
        { name: 'RandomSeed', key: 'randomSeed', type: 'double', default: DEFAULTS.randomSeed },
        { name: 'Opacity', key: 'opacity', type: 'double', default: DEFAULTS.opacity }
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
        var setVal = val;
        if (attrType === 'double2') {
            setVal = { x: Number(val && val.x !== undefined ? val.x : 0), y: Number(val && val.y !== undefined ? val.y : 0) };
        } else if (attrType === 'bool') {
            setVal = Boolean(val);
        } else {
            setVal = Number(val);
            if (!isFinite(setVal)) setVal = entry.default !== undefined ? entry.default : 0;
        }

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
            if (name && (name.indexOf(TAG_SKSL) >= 0 || name.indexOf('Fractal Noise') >= 0)) {
                return linked[i];
            }
        }
        return null;
    }

    function applyFractalNoiseToLayer(layerId, comp, params, liveCode) {
        var filterId = findExistingFilter(layerId);
        var isNew = false;
        var targetName = safeCall(function () { return api.getNiceName ? api.getNiceName(layerId) : (api.getName ? api.getName(layerId) : layerId); }, layerId);

        if (!filterId) {
            filterId = api.create('skslFilter', TAG_SKSL + ' ' + targetName);
            isNew = true;
        }

        var claimedSlots = {};
        var boundSlots = {};
        for (var i = 0; i < PARAM_SPECS.length; i++) {
            var spec = PARAM_SPECS[i];
            var val = params[spec.key];
            var slot = bindDynamicSlot(filterId, 'inputs', spec, val, claimedSlots);
            if (slot) {
                boundSlots[spec.name] = slot;
            }
        }

        var filterProps = { code: liveCode, padding: { x: 0, y: 0 } };
        api.set(filterId, filterProps);

        if (isNew) {
            api.connect(filterId, 'id', layerId, 'filters');
        }

        return {
            filterId: filterId,
            isNew: isNew,
            boundSlots: boundSlots
        };
    }

    // MAIN EXECUTION BODY
    var config = (typeof __EFFECT_CONFIG__ !== 'undefined' && __EFFECT_CONFIG__) ? __EFFECT_CONFIG__ : {};
    var params = normalizeParams(config.params);

    var comp = safeCall(function () { return api.getActiveComp(); }, null);
    if (!comp) {
        var comps = safeCall(function () { return api.getCompLayers ? api.getCompLayers(false) : []; }, []);
        comp = comps && comps.length ? comps[0] : null;
    }

    var selection = safeCall(function () { return api.getSelection(); }, []) || [];
    var appliedLayers = [];
    var createdTarget = false;

    if (!selection.length && config.createTestTargetIfEmpty) {
        var targetRect = api.primitive('rectangle', 'Fractal Noise Test Target');
        api.set(targetRect, {
            'generator.dimensions': { x: 300, y: 300 },
            'material.materialColor': { r: 120, g: 120, b: 120, a: 255 }
        });
        selection = [targetRect];
        createdTarget = true;
    }

    if (!selection.length) {
        var msg = 'AE Effects [Fractal Noise]: No layer selected. Please select one or more layers in Cavalry.';
        var out = { ok: false, error: msg, appliedCount: 0 };
        try { __result = out; } catch (e) {}
        if (typeof console !== 'undefined' && console.warn) console.warn(msg);
        return out;
    }

    // Prepare SkSL code: strip uniform headers matching dynamic inputs
    var liveCode = SKSL_SOURCE.replace(/^\s*uniform\s+(?:float|float2|half4|bool)\s+[A-Za-z0-9_]+\s*;\s*(?:\r?\n)?/gm, '');

    var results = [];
    for (var s = 0; s < selection.length; s++) {
        var layerId = selection[s];
        var res = applyFractalNoiseToLayer(layerId, comp, params, liveCode);
        results.push(res);
        appliedLayers.push(layerId);
    }

    // Preserve original selection
    safeCall(function () { api.select(selection); }, null);

    var summary = {
        ok: true,
        effect: 'Fractal Noise',
        strategy: 'skslFilter',
        appliedCount: results.length,
        targets: appliedLayers,
        createdTarget: createdTarget,
        results: results,
        params: params
    };

    try { __result = summary; } catch (e) {}
    if (typeof console !== 'undefined' && console.log) {
        console.log('AE Effects: Applied Fractal Noise (skslFilter) to ' + results.length + ' layer(s)');
    }
    return summary;
})();
