/**
 * One-Action Reusable Implementation & Applicator:
 * Adobe After Effects "Deep Glow" -> Cavalry 2.8+
 *
 * Reverse-engineered directly from After Effects Deep Glow 2 binary
 * and reconstructed mathematically as an GPU-accelerated SkSL Filter (`skslFilter`).
 *
 * Designed to execute inside Cavalry's `script` context via Stallion / `cavalry_apply_dsl`,
 * or standalone inside Cavalry's Script Editor (`Scripts -> AE Effects`).
 *
 * Optional injected override before script body:
 *   var __EFFECT_CONFIG__ = {
 *     params: { radius, exposure, threshold, thresholdSmooth, saturationBias, aspectRatio, aspectAngle, aberration, glowMode, blendMode, tintMode, tintColor, tintColorOuter, tintBlendMode, tintStrength, toneMapMode, sourceOpacity },
 *     animateExposure: { startFrame: 0, endFrame: 50, startValue: 0.0, endValue: 2.0 },
 *     createTestTargetIfEmpty: false
 *   };
 */
(function () {
    /* @@BEGIN_SKSL@@ */
    var SKSL_SOURCE = "// Adobe After Effects \"Deep Glow\" Style Optical Glow Reconstructed for Cavalry 2.8+\n// Independent mathematical formulation based on inverse-square light attenuation,\n// Vogel golden-spiral radial disk sampling, Pegtop overlay equations, and ACES filmic tone mapping.\n//\n// Built-in Cavalry preamble uniforms (injected automatically by Cavalry runtime):\n//   `layer` (uniform shader) - Source layer texture sampler (layer.eval(coords))\n//   `resolution` (float2)   - Bounding dimensions in pixels (centered coordinate space)\n\nuniform shader layer;\n\n// Dynamic attribute uniforms (mapped to Cavalry `inputs.0`..`inputs.16`):\n// Stripped when setting `code` on live Cavalry `skslFilter` since Cavalry auto-injects them;\n// retained here for standalone SkSL compilation and offline mathematical validation.\nuniform float Radius;          // Spread radius in pixels (default: 120.0)\nuniform float Exposure;        // Glow brightness multiplier (default: 1.0)\nuniform float Threshold;       // Cutoff luminance for glow source (default: 0.0)\nuniform float ThresholdSmooth; // Smooth knee width for threshold (default: 0.1)\nuniform float SaturationBias;  // Bias threshold towards saturated colors (-1.0 to 1.0)\nuniform float AspectRatio;     // Anamorphic flare aspect ratio (default: 1.0)\nuniform float AspectAngle;     // Anamorphic flare rotation in degrees (default: 0.0)\nuniform float Aberration;      // Chromatic dispersion split (default: 0.0)\nuniform float GlowMode;        // 0 = Inverse Square, 1 = Smooth Gaussian, 2 = Core Concentrated\nuniform float BlendMode;       // 0 = Add, 1 = Screen, 2 = Glow Only\nuniform float TintMode;        // 0 = Off, 1 = Monocolor, 2 = Duocolor\nuniform half4 TintColor;       // Primary / Inner tint color (half4)\nuniform half4 TintColorOuter;  // Secondary / Outer tint color (half4)\nuniform float TintBlendMode;   // 0 = Multiply, 1 = Overlay, 2 = Soft Light\nuniform float TintStrength;    // Tint mix factor (0.0 to 1.0)\nuniform float ToneMapMode;     // 0=None, 1=ACES Filmic, 2=Filmic, 3=Reinhard, 4=Reinhard2, 5=Clamp Chroma\nuniform float SourceOpacity;   // Original layer visibility (default: 1.0)\n\n// Helper: RGB to HSV saturation (safe for HDR / overbright values)\nfloat rgb2s(half3 c) {\n    float maxVal = max(max(float(c.r), float(c.g)), float(c.b));\n    if (maxVal > 1.0) {\n        c /= half(maxVal);\n        maxVal = 1.0;\n    }\n    float minVal = min(min(float(c.r), float(c.g)), float(c.b));\n    float delta = maxVal - minVal;\n    return (maxVal > 1e-5) ? (delta / maxVal) : 0.0;\n}\n\n// Prefilter: Thresholding with soft knee and saturation bias\nhalf3 prefilterColor(half3 c, float thresh, float smoothKnee, float satBias) {\n    c = max(c, half3(0.0));\n    if (thresh > 0.0) {\n        half3 copy = c;\n        float low = max(thresh - smoothKnee, 0.0);\n        float high = thresh + smoothKnee + 1e-5;\n        half3 knee = smoothstep(half3(low), half3(high), c);\n        c *= knee;\n        if (abs(satBias) > 0.001) {\n            float s = rgb2s(copy);\n            if (satBias < 0.0) {\n                s = 1.0 - s;\n            }\n            float satKnee = smoothstep(low, high, s);\n            c = mix(c, copy * half(satKnee), half(abs(satBias)));\n        }\n    }\n    return c;\n}\n\n// Helper: Overlay blend mode (Pegtop/Photoshop overlay formula in linear space)\nhalf3 overlayBlend(half3 a, half3 b) {\n    return mix(half(2.0) * a * b, half(1.0) - half(2.0) * (half(1.0) - a) * (half(1.0) - b), step(half(0.5), a));\n}\n\n// Helper: Soft Light blend mode (Pegtop formula: ((1 - 2b) * a^2) + (2b * a))\nhalf3 softLightBlend(half3 a, half3 b) {\n    return ((half(1.0) - half(2.0) * b) * (a * a)) + (half(2.0) * b * a);\n}\n\n// Two-Tone Tint application using Pegtop linear overlay and soft light equations\nhalf3 applyTint(half3 glow, float mode, float blendMode, half3 colA, half3 colB, float strength) {\n    if (mode < 0.5 || strength <= 0.001) {\n        return glow;\n    }\n\n    half3 tintA;\n    if (blendMode < 0.5) { // 0 = Multiply\n        tintA = glow * colA;\n    } else if (blendMode < 1.5) { // 1 = Overlay (gamma-corrected overlay per Deep Glow)\n        half3 a = pow(max(glow, half3(0.0)), half3(0.45));\n        half3 b = pow(max(colA, half3(0.0)), half3(0.45));\n        tintA = overlayBlend(a, b);\n        tintA = pow(max(tintA, half3(0.0)), half3(2.22));\n    } else { // 2 = Soft Light\n        half3 clampedGlow = min(glow, half3(1.0));\n        tintA = softLightBlend(clampedGlow, colA);\n    }\n\n    if (mode > 1.5) { // 2 = Duocolor (Two-Tone Inner/Outer)\n        half3 tintB;\n        if (blendMode < 0.5) {\n            tintB = glow * colB;\n        } else if (blendMode < 1.5) {\n            half3 a = pow(max(glow, half3(0.0)), half3(0.45));\n            half3 b = pow(max(colB, half3(0.0)), half3(0.45));\n            tintB = overlayBlend(a, b);\n            tintB = pow(max(tintB, half3(0.0)), half3(2.2));\n        } else {\n            half3 clampedGlow = min(glow, half3(1.0));\n            tintB = softLightBlend(clampedGlow, colB);\n        }\n\n        // Inner highlight vs outer falloff blend\n        half3 inner = tintA;\n        half3 outer = tintB;\n        tintA = mix(outer, inner, clamp(glow, half3(0.0), half3(1.0)));\n    }\n\n    half3 result = mix(glow, tintA, half(strength));\n    return max(result, half3(0.0));\n}\n\n// Tone Mapping algorithms extracted directly from Deep Glow 2 binary\nhalf3 applyToneMap(half3 x, float mode) {\n    if (mode < 0.5) return x; // 0 = None\n\n    if (mode < 1.5) { // 1 = ACES Filmic curve\n        float3 v = float3(x);\n        float a = 2.51;\n        float b = 0.03;\n        float c = 2.43;\n        float d = 0.59;\n        float e = 0.14;\n        float3 mapped = clamp((v * (a * v + b)) / (v * (c * v + d) + e), 0.0, 1.0);\n        return half3(mapped);\n    }\n\n    if (mode < 2.5) { // 2 = Filmic (Hejl-Burgess-Dawson)\n        half3 X = max(half3(0.0), x - half(0.004));\n        half3 res = (X * (half(6.2) * X + half(0.5))) / (X * (half(6.2) * X + half(1.7)) + half(0.06));\n        return pow(res, half3(2.2));\n    }\n\n    if (mode < 3.5) { // 3 = Reinhard\n        return x / (x + half(1.0));\n    }\n\n    if (mode < 4.5) { // 4 = Reinhard 2 (extended white point)\n        const float L_white_sq = 16.0;\n        float3 v = float3(x);\n        float3 mapped = (v * (1.0 + v / L_white_sq)) / (1.0 + v);\n        return half3(mapped);\n    }\n\n    // 5 = Clamp Chroma (desaturate over-bright highlights)\n    float l = dot(float3(0.2126, 0.7152, 0.0722), float3(x));\n    float desat = clamp(l, 0.0, 1.0);\n    return half3(max(mix(float3(x), float3(l), desat), float3(0.0)));\n}\n\nhalf4 main(float2 fragCoord) {\n    half4 srcSample = layer.eval(fragCoord);\n\n    if (Exposure <= 0.0 || Radius <= 0.0) {\n        if (BlendMode > 1.5) { // Glow Only\n            return half4(0.0, 0.0, 0.0, 0.0);\n        }\n        return srcSample * half(SourceOpacity);\n    }\n\n    // Anamorphic aspect ratio and angle transformation matrix\n    float rad = AspectAngle * 0.017453292519943295; // degrees to radians\n    float cosA = cos(rad);\n    float sinA = sin(rad);\n    float aspect = max(AspectRatio, 0.01);\n    float invAspect = 1.0 / aspect;\n\n    // Multi-octave radial sampling kernel\n    // 6 concentric rings with golden-angle rotational interleaving\n    half3 glowAccum = half3(0.0);\n    float totalWeight = 0.0;\n\n    // Center core tap\n    half3 centerPrefilter = prefilterColor(srcSample.rgb, Threshold, ThresholdSmooth, SaturationBias);\n    float centerWeight = 1.0;\n    glowAccum += centerPrefilter * half(centerWeight);\n    totalWeight += centerWeight;\n\n    float radBase = max(Radius, 1.0);\n    float coreRadius = radBase * 0.15 + 2.0;\n    float sigma = radBase * 0.4 + 1.0;\n    bool hasAberration = (Aberration > 0.001);\n\n    for (int ring = 1; ring <= 6; ring++) {\n        float normDist = float(ring) / 6.0;\n        // Geometric expansion for deep optical reach\n        float r = radBase * pow(normDist, 1.6) * 1.1 + 1.0;\n\n        // Weight evaluation based on GlowMode\n        float w = 1.0;\n        if (GlowMode < 0.5) {\n            // Mode 0: Inverse Square (Deep Glow signature falloff)\n            float s = r / coreRadius;\n            w = 1.0 / (1.0 + s * s);\n        } else if (GlowMode < 1.5) {\n            // Mode 1: Smooth Gaussian\n            float s = r / sigma;\n            w = exp(-0.5 * s * s);\n        } else {\n            // Mode 2: Core Concentrated (cubic power falloff)\n            float s = r / (radBase * 0.1 + 1.5);\n            w = 1.0 / (1.0 + s * s * s);\n        }\n\n        // Interleaved angular rotation using the golden ratio\n        float ringRot = float(ring) * 2.3999632;\n\n        for (int tap = 0; tap < 8; tap++) {\n            float phi = float(tap) * 0.7853981633974483 + ringRot;\n            // Local unrotated anamorphic vector\n            float lx = r * cos(phi) * aspect;\n            float ly = r * sin(phi) * invAspect;\n\n            // Rotated anamorphic offset\n            float2 offset = float2(lx * cosA - ly * sinA, lx * sinA + ly * cosA);\n\n            half3 tapColor;\n            if (hasAberration) {\n                // Chromatic dispersion: Red expanded, Blue contracted\n                float rScale = 1.0 + Aberration * 0.12;\n                float bScale = 1.0 - Aberration * 0.12;\n                float2 rOffset = offset * rScale;\n                float2 bOffset = offset * bScale;\n\n                half3 sR = prefilterColor(layer.eval(fragCoord + rOffset).rgb, Threshold, ThresholdSmooth, SaturationBias);\n                half3 sG = prefilterColor(layer.eval(fragCoord + offset).rgb, Threshold, ThresholdSmooth, SaturationBias);\n                half3 sB = prefilterColor(layer.eval(fragCoord + bOffset).rgb, Threshold, ThresholdSmooth, SaturationBias);\n                tapColor = half3(sR.r, sG.g, sB.b);\n            } else {\n                tapColor = prefilterColor(layer.eval(fragCoord + offset).rgb, Threshold, ThresholdSmooth, SaturationBias);\n            }\n\n            glowAccum += tapColor * half(w);\n            totalWeight += w;\n        }\n    }\n\n    // Normalized and exposure-scaled glow intensity\n    half3 glow = (glowAccum / half(totalWeight)) * half(Exposure * 2.5);\n\n    // Two-Tone Tinting\n    glow = applyTint(glow, TintMode, TintBlendMode, TintColor.rgb, TintColorOuter.rgb, TintStrength);\n\n    // Tone Mapping\n    glow = applyToneMap(glow, ToneMapMode);\n\n    // Base layer contribution\n    half3 baseRgb = srcSample.rgb * half(SourceOpacity);\n    half baseAlpha = srcSample.a * half(SourceOpacity);\n\n    // Composite according to BlendMode\n    half3 finalRgb;\n    half finalAlpha;\n\n    if (BlendMode < 0.5) { // 0 = Add\n        finalRgb = baseRgb + glow;\n        half glowLum = max(glow.r, max(glow.g, glow.b));\n        finalAlpha = clamp(baseAlpha + glowLum, half(0.0), half(1.0));\n    } else if (BlendMode < 1.5) { // 1 = Screen\n        finalRgb = half(1.0) - (half(1.0) - clamp(baseRgb, half(0.0), half(1.0))) * (half(1.0) - clamp(glow, half(0.0), half(1.0)));\n        finalRgb = min(finalRgb, half(1.0));\n        half glowLum = max(glow.r, max(glow.g, glow.b));\n        finalAlpha = clamp(baseAlpha + glowLum, half(0.0), half(1.0));\n    } else { // 2 = Glow Only\n        finalRgb = glow;\n        half glowLum = max(glow.r, max(glow.g, glow.b));\n        finalAlpha = clamp(glowLum, half(0.0), half(1.0));\n    }\n\n    return half4(finalRgb, finalAlpha);\n}\n";
    /* @@END_SKSL@@ */

    var DEFAULTS = {
        radius: 120.0,
        exposure: 1.0,
        threshold: 0.0,
        thresholdSmooth: 0.1,
        saturationBias: 0.0,
        aspectRatio: 1.0,
        aspectAngle: 0.0,
        aberration: 0.0,
        glowMode: 0,
        blendMode: 0,
        tintMode: 0,
        tintColor: { r: 255, g: 200, b: 120, a: 255 },
        tintColorOuter: { r: 50, g: 150, b: 255, a: 255 },
        tintBlendMode: 1,
        tintStrength: 1.0,
        toneMapMode: 0,
        sourceOpacity: 1.0
    };

    var GLOW_MODE_MAP = {
        '0': 0, 'inverse square': 0, 'inversesquare': 0, 'inverse': 0, 'photorealistic': 0,
        '1': 1, 'smooth gaussian': 1, 'gaussian': 1, 'smooth': 1,
        '2': 2, 'core concentrated': 2, 'concentrated': 2, 'core': 2
    };

    var BLEND_MODE_MAP = {
        '0': 0, 'add': 0, 'additive': 0,
        '1': 1, 'screen': 1,
        '2': 2, 'glow only': 2, 'glowonly': 2, 'only': 2
    };

    var TINT_MODE_MAP = {
        '0': 0, 'off': 0, 'none': 0, 'disabled': 0,
        '1': 1, 'monocolor': 1, 'mono': 1, 'single': 1,
        '2': 2, 'duocolor': 2, 'two-tone': 2, 'twotone': 2, 'two tone': 2, 'dual': 2
    };

    var TINT_BLEND_MAP = {
        '0': 0, 'multiply': 0,
        '1': 1, 'overlay': 1,
        '2': 2, 'soft light': 2, 'softlight': 2
    };

    var TONEMAP_MODE_MAP = {
        '0': 0, 'none': 0, 'off': 0,
        '1': 1, 'aces': 1, 'aces filmic': 1, 'acesfilmic': 1,
        '2': 2, 'filmic': 2, 'hbd': 2,
        '3': 3, 'reinhard': 3,
        '4': 4, 'reinhard 2': 4, 'reinhard2': 4,
        '5': 5, 'clamp chroma': 5, 'clampchroma': 5, 'clamp': 5
    };

    var TAG_SKSL = '[AE:Deep Glow]';

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

    function resolveColor(val, fallback) {
        if (!val) return fallback;
        if (typeof val === 'object' && val.r !== undefined && val.g !== undefined && val.b !== undefined) {
            return {
                r: clampNum(val.r, 0, 255, fallback.r),
                g: clampNum(val.g, 0, 255, fallback.g),
                b: clampNum(val.b, 0, 255, fallback.b),
                a: clampNum(val.a !== undefined ? val.a : 255, 0, 255, 255)
            };
        }
        if (Array.isArray(val) && val.length >= 3) {
            var scale = (val[0] <= 1.0 && val[1] <= 1.0 && val[2] <= 1.0) ? 255 : 1;
            return {
                r: clampNum(val[0] * scale, 0, 255, fallback.r),
                g: clampNum(val[1] * scale, 0, 255, fallback.g),
                b: clampNum(val[2] * scale, 0, 255, fallback.b),
                a: clampNum(val.length >= 4 ? val[3] * scale : 255, 0, 255, 255)
            };
        }
        return fallback;
    }

    function normalizeParams(raw) {
        var p = raw && typeof raw === 'object' ? raw : {};
        return {
            radius: clampNum(p.radius !== undefined ? p.radius : p.Radius, 0.0, 2000.0, DEFAULTS.radius),
            exposure: clampNum(p.exposure !== undefined ? p.exposure : p.Exposure, 0.0, 20.0, DEFAULTS.exposure),
            threshold: clampNum(p.threshold !== undefined ? p.threshold : p.Threshold, 0.0, 1.0, DEFAULTS.threshold),
            thresholdSmooth: clampNum(p.thresholdSmooth !== undefined ? p.thresholdSmooth : (p.ThresholdSmooth !== undefined ? p.ThresholdSmooth : p.knee), 0.0, 1.0, DEFAULTS.thresholdSmooth),
            saturationBias: clampNum(p.saturationBias !== undefined ? p.saturationBias : p.SaturationBias, -1.0, 1.0, DEFAULTS.saturationBias),
            aspectRatio: clampNum(p.aspectRatio !== undefined ? p.aspectRatio : p.AspectRatio, 0.05, 20.0, DEFAULTS.aspectRatio),
            aspectAngle: clampNum(p.aspectAngle !== undefined ? p.aspectAngle : p.AspectAngle, -180.0, 180.0, DEFAULTS.aspectAngle),
            aberration: clampNum(p.aberration !== undefined ? p.aberration : (p.Aberration !== undefined ? p.Aberration : p.chromaticAberration), 0.0, 1.0, DEFAULTS.aberration),
            glowMode: resolveEnum(p.glowMode !== undefined ? p.glowMode : (p.GlowMode !== undefined ? p.GlowMode : p.falloff), GLOW_MODE_MAP, DEFAULTS.glowMode),
            blendMode: resolveEnum(p.blendMode !== undefined ? p.blendMode : p.BlendMode, BLEND_MODE_MAP, DEFAULTS.blendMode),
            tintMode: resolveEnum(p.tintMode !== undefined ? p.tintMode : p.TintMode, TINT_MODE_MAP, DEFAULTS.tintMode),
            tintColor: resolveColor(p.tintColor !== undefined ? p.tintColor : p.TintColor, DEFAULTS.tintColor),
            tintColorOuter: resolveColor(p.tintColorOuter !== undefined ? p.tintColorOuter : p.TintColorOuter, DEFAULTS.tintColorOuter),
            tintBlendMode: resolveEnum(p.tintBlendMode !== undefined ? p.tintBlendMode : p.TintBlendMode, TINT_BLEND_MAP, DEFAULTS.tintBlendMode),
            tintStrength: clampNum(p.tintStrength !== undefined ? p.tintStrength : p.TintStrength, 0.0, 1.0, DEFAULTS.tintStrength),
            toneMapMode: resolveEnum(p.toneMapMode !== undefined ? p.toneMapMode : (p.ToneMapMode !== undefined ? p.ToneMapMode : p.toneMapping), TONEMAP_MODE_MAP, DEFAULTS.toneMapMode),
            sourceOpacity: clampNum(p.sourceOpacity !== undefined ? p.sourceOpacity : p.SourceOpacity, 0.0, 1.0, DEFAULTS.sourceOpacity)
        };
    }

    var PARAM_SPECS = [
        { name: 'Radius', key: 'radius', type: 'double', default: DEFAULTS.radius },
        { name: 'Exposure', key: 'exposure', type: 'double', default: DEFAULTS.exposure },
        { name: 'Threshold', key: 'threshold', type: 'double', default: DEFAULTS.threshold },
        { name: 'ThresholdSmooth', key: 'thresholdSmooth', type: 'double', default: DEFAULTS.thresholdSmooth },
        { name: 'SaturationBias', key: 'saturationBias', type: 'double', default: DEFAULTS.saturationBias },
        { name: 'AspectRatio', key: 'aspectRatio', type: 'double', default: DEFAULTS.aspectRatio },
        { name: 'AspectAngle', key: 'aspectAngle', type: 'double', default: DEFAULTS.aspectAngle },
        { name: 'Aberration', key: 'aberration', type: 'double', default: DEFAULTS.aberration },
        { name: 'GlowMode', key: 'glowMode', type: 'double', default: DEFAULTS.glowMode },
        { name: 'BlendMode', key: 'blendMode', type: 'double', default: DEFAULTS.blendMode },
        { name: 'TintMode', key: 'tintMode', type: 'double', default: DEFAULTS.tintMode },
        { name: 'TintColor', key: 'tintColor', type: 'color', default: DEFAULTS.tintColor },
        { name: 'TintColorOuter', key: 'tintColorOuter', type: 'color', default: DEFAULTS.tintColorOuter },
        { name: 'TintBlendMode', key: 'tintBlendMode', type: 'double', default: DEFAULTS.tintBlendMode },
        { name: 'TintStrength', key: 'tintStrength', type: 'double', default: DEFAULTS.tintStrength },
        { name: 'ToneMapMode', key: 'toneMapMode', type: 'double', default: DEFAULTS.toneMapMode },
        { name: 'SourceOpacity', key: 'sourceOpacity', type: 'double', default: DEFAULTS.sourceOpacity }
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
        if (attrType === 'color') {
            setVal = resolveColor(val, entry.default);
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
            var lType = safeCall(function () { return api.getLayerType ? api.getLayerType(id) : api.getType(id); }, '');
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
        var layerType = safeCall(function () { return api.getLayerType ? api.getLayerType(layerId) : api.getType(layerId); }, '');
        if (layerType === 'skslFilter') {
            return layerId;
        }
        var linked = getConnectedNodes(layerId, 'filters', 'skslFilter');
        for (var i = 0; i < linked.length; i++) {
            var name = safeCall(function () { return api.getNiceName ? api.getNiceName(linked[i]) : (api.getName ? api.getName(linked[i]) : ''); }, '');
            if (name && (name.indexOf(TAG_SKSL) >= 0 || name.indexOf('Deep Glow') >= 0)) {
                return linked[i];
            }
        }
        return null;
    }

    function calculatePadding(radius, aspect) {
        var basePad = Math.ceil(radius * 1.6 + 40);
        var asp = Math.max(0.05, aspect || 1.0);
        var padX = Math.ceil(basePad * Math.max(1.0, asp));
        var padY = Math.ceil(basePad * Math.max(1.0, 1.0 / asp));
        return { x: Math.min(padX, 2048), y: Math.min(padY, 2048) };
    }

    function applyDeepGlowToLayer(layerId, comp, params, liveCode) {
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
                ok: false,
                error: 'Failed to create skslFilter node'
            };
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

        var pad = calculatePadding(params.radius, params.aspectRatio);
        var filterProps = { code: liveCode, padding: pad };
        safeCall(function () { api.set(filterId, filterProps); }, null);

        if (isNew) {
            safeCall(function () { api.connect(filterId, 'id', layerId, 'filters'); }, null);
        }

        return {
            targetId: layerId,
            ok: true,
            filterId: filterId,
            isNew: isNew,
            boundSlots: boundSlots,
            padding: pad
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
        var targetRect = api.primitive('rectangle', 'Deep Glow Test Target');
        api.set(targetRect, {
            'generator.dimensions': { x: 300, y: 300 },
            'material.materialColor': { r: 255, g: 140, b: 60, a: 255 }
        });
        selection = [targetRect];
        createdTarget = true;
    }

    if (!selection.length) {
        var msg = 'AE Effects [Deep Glow]: No layer selected. Please select one or more layers in Cavalry.';
        var out = {
            ok: false,
            partial: false,
            effect: 'Deep Glow',
            code: 'NO_SELECTION',
            error: msg,
            appliedCount: 0,
            failedCount: 1,
            warnings: [],
            results: [],
            targets: []
        };
        try { __result = out; } catch (e) {}
        if (typeof console !== 'undefined' && console.warn) console.warn(msg);
        return out;
    }

    // Prepare SkSL code: strip uniform headers matching dynamic inputs
    var liveCode = SKSL_SOURCE.replace(/^\s*uniform\s+(?:float|float2|half4|bool)\s+[A-Za-z0-9_]+\s*;\s*(?:\r?\n)?/gm, '');

    var results = [];
    for (var s = 0; s < selection.length; s++) {
        var layerId = selection[s];
        var res = applyDeepGlowToLayer(layerId, comp, params, liveCode);
        results.push(res);
        appliedLayers.push(layerId);

        // Handle optional animation keyframing
        if (config.animateExposure && typeof api.addKeyframe === 'function' && res && res.boundSlots && res.boundSlots.Exposure) {
            var anim = config.animateExposure;
            var sf = anim.startFrame !== undefined ? anim.startFrame : 0;
            var ef = anim.endFrame !== undefined ? anim.endFrame : 50;
            var sv = anim.startValue !== undefined ? anim.startValue : 0.0;
            var ev = anim.endValue !== undefined ? anim.endValue : 2.0;
            safeCall(function () {
                api.addKeyframe(res.filterId, res.boundSlots.Exposure, sf, sv);
                api.addKeyframe(res.filterId, res.boundSlots.Exposure, ef, ev);
            }, null);
        }
    }

    // Preserve original selection
    safeCall(function () { api.select(selection); }, null);

    var failedCount = 0;
    for (var r = 0; r < results.length; r++) {
        if (results[r] && results[r].ok === false) failedCount++;
    }
    var isOk = results.length > 0 && failedCount === 0;
    var isPartial = failedCount > 0 && failedCount < results.length;

    var summary = {
        ok: isOk,
        partial: isPartial,
        effect: 'Deep Glow',
        code: isOk ? 'SUCCESS' : (isPartial ? 'PARTIAL_SUCCESS' : 'RUNTIME_EXCEPTION'),
        error: isOk ? null : (failedCount + ' layer(s) failed'),
        strategy: 'skslFilter',
        appliedCount: results.length - failedCount,
        failedCount: failedCount,
        warnings: [],
        targets: appliedLayers,
        createdTarget: createdTarget,
        results: results,
        params: params
    };

    try { __result = summary; } catch (e) {}
    if (typeof console !== 'undefined' && console.log) {
        console.log('AE Effects: Applied Deep Glow (skslFilter) to ' + results.length + ' layer(s)');
    }
    return summary;
})();
