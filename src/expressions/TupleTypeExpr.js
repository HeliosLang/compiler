import { CompilerError } from "@helios-lang/compiler-utils"
import { Scope } from "../scopes/index.js"
import { TupleType$ } from "../typecheck/index.js"
import { Expr } from "./Expr.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 */

export class TupleTypeExpr extends Expr {
    #itemTypeExprs

    /**
     * @param {Site} site
     * @param {Expr[]} itemTypeExprs
     */
    constructor(site, itemTypeExprs) {
        super(site)
        this.#itemTypeExprs = itemTypeExprs
    }

    /**
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    evalInternal(scope) {
        const itemTypes_ = this.#itemTypeExprs.map((ite) => {
            const ite_ = ite.eval(scope)

            const itemType = ite_.asType

            if (!itemType) {
                throw CompilerError.type(ite.site, "not a type")
            }

            return itemType
        })

        if (itemTypes_.length > 10) {
            throw CompilerError.type(
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
        return `(${this.#itemTypeExprs.map((ite) => ite.toString()).join(", ")})`
    }
}
