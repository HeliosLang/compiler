import { expectSome } from "@helios-lang/type-utils"
import { FTPP, ParametricName, TTPP } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import {
    FuncType,
    GenericType,
    Parameter,
    ParametricFunc,
    ParametricType
} from "../typecheck/index.js"
import { TypeParameter } from "./TypeParameter.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("../typecheck/index.js").DataType} DataType
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 * @typedef {import("../typecheck/index.js").InferenceMap} InferenceMap
 */

export class TypeParameters {
    /**
     * @private
     * @readonly
     * @type {TypeParameter[]}
     */
    _parameterExprs

    /**
     * @private
     * @readonly
     * @type {string}
     */
    _prefix

    /**
     * @private
     * @type {null | Parameter[]}
     */
    _parameters

    /**
     * @param {TypeParameter[]} parameterExprs
     * @param {boolean} isForFunc
     */
    constructor(parameterExprs, isForFunc) {
        this._parameterExprs = parameterExprs
        this._prefix = isForFunc ? FTPP : TTPP
        this._parameters = null
    }

    /**
     * @returns {boolean}
     */
    hasParameters() {
        return this._parameterExprs.length > 0
    }

    /**
     * @type {string[]}
     */
    get parameterNames() {
        return this._parameterExprs.map((pe) => pe.name)
    }

    /**
     * @returns {Parameter[]}
     */
    getParameters() {
        return expectSome(this._parameters, "parameters not yet evaluated")
    }

    /**
     * Always include the braces, even if there aren't any type parameters, so that the mutual recursion injection function has an easier time figuring out what can depend on what
     * @param {string} base
     * @returns {string}
     */
    genTypePath(base) {
        return `${base}[${this._parameterExprs.map((_, i) => `${this._prefix}${i}`).join("@")}]`
    }

    /**
     * Always include the braces, even if there aren't any type parameters, so that the mutual recursion injection function has an easier time figuring out what can depend on what
     * @param {string} base
     * @returns {string}
     */
    genFuncPath(base) {
        if (this.hasParameters()) {
            return this.genTypePath(base)
        } else {
            return base
        }
    }

    /**
     * @returns {string}
     */
    toString() {
        if (!this.hasParameters()) {
            return ""
        } else {
            return `[${this._parameterExprs.map((p) => p.toString()).join(", ")}]`
        }
    }

    /**
     * @param {Scope} scope
     * @returns {Scope}
     */
    evalParams(scope) {
        const subScope = new Scope(scope)

        this._parameters = []

        this._parameterExprs.forEach((pe, i) => {
            const p = pe.eval(subScope, `${this._prefix}${i}`)

            if (p) {
                this._parameters?.push(p)
            }
        })

        return subScope
    }

    /**
     * @param {Scope} scope
     * @param {(scope: Scope) => (FuncType)} evalConcrete
     * @returns {ParametricFunc | FuncType}
     */
    evalParametricFuncType(scope, evalConcrete, impl = null) {
        const typeScope = this.evalParams(scope)

        const type = evalConcrete(typeScope)

        typeScope.assertAllUsed()

        return this.hasParameters()
            ? new ParametricFunc(this.getParameters(), type)
            : type
    }

    /**
     * @param {Scope} scope
     * @param {(scope: Scope) => (FuncType)} evalConcrete
     * @returns {EvalEntity}
     */
    evalParametricFunc(scope, evalConcrete) {
        const type = this.evalParametricFuncType(scope, evalConcrete)

        if (type.asType) {
            return type.asType.toTyped()
        } else {
            return type
        }
    }

    /**
     * @param {Scope} scope
     * @param {Site} site
     * @param {(scope: Scope) => DataType} evalConcrete
     * @returns {[DataType | ParametricType, Scope]}
     */
    createParametricType(scope, site, evalConcrete) {
        const typeScope = this.evalParams(scope)

        const type = evalConcrete(new Scope(typeScope))

        if (!this.hasParameters()) {
            return [type, typeScope]
        } else {
            const paramType = new ParametricType({
                name: type.name,
                parameters: this.getParameters(),
                apply: (paramTypes) => {
                    /**
                     * @type {InferenceMap}
                     */
                    const map = new Map()

                    paramTypes.forEach((pt, i) => {
                        const p = this.getParameters()[i]

                        map.set(p, pt)
                    })

                    const appliedType = expectSome(
                        type.infer(site, map, null).asDataType
                    )

                    const appliedPath = ParametricName.parse(type.path, true)
                        .toImplementation(
                            paramTypes.map(
                                (pt) => expectSome(pt.asDataType).path
                            )
                        )
                        .toString()

                    if (appliedType instanceof GenericType) {
                        return appliedType.changeNameAndPath(
                            `${type.name}[${paramTypes.map((pt) => pt.toString()).join(",")}]`,
                            appliedPath
                        )
                    } else {
                        throw new Error("unexpected")
                    }
                }
            })

            return [paramType, typeScope]
        }
    }
}
