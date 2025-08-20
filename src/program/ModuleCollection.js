import {
    makeErrorCollector,
    makeReferenceError
} from "@helios-lang/compiler-utils"
import {
    ToIRContext,
    applyTypeParameters,
    collectAllUsed,
    injectMutualRecursions,
    wrapWithDefs
} from "../codegen/index.js"
import { ModuleScope, TopScope } from "../scopes/index.js"
import {
    ConstStatement,
    EnumStatement,
    FuncStatement,
    Statement,
    StructStatement
} from "../statements/index.js"
import { isDataType, VoidType } from "../typecheck/index.js"
import { MainModule } from "./MainModule.js"
import { Module } from "./Module.js"
import { UserFunc } from "./UserFunc.js"

/**
 * @import { SourceMappedStringI } from "@helios-lang/ir"
 * @import { Definitions, TypeCheckContext } from "../index.js"
 */

export class ModuleCollection {
    /**
     * @readonly
     * @type {Module[]}
     */
    modules

    /**
     * @param {Module[]} modules
     */
    constructor(modules) {
        if (modules.length == 0) {
            throw new Error("expected at least 1 module")
        }

        this.modules = modules
    }

    /**
     * @type {[Statement, boolean][]} - boolean value marks if statement is import or not
     */
    get allStatements() {
        /**
         * @type {[Statement, boolean][]}
         */
        let statements = []

        for (let i = 0; i < this.modules.length; i++) {
            let m = this.modules[i]

            // MainModule or last Module => isImport == false
            let isImport = !(
                m instanceof MainModule || i == this.modules.length - 1
            )

            statements = statements.concat(
                m.statements.map((s) => [s, isImport])
            )
        }

        return statements
    }

    /**
     * @type {Module}
     */
    get lastModule() {
        return this.modules[this.modules.length - 1]
    }

    /**
     * @type {MainModule}
     */
    get mainModule() {
        for (let m of this.modules) {
            if (m instanceof MainModule) {
                return m
            }
        }

        throw new Error("MainModule not found")
    }

    /**
     * @type {Module[]}
     */
    get nonMainModules() {
        /** @type {Module[]} */
        let ms = []

        for (let m of this.modules) {
            if (m instanceof MainModule) {
                break
            } else {
                ms.push(m)
            }
        }

        return ms
    }

    /**
     * @private
     * @param {SourceMappedStringI} ir
     * @param {Definitions} definitions
     * @returns {Definitions}
     */
    eliminateUnused(ir, definitions) {
        const used = collectAllUsed(ir, definitions)

        // eliminate all definitions that are not in set

        /**
         * @type {Definitions}
         */
        const result = new Map()

        for (let [k, ir] of definitions) {
            if (used.has(k)) {
                result.set(k, ir)
            }
        }

        // Loop internal const statemtsn
        this.loopConstStatements((name, cs) => {
            const path = cs.path

            if (used.has(path) && !definitions.has(cs.path)) {
                throw makeReferenceError(
                    cs.site,
                    `used unset const '${name}' (hint: use program.parameters['${name}'] = ...)`
                )
            }
        })

        return result
    }

    /**
     * @param {TypeCheckContext} ctx
     * @param {TopScope} topScope
     */
    evalTypes(ctx, topScope) {
        for (let i = 0; i < this.modules.length; i++) {
            const m = this.modules[i]

            // reuse main ModuleScope for post module
            const moduleScope = new ModuleScope(topScope)

            m.evalTypes(ctx, moduleScope)

            if (m instanceof MainModule) {
                topScope.setStrict(false)
            }

            topScope.setScope(m.name, moduleScope)
        }
    }

    /**
     * Loops over all statements, until endCond == true (includes the matches statement)
     * Then applies type parameters
     * @param {ToIRContext} ctx
     * @param {SourceMappedStringI} ir
     * @param {(s: Statement, isImport: boolean) => boolean} endCond
     * @param {Definitions | undefined} extra
     * @returns {Definitions}
     */
    fetchDefinitions(ctx, ir, endCond, extra = undefined) {
        let map = this.statementsToIR(ctx, endCond)

        map = applyTypeParameters(ctx, ir, map)

        if (extra) {
            map = new Map(
                Array.from(extra.entries()).concat(Array.from(map.entries()))
            )
        }

        return map
    }

    /**
     * @param {(name: string, statement: ConstStatement) => void} callback
     */
    loopConstStatements(callback) {
        this.modules.forEach((m) => m.loopConstStatements(callback))
    }

    /**
     * @param {ToIRContext} ctx
     * @param {(s: Statement, isImport: boolean) => boolean} endCond
     * @returns {Definitions}
     */
    statementsToIR(ctx, endCond) {
        /**
         * @type {Definitions}
         */
        const map = new Map()

        for (let [statement, isImport] of this.allStatements) {
            statement.toIR(ctx, map)

            if (endCond(statement, isImport)) {
                break
            }
        }

        return map
    }

    /**
     * @returns {string}
     */
    toString() {
        return this.modules.map((m) => m.toString()).join("\n")
    }

    /**
     * @param {ToIRContext} ctx
     * @param {SourceMappedStringI} ir
     * @param {Definitions} definitions
     * @returns {SourceMappedStringI}
     */
    wrap(ctx, ir, definitions) {
        ir = injectMutualRecursions(ir, definitions)

        definitions = this.eliminateUnused(ir, definitions)

        ir = wrapWithDefs(ir, definitions)

        // add builtins as late as possible, to make sure we catch as many dependencies as possible
        const builtins = ctx.fetchRawFunctions(ir, definitions)

        ir = wrapWithDefs(ir, builtins)

        return ir
    }

    /**
     * @type {Record<string, Record<string, UserFunc>>}
     */
    get userFunctions() {
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
                (isDataType(fn.retType) ||
                    new VoidType().isBaseOf(fn.retType)) &&
                !fn.typeParameters.hasParameters()
            ) {
                const errors = makeErrorCollector()
                const filteredImportedModules = m.filterDependencies(
                    { errors },
                    this.nonMainModules
                )
                errors.throw()
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
                const errors = makeErrorCollector()
                const filteredImportedModules = m.filterDependencies(
                    { errors },
                    this.nonMainModules
                )
                errors.throw()

                const newEntryPoint = new UserFunc(
                    new ModuleCollection(filteredImportedModules.concat([m])),
                    fullName
                )
                prev[fullName] = newEntryPoint
            }

            res[moduleName] = prev
        }

        this.modules.forEach((m) => {
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
}
