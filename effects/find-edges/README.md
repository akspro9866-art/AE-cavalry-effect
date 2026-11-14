# Find Edges (ADBE Find Edges) for Cavalry 2.8+

Mathematically reconstructed Adobe After Effects **Find Edges** effect implemented as a GPU SkSL filter (`skslFilter`) in Cavalry 2.8+.

## Features
- **3x3 Sobel Spatial Gradient**: High-frequency edge detection along horizontal and vertical axes.
- **Inversion Modes**: Toggles between architectural sketch style (dark lines on white) and glowing contour style (bright lines on black).
- **Silhouette Alpha Preservation**: Restricts edge rendering to non-transparent layer artwork.
- **Blend With Original**: Supports continuous crossfade between the detected edge contours and original layer color.
