import { CompilerError } from "@helios-lang/compiler-utils"
import { $, SourceMappedString } from "@helios-lang/ir"
import { None, expectSome } from "@helios-lang/type-utils"
import { TAB, ToIRContext } from "../codegen/index.js"
import { GlobalScope, TopScope } from "../scopes/index.js"
import { DefaultTypeClass } from "../typecheck/index.js"
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
export class GenericEntryPoint extends EntryPointImpl {
    /**
     * @readonly
     * @type {string}
     */
    purpose

    /**
     * @param {string} purpose
     * @param {Module[]} modules
     */
    constructor(purpose, modules) {
        super(modules)
        this.purpose = purpose
    }

    /**
     * @param {ScriptTypes} scriptTypes
     * @returns {TopScope}
     */
    evalTypes(scriptTypes) {
        const scope = GlobalScope.new({ scriptTypes, currentScript: this.name })

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
