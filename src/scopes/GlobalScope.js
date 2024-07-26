import { CompilerError, Word } from "@helios-lang/compiler-utils"
import { None } from "@helios-lang/type-utils"

import {
    AddressType,
    AnyTypeClass,
    AssertFunc,
    AssetClassType,
    BoolType,
    ByteArrayType,
    Cip67Namespace,
    ContractContextType,
    CredentialType,
    DatumHashType,
    DCertType,
    DurationType,
    ErrorFunc,
    IntType,
    MintingPolicyHashType,
    MixedArgsType,
    NetworkType,
    OutputDatumType,
    PrintFunc,
    PubKeyType,
    PubKeyHashType,
    RatioType,
    RawDataType,
    RealType,
    scriptHashType,
    ScriptContextNamespace,
    ScriptPurposeType,
    ScriptsType,
    StakingCredentialType,
    StakingHashType,
    StakingPurposeType,
    StakingValidatorHashType,
    StringType,
    TimeType,
    TimeRangeType,
    TxType,
    TxBuilderType,
    TxIdType,
    TxInputType,
    TxOutputIdType,
    TxOutputType,
    ValidatorHashType,
    ValueType,
    ValuableTypeClass,
    WalletType,
    NamedNamespace
} from "../typecheck/index.js"

/**
 * @typedef {import("../typecheck/index.js").DataType} DataType
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 * @typedef {import("../typecheck/index.js").Func} Func
 * @typedef {import("../typecheck/index.js").MultiValidatorInfo} MultiValidatorInfo
 * @typedef {import("../typecheck/index.js").Named} Named
 * @typedef {import("../typecheck/index.js").Namespace} Namespace
 * @typedef {import("../typecheck/index.js").Parametric} Parametric
 * @typedef {import("../typecheck/index.js").Type} Type
 * @typedef {import("../typecheck/index.js").ScriptTypes} ScriptTypes
 */

/**
 * Setting information allows making the scope multi-validator aware
 * @typedef {{
 *   currentScript?: string
 *   scriptTypes?: ScriptTypes
 * }} GlobalScopeConfig
 */

/**
 * @type {{[name: string]: (info: MultiValidatorInfo) => NamedNamespace}}
 */
export const builtinNamespaces = {
    Cip67: Cip67Namespace,
    ScriptContext: ScriptContextNamespace
}

/**
 * @type {{[name: string]: DataType}}
 */
export const builtinTypes = {
    Address: AddressType,
    AssetClass: AssetClassType,
    Bool: BoolType,
    ByteArray: ByteArrayType,
    DCert: DCertType,
    Credential: CredentialType,
    DatumHash: DatumHashType,
    Data: RawDataType,
    Duration: DurationType,
    Int: IntType,
    MintingPolicyHash: MintingPolicyHashType,
    MixedArgs: MixedArgsType,
    OutputDatum: OutputDatumType,
    PubKey: PubKeyType,
    PubKeyHash: PubKeyHashType,
    Ratio: RatioType,
    Real: RealType,
    ScriptHash: scriptHashType,
    ScriptPurpose: ScriptPurposeType,
    StakingCredential: StakingCredentialType,
    StakingHash: StakingHashType,
    StakingPurpose: StakingPurposeType,
    StakingValidatorHash: StakingValidatorHashType,
    String: StringType,
    Time: TimeType,
    TimeRange: TimeRangeType,
    Tx: TxType,
    TxId: TxIdType,
    TxInput: TxInputType,
    TxOutput: TxOutputType,
    TxOutputId: TxOutputIdType,
    ValidatorHash: ValidatorHashType,
    Value: ValueType
}

/**
 * GlobalScope sits above the top-level scope and contains references to all the builtin Values and Types
 */
export class GlobalScope {
    /**
     * @type {[Word, EvalEntity][]}
     */
    #values

    constructor() {
        this.#values = []
    }

    /**
     * Checks if scope contains a name
     * @param {Word} name
     * @returns {boolean}
     */
    has(name) {
        for (let pair of this.#values) {
            if (pair[0].toString() == name.toString()) {
                return true
            }
        }

        return false
    }

    /**
     * Sets a global name, doesn't check for uniqueness
     * Called when initializing GlobalScope
     * @param {string | Word} name
     * @param {EvalEntity} value
     */
    set(name, value) {
        /** @type {Word} */
        let nameWord = !(name instanceof Word) ? new Word(name) : name

        this.#values.push([nameWord, value])
    }

    /**
     * Gets a named value from the scope.
     * Throws an error if not found.
     * @param {Word} name
     * @returns {EvalEntity}
     */
    get(name) {
        for (let pair of this.#values) {
            if (pair[0].toString() == name.toString()) {
                return pair[1]
            }
        }

        throw CompilerError.reference(
            name.site,
            `'${name.toString()}' undefined`
        )
    }

    /**
     * @param {Word} name
     * @returns {Option<Named & Namespace>}
     */
    getBuiltinNamespace(name) {
        if (name.value in builtinNamespaces) {
            const nameEntity = this.#values.find(
                ([n, entity]) => n.value == name.value
            )

            if (nameEntity) {
                const entity = nameEntity[1]

                if (entity.asNamed && entity.asNamespace) {
                    return /** @type {any} */ (entity)
                } else {
                    return None
                }
            }
        }

        throw CompilerError.reference(
            name.site,
            `namespace ${name.value} not found`
        )
    }

    /**
     * @returns {boolean}
     */
    isStrict() {
        throw new Error("should've been returned be TopScope")
    }

    /**
     * Initialize the GlobalScope with all the builtins
     * @param {MultiValidatorInfo} info
     * @returns {GlobalScope}
     */
    static new(info) {
        let scope = new GlobalScope()

        // List (aka '[]'), Option, and Map types are accessed through special expressions

        // fill the global scope with builtin types and namespaces
        for (let name in builtinNamespaces) {
            scope.set(name, builtinNamespaces[name](info))
        }

        for (let name in builtinTypes) {
            scope.set(name, builtinTypes[name])
        }

        scope.set("Any", new AnyTypeClass())
        scope.set("Valuable", new ValuableTypeClass())

        if (info.scriptTypes && Object.keys(info.scriptTypes).length > 0) {
            scope.set("Scripts", new ScriptsType(info.scriptTypes))
        }

        scope.set("ContractContext", new ContractContextType())
        scope.set("TxBuilder", TxBuilderType)
        scope.set("Wallet", WalletType)
        scope.set("Network", NetworkType)

        // builtin functions
        scope.set("assert", AssertFunc)
        scope.set("error", ErrorFunc)
        scope.set("print", PrintFunc)

        return scope
    }

    /**
     * @param {(name: string, type: Type) => void} callback
     */
    loopTypes(callback) {
        for (let [k, v] of this.#values) {
            if (v.asType) {
                callback(k.value, v.asType)
            }
        }
    }
}
