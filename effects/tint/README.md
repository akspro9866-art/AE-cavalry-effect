# Tint (After Effects Replication for Cavalry 2.8+)

Reconstructs the classic Adobe After Effects **Tint** color correction effect as a GPU-accelerated SkSL Filter (`skslFilter`) in Cavalry 2.8+.

## Features

- **Perceptual Luminance Mapping**: Rec. 601 luma weighting ($0.299R + 0.587G + 0.114B$).
- **Two-Tone Color Remapping**: Map shadows to `MapBlackTo` and highlights to `MapWhiteTo`.
- **Amount Control**: Smooth blend slider between original and tinted image.

## Usage

1. Select any layer in Cavalry.
2. Go to **Scripts -> AE Effects**.
3. Click **Tint**.
