# Architecture Map: `cavalry-mcp` + `stallion` + `ae-cavalry-effects`

## Three-Layer System Overview

1. **Effect Library (`C:/Users/khada/.gemini/antigravity/scratch/ae-cavalry-effects`)**
   - `effect-registry.json`: canonical index of implemented effects, versions, mechanisms, and verification status.
   - `effects/<slug>/`: math specs (`technical-notes.md`), AE mapping (`parameter-map.json`), runtime shaders/deformers, idempotent `implementation.js`, `SKILL.md`, `README.md`, `test-report.md`.
   - `templates/`: verified starters for `sksl-filter`, `javascript-deformer`, `javascript-modifier`, `procedural-rig`.
   - `scripts/apply-effect.mjs` & `scripts/verify-effect.mjs`: thin wrappers invoking `stallion` HTTP / mock bridge and `cavalry-mcp` validators — **not** a second HTTP server.

2. **HTTP & Script Execution Bridge (`C:/Users/khada/stallion`)**
   - Cavalry runs `Scripts > Stallion` UI module (`Stallion.js` built from `src/cavalry/`), hosting a WebServer on `http://127.0.0.1:8080` (`/get` poll response, `/post` command submission).
   - Built-in `_mg` and `_rb` runtimes are preloaded when `helpers: true` is passed to `POST /post` (`type: 'script'`).
   - Script result capture: `#wrapped` executes `(function () { ... })()` inside `api.exec(...)`; setting `__result = obj` or `return obj` captures serialized JSON on `runScriptWithResult`, while `runBatchStep` prioritizes rendering + frame sampling cleanly (prefer calling `runScriptWithResult` when reading back structured JSON apply receipts).
   - Live Cavalry `skslFilter` dynamic inputs & shader preamble: `skslFilter` injects built-in `resolution` (do not declare `uniform float2 resolution;`), centers `coord` at `(0,0)` with `+Y` UP, exposes dynamic sliders on `inputs.0..N` (`api.addDynamic(id, 'inputs', 'double')` + `api.renameAttribute`), auto-prepends `uniform float <name>;` (strip explicit `uniform float` lines for live `code`), supports `padding: { x, y }`, and stores connections at indexed ports (`filters.0`, `deformers.0`).
   - Built-in `'Send To Cavalry As'` (`type: 'javaScriptDeformer' | 'javaScriptShape' | 'javaScriptModifier' | 'javaScript' | 'skslFilter' | 'skslShader'`, routed by `Callbacks.ts` `#handlePost` L467-511): reads `api.getSelection()`, sets `expression` / `generator.expression` / `code` on already-selected matching nodes, or creates one new unattached node if empty. **Important:** it does **not** create & wire a new `skslFilter` / `javaScriptDeformer` onto a selected `rectangleShape`/`textShape`! For attached effects on arbitrary selected shapes, send `type: 'script'` running an idempotent `implementation.js`.
   - Introspection payloads on `/post`: `state`, `layers`, `snapshot`, `snapshot-batch`, `batch-step`, `batch-inspect`, `render-frames`, `checkpoint`, `rollback`, `render-frame-fast`.

3. **MCP Server, Knowledge & Tooling (`C:/Users/khada/cavalry-mcp`)**
   - Connects to Stallion on `http://127.0.0.1:8080` (`STALLION_URL` overrides).
   - Modes (`MCP_MODE`):
     - `headless_verify` (default when env unset): exposes compact `cavalry_apply_dsl`, `cavalry_inspect_compact`, `list_cloned_styles`, `instantiate_cloned_style`, `sync_active_comp_to_cloned_style`, `cavalry_search_presets`. Note `cavalry_apply_dsl` supports `script`, `renderFrames`, `renderOutputDir`, `sampleFrames`, `queryLayers`.
     - `interactive_authoring`: adds `cavalry_probe_api`, `cavalry_render_frames`, `cavalry_verify_frames`, `cavalry_inspect`, `cavalry_run_script`, etc.
     - Legacy/extra tools gated behind `ENABLE_LEGACY_TOOLS=1`.
   - Validators ready to reuse offline:
     - `validateCavalryContextUsage(code, type)` (`cavalry-mcp/src/bridge/stallion.ts` & `stallion/src/mock/receipt.ts`)
     - `validateSkslSource(code)` (`cavalry-mcp/src/bridge/stallion.ts` & `stallion/src/mock/receipt.ts`)
     - `runDoctor({ probeRuntime })` (`cavalry-mcp/src/doctor.ts`)
     - Offline headless mock server: `startMockServer()` (`stallion/dist/stallion-mock.mjs`)
