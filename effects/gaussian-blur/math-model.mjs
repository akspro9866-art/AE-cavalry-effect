/**
 * Gaussian Blur Pure JavaScript Mathematical Reference Model & Performance Benchmark
 * Used for offline verification, invariant testing, and visual equivalency assertions.
 */

export const SAMPLE_COUNTS = {
    twoDimensional: {
        center: 1,
        spiralIterations: 36,
        totalSamples: 37,
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
        // 2D Isotropic Vogel Disc: 36 spiral taps
        const maxR = sigma * 3.0;
        for (let i = 0; i < 36; i++) {
            const r = maxR * Math.sqrt((i + 0.5) / 36.0);
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
    const sampleInfo = dimension === 1
        ? SAMPLE_COUNTS.horizontalOnly
        : (dimension === 2 ? SAMPLE_COUNTS.verticalOnly : SAMPLE_COUNTS.twoDimensional);

    const totalSamples = totalPixels * sampleInfo.totalSamples;

    const t0 = performance.now();
    // Simulate kernel weight computations
    const weightSum = computeKernelWeightsSum(blurriness, dimension);
    const elapsedMs = performance.now() - t0;

    return {
        resolution: `${width}x${height}`,
        totalPixels,
        dimension,
        totalTapsPerPixel: sampleInfo.totalSamples,
        totalTextureEvaluations: totalSamples,
        weightSum,
        simulationTimeMs: Number(elapsedMs.toFixed(3)),
    };
}
