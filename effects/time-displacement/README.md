# Time Displacement (ADBE Time Displacement) for Cavalry 2.8+

Mathematically reconstructed Adobe After Effects **Time Displacement** effect implemented for Cavalry 2.8+.

## Features
- **Luminance Channel Mapping**: Derives temporal offsets from Red, Green, Blue, Alpha, or Luminance channels of a displacement source.
- **Quantized Time Resolution**: Steps temporal offsets according to composition or custom frame rate steps.
- **Secondary Map Graph Linking**: Idempotently connects the displacement map layer into the filter graph via `mattes.0`.
- **Architectural Honesty**: Documents single-pass GPU SkSL boundaries versus historical 3D texture caches clearly.
