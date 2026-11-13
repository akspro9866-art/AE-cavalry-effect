# Gaussian Blur (After Effects Replication for Cavalry 2.8+)

Reconstructs the Adobe After Effects **Gaussian Blur 2** effect as a GPU-accelerated SkSL Filter (`skslFilter`) in Cavalry 2.8+.

## Features

- **Isotropic & Directional Gaussian Diffusion**:
  - `Horizontal and Vertical`: Smooth 2D bell-curved diffusion.
  - `Horizontal Only`: 1D horizontal motion blur style smoothing.
  - `Vertical Only`: 1D vertical motion blur style smoothing.
- **Repeat Edge Pixels**: Prevents edge darkening and border alpha clipping by clamping coordinate sampling.
- **Dynamic Canvas Expansion**: Automatically adjusts padding so large blurs do not clip at bounding box borders.

## Parameters

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `Blurriness` | double | `50.0` | Blur radius in pixels |
| `BlurDimensions` | enum | `0` (H & V) | Directional orientation (0 = H & V, 1 = H, 2 = V) |
| `RepeatEdgePixels`| enum | `1` (On) | Edge clamping to prevent dark borders |

## Usage

1. Select any shape, group, text, or preComp in Cavalry.
2. Go to **Scripts -> AE Effects**.
3. Click **Gaussian Blur**.
