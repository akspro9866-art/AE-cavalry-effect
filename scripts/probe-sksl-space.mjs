import { pathToFileURL } from 'node:url';

const CAVALRY_MCP_STALLION = pathToFileURL('C:/Users/khada/cavalry-mcp/dist/bridge/stallion.js').href;

async function main() {
  const { runScriptWithResult, runBatchStep, loadConfig } = await import(CAVALRY_MCP_STALLION);
  const cfg = loadConfig();

  const script = `
(function() {
  var comp = api.getActiveComp();
  var rect = api.primitive('rectangle', 'Probe Red');
  api.set(rect, {
    'generator.dimensions': { x: 200, y: 200 },
    'material.materialColor': { r: 0, g: 255, b: 0, a: 255 } // green
  });
  var filter = api.create('skslFilter', comp);
  api.addDynamic(filter, 'inputs', 'double');
  api.renameAttribute(filter, 'inputs.0', 'Offset (Turbulence)');
  // If SkSL preamble is valid, shader compiles and renders pure blue (0, 0, 1, 1).
  // If preamble has syntax error 'uniform float Offset (Turbulence);', filter fails to compile and stays green!
  api.set(filter, { code: 'half4 main(float2 c) { return half4(0.0, 0.0, 1.0, 1.0); }' });
  api.connect(filter, 'id', rect, 'filters');
  api.select([rect]);
  __result = { ok: true };
})();
`;

  await runScriptWithResult(script, cfg);

  const step = await runBatchStep({
    script: '/* probe */',
    sampleFrames: [0],
    renderFrames: true,
    renderOutputDir: 'C:/Users/khada/.gemini/antigravity/scratch/ae-cavalry-effects/artifacts/probe-test'
  }, cfg);

  // Clean up
  await runScriptWithResult(`
(function() {
  var layers = api.getCompLayers(false);
  for (var i = 0; i < layers.length; i++) try { api.deleteLayer(layers[i]); } catch (e) {}
  __result = { cleaned: true };
})();
`, cfg);

  console.log('RENDER SUCCESS:', step.ok);
}

main().catch(console.error);
