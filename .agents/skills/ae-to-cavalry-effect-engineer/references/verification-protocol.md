# Honest Testing & Verification Protocol

Every effect in `ae-cavalry-effects` must record its exact verification tier in `test-report.md` and `effect-registry.json`. Never upgrade verification status without executing the real checks below.

## Tier 1 — Static & Context Validation (Offline, Mandatory)

- Run Stallion & `cavalry-mcp` validators:
  - `validateSkslSource(code)` for every `.sksl` file: balanced braces, valid `half4|float4|vec4 main(...)`, valid uniform declarations.
  - `validateCavalryContextUsage(code, targetType)` for every `.js` expression (`javaScriptDeformer`, `javaScript`, `script`).
- Verify `parameter-map.json` defaults, ranges, and `effect-registry.json` metadata parse cleanly and stay synchronized with `implementation.js`.

## Tier 2 — Mathematical Invariants (Offline Unit Suite, Mandatory)

- Execute `node --test test/<effect>.test.mjs`:
  - Identity / zero-strength invariant (`Amount == 0` produces `0` displacement / unaltered output).
  - Boundary / pinning invariants (pinned edges produce zero normal/total offset at borders).
  - Periodic evolution invariants (`Cycle Evolution == true` produces identical field at `0` and `360 * N` degrees to float tolerance).
  - Mode-specific physics invariants (e.g. horizontal mode has `dy == 0`, vertical mode has `dx == 0`, directional curl/gradient behavior, finite outputs for extreme edge parameters like tiny/huge `Size` or non-integer `Complexity`).

## Tier 3 — Headless Stallion Mock Scene Integration (Offline, Mandatory)

- Execute tests against `stallion/dist/stallion-mock.mjs` (`startMockServer`):
  1. Empty selection fails gracefully with `{ ok: false }` and does not corrupt the scene.
  2. Applying to a selected layer attaches the exact effect node without destroying or replacing the user's selected object, preserves selection, and writes valid attributes/expressions.
  3. Repeat invocation updates existing `[AE:<slug>]` node(s) idempotently (layer count does not grow!).
  4. Animation keyframes apply cleanly to the bound evolution/phase attribute across multiple frames (`0`, `30`, `60`).
- **Explicit Disclaimer:** Mock execution proves scene-graph wiring, selection handling, idempotency, and API compatibility only. Mock's `raster.ts` does NOT evaluate SkSL shaders or JavaScript Deformer meshes visually.

## Tier 4 — Live Cavalry Runtime & Visual Parity (Only When `127.0.0.1:8080` Is Reachable)

Run `node scripts/verify-effect.mjs <slug>` (or `cavalry_apply_dsl` / `cavalry_inspect_compact` / `cavalry_render_frames` / `cavalry_verify_frames`):

1. Probe live bridge health (`runDoctor({ probeRuntime: true })` / `GET /get`).
2. Record initial scene state (`cavalry_inspect_compact`).
3. Create/select reference test subject (or use user's selection) and apply `implementation.js`.
4. Read back scene graph (`cavalry_inspect_compact`) confirming attached node(s), shader compilation diagnostics (zero SkSL compile errors!), and updated attributes.
5. Render frames at multiple timestamps (e.g. frames `0`, `15`, `30`, `60`) and across parameter sweeps (`Amount`, `Size`, `Displacement`, `Pinning`, `Antialiasing`).
6. Inspect actual PNG images directly and compare against documented AE behavior / reference renders.
7. Save real observed output into `effects/<slug>/test-report.md`.
8. Ensure `syncCavalryScript()` updates `cavalry-script/AE Effects.js` and deploys to Cavalry's Scripts folder (`%APPDATA%\Cavalry\Scripts\AE Effects.js`), and validate the updated script with `validateCavalryContextUsage(..., 'script')`.

**If live Cavalry (`127.0.0.1:8080`) does not respond:** STOP live verification honestly, log the exact connection error (`ECONNREFUSED`), and label Tier 4 **UNVERIFIED (Live Cavalry Offline)**.
