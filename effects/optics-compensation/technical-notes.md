# Optics Compensation: Technical Notes & Invariants

## Lens Distortion Model
Given optical center $\mathbf{c} = (c_x, c_y)$ and point $\mathbf{p} = \mathbf{fragCoord} - \mathbf{c}$:
1. Distance: $r = \|\mathbf{p}\|$
2. Diagonal normalizer: $D = \sqrt{(W/2)^2 + (H/2)^2}$
3. Normalized radius: $\rho = r / D \in [0, 1]$
4. Half-angle of field of view: $\theta_0 = \frac{\text{FOV}}{2} \times \frac{\pi}{180}$

### Forward Projection (Pincushion / Expanding)
$$\theta = \rho \cdot \theta_0$$
$$\rho' = \frac{\tan\theta}{\tan\theta_0}$$

### Reverse Projection (Barrel / Compressing)
$$\rho' = \frac{\text{atan}(\rho \cdot \tan\theta_0)}{\theta_0}$$

Sample coordinate:
$$\mathbf{p}' = \mathbf{c} + \frac{\mathbf{p}}{\|\mathbf{p}\|} \cdot (\rho' \cdot D)$$
Coordinates falling outside the layer bounding box are discarded cleanly to prevent infinite stretching.
