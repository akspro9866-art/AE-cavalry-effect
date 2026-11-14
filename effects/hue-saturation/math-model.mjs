/**
 * Pure Mathematical Model & Invariant Suite:
 * Adobe After Effects "Hue/Saturation" (ADBE HUE SATURATION) -> Cavalry 2.8+
 */

export function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

export function fract(x) {
    return x - Math.floor(x);
}

export function rgbToHsl(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) * 0.5;
    const delta = max - min;

    if (delta <= 1e-5) {
        return [0.0, 0.0, l];
    }

    const s = l > 0.5 ? delta / (2.0 - max - min) : delta / (max + min);
    let h = 0.0;
    if (max === r) {
        h = (g - b) / delta + (g < b ? 6.0 : 0.0);
    } else if (max === g) {
        h = (b - r) / delta + 2.0;
    } else {
        h = (r - g) / delta + 4.0;
    }
    h /= 6.0;

    return [h, s, l];
}

function hue2rgb(p, q, t) {
    let tt = t;
    if (tt < 0.0) tt += 1.0;
    if (tt > 1.0) tt -= 1.0;
    if (tt < 1.0 / 6.0) return p + (q - p) * 6.0 * tt;
    if (tt < 1.0 / 2.0) return q;
    if (tt < 2.0 / 3.0) return p + (q - p) * (2.0 / 3.0 - tt) * 6.0;
    return p;
}

export function hslToRgb(h, s, l) {
    if (s <= 1e-5) {
        return [l, l, l];
    }

    const q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
    const p = 2.0 * l - q;

    return [
        hue2rgb(p, q, h + 1.0 / 3.0),
        hue2rgb(p, q, h),
        hue2rgb(p, q, h - 1.0 / 3.0)
    ];
}

export function applyHueSaturation(rgb, params = {}) {
    const masterHue = params.masterHue ?? 0.0;
    const masterSat = params.masterSaturation ?? 0.0;
    const masterLit = params.masterLightness ?? 0.0;
    const colorize = Boolean(params.colorize);
    const colHue = params.colorizeHue ?? 0.0;
    const colSat = params.colorizeSaturation ?? 50.0;
    const colLit = params.colorizeLightness ?? 0.0;

    let [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2]);

    if (colorize) {
        h = fract(colHue / 360.0);
        s = clamp(colSat / 100.0, 0.0, 1.0);
        const cl = colLit / 100.0;
        if (cl > 0.0) l = l + (1.0 - l) * cl;
        else if (cl < 0.0) l = l * (1.0 + cl);
    } else {
        h = fract(h + masterHue / 360.0 + 1.0);
        const sat = masterSat / 100.0;
        if (sat > 0.0) s = s + (1.0 - s) * sat;
        else if (sat < 0.0) s = s * (1.0 + sat);

        const lit = masterLit / 100.0;
        if (lit > 0.0) l = l + (1.0 - l) * lit;
        else if (lit < 0.0) l = l * (1.0 + lit);
    }

    s = clamp(s, 0.0, 1.0);
    l = clamp(l, 0.0, 1.0);

    const [outR, outG, outB] = hslToRgb(h, s, l);
    return [clamp(outR, 0.0, 1.0), clamp(outG, 0.0, 1.0), clamp(outB, 0.0, 1.0)];
}
