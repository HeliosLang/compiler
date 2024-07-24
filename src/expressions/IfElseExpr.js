import { CompilerError } from "@helios-lang/compiler-utils"
import { expectSome } from "@helios-lang/type-utils"
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
import { $, SourceMappedString } from "@helios-lang/ir"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 * @typedef {import("../typecheck/index.js").Type} Type
 * @typedef {import("../typecheck/index.js").Typed} Typed
 */

/**
 * if-then-else expression
 */
export class IfElseExpr extends Expr {
    #conditions
    #branches

    /**
     * @param {Site} site
     * @param {Expr[]} conditions
     * @param {Expr[]} branches
     */
    constructor(site, conditions, branches) {
        if (branches.length != conditions.length + 1) {
            throw new Error("unexpected")
        }

        if (branches.length <= 1) {
            throw new Error("unexpected")
        }

        super(site)
        this.#conditions = conditions
        this.#branches = branches
    }

    toString() {
        let s = ""
        for (let i = 0; i < this.#conditions.length; i++) {
            s += `if (${this.#conditions[i].toString()}) {${this.#branches[i].toString()}} else `
        }

        s += `{${this.#branches[this.#conditions.length].toString()}}`

        return s
    }

    /**
     * @param {Site} site
     * @param {Option<Type>} prevType
     * @param {Type} newType
     * @returns {Type}
     */
    static reduceBranchType(site, prevType, newType) {
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
                            site,
                            prev,
                            newTupleItems[i]
                        )
                    )

                    if (reducedTupleItems) {
                        return TupleType$(reducedTupleItems)
                    }
                }

                throw CompilerError.type(site, "inconsistent types")
            }
        } else {
            return prevType
        }
    }

    /**
     * @param {Site} site
     * @param {null | Type} prevType
     * @param {Typed} newValue
     * @returns {null | Type}
     */
    static reduceBranchMultiType(site, prevType, newValue) {
        if (
            newValue.asTyped &&
            new ErrorType().isBaseOf(newValue.asTyped.type)
        ) {
            return prevType
        }

        const newType = expectSome(newValue.asTyped).type

        if (!prevType) {
            return newType
        } else {
            return IfElseExpr.reduceBranchType(site, prevType, newType)
        }
    }

    /**
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    evalInternal(scope) {
        for (let c of this.#conditions) {
            const cVal_ = c.eval(scope)
            if (!cVal_) {
                continue
            }

            const cVal = cVal_.asTyped

            if (!cVal || !BoolType.isBaseOf(cVal.type)) {
                throw CompilerError.type(c.site, "expected bool")
                continue
            }
        }

        /**
         * @type {null | Type}
         */
        let branchMultiType = null

        for (let b of this.#branches) {
            // don't allow shadowing
            const branchScope = new Scope(scope, false)

            const branchVal = b.evalAsTyped(branchScope)

            if (!branchVal) {
                continue
            }

            branchMultiType = IfElseExpr.reduceBranchMultiType(
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
     * @returns {SourceMappedString}
     */
    toIR(ctx) {
        let n = this.#conditions.length

        // each branch actually returns a function to allow deferred evaluation
        let res = $([$("() -> {"), this.#branches[n].toIR(ctx), $("}")])

        // TODO: nice indentation
        for (let i = n - 1; i >= 0; i--) {
            res = $([
                $("__core__ifThenElse("),
                this.#conditions[i].toIR(ctx),
                $(", () -> {"),
                this.#branches[i].toIR(ctx),
                $("}, () -> {"),
                res,
                $("()})")
            ])
        }

        return $([res, $("()", this.site)])
    }
}
