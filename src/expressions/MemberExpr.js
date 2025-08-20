import { makeReferenceError, makeTypeError } from "@helios-lang/compiler-utils"
import { $ } from "@helios-lang/ir"
import { expectDefined as expectDefined } from "@helios-lang/type-utils"
import { ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import { Expr } from "./Expr.js"

/**
 * @import { Site, Word } from "@helios-lang/compiler-utils"
 * @import { SourceMappedStringI } from "@helios-lang/ir"
 * @import { TypeCheckContext } from "../index.js"
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 */

/**
 *  ... . ... expression
 */
export class MemberExpr extends Expr {
    /**
     * @private
     * @readonly
     * @type {Expr}
     */
    _objExpr

    /**
     * @private
     * @readonly
     * @type {Word}
     */
    _memberName

    /**
     * @param {Site} site
     * @param {Expr} objExpr
     * @param {Word} memberName
     */
    constructor(site, objExpr, memberName) {
        super(site)
        this._objExpr = objExpr
        this._memberName = memberName
    }

    /**
     * @param {TypeCheckContext} ctx
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    evalInternal(ctx, scope) {
        const objVal_ = this._objExpr.eval(ctx, scope)

        const objVal = objVal_.asInstance
        if (!objVal) {
            throw makeTypeError(
                this._objExpr.site,
                `lhs of '.' not an instance`
            )
        }

        let member = objVal.instanceMembers[this._memberName.value]
        if (!member) {
            if (objVal?.type?.asEnumMemberType) {
                member =
                    objVal.type.asEnumMemberType.parentType.instanceMembers[
                        this._memberName.value
                    ]
            }

            if (!member) {
                throw makeReferenceError(
                    this._memberName.site,
                    `'${objVal.type.toString()}.${this._memberName.value}' undefined`
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
     * @returns {SourceMappedStringI}
     */
    toIR(ctx, params = "") {
        // members can be functions so, field getters are also encoded as functions for consistency

        const objType = expectDefined(
            this._objExpr.cache?.asTyped?.type?.asNamed
        )

        let objPath = objType.path

        // if we are getting the member of an enum member we should check if it a field or method, because for a method we have to use the parent type
        if (
            objType.asEnumMemberType &&
            objType.asEnumMemberType.instanceMembers[this._memberName.value] ===
                undefined
        ) {
            objPath = objType.asEnumMemberType.parentType.path
        }

        const fullPath = `${objPath}__${this._memberName.toString()}${params}`

        let ir = $(fullPath, this._memberName.site)

        return $([ir, $("(", this.site), this._objExpr.toIR(ctx), $(")")])
    }

    /**
     * @returns {string}
     */
    toString() {
        return `${this._objExpr.toString()}.${this._memberName.toString()}`
    }
}
