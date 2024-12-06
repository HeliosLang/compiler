import { makeTypeError } from "@helios-lang/compiler-utils"
import { $ } from "@helios-lang/ir"
import { isDefined } from "@helios-lang/type-utils"
import { Scope } from "../scopes/index.js"
import { AllType } from "../typecheck/index.js"
import { Expr } from "./Expr.js"

/**
 * @import { Site, Word } from "@helios-lang/compiler-utils"
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
     * @type {Expr | undefined}
     */
    _typeExpr

    /**
     * @param {Word} name
     * @param {Expr | undefined} typeExpr
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
     * @type {Expr | undefined}
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
        return isDefined(this._typeExpr)
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
                throw makeTypeError(
                    this.site,
                    `missing type for arg '${this.name.value}'`
                )
            }
        } else {
            const t = this._typeExpr.eval(scope)

            if (!t.asType) {
                throw makeTypeError(
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
            this._name.site.withDescription(this._name.value)
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
