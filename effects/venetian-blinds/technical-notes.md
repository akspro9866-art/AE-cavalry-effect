# Venetian Blinds: Technical Notes & Invariants

## Mathematical Transition Wipe
Given direction angle $\theta$ and width $W$:
1. Normal vector: $\mathbf{n} = (\cos\theta, \sin\theta)$
2. Coordinate projection: $s = \mathbf{fragCoord} \cdot \mathbf{n}$
3. Normalized strip phase: $t = (s \pmod W) / W \in [0, 1)$
4. Completion: $C = \text{TransitionCompletion} / 100 \in [0, 1]$
5. Feather width: $f = \text{Feather} / W$

Mask Evaluation:
$$M(t) = \text{smoothstep}(C - f, C + f, t)$$
Output:
$$\mathbf{C}_{\text{out}} = \mathbf{C}_{\text{in}} \times M(t)$$
When $C = 0$, $M = 1$ everywhere (100% visible).
When $C = 1$, $M = 0$ everywhere (100% wiped out).
