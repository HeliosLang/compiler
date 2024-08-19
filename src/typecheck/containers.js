import { CompilerError, Word } from "@helios-lang/compiler-utils"
import { expectSome } from "@helios-lang/type-utils"
import {
    ArgType,
    Common,
    FuncType,
    GenericEnumMemberType,
    GenericType,
    VoidType,
    applyTypes,
    registerExpandTupleType,
    registerMakeListType,
    registerMakeMapType
} from "./common.js"
import { Parameter } from "./Parameter.js"
import { ParametricFunc } from "./ParametricFunc.js"
import {
    AnyTypeClass,
    GenericParametricType,
    GenericParametricEnumMemberType,
    ParametricType,
    DefaultTypeClass,
    SummableTypeClass
} from "./parametric.js"
import { FTPP, TTPP } from "../codegen/ParametricName.js"
import {
    BoolType,
    ByteArrayType,
    IntType,
    RealType,
    StringType,
    genCommonInstanceMembers,
    genCommonTypeMembers
} from "./primitives.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("./common.js").DataType} DataType
 * @typedef {import("./common.js").EnumMemberType} EnumMemberType
 * @typedef {import("./common.js").GenericTypeProps} GenericTypeProps
 * @typedef {import("./common.js").GenericEnumMemberTypeProps} GenericEnumMemberTypeProps
 * @typedef {import("./common.js").Named} Named
 * @typedef {import("./common.js").Parametric} Parametric
 * @typedef {import("./common.js").Type} Type
 * @typedef {import("./common.js").Typed} Typed
 * @typedef {import("./common.js").InstanceMembers} InstanceMembers
 * @typedef {import("./common.js").TypeMembers} TypeMembers
 * @typedef {import("./common.js").InferenceMap} InferenceMap
 */

/**
 * @param {Type[]} itemTypes
 * @returns {Type}
 */
export function IteratorType$(itemTypes) {
    const props = {
        name: `Iterator[${itemTypes.map((it) => it.toString()).join(", ")}]`,
        path: `__helios__iterator__${itemTypes.length}`,
        genInstanceMembers: (self) => {
            // Note: to_list and to_map can't be part of Iterator because type information is lost (eg. we can map to an iterator over functions)

            const itemType =
                itemTypes.length == 1 ? itemTypes[0] : TupleType$(itemTypes)

            const members = {
                all: new FuncType(
                    [new FuncType(itemTypes, BoolType)],
                    BoolType
                ),
                any: new FuncType(
                    [new FuncType(itemTypes, BoolType)],
                    BoolType
                ),
                drop: new FuncType([IntType], self),
                filter: new FuncType([new FuncType(itemTypes, BoolType)], self),
                find: new FuncType(
                    [new FuncType(itemTypes, BoolType)],
                    itemType
                ),
                for_each: new FuncType(
                    [new FuncType(itemTypes, new VoidType())],
                    new VoidType()
                ),
                fold: (() => {
                    const a = new Parameter("a", `${FTPP}0`, new AnyTypeClass())
                    return new ParametricFunc(
                        [a],
                        new FuncType(
                            [
                                new FuncType([a.ref].concat(itemTypes), a.ref),
                                a.ref
                            ],
                            a.ref
                        )
                    )
                })(),
                head: itemType,
                get: new FuncType([IntType], itemType),
                get_singleton: new FuncType([], itemType),
                is_empty: new FuncType([], BoolType),
                map: (() => {
                    const a = new Parameter("a", `${FTPP}0`, new AnyTypeClass())
                    return new ParametricFunc(
                        [a],
                        new FuncType(
                            [new FuncType(itemTypes, a.ref)],
                            IteratorType$([a.ref])
                        )
                    )
                })(),
                map2: (() => {
                    const a = new Parameter("a", `${FTPP}0`, new AnyTypeClass())
                    const b = new Parameter("b", `${FTPP}0`, new AnyTypeClass())

                    return new ParametricFunc(
                        [a, b],
                        new FuncType(
                            [
                                new FuncType(
                                    itemTypes,
                                    TupleType$([a.ref, b.ref])
                                )
                            ],
                            IteratorType$([a.ref, b.ref])
                        )
                    )
                })(),
                prepend: new FuncType(itemTypes, self),
                tail: self,
                take: new FuncType([IntType], self)
            }

            if (itemTypes.length < 10) {
                members.zip = (() => {
                    const a = new Parameter(
                        "a",
                        `${FTPP}0`,
                        new DefaultTypeClass()
                    )
                    return new ParametricFunc(
                        [a],
                        new FuncType(
                            [ListType$(a.ref)],
                            IteratorType$(itemTypes.concat([a.ref]))
                        )
                    )
                })()
            }

            return members
        },
        genTypeMembers: (self) => ({})
    }

    // if any of the item type is parametric, this return type must also be parametric so that the item type inference methods are called correctly
    //  (i.e. the inference method of this Iterator type calls the inference methods of the itemtypes)
    return itemTypes.some((it) => it.isParametric())
        ? new GenericParametricType(props)
        : new GenericType(props)
}

/**
 * @implements {DataType}
 */
export class TupleType extends GenericType {
    #itemTypes

    /**
     * @param {GenericTypeProps} props
     * @param {Type[]} itemTypes
     */
    constructor(props, itemTypes) {
        super(props)

        this.#itemTypes = itemTypes
    }

    get itemTypes() {
        return this.#itemTypes
    }

    /**
     * @param {Type} other
     * @returns {boolean}
     */
    isBaseOf(other) {
        if (other instanceof TupleType) {
            return (
                other.#itemTypes.length == this.#itemTypes.length &&
                this.#itemTypes.every((it, i) =>
                    it.isBaseOf(other.#itemTypes[i])
                )
            )
        } else {
            return false
        }
    }

    /**
     * @param {Site} site
     * @param {InferenceMap} map
     * @param {null | Type} type
     * @returns {Type}
     */
    infer(site, map, type) {
        if (!this.#itemTypes.some((it) => it.isParametric())) {
            return this
        }

        if (!type) {
            const itemTypes = this.#itemTypes.map((it) =>
                it.infer(site, map, null)
            )

            return TupleType$(itemTypes)
        } else if (
            type instanceof TupleType &&
            this.#itemTypes.length == type.#itemTypes.length
        ) {
            const itemTypes = this.#itemTypes.map((it, i) =>
                it.infer(site, map, type.#itemTypes[i])
            )

            return TupleType$(itemTypes)
        }

        throw CompilerError.type(
            site,
            `unable to infer type of ${this.toString()} (${type instanceof TupleType} ${type instanceof GenericType})`
        )
    }
}

/**
 * TODO: rename DataType to something else
 * @param {Type} type
 * @return {boolean}
 */
export function isDataType(type) {
    const dt = type.asDataType

    if (!dt) {
        return false
    }

    // no need to check for primitives
    if (
        dt == IntType ||
        dt == StringType ||
        dt == ByteArrayType ||
        dt == BoolType ||
        dt == RealType
    ) {
        return true
    }

    const dataTypeClass = new DefaultTypeClass()

    return dataTypeClass.isImplementedBy(dt)
}

/**
 * @param {Type[]} itemTypes
 * @param {boolean | null} isAllDataTypes - if the all the itemTypes are known datatypes, then don't check that here (could lead to infinite recursion)
 * @returns {Type}
 */
export function TupleType$(itemTypes, isAllDataTypes = null) {
    const isData = isAllDataTypes
        ? isAllDataTypes
        : itemTypes.every((it) => {
              return isDataType(it)
          })

    /**
     * @type {GenericTypeProps}
     */
    const props = {
        name: `(${itemTypes.map((it) => it.toString()).join(", ")})`,
        path: `__helios__tuple[${itemTypes.map((it) => (it.asDataType ? it.asDataType.path : "__helios__func")).join("@")}]`,
        genTypeSchema: (self) => {
            if (isData) {
                return {
                    kind: "tuple",
                    itemTypes: itemTypes.map((it) =>
                        expectSome(it.asDataType).toSchema()
                    )
                }
            } else {
                throw new Error(
                    `TypeSchema not available for ${self.toString()}`
                )
            }
        },
        genInstanceMembers: (self) => {
            const members = isData ? genCommonInstanceMembers(self) : {}

            const getters = ["first", "second", "third", "fourth", "fifth"]

            for (let i = 0; i < 5 && i < itemTypes.length; i++) {
                const key = getters[i]
                members[key] = itemTypes[i]
            }

            const a = new Parameter("a", `${FTPP}0`, new AnyTypeClass())
            members.__to_func = new ParametricFunc(
                [a],
                new FuncType([new FuncType(itemTypes, a.ref)], a.ref)
            )

            return members
        },
        genTypeMembers: (self) => {
            return isData ? genCommonTypeMembers(self) : {}
        }
    }

    return new TupleType(props, itemTypes)
}

/**
 * Returns null if `type` isn't a tuple
 * @param {Type} type
 * @returns {null | Type[]}
 */
export function getTupleItemTypes(type) {
    if (type instanceof TupleType) {
        return type.itemTypes
    } else {
        return null
    }
}

// dirty hack to be able to expand tuples in functions
registerExpandTupleType(getTupleItemTypes)

/**
 * Expand tuples in posArgs, if that matches argTypes better
 * @param {FuncType} funcType
 * @param {Typed[]} posArgs
 * @returns {Typed[]}
 */
export function expandTuplesInPosArgs(funcType, posArgs) {
    posArgs = posArgs.slice()
    let arg = posArgs.shift()

    /**
     * @type {Typed[]}
     */
    let result = []

    let i = 0

    while (arg) {
        if (
            i < funcType.origArgTypes.length &&
            Common.instanceOf(arg, funcType.origArgTypes[i].type)
        ) {
            result.push(arg)
            i++
        } else {
            const tupleItemTypes = getTupleItemTypes(arg.type)

            if (
                tupleItemTypes &&
                tupleItemTypes.every(
                    (tit, j) =>
                        i + j < funcType.origArgTypes.length &&
                        Common.instanceOf(
                            tit.toTyped(),
                            funcType.origArgTypes[i + j].type
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
 * Builtin list type
 * @type {Parametric}
 */
export const ListType = new ParametricType({
    name: "[]",
    parameters: [new Parameter("ItemType", `${TTPP}0`, new DefaultTypeClass())],
    apply: ([itemType_]) => {
        const itemType = expectSome(itemType_.asDataType)

        /**
         * @type {GenericTypeProps}
         */
        const props = {
            name: `[]${itemType.toString()}`,
            path: `__helios__list[${itemType.path}]`,
            genTypeSchema: (self, parents) => ({
                kind: /** @type {const} */ ("list"),
                itemType: expectSome(itemType.toSchema(parents))
            }),
            genInstanceMembers: (self) => {
                /**
                 * @type {InstanceMembers}
                 */
                const specialMembers = {}

                if (new SummableTypeClass().isImplementedBy(itemType)) {
                    specialMembers.sum = new FuncType([], itemType)
                } else if (StringType.isBaseOf(itemType)) {
                    specialMembers.join = new FuncType(
                        [new ArgType(new Word("separator"), StringType, true)],
                        StringType
                    )
                } else if (ByteArrayType.isBaseOf(itemType)) {
                    specialMembers.join = new FuncType(
                        [
                            new ArgType(
                                new Word("separator"),
                                ByteArrayType,
                                true
                            )
                        ],
                        ByteArrayType
                    )
                } else if (itemType.asNamed?.name.startsWith("[]")) {
                    specialMembers.flatten = new FuncType([], itemType)
                }

                return {
                    ...genCommonInstanceMembers(self),
                    ...specialMembers,
                    all: new FuncType(
                        [new FuncType([itemType], BoolType)],
                        BoolType
                    ),
                    any: new FuncType(
                        [new FuncType([itemType], BoolType)],
                        BoolType
                    ),
                    append: new FuncType([itemType], self),
                    drop: new FuncType([IntType], self),
                    drop_end: new FuncType([IntType], self),
                    filter: new FuncType(
                        [new FuncType([itemType], BoolType)],
                        self
                    ),
                    find: new FuncType(
                        [new FuncType([itemType], BoolType)],
                        itemType
                    ),
                    find_index: new FuncType(
                        [new FuncType([itemType], BoolType)],
                        IntType
                    ),
                    find_safe: new FuncType(
                        [new FuncType([itemType], BoolType)],
                        OptionType$(itemType)
                    ),
                    fold: (() => {
                        const a = new Parameter(
                            "a",
                            `${FTPP}0`,
                            new AnyTypeClass()
                        )
                        return new ParametricFunc(
                            [a],
                            new FuncType(
                                [new FuncType([a.ref, itemType], a.ref), a.ref],
                                a.ref
                            )
                        )
                    })(),
                    fold2: (() => {
                        const a = new Parameter(
                            "a",
                            `${FTPP}0`,
                            new AnyTypeClass()
                        )
                        const b = new Parameter(
                            "b",
                            `${FTPP}0`,
                            new AnyTypeClass()
                        )
                        return new ParametricFunc(
                            [a, b],
                            new FuncType(
                                [
                                    new FuncType(
                                        [a.ref, b.ref, itemType],
                                        TupleType$([a.ref, b.ref])
                                    ),
                                    a.ref,
                                    b.ref
                                ],
                                TupleType$([a.ref, b.ref])
                            )
                        )
                    })(),
                    fold3: (() => {
                        const a = new Parameter(
                            "a",
                            `${FTPP}0`,
                            new AnyTypeClass()
                        )
                        const b = new Parameter(
                            "b",
                            `${FTPP}0`,
                            new AnyTypeClass()
                        )
                        const c = new Parameter(
                            "c",
                            `${FTPP}0`,
                            new AnyTypeClass()
                        )
                        return new ParametricFunc(
                            [a, b, c],
                            new FuncType(
                                [
                                    new FuncType(
                                        [a.ref, b.ref, c.ref, itemType],
                                        TupleType$([a.ref, b.ref, c.ref])
                                    ),
                                    a.ref,
                                    b.ref,
                                    c.ref
                                ],
                                TupleType$([a.ref, b.ref, c.ref])
                            )
                        )
                    })(),
                    fold_lazy: (() => {
                        const a = new Parameter(
                            "a",
                            `${FTPP}0`,
                            new AnyTypeClass()
                        )
                        return new ParametricFunc(
                            [a],
                            new FuncType(
                                [
                                    new FuncType(
                                        [itemType, new FuncType([], a.ref)],
                                        a.ref
                                    ),
                                    a.ref
                                ],
                                a.ref
                            )
                        )
                    })(),
                    fold2_lazy: (() => {
                        const a = new Parameter(
                            "a",
                            `${FTPP}0`,
                            new AnyTypeClass()
                        )
                        const b = new Parameter(
                            "b",
                            `${FTPP}0`,
                            new AnyTypeClass()
                        )
                        return new ParametricFunc(
                            [a, b],
                            new FuncType(
                                [
                                    new FuncType(
                                        [
                                            itemType,
                                            new FuncType(
                                                [],
                                                TupleType$([a.ref, b.ref])
                                            )
                                        ],
                                        TupleType$([a.ref, b.ref])
                                    ),
                                    a.ref,
                                    b.ref
                                ],
                                TupleType$([a.ref, b.ref])
                            )
                        )
                    })(),
                    for_each: new FuncType(
                        [new FuncType([itemType], new VoidType())],
                        new VoidType()
                    ),
                    get: new FuncType([IntType], itemType),
                    get_singleton: new FuncType([], itemType),
                    head: itemType,
                    is_empty: new FuncType([], BoolType),
                    length: IntType,
                    map: (() => {
                        const a = new Parameter(
                            "a",
                            `${FTPP}0`,
                            new DefaultTypeClass()
                        )
                        return new ParametricFunc(
                            [a],
                            new FuncType(
                                [new FuncType([itemType], a.ref)],
                                ListType$(a.ref)
                            )
                        )
                    })(),
                    map_option: (() => {
                        const a = new Parameter(
                            "a",
                            `${FTPP}0`,
                            new DefaultTypeClass()
                        )
                        return new ParametricFunc(
                            [a],
                            new FuncType(
                                [new FuncType([itemType], OptionType$(a.ref))],
                                ListType$(a.ref)
                            )
                        )
                    })(),
                    prepend: new FuncType([itemType], self),
                    set: new FuncType([IntType, itemType], self),
                    sort: new FuncType(
                        [new FuncType([itemType, itemType], BoolType)],
                        self
                    ),
                    split_at: new FuncType(
                        [IntType],
                        TupleType$([self, self], true)
                    ),
                    tail: self,
                    take: new FuncType([IntType], self),
                    take_end: new FuncType([IntType], self),
                    to_iterator: new FuncType([], IteratorType$([itemType])),
                    zip: (() => {
                        const a = new Parameter(
                            "a",
                            `${FTPP}0`,
                            new DefaultTypeClass()
                        )
                        return new ParametricFunc(
                            [a],
                            new FuncType(
                                [ListType$(a.ref)],
                                IteratorType$([itemType, a.ref])
                            )
                        )
                    })()
                }
            },
            genTypeMembers: (self) => ({
                ...genCommonTypeMembers(self),
                __add: new FuncType([self, self], self),
                new: new FuncType(
                    [IntType, new FuncType([IntType], itemType)],
                    self
                ),
                new_const: new FuncType([IntType, itemType], self),
                from_iterator: new FuncType([IteratorType$([itemType])], self)
            })
        }

        return itemType_.isParametric()
            ? new GenericParametricType(props)
            : new GenericType(props)
    }
})

/**
 * @param {Type} itemType
 * @returns {DataType}
 */
export function ListType$(itemType) {
    return applyTypes(ListType, itemType)
}

registerMakeListType(ListType$)

/**
 * Builtin map type (in reality list of key-value pairs)
 * @internal
 * @type {Parametric}
 */
export const MapType = new ParametricType({
    name: "Map",
    parameters: [
        new Parameter("KeyType", `${TTPP}0`, new DefaultTypeClass()),
        new Parameter("ValueType", `${TTPP}1`, new DefaultTypeClass())
    ],
    apply: ([keyType_, valueType_]) => {
        const keyType = expectSome(keyType_.asDataType)
        const valueType = expectSome(valueType_.asDataType)

        /**
         * @type {GenericTypeProps}
         */
        const props = {
            name: `Map[${keyType.toString()}]${valueType.toString()}`,
            path: `__helios__map[${keyType.path}@${valueType.path}]`,
            genTypeSchema: (self, parents) => ({
                kind: /** @type {const} */ ("map"),
                keyType: expectSome(keyType.toSchema(parents)),
                valueType: expectSome(valueType.toSchema(parents))
            }),
            genInstanceMembers: (self) => ({
                ...genCommonInstanceMembers(self),
                all: new FuncType(
                    [new FuncType([keyType, valueType], BoolType)],
                    BoolType
                ),
                all_keys: new FuncType(
                    [new FuncType([keyType], BoolType)],
                    BoolType
                ),
                all_values: new FuncType(
                    [new FuncType([valueType], BoolType)],
                    BoolType
                ),
                any: new FuncType(
                    [new FuncType([keyType, valueType], BoolType)],
                    BoolType
                ),
                any_key: new FuncType(
                    [new FuncType([keyType], BoolType)],
                    BoolType
                ),
                any_value: new FuncType(
                    [new FuncType([valueType], BoolType)],
                    BoolType
                ),
                append: new FuncType([keyType, valueType], self),
                delete: new FuncType([keyType], self),
                filter: new FuncType(
                    [new FuncType([keyType, valueType], BoolType)],
                    self
                ),
                find: new FuncType(
                    [new FuncType([keyType, valueType], BoolType)],
                    TupleType$([keyType, valueType], true)
                ),
                find_key: new FuncType(
                    [new FuncType([keyType], BoolType)],
                    keyType
                ),
                find_key_safe: new FuncType(
                    [new FuncType([keyType], BoolType)],
                    OptionType$(keyType)
                ),
                // TODO: convert return value of find_safe to an OptionType of a TupleType (requires changing the way options work internally)
                find_safe: new FuncType(
                    [new FuncType([keyType, valueType], BoolType)],
                    TupleType$(
                        [
                            new FuncType([], TupleType$([keyType, valueType])),
                            BoolType
                        ],
                        false
                    )
                ),
                find_value: new FuncType(
                    [new FuncType([valueType], BoolType)],
                    valueType
                ),
                find_value_safe: new FuncType(
                    [new FuncType([valueType], BoolType)],
                    OptionType$(valueType)
                ),
                fold: (() => {
                    const a = new Parameter("a", `${FTPP}0`, new AnyTypeClass())
                    return new ParametricFunc(
                        [a],
                        new FuncType(
                            [
                                new FuncType(
                                    [a.ref, keyType, valueType],
                                    a.ref
                                ),
                                a.ref
                            ],
                            a.ref
                        )
                    )
                })(),
                fold_lazy: (() => {
                    const a = new Parameter("a", `${FTPP}0`, new AnyTypeClass())
                    return new ParametricFunc(
                        [a],
                        new FuncType(
                            [
                                new FuncType(
                                    [
                                        keyType,
                                        valueType,
                                        new FuncType([], a.ref)
                                    ],
                                    a.ref
                                ),
                                a.ref
                            ],
                            a.ref
                        )
                    )
                })(),
                fold_with_list: (() => {
                    const a = new Parameter("a", `${FTPP}0`, new AnyTypeClass())
                    const b = new Parameter(
                        "b",
                        `${FTPP}1`,
                        new DefaultTypeClass()
                    )

                    return new ParametricFunc(
                        [a, b],
                        new FuncType(
                            [
                                new FuncType(
                                    [a.ref, keyType, valueType, b.ref],
                                    a.ref
                                ),
                                a.ref,
                                ListType$(b.ref)
                            ],
                            a.ref
                        )
                    )
                })(),
                fold2: (() => {
                    const a = new Parameter("a", `${FTPP}0`, new AnyTypeClass())
                    const b = new Parameter("b", `${FTPP}0`, new AnyTypeClass())
                    return new ParametricFunc(
                        [a, b],
                        new FuncType(
                            [
                                new FuncType(
                                    [a.ref, b.ref, keyType, valueType],
                                    TupleType$([a.ref, b.ref])
                                ),
                                a.ref,
                                b.ref
                            ],
                            TupleType$([a.ref, b.ref])
                        )
                    )
                })(),
                for_each: new FuncType(
                    [new FuncType([keyType, valueType], new VoidType())],
                    new VoidType()
                ),
                get: new FuncType([keyType], valueType),
                get_safe: new FuncType([keyType], OptionType$(valueType)),
                head: TupleType$([keyType, valueType], true),
                head_key: keyType,
                head_value: valueType,
                is_empty: new FuncType([], BoolType),
                length: IntType,
                map: (() => {
                    const a = new Parameter(
                        "a",
                        `${FTPP}0`,
                        new DefaultTypeClass()
                    )
                    const b = new Parameter(
                        "b",
                        `${FTPP}1`,
                        new DefaultTypeClass()
                    )

                    return new ParametricFunc(
                        [a, b],
                        new FuncType(
                            [
                                new FuncType(
                                    [keyType, valueType],
                                    TupleType$([a.ref, b.ref], true)
                                )
                            ],
                            MapType$(a.ref, b.ref)
                        )
                    )
                })(),
                prepend: new FuncType([keyType, valueType], self),
                set: new FuncType([keyType, valueType], self),
                sort: new FuncType(
                    [
                        new FuncType(
                            [keyType, valueType, keyType, valueType],
                            BoolType
                        )
                    ],
                    self
                ),
                tail: self,
                to_iterator: new FuncType(
                    [],
                    IteratorType$([keyType, valueType])
                ),
                update: new FuncType(
                    [keyType, new FuncType([valueType], valueType)],
                    self
                ),
                update_safe: new FuncType(
                    [keyType, new FuncType([valueType], valueType)],
                    self
                )
            }),
            genTypeMembers: (self) => ({
                ...genCommonTypeMembers(self),
                __add: new FuncType([self, self], self),
                from_iterator: new FuncType(
                    [IteratorType$([keyType, valueType])],
                    self
                )
            })
        }

        return keyType.isParametric() || valueType.isParametric()
            ? new GenericParametricType(props)
            : new GenericType(props)
    }
})

/**
 * @param {Type} keyType
 * @param {Type} valueType
 * @returns {DataType}
 */
export function MapType$(keyType, valueType) {
    return applyTypes(MapType, keyType, valueType)
}

registerMakeMapType(MapType$)

/**
 * Builtin option type
 * @type {Parametric}
 */
const OptionType = new ParametricType({
    name: "Option",
    parameters: [new Parameter("SomeType", `${TTPP}0`, new DefaultTypeClass())],
    apply: ([someType_]) => {
        const someType = expectSome(someType_.asDataType)
        const someTypePath = someType.path

        /**
         * @type {null | EnumMemberType}
         */
        let NoneType = null

        /**
         * @type {null | EnumMemberType}
         */
        let SomeType = null

        /**
         * @type {GenericTypeProps}
         */
        const appliedOptionTypeProps = {
            name: `Option[${someType.toString()}]`,
            path: `__helios__option[${someTypePath}]`,
            genTypeSchema: (self, parents) => ({
                kind: "option",
                someType: expectSome(someType.toSchema(parents))
            }),
            genInstanceMembers: (self) => ({
                ...genCommonInstanceMembers(self),
                map: (() => {
                    const a = new Parameter(
                        "a",
                        `${FTPP}0`,
                        new DefaultTypeClass()
                    )
                    return new ParametricFunc(
                        [a],
                        new FuncType(
                            [new FuncType([someType], a.ref)],
                            OptionType$(a.ref)
                        )
                    )
                })(),
                unwrap: new FuncType([], someType)
            }),
            genTypeMembers: (self) => ({
                ...genCommonTypeMembers(self),
                None: expectSome(NoneType),
                Some: expectSome(SomeType)
            })
        }

        const somePath = `__helios__option[${someTypePath}]__some`

        /**
         * @type {Omit<GenericEnumMemberTypeProps, "parentType">}
         */
        const someTypeProps = {
            name: "Some",
            constrIndex: 0,
            fieldNames: ["some"],
            path: somePath,
            genTypeSchema: (self, parents) => ({
                kind: "variant",
                tag: 0,
                name: "Some",
                id: somePath,
                fieldTypes: [
                    {
                        name: "some",
                        type: someType.toSchema(parents)
                    }
                ]
            }),
            genInstanceMembers: (self) => ({
                ...genCommonInstanceMembers(self),
                some: someType
            }),
            genTypeMembers: (self) => ({
                ...genCommonTypeMembers(self),
                __is: new FuncType(
                    [expectSome(self.asEnumMemberType).parentType],
                    BoolType
                )
            })
        }

        const nonePath = `__helios__option[${someTypePath}]__none`

        /**
         * @type {Omit<GenericEnumMemberTypeProps, "parentType">}
         */
        const noneTypeProps = {
            name: "None",
            constrIndex: 1,
            path: nonePath,
            genTypeSchema: (self, parents) => ({
                kind: "variant",
                tag: 1,
                name: "None",
                id: nonePath,
                fieldTypes: []
            }),
            genInstanceMembers: (self) => ({
                ...genCommonInstanceMembers(self)
            }),
            genTypeMembers: (self) => ({
                ...genCommonTypeMembers(self),
                __is: new FuncType(
                    [expectSome(self.asEnumMemberType).parentType],
                    BoolType
                )
            })
        }

        if (someType.isParametric()) {
            const AppliedOptionType = new GenericParametricType(
                appliedOptionTypeProps
            )

            SomeType = new GenericParametricEnumMemberType({
                ...someTypeProps,
                parentType: AppliedOptionType
            })

            NoneType = new GenericParametricEnumMemberType({
                ...noneTypeProps,
                parentType: AppliedOptionType
            })

            return AppliedOptionType
        } else {
            const AppliedOptionType = new GenericType(appliedOptionTypeProps)

            SomeType = new GenericEnumMemberType({
                ...someTypeProps,
                parentType: AppliedOptionType
            })

            NoneType = new GenericEnumMemberType({
                ...noneTypeProps,
                parentType: AppliedOptionType
            })

            return AppliedOptionType
        }
    }
})

/**
 * @internal
 * @param {Type} someType
 * @returns {DataType}
 */
export function OptionType$(someType) {
    return applyTypes(OptionType, someType)
}
