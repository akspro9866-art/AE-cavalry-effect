# Adjustment Layer (After Effects Workflow for Cavalry 2.8+)

Creates an Adobe After Effects style **Adjustment Layer** in Cavalry 2.8.

## Behavior

- **With Selection**:
  - Creates an `[AE:Adjustment Layer]` group.
  - Automatically moves and groups all selected layers inside it.
  - Attaches an SkSL filter pipeline to the group's `filters` port, applying visual processing to all child layers simultaneously.
  - Selects the Adjustment Layer group so you can immediately edit attributes or add more effects (e.g. Deep Glow, Turbulent Displace, RepeTile).
- **Without Selection**:
  - Gathers existing root layers in the composition and wraps them inside the Adjustment Layer group.

## Usage

1. Select one or more layers in Cavalry.
2. Go to **Scripts -> AE Effects**.
3. Click **Adjustment Layer**.
4. The selected layers are grouped and an adjustment filter is attached ready for grading and effects!
