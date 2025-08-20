import { makeTypeError } from "@helios-lang/compiler-utils"
import { Scope } from "../scopes/index.js"
import { AllType, MapType$ } from "../typecheck/index.js"
import { Expr } from "./Expr.js"

/**
 * @import { Site } from "@helios-lang/compiler-utils"
 * @import { TypeCheckContext } from "../index.js"
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 */

/**
 * Map[KeyType]ValueType expression
 */
export class MapTypeExpr extends Expr {
    /**
     * @private
     * @readonly
     * @type {Expr}
     */
    _keyTypeExpr

    /**
     * @private
     * @readonly
     * @type {Expr}
     */
    _valueTypeExpr

    /**
     * @param {Site} site
     * @param {Expr} keyTypeExpr
     * @param {Expr} valueTypeExpr
     */
    constructor(site, keyTypeExpr, valueTypeExpr) {
        super(site)
        this._keyTypeExpr = keyTypeExpr
        this._valueTypeExpr = valueTypeExpr
    }

    /**
     * @param {TypeCheckContext} ctx
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    evalInternal(ctx, scope) {
        const keyType_ = this._keyTypeExpr.eval(ctx, scope)

        let keyType = keyType_.asType

        if (!keyType) {
            ctx.errors.type(this._keyTypeExpr.site, "map key type not a type")
            keyType = new AllType()
        }

        const valueType_ = this._valueTypeExpr.eval(ctx, scope)

        let valueType = valueType_.asType

        if (!valueType) {
            ctx.errors.type(
                this._valueTypeExpr.site,
                "map value type not a type"
            )
            valueType = new AllType()
        }

        return MapType$(keyType, valueType)
    }

    /**
     * @returns {string}
     */
    toString() {
        return `Map[${this._keyTypeExpr.toString()}]${this._valueTypeExpr.toString()}`
    }
}
