/**
 * Pure Mathematical Model & Invariant Suite:
 * Adobe After Effects "Time Displacement" (ADBE Time Displacement) -> Cavalry 2.8+
 */

export function extractChannel(color, ch) {
    const { r = 0, g = 0, b = 0, a = 1 } = color;
    const c = Math.floor(ch + 0.5);
    if (c === 0) return r;
    if (c === 1) return g;
    if (c === 2) return b;
    if (c === 3) return a;
    return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function calculateTimeDelta(normVal, maxTime, resolution) {
    let dt = (normVal - 0.5) * maxTime;
    const resStep = Math.max(resolution, 1.0);
    dt = Math.round(dt * resStep) / resStep;
    return dt;
}

export function calculatePadding(params) {
    const maxT = Math.abs(params.maxDisplacementTime || 1.0);
    const lag = params.spatialLagFactor !== undefined ? params.spatialLagFactor : 20.0;
    const pad = Math.ceil(maxT * lag * 0.5) + 10;
    return { x: 0, y: pad };
}
