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
}