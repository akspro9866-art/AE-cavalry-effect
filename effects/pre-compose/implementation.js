/**
 * One-Action Reusable Implementation:
 * Adobe After Effects "Pre-Compose" -> Cavalry 2.8+
 *
 * In Adobe After Effects, Pre-Compose moves the selected layers into a new
 * nested composition, leaving a single pre-comp layer in their place.
 * In Cavalry 2.8+, this is achieved via the native `api.preCompose(layerIds, name)`
 * API, which creates a `compositionReference` referencing the new nested comp.
 *
 * Verifies that pre-compose actually created a valid composition reference.
 */
(function () {
    var TAG_PRECOMP = 'Pre-Comp';

    function safeCall(fn, fallback) {
        try {
            return fn();
        } catch (err) {
            return fallback;
        }
    }

    var comp = safeCall(function () { return api.getActiveComp(); }, null);
    if (!comp) {
        var comps = safeCall(function () { return api.getCompLayers ? api.getCompLayers(false) : []; }, []);
        comp = comps && comps.length ? comps[0] : null;
    }

    var selection = safeCall(function () { return api.getSelection(); }, []) || [];

    if (!selection.length) {
        var msg = 'No layer selected. Please select one or more layers to pre-compose.';
        var errOut = {
            ok: false,
            partial: false,
            effect: 'Pre-Compose',
            workflow: 'Pre-Compose',
            code: 'NO_SELECTION',
            error: msg,
            appliedCount: 0,
            failedCount: 1,
            warnings: [],
            results: [],
            preCompId: null,
            packagedCount: 0,
            packagedLayers: []
        };
        try { __result = errOut; } catch (e) {}
        if (typeof console !== 'undefined' && console.warn) {
            console.warn('AE Effects [Pre-Compose]: ' + msg);
        }
        return errOut;
    }

    // Determine sequential index
    var allComps = safeCall(function () { return api.getComps ? api.getComps() : []; }, []) || [];
    var count = 1;
    for (var i = 0; i < allComps.length; i++) {
        var cName = safeCall(function () { return api.getNiceName ? api.getNiceName(allComps[i]) : ''; }, '');
        if (cName && cName.indexOf(TAG_PRECOMP) >= 0) {
            count++;
        }
    }
    var preCompName = TAG_PRECOMP + ' ' + count;

    var initialLayers = safeCall(function () { return api.getCompLayers ? api.getCompLayers(false) : []; }, []) || [];

    // Invoke native Cavalry preCompose
    var rawPreComp = null;
    var preCompError = null;
    try {
        rawPreComp = api.preCompose(selection, preCompName);
    } catch (err) {
        try {
            rawPreComp = api.preCompose(selection);
        } catch (err2) {
            preCompError = (err2 && err2.message) ? err2.message : String(err2);
        }
    }

    // Extract identifier if returned as string or object
    var preCompRefId = null;
    if (typeof rawPreComp === 'string' && rawPreComp.length > 0) {
        preCompRefId = rawPreComp;
    } else if (rawPreComp && typeof rawPreComp === 'object' && rawPreComp.id) {
        preCompRefId = String(rawPreComp.id);
    }

    // If API returned void/undefined, discover newly created compositionReference layer
    if (!preCompRefId && !preCompError) {
        var currentSel = safeCall(function () { return api.getSelection ? api.getSelection() : []; }, []) || [];
        if (currentSel && currentSel.length === 1) {
            var lType = safeCall(function () { return api.getLayerType ? api.getLayerType(currentSel[0]) : ''; }, '');
            if (lType === 'compositionReference' || lType.indexOf('comp') >= 0) {
                preCompRefId = currentSel[0];
            }
        }
        if (!preCompRefId) {
            var afterLayers = safeCall(function () { return api.getCompLayers ? api.getCompLayers(false) : []; }, []) || [];
            for (var a = 0; a < afterLayers.length; a++) {
                var cand = afterLayers[a];
                if (initialLayers.indexOf(cand) < 0) {
                    var candType = safeCall(function () { return api.getLayerType ? api.getLayerType(cand) : ''; }, '');
                    if (candType === 'compositionReference') {
                        preCompRefId = cand;
                        break;
                    }
                }
            }
        }
    }

    // Strictly verify success
    if (!preCompRefId) {
        var failMsg = preCompError || 'Pre-compose operation failed: no compositionReference created';
        var failOut = {
            ok: false,
            partial: false,
            effect: 'Pre-Compose',
            workflow: 'Pre-Compose',
            code: 'PRECOMPOSE_FAILED',
            error: failMsg,
            appliedCount: 0,
            failedCount: selection.length,
            warnings: [],
            results: (function () {
                var arr = [];
                for (var r = 0; r < selection.length; r++) {
                    arr.push({ targetId: selection[r], ok: false, error: failMsg });
                }
                return arr;
            })(),
            preCompId: null,
            name: preCompName,
            packagedCount: 0,
            packagedLayers: selection
        };
        try { __result = failOut; } catch (e) {}
        if (typeof console !== 'undefined' && console.error) {
            console.error('AE Effects [Pre-Compose]: ' + failMsg);
        }
        return failOut;
    }

    safeCall(function () { api.select([preCompRefId]); }, null);

    var results = [];
    for (var k = 0; k < selection.length; k++) {
        results.push({ targetId: selection[k], ok: true, preCompId: preCompRefId });
    }

    var summary = {
        ok: true,
        partial: false,
        effect: 'Pre-Compose',
        workflow: 'Pre-Compose',
        code: 'SUCCESS',
        error: null,
        appliedCount: selection.length,
        failedCount: 0,
        warnings: [],
        results: results,
        preCompId: preCompRefId,
        name: preCompName,
        packagedCount: selection.length,
        packagedLayers: selection
    };

    try { __result = summary; } catch (e) {}
    if (typeof console !== 'undefined' && console.log) {
        console.log('AE Effects: Pre-Composed ' + selection.length + ' layer(s) into ' + preCompName + ' (' + preCompRefId + ')');
    }
    return summary;
})();
