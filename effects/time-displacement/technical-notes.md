# Time Displacement: Technical Notes & Invariants

## Temporal Remapping Model
Given normalized channel value $L(\mathbf{p}) \in [0, 1]$:
1. Continuous time shift: $\Delta t = (L(\mathbf{p}) - 0.5) \times \text{MaxDisplacementTime}$
2. Discrete quantization: $\Delta t_{\text{step}} = \frac{\lfloor \Delta t \cdot \text{FPS} + 0.5 \rfloor}{\text{FPS}}$

## Cavalry Runtime Limitation & Architectural Notes
In Adobe After Effects, Time Displacement evaluates prior and future cached video frames per fragment $I(x, y, t + \Delta t)$.
Cavalry 2.8's `skslFilter` evaluates single-frame raster textures (`layer.eval(fragCoord)`) and does not maintain a 3D historical temporal texture volume in GPU VRAM.
Consequently, the SkSL filter projects the temporal delay as spatial phase latency / slit-scan displacement.
A live Cavalry 2.8 probe (2026-11) additionally verified that **no second image input exists**: connecting a layer to
`mattes.0` only masks where the filter applies (Cavalry's filter matte semantics), and shader-type `inputs.*` dynamics
do not bind layer content into the code. AE's "Time Displacement Layer" therefore cannot drive the displacement
signal; the applicator emits an explicit warning when a map layer is supplied instead of silently linking a no-op.
Status: `approximation` / `mock-tested`.
