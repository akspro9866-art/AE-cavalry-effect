# Bevel Alpha: Technical Notes & Mathematical Derivation

## Algorithmic Formulation

For fragment coordinate $\mathbf{x}$ and edge thickness $\delta$:
Alpha neighborhood gradients:
$$\mathbf{n} = (\alpha(x-\delta) - \alpha(x+\delta), \alpha(y-\delta) - \alpha(y+\delta))$$

The vector $\mathbf{n}$ points inward (uphill) toward opaque regions.
Light direction vector:
$$\mathbf{L} = (\cos\theta, \sin\theta)$$

Diffuse lighting scalar:
$$d = (\mathbf{n} \cdot \mathbf{L}) \times I_{\text{light}}$$

- If $d > 0$: The rim faces the light source. Color is blended toward `HighlightColor` by factor $d$.
- If $d < 0$: The rim is shielded from the light source. Color is blended toward `ShadowColor` by factor $-d$.
- When $\mathbf{n} = (0, 0)$ (interior flat regions or outside transparent areas), $d = 0$, producing zero discoloration.
