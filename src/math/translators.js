/**
 * translators.js — standalone translation math from AE/CSS/Lottie conventions
 * into Cavalry keyframe handle parameters.
 *
 * Extracted piecewise as pure math only (no engine code, zero dependencies):
 *   - Cubic-bezier -> Cavalry tangent solver (Shifty / GSAP easing math with a
 *     Newton-Raphson + bisection x(u)=t solver).
 *   - 2D grid & axis stagger calculator (Anime.js `stagger()` distance math).
 *   - Lightweight 2.5D projection math (Three.js `src/math/` conventions:
 *     Vector3 / Euler / Quaternion / Matrix4 with makeRotationFromEuler,
 *     makePerspective, multiplyMatrices, projectPoint) plus
 *     `projectAE3DLayerToCavalry2D` for AE 3D layers -> 2D Cavalry position /
 *     scale / rotation / 4-point Corner Pin.
 *
 * This file intentionally knows nothing about Cavalry APIs — it emits plain
 * data that callers write through `api.set` / `api.modifyKeyframeTangent`.
 */

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

/* ------------------------------------------------------------------ *
 * 1. Cubic-bezier -> Cavalry tangent solver
 * ------------------------------------------------------------------ */

/**
 * Evaluate a CSS/AE cubic-bezier easing at normalized time `t`.
 * Control points P0=(0,0), P1=(x1,y1), P2=(x2,y2), P3=(1,1); x is time and y
 * is progress. Solves x(u)=t for the curve parameter u with Newton-Raphson
 * (12 iterations), falling back to 40-step bisection when the x-derivative
 * degenerates. Returns y(u).
 */
export function evaluateCubicBezier(x1, y1, x2, y2, t) {
    const ax = 1 - 3 * x2 + 3 * x1;
    const bx = 3 * x2 - 6 * x1;
    const cx = 3 * x1;
    const ay = 1 - 3 * y2 + 3 * y1;
    const by = 3 * y2 - 6 * y1;
    const cy = 3 * y1;
    const xAt = (u) => ((ax * u + bx) * u + cx) * u;
    const yAt = (u) => ((ay * u + by) * u + cy) * u;
    const dxAt = (u) => (3 * ax * u + 2 * bx) * u + cx;
    const u0 = Math.max(0, Math.min(1, t));
    if (u0 === 0 || u0 === 1) return yAt(u0);
    let u = u0;
    for (let i = 0; i < 12; i++) {
        const err = xAt(u) - u0;
        if (Math.abs(err) < 1e-7) return yAt(u);
        const d = dxAt(u);
        if (Math.abs(d) < 1e-7) break;
        u = Math.max(0, Math.min(1, u - err / d));
    }
    let lo = 0;
    let hi = 1;
    u = u0;
    for (let i = 0; i < 40; i++) {
        const err = xAt(u) - u0;
        if (Math.abs(err) < 1e-7) break;
        if (err < 0) lo = u;
        else hi = u;
        u = (lo + hi) / 2;
    }
    return yAt(u);
}

/**
 * Convert a normalized `cubic-bezier(x1, y1, x2, y2)` easing over one
 * keyframe segment into Cavalry keyframe handle parameters.
 *
 * Cavalry models each tangent handle by an ANGLE (degrees in the
 * frames-vs-value plane, 0deg = along +frames, 90deg = up in value) and a
 * WEIGHT (handle length as a fraction of the segment's diagonal length
 * hypot(durationFrames, |valueDelta|)). The CSS control points map exactly:
 *
 *   out-handle (start key "right" side) = (x1 * durationFrames, y1 * valueDelta)
 *   in-handle  (end key  "left"  side)  = ((x2 - 1) * durationFrames, (y2 - 1) * valueDelta)
 *
 * @returns {{
 *   rightAngle: number, rightWeight: number,
 *   leftAngle: number, leftWeight: number,
 *   rightHandle: {dx: number, dy: number}, leftHandle: {dx: number, dy: number},
 *   segmentLength: number,
 *   keyframes: Array<{angle, weight, side: 'right'|'left'}>
 * }}
 *   `keyframes` is ordered for direct application: start key gets the right
 *   handle, end key gets the left handle.
 */
export function cubicBezierToCavalryTangents(x1, y1, x2, y2, durationFrames, valueDelta, opts = {}) {
    const dur = Number(durationFrames);
    const dv = Number(valueDelta);
    if (!isFinite(dur) || dur <= 0) throw new Error('cubicBezierToCavalryTangents: durationFrames must be > 0');
    if (!isFinite(dv)) throw new Error('cubicBezierToCavalryTangents: valueDelta must be finite');
    const maxWeight = opts.allowOvershootWeights ? 4 : 1;
    // CSS control-point handle offsets in (frames, value) space.
    const rightDx = x1 * dur;
    const rightDy = y1 * dv;
    const leftDx = (x2 - 1) * dur;
    const leftDy = (y2 - 1) * dv;
    const segLen = Math.hypot(dur, dv);
    const weightOf = (dx, dy) => {
        if (segLen < 1e-12) return 0;
        const w = Math.hypot(dx, dy) / segLen;
        return Math.round(Math.max(0.0001, Math.min(maxWeight, w)) * 10000) / 10000;
    };
    // Degenerate zero-delta segments collapse to a time-only handle.
    const angleOf = (dx, dy) => {
        if (Math.abs(dx) < 1e-12 && Math.abs(dy) < 1e-12) return 0;
        return normalizeAngleDeg(Math.atan2(dy, dx) * RAD2DEG);
    };
    const rightAngle = angleOf(rightDx, rightDy);
    const leftAngle = angleOf(leftDx, leftDy);
    const rightWeight = weightOf(rightDx, rightDy);
    const leftWeight = weightOf(leftDx, leftDy);
    const r4 = (v) => Math.round(v * 10000) / 10000;
    return {
        rightAngle: r4(rightAngle),
        rightWeight,
        leftAngle: r4(leftAngle),
        leftWeight,
        rightHandle: { dx: r4(rightDx), dy: r4(rightDy) },
        leftHandle: { dx: r4(leftDx), dy: r4(leftDy) },
        segmentLength: r4(segLen),
        keyframes: [
            { side: 'right', angle: r4(rightAngle), weight: rightWeight },
            { side: 'left', angle: r4(leftAngle), weight: leftWeight },
        ],
    };
}

/** Normalize an angle into [-180, 180). */
function normalizeAngleDeg(deg) {
    let a = deg % 360;
    if (a >= 180) a -= 360;
    if (a < -180) a += 360;
    return a;
}

/**
 * Sample a non-standard easing curve into `[frame, value]` keyframe pairs
 * (used when a Cavalry build cannot accept weighted tangents and the caller
 * must bake). Newton-Raphson sampling via `evaluateCubicBezier`.
 */
export function sampleCubicBezierToKeyframes(x1, y1, x2, y2, durationFrames, valueDelta, startFrame = 0, steps = 24) {
    const total = Math.max(2, Math.round(steps));
    const frames = [];
    for (let i = 0; i <= total; i++) {
        const u = i / total;
        const y = evaluateCubicBezier(x1, y1, x2, y2, u);
        frames.push([
            Math.round(startFrame + u * durationFrames),
            Math.round((Number(valueDelta) * y) * 10000) / 10000,
        ]);
    }
    return frames;
}

/* ------------------------------------------------------------------ *
 * 2. 2D grid & axis stagger calculator (Anime.js math)
 * ------------------------------------------------------------------ */

function mulberry32(seed) {
    let a = (typeof seed === 'number' ? seed | 0 : String(seed).split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0)) || 123456789;
    return function () {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const STAGGER_EASINGS = {
    linear: (t) => t,
    inQuad: (t) => t * t,
    outQuad: (t) => 1 - (1 - t) * (1 - t),
    inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    outElastic: (t) => {
        const c4 = (2 * Math.PI) / 3;
        if (t === 0 || t === 1) return t;
        return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },
};

/**
 * Replicate Anime.js `stagger()` distance math and produce the equivalent
 * Cavalry Duplicator + Falloff parameter mapping.
 *
 * @param {number|number[]} val
 *   Scalar: frames of delay per unit distance. Range `[from, to]`: delays
 *   interpolate from `from` at the origin to `to` at the farthest item.
 * @param {object} opts
 *   grid: `[cols, rows]` for 2D layout (items fill row-major: index -> col =
 *   i % cols, row = floor(i / cols)). Omitted = flat index stagger.
 *   axis: `'x'` | `'y'` to use single-axis distance instead of Euclidean.
 *   from: `'first'` | `'last'` | `'center'` | numeric item index (origin).
 *   easing: name from STAGGER_EASINGS applied to normalized distance.
 *   totalItems: required count.
 *   start: base delay added to every offset (default 0).
 *   seed: deterministic seed for the (deterministic) 'random' origin.
 * @returns {{
 *   offsets: number[], distances: number[], origin: {index, col, row},
 *   maxDistance: number, stagger: number,
 *   cavalry: { duplicator: object, falloff: object }
 * }}
 */
export function computeStagger(val, opts = {}) {
    const total = Math.round(opts.totalItems);
    if (!isFinite(total) || total < 1) throw new Error('computeStagger: totalItems must be >= 1');
    const isRange = Array.isArray(val);
    const v1 = isRange ? Number(val[0]) : Number(val);
    const v2 = isRange ? Number(val[1]) : 0;
    if (!isFinite(v1) || (isRange && !isFinite(v2))) throw new Error('computeStagger: val must be finite number or [from, to]');
    const start = Number(opts.start) || 0;
    const grid = Array.isArray(opts.grid) && opts.grid.length === 2 ? opts.grid : null;
    const cols = grid ? Math.max(1, Math.round(opts.grid[0])) : 1;
    const rows = grid ? Math.max(1, Math.round(opts.grid[1])) : 1;
    const axis = opts.axis === 'x' || opts.axis === 'y' ? opts.axis : null;
    const easingName = typeof opts.easing === 'string' ? opts.easing : null;
    const easing = easingName ? STAGGER_EASINGS[easingName] : null;
    if (easingName && !easing) {
        throw new Error(`computeStagger: unknown easing "${easingName}" (have ${Object.keys(STAGGER_EASINGS).join(', ')})`);
    }
    const rng = opts.from === 'random' ? mulberry32(opts.seed == null ? 0x9e3779b9 : opts.seed) : null;

    // Origin resolution (Anime.js semantics).
    let originIndex = 0;
    if (typeof opts.from === 'number') originIndex = Math.max(0, Math.min(total - 1, Math.round(opts.from)));
    else if (opts.from === 'last') originIndex = total - 1;
    else if (opts.from === 'center') originIndex = (total - 1) / 2;
    else if (opts.from === 'random') originIndex = Math.floor(rng() * total);
    else if (opts.from !== 'first' && opts.from != null) throw new Error(`computeStagger: unknown from "${opts.from}"`);
    const originCol = grid ? (opts.from === 'center' ? (cols - 1) / 2 : typeof opts.from === 'number' ? originIndex % cols : opts.from === 'last' ? cols - 1 : 0) : 0;
    const originRow = grid ? (opts.from === 'center' ? (rows - 1) / 2 : typeof opts.from === 'number' ? Math.floor(originIndex / cols) : opts.from === 'last' ? rows - 1 : 0) : 0;

    // Distances (Anime.js: Euclidean across [col, row], or single-axis).
    const distances = [];
    for (let i = 0; i < total; i++) {
        if (grid) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const dx = col - originCol;
            const dy = row - originRow;
            distances.push(axis === 'x' ? dx : axis === 'y' ? dy : Math.hypot(dx, dy));
        } else {
            distances.push(i - originIndex);
        }
    }
    const absDistances = distances.map((d) => Math.abs(d));
    const maxDistance = Math.max(...absDistances, 0);

    // Delay per item. Scalar: distance * val (eased over normalized distance
    // when easing is set). Range: interpolate v1 -> v2 across normalized
    // distance with optional easing shaping the progress.
    const offsets = absDistances.map((d, i) => {
        const normalized = maxDistance > 0 ? d / maxDistance : 0;
        if (isRange) {
            const progress = easing ? easing(normalized) : normalized;
            return Math.round((start + v1 + (v2 - v1) * progress) * 1000) / 1000;
        }
        if (easing) {
            return Math.round((start + easing(normalized) * v1 * maxDistance) * 1000) / 1000;
        }
        return Math.round((start + d * v1) * 1000) / 1000;
    });

    // Cavalry mapping: a Duplicator (linear/grid distribution) driven by an
    // index Falloff whose origin/radius mirror the stagger geometry. Numeric
    // values are Cavalry-ready; attr names follow Cavalry 2.8 UI terms.
    const falloffType = axis === 'x' ? 'linear-x' : axis === 'y' ? 'linear-y' : grid ? 'radial' : 'linear-index';
    const cavalry = {
        duplicator: {
            distribution: grid ? 'grid' : 'linear',
            copies: total,
            columns: grid ? cols : undefined,
            rows: grid ? rows : undefined,
            timeOffset: isRange ? v2 : Math.round(v1 * maxDistance * 1000) / 1000,
            timeOffsetUnit: 'frames',
        },
        falloff: {
            type: falloffType,
            origin: { index: originIndex, col: originCol, row: originRow },
            radius: grid ? Math.round(maxDistance * 1000) / 1000 : Math.max(1, total - 1),
            easing: easingName || 'linear',
            mapAttribute: 'timeOffset',
            startValue: isRange ? v1 : 0,
            endValue: isRange ? v2 : Math.round(v1 * maxDistance * 1000) / 1000,
        },
    };
    return {
        offsets,
        distances,
        origin: { index: originIndex, col: originCol, row: originRow },
        maxDistance: Math.round(maxDistance * 1000) / 1000,
        stagger: isRange ? [v1, v2] : v1,
        cavalry,
    };
}

/* ------------------------------------------------------------------ *
 * 3. Lightweight 2.5D math (Three.js conventions)
 * ------------------------------------------------------------------ */

export class Vector3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }
    copy(v) {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
        return this;
    }
    clone() {
        return new Vector3(this.x, this.y, this.z);
    }
    add(v) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        return this;
    }
    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;
        return this;
    }
    multiplyScalar(s) {
        this.x *= s;
        this.y *= s;
        this.z *= s;
        return this;
    }
    dot(v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }
    cross(v) {
        const ax = this.x, ay = this.y, az = this.z;
        this.x = ay * v.z - az * v.y;
        this.y = az * v.x - ax * v.z;
        this.z = ax * v.y - ay * v.x;
        return this;
    }
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }
    normalize() {
        const len = this.length();
        if (len > 1e-12) this.multiplyScalar(1 / len);
        return this;
    }
    applyMatrix4(m) {
        const e = m.elements;
        const { x, y, z } = this;
        const w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]);
        this.x = (e[0] * x + e[4] * y + e[8] * z + e[12]) * w;
        this.y = (e[1] * x + e[5] * y + e[9] * z + e[13]) * w;
        this.z = (e[2] * x + e[6] * y + e[10] * z + e[14]) * w;
        return this;
    }
    applyQuaternion(q) {
        // Three.js quaternion-vector multiplication (t = q * v * q^-1).
        const { x, y, z } = this;
        const qx = q.x, qy = q.y, qz = q.z, qw = q.w;
        const ix = qw * x + qy * z - qz * y;
        const iy = qw * y + qz * x - qx * z;
        const iz = qw * z + qx * y - qy * x;
        const iw = -qx * x - qy * y - qz * z;
        this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
        this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
        this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
        return this;
    }
}

export class Euler {
    /** Angles in RADIANS (use `Euler.fromDegrees` for AE-style input). */
    constructor(x = 0, y = 0, z = 0, order = 'XYZ') {
        this.x = x;
        this.y = y;
        this.z = z;
        this.order = order;
    }
    static fromDegrees(dx, dy, dz, order = 'XYZ') {
        return new Euler(dx * DEG2RAD, dy * DEG2RAD, dz * DEG2RAD, order);
    }
    set(x, y, z, order = this.order) {
        this.x = x;
        this.y = y;
        this.z = z;
        if (order) this.order = order;
        return this;
    }
}

export class Quaternion {
    constructor(x = 0, y = 0, z = 0, w = 1) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }
    /** Exact Three.js `setFromEuler` branch table for all six orders. */
    setFromEuler(euler) {
        const x = euler.x, y = euler.y, z = euler.z;
        const cos = Math.cos;
        const sin = Math.sin;
        const cX = cos(x / 2), cY = cos(y / 2), cZ = cos(z / 2);
        const sX = sin(x / 2), sY = sin(y / 2), sZ = sin(z / 2);
        switch (euler.order) {
            case 'XYZ':
                this.x = sX * cY * cZ + cX * sY * sZ;
                this.y = cX * sY * cZ - sX * cY * sZ;
                this.z = cX * cY * sZ + sX * sY * cZ;
                this.w = cX * cY * cZ - sX * sY * sZ;
                break;
            case 'XZY':
                this.x = sX * cY * cZ - cX * sY * sZ;
                this.y = cX * sY * cZ - sX * cY * sZ;
                this.z = cX * cY * sZ + sX * sY * cZ;
                this.w = cX * cY * cZ + sX * sY * sZ;
                break;
            case 'YXZ':
                this.x = sX * cY * cZ + cX * sY * sZ;
                this.y = cX * sY * cZ - sX * cY * sZ;
                this.z = cX * cY * sZ - sX * sY * cZ;
                this.w = cX * cY * cZ + sX * sY * sZ;
                break;
            case 'YZX':
                this.x = sX * cY * cZ + cX * sY * sZ;
                this.y = cX * sY * cZ + sX * cY * sZ;
                this.z = cX * cY * sZ - sX * sY * cZ;
                this.w = cX * cY * cZ - sX * sY * sZ;
                break;
            case 'ZXY':
                this.x = sX * cY * cZ - cX * sY * sZ;
                this.y = cX * sY * cZ + sX * cY * sZ;
                this.z = cX * cY * sZ + sX * sY * cZ;
                this.w = cX * cY * cZ - sX * sY * sZ;
                break;
            case 'ZYX':
                this.x = sX * cY * cZ - cX * sY * sZ;
                this.y = cX * sY * cZ + sX * cY * sZ;
                this.z = cX * cY * sZ - sX * sY * cZ;
                this.w = cX * cY * cZ + sX * sY * sZ;
                break;
            default:
                throw new Error(`Euler order "${euler.order}" not supported`);
        }
        return this;
    }
    clone() {
        return new Quaternion(this.x, this.y, this.z, this.w);
    }
    multiply(q) {
        const ax = this.x, ay = this.y, az = this.z, aw = this.w;
        const bx = q.x, by = q.y, bz = q.z, bw = q.w;
        this.x = ax * bw + aw * bx + ay * bz - az * by;
        this.y = ay * bw + aw * by + az * bx - ax * bz;
        this.z = az * bw + aw * bz + ax * by - ay * bx;
        this.w = aw * bw - ax * bx - ay * by - az * bz;
        return this;
    }
}

export class Matrix4 {
    constructor() {
        // Column-major, identical to Three.js.
        this.elements = [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ];
    }
    identity() {
        const e = this.elements;
        e[0] = 1; e[1] = 0; e[2] = 0; e[3] = 0;
        e[4] = 0; e[5] = 1; e[6] = 0; e[7] = 0;
        e[8] = 0; e[9] = 0; e[10] = 1; e[11] = 0;
        e[12] = 0; e[13] = 0; e[14] = 0; e[15] = 1;
        return this;
    }
    clone() {
        const m = new Matrix4();
        m.elements = this.elements.slice();
        return m;
    }
    /** Exact Three.js `makeRotationFromEuler` (all six orders, r160 table). */
    makeRotationFromEuler(euler) {
        const e = this.elements;
        const x = euler.x, y = euler.y, z = euler.z;
        const a = Math.cos(x), b = Math.sin(x);
        const c = Math.cos(y), d = Math.sin(y);
        const g = Math.cos(z), h = Math.sin(z);
        switch (euler.order) {
            case 'XYZ': {
                const ae = a * g, af = a * h, be = b * g, bf = b * h;
                e[0] = c * g;
                e[4] = -c * h;
                e[8] = d;
                e[1] = af + be * d;
                e[5] = ae - bf * d;
                e[9] = -b * c;
                e[2] = bf - ae * d;
                e[6] = be + af * d;
                e[10] = a * c;
                break;
            }
            case 'YXZ': {
                const ce = c * g, cf = c * h, de = d * g, df = d * h;
                e[0] = ce + df * b;
                e[4] = de * b - cf;
                e[8] = a * d;
                e[1] = a * h;
                e[5] = a * g;
                e[9] = -b;
                e[2] = cf * b - de;
                e[6] = df + ce * b;
                e[10] = a * c;
                break;
            }
            case 'ZXY': {
                const ce = c * g, cf = c * h, de = d * g, df = d * h;
                e[0] = ce - df * b;
                e[4] = -a * h;
                e[8] = de + cf * b;
                e[1] = cf + de * b;
                e[5] = a * g;
                e[9] = df - ce * b;
                e[2] = -a * d;
                e[6] = b;
                e[10] = a * c;
                break;
            }
            case 'ZYX': {
                const ae = a * g, af = a * h, be = b * g, bf = b * h;
                e[0] = c * g;
                e[4] = be * d - af;
                e[8] = ae * d + bf;
                e[1] = c * h;
                e[5] = bf * d + ae;
                e[9] = af * d - be;
                e[2] = -d;
                e[6] = b * c;
                e[10] = a * c;
                break;
            }
            case 'YZX': {
                const ac = a * c, ad = a * d, bc = b * c, bd = b * d;
                e[0] = c * g;
                e[4] = bd - ac * h;
                e[8] = bc * h + ad;
                e[1] = h;
                e[5] = a * g;
                e[9] = -b * g;
                e[2] = -d * g;
                e[6] = ad * h + bc;
                e[10] = ac - bd * h;
                break;
            }
            case 'XZY': {
                const ac = a * c, ad = a * d, bc = b * c, bd = b * d;
                e[0] = c * g;
                e[4] = -h;
                e[8] = d * g;
                e[1] = ac * h + bd;
                e[5] = a * g;
                e[9] = ad * h - bc;
                e[2] = bc * h - ad;
                e[6] = b * g;
                e[10] = bd * h + ac;
                break;
            }
            default:
                throw new Error(`Euler order "${euler.order}" not supported`);
        }
        // bottom row + last column (rotation-only matrix)
        e[3] = 0; e[7] = 0; e[11] = 0;
        e[12] = 0; e[13] = 0; e[14] = 0; e[15] = 1;
        return this;
    }
    /**
     * Perspective projection matrix. Three.js r150+ signature:
     * makePerspective(left, right, top, bottom, near, far).
     */
    makePerspective(left, right, top, bottom, near, far) {
        const e = this.elements;
        const x = (2 * near) / (right - left);
        const y = (2 * near) / (top - bottom);
        const a = (right + left) / (right - left);
        const b = (top + bottom) / (top - bottom);
        const c = -(far + near) / (far - near);
        const d = (-2 * far * near) / (far - near);
        e[0] = x; e[1] = 0; e[2] = 0; e[3] = 0;
        e[4] = 0; e[5] = y; e[6] = 0; e[7] = 0;
        e[8] = a; e[9] = b; e[10] = c; e[11] = -1;
        e[12] = 0; e[13] = 0; e[14] = d; e[15] = 0;
        return this;
    }
    /** Convenience: perspective from vertical FOV (degrees) + aspect. */
    perspectiveFOV(fovDeg, aspect, near, far) {
        const tan = Math.tan((fovDeg * DEG2RAD) / 2);
        const top = near * tan;
        const bottom = -top;
        const right = top * aspect;
        const left = -right;
        return this.makePerspective(left, right, top, bottom, near, far);
    }
    /** Three.js `multiplyMatrices(a, b)` — this = a * b. */
    multiplyMatrices(a, b) {
        const ae = a.elements;
        const be = b.elements;
        const te = this.elements;
        const a11 = ae[0], a12 = ae[4], a13 = ae[8], a14 = ae[12];
        const a21 = ae[1], a22 = ae[5], a23 = ae[9], a24 = ae[13];
        const a31 = ae[2], a32 = ae[6], a33 = ae[10], a34 = ae[14];
        const a41 = ae[3], a42 = ae[7], a43 = ae[11], a44 = ae[15];
        const b11 = be[0], b12 = be[4], b13 = be[8], b14 = be[12];
        const b21 = be[1], b22 = be[5], b23 = be[9], b24 = be[13];
        const b31 = be[2], b32 = be[6], b33 = be[10], b34 = be[14];
        const b41 = be[3], b42 = be[7], b43 = be[11], b44 = be[15];
        te[0] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
        te[4] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
        te[8] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
        te[12] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;
        te[1] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
        te[5] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
        te[9] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
        te[13] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;
        te[2] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
        te[6] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
        te[10] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
        te[14] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;
        te[3] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
        te[7] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
        te[11] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
        te[15] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;
        return this;
    }
    /** Compose position + quaternion + scale (Three.js compose()). */
    compose(position, quaternion, scale) {
        const e = this.elements;
        const x = quaternion.x, y = quaternion.y, z = quaternion.z, w = quaternion.w;
        const x2 = x + x, y2 = y + y, z2 = z + z;
        const xx = x * x2, xy = x * y2, xz = x * z2;
        const yy = y * y2, yz = y * z2, zz = z * z2;
        const wx = w * x2, wy = w * y2, wz = w * z2;
        const sx = scale.x, sy = scale.y, sz = scale.z;
        e[0] = (1 - (yy + zz)) * sx;
        e[1] = (xy + wz) * sx;
        e[2] = (xz - wy) * sx;
        e[3] = 0;
        e[4] = (xy - wz) * sy;
        e[5] = (1 - (xx + zz)) * sy;
        e[6] = (yz + wx) * sy;
        e[7] = 0;
        e[8] = (xz + wy) * sz;
        e[9] = (yz - wx) * sz;
        e[10] = (1 - (xx + yy)) * sz;
        e[11] = 0;
        e[12] = position.x;
        e[13] = position.y;
        e[14] = position.z;
        e[15] = 1;
        return this;
    }
}

const V_UP = () => new Vector3(0, 1, 0);

/**
 * Pinhole projection of a camera-space point to pixel coordinates.
 * `focalLength` is in pixels (AE zoom semantics). Screen y is flipped
 * (comp space is y-down); points behind the camera (z <= 0) clamp with
 * `visible: false` instead of mirroring.
 */
export function projectPoint(vec3, focalLength, compWidth, compHeight) {
    const f = Number(focalLength);
    if (!isFinite(f) || f <= 0) throw new Error('projectPoint: focalLength must be > 0');
    const w = Number(compWidth), h = Number(compHeight);
    if (!isFinite(w) || !isFinite(h) || w <= 0 || h <= 0) throw new Error('projectPoint: compWidth/compHeight must be > 0');
    const z = vec3.z;
    if (z <= 1e-6) {
        return {
            x: w / 2 + vec3.x * f,
            y: h / 2 - vec3.y * f,
            z,
            visible: false,
        };
    }
    return {
        x: w / 2 + (vec3.x * f) / z,
        y: h / 2 - (vec3.y * f) / z,
        z,
        visible: true,
    };
}

const r4 = (v) => Math.round(v * 10000) / 10000;

function lookAtBasis(cameraPos, poi) {
    const forward = new Vector3(poi[0] - cameraPos[0], poi[1] - cameraPos[1], poi[2] - cameraPos[2]).normalize();
    if (forward.length() < 1e-9) forward.set(0, 0, 1);
    // Right-handed camera basis: right = forward x worldUp, then up = right x forward.
    let right = forward.clone().cross(V_UP());
    if (right.length() < 1e-6) {
        // Camera looking straight up/down: pick a fallback up axis.
        right = forward.clone().cross(new Vector3(1, 0, 0));
    }
    right.normalize();
    const up = right.clone().cross(forward).normalize();
    return { forward, right, up };
}

function toCameraSpace(worldPoint, cameraPos, basis) {
    const d = new Vector3(worldPoint[0] - cameraPos[0], worldPoint[1] - cameraPos[1], worldPoint[2] - cameraPos[2]);
    return {
        x: d.dot(basis.right),
        y: d.dot(basis.up),
        z: d.dot(basis.forward),
    };
}

/**
 * Convert a 3D After Effects layer transform + comp camera into 2D Cavalry
 * attributes: `position`, `scale`, `rotation` (in-plane roll) and a 4-point
 * Corner Pin quad.
 *
 * @param {object} aeTransform3D
 *   { position: [x,y,z], anchorPoint?: [x,y,z], orientation?: [rx,ry,rz] (deg),
 *     rotationX?: deg, rotationY?: deg, rotationZ?: deg, scale?: [sx,sy,sz] (%) }
 * @param {object} compCamera
 *   { position: [x,y,z], pointOfInterest: [x,y,z], compWidth, compHeight,
 *     zoom?: px | fovDeg?: deg } — zoom and fovDeg are interchangeable:
 *     focalLengthPx = zoom || (compHeight / 2) / tan(fovDeg / 2).
 * @returns {{
 *   position: {x, y}, scale: {x, y}, rotation: number,
 *   cornerPin: [{x, y}, {x, y}, {x, y}, {x, y}],
 *   focalLengthPx: number, distanceToCamera: number, allVisible: boolean
 * }}
 *   Corner Pin order: topLeft, topRight, bottomRight, bottomLeft.
 */
export function projectAE3DLayerToCavalry2D(aeTransform3D, compCamera) {
    if (!aeTransform3D || !Array.isArray(aeTransform3D.position) || aeTransform3D.position.length < 3) {
        throw new Error('projectAE3DLayerToCavalry2D: aeTransform3D.position must be [x, y, z]');
    }
    const camPos = compCamera.position;
    const poi = compCamera.pointOfInterest || [camPos[0], camPos[1], camPos[2] - 1];
    const { compWidth, compHeight } = compCamera;
    const focal = compCamera.zoom != null
        ? Number(compCamera.zoom)
        : (compCamera.fovDeg != null
            ? compHeight / 2 / Math.tan((compCamera.fovDeg * DEG2RAD) / 2)
            : compHeight / 2 / Math.tan((50 * DEG2RAD) / 2)); // AE default 50deg FOV
    const basis = lookAtBasis(camPos, poi);

    // AE combines Orientation with the per-axis X/Y/Z rotations additively
    // (the common AE expression approximation) in XYZ order.
    const o = aeTransform3D.orientation || [0, 0, 0];
    const rx = (o[0] || 0) + (aeTransform3D.rotationX || 0);
    const ry = (o[1] || 0) + (aeTransform3D.rotationY || 0);
    const rz = (o[2] || 0) + (aeTransform3D.rotationZ || 0);
    const q = new Quaternion().setFromEuler(Euler.fromDegrees(rx, ry, rz, 'XYZ'));

    const scalePct = aeTransform3D.scale || [100, 100, 100];
    const sx = scalePct[0] / 100;
    const sy = scalePct[1] / 100;
    const anchor = aeTransform3D.anchorPoint || [0, 0, 0];
    const pos = aeTransform3D.position;
    const width = Number(compCamera.layerWidth || aeTransform3D.layerWidth || 0);
    const height = Number(compCamera.layerHeight || aeTransform3D.layerHeight || 0);
    if (!(width > 0) || !(height > 0)) {
        throw new Error('projectAE3DLayerToCavalry2D: layer size required (compCamera.layerWidth/layerHeight or aeTransform3D.layerWidth/layerHeight)');
    }

    // Layer-space corners relative to the anchor point, scaled, rotated,
    // translated to world, then projected.
    const cornersLocal = [
        [-width / 2, height / 2],   // topLeft (layer space y-up)
        [width / 2, height / 2],    // topRight
        [width / 2, -height / 2],   // bottomRight
        [-width / 2, -height / 2],  // bottomLeft
    ];
    const projected = cornersLocal.map(([lx, ly]) => {
        const ax = (lx - anchor[0]) * sx;
        const ay = (ly - anchor[1]) * sy;
        const local = new Vector3(ax, ay, 0).applyQuaternion(q);
        const world = [pos[0] + local.x, pos[1] + local.y, pos[2] + local.z];
        const cs = toCameraSpace(world, camPos, basis);
        const p = projectPoint(new Vector3(cs.x, cs.y, cs.z), focal, compWidth, compHeight);
        return p;
    });

    const centerCs = toCameraSpace(pos, camPos, basis);
    const center = projectPoint(new Vector3(centerCs.x, centerCs.y, centerCs.z), focal, compWidth, compHeight);
    const dist = centerCs.z;

    // In-plane roll: screen-space direction of the layer's local +x axis.
    const xAxisLocal = new Vector3(1, 0, 0).applyQuaternion(q);
    const axisWorld = [pos[0] + xAxisLocal.x * sx * width / 2, pos[1] + xAxisLocal.y * sx * width / 2, pos[2] + xAxisLocal.z * sx * width / 2];
    const axisCs = toCameraSpace(axisWorld, camPos, basis);
    const axisProj = projectPoint(new Vector3(axisCs.x, axisCs.y, axisCs.z), focal, compWidth, compHeight);
    const roll = Math.atan2(axisProj.y - center.y, axisProj.x - center.x) * RAD2DEG;

    // Scale: projected width relative to the un-projected layer width at the
    // center depth (average of top and bottom edge lengths for perspective).
    const topW = Math.hypot(projected[1].x - projected[0].x, projected[1].y - projected[0].y);
    const botW = Math.hypot(projected[2].x - projected[3].x, projected[2].y - projected[3].y);
    const projWidth = (topW + botW) / 2;
    const scale2D = width > 0 ? projWidth / width : 1;

    return {
        position: { x: r4(center.x), y: r4(center.y) },
        scale: { x: r4(scale2D), y: r4(scale2D) },
        rotation: r4(normalizeAngleDeg(roll)),
        cornerPin: projected.map((p) => ({ x: r4(p.x), y: r4(p.y) })),
        focalLengthPx: r4(focal),
        distanceToCamera: r4(dist),
        allVisible: projected.every((p) => p.visible) && center.visible,
    };
}
