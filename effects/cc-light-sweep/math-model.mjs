/**
 * Pure Mathematical Model & Invariant Suite:
 * Adobe After Effects "CC Light Sweep" -> Cavalry 2.8+
 */

export function computeBeamIntensity(fragCoord, center, directionDegrees, width, shape = 0) {
    const rad = directionDegrees * (Math.PI / 180.0);
    const normal = [-Math.sin(rad), Math.cos(rad)];
    const dx = fragCoord[0] - center[0];
    const dy = fragCoord[1] - center[1];
    const d = Math.abs(dx * normal[0] + dy * normal[1]);
    const halfW = Math.max(width * 0.5, 0.5);

    if (d >= halfW) return 0.0;
    const u = 1.0 - (d / halfW);

    if (shape === 1) {
        return u * u * (3.0 - 2.0 * u);
    } else if (shape === 2) {
        return u * u * u;
    }
    return u;
}

export function computeAlphaGradient(alphaRight, alphaLeft, alphaUp, alphaDown) {
    const gx = alphaRight - alphaLeft;
    const gy = alphaUp - alphaDown;
    return Math.hypot(gx, gy) * 0.5;
}
