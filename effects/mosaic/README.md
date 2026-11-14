# Mosaic (AE Reconstructed for Cavalry)

Reconstructs Adobe After Effects **Mosaic** (`ADBE Mosaic`) for Cavalry 2.8+ as a GPU-accelerated SkSL Filter (`skslFilter`).

## Features
- **Block Grid Quantization**: Divides the image canvas into a configurable matrix of rectangular cells.
- **Center Representative Sampling**: Samples the exact center pixel of each tile cell.
- **Sharp Colors**: Quantizes color levels to eliminate inter-cell bilinear interpolation blur.
- **Centering Preservation**: Retains Cavalry canvas coordinate alignment across arbitrary aspect ratios.

## Parameters
| Parameter | Default | Range | Description |
| :--- | :--- | :--- | :--- |
| `Horizontal Blocks` | 10.0 | 1.0 – 500.0 | Number of cell divisions horizontally |
| `Vertical Blocks` | 10.0 | 1.0 – 500.0 | Number of cell divisions vertically |
| `Sharp Colors` | Off (0.0) | 0 – 1 | Quantizes colors into discrete steps |
