# Hue/Saturation: Technical Notes & Mathematical Derivation

## Algorithmic Formulation

Color conversions between linear/sRGB and HSL:

$$L = \frac{\max(R, G, B) + \min(R, G, B)}{2}$$

$$\Delta = \max(R, G, B) - \min(R, G, B)$$

If $\Delta > 10^{-5}$:
$$S = \begin{cases} \frac{\Delta}{2 - \max - \min} & \text{if } L > 0.5 \\ \frac{\Delta}{\max + \min} & \text{if } L \le 0.5 \end{cases}$$

$$H = \begin{cases} \frac{G - B}{\Delta} + (G < B ? 6 : 0) & \text{if } \max = R \\ \frac{B - R}{\Delta} + 2 & \text{if } \max = G \\ \frac{R - G}{\Delta} + 4 & \text{if } \max = B \end{cases}$$

$$H = \frac{H}{6}$$

## Hue Rotation & Saturation Modulation
- In non-colorize mode:
  $$H' = \text{fract}\left(H + \frac{\text{MasterHue}}{360^\circ} + 1.0\right)$$
- If Saturation $> 0$:
  $$S' = S + (1.0 - S) \times \frac{\text{MasterSaturation}}{100}$$
- If Saturation $< 0$:
  $$S' = S \times \left(1.0 + \frac{\text{MasterSaturation}}{100}\right)$$
- Full saturation reduction ($\text{MasterSaturation} = -100\%$) guarantees $S'=0$ (perfect monochrome grayscale).
