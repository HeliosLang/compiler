import { CompilerError } from "@helios-lang/compiler-utils"
import { $, DEFAULT_PARSE_OPTIONS, compile } from "@helios-lang/ir"
import { None } from "@helios-lang/type-utils"
import { UplcProgramV2 } from "@helios-lang/uplc"
import { TAB, ToIRContext } from "../codegen/index.js"
import { GlobalScope } from "../scopes/index.js"
import { BoolType, isDataType } from "../typecheck/index.js"
import { EntryPointImpl } from "./EntryPoint.js"
import { ModuleCollection } from "./ModuleCollection.js"

/**
 * @typedef {import("@helios-lang/uplc").UplcProgramV2I} UplcProgramV2I
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
export class DatumRedeemerEntryPoint extends EntryPointImpl {
    /**
     * @param {string} purpose
     * @param {ModuleCollection} modules
     */
    constructor(purpose, modules) {
        super(modules)
        this.purpose = purpose
    }

    /**
     * @type {DataType}
     */
    get datumType() {
        return this.mainArgTypes[0]
    }

    /**
     * @type {string}
     */
    get datumTypeName() {
        return this.mainFunc.argTypeNames[0]
    }

    /**
     * @type {Set<string>}
     */
    get requiredParams() {
        const ctx = new ToIRContext({
            optimize: false,
            isTestnet: false
        })

        const ir = this.toIRInternal(ctx)

        return this.getRequiredParametersInternal(ctx, ir)
    }

    /**
     * Used by cli
     * @param {boolean} isTestnet
     * @returns {UplcProgramV2I}
     */
    compileDatumCheck(isTestnet) {
        const ctx = new ToIRContext({ optimize: false, isTestnet: isTestnet })
        const ir = this.datumCheckToIR(ctx)

        return compile(ir, {
            optimize: false,
            parseOptions: {
                ...DEFAULT_PARSE_OPTIONS,
                builtinsPrefix: "__core__",
                errorPrefix: ""
            }
        })
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
        const nArgs = main.nArgs

        if (argTypes.length != 2) {
            throw CompilerError.type(main.site, "expected 2 args for main")
        }

        for (let i = 0; i < nArgs; i++) {
            if (argTypeNames[i] != "" && !isDataType(argTypes[i])) {
                throw CompilerError.type(
                    main.site,
                    `illegal type for arg ${i + 1} in main ${i == nArgs - 2 ? "(datum) " : i == nArgs - 3 ? "(redeemer) " : ""}: '${argTypes[i].toString()}`
                )
            }
        }

        if (!BoolType.isBaseOf(retType)) {
            throw CompilerError.type(
                main.site,
                `illegal return type for main, expected 'Bool', got '${retType.toString()}'`
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

        ir = $`(__DATUM, __REDEEMER, __CONTEXT) -> {
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

        const innerArgNames = [`__DATUM`, `__REDEEMER`]
        const innerArgs = this.mainArgTypes.map((t, i) => {
            if (argTypeNames[i] != "") {
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

        return ir
    }

    /**
     * @internal
     * @param {ToIRContext} ctx
     * @returns {SourceMappedStringI}
     */
    datumCheckToIR(ctx) {
        if (this.datumTypeName == "") {
            return $(`(data) -> {data}`)
        } else {
            const datumPath = this.datumType.path

            const ir = $(
                `(data) -> {${datumPath}____to_data(${datumPath}__from_data(data))}`
            )

            return this.wrapEntryPoint(ctx, ir)
        }
    }
}
