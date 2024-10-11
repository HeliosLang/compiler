import { CompilerError, TokenSite } from "@helios-lang/compiler-utils"
import { $ } from "@helios-lang/ir"
import { None, expectSome } from "@helios-lang/type-utils"
import { TAB, ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import {
    ErrorEntity,
    TupleType,
    VoidType,
    collectEnumMembers
} from "../typecheck/index.js"
import { SwitchExpr } from "./SwitchExpr.js"
import { SwitchCase } from "./SwitchCase.js"
import { SwitchDefault } from "./SwitchDefault.js"
import { IfElseExpr } from "./IfElseExpr.js"

/**
 * @typedef {import("@helios-lang/ir").SourceMappedStringI} SourceMappedStringI
 * @typedef {import("../typecheck/index.js").DataType} DataType
 * @typedef {import("../typecheck/index.js").EnumMemberType} EnumMemberType
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 * @typedef {import("../typecheck/index.js").Type} Type
 */

const IR_CONTROL_EXPR_NAME = "__cond"

/**
 * Switch expression for Enum, with SwitchCases and SwitchDefault as children
 */
export class EnumSwitchExpr extends SwitchExpr {
    /**
     * @private
     * @param {Scope} scope
     * @returns {DataType[]}
     */
    evalControlExprTypes(scope) {
        const controlVal_ = this.controlExpr.eval(scope)

        const controlVal = controlVal_.asTyped

        if (!controlVal) {
            throw CompilerError.type(this.controlExpr.site, "not typed")
        }

        if (controlVal.type instanceof TupleType) {
            const itemTypes = controlVal.type.itemTypes

            /**
             * @type {DataType[]}
             */
            let controlTypes = []

            itemTypes.forEach((itemType) => {
                let enumType = itemType.asDataType

                if (!enumType) {
                    throw CompilerError.type(
                        this.controlExpr.site,
                        "not an enum"
                    )
                }

                if (itemType.asEnumMemberType) {
                    throw CompilerError.type(
                        this.controlExpr.site,
                        `${itemType.toString()} is an enum variant, not an enum`
                    )
                }

                controlTypes.push(enumType)
            })

            return controlTypes
        } else {
            // TODO: as list that also allows tuples
            let enumType = controlVal.type.asDataType

            if (!enumType) {
                throw CompilerError.type(this.controlExpr.site, "not an enum")
            }

            if (controlVal.type.asEnumMemberType) {
                throw CompilerError.type(
                    this.controlExpr.site,
                    `${controlVal.type.toString()} is an enum variant, not an enum`
                )
            }

            return [enumType]
        }
    }

    /**
     * Throws an error if some cases can't be reached
     * @param {DataType[]} enumTypes
     * @returns {boolean}
     */
    checkCaseReachability(enumTypes) {
        // first collect all variants for each enum type
        /**
         * @type {[string, EnumMemberType][][]}
         */
        const variants = enumTypes.map((enumType, i) => {
            const vs = collectEnumMembers(enumType)

            if (vs.length == 0) {
                throw CompilerError.type(
                    this.controlExpr.site,
                    `'${enumType.name}' isn't an enum type`
                )
            }

            return vs
        })

        const strides = variants.reduce(
            (prev, vs) => {
                const prevStride = prev[prev.length - 1] * vs.length
                return prev.concat([prevStride])
            },
            [1]
        )
        const nCombinations = strides[strides.length - 1]

        /**
         * @type {boolean[]}
         */
        const reachable = new Array(nCombinations).fill(true)

        /**
         * @param {number[]} indices
         * @returns {number}
         */
        const calcIndex = (indices) => {
            return indices.reduce((prev, i, j) => prev + i * strides[j], 0)
        }

        /**
         * @param {number[]} indices - '-1' is used for 'all'
         * @returns {number[][]} - without '-1'
         */
        const calcPermutations = (indices) => {
            /**
             * @type {number[][]}
             */
            let result = [[]]

            for (let j = 0; j < indices.length; j++) {
                const i = indices[j]

                if (i == -1) {
                    const n = variants[j].length

                    /**
                     * @type {number[][]}
                     */
                    let tmp = []

                    for (let k = 0; k < n; k++) {
                        for (let lst of result) {
                            tmp.push(lst.concat([k]))
                        }
                    }

                    result = tmp
                } else {
                    result = result.map((r) => r.concat([i]))
                }
            }

            return result
        }

        /**
         * @param {number[]} indices - '-1' is used for 'all'
         */
        const markUnreachable = (indices) => {
            calcPermutations(indices).forEach((indices) => {
                const i = calcIndex(indices)
                reachable[i] = false
            })
        }

        /**
         * @param {number[]} indices - '-1' is used for 'all'
         * @returns {boolean}
         */
        const isSomeReachable = (indices) => {
            return calcPermutations(indices).some((indices) => {
                const i = calcIndex(indices)
                return reachable[i]
            })
        }

        this.cases.forEach((c) => {
            /**
             * @type {number[]}
             */
            let indices
            if (c.lhs.isTuple()) {
                indices = c.lhs.destructExprs.map((de, i) => {
                    if (de.isIgnored() && !de.typeExpr) {
                        return -1
                    } else {
                        const j = variants[i].findIndex(
                            (value) => value[0] == de.typeName.value
                        )
                        if (j == -1) {
                            throw new Error(
                                `unexpected, couldn't find ${de.typeName.value} in ${variants[i].map((v) => v[0]).join(", ")}`
                            )
                        }

                        return j
                    }
                })
            } else {
                indices = [
                    variants[0].findIndex(
                        (value) => value[0] == c.lhs.typeName.value
                    )
                ]

                if (indices[0] == -1) {
                    throw new Error(
                        `unexpected, couldn't find ${c.lhs.typeName.value} in ${variants[0].map((v) => v[0]).join(", ")}`
                    )
                }
            }

            if (!isSomeReachable(indices)) {
                throw CompilerError.type(
                    c.lhs.site,
                    `unreachable condition '${c.lhs.toString()}'`
                )
            }

            markUnreachable(indices)
        })

        const someRemainingReachable = reachable.some((r) => r)

        if (this.defaultCase && !someRemainingReachable) {
            throw CompilerError.type(
                this.defaultCase.site,
                "unreachable default case"
            )
        }

        return someRemainingReachable
    }

    /**
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    evalInternal(scope) {
        const enumTypes = this.evalControlExprTypes(scope)

        const someUncovered = this.checkCaseReachability(enumTypes)

        if (!this.defaultCase && someUncovered) {
            this.setDefaultCaseToVoid()
        }

        /**
         * @type {Option<Type>}
         */
        let branchMultiType = None

        for (let c of this.cases) {
            // TODO: pass a list of enumTypes (can be multiswitch)
            const branchVal = c.evalEnumMember(scope, enumTypes)

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
            if (
                this.defaultCase.isVoid() &&
                branchMultiType &&
                !new VoidType().isBaseOf(branchMultiType)
            ) {
                throw CompilerError.type(this.site, "incomplete enum coverage")
            }

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
            return new ErrorEntity()
        } else {
            return branchMultiType.toTyped()
        }
    }

    /**
     * @param {ToIRContext} ctx
     * @returns {SourceMappedStringI}
     */
    toIR(ctx) {
        let cases = this.cases.slice()

        /** @type {SwitchCase | SwitchDefault} */
        let last
        if (this.defaultCase) {
            last = this.defaultCase
        } else {
            last = expectSome(cases.pop())
        }

        let n = cases.length

        let res = last.toIR(ctx.tab().tab().tab())

        let nLhs = 1
        if (n == 0 && last instanceof SwitchCase && last.lhs.isTuple()) {
            nLhs = last.lhs.destructExprs.length
        } else if (cases.length > 0 && cases[0].lhs.isTuple()) {
            nLhs = cases[0].lhs.destructExprs.length
        }

        /**
         * @type {SourceMappedStringI[]}
         */
        const es = []

        if (nLhs == 1) {
            es.push($(IR_CONTROL_EXPR_NAME))
        } else {
            for (let i = 0; i < nLhs; i++) {
                es.push($`${IR_CONTROL_EXPR_NAME}_${i}`)
            }
        }

        const switchLambdaSite = TokenSite.fromSite(this.site).withAlias(
            "<switch>"
        )

        for (let i = n - 1; i >= 0; i--) {
            const c = cases[i]

            const test = c.toControlIR(ctx, es)

            res = $`__core__ifThenElse(
				${test},
				() ${$("->", switchLambdaSite)} {
					${c.toIR(ctx.tab().tab().tab())}
				}, () ${$("->", switchLambdaSite)} {
					${res}
				}
			)()`
        }

        if (nLhs == 1) {
            return $([
                $("("),
                $(
                    IR_CONTROL_EXPR_NAME,
                    TokenSite.dummy().withAlias("<condition>")
                ),
                $(")"),
                $("->", switchLambdaSite),
                $(`\n${ctx.indent}${TAB}{(\n`),
                res,
                $(`\n${ctx.indent}${TAB}`),
                $(")"),
                $("(", this.dotSite),
                $(`${IR_CONTROL_EXPR_NAME})}`),
                $("(", this.dotSite),
                this.controlExpr.toIR(ctx),
                $(")")
            ])
        } else {
            return $([
                $(
                    `(${$(IR_CONTROL_EXPR_NAME, TokenSite.dummy().withAlias("<condition>"))}) `
                ),
                $("->", switchLambdaSite),
                $(`\n${ctx.indent}${TAB}{(\n`),
                $(`${IR_CONTROL_EXPR_NAME}((${$(es).join(", ")}) -> {
                    ${res}
                })`),
                $(`\n${ctx.indent}${TAB})`),
                $("(", this.dotSite),
                $(IR_CONTROL_EXPR_NAME),
                $(`)}`),
                $("(", this.dotSite),
                this.controlExpr.toIR(ctx),
                $(")")
            ])
        }
    }
}
