/**
 * One-Action Reusable Implementation:
 * Adobe After Effects "Pre-Compose" -> Cavalry 2.8+
 *
 * In Adobe After Effects, Pre-Compose moves the selected layers into a new
 * nested composition, leaving a single pre-comp layer in their place.
 * In Cavalry 2.8+, this is achieved via the native `api.preCompose(layerIds, name)`
 * API, which creates a `compositionReference` referencing the new nested comp.
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
        var msg = 'AE Effects [Pre-Compose]: No layer selected. Please select one or more layers to pre-compose.';
        var errOut = { ok: false, error: msg, preCompId: null };
        try { __result = errOut; } catch (e) {}
        if (typeof console !== 'undefined' && console.warn) console.warn(msg);
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

    // Invoke native Cavalry preCompose
    var preCompRefId = null;
    try {
        preCompRefId = api.preCompose(selection, preCompName);
    } catch (err) {
        try {
            preCompRefId = api.preCompose(selection);
        } catch (err2) {
            var failOut = { ok: false, error: 'Failed to pre-compose layers: ' + err2.message };
            try { __result = failOut; } catch (e) {}
            return failOut;
        }
    }

    if (preCompRefId) {
        safeCall(function () { api.select([preCompRefId]); }, null);
    }

    var summary = {
        ok: true,
        workflow: 'Pre-Compose',
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
