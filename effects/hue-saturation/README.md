# Hue/Saturation (AE Reconstructed for Cavalry)

Reconstructs Adobe After Effects **Hue/Saturation** (`ADBE HUE SATURATION`) for Cavalry 2.8+ as a GPU-accelerated SkSL Filter (`skslFilter`).

## Features
- **Master Hue**: Continuous $360^\circ$ circular polar color wheel rotation.
- **Master Saturation**: Scales color vividness smoothly from grayscale ($-100\%$) to hyper-saturated ($+100\%$).
- **Master Lightness**: Adjusts tonal lightness towards pure black or pure white.
- **Colorize Mode**: Unifies tint into a single hue angle with user-defined saturation and lightness.
- **Alpha Safety**: Evaluates transformations on unmultiplied RGB, preserving silhouette edges.

## Parameters
| Parameter | Default | Range | Description |
| :--- | :--- | :--- | :--- |
| `Channel Control` | Master (0) | 0 – 6 | Target channel range (Master, Reds, Yellows, Greens, Cyans, Blues, Magentas) |
| `Master Hue` | 0.0 | -180.0 – +180.0 | Angular hue offset in degrees |
| `Master Saturation`| 0.0 | -100.0 – +100.0 | Saturation percentage scaling |
| `Master Lightness` | 0.0 | -100.0 – +100.0 | Lightness percentage scaling |
| `Colorize` | Off (0) | 0 – 1 | Enable monochromatic colorization |
| `Colorize Hue` | 0.0 | 0.0 – 360.0 | Target colorize hue angle in degrees |
| `Colorize Saturation` | 50.0 | 0.0 – 100.0 | Target colorize saturation percent |
| `Colorize Lightness` | 0.0 | -100.0 – +100.0 | Target colorize lightness percent |
