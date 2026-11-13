/**
 * Shared Cavalry Effect Runtime Helpers & Error Contract
 * Standardized across all 10 AE effects for Cavalry 2.8+
 */

export const ERROR_CODES = {
    SUCCESS: 'SUCCESS',
    PARTIAL_SUCCESS: 'PARTIAL_SUCCESS',
    NO_SELECTION: 'NO_SELECTION',
    NODE_CREATION_FAILED: 'NODE_CREATION_FAILED',
    PARENTING_FAILED: 'PARENTING_FAILED',
    GROUPING_FAILED: 'GROUPING_FAILED',
    CONNECTION_FAILED: 'CONNECTION_FAILED',
    PRECOMPOSE_FAILED: 'PRECOMPOSE_FAILED',
    INVALID_PARAMS: 'INVALID_PARAMS',
    SHADER_COMPILE_FAILED: 'SHADER_COMPILE_FAILED',
    RUNTIME_EXCEPTION: 'RUNTIME_EXCEPTION',
};

export function clampNum(v, lo, hi, fb) {
    const n = Number(v);
    if (!Number.isFinite(n)) return fb;
    return n < lo ? lo : (n > hi ? hi : n);
}

export function resolveEnum(v, table, fb) {
    if (typeof v === 'number' && Number.isFinite(v)) return Math.round(v);
    if (v === null || v === undefined) return fb;
    const key = String(v).toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
    return Object.prototype.hasOwnProperty.call(table, key) ? table[key] : fb;
}

export function createErrorResult(effectName, code, message, extra = {}) {
    return {
        ok: false,
        partial: false,
        effect: effectName,
        code,
        error: message,
        appliedCount: 0,
        failedCount: extra.failedCount || 1,
        warnings: extra.warnings || [],
        results: extra.results || [],
        ...extra,
    };
}

export function createSuccessResult(effectName, results = [], extra = {}) {
    const hasFailures = results.some((r) => r && r.ok === false);
    const applied = results.filter((r) => r && r.ok !== false);
    const failed = results.filter((r) => r && r.ok === false);

    if (hasFailures && applied.length > 0) {
        return {
            ok: false,
            partial: true,
            effect: effectName,
            code: ERROR_CODES.PARTIAL_SUCCESS,
            error: `${failed.length} layer(s) failed out of ${results.length}`,
            appliedCount: applied.length,
            failedCount: failed.length,
            warnings: extra.warnings || [],
            results,
            ...extra,
        };
    }

    if (hasFailures && applied.length === 0) {
        return {
            ok: false,
            partial: false,
            effect: effectName,
            code: extra.code || ERROR_CODES.RUNTIME_EXCEPTION,
            error: extra.error || 'All operations failed',
            appliedCount: 0,
            failedCount: failed.length,
            warnings: extra.warnings || [],
            results,
            ...extra,
        };
    }

    return {
        ok: true,
        partial: false,
        effect: effectName,
        code: ERROR_CODES.SUCCESS,
        error: null,
        appliedCount: results.length,
        failedCount: 0,
        warnings: extra.warnings || [],
        results,
        ...extra,
    };
}
