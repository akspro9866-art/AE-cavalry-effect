// CC RepeTile pure JavaScript mathematical reference model
// Used for offline verification, invariant testing, and visual equivalency assertions.

export function mapRepeTileUV(u, v, mode = 1) {
    let mu = u;
    let mv = v;

    if (mode === 0) {
        // Repeat
        mu = u - Math.floor(u);
        mv = v - Math.floor(v);
    } else if (mode === 1) {
        // Flip / Ping-Pong
        const ku = Math.floor(u);
        const kv = Math.floor(v);
        const fu = u - ku;
        const fv = v - kv;
        const mx = Math.abs(ku) % 2;
        const my = Math.abs(kv) % 2;
        mu = (mx === 0) ? fu : (1.0 - fu);
        mv = (my === 0) ? fv : (1.0 - fv);
    } else if (mode === 2) {
        // Checker
        const ku = Math.floor(u);
        const kv = Math.floor(v);
        const fu = u - ku;
        const fv = v - kv;
        const chk = Math.abs(ku + kv) % 2;
        mu = (chk === 0) ? fu : (1.0 - fu);
        mv = (chk === 0) ? fv : (1.0 - fv);
    } else if (mode === 3) {
        // Brick
        const ky = Math.floor(v);
        const shift = (Math.abs(ky) % 2 === 0) ? 0.0 : 0.5;
        const su = u + shift;
        mu = su - Math.floor(su);
        mv = v - Math.floor(v);
    } else if (mode === 4) {
        // Fold
        mu = Math.abs(((u * 0.5 + 0.5) % 1.0 + 1.0) % 1.0 * 2.0 - 1.0);
        mv = Math.abs(((v * 0.5 + 0.5) % 1.0 + 1.0) % 1.0 * 2.0 - 1.0);
    } else {
        // Unfold
        mu = 1.0 - Math.abs(((u * 0.5) % 1.0 + 1.0) % 1.0 * 2.0 - 1.0);
        mv = 1.0 - Math.abs(((v * 0.5) % 1.0 + 1.0) % 1.0 * 2.0 - 1.0);
    }

    return { u: mu, v: mv };
}

export function computePadding(expandLeft, expandRight, expandUp, expandDown) {
    const padX = Math.max(0, Math.max(expandLeft || 0, expandRight || 0));
    const padY = Math.max(0, Math.max(expandUp || 0, expandDown || 0));
    return { x: Math.min(padX, 10000), y: Math.min(padY, 10000) };
}
