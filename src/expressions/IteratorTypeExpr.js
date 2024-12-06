import { makeTypeError } from "@helios-lang/compiler-utils"
import { Scope } from "../scopes/index.js"
import { IteratorType$ } from "../typecheck/index.js"
import { Expr } from "./Expr.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
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
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    evalInternal(scope) {
        const itemTypes = this._itemTypeExprs.map((ite) => {
            const ite_ = ite.eval(scope)

            const itemType = ite_.asType

            if (!itemType) {
                throw makeTypeError(ite.site, "not a type")
            }

            return itemType
        })

        if (itemTypes.length > 10) {
            throw makeTypeError(
                this.site,
                "too many Iterator type args (limited to 10)"
            )
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
