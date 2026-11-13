import test from 'node:test';
import assert from 'node:assert/strict';
import { syncAgentConfigs } from '../scripts/sync-agent-configs.mjs';

test('AI-Agent Integrations — All agent configurations are synchronized with canonical source', () => {
    const res = syncAgentConfigs({ check: true });
    assert.equal(res.ok, true, `Agent configs out of sync: ${JSON.stringify(res.diffs)}`);
    assert.equal(res.diffs.length, 0);
    assert.ok(res.syncedCount >= 11);
});
