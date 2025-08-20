import { makeTypeError } from "@helios-lang/compiler-utils"
import { Scope } from "../scopes/index.js"
import { AllType, FuncType } from "../typecheck/index.js"
import { Expr } from "./Expr.js"
import { FuncArgTypeExpr } from "./FuncArgTypeExpr.js"

/**
 * @import { Site } from "@helios-lang/compiler-utils"
 * @import { TypeCheckContext } from "../index.js"
 * @typedef {import("../typecheck/index.js").Type} Type
 */

/**
 * (ArgType1, ...) -> RetType expression
 */
export class FuncTypeExpr extends Expr {
    /**
     * @private
     * @readonly
     * @type {FuncArgTypeExpr[]}
     */
    _argTypeExprs

    /**
     * @private
     * @readonly
     * @type {Expr}
     */
    _retTypeExpr

    /**
     * @param {Site} site
     * @param {FuncArgTypeExpr[]} argTypeExprs
     * @param {Expr} retTypeExpr
     */
    constructor(site, argTypeExprs, retTypeExpr) {
        super(site)
        this._argTypeExprs = argTypeExprs
        this._retTypeExpr = retTypeExpr
    }

    /**
     * @param {TypeCheckContext} ctx
     * @param {Scope} scope
     * @returns {Type}
     */
    evalInternal(ctx, scope) {
        const argTypes_ = this._argTypeExprs.map((a) => a.eval(ctx, scope))

        const retType_ = this._retTypeExpr.eval(ctx, scope)

        let retType = retType_.asType

        if (!retType) {
            ctx.errors.type(this._retTypeExpr.site, "return type isn't a type")

            retType = new AllType()
        }

        return new FuncType(argTypes_, retType)
    }

    /**
     * @returns {string}
     */
    toString() {
        return `(${this._argTypeExprs.map((a) => a.toString()).join(", ")}) -> ${this._retTypeExpr.toString()}`
    }
}
