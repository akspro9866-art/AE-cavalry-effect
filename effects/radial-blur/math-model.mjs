/**
 * Pure Mathematical Model & Invariant Suite:
 * Adobe After Effects "Radial Blur" (ADBE Radial Blur) -> Cavalry 2.8+
 */

export function computeSpinSampleOffsets(radiusVec, angleRads) {
    const cosA = Math.cos(angleRads);
    const sinA = Math.sin(angleRads);
    const cw = [
        radiusVec[0] * cosA - radiusVec[1] * sinA,
        radiusVec[0] * sinA + radiusVec[1] * cosA
    ];
    const ccw = [
        radiusVec[0] * cosA + radiusVec[1] * sinA,
        -radiusVec[0] * sinA + radiusVec[1] * cosA
    ];
    return { cw, ccw };
}

export function computeZoomSampleOffsets(radiusVec, scaleFactor) {
    return {
        zoomIn: [radiusVec[0] * (1.0 - scaleFactor), radiusVec[1] * (1.0 - scaleFactor)],
        zoomOut: [radiusVec[0] * (1.0 + scaleFactor), radiusVec[1] * (1.0 + scaleFactor)]
    };
}

export function computePadding(amount, blurType) {
    const factor = (amount / 100.0) * 0.5;
    return {
        x: Math.ceil(factor * 100 + 15),
        y: Math.ceil(factor * 100 + 15)
    };
}
