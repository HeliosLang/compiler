import { makeDummySite, makeTypeError } from "@helios-lang/compiler-utils"
import { AllType, Common, DataEntity } from "./common.js"
import { Parameter } from "./Parameter.js"

/**
 * @import { Site } from "@helios-lang/compiler-utils"
 * @import { TypeCheckContext } from "../index.js"
 * @typedef {import("./common.js").InferenceMap} InferenceMap
 * @typedef {import("./common.js").DataType} DataType
 * @typedef {import("./common.js").Func} Func
 * @typedef {import("./common.js").EvalEntity} EvalEntity
 * @typedef {import("./common.js").Parametric} Parametric
 * @typedef {import("./common.js").Type} Type
 * @typedef {import("./common.js").Typed} Typed
 * @typedef {import("./common.js").TypeClass} TypeClass
 */

/**
 * Data instances can be parametrics instances
 * @implements {Parametric}
 */
export class ParametricData extends Common {
    /**
     * @private
     * @readonly
     * @type {Parameter[]}
     */
    _params

    /**
     * @private
     * @readonly
     * @type {Type}
     */
    _dataType

    /**
     * @param {Parameter[]} params
     * @param {Type} dataType
     */
    constructor(params, dataType) {
        super()
        this._params = params
        this._dataType = dataType
    }

    get params() {
        return this._params
    }

    get dataType() {
        return this._dataType
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
     * @returns {EvalEntity}
     */
    apply(ctx, types, site = makeDummySite()) {
        if (types.length != this._params.length) {
            ctx.errors.type(site, "wrong number of parameter type arguments")
            return new DataEntity(new AllType())
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

        const inferred = this._dataType.infer(ctx, site, map, null)

        if (inferred.asDataType) {
            return new DataEntity(inferred.asDataType)
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
     * @returns {Func | undefined}
     */
    inferCall(ctx, site, args, namedArgs = {}, paramTypes = []) {
        ctx.errors.type(site, "uncallable")

        return undefined
    }

    /**
     * @param {TypeCheckContext} ctx
     * @param {Site} site
     * @param {InferenceMap} map
     * @returns {Parametric}
     */
    infer(ctx, site, map) {
        const dataType = this._dataType.infer(ctx, site, map, null)

        if (dataType.asDataType) {
            return new ParametricData(this._params, dataType.asDataType)
        } else {
            throw new Error("unexpected")
        }
    }

    /**
     * @returns {string}
     */
    toString() {
        return `[${this._params.map((p) => p.toString()).join(", ")}]${this._dataType.toString()}`
    }
}
