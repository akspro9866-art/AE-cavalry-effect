/**
 * Pure Mathematical Model & Invariant Suite:
 * Adobe After Effects "Optics Compensation" (ADBE Optics Compensation) -> Cavalry 2.8+
 */

export function distortCoordinate(coord, resolution, params) {
    const {
        fieldOfView = 0.0,
        reverseLensDistortion = 0,
        viewCenterX = 0.0,
        viewCenterY = 0.0
    } = params;

    if (fieldOfView <= 0.01) {
        return { x: coord.x, y: coord.y };
    }

    const resX = Math.max(resolution.x, 1.0);
    const resY = Math.max(resolution.y, 1.0);
    const halfResX = resX * 0.5;
    const halfResY = resY * 0.5;

    const px = coord.x - viewCenterX;
    const py = coord.y - viewCenterY;
    const dist = Math.sqrt(px * px + py * py);
    if (dist <= 0.001) {
        return { x: coord.x, y: coord.y };
    }

    const diag = Math.sqrt(halfResX * halfResX + halfResY * halfResY);
    const normR = dist / Math.max(diag, 1.0);

    const fovClamped = Math.max(0.1, Math.min(160.0, fieldOfView));
    const halfFovRad = (fovClamped * 0.5) * (Math.PI / 180.0);
    const tanHalfFov = Math.tan(halfFovRad);

    let rPrime;
    if (reverseLensDistortion > 0.5) {
        rPrime = Math.atan(normR * tanHalfFov) / halfFovRad;
    } else {
        const theta = normR * halfFovRad;
        if (theta >= 1.55) {
            return null; // outside asymptote
        }
        rPrime = Math.tan(theta) / Math.max(tanHalfFov, 1e-4);
    }

    const distortedX = viewCenterX + (px / dist) * (rPrime * diag);
    const distortedY = viewCenterY + (py / dist) * (rPrime * diag);

    if (Math.abs(distortedX) > halfResX || Math.abs(distortedY) > halfResY) {
        return null;
    }

    return { x: distortedX, y: distortedY };
}

export function calculatePadding() {
    return { x: 0, y: 0 };
}
