import { Word, anyWord } from "@helios-lang/compiler-utils"
import { None } from "@helios-lang/type-utils"
import { ParseContext } from "./ParseContext.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").TokenMatcher<Word>} TokenMatcher
 */

const reserved = ["if", "else", "switch"]

/**
 * @type {TokenMatcher}
 */
export const anyName = {
    matches: (t) =>
        t instanceof Word &&
        !t.value.startsWith("__") &&
        !reserved.includes(t.value)
            ? t
            : None,
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

        return new Word("", ctx.currentSite)
    }
}
