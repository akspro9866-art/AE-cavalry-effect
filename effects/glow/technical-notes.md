# Glow: Technical Notes & Mathematical Derivation

## Algorithmic Formulation

### 1. Threshold Gating
Luminance:
$$Y = 0.299R + 0.587G + 0.114B$$

For threshold parameter $T \in [0, 1]$:
$$\text{Factor}(Y) = \begin{cases} 0 & \text{if } Y \le T \\ \frac{Y - T}{1.0 - T} & \text{if } Y > T \end{cases}$$

### 2. Isotropic Multi-Stage Spiral Convolution
A 24-tap Vogel disc with Gaussian falloff models physical optical dispersion:
$$\mathbf{offset}_i = r_i (\cos\phi_i, \sin\phi_i), \quad r_i = R_{\text{max}} \sqrt{\frac{i+0.5}{24}}, \quad \phi_i = i \times 137.507764^\circ$$
$$w_i = \exp\left(-\frac{r_i^2}{2 R_{\text{max}}^2 \times 0.3}\right)$$

### 3. A/B Color Ramp Looping
$$t = \text{fract}(Y_{\text{glow}} \times \text{Looping} + \text{Phase} / 360^\circ)$$
$$C_{\text{glow}} = \text{mix}(C_A, C_B, t) \times \alpha_{\text{glow}}$$

### 4. Blending Operations
- **Add**: $C_{\text{final}} = C_{\text{src}} + C_{\text{glow}}$
- **Screen**: $C_{\text{final}} = C_{\text{src}} + C_{\text{glow}} - C_{\text{src}} C_{\text{glow}}$
