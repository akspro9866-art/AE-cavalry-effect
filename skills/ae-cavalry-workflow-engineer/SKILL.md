---
name: ae-cavalry-workflow-engineer
description: Guides and automates the creation of Adobe After Effects core composition workflows (Null Objects, Adjustment Layers, Pre-Composing, Parenting hierarchies, Track Mattes, Masking) in Cavalry 2.8+.
---

# AE → Cavalry Workflow Engineer

## Purpose
Enables rapid creation, porting, and verification of Adobe After Effects structural workflows into native Cavalry 2.8+ script implementations.

## Supported Workflow Concepts & Cavalry Equivalents

| After Effects Concept | Cavalry Native Implementation | Cavalry Node / API |
| :--- | :--- | :--- |
| **Null Object** | Invisible transform controller with parenting | `api.create('null', name)` & `api.parent(child, parent)` |
| **Adjustment Layer** | Container applying filters & deformers to underlying layers | `api.create('group', name)` with `filters` array port connection |
| **Pre-Compose** | Moving layers into an isolated composition reference | `api.preCompose(layerIds, compName)` -> `compositionReference` |
| **Track Matte** | Alpha/Luma matte clipping between layers | `api.connect(matteId, 'id', targetId, 'trackMattes')` |
| **Parenting Rig** | Hierarchical transform inheritance | `api.parent(childId, parentId)` / `api.unParent(childId)` |

## Workflow Generation Protocol

1. **Selection Context**:
   - Inspect `api.getSelection()`.
   - Calculate collective bounding boxes: `api.getBoundingBox(id)` / `api.get(id, 'position')`.
2. **Node Creation & Naming**:
   - Use standard tags: `[AE:Null]`, `[AE:Adjustment Layer]`, `[AE:PreComp]`.
   - Set sensible defaults matching After Effects UI standards (e.g. Coral Null `#F05050`).
3. **Hierarchy & Connections**:
   - Preserve layer order and active selection.
   - For Null Objects: parent all selected layers to the Null and center the Null at the collective visual centroid.
   - For Adjustment Layers: group selected layers and connect filtering pipeline to group `filters`.
   - For Pre-Compose: invoke `api.preCompose(selection, name)` and select the resulting `compositionReference`.
4. **Idempotency & Clean Execution**:
   - Provide fallback when no layers are selected (create in comp center or warn cleanly).
   - Return detailed result envelopes with `{ ok: true, ... }`.
5. **Registration & Deployment**:
   - Register in `effect-registry.json`.
   - Run `node scripts/sync-cavalry-script.mjs` to auto-deploy into Cavalry `Scripts -> AE Effects`.
