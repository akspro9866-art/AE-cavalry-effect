import { pathToFileURL } from 'node:url';
import fs from 'node:fs';

const CAVALRY_MCP_STALLION = pathToFileURL('C:/Users/khada/cavalry-mcp/dist/bridge/stallion.js').href;

async function main() {
  const { runScriptWithResult, loadConfig } = await import(CAVALRY_MCP_STALLION);
  const cfg = loadConfig();

  const script = `
(function() {
  var r1 = api.primitive('rectangle', 'Null Test Rect 1');
  var r2 = api.primitive('rectangle', 'Null Test Rect 2');
  api.set(r1, { position: { x: -100, y: 50 } });
  api.set(r2, { position: { x: 100, y: 50 } });
  api.select([r1, r2]);
  __result = { r1: r1, r2: r2 };
})();
`;
  await runScriptWithResult(script, cfg);
  const implCode = fs.readFileSync('C:/Users/khada/.gemini/antigravity/scratch/ae-cavalry-effects/effects/null-object/implementation.js', 'utf8');
  const res = await runScriptWithResult(implCode, cfg);
  console.log('NULL APPLY RESULT:', JSON.stringify(res, null, 2));

  // Check parent
  const check = await runScriptWithResult(`
(function() {
  var sel = api.getSelection();
  var nullId = sel[0];
  var layers = api.getCompLayers(false);
  var pMap = {};
  for (var i = 0; i < layers.length; i++) {
    pMap[layers[i]] = api.getParent(layers[i]);
  }
  for (var i = 0; i < layers.length; i++) try { api.deleteLayer(layers[i]); } catch (e) {}
  __result = { nullId: nullId, pMap: pMap };
})();
`, cfg);
  console.log('CHECK RESULT:', JSON.stringify(check, null, 2));
}

main().catch(console.error);
