# OpenCode / ZCode Instructions: AE Effects for Cavalry

This repository provides 100% faithful Adobe After Effects effect reconstructions for Cavalry 2.8+ as high-performance GPU SkSL Filters, JavaScript Deformers, and procedural composition workflows.

## Key Directories
- `cavalry-script/AE Effects.js`: Standalone, bundled one-click GUI panel for Cavalry. Copy directly to `%APPDATA%\Cavalry\Scripts\` (Windows) or `~/Library/Application Support/Cavalry/Scripts/` (macOS).
- `effects/<slug>/`: Individual effect implementations containing SkSL shaders, parameter maps, math models, and tests.
- `skills/`: Machine-readable skills for autonomous AI agents (Qoder, ZCode, OpenCode, Antigravity, Cursor).
- `agents/`: Agent role definitions.
- `effect-registry.json`: Index of all verified effects, status, node types, and aliases.
- `test/`: 4-tier verification suite (static, math invariants, headless mock, live Cavalry 2.8 runtime & frame render).

## Operating Rules
1. Never fabricate Cavalry API names or attributes.
2. Maintain 100% parity with Adobe After Effects parameters, default values, and mathematical behavior.
3. Keep `cavalry-script/AE Effects.js` synchronized by running `node scripts/sync-cavalry-script.mjs`.
