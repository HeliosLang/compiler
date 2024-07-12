import {
    ErrorCollector,
    Source,
    TokenReader,
    TokenSite,
    Tokenizer,
    Word
} from "@helios-lang/compiler-utils"
import { Statement } from "../statements/index.js"
import { ParseContext } from "./ParseContext.js"
import { extractName, parseHeader } from "./parseHeader.js"
import { parseStatements } from "./parseStatements.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Token} Token
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
 *   errors: ErrorCollector
 * }} ParsedScript
 */

/**
 * @param {string | Source} src
 * @returns {ParsedScript}
 */
export function parseScript(src) {
    const reader = tokenizeScript(src)
    const ctx = new ParseContext(reader)

    const [purpose, name] = parseHeader(ctx)

    const statements = parseStatements(ctx)

    const entryPointIndex = findEntryPoint(ctx, purpose, statements)

    return {
        purpose,
        name,
        statements,
        entryPointIndex,
        errors: ctx.errors
    }
}

/**
 * @param {string | Source} rawSrc
 * @returns {TokenReader}
 */
function tokenizeScript(rawSrc) {
    const src =
        typeof rawSrc == "string"
            ? new Source((extractName(rawSrc) ?? ["", "unknown"])[1], rawSrc)
            : rawSrc

    const tokenizer = new Tokenizer(src)

    const ts = tokenizer.tokenize()

    return new TokenReader(ts, tokenizer.errors)
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
                const scriptBodySite = TokenSite.merge(
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
