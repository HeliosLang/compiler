import { bytesToHex } from "@helios-lang/codec-utils"
import { ErrorCollector, Source } from "@helios-lang/compiler-utils"
import { SourceMappedString, compile as compileIR } from "@helios-lang/ir"
import { isSome } from "@helios-lang/type-utils"
import { UplcProgramV2 } from "@helios-lang/uplc"
import { ToIRContext, genExtraDefs } from "../codegen/index.js"
import { IR_PARSE_OPTIONS } from "../parse/index.js"
import {
    ConstStatement,
    EnumStatement,
    FuncStatement,
    StructStatement
} from "../statements/index.js"
import { isDataType } from "../typecheck/index.js"
import { newEntryPoint } from "./newEntryPoint.js"
import { MainModule } from "./MainModule.js"
import { Module } from "./Module.js"
import { ModuleCollection } from "./ModuleCollection.js"
import { UserFunc } from "./UserFunc.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("@helios-lang/ir").ParseOptions} ParseOptions
 * @typedef {import("@helios-lang/uplc").UplcData} UplcData
 * @typedef {import("@helios-lang/uplc").UplcValue} UplcValue
 * @typedef {import("@helios-lang/uplc").UplcProgramV2I} UplcProgramV2I
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
 *   validatorIndices?: Record<string, number>
 *   onCompileUserFunc?: (name: string, uplc: UplcProgramV2) => void
 *   excludeUserFuncs?: Set<string>
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
     * @type {Option<number>}
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

        /**
         * @type {Record<string, Record<string, UserFunc>>}
         */
        const res = {}

        /**
         * @param {Module} m
         * @param {FuncStatement} fn
         * @param {string} prefix
         */
        const addFunc = (m, fn, prefix) => {
            // Don't add main function, handled elsewhere
            if (m instanceof MainModule && fn.name.value == "main") {
                return
            }

            const moduleName = m.name.value
            const prev = res[moduleName] ?? {}
            const fullName = `${prefix}${fn.name.value}`

            // make sure all arg types and return type are compatible and that the function doesn't have any typeparameters
            if (
                fn.argTypes.every((a) => isDataType(a)) &&
                isDataType(fn.retType) &&
                !fn.typeParameters.hasParameters()
            ) {
                const filteredImportedModules =
                    m.filterDependencies(importedModules)
                const newEntryPoint = new UserFunc(
                    new ModuleCollection(filteredImportedModules.concat([m])),
                    fullName
                )
                prev[fullName] = newEntryPoint
            }

            res[moduleName] = prev
        }

        /**
         * @param {Module} m
         * @param {ConstStatement} cn
         * @param {string} prefix
         */
        const addConst = (m, cn, prefix) => {
            const moduleName = m.name.value
            const prev = res[moduleName] ?? {}
            const fullName = `${prefix}${cn.name.value}`

            if (isDataType(cn.type)) {
                const filteredImportedModules =
                    m.filterDependencies(importedModules)

                const newEntryPoint = new UserFunc(
                    new ModuleCollection(filteredImportedModules.concat([m])),
                    fullName
                )
                prev[fullName] = newEntryPoint
            }

            res[moduleName] = prev
        }

        allModules.forEach((m) => {
            const statements = m.statements

            statements.forEach((s, i) => {
                if (s instanceof FuncStatement) {
                    addFunc(m, s, "")
                } else if (s instanceof ConstStatement) {
                    addConst(m, s, "")
                } else if (
                    s instanceof EnumStatement ||
                    s instanceof StructStatement
                ) {
                    const prefix = `${s.name.value}::`

                    s.statements.forEach((ss) => {
                        if (ss instanceof FuncStatement) {
                            addFunc(m, ss, prefix)
                        } else if (ss instanceof ConstStatement) {
                            addConst(m, ss, prefix)
                        }
                    })
                }
            })
        })

        return res
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

        const hashDependencies = options.hashDependencies ?? {}
        const optimize = options.optimize ?? false

        const ir = this.toIR({
            dependsOnOwnHash: options.dependsOnOwnHash ?? false,
            hashDependencies: hashDependencies,
            optimize: optimize
        })

        const uplc = compileIR(ir, {
            optimize: optimize,
            parseOptions: IR_PARSE_OPTIONS
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
     * @param {(name: string, uplc: UplcProgramV2I) => void} onCompile
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
                    const uplc = fn
                        .compile({
                            optimize: true,
                            hashDependencies: options.hashDependencies,
                            validatorTypes: this.props.validatorTypes ?? {},
                            validatorIndices: options.validatorIndices
                        })
                        .withAlt(
                            fn.compile({
                                optimize: false,
                                hashDependencies: options.hashDependencies,
                                validatorTypes: this.props.validatorTypes ?? {},
                                validatorIndices: options.validatorIndices
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
     * @returns {SourceMappedString}
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
            currentScriptValue: isSome(this.currentScriptIndex)
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
