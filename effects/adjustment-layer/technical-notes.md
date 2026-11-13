# Technical Notes: Adjustment Layer -> Cavalry 2.8+

## Architectural Model

In Adobe After Effects, an Adjustment Layer is an empty visual solid with its "Adjustment" switch enabled. In AE's rendering pipeline, any effect applied to this solid samples the composite buffer of all layers stacked *below* it in the timeline.

In Cavalry 2.8+, rendering is governed by a directed acyclic graph (DAG). To achieve equivalent non-destructive multi-layer visual grading and effect application:
1. **Container Primitive**: Native `group` layer (`api.create('group')`).
2. **Hierarchy Containment**: Target layers are reparented into the group (`api.parent(childId, groupId)`), establishing a localized composite bounding box.
3. **Filter Pipeline**: An SkSL filter or shader chain connects to the group's `filters` port (`api.connect(filterId, 'id', groupId, 'filters')`).
4. **Composite Traversal**: Cavalry renders child elements to an offscreen buffer, which is subsequently passed into the group's shader pipeline before final comp compositing.

---

## Cavalry API Implementation Details

- **Creation**: `api.create('group')`
- **Naming**: Prefixed with `[AE:Adjustment Layer]` for clear identification in the Scene Window.
- **Parenting**: Layer parenting is verified using `api.getParent(childId) === groupId`.
- **Default Filter**: SkSL Color Adjustment filter (`Exposure`, `Contrast`, `Saturation`) provisioned with dynamic attribute slots.
- **Selection State**: Automatically restores selection to the newly created Adjustment Layer group.

---

## Known Differences from Adobe After Effects

| Feature | Adobe After Effects | Cavalry 2.8+ (This Implementation) |
| :--- | :--- | :--- |
| **Scope** | Stacking order dependent: affects all active layers below it in timeline | Container dependent: affects all child layers enclosed inside the group |
| **Masking** | Masking the adjustment layer clips the effect region | Masking the group or applying a matte clips the composite pipeline |
| **Scene Graph Isolation** | Unbounded (leaks down to background unless pre-composed) | Strictly encapsulated (no unintended leakage to background or sibling groups) |

---

## Verification Protocol

1. **Tier 1 (Static)**: Verified in `test/adjustment-layer.test.mjs`.
2. **Tier 3 (Mock)**: Simulated hierarchy grouping and filter attachment in `StallionMock`.
3. **Tier 4 (Live)**: Executed against live Cavalry 2.8 (`http://127.0.0.1:8080`) via `scripts/live-verify-all-effects.mjs`.
