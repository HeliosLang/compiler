import { expectSome } from "@helios-lang/type-utils"
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
        bytes: ByteArrayType,
        to_script_hash: new FuncType([], scriptHashType)
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
        genTypeSchema: (self) => ({
            kind: /** @type {const} */ ("internal"),
            name: offchainTypeName
        })
    }
}

/**
 * @implements {DataType}
 */
export class ScriptHashType extends GenericType {
    /**
     *
     * @param {string } name
     * @param {string} offChainTypeName
     */
    constructor(name, offChainTypeName) {
        super({
            ...genHashTypeProps(offChainTypeName),
            name: name,
            genInstanceMembers: genHashInstanceMembers,
            genTypeMembers: (self) => ({
                ...genHashTypeMembers(self),
                from_script_hash: new FuncType([scriptHashType], self)
            })
        })
    }
}

/**
 * @type {ScriptHashType}
 */
export const scriptHashType = new ScriptHashType("ScriptHash", "ScriptHash")

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
    fieldNames: ["hash"],
    genTypeSchema: (self, parents) => ({
        kind: "variant",
        tag: 0,
        name: "StakeKey",
        id: expectSome(self.asDataType).path,
        fieldTypes: [
            {
                name: "hash",
                type: PubKeyHashType.toSchema(parents)
            }
        ]
    }),
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
    fieldNames: ["hash"],
    genTypeSchema: (self, parents) => ({
        kind: "variant",
        tag: 1,
        name: "Validator",
        id: expectSome(self.asDataType).path,
        fieldTypes: [
            {
                name: "hash",
                type: StakingValidatorHashType.toSchema(parents)
            }
        ]
    }),
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
