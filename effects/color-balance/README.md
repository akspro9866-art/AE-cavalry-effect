# Color Balance (ADBE Color Balance2) for Cavalry 2.8+

Mathematically reconstructed Adobe After Effects **Color Balance** effect implemented as a GPU SkSL filter (`skslFilter`) in Cavalry 2.8+.

## Features
- **Tonal Zone Balance**: Independent Red, Green, and Blue balance controls for Shadows, Midtones, and Highlights.
- **Partition-of-Unity Weighting**: Quadratic luminance-driven curves ensure seamless, continuous transitions between tonal bands.
- **Preserve Luminosity**: Locks perceptual image brightness during tinting and temperature adjustments.
- **Unpremultiplied Processing**: Evaluates color balance on unpremultiplied color components to prevent edge fringe darkening.
