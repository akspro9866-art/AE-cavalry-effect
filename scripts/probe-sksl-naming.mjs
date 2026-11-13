import { pathToFileURL } from 'node:url';

const CAVALRY_MCP_STALLION = pathToFileURL('C:/Users/khada/cavalry-mcp/dist/bridge/stallion.js').href;

async function main() {
  const { runScriptWithResult, loadConfig } = await import(CAVALRY_MCP_STALLION);
  const cfg = loadConfig();

  // Test what uniform Cavalry declares when renamed to:
  // 1) "Offset (Turbulence)"
  // 2) "Offset"
  // We can test by setting code to return a specific color based on the uniform
  const script = `
(function() {
  var comp = api.getActiveComp();
  var filter = api.create('skslFilter', comp);
  api.addDynamic(filter, 'inputs', 'double');
  api.renameAttribute(filter, 'inputs.0', 'Displacement');

  // Let's test with Displacement
  api.set(filter, { 'inputs.0': 7.0 });
  var val1 = api.get(filter, 'inputs.0');

  api.deleteLayer(filter);
  __result = { val1: val1 };
})();
`;

  const res = await runScriptWithResult(script, cfg);
  console.log('RESULT:', res);
}

main().catch(console.error);
