# Exposure (AE Reconstructed for Cavalry)

Reconstructs Adobe After Effects **Exposure** (`ADBE Exposure`) for Cavalry 2.8+ as a GPU-accelerated SkSL Filter (`skslFilter`).

## Features
- **Exposure Stops**: Adjusts intensity in photographic EV stops ($2^{\text{Exposure}}$).
- **Offset**: Linear additive black-point level offset.
- **Gamma Correction**: Non-linear power-law gamma response.
- **Color Safety**: Straight alpha processing preserves edge silhouettes without dark fringe artifacts.

## Parameters
| Parameter | Default | Range | Description |
| :--- | :--- | :--- | :--- |
| `Exposure` | 0.0 | -10.0 – +10.0 | Gain in EV stops |
| `Offset` | 0.0 | -0.5 – +0.5 | Additive black level offset |
| `Gamma Correction` | 1.0 | 0.1 – 5.0 | Gamma response curve |
