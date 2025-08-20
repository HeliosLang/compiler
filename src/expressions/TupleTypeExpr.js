import { makeTypeError } from "@helios-lang/compiler-utils"
import { Scope } from "../scopes/index.js"
import { AllType, TupleType$ } from "../typecheck/index.js"
import { Expr } from "./Expr.js"

/**
 * @import { Site } from "@helios-lang/compiler-utils"
 * @import { TypeCheckContext } from "../index.js"
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 */

export class TupleTypeExpr extends Expr {
    /**
     * @private
     * @readonly
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
        let itemTypes_ = this._itemTypeExprs.map((ite) => {
            const ite_ = ite.eval(ctx, scope)

            const itemType = ite_.asType

            if (!itemType) {
                ctx.errors.type(ite.site, "not a type")
                return new AllType()
            }

            return itemType
        })

        if (itemTypes_.length > 10) {
            ctx.errors.type(
                this.site,
                "too many Type type args (limited to 10)"
            )

            itemTypes_ = itemTypes_.slice(0, 10)
        }

        return TupleType$(itemTypes_)
    }

    /**
     * @returns {string}
     */
    toString() {
        return `(${this._itemTypeExprs.map((ite) => ite.toString()).join(", ")})`
    }
}
