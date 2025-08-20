import { makeTypeError } from "@helios-lang/compiler-utils"
import { expectDefined } from "@helios-lang/type-utils"
import { Expr } from "../expressions/index.js"
import { Scope } from "../scopes/index.js"
import { DefaultTypeClass, Parameter } from "../typecheck/index.js"

/**
 * @import { Word } from "@helios-lang/compiler-utils"
 * @import { TypeCheckContext } from "../index.js"
 * @typedef {import("../typecheck/index.js").TypeClass} TypeClass
 */

export class TypeParameter {
    /**
     * @private
     * @readonly
     * @type {Word}
     */
    _name

    /**
     * @private
     * @readonly
     * @type {Expr | undefined}
     */
    _typeClassExpr

    /**
     * @param {Word} name
     * @param {Expr | undefined} typeClassExpr
     */
    constructor(name, typeClassExpr) {
        this._name = name
        this._typeClassExpr = typeClassExpr
    }

    /**
     * @type {string}
     */
    get name() {
        return this._name.value
    }

    /**
     * @type {TypeClass}
     */
    get typeClass() {
        if (this._typeClassExpr) {
            return expectDefined(this._typeClassExpr.cache?.asTypeClass)
        } else {
            return new DefaultTypeClass()
        }
    }

    /**
     * @param {TypeCheckContext} ctx
     * @param {Scope} scope
     * @param {string} path
     * @returns {Parameter}
     */
    eval(ctx, scope, path) {
        /**
         * @type {TypeClass}
         */
        let typeClass = new DefaultTypeClass()

        if (this._typeClassExpr) {
            const typeClass_ = this._typeClassExpr.eval(ctx, scope)

            if (!typeClass_.asTypeClass) {
                throw makeTypeError(this._typeClassExpr.site, "not a typeclass")
            } else {
                typeClass = typeClass_.asTypeClass
            }
        }

        const parameter = new Parameter(this.name, path, typeClass)

        scope.set(
            this._name,
            typeClass.toType(this._name.value, path, parameter)
        )

        return parameter
    }

    /**
     * @returns {string}
     */
    toString() {
        if (this._typeClassExpr) {
            return `${this._name}: ${this._typeClassExpr.toString()}`
        } else {
            return `${this._name}`
        }
    }
}
