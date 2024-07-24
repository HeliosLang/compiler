import { CompilerError, Word } from "@helios-lang/compiler-utils"
import { $, SourceMappedString } from "@helios-lang/ir"
import { TAB, ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import {
    DataEntity,
    IntType,
    ListType$,
    RawDataType
} from "../typecheck/index.js"
import { DestructExpr } from "./DestructExpr.js"
import { Expr } from "./Expr.js"
import { RefExpr } from "./RefExpr.js"
import { SwitchCase } from "./SwitchCase.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("../typecheck/index.js").Instance} Instance
 * @typedef {import("../typecheck/index.js").Type} Type
 * @typedef {import("../typecheck/index.js").Typed} Typed
 */

export class UnconstrDataSwitchCase extends SwitchCase {
    /**
     * @type {Option<Word>}
     */
    #intVarName

    /**
     * @type {Option<Word>}
     */
    #lstVarName

    /**
     * @param {Site} site
     * @param {Option<Word>} intVarName
     * @param {Option<Word>} lstVarName
     * @param {Expr} bodyExpr
     */
    constructor(site, intVarName, lstVarName, bodyExpr) {
        super(
            site,
            new DestructExpr(
                new Word("_", site),
                new RefExpr(new Word("(Int, []Data)", site))
            ),
            bodyExpr
        )

        this.#intVarName = intVarName
        this.#lstVarName = lstVarName
    }

    isDataMember() {
        return true
    }

    toString() {
        return `(${!this.#intVarName ? "" : this.#intVarName.value + ": "}Int, ${!this.#lstVarName ? "" : this.#lstVarName.value + ": "} []Data) => ${this.body.toString()}`
    }

    /**
     * @param {Scope} scope
     * @param {Type} enumType
     * @returns {Instance}
     */
    evalEnumMember(scope, enumType) {
        throw new Error("not available")
    }

    /**
     * Evaluates the switch type and body value of a case.
     * @param {Scope} scope
     * @returns {Typed}
     */
    evalDataMember(scope) {
        /**
         * @type {null | Typed}
         */
        let bodyVal = null

        if (this.#intVarName  || this.#lstVarName ) {
            let caseScope = new Scope(scope, false)

            if (this.#intVarName) {
                caseScope.set(this.#intVarName, new DataEntity(IntType))
            }

            if (this.#lstVarName) {
                caseScope.set(
                    this.#lstVarName,
                    new DataEntity(ListType$(RawDataType))
                )
            }

            const bodyVal_ = this.body.eval(caseScope)

            bodyVal = bodyVal_.asTyped

            caseScope.assertAllUsed()
        } else {
            const bodyVal_ = this.body.eval(scope)

            bodyVal = bodyVal_.asTyped
        }

        if (!bodyVal) {
            throw CompilerError.type(this.body.site, "not typed")
        }

        return bodyVal
    }

    /**
     * Accepts two args
     * @param {ToIRContext} ctx
     * @returns {SourceMappedString}
     */
    toIR(ctx) {
        return $([
            $(`(data) -> {\n${ctx.indent}${TAB}`),
            $(`(pair) -> {\n${ctx.indent}${TAB}${TAB}`),
            $(
                `(${this.#intVarName ? this.#intVarName.toString() : "_"}, ${this.#lstVarName ? this.#lstVarName.toString() : "_"}) `
            ),
            $("->", this.site),
            $(` {\n${ctx.indent}${TAB}${TAB}${TAB}`),
            this.body.toIR(ctx.tab().tab().tab()),
            $(
                `\n${ctx.indent}${TAB}${TAB}}(__core__fstPair(pair), __core__sndPair(pair))`
            ),
            $(`\n${ctx.indent}${TAB}}(__core__unConstrData(data))`),
            $(`\n${ctx.indent}}`)
        ])
    }
}
