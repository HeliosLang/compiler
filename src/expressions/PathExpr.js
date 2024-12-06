import { makeReferenceError } from "@helios-lang/compiler-utils"
import { $ } from "@helios-lang/ir"
import { ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import { Expr } from "./Expr.js"

/**
 * @import { Site, Word } from "@helios-lang/compiler-utils"
 * @typedef {import("@helios-lang/ir").SourceMappedStringI} SourceMappedStringI
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 */

/**
 * Name::Member expression
 */
export class PathExpr extends Expr {
    /**
     * @private
     * @readonly
     * @type {Expr}
     */
    _baseExpr

    /**
     * @private
     * @readonly
     * @type {Word}
     */
    _memberName

    /**
     * @param {Site} site
     * @param {Expr} baseExpr
     * @param {Word} memberName
     */
    constructor(site, baseExpr, memberName) {
        super(site)
        this._baseExpr = baseExpr
        this._memberName = memberName
    }

    /**
     * @type {Expr}
     */
    get baseExpr() {
        return this._baseExpr
    }

    /**
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    evalInternal(scope) {
        const base = this._baseExpr.eval(scope)

        /**
         * @type {null | EvalEntity}
         */
        let member = null

        if (base.asNamespace) {
            member = base.asNamespace.namespaceMembers[this._memberName.value]
        } else if (base.asType) {
            const typeMembers = base.asType.typeMembers

            member = typeMembers[this._memberName.value]
        }

        if (!member) {
            throw makeReferenceError(
                this._memberName.site,
                `${base.toString()}::${this._memberName.value} not found`
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
     * @returns {SourceMappedStringI}
     */
    toIR(ctx) {
        const v = this.cache

        if (v?.asNamed) {
            return $(`${v.asNamed.path}`, this.site)
        } else if (this._baseExpr.cache?.asNamed) {
            return $(
                `${this._baseExpr.cache.asNamed.path}__${this._memberName.value}`,
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
        return `${this._baseExpr.toString()}::${this._memberName.toString()}`
    }
}
