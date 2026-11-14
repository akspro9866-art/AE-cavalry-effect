/**
 * Pure Mathematical Model & Invariant Suite:
 * Adobe After Effects "Levels" (ADBE Set Levels) -> Cavalry 2.8+
 */

export function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

export function remapLevel(c, inB = 0, inW = 255, gamma = 1.0, outB = 0, outW = 255) {
    const inNormB = inB / 255.0;
    const inNormW = inW / 255.0;
    const outNormB = outB / 255.0;
    const outNormW = outW / 255.0;
    const span = Math.max(inNormW - inNormB, 1e-5);
    const t = clamp((c - inNormB) / span, 0.0, 1.0);
    const g = Math.max(gamma, 0.01);
    const powered = Math.pow(t, 1.0 / g);
    return clamp(outNormB + powered * (outNormW - outNormB), 0.0, 1.0);
}

export function applyLevels(rgb, params = {}) {
    const inB = params.inputBlack ?? 0.0;
    const inW = params.inputWhite ?? 255.0;
    const gamma = params.gamma ?? 1.0;
    const outB = params.outputBlack ?? 0.0;
    const outW = params.outputWhite ?? 255.0;
    const channel = Math.round(params.channel ?? 0);

    const out = [...rgb];
    if (channel === 1) {
        out[0] = remapLevel(out[0], inB, inW, gamma, outB, outW);
    } else if (channel === 2) {
        out[1] = remapLevel(out[1], inB, inW, gamma, outB, outW);
    } else if (channel === 3) {
        out[2] = remapLevel(out[2], inB, inW, gamma, outB, outW);
    } else {
        out[0] = remapLevel(out[0], inB, inW, gamma, outB, outW);
        out[1] = remapLevel(out[1], inB, inW, gamma, outB, outW);
        out[2] = remapLevel(out[2], inB, inW, gamma, outB, outW);
    }
    return out;
}
