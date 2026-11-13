# JavaScript Deformer Template (`javaScriptDeformer`)

Use **JavaScript Deformer** (`javaScriptDeformer`) when an After Effects effect primarily reshapes **editable vector outlines, paths, vertices, or mesh hierarchy** (and you need true vector output or Lottie path fidelity rather than raster filtering).

## Cavalry 2.8.0 Verified Contract

- Node type: `'javaScriptDeformer'`
- Code attribute: `'expression'` (NOT `'code'`)
- Attachment port: `api.connect(defId, 'id', targetShapeId, 'deformers')`
- Allowed context globals (`validateCavalryContextUsage`): `console`, `ctx`, `cavalry`, `def` (**NO** `api`, `ui`, `plugin`, `install`, `render`).
- Key APIs on `def`:
  - `def.getRootMesh()` -> `cavalry.Mesh`
  - `def.setRootMesh(mesh)`
  - `def.getPoints()`, `def.setPoints(points)`
  - `def.getBoundingBox()`
  - `def.getFalloffAtPoint(point)`
  - `def.meshDepth`, `def.meshCountAtDepth(d)`, `def.getMeshesAtDepth(d)`, `def.setMeshesAtDepth(d, meshes)`
- Key APIs on `cavalry.Path`:
  - `path.convertToLines(linesPerCurve)`
  - `path.resample(edgeLength)` — essential so low-vertex boxes/lines can warp smoothly instead of only bending corners!
  - `path.pathData()` / `path.setPathData(...)` or `path.translate(...)` / `path.toObject()` (always check live `cavalry.Path` methods if manipulating raw curves vs polygonal vertices).

## Time & Parameter Handling Without `ctx.frame`

Wait — `@scenery/cavalry-types/types/namespaces/ctx.d.ts` does **not** declare `ctx.frame` or `ctx.time`. Therefore:
- Drive animation by **keyframing a dynamic numeric attribute** (created on the deformer via `api.addDynamic(defId, 'array', 'double')` + `api.renameAttribute(...)` or driven by a `frame` / `time` node connected into that dynamic attribute) and reading `var evolution = Number(evolutionVar)`!
- Never rely on undeclared `ctx.frame` inside a deformer.
