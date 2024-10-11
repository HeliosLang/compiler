import { CompilerError, TokenSite, Word } from "@helios-lang/compiler-utils"
import { $ } from "@helios-lang/ir"
import { isSome } from "@helios-lang/type-utils"
import { Scope } from "../scopes/index.js"
import { AllType } from "../typecheck/index.js"
import { Expr } from "./Expr.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("@helios-lang/ir").SourceMappedStringI} SourceMappedStringI
 * @typedef {import("../typecheck/index.js").Type} Type
 */

/**
 * NameTypePair is base class of FuncArg and DataField (differs from StructLiteralField)
 */
export class NameTypePair {
    /**
     * @private
     * @readonly
     * @type {Word}
     */
    _name

    /**
     * @private
     * @readonly
     * @type {Option<Expr>}
     */
    _typeExpr

    /**
     * @param {Word} name
     * @param {Option<Expr>} typeExpr
     */
    constructor(name, typeExpr) {
        this._name = name
        this._typeExpr = typeExpr
    }

    /**
     * @type {Site}
     */
    get site() {
        return this._name.site
    }

    /**
     * @type {Word}
     */
    get name() {
        return this._name
    }

    /**
     * Throws an error if called before evalType()
     * @type {Type}
     */
    get type() {
        if (!this._typeExpr) {
            if (this.isIgnored()) {
                return new AllType()
            } else {
                throw new Error("typeExpr not set")
            }
        } else {
            // asDataType might be null if the evaluation of its TypeExpr threw a syntax error
            return this._typeExpr.cache?.asType ?? new AllType()
        }
    }

    /**
     * @type {Option<Expr>}
     */
    get typeExpr() {
        return this._typeExpr
    }

    /**
     * @type {string}
     */
    get typeName() {
        if (!this._typeExpr) {
            return ""
        } else {
            return this._typeExpr.toString()
        }
    }

    /**
     * @returns {boolean}
     */
    isIgnored() {
        return this.name.value.startsWith("_")
    }

    /**
     * @returns {boolean}
     */
    hasType() {
        return isSome(this._typeExpr)
    }

    /**
     * Evaluates the type, used by FuncLiteralExpr and DataDefinition
     * @param {Scope} scope
     * @returns {Type}
     */
    evalType(scope) {
        if (!this._typeExpr) {
            if (this.isIgnored()) {
                return new AllType()
            } else {
                throw CompilerError.type(
                    this.site,
                    `missing type for arg '${this.name.value}'`
                )
            }
        } else {
            const t = this._typeExpr.eval(scope)

            if (!t.asType) {
                throw CompilerError.type(
                    this._typeExpr.site,
                    `'${t.toString()} isn't a valid type`
                )
            } else {
                return t.asType
            }
        }
    }

    /**
     * @returns {SourceMappedStringI}
     */
    toIR() {
        return $(
            this._name.toString(),
            TokenSite.fromSite(this._name.site).withAlias(this._name.value)
        )
    }

    /**
     *
     * @returns {string}
     */
    toString() {
        if (!this._typeExpr) {
            return this.name.toString()
        } else {
            return `${this.name.toString()}: ${this._typeExpr.toString()}`
        }
    }
}
