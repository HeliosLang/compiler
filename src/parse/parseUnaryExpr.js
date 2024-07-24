import { oneOf, symbol } from "@helios-lang/compiler-utils"
import { UnaryExpr } from "../expressions/index.js"
import { ParseContext } from "./ParseContext.js"

/**
 * @typedef {import("./ValueExprParser.js").ValueExprParser} ValueExprParser
 */

/**
 * @param {ValueExprParser} parseValueExpr
 * @param {string} op1
 * @param {...string} ops
 * @returns {ValueExprParser}
 */
export function makeUnaryExprParser(parseValueExpr, op1, ...ops) {
    ops = [op1].concat(ops ?? [])
    const anyOp = oneOf(ops.map((op) => symbol(op)))

    // default behaviour is right-to-left associative
    /**
     *
     * @param {ParseContext} ctx
     * @param {number} precedence
     * @returns
     */
    function parseUnaryExpr(ctx, precedence) {
        const r = ctx.reader

        let m

        if ((m = r.matches(anyOp))) {
            const rhs = parseValueExpr(ctx.atSite(m.site), precedence)

            return new UnaryExpr(m, rhs)
        } else {
            r.endMatch(false)

            return parseValueExpr(ctx, precedence + 1)
        }
    }

    return parseUnaryExpr
}
