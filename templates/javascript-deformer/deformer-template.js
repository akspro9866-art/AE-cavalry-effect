// Cavalry 2.8+ JavaScript Deformer Template (`javaScriptDeformer`)
// Allowed context globals ONLY: console, ctx, cavalry, def
// Do NOT reference api, ui, render, plugin, or install in this file.

function safeNum(val, fallback) {
    var n = Number(val);
    return isFinite(n) ? n : fallback;
}

// Dynamic variable names (renamed on `array.*` dynamic array slots via `api.addDynamic` + `api.renameAttribute`)
var effAmount = safeNum(typeof effAmount !== 'undefined' ? effAmount : 50, 50);
var effFrequency = safeNum(typeof effFrequency !== 'undefined' ? effFrequency : 0.01, 0.01);
var effPhase = safeNum(typeof effPhase !== 'undefined' ? effPhase : 0, 0);
var effResampleLen = Math.max(2, safeNum(typeof effResampleLen !== 'undefined' ? effResampleLen : 8, 8));

function deformPoint(pt, falloff) {
    if (effAmount === 0 || falloff <= 0) return { x: pt.x, y: pt.y };
    var n = typeof cavalry !== 'undefined' && typeof cavalry.noise2d === 'function'
        ? cavalry.noise2d(pt.x * effFrequency + effPhase, pt.y * effFrequency - effPhase)
        : 0;
    return {
        x: pt.x + n * effAmount * falloff,
        y: pt.y + n * effAmount * falloff
    };
}

function deformPathData(path) {
    if (!path) return false;
    if (typeof path.resample === 'function') {
        path.resample(effResampleLen);
    } else if (typeof path.convertToLines === 'function') {
        path.convertToLines(0.5);
    }
    if (typeof path.pathData === 'function' && typeof path.setPathData === 'function') {
        var pd = path.pathData();
        if (Array.isArray(pd)) {
            for (var i = 0; i < pd.length; i++) {
                var cmd = pd[i];
                if (!cmd || !cmd.point) continue;
                var falloff = typeof def.getFalloffAtPoint === 'function'
                    ? def.getFalloffAtPoint(cmd.point.x, cmd.point.y)
                    : 1.0;
                var dp = deformPoint(cmd.point, falloff);
                var dx = dp.x - cmd.point.x;
                var dy = dp.y - cmd.point.y;
                cmd.point.x = dp.x;
                cmd.point.y = dp.y;
                if (cmd.cp1) { cmd.cp1.x += dx; cmd.cp1.y += dy; }
                if (cmd.cp2) { cmd.cp2.x += dx; cmd.cp2.y += dy; }
            }
            path.setPathData(pd);
            return true;
        }
    }
    return false;
}

function visitMeshes(mesh) {
    if (!mesh) return;
    if (typeof mesh.childMeshCount === 'function') {
        var childCount = mesh.childMeshCount();
        for (var c = 0; c < childCount; c++) {
            var child = mesh.getChildMeshAtIndex(c);
            if (child) {
                visitMeshes(child);
                if (typeof mesh.setChildMeshAtIndex === 'function') mesh.setChildMeshAtIndex(c, child);
            }
        }
    }
    if (typeof mesh.count === 'function') {
        var pathCount = mesh.count();
        for (var p = 0; p < pathCount; p++) {
            var path = mesh.getPathAtIndex(p);
            if (deformPathData(path)) mesh.setPathAtIndex(p, path);
        }
    }
}

if (typeof def !== 'undefined') {
    if (typeof def.getRootMesh === 'function' && typeof def.setRootMesh === 'function') {
        var root = def.getRootMesh();
        if (root) {
            visitMeshes(root);
            def.setRootMesh(root);
        }
    } else if (typeof def.getPoints === 'function' && typeof def.setPoints === 'function') {
        var points = def.getPoints();
        if (Array.isArray(points)) {
            for (var i = 0; i < points.length; i++) {
                var falloff = typeof def.getFalloffAtPoint === 'function'
                    ? def.getFalloffAtPoint(points[i].x, points[i].y)
                    : 1.0;
                var dp = deformPoint(points[i], falloff);
                points[i].x = dp.x;
                points[i].y = dp.y;
            }
            def.setPoints(points);
        }
    }
}
