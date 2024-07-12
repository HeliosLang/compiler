import { CompilerError, SymbolToken, Word } from "@helios-lang/compiler-utils"
import { $, SourceMappedString } from "@helios-lang/ir"
import { expectSome } from "@helios-lang/type-utils"
import { ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import { Expr } from "./Expr.js"

/**
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 */

/**
 * Unary operator expression
 * Note: there are no post-unary operators, only pre
 */
export class UnaryExpr extends Expr {
    #op
    #a

    /**
     * @param {SymbolToken} op
     * @param {Expr} a
     */
    constructor(op, a) {
        super(op.site)
        this.#op = op
        this.#a = a
    }

    /**
     * Turns an op symbol into an internal name
     * @returns {Word}
     */
    translateOp() {
        const op = this.#op.toString()
        const site = this.#op.site

        if (op == "+") {
            return new Word("__pos", site)
        } else if (op == "-") {
            return new Word("__neg", site)
        } else if (op == "!") {
            return new Word("__not", site)
        } else {
            throw new Error("unhandled unary op")
        }
    }

    /**
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    evalInternal(scope) {
        const a_ = this.#a.eval(scope)

        const a = a_.asInstance
        if (!a) {
            throw CompilerError.type(this.#a.site, "not an instance")
        }

        const op = this.translateOp().value

        const fnVal = a.type.typeMembers[op]?.asType?.toTyped()?.asFunc

        if (fnVal) {
            // immediately applied
            return fnVal.asFunc.call(this.#op.site, [a])
        } else {
            throw CompilerError.type(
                this.#a.site,
                `'${this.#op.toString()} ${a.type.toString()}' undefined`
            )
        }
    }

    /**
     * @param {ToIRContext} ctx
     * @returns {SourceMappedString}
     */
    toIR(ctx) {
        const path = expectSome(this.cache?.asTyped?.type?.asNamed).path

        return $`${path}__${this.translateOp().value}${this.site}(${this.#a.toIR(ctx)})`
    }

    /**
     * @returns {string}
     */
    toString() {
        return `${this.#op.toString()}${this.#a.toString()}`
    }
}
