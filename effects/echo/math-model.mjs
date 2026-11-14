/**
 * Pure Mathematical Model & Invariant Suite:
 * Adobe After Effects "Echo" (ADBE Echo) -> Cavalry 2.8+
 */

export function blendEcho(accum, current, op) {
    // accum and current are { r, g, b, a }
    if (op === 0) {
        // Add
        return {
            r: accum.r + current.r,
            g: accum.g + current.g,
            b: accum.b + current.b,
            a: accum.a + current.a
        };
    } else if (op === 1) {
        // Maximum
        return {
            r: Math.max(accum.r, current.r),
            g: Math.max(accum.g, current.g),
            b: Math.max(accum.b, current.b),
            a: Math.max(accum.a, current.a)
        };
    } else if (op === 2) {
        // Minimum
        return {
            r: Math.min(accum.r, current.r),
            g: Math.min(accum.g, current.g),
            b: Math.min(accum.b, current.b),
            a: Math.min(accum.a, current.a)
        };
    } else if (op === 3) {
        // Screen: 1 - (1 - a)(1 - b) = a + b - a*b
        return {
            r: accum.r + current.r - accum.r * current.r,
            g: accum.g + current.g - accum.g * current.g,
            b: accum.b + current.b - accum.b * current.b,
            a: accum.a + current.a - accum.a * current.a
        };
    } else if (op === 4) {
        // Composite / Over: current over accum
        const invA = 1.0 - current.a;
        return {
            r: current.r + accum.r * invA,
            g: current.g + accum.g * invA,
            b: current.b + accum.b * invA,
            a: current.a + accum.a * invA
        };
    } else {
        // Behind: accum over current
        const invA = 1.0 - accum.a;
        return {
            r: accum.r + current.r * invA,
            g: accum.g + current.g * invA,
            b: accum.b + current.b * invA,
            a: accum.a + current.a * invA
        };
    }
}

export function evaluateEchoSeries(samples, params) {
    const {
        numberOfEchoes = 3,
        startingIntensity = 1.0,
        decay = 0.5,
        echoOperator = 0
    } = params;

    if (!samples || samples.length === 0) {
        return { r: 0, g: 0, b: 0, a: 0 };
    }

    let weight = startingIntensity;
    let accum = {
        r: samples[0].r * weight,
        g: samples[0].g * weight,
        b: samples[0].b * weight,
        a: samples[0].a * weight
    };

    const count = Math.min(samples.length, Math.floor(numberOfEchoes));
    for (let i = 1; i < count; i++) {
        weight *= decay;
        const current = {
            r: samples[i].r * weight,
            g: samples[i].g * weight,
            b: samples[i].b * weight,
            a: samples[i].a * weight
        };
        accum = blendEcho(accum, current, Math.floor(echoOperator));
    }

    return accum;
}

export function calculatePadding() {
    return { x: 0, y: 0 };
}
