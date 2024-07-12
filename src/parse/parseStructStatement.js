import {
    Word,
    group,
    oneOf,
    word,
    StringLiteral,
    symbol,
    strlit
} from "@helios-lang/compiler-utils"
import { None } from "@helios-lang/type-utils"
import { Expr, ParametricExpr, RefExpr } from "../expressions/index.js"
import {
    DataField,
    ImplDefinition,
    StructStatement,
    TypeParameters
} from "../statements/index.js"
import { ParseContext } from "./ParseContext.js"
import { parseImplDefinition, anyImplKeyword } from "./parseImplDefinition.js"
import { anyName, parseName } from "./parseName.js"
import { parseTypeParameters } from "./parseTypeParameters.js"
import { parseTypeExpr } from "./parseTypeExpr.js"
import { parseDataFields } from "./parseDataFields.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 */

/**
 * @param {ParseContext} ctx
 * @returns {StructStatement}
 */
export function parseStructStatement(ctx) {
    const r = ctx.reader
    const name = parseName(ctx)
    const parameters = parseTypeParameters(ctx)
    const selfTypeExpr = createSelfTypeExpr(name, parameters)

    /**
     * @type {DataField[]}
     */
    let fields = []

    let impl = new ImplDefinition(selfTypeExpr, [])

    let m

    if ((m = r.matches(group("{", { length: 1 })))) {
        const fr = m.fields[0]

        const dataReader = fr.readUntil(anyImplKeyword)

        fields = parseDataFields(
            ctx.atSite(m.site).withReader(dataReader),
            true
        )

        impl = parseImplDefinition(
            ctx.atSite(m.site).withReader(fr),
            selfTypeExpr
        )
    } else {
        r.endMatch()
    }

    return new StructStatement(ctx.currentSite, name, parameters, fields, impl)
}

/**
 * @param {Word} name
 * @param {TypeParameters} parameters
 * @returns {Expr}
 */
export function createSelfTypeExpr(name, parameters) {
    /**
     * @type {Expr}
     */
    let selfTypeExpr = new RefExpr(name)

    if (parameters.hasParameters()) {
        selfTypeExpr = new ParametricExpr(
            selfTypeExpr.site,
            selfTypeExpr,
            parameters.parameterNames.map(
                (n) => new RefExpr(new Word(n, selfTypeExpr.site))
            )
        )
    }

    return selfTypeExpr
}
