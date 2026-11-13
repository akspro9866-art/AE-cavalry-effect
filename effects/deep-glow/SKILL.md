---
name: ae-deep-glow-cavalry
description: Instructions and operational protocols for applying and maintaining the Adobe After Effects Deep Glow effect in Cavalry 2.8+.
---

# Deep Glow (AE to Cavalry)

## Overview
Reconstruction of Adobe After Effects Deep Glow plugin as a high-fidelity GPU SkSL Filter (`skslFilter`) for Cavalry 2.8+.

## Key Files
- `deep-glow.sksl`: GPU fragment shader with multi-octave radial sampling, anamorphic stretch, chromatic dispersion, two-tone tint, and tone mapping.
- `math-model.mjs`: Pure JavaScript reference model for unit testing and invariant verification.
- `implementation.js`: Self-contained, idempotent applicator script.
- `parameter-map.json`: Attribute definitions and type bindings.

## Verification Checklist
1. Tier 1 Static Validation: Verify shader syntax, parameter JSON schema, and embedded code sync.
2. Tier 2 Mathematical Invariants: Verify zero-exposure identity, inverse-square curve, anamorphic matrices, threshold knee, and tone mapping limits.
3. Tier 3 Headless Mock: Verify layer selection, dynamic slot creation (`inputs.0`..`inputs.16`), and idempotency.
4. Tier 4 Live Cavalry 2.8: Verify GPU compilation, frame rendering at `127.0.0.1:8080`, and output frame capture.
