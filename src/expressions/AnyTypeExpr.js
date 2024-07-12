import { Scope } from "../scopes/index.js"
import { AnyType } from "../typecheck/index.js"
import { Expr } from "./Expr.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 */

/**
 * Resolves to Any, used by parseTypeExpr to return something if the syntax is invalid
 */
export class AnyTypeExpr extends Expr {
    /**
     * @param {Site} site
     */
    constructor(site) {
        super(site)
    }

    /**
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    evalInternal(scope) {
        return new AnyType()
    }

    /**
     * @returns {string}
     */
    toString() {
        return "Any"
    }
}
