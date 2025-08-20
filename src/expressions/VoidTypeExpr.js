import { Scope } from "../scopes/index.js"
import { VoidType } from "../typecheck/index.js"
import { Expr } from "./Expr.js"

/**
 * @import { Site } from "@helios-lang/compiler-utils"
 * @import { TypeCheckContext } from "../index.js"
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
     * @param {TypeCheckContext} _ctx
     * @param {Scope} _scope
     * @returns {EvalEntity}
     */
    evalInternal(_ctx, _scope) {
        return new VoidType()
    }

    /**
     * @returns {string}
     */
    toString() {
        return "()"
    }
}
