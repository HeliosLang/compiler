import { CompilerError } from "@helios-lang/compiler-utils"
import { $, SourceMappedString } from "@helios-lang/ir"
import { expectSome } from "@helios-lang/type-utils"
import { TAB, ToIRContext } from "../codegen/index.js"
import { GlobalScope, TopScope } from "../scopes/index.js"
import { DefaultTypeClass } from "../typecheck/index.js"
import { Module } from "./Module.js"
import { Program } from "./Program.js"

/**
 * @typedef {import("../typecheck/index.js").ScriptTypes} ScriptTypes
 * @typedef {import("./Program.js").ProgramConfig} ProgramConfig
 */

export class GenericProgram extends Program {
    /**
     * @param {string} purpose
     * @param {Module[]} modules
     * @param {ProgramConfig} config
     */
    constructor(purpose, modules, config) {
        super(purpose, modules, config)
    }

    /**
     * @returns {string}
     */
    toString() {
        return `${this.purpose} ${this.name}\n${super.toString()}`
    }

    /**
     * @param {ScriptTypes} scriptTypes
     * @returns {TopScope}
     */
    evalTypes(scriptTypes) {
        const scope = GlobalScope.new(scriptTypes)

        const topScope = super.evalTypesInternal(scope)

        // check the 'main' function

        const main = this.mainFunc
        const argTypeNames = main.argTypeNames
        const argTypes = main.argTypes
        const retType = main.retType

        argTypeNames.forEach((argTypeName, i) => {
            if (
                argTypeName != "" &&
                !new DefaultTypeClass().isImplementedBy(argTypes[i])
            ) {
                throw CompilerError.type(
                    main.site,
                    `illegal argument type in main: '${argTypes[i].toString()}`
                )
            }
        })

        // TODO: support tuple return values ?
        if (!new DefaultTypeClass().isImplementedBy(retType)) {
            throw CompilerError.type(
                main.site,
                `illegal return type for main: '${retType.toString()}'`
            )
        }

        return topScope
    }

    /**
     * @param {ToIRContext} ctx
     * @returns {SourceMappedString}
     */
    toIRInternal(ctx) {
        const argTypeNames = this.mainFunc.argTypeNames

        const innerArgs = this.mainArgTypes.map((t, i) => {
            // empty path
            if (argTypeNames[i] != "") {
                return $([
                    $(`${t.path}__from_data`),
                    $("("),
                    $(`arg${i}`),
                    $(")")
                ])
            } else {
                // unused arg, 0 is easier to optimize
                return $("0")
            }
        })

        let ir = $([$(`${this.mainPath}(`), $(innerArgs).join(", "), $(")")])

        const retType = expectSome(this.mainFunc.retType.asDataType)

        ir = $([$(`${retType.path}____to_data`), $("("), ir, $(")")])

        const outerArgs = this.mainFunc.argTypes.map((_, i) => $(`arg${i}`))

        ir = $([
            $(`${TAB}/*entry point*/\n${TAB}(`),
            $(outerArgs).join(", "),
            $(`) -> {\n${TAB}${TAB}`),
            ir,
            $(`\n${TAB}}`)
        ])

        return ir
    }
}
