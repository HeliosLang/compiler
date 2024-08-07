import { None, expectSome } from "@helios-lang/type-utils"
import { FTPP } from "../codegen/ParametricName.js"
import {
    Common,
    DataEntity,
    FuncType,
    GenericEnumMemberType,
    GenericType,
    NamedNamespace
} from "./common.js"
import {
    IteratorType$,
    ListType$,
    MapType$,
    OptionType$
} from "./containers.js"
import {
    DatumHashType,
    MintingPolicyHashType,
    PubKeyHashType,
    scriptHashType,
    ScriptHashType,
    StakingHashType,
    ValidatorHashType
} from "./hashes.js"
import { ValueType } from "./money.js"
import { Parameter } from "./Parameter.js"
import { ParametricFunc } from "./ParametricFunc.js"
import { DefaultTypeClass } from "./parametric.js"
import {
    BoolType,
    ByteArrayType,
    IntType,
    RawDataType,
    StringType,
    genCommonInstanceMembers,
    genCommonTypeMembers,
    genCommonEnumTypeMembers
} from "./primitives.js"
import { TimeRangeType, TimeType } from "./time.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("./common.js").InferenceMap} InferenceMap
 * @typedef {import("./common.js").DataType} DataType
 * @typedef {import("./common.js").EnumMemberType} EnumMemberType
 * @typedef {import("./common.js").Named} Named
 * @typedef {import("./common.js").Type} Type
 * @typedef {import("./common.js").Typed} Typed
 * @typedef {import("./common.js").InstanceMembers} InstanceMembers
 * @typedef {import("./common.js").TypeMembers} TypeMembers
 * @typedef {import("./common.js").TypeSchema} TypeSchema
 */

/**
 * Buitin Address type
 * @type {DataType}
 */
export const AddressType = new GenericType({
    name: "Address",
    genTypeSchema: (self, parents) => ({
        kind: "internal",
        name: "Address"
    }),
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        credential: SpendingCredentialType,
        staking_credential: OptionType$(StakingCredentialType),
        is_staked: new FuncType([], BoolType),
        to_bytes: new FuncType([], ByteArrayType),
        to_hex: new FuncType([], StringType)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        new: new FuncType(
            [SpendingCredentialType, OptionType$(StakingCredentialType)],
            self
        ),
        new_empty: new FuncType([], self),
        from_bytes: new FuncType([ByteArrayType], self),
        from_hex: new FuncType([StringType], self),
        from_validator: new FuncType([ValidatorHashType], self)
    })
})

/**
 * @type {DataType}
 */
export const DCertType = new GenericType({
    name: "DCert",
    genTypeSchema: (self, parents) => ({
        kind: "internal",
        name: "DCert"
    }),
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        Delegate: DCertDelegateType,
        Deregister: DCertDeregisterType,
        Register: DCertRegisterType,
        RegisterPool: DCertRegisterPoolType,
        RetirePool: DCertRetirePoolType,
        new_delegate: new FuncType(
            [StakingCredentialType, PubKeyHashType],
            DCertDelegateType
        ),
        new_deregister: new FuncType(
            [StakingCredentialType],
            DCertDeregisterType
        ),
        new_register: new FuncType([StakingCredentialType], DCertRegisterType),
        new_register_pool: new FuncType(
            [PubKeyHashType, PubKeyHashType],
            DCertRegisterPoolType
        ),
        new_retire_pool: new FuncType(
            [PubKeyHashType, IntType],
            DCertRetirePoolType
        )
    })
})

/**
 * @type {EnumMemberType}
 */
const DCertDelegateType = new GenericEnumMemberType({
    name: "Delegate",
    constrIndex: 2,
    parentType: DCertType,
    genTypeSchema: (self, parents) => ({
        kind: "variant",
        tag: 2,
        id: expectSome(self.asDataType).path,
        name: "Delegate",
        fieldTypes: [
            {
                name: "delegator",
                type: StakingCredentialType.toSchema(parents)
            },
            {
                name: "pool_id",
                type: PubKeyHashType.toSchema(parents)
            }
        ]
    }),
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        delegator: StakingCredentialType,
        pool_id: PubKeyHashType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, DCertType)
    })
})

/**
 * @type {EnumMemberType}
 */
const DCertDeregisterType = new GenericEnumMemberType({
    name: "Deregister",
    constrIndex: 1,
    parentType: DCertType,
    genTypeSchema: (self, parents) => ({
        kind: "variant",
        tag: 1,
        id: expectSome(self.asDataType).path,
        name: "Deregister",
        fieldTypes: [
            {
                name: "credential",
                type: StakingCredentialType.toSchema(parents)
            }
        ]
    }),
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        credential: StakingCredentialType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, DCertType)
    })
})

/**
 * @type {EnumMemberType}
 */
const DCertRegisterType = new GenericEnumMemberType({
    name: "Register",
    constrIndex: 0,
    parentType: DCertType,
    genTypeSchema: (self, parents) => ({
        kind: "variant",
        tag: 0,
        id: expectSome(self.asDataType).path,
        name: "Register",
        fieldTypes: [
            {
                name: "credential",
                type: StakingCredentialType.toSchema(parents)
            }
        ]
    }),
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        credential: StakingCredentialType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, DCertType)
    })
})

/**
 * @type {EnumMemberType}
 */
const DCertRegisterPoolType = new GenericEnumMemberType({
    name: "RegisterPool",
    constrIndex: 3,
    parentType: DCertType,
    genTypeSchema: (self, parents) => ({
        kind: "variant",
        tag: 3,
        id: expectSome(self.asDataType).path,
        name: "RegisterPool",
        fieldTypes: [
            {
                name: "pool_id",
                type: PubKeyHashType.toSchema(parents)
            },
            {
                name: "pool_vrf",
                type: PubKeyHashType.toSchema(parents)
            }
        ]
    }),
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        pool_id: PubKeyHashType,
        pool_vrf: PubKeyHashType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, DCertType)
    })
})

/**
 * @type {EnumMemberType}
 */
const DCertRetirePoolType = new GenericEnumMemberType({
    name: "RetirePool",
    constrIndex: 4,
    parentType: DCertType,
    genTypeSchema: (self, parents) => ({
        kind: "variant",
        tag: 4,
        id: expectSome(self.asDataType).path,
        name: "RetirePool",
        fieldTypes: [
            {
                name: "pool_id",
                type: PubKeyHashType.toSchema(parents)
            },
            {
                name: "epoch",
                type: IntType.toSchema(parents)
            }
        ]
    }),
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        pool_id: PubKeyHashType,
        epoch: IntType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, DCertType)
    })
})

/**
 * Builtin Credential type
 * @type {DataType}
 */
export const SpendingCredentialType = new GenericType({
    name: "SpendingCredential",
    genTypeSchema: (self, parents) => ({
        kind: "internal",
        name: "SpendingCredential"
    }),
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        PubKey: SpendingCredentialPubKeyType,
        Validator: SpendingCredentialValidatorType,
        new_pubkey: new FuncType(
            [PubKeyHashType],
            SpendingCredentialPubKeyType
        ),
        new_validator: new FuncType(
            [ValidatorHashType],
            SpendingCredentialValidatorType
        )
    })
})

/**
 * Builtin SpendingCredential::PubKey
 */
const SpendingCredentialPubKeyType = new GenericEnumMemberType({
    name: "PubKey",
    constrIndex: 0,
    fieldNames: ["hash"],
    parentType: SpendingCredentialType,
    genTypeSchema: (self, parents) => ({
        kind: "variant",
        tag: 0,
        id: expectSome(self.asDataType).path,
        name: "PubKey",
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
        ...genCommonEnumTypeMembers(self, SpendingCredentialType)
    })
})

/**
 * Builtin SpendingCredential::Validator type
 */
const SpendingCredentialValidatorType = new GenericEnumMemberType({
    name: "Validator",
    constrIndex: 1,
    fieldNames: ["hash"],
    parentType: SpendingCredentialType,
    genTypeSchema: (self, parents) => ({
        kind: "variant",
        tag: 1,
        id: expectSome(self.asDataType).path,
        name: "Validator",
        fieldTypes: [
            {
                name: "hash",
                type: ValidatorHashType.toSchema(parents)
            }
        ]
    }),
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        hash: ValidatorHashType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, SpendingCredentialType)
    })
})

/**
 * @type {DataType}
 */
export const TxOutputDatumType = new GenericType({
    name: "TxOutputDatum",
    path: "__helios__txoutputdatum",
    genTypeSchema: (self, parents) => ({
        kind: "internal",
        name: "TxOutputDatum"
    }),
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        inline: RawDataType
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        Hash: TxOutputDatumHashType,
        Inline: TxOutputDatumInlineType,
        None: TxOutputDatumNoneType,
        new_hash: new FuncType([DatumHashType], TxOutputDatumHashType),
        new_inline: (() => {
            const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass())

            return new ParametricFunc(
                [a],
                new FuncType([a.ref], TxOutputDatumInlineType)
            )
        })(),
        new_none: new FuncType([], TxOutputDatumNoneType)
    })
})

/**
 * @type {EnumMemberType}
 */
const TxOutputDatumHashType = new GenericEnumMemberType({
    name: "Hash",
    constrIndex: 1,
    parentType: TxOutputDatumType,
    genTypeSchema: (self, parents) => ({
        kind: "variant",
        tag: 1,
        id: expectSome(self.asDataType).path,
        name: "Hash",
        fieldTypes: [
            {
                name: "hash",
                type: DatumHashType.toSchema(parents)
            }
        ]
    }),
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        hash: DatumHashType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, TxOutputDatumType)
    })
})

/**
 * @type {EnumMemberType}
 */
const TxOutputDatumInlineType = new GenericEnumMemberType({
    name: "Inline",
    constrIndex: 2,
    parentType: TxOutputDatumType,
    genTypeSchema: (self, parents) => ({
        kind: "variant",
        tag: 2,
        id: expectSome(self.asDataType).path,
        name: "Inline",
        fieldTypes: [
            {
                name: "data",
                type: RawDataType.toSchema(parents)
            }
        ]
    }),
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        data: RawDataType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, TxOutputDatumType)
    })
})

/**
 * @type {EnumMemberType}
 */
const TxOutputDatumNoneType = new GenericEnumMemberType({
    name: "None",
    constrIndex: 0,
    parentType: TxOutputDatumType,
    genTypeSchema: (self, parents) => ({
        kind: "variant",
        tag: 0,
        id: expectSome(self.asDataType).path,
        name: "None",
        fieldTypes: []
    }),
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self)
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, TxOutputDatumType)
    })
})

/**
 * Base class for ScriptContext, ContractContext, Scripts and other "macro"-types
 */
export class MacroType extends Common {
    /**
     * @type {string[]}
     */
    get fieldNames() {
        return []
    }

    /**
     * @type {InstanceMembers}
     */
    get instanceMembers() {
        throw new Error("not yet implemented")
    }

    /**
     * @type {string}
     */
    get name() {
        throw new Error("not yet implemented")
    }

    /**
     * @type {string}
     */
    get path() {
        throw new Error("not yet implemented")
    }

    /**
     * @type {TypeMembers}
     */
    get typeMembers() {
        return {}
    }

    /**
     * @type {DataType}
     */
    get asDataType() {
        return this
    }

    /**
     * @type {Named}
     */
    get asNamed() {
        return this
    }

    /**
     * @type {Type}
     */
    get asType() {
        return this
    }

    /**
     * @param {Set<string>} parents
     * @returns {TypeSchema}
     */
    toSchema(parents = new Set()) {
        return {
            kind: "internal",
            name: "Data"
        }
    }

    /**
     * @param {Site} site
     * @param {InferenceMap} map
     * @param {null | Type} type
     * @returns {Type}
     */
    infer(site, map, type) {
        return this
    }

    /**
     * @param {Type} other
     * @returns {boolean}
     */
    isBaseOf(other) {
        throw new Error("not yet implemented")
    }

    /**
     * @returns {string}
     */
    toString() {
        return this.name
    }

    /**
     * @returns {Typed}
     */
    toTyped() {
        return new DataEntity(this)
    }
}

/**
 * @typedef {{[name: string]: ScriptHashType}} ScriptTypes
 */

/**
 * @typedef {{
 *   currentScript: string
 *   scriptTypes?: ScriptTypes
 * }} MultiValidatorInfo
 */

/**
 * @implements {DataType}
 */
export class ScriptsType extends MacroType {
    /**
     * @type {{[name: string]: Typed}}
     */
    #scripts

    /**
     * @param {ScriptTypes} scripts
     */
    constructor(scripts) {
        super()

        this.#scripts = {}

        for (let k in scripts) {
            this.#scripts[k] = scripts[k].toTyped()
        }
    }

    /**
     * @type {InstanceMembers}
     */
    get instanceMembers() {
        return {}
    }

    /**
     * @type {TypeMembers}
     */
    get typeMembers() {
        return {
            ...this.#scripts
        }
    }

    /**
     * @type {string}
     */
    get name() {
        return "Scripts"
    }

    /**
     * @type {string}
     */
    get path() {
        return "__helios__scripts"
    }

    /**
     * @param {Type} other
     * @returns {boolean}
     */
    isBaseOf(other) {
        return other instanceof ScriptsType
    }

    /**
     * @returns {boolean}
     */
    isEmpty() {
        return Object.keys(this.#scripts).length == 0
    }
}

/**
 * @implements {DataType}
 */
export class ContractContextType extends MacroType {
    constructor() {
        super()
    }

    /**
     * @type {InstanceMembers}
     */
    get instanceMembers() {
        return {
            now: new FuncType([], TimeType),
            agent: WalletType,
            network: NetworkType,
            new_tx_builder: new FuncType([], TxBuilderType)
        }
    }

    /**
     * @type {string}
     */
    get name() {
        return "ContractContext"
    }

    /**
     * @type {string}
     */
    get path() {
        return "__helios__contractcontext"
    }

    /**
     * @param {Type} other
     * @returns {boolean}
     */
    isBaseOf(other) {
        return other instanceof ContractContextType
    }
}

export const WalletType = new GenericType({
    name: "Wallet",
    genInstanceMembers: (self) => ({
        address: AddressType,
        hash: PubKeyHashType,
        pick: new FuncType([ValueType], ListType$(TxInputType))
    }),
    genTypeMembers: (self) => ({})
})

export const NetworkType = new GenericType({
    name: "Network",
    genInstanceMembers: (self) => ({
        pick: new FuncType([AddressType, ValueType], ListType$(TxInputType)),
        get: new FuncType([TxOutputIdType], TxInputType),
        utxos_at: new FuncType([AddressType], IteratorType$([TxInputType]))
    }),
    genTypeMembers: (self) => ({})
})

/**
 * Builtin ScriptPurpose type (Minting| Spending| Rewarding | Certifying)
 * @type {DataType}
 */
export const ScriptPurposeType = new GenericType({
    name: "ScriptPurpose",
    genTypeSchema: (self, parents) => ({
        kind: "internal",
        name: "ScriptPurpose"
    }),
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        Certifying: ScriptPurposeCertifyingType,
        Minting: ScriptPurposeMintingType,
        Rewarding: ScriptPurposeTypeRewarding,
        Spending: ScriptPurposeSpendingType,
        new_certifying: new FuncType([DCertType], ScriptPurposeCertifyingType),
        new_minting: new FuncType(
            [MintingPolicyHashType],
            ScriptPurposeMintingType
        ),
        new_rewarding: new FuncType(
            [StakingCredentialType],
            ScriptPurposeTypeRewarding
        ),
        new_spending: new FuncType([TxOutputIdType], ScriptPurposeSpendingType)
    })
})

/**
 * Builtin ScriptPurpose::Certifying
 * @type {EnumMemberType}
 */
const ScriptPurposeCertifyingType = new GenericEnumMemberType({
    name: "Certifying",
    constrIndex: 3,
    parentType: ScriptPurposeType,
    genTypeSchema: (self, parents) => ({
        kind: "variant",
        tag: 3,
        id: expectSome(self.asDataType).path,
        name: "Certifying",
        fieldTypes: [
            {
                name: "dcert",
                type: DCertType.toSchema(parents)
            }
        ]
    }),
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        dcert: DCertType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, ScriptPurposeType)
    })
})

/**
 * Builtin ScriptPurpose::Minting
 * @type {EnumMemberType}
 */
const ScriptPurposeMintingType = new GenericEnumMemberType({
    name: "Minting",
    constrIndex: 0,
    parentType: ScriptPurposeType,
    genTypeSchema: (self, parents) => ({
        kind: "variant",
        name: "Minting",
        tag: 0,
        id: expectSome(self.asDataType).path,
        fieldTypes: [
            {
                name: "policy_hash",
                type: MintingPolicyHashType.toSchema(parents)
            }
        ]
    }),
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        policy_hash: MintingPolicyHashType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, ScriptPurposeType)
    })
})

/**
 * Builtin ScriptPurpose::Rewarding
 * @type {EnumMemberType}
 */
const ScriptPurposeTypeRewarding = new GenericEnumMemberType({
    name: "Rewarding",
    constrIndex: 2,
    parentType: ScriptPurposeType,
    genTypeSchema: (self, parents) => ({
        kind: "variant",
        name: "Rewarding",
        tag: 2,
        id: expectSome(self.asDataType).path,
        fieldTypes: [
            {
                name: "credential",
                type: StakingCredentialType.toSchema(parents)
            }
        ]
    }),
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        credential: StakingCredentialType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, ScriptPurposeType)
    })
})

/**
 * Builtin ScriptPurpose::Spending
 * @type {EnumMemberType}
 */
const ScriptPurposeSpendingType = new GenericEnumMemberType({
    name: "Spending",
    constrIndex: 1,
    parentType: ScriptPurposeType,
    genTypeSchema: (self, parents) => ({
        kind: "variant",
        name: "Spending",
        tag: 1,
        id: expectSome(self.asDataType).path,
        fieldTypes: [
            {
                name: "output_id",
                type: TxOutputIdType.toSchema(parents)
            }
        ]
    }),
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        output_id: TxOutputIdType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, ScriptPurposeType)
    })
})

/**
 * Builtin StakingCredential type
 * @type {DataType}
 */
export const StakingCredentialType = new GenericType({
    name: "StakingCredential",
    genTypeSchema: (self, parents) => ({
        kind: "internal",
        name: "StakingCredential"
    }),
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        Hash: StakingCredentialHashType,
        Ptr: StakingCredentialPtrType,
        new_hash: new FuncType([StakingHashType], StakingCredentialHashType),
        new_ptr: new FuncType(
            [IntType, IntType, IntType],
            StakingCredentialPtrType
        )
    })
})

/**
 * Builtin StakingCredential::Hash
 * @type {EnumMemberType}
 */
const StakingCredentialHashType = new GenericEnumMemberType({
    name: "Hash",
    constrIndex: 0,
    parentType: StakingCredentialType,
    fieldNames: ["hash"],
    genTypeSchema: (self, parents) => ({
        kind: "variant",
        tag: 0,
        id: expectSome(self.asDataType).path,
        name: "Hash",
        fieldTypes: [
            {
                name: "hash",
                type: StakingHashType.toSchema(parents)
            }
        ]
    }),
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        hash: StakingHashType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, StakingCredentialType)
    })
})

/**
 * Builtin StakingCredential::Ptr
 * @type {EnumMemberType}
 */
const StakingCredentialPtrType = new GenericEnumMemberType({
    name: "Ptr",
    constrIndex: 1,
    parentType: StakingCredentialType,
    genTypeSchema: (self, parents) => ({
        kind: "variant",
        tag: 1,
        id: expectSome(self.asDataType).path,
        name: "Ptr",
        fieldTypes: []
    }),
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self)
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, StakingCredentialType)
    })
})

/**
 * Builtin StakingPurpose type (Rewarding or Certifying)
 * @type {DataType}
 */
export const StakingPurposeType = new GenericType({
    name: "StakingPurpose",
    genTypeSchema: (self, parents) => ({
        kind: "internal",
        name: "StakingPurpose"
    }),
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        Certifying: StakingPurposeCertifyingType,
        Rewarding: StakingPurposeRewardingType
    })
})

/**
 * Builtin ScriptPurpose::Minting
 * @type {EnumMemberType}
 */
const StakingPurposeCertifyingType = new GenericEnumMemberType({
    name: "Certifying",
    constrIndex: 3,
    parentType: StakingPurposeType,
    genTypeSchema: (self, parents) => ({
        kind: "variant",
        tag: 3,
        id: expectSome(self.asDataType).path,
        name: "Certifying",
        fieldTypes: [
            {
                name: "dcert",
                type: DCertType.toSchema(parents)
            }
        ]
    }),
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        dcert: DCertType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, StakingPurposeType)
    })
})

/**
 * Builtin ScriptPurpose::Minting
 * @type {EnumMemberType}
 */
const StakingPurposeRewardingType = new GenericEnumMemberType({
    name: "Rewarding",
    constrIndex: 2,
    parentType: StakingPurposeType,
    genTypeSchema: (self, parents) => ({
        kind: "variant",
        name: "Rewarding",
        tag: 2,
        id: expectSome(self.asDataType).path,
        fieldTypes: [
            {
                name: "credential",
                type: StakingCredentialType.toSchema(parents)
            }
        ]
    }),
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        credential: StakingCredentialType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, StakingPurposeType)
    })
})

export const TxBuilderType = new GenericType({
    name: "TxBuilder",
    path: "__helios__txbuilder",
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        add_output: new FuncType([TxOutputType], self),
        add_outputs: new FuncType([ListType$(TxOutputType)], self),
        add_ref_input: new FuncType([TxInputType], self),
        add_signer: new FuncType([PubKeyHashType], self),
        finalize: new FuncType([], TxType),
        pay: (() => {
            const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass())
            return new ParametricFunc(
                [a],
                new FuncType([AddressType, ValueType, a.ref], self)
            )
        })(),
        pay_if_true: (() => {
            const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass())
            return new ParametricFunc(
                [a],
                new FuncType([BoolType, AddressType, ValueType, a.ref], self)
            )
        })(),
        mint: (() => {
            const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass())
            return new ParametricFunc(
                [a],
                new FuncType([ValueType, a.ref], self)
            )
        })(),
        redeem: (() => {
            const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass())
            return new ParametricFunc(
                [a],
                new FuncType([TxInputType, a.ref], self)
            )
        })(),
        redeem_many: (() => {
            const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass())
            return new ParametricFunc(
                [a],
                new FuncType([ListType$(TxInputType), a.ref], self)
            )
        })(),
        spend: new FuncType([TxInputType], self),
        spend_many: new FuncType([ListType$(TxInputType)], self)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self)
    })
})

/**
 * Builtin Tx type
 * @type {DataType}
 */
export const TxType = new GenericType({
    name: "Tx",
    genTypeSchema: (self, parents) => ({
        kind: "internal",
        name: "Tx"
    }),
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        inputs: ListType$(TxInputType),
        ref_inputs: ListType$(TxInputType),
        outputs: ListType$(TxOutputType),
        fee: ValueType,
        minted: ValueType,
        dcerts: ListType$(DCertType),
        withdrawals: MapType$(StakingCredentialType, IntType),
        time_range: TimeRangeType,
        signatories: ListType$(PubKeyHashType),
        redeemers: MapType$(ScriptPurposeType, RawDataType),
        datums: MapType$(DatumHashType, RawDataType),
        id: TxIdType,
        find_datum_hash: (() => {
            const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass())

            return new ParametricFunc([a], new FuncType([a.ref], DatumHashType))
        })(),
        get_datum_data: new FuncType([TxOutputType], RawDataType),
        outputs_sent_to: new FuncType(
            [PubKeyHashType],
            ListType$(TxOutputType)
        ),
        outputs_sent_to_datum: (() => {
            const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass())

            return new ParametricFunc(
                [a],
                new FuncType(
                    [PubKeyHashType, a.ref, BoolType],
                    ListType$(TxOutputType)
                )
            )
        })(),
        outputs_locked_by: new FuncType(
            [ValidatorHashType],
            ListType$(TxOutputType)
        ),
        outputs_locked_by_datum: (() => {
            const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass())

            return new ParametricFunc(
                [a],
                new FuncType(
                    [ValidatorHashType, a.ref, BoolType],
                    ListType$(TxOutputType)
                )
            )
        })(),
        value_sent_to: new FuncType([PubKeyHashType], ValueType),
        value_sent_to_datum: (() => {
            const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass())

            return new ParametricFunc(
                [a],
                new FuncType([PubKeyHashType, a.ref, BoolType], ValueType)
            )
        })(),
        value_locked_by: new FuncType([ValidatorHashType], ValueType),
        value_locked_by_datum: (() => {
            const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass())

            return new ParametricFunc(
                [a],
                new FuncType([ValidatorHashType, a.ref, BoolType], ValueType)
            )
        })(),
        value_paid_to: (() => {
            const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass())

            return new ParametricFunc(
                [a],
                new FuncType([AddressType, a.ref], ValueType)
            )
        })(),
        is_approved_by: new FuncType([SpendingCredentialType], BoolType),
        is_signed_by: new FuncType([PubKeyHashType], BoolType)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        new: (() => {
            const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass())
            const b = new Parameter("b", `${FTPP}1`, new DefaultTypeClass())

            return new ParametricFunc(
                [a, b],
                new FuncType(
                    [
                        ListType$(TxInputType), // 0
                        ListType$(TxInputType), // 1
                        ListType$(TxOutputType), // 2
                        ValueType, // 3
                        ValueType, // 4
                        ListType$(DCertType), // 5
                        MapType$(StakingCredentialType, IntType), // 6
                        TimeRangeType, // 7
                        ListType$(PubKeyHashType), // 8
                        MapType$(ScriptPurposeType, a.ref), // 9
                        MapType$(DatumHashType, b.ref), // 10
                        TxIdType // 11
                    ],
                    self
                )
            )
        })()
    })
})

/**
 * Builtin TxId type
 * @type {DataType}
 */
export const TxIdType = new GenericType({
    name: "TxId",
    genTypeSchema: (self, parents) => ({
        kind: "internal",
        name: "TxId"
    }),
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        bytes: ByteArrayType
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        __geq: new FuncType([self, self], BoolType),
        __gt: new FuncType([self, self], BoolType),
        __leq: new FuncType([self, self], BoolType),
        __lt: new FuncType([self, self], BoolType),
        new: new FuncType([ByteArrayType], self)
    })
})

/**
 * Builtin TxInput type
 * @type {DataType}
 */
export const TxInputType = new GenericType({
    name: "TxInput",
    genTypeSchema: (self, parents) => ({
        kind: "internal",
        name: "TxInput"
    }),
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        output_id: TxOutputIdType,
        output: TxOutputType,
        address: AddressType,
        value: ValueType,
        datum: TxOutputDatumType
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        new: new FuncType([TxOutputIdType, TxOutputType], self)
    })
})

/**
 * Builtin TxOutput type
 * @type {DataType}
 */
export const TxOutputType = new GenericType({
    name: "TxOutput",
    genTypeSchema: (self, parents) => ({
        kind: "internal",
        name: "TxOutput"
    }),
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        address: AddressType,
        value: ValueType,
        datum: TxOutputDatumType,
        ref_script_hash: OptionType$(scriptHashType)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        new: new FuncType([AddressType, ValueType, TxOutputDatumType], self)
    })
})

/**
 * Builtin TxOutputId type
 * @type {DataType}
 */
export const TxOutputIdType = new GenericType({
    name: "TxOutputId",
    genTypeSchema: (self, parents) => ({
        kind: "internal",
        name: "TxOutputId"
    }),
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        tx_id: TxIdType,
        index: IntType
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        __geq: new FuncType([self, TxOutputIdType], BoolType),
        __gt: new FuncType([self, TxOutputIdType], BoolType),
        __leq: new FuncType([self, TxOutputIdType], BoolType),
        __lt: new FuncType([self, TxOutputIdType], BoolType),
        new: new FuncType([TxIdType, IntType], TxOutputIdType)
    })
})

export const MixedArgsType = new GenericType({
    name: "MixedArgs",
    genTypeSchema: (self, parents) => ({
        kind: "internal",
        name: "Data"
    }),
    genInstanceMembers: (self) => ({}),
    genTypeMembers: (self) => ({
        Other: MixedArgsOtherType,
        Spending: MixedArgsSpendingType
    })
})

const MixedArgsOtherType = new GenericEnumMemberType({
    name: "Other",
    constrIndex: 0,
    parentType: MixedArgsType,
    genTypeSchema: (self, parents) => ({
        kind: "variant",
        name: "Other",
        tag: 0,
        id: expectSome(self.asDataType).path,
        fieldTypes: [
            {
                name: "redeemer",
                type: RawDataType.toSchema(parents)
            }
        ]
    }),
    genInstanceMembers: (self) => ({
        redeemer: RawDataType
    }),
    genTypeMembers: (self) => ({})
})

const MixedArgsSpendingType = new GenericEnumMemberType({
    name: "Spending",
    constrIndex: 1,
    parentType: MixedArgsType,
    genTypeSchema: (self, parents) => ({
        kind: "variant",
        name: "Spending",
        tag: 1,
        id: expectSome(self.asDataType).path,
        fieldTypes: [
            {
                name: "datum",
                type: RawDataType.toSchema(parents)
            },
            {
                name: "redeemer",
                type: RawDataType.toSchema(parents)
            }
        ]
    }),
    genInstanceMembers: (self) => ({
        datum: RawDataType,
        redeemer: RawDataType
    }),
    genTypeMembers: (self) => ({})
})

/**
 * @returns {NamedNamespace}
 */
export function Cip67Namespace() {
    return new NamedNamespace("Cip67", "__helios__cip67", {
        fungible_token_label: new DataEntity(ByteArrayType),
        reference_token_label: new DataEntity(ByteArrayType),
        user_token_label: new DataEntity(ByteArrayType)
    })
}

/**
 *
 * @param {ScriptTypes} scriptTypes
 * @returns {GenericType}
 */
function createScriptType(scriptTypes) {
    const keys = Object.keys(scriptTypes).sort()

    const scriptEnumType = new GenericType({
        name: "Script",
        genInstanceMembers: (self) => ({}),
        genTypeMembers: (self) => ({
            ...Object.fromEntries(children)
        })
    })

    /**
     * @type {[string, GenericEnumMemberType][]}
     */
    const children = keys.map((k, i) => {
        return [
            k,
            new GenericEnumMemberType({
                name: k,
                constrIndex: i,
                parentType: expectSome(scriptEnumType),
                genTypeSchema: (self, parents) => ({
                    kind: "variant",
                    tag: i,
                    name: k,
                    id: expectSome(self.asDataType).path,
                    fieldTypes: []
                }),
                genInstanceMembers: (self) => ({}),
                genTypeMembers: (self) => ({})
            })
        ]
    })

    return scriptEnumType
}

/**
 * @param {MultiValidatorInfo} info
 * @returns {NamedNamespace}
 */
export function ScriptContextNamespace(info) {
    // TODO: generate an EnumType for the scripts
    /**
     * @type {Option<GenericType>}
     */
    let scriptEnum = None

    if (
        info.currentScript &&
        info.scriptTypes &&
        info.currentScript in info.scriptTypes
    ) {
        scriptEnum = createScriptType(info.scriptTypes)
    }

    return new NamedNamespace("ScriptContext", "__helios__scriptcontext", {
        ...(scriptEnum
            ? { Script: scriptEnum, current_script: new DataEntity(scriptEnum) }
            : {}),
        get_current_minting_policy_hash: new FuncType(
            [],
            MintingPolicyHashType
        ),
        get_current_input: new FuncType([], TxInputType),
        get_cont_outputs: new FuncType([], ListType$(TxOutputType)),
        get_current_validator_hash: new FuncType([], ValidatorHashType),
        get_spending_purpose_output_id: new FuncType([], TxOutputIdType),
        get_staking_purpose: new FuncType([], StakingPurposeType),
        new_certifying: new FuncType([TxType, DCertType], RawDataType),
        new_minting: new FuncType([TxType, MintingPolicyHashType], RawDataType),
        new_rewarding: new FuncType(
            [TxType, StakingCredentialType],
            RawDataType
        ),
        new_spending: new FuncType([TxType, TxOutputIdType], RawDataType),
        purpose: new DataEntity(ScriptPurposeType),
        tx: new DataEntity(TxType)
    })
}
