import { makeTypeError } from "@helios-lang/compiler-utils"
import { Scope } from "../scopes/index.js"
import { TupleType$ } from "../typecheck/index.js"
import { Expr } from "./Expr.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
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
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    evalInternal(scope) {
        const itemTypes_ = this._itemTypeExprs.map((ite) => {
            const ite_ = ite.eval(scope)

            const itemType = ite_.asType

            if (!itemType) {
                throw makeTypeError(ite.site, "not a type")
            }

            return itemType
        })

        if (itemTypes_.length > 10) {
            throw makeTypeError(
                this.site,
                "too many Type type args (limited to 10)"
            )
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
