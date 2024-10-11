import { CompilerError, SymbolToken, Word } from "@helios-lang/compiler-utils"
import { $ } from "@helios-lang/ir"
import { expectSome } from "@helios-lang/type-utils"
import { TAB, ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import { Expr } from "./Expr.js"

/**
 * @typedef {import("@helios-lang/ir").SourceMappedStringI} SourceMappedStringI
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
    #op
    #a
    #b
    #swap // swap a and b for commutative ops
    #alt // use alt (each operator can have one overload)

    /**
     * @param {SymbolToken} op
     * @param {Expr} a
     * @param {Expr} b
     */
    constructor(op, a, b) {
        super(op.site)
        this.#op = op
        this.#a = a
        this.#b = b
        this.#swap = false
        this.#alt = 0
    }

    /**
     * @type {Expr}
     */
    get first() {
        return this.#swap ? this.#b : this.#a
    }

    /**
     * @type {Expr}
     */
    get second() {
        return this.#swap ? this.#a : this.#b
    }

    toString() {
        return `${this.#a.toString()} ${this.#op.toString()} ${this.#b.toString()}`
    }

    /**
     * Turns op symbol into internal name
     * @param {number} alt
     * @returns {Word}
     */
    translateOp(alt = 0) {
        const op = this.#op.toString()
        const site = this.#op.site

        let name = BINARY_SYMBOLS_MAP[op]

        if (!name) {
            throw new Error("unhandled")
        }

        if (alt > 0) {
            name += alt.toString()
        }

        return new Word(name, site)
    }

    /**
     * @returns {boolean}
     */
    isCommutative() {
        switch (this.#op.toString()) {
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
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    evalInternal(scope) {
        const a_ = this.#a.eval(scope)
        const b_ = this.#b.eval(scope)

        const a = a_.asInstance
        if (!a) {
            throw CompilerError.type(
                this.#a.site,
                `lhs of ${this.#op.toString()} not an instance`
            )
        }

        const b = b_.asInstance
        if (!b) {
            throw CompilerError.type(
                this.#b.site,
                `rhs of ${this.#op.toString()} not an instance`
            )
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
                    let res = fnVal.call(this.#op.site, [first, second])

                    this.#swap = swap
                    this.#alt = alt

                    return res
                }
            }
        }

        throw CompilerError.type(
            this.site,
            `'${a.type.toString()} ${this.#op.toString()} ${b.type.toString()}' undefined`
        )
    }

    /**
     * @param {ToIRContext} ctx
     * @returns {SourceMappedStringI}
     */
    toIR(ctx) {
        let path = expectSome(this.first.cache?.asTyped?.type.asNamed).path

        let op = this.translateOp(this.#alt).value

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
