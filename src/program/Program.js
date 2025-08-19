import { bytesToHex } from "@helios-lang/codec-utils"
import { makeErrorCollector } from "@helios-lang/compiler-utils"
import { compile as compileIR } from "@helios-lang/ir"
import { expectDefined, isDefined } from "@helios-lang/type-utils"
import { ToIRContext, genExtraDefs } from "../codegen/index.js"
import { IR_PARSE_OPTIONS } from "../parse/index.js"
import {
    ConstStatement,
    EnumStatement,
    FuncStatement,
    StructStatement
} from "../statements/index.js"
import { VoidType, isDataType } from "../typecheck/index.js"
import { newEntryPoint } from "./newEntryPoint.js"
import { MainModule } from "./MainModule.js"
import { Module } from "./Module.js"
import { ModuleCollection } from "./ModuleCollection.js"
import { UserFunc } from "./UserFunc.js"

/**
 * @import { ErrorCollector, Source } from "@helios-lang/compiler-utils"
 * @import { OptimizeOptions, ParseOptions, SourceMappedStringI } from "@helios-lang/ir"
 * @import { UplcData, UplcValue, UplcProgramV2 } from "@helios-lang/uplc"
 * @import { Definitions } from "../index.js"
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
 *   allowModuleEntryPoint?: boolean
 * }} ProgramProps
 */

/**
 * @typedef {{
 *   optimize?: boolean | OptimizeOptions
 *   dependsOnOwnHash?: boolean
 *   hashDependencies?: Record<string, string>
 *   validatorIndices?: Record<string, number>
 *   onCompileUserFunc?: (name: string, uplc: UplcProgramV2) => void
 *   excludeUserFuncs?: Set<string>
 *   withAlt?: boolean
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

        this.errors = makeErrorCollector()

        this.entryPoint = newEntryPoint(mainSource, {
            moduleSrcs: props.moduleSources ?? [],
            validatorTypes: props.validatorTypes ?? {},
            errorCollector: this.errors,
            allowModuleEntryPoint: props.allowModuleEntryPoint
        })

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
     * @type {number | undefined}
     */
    get currentScriptIndex() {
        return this.entryPoint.currentScriptIndex
    }

    /**
     * @type {Record<string, Record<string, UserFunc>>}
     */
    get userFunctions() {
        const importedModules = this.entryPoint.mainImportedModules.slice()
        const allModules = importedModules.concat([this.entryPoint.mainModule])

        const moduleCollection = new ModuleCollection(allModules)

        return moduleCollection.userFunctions
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
     * Compiles the program to UPLC form
     * @remarks
     * By default (with no optimize setting provided) it compiles an optimized
     * version, while also attaching an alternative (unoptimized, with logging)
     * version to the UplcProgram. When available, the logging version
     * of the script is used to provide diagnostic details for developer or
     * application-layer use.
     *
     * if 'optimize' is enabled explicitly via boolean or `{optimize:boolean}` or
     * `{optimize: {...options}}`, then the logging version is only included if
     * `options.withAlt=true`.  Additional `options.optimize:{... optimizeOptions}`
     * can provide fine-grained tuning of the optimization process.
     *
     * Specifying `options.withAlt=true` + `options.optimize=true` is equivalent to
     * the default behavior.  `withAlt` is ignored if `optimize` is explicitly disabled.
     *
     * If only the optimized version of the script is used, any execution errors
     * will not have access to logged details from the program; in that case, a
     * warning message will be emitted, indicating the lack of loggable details.
     *
     * @param {boolean | CompileOptions} optimizeOrOptions
     * @returns {UplcProgramV2}
     */
    compile(optimizeOrOptions = {}) {
        /**
         * @type {CompileOptions}
         */
        const options =
            typeof optimizeOrOptions == "boolean"
                ? { optimize: optimizeOrOptions }
                : optimizeOrOptions

        // these fields come the contract-utils package and must also be passed to the alt unoptimize compilation
        const hashDependencies = options.hashDependencies ?? {}
        const dependsOnOwnHash = options.dependsOnOwnHash ?? false

        const explicitOptimize = options.optimize
        // uses implied optimize=true if not explicitly set
        const optimize = !!(explicitOptimize ?? true)
        if (false == explicitOptimize && options.withAlt) {
            console.warn(
                "options.withAlt=true is ignored when options.optimize is explicitly disabled"
            )
        }
        const withAlt =
            false == explicitOptimize ? false : (options.withAlt ?? optimize)

        const ir = this.toIR({
            dependsOnOwnHash,
            hashDependencies,
            optimize: optimize
        })

        // don't (yet) compile user funcs in alt unoptimized
        const alt = withAlt
            ? this.compile({
                  optimize: false,
                  dependsOnOwnHash,
                  hashDependencies
              })
            : undefined

        // todo: re-use the IR from alt version to shorten the IR compilation for optimized version (~0.5 seconds in one sample)
        // todo: or can we re-use some intermediate result within the IR-compilation process, to reduce overhead even further?

        const uplc = compileIR(ir, {
            optimize: optimize,
            alt: alt,
            parseOptions: IR_PARSE_OPTIONS,
            optimizeOptions:
                options.optimize && typeof options.optimize != "boolean"
                    ? options.optimize
                    : undefined
        })

        // userfuncs might depend on own hash, which is easer to inject after compilation of main program
        if (options.onCompileUserFunc) {
            if (options.optimize) {
                hashDependencies[this.name] = bytesToHex(uplc.hash())
            }

            this.compileUserFuncs(options.onCompileUserFunc, {
                excludeUserFuncs: options.excludeUserFuncs ?? new Set(),
                hashDependencies: hashDependencies,
                validatorIndices: options.validatorIndices
            })
        }

        return uplc
    }

    /**
     * @param {(name: string, uplc: UplcProgramV2) => void} onCompile
     * @param {{
     *   excludeUserFuncs: Set<string>
     *   hashDependencies: Record<string, string>
     *   validatorIndices?: Record<string, number>
     * }} options
     */
    compileUserFuncs(onCompile, options) {
        const allFuncs = this.userFunctions

        Object.entries(allFuncs).forEach(([moduleName, fns]) => {
            Object.entries(fns).forEach(([funcName, fn]) => {
                const fullName = `${moduleName}::${funcName}`

                if (!options.excludeUserFuncs.has(fullName)) {
                    const currentScriptValue =
                        moduleName == this.name && options.validatorIndices
                            ? `__core__constrData(${expectDefined(options.validatorIndices[this.name])}, __core__mkNilData(()))`
                            : undefined
                    const uplc = fn
                        .compile({
                            optimize: true,
                            hashDependencies: options.hashDependencies,
                            validatorTypes: this.props.validatorTypes ?? {},
                            validatorIndices: options.validatorIndices,
                            currentScriptValue
                        })
                        .withAlt(
                            fn.compile({
                                optimize: false,
                                hashDependencies: options.hashDependencies,
                                validatorTypes: this.props.validatorTypes ?? {},
                                validatorIndices: options.validatorIndices,
                                currentScriptValue
                            })
                        )

                    onCompile(fullName, uplc)
                }
            })
        })
    }

    /**
     * Generate additional IR definitions
     *   * dependency on own hash through methods defined on the ScriptContext
     *   * dependency on hashes of other validators or dependency on own precalculated hash (eg. unoptimized program should use hash of optimized program)
     * @param {{
     *   dependsOnOwnHash: boolean
     *   hashDependencies: Record<string, string>
     *   optimize: boolean
     *   makeParamSubstitutable?: boolean
     *   validatorIndices?: Record<string, number>
     * }} options
     * @returns {SourceMappedStringI}
     */
    toIR(options) {
        const ctx = new ToIRContext({
            optimize: options.optimize,
            isTestnet: this.isForTestnet,
            makeParamsSubstitutable: options.makeParamSubstitutable
        })

        const extra = genExtraDefs({
            name: this.name,
            dependsOnOwnHash: options.dependsOnOwnHash,
            hashDependencies: options.hashDependencies,
            purpose: this.purpose,
            validatorTypes: this.props.validatorTypes,
            validatorIndices: options.validatorIndices,
            makeParamsSubstitutable: options.makeParamSubstitutable ?? false,
            currentScriptValue: isDefined(this.currentScriptIndex)
                ? `__core__constrData(
                ${this.currentScriptIndex.toString()},
                __core__mkNilData(())
            )`
                : undefined
        })

        return this.entryPoint.toIR(ctx, extra)
    }

    /**
     * @returns {string}
     */
    toString() {
        return this.entryPoint.toString()
    }
}
