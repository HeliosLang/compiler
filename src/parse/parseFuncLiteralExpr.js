import { group, symbol } from "@helios-lang/compiler-utils"
import {
    AnyValueExpr,
    Expr,
    FuncArg,
    FuncLiteralExpr
} from "../expressions/index.js"
import { ParseContext } from "./ParseContext.js"
import { parseTypeExpr } from "./parseTypeExpr.js"
import { parseName } from "./parseName.js"

/**
 * @import { GenericGroup, TokenReader } from "@helios-lang/compiler-utils"
 * @typedef {import("./ValueExprParser.js").ValueExprParser} ValueExprParser
 */

/**
 * @param {ValueExprParser} parseValueExpr
 * @returns {(ctx: ParseContext, args: GenericGroup<TokenReader>, methodOf?: Expr | undefined) => FuncLiteralExpr}
 */
export function makeFuncLiteralExprParser(parseValueExpr) {
    /**
     * Assumes that everything up to and including the arrow has been read already
     * @param {ParseContext} ctx
     * @param {GenericGroup<TokenReader>} ag
     * @param {Expr | undefined} methodOf
     * @returns {FuncLiteralExpr}
     */
    function parseFuncLiteralExpr(ctx, ag, methodOf = undefined) {
        const r = ctx.reader

        const args = ag.fields.map((f, i) => {
            const arg = parseFuncArg(ctx.inGroup(ag, i), i, methodOf)

            return arg
        })

        /**
         * @type {Expr | undefined}
         */
        let retTypeExpr = undefined

        /**
         * @type {Expr}
         */
        let bodyExpr = new AnyValueExpr(ctx.currentSite)

        let m

        if ((m = r.findNextMatch(group("{", { length: 1 })))) {
            const [retTypeReader, g] = m

            if (!retTypeReader.isEof()) {
                retTypeExpr = parseTypeExpr(ctx.withReader(retTypeReader))
            }

            bodyExpr = parseValueExpr(ctx.inGroup(g), 0)
        } else {
            r.endMatch()

            ctx.errors.syntax(
                ctx.currentSite,
                "expected '{...}' with single entry after '->'"
            )
        }

        return new FuncLiteralExpr(ctx.currentSite, args, retTypeExpr, bodyExpr)
    }

    /**
     * @param {ParseContext} ctx
     * @param {number} index
     * @param {Expr | undefined} methodOf
     * @returns {FuncArg}
     */
    function parseFuncArg(ctx, index, methodOf = undefined) {
        let r = ctx.reader

        let m

        const name = parseName(ctx)

        if (name.value == "self") {
            if (index != 0 || methodOf === undefined) {
                ctx.errors.syntax(name.site, "'self' is reserved")
            }
        }

        /**
         * @type {Expr | undefined}
         */
        let defaultValueExpr = undefined

        if ((m = r.findNextMatch(symbol("=")))) {
            const [before, equals] = m

            if (r.isEof()) {
                ctx.errors.syntax(equals.site, "expected expression after '='")
            } else {
                defaultValueExpr = parseValueExpr(ctx.atSite(equals.site), 0)
            }

            r = before
        } else {
            r.endMatch(false)
        }

        /**
         * @type {Expr | undefined}
         */
        let typeExpr = index == 0 && methodOf ? methodOf : undefined

        if ((m = r.matches(symbol(":")))) {
            typeExpr = parseTypeExpr(ctx.withReader(r))

            if (name.value == "self") {
                ctx.errors.syntax(m.site, "unexpected type for 'self'")
            }
        } else {
            r.endMatch(false)
            r.end()
        }

        return new FuncArg(name, typeExpr, defaultValueExpr)
    }

    return parseFuncLiteralExpr
}
