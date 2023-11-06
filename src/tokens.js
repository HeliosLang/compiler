//@ts-check
// Tokens

import {
	TAB
} from "./config.js";

import {
    Source,
    assert,
	assertClass,
    assertDefined,
    bytesToHex,
	replaceTabs
} from "./utils.js";

/**
 * @typedef {import("./utils.js").TransferUplcAst} TransferUplcAst
 */

/**
 * Each Token/Expression/Statement has a Site, which encapsulates a position in a Source
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
	 * @param {Site | null} codeMapSite
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
		return new Site(new Source("", ""), 0);
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
		return new Site(this.#src, this.#startPos, other.#endPos, this.#codeMapSite ?? other.#codeMapSite);
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
	 * Calculates the column,line position in 'this.#src'
	 * @returns {[number, number, number, number]} - [startLine, startCol, endLine, endCol]
	 */
	getFilePos() {
		const [startLine, startCol] = this.#src.posToLineAndCol(this.#startPos);

		const [endLine, endCol] = this.#src.posToLineAndCol(this.#endPos);

		return [startLine, startCol, endLine, endCol];
	}

	/**
	 * @returns {string}
	 */
	toString() {
		const [startLine, startCol] = this.#src.posToLineAndCol(this.#startPos);

		return `${this.src.name}:${startLine+1}:${startCol+1}`;
	}
}


/**
 * UserErrors are generated when the user of Helios makes a mistake (eg. a syntax error).
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
	 * @internal
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
	 * @internal
	 * @param {string} type
	 * @param {Source} src 
	 * @param {number} startPos 
	 * @param {number} endPos
	 * @param {string} info 
	 */
	static new(type, src, startPos, endPos, info = "") {
		let [line, col] = src.posToLineAndCol(startPos);

		let msg = `(${src.name}:${line+1}:${col+1}) ${type}`;
		if (info != "") {
			msg += `: ${info}`;
		}

		return new UserError(msg, src, startPos, endPos);
	}

	/**
	 * @internal
	 * @type {Source}
	 */
	get src() {
		return this.#src;
	}

	/**
	 * Filled with CBOR hex representations of Datum, Redeemer and ScriptContext by validation scripts throwing errors during `tx.finalize()`; and Redeemer and ScriptContext by minting scripts throwing errors.
	 * @type {Object}
	 */
	get context() {
		return this.#context;
	}

	/**
	 * Constructs a SyntaxError
	 * @internal
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
	 * @internal
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
	 * @internal
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

	/**
	 * @internal
	 */
	get data() {
		throw new Error("is error");
	}

	/**
	 * @internal
	 * @type {number}
	 */
	get startPos() {
		return this.#startPos;
	}

	/**
	 * Calculates column/line position in 'this.src'.
	 * @internal
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
	 * @internal
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
 * Used for errors thrown during Uplc evaluation
 */
export class RuntimeError extends Error {
	/**
	 * @type {Object}
	 */
	#context; // additional context

	/**
	 * @internal
	 * @param {string} msg
	 */
	constructor(msg) {
		super(msg);

		this.#context = {};
	}

	get context() {
		return this.#context;
	}
}

/**
 * Token is the base class of all Expressions and Statements
 * @internal
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
 * @internal
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
 * @internal
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
 * @internal
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
 * @internal
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
	 * Group.matchSymbol("(") == ")"
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
 * @internal
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
 * @internal
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
 * @internal
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
 * @internal
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
 * @internal
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
 * @internal
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
 * @internal
 * @typedef {[number, Site][]} CodeMap
 */

/**
 * @internal
 * @typedef {Map<string, IR>} IRDefinitions
 */

/**
 * The IR class combines a string of intermediate representation sourcecode with an optional site.
 * The site is used for mapping IR code to the original source code.
 * @internal
 */
 export class IR {
	#content;
	#site;

	/**
	 * @param {string | IR[]} content 
	 * @param {null | Site} site 
	 */
	constructor(content, site = null) {
		assert(!(Array.isArray(content) && content.some(item => item == undefined)), "some items undefined");
		this.#content = content;
		this.#site = site;
	}

    /**
     * @internal
     * @type {string | IR[]}
     */
	get content() {
		return this.#content;
	}

    /**
     * @internal
     * @type {?Site}
     */
	get site() {
		return this.#site;
	}

	/**
	 * Can be used as a template literal tag function
	 * @param {string | TemplateStringsArray | IR[]} content 
	 * @param  {...(Site | string | IR | IR[] | null | number)} args 
	 * @returns {IR}
	 */
	static new(content, ...args) {
		if (typeof content == "string") {
			if (args.length == 0) {
				return new IR(content);
			} else if (args.length == 1 && args[0] instanceof Site) {
				const site = args[0];

				if (site instanceof Site) {
					return new IR(content, site);
				} else {
					throw new Error("unexpected second argument");
				}
			} else {
				throw new Error("unexpected second argument");
			}
		} else if ("raw" in content) {
			const raw = content.raw.slice();

			/**
			 * @type {IR[]}
			 */
			let items = [];
			
			/**
			 * @type {Site | null}
			 */
			let lastSite = null;
			
			if (raw.length > 0 && raw[raw.length - 1] == "" && args.length > 0 && args[args.length -1 ] instanceof Site) {
				raw.pop();
				lastSite = assertClass(args.pop(), Site);
			}

			let s = "";

			for (let c of raw) {
				s += c;

				const a = args.shift();

				if (a instanceof Site) {
					items.push(new IR(s, a));
					s = "";
				} else if (a instanceof IR) {
					if (s != "") {
						items.push(new IR(s));
						s = "";
					}

					items.push(a);
				} else if (Array.isArray(a)) {
					if (s != "") {
						items.push(new IR(s));
						s = "";
					}

					a.forEach(ir => items.push(ir));
				} else if (typeof a == "string" || typeof a == "number") {
					s += a.toString();
				} else if (a === undefined || a === null) {
					if (s != "") {
						items.push(new IR(s));
						s = "";
					}
				} else {
					throw new Error("unexpected second argument");
				}
			}

			assert(args.length == 0);

			if (s != "") {
				items.push(new IR(s));
			}

			return new IR(items, lastSite);
		} else if (Array.isArray(content)) {
			/**
			 * @type {IR[]}
			 */
			let items = [];

			for (let c of content) {
				items.push(c);
			}

			if (args.length == 0) {
				return new IR(items);
			} else if (args.length == 1) {
				const arg = args[0];
				if (arg instanceof Site) {
					return new IR(items, arg);
				} else {
					throw new Error("unexpected second argument");
				}
			} else {
				throw new Error("unexpected second argument");
			}
		} else {
			throw new Error("unexpected first argument");
		}
	}

	/**
	 * @returns {any}
	 */
	dump() {
		if (typeof this.#content == "string") {
			return this.#content;
		} else {
			return this.#content.map(c => c.dump());
		}
	}

	/**
	 * Returns a list containing IR instances that themselves only contain strings
     * @internal
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
     * @internal
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
	 * @returns {string}
	 */
	toString() {
		return this.flatten().map(p => typeof p.content == "string" ? p.content : "").join("");
	}

    /**
     * @internal
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

		return (new Source(src, "")).pretty();
	}

	/**
	 * @param {string} str 
	 * @returns {boolean}
	 */
	includes(str) {
		if (typeof this.#content == "string") {
			return this.#content.includes(str);
		} else {
			return this.#content.some(ir => ir.includes(str));
		}
	}

	/**
	 * @param {RegExp} re 
	 * @param {string} newStr
	 * @returns {IR}
	 */
	replace(re, newStr) {
		if (typeof this.#content == "string") {
			return new IR(this.#content.replace(re, newStr), this.#site);
		} else {
			return new IR(this.#content.map(ir => ir.replace(re, newStr), this.#site));
		}
	}

	/**
	 * 
	 * @param {RegExp} re 
	 * @param {(match: string) => void} callback 
	 */
	search(re, callback) {
		if (typeof this.#content == "string") {
			const ms = this.#content.match(re);

			if (ms) {
				for (let m of ms) {
					callback(m);
				}
			}
		} else {
			this.#content.forEach(ir => ir.search(re, callback));
		}
	}

	/**
	 * Wraps 'inner' IR source with some definitions (used for top-level statements and for builtins)
     * @internal
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

/**
 * @internal
 */
export const RE_IR_PARAMETRIC_NAME = /[a-zA-Z_][a-zA-Z_0-9]*[[][a-zA-Z_0-9@[\]]*/g;


/**
 * Type type parameter prefix
 * @internal
 */
export const TTPP = "__T";

/**
 * Func type parameter prefix
 * @internal
 */
export const FTPP = "__F";

const RE_TEMPLATE_NAME = new RegExp(`\\b(${TTPP}|${FTPP})[0-9]*\\b`);

/**
 * @internal
 */
export class IRParametricName {
	/**
	 * Base type name
	 * @type {string}
	 */
	#base;

	/**
	 * Type type parameters
	 * Note: nested type names can stay strings
	 * Note: can be empty
	 * @type {string[]}
	 */
	#ttp;

	/**
	 * Function name
	 * @type {string}
	 */
	#fn;

	/**
	 * Function type parameters
	 * Note: can be empty
	 * @type {string[]}
	 */
	#ftp;

	/**
	 * @param {string} base 
	 * @param {string[]} ttp 
	 * @param {string} fn 
	 * @param {string[]} ftp 
	 */
	constructor(base, ttp, fn = "", ftp = []) {
		this.#base = base;
		this.#ttp = ttp;
		this.#fn = fn;
		this.#ftp = ftp;
	}

	/**
	 * @param {string} base 
	 * @param {number} nTtps 
	 * @param {string} fn 
	 * @param {number} nFtps 
	 * @returns 
	 */
	static newTemplate(base, nTtps, fn = "", nFtps = 0) {
		return new IRParametricName(
			base, 
			(new Array(nTtps)).map((_, i) => `${TTPP}${i}`),
			fn,
			(new Array(nFtps)).map((_, i) => `${FTPP}${i}`)
		);
	}

	/**
	 * @type {string[]}
	 */
	get ttp() {
		return this.#ttp;
	}

	/**
	 * @type {string[]}
	 */
	get ftp() {
		return this.#ftp;
	}

	/**
	 * @type {string}
	 */
	get base() {
		return this.#base;
	}

	/**
	 * @type {string}
	 */
	get fn() {
		return this.#fn;
	}

	/**
	 * @param {string[]} ttp 
	 * @param {string[]} ftp 
	 * @returns {IRParametricName}
	 */
	toImplementation(ttp, ftp = []) {
		assert(ttp.length == this.#ttp.length, `expected ${this.#ttp.length} type parameters, got ${ttp.length} (in ${this.toString()})`);
		assert(ftp.length == this.#ftp.length, `expected ${this.#ftp.length} function type parameters, got ${ftp.length} (in ${this.toString()})`);

		return new IRParametricName(this.#base, ttp, this.#fn, ftp);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `${this.#base}${this.#ttp.length > 0 ? `[${this.#ttp.join("@")}]` : ""}${this.#fn}${this.#ftp.length > 0 ? `[${this.#ftp.join("@")}]` : ""}`;
	}

	/**
	 * @param {boolean} emptyParameters
	 * @return {string}
	 */
	toTemplate(emptyParameters = false) {
		if (emptyParameters) {
			return `${this.#base}${this.#ttp.length > 0 ? "[]" : ""}${this.#fn}${this.#ftp.length > 0 ? "[]" : ""}`;
		} else {
			return `${this.#base}${this.#ttp.length > 0 ? `[${this.#ttp.map((_, i) => `${TTPP}${i}`).join("@")}]` : ""}${this.#fn}${this.#ftp.length > 0 ? `[${this.#ftp.map((_, i) => `${FTPP}${i}`).join("@")}]` : ""}`;
		}
	}

	/**
	 * @param {IR} ir
	 * @returns {IR}
	 */
	replaceTemplateNames(ir) {
		this.#ttp.forEach((name, i) => {
			ir = ir.replace(new RegExp(`\\b${TTPP}${i}`, "gm"), name);
		})

		this.#ftp.forEach((name, i) => {
			ir = ir.replace(new RegExp(`\\b${FTPP}${i}`, "gm"), name);
		})

		return ir;
	}

	/**
	 * @example
 	 * IRParametricName.matches("__helios__map[__T0@__T1]__fold[__F2@__F3]") == true
	 * @example
	 * IRParametricName.matches("__helios__int") == false
	 * @example
	 * IRParametricName.matches("__helios__option[__T0]__none__new") == true
	 * @param {string} str 
	 * @returns {boolean}
	 */
	static matches(str) {
		return str.match(RE_IR_PARAMETRIC_NAME) ? true : false;
	}

	/**
	 * @param {string} name 
	 * @returns {boolean}
	 */
	static isTemplate(name) {
		return name.match(RE_TEMPLATE_NAME) ? true : false;
	}

	/**
	 * @example
	 * IRParametricName.parse("__helios__map[__T0@__T1]__fold[__F0@__F1]").toString() == "__helios__map[__T0@__T1]__fold[__F0@__F1]"
	 * @example
	 * IRParametricName.parse("__helios__map[__helios__bytearray@__helios__map[__helios__bytearray@__helios__int]]__fold[__F0@__F1]").toString() == "__helios__map[__helios__bytearray@__helios__map[__helios__bytearray@__helios__int]]__fold[__F0@__F1]"
	 * @example
	 * IRParametricName.parse("__helios__map[__helios__bytearray@__helios__map[__helios__bytearray@__helios__list[__T0]]]__fold[__F0@__F1]").toString() == "__helios__map[__helios__bytearray@__helios__map[__helios__bytearray@__helios__list[__T0]]]__fold[__F0@__F1]"
	 * @param {string} str 
	 * @param {boolean} preferType
	 * @returns {IRParametricName}
	 */
	static parse(str, preferType = false) {
		let pos = 0;

		/**
		 * @returns {string}
		 */
		const eatAlphaNum = () => {
			let c = str.charAt(pos);

			const chars = [];

			while ((c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c == "_" || (c >= "0" && c <= "9")) {
				chars.push(c);

				pos++;

				c = str.charAt(pos);
			}
			
			return chars.join("");
		}

		/**
		 * @returns {string[]}
		 */
		const eatParams = () => {
			if (pos >= str.length) {
				return [];
			}
			
			let c = str.charAt(pos);

			assert(c == "[", `expected [, got ${c} (in ${str})`);

			const groups = [];
			let chars = [];

			let depth = 1;

			while (depth > 0) {
				pos++;

				c = str.charAt(pos);

				if (c == "[") {
					chars.push(c);
					depth++;
				} else if (c == "]") {
					if (depth > 1) {
						chars.push(c);
					} else {
						if (chars.length > 0) {
							groups.push(chars);	
						}
						chars = [];
					}
					depth--;
				} else if (c == "@") {
					if (depth > 1) {
						chars.push(c);
					} else {
						assert(chars.length > 0, "zero chars in group before @");
						groups.push(chars);
						chars = [];
					}
				} else if ((c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c == "_" || (c >= "0" && c <= "9")) {
					chars.push(c);
				} else {
					throw new Error(`unexpected char '${c}' in parametric name '${str}'`);
				}
			}

			// final closing bracket
			pos++;

			return groups.map(g => g.join(""));
		}

		/**
		 * 
		 * @param {string} base 
		 * @returns {[string, string]}
		 */
		const uneatFn = (base) => {
			let pos = base.length - 1;

			let c = base.charAt(pos);

			assert(c != "_", "unexpected underscore");

			let underscores = 0;

			while (pos > 0) {
				pos--;
				c = base.charAt(pos);

				if (underscores >= 2) {
					if (c != "_") {
						return [base.slice(0, pos+1), base.slice(pos+1)];
					} else {
						underscores++;
					}
				} else {
					if (c == "_") {
						underscores++;
					} else {
						underscores = 0;
					}
				}
			}

			throw new Error("bad name format");
		}

		let base = eatAlphaNum();

		let ttp = eatParams();
		let fn = "";
		let ftp = [];

		if (pos >= str.length) {
			if (!preferType) {
				[base, fn] = uneatFn(base);
				ftp = ttp;
				ttp = [];
			}
		} else {
			fn = eatAlphaNum();

			if (pos < str.length) {
				ftp = eatParams();
			}
		}

		return new IRParametricName(base, ttp, fn, ftp);
	}
}