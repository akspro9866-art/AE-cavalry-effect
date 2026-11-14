import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { resolveProjectRoot, resolveCavalryMcpPath } from './lib/config.mjs';
import fs from 'node:fs';

const LIB_ROOT = resolveProjectRoot();

const CAVALRY_MCP_STALLION = pathToFileURL(path.join(resolveCavalryMcpPath() || '.', 'dist', 'bridge', 'stallion.js')).href;

async function main() {
  const { runScriptWithResult, runBatchStep, loadConfig } = await import(CAVALRY_MCP_STALLION);
  const cfg = loadConfig();

  console.log('Testing all 4 features live in Cavalry 2.8...');

  // 1. Test Null Object
  await runScriptWithResult(`
  var r1 = api.primitive('rectangle', 'Live Null Rect 1');
  var r2 = api.primitive('rectangle', 'Live Null Rect 2');
  api.set(r1, { position: { x: -100, y: 0 } });
  api.set(r2, { position: { x: 100, y: 0 } });
  api.select([r1, r2]);
  `, cfg);
  const nullCode = fs.readFileSync(LIB_ROOT + '/effects/null-object/implementation.js', 'utf8');
  const nullRes = JSON.parse(await runScriptWithResult(nullCode, cfg));
  console.log('1. Null Object Live Result:', nullRes.result?.ok, nullRes.result?.name, nullRes.result?.position);

  // 2. Test Adjustment Layer
  const adjCode = fs.readFileSync(LIB_ROOT + '/effects/adjustment-layer/implementation.js', 'utf8');
  const adjRes = JSON.parse(await runScriptWithResult(adjCode, cfg));
  console.log('2. Adjustment Layer Live Result:', adjRes.result?.ok, adjRes.result?.name, adjRes.result?.filterId);

  // 3. Test CC RepeTile on a fresh target
  await runScriptWithResult(`
  var r3 = api.primitive('rectangle', 'Live RepeTile Rect');
  api.set(r3, {
    'generator.dimensions': { x: 160, y: 120 },
    'material.materialColor': { r: 240, g: 180, b: 40, a: 255 }
  });
  api.select([r3]);
  `, cfg);
  const repetileCode = fs.readFileSync(LIB_ROOT + '/effects/cc-repetile/implementation.js', 'utf8');
  const repRes = JSON.parse(await runScriptWithResult(repetileCode, cfg));
  console.log('3. CC RepeTile Live Result:', repRes.result?.ok, repRes.result?.effect, repRes.result?.results?.[0]?.padding);

  // 4. Test Pre-Compose on the Null and RepeTile layers
  await runScriptWithResult(`
  var layers = api.getCompLayers(false);
  api.select(layers.slice(0, 2));
  `, cfg);
  const precompCode = fs.readFileSync(LIB_ROOT + '/effects/pre-compose/implementation.js', 'utf8');
  const preRes = JSON.parse(await runScriptWithResult(precompCode, cfg));
  console.log('4. Pre-Compose Live Result:', preRes.result?.ok, preRes.result?.name, preRes.result?.preCompId);

  // 5. Render a frame to verify GPU pipeline
  const renderStep = await runBatchStep({
    script: '/* render all live */',
    sampleFrames: [0],
    renderFrames: true,
    renderOutputDir: LIB_ROOT + '/artifacts/verify-live-suite'
  }, cfg);
  console.log('5. Live Frame Render Status:', renderStep.ok);

  // Clean up comp
  await runScriptWithResult(`
  var layers = api.getCompLayers(false);
  for (var i = 0; i < layers.length; i++) try { api.deleteLayer(layers[i]); } catch (e) {}
  `, cfg);
  console.log('Cleaned up live comp.');
}

main().catch(console.error);
