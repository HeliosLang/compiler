import { $, SourceMappedString } from "@helios-lang/ir"

/**
 * @typedef {Map<string, SourceMappedString>} Definitions
 */

export const TAB = "    "

/**
 * Wraps 'inner' IR source with some definitions (used for top-level statements and for builtins)
 * @param {SourceMappedString} inner
 * @param {Definitions} definitions - name -> definition
 * @returns {SourceMappedString}
 */
export function wrapWithDefs(inner, definitions) {
    const keys = Array.from(definitions.keys()).reverse()

    let res = inner
    for (let key of keys) {
        const definition = definitions.get(key)

        if (definition === undefined) {
            throw new Error("unexpected")
        } else {
            res = $([
                $("("),
                $(key),
                $(") -> {\n"),
                res,
                $(`\n}(\n${TAB}/*${key}*/\n${TAB}`),
                definition,
                $("\n)")
            ])
        }
    }

    return res
}
