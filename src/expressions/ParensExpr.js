import { CompilerError } from "@helios-lang/compiler-utils"
import { TAB, ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import { ErrorType, TupleType$ } from "../typecheck/index.js"
import { Expr } from "./Expr.js"
import { $, SourceMappedString } from "@helios-lang/ir"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 */

/**
 * Parentheses expression, which is also used for tuples
 */
export class ParensExpr extends Expr {
    #exprs

    /**
     * @param {Site} site
     * @param {Expr[]} exprs
     */
    constructor(site, exprs) {
        super(site)
        this.#exprs = exprs
    }

    /**
     * @returns {boolean}
     */
    isLiteral() {
        return this.#exprs.every((e) => e.isLiteral())
    }

    /**
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    evalInternal(scope) {
        if (this.#exprs.length === 1) {
            return this.#exprs[0].eval(scope)
        } else {
            const entries = this.#exprs.map((e) => {
                const v_ = e.eval(scope)

                const v = v_.asTyped
                if (!v) {
                    throw CompilerError.type(e.site, "not typed")
                }

                if (new ErrorType().isBaseOf(v.type)) {
                    throw CompilerError.type(
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
     * @returns {SourceMappedString}
     */
    toIR(ctx) {
        if (this.#exprs.length === 1) {
            return this.#exprs[0].toIR(ctx)
        } else {
            return $(
                [
                    $(
                        `(callback) -> {\n${ctx.indent + TAB}callback(\n${ctx.indent + TAB + TAB}`,
                        this.site
                    )
                ]
                    .concat(
                        $(this.#exprs.map((e) => e.toIR(ctx.tab().tab()))).join(
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
        return `(${this.#exprs.map((e) => e.toString()).join(", ")})`
    }
}
