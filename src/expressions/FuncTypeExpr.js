import { makeTypeError } from "@helios-lang/compiler-utils"
import { Scope } from "../scopes/index.js"
import { FuncType } from "../typecheck/index.js"
import { Expr } from "./Expr.js"
import { FuncArgTypeExpr } from "./FuncArgTypeExpr.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
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
     * @param {Scope} scope
     * @returns {Type}
     */
    evalInternal(scope) {
        const argTypes_ = this._argTypeExprs.map((a) => a.eval(scope))

        const retType_ = this._retTypeExpr.eval(scope)

        const retType = retType_.asType
        if (!retType) {
            throw makeTypeError(
                this._retTypeExpr.site,
                "return type isn't a type"
            )
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
