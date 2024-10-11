import { CompilerError } from "@helios-lang/compiler-utils"
import { Scope } from "../scopes/index.js"
import { MapType$ } from "../typecheck/index.js"
import { Expr } from "./Expr.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
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
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    evalInternal(scope) {
        const keyType_ = this._keyTypeExpr.eval(scope)

        const keyType = keyType_.asType

        if (!keyType) {
            throw CompilerError.type(
                this._keyTypeExpr.site,
                "map key type not a type"
            )
        }

        const valueType_ = this._valueTypeExpr.eval(scope)

        const valueType = valueType_.asType

        if (!valueType) {
            throw CompilerError.type(
                this._valueTypeExpr.site,
                "map value type not a type"
            )
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
