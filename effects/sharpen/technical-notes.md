# Sharpen: Technical Notes & Mathematical Derivation

## Algorithmic Formulation

For fragment coordinate $\mathbf{x}$ and radius $r = \max(\text{Radius}, 0.5)$:
The low-frequency blurred base $C_{\text{blur}}$ is evaluated over an 8-point radial ring:
- 4 axial neighbors: $(\pm r, 0), (0, \pm r)$ with weight $w_a = 0.15$
- 4 diagonal neighbors: $(\pm r \frac{\sqrt{2}}{2}, \pm r \frac{\sqrt{2}}{2})$ with weight $w_d = 0.10$

High-frequency differential:
$$\Delta = C - C_{\text{blur}}$$

If $|\Delta| \ge \frac{\text{Threshold}}{255}$:
$$C_{\text{sharpened}} = \text{clamp}\left(C + \Delta \times \frac{\text{SharpenAmount}}{25.0}, 0.0, 1.0\right)$$

- When $\Delta = 0$ (uniform color field), $C_{\text{sharpened}} = C$ exactly (no color drift).
- At edges, local maxima are increased and local minima are decreased, boosting apparent edge acutance.
