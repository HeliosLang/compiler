import { Word } from "@helios-lang/compiler-utils"
import { Expr } from "./Expr.js"
import { expectSome } from "@helios-lang/type-utils"
import { Scope } from "../scopes/Scope.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("@helios-lang/compiler-utils").Token} Token
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 */

/**
 * @implements {Token}
 */
export class CallArgExpr {
    /**
     * @readonly
     * @type {Site}
     */
    site

    #name
    #valueExpr

    /**
     * @param {Site} site
     * @param {Option<Word>} name
     * @param {Expr} valueExpr
     */
    constructor(site, name, valueExpr) {
        this.site = site

        this.#name = name
        this.#valueExpr = valueExpr
    }

    /**
     * @type {string}
     */
    get name() {
        return this.#name?.toString() ?? ""
    }

    /**
     * @type {Expr}
     */
    get valueExpr() {
        return this.#valueExpr
    }

    /**
     * @type {EvalEntity}
     */
    get value() {
        return expectSome(this.#valueExpr.cache)
    }

    /**
     * @returns {boolean}
     */
    isNamed() {
        return this.#name != null
    }

    /**
     * @returns {boolean}
     */
    isLiteral() {
        return this.#valueExpr.isLiteral()
    }

    /**
     * @returns {string}
     */
    toString() {
        return [
            this.#name != null ? `${this.#name.toString()}: ` : "",
            this.#valueExpr.toString()
        ].join("")
    }

    /**
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    eval(scope) {
        return this.#valueExpr.eval(scope)
    }
}
