import { CompilerError } from "@helios-lang/compiler-utils"
import { $, SourceMappedString } from "@helios-lang/ir"
import { TAB, ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import { Expr } from "./Expr.js"
import { VoidExpr } from "./VoidExpr.js"

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

    /**
     * @readonly
     * @type {Expr}
     */
    body

    /**
     * @param {Site} site
     * @param {Expr} body
     */
    constructor(site, body) {
        this.site = site
        this.body = body
    }

    /**
     * @param {Scope} scope
     * @returns {Typed}
     */
    eval(scope) {
        const bodyVal_ = this.body.eval(scope)

        const bodyVal = bodyVal_.asTyped

        if (!bodyVal) {
            throw CompilerError.type(this.body.site, "not typed")
        }

        return bodyVal
    }

    /**
     * @returns {boolean}
     */
    isVoid() {
        return this.body instanceof VoidExpr
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
            this.body.toIR(ctx.tab()),
            $(`\n${ctx.indent}}`)
        ])
    }

    toString() {
        return `else => ${this.body.toString()}`
    }
}
