import { $ } from "@helios-lang/ir"
import { ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import { AnyEntity } from "../typecheck/index.js"
import { Expr } from "./Expr.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("@helios-lang/ir").SourceMappedStringI} SourceMappedStringI
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
     * @param {Scope} _scope
     * @returns {Instance}
     */
    evalInternal(_scope) {
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
