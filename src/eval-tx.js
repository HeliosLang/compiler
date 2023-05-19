//@ts-check
// Eval tx types

import {
    assertDefined
} from "./utils.js";

import {
    Site,
    FTPP
} from "./tokens.js";

import {
    Address,
	HeliosData,
    TxId
} from "./helios-data.js";

/**
 * @template {HeliosData} T
 * @typedef {import("./helios-data.js").HeliosDataClass<T>} HeliosDataClass
 */

import {
    ScriptPurpose
} from "./uplc-ast.js";

import {
    Common,
    DataEntity,
    FuncType,
    GenericEnumMemberType,
    GenericType,
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
 * @typedef {import("./eval-common.js").Typed} Typed
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
    IntType,
    RawDataType,
    StringType,
    genCommonInstanceMembers,
    genCommonTypeMembers,
    genCommonEnumTypeMembers
} from "./eval-primitives.js";

import { 
    Parameter,
    ParametricFunc,
    DefaultTypeClass 
} from "./eval-parametric.js";

import {
    ListType$,
    MapType$,
    OptionType$
} from "./eval-containers.js";

import {
    TimeRangeType
} from "./eval-time.js";

import {
    DatumHashType,
    MintingPolicyHashType,
    PubKeyHashType,
    ScriptHashType,
    StakingHashType,
    ValidatorHashType
} from "./eval-hashes.js";

import {
    ValueType
} from "./eval-money.js";

/**
 * Buitin Address type
 * @package
 * @type {DataType}
 */
export const AddressType = new GenericType({
    name: "Address",
    offChainType: Address,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        credential: CredentialType,
        staking_credential: OptionType$(StakingCredentialType)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        new: new FuncType([CredentialType, OptionType$(StakingCredentialType)], self),
        new_empty: new FuncType([], self)
    })
});

/**
 * @package
 * @type {DataType}
 */
export const DCertType = new GenericType({
    name: "DCert",
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
        new_delegate: new FuncType([StakingCredentialType, PubKeyHashType], DCertDelegateType),
        new_deregister: new FuncType([StakingCredentialType], DCertDeregisterType),
        new_register: new FuncType([StakingCredentialType], DCertRegisterType),
        new_register_pool: new FuncType([PubKeyHashType, PubKeyHashType], DCertRegisterPoolType),
        new_retire_pool: new FuncType([PubKeyHashType, IntType], DCertRetirePoolType)
    })
});

/**
 * @package
 * @type {EnumMemberType}
 */
const DCertDelegateType = new GenericEnumMemberType({
    name: "Delegate",
    constrIndex: 2,
    parentType: DCertType,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        delegator: StakingCredentialType,
		pool_id: PubKeyHashType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, DCertType)
    })
});

/**
 * @package
 * @type {EnumMemberType}
 */
const DCertDeregisterType = new GenericEnumMemberType({
    name: "Deregister",
    constrIndex: 1,
    parentType: DCertType,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        credential: StakingCredentialType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, DCertType)
    })
});

/**
 * @package
 * @type {EnumMemberType}
 */
const DCertRegisterType = new GenericEnumMemberType({
    name: "Register",
    constrIndex: 0,
    parentType: DCertType,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        credential: StakingCredentialType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, DCertType)
    })
});

/**
 * @package
 * @type {EnumMemberType}
 */
const DCertRegisterPoolType = new GenericEnumMemberType({
    name: "RegisterPool",
    constrIndex: 3,
    parentType: DCertType,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        pool_id: PubKeyHashType,
        pool_vrf: PubKeyHashType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, DCertType)
    })
});

/**
 * @package
 * @type {EnumMemberType}
 */
const DCertRetirePoolType = new GenericEnumMemberType({
    name: "RetirePool",
    constrIndex: 4,
    parentType: DCertType,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        pool_id: PubKeyHashType,
        epoch: IntType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, DCertType)
    })
});


/**
 * Builtin Credential type
 * @package
 * @type {DataType}
 */
export const CredentialType = new GenericType({
    name: "Credential",
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        PubKey: CredentialPubKeyType,
        Validator: CredentialValidatorType,
        new_pubkey: new FuncType([PubKeyHashType], CredentialPubKeyType),
        new_validator: new FuncType([ValidatorHashType], CredentialValidatorType)
    })
});


/**
 * Builtin Credential::PubKey
 */
const CredentialPubKeyType = new GenericEnumMemberType({
    name: "PubKey",
    constrIndex: 0,
    fieldNames: ["hash"],
    parentType: CredentialType,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        hash: PubKeyHashType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, CredentialType)
    })
});

/**
 * Builtin Credential::Validator type
 */
const CredentialValidatorType = new GenericEnumMemberType({
    name: "Validator",
    constrIndex: 1,
    fieldNames: ["hash"],
    parentType: CredentialType,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        hash: ValidatorHashType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, CredentialType)
    })
});

/**
 * @package
 * @type {DataType}
 */
export const OutputDatumType = new GenericType({
    name: "OutputDatum",
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        get_inline_data: new FuncType([], RawDataType)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        Hash: OutputDatumHashType,
        Inline: OutputDatumInlineType,
        None: OutputDatumNoneType,
        new_hash: new FuncType([DatumHashType], OutputDatumHashType),
		new_inline: (() => {
            const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass());

            return new ParametricFunc([a], new FuncType([a.ref], OutputDatumInlineType))
        })(),
        new_none: new FuncType([], OutputDatumNoneType)
    })
});

/**
 * @package
 * @type {EnumMemberType}
 */
const OutputDatumHashType = new GenericEnumMemberType({
    name: "Hash",
    constrIndex: 1,
    parentType: OutputDatumType,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        hash: DatumHashType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, OutputDatumType)
    })
});

/**
 * @package
 * @type {EnumMemberType}
 */
const OutputDatumInlineType = new GenericEnumMemberType({
    name: "Inline",
    constrIndex: 2,
    parentType: OutputDatumType,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        data: RawDataType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, OutputDatumType)
    })
});

/**
 * @package
 * @type {EnumMemberType}
 */
const OutputDatumNoneType = new GenericEnumMemberType({
    name: "None",
    constrIndex: 0,
    parentType: OutputDatumType,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self)
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, OutputDatumType)
    })
});

/**
 * Builtin ScriptContext type
 * @package
 * @implements {DataType}
 */
export class ScriptContextType extends Common {
    /**
     * @type {number}
     */
    #purpose;

    /**
     * @param {number} purpose 
     */
	constructor(purpose) {
		super();

        this.#purpose = assertDefined(purpose);
	}

    /**
     * @type {string[]}
     */
    get fieldNames() {
        return [];
    }

    /**
     * @type {string}
     */
    get name() {
        return "ScriptContext";
    }

    /**
     * @param {number} purpose
     * @returns {InstanceMembers}
     */
    static genPurposeInstanceMembers(purpose) {
        switch (purpose) {
            case ScriptPurpose.Minting:
                return {
                    get_current_minting_policy_hash: new FuncType([], MintingPolicyHashType)
                };
            case ScriptPurpose.Spending:
                return {
                    get_current_input: new FuncType([], TxInputType),
                    get_cont_outputs: new FuncType([], ListType$(TxOutputType)),
                    get_current_validator_hash: new FuncType([], ValidatorHashType),
                    get_spending_purpose_output_id: new FuncType([], TxOutputIdType)
                };
            case ScriptPurpose.Staking:
                return {
                    get_staking_purpose:new FuncType([], StakingPurposeType)
                };
            case ScriptPurpose.Testing:
            case -1:
                return {
                    ...ScriptContextType.genPurposeInstanceMembers(ScriptPurpose.Minting),
                    ...ScriptContextType.genPurposeInstanceMembers(ScriptPurpose.Spending),
                    ...ScriptContextType.genPurposeInstanceMembers(ScriptPurpose.Staking),
                };
            default:
                throw new Error(`unhandled ScriptPurpose ${purpose}`);
        }
    }
    /**
	 * @type {InstanceMembers}
	 */
	get instanceMembers() {
        return {
            ...genCommonInstanceMembers(this),
            ...ScriptContextType.genPurposeInstanceMembers(this.#purpose),
            get_script_purpose: new FuncType([], ScriptPurposeType),
            tx: TxType
        };
	}

    /**
     * @type {null | HeliosDataClass<HeliosData>}
     */
    get offChainType() {
        return null;
    }

    /**
     * @type {string}
     */
    get path() {
		return "__helios__scriptcontext";
	}

	/**
	 * @type {TypeMembers}
	 */
	get typeMembers() {
        return {
            ...genCommonTypeMembers(this),
            new_certifying: new FuncType([TxType, DCertType], new ScriptContextType(ScriptPurpose.Staking)),
            new_minting: new FuncType([TxType, MintingPolicyHashType], new ScriptContextType(ScriptPurpose.Minting)),
            new_rewarding: new FuncType([TxType, StakingCredentialType], new ScriptContextType(ScriptPurpose.Staking)),
            new_spending: new FuncType([TxType, TxOutputIdType], new ScriptContextType(ScriptPurpose.Spending))
        };
	}

    /**
     * @type {DataType}
     */
    get asDataType() {
        return this;
    }

    /**
     * @type {Named}
     */
    get asNamed() {
        return this;
    }

    /**
     * @type {Type}
     */
    get asType() {
        return this;
    }

    /**
     * @param {Site} site 
     * @param {Map<string, Type>} map 
     * @param {null | Type} type 
     * @returns {Type}
     */
    infer(site, map, type) {
        return this;
    }

    /**
     * @param {Type} other 
     * @returns {boolean}
     */
    isBaseOf(other) {
        return other instanceof ScriptContextType;
    }

    /**
     * @returns {string}
     */
	toString() {
		return this.name;
	}

    /**
     * @returns {Typed}
     */
    toTyped() {
        return new DataEntity(this);
    }
}

/**
 * Builtin ScriptPurpose type (Minting| Spending| Rewarding | Certifying)
 * @package
 * @type {DataType}
 */
export const ScriptPurposeType = new GenericType({
    name: "ScriptPurpose",
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
        new_minting: new FuncType([MintingPolicyHashType], ScriptPurposeMintingType),
        new_rewarding: new FuncType([StakingCredentialType], ScriptPurposeTypeRewarding),
        new_spending: new FuncType([TxOutputIdType], ScriptPurposeSpendingType), 
    })
}); 

/**
 * Builtin ScriptPurpose::Certifying
 * @package
 * @type {EnumMemberType}
 */
const ScriptPurposeCertifyingType = new GenericEnumMemberType({
    name: "Certifying",
    constrIndex: 3,
    parentType: ScriptPurposeType,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        dcert: DCertType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, ScriptPurposeType)
    })
});

/**
 * Builtin ScriptPurpose::Minting
 * @package
 * @type {EnumMemberType}
 */
const ScriptPurposeMintingType = new GenericEnumMemberType({
    name: "Minting",
    constrIndex: 0,
    parentType: ScriptPurposeType,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        policy_hash: MintingPolicyHashType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, ScriptPurposeType)
    })
});

/**
 * Builtin ScriptPurpose::Rewarding
 * @package
 * @type {EnumMemberType}
 */
const ScriptPurposeTypeRewarding = new GenericEnumMemberType({
    name: "Rewarding",
    constrIndex: 2,
    parentType: ScriptPurposeType,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        credential: StakingCredentialType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, ScriptPurposeType)
    })
});

/**
 * Builtin ScriptPurpose::Spending
 * @package
 * @type {EnumMemberType}
 */
const ScriptPurposeSpendingType = new GenericEnumMemberType({
    name: "Spending",
    constrIndex: 1,
    parentType: ScriptPurposeType,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        output_id: TxOutputIdType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, ScriptPurposeType)
    })
});

/**
 * Builtin StakingCredential type
 * @package
 * @type {DataType}
 */
export const StakingCredentialType = new GenericType({
    name: "StakingCredential",
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        Hash: StakingCredentialHashType,
        Ptr: StakingCredentialPtrType,
        new_hash: new FuncType([StakingHashType], StakingCredentialHashType),
        new_ptr: new FuncType([IntType, IntType, IntType], StakingCredentialPtrType)
    })
});

/**
 * Builtin StakingCredential::Hash
 * @package
 * @type {EnumMemberType}
 */
const StakingCredentialHashType = new GenericEnumMemberType({
    name: "Hash",
    constrIndex: 0,
    parentType: StakingCredentialType,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        hash: StakingHashType,
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, StakingCredentialType)
    })
});

/**
 * Builtin StakingCredential::Ptr
 * @package
 * @type {EnumMemberType}
 */
const StakingCredentialPtrType = new GenericEnumMemberType({
    name: "Ptr",
    constrIndex: 1,
    parentType: StakingCredentialType,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self)
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, StakingCredentialType)
    })
});

/**
 * Builtin StakingPurpose type (Rewarding or Certifying)
 * @package
 * @type {DataType}
 */
export const StakingPurposeType = new GenericType({
    name : "StakingPurpose",
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        Certifying: StakingPurposeCertifyingType,
        Rewarding: StakingPurposeRewardingType
    })
});

/**
 * Builtin ScriptPurpose::Minting
 * @package
 * @type {EnumMemberType}
 */
const StakingPurposeCertifyingType = new GenericEnumMemberType({
    name: "Certifying",
    constrIndex: 3,
    parentType: StakingPurposeType,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        dcert: DCertType
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, StakingPurposeType)
    })
});

/**
 * Builtin ScriptPurpose::Minting
 * @package
 * @type {EnumMemberType}
 */
const StakingPurposeRewardingType = new GenericEnumMemberType({
    name: "Rewarding",
    constrIndex: 2,
    parentType: StakingPurposeType,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        credential: StakingCredentialType,
    }),
    genTypeMembers: (self) => ({
        ...genCommonEnumTypeMembers(self, StakingPurposeType)
    })
});


/**
 * Builtin Tx type
 * @package
 * @type {DataType}
 */
export const TxType = new GenericType({
    name: "Tx",
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
            const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass());

            return new ParametricFunc([a], new FuncType([a.ref], DatumHashType))
        })(),
        get_datum_data: new FuncType([TxOutputType], RawDataType),
        outputs_sent_to: new FuncType([PubKeyHashType], ListType$(TxOutputType)),
        outputs_sent_to_datum: (() => {
            const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass());

            return new ParametricFunc([a], new FuncType([PubKeyHashType, a.ref, BoolType], ListType$(TxOutputType)))
        })(),
        outputs_locked_by: new FuncType([ValidatorHashType], ListType$(TxOutputType)),
        outputs_locked_by_datum: (() => {
            const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass());

            return new ParametricFunc([a], new FuncType([ValidatorHashType, a.ref, BoolType], ListType$(TxOutputType)))
        })(),
        value_sent_to: new FuncType([PubKeyHashType], ValueType),
        value_sent_to_datum: (() => {
            const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass());

            return new ParametricFunc([a], new FuncType([PubKeyHashType, a.ref, BoolType], ValueType));
        })(),
        value_locked_by: new FuncType([ValidatorHashType], ValueType),
        value_locked_by_datum: (() => {
            const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass());

            return new ParametricFunc([a], new FuncType([ValidatorHashType, a.ref, BoolType], ValueType));
        })(),
        value_paid_to: (() => {
            const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass());

            return new ParametricFunc([a], new FuncType([AddressType, a.ref], ValueType));
        })(),
        is_signed_by: new FuncType([PubKeyHashType], BoolType)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        new: (() => {
            const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass());
            const b = new Parameter("b", `${FTPP}1`, new DefaultTypeClass());
            
            return new ParametricFunc([a, b], new FuncType([
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
            ], self))
        })()
    })
});

/**
 * Builtin TxId type
 * @package
 * @type {DataType}
 */
export const TxIdType = new GenericType({
    name: "TxId",
    offChainType: TxId,
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        show: new FuncType([], StringType)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        __geq: new FuncType([self, self], BoolType),
        __gt: new FuncType([self, self], BoolType),
        __leq: new FuncType([self, self], BoolType),
        __lt: new FuncType([self, self], BoolType),
        new: new FuncType([ByteArrayType], self)
    })
});


/**
 * Builtin TxInput type
 * @package
 * @type {DataType}
 */
export const TxInputType = new GenericType({
    name: "TxInput",
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        output_id: TxOutputIdType,
        output: TxOutputType,
        address: AddressType,
        value: ValueType,
        datum: OutputDatumType
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        new: new FuncType([TxOutputIdType, TxOutputType], self)
    })
});

/**
 * Builtin TxOutput type
 * @package
 * @type {DataType}
 */
export const TxOutputType = new GenericType({
    name: "TxOutput",
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        address: AddressType,
        value: ValueType,
	    datum: OutputDatumType,
        ref_script_hash: OptionType$(ScriptHashType)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        new: new FuncType([AddressType, ValueType, OutputDatumType], self)
    })
});

/**
 * Builtin TxOutputId type
 * @package
 * @type {DataType}
 */
export const TxOutputIdType = new GenericType({
    name: "TxOutputId",
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
});