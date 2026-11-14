# Gradient Ramp (ADBE Ramp) for Cavalry 2.8+

Mathematically reconstructed Adobe After Effects **Gradient Ramp** effect implemented as a GPU SkSL filter (`skslFilter`) in Cavalry 2.8+.

## Features
- **Linear & Radial Geometry**: Generates directional linear ramps or circular radial gradients.
- **Ramp Scatter (Dithering)**: High-frequency pseudo-random dithering eliminates color quantization and visible banding.
- **Blend With Original**: Smoothly blends the procedural ramp with underlying layer pixels.
- **Full Keyframeability**: All coordinates, color swatches, and blend amounts exposed in Cavalry's Attribute Editor.
