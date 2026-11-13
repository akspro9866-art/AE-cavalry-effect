// CC Ball Action pure JavaScript mathematical reference model
// Used for offline verification, invariant testing, and visual equivalency assertions.

export function computePadding(scatter, gridSpacing, ballSize) {
    const s = Math.max(0, Number(scatter) || 0);
    const g = Math.max(1, Number(gridSpacing) || 10);
    const b = Math.max(0, Number(ballSize) || 100);
    const r = 0.5 * g * (b / 100.0);
    const pad = Math.ceil(s + Math.max(0, r - g * 0.5) + 10);
    return { x: pad, y: pad };
}

export function computeBallNormal(dx, dy, radius) {
    const distSq = dx * dx + dy * dy;
    const rSq = radius * radius;
    if (distSq > rSq) return null;
    const nx = dx / radius;
    const ny = dy / radius;
    const nz = Math.sqrt(Math.max(0, 1.0 - nx * nx - ny * ny));
    return [nx, ny, nz];
}

export function computeBallLighting(norm, lightDir = [-0.4, -0.6, 0.7]) {
    const lLen = Math.hypot(...lightDir);
    const lx = lightDir[0] / lLen;
    const ly = lightDir[1] / lLen;
    const lz = lightDir[2] / lLen;

    const diff = Math.max(0, norm[0] * lx + norm[1] * ly + norm[2] * lz);
    return 0.35 + 0.65 * diff;
}
