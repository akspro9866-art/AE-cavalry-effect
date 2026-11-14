/**
 * Pure Mathematical Model & Invariant Suite:
 * Adobe After Effects "Gradient Ramp" (ADBE Ramp) -> Cavalry 2.8+
 */

export function calculateT(coord, params) {
    const {
        startPointX = -100.0,
        startPointY = -100.0,
        endPointX = 100.0,
        endPointY = 100.0,
        rampShape = 0.0
    } = params;

    const p0 = { x: startPointX, y: startPointY };
    const p1 = { x: endPointX, y: endPointY };

    if (rampShape > 0.5) {
        // Radial Ramp
        const rx = p1.x - p0.x;
        const ry = p1.y - p0.y;
        const r = Math.sqrt(rx * rx + ry * ry);
        const dx = coord.x - p0.x;
        const dy = coord.y - p0.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        return Math.max(0.0, Math.min(1.0, d / Math.max(r, 0.001)));
    } else {
        // Linear Ramp
        const vx = p1.x - p0.x;
        const vy = p1.y - p0.y;
        const lenSq = vx * vx + vy * vy;
        if (lenSq <= 0.0001) return 0.0;
        const proj = (coord.x - p0.x) * vx + (coord.y - p0.y) * vy;
        return Math.max(0.0, Math.min(1.0, proj / lenSq));
    }
}

export function interpolateRamp(coord, params) {
    const t = calculateT(coord, params);
    const c0 = params.startColor || { r: 0, g: 0, b: 0, a: 1 };
    const c1 = params.endColor || { r: 1, g: 1, b: 1, a: 1 };

    const r = c0.r + (c1.r - c0.r) * t;
    const g = c0.g + (c1.g - c0.g) * t;
    const b = c0.b + (c1.b - c0.b) * t;
    const a = c0.a + (c1.a - c0.a) * t;

    return { r, g, b, a, t };
}

export function calculatePadding() {
    return { x: 0, y: 0 };
}
