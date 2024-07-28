import { FTPP } from "../codegen/ParametricName.js"
import { FuncType, GenericType } from "./common.js"
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
        is_valid_data: new FuncType([RawDataType], BoolType)
    }
}

/**
 * Builtin bool type
 * @type {DataType}
 */
export const BoolType = new GenericType({
    name: "Bool",
    genTypeDetails: (self) => ({
        inputType: "boolean",
        outputType: "boolean",
        internalType: {
            type: "Bool"
        }
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
    genTypeDetails: (self) => ({
        inputType: "number[] | string",
        outputType: "number[]",
        internalType: {
            type: "ByteArray"
        }
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
    genTypeDetails: (self) => ({
        inputType: "number | bigint",
        outputType: "bigint",
        internalType: {
            type: "Int"
        }
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
 * Not named 'Data' in Js because it's too generic
 * @internal
 * @type {DataType}
 */
export const RawDataType = new GenericType({
    name: "Data",
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        tag: IntType,
        as: (() => {
            const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass())

            return new ParametricData([a], a.ref)
        })()
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self)
    })
})

/**
 * Builtin top/bottom Ratio
 */
export const RatioType = new GenericType({
    name: "Ratio",
    genTypeDetails: (self) => ({
        inputType: "{top: number | bigint, bottom: number | bigint}",
        outputType: "{top: bigint, bottom: bigint}",
        internalType: {
            type: "Ratio"
        }
    }),
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        bottom: IntType,
        top: IntType,
        floor: new FuncType([], IntType)
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
    genTypeDetails: (self) => ({
        inputType: "number",
        outputType: "number",
        internalType: {
            type: "Real"
        }
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
        sqrt: new FuncType([self], self)
    })
})

/**
 * Builtin string type
 * @type {DataType}
 */
export const StringType = new GenericType({
    name: "String",
    genTypeDetails: (self) => ({
        inputType: "string",
        outputType: "string",
        internalType: {
            type: "String"
        }
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
