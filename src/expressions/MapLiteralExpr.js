import { CompilerError } from "@helios-lang/compiler-utils"
import { $ } from "@helios-lang/ir"
import { expectSome } from "@helios-lang/type-utils"
import { ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import { DataEntity, MapType$ } from "../typecheck/index.js"
import { Expr } from "./Expr.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("@helios-lang/ir").SourceMappedStringI} SourceMappedStringI
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
        return expectSome(this._keyTypeExpr.cache?.asDataType)
    }

    /**
     * @type {DataType}
     */
    get valueType() {
        return expectSome(this._valueTypeExpr.cache?.asDataType)
    }

    /**
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    evalInternal(scope) {
        const keyType_ = this._keyTypeExpr.eval(scope)

        const keyType = keyType_.asDataType
        if (!keyType) {
            throw CompilerError.type(
                this._keyTypeExpr.site,
                "key-type of Map can't be func"
            )
        }

        const valueType_ = this._valueTypeExpr.eval(scope)

        const valueType = valueType_.asDataType
        if (!valueType) {
            throw CompilerError.type(
                this._valueTypeExpr.site,
                "value-type of Map can't be func"
            )
        }

        for (let [keyExpr, valueExpr] of this._pairExprs) {
            const keyVal_ = keyExpr.eval(scope)
            if (!keyVal_) {
                continue
            }

            const keyVal = keyVal_.asTyped
            if (!keyVal) {
                throw CompilerError.type(keyExpr.site, "not typed")
                continue
            }

            const valueVal_ = valueExpr.eval(scope)
            if (!valueVal_) {
                continue
            }

            const valueVal = valueVal_.asTyped
            if (!valueVal) {
                throw CompilerError.type(valueExpr.site, "not typed")
                continue
            }

            if (!keyType.isBaseOf(keyVal.type)) {
                throw CompilerError.type(
                    keyExpr.site,
                    `expected ${keyType.toString()} for map key, got ${keyVal.toString()}`
                )
                continue
            }

            if (!valueType.isBaseOf(valueVal.type)) {
                throw CompilerError.type(
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
