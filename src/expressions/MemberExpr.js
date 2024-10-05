import { CompilerError, Word } from "@helios-lang/compiler-utils"
import { $, SourceMappedString } from "@helios-lang/ir"
import { expectSome } from "@helios-lang/type-utils"
import { ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import { Expr } from "./Expr.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 */

/**
 *  ... . ... expression
 */
export class MemberExpr extends Expr {
    #objExpr
    #memberName

    /**
     * @param {Site} site
     * @param {Expr} objExpr
     * @param {Word} memberName
     */
    constructor(site, objExpr, memberName) {
        super(site)
        this.#objExpr = objExpr
        this.#memberName = memberName
    }

    /**
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    evalInternal(scope) {
        const objVal_ = this.#objExpr.eval(scope)

        const objVal = objVal_.asInstance
        if (!objVal) {
            throw CompilerError.type(
                this.#objExpr.site,
                `lhs of '.' not an instance`
            )
        }

        let member = objVal.instanceMembers[this.#memberName.value]
        if (!member) {
            if (objVal?.type?.asEnumMemberType) {
                member =
                    objVal.type.asEnumMemberType.parentType.instanceMembers[
                        this.#memberName.value
                    ]
            }

            if (!member) {
                throw CompilerError.reference(
                    this.#memberName.site,
                    `'${objVal.type.toString()}.${this.#memberName.value}' undefined`
                )
            }
        }

        if (member.asParametric) {
            return member
        } else if (member.asType) {
            const memberVal = member.asType.toTyped()

            return memberVal
        } else {
            throw new Error("expected type or parametric")
        }
    }

    /**
     * @param {ToIRContext} ctx
     * @param {string} params - applied type parameters must be inserted Before the call to self
     * @returns {SourceMappedString}
     */
    toIR(ctx, params = "") {
        // members can be functions so, field getters are also encoded as functions for consistency

        const objType = expectSome(this.#objExpr.cache?.asTyped?.type?.asNamed)

        let objPath = objType.path

        // if we are getting the member of an enum member we should check if it a field or method, because for a method we have to use the parent type
        if (
            objType.asEnumMemberType &&
            objType.asEnumMemberType.instanceMembers[this.#memberName.value] ===
                undefined
        ) {
            objPath = objType.asEnumMemberType.parentType.path
        }

        const fullPath = `${objPath}__${this.#memberName.toString()}${params}`

        let ir = $(fullPath, this.#memberName.site)

        return $([ir, $("(", this.site), this.#objExpr.toIR(ctx), $(")")])
    }

    /**
     * @returns {string}
     */
    toString() {
        return `${this.#objExpr.toString()}.${this.#memberName.toString()}`
    }
}
