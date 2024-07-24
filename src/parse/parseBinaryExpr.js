import { oneOf, symbol } from "@helios-lang/compiler-utils"
import {
    BINARY_SYMBOLS_MAP,
    BinaryExpr,
    Expr,
    VoidExpr
} from "../expressions/index.js"
import { ParseContext } from "./ParseContext.js"

/**
 * @typedef {import("./ValueExprParser.js").ValueExprParser} ValueExprParser
 */

export const anyBinOp = oneOf(
    Object.keys(BINARY_SYMBOLS_MAP).map((s) => symbol(s))
)

/**
 * @param {ValueExprParser} parseValueExpr
 * @param {string} op1
 * @param {...string} ops
 * @returns {ValueExprParser}
 */
export function makeBinaryExprParser(parseValueExpr, op1, ...ops) {
    ops = [op1].concat(ops ?? [])
    const anyOp = oneOf(ops.map((op) => symbol(op)))

    /**
     * @param {ParseContext} ctx
     * @param {number} precedence
     * @returns {Expr}
     */
    function parseBinaryExpr(ctx, precedence) {
        const r = ctx.reader

        let m

        if ((m = r.findLastMatch(anyOp))) {
            const [before, op] = m

            if (before.isEof()) {
                r.endMatch(false)
                r.unreadToken()
                return parseValueExpr(ctx, precedence + 1)
            }

            const beforeExpr = parseValueExpr(
                ctx.withReader(before),
                precedence
            )

            /**
             * @type {Expr}
             */
            let afterExpr = new VoidExpr(op.site)

            if (r.isEof()) {
                ctx.errors.syntax(
                    op.site,
                    `invalid syntax, '${op.value}' can't be used as a post-unary operator`
                )
            } else {
                afterExpr = parseValueExpr(ctx.atSite(op.site), precedence + 1)
            }

            return new BinaryExpr(op, beforeExpr, afterExpr)
        } else {
            r.endMatch(false)
            return parseValueExpr(ctx, precedence + 1)
        }
    }

    return parseBinaryExpr
}
