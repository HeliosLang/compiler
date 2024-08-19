import { $, SourceMappedString } from "@helios-lang/ir"
import { expectSome } from "@helios-lang/type-utils"

/**
 * @typedef {import("../typecheck/index.js").ScriptTypes} ScriptTypes
 */

/**
 * @typedef {Map<string, SourceMappedString>} Definitions
 */

export const TAB = "    "
export const PARAM_IR_PREFIX = "__"
export const PARAM_IR_MACRO = `${PARAM_IR_PREFIX}param`

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

/**
 * @typedef {{
 *   dependsOnOwnHash: boolean
 *   purpose?: string
 *   name: string
 *   hashDependencies: Record<string, string>
 *   validatorTypes?: ScriptTypes
 *   dummyCurrentScript?: boolean
 * }} ExtraDefOptions
 */

/**
 * @param {ExtraDefOptions} options
 * @returns {Definitions}
 */
export function genExtraDefs(options) {
    /**
     * @type {Definitions}
     */
    const extra = new Map()

    // inject hashes of other validators
    Object.entries(options.hashDependencies).forEach(([depName, dep]) => {
        dep = dep.startsWith("#") ? dep : `#${dep}`

        const key = `__helios__scripts__${depName}`
        extra.set(key, $`${PARAM_IR_MACRO}("${key}", ${dep})`)
    })

    if (options.dependsOnOwnHash) {
        const key = `__helios__scripts__${options.name}`

        const ir = expectSome(
            /** @type {Record<string, SourceMappedString>} */ ({
                mixed: $(`__helios__scriptcontext__get_current_script_hash()`),
                spending: $(
                    `__helios__scriptcontext__get_current_validator_hash()`
                ),
                minting: $(
                    `__helios__scriptcontext__get_current_minting_policy_hash()`
                ),
                staking: $(
                    `__helios__scriptcontext__get_current_staking_validator_hash()`
                )
            })[expectSome(options.purpose)]
        )

        extra.set(key, ir)
    }

    if (options.dummyCurrentScript) {
        extra.set(`__helios__scriptcontext__current_script`, $`#`)
    }

    // also add script enum __is methods
    if (options.validatorTypes) {
        Object.keys(options.validatorTypes).forEach((scriptName) => {
            const key = `__helios__script__${scriptName}____is`

            // only way to instantiate a Script is via ScriptContext::current_script

            const ir = $`(_) -> {
               ${options.name == scriptName ? "true" : "false"}
           }`

            extra.set(key, ir)
        })
    }

    return extra
}

/**
 * @protected
 * @param {SourceMappedString} ir
 * @param {Definitions} definitions
 * @returns {Set<string>}
 */
export function collectAllUsed(ir, definitions) {
    /**
     * Set of global paths
     * @type {Set<string>}
     */
    const used = new Set()

    /**
     * @type {SourceMappedString[]}
     */
    const stack = [ir]

    const RE = /__[a-zA-Z0-9_[\]@]+/g

    while (stack.length > 0) {
        const ir = expectSome(stack.pop())

        ir.search(RE, (match) => {
            if (!used.has(match)) {
                used.add(match)

                const def = definitions.get(match)

                if (def) {
                    stack.push(def)
                }
            }
        })
    }

    return used
}
