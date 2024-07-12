import { Word } from "@helios-lang/compiler-utils"
import { SourceMappedString } from "@helios-lang/ir"
import { ToIRContext } from "../codegen/index.js"
import { FuncLiteralExpr } from "../expressions/index.js"
import { Scope } from "../scopes/index.js"
import { FuncType, NamedEntity, ParametricFunc } from "../typecheck/index.js"
import { Statement } from "./Statement.js"
import { TypeParameters } from "./TypeParameters.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
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
    #parameters
    #funcExpr

    /**
     * @param {Site} site
     * @param {Word} name
     * @param {TypeParameters} parameters
     * @param {FuncLiteralExpr} funcExpr
     */
    constructor(site, name, parameters, funcExpr) {
        super(site, name)
        this.#parameters = parameters
        this.#funcExpr = funcExpr
    }

    /**
     * @type {string}
     */
    get path() {
        return this.#parameters.genFuncPath(super.path)
    }

    /**
     * @type {number}
     */
    get nArgs() {
        return this.#funcExpr.nArgs
    }

    /**
     * @type {string[]}
     */
    get argNames() {
        return this.#funcExpr.argNames
    }

    /**
     * @type {Type[]}
     */
    get argTypes() {
        return this.#funcExpr.argTypes
    }

    /**
     * @type {string[]}
     */
    get argTypeNames() {
        return this.#funcExpr.argTypeNames
    }

    /**
     * @type {Type}
     */
    get retType() {
        return this.#funcExpr.retType
    }

    /**
     * @type {Site}
     */
    get retSite() {
        return this.#funcExpr.retExpr.site
    }

    /**
     * @returns {string}
     */
    toString() {
        return `func ${this.name.toString()}${this.#parameters.toString()}${this.#funcExpr.toString()}`
    }

    /**
     * Evaluates a function and returns a func value
     * @param {Scope} scope
     * @param {boolean} isMember functions that are members of structs or enums aren't added to their own internal scope as they are always accessed through member access
     * @returns {EvalEntity}
     */
    evalInternal(scope, isMember = false) {
        const typed = this.#parameters.evalParametricFunc(scope, (subScope) => {
            const type = this.#funcExpr.evalType(subScope)

            if (isMember) {
                void this.#funcExpr.evalInternal(subScope)
            } else {
                const implScope = new Scope(subScope)

                // recursive calls expect func value, not func type
                implScope.set(
                    this.name,
                    new NamedEntity(this.name.value, super.path, type.toTyped())
                )

                void this.#funcExpr.evalInternal(implScope)
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
        return this.#parameters.evalParametricFuncType(scope, (subScope) => {
            return this.#funcExpr.evalType(subScope)
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
     * @returns {SourceMappedString}
     */
    toIRInternal(ctx) {
        return this.#funcExpr.toIR(ctx)
    }

    /**
     * @param {ToIRContext} ctx
     * @param {Definitions} map
     */
    toIR(ctx, map) {
        map.set(this.path, this.toIRInternal(ctx))
    }

    /**
     * @param {Statement} s
     * @returns {boolean}
     */
    static isMethod(s) {
        if (s instanceof FuncStatement) {
            return s.#funcExpr.isMethod()
        } else {
            return false
        }
    }
}
