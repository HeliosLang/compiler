import { makeReferenceError } from "@helios-lang/compiler-utils"
import {
    ToIRContext,
    applyTypeParameters,
    collectAllUsed,
    injectMutualRecursions,
    wrapWithDefs
} from "../codegen/index.js"
import { ModuleScope, TopScope } from "../scopes/index.js"
import { ConstStatement, Statement } from "../statements/index.js"
import { MainModule } from "./MainModule.js"
import { Module } from "./Module.js"

/**
 * @typedef {import("@helios-lang/ir").SourceMappedStringI} SourceMappedStringI
 * @typedef {import("../codegen/index.js").Definitions} Definitions
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
     * @param {TopScope} topScope
     */
    evalTypes(topScope) {
        for (let i = 0; i < this.modules.length; i++) {
            const m = this.modules[i]

            // reuse main ModuleScope for post module
            const moduleScope = new ModuleScope(topScope)

            m.evalTypes(moduleScope)

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
}
