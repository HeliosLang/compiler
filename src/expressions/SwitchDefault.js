import { CompilerError } from "@helios-lang/compiler-utils"
import { $, SourceMappedString } from "@helios-lang/ir"
import { TAB, ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import { Expr } from "./Expr.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("@helios-lang/compiler-utils").Token} Token
 * @typedef {import("../typecheck/index.js").Typed} Typed
 */

/**
 * Default switch case
 * @implements {Token}
 */
export class SwitchDefault {
    /**
     * @readonly
     * @type {Site}
     */
    site

    #bodyExpr

    /**
     * @param {Site} site
     * @param {Expr} bodyExpr
     */
    constructor(site, bodyExpr) {
        this.site = site
        this.#bodyExpr = bodyExpr
    }

    toString() {
        return `else => ${this.#bodyExpr.toString()}`
    }

    /**
     * @param {Scope} scope
     * @returns {Typed}
     */
    eval(scope) {
        const bodyVal_ = this.#bodyExpr.eval(scope)

        const bodyVal = bodyVal_.asTyped

        if (!bodyVal) {
            throw CompilerError.type(this.#bodyExpr.site, "not typed")
        }

        return bodyVal
    }

    /**
     * @param {ToIRContext} ctx
     * @returns {SourceMappedString}
     */
    toIR(ctx) {
        return $([
            $(`(_) `),
            $("->", this.site),
            $(` {\n${ctx.indent}${TAB}`),
            this.#bodyExpr.toIR(ctx.tab()),
            $(`\n${ctx.indent}}`)
        ])
    }
}
