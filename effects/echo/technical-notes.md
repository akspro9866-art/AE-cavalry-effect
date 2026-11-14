# Echo: Technical Notes & Invariants

## Temporal Mathematics
Given $N$ temporal frame samples $\mathbf{S}_0, \mathbf{S}_1, \dots, \mathbf{S}_{N-1}$ at intervals $\Delta t = \text{EchoTime}$:
- Step weight: $w_k = I_0 \cdot D^k$, where $I_0$ is `StartingIntensity` and $D$ is `Decay`.
- Weighted sample: $\mathbf{C}_k = w_k \cdot \mathbf{S}_k$.

Composite operators:
- **Add**: $\mathbf{C}_{\text{out}} = \sum_k \mathbf{C}_k$
- **Maximum**: $\mathbf{C}_{\text{out}} = \max_k \mathbf{C}_k$
- **Minimum**: $\mathbf{C}_{\text{out}} = \min_k \mathbf{C}_k$
- **Screen**: $1 - \prod_k (1 - \mathbf{C}_k)$
- **Composite (Over)**: Standard painter's algorithm $\mathbf{C}_k \text{ over } \mathbf{C}_{k+1}$.

## Cavalry Runtime Limitation & Architectural Notes
GPU SkSL in Cavalry evaluates single-frame raster buffers (`layer.eval(fragCoord)`) and does not possess multi-frame ring buffers or temporal frame history.
The shipped SkSL filter therefore does **not** sample prior frames: it projects `EchoTime` onto a fixed diagonal spatial trail (60 px/s horizontally, 30 px/s vertically) with geometric decay, then applies the selected blending operator. No scene-graph duplicate rig is created automatically.
To achieve authentic temporal echoing across animated shapes/transforms in Cavalry, build a duplicate rig manually (layer duplicates with `timeOffset` / `inFrame` shifts and opacity decay) and skip this filter.
Status: `approximation` / `mock-tested`.
