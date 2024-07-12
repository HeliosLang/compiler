import { $, SourceMappedString } from "@helios-lang/ir"
import { ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import { AnyEntity } from "../typecheck/index.js"
import { Expr } from "./Expr.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("../typecheck/index.js").Instance} Instance
 */

/**
 * Dummy expressions returned by parser if syntax is invalid
 */
export class AnyValueExpr extends Expr {
    /**
     * @param {Site} site
     */
    constructor(site) {
        super(site)
    }

    /**
     * @param {Scope} scope
     * @returns {Instance}
     */
    evalInternal(scope) {
        return new AnyEntity()
    }

    /**
     * @param {ToIRContext} ctx
     * @returns {SourceMappedString}
     */
    toIR(ctx) {
        return $("()", this.site)
    }

    /**
     * @returns {string}
     */
    toString() {
        return "Any"
    }
}
