//@ts-check
// IR Context objects

import {
    assert,
    assertClass
} from "./utils.js";

import {
    Token,
    Word
} from "./tokens.js";

import {
    UPLC_BUILTINS
} from "./uplc-builtins.js";

import {
    UplcValue
} from "./uplc-ast.js";

/**
 * Scope for IR names.
 * Works like a stack of named values from which a Debruijn index can be derived
 * @package
 */
export class IRScope {
	#parent;
	/** variable name (can be empty if no usable variable defined at this level) */
	#variable;

	/**
	 * @param {?IRScope} parent 
	 * @param {?IRVariable} variable
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
			throw assertClass(name, Word).referenceError(`variable ${name.toString()} not found`);
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
		if (name.startsWith("__core")) {
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
	 * @returns 
	 */
	static findBuiltin(name) {
		let i = UPLC_BUILTINS.findIndex(info => { return "__core__" + info.name == name });
		assert(i != -1, `${name} is not a real builtin`);
		return i;
	}
}

/**
 * IR class that represents function arguments
 * @package
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

	toString() {
		return this.name;
	}
}

/**
 * @package
 */
export class IRValue {
	constructor() {
	}

	/**
	 * @param {IRValue[]} args 
	 * @returns {?IRValue}
	 */
	call(args) {
		throw new Error("not a function");
	}

	/**
	 * @type {UplcValue}
	 */
	get value() {
		throw new Error("not a literal value");
	}
}

/**
 * @package
 */
export class IRFuncValue extends IRValue {
	#callback;

	/**
	 * @param {(args: IRValue[]) => ?IRValue} callback
	 */
	constructor(callback) {
		super();
		this.#callback = callback;
	}

	/**
	 * @param {IRValue[]} args 
	 * @returns {?IRValue}
	 */
	call(args) {
		return this.#callback(args);
	}
}

/**
 * @package
 */
export class IRLiteralValue extends IRValue {
	#value;

	/**
	 * @param {UplcValue} value 
	 */
	constructor(value) {
		super();
		this.#value = value;
	}

	/**
	 * @type {UplcValue}
	 */
	get value() {
		return this.#value;
	}
}

/**
 * @package
 */
export class IRDeferredValue extends IRValue {
    #deferred;

    /**
     * @type {undefined | null | IRValue}
     */
    #cache;

    /**
     * @param {() => ?IRValue} deferred
     */
    constructor(deferred) {
        super();
        this.#deferred = deferred;
        this.#cache = undefined;
    }
    /**
     * @param {IRValue[]} args 
     * @returns {?IRValue}
     */
    call(args) {
        if (this.#cache === undefined) {
            this.#cache = this.#deferred();
        }
        
        if (this.#cache != null) {
            return this.#cache.call(args);
        } else {
            return null;
        }
    }

    /**
     * @type {UplcValue}
     */
    get value() {
        if (this.#cache === undefined) {
            this.#cache = this.#deferred();
        }
        
        if (this.#cache != null) {
            return this.#cache.value;
        } else {
            throw new Error("not a value");
        }
    }

}

/**
 * @package
 */
export class IRCallStack {
	#throwRTErrors;
	#parent;
	#variable;
	#value;

	/**
	 * @param {boolean} throwRTErrors
	 * @param {?IRCallStack} parent 
	 * @param {?IRVariable} variable 
	 * @param {?IRValue} value 
	 */
	constructor(throwRTErrors, parent = null, variable = null, value = null) {
		this.#throwRTErrors = throwRTErrors;
		this.#parent = parent;
		this.#variable = variable;
		this.#value = value;
	}

	get throwRTErrors() {
		return this.#throwRTErrors;
	}

	/**
	 * @param {IRVariable} variable 
	 * @returns {?IRValue}
	 */
	get(variable) {
		if (this.#variable !== null && this.#variable === variable) {
			return this.#value;
		} else if (this.#parent !== null) {
			return this.#parent.get(variable);
		} else {
			return null;
		}
	}

	/**
	 * @param {IRVariable} variable 
	 * @param {IRValue} value 
	 * @returns {IRCallStack}
	 */
	set(variable, value) {
		return new IRCallStack(this.#throwRTErrors, this, variable, value);
	}
}