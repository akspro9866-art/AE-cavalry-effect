/**
 * Pure Mathematical Model & Invariant Suite:
 * Adobe After Effects "Wave Warp" (ADBE Wave Warp) -> Cavalry 2.8+
 */

export function evaluateWaveform(phi, wType) {
    let t = (phi / (2 * Math.PI)) % 1.0;
    if (t < 0) t += 1.0;

    if (wType === 1) {
        // Square
        return t < 0.5 ? 1.0 : -1.0;
    } else if (wType === 2) {
        // Triangle
        return 2.0 * Math.abs(2.0 * t - 1.0) - 1.0;
    } else if (wType === 3) {
        // Sawtooth
        return 2.0 * t - 1.0;
    } else if (wType === 4) {
        // Circles
        const x = 2.0 * t - 1.0;
        return Math.sqrt(Math.max(1.0 - x * x, 0.0)) * 2.0 - 1.0;
    } else if (wType === 5) {
        // Semicircles
        const x = t < 0.5 ? (4.0 * t - 1.0) : (4.0 * (t - 0.5) - 1.0);
        const circ = Math.sqrt(Math.max(1.0 - x * x, 0.0));
        return t < 0.5 ? circ : -circ;
    }

    // 0 = Sine
    return Math.sin(phi);
}

export function computePinFactor(coord, halfRes, pin) {
    if (pin === 0) return 1.0;
    const normX = Math.max(0.0, Math.min(1.0, (halfRes.x - Math.abs(coord.x)) / Math.max(halfRes.x, 1.0)));
    const normY = Math.max(0.0, Math.min(1.0, (halfRes.y - Math.abs(coord.y)) / Math.max(halfRes.y, 1.0)));

    if (pin === 1) {
        return Math.min(normX, normY);
    } else if (pin === 2) {
        return Math.max(0.0, Math.min(1.0, (halfRes.y - coord.y) / Math.max(2.0 * halfRes.y, 1.0)));
    } else if (pin === 3) {
        return Math.max(0.0, Math.min(1.0, (coord.y + halfRes.y) / Math.max(2.0 * halfRes.y, 1.0)));
    } else if (pin === 4) {
        return Math.max(0.0, Math.min(1.0, (coord.x + halfRes.x) / Math.max(2.0 * halfRes.x, 1.0)));
    } else if (pin === 5) {
        return Math.max(0.0, Math.min(1.0, (halfRes.x - coord.x) / Math.max(2.0 * halfRes.x, 1.0)));
    }
    return 1.0;
}

export function calculateDisplacement(coord, resolution, params) {
    const { waveType = 0, waveHeight = 10.0, waveWidth = 40.0, direction = 90.0, phase = 0.0, pinning = 0 } = params;
    const rad = direction * (Math.PI / 180.0);
    const uProp = [Math.cos(rad), Math.sin(rad)];
    const vTrans = [-Math.sin(rad), Math.cos(rad)];

    const s = coord.x * uProp[0] + coord.y * uProp[1];
    const k = (2.0 * Math.PI) / Math.max(waveWidth, 1.0);
    const phi = s * k + phase * (Math.PI / 180.0);

    const waveVal = evaluateWaveform(phi, Math.floor(waveType + 0.5));
    const halfRes = { x: resolution.x * 0.5, y: resolution.y * 0.5 };
    const pinFactor = computePinFactor(coord, halfRes, Math.floor(pinning + 0.5));

    const mag = waveHeight * waveVal * pinFactor;
    return {
        dx: vTrans[0] * mag,
        dy: vTrans[1] * mag
    };
}

export function computePadding(waveHeight) {
    const pad = Math.ceil(Math.abs(waveHeight)) + 20;
    return { x: pad, y: pad };
}
