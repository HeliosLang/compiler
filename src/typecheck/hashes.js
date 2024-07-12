import { isNone } from "@helios-lang/type-utils"
import { FuncType, GenericEnumMemberType, GenericType } from "./common.js"
import {
    BoolType,
    ByteArrayType,
    genCommonInstanceMembers,
    genCommonTypeMembers,
    genCommonEnumTypeMembers
} from "./primitives.js"

/**
 * @typedef {import("./common.js").DataType} DataType
 * @typedef {import("./common.js").EnumMemberType} EnumMemberType
 * @typedef {import("./common.js").Named} Named
 * @typedef {import("./common.js").Type} Type
 * @typedef {import("./common.js").InstanceMembers} InstanceMembers
 * @typedef {import("./common.js").TypeMembers} TypeMembers
 */

/**
 * @param {Type} self
 * @returns {InstanceMembers}
 */
function genHashInstanceMembers(self) {
    return {
        ...genCommonInstanceMembers(self),
        bytes: ByteArrayType
    }
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
    }
}

/**
 * @param {string} offchainTypeName
 */
function genHashTypeProps(offchainTypeName) {
    return {
        genTypeDetails: (self) => ({
            inputType: `number[] | string | helios.${offchainTypeName}`,
            outputType: `helios.${offchainTypeName}`,
            internalType: {
                type: offchainTypeName
            }
        })
    }
}

/**
 * @implements {DataType}
 */
export class ScriptHashType extends GenericType {
    /**
     *
     * @param {null | string } name
     * @param {Option<string>} offChainTypeName
     */
    constructor(name = null, offChainTypeName = null) {
        if (offChainTypeName && name) {
            super({
                ...genHashTypeProps(offChainTypeName),
                name: name,
                genInstanceMembers: genHashInstanceMembers,
                genTypeMembers: (self) => ({
                    ...genHashTypeMembers(self),
                    from_script_hash: new FuncType([scriptHashType], self)
                })
            })
        } else {
            if (isNone(name)) {
                throw new Error("unexpected")
            }

            super({
                name: "ScriptHash",
                genInstanceMembers: (self) => ({
                    ...genCommonInstanceMembers(self)
                }),
                genTypeMembers: (self) => ({
                    ...genCommonTypeMembers(self)
                })
            })
        }
    }
}

/**
 * @type {DataType}
 */
export const scriptHashType = new ScriptHashType()

/**
 * @type {DataType}
 */
export const DatumHashType = new GenericType({
    ...genHashTypeProps("DatumHash"),
    name: "DatumHash",
    genInstanceMembers: genHashInstanceMembers,
    genTypeMembers: genHashTypeMembers
})

/**
 * @type {ScriptHashType}
 */
export const MintingPolicyHashType = new ScriptHashType(
    "MintingPolicyHash",
    "MintingPolicyHash"
)

/**
 * Builtin PubKey type
 * @type {DataType}
 */
export const PubKeyType = new GenericType({
    name: "PubKey",
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        verify: new FuncType([ByteArrayType, ByteArrayType], BoolType)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        new: new FuncType([ByteArrayType], self)
    })
})

/**
 * Builtin PubKeyHash type
 * @type {DataType}
 */
export const PubKeyHashType = new GenericType({
    ...genHashTypeProps("PubKeyHash"),
    name: "PubKeyHash",
    genInstanceMembers: genHashInstanceMembers,
    genTypeMembers: genHashTypeMembers
})

/**
 * Builtin StakingHash type
 * @type {DataType}
 */
export const StakingHashType = new GenericType({
    name: "StakingHash",
    genInstanceMembers: genCommonInstanceMembers,
    genTypeMembers: (self) => ({
        StakeKey: StakingHashStakeKeyType,
        Validator: StakingHashValidatorType,
        new_stakekey: new FuncType([PubKeyHashType], StakingHashStakeKeyType),
        new_validator: new FuncType(
            [StakingValidatorHashType],
            StakingHashValidatorType
        )
    })
})

/**
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
})

/**
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
})

/**
 * @type {ScriptHashType}
 */
export const StakingValidatorHashType = new ScriptHashType(
    "StakingValidatorHash",
    "StakingValidatorHash"
)

/**
 * @type {ScriptHashType}
 */
export const ValidatorHashType = new ScriptHashType(
    "ValidatorHash",
    "ValidatorHash"
)
