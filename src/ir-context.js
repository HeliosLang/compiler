//@ts-check
// IR Context objects

import {
    assert
} from "./utils.js";

import {
    Token,
    Word
} from "./tokens.js";

import {
	BUILTIN_PREFIX,
    UPLC_BUILTINS
} from "./uplc-builtins.js";

/**
 * Scope for IR names.
 * Works like a stack of named values from which a Debruijn index can be derived
 * @internal
 */
export class IRScope {
	#parent;
	/** variable name (can be empty if no usable variable defined at this level) */
	#variable;

	/**
	 * @param {null | IRScope} parent 
	 * @param {null | IRVariable} variable
	 */
	constructor(parent, variable) {
		this.#parent = parent;
		this.#variable = variable;
	}

	/**
	 * Calculates the Debruijn index of a named value. Internal method
	 * @param {Word | IRVariable} name 
	 * @param {number} index 
	 * @returns {[number, IRVariable]}
	 */
	getInternal(name, index) {
		if (this.#variable !== null && (name instanceof Word && this.#variable.toString() == name.toString()) || (name instanceof IRVariable && this.#variable == name)) {
			return [index, this.#variable];
		} else if (this.#parent === null) {
			throw name.referenceError(`variable ${name.toString()} not found`);
		} else {
			return this.#parent.getInternal(name, index + 1);
		}
	}

	/**
	 * Calculates the Debruijn index.
	 * @param {Word | IRVariable} name 
	 * @returns {[number, IRVariable]}
	 */
	get(name) {
		// one-based
		return this.getInternal(name, 1);
	}

	/**
	 * Checks if a named builtin exists
	 * @param {string} name 
	 * @param {boolean} strict - if true then throws an error if builtin doesn't exist
	 * @returns {boolean}
	 */
	static isBuiltin(name, strict = false) {
		if (name.startsWith(BUILTIN_PREFIX)) {
			if (strict) {
				void this.findBuiltin(name); // assert that builtin exists
			}
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Returns index of a named builtin
	 * Throws an error if builtin doesn't exist
	 * @param {string} name 
	 * @returns {number}
	 */
	static findBuiltin(name) {
		let i = UPLC_BUILTINS.findIndex(info => { return BUILTIN_PREFIX + info.name == name });
		assert(i != -1, `${name} is not a real builtin`);
		return i;
	}
}

const ALWAYS_INLINEABLE = [
	"__helios__int____to_data",
	"__helios__common__identity",
	"__helios__int____neg",
	"__helios__common__fields",
	"__helios__common__fields_after_0",
	"__helios__common__field_0",
	"__helios__common__field_1",
	"__helios__bool__trace",
	"__helios__bool__and",
	"__helios__print",
	"__helios__assert",
	"__helios__error",
	"__helios__assetclass__new",
	"__helios__common__assert_constr_index",
	"__helios__real__floor",
	"__helios__real__ceil",
	"__helios__real____div",
	"__helios__real____mul",
	"__helios__int__to_real",
	"__helios__int____geq"
];

/**
 * IR class that represents function arguments
 * @internal
 */
export class IRVariable extends Token {
	#name;

	/**
	 * @param {Word} name
	 */
	constructor(name) {
		super(name.site);
		this.#name = name;
	}

	/**
	 * @type {string}
	 */
	get name() {
		return this.#name.toString();
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return this.name;
	}

	/**
	 * @param {Map<IRVariable, IRVariable>} newVars 
	 * @returns {IRVariable}
	 */
	copy(newVars) {
		const newVar = new IRVariable(this.#name);

		newVars.set(this, newVar);

		return newVar;
	}

	/**
	 * @returns {boolean}
	 */
	isAlwaysInlineable() {
		return ALWAYS_INLINEABLE.findIndex((name_) => name_ == this.#name.value) != -1;
	}
}