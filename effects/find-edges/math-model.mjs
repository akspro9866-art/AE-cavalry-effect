/**
 * Pure Mathematical Model & Invariant Suite:
 * Adobe After Effects "Find Edges" (ADBE Find Edges) -> Cavalry 2.8+
 */

export function computeSobelGradient(patch) {
    // patch is a 3x3 array of scalar intensities or {r, g, b}
    // [ [c00, c10, c20],
    //   [c01, c11, c21],
    //   [c02, c12, c22] ]

    const gx = (patch[0][2] + 2.0 * patch[1][2] + patch[2][2]) - (patch[0][0] + 2.0 * patch[1][0] + patch[2][0]);
    const gy = (patch[2][0] + 2.0 * patch[2][1] + patch[2][2]) - (patch[0][0] + 2.0 * patch[0][1] + patch[0][2]);

    const mag = Math.sqrt(gx * gx + gy * gy);
    return Math.max(0.0, Math.min(1.0, mag * 0.7));
}

export function calculateEdgeColor(mag, invert) {
    const m = Math.max(0.0, Math.min(1.0, mag));
    if (invert > 0.5) {
        return m; // Bright lines on Black
    }
    return 1.0 - m; // Dark lines on White
}

export function calculatePadding() {
    return { x: 0, y: 0 };
}
