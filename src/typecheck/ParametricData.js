import { CompilerError, TokenSite } from "@helios-lang/compiler-utils"
import { Common, DataEntity } from "./common.js"
import { Parameter } from "./Parameter.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
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
    #params
    #dataType

    /**
     * @param {Parameter[]} params
     * @param {Type} dataType
     */
    constructor(params, dataType) {
        super()
        this.#params = params
        this.#dataType = dataType
    }

    get params() {
        return this.#params
    }

    get dataType() {
        return this.#dataType
    }

    /**
     * null TypeClasses aren't included
     * @type {TypeClass[]}
     */
    get typeClasses() {
        return this.#params.map((p) => p.typeClass)
    }

    /**
     * @param {Type[]} types
     * @param {Site} site
     * @returns {EvalEntity}
     */
    apply(types, site = TokenSite.dummy()) {
        if (types.length != this.#params.length) {
            throw CompilerError.type(
                site,
                "wrong number of parameter type arguments"
            )
        }

        /**
         * @type {InferenceMap}
         */
        const map = new Map()

        this.#params.forEach((p, i) => {
            if (!p.typeClass.isImplementedBy(types[i])) {
                throw CompilerError.type(site, "typeclass match failed")
            }

            map.set(p, types[i])
        })

        const inferred = this.#dataType.infer(site, map, null)

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
     * @param {Site} site
     * @param {Typed[]} args
     * @param {{[name: string]: Typed}} namedArgs
     * @param {Type[]} paramTypes - so that paramTypes can be accessed by caller
     * @returns {Func}
     */
    inferCall(site, args, namedArgs = {}, paramTypes = []) {
        throw CompilerError.type(site, "uncallable")
    }

    /**
     * @param {Site} site
     * @param {InferenceMap} map
     * @returns {Parametric}
     */
    infer(site, map) {
        const dataType = this.#dataType.infer(site, map, null)

        if (dataType.asDataType) {
            return new ParametricData(this.#params, dataType.asDataType)
        } else {
            throw new Error("unexpected")
        }
    }

    /**
     * @returns {string}
     */
    toString() {
        return `[${this.#params.map((p) => p.toString()).join(", ")}]${this.#dataType.toString()}`
    }
}
