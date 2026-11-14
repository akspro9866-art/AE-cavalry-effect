# Posterize: Technical Notes & Mathematical Derivation

## Algorithmic Formulation

For an input normalized color channel $c \in [0, 1]$ and requested discrete level count $N \ge 2$:

$$c_{\text{quantized}} = \text{clamp}\left(\frac{\lfloor c \times N \rfloor}{N - 1}, 0.0, 1.0\right)$$

- When $N = 2$, values are quantized into 2 discrete states: $\{0.0, 1.0\}$.
- When $N = 4$, values are quantized into 4 discrete states: $\{0.0, 0.333, 0.667, 1.0\}$.
- Boundary conditions: $c = 0.0 \to 0.0$; $c = 1.0 \to 1.0$.
