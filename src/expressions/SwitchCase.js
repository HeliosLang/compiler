import { CompilerError, Word } from "@helios-lang/compiler-utils"
import { $, SourceMappedString } from "@helios-lang/ir"
import { isNone } from "@helios-lang/type-utils"
import { TAB, ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import {
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
 * @typedef {import("../typecheck/index.js").Typed} Typed
 */

/**
 * Switch case for a switch expression
 * @implements {Token}
 */
export class SwitchCase {
    #lhs
    #bodyExpr

    /**
     * @type {null | number}
     */
    #constrIndex

    /**
     * @param {Site} site
     * @param {DestructExpr} lhs
     * @param {Expr} bodyExpr
     */
    constructor(site, lhs, bodyExpr) {
        this.site = site
        this.#lhs = lhs
        this.#bodyExpr = bodyExpr
        this.#constrIndex = null
    }

    /**
     * @type {Expr}
     */
    get body() {
        return this.#bodyExpr
    }

    /**
     * Used by parser to check if typeExpr reference the same base enum
     * @type {Word} - word representation of type
     */
    get memberName() {
        return this.#lhs.typeName
    }

    /**
     * @returns {boolean}
     */
    isDataMember() {
        switch (this.memberName.value) {
            case "Int":
            case "[]Data":
            case "ByteArray":
            case "Map[Data]Data":
                return true
            default:
                return false
        }
    }

    /**
     * @type {number}
     */
    get constrIndex() {
        if (isNone(this.#constrIndex)) {
            throw new Error("constrIndex not yet set")
        } else {
            return this.#constrIndex
        }
    }

    /**
     * @returns {string}
     */
    toString() {
        return `${this.#lhs.toString()} => ${this.#bodyExpr.toString()}`
    }

    /**
     * Evaluates the switch type and body value of a case.
     * @param {Scope} scope
     * @param {DataType} enumType
     * @returns {Typed}
     */
    evalEnumMember(scope, enumType) {
        const caseType =
            enumType.typeMembers[this.memberName.value]?.asEnumMemberType
        if (!caseType) {
            throw CompilerError.type(
                this.memberName.site,
                `${this.memberName.value} isn't a valid enum member of ${enumType.toString()}`
            )
        }

        this.#constrIndex = caseType.constrIndex

        if (this.#constrIndex < 0) {
            throw new Error("unexpected")
        }

        const caseScope = new Scope(scope, false)

        this.#lhs.evalInSwitchCase(caseScope, caseType)

        const bodyVal_ = this.#bodyExpr.eval(caseScope)

        const bodyVal = bodyVal_.asTyped

        if (!bodyVal) {
            throw CompilerError.type(this.#bodyExpr.site, "not typed")
        }

        caseScope.assertAllUsed()

        return bodyVal
    }

    /**
     * Evaluates the switch type and body value of a case.
     * @param {Scope} scope
     * @returns {Typed}
     */
    evalDataMember(scope) {
        /**
         * @type {DataType}
         */
        let memberType

        switch (this.memberName.value) {
            case "Int":
                memberType = IntType
                break
            case "ByteArray":
                memberType = ByteArrayType
                break
            case "[]Data":
                memberType = ListType$(RawDataType)
                break
            case "Map[Data]Data":
                memberType = MapType$(RawDataType, RawDataType)
                break
            default:
                const maybeMemberType_ = scope.get(this.memberName)

                let maybeMemberType = maybeMemberType_.asDataType
                if (!maybeMemberType) {
                    throw CompilerError.type(
                        this.memberName.site,
                        "expected a data type"
                    )
                }
                memberType = maybeMemberType

                if (!Common.isEnum(memberType)) {
                    throw CompilerError.type(
                        this.memberName.site,
                        "expected an enum type"
                    )
                }
        }

        const caseScope = new Scope(scope, false)

        this.#lhs.evalInSwitchCase(caseScope, memberType)

        const bodyVal_ = this.#bodyExpr.eval(caseScope)

        caseScope.assertAllUsed()

        const bodyVal = bodyVal_.asTyped

        if (!bodyVal) {
            throw CompilerError.type(this.#bodyExpr.site, "not typed")
        }

        return bodyVal
    }

    /**
     * Accept an arg because will be called with the result of the controlexpr
     * @param {ToIRContext} ctx
     * @returns {SourceMappedString}
     */
    toIR(ctx) {
        let inner = this.#bodyExpr.toIR(ctx.tab())

        inner = this.#lhs.wrapDestructIR(ctx, inner, 0)

        return $([
            $("("),
            this.#lhs.toNameIR(0), // wrapDestructIR depends on this name
            $(") "),
            $("->", this.site),
            $(` {\n${ctx.indent}${TAB}`),
            inner,
            $(`\n${ctx.indent}}`)
        ])
    }
}
