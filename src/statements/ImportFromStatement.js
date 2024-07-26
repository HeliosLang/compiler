import { CompilerError, Word } from "@helios-lang/compiler-utils"
import { None } from "@helios-lang/type-utils"
import { ToIRContext } from "../codegen/index.js"
import { ModuleScope, Scope, builtinNamespaces } from "../scopes/index.js"
import { NamedEntity } from "../typecheck/index.js"
import { Statement } from "./Statement.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("../codegen/index.js").Definitions} Definitions
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 */

/**
 * Each field in `import {...} from <ModuleName>` is given a separate ImportFromStatement
 */
export class ImportFromStatement extends Statement {
    #origName
    #moduleName

    /**
     * @param {Site} site
     * @param {Word} name
     * @param {Word} origName
     * @param {Word} moduleName
     */
    constructor(site, name, origName, moduleName) {
        super(site, name)
        this.#origName = origName
        this.#moduleName = moduleName
    }

    /**
     * @type {Word}
     */
    get moduleName() {
        return this.#moduleName
    }

    /**
     * @type {string}
     */
    get origPath() {
        return `${this.basePath}__${this.#origName.toString()}`
    }

    /**
     * @private
     * @returns {boolean}
     */
    isBuiltinNamespace() {
        return this.#moduleName.value in builtinNamespaces
    }

    /**
     * @param {ModuleScope} scope
     * @returns {null | EvalEntity}
     */
    evalInternal(scope) {
        if (this.isBuiltinNamespace()) {
            const namespace = scope.getBuiltinNamespace(this.#moduleName)

            if (!namespace) {
                return None
            }

            let member = namespace.namespaceMembers[this.#origName.value]

            if (!member) {
                throw CompilerError.reference(
                    this.#origName.site,
                    `'${this.#moduleName.value}.${this.#origName.value}' undefined`
                )

                return null
            }

            if (member.asType?.toTyped().asFunc) {
                member = member.asType.toTyped()
            }

            return new NamedEntity(
                this.name.value,
                `${namespace.path}__${this.#origName.value}`,
                member
            )
        } else {
            const importedScope = scope.getScope(this.#moduleName)

            if (!importedScope) {
                return null
            }

            const importedEntity = importedScope.get(this.#origName)

            if (importedEntity instanceof Scope) {
                throw CompilerError.type(
                    this.#origName.site,
                    `can't import a module from a module`
                )
                return null
            } else {
                return importedEntity
            }
        }
    }

    /**
     * @param {ModuleScope} scope
     */
    eval(scope) {
        const v = this.evalInternal(scope)

        if (v) {
            scope.set(this.name, v)
        }
    }

    /**
     * @param {ToIRContext} ctx
     * @param {Definitions} map
     */
    toIR(ctx, map) {
        // 'import from' statements only have a scoping function and don't do anything to the IR
    }
}
