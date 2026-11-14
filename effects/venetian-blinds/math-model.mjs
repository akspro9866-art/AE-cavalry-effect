/**
 * Pure Mathematical Model & Invariant Suite:
 * Adobe After Effects "Venetian Blinds" (ADBE Venetian Blinds) -> Cavalry 2.8+
 */

export function calculateMask(coord, params) {
    const {
        transitionCompletion = 0.0,
        direction = 90.0,
        width = 20.0,
        feather = 0.0
    } = params;

    if (transitionCompletion <= 0.001) return 1.0;
    if (transitionCompletion >= 99.99) return 0.0;

    const rad = direction * (Math.PI / 180.0);
    const nx = Math.cos(rad);
    const ny = Math.sin(rad);

    const s = coord.x * nx + coord.y * ny;
    const w = Math.max(width, 1.0);

    let pos = s % w;
    if (pos < 0.0) pos += w;
    const t = pos / w;

    const comp = Math.max(0.0, Math.min(1.0, transitionCompletion * 0.01));
    const fNorm = Math.max(0.0, Math.min(0.49, feather / w));

    if (fNorm <= 0.001) {
        return t >= comp ? 1.0 : 0.0;
    }

    const e0 = comp - fNorm;
    const e1 = comp + fNorm;
    const x = Math.max(0.0, Math.min(1.0, (t - e0) / (e1 - e0)));
    return x * x * (3.0 - 2.0 * x);
}

export function calculatePadding() {
    return { x: 0, y: 0 };
}
