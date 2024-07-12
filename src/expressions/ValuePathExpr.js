import { Word } from "@helios-lang/compiler-utils"
import { ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import { DataEntity } from "../typecheck/index.js"
import { Expr } from "./Expr.js"
import { PathExpr } from "./PathExpr.js"
import { $, SourceMappedString } from "@helios-lang/ir"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 */

/**
 * Name::Member expression which can instantiate zero field structs and enum members
 */
export class ValuePathExpr extends PathExpr {
    /**
     * @param {Site} site
     * @param {Expr} baseExpr
     * @param {Word} memberName
     */
    constructor(site, baseExpr, memberName) {
        super(site, baseExpr, memberName)
    }

    /**
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    evalInternal(scope) {
        const member = super.evalInternal(scope)

        if (
            member.asEnumMemberType &&
            member.asEnumMemberType.fieldNames.length == 0
        ) {
            return new DataEntity(member.asEnumMemberType)
        } else {
            return member
        }
    }

    /**
     * @returns {boolean}
     */
    isLiteral() {
        return (
            (this.cache?.asTyped?.type.asEnumMemberType?.fieldNames?.length ??
                -1) == 0
        )
    }

    /**
     * @param {ToIRContext} ctx
     * @returns {SourceMappedString}
     */
    toIR(ctx) {
        const v = this.cache

        if (
            v?.asTyped?.type?.asEnumMemberType &&
            v.asTyped.type.asEnumMemberType.fieldNames.length == 0
        ) {
            return $([
                $(`${v.asTyped.type.asEnumMemberType.path}____new`, this.site),
                $("()")
            ])
        } else {
            return super.toIR(ctx)
        }
    }
}
