/**
 * gsap-eases.mjs — GSAP core easing equations ported to pure functions.
 *
 * Adopted piecewise from the GSAP project (https://gsap.com, greensock/GSAP):
 * only the easing MATH is ported here — no tweening engine, no dependency.
 * Values match GSAP exactly (see test/gsap-eases.test.mjs for reference
 * assertions cross-checked against gsap/Ease.js behavior).
 *
 * Purpose in this library: drive Cavalry keyframes with authentic GSAP feel.
 * Sample a curve with sampleEase()/buildEasedKeyframes() and write the values
 * to a keyframed attribute through cavalry-mcp's cavalry_run_script. This file
 * intentionally knows nothing about Cavalry APIs — it is pure math.
 *
 * Naming follows GSAP: "<family>.<mode>" with families power1..power4 (plus
 * "none" = power0), sine, expo, circ, back, elastic, bounce and steps(n).
 */

const HALF_PI = Math.PI / 2;

function powerIn(n) {
    return (x) => Math.pow(x, n);
}
function powerOut(n) {
    return (x) => 1 - Math.pow(1 - x, n);
}
function powerInOut(n) {
    return (x) => (x < 0.5 ? Math.pow(2 * x, n) / 2 : 1 - Math.pow(2 * (1 - x), n) / 2);
}

const BACK_C1 = 1.70158; // GSAP default overshoot
const BACK_C3 = BACK_C1 + 1;

const ELASTIC_C4 = (2 * Math.PI) / 3;
const ELASTIC_C5 = (2 * Math.PI) / 4.5;

function bounceOut(x) {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (x < 1 / d1) return n1 * x * x;
    if (x < 2 / d1) { x -= 1.5 / d1; return n1 * x * x + 0.75; }
    if (x < 2.5 / d1) { x -= 2.25 / d1; return n1 * x * x + 0.9375; }
    x -= 2.625 / d1;
    return n1 * x * x + 0.984375;
}

const baseOut = {
    none: (x) => x,
    sine: (x) => Math.sin(x * HALF_PI),
    expo: (x) => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x)),
    circ: (x) => Math.sqrt(1 - Math.pow(x - 1, 2)),
    back: (x) => 1 + BACK_C3 * Math.pow(x - 1, 3) + BACK_C1 * Math.pow(x - 1, 2),
    elastic: (x) => (x === 0 || x === 1 ? x : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * ELASTIC_C4) + 1),
    bounce: bounceOut,
};

const baseIn = {
    none: (x) => x,
    sine: (x) => 1 - Math.cos(x * HALF_PI),
    expo: (x) => (x === 0 ? 0 : Math.pow(2, 10 * x - 10)),
    circ: (x) => 1 - Math.sqrt(1 - x * x),
    back: (x) => BACK_C3 * x * x * x - BACK_C1 * x * x,
    elastic: (x) => (x === 0 ? 0 : -Math.pow(2, 10 * x - 10) * Math.sin((x * 10 - 10.75) * ELASTIC_C4)),
    bounce: (x) => 1 - bounceOut(1 - x),
};

const baseInOut = {
    none: (x) => x,
    sine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
    expo: (x) => (x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2),
    circ: (x) => (x < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2 : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2),
    back: (x) => (x < 0.5
        ? (Math.pow(2 * x, 2) * ((BACK_C3 + 1) * 2 * x - BACK_C1)) / 2
        : (Math.pow(2 * x - 2, 2) * ((BACK_C3 + 1) * (x * 2 - 2) + BACK_C1) + 2) / 2),
    elastic: (x) => (x === 0 ? 0 : x === 1 ? 1 : x < 0.5
        ? -(Math.pow(2, 20 * x - 10) * Math.sin((20 * x - 11.125) * ELASTIC_C5)) / 2
        : (Math.pow(2, -20 * x + 10) * Math.sin((20 * x - 11.125) * ELASTIC_C5)) / 2 + 1),
    bounce: (x) => (x < 0.5 ? (1 - bounceOut(1 - 2 * x)) / 2 : (1 + bounceOut(2 * x - 1)) / 2),
};

// power1..power4 expand to the quad/cubic/quart/quint families; "none" is linear.
const POWER_DEGREE = { none: 1, power1: 2, power2: 3, power3: 4, power4: 5 };

const eases = {};
for (const [family, degree] of Object.entries(POWER_DEGREE)) {
    eases[`${family}.in`] = powerIn(degree);
    eases[`${family}.out`] = powerOut(degree);
    eases[`${family}.inOut`] = powerInOut(degree);
}
for (const family of ['sine', 'expo', 'circ', 'back', 'elastic', 'bounce']) {
    eases[`${family}.in`] = baseIn[family];
    eases[`${family}.out`] = baseOut[family];
    eases[`${family}.inOut`] = baseInOut[family];
}

export const EASE_NAMES = Object.keys(eases).sort();

/**
 * Resolve an ease name ("power2.out", "back.inOut", "steps(5)") to a function.
 * Throws on unknown names — a silent fallback would corrupt curve data.
 */
export function getEase(name) {
    const trimmed = String(name).trim();
    const steps = trimmed.match(/^steps\((\d+)\)$/);
    if (steps) {
        const n = Number(steps[1]);
        if (!(n >= 1)) throw new Error(`steps() needs a count >= 1, got "${name}"`);
        return (x) => Math.floor(Math.min(Math.max(x, 0), 1) * n) / n;
    }
    const fn = eases[trimmed];
    if (!fn) {
        throw new Error(`Unknown ease "${name}". Known: ${EASE_NAMES.join(', ')}, steps(n).`);
    }
    return fn;
}

/** Sample one ease value at normalized time t (clamped to [0, 1]). */
export function sampleEase(name, t) {
    const x = Math.min(Math.max(Number(t) || 0, 0), 1);
    return getEase(name)(x);
}

/**
 * Build a value array for keyframing: frameCount samples interpolating
 * `from` -> `to` under the named ease. Sample i sits at t = i / (frameCount - 1)
 * so the first sample is exactly `from` and the last exactly `to` —
 * mirror that index convention when writing keyframes.
 */
export function buildEasedKeyframes(from, to, frameCount, easeName) {
    const n = Math.floor(Number(frameCount));
    if (!(n >= 2)) throw new Error(`frameCount must be >= 2, got ${frameCount}`);
    const fn = getEase(easeName);
    const values = new Array(n);
    for (let i = 0; i < n; i++) {
        values[i] = from + (to - from) * fn(i / (n - 1));
    }
    return values;
}
