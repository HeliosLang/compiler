import { oneOf, word } from "@helios-lang/compiler-utils"

/**
 * @typedef {(typeof topLevelKeywords) extends ReadonlyArray<infer T> ? T: never} TopLevelKeyword
 */

export const topLevelKeywords = /** @type {const} */ ([
    "const",
    "enum",
    "func",
    "import",
    "struct"
])
export const anyTopLevelKeyword = oneOf(topLevelKeywords.map((kw) => word(kw)))
