import {
    Group,
    TokenReader,
    TokenSite,
    oneOf,
    symbol
} from "@helios-lang/compiler-utils"
import { None } from "@helios-lang/type-utils"
import { CallExpr, CallArgExpr, Expr } from "../expressions/index.js"
import { ParseContext } from "./ParseContext.js"
import { anyBinOp } from "./parseBinaryExpr.js"

/**
 * @typedef {import("./ValueExprParser.js").ValueExprParser} ValueExprParser
 */

const anyPipeOp = oneOf([symbol("."), anyBinOp])

/**
 * @param {ValueExprParser} parseValueExpr
 * @returns {ValueExprParser}
 */
export function makePipedExprParser(parseValueExpr) {
    /**
     * @param {ParseContext} ctx
     * @param {number} precedence
     * @returns {Expr}
     */
    function parsePipedExpr(ctx, precedence) {
        const r = ctx.reader

        let m

        if ((m = r.findLastMatch(symbol("|")))) {
            const [before, pipe] = m

            if (r.isEof()) {
                ctx.errors.syntax(
                    pipe.site,
                    `invalid syntax, '|' can't be used as a post-unary operator`
                )

                ctx = ctx.withReader(before)
            } else if (before.isEof()) {
                ctx.errors.syntax(
                    pipe.site,
                    `invalid syntax, '|' can't be used as a pref-unary operator`
                )
            } else {
                if ((m = r.matches(anyPipeOp))) {
                    const site = m.site

                    // TODO: this is dirty, get rid of this
                    if (!(site instanceof TokenSite)) {
                        throw new Error("unexpected")
                    }

                    const tokens = [new Group("(", [before.tokens], [], site)]

                    const rr = new TokenReader(tokens, ctx.errors)

                    return parseValueExpr(ctx.withReader(rr), precedence + 1)
                } else {
                    r.endMatch(false)

                    const beforeExpr = parseValueExpr(
                        ctx.withReader(before),
                        precedence
                    )
                    const afterExpr = parseValueExpr(
                        ctx.atSite(pipe.site),
                        precedence + 1
                    )

                    return new CallExpr(pipe.site, afterExpr, [
                        new CallArgExpr(beforeExpr.site, None, beforeExpr)
                    ])
                }
            }
        } else {
            r.endMatch(false)
        }

        return parseValueExpr(ctx, precedence + 1)
    }

    return parsePipedExpr
}
