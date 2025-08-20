import { makeTypeError } from "@helios-lang/compiler-utils"
import { $ } from "@helios-lang/ir"
import { expectDefined } from "@helios-lang/type-utils"
import { ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import { DataEntity, ListType$ } from "../typecheck/index.js"
import { Expr } from "./Expr.js"

/**
 * @import { Site } from "@helios-lang/compiler-utils"
 * @import { SourceMappedStringI } from "@helios-lang/ir"
 * @import { TypeCheckContext } from "../index.js"
 * @typedef {import("../typecheck/index.js").DataType} DataType
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 */

/**
 * []{...} expression
 */
export class ListLiteralExpr extends Expr {
    /**
     * @private
     * @readonly
     * @type {Expr}
     */
    _itemTypeExpr

    /**
     * @private
     * @readonly
     * @type {Expr[]}
     */
    _itemExprs

    /**
     * @param {Site} site
     * @param {Expr} itemTypeExpr
     * @param {Expr[]} itemExprs
     */
    constructor(site, itemTypeExpr, itemExprs) {
        super(site)
        this._itemTypeExpr = itemTypeExpr
        this._itemExprs = itemExprs
    }

    /**
     * @type {DataType}
     */
    get itemType() {
        return expectDefined(this._itemTypeExpr.cache?.asDataType)
    }

    /**
     * @param {TypeCheckContext} ctx
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    evalInternal(ctx, scope) {
        const itemType_ = this._itemTypeExpr.eval(ctx, scope)

        const itemType = itemType_.asDataType

        if (!itemType) {
            throw makeTypeError(
                this._itemTypeExpr.site,
                "content of list can't be func"
            )
        }

        for (let itemExpr of this._itemExprs) {
            const itemVal_ = itemExpr.eval(ctx, scope)
            if (!itemVal_) {
                continue
            }

            const itemVal = itemVal_.asTyped

            if (!itemVal) {
                throw makeTypeError(itemExpr.site, "not typed")
                continue
            }

            if (!itemType.isBaseOf(itemVal.type)) {
                throw makeTypeError(
                    itemExpr.site,
                    `expected ${itemType.toString()}, got ${itemVal.type.toString()}`
                )
                continue
            }
        }

        return new DataEntity(ListType$(itemType))
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
        let ir = $("__core__mkNilData(())")

        // starting from last element, keeping prepending a data version of that item

        for (let i = this._itemExprs.length - 1; i >= 0; i--) {
            let itemIR = $([
                $(`${this.itemType.path}____to_data`),
                $("("),
                this._itemExprs[i].toIR(ctx),
                $(")")
            ])

            ir = $([$("__core__mkCons"), $("("), itemIR, $(", "), ir, $(")")])
        }

        return ir
    }

    /**
     * @returns {string}
     */
    toString() {
        return `[]${this._itemTypeExpr.toString()}{${this._itemExprs.map((itemExpr) => itemExpr.toString()).join(", ")}}`
    }
}
