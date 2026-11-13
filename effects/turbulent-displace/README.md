# Turbulent Displace (`ADBE Turbulent Displace`) for Cavalry

Mathematically controlled reconstruction of Adobe After Effects **Turbulent Displace** for Cavalry 2.8+, supporting one-action application onto existing selected Cavalry layers via Stallion / `cavalry-mcp`.

## Mechanisms Included

1. **Primary (`sksl` — `turbulent-displace.sksl`)**: GPU `skslFilter` attached to any visual Cavalry layer (`rectangleShape`, `ellipseShape`, `textShape`, `group`, `image`, `preComp`), warping outlines, fills, strokes, and textures.
2. **Companion (`deformer` — `turbulent-displace.deformer.js`)**: Pure `javaScriptDeformer` resampling & warping editable vector outlines via `cavalry.Path` / `def.getRootMesh()`.

## Supported AE Parameters

- `displacement`: `'Turbulent'` (`0`), `'Bulge'` (`1`), `'Twist'` (`2`), `'Turbulent Smoother'` (`3`), `'Bulge Smoother'` (`4`), `'Twist Smoother'` (`5`), `'Vertical Displacement'` (`6`), `'Horizontal Displacement'` (`7`), `'Cross Displacement'` (`8`)
- `amount`: default `50` (`0` = identity pass-through, negative inverts direction)
- `size`: default `100` (wavelength scale in pixels)
- `offsetX` / `offsetY`: default `0, 0` (pixel offset relative to layer center)
- `complexity`: `1.0 .. 10.0`, default `1.0` (fractional fractal octaves)
- `evolution`: degrees, default `0`
- `cycleEvolution`: boolean / `0|1`, default `false` (`0`)
- `cycleRevolutions`: integer `>= 1`, default `1` (exact loop every `360 * cycleRevolutions` deg)
- `randomSeed`: default `0`
- `pinning`: `'None'` (`0`), `'Pin All'` (`1`), `'Pin Horizontal'` (`2`), `'Pin Vertical'` (`3`), `'Pin Left'` (`4`), `'Pin Right'` (`5`), `'Pin Top'` (`6`), `'Pin Bottom'` (`7`)
- `resizeLayer`: boolean / `0|1`, default `true` (`1`) — automatically expands `skslFilter.padding` outward so large displacements aren't clipped to layer bounds
- `antialiasing`: `'Low'` (`0`, bilinear) or `'High'` (`1`, 4-tap RGSS supersampling)

## One-Action Usage

Select one or more layers in Cavalry, then run:

```bash
node scripts/apply-effect.mjs turbulent-displace
```

With parameter overrides (`--param key=value` works cleanly on PowerShell and Unix):

```bash
node scripts/apply-effect.mjs turbulent-displace --param displacement=Twist --param amount=65 --param size=120 --param cycleEvolution=true --param antialiasing=High --animate '{"startFrame":0,"endFrame":60,"startValue":0,"endValue":360}'
```

Vector outline mode (for pure vector export):

```bash
node scripts/apply-effect.mjs turbulent-displace --mode deformer --params "{\"amount\":40,\"complexity\":2.5}"
```

See [technical-notes.md](technical-notes.md) for mathematical derivation and documented gaps (such as `Resize Layer`), and [test-report.md](test-report.md) for verification scope.
