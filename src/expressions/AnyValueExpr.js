import { $ } from "@helios-lang/ir"
import { ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import { AnyEntity } from "../typecheck/index.js"
import { Expr } from "./Expr.js"

/**
 * @import { Site } from "@helios-lang/compiler-utils"
 * @import { SourceMappedStringI } from "@helios-lang/ir"
 * @import { TypeCheckContext } from "../index.js"
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
     * @param {TypeCheckContext} ctx
     * @param {Scope} _scope
     * @returns {Instance}
     */
    evalInternal(ctx, _scope) {
        return new AnyEntity()
    }

    /**
     * @param {ToIRContext} _ctx
     * @returns {SourceMappedStringI}
     */
    toIR(_ctx) {
        return $("()", this.site)
    }

    /**
     * @returns {string}
     */
    toString() {
        return "Any"
    }
}
