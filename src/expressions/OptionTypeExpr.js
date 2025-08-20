import { Scope } from "../scopes/index.js"
import { OptionType$ } from "../typecheck/index.js"
import { Expr } from "./Expr.js"

/**
 * @import { Site } from "@helios-lang/compiler-utils"
 * @import { TypeCheckContext } from "../index.js"
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
     * @param {TypeCheckContext} ctx
     * @param {Scope} scope
     * @returns {Type}
     */
    evalInternal(ctx, scope) {
        const someType = this._someTypeExpr.evalAsType(ctx, scope)

        return OptionType$(someType)
    }

    /**
     * @returns {string}
     */
    toString() {
        return `Option[${this._someTypeExpr.toString()}]`
    }
}
