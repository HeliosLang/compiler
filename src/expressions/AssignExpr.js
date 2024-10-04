import { CompilerError } from "@helios-lang/compiler-utils"
import { expectSome } from "@helios-lang/type-utils"
import { TAB, ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import { AnyType, DataEntity } from "../typecheck/index.js"
import { ChainExpr } from "./ChainExpr.js"
import { DestructExpr } from "./DestructExpr.js"
import { Expr } from "./Expr.js"
import { PathExpr } from "./PathExpr.js"
import { $, SourceMappedString } from "@helios-lang/ir"
import { CallExpr } from "./CallExpr.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 */

/**
 * '... = ... ; ...' expression
 */
export class AssignExpr extends ChainExpr {
    /**
     * @type {DestructExpr}
     */
    #nameType

    /**
     * @param {Site} site
     * @param {DestructExpr} nameType
     * @param {Expr} upstreamExpr
     * @param {Expr} downstreamExpr
     */
    constructor(site, nameType, upstreamExpr, downstreamExpr) {
        super(site, upstreamExpr, downstreamExpr)
        this.#nameType = nameType
    }

    /**
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    evalInternal(scope) {
        const subScope = new Scope(scope, scope.allowShadowing)

        let upstreamVal = this.upstreamExpr.eval(scope)

        if (upstreamVal && upstreamVal.asTyped) {
            if (this.#nameType.hasType() || this.#nameType.isTuple()) {
                this.#nameType.evalInAssignExpr(
                    subScope,
                    expectSome(upstreamVal.asTyped.type.asType),
                    0
                )
            } else {
                // enum variant type resulting from a constructor-like associated function must be cast back into its enum type
                if (
                    (this.upstreamExpr instanceof CallExpr &&
                        this.upstreamExpr.fnExpr instanceof PathExpr) ||
                    (this.upstreamExpr instanceof PathExpr &&
                        !this.upstreamExpr.isLiteral())
                ) {
                    const upstreamType = upstreamVal.asTyped.type

                    if (upstreamType.asEnumMemberType) {
                        upstreamVal = new DataEntity(
                            upstreamType.asEnumMemberType.parentType
                        )
                    }
                }

                subScope.set(this.#nameType.name, upstreamVal)
            }
        } else if (this.#nameType.hasType()) {
            // this is the fallback case if the upstream has itself a typeerror
            this.#nameType.evalInAssignExpr(subScope, null, 0)
        } else {
            throw CompilerError.type(
                this.upstreamExpr.site,
                "rhs isn't an instance"
            )
            subScope.set(this.#nameType.name, new DataEntity(new AnyType()))
        }

        const downstreamVal = this.downstreamExpr.eval(subScope)

        subScope.assertAllUsed()

        return downstreamVal
    }

    /**
     *
     * @param {ToIRContext} ctx
     * @returns {SourceMappedString}
     */
    toIR(ctx) {
        let inner = this.downstreamExpr.toIR(ctx.tab())

        if (this.#nameType.isTuple() && this.#nameType.isIgnored()) {
            // TODO: get rid of this on the next major version release, while making sure the default approach is equally efficient (i.e. the callback call is properly inlined)
            // keep using the old way of creating the IR in order to assure backwards compatibility
            for (let i = this.#nameType.children.length - 1; i >= 0; i--) {
                // internally generates enum-member error IR
                inner = this.#nameType.children[i].wrapDestructIR(ctx, inner, i)
            }

            const ir = $([
                this.upstreamExpr.toIR(ctx),
                $(`(\n${ctx.indent + TAB}(`),
                $(this.#nameType.children.map((nt, i) => nt.toNameIR(i))).join(
                    ", "
                ),
                $(") ->", this.site),
                $(` {\n${ctx.indent}${TAB}${TAB}`),
                inner,
                $(`\n${ctx.indent + TAB}}\n${ctx.indent})`)
            ])

            return ir
        } else {
            inner = this.#nameType.wrapDestructIR(ctx, inner, 0)

            let upstream = this.upstreamExpr.toIR(ctx)

            // enum member run-time error IR
            // TODO: should this be nestable
            if (this.#nameType.hasType()) {
                const t = this.#nameType.type

                if (t.asEnumMemberType) {
                    upstream = $([
                        $("__helios__common__assert_constr_index("),
                        upstream,
                        $(`, ${t.asEnumMemberType.constrIndex})`)
                    ])
                }
            }

            return $([
                $("("),
                this.#nameType.toNameIR(0), // wrapDestructIR depends on this name
                $(") "),
                $("->"), // TODO: this should get the semicolon site
                $(` {\n${ctx.indent}${TAB}`),
                inner,
                $(`\n${ctx.indent}}`),
                $("(", this.site), // this is the call site
                upstream,
                $(")")
            ])
        }
    }

    /**
     * @returns {string}
     */
    toString() {
        let downstreamStr = this.downstreamExpr.toString()

        return `${this.#nameType.toString()} = ${this.upstreamExpr.toString()}; ${downstreamStr}`
    }
}
