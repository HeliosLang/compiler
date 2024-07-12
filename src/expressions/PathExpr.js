import { CompilerError, Word } from "@helios-lang/compiler-utils"
import { $, SourceMappedString } from "@helios-lang/ir"
import { ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import { Expr } from "./Expr.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 */

/**
 * Name::Member expression
 */
export class PathExpr extends Expr {
    #baseExpr
    #memberName

    /**
     * @param {Site} site
     * @param {Expr} baseExpr
     * @param {Word} memberName
     */
    constructor(site, baseExpr, memberName) {
        super(site)
        this.#baseExpr = baseExpr
        this.#memberName = memberName
    }

    /**
     * @type {Expr}
     */
    get baseExpr() {
        return this.#baseExpr
    }

    /**
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    evalInternal(scope) {
        const base = this.#baseExpr.eval(scope)

        /**
         * @type {null | EvalEntity}
         */
        let member = null

        if (base.asNamespace) {
            member = base.asNamespace.namespaceMembers[this.#memberName.value]
        } else if (base.asType) {
            const typeMembers = base.asType.typeMembers

            member = typeMembers[this.#memberName.value]
        }

        if (!member) {
            throw CompilerError.reference(
                this.#memberName.site,
                `${base.toString()}::${this.#memberName.value} not found`
            )
        }

        if (member.asType?.toTyped().asFunc) {
            return member.asType.toTyped()
        } else {
            return member
        }
    }

    /**
     * @param {ToIRContext} ctx
     * @returns {SourceMappedString}
     */
    toIR(ctx) {
        const v = this.cache

        if (v?.asNamed) {
            return $(`${v.asNamed.path}`, this.site)
        } else if (this.#baseExpr.cache?.asNamed) {
            return $(
                `${this.#baseExpr.cache.asNamed.path}__${this.#memberName.value}`,
                this.site
            )
        } else {
            throw new Error(`expected named value, ${v?.toString()}`)
        }
    }

    /**
     * @returns {string}
     */
    toString() {
        return `${this.#baseExpr.toString()}::${this.#memberName.toString()}`
    }
}
