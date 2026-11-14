# Directional Blur: Technical Notes & Mathematical Derivation

## Algorithmic Formulation

For angle $\theta$ in degrees:
$$\mathbf{d} = (\sin(\theta_{\text{rad}}), -\cos(\theta_{\text{rad}}))$$

For total streak length $L = \text{BlurLength}$, the streak extends over $[-\frac{L}{2}\mathbf{d}, +\frac{L}{2}\mathbf{d}]$.
Using a 33-tap Bartlett triangular window:
- Center tap: weight $w_0 = 1.0$ at distance $0$.
- 16 symmetric sample pairs at distances $t_i = \frac{i}{16} \frac{L}{2}$:
  $$w_i = 1.0 - \frac{i}{17}$$
  $$\mathbf{offset}_i = \pm t_i \mathbf{d}$$

Normalization:
$$C_{\text{final}} = \frac{C_0 + \sum_{i=1}^{16} w_i (C_{+i} + C_{-i})}{1.0 + 2 \sum_{i=1}^{16} w_i}$$

## Canvas Padding Expansion
Because directional blur spreads beyond original layer bounding boxes, Cavalry dynamic padding is configured:
$$\text{pad}_x = \lceil |d_x| \frac{L}{2} \rceil + 10$$
$$\text{pad}_y = \lceil |d_y| \frac{L}{2} \rceil + 10$$
When $\theta = 0^\circ$ (vertical), $\text{pad}_x = 10$, $\text{pad}_y \approx L/2 + 10$.
When $\theta = 90^\circ$ (horizontal), $\text{pad}_x \approx L/2 + 10$, $\text{pad}_y = 10$.
