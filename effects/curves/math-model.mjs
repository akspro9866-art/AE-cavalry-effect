/**
 * Pure Mathematical Model & Invariant Suite:
 * Adobe After Effects "Curves" (ADBE CurvesCustom) -> Cavalry 2.8+
 */

export function evalCatmullRom(x, y0, y1, y2, y3, y4) {
    const xc = Math.max(0.0, Math.min(1.0, x));
    let segment = Math.floor(xc * 4.0);
    segment = Math.min(segment, 3.0);
    const t = (xc - segment * 0.25) * 4.0;

    let p0, p1, p2, p3;
    if (segment < 0.5) {
        p1 = y0; p2 = y1;
        p0 = y0 - (y1 - y0);
        p3 = y2;
    } else if (segment < 1.5) {
        p0 = y0; p1 = y1; p2 = y2; p3 = y3;
    } else if (segment < 2.5) {
        p0 = y1; p1 = y2; p2 = y3; p3 = y4;
    } else {
        p0 = y2; p1 = y3; p2 = y4;
        p3 = y4 + (y4 - y3);
    }

    const t2 = t * t;
    const t3 = t2 * t;
    const val = 0.5 * ((2.0 * p1) +
                      (-p0 + p2) * t +
                      (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * t2 +
                      (-p0 + 3.0 * p1 - 3.0 * p2 + p3) * t3);
    return Math.max(0.0, Math.min(1.0, val));
}

export function evalChannelCurve(c, lift, mid, gain) {
    const y0 = Math.max(0.0, Math.min(1.0, lift));
    const y1 = Math.max(0.0, Math.min(1.0, 0.25 + (lift * 0.75 + mid * 0.25)));
    const y2 = Math.max(0.0, Math.min(1.0, 0.50 + mid));
    const y3 = Math.max(0.0, Math.min(1.0, 0.75 + (gain * 0.75 + mid * 0.25)));
    const y4 = Math.max(0.0, Math.min(1.0, 1.0 + gain));
    return evalCatmullRom(c, y0, y1, y2, y3, y4);
}

export function applyCurves(color, params) {
    const {
        masterBlack = 0.0,
        masterShadows = 0.25,
        masterMidtones = 0.50,
        masterHighlights = 0.75,
        masterWhite = 1.0,
        redLift = 0.0, redMid = 0.0, redGain = 0.0,
        greenLift = 0.0, greenMid = 0.0, greenGain = 0.0,
        blueLift = 0.0, blueMid = 0.0, blueGain = 0.0
    } = params;

    let r = color.r;
    let g = color.g;
    let b = color.b;

    // Master Curve
    r = evalCatmullRom(r, masterBlack, masterShadows, masterMidtones, masterHighlights, masterWhite);
    g = evalCatmullRom(g, masterBlack, masterShadows, masterMidtones, masterHighlights, masterWhite);
    b = evalCatmullRom(b, masterBlack, masterShadows, masterMidtones, masterHighlights, masterWhite);

    // Channel Curves
    r = evalChannelCurve(r, redLift, redMid, redGain);
    g = evalChannelCurve(g, greenLift, greenMid, greenGain);
    b = evalChannelCurve(b, blueLift, blueMid, blueGain);

    return { r, g, b, a: color.a };
}

export function calculatePadding() {
    return { x: 0, y: 0 };
}
