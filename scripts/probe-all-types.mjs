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
  var allTypes = api.getAllLayerTypes ? api.getAllLayerTypes(true) : [];
  var filterTypes = allTypes.filter(t => /adjust|filter|comp|null|tile|repeat/i.test(t));
  __result = {
    filterTypes: filterTypes,
    totalTypes: allTypes.length
  };
})();
`;

  const res = await runScriptWithResult(script, cfg);
  console.log('TYPES RESULT:', JSON.stringify(res, null, 2));
}

main().catch(console.error);
