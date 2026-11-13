/**
 * One-Action Reusable Implementation:
 * Adobe After Effects "Null Object" -> Cavalry 2.8+
 *
 * Creates a native Cavalry `null` layer, automatically calculates the visual
 * centroid of selected layers, parents them to the Null, and sets the signature
 * After Effects Null color (#F05050).
 *
 * Supports empty selection (creates Null at origin {x:0, y:0}) and verified parenting.
 */
(function () {
    var TAG_NULL = '[AE:Null]';

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

    // Determine sequential index for naming
    var existingLayers = safeCall(function () { return api.getCompLayers(false); }, []) || [];
    var count = 1;
    for (var i = 0; i < existingLayers.length; i++) {
        var n = safeCall(function () { return api.getNiceName ? api.getNiceName(existingLayers[i]) : ''; }, '');
        if (n && n.indexOf(TAG_NULL) >= 0) {
            count++;
        }
    }
    var nullName = TAG_NULL + ' Null ' + count;

    // Create native Cavalry null layer
    var nullId = safeCall(function () { return api.create('null', nullName); }, null);
    if (!nullId) {
        var createFail = {
            ok: false,
            partial: false,
            effect: 'Null Object',
            workflow: 'Null Object',
            code: 'NODE_CREATION_FAILED',
            error: 'Failed to create native Cavalry null layer',
            appliedCount: 0,
            failedCount: selection.length || 1,
            warnings: [],
            results: [],
            nullId: null,
            name: nullName,
            parentedCount: 0,
            parentedChildren: [],
            failedChildren: [],
            position: { x: 0, y: 0 }
        };
        try { __result = createFail; } catch (e) {}
        if (typeof console !== 'undefined' && console.error) {
            console.error('AE Effects [Null Object]: ' + createFail.error);
        }
        return createFail;
    }

    // After Effects signature coral red Null color
    var aeNullColor = { r: 240, g: 80, b: 80, a: 255 };
    var nullProps = {
        'nullColor': aeNullColor,
        'customColor': true
    };

    var parentedChildren = [];
    var failedChildren = [];
    var results = [];

    if (selection.length > 0) {
        var sumX = 0;
        var sumY = 0;
        var validCount = 0;

        for (var s = 0; s < selection.length; s++) {
            var childId = selection[s];
            if (childId === nullId) continue;

            // Try bounding box centre first
            var bbox = (typeof api.getBoundingBox === 'function') ? safeCall(function () { return api.getBoundingBox(childId); }, null) : null;
            if (bbox && bbox.centre && typeof bbox.centre.x === 'number' && typeof bbox.centre.y === 'number') {
                sumX += bbox.centre.x;
                sumY += bbox.centre.y;
                validCount++;
            } else {
                var pos = safeCall(function () { return api.get(childId, 'position'); }, null);
                if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
                    sumX += pos.x;
                    sumY += pos.y;
                    validCount++;
                }
            }
        }

        if (validCount > 0) {
            nullProps.position = { x: sumX / validCount, y: sumY / validCount };
        } else {
            nullProps.position = { x: 0, y: 0 };
        }

        safeCall(function () { api.set(nullId, nullProps); }, null);

        // Parent selected layers to the Null and verify
        for (var p = 0; p < selection.length; p++) {
            var targetChild = selection[p];
            if (targetChild !== nullId) {
                var parentRes = safeCall(function () { return api.parent(targetChild, nullId); }, false);
                var actualParent = safeCall(function () {
                    return typeof api.getParent === 'function' ? api.getParent(targetChild) : nullId;
                }, nullId);

                var success = (actualParent === nullId) || (parentRes === true);
                if (success) {
                    parentedChildren.push(targetChild);
                    results.push({ targetId: targetChild, ok: true, parent: nullId });
                } else {
                    failedChildren.push(targetChild);
                    results.push({ targetId: targetChild, ok: false, error: 'Parenting operation failed' });
                }
            }
        }
    } else {
        nullProps.position = { x: 0, y: 0 };
        safeCall(function () { api.set(nullId, nullProps); }, null);
    }

    // Select the new Null
    safeCall(function () { api.select([nullId]); }, null);

    var hasFailures = failedChildren.length > 0;
    var isPartial = hasFailures && parentedChildren.length > 0;

    var summary = {
        ok: !hasFailures,
        partial: isPartial,
        effect: 'Null Object',
        workflow: 'Null Object',
        code: hasFailures ? (isPartial ? 'PARTIAL_SUCCESS' : 'PARENTING_FAILED') : 'SUCCESS',
        error: hasFailures ? ('Parenting failed for ' + failedChildren.length + ' layer(s)') : null,
        appliedCount: parentedChildren.length,
        failedCount: failedChildren.length,
        warnings: [],
        results: results,
        nullId: nullId,
        name: nullName,
        parentedCount: parentedChildren.length,
        parentedChildren: parentedChildren,
        failedChildren: failedChildren,
        position: nullProps.position
    };

    try { __result = summary; } catch (e) {}
    if (typeof console !== 'undefined' && console.log) {
        console.log('AE Effects: Created Null Object (' + nullId + ') parenting ' + parentedChildren.length + ' layer(s)');
    }
    return summary;
})();
