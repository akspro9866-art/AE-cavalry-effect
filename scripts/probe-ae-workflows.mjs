import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { resolveProjectRoot, resolveCavalryMcpPath } from './lib/config.mjs';

const LIB_ROOT = resolveProjectRoot();

const CAVALRY_MCP_STALLION = pathToFileURL(path.join(resolveCavalryMcpPath() || '.', 'dist', 'bridge', 'stallion.js')).href;

async function main() {
  const { runScriptWithResult, loadConfig } = await import(CAVALRY_MCP_STALLION);
  const cfg = loadConfig();

  const script = `
(function() {
  var comp = api.getActiveComp();

  var nullCandidates = ['null', 'locator', 'group', 'nullShape', 'transform', 'basicShape'];
  var createdNodes = {};
  for (var i = 0; i < nullCandidates.length; i++) {
    var type = nullCandidates[i];
    try {
      var id = api.create(type, comp);
      createdNodes[type] = {
        ok: true,
        id: id,
        layerType: typeof api.getLayerType === 'function' ? api.getLayerType(id) : '',
        attrs: api.getAttributes(id)
      };
      api.deleteLayer(id);
    } catch (e) {
      createdNodes[type] = { ok: false, error: e.message };
    }
  }

  // PreComp probe
  var preCompInfo = {};
  try {
    var pcId = api.create('preComp', comp);
    preCompInfo = {
      ok: true,
      id: pcId,
      attrs: api.getAttributes(pcId)
    };
    api.deleteLayer(pcId);
  } catch (e) {
    preCompInfo = { ok: false, error: e.message };
  }

  // Group probe
  var groupInfo = {};
  try {
    var gId = api.create('group', comp);
    groupInfo = {
      ok: true,
      id: gId,
      attrs: api.getAttributes(gId)
    };
    api.deleteLayer(gId);
  } catch (e) {
    groupInfo = { ok: false, error: e.message };
  }

  // Probe API methods
  var apiKeys = [];
  for (var k in api) {
    apiKeys.push(k);
  }
  var matchingMethods = apiKeys.filter(function(k) {
    return /precomp|group|parent|nest|null|comp|layer|filter|render|mask/i.test(k);
  });

  __result = {
    nullCandidates: createdNodes,
    preCompInfo: preCompInfo,
    groupInfo: groupInfo,
    matchingMethods: matchingMethods
  };
})();
`;

  const res = await runScriptWithResult(script, cfg);
  console.log('WORKFLOW PROBE RESULT:', JSON.stringify(res, null, 2));
}

main().catch(console.error);
