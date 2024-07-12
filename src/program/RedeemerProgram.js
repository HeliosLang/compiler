import { CompilerError } from "@helios-lang/compiler-utils"
import { $, SourceMappedString } from "@helios-lang/ir"
import { TAB, ToIRContext } from "../codegen/index.js"
import { GlobalScope, TopScope } from "../scopes/index.js"
import {
    BoolType,
    DefaultTypeClass,
    ScriptContextType
} from "../typecheck/index.js"
import { Module } from "./Module.js"
import { DEFAULT_PROGRAM_CONFIG, Program } from "./Program.js"

/**
 * @typedef {import("../typecheck/index.js").ScriptTypes} ScriptTypes
 * @typedef {import("./Program.js").ProgramConfig} ProgramConfig
 */

export class RedeemerProgram extends Program {
    /**
     * @param {string} purpose
     * @param {Module[]} modules
     * @param {ProgramConfig} config
     */
    constructor(purpose, modules, config = DEFAULT_PROGRAM_CONFIG) {
        super(purpose, modules, config)
    }

    /**
     * @type {number}
     */
    get nPosParams() {
        return this.mainFunc.nArgs - (this.config.invertEntryPoint ? 0 : 2)
    }

    /**
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

        if (this.config.allowPosParams) {
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
     * @param {ScriptTypes} validatorTypes
     * @returns {TopScope}
     */
    evalTypes(validatorTypes = {}) {
        const scope = GlobalScope.new(validatorTypes)

        return this.evalTypesInternal(scope)
    }

    /**
     * @param {ToIRContext} ctx
     * @returns {SourceMappedString}
     */
    toIRInternal(ctx) {
        const outerArgNames = this.config.invertEntryPoint
            ? []
            : ["redeemer", "ctx"]
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

    /**
     * @returns {string}
     */
    toString() {
        return `${this.purpose} ${this.name}\n${super.toString()}`
    }
}
