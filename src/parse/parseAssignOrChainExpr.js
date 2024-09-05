import { symbol } from "@helios-lang/compiler-utils"
import { AssignExpr, ChainExpr, Expr } from "../expressions/index.js"
import { ParseContext } from "./ParseContext.js"
import { parseDestructExpr } from "./parseDestructExpr.js"

/**
 * @typedef {import("./ValueExprParser.js").ValueExprParser} ValueExprParser
 */

/**
 * @param {ValueExprParser} parseValueExpr
 * @returns {ValueExprParser}
 */
export function makeAssignOrChainExprParser(parseValueExpr) {
    /**
     * @param {ParseContext} ctx
     * @param {number} precedence
     * @returns {Expr}
     */
    function parseAssignOrChainExpr(ctx, precedence) {
        const r = ctx.reader

        let m

        if ((m = r.findNextMatch(symbol(";")))) {
            const [upstreamReader, scolon] = m

            const downstreamExpr = parseValueExpr(
                ctx.atSite(scolon.site),
                precedence
            )

            if ((m = upstreamReader.findNextMatch(symbol("=")))) {
                const [lhsReader, equals] = m
                const lhs = parseDestructExpr(
                    ctx.atSite(equals.site).withReader(lhsReader),
                    0
                )
                const upstreamExpr = parseValueExpr(
                    ctx.withReader(upstreamReader),
                    precedence + 1
                )

                return new AssignExpr(
                    equals.site,
                    lhs,
                    upstreamExpr,
                    downstreamExpr
                )
            } else {
                upstreamReader.endMatch(false)

                const upstreamExpr = parseValueExpr(
                    ctx.withReader(upstreamReader),
                    precedence + 1
                )

                upstreamReader.end()

                return new ChainExpr(scolon.site, upstreamExpr, downstreamExpr)
            }
        } else {
            if ((m = r.findNextMatch(symbol("=")))) {
                const [_, equals] = m
                ctx.errors.syntax(equals.site, "invalid assignment syntax")
            } else {
                r.endMatch(false)
            }

            return parseValueExpr(ctx, precedence + 1)
        }
    }

    return parseAssignOrChainExpr
}
