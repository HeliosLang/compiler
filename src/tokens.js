//@ts-check
// Tokens

import {
	TAB
} from "./config.js";

import {
    Source,
    assert,
    assertDefined,
    bytesToHex,
	replaceTabs
} from "./utils.js";

/**
 * @typedef {import("./utils.js").TransferUplcAst} TransferUplcAst
 */

/**
 * Each Token/Expression/Statement has a Site, which encapsulates a position in a Source
 * @package
 */
export class Site {
	#src;
	#startPos;
	#endPos;

	/** @type {null | Site} - end of token, exclusive, TODO: replace with endPos */
	#endSite;

	/** @type {null | Site} */
	#codeMapSite;

	/**
	 * @param {Source} src 
	 * @param {number} startPos
	 * @param {number} endPos 
	 */
	constructor(src, startPos, endPos = startPos + 1, codeMapSite = null) {
		this.#src = src;
		this.#startPos = startPos;
		this.#endPos = endPos;
		this.#endSite = null;
		this.#codeMapSite = codeMapSite;
	}

	/**
	 * 
	 * @param {TransferUplcAst} other 
	 */
	transfer(other) {
		return other.transferSite(
			this.#src.transfer(other),
			this.#startPos,
			this.#endPos,
			this.#codeMapSite?.transfer(other) ?? null
		)
	}

	static dummy() {
		return new Site(new Source(""), 0);
	}

	get src() {
		return this.#src;
	}

	get startPos() {
		return this.#startPos;
	}

	get endPos() {
		return this.#endPos;
	}
	
	get endSite() {
		return this.#endSite;
	}

	/**
	 * @param {Site} other 
	 * @returns {Site}
	 */
	merge(other) {
		return new Site(this.#src, this.#startPos, other.#endPos);
	}

	/**
	 * @param {?Site} site
	 */
	setEndSite(site) {
		this.#endSite = site;
	}

	/**
	 * @type {?Site} 
	 */
	get codeMapSite() {
		return this.#codeMapSite;
	}

	/**
	 * @param {Site} site 
	 */
	setCodeMapSite(site) {
		this.#codeMapSite = site;
	}

	/**
	 * Returns a SyntaxError
	 * @param {string} info 
	 * @returns {UserError}
	 */
	syntaxError(info = "") {
		return UserError.syntaxError(this.#src, this.#startPos, this.#endPos, info);
	}

	/**
	 * Returns a TypeError
	 * @param {string} info
	 * @returns {UserError}
	 */
	typeError(info = "") {
		return UserError.typeError(this.#src, this.#startPos, this.#endPos, info);
	}

	/**
	 * Returns a ReferenceError
	 * @param {string} info 
	 * @returns {UserError}
	 */
	referenceError(info = "") {
		return UserError.referenceError(this.#src, this.#startPos, this.#endPos, info);
	}

	/**
	 * Returns a RuntimeError
	 * @param {string} info
	 * @returns {UserError}
	 */
	runtimeError(info = "") {
		if (this.#codeMapSite !== null) {
			let site = this.#codeMapSite;
			return RuntimeError.newRuntimeError(site.#src, site.#startPos, false, info);
		} else {
			return RuntimeError.newRuntimeError(this.#src, this.#startPos, true, info);
		}
	}

	/**
	 * Calculates the column,line position in 'this.#src'
	 * @returns {[number, number, number, number]} - [startLine, startCol, endLine, endCol]
	 */
	getFilePos() {
		const [startLine, startCol] = this.#src.posToLineAndCol(this.#startPos);

		const [endLine, endCol] = this.#src.posToLineAndCol(this.#endPos);

		return [startLine, startCol, endLine, endCol];
	}
}


/**
 * UserErrors are generated when the user of Helios makes a mistake (eg. a syntax error),
 * or when the user of Helios throws an explicit error inside a script (eg. division by zero).
 */
 export class UserError extends Error {
	#src;
	#startPos;
	#endPos;

	/**
	 * @type {Object}
	 */
	#context; // additional context

	/**
	 * @param {string} msg
	 * @param {Source} src 
	 * @param {number} startPos 
	 * @param {number} endPos
	 */
	constructor(msg, src, startPos, endPos = startPos + 1) {
		super(msg);
		this.#src = src;
		this.#startPos = startPos;
		this.#endPos = endPos;
		this.#context = {};
	}

	/**
	 * @param {string} type
	 * @param {Source} src 
	 * @param {number} startPos 
	 * @param {number} endPos
	 * @param {string} info 
	 */
	static new(type, src, startPos, endPos, info = "") {
		let line = src.posToLine(startPos);

		let msg = `${type} on line ${line + 1}`;
		if (info != "") {
			msg += `: ${info}`;
		}

		return new UserError(msg, src, startPos, endPos);
	}

	/**
	 * @type {Source}
	 */
	get src() {
		return this.#src;
	}

	/**
	 * @type {Object}
	 */
	get context() {
		return this.#context;
	}

	/**
	 * Constructs a SyntaxError
	 * @param {Source} src 
	 * @param {number} startPos 
	 * @param {number} endPos
	 * @param {string} info 
	 * @returns {UserError}
	 */
	static syntaxError(src, startPos, endPos, info = "") {
		const error = UserError.new("SyntaxError", src, startPos, endPos, info);

		src.errors.push(error);

		return error;
	}

	/**
	 * Constructs a TypeError
	 * @param {Source} src 
	 * @param {number} startPos 
	 * @param {number} endPos
	 * @param {string} info 
	 * @returns {UserError}
	 */
	static typeError(src, startPos, endPos, info = "") {
		const error = UserError.new("TypeError", src, startPos, endPos, info);

		src.errors.push(error);

		return error;
	}

	/**
	 * @param {Error} e 
	 * @returns {boolean}
	 */
	static isTypeError(e) {
		return (e instanceof UserError) && e.message.startsWith("TypeError");
	}

	/**
	 * Constructs a ReferenceError (i.e. name undefined, or name unused)
	 * @param {Source} src 
	 * @param {number} startPos 
	 * @param {number} endPos
	 * @param {string} info 
	 * @returns {UserError}
	 */
	static referenceError(src, startPos, endPos, info = "") {
		const error = UserError.new("ReferenceError", src, startPos, endPos, info);

		src.errors.push(error);

		return error;
	}

	/**
	 * @param {Error} e 
	 * @returns {boolean}
	 */
	static isReferenceError(e) {
		return (e instanceof UserError) && e.message.startsWith("ReferenceError");
	}

	get data() {
		throw new Error("is error");
	}

	/**
	 * @type {number}
	 */
	get startPos() {
		return this.#startPos;
	}

	/**
	 * Calculates column/line position in 'this.src'.
	 * @returns {[number, number, number, number]} - [startLine, startCol, endLine, endCol]
	 */
	getFilePos() {
		const [startLine, startCol] = this.#src.posToLineAndCol(this.#startPos);
		const [endLine, endCol] = this.#src.posToLineAndCol(this.#endPos);

		return [startLine, startCol, endLine, endCol];
	}

	/**
	 * Dumps the error without throwing.
	 * If 'verbose == true' the Source is also pretty printed with line-numbers.
	 * @param {boolean} verbose 
	 */
	dump(verbose = false) {
		if (verbose) {
			console.error(this.#src.pretty());
		}

		console.error("\n" + this.message);
	}

	/**
	 * Returns the error message (alternative to e.message)
	 * @returns {string}
	 */
	toString() {
		return this.message;
	}

	/**
	 * Catches any UserErrors thrown inside 'fn()`.
	 * Dumps the error
	 * @template T
	 * @param {() => T} fn 
	 * @param {boolean} verbose 
	 * @returns {T | undefined}	
	 */
	static catch(fn, verbose = false) {
		try {
			return fn();
		} catch (error) {
			if (error instanceof UserError) {
				error.dump(verbose);
			} else {
				throw error;
			}
		}
	}
}

/**
 * @typedef {(error: UserError) => void} Throw
 */

/**
 * @package
 */
export class RuntimeError extends UserError {
	#isIR; // last trace added

	/**
	 * @param {string} msg 
	 * @param {Source} src 
	 * @param {number} pos 
	 * @param {boolean} isIR 
	 */
	constructor(msg, src, pos, isIR) {
		super(msg, src, pos);
		this.#isIR = isIR;
	}

	/**
	 * @param {Source} src 
	 * @param {number} pos 
	 * @param {boolean} isIR
	 * @param {string} info
	 * @returns {RuntimeError}
	 */
	static newRuntimeError(src, pos, isIR, info = "") {
		let line = src.posToLine(pos);

		let msg = `RuntimeError on line ${line + 1}${isIR ? " of IR" : ""}`;
		if (info != "") {
			msg += `: ${info}`;
		}

		return new RuntimeError(msg, src, pos, isIR);
	}

	/**
	 * @param {Source} src 
	 * @param {number} pos 
	 * @param {boolean} isIR 
	 * @param {string} info 
	 * @returns {RuntimeError}
	 */
	addTrace(src, pos, isIR, info = "") {
		if (isIR && !this.#isIR) {
			return this;
		}

		let line = src.posToLine(pos);

		let msg = `Trace${info == "" ? ":" : ","} line ${line + 1}`;
		if (isIR) {
			msg += " of IR";
		} 

		let word = src.getWord(pos);
		if (word !== null && word !== "print") {
			msg += ` in '${word}'`;
		}

		if (info != "") {
			msg += `: ${info}`;
		}

		
		msg += "\n" + this.message;

		return new RuntimeError(msg, this.src, this.startPos, isIR);
	}
	
	/**
	 * @param {Site} site 
	 * @param {string} info 
	 * @returns {RuntimeError}
	 */
	addTraceSite(site, info = "") {
		if (site.codeMapSite === null) {
			return this.addTrace(site.src, site.startPos, true, info);
		} else {
			return this.addTrace(site.codeMapSite.src, site.codeMapSite.startPos, false, info);
		}
	}
}

/**
 * Token is the base class of all Expressions and Statements
 */
export class Token {
	#site;

	/**
	 * @param {Site} site 
	 */
	constructor(site) {
		this.#site = assertDefined(site); // position in source of start of token
	}

	get site() {
		return this.#site;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		throw new Error("not yet implemented");
	}

	/**
	 * Returns 'true' if 'this' is a literal primitive, a literal struct constructor, or a literal function expression.
	 * @returns {boolean}
	 */
	isLiteral() {
		return false;
	}

	/**
	 * Returns 'true' if 'this' is a Word token.
	 * @param {?(string | string[])} value
	 * @returns {boolean}
	 */
	isWord(value = null) {
		return false;
	}

	/**
	 * @returns {boolean}
	 */
	isKeyword() {
		return false;
	}

	/**
	 * Returns 'true' if 'this' is a Symbol token (eg. '+', '(' etc.)
	 * @param {?(string | string[])} value
	 * @returns {boolean}
	 */
	isSymbol(value = null) {
		return false;
	}

	/**
	 * Returns 'true' if 'this' is a group (eg. '(...)').
	 * @param {?string} value
	 * @param {number | null} nFields
	 * @returns {boolean}
	 */
	isGroup(value, nFields = null) {
		return false;
	}

	/**
	 * Returns a SyntaxError at the current Site.
	 * @param {string} msg 
	 * @returns {UserError}
	 */
	syntaxError(msg) {
		return this.#site.syntaxError(msg);
	}

	/**
	 * Returns a TypeError at the current Site.
	 * @param {string} msg
	 * @returns {UserError}
	 */
	typeError(msg) {
		return this.#site.typeError(msg);
	}

	/**
	 * Returns a ReferenceError at the current Site.
	 * @param {string} msg
	 * @returns {UserError}
	 */
	referenceError(msg) {
		return this.#site.referenceError(msg);
	}

	/**
	 * Throws a SyntaxError if 'this' isn't a Word.
	 * @param {?(string | string[])} value 
	 * @returns {Word | null}
	 */
	assertWord(value = null) {
		if (value !== null) {
			this.syntaxError(`expected \'${value}\', got \'${this.toString()}\'`);
		} else {
			this.syntaxError(`expected word, got ${this.toString()}`);
		}

		return null;
	}

	/**
	 * Throws a SyntaxError if 'this' isn't a Symbol.
	 * @param {?(string | string[])} value 
	 * @returns {SymbolToken | null}
	 */
	assertSymbol(value = null) {
		if (value !== null) {
			this.syntaxError(`expected '${value}', got '${this.toString()}'`);
		} else {
			this.syntaxError(`expected symbol, got '${this.toString()}'`);
		}

		return null;
	}

	/**
	 * Throws a SyntaxError if 'this' isn't a Group.
	 * @param {?string} type 
	 * @param {?number} nFields
	 * @returns {Group | null}
	 */
	assertGroup(type = null, nFields = null) {
		if (type !== null) {
			this.syntaxError(`invalid syntax: expected '${type}...${Group.matchSymbol(type)}'`);
		} else {
			this.syntaxError(`invalid syntax: expected group`);
		}

		return null;
	}
}

/**
 * @package
 * @param {undefined | null | Token} t
 * @param {Site} site
 * @param {string} msg
 * @returns {null | Token}
 */
export function assertToken(t, site, msg = "expected token") {
	if (!t) {
		site.syntaxError(msg);
		return null;
	} else {
		return t;
	}
}

/**
 * A Word token represents a token that matches /[A-Za-z_][A-Za-z_0-9]/
 * @package
 */
export class Word extends Token {
	#value;

	/**
	 * @param {Site} site 
	 * @param {string} value 
	 */
	constructor(site, value) {
		super(site);
		this.#value = value;
	}

	/**
	 * @param {string} value 
	 * @returns {Word}
	 */
	static new(value) {
		return new Word(Site.dummy(), value);
	}

	get value() {
		return this.#value;
	}

	/**
	 * @param {?(string | string[])} value 
	 * @returns {boolean}
	 */
	isWord(value = null) {
		if (value !== null) {
			if (value instanceof Array) {
				return value.lastIndexOf(this.#value) != -1;
			} else {
				return value == this.#value;
			}
		} else {
			return true;
		}
	}

	/**
	 * @param {?(string | string[])} value 
	 * @returns {Word}
	 */
	assertWord(value = null) {
		if (!this.isWord(value)) {
			super.assertWord(value);
		}

		return this;
	}

	/**
	 * @returns {Word}
	 */
	assertNotInternal() {
		if (this.#value == "_") {
			throw this.syntaxError("_ is reserved");
		} else if (this.#value.startsWith("__")) {
			throw this.syntaxError("__ prefix is reserved");
		} else if (this.#value.endsWith("__")) {
			throw this.syntaxError("__ suffix is reserved");
		}

		return this;
	}

	/**
	 * @returns {boolean}
	 */
	isKeyword() {
		switch (this.#value) {
			case "const":
			case "func":
			case "struct":
			case "enum":
			case "import":
			case "if":
			case "else":
			case "switch":
			case "self":
				return true;
			default:
				return false;
		}
	}

	/**
	 * @returns {Word | null}
	 */
	assertNotKeyword() {
		this.assertNotInternal();

		if (this.isKeyword()) {
			this.syntaxError(`'${this.#value}' is a reserved word`);
			return null;
		}

		return this;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return this.#value;
	}

	/**
	 * Finds the index of the first Word(value) in a list of tokens
	 * Returns -1 if none found
	 * @param {Token[]} ts 
	 * @param {string | string[]} value 
	 * @returns {number}
	 */
	static find(ts, value) {
		return ts.findIndex(item => item.isWord(value));
	}
}

/**
 * Symbol token represent anything non alphanumeric
 * @package
 */
export class SymbolToken extends Token {
	#value;

	/**
	 * @param {Site} site
	 * @param {string} value
	 */
	constructor(site, value) {
		super(site);
		this.#value = value;
	}

	get value() {
		return this.#value;
	}

	/**
	 * @param {?(string | string[])} value 
	 * @returns {boolean}
	 */
	isSymbol(value = null) {
		if (value !== null) {
			if (value instanceof Array) {
				return value.lastIndexOf(this.#value) != -1;
			} else {
				return value == this.#value;
			}
		} else {
			return true;
		}
	}

	/**
	 * @param {?(string | string[])} value 
	 * @returns {SymbolToken}
	 */
	assertSymbol(value) {
		if (!this.isSymbol(value)) {
			super.assertSymbol(value);
		}

		return this;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return this.#value;
	}

	/**
	 * Finds the index of the first Symbol(value) in a list of tokens.
	 * Returns -1 if none found.
	 * @param {Token[]} ts
	 * @param {string | string[]} value
	 * @returns {number}
	 */
	static find(ts, value) {
		return ts.findIndex(item => item.isSymbol(value));
	}

	/**
	 * Finds the index of the last Symbol(value) in a list of tokens.
	 * Returns -1 if none found.
	 * @param {Token[]} ts 
	 * @param {string | string[]} value 
	 * @returns {number}
	 */
	static findLast(ts, value) {
		for (let i = ts.length - 1; i >= 0; i--) {
			if (ts[i].isSymbol(value)) {
				return i;
			}
		}

		return -1;
	}
}

/**
 * Group token can '(...)', '[...]' or '{...}' and can contain comma separated fields.
 * @package
 */
export class Group extends Token {
	#type;
	#fields;
	#firstComma;

	/**
	 * @param {Site} site 
	 * @param {string} type - "(", "[" or "{"
	 * @param {Token[][]} fields 
	 * @param {?SymbolToken} firstComma
	 */
	constructor(site, type, fields, firstComma = null) {
		super(site);
		this.#type = type;
		this.#fields = fields; // list of lists of tokens
		this.#firstComma = firstComma;

		assert(fields.length < 2 || firstComma !== null);
	}

	get fields() {
		return this.#fields.slice(); // copy, so fields_ doesn't get mutated
	}

	/**
	 * @param {?string} type 
	 * @param {number | null} nFields
	 * @returns {boolean}
	 */
	isGroup(type = null, nFields = null) {
		const nFieldsOk = (nFields === null) || (nFields == this.#fields.length);

		if (type !== null) {
			return this.#type == type && nFieldsOk;
		} else {
			return nFieldsOk;
		}
	}

	/**
	 * @param {?string} type 
	 * @param {?number} nFields 
	 * @returns {Group | null}
	 */
	assertGroup(type = null, nFields = null) {
		if (type !== null && this.#type != type) {
			this.syntaxError(`invalid syntax: expected '${type}...${Group.matchSymbol(type)}', got '${this.#type}...${Group.matchSymbol(this.#type)}'`);

			return null;
		} else if (type !== null && nFields !== null && nFields != this.#fields.length) {
			if (this.#fields.length > 1 && nFields <= 1 && this.#firstComma !== null) {
				this.#firstComma.syntaxError(`invalid syntax, unexpected ','`);
			} else {
				this.syntaxError(`invalid syntax: expected '${type}...${Group.matchSymbol(type)}' with ${nFields} field(s), got '${type}...${Group.matchSymbol(type)}' with ${this.#fields.length} fields`);
			}

			return null;
		} else {
			return this;
		}
	}

	/**
	 * @returns {string}
	 */
	toString() {
		let s = this.#type;

		let parts = [];
		for (let f of this.#fields) {
			parts.push(f.map(t => t.toString()).join(" "));
		}

		s += parts.join(", ") + Group.matchSymbol(this.#type);

		return s;
	}

	/**
	 * @param {Token} t 
	 * @returns {boolean}
	 */
	static isOpenSymbol(t) {
		return t.isSymbol("{") || t.isSymbol("[") || t.isSymbol("(");
	}

	/**
	 * @param {Token} t 
	 * @returns {boolean}
	 */
	static isCloseSymbol(t) {
		return t.isSymbol("}") || t.isSymbol("]") || t.isSymbol(")");
	}

	/**
	 * Returns the corresponding closing bracket, parenthesis or brace.
	 * Throws an error if not a group symbol.
	 * @example
	 * Group.matchSymbol("(") => ")"
	 * @param {string | SymbolToken} t
	 * @returns {string}
	 */
	static matchSymbol(t) {
		if (t instanceof SymbolToken) {
			t = t.value;
		}

		if (t == "{") {
			return "}";
		} else if (t == "[") {
			return "]";
		} else if (t == "(") {
			return ")";
		} else if (t == "}") {
			return "{";
		} else if (t == "]") {
			return "[";
		} else if (t == ")") {
			return "(";
		} else {
			throw new Error("not a group symbol");
		}
	}

	/**
	 * Finds the index of first Group(type) in list of tokens
	 * Returns -1 if none found.
	 * @param {Token[]} ts 
	 * @param {string} type 
	 * @returns {number}
	 */
	static find(ts, type) {
		return ts.findIndex(item => item.isGroup(type));
	}
}

/**
 * Base class of literal tokens
 * @package
 */
export class PrimitiveLiteral extends Token {
	/**
	 * @param {Site} site 
	 */
	constructor(site) {
		super(site);
	}

	/**
	 * @returns {boolean}
	 */
	isLiteral() {
		return true;
	}
}

/**
 * Signed int literal token
 * @package
 */
export class IntLiteral extends PrimitiveLiteral {
	#value;

	/**
	 * @param {Site} site 
	 * @param {bigint} value 
	 */
	constructor(site, value) {
		super(site);
		this.#value = value;
	}

	get value() {
		return this.#value;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return this.#value.toString();
	}
}

/**
 * Fixed point number literal token
 * @package
 */
export class RealLiteral extends PrimitiveLiteral {
	#value;

	/**
	 * @param {Site} site 
	 * @param {bigint} value 
	 */
	constructor(site, value) {
		super(site);
		this.#value = value;
	}

	get value() {
		return this.#value;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return this.#value.toString();
	}
}

/**
 * Bool literal token
 * @package
 */
export class BoolLiteral extends PrimitiveLiteral {
	#value;

	/**
	 * @param {Site} site 
	 * @param {boolean} value 
	 */
	constructor(site, value) {
		super(site);
		this.#value = value;
	}

	get value() {
		return this.#value;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return this.#value ? "true" : "false";
	}
}

/**
 * ByteArray literal token
 * @package
 */
export class ByteArrayLiteral extends PrimitiveLiteral {
	#bytes;

	/**
	 * @param {Site} site 
	 * @param {number[]} bytes 
	 */
	constructor(site, bytes) {
		super(site);
		this.#bytes = bytes;
	}

	get bytes() {
		return this.#bytes;
	}

	toString() {
		return `#${bytesToHex(this.#bytes)}`;
	}
}

/**
 * String literal token (utf8)
 * @package
 */
export class StringLiteral extends PrimitiveLiteral {
	#value;

	/**
	 * @param {Site} site 
	 * @param {string} value 
	 */
	constructor(site, value) {
		super(site);
		this.#value = value;
	}

	get value() {
		return this.#value;
	}

	toString() {
		return `"${this.#value.toString()}"`;
	}
}

/**
 * @package
 * @typedef {[number, Site][]} CodeMap
 */

/**
 * @package
 * @typedef {Map<string, IR>} IRDefinitions
 */

/**
 * The IR class combines a string of intermediate representation sourcecode with an optional site.
 * The site is used for mapping IR code to the original source code.
 * @package
 */
 export class IR {
	#content;
	#site;

	/**
	 * @param {string | IR[]} content 
	 * @param {?Site} site 
	 */
	constructor(content, site = null) {
		assert(!(Array.isArray(content) && content.some(item => item == undefined)), "some items undefined");
		this.#content = content;
		this.#site = site;
	}

    /**
     * @package
     * @type {string | IR[]}
     */
	get content() {
		return this.#content;
	}

    /**
     * @package
     * @type {?Site}
     */
	get site() {
		return this.#site;
	}

	/**
	 * Returns a list containing IR instances that themselves only contain strings
     * @package
	 * @returns {IR[]}
	 */
	flatten() {
		if (typeof this.#content == "string") {
			return [this];
		} else {
			/**
			 * @type {IR[]}
			 */
			let result = [];

			for (let item of this.#content) {
				result = result.concat(item.flatten());
			}

			return result;
		}
	}

	/**
	 * Intersperse nested IR content with a separator
     * @package
	 * @param {string} sep
	 * @returns {IR}
	 */
	join(sep) {
		if (typeof this.#content == "string") {
			return this;
		} else {
			/** @type {IR[]} */
			const result = [];

			for (let i = 0; i < this.#content.length; i++) {
				result.push(this.#content[i]);

				if (i < this.#content.length - 1) {
					result.push(new IR(sep))
				}
			}

			return new IR(result);
		}
	}

    /**
     * @package
	 * @returns {[string, CodeMap]}
	 */
	generateSource() {
		const parts = this.flatten();

		/** @type {string[]} */
		const partSrcs = [];

		/** @type {CodeMap} */
		const codeMap = [];

		let pos = 0;
		for (let part of parts) {
			const rawPartSrc = part.content;

			if (typeof rawPartSrc == "string") {
				const origSite = part.site;
				if (origSite !== null) {
					/** @type {[number, Site]} */
					const pair = [pos, origSite];

					codeMap.push(pair);
				}

				const partSrc = replaceTabs(rawPartSrc);

				pos += partSrc.length;
				partSrcs.push(partSrc);
			} else {
				throw new Error("expected IR to contain only strings after flatten");
			}
		}

		return [partSrcs.join(""), codeMap];
	}

	/**
	 * @returns {string}
	 */
	pretty() {
		const [src, _] = this.generateSource();

		return (new Source(src)).pretty();
	}

	/**
	 * Wraps 'inner' IR source with some definitions (used for top-level statements and for builtins)
     * @package
	 * @param {IR} inner 
	 * @param {IRDefinitions} definitions - name -> definition
	 * @returns {IR}
	 */
	static wrapWithDefinitions(inner, definitions) {
		const keys = Array.from(definitions.keys()).reverse();

		let res = inner;
		for (let key of keys) {
			const definition = definitions.get(key);

			if (definition === undefined) {
				throw new Error("unexpected");
			} else {

				res = new IR([new IR("("), new IR(key), new IR(") -> {\n"),
					res, new IR(`\n}(\n${TAB}/*${key}*/\n${TAB}`), definition,
				new IR("\n)")]);
			}
		}

		return res;
	}
}
