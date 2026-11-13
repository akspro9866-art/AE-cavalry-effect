// Fractal Noise pure JavaScript mathematical reference model
// Used for offline verification, invariant testing, and visual equivalency assertions.

export function remapContrastBrightness(val, contrast = 100, brightness = 0) {
    let v = val * 0.5 + 0.5;
    const cFactor = contrast / 100.0;
    const bOffset = brightness / 100.0;
    return (v - 0.5) * cFactor + 0.5 + bOffset;
}

export function applyOverflow(v, overflow = 0) {
    if (overflow === 0) return Math.max(0.0, Math.min(1.0, v)); // Clip
    if (overflow === 1) return 1.0 / (1.0 + Math.exp(-4.0 * (v - 0.5))); // Soft Clamp
    return v - Math.floor(v); // Wrap
}
