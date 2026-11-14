import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { resolveProjectRoot, resolveCavalryMcpPath } from './lib/config.mjs';

const LIB_ROOT = resolveProjectRoot();

const CAVALRY_MCP_STALLION = pathToFileURL(path.join(resolveCavalryMcpPath() || '.', 'dist', 'bridge', 'stallion.js')).href;

async function main() {
  const { runScriptWithResult, runBatchStep, loadConfig } = await import(CAVALRY_MCP_STALLION);
  const cfg = loadConfig();

  const script = `
(function() {
  var comp = api.getActiveComp();
  var rect = api.primitive('rectangle', 'Probe RepeTile Target');
  api.set(rect, {
    'generator.dimensions': { x: 200, y: 150 },
    'material.materialColor': { r: 60, g: 160, b: 240, a: 255 }
  });

  var filter = api.create('skslFilter', comp);

  var specs = [
    { name: 'ExpandLeft', type: 'double', val: 200.0 },
    { name: 'ExpandRight', type: 'double', val: 200.0 },
    { name: 'ExpandUp', type: 'double', val: 150.0 },
    { name: 'ExpandDown', type: 'double', val: 150.0 },
    { name: 'Tiling', type: 'double', val: 1.0 }, // 1 = Flip
    { name: 'BlendBorders', type: 'double', val: 0.0 }
  ];

  for (var i = 0; i < specs.length; i++) {
    var sp = specs[i];
    var slot = (i === 0) ? 'inputs.0' : api.addDynamic(filter, 'inputs', sp.type);
    api.renameAttribute(filter, slot, sp.name);
    var p = {};
    p[slot] = sp.val;
    api.set(filter, p);
  }

  var code =
    'half4 main(float2 fragCoord) {' +
    '  float2 res = max(resolution, float2(1.0, 1.0));' +
    '  float2 uv = (fragCoord / res) + float2(0.5);' +
    '  float2 mappedUv = uv;' +
    '  if (Tiling < 0.5) {' +
    '    mappedUv = fract(uv);' +
    '  } else if (Tiling < 1.5) {' + // Flip / Ping-Pong
    '    float2 k = floor(uv);' +
    '    float2 f = fract(uv);' +
    '    mappedUv.x = (mod(k.x, 2.0) == 0.0) ? f.x : (1.0 - f.x);' +
    '    mappedUv.y = (mod(k.y, 2.0) == 0.0) ? f.y : (1.0 - f.y);' +
    '  } else if (Tiling < 2.5) {' + // Brick
    '    float ky = floor(uv.y);' +
    '    float shift = (mod(ky, 2.0) == 0.0) ? 0.0 : 0.5;' +
    '    mappedUv = fract(float2(uv.x + shift, uv.y));' +
    '  }' +
    '  float2 sampleCoord = (mappedUv - float2(0.5)) * res;' +
    '  return layer.eval(sampleCoord);' +
    '}';

  api.set(filter, { code: code, padding: { x: 200, y: 150 } });
  api.connect(filter, 'id', rect, 'filters');
  api.select([rect]);

  __result = { filter: filter, rect: rect };
})();
`;

  const setupRes = await runScriptWithResult(script, cfg);
  console.log('REPETILE SETUP:', setupRes.status);

  const step = await runBatchStep({
    script: '/* render repetile */',
    sampleFrames: [0],
    renderFrames: true,
    renderOutputDir: LIB_ROOT + '/artifacts/probe-repetile'
  }, cfg);
  console.log('REPETILE RENDER OK:', step.ok);

  await runScriptWithResult(`
(function() {
  var layers = api.getCompLayers(false);
  for (var i = 0; i < layers.length; i++) try { api.deleteLayer(layers[i]); } catch (e) {}
  __result = { cleaned: true };
})();
`, cfg);
}

main().catch(console.error);
