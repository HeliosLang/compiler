import { CompilerError } from "@helios-lang/compiler-utils"
import {
    $,
    DEFAULT_PARSE_OPTIONS,
    SourceMappedString,
    compile
} from "@helios-lang/ir"
import { UplcProgramV2 } from "@helios-lang/uplc"
import { TAB, ToIRContext } from "../codegen/index.js"
import { GlobalScope, TopScope } from "../scopes/index.js"
import {
    BoolType,
    DefaultTypeClass,
    ScriptContextType
} from "../typecheck/index.js"
import { Program } from "./Program.js"
import { Module } from "./Module.js"

/**
 * @typedef {import("../typecheck/index.js").DataType} DataType
 * @typedef {import("../typecheck/index.js").ScriptTypes} ScriptTypes
 * @typedef {import("./Program.js").ProgramConfig} ProgramConfig
 */

/**
 * Used by CLI
 * @internal
 */
export class DatumRedeemerProgram extends Program {
    /**
     * @param {string} purpose
     * @param {Module[]} modules
     * @param {ProgramConfig} config
     */
    constructor(purpose, modules, config) {
        super(purpose, modules, config)
    }

    /**
     * @type {number}
     */
    get nPosParams() {
        return this.mainFunc.nArgs - (this.config.invertEntryPoint ? 0 : 3)
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
        const nArgs = main.nArgs

        if (this.config.allowPosParams) {
            if (argTypes.length < 3) {
                throw CompilerError.type(
                    main.site,
                    "expected at least 3 args for main"
                )
                return topScope
            }
        } else {
            if (argTypes.length != 3) {
                throw CompilerError.type(main.site, "expected 3 args for main")
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
                        `illegal type for arg ${nArgs} in main: expected 'ScriptContext', got '${argTypes[i].toString()}'`
                    )
                }
            } else {
                if (
                    argTypeNames[i] != "" &&
                    !new DefaultTypeClass().isImplementedBy(argTypes[i])
                ) {
                    throw CompilerError.type(
                        main.site,
                        `illegal type for arg ${i + 1} in main ${i == nArgs - 2 ? "(datum) " : i == nArgs - 3 ? "(redeemer) " : ""}: '${argTypes[i].toString()}`
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
     * @internal
     * @param {ScriptTypes} scriptTypes
     * @returns {TopScope}
     */
    evalTypes(scriptTypes) {
        const scope = GlobalScope.new(scriptTypes)

        return this.evalTypesInternal(scope)
    }

    /**
     * @param {ToIRContext} ctx
     * @returns {SourceMappedString}
     */
    toIRInternal(ctx) {
        const outerArgNames = this.config.invertEntryPoint
            ? []
            : ["datum", "redeemer", "ctx"]
        const nOuterArgs = outerArgNames.length

        const nArgs = this.mainFunc.nArgs
        const argTypeNames = this.mainFunc.argTypeNames

        const innerArgs = this.mainArgTypes.map((t, i) => {
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
     * @internal
     * @param {ToIRContext} ctx
     * @returns {SourceMappedString}
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

    /**
     * Used by cli
     * @internal
     * @returns {UplcProgramV2}
     */
    compileDatumCheck() {
        const ir = this.datumCheckToIR(
            new ToIRContext(false, this.config.isTestnet)
        )

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
     * @returns {string}
     */
    toString() {
        return `${this.purpose} ${this.name}\n${super.toString()}`
    }
}
