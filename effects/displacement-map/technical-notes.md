# Displacement Map: Technical Notes & Invariants

## Mathematical Channel Mapping
Given a sampled color $\mathbf{C} = (r, g, b, a)$ from the displacement source:
- Red: $v_r = r - 0.5$
- Green: $v_g = g - 0.5$
- Blue: $v_b = b - 0.5$
- Alpha: $v_a = a - 0.5$
- Luminance: $v_L = (0.299 r + 0.587 g + 0.114 b) - 0.5$
- Lightness: $v_{\text{light}} = \frac{\max(r, g, b) + \min(r, g, b)}{2} - 0.5$
- Off: $0.0$

Coordinate Deflection:
$$\Delta x = v(ch_x) \times \text{MaxHorizontalDisplacement}$$
$$\Delta y = v(ch_y) \times \text{MaxVerticalDisplacement}$$
$$\mathbf{p}' = \mathbf{p} - (\Delta x, \Delta y)$$

## Cavalry Architecture
Cavalry 2.8's `skslFilter` evaluates on the target layer's raster buffer. When a secondary displacement source layer is specified, the applicator links the source via `api.connect(mapSourceId, 'id', filterId, 'mattes.0')`. Per Cavalry's filter matte semantics (and a live 2.8 probe, 2026-11), this **constrains the region where the filter applies only** — `mattes` connections and shader-type `inputs.*` dynamics do not bind layer content into the SkSL code. AE's map-channel-driven displacement therefore cannot be reproduced with a single `skslFilter`; the displacement signal is derived from the target layer itself, and the applicator returns an explicit warning documenting this whenever a map layer is connected.
