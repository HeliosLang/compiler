import { makeWord, group, symbol, word } from "@helios-lang/compiler-utils"
import { DestructExpr, Expr } from "../expressions/index.js"
import { ParseContext } from "./ParseContext.js"
import { anyName } from "./parseName.js"
import { parseTypeExpr } from "./parseTypeExpr.js"

/**
 * @import { Word } from "@helios-lang/compiler-utils"
 */

/**
 * @param {ParseContext} ctx
 * @param {number} switchingDepth - if <= 0 then prefer a plain assignment, if > 0 prefer a typeExpr
 * @returns {DestructExpr}
 */
export function parseDestructExpr(ctx, switchingDepth) {
    const r = ctx.reader

    /**
     * @type {Word}
     */
    let name = makeWord({ value: "_", site: ctx.currentSite })

    /**
     * @type {Expr | undefined}
     */
    let typeExpr = undefined

    /**
     * @type {DestructExpr[]}
     */
    let nestedDestructExprs = []

    /**
     * @type {boolean}
     */
    let nestedDestructIsTuple = false

    const isInAssign = switchingDepth <= 0
    let isNamed = false

    let m

    if ((m = r.matches(word("_")))) {
        r.end()

        return new DestructExpr(ctx.currentSite, m)
    } else if ((m = r.matches(anyName, symbol(":")))) {
        const [n, colon] = m

        name = n
        ctx = ctx.atSite(colon.site)
        isNamed = true
    } else {
        r.endMatch(false)
    }

    if ((m = r.findNextMatch(group("(", { minLength: 2 })))) {
        const [other, g] = m

        other.end()

        nestedDestructExprs = g.fields.map((f) =>
            parseDestructExpr(
                ctx.atSite(g.site).withReader(f),
                switchingDepth - 1
            )
        )
        nestedDestructIsTuple = true
    } else if ((m = r.findNextMatch(group("{", { minLength: 1 })))) {
        const [typeReader, g] = m

        if (!typeReader.isEof()) {
            typeExpr = parseTypeExpr(ctx.withReader(typeReader))
            typeReader.end()
        }

        nestedDestructExprs = g.fields.map((f) =>
            parseDestructExpr(ctx.atSite(g.site).withReader(f), 0)
        )
    } else if (isInAssign && !isNamed && (m = r.matches(anyName))) {
        name = m
    } else {
        r.endMatch(false)

        typeExpr = parseTypeExpr(ctx)
    }

    r.end()

    return new DestructExpr(
        ctx.currentSite,
        name,
        typeExpr,
        nestedDestructExprs,
        nestedDestructIsTuple
    )
}
