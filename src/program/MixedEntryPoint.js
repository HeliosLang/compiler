import { makeTypeError } from "@helios-lang/compiler-utils"
import { $ } from "@helios-lang/ir"
import { TAB, ToIRContext } from "../codegen/index.js"
import { GlobalScope } from "../scopes/index.js"
import { BoolType, MixedArgsType, VoidType } from "../typecheck/index.js"
import { EntryPointImpl } from "./EntryPoint.js"
import { ModuleCollection } from "./ModuleCollection.js"

/**
 * @import { SourceMappedStringI } from "@helios-lang/ir"
 * @import { Definitions, TypeCheckContext } from "../index.js"
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
     * @param {TypeCheckContext} ctx
     * @param {ScriptTypes} scriptTypes
     */
    evalTypes(ctx, scriptTypes) {
        const scope = GlobalScope.new({ scriptTypes, currentScript: this.name })

        super.evalTypesInternal(ctx, scope)

        const main = this.mainFunc
        const argTypeNames = main.argTypeNames
        const argTypes = main.argTypes
        const retType = main.retType
        const nArgs = argTypes.length

        if (nArgs != 1) {
            ctx.errors.type(
                main.site,
                `expected 1 arg for a ${this.purpose} validator`
            )
        }

        if (argTypeNames[0] != "" && !MixedArgsType.isBaseOf(argTypes[0])) {
            ctx.errors.type(
                main.site,
                `illegal argument type in main: '${argTypes[0].toString()}`
            )
        }

        if (!BoolType.isBaseOf(retType) && !new VoidType().isBaseOf(retType)) {
            ctx.errors.type(
                main.site,
                `illegal return type for main, expected 'Bool' or '()', got '${retType.toString()}'`
            )
        }
    }

    /**
     * @param {ToIRContext} ctx
     * @param {Definitions | undefined} extra
     * @returns {SourceMappedStringI}
     */
    toIR(ctx, extra = undefined) {
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
        let ir = $([$(`${this.mainPath}(__MIXED)`)])

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
