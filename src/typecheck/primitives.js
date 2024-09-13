import { expectSome } from "@helios-lang/type-utils"
import { FTPP } from "../codegen/ParametricName.js"
import {
    FuncType,
    GenericEnumMemberType,
    GenericType,
    makeListType,
    makeMapType
} from "./common.js"
import { Parameter } from "./Parameter.js"
import { ParametricData } from "./ParametricData.js"
import { DefaultTypeClass } from "./parametric.js"

/**
 * @typedef {import("./common.js").DataType} DataType
 * @typedef {import("./common.js").Type} Type
 * @typedef {import("./common.js").InstanceMembers} InstanceMembers
 * @typedef {import("./common.js").TypeMembers} TypeMembers
 */

/**
 * @param {Type} type
 * @returns {InstanceMembers}
 */
export function genCommonInstanceMembers(type) {
    return {
        serialize: new FuncType([], ByteArrayType),
        show: new FuncType([], StringType)
    }
}

/**
 * @param {Type} type
 * @returns {TypeMembers}
 */
export function genCommonTypeMembers(type) {
    return {
        __eq: new FuncType([type, type], BoolType),
        __neq: new FuncType([type, type], BoolType),
        from_data: new FuncType([RawDataType], type),
        __to_data: new FuncType([type], RawDataType),
        is_valid_data: new FuncType([RawDataType], BoolType)
    }
}

/**
 * @internal
 * @param {Type} type
 * @param {Type} parentType
 * @returns {TypeMembers}
 */
export function genCommonEnumTypeMembers(type, parentType) {
    return {
        __eq: new FuncType([type, parentType], BoolType),
        __neq: new FuncType([type, parentType], BoolType),
        from_data: new FuncType([RawDataType], type),
        __to_data: new FuncType([type], RawDataType),
        is_valid_data: new FuncType([RawDataType], BoolType),
        __is: new FuncType([parentType], BoolType)
    }
}

/**
 * Builtin bool type
 * @type {DataType}
 */
export const BoolType = new GenericType({
    name: "Bool",
    genTypeSchema: (self, parents) => ({
        kind: "internal",
        name: "Bool"
    }),
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        to_int: new FuncType([], IntType),
        trace: new FuncType([StringType], self),
        trace_if_false: new FuncType([StringType], self),
        trace_if_true: new FuncType([StringType], self)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        __and: new FuncType([self, self], self),
        __neq: new FuncType([self, self], self),
        __not: new FuncType([self], self),
        __or: new FuncType([self, self], self),
        and: new FuncType(
            [new FuncType([], self), new FuncType([], self)],
            self
        ),
        or: new FuncType([new FuncType([], self), new FuncType([], self)], self)
    })
})

/**
 * Builtin bytearray type
 * @type {DataType}
 */
export const ByteArrayType = new GenericType({
    name: "ByteArray",
    genTypeSchema: (self, parents) => ({
        kind: "internal",
        name: "ByteArray"
    }),
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        blake2b: new FuncType([], self),
        decode_utf8: new FuncType([], StringType),
        ends_with: new FuncType([self], BoolType),
        length: IntType,
        prepend: new FuncType([IntType], self),
        sha2: new FuncType([], self),
        sha3: new FuncType([], self),
        slice: new FuncType([IntType, IntType], self),
        starts_with: new FuncType([self], BoolType)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        __add: new FuncType([self, self], self),
        __geq: new FuncType([self, self], BoolType),
        __gt: new FuncType([self, self], BoolType),
        __leq: new FuncType([self, self], BoolType),
        __lt: new FuncType([self, self], BoolType),
        parse: new FuncType([StringType], self)
    })
})

/**
 * @type {DataType}
 */
export const IntType = new GenericType({
    name: "Int",
    genTypeSchema: (self, parents) => ({
        kind: "internal",
        name: "Int"
    }),
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        abs: new FuncType([], self),
        bound: new FuncType([self, self], self),
        bound_max: new FuncType([self], self),
        bound_min: new FuncType([self], self),
        decode_zigzag: new FuncType([], self),
        encode_zigzag: new FuncType([], self),
        to_base58: new FuncType([], StringType),
        to_big_endian: new FuncType([], ByteArrayType),
        to_bool: new FuncType([], BoolType),
        to_hex: new FuncType([], StringType),
        to_little_endian: new FuncType([], ByteArrayType),
        to_ratio: new FuncType([], RatioType),
        to_real: new FuncType([], RealType)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        __add: new FuncType([self, self], self),
        __add1: new FuncType([self, RealType], RealType),
        __div: new FuncType([self, self], self),
        __div1: new FuncType([self, RealType], RealType),
        __div2: new FuncType([self, RatioType], RatioType),
        __geq: new FuncType([self, self], BoolType),
        __geq1: new FuncType([self, RealType], BoolType),
        __geq2: new FuncType([self, RatioType], BoolType),
        __gt: new FuncType([self, self], BoolType),
        __gt1: new FuncType([self, RealType], BoolType),
        __gt2: new FuncType([self, RatioType], BoolType),
        __leq: new FuncType([self, self], BoolType),
        __leq1: new FuncType([self, RealType], BoolType),
        __leq2: new FuncType([self, RatioType], BoolType),
        __lt: new FuncType([self, self], BoolType),
        __lt1: new FuncType([self, RealType], BoolType),
        __lt2: new FuncType([self, RatioType], BoolType),
        __mod: new FuncType([self, self], self),
        __mul: new FuncType([self, self], self),
        __mul1: new FuncType([self, RealType], RealType),
        __neg: new FuncType([self], self),
        __pos: new FuncType([self], self),
        __sub: new FuncType([self, self], self),
        __sub1: new FuncType([self, RealType], RealType),
        __sub2: new FuncType([self, RatioType], RatioType),
        from_base58: new FuncType([StringType], self),
        from_big_endian: new FuncType([ByteArrayType], self),
        from_little_endian: new FuncType([ByteArrayType], self),
        max: new FuncType([self, self], self),
        min: new FuncType([self, self], self),
        parse: new FuncType([StringType], self),
        sqrt: new FuncType([self], self)
    })
})

/**
 * Type of external data that must be cast/type-checked before using
 * Not named 'Data' in Js because that would be too generic
 * @type {DataType}
 */
export const RawDataType = new GenericType({
    name: "Data",
    genTypeSchema: (self, parents) => ({
        kind: "internal",
        name: "Data"
    }),
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        tag: IntType,
        as: (() => {
            const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass())

            return new ParametricData([a], a.ref)
        })()
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        ConstrData: RawConstrDataType,
        MapData: RawMapDataType,
        ListData: RawListDataType,
        IntData: RawIntDataType,
        ByteArrayData: RawByteArrayDataType
    })
})

const RawConstrDataType = new GenericEnumMemberType({
    name: "ConstrData",
    constrIndex: -1,
    parentType: RawDataType,
    genTypeSchema: (self, parents) => ({
        kind: "internal",
        name: "Data"
    }),
    fieldNames: ["tag", "fields"],
    genInstanceMembers: (self) => ({
        tag: IntType,
        fields: expectSome(makeListType)(RawDataType)
    }),
    genTypeMembers: (self) => ({
        __is: new FuncType([RawDataType], BoolType)
    })
})

const RawMapDataType = new GenericEnumMemberType({
    name: "MapData",
    constrIndex: -1,
    parentType: RawDataType,
    fieldNames: ["entries"],
    genTypeSchema: (self, parents) => ({
        kind: "internal",
        name: "Data"
    }),
    genInstanceMembers: (self) => ({
        entries: expectSome(makeMapType)(RawDataType, RawDataType)
    }),
    genTypeMembers: (self) => ({
        __is: new FuncType([RawDataType], BoolType)
    })
})

const RawListDataType = new GenericEnumMemberType({
    name: "ListData",
    constrIndex: -1,
    parentType: RawDataType,
    fieldNames: ["items"],
    genTypeSchema: (self, parents) => ({
        kind: "internal",
        name: "Data"
    }),
    genInstanceMembers: (self) => ({
        items: expectSome(makeListType)(RawDataType)
    }),
    genTypeMembers: (self) => ({
        __is: new FuncType([RawDataType], BoolType)
    })
})

const RawIntDataType = new GenericEnumMemberType({
    name: "IntData",
    constrIndex: -1,
    parentType: RawDataType,
    fieldNames: ["value"],
    genTypeSchema: (self, parents) => ({
        kind: "internal",
        name: "Data"
    }),
    genInstanceMembers: (self) => ({
        value: IntType
    }),
    genTypeMembers: (self) => ({
        __is: new FuncType([RawDataType], BoolType)
    })
})

const RawByteArrayDataType = new GenericEnumMemberType({
    name: "ByteArrayData",
    constrIndex: -1,
    parentType: RawDataType,
    fieldNames: ["value"],
    genTypeSchema: (self, parents) => ({
        kind: "internal",
        name: "Data"
    }),
    genInstanceMembers: (self) => ({
        value: ByteArrayType
    }),
    genTypeMembers: (self) => ({
        __is: new FuncType([RawDataType], BoolType)
    })
})

/**
 * Builtin top/bottom Ratio
 */
export const RatioType = new GenericType({
    name: "Ratio",
    genTypeSchema: (self, parents) => ({
        kind: /** @type {const} */ ("internal"),
        name: "Ratio"
    }),
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        bottom: IntType,
        top: IntType,
        ceil: new FuncType([], IntType),
        floor: new FuncType([], IntType),
        to_real: new FuncType([], RealType),
        trunc: new FuncType([], IntType),
        round: new FuncType([], IntType)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        new: new FuncType([IntType, IntType], self),
        __add: new FuncType([self, self], self),
        __add1: new FuncType([self, IntType], self),
        __sub: new FuncType([self, self], self),
        __sub1: new FuncType([self, IntType], self),
        __mul: new FuncType([self, self], self),
        __mul1: new FuncType([self, IntType], self),
        __div: new FuncType([self, self], self),
        __div1: new FuncType([self, IntType], self),
        __lt: new FuncType([self, self], BoolType),
        __lt1: new FuncType([self, IntType], BoolType),
        __leq: new FuncType([self, self], BoolType),
        __leq1: new FuncType([self, IntType], BoolType),
        __gt: new FuncType([self, self], BoolType),
        __gt1: new FuncType([self, IntType], BoolType),
        __geq: new FuncType([self, self], BoolType),
        __geq1: new FuncType([self, IntType], BoolType)
    })
})
/**
 * Builtin Real fixed point number type
 * @type {DataType}
 */
export const RealType = new GenericType({
    name: "Real",
    genTypeSchema: (self, parents) => ({
        kind: "internal",
        name: "Real"
    }),
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        abs: new FuncType([], self),
        ceil: new FuncType([], IntType),
        floor: new FuncType([], IntType),
        round: new FuncType([], IntType),
        trunc: new FuncType([], IntType),
        to_ratio: new FuncType([], RatioType)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        __add: new FuncType([self, self], self),
        __add1: new FuncType([self, IntType], self),
        __div: new FuncType([self, self], self),
        __div1: new FuncType([self, IntType], self),
        __eq1: new FuncType([self, IntType], BoolType),
        __geq: new FuncType([self, self], BoolType),
        __geq1: new FuncType([self, IntType], BoolType),
        __gt: new FuncType([self, self], BoolType),
        __gt1: new FuncType([self, IntType], BoolType),
        __leq: new FuncType([self, self], BoolType),
        __leq1: new FuncType([self, IntType], BoolType),
        __lt: new FuncType([self, self], BoolType),
        __lt1: new FuncType([self, IntType], BoolType),
        __mul: new FuncType([self, self], self),
        __mul1: new FuncType([self, IntType], self),
        __neg: new FuncType([self], self),
        __neq1: new FuncType([self, IntType], BoolType),
        __pos: new FuncType([self], self),
        __sub: new FuncType([self, self], self),
        __sub1: new FuncType([self, IntType], self),
        divf: new FuncType([self, self], self),
        max: new FuncType([self, self], self),
        min: new FuncType([self, self], self),
        mulf: new FuncType([self, self], self),
        sqrt: new FuncType([self], self),
        sqrtf: new FuncType([self], self)
    })
})

/**
 * Builtin string type
 * @type {DataType}
 */
export const StringType = new GenericType({
    name: "String",
    genTypeSchema: (self, parents) => ({
        kind: "internal",
        name: "String"
    }),
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        encode_utf8: new FuncType([], ByteArrayType),
        ends_with: new FuncType([self], BoolType),
        starts_with: new FuncType([self], BoolType)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        __add: new FuncType([self, self], self),
        is_valid_utf8: new FuncType([ByteArrayType], BoolType)
    })
})
