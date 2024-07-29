import { CompilerError, Word } from "@helios-lang/compiler-utils"
import { $, SourceMappedString } from "@helios-lang/ir"
import { None, expectSome, isNone } from "@helios-lang/type-utils"
import { TAB, ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import {
    AllType,
    ByteArrayType,
    Common,
    IntType,
    ListType$,
    MapType$,
    RawDataType
} from "../typecheck/index.js"
import { DestructExpr } from "./DestructExpr.js"
import { Expr } from "./Expr.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("@helios-lang/compiler-utils").Token} Token
 * @typedef {import("../typecheck/index.js").DataType} DataType
 * @typedef {import("../typecheck/index.js").EnumMemberType} EnumMemberType
 * @typedef {import("../typecheck/index.js").Typed} Typed
 */

/**
 * Switch case for a switch expression
 * @implements {Token}
 */
export class SwitchCase {
    /**
     * @readonly
     * @type {DestructExpr}
     */
    lhs

    #bodyExpr

    /**
     * @param {Site} site
     * @param {DestructExpr} lhs
     * @param {Expr} bodyExpr
     */
    constructor(site, lhs, bodyExpr) {
        this.site = site
        this.lhs = lhs
        this.#bodyExpr = bodyExpr
    }

    /**
     * @type {Expr}
     */
    get body() {
        return this.#bodyExpr
    }

    /**
     * Used by parser to check if typeExpr reference the same base enum
     * @type {Option<Word>[]} - word representation of type, TODO: change to list in order to allow  multi enum switch
     */
    get memberNames() {
        if (this.lhs.isTuple()) {
            return this.lhs.destructExprs.map((de) => {
                if (de.isIgnored() && !de.typeExpr) {
                    return None
                } else {
                    return de.typeName
                }
            })
        } else {
            if (this.lhs.isIgnored() && !this.lhs.typeExpr) {
                return [None]
            } else {
                return [this.lhs.typeName]
            }
        }
    }

    /**
     * @returns {string}
     */
    toString() {
        return `${this.lhs.toString()} => ${this.#bodyExpr.toString()}`
    }

    /**
     * Evaluates the switch type and body value of a case.
     * @param {Scope} scope
     * @param {DataType[]} enumTypes
     * @returns {Typed}
     */
    evalEnumMember(scope, enumTypes) {
        // TODO: a list of case types
        const caseTypes = enumTypes.map((enumType, i) => {
            const memberName = this.memberNames[i]

            if (memberName) {
                const caseType =
                    enumType.typeMembers[memberName.value]?.asEnumMemberType

                if (!caseType) {
                    throw CompilerError.type(
                        memberName.site,
                        `${memberName.value} isn't a valid enum member of ${enumType.toString()}`
                    )
                }

                return caseType
            } else {
                return new AllType()
            }
        })

        const caseScope = new Scope(scope, false)

        this.lhs.evalInSwitchCase(caseScope, caseTypes)

        const bodyVal_ = this.#bodyExpr.eval(caseScope)

        const bodyVal = bodyVal_.asTyped

        if (!bodyVal) {
            throw CompilerError.type(this.#bodyExpr.site, "not typed")
        }

        caseScope.assertAllUsed()

        return bodyVal
    }

    /**
     * @param {ToIRContext} ctx
     * @param {SourceMappedString[]} dataIRs
     * @returns {SourceMappedString}
     */
    toControlIR(ctx, dataIRs) {
        if (this.lhs.isTuple()) {
            const indices = this.lhs.destructExprs
                .map((de, i) => {
                    if (!(de.isIgnored() && !de.typeExpr)) {
                        return i
                    } else {
                        return -1
                    }
                })
                .filter((i) => i >= 0)

            const n = indices.length

            if (n == 0) {
                throw new Error("unexpected")
            } else if (n == 1) {
                const i = indices[0]
                const de = this.lhs.destructExprs[i]
                const lhsType = expectSome(de.type.asDataType)
                return $`${lhsType.path}____is(${dataIRs[i]})`
            } else {
                return $`__helios__bool__and${n}(${$(
                    indices.map((i) => {
                        const de = this.lhs.destructExprs[i]
                        const lhsType = expectSome(de.type.asDataType)

                        return $`${lhsType.path}____is(${dataIRs[i]})`
                    })
                ).join(", ")})`
            }
        } else {
            const lhsType = expectSome(this.lhs.type.asDataType)
            return $`${lhsType.path}____is(${dataIRs[0]})`
        }
    }

    /**
     * Accept an arg because will be called with the result of the controlexpr
     * @param {ToIRContext} ctx
     * @returns {SourceMappedString}
     */
    toIR(ctx) {
        let inner = this.#bodyExpr.toIR(ctx.tab())

        inner = this.lhs.wrapDestructIR(ctx, inner, 0)

        return $([
            $("("),
            this.lhs.toNameIR(0), // wrapDestructIR depends on this name
            $(") "),
            $("->", this.site),
            $(` {\n${ctx.indent}${TAB}`),
            inner,
            $(`\n${ctx.indent}}`)
        ])
    }
}
