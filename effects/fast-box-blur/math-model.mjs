/**
 * Pure Mathematical Model & Invariant Suite:
 * Adobe After Effects "Fast Box Blur" (ADBE Box Blur2) -> Cavalry 2.8+
 */

export function computeBoxWeight(dist, radius, iters = 1) {
    const normDist = Math.abs(dist) / Math.max(radius * iters, 1e-4);
    if (normDist > 1.0) return 0.0;
    if (iters <= 1) {
        return 1.0;
    } else if (iters === 2) {
        return 1.0 - normDist;
    } else {
        const d = normDist * 2.0;
        if (d <= 1.0) {
            return (2.0 / 3.0) - d * d + 0.5 * d * d * d;
        } else {
            const t = 2.0 - d;
            return (1.0 / 6.0) * t * t * t;
        }
    }
}

export function computePadding(blurRadius, iterations, blurDimensions) {
    const r = blurRadius * iterations;
    const dim = Math.round(blurDimensions);
    return {
        x: dim === 2 ? 0 : Math.ceil(r) + 10,
        y: dim === 1 ? 0 : Math.ceil(r) + 10
    };
}
