# AE Effects for Cavalry (`ae-effects-cavalry`)

[![Tests](https://img.shields.io/badge/tests-31%2F31%20passing-brightgreen.svg)](test/)
[![Cavalry](https://img.shields.io/badge/Cavalry-2.8%2B-blue.svg)](https://cavalry.scenery.io/)
[![License](https://img.shields.io/badge/license-MIT-purple.svg)](LICENSE)
[![GPU](https://img.shields.io/badge/GPU-SkSL%20Accelerated-orange.svg)](effects/)
[![AI Agents](https://img.shields.io/badge/AI%20Agents-Qoder%20%7C%20ZCode%20%7C%20OpenCode%20%7C%20Antigravity%20%7C%20Cursor-teal.svg)](skills/)

> **100% faithful mathematical reconstructions of Adobe After Effects effects and workflow primitives for Cavalry 2.8+**, featuring a zero-dependency **1-Click GUI Panel** for Cavalry artists and native autonomous skill/agent configurations for **Qoder**, **ZCode**, **OpenCode**, **Antigravity**, and **Cursor**.

---

## ⚡ Quickstart for Cavalry Users (Zero Dependencies)

You don't need Node.js, Python, or terminal tools to use these effects in Cavalry!

1. Download [`cavalry-script/AE Effects.js`](cavalry-script/AE%20Effects.js).
2. Drop it into your Cavalry Scripts folder:
   - **Windows**: `%APPDATA%\Cavalry\Scripts\` (e.g. `C:\Users\<username>\AppData\Roaming\Cavalry\Scripts\`)
   - **macOS**: `~/Library/Application Support/Cavalry/Scripts/`
3. In Cavalry, go to **`Scripts -> AE Effects`**.
4. Select any layer (shape, text, group, image, or pre-comp) and click any effect button to apply it instantly!

---

## 🎬 Included Effects & Composition Workflows

All effects are mathematically reconstructed and verified against native After Effects behavior, exposing editable dynamic attributes and supporting full keyframe animation.

| Effect / Tool | Category | Type | AE MatchName | Key Controls & Behavior |
|---|---|---|---|---|
| **Gaussian Blur** | Blur & Sharpen | `skslFilter` | `ADBE Gaussian Blur 2` | • 36-tap Vogel Golden-Spiral isotropic Gaussian kernel ($r_i = 3\sigma \sqrt{(i+0.5)/36}$)<br>• Blur Dimensions (Both, H Only, V Only)<br>• Repeat Edge Pixels clamping without edge darkening |
| **Fractal Noise** | Noise & Grain | `skslFilter` | `ADBE Fractal Noise` | • 5 Fractal Modes (Basic, Turbulent Smooth, Turbulent Basic, Turbulent Sharp, Dynamic)<br>• Contrast & Brightness remapping<br>• Overflow (Clip, Soft Clamp S-curve, Wrap)<br>• Seamless 4D torus loop evolution ($E(\theta) = (R_1\cos\theta, R_1\sin\theta, R_2\cos\phi, R_2\sin\phi)$)<br>• Invert polarity |
| **Tint** | Color Correction | `skslFilter` | `ADBE Tint` | • Rec. 601 perceptual luminance ($0.299R + 0.587G + 0.114B$)<br>• Map Black To / Map White To color grading<br>• Straight alpha unmultiplication preventing dark edge fringe artifacts |
| **CC Ball Action** | Simulation | `skslFilter` | `CC Ball Action` | • Grid binning with 3x3 neighbor kernel<br>• 3D Spherical normal vector projection<br>• Ambient + diffuse + Phong specular key-lighting<br>• 3D Axis Rotation (X, Y, Z) with $z$-depth sorting<br>• 3D Spatial scatter vector dispersion |
| **CC RepeTile** | Distort | `skslFilter` | `ADBE CC RepeTile` | • 6 Tiling algorithms (Repeat, Flip ping-pong, Checker, Brick 50% offset, Fold, Unfold)<br>• Asymmetric directional expansion (L/R/U/D)<br>• Strict 4-sided directional boundary clipping |
| **Turbulent Displace** | Distort | `skslFilter` | `ADBE Turbulent Displace` | • 9 Displacement algorithms (Turbulent, Bulge, Twist, Smoother variants, H/V/Cross)<br>• Branchless 4D Simplex noise field<br>• Smooth edge pinning (All, H, V, L, R, T, B)<br>• Cycle Evolution periodic looping |
| **Deep Glow** | Stylize | `skslFilter` | `ADBE Deep Glow` | • Physical inverse-square falloff ($1 / (1 + (d/R)^2)$)<br>• Chromatic dispersion & aberration<br>• Anamorphic flare aspect ratio & angle<br>• ACES Filmic & Reinhard tone mapping |
| **Null Object** | Composition | `null` | `ADBE Null Object` | • Non-rendering spatial transform controller<br>• Computes collective centroid bounding box of selection<br>• Automatically parents selected layers to the Null |
| **Adjustment Layer** | Composition | `group` | `ADBE Adjustment Layer` | • Creates a composite filter group<br>• Applies effect pipelines to all enclosed underlying layers |
| **Pre-Compose** | Composition | `compositionReference` | `ADBE Pre-Compose` | • Nests selected layers into a new isolated composition<br>• Replaces selection with active compositionReference binding |

---

## 🤖 Autonomous AI Agent Integration (Qoder, ZCode, OpenCode, Antigravity, Cursor)

This repository includes first-class configurations for autonomous coding agents so they can automatically research, reconstruct, and apply effects to live Cavalry instances:

### 1. Qoder
- **Skills**: [`.qoder/skills/`](.qoder/skills/)
- **Rules**: [`.qoder/rules/AGENTS.md`](.qoder/rules/AGENTS.md)
- **Agent Roles**: [`.qoder/agents/`](.qoder/agents/)

### 2. ZCode & OpenCode
- **Skills**: [`skills/`](skills/)
- **Instructions**: [`.opencode/instructions.md`](.opencode/instructions.md)
- **Agents**: [`agents/`](agents/)

### 3. Google Antigravity & Gemini CLI
- **Subagents**: [`.agents/agents/`](.agents/agents/)
- **Skills**: [`.agents/skills/`](.agents/skills/)

### 4. Cursor
- **MDC Rules**: [`.cursor/rules/ae-effects.mdc`](.cursor/rules/ae-effects.mdc)
- **Rules File**: [`.cursorrules`](.cursorrules)

---

## 🧪 4-Tier Verification Architecture

Every effect in this library is governed by a strict four-tier verification protocol:

```
[Tier 1: Static Validation]
       │
       ▼
[Tier 2: Math Invariants (node --test)]
       │
       ▼
[Tier 3: Headless Mock Stallion Execution]
       │
       ▼
[Tier 4: Live Cavalry 2.8 Runtime & Frame Audit (127.0.0.1:8080)]
```

### Running Tests Locally

```powershell
# Run the complete test suite (31 tests across all effects):
npm test

# Run the live Cavalry runtime and GPU frame render audit:
npm run test:live
```

---

## 📂 Repository Structure

```
ae-effects-cavalry/
├── cavalry-script/
│   └── AE Effects.js                  # Standalone 1-click UI palette for Cavalry
├── effects/
│   ├── gaussian-blur/                 # SkSL, math model, parameter map, tests
│   ├── fractal-noise/                 # SkSL, math model, parameter map, tests
│   ├── tint/                          # SkSL, math model, parameter map, tests
│   ├── cc-ball-action/                # SkSL, math model, parameter map, tests
│   ├── cc-repetile/                   # SkSL, math model, parameter map, tests
│   ├── turbulent-displace/            # SkSL, deformer, math model, tests
│   ├── deep-glow/                     # SkSL, math model, parameter map, tests
│   ├── null-object/                   # Centroid math, parenting, tests
│   ├── adjustment-layer/              # Group pipeline filter wiring, tests
│   └── pre-compose/                   # Pre-compose API wiring, tests
├── skills/                            # Agent skills (OpenCode, ZCode, Qoder)
├── agents/                            # Agent definitions
├── .agents/                           # Antigravity agent & skill mirrors
├── .qoder/                            # Qoder agent & skill mirrors
├── .cursor/                           # Cursor IDE MDC rules
├── .opencode/                         # OpenCode instructions
├── frames/                            # Verified live GPU rendered frame captures
├── scripts/
│   ├── sync-cavalry-script.mjs        # Compiles & bundles AE Effects.js
│   ├── sync-embedded.mjs              # Embeds standalone shaders into applicators
│   └── live-verify-all-effects.mjs    # Audits live Cavalry 2.8 at 127.0.0.1:8080
├── test/                              # Comprehensive test suite (31 suites)
├── effect-registry.json               # Effect registry, metadata & aliases
├── package.json
├── LICENSE                            # MIT License
└── README.md
```

---

## 📄 License

MIT License. Copyright (c) 2026 akspro9866-art. Free for commercial, personal, and educational motion design workflows in Cavalry.
