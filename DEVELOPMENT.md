# Development Guide

This guide describes how to set up your local development environment, run the multi-tier test suite, synchronize distribution artifacts, and contribute new effects to `ae-effects-cavalry`.

---

## 1. Prerequisites

- **Node.js**: Version 18.0.0 or later (tested on Node 18, 20, and 22).
- **npm**: Version 9.0.0 or later.
- **Operating System**: Windows 10/11, macOS 12+, or Linux.
- **Cavalry**: Version 2.8 or later (required for Tier 4 live verification; not required for Tiers 1–3 or Tier 5 mock verification).

---

## 2. Getting Started

Clone the repository and inspect the workspace:

```bash
git clone https://github.com/akspro9866-art/ae-effects-cavalry.git
cd ae-effects-cavalry

# Check existing tests (zero external npm dependencies required!)
npm test
```

The repository is intentionally architected with **zero third-party npm production dependencies** to maximize portability and eliminate supply chain risks. All test runners, mock bridges, and visual difference decoders run on pure Node.js built-ins (`node:test`, `node:assert`, `node:vm`, `node:fs`, `node:path`, `node:crypto`).

---

## 3. Available npm Scripts

| Command | Action |
| :--- | :--- |
| `npm test` | Runs the full unit test suite (42 tests across static, mathematical, mock, config, and agent tiers) |
| `npm run check` | Validates that embedded shaders, agent configs, and compiled Cavalry scripts are completely in sync |
| `npm run sync:embedded` | Inlines raw `.sksl` and `.deformer.js` sources into each effect's `implementation.js` |
| `npm run sync:script` | Compiles the standalone zero-dependency Cavalry distribution script (`cavalry-script/AE Effects.js`) and deploys to local Cavalry Scripts folder if present |
| `npm run sync:agents` | Synchronizes prompt definitions and skills across Qoder, ZCode, OpenCode, Antigravity, and Cursor from canonical templates |
| `npm run test:live` | Runs live verification against a running Cavalry 2.8+ instance at `http://127.0.0.1:8080` |

---

## 4. Environment Variables & Portable Configuration

The library uses platform-aware defaults and allows complete override via environment variables:

```bash
# Explicitly set the repository root (defaults to current working directory)
export CAVALRY_LIBRARY_ROOT="/path/to/ae-effects-cavalry"

# Explicitly set the deployed Cavalry Scripts folder
export CAVALRY_SCRIPTS_DIR="/path/to/Cavalry/Scripts"

# Configure the live Cavalry HTTP bridge endpoint (default: http://127.0.0.1:8080)
export STALLION_URL="http://127.0.0.1:8080"
```

On Windows (PowerShell):
```powershell
$env:CAVALRY_LIBRARY_ROOT = "C:\custom\path\ae-effects-cavalry"
$env:STALLION_URL = "http://127.0.0.1:8080"
```

---

## 5. Adding a New Effect

To add a new After Effects reconstruction:

1. **Create the Effect Directory**:
   ```
   effects/<slug>/
   ├── <slug>.sksl               (GPU SkSL shader if applicable)
   ├── parameter-map.json         (Parameter definitions, types, and limits)
   ├── math-model.mjs             (Pure JS mathematical formulation & invariants)
   ├── implementation.js          (Cavalry runtime applicator)
   ├── README.md                  (User documentation and usage instructions)
   └── technical-notes.md         (Mathematical derivation and AE parity notes)
   ```

2. **Register in `effect-registry.json`**:
   Add the effect entry adhering to Schema v1.1.0 with appropriate `metadata` and `artifacts`.

3. **Synchronize Embedded Code & Standalone Script**:
   ```bash
   node scripts/sync-embedded.mjs
   node scripts/sync-cavalry-script.mjs
   ```

4. **Add Unit Tests**:
   Create `test/<slug>.test.mjs` verifying:
   - Tier 1: Static schema and bracket balance.
   - Tier 2: Mathematical invariants and boundary conditions.
   - Tier 3: Headless Mock Stallion execution and dynamic slot provisioning.

5. **Run Verification**:
   ```bash
   npm test
   npm run check
   ```

6. **Live Cavalry Verification (Optional/Recommended)**:
   Launch Cavalry 2.8, open a composition, and run:
   ```bash
   npm run test:live
   ```

---

## 6. Code Style & Verification Discipline

- **No Undocumented APIs**: Only use documented Cavalry 2.8+ JavaScript APIs (`api.create()`, `api.connect()`, `api.parent()`, `api.getParent()`, `api.getSelection()`, `api.set()`, `api.addDynamicAttribute()`).
- **Idempotency**: Applying an effect multiple times must cleanly update existing dynamic attributes without duplicating nodes or corrupting connections.
- **Strict Return Schema**: Every implementation must return a structured result object matching `scripts/lib/effect-runtime.mjs`.
- **Cleanroom Implementation**: Reconstruct mathematics from published graphics literature and analytical formulas. Never include proprietary binaries or decompiled code.
