import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { resolveProjectRoot, resolveCavalryMcpPath } from './lib/config.mjs';
import fs from 'node:fs';

const LIB_ROOT = resolveProjectRoot();

const CAVALRY_MCP_STALLION = pathToFileURL(path.join(resolveCavalryMcpPath() || '.', 'dist', 'bridge', 'stallion.js')).href;

async function main() {
  const { runScriptWithResult, runBatchStep, loadConfig } = await import(CAVALRY_MCP_STALLION);
  const cfg = loadConfig();

  // Read current turbulent-displace.sksl and adapt uniform names
  let sksl = fs.readFileSync(LIB_ROOT + '/effects/turbulent-displace/turbulent-displace.sksl', 'utf8');

  // Replace td* with clean uniform names
  sksl = sksl.replace(/uniform float tdDisp;/, 'uniform float Displacement;');
  sksl = sksl.replace(/uniform float tdAmount;/, 'uniform float Amount;');
  sksl = sksl.replace(/uniform float tdSize;/, 'uniform float Size;');
  sksl = sksl.replace(/uniform float tdOffsetX;\r?\nuniform float tdOffsetY;/, 'uniform float2 Offset;');
  sksl = sksl.replace(/uniform float tdComplexity;/, 'uniform float Complexity;');
  sksl = sksl.replace(/uniform float tdEvolution;/, 'uniform float Evolution;');
  sksl = sksl.replace(/uniform float tdCycleEvo;/, 'uniform bool CycleEvolution;');
  sksl = sksl.replace(/uniform float tdCycleRevs;/, 'uniform float CycleRevolutions;');
  sksl = sksl.replace(/uniform float tdRandomSeed;/, 'uniform float RandomSeed;');
  sksl = sksl.replace(/uniform float tdPinning;/, 'uniform float Pinning;');
  sksl = sksl.replace(/uniform float tdAntialiasing;/, 'uniform bool ResizeLayer;\nuniform float Antialiasing;');

  // In shader body, replace usages:
  sksl = sksl.replace(/\btdDisp\b/g, 'Displacement');
  sksl = sksl.replace(/\btdAmount\b/g, 'Amount');
  sksl = sksl.replace(/\btdSize\b/g, 'Size');
  sksl = sksl.replace(/float2 center = float2\(tdOffsetX, tdOffsetY\);/, 'float2 center = Offset;');
  sksl = sksl.replace(/\btdComplexity\b/g, 'Complexity');
  sksl = sksl.replace(/\btdEvolution\b/g, 'Evolution');
  sksl = sksl.replace(/if \(tdCycleEvo >= 0\.5\)/, 'if (CycleEvolution)');
  sksl = sksl.replace(/\btdCycleRevs\b/g, 'CycleRevolutions');
  sksl = sksl.replace(/\btdRandomSeed\b/g, 'RandomSeed');
  sksl = sksl.replace(/\btdPinning\b/g, 'Pinning');
  sksl = sksl.replace(/\btdAntialiasing\b/g, 'Antialiasing');

  // Fix Horizontal Displacement (6) vs Vertical Displacement (7)
  sksl = sksl.replace(
    /} else if \(baseMode < 6\.5\) \{\r?\n\s*rawDisp = float2\(0\.0, sumB\);\r?\n\s*\} else if \(baseMode < 7\.5\) \{\r?\n\s*rawDisp = float2\(sumAx, 0\.0\);/,
    '} else if (baseMode < 6.5) {\n        rawDisp = float2(sumAx, 0.0); // 6 = Horizontal Displacement\n    } else if (baseMode < 7.5) {\n        rawDisp = float2(0.0, sumB);  // 7 = Vertical Displacement'
  );

  // Strip uniform declarations when passing to live filter code, as live Cavalry injects them
  const liveCode = sksl.replace(/^\s*uniform\s+(?:float|float2|bool)\s+[A-Za-z0-9_]+\s*;\s*(?:\r?\n)?/gm, '');

  const script = `
(function() {
  var comp = api.getActiveComp();
  var rect = api.primitive('rectangle', 'Probe Shader Test');
  api.set(rect, {
    'generator.dimensions': { x: 220, y: 220 },
    'material.materialColor': { r: 242, g: 130, b: 42, a: 255 }
  });

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

  for (var i = 0; i < specs.length; i++) {
    var sp = specs[i];
    var slot = (i === 0) ? 'inputs.0' : api.addDynamic(filter, 'inputs', sp.type);
    api.renameAttribute(filter, slot, sp.name);
    var p = {};
    p[slot] = sp.val;
    api.set(filter, p);
  }

  api.set(filter, { code: ${JSON.stringify(liveCode)}, padding: { x: 80, y: 80 } });
  api.connect(filter, 'id', rect, 'filters');
  api.select([rect]);

  __result = { filter: filter, rect: rect };
})();
`;

  const setupRes = await runScriptWithResult(script, cfg);
  console.log('SETUP RES:', setupRes);

  const step = await runBatchStep({
    script: '/* render */',
    sampleFrames: [0],
    renderFrames: true,
    renderOutputDir: LIB_ROOT + '/artifacts/probe-test'
  }, cfg);
  console.log('RENDER STEP STATUS:', step.ok);

  // Clean up
  await runScriptWithResult(`
(function() {
  var layers = api.getCompLayers(false);
  for (var i = 0; i < layers.length; i++) try { api.deleteLayer(layers[i]); } catch (e) {}
  __result = { cleaned: true };
})();
`, cfg);
}

main().catch(console.error);
