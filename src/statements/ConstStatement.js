import { CompilerError, Word } from "@helios-lang/compiler-utils"
import { $, SourceMappedString } from "@helios-lang/ir"
import { expectSome, isSome } from "@helios-lang/type-utils"
import { ToIRContext } from "../codegen/index.js"
import { Expr, LiteralDataExpr } from "../expressions/index.js"
import { Scope, TopScope } from "../scopes/index.js"
import { AllType, DataEntity, NamedEntity } from "../typecheck/index.js"
import { Statement } from "./Statement.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("@helios-lang/uplc").UplcData} UplcData
 * @typedef {import("../codegen/index.js").Definitions} Definitions
 * @typedef {import("../typecheck/index.js").DataType} DataType
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 */

/**
 * Const value statement
 * @internal
 */
export class ConstStatement extends Statement {
    /**
     * @type {Option<Expr>}
     */
    #typeExpr

    /**
     * @type {Option<Expr>}
     */
    #valueExpr

    /**
     * @param {Site} site
     * @param {Word} name
     * @param {Option<Expr>} typeExpr - can be null in case of type inference
     * @param {Option<Expr>} valueExpr
     */
    constructor(site, name, typeExpr, valueExpr) {
        super(site, name)
        this.#typeExpr = typeExpr
        this.#valueExpr = valueExpr
    }

    /**
     * @type {DataType}
     */
    get type() {
        return expectSome(
            this.#typeExpr?.cache?.asDataType ??
                this.#valueExpr?.cache?.asDataType,
            this.#typeExpr?.cache?.toString() ??
                this.#typeExpr?.toString() ??
                this.#valueExpr?.toString() ??
                "Any"
        )
    }

    /**
     * Include __const prefix in path so that mutual recursion injection isn't applied
     * @type {string}
     */
    get path() {
        return `__const${super.path}`
    }

    /**
     * @returns {boolean}
     */
    isSet() {
        return isSome(this.#valueExpr)
    }

    /**
     * Use this to change a value of something that is already typechecked.
     * @param {UplcData} data
     */
    changeValueSafe(data) {
        const type = this.type
        const site = this.#valueExpr ? this.#valueExpr.site : this.site

        this.#valueExpr = new LiteralDataExpr(site, type, data)
    }

    /**
     * @returns {string}
     */
    toString() {
        return `const ${this.name.toString()}${this.#typeExpr ? `: ${this.#typeExpr.toString()}` : ""}${this.#valueExpr ? ` = ${this.#valueExpr.toString()}` : ""};`
    }

    /**
     * @param {Scope} scope
     * @returns {DataType}
     */
    evalType(scope) {
        if (this.#typeExpr) {
            return this.#typeExpr.evalAsDataType(scope)
        } else if (this.#valueExpr) {
            return this.#valueExpr.evalAsDataType(scope)
        } else {
            throw new Error("unexpected")
        }
    }

    /**
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    evalInternal(scope) {
        let type = this.#typeExpr?.evalAsDataType(scope)

        if (this.#valueExpr) {
            const value = this.#valueExpr.evalAsTyped(scope)

            if (type) {
                if (!type.isBaseOf(value.type)) {
                    throw CompilerError.type(this.#valueExpr.site, "wrong type")
                }
            } else {
                type = value.type.asDataType ?? undefined
            }
        }

        return new DataEntity(expectSome(type))
    }

    /**
     * Evaluates rhs and adds to scope
     * @param {TopScope} scope
     */
    eval(scope) {
        const data = this.evalInternal(scope)

        if (!data) {
            scope.set(
                this.name,
                new NamedEntity(
                    this.name.value,
                    this.path,
                    new DataEntity(new AllType())
                )
            )
        } else {
            scope.set(
                this.name,
                new NamedEntity(this.name.value, this.path, data)
            )
        }
    }

    /**
     * @param {ToIRContext} ctx
     * @returns {SourceMappedString}
     */
    toIRInternal(ctx) {
        let ir = expectSome(this.#valueExpr).toIR(ctx)

        if (this.#valueExpr instanceof LiteralDataExpr) {
            /*ir = new IR([
				new IR(`${this.#valueExpr.type.path}__from_data`),
				new IR("(", this.site),
				ir,
				new IR(")")
			]);*/

            ir = $`${this.#valueExpr.type.path}__from_data${null}(${this.site}${ir})`
        }

        return ir
    }

    /**
     * @param {ToIRContext} ctx
     * @param {Definitions} map
     */
    toIR(ctx, map) {
        if (this.#valueExpr) {
            map.set(this.path, this.toIRInternal(ctx))
        }
    }
}
