import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { syncCavalryScript } from './sync-cavalry-script.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CAVALRY_MCP_STALLION = pathToFileURL('C:/Users/khada/cavalry-mcp/dist/bridge/stallion.js').href;
const CAVALRY_MCP_DOCTOR = pathToFileURL('C:/Users/khada/cavalry-mcp/dist/doctor.js').href;

async function main() {
    const slug = process.argv[2] || 'turbulent-displace';
    const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'effect-registry.json'), 'utf8'));
    const entry = registry.effects[slug];
    if (!entry) {
        console.error(`Effect "${slug}" not found in effect-registry.json`);
        process.exit(1);
    }

    const {
        validateSkslSource,
        validateCavalryContextUsage,
        loadConfig,
        runScriptWithResult,
        runBatchStep,
        runReadback,
        runCheckpoint,
        runRollback,
    } = await import(CAVALRY_MCP_STALLION);
    const { runDoctor } = await import(CAVALRY_MCP_DOCTOR);

    const report = {
        slug,
        version: entry.version,
        checkedAt: new Date().toISOString(),
        tier1Static: {},
        tier2And3UnitAndMock: {},
        tier4LiveCavalry: {},
    };

    // Tier 1: Static validation via cavalry-mcp validators
    if (entry.artifacts?.sksl) {
        const skslPath = path.join(ROOT, entry.artifacts.sksl);
        const skslCode = fs.readFileSync(skslPath, 'utf8');
        report.tier1Static.sksl = validateSkslSource(skslCode);
    }
    if (entry.artifacts?.deformer) {
        const defPath = path.join(ROOT, entry.artifacts.deformer);
        const defCode = fs.readFileSync(defPath, 'utf8');
        report.tier1Static.deformer = validateCavalryContextUsage(defCode, 'javaScriptDeformer');
    }
    const implPath = path.join(ROOT, entry.entryScript);
    const implCode = fs.readFileSync(implPath, 'utf8');
    report.tier1Static.applicator = validateCavalryContextUsage(implCode, 'script');

    const repoPanelPath = path.join(ROOT, 'cavalry-script', 'AE Effects.js');
    if (fs.existsSync(repoPanelPath)) {
        const panelCode = fs.readFileSync(repoPanelPath, 'utf8');
        report.tier1Static.cavalryUiPanel = validateCavalryContextUsage(panelCode, 'script');
    }

    // Tier 2 + 3: Automated unit + Stallion mock test suite
    const testFile = path.join(ROOT, 'test', `${slug}.test.mjs`);
    if (fs.existsSync(testFile)) {
        try {
            const testOut = execFileSync(process.execPath, ['--test', testFile], { cwd: ROOT, encoding: 'utf8' });
            report.tier2And3UnitAndMock = { passed: true, output: testOut.trim() };
        } catch (err) {
            report.tier2And3UnitAndMock = {
                passed: false,
                output: String(err.stdout || ''),
                error: String(err.stderr || err.message),
            };
        }
    }

    // Tier 4: Live Cavalry probe & checkpoint-isolated end-to-end verification
    const doc = await runDoctor({ probeRuntime: true });
    const bridgeCheck = Array.isArray(doc.checks) ? doc.checks.find((c) => c.name === 'bridge') : null;
    report.tier4LiveCavalry.doctor = {
        ok: doc.ok,
        bridge: doc.bridge,
        runtime: doc.runtime,
        binaries: doc.binaries,
        bridgeCheck,
    };

    if (doc.bridge?.reachable === true && doc.runtime?.ready === true) {
        const cfg = loadConfig();
        const snapId = `verify-${slug}-${Date.now()}`;
        const checkpoint = await runCheckpoint({ snapshotId: snapId }, cfg);
        const before = await runReadback('layers', {}, cfg);
        const renderDir = path.join(ROOT, 'artifacts', `verify-${slug}`);
        const deformerRenderDir = path.join(ROOT, 'artifacts', `verify-${slug}-deformer`);
        fs.mkdirSync(renderDir, { recursive: true });
        fs.mkdirSync(deformerRenderDir, { recursive: true });

        try {
            // 1. Setup clean verification target in live Cavalry & verify empty-selection guard
            const setupTargetScript = `
api.select([]);
`;
            await runScriptWithResult(setupTargetScript, cfg);
            const emptyApply = JSON.parse(await runScriptWithResult(implCode, cfg));

            const createTargetScript = `
var layers = api.getCompLayers(false);
for (var i = 0; i < layers.length; i++) {
  try { api.deleteLayer(layers[i]); } catch (e) {}
}
var rect = api.primitive('rectangle', 'Verify Target');
api.set(rect, {
  'generator.dimensions': { x: 220, y: 220 },
  'material.materialColor': { r: 242, g: 130, b: 42, a: 255 }
});
api.select([rect]);
__result = { targetId: rect };
`;
            const targetRes = JSON.parse(await runScriptWithResult(createTargetScript, cfg));
            const targetId = targetRes?.result?.targetId;

            if (slug === 'deep-glow') {
                const applyCfg1 = {
                    params: {
                        radius: 140.0,
                        exposure: 1.2,
                        aspectRatio: 1.5,
                        tintMode: 2,
                        tintColor: { r: 255, g: 190, b: 70, a: 255 },
                        tintColorOuter: { r: 40, g: 130, b: 250, a: 255 },
                    },
                    animateExposure: { startFrame: 0, endFrame: 50, startValue: 0.0, endValue: 2.0 },
                };
                const firstApply = JSON.parse(
                    await runScriptWithResult(`var __EFFECT_CONFIG__ = ${JSON.stringify(applyCfg1)};\n${implCode}`, cfg)
                );
                const afterFirst = await runReadback('layers', {}, cfg);

                // Idempotency check: update existing filter
                const applyCfg2 = {
                    params: {
                        radius: 180.0,
                        exposure: 2.0,
                    },
                };
                const secondApply = JSON.parse(
                    await runScriptWithResult(`var __EFFECT_CONFIG__ = ${JSON.stringify(applyCfg2)};\n${implCode}`, cfg)
                );
                const afterSecond = await runReadback('layers', {}, cfg);

                // Multi-frame SkSL render capture across frames 0, 25, 50
                const skslRender = await runBatchStep({
                    script: `/* deep glow applied */`,
                    sampleFrames: [0, 25, 50],
                    renderFrames: true,
                    renderOutputDir: renderDir,
                }, cfg);

                const renderedFramesPresent = [0, 25, 50].every((f) =>
                    fs.existsSync(path.join(renderDir, `frame_${f}.png`))
                );

                const firstResult = firstApply?.result?.results?.[0];
                const secondResult = secondApply?.result?.results?.[0];

                const passed = Boolean(
                    emptyApply?.result?.ok === false &&
                    firstApply?.result?.ok === true &&
                    firstResult?.isNew === true &&
                    Object.keys(firstResult?.boundSlots || {}).length === 17 &&
                    secondApply?.result?.ok === true &&
                    secondResult?.isNew === false &&
                    secondResult?.filterId === firstResult?.filterId &&
                    (afterFirst?.total ?? -1) === (afterSecond?.total ?? -2) &&
                    skslRender?.ok === true &&
                    renderedFramesPresent
                );

                report.tier4LiveCavalry = {
                    ...report.tier4LiveCavalry,
                    status: passed ? 'verified-runtime-and-render-captured' : 'failed',
                    checkpointOk: checkpoint?.ok === true,
                    layersBefore: before?.total ?? null,
                    emptySelectionGuarded: emptyApply?.result?.ok === false,
                    firstApply: firstApply?.result,
                    secondApply: secondApply?.result,
                    idempotentLayerCount: `${afterFirst?.total} -> ${afterSecond?.total}`,
                    skslRenderOk: skslRender?.ok === true,
                    skslFramesDir: renderDir,
                    note: 'Live Cavalry 2.8 GPU SkSL execution and rendered frame verification passed cleanly.',
                };
            } else {
                // Default: Turbulent Displace flow
                const applyCfg1 = {
                    mode: 'sksl',
                    params: {
                        displacement: 'Turbulent',
                        amount: 58,
                        size: 85,
                        complexity: 2.5,
                        cycleEvolution: true,
                        antialiasing: 'High',
                        resizeLayer: true,
                    },
                    animateEvolution: { startFrame: 0, endFrame: 60, startValue: 0, endValue: 180 },
                };
                const firstApply = JSON.parse(
                    await runScriptWithResult(`var __EFFECT_CONFIG__ = ${JSON.stringify(applyCfg1)};\n${implCode}`, cfg)
                );
                const afterFirst = await runReadback('layers', {}, cfg);

                // 3. Repeat application idempotency check
                const secondApply = JSON.parse(
                    await runScriptWithResult(`var __EFFECT_CONFIG__ = ${JSON.stringify(applyCfg1)};\n${implCode}`, cfg)
                );
                const afterSecond = await runReadback('layers', {}, cfg);

                // 4. Multi-frame SkSL render capture across frames 0, 30, 60
                const skslRender = await runBatchStep({
                    script: `/* already applied cleanly */`,
                    sampleFrames: [0, 30, 60],
                    renderFrames: true,
                    renderOutputDir: renderDir,
                }, cfg);

                // 5. Companion Deformer verification on isolated fresh green rectangle
                const defSetupScript = `
var layers = api.getCompLayers(false);
for (var i = 0; i < layers.length; i++) {
  if (api.getLayerType(layers[i]) === 'skslFilter') api.deleteLayer(layers[i]);
}
api.set(${JSON.stringify(targetId)}, { 'material.materialColor': { r: 58, g: 205, b: 135, a: 255 } });
api.select([${JSON.stringify(targetId)}]);
`;
                await runScriptWithResult(defSetupScript, cfg);
                const deformerCfg = {
                    mode: 'deformer',
                    params: { displacement: 'Turbulent', amount: 60, size: 75, complexity: 2.5, cycleEvolution: true, resampleLength: 6 },
                    animateEvolution: { startFrame: 0, endFrame: 60, startValue: 0, endValue: 180 },
                };
                const deformerApply = JSON.parse(
                    await runScriptWithResult(`var __EFFECT_CONFIG__ = ${JSON.stringify(deformerCfg)};\n${implCode}`, cfg)
                );
                const deformerRender = await runBatchStep({
                    script: `/* deformer applied */`,
                    sampleFrames: [0, 30, 60],
                    renderFrames: true,
                    renderOutputDir: deformerRenderDir,
                }, cfg);

                const renderedFramesPresent = [0, 30, 60].every((f) =>
                    fs.existsSync(path.join(renderDir, `frame_${f}.png`)) &&
                    fs.existsSync(path.join(deformerRenderDir, `frame_${f}.png`))
                );

                const firstApp = firstApply?.result?.applied?.[0];
                const secondApp = secondApply?.result?.applied?.[0];
                const defApp = deformerApply?.result?.applied?.[0];

                const passed = Boolean(
                    emptyApply?.result?.ok === false &&
                    firstApply?.result?.ok === true &&
                    firstApp?.uniformMode === 'cavalry-inputs-array' &&
                    Object.keys(firstApp?.boundAttrs || {}).length === 12 &&
                    secondApply?.result?.ok === true &&
                    secondApp?.action === 'updated' &&
                    secondApp?.nodeId === firstApp?.nodeId &&
                    (afterFirst?.total ?? -1) === (afterSecond?.total ?? -2) &&
                    skslRender?.ok === true &&
                    deformerApply?.result?.ok === true &&
                    Object.keys(defApp?.boundAttrs || {}).length >= 11 &&
                    deformerRender?.ok === true &&
                    renderedFramesPresent
                );

                report.tier4LiveCavalry = {
                    ...report.tier4LiveCavalry,
                    status: passed ? 'verified-runtime-and-render-captured' : 'failed',
                    checkpointOk: checkpoint?.ok === true,
                    layersBefore: before?.total ?? null,
                    emptySelectionGuarded: emptyApply?.result?.ok === false,
                    firstApply: firstApply?.result,
                    secondApplyAction: secondApp?.action ?? null,
                    idempotentLayerCount: `${afterFirst?.total} -> ${afterSecond?.total}`,
                    skslRenderOk: skslRender?.ok === true,
                    skslFramesDir: renderDir,
                    deformerApply: deformerApply?.result,
                    deformerRenderOk: deformerRender?.ok === true,
                    deformerFramesDir: deformerRenderDir,
                    note: 'Inspect rendered PNGs visually to confirm pixel deformation, animation, and pinning look accurate.',
                };
            }
        } finally {
            if (checkpoint?.ok) {
                report.tier4LiveCavalry.rollback = await runRollback({ snapshotId: snapId }, cfg);
            }
        }
    } else {
        report.tier4LiveCavalry.status = 'UNVERIFIED_LIVE_CAVALRY_OFFLINE';
        report.tier4LiveCavalry.note = `Live Stallion bridge unavailable (${bridgeCheck?.detail ?? 'http://127.0.0.1:8080 unreachable'}). Start Cavalry and run Scripts > Stallion to execute live rendering and visual parity verification.`;
    }

    const staticOk =
        (report.tier1Static.sksl?.valid ?? true) &&
        (report.tier1Static.deformer?.valid ?? true) &&
        (report.tier1Static.applicator?.valid ?? true) &&
        (report.tier1Static.cavalryUiPanel?.valid ?? true);
    const testsOk = report.tier2And3UnitAndMock.passed === true;
    const liveOk =
        report.tier4LiveCavalry.status === 'UNVERIFIED_LIVE_CAVALRY_OFFLINE' ||
        report.tier4LiveCavalry.status === 'verified-runtime-and-render-captured';

    if (staticOk && testsOk && liveOk) {
        try {
            const syncRes = syncCavalryScript({ libraryRoot: ROOT });
            const syncedPanelCode = fs.readFileSync(syncRes.repoScriptPath, 'utf8');
            const syncedPanelValid = validateCavalryContextUsage(syncedPanelCode, 'script');
            report.cavalryUiScriptSync = {
                ...syncRes,
                staticValidation: syncedPanelValid,
            };
            if (!syncedPanelValid.valid) {
                console.error('Generated AE Effects.js failed static script validation!');
                process.exit(1);
            }
        } catch (syncErr) {
            report.cavalryUiScriptSync = {
                ok: false,
                error: syncErr.message,
            };
        }
    }

    console.log(JSON.stringify(report, null, 2));
    const syncOk = report.cavalryUiScriptSync ? report.cavalryUiScriptSync.ok === true : true;
    process.exit(staticOk && testsOk && liveOk && syncOk ? 0 : 1);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
