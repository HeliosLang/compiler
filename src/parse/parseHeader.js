import {
    anyWord,
    isCompilerError,
    makeSource,
    makeTokenizer,
    makeWord
} from "@helios-lang/compiler-utils"
import { ParseContext } from "./ParseContext.js"
import { parseName } from "./parseName.js"
import { anyScriptPurpose } from "./ScriptPurpose.js"

/**
 * @import { Token, Word } from "@helios-lang/compiler-utils"
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
 * @returns {string | undefined}
 */
export function extractName(rawSrc) {
    try {
        const src = makeSource(rawSrc)
        const tokenizer = makeTokenizer(src)
        const gen = tokenizer.stream()

        // Don't parse the whole script, just 'eat' 2 tokens (`<purpose> <name>`) and keep the latter

        let yielded = gen.next()
        if (yielded.done) {
            return undefined
        }

        yielded = gen.next()
        if (yielded.done) {
            return undefined
        }

        let t = yielded.value

        if (t.kind == "word") {
            return t.value
        } else {
            return undefined
        }
    } catch (e) {
        if (isCompilerError(e)) {
            return undefined
        }

        throw e
    }
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

        return makeWord({ value: "unknown" })
    }
}
