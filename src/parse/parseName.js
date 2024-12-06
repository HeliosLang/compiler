import { makeWord } from "@helios-lang/compiler-utils"
import { ParseContext } from "./ParseContext.js"

/**
 * @import { TokenMatcher, Word } from "@helios-lang/compiler-utils"
 */

const reserved = ["if", "else", "switch"]

/**
 * @type {TokenMatcher<Word>}
 */
export const anyName = {
    matches: (t) =>
        t.kind == "word" &&
        !t.value.startsWith("__") &&
        !reserved.includes(t.value)
            ? t
            : undefined,
    toString: () => "<name>"
}

/**
 * @param {ParseContext} ctx
 * @returns {Word}
 */
export function parseName(ctx) {
    const r = ctx.reader

    let m

    if ((m = r.matches(anyName))) {
        return m
    } else {
        r.endMatch()

        return makeWord({ value: "", site: ctx.currentSite })
    }
}
