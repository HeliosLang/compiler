import { CompilerError, Word } from "@helios-lang/compiler-utils"
import { $, SourceMappedString } from "@helios-lang/ir"
import { None, isSome } from "@helios-lang/type-utils"
import { ToIRContext } from "../codegen/ToIRContext.js"
import { Scope } from "../scopes/index.js"
import { ArgType } from "../typecheck/index.js"
import { NameTypePair } from "./NameTypePair.js"
import { Expr } from "./Expr.js"

/**
 * Function argument class
 */
export class FuncArg extends NameTypePair {
    /**
     * @type {Option<Expr>}
     */
    #defaultValueExpr

    /**
     * @param {Word} name
     * @param {Option<Expr>} typeExpr
     * @param {Option<Expr>} defaultValueExpr
     */
    constructor(name, typeExpr, defaultValueExpr = None) {
        super(name, typeExpr)

        this.#defaultValueExpr = defaultValueExpr
    }

    /**
     * @type {boolean}
     */
    get isOptional() {
        return isSome(this.#defaultValueExpr)
    }

    /**
     * @param {Scope} scope
     */
    evalDefault(scope) {
        if (this.#defaultValueExpr) {
            const v_ = this.#defaultValueExpr.eval(scope)
            if (!v_) {
                return
            }

            const v = v_.asTyped
            if (!v) {
                throw CompilerError.type(
                    this.#defaultValueExpr.site,
                    "not typed"
                )
                return
            }

            const t = this.evalType(scope)
            if (!t) {
                return
            }

            if (!t.isBaseOf(v.type)) {
                throw CompilerError.type(
                    this.#defaultValueExpr.site,
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

        return new ArgType(this.name, t, isSome(this.#defaultValueExpr))
    }

    /**
     * @returns {SourceMappedString}
     */
    toIR() {
        const name = super.toIR()

        if (!this.#defaultValueExpr) {
            return name
        } else {
            return $([$(`__useopt__${this.name.toString()}`), $(", "), name])
        }
    }

    /**
     * @param {SourceMappedString} bodyIR
     * @param {string} name
     * @param {SourceMappedString} defaultIR
     * @returns {SourceMappedString}
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
     * @param {SourceMappedString} bodyIR
     * @returns {SourceMappedString}
     */
    wrapWithDefault(ctx, bodyIR) {
        if (!this.#defaultValueExpr) {
            return bodyIR
        } else {
            const name = this.name.toString()

            return FuncArg.wrapWithDefaultInternal(
                bodyIR,
                name,
                this.#defaultValueExpr.toIR(ctx)
            )
        }
    }
}
