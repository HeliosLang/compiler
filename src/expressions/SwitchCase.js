import { makeTypeError } from "@helios-lang/compiler-utils"
import { $ } from "@helios-lang/ir"
import { expectDefined } from "@helios-lang/type-utils"
import { TAB, ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import { AllType, AnyType, DataEntity } from "../typecheck/index.js"
import { DestructExpr } from "./DestructExpr.js"
import { Expr } from "./Expr.js"

/**
 * @import { Site, Token, Word } from "@helios-lang/compiler-utils"
 * @import { SourceMappedStringI } from "@helios-lang/ir"
 * @import { TypeCheckContext } from "../index.js"
 * @typedef {import("../typecheck/index.js").DataType} DataType
 * @typedef {import("../typecheck/index.js").EnumMemberType} EnumMemberType
 * @typedef {import("../typecheck/index.js").Typed} Typed
 */

/**
 * @typedef {{
 *   site: Site
 *   lhs: DestructExpr
 *   body: Expr
 *   memberNames: (Word | undefined)[]
 *   toString(): string
 *   evalEnumMember(ctx: TypeCheckContext, scope: Scope, enumTypes: DataType[]): Typed
 *   toControlIR(ctx: ToIRContext, dataIRs: SourceMappedStringI[]): SourceMappedStringI
 *   toIR(ctx: ToIRContext): SourceMappedStringI
 * }} SwitchCaseI
 */

/**
 * Switch case for a switch expression
 * @implements {SwitchCaseI}
 */
export class SwitchCase {
    /**
     * @readonly
     * @type {Site}
     */
    site

    /**
     * @readonly
     * @type {DestructExpr}
     */
    lhs

    /**
     * @private
     * @readonly
     * @type {Expr}
     */
    _bodyExpr

    /**
     * @param {Site} site
     * @param {DestructExpr} lhs
     * @param {Expr} bodyExpr
     */
    constructor(site, lhs, bodyExpr) {
        this.site = site
        this.lhs = lhs
        this._bodyExpr = bodyExpr
    }

    /**
     * @type {Expr}
     */
    get body() {
        return this._bodyExpr
    }

    /**
     * Used by parser to check if typeExpr reference the same base enum
     * @type {(Word | undefined)[]} - word representation of type, TODO: change to list in order to allow  multi enum switch
     */
    get memberNames() {
        if (this.lhs.isTuple()) {
            return this.lhs.destructExprs.map((de) => {
                if (de.isIgnored() && !de.typeExpr) {
                    return undefined
                } else {
                    return de.typeName
                }
            })
        } else {
            if (this.lhs.isIgnored() && !this.lhs.typeExpr) {
                return [undefined]
            } else {
                return [this.lhs.typeName]
            }
        }
    }

    /**
     * @returns {string}
     */
    toString() {
        return `${this.lhs.toString()} => ${this._bodyExpr.toString()}`
    }

    /**
     * Evaluates the switch type and body value of a case.
     * @param {TypeCheckContext} ctx
     * @param {Scope} scope
     * @param {DataType[]} enumTypes
     * @returns {Typed}
     */
    evalEnumMember(ctx, scope, enumTypes) {
        // TODO: a list of case types
        const caseTypes = enumTypes.map((enumType, i) => {
            const memberName = this.memberNames[i]

            if (memberName) {
                const caseType =
                    enumType.typeMembers[memberName.value]?.asEnumMemberType

                if (!caseType) {
                    ctx.errors.type(
                        memberName.site,
                        `${memberName.value} isn't a valid enum member of ${enumType.toString()}`
                    )

                    return new AllType()
                }

                return caseType
            } else {
                return new AllType()
            }
        })

        const caseScope = new Scope(scope, false)

        this.lhs.evalInSwitchCase(ctx, caseScope, caseTypes)

        const bodyVal = this._bodyExpr.eval(ctx, caseScope).asTyped

        if (!bodyVal) {
            ctx.errors.type(this._bodyExpr.site, "not typed")
            return new DataEntity(new AnyType())
        }

        caseScope.assertAllUsed()

        return bodyVal
    }

    /**
     * @param {ToIRContext} _ctx
     * @param {SourceMappedStringI[]} dataIRs
     * @returns {SourceMappedStringI}
     */
    toControlIR(_ctx, dataIRs) {
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
                const lhsType = expectDefined(de.type.asDataType)
                return $`${lhsType.path}____is(${dataIRs[i]})`
            } else {
                return $`__helios__bool__and${n}(${$(
                    indices.map((i) => {
                        const de = this.lhs.destructExprs[i]
                        const lhsType = expectDefined(de.type.asDataType)

                        return $`${lhsType.path}____is(${dataIRs[i]})`
                    })
                ).join(", ")})`
            }
        } else {
            const lhsType = expectDefined(this.lhs.type.asDataType)
            return $`${lhsType.path}____is(${dataIRs[0]})`
        }
    }

    /**
     * Accept an arg because will be called with the result of the controlexpr
     * @param {ToIRContext} ctx
     * @returns {SourceMappedStringI}
     */
    toIR(ctx) {
        let inner = this._bodyExpr.toIR(ctx.tab())

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
