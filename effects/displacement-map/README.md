# Displacement Map (ADBE Displacement Map) for Cavalry 2.8+

Mathematically reconstructed Adobe After Effects **Displacement Map** effect implemented as a GPU SkSL filter (`skslFilter`) in Cavalry 2.8+.

## Features
- **Channel Extraction**: Red, Green, Blue, Alpha, Luminance, and Lightness source channel selectors.
- **Bi-directional Displacement**: Independent horizontal and vertical deflection scale controls in pixels.
- **Edge Wrapping**: Seamless toroidal coordinate wrapping or bound clipping.
- **Secondary Map Region Constraint**: Connects a secondary layer via `mattes.0`, which constrains the region where the displacement applies (Cavalry filter matte semantics). Note: Cavalry's `skslFilter` cannot sample a second layer (verified live in 2.8), so map channel values do not drive the displacement — the signal is derived from the target layer itself.
