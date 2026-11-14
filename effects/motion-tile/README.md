# Motion Tile (ADBE Tile) for Cavalry 2.8+

Mathematically reconstructed Adobe After Effects **Motion Tile** effect implemented as a high-performance GPU SkSL filter (`skslFilter`) in Cavalry 2.8+.

## Features
- **Seamless Coordinate Tiling**: Extends imagery across custom output percentage boundaries.
- **Edge Mirroring**: Alternates coordinate orientation across adjacent tile indices.
- **Phase Stagger**: Offsets horizontal tile alignment per vertical row.
- **Dynamic Canvas Padding**: Expands Cavalry viewport bounding box dynamically to display repeated tiles.
