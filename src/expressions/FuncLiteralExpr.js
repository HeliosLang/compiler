import { makeTypeError } from "@helios-lang/compiler-utils"
import { $ } from "@helios-lang/ir"
import { expectDefined } from "@helios-lang/type-utils"
import { TAB, ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import { AllType, FuncEntity, FuncType } from "../typecheck/index.js"
import { ChainExpr } from "./ChainExpr.js"
import { Expr } from "./Expr.js"
import { FuncArg } from "./FuncArg.js"

/**
 * @import { Site } from "@helios-lang/compiler-utils"
 * @import { SourceMappedStringI } from "@helios-lang/ir"
 * @import { TypeCheckContext } from "../index.js"
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 * @typedef {import("../typecheck/index.js").Type} Type
 */

/**
 * (..) -> RetTypeExpr {...} expression
 * @internal
 */
export class FuncLiteralExpr extends Expr {
    /**
     * @readonly
     * @type {FuncArg[]}
     */
    args

    /**
     * @readonly
     * @type {Expr | undefined}
     */
    retTypeExpr

    /**
     * @private
     * @readonly
     * @type {Expr}
     */
    _bodyExpr

    /**
     * @param {Site} site
     * @param {FuncArg[]} args
     * @param {Expr | undefined} retTypeExpr
     * @param {Expr} bodyExpr
     */
    constructor(site, args, retTypeExpr, bodyExpr) {
        super(site)
        this.args = args
        this.retTypeExpr = retTypeExpr
        this._bodyExpr = bodyExpr
    }

    /**
     * @type {number}
     */
    get nArgs() {
        return this.args.length
    }

    /**
     * @type {string[]}
     */
    get argNames() {
        return this.args.map((a) => a.name.value)
    }

    /**
     * @type {Type[]}
     */
    get argTypes() {
        return this.args.map((a) => a.type)
    }

    /**
     * @type {string[]}
     */
    get argTypeNames() {
        return this.args.map((a) => a.typeName)
    }

    /**
     * @type {Expr}
     */
    get retExpr() {
        let expr = this._bodyExpr

        while (expr instanceof ChainExpr) {
            expr = expr.downstreamExpr
        }

        return expr
    }

    /**
     * @type {Type}
     */
    get retType() {
        if (!this.retTypeExpr) {
            return new AllType()
        } else {
            return expectDefined(this.retTypeExpr.cache?.asType)
        }
    }

    /**
     * @returns {boolean}
     */
    isLiteral() {
        return true
    }

    /**
     * @param {TypeCheckContext} ctx
     * @param {Scope} scope
     * @returns {FuncType}
     */
    evalType(ctx, scope) {
        let args = this.args
        if (this.isMethod()) {
            args = args.slice(1)
        }

        const argTypes = args.map((a) => a.evalArgType(ctx, scope))

        const retType = this.retTypeExpr
            ? this.retTypeExpr.evalAsType(ctx, scope)
            : new AllType()

        return new FuncType(argTypes, retType)
    }

    /**
     * @param {TypeCheckContext} ctx
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    evalInternal(ctx, scope) {
        const fnType = this.evalType(ctx, scope)

        // argTypes is calculated separately again here so it includes self
        const argTypes = this.args.map((a) => a.evalType(ctx, scope))

        const subScope = new Scope(scope, true)

        argTypes.forEach((a, i) => {
            if (a && !this.args[i].isIgnored()) {
                this.args[i].evalDefault(ctx, subScope)

                subScope.set(this.args[i].name, a.toTyped())
            }
        })

        let bodyVal = this._bodyExpr.eval(ctx, subScope)

        if (!this.retTypeExpr) {
            if (bodyVal.asTyped) {
                return new FuncEntity(
                    new FuncType(fnType.argTypes, bodyVal.asTyped.type)
                )
            } else {
                throw makeTypeError(
                    this._bodyExpr.site,
                    "expect multi or typed"
                )
            }
        } else if (bodyVal.asTyped) {
            if (!fnType.retType.isBaseOf(bodyVal.asTyped.type)) {
                throw makeTypeError(
                    this.retTypeExpr.site,
                    `wrong return type, expected ${fnType.retType.toString()} but got ${bodyVal.asTyped.type.toString()}`
                )
            }
        } else {
            throw makeTypeError(this._bodyExpr.site, "expect multi or typed")
        }

        subScope.assertAllUsed()

        return new FuncEntity(fnType)
    }

    isMethod() {
        return this.args.length > 0 && this.args[0].name.toString() == "self"
    }

    /**
     * @returns {SourceMappedStringI}
     */
    argsToIR() {
        let args = this.args.map((a) => a.toIR())
        if (this.isMethod()) {
            args = args.slice(1)
        }

        return $(args).join(", ")
    }

    /**
     * In reverse order, because later opt args might depend on earlier args
     * @param {ToIRContext} ctx
     * @param {SourceMappedStringI} innerIR
     * @returns {SourceMappedStringI}
     */
    wrapWithDefaultArgs(ctx, innerIR) {
        const args = this.args.slice().reverse()

        for (let arg of args) {
            innerIR = arg.wrapWithDefault(ctx, innerIR)
        }

        return innerIR
    }

    /**
     * @param {ToIRContext} ctx
     * @returns {SourceMappedStringI}
     */
    toIRInternal(ctx) {
        let argsWithCommas = this.argsToIR()

        let innerIndent = ctx.indent
        let methodIndent = ctx.indent
        if (this.isMethod()) {
            innerIndent += TAB
        }

        let innerIR = this._bodyExpr.toIR(ctx.tab())

        innerIR = this.wrapWithDefaultArgs(ctx, innerIR)

        let arrowSite = ctx.aliasNamespace
            ? this.site.withDescription(ctx.aliasNamespace)
            : this.site

        let ir = $([
            $("("),
            argsWithCommas,
            $(") "),
            $("->", arrowSite),
            $(` {\n${innerIndent}${TAB}`),
            innerIR,
            $(`\n${innerIndent}}`)
        ])

        // wrap with 'self'
        if (this.isMethod()) {
            ir = $([
                $("("),
                $("self", this.args[0].site.withDescription("self")),
                $(`) -> {\n${methodIndent}${TAB}`),
                ir,
                $(`\n${methodIndent}}`)
            ])
        }

        return ir
    }

    /**
     * @param {ToIRContext} ctx
     * @returns {SourceMappedStringI}
     */
    toIR(ctx) {
        return this.toIRInternal(ctx)
    }

    /**
     * @returns {string}
     */
    toString() {
        if (this.retTypeExpr) {
            return `(${this.args.map((a) => a.toString()).join(", ")}) -> ${this.retTypeExpr.toString()} {${this._bodyExpr.toString()}}`
        } else {
            return `(${this.args.map((a) => a.toString()).join(", ")}) -> {${this._bodyExpr.toString()}}`
        }
    }
}
