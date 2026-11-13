# Effect Research Specification Checklist

Complete this specification **before** writing shader, deformer, or rig code for any After Effects effect.

1. **Identity**
   - Exact AE display name, Effect menu category, and `matchName` (e.g. `ADBE Turbulent Displace`).
   - Native vs third-party / Cycore (`CC ...`) classification.

2. **Full Parameter Audit**
   - Every parameter name, index/matchName, UI widget type (Slider, Angle, Point2D, Color, Popup Menu, Checkbox, Layer Control).
   - Exact default value, units (`px`, `%`, `deg`, normalized `0..1`, revolutions), min/max UI slider limits vs unclamped input bounds.
   - Enumerated menu options in exact order (important for numeric option mapping).

3. **Coordinate & Dimensional Semantics**
   - Composition space vs Layer space vs Bounding Box normalized UV (`0..1`).
   - How point parameters (`Offset`, `Center`, `Anchor`) scale relative to layer size or pixel origin (Cavalry centered Y-up coordinates vs SkSL/screen pixels vs AE top-left Y-down layer coordinates!).
   - Does effect expand layer bounds (`Resize Layer`, `Repeat Edge Pixels`) or clip inside the layer's FBO?

4. **Mathematics & Signal Model**
   - Identify whether the effect is a forward transform, backward image warp (`layer.eval(p - disp)`), convolution kernel, morphological op, compositing blend, or geometry subdiv/warp.
   - Noise/randomness requirements: PRNG seed sensitivity, fractional octave weighting, gradient vs value noise, isotropic vs directional components, periodic evolution (`Cycle Evolution` -> circular torus / 2D phase rotation `(cos(2pi t), sin(2pi t))`).
   - Derivative / field transforms where relevant (e.g. `Bulge` negative gradient, `Twist` curl/tangent rotation, directional smoothing).

5. **Time & Animation**
   - Static vs time-dependent (`Evolution`, `Phase`, `Speed`, frame rate quantization).
   - Seamless loop guarantee (`Cycle Evolution` over `Cycle (in Revolutions)`).

6. **Edge, Alpha & Quality Handling**
   - Clamping (`clamp-to-edge`) vs transparent outside vs wrap/mirror/repeat (`Pinning`, `Motion Tile` mirror).
   - Premultiplied alpha handling in SkSL (`layer.eval()` returns premultiplied `half4`!).
   - Antialiasing / supersampling (`Low` bilinear vs `High` supersampled RGSS / mip-free filtering).

7. **Provenance Discipline**
   - Tag every statement as either:
     - **[Documented AE Spec]** (observed in official Adobe AE docs or verified matchName tables)
     - **[Independent Mathematical Reconstruction]** (verified mathematical model chosen to reproduce observable behavior)
   - Never fabricate undocumented Adobe properties or claim access to Adobe's proprietary source code.
