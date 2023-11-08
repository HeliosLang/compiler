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
    TxId,
    TxOutputId
} from "./helios-data.js";

/**
 * @template {HeliosData} T
 * @typedef {import("./helios-data.js").HeliosDataClass<T>} HeliosDataClass
 */

/**
 * @typedef {import("./uplc-ast.js").ScriptPurpose} ScriptPurpose
 */

import {
    Common,
    DataEntity,
    FuncType,
    GenericEnumMemberType,
    GenericType,
} from "./eval-common.js";

/**
 * @typedef {import("./eval-common.js").InferenceMap} InferenceMap
 */

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
    IteratorType$,
    ListType$,
    MapType$,
    OptionType$
} from "./eval-containers.js";

import {
    TimeRangeType, TimeType
} from "./eval-time.js";

import {
    DatumHashType,
    MintingPolicyHashType,
    PubKeyHashType,
    scriptHashType,
    ScriptHashType,
    StakingHashType,
    ValidatorHashType
} from "./eval-hashes.js";

import {
    ValueType
} from "./eval-money.js";

/**
 * Buitin Address type
 * @internal
 * @type {DataType}
 */
export const AddressType = new GenericType({
    name: "Address",
    offChainType: Address,
    genTypeDetails: (self) => ({
        inputType: "string | helios.Address",
        outputType: "helios.Address",
        internalType: {
            type: "Address"
        }
    }),
    jsToUplc: async (obj, helpers) => {
        return (Address.fromProps(obj))._toUplcData();
    },
    uplcToJs: async (data, helpers) => {
        return Address.fromUplcData(data);
    },
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        credential: CredentialType,
        staking_credential: OptionType$(StakingCredentialType),
        to_bytes: new FuncType([], ByteArrayType),
        to_hex: new FuncType([], StringType)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        new: new FuncType([CredentialType, OptionType$(StakingCredentialType)], self),
        new_empty: new FuncType([], self),
        from_bytes: new FuncType([ByteArrayType], self),
        from_hex: new FuncType([StringType], self)
    })
});

/**
 * @internal
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
 * @internal
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
 * @internal
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
 * @internal
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
 * @internal
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
 * @internal
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
 * @internal
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
 * @internal
 * @type {DataType}
 */
export const OutputDatumType = new GenericType({
    name: "OutputDatum",
    path: "__helios__outputdatum",
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
 * @internal
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
 * @internal
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
 * @internal
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
 * Base class for ScriptContext, ContractContext, Scripts and other "macro"-types
 * @internal
 */
export class MacroType extends Common {
    /**
     * @type {string[]}
     */
    get fieldNames() {
        return [];
    }

    /**
     * @type {InstanceMembers}
     */
    get instanceMembers() {
        throw new Error("not yet implemented");
    }

    /**
     * @type {string}
     */
    get name() {
        throw new Error("not yet implemented");
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
        throw new Error("not yet implemented");
    }

	/**
	 * @type {TypeMembers}
	 */
	get typeMembers() {
        return {};
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
     * @param {InferenceMap} map 
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
        throw new Error("not yet implemented");
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
 * @internal
 * @typedef {{[name: string]: ScriptHashType}} ScriptTypes
 */

/**
 * @internal
 * @implements {DataType}
 */
export class ScriptsType extends MacroType {
    /**
     * @type {{[name: string]: Typed}}
     */
    #scripts;

    /**
     * @param {ScriptTypes} scripts 
     */
    constructor(scripts) {
        super();

        this.#scripts = {};
        
        for (let k in scripts) {
            this.#scripts[k] = scripts[k].toTyped();
        }
    }

    /**
     * @type {InstanceMembers}
     */
     get instanceMembers() {
        return {};
    }

    /**
     * @type {TypeMembers}
     */
    get typeMembers() {
        return {
            ...this.#scripts
        };
    }

    /**
     * @type {string}
     */
    get name() {
        return "Scripts";
    }

    /**
     * @type {string}
     */
    get path() {
        return "__helios__scripts";
    }

    /**
     * @param {Type} other 
     * @returns {boolean}
     */
    isBaseOf(other) {
        return other instanceof ScriptsType;
    }

    /**
     * @returns {boolean}
     */
    isEmpty() {
        return Object.keys(this.#scripts).length == 0;
    }
}

/**
 * Builtin ScriptContext type
 * @internal
 * @implements {DataType}
 */
export class ScriptContextType extends MacroType {
	constructor() {
		super();
	}

    /**
     * @type {string}
     */
    get name() {
        return "ScriptContext";
    }

    /**
	 * @type {InstanceMembers}
	 */
	get instanceMembers() {
        const members = {
            ...genCommonInstanceMembers(this),
            get_current_minting_policy_hash: new FuncType([], MintingPolicyHashType),
            get_current_input: new FuncType([], TxInputType),
            get_cont_outputs: new FuncType([], ListType$(TxOutputType)),
            get_current_validator_hash: new FuncType([], ValidatorHashType),
            get_spending_purpose_output_id: new FuncType([], TxOutputIdType),
            get_staking_purpose:new FuncType([], StakingPurposeType),
            get_script_purpose: new FuncType([], ScriptPurposeType),
            tx: TxType
        };
        
        return members;
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
            new_certifying: new FuncType([TxType, DCertType], new ScriptContextType()),
            new_minting: new FuncType([TxType, MintingPolicyHashType], new ScriptContextType()),
            new_rewarding: new FuncType([TxType, StakingCredentialType], new ScriptContextType()),
            new_spending: new FuncType([TxType, TxOutputIdType], new ScriptContextType())
        };
	}

    /**
     * @param {Type} other 
     * @returns {boolean}
     */
    isBaseOf(other) {
        return other instanceof ScriptContextType;
    }
}

/**
 * Builtin ScriptContext type
 * @internal
 * @implements {DataType}
 */
export class ContractContextType extends MacroType {
    constructor() {
        super();
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
        };
	}

    /**
     * @type {string}
     */
    get name() {
        return "ContractContext";
    }

    /**
     * @type {string}
     */
    get path() {
        return "__helios__contractcontext";
    }

    /**
     * @param {Type} other 
     * @returns {boolean}
     */
    isBaseOf(other) {
        return other instanceof ContractContextType;
    }
}

/**
 * @internal
 */
export const WalletType = new GenericType({
    name: "Wallet",
    genInstanceMembers: (self) => ({
        address: AddressType,
        hash: PubKeyHashType,
        pick: new FuncType([ValueType], ListType$(TxInputType))
    }),
    genTypeMembers: (self) => ({})
});

/**
 * Does this really need to be a class? (i.e. will it be instantiated with some properties)
 * @internal
 */
export const NetworkType = new GenericType({
    name: "Network",
    genInstanceMembers: (self) => ({
        pick: new FuncType([AddressType, ValueType], ListType$(TxInputType)),
        get: new FuncType([TxOutputIdType], TxInputType),
        utxos_at: new FuncType([AddressType], IteratorType$([TxInputType]))
    }),
    genTypeMembers: (self) => ({}),
});

/**
 * Builtin ScriptPurpose type (Minting| Spending| Rewarding | Certifying)
 * @internal
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
 * @internal
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
 * @internal
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
 * @internal
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
 * @internal
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
 * @internal
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
 * @internal
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
 * @internal
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
 * @internal
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
 * @internal
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
 * @internal
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
 * @internal
 */
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
            const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass());
            return new ParametricFunc([a], new FuncType([AddressType, ValueType, a.ref], self));
        })(),
        pay_if_true: (() => {
            const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass());
            return new ParametricFunc([a], new FuncType([BoolType, AddressType, ValueType, a.ref], self)); 
        })(),
        mint: (() => {
            const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass());
            return new ParametricFunc([a], new FuncType([ValueType, a.ref], self));
        })(),
        redeem: (() => {
            const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass());
            return new ParametricFunc([a], new FuncType([TxInputType, a.ref], self));
        })(),
        redeem_many: (() => {
            const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass());
            return new ParametricFunc([a], new FuncType([ListType$(TxInputType), a.ref], self));
        })(),
        spend: new FuncType([TxInputType], self),
        spend_many: new FuncType([ListType$(TxInputType)], self)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self)
    })
});

/**
 * Builtin Tx type
 * @internal
 * @type {DataType}
 */
export const TxType = new GenericType({
    name: "Tx",
    jsToUplc: async (obj, helpers) => {
        return helpers["Tx"](obj)
        //return obj.toTxData(assertDefined(networkParams));
    },
    uplcToJs: async (data, helpers) => {
        return helpers["Tx"](data);
        //return TxId.fromUplcData(data.fields[11]);
    },
    genTypeDetails: (self) => ({
        inputType: "helios.Tx",
        outputType: "helios.Tx",
        internalType: {
            type: "Tx"
        }
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
 * @internal
 * @type {DataType}
 */
export const TxIdType = new GenericType({
    name: "TxId",
    offChainType: TxId,
    genTypeDetails: (self) => ({
        inputType: `number[] | string | helios.TxId`,
        outputType: `helios.TxId`,
        internalType: {
            type: "TxId"
        }
    }),
    jsToUplc: async (obj, helpers) => {
        return TxId.fromProps(obj)._toUplcData();
    },
    uplcToJs: async (data, helpers) => {
        return TxId.fromUplcData(data);
    },
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self)
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
 * @internal
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
 * @internal
 * @type {DataType}
 */
export const TxOutputType = new GenericType({
    name: "TxOutput",
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        address: AddressType,
        value: ValueType,
	    datum: OutputDatumType,
        ref_script_hash: OptionType$(scriptHashType)
    }),
    genTypeMembers: (self) => ({
        ...genCommonTypeMembers(self),
        new: new FuncType([AddressType, ValueType, OutputDatumType], self)
    })
});

/**
 * Builtin TxOutputId type
 * @internal
 * @type {DataType}
 */
export const TxOutputIdType = new GenericType({
    name: "TxOutputId",
    genTypeDetails: (self) => ({
        inputType: "{txId: number[] | string | helios.TxId, utxoId: number | bigint} | helios.TxOutputId",
        outputType: "helios.TxOutputId",
        internalType: {
            type: "TxOutputId"
        }
    }),
    jsToUplc: async (obj, helpers) => {
        return TxOutputId.fromProps(obj)._toUplcData();
    },
    uplcToJs: async (data, helpers) => {
        return TxOutputId.fromUplcData(data);
    },
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