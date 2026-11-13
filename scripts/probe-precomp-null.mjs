import { pathToFileURL } from 'node:url';

const CAVALRY_MCP_STALLION = pathToFileURL('C:/Users/khada/cavalry-mcp/dist/bridge/stallion.js').href;

async function main() {
  const { runScriptWithResult, loadConfig } = await import(CAVALRY_MCP_STALLION);
  const cfg = loadConfig();

  const script = `
(function() {
  var comp = api.getActiveComp();
  
  // 1. Test Null creation and parenting
  var r1 = api.primitive('rectangle', 'Child 1');
  var r2 = api.primitive('rectangle', 'Child 2');
  var nullNode = api.create('null', 'AE Null 1');
  
  var parentRes1 = api.parent(r1, nullNode);
  var parentRes2 = api.parent(r2, nullNode);
  var p1 = api.getParent(r1);
  var p2 = api.getParent(r2);

  // 2. Test preCompose
  var r3 = api.primitive('rectangle', 'PreComp Child 1');
  var r4 = api.primitive('rectangle', 'PreComp Child 2');
  api.select([r3, r4]);
  
  var preCompResult = null;
  var preCompError = null;
  try {
    preCompResult = api.preCompose([r3, r4], 'My PreComp');
  } catch (e) {
    try {
      preCompResult = api.preCompose([r3, r4]);
    } catch (e2) {
      preCompError = e2.message;
    }
  }

  // Clean up
  var allLayers = api.getCompLayers(false);
  for (var i = 0; i < allLayers.length; i++) {
    try { api.deleteLayer(allLayers[i]); } catch (e) {}
  }

  __result = {
    nullParenting: {
      nullId: nullNode,
      p1: p1,
      p2: p2,
      parentRes1: parentRes1
    },
    preComp: {
      result: preCompResult,
      error: preCompError
    }
  };
})();
`;

  const res = await runScriptWithResult(script, cfg);
  console.log('PROBE RESULTS:', JSON.stringify(res, null, 2));
}

main().catch(console.error);
