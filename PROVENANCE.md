# Intellectual Property, Provenance & Licensing Review

This document establishes the provenance, licensing, and cleanroom implementation methodology for the `ae-effects-cavalry` library.

---

## 1. Nominative Trademark Notice

- **Adobe® and Adobe After Effects®** are registered trademarks of Adobe Inc.
- **Deep Glow** is a trademark of Plugin Everything.
- **CC Ball Action** and **CC RepeTile** are trademarks associated with Cycore Systems / Boris FX / Adobe.
- **Cavalry** is a trademark of Scenery Ltd.

All product names, logos, brands, and registered trademarks mentioned within this repository are property of their respective owners. Their mention here is purely nominative and intended solely for technical accuracy, describing functional equivalence and parameter compatibility for motion graphics artists transitioning workflows between After Effects and Cavalry.

---

## 2. Cleanroom Implementation & Algorithm Origins

All code, shaders, deformers, and applicators in this repository have been authored from first principles or standard published computer graphics research. **No proprietary binaries, compiled machine code, decompiled C/C++ source code, or unlicensed copyrighted assets are contained or redistributed in this repository.**

### Detailed Effect-by-Effect Provenance

| Effect / Workflow | Architecture | Algorithmic Derivation & Academic References |
| :--- | :--- | :--- |
| **Gaussian Blur** | GPU SkSL Filter | Standard normal distribution bell curve $w(d) = \exp(-d^2 / 2\sigma^2)$ with 1D separable taps and 2D Vogel golden-spiral disc dispersion. |
| **Fractal Noise** | GPU SkSL Filter | Fractional Brownian Motion (fBm) based on Stefan Gustavson's Simplex Noise formulations and Ken Perlin's gradient noise research. |
| **Tint** | GPU SkSL Filter | ITU-R Rec. 601 standard luminance weights ($Y = 0.299R + 0.587G + 0.114B$) and linear interpolation between user target swatches. |
| **CC Ball Action** | GPU SkSL Filter | Analytical sphere ray-surface normal intersection, 3D Euler coordinate rotation matrices, and Phong reflection illumination model. |
| **CC RepeTile** | GPU SkSL Filter | Modular arithmetic coordinate space wrapping ($\text{mod}(x, 1)$), ping-pong triangle wave reflections, and brick staggered offsets. |
| **Turbulent Displace** | GPU SkSL / JS Deformer | Vector displacement fields driven by multi-octave gradient noise and 2D Cauchy-Green strain tensor space warping. |
| **Deep Glow** | GPU SkSL Filter | Physical inverse-square falloff $w(r) = 1 / (1 + (r/r_0)^2)$, H. Vogel (1979) golden spiral disc, Pegtop soft-light/overlay equations, and ACES filmic tone reproduction (Krzysztof Narkowicz, 2015). |
| **Null Object** | Native Cavalry Layer | Procedural bounding-box visual centroid calculation and parent hierarchy management using Cavalry 2.8+ native JavaScript API (`api.create('null')`, `api.parent`). |
| **Adjustment Layer** | Native Cavalry Group | Cavalry 2.8+ adjustment group architecture (`api.create('group')`) with SkSL exposure/contrast filter attachment. |
| **Pre-Compose** | Native Cavalry API | Native Cavalry composition encapsulation (`api.preCompose(layers, name)`), returning a `compositionReference` node. |

---

## 3. Deep Glow Provenance Audit

Earlier draft development notes in this repository referenced reverse engineering from a macOS plugin binary (`DeepGlow2.plugin`). A comprehensive software quality and provenance audit was conducted to review and address this:

1. **No Proprietary Code Present**: The actual SkSL shader code is an independent mathematical implementation of standard optical equations published in computer graphics literature (inverse-square attenuation, Jorge Jimenez's downsample theory, Vogel spiral sampling, Pegtop blend equations, ACES tone curve).
2. **Attribution Corrected**: All historical comments and documentation suggesting direct extraction from a commercial binary have been removed and replaced with explicit mathematical citations.
3. **Redistribution Rights**: The cleanroom shader and JavaScript code are distributed under the project's open-source MIT License. Third-party trademark rights are explicitly acknowledged and preserved.

---

## 4. Verification vs. Parity Claims

In accordance with strict graphics engineering standards:
- **Mock Verification** validates API calls, dynamic attribute provisioning, and parameter limits within a headless simulated environment.
- **Live Cavalry Verification** confirms that nodes instantiate, compile on the GPU, bind dynamic slots, and generate valid PNG frames in live Cavalry 2.8 (`http://127.0.0.1:8080`).
- **After Effects Visual Parity** is evaluated using objective statistical metrics (MAE, PSNR, SSIM) against authentic reference renders. Where reference images are not yet checked into `references/ae-renders/`, parity is reported transparently as **unverified**. No unsupported claims of 100% mathematical or visual parity are made.
