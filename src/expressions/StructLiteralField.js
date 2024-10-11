import { Word } from "@helios-lang/compiler-utils"
import { isSome } from "@helios-lang/type-utils"
import { ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import { Expr } from "./Expr.js"

/**
 * @typedef {import("@helios-lang/ir").SourceMappedStringI} SourceMappedStringI
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 */

/**
 * Struct field (part of a literal struct constructor)
 */
export class StructLiteralField {
    /**
     * @private
     * @readonly
     * @type {Option<Word>}
     */
    _name

    /**
     * @private
     * @readonly
     * @type {Expr}
     */
    _value

    /**
     * @param {Option<Word>} name
     * @param {Expr} value
     */
    constructor(name, value) {
        this._name = name
        this._value = value
    }

    /**
     * @type {Word}
     */
    get name() {
        if (!this._name) {
            throw new Error("name of field not given")
        } else {
            return this._name
        }
    }

    get site() {
        if (!this._name) {
            return this._value.site
        } else {
            return this._name.site
        }
    }

    /**
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    eval(scope) {
        return this._value.eval(scope)
    }

    /**
     * @returns {boolean}
     */
    isNamed() {
        return isSome(this._name)
    }

    /**
     * @param {ToIRContext} ctx
     * @returns {SourceMappedStringI}
     */
    toIR(ctx) {
        return this._value.toIR(ctx)
    }

    /**
     * @returns {string}
     */
    toString() {
        if (!this._name) {
            return this._value.toString()
        } else {
            return `${this._name.toString()}: ${this._value.toString()}`
        }
    }
}
