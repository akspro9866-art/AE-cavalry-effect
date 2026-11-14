# Fast Box Blur: Technical Notes & Mathematical Derivation

## Algorithmic Formulation

Box filtering convolves an input signal with rectangular pulse functions. Repeated convolutions yield higher-order cardinal B-splines:
- Iteration $K=1$: Rectangular kernel $w(x) = 1$ for $|x| \le R$, $0$ elsewhere.
- Iteration $K=2$: Triangular window $w(x) = 1 - \frac{|x|}{2R}$ for $|x| \le 2R$.
- Iteration $K=3$: Cubic B-spline $M_3(x)$ approximating Gaussian bell response while maintaining compact local support.

## Padding Formulation
$$\text{pad}_x = \begin{cases} 0 & \text{if Vertical Only} \\ \lceil R \times K \rceil + 10 & \text{otherwise} \end{cases}$$
$$\text{pad}_y = \begin{cases} 0 & \text{if Horizontal Only} \\ \lceil R \times K \rceil + 10 & \text{otherwise} \end{cases}$$
