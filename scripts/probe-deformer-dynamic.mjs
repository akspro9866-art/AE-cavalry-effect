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
  var def = api.create('javaScriptDeformer', comp);

  var r0 = api.addDynamic(def, 'array', 'double');
  api.renameAttribute(def, r0, 'Displacement');

  var r1 = api.addDynamic(def, 'array', 'double2');
  api.renameAttribute(def, r1, 'Offset');

  var r2 = api.addDynamic(def, 'array', 'bool');
  api.renameAttribute(def, r2, 'CycleEvolution');

  var names = [
    api.getCustomAttributeName(def, r0),
    api.getCustomAttributeName(def, r1),
    api.getCustomAttributeName(def, r2)
  ];

  api.deleteLayer(def);
  __result = { r0: r0, r1: r1, r2: r2, names: names };
})();
`;

  const res = await runScriptWithResult(script, cfg);
  console.log('DEFORMER DYNAMIC RES:', JSON.stringify(res, null, 2));
}

main().catch(console.error);
