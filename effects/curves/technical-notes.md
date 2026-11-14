# Curves: Technical Notes & Invariants

## Spline Interpolation Mathematics
The tonal curve is modeled using a piecewise Catmull-Rom cubic Hermite spline passing through five fixed-abscissa nodes:
$$P_0 = (0.00, y_0), \quad P_1 = (0.25, y_1), \quad P_2 = (0.50, y_2), \quad P_3 = (0.75, y_3), \quad P_4 = (1.00, y_4)$$

For input $x \in [x_k, x_{k+1}]$ with local parameter $t = (x - x_k) / 0.25$:
$$f(t) = \frac{1}{2} \begin{bmatrix} 1 & t & t^2 & t^3 \end{bmatrix} \begin{bmatrix} 0 & 2 & 0 & 0 \\ -1 & 0 & 1 & 0 \\ 2 & -5 & 4 & -1 \\ -1 & 3 & -3 & 1 \end{bmatrix} \begin{bmatrix} y_{k-1} \\ y_k \\ y_{k+1} \\ y_{k+2} \end{bmatrix}$$

Properties:
- **Interpolation**: $f(0) = y_k$, $f(1) = y_{k+1}$.
- **$C^1$ Continuity**: Tangents match across interval boundaries.
- **Identity Invariant**: When $y = [0.0, 0.25, 0.50, 0.75, 1.0]$, $f(x) \equiv x$ for all $x \in [0, 1]$.
