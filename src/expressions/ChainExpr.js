import { CompilerError } from "@helios-lang/compiler-utils"
import { ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import { ErrorType, VoidType } from "../typecheck/index.js"
import { Expr } from "./Expr.js"
import { $, SourceMappedString } from "@helios-lang/ir"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
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
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    evalInternal(scope) {
        const upstreamVal_ = this.upstreamExpr.eval(scope)

        if (upstreamVal_) {
            const upstreamVal = upstreamVal_.asTyped

            if (!upstreamVal) {
                throw CompilerError.type(
                    this.upstreamExpr.site,
                    "upstream isn't typed"
                )
            } else {
                if (new ErrorType().isBaseOf(upstreamVal.type)) {
                    throw CompilerError.type(
                        this.downstreamExpr.site,
                        "unreachable code (upstream always throws error)"
                    )
                } else if (!new VoidType().isBaseOf(upstreamVal.type)) {
                    throw CompilerError.type(
                        this.upstreamExpr.site,
                        "unexpected return value (hint: use '='"
                    )
                }
            }
        }

        return this.downstreamExpr.eval(scope)
    }

    /**
     * @param {ToIRContext} ctx
     * @returns {SourceMappedString}
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
