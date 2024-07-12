import { Scope } from "../scopes/index.js"
import { VoidType } from "../typecheck/index.js"
import { Expr } from "./Expr.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 */

/**
 * '()' which can only be used as return type of func
 */
export class VoidTypeExpr extends Expr {
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
        return new VoidType()
    }

    /**
     * @returns {string}
     */
    toString() {
        return "()"
    }
}
