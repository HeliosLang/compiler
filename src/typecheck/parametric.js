import { expectSome } from "@helios-lang/type-utils"
import {
    Common,
    DataEntity,
    FuncEntity,
    FuncType,
    GenericType,
    GenericEnumMemberType,
    TypedEntity
} from "./common.js"
import { BoolType, ByteArrayType, RawDataType } from "./primitives.js"
import { CompilerError, TokenSite } from "@helios-lang/compiler-utils"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("@helios-lang/uplc").UplcData} UplcData
 * @typedef {import("./common.js").TypeDetails} TypeDetails
 * @typedef {import("./common.js").GenericTypeProps} GenericTypeProps
 * @typedef {import("./common.js").GenericEnumMemberTypeProps} GenericEnumMemberTypeProps
 * @typedef {import("./common.js").EnumMemberType} EnumMemberType
 * @typedef {import("./common.js").ParameterI} ParameterI
 * @typedef {import("./common.js").InferenceMap} InferenceMap
 * @typedef {import("./common.js").DataType} DataType
 * @typedef {import("./common.js").Func} Func
 * @typedef {import("./common.js").EvalEntity} EvalEntity
 * @typedef {import("./common.js").Named} Named
 * @typedef {import("./common.js").Parametric} Parametric
 * @typedef {import("./common.js").Type} Type
 * @typedef {import("./common.js").Typed} Typed
 * @typedef {import("./common.js").TypeClass} TypeClass
 * @typedef {import("./common.js").InstanceMembers} InstanceMembers
 * @typedef {import("./common.js").TypeMembers} TypeMembers
 * @typedef {import("./common.js").TypeClassMembers} TypeClassMembers
 */

/**
 * Created by statements
 * @implements {DataType}
 */
export class GenericParametricType extends GenericType {
    /**
     *
     * @param {GenericTypeProps} props
     */
    constructor(props) {
        super(props)
    }

    /**
     * @param {Site} site
     * @param {InferenceMap} map
     * @param {null | Type} type
     * @returns {Type}
     */
    infer(site, map, type) {
        if (type) {
            return this
        } else {
            let isMaybeParametric = false
            map.forEach((v) => {
                if (v.isParametric()) {
                    isMaybeParametric = true
                }
            })

            const props = this.applyInternal(site, map)

            return isMaybeParametric
                ? new GenericParametricType(props)
                : new GenericType(props)
        }
    }
}

/**
 * Created by statements
 * @implements {EnumMemberType}
 * @extends {GenericEnumMemberType}
 */
export class GenericParametricEnumMemberType extends GenericEnumMemberType {
    /**
     *
     * @param {GenericEnumMemberTypeProps} props
     */
    constructor(props) {
        super(props)
    }

    /**
     * @param {Site} site
     * @param {InferenceMap} map
     * @param {null | Type} type
     * @returns {Type}
     */
    infer(site, map, type) {
        if (type) {
            return this
        } else {
            let isMaybeParametric = false
            map.forEach((v) => {
                if (v.isParametric()) {
                    isMaybeParametric = true
                }
            })

            const props = {
                ...this.applyInternal(site, map),
                parentType: expectSome(
                    this.parentType.infer(site, map, null).asDataType
                ),
                constrIndex: this.constrIndex
            }

            return isMaybeParametric
                ? new GenericParametricEnumMemberType(props)
                : new GenericEnumMemberType(props)
        }
    }
}

/**
 * @implements {Type}
 */
export class TypeClassImpl extends Common {
    /**
     * @type {string}
     */
    #name

    /**
     * @type {null | ParameterI}
     */
    #parameter

    /**
     * @type {InstanceMembers}
     */
    #instanceMembers

    /**
     * @type {TypeMembers}
     */
    #typeMembers

    /**
     * @param {TypeClass} typeClass
     * @param {string} name
     * @param {null | ParameterI} parameter - reference to original parameter, which is more unique than name
     */
    constructor(typeClass, name, parameter) {
        super()
        this.#name = name
        this.#parameter = parameter
        this.#instanceMembers = typeClass.genInstanceMembers(this)
        this.#typeMembers = typeClass.genTypeMembers(this)
    }

    /**
     * @returns {boolean}
     */
    isParametric() {
        return true
    }

    /**
     * @type {InstanceMembers}
     */
    get instanceMembers() {
        return this.#instanceMembers
    }

    /**
     * @type {string}
     */
    get name() {
        return this.#name
    }

    /**
     * @type {TypeMembers}
     */
    get typeMembers() {
        return this.#typeMembers
    }

    /**
     * @type {Type}
     */
    get asType() {
        return this
    }

    /**
     * @internal
     * @param {Site} site
     * @param {InferenceMap} map
     * @param {null | Type} type
     * @returns {Type}
     */
    infer(site, map, type) {
        const p = expectSome(
            this.#parameter,
            "unable to infer dummy TypeClass instantiation"
        )

        const prev = map.get(p)

        if (!prev) {
            if (type) {
                map.set(p, type)

                return type
            } else {
                // type not yet available: could be parametric func inside a parametric type
                return this
            }
        } else {
            return prev
        }
    }

    /**
     * Returns 'true' if 'this' is a base-type of 'type'. Throws an error if 'this' isn't a Type.
     * @param {Type} type
     * @returns {boolean}
     */
    isBaseOf(type) {
        if (type instanceof TypeClassImpl) {
            // we cans simply use name because name-shadowing isn't allowed
            return type.name == this.name
        } else {
            return false
        }
    }

    /**
     * @returns {string}
     */
    toString() {
        return this.name
    }

    /**
     * @returns {Typed}
     */
    toTyped() {
        return new TypedEntity(this)
    }
}

/**
 * @implements {DataType}
 */
export class DataTypeClassImpl extends TypeClassImpl {
    /**
     * @type {string}
     */
    #path

    /**
     * @param {TypeClass} typeClass
     * @param {string} name
     * @param {string} path
     * @param {null | ParameterI} parameter
     */
    constructor(typeClass, name, path, parameter) {
        super(typeClass, name, parameter)

        this.#path = path
    }

    /**
     * @type {DataType}
     */
    get asDataType() {
        return this
    }

    /**
     * @type {Named}
     */
    get asNamed() {
        return this
    }

    /**
     * @type {string[]}
     */
    get fieldNames() {
        return []
    }

    /**
     * @type {string}
     */
    get path() {
        return this.#path
    }

    /**
     * @returns {Typed}
     */
    toTyped() {
        return new DataEntity(this)
    }
}

/**
 * @implements {TypeClass}
 */
export class AnyTypeClass extends Common {
    constructor() {
        super()
    }

    /**
     * @type {TypeClass}
     */
    get asTypeClass() {
        return this
    }

    /**
     * @param {Type} impl
     * @returns {TypeClassMembers}
     */
    genInstanceMembers(impl) {
        return {}
    }

    /**
     * @param {Type} impl
     * @returns {TypeClassMembers}
     */
    genTypeMembers(impl) {
        return {}
    }

    /**
     * @param {Type} type
     * @returns {boolean}
     */
    isImplementedBy(type) {
        return true
    }

    /**
     * @returns {string}
     */
    toString() {
        return "Any"
    }

    /**
     * @param {string} name
     * @param {string} path
     * @param {null | ParameterI} parameter
     * @returns {Type}
     */
    toType(name, path, parameter = null) {
        return new TypeClassImpl(this, name, parameter)
    }
}

/**
 * @implements {TypeClass}
 */
export class DefaultTypeClass extends Common {
    constructor() {
        super()
    }

    /**
     * @type {TypeClass}
     */
    get asTypeClass() {
        return this
    }

    /**
     * @param {Type} impl
     * @returns {TypeClassMembers}
     */
    genTypeMembers(impl) {
        return {
            __eq: new FuncType([impl, impl], BoolType),
            __neq: new FuncType([impl, impl], BoolType),
            __to_data: new FuncType([impl], RawDataType),
            from_data: new FuncType([RawDataType], impl)
        }
    }

    /**
     * @param {Type} impl
     * @returns {TypeClassMembers}
     */
    genInstanceMembers(impl) {
        return {
            serialize: new FuncType([], ByteArrayType)
        }
    }

    /**
     * @param {Type} type
     * @returns {boolean}
     */
    isImplementedBy(type) {
        return Common.typeImplements(type, this)
    }

    /**
     * @returns {string}
     */
    toString() {
        return ""
    }

    /**
     * @param {string} name
     * @param {string} path
     * @param {null | ParameterI} parameter
     * @returns {DataType}
     */
    toType(name, path, parameter = null) {
        return new DataTypeClassImpl(this, name, path, parameter)
    }
}

/**
 * @implements {TypeClass}
 */
export class SummableTypeClass extends Common {
    constructor() {
        super()
    }

    /**
     * @type {TypeClass}
     */
    get asTypeClass() {
        return this
    }

    /**
     * @param {Type} impl
     * @returns {TypeClassMembers}
     */
    genTypeMembers(impl) {
        return {
            __add: new FuncType([impl, impl], impl),
            __sub: new FuncType([impl, impl], impl)
        }
    }

    /**
     * @param {Type} impl
     * @returns {TypeClassMembers}
     */
    genInstanceMembers(impl) {
        return {}
    }

    /**
     * @param {Type} type
     * @returns {boolean}
     */
    isImplementedBy(type) {
        return Common.typeImplements(type, this)
    }

    /**
     * @returns {string}
     */
    toString() {
        return "Summable"
    }

    /**
     * @param {string} name
     * @param {string} path
     * @param {null | ParameterI} parameter
     * @returns {DataType}
     */
    toType(name, path, parameter = null) {
        return new DataTypeClassImpl(this, name, path, parameter)
    }
}

/**
 * @implements {ParameterI}
 */
export class Parameter {
    /**
     * @type {string}
     */
    #name

    /**
     * @type {string}
     */
    #path

    /**
     * @type {TypeClass}
     */
    #typeClass

    /**
     * @param {string} name - typically "a" or "b"
     * @param {string} path - typicall "__T0" or "__F0"
     * @param {TypeClass} typeClass
     */
    constructor(name, path, typeClass) {
        this.#name = name
        this.#path = path
        this.#typeClass = typeClass
    }

    /**
     * @type {string}
     */
    get name() {
        return this.#name
    }

    /**
     * @type {Type}
     */
    get ref() {
        return this.#typeClass.toType(this.#name, this.#path, this)
    }

    /**
     * A null TypeClass matches any type
     * @type {TypeClass}
     */
    get typeClass() {
        return this.#typeClass
    }

    /**
     * @returns {string}
     */
    toString() {
        if (this.#typeClass && this.#typeClass.toString() != "") {
            return `${this.#name}: ${this.#typeClass.toString()}`
        } else {
            return this.#name
        }
    }
}

/**
 * Only func instances can be parametrics instances,
 *  there are no other kinds of parametric instances
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

/**
 * @implements {DataType}
 */
class AppliedType extends Common {
    #types
    #apply
    #inner

    /**
     * @param {Type[]} types
     * @param {(types: Type[]) => DataType} apply
     * @param {DataType} inner
     */
    constructor(types, apply, inner) {
        super()

        this.#types = types
        this.#apply = apply
        this.#inner = inner
    }

    /**
     * @type {string[]}
     */
    get fieldNames() {
        return this.#inner.fieldNames
    }

    /**
     * @type {InstanceMembers}
     */
    get instanceMembers() {
        return this.#inner.instanceMembers
    }

    /**
     * @type {string}
     */
    get name() {
        return this.#inner.name
    }

    /**
     * @type {string}
     */
    get path() {
        return this.#inner.path
    }

    /**
     * @type {TypeMembers}
     */
    get typeMembers() {
        return this.#inner.typeMembers
    }

    /**
     * @type {TypeDetails | undefined}
     */
    get typeDetails() {
        return this.#inner.typeDetails
    }

    /**
     * @type {DataType}
     */
    get asDataType() {
        return this
    }

    /**
     * @type {Named}
     */
    get asNamed() {
        return this
    }

    /**
     * @type {Type}
     */
    get asType() {
        return this
    }

    /**
     * @param {Site} site
     * @param {InferenceMap} map
     * @param {null | Type} type
     * @returns {Type}
     */
    infer(site, map, type) {
        if (!type) {
            const infered = this.#types.map((t) => t.infer(site, map, null))

            return new AppliedType(infered, this.#apply, this.#apply(infered))
        } else if (
            type instanceof AppliedType &&
            type.#types.length == this.#types.length
        ) {
            const infered = this.#types.map((t, i) =>
                t.infer(site, map, type.#types[i])
            )

            const res = new AppliedType(
                infered,
                this.#apply,
                this.#apply(infered)
            )

            if (!res.isBaseOf(type)) {
                throw CompilerError.type(site, "unable to infer type")
            }

            return res
        } else {
            throw CompilerError.type(site, "unable to infer type")
        }
    }

    /**
     * @param {Type} other
     * @returns {boolean}
     */
    isBaseOf(other) {
        return this.#inner.isBaseOf(other)
    }

    /**
     * @returns {string}
     */
    toString() {
        return this.#inner.toString()
    }

    /**
     * @returns {Typed}
     */
    toTyped() {
        return new DataEntity(this)
    }
}

/**
 * @implements {Parametric}
 */
export class ParametricType extends Common {
    #name
    #parameters
    #apply

    /**
     * @param {{
     * 	 name: string,
     *   parameters: Parameter[]
     *   apply: (types: Type[]) => DataType
     * }} props
     */
    constructor({ name, parameters, apply }) {
        super()
        this.#name = name
        this.#parameters = parameters
        this.#apply = apply
    }

    /**
     * @type {Parametric}
     */
    get asParametric() {
        return this
    }

    /**
     * @type {TypeClass[]}
     */
    get typeClasses() {
        return this.#parameters.map((p) => p.typeClass)
    }

    /**
     * @param {Type[]} types
     * @param {Site} site
     * @returns {EvalEntity}
     */
    apply(types, site = TokenSite.dummy()) {
        if (types.length != this.#parameters.length) {
            throw CompilerError.type(
                site,
                `expected ${this.#parameters.length} type parameter(s), got ${types.length}`
            )
        }

        this.#parameters.forEach((p, i) => {
            if (!p.typeClass.isImplementedBy(types[i])) {
                throw CompilerError.type(
                    site,
                    `${types[i].toString()} doesn't implement ${p.typeClass.toString()}`
                )
            }
        })

        // TODO: recursive problem, defer the implementation check
        return new AppliedType(types, this.#apply, this.#apply(types))
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
        throw CompilerError.type(site, "not a parametric function")
    }

    /**
     * @param {Site} site
     * @param {InferenceMap} map
     * @returns {Parametric}
     */
    infer(site, map) {
        throw CompilerError.type(site, "not a parametric function")
    }

    /**
     * @returns {string}
     */
    toString() {
        return `${this.#name}` //[${this.#parameters.map(p => p.toString())}]`;
    }
}
