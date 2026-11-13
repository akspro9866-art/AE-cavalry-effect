# Technical Notes: Gaussian Blur -> Cavalry 2.8+

## Architectural Model

Adobe After Effects' Gaussian Blur (ADBE Gaussian Blur 2) applies an isotropic Gaussian convolution across image pixels to soften detail and eliminate high-frequency noise.

In Cavalry 2.8+, Gaussian Blur is implemented as a GPU-accelerated SkSL Filter (`skslFilter`). It provides single-pass 2D Vogel golden-spiral disc convolution and directional 1D horizontal/vertical filtering with edge clamping.

---

## Mathematical Formulation

1. **Gaussian Weight Distribution**:
   For any tap at spatial distance $d$ from the target fragment with standard deviation $\sigma$:
   $$w(d) = \exp\left( -\frac{d^2}{2\sigma^2} \right)$$
   Where $\sigma = \max(\text{Blurriness} / 3.0, \; 0.001)$.

2. **2D Vogel Golden-Spiral Kernel**:
   To eliminate directional banding artifacts in single-pass 2D filtering without requiring separable multi-pass framebuffers:
   $$r_i = 3\sigma \sqrt{\frac{i + 0.5}{N}}, \quad \theta_i = i \cdot 2.3999632 \text{ rad}$$
   $$\Delta \mathbf{x}_i = \left( r_i \cos \theta_i, \; r_i \sin \theta_i \right)$$
   Where $N = 37$ taps.

3. **1D Directional Kernels**:
   When `Blur Dimensions` is set to Horizontal Only (`1`) or Vertical Only (`2`):
   - Offset vector $\mathbf{v} = (1, 0)$ or $(0, 1)$.
   - Evaluates $N = 65$ symmetric taps along the designated axis.

4. **Weight Normalization**:
   To preserve photometric luminance and prevent energy gain or loss:
   $$\mathbf{C}_{\text{out}} = \frac{\sum_{i=0}^{N-1} w_i \cdot \mathbf{C}(\mathbf{x} + \Delta \mathbf{x}_i)}{\sum_{i=0}^{N-1} w_i}$$

5. **Repeat Edge Pixels Clamping**:
   When enabled, sample coordinates $\mathbf{x}_{\text{sample}}$ are clamped to the layer bounding rectangle $[0, W] \times [0, H]$, preventing perimeter darkening from unmapped transparent pixels.

---

## Dynamic Attribute Bindings

| Parameter | Type | Slot Key | Default |
| :--- | :--- | :--- | :--- |
| `Blurriness` | Double | `blurriness` | `10.0` |
| `Blur Dimensions` | Enum (0: Both, 1: H, 2: V) | `blurDimensions` | `0` |
| `Repeat Edge Pixels` | Boolean | `repeatEdgePixels` | `true` |

---

## Known Differences from Adobe After Effects

| Feature | Adobe After Effects | Cavalry 2.8+ (This Implementation) |
| :--- | :--- | :--- |
| **Convolution Pipeline** | Multi-pass separable IIR or FIR buffer ping-pong | Single-pass GPU SkSL with 37-tap Vogel spiral / 65-tap 1D separable kernel |
| **Edge Behavior** | Toggleable "Repeat Edge Pixels" | Native bounding clamp integrated into fragment shader |
| **Color Precision** | 8/16/32-bpc project setting | Native 32-bit floating-point per fragment |

---

## Verification Protocol

1. **Tier 1 (Static)**: Verified in `test/gaussian-blur.test.mjs`.
2. **Tier 2 (Math)**: Gaussian bell curve, tap normalization, and resolution scaling verified in `effects/gaussian-blur/math-model.mjs`.
3. **Tier 3 (Mock)**: Dynamic attribute binding and headless attachment tested.
4. **Tier 4 (Live)**: Executed against live Cavalry 2.8 (`http://127.0.0.1:8080`).
