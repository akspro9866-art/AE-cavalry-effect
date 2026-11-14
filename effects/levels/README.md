# Levels (AE Reconstructed for Cavalry)

Reconstructs Adobe After Effects **Levels** (`ADBE Set Levels`) for Cavalry 2.8+ as a GPU-accelerated SkSL Filter (`skslFilter`).

## Features
- **Input Black / White**: Compresses or expands input tonal dynamic range.
- **Gamma Correction**: Adjusts midtones non-linearly using power-law curves without clipping endpoints.
- **Output Black / White**: Remaps black and white output levels.
- **Channel Selection**: Apply across Master RGB, Red only, Green only, or Blue only.
- **Alpha Safety**: Operates in unmultiplied straight color space, preserving transparent silhouettes and avoiding dark edge fringing.

## Parameters
| Parameter | Default | Range | Description |
| :--- | :--- | :--- | :--- |
| `Input Black` | 0.0 | 0.0 – 255.0 | Floor of input luminance range |
| `Input White` | 255.0 | 0.0 – 255.0 | Ceiling of input luminance range |
| `Gamma` | 1.0 | 0.1 – 10.0 | Non-linear midtone gamma exponent |
| `Output Black` | 0.0 | 0.0 – 255.0 | Output black floor remapping |
| `Output White` | 255.0 | 0.0 – 255.0 | Output white ceiling remapping |
| `Channel` | RGB (0) | 0 – 3 | 0=RGB, 1=Red, 2=Green, 3=Blue |
