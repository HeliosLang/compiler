import { anyWord, group, symbol, word } from "@helios-lang/compiler-utils"
import {
    AnyTypeExpr,
    Expr,
    FuncArgTypeExpr,
    FuncTypeExpr,
    IteratorTypeExpr,
    ListTypeExpr,
    MapTypeExpr,
    OptionTypeExpr,
    ParametricExpr,
    PathExpr,
    TupleTypeExpr,
    TypeRefExpr,
    VoidTypeExpr
} from "../expressions/index.js"
import { ParseContext } from "./ParseContext.js"

/**
 * @import { GenericGroup, TokenReader, Word } from "@helios-lang/compiler-utils"
 */

/**
 * @param {ParseContext} ctx
 * @returns {Expr}
 */
export function parseTypeExpr(ctx) {
    /**
     * @type {Expr | undefined}
     */
    let typeExpr = undefined

    const r = ctx.reader

    let m

    while (!r.isEof()) {
        if (!typeExpr) {
            if ((m = r.matches(group("[", { length: 0 })))) {
                const itemTypeExpr = parseTypeExpr(ctx)

                typeExpr = new ListTypeExpr(m.site, itemTypeExpr)
            } else if (
                (m = r.matches(word("Map"), group("[", { length: 1 })))
            ) {
                const [kw, g] = m
                const keyTypeExpr = parseTypeExpr(
                    ctx.atSite(g.site).withReader(g.fields[0])
                )
                const valueTypeExpr = parseTypeExpr(ctx.atSite(kw.site))

                typeExpr = new MapTypeExpr(kw.site, keyTypeExpr, valueTypeExpr)
            } else if (
                (m = r.matches(word("Option"), group("[", { length: 1 })))
            ) {
                const [kw, g] = m
                const someTypeExpr = parseTypeExpr(
                    ctx.atSite(g.site).withReader(g.fields[0])
                )

                typeExpr = new OptionTypeExpr(kw.site, someTypeExpr)
            } else if (
                (m = r.matches(word("Iterator"), group("[", { minLength: 1 })))
            ) {
                const [kw, g] = m
                const itemTypeExprs = g.fields.map((f) =>
                    parseTypeExpr(ctx.atSite(kw.site).withReader(f))
                )

                typeExpr = new IteratorTypeExpr(kw.site, itemTypeExprs)
            } else if (
                (m = r.matches(
                    group("[", { minLength: 1 }),
                    group("("),
                    symbol("->")
                ))
            ) {
                const [pg, ag, arrow] = m
                const paramExprs = pg.fields.map((f) =>
                    parseTypeExpr(ctx.atSite(pg.site).withReader(f))
                )
                const argExprs = parseFuncArgTypes(ctx, ag)
                const retTypeExpr = parseTypeExpr(ctx.atSite(arrow.site))

                typeExpr = new ParametricExpr(
                    pg.site,
                    new FuncTypeExpr(arrow.site, argExprs, retTypeExpr),
                    paramExprs
                )

                r.end()
            } else if ((m = r.matches(group("("), symbol("->")))) {
                const [ag, arrow] = m
                const argExprs = parseFuncArgTypes(ctx, ag)
                const retTypeExpr = parseTypeExpr(ctx.atSite(arrow.site))

                typeExpr = new FuncTypeExpr(arrow.site, argExprs, retTypeExpr)

                r.end()
            } else if ((m = r.matches(group("(", { minLength: 2 })))) {
                const entryExprs = m.fields.map((f) =>
                    parseTypeExpr(ctx.atSite(m.site).withReader(f))
                )

                typeExpr = new TupleTypeExpr(m.site, entryExprs)

                r.end()
            } else if ((m = r.matches(group("(", { length: 0 })))) {
                typeExpr = new VoidTypeExpr(m.site)

                r.end()
            } else if ((m = r.matches(anyWord))) {
                typeExpr = new TypeRefExpr(m)
            } else {
                r.endMatch()

                r.end()
            }
        } else {
            if ((m = r.matches(symbol("::"), anyWord))) {
                const [dcolon, w] = m
                typeExpr = new PathExpr(dcolon.site, typeExpr, w)
            } else if ((m = r.matches(group("[", { minLength: 1 })))) {
                const paramExprs = m.fields.map((f) =>
                    parseTypeExpr(ctx.atSite(m.site).withReader(f))
                )

                typeExpr = new ParametricExpr(m.site, typeExpr, paramExprs)
            } else {
                r.endMatch()

                r.end()
            }
        }
    }

    return typeExpr ?? new AnyTypeExpr(ctx.currentSite)
}

/**
 * @param {ParseContext} ctx
 * @param {GenericGroup<TokenReader>} ag
 * @returns {FuncArgTypeExpr[]}
 */
function parseFuncArgTypes(ctx, ag) {
    const argExprs = ag.fields.map((f) =>
        parseFuncArgType(ctx.atSite(ag.site).withReader(f))
    )

    if (
        argExprs.some((a) => a.isNamed()) &&
        argExprs.some((a) => !a.isNamed())
    ) {
        ctx.errors.syntax(
            ag.site,
            "can't mix named and unnamed args in a function type"
        )
    }

    if (
        argExprs.some(
            (a, i) =>
                a.isOptional() &&
                i < argExprs.length - 1 &&
                !argExprs[i + 1].isOptional()
        )
    ) {
        ctx.errors.syntax(ag.site, "optional arg not at end")
    }

    return argExprs
}

/**
 * @param {ParseContext} ctx
 * @returns {FuncArgTypeExpr}
 */
function parseFuncArgType(ctx) {
    const r = ctx.reader

    /**
     * @type {Word | undefined}
     */
    let name = undefined

    /**
     * @type {Expr}
     */
    let typeExpr

    let optional = false

    let m

    if ((m = r.matches(anyWord, symbol(":"), symbol("?")))) {
        const [n, colon] = m
        name = n
        typeExpr = parseTypeExpr(ctx.atSite(colon.site))
        optional = true
    } else if ((m = r.matches(anyWord, symbol(":")))) {
        const [n, colon] = m
        name = n
        typeExpr = parseTypeExpr(ctx.atSite(colon.site))
    } else {
        typeExpr = parseTypeExpr(ctx)
    }

    return new FuncArgTypeExpr(ctx.currentSite, name, typeExpr, optional)
}
