import {
    makeGroup,
    makeTokenReader,
    oneOf,
    symbol
} from "@helios-lang/compiler-utils"
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

                    const tokens = [
                        makeGroup({
                            kind: "(",
                            fields: [before.tokens],
                            separators: [],
                            site
                        })
                    ]

                    const rr = makeTokenReader({
                        tokens,
                        errors: ctx.errors,
                        ignoreNewlines: true
                    })

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
                        new CallArgExpr(beforeExpr.site, undefined, beforeExpr)
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
