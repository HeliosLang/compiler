import { CompilerError, Word } from "@helios-lang/compiler-utils"
import { expectSome, isSome, None } from "@helios-lang/type-utils"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("@helios-lang/type-utils").FieldTypeSchema} FieldTypeSchema
 * @typedef {import("@helios-lang/type-utils").TypeSchema} TypeSchema
 * @typedef {import("@helios-lang/type-utils").VariantTypeSchema} VariantTypeSchema
 * @typedef {import("@helios-lang/uplc").UplcData} UplcData
 */

/**
 * @typedef {(argType: Type, targetType: Type) => Option<Type>} ViableCasts
 */

/**
 * @typedef {(type: Type) => Option<Type[]>} ExpandTupleCallback
 */

/**
 * @type {Option<ExpandTupleCallback>}
 */
var expandTupleType

/**
 * @param {ExpandTupleCallback} callback
 */
export function registerExpandTupleType(callback) {
    expandTupleType = callback
}

/**
 * @typedef {(type: Type) => DataType} MakeListCallback
 */

/**
 * @type {Option<MakeListCallback>}
 */
export var makeListType

/**
 * @param {MakeListCallback} callback
 */
export function registerMakeListType(callback) {
    makeListType = callback
}

/**
 * @typedef {(keyType: Type, valueType: Type) => DataType} MakeMapCallback
 */

/**
 * @type {Option<MakeMapCallback>}
 */
export var makeMapType

/**
 * @param {MakeMapCallback} callback
 */
export function registerMakeMapType(callback) {
    makeMapType = callback
}

/**
 * @typedef {{
 *   name: string
 *   typeClass: TypeClass
 * }} ParameterI
 */

/**
 * @typedef {Map<ParameterI, Type>} InferenceMap
 */

/**
 * @typedef {Named & Type & {
 *   asDataType:   DataType
 *   fieldNames:   string[]
 *   toSchema(parents?: Set<string>):  TypeSchema
 *   ready:        boolean
 * }} DataType
 */

/**
 * @typedef {DataType & {
 *   asEnumMemberType: EnumMemberType
 *   constrIndex:      number
 *   parentType:       DataType
 * }} EnumMemberType
 */

/**
 * EvalEntities assert themselves
 * @typedef {{
 *   asDataType:       (null | DataType)
 *   asEnumMemberType: (null | EnumMemberType)
 *   asFunc:           (null | Func)
 *   asInstance:       (null | Instance)
 *   asNamed:          (null | Named)
 *   asNamespace:      (null | Namespace)
 *   asParametric:     (null | Parametric)
 * 	 asType:           (null | Type)
 *   asTyped:          (null | Typed)
 *   asTypeClass:      (null | TypeClass)
 *   toString():       string
 * }} EvalEntity
 */

/**
 * @typedef {Typed & {
 *   asFunc: Func
 * 	 funcType: FuncType
 *   call(site: Site, args: Typed[], namedArgs?: {[name: string]: Typed}, viableCasts?: ViableCasts): Typed
 * }} Func
 */

/**
 * @typedef {Typed & {
 *   asInstance:      Instance
 *   fieldNames:      string[]
 *   instanceMembers: InstanceMembers
 * }} Instance
 */

/**
 * @typedef {EvalEntity & {
 *   asNamed: Named
 *   name:    string
 *   path:    string
 * }} Named
 */

/**
 * @typedef {EvalEntity & {
 *   asNamespace: Namespace
 *   namespaceMembers: NamespaceMembers
 * }} Namespace
 */

/**
 * @typedef {EvalEntity & {
 *   asParametric: Parametric
 *   typeClasses: TypeClass[]
 *   apply(types: Type[], site?: Site): EvalEntity
 *   inferCall(site: Site, args: Typed[], namedArgs?: {[name: string]: Typed}, paramTypes?: Type[]): Func
 * 	 infer(site: Site, map: InferenceMap): Parametric
 * }} Parametric
 */

/**
 * @typedef {EvalEntity & {
 *   asType:               Type
 *   instanceMembers:      InstanceMembers
 *   typeMembers:          TypeMembers
 *   isBaseOf(type: Type): boolean
 *   infer(site: Site, map: InferenceMap, type: null | Type): Type
 *   toTyped():            Typed
 *   isParametric():       boolean
 * }} Type
 */

/**
 * @typedef {EvalEntity & {
 *   asTyped: Typed
 *   type: Type
 * }} Typed
 */

/**
 * @typedef {EvalEntity & {
 *   asTypeClass:                        TypeClass
 *   genInstanceMembers(impl: Type):     TypeClassMembers
 *   genTypeMembers(impl: Type):         TypeClassMembers
 *   isImplementedBy(type: Type):        boolean
 *   toType(name: string, path: string, parameter?: null | ParameterI): Type
 * }} TypeClass
 */

/**
 * @typedef {{[name: string]: (Parametric | Type)}} InstanceMembers
 */

/**
 * @typedef {{[name: string]: EvalEntity}} NamespaceMembers
 */

/**
 * @typedef {{[name: string]: (Parametric | Type | Typed)}} TypeMembers
 */

/**
 * @typedef {{[name: string]: Type}} TypeClassMembers
 */

/**
 * @param {Parametric} parametric
 * @param {Type[]} types
 * @returns {DataType}
 */
export function applyTypes(parametric, ...types) {
    return expectSome(parametric.apply(types).asDataType)
}

export class Common {
    constructor() {}

    /**
     * @returns {boolean}
     */
    isParametric() {
        return false
    }

    /**
     * @param {Typed} i
     * @param {Type} t
     * @returns {boolean}
     */
    static instanceOf(i, t) {
        return t.isBaseOf(i.type)
    }

    /**
     * Compares two types. Throws an error if neither is a Type.
     * @example
     * Common.typesEq(IntType, IntType) == true
     * @param {Type} a
     * @param {Type} b
     * @returns {boolean}
     */
    static typesEq(a, b) {
        return a.isBaseOf(b) && b.isBaseOf(a)
    }

    /**
     * @param {Type} type
     */
    static isEnum(type) {
        return Object.values(type.typeMembers).some((v) => v.asEnumMemberType)
    }

    /**
     * @param {Type} type
     */
    static countEnumMembers(type) {
        return Object.values(type.typeMembers).reduce(
            (prev, v) => (v.asEnumMemberType ? prev + 1 : prev),
            0
        )
    }

    /**
     * @param {TypeClass} tc
     * @returns {string[]}
     */
    static typeClassMembers(tc) {
        const dummy = tc.toType("", "")

        const typeMemberNames = Object.keys(tc.genTypeMembers(dummy)).sort()
        const instanceMemberNames = Object.keys(
            tc.genInstanceMembers(dummy)
        ).sort()

        return typeMemberNames.concat(instanceMemberNames)
    }

    /**
     * @param {Type} type
     * @param {TypeClass} tc
     * @returns {boolean}
     */
    static typeImplements(type, tc) {
        if (type instanceof AllType || type.asDataType?.ready === false) {
            return true
        }

        const typeMembers = tc.genTypeMembers(type)

        for (let k in typeMembers) {
            const check = type.typeMembers[k]?.asType

            if ((check && !typeMembers[k].asType?.isBaseOf(check)) || !check) {
                return false
            }
        }

        const instanceMembers = tc.genInstanceMembers(type)

        for (let k in instanceMembers) {
            const check = type.instanceMembers[k]?.asType

            if (
                (check && !instanceMembers[k].asType?.isBaseOf(check)) ||
                !check
            ) {
                return false
            }
        }

        return true
    }

    /**
     * @type {null | DataType}
     */
    get asDataType() {
        return null
    }

    /**
     * @type {null | EnumMemberType}
     */
    get asEnumMemberType() {
        return null
    }

    /**
     * @type {null | Func}
     */
    get asFunc() {
        return null
    }

    /**
     * @type {null | Instance}
     */
    get asInstance() {
        return null
    }

    /**
     * @type {null | Named}
     */
    get asNamed() {
        return null
    }

    /**
     * @type {null | Namespace}
     */
    get asNamespace() {
        return null
    }

    /**
     * @type {null | Parametric}
     */
    get asParametric() {
        return null
    }

    /**
     * @type {null | Type}
     */
    get asType() {
        return null
    }

    /**
     * @type {null | Typed}
     */
    get asTyped() {
        return this.asInstance ?? this.asFunc
    }

    /**
     * @type {null | TypeClass}
     */
    get asTypeClass() {
        return null
    }

    /**
     * @type {boolean}
     */
    get ready() {
        return true
    }

    /**
     * @returns {string}
     */
    toString() {
        throw new Error("not yet implemented")
    }
}

/**
 * Used to represent all possible types whenever a TypeExpr throws an error (so type evaluation can continue in order to collect all type errors at once)
 * @implements {DataType}
 */
export class AllType extends Common {
    constructor() {
        super()
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
     * @type {string[]}
     */
    get fieldNames() {
        return []
    }

    /**
     * @type {InstanceMembers}
     */
    get instanceMembers() {
        return {}
    }

    /**
     * @type {string}
     */
    get name() {
        return ""
    }

    /**
     * @type {string}
     */
    get path() {
        return ""
    }

    /**
     * @type {TypeMembers}
     */
    get typeMembers() {
        return {}
    }

    /**
     * @returns {TypeSchema}
     */
    toSchema() {
        return {
            kind: "internal",
            name: "Data"
        }
    }

    /**
     * @param {Site} site
     * @param {InferenceMap} map
     * @param {null | Type} type
     * @returns {Type}
     */
    infer(site, map, type) {
        return this
    }

    /**
     * @param {Type} other
     * @returns {boolean}
     */
    isBaseOf(other) {
        return true
    }

    /**
     * @returns {Typed}
     */
    toTyped() {
        throw new Error("can't be turned into a type")
    }

    /**
     * @returns {string}
     */
    toString() {
        return "All"
    }
}

/**
 * Untyped expressions result in AnyType
 * @implements {DataType}
 */
export class AnyType extends Common {
    constructor() {
        super()
    }

    get fieldNames() {
        return []
    }

    /**
     * @type {string}
     */
    get name() {
        return "Any"
    }

    /**
     * @type {string}
     */
    get path() {
        return ""
    }

    /**
     * @type {Type}
     */
    get asType() {
        return this
    }

    /**
     * @type {Named}
     */
    get asNamed() {
        return this
    }

    /**
     * @type {DataType}
     */
    get asDataType() {
        return this
    }

    /**
     * @type {InstanceMembers}
     */
    get instanceMembers() {
        return {}
    }

    /**
     * @type {TypeMembers}
     */
    get typeMembers() {
        return {}
    }

    /**
     * @returns {TypeSchema}
     */
    toSchema() {
        return {
            kind: "internal",
            name: "Any"
        }
    }

    /**
     * @param {Site} site
     * @param {InferenceMap} map
     * @param {null | Type} type
     * @returns {Type}
     */
    infer(site, map, type) {
        return this
    }

    /**
     * @param {Type} other
     * @returns {boolean}
     */
    isBaseOf(other) {
        return true
    }

    /**
     * @returns {Typed}
     */
    toTyped() {
        throw new Error("can't be turned into a type")
    }

    /**
     * @returns {string}
     */
    toString() {
        return "Any"
    }
}

/**
 * Type of special case of no-return value where execution can't continue.
 * @internal
 * @implements {Type}
 */
export class ErrorType extends Common {
    constructor() {
        super()
    }

    /**
     * @type {InstanceMembers}
     */
    get instanceMembers() {
        return {}
    }

    /**
     * @type {TypeMembers}
     */
    get typeMembers() {
        return {}
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
        return this
    }

    /**
     * @param {Type} type
     * @returns {boolean}
     */
    isBaseOf(type) {
        return type instanceof ErrorType
    }

    /**
     * @returns {string}
     */
    toString() {
        return "()"
    }

    /**
     * @returns {Typed}
     */
    toTyped() {
        return new ErrorEntity()
    }
}

/**
 * @internal
 */
export class ArgType {
    #name
    #type
    #optional

    /**
     *
     * @param {Option<Word>} name
     * @param {Type} type
     * @param {boolean} optional
     */
    constructor(name, type, optional = false) {
        this.#name = name
        this.#type = type
        this.#optional = optional
    }

    /**
     * @type {string}
     */
    get name() {
        if (!this.#name) {
            return ""
        } else {
            return this.#name.toString()
        }
    }

    /**
     * @type {Type}
     */
    get type() {
        return this.#type
    }

    /**
     * @internal
     * @param {Site} site
     * @param {InferenceMap} map
     * @param {null | Type} type
     * @returns {ArgType}
     */
    infer(site, map, type) {
        return new ArgType(
            this.#name,
            this.#type.infer(site, map, type),
            this.#optional
        )
    }

    /**
     * @param {ArgType} other
     * @returns {boolean}
     */
    isBaseOf(other) {
        // if this arg has a default value, the other arg must also have a default value
        if (this.#optional && !other.#optional) {
            return false
        }

        // if this is named, the other must be named as well
        if (this.#name != null) {
            return this.#name.toString() == (other.#name?.toString() ?? "")
        }

        if (!other.#type.isBaseOf(this.#type)) {
            // note the reversal of the check
            return false
        }

        return true
    }

    /**
     * @returns {boolean}
     */
    isNamed() {
        return isSome(this.#name)
    }

    /**
     * @returns {boolean}
     */
    isOptional() {
        return this.#optional
    }

    /**
     * @returns {string}
     */
    toString() {
        return [
            this.#name != null ? `${this.#name.toString()}: ` : "",
            this.#optional ? "?" : "",
            this.#type.toString()
        ].join("")
    }
}

/**
 * Function type with arg types and a return type
 * @implements {Type}
 */
export class FuncType extends Common {
    /**
     * @readonly
     * @type {ArgType[]}
     */
    origArgTypes

    /**
     * @type {Type}
     */
    #retType

    /**
     * @param {Type[] | ArgType[]} argTypes
     * @param {Type} retType
     */
    constructor(argTypes, retType) {
        super()

        this.origArgTypes = argTypes.map((at) =>
            at instanceof ArgType ? at : new ArgType(null, at)
        )

        this.#retType = retType
    }

    /**
     * @type {Type[]}
     */
    get argTypes() {
        return this.origArgTypes.slice().map((at) => at.type)
    }

    /**
     * @type {InstanceMembers}
     */
    get instanceMembers() {
        return {}
    }

    /**
     * @type {number}
     */
    get nArgs() {
        return this.origArgTypes.length
    }

    /**
     * @type {number}
     */
    get nNonOptArgs() {
        return this.origArgTypes.filter((at) => !at.isOptional()).length
    }

    /**
     * @type {number}
     */
    get nOptArgs() {
        return this.origArgTypes.filter((at) => at.isOptional()).length
    }

    /**
     * @type {Type}
     */
    get retType() {
        return this.#retType
    }

    /**
     * @type {TypeMembers}
     */
    get typeMembers() {
        return {}
    }

    /**
     * @type {Type}
     */
    get asType() {
        return this
    }

    /**
     * Expand tuples in posArgs, if that matches argTypes better
     * @param {Typed[]} posArgs
     * @returns {Typed[]}
     */
    expandTuplesInPosArgs(posArgs) {
        posArgs = posArgs.slice()
        let arg = posArgs.shift()

        /**
         * @type {Typed[]}
         */
        let result = []

        let i = 0

        while (arg) {
            if (
                i < this.origArgTypes.length &&
                Common.instanceOf(arg, this.origArgTypes[i].type)
            ) {
                result.push(arg)
                i++
            } else {
                if (!expandTupleType) {
                    throw new Error("unexpected")
                }

                const tupleItemTypes = expandTupleType(arg.type)

                if (
                    tupleItemTypes &&
                    tupleItemTypes.every(
                        (tit, j) =>
                            i + j < this.origArgTypes.length &&
                            Common.instanceOf(
                                tit.toTyped(),
                                this.origArgTypes[i + j].type
                            )
                    )
                ) {
                    result = result.concat(
                        tupleItemTypes.map((tit) => tit.toTyped())
                    )
                    i += tupleItemTypes.length
                } else {
                    // mismatched type, but don't throw error here because better error will be thrown later
                    result.push(arg)
                    i++
                }
            }

            arg = posArgs.shift()
        }

        return result
    }

    /**
     * Checks if arg types are valid.
     * Throws errors if not valid. Returns the return type if valid.
     * posArgs and namedArgs are mutated if implicit casting is viable
     * @param {Site} site
     * @param {Typed[]} origPosArgs - pos args with tuples, expanded internally
     * @param {{[name: string]: Typed}} namedArgs
     * @param {Option<(argType: Type, targetType: Type) => Option<Type>>} viableCasts
     * @returns {Type}
     */
    checkCall(site, origPosArgs, namedArgs = {}, viableCasts = None) {
        const posArgs = this.expandTuplesInPosArgs(origPosArgs)

        if (posArgs.length < this.nNonOptArgs) {
            // check if each nonOptArg is covered by the named args
            for (let i = 0; i < this.nNonOptArgs; i++) {
                if (!this.origArgTypes[i].isNamed()) {
                    // TODO: collect instead of throwing
                    throw CompilerError.type(
                        site,
                        `expected at least ${this.origArgTypes.filter((at) => !at.isNamed()).length} positional arg(s), got ${posArgs.length} positional arg(s)`
                    )
                } else if (!(this.origArgTypes[i].name in namedArgs)) {
                    // TODO: collect instead of throwing
                    throw CompilerError.type(
                        site,
                        `expected at least ${this.nNonOptArgs} arg(s), missing '${this.origArgTypes[i].name}'`
                    )
                }
            }
        } else if (posArgs.length > this.origArgTypes.length) {
            throw CompilerError.type(
                site,
                `expected at most ${this.origArgTypes.length} arg(s), got ${posArgs.length} arg(s)`
            )
        }

        for (let i = 0; i < posArgs.length; i++) {
            const posArg = posArgs[i]
            const origIndex = origPosArgs.findIndex(
                (origPosArg) => origPosArg == posArg
            )
            const expectedArgType = this.origArgTypes[i].type

            if (!Common.instanceOf(posArg, expectedArgType)) {
                // only apply these casts if not in tuples
                const altType =
                    origIndex != -1 && viableCasts
                        ? viableCasts(posArg.type, expectedArgType)
                        : None

                if (altType) {
                    origPosArgs[origIndex] = altType.toTyped()
                } else {
                    throw CompilerError.type(
                        site,
                        `expected '${expectedArgType.toString()}' for arg ${i + 1}, got '${posArg.type.toString()}'`
                    )
                }
            }
        }

        for (let key in namedArgs) {
            const i = this.origArgTypes.findIndex((at) => at.name == key)

            if (i == -1) {
                throw CompilerError.type(
                    site,
                    `arg named ${key} not found in function type ${this.toString()}`
                )
            }

            if (i < posArgs.length) {
                throw CompilerError.type(
                    site,
                    `named arg '${key}' already covered by positional arg ${i + 1}`
                )
            }

            const thisArg = this.origArgTypes[i]

            const namedArg = namedArgs[key]

            if (!Common.instanceOf(namedArg, thisArg.type)) {
                const altType = viableCasts
                    ? viableCasts(namedArg.type, thisArg.type)
                    : None

                if (altType) {
                    // mutate the namedArgs object
                    namedArgs[key] = altType.toTyped()
                } else {
                    throw CompilerError.type(
                        site,
                        `expected '${thisArg.type.toString()}' for arg '${key}', got '${namedArg.toString()}`
                    )
                }
            }
        }

        return this.#retType
    }

    /**
     * @internal
     * @param {Site} site
     * @param {InferenceMap} map
     * @param {null | Type} type
     * @returns {Type}
     */
    infer(site, map, type) {
        if (!type) {
            return new FuncType(
                this.origArgTypes.map((at) => at.infer(site, map, null)),
                this.#retType.infer(site, map, null)
            )
        } else if (type instanceof FuncType) {
            if (type.argTypes.length == this.origArgTypes.length) {
                return new FuncType(
                    this.origArgTypes.map((at, i) =>
                        at.infer(site, map, type.argTypes[i])
                    ),
                    this.#retType.infer(site, map, type.retType)
                )
            }
        }

        throw CompilerError.type(
            site,
            `unable to infer type of ${this.toString()}`
        )
    }

    /**
     * @internal
     * @param {Site} site
     * @param {InferenceMap} map
     * @param {Type[]} argTypes
     * @returns {FuncType}
     */
    inferArgs(site, map, argTypes) {
        if (argTypes.length == this.argTypes.length) {
            return new FuncType(
                this.origArgTypes.map((at, i) =>
                    at.infer(site, map, argTypes[i])
                ),
                this.#retType.infer(site, map, null)
            )
        }

        throw CompilerError.type(
            site,
            `expected ${this.argTypes.length} arg(s), got ${argTypes.length}`
        )
    }

    /**
     * Checks if any of 'this' argTypes or retType is same as Type.
     * Only if this checks return true is the association allowed.
     * @param {Site} site
     * @param {Type} type
     * @returns {boolean}
     */
    isAssociated(site, type) {
        for (let arg of this.origArgTypes) {
            if (Common.typesEq(arg.type, type)) {
                return true
            }
        }

        if (Common.typesEq(type, this.#retType)) {
            return true
        }

        return false
    }

    /**
     * Checks if 'this' is a base type of another FuncType.
     * The number of args needs to be the same.
     * Each argType of the FuncType we are checking against needs to be the same or less specific (i.e. isBaseOf(this.#argTypes[i]))
     * The retType of 'this' needs to be the same or more specific
     * @param {Type} other
     * @returns {boolean}
     */
    isBaseOf(other) {
        if (other instanceof FuncType) {
            if (this.nNonOptArgs != other.nNonOptArgs) {
                return false
            } else {
                for (let i = 0; i < this.nNonOptArgs; i++) {
                    if (!this.origArgTypes[i].isBaseOf(other.origArgTypes[i])) {
                        return false
                    }
                }

                if (!this.#retType.isBaseOf(other.#retType)) {
                    return false
                }

                return true
            }
        } else {
            return false
        }
    }

    /**
     * Checks if the type of the first arg is the same as 'type'
     * Also returns false if there are no args.
     * For a method to be a valid instance member its first argument must also be named 'self', but that is checked elsewhere
     * @param {Site} site
     * @param {Type} type
     * @returns {boolean}
     */
    isMaybeMethod(site, type) {
        if (this.origArgTypes.length > 0) {
            return Common.typesEq(this.origArgTypes[0].type, type)
        } else {
            return false
        }
    }

    /**
     * @returns {string}
     */
    toString() {
        return `(${this.origArgTypes.map((a) => a.toString()).join(", ")}) -> ${this.#retType.toString()}`
    }

    /**
     * Throws an error if name isn't found
     * @param {Site} site
     * @param {string} name
     * @returns {number}
     */
    getNamedIndex(site, name) {
        const i = this.origArgTypes.findIndex((at) => at.name == name)

        if (i == -1) {
            throw CompilerError.type(site, `arg name ${name} not found`)
        } else {
            return i
        }
    }

    /**
     * @returns {Typed}
     */
    toTyped() {
        return new FuncEntity(this)
    }
}

/**
 * @typedef {{
 *   name: string
 *   path?: string
 *   fieldNames?: string[]
 *   genInstanceMembers: (self: Type) => InstanceMembers
 *   genTypeMembers: (self: Type) => TypeMembers
 *   genTypeSchema?: (self: Type, parents: Set<string>) => TypeSchema
 * }} GenericTypeProps
 */

/**
 * Created by statements
 * @implements {DataType}
 */
export class GenericType extends Common {
    #name

    /**
     * @type {string}
     */
    #path

    #fieldNames

    /**
     * defer until needed
     * @type {(self: Type) => InstanceMembers}
     */
    #genInstanceMembers

    /**
     * defer until needed
     * @type {(self: Type) => TypeMembers}
     */
    #genTypeMembers

    /**
     * @type {null | InstanceMembers}
     */
    #instanceMembers

    /**
     * @type {null | TypeMembers}
     */
    #typeMembers

    /**
     * @type {Option<(self: Type, parents: Set<string>) => TypeSchema>}
     */
    #genTypeSchema

    #genDepth

    /**
     * @param {GenericTypeProps} props
     */
    constructor({
        name,
        path,
        fieldNames,
        genInstanceMembers,
        genTypeMembers,
        genTypeSchema
    }) {
        super()

        this.#name = name
        this.#path = path ?? `__helios__${name.toLowerCase()}`
        this.#fieldNames = fieldNames ?? []

        this.#genInstanceMembers = genInstanceMembers
        this.#genTypeMembers = genTypeMembers
        this.#instanceMembers = null
        this.#typeMembers = null
        this.#genTypeSchema = genTypeSchema ?? null
        this.#genDepth = 0
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
     * @type {string[]}
     */
    get fieldNames() {
        return this.#fieldNames
    }

    /**
     * @type {InstanceMembers}
     */
    get instanceMembers() {
        if (!this.#instanceMembers) {
            this.#instanceMembers = this.#genInstanceMembers(this)
        }

        return this.#instanceMembers
    }

    /**
     * @type {string}
     */
    get name() {
        return this.#name
    }

    /**
     * @param {Set<string>} parents
     * @returns {TypeSchema}
     */
    toSchema(parents = new Set()) {
        if (this.#genTypeSchema) {
            return this.#genTypeSchema(this, parents)
        } else {
            throw new Error(`typeSchema not available for ${this.toString()}`)
        }
    }

    /**
     * @type {string}
     */
    get path() {
        return this.#path
    }

    /**
     * @type {boolean}
     */
    get ready() {
        return this.#genDepth < 2
    }

    /**
     * @type {TypeMembers}
     */
    get typeMembers() {
        if (!this.#typeMembers) {
            this.#genDepth += 1
            this.#typeMembers = this.#genTypeMembers(this)
            this.#genDepth -= 1
        }

        return this.#typeMembers
    }

    /**
     * @param {Site} site
     * @param {InferenceMap} map
     */
    applyInternal(site, map) {
        return {
            name: this.#name,
            path: this.#path,
            fieldNames: this.#fieldNames,
            genInstanceMembers: (self) => {
                /**
                 * @type {InstanceMembers}
                 */
                const instanceMembers = {}

                const oldInstanceMembers = this.#genInstanceMembers(self)

                for (let k in oldInstanceMembers) {
                    const v = oldInstanceMembers[k]

                    if (v.asParametric) {
                        instanceMembers[k] = v.asParametric.infer(site, map)
                    } else if (v.asType) {
                        instanceMembers[k] = v.asType.infer(site, map, null)
                    } else {
                        throw new Error("unhandled")
                    }
                }

                return instanceMembers
            },
            genTypeMembers: (self) => {
                /**
                 * @type {TypeMembers}
                 */
                const typeMembers = {}

                const oldTypeMembers = this.#genTypeMembers(self)

                for (let k in oldTypeMembers) {
                    const v = oldTypeMembers[k]

                    if (v.asParametric) {
                        typeMembers[k] = v.asParametric.infer(site, map)
                    } else if (v.asTyped) {
                        typeMembers[k] = v.asTyped.type
                            .infer(site, map, null)
                            .toTyped()
                    } else if (v.asType) {
                        typeMembers[k] = v.asType.infer(site, map, null)
                    } else {
                        throw new Error("unhandled")
                    }
                }

                return typeMembers
            }
        }
    }

    /**
     * @param {Site} site
     * @param {InferenceMap} map
     * @param {null | Type} type
     * @returns {Type}
     */
    infer(site, map, type) {
        return this
    }

    /**
     * @param {string} name
     * @param {string} path
     * @returns {GenericType}
     */
    changeNameAndPath(name, path) {
        return new GenericType({
            name: name,
            path: path,
            fieldNames: this.#fieldNames,
            genInstanceMembers: this.#genInstanceMembers,
            genTypeMembers: this.#genTypeMembers
        })
    }

    /**
     * @param {Type} other
     * @returns {boolean}
     */
    isBaseOf(other) {
        if (other.asEnumMemberType) {
            return this.isBaseOf(other.asEnumMemberType.parentType)
        } else if (other.asNamed) {
            return other.asNamed.path == this.#path
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
        return new DataEntity(this)
    }
}

/**
 * @typedef {{
 *   name: string,
 *   path?: string,
 *   constrIndex: number,
 *   parentType: DataType,
 *   fieldNames?: string[],
 *   genInstanceMembers: (self: Type) => InstanceMembers,
 *   genTypeMembers?: (self: Type) => TypeMembers
 *   genTypeSchema: (self: Type, parents: Set<string>) => TypeSchema
 * }} GenericEnumMemberTypeProps
 */

/**
 * Created by statements
 * @implements {EnumMemberType}
 * @extends {GenericType}
 */
export class GenericEnumMemberType extends GenericType {
    #constrIndex
    #parentType

    /**
     * @param {GenericEnumMemberTypeProps} props
     */
    constructor({
        name,
        path,
        constrIndex,
        parentType,
        fieldNames,
        genInstanceMembers,
        genTypeMembers,
        genTypeSchema
    }) {
        super({
            name,
            path: path ?? `${parentType.path}__${name.toLowerCase()}`,
            fieldNames,
            genInstanceMembers,
            genTypeMembers: genTypeMembers ?? ((self) => ({})),
            genTypeSchema: genTypeSchema
        })

        this.#constrIndex = constrIndex
        this.#parentType = parentType
    }

    /**
     * @type {number}
     */
    get constrIndex() {
        return this.#constrIndex
    }

    /**
     * @type {DataType}
     */
    get parentType() {
        return this.#parentType
    }

    /**
     * @type {EnumMemberType}
     */
    get asEnumMemberType() {
        return this
    }

    /**
     * @param {Site} site
     * @param {InferenceMap} map
     * @param {null | Type} type
     * @returns {Type}
     */
    infer(site, map, type) {
        return this
    }

    /**
     * @param {Type} other
     * @returns {boolean}
     */
    isBaseOf(other) {
        if (other instanceof GenericEnumMemberType) {
            return other.path == this.path
        } else {
            return false
        }
    }

    /**
     * @returns {string}
     */
    toString() {
        return `${this.#parentType.toString()}::${this.name}`
    }
}

/**
 * Type of return-value of functions that don't return anything (eg. assert, print, error)
 * @internal
 * @implements {Type}
 */
export class VoidType extends Common {
    constructor() {
        super()
    }

    /**
     * @type {InstanceMembers}
     */
    get instanceMembers() {
        return {}
    }

    /**
     * @type {TypeMembers}
     */
    get typeMembers() {
        return {}
    }

    /**
     * @type {Type}
     */
    get asType() {
        return this
    }

    /**
     *
     * @param {Site} site
     * @param {InferenceMap} map
     * @param {null | Type} type
     * @returns {Type}
     */
    infer(site, map, type) {
        return this
    }

    /**
     * @param {Type} type
     * @returns {boolean}
     */
    isBaseOf(type) {
        return type instanceof VoidType
    }

    /**
     * @returns {string}
     */
    toString() {
        return "()"
    }

    /**
     * @returns {Typed}
     */
    toTyped() {
        return new VoidEntity()
    }
}

/**
 * A regular non-Func Instance. DataValues can always be compared, serialized, used in containers.
 * @internal
 * @implements {Instance}
 */
export class DataEntity extends Common {
    #type

    /**
     * @param {DataType} type
     */
    constructor(type) {
        super()
        if (type instanceof FuncType) {
            throw new Error("unexpected")
        }

        this.#type = type
    }

    /**
     * @type {string[]}
     */
    get fieldNames() {
        return this.#type.fieldNames
    }

    /**
     * @type {InstanceMembers}
     */
    get instanceMembers() {
        return this.#type.instanceMembers
    }

    /**
     * @type {Type}
     */
    get type() {
        return this.#type
    }

    /**
     * @type {Instance}
     */
    get asInstance() {
        return this
    }

    /**
     * @type {Typed}
     */
    get asTyped() {
        return this
    }

    /**
     * @returns {string}
     */
    toString() {
        return this.#type.toString()
    }
}

/**
 * Returned by an error()
 * Special case of no-return-value that indicates that execution can't proceed.
 * @internal
 */
export class ErrorEntity extends Common {
    constructor() {
        super()
    }

    /**
     * @type {string[]}
     */
    get fieldNames() {
        return []
    }

    /**
     * @type {InstanceMembers}
     */
    get instanceMembers() {
        return {}
    }

    /**
     * @type {Type}
     */
    get type() {
        return new ErrorType()
    }

    /**
     * @type {Instance}
     */
    get asInstance() {
        return this
    }

    /**
     * @type {Typed}
     */
    get asTyped() {
        return this
    }

    /**
     * @returns {string}
     */
    toString() {
        return "()"
    }
}

/**
 * @internal
 * @implements {Named}
 */
export class NamedEntity {
    #name
    #path
    #entity

    /**
     * @param {string} name
     * @param {string} path
     * @param {EvalEntity} entity
     */
    constructor(name, path, entity) {
        this.#name = name
        this.#path = path
        this.#entity = entity
    }

    /**
     * @type {null | DataType}
     */
    get asDataType() {
        return this.#entity.asDataType
    }

    /**
     * @type {null | EnumMemberType}
     */
    get asEnumMemberType() {
        return this.#entity.asEnumMemberType
    }

    /**
     * @type {null | Func}
     */
    get asFunc() {
        return this.#entity.asFunc
    }

    /**
     * @type {null | Instance}
     */
    get asInstance() {
        return this.#entity.asInstance
    }

    /**
     * @type {Named}
     */
    get asNamed() {
        return this
    }

    /**
     * @type {null | Namespace}
     */
    get asNamespace() {
        return this.#entity.asNamespace
    }

    /**
     * @type {null | Parametric}
     */
    get asParametric() {
        return this.#entity.asParametric
    }

    /**
     * @type {null | Type}
     */
    get asType() {
        return this.#entity.asType
    }

    /**
     * @type {null | Typed}
     */
    get asTyped() {
        return this.#entity.asTyped
    }

    /**
     * @type {null | TypeClass}
     */
    get asTypeClass() {
        return this.#entity.asTypeClass
    }

    /**
     * @type {string}
     */
    get name() {
        return this.#name
    }

    /**
     * @type {string}
     */
    get path() {
        return this.#path
    }

    /**
     * @returns {string}
     */
    toString() {
        return this.#entity.toString()
    }
}

/**
 * A callable Instance.
 * @internal
 * @implements {Func}
 */
export class FuncEntity extends Common {
    /**
     * @type {FuncType}
     */
    #type

    /**
     * @param {FuncType} type
     */
    constructor(type) {
        super()

        if (!(type instanceof FuncType)) {
            throw new Error("unexpected")
        }

        this.#type = type
    }

    /**
     * @type {Type}
     */
    get type() {
        return this.#type
    }

    /**
     * Returns the underlying FuncType directly.
     * @type {FuncType}
     */
    get funcType() {
        return this.#type
    }

    /**
     * @type {Func}
     */
    get asFunc() {
        return this
    }

    /**
     * @type {Typed}
     */
    get asTyped() {
        return this
    }

    /**
     * @param {Site} site
     * @param {Typed[]} args
     * @param {{[name: string]: Typed}} namedArgs
     * @param {Option<ViableCasts>} viableCasts
     * @returns {Typed}
     */
    call(site, args, namedArgs = {}, viableCasts = None) {
        const type = this.#type.checkCall(site, args, namedArgs, viableCasts)

        return type.toTyped()
    }

    /**
     * Returns a string representing the type.
     * @returns {string}
     */
    toString() {
        return this.#type.toString()
    }
}

/**
 * @internal
 * @implements {Typed}
 */
export class TypedEntity extends Common {
    /**
     * @type {Type}
     */
    #type

    /**
     * @param {Type} type
     */
    constructor(type) {
        super()

        this.#type = type
    }

    /**
     * @returns {Typed}
     */
    get asTyped() {
        return this
    }

    /**
     * @type {Type}
     */
    get type() {
        return this.#type
    }
}

/**
 * Returned by functions that don't return anything (eg. assert, error, print)
 * @internal
 * @implements {Instance}
 */
export class VoidEntity extends Common {
    constructor() {
        super()
    }

    /**
     * @type {string[]}
     */
    get fieldNames() {
        return []
    }

    /**
     * @type {InstanceMembers}
     */
    get instanceMembers() {
        return {}
    }

    /**
     * @type {Type}
     */
    get type() {
        return new VoidType()
    }

    /**
     * @type {Instance}
     */
    get asInstance() {
        return this
    }

    /**
     * @type {Typed}
     */
    get asTyped() {
        return this
    }

    /**
     * @returns {string}
     */
    toString() {
        return "()"
    }
}

/**
 * @implements {Instance}
 */
export class AnyEntity extends Common {
    constructor() {
        super()
    }

    /**
     * @type {string[]}
     */
    get fieldNames() {
        return []
    }

    /**
     * @type {InstanceMembers}
     */
    get instanceMembers() {
        return {}
    }

    /**
     * @type {Type}
     */
    get type() {
        return new AnyType()
    }

    /**
     * @type {Instance}
     */
    get asInstance() {
        return this
    }

    /**
     * @type {Typed}
     */
    get asTyped() {
        return this
    }

    /**
     * @returns {string}
     */
    toString() {
        return "Any"
    }
}

/**
 * @implements {Namespace}
 */
export class ModuleNamespace extends Common {
    /**
     * @readonly
     * @type {string}
     */
    name

    /**
     * @readonly
     * @type {NamespaceMembers}
     */
    #members

    /**
     * @param {string} name
     * @param {NamespaceMembers} members
     */
    constructor(name, members) {
        super()
        this.name = name
        this.#members = members
    }

    /**
     * @type {NamespaceMembers}
     */
    get namespaceMembers() {
        return this.#members
    }

    /**
     * @type {Namespace}
     */
    get asNamespace() {
        return this
    }

    /**
     * @returns {string}
     */
    toString() {
        return this.name
    }
}

/**
 * @implements {Named}
 * @implements {Namespace}
 */
export class NamedNamespace extends ModuleNamespace {
    /**
     * @readonly
     * @type {string}
     */
    path

    /**
     * @param {string} name
     * @param {string} path
     * @param {NamespaceMembers} members
     */
    constructor(name, path, members) {
        super(name, members)
        this.path = path
    }

    /**
     * @type {Named}
     */
    get asNamed() {
        return this
    }
}

/**
 * @param {DataType} enumType
 * @returns {[string, EnumMemberType][]}
 */
export function collectEnumMembers(enumType) {
    return /** @type {[string, EnumMemberType][]} */ (
        Array.from(Object.entries(enumType.typeMembers)).filter(
            ([key, variantType]) => {
                if (variantType.asEnumMemberType) {
                    return enumType.isBaseOf(variantType.asEnumMemberType)
                } else {
                    return false
                }
            }
        )
    )
}
