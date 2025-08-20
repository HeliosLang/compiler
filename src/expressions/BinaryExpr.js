import { makeTypeError, makeWord } from "@helios-lang/compiler-utils"
import { $ } from "@helios-lang/ir"
import { expectDefined } from "@helios-lang/type-utils"
import { TAB, ToIRContext } from "../codegen/index.js"
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
 * @type {{[name: string]: string}}
 */
export const BINARY_SYMBOLS_MAP = {
    "||": "__or",
    "&&": "__and",
    "==": "__eq",
    "!=": "__neq",
    "<": "__lt",
    "<=": "__leq",
    ">": "__gt",
    ">=": "__geq",
    "+": "__add",
    "-": "__sub",
    "*": "__mul",
    "/": "__div",
    "%": "__mod"
}

/**
 * Binary operator expression
 */
export class BinaryExpr extends Expr {
    /**
     * @private
     * @readonly
     * @typedef {SymbolToken}
     */
    _op

    /**
     * @private
     * @readonly
     * @typedef {Expr}
     */
    _a

    /**
     * @private
     * @readonly
     * @typedef {Expr}
     */
    _b

    /**
     * @private
     * @type {boolean}
     */
    _swap // swap a and b for commutative ops

    /**
     * @private
     * @type {number}
     */
    _alt // use alt (each operator can have one overload)

    /**
     * @param {SymbolToken} op
     * @param {Expr} a
     * @param {Expr} b
     */
    constructor(op, a, b) {
        super(op.site)
        this._op = op
        this._a = a
        this._b = b
        this._swap = false
        this._alt = 0
    }

    /**
     * @type {Expr}
     */
    get first() {
        return this._swap ? this._b : this._a
    }

    /**
     * @type {Expr}
     */
    get second() {
        return this._swap ? this._a : this._b
    }

    /**
     * @returns {string}
     */
    toString() {
        return `${this._a.toString()} ${this._op.toString()} ${this._b.toString()}`
    }

    /**
     * Turns op symbol into internal name
     * @param {number} alt
     * @returns {Word}
     */
    translateOp(alt = 0) {
        const op = this._op.toString()
        const site = this._op.site

        let name = BINARY_SYMBOLS_MAP[op]

        if (!name) {
            throw new Error("unhandled")
        }

        if (alt > 0) {
            name += alt.toString()
        }

        return makeWord({ value: name, site })
    }

    /**
     * @returns {boolean}
     */
    isCommutative() {
        switch (this._op.toString()) {
            case "+":
            case "*":
            case "==":
            case "!=":
                return true
            default:
                return false
        }
    }

    /**
     * @param {TypeCheckContext} ctx
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    evalInternal(ctx, scope) {
        const a_ = this._a.eval(ctx, scope)
        const b_ = this._b.eval(ctx, scope)

        const a = a_.asInstance
        if (!a) {
            ctx.errors.type(
                this._a.site,
                `lhs of ${this._op.toString()} not an instance`
            )

            return new DataEntity(new AnyType())
        }

        const b = b_.asInstance
        if (!b) {
            ctx.errors.type(
                this._b.site,
                `rhs of ${this._op.toString()} not an instance`
            )

            return new DataEntity(new AnyType())
        }

        for (let swap of this.isCommutative() ? [false, true] : [false]) {
            for (let alt of [0, 1, 2]) {
                let first = swap ? b : a
                let second = swap ? a : b

                const fnVal_ =
                    first.type.typeMembers[this.translateOp(alt).value]

                let fnVal = fnVal_?.asType?.toTyped()?.asFunc
                if (!fnVal) {
                    continue
                }

                if (
                    fnVal.funcType.argTypes[0].isBaseOf(first.type) &&
                    fnVal.funcType.argTypes[1].isBaseOf(second.type)
                ) {
                    let res = fnVal.call(this._op.site, [first, second])

                    this._swap = swap
                    this._alt = alt

                    return res
                }
            }
        }

        ctx.errors.type(
            this.site,
            `'${a.type.toString()} ${this._op.toString()} ${b.type.toString()}' undefined`
        )

        return new DataEntity(new AnyType())
    }

    /**
     * @param {ToIRContext} ctx
     * @returns {SourceMappedStringI}
     */
    toIR(ctx) {
        let path = expectDefined(this.first.cache?.asTyped?.type.asNamed).path

        let op = this.translateOp(this._alt).value

        if (op == "__and" || op == "__or") {
            return $([
                $(`${path}${op}`, this.site),
                $(`(\n${ctx.indent}${TAB}() -> {`),
                this.first.toIR(ctx.tab()),
                $(`},\n${ctx.indent}${TAB}() -> {`),
                this.second.toIR(ctx.tab()),
                $(`}\n${ctx.indent})`)
            ])
        } else {
            return $([
                $(`${path}__${op}`, this.site),
                $("(", this.site),
                this.first.toIR(ctx),
                $(", "),
                this.second.toIR(ctx),
                $(")")
            ])
        }
    }
}
