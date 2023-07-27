//@ts-check
// Eval time types

import {
    assertDefined
} from "./utils.js";

import {
    Duration,
    Time
} from "./helios-data.js";

import {
    DataEntity,
    FuncType,
    GenericType
} from "./eval-common.js";

/**
 * @typedef {import("./eval-common.js").DataType} DataType
 */

import {
    BoolType,
    IntType, 
    StringType,
    genCommonInstanceMembers, 
    genCommonTypeMembers
} from "./eval-primitives.js";

/**
 * Builtin Duration type
 * @internal
 * @type {DataType}
 */
export var DurationType = new GenericType({
    name: "Duration",
    offChainType: Duration,
    genTypeDetails: (self) => ({
        inputType: `number | bigint`,
        outputType: `number`,
        internalType: {
            type: "Duration"
        }
    }),
    jsToUplc: (obj) => {
        return Duration.fromProps(obj)._toUplcData();
    },
    uplcToJs: (data) => {
        return Number(Duration.fromUplcData(data).value);
    },
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self)
    }),
    genTypeMembers: (self) => {
        const selfInstance = new DataEntity(assertDefined(self.asDataType));

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
});

/**
 * Builtin Time type. Opaque alias of Int representing milliseconds since 1970
 * @internal
 * @type {DataType}
 */
export var TimeType = new GenericType({
    name: "Time",
    offChainType: Time,
    genTypeDetails: (self) => ({
        inputType: `number | bigint | string | Date`,
        outputType: `Date`,
        internalType: {
            type: "Time"
        }
    }),
    jsToUplc: (obj) => {
        return Time.fromProps(obj)._toUplcData();
    },
    uplcToJs: (data) => {
        return new Date(Number(Time.fromUplcData(data).value));
    },
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        show: new FuncType([], StringType)
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
});

/**
 * Builtin TimeRange type
 * @internal
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
        is_after: new FuncType([TimeType], BoolType),
        show: new FuncType([], StringType)
    }),
    genTypeMembers: (self) => {
        const selfInstance = new DataEntity(assertDefined(self.asDataType));

        return {
            ...genCommonTypeMembers(self),
            new: new FuncType([TimeType, TimeType], self),
            ALWAYS: selfInstance,
            NEVER: selfInstance,
            from: new FuncType([TimeType], self),
            to: new FuncType([TimeType], self)
        };
    }
});