import { makeTypeError } from "@helios-lang/compiler-utils"
import { $ } from "@helios-lang/ir"
import { TAB, ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import { ErrorType, TupleType$, VoidType } from "../typecheck/index.js"
import { Expr } from "./Expr.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("@helios-lang/ir").SourceMappedStringI} SourceMappedStringI
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 */

/**
 * Parentheses expression, which is also used for tuples
 */
export class ParensExpr extends Expr {
    /**
     * @private
     * @readonly
     * @type {Expr[]}
     */
    _exprs

    /**
     * @param {Site} site
     * @param {Expr[]} exprs
     */
    constructor(site, exprs) {
        super(site)
        this._exprs = exprs
    }

    /**
     * @returns {boolean}
     */
    isLiteral() {
        return this._exprs.every((e) => e.isLiteral())
    }

    /**
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    evalInternal(scope) {
        if (this._exprs.length === 0) {
            return new VoidType().toTyped()
        } else if (this._exprs.length === 1) {
            return this._exprs[0].eval(scope)
        } else {
            const entries = this._exprs.map((e) => {
                const v_ = e.eval(scope)

                const v = v_.asTyped
                if (!v) {
                    throw makeTypeError(e.site, "not typed")
                }

                if (new ErrorType().isBaseOf(v.type)) {
                    throw makeTypeError(
                        e.site,
                        "unexpected error call in multi-valued expression"
                    )
                }

                return v.type
            })

            return TupleType$(entries).toTyped()
        }
    }

    /**
     * @param {ToIRContext} ctx
     * @returns {SourceMappedStringI}
     */
    toIR(ctx) {
        if (this._exprs.length === 0) {
            return $`()`
        } else if (this._exprs.length === 1) {
            return this._exprs[0].toIR(ctx)
        } else {
            return $(
                [
                    $(
                        `(callback) -> {\n${ctx.indent + TAB}callback(\n${ctx.indent + TAB + TAB}`,
                        this.site
                    )
                ]
                    .concat(
                        $(this._exprs.map((e) => e.toIR(ctx.tab().tab()))).join(
                            `,\n${ctx.indent + TAB + TAB}`
                        )
                    )
                    .concat([$(`\n${ctx.indent + TAB})\n${ctx.indent}}`)])
            )
        }
    }

    /**
     * @returns {string}
     */
    toString() {
        return `(${this._exprs.map((e) => e.toString()).join(", ")})`
    }
}
