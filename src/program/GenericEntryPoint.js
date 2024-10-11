import { CompilerError } from "@helios-lang/compiler-utils"
import { $ } from "@helios-lang/ir"
import { None, expectSome } from "@helios-lang/type-utils"
import { TAB, ToIRContext } from "../codegen/index.js"
import { GlobalScope } from "../scopes/index.js"
import { isDataType } from "../typecheck/index.js"
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
export class GenericEntryPoint extends EntryPointImpl {
    /**
     * @readonly
     * @type {string}
     */
    purpose

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

        argTypeNames.forEach((argTypeName, i) => {
            if (argTypeName != "" && !isDataType(argTypes[i])) {
                throw CompilerError.type(
                    main.site,
                    `illegal argument type in main: '${argTypes[i].toString()}`
                )
            }
        })

        if (!isDataType(retType)) {
            throw CompilerError.type(
                main.site,
                `illegal return type for main: '${retType.toString()}'`
            )
        }
    }

    /**
     * @param {ToIRContext} ctx
     * @param {Option<Definitions>} extra
     * @returns {SourceMappedStringI}
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
     * @returns {SourceMappedStringI}
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
