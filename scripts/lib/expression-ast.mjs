/**
 * AE expression → AST parser (`scripts/lib/expression-ast.mjs`).
 *
 * A self-contained tokenizer and recursive-descent parser for the After
 * Effects expression subset the translator lowers into Cavalry node graphs:
 * numeric/boolean/string literals, arrays, member access, call/index access,
 * the arithmetic/comparison/logical operators, ternaries and `var`/`return`
 * statements. No dependencies — the repo stays zero-dependency by contract.
 *
 * Node shapes:
 *   { type: 'Program', body: [...] }
 *   { type: 'VarDeclaration', name, init }
 *   { type: 'ReturnStatement', argument }
 *   { type: 'ExpressionStatement', expression }
 *   { type: 'CallExpression', callee, arguments }
 *   { type: 'MemberExpression', object, property, computed }
 *   { type: 'IndexExpression', object, index }
 *   { type: 'Identifier' | 'Literal' | 'ArrayExpression' | 'BinaryExpression'
 *     | 'UnaryExpression' | 'LogicalExpression' | 'ConditionalExpression' }
 */

const PUNCTUATORS = ['===', '!==', '==', '!=', '<=', '>=', '&&', '||', '++', '--', '+', '-', '*', '/', '%', '<', '>', '(', ')', '[', ']', '{', '}', ',', '.', ';', '?', ':', '='];
const KEYWORDS = new Set(['var', 'let', 'const', 'return', 'function', 'if', 'else', 'true', 'false', 'null']);

export class SyntaxError extends Error {
    constructor(message, offset) {
        super(message);
        this.name = 'ExpressionSyntaxError';
        this.offset = offset;
    }
}

/** Tokenize an AE expression source into { type, value, offset } tokens. */
export function tokenize(source) {
    const tokens = [];
    let i = 0;
    const push = (type, value) => tokens.push({ type, value, offset: i });
    while (i < source.length) {
        const ch = source[i];
        if (/\s/.test(ch)) { i += 1; continue; }
        if (ch === '/' && source[i + 1] === '/') {
            while (i < source.length && source[i] !== '\n') i += 1;
            continue;
        }
        if (ch === '/' && source[i + 1] === '*') {
            const end = source.indexOf('*/', i + 2);
            if (end === -1) throw new SyntaxError('Unterminated block comment', i);
            i = end + 2;
            continue;
        }
        if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(source[i + 1] ?? ''))) {
            const start = i;
            while (i < source.length && /[0-9.eE]/.test(source[i])) i += 1;
            push('number', Number(source.slice(start, i)));
            continue;
        }
        if (/[A-Za-z_$]/.test(ch)) {
            const start = i;
            while (i < source.length && /[A-Za-z0-9_$]/.test(source[i])) i += 1;
            const word = source.slice(start, i);
            push(KEYWORDS.has(word) ? 'keyword' : 'identifier', word);
            continue;
        }
        if (ch === '"' || ch === "'") {
            const quote = ch;
            const start = i;
            i += 1;
            let value = '';
            while (i < source.length && source[i] !== quote) {
                if (source[i] === '\\') { value += source[i + 1]; i += 2; continue; }
                value += source[i];
                i += 1;
            }
            if (source[i] !== quote) throw new SyntaxError('Unterminated string literal', start);
            i += 1;
            tokens.push({ type: 'string', value, offset: start });
            continue;
        }
        const punct = PUNCTUATORS.find((p) => source.startsWith(p, i));
        if (!punct) throw new SyntaxError(`Unexpected character ${JSON.stringify(ch)} at ${i}`, i);
        i += punct.length;
        push('punct', punct);
    }
    tokens.push({ type: 'eof', value: null, offset: source.length });
    return tokens;
}

/** Parse a full expression program (statements allowed). */
export function parseExpression(source) {
    const tokens = tokenize(source);
    let pos = 0;
    const peek = () => tokens[pos];
    const at = (type, value) => tokens[pos].type === type && (value === undefined || tokens[pos].value === value);
    const eat = (type, value) => {
        // No type argument consumes the next token unconditionally.
        if (type !== undefined && !at(type, value)) {
            throw new SyntaxError(`Expected ${value ?? type} but found ${JSON.stringify(tokens[pos].value)} at ${tokens[pos].offset}`, tokens[pos].offset);
        }
        return tokens[pos++];
    };

    function parseProgram() {
        const body = [];
        while (!at('eof')) body.push(parseStatement());
        return { type: 'Program', body };
    }

    function parseStatement() {
        if (at('keyword', 'var') || at('keyword', 'let') || at('keyword', 'const')) {
            const keyword = eat('keyword').value;
            const name = eat('identifier').value;
            let init = null;
            if (at('punct', '=')) { eat('punct', '='); init = parseExpressionAst(); }
            if (at('punct', ';')) eat('punct', ';');
            return { type: 'VarDeclaration', kind: keyword, name, init };
        }
        if (at('keyword', 'return')) {
            eat('keyword', 'return');
            let argument = null;
            if (!at('punct', ';') && !at('eof')) argument = parseExpressionAst();
            if (at('punct', ';')) eat('punct', ';');
            return { type: 'ReturnStatement', argument };
        }
        const expression = parseExpressionAst();
        if (at('punct', ';')) eat('punct', ';');
        return { type: 'ExpressionStatement', expression };
    }

    function parseExpressionAst() {
        return parseConditional();
    }

    function parseConditional() {
        const test = parseLogicalOr();
        if (at('punct', '?')) {
            eat('punct', '?');
            const consequent = parseConditional();
            eat('punct', ':');
            const alternate = parseConditional();
            return { type: 'ConditionalExpression', test, consequent, alternate };
        }
        return test;
    }

    function parseLogicalOr() {
        let left = parseLogicalAnd();
        while (at('punct', '||')) { eat('punct', '||'); left = { type: 'LogicalExpression', operator: '||', left, right: parseLogicalAnd() }; }
        return left;
    }

    function parseLogicalAnd() {
        let left = parseEquality();
        while (at('punct', '&&')) { eat('punct', '&&'); left = { type: 'LogicalExpression', operator: '&&', left, right: parseEquality() }; }
        return left;
    }

    function parseEquality() {
        let left = parseRelational();
        while (at('punct', '==') || at('punct', '===') || at('punct', '!=') || at('punct', '!==')) {
            const operator = eat('punct').value;
            left = { type: 'BinaryExpression', operator, left, right: parseRelational() };
        }
        return left;
    }

    function parseRelational() {
        let left = parseAdditive();
        while (at('punct', '<') || at('punct', '>') || at('punct', '<=') || at('punct', '>=')) {
            const operator = eat('punct').value;
            left = { type: 'BinaryExpression', operator, left, right: parseAdditive() };
        }
        return left;
    }

    function parseAdditive() {
        let left = parseMultiplicative();
        while (at('punct', '+') || at('punct', '-')) {
            const operator = eat('punct').value;
            left = { type: 'BinaryExpression', operator, left, right: parseMultiplicative() };
        }
        return left;
    }

    function parseMultiplicative() {
        let left = parseUnary();
        while (at('punct', '*') || at('punct', '/') || at('punct', '%')) {
            const operator = eat('punct').value;
            left = { type: 'BinaryExpression', operator, left, right: parseUnary() };
        }
        return left;
    }

    function parseUnary() {
        if (at('punct', '-') || at('punct', '+') || at('punct', '!')) {
            const operator = eat('punct').value;
            return { type: 'UnaryExpression', operator, argument: parseUnary() };
        }
        return parsePostfix();
    }

    function parsePostfix() {
        let node = parsePrimary();
        for (;;) {
            if (at('punct', '.')) {
                eat('punct', '.');
                const property = eat('identifier').value;
                node = { type: 'MemberExpression', object: node, property, computed: false };
            } else if (at('punct', '[')) {
                eat('punct', '[');
                const index = parseExpressionAst();
                eat('punct', ']');
                node = { type: 'IndexExpression', object: node, index };
            } else if (at('punct', '(')) {
                eat('punct', '(');
                const args = [];
                if (!at('punct', ')')) {
                    do {
                        args.push(parseExpressionAst());
                    } while (at('punct', ',') && eat('punct', ','));
                }
                eat('punct', ')');
                node = { type: 'CallExpression', callee: node, arguments: args };
            } else break;
        }
        return node;
    }

    function parsePrimary() {
        if (at('number')) return { type: 'Literal', value: eat('number').value };
        if (at('string')) return { type: 'Literal', value: eat('string').value };
        if (at('keyword', 'true')) { eat('keyword', 'true'); return { type: 'Literal', value: true }; }
        if (at('keyword', 'false')) { eat('keyword', 'false'); return { type: 'Literal', value: false }; }
        if (at('keyword', 'null')) { eat('keyword', 'null'); return { type: 'Literal', value: null }; }
        if (at('punct', '(')) {
            eat('punct', '(');
            const inner = parseExpressionAst();
            eat('punct', ')');
            return inner;
        }
        if (at('punct', '[')) {
            eat('punct', '[');
            const elements = [];
            if (!at('punct', ']')) {
                do {
                    elements.push(parseExpressionAst());
                } while (at('punct', ',') && eat('punct', ','));
            }
            eat('punct', ']');
            return { type: 'ArrayExpression', elements };
        }
        if (at('punct', '-')) {
            eat('punct', '-');
            return { type: 'UnaryExpression', operator: '-', argument: parseUnary() };
        }
        if (at('identifier') || at('keyword')) {
            const name = eat().value;
            return { type: 'Identifier', name };
        }
        throw new SyntaxError(`Unexpected token ${JSON.stringify(peek().value)} at ${peek().offset}`, peek().offset);
    }

    return parseProgram();
}

/**
 * Walk every node of a parsed program (depth-first, pre-order). The visitor
 * receives each node; returning a truthy value prunes that subtree.
 */
export function walkAst(node, visitor) {
    if (!node || typeof node !== 'object') return;
    if (visitor(node) === true) return;
    for (const key of Object.keys(node)) {
        const value = node[key];
        if (Array.isArray(value)) {
            for (const item of value) walkAst(item, visitor);
        } else if (value && typeof value === 'object' && typeof value.type === 'string') {
            walkAst(value, visitor);
        }
    }
}

/** Extract the last `ReturnStatement` argument, or the final expression statement. */
export function programTailExpression(program) {
    for (let i = program.body.length - 1; i >= 0; i--) {
        const statement = program.body[i];
        if (statement.type === 'ReturnStatement' && statement.argument) return statement.argument;
        if (statement.type === 'ExpressionStatement') return statement.expression;
    }
    return null;
}
