/**
 * Tier 5: After Effects Visual Compatibility & Reference Comparison Engine
 * Zero-dependency pure Node.js PNG decoder and statistical metrics:
 *   - MAE (Mean Absolute Error)
 *   - MSE (Mean Squared Error)
 *   - PSNR (Peak Signal-to-Noise Ratio in dB)
 *   - SSIM (Structural Similarity Index, 8x8 windowed per Wang et al. 2004)
 *   - Alpha Channel Deviation
 *   - Color Deviation (Euclidean RGB delta)
 *   - Edge Gradient Deviation (Sobel convolution, MAE between gradient maps)
 */

import fs from 'node:fs';
import zlib from 'node:zlib';

/**
 * Parses an RGBA PNG buffer into { width, height, data: Uint8Array }.
 */
export function decodePng(buffer) {
    if (buffer.length < 8) throw new Error('PNG buffer too small');
    const signature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
    for (let i = 0; i < 8; i++) {
        if (buffer[i] !== signature[i]) throw new Error('Invalid PNG signature');
    }

    let offset = 8;
    let width = 0;
    let height = 0;
    let bitDepth = 0;
    let colorType = 0;
    const idatChunks = [];

    while (offset < buffer.length) {
        const length = buffer.readUInt32BE(offset);
        const type = buffer.toString('ascii', offset + 4, offset + 8);
        const chunkData = buffer.subarray(offset + 8, offset + 8 + length);
        offset += 12 + length;

        if (type === 'IHDR') {
            width = chunkData.readUInt32BE(0);
            height = chunkData.readUInt32BE(4);
            bitDepth = chunkData[8];
            colorType = chunkData[9];
        } else if (type === 'IDAT') {
            idatChunks.push(chunkData);
        } else if (type === 'IEND') {
            break;
        }
    }

    if (bitDepth !== 8 || (colorType !== 6 && colorType !== 2)) {
        throw new Error(`Unsupported PNG format: bitDepth=${bitDepth}, colorType=${colorType} (requires 8-bit RGB or RGBA)`);
    }

    const compressed = Buffer.concat(idatChunks);
    const uncompressed = zlib.inflateSync(compressed);

    const bytesPerPixel = colorType === 6 ? 4 : 3;
    const stride = width * bytesPerPixel;
    const rgba = new Uint8Array(width * height * 4);

    let srcOffset = 0;
    const scanline = new Uint8Array(stride);
    const prevScanline = new Uint8Array(stride);

    for (let y = 0; y < height; y++) {
        const filterType = uncompressed[srcOffset++];
        for (let x = 0; x < stride; x++) {
            const raw = uncompressed[srcOffset++];
            const a = x >= bytesPerPixel ? scanline[x - bytesPerPixel] : 0;
            const b = prevScanline[x];
            const c = x >= bytesPerPixel ? prevScanline[x - bytesPerPixel] : 0;

            let val = 0;
            if (filterType === 0) { // None
                val = raw;
            } else if (filterType === 1) { // Sub
                val = (raw + a) & 0xff;
            } else if (filterType === 2) { // Up
                val = (raw + b) & 0xff;
            } else if (filterType === 3) { // Average
                val = (raw + Math.floor((a + b) / 2)) & 0xff;
            } else if (filterType === 4) { // Paeth
                const p = a + b - c;
                const pa = Math.abs(p - a);
                const pb = Math.abs(p - b);
                const pc = Math.abs(p - c);
                let pr = a;
                if (pb < pa && pb <= pc) pr = b;
                else if (pc < pa && pc <= pb) pr = c;
                val = (raw + pr) & 0xff;
            }
            scanline[x] = val;
        }

        prevScanline.set(scanline);

        // Copy scanline to destination RGBA buffer
        const dstRowOffset = y * width * 4;
        if (colorType === 6) {
            rgba.set(scanline, dstRowOffset);
        } else {
            for (let px = 0; px < width; px++) {
                const s = px * 3;
                const d = dstRowOffset + px * 4;
                rgba[d] = scanline[s];
                rgba[d + 1] = scanline[s + 1];
                rgba[d + 2] = scanline[s + 2];
                rgba[d + 3] = 255;
            }
        }
    }

    return { width, height, data: rgba };
}

/**
 * Computes comparative visual metrics between two decoded image objects.
 */
export function compareImages(imgA, imgB, options = {}) {
    if (imgA.width !== imgB.width || imgA.height !== imgB.height) {
        throw new Error(`Dimension mismatch: Image A is ${imgA.width}x${imgA.height}, Image B is ${imgB.width}x${imgB.height}`);
    }

    const totalPixels = imgA.width * imgA.height;
    const a = imgA.data;
    const b = imgB.data;

    let sumAbsDiffRgb = 0;
    let sumSqDiffRgb = 0;
    let sumAbsDiffAlpha = 0;
    let sumColorDelta = 0;
    let maxDiff = 0;

    for (let i = 0; i < totalPixels * 4; i += 4) {
        const dr = Math.abs(a[i] - b[i]);
        const dg = Math.abs(a[i + 1] - b[i + 1]);
        const db = Math.abs(a[i + 2] - b[i + 2]);
        const da = Math.abs(a[i + 3] - b[i + 3]);

        sumAbsDiffRgb += dr + dg + db;
        sumSqDiffRgb += dr * dr + dg * dg + db * db;
        sumAbsDiffAlpha += da;
        sumColorDelta += Math.sqrt(dr * dr + dg * dg + db * db);

        const localMax = Math.max(dr, dg, db, da);
        if (localMax > maxDiff) maxDiff = localMax;
    }

    const mae = sumAbsDiffRgb / (totalPixels * 3);
    const mse = sumSqDiffRgb / (totalPixels * 3);
    const psnr = mse <= 1e-6 ? 100 : 10 * Math.log10((255 * 255) / mse);
    const alphaDeviation = sumAbsDiffAlpha / totalPixels;
    const colorDeviation = sumColorDelta / totalPixels;

    // Structural metrics over the Rec. 601 luma plane.
    const lumaA = lumaPlane(imgA);
    const lumaB = lumaPlane(imgB);
    const ssim = computeWindowedSsim(lumaA, lumaB, imgA.width, imgA.height);
    const sobelEdgeDeviation = computeSobelEdgeDeviation(lumaA, lumaB, imgA.width, imgA.height);

    return {
        width: imgA.width,
        height: imgA.height,
        totalPixels,
        mae: Number(mae.toFixed(4)),
        mse: Number(mse.toFixed(4)),
        psnr: Number(psnr.toFixed(2)),
        ssim: Number(ssim.toFixed(4)),
        sobelEdgeDeviation: Number(sobelEdgeDeviation.toFixed(4)),
        alphaDeviation: Number(alphaDeviation.toFixed(4)),
        colorDeviation: Number(colorDeviation.toFixed(4)),
        maxPixelDiff: maxDiff,
    };
}

/**
 * Computes the Rec. 601 luma plane of an image as a Float64Array.
 */
function lumaPlane(img) {
    const out = new Float64Array(img.width * img.height);
    const d = img.data;
    for (let i = 0, p = 0; p < out.length; i += 4, p++) {
        out[p] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    }
    return out;
}

/**
 * Windowed SSIM (Wang et al. 2004) over an 8x8 grid with 1-pixel stride,
 * averaged over all valid windows. Falls back to the global SSIM for images
 * smaller than one window.
 */
function computeWindowedSsim(lumaA, lumaB, width, height) {
    const c1 = (0.01 * 255) * (0.01 * 255);
    const c2 = (0.03 * 255) * (0.03 * 255);
    const win = 8;

    if (width < win || height < win) {
        // Degenerate size: single global window over all pixels.
        let sumA = 0, sumB = 0, sumSqA = 0, sumSqB = 0, sumProd = 0;
        const n = width * height;
        for (let p = 0; p < n; p++) {
            sumA += lumaA[p]; sumB += lumaB[p];
            sumSqA += lumaA[p] * lumaA[p]; sumSqB += lumaB[p] * lumaB[p];
            sumProd += lumaA[p] * lumaB[p];
        }
        const muA = sumA / n, muB = sumB / n;
        const varA = sumSqA / n - muA * muA;
        const varB = sumSqB / n - muB * muB;
        const cov = sumProd / n - muA * muB;
        const num = (2 * muA * muB + c1) * (2 * cov + c2);
        const den = (muA * muA + muB * muB + c1) * (varA + varB + c2);
        return den !== 0 ? Math.max(0, Math.min(1, num / den)) : 1.0;
    }

    let ssimSum = 0;
    let windows = 0;
    for (let wy = 0; wy + win <= height; wy++) {
        for (let wx = 0; wx + win <= width; wx++) {
            let sumA = 0, sumB = 0, sumSqA = 0, sumSqB = 0, sumProd = 0;
            for (let y = wy; y < wy + win; y++) {
                const row = y * width;
                for (let x = wx; x < wx + win; x++) {
                    const va = lumaA[row + x];
                    const vb = lumaB[row + x];
                    sumA += va; sumB += vb;
                    sumSqA += va * va; sumSqB += vb * vb;
                    sumProd += va * vb;
                }
            }
            const n = win * win;
            const muA = sumA / n, muB = sumB / n;
            const varA = sumSqA / n - muA * muA;
            const varB = sumSqB / n - muB * muB;
            const cov = sumProd / n - muA * muB;
            const num = (2 * muA * muB + c1) * (2 * cov + c2);
            const den = (muA * muA + muB * muB + c1) * (varA + varB + c2);
            ssimSum += den !== 0 ? Math.max(0, Math.min(1, num / den)) : 1.0;
            windows++;
        }
    }
    return ssimSum / windows;
}

/**
 * Sobel edge gradient magnitude MAE between the two luma planes.
 * Border pixels (no full 3x3 neighborhood) use the clamped neighborhood.
 * Returned value is normalized to the 0-255 gradient scale (lower is closer).
 */
function computeSobelEdgeDeviation(lumaA, lumaB, width, height) {
    const magA = new Float64Array(width * height);
    const magB = new Float64Array(width * height);
    const at = (plane, x, y) => plane[Math.min(height - 1, Math.max(0, y)) * width + Math.min(width - 1, Math.max(0, x))];

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let gx = 0, gy = 0;
            // Sobel kernels applied identically to both planes.
            const x0 = x - 1, x2 = x + 1, y0 = y - 1, y2 = y + 1;
            const tl = at(lumaA, x0, y0), tc = at(lumaA, x, y0), tr = at(lumaA, x2, y0);
            const ml = at(lumaA, x0, y), mr = at(lumaA, x2, y);
            const bl = at(lumaA, x0, y2), bc = at(lumaA, x, y2), br = at(lumaA, x2, y2);
            gx = (tr + 2 * mr + br) - (tl + 2 * ml + bl);
            gy = (bl + 2 * bc + br) - (tl + 2 * tc + tr);
            magA[y * width + x] = Math.sqrt(gx * gx + gy * gy);

            let gx2 = 0, gy2 = 0;
            const tl2 = at(lumaB, x0, y0), tc2 = at(lumaB, x, y0), tr2 = at(lumaB, x2, y0);
            const ml2 = at(lumaB, x0, y), mr2 = at(lumaB, x2, y);
            const bl2 = at(lumaB, x0, y2), bc2 = at(lumaB, x, y2), br2 = at(lumaB, x2, y2);
            gx2 = (tr2 + 2 * mr2 + br2) - (tl2 + 2 * ml2 + bl2);
            gy2 = (bl2 + 2 * bc2 + br2) - (tl2 + 2 * tc2 + tr2);
            magB[y * width + x] = Math.sqrt(gx2 * gx2 + gy2 * gy2);
        }
    }

    let sum = 0;
    const n = width * height;
    for (let p = 0; p < n; p++) {
        sum += Math.abs(magA[p] - magB[p]);
    }
    return sum / n;
}

/**
 * High-level comparator between reference PNG and live Cavalry rendered PNG.
 */
export function verifyVisualParity({ referencePngPath, livePngPath, thresholds = {} }) {
    if (!fs.existsSync(referencePngPath)) {
        return {
            verified: false,
            status: 'unverified',
            reason: `After Effects reference image missing at ${referencePngPath}`,
            referencePngPath,
            livePngPath,
            metrics: null,
        };
    }

    if (!fs.existsSync(livePngPath)) {
        return {
            verified: false,
            status: 'failed',
            reason: `Live Cavalry rendered image missing at ${livePngPath}`,
            referencePngPath,
            livePngPath,
            metrics: null,
        };
    }

    const refBuf = fs.readFileSync(referencePngPath);
    const liveBuf = fs.readFileSync(livePngPath);

    const refImg = decodePng(refBuf);
    const liveImg = decodePng(liveBuf);
    const metrics = compareImages(refImg, liveImg);

    const maxMae = thresholds.maxMae !== undefined ? thresholds.maxMae : 5.0;
    const minPsnr = thresholds.minPsnr !== undefined ? thresholds.minPsnr : 30.0;
    const minSsim = thresholds.minSsim !== undefined ? thresholds.minSsim : 0.92;

    const passed = metrics.mae <= maxMae && metrics.psnr >= minPsnr && metrics.ssim >= minSsim;

    return {
        verified: true,
        status: passed ? 'parity-verified' : 'parity-divergence',
        passed,
        thresholds: { maxMae, minPsnr, minSsim },
        metrics,
        referencePngPath,
        livePngPath,
    };
}
