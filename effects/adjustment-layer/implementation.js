/**
 * One-Action Reusable Implementation:
 * Adobe After Effects "Adjustment Layer" -> Cavalry 2.8+
 *
 * In Adobe After Effects, an Adjustment Layer applies effects to all underlying layers.
 * In Cavalry 2.8+, this is achieved via an Adjustment Group (`group`) with an
 * attached filter pipeline (`filters` port), processing all child layers together.
 *
 * Supports empty selection (wraps top-level comp layers or creates an empty adjustment group).
 */
(function () {
    var TAG_ADJUSTMENT = '[AE:Adjustment Layer]';
    var TAG_FILTER = '[AE:Adjustment Filter]';

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

    // Sequential count
    var existingLayers = safeCall(function () { return api.getCompLayers(false); }, []) || [];
    var count = 1;
    for (var i = 0; i < existingLayers.length; i++) {
        var n = safeCall(function () { return api.getNiceName ? api.getNiceName(existingLayers[i]) : ''; }, '');
        if (n && n.indexOf(TAG_ADJUSTMENT) >= 0) {
            count++;
        }
    }
    var adjName = TAG_ADJUSTMENT + ' ' + count;

    // Create adjustment group
    var groupId = safeCall(function () { return api.create('group', adjName); }, null);
    if (!groupId) {
        var groupFail = {
            ok: false,
            partial: false,
            effect: 'Adjustment Layer',
            workflow: 'Adjustment Layer',
            code: 'GROUP_CREATION_FAILED',
            error: 'Failed to create native Cavalry group layer for Adjustment Layer',
            appliedCount: 0,
            failedCount: selection.length || 1,
            warnings: [],
            results: [],
            groupId: null,
            filterId: null,
            groupedCount: 0,
            groupedChildren: [],
            failedChildren: []
        };
        try { __result = groupFail; } catch (e) {}
        if (typeof console !== 'undefined' && console.error) {
            console.error('AE Effects [Adjustment Layer]: ' + groupFail.error);
        }
        return groupFail;
    }

    var targetsToGroup = [];
    if (selection.length > 0) {
        for (var s = 0; s < selection.length; s++) {
            if (selection[s] !== groupId) targetsToGroup.push(selection[s]);
        }
    } else {
        // Wrap top-level layers in comp if available
        for (var c = 0; c < existingLayers.length; c++) {
            var layerId = existingLayers[c];
            var parent = safeCall(function () { return api.getParent ? api.getParent(layerId) : ''; }, '');
            var lType = safeCall(function () { return api.getLayerType ? api.getLayerType(layerId) : ''; }, '');
            if (!parent && layerId !== groupId && lType !== 'compNode' && lType !== 'null') {
                targetsToGroup.push(layerId);
            }
        }
    }

    var groupedChildren = [];
    var failedChildren = [];
    var results = [];

    for (var t = 0; t < targetsToGroup.length; t++) {
        var childId = targetsToGroup[t];
        var parentRes = safeCall(function () { return api.parent(childId, groupId); }, false);
        var actualParent = safeCall(function () {
            return typeof api.getParent === 'function' ? api.getParent(childId) : groupId;
        }, groupId);

        var success = (actualParent === groupId) || (parentRes === true);
        if (success) {
            groupedChildren.push(childId);
            results.push({ targetId: childId, ok: true, parent: groupId });
        } else {
            failedChildren.push(childId);
            results.push({ targetId: childId, ok: false, error: 'Parenting into adjustment group failed' });
        }
    }

    // Attach SkSL Filter to group's filters port
    var filterId = safeCall(function () { return api.create('skslFilter', TAG_FILTER + ' ' + count); }, null);
    var filterCode = 
        'uniform float Exposure;\n' +
        'uniform float Contrast;\n' +
        'half4 main(float2 fragCoord) {\n' +
        '    half4 c = layer.eval(fragCoord);\n' +
        '    half3 rgb = c.rgb * half(max(0.0, Exposure));\n' +
        '    rgb = (rgb - half(0.5)) * half(max(0.0, Contrast)) + half(0.5);\n' +
        '    return half4(rgb, c.a);\n' +
        '}';

    if (filterId) {
        var slot0 = 'inputs.0';
        safeCall(function () {
            if (typeof api.renameAttribute === 'function') api.renameAttribute(filterId, slot0, 'Exposure');
            api.set(filterId, { 'inputs.0': 1.0 });
        }, null);

        var slot1 = safeCall(function () {
            return typeof api.addDynamic === 'function' ? api.addDynamic(filterId, 'inputs', 'double') : 'inputs.1';
        }, 'inputs.1');

        safeCall(function () {
            if (typeof api.renameAttribute === 'function') api.renameAttribute(filterId, slot1, 'Contrast');
            api.set(filterId, { 'inputs.1': 1.0 });
        }, null);

        var liveCode = filterCode.replace(/^\s*uniform\s+(?:float|float2|half4|bool)\s+[A-Za-z0-9_]+\s*;\s*(?:\r?\n)?/gm, '');
        safeCall(function () {
            api.set(filterId, { code: liveCode, padding: { x: 50, y: 50 } });
        }, null);

        // Connect to group's filters port
        safeCall(function () { api.connect(filterId, 'id', groupId, 'filters'); }, null);
    }

    // Select the new Adjustment Layer group
    safeCall(function () { api.select([groupId]); }, null);

    var hasFailures = failedChildren.length > 0;
    var isPartial = hasFailures && groupedChildren.length > 0;

    var summary = {
        ok: !hasFailures,
        partial: isPartial,
        effect: 'Adjustment Layer',
        workflow: 'Adjustment Layer',
        code: hasFailures ? (isPartial ? 'PARTIAL_SUCCESS' : 'GROUPING_FAILED') : 'SUCCESS',
        error: hasFailures ? ('Failed to group ' + failedChildren.length + ' layer(s)') : null,
        appliedCount: groupedChildren.length,
        failedCount: failedChildren.length,
        warnings: filterId ? [] : ['Adjustment filter node creation failed'],
        results: results,
        groupId: groupId,
        name: adjName,
        filterId: filterId,
        groupedCount: groupedChildren.length,
        groupedChildren: groupedChildren,
        failedChildren: failedChildren
    };

    try { __result = summary; } catch (e) {}
    if (typeof console !== 'undefined' && console.log) {
        console.log('AE Effects: Created Adjustment Layer (' + groupId + ') with ' + groupedChildren.length + ' layer(s)');
    }
    return summary;
})();
