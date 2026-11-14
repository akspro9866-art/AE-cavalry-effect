# Motion Tile: Technical Notes & Invariants

## Coordinate Wrapping
Given layer dimensions $\mathbf{R} = (w, h)$ and tile percentages $(s_x, s_y)$:
1. Tile dimensions in pixels: $\mathbf{T} = \mathbf{R} \odot (s_x / 100, s_y / 100)$
2. Centered coordinate: $\mathbf{p} = \mathbf{fragCoord} - \mathbf{C}$
3. Row stagger: $p_x' = p_x - (\text{Phase} / 360.0) \cdot T_x \cdot \lfloor p_y / T_y + 0.5 \rfloor$
4. Normalized coordinates: $u = p_x' / T_x + 0.5$, $v = p_y / T_y + 0.5$
5. Tile index: $k_x = \lfloor u \rfloor$, $k_y = \lfloor v \rfloor$
6. Local fraction: $f_x = \text{fract}(u)$, $f_y = \text{fract}(v)$

## Edge Mirroring
If `MirrorEdges` is true:
- If $|k_x| \pmod 2 = 1$, $f_x \leftarrow 1.0 - f_x$
- If $|k_y| \pmod 2 = 1$, $f_y \leftarrow 1.0 - f_y$

Sampled coordinate:
$$\mathbf{p}_{\text{sample}} = (f_x - 0.5, f_y - 0.5) \odot \mathbf{R}$$
