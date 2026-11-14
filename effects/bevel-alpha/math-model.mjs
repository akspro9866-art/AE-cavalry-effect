/**
 * Pure Mathematical Model & Invariant Suite:
 * Adobe After Effects "Bevel Alpha" (ADBE Bevel Alpha) -> Cavalry 2.8+
 */

export function computeNormalGradient(alphaRight, alphaLeft, alphaUp, alphaDown) {
    return [alphaLeft - alphaRight, alphaDown - alphaUp];
}

export function computeBevelLighting(normal, lightAngleDegrees, lightIntensity = 1.0) {
    const rad = lightAngleDegrees * (Math.PI / 180.0);
    const lightDir = [Math.cos(rad), Math.sin(rad)];
    const dotL = (normal[0] * lightDir[0] + normal[1] * lightDir[1]) * lightIntensity;
    return dotL;
}
