# Exposure: Technical Notes & Mathematical Derivation

## Algorithmic Formulation

For an input normalized channel value $c \in [0, 1]$:

$$C' = c \times 2^{\text{Exposure}} + \text{Offset}$$

If $C' \neq 0$:
$$C'' = \text{sign}(C') \times |C'|^{1.0 / \text{GammaCorrection}}$$

The result is clamped to $[0.0, 1.0]$ for standard dynamic range rendering.

## Invariant Properties
- **Zero Exposure with zero offset & gamma 1.0**: Perfect identity.
- **+1 EV stop**: Doubles linear energy ($c \times 2^1 = 2c$).
- **-1 EV stop**: Halves linear energy ($c \times 2^{-1} = 0.5c$).
- **Offset > 0**: Raises black levels linearly across all channels.
