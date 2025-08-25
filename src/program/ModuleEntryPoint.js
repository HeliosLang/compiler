import { makeErrorCollector } from "@helios-lang/compiler-utils"
import { expectDefined } from "@helios-lang/type-utils"
import { ToIRContext } from "../codegen/index.js"
import { GlobalScope, TopScope } from "../scopes/index.js"
import { ConstStatement } from "../statements/index.js"
import { MainModule } from "./MainModule.js"
import { Module } from "./Module.js"
import { ModuleCollection } from "./ModuleCollection.js"

/**
 * @import { SourceMappedStringI } from "@helios-lang/ir"
 * @import { UplcData } from "@helios-lang/uplc"
 * @import { TypeCheckContext } from "../index.js"
 * @import { DataType, ScriptTypes } from "../typecheck/index.js"
 */

/**
 * @typedef {import("./EntryPoint.js").EntryPoint} EntryPoint
 */

/**
 * @implements {EntryPoint}
 */
export class ModuleEntryPoint {
    /**
     * @readonly
     * @type {ModuleCollection}
     */
    modules

    /**
     * @private
     * @readwrite`
     * @type {TopScope | undefined}
     */
    topScope

    /**
     * @param {ModuleCollection} modules
     */
    constructor(modules) {
        this.modules = modules
        this.topScope = undefined
    }

    /**
     * @type {"module"}
     */
    get purpose() {
        return "module"
    }

    /**
     * @type {undefined}
     */
    get currentScriptIndex() {
        return undefined
    }

    /**
     *
     * @type {string}
     */
    get name() {
        return this.lastModule.name.value
    }

    /**
     * @type {Module}
     */
    get lastModule() {
        return this.modules.lastModule
    }

    /**
     * @type {Module[]}
     */
    get nonLastModules() {
        return this.modules.modules.slice(0, this.modules.modules.length - 1)
    }

    /**
     * @type {MainModule}
     */
    get mainModule() {
        const lm = this.lastModule

        // will internally throw an error if an attempt is made to access mainFunc
        return new MainModule(lm.name, lm.statements, lm.sourceCode)
    }

    /**
     * @type {Module[]}
     */
    get mainImportedModules() {
        return this.nonLastModules
    }

    /**
     * @type {string[]}
     */
    get moduleDependencies() {
        const errors = makeErrorCollector()

        const result = this.lastModule
            .filterDependencies({ errors }, this.nonLastModules)
            .map((m) => m.name.value)

        errors.throw()

        return result
    }

    get mainFunc() {
        return this.mainModule.mainFunc
    }

    /**
     * @type {DataType[]}
     */
    get mainArgTypes() {
        throw new Error("module doesn't have a main function")
    }

    /**
     * @type {Record<string, DataType>}
     */
    get paramTypes() {
        throw new Error("not yet implemented")
    }

    /**
     * @type {Record<string, Record<string, DataType>>}
     */
    get userTypes() {
        const topScope = expectDefined(this.topScope)

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
     * Presents all the parameter values as an object with keys mapping the parameter names
     * to Helios declarations for each const statement, with their current settings
     * @returns {Record<string, string>}
     */
    paramsDetails() {
        throw new Error("not yet implemented")
    }

    /**
     * @param {ToIRContext} _ctx
     * @returns {SourceMappedStringI}
     */
    toIR(_ctx) {
        throw new Error("not yet implemented")
    }

    /**
     * @param {TypeCheckContext} ctx
     * @param {ScriptTypes} scriptTypes
     */
    evalTypes(ctx, scriptTypes) {
        const scope = GlobalScope.new({ scriptTypes, currentScript: this.name })
        const topScope = new TopScope(scope, true, ctx.errors)
        this.topScope = topScope
        this.modules.evalTypes(ctx, topScope)
    }

    /**
     * @type {Set<string>}
     */
    get requiredParams() {
        throw new Error("not yet implemented")
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
     * @protected
     * @param {(name: string, statement: ConstStatement) => void} callback
     */
    loopConstStatements(callback) {
        this.modules.loopConstStatements(callback)
    }
}
