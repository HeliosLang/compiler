import { CompilerError } from "@helios-lang/compiler-utils"
import { $, SourceMappedString } from "@helios-lang/ir"
import { expectSome } from "@helios-lang/type-utils"
import { ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import { FuncType } from "../typecheck/index.js"
import { Expr } from "./Expr.js"
import { MemberExpr } from "./MemberExpr.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 * @typedef {import("../typecheck/index.js").Type} Type
 */

/**
 * value[...] expression
 */
export class ParametricExpr extends Expr {
    #baseExpr
    #parameters

    /**
     * @param {Site} site - site of brackets
     * @param {Expr} baseExpr
     * @param {Expr[]} parameters
     */
    constructor(site, baseExpr, parameters) {
        super(site)
        this.#baseExpr = baseExpr
        this.#parameters = parameters
    }

    /**
     * @type {Type[]}
     */
    get paramTypes() {
        return this.#parameters.map((p) => {
            const pt = p.cache?.asType

            if (!pt) {
                throw new Error("not a type")
            }

            return pt
        })
    }

    /**
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    evalInternal(scope) {
        const paramTypes = this.#parameters.map((p) => p.evalAsType(scope))

        const baseVal = this.#baseExpr.eval(scope)

        if (!baseVal.asParametric) {
            throw CompilerError.type(
                this.site,
                `'${baseVal.toString()}' isn't a parametric type`
            )
        }

        return baseVal.asParametric.apply(paramTypes, this.site)
    }

    /**
     * Reused by CallExpr
     * @param {Type[]} paramTypes
     * @returns {string}
     */
    static toApplicationIR(paramTypes) {
        return `[${paramTypes
            .map((pt) => {
                if (pt instanceof FuncType) {
                    return "__fn"
                } else {
                    return expectSome(pt.asNamed).path
                }
            })
            .join("@")}]`
    }

    /**
     * @param {ToIRContext} ctx
     * @returns {SourceMappedString}
     */
    toIR(ctx) {
        const params = ParametricExpr.toApplicationIR(this.paramTypes)

        if (this.#baseExpr instanceof MemberExpr) {
            return this.#baseExpr.toIR(ctx, params)
        } else {
            return $(
                [$`${this.#baseExpr.toIR(ctx).toString()}${params}`],
                this.site
            )
        }
    }

    /**
     * @returns {string}
     */
    toString() {
        return `${this.#baseExpr.toString()}[${this.#parameters.map((p) => p.toString()).join(", ")}]`
    }
}
