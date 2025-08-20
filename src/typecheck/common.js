import { makeTypeError } from "@helios-lang/compiler-utils"
import { expectDefined, isDefined } from "@helios-lang/type-utils"

/**
 * @import { Site, Word } from "@helios-lang/compiler-utils"
 * @import { TypeSchema } from "@helios-lang/type-utils"
 * @import { TypeCheckContext } from "../index.js"
 */

/**
 * @typedef {(argType: Type, targetType: Type) => (Type | undefined)} ViableCasts
 */

/**
 * @typedef {(type: Type) => (Type[] | undefined)} ExpandTupleCallback
 */

/**
 * @type {ExpandTupleCallback | undefined}
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
 * @type {MakeListCallback | undefined}
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
 * @type {MakeMapCallback | undefined}
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
 *   call(ctx: TypeCheckContext, site: Site, args: Typed[], namedArgs?: {[name: string]: Typed}, viableCasts?: ViableCasts): Typed
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
 *   apply(ctx: TypeCheckContext, types: Type[], site?: Site): EvalEntity | undefined
 *   inferCall(ctx: TypeCheckContext, site: Site, args: Typed[], namedArgs?: {[name: string]: Typed}, paramTypes?: Type[]): Func | undefined
 * 	 infer(ctx: TypeCheckContext, site: Site, map: InferenceMap): Parametric | undefined
 * }} Parametric
 */

/**
 * @typedef {EvalEntity & {
 *   asType:               Type
 *   instanceMembers:      InstanceMembers
 *   typeMembers:          TypeMembers
 *   isBaseOf(type: Type): boolean
 *   infer(ctx: TypeCheckContext, site: Site, map: InferenceMap, type: null | Type): Type
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
 * @param {TypeCheckContext} ctx
 * @param {Parametric} parametric
 * @param {Type[]} types
 * @returns {DataType}
 */
export function applyTypes(ctx, parametric, ...types) {
    return expectDefined(
        (parametric.apply(ctx, types) ?? new AllType()).asDataType
    )
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
     * @type {Type}
     */
    get type() {
        return this
    }

    /**
     * @returns {Typed}
     */
    get asTyped() {
        return new DataEntity(this)
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
     * @param {TypeCheckContext} ctx
     * @param {Site} site
     * @param {InferenceMap} map
     * @param {null | Type} type
     * @returns {Type}
     */
    infer(ctx, site, map, type) {
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
     * @param {TypeCheckContext} ctx
     * @param {Site} site
     * @param {InferenceMap} map
     * @param {null | Type} type
     * @returns {Type}
     */
    infer(ctx, site, map, type) {
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
 * @internal
 */
export class ArgType {
    /**
     * @private
     * @readonly
     * @type {Word | undefined}
     */
    _name

    /**
     * @private
     * @readonly
     * @type {Type}
     */
    _type

    /**
     * @private
     * @readonly
     * @type {boolean}
     */
    _optional

    /**
     * @param {Word | undefined} name
     * @param {Type} type
     * @param {boolean} optional
     */
    constructor(name, type, optional = false) {
        this._name = name
        this._type = type
        this._optional = optional
    }

    /**
     * @type {string}
     */
    get name() {
        if (!this._name) {
            return ""
        } else {
            return this._name.toString()
        }
    }

    /**
     * @type {Type}
     */
    get type() {
        return this._type
    }

    /**
     * @internal
     * @param {TypeCheckContext} ctx
     * @param {Site} site
     * @param {InferenceMap} map
     * @param {null | Type} type
     * @returns {ArgType}
     */
    infer(ctx, site, map, type) {
        return new ArgType(
            this._name,
            this._type.infer(ctx, site, map, type),
            this._optional
        )
    }

    /**
     * @param {ArgType} other
     * @returns {boolean}
     */
    isBaseOf(other) {
        // if this arg has a default value, the other arg must also have a default value
        if (this._optional && !other._optional) {
            return false
        }

        // if this is named, the other must be named as well
        if (this._name != null) {
            return this._name.toString() == (other._name?.toString() ?? "")
        }

        if (!other._type.isBaseOf(this._type)) {
            // note the reversal of the check
            return false
        }

        return true
    }

    /**
     * @returns {boolean}
     */
    isNamed() {
        return isDefined(this._name)
    }

    /**
     * @returns {boolean}
     */
    isOptional() {
        return this._optional
    }

    /**
     * @returns {string}
     */
    toString() {
        return [
            this._name != null ? `${this._name.toString()}: ` : "",
            this._optional ? "?" : "",
            this._type.toString()
        ].join("")
    }
}

/**
 * @typedef {Type & {
 *   origArgTypes: ArgType[]
 *   argTypes: Type[]
 *   instanceMembers: InstanceMembers
 *   nArgs: number
 *   nNonOptArgs: number
 * }} FuncTypeI
 */

/**
 * Function type with arg types and a return type
 * @implements {FuncTypeI}
 */
export class FuncType extends Common {
    /**
     * @readonly
     * @type {ArgType[]}
     */
    origArgTypes

    /**
     * @private
     * @readonly
     * @type {Type}
     */
    _retType

    /**
     * @param {Type[] | ArgType[]} argTypes
     * @param {Type} retType
     */
    constructor(argTypes, retType) {
        super()

        this.origArgTypes = argTypes.map((at) =>
            at instanceof ArgType ? at : new ArgType(undefined, at)
        )

        this._retType = retType
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
        return this._retType
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
     * @param {TypeCheckContext} ctx
     * @param {Site} site
     * @param {Typed[]} origPosArgs - pos args with tuples, expanded internally
     * @param {{[name: string]: Typed}} namedArgs
     * @param {((argType: Type, targetType: Type) => (Type | undefined)) | undefined} viableCasts
     * @returns {Type}
     */
    checkCall(ctx, site, origPosArgs, namedArgs = {}, viableCasts = undefined) {
        const posArgs = this.expandTuplesInPosArgs(origPosArgs)

        if (posArgs.length < this.nNonOptArgs) {
            // check if each nonOptArg is covered by the named args
            for (let i = 0; i < this.nNonOptArgs; i++) {
                if (!this.origArgTypes[i].isNamed()) {
                    ctx.errors.type(
                        site,
                        `expected at least ${this.origArgTypes.filter((at) => !at.isNamed()).length} positional arg(s), got ${posArgs.length} positional arg(s)`
                    )
                } else if (!(this.origArgTypes[i].name in namedArgs)) {
                    ctx.errors.type(
                        site,
                        `expected at least ${this.nNonOptArgs} arg(s), missing '${this.origArgTypes[i].name}'`
                    )
                }
            }
        } else if (posArgs.length > this.origArgTypes.length) {
            ctx.errors.type(
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
                        : undefined

                if (altType) {
                    origPosArgs[origIndex] = altType.toTyped()
                } else {
                    ctx.errors.type(
                        site,
                        `expected '${expectedArgType.toString()}' for arg ${i + 1}, got '${posArg.type.toString()}'`
                    )
                }
            }
        }

        for (let key in namedArgs) {
            const i = this.origArgTypes.findIndex((at) => at.name == key)

            if (i == -1) {
                ctx.errors.type(
                    site,
                    `arg named ${key} not found in function type ${this.toString()}`
                )
            }

            if (i < posArgs.length) {
                ctx.errors.type(
                    site,
                    `named arg '${key}' already covered by positional arg ${i + 1}`
                )
            }

            const thisArg = this.origArgTypes[i]

            const namedArg = namedArgs[key]

            if (!Common.instanceOf(namedArg, thisArg.type)) {
                const altType = viableCasts
                    ? viableCasts(namedArg.type, thisArg.type)
                    : undefined

                if (altType) {
                    // mutate the namedArgs object
                    namedArgs[key] = altType.toTyped()
                } else {
                    ctx.errors.type(
                        site,
                        `expected '${thisArg.type.toString()}' for arg '${key}', got '${namedArg.toString()}`
                    )
                }
            }
        }

        return this._retType
    }

    /**
     * @internal
     * @param {TypeCheckContext} ctx
     * @param {Site} site
     * @param {InferenceMap} map
     * @param {null | Type} type
     * @returns {Type}
     */
    infer(ctx, site, map, type) {
        if (!type) {
            return new FuncType(
                this.origArgTypes.map((at) => at.infer(ctx, site, map, null)),
                this._retType.infer(ctx, site, map, null)
            )
        } else if (type instanceof FuncType) {
            if (type.argTypes.length == this.origArgTypes.length) {
                return new FuncType(
                    this.origArgTypes.map((at, i) =>
                        at.infer(ctx, site, map, type.argTypes[i])
                    ),
                    this._retType.infer(ctx, site, map, type.retType)
                )
            }
        }

        ctx.errors.type(site, `unable to infer type of ${this.toString()}`)

        return new AllType()
    }

    /**
     * @internal
     * @param {TypeCheckContext} ctx
     * @param {Site} site
     * @param {InferenceMap} map
     * @param {Type[]} argTypes
     * @returns {FuncType}
     */
    inferArgs(ctx, site, map, argTypes) {
        if (argTypes.length != this.argTypes.length) {
            ctx.errors.type(
                site,
                `expected ${this.argTypes.length} arg(s), got ${argTypes.length}`
            )
        }

        return new FuncType(
            this.origArgTypes.map((at, i) =>
                at.infer(ctx, site, map, argTypes[i])
            ),
            this._retType.infer(ctx, site, map, null)
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

        if (Common.typesEq(type, this._retType)) {
            return true
        }

        return false
    }

    /**
     * Checks if 'this' is a base type of another FuncType.
     * The number of args needs to be the same.
     * Each argType of the FuncType we are checking against needs to be the same or less specific (i.e. isBaseOf(this._argTypes[i]))
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

                if (!this._retType.isBaseOf(other._retType)) {
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
     * @param {Site} _site
     * @param {Type} type
     * @returns {boolean}
     */
    isMaybeMethod(_site, type) {
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
        return `(${this.origArgTypes.map((a) => a.toString()).join(", ")}) -> ${this._retType.toString()}`
    }

    /**
     * Throws an error if name isn't found
     * @param {TypeCheckContext} ctx
     * @param {Site} site
     * @param {string} name
     * @returns {number}
     */
    getNamedIndex(ctx, site, name) {
        const i = this.origArgTypes.findIndex((at) => at.name == name)

        if (i == -1) {
            ctx.errors.type(site, `arg name ${name} not found`)
            return 0
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
    /**
     * @private
     * @readonly
     * @type {string}
     */
    _name

    /**
     * @private
     * @readonly
     * @type {string}
     */
    _path

    /**
     * @private
     * @readonly
     * @type {string[]}
     */
    _fieldNames

    /**
     * defer until needed
     * @private
     * @readonly
     * @type {(self: Type) => InstanceMembers}
     */
    _genInstanceMembers

    /**
     * defer until needed
     * @private
     * @readonly
     * @type {(self: Type) => TypeMembers}
     */
    _genTypeMembers

    /**
     * @private
     * @type {InstanceMembers | undefined}
     */
    _instanceMembers

    /**
     * @private
     * @type {TypeMembers | undefined}
     */
    _typeMembers

    /**
     * @private
     * @readonly
     * @type {((self: Type, parents: Set<string>) => TypeSchema) | undefined}
     */
    _genTypeSchema

    /**
     * @private
     * @type {number}
     */
    _genDepth

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

        this._name = name
        this._path = path ?? `__helios__${name.toLowerCase()}`
        this._fieldNames = fieldNames ?? []

        this._genInstanceMembers = genInstanceMembers
        this._genTypeMembers = genTypeMembers
        this._instanceMembers = undefined
        this._typeMembers = undefined
        this._genTypeSchema = genTypeSchema ?? undefined
        this._genDepth = 0
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
        return this._fieldNames
    }

    /**
     * @type {InstanceMembers}
     */
    get instanceMembers() {
        if (!this._instanceMembers) {
            this._instanceMembers = this._genInstanceMembers(this)
        }

        return this._instanceMembers
    }

    /**
     * @type {string}
     */
    get name() {
        return this._name
    }

    /**
     * @param {Set<string>} parents
     * @returns {TypeSchema}
     */
    toSchema(parents = new Set()) {
        if (this._genTypeSchema) {
            return this._genTypeSchema(this, parents)
        } else {
            throw new Error(`typeSchema not available for ${this.toString()}`)
        }
    }

    /**
     * @type {string}
     */
    get path() {
        return this._path
    }

    /**
     * @type {boolean}
     */
    get ready() {
        return this._genDepth < 2
    }

    /**
     * @type {TypeMembers}
     */
    get typeMembers() {
        if (!this._typeMembers) {
            this._genDepth += 1
            this._typeMembers = this._genTypeMembers(this)
            this._genDepth -= 1
        }

        return this._typeMembers
    }

    /**
     * @param {TypeCheckContext} ctx
     * @param {Site} site
     * @param {InferenceMap} map
     */
    applyInternal(ctx, site, map) {
        return {
            name: this._name,
            path: this._path,
            fieldNames: this._fieldNames,
            genInstanceMembers: (self) => {
                /**
                 * @type {InstanceMembers}
                 */
                const instanceMembers = {}

                const oldInstanceMembers = this._genInstanceMembers(self)

                for (let k in oldInstanceMembers) {
                    const v = oldInstanceMembers[k]

                    if (v.asParametric) {
                        instanceMembers[k] =
                            v.asParametric.infer(ctx, site, map) ??
                            new AllType()
                    } else if (v.asType) {
                        instanceMembers[k] = v.asType.infer(
                            ctx,
                            site,
                            map,
                            null
                        )
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

                const oldTypeMembers = this._genTypeMembers(self)

                for (let k in oldTypeMembers) {
                    const v = oldTypeMembers[k]

                    if (v.asParametric) {
                        typeMembers[k] =
                            v.asParametric.infer(ctx, site, map) ??
                            new AllType()
                    } else if (v.asTyped) {
                        typeMembers[k] = v.asTyped.type
                            .infer(ctx, site, map, null)
                            .toTyped()
                    } else if (v.asType) {
                        typeMembers[k] = v.asType.infer(ctx, site, map, null)
                    } else {
                        throw new Error("unhandled")
                    }
                }

                return typeMembers
            }
        }
    }

    /**
     * @param {TypeCheckContext} ctx
     * @param {Site} site
     * @param {InferenceMap} map
     * @param {null | Type} type
     * @returns {Type}
     */
    infer(ctx, site, map, type) {
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
            fieldNames: this._fieldNames,
            genInstanceMembers: this._genInstanceMembers,
            genTypeMembers: this._genTypeMembers
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
            return other.asNamed.path == this._path
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
    /**
     * @private
     * @readonly
     * @type {number}
     */
    _constrIndex

    /**
     * @private
     * @readonly
     * @type {DataType}
     */
    _parentType

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

        this._constrIndex = constrIndex
        this._parentType = parentType
    }

    /**
     * @type {number}
     */
    get constrIndex() {
        return this._constrIndex
    }

    /**
     * @type {DataType}
     */
    get parentType() {
        return this._parentType
    }

    /**
     * @type {EnumMemberType}
     */
    get asEnumMemberType() {
        return this
    }

    /**
     * @param {TypeCheckContext} ctx
     * @param {Site} site
     * @param {InferenceMap} map
     * @param {null | Type} type
     * @returns {Type}
     */
    infer(ctx, site, map, type) {
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
        return `${this._parentType.toString()}::${this.name}`
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
     * @param {TypeCheckContext} ctx
     * @param {Site} site
     * @param {InferenceMap} map
     * @param {null | Type} type
     * @returns {Type}
     */
    infer(ctx, site, map, type) {
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
    /**
     * @private
     * @readonly
     * @type {DataType}
     */
    _type

    /**
     * @param {DataType} type
     */
    constructor(type) {
        super()
        if (type instanceof FuncType) {
            throw new Error("unexpected")
        }

        this._type = type
    }

    /**
     * @type {string[]}
     */
    get fieldNames() {
        return this._type.fieldNames
    }

    /**
     * @type {InstanceMembers}
     */
    get instanceMembers() {
        return this._type.instanceMembers
    }

    /**
     * @type {Type}
     */
    get type() {
        return this._type
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
        return this._type.toString()
    }
}

/**
 * Type of special case of no-return value where execution can't continue.
 * @internal
 * @implements {Type}
 */
export class ErrorType extends VoidType {
    /**
     * @type {Type}
     */
    get asType() {
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
     * @returns {Typed}
     */
    toTyped() {
        return new ErrorEntity()
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
    /**
     * @private
     * @readonly
     * @type {string}
     */
    _name

    /**
     * @private
     * @readonly
     * @type {string}
     */
    _path

    /**
     * @private
     * @readonly
     * @type {EvalEntity}
     */
    _entity

    /**
     * @param {string} name
     * @param {string} path
     * @param {EvalEntity} entity
     */
    constructor(name, path, entity) {
        this._name = name
        this._path = path
        this._entity = entity
    }

    /**
     * @type {null | DataType}
     */
    get asDataType() {
        return this._entity.asDataType
    }

    /**
     * @type {null | EnumMemberType}
     */
    get asEnumMemberType() {
        return this._entity.asEnumMemberType
    }

    /**
     * @type {null | Func}
     */
    get asFunc() {
        return this._entity.asFunc
    }

    /**
     * @type {null | Instance}
     */
    get asInstance() {
        return this._entity.asInstance
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
        return this._entity.asNamespace
    }

    /**
     * @type {null | Parametric}
     */
    get asParametric() {
        return this._entity.asParametric
    }

    /**
     * @type {null | Type}
     */
    get asType() {
        return this._entity.asType
    }

    /**
     * @type {null | Typed}
     */
    get asTyped() {
        return this._entity.asTyped
    }

    /**
     * @type {null | TypeClass}
     */
    get asTypeClass() {
        return this._entity.asTypeClass
    }

    /**
     * @type {string}
     */
    get name() {
        return this._name
    }

    /**
     * @type {string}
     */
    get path() {
        return this._path
    }

    /**
     * @returns {string}
     */
    toString() {
        return this._entity.toString()
    }
}

/**
 * A callable Instance.
 * @internal
 * @implements {Func}
 */
export class FuncEntity extends Common {
    /**
     * @private
     * @readonly
     * @type {FuncType}
     */
    _type

    /**
     * @param {FuncType} type
     */
    constructor(type) {
        super()

        if (!(type instanceof FuncType)) {
            throw new Error("unexpected")
        }

        this._type = type
    }

    /**
     * @type {Type}
     */
    get type() {
        return this._type
    }

    /**
     * Returns the underlying FuncType directly.
     * @type {FuncType}
     */
    get funcType() {
        return this._type
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
     * @param {TypeCheckContext} ctx
     * @param {Site} site
     * @param {Typed[]} args
     * @param {{[name: string]: Typed}} namedArgs
     * @param {ViableCasts | undefined} viableCasts
     * @returns {Typed}
     */
    call(ctx, site, args, namedArgs = {}, viableCasts = undefined) {
        const type = this._type.checkCall(
            ctx,
            site,
            args,
            namedArgs,
            viableCasts
        )

        return type.toTyped()
    }

    /**
     * Returns a string representing the type.
     * @returns {string}
     */
    toString() {
        return this._type.toString()
    }
}

/**
 * @internal
 * @implements {Typed}
 */
export class TypedEntity extends Common {
    /**
     * @private
     * @readonly
     * @type {Type}
     */
    _type

    /**
     * @param {Type} type
     */
    constructor(type) {
        super()

        this._type = type
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
        return this._type
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
     * @private
     * @readonly
     * @type {NamespaceMembers}
     */
    _members

    /**
     * @param {string} name
     * @param {NamespaceMembers} members
     */
    constructor(name, members) {
        super()
        this.name = name
        this._members = members
    }

    /**
     * @type {NamespaceMembers}
     */
    get namespaceMembers() {
        return this._members
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
