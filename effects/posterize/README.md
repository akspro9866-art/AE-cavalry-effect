# Posterize (AE Reconstructed for Cavalry)

Reconstructs Adobe After Effects **Posterize** (`ADBE Posterize`) for Cavalry 2.8+ as a GPU-accelerated SkSL Filter (`skslFilter`).

## Features
- **Levels Quantization**: Reduces the number of discrete brightness levels per channel.
- **Graphic Stylization**: Creates poster-print and retro band-limited aesthetic effects.
- **Alpha Safety**: Quantization operates exclusively on unmultiplied RGB, preserving transparent silhouettes.

## Parameters
| Parameter | Default | Range | Description |
| :--- | :--- | :--- | :--- |
| `Levels` | 4.0 | 2.0 – 255.0 | Number of discrete color steps per channel |
