/* @@HEADER_COMMENT@@ */
(function () {
    var DEFAULT_LIBRARY_ROOT = /* @@DEFAULT_LIBRARY_ROOT@@ */;
    var EXCLUDED_STATUSES = { draft: true, failed: true, disabled: true, deprecated: true, broken: true };

    // Shared helper runtime. The bundled effect runners each previously re-declared
    // their own copies of generic helpers (safeCall, clampNum, setAttrValue,
    // bindDynamicSlot); the generator now hoists the byte-identical variants into
    // this single object and each runner binds them with one alias line
    // (see scripts/sync-cavalry-script.mjs — variant-keyed, behavior-preserving).
    // Hot-reloaded disk runners compile raw implementation sources that carry their
    // own inline helpers and do not depend on this object.
    var __AE_SHARED__ = (function () {
        function createSafeCall(tag) {
            return function safeCall(fn, fallback) {
                try {
                    return fn();
                } catch (err) {
                    if (typeof globalThis !== 'undefined' && globalThis.AE_EFFECTS_DEBUG && typeof console !== 'undefined' && console.warn) {
                        console.warn(tag + ' call failed: ' + (err && err.message ? err.message : err));
                    }
                    return fallback;
                }
            };
        }

        function clampNum(v, lo, hi, fb) {
            var n = Number(v);
            if (!isFinite(n)) return fb;
            return n < lo ? lo : (n > hi ? hi : n);
        }

        /* @@SHARED_VARIANTS@@ */

        return {
            createSafeCall: createSafeCall,
            clampNum: clampNum
            /* @@SHARED_EXPORTS@@ */
        };
    })();

    var BUNDLED_EFFECTS = /* @@BUNDLED_EFFECTS@@ */;
    var BUNDLED_MTIMES = /* @@BUNDLED_MTIMES@@ */;

    var BUNDLED_RUNNERS = {
/* @@BUNDLED_RUNNERS@@ */
    };

    var activeEffects = BUNDLED_EFFECTS.slice();
    var activeRunners = {};
    var runnerMtimes = {};
    for (var rKey in BUNDLED_RUNNERS) {
        if (Object.prototype.hasOwnProperty.call(BUNDLED_RUNNERS, rKey)) {
            activeRunners[rKey] = BUNDLED_RUNNERS[rKey];
            if (Object.prototype.hasOwnProperty.call(BUNDLED_MTIMES, rKey)) {
                runnerMtimes[rKey] = BUNDLED_MTIMES[rKey];
            }
        }
    }

    var libraryRoot = DEFAULT_LIBRARY_ROOT;
    var registryPath = DEFAULT_LIBRARY_ROOT + '/effect-registry.json';
    var lastRegistryMtime = /* @@REGISTRY_MTIME@@ */;
    var isApplying = false;

    var safeCall = __AE_SHARED__.createSafeCall('[AE:Panel]');

    function getThemeHex(key, fallback) {
        var c = safeCall(function () {
            return typeof ui !== 'undefined' && typeof ui.getThemeColor === 'function' ? ui.getThemeColor(key) : '';
        }, '');
        return c || fallback;
    }

    function compileRunnerFromSource(sourceCode) {
        return new Function(
            '__EFFECT_CONFIG__',
            'var __DEFORMER_CONFIG__ = __EFFECT_CONFIG__;\n' +
            'var __MODIFIER_CONFIG__ = __EFFECT_CONFIG__;\n' +
            'var __RIG_CONFIG__ = __EFFECT_CONFIG__;\n' +
            'var __result = null;\n' +
            sourceCode + '\n' +
            'return __result;\n'
        );
    }

    function inferModesFromRegistryEntry(entry) {
        var modes = ['auto'];
        var artifacts = (entry && entry.artifacts) || {};
        var primary = String((entry && entry.primaryStrategy) || '').toLowerCase();
        var secondary = String((entry && entry.secondaryStrategy) || '').toLowerCase();
        if (artifacts.sksl || primary.indexOf('sksl') >= 0) modes.push('sksl');
        if (artifacts.deformer || primary.indexOf('deformer') >= 0 || secondary.indexOf('deformer') >= 0) modes.push('deformer');
        if (artifacts.modifier || primary.indexOf('modifier') >= 0 || secondary.indexOf('modifier') >= 0) modes.push('modifier');
        if (artifacts.rig || primary.indexOf('rig') >= 0 || secondary.indexOf('rig') >= 0) modes.push('rig');
        return modes;
    }

    function syncCatalogFromDisk(forceReloadScripts) {
        if (typeof api === 'undefined' || typeof api.filePathExists !== 'function' || typeof api.readFromFile !== 'function') {
            return { reloaded: false, reason: 'file-api-unavailable' };
        }
        if (!api.filePathExists(registryPath)) {
            return { reloaded: false, reason: 'registry-missing' };
        }
        var currentMtime = typeof api.getFileModifiedDate === 'function'
            ? safeCall(function () { return api.getFileModifiedDate(registryPath); }, null)
            : null;
        if (!forceReloadScripts && lastRegistryMtime !== null && currentMtime === lastRegistryMtime) {
            return { reloaded: false, reason: 'unchanged' };
        }

        var rawJson = safeCall(function () { return api.readFromFile(registryPath); }, '');
        if (!rawJson) return { reloaded: false, reason: 'empty-registry' };
        var parsed = safeCall(function () { return JSON.parse(rawJson); }, null);
        if (!parsed || !parsed.effects) return { reloaded: false, reason: 'invalid-registry' };

        var parsedRoot = String(parsed.libraryRoot || '').replace(/\\/g, '/');
        if (!parsedRoot || parsedRoot === '.') {
            var slashIdx = registryPath.lastIndexOf('/');
            libraryRoot = slashIdx >= 0 ? registryPath.substring(0, slashIdx) : '.';
        } else {
            libraryRoot = parsedRoot;
        }
        lastRegistryMtime = currentMtime;

        var nextEffects = [];
        var effectsMap = parsed.effects;
        for (var slug in effectsMap) {
            if (!Object.prototype.hasOwnProperty.call(effectsMap, slug)) continue;
            var entry = effectsMap[slug] || {};
            var st = String(entry.status || 'draft').toLowerCase();
            if (EXCLUDED_STATUSES[st]) continue;
            var rel = String(entry.entryScript || '').replace(/\\/g, '/');
            if (!rel) continue;
            var scriptPath = libraryRoot + '/' + rel;

            var diskMtime = typeof api.getFileModifiedDate === 'function'
                ? safeCall(function () { return api.getFileModifiedDate(scriptPath); }, null)
                : null;
            var needsLoad = !activeRunners[slug] || forceReloadScripts || (diskMtime !== null && runnerMtimes[slug] !== diskMtime);
            if (needsLoad && api.filePathExists(scriptPath)) {
                var diskSource = safeCall(function () { return api.readFromFile(scriptPath); }, '');
                if (diskSource) {
                    var compiled = safeCall(function () { return compileRunnerFromSource(diskSource); }, null);
                    if (compiled) {
                        activeRunners[slug] = compiled;
                        runnerMtimes[slug] = diskMtime;
                    }
                }
            }
            if (!activeRunners[slug]) continue;

            nextEffects.push({
                slug: slug,
                aeName: entry.aeName || slug,
                aeMatchName: entry.aeMatchName || '',
                category: entry.aeCategory || 'Effects',
                version: entry.version || '1.0.0',
                status: entry.status || 'verified',
                primaryStrategy: entry.primaryStrategy || 'script',
                modes: inferModesFromRegistryEntry(entry),
                metadata: entry.metadata || {},
                aliases: entry.aliases || [],
                entryScript: rel,
                description: ''
            });
        }

        nextEffects.sort(function (a, b) {
            var cmp = String(a.category).localeCompare(String(b.category));
            return cmp !== 0 ? cmp : String(a.aeName).localeCompare(String(b.aeName));
        });

        activeEffects = nextEffects;
        return { reloaded: true, count: nextEffects.length };
    }

    function modeOptionFromLabel(label) {
        if (label === 'SkSL Filter') return 'sksl';
        if (label === 'Vector Deformer') return 'deformer';
        return 'auto';
    }

    function resolveEffectMode(item, requestedMode) {
        if (requestedMode === 'auto') return 'auto';
        if (item.modes && item.modes.indexOf(requestedMode) >= 0) return requestedMode;
        return 'auto';
    }

    function describeSelection(sel) {
        if (!sel || !sel.length) return 'Selected: None — select layer(s) in Scene';
        if (sel.length === 1) {
            var id = sel[0];
            var name = safeCall(function () { return api.getNiceName(id); }, id);
            var type = safeCall(function () { return api.getLayerType(id); }, 'layer');
            return 'Selected: ' + name + ' (' + type + ')';
        }
        return 'Selected: ' + sel.length + ' layers ready';
    }

    // Initial disk check (hot-picks up any newly verified effects added since panel generation)
    syncCatalogFromDisk(false);

    // --- UI Setup ---
    var textColor = getThemeHex('Text', '#e6e6e6');
    var accentColor = getThemeHex('Accent1', '#2fcd71');
    var warnColor = '#e8b84b';
    var errColor = '#ff6b6b';
    var mutedColor = '#9aa4b2';

    ui.setTitle('AE Effects');
    ui.setMargins(8, 8, 8, 8);
    ui.setSpaceBetween(6);

    var rootLayout = new ui.VLayout();
    rootLayout.setSpaceBetween(6);

    // Header row
    var headerRow = new ui.HLayout();
    headerRow.setSpaceBetween(6);
    var titleLabel = new ui.Label('AE Effects (' + activeEffects.length + ')');
    titleLabel.setFontSize(13);
    titleLabel.setTextColor(textColor);
    var refreshBtn = new ui.Button('Refresh');
    refreshBtn.setFixedWidth(68);
    refreshBtn.setFixedHeight(24);
    refreshBtn.setToolTip('Reload verified AE effects from effect-registry.json');
    headerRow.add(titleLabel);
    headerRow.addStretch();
    headerRow.add(refreshBtn);
    rootLayout.add(headerRow);

    // Live Selection Banner
    var selectionLabel = new ui.Label(describeSelection(safeCall(function () { return api.getSelection(); }, []) || []));
    selectionLabel.setFontSize(11);
    selectionLabel.setTextColor(mutedColor);
    rootLayout.add(selectionLabel);

    // Mode + Animate Strip
    var controlsRow = new ui.HLayout();
    controlsRow.setSpaceBetween(6);
    var modeLabel = new ui.Label('Mode:');
    modeLabel.setFontSize(11);
    var modeDropDown = new ui.DropDown();
    modeDropDown.addEntry('Auto (Best)');
    modeDropDown.addEntry('SkSL Filter');
    modeDropDown.addEntry('Vector Deformer');
    modeDropDown.setValue(0);
    modeDropDown.setFixedHeight(24);
    modeDropDown.setToolTip('Choose execution strategy when an effect supports multiple Cavalry modes');

    var animCheckbox = new ui.Checkbox(false);
    var animLabel = new ui.Label('Anim Evo');
    animLabel.setFontSize(11);
    animLabel.setToolTip('Keyframes Evolution 0 -> 360 across frames 0 -> 60 when supported');

    controlsRow.add(modeLabel, modeDropDown);
    controlsRow.addStretch();
    controlsRow.add(animCheckbox, animLabel);
    rootLayout.add(controlsRow);

    // Search Filter
    var searchInput = new ui.LineEdit();
    searchInput.setPlaceholder('Search AE effects (click any effect to apply)...');
    searchInput.setFixedHeight(24);
    rootLayout.add(searchInput);

    // Scrollable Effects Catalog
    var cardsLayout = new ui.VLayout();
    cardsLayout.setSpaceBetween(4);
    cardsLayout.setMargins(2, 2, 2, 2);

    var scrollView = new ui.ScrollView();
    scrollView.setLayout(cardsLayout);
    rootLayout.add(scrollView);

    // Status Bar
    var statusLabel = new ui.Label('Ready — select layer(s) and click any effect to apply.');
    statusLabel.setFontSize(11);
    statusLabel.setTextColor(mutedColor);
    rootLayout.add(statusLabel);

    function setStatus(msg, colorHex) {
        statusLabel.setText(msg);
        statusLabel.setToolTip(msg);
        if (colorHex) statusLabel.setTextColor(colorHex);
    }

    function updateSelectionBanner() {
        var sel = safeCall(function () { return api.getSelection(); }, []) || [];
        selectionLabel.setText(describeSelection(sel));
        selectionLabel.setTextColor(sel.length ? accentColor : mutedColor);
        return sel;
    }

    function applyEffect(item) {
        if (isApplying) return null;
        isApplying = true;
        try {
            syncCatalogFromDisk(false);
            var runner = activeRunners[item.slug];
            if (!runner) {
                setStatus('Effect "' + item.aeName + '" runner unavailable. Click Refresh.', errColor);
                return { ok: false, error: 'Missing runner for ' + item.slug };
            }

            var meta = item.metadata || {};
            var requiresSelection = !(meta.requiresSelection === false || meta.supportsEmptySelection === true);
            var sel = updateSelectionBanner();
            if (requiresSelection && !sel.length) {
                setStatus('Select at least 1 layer in the Scene before clicking "' + item.aeName + '".', warnColor);
                console.warn('AE Effects [' + item.aeName + ']: No layer selected.');
                return { ok: false, code: 'NO_SELECTION', error: 'No layer selected' };
            }

            var requestedMode = modeOptionFromLabel(modeDropDown.getText());
            var resolvedMode = resolveEffectMode(item, requestedMode);
            var cfg = {
                mode: resolvedMode,
                params: {},
                createTestTargetIfEmpty: false
            };
            if (animCheckbox.getValue()) {
                cfg.animateEvolution = { startFrame: 0, endFrame: 60, startValue: 0, endValue: 360 };
            }

            var startedUndo = false;
            if (typeof api.startUndoGroup === 'function') {
                api.startUndoGroup('AE Effect: ' + item.aeName);
                startedUndo = true;
            }
            var res;
            try {
                res = runner(cfg);
            } finally {
                if (startedUndo && typeof api.endUndoGroup === 'function') {
                    api.endUndoGroup();
                }
            }

            updateSelectionBanner();

            if (res && res.ok) {
                var count = res.appliedCount !== undefined ? res.appliedCount : (Array.isArray(res.applied) ? res.applied.length : (Array.isArray(res.results) ? res.results.length : 1));
                var first = (Array.isArray(res.applied) && res.applied[0]) || (Array.isArray(res.results) && res.results[0]) || {};
                var mech = first.mechanism || first.driverType || res.workflow || item.primaryStrategy;
                var act = first.action || 'applied';
                var warnSuffix = Array.isArray(res.warnings) && res.warnings.length
                    ? ' (' + res.warnings.length + ' warning' + (res.warnings.length === 1 ? '' : 's') + ')'
                    : '';
                var msg = 'Applied ' + item.aeName + ' (' + mech + ') to ' + count + ' layer' + (count === 1 ? '' : 's') + ' [' + act + ']' + warnSuffix;
                setStatus(msg, accentColor);
                console.log('AE Effects: ' + msg);
                if (Array.isArray(res.warnings) && res.warnings.length) {
                    console.warn('AE Effects warnings: ' + res.warnings.join(' | '));
                }
            } else if (res && res.partial) {
                var partMsg = 'Partially applied ' + item.aeName + ': ' + (res.appliedCount || 0) + ' succeeded, ' + (res.failedCount || 0) + ' failed.';
                setStatus(partMsg, warnColor);
                console.warn('AE Effects [' + item.aeName + ']: ' + partMsg);
            } else {
                var errMsg = (res && res.error) ? res.error : 'Failed to apply ' + item.aeName;
                setStatus(errMsg, warnColor);
                console.warn('AE Effects [' + item.aeName + ']: ' + errMsg);
            }
            return res;
        } catch (err) {
            var crashMsg = 'Error applying ' + item.aeName + ': ' + (err && err.message ? err.message : String(err));
            setStatus(crashMsg, errColor);
            console.error(crashMsg);
            return { ok: false, error: crashMsg };
        } finally {
            isApplying = false;
        }
    }

    function buildEffectRows() {
        cardsLayout.clear();
        var query = String(searchInput.getText() || '').trim().toLowerCase();
        titleLabel.setText('AE Effects (' + activeEffects.length + ')');

        var filtered = [];
        for (var i = 0; i < activeEffects.length; i++) {
            var e = activeEffects[i];
            if (!query) {
                filtered.push(e);
                continue;
            }
            var aliasStr = Array.isArray(e.aliases) ? e.aliases.join(' ') : '';
            var hay = (e.aeName + ' ' + e.slug + ' ' + e.category + ' ' + e.aeMatchName + ' ' + aliasStr + ' ' + (e.description || '')).toLowerCase();
            if (hay.indexOf(query) >= 0) filtered.push(e);
        }

        if (!filtered.length) {
            var emptyLbl = new ui.Label(query ? 'No effects matching "' + query + '".' : 'No verified AE effects registered yet.');
            emptyLbl.setTextColor(mutedColor);
            emptyLbl.setAlignment(1);
            cardsLayout.add(emptyLbl);
            cardsLayout.addStretch();
            return;
        }

        var lastCat = null;
        for (var j = 0; j < filtered.length; j++) {
            (function (item) {
                if (item.category !== lastCat) {
                    lastCat = item.category;
                    var catLbl = new ui.Label(String(item.category).toUpperCase());
                    catLbl.setFontSize(10);
                    catLbl.setTextColor(mutedColor);
                    cardsLayout.add(catLbl);
                }

                var btnText = '  ' + item.aeName + '   [' + item.primaryStrategy + ']';
                var btn = new ui.Button(btnText);
                btn.setFixedHeight(28);
                btn.setFontSize(12);
                btn.setToolTip(
                    item.aeName + ' v' + item.version + ' (' + item.status + ')\n' +
                    'Click to apply directly to selected layer(s) in Cavalry.\n' +
                    (item.modes ? 'Modes: ' + item.modes.join(', ') : '')
                );
                btn.onClick = function () {
                    applyEffect(item);
                };
                cardsLayout.add(btn);
            })(filtered[j]);
        }

        cardsLayout.addStretch();
    }

    searchInput.onValueChanged = function () {
        buildEffectRows();
    };

    refreshBtn.onClick = function () {
        var syncRes = syncCatalogFromDisk(true);
        buildEffectRows();
        if (syncRes.reloaded) {
            setStatus('Synced ' + syncRes.count + ' verified effect(s) from library.', accentColor);
        } else if (syncRes.reason === 'registry-missing') {
            setStatus('Catalog ready: ' + activeEffects.length + ' bundled effects (standalone mode).', mutedColor);
        } else {
            setStatus('Catalog up to date (' + activeEffects.length + ' effect(s)).', mutedColor);
        }
    };

    var callbackObj = {
        onSelectionChanged: function () {
            if (isApplying) return;
            updateSelectionBanner();
            var syncRes = syncCatalogFromDisk(false);
            if (syncRes.reloaded) {
                buildEffectRows();
                setStatus('Synced ' + syncRes.count + ' effect(s) from disk library.', accentColor);
            }
        }
    };
    ui.addCallbackObject(callbackObj);

    buildEffectRows();
    updateSelectionBanner();
    ui.add(rootLayout);
    ui.show();
})();
