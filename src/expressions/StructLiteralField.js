import { Word } from "@helios-lang/compiler-utils"
import { SourceMappedString } from "@helios-lang/ir"
import { isSome } from "@helios-lang/type-utils"
import { ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import { Expr } from "./Expr.js"

/**
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 */

/**
 * Struct field (part of a literal struct constructor)
 */
export class StructLiteralField {
    #name
    #value

    /**
     * @param {Option<Word>} name
     * @param {Expr} value
     */
    constructor(name, value) {
        this.#name = name
        this.#value = value
    }

    /**
     * @type {Word}
     */
    get name() {
        if (!this.#name) {
            throw new Error("name of field not given")
        } else {
            return this.#name
        }
    }

    get site() {
        if (!this.#name) {
            return this.#value.site
        } else {
            return this.#name.site
        }
    }

    /**
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    eval(scope) {
        return this.#value.eval(scope)
    }

    /**
     * @returns {boolean}
     */
    isNamed() {
        return isSome(this.#name)
    }

    /**
     * @param {ToIRContext} ctx
     * @returns {SourceMappedString}
     */
    toIR(ctx) {
        return this.#value.toIR(ctx)
    }

    /**
     * @returns {string}
     */
    toString() {
        if (!this.#name) {
            return this.#value.toString()
        } else {
            return `${this.#name.toString()}: ${this.#value.toString()}`
        }
    }
}
