// Deep Glow pure JavaScript mathematical reference model
// Used for offline verification, invariant testing, and visual equivalency assertions.

export function rgb2s([r, g, b]) {
    let maxVal = Math.max(r, g, b);
    let minVal = Math.min(r, g, b);
    if (maxVal > 1.0) {
        r /= maxVal;
        g /= maxVal;
        b /= maxVal;
        minVal /= maxVal;
        maxVal = 1.0;
    }
    const delta = maxVal - minVal;
    return maxVal > 1e-5 ? delta / maxVal : 0.0;
}

export function smoothstep(edge0, edge1, x) {
    const t = Math.max(0.0, Math.min(1.0, (x - edge0) / (edge1 - edge0 || 1e-6)));
    return t * t * (3.0 - 2.0 * t);
}

export function prefilterColor([r, g, b], thresh = 0.0, smoothKnee = 0.1, satBias = 0.0) {
    let c = [Math.max(0, r), Math.max(0, g), Math.max(0, b)];
    if (thresh > 0.0) {
        const copy = [...c];
        const low = Math.max(0.0, thresh - smoothKnee);
        const high = thresh + smoothKnee + 1e-5;
        const knee = [
            smoothstep(low, high, c[0]),
            smoothstep(low, high, c[1]),
            smoothstep(low, high, c[2])
        ];
        c = [c[0] * knee[0], c[1] * knee[1], c[2] * knee[2]];

        if (Math.abs(satBias) > 0.001) {
            let s = rgb2s(copy);
            if (satBias < 0.0) s = 1.0 - s;
            const satKnee = smoothstep(low, high, s);
            const copyScaled = copy.map(v => v * satKnee);
            const w = Math.abs(satBias);
            c = [
                c[0] * (1 - w) + copyScaled[0] * w,
                c[1] * (1 - w) + copyScaled[1] * w,
                c[2] * (1 - w) + copyScaled[2] * w
            ];
        }
    }
    return c;
}

export function computeGlowWeight(r, radius, glowMode = 0) {
    const radBase = Math.max(radius, 1.0);
    if (glowMode === 0) {
        // Mode 0: Inverse Square (Deep Glow signature)
        const coreRadius = radBase * 0.15 + 2.0;
        const s = r / coreRadius;
        return 1.0 / (1.0 + s * s);
    } else if (glowMode === 1) {
        // Mode 1: Smooth Gaussian
        const sigma = radBase * 0.4 + 1.0;
        const s = r / sigma;
        return Math.exp(-0.5 * s * s);
    } else {
        // Mode 2: Core Concentrated (cubic power)
        const s = r / (radBase * 0.1 + 1.5);
        return 1.0 / (1.0 + s * s * s);
    }
}

export function computeAnamorphicOffset(r, phi, aspectRatio = 1.0, aspectAngleDeg = 0.0) {
    const rad = aspectAngleDeg * (Math.PI / 180.0);
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);
    const aspect = Math.max(0.01, aspectRatio);
    const invAspect = 1.0 / aspect;

    const lx = r * Math.cos(phi) * aspect;
    const ly = r * Math.sin(phi) * invAspect;

    return {
        x: lx * cosA - ly * sinA,
        y: lx * sinA + ly * cosA
    };
}

export function overlayBlend(a, b) {
    return a.map((val, i) => {
        const bg = val;
        const fg = b[i];
        return bg < 0.5 ? 2.0 * bg * fg : 1.0 - 2.0 * (1.0 - bg) * (1.0 - fg);
    });
}

export function softLightBlend(a, b) {
    return a.map((val, i) => {
        const fg = b[i];
        return (1.0 - 2.0 * fg) * (val * val) + 2.0 * fg * val;
    });
}

export function applyTint(glow, tintMode = 0, tintBlendMode = 1, colA = [1, 0.78, 0.47], colB = [0.2, 0.59, 1.0], strength = 1.0) {
    if (tintMode < 0.5 || strength <= 0.001) return [...glow];

    let tintA;
    if (tintBlendMode === 0) { // Multiply
        tintA = [glow[0] * colA[0], glow[1] * colA[1], glow[2] * colA[2]];
    } else if (tintBlendMode === 1) { // Overlay
        const a = glow.map(v => Math.pow(Math.max(0, v), 0.45));
        const b = colA.map(v => Math.pow(Math.max(0, v), 0.45));
        const blended = overlayBlend(a, b);
        tintA = blended.map(v => Math.pow(Math.max(0, v), 2.22));
    } else { // Soft Light
        const clamped = glow.map(v => Math.min(1.0, v));
        tintA = softLightBlend(clamped, colA);
    }

    if (tintMode === 2) { // Duocolor
        let tintB;
        if (tintBlendMode === 0) {
            tintB = [glow[0] * colB[0], glow[1] * colB[1], glow[2] * colB[2]];
        } else if (tintBlendMode === 1) {
            const a = glow.map(v => Math.pow(Math.max(0, v), 0.45));
            const b = colB.map(v => Math.pow(Math.max(0, v), 0.45));
            const blended = overlayBlend(a, b);
            tintB = blended.map(v => Math.pow(Math.max(0, v), 2.2));
        } else {
            const clamped = glow.map(v => Math.min(1.0, v));
            tintB = softLightBlend(clamped, colB);
        }

        const inner = tintA;
        const outer = tintB;
        // Inner highlight vs outer falloff blend
        tintA = tintA.map((_, i) => {
            const t = Math.max(0.0, Math.min(1.0, glow[i]));
            return outer[i] * (1.0 - t) + inner[i] * t;
        });
    }

    return glow.map((v, i) => Math.max(0, v * (1.0 - strength) + tintA[i] * strength));
}

export function applyToneMap(x, mode = 0) {
    if (mode === 0) return [...x];

    if (mode === 1) { // ACES Filmic
        const a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
        return x.map(v => Math.max(0, Math.min(1, (v * (a * v + b)) / (v * (c * v + d) + e))));
    }

    if (mode === 2) { // Filmic (HBD)
        return x.map(v => {
            const X = Math.max(0, v - 0.004);
            const res = (X * (6.2 * X + 0.5)) / (X * (6.2 * X + 1.7) + 0.06);
            return Math.pow(res, 2.2);
        });
    }

    if (mode === 3) { // Reinhard
        return x.map(v => v / (v + 1.0));
    }

    if (mode === 4) { // Reinhard 2
        const L_white_sq = 16.0;
        return x.map(v => (v * (1.0 + v / L_white_sq)) / (1.0 + v));
    }

    // mode === 5: Clamp Chroma
    const l = 0.2126 * x[0] + 0.7152 * x[1] + 0.0722 * x[2];
    const desat = Math.max(0, Math.min(1, l));
    return x.map(v => Math.max(0, v * (1 - desat) + l * desat));
}

export function compositeGlow(baseRgb, baseAlpha, glowRgb, blendMode = 0, sourceOpacity = 1.0) {
    const base = baseRgb.map(v => v * sourceOpacity);
    const alpha = baseAlpha * sourceOpacity;

    if (blendMode === 0) { // Add
        const finalRgb = [base[0] + glowRgb[0], base[1] + glowRgb[1], base[2] + glowRgb[2]];
        const glowLum = Math.max(...glowRgb);
        const finalAlpha = Math.max(0, Math.min(1, alpha + glowLum));
        return { rgb: finalRgb, alpha: finalAlpha };
    } else if (blendMode === 1) { // Screen
        const finalRgb = base.map((v, i) => {
            const b = Math.max(0, Math.min(1, v));
            const g = Math.max(0, Math.min(1, glowRgb[i]));
            return 1.0 - (1.0 - b) * (1.0 - g);
        });
        const glowLum = Math.max(...glowRgb);
        const finalAlpha = Math.max(0, Math.min(1, alpha + glowLum));
        return { rgb: finalRgb, alpha: finalAlpha };
    } else { // Glow Only
        const glowLum = Math.max(...glowRgb);
        return { rgb: [...glowRgb], alpha: Math.max(0, Math.min(1, glowLum)) };
    }
}
