# Pre-Compose (After Effects Workflow for Cavalry 2.8+)

Moves the selected layers into a new nested composition (`compositionReference`), exactly like Adobe After Effects **Pre-Compose**.

## Behavior

- Moves all currently selected layers into a new nested composition.
- Replaces them in the active composition with a single `compositionReference` layer.
- Retains layer transforms, hierarchy, and timing.
- Selects the new Pre-Comp layer so you can immediately position, keyframe, or apply filters to it.

## Usage

1. Select one or more layers in Cavalry.
2. Go to **Scripts -> AE Effects**.
3. Click **Pre-Compose**.
4. The selected layers are packaged into a nested composition!
