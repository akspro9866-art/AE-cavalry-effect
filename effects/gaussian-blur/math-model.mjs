/**
 * Gaussian Blur Pure JavaScript Mathematical Reference Model & Performance Benchmark
 * Used for offline verification, invariant testing, and visual equivalency assertions.
 */

export const SAMPLE_COUNTS = {
    twoDimensional: {
        center: 1,
        spiralIterations: 'tiered: 36 (sigma < 8 px) | 72 (sigma < 40 px) | 144 (sigma >= 40 px)',
        maxSpiralIterations: 144,
        totalSamples: 145, // maximum tier (144 spiral taps + center)
        minTotalSamples: 37,
        distribution: 'Vogel Golden-Spiral Isotropic Disc',
    },
    horizontalOnly: {
        center: 1,
        iterations: 32,
        samplesPerIteration: 2,
        totalSamples: 65,
        distribution: 'Separable 1D Horizontal Gaussian',
    },
    verticalOnly: {
        center: 1,
        iterations: 32,
        samplesPerIteration: 2,
        totalSamples: 65,
        distribution: 'Separable 1D Vertical Gaussian',
    },
};

/**
 * 2D Vogel-disc tap tier for a given sigma. The SkSL kernel keeps a constant
 * loop bound of 144 with a dynamic early-out, so the GPU cost matches this count.
 * Larger radii get proportionally denser tap rings to avoid visible plateau
 * banding in the falloff (live-render verified: 36-tap showed ~30 px steps at
 * sigma 150, 144-tap reduces these ~4x).
 */
export const TWO_D_TAP_TIERS = [
    { maxSigma: 8.0, taps: 36 },
    { maxSigma: 40.0, taps: 72 },
    { maxSigma: Infinity, taps: 144 },
];

export function computeTwoDTapCount(sigma) {
    const s = Math.max(Number(sigma) || 0, 0.5);
    for (const tier of TWO_D_TAP_TIERS) {
        if (s < tier.maxSigma) return tier.taps;
    }
    return 144;
}

/**
 * Computes Gaussian weight according to standard normal bell curve:
 * w(d) = exp( - d^2 / (2 * sigma^2) )
 * where sigma = max(blurriness * 0.5, 0.5).
 */
export function computeGaussianWeight(dist, blurriness) {
    const sigma = Math.max(blurriness * 0.5, 0.5);
    const twoSigmaSq = 2.0 * sigma * sigma;
    return Math.exp(-(dist * dist) / twoSigmaSq);
}

/**
 * Calculates dynamic canvas padding to prevent edge clipping during blur diffusion.
 */
export function computePadding(blurriness, blurDimensions = 0) {
    const b = Number(blurriness) || 0;
    const basePad = Math.ceil(b * 1.8 + 20);
    const dim = Math.round(Number(blurDimensions) || 0);

    return {
        x: dim === 2 ? 0 : Math.min(basePad, 4096),
        y: dim === 1 ? 0 : Math.min(basePad, 4096),
    };
}

/**
 * Computes the normalized sum of kernel weights for each dimension path.
 */
export function computeKernelWeightsSum(blurriness, dimension = 0) {
    const sigma = Math.max(blurriness * 0.5, 0.5);
    const twoSigmaSq = 2.0 * sigma * sigma;

    let totalWeight = 1.0; // Center tap weight is exp(0) = 1.0

    if (dimension === 1 || dimension === 2) {
        // 1D Separable: 32 iterations, 2 symmetric taps each
        for (let i = 1; i <= 32; i++) {
            const dist = i * (sigma * 3.0 / 32.0);
            const w = Math.exp(-(dist * dist) / twoSigmaSq);
            totalWeight += 2.0 * w;
        }
    } else {
        // 2D Isotropic Vogel Disc: tiered spiral taps (36 / 72 / 144 by sigma)
        const taps = computeTwoDTapCount(sigma);
        const maxR = sigma * 3.0;
        for (let i = 0; i < taps; i++) {
            const r = maxR * Math.sqrt((i + 0.5) / taps);
            const w = Math.exp(-(r * r) / twoSigmaSq);
            totalWeight += w;
        }
    }

    return totalWeight;
}

/**
 * Benchmarks simulated GPU kernel execution across standard resolutions.
 */
export function benchmarkGaussianKernel(width, height, blurriness, dimension = 0) {
    const totalPixels = width * height;
    const sigma = Math.max(Number(blurriness) * 0.5 || 0, 0.5);
    const tapsPerPixel = dimension === 1 || dimension === 2
        ? SAMPLE_COUNTS.horizontalOnly.totalSamples
        : computeTwoDTapCount(sigma) + 1; // + center tap

    const totalSamples = totalPixels * tapsPerPixel;

    const t0 = performance.now();
    // Simulate kernel weight computations
    const weightSum = computeKernelWeightsSum(blurriness, dimension);
    const elapsedMs = performance.now() - t0;

    return {
        resolution: `${width}x${height}`,
        totalPixels,
        dimension,
        sigma,
        totalTapsPerPixel: tapsPerPixel,
        totalTextureEvaluations: totalSamples,
        weightSum,
        simulationTimeMs: Number(elapsedMs.toFixed(3)),
    };
}
