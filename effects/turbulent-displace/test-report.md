# Verification Report: `turbulent-displace` (`ADBE Turbulent Displace`)

- **Version:** `1.1.0`
- **Status:** `live-verified` (Tier 1 Static + Tier 2 Math & VM + Tier 3 Stallion Mock + Tier 4 Live Cavalry `2.8.0`/`2.8.1` runtime & multi-frame visual inspection all passed)
- **Live Bridge Verified:** Cavalry `2.8.1` + Stallion HTTP (`http://127.0.0.1:8080`, `mock: false`, `roundTripMs: 654`)
- **Visual Verification Captures:**
  - `artifacts/verify-turbulent-displace/frame_{0,30,60}.png` (SkSL Filter: `Turbulent`, `Amount=58`, `Size=85`, `Complexity=2.5`, `Antialiasing=High`, `Resize Layer=true` -> `padding=73px`, animated `Evolution` `0 -> 180` deg)
  - `artifacts/verify-turbulent-displace-deformer/frame_{0,30,60}.png` (JavaScript Deformer: `Turbulent`, `Amount=60`, `Size=75`, `Complexity=2.5`, `Resample=6px`, animated `Evolution` `0 -> 180` deg)

---

## Tier 1 — Static Validation (`validateSkslSource`, `validateCavalryContextUsage`)

| Artifact | Result | Notes |
|---|---|---|
| `effects/turbulent-displace/turbulent-displace.sksl` | **PASS** (`valid: true`, 0 errors) | Declares `uniform shader layer;` plus clean AE uniform names: `Displacement`, `Amount`, `Size`, `Offset` (`float2`), `Complexity`, `Evolution`, `CycleEvolution` (`bool`), `CycleRevolutions`, `RandomSeed`, `Pinning`, `ResizeLayer` (`bool`), `Antialiasing`; does **not** redeclare Cavalry's built-in `resolution` uniform. |
| `effects/turbulent-displace/turbulent-displace.deformer.js` | **PASS** (`valid: true`, `forbiddenUsages: []`) | Strictly uses allowed Deformer globals (`console`, `ctx`, `cavalry`, `def`) and real Cavalry 2.8 `cavalry.Path.resample()` / `pathData()` / `setPathData()` / `def.getFalloffAtPoint()`. |
| `effects/turbulent-displace/implementation.js` | **PASS** (`valid: true`, `forbiddenUsages: []`) | Synced cleanly with standalone `.sksl` & `.deformer.js` sources (`scripts/sync-embedded.mjs`), handles both live `inputs.*`/`array.*` slots and Stallion Mock `uniforms.*`, and skips non-renderable layers (`null`/`camera`) with clean warnings. |
| `cavalry-script/AE Effects.js` | **PASS** (`valid: true`, `forbiddenUsages: []`) | Auto-generated native Cavalry panel installed to `%APPDATA%\Cavalry\Scripts\AE Effects.js` (`Scripts -> AE Effects`), tested live in Cavalry `2.8.0`/`2.8.1`. |
| Library templates (`templates/sksl-filter`, `templates/javascript-deformer`, `templates/cavalry-panel`) | **PASS** | Validated cleanly via `cavalry-mcp` validators. |

---

## Tier 2 — Mathematical Model & Context Simulation (`npm test`)

All 6 `turbulent-displace` Node tests (+ 3 `AE Effects.js` script & live hot-reload panel tests = **9/9** passing across `npm test`):

1. **Static & Sync Integrity:** Source files, embedded `implementation.js` literals, registry, `parameter-map.json`, and `plugin.json` all verified in sync.
2. **Mathematical Invariants (`math-model.mjs`, centered Y-up coordinates):**
   - `amount == 0` yields exact `[0, 0]` across all 9 `Displacement` modes.
   - Negative `amount` strictly negates `[dx, dy]`.
   - `Cycle Evolution` repeats cleanly to `< 1e-9` at `360 * N` degrees for `N = 1, 2, 3`, while shifting mid-cycle.
   - Non-cyclic Evolution continues mutating past `360` deg.
   - `Horizontal` (`dy === 0`, mode 6) and `Vertical` (`dx === 0`, mode 7) axis isolation verified matching After Effects dropdown order.
   - `Bulge` ($-\nabla N$) and `Twist` ($\text{curl } N$) verified strictly orthogonal (`normalizedDot < 1e-12`).
   - Centered Y-up `Pinning` verified on borders `(-W/2, +W/2, -H/2, +H/2)`: `Pin All`, `Pin Horizontal`, `Pin Left`, and `Pin Top` (`+Y` up) lock pinned borders to `[0, 0]` while leaving unpinned interior/borders active.
   - Fractional `Complexity` continuity (`2.0 -> 2.001`) and large `randomSeed` float32 folding verified.
3. **JavaScript Deformer VM Simulation:** Mocked `cavalry.Mesh` + `cavalry.Path.resample()` + `pathData()` / `setPathData()` + `def.getFalloffAtPoint()` confirms corner pinning and interior displacement.
4. **Live Cavalry `inputs.*` Slot Simulation:** Verified that when `api.getAttributes()` omits child keys `'inputs.0'..'inputs.N'` (matching live Cavalry 2.8.0), `implementation.js` reuses `inputs.0`, allocates `inputs.1..11` with proper attribute types (`double2` for `Offset`, `bool` for `CycleEvolution` and `ResizeLayer`), strips explicit uniform declarations for live SkSL compile, and sets `padding`.

---

## Tier 3 — Headless Stallion Mock Bridge (`npm test` + CLI)

- Empty selection guard returns `{ ok: false }` with zero scene mutation.
- Selection-based `skslFilter` attachment (`uniforms.Displacement`..`uniforms.Antialiasing`), keyframed evolution (`0 -> 720` on frames `0 -> 60`), and repeat idempotency (`action: 'updated'`, constant layer count) passed.
- Vector `javaScriptDeformer` attachment (`mode: 'deformer'`), keyframing, and repeat idempotency passed.
- CLI (`scripts/apply-effect.mjs turbulent-displace --mock ...`) passed end-to-end.

---

## Tier 4 — Live Cavalry `2.8.1` Runtime & Visual Frame Verification (`npm run verify`)

Executed end-to-end against running Cavalry `2.8.1` inside an isolated `checkpoint` / `rollback` session:

1. **Empty Selection Guard:** Passed (`emptySelectionGuarded: true`).
2. **SkSL Filter (`mode: 'sksl'`):**
   - Created `skslFilter#28`, wired to `filters` on selected rectangle (`Verify Target`).
   - Bound all 12 parameters live cleanly into:
     - `inputs.0` -> `Displacement` (`double`)
     - `inputs.1` -> `Amount` (`double`)
     - `inputs.2` -> `Size` (`double`)
     - `inputs.3` -> `Offset` (`double2` native X/Y 2D point control)
     - `inputs.4` -> `Complexity` (`double`)
     - `inputs.5` -> `Evolution` (`double`)
     - `inputs.6` -> `CycleEvolution` (`bool` native checkbox)
     - `inputs.7` -> `CycleRevolutions` (`double`)
     - `inputs.8` -> `RandomSeed` (`double`)
     - `inputs.9` -> `Pinning` (`double`)
     - `inputs.10` -> `ResizeLayer` (`bool` native checkbox)
     - `inputs.11` -> `Antialiasing` (`double`)
   - Set `padding: 73` (`Resize Layer`), keyframed `inputs.5` (`Evolution` `0 -> 180` across frames `0 -> 60`).
   - Repeat application matched via indexed `filters.0` port lookup, returned `action: 'updated'` reusing the exact node (`idempotentLayerCount: '2 -> 2'`).
3. **JavaScript Deformer (`mode: 'deformer'`):**
   - Created `javaScriptDeformer#3`, wired to `deformers`, bound all 11 vector parameters into `array.0` (`Displacement`) through `array.10` (`ResampleLength`), keyframed `array.5` (`0 -> 180`).
4. **Visual Inspection of Rendered Frames:**
   - **SkSL Frames (`artifacts/verify-turbulent-displace/frame_{0,30,60}.png`):** Confirmed crisp organic liquid boundary displacement expanding beyond the `220x220` rectangle with smooth High 4-tap RGSS edges.
   - **Deformer Frames (`artifacts/verify-turbulent-displace-deformer/frame_{0,30,60}.png`):** Differing frame sizes (`18,453`, `18,395`, `18,042` bytes) confirm animated vector deformation across frames `0`, `30`, and `60`.
5. **Cleanup:** Checkpoint `rollback` restored original clean scene state (`deleted: ["javaScriptDeformer#3", "basicShape#14"]`).
