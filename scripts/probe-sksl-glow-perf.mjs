import { pathToFileURL } from 'node:url';

const CAVALRY_MCP_STALLION = pathToFileURL('C:/Users/khada/cavalry-mcp/dist/bridge/stallion.js').href;

async function main() {
  const { runScriptWithResult, runBatchStep, loadConfig } = await import(CAVALRY_MCP_STALLION);
  const cfg = loadConfig();

  const script = `
(function() {
  var comp = api.getActiveComp();
  var rect = api.primitive('rectangle', 'Probe SkSL Glow Perf');
  api.set(rect, {
    'generator.dimensions': { x: 300, y: 300 },
    'material.materialColor': { r: 255, g: 255, b: 255, a: 255 }
  });

  var filter = api.create('skslFilter', comp);
  var code = 'half4 main(float2 c) {' +
    '  half4 sum = layer.eval(c);' +
    '  float totalWeight = 1.0;' +
    '  for (int r = 1; r <= 8; r++) {' +
    '    float radius = float(r * r) * 2.0;' +
    '    float w = 1.0 / (1.0 + radius * 0.05);' +
    '    for (int a = 0; a < 8; a++) {' +
    '      float ang = float(a) * 0.785398 + float(r) * 2.399963;' +
    '      float2 offset = float2(cos(ang), sin(ang)) * radius;' +
    '      sum += layer.eval(c + offset) * half(w);' +
    '      totalWeight += w;' +
    '    }' +
    '  }' +
    '  return sum / half(totalWeight);' +
    '}';

  api.set(filter, { code: code, padding: { x: 100, y: 100 } });
  api.connect(filter, 'id', rect, 'filters');
  api.select([rect]);
  __result = { filter: filter, rect: rect };
})();
`;

  const setupRes = await runScriptWithResult(script, cfg);
  console.log('SETUP RES:', setupRes.status);

  const step = await runBatchStep({
    script: '/* render probe */',
    sampleFrames: [0],
    renderFrames: true,
    renderOutputDir: 'C:/Users/khada/.gemini/antigravity/scratch/ae-cavalry-effects/artifacts/probe-test'
  }, cfg);
  console.log('RENDER STEP STATUS:', step.ok);

  await runScriptWithResult(`
(function() {
  var layers = api.getCompLayers(false);
  for (var i = 0; i < layers.length; i++) try { api.deleteLayer(layers[i]); } catch (e) {}
  __result = { cleaned: true };
})();
`, cfg);
}

main().catch(console.error);
