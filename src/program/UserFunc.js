import { $, SourceMappedString, compile as compileIR } from "@helios-lang/ir"
import { UplcProgramV2 } from "@helios-lang/uplc"
import { ToIRContext, genExtraDefs } from "../codegen/index.js"
import { FuncStatement } from "../statements/index.js"
import { ModuleCollection } from "./ModuleCollection.js"
import { IR_PARSE_OPTIONS } from "../parse/index.js"

/**
 * @typedef {import("../typecheck/index.js").ScriptTypes} ScriptTypes
 * @typedef {import("./EntryPoint.js").EntryPoint} EntryPoint
 */

export class UserFunc {
    /**
     * @readonly
     * @type {ModuleCollection}
     */
    modules

    /**
     * @readonly
     * @type {string}
     */
    name

    /**
     * @param {ModuleCollection} modules
     * @param {string} name - member functions have a `Type::` prefix
     */
    constructor(modules, name) {
        this.modules = modules
        this.name = name
    }

    /**
     * @type {FuncStatement}
     */
    get mainFunc() {
        const lastModule = this.modules.lastModule

        const nameParts = this.name.split("::")

        for (let s of lastModule.statements) {
            if (s instanceof FuncStatement && s.name.value == this.name) {
                return s
            } else if (s.name.value == nameParts[0]) {
                for (let ss of s.statements) {
                    if (
                        ss instanceof FuncStatement &&
                        ss.name.value == nameParts[1]
                    ) {
                        return ss
                    }
                }

                throw new Error(`${this.name} undefined`)
            }
        }

        throw new Error(`${this.name} undefined`)
    }

    /**
     * @param {{
     *   optimize: boolean
     *   validatorTypes: ScriptTypes
     *   hashDependencies: Record<string, string>
     * }} props
     * @returns {UplcProgramV2}
     */
    compile(props) {
        const { ir } = this.toIR({
            validatorTypes: props.validatorTypes,
            optimize: props.optimize,
            hashDependencies: props.hashDependencies
        })

        const uplc = compileIR(ir, {
            optimize: props.optimize,
            parseOptions: IR_PARSE_OPTIONS
        })

        return uplc
    }

    /**
     * @param {{
     *   validatorTypes: ScriptTypes
     *   optimize?: boolean
     *   hashDependencies?: Record<string, string>
     * }} props
     * @returns {{
     *   ir: SourceMappedString
     *   requiresScriptContext: boolean
     *   requiresCurrentScript: boolean
     * }}
     */
    toIR(props) {
        const ctx = new ToIRContext({
            optimize: props.optimize ?? false,
            isTestnet: false,
            makeParamsSubstitutable: false
        })

        const extra = genExtraDefs({
            dependsOnOwnHash: false,
            makeParamsSubstitutable: false,
            hashDependencies:
                props.hashDependencies ??
                Object.fromEntries(
                    Array.from(Object.keys(props.validatorTypes)).map(
                        (name) => [name, "#"]
                    )
                ),
            name: this.name,
            validatorTypes: props.validatorTypes,
            dummyCurrentScript: true // TODO: configurable
        })

        const fn = this.mainFunc
        let ir = $`${fn.path}(${fn.argNames.join(", ")})`

        const defs = this.modules.fetchDefinitions(
            ctx,
            ir,
            (s) => s.name.value == this.name.split("::")[0],
            extra
        )

        ir = this.modules.wrap(ctx, ir, defs)

        const requiresCurrentScript = ir.includes(
            "__helios__scriptcontext__current_script"
        )
        const requiresScriptContext = ir.includes(
            "__helios__scriptcontext__data"
        )

        const argNames = fn.argNames
            .concat(requiresScriptContext ? ["__CONTEXT"] : [])
            .concat(
                requiresCurrentScript
                    ? ["__helios__scriptcontext__current_script"]
                    : []
            )

        ir = $`(${argNames.join(", ")}) -> {
            ${ir}
        }`

        return {
            ir: ir,
            requiresCurrentScript: requiresCurrentScript,
            requiresScriptContext: requiresScriptContext
        }
    }
}
