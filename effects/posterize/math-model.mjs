/**
 * Pure Mathematical Model & Invariant Suite:
 * Adobe After Effects "Posterize" (ADBE Posterize) -> Cavalry 2.8+
 */

export function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

export function quantizeChannel(c, levels = 4.0) {
    const n = Math.max(Math.floor(levels + 0.5), 2.0);
    return clamp(Math.floor(c * n) / (n - 1.0), 0.0, 1.0);
}

export function applyPosterize(rgb, params = {}) {
    const lvl = params.levels ?? 4.0;
    return [
        quantizeChannel(rgb[0], lvl),
        quantizeChannel(rgb[1], lvl),
        quantizeChannel(rgb[2], lvl)
    ];
}
