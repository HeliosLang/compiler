import { ParametricName, RE_IR_PARAMETRIC_NAME } from "./ParametricName.js"
import { ToIRContext } from "./ToIRContext.js"

/**
 * @typedef {import("@helios-lang/ir").SourceMappedStringI} SourceMappedStringI
 * @typedef {import("./Definitions.js").Definitions} Definitions
 */

/**
 * Also merges builtins and map
 * @param {ToIRContext} ctx
 * @param {SourceMappedStringI} mainIR
 * @param {Definitions} map
 * @returns {Definitions}
 */
export function applyTypeParameters(ctx, mainIR, map) {
    const builtinGenerics = ctx.fetchRawGenerics()

    /**
     * @type {Map<string, [string, SourceMappedStringI]>}
     */
    const added = new Map()

    /**
     * @param {string} name
     * @param {string} location
     */
    const add = (name, location) => {
        if (map.has(name) || added.has(name)) {
            return
        }

        const pName = ParametricName.parse(name)

        const genericName = pName.toTemplate()
        const genericFuncName = pName.toTemplate(true)

        let ir =
            builtinGenerics.get(name) ??
            builtinGenerics.get(genericName) ??
            builtinGenerics.get(genericFuncName) ??
            map.get(genericName)?.content

        if (!ir) {
            throw new Error(`${genericName} undefined in ir`)
        } else if ("content" in ir) {
            ir = pName.replaceTemplateNames(ir)

            added.set(name, [location, ir])

            ir.search(RE_IR_PARAMETRIC_NAME, (name_) => add(name_, name))
        } else {
            const ir_ = ir(pName.ttp, pName.ftp)

            added.set(name, [location, ir_])

            ir_.search(RE_IR_PARAMETRIC_NAME, (name_) => add(name_, name))
        }
    }

    for (let [k, v] of map) {
        v.content.search(RE_IR_PARAMETRIC_NAME, (name) => add(name, k))
    }

    mainIR.search(RE_IR_PARAMETRIC_NAME, (name) => add(name, "main"))

    // we need to keep templates, otherwise find() might fail to inject the applied definitions in the right location
    let entries = Array.from(map.entries())

    /**
     * @param {string} name
     * @returns {number}
     */
    const find = (name) => {
        for (let i = entries.length - 1; i >= 0; i--) {
            if (entries[i][0] == name) {
                return i
            }
        }

        if (name == "main") {
            return entries.length
        } else {
            throw new Error(`${name} not found`)
        }
    }

    const addedEntries = Array.from(added.entries())

    for (let i = 0; i < addedEntries.length; i++) {
        const [name, [location, ir]] = addedEntries[i]

        const j = find(location)

        // inject right before location

        entries = entries
            .slice(0, j)
            .concat([[name, { content: ir }]])
            .concat(entries.slice(j))
    }

    /**
     * Remove template because they don't make any sense in the final output
     */
    entries = entries.filter(([key, _]) => !ParametricName.isTemplate(key))

    return new Map(entries)
}
