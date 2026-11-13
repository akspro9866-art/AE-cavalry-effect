// Gaussian Blur pure JavaScript mathematical reference model
// Used for offline verification, invariant testing, and visual equivalency assertions.

export function computeGaussianWeight(dist, blurriness) {
    const sigma = Math.max(blurriness * 0.5, 0.5);
    const twoSigmaSq = 2.0 * sigma * sigma;
    return Math.exp(-(dist * dist) / twoSigmaSq);
}

export function computePadding(blurriness, blurDimensions = 0) {
    const b = Number(blurriness) || 0;
    const basePad = Math.ceil(b * 1.8 + 20);
    const dim = Math.round(Number(blurDimensions) || 0);

    return {
        x: dim === 2 ? 0 : Math.min(basePad, 4096),
        y: dim === 1 ? 0 : Math.min(basePad, 4096)
    };
}
