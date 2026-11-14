# Glow (AE Reconstructed for Cavalry)

Reconstructs native Adobe After Effects **Glow** (`ADBE Glo2`) for Cavalry 2.8+ as a GPU-accelerated SkSL Filter (`skslFilter`). Distinct from Deep Glow, this provides native After Effects threshold gating, multi-stage golden-spiral diffusion, A/B color ramp looping, and Add/Screen compositing.

## Features
- **Glow Based On**: Drive emission from Color Channels (luminance) or Alpha Channel.
- **Threshold Gating**: Strict cut-off preventing dark or midtone pixels from generating unwanted haze.
- **A & B Colors Palette**: Route glow through multi-stop gradient ramps with cyclical frequency looping and rotational phase.
- **Composite Modes**: Choose between Add and Screen blend operations, or Behind/On Top/None layer ordering.
- **Dynamic Padding**: Automatically expands layer canvas to prevent glow clipping at perimeter bounds.

## Parameters
| Parameter | Default | Range | Description |
| :--- | :--- | :--- | :--- |
| `Glow Based On` | Color Channels (0) | 0 – 1 | 0=Color, 1=Alpha |
| `Glow Threshold` | 60.0% | 0.0 – 100.0% | Luminance threshold cutoff |
| `Glow Radius` | 10.0 px | 0.0 – 500.0 px | Emission dispersion radius |
| `Glow Intensity` | 1.0 | 0.0 – 10.0 | Output energy multiplier |
| `Composite Original` | Behind (0) | 0 – 2 | 0=Behind, 1=On Top, 2=None |
| `Glow Operation` | Add (0) | 0 – 1 | 0=Add, 1=Screen |
| `Glow Colors` | Original (0) | 0 – 1 | 0=Original Colors, 1=A & B Colors |
| `Color A` | RGB(255, 255, 255) | Color | Palette start swatch |
| `Color B` | RGB(0, 0, 0) | Color | Palette end swatch |
| `Color Looping` | 1.0 | 1.0 – 10.0 | Ramp frequency |
| `Color Phase` | 0.0° | 0.0 – 360.0° | Ramp phase shift |
