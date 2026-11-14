# Sharpen (AE Reconstructed for Cavalry)

Reconstructs Adobe After Effects **Sharpen** (`ADBE Sharpen`) for Cavalry 2.8+ as a GPU-accelerated SkSL Filter (`skslFilter`).

## Features
- **High-Frequency Amplification**: Uses an 8-neighbor unsharp convolution filter to detect and enhance edges.
- **Threshold Gating**: Excludes low-contrast gradients and smooth flats from artificial sharpening noise.
- **Preserve Alpha**: Operates in unmultiplied straight color space to avoid dark halo boundaries.

## Parameters
| Parameter | Default | Range | Description |
| :--- | :--- | :--- | :--- |
| `Sharpen Amount` | 25.0 | 0.0 – 500.0 | Edge amplification intensity |
| `Radius` | 1.0 | 0.1 – 10.0 | Spatial sampling distance in pixels |
| `Threshold` | 0.0 | 0.0 – 255.0 | Minimum contrast difference required for sharpening |
| `Preserve Alpha` | On (1.0) | 0 – 1 | Preserves silhouette shape and transparency |
