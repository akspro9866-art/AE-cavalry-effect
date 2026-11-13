# CC Ball Action (After Effects -> Cavalry)

GPU-accelerated SkSL Filter reconstruction of Cycore FX **CC Ball Action** for Cavalry 2.8+.

## Overview
Decomposes 2D layer artwork into a discrete grid of 3D shaded spherical balls with real-time procedural lighting, specular reflections, and pseudo-random spatial scatter.

## Parameters
| Parameter | Default | Range | Description |
|---|---|---|---|
| `Scatter` | `0.0` | 0 - 1024 | Scatter distance displacing balls from grid cells |
| `Ball Size` | `100.0` | 0 - 1000% | Relative sphere radius (100% touches borders) |
| `Grid Spacing` | `10.0` | 1 - 100 px | Distance between adjacent ball centers |
| `Instability State` | `0.0` | 0 - 10000 | Random seed controlling scatter displacement vectors |

## Implementation
- **Implementation Type**: `skslFilter`
- **Coordinate Space**: Pixel space with 3x3 local neighbor kernel for overlap and scatter support.
- **Dynamic Padding**: Automatically computes boundary expansion when `Scatter > 0` or `BallSize > 100%`.
