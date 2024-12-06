import { ToIRContext } from "../codegen/index.js"
import { FuncArg, FuncLiteralExpr } from "../expressions/index.js"
import { Scope } from "../scopes/index.js"
import { FuncType, NamedEntity, ParametricFunc } from "../typecheck/index.js"
import { Statement } from "./Statement.js"
import { TypeParameters } from "./TypeParameters.js"

/**
 * @import { Site, Word } from "@helios-lang/compiler-utils"
 * @typedef {import("@helios-lang/ir").SourceMappedStringI} SourceMappedStringI
 * @typedef {import("../codegen/index.js").Definitions} Definitions
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 * @typedef {import("../typecheck/index.js").Type} Type
 */

/**
 * Function statement
 * (basically just a named FuncLiteralExpr)
 * @internal
 */
export class FuncStatement extends Statement {
    /**
     * @private
     * @readonly
     * @type {TypeParameters}
     */
    _parameters

    /**
     * @private
     * @readonly
     * @type {FuncLiteralExpr}
     */
    _funcExpr

    /**
     * @param {Site} site
     * @param {Word} name
     * @param {TypeParameters} parameters
     * @param {FuncLiteralExpr} funcExpr
     */
    constructor(site, name, parameters, funcExpr) {
        super(site, name)
        this._parameters = parameters
        this._funcExpr = funcExpr
    }

    /**
     * @type {TypeParameters}
     */
    get typeParameters() {
        return this._parameters
    }

    /**
     * @type {string}
     */
    get path() {
        return this._parameters.genFuncPath(super.path)
    }

    /**
     * @type {number}
     */
    get nArgs() {
        return this._funcExpr.nArgs
    }

    /**
     * @type {FuncArg[]}
     */
    get args() {
        return this._funcExpr.args
    }

    /**
     * @type {string[]}
     */
    get argNames() {
        return this._funcExpr.argNames
    }

    /**
     * @type {Type[]}
     */
    get argTypes() {
        return this._funcExpr.argTypes
    }

    /**
     * @type {string[]}
     */
    get argTypeNames() {
        return this._funcExpr.argTypeNames
    }

    /**
     * @type {FuncLiteralExpr}
     */
    get funcExpr() {
        return this._funcExpr
    }

    /**
     * @type {Type}
     */
    get retType() {
        return this._funcExpr.retType
    }

    /**
     * @type {Site}
     */
    get retSite() {
        return this._funcExpr.retExpr.site
    }

    /**
     * @returns {string}
     */
    toString() {
        return `func ${this.name.toString()}${this._parameters.toString()}${this._funcExpr.toString()}`
    }

    /**
     * Evaluates a function and returns a func value
     * @param {Scope} scope
     * @param {boolean} isMember functions that are members of structs or enums aren't added to their own internal scope as they are always accessed through member access
     * @returns {EvalEntity}
     */
    evalInternal(scope, isMember = false) {
        const typed = this._parameters.evalParametricFunc(scope, (subScope) => {
            const type = this._funcExpr.evalType(subScope)

            if (isMember) {
                void this._funcExpr.evalInternal(subScope)
            } else {
                const implScope = new Scope(subScope)

                // recursive calls expect func value, not func type
                implScope.set(
                    this.name,
                    new NamedEntity(this.name.value, super.path, type.toTyped())
                )

                void this._funcExpr.evalInternal(implScope)
            }

            return type
        })

        return typed
    }

    /**
     * Evaluates type of a funtion.
     * Separate from evalInternal so we can use this function recursively inside evalInternal
     * @param {Scope} scope
     * @returns {ParametricFunc | FuncType}
     */
    evalType(scope) {
        return this._parameters.evalParametricFuncType(scope, (subScope) => {
            return this._funcExpr.evalType(subScope)
        })
    }

    /**
     * @param {Scope} scope
     */
    eval(scope) {
        const typed = this.evalInternal(scope)

        if (typed) {
            if (!!typed.asType) {
                throw new Error("unexpected")
            }

            scope.set(
                this.name,
                new NamedEntity(this.name.value, super.path, typed)
            )
        }
    }

    /**
     * Returns IR of function
     * @param {ToIRContext} ctx
     * @returns {SourceMappedStringI}
     */
    toIRInternal(ctx) {
        return this._funcExpr.toIR(ctx)
    }

    /**
     * @param {ToIRContext} ctx
     * @param {Definitions} map
     */
    toIR(ctx, map) {
        const alias = ctx.aliasNamespace
            ? `${ctx.aliasNamespace}::${this.name.value}`
            : this.name.value
        const keySite = this.name.site.withDescription(alias)

        map.set(this.path, {
            content: this.toIRInternal(
                ctx.appendAliasNamespace(this.name.value)
            ),
            keySite
        })
    }

    /**
     * @param {Statement} s
     * @returns {boolean}
     */
    static isMethod(s) {
        if (s instanceof FuncStatement) {
            return s._funcExpr.isMethod()
        } else {
            return false
        }
    }
}
