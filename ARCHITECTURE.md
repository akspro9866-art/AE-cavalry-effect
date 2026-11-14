# System Architecture & Design Specification

This document provides a comprehensive technical breakdown of the architecture, design patterns, verification tiers, and execution pipelines of `ae-effects-cavalry`.

---

## 1. System Overview

`ae-effects-cavalry` bridges Adobe After Effects visual workflows and mathematical models to Cavalry 2.8+, Scenery Ltd.'s 2D procedural motion design application.

Cavalry's architecture differs fundamentally from timeline-centric compositors:
- **Directed Acyclic Graph (DAG)**: Nodes in Cavalry are interconnected via typed ports (`id`, `filters`, `deformers`, dynamic attribute slots).
- **GPU SkSL Pipeline**: Fragment shaders execute via Google Skia's SkSL shader language, running in parallel across GPU execution cores.
- **Procedural Scripting API**: An embedded JavaScript engine (`api`) manages scene graph manipulation, node lifecycle, and undo transactions.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ae-effects-cavalry                              │
└────────────────────────────────────────────────────────────────────────┘
          │                                           │
          ▼                                           ▼
┌──────────────────┐                         ┌──────────────────┐
│   CLI / Node.js  │                         │ Standalone UI    │
│  Dev Environment │                         │   Cavalry Panel  │
│ (npm test, sync) │                         │ (AE Effects.js)  │
└──────────────────┘                         └──────────────────┘
          │                                           │
          │ Portable Bridge                           │ Zero-dependency
          ▼                                           ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          Cavalry 2.8+ Runtime                          │
│                                                                        │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │   GPU Shaders    │  │   JS Deformers   │  │ Native Workflows │      │
│  │   (skslFilter)   │  │   (JavaScript)   │  │  (Null, Group,   │      │
│  │                  │  │                  │  │   Pre-Compose)   │      │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Centralized Registry Architecture

The central source of truth for all effect metadata is `effect-registry.json` (Schema v1.1.0).

### Schema Specification

```json
{
  "slug": "gaussian-blur",
  "version": "1.0.0",
  "aeName": "Gaussian Blur",
  "aeMatchName": "ADBE Gaussian Blur 2",
  "aeCategory": "Blur & Sharpen",
  "status": "live-verified",
  "primaryStrategy": "sksl-filter",
  "metadata": {
    "requiresSelection": true,
    "supportsMultipleLayers": true,
    "supportsEmptySelection": false,
    "supportsAnimation": true,
    "supportsKeyframes": true
  },
  "artifacts": {
    "implementation": "effects/gaussian-blur/implementation.js",
    "sksl": "effects/gaussian-blur/gaussian-blur.sksl",
    "parameterMap": "effects/gaussian-blur/parameter-map.json"
  },
  "parameters": [ ... ]
}
```

### Invariant Synchronizers

To eliminate drift between raw source files and compiled distributions:
1. **`scripts/sync-embedded.mjs`**: Embeds raw `.sksl` and `.deformer.js` source strings directly into each effect's `implementation.js`.
2. **`scripts/sync-cavalry-script.mjs`**: Compiles all verified effects, catalog metadata, parameter definitions, and the GUI panel into a single, standalone, zero-dependency distribution file (`cavalry-script/AE Effects.js`).
3. **`scripts/sync-agent-configs.mjs`**: Generates and checks all AI-agent prompt and skill definitions across Qoder, ZCode, OpenCode, Antigravity, and Cursor from canonical templates.

---

## 3. Implementation Strategies

Effects in this library use one of three distinct architectural strategies:

### A. GPU SkSL Filters (`sksl-filter`)
- **Node**: `skslFilter`
- **Port**: Attached to the target layer's `filters` port via `api.connect(filterId, 'id', targetLayerId, 'filters')`.
- **Dynamic Slots**: Exposes editable parameters in the Cavalry Attribute Editor by provisioning dynamic attributes on the filter node (`api.addDynamicAttribute(filterId, ...)`) matching the uniform variables declared in the SkSL source code.
- **Effects**: All 32 raster filters including Gaussian Blur, Directional Blur, Fast Box Blur, Radial Blur, Sharpen, Levels, Curves, Exposure, Hue/Saturation, Color Balance, Tint, Posterize, Wave Warp, Turbulent Displace, CC RepeTile, Motion Tile, Displacement Map, CC Kaleida, Optics Compensation, Venetian Blinds, CC Light Sweep, Gradient Ramp, Glow, Deep Glow, Drop Shadow, Bevel Alpha, Mosaic, Find Edges, CC Ball Action, Fractal Noise, Echo, Time Displacement.

### B. JavaScript Deformers (`js-deformer`)
- **Node**: `javascriptDeformer`
- **Port**: Attached to the target layer's `deformers` port.
- **Execution**: Evaluates vertex displacement routines per frame against Cavalry's geometric `Mesh` and `Path.pathData()` structures.
- **Effects**: Turbulent Displace (geometric mesh mode).

### C. Native Composition Workflows (`native-workflow`)
- **Nodes**: Native scene graph elements (`null`, `group`, `compositionReference`).
- **Execution**: Manipulates scene hierarchy, bounding boxes, and nesting relationships directly via the Cavalry API.
- **Workflows**: Null Object, Adjustment Layer, Pre-Compose.

---

## 4. Standardized Error Handling & Result Contract

All effect implementations adhere to a structured, type-safe return schema defined in `scripts/lib/effect-runtime.mjs`:

```javascript
{
  ok: Boolean,              // True if at least one layer succeeded and no critical errors occurred
  effect: String,           // Human-readable effect name (e.g., "Gaussian Blur")
  code: String,             // Machine-readable status code
  appliedCount: Number,     // Count of successfully processed layers
  failedCount: Number,      // Count of failed layers
  partial: Boolean,         // True if some targets succeeded while others failed
  targetIds: Array<String>, // IDs of target layers
  results: Array<{          // Per-target diagnostic details
    targetId: String,
    ok: Boolean,
    error?: String,
    createdNodes?: Array<String>
  }>,
  warnings: Array<String>,  // Non-fatal warnings (e.g. non-renderable layers skipped)
  error?: String            // High-level failure description if ok is false
}
```

### Standardized Status Codes

- `SUCCESS`: All operations succeeded.
- `PARTIAL_SUCCESS`: Some targets succeeded, others failed or were skipped.
- `NO_SELECTION`: Required layer selection was missing.
- `NODE_CREATION_FAILED`: Cavalry API failed to instantiate a required node.
- `PARENTING_FAILED`: Node parenting operation could not be confirmed via `api.getParent()`.
- `GROUPING_FAILED`: Layer containment in adjustment group failed.
- `CONNECTION_FAILED`: Dynamic port connection between filter and target failed.
- `PRECOMPOSE_FAILED`: Composition encapsulation did not yield a valid reference node.
- `INVALID_PARAMS`: Input parameter validation failed.
- `RUNTIME_EXCEPTION`: An unhandled exception was captured during execution.

---

## 5. Five-Tier Verification Architecture

Every effect is validated against a rigorous 5-tier verification pyramid:

```
                  ┌────────────────────────┐
                  │ Tier 5: Visual Parity  │
                  │   (MAE, PSNR, SSIM)    │
                  ├────────────────────────┤
                  │ Tier 4: Live Cavalry   │
                  │   (127.0.0.1:8080)     │
                  ├────────────────────────┤
                  │ Tier 3: Mock Headless  │
                  │   (VM Execution)       │
                  ├────────────────────────┤
                  │ Tier 2: Math Models    │
                  │   (Invariants & Norms) │
                  ├────────────────────────┤
                  │ Tier 1: Static Check   │
                  │   (Syntax & Schemas)   │
                  └────────────────────────┘
```

1. **Tier 1 — Static Validation**:
   - SkSL syntax, bracket balance, uniform declarations.
   - Parameter map data types, limits, and defaults.
   - Source-to-embedded synchronization parity.
2. **Tier 2 — Mathematical Invariants**:
   - Analytical functions (Gaussian bell decay, Vogel golden spiral normalization, Rec. 601 luminance coefficients, sphere normal projections).
   - Numerical boundary condition checks (zero radius, negative values, extreme angles).
3. **Tier 3 — Headless Mock Execution**:
   - Evaluates effect applicators inside a sandboxed Node.js `vm` emulating the complete Cavalry 2.8 JavaScript runtime.
   - Validates dynamic slot creation, idempotency, multi-layer handling, and fault injection recovery.
4. **Tier 4 — Live Cavalry Runtime Verification**:
   - Connects to a live running Cavalry 2.8 instance via HTTP bridge (`127.0.0.1:8080`).
   - Creates real scene layers, applies the effect, triggers GPU compilation, evaluates viewport rendering, and captures PNG frames with verified magic bytes (`\x89PNG\r\n\x1a\n`).
5. **Tier 5 — Visual Parity Verification**:
   - Computes statistical image difference metrics (MAE, MSE, PSNR, SSIM, Sobel edge delta) against authentic reference renders.
   - Transparently reports **unverified** when reference frames are not present.

---

## 6. Portable Configuration Architecture

The library eliminates machine-specific paths by routing all filesystem and network access through `scripts/lib/config.mjs`:

| Environment Variable | Description | Fallback Default |
| :--- | :--- | :--- |
| `CAVALRY_LIBRARY_ROOT` | Root of `ae-effects-cavalry` repository | Current working directory or script parent |
| `CAVALRY_SCRIPTS_DIR` | Cavalry user scripts directory | Platform standard (`%APPDATA%\Cavalry\Scripts` or `~/Library/...`) |
| `CAVALRY_MCP_PATH` | Path to `cavalry-mcp` distribution | Auto-discovered relative paths |
| `STALLION_MODULE` | Path to Stallion bridge client | Embedded mock bridge |
| `STALLION_URL` | Live Cavalry HTTP bridge endpoint | `http://127.0.0.1:8080` |
