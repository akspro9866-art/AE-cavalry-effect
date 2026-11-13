# Deep Glow (After Effects Style Replication for Cavalry 2.8+)

Physically accurate, high-fidelity optical glow for Cavalry 2.8+, mathematically reconstructed using open computer graphics algorithms (inverse-square attenuation, Vogel golden-spiral sampling, Pegtop overlay equations, and ACES/Reinhard tone mapping).

> **Provenance Notice**: This implementation is an independent mathematical cleanroom reconstruction authored in SkSL. It does not contain, decompile, or redistribute proprietary plugin binaries or third-party source code. "Deep Glow" is a trademark of Plugin Everything and is referenced for workflow compatibility purposes.

## Features

- **Physically-Accurate Inverse-Square Falloff**: Organic luminescence governed by inverse-square attenuation without flat edges.
- **Falloff Modes**: Inverse Square ($w = 1 / (1 + (r/r_0)^2)$), Smooth Gaussian, and Core Concentrated.
- **Thresholding & Saturation Bias**: Isolate bright elements with soft knee transitions and saturation priority.
- **Anamorphic Streaks & Angles**: Create cinematic sci-fi lens flares by stretching `AspectRatio` and setting `AspectAngle`.
- **Chromatic Aberration**: Optical prismatic dispersion separating Red, Green, and Blue glow fringes.
- **Two-Tone Tinting**: Monocolor and Duocolor inner/outer tints using Pegtop Multiply, Overlay, and Soft Light formulas.
- **HDR Tone Mapping**: Built-in ACES Filmic (Narkowicz fit), Filmic (Hejl-Burgess-Dawson), Reinhard, Reinhard 2, and Clamp Chroma modes.
- **Blend Modes**: Add (photorealistic light emission), Screen (clamped diffusion), and Glow Only (unmulted alpha glow pass).
- **One-Click Application**: Instantly apply to any selected layer via Cavalry's `Scripts -> AE Effects` menu.

## Parameter Reference

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `Radius` | double | `120.0` | Spread radius of the glow aura in pixels |
| `Exposure` | double | `1.0` | Brightness multiplier for the glow |
| `Threshold` | double | `0.0` | Luminance cutoff below which elements do not emit glow |
| `ThresholdSmooth` | double | `0.1` | Soft knee transition width for thresholding |
| `SaturationBias` | double | `0.0` | Bias threshold to saturated (+1) or desaturated (-1) colors |
| `AspectRatio` | double | `1.0` | Anamorphic horizontal/vertical stretch ratio |
| `AspectAngle` | double | `0.0` | Rotation angle of the anamorphic flare in degrees |
| `Aberration` | double | `0.0` | Prismatic dispersion splitting RGB glow channels |
| `GlowMode` | enum | `0` | 0: Inverse Square, 1: Smooth Gaussian, 2: Core Concentrated |
| `BlendMode` | enum | `0` | 0: Add, 1: Screen, 2: Glow Only |
| `TintMode` | enum | `0` | 0: Off, 1: Monocolor, 2: Duocolor (Two-Tone) |
| `TintColor` | color | `RGB(255, 200, 120)` | Primary / Inner highlight tint color |
| `TintColorOuter` | color | `RGB(50, 150, 255)` | Secondary / Outer falloff tint color (Duocolor mode) |
| `TintBlendMode` | enum | `1` | 0: Multiply, 1: Overlay, 2: Soft Light |
| `TintStrength` | double | `1.0` | Mix blend factor between source and tint colors |
| `ToneMapMode` | enum | `0` | 0: None, 1: ACES Filmic, 2: Filmic, 3: Reinhard, 4: Reinhard 2, 5: Clamp Chroma |
| `SourceOpacity` | double | `1.0` | Visibility of original source layer beneath glow |

## Usage

1. Select any shape, group, text, or preComp in Cavalry.
2. Go to **Scripts -> AE Effects**.
3. Click **Deep Glow**.
4. Adjust parameters in the Attribute Editor!
