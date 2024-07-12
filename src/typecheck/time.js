import { expectSome } from "@helios-lang/type-utils"
import { DataEntity, FuncType, GenericType } from "./common.js"
import {
    BoolType,
    IntType,
    genCommonInstanceMembers,
    genCommonTypeMembers
} from "./primitives.js"

/**
 * @typedef {import("./common.js").DataType} DataType
 */

/**
 * Builtin Duration type
 * @type {DataType}
 */
export var DurationType = new GenericType({
    name: "Duration",
    genTypeDetails: (self) => ({
        inputType: `number | bigint`,
        outputType: `number`,
        internalType: {
            type: "Duration"
        }
    }),
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self)
    }),
    genTypeMembers: (self) => {
        const selfInstance = new DataEntity(expectSome(self.asDataType))

        return {
            ...genCommonTypeMembers(self),
            __add: new FuncType([self, self], self),
            __div: new FuncType([self, IntType], self),
            __div1: new FuncType([self, DurationType], IntType),
            __geq: new FuncType([self, DurationType], BoolType),
            __gt: new FuncType([self, DurationType], BoolType),
            __leq: new FuncType([self, DurationType], BoolType),
            __lt: new FuncType([self, DurationType], BoolType),
            __mod: new FuncType([self, self], self),
            __mul: new FuncType([self, IntType], self),
            __sub: new FuncType([self, self], self),
            new: new FuncType([IntType], self),
            SECOND: selfInstance,
            MINUTE: selfInstance,
            HOUR: selfInstance,
            DAY: selfInstance,
            WEEK: selfInstance
        }
    }
})

/**
 * Builtin Time type. Opaque alias of Int representing milliseconds since 1970
 * @type {DataType}
 */
export var TimeType = new GenericType({
    name: "Time",
    genTypeDetails: (self) => ({
        inputType: `number | bigint | string | Date`,
        outputType: `Date`,
        internalType: {
            type: "Time"
        }
    }),
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        __add: new FuncType([self, DurationType], TimeType),
        __geq: new FuncType([self, TimeType], BoolType),
        __gt: new FuncType([self, TimeType], BoolType),
        __leq: new FuncType([self, TimeType], BoolType),
        __lt: new FuncType([self, TimeType], BoolType),
        __sub: new FuncType([self, TimeType], DurationType),
        __sub1: new FuncType([self, DurationType], TimeType),
        new: new FuncType([IntType], self)
    })
})

/**
 * Builtin TimeRange type
 * @type {DataType}
 */
export var TimeRangeType = new GenericType({
    name: "TimeRange",
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        contains: new FuncType([TimeType], BoolType),
        start: TimeType,
        end: TimeType,
        is_before: new FuncType([TimeType], BoolType),
        is_after: new FuncType([TimeType], BoolType)
    }),
    genTypeMembers: (self) => {
        const selfInstance = new DataEntity(expectSome(self.asDataType))

        return {
            ...genCommonTypeMembers(self),
            new: new FuncType([TimeType, TimeType], self),
            ALWAYS: selfInstance,
            NEVER: selfInstance,
            from: new FuncType([TimeType], self),
            to: new FuncType([TimeType], self)
        }
    }
})
