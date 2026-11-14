# Gradient Ramp: Technical Notes & Invariants

## Gradient Interpolation Mathematics
Given start coordinate $\mathbf{P}_0 = (x_0, y_0)$ and end coordinate $\mathbf{P}_1 = (x_1, y_1)$:

### Linear Ramp
Vector: $\mathbf{v} = \mathbf{P}_1 - \mathbf{P}_0$.
Projection parameter:
$$t = \text{clamp}\left(\frac{(\mathbf{p} - \mathbf{P}_0) \cdot \mathbf{v}}{\|\mathbf{v}\|^2}, 0.0, 1.0\right)$$

### Radial Ramp
Radius: $R = \|\mathbf{P}_1 - \mathbf{P}_0\|$.
Radial parameter:
$$t = \text{clamp}\left(\frac{\|\mathbf{p} - \mathbf{P}_0\|}{R}, 0.0, 1.0\right)$$

### Color Output & Alpha
Color:
$$\mathbf{C}_{\text{ramp}} = (1 - t) \cdot \mathbf{C}_{\text{start}} + t \cdot \mathbf{C}_{\text{end}}$$

With original pixel $\mathbf{C}_{\text{orig}}$ and blend factor $B \in [0, 1]$:
$$\mathbf{C}_{\text{out}} = (1 - B) \cdot (\mathbf{C}_{\text{ramp}} \cdot \alpha_{\text{orig}}) + B \cdot \mathbf{C}_{\text{orig}}$$
Transparent background areas preserve ramp visibility when appropriate.
