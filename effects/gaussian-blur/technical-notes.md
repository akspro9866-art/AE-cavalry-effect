# Technical Notes: Gaussian Blur -> Cavalry 2.8+

## Architectural Model

Adobe After Effects' Gaussian Blur (ADBE Gaussian Blur 2) applies an isotropic Gaussian convolution across image pixels to soften detail and eliminate high-frequency noise.

In Cavalry 2.8+, Gaussian Blur is implemented as a GPU-accelerated SkSL Filter (`skslFilter`). It provides single-pass 2D Vogel golden-spiral disc convolution and directional 1D horizontal/vertical filtering with edge clamping.

---

## Mathematical Formulation

1. **Gaussian Weight Distribution**:
   For any tap at spatial distance $d$ from the target fragment with standard deviation $\sigma$:
   $$w(d) = \exp\left( -\frac{d^2}{2\sigma^2} \right)$$
   Where $\sigma = \max(\text{Blurriness} \times 0.5, \; 0.5)$.

2. **2D Vogel Golden-Spiral Kernel (sigma-tiered)**:
   To eliminate directional banding artifacts in single-pass 2D filtering without requiring separable multi-pass framebuffers:
   $$r_i = 3\sigma \sqrt{\frac{i + 0.5}{N}}, \quad \theta_i = i \cdot 2.3999632 \text{ rad}$$
   $$\Delta \mathbf{x}_i = \left( r_i \cos \theta_i, \; r_i \sin \theta_i \right)$$
   The tap count $N$ scales with sigma in three tiers so large radii stay densely sampled instead of plateau-banding (constant GPU loop bound of 144 with a dynamic early-out, a pattern live-verified via Turbulent Displace):

   | Tier | $\sigma$ range | Taps (incl. center) |
   | :--- | :--- | :--- |
   | Small | $\sigma < 8$ px | 37 |
   | Medium | $8 \le \sigma < 40$ px | 73 |
   | Large | $\sigma \ge 40$ px | 145 |

   Live-render verification (2026-11, 960×540 comp, $\sigma = 75$): the 145-tap tier renders a smooth falloff (mean adjacent-pixel delta 0.36 luma, no reversals). Mild residual banding can remain at extreme blurs ($\text{Blurriness} \gtrsim 400$); for axis-aligned blurs the 1D modes sample $3\sigma$ with 65 taps and remain the smoothest option.

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
| **Convolution Pipeline** | Multi-pass separable IIR or FIR buffer ping-pong | Single-pass GPU SkSL with sigma-tiered 37/73/145-tap Vogel spiral / 65-tap 1D separable kernel |
| **Edge Behavior** | Toggleable "Repeat Edge Pixels" | Native bounding clamp integrated into fragment shader |
| **Color Precision** | 8/16/32-bpc project setting | Native 32-bit floating-point per fragment |

---

## Verification Protocol

1. **Tier 1 (Static)**: Verified in `test/gaussian-blur.test.mjs`.
2. **Tier 2 (Math)**: Gaussian bell curve, tap normalization, and resolution scaling verified in `effects/gaussian-blur/math-model.mjs`.
3. **Tier 3 (Mock)**: Dynamic attribute binding and headless attachment tested.
4. **Tier 4 (Live)**: Executed against live Cavalry 2.8 (`http://127.0.0.1:8080`).
