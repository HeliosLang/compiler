import { makeTypeError, makeWord } from "@helios-lang/compiler-utils"
import { $ } from "@helios-lang/ir"
import { expectDefined } from "@helios-lang/type-utils"
import { ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import { Expr } from "./Expr.js"
import { AnyType, DataEntity } from "../typecheck/common.js"

/**
 * @import { SymbolToken, Word } from "@helios-lang/compiler-utils"
 * @import { SourceMappedStringI } from "@helios-lang/ir"
 * @import { TypeCheckContext } from "../index.js"
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 */

/**
 * Unary operator expression
 * Note: there are no post-unary operators, only pre
 */
export class UnaryExpr extends Expr {
    /**
     * @private
     * @readonly
     * @type {SymbolToken}
     */
    _op

    /**
     * @private
     * @readonly
     * @type {Expr}
     */
    _a

    /**
     * @param {SymbolToken} op
     * @param {Expr} a
     */
    constructor(op, a) {
        super(op.site)
        this._op = op
        this._a = a
    }

    /**
     * Turns an op symbol into an internal name
     * @returns {Word}
     */
    translateOp() {
        const op = this._op.toString()
        const site = this._op.site

        if (op == "+") {
            return makeWord({ value: "__pos", site })
        } else if (op == "-") {
            return makeWord({ value: "__neg", site })
        } else if (op == "!") {
            return makeWord({ value: "__not", site })
        } else {
            throw new Error("unhandled unary op")
        }
    }

    /**
     * @param {TypeCheckContext} ctx
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    evalInternal(ctx, scope) {
        const a = this._a.eval(ctx, scope).asInstance

        if (!a) {
            ctx.errors.type(this._a.site, "not an instance")
            return new DataEntity(new AnyType())
        }

        const op = this.translateOp().value

        const fnVal = a.type.typeMembers[op]?.asType?.toTyped()?.asFunc

        if (fnVal) {
            // immediately applied
            return fnVal.asFunc.call(this._op.site, [a])
        } else {
            ctx.errors.type(
                this._a.site,
                `'${this._op.toString()} ${a.type.toString()}' undefined`
            )

            return new DataEntity(new AnyType())
        }
    }

    /**
     * @param {ToIRContext} ctx
     * @returns {SourceMappedStringI}
     */
    toIR(ctx) {
        const path = expectDefined(this.cache?.asTyped?.type?.asNamed).path

        return $([
            $(`${path}__${this.translateOp().value}`, this.site),
            $("("),
            this._a.toIR(ctx),
            $(")")
        ])
    }

    /**
     * @returns {string}
     */
    toString() {
        return `${this._op.toString()}${this._a.toString()}`
    }
}
