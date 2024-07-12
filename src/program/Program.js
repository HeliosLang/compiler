import { CompilerError } from "@helios-lang/compiler-utils"
import {
    $,
    DEFAULT_PARSE_OPTIONS,
    SourceMappedString,
    compile
} from "@helios-lang/ir"
import { None, expectSome } from "@helios-lang/type-utils"
import {
    ParametricName,
    ToIRContext,
    RE_IR_PARAMETRIC_NAME,
    wrapWithDefs
} from "../codegen/index.js"
import { parseScript } from "../parse/index.js"
import { GlobalScope, ModuleScope, TopScope } from "../scopes/index.js"
import {
    ConstStatement,
    FuncStatement,
    Statement
} from "../statements/index.js"
import { MainModule } from "./MainModule.js"
import { Module } from "./Module.js"
import { UplcProgramV2 } from "@helios-lang/uplc"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("@helios-lang/uplc").UplcData} UplcData
 * @typedef {import("@helios-lang/uplc").UplcValue} UplcValue
 * @typedef {import("../codegen/index.js").Definitions} Definitions
 * @typedef {import("../typecheck/index.js").DataType} DataType
 * @typedef {import("../typecheck/index.js").Type} Type
 * @typedef {import("./UserTypes.js").UserTypes} UserTypes
 */

/**
 * @typedef {{
 *   allowPosParams: boolean
 *   invertEntryPoint: boolean
 *   isTestnet: boolean
 * }} ProgramConfig
 */

/**
 * @type {ProgramConfig}
 */
export const DEFAULT_PROGRAM_CONFIG = {
    allowPosParams: false,
    invertEntryPoint: false,
    isTestnet: true
}

/**
 * Helios root object
 */
export class Program {
    /**
     * @type {string}
     */
    #purpose

    /**
     * @type {Module[]}
     */
    #modules

    /**
     * @readonly
     * @type {ProgramConfig}
     */
    config

    /**
     * @type {UserTypes}
     */
    #types

    /**
     * @param {string} purpose
     * @param {Module[]} modules
     * @param {ProgramConfig} config
     */
    constructor(purpose, modules, config) {
        this.#purpose = purpose
        this.#modules = modules
        this.config = config
        this.#types = {}
    }

    /**
     * @internal
     * @param {string} rawSrc
     * @returns {[purpose, Module[]]}
     */
    static parseMainInternal(rawSrc) {
        const { purpose, name, statements, entryPointIndex, errors } =
            parseScript(rawSrc)

        errors.throw()

        if (purpose !== null && name !== null) {
            /**
             * @type {Module[]}
             */
            const modules = [
                new MainModule(name, statements.slice(0, entryPointIndex + 1))
            ]

            if (entryPointIndex < statements.length - 1) {
                modules.push(
                    new Module(name, statements.slice(entryPointIndex + 1))
                )
            }

            return [purpose, modules]
        } else {
            throw new Error("unexpected") // should've been caught by calling src.throwErrors() above
        }
    }

    /**
     * @param {string} mainName
     * @param {string[]} moduleSrcs
     * @returns {Module[]}
     */
    static parseImports(mainName, moduleSrcs = []) {
        let imports = moduleSrcs.map((src) => {
            return Module.new(src)
        })

        /**
         * @type {Set<string>}
         */
        let names = new Set()

        names.add(mainName)

        for (let m of imports) {
            if (names.has(m.name.value)) {
                throw CompilerError.syntax(
                    m.name.site,
                    `non-unique module name '${m.name.value}'`
                )
            }

            names.add(m.name.value)
        }

        return imports
    }

    /**
     * @internal
     * @param {string} mainSrc
     * @param {string[]} moduleSrcs
     * @returns {[Option<string>, Module[]]}
     */
    static parseMain(mainSrc, moduleSrcs) {
        let [purpose, modules] = Program.parseMainInternal(mainSrc)

        const site = modules[0].name.site

        const imports = Program.parseImports(modules[0].name.value, moduleSrcs)

        const mainImports = modules[0].filterDependencies(imports)

        /** @type {Module[]} */
        let postImports = []

        if (modules.length > 1) {
            postImports = modules[modules.length - 1]
                .filterDependencies(imports)
                .filter(
                    (m) =>
                        !mainImports.some((d) => d.name.value == m.name.value)
                )
        }

        // create the final order of all the modules (this is the order in which statements will be added to the IR)
        modules = mainImports
            .concat([modules[0]])
            .concat(postImports)
            .concat(modules.slice(1))

        if (purpose.value == "module") {
            throw CompilerError.syntax(site, "can't use module for main")
        }

        return [purpose.value, modules]
    }

    /**
     * @internal
     * @type {number}
     */
    get nPosParams() {
        return 0
    }

    /**
     * @internal
     * @type {Type[]}
     */
    get posParams() {
        return this.mainArgTypes.slice(0, this.nPosParams)
    }

    /**
     * @internal
     * @type {Module[]}
     */
    get mainImportedModules() {
        /** @type {Module[]} */
        let ms = []

        for (let m of this.#modules) {
            if (m instanceof MainModule) {
                break
            } else {
                ms.push(m)
            }
        }

        return ms
    }

    /**
     * @internal
     * @type {MainModule}
     */
    get mainModule() {
        for (let m of this.#modules) {
            if (m instanceof MainModule) {
                return m
            }
        }

        throw new Error("MainModule not found")
    }

    /**
     * @internal
     * @type {null | Module}
     */
    get postModule() {
        let m = this.#modules[this.#modules.length - 1]

        if (m instanceof MainModule) {
            return null
        } else {
            return m
        }
    }

    /**
     * @type {string}
     */
    get purpose() {
        return this.#purpose
    }

    /**
     * @type {string}
     */
    get name() {
        return this.mainModule.name.value
    }

    /**
     * @type {FuncStatement}
     */
    get mainFunc() {
        return this.mainModule.mainFunc
    }

    /**
     * @type {Site}
     */
    get mainRetExprSite() {
        return this.mainFunc.retSite
    }

    /**
     * @type {string[]}
     */
    get mainArgNames() {
        return this.mainFunc.argNames
    }

    /**
     * @type {DataType[]}
     */
    get mainArgTypes() {
        return this.mainFunc.argTypes.map((at) => expectSome(at.asDataType))
    }

    /**
     * @internal
     * @type {string}
     */
    get mainPath() {
        return this.mainFunc.path
    }

    /**
     * @type {Statement[]}
     */
    get mainStatements() {
        return this.mainModule.statements
    }

    /**
     * Needed to list the paramTypes, and to call changeParam
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
     * @internal
     * @type {[Statement, boolean][]} - boolean value marks if statement is import or not
     */
    get allStatements() {
        /**
         * @type {[Statement, boolean][]}
         */
        let statements = []

        for (let i = 0; i < this.#modules.length; i++) {
            let m = this.#modules[i]

            // MainModule or PostModule => isImport == false
            let isImport = !(
                m instanceof MainModule || i == this.#modules.length - 1
            )

            statements = statements.concat(
                m.statements.map((s) => [s, isImport])
            )
        }

        return statements
    }

    /**
     *
     * @param {(name: string, statement: ConstStatement) => void} callback
     */
    loopConstStatements(callback) {
        this.#modules.forEach((m) => m.loopConstStatements(callback))
    }

    /**
     * @returns {string}
     */
    toString() {
        return this.#modules.map((m) => m.toString()).join("\n")
    }

    /**
     * @param {GlobalScope} globalScope
     * @returns {TopScope}
     */
    evalTypesInternal(globalScope) {
        const topScope = new TopScope(globalScope)

        // loop through the modules

        for (let i = 0; i < this.#modules.length; i++) {
            const m = this.#modules[i]

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
     * @internal
     * @param {{[name: string]: Type}} validatorTypes
     * @returns {TopScope}
     */
    evalTypes(validatorTypes = {}) {
        throw new Error("not yet implemented")
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
     * Change the literal value of a const statements
     * @param {string} name
     * @param {UplcData} data
     */
    changeParamSafe(name, data) {
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
     * @internal
     * @param {string} name
     * @returns {Option<ConstStatement>}
     */
    findConstStatement(name) {
        /**
         * @type {Option<ConstStatement>}
         */
        let cs = None

        this.loopConstStatements((constName, constStatement) => {
            if (cs === null) {
                if (name == constName) {
                    cs = constStatement
                }
            }
        })

        return cs
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
     * For top-level statements
     * @param {SourceMappedString} mainIR
     * @param {Definitions} map
     * @returns {SourceMappedString}
     */
    static injectMutualRecursions(mainIR, map) {
        const keys = Array.from(map.keys())

        /**
         * @param {string} name
         * @param {string[]} potentialDependencies
         * @returns {string[]}
         */
        const filterMutualDependencies = (name, potentialDependencies) => {
            // names to be treated
            const stack = [name]

            /**
             * @type {Set<string>}
             */
            let set = new Set()

            while (stack.length > 0) {
                const name = expectSome(stack.shift())

                const ir = expectSome(map.get(name))

                const localDependencies = keys
                    .slice(
                        keys.findIndex(
                            name.includes("[")
                                ? ((prefix) => {
                                      return (n) => n.startsWith(prefix)
                                  })(name.split("[")[0])
                                : (n) => n == name
                        )
                    )
                    .filter((dep) => !set.has(dep))

                for (let i = 0; i < localDependencies.length; i++) {
                    const dep = localDependencies[i]
                    if (ir.includes(dep)) {
                        set.add(dep)

                        if (dep != name) {
                            stack.push(dep)
                        }
                    }
                }
            }

            return potentialDependencies.filter((d) => set.has(d))
        }

        for (let i = keys.length - 1; i >= 0; i--) {
            const k = keys[i]

            // don't make a final const statement self-recursive (makes evalParam easier)
            // don't make __helios builtins mutually recursive
            // don't make __from_data and ____<op> methods mutually recursive (used frequently inside the entrypoint)
            if (
                (k.startsWith("__const") && i == keys.length - 1) ||
                k.startsWith("__helios") ||
                k.includes("____")
            ) {
                continue
            }

            let prefix = expectSome(k.match(/(__const)?([^[]+)(\[|$)/))[0]

            // get all following definitions including self, excluding constants
            // also don't mutual recurse helios functions
            const potentialDependencies = keys
                .slice(i)
                .filter(
                    (k) =>
                        (k.startsWith(prefix) ||
                            k.startsWith(`__const${prefix}`)) &&
                        !k.includes("____")
                )

            const dependencies = filterMutualDependencies(
                k,
                potentialDependencies
            )

            if (dependencies.length > 0) {
                const escaped = k.replace(/\[/g, "\\[").replace(/]/g, "\\]")

                const re = new RegExp(`\\b${escaped}(\\b|$)`, "gm")
                const newStr = `${k}(${dependencies.join(", ")})`
                // do the actual replacing
                for (let k_ of keys) {
                    map.set(k_, expectSome(map.get(k_)).replace(re, newStr))
                }

                mainIR = mainIR.replace(re, newStr)

                const wrapped = $([
                    $(`(${dependencies.join(", ")}) -> {`),
                    expectSome(map.get(k)),
                    $("}")
                ])

                // wrap own definition
                map.set(k, wrapped)
            }
        }

        return mainIR
    }

    /**
     * Also merges builtins and map
     * @internal
     * @param {ToIRContext} ctx
     * @param {SourceMappedString} mainIR
     * @param {Definitions} map
     * @returns {Definitions}
     */
    static applyTypeParameters(ctx, mainIR, map) {
        const builtinGenerics = ctx.fetchRawGenerics()

        /**
         * @type {Map<string, [string, SourceMappedString]>}
         */
        const added = new Map()

        /**
         * @param {string} name
         * @param {string} location
         */
        const add = (name, location) => {
            if (map.has(name) || added.has(name)) {
                return
            }

            const pName = ParametricName.parse(name)

            const genericName = pName.toTemplate()
            const genericFuncName = pName.toTemplate(true)

            let ir =
                builtinGenerics.get(name) ??
                builtinGenerics.get(genericName) ??
                builtinGenerics.get(genericFuncName) ??
                map.get(genericName)

            if (!ir) {
                throw new Error(`${genericName} undefined in ir`)
            } else if (ir instanceof SourceMappedString) {
                ir = pName.replaceTemplateNames(ir)

                added.set(name, [location, ir])

                ir.search(RE_IR_PARAMETRIC_NAME, (name_) => add(name_, name))
            } else {
                const ir_ = ir(pName.ttp, pName.ftp)

                added.set(name, [location, ir_])

                ir_.search(RE_IR_PARAMETRIC_NAME, (name_) => add(name_, name))
            }
        }

        for (let [k, v] of map) {
            v.search(RE_IR_PARAMETRIC_NAME, (name) => add(name, k))
        }

        mainIR.search(RE_IR_PARAMETRIC_NAME, (name) => add(name, "main"))

        // we need to keep templates, otherwise find() might fail to inject the applied definitions in the right location
        let entries = Array.from(map.entries())

        /**
         * @param {string} name
         * @returns {number}
         */
        const find = (name) => {
            for (let i = entries.length - 1; i >= 0; i--) {
                if (entries[i][0] == name) {
                    return i
                }
            }

            if (name == "main") {
                return entries.length
            } else {
                throw new Error(`${name} not found`)
            }
        }

        const addedEntries = Array.from(added.entries())

        for (let i = 0; i < addedEntries.length; i++) {
            const [name, [location, ir]] = addedEntries[i]

            const j = find(location)

            // inject right before location

            entries = entries
                .slice(0, j)
                .concat([[name, ir]])
                .concat(entries.slice(j))
        }

        /**
         * Remove template because they don't make any sense in the final output
         */
        entries = entries.filter(([key, _]) => !ParametricName.isTemplate(key))

        return new Map(entries)
    }

    /**
     * @internal
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
     * Loops over all statements, until endCond == true (includes the matches statement)
     * Then applies type parameters
     * @internal
     * @param {ToIRContext} ctx
     * @param {SourceMappedString} ir
     * @param {(s: Statement) => boolean} endCond
     * @returns {Definitions}
     */
    fetchDefinitions(ctx, ir, endCond) {
        let map = this.statementsToIR(ctx, endCond)

        return Program.applyTypeParameters(ctx, ir, map)
    }

    /**
     * @internal
     * @param {ToIRContext} ctx
     * @param {SourceMappedString} ir
     * @param {Definitions} definitions
     * @returns {SourceMappedString}
     */
    wrapInner(ctx, ir, definitions) {
        ir = Program.injectMutualRecursions(ir, definitions)

        definitions = this.eliminateUnused(ir, definitions)

        ir = wrapWithDefs(ir, definitions)

        // add builtins as late as possible, to make sure we catch as many dependencies as possible
        const builtins = ctx.fetchRawFunctions(ir, definitions)

        ir = wrapWithDefs(ir, builtins)

        return ir
    }

    /**
     * @internal
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

        return this.wrapInner(ctx, ir, map)
    }

    /**
     * @param {ToIRContext} ctx
     * @returns {SourceMappedString}
     */
    toIRInternal(ctx) {
        throw new Error("not yet implemented")
    }

    /**
     * @param {ToIRContext} ctx
     * @param {Option<Definitions>} extra
     * @returns {SourceMappedString}
     */
    toIR(ctx, extra = null) {
        const ir = this.toIRInternal(ctx)

        return this.wrapEntryPoint(ctx, ir, extra)
    }

    /**
     * Non-positional named parameters
     * @internal
     * @type {[string, Type][]}
     */
    get requiredParameters() {
        const ir = this.toIRInternal(
            new ToIRContext(false, this.config.isTestnet)
        )
        const definitions = this.fetchDefinitions(
            new ToIRContext(false, this.config.isTestnet),
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
     * @param {boolean} simplify
     * @returns {UplcProgramV2}
     */
    compile(simplify = false) {
        const ir = this.toIR(new ToIRContext(simplify, this.config.isTestnet))

        return compile(ir, {
            optimize: simplify,
            parseOptions: {
                ...DEFAULT_PARSE_OPTIONS,
                builtinsPrefix: "__core__",
                errorPrefix: ""
            }
        })
    }
}
