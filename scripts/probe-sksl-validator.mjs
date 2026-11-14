import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { resolveProjectRoot, resolveCavalryMcpPath } from './lib/config.mjs';

const LIB_ROOT = resolveProjectRoot();

const CAVALRY_MCP_STALLION = pathToFileURL(path.join(resolveCavalryMcpPath() || '.', 'dist', 'bridge', 'stallion.js')).href;

async function main() {
  const { validateSkslSource } = await import(CAVALRY_MCP_STALLION);
  const testSksl = `
uniform float Displacement;
uniform float Amount;
uniform float Size;
uniform float2 Offset;
uniform float Complexity;
uniform float Evolution;
uniform bool CycleEvolution;
uniform float CycleRevolutions;
uniform float RandomSeed;
uniform float Pinning;
uniform bool ResizeLayer;
uniform float Antialiasing;

half4 main(float2 coord) {
  return layer.eval(coord);
}
`;
  console.log('VALIDATION RESULT:', JSON.stringify(validateSkslSource(testSksl), null, 2));
}

main().catch(console.error);
