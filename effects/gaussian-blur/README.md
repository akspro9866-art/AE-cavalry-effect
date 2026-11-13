# Gaussian Blur (After Effects Replication for Cavalry 2.8+)

Reconstructs the Adobe After Effects **Gaussian Blur 2** (`ADBE Gaussian Blur 2`) effect as a GPU-accelerated SkSL Filter (`skslFilter`) in Cavalry 2.8+.

## Kernel Architecture & Verified Sample Counts

The shader implements directional isolation and isotropic 2D diffusion using exact sample counts:

| Dimension Mode | Distribution Geometry | Tap Breakdown | Total Texture Samples |
| :--- | :--- | :--- | :--- |
| **0: Horizontal and Vertical** | Vogel Golden-Spiral Isotropic Disc | 1 Center + 36 Spiral taps | **37 samples/pixel** |
| **1: Horizontal Only** | 1D Symmetric Separable Gaussian | 1 Center + 32 iterations × 2 symmetric taps | **65 samples/pixel** |
| **2: Vertical Only** | 1D Symmetric Separable Gaussian | 1 Center + 32 iterations × 2 symmetric taps | **65 samples/pixel** |

### Mathematical Invariants
- **Gaussian Weight Decay**: $w(d) = \exp\left(-\frac{d^2}{2\sigma^2}\right)$, strictly monotonic decay from $w(0) = 1.0$.
- **Standard Deviation**: $\sigma = \max(\text{Blurriness} \times 0.5, 0.5)$, matching Adobe After Effects standard deviation scaling.
- **Normalization**: Accumulated color is strictly normalized by total kernel weight (`accum / half(totalWeight)`), preserving global scene energy and luminance across all radii.
- **Repeat Edge Pixels**: When enabled, sampling coordinates are clamped to layer boundaries (`clamp(coord, -halfRes + 0.5, halfRes - 0.5)`), preventing border darkening and artificial dark vignettes.
- **Dynamic Canvas Padding**: Padding expands dynamically to accommodate wide blur radii without edge clipping:
  - $\text{Pad}_X = \text{Pad}_Y = \min(4096, \lceil \text{Blurriness} \times 1.8 + 20 \rceil)$ for 2D.
  - Zeroes orthogonal padding when in directional 1D modes.

## Parameters

| Parameter | Type | Default | Range | Description |
| :--- | :--- | :--- | :--- | :--- |
| `Blurriness` | double | `50.0` | `0.0` to `1000.0` | Blur radius standard deviation in pixels |
| `BlurDimensions` | enum | `0` (H & V) | `0, 1, 2` | 0: Horizontal & Vertical, 1: Horizontal Only, 2: Vertical Only |
| `RepeatEdgePixels`| enum | `1` (On) | `0, 1` | Clamps border texture sampling to eliminate dark edges |

## Usage

1. Select any shape, group, text, or preComp in Cavalry.
2. Go to **Scripts -> AE Effects**.
3. Click **Gaussian Blur**.
4. Adjust parameters in the Attribute Editor or Animate them over time.
