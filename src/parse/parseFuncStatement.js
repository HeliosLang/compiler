import { group, symbol } from "@helios-lang/compiler-utils"
import { AnyValueExpr, Expr, FuncLiteralExpr } from "../expressions/index.js"
import { FuncStatement } from "../statements/index.js"
import { ParseContext } from "./ParseContext.js"
import { makeFuncLiteralExprParser } from "./parseFuncLiteralExpr.js"
import { parseName } from "./parseName.js"
import { parseTypeParameters } from "./parseTypeParameters.js"
import { parseValueExpr } from "./parseValueExpr.js"

const parseFuncLiteralExpr = makeFuncLiteralExprParser(parseValueExpr)
/**
 * @param {ParseContext} ctx
 * @param {Expr | undefined} methodOf
 * @returns {FuncStatement}
 */
export function parseFuncStatement(ctx, methodOf = undefined) {
    const r = ctx.reader

    const name = parseName(ctx)

    const parameters = parseTypeParameters(ctx, true)

    let m

    let fnExpr = new FuncLiteralExpr(
        ctx.currentSite,
        [],
        undefined,
        new AnyValueExpr(ctx.currentSite)
    )

    if ((m = r.matches(group("("), symbol("->")))) {
        const [ag, arrow] = m

        fnExpr = parseFuncLiteralExpr(ctx.atSite(arrow.site), ag, methodOf)

        if (!fnExpr.retTypeExpr) {
            ctx.errors.syntax(arrow.site, "missing return type")
        }
    } else {
        r.endMatch()
    }

    return new FuncStatement(ctx.currentSite, name, parameters, fnExpr)
}
