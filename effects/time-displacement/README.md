# Time Displacement (ADBE Time Displacement) for Cavalry 2.8+

Mathematically reconstructed Adobe After Effects **Time Displacement** effect implemented for Cavalry 2.8+.

## Features
- **Luminance Channel Mapping**: Derives temporal offsets from Red, Green, Blue, Alpha, or Luminance channels of a displacement source.
- **Quantized Time Resolution**: Steps temporal offsets according to composition or custom frame rate steps.
- **Secondary Map Limitation (documented)**: AE's "Time Displacement Layer" cannot be sampled by Cavalry's `skslFilter` (verified live in Cavalry 2.8: `mattes.0` connections and shader-type `inputs.*` dynamics do not bind layer content into SkSL). Providing a map layer yields an explicit warning; the displacement signal is derived from the target layer itself.
- **Architectural Honesty**: Documents single-pass GPU SkSL boundaries versus historical 3D texture caches clearly.
