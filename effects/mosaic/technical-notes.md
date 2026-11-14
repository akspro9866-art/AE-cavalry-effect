# Mosaic: Technical Notes & Mathematical Derivation

## Algorithmic Formulation

Given layer bounding dimensions $\mathbf{R} = (W, H)$ in Cavalry centered coordinate space:
For fragment coordinate $\mathbf{x} \in [-W/2, W/2] \times [-H/2, H/2]$:

Normalized UV conversion:
$$\mathbf{u} = \frac{\mathbf{x} + \mathbf{R}/2}{\mathbf{R}}$$

Grid quantization for cell counts $(N_x, N_y)$:
$$\mathbf{cell} = \lfloor \mathbf{u} \times (N_x, N_y) \rfloor$$

Representative cell center:
$$\mathbf{u}_{\text{center}} = \frac{\mathbf{cell} + 0.5}{(N_x, N_y)}$$

Centered coordinate sample point:
$$\mathbf{x}_{\text{sample}} = \mathbf{u}_{\text{center}} \times \mathbf{R} - \frac{\mathbf{R}}{2}$$

## Invariant Properties
- Multiple coordinates falling within the same block $[k/N, (k+1)/N]$ map to the identical center sample point.
- Resolution-independent coordinate mapping ensures symmetric mosaic tiles across composition resizing.
