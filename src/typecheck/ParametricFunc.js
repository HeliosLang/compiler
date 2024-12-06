import { makeDummySite, makeTypeError } from "@helios-lang/compiler-utils"
import { Common, FuncEntity, FuncType } from "./common.js"
import { Parameter } from "./Parameter.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
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
     * @param {Type[]} types
     * @param {Site} site
     * @returns {EvalEntity}
     */
    apply(types, site = makeDummySite()) {
        if (types.length != this._params.length) {
            throw makeTypeError(
                site,
                "wrong number of parameter type arguments"
            )
        }

        /**
         * @type {InferenceMap}
         */
        const map = new Map()

        this._params.forEach((p, i) => {
            if (!p.typeClass.isImplementedBy(types[i])) {
                throw makeTypeError(site, "typeclass match failed")
            }

            map.set(p, types[i])
        })

        const inferred = this._fnType.infer(site, map, null)

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
     * @param {Site} site
     * @param {Typed[]} args
     * @param {{[name: string]: Typed}} namedArgs
     * @param {Type[]} paramTypes - so that paramTypes can be accessed by caller
     * @returns {Func}
     */
    inferCall(site, args, namedArgs = {}, paramTypes = []) {
        /**
         * @type {InferenceMap}
         */
        const map = new Map()

        const fnType = this._fnType.inferArgs(
            site,
            map,
            args.map((a) => a.type)
        )

        // make sure that each parameter is defined in the map
        this._params.forEach((p) => {
            const pt = map.get(p)

            if (!pt) {
                throw makeTypeError(
                    site,
                    `failed to infer type of '${p.name}'  (hint: apply directly using [...])`
                )
            }

            paramTypes.push(pt)
        })

        return new FuncEntity(fnType)
    }

    /**
     * @param {Site} site
     * @param {InferenceMap} map
     * @returns {Parametric}
     */
    infer(site, map) {
        const fnType = this._fnType.infer(site, map, null)

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
