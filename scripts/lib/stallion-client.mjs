import { randomUUID } from 'node:crypto';

/**
 * Minimal zero-dependency HTTP client for the Stallion script protocol.
 *
 * Protocol (see references/cavalry-api.md §1): POST /post enqueues a payload and
 * responds `{ ok: true }`; the execution envelope (`kind: "result"`, matching `seq`)
 * is then served from the single response slot at GET /get.
 *
 * Works against both the live Stallion server inside Cavalry and the vendored
 * mock server (`vendor/stallion-mock.mjs`), so tests and the mock CLI mode never
 * depend on an external repository checkout.
 */

const DEFAULT_TIMEOUT_MS = 30000;
const POLL_INTERVAL_MS = 25;

/**
 * Executes a Cavalry script and resolves with the raw JSON envelope text.
 * @param {string} code Script body. Set `__result` inside the script to return a value.
 * @param {{ url?: string }} [config] Server base URL (defaults to live Stallion).
 * @param {{ helpers?: boolean, timeoutMs?: number }} [opts] `helpers: true` asks the
 *   server to preload its runtime helpers before the script body.
 * @returns {Promise<string>} Raw JSON envelope: `{ kind, seq, ok, result?, error?, receipt? }`.
 */
export async function runScriptWithResult(code, config = {}, opts = {}) {
    const base = String(config.url || process.env.STALLION_URL || 'http://127.0.0.1:8080').replace(/\/$/, '');
    const seq = randomUUID();
    const body = JSON.stringify({
        type: 'script',
        code,
        seq,
        helpers: opts.helpers === true,
    });

    const postRes = await fetch(base + '/post', { method: 'POST', body });
    if (!postRes.ok) {
        throw new Error(`Stallion POST /post failed with ${postRes.status}: ${await postRes.text()}`);
    }

    const deadline = Date.now() + (opts.timeoutMs || DEFAULT_TIMEOUT_MS);
    while (Date.now() < deadline) {
        try {
            const getRes = await fetch(base + '/get');
            if (getRes.ok) {
                const text = await getRes.text();
                const parsed = JSON.parse(text);
                if (parsed && parsed.kind === 'result' && String(parsed.seq) === seq) {
                    return text;
                }
            }
        } catch {
            // A render or modal can delay one poll; the overall deadline remains bounded.
        }
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
    throw new Error(`Timed out after ${opts.timeoutMs || DEFAULT_TIMEOUT_MS}ms waiting for Stallion result (seq ${seq})`);
}

/**
 * Returns the client configuration used by the CLI and tests.
 */
export function loadConfig() {
    return {
        url: process.env.STALLION_URL || 'http://127.0.0.1:8080',
    };
}
