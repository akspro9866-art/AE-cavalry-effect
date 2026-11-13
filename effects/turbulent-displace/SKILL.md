---
name: ae-turbulent-displace
description: Apply, configure, inspect, or test the Adobe After Effects Turbulent Displace effect (ADBE Turbulent Displace) in Cavalry using the existing skslFilter and javaScriptDeformer implementations.
---

# AE Turbulent Displace Skill (`effects/turbulent-displace`)

Use this verified implementation whenever the user asks for **Turbulent Displace** in Cavalry. Do **not** regenerate from scratch unless explicitly fixing a documented limitation.

## When to Pick `sksl` vs `deformer`

- **`mode: "auto"` (default -> `skslFilter`)**: Choose for shapes, text, images, gradients, strokes, and multi-layer groups/pre-comps. Supports all 9 Displacement modes, `High` 4-tap RGSS Antialiasing, and pixel-accurate edge pinning.
- **`mode: "deformer"` (`javaScriptDeformer`)**: Choose ONLY when the user specifically requires editable vector curves (`Path`) or vector-only export (Lottie). Subdivides sparse primitives automatically via `convertToLines` + `resample`.
- **`mode: "both"`**: Attaches both when experimenting; generally avoid double-displacing unless testing differences.

## Execution Workflow

1. Confirm Cavalry has an active selection (`api.getSelection()`), or inform the user to select their layer first (only set `createTestTargetIfEmpty: true` for isolated smoke demos).
2. Run `effects/turbulent-displace/implementation.js` (directly or via `node scripts/apply-effect.mjs turbulent-displace` / `cavalry_apply_dsl`).
3. Re-running with updated parameters updates the tagged `[AE:Turbulent Displace]` node in place without creating duplicate filters.
4. Check `uniformMode` and `warnings` in the returned JSON: if live Cavalry only accepted `baked-constants` and Evolution keyframes were requested, inform the user honestly and offer UI SkSL `Inputs` wiring or `mode: "deformer"`.
