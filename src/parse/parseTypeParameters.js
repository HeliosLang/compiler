import { group, symbol } from "@helios-lang/compiler-utils"
import { None } from "@helios-lang/type-utils"
import { Expr, RefExpr } from "../expressions/index.js"
import { TypeParameter, TypeParameters } from "../statements/index.js"
import { ParseContext } from "./ParseContext.js"
import { anyName } from "./parseName.js"

/**
 * @param {ParseContext} ctx
 * @param {boolean} isForFunc
 * @returns {TypeParameters}
 */
export function parseTypeParameters(ctx, isForFunc = false) {
    const r = ctx.reader

    let m

    if ((m = r.matches(group("[", { minLength: 1 })))) {
        const params = m.fields.reduce((lst, f) => {
            if ((m = r.matches(anyName))) {
                const name = m

                /**
                 * @type {Option<Expr>}
                 */
                let typeClassExpr = None

                if ((m = r.matches(symbol(":")))) {
                    typeClassExpr = parseTypeClassRef(ctx.atSite(m.site))
                } else {
                    r.endMatch(false)
                    r.end()
                }

                lst.push(new TypeParameter(name, typeClassExpr))
            } else {
                f.endMatch()
            }

            return lst
        }, /** @type {TypeParameter[]} */ ([]))

        return new TypeParameters(params, isForFunc)
    } else {
        r.endMatch(false)

        return new TypeParameters([], isForFunc)
    }
}

/**
 * @param {ParseContext} ctx
 * @returns {Option<Expr>}
 */
function parseTypeClassRef(ctx) {
    const r = ctx.reader

    let m

    if ((m = r.matches(anyName))) {
        r.end()
        return new RefExpr(m)
    } else {
        r.endMatch()
        r.end()

        return None
    }
}
