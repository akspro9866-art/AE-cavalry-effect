# CC Ball Action: Technical Notes

## Mathematical Reconstruction
1. **Grid Bins & Cell Centers**:
   - For any coordinate $(x, y)$, base grid cell is $\mathbf{c} = \lfloor (x, y) / S \rfloor$.
   - Nominal unscattered cell center is $\mathbf{p}_0 = (\mathbf{c} + 0.5) \times S$.
   - Sphere radius $R = 0.5 \times S \times (\text{BallSize} / 100)$.

2. **Scatter Field & Depth Ordering**:
   - Each cell computes a deterministic pseudo-random 3D vector $\mathbf{v} \in [-1, 1]^3$ via hash of $(\mathbf{c}, \text{seed})$.
   - Ball center displaced: $\mathbf{p} = \mathbf{p}_0 + (v_x, v_y) \times \text{Scatter}$.
   - Depth coordinate: $z = v_z \times \text{Scatter}$.
   - Evaluates a 3x3 neighborhood of cells surrounding the fragment to resolve ball overlap and front-to-back occlusion via $z$-buffering.

3. **Surface Normals & Lighting**:
   - For fragment distance $d = \|\mathbf{x} - \mathbf{p}\| \le R$:
     - $N_x = (x - p_x) / R$
     - $N_y = (y - p_y) / R$
     - $N_z = \sqrt{\max(0, 1 - N_x^2 - N_y^2)}$
   - Diffuse term: $0.35 + 0.65 \times \max(0, \mathbf{N} \cdot \mathbf{L})$
   - Specular term: Phong reflection with shininess 16.0.
   - Smoothstep silhouette antialiasing between $[R - 0.5, R + 0.5]$.
