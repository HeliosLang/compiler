import { makeTypeError } from "@helios-lang/compiler-utils"
import { $ } from "@helios-lang/ir"
import { expectDefined } from "@helios-lang/type-utils"
import { ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import {
    FuncType,
    IntType,
    ParametricFunc,
    RealType,
    getTupleItemTypes
} from "../typecheck/index.js"
import { CallArgExpr } from "./CallArgExpr.js"
import { Expr } from "./Expr.js"
import { MemberExpr } from "./MemberExpr.js"
import { ParametricExpr } from "./ParametricExpr.js"
import { PathExpr } from "./PathExpr.js"

/**
 * @import { Site } from "@helios-lang/compiler-utils"
 * @typedef {import("@helios-lang/ir").SourceMappedStringI} SourceMappedStringI
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 * @typedef {import("../typecheck/index.js").Func} Func
 * @typedef {import("../typecheck/index.js").Type} Type
 * @typedef {import("../typecheck/index.js").Typed} Typed
 */

/**
 * ...(...) expression
 */
export class CallExpr extends Expr {
    /**
     * @private
     * @readonly
     * @type {Expr}
     */
    _fnExpr

    /**
     * @private
     * @readonly
     * @type {CallArgExpr[]}
     */
    _argExprs

    /**
     * @private
     * @type {Type[]}
     */
    _paramTypes

    /**
     * @private
     * @type {Func | undefined}
     */
    _appliedFnVal

    /**
     * @private
     * @type {Typed[]}
     */
    posArgVals

    /**
     * @private
     * @type {Record<string, Typed>}
     */
    namedArgVals

    /**
     * @private
     * @type {Typed[]}
     */
    castedPosArgVals

    /**
     * @private
     * @type {Record<string, Typed>}
     */
    castedNamedArgVals

    /**
     * @param {Site} site
     * @param {Expr} fnExpr
     * @param {CallArgExpr[]} argExprs
     */
    constructor(site, fnExpr, argExprs) {
        super(site)
        this._fnExpr = fnExpr
        this._argExprs = argExprs
        this._paramTypes = []
        this._appliedFnVal = undefined // only for infered parametric funcions
        this.posArgVals = []
        this.namedArgVals = {}
    }

    get fnExpr() {
        return this._fnExpr
    }

    toString() {
        return `${this._fnExpr.toString()}(${this._argExprs.map((a) => a.toString()).join(", ")})`
    }

    /**
     * @returns {boolean}
     */
    isLiteral() {
        if (
            this._fnExpr instanceof PathExpr &&
            this.cache?.asTyped &&
            this._fnExpr.baseExpr.cache?.asType?.isBaseOf(
                this.cache.asTyped.type
            )
        ) {
            return true
        } else {
            return false
        }
    }

    /**
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    evalInternal(scope) {
        const fnVal = this._fnExpr.eval(scope)

        const argVals = this._argExprs.map((ae, i) => {
            const av_ = ae.eval(scope)

            const av = av_.asTyped

            if (!av) {
                throw makeTypeError(ae.site, `arg ${i + 1} not an instance`)
            }

            return av
        })

        this.posArgVals = []

        this._argExprs.forEach((argExpr, i) => {
            if (!argExpr.isNamed()) {
                this.posArgVals.push(argVals[i])
            }
        })

        this.namedArgVals = {}

        this._argExprs.forEach((argExpr, i) => {
            if (argExpr.isNamed()) {
                const val = argVals[i]

                if (val.asTyped) {
                    this.namedArgVals[argExpr.name] = val.asTyped
                } else {
                    throw new Error("unexpected")
                }
            }
        })

        if (this.posArgVals.some((pav) => pav == undefined)) {
            throw new Error("unexpected")
        }

        // might be mutated for implicit casting, so take a copy
        this.castedPosArgVals = this.posArgVals.slice()
        this.castedNamedArgVals = { ...this.namedArgVals }

        if (fnVal.asParametric) {
            this._paramTypes = []

            this._appliedFnVal = fnVal.asParametric.inferCall(
                this.site,
                this.castedPosArgVals,
                this.castedNamedArgVals,
                this._paramTypes
            )

            return this._appliedFnVal.call(
                this.site,
                this.castedPosArgVals,
                this.castedNamedArgVals,
                viableCasts
            )
        } else if (fnVal.asFunc) {
            return fnVal.asFunc.call(
                this.site,
                this.castedPosArgVals,
                this.castedNamedArgVals,
                viableCasts
            )
        } else {
            throw makeTypeError(
                this._fnExpr.site,

                `unable to call ${fnVal.toString()} (returned by ${this._fnExpr.toString()})`
            )
        }
    }

    /**
     * Don't call this inside eval() because param types won't yet be complete.
     * @type {FuncType}
     */
    get fn() {
        const ft = !!this._fnExpr.cache?.asParametric
            ? this._appliedFnVal?.type?.asType
            : this._fnExpr.cache?.asTyped?.type.asType

        if (ft instanceof FuncType) {
            return ft
        } else {
            throw new Error("unexpected")
        }
    }

    /**
     * @private
     * @param {Type} argType
     * @param {Type} targetType
     * @param {SourceMappedStringI} argIR
     * @param {ToIRContext} ctx
     * @returns {SourceMappedStringI}
     */
    injectCastIR(argType, targetType, argIR, ctx) {
        if (IntType.isBaseOf(argType) && RealType.isBaseOf(targetType)) {
            return $`__helios__int__to_real(${argIR})()`
        } else {
            throw new Error("unhandled cast")
        }
    }

    /**
     * @private
     * @param {number | Expr} e
     * @param {ToIRContext} ctx
     * @returns {SourceMappedStringI}
     */
    argExprToIR(e, ctx) {
        const i =
            typeof e == "number"
                ? e
                : this._argExprs.findIndex((ae) => ae.valueExpr == e)

        const ae = this._argExprs[i]
        const expr = ae.valueExpr

        let ir = expr.toIR(ctx)

        if (ae.isNamed()) {
            if (
                this.namedArgVals[ae.name] != this.castedNamedArgVals[ae.name]
            ) {
                ir = this.injectCastIR(
                    this.namedArgVals[ae.name].type,
                    this.castedNamedArgVals[ae.name].type,
                    ir,
                    ctx
                )
            } else {
            }
        } else {
            if (this.posArgVals[i] != this.castedPosArgVals[i]) {
                ir = this.injectCastIR(
                    this.posArgVals[i].type,
                    this.castedPosArgVals[i].type,
                    ir,
                    ctx
                )
            }
        }

        return ir
    }

    /**
     * @param {ToIRContext} ctx
     * @returns {[Expr[], SourceMappedStringI[]]} - first list are positional args, second list named args and remaining opt args
     */
    expandArgs(ctx) {
        const fn = this.fn
        const nNonOptArgs = fn.nNonOptArgs

        /**
         * @type {Expr[]}
         */
        const positional = []

        this._argExprs.forEach((ae) => {
            if (!ae.isNamed()) {
                positional.push(ae.valueExpr)
            }
        })

        /**
         * @type {SourceMappedStringI[]}
         */
        const namedOptional = []

        this._argExprs.forEach((ae, i) => {
            if (ae.isNamed()) {
                // i is the index in this call, j is the index in function being called (named args can be in a completely different order)
                const j = fn.getNamedIndex(ae.site, ae.name)

                if (j < nNonOptArgs) {
                    positional[j] = ae.valueExpr
                } else {
                    namedOptional[j - nNonOptArgs] = $([
                        $("true"),
                        $(", "),
                        this.argExprToIR(i, ctx)
                    ])
                }
            }
        })

        for (let i = nNonOptArgs; i < fn.nArgs; i++) {
            if (namedOptional[i - nNonOptArgs] == undefined) {
                namedOptional[i - nNonOptArgs] = $([
                    $("false"),
                    $(", "),
                    $("()")
                ])
            }
        }

        return [positional.filter((p) => p != undefined), namedOptional]
    }

    /**
     * @param {ToIRContext} ctx
     * @returns {SourceMappedStringI}
     */
    toFnExprIR(ctx) {
        if (this._fnExpr.cache?.asParametric instanceof ParametricFunc) {
            if (this._paramTypes.length == 0) {
                throw new Error("unexpected")
            }

            const params = ParametricExpr.toApplicationIR(this._paramTypes)

            if (this._fnExpr instanceof MemberExpr) {
                return this._fnExpr.toIR(ctx, params)
            } else {
                return $(
                    `${this._fnExpr.toIR(ctx).toString()}${params}`,
                    this._fnExpr.site
                )
            }
        } else {
            return this._fnExpr.toIR(ctx)
        }
    }

    /**
     * @private
     * @param {Expr[]} posExprs
     * @returns {Map<Expr, number>}
     */
    detectExpandedTuples(posExprs) {
        /**
         * @type {Map<Expr, number>}
         */
        const result = new Map()

        let somePosArgsNull = false
        /**
         * @type {Typed[]}
         */
        const posArgs = []
        posExprs.forEach((e) => {
            const pa = e.cache?.asTyped

            if (!pa) {
                somePosArgsNull = true
            } else {
                posArgs.push(pa)
            }
        })

        if (somePosArgsNull) {
            posExprs.forEach((e) => {
                result.set(e, 0)
            })

            return result
        }

        const expandedPosArgs = this.fn.expandTuplesInPosArgs(posArgs)

        let j = 0

        for (let i = 0; i < posArgs.length; i++) {
            if (j >= expandedPosArgs.length) {
                throw new Error("unexpected")
            }

            if (posArgs[i] == expandedPosArgs[j]) {
                result.set(posExprs[i], 0)
                j++
            } else {
                const tupleItemTypes = getTupleItemTypes(posArgs[i].type)
                if (!tupleItemTypes) {
                    throw new Error("unexpected")
                }

                result.set(posExprs[i], tupleItemTypes.length)
                j += tupleItemTypes.length
            }
        }

        return result
    }

    /**
     * @param {ToIRContext} ctx
     * @returns {SourceMappedStringI}
     */
    toIR(ctx) {
        let fnIR = this.toFnExprIR(ctx)

        /**
         * We need the func type for things like multivalued args and optional args
         * @type {FuncType}
         */
        const fn = this.fn

        /**
         * First step is to eliminate the named args
         * @type {[Expr[], SourceMappedStringI[]]}
         */
        const [posExprs, namedOptExprs] = this.expandArgs(ctx)

        // some multiValued args (always positional)
        const isExpandedTuple = this.detectExpandedTuples(posExprs)

        if (posExprs.some((e) => (isExpandedTuple.get(e) ?? 0) > 0)) {
            // count the number of final args
            let n = 0

            posExprs.forEach((e, i) => {
                if ((isExpandedTuple.get(e) ?? 0) > 0) {
                    n += expectDefined(isExpandedTuple.get(e))
                } else {
                    n += 1
                }
            })

            n += namedOptExprs.length

            if (n > fn.nArgs) {
                namedOptExprs.splice(0, n - fn.nArgs)
            }

            let names = []

            for (let i = 0; i < fn.nArgs; i++) {
                if (i >= fn.nNonOptArgs) {
                    names.push(`__useopt__x${i}`)
                }

                names.push(`x${i}`)
            }

            let ir = $([
                fnIR,
                $("("),
                $(names.map((n) => $(n))).join(", "),
                $(")", this.site)
            ])

            for (let namedIR of namedOptExprs.slice().reverse()) {
                const n2 = expectDefined(names.pop())
                const n1 = expectDefined(names.pop())
                if (!n1.startsWith("__useopt__")) {
                    throw new Error("unexpected")
                }

                ir = $([
                    $("("),
                    $(n1),
                    $(", "),
                    $(n2),
                    $(") -> {"),
                    ir,
                    $("}("),
                    expectDefined(namedIR), // bool - val pair
                    $(")")
                ])
            }

            for (let i = posExprs.length - 1; i >= 0; i--) {
                const e = posExprs[i]

                if ((isExpandedTuple.get(e) ?? 0) > 0) {
                    const nMulti = expectDefined(isExpandedTuple.get(e))
                    const multiNames = []
                    const multiOpt = []

                    while (multiNames.length < nMulti) {
                        multiNames.unshift(expectDefined(names.pop()))

                        if (
                            names.length > 0 &&
                            names[names.length - 1] ==
                                `__useopt__${multiNames[0]}`
                        ) {
                            multiOpt.unshift(expectDefined(names.pop()))
                        }
                    }

                    if (multiOpt.length > 0) {
                        ir = $([
                            $("("),
                            $(multiOpt.map((n) => $(n))).join(", "),
                            $(") -> {"),
                            ir,
                            $("}("),
                            $(multiOpt.map((n) => $("true"))).join(", "),
                            $(")")
                        ])
                    }

                    ir = $([
                        this.argExprToIR(e, ctx),
                        $("(("),
                        $(multiNames.map((n) => $(n))).join(", "),
                        $(") -> {"),
                        ir,
                        $("})")
                    ])
                } else {
                    const name = expectDefined(names.pop())

                    if (
                        names.length > 0 &&
                        names[names.length - 1] == `__useopt__${name}`
                    ) {
                        ir = $([
                            $("("),
                            $(expectDefined(names.pop())),
                            $(") -> {"),
                            $("}(true)")
                        ])
                    }

                    ir = $([
                        $("("),
                        $(name),
                        $(") -> {"),
                        ir,
                        $("}("),
                        this.argExprToIR(e, ctx),
                        $(")")
                    ])
                }
            }

            return ir
        } /* no multivalued args */ else {
            if (posExprs.length + namedOptExprs.length > fn.nArgs) {
                namedOptExprs.splice(
                    0,
                    posExprs.length + namedOptExprs.length - fn.nArgs
                )
            }

            let args = posExprs
                .map((a, i) => {
                    let ir = this.argExprToIR(a, ctx)

                    if (i >= fn.nNonOptArgs) {
                        ir = $([$("true, "), ir])
                    }

                    return ir
                })
                .concat(namedOptExprs)

            return $([fnIR, $("(", this.site), $(args).join(", "), $(")")])
        }
    }
}

/**
 * @param {Type} argType
 * @param {Type} targetType
 * @returns {Type | undefined}
 */
function viableCasts(argType, targetType) {
    if (IntType.isBaseOf(argType) && RealType.isBaseOf(targetType)) {
        return targetType
    } else {
        return undefined
    }
}
