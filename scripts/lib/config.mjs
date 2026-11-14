import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_ROOT = path.resolve(__dirname, '..', '..');

/**
 * Normalizes backslashes to forward slashes for cross-platform consistency.
 */
export function toForwardSlashes(p) {
    return String(p || '').replace(/\\/g, '/');
}

/**
 * Resolves the root directory of the ae-effects-cavalry library.
 * Checks CAVALRY_LIBRARY_ROOT environment variable first, then fallback to project root.
 */
export function resolveProjectRoot(customRoot) {
    if (customRoot) {
        const abs = path.resolve(customRoot);
        if (fs.existsSync(abs)) return abs;
    }
    if (process.env.CAVALRY_LIBRARY_ROOT) {
        const envRoot = path.resolve(process.env.CAVALRY_LIBRARY_ROOT);
        if (fs.existsSync(envRoot)) return envRoot;
    }
    return DEFAULT_ROOT;
}

/**
 * Resolves the platform-specific Cavalry Scripts deployment directory.
 * Supports CAVALRY_SCRIPTS_DIR and STALLION_DEPLOY_DIR environment variable overrides.
 */
export function resolveCavalryScriptsDir({
    platform = process.platform,
    appData = process.env.APPDATA,
    home = os.homedir(),
    override = process.env.CAVALRY_SCRIPTS_DIR || process.env.STALLION_DEPLOY_DIR,
} = {}) {
    if (override) return path.resolve(override);
    if (platform === 'win32') {
        const roaming = appData || path.join(home, 'AppData', 'Roaming');
        return path.join(roaming, 'Cavalry', 'Scripts');
    }
    if (platform === 'darwin') {
        return path.join(home, 'Library', 'Application Support', 'Cavalry', 'Scripts');
    }
    return path.join(home, '.local', 'share', 'Cavalry', 'Scripts');
}

/**
 * Resolves the path to the optional cavalry-mcp installation.
 * Checks CAVALRY_MCP_PATH env var, sibling directory, and home directory.
 */
export function resolveCavalryMcpPath({
    override = process.env.CAVALRY_MCP_PATH,
    projectRoot = DEFAULT_ROOT,
    home = os.homedir(),
} = {}) {
    const candidates = [];
    if (override) candidates.push(path.resolve(override));
    candidates.push(path.resolve(projectRoot, '..', 'cavalry-mcp'));
    candidates.push(path.join(home, 'cavalry-mcp'));

    for (const cand of candidates) {
        if (fs.existsSync(cand) && fs.statSync(cand).isDirectory()) {
            return cand;
        }
    }
    return null;
}

/**
 * Resolves the stallion bridge module URL for live Cavalry HTTP communication.
 * Checks STALLION_MODULE env var, then cavalry-mcp bridge location.
 */
export function resolveStallionModuleUrl({
    override = process.env.STALLION_MODULE,
    cavalryMcpPath = null,
} = {}) {
    if (override) {
        const abs = path.resolve(override);
        if (fs.existsSync(abs)) return pathToFileURL(abs).href;
    }
    const mcp = cavalryMcpPath || resolveCavalryMcpPath();
    if (mcp) {
        const cand = path.join(mcp, 'dist', 'bridge', 'stallion.js');
        if (fs.existsSync(cand)) return pathToFileURL(cand).href;
    }
    return null;
}

/**
 * Resolves the stallion mock module URL for headless simulation.
 * Checks STALLION_MOCK env var, then the vendored copy in <root>/vendor, then
 * a stallion sibling checkout or home folder (legacy developer setups).
 */
export function resolveStallionMockUrl({
    override = process.env.STALLION_MOCK,
    projectRoot = DEFAULT_ROOT,
    home = os.homedir(),
} = {}) {
    if (override) {
        const abs = path.resolve(override);
        if (fs.existsSync(abs)) return pathToFileURL(abs).href;
    }
    const candidates = [
        path.resolve(projectRoot, 'vendor', 'stallion-mock.mjs'),
        path.resolve(projectRoot, '..', 'stallion', 'dist', 'stallion-mock.mjs'),
        path.join(home, 'stallion', 'dist', 'stallion-mock.mjs'),
    ];
    for (const cand of candidates) {
        if (fs.existsSync(cand)) return pathToFileURL(cand).href;
    }
    return null;
}

/**
 * Resolves Stallion HTTP server URL (default: http://127.0.0.1:8080).
 */
export function resolveStallionUrl({
    override = process.env.STALLION_URL,
    registryUrl = null,
} = {}) {
    return override || registryUrl || 'http://127.0.0.1:8080';
}

/**
 * Asynchronously loads the Stallion bridge module if available, or returns informative status.
 */
export async function loadStallionBridge(options = {}) {
    const url = resolveStallionModuleUrl(options);
    if (!url) {
        return {
            available: false,
            module: null,
            error: 'Stallion bridge module not found. Set CAVALRY_MCP_PATH or STALLION_MODULE environment variable.',
        };
    }
    try {
        const mod = await import(url);
        return { available: true, module: mod, url, error: null };
    } catch (err) {
        return {
            available: false,
            module: null,
            error: `Failed to import Stallion bridge at ${url}: ${err.message}`,
        };
    }
}

/**
 * Asynchronously loads the Stallion mock module if available.
 */
export async function loadStallionMock(options = {}) {
    const url = resolveStallionMockUrl(options);
    if (!url) {
        return {
            available: false,
            module: null,
            error: 'Stallion mock module not found. Set STALLION_MOCK environment variable.',
        };
    }
    try {
        const mod = await import(url);
        return { available: true, module: mod, url, error: null };
    } catch (err) {
        return {
            available: false,
            module: null,
            error: `Failed to import Stallion mock at ${url}: ${err.message}`,
        };
    }
}

/**
 * Returns complete configuration diagnostics.
 */
export function getConfigurationSummary(options = {}) {
    const projectRoot = resolveProjectRoot(options.projectRoot);
    const scriptsDir = resolveCavalryScriptsDir(options);
    const mcpPath = resolveCavalryMcpPath({ projectRoot, ...options });
    const stallionModuleUrl = resolveStallionModuleUrl({ cavalryMcpPath: mcpPath, ...options });
    const stallionMockUrl = resolveStallionMockUrl({ projectRoot, ...options });
    const stallionUrl = resolveStallionUrl(options);

    return {
        projectRoot,
        scriptsDir,
        scriptsDirExists: fs.existsSync(scriptsDir),
        cavalryMcpPath: mcpPath,
        cavalryMcpAvailable: Boolean(mcpPath && fs.existsSync(mcpPath)),
        stallionModuleUrl,
        stallionModuleAvailable: Boolean(stallionModuleUrl),
        stallionMockUrl,
        stallionMockAvailable: Boolean(stallionMockUrl),
        stallionUrl,
    };
}
