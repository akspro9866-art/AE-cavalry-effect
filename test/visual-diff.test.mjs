import test from 'node:test';
import assert from 'node:assert/strict';
import { compareImages, verifyVisualParity } from '../scripts/lib/visual-diff.mjs';

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
