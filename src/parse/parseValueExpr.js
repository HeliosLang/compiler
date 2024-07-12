import { Expr } from "../expressions/index.js"
import { ParseContext } from "./ParseContext.js"
import { makePipedExprParser } from "./parsePipedExpr.js"
import { makeAssignOrChainExprParser } from "./parseAssignOrChainExpr.js"
import { makeBinaryExprParser } from "./parseBinaryExpr.js"
import { makeUnaryExprParser } from "./parseUnaryExpr.js"
import { makeChainedExprParser } from "./parseChainedExpr.js"

/**
 * @typedef {import("./ValueExprParser.js").ValueExprParser} ValueExprParser
 */

/**
 * @type {ValueExprParser[]}
 */
const valueExprParsers = [
    /**
     * 0: lowest precendence is assignment
     */
    makeAssignOrChainExprParser(parseValueExpr),
    /**
     * 1: piped expression
     */
    makePipedExprParser(parseValueExpr),
    /**
     * 2: logical 'or' operator
     */
    makeBinaryExprParser(parseValueExpr, "||"),
    /**
     * 3: logical 'and' operator
     */
    makeBinaryExprParser(parseValueExpr, "&&"),
    /**
     * 4: 'eq' or 'neq' operators
     */
    makeBinaryExprParser(parseValueExpr, "==", "!="),
    /**
     * 5: comparison operators
     */
    makeBinaryExprParser(parseValueExpr, "<", "<=", ">", ">="),
    /**
     * 6: addition and subtraction operators
     */
    makeBinaryExprParser(parseValueExpr, "+", "-"),
    /**
     * 7: multiplication, division and remainder operators
     */
    makeBinaryExprParser(parseValueExpr, "*", "/", "%"),
    /**
     * 8: logical 'not', negation unary operators
     */
    makeUnaryExprParser(parseValueExpr, "!", "+", "-"),
    /**
     * 9: variables or literal values chained with:
     *   - (enum)member access
     *   - indexing
     *   - calling
     */
    makeChainedExprParser(parseValueExpr)
]

/**
 * @param {ParseContext} ctx
 * @param {number} precedence
 * @returns {Expr}
 */
export function parseValueExpr(ctx, precedence = 0) {
    return valueExprParsers[precedence](ctx, precedence)
}
