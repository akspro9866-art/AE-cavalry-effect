import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { syncCavalryScript, resolveCavalryScriptsDir } from '../scripts/sync-cavalry-script.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CAVALRY_MCP_STALLION_URL = pathToFileURL('C:/Users/khada/cavalry-mcp/dist/bridge/stallion.js').href;

function makeTempLibraryCopy() {
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ae-cavalry-panel-'));
    const scriptsDir = path.join(tmpRoot, 'CavalryScripts');
    const libDir = path.join(tmpRoot, 'library');

    fs.mkdirSync(path.join(libDir, 'effects', 'turbulent-displace'), { recursive: true });
    for (const file of ['implementation.js', 'parameter-map.json', 'turbulent-displace.sksl', 'turbulent-displace.deformer.js']) {
        fs.copyFileSync(
            path.join(ROOT, 'effects', 'turbulent-displace', file),
            path.join(libDir, 'effects', 'turbulent-displace', file)
        );
    }

    const baseReg = JSON.parse(fs.readFileSync(path.join(ROOT, 'effect-registry.json'), 'utf8'));
    baseReg.libraryRoot = libDir.replace(/\\/g, '/');
    baseReg.effects = {
        'turbulent-displace': baseReg.effects['turbulent-displace']
    };
    fs.writeFileSync(path.join(libDir, 'effect-registry.json'), JSON.stringify(baseReg, null, 2), 'utf8');
    return { tmpRoot, scriptsDir, libDir };
}

function createMockCavalryUiHarness({ startSelection = [] } = {}) {
    const nodes = new Map([
        ['basicShape#1', { type: 'basicShape', niceName: 'Title Plate', attrs: { filters: null, deformers: null }, inConns: { 'filters.0': '', 'deformers.0': '' } }],
        ['textShape#1', { type: 'textShape', niceName: 'Hero Title', attrs: { filters: null, deformers: null }, inConns: { 'filters.0': '', 'deformers.0': '' } }],
    ]);
    let selection = startSelection.slice();
    let nextSeq = 10;
    const keyframes = [];
    const callbacks = [];

    const api = {
        getSelection: () => selection.slice(),
        select: (ids) => {
            selection = (ids || []).slice();
            for (const cb of callbacks) cb.onSelectionChanged?.();
        },
        getLayerType: (id) => nodes.get(id)?.type ?? '',
        getNiceName: (id) => nodes.get(id)?.niceName ?? id,
        create: (type, name) => {
            const id = `${type}#${nextSeq++}`;
            if (type === 'skslFilter') {
                nodes.set(id, {
                    type,
                    niceName: name,
                    attrs: { inputs: null, 'inputs.0': 0, code: '', padding: { x: 0, y: 0 } },
                    customNames: { 'inputs.0': 'n0' },
                    nextIdx: 1,
                });
            } else if (type === 'javaScriptDeformer') {
                nodes.set(id, {
                    type,
                    niceName: name,
                    attrs: { array: null, 'array.0': 0, expression: '' },
                    customNames: { 'array.0': 'n0' },
                    nextIdx: 1,
                });
            } else {
                nodes.set(id, { type, niceName: name, attrs: {}, inConns: {} });
            }
            return id;
        },
        deleteLayer: (id) => nodes.delete(id),
        connect: (srcId, _srcAttr, dstId, dstAttr) => {
            const dst = nodes.get(dstId);
            if (!dst) throw new Error(`Missing target ${dstId}`);
            dst.inConns[`${dstAttr}.0`] = `${srcId}.id`;
        },
        getInConnection: (id, attr) => {
            const conns = nodes.get(id)?.inConns;
            if (!conns) return '';
            return conns[attr] || conns[`${attr}.0`] || '';
        },
        getOutConnections: () => [],
        getCompLayers: () => [...nodes.keys()],
        getAttributes: (id) => Object.keys(nodes.get(id)?.attrs ?? {}).filter((k) => !/^(inputs|array)\.\d+$/.test(k)),
        getCustomAttributeName: (id, slot) => nodes.get(id)?.customNames?.[slot] ?? '',
        renameAttribute: (id, slot, newName) => { nodes.get(id).customNames[slot] = newName; },
        addDynamic: (id, arrAttr) => {
            const n = nodes.get(id);
            const slot = `${arrAttr}.${n.nextIdx++}`;
            n.attrs[slot] = 0;
            n.customNames[slot] = '';
            return slot;
        },
        set: (id, props) => Object.assign(nodes.get(id).attrs, props),
        keyframe: (id, frame, props) => keyframes.push({ id, frame, props }),
        filePathExists: (p) => fs.existsSync(p),
        readFromFile: (p) => fs.readFileSync(p, 'utf8'),
        getFileModifiedDate: (p) => Math.floor(fs.statSync(p).mtimeMs / 1000) * 1000,
    };

    const panel = { title: '', shown: false, widgets: [] };
    class BaseWidget {
        constructor() { this.enabled = true; this.toolTip = ''; }
        setFixedWidth() {}
        setFixedHeight() {}
        setFontSize() {}
        setAlignment() {}
        setToolTip(t) { this.toolTip = t; }
        setTextColor() {}
        setPlaceholder() {}
    }
    class Label extends BaseWidget {
        constructor(t = '') { super(); this.text = t; }
        setText(t) { this.text = String(t); }
    }
    class Button extends BaseWidget {
        constructor(t = '') { super(); this.text = t; this.onClick = null; }
        setText(t) { this.text = String(t); }
        click() { return this.onClick ? this.onClick() : undefined; }
    }
    class LineEdit extends BaseWidget {
        constructor() { super(); this.text = ''; this.onValueChanged = null; }
        getText() { return this.text; }
        setText(t) { this.text = String(t); }
    }
    class DropDown extends BaseWidget {
        constructor() { super(); this.entries = []; this.index = 0; }
        addEntry(t) { this.entries.push(t); }
        setValue(i) { this.index = i; }
        getText() { return this.entries[this.index] || ''; }
    }
    class Checkbox extends BaseWidget {
        constructor(v = false) { super(); this.val = !!v; }
        getValue() { return this.val; }
        setValue(v) { this.val = !!v; }
    }
    class Layout {
        constructor() { this.items = []; }
        add(...w) { this.items.push(...w); panel.widgets.push(...w); }
        addStretch() {}
        addSpacing() {}
        setSpaceBetween() {}
        setMargins() {}
        clear() { this.items = []; }
    }
    class ScrollView extends BaseWidget {
        constructor() { super(); this.layout = null; }
        setLayout(l) { this.layout = l; panel.scrollLayout = l; }
    }

    const ui = {
        Button,
        Label,
        LineEdit,
        DropDown,
        Checkbox,
        VLayout: Layout,
        HLayout: Layout,
        ScrollView,
        setTitle: (t) => { panel.title = t; },
        setMargins: () => {},
        setSpaceBetween: () => {},
        add: () => {},
        show: () => { panel.shown = true; },
        getThemeColor: () => '#444444',
        addCallbackObject: (cb) => callbacks.push(cb),
    };

    const findButtons = () => (panel.scrollLayout?.items || []).filter((x) => x instanceof Button);
    const findLabels = () => panel.widgets.filter((x) => x instanceof Label);
    const findSearch = () => panel.widgets.find((x) => x instanceof LineEdit);
    const findRefresh = () => panel.widgets.find((x) => x instanceof Button && x.text === 'Refresh');

    return { api, ui, panel, nodes, callbacks, findButtons, findLabels, findSearch, findRefresh };
}

test('resolveCavalryScriptsDir resolves Windows APPDATA & explicit overrides', () => {
    const winDir = resolveCavalryScriptsDir({
        platform: 'win32',
        appData: 'C:\\Users\\demo\\AppData\\Roaming',
        override: '',
    });
    assert.equal(winDir, path.join('C:\\Users\\demo\\AppData\\Roaming', 'Cavalry', 'Scripts'));

    const custom = resolveCavalryScriptsDir({ override: path.join(os.tmpdir(), 'custom-scripts-dir') });
    assert.equal(custom, path.resolve(path.join(os.tmpdir(), 'custom-scripts-dir')));
});

test('syncCavalryScript auto-bundles verified effects, excludes drafts, and passes script validation', async () => {
    const { validateCavalryContextUsage } = await import(CAVALRY_MCP_STALLION_URL);
    const { tmpRoot, scriptsDir, libDir } = makeTempLibraryCopy();
    try {
        // Add a verified 2nd effect ('glow') and an incomplete draft ('unfinished-blur')
        fs.mkdirSync(path.join(libDir, 'effects', 'glow'), { recursive: true });
        fs.writeFileSync(path.join(libDir, 'effects', 'glow', 'implementation.js'), `
(function () {
    var cfg = typeof __EFFECT_CONFIG__ !== 'undefined' ? __EFFECT_CONFIG__ : {};
    var sel = api.getSelection() || [];
    if (!sel.length) {
        var err = { ok: false, effect: 'glow', error: 'No layer selected.' };
        try { __result = err; } catch (e) {}
        return err;
    }
    var n = api.create('skslFilter', '[AE:Glow] ' + api.getNiceName(sel[0]));
    api.connect(n, 'id', sel[0], 'filters');
    var out = { ok: true, effect: 'glow', appliedCount: 1, applied: [{ nodeId: n, mechanism: 'skslFilter', action: 'created' }] };
    try { __result = out; } catch (e) {}
    return out;
})();
        `.trim(), 'utf8');

        const regPath = path.join(libDir, 'effect-registry.json');
        const reg = JSON.parse(fs.readFileSync(regPath, 'utf8'));
        reg.effects.glow = {
            version: '1.0.0',
            aeName: 'Glow',
            aeMatchName: 'ADBE Glo2',
            aeCategory: 'Stylize',
            status: 'live-verified',
            primaryStrategy: 'sksl-filter',
            entryScript: 'effects/glow/implementation.js',
            artifacts: { sksl: 'effects/glow/glow.sksl' },
        };
        reg.effects['unfinished-blur'] = {
            version: '0.1.0',
            aeName: 'Draft Blur',
            aeCategory: 'Blur & Sharpen',
            status: 'draft',
            entryScript: 'effects/draft-blur/implementation.js',
        };
        fs.writeFileSync(regPath, JSON.stringify(reg, null, 2), 'utf8');

        const repoOut = path.join(libDir, 'cavalry-script', 'AE Effects.js');
        const syncRes = syncCavalryScript({
            libraryRoot: libDir,
            repoScriptPath: repoOut,
            scriptsDir,
        });

        assert.equal(syncRes.ok, true);
        assert.equal(syncRes.effectCount, 2);
        assert.deepEqual(syncRes.effects.map((e) => e.slug), ['turbulent-displace', 'glow']);
        assert.equal(syncRes.skipped.length, 1);
        assert.equal(syncRes.skipped[0].slug, 'unfinished-blur');

        const deployedFile = path.join(scriptsDir, 'AE Effects.js');
        assert.ok(fs.existsSync(deployedFile));
        const code = fs.readFileSync(deployedFile, 'utf8');
        assert.equal(code, fs.readFileSync(repoOut, 'utf8'));

        const validation = validateCavalryContextUsage(code, 'script');
        assert.equal(validation.valid, true, `Unexpected forbidden usages: ${validation.forbiddenUsages.join(', ')}`);

        const checkRes = syncCavalryScript({
            libraryRoot: libDir,
            repoScriptPath: repoOut,
            scriptsDir,
            check: true,
        });
        assert.equal(checkRes.ok, true);
    } finally {
        fs.rmSync(tmpRoot, { recursive: true, force: true });
    }
});

test('Cavalry AE Effects UI script applies effects on single click and hot-reloads newly added effects on Refresh / selection change', () => {
    const { tmpRoot, scriptsDir, libDir } = makeTempLibraryCopy();
    try {
        const repoOut = path.join(libDir, 'cavalry-script', 'AE Effects.js');
        syncCavalryScript({ libraryRoot: libDir, repoScriptPath: repoOut, scriptsDir });
        const panelCode = fs.readFileSync(path.join(scriptsDir, 'AE Effects.js'), 'utf8');

        const h = createMockCavalryUiHarness({ startSelection: [] });
        vm.runInNewContext(panelCode, {
            api: h.api,
            ui: h.ui,
            console,
        });

        assert.equal(h.panel.title, 'AE Effects');
        assert.equal(h.panel.shown, true);
        assert.equal(h.findButtons().length, 1);
        assert.match(h.findButtons()[0].text, /Turbulent Displace/);

        // 1. Clicking with empty selection does not mutate scene and gives warning
        const nodesBeforeEmpty = h.nodes.size;
        h.findButtons()[0].click();
        assert.equal(h.nodes.size, nodesBeforeEmpty);

        // 2. Select layer in scene -> 1 click applies Turbulent Displace & preserves selection
        h.api.select(['basicShape#1']);
        h.findButtons()[0].click();
        const linked1 = String(h.api.getInConnection('basicShape#1', 'filters')).split('.')[0];
        assert.ok(linked1.startsWith('skslFilter#'));
        assert.deepEqual(h.api.getSelection(), ['basicShape#1']);

        // 3. Second click is idempotent (does not create a duplicate filter)
        const countAfterFirst = h.nodes.size;
        h.findButtons()[0].click();
        assert.equal(h.nodes.size, countAfterFirst);

        // 4. Search filters cleanly and restores cleanly
        const search = h.findSearch();
        search.setText('nonexistent-xyz');
        search.onValueChanged();
        assert.equal(h.findButtons().length, 0);
        search.setText('');
        search.onValueChanged();
        assert.equal(h.findButtons().length, 1);

        // 5. Simulate Antigravity creating & verifying a new effect ('wave-warp') while Cavalry panel is already open
        fs.mkdirSync(path.join(libDir, 'effects', 'wave-warp'), { recursive: true });
        fs.writeFileSync(path.join(libDir, 'effects', 'wave-warp', 'implementation.js'), `
(function () {
    var sel = api.getSelection() || [];
    if (!sel.length) {
        __result = { ok: false, effect: 'wave-warp', error: 'No layer selected.' };
        return;
    }
    var n = api.create('skslFilter', '[AE:WaveWarp] ' + api.getNiceName(sel[0]));
    api.connect(n, 'id', sel[0], 'filters');
    __result = { ok: true, effect: 'wave-warp', appliedCount: 1, applied: [{ nodeId: n, mechanism: 'skslFilter', action: 'created' }] };
})();
        `.trim(), 'utf8');
        const regPath = path.join(libDir, 'effect-registry.json');
        const reg = JSON.parse(fs.readFileSync(regPath, 'utf8'));
        reg.effects['wave-warp'] = {
            version: '1.0.0',
            aeName: 'Wave Warp',
            aeMatchName: 'ADBE Wave Warp',
            aeCategory: 'Distort',
            status: 'live-verified',
            primaryStrategy: 'sksl-filter',
            entryScript: 'effects/wave-warp/implementation.js',
            artifacts: { sksl: 'effects/wave-warp/wave-warp.sksl' },
        };
        // Bump file timestamps by +2s so truncated-second mtime change is guaranteed even inside same wall-clock second
        const futureSec = Math.floor(Date.now() / 1000) + 5;
        fs.writeFileSync(regPath, JSON.stringify(reg, null, 2), 'utf8');
        fs.utimesSync(regPath, futureSec, futureSec);

        // Selecting a layer OR clicking Refresh dynamically detects the newly added effect
        h.api.select(['textShape#1']);
        assert.equal(h.findButtons().length, 2, 'Panel auto-synced Wave Warp when selection changed after registry update');

        const waveBtn = h.findButtons().find((b) => /Wave Warp/.test(b.text));
        assert.ok(waveBtn, 'Expected Wave Warp button in open panel');
        waveBtn.click();
        const waveLinked = String(h.api.getInConnection('textShape#1', 'filters')).split('.')[0];
        assert.ok(waveLinked.startsWith('skslFilter#'), 'Clicking newly hot-loaded Wave Warp applied it directly to selected layer');

        // Explicit Refresh button keeps all synced effects intact
        h.findRefresh().click();
        assert.equal(h.findButtons().length, 2);
    } finally {
        fs.rmSync(tmpRoot, { recursive: true, force: true });
    }
});
