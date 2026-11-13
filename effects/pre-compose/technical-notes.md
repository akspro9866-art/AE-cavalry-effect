# Technical Notes: Pre-Compose -> Cavalry 2.8+

## Architectural Model

In Adobe After Effects, Pre-Composing encapsulates one or more selected layers into a new, nested composition, leaving a single composition layer in the parent timeline.

In Cavalry 2.8+, composition encapsulation is provided by the native `api.preCompose()` engine. It packages the selected graph nodes into an isolated sub-composition asset and instantiates a `compositionReference` node in the active scene.

---

## Cavalry API Implementation Details

1. **Selection Preconditions**: Requires at least one selected layer ($N \ge 1$).
2. **Encapsulation Execution**:
   ```javascript
   const res = api.preCompose(selection, compName);
   ```
3. **Reference Discovery**:
   Cavalry may return either:
   - An object/string representing the created composition or reference node.
   - Or it creates the `compositionReference` as a side effect and adds it to the active selection.
   The implementation inspects `api.getSelection()` and node graph changes to identify the new reference node with certainty.
4. **Selection Restoration**:
   The active selection is updated to point exclusively to the new `compositionReference` node.

---

## Known Differences from Adobe After Effects

| Feature | Adobe After Effects | Cavalry 2.8+ (This Implementation) |
| :--- | :--- | :--- |
| **Attribute Options** | Dialog prompt for "Leave all attributes" vs "Move all attributes" | Encapsulates nodes and attributes directly into the nested sub-composition |
| **Duration / Timing** | Can trim pre-comp to selection duration or inherit comp duration | Inherits scene frame range settings |
| **Reference Node** | Standard composition layer | Native `compositionReference` node |

---

## Verification Protocol

1. **Tier 1 (Static)**: Verified in `test/pre-compose.test.mjs`.
2. **Tier 3 (Mock)**: Fault-injection tests verify empty selection handling and `null` return detection.
3. **Tier 4 (Live)**: Executed against live Cavalry 2.8 (`http://127.0.0.1:8080`).
