# Procedural Rig Template (Native Nodes + `_mg` Helpers)

Use **Native Procedural Rigging** when an After Effects effect is structurally better represented by Cavalry's own non-destructive node graph (for example:
- `Repeater` -> `duplicator` (`generator`) + `stagger` / `transform` stepping
- `Posterize Time` -> time/frame stepping / baked `timeScale` / native `posterizeTime` where supported
- `Displacement Map` / `Venetian Blinds` -> `distortionFilter` / `noise` / `duplicator` + `boolean` / `mask`
- `Glow` / `Gaussian Blur` -> native `blurFilter` + `blendMode` (`add`/`screen`) multi-pass rig or SkSL multi-pass filter).

## Authoring Rules

1. Run inside `cavalry-mcp`'s existing `_mg` helper runtime (`helpers: true` on Stallion, or `cavalry_apply_dsl`) so `_mg.rect`, `_mg.duplicator`, `_mg.noise`, `_mg.keyframe`, `_mg.connect`, `_mg.layout` are available without reimplementing them.
2. Wrap the selected object rather than deleting or recreating user artwork from scratch (`parent` under a rig group or feed `targetId` into `duplicator.inputShapes` / `filters` / `masks` / `deformers`).
3. Always verify target node types and attributes against `data/api_reference.json` (`cavalry-mcp`), `@scenery/cavalry-types`, or `cavalry_probe_api`. Never invent attribute names.
4. Keep rig nodes idempotently tagged (`[AE:<effect>]`) so repeat invocation updates attributes rather than multiplying rig trees.
