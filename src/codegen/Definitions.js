import { $ } from "@helios-lang/ir"
import { expectDefined } from "@helios-lang/type-utils"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("@helios-lang/ir").SourceMappedStringI} SourceMappedStringI
 * @typedef {import("../typecheck/index.js").ScriptTypes} ScriptTypes
 */

/**
 * `keySite` is an optional way to give the key a proper name
 * @typedef {{
 *   content: SourceMappedStringI
 *   keySite?: Site
 * }} Definition
 */

/**
 * TODO: this should be wrapped by a class
 * @typedef {Map<string, Definition>} Definitions
 */

export const TAB = "    "
export const PARAM_IR_PREFIX = "__"
export const PARAM_IR_MACRO = `${PARAM_IR_PREFIX}param`

/**
 * Wraps 'inner' IR source with some definitions (used for top-level statements and for builtins)
 * @param {SourceMappedStringI} inner
 * @param {Definitions} definitions - name -> definition
 * @returns {SourceMappedStringI}
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
                definition.keySite ? $(key, definition.keySite) : $(key),
                $(") -> {\n"),
                res,
                $(`\n}(\n${TAB}/*${key}*/\n${TAB}`),
                definition.content,
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
 *   validatorIndices?: Record<string, number>
 *   currentScriptValue?: string
 *   makeParamsSubstitutable: boolean
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
        if (options.makeParamsSubstitutable) {
            extra.set(key, { content: $`${PARAM_IR_MACRO}("${key}", ${dep})` })
        } else {
            extra.set(key, { content: $(dep) })
        }
    })

    if (options.dependsOnOwnHash) {
        const key = `__helios__scripts__${options.name}`

        let ir = expectDefined(
            /** @type {Record<string, SourceMappedStringI>} */ ({
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
            })[expectDefined(options.purpose)]
        )

        const ownHash = options.hashDependencies[options.name]
        if (ownHash && ownHash.length > 1) {
            // make sure ownHash isn't a dummy value
            // this is a special situation in which we know the ownHash because it is derived from another compilation, but we still want to call these functions because they might fail
            ir = $`(_ignored) -> {
                #${ownHash.startsWith("#") ? ownHash.slice(1) : ownHash}
            }(${ir})`
        }

        extra.set(key, { content: ir })
    }

    if (options.currentScriptValue) {
        extra.set(`__helios__scriptcontext__current_script`, {
            content: $(options.currentScriptValue)
        })
    }

    // also add script enum `__is` methods
    if (options.validatorIndices) {
        const validatorIndices = options.validatorIndices
        Object.keys(validatorIndices).forEach((scriptName) => {
            const key = `__helios__script__${scriptName}____is`

            // only way to instantiate a Script is via ScriptContext::current_script, so `__new` functions aren't needed

            const index = validatorIndices[scriptName]
            const ir = $`(cs) -> {
                __core__equalsInteger(__core__fstPair(__core__unConstrData(cs)), ${index})
            }`

            extra.set(key, { content: ir })
        })
    } else if (options.validatorTypes) {
        // backup way of defining __helios__script__<name>____is
        Object.keys(options.validatorTypes).forEach((scriptName) => {
            const key = `__helios__script__${scriptName}____is`

            const ir = $`(_) -> {
               ${options.name == scriptName ? "true" : "false"}
           }`

            extra.set(key, { content: ir })
        })
    }

    return extra
}

/**
 * @protected
 * @param {SourceMappedStringI} ir
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
     * @type {SourceMappedStringI[]}
     */
    const stack = [ir]

    const RE = /__[a-zA-Z0-9_[\]@]+/g

    while (stack.length > 0) {
        const ir = expectDefined(stack.pop())

        ir.search(RE, (match) => {
            if (!used.has(match)) {
                used.add(match)

                const def = definitions.get(match)

                if (def) {
                    stack.push(def.content)
                }
            }
        })
    }

    return used
}
