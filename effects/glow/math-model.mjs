/**
 * Pure Mathematical Model & Invariant Suite:
 * Adobe After Effects "Glow" (ADBE Glo2) -> Cavalry 2.8+
 */

export function computeLuma(r, g, b) {
    return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function extractThresholdExcess(luma, thresholdPercent) {
    const threshNorm = thresholdPercent / 100.0;
    if (luma <= threshNorm) return 0.0;
    return Math.min(1.0, Math.max(0.0, (luma - threshNorm) / Math.max(1.0 - threshNorm, 1e-4)));
}

export function computePadding(glowRadius) {
    const pad = Math.ceil(glowRadius * 2.0 + 20);
    return { x: pad, y: pad };
}

export function blendGlow(srcRgb, glowRgb, operation = 0) {
    if (operation === 0) {
        // Add
        return [
            Math.min(1.0, srcRgb[0] + glowRgb[0]),
            Math.min(1.0, srcRgb[1] + glowRgb[1]),
            Math.min(1.0, srcRgb[2] + glowRgb[2])
        ];
    }
    // Screen
    return [
        srcRgb[0] + glowRgb[0] - srcRgb[0] * glowRgb[0],
        srcRgb[1] + glowRgb[1] - srcRgb[1] * glowRgb[1],
        srcRgb[2] + glowRgb[2] - srcRgb[2] * glowRgb[2]
    ];
}
