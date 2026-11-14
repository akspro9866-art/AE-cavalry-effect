# Levels: Technical Notes & Mathematical Derivation

## Algorithmic Formulation

For an input normalized channel value $c \in [0, 1]$:

$$t = \text{clamp}\left(\frac{c - \frac{\text{inB}}{255}}{\max\left(\frac{\text{inW} - \text{inB}}{255}, 10^{-5}\right)}, 0.0, 1.0\right)$$

Gamma power transformation:
$$t' = t^{1.0 / \gamma}$$

Output level remapping:
$$c_{\text{out}} = \text{clamp}\left(\frac{\text{outB}}{255} + t' \times \left(\frac{\text{outW} - \text{outB}}{255}\right), 0.0, 1.0\right)$$

## Boundary Handling
- When $\text{inW} \approx \text{inB}$, division by zero is prevented by clamping the denominator span to $10^{-5}$.
- When $\gamma \to 0$, gamma is clamped to a minimum of $0.01$ to prevent floating point overflow.
- Alpha unmultiplication ensures zero fringing at anti-aliased boundaries:
  $$\text{rgb}_{\text{straight}} = \frac{\text{src.rgb}}{\max(\text{src.a}, 10^{-4})}$$
  $$\text{final} = \text{rgb}_{\text{remapped}} \times \text{src.a}$$
