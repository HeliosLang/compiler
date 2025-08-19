import { makeTypeError } from "@helios-lang/compiler-utils"
import { $ } from "@helios-lang/ir"
import { expectDefined, isDefined } from "@helios-lang/type-utils"
import { ToIRContext, PARAM_IR_MACRO } from "../codegen/index.js"
import { Expr, LiteralDataExpr } from "../expressions/index.js"
import { Scope, TopScope } from "../scopes/index.js"
import { DataEntity, NamedEntity } from "../typecheck/index.js"
import { Statement } from "./Statement.js"

/**
 * @import { Site, Word } from "@helios-lang/compiler-utils"
 * @import { SourceMappedStringI } from "@helios-lang/ir"
 * @import { UplcData } from "@helios-lang/uplc"
 * @import { Definitions } from "../index.js"
 * @typedef {import("../typecheck/index.js").DataType} DataType
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 */

/**
 * Const value statement
 */
export class ConstStatement extends Statement {
    /**
     * @private
     * @readonly
     * @type {Expr | undefined}
     */
    _typeExpr

    /**
     * @private
     * @type {Expr | undefined}
     */
    _valueExpr

    /**
     * @param {Site} site
     * @param {Word} name
     * @param {Expr | undefined} typeExpr - can be null in case of type inference
     * @param {Expr | undefined} valueExpr
     */
    constructor(site, name, typeExpr, valueExpr) {
        super(site, name)
        this._typeExpr = typeExpr
        this._valueExpr = valueExpr
    }

    /**
     * @type {"ConstStatement"}
     */
    get kind() {
        return "ConstStatement"
    }

    /**
     * @type {DataType}
     */
    get type() {
        return expectDefined(
            this._typeExpr?.cache?.asDataType ??
                this._valueExpr?.cache?.asTyped?.type?.asDataType,
            this._typeExpr?.cache?.toString() ??
                this._typeExpr?.toString() ??
                this._valueExpr?.toString() ??
                "Any"
        )
    }

    /**
     * @returns {boolean}
     */
    isSet() {
        return isDefined(this._valueExpr)
    }

    /**
     * Use this to change a value of something that is already typechecked.
     * @param {UplcData} data
     */
    changeValueSafe(data) {
        const type = this.type
        const site = this._valueExpr ? this._valueExpr.site : this.site

        this._valueExpr = new LiteralDataExpr(site, type, data)
    }

    /**
     * @returns {string}
     */
    toString() {
        return `const ${this.name.toString()}${this._typeExpr ? `: ${this._typeExpr.toString()}` : ""}${this._valueExpr ? ` = ${this._valueExpr.toString()}` : ""};`
    }

    /**
     * @param {Scope} scope
     * @returns {DataType}
     */
    evalType(scope) {
        if (this._typeExpr) {
            return this._typeExpr.evalAsDataType(scope)
        } else if (this._valueExpr) {
            return this._valueExpr.evalAsDataType(scope)
        } else {
            throw new Error("unexpected")
        }
    }

    /**
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    evalInternal(scope) {
        let type = this._typeExpr?.evalAsDataType(scope)

        if (this._valueExpr) {
            const value = this._valueExpr.evalAsTyped(scope)

            if (type) {
                if (!type.isBaseOf(value.type)) {
                    throw makeTypeError(this._valueExpr.site, "wrong type")
                }
            } else {
                type = value.type.asDataType ?? undefined
            }
        }

        const data = new DataEntity(expectDefined(type))
        const res = new NamedEntity(this.name.value, this.path, data)

        return res
    }

    /**
     * Evaluates rhs and adds to scope
     * @param {TopScope} scope
     */
    eval(scope) {
        const res = this.evalInternal(scope)

        scope.set(this.name, res)
    }

    /**
     * @param {ToIRContext} ctx
     * @returns {SourceMappedStringI}
     */
    toIRInternal(ctx) {
        let ir = expectDefined(this._valueExpr).toIR(ctx)

        if (this._valueExpr instanceof LiteralDataExpr) {
            ir = $`${this._valueExpr.type.path}__from_data${$("(", this.site)}${ir})`
        }

        // if this._valueExpr is None, and paramsSubstitutable is true -> param macro with single argument
        if (ctx.paramsSubsitutable) {
            return $`${PARAM_IR_MACRO}("${this.path}", ${ir})`
        } else {
            return ir
        }
    }

    /**
     * @param {ToIRContext} ctx
     * @param {Definitions} map
     */
    toIR(ctx, map) {
        if (this._valueExpr) {
            const description = ctx.aliasNamespace
                ? `${ctx.aliasNamespace}::${this.name.value}`
                : this.name.value
            const keySite = this.name.site.withDescription(description)

            map.set(this.path, {
                content: this.toIRInternal(
                    ctx.appendAliasNamespace(this.name.value)
                ),
                keySite
            })
        }
    }
}
