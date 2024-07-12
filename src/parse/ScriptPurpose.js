import { oneOf, word } from "@helios-lang/compiler-utils"

/**
 * @typedef {(typeof SCRIPT_PURPOSES) extends ReadonlyArray<infer T> ? T : never} ScriptPurpose
 */

export const SCRIPT_PURPOSES = /** @type {const} */ ([
    "spending",
    "minting",
    "staking",
    "module",
    "testing",
    "mixed"
])
export const anyScriptPurpose = oneOf(SCRIPT_PURPOSES.map((p) => word(p)))

/**
 * @param {string} s
 * @returns {s is ScriptPurpose}
 */
export function isValidScriptPurpose(s) {
    return !!SCRIPT_PURPOSES.find((p) => p == s)
}
