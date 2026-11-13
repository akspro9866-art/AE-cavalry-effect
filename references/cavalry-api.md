# Verified Cavalry 2.8.0 & Stallion Execution Reference

Sources verified from:
- `C:/Users/khada/cavalry-mcp/node_modules/@scenery/cavalry-types`
- `C:/Users/khada/.cavalry-mcp/cavalry-api-capabilities.json` (probed Cavalry `2.8.0`)
- `C:/Users/khada/cavalry-mcp/src/` and `C:/Users/khada/stallion/src/`

---

## 1. Stallion HTTP Protocol (`127.0.0.1:8080`)

Stallion runs inside Cavalry via `AppData/Roaming/Cavalry/Scripts/Stallion.js` (`api.WebServer` on `127.0.0.1:8080`, single response slot `GET /get`, single post queue `POST /post`).

### Supported `POST /post` Payloads (`stallion/src/cavalry/modules/Callbacks.ts`)
- `type: "script"`: wraps code in an undo group (`AI Motion Batch`, unless prefixed with `/* cavalry-mcp:atomic */` where caller manages undo), runs `RECEIPT_RUNTIME`, returns envelope `{ kind: "result", seq, ok, result?, error?, receipt?, state? }`.
- **"Send To Cavalry As..." expression/shader payloads** (`stallion/src/vscode/commands/postas.ts`, `Callbacks.ts` L467–511):
  - `javaScriptShape` → writes `generator.expression`
  - `skslFilter`, `skslShader` → writes `code`
  - `javaScriptDeformer`, `javaScript`, `javaScriptModifier`, `javaScriptEmitter` → writes `expression`
  - `renderSetupExpression`, `preRenderExpression`, `postRenderExpression` → writes attribute `[type]` on selected render queue items.
  - **Live host quirk (`Callbacks.ts` L468–495)**: live `handlePost` inspects `api.getSelection()` only and skips any selected layer whose `api.getLayerType(id) !== type` (creating one unattached node of `type` if selection is empty). It does **not** automatically attach an `skslFilter` or `javaScriptDeformer` to a selected shape layer (`basicShape`, `textShape`, etc.) — unlike the headless mock's `attachTo` test helper (`mock/server.ts` L655). Therefore, one-action application to arbitrary selected layers should execute a **selection-aware applicator `script`** through `cavalry_apply_dsl.script` or `stallion-cli.mjs`!
- Dedicated readback/render types: `state`, `layers`, `snapshot`, `snapshot-batch`, `render-frames`, `batch-step`, `batch_eval_and_capture`, `batch_inspect`, `checkpoint`, `rollback`, `render_frame_fast`.

---

## 2. MCP Server Modes & CLI (`cavalry-mcp`)

- Default `mcp_config.json` without `MCP_MODE` registers **compact tools**:
  - `cavalry_apply_dsl` (accepts `script`, `manifest`, `presets`, `sampleFrames`, `queryLayers`, `renderFrames`, `renderOutputDir`, `comp`)
  - `cavalry_search_presets`
  - `cavalry_inspect_compact`
  - Cloned-style tools (`list_cloned_styles`, `instantiate_cloned_style`, `sync_active_comp_to_cloned_style`)
- Setting `MCP_MODE="interactive_authoring"` enables `cavalry_batch`, `cavalry_verify_frames`, `cavalry_render_frames`, `cavalry_probe_api`, `cavalry_doctor` (`src/server/core-tools.ts`). Setting `ENABLE_LEGACY_TOOLS=true` adds `cavalry_run_script`, `cavalry_inspect`, `cavalry_layer_types`, etc.
- Zero-MCP CLI fallback (`node C:/Users/khada/cavalry-mcp/bin/stallion-cli.mjs`):
  - `-e "<js>"` / `-f <file.js>`
  - `--sel`
  - `--probe`
  - `--verify-frames 0,30,60 --scale 50`
  - `--render-frames 0-60 --out ./frames`

---

## 3. Verified Layer Types Present in Cavalry 2.8.0 (`cavalry-api-capabilities.json`)

- **Custom programmable nodes**:
  - `skslFilter` (connect via `api.connect(id, "id", targetId, "filters")`, code attr `"code"`)
  - `skslShader` (connect via `api.connect(id, "id", targetId, "material.shader")`, code attr `"code"`)
  - `javaScriptDeformer` (connect via `api.connect(id, "id", targetId, "deformers")`, code attr `"expression"`)
  - `javaScriptShape` (`"generator.expression"`)
  - `javaScript` (JavaScript Utility, `"expression"`)
- **Relevant native distort/blur/stylize/time nodes verified in 2.8.0 list**:
  - Filters: `distortionFilter`, `distortEdges`, `sceneGroup::bulgeFilter`, `sceneGroup::twistFilter`, `sceneGroup::rippleFilter`, `sceneGroup::spheriseFilter`, `sceneGroup::gaussianBlurFilter`, `sceneGroup::directionalBlurFilter`, `sceneGroup::boxBlurFilter`, `sceneGroup::zoomBlurFilter`, `blurFilter`, `glowFilter`, `dropShadowFilter`, `innerShadowFilter`, `sceneGroup::grainFilter`, `posterizeFilter`, `pixelateFilter`, `mirrorFilter`, `slitScanFilter`, `chromaticAberrationFilter`, `rgbSplitFilter`, `backgroundBlurFilter`, `luminanceBlur`
  - Deformers / Path / Procedural: `subdivide`, `resamplePath`, `curvesToLines`, `bevel`, `subMesh`, `align`, `noise`, `wave`, `bend`, `duplicator`, `stagger`, `falloff`, `oscillator`, `venetianBlinds`, `frame`, `localTime`, `noiseShader`
- **Important live Cavalry 2.8.0 node check**: `javaScript`, `javaScriptDeformer`, `javaScriptModifier`, and `skslFilter` all exist and instantiate cleanly via `api.create(...)` on live Cavalry 2.8.0 (`javaScriptDeformer` exposes `["array", "expression", "id"]`; `skslFilter` exposes `["matteApplyMode", "blendMode", "code", "id", "inputs", "mattes", "padding", "matteTileMode"]`). `javaScriptEmitter` was not present in the static capability dump — always probe live `api.create` / `api.getAllLayerTypes()` before assuming!

---

## 4. Execution Contexts & Globals (`@scenery/cavalry-types` + Live 2.8.0 Probes)

| Context | Payload Types | Allowed Globals | Notes |
| :--- | :--- | :--- | :--- |
| `script` | `script` | `api`, `cavalry`, `console`, `ui` | Full scene mutation + `_mg` / `_rb` when executed via `cavalry-mcp` / Stallion |
| `deformer` | `javaScriptDeformer` | `def`, `cavalry`, `ctx`, `console` | **No `api`, no `ui`.** Geometry via `def.getRootMesh()` -> `mesh.count()` / `mesh.getPathAtIndex(i)` -> `path.resample(len)` / `path.pathData()` / `path.setPathData(pd)` -> `mesh.setPathAtIndex(i, path)` -> `def.setRootMesh(mesh)`, plus `def.getFalloffAtPoint(x, y)` and `def.getBoundingBox()`. Note `path.toObject()` / `fromObject()` / `getPathDataAtIndex()` do **not** exist in 2.8.0! |
| `utility` | `javaScript` | `cavalry`, `ctx`, `console` | Drive animation via dynamic `array.*` attributes + keyframes / `frame` node wiring rather than assuming `ctx.frame` exists. |
| `shape` | `javaScriptShape` | `cavalry`, `ctx`, `console` | Returns `cavalry.Path` |
| `sksl` | `skslFilter`, `skslShader` | `half4 main(float2 coord)` | **Filter requires** `uniform shader layer;`. Built-in `uniform float2 resolution;` is **already injected by Cavalry's hidden preamble** (redeclaring it breaks live SkSL compile!). `coord` is **centered `(0, 0)`**, X in `[-W/2, +W/2]`, Y in `[-H/2, +H/2]` (**`+Y` UP**). Custom inputs use `inputs.0`..`inputs.N` (`api.addDynamic(id, 'inputs', 'double')` + `api.renameAttribute`), and live `code` must **omit** `uniform float <name>;` declarations because Cavalry auto-prepends them for `inputs.*`. |

---

## 5. Known Cavalry 2.8 API & SkSL Pitfalls

- `api.getName` does **not** exist -> always use `api.getNiceName(id)`.
- `api.getInConnections` does **not** exist on live Cavalry 2.8.0, and `api.getInConnection(targetId, 'filters')` returns empty -> read `'filters.0'`..`'filters.15'` (`api.getInConnection(targetId, 'filters.0')` -> `"skslFilter#1.id"`), and same for `'deformers.0'`.
- Shape fills live at `material.materialColor` and `material.alpha`.
- Text size is top-level `fontSize` (not `text.fontSize`).
- Ellipse dimensions use `generator.radius`, whereas rectangle uses `generator.dimensions`.
- Compound/color attributes (`position`, `scale`, `generator.dimensions`, `generator.radius`, `material.materialColor`, `stroke.strokeColor`) must each have their own `api.set(id, { ... })` call (or use `_mg.set`).
- `api.addDynamic(layerId, attrId, attrType)`:
  - Live `skslFilter` creates `inputs.0` initially named `'n0'`; call `api.renameAttribute(filterId, 'inputs.0', 'effVar')` first, then `api.addDynamic(filterId, 'inputs', 'double')` for additional uniforms (`inputs.1`, `inputs.2`, ...).
  - Live `javaScriptDeformer` uses `attrId = 'array'` (`array.0`, `array.1`, ...).
  - Avoid uniform/input variable names that collide with SkSL built-ins (`resolution`, `size`) — use effect-prefixed identifiers (`tdSize`, `tdAmount`, etc.).
- Live `skslFilter` FBO bounds (`padding: { x, y }`): setting `padding` expands output render dimensions beyond the layer bbox while keeping built-in `resolution` at unpadded layer dimensions `(W, H)`.
- Applying an `skslFilter` to a `group` evaluates the shader independently on each child layer in its own local centered coordinates. Use direct shape/text layers or unified compounds/precomps when global shared distortion coordinates are needed.
- SkSL GPU portability: avoid branching `if (m > 0.0)` inside multi-corner noise evaluators (use branchless SIMD `float4` `max`/`step`), avoid `log2()` (use `log(x) / 0.69314718`), and keep `for` loop bounds constant.
