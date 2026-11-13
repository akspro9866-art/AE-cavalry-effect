/**
 * One-Action Reusable Implementation & Applicator:
 * Adobe After Effects "Turbulent Displace" -> Cavalry 2.8+
 *
 * Designed to execute inside Cavalry's `script` context via Stallion / `cavalry_apply_dsl`,
 * or standalone inside Cavalry's Script Editor.
 *
 * Optional injected override before script body:
 *   var __EFFECT_CONFIG__ = {
 *     mode: 'auto' | 'sksl' | 'deformer' | 'both',
 *     params: { displacement, amount, size, offsetX, offsetY, complexity, evolution, cycleEvolution, cycleRevolutions, randomSeed, pinning, antialiasing, resampleLength },
 *     animateEvolution: { startFrame: 0, endFrame: 60, startValue: 0, endValue: 360 },
 *     createTestTargetIfEmpty: false
 *   };
 */
(function () {
    /* @@BEGIN_SKSL@@ */
    var SKSL_SOURCE = "// Adobe After Effects \"Turbulent Displace\" (ADBE Turbulent Displace)\n// Independent mathematical reconstruction implemented as a Cavalry 2.8+ SkSL Filter (`skslFilter`).\n// Built-in Cavalry preamble uniform (injected automatically by Cavalry — do NOT redeclare):\n//   `resolution` (float2) — Layer bounding dimensions in pixels (centered Y-up coordinate space)\nuniform shader layer;\n\n// AE Main Controls (mapped to Cavalry `inputs.0`..`inputs.11` dynamic attributes on live Cavalry;\n// stripped when uploading `code` to live `skslFilter`, kept here for static validation & Mock runtime):\n// Displacement: 0=Turbulent, 1=Bulge, 2=Twist, 3=Turbulent Smoother, 4=Bulge Smoother,\n//               5=Twist Smoother, 6=Horizontal Displacement, 7=Vertical Displacement, 8=Cross Displacement\nuniform float Displacement;\nuniform float Amount;\nuniform float Size;\nuniform float2 Offset;\nuniform float Complexity;\nuniform float Evolution;\n// Evolution Options (sub-group):\nuniform bool CycleEvolution;\nuniform float CycleRevolutions;\nuniform float RandomSeed;\n// Edges / Quality:\n// Pinning: 0=None, 1=All, 2=Horizontal Only, 3=Vertical Only, 4=Left, 5=Right, 6=Top, 7=Bottom\nuniform float Pinning;\nuniform bool ResizeLayer;\n// Antialiasing for Best Quality: 0=Low (bilinear), 1=High (4-tap RGSS supersampled backward warp)\nuniform float Antialiasing;\n\nfloat4 mod289(float4 x) {\n    return x - floor(x * (1.0 / 289.0)) * 289.0;\n}\n\nfloat mod289(float x) {\n    return x - floor(x * (1.0 / 289.0)) * 289.0;\n}\n\nfloat perm4(float x) {\n    float w = mod289(x);\n    return mod289(((w * 34.0) + 1.0) * w);\n}\n\n// Perlin canonical symmetric 32-vector 4D gradient table without array lookups or sin()\nfloat4 grad4Symmetric(float j) {\n    float idx = floor(j - floor(j * 0.03125) * 32.0);\n    float s0 = 1.0 - 2.0 * step(0.25, fract(idx * 0.5));\n    float s1 = 1.0 - 2.0 * step(0.25, fract(floor(idx * 0.5) * 0.5));\n    float s2 = 1.0 - 2.0 * step(0.25, fract(floor(idx * 0.25) * 0.5));\n    float z = floor(idx * 0.125);\n    float z0 = 1.0 - step(0.5, abs(z - 0.0));\n    float z1 = 1.0 - step(0.5, abs(z - 1.0));\n    float z2 = 1.0 - step(0.5, abs(z - 2.0));\n    float z3 = 1.0 - step(0.5, abs(z - 3.0));\n    return z0 * float4(0.0, s0, s1, s2)\n         + z1 * float4(s0, 0.0, s1, s2)\n         + z2 * float4(s0, s1, 0.0, s2)\n         + z3 * float4(s0, s1, s2, 0.0);\n}\n\n// Branchless SIMD 4D Simplex Noise returning float3(value, dN/dx, dN/dy)\nfloat3 snoise4Grad(float4 v) {\n    float F4 = 0.309016994374947451;\n    float G4 = 0.1381966011250105;\n    float NOISE4_GAIN = 27.0;\n\n    float s = dot(v, float4(F4));\n    float4 i = floor(v + s);\n    float t0 = dot(i, float4(G4));\n    float4 x0 = v - i + t0;\n\n    float4 rank = float4(0.0);\n    float3 isX = step(x0.yzw, x0.xxx);\n    float3 isYZ = step(x0.zww, x0.yyz);\n    rank.x = isX.x + isX.y + isX.z;\n    rank.yzw = 1.0 - isX;\n    rank.y += isYZ.x + isYZ.y;\n    rank.zw += 1.0 - isYZ.xy;\n    rank.z += isYZ.z;\n    rank.w += 1.0 - isYZ.z;\n\n    float4 i1 = clamp(rank - 2.0, 0.0, 1.0);\n    float4 i2 = clamp(rank - 1.0, 0.0, 1.0);\n    float4 i3 = clamp(rank, 0.0, 1.0);\n\n    float4 x1 = x0 - i1 + G4;\n    float4 x2 = x0 - i2 + 2.0 * G4;\n    float4 x3 = x0 - i3 + 3.0 * G4;\n    float4 x4 = x0 - 1.0 + 4.0 * G4;\n\n    float4 mi = mod289(i);\n    float j0 = perm4(perm4(perm4(perm4(mi.w) + mi.z) + mi.y) + mi.x);\n    float j1 = perm4(perm4(perm4(perm4(mi.w + i1.w) + mi.z + i1.z) + mi.y + i1.y) + mi.x + i1.x);\n    float j2 = perm4(perm4(perm4(perm4(mi.w + i2.w) + mi.z + i2.z) + mi.y + i2.y) + mi.x + i2.x);\n    float j3 = perm4(perm4(perm4(perm4(mi.w + i3.w) + mi.z + i3.z) + mi.y + i3.y) + mi.x + i3.x);\n    float j4 = perm4(perm4(perm4(perm4(mi.w + 1.0) + mi.z + 1.0) + mi.y + 1.0) + mi.x + 1.0);\n\n    float m0 = max(0.6 - dot(x0, x0), 0.0);\n    float m1 = max(0.6 - dot(x1, x1), 0.0);\n    float m2 = max(0.6 - dot(x2, x2), 0.0);\n    float m3 = max(0.6 - dot(x3, x3), 0.0);\n    float m4 = max(0.6 - dot(x4, x4), 0.0);\n\n    float4 g0 = grad4Symmetric(j0);\n    float4 g1 = grad4Symmetric(j1);\n    float4 g2 = grad4Symmetric(j2);\n    float4 g3 = grad4Symmetric(j3);\n    float4 g4 = grad4Symmetric(j4);\n\n    float4 d0123 = float4(dot(g0, x0), dot(g1, x1), dot(g2, x2), dot(g3, x3));\n    float d4 = dot(g4, x4);\n\n    float4 mv = float4(m0, m1, m2, m3);\n    float4 mv2 = mv * mv;\n    float4 mv3 = mv2 * mv;\n    float4 mv4 = mv2 * mv2;\n    float m4_2 = m4 * m4;\n    float m4_3 = m4_2 * m4;\n    float m4_4 = m4_2 * m4_2;\n\n    float val = dot(mv4, d0123) + m4_4 * d4;\n    float2 gxy = -8.0 * (\n        mv3.x * d0123.x * x0.xy +\n        mv3.y * d0123.y * x1.xy +\n        mv3.z * d0123.z * x2.xy +\n        mv3.w * d0123.w * x3.xy +\n        m4_3 * d4 * x4.xy\n    ) + (\n        mv4.x * g0.xy +\n        mv4.y * g1.xy +\n        mv4.z * g2.xy +\n        mv4.w * g3.xy +\n        m4_4 * g4.xy\n    );\n\n    return float3(val, gxy.x, gxy.y) * NOISE4_GAIN;\n}\n\nfloat computePinWeight(float2 uv, float2 res) {\n    float mode = floor(clamp(Pinning, 0.0, 7.0) + 0.5);\n    if (mode < 0.5) return 1.0;\n\n    float2 margin = clamp(\n        max(float2(abs(Amount) * 1.15), max(float2(Size * 0.35), float2(16.0))) / res,\n        float2(0.03),\n        float2(0.48)\n    );\n    float pinL = smoothstep(0.0, margin.x, uv.x);\n    float pinR = smoothstep(0.0, margin.x, 1.0 - uv.x);\n    // Cavalry `skslFilter` coordinate space is Y-up: uv.y=0 is bottom, uv.y=1 is top\n    float pinB = smoothstep(0.0, margin.y, uv.y);\n    float pinT = smoothstep(0.0, margin.y, 1.0 - uv.y);\n\n    if (mode < 1.5) return pinL * pinR * pinT * pinB; // 1 = All\n    if (mode < 2.5) return pinL * pinR;               // 2 = Horizontal Only\n    if (mode < 3.5) return pinT * pinB;               // 3 = Vertical Only\n    if (mode < 4.5) return pinL;                      // 4 = Left\n    if (mode < 5.5) return pinR;                      // 5 = Right\n    if (mode < 6.5) return pinT;                      // 6 = Top\n    return pinB;                                      // 7 = Bottom\n}\n\nfloat2 evaluateDisplacement(float2 px, float2 res) {\n    if (Amount == 0.0) return float2(0.0);\n\n    float mode = floor(clamp(Displacement, 0.0, 8.0) + 0.5);\n    float isSmoother = (mode >= 2.5 && mode <= 5.5) ? 1.0 : 0.0;\n    float baseMode = isSmoother > 0.5 ? (mode - 3.0) : mode;\n\n    float safeSize = max(Size, 0.001) * (isSmoother > 0.5 ? 1.38 : 1.0);\n    // Centered layer coordinates: (0, 0) is layer center in Cavalry `skslFilter`\n    float2 center = Offset;\n    float2 u = (px - center) / safeSize;\n\n    float seedFrac = fract(RandomSeed * 0.1031) * 47.0 + fract(RandomSeed * 0.0379) * 31.0;\n    float revs = Evolution / 360.0;\n\n    float zCoord = 0.0;\n    float wCoord = 0.0;\n    if (CycleEvolution) {\n        float cycles = max(floor(CycleRevolutions + 0.5), 1.0);\n        float theta = 6.283185307179586 * (revs / cycles);\n        float radius = 0.75 * cycles;\n        zCoord = seedFrac + radius * cos(theta);\n        wCoord = seedFrac * 0.61803398875 + radius * sin(theta);\n    } else {\n        zCoord = seedFrac + revs * 0.75;\n        wCoord = seedFrac * 0.61803398875 + 3.14159265;\n    }\n\n    float comp = clamp(Complexity, 1.0, 10.0);\n    float gain = isSmoother > 0.5 ? 0.38 : 0.5;\n    float derivGain = isSmoother > 0.5 ? 0.30 : 0.42;\n    float needChannelB = (baseMode < 0.5 || (baseMode > 6.5 && baseMode < 7.5) || baseMode > 7.5) ? 1.0 : 0.0;\n\n    float sumAx = 0.0;\n    float2 gradAx = float2(0.0);\n    float sumB = 0.0;\n    float amp = 1.0;\n    float dAmp = 1.0;\n    float freq = 1.0;\n\n    for (int oct = 0; oct < 10; oct++) {\n        float foct = float(oct);\n        float w = clamp(comp - foct, 0.0, 1.0);\n        if (w <= 0.0) break;\n\n        float oz = zCoord + foct * 7.13;\n        float ow = wCoord + foct * 11.71;\n\n        float3 nA = snoise4Grad(float4(u * freq, oz, ow));\n        sumAx += w * amp * nA.x;\n        gradAx += w * dAmp * nA.yz;\n\n        if (needChannelB > 0.5) {\n            float3 nB = snoise4Grad(float4(u * freq + float2(19.31, 43.17), oz + 23.7, ow + 5.9));\n            sumB += w * amp * nB.x;\n        }\n\n        amp *= gain;\n        dAmp *= derivGain;\n        freq *= 2.0;\n    }\n\n    float compScale = 1.0 / (1.0 + 0.22 * (log(comp) / 0.69314718));\n    float strength = Amount * 0.62 * compScale;\n\n    float2 rawDisp = float2(0.0);\n    if (baseMode < 0.5) {\n        rawDisp = float2(sumAx, sumB);\n    } else if (baseMode < 1.5) {\n        rawDisp = -gradAx * 0.26;\n    } else if (baseMode < 2.5) {\n        rawDisp = float2(-gradAx.y, gradAx.x) * 0.28;\n    } else if (baseMode < 6.5) {\n        rawDisp = float2(sumAx, 0.0); // 6 = Horizontal Displacement\n    } else if (baseMode < 7.5) {\n        rawDisp = float2(0.0, sumB);  // 7 = Vertical Displacement\n    } else {\n        float ax = abs(sumAx);\n        float ay = abs(sumB);\n        float wx = ax / (ax + ay + 0.08);\n        float wy = ay / (ax + ay + 0.08);\n        rawDisp = float2(sumAx * (0.45 + 0.85 * wx), sumB * (0.45 + 0.85 * wy));\n    }\n\n    float2 uv = clamp((px / res) + float2(0.5), float2(0.0), float2(1.0));\n    float pinW = computePinWeight(uv, res);\n    return rawDisp * strength * pinW;\n}\n\nhalf4 main(float2 fragCoord) {\n    float2 res = max(resolution, float2(1.0, 1.0));\n    if (Amount == 0.0) {\n        return layer.eval(fragCoord);\n    }\n\n    if (Antialiasing < 0.5) {\n        float2 disp = evaluateDisplacement(fragCoord, res);\n        return layer.eval(fragCoord - disp);\n    }\n\n    // High Quality: 4-tap Rotated Grid Supersampling (RGSS) backward-warped evaluation\n    float2 q0 = fragCoord + float2( 0.375,  0.125);\n    float2 q1 = fragCoord + float2(-0.375, -0.125);\n    float2 q2 = fragCoord + float2(-0.125,  0.375);\n    float2 q3 = fragCoord + float2( 0.125, -0.375);\n\n    half4 acc = layer.eval(q0 - evaluateDisplacement(q0, res))\n              + layer.eval(q1 - evaluateDisplacement(q1, res))\n              + layer.eval(q2 - evaluateDisplacement(q2, res))\n              + layer.eval(q3 - evaluateDisplacement(q3, res));\n    return acc * half(0.25);\n}\n";
    /* @@END_SKSL@@ */

    /* @@BEGIN_DEFORMER@@ */
    var DEFORMER_SOURCE = "// Adobe After Effects \"Turbulent Displace\" — Cavalry JavaScript Deformer Companion (`javaScriptDeformer`)\n// Context allowed ONLY: console, ctx, cavalry, def (never reference `api`)\n// Subdivides/resamples vector outlines via `cavalry.Path.resample()` & `pathData()` / `setPathData()`\n// for genuine pure-vector distortion when raster `skslFilter` is not desired.\n\nfunction tdNum(val, fallback) {\n    var n = Number(val);\n    return isFinite(n) ? n : fallback;\n}\n\nfunction tdClamp(x, lo, hi) {\n    return x < lo ? lo : (x > hi ? hi : x);\n}\n\nfunction tdFract(x) {\n    return x - Math.floor(x);\n}\n\nfunction tdStep(edge, x) {\n    return x >= edge ? 1.0 : 0.0;\n}\n\nfunction tdSmoothstep(edge0, edge1, x) {\n    var denom = edge1 - edge0;\n    if (Math.abs(denom) < 1e-8) return x >= edge1 ? 1.0 : 0.0;\n    var t = tdClamp((x - edge0) / denom, 0.0, 1.0);\n    return t * t * (3.0 - 2.0 * t);\n}\n\nfunction tdMod289(x) {\n    return x - Math.floor(x / 289.0) * 289.0;\n}\n\nfunction tdPerm4(x) {\n    var w = tdMod289(x);\n    return tdMod289(((w * 34.0) + 1.0) * w);\n}\n\nfunction tdGrad4Symmetric(j) {\n    var idx = Math.floor(j - Math.floor(j * 0.03125) * 32.0);\n    var s0 = 1.0 - 2.0 * tdStep(0.25, tdFract(idx * 0.5));\n    var s1 = 1.0 - 2.0 * tdStep(0.25, tdFract(Math.floor(idx * 0.5) * 0.5));\n    var s2 = 1.0 - 2.0 * tdStep(0.25, tdFract(Math.floor(idx * 0.25) * 0.5));\n    var z = Math.floor(idx * 0.125);\n    if (z < 0.5) return [0.0, s0, s1, s2];\n    if (z < 1.5) return [s0, 0.0, s1, s2];\n    if (z < 2.5) return [s0, s1, 0.0, s2];\n    return [s0, s1, s2, 0.0];\n}\n\nfunction tdSnoise4Grad(vx, vy, vz, vw) {\n    var F4 = 0.309016994374947451;\n    var G4 = 0.1381966011250105;\n    var GAIN = 27.0;\n\n    var s = (vx + vy + vz + vw) * F4;\n    var ix = Math.floor(vx + s);\n    var iy = Math.floor(vy + s);\n    var iz = Math.floor(vz + s);\n    var iw = Math.floor(vw + s);\n\n    var t0 = (ix + iy + iz + iw) * G4;\n    var x0x = vx - ix + t0;\n    var x0y = vy - iy + t0;\n    var x0z = vz - iz + t0;\n    var x0w = vw - iw + t0;\n\n    var isXx = tdStep(x0y, x0x);\n    var isXy = tdStep(x0z, x0x);\n    var isXz = tdStep(x0w, x0x);\n    var isYZx = tdStep(x0z, x0y);\n    var isYZy = tdStep(x0w, x0y);\n    var isYZz = tdStep(x0w, x0z);\n\n    var r0 = isXx + isXy + isXz;\n    var r1 = (1.0 - isXx) + isYZx + isYZy;\n    var r2 = (1.0 - isXy) + (1.0 - isYZx) + isYZz;\n    var r3 = (1.0 - isXz) + (1.0 - isYZy) + (1.0 - isYZz);\n\n    var i1x = tdClamp(r0 - 2.0, 0.0, 1.0);\n    var i1y = tdClamp(r1 - 2.0, 0.0, 1.0);\n    var i1z = tdClamp(r2 - 2.0, 0.0, 1.0);\n    var i1w = tdClamp(r3 - 2.0, 0.0, 1.0);\n\n    var i2x = tdClamp(r0 - 1.0, 0.0, 1.0);\n    var i2y = tdClamp(r1 - 1.0, 0.0, 1.0);\n    var i2z = tdClamp(r2 - 1.0, 0.0, 1.0);\n    var i2w = tdClamp(r3 - 1.0, 0.0, 1.0);\n\n    var i3x = tdClamp(r0, 0.0, 1.0);\n    var i3y = tdClamp(r1, 0.0, 1.0);\n    var i3z = tdClamp(r2, 0.0, 1.0);\n    var i3w = tdClamp(r3, 0.0, 1.0);\n\n    var corners = [\n        [x0x, x0y, x0z, x0w, 0, 0, 0, 0],\n        [x0x - i1x + G4, x0y - i1y + G4, x0z - i1z + G4, x0w - i1w + G4, i1x, i1y, i1z, i1w],\n        [x0x - i2x + 2.0 * G4, x0y - i2y + 2.0 * G4, x0z - i2z + 2.0 * G4, x0w - i2w + 2.0 * G4, i2x, i2y, i2z, i2w],\n        [x0x - i3x + 3.0 * G4, x0y - i3y + 3.0 * G4, x0z - i3z + 3.0 * G4, x0w - i3w + 3.0 * G4, i3x, i3y, i3z, i3w],\n        [x0x - 1.0 + 4.0 * G4, x0y - 1.0 + 4.0 * G4, x0z - 1.0 + 4.0 * G4, x0w - 1.0 + 4.0 * G4, 1, 1, 1, 1]\n    ];\n\n    var mix = tdMod289(ix), miy = tdMod289(iy), miz = tdMod289(iz), miw = tdMod289(iw);\n    var val = 0.0, gX = 0.0, gY = 0.0;\n\n    for (var k = 0; k < 5; k++) {\n        var c = corners[k];\n        var dx = c[0], dy = c[1], dz = c[2], dw = c[3];\n        var m = Math.max(0.6 - (dx * dx + dy * dy + dz * dz + dw * dw), 0.0);\n        if (m > 0.0) {\n            var j = tdPerm4(tdPerm4(tdPerm4(tdPerm4(miw + c[7]) + miz + c[6]) + miy + c[5]) + mix + c[4]);\n            var g = tdGrad4Symmetric(j);\n            var m2 = m * m, m3 = m2 * m, m4 = m2 * m2;\n            var gd = g[0] * dx + g[1] * dy + g[2] * dz + g[3] * dw;\n            val += m4 * gd;\n            gX += -8.0 * m3 * dx * gd + m4 * g[0];\n            gY += -8.0 * m3 * dy * gd + m4 * g[1];\n        }\n    }\n    return [val * GAIN, gX * GAIN, gY * GAIN];\n}\n\n// Dynamic parameters bound via `array.*` dynamic attributes on `javaScriptDeformer`\nvar aeDisp = tdClamp(Math.round(tdNum(typeof Displacement !== 'undefined' ? Displacement : (typeof tdDisp !== 'undefined' ? tdDisp : (typeof displacement !== 'undefined' ? displacement : 0)), 0)), 0, 8);\nvar aeAmt = tdNum(typeof Amount !== 'undefined' ? Amount : (typeof tdAmount !== 'undefined' ? tdAmount : (typeof amount !== 'undefined' ? amount : 50)), 50);\nvar aeSize = Math.max(0.001, tdNum(typeof Size !== 'undefined' ? Size : (typeof tdSize !== 'undefined' ? tdSize : (typeof size !== 'undefined' ? size : 100)), 100));\nvar aeOffX = tdNum(typeof Offset !== 'undefined' && Offset && typeof Offset.x === 'number' ? Offset.x : (typeof tdOffsetX !== 'undefined' ? tdOffsetX : (typeof offsetX !== 'undefined' ? offsetX : 0)), 0);\nvar aeOffY = tdNum(typeof Offset !== 'undefined' && Offset && typeof Offset.y === 'number' ? Offset.y : (typeof tdOffsetY !== 'undefined' ? tdOffsetY : (typeof offsetY !== 'undefined' ? offsetY : 0)), 0);\nvar aeComp = tdClamp(tdNum(typeof Complexity !== 'undefined' ? Complexity : (typeof tdComplexity !== 'undefined' ? tdComplexity : (typeof complexity !== 'undefined' ? complexity : 1.0)), 1.0), 1.0, 10.0);\nvar aeEvo = tdNum(typeof Evolution !== 'undefined' ? Evolution : (typeof tdEvolution !== 'undefined' ? tdEvolution : (typeof evolution !== 'undefined' ? evolution : 0)), 0);\nvar aeCycRaw = typeof CycleEvolution !== 'undefined' ? CycleEvolution : (typeof tdCycleEvo !== 'undefined' ? tdCycleEvo : (typeof cycleEvolution !== 'undefined' ? cycleEvolution : 0));\nvar aeCyc = (typeof aeCycRaw === 'boolean') ? aeCycRaw : (tdNum(aeCycRaw, 0) >= 0.5);\nvar aeRevs = Math.max(1.0, Math.round(tdNum(typeof CycleRevolutions !== 'undefined' ? CycleRevolutions : (typeof tdCycleRevs !== 'undefined' ? tdCycleRevs : (typeof cycleRevolutions !== 'undefined' ? cycleRevolutions : 1)), 1)));\nvar aeSeed = tdNum(typeof RandomSeed !== 'undefined' ? RandomSeed : (typeof tdRandomSeed !== 'undefined' ? tdRandomSeed : (typeof randomSeed !== 'undefined' ? randomSeed : 0)), 0);\nvar aePin = tdClamp(Math.round(tdNum(typeof Pinning !== 'undefined' ? Pinning : (typeof tdPinning !== 'undefined' ? tdPinning : (typeof pinning !== 'undefined' ? pinning : 0)), 0)), 0, 7);\nvar aeResampleLen = Math.max(2.0, tdNum(typeof ResampleLength !== 'undefined' ? ResampleLength : (typeof tdResampleLen !== 'undefined' ? tdResampleLen : (typeof resampleLength !== 'undefined' ? resampleLength : 8.0)), 8.0));\n\nfunction tdDisplacePoint(px, py, bbox) {\n    if (aeAmt === 0.0) return { x: px, y: py };\n\n    var falloff = (typeof def !== 'undefined' && typeof def.getFalloffAtPoint === 'function')\n        ? tdClamp(def.getFalloffAtPoint(px, py), 0.0, 1.0)\n        : 1.0;\n    if (falloff <= 0.0) return { x: px, y: py };\n\n    var isSmoother = aeDisp >= 3 && aeDisp <= 5;\n    var baseMode = isSmoother ? aeDisp - 3 : aeDisp;\n    var effSize = aeSize * (isSmoother ? 1.38 : 1.0);\n\n    var cx = (bbox && bbox.centre ? bbox.centre.x : 0) + aeOffX;\n    var cy = (bbox && bbox.centre ? bbox.centre.y : 0) + aeOffY;\n    var ux = (px - cx) / effSize;\n    var uy = (py - cy) / effSize;\n\n    var seedFrac = tdFract(aeSeed * 0.1031) * 47.0 + tdFract(aeSeed * 0.0379) * 31.0;\n    var revs = aeEvo / 360.0;\n    var zC, wC;\n    if (aeCyc) {\n        var theta = Math.PI * 2.0 * (revs / aeRevs);\n        var radius = 0.75 * aeRevs;\n        zC = seedFrac + radius * Math.cos(theta);\n        wC = seedFrac * 0.61803398875 + radius * Math.sin(theta);\n    } else {\n        zC = seedFrac + revs * 0.75;\n        wC = seedFrac * 0.61803398875 + 3.14159265;\n    }\n\n    var gain = isSmoother ? 0.38 : 0.5;\n    var dGain = isSmoother ? 0.30 : 0.42;\n    var sumAx = 0.0, gx = 0.0, gy = 0.0, sumB = 0.0;\n    var amp = 1.0, dAmp = 1.0, freq = 1.0;\n\n    for (var oct = 0; oct < 10; oct++) {\n        var w = tdClamp(aeComp - oct, 0.0, 1.0);\n        if (w <= 0.0) break;\n        var oz = zC + oct * 7.13;\n        var ow = wC + oct * 11.71;\n        var nA = tdSnoise4Grad(ux * freq, uy * freq, oz, ow);\n        sumAx += w * amp * nA[0];\n        gx += w * dAmp * nA[1];\n        gy += w * dAmp * nA[2];\n        if (baseMode === 0 || baseMode === 7 || baseMode === 8) {\n            var nB = tdSnoise4Grad(ux * freq + 19.31, uy * freq + 43.17, oz + 23.7, ow + 5.9);\n            sumB += w * amp * nB[0];\n        }\n        amp *= gain;\n        dAmp *= dGain;\n        freq *= 2.0;\n    }\n\n    var compScale = 1.0 / (1.0 + 0.22 * (Math.log(aeComp) / Math.LN2));\n    var strength = aeAmt * 0.62 * compScale;\n    var rdx = 0.0, rdy = 0.0;\n    if (baseMode === 0) { rdx = sumAx; rdy = sumB; }\n    else if (baseMode === 1) { rdx = -gx * 0.26; rdy = -gy * 0.26; }\n    else if (baseMode === 2) { rdx = -gy * 0.28; rdy = gx * 0.28; }\n    else if (baseMode === 6) { rdx = sumAx; rdy = 0.0; } // 6 = Horizontal Displacement\n    else if (baseMode === 7) { rdx = 0.0; rdy = sumB; }  // 7 = Vertical Displacement\n    else {\n        var ax = Math.abs(sumAx), ay = Math.abs(sumB);\n        var wx = ax / (ax + ay + 0.08), wy = ay / (ax + ay + 0.08);\n        rdx = sumAx * (0.45 + 0.85 * wx);\n        rdy = sumB * (0.45 + 0.85 * wy);\n    }\n\n    var pinW = 1.0;\n    if (aePin > 0 && bbox && bbox.width > 0 && bbox.height > 0) {\n        var minY = Math.min(bbox.bottom, bbox.top);\n        var uvX = tdClamp((px - bbox.left) / bbox.width, 0.0, 1.0);\n        var uvY = tdClamp((py - minY) / bbox.height, 0.0, 1.0);\n        var mx = tdClamp(Math.max(Math.abs(aeAmt) * 1.15, aeSize * 0.35, 16.0) / Math.max(bbox.width, 1), 0.03, 0.48);\n        var my = tdClamp(Math.max(Math.abs(aeAmt) * 1.15, aeSize * 0.35, 16.0) / Math.max(bbox.height, 1), 0.03, 0.48);\n        var pL = tdSmoothstep(0.0, mx, uvX);\n        var pR = tdSmoothstep(0.0, mx, 1.0 - uvX);\n        var pB = tdSmoothstep(0.0, my, uvY);\n        var pT = tdSmoothstep(0.0, my, 1.0 - uvY);\n        if (aePin === 1) pinW = pL * pR * pB * pT;\n        else if (aePin === 2) pinW = pL * pR;\n        else if (aePin === 3) pinW = pB * pT;\n        else if (aePin === 4) pinW = pL;\n        else if (aePin === 5) pinW = pR;\n        else if (aePin === 6) pinW = pT;\n        else pinW = pB;\n    }\n\n    var totalScale = strength * pinW * falloff;\n    return {\n        x: px + rdx * totalScale,\n        y: py + rdy * totalScale\n    };\n}\n\nfunction tdDisplaceVerbHandle(h, ox, oy, nx, ny) {\n    if (!h || typeof h.x !== 'number' || typeof h.y !== 'number') return;\n    h.x += (nx - ox);\n    h.y += (ny - oy);\n}\n\nfunction tdDeformPathData(path, bbox) {\n    if (typeof path.resample === 'function') {\n        path.resample(aeResampleLen);\n    } else if (typeof path.convertToLines === 'function') {\n        path.convertToLines(0.5);\n    }\n\n    if (typeof path.pathData === 'function' && typeof path.setPathData === 'function') {\n        var pd = path.pathData();\n        if (Array.isArray(pd)) {\n            for (var idx = 0; idx < pd.length; idx++) {\n                var cmd = pd[idx];\n                if (!cmd) continue;\n                if (cmd.point && typeof cmd.point.x === 'number' && typeof cmd.point.y === 'number') {\n                    var ox = cmd.point.x;\n                    var oy = cmd.point.y;\n                    var dp = tdDisplacePoint(ox, oy, bbox);\n                    cmd.point.x = dp.x;\n                    cmd.point.y = dp.y;\n                    tdDisplaceVerbHandle(cmd.cp1, ox, oy, dp.x, dp.y);\n                    tdDisplaceVerbHandle(cmd.cp2, ox, oy, dp.x, dp.y);\n                } else if (typeof cmd.x === 'number' && typeof cmd.y === 'number') {\n                    var dpPlain = tdDisplacePoint(cmd.x, cmd.y, bbox);\n                    cmd.x = dpPlain.x;\n                    cmd.y = dpPlain.y;\n                }\n            }\n            path.setPathData(pd);\n            return true;\n        }\n    }\n    return false;\n}\n\nfunction tdDeformMeshRecursive(mesh, bbox) {\n    if (!mesh) return;\n    if (typeof mesh.childMeshCount === 'function') {\n        var nChildren = mesh.childMeshCount();\n        for (var c = 0; c < nChildren; c++) {\n            var child = mesh.getChildMeshAtIndex(c);\n            if (child) {\n                tdDeformMeshRecursive(child, bbox);\n                if (typeof mesh.setChildMeshAtIndex === 'function') {\n                    mesh.setChildMeshAtIndex(c, child);\n                }\n            }\n        }\n    }\n    if (typeof mesh.count === 'function') {\n        var nPaths = mesh.count();\n        for (var i = 0; i < nPaths; i++) {\n            if (typeof mesh.getPathAtIndex === 'function' && typeof mesh.setPathAtIndex === 'function') {\n                var path = mesh.getPathAtIndex(i);\n                if (path && tdDeformPathData(path, bbox)) {\n                    mesh.setPathAtIndex(i, path);\n                }\n            }\n        }\n    }\n}\n\nif (typeof def !== 'undefined') {\n    var bbox = typeof def.getBoundingBox === 'function' ? def.getBoundingBox() : null;\n    if (typeof def.getRootMesh === 'function' && typeof def.setRootMesh === 'function') {\n        var rootMesh = def.getRootMesh();\n        if (rootMesh) {\n            tdDeformMeshRecursive(rootMesh, bbox);\n            def.setRootMesh(rootMesh);\n        }\n    } else if (typeof def.getPoints === 'function' && typeof def.setPoints === 'function') {\n        var pts = def.getPoints();\n        if (Array.isArray(pts)) {\n            for (var p = 0; p < pts.length; p++) {\n                var dp = tdDisplacePoint(pts[p].x, pts[p].y, bbox);\n                pts[p].x = dp.x;\n                pts[p].y = dp.y;\n            }\n            def.setPoints(pts);\n        }\n    }\n}\n";
    /* @@END_DEFORMER@@ */

    var DEFAULTS = {
        displacement: 0,
        amount: 50,
        size: 100,
        offsetX: 0,
        offsetY: 0,
        complexity: 1.0,
        evolution: 0,
        cycleEvolution: false,
        cycleRevolutions: 1,
        randomSeed: 0,
        pinning: 0,
        antialiasing: 0,
        resizeLayer: true,
        resampleLength: 8
    };

    var DISPLACEMENT_MAP = {
        '0': 0, 'turbulent': 0,
        '1': 1, 'bulge': 1,
        '2': 2, 'twist': 2,
        '3': 3, 'turbulent smoother': 3, 'turb smoother': 3, 'turbulentsmoother': 3,
        '4': 4, 'bulge smoother': 4, 'bulgesmoother': 4,
        '5': 5, 'twist smoother': 5, 'twistsmoother': 5,
        '6': 6, 'horizontal': 6, 'horizontal displacement': 6,
        '7': 7, 'vertical': 7, 'vertical displacement': 7,
        '8': 8, 'cross': 8, 'cross displacement': 8
    };

    var PINNING_MAP = {
        '0': 0, 'none': 0,
        '1': 1, 'all': 1, 'pin all': 1, 'all locked': 1,
        '2': 2, 'horizontal': 2, 'pin horizontal': 2, 'horizontal only': 2, 'pin horizontal only': 2,
        '3': 3, 'vertical': 3, 'pin vertical': 3, 'vertical only': 3, 'pin vertical only': 3,
        '4': 4, 'left': 4, 'pin left': 4,
        '5': 5, 'right': 5, 'pin right': 5,
        '6': 6, 'top': 6, 'pin top': 6,
        '7': 7, 'bottom': 7, 'pin bottom': 7
    };

    var TAG_SKSL = '[AE:Turbulent Displace]';
    var TAG_DEFORMER = '[AE:Turbulent Displace Vector]';

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

    function resolveBoolNum(v, fb) {
        if (typeof v === 'boolean') return v ? 1 : 0;
        if (typeof v === 'number' && isFinite(v)) return v >= 0.5 ? 1 : 0;
        if (v === null || v === undefined) return fb;
        var s = String(v).toLowerCase().trim();
        if (s === 'true' || s === 'on' || s === 'yes' || s === '1' || s === 'high') return 1;
        if (s === 'false' || s === 'off' || s === 'no' || s === '0' || s === 'low') return 0;
        return fb;
    }

    function normalizeParams(raw) {
        var p = raw && typeof raw === 'object' ? raw : {};
        var offX = p.offsetX !== undefined ? p.offsetX : p.tdOffsetX;
        var offY = p.offsetY !== undefined ? p.offsetY : p.tdOffsetY;
        if (Array.isArray(p.offset) && p.offset.length >= 2) {
            offX = p.offset[0];
            offY = p.offset[1];
        } else if (p.offset && typeof p.offset === 'object') {
            if (p.offset.x !== undefined) offX = p.offset.x;
            if (p.offset.y !== undefined) offY = p.offset.y;
        }
        var finalOffX = isFinite(Number(offX)) ? Number(offX) : DEFAULTS.offsetX;
        var finalOffY = isFinite(Number(offY)) ? Number(offY) : DEFAULTS.offsetY;

        var dispRaw = p.displacement !== undefined ? p.displacement : (p.tdDisp !== undefined ? p.tdDisp : DEFAULTS.displacement);
        var amtRaw = p.amount !== undefined ? p.amount : (p.tdAmount !== undefined ? p.tdAmount : DEFAULTS.amount);
        var sizeRaw = p.size !== undefined ? p.size : (p.tdSize !== undefined ? p.tdSize : DEFAULTS.size);
        var compRaw = p.complexity !== undefined ? p.complexity : (p.tdComplexity !== undefined ? p.tdComplexity : DEFAULTS.complexity);
        var evoRaw = p.evolution !== undefined ? p.evolution : (p.tdEvolution !== undefined ? p.tdEvolution : DEFAULTS.evolution);
        var cycRaw = p.cycleEvolution !== undefined ? p.cycleEvolution : (p.tdCycleEvo !== undefined ? p.tdCycleEvo : DEFAULTS.cycleEvolution);
        var revsRaw = p.cycleRevolutions !== undefined ? p.cycleRevolutions : (p.tdCycleRevs !== undefined ? p.tdCycleRevs : DEFAULTS.cycleRevolutions);
        var seedRaw = p.randomSeed !== undefined ? p.randomSeed : (p.tdRandomSeed !== undefined ? p.tdRandomSeed : DEFAULTS.randomSeed);
        var pinRaw = p.pinning !== undefined ? p.pinning : (p.tdPinning !== undefined ? p.tdPinning : DEFAULTS.pinning);
        var aaRaw = p.antialiasing !== undefined ? p.antialiasing : (p.tdAntialiasing !== undefined ? p.tdAntialiasing : DEFAULTS.antialiasing);
        var reszRaw = p.resizeLayer !== undefined ? p.resizeLayer : DEFAULTS.resizeLayer;
        var resampRaw = p.resampleLength !== undefined ? p.resampleLength : (p.tdResampleLen !== undefined ? p.tdResampleLen : DEFAULTS.resampleLength);

        return {
            displacement: clampNum(resolveEnum(dispRaw, DISPLACEMENT_MAP, DEFAULTS.displacement), 0, 8, DEFAULTS.displacement),
            amount: isFinite(Number(amtRaw)) ? Number(amtRaw) : DEFAULTS.amount,
            size: Math.max(0.001, isFinite(Number(sizeRaw)) ? Number(sizeRaw) : DEFAULTS.size),
            offset: { x: finalOffX, y: finalOffY },
            offsetX: finalOffX,
            offsetY: finalOffY,
            complexity: clampNum(compRaw, 1.0, 10.0, DEFAULTS.complexity),
            evolution: isFinite(Number(evoRaw)) ? Number(evoRaw) : DEFAULTS.evolution,
            cycleEvolution: Boolean(resolveBoolNum(cycRaw, DEFAULTS.cycleEvolution)),
            cycleRevolutions: Math.max(1, Math.round(isFinite(Number(revsRaw)) ? Number(revsRaw) : DEFAULTS.cycleRevolutions)),
            randomSeed: isFinite(Number(seedRaw)) ? Number(seedRaw) : DEFAULTS.randomSeed,
            pinning: clampNum(resolveEnum(pinRaw, PINNING_MAP, DEFAULTS.pinning), 0, 7, DEFAULTS.pinning),
            antialiasing: resolveBoolNum(aaRaw, DEFAULTS.antialiasing),
            resizeLayer: Boolean(resolveBoolNum(reszRaw, DEFAULTS.resizeLayer)),
            resampleLength: Math.max(2, isFinite(Number(resampRaw)) ? Number(resampRaw) : DEFAULTS.resampleLength)
        };
    }

    var SKSL_PARAM_ENTRIES = [
        { name: 'Displacement', type: 'double', key: 'displacement', legacy: 'tdDisp', default: 0 },
        { name: 'Amount', type: 'double', key: 'amount', legacy: 'tdAmount', default: 50 },
        { name: 'Size', type: 'double', key: 'size', legacy: 'tdSize', default: 100 },
        { name: 'Offset', type: 'double2', key: 'offset', legacy: 'tdOffset', default: { x: 0, y: 0 } },
        { name: 'Complexity', type: 'double', key: 'complexity', legacy: 'tdComplexity', default: 1.0 },
        { name: 'Evolution', type: 'double', key: 'evolution', legacy: 'tdEvolution', default: 0 },
        { name: 'CycleEvolution', type: 'bool', key: 'cycleEvolution', legacy: 'tdCycleEvo', default: false },
        { name: 'CycleRevolutions', type: 'double', key: 'cycleRevolutions', legacy: 'tdCycleRevs', default: 1 },
        { name: 'RandomSeed', type: 'double', key: 'randomSeed', legacy: 'tdRandomSeed', default: 0 },
        { name: 'Pinning', type: 'double', key: 'pinning', legacy: 'tdPinning', default: 0 },
        { name: 'ResizeLayer', type: 'bool', key: 'resizeLayer', legacy: 'tdResizeLayer', default: true },
        { name: 'Antialiasing', type: 'double', key: 'antialiasing', legacy: 'tdAntialiasing', default: 0 }
    ];

    var DEFORMER_PARAM_ENTRIES = [
        { name: 'Displacement', type: 'double', key: 'displacement', legacy: 'tdDisp', default: 0 },
        { name: 'Amount', type: 'double', key: 'amount', legacy: 'tdAmount', default: 50 },
        { name: 'Size', type: 'double', key: 'size', legacy: 'tdSize', default: 100 },
        { name: 'Offset', type: 'double2', key: 'offset', legacy: 'tdOffset', default: { x: 0, y: 0 } },
        { name: 'Complexity', type: 'double', key: 'complexity', legacy: 'tdComplexity', default: 1.0 },
        { name: 'Evolution', type: 'double', key: 'evolution', legacy: 'tdEvolution', default: 0 },
        { name: 'CycleEvolution', type: 'bool', key: 'cycleEvolution', legacy: 'tdCycleEvo', default: false },
        { name: 'CycleRevolutions', type: 'double', key: 'cycleRevolutions', legacy: 'tdCycleRevs', default: 1 },
        { name: 'RandomSeed', type: 'double', key: 'randomSeed', legacy: 'tdRandomSeed', default: 0 },
        { name: 'Pinning', type: 'double', key: 'pinning', legacy: 'tdPinning', default: 0 },
        { name: 'ResampleLength', type: 'double', key: 'resampleLength', legacy: 'tdResampleLen', default: 8 }
    ];

    function stripLiveSkslUniformDecls(code) {
        return String(code).replace(/^\s*uniform\s+(?:float|float2|bool|int)\s+[A-Za-z0-9_]+\s*;\s*(?:\r?\n)?/gm, '');
    }

    function extractLayerId(connStr) {
        if (typeof connStr !== 'string' || !connStr) return '';
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
        pushConn(safeCall(function () { return api.getInConnection(targetId, portAttr); }, null));
        // Live Cavalry exposes array ports via indexed attributes (`filters.0`, `deformers.0`, ...)
        for (var pIdx = 0; pIdx < 16; pIdx++) {
            var idxConn = safeCall(function () { return api.getInConnection(targetId, portAttr + '.' + pIdx); }, null);
            if (idxConn) pushConn(idxConn);
        }
        if (ids.length) return ids;

        var all = safeCall(function () { return api.getCompLayers(false); }, []) || [];
        for (var i = 0; i < all.length; i++) {
            var id = all[i];
            if (safeCall(function () { return api.getLayerType(id); }, '') !== nodeType) continue;
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

    function findExistingNode(targetId, portAttr, nodeType, tagPrefix) {
        if (safeCall(function () { return api.getLayerType(targetId); }, '') === nodeType) {
            return { nodeId: targetId, isDirectSelection: true };
        }
        var linked = getConnectedNodes(targetId, portAttr, nodeType);
        for (var i = 0; i < linked.length; i++) {
            var nice = safeCall(function () { return api.getNiceName(linked[i]); }, '');
            if (typeof nice === 'string' && nice.indexOf(tagPrefix) === 0) {
                return { nodeId: linked[i], isDirectSelection: false };
            }
        }
        return { nodeId: null, isDirectSelection: false };
    }

    function setAttrValue(nodeId, attrKey, val) {
        var obj = {};
        obj[attrKey] = val;
        return safeCall(function () {
            api.set(nodeId, obj);
            return true;
        }, false);
    }

    function bindDynamicArraySlot(nodeId, groupAttr, entry, val, claimedSlots) {
        var uniformName = entry.name;
        var legacyName = entry.legacy;
        var attrType = entry.type || 'double';
        var setVal = val;
        if (attrType === 'double2') {
            setVal = {
                x: Number(val && val.x !== undefined ? val.x : (entry.default ? entry.default.x : 0)),
                y: Number(val && val.y !== undefined ? val.y : (entry.default ? entry.default.y : 0))
            };
        } else if (attrType === 'bool') {
            setVal = Boolean(val);
        } else {
            setVal = Number(val);
            if (!isFinite(setVal)) setVal = entry.default !== undefined ? entry.default : 0;
        }

        var attrs = safeCall(function () { return api.getAttributes(nodeId); }, []) || [];
        var directNames = [uniformName, legacyName];
        for (var d = 0; d < directNames.length; d++) {
            var n = directNames[d];
            if (!n) continue;
            var directCandidates = ['uniforms.' + n, 'dynamic.' + n, groupAttr + '.' + n, n];
            for (var i = 0; i < directCandidates.length; i++) {
                if (attrs.indexOf(directCandidates[i]) >= 0 && setAttrValue(nodeId, directCandidates[i], setVal)) {
                    return directCandidates[i];
                }
            }
        }

        var firstPlaceholder = null;
        var hasGroupAttr = attrs.indexOf(groupAttr) >= 0;
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
            if (curName === uniformName || (legacyName && curName === legacyName)) {
                claimedSlots[slot] = true;
                if (curName !== uniformName && typeof api.renameAttribute === 'function') {
                    safeCall(function () { api.renameAttribute(nodeId, slot, uniformName); }, null);
                }
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

    function bakeSkslUniforms(code, params, unboundEntries) {
        var out = String(code);
        for (var i = 0; i < unboundEntries.length; i++) {
            var entry = unboundEntries[i];
            var uName = entry.name;
            var pKey = entry.key;
            var val = params[pKey];
            if (entry.type === 'double2') {
                var ox = Number(val && val.x !== undefined ? val.x : 0);
                var oy = Number(val && val.y !== undefined ? val.y : 0);
                var rx2 = new RegExp('^\\s*uniform\\s+float2\\s+' + uName + '\\s*;', 'm');
                out = out.replace(rx2, 'const float2 ' + uName + ' = float2(' + ox.toFixed(3) + ', ' + oy.toFixed(3) + ');');
            } else if (entry.type === 'bool') {
                var bVal = Boolean(val) ? 'true' : 'false';
                var rxB = new RegExp('^\\s*uniform\\s+bool\\s+' + uName + '\\s*;', 'm');
                out = out.replace(rxB, 'const bool ' + uName + ' = ' + bVal + ';');
            } else {
                var v = Number(val);
                if (!isFinite(v)) v = entry.default !== undefined ? entry.default : 0;
                var rxF = new RegExp('^\\s*uniform\\s+float\\s+' + uName + '\\s*;', 'm');
                out = out.replace(rxF, 'const float ' + uName + ' = ' + v.toFixed(6) + ';');
            }
        }
        return out;
    }

    function inlineDeformerParams(expr, params, unboundEntries) {
        if (!unboundEntries.length) return expr;
        var header = '// Baked AE parameters (dynamic slots unavailable):\n';
        for (var i = 0; i < unboundEntries.length; i++) {
            var entry = unboundEntries[i];
            var uName = entry.name;
            var pKey = entry.key;
            var val = params[pKey];
            if (entry.type === 'double2') {
                var ox = Number(val && val.x !== undefined ? val.x : 0);
                var oy = Number(val && val.y !== undefined ? val.y : 0);
                header += 'var ' + uName + ' = { x: ' + ox + ', y: ' + oy + ' };\n';
            } else if (entry.type === 'bool') {
                header += 'var ' + uName + ' = ' + (Boolean(val) ? 'true' : 'false') + ';\n';
            } else {
                header += 'var ' + uName + ' = ' + Number(val) + ';\n';
            }
        }
        return header + '\n' + expr;
    }

    function applyEvolutionKeyframes(nodeId, attrPath, animCfg, baseEvolution) {
        if (!animCfg || typeof api.keyframe !== 'function' || !attrPath) return null;
        if (Array.isArray(animCfg.keyframes) && animCfg.keyframes.length > 0) {
            for (var i = 0; i < animCfg.keyframes.length; i++) {
                var kf = animCfg.keyframes[i];
                var p = {};
                p[attrPath] = kf.value;
                api.keyframe(nodeId, kf.frame, p);
            }
            return { attr: attrPath, keyframes: animCfg.keyframes.slice() };
        }
        var sF = isFinite(Number(animCfg.startFrame)) ? Number(animCfg.startFrame) : 0;
        var eF = isFinite(Number(animCfg.endFrame)) ? Number(animCfg.endFrame) : 60;
        var sV = isFinite(Number(animCfg.startValue)) ? Number(animCfg.startValue) : baseEvolution;
        var eV = isFinite(Number(animCfg.endValue)) ? Number(animCfg.endValue) : (sV + 360);
        var p0 = {}; p0[attrPath] = sV;
        var p1 = {}; p1[attrPath] = eV;
        api.keyframe(nodeId, sF, p0);
        api.keyframe(nodeId, eF, p1);
        return { attr: attrPath, keyframes: [{ frame: sF, value: sV }, { frame: eF, value: eV }] };
    }

    function targetSupportsPort(targetId, portName) {
        var targetType = safeCall(function () { return api.getLayerType(targetId); }, '');
        if (targetType === 'null' || targetType === 'camera') return false;
        var attrs = safeCall(function () { return api.getAttributes(targetId); }, []) || [];
        if (attrs.indexOf(portName) >= 0) return true;
        // Live Cavalry exposes 'is3d'/'blendMode'/'motionBlur' on layers; if full live schema lacks the port, skip safely
        if (attrs.indexOf('is3d') >= 0 || attrs.indexOf('motionBlur') >= 0 || attrs.indexOf('blendMode') >= 0) {
            return false;
        }
        return true;
    }

    function applySkslToTarget(targetId, params, animCfg, padPx, warnings) {
        var found = findExistingNode(targetId, 'filters', 'skslFilter', TAG_SKSL);
        var targetName = safeCall(function () { return api.getNiceName(targetId); }, targetId);
        if (!found.nodeId && !targetSupportsPort(targetId, 'filters')) {
            warnings.push('Skipped ' + targetName + ': layer does not support SkSL filters (`filters` port unavailable).');
            return null;
        }
        var filterId = found.nodeId || api.create('skslFilter', TAG_SKSL + ' ' + targetName);
        if (!found.nodeId) {
            var connected = safeCall(function () {
                api.connect(filterId, 'id', targetId, 'filters');
                return true;
            }, false);
            if (!connected) {
                safeCall(function () { api.deleteLayer(filterId); }, null);
                warnings.push('Skipped ' + targetName + ': failed to connect SkSL filter to layer `filters` port.');
                return null;
            }
        }

        var attrsBefore = safeCall(function () { return api.getAttributes(filterId); }, []) || [];
        var hasDynamicInputs = attrsBefore.indexOf('inputs') >= 0 || attrsBefore.indexOf('inputs.0') >= 0;

        var bound = {};
        var unboundEntries = [];
        var claimedSlots = {};

        if (!hasDynamicInputs) {
            api.set(filterId, { code: SKSL_SOURCE });
        }

        for (var i = 0; i < SKSL_PARAM_ENTRIES.length; i++) {
            var entry = SKSL_PARAM_ENTRIES[i];
            var attrKey = bindDynamicArraySlot(filterId, 'inputs', entry, params[entry.key], claimedSlots);
            if (attrKey) bound[entry.key] = attrKey;
            else unboundEntries.push(entry);
        }

        var uniformMode = hasDynamicInputs ? 'cavalry-inputs-array' : 'dynamic-uniforms';
        if (hasDynamicInputs) {
            var liveCode = stripLiveSkslUniformDecls(SKSL_SOURCE);
            if (unboundEntries.length > 0) {
                liveCode = bakeSkslUniforms(liveCode, params, unboundEntries);
                uniformMode = Object.keys(bound).length > 0 ? 'hybrid' : 'baked-constants';
            }
            api.set(filterId, { code: liveCode });
        } else if (unboundEntries.length > 0) {
            api.set(filterId, { code: bakeSkslUniforms(SKSL_SOURCE, params, unboundEntries) });
            uniformMode = Object.keys(bound).length > 0 ? 'hybrid' : 'baked-constants';
        }

        var attrsAfter = safeCall(function () { return api.getAttributes(filterId); }, []) || [];
        if (attrsAfter.indexOf('padding') >= 0) {
            var padVal = params.resizeLayer ? { x: padPx, y: padPx } : { x: 0, y: 0 };
            safeCall(function () {
                api.set(filterId, { padding: padVal });
            }, null);
        }

        var animInfo = null;
        if (animCfg) {
            if (bound.evolution) {
                animInfo = applyEvolutionKeyframes(filterId, bound.evolution, animCfg, params.evolution);
            } else {
                warnings.push('SkSL dynamic uniform for `evolution` was not exposed via script API on ' + filterId + '; evolution keyframes skipped in baked-constants mode (use live Cavalry inputs.* or mode: "deformer").');
            }
        }

        var bakedNames = [];
        for (var b = 0; b < unboundEntries.length; b++) bakedNames.push(unboundEntries[b].key || unboundEntries[b].name);

        return {
            mechanism: 'skslFilter',
            targetId: targetId,
            targetName: targetName,
            nodeId: filterId,
            action: found.nodeId ? 'updated' : 'created',
            uniformMode: uniformMode,
            padding: padPx,
            boundAttrs: bound,
            bakedUniforms: bakedNames,
            animation: animInfo
        };
    }

    function applyDeformerToTarget(targetId, params, animCfg, warnings) {
        var found = findExistingNode(targetId, 'deformers', 'javaScriptDeformer', TAG_DEFORMER);
        var targetName = safeCall(function () { return api.getNiceName(targetId); }, targetId);
        if (!found.nodeId && !targetSupportsPort(targetId, 'deformers')) {
            warnings.push('Skipped ' + targetName + ': layer does not support deformers (`deformers` port unavailable).');
            return null;
        }
        var defId = found.nodeId || api.create('javaScriptDeformer', TAG_DEFORMER + ' ' + targetName);
        if (!found.nodeId) {
            var connected = safeCall(function () {
                api.connect(defId, 'id', targetId, 'deformers');
                return true;
            }, false);
            if (!connected) {
                safeCall(function () { api.deleteLayer(defId); }, null);
                warnings.push('Skipped ' + targetName + ': failed to connect deformer to layer `deformers` port.');
                return null;
            }
        }

        var bound = {};
        var unboundEntries = [];
        var claimedSlots = {};
        for (var i = 0; i < DEFORMER_PARAM_ENTRIES.length; i++) {
            var entry = DEFORMER_PARAM_ENTRIES[i];
            var slotKey = bindDynamicArraySlot(defId, 'array', entry, params[entry.key], claimedSlots);
            if (slotKey) bound[entry.key] = slotKey;
            else unboundEntries.push(entry);
        }

        var exprToSet = unboundEntries.length > 0
            ? inlineDeformerParams(DEFORMER_SOURCE, params, unboundEntries)
            : DEFORMER_SOURCE;
        api.set(defId, { expression: exprToSet });

        var animInfo = null;
        if (animCfg) {
            if (bound.evolution) {
                animInfo = applyEvolutionKeyframes(defId, bound.evolution, animCfg, params.evolution);
            } else {
                warnings.push('Deformer dynamic slot for `evolution` was unavailable on ' + defId + '; keyframes skipped.');
            }
        }

        var inlinedNames = [];
        for (var u = 0; u < unboundEntries.length; u++) inlinedNames.push(unboundEntries[u].key || unboundEntries[u].name);

        return {
            mechanism: 'javaScriptDeformer',
            targetId: targetId,
            targetName: targetName,
            nodeId: defId,
            action: found.nodeId ? 'updated' : 'created',
            boundAttrs: bound,
            inlinedVars: inlinedNames,
            animation: animInfo
        };
    }

    var cfg = typeof __EFFECT_CONFIG__ !== 'undefined' && __EFFECT_CONFIG__ ? __EFFECT_CONFIG__ : {};
    var mode = String(cfg.mode || 'auto').toLowerCase();
    var params = normalizeParams(cfg.params || cfg);
    var animCfg = cfg.animateEvolution || cfg.animate || null;
    var createFallback = cfg.createTestTargetIfEmpty === true;

    var startedUndo = false;
    if (typeof api.startUndoGroup === 'function') {
        api.startUndoGroup('Apply AE Turbulent Displace');
        startedUndo = true;
    }

    var out;
    try {
        var selection = safeCall(function () { return api.getSelection(); }, []) || [];
        var createdFallbackTarget = null;
        if (!selection.length && createFallback) {
            createdFallbackTarget = api.primitive('rectangle', 'Turbulent Displace Target');
            api.select([createdFallbackTarget]);
            selection = [createdFallbackTarget];
        }

        if (!selection.length) {
            out = {
                ok: false,
                effect: 'turbulent-displace',
                version: '1.1.0',
                error: 'No layer selected in Cavalry. Select one or more drawable layers (or pass createTestTargetIfEmpty: true) before applying AE Turbulent Displace.',
                selection: []
            };
            try { __result = out; } catch (e) {}
            return out;
        }

        var padPx = 0;
        if (isFinite(Number(cfg.padding)) && Number(cfg.padding) >= 0) {
            padPx = Math.round(Number(cfg.padding));
        } else if (params.resizeLayer >= 0.5 && params.amount !== 0) {
            padPx = Math.min(400, Math.max(24, Math.ceil(Math.abs(params.amount) * 1.25)));
        }

        var applied = [];
        var warnings = [];
        for (var s = 0; s < selection.length; s++) {
            var targetId = selection[s];
            var targetType = safeCall(function () { return api.getLayerType(targetId); }, '');
            var resolvedMode = mode;
            if (resolvedMode === 'auto') {
                resolvedMode = targetType === 'javaScriptDeformer' ? 'deformer' : 'sksl';
            }
            if (resolvedMode === 'sksl' || resolvedMode === 'both') {
                var skslRes = applySkslToTarget(targetId, params, animCfg, padPx, warnings);
                if (skslRes) applied.push(skslRes);
            }
            if (resolvedMode === 'deformer' || resolvedMode === 'both') {
                var defRes = applyDeformerToTarget(targetId, params, animCfg, warnings);
                if (defRes) applied.push(defRes);
            }
        }

        safeCall(function () { api.select(selection); }, null);

        if (!applied.length) {
            out = {
                ok: false,
                effect: 'turbulent-displace',
                version: '1.1.0',
                mode: mode,
                error: warnings.length ? warnings.join(' ') : 'No selected layer supported AE Turbulent Displace.',
                appliedCount: 0,
                applied: [],
                warnings: warnings
            };
            try { __result = out; } catch (e) {}
            return out;
        }

        out = {
            ok: true,
            effect: 'turbulent-displace',
            version: '1.1.0',
            mode: mode,
            params: params,
            paddingPx: padPx,
            createdFallbackTarget: createdFallbackTarget,
            appliedCount: applied.length,
            applied: applied,
            warnings: warnings
        };
        try { __result = out; } catch (e) {}
        return out;
    } finally {
        if (startedUndo && typeof api.endUndoGroup === 'function') {
            api.endUndoGroup();
        }
    }
})();
