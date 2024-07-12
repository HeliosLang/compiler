import {
    StringLiteral,
    Word,
    group,
    oneOf,
    strlit,
    word
} from "@helios-lang/compiler-utils"
import {
    ImportFromStatement,
    ImportModuleStatement
} from "../statements/index.js"
import { ParseContext } from "./ParseContext.js"
import { anyName } from "./parseName.js"
import { None, expectSome } from "@helios-lang/type-utils"

/**
 * @param {ParseContext} ctx
 * @returns {(ImportFromStatement | ImportModuleStatement)[]}
 */
export function parseImportStatements(ctx) {
    const r = ctx.reader

    let m

    const anyPath = ctx.importPathTranslator
        ? oneOf([anyName, strlit()])
        : anyName

    if ((m = r.matches(group("{", { minLength: 1 }), word("from"), anyPath))) {
        const [braces, kw, path] = m

        const moduleName = translateImportPath(ctx, path)

        if (!moduleName) {
            return []
        }

        return braces.fields.reduce((lst, f) => {
            if ((m = f.matches(anyName, word("as"), anyName))) {
                const [origName, kw, newName] = m
                f.end()

                lst.push(
                    new ImportFromStatement(
                        origName.site,
                        newName,
                        origName,
                        moduleName
                    )
                )
            } else if ((m = f.matches(anyName))) {
                f.end()

                lst.push(new ImportFromStatement(m.site, m, m, moduleName))
            } else {
                f.endMatch()
                f.end()
            }

            return lst
        }, /** @type {ImportFromStatement[]} */ ([]))
    } else if ((m = r.matches(anyName))) {
        return [new ImportModuleStatement(ctx.currentSite, m)]
    } else {
        r.endMatch()
        return []
    }
}

/**
 *
 * @param {ParseContext} ctx
 * @param {Word | StringLiteral} path
 * @returns {Option<Word>}
 */
function translateImportPath(ctx, path) {
    if (path instanceof StringLiteral) {
        const moduleNameStr = expectSome(ctx.importPathTranslator)(path)

        if (moduleNameStr) {
            return new Word(moduleNameStr, path.site)
        } else {
            ctx.errors.syntax(path.site, `invalid module path '${path.value}'`)

            return None
        }
    } else {
        return path
    }
}
