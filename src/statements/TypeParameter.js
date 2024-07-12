import { CompilerError, Word } from "@helios-lang/compiler-utils"
import { expectSome } from "@helios-lang/type-utils"
import { Expr } from "../expressions/index.js"
import { Scope } from "../scopes/index.js"
import { DefaultTypeClass, Parameter } from "../typecheck/index.js"

/**
 * @typedef {import("../typecheck/index.js").TypeClass} TypeClass
 */

export class TypeParameter {
    #name
    #typeClassExpr

    /**
     * @param {Word} name
     * @param {Option<Expr>} typeClassExpr
     */
    constructor(name, typeClassExpr) {
        this.#name = name
        this.#typeClassExpr = typeClassExpr
    }

    /**
     * @type {string}
     */
    get name() {
        return this.#name.value
    }

    /**
     * @type {TypeClass}
     */
    get typeClass() {
        if (this.#typeClassExpr) {
            return expectSome(this.#typeClassExpr.cache?.asTypeClass)
        } else {
            return new DefaultTypeClass()
        }
    }

    /**
     * @param {Scope} scope
     * @param {string} path
     * @returns {Parameter}
     */
    eval(scope, path) {
        /**
         * @type {TypeClass}
         */
        let typeClass = new DefaultTypeClass()

        if (this.#typeClassExpr) {
            const typeClass_ = this.#typeClassExpr.eval(scope)

            if (!typeClass_.asTypeClass) {
                throw CompilerError.type(
                    this.#typeClassExpr.site,
                    "not a typeclass"
                )
            } else {
                typeClass = typeClass_.asTypeClass
            }
        }

        const parameter = new Parameter(this.name, path, typeClass)

        scope.set(
            this.#name,
            typeClass.toType(this.#name.value, path, parameter)
        )

        return parameter
    }

    /**
     * @returns {string}
     */
    toString() {
        if (this.#typeClassExpr) {
            return `${this.#name}: ${this.#typeClassExpr.toString()}`
        } else {
            return `${this.#name}`
        }
    }
}
