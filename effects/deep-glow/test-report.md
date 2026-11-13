# Verification & Test Report: After Effects Deep Glow -> Cavalry 2.8+

## Status: `LIVE-VERIFIED` (Tier 1, Tier 2, Tier 3, Tier 4 Passed)

- **Date Verified**: 2026-11-13
- **Live Cavalry Environment**: Cavalry 2.8.1 (Windows) via Stallion HTTP Bridge (`http://127.0.0.1:8080`)
- **Primary Mechanism**: `skslFilter` (GPU Fragment Shader)
- **Deployed Script**: `C:\Users\khada\AppData\Roaming\Cavalry\Scripts\AE Effects.js`

---

## 1. Tier 1: Static Validation

- **SkSL Validator**: `valid: true` (0 errors, 0 warnings, 0 diagnostics).
  - Preamble uniform: `uniform shader layer;`
  - Dynamic uniforms: `Radius`, `Exposure`, `Threshold`, `ThresholdSmooth`, `SaturationBias`, `AspectRatio`, `AspectAngle`, `Aberration`, `GlowMode`, `BlendMode`, `TintMode`, `TintColor`, `TintColorOuter`, `TintBlendMode`, `TintStrength`, `ToneMapMode`, `SourceOpacity`.
- **Cavalry Context Usage**:
  - `implementation.js`: `valid: true` (strictly uses `api`, `console`, `cavalry`).
  - `AE Effects.js`: `valid: true` (strictly uses `ui`, `api`, `console`).

---

## 2. Tier 2: Mathematical Invariant Tests

All 4 invariant suites passed with zero failures:
1. **Zero Exposure Identity**: When `Exposure = 0.0` or `Radius = 0.0`, the composite returns base layer pixel values unchanged.
2. **Inverse-Square Falloff**: Monotonic decay verified ($w(0) = 1.0 > w(10) > w(50) > w(200)$).
3. **Anamorphic Aspect Ratio & Angle**:
   - 3.0x aspect ratio extends horizontal axis by exactly $300\%$.
   - 90-degree aspect angle rotates the elliptical stretch onto the vertical Y-axis.
4. **Threshold Knee & Saturation Bias**:
   - Sub-threshold values are smoothly attenuated to 0.0.
   - Saturation metric `rgb2s` correctly identifies pure white ($s=0.0$) and pure saturated red ($s=1.0$).
5. **Two-Tone Tint & Tone Mapping**:
   - Monocolor and Duocolor overlay and soft-light tint formulas match After Effects color output.
   - ACES Filmic, Filmic HBD, Reinhard, Reinhard 2, and Clamp Chroma tone mapping safely compress high-dynamic-range overbright highlights without NaN or infinite values.

---

## 3. Tier 3: Headless Mock Stallion Execution

- **Selection Guard**: Gracefully warns when no layer is selected without throwing.
- **Dynamic Slot Provisioning**: Adds and renames `inputs.0` through `inputs.16` on `skslFilter`.
- **Idempotency**: Re-running applicator on an already affected layer updates the existing filter attributes and does not duplicate nodes.
- **Keyframe Animation**: Successfully animates `Exposure` over frames 0 to 50.

---

## 4. Tier 4: Live Cavalry 2.8 Runtime & GPU Render Captures

- **Live Cavalry Probe**: Connected to Cavalry 2.8.1 at `127.0.0.1:8080` (round-trip 15 ms).
- **GPU SkSL Compilation**: Stripped code compiled with zero GPU shader compiler errors.
- **Dynamic Slot Binding**:
  - `inputs.0` (Radius): 140.0
  - `inputs.1` (Exposure): 1.2
  - `inputs.2` (Threshold): 0.0
  - `inputs.3` (ThresholdSmooth): 0.1
  - `inputs.4` (SaturationBias): 0.0
  - `inputs.5` (AspectRatio): 1.5
  - `inputs.6` (AspectAngle): 0.0
  - `inputs.7` (Aberration): 0.0
  - `inputs.8` (GlowMode): 0.0 (Inverse Square)
  - `inputs.9` (BlendMode): 0.0 (Add)
  - `inputs.10` (TintMode): 2.0 (Duocolor)
  - `inputs.11` (TintColor): `{ r: 255, g: 190, b: 70, a: 255 }`
  - `inputs.12` (TintColorOuter): `{ r: 40, g: 130, b: 250, a: 255 }`
  - `inputs.13` (TintBlendMode): 1.0 (Overlay)
  - `inputs.14` (TintStrength): 1.0
  - `inputs.15` (ToneMapMode): 0.0
  - `inputs.16` (SourceOpacity): 1.0
- **Dynamic Padding**: Automatically calculated `padding = { x: 396, y: 264 }` based on radius and aspect ratio, eliminating bounding box clipping.
- **Multi-Frame Render**: Rendered test frames 0, 25, 50 to `artifacts/verify-deep-glow/` via GPU render pass.
- **Live Idempotency**: Second application updated `inputs.0` (180.0) and `inputs.1` (2.0) on `skslFilter#37` without creating any duplicate filter layers (layer count remained `2 -> 2`).
- **Scene Rollback**: Isolated verification snapshot cleanly reverted scene state.

---

## 5. Script Synchronization & Availability

- **Repo Script**: `ae-cavalry-effects/cavalry-script/AE Effects.js`
- **Cavalry Menu**: `C:\Users\khada\AppData\Roaming\Cavalry\Scripts\AE Effects.js`
- **Active Verified Effects**:
  1. `Turbulent Displace` (v1.1.0)
  2. `Deep Glow` (v1.0.0)
