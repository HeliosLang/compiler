import { symbol } from "@helios-lang/compiler-utils"
import { Expr } from "../expressions/index.js"
import { ConstStatement } from "../statements/index.js"
import { anyTopLevelKeyword } from "./keywords.js"
import { ParseContext } from "./ParseContext.js"
import { parseName } from "./parseName.js"
import { parseTypeExpr } from "./parseTypeExpr.js"
import { parseValueExpr } from "./parseValueExpr.js"

/**
 * @param {ParseContext} ctx
 * @returns {ConstStatement}
 */
export function parseConstStatement(ctx) {
    let r = ctx.reader

    const name = parseName(ctx)

    r = r.readUntil(anyTopLevelKeyword)

    /**
     * @type {Expr | undefined}
     */
    let typeExpr = undefined

    /**
     * @type {Expr | undefined}
     */
    let valueExpr = undefined

    let m

    if ((m = r.findNextMatch(symbol("=")))) {
        const [typeReader, equals] = m

        typeExpr = typeReader.isEof()
            ? undefined
            : parseConstType(ctx.withReader(typeReader).atSite(name.site))
        valueExpr = parseValueExpr(ctx.withReader(r).atSite(equals.site))
    } else {
        r.endMatch(false)
        typeExpr = parseConstType(ctx.withReader(r).atSite(name.site))
    }

    return new ConstStatement(ctx.currentSite, name, typeExpr, valueExpr)
}

/**
 * @param {ParseContext} ctx
 * @returns {Expr | undefined}
 */
function parseConstType(ctx) {
    const r = ctx.reader

    /**
     * @type {Expr | undefined}
     */
    let typeExpr = undefined

    let m

    if ((m = r.matches(symbol(":")))) {
        typeExpr = parseTypeExpr(ctx.withReader(r).atSite(m.site))
    } else {
        r.endMatch()
    }

    r.end()

    return typeExpr
}
