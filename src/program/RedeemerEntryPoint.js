import { CompilerError } from "@helios-lang/compiler-utils"
import { $ } from "@helios-lang/ir"
import { None } from "@helios-lang/type-utils"
import { TAB, ToIRContext } from "../codegen/index.js"
import { GlobalScope } from "../scopes/index.js"
import { BoolType, isDataType, VoidType } from "../typecheck/index.js"
import { EntryPointImpl } from "./EntryPoint.js"
import { ModuleCollection } from "./ModuleCollection.js"

/**
 * @typedef {import("@helios-lang/ir").SourceMappedStringI} SourceMappedStringI
 * @typedef {import("../codegen/index.js").Definitions} Definitions
 * @typedef {import("../typecheck/index.js").DataType} DataType
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
     * @param {ModuleCollection} modules
     */
    constructor(purpose, modules) {
        super(modules)
        this.purpose = purpose
    }

    /**
     * @type {Set<string>}
     */
    get requiredParams() {
        const ctx = new ToIRContext({ optimize: false, isTestnet: false })
        const ir = this.toIRInternal(ctx)

        return this.getRequiredParametersInternal(ctx, ir)
    }

    /**
     * @param {ScriptTypes} scriptTypes
     */
    evalTypes(scriptTypes) {
        const scope = GlobalScope.new({ scriptTypes, currentScript: this.name })

        super.evalTypesInternal(scope)

        // check the 'main' function

        const main = this.mainFunc
        const argTypeNames = main.argTypeNames
        const argTypes = main.argTypes
        const retType = main.retType
        const nArgs = argTypes.length

        if (nArgs != 1) {
            throw CompilerError.type(main.site, "expected 1 arg for main")
        }

        if (argTypeNames[0] != "" && !isDataType(argTypes[0])) {
            throw CompilerError.type(
                main.site,
                `illegal redeemer argument type in main: '${argTypes[0].toString()}`
            )
        }

        if (!BoolType.isBaseOf(retType) && !new VoidType().isBaseOf(retType)) {
            throw CompilerError.type(
                main.site,
                `illegal return type for main, expected 'Bool' or '()', got '${retType.toString()}'`
            )
        }
    }

    /**
     * @param {ToIRContext} ctx
     * @param {Option<Definitions>} extra
     * @returns {SourceMappedStringI}
     */
    toIR(ctx, extra = None) {
        let ir = this.toIRInternal(ctx)

        ir = this.wrapEntryPoint(ctx, ir, extra)

        ir = $`(__REDEEMER, __CONTEXT) -> {
    ${ir}
}`

        return ir
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
     * @returns {SourceMappedStringI}
     */
    toIRInternal(ctx) {
        const argTypeNames = this.mainFunc.argTypeNames
        const argTypes = this.mainArgTypes

        const innerArgNames = [`__REDEEMER`]
        const innerArgs = argTypes.map((t, i) => {
            // empty path
            if (argTypeNames[i] != "") {
                if (t.path == "") {
                    throw new Error("unexpected")
                }

                return $([
                    $(`${t.path}__from_data`),
                    $("("),
                    $(innerArgNames[i]),
                    $(")")
                ])
            } else {
                // unused arg, 0 is easier to optimize
                return $("0")
            }
        })

        let ir = $([$(`${this.mainPath}(`), $(innerArgs).join(", "), $(`)`)])

        if (BoolType.isBaseOf(this.mainFunc.retType)) {
            ir = $([
                $(`${TAB}${TAB}__core__ifThenElse`),
                $("(", this.mainRetExprSite),
                $(`\n${TAB}${TAB}${TAB}`),
                ir,
                $(
                    `,\n${TAB}${TAB}${TAB}() -> {()},\n${TAB}${TAB}${TAB}() -> {__helios__error("validation returned false")}\n${TAB}${TAB})`
                ),
                $("(", this.mainRetExprSite),
                $(")")
            ])
        }

        return ir
    }
}
