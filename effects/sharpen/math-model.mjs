/**
 * Pure Mathematical Model & Invariant Suite:
 * Adobe After Effects "Sharpen" (ADBE Sharpen) -> Cavalry 2.8+
 */

export function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

export function unsharpMask(centerRgb, neighborRgbs, amount = 25.0, threshold = 0.0) {
    let sum = [0, 0, 0];
    let totalW = 0.0;
    const weights = [0.15, 0.15, 0.15, 0.15, 0.10, 0.10, 0.10, 0.10];

    for (let i = 0; i < neighborRgbs.length; i++) {
        const w = weights[i] || 0.125;
        sum[0] += neighborRgbs[i][0] * w;
        sum[1] += neighborRgbs[i][1] * w;
        sum[2] += neighborRgbs[i][2] * w;
        totalW += w;
    }

    const blurred = [sum[0] / totalW, sum[1] / totalW, sum[2] / totalW];
    const delta = [
        centerRgb[0] - blurred[0],
        centerRgb[1] - blurred[1],
        centerRgb[2] - blurred[2]
    ];

    const deltaMag = Math.hypot(delta[0], delta[1], delta[2]);
    const threshNorm = threshold / 255.0;

    const out = [...centerRgb];
    if (deltaMag >= threshNorm) {
        const factor = amount / 25.0;
        out[0] = clamp(out[0] + delta[0] * factor, 0.0, 1.0);
        out[1] = clamp(out[1] + delta[1] * factor, 0.0, 1.0);
        out[2] = clamp(out[2] + delta[2] * factor, 0.0, 1.0);
    }
    return out;
}
