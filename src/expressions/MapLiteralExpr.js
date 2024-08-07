import { CompilerError } from "@helios-lang/compiler-utils"
import { expectSome } from "@helios-lang/type-utils"
import { ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import { DataEntity, MapType$ } from "../typecheck/index.js"
import { Expr } from "./Expr.js"
import { $, SourceMappedString } from "@helios-lang/ir"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("../typecheck/index.js").DataType} DataType
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 */

/**
 * Map[...]...{... : ...} expression
 * @internal
 */
export class MapLiteralExpr extends Expr {
    #keyTypeExpr
    #valueTypeExpr
    #pairExprs

    /**
     * @param {Site} site
     * @param {Expr} keyTypeExpr
     * @param {Expr} valueTypeExpr
     * @param {[Expr, Expr][]} pairExprs
     */
    constructor(site, keyTypeExpr, valueTypeExpr, pairExprs) {
        super(site)
        this.#keyTypeExpr = keyTypeExpr
        this.#valueTypeExpr = valueTypeExpr
        this.#pairExprs = pairExprs
    }

    /**
     * @type {DataType}
     */
    get keyType() {
        return expectSome(this.#keyTypeExpr.cache?.asDataType)
    }

    /**
     * @type {DataType}
     */
    get valueType() {
        return expectSome(this.#valueTypeExpr.cache?.asDataType)
    }

    /**
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    evalInternal(scope) {
        const keyType_ = this.#keyTypeExpr.eval(scope)

        const keyType = keyType_.asDataType
        if (!keyType) {
            throw CompilerError.type(
                this.#keyTypeExpr.site,
                "key-type of Map can't be func"
            )
        }

        const valueType_ = this.#valueTypeExpr.eval(scope)

        const valueType = valueType_.asDataType
        if (!valueType) {
            throw CompilerError.type(
                this.#valueTypeExpr.site,
                "value-type of Map can't be func"
            )
        }

        for (let [keyExpr, valueExpr] of this.#pairExprs) {
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
     * @returns {SourceMappedString}
     */
    toIR(ctx) {
        let ir = $("__core__mkNilPairData(())")

        // starting from last element, keeping prepending a data version of that item

        for (let i = this.#pairExprs.length - 1; i >= 0; i--) {
            let [keyExpr, valueExpr] = this.#pairExprs[i]

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
        return `Map[${this.#keyTypeExpr.toString()}]${this.#valueTypeExpr.toString()}{${this.#pairExprs.map(([keyExpr, valueExpr]) => `${keyExpr.toString()}: ${valueExpr.toString()}`).join(", ")}}`
    }
}
