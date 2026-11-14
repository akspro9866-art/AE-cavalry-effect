# Echo (ADBE Echo) for Cavalry 2.8+

Mathematically reconstructed Adobe After Effects **Echo** effect implemented for Cavalry 2.8+.

## Features
- **Echo Time & Step Offsetting**: Configurable temporal interval and copy count.
- **Intensity & Exponential Decay**: Primary intensity multiplier with progressive geometric decay.
- **Blending Operators**: Comprehensive support for Add, Maximum, Minimum, Screen, Composite (Over), and Behind compositing.
- **Spatial Trail Approximation (documented)**: Cavalry's `skslFilter` has no temporal frame history, so the echo trail is a fixed diagonal spatial projection (60/30 px per second of Echo Time) with decay — not true temporal re-sampling. No duplicate rig is created automatically; for authentic temporal echoing, duplicate layers with time offsets.
- **Architectural Transparency**: Documents exact temporal capabilities and limitations honestly.
