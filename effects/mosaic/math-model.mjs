/**
 * Pure Mathematical Model & Invariant Suite:
 * Adobe After Effects "Mosaic" (ADBE Mosaic) -> Cavalry 2.8+
 */

export function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

export function quantizeCoordinate(coord, res, blocks) {
    const halfRes = res * 0.5;
    const uv = clamp((coord + halfRes) / res, 0.0, 1.0);
    const n = Math.max(Math.floor(blocks + 0.5), 1.0);
    const cell = Math.floor(uv * n);
    const cellUv = (cell + 0.5) / n;
    return cellUv * res - halfRes;
}

export function quantizeSharpColor(val, levels = 16.0) {
    return clamp(Math.floor(val * levels + 0.5) / levels, 0.0, 1.0);
}
