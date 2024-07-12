import { CompilerError, Word } from "@helios-lang/compiler-utils"

/**
 * @typedef {import("../typecheck/index.js").DataType} DataType
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 * @typedef {import("../typecheck/index.js").Func} Func
 * @typedef {import("../typecheck/index.js").Parametric} Parametric
 * @typedef {import("../typecheck/index.js").Type} Type
 * @typedef {import("../typecheck/index.js").ScriptTypes} ScriptTypes
 */

import {
    AddressType,
    AnyTypeClass,
    AssertFunc,
    AssetClassType,
    BoolType,
    ByteArrayType,
    ContractContextType,
    CredentialType,
    DatumHashType,
    DCertType,
    DurationType,
    ErrorFunc,
    IntType,
    MintingPolicyHashType,
    NetworkType,
    OutputDatumType,
    PrintFunc,
    PubKeyType,
    PubKeyHashType,
    RawDataType,
    RealType,
    scriptHashType,
    ScriptContextType,
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
    WalletType
} from "../typecheck/index.js"

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
    OutputDatum: OutputDatumType,
    PubKey: PubKeyType,
    PubKeyHash: PubKeyHashType,
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
     * @returns {boolean}
     */
    isStrict() {
        throw new Error("should've been returned be TopScope")
    }

    /**
     * Initialize the GlobalScope with all the builtins
     * @param {ScriptTypes} scriptTypes - types of all the scripts in a contract/ensemble
     * @returns {GlobalScope}
     */
    static new(scriptTypes = {}) {
        let scope = new GlobalScope()

        // List (aka '[]'), Option, and Map types are accessed through special expressions

        // fill the global scope with builtin types
        for (let name in builtinTypes) {
            scope.set(name, builtinTypes[name])
        }

        scope.set("Any", new AnyTypeClass())
        scope.set("Valuable", new ValuableTypeClass())

        if (Object.keys(scriptTypes).length > 0) {
            scope.set("Scripts", new ScriptsType(scriptTypes))
        }

        scope.set("ScriptContext", new ScriptContextType())
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
