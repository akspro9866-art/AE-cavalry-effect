/**
 * Pure JavaScript Mathematical Reconstruction of Adobe After Effects Turbulent Displace.
 *
 * Uses the exact same float32-compatible 4D Simplex noise (32 symmetric Ken Perlin 4D gradients),
 * analytical spatial gradients, toroidal periodic evolution, fractional fBm Complexity (1..10),
 * 9 displacement field modes, edge pinning, and 4-tap RGSS evaluation model used in
 * `turbulent-displace.sksl` and `turbulent-displace.deformer.js`.
 *
 * Note: This module is an independent mathematical reconstruction (no Adobe proprietary source).
 */

export const DISPLACEMENT_MODES = Object.freeze({
    turbulent: 0,
    bulge: 1,
    twist: 2,
    turbulentSmoother: 3,
    bulgeSmoother: 4,
    twistSmoother: 5,
    horizontal: 6,
    vertical: 7,
    cross: 8,
});

export const DISPLACEMENT_ALIASES = Object.freeze({
    '0': 0,
    turbulent: 0,
    '1': 1,
    bulge: 1,
    '2': 2,
    twist: 2,
    '3': 3,
    'turbulent smoother': 3,
    turbulentsmoother: 3,
    '4': 4,
    'bulge smoother': 4,
    bulgesmoother: 4,
    '5': 5,
    'twist smoother': 5,
    twistsmoother: 5,
    '6': 6,
    horizontal: 6,
    'horizontal displacement': 6,
    '7': 7,
    vertical: 7,
    'vertical displacement': 7,
    '8': 8,
    cross: 8,
    'cross displacement': 8,
});

export const PINNING_MODES = Object.freeze({
    none: 0,
    all: 1,
    horizontal: 2,
    vertical: 3,
    left: 4,
    right: 5,
    top: 6,
    bottom: 7,
});

export const PINNING_ALIASES = Object.freeze({
    '0': 0,
    none: 0,
    '1': 1,
    all: 1,
    'pin all': 1,
    'all locked': 1,
    '2': 2,
    horizontal: 2,
    'pin horizontal': 2,
    'horizontal only': 2,
    'pin horizontal only': 2,
    '3': 3,
    vertical: 3,
    'pin vertical': 3,
    'vertical only': 3,
    'pin vertical only': 3,
    '4': 4,
    left: 4,
    'pin left': 4,
    '5': 5,
    right: 5,
    'pin right': 5,
    '6': 6,
    top: 6,
    'pin top': 6,
    '7': 7,
    bottom: 7,
    'pin bottom': 7,
});

export const DEFAULT_PARAMS = Object.freeze({
    displacement: 0,
    amount: 50,
    size: 100,
    offsetX: 0,
    offsetY: 0,
    complexity: 1.0,
    evolution: 0,
    cycleEvolution: 0,
    cycleRevolutions: 1,
    randomSeed: 0,
    pinning: 0,
    antialiasing: 0,
    resizeLayer: 1,
});

export function resolveDisplacementMode(value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return Math.max(0, Math.min(8, Math.round(value)));
    }
    const key = String(value ?? 'turbulent').trim().toLowerCase().replace(/[_-]+/g, ' ');
    return DISPLACEMENT_ALIASES[key] ?? 0;
}

export function resolvePinningMode(value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return Math.max(0, Math.min(7, Math.round(value)));
    }
    const key = String(value ?? 'none').trim().toLowerCase().replace(/[_-]+/g, ' ');
    return PINNING_ALIASES[key] ?? 0;
}

export function resolveAntialiasingMode(value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value >= 0.5 ? 1 : 0;
    }
    const key = String(value ?? 'low').trim().toLowerCase();
    return key === 'high' || key === '1' || key === 'true' ? 1 : 0;
}

export function resolveBoolFloat(value) {
    if (typeof value === 'boolean') return value ? 1 : 0;
    if (typeof value === 'number' && Number.isFinite(value)) return value >= 0.5 ? 1 : 0;
    const key = String(value ?? '0').trim().toLowerCase();
    return key === 'true' || key === 'on' || key === '1' ? 1 : 0;
}

export function normalizeParams(input = {}) {
    return {
        displacement: resolveDisplacementMode(input.displacement),
        amount: Number.isFinite(Number(input.amount)) ? Number(input.amount) : DEFAULT_PARAMS.amount,
        size: Math.max(0.001, Number.isFinite(Number(input.size)) ? Number(input.size) : DEFAULT_PARAMS.size),
        offsetX: Number.isFinite(Number(input.offsetX)) ? Number(input.offsetX) : DEFAULT_PARAMS.offsetX,
        offsetY: Number.isFinite(Number(input.offsetY)) ? Number(input.offsetY) : DEFAULT_PARAMS.offsetY,
        complexity: Math.max(1.0, Math.min(10.0, Number.isFinite(Number(input.complexity)) ? Number(input.complexity) : DEFAULT_PARAMS.complexity)),
        evolution: Number.isFinite(Number(input.evolution)) ? Number(input.evolution) : DEFAULT_PARAMS.evolution,
        cycleEvolution: resolveBoolFloat(input.cycleEvolution),
        cycleRevolutions: Math.max(1.0, Math.round(Number.isFinite(Number(input.cycleRevolutions)) ? Number(input.cycleRevolutions) : DEFAULT_PARAMS.cycleRevolutions)),
        randomSeed: Number.isFinite(Number(input.randomSeed)) ? Number(input.randomSeed) : DEFAULT_PARAMS.randomSeed,
        pinning: resolvePinningMode(input.pinning),
        antialiasing: resolveAntialiasingMode(input.antialiasing),
        resizeLayer: input.resizeLayer === undefined ? DEFAULT_PARAMS.resizeLayer : resolveBoolFloat(input.resizeLayer),
    };
}

function mod289(x) {
    return x - Math.floor(x / 289.0) * 289.0;
}

function permuteScalar(x) {
    const wrapped = mod289(x);
    return mod289((wrapped * 34.0 + 1.0) * wrapped);
}

function step(edge, x) {
    return x >= edge ? 1.0 : 0.0;
}

function fract(x) {
    return x - Math.floor(x);
}

function clamp(x, lo, hi) {
    return Math.max(lo, Math.min(hi, x));
}

function smoothstep(edge0, edge1, x) {
    const t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
    return t * t * (3.0 - 2.0 * t);
}

function grad4Vector(j) {
    const idx = Math.floor(j - Math.floor(j * 0.03125) * 32.0);
    const s0 = 1.0 - 2.0 * step(0.25, fract(idx * 0.5));
    const s1 = 1.0 - 2.0 * step(0.25, fract(Math.floor(idx * 0.5) * 0.5));
    const s2 = 1.0 - 2.0 * step(0.25, fract(Math.floor(idx * 0.25) * 0.5));
    const z = Math.floor(idx * 0.125);
    if (z < 0.5) return [0.0, s0, s1, s2];
    if (z < 1.5) return [s0, 0.0, s1, s2];
    if (z < 2.5) return [s0, s1, 0.0, s2];
    return [s0, s1, s2, 0.0];
}

const F4 = 0.309016994374947451;
const G4 = 0.1381966011250105;
const NOISE4_GAIN = 27.0;

/**
 * 4D Simplex Noise with exact analytical derivatives wrt (x, y).
 * Returns [value, dN/dx, dN/dy] scaled cleanly around [-1, 1].
 */
export function snoise4WithGrad(vx, vy, vz, vw) {
    const s = (vx + vy + vz + vw) * F4;
    const ix = Math.floor(vx + s);
    const iy = Math.floor(vy + s);
    const iz = Math.floor(vz + s);
    const iw = Math.floor(vw + s);

    const t0 = (ix + iy + iz + iw) * G4;
    const x0x = vx - ix + t0;
    const x0y = vy - iy + t0;
    const x0z = vz - iz + t0;
    const x0w = vw - iw + t0;

    // Simplex rank sort in 4D
    const isXx = step(x0y, x0x);
    const isXy = step(x0z, x0x);
    const isXz = step(x0w, x0x);
    const isYZx = step(x0z, x0y);
    const isYZy = step(x0w, x0y);
    const isYZz = step(x0w, x0z);

    let r0 = isXx + isXy + isXz;
    let r1 = (1.0 - isXx) + isYZx + isYZy;
    let r2 = (1.0 - isXy) + (1.0 - isYZx) + isYZz;
    let r3 = (1.0 - isXz) + (1.0 - isYZy) + (1.0 - isYZz);

    const i1x = clamp(r0 - 2.0, 0.0, 1.0);
    const i1y = clamp(r1 - 2.0, 0.0, 1.0);
    const i1z = clamp(r2 - 2.0, 0.0, 1.0);
    const i1w = clamp(r3 - 2.0, 0.0, 1.0);

    const i2x = clamp(r0 - 1.0, 0.0, 1.0);
    const i2y = clamp(r1 - 1.0, 0.0, 1.0);
    const i2z = clamp(r2 - 1.0, 0.0, 1.0);
    const i2w = clamp(r3 - 1.0, 0.0, 1.0);

    const i3x = clamp(r0, 0.0, 1.0);
    const i3y = clamp(r1, 0.0, 1.0);
    const i3z = clamp(r2, 0.0, 1.0);
    const i3w = clamp(r3, 0.0, 1.0);

    const x1x = x0x - i1x + G4, x1y = x0y - i1y + G4, x1z = x0z - i1z + G4, x1w = x0w - i1w + G4;
    const x2x = x0x - i2x + 2.0 * G4, x2y = x0y - i2y + 2.0 * G4, x2z = x0z - i2z + 2.0 * G4, x2w = x0w - i2w + 2.0 * G4;
    const x3x = x0x - i3x + 3.0 * G4, x3y = x0y - i3y + 3.0 * G4, x3z = x0z - i3z + 3.0 * G4, x3w = x0w - i3w + 3.0 * G4;
    const x4x = x0x - 1.0 + 4.0 * G4, x4y = x0y - 1.0 + 4.0 * G4, x4z = x0z - 1.0 + 4.0 * G4, x4w = x0w - 1.0 + 4.0 * G4;

    const mix = mod289(ix), miy = mod289(iy), miz = mod289(iz), miw = mod289(iw);

    const j0 = permuteScalar(permuteScalar(permuteScalar(permuteScalar(miw) + miz) + miy) + mix);
    const j1 = permuteScalar(permuteScalar(permuteScalar(permuteScalar(miw + i1w) + miz + i1z) + miy + i1y) + mix + i1x);
    const j2 = permuteScalar(permuteScalar(permuteScalar(permuteScalar(miw + i2w) + miz + i2z) + miy + i2y) + mix + i2x);
    const j3 = permuteScalar(permuteScalar(permuteScalar(permuteScalar(miw + i3w) + miz + i3z) + miy + i3y) + mix + i3x);
    const j4 = permuteScalar(permuteScalar(permuteScalar(permuteScalar(miw + 1.0) + miz + 1.0) + miy + 1.0) + mix + 1.0);

    const corners = [
        [x0x, x0y, x0z, x0w, j0],
        [x1x, x1y, x1z, x1w, j1],
        [x2x, x2y, x2z, x2w, j2],
        [x3x, x3y, x3z, x3w, j3],
        [x4x, x4y, x4z, x4w, j4],
    ];

    let val = 0.0;
    let dnx = 0.0;
    let dny = 0.0;

    for (let k = 0; k < 5; k++) {
        const [dx, dy, dz, dw, jc] = corners[k];
        const r2Corner = dx * dx + dy * dy + dz * dz + dw * dw;
        const m = Math.max(0.6 - r2Corner, 0.0);
        if (m > 0.0) {
            const m2 = m * m;
            const m3 = m2 * m;
            const m4 = m2 * m2;
            const g = grad4Vector(jc);
            const gDotX = g[0] * dx + g[1] * dy + g[2] * dz + g[3] * dw;
            val += m4 * gDotX;
            dnx += -8.0 * m3 * dx * gDotX + m4 * g[0];
            dny += -8.0 * m3 * dy * gDotX + m4 * g[1];
        }
    }

    return [val * NOISE4_GAIN, dnx * NOISE4_GAIN, dny * NOISE4_GAIN];
}

export function computePinWeight(uvX, uvY, resX, resY, amount, size, pinningMode) {
    const mode = Math.round(pinningMode);
    if (mode <= 0) return 1.0;

    const safeResX = Math.max(resX, 1.0);
    const safeResY = Math.max(resY, 1.0);
    const marginX = clamp(Math.max(Math.abs(amount) * 1.15, size * 0.35, 16.0) / safeResX, 0.03, 0.48);
    const marginY = clamp(Math.max(Math.abs(amount) * 1.15, size * 0.35, 16.0) / safeResY, 0.03, 0.48);

    const pinLeft = smoothstep(0.0, marginX, uvX);
    const pinRight = smoothstep(0.0, marginX, 1.0 - uvX);
    // Cavalry `skslFilter` & scene coordinates are Y-up: uvY=0 is bottom, uvY=1 is top
    const pinBottom = smoothstep(0.0, marginY, uvY);
    const pinTop = smoothstep(0.0, marginY, 1.0 - uvY);

    if (mode === 1) return pinLeft * pinRight * pinTop * pinBottom; // All
    if (mode === 2) return pinLeft * pinRight; // Horizontal Only
    if (mode === 3) return pinTop * pinBottom; // Vertical Only
    if (mode === 4) return pinLeft;
    if (mode === 5) return pinRight;
    if (mode === 6) return pinTop;
    if (mode === 7) return pinBottom;
    return 1.0;
}

/**
 * Evaluate reconstructed AE Turbulent Displace displacement vector (dx, dy) in pixels
 * at centered Y-up coordinate `(px, py)` for layer bounds `[resX, resY]`
 * (`px in [-resX/2, +resX/2]`, `py in [-resY/2, +resY/2]`, matching Cavalry `skslFilter`).
 */
export function evaluateDisplacement(px, py, resX, resY, rawParams = {}) {
    const p = normalizeParams(rawParams);
    if (p.amount === 0.0) return [0.0, 0.0];

    const isSmoother = p.displacement >= 3 && p.displacement <= 5;
    const baseMode = isSmoother ? p.displacement - 3 : p.displacement;

    const safeSize = Math.max(p.size, 0.001) * (isSmoother ? 1.38 : 1.0);
    const cx = p.offsetX;
    const cy = p.offsetY;
    const ux = (px - cx) / safeSize;
    const uy = (py - cy) / safeSize;

    // Hash seed safely into compact [0, 97) domain
    const seedFrac = fract(p.randomSeed * 0.1031) * 47.0 + fract(p.randomSeed * 0.0379) * 31.0;
    const revs = p.evolution / 360.0;

    let zCoord;
    let wCoord;
    if (p.cycleEvolution >= 0.5) {
        const cycles = Math.max(p.cycleRevolutions, 1.0);
        const theta = Math.PI * 2.0 * (revs / cycles);
        const radius = 0.75 * cycles;
        zCoord = seedFrac + radius * Math.cos(theta);
        wCoord = seedFrac * 0.61803398875 + radius * Math.sin(theta);
    } else {
        zCoord = seedFrac + revs * 0.75;
        wCoord = seedFrac * 0.61803398875 + 3.14159265;
    }

    const gain = isSmoother ? 0.38 : 0.5;
    const derivGain = isSmoother ? 0.30 : 0.42;

    let sumAx = 0.0, gradAxX = 0.0, gradAxY = 0.0;
    let sumB = 0.0;
    let amp = 1.0;
    let dAmp = 1.0;
    let freq = 1.0;

    for (let oct = 0; oct < 10; oct++) {
        const w = clamp(p.complexity - oct, 0.0, 1.0);
        if (w <= 0.0) break;

        const oz = zCoord + oct * 7.13;
        const ow = wCoord + oct * 11.71;

        const nA = snoise4WithGrad(ux * freq, uy * freq, oz, ow);
        sumAx += w * amp * nA[0];
        gradAxX += w * dAmp * nA[1];
        gradAxY += w * dAmp * nA[2];

        if (baseMode === 0 || baseMode === 7 || baseMode === 8) {
            const nB = snoise4WithGrad(ux * freq + 19.31, uy * freq + 43.17, oz + 23.7, ow + 5.9);
            sumB += w * amp * nB[0];
        }

        amp *= gain;
        dAmp *= derivGain;
        freq *= 2.0;
    }

    // Complexity energy stabilization matching visual macro displacement
    const compScale = 1.0 / (1.0 + 0.22 * Math.log2(p.complexity));
    // Calibrated so Amount = 50 yields ~30px peak displacement in default Turbulent mode
    const strength = p.amount * 0.62 * compScale;

    let rawDx = 0.0;
    let rawDy = 0.0;
    if (baseMode === 0) {
        // Turbulent: 2 decorrelated spatial turbulence channels
        rawDx = sumAx;
        rawDy = sumB;
    } else if (baseMode === 1) {
        // Bulge: push outward/inward along negative height gradient (-dN/dx, -dN/dy)
        rawDx = -gradAxX * 0.26;
        rawDy = -gradAxY * 0.26;
    } else if (baseMode === 2) {
        // Twist: divergence-free 2D curl (-dN/dy, dN/dx)
        rawDx = -gradAxY * 0.28;
        rawDy = gradAxX * 0.28;
    } else if (baseMode === 6) {
        // Horizontal Displacement only (AE option 6)
        rawDx = sumAx;
        rawDy = 0.0;
    } else if (baseMode === 7) {
        // Vertical Displacement only (AE option 7)
        rawDx = 0.0;
        rawDy = sumB;
    } else if (baseMode === 8) {
        // Cross Displacement: emphasize orthogonal wave ridges along H & V lattice axes
        const ax = Math.abs(sumAx);
        const ay = Math.abs(sumB);
        const wx = ax / (ax + ay + 0.08);
        const wy = ay / (ax + ay + 0.08);
        rawDx = sumAx * (0.45 + 0.85 * wx);
        rawDy = sumB * (0.45 + 0.85 * wy);
    }

    const pinW = computePinWeight(
        clamp((px / Math.max(resX, 1.0)) + 0.5, 0.0, 1.0),
        clamp((py / Math.max(resY, 1.0)) + 0.5, 0.0, 1.0),
        resX,
        resY,
        p.amount,
        p.size,
        p.pinning
    );

    const dx = rawDx * strength * pinW || 0.0;
    const dy = rawDy * strength * pinW || 0.0;
    return [dx, dy];
}
