import { ErrorCollector, Source } from "@helios-lang/compiler-utils"
import {
    $,
    DEFAULT_PARSE_OPTIONS,
    SourceMappedString,
    compile as compileIR
} from "@helios-lang/ir"
import { expectSome } from "@helios-lang/type-utils"
import { UplcProgramV2 } from "@helios-lang/uplc"
import { ToIRContext } from "../codegen/index.js"
import { newEntryPoint } from "./newEntryPoint.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("@helios-lang/uplc").UplcData} UplcData
 * @typedef {import("@helios-lang/uplc").UplcValue} UplcValue
 * @typedef {import("../codegen/index.js").Definitions} Definitions
 * @typedef {import("../typecheck/index.js").DataType} DataType
 * @typedef {import("../typecheck/index.js").ScriptTypes} ScriptTypes
 * @typedef {import("../typecheck/index.js").Type} Type
 * @typedef {import("./EntryPoint.js").EntryPoint} EntryPoint
 * @typedef {import("./UserTypes.js").UserTypes} UserTypes
 */

/**
 * `throwCompilerErrors` defaults to true
 * @typedef {{
 *   isTestnet?: boolean
 *   moduleSources?: (string | Source)[]
 *   validatorTypes?: ScriptTypes
 *   throwCompilerErrors?: boolean
 * }} ProgramProps
 */

/**
 * @typedef {{
 *   optimize?: boolean
 *   dependsOnOwnHash?: boolean
 *   hashDependencies?: Record<string, string>
 * }} CompileOptions
 */

/**
 * @type {ProgramProps}
 */
export const DEFAULT_PROGRAM_PROPS = {
    isTestnet: true,
    moduleSources: [],
    validatorTypes: {}
}

/**
 * Helios root object
 */
export class Program {
    /**
     * @readonly
     * @type {ProgramProps}
     */
    props

    /**
     * @readonly
     * @type {EntryPoint}
     */
    entryPoint

    /**
     * @readonly
     * @type {ErrorCollector}
     */
    errors

    /**
     * @param {string | Source} mainSource
     * @param {ProgramProps} props
     */
    constructor(mainSource, props = DEFAULT_PROGRAM_PROPS) {
        this.props = props

        this.errors = new ErrorCollector()

        this.entryPoint = newEntryPoint(
            mainSource,
            props.moduleSources ?? [],
            props.validatorTypes ?? {},
            this.errors
        )

        if (props.throwCompilerErrors ?? true) {
            this.errors.throw()
        }
    }

    /**
     * @type {boolean}
     */
    get isForTestnet() {
        return this.props.isTestnet ?? false
    }

    /**
     * @type {string}
     */
    get name() {
        return this.entryPoint.name
    }

    /**
     * @type {string}
     */
    get purpose() {
        return this.entryPoint.purpose
    }

    /**
     * @type {Record<string, Record<string, DataType>>}
     */
    get userTypes() {
        return this.entryPoint.userTypes
    }

    /**
     * @type {Record<string, DataType>}
     */
    get paramTypes() {
        return this.entryPoint.paramTypes
    }

    /**
     * @type {Set<string>}
     */
    get requiredParams() {
        return this.entryPoint.requiredParams
    }

    /**
     * Change the literal value of a const statements
     * @param {string} name
     * @param {UplcData} data
     * @returns {boolean}
     */
    changeParam(name, data) {
        return this.entryPoint.changeParam(name, data)
    }

    /**
     * @param {boolean | CompileOptions} optimizeOrOptions
     * @returns {UplcProgramV2}
     */
    compile(optimizeOrOptions = false) {
        /**
         * @type {CompileOptions}
         */
        const options =
            typeof optimizeOrOptions == "boolean"
                ? { optimize: optimizeOrOptions }
                : optimizeOrOptions
        const optimize = options.optimize ?? false

        const ir = this.toIR({
            dependsOnOwnHash: options.dependsOnOwnHash ?? false,
            hashDependencies: options.hashDependencies ?? {},
            optimize: optimize
        })

        return compileIR(ir, {
            optimize: optimize,
            parseOptions: {
                ...DEFAULT_PARSE_OPTIONS,
                builtinsPrefix: "__core__",
                errorPrefix: ""
            }
        })
    }

    /**
     * Generate additional IR definitions
     *   * dependency on own hash through methods defined on the ScriptContext
     *   * dependency on hashes of other validators or dependency on own precalculated hash (eg. unoptimized program should use hash of optimized program)
     * @param {{dependsOnOwnHash: boolean, hashDependencies: Record<string, string>, optimize: boolean}} options
     * @returns {SourceMappedString}
     */
    toIR(options) {
        const ctx = new ToIRContext(options.optimize, this.isForTestnet)

        /**
         * @type {Definitions}
         */
        const extra = new Map()

        // inject hashes of other validators
        Object.entries(options.hashDependencies).forEach(([depName, dep]) => {
            extra.set(`__helios__scripts__${depName}`, $(`#${dep}`))
        })

        if (options.dependsOnOwnHash) {
            const key = `__helios__scripts__${this.name}`

            const ir = expectSome(
                /** @type {Record<string, SourceMappedString>} */ ({
                    mixed: $(
                        `__helios__scriptcontext__get_current_script_hash()`
                    ),
                    spending: $(
                        `__helios__scriptcontext__get_current_validator_hash()`
                    ),
                    minting: $(
                        `__helios__scriptcontext__get_current_minting_policy_hash()`
                    ),
                    staking: $(
                        `__helios__scriptcontext__get_current_staking_validator_hash()`
                    )
                })[this.purpose]
            )

            extra.set(key, ir)
        }

        // also add script enum __is methods
        if (this.props.validatorTypes) {
            Object.keys(this.props.validatorTypes).forEach((scriptName) => {
                const key = `__helios__script__${scriptName}____is`

                // only way to instantiate a Script is via ScriptContext::current_script

                const ir = $`(_) -> {
                    ${this.name == scriptName ? "true" : "false"}
                }`

                extra.set(key, ir)
            })
        }

        return this.entryPoint.toIR(ctx, extra)
    }

    /**
     * @returns {string}
     */
    toString() {
        return this.entryPoint.toString()
    }
}
