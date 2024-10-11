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
    /**
     * @private
     * @readonly
     * @type {Word}
     */
    _origName

    /**
     * @private
     * @readonly
     * @type {Word}
     */
    _moduleName

    /**
     * @param {Site} site
     * @param {Word} name
     * @param {Word} origName
     * @param {Word} moduleName
     */
    constructor(site, name, origName, moduleName) {
        super(site, name)
        this._origName = origName
        this._moduleName = moduleName
    }

    /**
     * @type {Word}
     */
    get moduleName() {
        return this._moduleName
    }

    /**
     * @type {string}
     */
    get origPath() {
        return `${this.basePath}__${this._origName.toString()}`
    }

    /**
     * @private
     * @returns {boolean}
     */
    isBuiltinNamespace() {
        return this._moduleName.value in builtinNamespaces
    }

    /**
     * @param {ModuleScope} scope
     * @returns {null | EvalEntity}
     */
    evalInternal(scope) {
        if (this.isBuiltinNamespace()) {
            const namespace = scope.getBuiltinNamespace(this._moduleName)

            if (!namespace) {
                return None
            }

            let member = namespace.namespaceMembers[this._origName.value]

            if (!member) {
                throw CompilerError.reference(
                    this._origName.site,
                    `'${this._moduleName.value}.${this._origName.value}' undefined`
                )

                return null
            }

            if (member.asType?.toTyped().asFunc) {
                member = member.asType.toTyped()
            }

            return new NamedEntity(
                this.name.value,
                `${namespace.path}__${this._origName.value}`,
                member
            )
        } else {
            const importedScope = scope.getScope(this._moduleName)

            if (!importedScope) {
                return null
            }

            const importedEntity = importedScope.get(this._origName)

            if (importedEntity instanceof Scope) {
                throw CompilerError.type(
                    this._origName.site,
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
