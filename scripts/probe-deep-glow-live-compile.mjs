import { pathToFileURL } from 'node:url';
import fs from 'node:fs';

const CAVALRY_MCP_STALLION = pathToFileURL('C:/Users/khada/cavalry-mcp/dist/bridge/stallion.js').href;

async function main() {
  const { runScriptWithResult, runBatchStep, loadConfig } = await import(CAVALRY_MCP_STALLION);
  const cfg = loadConfig();

  const skslSource = fs.readFileSync('C:/Users/khada/.gemini/antigravity/scratch/ae-cavalry-effects/effects/deep-glow/deep-glow.sksl', 'utf8');

  // Strip uniform declarations that Cavalry's dynamic inputs inject
  const liveCode = skslSource.replace(/^\s*uniform\s+(?:float|float2|half4|bool)\s+[A-Za-z0-9_]+\s*;\s*(?:\r?\n)?/gm, '');

  const script = `
(function() {
  var comp = api.getActiveComp();
  var rect = api.primitive('rectangle', 'Probe Deep Glow');
  api.set(rect, {
    'generator.dimensions': { x: 200, y: 200 },
    'material.materialColor': { r: 255, g: 100, b: 50, a: 255 }
  });

  var filter = api.create('skslFilter', comp);

  var specs = [
    { name: 'Radius', type: 'double', val: 120.0 },
    { name: 'Exposure', type: 'double', val: 1.0 },
    { name: 'Threshold', type: 'double', val: 0.0 },
    { name: 'ThresholdSmooth', type: 'double', val: 0.1 },
    { name: 'SaturationBias', type: 'double', val: 0.0 },
    { name: 'AspectRatio', type: 'double', val: 1.0 },
    { name: 'AspectAngle', type: 'double', val: 0.0 },
    { name: 'Aberration', type: 'double', val: 0.0 },
    { name: 'GlowMode', type: 'double', val: 0.0 },
    { name: 'BlendMode', type: 'double', val: 0.0 },
    { name: 'TintMode', type: 'double', val: 0.0 },
    { name: 'TintColor', type: 'color', val: { r: 255, g: 200, b: 120, a: 255 } },
    { name: 'TintColorOuter', type: 'color', val: { r: 50, g: 150, b: 255, a: 255 } },
    { name: 'TintBlendMode', type: 'double', val: 1.0 },
    { name: 'TintStrength', type: 'double', val: 1.0 },
    { name: 'ToneMapMode', type: 'double', val: 0.0 },
    { name: 'SourceOpacity', type: 'double', val: 1.0 }
  ];

  for (var i = 0; i < specs.length; i++) {
    var sp = specs[i];
    var slot = (i === 0) ? 'inputs.0' : api.addDynamic(filter, 'inputs', sp.type);
    api.renameAttribute(filter, slot, sp.name);
    var p = {};
    p[slot] = sp.val;
    api.set(filter, p);
  }

  api.set(filter, {
    code: ${JSON.stringify(liveCode)},
    padding: { x: 180, y: 180 }
  });

  api.connect(filter, 'id', rect, 'filters');
  api.select([rect]);

  __result = { filter: filter, rect: rect };
})();
`;

  const setupRes = await runScriptWithResult(script, cfg);
  console.log('LIVE COMPILE SETUP RES:', JSON.stringify(setupRes, null, 2));

  const step = await runBatchStep({
    script: '/* render deep glow test frame */',
    sampleFrames: [0],
    renderFrames: true,
    renderOutputDir: 'C:/Users/khada/.gemini/antigravity/scratch/ae-cavalry-effects/artifacts/deep-glow-test'
  }, cfg);
  console.log('LIVE RENDER STEP STATUS:', step.ok);

  await runScriptWithResult(`
(function() {
  var layers = api.getCompLayers(false);
  for (var i = 0; i < layers.length; i++) try { api.deleteLayer(layers[i]); } catch (e) {}
  __result = { cleaned: true };
})();
`, cfg);
}

main().catch(console.error);
