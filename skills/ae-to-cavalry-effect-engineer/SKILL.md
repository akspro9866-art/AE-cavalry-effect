---
name: ae-to-cavalry-effect-engineer
description: Automatically converts Adobe After Effects effect names into mathematically reconstructed, tested, reusable Cavalry effects and applies them in one action to selected Cavalry objects via cavalry-mcp and Stallion. Activate whenever the user asks to create, replicate, convert, port, or apply an After Effects effect in Cavalry.
---

# After Effects → Cavalry Effect Engineer

Convert any Adobe After Effects effect name into a mathematically faithful, reusable, one-action Cavalry implementation using the existing `cavalry-mcp` (`<cavalry-mcp-install>`), `stallion` (`<stallion-install>`), and `ae-cavalry-effects` library (`<library-root>`).

Never rebuild `stallion` or `cavalry-mcp`. Never invent Cavalry APIs or Adobe proprietary claims. Never report mocked runs as live visual proof.

## Trigger & Registry Check First

When the user asks to create, convert, improve, or apply an After Effects effect (e.g., *"Create After Effects Turbulent Displace"*, *"Convert AE Repeater to Cavalry"*):

1. Normalize the effect name to `<slug>` and check `<library-root>\effect-registry.json`.
2. **If `<slug>` exists and is verified**: inspect `effects/<slug>/` first. If the user only asked to apply it or use it, run `implementation.js` (or `node scripts/apply-effect.mjs <slug>`) directly against the current Cavalry selection. Do **not** regenerate or overwrite a verified implementation unnecessarily. Version increments (`v1` -> `v2`) must preserve the previous verified working version.
3. **If `<slug>` is new**: run the 7-phase engineering pipeline below without asking the user to repeat instructions.

## Core Execution Pipeline

### Phase 1 — Inspect Scene & Live Availability

- Check live Cavalry (`127.0.0.1:8080` Stallion bridge) before promising live application:
  - Prefer existing MCP tools (`cavalry_inspect_compact`, `cavalry_apply_dsl`, `cavalry_search_presets`) when configured; in `headless_verify` mode, remember `cavalry_probe_api`, `cavalry_render_frames`, and `cavalry_verify_frames` may require `MCP_MODE=interactive_authoring` or direct Stallion CLI / `cavalry-mcp` runtime helpers.
  - Record initial selection (`api.getSelection()`), layer count, and target layer types/bounding boxes.
- Read [references/architecture-map.md](references/architecture-map.md) for exact HTTP endpoints, Stallion script wrappers, `_mg` helper availability, and Cavalry context rules.

### Phase 2 — Effect Research Specification

Research thoroughly before coding. Follow [references/effect-research-checklist.md](references/effect-research-checklist.md):

- Exact AE `matchName`, official Adobe parameter names, default values, parameter ranges, units, menus, evolution/cycle behavior, coordinate space (layer vs comp), edge/pinning rules, antialiasing, and vector vs raster semantics.
- Explicitly separate **Documented Adobe Behavior** from **Independent Mathematical Reconstruction** in `technical-notes.md`. Never claim access to Adobe's proprietary source code.

### Phase 3 — Choose Best Verified Cavalry Mechanism

Consult [references/implementation-strategies.md](references/implementation-strategies.md):

- Evaluate: Native Cavalry Nodes -> Procedural `_mg` Rig -> `skslFilter` -> `javaScriptDeformer` -> `javaScript` / `javaScriptModifier` -> `javaScriptShape` -> Hybrid.
- Verify every Cavalry node type and attribute against `<cavalry-mcp-install>/data/api_reference.json`, `node_modules/@scenery/cavalry-types`, or live `cavalry_probe_api`.
- Never use `uniform int` or `uniform bool` in `skslFilter` (use `uniform float`), never put `= value` on SkSL uniforms, and handle live `skslFilter` scripted uniform limitations with a clean runtime probe + constant-baking fallback when needed.
- Never reference `api`, `ui`, `render`, `plugin`, or `install` inside `javaScriptDeformer` (`deformer` context allows ONLY `console`, `ctx`, `cavalry`, `def`).

### Phase 4 — Author Package Under `effects/<slug>/`

Create or update `<library-root>\effects\<slug>\` with:

- `SKILL.md` — effect-specific usage, parameters, mode choice, and limitations.
- `README.md` — quick reference and parameter guide.
- `parameter-map.json` — AE matchNames/defaults mapped to Cavalry attributes/ranges.
- `technical-notes.md` — math derivation, coordinate space, fidelity comparison, and known gaps.
- Primary implementation file(s) (`<slug>.sksl`, `<slug>.deformer.js`, or rig script) plus `implementation.js` (selection-aware idempotent applicator returning `{ ok, applied, ... }`).
- Start from `<library-root>\templates\`.

### Phase 5 — One-Action Selection-Preserving Application

Every `implementation.js` MUST:

1. Read `api.getSelection()` first. Refuse cleanly with `{ ok: false, error: ... }` if empty (only create a fallback target when explicitly requested with `createTestTargetIfEmpty: true`).
2. Preserve the user's original selected object(s) and selection state (`api.select(selection)`).
3. Tag generated effect nodes cleanly (e.g. `[AE:<slug>] <layerName>`) and update existing tagged connections on repeat invocation (idempotent, no duplicate stacks).
4. Expose editable parameters cleanly and support animation (keyframes on Evolution/phase/progress parameters).
5. Wrap mutations in `api.startUndoGroup(...)` / `api.endUndoGroup()` safely inside `try/finally`.

### Phase 6 — Honest Verification

Follow [references/verification-protocol.md](references/verification-protocol.md):

1. Run `validateSkslSource` / `validateCavalryContextUsage` (`cavalry-mcp/src/bridge/stallion.ts` or `stallion/src/mock/receipt.ts`).
2. Run deterministic mathematical unit tests (`node --test test/*.test.mjs`).
3. Run Stallion headless mock tests (`stallion/dist/stallion-mock.mjs`) for scene wiring, selection preservation, idempotency, and keyframing — explicitly labeled **Mock Structural/API Verification Only**.
4. If live Cavalry (`127.0.0.1:8080`) responds: inspect initial state -> apply effect -> read back modified graph -> render multiple timestamps -> inspect PNG outputs visually.
5. If live Cavalry is offline: mark live runtime execution and visual equivalence as **UNVERIFIED (Live Cavalry Offline)** in `test-report.md` and final response.

### Phase 7 — Update Registry, Sync Cavalry `AE Effects` Script & Report

- Update `<library-root>\effect-registry.json` with version, status, implementation type, and verification state (`mock-verified` vs `live-verified`).
- Run `node <library-root>\scripts\sync-cavalry-script.mjs` (automatically executed by `scripts/verify-effect.mjs`) to rebuild `cavalry-script/AE Effects.js` and deploy it directly to Cavalry's Scripts folder (`Scripts -> AE Effects`) so the user can immediately 1-click the new effect on any selected layer while editing in Cavalry (clicking `Refresh` or selecting a layer hot-reloads an already-open panel via `effect-registry.json`).
- Write `effects/<slug>/test-report.md` summarizing actual commands executed, pass/fail counts, mathematical fidelity notes, and any AE-to-Cavalry divergences.
