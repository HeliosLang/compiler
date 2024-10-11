import {
    CompilerError,
    Source,
    Tokenizer,
    Word,
    anyWord
} from "@helios-lang/compiler-utils"
import { None } from "@helios-lang/type-utils"
import { ParseContext } from "./ParseContext.js"
import { parseName } from "./parseName.js"
import { anyScriptPurpose } from "./ScriptPurpose.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Token} Token
 */

/**
 * @param {ParseContext} ctx
 * @returns {[Word, Word]}
 */
export function parseHeader(ctx) {
    return [parseScriptPurpose(ctx), parseName(ctx)]
}

/**
 * Quickly extract the script purpose header of a script source, by parsing only the minimally necessary characters.
 * Returns `null` if the script header is missing or syntactically incorrect. The first string returned is the script purpose, the second value returned is the script name.
 * @param {string} rawSrc
 * @returns {Option<string>}
 */
export function extractName(rawSrc) {
    return CompilerError.catch(
        () => {
            const src = new Source(rawSrc)
            const tokenizer = new Tokenizer(src)
            const gen = tokenizer.stream()

            // Don't parse the whole script, just 'eat' 2 tokens (`<purpose> <name>`) and keep the latter

            let yielded = gen.next()
            if (yielded.done) {
                return None
            }

            yielded = gen.next()
            if (yielded.done) {
                return None
            }

            let t = yielded.value

            if (t instanceof Word) {
                return t.value
            } else {
                return None
            }
        },
        () => {
            return None
        }
    )
}

/**
 * @param {ParseContext} ctx
 * @returns {Word}
 */
function parseScriptPurpose(ctx) {
    const r = ctx.reader

    let m

    if ((m = r.matches(anyScriptPurpose))) {
        return m
    } else if ((m = r.matches(anyWord))) {
        ctx.errors.syntax(m.site, `invalid script purpose '${m.value}'`)

        return m
    } else {
        r.endMatch()

        return new Word("unknown")
    }
}
