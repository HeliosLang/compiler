import { Word, group, symbol, word } from "@helios-lang/compiler-utils"
import { None } from "@helios-lang/type-utils"
import { DestructExpr, Expr } from "../expressions/index.js"
import { ParseContext } from "./ParseContext.js"
import { anyName } from "./parseName.js"
import { parseTypeExpr } from "./parseTypeExpr.js"

/**
 * @param {ParseContext} ctx
 * @returns {DestructExpr}
 */
export function parseDestructExpr(ctx) {
    const r = ctx.reader

    /**
     * @type {Word}
     */
    let name = new Word("_", ctx.currentSite)

    /**
     * @type {Option<Expr>}
     */
    let typeExpr = None

    /**
     * @type {DestructExpr[]}
     */
    let nestedDestructExprs = []

    /**
     * @type {boolean}
     */
    let nestedDestructIsTuple = false

    let m

    if ((m = r.matches(word("_")))) {
        r.end()

        return new DestructExpr(m)
    } else if ((m = r.matches(anyName, symbol(":")))) {
        const [n, colon] = m

        name = n
        ctx = ctx.atSite(colon.site)
    } else {
        r.endMatch(false)
    }

    if ((m = r.findNextMatch(group("(", { minLength: 2 })))) {
        const [other, g] = m

        other.end()

        nestedDestructExprs = g.fields.map((f) =>
            parseDestructExpr(ctx.atSite(g.site).withReader(f))
        )
        nestedDestructIsTuple = true
    } else if ((m = r.findNextMatch(group("{", { minLength: 1 })))) {
        const [typeReader, g] = m

        if (!typeReader.isEof()) {
            typeExpr = parseTypeExpr(ctx.withReader(typeReader))
            typeReader.end()
        }

        nestedDestructExprs = g.fields.map((f) =>
            parseDestructExpr(ctx.atSite(g.site).withReader(f))
        )
    } else {
        r.endMatch(false)

        typeExpr = parseTypeExpr(ctx)
    }

    r.end()

    return new DestructExpr(
        name,
        typeExpr,
        nestedDestructExprs,
        nestedDestructIsTuple
    )
}
