# Bevel Alpha (AE Reconstructed for Cavalry)

Reconstructs Adobe After Effects **Bevel Alpha** (`ADBE Bevel Alpha`) for Cavalry 2.8+ as a GPU-accelerated SkSL Filter (`skslFilter`).

## Features
- **3D Edge Chisel**: Reconstructs 3D surface normals from finite-difference alpha gradient contours.
- **Directional Illumination**: Computes diffuse lighting using user-selected `LightAngle` and `LightIntensity`.
- **Highlight & Shadow Swatches**: Independent color controls for illuminated and shaded rim facets.
- **Silhouette Preservation**: Strictly limits shading within original layer alpha bounds.

## Parameters
| Parameter | Default | Range | Description |
| :--- | :--- | :--- | :--- |
| `Edge Thickness` | 2.0 px | 0.0 – 50.0 px | Spatial bevel rim width |
| `Light Angle` | 45.0° | 0.0 – 360.0° | Direction of light source |
| `Light Intensity`| 1.0 | 0.0 – 2.0 | Shading multiplier |
| `Highlight Color`| RGB(255, 255, 255) | Color | Tint of facing bevel |
| `Shadow Color` | RGB(0, 0, 0) | Color | Tint of opposing bevel |
