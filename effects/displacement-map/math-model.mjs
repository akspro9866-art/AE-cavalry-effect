/**
 * Pure Mathematical Model & Invariant Suite:
 * Adobe After Effects "Displacement Map" (ADBE Displacement Map) -> Cavalry 2.8+
 */

export function extractChannel(color, channelIndex) {
    const { r = 0, g = 0, b = 0, a = 1 } = color;
    const ch = Math.floor(channelIndex + 0.5);

    if (ch === 0) return r - 0.5; // Red
    if (ch === 1) return g - 0.5; // Green
    if (ch === 2) return b - 0.5; // Blue
    if (ch === 3) return a - 0.5; // Alpha
    if (ch === 4) return (0.299 * r + 0.587 * g + 0.114 * b) - 0.5; // Luminance
    if (ch === 5) {
        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        return ((maxC + minC) * 0.5) - 0.5; // Lightness
    }
    return 0.0; // Off
}

export function calculateDisplacement(mapColor, params) {
    const {
        maxHorizontalDisplacement = 10.0,
        maxVerticalDisplacement = 10.0,
        horizontalSourceChannel = 0,
        verticalSourceChannel = 1
    } = params;

    const valX = extractChannel(mapColor, horizontalSourceChannel);
    const valY = extractChannel(mapColor, verticalSourceChannel);

    return {
        dx: valX * maxHorizontalDisplacement,
        dy: valY * maxVerticalDisplacement
    };
}

export function calculatePadding(params) {
    const padX = Math.ceil(Math.abs(params.maxHorizontalDisplacement || 0.0)) + 10;
    const padY = Math.ceil(Math.abs(params.maxVerticalDisplacement || 0.0)) + 10;
    return { x: padX, y: padY };
}
