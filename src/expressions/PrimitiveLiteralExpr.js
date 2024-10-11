import {
    BoolLiteral,
    ByteArrayLiteral,
    IntLiteral,
    RealLiteral,
    StringLiteral
} from "@helios-lang/compiler-utils"
import { $ } from "@helios-lang/ir"
import { ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import {
    BoolType,
    ByteArrayType,
    DataEntity,
    IntType,
    RealType,
    StringType
} from "../typecheck/index.js"
import { Expr } from "./Expr.js"

/**
 * @typedef {import("@helios-lang/ir").SourceMappedStringI} SourceMappedStringI
 * @typedef {import("../typecheck/index.js").DataType} DataType
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 */

/**
 * @typedef {(IntLiteral | RealLiteral | BoolLiteral | ByteArrayLiteral | StringLiteral)} PrimitiveLiteral
 */

/**
 * Literal expression class (wraps literal tokens)
 */
export class PrimitiveLiteralExpr extends Expr {
    /**
     * @private
     * @readonly
     * @type {PrimitiveLiteral}
     */
    _primitive

    /**
     * @param {PrimitiveLiteral} primitive
     */
    constructor(primitive) {
        super(primitive.site)
        this._primitive = primitive
    }

    /**
     * @type {DataType}
     */
    get type() {
        if (this._primitive instanceof IntLiteral) {
            return IntType
        } else if (this._primitive instanceof RealLiteral) {
            return RealType
        } else if (this._primitive instanceof BoolLiteral) {
            return BoolType
        } else if (this._primitive instanceof StringLiteral) {
            return StringType
        } else if (this._primitive instanceof ByteArrayLiteral) {
            return ByteArrayType
        } else {
            throw new Error("unhandled primitive type")
        }
    }

    /**
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    evalInternal(scope) {
        return new DataEntity(this.type)
    }

    /**
     * @returns {boolean}
     */
    isLiteral() {
        return true
    }

    /**
     * @param {ToIRContext} _ctx
     * @returns {SourceMappedStringI}
     */
    toIR(_ctx) {
        if (this._primitive instanceof RealLiteral) {
            return $(this._primitive.value.toString(), this._primitive.site)
        } else {
            // all literals except RealLiteral can be reused in their string-form in the IR
            return $(this._primitive.toString(), this._primitive.site)
        }
    }

    /**
     * @returns {string}
     */
    toString() {
        return this._primitive.toString()
    }
}
