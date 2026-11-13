/**
 * Cavalry JavaScript Deformer Idempotent Applicator Template
 *
 * Runs inside `script` context via Stallion / `cavalry_apply_dsl`.
 * Attaches a `javaScriptDeformer` to selected vector shapes and binds dynamic attributes
 * safely across both live Cavalry (`api.addDynamic(id, 'array', 'double')` + rename) and Stallion Mock.
 */
(function () {
    var DEFORMER_CONFIG = typeof __DEFORMER_CONFIG__ !== 'undefined'
        ? __DEFORMER_CONFIG__
        : (typeof __EFFECT_CONFIG__ !== 'undefined' && __EFFECT_CONFIG__ ? __EFFECT_CONFIG__ : {
            effectSlug: 'deformer-template',
            nodeTag: '[AE:deformer-template]',
            expression: '// deformer code',
            params: {
                aeAmount: 50
            },
            animate: null,
            createTestTargetIfEmpty: false
        });
    if (!DEFORMER_CONFIG.effectSlug) DEFORMER_CONFIG.effectSlug = 'deformer-template';
    if (!DEFORMER_CONFIG.nodeTag) DEFORMER_CONFIG.nodeTag = '[AE:' + DEFORMER_CONFIG.effectSlug + ']';
    if (!DEFORMER_CONFIG.params) DEFORMER_CONFIG.params = { aeAmount: 50 };

    function safeCall(fn, fallback) {
        try {
            return fn();
        } catch (err) {
            return fallback;
        }
    }

    function extractLayerId(connStr) {
        if (typeof connStr !== 'string' || !connStr) return '';
        var dotIdx = connStr.indexOf('.');
        return dotIdx >= 0 ? connStr.slice(0, dotIdx) : connStr;
    }

    function getConnectedDeformers(targetId) {
        var ids = [];
        var seen = {};
        function pushConn(raw) {
            var id = extractLayerId(raw);
            if (id && !seen[id]) { seen[id] = true; ids.push(id); }
        }
        if (typeof api.getInConnections === 'function') {
            var multi = safeCall(function () { return api.getInConnections(targetId, 'deformers'); }, null);
            if (Array.isArray(multi)) { for (var m = 0; m < multi.length; m++) pushConn(multi[m]); }
        }
        var inIds = safeCall(function () { return api.getInConnection(targetId, 'deformers'); }, null);
        if (Array.isArray(inIds)) { for (var k = 0; k < inIds.length; k++) pushConn(inIds[k]); }
        else if (typeof inIds === 'string' && inIds) { pushConn(inIds); }
        return ids;
    }

    function findExistingTaggedDeformer(targetId, tagPrefix) {
        var linked = getConnectedDeformers(targetId);
        for (var i = 0; i < linked.length; i++) {
            var name = safeCall(function () { return api.getNiceName(linked[i]); }, '');
            if (typeof name === 'string' && name.indexOf(tagPrefix) === 0) return linked[i];
        }
        return null;
    }

    function bindDynamicDouble(nodeId, varName, initialVal) {
        var attrs = safeCall(function () { return api.getAttributes(nodeId); }, []) || [];
        var existingCandidates = ['dynamic.' + varName, 'array.' + varName, varName];
        for (var c = 0; c < existingCandidates.length; c++) {
            if (attrs.indexOf(existingCandidates[c]) >= 0) {
                var p = {};
                p[existingCandidates[c]] = initialVal;
                if (safeCall(function () { api.set(nodeId, p); return true; }, false)) {
                    return existingCandidates[c];
                }
            }
        }

        // Check existing named array.<index> slots on live Cavalry
        for (var idx = 0; idx < 32; idx++) {
            var slot = 'array.' + idx;
            if (attrs.indexOf(slot) < 0) break;
            var customName = safeCall(function () { return api.getCustomAttributeName(nodeId, slot); }, '');
            if (customName === varName) {
                var pSlot = {};
                pSlot[slot] = initialVal;
                api.set(nodeId, pSlot);
                return slot;
            }
        }

        if (typeof api.addDynamic === 'function') {
            // Live Cavalry expects addDynamic(layerId, 'array', 'double') and returns void;
            // Stallion Mock expects addDynamic(layerId, varName, 'double') and returns 'dynamic.<varName>'.
            var nextIdx = 0;
            while (attrs.indexOf('array.' + nextIdx) >= 0) nextIdx++;
            var mockOrLive = safeCall(function () { return api.addDynamic(nodeId, 'array', 'double'); }, null);
            if (typeof mockOrLive === 'string' && mockOrLive) {
                var pMock = {};
                pMock[mockOrLive] = initialVal;
                api.set(nodeId, pMock);
                return mockOrLive;
            }
            var afterAttrs = safeCall(function () { return api.getAttributes(nodeId); }, []) || [];
            var createdSlot = 'array.' + nextIdx;
            if (afterAttrs.indexOf(createdSlot) >= 0) {
                if (typeof api.renameAttribute === 'function') {
                    safeCall(function () { api.renameAttribute(nodeId, createdSlot, varName); }, null);
                }
                var pLive = {};
                pLive[createdSlot] = initialVal;
                api.set(nodeId, pLive);
                return createdSlot;
            }
            var namedMock = safeCall(function () { return api.addDynamic(nodeId, varName, 'double'); }, null);
            if (typeof namedMock === 'string' && namedMock) {
                var pNamed = {};
                pNamed[namedMock] = initialVal;
                api.set(nodeId, pNamed);
                return namedMock;
            }
        }
        return null;
    }

    var startedUndo = false;
    if (typeof api.startUndoGroup === 'function') {
        api.startUndoGroup('Apply AE ' + DEFORMER_CONFIG.effectSlug);
        startedUndo = true;
    }

    try {
        var selection = safeCall(function () { return api.getSelection(); }, []) || [];
        var createdFallbackTarget = null;
        if (!selection.length && DEFORMER_CONFIG.createTestTargetIfEmpty) {
            createdFallbackTarget = api.primitive('rectangle', 'AE Vector Target');
            api.select([createdFallbackTarget]);
            selection = [createdFallbackTarget];
        }
        if (!selection.length) {
            var emptyRes = {
                ok: false,
                effect: DEFORMER_CONFIG.effectSlug,
                error: 'No layer selected in Cavalry. Select a shape/vector layer first.',
                selection: []
            };
            try { __result = emptyRes; } catch (e) {}
            return emptyRes;
        }

        var applied = [];
        for (var i = 0; i < selection.length; i++) {
            var targetId = selection[i];
            var targetName = safeCall(function () { return api.getNiceName(targetId); }, targetId);
            var existingId = findExistingTaggedDeformer(targetId, DEFORMER_CONFIG.nodeTag);
            var defId = existingId || api.create('javaScriptDeformer', DEFORMER_CONFIG.nodeTag + ' ' + targetName);
            if (!existingId) {
                api.connect(defId, 'id', targetId, 'deformers');
            }

            api.set(defId, { expression: DEFORMER_CONFIG.expression });

            var boundAttrs = {};
            var fallbackInlined = [];
            var keys = Object.keys(DEFORMER_CONFIG.params || {});
            for (var p = 0; p < keys.length; p++) {
                var key = keys[p];
                var attrPath = bindDynamicDouble(defId, key, DEFORMER_CONFIG.params[key]);
                if (attrPath) boundAttrs[key] = attrPath;
                else fallbackInlined.push(key);
            }

            var animatedAttr = null;
            if (DEFORMER_CONFIG.animate && DEFORMER_CONFIG.animate.param && boundAttrs[DEFORMER_CONFIG.animate.param]) {
                var animKey = boundAttrs[DEFORMER_CONFIG.animate.param];
                var kfs = DEFORMER_CONFIG.animate.keyframes || [];
                for (var k = 0; k < kfs.length; k++) {
                    if (typeof api.keyframe === 'function') {
                        var kfPayload = {};
                        kfPayload[animKey] = kfs[k].value;
                        api.keyframe(defId, kfs[k].frame, kfPayload);
                    }
                }
                animatedAttr = animKey;
            }

            applied.push({
                targetId: targetId,
                targetName: targetName,
                deformerId: defId,
                action: existingId ? 'updated' : 'created',
                boundAttrs: boundAttrs,
                fallbackInlined: fallbackInlined,
                animatedAttr: animatedAttr
            });
        }

        safeCall(function () { api.select(selection); }, null);
        var okRes = {
            ok: true,
            effect: DEFORMER_CONFIG.effectSlug,
            createdFallbackTarget: createdFallbackTarget,
            appliedCount: applied.length,
            applied: applied
        };
        try { __result = okRes; } catch (e) {}
        return okRes;
    } finally {
        if (startedUndo && typeof api.endUndoGroup === 'function') {
            api.endUndoGroup();
        }
    }
})();
