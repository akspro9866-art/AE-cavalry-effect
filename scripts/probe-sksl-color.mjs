import { pathToFileURL } from 'node:url';

const CAVALRY_MCP_STALLION = pathToFileURL('C:/Users/khada/cavalry-mcp/dist/bridge/stallion.js').href;

async function main() {
  const { runScriptWithResult, runBatchStep, loadConfig } = await import(CAVALRY_MCP_STALLION);
  const cfg = loadConfig();

  const script = `
(function() {
  var comp = api.getActiveComp();
  var rect = api.primitive('rectangle', 'Probe Color Rect');
  var filter = api.create('skslFilter', comp);
  var slot0 = api.addDynamic(filter, 'inputs', 'color');
  api.renameAttribute(filter, slot0, 'TintColor');
  api.set(filter, { 'inputs.1': { r: 255, g: 128, b: 0, a: 255 } });
  api.set(filter, { code: 'half4 main(float2 c) { return half4(TintColor.rgb, 1.0); }' });
  api.connect(filter, 'id', rect, 'filters');
  api.select([rect]);
  __result = { filter: filter, rect: rect };
})();
`;

  await runScriptWithResult(script, cfg);

  const step = await runBatchStep({
    script: '/* probe color render */',
    sampleFrames: [0],
    renderFrames: true,
    renderOutputDir: 'C:/Users/khada/.gemini/antigravity/scratch/ae-cavalry-effects/artifacts/probe-test'
  }, cfg);
  console.log('COLOR RENDER STATUS:', step.ok);

  await runScriptWithResult(`
(function() {
  var layers = api.getCompLayers(false);
  for (var i = 0; i < layers.length; i++) try { api.deleteLayer(layers[i]); } catch (e) {}
  __result = { cleaned: true };
})();
`, cfg);
}

main().catch(console.error);
