import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import {
    resolveProjectRoot,
    resolveCavalryScriptsDir,
    resolveCavalryMcpPath,
    resolveStallionModuleUrl,
    resolveStallionMockUrl,
    resolveStallionUrl,
    getConfigurationSummary,
    toForwardSlashes,
} from '../scripts/lib/config.mjs';

test('Configuration — Cross-platform path & directory resolution', () => {
    // 1. Windows default
    const winDir = resolveCavalryScriptsDir({
        platform: 'win32',
        appData: 'C:\\Users\\TestUser\\AppData\\Roaming',
        home: 'C:\\Users\\TestUser',
    });
    assert.equal(toForwardSlashes(winDir), 'C:/Users/TestUser/AppData/Roaming/Cavalry/Scripts');

    // 2. macOS default
    const macDir = resolveCavalryScriptsDir({
        platform: 'darwin',
        home: '/Users/TestUser',
    });
    assert.equal(toForwardSlashes(macDir), '/Users/TestUser/Library/Application Support/Cavalry/Scripts');

    // 3. Linux default
    const linuxDir = resolveCavalryScriptsDir({
        platform: 'linux',
        home: '/home/testuser',
    });
    assert.equal(toForwardSlashes(linuxDir), '/home/testuser/.local/share/Cavalry/Scripts');

    // 4. Custom override takes precedence
    const customPath = path.resolve('/custom/cavalry/scripts');
    const customDir = resolveCavalryScriptsDir({
        override: customPath,
    });
    assert.equal(customDir, customPath);
});

test('Configuration — Environment variable overrides & fallback', () => {
    const root = resolveProjectRoot();
    assert.ok(root && typeof root === 'string');

    const summary = getConfigurationSummary();
    assert.equal(summary.projectRoot, root);
    assert.equal(summary.stallionUrl, 'http://127.0.0.1:8080');

    // Custom stallion URL
    const customStallion = resolveStallionUrl({ override: 'http://localhost:9090' });
    assert.equal(customStallion, 'http://localhost:9090');
});
