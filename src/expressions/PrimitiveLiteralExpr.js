import {
    BoolLiteral,
    ByteArrayLiteral,
    IntLiteral,
    RealLiteral,
    StringLiteral
} from "@helios-lang/compiler-utils"
import { $, SourceMappedString } from "@helios-lang/ir"
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
    #primitive

    /**
     * @param {PrimitiveLiteral} primitive
     */
    constructor(primitive) {
        super(primitive.site)
        this.#primitive = primitive
    }

    /**
     * @type {DataType}
     */
    get type() {
        if (this.#primitive instanceof IntLiteral) {
            return IntType
        } else if (this.#primitive instanceof RealLiteral) {
            return RealType
        } else if (this.#primitive instanceof BoolLiteral) {
            return BoolType
        } else if (this.#primitive instanceof StringLiteral) {
            return StringType
        } else if (this.#primitive instanceof ByteArrayLiteral) {
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
     * @param {ToIRContext} ctx
     * @returns {SourceMappedString}
     */
    toIR(ctx) {
        // all literals can be reused in their string-form in the IR
        return $(this.#primitive.toString(), this.#primitive.site)
    }

    /**
     * @returns {string}
     */
    toString() {
        return this.#primitive.toString()
    }
}
