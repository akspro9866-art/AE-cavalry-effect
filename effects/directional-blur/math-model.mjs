/**
 * Pure Mathematical Model & Invariant Suite:
 * Adobe After Effects "Directional Blur" (ADBE Directional Blur) -> Cavalry 2.8+
 */

export function computeDirectionVector(directionDegrees) {
    const rad = directionDegrees * (Math.PI / 180.0);
    const s = Math.sin(rad);
    const c = -Math.cos(rad);
    return [Math.abs(s) < 1e-6 ? 0.0 : s, Math.abs(c) < 1e-6 ? 0.0 : c];
}

export function computePadding(blurLength, directionDegrees) {
    const [dx, dy] = computeDirectionVector(directionDegrees);
    const halfLen = blurLength * 0.5;
    return {
        x: Math.ceil(Math.abs(dx) * halfLen) + 10,
        y: Math.ceil(Math.abs(dy) * halfLen) + 10
    };
}

export function computeKernelWeightsSum() {
    let totalW = 1.0;
    for (let i = 1; i <= 16; i++) {
        const w = 1.0 - (i / 17.0);
        totalW += 2.0 * w;
    }
    return totalW;
}
