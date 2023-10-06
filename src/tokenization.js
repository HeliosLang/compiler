//@ts-check
// Tokenization

import {
	REAL_PRECISION
} from "./config.js"

import {
    Source,
    assert,
    assertDefined,
    hexToBytes,
	textToBytes
} from "./utils.js";

/**
 * @typedef {import("./tokens.js").CodeMap} CodeMap
 */

import {
    BoolLiteral,
    ByteArrayLiteral,
    Group,
    IntLiteral,
	RealLiteral,
    StringLiteral,
    Site,
    SymbolToken,
    Token,
    Word,
	assertToken
} from "./tokens.js";

/**
 * @internal
 */
export class Tokenizer {
	#src;
	#pos;

	/**
	 * Tokens are accumulated in '#ts'
	 * @type {Token[]} 
	 */
	#ts;
	#codeMap;
	#codeMapPos;

	#irMode;

	/**
	 * @param {Source} src 
	 * @param {?CodeMap} codeMap 
	 * @param {boolean} irMode - if true '@' is treated as a regular character
	 */
	constructor(src, codeMap = null, irMode = false) {
		assert(src instanceof Source);

		this.#src = src;
		this.#pos = 0;
		this.#ts = []; // reset to empty to list at start of tokenize()
		this.#codeMap = codeMap; // can be a list of pairs [pos, site in another source]
		this.#codeMapPos = 0; // not used if codeMap === null
		this.#irMode = irMode;
	}

	incrPos() {
		this.#pos += 1;
	}

	decrPos() {
		this.#pos -= 1;
		assert(this.#pos >= 0);
	}

	get currentSite() {
		return new Site(this.#src, this.#pos);
	}

	/**
	 * @param {Token} t 
	 */
	pushToken(t) {
		this.#ts.push(t);

		if (this.#codeMap !== null && this.#codeMapPos < this.#codeMap.length) {
			let pair = (this.#codeMap[this.#codeMapPos]);

			if (pair[0] == t.site.startPos) {
				t.site.setCodeMapSite(pair[1]);
				this.#codeMapPos += 1;
			}
		}
	}

	/**
	 * Reads a single char from the source and advances #pos by one
	 * @returns {string}
	 */
	readChar() {
		assert(this.#pos >= 0);

		let c;
		if (this.#pos < this.#src.length) {
			c = this.#src.getChar(this.#pos);
		} else {
			c = '\0';
		}

		this.incrPos();

		return c;
	}

	/**
	 * @returns {string}
	 */
	peekChar() {
		assert(this.#pos >= 0);

		if (this.#pos < this.#src.length) {
			return this.#src.getChar(this.#pos);
		} else {
			return '\0';
		}
	}

	/**
	 * Decreases #pos by one
	 */
	unreadChar() {
		this.decrPos();
	}

	/**
	 * Start reading precisely one token
	 * @param {Site} site 
	 * @param {string} c 
	 */
	readToken(site, c) {
		if (c == 'b') {
			this.readMaybeUtf8ByteArray(site);
		} else if (c == '_' || (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || (this.#irMode && (c == '@' || c == '[' || c == ']'))) {
			this.readWord(site, c);
		} else if (c == '/') {
			this.readMaybeComment(site);
		} else if (c == '0') {
			this.readSpecialInteger(site);
		} else if (c >= '1' && c <= '9') {
			this.readDecimal(site, c);
		} else if (c == '#') {
			this.readByteArray(site);
		} else if (c == '"') {
			this.readString(site);
		} else if (c == '?' || c == '!' || c == '%' || c == '&' || (c >= '(' && c <= '.') || (c >= ':' && c <= '>') || c == '[' || c == ']' || (c >= '{' && c <= '}')) {
			this.readSymbol(site, c);
		} else if (!(c == ' ' || c == '\n' || c == '\t' || c == '\r')) {
			site.syntaxError(`invalid source character '${c}' (utf-8 not yet supported outside string literals)`);
		}
	}

	/**
	 * Tokenize the complete source.
	 * Nests groups before returning a list of tokens
	 * @returns {Token[] | null}
	 */
	tokenize() {
		// reset #ts
		this.#ts = [];

		let site = this.currentSite;
		let c = this.readChar();

		while (c != '\0') {
			this.readToken(site, c);

			site = this.currentSite;
			c = this.readChar();
		}

		return this.nestGroups(this.#ts);
	}

	/** 
	 * Returns a generator
	 * Use gen.next().value to access to the next Token
	 * Doesn't perform any grouping
	 * Used for quickly parsing the ScriptPurpose header of a script
	 * @returns {Generator<Token>}
	 */
	*streamTokens() {
		this.#ts = [];

		let site = this.currentSite;
		let c = this.readChar();

		while (c != '\0') {
			this.readToken(site, c);

			let t = this.#ts.shift();
			while (t != undefined) {
				yield t;
				t = this.#ts.shift();
			}

			site = this.currentSite;
			c = this.readChar();
		}

		assert(this.#ts.length == 0);
	}

	/**
	 * Reads one word token.
	 * Immediately turns "true" or "false" into a BoolLiteral instead of keeping it as Word
	 * @param {Site} site
	 * @param {string} c0 - first character 
	 */
	readWord(site, c0) {
		let chars = [];

		let c = c0;
		while (c != '\0') {
			if (c == '_' || (c >= '0' && c <= '9') || (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || (this.#irMode && (c == '@' || c == '[' || c == ']'))) {
				chars.push(c);
				c = this.readChar();
			} else {
				this.unreadChar();
				break;
			}
		}

		let value = chars.join('');

		if (value == "true" || value == "false") {
			this.pushToken(
				new BoolLiteral(
					new Site(site.src, site.startPos, this.currentSite.startPos),
					value == "true"
				)
			);
		} else {
			this.pushToken(
				new Word(
					new Site(site.src, site.startPos, this.currentSite.startPos),
					value
				)
			);
		}
	}

	/**
	 * Reads and discards a comment if current '/' char is followed by '/' or '*'.
	 * Otherwise pushes Symbol('/') onto #ts
	 * @param {Site} site 
	 */
	// comments are discarded
	readMaybeComment(site) {
		let c = this.readChar();

		if (c == '\0') {
			this.pushToken(new SymbolToken(site, '/'));
		} else if (c == '/') {
			this.readSingleLineComment();
		} else if (c == '*') {
			this.readMultiLineComment(site);
		} else {
			this.pushToken(new SymbolToken(site, '/'));
			this.unreadChar();
		}
	}

	/**
	 * Reads and discards a single line comment (from '//' to end-of-line)
	 */
	readSingleLineComment() {
		let c = this.readChar();

		while (c != '\n' && c != '\0') {
			c = this.readChar();
		}
	}

	/**
	 * Reads and discards a multi-line comment (from '/' '*' to '*' '/')
	 * @param {Site} site 
	 */
	readMultiLineComment(site) {
		let prev = '';
		let c = this.readChar();

		while (true) {
			prev = c;
			c = this.readChar();

			if (c == '/' && prev == '*') {
				break;
			} else if (c == '\0') {
				const errorSite = new Site(site.src, site.startPos, this.currentSite.startPos);
				errorSite.syntaxError("unterminated multiline comment");
				return;
			}
		}
	}

	/**
	 * REads a literal integer
	 * @param {Site} site 
	 */
	readSpecialInteger(site) {
		let c = this.readChar();

		if (c == '\0') {
			this.pushToken(new IntLiteral(site, 0n));
		} else if (c == 'b') {
			this.readBinaryInteger(site);
		} else if (c == 'o') {
			this.readOctalInteger(site);
		} else if (c == 'x') {
			this.readHexInteger(site);
		} else if ((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z')) {
			site.syntaxError(`bad literal integer type 0${c}`);
		} else if (c >= '0' && c <= '9') {
			site.syntaxError("unexpected leading 0");
		} else if (c == '.') {
			this.readFixedPoint(site, ['0']);
		} else {
			this.pushToken(new IntLiteral(site, 0n));
			this.unreadChar();
		}
	}

	/**
	 * @param {Site} site 
	 */
	readBinaryInteger(site) {
		this.readRadixInteger(site, "0b", c => (c == '0' || c == '1'));
	}

	/**
	 * @param {Site} site 
	 */
	readOctalInteger(site) {
		this.readRadixInteger(site, "0o", c => (c >= '0' && c <= '7'));
	}

	/**
	 * @param {Site} site 
	 */
	readHexInteger(site) {
		this.readRadixInteger(site, "0x",
			c => ((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f')));
	}

	/**
	 * @param {Site} site 
	 * @param {string[]} chars 
	 * @param {boolean} reverse
	 * @returns {string[]}
	 */
	static assertCorrectDecimalUnderscores(site, chars, reverse = false) {
		if (chars.some(c => c == '_')) {
			for (let i = 0; i < chars.length; i++) {
				const c = reverse ? chars[chars.length - 1 - i] : chars[i];

				if (i == chars.length - 1) {
					if (c == '_') {
						site.syntaxError("redundant decimal underscore");
					}
				}

				if ((i+1)%4 == 0) {
					if (c != '_') {
						site.syntaxError("bad decimal underscore");
					}
				} else {
					if (c == '_') {
						site.syntaxError("bad decimal underscore");
					}
				}
			}

			return chars.filter(c => c != '_');
		} else {
			return chars;
		}
	}

	/**
	 * @param {Site} site 
	 * @param {string} c0 - first character
	 */
	readDecimal(site, c0) {
		/**
		 * @type {string[]}
		 */
		let chars = [];

		let c = c0;
		while (c != '\0') {
			if ((c >= '0' && c <= '9') || c == '_') {
				chars.push(c);
			} else {
				if ((c >= '0' && c <= '9') || (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z')) {
					const errorSite = new Site(site.src, site.startPos, this.currentSite.startPos);

					errorSite.syntaxError("invalid syntax for decimal integer literal");
				} else if (c == '.') {
					const cf = this.peekChar();

					if (cf >= '0' && cf <= '9') {
						this.readFixedPoint(site, chars);

						return;
					}
				}

				this.unreadChar();
				break;
			}

			c = this.readChar();
		}

		const intSite = new Site(site.src, site.startPos, this.currentSite.startPos);

		chars = Tokenizer.assertCorrectDecimalUnderscores(intSite, chars, true);

		this.pushToken(
			new IntLiteral(
				intSite,
				BigInt(chars.filter(c => c != '_').join(''))
			)
		);
	}

	/**
	 * @param {Site} site 
	 * @param {string} prefix 
	 * @param {(c: string) => boolean} valid - checks if character is valid as part of the radix
	 */
	readRadixInteger(site, prefix, valid) {
		let c = this.readChar();

		let chars = [];

		if (!(valid(c))) {
			const errorSite = new Site(site.src, site.startPos, this.currentSite.startPos);

			errorSite.syntaxError(`expected at least one char for ${prefix} integer literal`);

			this.unreadChar();
			return;
		}

		while (c != '\0') {
			if (valid(c)) {
				chars.push(c);
			} else {
				if ((c >= '0' && c <= '9') || (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z')) {
					const errorSite = new Site(site.src, site.startPos, this.currentSite.startPos);

					errorSite.syntaxError(`invalid syntax for ${prefix} integer literal`);
				}

				this.unreadChar();
				break;
			}

			c = this.readChar();
		}

		this.pushToken(
			new IntLiteral(
				new Site(site.src, site.startPos, this.currentSite.startPos),
				BigInt(prefix + chars.join(''))
			)
		);
	}

	/**
	 * @param {Site} site 
	 * @param {string[]} leading 
	 */
	readFixedPoint(site, leading) {
		/**
		 * @type {string[]}
		 */
		let trailing = [];

		let c = this.readChar();

		while (c != '\0') {
			if ((c >= '0' && c <= '9') || c == '_') {
				trailing.push(c);

			} else {
				this.unreadChar();
				break;
			}

			c = this.readChar();
		}

		const tokenSite = new Site(site.src, site.startPos, this.currentSite.startPos);

		leading = Tokenizer.assertCorrectDecimalUnderscores(tokenSite, leading, true);

		trailing = Tokenizer.assertCorrectDecimalUnderscores(tokenSite, trailing, false);

		if (trailing.length > REAL_PRECISION) {
			tokenSite.syntaxError(`literal real decimal places overflow (max ${REAL_PRECISION} supported, but ${trailing.length} specified)`);

			trailing.splice(REAL_PRECISION);
		} 
		
		while (trailing.length < REAL_PRECISION) {
			trailing.push('0');
		}

		this.pushToken(
			new RealLiteral(
				tokenSite,
				BigInt(leading.concat(trailing).join(''))
			)
		);
	}

	/**
	 * Reads literal hexadecimal representation of ByteArray
	 * @param {Site} site 
	 */
	readByteArray(site) {
		let c = this.readChar();

		let chars = [];

		// case doesn't matter
		while ((c >= 'a' && c <= 'f') || (c >= '0' && c <= '9')) {
			chars.push(c);
			c = this.readChar();
		}

		// empty byteArray is allowed (eg. for Ada mintingPolicyHash)

		// last char is the one that made the while loop break, so should be unread
		this.unreadChar();

		let bytes = hexToBytes(chars.join(''));

		this.pushToken(
			new ByteArrayLiteral(
				new Site(site.src, site.startPos, this.currentSite.startPos),
				bytes
			)
		);
	}

	/**
	 * Reads literal Utf8 string and immediately encodes it as a ByteArray
	 * @param {Site} site 
	 */
	readMaybeUtf8ByteArray(site) {
		let c = this.readChar();

		if (c == '"') {
			const s = this.readStringInternal(site)
		
			this.pushToken(
				new ByteArrayLiteral(
					new Site(site.src, site.startPos, this.currentSite.startPos),
					textToBytes(s)
				)
			);
		} else {
			this.unreadChar();

			this.readWord(site, 'b');
		}
	}

	/**
	 * Doesn't push a token, instead returning the string itself
	 * @internal
	 * @param {Site} site 
	 * @returns {string}
	 */
	readStringInternal(site) {
		let c = this.readChar();

		let chars = [];

		let escaping = false;
		/** @type {?Site} */
		let escapeSite = null; // for escape syntax errors

		while (!(!escaping && c == '"')) {
			if (c == '\0') {
				site.syntaxError("unmatched '\"'");
				break;
			}

			if (escaping) {
				if (c == 'n') {
					chars.push('\n');
				} else if (c == 't') {
					chars.push('\t');
				} else if (c == '\\') {
					chars.push('\\');
				} else if (c == '"') {
					chars.push(c);
				} else if (escapeSite !== null) {
					const errorSite = new Site(escapeSite.src, escapeSite.startPos, this.currentSite.startPos);

					errorSite.syntaxError(`invalid escape sequence ${c}`);
				} else {
					throw new Error("escape site should be non-null");
				}

				escaping = false;
				escapeSite = null;
			} else {
				if (c == '\\') {
					escapeSite = this.currentSite;
					escaping = true;
				} else {
					chars.push(c);
				}
			}

			c = this.readChar();
		}

		return chars.join('');
	}

	/**
	 * Reads literal string delimited by double quotes.
	 * Allows for three escape character: '\\', '\n' and '\t'
	 * @param {Site} site 
	 */
	readString(site) {
		const s = this.readStringInternal(site)
		
		this.pushToken(
			new StringLiteral(
				new Site(site.src, site.startPos, this.currentSite.startPos),
				s
			)
		);
	}

	/**
	 * Reads single or double character symbols
	 * @param {Site} site 
	 * @param {string} c0 - first character
	 */
	readSymbol(site, c0) {
		let chars = [c0];

		/** @type {(second: string) => boolean} */
		let parseSecondChar = (second) => {
			let d = this.readChar();

			if (d == second) {
				chars.push(d);
				return true;
			} else {
				this.unreadChar();
				return false;
			}
		}

		if (c0 == '|') {
			parseSecondChar('|');
		} else if (c0 == '&') {
			parseSecondChar('&');
		} else if (c0 == '=') {
			parseSecondChar('=') || parseSecondChar('>');
		} else if (c0 == '!' || c0 == '<' || c0 == '>') { // could be !=, ==, <= or >=
			parseSecondChar('=');
		} else if (c0 == ':') {
			parseSecondChar(':');
		} else if (c0 == '-') {
			parseSecondChar('>');
		}

		this.pushToken(
			new SymbolToken(
				new Site(site.src, site.startPos, site.endPos),
				chars.join('')
			)
		);
	}

	/**
	 * Separates tokens in fields (separted by commas)
	 * @param {Token[]} ts 
	 * @returns {Group | null}
	 */
	static buildGroup(ts) {
		const open = assertDefined(ts.shift()).assertSymbol();

		if (!open) {
			return null;
		}

		const stack = [open]; // stack of symbols
		let curField = [];
		let fields = [];

		/** @type {null | SymbolToken} */
		let firstComma = null;

		/** @type {null | SymbolToken} */
		let lastComma = null;

		/** @type {null | Site} */
		let endSite = null;

		while (stack.length > 0 && ts.length > 0) {
			const t = assertToken(ts.shift(), open.site);

			if (!t) {
				return null;
			}

			const prev = stack.pop();

			endSite = t.site;

			if (t != undefined && prev != undefined) {
				if (!t.isSymbol(Group.matchSymbol(prev))) {
					stack.push(prev);

					if (Group.isCloseSymbol(t)) {
						t.site.syntaxError(`unmatched '${assertDefined(t.assertSymbol()).value}'`);
						return null;
					} else if (Group.isOpenSymbol(t)) {
						stack.push(assertDefined(t.assertSymbol()));
						curField.push(t);
					} else if (t.isSymbol(",") && stack.length == 1) {
						if (firstComma === null) {
							firstComma = t.assertSymbol();
						}

						lastComma = t.assertSymbol();
						if (curField.length == 0) {
							t.site.syntaxError("empty field");
							return null;
						} else {
							fields.push(curField);
							curField = [];
						}
					} else {
						curField.push(t);
					}
				} else if (stack.length > 0) {
					curField.push(t);
				}
			} else {
				throw new Error("unexpected");
			}
		}

		let last = stack.pop();
		if (last != undefined) {
			last.syntaxError(`EOF while matching '${last.value}'`);
			return null;
		}

		if (curField.length > 0) {
			// add removing field
			fields.push(curField);
		} else if (lastComma !== null) {
			lastComma.syntaxError(`trailing comma`);
			return null;
		}

		let site = open.site;

		if (endSite) {
			site = site.merge(endSite);
		}

		return new Group(site, open.value, fields, firstComma);
	}

	/**
	 * Match group open with group close symbols in order to form groups.
	 * This is recursively applied to nested groups.
	 * @param {Token[]} ts 
	 * @returns {Token[] | null}
	 */
	nestGroups(ts) {
		/**
		 * @type {Token[][]}
		 */
		const stack = [];

		/**
		 * @type {Token[]}
		 */
		let current = [];

		for (let t of ts) {
			if (Group.isOpenSymbol(t)) {
				stack.push(current);

				current = [t];
			} else if (Group.isCloseSymbol(t)) {
				const prev = current[0]?.assertSymbol();

				if (!prev) {
					return null;
				}

				if (!t.isSymbol(Group.matchSymbol(prev))) {
					prev.syntaxError(`unmatched '${prev.value}'`);
					t.syntaxError(`unmatched '${assertDefined(t.assertSymbol()).value}'`);
					return null;
				}

				current.push(t);

				const group = Tokenizer.buildGroup(current);
				if (!group) {
					return null;
				}

				current = assertDefined(stack.pop());

				current.push(group);
			} else {
				current.push(t);
			}
		}

		if (stack.length > 0) {
			const t = stack[stack.length - 1][0];

			if (!t.isSymbol()) {
				if (current.length > 0) {
					const open = current[0];
					
					if (open && open.isSymbol()) {
						open.syntaxError(`unmatched '${open.assertSymbol()?.value}`);
					} else {
						console.log(current)
						throw new Error("unhandled")
					}
				}
			} else {
				t.syntaxError(`unmatched '${t.assertSymbol()?.value}'`);
			}
		}
		
		return current;
	}
}

/**
 * Tokenizes a string (wrapped in Source)
 * Also used by VSCode plugin
 * @internal
 * @param {Source} src 
 * @returns {Token[] | null}
 */
export function tokenize(src) {
	let tokenizer = new Tokenizer(src);

	return tokenizer.tokenize();
}

/**
 * Tokenizes an IR string with a codemap to the original source
 * @internal
 * @param {string} rawSrc 
 * @param {CodeMap} codeMap 
 * @returns {Token[]}
 */
export function tokenizeIR(rawSrc, codeMap = []) {
	let src = new Source(rawSrc, "<ir>");

	// the Tokenizer for Helios can simply be reused for the IR
	let tokenizer = new Tokenizer(src, codeMap, true);

	const ts = tokenizer.tokenize();

	if (src.errors.length > 0) {
		throw src.errors[0];
	} else if (ts === null) {
		throw new Error("should've been thrown above");
	}

	return ts;
}
