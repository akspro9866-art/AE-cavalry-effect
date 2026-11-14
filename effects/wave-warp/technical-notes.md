# Wave Warp: Technical Notes & Invariants

## Coordinate Mathematics
Given coordinate $\mathbf{p} = (x, y)$ and direction angle $\theta$:
1. Propagation axis: $\mathbf{u} = (\cos\theta, \sin\theta)$
2. Transverse displacement axis: $\mathbf{v} = (-\sin\theta, \cos\theta)$
3. Distance along wave: $s = \mathbf{p} \cdot \mathbf{u}$
4. Wave spatial frequency: $k = \frac{2\pi}{\lambda}$
5. Wave phase: $\phi = s \cdot k + \phi_0$

Displacement vector:
$$\mathbf{d} = \mathbf{v} \cdot (H \cdot W(\phi) \cdot P(\mathbf{p}))$$

Where:
- $H$ is `WaveHeight`.
- $W(\phi)$ is the evaluated waveform normalized in $[-1, 1]$.
- $P(\mathbf{p}) \in [0, 1]$ is the edge-pinning attenuation factor.

Sampled coordinate:
$$\mathbf{p}' = \mathbf{p} - \mathbf{d}$$

## Edge Pinning
Pinning smoothly ramps displacement from 0 at the pinned edge to 1 across the layer boundary, preserving connection points for ropes, banners, text baselines, or stems.
