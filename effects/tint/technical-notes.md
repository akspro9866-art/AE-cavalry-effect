# Technical Notes: Tint -> Cavalry 2.8+

## Architectural Model

Adobe After Effects' Tint effect performs a two-tone gradient map across the luminance spectrum of an image, mapping shadow values to a chosen black target color and highlight values to a white target color.

In Cavalry 2.8+, Tint is implemented as a GPU-accelerated SkSL Filter (`skslFilter`) executing per-fragment on the GPU with 32-bit floating-point precision.

---

## Mathematical Formulation

1. **Straight Alpha Unmultiplication**:
   To prevent dark fringing along semi-transparent anti-aliased perimeters, color channels are unmultiplied prior to luminance calculation:
   $$\mathbf{C}_{\text{rgb}} = \frac{\mathbf{C}_{\text{premul.rgb}}}{\max(A, 10^{-5})}$$

2. **Perceptual Luminance (ITU-R Rec. 601)**:
   $$Y = 0.299 \, R + 0.587 \, G + 0.114 \, B$$
   Where $Y \in [0, 1]$.

3. **Two-Tone Color Remapping**:
   $$\mathbf{C}_{\text{tinted}} = \mathbf{C}_{\text{black}} + Y \cdot (\mathbf{C}_{\text{white}} - \mathbf{C}_{\text{black}})$$

4. **Amount to Tint Interpolation**:
   Let $\alpha_{\text{blend}} = \text{clamp}(\text{AmountToTint} / 100.0, \, 0.0, \, 1.0)$:
   $$\mathbf{C}_{\text{blended}} = (1.0 - \alpha_{\text{blend}}) \, \mathbf{C}_{\text{rgb}} + \alpha_{\text{blend}} \, \mathbf{C}_{\text{tinted}}$$

5. **Alpha Premultiplication**:
   $$\mathbf{C}_{\text{out}} = \text{vec4}(\mathbf{C}_{\text{blended}} \times A, \; A)$$

---

## Dynamic Attribute Bindings

| Parameter | Type | Slot Key | Default |
| :--- | :--- | :--- | :--- |
| `Amount to Tint` | Double (0-100) | `amountToTint` | `100.0` |
| `Map Black To` | Color (Hex/Vec4) | `mapBlackTo` | `#000000` |
| `Map White To` | Color (Hex/Vec4) | `mapWhiteTo` | `#FFFFFF` |

---

## Known Differences from Adobe After Effects

| Feature | Adobe After Effects | Cavalry 2.8+ (This Implementation) |
| :--- | :--- | :--- |
| **Precision** | 8-bpc, 16-bpc, or 32-bpc float depending on project setting | Native GPU 32-bit floating-point (`half` / `float`) execution |
| **Color Management** | Dependent on working color space (sRGB, Rec. 709, ACEScc) | Linear sRGB SkSL pipeline |
| **Performance** | CPU rasterized unless GPU effect pipeline is active | Fully parallelized GPU fragment shader |

---

## Verification Protocol

1. **Tier 1 (Static)**: Verified in `test/tint.test.mjs`.
2. **Tier 2 (Math)**: Rec. 601 luminance invariants and linear interpolation confirmed.
3. **Tier 3 (Mock)**: Dynamic color slot binding and headless attachment tested.
4. **Tier 4 (Live)**: Executed against live Cavalry 2.8 (`http://127.0.0.1:8080`).
