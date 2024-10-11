import { Scope } from "../scopes/index.js"
import { OptionType$ } from "../typecheck/index.js"
import { Expr } from "./Expr.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("../typecheck/index.js").Type} Type
 */

/**
 * Option[SomeType] expression
 * @internal
 */
export class OptionTypeExpr extends Expr {
    /**
     * @private
     * @readonly
     * @type {Expr}
     */
    _someTypeExpr

    /**
     * @param {Site} site
     * @param {Expr} someTypeExpr
     */
    constructor(site, someTypeExpr) {
        super(site)
        this._someTypeExpr = someTypeExpr
    }

    /**
     * @param {Scope} scope
     * @returns {Type}
     */
    evalInternal(scope) {
        const someType = this._someTypeExpr.evalAsType(scope)

        return OptionType$(someType)
    }

    /**
     * @returns {string}
     */
    toString() {
        return `Option[${this._someTypeExpr.toString()}]`
    }
}
