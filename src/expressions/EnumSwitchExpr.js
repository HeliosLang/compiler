import { CompilerError } from "@helios-lang/compiler-utils"
import { TAB, ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import { Common, ErrorEntity } from "../typecheck/index.js"
import { SwitchExpr } from "./SwitchExpr.js"
import { $, SourceMappedString } from "@helios-lang/ir"
import { SwitchCase } from "./SwitchCase.js"
import { SwitchDefault } from "./SwitchDefault.js"
import { expectSome } from "@helios-lang/type-utils"
import { IfElseExpr } from "./IfElseExpr.js"

/**
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 * @typedef {import("../typecheck/index.js").Type} Type
 */

/**
 * Switch expression for Enum, with SwitchCases and SwitchDefault as children
 */
export class EnumSwitchExpr extends SwitchExpr {
    /**
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    evalInternal(scope) {
        const controlVal_ = this.controlExpr.eval(scope)

        const controlVal = controlVal_.asTyped

        if (!controlVal) {
            throw CompilerError.type(this.controlExpr.site, "not typed")
        }

        let enumType = controlVal.type.asDataType

        if (!enumType) {
            throw CompilerError.type(this.controlExpr.site, "not an enum")
        }

        if (controlVal.type.asEnumMemberType) {
            throw CompilerError.type(
                this.controlExpr.site,
                `${controlVal.type.toString()} is an enum variant, not an enum`
            )
            //enumType = controlVal.type.asEnumMemberType.parentType // continue with optimistic evaluation, even though compilation will fail
        }

        const nEnumMembers = Common.countEnumMembers(enumType)

        // check that we have enough cases to cover the enum members
        if (this.defaultCase === null && nEnumMembers > this.cases.length) {
            // mutate defaultCase to VoidExpr
            this.setDefaultCaseToVoid()
        }

        /** @type {null | Type} */
        let branchMultiType = null

        for (let c of this.cases) {
            const branchVal = c.evalEnumMember(scope, enumType)

            if (!branchVal) {
                continue
            }

            branchMultiType = IfElseExpr.reduceBranchMultiType(
                c.site,
                branchMultiType,
                branchVal
            )
        }

        if (this.defaultCase !== null) {
            const defaultVal = this.defaultCase.eval(scope)

            if (defaultVal) {
                branchMultiType = IfElseExpr.reduceBranchMultiType(
                    this.defaultCase.site,
                    branchMultiType,
                    defaultVal
                )
            }
        }

        if (branchMultiType === null) {
            return new ErrorEntity()
        } else {
            return branchMultiType.toTyped()
        }
    }

    /**
     * @param {ToIRContext} ctx
     * @returns {SourceMappedString}
     */
    toIR(ctx) {
        let cases = this.cases.slice()

        /** @type {SwitchCase | SwitchDefault} */
        let last
        if (this.defaultCase !== null) {
            last = this.defaultCase
        } else {
            last = expectSome(cases.pop())
        }

        let n = cases.length

        let res = last.toIR(ctx.tab().tab().tab())

        // TODO: if constrIndex is null then use the case test that is defined as a builtin (needed to be able to treat StakingCredential as an enum)
        // TODO: once the null fallback has been implemented get rid of constrIndex
        for (let i = n - 1; i >= 0; i--) {
            const c = cases[i]

            const test = $`__core__equalsInteger(i, ${c.constrIndex.toString()})`

            res = $`__core__ifThenElse(
				${test},
				() -> {
					${c.toIR(ctx.tab().tab().tab())}
				}, () -> {
					${res}
				}
			)()`
        }

        return $([
            $(`(e) `),
            $("->", this.site),
            $(
                ` {\n${ctx.indent}${TAB}(\n${ctx.indent}${TAB}${TAB}(i) -> {\n${ctx.indent}${TAB}${TAB}${TAB}`
            ),
            res,
            $(
                `\n${ctx.indent}${TAB}${TAB}}(__core__fstPair(__core__unConstrData(e)))\n${ctx.indent}${TAB})(e)\n${ctx.indent}}(`
            ),
            this.controlExpr.toIR(ctx),
            $(")")
        ])
    }
}
