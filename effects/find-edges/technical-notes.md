# Find Edges: Technical Notes & Invariants

## Sobel Gradient Operator
Given a 3x3 fragment neighborhood:
$$\mathbf{G}_x = \begin{bmatrix} -1 & 0 & +1 \\ -2 & 0 & +2 \\ -1 & 0 & +1 \end{bmatrix}, \quad \mathbf{G}_y = \begin{bmatrix} -1 & -2 & -1 \\ 0 & 0 & 0 \\ +1 & +2 & +1 \end{bmatrix}$$

For each RGB channel:
$$g_x = \sum_{i,j} \mathbf{G}_x(i,j) \cdot I(i,j)$$
$$g_y = \sum_{i,j} \mathbf{G}_y(i,j) \cdot I(i,j)$$
$$M = \min(1.0, 0.7 \cdot \sqrt{g_x^2 + g_y^2})$$

## Inversion & Output Color
- **Standard (Invert = 0)**: $\mathbf{C} = 1.0 - M$ (dark lines on white ground).
- **Inverted (Invert = 1)**: $\mathbf{C} = M$ (bright glowing lines on black ground).

Output is modulated by $\alpha_{\text{orig}}$ to preserve transparent background boundaries:
$$\mathbf{C}_{\text{out}} = \mathbf{C} \cdot \alpha_{\text{orig}}$$
$$\alpha_{\text{out}} = \alpha_{\text{orig}}$$
