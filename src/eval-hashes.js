//@ts-check
// Eval hash types

import { 
    assert,
    hexToBytes
} from "./utils.js";

import { 
    ByteArrayData
} from "./uplc-data.js";

import {
	DatumHash,
	HeliosData,
	MintingPolicyHash,
	PubKey,
	PubKeyHash,
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
 * @param {HeliosDataClass<HeliosData>} offchainType 
 */
function genHashTypeProps(offchainType) {
    return {
        genTypeDetails: (self) => ({
            inputType: `number[] | string | helios.${offchainType.name}`,
            outputType: `helios.${offchainType.name}`,
            internalType: {
                type: offchainType.name
            }
        }),
        jsToUplc: async (obj, helpers) => {
            if (obj instanceof offchainType) {
                return obj._toUplcData();
            } else {
                const bytes = Array.isArray(obj) ? obj : hexToBytes(obj);

                return new ByteArrayData(bytes);
            }
        },
        uplcToJs: async (data, helpers) => {
            return new offchainType(data.bytes);
        }
    }
}

/**
 * @internal
 * @implements {DataType}
 */
export class ScriptHashType extends GenericType {
    /**
     * 
     * @param {null | string } name 
     * @param {null | HeliosDataClass<HeliosData>} offChainType 
     */
    constructor(name = null, offChainType = null) {
        if (offChainType && name) {
            super({
                ...genHashTypeProps(offChainType),
                name: name,
                offChainType: offChainType,
                genInstanceMembers: genHashInstanceMembers,
                genTypeMembers: (self) => ({
                    ...genHashTypeMembers(self),
                    from_script_hash: new FuncType([scriptHashType], self)
                })
            });
        } else {
            assert(name === null);

            super({
                name: "ScriptHash",
                genInstanceMembers: (self) => ({
                    ...genCommonInstanceMembers(self)
                }),
                genTypeMembers: (self) => ({
                    ...genCommonTypeMembers(self)
                })
            });
        }
    }
}

/**
 * @internal
 * @type {DataType}
 */
export const scriptHashType = new ScriptHashType();

/**
 * @internal
 * @type {DataType}
 */
export const DatumHashType = new GenericType({
    ...genHashTypeProps(DatumHash),
    name: "DatumHash",
    offChainType: DatumHash,
    genInstanceMembers: genHashInstanceMembers,
    genTypeMembers: genHashTypeMembers
});

/**
 * @internal
 * @type {ScriptHashType}
 */
export const MintingPolicyHashType = new ScriptHashType("MintingPolicyHash", MintingPolicyHash);

/**
 * Builtin PubKey type
 * @internal
 * @type {DataType}
 */
export const PubKeyType = new GenericType({
    name: "PubKey",
    offChainType: PubKey,
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
 * @internal
 * @type {DataType}
 */
export const PubKeyHashType = new GenericType({
    ...genHashTypeProps(PubKeyHash),
    name: "PubKeyHash",
    offChainType: PubKeyHash,
    genInstanceMembers: genHashInstanceMembers,
    genTypeMembers: genHashTypeMembers
});

/**
 * Builtin StakingHash type
 * @internal
 * @type {DataType}
 */
export const StakingHashType = new GenericType({
    name: "StakingHash",
    genInstanceMembers: genCommonInstanceMembers,
    genTypeMembers: (self) => ({
        StakeKey: StakingHashStakeKeyType,
        Validator: StakingHashValidatorType,
        new_stakekey: new FuncType([PubKeyHashType], StakingHashStakeKeyType),
        new_validator: new FuncType([StakingValidatorHashType], StakingHashValidatorType)
    })
});

/**
 * @internal
 * @type {EnumMemberType}
 */
export const StakingHashStakeKeyType = new GenericEnumMemberType({
    name: "StakeKey",
    constrIndex: 0,
    parentType: StakingHashType,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        hash: PubKeyHashType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, StakingHashType)
    })
});

/**
 * @internal
 * @type {EnumMemberType}
 */
export const StakingHashValidatorType = new GenericEnumMemberType({
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
 * @internal
 * @type {ScriptHashType}
 */
export const StakingValidatorHashType = new ScriptHashType("StakingValidatorHash", StakingValidatorHash);

/**
 * @internal
 * @type {ScriptHashType}
 */
export const ValidatorHashType = new ScriptHashType("ValidatorHash", ValidatorHash);
