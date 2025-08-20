import { makeTypeError } from "@helios-lang/compiler-utils"
import { ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import { AllType, AnyEntity, AnyType, DataEntity } from "../typecheck/common.js"

/**
 * @import { Site, Token } from "@helios-lang/compiler-utils"
 * @import { SourceMappedStringI } from "@helios-lang/ir"
 * @import { TypeCheckContext } from "../index.js"
 * @typedef {import("../typecheck/index.js").DataType} DataType
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 * @typedef {import("../typecheck/index.js").Type} Type
 * @typedef {import("../typecheck/index.js").Typed} Typed
 */

/**
 * @typedef {{
 *   site: Site
 *   cache: EvalEntity | undefined
 *   evalInternal(ctx: TypeCheckContext, scope: Scope): EvalEntity
 *   eval(ctx: TypeCheckContext, scope: Scope): EvalEntity
 *   evalAsDataType(ctx: TypeCheckContext, scope: Scope): DataType
 *   evalAsType(ctx: TypeCheckContext, scope: Scope): Type
 *   evalAsTyped(ctx: TypeCheckContext, scope: Scope): Typed
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
     * @type {EvalEntity | undefined}
     */
    cache

    /**
     * @param {Site} site
     */
    constructor(site) {
        this.site = site
        this.cache = undefined
    }

    /**
     * @param {TypeCheckContext} _ctx
     * @param {Scope} _scope
     * @returns {EvalEntity}
     */
    evalInternal(_ctx, _scope) {
        throw new Error("not yet implemented")
    }

    /**
     * @param {TypeCheckContext} ctx
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    eval(ctx, scope) {
        this.cache = this.evalInternal(ctx, scope)

        return this.cache
    }

    /**
     * @param {TypeCheckContext} ctx
     * @param {Scope} scope
     * @returns {DataType}
     */
    evalAsDataType(ctx, scope) {
        const result_ = this.eval(ctx, scope)

        const result = result_.asDataType

        if (!result) {
            ctx.errors.type(this.site, "not a data type")
            return new AllType()
        }

        return result
    }

    /**
     * @param {TypeCheckContext} ctx
     * @param {Scope} scope
     * @returns {Type}
     */
    evalAsType(ctx, scope) {
        const r = this.eval(ctx, scope)

        const result = r.asType

        if (!result) {
            ctx.errors.type(this.site, `${r.toString()} isn't a type`)
            return new AllType()
        }

        return result
    }

    /**
     * @param {TypeCheckContext} ctx
     * @param {Scope} scope
     * @returns {Typed}
     */
    evalAsTyped(ctx, scope) {
        const r = this.eval(ctx, scope)

        const result = r.asTyped

        if (!result) {
            ctx.errors.type(this.site, `${r.toString()} isn't a value`)
            return new DataEntity(new AnyType())
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
