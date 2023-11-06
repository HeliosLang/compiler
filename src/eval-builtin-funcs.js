//@ts-check
// Eval builtin functions

import {
    Site
} from "./tokens.js";

import {
    Common,
	ErrorType,
    FuncType,
    VoidType
} from "./eval-common.js";

/**
 * @typedef {import("./eval-common.js").Func} Func
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

import {
    BoolType,
    StringType
} from "./eval-primitives.js";

/**
 * Used by print, error, and assert
 * @internal
 * @implements {Func}
 * @implements {Named}
 */
export class BuiltinFunc extends Common {
	/**
	 * @type {string}
	 */
	#name;

	/**
	 * @type {FuncType}
	 */
	#type;

	/**
	 * 
	 * @param {{
	 *   name: string,
	 *   type: FuncType
	 * }} props
	 */
	constructor({name, type}) {
		super();
		this.#name = name;
		this.#type = type;
	}

	/**
	 * @type {string}
	 */
	get name() {
		return this.#name;
	}

	/**
	 * @type {string}
	 */
	get path() {
		return `__helios__${this.#name}`;
	}

	/**
	 * @type {Type}
	 */
	get type() {
		return this.#type;
	}

	/**
	 * @type {FuncType}
	 */
	get funcType() {
		return this.#type;
	}

	/**
	 * @type {Func}
	 */
	get asFunc() {
		return this;
	}

	/**
     * @type {Named}
     */
	get asNamed() {
        return this;
    }

	/**
	 * @type {Typed}
	 */
	get asTyped() {
		return this;
	}

	/**
	 * @param {Site} site 
	 * @param {Typed[]} args 
	 * @param {{[name: string]: Typed}} namedArgs
	 * @returns {null | Typed}
	 */
	call(site, args, namedArgs = {}) {
		const res = this.#type.checkCall(site, args, namedArgs);

		if (!res) {
			return null
		} else {
			return res.toTyped();
		}
	}

	/**
     * @returns {string}
     */
    toString() {
        return this.name;
    }
}

/**
 * Special builtin function that throws an error if condition is false and returns Void
 * @internal
 */
export const AssertFunc = new BuiltinFunc({
    name: "assert",
    type: new FuncType([BoolType, StringType], new VoidType())
});

/**
 * Special builtin function that throws an error and returns ErrorInstance (special case of Void)
 * @internal
 */
export const ErrorFunc = new BuiltinFunc({
	name: "error",
	type: new FuncType([StringType], new ErrorType())
});

/**
 * Special builtin function that prints a message and returns void
 * @internal
 */
export const PrintFunc = new BuiltinFunc({
	name: "print",
	type:  new FuncType([StringType], new VoidType())
});