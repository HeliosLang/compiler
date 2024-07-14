import { CompilerError } from "@helios-lang/compiler-utils"
import { $, SourceMappedString } from "@helios-lang/ir"
import { None } from "@helios-lang/type-utils"
import { TAB, ToIRContext } from "../codegen/index.js"
import { GlobalScope, TopScope } from "../scopes/index.js"
import {
    BoolType,
    DefaultTypeClass,
    ScriptContextType
} from "../typecheck/index.js"
import { EntryPointImpl } from "./EntryPoint.js"
import { Module } from "./Module.js"

/**
 * @typedef {import("../codegen/index.js").Definitions} Definitions
 * @typedef {import("../typecheck/index.js").ScriptTypes} ScriptTypes
 * @typedef {import("../typecheck/index.js").Type} Type
 * @typedef {import("./EntryPoint.js").EntryPoint} EntryPoint
 */

/**
 * @implements {EntryPoint}
 */
export class RedeemerEntryPoint extends EntryPointImpl {
    /**
     * @param {string} purpose
     * @param {Module[]} modules
     * @param {boolean} allowPosParams
     * @param {boolean} invertEntryPoint
     */
    constructor(purpose, modules, allowPosParams, invertEntryPoint) {
        super(modules)
        this.purpose = purpose
        this.allowPosParams = allowPosParams
        this.invertEntryPoint = invertEntryPoint
    }

    /**
     * @protected
     * @type {number}
     */
    get nPosParams() {
        return this.mainFunc.nArgs - (this.invertEntryPoint ? 0 : 2)
    }

    /**
     * @param {ScriptTypes} validatorTypes
     * @returns {TopScope}
     */
    evalTypes(validatorTypes = {}) {
        const scope = GlobalScope.new(validatorTypes)

        return this.evalTypesInternal(scope)
    }

    /**
     *
     * @param {ToIRContext} ctx
     * @returns {[string, Type][]}
     */
    getRequiredParameters(ctx) {
        const ir = this.toIRInternal(ctx)

        return this.getRequiredParametersInternal(ctx, ir)
    }

    /**
     * @param {ToIRContext} ctx
     * @param {Option<Definitions>} extra
     * @returns {SourceMappedString}
     */
    toIR(ctx, extra = None) {
        const ir = this.toIRInternal(ctx)

        return this.wrapEntryPoint(ctx, ir, extra)
    }

    /**
     * @returns {string}
     */
    toString() {
        return `${this.purpose} ${this.name}\n${super.toString()}`
    }

    /**
     * @protected
     * @param {GlobalScope} scope
     * @returns {TopScope}
     */
    evalTypesInternal(scope) {
        const topScope = super.evalTypesInternal(scope)

        // check the 'main' function

        const main = this.mainFunc
        const argTypeNames = main.argTypeNames
        const argTypes = main.argTypes
        const retType = main.retType
        const nArgs = argTypes.length

        if (this.allowPosParams) {
            if (nArgs < 2) {
                throw CompilerError.type(
                    main.site,
                    "expected at least 2 args for main"
                )
                return topScope
            }
        } else {
            if (nArgs != 2) {
                throw CompilerError.type(main.site, "expected 2 args for main")
                return topScope
            }
        }

        for (let i = 0; i < nArgs; i++) {
            if (i == nArgs - 1) {
                if (
                    argTypeNames[i] != "" &&
                    !new ScriptContextType().isBaseOf(argTypes[i])
                ) {
                    throw CompilerError.type(
                        main.site,
                        `illegal type for arg ${nArgs} in main, expected 'ScriptContext', got ${argTypes[i].toString()}`
                    )
                }
            } else {
                if (
                    argTypeNames[i] != "" &&
                    !new DefaultTypeClass().isImplementedBy(argTypes[i])
                ) {
                    throw CompilerError.type(
                        main.site,
                        `illegal ${i == nArgs - 2 ? "redeemer " : ""}argument type in main: '${argTypes[i].toString()}`
                    )
                }
            }
        }

        if (!BoolType.isBaseOf(retType)) {
            throw CompilerError.type(
                main.site,
                `illegal return type for main, expected 'Bool', got '${retType.toString()}'`
            )
        }

        return topScope
    }

    /**
     * @protected
     * @param {ToIRContext} ctx
     * @returns {SourceMappedString}
     */
    toIRInternal(ctx) {
        const outerArgNames = this.invertEntryPoint ? [] : ["redeemer", "ctx"]
        const nOuterArgs = outerArgNames.length

        const nArgs = this.mainFunc.nArgs
        const argTypeNames = this.mainFunc.argTypeNames
        const argTypes = this.mainArgTypes

        const innerArgs = argTypes.map((t, i) => {
            const name =
                i >= nArgs - nOuterArgs
                    ? outerArgNames[i - (nArgs - nOuterArgs)]
                    : `__PARAM_${i.toString()}`

            // empty path
            if (argTypeNames[i] != "") {
                return $([$(`${t.path}__from_data`), $("("), $(name), $(")")])
            } else {
                // unused arg, 0 is easier to optimize
                return $("0")
            }
        })

        let ir = $([
            $(`${TAB}${TAB}__core__ifThenElse`),
            $("(", this.mainRetExprSite),
            $(`\n${TAB}${TAB}${TAB}${this.mainPath}(`),
            $(innerArgs).join(", "),
            $(
                `),\n${TAB}${TAB}${TAB}() -> {()},\n${TAB}${TAB}${TAB}() -> {__helios__error("validation returned false")}\n${TAB}${TAB})`
            ),
            $("(", this.mainRetExprSite),
            $(")")
        ])

        if (nOuterArgs > 0) {
            const outerArgs = outerArgNames.map((n) => $(n))

            ir = $([
                $(`${TAB}/*entry point*/\n${TAB}(`),
                $(outerArgs).join(", "),
                $(`) -> {\n`),
                ir,
                $(`\n${TAB}}`)
            ])
        }

        return ir
    }
}
