//@ts-check
// Scopes

import {
	assert
} from "./utils.js";

import {
    Word
} from "./tokens.js";

/**
 * @typedef {import("./uplc-ast.js").ScriptPurpose} ScriptPurpose
 */

import {
	Common
} from "./eval-common.js";

/**
 * @typedef {import("./eval-common.js").DataType} DataType
 */

/**
 * @typedef {import("./eval-common.js").EvalEntity} EvalEntity
 */

/**
 * @typedef {import("./eval-common.js").Func} Func
 */

/**
 * @typedef {import("./eval-common.js").Parametric} Parametric
 */

/**
 * @typedef {import("./eval-common.js").Type} Type
 */

import {
	BoolType,
	ByteArrayType,
	IntType,
	RawDataType,
	RealType,
	StringType,
} from "./eval-primitives.js";

import {
	AnyTypeClass
} from "./eval-parametric.js";

import {
	AssertFunc,
	ErrorFunc,
	PrintFunc
} from "./eval-builtin-funcs.js";

import {
	DurationType,
	TimeType,
	TimeRangeType
} from "./eval-time.js";

import {
	DatumHashType,
	MintingPolicyHashType,
	PubKeyType,
	PubKeyHashType,
	scriptHashType,
	StakingHashType,
	StakingValidatorHashType,
	ValidatorHashType
} from "./eval-hashes.js";

import {
	AssetClassType,
	ValueType,
	ValuableTypeClass
} from "./eval-money.js";

/**
 * @typedef {import("./eval-tx.js").ScriptTypes} ScriptTypes
 */

import {
	AddressType,
	ContractContextType,
	CredentialType,
	DCertType,
	NetworkType,
	OutputDatumType,
	ScriptsType,
	ScriptContextType,
	ScriptPurposeType,
	StakingCredentialType,
	StakingPurposeType,
	TxType,
	TxBuilderType,
	TxIdType,
	TxInputType,
	TxOutputIdType,
	TxOutputType,
	WalletType
} from "./eval-tx.js";

/**
 * @internal
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
};

/**
 * GlobalScope sits above the top-level scope and contains references to all the builtin Values and Types
 * @internal
 */
export class GlobalScope {
	/**
	 * @type {[Word, EvalEntity][]}
	 */
	#values;

	constructor() {
		this.#values = [];
	}

	/**
	 * Checks if scope contains a name
	 * @param {Word} name 
	 * @returns {boolean}
	 */
	has(name) {
		for (let pair of this.#values) {
			if (pair[0].toString() == name.toString()) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Sets a global name, doesn't check for uniqueness
	 * Called when initializing GlobalScope
	 * @param {string | Word} name
	 * @param {EvalEntity} value
	 */
	set(name, value) {
		/** @type {Word} */
		let nameWord = !(name instanceof Word) ? Word.new(name) : name;

		this.#values.push([nameWord, value]);
	}

	/**
	 * Gets a named value from the scope.
	 * Throws an error if not found.
	 * @param {Word} name 
	 * @returns {null | EvalEntity}
	 */
	get(name) {
		for (let pair of this.#values) {
			if (pair[0].toString() == name.toString()) {
				return pair[1];
			}
		}

		name.referenceError(`'${name.toString()}' undefined`);
		return null;
	}

	/**
	 * @returns {boolean}
	 */
	isStrict() {
		throw new Error("should've been returned be TopScope");
	}

	/**
	 * Initialize the GlobalScope with all the builtins
	 * @param {ScriptTypes} scriptTypes - types of all the scripts in a contract/ensemble
	 * @returns {GlobalScope}
	 */
	static new(scriptTypes = {}) {
		let scope = new GlobalScope();

		// List (aka '[]'), Option, and Map types are accessed through special expressions

		// fill the global scope with builtin types
		for (let name in builtinTypes) {
			scope.set(name, builtinTypes[name])
		}

		scope.set("Any",         		  new AnyTypeClass());
		scope.set("Valuable",             new ValuableTypeClass());

		if (Object.keys(scriptTypes).length > 0) {
			scope.set("Scripts",     new ScriptsType(scriptTypes));
		}

        scope.set("ScriptContext",    new ScriptContextType());
		scope.set("ContractContext",  new ContractContextType());
		scope.set("TxBuilder",        TxBuilderType);
		scope.set("Wallet",           WalletType);
		scope.set("Network",          NetworkType);

        // builtin functions
        scope.set("assert",               AssertFunc);
		scope.set("error",                ErrorFunc);
        scope.set("print",                PrintFunc);

		return scope;
	}

	/**
	 * @param {(name: string, type: Type) => void} callback 
	 */
	loopTypes(callback) {
		for (let [k, v] of this.#values) {
			if (v.asType) {
				callback(k.value, v.asType);
			}
		}
	}
}

/**
 * User scope
 * @internal
 * @implements {EvalEntity}
 */
export class Scope extends Common {
	/** @type {GlobalScope | Scope} */
	#parent;

	/** 
	 * TopScope can elverage the #values to store ModuleScopes
	 * @type {[Word, (EvalEntity | Scope), boolean][]} 
	 */
	#values;

	/**
	 * @type {boolean}
	 */
	#allowShadowing;

	/**
	 * @param {GlobalScope | Scope} parent 
	 * @param {boolean} allowShadowing
	 */
	constructor(parent, allowShadowing = false) {
		super()
		this.#parent = parent;
		this.#values = []; // list of pairs
		this.#allowShadowing = allowShadowing;
	}

	/**
	 * @type {boolean}
	 */
	get allowShadowing() {
		return this.#allowShadowing;
	}

	/**
	 * Used by top-scope to loop over all the statements
	 */
	get values() {
		return this.#values.slice();
	}

	/**
	 * Checks if scope contains a name
	 * @param {Word} name 
	 * @returns {boolean}
	 */
	has(name) {
		for (let pair of this.#values) {
			if (pair[0].toString() == name.toString()) {
				return true;
			}
		}

		if (this.#parent !== null) {
			return this.#parent.has(name);
		} else {
			return false;
		}
	}

	/**
	 * Sets a named value. Throws an error if not unique
	 * @param {Word} name 
	 * @param {EvalEntity | Scope} value 
	 */
	setInternal(name, value, allowShadowing = false) {
		if (value instanceof Scope) {
			assert(name.value.startsWith("__scope__"));
		}

		if (this.has(name)) {
			const prevEntity = this.get(name, true);

			if (allowShadowing && value.asTyped && prevEntity && !(prevEntity instanceof Scope) && prevEntity.asTyped) {
				if (!(prevEntity.asTyped.type.isBaseOf(value.asTyped.type) && value.asTyped.type.isBaseOf(prevEntity.asTyped.type))) {
					name.syntaxError(`'${name.toString()}' already defined`);
				}
			} else {
				name.syntaxError(`'${name.toString()}' already defined`);
			}
		}

		this.#values.push([name, value, false]);
	}

	/**
	 * Sets a named value. Throws an error if not unique
	 * @param {Word} name 
	 * @param {EvalEntity | Scope} value 
	 */
	set(name, value) {
		this.setInternal(name, value, this.#allowShadowing);
	}

	/**
	 * @param {Word} name 
	 */
	remove(name) {
		this.#values = this.#values.filter(([n, _]) => n.value != name.value);
	}

	/**
	 * @param {Word} name 
	 * @returns {null | Scope}
	 */
	getScope(name) {
		assert(!name.value.startsWith("__scope__"));

		const entity = this.get(new Word(name.site, `__scope__${name.value}`));

		if (entity instanceof Scope) {
			return entity;
		} else if (!entity) {
			name.typeError(`expected Scope`);
			return null;
		} else {
			name.typeError(`expected Scope, got ${entity.toString()}`);
			return null;
		}
	}

	/**
	 * Gets a named value from the scope. Throws an error if not found
	 * @param {Word} name 
	 * @param {boolean} dryRun - if false -> don't set used flag
	 * @returns {null | EvalEntity | Scope}
	 */
	get(name, dryRun = false) {
		if (!(name instanceof Word)) {
			name = Word.new(name);
		}

		for (let i = this.#values.length - 1; i >= 0; i--) {
			const [key, entity, _] = this.#values[i];

			if (key.toString() == name.toString()) {
				if (!dryRun) {
					this.#values[i][2] = true;
				}
				return entity;
			}
		}

		if (this.#parent !== null) {
			return this.#parent.get(name, dryRun);
		} else {
			name.referenceError(`'${name.toString()}' undefined`);
			return null;
		}
	}

	/**
	 * @returns {boolean}
	 */
	isStrict() {
		return this.#parent.isStrict();
	}

	/**
	 * Asserts that all named values are user.
	 * Throws an error if some are unused.
	 * Check is only run if we are in strict mode
	 * @param {boolean} onlyIfStrict
	 */
	assertAllUsed(onlyIfStrict = true) {
		if (!onlyIfStrict || this.isStrict()) {
			for (let [name, entity, used] of this.#values) {
				if (!(entity instanceof Scope) && !used) {
					name.referenceError(`'${name.toString()}' unused`);
				}
			}
		}
	}

	/**
	 * @param {Word} name 
	 * @returns {boolean}
	 */
	isUsed(name) {
		for (let [checkName, entity, used] of this.#values) {
			if (name.value == checkName.value && !(entity instanceof Scope)) {
				return used;
			}
		}

		throw new Error(`${name.value} not found`);
	}

	dump() {
		console.log("DUMPING SCOPE", this.#values.length);
		this.#values.forEach(([w, v]) => {
			console.log(w.value, v);
		});
	}

	/**
	 * @param {(name: string, type: Type) => void} callback 
	 */
	loopTypes(callback) {
		this.#parent.loopTypes(callback);

		for (let [k, v] of this.#values) {
			if (v.asType) {
				callback(k.value, v.asType);
			}
		}
	}
}

/**
 * TopScope is a special scope that can contain UserTypes
 * @internal
 */
export class TopScope extends Scope {
	#strict;

	/**
	 * @param {GlobalScope} parent 
	 * @param {boolean} strict
	 */
	constructor(parent, strict = true) {
		super(parent);
		this.#strict = strict;
	}

	/**
	 * Prepends "__scope__" to name before actually setting scope
	 * @param {Word} name 
	 * @param {Scope} value 
	 */
	setScope(name, value) {
		assert(!name.value.startsWith("__scope__"));

		this.set(new Word(name.site, `__scope__${name.value}`), value);
	}

	/**
	 * @param {Word} name 
	 * @param {EvalEntity | Scope} value 
	 */
	set(name, value) {
		super.setInternal(name, value, false);
	}

	/**
	 * @param {boolean} s 
	 */
	setStrict(s) {
		this.#strict = s;
	}

	/**
	 * @returns {boolean}
	 */
	isStrict() {
		return this.#strict;
	}

	/**
	 * @param {Word} name 
	 * @returns {ModuleScope}
	 */
	getModuleScope(name) {
		assert(!name.value.startsWith("__scope__"));

		const maybeModuleScope = this.get(new Word(name.site, `__scope__${name.value}`));

		if (maybeModuleScope instanceof ModuleScope) {
			return maybeModuleScope;
		} else {
			throw new Error("expected ModuleScope");
		}
	}
}

/**
 * @internal
 */
export class ModuleScope extends Scope {
}