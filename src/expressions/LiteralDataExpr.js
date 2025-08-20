import { bytesToHex } from "@helios-lang/codec-utils"
import { $ } from "@helios-lang/ir"
import { ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import { DataEntity } from "../typecheck/index.js"
import { Expr } from "./Expr.js"

/**
 * @import { Site } from "@helios-lang/compiler-utils"
 * @import { SourceMappedStringI } from "@helios-lang/ir"
 * @import { UplcData } from "@helios-lang/uplc"
 * @import { TypeCheckContext } from "../index.js"
 * @typedef {import("../typecheck/index.js").DataType} DataType
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 */

/**
 * Literal UplcData which is the result of parameter substitutions.
 */
export class LiteralDataExpr extends Expr {
    /**
     * @private
     * @readonly
     * @type {DataType}
     */
    _type

    /**
     * @private
     * @readonly
     * @type {UplcData}
     */
    _data

    /**
     * @param {Site} site
     * @param {DataType} type
     * @param {UplcData} data
     */
    constructor(site, type, data) {
        super(site)
        this._type = type
        this._data = data
        this.cache = new DataEntity(this._type)
    }

    /**
     * @internal
     * @type {DataType}
     */
    get type() {
        return this._type
    }

    /**
     * @returns {boolean}
     */
    isLiteral() {
        return true
    }

    /**
     * @param {TypeCheckContext} _ctx
     * @param {Scope} _scope
     * @returns {EvalEntity}
     */
    evalInternal(_ctx, _scope) {
        return new DataEntity(this._type)
    }

    /**
     * @param {ToIRContext} ctx
     * @returns {SourceMappedStringI}
     */
    toIR(ctx) {
        return $(this.toString(), this.site)
    }

    /**
     * @returns {string}
     */
    toString() {
        return `##${bytesToHex(this._data.toCbor())}`
    }
}
