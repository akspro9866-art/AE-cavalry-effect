/**
 * One-Action Reusable Implementation:
 * Adobe After Effects "Adjustment Layer" -> Cavalry 2.8+
 *
 * In Adobe After Effects, an Adjustment Layer applies effects to all underlying layers.
 * In Cavalry 2.8+, this is achieved via an Adjustment Group (`group`) with an
 * attached filter pipeline (`filters` port), processing all child layers together.
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
    var groupId = api.create('group', adjName);

    var groupedChildren = [];
    if (selection.length > 0) {
        // Group the selected layers
        for (var s = 0; s < selection.length; s++) {
            var childId = selection[s];
            if (childId !== groupId) {
                safeCall(function () { api.parent(childId, groupId); }, false);
                groupedChildren.push(childId);
            }
        }
    } else {
        // Wrap top-level layers in comp if available
        for (var c = 0; c < existingLayers.length; c++) {
            var layerId = existingLayers[c];
            var parent = safeCall(function () { return api.getParent(layerId); }, '');
            var lType = safeCall(function () { return api.getLayerType ? api.getLayerType(layerId) : ''; }, '');
            if (!parent && layerId !== groupId && lType !== 'compNode' && lType !== 'null') {
                safeCall(function () { api.parent(layerId, groupId); }, false);
                groupedChildren.push(layerId);
            }
        }
    }

    // Attach SkSL Filter to group's filters port
    var filterId = api.create('skslFilter', TAG_FILTER + ' ' + count);
    var filterCode = 
        'uniform float Exposure;\n' +
        'uniform float Contrast;\n' +
        'half4 main(float2 fragCoord) {\n' +
        '    half4 c = layer.eval(fragCoord);\n' +
        '    half3 rgb = c.rgb * half(max(0.0, Exposure));\n' +
        '    rgb = (rgb - half(0.5)) * half(max(0.0, Contrast)) + half(0.5);\n' +
        '    return half4(rgb, c.a);\n' +
        '}';

    var slot0 = 'inputs.0';
    api.renameAttribute(filterId, slot0, 'Exposure');
    api.set(filterId, { 'inputs.0': 1.0 });

    var slot1 = api.addDynamic(filterId, 'inputs', 'double');
    api.renameAttribute(filterId, slot1, 'Contrast');
    api.set(filterId, { 'inputs.1': 1.0 });

    var liveCode = filterCode.replace(/^\s*uniform\s+(?:float|float2|half4|bool)\s+[A-Za-z0-9_]+\s*;\s*(?:\r?\n)?/gm, '');
    api.set(filterId, { code: liveCode, padding: { x: 50, y: 50 } });

    // Connect to group's filters port
    safeCall(function () { api.connect(filterId, 'id', groupId, 'filters'); }, null);

    // Select the new Adjustment Layer group
    safeCall(function () { api.select([groupId]); }, null);

    var summary = {
        ok: true,
        workflow: 'Adjustment Layer',
        groupId: groupId,
        name: adjName,
        filterId: filterId,
        groupedCount: groupedChildren.length,
        groupedChildren: groupedChildren
    };

    try { __result = summary; } catch (e) {}
    if (typeof console !== 'undefined' && console.log) {
        console.log('AE Effects: Created Adjustment Layer (' + groupId + ') with ' + groupedChildren.length + ' layer(s)');
    }
    return summary;
})();
