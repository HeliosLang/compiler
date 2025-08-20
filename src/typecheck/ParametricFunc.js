import { makeDummySite, makeTypeError } from "@helios-lang/compiler-utils"
import { AllType, Common, FuncEntity, FuncType } from "./common.js"
import { Parameter } from "./Parameter.js"

/**
 * @import { Site } from "@helios-lang/compiler-utils"
 * @import { TypeCheckContext } from "../index.js"
 * @typedef {import("./common.js").InferenceMap} InferenceMap
 * @typedef {import("./common.js").Func} Func
 * @typedef {import("./common.js").EvalEntity} EvalEntity
 * @typedef {import("./common.js").Parametric} Parametric
 * @typedef {import("./common.js").Type} Type
 * @typedef {import("./common.js").Typed} Typed
 * @typedef {import("./common.js").TypeClass} TypeClass
 */

/**
 * Func instances can be parametrics instances
 * @implements {Parametric}
 */
export class ParametricFunc extends Common {
    /**
     * @private
     * @readonly
     * @type {Parameter[]}
     */
    _params

    /**
     * @private
     * @readonly
     * @type {FuncType}
     */
    _fnType

    /**
     * @param {Parameter[]} params
     * @param {FuncType} fnType
     */
    constructor(params, fnType) {
        super()
        this._params = params
        this._fnType = fnType
    }

    get params() {
        return this._params
    }

    get fnType() {
        return this._fnType
    }

    /**
     * null TypeClasses aren't included
     * @type {TypeClass[]}
     */
    get typeClasses() {
        return this._params.map((p) => p.typeClass)
    }

    /**
     * @param {TypeCheckContext} ctx
     * @param {Type[]} types
     * @param {Site} site
     * @returns {EvalEntity | undefined}
     */
    apply(ctx, types, site = makeDummySite()) {
        if (types.length != this._params.length) {
            ctx.errors.type(site, "wrong number of parameter type arguments")

            return undefined
        }

        /**
         * @type {InferenceMap}
         */
        const map = new Map()

        this._params.forEach((p, i) => {
            if (!p.typeClass.isImplementedBy(types[i])) {
                ctx.errors.type(site, "typeclass match failed")
            }

            map.set(p, types[i])
        })

        const inferred = this._fnType.infer(ctx, site, map, null)

        if (inferred instanceof FuncType) {
            return new FuncEntity(inferred)
        } else {
            throw new Error("unexpected")
        }
    }

    /**
     * @type {Parametric}
     */
    get asParametric() {
        return this
    }

    /**
     * Must infer before calling
     * @param {TypeCheckContext} ctx
     * @param {Site} site
     * @param {Typed[]} args
     * @param {{[name: string]: Typed}} namedArgs
     * @param {Type[]} paramTypes - so that paramTypes can be accessed by caller
     * @returns {Func}
     */
    inferCall(ctx, site, args, namedArgs = {}, paramTypes = []) {
        /**
         * @type {InferenceMap}
         */
        const map = new Map()

        const fnType = this._fnType.inferArgs(
            ctx,
            site,
            map,
            args.map((a) => a.type)
        )

        // make sure that each parameter is defined in the map
        this._params.forEach((p) => {
            let pt = map.get(p)

            if (!pt) {
                ctx.errors.type(
                    site,
                    `failed to infer type of '${p.name}'  (hint: apply directly using [...])`
                )
                pt = new AllType()
            }

            paramTypes.push(pt)
        })

        return new FuncEntity(fnType)
    }

    /**
     * @param {TypeCheckContext} ctx
     * @param {Site} site
     * @param {InferenceMap} map
     * @returns {Parametric}
     */
    infer(ctx, site, map) {
        const fnType = this._fnType.infer(ctx, site, map, null)

        if (fnType instanceof FuncType) {
            return new ParametricFunc(this._params, fnType)
        } else {
            throw new Error("unexpected")
        }
    }

    /**
     * @returns {string}
     */
    toString() {
        return `[${this._params.map((p) => p.toString()).join(", ")}]${this._fnType.toString()}`
    }
}
