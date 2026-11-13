import { pathToFileURL } from 'node:url';

const CAVALRY_MCP_STALLION = pathToFileURL('C:/Users/khada/cavalry-mcp/dist/bridge/stallion.js').href;

async function main() {
  const { runScriptWithResult, loadConfig } = await import(CAVALRY_MCP_STALLION);
  const cfg = loadConfig();

  const script = `
(function() {
  var comp = api.getActiveComp();
  var filter = api.create('skslFilter', comp);

  var specs = [
    { name: 'Radius', type: 'double', val: 120.0 },
    { name: 'Exposure', type: 'double', val: 1.0 },
    { name: 'Threshold', type: 'double', val: 0.0 },
    { name: 'ThresholdSmooth', type: 'double', val: 0.1 },
    { name: 'SaturationBias', type: 'double', val: 0.0 },
    { name: 'AspectRatio', type: 'double', val: 1.0 },
    { name: 'AspectAngle', type: 'double', val: 0.0 },
    { name: 'Aberration', type: 'double', val: 0.0 },
    { name: 'GlowMode', type: 'double', val: 0.0 },
    { name: 'BlendMode', type: 'double', val: 0.0 },
    { name: 'TintMode', type: 'double', val: 0.0 },
    { name: 'TintColor', type: 'color', val: { r: 255, g: 200, b: 120, a: 255 } },
    { name: 'TintColorOuter', type: 'color', val: { r: 50, g: 150, b: 255, a: 255 } },
    { name: 'TintBlendMode', type: 'double', val: 1.0 },
    { name: 'TintStrength', type: 'double', val: 1.0 },
    { name: 'ToneMapMode', type: 'double', val: 0.0 },
    { name: 'SourceOpacity', type: 'double', val: 1.0 }
  ];

  var slots = [];
  for (var i = 0; i < specs.length; i++) {
    var sp = specs[i];
    var slot = (i === 0) ? 'inputs.0' : api.addDynamic(filter, 'inputs', sp.type);
    api.renameAttribute(filter, slot, sp.name);
    var p = {};
    p[slot] = sp.val;
    api.set(filter, p);
    slots.push({ slot: slot, name: api.getCustomAttributeName(filter, slot), type: sp.type });
  }

  api.deleteLayer(filter);
  __result = slots;
})();
`;

  const res = await runScriptWithResult(script, cfg);
  console.log('SLOTS RESULT:', JSON.stringify(res, null, 2));
}

main().catch(console.error);
