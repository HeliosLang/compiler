import { makeReferenceError, makeWord } from "@helios-lang/compiler-utils"
import {
    AddressType,
    AnyTypeClass,
    AssertFunc,
    AssetClassType,
    BoolType,
    ByteArrayType,
    Cip67Namespace,
    DatumHashType,
    DCertType,
    DurationType,
    ErrorFunc,
    IntType,
    MintingPolicyHashType,
    MixedArgsType,
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
    SpendingCredentialType,
    StakingCredentialType,
    StakingHashType,
    StakingPurposeType,
    StakingValidatorHashType,
    StringType,
    TimeType,
    TimeRangeType,
    TxType,
    TxIdType,
    TxInputType,
    TxOutputType,
    TxOutputIdType,
    TxOutputDatumType,
    ValidatorHashType,
    ValueType,
    ValuableTypeClass,
    NamedNamespace
} from "../typecheck/index.js"

/**
 * @import { Word } from "@helios-lang/compiler-utils"
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
    DatumHash: DatumHashType,
    Data: RawDataType,
    Duration: DurationType,
    Int: IntType,
    MintingPolicyHash: MintingPolicyHashType,
    MixedArgs: MixedArgsType,
    PubKey: PubKeyType,
    PubKeyHash: PubKeyHashType,
    Ratio: RatioType,
    Real: RealType,
    ScriptHash: scriptHashType,
    ScriptPurpose: ScriptPurposeType,
    SpendingCredential: SpendingCredentialType,
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
    TxOutputDatum: TxOutputDatumType,
    TxOutputId: TxOutputIdType,
    ValidatorHash: ValidatorHashType,
    Value: ValueType
}

/**
 * GlobalScope sits above the top-level scope and contains references to all the builtin Values and Types
 */
export class GlobalScope {
    /**
     * @private
     * @readonly
     * @type {[Word, EvalEntity][]}
     */
    _values

    constructor() {
        this._values = []
    }

    /**
     * Checks if scope contains a name
     * @param {Word} name
     * @returns {boolean}
     */
    has(name) {
        for (let pair of this._values) {
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
        let nameWord =
            typeof name == "string" ? makeWord({ value: name }) : name

        this._values.push([nameWord, value])
    }

    /**
     * Gets a named value from the scope.
     * Throws an error if not found.
     * @param {Word} name
     * @returns {EvalEntity}
     */
    get(name) {
        for (let pair of this._values) {
            if (pair[0].toString() == name.toString()) {
                return pair[1]
            }
        }

        throw makeReferenceError(name.site, `'${name.toString()}' undefined`)
    }

    /**
     * @param {Word} name
     * @returns {(Named & Namespace) | undefined}
     */
    getBuiltinNamespace(name) {
        if (name.value in builtinNamespaces) {
            const nameEntity = this._values.find(
                ([n, _entity]) => n.value == name.value
            )

            if (nameEntity) {
                const entity = nameEntity[1]

                if (entity.asNamed && entity.asNamespace) {
                    return /** @type {any} */ (entity)
                } else {
                    return undefined
                }
            }
        }

        throw makeReferenceError(name.site, `namespace ${name.value} not found`)
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
        for (let [k, v] of this._values) {
            if (v.asType) {
                callback(k.value, v.asType)
            }
        }
    }
}
