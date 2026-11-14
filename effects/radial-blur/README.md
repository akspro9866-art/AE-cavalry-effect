# Radial Blur (AE Reconstructed for Cavalry)

Reconstructs Adobe After Effects **Radial Blur** (`ADBE Radial Blur`) for Cavalry 2.8+ as a GPU-accelerated SkSL Filter (`skslFilter`).

## Features
- **Spin Mode**: Circular rotational blur along orbits around a designated center.
- **Zoom Mode**: Radial ray streaks converging on or expanding from a center point.
- **Center Point Controls**: Interactive `CenterX` and `CenterY` coordinate positioning.
- **Dynamic Bounding Expansion**: Allocates canvas padding to accommodate radial diffusion streaks.

## Parameters
| Parameter | Default | Range | Description |
| :--- | :--- | :--- | :--- |
| `Amount` | 10.0 | 0.0 – 100.0 | Radial blur diffusion magnitude |
| `Type` | Spin (0) | 0 – 1 | 0=Spin, 1=Zoom |
| `Quality` | Standard (1) | 0 – 2 | 0=Draft, 1=Standard, 2=Best |
| `Center X` | 0.0 | Any | X focal center |
| `Center Y` | 0.0 | Any | Y focal center |
