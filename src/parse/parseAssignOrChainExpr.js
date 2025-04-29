import { symbol } from "@helios-lang/compiler-utils"
import {
    AnyValueExpr,
    AssignExpr,
    ChainExpr,
    Expr
} from "../expressions/index.js"
import { ParseContext } from "./ParseContext.js"
import { parseDestructExpr } from "./parseDestructExpr.js"

/**
 * @import {TokenReader} from "@helios-lang/compiler-utils"
 * @import {ValueExprParser} from "./ValueExprParser.js"
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
        const r = insertSemicolons(ctx.reader)
        ctx = ctx.withReader(r)

        let m

        if ((m = r.findNextMatch(symbol(";")))) {
            const [upstreamReader, scolon] = m

            const downstreamExpr = ctx.reader.isEof()
                ? undefined
                : parseValueExpr(ctx.atSite(scolon.site), precedence)

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

                if (!downstreamExpr) {
                    ctx.errors.syntax(
                        equals.site,
                        "expected expression after assignment"
                    )
                }

                return new AssignExpr(
                    equals.site,
                    scolon.site,
                    lhs,
                    upstreamExpr,
                    downstreamExpr ?? new AnyValueExpr(scolon.site)
                )
            } else {
                upstreamReader.endMatch(false)

                if (upstreamReader.isEof()) {
                    ctx.errors.syntax(
                        scolon.site,
                        "expected expression before ';'"
                    )

                    if (!downstreamExpr) {
                        return new AnyValueExpr(scolon.site)
                    } else {
                        return new ChainExpr(
                            scolon.site,
                            new AnyValueExpr(scolon.site),
                            downstreamExpr
                        )
                    }
                } else {
                    const upstreamExpr = parseValueExpr(
                        ctx.withReader(upstreamReader),
                        precedence + 1
                    )

                    upstreamReader.end()

                    if (!downstreamExpr) {
                        return upstreamExpr
                    } else {
                        return new ChainExpr(
                            scolon.site,
                            upstreamExpr,
                            downstreamExpr
                        )
                    }
                }
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

/**
 * @param {TokenReader} reader
 * @returns {TokenReader}
 */
function insertSemicolons(reader) {
    if (reader.pos != 0) {
        return reader
    }

    return reader.insertSemicolons([
        "+",
        "-",
        "=",
        ";",
        "*",
        "/",
        ".",
        ":",
        "::",
        "&&",
        "||",
        "<",
        "<=",
        ">",
        ">=",
        "!=",
        "==",
        "%",
        "else"
    ])
}
