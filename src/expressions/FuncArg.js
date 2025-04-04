import { makeTypeError } from "@helios-lang/compiler-utils"
import { $ } from "@helios-lang/ir"
import { isDefined } from "@helios-lang/type-utils"
import { ToIRContext } from "../codegen/ToIRContext.js"
import { Scope } from "../scopes/index.js"
import { ArgType } from "../typecheck/index.js"
import { NameTypePair } from "./NameTypePair.js"
import { Expr } from "./Expr.js"

/**
 * @import { Word } from "@helios-lang/compiler-utils"
 * @typedef {import("@helios-lang/ir").SourceMappedStringI} SourceMappedStringI
 */

/**
 * Function argument class
 */
export class FuncArg extends NameTypePair {
    /**
     * @private
     * @readonly
     * @type {Expr | undefined}
     */
    _defaultValueExpr

    /**
     * @param {Word} name
     * @param {Expr | undefined} typeExpr
     * @param {Expr | undefined} defaultValueExpr
     */
    constructor(name, typeExpr, defaultValueExpr = undefined) {
        super(name, typeExpr)

        this._defaultValueExpr = defaultValueExpr
    }

    /**
     * @type {boolean}
     */
    get isOptional() {
        return isDefined(this._defaultValueExpr)
    }

    /**
     * @param {Scope} scope
     */
    evalDefault(scope) {
        if (this._defaultValueExpr) {
            const v_ = this._defaultValueExpr.eval(scope)
            if (!v_) {
                return
            }

            const v = v_.asTyped
            if (!v) {
                throw makeTypeError(this._defaultValueExpr.site, "not typed")
                return
            }

            const t = this.evalType(scope)
            if (!t) {
                return
            }

            if (!t.isBaseOf(v.type)) {
                throw makeTypeError(
                    this._defaultValueExpr.site,
                    `expected ${t.toString()}, got ${v.type.toString()}`
                )
                return
            }
        }
    }

    /**
     * @param {Scope} scope
     * @returns {ArgType}
     */
    evalArgType(scope) {
        const t = super.evalType(scope)

        return new ArgType(this.name, t, isDefined(this._defaultValueExpr))
    }

    /**
     * @returns {SourceMappedStringI}
     */
    toIR() {
        const name = super.toIR()

        if (!this._defaultValueExpr) {
            return name
        } else {
            return $([$(`__useopt__${this.name.toString()}`), $(", "), name])
        }
    }

    /**
     * @param {SourceMappedStringI} bodyIR
     * @param {string} name
     * @param {SourceMappedStringI} defaultIR
     * @returns {SourceMappedStringI}
     */
    static wrapWithDefaultInternal(bodyIR, name, defaultIR) {
        return $([
            $(`(${name}) -> {`),
            bodyIR,
            $([
                $(
                    `}(__core__ifThenElse(__useopt__${name}, () -> {${name}}, () -> {`
                ),
                defaultIR,
                $("})())")
            ])
        ])
    }

    /**
     * (argName) -> {
     *   <bodyIR>
     * }(
     *   ifThenElse(
     * 		__useoptarg__argName,
     *  	() -> {
     *        argName
     *      },
     *      () -> {
     *        <defaultValueExpr>
     *      }
     *   )()
     * )
     * TODO: indentation
     * @param {ToIRContext} ctx
     * @param {SourceMappedStringI} bodyIR
     * @returns {SourceMappedStringI}
     */
    wrapWithDefault(ctx, bodyIR) {
        if (!this._defaultValueExpr) {
            return bodyIR
        } else {
            const name = this.name.toString()

            return FuncArg.wrapWithDefaultInternal(
                bodyIR,
                name,
                this._defaultValueExpr.toIR(ctx)
            )
        }
    }
}
