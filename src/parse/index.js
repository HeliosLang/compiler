import { DEFAULT_PARSE_OPTIONS } from "@helios-lang/ir"
import { PARAM_IR_PREFIX } from "../codegen/index.js"
export { createSource, parseScript } from "./parseScript.js"

/**
 * @typedef {import("@helios-lang/ir").ParseOptions} ParseOptions
 * @typedef {import("./parseScript.js").ParsedScript} ParsedScript
 */

/**
 * @type {ParseOptions}
 */
export const IR_PARSE_OPTIONS = {
    ...DEFAULT_PARSE_OPTIONS,
    builtinsPrefix: "__core__",
    errorPrefix: "",
    paramPrefix: PARAM_IR_PREFIX
}
