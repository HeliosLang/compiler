import { CompilerError, Word } from "@helios-lang/compiler-utils"
import { Scope } from "../scopes/index.js"
import { ArgType } from "../typecheck/index.js"
import { Expr } from "./Expr.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("@helios-lang/compiler-utils").Token} Token
 */

/**
 * @implements {Token}
 */
export class FuncArgTypeExpr {
    /**
     * @readonly
     * @type {Site}
     */
    site

    #name
    #typeExpr
    optional

    /**
     * @param {Site} site
     * @param {Option<Word>} name
     * @param {Expr} typeExpr
     * @param {boolean} optional
     */
    constructor(site, name, typeExpr, optional) {
        this.site = site
        this.#name = name
        this.#typeExpr = typeExpr
        this.optional = optional
    }

    /**
     * @returns {boolean}
     */
    isNamed() {
        return this.#name == null
    }

    /**
     * @returns {boolean}
     */
    isOptional() {
        return this.optional
    }

    /**
     * @param {Scope} scope
     * @returns {ArgType}
     */
    eval(scope) {
        const type_ = this.#typeExpr.eval(scope)

        const type = type_.asType

        if (!type) {
            throw CompilerError.type(
                this.#typeExpr.site,
                `'${type_.toString()}' isn't a type`
            )
        }

        return new ArgType(this.#name, type, this.optional)
    }

    /**
     * @returns {string}
     */
    toString() {
        return [
            this.#name != null ? `${this.#name.toString()}: ` : "",
            this.optional ? "?" : "",
            this.#typeExpr.toString()
        ].join("")
    }
}
