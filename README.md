# AE Effects for Cavalry (`ae-effects-cavalry`)

[![Tests](https://img.shields.io/badge/tests-42%2F42%20passing-brightgreen.svg)](test/)
[![Cavalry](https://img.shields.io/badge/Cavalry-2.8%2B-blue.svg)](https://cavalry.scenery.io/)
[![License](https://img.shields.io/badge/license-MIT-purple.svg)](LICENSE)
[![GPU](https://img.shields.io/badge/GPU-SkSL%20Accelerated-orange.svg)](effects/)
[![Verification](https://img.shields.io/badge/verification-5--Tier%20Pyramid-teal.svg)](TESTING.md)

> A production-quality library reconstructing Adobe After Effects effects and core composition workflows for **Cavalry 2.8+**, featuring GPU-accelerated SkSL shaders, procedural deformers, a zero-dependency **1-Click GUI Panel** for motion designers, and native AI-agent configurations for **Qoder**, **ZCode**, **OpenCode**, **Antigravity**, and **Cursor**.

---

## ⚡ Quickstart for Motion Designers (Zero Dependencies)

You do **not** need Node.js, Python, or terminal tools to use these effects in Cavalry.

1. Download [`cavalry-script/AE Effects.js`](cavalry-script/AE%20Effects.js).
2. Place it into your Cavalry Scripts directory:
   - **Windows**: `%APPDATA%\Cavalry\Scripts\` (e.g. `C:\Users\<username>\AppData\Roaming\Cavalry\Scripts\`)
   - **macOS**: `~/Library/Application Support/Cavalry/Scripts/`
3. Launch Cavalry and open **`Scripts -> AE Effects`**.
4. Select any layer (shape, text, group, image, or pre-comp) and click any effect button to apply it instantly.

---

## 🎬 Effect & Workflow Catalog

All effects are mathematically reconstructed and verified against native After Effects behavior, exposing editable dynamic attributes and supporting full keyframe animation in Cavalry's Attribute Editor.

| Effect / Tool | Category | Type | AE MatchName | Architectural & Mathematical Highlights |
| :--- | :--- | :--- | :--- | :--- |
| **Gaussian Blur** | Blur & Sharpen | `skslFilter` | `ADBE Gaussian Blur 2` | • 37-tap Vogel golden-spiral isotropic Gaussian kernel ($N=37$, $r_i = 3\sigma \sqrt{(i+0.5)/37}$)<br>• Directional 1D separable modes (Both, Horizontal Only, Vertical Only with $N=65$ taps)<br>• Repeat edge pixels clamping preventing perimeter darkening |
| **Fractal Noise** | Noise & Grain | `skslFilter` | `ADBE Fractal Noise` | • 4D Simplex Fractional Brownian Motion (fBm) with dynamic octaves<br>• 5 Fractal Modes (Basic, Turbulent Smooth, Turbulent Basic, Turbulent Sharp, Dynamic)<br>• Contrast, Brightness & Invert remapping<br>• Overflow response: Clip, Soft Clamp S-curve, Wrap<br>• Seamless 4D torus loop evolution |
| **Tint** | Color Correction | `skslFilter` | `ADBE Tint` | • ITU-R Rec. 601 perceptual luminance weighting ($0.299R + 0.587G + 0.114B$)<br>• Straight alpha unmultiplication preventing perimeter fringe artifacts<br>• Map Black To / Map White To two-tone grading with Amount blend |
| **CC Ball Action** | Simulation | `skslFilter` | `CC Ball Action` | • Grid binning with 3x3 neighbor cell evaluation<br>• 3D Spherical normal vector projection with ambient, diffuse & Phong specular lighting<br>• 3D Axis rotation (X, Y, Z) and spatial scatter dispersion |
| **CC RepeTile** | Distort | `skslFilter` | `ADBE CC RepeTile` | • 6 Tiling algorithms: Repeat, Flip ping-pong, Checker, Brick 50% offset, Fold, Unfold<br>• Asymmetric directional expansion (Left, Right, Up, Down)<br>• Dynamic canvas padding expansion |
| **Turbulent Displace** | Distort | `skslFilter` / Deformer | `ADBE Turbulent Displace` | • 9 Displacement algorithms (Turbulent, Bulge, Twist, Smoother variants, Cross)<br>• Branchless 4D Simplex vector displacement noise field<br>• Boundary edge pinning (All, H, V, L, R, T, B) and Cycle Evolution periodic looping |
| **Deep Glow** | Stylize | `skslFilter` | `ADBE Deep Glow` | • Physical inverse-square optical falloff ($w(r) = 1 / (1 + (r/r_0)^2)$)<br>• Threshold knee pre-filtering and chromatic aberration dispersion<br>• Anamorphic flare aspect ratio and angle control<br>• ACES filmic & Reinhard tone mapping |
| **Null Object** | Composition | `null` | `ADBE Null Object` | • Procedural centroid bounding-box calculation from multi-layer selection<br>• Automatic parenting of selected layers with hierarchy verification<br>• After Effects coral red (`#F05050`) wireframe styling<br>• Empty selection instantiates Null at composition origin `(0, 0)` |
| **Adjustment Layer** | Composition | `group` | `ADBE Adjustment Layer` | • Native composite group encapsulating selected layers<br>• Attached SkSL adjustment filter pipeline processing all children simultaneously<br>• Empty selection wraps all root composition layers |
| **Pre-Compose** | Composition | `compositionReference` | `ADBE Pre-Compose` | • Encapsulates selected layers into a nested composition asset<br>• Replaces selection in active graph with a `compositionReference` node |

---

## 🧪 5-Tier Verification Architecture

Every effect in this library is governed by a strict five-tier verification protocol:

```
[Tier 1: Static Validation (Schema, Syntax, Invariant Sync)]
       │
       ▼
[Tier 2: Mathematical Invariants (Analytical Proofs & Boundary Limits)]
       │
       ▼
[Tier 3: Headless Mock Stallion Execution (VM Sandbox, Dynamic Slots, Fault Injection)]
       │
       ▼
[Tier 4: Live Cavalry 2.8 Runtime & GPU Frame Audit (http://127.0.0.1:8080)]
       │
       ▼
[Tier 5: Visual Parity & Statistical Diff Analysis (MAE, MSE, PSNR, SSIM, Sobel)]
```

### Running Tests Locally

```bash
# Run the complete test suite (42 unit tests, zero external dependencies):
npm test

# Verify all synchronizers and embedded codes are in sync:
npm run check

# Run live Cavalry runtime and GPU frame verification (requires running Cavalry 2.8):
npm run test:live
```

---

## 📚 Technical Documentation

Comprehensive engineering documentation is available:

- [**Architecture Specification**](ARCHITECTURE.md): System design, graph integration, and error contracts.
- [**Development Guide**](DEVELOPMENT.md): Local environment setup, portable configuration, and adding effects.
- [**Testing & Verification**](TESTING.md): Detailed breakdown of the 5-tier verification suite and visual diff engine.
- [**Compatibility Matrix**](COMPATIBILITY.md): Supported Cavalry versions, OS platforms, and GPU backends.
- [**Intellectual Property & Provenance**](PROVENANCE.md): Cleanroom engineering methodology and trademark disclosures.
- [**Contributing Guidelines**](CONTRIBUTING.md): Standards, code style, and submission requirements.

---

## 🤖 Autonomous AI Agent Integration

This repository includes canonical configurations and synchronization tools for autonomous coding agents:

- **Google Antigravity & Gemini CLI**: [`.agents/agents/`](.agents/agents/) and [`.agents/skills/`](.agents/skills/)
- **Qoder**: [`.qoder/`](.qoder/)
- **ZCode & OpenCode**: [`skills/`](skills/) and [`.opencode/`](.opencode/)
- **Cursor**: [`.cursor/rules/`](.cursor/rules/) and [`.cursorrules`](.cursorrules)

All configurations are automatically validated and synchronized using `npm run sync:agents`.

---

## 📂 Repository Structure

```
ae-effects-cavalry/
├── cavalry-script/
│   └── AE Effects.js                  # Standalone 1-click UI palette for Cavalry
├── effects/
│   ├── adjustment-layer/              # Group pipeline filter wiring, notes, tests
│   ├── cc-ball-action/                # SkSL shader, math model, technical notes, tests
│   ├── cc-repetile/                   # SkSL shader, math model, technical notes, tests
│   ├── deep-glow/                     # SkSL shader, math model, technical notes, tests
│   ├── fractal-noise/                 # SkSL shader, math model, technical notes, tests
│   ├── gaussian-blur/                 # SkSL shader, math model, technical notes, tests
│   ├── null-object/                   # Centroid math, parenting, technical notes, tests
│   ├── pre-compose/                   # Pre-compose API wiring, technical notes, tests
│   ├── tint/                          # SkSL shader, math model, technical notes, tests
│   └── turbulent-displace/            # SkSL shader, deformer, math model, notes, tests
├── scripts/
│   ├── lib/
│   │   ├── config.mjs                 # Portable platform-aware path resolver
│   │   ├── effect-runtime.mjs         # Standardized error reporting contract
│   │   └── visual-diff.mjs            # Pure Node.js PNG decoder and visual diff engine
│   ├── apply-effect.mjs               # Portable CLI applicator
│   ├── live-verify-all-effects.mjs    # Audits live Cavalry 2.8 at 127.0.0.1:8080
│   ├── sync-agent-configs.mjs         # Synchronizes AI-agent rules & skills
│   ├── sync-cavalry-script.mjs        # Compiles standalone AE Effects.js
│   └── sync-embedded.mjs              # Synchronizes embedded shaders
├── test/                              # 42 unit tests across 12 test suites
├── effect-registry.json               # Centralized effect metadata registry (v1.1.0)
├── ARCHITECTURE.md                    # System architecture specification
├── DEVELOPMENT.md                     # Development workflows and environment
├── TESTING.md                         # 5-tier testing suite documentation
├── COMPATIBILITY.md                   # Platform and version compatibility matrix
├── PROVENANCE.md                      # Cleanroom IP and provenance review
├── CONTRIBUTING.md                     # Contribution guidelines
├── package.json
└── README.md
```

---

## 📄 License & Disclaimers

- Distributed under the [MIT License](LICENSE). Copyright (c) 2026 akspro9866-art.
- **Adobe® and Adobe After Effects®** are registered trademarks of Adobe Inc.
- **Cavalry** is a trademark of Scenery Ltd.
- Reference to third-party software or effect names is purely nominative for interoperability description. No endorsement or affiliation is implied.
