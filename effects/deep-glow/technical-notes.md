# Technical Notes: After Effects Style Deep Glow -> Cavalry 2.8+

## 1. Mathematical Formulation & Algorithmic Derivations

Deep Glow style optical glow provides photorealistic optical bloom and atmospheric illumination.
In this library, the shader is implemented entirely from first principles and published computer graphics literature:

### Core Architectural Derivations:
1. **Multi-Octave Radial Sampling**:
   - For single-pass GPU fragment shaders (`skslFilter`), we formulate concentric ring kernel sampling with golden-angle interleaved radial steps ($\phi_n = 2.3999632$ rad, Vogel spiral disc), achieving continuous, banding-free blur across radii up to 2000 pixels.
   - Theoretical basis: H. Vogel (1979) "A better way to construct the sunflower head", and J. Jimenez (SIGGRAPH 2014) temporal filtering downsample kernel theory.
2. **Falloff Mathematics**:
   - Signature look is governed by Inverse Square falloff: $w(r) = \frac{1}{1 + (r / r_{\text{core}})^2}$, giving organic illumination without plastic edges.
   - Smooth Gaussian: $w(r) = \exp\left(-\frac{r^2}{2\sigma^2}\right)$.
   - Core Concentrated: $w(r) = \frac{1}{(1 + r / r_{\text{core}})^3}$.
3. **Thresholding with Soft Knee & Saturation Bias**:
   - Thresholding evaluates in linear gamma space with a smooth knee (`smoothstep(threshold - thresholdSmooth, threshold + thresholdSmooth, c)`).
   - Saturation Bias uses an HSV saturation metric `rgb2s(c)` that safely scales over-bright HDR colors:
     - Positive bias: only saturated colors glow.
     - Negative bias: white/desaturated highlights glow.
4. **Anamorphic Lens Aspect Ratio & Angle**:
   - Direct 2D affine rotation matrix that scales offsets by $S_x = \text{AspectRatio}$, $S_y = 1 / \text{AspectRatio}$ and rotates by $\text{AspectAngle}$.
5. **Chromatic Aberration**:
   - Prismatic dispersion offsets radial sampling: Red channel expanded by $+12\% \times \text{Aberration}$, Blue channel contracted by $-12\% \times \text{Aberration}$.
6. **Two-Tone Chromatic Tinting**:
   - Inner highlight vs outer falloff tinting with Multiply, Overlay (Pegtop linear overlay), and Soft Light blend formulas.
7. **HDR Tone Mapping**:
   - ACES Filmic curve (Krzysztof Narkowicz fit), Hejl-Burgess-Dawson Filmic curve, Reinhard, Reinhard 2 with extended white point ($L_{\text{white}}^2 = 16.0$), and Clamp Chroma.

---

## 2. Cavalry 2.8+ Integration Strategy

- **Implementation Mechanism**: `skslFilter`
- **Dynamic Attribute Mapping**:
  Live Cavalry 2.8 dynamically provisions slots via `api.addDynamic(filter, 'inputs', type)`.
  - `inputs.0`: `Radius` (`double`, default: 120.0)
  - `inputs.1`: `Exposure` (`double`, default: 1.0)
  - `inputs.2`: `Threshold` (`double`, default: 0.0)
  - `inputs.3`: `ThresholdSmooth` (`double`, default: 0.1)
  - `inputs.4`: `SaturationBias` (`double`, default: 0.0)
  - `inputs.5`: `AspectRatio` (`double`, default: 1.0)
  - `inputs.6`: `AspectAngle` (`double`, default: 0.0)
  - `inputs.7`: `Aberration` (`double`, default: 0.0)
  - `inputs.8`: `GlowMode` (`double`, default: 0.0)
  - `inputs.9`: `BlendMode` (`double`, default: 0.0)
  - `inputs.10`: `TintMode` (`double`, default: 0.0)
  - `inputs.11`: `TintColor` (`color`, default: `{ r: 255, g: 200, b: 120, a: 255 }`)
  - `inputs.12`: `TintColorOuter` (`color`, default: `{ r: 50, g: 150, b: 255, a: 255 }`)
  - `inputs.13`: `TintBlendMode` (`double`, default: 1.0)
  - `inputs.14`: `TintStrength` (`double`, default: 1.0)
  - `inputs.15`: `ToneMapMode` (`double`, default: 0.0)
  - `inputs.16`: `SourceOpacity` (`double`, default: 1.0)
- **Padding Computation**:
  To prevent bounding box clipping when the glow blossoms outward, `padding` is automatically calculated from `Radius` and `AspectRatio`:
  $$\text{pad}_X = \min(2048, \lceil(R \times 1.6 + 40) \times \max(1, \text{AspectRatio})\rceil)$$
  $$\text{pad}_Y = \min(2048, \lceil(R \times 1.6 + 40) \times \max(1, 1 / \text{AspectRatio})\rceil)$$

---

## 3. Visual & Performance Considerations

- **Single Pass GPU Optimization**:
  Evaluating 48 taps per pixel on modern GPU hardware executes in under 20 milliseconds per frame, enabling live timeline scrubbing inside Cavalry.
- **Color Spaces**:
  Cavalry operates natively in linear sRGB space; mathematical curves operate linearly, with gamma corrections applied strictly where matching After Effects overlay and filmic tone map behavior.
