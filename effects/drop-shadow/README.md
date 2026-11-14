# Drop Shadow (AE Reconstructed for Cavalry)

Reconstructs Adobe After Effects **Drop Shadow** (`ADBE Drop Shadow`) for Cavalry 2.8+ as a GPU-accelerated SkSL Filter (`skslFilter`).

## Features
- **Polar Direction & Distance**: Offset shadows at arbitrary angles ($0^\circ$ = right, $90^\circ$ = down, $135^\circ$ = bottom-right).
- **16-Tap Vogel Golden-Spiral Diffusion**: Provides smooth isotropic Gaussian softness without ring or stepping artifacts.
- **Over Compositing**: Composites original foreground artwork over the blurred shadow respecting transparent edges.
- **Shadow Only Mode**: Extracts pure shadow alpha and color for compositing flexibility.
- **Dynamic Padding**: Automatically calculates canvas expansion based on distance and blur softness.

## Parameters
| Parameter | Default | Range | Description |
| :--- | :--- | :--- | :--- |
| `Shadow Color` | RGB(0, 0, 0) | Any Color | Shadow tint swatch |
| `Opacity` | 50.0% | 0.0 – 100.0% | Shadow opacity |
| `Direction` | 135.0° | 0.0 – 360.0° | Light source projection angle |
| `Distance` | 5.0 px | 0.0 – 1000.0 px | Cast offset distance |
| `Softness` | 5.0 px | 0.0 – 500.0 px | Gaussian blur spread |
| `Shadow Only` | Off (0) | 0 – 1 | Isolates shadow layer |
