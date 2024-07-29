import { Word } from "@helios-lang/compiler-utils"
import { $, SourceMappedString } from "@helios-lang/ir"
import { ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import { Expr } from "./Expr.js"

/**
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 */

/**
 * Simple reference class (i.e. using a Word)
 */
export class RefExpr extends Expr {
    /**
     * @readonly
     * @type {Word}
     */
    name

    /**
     * @param {Word} name
     */
    constructor(name) {
        super(name.site)
        this.name = name
    }

    /**
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    evalInternal(scope) {
        if (this.name.value == "Some") {
            throw new Error("unexpected")
        }
        return scope.get(this.name)
    }

    /**
     * @param {ToIRContext} ctx
     * @returns {SourceMappedString}
     */
    toIR(ctx) {
        const path = this.cache?.asNamed
            ? this.cache.asNamed.path
            : this.name.value

        return $(path, this.site)
    }

    /**
     * @returns {string}
     */
    toString() {
        return this.name.toString()
    }
}
