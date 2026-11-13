# JavaScript Modifier / Utility Template (`javaScript` / `javaScriptModifier`)

Use **JavaScript Utility / Modifier** when an After Effects effect primarily computes **scalar, point, color, or timing values** (for example `Posterize Time`, `Wiggle`, value drivers, or multi-attribute controllers) rather than bitmap pixel filtering or mesh geometry rewriting.

## Cavalry Node Type Selection (`javaScript` vs `javaScriptModifier`)

Always probe the target Cavalry runtime before hardcoding a node type name:
- In Stallion's payload schema and Cavalry's JavaScript API, attribute-evaluating expressions live in utility nodes such as `javaScript` (with `expression` attribute) or `javaScriptModifier` depending on Cavalry version/context.
- Notice `@scenery/cavalry-types` defines `modifier.d.ts` and `utility.d.ts` with context globals `console`, `ctx`, `cavalry` (**NO** `api`, `ui`, `def`, `render`).
- Connect the output of the JavaScript utility/modifier node into one or more target attributes via `api.connect(jsId, 'id', targetId, targetAttr)` (or connect into specific downstream ports after checking `api.getAttributes(jsId)`).

## Important Guardrails

1. Confirm live node type creation in Cavalry with `cavalry_probe_api` (`probeTarget: "nodeTypes"` or runtime `try/catch` probe) before finalizing any modifier-based effect.
2. When driving time-dependent behavior without `ctx.frame` / `ctx.time`, wire a `frame` or `time` node into a dynamic attribute on the JavaScript utility (`api.addDynamic(jsId, 'array', 'double')` + `api.renameAttribute(...)`) so Cavalry's dependency graph invalidates every frame cleanly.
3. Preserve existing connections and user keyframes unless the effect explicitly wraps or overrides the driven attribute.
