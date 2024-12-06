import { makeTypeError } from "@helios-lang/compiler-utils"
import { $ } from "@helios-lang/ir"
import { expectDefined } from "@helios-lang/type-utils"
import { ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import { FuncType } from "../typecheck/index.js"
import { Expr } from "./Expr.js"
import { MemberExpr } from "./MemberExpr.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("@helios-lang/ir").SourceMappedStringI} SourceMappedStringI
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 * @typedef {import("../typecheck/index.js").Type} Type
 */

/**
 * value[...] expression
 */
export class ParametricExpr extends Expr {
    /**
     * @private
     * @readonly
     * @type {Expr}
     */
    _baseExpr

    /**
     * @private
     * @readonly
     * @type {Expr[]}
     */
    _parameters

    /**
     * @param {Site} site - site of brackets
     * @param {Expr} baseExpr
     * @param {Expr[]} parameters
     */
    constructor(site, baseExpr, parameters) {
        super(site)
        this._baseExpr = baseExpr
        this._parameters = parameters
    }

    /**
     * @type {Type[]}
     */
    get paramTypes() {
        return this._parameters.map((p) => {
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
        const paramTypes = this._parameters.map((p) => p.evalAsType(scope))

        const baseVal = this._baseExpr.eval(scope)

        if (!baseVal.asParametric) {
            throw makeTypeError(
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
                    return expectDefined(pt.asNamed).path
                }
            })
            .join("@")}]`
    }

    /**
     * @param {ToIRContext} ctx
     * @returns {SourceMappedStringI}
     */
    toIR(ctx) {
        const params = ParametricExpr.toApplicationIR(this.paramTypes)

        if (this._baseExpr instanceof MemberExpr) {
            return this._baseExpr.toIR(ctx, params)
        } else {
            return $(
                [$`${this._baseExpr.toIR(ctx).toString()}${params}`],
                this.site
            )
        }
    }

    /**
     * @returns {string}
     */
    toString() {
        return `${this._baseExpr.toString()}[${this._parameters.map((p) => p.toString()).join(", ")}]`
    }
}
