import test from 'node:test';
import assert from 'node:assert/strict';

import { buildEasedKeyframes, EASE_NAMES, getEase, sampleEase } from '../cavalry-script/gsap-eases.mjs';

const close = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

test('GSAP eases — Tier 1: value parity with known GSAP outputs', () => {
    // Exact reference values (cross-checked against gsap/Ease.js behavior):
    assert.ok(close(sampleEase('none.out', 0.5), 0.5));
    assert.ok(close(sampleEase('power2.out', 0.5), 0.875));          // 1 - (1-0.5)^3
    assert.ok(close(sampleEase('power2.in', 0.5), 0.125));           // 0.5^3
    assert.ok(close(sampleEase('power1.inOut', 0.5), 0.5));
    assert.ok(close(sampleEase('power4.out', 0.5), 1 - Math.pow(0.5, 5)));
    assert.ok(close(sampleEase('bounce.out', 0.5), 0.765625));       // 7.5625*(0.25/2.75-...)^2+0.75 branch
    assert.ok(close(sampleEase('elastic.out', 0.5), 1.015625));      // 2^-5 * sin(4.25*2pi/3) + 1
    assert.ok(close(sampleEase('expo.out', 0.5), 1 - Math.pow(2, -5)));
    assert.ok(close(sampleEase('expo.out', 1), 1));
    assert.ok(close(sampleEase('expo.in', 0), 0));
    assert.ok(close(sampleEase('sine.out', 0.5), Math.sin(Math.PI / 4)));
    assert.ok(close(sampleEase('circ.out', 0.5), Math.sqrt(0.75)));
    assert.ok(close(sampleEase('back.out', 0.5), 1 + 2.70158 * -0.125 + 1.70158 * 0.25));
    assert.ok(close(sampleEase('steps(4)', 0.5), 0.5));
    assert.ok(close(sampleEase('steps(4)', 0.99), 0.75));
    assert.ok(close(sampleEase('steps(4)', 1), 1));
});

test('GSAP eases — Tier 2: boundaries, monotonicity and inOut symmetry', () => {
    for (const name of EASE_NAMES) {
        const fn = getEase(name);
        // Every ease lands on the endpoints (bounce.out has float error ~1e-16).
        assert.ok(Math.abs(fn(0)) < 1e-12, `${name}(0) should be 0, got ${fn(0)}`);
        assert.ok(Math.abs(fn(1) - 1) < 1e-12, `${name}(1) should be 1, got ${fn(1)}`);
    }

    // Monotonic for the non-overshooting families (back/elastic overshoot;
    // bounce dips between bounces — all non-monotonic by design, like GSAP).
    const monotonic = EASE_NAMES.filter((n) => !/^(back|elastic|bounce)\./.test(n));
    for (const name of monotonic) {
        const fn = getEase(name);
        let prev = fn(0);
        for (let i = 1; i <= 100; i++) {
            const v = fn(i / 100);
            assert.ok(v >= prev - 1e-12, `${name} not monotonic at t=${i / 100}`);
            prev = v;
        }
    }

    // inOut symmetry: f(0.25) === 1 - f(0.75) for the symmetric families.
    const symmetric = ['sine', 'expo', 'circ', 'none', 'power1', 'power2', 'power3', 'power4'];
    for (const family of symmetric) {
        const fn = getEase(`${family}.inOut`);
        assert.ok(close(fn(0.25), 1 - fn(0.75), 1e-12), `${family}.inOut not symmetric`);
    }

    // Overshoot sanity: back.out rises above 1, elastic.out oscillates around 1,
    // bounce.out dips to exactly 0.75 at the apex of its second bounce.
    assert.ok(getEase('back.out')(0.8) > 1.0);
    assert.ok(getEase('elastic.out')(0.3) < 1.0);
    assert.ok(getEase('elastic.out')(0.4) > 1.0);
    assert.ok(close(getEase('bounce.out')(1.5 / 2.75), 0.75));
});

test('GSAP eases — Tier 3: surface and error contracts', () => {
    assert.ok(EASE_NAMES.length >= 33, 'expected at least 33 named eases');
    assert.ok(EASE_NAMES.includes('power2.out') && EASE_NAMES.includes('bounce.inOut'));

    // Unknown names must throw — a silent fallback would corrupt curve data.
    assert.throws(() => getEase('power9.out'), /Unknown ease/);
    assert.throws(() => getEase(''), /Unknown ease/);
    assert.throws(() => getEase('steps(0)'), /steps/);
    assert.throws(() => buildEasedKeyframes(0, 100, 1, 'power2.out'), /frameCount/);

    const values = buildEasedKeyframes(100, 200, 48, 'power2.out');
    assert.equal(values.length, 48);
    assert.equal(values[0], 100);
    assert.equal(values[47], 200);
    // Cubic ease-out rises fast early: halfway sample is past the midpoint.
    assert.ok(values[23] > 150);
});
