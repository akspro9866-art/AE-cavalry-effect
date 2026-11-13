/**
 * Cavalry JavaScript Modifier / Utility Idempotent Applicator Template
 *
 * Runs inside `script` context via Stallion / `cavalry_apply_dsl`.
 * Creates or updates a JavaScript utility/modifier node and drives a target attribute
 * on every selected Cavalry layer without replacing the selected object.
 */
(function () {
    var MODIFIER_CONFIG = typeof __MODIFIER_CONFIG__ !== 'undefined'
        ? __MODIFIER_CONFIG__
        : (typeof __EFFECT_CONFIG__ !== 'undefined' && __EFFECT_CONFIG__ ? __EFFECT_CONFIG__ : {
            effectSlug: 'modifier-template',
            nodeTag: '[AE:modifier-template]',
            preferredNodeTypes: ['javaScript', 'javaScriptModifier'],
            targetAttr: 'position.x',
            expression: 'var v = typeof baseVal !== "undefined" ? baseVal : 0;\nv;\n',
            params: {
                baseVal: 0
            },
            wireFrameNode: false,
            createTestTargetIfEmpty: false
        });
    if (!MODIFIER_CONFIG.effectSlug) MODIFIER_CONFIG.effectSlug = 'modifier-template';
    if (!MODIFIER_CONFIG.nodeTag) MODIFIER_CONFIG.nodeTag = '[AE:' + MODIFIER_CONFIG.effectSlug + ']';
    if (!MODIFIER_CONFIG.preferredNodeTypes) MODIFIER_CONFIG.preferredNodeTypes = ['javaScript', 'javaScriptModifier'];
    if (!MODIFIER_CONFIG.targetAttr) MODIFIER_CONFIG.targetAttr = 'position.x';
    if (!MODIFIER_CONFIG.expression) MODIFIER_CONFIG.expression = 'var v = typeof baseVal !== "undefined" ? baseVal : 0;\nv;\n';
    if (!MODIFIER_CONFIG.params) MODIFIER_CONFIG.params = { baseVal: 0 };

    function safeCall(fn, fallback) {
        try {
            return fn();
        } catch (err) {
            return fallback;
        }
    }

    function createFirstSupportedNode(typeCandidates, name) {
        for (var i = 0; i < typeCandidates.length; i++) {
            var nodeType = typeCandidates[i];
            var created = safeCall(function () {
                return api.create(nodeType, name);
            }, null);
            if (created) {
                return { id: created, nodeType: nodeType };
            }
        }
        return null;
    }

    function extractLayerId(connStr) {
        if (typeof connStr !== 'string' || !connStr) return '';
        var dotIdx = connStr.indexOf('.');
        return dotIdx >= 0 ? connStr.slice(0, dotIdx) : connStr;
    }

    function findExistingTaggedDriver(targetId, targetAttr, tagPrefix) {
        var ids = [];
        if (typeof api.getInConnections === 'function') {
            var multi = safeCall(function () { return api.getInConnections(targetId, targetAttr); }, null);
            if (Array.isArray(multi)) ids = ids.concat(multi);
        }
        var inConn = safeCall(function () { return api.getInConnection(targetId, targetAttr); }, null);
        if (Array.isArray(inConn)) ids = ids.concat(inConn);
        else if (inConn) ids.push(inConn);
        for (var i = 0; i < ids.length; i++) {
            var layerId = extractLayerId(ids[i]);
            if (!layerId) continue;
            var nice = safeCall(function () { return api.getNiceName(layerId); }, '');
            if (typeof nice === 'string' && nice.indexOf(tagPrefix) === 0) return layerId;
        }
        return null;
    }

    function bindDynamicDouble(nodeId, varName, initialVal) {
        var attrs = safeCall(function () { return api.getAttributes(nodeId); }, []) || [];
        var candidates = ['dynamic.' + varName, 'array.' + varName, varName];
        for (var c = 0; c < candidates.length; c++) {
            if (attrs.indexOf(candidates[c]) >= 0) {
                var payload = {};
                payload[candidates[c]] = initialVal;
                api.set(nodeId, payload);
                return candidates[c];
            }
        }
        for (var idx = 0; idx < 32; idx++) {
            var slot = 'array.' + idx;
            if (attrs.indexOf(slot) < 0) break;
            if (safeCall(function () { return api.getCustomAttributeName(nodeId, slot); }, '') === varName) {
                var p = {};
                p[slot] = initialVal;
                api.set(nodeId, p);
                return slot;
            }
        }
        if (typeof api.addDynamic === 'function') {
            var nextIdx = 0;
            while (attrs.indexOf('array.' + nextIdx) >= 0) nextIdx++;
            var res = safeCall(function () { return api.addDynamic(nodeId, 'array', 'double'); }, null);
            if (typeof res === 'string' && res) {
                var pMock = {};
                pMock[res] = initialVal;
                api.set(nodeId, pMock);
                return res;
            }
            var after = safeCall(function () { return api.getAttributes(nodeId); }, []) || [];
            var slotKey = 'array.' + nextIdx;
            if (after.indexOf(slotKey) >= 0) {
                if (typeof api.renameAttribute === 'function') {
                    safeCall(function () { api.renameAttribute(nodeId, slotKey, varName); }, null);
                }
                var pLive = {};
                pLive[slotKey] = initialVal;
                api.set(nodeId, pLive);
                return slotKey;
            }
        }
        return null;
    }

    var startedUndo = false;
    if (typeof api.startUndoGroup === 'function') {
        api.startUndoGroup('Apply AE ' + MODIFIER_CONFIG.effectSlug);
        startedUndo = true;
    }

    try {
        var selection = safeCall(function () { return api.getSelection(); }, []) || [];
        if (!selection.length && MODIFIER_CONFIG.createTestTargetIfEmpty) {
            var fallback = api.primitive('rectangle', 'AE Target');
            api.select([fallback]);
            selection = [fallback];
        }
        if (!selection.length) {
            var err = {
                ok: false,
                effect: MODIFIER_CONFIG.effectSlug,
                error: 'No layer selected in Cavalry. Select a target layer first.',
                selection: []
            };
            try { __result = err; } catch (e) {}
            return err;
        }

        var applied = [];
        for (var i = 0; i < selection.length; i++) {
            var targetId = selection[i];
            var targetName = safeCall(function () { return api.getNiceName(targetId); }, targetId);
            var existingId = findExistingTaggedDriver(targetId, MODIFIER_CONFIG.targetAttr, MODIFIER_CONFIG.nodeTag);
            var nodeType = existingId ? safeCall(function () { return api.getLayerType(existingId); }, '') : '';
            var nodeId = existingId;
            if (!nodeId) {
                var created = createFirstSupportedNode(
                    MODIFIER_CONFIG.preferredNodeTypes,
                    MODIFIER_CONFIG.nodeTag + ' ' + targetName
                );
                if (!created) {
                    throw new Error('Could not create any node from preferredNodeTypes: ' + MODIFIER_CONFIG.preferredNodeTypes.join(', '));
                }
                nodeId = created.id;
                nodeType = created.nodeType;
                api.connect(nodeId, 'id', targetId, MODIFIER_CONFIG.targetAttr);
            }

            api.set(nodeId, { expression: MODIFIER_CONFIG.expression });
            var bound = {};
            var paramKeys = Object.keys(MODIFIER_CONFIG.params || {});
            for (var k = 0; k < paramKeys.length; k++) {
                var key = paramKeys[k];
                var slot = bindDynamicDouble(nodeId, key, MODIFIER_CONFIG.params[key]);
                if (slot) bound[key] = slot;
            }

            applied.push({
                targetId: targetId,
                targetName: targetName,
                driverId: nodeId,
                driverType: nodeType,
                targetAttr: MODIFIER_CONFIG.targetAttr,
                action: existingId ? 'updated' : 'created',
                boundAttrs: bound
            });
        }

        safeCall(function () { api.select(selection); }, null);
        var ok = {
            ok: true,
            effect: MODIFIER_CONFIG.effectSlug,
            appliedCount: applied.length,
            applied: applied
        };
        try { __result = ok; } catch (e) {}
        return ok;
    } finally {
        if (startedUndo && typeof api.endUndoGroup === 'function') {
            api.endUndoGroup();
        }
    }
})();
