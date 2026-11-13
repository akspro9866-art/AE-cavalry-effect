# Null Object (After Effects Workflow for Cavalry 2.8+)

Creates an Adobe After Effects style **Null Object** in Cavalry 2.8.

## Behavior

- **With Selection**:
  - Automatically calculates the visual centroid (bounding box center) of all selected layers.
  - Creates a native `null` layer placed exactly at the centroid.
  - Parents all selected layers to the Null (`api.parent`).
  - Sets viewport wireframe color to After Effects coral red (`#F05050`).
  - Selects the new Null layer so you can immediately translate, rotate, scale, or animate the entire rig.
- **Without Selection**:
  - Creates a Null layer at composition center `(0, 0)` ready for manual parenting or camera targeting.

## Usage

1. Select one or more layers in Cavalry.
2. Go to **Scripts -> AE Effects**.
3. Click **Null Object**.
4. All selected layers are instantly parented to a newly created Null at their visual center!
