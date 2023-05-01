//@ts-check
// Scopes

import {
	assert
} from "./utils.js";

import {
    Site,
    Word
} from "./tokens.js";

/**
 * @typedef {import("./helios-eval-entities.js").RecurseableStatement} RecurseableStatement
 */

import {
    AddressType,
    AssertFunc,
    AssetClassType,
    BoolType,
    BuiltinType,
    ByteArrayType,
    CredentialType,
    DatumHashType,
    DCertType,
    DurationType,
    ErrorFunc,
    EvalEntity,
    Instance,
    IntType,
    MintingPolicyHashType,
    OutputDatumType,
    PrintFunc,
    PubKeyType,
    PubKeyHashType,
    RawDataType,
	RealType,
    ScriptContextType,
    ScriptHashType,
    ScriptPurposeType,
    StakeKeyHashType,
    StakingCredentialType,
    StakingHashType,
    StakingPurposeType,
    StakingValidatorHashType,
    StringType,
    TimeRangeType,
    TimeType,
    TxType,
    TxIdType,
    TxInputType,
    TxOutputIdType,
    TxOutputType,
    Type,
    ValidatorHashType,
    ValueType
} from "./helios-eval-entities.js";

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
				pair[1].markAsUsed();
				return pair[1];
			}
		}

		throw name.referenceError(`'${name.toString()}' undefined`);
	}

	/**
	 * Check if funcstatement is called recursively (always false here)
	 * @param {RecurseableStatement} statement
	 * @returns {boolean}
	 */
	isRecursive(statement) {
		return false;
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
        scope.set("Address",              new AddressType());
        scope.set("AssetClass",           new AssetClassType());
        scope.set("Bool",                 new BoolType());
        scope.set("ByteArray",            new ByteArrayType());
        scope.set("Credential",           new CredentialType());
        scope.set("DatumHash",            new DatumHashType());
        scope.set("Data",                 new RawDataType());
        scope.set("DCert",                new DCertType());
        scope.set("Duration",             new DurationType());
		scope.set("Int",                  new IntType());
        scope.set("MintingPolicyHash",    new MintingPolicyHashType(purpose));
        scope.set("OutputDatum",          new OutputDatumType());
        scope.set("PubKey",               new PubKeyType());
		scope.set("PubKeyHash",           new PubKeyHashType());
		scope.set("Real",                 new RealType());
        scope.set("ScriptContext",        new ScriptContextType(purpose));
        scope.set("ScriptHash",           new ScriptHashType());
        scope.set("ScriptPurpose",        new ScriptPurposeType());
        scope.set("StakeKeyHash",         new StakeKeyHashType());
        scope.set("StakingCredential",    new StakingCredentialType());
        scope.set("StakingHash",          new StakingHashType());
        scope.set("StakingPurpose",       new StakingPurposeType());
        scope.set("StakingValidatorHash", new StakingValidatorHashType(purpose));
		scope.set("String",               new StringType());
        scope.set("Time",                 new TimeType());
        scope.set("TimeRange",            new TimeRangeType());
        scope.set("Tx",                   new TxType());
        scope.set("TxId",                 new TxIdType());
        scope.set("TxInput",              new TxInputType());
        scope.set("TxOutput",             new TxOutputType());
        scope.set("TxOutputId",           new TxOutputIdType());
		scope.set("ValidatorHash",        new ValidatorHashType(purpose));
        scope.set("Value",                new ValueType());

        // builtin functions
        scope.set("assert",               new AssertFunc());
		scope.set("error",                new ErrorFunc());
        scope.set("print",                new PrintFunc());
		

		return scope;
	}

	allowMacros() {
		for (let [_, value] of this.#values) {
			if (value instanceof BuiltinType) {
				value.allowMacros();
			}
		}
	}

	/**
	 * @param {(name: string, type: Type) => void} callback 
	 */
	loopTypes(callback) {
		for (let [k, v] of this.#values) {
			if (v instanceof Type) {
				callback(k.value, v);
			}
		}
	}
}

/**
 * User scope
 * @package
 */
export class Scope {
	/** @type {GlobalScope | Scope} */
	#parent;

	/** 
	 * TopScope can elverage the #values to store ModuleScopes
	 * @type {[Word, (EvalEntity | Scope)][]} 
	 */
	#values;

	/**
	 * @param {GlobalScope | Scope} parent 
	 */
	constructor(parent) {
		this.#parent = parent;
		this.#values = []; // list of pairs
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
				if (entity instanceof EvalEntity) {
					entity.markAsUsed();
				}

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
	 * Check if function statement is called recursively
	 * @param {RecurseableStatement} statement
	 * @returns {boolean}
	 */
	isRecursive(statement) {
		return this.#parent.isRecursive(statement);
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
				if (entity instanceof EvalEntity && !entity.isUsed()) {
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
		for (let [name, entity] of this.#values) {
			if (name.value == name.value && entity instanceof EvalEntity) {
				return entity.isUsed();
			}
		}

		throw new Error(`${name.value} not found`);
	}

	/**
	 * @param {Site} site 
	 * @returns {Type}
	 */
	assertType(site) {
		throw site.typeError("expected a type, got a module");
	}

	/**
	 * @param {Site} site 
	 * @returns {Instance}
	 */
	assertValue(site) {
		throw site.typeError("expected a value, got a module");
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
			if (v instanceof Type) {
				callback(k.value, v);
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

/**
 * FuncStatementScope is a special scope used to detect recursion
 * @package
 */
export class FuncStatementScope extends Scope {
	#statement;

	/**
	 * @param {Scope} parent
	 * @param {RecurseableStatement} statement
	 */
	constructor(parent, statement) {
		super(parent);

		this.#statement = statement;
	}

	/**
	 * @param {RecurseableStatement} statement 
	 * @returns {boolean}
	 */
	isRecursive(statement) {
		if (this.#statement === statement) {
			this.#statement.setRecursive();
			return true;
		} else {
			return super.isRecursive(statement);
		}
	}
}