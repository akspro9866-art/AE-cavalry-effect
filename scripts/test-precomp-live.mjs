import { pathToFileURL } from 'node:url';
import fs from 'node:fs';

const CAVALRY_MCP_STALLION = pathToFileURL('C:/Users/khada/cavalry-mcp/dist/bridge/stallion.js').href;

async function main() {
  const { runScriptWithResult, loadConfig } = await import(CAVALRY_MCP_STALLION);
  const cfg = loadConfig();

  const script = `
(function() {
  var r1 = api.primitive('rectangle', 'PreComp Target 1');
  var r2 = api.primitive('rectangle', 'PreComp Target 2');
  api.select([r1, r2]);
  __result = { r1: r1, r2: r2 };
})();
`;
  await runScriptWithResult(script, cfg);
  const implCode = fs.readFileSync('C:/Users/khada/.gemini/antigravity/scratch/ae-cavalry-effects/effects/pre-compose/implementation.js', 'utf8');
  const res = await runScriptWithResult(implCode, cfg);
  console.log('PRECOMP APPLY RESULT:', JSON.stringify(res, null, 2));

  await runScriptWithResult(`
(function() {
  var layers = api.getCompLayers(false);
  for (var i = 0; i < layers.length; i++) try { api.deleteLayer(layers[i]); } catch (e) {}
  __result = { cleaned: true };
})();
`, cfg);
}

main().catch(console.error);
