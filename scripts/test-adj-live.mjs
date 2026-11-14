import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { resolveProjectRoot, resolveCavalryMcpPath } from './lib/config.mjs';
import fs from 'node:fs';

const LIB_ROOT = resolveProjectRoot();

const CAVALRY_MCP_STALLION = pathToFileURL(path.join(resolveCavalryMcpPath() || '.', 'dist', 'bridge', 'stallion.js')).href;

async function main() {
  const { runScriptWithResult, runBatchStep, loadConfig } = await import(CAVALRY_MCP_STALLION);
  const cfg = loadConfig();

  const script = `
(function() {
  var r1 = api.primitive('rectangle', 'Adj Target Rect 1');
  var r2 = api.primitive('rectangle', 'Adj Target Rect 2');
  api.set(r1, { position: { x: -80, y: 0 }, 'material.materialColor': { r: 250, g: 100, b: 50, a: 255 } });
  api.set(r2, { position: { x: 80, y: 0 }, 'material.materialColor': { r: 50, g: 150, b: 250, a: 255 } });
  api.select([r1, r2]);
  __result = { r1: r1, r2: r2 };
})();
`;
  await runScriptWithResult(script, cfg);
  const implCode = fs.readFileSync(LIB_ROOT + '/effects/adjustment-layer/implementation.js', 'utf8');
  const res = await runScriptWithResult(implCode, cfg);
  console.log('ADJ APPLY RESULT:', JSON.stringify(res, null, 2));

  const renderStep = await runBatchStep({
    script: '/* render adj */',
    sampleFrames: [0],
    renderFrames: true,
    renderOutputDir: LIB_ROOT + '/artifacts/probe-adj'
  }, cfg);
  console.log('ADJ RENDER STATUS:', renderStep.ok);

  await runScriptWithResult(`
(function() {
  var layers = api.getCompLayers(false);
  for (var i = 0; i < layers.length; i++) try { api.deleteLayer(layers[i]); } catch (e) {}
  __result = { cleaned: true };
})();
`, cfg);
}

main().catch(console.error);
