import { makeTypeError } from "@helios-lang/compiler-utils"
import { $ } from "@helios-lang/ir"
import { expectDefined } from "@helios-lang/type-utils"
import { ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import { DataEntity, MapType$ } from "../typecheck/index.js"
import { Expr } from "./Expr.js"

/**
 * @import { Site } from "@helios-lang/compiler-utils"
 * @import { SourceMappedStringI } from "@helios-lang/ir"
 * @import { TypeCheckContext } from "../index.js"
 * @typedef {import("../typecheck/index.js").DataType} DataType
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 */

/**
 * Map[...]...{... : ...} expression
 * @internal
 */
export class MapLiteralExpr extends Expr {
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
     * @private
     * @readonly
     * @type {[Expr, Expr][]}
     */
    _pairExprs

    /**
     * @param {Site} site
     * @param {Expr} keyTypeExpr
     * @param {Expr} valueTypeExpr
     * @param {[Expr, Expr][]} pairExprs
     */
    constructor(site, keyTypeExpr, valueTypeExpr, pairExprs) {
        super(site)
        this._keyTypeExpr = keyTypeExpr
        this._valueTypeExpr = valueTypeExpr
        this._pairExprs = pairExprs
    }

    /**
     * @type {DataType}
     */
    get keyType() {
        return expectDefined(this._keyTypeExpr.cache?.asDataType)
    }

    /**
     * @type {DataType}
     */
    get valueType() {
        return expectDefined(this._valueTypeExpr.cache?.asDataType)
    }

    /**
     * @param {TypeCheckContext} ctx
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    evalInternal(ctx, scope) {
        const keyType_ = this._keyTypeExpr.eval(ctx, scope)

        const keyType = keyType_.asDataType
        if (!keyType) {
            throw makeTypeError(
                this._keyTypeExpr.site,
                "key-type of Map can't be func"
            )
        }

        const valueType_ = this._valueTypeExpr.eval(ctx, scope)

        const valueType = valueType_.asDataType
        if (!valueType) {
            throw makeTypeError(
                this._valueTypeExpr.site,
                "value-type of Map can't be func"
            )
        }

        for (let [keyExpr, valueExpr] of this._pairExprs) {
            const keyVal_ = keyExpr.eval(ctx, scope)
            if (!keyVal_) {
                continue
            }

            const keyVal = keyVal_.asTyped
            if (!keyVal) {
                throw makeTypeError(keyExpr.site, "not typed")
                continue
            }

            const valueVal_ = valueExpr.eval(ctx, scope)
            if (!valueVal_) {
                continue
            }

            const valueVal = valueVal_.asTyped
            if (!valueVal) {
                throw makeTypeError(valueExpr.site, "not typed")
                continue
            }

            if (!keyType.isBaseOf(keyVal.type)) {
                throw makeTypeError(
                    keyExpr.site,
                    `expected ${keyType.toString()} for map key, got ${keyVal.toString()}`
                )
                continue
            }

            if (!valueType.isBaseOf(valueVal.type)) {
                throw makeTypeError(
                    valueExpr.site,
                    `expected ${valueType.toString()} for map value, got ${valueVal.toString()}`
                )
                continue
            }
        }

        return new DataEntity(MapType$(keyType, valueType))
    }

    /**
     * @returns {boolean}
     */
    isLiteral() {
        return true
    }

    /**
     * @param {ToIRContext} ctx
     * @returns {SourceMappedStringI}
     */
    toIR(ctx) {
        let ir = $("__core__mkNilPairData(())")

        // starting from last element, keeping prepending a data version of that item

        for (let i = this._pairExprs.length - 1; i >= 0; i--) {
            let [keyExpr, valueExpr] = this._pairExprs[i]

            let keyIR = $([
                $(`${this.keyType.path}____to_data`),
                $("("),
                keyExpr.toIR(ctx),
                $(")")
            ])

            let valueIR = $([
                $(`${this.valueType.path}____to_data`),
                $("("),
                valueExpr.toIR(ctx),
                $(")")
            ])

            ir = $(
                [
                    $("__core__mkCons("),
                    $("__core__mkPairData("),
                    keyIR,
                    $(","),
                    valueIR,
                    $(")"),
                    $(", "),
                    ir,
                    $(")")
                ],
                this.site
            )
        }

        return ir
    }

    /**
     * @returns {string}
     */
    toString() {
        return `Map[${this._keyTypeExpr.toString()}]${this._valueTypeExpr.toString()}{${this._pairExprs.map(([keyExpr, valueExpr]) => `${keyExpr.toString()}: ${valueExpr.toString()}`).join(", ")}}`
    }
}
