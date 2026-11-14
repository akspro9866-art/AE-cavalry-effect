# Color Balance: Technical Notes & Invariants

## Luminance Partition of Unity
Given linear or gamma-encoded RGB:
$$Y = 0.299 R + 0.587 G + 0.114 B$$

Tonal activation curves:
- Shadows: $w_s(Y) = (\max(0, 1 - 2Y))^2$
- Midtones: $w_m(Y) = (\max(0, 1 - |2Y - 1|))^2$
- Highlights: $w_h(Y) = (\max(0, 2Y - 1))^2$

Normalized weights:
$$\hat{w}_i = \frac{w_i}{\sum w}$$

Chromatic shift:
$$\mathbf{\Delta} = \hat{w}_s \mathbf{\Delta}_s + \hat{w}_m \mathbf{\Delta}_m + \hat{w}_h \mathbf{\Delta}_h$$
$$\mathbf{C}' = \text{clamp}(\mathbf{C} + \mathbf{\Delta}, 0, 1)$$

## Luminosity Preservation
When active:
$$Y_{\text{out}} = 0.299 R' + 0.587 G' + 0.114 B'$$
$$\mathbf{C}'' = \text{clamp}(\mathbf{C}' + (Y - Y_{\text{out}}), 0, 1)$$
This satisfies $\text{Luminance}(\mathbf{C}'') \approx Y$.
