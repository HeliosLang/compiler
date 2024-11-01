import { CompilerError, Word } from "@helios-lang/compiler-utils"
import { $ } from "@helios-lang/ir"
import { expectSome } from "@helios-lang/type-utils"
import { ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import { DataEntity } from "../typecheck/index.js"
import { Expr } from "./Expr.js"
import { StructLiteralField } from "./StructLiteralField.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("@helios-lang/ir").SourceMappedStringI} SourceMappedStringI
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 * @typedef {import("../typecheck/index.js").Type} Type
 */

/**
 * Struct literal constructor
 */
export class StructLiteralExpr extends Expr {
    /**
     * @private
     * @readonly
     * @type {Expr}
     */
    _typeExpr

    /**
     * @private
     * @readonly
     * @type {StructLiteralField[]}
     */
    _fields

    /**
     * @param {Expr} typeExpr
     * @param {StructLiteralField[]} fields
     */
    constructor(typeExpr, fields) {
        super(typeExpr.site)
        this._typeExpr = typeExpr
        this._fields = fields
    }

    /**
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    evalInternal(scope) {
        const type_ = this._typeExpr.eval(scope)

        const type = type_.asDataType

        if (!type) {
            throw CompilerError.type(
                this._typeExpr.site,
                `'${this._typeExpr.toString()}' doesn't evaluate to a data type`
            )
        }

        if (type.fieldNames.length != this._fields.length) {
            throw CompilerError.type(
                this.site,
                `wrong number of fields for ${type.toString()}, expected ${type.fieldNames.length}, got ${this._fields.length}`
            )
        }

        /**
         * @param {Word} name
         * @returns {Type}
         */
        const getMemberType = (name) => {
            const memberVal = type.instanceMembers[name.value]

            if (!memberVal) {
                throw CompilerError.type(
                    name.site,
                    `member '${name.value}' not defined`
                )
            }

            const memberType = memberVal.asType

            if (!memberType) {
                throw CompilerError.type(
                    name.site,
                    `member '${name.value}' isn't a type`
                )
            }

            return memberType
        }

        for (let i = 0; i < this._fields.length; i++) {
            const f = this._fields[i]

            const fieldVal_ = f.eval(scope)

            const fieldVal = fieldVal_.asTyped
            if (!fieldVal) {
                throw CompilerError.type(f.site, "not typed")
            }

            if (f.isNamed()) {
                if (type.fieldNames.findIndex((n) => n == f.name.value) == -1) {
                    throw CompilerError.type(f.name.site, "not a valid field")
                }

                // check the named type
                const memberType = getMemberType(f.name)
                if (!memberType) {
                    continue
                }

                if (!memberType.isBaseOf(fieldVal.type)) {
                    throw CompilerError.type(
                        f.site,
                        `wrong field type for '${f.name.toString()}', expected ${memberType.toString()}, got ${fieldVal.type.toString()}`
                    )
                }
            } else {
                // check the positional type
                const memberType = getMemberType(
                    new Word(type.fieldNames[i], f.site)
                )

                if (!memberType) {
                    continue
                }

                if (!memberType.isBaseOf(fieldVal.type)) {
                    throw CompilerError.type(
                        f.site,
                        `wrong field type for field ${i.toString()}, expected ${memberType.toString()}, got ${fieldVal.type.toString()}`
                    )
                }
            }
        }

        return new DataEntity(type)
    }

    /**
     * @returns {boolean}
     */
    isLiteral() {
        return true
    }

    /**
     * @returns {boolean}
     */
    isNamed() {
        // the expression builder already checked that all fields are named or all or positional (i.e. not mixed)
        return this._fields.length > 0 && this._fields[0].isNamed()
    }

    /**
     * @param {ToIRContext} _ctx
     * @param {Site} site
     * @param {string} path
     * @param {SourceMappedStringI[]} fields
     */
    static toIRInternal(_ctx, site, path, fields) {
        return $(
            [$(`${path}____new`), $("("), $(fields).join(", "), $(")")],
            site
        )
    }

    /**
     * @param {ToIRContext} ctx
     * @returns {SourceMappedStringI}
     */
    toIR(ctx) {
        const type = expectSome(this._typeExpr.cache?.asDataType)

        const fields = this._fields.slice()

        // sort fields by correct name
        if (this.isNamed()) {
            fields.sort(
                (a, b) =>
                    type.fieldNames.findIndex((n) => n == a.name.value) -
                    type.fieldNames.findIndex((n) => n == b.name.value)
            )
        }

        const irFields = fields.map((f) => f.toIR(ctx))

        return StructLiteralExpr.toIRInternal(
            ctx,
            this.site,
            type.path,
            irFields
        )
    }

    /**
     * @returns {string}
     */
    toString() {
        return `${this._typeExpr.toString()}{${this._fields.map((f) => f.toString()).join(", ")}}`
    }
}
