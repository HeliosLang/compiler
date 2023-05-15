//@ts-check
// Scopes

import {
	assert
} from "./utils.js";

import {
    Word
} from "./tokens.js";

import {
	Common
} from "./eval-common.js";

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
	SerializableTypeClass
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
	ScriptHashType,
	StakeKeyHashType,
	StakingHashType,
	StakingValidatorHashType,
	ValidatorHashType
} from "./eval-hashes.js";

import {
	AssetClassType,
	ValueType,
	ValuableTypeClass
} from "./eval-money.js";

import {
	AddressType,
	CertifyingActionType,
	CredentialType,
	OutputDatumType,
	ScriptContextType,
	ScriptPurposeType,
	StakingCredentialType,
	StakingPurposeType,
	TxType,
	TxIdType,
	TxInputType,
	TxOutputIdType,
	TxOutputType,
} from "./eval-tx.js";


/**
 * GlobalScope sits above the top-level scope and contains references to all the builtin Values and Types
 * @package
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
	 * @returns {EvalEntity}
	 */
	get(name) {
		for (let pair of this.#values) {
			if (pair[0].toString() == name.toString()) {
				return pair[1];
			}
		}

		throw name.referenceError(`'${name.toString()}' undefined`);
	}

	/**
	 * @returns {boolean}
	 */
	isStrict() {
		throw new Error("should've been returned be TopScope");
	}

	/**
	 * Initialize the GlobalScope with all the builtins
	 * @param {number} purpose
	 * @returns {GlobalScope}
	 */
	static new(purpose) {
		let scope = new GlobalScope();

		// List (aka '[]'), Option, and Map types are accessed through special expressions

		// fill the global scope with builtin types
        scope.set("Address",              AddressType);
        scope.set("AssetClass",           AssetClassType);
        scope.set("Bool",                 BoolType);
        scope.set("ByteArray",            ByteArrayType);
		scope.set("CertifyingAction",     CertifyingActionType);
        scope.set("Credential",           CredentialType);
        scope.set("DatumHash",            DatumHashType);
        scope.set("Data",                 RawDataType);
        scope.set("Duration",             DurationType);
		scope.set("Int",                  IntType);
        scope.set("MintingPolicyHash",    MintingPolicyHashType);
        scope.set("OutputDatum",          OutputDatumType);
        scope.set("PubKey",               PubKeyType);
		scope.set("PubKeyHash",           PubKeyHashType);
		scope.set("Real",                 RealType);
        scope.set("ScriptContext",        new ScriptContextType(purpose));
        scope.set("ScriptHash",           ScriptHashType);
        scope.set("ScriptPurpose",        ScriptPurposeType);
        scope.set("StakeKeyHash",         StakeKeyHashType);
        scope.set("StakingCredential",    StakingCredentialType);
        scope.set("StakingHash",          StakingHashType);
        scope.set("StakingPurpose",       StakingPurposeType);
        scope.set("StakingValidatorHash", StakingValidatorHashType);
		scope.set("Serializable",         new SerializableTypeClass());
		scope.set("String",               StringType);
        scope.set("Time",                 TimeType);
        scope.set("TimeRange",            TimeRangeType);
        scope.set("Tx",                   TxType);
        scope.set("TxId",                 TxIdType);
        scope.set("TxInput",              TxInputType);
        scope.set("TxOutput",             TxOutputType);
        scope.set("TxOutputId",           TxOutputIdType);
		scope.set("ValidatorHash",        ValidatorHashType);
        scope.set("Value",                ValueType);
		scope.set("Valuable",             new ValuableTypeClass());

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
 * @package
 * @implements {EvalEntity}
 */
export class Scope extends Common {
	/** @type {GlobalScope | Scope} */
	#parent;

	/** 
	 * TopScope can elverage the #values to store ModuleScopes
	 * @type {[Word, (EvalEntity | Scope)][]} 
	 */
	#values;

	/**
	 * @type {Set<string>}
	 */
	#used;

	/**
	 * @param {GlobalScope | Scope} parent 
	 */
	constructor(parent) {
		super()
		this.#parent = parent;
		this.#values = []; // list of pairs
		this.#used = new Set();
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
	set(name, value) {
		if (value instanceof Scope) {
			assert(name.value.startsWith("__scope__"));
		}

		if (this.has(name)) {
			throw name.syntaxError(`'${name.toString()}' already defined`);
		}

		this.#values.push([name, value]);
	}

	/**
	 * @param {Word} name 
	 */
	remove(name) {
		this.#values = this.#values.filter(([n, _]) => n.value != name.value);
	}

	/**
	 * @param {Word} name 
	 * @returns {Scope}
	 */
	getScope(name) {
		assert(!name.value.startsWith("__scope__"));

		const entity = this.get(new Word(name.site, `__scope__${name.value}`));

		if (entity instanceof Scope) {
			return entity;
		} else {
			throw name.typeError(`expected Scope, got ${entity.toString()}`);
		}
	}

	/**
	 * Gets a named value from the scope. Throws an error if not found
	 * @param {Word} name 
	 * @returns {EvalEntity | Scope}
	 */
	get(name) {
		if (!(name instanceof Word)) {
			name = Word.new(name);
		}

		for (let [key, entity] of this.#values) {
			if (key.toString() == name.toString()) {
				this.#used.add(key.toString());

				return entity;
			}
		}

		if (this.#parent !== null) {
			return this.#parent.get(name);
		} else {
			throw name.referenceError(`'${name.toString()}' undefined`);
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
			for (let [name, entity] of this.#values) {
				if (!(entity instanceof Scope) && !this.#used.has(name.toString())) {
					throw name.referenceError(`'${name.toString()}' unused`);
				}
			}
		}
	}

	/**
	 * @param {Word} name 
	 * @returns {boolean}
	 */
	isUsed(name) {
		for (let [checkName, entity] of this.#values) {
			if (name.value == checkName.value && !(entity instanceof Scope)) {
				return this.#used.has(name.toString());
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
 * @package
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
		if (value instanceof Scope) {
			assert(name.value.startsWith("__scope__"));
		}

		super.set(name, value);
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
 * @package
 */
export class ModuleScope extends Scope {
}