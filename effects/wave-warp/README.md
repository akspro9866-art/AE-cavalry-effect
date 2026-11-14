# Wave Warp (ADBE Wave Warp) for Cavalry 2.8+

Mathematically reconstructed Adobe After Effects **Wave Warp** effect implemented as a high-performance GPU SkSL filter (`skslFilter`) in Cavalry 2.8+.

## Features
- **Wave Types**: Sine, Square, Triangle, Sawtooth, Circles, and Semicircles.
- **Directional Propagation**: Arbitrary propagation angle with orthogonal displacement.
- **Boundary Pinning**: Support for locking Top, Bottom, Left, Right, or All Edges to preserve layer anchoring.
- **Dynamic Padding**: Automatically expands filter canvas bounds to prevent wave clipping.
- **Full Keyframeability**: All parameters exposed in Cavalry's Attribute Editor.
