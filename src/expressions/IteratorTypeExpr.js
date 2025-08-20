import { makeTypeError } from "@helios-lang/compiler-utils"
import { Scope } from "../scopes/index.js"
import { AllType, IteratorType$ } from "../typecheck/index.js"
import { Expr } from "./Expr.js"

/**
 * @import { Site } from "@helios-lang/compiler-utils"
 * @import { TypeCheckContext } from "../index.js"
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 */

/**
 * Iterator[Type1, ...] expr
 */
export class IteratorTypeExpr extends Expr {
    /**
     * @private
     * @type {Expr[]}
     */
    _itemTypeExprs

    /**
     * @param {Site} site
     * @param {Expr[]} itemTypeExprs
     */
    constructor(site, itemTypeExprs) {
        super(site)

        this._itemTypeExprs = itemTypeExprs
    }

    /**
     * @param {TypeCheckContext} ctx
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    evalInternal(ctx, scope) {
        let itemTypes = this._itemTypeExprs.map((ite) => {
            const ite_ = ite.eval(ctx, scope)

            const itemType = ite_.asType

            if (!itemType) {
                ctx.errors.type(ite.site, "not a type")
                return new AllType()
            }

            return itemType
        })

        if (itemTypes.length > 10) {
            ctx.errors.type(
                this.site,
                "too many Iterator type args (limited to 10)"
            )

            itemTypes = itemTypes.slice(0, 10)
        }

        return IteratorType$(itemTypes)
    }

    /**
     * @returns {string}
     */
    toString() {
        return `Iterator[${this._itemTypeExprs.map((ite) => ite.toString()).join(", ")}]`
    }
}
