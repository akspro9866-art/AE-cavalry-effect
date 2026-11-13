// Tint pure JavaScript mathematical reference model
// Used for offline verification, invariant testing, and visual equivalency assertions.

export function applyTint(srcRgb, blackRgb, whiteRgb, amount = 1.0) {
    const lum = 0.299 * srcRgb[0] + 0.587 * srcRgb[1] + 0.114 * srcRgb[2];
    const t = Math.max(0.0, Math.min(1.0, lum));
    const mapped = [
        blackRgb[0] * (1.0 - t) + whiteRgb[0] * t,
        blackRgb[1] * (1.0 - t) + whiteRgb[1] * t,
        blackRgb[2] * (1.0 - t) + whiteRgb[2] * t
    ];
    const amt = Math.max(0.0, Math.min(1.0, amount));
    return [
        srcRgb[0] * (1.0 - amt) + mapped[0] * amt,
        srcRgb[1] * (1.0 - amt) + mapped[1] * amt,
        srcRgb[2] * (1.0 - amt) + mapped[2] * amt
    ];
}
