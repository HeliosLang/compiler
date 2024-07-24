import { CompilerError, Word } from "@helios-lang/compiler-utils"
import { $, SourceMappedString } from "@helios-lang/ir"
import { isSome } from "@helios-lang/type-utils"
import { Scope } from "../scopes/index.js"
import { AllType } from "../typecheck/index.js"
import { Expr } from "./Expr.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("../typecheck/index.js").Type} Type
 */

/**
 * NameTypePair is base class of FuncArg and DataField (differs from StructLiteralField)
 */
export class NameTypePair {
    #name
    #typeExpr

    /**
     * @param {Word} name
     * @param {Option<Expr>} typeExpr
     */
    constructor(name, typeExpr) {
        this.#name = name
        this.#typeExpr = typeExpr
    }

    /**
     * @type {Site}
     */
    get site() {
        return this.#name.site
    }

    /**
     * @type {Word}
     */
    get name() {
        return this.#name
    }

    /**
     * Throws an error if called before evalType()
     * @type {Type}
     */
    get type() {
        if (this.isIgnored()) {
            return new AllType()
        } else if (!this.#typeExpr) {
            throw new Error("typeExpr not set")
        } else {
            // asDataType might be null if the evaluation of its TypeExpr threw a syntax error
            return this.#typeExpr.cache?.asType ?? new AllType()
        }
    }

    /**
     * @type {Option<Expr>}
     */
    get typeExpr() {
        return this.#typeExpr
    }

    /**
     * @type {string}
     */
    get typeName() {
        if (!this.#typeExpr) {
            return ""
        } else {
            return this.#typeExpr.toString()
        }
    }

    /**
     * @returns {boolean}
     */
    isIgnored() {
        return this.name.value === "_"
    }

    /**
     * @returns {boolean}
     */
    hasType() {
        return isSome(this.#typeExpr)
    }

    /**
     * Evaluates the type, used by FuncLiteralExpr and DataDefinition
     * @param {Scope} scope
     * @returns {Type}
     */
    evalType(scope) {
        if (this.isIgnored()) {
            return new AllType()
        } else if (!this.#typeExpr) {
            throw new Error("typeExpr not set")
        } else {
            const t = this.#typeExpr.eval(scope)

            if (!t.asType) {
                throw CompilerError.type(
                    this.#typeExpr.site,
                    `'${t.toString()} isn't a valid type`
                )
            } else {
                return t.asType
            }
        }
    }

    /**
     * @returns {SourceMappedString}
     */
    toIR() {
        return $(this.#name.toString(), this.#name.site)
    }

    /**
     *
     * @returns {string}
     */
    toString() {
        if (!this.#typeExpr) {
            return this.name.toString()
        } else {
            return `${this.name.toString()}: ${this.#typeExpr.toString()}`
        }
    }
}
