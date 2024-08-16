import { ErrorCollector, Source, Word } from "@helios-lang/compiler-utils"
import {
    $,
    DEFAULT_PARSE_OPTIONS,
    SourceMappedString,
    compile as compileIR
} from "@helios-lang/ir"
import { expectSome } from "@helios-lang/type-utils"
import { UplcProgramV2 } from "@helios-lang/uplc"
import { ToIRContext } from "../codegen/index.js"
import {
    EnumStatement,
    FuncStatement,
    PARAM_IR_MACRO,
    PARAM_IR_PREFIX,
    StructStatement,
    TypeParameters
} from "../statements/index.js"
import { newEntryPoint } from "./newEntryPoint.js"
import { Module } from "./Module.js"
import { MainModule } from "./MainModule.js"
import { UserFuncEntryPoint } from "./UserFuncEntryPoint.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("@helios-lang/ir").ParseOptions} ParseOptions
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
 * @type {ParseOptions}
 */
export const IR_PARSE_OPTIONS = {
    ...DEFAULT_PARSE_OPTIONS,
    builtinsPrefix: "__core__",
    errorPrefix: "",
    paramPrefix: PARAM_IR_PREFIX
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
     * @type {Record<string, Record<string, EntryPoint>>}
     */
    get userFunctions() {
        const importedModules = this.entryPoint.mainImportedModules.slice()
        const allModules = importedModules.concat([this.entryPoint.mainModule])

        /**
         * @type {Record<string, Record<string, EntryPoint>>}
         */
        const res = {}

        /**
         * @param {Module} m
         * @param {FuncStatement} fn
         */
        const addFunc = (m, fn) => {
            const moduleName = m.name.value
            const prev = res[moduleName] ?? {}

            const fnName = fn.name.value

            // make sure all arg types and return type are compatible and that the function doesn't have any typeparameters
            if (
                fn.argTypes.every((a) => !!a.asDataType) &&
                !!fn.retType.asDataType &&
                !fn.typeParameters.hasParameters()
            ) {
                // by using the same funcExpr instance, we take something that has already been typechecked
                // TODO: properly handle mutual recursion
                const newFuncStatement = new FuncStatement(
                    fn.site,
                    new Word("main", fn.name.site),
                    new TypeParameters([], true),
                    fn.funcExpr
                )
                const mainStatements = m.statements.concat([newFuncStatement])
                const newMainModule = new MainModule(
                    new Word(fnName, fn.name.site),
                    mainStatements,
                    m.sourceCode
                )
                const filteredImportedModules =
                    newMainModule.filterDependencies(importedModules)
                const newEntryPoint = new UserFuncEntryPoint(
                    filteredImportedModules.concat([newMainModule])
                )
                prev[fnName] = newEntryPoint
            }

            res[moduleName] = prev
        }

        allModules.forEach((m) => {
            const statements = m.statements

            statements.forEach((s, i) => {
                if (s instanceof FuncStatement) {
                    addFunc(m, s)
                } else if (s instanceof EnumStatement) {
                    s.statements.forEach((s) => {
                        if (s instanceof FuncStatement) {
                            addFunc(m, s)
                        }
                    })
                } else if (s instanceof StructStatement) {
                    s.statements.forEach((s) => {
                        if (s instanceof FuncStatement) {
                            addFunc(m, s)
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
        const optimize = options.optimize ?? false

        const ir = this.toIR({
            dependsOnOwnHash: options.dependsOnOwnHash ?? false,
            hashDependencies: options.hashDependencies ?? {},
            optimize: optimize
        })

        return compileIR(ir, {
            optimize: optimize,
            parseOptions: IR_PARSE_OPTIONS
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
     * }} options
     * @returns {SourceMappedString}
     */
    toIR(options) {
        return genProgramEntryPointIR(this.entryPoint, {
            ...options,
            isTestnet: this.isForTestnet,
            name: this.name,
            purpose: this.purpose,
            validatorTypes: this.props.validatorTypes
        })
    }

    /**
     * @returns {string}
     */
    toString() {
        return this.entryPoint.toString()
    }
}

/**
 * @param {EntryPoint} entryPoint
 * @param {{
 *   dependsOnOwnHash: boolean
 *   hashDependencies: Record<string, string>
 *   optimize: boolean
 *   makeParamSubstitutable?: boolean
 *   isTestnet: boolean
 *   name: string
 *   purpose: string
 *   validatorTypes?: ScriptTypes
 *   dummyCurrentScript?: boolean
 * }} options
 */
export function genProgramEntryPointIR(entryPoint, options) {
    const ctx = new ToIRContext({
        optimize: options.optimize,
        isTestnet: options.isTestnet,
        makeParamsSubstitutable: options.makeParamSubstitutable
    })

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
            })[options.purpose]
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

    return entryPoint.toIR(ctx, extra)
}
