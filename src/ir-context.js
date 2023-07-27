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
    UPLC_BUILTINS
} from "./uplc-builtins.js";

import {
    UplcValue
} from "./uplc-ast.js";

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
	 * @returns {number}
	 */
	static findBuiltin(name) {
		let i = UPLC_BUILTINS.findIndex(info => { return "__core__" + info.name == name });
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

/**
 * @internal
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
	 * @type {null | UplcValue}
	 */
	get value() {
		throw new Error("not a literal value");
	}
}

/**
 * @internal
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
 * @internal
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
 * @internal
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
     * @returns {null | IRValue}
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
     * @type {null | UplcValue}
     */
    get value() {
        if (this.#cache === undefined) {
            this.#cache = this.#deferred();
        }
        
        if (this.#cache !== undefined) {
            return this.#cache?.value ?? null;
        } else {
            throw new Error("not a value");
        }
    }

}

/**
 * @internal
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
			return new IRValue()
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

	/**
	 * @returns {string[]}
	 */
	dump() {
		return (this.#parent?.dump() ?? []).concat([this.#variable?.name ?? ""])
	}
}