// Explicit live-Cavalry opt-in gate: hosted runners never touch port 8080.
// The dedicated workflow_dispatch `live-verify` job sets CAVALRY_LIVE=true;
// without the gate this script exits 0 with a skip message so headless CI
// can neither hang nor fail on connection refused.
if (process.env.CAVALRY_LIVE !== 'true') {
    console.log('Live verification skipped: CAVALRY_LIVE !== "true" (set the env var, or run the workflow_dispatch live-verify job).');
    process.exit(0);
}
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { resolveProjectRoot, resolveCavalryMcpPath } from './lib/config.mjs';
import fs from 'node:fs';

const LIB_ROOT = resolveProjectRoot();

const CAVALRY_MCP_STALLION = pathToFileURL(path.join(resolveCavalryMcpPath() || '.', 'dist', 'bridge', 'stallion.js')).href;

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
  const implCode = fs.readFileSync(LIB_ROOT + '/effects/pre-compose/implementation.js', 'utf8');
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
