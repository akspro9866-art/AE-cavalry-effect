/**
 * Pure Mathematical Model & Invariant Suite:
 * Adobe After Effects "Color Balance" (ADBE Color Balance2) -> Cavalry 2.8+
 */

export function calcLuminance(rgb) {
    return 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
}

export function calculateTonalWeights(luminance) {
    const y = Math.max(0.0, Math.min(1.0, luminance));

    let ws = Math.max(0.0, Math.min(1.0, 1.0 - 2.0 * y));
    ws = ws * ws;

    let wm = Math.max(0.0, Math.min(1.0, 1.0 - Math.abs(2.0 * y - 1.0)));
    wm = wm * wm;

    let wh = Math.max(0.0, Math.min(1.0, 2.0 * y - 1.0));
    wh = wh * wh;

    const sumW = Math.max(ws + wm + wh, 1e-4);
    return {
        shadow: ws / sumW,
        midtone: wm / sumW,
        highlight: wh / sumW
    };
}

export function applyColorBalance(color, params) {
    const {
        shadowRed = 0.0, shadowGreen = 0.0, shadowBlue = 0.0,
        midtoneRed = 0.0, midtoneGreen = 0.0, midtoneBlue = 0.0,
        highlightRed = 0.0, highlightGreen = 0.0, highlightBlue = 0.0,
        preserveLuminosity = 1.0
    } = params;

    const rgb = { r: color.r, g: color.g, b: color.b };
    const yIn = calcLuminance(rgb);
    const weights = calculateTonalWeights(yIn);

    const deltaR = (weights.shadow * shadowRed + weights.midtone * midtoneRed + weights.highlight * highlightRed) * 0.01;
    const deltaG = (weights.shadow * shadowGreen + weights.midtone * midtoneGreen + weights.highlight * highlightGreen) * 0.01;
    const deltaB = (weights.shadow * shadowBlue + weights.midtone * midtoneBlue + weights.highlight * highlightBlue) * 0.01;

    let r = Math.max(0.0, Math.min(1.0, rgb.r + deltaR));
    let g = Math.max(0.0, Math.min(1.0, rgb.g + deltaG));
    let b = Math.max(0.0, Math.min(1.0, rgb.b + deltaB));

    if (preserveLuminosity > 0.5) {
        const yOut = calcLuminance({ r, g, b });
        const diff = yIn - yOut;
        r = Math.max(0.0, Math.min(1.0, r + diff));
        g = Math.max(0.0, Math.min(1.0, g + diff));
        b = Math.max(0.0, Math.min(1.0, b + diff));
    }

    return { r, g, b, a: color.a };
}

export function calculatePadding() {
    return { x: 0, y: 0 };
}
