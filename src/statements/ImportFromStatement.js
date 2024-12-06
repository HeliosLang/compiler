import { makeReferenceError, makeTypeError } from "@helios-lang/compiler-utils"
import { ToIRContext } from "../codegen/index.js"
import { ModuleScope, Scope, builtinNamespaces } from "../scopes/index.js"
import { NamedEntity } from "../typecheck/index.js"
import { Statement } from "./Statement.js"

/**
 * @import { Site, Word } from "@helios-lang/compiler-utils"
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
     * @returns {EvalEntity | undefined}
     */
    evalInternal(scope) {
        if (this.isBuiltinNamespace()) {
            const namespace = scope.getBuiltinNamespace(this._moduleName)

            if (!namespace) {
                return undefined
            }

            let member = namespace.namespaceMembers[this._origName.value]

            if (!member) {
                throw makeReferenceError(
                    this._origName.site,
                    `'${this._moduleName.value}.${this._origName.value}' undefined`
                )

                return undefined
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
                return undefined
            }

            const importedEntity = importedScope.get(this._origName)

            if (importedEntity instanceof Scope) {
                throw makeTypeError(
                    this._origName.site,
                    `can't import a module from a module`
                )
                return undefined
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
