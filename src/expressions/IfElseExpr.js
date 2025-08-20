import { makeTypeError } from "@helios-lang/compiler-utils"
import { $ } from "@helios-lang/ir"
import { expectDefined } from "@helios-lang/type-utils"
import { ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import {
    BoolType,
    ErrorEntity,
    ErrorType,
    TupleType$,
    getTupleItemTypes
} from "../typecheck/index.js"
import { Expr } from "./Expr.js"

/**
 * @import { Site } from "@helios-lang/compiler-utils"
 * @import { SourceMappedStringI } from "@helios-lang/ir"
 * @import { TypeCheckContext } from "../index.js"
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 * @typedef {import("../typecheck/index.js").Type} Type
 * @typedef {import("../typecheck/index.js").Typed} Typed
 */

/**
 * if-then-else expression
 */
export class IfElseExpr extends Expr {
    /**
     * @private
     * @readonly
     * @type {Expr[]}
     */
    _conditions

    /**
     * @private
     * @readonly
     * @type {Expr[]}
     */
    _branches

    /**
     * @param {Site} site
     * @param {Expr[]} conditions
     * @param {Expr[]} branches
     */
    constructor(site, conditions, branches) {
        // the number of branches can be equal to the number of conditions in case the branches return void
        if (
            branches.length < conditions.length ||
            branches.length > conditions.length + 1
        ) {
            throw new Error("unexpected")
        }

        if (branches.length == 0) {
            throw new Error("unexpected")
        }

        super(site)
        this._conditions = conditions
        this._branches = branches
    }

    toString() {
        let s = ""
        for (let i = 0; i < this._conditions.length; i++) {
            s += `if (${this._conditions[i].toString()}) {${this._branches[i].toString()}} else `
        }

        s += `{${this._branches[this._conditions.length].toString()}}`

        return s
    }

    /**
     * @param {TypeCheckContext} ctx
     * @param {Site} site
     * @param {Type | undefined} prevType
     * @param {Type} newType
     * @returns {Type}
     */
    static reduceBranchType(ctx, site, prevType, newType) {
        if (!prevType || prevType instanceof ErrorType) {
            return newType
        } else if (newType instanceof ErrorType) {
            return prevType
        } else if (!prevType.isBaseOf(newType)) {
            if (newType.isBaseOf(prevType)) {
                return newType
            } else {
                // check if enumparent is base of newType and of prevType
                if (newType.asEnumMemberType) {
                    const parentType = newType.asEnumMemberType.parentType

                    if (
                        parentType.isBaseOf(prevType) &&
                        parentType.isBaseOf(newType)
                    ) {
                        return parentType
                    }
                }

                const prevTupleItems = getTupleItemTypes(prevType)
                const newTupleItems = getTupleItemTypes(newType)

                if (
                    prevTupleItems &&
                    newTupleItems &&
                    prevTupleItems.length == newTupleItems.length
                ) {
                    const reducedTupleItems = prevTupleItems.map((prev, i) =>
                        IfElseExpr.reduceBranchType(
                            ctx,
                            site,
                            prev,
                            newTupleItems[i]
                        )
                    )

                    if (reducedTupleItems) {
                        return TupleType$(reducedTupleItems)
                    }
                }

                ctx.errors.type(site, "inconsistent types")
                return prevType
            }
        } else {
            return prevType
        }
    }

    /**
     * @param {TypeCheckContext} ctx
     * @param {Site} site
     * @param {Type | undefined} prevType
     * @param {Typed} newValue
     * @returns {Type | undefined} - never ErrorType
     */
    static reduceBranchMultiType(ctx, site, prevType, newValue) {
        if (
            newValue.asTyped &&
            new ErrorType().isBaseOf(newValue.asTyped.type)
        ) {
            return prevType
        }

        const newType = expectDefined(newValue.asTyped).type

        if (!prevType) {
            return newType
        } else {
            return IfElseExpr.reduceBranchType(ctx, site, prevType, newType)
        }
    }

    /**
     * @param {TypeCheckContext} ctx
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    evalInternal(ctx, scope) {
        for (let c of this._conditions) {
            const cVal_ = c.eval(ctx, scope)
            if (!cVal_) {
                continue
            }

            const cVal = cVal_.asTyped

            if (!cVal || !BoolType.isBaseOf(cVal.type)) {
                ctx.errors.type(c.site, "expected bool")
            }
        }

        /**
         * @type {Type | undefined}
         */
        let branchMultiType = undefined

        for (let b of this._branches) {
            // don't allow shadowing
            const branchScope = new Scope(scope, false)

            const branchVal = b.evalAsTyped(ctx, branchScope)

            if (!branchVal) {
                continue
            }

            branchMultiType = IfElseExpr.reduceBranchMultiType(
                ctx,
                b.site,
                branchMultiType,
                branchVal
            )
        }

        if (!branchMultiType) {
            // i.e. every branch throws an error
            return new ErrorEntity()
        } else {
            return branchMultiType.toTyped()
        }
    }

    /**
     * @param {ToIRContext} ctx
     * @returns {SourceMappedStringI}
     */
    toIR(ctx) {
        let n = this._conditions.length

        // each branch actually returns a function to allow deferred evaluation
        let res = $([$("() -> {"), this._branches[n].toIR(ctx), $("}")])

        // TODO: nice indentation
        for (let i = n - 1; i >= 0; i--) {
            res = $([
                $("__core__ifThenElse("),
                this._conditions[i].toIR(ctx),
                $(", () -> {"),
                this._branches[i].toIR(ctx),
                $("}, () -> {"),
                res,
                $("()})")
            ])
        }

        return $([res, $("()", this.site)])
    }
}
