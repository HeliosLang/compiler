import { Group, TokenReader, group, symbol } from "@helios-lang/compiler-utils"
import {
    AnyValueExpr,
    Expr,
    FuncArg,
    FuncLiteralExpr
} from "../expressions/index.js"
import { ParseContext } from "./ParseContext.js"
import { None, isNone } from "@helios-lang/type-utils"
import { parseTypeExpr } from "./parseTypeExpr.js"
import { anyName, parseName } from "./parseName.js"

/**
 * @typedef {import("./ValueExprParser.js").ValueExprParser} ValueExprParser
 */

/**
 * @param {ValueExprParser} parseValueExpr
 * @returns {(ctx: ParseContext, args: Group<TokenReader>, methodOf?: Option<Expr>) => FuncLiteralExpr}
 */
export function makeFuncLiteralExprParser(parseValueExpr) {
    /**
     * Assumes that everything up to and including the arrow has been read already
     * @param {ParseContext} ctx
     * @param {Group<TokenReader>} ag
     * @param {Option<Expr>} methodOf
     * @returns {FuncLiteralExpr}
     */
    function parseFuncLiteralExpr(ctx, ag, methodOf = None) {
        const r = ctx.reader

        const args = ag.fields.map((f, i) => {
            const arg = parseFuncArg(ctx.inGroup(ag, i), i, methodOf)

            return arg
        })

        /**
         * @type {Option<Expr>}
         */
        let retTypeExpr = None

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
     * @param {Option<Expr>} methodOf
     * @returns {FuncArg}
     */
    function parseFuncArg(ctx, index, methodOf = None) {
        let r = ctx.reader

        let m

        const name = parseName(ctx)

        if (name.value == "self") {
            if (index != 0 || isNone(methodOf)) {
                ctx.errors.syntax(name.site, "'self' is reserved")
            }
        }

        /**
         * @type {Option<Expr>}
         */
        let defaultValueExpr = None

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
         * @type {Option<Expr>}
         */
        let typeExpr = index == 0 && methodOf ? methodOf : None

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
