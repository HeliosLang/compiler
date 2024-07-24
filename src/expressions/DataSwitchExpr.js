import { CompilerError } from "@helios-lang/compiler-utils"
import { TAB, ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import { ErrorEntity, RawDataType } from "../typecheck/index.js"
import { IfElseExpr } from "./IfElseExpr.js"
import { SwitchExpr } from "./SwitchExpr.js"
import { $, SourceMappedString } from "@helios-lang/ir"
import { None, expectSome } from "@helios-lang/type-utils"

/**
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 * @typedef {import("../typecheck/index.js").Type} Type
 */

/**
 * Switch expression for Data
 */
export class DataSwitchExpr extends SwitchExpr {
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

        const dataType = controlVal.type.asDataType
        if (!dataType) {
            throw CompilerError.type(this.controlExpr.site, "not a data type")
        }

        if (!RawDataType.isBaseOf(dataType)) {
            throw CompilerError.type(
                this.controlExpr.site,
                `expected Data type, got ${controlVal.type.toString()}`
            )
        }

        // check that we have enough cases to cover the enum members
        if (!this.defaultCase && this.cases.length < 5) {
            // mutate defaultCase to VoidExpr
            this.setDefaultCaseToVoid()
        }

        /** @type {null | Type} */
        let branchMultiType = null

        for (let c of this.cases) {
            const branchVal = c.evalDataMember(scope)

            if (!branchVal) {
                continue
            }

            branchMultiType = IfElseExpr.reduceBranchMultiType(
                c.site,
                branchMultiType,
                branchVal
            )
        }

        if (this.defaultCase) {
            const defaultVal = this.defaultCase.eval(scope)

            if (defaultVal) {
                branchMultiType = IfElseExpr.reduceBranchMultiType(
                    this.defaultCase.site,
                    branchMultiType,
                    defaultVal
                )
            }
        }

        if (!branchMultiType) {
            // only possible if each branch is an error
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
        /** @type {[Option<SourceMappedString>, Option<SourceMappedString>, Option<SourceMappedString>, Option<SourceMappedString>, Option<SourceMappedString>]} */
        let cases = [None, None, None, None, None] // constr, map, list, int, byteArray

        for (let c of this.cases) {
            let ir = c.toIR(ctx.tab().tab())

            switch (c.memberName.value) {
                case "ByteArray":
                    cases[4] = $([
                        $("("),
                        $("e"),
                        $(") -> {"),
                        ir,
                        $("("),
                        $("__helios__bytearray__from_data"),
                        $("("),
                        $("e"),
                        $(")"),
                        $(")"),
                        $("}")
                    ])
                    break
                case "Int":
                    cases[3] = $([
                        $("("),
                        $("e"),
                        $(") -> {"),
                        ir,
                        $("("),
                        $("__helios__int__from_data"),
                        $("("),
                        $("e"),
                        $(")"),
                        $(")"),
                        $("}")
                    ])
                    break
                case "[]Data":
                    cases[2] = $([
                        $("("),
                        $("e"),
                        $(") -> {"),
                        ir,
                        $("("),
                        $("__code__unListData"),
                        $("("),
                        $("e"),
                        $(")"),
                        $(")"),
                        $("}")
                    ])
                    break
                case "Map[Data]Data":
                    cases[1] = $([
                        $("("),
                        $("e"),
                        $(") -> {"),
                        ir,
                        $("("),
                        $("__code__unMapData"),
                        $("("),
                        $("e"),
                        $(")"),
                        $(")"),
                        $("}")
                    ])
                    break
                case "(Int, []Data)":
                    // conversion from_data is handled by UnconstrDataSwitchCase
                    cases[0] = ir
                    break
                default:
                    if (cases[0]) {
                        throw new Error("should've been caught before")
                    }

                    cases[0] = ir
            }
        }

        if (this.defaultCase) {
            for (let i = 0; i < 5; i++) {
                if (!cases[i]) {
                    cases[i] = $(`${ctx.indent}${TAB}def`)
                }
            }
        }

        let res = $([
            $(`${ctx.indent}__core__chooseData(e, `, this.site),
            $(cases.map((c) => expectSome(c))).join(", "),
            $(`${ctx.indent})`)
        ])

        if (this.defaultCase) {
            res = $([
                $(`${ctx.indent}(def) -> {\n`),
                res,
                $(`\n${ctx.indent}}(`),
                this.defaultCase.toIR(ctx),
                $(`)`)
            ])
        }

        res = $([
            $(`${ctx.indent}(e) -> {\n`),
            res,
            $("(e)"),
            $(`${ctx.indent}}(`),
            this.controlExpr.toIR(ctx),
            $(")")
        ])

        return res
    }
}
