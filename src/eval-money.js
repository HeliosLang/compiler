//@ts-check
// Eval money types

import {
    assertDefined
} from "./utils.js";

import {
    FTPP
} from "./tokens.js";

import {
    AssetClass,
    Value
} from "./helios-data.js";

import {
    Common,
    DataEntity,
    FuncType,
    GenericType
} from "./eval-common.js";

/**
 * @typedef {import("./eval-common.js").DataType} DataType
 */

/**
 * @typedef {import("./eval-common.js").Type} Type
 */

/**
 * @typedef {import("./eval-common.js").TypeClass} TypeClass
 */

/**
 * @typedef {import("./eval-common.js").TypeClassMembers} TypeClassMembers
 */

import { 
    BoolType,
    ByteArrayType,
    IntType,
    StringType,
    genCommonInstanceMembers,
    genCommonTypeMembers
} from "./eval-primitives.js";

import {
    DefaultTypeClass,
    Parameter,
    ParametricFunc
} from "./eval-parametric.js";

import {
    ListType$,
    MapType$
} from "./eval-containers.js";

import { 
    MintingPolicyHashType
} from "./eval-hashes.js";

/**
 * Builtin AssetClass type
 * @package
 * @type {DataType}
 */
export const AssetClassType = new GenericType({
    name: "AssetClass",
    offChainType: AssetClass,
    genTypeDetails: (self) => ({
        inputType: "string | {mph: number[] | string | helios.MintingPolicyHash, tokenName: number[] | string} | helios.AssetClass",
        outputType: "helios.AssetClass",
        internalType: {
            type: "AssetClass"
        }
    }),
    jsToUplc: (obj) => {
        return AssetClass.fromProps(obj)._toUplcData();
    },
    uplcToJs: (data) => {
        return AssetClass.fromUplcData(data);
    },
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        mph: MintingPolicyHashType,
        token_name: ByteArrayType
    }),
    genTypeMembers: (self) => {
        const selfInstance = new DataEntity(assertDefined(self.asDataType));

        return {
            ...genCommonTypeMembers(self),
            ADA: selfInstance,
            new: new FuncType([MintingPolicyHashType, ByteArrayType], self)
        }
    }
});


/**
 * Builtin money Value type
 * @package
 * @type {DataType}
 */
export const ValueType = new GenericType({
    name: "Value",
    offChainType: Value,
    genTypeDetails: (self) => ({
        inputType: `number | bigint | {lovelace?: number | bigint, assets: [string, number | bigint][] | [number[] | string | helios.MintingPolicyHash, [number[] | string, number | bigint][]][] | helios.Assets} | helios.Value`,
        outputType: `helios.Value`,
        internalType: {
            type: "Value"
        }
    }),
    jsToUplc: (obj) => {
        return Value.fromProps(obj)._toUplcData();
    },
    uplcToJs: (data) => {
        return Value.fromUplcData(data);
    },
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        contains: new FuncType([self], BoolType),
        contains_policy: new FuncType([MintingPolicyHashType], BoolType),
        get: new FuncType([AssetClassType], IntType),
        get_assets: new FuncType([], ValueType),
        get_lovelace: new FuncType([], IntType),
        get_policy: new FuncType([MintingPolicyHashType], MapType$(ByteArrayType, IntType)),
        get_safe: new FuncType([AssetClassType], IntType),
        is_zero: new FuncType([], BoolType),
        show: new FuncType([], StringType),
        to_map: new FuncType([], MapType$(MintingPolicyHashType, MapType$(ByteArrayType, IntType))),
        value: self // so that Value implements Valuable itself as well
    }),
    genTypeMembers: (self) => {
        const selfInstance = new DataEntity(assertDefined(self.asDataType));

        return {
            ...genCommonTypeMembers(self),
            __add: new FuncType([self, self], self),
            __div: new FuncType([self, IntType], ValueType),
            __geq: new FuncType([self, ValueType], BoolType),
            __gt: new FuncType([self, ValueType], BoolType),
            __leq: new FuncType([self, ValueType], BoolType),
            __lt: new FuncType([self, ValueType], BoolType),
            __mul: new FuncType([self, IntType], ValueType),
            __sub: new FuncType([self, self], self),
            from_map: new FuncType([MapType$(MintingPolicyHashType, MapType$(ByteArrayType, IntType))], self),
            lovelace: new FuncType([IntType], self),
            new: new FuncType([AssetClassType, IntType], self),
            sum: (() => {
                const a = new Parameter("a", `${FTPP}0`, new ValuableTypeClass());
                return new ParametricFunc([a], new FuncType([ListType$(a.ref)], self));
            })(),
            ZERO: selfInstance
        }
    }
});

/**
 * @package
 * @implements {TypeClass}
 */
export class ValuableTypeClass extends DefaultTypeClass {
	/**
	 * @param {Type} impl
	 * @returns {TypeClassMembers}
	 */
	genTypeMembers(impl) {
		return {
            ...super.genTypeMembers(impl)
        };
	}

	/**	
	 * @param {Type} impl
	 * @returns {TypeClassMembers}
	 */
	genInstanceMembers(impl) {
		return {
            ...super.genInstanceMembers(impl),
            value: ValueType
		};
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return "Valuable";
	}
}