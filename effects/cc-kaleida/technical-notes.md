# CC Kaleida: Technical Notes & Invariants

## Polar Transformation & Symmetry
Given coordinate $\mathbf{p} = \mathbf{fragCoord} - \mathbf{Center}$:
1. Radius: $r = \|\mathbf{p}\| / (\text{Size} / 100)$
2. Angle: $\theta = \text{atan2}(-p_y, p_x) - \theta_{\text{rot}} \pmod{2\pi}$
3. Sector angular width: $\alpha = \frac{2\pi}{N}$
4. Normalized sector phase: $u = \theta / \alpha$
5. Fraction inside sector: $t = u - \lfloor u \rfloor \in [0, 1)$

## Bilateral Reflection & Continuity
To prevent harsh cuts and discontinuities across sector seams:
$$t_{\text{mirrored}} = |2t - 1| \in [0, 1]$$
Mapped angle:
$$\theta' = t_{\text{mirrored}} \cdot \frac{\alpha}{2}$$

At $t = 0$ (boundary): $t_{\text{mirrored}} = 1 \implies \theta' = \alpha / 2$.
At $t = 1$ (boundary): $t_{\text{mirrored}} = 1 \implies \theta' = \alpha / 2$.
At $t = 0.5$ (midline): $t_{\text{mirrored}} = 0 \implies \theta' = 0$.

Both borders match the adjacent sector's value and slope identically.
