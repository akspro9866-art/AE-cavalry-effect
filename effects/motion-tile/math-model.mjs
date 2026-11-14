/**
 * Pure Mathematical Model & Invariant Suite:
 * Adobe After Effects "Motion Tile" (ADBE Tile) -> Cavalry 2.8+
 */

export function mapCoordinate(coord, resolution, params) {
    const {
        tileCenterX = 0.0,
        tileCenterY = 0.0,
        tileWidth = 100.0,
        tileHeight = 100.0,
        outputWidth = 100.0,
        outputHeight = 100.0,
        mirrorEdges = 1,
        phase = 0.0
    } = params;

    const resX = Math.max(resolution.x, 1.0);
    const resY = Math.max(resolution.y, 1.0);
    const halfResX = resX * 0.5;
    const halfResY = resY * 0.5;

    const outScaleX = Math.max(outputWidth * 0.01, 0.01);
    const outScaleY = Math.max(outputHeight * 0.01, 0.01);
    if (Math.abs(coord.x) > halfResX * outScaleX || Math.abs(coord.y) > halfResY * outScaleY) {
        return null; // clipped by output boundary
    }

    const tDimX = resX * Math.max(tileWidth * 0.01, 0.001);
    const tDimY = resY * Math.max(tileHeight * 0.01, 0.001);

    let px = coord.x - tileCenterX;
    const py = coord.y - tileCenterY;

    const row = Math.floor(py / tDimY + 0.5);
    const phaseOffset = (phase / 360.0) * tDimX * row;
    px -= phaseOffset;

    const ux = px / tDimX + 0.5;
    const uy = py / tDimY + 0.5;

    const tileIdxX = Math.floor(ux);
    const tileIdxY = Math.floor(uy);

    let fx = ux - tileIdxX;
    let fy = uy - tileIdxY;

    if (mirrorEdges > 0.5) {
        if ((Math.abs(tileIdxX) % 2) !== 0) fx = 1.0 - fx;
        if ((Math.abs(tileIdxY) % 2) !== 0) fy = 1.0 - fy;
    }

    return {
        x: (fx - 0.5) * resX,
        y: (fy - 0.5) * resY
    };
}

export function calculatePadding(resolution, params) {
    const resX = resolution ? Math.max(resolution.x || 100, 100) : 100;
    const resY = resolution ? Math.max(resolution.y || 100, 100) : 100;
    const outW = Math.max(params.outputWidth || 100.0, 100.0);
    const outH = Math.max(params.outputHeight || 100.0, 100.0);

    const padX = Math.ceil(resX * (outW / 100.0 - 1.0) * 0.5) + 10;
    const padY = Math.ceil(resY * (outH / 100.0 - 1.0) * 0.5) + 10;

    return {
        x: Math.max(0, padX),
        y: Math.max(0, padY)
    };
}
