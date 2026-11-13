# Technical Notes: Null Object -> Cavalry 2.8+

## Architectural Model

In Adobe After Effects, a Null Object is a 100x100 pixel solid layer with its visibility switch disabled and its anchor point placed at its center. It serves as an invisible transform anchor for parenting and rigging.

In Cavalry 2.8+, `null` is a first-class native node type (`api.create('null')`). It incurs zero raster rendering overhead and functions purely as a transform matrix node within Cavalry's procedural dependency graph.

---

## Mathematical Formulation & Centroid Calculation

When applied to a multi-layer selection $S = \{L_1, L_2, \dots, L_n\}$:

1. **Bounding Box Aggregation**:
   For each layer $L_i$ with position $(p_{i,x}, p_{i,y})$ and dimensions $(w_i, h_i)$:
   $$x_{i,\min} = p_{i,x} - w_i / 2, \quad x_{i,\max} = p_{i,x} + w_i / 2$$
   $$y_{i,\min} = p_{i,y} - h_i / 2, \quad y_{i,\max} = p_{i,y} + h_i / 2$$

2. **Global Extents**:
   $$X_{\min} = \min_{i} x_{i,\min}, \quad X_{\max} = \max_{i} x_{i,\max}$$
   $$Y_{\min} = \min_{i} y_{i,\min}, \quad Y_{\max} = \max_{i} y_{i,\max}$$

3. **Centroid Position**:
   $$\mathbf{C} = \left( \frac{X_{\min} + X_{\max}}{2}, \; \frac{Y_{\min} + Y_{\max}}{2} \right)$$

When no layers are selected, the Null Object is instantiated at the composition origin:
$$\mathbf{C}_{\text{empty}} = (0, 0)$$

---

## Parenting Verification

Parenting operations are executed sequentially:
```javascript
api.parent(childId, nullId);
```
Success is strictly verified via:
```javascript
const actualParent = api.getParent(childId);
if (actualParent === nullId) {
    parentedChildren.push(childId);
} else {
    failedChildren.push(childId);
}
```

---

## Known Differences from Adobe After Effects

| Feature | Adobe After Effects | Cavalry 2.8+ (This Implementation) |
| :--- | :--- | :--- |
| **Layer Type** | Invisible 100x100 Solid | True native non-rendering transform node (`null`) |
| **Placement on Creation** | Top-left of comp (0, 0) or center of comp | Automatically calculated centroid of selected layers |
| **Initial Parenting** | Manual pick-whip required | Automatic parenting of all selected layers on click |
| **Color Coding** | Red solid / wireframe | Coral red wireframe `#F05050` applied automatically |

---

## Verification Protocol

1. **Tier 1 (Static)**: Verified in `test/null-object.test.mjs`.
2. **Tier 2 (Math)**: Bounding-box centroid geometry validated.
3. **Tier 3 (Mock)**: Fault-injection tests verify parenting rollback and partial reporting.
4. **Tier 4 (Live)**: Executed against live Cavalry 2.8 (`http://127.0.0.1:8080`).
