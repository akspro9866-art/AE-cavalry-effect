# Curves (ADBE CurvesCustom) for Cavalry 2.8+

Mathematically reconstructed Adobe After Effects **Curves** effect implemented as a high-performance GPU SkSL filter (`skslFilter`) in Cavalry 2.8+.

## Features
- **Catmull-Rom Spline Curve**: True cubic spline interpolation across 5 tonal nodes (Black, Shadows, Midtones, Highlights, White).
- **Individual Channel Control**: Independent Lift, Midtone, and Gain tonal mapping for Red, Green, and Blue channels.
- **Unpremultiplied Alpha Preservation**: Correctly un-premultiplies alpha prior to curve evaluation and re-premultiplies after grading.
- **Full Keyframeability**: Dynamic curve controls exposed directly in Cavalry's Attribute Editor.
