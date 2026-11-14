# Directional Blur (AE Reconstructed for Cavalry)

Reconstructs Adobe After Effects **Directional Blur** (`ADBE Directional Blur`) for Cavalry 2.8+ as a GPU-accelerated SkSL Filter (`skslFilter`).

## Features
- **Continuous Direction Angle**: Full $360^\circ$ linear motion blur vector ($0^\circ$ is vertical up/down, $90^\circ$ is horizontal left/right).
- **Linear Triangular Bartlett Weighting**: Reconstructs After Effects linear blur falloff.
- **Dynamic Bounding Expansion**: Automatically allocates canvas padding matching the directional projection of blur length.
- **Repeat Edge Pixels**: Prevents edge transparency vignetting.

## Parameters
| Parameter | Default | Range | Description |
| :--- | :--- | :--- | :--- |
| `Direction` | 0.0 | -360.0 – +360.0 | Angle of blur line in degrees |
| `Blur Length` | 10.0 | 0.0 – 500.0 | Total length of blur streak in pixels |
| `Repeat Edge Pixels` | On (1.0) | 0 – 1 | Clamps borders to prevent edge darkening |
