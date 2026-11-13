# After Effects Effect Catalog & Cavalry Strategy Matrix

This reference indexes Adobe After Effects effects requested for replication into Cavalry, mapping each to its **recommended primary strategy** and any secondary/vector fallback.

| Effect Slug | AE Match Name | Target Strategy | Native Cavalry Notes | Status |
| :--- | :--- | :--- | :--- | :--- |
| `turbulent-displace` | `ADBE Turbulent Displace` | `sksl-filter` (primary) + `javascript-deformer` (vector companion) | `distortionFilter` only supports Lens/single Directional angle; lacks Turbulent/Bulge/Twist/Smoother/Cross/Pinning/Cycle Evolution. | Implemented (`1.0.0`, mock-verified) |
| `repeater` | `ADBE Vector Filter - Repeater` / Shape Repeater | `procedural-rig` (`duplicator`) | Native `duplicator` (`linearDistribution` + step offset/rotation/scale/opacity) replicates shape vector repeater behavior cleanly. | Planned |
| `wave-warp` | `ADBE Wave Warp` | `sksl-filter` (universal) / `javascript-deformer` (vector contours) | Native `wave` deformer exists in 2.8.0 (`wave` layerType) for geometry; SkSL covers Sine/Square/Triangle/Sawtooth/Noise + Pinning on raster/text/groups. | Planned |
| `fractal-noise` | `ADBE Fractal Noise` | `sksl-shader` / `sksl-filter` | Native `noiseShader` covers basic fractal noise; SkSL matches AE Noise Type, Transform, Complexity, Sub Settings, Evolution & Cycle Evolution. | Planned |
| `roughen-edges` | `ADBE Roughen Edges` | `sksl-filter` + `javascript-deformer` | Native `distortEdges` covers basic border displacement; SkSL provides Edge Type (Roughen, Rusty, Photocopier, Spiky), Edge Color, Border, Stretch, Fractal Influence. | Planned |
| `motion-tile` | `ADBE Tile` | `sksl-filter` | UV wrap/mirror tiling (`Mirror Edges`), `Tile Center`, `Output Width/Height`, `Phase`. | Planned |
| `displacement-map` | `ADBE Displacement Map` | `sksl-filter` + native `distortionFilter` probe | Dual-channel RGBA/Luminance/Hue displacement with `Wrap Pixels Around`. | Planned |
| `bulge` | `ADBE Bulge` | `native` (`sceneGroup::bulgeFilter`) or `sksl-filter` | Inspect `sceneGroup::bulgeFilter` attributes via `cavalry_probe_api`; fall back to SkSL spherical/pinch warp if missing `Horizontal/Vertical Radius` or `Pin All Edges`. | Planned |
| `cc-bend-it` | `CC Bend It` | `javascript-deformer` + `native` (`bend`) | Native `bend` deformer handles geometry bending; custom JS Deformer adds exact Start/End pins + Distort mode (`Static`/`Legal`/`Prestart`/`Mirror`). | Planned |
| `gaussian-blur` | `ADBE Gaussian Blur 2` | `native` (`sceneGroup::gaussianBlurFilter`) | Verify `Repeat Edge Pixels` & `Blur Dimensions` (H+V / H / V) via `cavalry_probe_api`; add SkSL separable fallback if directional axes absent. | Planned |
| `directional-blur` | `ADBE Motion Blur` | `native` (`sceneGroup::directionalBlurFilter`) | Inspect `sceneGroup::directionalBlurFilter` angle/length attributes via `cavalry_probe_api`. | Planned |
| `glow` | `ADBE Glo2` | `native` (`glowFilter`) or `sksl-filter` | Inspect `glowFilter` for Threshold, Radius, Intensity, A/B color loops; supplement if dual-color gradient glow needed. | Planned |
| `posterize-time` | `ADBE Posterize Time` | `native` layer attribute (`posterizeTime`, `posterizeFrameRate`, `posterizeTimeOffset`) | Cavalry has built-in `posterizeFrameRate` / `posterizeTime` on every layer (`mock/schema.ts` L42, 51, 55)! Verify live attribute paths cleanly. | Planned |
| `offset` | `ADBE Offset` | `sksl-filter` | Toroidal `Shift Center To` pixel wrap (`fract((p - shift)/res) * res`) + `Blend With Original`. | Planned |
| `venetian-blinds` | `ADBE Venetian Blinds` | `native` (`venetianBlinds`) or `sksl-filter` | Cavalry has a native `venetianBlinds` node; inspect attributes/behavior vs AE (`Transition Completion`, `Direction`, `Width`, `Feather`). | Planned |
