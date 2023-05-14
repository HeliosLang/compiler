//@ts-check
// Eval hash types

import {
	DatumHash,
	HeliosData,
	MintingPolicyHash,
	PubKeyHash,
	StakeKeyHash,
	StakingValidatorHash,
	ValidatorHash
} from "./helios-data.js";

/**
 * @template {HeliosData} T
 * @typedef {import("./helios-data.js").HeliosDataClass<T>} HeliosDataClass
 */

import {
    FuncType,
    GenericEnumMemberType,
    GenericType
} from "./eval-common.js";

/**
 * @typedef {import("./eval-common.js").DataType} DataType
 */

/**
 * @typedef {import("./eval-common.js").EnumMemberType} EnumMemberType
 */

/**
 * @typedef {import("./eval-common.js").Named} Named
 */


/**
 * @typedef {import("./eval-common.js").Type} Type
 */

/**
 * @typedef {import("./eval-common.js").InstanceMembers} InstanceMembers
 */

/**
 * @typedef {import("./eval-common.js").TypeMembers} TypeMembers
 */

import {
    BoolType,
    ByteArrayType,
    StringType,
    genCommonInstanceMembers,
    genCommonTypeMembers,
    genCommonEnumTypeMembers
} from "./eval-primitives.js";

/**
 * @param {Type} self 
 * @returns {InstanceMembers}
 */
function genHashInstanceMembers(self) {
    return {
        ...genCommonInstanceMembers(self),
        show: new FuncType([], StringType)
    };
}

/**
 * @param {Type} self 
 * @returns {TypeMembers}
 */
function genHashTypeMembers(self) {
    return {
        ...genCommonTypeMembers(self),
        __geq: new FuncType([self, self], BoolType),
        __gt: new FuncType([self, self], BoolType),
        __leq: new FuncType([self, self], BoolType),
        __lt: new FuncType([self, self], BoolType),
        new: new FuncType([ByteArrayType], self)
    };
}

/**
 * @package
 * @type {DataType}
 */
export var DatumHashType = new GenericType({
    name: "DatumHash",
    offChainType: DatumHash,
    genInstanceMembers: genHashInstanceMembers,
    genTypeMembers: genHashTypeMembers
});

/**
 * @package
 * @type {DataType}
 */
export var MintingPolicyHashType = new GenericType({
    name: "MintingPolicyHash",
    offChainType: MintingPolicyHash,
    genInstanceMembers: genHashInstanceMembers,
    genTypeMembers: (self) => ({
        ...genHashTypeMembers(self),
        from_script_hash: new FuncType([ScriptHashType], self)
    })
});

/**
 * Builtin PubKey type
 * @package
 * @type {DataType}
 */
export var PubKeyType = new GenericType({
    name: "PubKey",
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        show: new FuncType([], StringType),
        verify: new FuncType([ByteArrayType, ByteArrayType], BoolType)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        new: new FuncType([ByteArrayType], self)
    })
});

/**
 * Builtin PubKeyHash type
 * @package
 * @type {DataType}
 */
export var PubKeyHashType = new GenericType({
    name: "PubKeyHash",
    offChainType: PubKeyHash,
    genInstanceMembers: genHashInstanceMembers,
    genTypeMembers: genHashTypeMembers
});

/**
 * @package
 * @type {DataType}
 */
export var ScriptHashType = new GenericType({
    name: "ScriptHash",
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self)
    })
});

/**
 * @package
 * @type {DataType}
 */
export var StakeKeyHashType = new GenericType({
    name: "StakeKeyHash",
    offChainType: StakeKeyHash,
    genInstanceMembers: genHashInstanceMembers,
    genTypeMembers: genHashTypeMembers
});

/**
 * Builtin StakingHash type
 * @package
 * @type {DataType}
 */
export var StakingHashType = new GenericType({
    name: "StakingHash",
    genInstanceMembers: genCommonInstanceMembers,
    genTypeMembers: (self) => ({
        StakeKey: StakingHashStakeKeyType,
        Validator: StakingHashValidatorType,
        new_stakekey: new FuncType([StakeKeyHashType], StakingHashStakeKeyType),
        new_validator: new FuncType([StakingValidatorHashType], StakingHashValidatorType)
    })
});

/**
 * @package
 * @type {EnumMemberType}
 */
export var StakingHashStakeKeyType = new GenericEnumMemberType({
    name: "StakeKey",
    constrIndex: 0,
    parentType: StakingHashType,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        hash: StakeKeyHashType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, StakingHashType)
    })
});

/**
 * @package
 * @type {EnumMemberType}
 */
export var StakingHashValidatorType = new GenericEnumMemberType({
    name: "Validator",
    constrIndex: 1,
    parentType: StakingHashType,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        hash: StakingValidatorHashType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, StakingHashType)
    })
});

/**
 * @package
 * @type {DataType}
 */
export var StakingValidatorHashType = new GenericType({
    name: "StakingValidatorHash",
    offChainType: StakingValidatorHash,
    genInstanceMembers: genHashInstanceMembers,
    genTypeMembers: (self) => ({
        ...genHashTypeMembers(self),
        from_script_hash: new FuncType([ScriptHashType], self)
    })
});

/**
 * @package
 * @type {DataType}
 */
export var ValidatorHashType = new GenericType({
    name: "ValidatorHash",
    offChainType: ValidatorHash,
    genInstanceMembers: genHashInstanceMembers,
    genTypeMembers: (self) => ({
        ...genHashTypeMembers(self),
        from_script_hash:  new FuncType([ScriptHashType], self)
    })
});