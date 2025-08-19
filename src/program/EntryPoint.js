import { makeWord } from "@helios-lang/compiler-utils"
import { expectDefined } from "@helios-lang/type-utils"
import { ToIRContext } from "../codegen/index.js"
import { GlobalScope, TopScope } from "../scopes/index.js"
import {
    ConstStatement,
    FuncStatement,
    Statement
} from "../statements/index.js"
import { MainModule } from "./MainModule.js"
import { Module } from "./Module.js"
import { ModuleCollection } from "./ModuleCollection.js"

/**
 * @import { Site } from "@helios-lang/compiler-utils"
 * @import { SourceMappedStringI } from "@helios-lang/ir"
 * @import { UplcData } from "@helios-lang/uplc"
 * @import { Definitions } from "../index.js"
 * @typedef {import("../typecheck/index.js").DataType} DataType
 * @typedef {import("../typecheck/index.js").ScriptTypes} ScriptTypes
 * @typedef {import("../typecheck/index.js").Type} Type
 * @typedef {import("../typecheck/index.js").TypeSchema} TypeSchema
 */

/**
 * @typedef {{
 *   name: string
 *   purpose: string
 *   currentScriptIndex: number | undefined
 *   mainArgTypes: DataType[]
 *   mainFunc: FuncStatement
 *   moduleDependencies: string[]
 *   mainImportedModules: Module[]
 *   mainModule: MainModule
 *   userTypes: Record<string, Record<string, DataType>>
 *   paramTypes: Record<string, DataType>
 *   paramsDetails(): Record<string, string>
 *   requiredParams: Set<string>
 *   changeParam(name: string, data: UplcData): boolean
 *   evalTypes(scriptTypes: ScriptTypes): void
 *   toIR(ctx: ToIRContext, extra?: Definitions | undefined): SourceMappedStringI
 *   toString(): string
 * }} EntryPoint
 */

export class EntryPointImpl {
    /**
     * @protected
     * @type {ModuleCollection}
     */
    modules

    /**
     * Used to retrieve current script index
     * @protected
     * @type {GlobalScope | undefined}
     */
    globalScope

    /**
     * @private
     * @type {TopScope | undefined}
     */
    _topScope

    /**
     * @param {ModuleCollection} modules
     */
    constructor(modules) {
        this.modules = modules
        this.globalScope = undefined
        this._topScope = undefined
    }

    /**
     * @type {number | undefined}
     */
    get currentScriptIndex() {
        // add the current script to the context
        if (this.globalScope) {
            const ctx = this.globalScope.getBuiltinNamespace(
                makeWord({ value: "ScriptContext" })
            )

            if (!ctx) {
                return undefined
            }

            const member = ctx.namespaceMembers["Script"]
            if (!member) {
                return undefined
            }

            const scriptType = member.asType

            if (scriptType && this.name in scriptType.typeMembers) {
                const enumVariant =
                    scriptType.typeMembers[this.name].asEnumMemberType

                if (enumVariant) {
                    return enumVariant.constrIndex
                }
            }
        }

        return undefined
    }

    /**
     * @type {string}
     */
    get name() {
        return this.mainModule.name.value
    }

    /**
     * @type {Record<string, DataType>}
     */
    get paramTypes() {
        /**
         * @type {Record<string, DataType>}
         */
        const res = {}

        this.loopConstStatements((name, constStatement) => {
            res[name] = constStatement.type
        })

        return res
    }

    /**
     * @protected
     * @type {[Statement, boolean][]} - boolean value marks if statement is import or not
     */
    get allStatements() {
        return this.modules.allStatements
    }

    /**
     * @type {Record<string, Record<string, DataType>>}
     */
    get userTypes() {
        const topScope = expectDefined(this._topScope)

        /**
         * @type {Record<string, Record<string, any>>}
         */
        const result = {}

        const moduleNames = [this.mainModule.name].concat(
            this.mainImportedModules.map((m) => m.name)
        )

        for (let moduleName of moduleNames) {
            const module_ =
                moduleName.value == this.name
                    ? this.mainModule
                    : expectDefined(
                          this.mainImportedModules.find(
                              (m) => m.name.value == moduleName.value
                          ),
                          `module ${moduleName.value} not found`
                      )

            /**
             * @type {Record<string, any>}
             */
            const moduleTypes = {}

            const moduleScope = topScope.getModuleScope(moduleName)

            moduleScope.loopTypes((name, type) => {
                if (module_.statements.some((s) => s.name.value == name)) {
                    if (type?.asDataType) {
                        moduleTypes[name] = type.asDataType
                    }
                }
            })

            result[moduleName.value] = moduleTypes
        }

        return result
    }

    /**
     * @protected
     * @type {string[]}
     */
    get mainArgNames() {
        return this.mainFunc.argNames
    }

    /**
     * @type {DataType[]}
     */
    get mainArgTypes() {
        return this.mainFunc.argTypes.map((at) => expectDefined(at.asDataType))
    }

    /**
     * @type {FuncStatement}
     */
    get mainFunc() {
        return this.mainModule.mainFunc
    }

    /**
     * @type {Module[]}
     */
    get mainImportedModules() {
        return this.modules.nonMainModules
    }

    /**
     * @type {MainModule}
     */
    get mainModule() {
        return this.modules.mainModule
    }

    /**
     * @protected
     * @type {string}
     */
    get mainPath() {
        return this.mainFunc.path
    }

    /**
     * @protected
     * @type {Site}
     */
    get mainRetExprSite() {
        return this.mainFunc.retSite
    }

    /**
     * @protected
     * @type {Statement[]}
     */
    get mainStatements() {
        return this.mainModule.statements
    }

    /**
     * @type {string[]}
     */
    get moduleDependencies() {
        const allModules = this.mainImportedModules
        return this.mainModule
            .filterDependencies(allModules)
            .map((m) => m.name.value)
    }

    /**
     * Change the literal value of a const statements
     * @param {string} name
     * @param {UplcData} data
     * @returns {boolean} - returns false if not found
     */
    changeParam(name, data) {
        let found = false

        this.loopConstStatements((constName, constStatement) => {
            if (!found) {
                if (constName == name) {
                    constStatement.changeValueSafe(data)
                    found = true
                }
            }
        })

        return found
    }

    /**
     * Presents all the parameter values as an object with keys mapping the parameter names
     * to Helios declarations for each const statement, with their current settings
     * @returns {Record<string, string>}
     * @public
     */
    paramsDetails() {
        /** @type {Record<string,string>} */
        const res = {}

        this.loopConstStatements((name, cs) => {
            res[name] = cs.toString()
        })
        return res
    }

    /**
     * @returns {string}
     */
    toString() {
        return this.modules.toString()
    }

    /**
     * @protected
     * @param {SourceMappedStringI} ir
     * @param {Definitions} definitions
     * @returns {Set<string>}
     */
    collectAllUsed(ir, definitions) {
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

    /**
     * @protected
     * @param {GlobalScope} globalScope
     */
    evalTypesInternal(globalScope) {
        this.globalScope = globalScope
        const topScope = new TopScope(globalScope)

        this.modules.evalTypes(topScope)

        this._topScope = topScope
    }

    /**
     * @protected
     * @param {string} name
     * @returns {ConstStatement | undefined}
     */
    findConstStatement(name) {
        /**
         * @type {ConstStatement | undefined}
         */
        let cs = undefined

        this.loopConstStatements((constName, constStatement) => {
            if (!cs) {
                if (name == constName) {
                    cs = constStatement
                }
            }
        })

        return cs
    }

    /**
     * Non-positional named parameters
     * @protected
     * @param {ToIRContext} ctx
     * @param {SourceMappedStringI} ir
     * @returns {Set<string>}
     */
    getRequiredParametersInternal(ctx, ir) {
        const definitions = this.modules.fetchDefinitions(
            ctx,
            ir,
            (s) => s.name.value == "main"
        )

        const used = this.collectAllUsed(ir, definitions)

        /**
         * @type {Set<string>}
         */
        const res = new Set()

        this.loopConstStatements((name, cs) => {
            if (!cs.isSet() && used.has(cs.path)) {
                res.add(name)
            }
        })

        return res
    }

    /**
     * @protected
     * @param {(name: string, statement: ConstStatement) => void} callback
     */
    loopConstStatements(callback) {
        this.modules.loopConstStatements(callback)
    }

    /**
     * @protected
     * @param {ToIRContext} ctx
     * @param {SourceMappedStringI} ir
     * @param {Definitions | undefined} extra
     * @returns {SourceMappedStringI}
     */
    wrapEntryPoint(ctx, ir, extra = undefined) {
        const map = this.modules.fetchDefinitions(
            ctx,
            ir,
            (s, isImport) => !isImport && s.name.value == "main",
            extra
        )

        return this.modules.wrap(ctx, ir, map)
    }
}
