import { makeTypeError } from "@helios-lang/compiler-utils"
import { Scope } from "../scopes/index.js"
import { AllType, ListType$ } from "../typecheck/index.js"
import { Expr } from "./Expr.js"

/**
 * @import  { Site } from "@helios-lang/compiler-utils"
 * @import { TypeCheckContext } from "../index.js"
 * @typedef {import("../typecheck/index.js").Type} Type
 */

/**
 * []ItemType
 * @internal
 */
export class ListTypeExpr extends Expr {
    /**
     * @private
     * @readonly
     * @type {Expr}
     */
    _itemTypeExpr

    /**
     * @param {Site} site
     * @param {Expr} itemTypeExpr
     */
    constructor(site, itemTypeExpr) {
        super(site)
        this._itemTypeExpr = itemTypeExpr
    }

    /**
     * @param {TypeCheckContext} ctx
     * @param {Scope} scope
     * @returns {Type}
     */
    evalInternal(ctx, scope) {
        const itemType_ = this._itemTypeExpr.eval(ctx, scope)

        let itemType = itemType_.asType

        if (!itemType) {
            ctx.errors.type(
                this._itemTypeExpr.site,
                `'${itemType_.toString()}' isn't a type`
            )

            itemType = new AllType()
        }

        return ListType$(itemType)
    }

    /**
     * @returns {string}
     */
    toString() {
        return `[]${this._itemTypeExpr.toString()}`
    }
}
