# CC RepeTile (After Effects Replication for Cavalry 2.8+)

Reconstructs the Adobe After Effects **CC RepeTile** effect as a GPU-accelerated SkSL Filter (`skslFilter`) in Cavalry 2.8+.

## Features

- **Directional Canvas Expansion**: Independently expand borders Left, Right, Up, and Down without clipping.
- **Tiling Modes**:
  - `0 = Repeat`: Standard periodic tiling.
  - `1 = Flip`: Alternating mirror reflection (ping-pong) along borders — seamless continuity with zero visible seam lines!
  - `2 = Checker`: Alternating checkerboard reflection pattern.
  - `3 = Brick`: Staggered brick wall pattern with 50% horizontal offset on alternate rows.
  - `4 = Fold`: Inward symmetric fold.
  - `5 = Unfold`: Outward unfold.
- **Blend Borders**: Soft seam crossfade width across border boundaries.
- **Dynamic Padding**: Automatically recalculates layer bounding padding in real time.

## Parameter Reference

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `ExpandLeft` | double | `200.0` | Expansion distance to the left in pixels |
| `ExpandRight` | double | `200.0` | Expansion distance to the right in pixels |
| `ExpandUp` | double | `200.0` | Expansion distance upwards in pixels |
| `ExpandDown` | double | `200.0` | Expansion distance downwards in pixels |
| `Tiling` | enum | `1` (Flip) | Tiling algorithm (Repeat, Flip, Checker, Brick, Fold, Unfold) |
| `BlendBorders` | double | `0.0` | Seam edge crossfade amount (0.0 to 1.0) |

## Usage

1. Select any shape, group, text, or preComp in Cavalry.
2. Go to **Scripts -> AE Effects**.
3. Click **CC RepeTile**.
4. Adjust expansion sliders in the Attribute Editor!
