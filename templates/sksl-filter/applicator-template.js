/**
 * Cavalry 2.8+ SkSL Filter Idempotent Applicator Template
 *
 * Designed to execute inside `script` context via Stallion / `cavalry_apply_dsl`.
 * Supports BOTH:
 *   1. Live Cavalry 2.8.0 `inputs.0..inputs.N` dynamic array slots (`api.addDynamic(id, 'inputs', 'double')`
 *      + `api.renameAttribute`), automatically stripping matching `uniform float <name>;` lines so Cavalry
 *      does not hit duplicate uniform redeclaration compile errors.
 *   2. Stallion Headless Mock / fallback `uniforms.<name>` and `const float <name> = ...;` baking.
 */
(function () {
    var EFFECT_CONFIG = typeof __EFFECT_CONFIG__ !== 'undefined' ? __EFFECT_CONFIG__ : {
        effectSlug: 'effect-template',
        nodeTag: '[AE:effect-template]',
        shaderSource: 'uniform shader layer;\nhalf4 main(float2 p) { return layer.eval(p); }\n',
        uniformPrefix: 'eff',
        params: {
            effAmount: 50,
            effSize: 100,
            effEvolution: 0
        },
        padding: 0, // optional `{ x, y }` or scalar px for `padding` attribute
        animate: null, // e.g. { param: 'effEvolution', keyframes: [{ frame: 0, value: 0 }, { frame: 60, value: 360 }] }
        createTestTargetIfEmpty: false
    };

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

    function getConnectedFilters(targetId) {
        var ids = [];
        var seen = {};
        function pushConn(raw) {
            if (Array.isArray(raw)) {
                for (var r = 0; r < raw.length; r++) pushConn(raw[r]);
                return;
            }
            var id = extractLayerId(raw);
            if (id && !seen[id]) { seen[id] = true; ids.push(id); }
        }
        if (typeof api.getInConnections === 'function') {
            pushConn(safeCall(function () { return api.getInConnections(targetId, 'filters'); }, null));
        }
        pushConn(safeCall(function () { return api.getInConnection(targetId, 'filters'); }, null));
        for (var k = 0; k < 16; k++) {
            var idxConn = safeCall(function () { return api.getInConnection(targetId, 'filters.' + k); }, null);
            if (idxConn) pushConn(idxConn);
        }
        if (ids.length) return ids;

        var all = safeCall(function () { return api.getCompLayers(false); }, []) || [];
        for (var i = 0; i < all.length; i++) {
            var id = all[i];
            if (safeCall(function () { return api.getLayerType(id); }, '') !== 'skslFilter') continue;
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

    function findExistingTaggedFilter(targetId, tagPrefix) {
        var linked = getConnectedFilters(targetId);
        for (var i = 0; i < linked.length; i++) {
            var name = safeCall(function () { return api.getNiceName(linked[i]); }, '');
            if (typeof name === 'string' && name.indexOf(tagPrefix) === 0) {
                return linked[i];
            }
        }
        return null;
    }

    function stripDynamicUniformDecls(shaderCode, uniformNames) {
        var out = String(shaderCode);
        for (var i = 0; i < uniformNames.length; i++) {
            var rx = new RegExp('^\\s*uniform\\s+float\\s+' + uniformNames[i] + '\\s*;\\s*(?:\\r?\\n)?', 'gm');
            out = out.replace(rx, '');
        }
        return out;
    }

    function bindInputOrUniform(nodeId, name, val, claimed) {
        var attrs = safeCall(function () { return api.getAttributes(nodeId); }, []) || [];
        var direct = ['uniforms.' + name, 'dynamic.' + name, name, 'array.' + name];
        for (var d = 0; d < direct.length; d++) {
            if (attrs.indexOf(direct[d]) >= 0) {
                var pDirect = {}; pDirect[direct[d]] = val;
                if (safeCall(function () { api.set(nodeId, pDirect); return true; }, false)) {
                    return direct[d];
                }
            }
        }

        var firstPlaceholder = null;
        var hasInputsAttr = attrs.indexOf('inputs') >= 0;
        for (var idx = 0; idx < 32; idx++) {
            var slot = 'inputs.' + idx;
            var hasSlotInAttrs = attrs.indexOf(slot) >= 0;
            var curName = typeof api.getCustomAttributeName === 'function'
                ? safeCall(function () { return api.getCustomAttributeName(nodeId, slot); }, '')
                : '';
            if (!hasSlotInAttrs && !curName) {
                if (hasInputsAttr && idx > 0) break;
                continue;
            }
            if (claimed[slot]) continue;
            if (curName === name) {
                claimed[slot] = true;
                var pReuse = {}; pReuse[slot] = val;
                api.set(nodeId, pReuse);
                return slot;
            }
            if (!firstPlaceholder && (!curName || /^n\d+$/.test(curName))) {
                firstPlaceholder = slot;
            }
        }

        if (firstPlaceholder) {
            claimed[firstPlaceholder] = true;
            if (typeof api.renameAttribute === 'function') {
                safeCall(function () { api.renameAttribute(nodeId, firstPlaceholder, name); }, null);
            }
            var pFirst = {}; pFirst[firstPlaceholder] = val;
            api.set(nodeId, pFirst);
            return firstPlaceholder;
        }

        if (typeof api.addDynamic === 'function' && hasInputsAttr) {
            var added = safeCall(function () { return api.addDynamic(nodeId, 'inputs', 'double'); }, null);
            var newSlot = (typeof added === 'string' && added.indexOf('inputs.') === 0) ? added : null;
            if (!newSlot) {
                var after = safeCall(function () { return api.getAttributes(nodeId); }, []) || [];
                for (var j = 0; j < 32; j++) {
                    var cand = 'inputs.' + j;
                    var candName = typeof api.getCustomAttributeName === 'function'
                        ? safeCall(function () { return api.getCustomAttributeName(nodeId, cand); }, '')
                        : '';
                    if ((after.indexOf(cand) >= 0 || candName) && attrs.indexOf(cand) < 0 && !claimed[cand]) {
                        newSlot = cand;
                        break;
                    }
                }
            }
            if (newSlot) {
                claimed[newSlot] = true;
                if (typeof api.renameAttribute === 'function') {
                    safeCall(function () { api.renameAttribute(nodeId, newSlot, name); }, null);
                }
                var pNew = {}; pNew[newSlot] = val;
                api.set(nodeId, pNew);
                return newSlot;
            }
        }
        return null;
    }

    function bakeUniformConstants(shaderCode, params) {
        var out = String(shaderCode);
        var keys = Object.keys(params || {});
        for (var i = 0; i < keys.length; i++) {
            var k = keys[i];
            var v = Number(params[k]);
            if (!isFinite(v)) continue;
            var rx = new RegExp('^\\s*uniform\\s+float\\s+' + k + '\\s*;', 'm');
            if (rx.test(out)) {
                out = out.replace(rx, 'const float ' + k + ' = ' + v.toFixed(6) + ';');
            }
        }
        return out;
    }

    function applyFilterToLayer(targetId, cfg) {
        var existingId = findExistingTaggedFilter(targetId, cfg.nodeTag);
        var action = existingId ? 'updated' : 'created';
        var targetName = safeCall(function () { return api.getNiceName(targetId); }, targetId);
        var filterId = existingId || api.create('skslFilter', cfg.nodeTag + ' ' + targetName);
        if (!existingId) {
            api.connect(filterId, 'id', targetId, 'filters');
        }

        var initialAttrs = safeCall(function () { return api.getAttributes(filterId); }, []) || [];
        var hasDynamicInputs = initialAttrs.indexOf('inputs') >= 0 || initialAttrs.indexOf('inputs.0') >= 0;

        if (!hasDynamicInputs) {
            api.set(filterId, { code: cfg.shaderSource });
        }

        var boundAttrs = {};
        var unboundParams = {};
        var claimed = {};
        var keys = Object.keys(cfg.params || {});
        for (var i = 0; i < keys.length; i++) {
            var pName = keys[i];
            var val = cfg.params[pName];
            var attrKey = bindInputOrUniform(filterId, pName, val, claimed);
            if (attrKey) boundAttrs[pName] = attrKey;
            else unboundParams[pName] = val;
        }

        var uniformMode = hasDynamicInputs ? 'cavalry-inputs-array' : 'dynamic-uniforms';
        if (hasDynamicInputs) {
            var liveCode = stripDynamicUniformDecls(cfg.shaderSource, Object.keys(boundAttrs));
            if (Object.keys(unboundParams).length > 0) {
                liveCode = bakeUniformConstants(liveCode, unboundParams);
                uniformMode = Object.keys(boundAttrs).length > 0 ? 'hybrid-uniforms-and-baked' : 'baked-constants';
            }
            api.set(filterId, { code: liveCode });
        } else if (Object.keys(unboundParams).length > 0) {
            api.set(filterId, { code: bakeUniformConstants(cfg.shaderSource, unboundParams) });
            uniformMode = Object.keys(boundAttrs).length > 0 ? 'hybrid-uniforms-and-baked' : 'baked-constants';
        }

        var attrsAfter = safeCall(function () { return api.getAttributes(filterId); }, []) || [];
        if (attrsAfter.indexOf('padding') >= 0 && cfg.padding !== undefined) {
            var padObj = typeof cfg.padding === 'object' && cfg.padding !== null
                ? { x: Number(cfg.padding.x) || 0, y: Number(cfg.padding.y) || 0 }
                : { x: Math.max(0, Number(cfg.padding) || 0), y: Math.max(0, Number(cfg.padding) || 0) };
            safeCall(function () { api.set(filterId, { padding: padObj }); }, null);
        }

        var animatedAttr = null;
        if (cfg.animate && cfg.animate.param && boundAttrs[cfg.animate.param] && Array.isArray(cfg.animate.keyframes)) {
            var kfAttr = boundAttrs[cfg.animate.param];
            for (var k = 0; k < cfg.animate.keyframes.length; k++) {
                var kf = cfg.animate.keyframes[k];
                if (typeof api.keyframe === 'function') {
                    var kp = {}; kp[kfAttr] = kf.value;
                    api.keyframe(filterId, kf.frame, kp);
                }
            }
            animatedAttr = kfAttr;
        }

        return {
            targetId: targetId,
            targetName: targetName,
            filterId: filterId,
            action: action,
            uniformMode: uniformMode,
            boundAttrs: boundAttrs,
            bakedParams: Object.keys(unboundParams),
            animatedAttr: animatedAttr
        };
    }

    var startedUndo = false;
    if (typeof api.startUndoGroup === 'function') {
        api.startUndoGroup('Apply AE ' + EFFECT_CONFIG.effectSlug);
        startedUndo = true;
    }

    try {
        var selection = safeCall(function () { return api.getSelection(); }, []) || [];
        var createdFallbackTarget = null;
        if (!selection.length && EFFECT_CONFIG.createTestTargetIfEmpty) {
            createdFallbackTarget = api.primitive('rectangle', 'AE Target');
            api.select([createdFallbackTarget]);
            selection = [createdFallbackTarget];
        }
        if (!selection.length) {
            var errResult = {
                ok: false,
                effect: EFFECT_CONFIG.effectSlug,
                error: 'No layer selected in Cavalry. Select one or more drawable layers (or pass createTestTargetIfEmpty: true) and run again.',
                selection: []
            };
            try { __result = errResult; } catch (e) {}
            return errResult;
        }

        var applied = [];
        for (var s = 0; s < selection.length; s++) {
            applied.push(applyFilterToLayer(selection[s], EFFECT_CONFIG));
        }

        safeCall(function () { api.select(selection); }, null);

        var okResult = {
            ok: true,
            effect: EFFECT_CONFIG.effectSlug,
            createdFallbackTarget: createdFallbackTarget,
            appliedCount: applied.length,
            applied: applied
        };
        try { __result = okResult; } catch (e) {}
        return okResult;
    } finally {
        if (startedUndo && typeof api.endUndoGroup === 'function') {
            api.endUndoGroup();
        }
    }
})();
