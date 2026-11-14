# Displacement Map (ADBE Displacement Map) for Cavalry 2.8+

Mathematically reconstructed Adobe After Effects **Displacement Map** effect implemented as a GPU SkSL filter (`skslFilter`) in Cavalry 2.8+.

## Features
- **Channel Extraction**: Red, Green, Blue, Alpha, Luminance, and Lightness source channel selectors.
- **Bi-directional Displacement**: Independent horizontal and vertical deflection scale controls in pixels.
- **Edge Wrapping**: Seamless toroidal coordinate wrapping or bound clipping.
- **Secondary Map Linking**: Connects secondary displacement layer into filter graph via `mattes.0`.
