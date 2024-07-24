import { CompilerError, StringLiteral, Word } from "@helios-lang/compiler-utils"
import { expectSome, isSome } from "@helios-lang/type-utils"
import { Expr, NameTypePair } from "../expressions/index.js"
import { Scope } from "../scopes/index.js"
import { isDataType } from "../typecheck/index.js"

/**
 * @typedef {import("../typecheck/index.js").DataType} DataType
 */

/**
 * Single field in struct or enum member
 */
export class DataField extends NameTypePair {
    #tag

    /**
     * @param {Word} name
     * @param {Expr} typeExpr
     * @param {Option<StringLiteral>} tag
     */
    constructor(name, typeExpr, tag = null) {
        super(name, typeExpr)
        this.#tag = tag
    }

    /**
     * Throws an error if called before evalType()
     * @type {DataType}
     */
    get type() {
        return expectSome(super.type.asDataType)
    }

    /**
     * @returns {boolean}
     */
    hasTag() {
        return isSome(this.#tag)
    }

    /**
     * @type {string}
     */
    get tag() {
        return this.#tag ? this.#tag.value : this.name.value
    }

    /**
     * Evaluates the type, used by FuncLiteralExpr and DataDefinition
     * @param {Scope} scope
     * @returns {null | DataType}
     */
    eval(scope) {
        if (!this.typeExpr) {
            throw new Error("typeExpr not set")
        } else {
            const t = this.typeExpr.eval(scope)

            if (t.asDataType) {
                const dt = t.asDataType

                if (isDataType(dt)) {
                    return dt
                }
            }

            throw CompilerError.type(
                this.typeExpr.site,
                `'${t.toString()}' isn't a valid data field type`
            )
        }
    }
}
