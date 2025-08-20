import { makeTypeError } from "@helios-lang/compiler-utils"
import { $ } from "@helios-lang/ir"
import { TAB, ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import { Expr } from "./Expr.js"
import { VoidExpr } from "./VoidExpr.js"
import { AllType, DataEntity } from "../typecheck/common.js"

/**
 * @import { Site, Token } from "@helios-lang/compiler-utils"
 * @import { SourceMappedStringI } from "@helios-lang/ir"
 * @import { TypeCheckContext } from "../index.js"
 * @typedef {import("../typecheck/index.js").Typed} Typed
 */

/**
 * Default switch case
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
     * @param {TypeCheckContext} ctx
     * @param {Scope} scope
     * @returns {Typed}
     */
    eval(ctx, scope) {
        const bodyVal_ = this.body.eval(ctx, scope)

        let bodyVal = bodyVal_.asTyped

        if (!bodyVal) {
            ctx.errors.type(this.body.site, "not typed")
            bodyVal = new DataEntity(new AllType())
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
     * @returns {SourceMappedStringI}
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
