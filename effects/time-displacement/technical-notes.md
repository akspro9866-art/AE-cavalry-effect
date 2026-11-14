# Time Displacement: Technical Notes & Invariants

## Temporal Remapping Model
Given normalized channel value $L(\mathbf{p}) \in [0, 1]$:
1. Continuous time shift: $\Delta t = (L(\mathbf{p}) - 0.5) \times \text{MaxDisplacementTime}$
2. Discrete quantization: $\Delta t_{\text{step}} = \frac{\lfloor \Delta t \cdot \text{FPS} + 0.5 \rfloor}{\text{FPS}}$

## Cavalry Runtime Limitation & Architectural Notes
In Adobe After Effects, Time Displacement evaluates prior and future cached video frames per fragment $I(x, y, t + \Delta t)$.
Cavalry 2.8's `skslFilter` evaluates single-frame raster textures (`layer.eval(fragCoord)`) and does not maintain a 3D historical temporal texture volume in GPU VRAM. 
Consequently, the SkSL filter projects the temporal delay as spatial phase latency / slit-scan displacement while establishing the secondary layer connection via `mattes.0`.
Status: `approximation` / `mock-tested`.
