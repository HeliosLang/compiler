import { ToIRContext } from "../codegen/index.js"
import { ModuleScope, Scope, builtinNamespaces } from "../scopes/index.js"
import { ModuleNamespace } from "../typecheck/index.js"
import { Statement } from "./Statement.js"

/**
 * @import { Site, Word } from "@helios-lang/compiler-utils"
 * @import { Definitions } from "../index.js"
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 * @typedef {import("../typecheck/index.js").NamespaceMembers} NamespaceMembers
 */

/**
 * `import <ModuleName>`
 */
export class ImportModuleStatement extends Statement {
    /**
     * @param {Site} site
     * @param {Word} moduleName
     */
    constructor(site, moduleName) {
        super(site, moduleName)
    }

    /**
     * @type {Word}
     */
    get moduleName() {
        return this.name
    }

    /**
     * @param {ModuleScope} scope
     * @returns {EvalEntity | undefined}
     */
    evalInternal(scope) {
        if (this.name.value in builtinNamespaces) {
            return scope.getBuiltinNamespace(this.name)
        } else {
            const importedScope = scope.getScope(this.name)

            if (!importedScope) {
                return undefined
            }

            /**
             * @type {NamespaceMembers}
             */
            const namespaceMembers = {}

            for (let [name, entity] of importedScope.values) {
                if (!(entity instanceof Scope)) {
                    namespaceMembers[name.value] = entity
                }
            }

            return new ModuleNamespace(this.name.value, namespaceMembers)
        }
    }

    /**
     * @param {ModuleScope} scope
     */
    eval(scope) {
        let v = this.evalInternal(scope)

        if (v && !(this.name.value in builtinNamespaces)) {
            scope.set(this.name, v)
        }
    }

    /**
     * @param {ToIRContext} _ctx
     * @param {Definitions} _map
     */
    toIR(_ctx, _map) {
        // import statements only have a scoping function and don't do anything to the IR
    }
}
