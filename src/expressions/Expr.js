import { CompilerError } from "@helios-lang/compiler-utils"
import { None } from "@helios-lang/type-utils"
import { ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Token} Token
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("@helios-lang/ir").SourceMappedStringI} SourceMappedStringI
 * @typedef {import("../typecheck/index.js").DataType} DataType
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 * @typedef {import("../typecheck/index.js").Type} Type
 * @typedef {import("../typecheck/index.js").Typed} Typed
 */

/**
 * @typedef {{
 *   site: Site
 *   cache: Option<EvalEntity>
 *   evalInternal(scope: Scope): EvalEntity
 *   eval(scope: Scope): EvalEntity
 *   evalAsDataType(scope: Scope): DataType
 *   evalAsType(scope: Scope): Type
 *   evalAsTyped(scope: Scope): Typed
 *   isLiteral(): boolean
 *   toIR(ctx: ToIRContext): SourceMappedStringI
 *   toString(): string
 * }} ExprI
 */

/**
 * Base class of every Type and Instance expression.
 * @implements {ExprI}
 */
export class Expr {
    /**
     * @readonly
     * @type {Site}
     */
    site

    /**
     * Written in switch cases where initial typeExpr is used as memberName instead
     * @readwrite
     * @type {Option<EvalEntity>}
     */
    cache

    /**
     * @param {Site} site
     */
    constructor(site) {
        this.site = site
        this.cache = None
    }

    /**
     * @param {Scope} _scope
     * @returns {EvalEntity}
     */
    evalInternal(_scope) {
        throw new Error("not yet implemented")
    }

    /**
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    eval(scope) {
        this.cache = this.evalInternal(scope)

        return this.cache
    }

    /**
     * @param {Scope} scope
     * @returns {DataType}
     */
    evalAsDataType(scope) {
        const result_ = this.eval(scope)

        const result = result_.asDataType

        if (!result) {
            throw CompilerError.type(this.site, "not a data type")
        }

        return result
    }

    /**
     * @param {Scope} scope
     * @returns {Type}
     */
    evalAsType(scope) {
        const r = this.eval(scope)

        const result = r.asType

        if (!result) {
            throw CompilerError.type(this.site, `${r.toString()} isn't a type`)
        }

        return result
    }

    /**
     * @param {Scope} scope
     * @returns {Typed}
     */
    evalAsTyped(scope) {
        const r = this.eval(scope)

        const result = r.asTyped

        if (!result) {
            throw CompilerError.type(this.site, `${r.toString()} isn't a value`)
        }

        return result
    }

    /**
     * @returns {boolean}
     */
    isLiteral() {
        return false
    }

    /**
     * @param {ToIRContext} ctx
     * @returns {SourceMappedStringI}
     */
    toIR(ctx) {
        throw new Error("not yet implemented")
    }

    /**
     * @returns {string}
     */
    toString() {
        throw new Error("not yet implemented")
    }
}
