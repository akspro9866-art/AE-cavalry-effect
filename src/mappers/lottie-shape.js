/**
 * lottie-shape.js — standalone Lottie/AE shape & modifier mapper for Cavalry.
 *
 * Extracted as pure data translation (no lottie-web code, zero dependencies):
 *   - `sh` (bezier shape: vertices `v`, in-tangents `i`, out-tangents `o`,
 *     closed `c`) -> Cavalry Editable Shape path data + SVG path string.
 *   - `tm` (Trim Paths: `s` start, `e` end, `o` offset, `m` mode) -> Cavalry
 *     Trim Path attributes.
 *   - `rp` (Repeater: `c` copies, `o` offset, `tr` transform) -> Cavalry
 *     Duplicator with Linear Distribution + Index-driven Falloff.
 *
 * Lottie tangents (`i`, `o`) are RELATIVE to their vertex; this mapper emits
 * both the relative form (Cavalry Editable Shape handles) and absolute form
 * (for SVG path emission), so downstream Cavalry writers can pick either.
 * Animated Lottie properties (`a: 1`) are surfaced as `animated: true` with
 * the raw keyframe data passed through untouched — this mapper maps SHAPE
 * structure, not time interpolation.
 */

const DEG2RAD = Math.PI / 180;

const r4 = (v) => Math.round(Number(v) * 10000) / 10000;

/**
 * Read one Lottie property value. Lottie values are `{ a, k, ix }` where `k`
 * is the static value (scalar or [x, y, ...]) or the keyframe array when
 * `a: 1`. Returns `{ value, animated, keyframes }`.
 */
export function lottieProp(prop) {
    if (prop == null) return { value: null, animated: false, keyframes: null };
    // Bare scalar/array values (Lottie exports normally wrap in {a, k}).
    if (typeof prop === 'number' || Array.isArray(prop) || typeof prop === 'string') {
        return { value: Array.isArray(prop) ? prop.slice() : prop, animated: false, keyframes: null };
    }
    const animated = prop.a === 1;
    const value = animated ? null : (Array.isArray(prop.k) ? prop.k.slice() : prop.k);
    return { value, animated, keyframes: animated ? prop.k : null };
}

/**
 * Convert Lottie bezier shape data (`sh`) to a Cavalry Editable Shape path.
 * @param {object} shapeItem Lottie shape item with `ty: 'sh'`.
 * @returns {{
 *   type: 'editableShape', closed: boolean, vertices: number,
 *   path: { points: Array<{v:{x,y}, i:{x,y}, o:{x,y}, inAbsolute:{x,y}, outAbsolute:{x,y}}> },
 *   svgPath: string,
 *   animated: boolean
 * }}
 */
export function mapLottieShapeToCavalry(shapeItem) {
    if (!shapeItem || shapeItem.ty !== 'sh') {
        throw new Error(`mapLottieShapeToCavalry: expected Lottie shape item with ty "sh" (got ${shapeItem && shapeItem.ty})`);
    }
    const ks = shapeItem.ks;
    if (!ks || !Array.isArray(ks.v)) throw new Error('mapLottieShapeToCavalry: shape.ks.v missing (animated shape data must be resolved by the caller)');
    const verts = ks.v;
    const inT = ks.i || [];
    const outT = ks.o || [];
    const closed = !!ks.c;
    const points = verts.map((v, idx) => {
        const relIn = inT[idx] || { x: 0, y: 0 };
        const relOut = outT[idx] || { x: 0, y: 0 };
        return {
            v: { x: r4(v[0]), y: r4(v[1]) },
            i: { x: r4(relIn[0]), y: r4(relIn[1]) },   // relative (Cavalry handle form)
            o: { x: r4(relOut[0]), y: r4(relOut[1]) }, // relative (Cavalry handle form)
            inAbsolute: { x: r4(v[0] + relIn[0]), y: r4(v[1] + relIn[1]) },
            outAbsolute: { x: r4(v[0] + relOut[0]), y: r4(v[1] + relOut[1]) },
        };
    });
    return {
        type: 'editableShape',
        closed,
        vertices: points.length,
        path: { points },
        svgPath: lottiePathToSvg(points, closed),
        animated: ks.a === 1,
    };
}

/**
 * Emit an SVG `d` string from mapped Lottie path points (all cubic segments
 * or lines when both tangents are zero).
 */
export function lottiePathToSvg(points, closed) {
    if (!points.length) return '';
    const fmt = (p) => `${p.x.toFixed(4)} ${p.y.toFixed(4)}`;
    let d = `M ${fmt(points[0].v)}`;
    const n = points.length;
    const segCount = closed ? n : n - 1;
    for (let s = 0; s < segCount; s++) {
        const cur = points[s];
        const next = points[(s + 1) % n];
        const isLine = (cur.o.x === 0 && cur.o.y === 0 && next.i.x === 0 && next.i.y === 0);
        if (isLine) d += ` L ${fmt(next.v)}`;
        else d += ` C ${fmt(cur.outAbsolute)} ${fmt(next.inAbsolute)} ${fmt(next.v)}`;
    }
    if (closed) d += ' Z';
    return d;
}

/**
 * Map Lottie Trim Paths (`tm`) to Cavalry Trim Path attributes.
 * Lottie: s/e are percentages 0-100, o is an offset in DEGREES (0-360), m:
 * 1 = simultaneously, 2 = individually.
 * @returns {{
 *   type: 'trimPath', start: number, end: number, offset: number,
 *   mode: 'simultaneously'|'individually',
 *   attrs: { trimStart, trimEnd, trimOffset, trimMode },
 *   animated: {start, end, offset}
 * }}
 */
export function mapLottieTrimPathToCavalry(trimItem) {
    if (!trimItem || trimItem.ty !== 'tm') {
        throw new Error(`mapLottieTrimPathToCavalry: expected Lottie item with ty "tm" (got ${trimItem && trimItem.ty})`);
    }
    const s = lottieProp(trimItem.s);
    const e = lottieProp(trimItem.e);
    const o = lottieProp(trimItem.o);
    const mode = trimItem.m === 2 ? 'individually' : 'simultaneously';
    const start = pct(s.value, 0);
    const end = pct(e.value, 100);
    const offset = deg(o.value, 0);
    return {
        type: 'trimPath',
        start,
        end,
        offset,
        mode,
        attrs: {
            trimStart: start,
            trimEnd: end,
            trimOffset: offset,
            trimMode: mode,
        },
        animated: { start: s.animated, end: e.animated, offset: o.animated },
        keyframes: {
            start: s.keyframes,
            end: e.keyframes,
            offset: o.keyframes,
        },
    };
}

/**
 * Map Lottie Repeater (`rp`) to a Cavalry Duplicator with Linear
 * Distribution + Index-driven Falloff.
 * Lottie `tr` (per-compound-copy transform): a anchorPoint, p position,
 * s scale (%), r rotation (deg), so startOpacity (%), eo endOpacity (%).
 * The compound offset `o` scales each successive copy's transform step.
 * @returns {{
 *   type: 'duplicator', copies: number, offset: number,
 *   transform: {anchorPoint, position, scale, rotation, startOpacity, endOpacity},
 *   cavalry: {
 *     duplicator: {distribution, copies, positionOffset, rotationOffset, scaleOffset, anchorPoint},
 *     falloff: {type: 'index', mapAttribute: 'opacity', startValue, endValue, easing: 'linear'}
 *   },
 *   animated: object
 * }}
 */
export function mapLottieRepeaterToCavalry(repeaterItem) {
    if (!repeaterItem || repeaterItem.ty !== 'rp') {
        throw new Error(`mapLottieRepeaterToCavalry: expected Lottie item with ty "rp" (got ${repeaterItem && repeaterItem.ty})`);
    }
    const copiesProp = lottieProp(repeaterItem.c);
    const offsetProp = lottieProp(repeaterItem.o);
    // Animated copies/offset surface in `animated`; static values (or the
    // final keyframe's end value) drive the Cavalry mapping.
    const finalValue = (prop, fallback) => {
        if (prop.value != null) return prop.value;
        const kfs = prop.keyframes;
        if (Array.isArray(kfs) && kfs.length && kfs[kfs.length - 1].s != null) {
            const end = kfs[kfs.length - 1].s;
            return Array.isArray(end) ? end[0] : end;
        }
        return fallback;
    };
    const copies = Math.max(1, Math.round(num(finalValue(copiesProp, 2), 2)));
    const offset = num(finalValue(offsetProp, 1), 1);
    const tr = repeaterItem.tr || {};
    const anchor = lottieProp(tr.a);
    const position = lottieProp(tr.p);
    const scale = lottieProp(tr.s);
    const rotation = lottieProp(tr.r);
    const startOpacity = lottieProp(tr.so);
    const endOpacity = lottieProp(tr.eo);
    const pos = position.value || [0, 0, 0];
    const scl = scale.value || [100, 100, 100];
    const rot = rotation.value == null ? 0 : rotation.value;
    const so = startOpacity.value == null ? 100 : startOpacity.value;
    const eo = endOpacity.value == null ? 100 : endOpacity.value;
    return {
        type: 'duplicator',
        copies,
        offset,
        transform: {
            anchorPoint: vec3(anchor.value, [0, 0, 0]),
            position: vec3(pos, [0, 0, 0]),
            scale: vec3(scl, [100, 100, 100]),
            rotation: r4(rot),
            startOpacity: r4(so),
            endOpacity: r4(eo),
        },
        cavalry: {
            duplicator: {
                distribution: 'linear',
                copies,
                // Per-copy step = compound transform scaled by the offset.
                positionOffset: { x: r4(pos[0] * offset), y: r4(pos[1] * offset), z: r4((pos[2] || 0) * offset) },
                rotationOffset: r4(rot * offset),
                scaleOffset: { x: r4(Math.pow(scl[0] / 100, offset) * 100), y: r4(Math.pow(scl[1] / 100, offset) * 100) },
                anchorPoint: vec3(anchor.value, [0, 0, 0]),
                distributionSpacing: { x: r4(pos[0] * offset), y: r4(pos[1] * offset) },
                distributionAngle: r4(rot * offset),
            },
            falloff: {
                // Index-driven opacity falloff: copy i opacity interpolates
                // linearly from startOpacity (copy 0) to endOpacity (last copy).
                type: 'index',
                mapAttribute: 'opacity',
                startValue: r4(so / 100),
                endValue: r4(eo / 100),
                easing: 'linear',
            },
        },
        animated: {
            copies: copiesProp.animated,
            offset: offsetProp.animated,
            position: position.animated,
            scale: scale.animated,
            rotation: rotation.animated,
            startOpacity: startOpacity.animated,
            endOpacity: endOpacity.animated,
        },
        keyframes: {
            position: position.keyframes,
            scale: scale.keyframes,
            rotation: rotation.keyframes,
            startOpacity: startOpacity.keyframes,
            endOpacity: endOpacity.keyframes,
        },
    };
}

/**
 * Map a full Lottie layer's shape tree (`shapes` array) into ordered Cavalry
 * mappings. Group contents (`ty: 'gr'`) are flattened in paint order.
 * @param {Array<object>} shapes Lottie layer `.shapes`
 * @returns {{ shapes: Array<object>, trimPaths: Array<object>, repeaters: Array<object>, svgPaths: string[] }}
 */
export function mapLottieShapeTreeToCavalry(shapes) {
    const result = { shapes: [], trimPaths: [], repeaters: [], svgPaths: [] };
    const walk = (items) => {
        for (const item of items || []) {
            switch (item.ty) {
                case 'sh':
                    result.shapes.push(mapLottieShapeToCavalry(item));
                    break;
                case 'tm':
                    result.trimPaths.push(mapLottieTrimPathToCavalry(item));
                    break;
                case 'rp':
                    result.repeaters.push(mapLottieRepeaterToCavalry(item));
                    break;
                case 'gr':
                    walk(item.it);
                    break;
                default:
                    // fill / stroke / transform / rect / ellipse / path-modifiers
                    // outside this mapper's scope are passed through untouched.
                    result.shapes.push({ type: 'passthrough', lottieType: item.ty, item });
                    break;
            }
        }
    };
    walk(shapes);
    for (const s of result.shapes) if (s.svgPath) result.svgPaths.push(s.svgPath);
    return result;
}

function num(v, fallback) {
    const n = Number(v);
    return isFinite(n) ? n : fallback;
}

function pct(v, fallback) {
    const n = num(v, fallback);
    return r4(Math.max(0, Math.min(100, n)));
}

function deg(v, fallback) {
    const n = num(v, fallback);
    // Normalize Lottie degree offset into [0, 360).
    let d = n % 360;
    if (d < 0) d += 360;
    return r4(d);
}

function vec3(v, fallback) {
    const a = Array.isArray(v) ? v : fallback;
    return { x: r4(a[0]), y: r4(a[1]), z: r4(a[2] == null ? fallback[2] : a[2]) };
}
