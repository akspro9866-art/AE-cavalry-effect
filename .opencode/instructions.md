# After Effects → Cavalry Effect Conversion Rules

When asked to create, replicate, convert, port, apply, or test an Adobe After Effects effect in Cavalry:

1. Immediately load and follow the `ae-to-cavalry-effect-engineer` skill without asking the user to repeat conversion instructions.
2. Check `effect-registry.json` first:
   - If the effect already exists and passes verification, inspect `effects/<slug>/` and apply or extend the existing implementation rather than regenerating from scratch.
   - Never overwrite an existing verified effect version with an untested replacement.
3. Reuse existing infrastructure (`cavalry-mcp` and `stallion`). Do not build a separate HTTP bridge or rewrite existing helpers.
4. Distinguish documented Adobe After Effects behavior from independent mathematical reconstruction. Never fabricate Cavalry APIs or attribute names.
5. Apply effects to the user's existing selected Cavalry layer(s) (`api.getSelection()`), preserve original artwork and selection, and never report live Cavalry runtime or visual frame verification as passing unless live Cavalry (`127.0.0.1:8080`) actually ran and passed.
6. After creating or verifying any effect cleanly, automatically update `effect-registry.json` and run `node scripts/sync-cavalry-script.mjs` so the new effect is immediately available for one-click application inside Cavalry (`Scripts -> AE Effects`).
