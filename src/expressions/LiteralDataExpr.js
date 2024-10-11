import { bytesToHex } from "@helios-lang/codec-utils"
import { $ } from "@helios-lang/ir"
import { ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import { DataEntity } from "../typecheck/index.js"
import { Expr } from "./Expr.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("@helios-lang/ir").SourceMappedStringI} SourceMappedStringI
 * @typedef {import("@helios-lang/uplc").UplcData} UplcData
 * @typedef {import("../typecheck/index.js").DataType} DataType
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 */

/**
 * Literal UplcData which is the result of parameter substitutions.
 */
export class LiteralDataExpr extends Expr {
    #type
    #data

    /**
     * @param {Site} site
     * @param {DataType} type
     * @param {UplcData} data
     */
    constructor(site, type, data) {
        super(site)
        this.#type = type
        this.#data = data
        this.cache = new DataEntity(this.#type)
    }

    /**
     * @internal
     * @type {DataType}
     */
    get type() {
        return this.#type
    }

    /**
     * @returns {boolean}
     */
    isLiteral() {
        return true
    }

    /**
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    evalInternal(scope) {
        return new DataEntity(this.#type)
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
        return `##${bytesToHex(this.#data.toCbor())}`
    }
}
