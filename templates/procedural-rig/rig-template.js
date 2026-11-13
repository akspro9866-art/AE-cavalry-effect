/**
 * Cavalry Native Procedural Rig Template
 *
 * Uses Stallion `helpers: true` (`_mg` helpers available) or standalone `api` calls
 * with graceful fallback. Preserves the selected layer and tags generated rig nodes
 * for idempotent re-application.
 */
(function () {
    var RIG_CONFIG = typeof __RIG_CONFIG__ !== 'undefined'
        ? __RIG_CONFIG__
        : (typeof __EFFECT_CONFIG__ !== 'undefined' && __EFFECT_CONFIG__ ? __EFFECT_CONFIG__ : {
            effectSlug: 'procedural-rig-template',
            nodeTag: '[AE:procedural-rig-template]',
            createTestTargetIfEmpty: false
        });
    if (!RIG_CONFIG.effectSlug) RIG_CONFIG.effectSlug = 'procedural-rig-template';
    if (!RIG_CONFIG.nodeTag) RIG_CONFIG.nodeTag = '[AE:' + RIG_CONFIG.effectSlug + ']';

    function safeCall(fn, fallback) {
        try {
            return fn();
        } catch (err) {
            return fallback;
        }
    }

    var startedUndo = false;
    if (typeof api.startUndoGroup === 'function') {
        api.startUndoGroup('Apply AE Rig ' + RIG_CONFIG.effectSlug);
        startedUndo = true;
    }

    try {
        var selection = safeCall(function () { return api.getSelection(); }, []) || [];
        if (!selection.length && RIG_CONFIG.createTestTargetIfEmpty) {
            var fallback = typeof _mg !== 'undefined' && _mg && typeof _mg.rect === 'function'
                ? _mg.rect('AE Rig Target', { width: 200, height: 200 })
                : api.primitive('rectangle', 'AE Rig Target');
            api.select([fallback]);
            selection = [fallback];
        }

        if (!selection.length) {
            var emptyRes = {
                ok: false,
                effect: RIG_CONFIG.effectSlug,
                error: 'No layer selected in Cavalry. Select one or more objects before applying this rig.',
                selection: []
            };
            try { __result = emptyRes; } catch (e) {}
            return emptyRes;
        }

        // Example rig hook: inspect or wrap selected layers in your effect-specific builder
        var summary = [];
        for (var i = 0; i < selection.length; i++) {
            var targetId = selection[i];
            summary.push({
                targetId: targetId,
                targetName: safeCall(function () { return api.getNiceName(targetId); }, targetId),
                targetType: safeCall(function () { return api.getLayerType(targetId); }, 'unknown'),
                hasMgHelpers: typeof _mg !== 'undefined' && !!_mg
            });
        }

        safeCall(function () { api.select(selection); }, null);
        var okRes = {
            ok: true,
            effect: RIG_CONFIG.effectSlug,
            targets: summary
        };
        try { __result = okRes; } catch (e) {}
        return okRes;
    } finally {
        if (startedUndo && typeof api.endUndoGroup === 'function') {
            api.endUndoGroup();
        }
    }
})();
