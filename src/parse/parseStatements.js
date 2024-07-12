import { Statement } from "../statements/index.js"
import { ParseContext } from "./ParseContext.js"
import { anyTopLevelKeyword } from "./keywords.js"
import { parseConstStatement } from "./parseConstStatement.js"
import { parseEnumStatement } from "./parseEnumStatement.js"
import { parseFuncStatement } from "./parseFuncStatement.js"
import { parseImportStatements } from "./parseImportStatements.js"
import { parseStructStatement } from "./parseStructStatement.js"

/**
 * @typedef {import("./keywords.js").TopLevelKeyword} TopLevelKeyword
 */
/**
 * @typedef {(ctx: ParseContext, statements: Statement[]) => void} TopLevelParser
 */

/**
 * @satisfies {{[K in TopLevelKeyword]: TopLevelParser}}
 */
export const topLevelParsers = {
    const: (ctx, statements) => {
        statements.push(parseConstStatement(ctx))
    },
    struct: (ctx, statements) => {
        statements.push(parseStructStatement(ctx))
    },
    enum: (ctx, statements) => {
        statements.push(parseEnumStatement(ctx))
    },
    import: (ctx, statements) => {
        parseImportStatements(ctx).forEach((s) => statements.push(s))
    },
    func: (ctx, statements) => {
        statements.push(parseFuncStatement(ctx))
    }
}

/**
 * @param {ParseContext} ctx
 * @returns {Statement[]}
 */
export function parseStatements(ctx) {
    const r = ctx.reader

    /**
     * @type {Statement[]}
     */
    let statements = []

    while (!r.isEof()) {
        let m

        if ((m = r.matches(anyTopLevelKeyword))) {
            topLevelParsers[m.value](ctx.atSite(m.site), statements)
        } else {
            r.endMatch()
        }
    }

    return statements
}
