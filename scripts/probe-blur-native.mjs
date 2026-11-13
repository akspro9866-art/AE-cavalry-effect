import { pathToFileURL } from 'node:url';

const CAVALRY_MCP_STALLION = pathToFileURL('C:/Users/khada/cavalry-mcp/dist/bridge/stallion.js').href;

async function main() {
  const { runScriptWithResult, loadConfig } = await import(CAVALRY_MCP_STALLION);
  const cfg = loadConfig();

  const script = `
(function() {
  var comp = api.getActiveComp();
  
  var blurTypes = ['blurFilter', 'sceneGroup::gaussianBlurFilter', 'gaussianBlurFilter', 'sceneGroup::boxBlurFilter'];
  var results = {};
  for (var i = 0; i < blurTypes.length; i++) {
    var t = blurTypes[i];
    try {
      var id = api.create(t, comp);
      results[t] = {
        ok: true,
        id: id,
        type: typeof api.getLayerType === 'function' ? api.getLayerType(id) : '',
        attrs: api.getAttributes(id)
      };
      api.deleteLayer(id);
    } catch (e) {
      results[t] = { ok: false, error: e.message };
    }
  }

  __result = results;
})();
`;

  const res = await runScriptWithResult(script, cfg);
  console.log('BLUR PROBE RESULT:', JSON.stringify(res, null, 2));
}

main().catch(console.error);
