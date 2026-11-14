# SkSL Filter Template (`skslFilter`)

Use **SkSL Filter** (`skslFilter`) when an After Effects effect is an image/pixel-space filter, distortion, blur, glow, stylization, or procedural texture composited over arbitrary Cavalry layers (shapes, text, SVG imports, raster images, groups, precomps).

## Cavalry 2.8.0 Live-Verified Contract

- Node type: `'skslFilter'`
- Attributes present: `["matteApplyMode", "blendMode", "code", "id", "inputs", "mattes", "padding", "matteTileMode"]` (with `inputs.0` initially named `'n0'`)
- Code attribute: `'code'` (NOT `'expression'`)
- Attachment port: `api.connect(filterId, 'id', targetLayerId, 'filters')`
- Indexed port readback: `api.getInConnections` does not exist on live Cavalry 2.8.0; read wired filters via `api.getInConnection(targetId, 'filters.0')`..`'filters.15'`.
- Built-in shader preamble provided automatically by Cavalry:
  - `uniform float2 resolution;` — unpadded layer dimensions in pixels. **Do NOT redeclare `uniform float2 resolution;` in `code`**, or live Cavalry SkSL fails compilation!
  - Declare ONLY `uniform shader layer;` in the shader preamble.
- Coordinate space in live `skslFilter`:
  - `fragCoord` / `coord` has **origin `(0, 0)` at the layer center**, X in `[-W/2, +W/2]` left-to-right, and Y in `[-H/2, +H/2]` bottom-to-top (**`+Y` UP**).
  - Normalized `[0, 1]` UV is `clamp((fragCoord / resolution) + 0.5, 0.0, 1.0)` where `uv.y = 0` is bottom and `uv.y = 1` is top.
- FBO expansion (`Resize Layer`):
  - `api.set(filterId, { padding: { x: padPx, y: padPx } })` expands output pixels outward past the original layer box. Built-in `resolution` remains the unpadded `(W, H)` dimensions.
- Group behavior:
  - Wiring a filter onto a `group` runs the shader per child element in each child's local centered `(0, 0)` bounds. Apply directly to individual drawable layers or unified compounds/precomps when global coordinates across multiple shapes are required.
- SkSL compilation rules:
  - Avoid variable names that collide with shader built-ins (`resolution`, `size`). SkSL is case-sensitive, so AE-style unprefixed names (`Size`, `Amount`) are tolerated (and used by shipped effects), but for new effects prefer an effect prefix (`effAmount`, `tdSize`) for anything matching a known built-in case-insensitively (`offset`, `color`, `position`).
  - Declare exactly ONE `uniform shader` input (`layer`). A second shader uniform compiles but never binds on live Cavalry 2.8 (verified by render probe — see `references/cavalry-api.md`).
  - Prefer branchless SIMD math (`step`, `max`, `clamp`, `float4`) over conditional `if (m > 0.0)` inside noise kernels, avoid array lookups / `sin()` hashes, keep `for` bounds constant (`for (int i = 0; i < MAX; i++)`; a dynamic early-out `if (i >= activeTaps) break;` inside is fine — see `effects/gaussian-blur`), and prefer `log(x) / 0.69314718` over `log2(x)`.

## Dual Live + Mock Uniform Binding

1. **Live Cavalry 2.8.0 (`'inputs'` present)**:
   - Reuse `inputs.0` (`renameAttribute(id, 'inputs.0', name)`) and add additional parameters with `api.addDynamic(id, 'inputs', 'double')` + `api.renameAttribute(id, slot, name)` + `api.set(id, { [slot]: value })`.
   - Cavalry automatically injects `uniform float <name>;` for every `inputs.*` entry before compiling `code`. Therefore the applicator **strips `uniform float <name>;` lines** before writing `code` to live `skslFilter` (keeping them in the standalone `.sksl` file so `validateSkslSource` and Stallion Mock pass identically).
   - Keyframe `inputs.<idx>` via `api.keyframe(filterId, frame, { 'inputs.6': val })`.
2. **Stallion Mock / Fallback**:
   - Write full `.sksl` source first so Mock parses `uniform float <name>;` into `uniforms.<name>` and keyframe against `uniforms.<name>`. If dynamic attributes are unavailable in any context, bake `const float <name> = ...;`.
