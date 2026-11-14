# Radial Blur: Technical Notes & Mathematical Derivation

## Algorithmic Formulation

For focal center $\mathbf{C} = (C_x, C_y)$ and fragment $\mathbf{x}$:
Radius vector: $\mathbf{r} = \mathbf{x} - \mathbf{C}$.

### 1. Spin Mode (Rotational Convolution)
Maximum angular deflection: $\Delta\theta = \frac{\text{Amount}}{100} \times \frac{\pi}{4}$.
For 16 sample pairs with Bartlett weight $w_i = 1 - \frac{i}{17}$:
$$\mathbf{x}_{\text{cw}} = \mathbf{C} + \mathbf{R}(+\theta_i)\mathbf{r}$$
$$\mathbf{x}_{\text{ccw}} = \mathbf{C} + \mathbf{R}(-\theta_i)\mathbf{r}$$
where $\mathbf{R}(\theta) = \begin{bmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{bmatrix}$.

### 2. Zoom Mode (Scale Convolution)
Maximum radial scale: $s_{\text{max}} = \frac{\text{Amount}}{100} \times 0.5$.
$$\mathbf{x}_{\text{in}} = \mathbf{C} + \mathbf{r}(1 - s_i)$$
$$\mathbf{x}_{\text{out}} = \mathbf{C} + \mathbf{r}(1 + s_i)$$

At $\mathbf{r} \to 0$ (singularity at center), blur collapses to a single sample with zero distortion.
