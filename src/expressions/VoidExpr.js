import { $ } from "@helios-lang/ir"
import { ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import { VoidEntity } from "../typecheck/index.js"
import { Expr } from "./Expr.js"

/**
 * @import { Site } from "@helios-lang/compiler-utils"
 * @import { SourceMappedStringI } from "@helios-lang/ir"
 * @import { TypeCheckContext } from "../index.js"
 * @typedef {import("../typecheck/index.js").Instance} Instance
 */

/**
 * Helios equivalent of unit
 * TODO: inherit from ParensExpr (with empty fields)
 */
export class VoidExpr extends Expr {
    /**
     * @param {Site} site
     */
    constructor(site) {
        super(site)
    }

    /**
     * @param {TypeCheckContext} _ctx
     * @param {Scope} _scope
     * @returns {Instance}
     */
    evalInternal(_ctx, _scope) {
        return new VoidEntity()
    }

    /**
     * @param {ToIRContext} ctx
     * @returns {SourceMappedStringI}
     */
    toIR(ctx) {
        return $("()", this.site)
    }

    /**
     * @returns {string}
     */
    toString() {
        return "()"
    }
}
