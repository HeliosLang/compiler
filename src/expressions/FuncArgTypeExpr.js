import { makeTypeError } from "@helios-lang/compiler-utils"
import { Scope } from "../scopes/index.js"
import { AllType, ArgType } from "../typecheck/index.js"
import { Expr } from "./Expr.js"

/**
 * @import { Site, Word } from "@helios-lang/compiler-utils"
 * @import { TypeCheckContext } from "../index.js"
 */

/**
 * @typedef {{
 *   site: Site
 *   isNamed(): boolean
 *   isOptional(): boolean
 *   eval(ctx: TypeCheckContext, scope: Scope): ArgType
 *   toString(): string
 * }} FuncArgTypeExprI
 */

/**
 * @implements {FuncArgTypeExprI}
 */
export class FuncArgTypeExpr {
    /**
     * @readonly
     * @type {Site}
     */
    site

    /**
     * @private
     * @readonly
     * @type {Word | undefined}
     */
    _name

    /**
     * @private
     * @readonly
     * @type {Expr}
     */
    _typeExpr

    /**
     * @private
     * @readonly
     * @type {boolean}
     */
    _optional

    /**
     * @param {Site} site
     * @param {Word | undefined} name
     * @param {Expr} typeExpr
     * @param {boolean} optional
     */
    constructor(site, name, typeExpr, optional) {
        this.site = site
        this._name = name
        this._typeExpr = typeExpr
        this._optional = optional
    }

    /**
     * @returns {boolean}
     */
    isNamed() {
        return !this._name
    }

    /**
     * @returns {boolean}
     */
    isOptional() {
        return this._optional
    }

    /**
     * @param {TypeCheckContext} ctx
     * @param {Scope} scope
     * @returns {ArgType}
     */
    eval(ctx, scope) {
        const type_ = this._typeExpr.eval(ctx, scope)

        const type = type_.asType

        if (!type) {
            ctx.errors.type(
                this._typeExpr.site,
                `'${type_.toString()}' isn't a type`
            )
        }

        return new ArgType(this._name, type ?? new AllType(), this._optional)
    }

    /**
     * @returns {string}
     */
    toString() {
        return [
            this._name != null ? `${this._name.toString()}: ` : "",
            this._optional ? "?" : "",
            this._typeExpr.toString()
        ].join("")
    }
}
