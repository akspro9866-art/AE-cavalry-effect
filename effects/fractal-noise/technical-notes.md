# Technical Notes: Fractal Noise -> Cavalry 2.8+

## Architectural Model

Adobe After Effects' Fractal Noise creates multi-scale procedural noise textures using layered gradient noise octaves (Fractional Brownian Motion, or fBm).

In Cavalry 2.8+, Fractal Noise is implemented as a GPU-accelerated SkSL Filter (`skslFilter`), evaluating 4D Simplex noise algorithms per fragment at full display resolution without texture memory overhead.

---

## Mathematical Formulation

1. **Fractional Brownian Motion (fBm)**:
   For position $\mathbf{x} = (u, v)$ and evolution angle $\theta$:
   $$\text{fBm}(\mathbf{x}) = \sum_{i=0}^{N-1} A_i \cdot \text{noise}\left( \mathbf{x} \cdot 2^i, \; \mathbf{e}(\theta) \cdot 2^i \right)$$
   Where:
   - $N = \text{Octaves}$ (typically 1 to 10)
   - $A_i = \text{Roughness}^i$ (amplitude decay)
   - $2^i = \text{Lacunarity}^i$ (frequency multiplier)

2. **4D Torus Evolution Looping**:
   To ensure seamless periodic looping when `Cycle Evolution` is enabled with cycle count $C$:
   $$\mathbf{e}(\theta) = \left( R \cos\left(\frac{2\pi \theta}{C}\right), \; R \sin\left(\frac{2\pi \theta}{C}\right) \right)$$

3. **Contrast and Brightness Remapping**:
   Let $N_{\text{raw}} \in [-1, 1]$ be the normalized noise value:
   $$N_{\text{adj}} = \left( N_{\text{raw}} \times \frac{\text{Contrast}}{100} \right) + \frac{\text{Brightness}}{100}$$

4. **Overflow Functions**:
   - **Clip**:
     $$N_{\text{out}} = \text{clamp}(N_{\text{adj}}, 0.0, 1.0)$$
   - **Soft Clamp** (smoothstep S-curve):
     $$N_{\text{out}} = \frac{1}{1 + e^{-4 \cdot N_{\text{adj}}}}$$
   - **Wrap** (triangle wave reflection):
     $$N_{\text{out}} = |2 \cdot \text{fract}(0.5 \cdot N_{\text{adj}}) - 1.0|$$

---

## Dynamic Attribute Bindings

| Parameter | Type | Slot Key | Default |
| :--- | :--- | :--- | :--- |
| `Fractal Type` | Enum (0-4) | `fractalType` | `0` (Basic) |
| `Noise Type` | Enum (0-2) | `noiseType` | `1` (Soft Linear) |
| `Invert` | Boolean | `invert` | `false` |
| `Contrast` | Double | `contrast` | `100.0` |
| `Brightness` | Double | `brightness` | `0.0` |
| `Overflow` | Enum (0-2) | `overflow` | `0` (Clip) |
| `Transform Scale` | Double | `scale` | `100.0` |
| `Complexity` (Octaves) | Double | `octaves` | `6.0` |
| `Evolution` | Double (Degrees) | `evolution` | `0.0` |
| `Cycle Evolution` | Boolean | `cycleEvolution` | `false` |
| `Cycle (Revolutions)` | Double | `cycleRevolutions` | `1.0` |
| `Opacity` | Double (0-100) | `opacity` | `100.0` |

---

## Known Differences from Adobe After Effects

| Feature | Adobe After Effects | Cavalry 2.8+ (This Implementation) |
| :--- | :--- | :--- |
| **Noise Types** | Soft Linear, Linear, Spline, Block | Soft Linear (Simplex) optimized for GPU SkSL execution |
| **Fractal Types** | 15+ sub-types (including Max, Marble, Terrain) | 5 core types: Basic, Turbulent Smooth, Turbulent Basic, Turbulent Sharp, Dynamic |
| **Resolution** | Layer-size dependent CPU/GPU cache buffer | Real-time procedural fragment generation at infinite canvas resolution |

---

## Verification Protocol

1. **Tier 1 (Static)**: Verified in `test/fractal-noise.test.mjs`.
2. **Tier 2 (Math)**: Contrast/brightness invariants and overflow response validated.
3. **Tier 3 (Mock)**: Headless dynamic attribute binding verified.
4. **Tier 4 (Live)**: Executed against live Cavalry 2.8 (`http://127.0.0.1:8080`).
