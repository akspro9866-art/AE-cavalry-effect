# CC Light Sweep: Technical Notes & Mathematical Derivation

## Algorithmic Formulation

For center $\mathbf{C} = (C_x, C_y)$ and direction angle $\theta$:
Normal vector perpendicular to beam path:
$$\mathbf{n} = (-\sin\theta, \cos\theta)$$

Distance from fragment $\mathbf{x}$ to beam line:
$$d = |\mathbf{n} \cdot (\mathbf{x} - \mathbf{C})|$$

When $d < W/2$:
$$u = 1.0 - \frac{d}{W/2}$$
- Linear: $B(u) = u$
- Smooth: $B(u) = 3u^2 - 2u^3$ (Hermite smoothstep)
- Sharp: $B(u) = u^3$

Edge specular highlight from finite-difference alpha gradient:
$$\nabla \alpha = \left(\frac{\alpha(x+\epsilon) - \alpha(x-\epsilon)}{2}, \frac{\alpha(y+\epsilon) - \alpha(y-\epsilon)}{2}\right)$$
$$\text{EdgeFactor} = \|\nabla \alpha\|$$

Composite:
$$C_{\text{final}} = C_{\text{src}} + \text{LightColor} \times (B \times I_{\text{sweep}} + \text{EdgeFactor} \times B \times I_{\text{edge}}) \times \alpha_{\text{src}}$$
