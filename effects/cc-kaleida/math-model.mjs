/**
 * Pure Mathematical Model & Invariant Suite:
 * Adobe After Effects "CC Kaleida" -> Cavalry 2.8+
 */

export function mapPolarCoordinates(coord, params) {
    const {
        centerX = 0.0,
        centerY = 0.0,
        size = 100.0,
        rotation = 0.0,
        segmentCount = 6.0,
        mirroring = 1
    } = params;

    const px = coord.x - centerX;
    const py = coord.y - centerY;

    let r = Math.sqrt(px * px + py * py);
    if (r <= 0.001) {
        return { x: centerX, y: centerY };
    }

    const scale = Math.max(size * 0.01, 0.001);
    r = r / scale;

    let theta = Math.atan2(-py, px);
    const TWO_PI = 2.0 * Math.PI;
    const rotRad = rotation * (Math.PI / 180.0);

    theta = (theta - rotRad) % TWO_PI;
    if (theta < 0.0) theta += TWO_PI;

    const nSeg = Math.max(Math.floor(segmentCount + 0.5), 2.0);
    const alpha = TWO_PI / nSeg;

    const u = theta / alpha;
    let t = u - Math.floor(u);

    if (mirroring > 0.5) {
        t = Math.abs(2.0 * t - 1.0);
    }

    const mappedTheta = t * alpha * 0.5;

    return {
        x: centerX + r * Math.cos(mappedTheta) * scale,
        y: centerY - r * Math.sin(mappedTheta) * scale
    };
}

export function calculatePadding() {
    return { x: 0, y: 0 };
}
