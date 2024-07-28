import { CompilerError, TokenSite } from "@helios-lang/compiler-utils"
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
    #params
    #fnType

    /**
     * @param {Parameter[]} params
     * @param {FuncType} fnType
     */
    constructor(params, fnType) {
        super()
        this.#params = params
        this.#fnType = fnType
    }

    get params() {
        return this.#params
    }

    get fnType() {
        return this.#fnType
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

        const inferred = this.#fnType.infer(site, map, null)

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

        const fnType = this.#fnType.inferArgs(
            site,
            map,
            args.map((a) => a.type)
        )

        // make sure that each parameter is defined in the map
        this.#params.forEach((p) => {
            const pt = map.get(p)

            if (!pt) {
                throw CompilerError.type(
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
        const fnType = this.#fnType.infer(site, map, null)

        if (fnType instanceof FuncType) {
            return new ParametricFunc(this.#params, fnType)
        } else {
            throw new Error("unexpected")
        }
    }

    /**
     * @returns {string}
     */
    toString() {
        return `[${this.#params.map((p) => p.toString()).join(", ")}]${this.#fnType.toString()}`
    }
}
