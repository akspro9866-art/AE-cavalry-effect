# Drop Shadow: Technical Notes & Mathematical Derivation

## Algorithmic Formulation

For angle $\theta$ and distance $D$:
$$\mathbf{\delta} = (\cos\theta, \sin\theta) \times D$$

The displaced shadow coordinate is:
$$\mathbf{x}_{\text{shadow}} = \mathbf{x} - \mathbf{\delta}$$

### Isotropic Spiral Blur
When $\text{Softness} > 0.5$, alpha is sampled using a 16-tap Vogel spiral:
$$\phi_i = i \times 137.507764^\circ$$
$$r_i = r_{\text{max}} \sqrt{\frac{i + 0.5}{16}}$$
$$w_i = \exp\left(-\frac{r_i^2}{2\sigma^2}\right)$$

### Over Composition
$$\alpha_{\text{shadow}} = \alpha_{\text{diffused}} \times \frac{\text{Opacity}}{100} \times \text{ShadowColor.a}$$
$$C_{\text{out}} = S + \text{ShadowColor} \times \alpha_{\text{shadow}} \times (1.0 - S_a)$$
When $S_a = 1.0$ (opaque source pixel), the shadow is occluded, matching physical obscuration.
