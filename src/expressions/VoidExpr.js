import { $ } from "@helios-lang/ir"
import { ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import { VoidEntity } from "../typecheck/index.js"
import { Expr } from "./Expr.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("@helios-lang/ir").SourceMappedStringI} SourceMappedStringI
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
     * @param {Scope} scope
     * @returns {Instance}
     */
    evalInternal(scope) {
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
