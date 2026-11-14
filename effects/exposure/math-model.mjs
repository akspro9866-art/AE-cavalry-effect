/**
 * Pure Mathematical Model & Invariants:
 * Adobe After Effects "Exposure" (ADBE Exposure) -> Cavalry 2.8+
 */

export function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

export function adjustExposureChannel(c, exposure = 0.0, offset = 0.0, gamma = 1.0) {
    const scaled = c * Math.pow(2.0, exposure) + offset;
    if (Math.abs(scaled) <= 1e-6) return 0.0;
    const g = Math.max(gamma, 0.01);
    const sign = Math.sign(scaled);
    const powered = Math.pow(Math.abs(scaled), 1.0 / g);
    return clamp(sign * powered, 0.0, 1.0);
}

export function applyExposure(rgb, params = {}) {
    const exp = params.exposure ?? 0.0;
    const offset = params.offset ?? 0.0;
    const gamma = params.gammaCorrection ?? 1.0;

    return [
        adjustExposureChannel(rgb[0], exp, offset, gamma),
        adjustExposureChannel(rgb[1], exp, offset, gamma),
        adjustExposureChannel(rgb[2], exp, offset, gamma),
    ];
}
