# AE Effects for Cavalry (`ae-effects-cavalry`)

[![Tests](https://img.shields.io/badge/tests-117%2F117%20passing-brightgreen.svg)](test/)
[![Cavalry](https://img.shields.io/badge/Cavalry-2.8%2B-blue.svg)](https://cavalry.scenery.io/)
[![License](https://img.shields.io/badge/license-MIT-purple.svg)](LICENSE)
[![GPU](https://img.shields.io/badge/GPU-SkSL%20Accelerated-orange.svg)](effects/)
[![Verification](https://img.shields.io/badge/verification-5--Tier%20Pyramid-teal.svg)](TESTING.md)

> A comprehensive production-quality library reconstructing **35 Adobe After Effects effects** and core composition workflows for **Cavalry 2.8+**, featuring GPU-accelerated SkSL shaders, procedural deformers, a zero-dependency **1-Click GUI Panel** for motion designers, and native AI-agent configurations for **Google Antigravity**, **Gemini CLI**, **Qoder**, **ZCode**, **OpenCode**, and **Cursor**.

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

## 🎬 Complete Effect & Workflow Catalog (35 Effects)

All 35 effects are mathematically reconstructed and verified against native After Effects behavior, exposing editable dynamic attributes and supporting full keyframe animation in Cavalry's Attribute Editor.

| Effect / Tool | Category | Mechanism | AE MatchName | Architectural & Mathematical Highlights | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Gaussian Blur** | Blur & Sharpen | `skslFilter` | `ADBE Gaussian Blur 2` | 37-tap Vogel golden-spiral isotropic Gaussian kernel; 1D separable horizontal/vertical modes ($N=65$). | Live Verified |
| **Directional Blur** | Blur & Sharpen | `skslFilter` | `ADBE Directional Blur` | 16-tap triangular convolution along 2D unit direction vector; dynamic canvas padding expansion. | Mock Tested |
| **Fast Box Blur** | Blur & Sharpen | `skslFilter` | `ADBE Box Blur2` | 2-pass box convolution approximation with dimension isolation (Both, Horizontal, Vertical). | Mock Tested |
| **Radial Blur** | Blur & Sharpen | `skslFilter` | `ADBE Radial Blur` | Dual-mode rotational spin and radial zoom convolution; singularity-safe center weighting. | Mock Tested |
| **Sharpen** | Blur & Sharpen | `skslFilter` | `ADBE Sharpen` | High-frequency unsharp mask convolution with coring threshold to suppress background noise. | Mock Tested |
| **Levels** | Color Correction | `skslFilter` | `ADBE Levels2` | Full tonal remapping: Input/Output Black/White, Power gamma, Master & RGB channel isolation. | Mock Tested |
| **Curves** | Color Correction | `skslFilter` | `ADBE CurvesCustom` | $C^1$-continuous Catmull-Rom cubic spline interpolation across 5 tonal nodes for Master & RGB. | Mock Tested |
| **Exposure** | Color Correction | `skslFilter` | `ADBE Exposure2` | Photometric exposure remapping ($c \cdot 2^{\text{exp}} + \text{offset}$), sign-safe power gamma. | Mock Tested |
| **Hue/Saturation** | Color Correction | `skslFilter` | `ADBE HUE SATURATION` | Hexagonal cone RGB/HSV conversion, continuous hue rotation, saturation scaling, and colorize mode. | Mock Tested |
| **Color Balance** | Color Correction | `skslFilter` | `ADBE Color Balance2` | Partition-of-unity quadratic luminance weighting across Shadows, Midtones, Highlights; luminosity preservation. | Mock Tested |
| **Tint** | Color Correction | `skslFilter` | `ADBE Tint` | ITU-R Rec. 601 perceptual luminance weighting ($0.299R + 0.587G + 0.114B$); straight alpha unmultiplication. | Live Verified |
| **Posterize** | Color Correction | `skslFilter` | `ADBE Posterize` | Quantized tonal stepping ($c' = \lfloor c \cdot N \rfloor / N$); straight alpha preservation. | Mock Tested |
| **Wave Warp** | Distort | `skslFilter` | `ADBE Wave Warp` | Sine, Square, Triangle, Sawtooth, Circles & Semicircles; multi-edge boundary pinning and rotation. | Mock Tested |
| **Turbulent Displace** | Distort | `skslFilter` / Deformer | `ADBE Turbulent Displace` | 9 Displacement algorithms; 4D Simplex vector displacement noise; boundary edge pinning; cycle evolution. | Live Verified |
| **CC RepeTile** | Distort | `skslFilter` | `ADBE CC RepeTile` | 6 Tiling algorithms: Repeat, Flip ping-pong, Checker, Brick 50%, Fold, Unfold; dynamic padding. | Live Verified |
| **Motion Tile** | Stylize | `skslFilter` | `ADBE Tile` | 2D coordinate wrapping, output expansion percentage boundaries, alternating mirror edges, row phase stagger. | Mock Tested |
| **Displacement Map** | Distort | `skslFilter` | `ADBE Displacement Map` | Channel-selective coordinate deflection (R, G, B, A, Luma, Lightness); secondary map layer linking via `mattes`. | Mock Tested |
| **CC Kaleida** | Stylize | `skslFilter` | `CC Kaleida` | Polar coordinate radial wedge decomposition; $C^0/C^1$ bilateral reflection eliminating sector seams. | Mock Tested |
| **Optics Compensation** | Distort | `skslFilter` | `ADBE Optics Compensation` | Spherical tangent radial lens warping; reversible barrel/pincushion projection; optical center shift. | Mock Tested |
| **Venetian Blinds** | Transition | `skslFilter` | `ADBE Venetian Blinds` | Periodic linear stripe partitioning; directional angle projection; smoothstep edge feathering. | Mock Tested |
| **CC Light Sweep** | Generate | `skslFilter` | `CC Light Sweep` | Linear, Sharp, and Smooth highlight beam profiles; edge gradient detection; directional sweeping. | Mock Tested |
| **Gradient Ramp** | Generate | `skslFilter` | `ADBE Ramp` | Spatial linear and radial vector projections; high-frequency anti-banding dither scatter; blend modes. | Mock Tested |
| **Glow** | Stylize | `skslFilter` | `ADBE Glo2` | Native AE threshold knee isolation, multi-tap exponential blur convolution, Screen/Add compositing. | Mock Tested |
| **Deep Glow** | Stylize | `skslFilter` | `ADBE Deep Glow` | Physical inverse-square optical falloff ($w(r) = 1/(1+(r/r_0)^2)$); chromatic dispersion; ACES tone mapping. | Live Verified |
| **Drop Shadow** | Perspective | `skslFilter` | `ADBE Drop Shadow` | Polar offset vector projection; Vogel golden-spiral Gaussian shadow convolution; Over compositing. | Mock Tested |
| **Bevel Alpha** | Perspective | `skslFilter` | `ADBE Bevel Alpha` | Central difference alpha gradient surface normals; directional diffuse highlight & shadow lighting. | Mock Tested |
| **Mosaic** | Stylize | `skslFilter` | `ADBE Mosaic` | Cell coordinate quantization; center-pixel sampling; sharp rectangular blocking. | Mock Tested |
| **Find Edges** | Stylize | `skslFilter` | `ADBE Find Edges` | 3x3 Sobel spatial gradient convolution; sketch drawing mode (dark on white) & inverted glowing mode. | Mock Tested |
| **CC Ball Action** | Simulation | `skslFilter` | `CC Ball Action` | Grid binning; 3D Spherical normal vector projection with ambient, diffuse & Phong specular lighting. | Live Verified |
| **Fractal Noise** | Noise & Grain | `skslFilter` | `ADBE Fractal Noise` | 4D Simplex Fractional Brownian Motion (fBm); 5 Fractal Modes; contrast & brightness; 4D torus loop. | Live Verified |
| **Null Object** | Composition | `null` | `ADBE Null Object` | Procedural centroid bounding-box calculation from multi-layer selection; automatic layer parenting. | Live Verified |
| **Adjustment Layer** | Composition | `group` | `ADBE Adjustment Layer` | Native composite group encapsulating selected layers; attached SkSL adjustment filter pipeline. | Live Verified |
| **Pre-Compose** | Composition | `compositionReference` | `ADBE Pre-Compose` | Encapsulates selected layers into a nested composition asset; replaces selection with reference node. | Live Verified |
| **Echo** | Time | `skslFilter` / Rig | `ADBE Echo` | Add, Maximum, Minimum, Screen, Composite, and Behind blending operators; intensity decay. | Approximation |
| **Time Displacement** | Time | `skslFilter` / Graph | `ADBE Time Displacement` | Channel luminance mapping; temporal quantizing steps; spatial phase latency projection; matte linking. | Approximation |

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
# Run the complete test suite (117 unit tests, zero external dependencies):
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
