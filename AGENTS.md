# AE to Cavalry Effect Engineer — Workspace Rules

This workspace builds, verifies, and applies reusable Cavalry effects modeled after Adobe After Effects effects using the existing infrastructure:

- `C:/Users/khada/cavalry-mcp` (v3.4.0)
- `C:/Users/khada/stallion` (v0.11.0, deployed to `AppData/Roaming/Cavalry/Scripts/Stallion.js`)

## Mandatory Rules

1. **Do not rebuild or duplicate infrastructure.** Always execute through `cavalry-mcp`, `cavalry-mcp/bin/stallion-cli.mjs`, or Stallion's `127.0.0.1:8080` protocol (`POST /post`, `GET /get`).
2. **Preserve existing scenes and selections.** Effect applicators operate on `api.getSelection()`, never destroy original layers, support idempotent repeat updates, and wrap mutations in `api.startUndoGroup` / `api.endUndoGroup` with `try / finally`.
3. **Verify Cavalry APIs strictly.** Never invent node types, attribute paths, or global namespaces. Check `C:/Users/khada/cavalry-mcp/node_modules/@scenery/cavalry-types` and `C:/Users/khada/.cavalry-mcp/cavalry-api-capabilities.json` offline, and `cavalry_probe_api` / `--probe` when live Cavalry is running.
4. **Distinguish documented vs. reconstructed behavior.** Adobe's internal C/C++ implementation is proprietary. Separate official AE UI/matchname documentation from independent mathematical reconstructions.
5. **Be strictly honest about verification.** Never cite headless mock runs as proof of live Cavalry visual fidelity. When Cavalry is not listening on `127.0.0.1:8080`, label live runtime and rendered frame checks as unverified.
6. **Activate the engineer workflow automatically.** Whenever asked to convert, create, improve, or apply an After Effects effect, follow `.agents/skills/ae-to-cavalry-effect-engineer/SKILL.md` and check `effect-registry.json` first.
7. **Sync the native Cavalry AE Effects panel automatically.** Whenever any effect is created, updated, and verified cleanly, run `node scripts/sync-cavalry-script.mjs` (automatically triggered by `scripts/verify-effect.mjs`) so `AE Effects.js` in Cavalry's Scripts folder (`Scripts -> AE Effects`) stays up to date for single-click application inside Cavalry.
