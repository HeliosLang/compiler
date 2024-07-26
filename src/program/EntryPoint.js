import { CompilerError, Word } from "@helios-lang/compiler-utils"
import { $, SourceMappedString } from "@helios-lang/ir"
import { None, expectSome } from "@helios-lang/type-utils"
import {
    ToIRContext,
    applyTypeParameters,
    injectMutualRecursions,
    wrapWithDefs
} from "../codegen/index.js"
import { GlobalScope, ModuleScope, TopScope } from "../scopes/index.js"
import {
    ConstStatement,
    FuncStatement,
    Statement
} from "../statements/index.js"
import { MainModule } from "./MainModule.js"
import { Module } from "./Module.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("@helios-lang/uplc").UplcData} UplcData
 * @typedef {import("../codegen/index.js").Definitions} Definitions
 * @typedef {import("../typecheck/index.js").DataType} DataType
 * @typedef {import("../typecheck/index.js").ScriptTypes} ScriptTypes
 * @typedef {import("../typecheck/index.js").Type} Type
 */

/**
 * @typedef {{
 *   name: string
 *   paramTypes: {[name: string]: DataType}
 *   purpose: string
 *   changeParam(name: string, data: UplcData)
 *   evalTypes(scriptTypes: ScriptTypes): TopScope
 *   getRequiredParameters(ctx: ToIRContext): [string, Type][]
 *   toIR(ctx: ToIRContext): SourceMappedString
 *   toString(): string
 * }} EntryPoint
 */

export class EntryPointImpl {
    /**
     * @protected
     * @type {Module[]}
     */
    modules

    /**
     * Used to retrieve current script index
     * @protected
     * @type {Option<GlobalScope>}
     */
    globalScope

    /**
     * @param {Module[]} modules
     */
    constructor(modules) {
        this.modules = modules
        this.globalScope = None
    }

    /**
     * @type {string}
     */
    get name() {
        return this.mainModule.name.value
    }

    /**
     * @type {{[name: string]: DataType}}
     */
    get paramTypes() {
        /**
         * @type {{[name: string]: DataType}}
         */
        let res = {}

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
        /**
         * @type {[Statement, boolean][]}
         */
        let statements = []

        for (let i = 0; i < this.modules.length; i++) {
            let m = this.modules[i]

            // MainModule or PostModule => isImport == false
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
     * @protected
     * @type {string[]}
     */
    get mainArgNames() {
        return this.mainFunc.argNames
    }

    /**
     * @protected
     * @type {DataType[]}
     */
    get mainArgTypes() {
        return this.mainFunc.argTypes.map((at) => expectSome(at.asDataType))
    }

    /**
     * @protected
     * @type {FuncStatement}
     */
    get mainFunc() {
        return this.mainModule.mainFunc
    }

    /**
     * @protected
     * @type {Module[]}
     */
    get mainImportedModules() {
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
     * @protected
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
     * @protected
     * @type {string}
     */
    get mainPath() {
        return this.mainFunc.path
    }

    /**
     * Needed to list the paramTypes, and to call changeParam
     * @protected
     * @type {Statement[]}
     */
    get mainAndPostStatements() {
        let statements = this.mainModule.statements

        if (this.postModule != null) {
            statements = statements.concat(this.postModule.statements)
        }

        return statements
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
     * @protected
     * @type {Option<Module>}
     */
    get postModule() {
        let m = this.modules[this.modules.length - 1]

        if (m instanceof MainModule) {
            return None
        } else {
            return m
        }
    }

    /**
     * Change the literal value of a const statements
     * @param {string} name
     * @param {UplcData} data
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

        if (!found) {
            throw CompilerError.reference(
                this.mainFunc.site,
                `param '${name}' not found`
            )
        }
    }

    /**
     * @returns {string}
     */
    toString() {
        return this.modules.map((m) => m.toString()).join("\n")
    }

    /**
     * @protected
     * @param {SourceMappedString} ir
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
         * @type {SourceMappedString[]}
         */
        const stack = [ir]

        const RE = /__[a-zA-Z0-9_[\]@]+/g

        while (stack.length > 0) {
            const ir = expectSome(stack.pop())

            ir.search(RE, (match) => {
                if (!used.has(match)) {
                    used.add(match)

                    const def = definitions.get(match)

                    if (def) {
                        stack.push(def)
                    }
                }
            })
        }

        return used
    }

    /**
     * @protected
     * @param {SourceMappedString} ir
     * @param {Definitions} definitions
     * @returns {Definitions}
     */
    eliminateUnused(ir, definitions) {
        const used = this.collectAllUsed(ir, definitions)

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
                throw CompilerError.reference(
                    cs.site,
                    `used unset const '${name}' (hint: use program.parameters['${name}'] = ...)`
                )
            }
        })

        return result
    }

    /**
     * @protected
     * @param {GlobalScope} globalScope
     * @returns {TopScope}
     */
    evalTypesInternal(globalScope) {
        this.globalScope = globalScope
        const topScope = new TopScope(globalScope)

        // loop through the modules

        for (let i = 0; i < this.modules.length; i++) {
            const m = this.modules[i]

            // reuse main ModuleScope for post module
            const moduleScope =
                m === this.postModule
                    ? topScope.getModuleScope(this.mainModule.name)
                    : new ModuleScope(topScope)

            m.evalTypes(moduleScope)

            if (m instanceof MainModule) {
                topScope.setStrict(false)
            }

            if (m !== this.postModule) {
                topScope.setScope(m.name, moduleScope)
            }
        }

        return topScope
    }

    /**
     * Loops over all statements, until endCond == true (includes the matches statement)
     * Then applies type parameters
     * @protected
     * @param {ToIRContext} ctx
     * @param {SourceMappedString} ir
     * @param {(s: Statement) => boolean} endCond
     * @returns {Definitions}
     */
    fetchDefinitions(ctx, ir, endCond) {
        let map = this.statementsToIR(ctx, endCond)

        return applyTypeParameters(ctx, ir, map)
    }

    /**
     * @protected
     * @param {string} name
     * @returns {Option<ConstStatement>}
     */
    findConstStatement(name) {
        /**
         * @type {Option<ConstStatement>}
         */
        let cs = None

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
     * @param {SourceMappedString} ir
     * @returns {[string, Type][]}
     */
    getRequiredParametersInternal(ctx, ir) {
        const definitions = this.fetchDefinitions(
            ctx,
            ir,
            (s) => s.name.value == "main"
        )
        const used = this.collectAllUsed(ir, definitions)

        /**
         * @type {[string, Type][]}
         */
        const lst = []

        this.loopConstStatements((name, cs) => {
            if (!cs.isSet() && used.has(cs.path)) {
                lst.push([name, cs.type])
            }
        })

        return lst
    }

    /**
     * @protected
     * @param {(name: string, statement: ConstStatement) => void} callback
     */
    loopConstStatements(callback) {
        this.modules.forEach((m) => m.loopConstStatements(callback))
    }

    /**
     * @protected
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
     * @private
     * @param {ToIRContext} ctx
     * @param {Definitions} map
     */
    addCurrentScriptIR(ctx, map) {
        // add the current script to the context
        if (this.globalScope) {
            const ctx = this.globalScope.getBuiltinNamespace(
                new Word("ScriptContext")
            )

            if (!ctx) {
                return
            }

            const member = ctx.namespaceMembers["Script"]
            if (!member) {
                return
            }

            const scriptType = member.asType

            if (scriptType && this.name in scriptType.typeMembers) {
                const enumVariant =
                    scriptType.typeMembers[this.name].asEnumMemberType

                if (enumVariant) {
                    map.set(
                        `__helios__scriptcontext__current_script`,
                        $(
                            [
                                $`__core__constrData(
                            ${enumVariant.constrIndex.toString()},
                            __core__mkCons(
                                __core__mkNilData(())
                            )
                        )`
                            ],
                            this.mainModule.name.site
                        )
                    )
                }
            }
        }
    }
    /**
     * @protected
     * @param {ToIRContext} ctx
     * @param {SourceMappedString} ir
     * @param {Option<Definitions>} extra
     * @returns {SourceMappedString}
     */
    wrapEntryPoint(ctx, ir, extra = None) {
        let map = this.fetchDefinitions(ctx, ir, (s) => s.name.value == "main")

        if (extra) {
            map = new Map(
                Array.from(extra.entries()).concat(Array.from(map.entries()))
            )
        }

        this.addCurrentScriptIR(ctx, map)

        return this.wrapInner(ctx, ir, map)
    }

    /**
     * @protected
     * @param {ToIRContext} ctx
     * @param {SourceMappedString} ir
     * @param {Definitions} definitions
     * @returns {SourceMappedString}
     */
    wrapInner(ctx, ir, definitions) {
        ir = injectMutualRecursions(ir, definitions)

        definitions = this.eliminateUnused(ir, definitions)

        ir = wrapWithDefs(ir, definitions)

        // add builtins as late as possible, to make sure we catch as many dependencies as possible
        const builtins = ctx.fetchRawFunctions(ir, definitions)

        ir = wrapWithDefs(ir, builtins)

        return ir
    }
}
