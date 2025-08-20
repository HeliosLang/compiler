import { Scope } from "../scopes/index.js"
import { AnyType } from "../typecheck/index.js"
import { Expr } from "./Expr.js"

/**
 * @import { Site } from "@helios-lang/compiler-utils"
 * @import { TypeCheckContext } from "../index.js"
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
     * @param {TypeCheckContext} _ctx
     * @param {Scope} _scope
     * @returns {EvalEntity}
     */
    evalInternal(_ctx, _scope) {
        return new AnyType()
    }

    /**
     * @returns {string}
     */
    toString() {
        return "Any"
    }
}
