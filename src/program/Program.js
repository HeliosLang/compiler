import { DEFAULT_PARSE_OPTIONS, compile as compileIR } from "@helios-lang/ir"
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
 * TODO: allow moduleSources to be of `Source[]` type
 * TODO: get rid of allowPosParams and invertEntryPoint
 * @typedef {{
 *   allowPosParams?: boolean
 *   invertEntryPoint?: boolean
 *   isTestnet?: boolean
 *   moduleSources?: string[]
 *   validatorTypes?: ScriptTypes
 * }} ProgramProps
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
     * @type {EntryPoint}
     */
    entryPoint

    /**
     * TODO: allow mainSource to be of `Source` type
     * @param {string} mainSource
     * @param {ProgramProps} props
     */
    constructor(mainSource, props = DEFAULT_PROGRAM_PROPS) {
        this.props = props

        this.entryPoint = newEntryPoint(
            mainSource,
            props.moduleSources ?? [],
            props.validatorTypes ?? {}
        )
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
     * @type {{[name: string]: DataType}}
     */
    get paramTypes() {
        return this.entryPoint.paramTypes
    }

    /**
     * Non-positional named parameters
     * @type {[string, Type][]}
     */
    get requiredParams() {
        return this.entryPoint.getRequiredParameters(
            new ToIRContext(false, this.isForTestnet)
        )
    }

    /**
     * Change the literal value of a const statements
     * @param {string} name
     * @param {UplcData} data
     */
    changeParam(name, data) {
        this.entryPoint.changeParam(name, data)
    }

    /**
     * @param {boolean} optimize
     * @returns {UplcProgramV2}
     */
    compile(optimize = false) {
        const ctx = new ToIRContext(optimize, this.isForTestnet)
        const ir = this.entryPoint.toIR(ctx)

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
     * @returns {string}
     */
    toString() {
        return this.entryPoint.toString()
    }
}
