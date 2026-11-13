# Technical Notes: CC RepeTile -> Cavalry 2.8+

## Mathematical Formulation

CC RepeTile expands layer boundaries by tiling or reflecting image content across the perimeter.
In Cavalry's GPU SkSL pipeline:

### 1. Coordinate Mapping

Let normalized UV space be:
$$u = \frac{\text{fragCoord}.x}{\text{resolution}.x} + 0.5$$
$$v = \frac{\text{fragCoord}.y}{\text{resolution}.y} + 0.5$$

For coordinates outside the original layer ($u < 0$, $u > 1$, $v < 0$, or $v > 1$):
- **Flip / Ping-Pong (Mode 1)**:
  $$k_u = \lfloor u \rfloor, \quad f_u = u - k_u$$
  $$u' = (|k_u| \pmod 2 == 0) \;?\; f_u : (1.0 - f_u)$$
  $$k_v = \lfloor v \rfloor, \quad f_v = v - k_v$$
  $$v' = (|k_v| \pmod 2 == 0) \;?\; f_v : (1.0 - f_v)$$
  This enforces continuous $C^0$ seam symmetry across all quadrant boundaries.
- **Repeat (Mode 0)**:
  $$u' = u - \lfloor u \rfloor$$
  $$v' = v - \lfloor v \rfloor$$
- **Brick (Mode 3)**:
  $$k_y = \lfloor v \rfloor$$
  $$\text{shift} = (|k_y| \pmod 2 == 0) \;?\; 0.0 : 0.5$$
  $$u' = (u + \text{shift}) - \lfloor u + \text{shift} \rfloor$$
  $$v' = v - \lfloor v \rfloor$$

### 2. Padding Expansion
The SkSL filter's `padding` property dynamically updates to:
$$\text{padding}.x = \max(\text{ExpandLeft}, \text{ExpandRight})$$
$$\text{padding}.y = \max(\text{ExpandUp}, \text{ExpandDown})$$
This allows the canvas to bloom outward without clipping.
