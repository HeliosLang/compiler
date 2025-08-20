import { makeTypeError } from "@helios-lang/compiler-utils"
import { $ } from "@helios-lang/ir"
import { ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import { ErrorType, VoidType } from "../typecheck/index.js"
import { Expr } from "./Expr.js"

/**
 * @import { Site } from "@helios-lang/compiler-utils"
 * @import { SourceMappedStringI } from "@helios-lang/ir"
 * @import { TypeCheckContext } from "../index.js"
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 */

/**
 * expr(...); ...
 */
export class ChainExpr extends Expr {
    /**
     * @readonly
     * @type {Expr}
     */
    upstreamExpr

    /**
     * @readonly
     * @type {Expr}
     */
    downstreamExpr

    /**
     * @param {Site} site
     * @param {Expr} upstreamExpr
     * @param {Expr} downstreamExpr
     */
    constructor(site, upstreamExpr, downstreamExpr) {
        super(site)
        this.upstreamExpr = upstreamExpr
        this.downstreamExpr = downstreamExpr
    }

    toString() {
        return `${this.upstreamExpr.toString()}; ${this.downstreamExpr.toString()}`
    }

    /**
     * @param {TypeCheckContext} ctx
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    evalInternal(ctx, scope) {
        const upstreamVal_ = this.upstreamExpr.eval(ctx, scope)

        if (upstreamVal_) {
            const upstreamVal = upstreamVal_.asTyped

            if (!upstreamVal) {
                ctx.errors.type(this.upstreamExpr.site, "upstream isn't typed")
            } else {
                if (new ErrorType().isBaseOf(upstreamVal.type)) {
                    ctx.errors.type(
                        this.downstreamExpr.site,
                        "unreachable code (upstream always throws error)"
                    )
                } else if (!new VoidType().isBaseOf(upstreamVal.type)) {
                    ctx.errors.type(
                        this.upstreamExpr.site,
                        "unexpected return value (hint: use '='"
                    )
                }
            }
        }

        return this.downstreamExpr.eval(ctx, scope)
    }

    /**
     * @param {ToIRContext} ctx
     * @returns {SourceMappedStringI}
     */
    toIR(ctx) {
        return $([
            $("__core__chooseUnit(", this.site),
            this.upstreamExpr.toIR(ctx),
            $(", "),
            this.downstreamExpr.toIR(ctx),
            $(")")
        ])
    }
}
