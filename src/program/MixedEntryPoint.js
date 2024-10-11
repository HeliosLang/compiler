import { CompilerError } from "@helios-lang/compiler-utils"
import { $ } from "@helios-lang/ir"
import { None } from "@helios-lang/type-utils"
import { TAB, ToIRContext } from "../codegen/index.js"
import { GlobalScope } from "../scopes/index.js"
import { BoolType, MixedArgsType } from "../typecheck/index.js"
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
export class MixedEntryPoint extends EntryPointImpl {
    /**
     * @param {ModuleCollection} modules
     */
    constructor(modules) {
        super(modules)
    }

    get purpose() {
        return "mixed"
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

        const main = this.mainFunc
        const argTypeNames = main.argTypeNames
        const argTypes = main.argTypes
        const retType = main.retType
        const nArgs = argTypes.length

        if (nArgs != 1) {
            throw CompilerError.type(main.site, "expected 1 arg for main")
        }

        if (argTypeNames[0] != "" && !MixedArgsType.isBaseOf(argTypes[0])) {
            throw CompilerError.type(
                main.site,
                `illegal argument type in main: '${argTypes[0].toString()}`
            )
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

        ir = $`(__DATUM_OR_REDEEMER, __REDEEMER_OR_CONTEXT) -> {
    main = (__MIXED, __CONTEXT) -> {
        ${ir}
    };
    tag = __core__fstPair(__core__unConstrData(__REDEEMER_OR_CONTEXT));
    __core__ifThenElse(
        __core__equalsInteger(tag, 0),
        () -> {
            // other (no datum)
            mixed = __core__constrData(
                0,
                __core__mkCons(
                    __core__headList(__core__sndPair(__core__unConstrData(__DATUM_OR_REDEEMER))),
                    __core__mkNilData(())
                )
            );
            main(mixed, __REDEEMER_OR_CONTEXT)
        },
        () -> {
            mixed = __core__constrData(
                1, 
                __core__mkCons(
                    __DATUM_OR_REDEEMER, 
                    __core__mkCons(
                        __core__headList(__core__sndPair(__core__unConstrData(__REDEEMER_OR_CONTEXT))),
                        __core__mkNilData(())
                    )
                )
            );
            // spending
            (__CONTEXT) -> {
                main(mixed, __CONTEXT)
            }
        }
    )()
}`

        return ir
    }

    /**
     * @returns {string}
     */
    toString() {
        return `mixed ${this.name}\n${super.toString()}`
    }

    /**
     * @protected
     * @param {ToIRContext} ctx
     * @returns {SourceMappedStringI}
     */
    toIRInternal(ctx) {
        let ir = $([
            $(`${TAB}${TAB}__core__ifThenElse`),
            $("(", this.mainRetExprSite),
            $(`\n${TAB}${TAB}${TAB}${this.mainPath}(__MIXED`),
            $(
                `),\n${TAB}${TAB}${TAB}() -> {()},\n${TAB}${TAB}${TAB}() -> {__helios__error("validation returned false")}\n${TAB}${TAB})`
            ),
            $("(", this.mainRetExprSite),
            $(")")
        ])

        return ir
    }
}
