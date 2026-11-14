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
  var rect = api.primitive('rectangle', 'Probe Connect');
  var filter = api.create('skslFilter', comp);
  api.setName(filter, 'Deep Glow Test');
  api.connect(filter, 'id', rect, 'filters');

  var conn1 = api.getConnected(rect, 'filters');
  var conn2 = api.getConnected(filter, 'id');
  var type1 = typeof api.getType === 'function' ? api.getType(filter) : 'no getType';
  var layerType = typeof api.getLayerType === 'function' ? api.getLayerType(filter) : 'no getLayerType';
  var name1 = typeof api.getName === 'function' ? api.getName(filter) : 'no getName';

  api.deleteLayer(rect);
  api.deleteLayer(filter);

  __result = { conn1: conn1, conn2: conn2, type1: type1, layerType: layerType, name1: name1 };
})();
`;

  const res = await runScriptWithResult(script, cfg);
  console.log('CONNECT PROBE:', res);
}

main().catch(console.error);
