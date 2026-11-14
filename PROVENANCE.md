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
| **Glow** | GPU SkSL Filter | Native threshold knee isolation, multi-stage exponential spatial convolution, and Screen/Add additive composite blending. |
| **Levels** | GPU SkSL Filter | Piecewise linear input/output normalization with power gamma remapping and channel isolation. |
| **Curves** | GPU SkSL Filter | Piecewise Catmull-Rom cubic Hermite spline interpolation across 5 tonal control nodes for Master & RGB. |
| **Exposure** | GPU SkSL Filter | Photometric base-2 scaling ($c \cdot 2^E + O$) with Rec. 709 gamma correction. |
| **Hue/Saturation** | GPU SkSL Filter | Hexagonal HSV conversion, continuous circular hue rotation, and colorize projection. |
| **Color Balance** | GPU SkSL Filter | Partition-of-unity quadratic luminance weighting across tonal zones with luminosity preservation. |
| **Posterize** | GPU SkSL Filter | Discrete uniform step quantization $c' = \lfloor c \cdot N \rfloor / N$ with straight alpha preservation. |
| **Sharpen** | GPU SkSL Filter | High-frequency Laplacian unsharp masking with noise threshold coring. |
| **Mosaic** | GPU SkSL Filter | 2D rectangular grid coordinate quantization and centered kernel sampling. |
| **Directional Blur** | GPU SkSL Filter | Directional linear triangular convolution along a normalized 2D direction vector. |
| **Fast Box Blur** | GPU SkSL Filter | Separable multi-pass orthogonal box convolution with discrete window integration. |
| **Radial Blur** | GPU SkSL Filter | Polar rotational angular convolution and radial vector ray marching. |
| **Drop Shadow** | GPU SkSL Filter | Polar trigonometric displacement offset, Vogel golden-spiral Gaussian shadow convolution, and Porter-Duff Over alpha compositing. |
| **Bevel Alpha** | GPU SkSL Filter | 2D Sobel central difference alpha gradient surface normal estimation with Blinn-Phong diffuse/specular lighting. |
| **CC Light Sweep** | GPU SkSL Filter | Directed linear/sharp beam profiles, central difference gradient detection, and additive lighting. |
| **Wave Warp** | GPU SkSL Filter | Coordinate displacement driven by analytical waveforms (Sine, Square, Triangle, Sawtooth, Circle) with boundary edge pinning. |
| **Motion Tile** | GPU SkSL Filter | 2D modular coordinate wrapping with integer parity mirror reflection and row phase staggering. |
| **Displacement Map** | GPU SkSL Filter | Channel-selective coordinate deflection driven by secondary map layer luminance/color. |
| **CC Kaleida** | GPU SkSL Filter | Polar coordinate angular wedge partitioning with C0/C1-continuous bilateral reflection. |
| **Optics Compensation** | GPU SkSL Filter | Spherical tangent radial lens warping with reversible barrel/pincushion curvature models. |
| **Venetian Blinds** | GPU SkSL Filter | Periodic linear stripe partitioning with directional projection and smoothstep boundary feathering. |
| **Gradient Ramp** | GPU SkSL Filter | Spatial linear and radial vector projections with pseudo-random high-frequency dither scatter. |
| **Find Edges** | GPU SkSL Filter | 3x3 Sobel spatial gradient convolution with silhouette alpha preservation and inversion modes. |
| **Echo** | GPU SkSL / Rig | Temporal frame series accumulation with exponential decay and Add/Screen/Max/Min/Composite operators. |
| **Time Displacement** | GPU SkSL / Graph | Channel luminance-to-time offset quantization with spatial phase latency projection. |
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
