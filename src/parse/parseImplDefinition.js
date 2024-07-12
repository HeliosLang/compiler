import { oneOf, word } from "@helios-lang/compiler-utils"
import { Expr } from "../expressions/index.js"
import {
    ConstStatement,
    FuncStatement,
    ImplDefinition
} from "../statements/index.js"
import { parseConstStatement } from "./parseConstStatement.js"
import { parseFuncStatement } from "./parseFuncStatement.js"
import { ParseContext } from "./ParseContext.js"

export const anyImplKeyword = oneOf([word("const"), word("func")])

/**
 * @param {ParseContext} ctx
 * @param {Expr} selfTypeExpr
 * @returns {ImplDefinition}
 */
export function parseImplDefinition(ctx, selfTypeExpr) {
    const r = ctx.reader

    /**
     * @type {(ConstStatement | FuncStatement)[]}
     */
    const statements = []

    while (!r.isEof()) {
        let m

        if ((m = r.matches(word("const")))) {
            statements.push(parseConstStatement(ctx.atSite(m.site)))
        } else if ((m = r.matches(word("func")))) {
            statements.push(
                parseFuncStatement(ctx.atSite(m.site), selfTypeExpr)
            )
        } else {
            r.endMatch()
        }
    }

    return new ImplDefinition(selfTypeExpr, statements)
}
