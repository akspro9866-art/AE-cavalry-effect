# Technical Notes: AE Turbulent Displace → Cavalry Reconstruction

> **Provenance Notice:** All statements describing Adobe After Effects parameter names, matchNames (`ADBE Turbulent Displace`), default values, UI options, and documented layer-bounds behavior are derived from public Adobe documentation and AE scripting references. No proprietary Adobe source code was inspected or claimed. All mathematical formulas and shaders below are an independent mathematical reconstruction designed for perceptual and physical equivalence inside Cavalry 2.8+.

---

## 1. Documented Adobe After Effects Behavior & Cavalry Controls Mapping

| AE Control | AE MatchName / Type | Default Value | Cavalry Live Slot & Type | Live Cavalry Attribute Name | Description & Reconstruction |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Displacement** | `ADBE Turbulent Displace-0001` (popup) | `Turbulent` (0) | `inputs.0` (`double`) | `Displacement` | 9 modes: `Turbulent` (0), `Bulge` (1), `Twist` (2), `Turbulent Smoother` (3), `Bulge Smoother` (4), `Twist Smoother` (5), `Horizontal Displacement` (6), `Vertical Displacement` (7), `Cross Displacement` (8). |
| **Amount** | `ADBE Turbulent Displace-0002` (slider) | `50` | `inputs.1` (`double`) | `Amount` | Distortion strength/magnitude. `0` = strict pass-through. Negative values invert displacement vectors. |
| **Size** | `ADBE Turbulent Displace-0003` (slider) | `100` | `inputs.2` (`double`) | `Size` | Scale/spatial wavelength of distortion cells in pixels. |
| **Offset (Turbulence)** | `ADBE Turbulent Displace-0004` (point2d) | `[0, 0]` | `inputs.3` (`double2`) | `Offset` | **Native 2D X/Y point control** in Cavalry. Animating pans the warp pattern. Center is `(0, 0)`. |
| **Complexity** | `ADBE Turbulent Displace-0005` (slider) | `1.0` | `inputs.4` (`double`) | `Complexity` | Fractional fractal octave depth (`1.0..10.0`). Continuous octave blending without stepping or popping. |
| **Evolution** | `ADBE Turbulent Displace-0006` (angle) | `0.0°` | `inputs.5` (`double`) | `Evolution` | Animatable phase angle in degrees (`360°` = 1 revolution). Keyframable in timeline. |
| **Cycle Evolution** | `ADBE Turbulent Displace-0008` (checkbox) | `false` | `inputs.6` (`bool`) | `CycleEvolution` | **Native Cavalry checkbox**. Toroidal circle sampling in 4D simplex plane for seamless looping without spatial drift. |
| **Cycle (in Revolutions)** | `ADBE Turbulent Displace-0009` (slider) | `1` | `inputs.7` (`double`) | `CycleRevolutions` | Number of Evolution revolutions before the fractal cycle repeats. |
| **Random Seed** | `ADBE Turbulent Displace-0010` (slider) | `0` | `inputs.8` (`double`) | `RandomSeed` | Base seed value for fractal pattern generation. Folded fractional hashing safe against IEEE float32 overflow. |
| **Pinning** | `ADBE Turbulent Displace-0012` (popup) | `None` (0) | `inputs.9` (`double`) | `Pinning` | Edge boundary pinning: `None` (0), `Pin All` (1), `Pin Horizontal` (2), `Pin Vertical` (3), `Pin Left` (4), `Pin Right` (5), `Pin Top` (6), `Pin Bottom` (7). |
| **Resize Layer** | `ADBE Turbulent Displace-0013` (checkbox) | `true` | `inputs.10` (`bool`) + `padding` | `ResizeLayer` | **Native Cavalry checkbox** + automated `skslFilter.padding` expansion (`ceil(abs(amount)*1.25)`) so warps expand outside original layer bounds when enabled, or clip strictly when disabled. |
| **Antialiasing for Best Quality** | `ADBE Turbulent Displace-0014` (popup) | `Low` (0) | `inputs.11` (`double`) | `Antialiasing` | `Low` (0) = fast bilinear lookup (`layer.eval()`); `High` (1) = 4-tap Rotated Grid Supersampling (RGSS) backward-warped evaluation in premultiplied color space. |

---

## 2. Cavalry Implementation Architecture

### Primary: `skslFilter` (`turbulent-displace.sksl`)
- Works universally on **every** visual Cavalry layer (`rectangleShape`, `ellipseShape`, `textShape`, SVG/vector `group`, raster `image`, `preComp`).
- Warps strokes, fills, gradient interiors, bitmap textures, and sub-layers simultaneously via GPU shader backward mapping `layer.eval(p - D(p))`.
- Parameter controls are exposed directly in Cavalry's Attribute Editor under `inputs` with clean names matching Adobe After Effects: `Displacement`, `Amount`, `Size`, `Offset` (X & Y), `Complexity`, `Evolution`, `CycleEvolution` (checkbox), `CycleRevolutions`, `RandomSeed`, `Pinning`, `ResizeLayer` (checkbox), `Antialiasing`.

### Companion: `javaScriptDeformer` (`turbulent-displace.deformer.js`)
- Used when true editable vector geometry or Lottie contour export is required (`mode: 'deformer'`).
- Subdivides vector outlines via `path.resample(resampleLength)` and displaces vertices & tangent handles in `path.pathData()` / `path.setPathData(pd)` across `def.getRootMesh()`, honoring `def.getFalloffAtPoint(x, y)` and `def.getBoundingBox()`.
- Dynamically exposes identical parameter slots via `array.*` dynamic attributes on the deformer.

---

## 3. Mathematical Reconstruction Details

### 3.1 Sin-Free Symmetric 4D Simplex Noise with Analytical Gradients
- Noise kernel: pure-ALU 4D Simplex `snoise4Grad(float4(ux * freq, uy * freq, z, w))`.
- Permutation uses bounded polynomial hash `perm4(x) = mod289(((w * 34) + 1) * w)` keeping values well within 24-bit float precision.
- 32 symmetric 4D tesseract edge-midpoint gradients decoded branchlessly via bit-exact arithmetic.
- Analytical spatial gradients `(dN/dx, dN/dy)` computed via product rule on radial kernel `m^4 * dot(g, x)` inside the same single 5-corner pass (`Bulge` and `Twist` require zero extra texture or noise taps).

### 3.2 In-Place Toroidal Periodic Evolution (`Cycle Evolution`)
- When `CycleEvolution` is false:
  $$z = \text{seedFrac} + 0.75 \cdot \text{revs}, \quad w = \text{seedFrac} \cdot \phi + \pi$$
- When `CycleEvolution` is true:
  $$\theta = 2\pi \cdot \left(\frac{\text{revs}}{\max(\text{round}(\text{CycleRevolutions}), 1)}\right)$$
  $$z = z_0 + R \cos(\theta), \quad w = w_0 + R \sin(\theta)$$
  Because $\sin(0) = \sin(2\pi)$ and $\cos(0) = \cos(2\pi)$, periodicity holds to floating-point precision with zero spatial panning.

### 3.3 Nine `Displacement` Modes (Matching AE Dropdown)
1. **Turbulent (0):** Two decorrelated 4D Simplex channels $(N_A, N_B)$.
2. **Bulge (1):** Negative spatial gradient $-\nabla N_A \cdot 0.26$ (convergent/divergent displacement).
3. **Twist (2):** Divergence-free 2D curl $(-\partial_y N_A, \partial_x N_A) \cdot 0.28$ (locally volume-preserving swirl).
4. **Turbulent Smoother (3):** Low-pass pre-scaled wavelength ($1.38\times$ Size) + damped higher octaves (0.38 gain).
5. **Bulge Smoother (4):** Smoothed pre-scaled wavelength + damped gradient gain (0.30).
6. **Twist Smoother (5):** Smoothed pre-scaled wavelength + damped curl gain (0.30).
7. **Horizontal Displacement (6):** Horizontal axis distortion only $(N_A, 0)$ (AE option 6).
8. **Vertical Displacement (7):** Vertical axis distortion only $(0, N_B)$ (AE option 7).
9. **Cross Displacement (8):** Axis-dominant orthogonal cross blend scaling axes by $0.45 + 0.85 \cdot \frac{|N_i|}{|N_x|+|N_y|+0.08}$.

### 3.4 Edge Pinning & Coordinate Spaces
- Coordinate system verified live on Cavalry 2.8.0 `skslFilter`: origin `(0, 0)` is at layer center, X is `[-W/2, +W/2]` left-to-right, Y is `[-H/2, +H/2]` bottom-to-top (`+Y` up). Normalized UV is `clamp((px / res) + 0.5, 0, 1)` with `uv.y = 0` (Bottom) and `uv.y = 1` (Top).
- Pinning uses a smoothstep margin ramp `clamp(max(|amount| * 1.15, size * 0.35, 16) / res, 0.03, 0.48)` guaranteeing exact zero displacement along chosen pinned edges while maintaining smooth interior continuity.

---

## 4. Live Cavalry Verification
- Verified live against Cavalry 2.8.0 / 2.8.1 runtime on `127.0.0.1:8080`.
- All 12 dynamic attributes compile cleanly on GPU with zero shader errors.
- Automatic installation to `Scripts -> AE Effects` (`C:\Users\khada\AppData\Roaming\Cavalry\Scripts\AE Effects.js`) enables single-click application to any selected layer.
