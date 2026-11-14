import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { compareImages, decodePng, verifyVisualParity } from '../scripts/lib/visual-diff.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('Tier 5 Visual Diff — Invariant metrics on synthetic images', () => {
    const width = 10;
    const height = 10;
    const size = width * height * 4;

    const dataA = new Uint8Array(size);
    const dataB = new Uint8Array(size);

    for (let i = 0; i < size; i += 4) {
        dataA[i] = 100;     // R
        dataA[i + 1] = 150; // G
        dataA[i + 2] = 200; // B
        dataA[i + 3] = 255; // A

        dataB[i] = 100;
        dataB[i + 1] = 150;
        dataB[i + 2] = 200;
        dataB[i + 3] = 255;
    }

    // 1. Identical images must yield perfect metrics
    const identical = compareImages({ width, height, data: dataA }, { width, height, data: dataB });
    assert.equal(identical.mae, 0);
    assert.equal(identical.psnr, 100);
    assert.equal(identical.ssim, 1);
    assert.equal(identical.alphaDeviation, 0);
    assert.equal(identical.colorDeviation, 0);

    // 2. Controlled perturbation
    for (let i = 0; i < size; i += 4) {
        dataB[i] += 10; // Shift red channel by 10
    }
    const perturbed = compareImages({ width, height, data: dataA }, { width, height, data: dataB });
    assert.ok(perturbed.mae > 0 && perturbed.mae <= 10);
    assert.ok(perturbed.psnr < 100 && perturbed.psnr > 20);
    assert.ok(perturbed.ssim > 0.8 && perturbed.ssim <= 1.0);
});

test('Tier 5 Visual Diff — Unverified parity reporting when AE reference is absent', () => {
    const res = verifyVisualParity({
        referencePngPath: 'non-existent/ref.png',
        livePngPath: 'non-existent/live.png',
    });
    assert.equal(res.verified, false);
    assert.equal(res.status, 'unverified');
    assert.ok(res.reason.includes('After Effects reference image missing'));
});

/**
 * Minimal zero-dependency PNG encoder (8-bit RGBA, filter type 0) for decoder tests.
 */
function encodePng(width, height, rgba) {
    const raw = Buffer.alloc((width * 4 + 1) * height);
    for (let y = 0; y < height; y++) {
        raw[y * (width * 4 + 1)] = 0; // filter: None
        Buffer.from(rgba.buffer, y * width * 4, width * 4).copy(raw, y * (width * 4 + 1) + 1);
    }
    const idat = zlib.deflateSync(raw);
    const chunks = [];
    const crcTable = [];
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        crcTable[n] = c >>> 0;
    }
    const crc32 = (buf) => {
        let c = 0xffffffff;
        for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
        return (c ^ 0xffffffff) >>> 0;
    };
    const chunk = (type, data) => {
        const len = Buffer.alloc(4);
        len.writeUInt32BE(data.length);
        const typeBuf = Buffer.from(type, 'ascii');
        const crc = Buffer.alloc(4);
        crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
        return Buffer.concat([len, typeBuf, data, crc]);
    };
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8;  // bit depth
    ihdr[9] = 6;  // RGBA
    chunks.push(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    chunks.push(chunk('IHDR', ihdr));
    chunks.push(chunk('IDAT', idat));
    chunks.push(chunk('IEND', Buffer.alloc(0)));
    return Buffer.concat(chunks);
}

test('Tier 5 Visual Diff — decodePng round-trips an encoded RGBA buffer', () => {
    const width = 5;
    const height = 3;
    const rgba = new Uint8Array(width * height * 4);
    for (let p = 0; p < width * height; p++) {
        rgba[p * 4] = (p * 37) % 256;
        rgba[p * 4 + 1] = (p * 53) % 256;
        rgba[p * 4 + 2] = (p * 91) % 256;
        rgba[p * 4 + 3] = 255;
    }
    const png = encodePng(width, height, rgba);
    const decoded = decodePng(png);
    assert.equal(decoded.width, width);
    assert.equal(decoded.height, height);
    assert.equal(decoded.data.length, width * height * 4);
    assert.deepEqual([...decoded.data], [...rgba]);
});

test('Tier 5 Visual Diff — decodePng handles a real committed artifact render', () => {
    // artifacts/verify-deep-glow/frame_0.png is a live Cavalry GPU render (8-bit RGBA).
    const artifactPath = path.join(ROOT, 'artifacts', 'verify-deep-glow', 'frame_0.png');
    assert.ok(fs.existsSync(artifactPath), 'expected committed verification artifact to exist');
    const img = decodePng(fs.readFileSync(artifactPath));
    assert.ok(img.width > 0 && img.height > 0);
    assert.equal(img.data.length, img.width * img.height * 4);
    // Deterministic decode: same bytes -> identical alpha coverage.
    const again = decodePng(fs.readFileSync(artifactPath));
    assert.deepEqual([...img.data], [...again.data]);
});

test('Tier 5 Visual Diff — decodePng rejects malformed input loudly', () => {
    assert.throws(() => decodePng(Buffer.alloc(4)), /PNG buffer too small/);
    assert.throws(() => decodePng(Buffer.alloc(64, 0x00)), /Invalid PNG signature/);
});

test('Tier 5 Visual Diff — windowed SSIM separates structure from noise', () => {
    // A gradient image vs itself -> SSIM 1; gradient vs same gradient + small noise
    // -> still high SSIM (structure preserved); gradient vs inverted gradient -> low SSIM.
    const width = 32;
    const height = 32;
    const grad = new Uint8Array(width * height * 4);
    const noisy = new Uint8Array(width * height * 4);
    const inverted = new Uint8Array(width * height * 4);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const v = Math.round((x / (width - 1)) * 255);
            grad[i] = grad[i + 1] = grad[i + 2] = v; grad[i + 3] = 255;
            const nv = Math.min(255, v + ((x + y) % 2) * 8);
            noisy[i] = noisy[i + 1] = noisy[i + 2] = nv; noisy[i + 3] = 255;
            const iv = 255 - v;
            inverted[i] = inverted[i + 1] = inverted[i + 2] = iv; inverted[i + 3] = 255;
        }
    }
    const mk = (d) => ({ width, height, data: d });
    const same = compareImages(mk(grad), mk(grad));
    assert.equal(same.ssim, 1);
    assert.equal(same.sobelEdgeDeviation, 0);

    const noisyRes = compareImages(mk(grad), mk(noisy));
    assert.ok(noisyRes.ssim > 0.9, `expected noisy SSIM > 0.9, got ${noisyRes.ssim}`);
    assert.ok(noisyRes.sobelEdgeDeviation >= 0 && noisyRes.sobelEdgeDeviation < 40,
        `expected small sobel deviation, got ${noisyRes.sobelEdgeDeviation}`);

    const invRes = compareImages(mk(grad), mk(inverted));
    assert.ok(invRes.ssim < 0.3, `expected inverted-gradient SSIM < 0.3, got ${invRes.ssim}`);
    // Same gradient magnitude distribution -> near-zero structural edge deviation
    // even though intensity is inverted; sobel compares gradient STRUCTURE.
    assert.ok(invRes.sobelEdgeDeviation < 5, `expected near-zero sobel deviation, got ${invRes.sobelEdgeDeviation}`);
});
