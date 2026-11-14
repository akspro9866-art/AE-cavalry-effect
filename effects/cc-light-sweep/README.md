# CC Light Sweep (AE Reconstructed for Cavalry)

Reconstructs Adobe After Effects **CC Light Sweep** for Cavalry 2.8+ as a GPU-accelerated SkSL Filter (`skslFilter`).

## Features
- **Moving Beam Highlights**: Linear, Smooth, or Sharp cross-sectional beam band traversing graphics, logos, or text.
- **Edge Specular Bevel**: Accentuates silhouette perimeters using finite-difference alpha gradient detection.
- **Directional Angle & Width**: Adjust sweep orientation and beam thickness.
- **Color Swatch Control**: Custom beam color tinting with additive silhouette compositing.

## Parameters
| Parameter | Default | Range | Description |
| :--- | :--- | :--- | :--- |
| `Center X` | 0.0 px | Any | X focal point of beam |
| `Center Y` | 0.0 px | Any | Y focal point of beam |
| `Direction` | 30.0° | -360.0 – +360.0° | Angle of light streak |
| `Shape` | Linear (0) | 0 – 2 | 0=Linear, 1=Smooth, 2=Sharp |
| `Width` | 50.0 px | 1.0 – 500.0 px | Beam width |
| `Sweep Intensity`| 1.0 | 0.0 – 10.0 | Core beam luminance |
| `Edge Intensity` | 2.0 | 0.0 – 10.0 | Edge specular highlight |
| `Edge Thickness` | 4.0 px | 0.0 – 50.0 px | Bevel sampling radius |
| `Light Color` | RGB(255, 255, 255) | Color | Light emission swatch |
