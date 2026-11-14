# Optics Compensation (ADBE Optics Compensation) for Cavalry 2.8+

Mathematically reconstructed Adobe After Effects **Optics Compensation** effect implemented as a GPU SkSL filter (`skslFilter`) in Cavalry 2.8+.

## Features
- **Wide Angle Lens Simulation**: Reconstructs wide-angle lens curvature and perspective distortion.
- **Reverse Distortion**: Seamlessly toggles between barrel and pincushion lens distortion profiles.
- **Optical Center Shift**: Configurable focal axis position for off-center camera angles.
- **Asymptote & Singularity Protection**: Safe spherical tangent clamping prevents GPU driver hangs or division by zero.
