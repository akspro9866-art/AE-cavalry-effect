/**
 * Pure Mathematical Model & Invariant Suite:
 * Adobe After Effects "Drop Shadow" (ADBE Drop Shadow) -> Cavalry 2.8+
 */

export function computeShadowOffset(directionDegrees, distance) {
    const rad = directionDegrees * (Math.PI / 180.0);
    return [Math.cos(rad) * distance, Math.sin(rad) * distance];
}

export function computePadding(directionDegrees, distance, softness) {
    const [ox, oy] = computeShadowOffset(directionDegrees, distance);
    const softR = softness * 1.5;
    return {
        x: Math.ceil(Math.abs(ox) + softR + 15),
        y: Math.ceil(Math.abs(oy) + softR + 15)
    };
}

export function compositeOver(srcRgba, shadowRgba) {
    const srcA = srcRgba[3];
    const shadowA = shadowRgba[3];
    const outA = srcA + shadowA * (1.0 - srcA);
    const outRgb = [
        srcRgba[0] * srcA + shadowRgba[0] * shadowA * (1.0 - srcA),
        srcRgba[1] * srcA + shadowRgba[1] * shadowA * (1.0 - srcA),
        srcRgba[2] * srcA + shadowRgba[2] * shadowA * (1.0 - srcA)
    ];
    return [...outRgb, outA];
}
