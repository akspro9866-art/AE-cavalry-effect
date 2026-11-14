# Fast Box Blur (AE Reconstructed for Cavalry)

Reconstructs Adobe After Effects **Fast Box Blur** (`ADBE Box Blur2`) for Cavalry 2.8+ as a GPU-accelerated SkSL Filter (`skslFilter`).

## Features
- **Configurable Box Iterations**: Select between 1 (pure Box window), 2 (Triangle Bartlett filter), or 3+ (Cubic B-spline smoothing).
- **Directional Axis Control**: Choose between Horizontal and Vertical, Horizontal only, or Vertical only.
- **Repeat Edge Pixels**: Prevents edge perimeter darkening.
- **Dynamic Padding**: Automatically calculates canvas expansion based on radius and iteration passes.

## Parameters
| Parameter | Default | Range | Description |
| :--- | :--- | :--- | :--- |
| `Blur Radius` | 10.0 | 0.0 – 500.0 | Spatial blur radius in pixels |
| `Iterations` | 1.0 | 1.0 – 5.0 | Number of box filter convolution passes |
| `Blur Dimensions` | Both (0) | 0 – 2 | 0=Both, 1=Horizontal, 2=Vertical |
| `Repeat Edge Pixels` | On (1.0) | 0 – 1 | Clamps border pixels |
