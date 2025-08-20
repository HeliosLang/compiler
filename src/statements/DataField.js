import { makeTypeError } from "@helios-lang/compiler-utils"
import { expectDefined, isDefined } from "@helios-lang/type-utils"
import { Expr, NameTypePair } from "../expressions/index.js"
import { Scope } from "../scopes/index.js"
import { isDataType } from "../typecheck/index.js"

/**
 * @import { StringLiteral, Word } from "@helios-lang/compiler-utils"
 * @import { TypeCheckContext } from "../index.js"
 * @typedef {import("../typecheck/index.js").DataType} DataType
 */

/**
 * Single field in struct or enum member
 */
export class DataField extends NameTypePair {
    /**
     * @readonly
     * @private
     * @type {string | undefined}
     */
    encodingKey

    /**
     * @param {Word} name
     * @param {Expr} typeExpr
     * @param {StringLiteral | undefined} encodingKey
     */
    constructor(name, typeExpr, encodingKey = undefined) {
        super(name, typeExpr)
        this.encodingKey = encodingKey?.value
    }

    /**
     * Throws an error if called before evalType()
     * @type {DataType}
     */
    get type() {
        return expectDefined(super.type.asDataType)
    }

    /**
     * @returns {boolean}
     */
    hasEncodingKey() {
        return isDefined(this.encodingKey)
    }

    /**
     * @type {string}
     */
    get encodedFieldName() {
        // throw new Error("DataField.tag is deprecated, use DataField.encodingKey instead")
        return this.encodingKey || this.name.value
    }

    /**
     * Evaluates the type, used by FuncLiteralExpr and DataDefinition
     * @param {TypeCheckContext} ctx
     * @param {Scope} scope
     * @returns {DataType | undefined}
     */
    eval(ctx, scope) {
        if (!this.typeExpr) {
            throw new Error("typeExpr not set")
        } else {
            const t = this.typeExpr.eval(ctx, scope)

            if (t.asDataType) {
                const dt = t.asDataType

                if (isDataType(dt)) {
                    return dt
                }
            }

            ctx.errors.type(
                this.typeExpr.site,
                `'${t.toString()}' isn't a valid data field type`
            )
        }
    }
}
