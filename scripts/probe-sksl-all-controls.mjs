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
    { name: 'Displacement', type: 'double', val: 0 },
    { name: 'Amount', type: 'double', val: 50 },
    { name: 'Size', type: 'double', val: 100 },
    { name: 'Offset', type: 'double2', val: { x: 0, y: 0 } },
    { name: 'Complexity', type: 'double', val: 1.0 },
    { name: 'Evolution', type: 'double', val: 0 },
    { name: 'CycleEvolution', type: 'bool', val: false },
    { name: 'CycleRevolutions', type: 'double', val: 1 },
    { name: 'RandomSeed', type: 'double', val: 0 },
    { name: 'Pinning', type: 'double', val: 0 },
    { name: 'ResizeLayer', type: 'bool', val: true },
    { name: 'Antialiasing', type: 'double', val: 0 }
  ];

  var slots = [];
  for (var i = 0; i < specs.length; i++) {
    var sp = specs[i];
    var slot = null;
    if (i === 0) {
      // inputs.0 already exists as double
      slot = 'inputs.0';
    } else {
      slot = api.addDynamic(filter, 'inputs', sp.type);
    }
    api.renameAttribute(filter, slot, sp.name);
    var p = {};
    p[slot] = sp.val;
    api.set(filter, p);
    slots.push({
      slot: slot,
      name: api.getCustomAttributeName(filter, slot),
      val: api.get(filter, slot)
    });
  }

  api.deleteLayer(filter);
  __result = slots;
})();
`;

  const res = await runScriptWithResult(script, cfg);
  console.log('RESULT:', JSON.stringify(res, null, 2));
}

main().catch(console.error);
