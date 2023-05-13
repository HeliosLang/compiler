//@ts-check
// Eval time types

import {
    Duration,
    Time
} from "./helios-data.js";

import {
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
 * @package
 * @type {DataType}
 */
export var DurationType = new GenericType({
    name: "Duration",
    offChainType: Duration,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self)
    }),
    genTypeMembers: (self) => ({
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
        SECOND: self,
        MINUTE: self,
        HOUR: self,
        DAY: self,
        WEEK: self
    })
});

/**
 * Builtin Time type. Opaque alias of Int representing milliseconds since 1970
 * @package
 * @type {DataType}
 */
export var TimeType = new GenericType({
    name: "Time",
    offChainType: Time,
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
 * @package
 * @type {DataType}
 */
export var TimeRangeType = new GenericType({
    name: "TimeRange",
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        contains: new FuncType([TimeType], BoolType),
        end: TimeType,
        is_before: new FuncType([TimeType], BoolType),
        is_after: new FuncType([TimeType], BoolType),
        show: new FuncType([], StringType)
    }),
    genTypeMembers: (self) => ({
        new: new FuncType([TimeType, TimeType], self),
        ALWAYS: self,
        NEVER: self,
        from: new FuncType([TimeType], self),
        to: new FuncType([TimeType], self)
    })
});