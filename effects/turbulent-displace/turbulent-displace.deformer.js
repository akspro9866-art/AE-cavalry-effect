// Adobe After Effects "Turbulent Displace" — Cavalry JavaScript Deformer Companion (`javaScriptDeformer`)
// Context allowed ONLY: console, ctx, cavalry, def (never reference `api`)
// Subdivides/resamples vector outlines via `cavalry.Path.resample()` & `pathData()` / `setPathData()`
// for genuine pure-vector distortion when raster `skslFilter` is not desired.

function tdNum(val, fallback) {
    var n = Number(val);
    return isFinite(n) ? n : fallback;
}

function tdClamp(x, lo, hi) {
    return x < lo ? lo : (x > hi ? hi : x);
}

function tdFract(x) {
    return x - Math.floor(x);
}

function tdStep(edge, x) {
    return x >= edge ? 1.0 : 0.0;
}

function tdSmoothstep(edge0, edge1, x) {
    var denom = edge1 - edge0;
    if (Math.abs(denom) < 1e-8) return x >= edge1 ? 1.0 : 0.0;
    var t = tdClamp((x - edge0) / denom, 0.0, 1.0);
    return t * t * (3.0 - 2.0 * t);
}

function tdMod289(x) {
    return x - Math.floor(x / 289.0) * 289.0;
}

function tdPerm4(x) {
    var w = tdMod289(x);
    return tdMod289(((w * 34.0) + 1.0) * w);
}

function tdGrad4Symmetric(j) {
    var idx = Math.floor(j - Math.floor(j * 0.03125) * 32.0);
    var s0 = 1.0 - 2.0 * tdStep(0.25, tdFract(idx * 0.5));
    var s1 = 1.0 - 2.0 * tdStep(0.25, tdFract(Math.floor(idx * 0.5) * 0.5));
    var s2 = 1.0 - 2.0 * tdStep(0.25, tdFract(Math.floor(idx * 0.25) * 0.5));
    var z = Math.floor(idx * 0.125);
    if (z < 0.5) return [0.0, s0, s1, s2];
    if (z < 1.5) return [s0, 0.0, s1, s2];
    if (z < 2.5) return [s0, s1, 0.0, s2];
    return [s0, s1, s2, 0.0];
}

function tdSnoise4Grad(vx, vy, vz, vw) {
    var F4 = 0.309016994374947451;
    var G4 = 0.1381966011250105;
    var GAIN = 27.0;

    var s = (vx + vy + vz + vw) * F4;
    var ix = Math.floor(vx + s);
    var iy = Math.floor(vy + s);
    var iz = Math.floor(vz + s);
    var iw = Math.floor(vw + s);

    var t0 = (ix + iy + iz + iw) * G4;
    var x0x = vx - ix + t0;
    var x0y = vy - iy + t0;
    var x0z = vz - iz + t0;
    var x0w = vw - iw + t0;

    var isXx = tdStep(x0y, x0x);
    var isXy = tdStep(x0z, x0x);
    var isXz = tdStep(x0w, x0x);
    var isYZx = tdStep(x0z, x0y);
    var isYZy = tdStep(x0w, x0y);
    var isYZz = tdStep(x0w, x0z);

    var r0 = isXx + isXy + isXz;
    var r1 = (1.0 - isXx) + isYZx + isYZy;
    var r2 = (1.0 - isXy) + (1.0 - isYZx) + isYZz;
    var r3 = (1.0 - isXz) + (1.0 - isYZy) + (1.0 - isYZz);

    var i1x = tdClamp(r0 - 2.0, 0.0, 1.0);
    var i1y = tdClamp(r1 - 2.0, 0.0, 1.0);
    var i1z = tdClamp(r2 - 2.0, 0.0, 1.0);
    var i1w = tdClamp(r3 - 2.0, 0.0, 1.0);

    var i2x = tdClamp(r0 - 1.0, 0.0, 1.0);
    var i2y = tdClamp(r1 - 1.0, 0.0, 1.0);
    var i2z = tdClamp(r2 - 1.0, 0.0, 1.0);
    var i2w = tdClamp(r3 - 1.0, 0.0, 1.0);

    var i3x = tdClamp(r0, 0.0, 1.0);
    var i3y = tdClamp(r1, 0.0, 1.0);
    var i3z = tdClamp(r2, 0.0, 1.0);
    var i3w = tdClamp(r3, 0.0, 1.0);

    var corners = [
        [x0x, x0y, x0z, x0w, 0, 0, 0, 0],
        [x0x - i1x + G4, x0y - i1y + G4, x0z - i1z + G4, x0w - i1w + G4, i1x, i1y, i1z, i1w],
        [x0x - i2x + 2.0 * G4, x0y - i2y + 2.0 * G4, x0z - i2z + 2.0 * G4, x0w - i2w + 2.0 * G4, i2x, i2y, i2z, i2w],
        [x0x - i3x + 3.0 * G4, x0y - i3y + 3.0 * G4, x0z - i3z + 3.0 * G4, x0w - i3w + 3.0 * G4, i3x, i3y, i3z, i3w],
        [x0x - 1.0 + 4.0 * G4, x0y - 1.0 + 4.0 * G4, x0z - 1.0 + 4.0 * G4, x0w - 1.0 + 4.0 * G4, 1, 1, 1, 1]
    ];

    var mix = tdMod289(ix), miy = tdMod289(iy), miz = tdMod289(iz), miw = tdMod289(iw);
    var val = 0.0, gX = 0.0, gY = 0.0;

    for (var k = 0; k < 5; k++) {
        var c = corners[k];
        var dx = c[0], dy = c[1], dz = c[2], dw = c[3];
        var m = Math.max(0.6 - (dx * dx + dy * dy + dz * dz + dw * dw), 0.0);
        if (m > 0.0) {
            var j = tdPerm4(tdPerm4(tdPerm4(tdPerm4(miw + c[7]) + miz + c[6]) + miy + c[5]) + mix + c[4]);
            var g = tdGrad4Symmetric(j);
            var m2 = m * m, m3 = m2 * m, m4 = m2 * m2;
            var gd = g[0] * dx + g[1] * dy + g[2] * dz + g[3] * dw;
            val += m4 * gd;
            gX += -8.0 * m3 * dx * gd + m4 * g[0];
            gY += -8.0 * m3 * dy * gd + m4 * g[1];
        }
    }
    return [val * GAIN, gX * GAIN, gY * GAIN];
}

// Dynamic parameters bound via `array.*` dynamic attributes on `javaScriptDeformer`
var aeDisp = tdClamp(Math.round(tdNum(typeof Displacement !== 'undefined' ? Displacement : (typeof tdDisp !== 'undefined' ? tdDisp : (typeof displacement !== 'undefined' ? displacement : 0)), 0)), 0, 8);
var aeAmt = tdNum(typeof Amount !== 'undefined' ? Amount : (typeof tdAmount !== 'undefined' ? tdAmount : (typeof amount !== 'undefined' ? amount : 50)), 50);
var aeSize = Math.max(0.001, tdNum(typeof Size !== 'undefined' ? Size : (typeof tdSize !== 'undefined' ? tdSize : (typeof size !== 'undefined' ? size : 100)), 100));
var aeOffX = tdNum(typeof Offset !== 'undefined' && Offset && typeof Offset.x === 'number' ? Offset.x : (typeof tdOffsetX !== 'undefined' ? tdOffsetX : (typeof offsetX !== 'undefined' ? offsetX : 0)), 0);
var aeOffY = tdNum(typeof Offset !== 'undefined' && Offset && typeof Offset.y === 'number' ? Offset.y : (typeof tdOffsetY !== 'undefined' ? tdOffsetY : (typeof offsetY !== 'undefined' ? offsetY : 0)), 0);
var aeComp = tdClamp(tdNum(typeof Complexity !== 'undefined' ? Complexity : (typeof tdComplexity !== 'undefined' ? tdComplexity : (typeof complexity !== 'undefined' ? complexity : 1.0)), 1.0), 1.0, 10.0);
var aeEvo = tdNum(typeof Evolution !== 'undefined' ? Evolution : (typeof tdEvolution !== 'undefined' ? tdEvolution : (typeof evolution !== 'undefined' ? evolution : 0)), 0);
var aeCycRaw = typeof CycleEvolution !== 'undefined' ? CycleEvolution : (typeof tdCycleEvo !== 'undefined' ? tdCycleEvo : (typeof cycleEvolution !== 'undefined' ? cycleEvolution : 0));
var aeCyc = (typeof aeCycRaw === 'boolean') ? aeCycRaw : (tdNum(aeCycRaw, 0) >= 0.5);
var aeRevs = Math.max(1.0, Math.round(tdNum(typeof CycleRevolutions !== 'undefined' ? CycleRevolutions : (typeof tdCycleRevs !== 'undefined' ? tdCycleRevs : (typeof cycleRevolutions !== 'undefined' ? cycleRevolutions : 1)), 1)));
var aeSeed = tdNum(typeof RandomSeed !== 'undefined' ? RandomSeed : (typeof tdRandomSeed !== 'undefined' ? tdRandomSeed : (typeof randomSeed !== 'undefined' ? randomSeed : 0)), 0);
var aePin = tdClamp(Math.round(tdNum(typeof Pinning !== 'undefined' ? Pinning : (typeof tdPinning !== 'undefined' ? tdPinning : (typeof pinning !== 'undefined' ? pinning : 0)), 0)), 0, 7);
var aeResampleLen = Math.max(2.0, tdNum(typeof ResampleLength !== 'undefined' ? ResampleLength : (typeof tdResampleLen !== 'undefined' ? tdResampleLen : (typeof resampleLength !== 'undefined' ? resampleLength : 8.0)), 8.0));

function tdDisplacePoint(px, py, bbox) {
    if (aeAmt === 0.0) return { x: px, y: py };

    var falloff = (typeof def !== 'undefined' && typeof def.getFalloffAtPoint === 'function')
        ? tdClamp(def.getFalloffAtPoint(px, py), 0.0, 1.0)
        : 1.0;
    if (falloff <= 0.0) return { x: px, y: py };

    var isSmoother = aeDisp >= 3 && aeDisp <= 5;
    var baseMode = isSmoother ? aeDisp - 3 : aeDisp;
    var effSize = aeSize * (isSmoother ? 1.38 : 1.0);

    var cx = (bbox && bbox.centre ? bbox.centre.x : 0) + aeOffX;
    var cy = (bbox && bbox.centre ? bbox.centre.y : 0) + aeOffY;
    var ux = (px - cx) / effSize;
    var uy = (py - cy) / effSize;

    var seedFrac = tdFract(aeSeed * 0.1031) * 47.0 + tdFract(aeSeed * 0.0379) * 31.0;
    var revs = aeEvo / 360.0;
    var zC, wC;
    if (aeCyc) {
        var theta = Math.PI * 2.0 * (revs / aeRevs);
        var radius = 0.75 * aeRevs;
        zC = seedFrac + radius * Math.cos(theta);
        wC = seedFrac * 0.61803398875 + radius * Math.sin(theta);
    } else {
        zC = seedFrac + revs * 0.75;
        wC = seedFrac * 0.61803398875 + 3.14159265;
    }

    var gain = isSmoother ? 0.38 : 0.5;
    var dGain = isSmoother ? 0.30 : 0.42;
    var sumAx = 0.0, gx = 0.0, gy = 0.0, sumB = 0.0;
    var amp = 1.0, dAmp = 1.0, freq = 1.0;

    for (var oct = 0; oct < 10; oct++) {
        var w = tdClamp(aeComp - oct, 0.0, 1.0);
        if (w <= 0.0) break;
        var oz = zC + oct * 7.13;
        var ow = wC + oct * 11.71;
        var nA = tdSnoise4Grad(ux * freq, uy * freq, oz, ow);
        sumAx += w * amp * nA[0];
        gx += w * dAmp * nA[1];
        gy += w * dAmp * nA[2];
        if (baseMode === 0 || baseMode === 7 || baseMode === 8) {
            var nB = tdSnoise4Grad(ux * freq + 19.31, uy * freq + 43.17, oz + 23.7, ow + 5.9);
            sumB += w * amp * nB[0];
        }
        amp *= gain;
        dAmp *= dGain;
        freq *= 2.0;
    }

    var compScale = 1.0 / (1.0 + 0.22 * (Math.log(aeComp) / Math.LN2));
    var strength = aeAmt * 0.62 * compScale;
    var rdx = 0.0, rdy = 0.0;
    if (baseMode === 0) { rdx = sumAx; rdy = sumB; }
    else if (baseMode === 1) { rdx = -gx * 0.26; rdy = -gy * 0.26; }
    else if (baseMode === 2) { rdx = -gy * 0.28; rdy = gx * 0.28; }
    else if (baseMode === 6) { rdx = sumAx; rdy = 0.0; } // 6 = Horizontal Displacement
    else if (baseMode === 7) { rdx = 0.0; rdy = sumB; }  // 7 = Vertical Displacement
    else {
        var ax = Math.abs(sumAx), ay = Math.abs(sumB);
        var wx = ax / (ax + ay + 0.08), wy = ay / (ax + ay + 0.08);
        rdx = sumAx * (0.45 + 0.85 * wx);
        rdy = sumB * (0.45 + 0.85 * wy);
    }

    var pinW = 1.0;
    if (aePin > 0 && bbox && bbox.width > 0 && bbox.height > 0) {
        var minY = Math.min(bbox.bottom, bbox.top);
        var uvX = tdClamp((px - bbox.left) / bbox.width, 0.0, 1.0);
        var uvY = tdClamp((py - minY) / bbox.height, 0.0, 1.0);
        var mx = tdClamp(Math.max(Math.abs(aeAmt) * 1.15, aeSize * 0.35, 16.0) / Math.max(bbox.width, 1), 0.03, 0.48);
        var my = tdClamp(Math.max(Math.abs(aeAmt) * 1.15, aeSize * 0.35, 16.0) / Math.max(bbox.height, 1), 0.03, 0.48);
        var pL = tdSmoothstep(0.0, mx, uvX);
        var pR = tdSmoothstep(0.0, mx, 1.0 - uvX);
        var pB = tdSmoothstep(0.0, my, uvY);
        var pT = tdSmoothstep(0.0, my, 1.0 - uvY);
        if (aePin === 1) pinW = pL * pR * pB * pT;
        else if (aePin === 2) pinW = pL * pR;
        else if (aePin === 3) pinW = pB * pT;
        else if (aePin === 4) pinW = pL;
        else if (aePin === 5) pinW = pR;
        else if (aePin === 6) pinW = pT;
        else pinW = pB;
    }

    var totalScale = strength * pinW * falloff;
    return {
        x: px + rdx * totalScale,
        y: py + rdy * totalScale
    };
}

function tdDisplaceVerbHandle(h, ox, oy, nx, ny) {
    if (!h || typeof h.x !== 'number' || typeof h.y !== 'number') return;
    h.x += (nx - ox);
    h.y += (ny - oy);
}

function tdDeformPathData(path, bbox) {
    if (typeof path.resample === 'function') {
        path.resample(aeResampleLen);
    } else if (typeof path.convertToLines === 'function') {
        path.convertToLines(0.5);
    }

    if (typeof path.pathData === 'function' && typeof path.setPathData === 'function') {
        var pd = path.pathData();
        if (Array.isArray(pd)) {
            for (var idx = 0; idx < pd.length; idx++) {
                var cmd = pd[idx];
                if (!cmd) continue;
                if (cmd.point && typeof cmd.point.x === 'number' && typeof cmd.point.y === 'number') {
                    var ox = cmd.point.x;
                    var oy = cmd.point.y;
                    var dp = tdDisplacePoint(ox, oy, bbox);
                    cmd.point.x = dp.x;
                    cmd.point.y = dp.y;
                    tdDisplaceVerbHandle(cmd.cp1, ox, oy, dp.x, dp.y);
                    tdDisplaceVerbHandle(cmd.cp2, ox, oy, dp.x, dp.y);
                } else if (typeof cmd.x === 'number' && typeof cmd.y === 'number') {
                    var dpPlain = tdDisplacePoint(cmd.x, cmd.y, bbox);
                    cmd.x = dpPlain.x;
                    cmd.y = dpPlain.y;
                }
            }
            path.setPathData(pd);
            return true;
        }
    }
    return false;
}

function tdDeformMeshRecursive(mesh, bbox) {
    if (!mesh) return;
    if (typeof mesh.childMeshCount === 'function') {
        var nChildren = mesh.childMeshCount();
        for (var c = 0; c < nChildren; c++) {
            var child = mesh.getChildMeshAtIndex(c);
            if (child) {
                tdDeformMeshRecursive(child, bbox);
                if (typeof mesh.setChildMeshAtIndex === 'function') {
                    mesh.setChildMeshAtIndex(c, child);
                }
            }
        }
    }
    if (typeof mesh.count === 'function') {
        var nPaths = mesh.count();
        for (var i = 0; i < nPaths; i++) {
            if (typeof mesh.getPathAtIndex === 'function' && typeof mesh.setPathAtIndex === 'function') {
                var path = mesh.getPathAtIndex(i);
                if (path && tdDeformPathData(path, bbox)) {
                    mesh.setPathAtIndex(i, path);
                }
            }
        }
    }
}

if (typeof def !== 'undefined') {
    var bbox = typeof def.getBoundingBox === 'function' ? def.getBoundingBox() : null;
    if (typeof def.getRootMesh === 'function' && typeof def.setRootMesh === 'function') {
        var rootMesh = def.getRootMesh();
        if (rootMesh) {
            tdDeformMeshRecursive(rootMesh, bbox);
            def.setRootMesh(rootMesh);
        }
    } else if (typeof def.getPoints === 'function' && typeof def.setPoints === 'function') {
        var pts = def.getPoints();
        if (Array.isArray(pts)) {
            for (var p = 0; p < pts.length; p++) {
                var dp = tdDisplacePoint(pts[p].x, pts[p].y, bbox);
                pts[p].x = dp.x;
                pts[p].y = dp.y;
            }
            def.setPoints(pts);
        }
    }
}
