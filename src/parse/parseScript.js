import {
    makeErrorCollector,
    makeSource,
    makeTokenReader,
    makeTokenizer,
    mergeSites
} from "@helios-lang/compiler-utils"
import { Statement } from "../statements/index.js"
import { ParseContext } from "./ParseContext.js"
import { extractName, parseHeader } from "./parseHeader.js"
import { parseStatements } from "./parseStatements.js"

/**
 * @import { ErrorCollector, Source, Token, TokenReader, Word } from "@helios-lang/compiler-utils"
 * @typedef {import("./ScriptPurpose.js").ScriptPurpose} ScriptPurpose
 */

const ENTRY_POINT_NAME = "main"

const AUTOMATIC_METHODS = [
    "__eq",
    "__neq",
    "copy",
    "show",
    "from_data",
    "from_data_safe",
    "is_valid_data",
    "serialize"
]

/**
 * `entryPointIndex` is the index in the `statements` array of the `main` function
 *   `entryPointIndex` is set to -1 for modules
 *   If a `main` function isn't found for a non-module script an error is thrown
 * @typedef {{
 *   purpose: Word
 *   name:    Word
 *   statements: Statement[]
 *   entryPointIndex: number
 * }} ParsedScript
 */

/**
 * @param {string | Source} src
 * @param {ErrorCollector | undefined} errorCollector
 * @returns {ParsedScript}
 */
export function parseScript(src, errorCollector = undefined) {
    const errors = errorCollector ?? makeErrorCollector()

    const reader = tokenizeScript(src, errors)

    const ctx = new ParseContext(reader)

    const [purpose, name] = parseHeader(ctx)

    const statements = parseStatements(ctx)

    const entryPointIndex = findEntryPoint(ctx, purpose, statements)

    if (!errorCollector) {
        errors.throw()
    }

    return {
        purpose,
        name,
        statements,
        entryPointIndex
    }
}

/**
 * @param {string | Source} rawSrc
 * @returns {Source}
 */
export function createSource(rawSrc) {
    return typeof rawSrc == "string"
        ? makeSource(rawSrc, { name: extractName(rawSrc) ?? "unknown" })
        : makeSource(rawSrc.content, { name: rawSrc.name }) // the input Source instance might use a class from a different package
}

/**
 * @param {string | Source} rawSrc
 * @param {ErrorCollector} errorCollector
 * @returns {TokenReader}
 */
function tokenizeScript(rawSrc, errorCollector) {
    const src = createSource(rawSrc)

    const tokenizer = makeTokenizer(src, {
        errorCollector: errorCollector
    })

    const ts = tokenizer.tokenize()

    return makeTokenReader({ tokens: ts, errors: errorCollector })
}

/**
 * Throws an error if main isn't found for a non-module
 * @param {ParseContext} ctx
 * @param {Word} purpose
 * @param {Statement[]} statements
 * @returns {number}
 */
function findEntryPoint({ errors }, purpose, statements) {
    const p = purpose.value

    if (p != "module") {
        if (statements.length == 0) {
            errors.syntax(purpose.site, "empty script")
        } else {
            let i = statements.findIndex(
                (s) => s.name.value === ENTRY_POINT_NAME
            )

            if (i == -1) {
                const firstStatementSite = statements[0].site
                const lastStatementSite = statements[statements.length - 1].site
                const scriptBodySite = mergeSites(
                    firstStatementSite,
                    lastStatementSite
                )

                errors.syntax(
                    scriptBodySite,
                    `entrypoint '${ENTRY_POINT_NAME}' not found`
                )
            }

            return i
        }
    }

    return -1
}
