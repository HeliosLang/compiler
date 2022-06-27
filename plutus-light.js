////////////////////////////////////////////////
//////////////    Plutus Light   ///////////////
////////////////////////////////////////////////
// Synopsis: Plutus-Light is a smart contract DSL for Cardano. 
//     This javascript library contains functions to compile Plutus-Light sources into Plutus-Core.
//     The results can be used by cardano-cli to generate and submit blockchain transactions. 
//
// Author:  Christian Schmitz
// Email:   cschmitz398@gmail.com
// Website: github.com/openengineer/plutus-light
//
// Usage:
//   * Import this library:
//       import * as PL from "plutus-light.js"
// 
//   * Dump Plutus-Core AST:
//       PL.deserializePlutusCoreCborHexString(hex: string) -> string
//
//   * Compile Plutus-Light program:
//       PL.compilePlutusLightProgram(programSrc: string) -> string
//
//   * Compile Plutus-Light data:
//       PL.compilePlutusLightData(programSrc: string, dataExpressionSrc: string) -> string
//
// Disclaimer: I made this available as OpenSource so that the Cardano community can test Plutus-Light extensively.
//    Please don't use this in production yet, it could be riddled with critical bugs.
//    There are also no backward compatibility guarantees.

const DEFAULT_VERSION = [1n, 0n, 0n];

const VERSIONS = {
	"11.22.33": { // dummy version from example in may2022 plutus-core-spec document
		widths: {
			term:      4,
			type:      3,
			constType: 4,
			builtin:   5, // later becomes 7
			constant:  4,
			kind:      1,
		},
		builtins: [
			"addInteger",
			"subtractInteger",
			"multiplyInteger",
			"divideInteger",
			"remainderInteger",
			"lessThanInteger",
			"lessThanEqInteger",
			"greaterThanInteger",
			"greaterThanEqInteger",
			"eqInteger",
			"concatenate",
			"takeByteString",
			"dropByteString",
			"sha2_256",
			"sha3_256",
			"verifySignature",
			"eqByteString",
			"quotientInteger",
			"modInteger",
			"ltByteString",
			"gtByteString",
			"ifThenElse",
			"charToString",
			"append",
			"trace",
		],
	},
	"1.0.0": { // current real-world version of plutus-core
		widths: {
			term:      4,
			type:      3,
			constType: 4, 
			builtin:   7,
			constant:  4,
			kind:      1,
		},
		builtins: [
			"addInteger", // 0
			"subtractInteger",
			"multiplyInteger",
			"divideInteger",
			"quotientInteger",
			"remainderInteger",
			"modInteger",
			"equalsInteger",
			"lessThanInteger",
			"lessThanEqualsInteger",
			"appendByteString", // 10
			"consByteString",
			"sliceByteString",
			"lengthOfByteString",
			"indexByteString",
			"equalsByteString",
			"lessThanByteString",
			"lessThanEqualsByteString",
			"sha2_256",
			"sha3_256",
			"blake2b_256", // 20
			"verifySignature",
			"appendString",
			"equalsString",
			"encodeUtf8",
			"decodeUtf8",
			"ifThenElse",
			"chooseUnit",
			"trace",
			"fstPair",
			"sndPair", // 30
			"chooseList",
			"mkCons",
			"headList",
			"tailList",
			"nullList",
			"chooseData",
			"constrData",
			"mapData",
			"listData",
			"iData", // 40
			"bData",
			"unConstrData",
			"unMapData",
			"unListData",
			"unIData",
			"unBData",
			"equalsData",
			"mkPairData",
			"mkNilData",
			"mkNilPairData", // 50
			"serialiseData",
			"verifyEcdsaSecp256k1Signature",
			"verifySchnorrSecp256k1Signature",
		],
	},
}


////////////////////
// utility functions
////////////////////

// integer division
// assumes a and b are whole numbers
function idiv(a, b) {
	return Math.floor(a/b);
	// alternatively: (a - a%b)/b
}

// 2^p for bigints
function pow2(p) {
	return (p <= 0n) ? 1n : 2n<<(p-1n);
}

const MASKS = [
	0b11111111,
	0b01111111,
	0b00111111,
	0b00011111,
	0b00001111,
	0b00000111,
	0b00000011,
	0b00000001,
]

function padZeroes(bits, n) {
	// padded to multiple of n
	if (bits.length%n != 0) {
		let nPad = n - bits.length%n;
		bits = (new Array(nPad)).fill('0').join('') + bits;
	}

	return bits;
}

function byteToBitString(b, n = 8) {
	let s = padZeroes(b.toString(2), n);

	return "0b" + s;
}

function imask(b, i0, i1) {
	assert(i0 < i1);

	// mask with 0 from 

	return (b & MASKS[i0]) >> (8 - i1);
}

// hex: string
// return value: list of integers
function assert(cond, msg = "unexpected") {
	if (!cond) {
		throw new Error(msg);
	}
}

function assertDefined(val, msg = "unexpected undefined value") {
	if (val == undefined) {
		throw new Error(msg);
	}

	return val;
}

function hexToBytes(hex) {
	let bytes = [];

	for (let i = 0; i < hex.length; i += 2) {
		bytes.push(parseInt(hex.substr(i, 2), 16));
	}

	return bytes;
}

function bytesToHex(bytes) {
	let parts = [];
	for (let b of bytes) {
		parts.push(padZeroes(b.toString(16), 2));
	}
	
	return parts.join('');
}

function isString(obj) {
	return (typeof obj == "string") || (obj instanceof String);
}

// Very rudimentary cbor parser which unwraps the cbor text envelopes of the example scripts 
// in github.com/chris-moreton/plutus-scripts and github.com/input-output-hk/plutus-apps
// This function unwraps one level, so must be called twice 
//  (for some reason the text envelopes is cbor wrapped in cbor)
function unwrapPlutusCoreCbor(bytes) { 
	if (bytes == null || bytes == undefined || bytes.length == 0) {
		throw new Error("expected at least one cbor byte");
	}

	let tag = assertDefined(bytes.shift());

	switch(tag) {
		case 0x4d:
		case 0x4e:
			return bytes;
		case 0x58: {
			// byte array
			let n = assertDefined(bytes.shift());

			assert(n == bytes.length, "bad or unhandled cbor encoding");

			return bytes;
		}
		case 0x59: {
			let n = assertDefined(bytes.shift())*256 + assertDefined(bytes.shift());

			assert(n == bytes.length, "bad or unhandled cbor encoding");

			return bytes;
		}
		default:
			throw new Error("unhandled cbor tag 0x" + tag.toString(16));
	}
}

function wrapPlutusCoreCbor(bytes) {
	let n = bytes.length;

	if (n < 256) {
		bytes.unshift(n);
		bytes.unshift(0x58);
	} else {
		let nSmall = n%256;
		let nLarge = Math.floor(n/256);

		assert(nLarge < 256);

		bytes.unshift(nSmall);
		bytes.unshift(nLarge);

		bytes.unshift(0x59);
	}

	return bytes;
}


////////////////////////
// Primitive value types
////////////////////////

class BitWriter {
	constructor() {
		this.parts_ = [];
		this.n_ = 0;
	}

	write(bitChars) {
		for (let c of bitChars) {
			if (c != '0' && c != '1') {
				throw new Error("bad bitchar");
			}
		}

		this.parts_.push(bitChars); 
		this.n_ += bitChars.length;
	}

	padToByteBoundary(force = false) {
		let nPad = 0;
		if (this.n_%8 != 0) {
			nPad = 8 - this.n_%8;
		} else if (force) {
			nPad = 8;
		}

		if (nPad != 0) {
			let padding = (new Array(nPad)).fill('0');
			padding[nPad-1] = '1';

			this.parts_.push(padding.join(''));

			this.n_ += nPad;
		}
	}

	// returns bytes
	finalize() {
		this.padToByteBoundary(true);

		let chars = this.parts_.join('');

		let bytes = [];

		for (let i = 0; i < chars.length; i+= 8) {
			let byteChars = chars.slice(i, i+8);
			let byte = parseInt(byteChars, 2);

			bytes.push(byte);
		}

		return bytes;
	}
}

class PlutusCoreInteger {
	// value is BigInt, which is supposed to be arbitrary precision
	constructor(value, signed = false) {
		assert(typeof value == 'bigint');
		this.value_  = value;
		this.signed_ = signed;
	}

	static parseRawByte(b) {
		return b & 0b01111111;
	}

	static rawByteIsLast(b) {
		return (b & 0b10000000) == 0;
	}

	static bytesToBigInt(bytes) {
		let value = BigInt(0);

		let n = bytes.length;

		for (let i = 0; i < n; i++) {
			let b = bytes[i];

			// 7 (not 8), because leading bit isn't used here
			value = value + BigInt(b)*pow2(BigInt(i)*7n);
		}

		return value;
	}

	// apply zigzag encoding
	toUnsigned() {
		if (this.signed_) {
			if (this.value_ < 0n) {
				return new PlutusCoreInteger(1n - this.value_*2n, false);
			} else {
				return new PlutusCoreInteger(this.value_*2n, false);
			}
		} else {
			return this;
		}
	}

	// unapply zigZag encoding
	toSigned() {
		if (this.signed_) {
			return this;
		} else {
			if (this.value_%2n == 0n) {
				return new PlutusCoreInteger(this.value_/2n, true);
			} else {
				return new PlutusCoreInteger(-(this.value_+1n)/2n, true);
			}
		}
	}

	toString() {
		return this.value_.toString();
	}

	toFlat(bitWriter) {
		if (this.signed_) {
			bitWriter.write('0100');
			bitWriter.write('100000'); // PlutusCore list with a single entry '0000'
		}

		let zigzag = this.toUnsigned();
		let bitString = padZeroes(zigzag.value_.toString(2), 7);

		// split every 7th
		let parts = [];
		for (let i = 0; i < bitString.length; i += 7) {
			parts.push(bitString.slice(i, i+7));
		}

		// reverse the parts
		parts.reverse();

		for (let i = 0; i < parts.length; i++) {
			if (i == parts.length-1) {
				// last
				bitWriter.write('0' + parts[i]);
			} else {
				bitWriter.write('1' + parts[i]);
			}
		}
	}
}

class PlutusCoreByteArray {
	constructor(bytes) {
		assert(bytes != undefined);
		this.bytes_ = bytes;
	}

	toString() {
		// to hex encoding
		return '#' + bytesToHex(this.bytes_);
	}

	toFlat(bitWriter) {
		bitWriter.write('0100');
		bitWriter.write('100010'); // PlutusCore list that contains single '0001' entry

		PlutusCoreByteArray.writeBytes(bitWriter, this.bytes_);
	}

	static writeBytes(bitWriter, bytes) {
		bitWriter.padToByteBoundary(true);

		let n = bytes.length;
		let pos = 0;

		// write chunks of 255
		while (pos < n) {
			let nChunk = Math.min(n - pos, 255);

			bitWriter.write(padZeroes(nChunk.toString(2), 8));

			for (let i = pos; i < pos + nChunk; i++) {
				let b = bytes[i];

				bitWriter.write(padZeroes(b.toString(2), 8));
			}

			pos += nChunk;
		}

		bitWriter.write('00000000');
	}
}

// TODO: make a distinction between ByteString (in reality ByteArray) and String
class PlutusCoreString {
	constructor(value) {
		this.value_ = value;
	}

	toString() {
		return "\"" + this.value_ + "\"";
	}

	toFlat(bitWriter) {
		bitWriter.write('0100');
		bitWriter.write('100100'); // PlutusCore list that contains single '0010' entry

		let bytes = (new TextEncoder()).encode(this.value_);

		PlutusCoreByteArray.writeBytes(bitWriter, bytes);
	}
}

class PlutusCoreUnit {
	constructor() {
	}

	toString() {
		return "()";
	}

	toFlat(bitWriter) {
		bitWriter.write('0100');
		bitWriter.write('100110'); // PlutusCore list that contains single '0011' entry
	}
}

class PlutusCoreBool {
	constructor(value) {
		this.value_ = value;
	}

	toString() {
		return this.value_ ? "true" : "false";
	}

	toFlat(bitWriter) {
		bitWriter.write('0100');
		bitWriter.write('101000'); // PlutusCore list that contains single '0100' entry
		if (this.value_) {
			bitWriter.write('1');
		} else {
			bitWriter.write('0');
		}
	}
}


////////////////////
// Plutus Core terms
////////////////////

class PlutusCoreTerm {
	constructor(type) {
		this.type_ = type;
	}

	toString() {
		return "(Term " + this.type_.toString() + ")";
	}
}

class PlutusCoreVariable extends PlutusCoreTerm {
	// TODO: generate globally unique names from the DeBruijn indices
	constructor(index) {
		super(0);
		this.index_ = index;
	}

	toString() {
		return "x" + this.index_.toString();
	}

	toFlat(bitWriter) {
		bitWriter.write('0000');
		this.index_.toFlat(bitWriter);
	}
}

class PlutusCoreDelay extends PlutusCoreTerm {
	constructor(expr) {
		super(1);
		this.expr_ = expr;
	}

	toString() {
		return "(delay " + this.expr_.toString() + ")";
	}

	toFlat(bitWriter) {
		bitWriter.write('0001');
		this.expr_.toFlat(bitWriter);
	}
}

class PlutusCoreLambda extends PlutusCoreTerm {
	constructor(rhs) {
		super(2);
		this.rhs_  = rhs;
	}

	toString() {
		return "(\u039b " + this.rhs_.toString() + ")";
	}

	toFlat(bitWriter) {
		bitWriter.write('0010');
		this.rhs_.toFlat(bitWriter);
	}
}

class PlutusCoreApplication extends PlutusCoreTerm {
	constructor(a, b) {
		super(3);
		this.a_ = a;
		this.b_ = b;
	}

	toString() {
		return "[" + this.a_.toString() + " " + this.b_.toString() + "]";
	}

	toFlat(bitWriter) {
		bitWriter.write('0011');
		this.a_.toFlat(bitWriter);
		this.b_.toFlat(bitWriter);
	}
}

class PlutusCoreForce extends PlutusCoreTerm {
	constructor(expr) {
		super(5);
		this.expr_ = expr;
	}

	toString() {
		return "(force " + this.expr_.toString() + ")";
	}

	toFlat(bitWriter) {
		bitWriter.write('0101');
		this.expr_.toFlat(bitWriter);
	}
}

// Error is already used by builtin javascript class
class PlutusCoreError extends PlutusCoreTerm {
	constructor() {
		super(6);
	}

	toString() {
		return "(error)";
	}

	toFlat(bitWriter) {
		bitWriter.write('0110');
	}
}

class PlutusCoreBuiltin extends PlutusCoreTerm {
	constructor(name) {
		super(7);
		this.name_ = name;
	}

	toString() {
		return "(builtin " + this.name_ + ")";
	}

	toFlat(bitWriter) {
		bitWriter.write('0111');

		let i = VERSIONS["1.0.0"].builtins.findIndex(n => n == this.name_);

		let bitString = padZeroes(i.toString(2), 7);
		
		bitWriter.write(bitString);
	}
}

class PlutusCoreProgram {
	constructor(version, expr) {
		this.version_ = version;
		this.expr_    = expr;
	}

	toString(pretty = true) {
		return "(program " + 
			this.version_.map(v => v.toString()).join(".") + " " + 
			this.expr_.toString() + ")";
	}

	toFlat(bitWriter) {
		for (let v of this.version_) {
			v.toFlat(bitWriter);
		}

		this.expr_.toFlat(bitWriter);

		// final padding is handled by bitWriter upon finalization
	}
}



//////////////////////////
// Plutus-light DSL parser
//////////////////////////

class Location {
	constructor() {
		this.pos_  = 0;
		this.line_ = 0;
	}

	get pos() {
		return this.pos_;
	}

	incrPos() {
		this.pos_ += 1;
	}

	incrLine() {
		this.line_ += 1;
	}

	decrPos() {
		this.pos_ -= 1;
	}

	decrLine() {
		this.line_ -= 1;
	}

	copy() {
		let cpy = new Location();

		cpy.pos_  = this.pos_;
		cpy.line_ = this.line_;

		return cpy;
	}

	toString() {
		return this.line_.toString();
	}

	syntaxError(msg) {
		throw new PlutusLightError(this, "SyntaxError", msg);
	}

	typeError(msg) {
		throw new PlutusLightError(this, "TypeError", msg);
	}

	referenceError(msg) {
		throw new PlutusLightError(this, "ReferenceError", msg);
	}

	static dummy() {
		return new Location(0, 0);
	}
}

class PlutusLightError extends Error {
	constructor(loc, type, msg) {
		super(type + " on line " + (loc.line_+1) + ": " + msg);
	}
}

class Token {
	constructor(loc) {
		this.loc_ = loc; // position of start of token
	}

	get loc() {
		return this.loc_.copy();
	}

	assertWord() {
		throw new Error("expected word, got " + this.toString());
	}

	assertSymbol(symbol) {
		if (symbol == undefined) {
			this.syntaxError("expected symbol, got " + this.toString());
		} else {
			this.syntaxError("expected \'" + symbol + "\', got " + this.toString());
		}
	}

	assertGroup() {
		throw new Error("expected group");
	}

	isLiteral() {
		return false;
	}

	isWord() {
		return false;
	}

	isSymbol() {
		return false;
	}

	isGroup() {
		return false;
	}

	isBuiltin() {
		return false;
	}

	link(scope) {
		throw new Error("not implemented");
	}

	eval() {
		throw new Error("not implemented");
	}

	evalData() {
		this.typeError("can't be used in data eval");
	}

	syntaxError(msg) {
		this.loc_.syntaxError(msg);
	}

	typeError(msg) {
		this.loc_.typeError(msg);
	}

	referenceError(msg) {
		this.loc_.referenceError(msg);
	}
}

class Word extends Token {
	constructor(loc, value) {
		super(loc);
		this.value_ = value;
	}

	assertWord(v) {
		if (v != undefined) {
			if (v != this.value_) {
				throw new Error("expected word " + v);
			}

			return this;
		} else {
			return this;
		}
	}

	isWord(v) {
		if (v != undefined) {
			return v == this.value_;
		} else {
			return true;
		}
	}

	toString() {
		return this.value_;
	}
}

class Symbol extends Token {
	constructor(loc, value) {
		super(loc);
		this.value_ = value;
	}

	get value() {
		return this.value_;
	}

	assertSymbol(symbol) {
		if (!this.isSymbol(symbol)) {
			this.syntaxError("expected \'" + symbol + "\', got \'" + this.value_ + "\'");
		}

		return this;
	}

	isSymbol(v) {
		if (v != undefined) {
			if (v instanceof Array) {
				return v.lastIndexOf(this.value_) != -1;
			} else {
				return v == this.value_;
			}	
		} else {
			return true;
		}
	}

	toString() {
		return this.value_;
	}

	static find(lst, value) {
		return lst.findIndex(item => item.isSymbol(value));
	}

	static findLast(lst, value) {
		for (let i = lst.length - 1; i >= 0; i--) {
			if (lst[i].isSymbol(value)) {
				return i;
			}
		}

		return -1;
	}
}

class Literal extends Token {
	constructor(loc) {
		super(loc);
	}

	isLiteral() {
		return true;
	}

	link(scope) {
	}

	registerGlobals(registry) {
	}

	pretty(firstIndent, indent) {
		return this.toString();
	}
}

// always signed
class IntegerLiteral extends Literal {
	// value has type BigInt
	constructor(loc, value) {
		super(loc);
		assert(typeof value == 'bigint');
		this.value_ = value;
	}

	toString() {
		return this.value_.toString();
	}

	eval() {
		return new IntegerType(this.loc);
	}

	evalData() {
		return new IntegerData(this.value_);
	}

	toUntyped() {
		return this.toString();
	}

	toPlutusCore() {
		return new PlutusCoreInteger(this.value_, true);
	}
}

class UnitLiteral extends Literal {
	constructor() {
		super(Location.dummy());
	}

	toString() {
		return "()";
	}

	toPlutusCore() {
		return new PlutusCoreUnit();
	}
}

class BoolLiteral extends Literal {
	constructor(loc, value) {
		super(loc);
		this.value_ = value;
	}

	toString() {
		return this.value_ ? "true" : "false";
	}

	eval() {
		return new BoolType(this.loc);
	}

	evalData() {
		return new IntegerData(this.value_ ? 1n : 0n);
	}

	toUntyped() {
		return this.toString();
	}

	toPlutusCore() {
		return new PlutusCoreBool(this.value_);
	}
}

class ByteArrayLiteral extends Literal {
	constructor(loc, bytes) {
		super(loc);
		this.bytes_ = bytes;
	}

	toString() {
		return '#' + bytesToHex(this.bytes_);
	}

	eval() {
		return new ByteArrayType(this.loc);
	}

	evalData() {
		return new ByteArrayData(this.bytes_);
	}

	toUntyped() {
		return this.toString();
	}

	toPlutusCore() {
		return new PlutusCoreByteArray(this.bytes_)
	}
}

// '...' or "..." is a utf8 string literal
class StringLiteral extends Literal {
	constructor(loc, value) {
		super(loc);
		this.value_ = value;
	}

	toString() {
		return "\"" + this.value_.toString() + "\"";
	}

	eval() {
		return new StringType(this.loc);
	}

	evalData() {
		let bytes = (new TextEncoder()).encode(this.value_);

		return new ByteArrayData(bytes);
	}

	toUntyped() {
		return this.toString();
	}

	toPlutusCore() {
		return new PlutusCoreString(this.value_);
	}
}

class Group extends Token {
	// type is "(", "[" or "{"
	constructor(loc, type, fields) {
		super(loc);
		this.type_ = type;
		this.fields_ = fields // list of lists;
	}

	get fields() {
		return this.fields_.slice();
	}

	assertGroup(type) {
		if (type != undefined && this.type_ != type) {
			throw new Error("expected group \"" + type + "\" got \"" + this.type_ + "\"");
		} 

		return this;
	}

	isGroup(type) {
		if (type != undefined) {
			return this.type_ == type;
		} else {
			return true;
		}
	}

	toString() {
		let s = this.type_;

		let sParts = [];
		for (let f of this.fields_) {
			sParts.push(f.map(t => t.toString()).join(" "));
		}

		s += sParts.join(", ") + Group.matchSymbol(this.type_);

		return s;
	}

	static isOpenSymbol(t) {
		return t.isSymbol("{") || t.isSymbol("[") || t.isSymbol("(");
	}

	static isCloseSymbol(t) {
		return t.isSymbol("}") || t.isSymbol("]") || t.isSymbol(")");
	}

    static matchSymbol(t) {
		if (t instanceof Symbol) {
			if (t.isSymbol("{")) {
				return "}";
			} else if (t.isSymbol("[")) {
				return "]";
			} else if (t.isSymbol("(")) {
				return ")";
			} else if (t.isSymbol("}")) {
				return "{";
			} else if (t.isSymbol("]")) {
				return "[";
			} else if (t.isSymbol(")")) {
				return "(";
			} else {
				throw new Error("not a group symbol");
			}
		} else {
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
	}

	static find(lst, value) {
		return lst.findIndex(item => item.isGroup(value));
	}
}


//////////////////////
// Tokenizer singleton
//////////////////////

class Tokenizer {
	constructor(src) {
		this.loc_ = new Location();
		this.src_ = src;
	}

	readChar() {
		let p = this.loc_.pos;

		assert(p >= 0);

		let c;
		if (p < this.src_.length) {
			c = this.src_[p];
		} else {
			c = '\0';
		}

		this.loc_.incrPos();
		if (c == '\n') {
			this.loc_.incrLine();
		}

		return c;
	}

	unreadChar() {
		this.loc_.decrPos();

		let p = this.loc_.pos;

		assert(p >= 0);

		if (p < this.src_.length) {
			if (this.src_[p] == '\n') {
				this.loc_.decrLine();
			}
		}
	}

	tokenize() {
		let ts = [];

		let l = this.loc_.copy();
		let c = this.readChar();

		while (c != '\0') {
			if (c == '_' || (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z')) {
				this.readWord(ts, l, c);
			} else if (c == '/') {
				this.readMaybeComment(ts, l);
			} else if (c == '0') {
				this.readSpecialInteger(ts, l);
			} else if (c >= '1' && c <= '9') {
				this.readDecimalInteger(ts, l, c);
			} else if (c == '#') {
				this.readByteArray(ts, l);
			} else if (c == '"' || c == "'") {
				this.readString(ts, l, c);
			} else if (c ==  '!' || c == '%' || c == '&' || (c >= '(' && c <= '.') || (c >= ':' && c <= '>') || c == '[' || c == ']' || (c >= '{' && c <= '}')) {
				this.readSymbol(ts, l, c);
			} else if (!(c == ' ' || c == '\n' || c == '\t' || c == '\r')) {
				throw new Error("bad source");
			}

			l = this.loc_.copy();
			c = this.readChar();
		}

		return Tokenizer.nestGroups(ts);
	}

	readWord(ts, start, c) {
		let chars = [];

		while (c != '\0') {
			if (c == '_' || (c >= '0' && c <= '9') || (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z')) {
				chars.push(c);
				c = this.readChar();
			} else {
				this.unreadChar();
				break;
			}
		}

		let value = chars.join('');

		if (value == "true" || value == "false") {
			ts.push(new BoolLiteral(start, value == "true"));

		} else {
			ts.push(new Word(start, value));
		}
	}

	readMaybeComment(ts, start) {
		let c = this.readChar();

		if (c == '\0') {
			ts.push(new Symbol(start, '/'));
		} else if (c == '/') {
			this.readSingleLineComment();
		} else if (c == '*') {
			this.readMultiLineComment(start);
		} else {
			ts.push(new Symbol(start, '/'));
			this.unreadChar();
		}
	}

	readSingleLineComment() {
		let c = this.readChar();

		while (c != '\n') {
			c = this.readChar();
		}
	}

	readMultiLineComment(start) {
		let prev = '';
		let c = this.readChar();

		while (true) {
			prev = c;
			c = this.readChar();

			if (c == '/' && prev == '*') {
				break;
			} else if (c == '\0') {
				throw new Error("unterminated multiline comment");
			}
		}
	}

	readSpecialInteger(ts, start) {
		let c = this.readChar();

		if (c == '\0') {
			ts.push(new IntegerLiteral(start, 0));
		} else if (c == 'b') {
			this.readBinaryInteger(ts, start);
		} else if (c == 'o') {
			this.readOctalInteger(ts, start);
		} else if (c == 'x') {
			this.readHexInteger(ts, start);
		} else if ((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z')) {
			throw new Error("bad literal integer type");
		} else if (c >= '0' && c <= '9') {
			this.readDecimalInteger(ts, start, c);
		} else {
			ts.push(new IntegerLiteral(start, 0n));
			this.unreadChar();
		}
	}

	readBinaryInteger(ts, start) {
		this.readRadixInteger(ts, start, "0b", 
			c => (c == '0' || c == '1'));
	}

	readOctalInteger(ts, start) {
		this.readRadixInteger(ts, start, "0o", 
			c => (c >= '0' && c <= '7'));
	}

	readHexInteger(ts, start) {
		this.readRadixInteger(ts, start, "0x", 
			c => ((c >= '0' && c <= '9') || (c >= 'a' || c <= 'f')));
	}

	readDecimalInteger(ts, start, c) {
		let chars = [];

		while (c != '\0') {
			if (c >= '0' && c <= '9') {
				chars.push(c);
			} else if ((c >= '0' && c <= '9') || (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z')) {
				throw new Error("invalid syntax");
			} else {
				this.unreadChar();
				break;
			}

			c = this.readChar();
		}

		ts.push(new IntegerLiteral(start, BigInt(chars.join(''))));
	}

	readRadixInteger(ts, start, prefix, valid) {
		let c = this.readChar();

		let chars = [];

		if (!(valid(c))) {
			throw new Error("expected at least one char for " + prefix + " integer");
		}

		while (c != '\0') {
			if (valid(c)) {
				chars.push(c);
			} else if ((c >= '0' && c <= '9') || (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z')) {
				throw new Error("invalid syntax");
			} else {
				this.unreadChar();
				break;
			}

			c = this.readChar();
		}

		ts.push(new IntegerLiteral(start, BigInt(prefix + chars.join(''))));
	}

	readByteArray(ts, start) {
		let c = this.readChar();

		let chars = [];

		// case doesn't matter
		while ((c >= 'a' && c <= 'f') || (c >= '0' && c <= '9')) {
			chars.push(c);
			c = this.readChar();
		}

		// empty byteArray is allowed (eg. for Ada currencysymbol)

		this.unreadChar(c);

		let bytes = hexToBytes(chars.join(''));

		ts.push(new ByteArrayLiteral(start, bytes));
	}

	readString(ts, start, quote) {
		let c = this.readChar();

		let chars = [];

		let escaping = false;
		let escapeLoc; // for location errors

		while (!(!escaping && c == quote)) {
			if (c == '\0') {
				throw new Error("unmatched " + quote);
			}

			if (escaping) {
				if (c == 'n') {
					chars.push('\n');
				} else if (c == 't') {
					chars.push('\t');
				} else if (c == '\\') {
					chars.push('\\');
				} else if (c == quote) {
					chars.push(quote);
				} else {
					throw new Error("invalid escape sequence " + c);
				}

				escaping = false;
			} else {
				if (c == '\\') {
					escapeLoc = this.loc_.copy();
					escapeLoc.decrPos();
					escaping = true;
				} else {
					chars.push(c);
				}
			}

			c = this.readChar();
		}

		ts.push(new StringLiteral(start, chars.join('')));
	}

	readSymbol(ts, start, c) {
		let chars = [c];

		let parseSecondChar = (second) => {
			let d = this.readChar();

			if (d == second) {
				chars.push(d);
			} else {
				this.unreadChar();
			}
		}

		if (c == '|') {
			parseSecondChar('|');
		} else if (c == '&') {
			parseSecondChar('&');
		} else if (c == '!' || (c >= '<' && c <= '>')) { // could be !=, ==, <= or >=
			parseSecondChar('=');
		}

		ts.push(new Symbol(start, chars.join('')));
	}

	static groupFields(ts) {
		assert(ts.length > 1);

		let open = ts.shift();

		let stack = [open];
		let curField = [];
		let fields = [];

		while (stack.length > 0 && ts.length > 0) {
			let t = ts.shift();
			let prev = stack.pop();

			if (!t.isSymbol(Group.matchSymbol(prev))) {
				stack.push(prev);

				if (Group.isCloseSymbol(t)) {
					throw new Error("unmatched " + t.value + " at pos " + (t.loc_.line_+1).toString() + ", prev: " + (prev.loc_.line_+1).toString());
				} else if (Group.isOpenSymbol(t)) {
					stack.push(t);
					curField.push(t);
				} else if (t.isSymbol(",") && stack.length == 1) {
					if (curField.length == 0) {
						throw new Error("empty field");
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
		}

		if (stack.length > 0) {
			let last = stack.pop();
			last.syntaxError("EOF while matching \'" + last.value + "\'");
		}
		
		if (curField.length > 0) {
			fields.push(curField);
		}		

		return fields;
	}

	static nestGroups(ts) {
		let res = [];

		while (ts.length > 0) {
			let t = ts.shift();

			if (Group.isOpenSymbol(t)) {
				ts.unshift(t);

				let fields = Tokenizer.groupFields(ts).map(f => Tokenizer.nestGroups(f));

				res.push(new Group(t.loc, t.value, fields));
			} else if (Group.isCloseSymbol(t)) {
				t.syntaxError("unmatched \'" + t.value + "\'");
			} else {
				res.push(t);
			}
		}

		return res;
	}
}


////////////////////////////////
// Scopes used during link stage
////////////////////////////////

class GlobalScope {
	constructor() {
		this.types_ = new Map();
		this.values_ = new Map();
	}

	has(name) {
		let key = name.toString();
		
		return this.values_.has(key) || this.types_.has(key) || (key in PLUTUS_LIGHT_BUILTIN_FUNCS);
	}

	setValue(v) {
		let name = v.name;

		let key = name.toString();

		this.values_.set(key, v);
	}

	getValue(name) {
		let key = name.toString();

		if (!this.values_.has(key)) {
			if (key in PLUTUS_LIGHT_BUILTIN_FUNCS) {
				name.referenceError("illegal reference of built-in func \'" + key + "\'");
			} else if (this.types_.has(key)) {
				name.referenceError("\'" + key + "\' is a type, expected a value");
			} else {
				name.referenceError("\'" + key + "\' undefined");
			}
		} else {
			let obj = this.values_.get(key);
			obj.incrUseCount();
			return obj;
		}
	}

	setType(t) {
		let name = t.name;

		let key = name.toString();

		this.types_.set(key, t);
	}

	getType(name) {
		let key = name.toString();

		if (!this.types_.has(key)) {
			if (this.values_.has(key) || key in PLUTUS_LIGHT_BUILTIN_FUNCS) {
				name.referenceError("\'" + key + "\' is a value, expected a type");
			} else {
				name.referenceError("\'" + key + "\' undefined");
			}
		} else {
			let obj = this.types_.get(key);
			obj.incrUseCount();
			return obj;
		}
	}
}

class Scope {
	constructor(parent) {
		assert(parent != null);

		this.parent_ = parent;
		this.types_ = new Map(); // struct types, type aliases
		this.values_ = new Map(); // funcs, consts
	}

	has(name) {
		return this.values_.has(name.toString()) || this.types_.has(name.toString()) || (this.parent_ != null && this.parent_.has(name));
	}

	setValue(v) {
		let name = v.name;

		assert(name != undefined);

		if (this.has(name)) {
			name.syntaxError("\'" + name.toString() + "\' already declared");
		}

		let key = name.toString();

		this.values_.set(key, v);
	}

	getValue(name) {
		let key = name.toString();

		if (!this.values_.has(key)) {
			if (this.types_.has(key)) {
				name.referenceError("\'" + key + "\' is a type, expected a value");
			} else if (this.parent_ == null) {
				name.referenceError("\'" + key + "\' undefined");
			} else {
				return this.parent_.getValue(name);
			}
		} else {
			let obj = this.values_.get(key);
			obj.incrUseCount();
			return obj;
		}
	}

	setType(t) {
		let name = t.name;

		assert(name != undefined);

		if (this.has(name)) {
			name.syntaxError("\'" + name.toString() + "\' already declared");
		}

		let key = name.toString();

		this.types_.set(key, t);
	}

	getType(name) {
		let key = name.toString();

		if (!this.types_.has(key)) {
			if (this.values_.has(key)) {
				name.referenceError("\'" + key + "\' is a value, expected a type");
			} else if (this.parent_ == null) {
				name.referenceError("\'" + key + "\' undefined");
			} else {
				return this.parent_.getType(name);
			}
		} else {
			let obj = this.types_.get(key);
			obj.incrUseCount();
			return obj;
		}
	}

	assertAllUsed() {
		for (let objects of [this.types_, this.values_]) {
			for (let obj of objects) {
				obj = obj[1];

				if (!obj.isBuiltin() && !obj.used) {
					obj.name.referenceError("\'" + obj.name.toString() + "\' unused");
				}
			}
		}
	}

	// inner is wrapped recursively
	usedMoreThanOnceToUntyped(inner) {	
		// first collect, so we can optionally reverse
		let fns = [];
		for (let fn of this.values_) {
			fn = fn[1];
			if  ((fn instanceof FuncDecl) && fn.useCount_ > 1) {
				fns.push(fn);
			}
		}

		let res = inner;
		for (let fn of fns) {
			res = `func(u_${fn.name.toString()}){${inner}}(${fn.toUntyped()})`;
		}

		return res;
	}

	registerGlobals(registry) {
		for (let object of this.values_) {
			let obj = object[1];

			if (!obj.isBuiltin() && obj.used) {
				obj.registerGlobals(registry);
			}
		}
	}
}

class FuncScope extends Scope {
	constructor(parent, fn) {
		super(parent);
		this.fn_ = fn;
	}

	getValue(name) {
		if (this.fn_.name != null && name.toString == this.fn_.name.toString()) {
			this.fn_.recursive = true;

			return this.fn_;
		} else {
			return super.getValue(name);
		}
	}

	hasValue(name) {
		if (this.fn_.name != null && name.toString() == this.fn_.name.toString()) {
			return true;
		} else {
			return super.hasValue(name);
		}
	}
}

function assertTypeMatch(a, b) {
	if (!a.eq(b)) {
		b.typeError("expected \'" + a.toString() + "\', got \'" + b.toString() + "\'");
	}
}

// caches the evaluated type
class Expr extends Token {
	constructor(loc) {
		super(loc);
		this.cache_ = null;
	}

	eval() {
		if (this.cache_ == null) {
			this.cache_ = this.evalInternal();
		}

		return this.cache_;
	}
}

class Registry {
	constructor() {
		// collection of global functions
		this.fns_ = new Map(); // name of function -> function string
	}

	register(name, definition) {
		if (!this.fns_.has(name)) {
			this.fns_.set(name, definition);
		}
	}

	wrap(inner) {
		// loop backwards through fns
		let fns = [];
		for (let fn of this.fns_) {
			fns.push(fn); // tuples (name, definition)
		}

		fns.reverse();

		let res = inner;
		for (let fn of fns) {
			let [name, def] = fn;

			res = `func(${name}){${res}}(${def})`;
		}

		return res;
	}
}


///////////////
// AST elements
///////////////

class PlutusLightProgram {
	// declarations: type, const or func
	constructor(decls) {
		this.decls_ = decls;
		this.haveDatum_ = false;
		this.haveRedeemer_ = false;
		this.haveScriptContext_ = false;
		this.entryPoint_ = null;
	}

	toString() {
		return this.decls_.map(d => d.toString()).join("\n");
	}

	// also creates the scope
	link() {
		let scope = new GlobalScope();

		// fill the global scope
		scope.setType(new BoolType());
		scope.setType(new IntegerType());
		scope.setType(new StringType());
		scope.setType(new ByteArrayType());
		scope.setType(new ScriptContextType());
		scope.setType(new TxType());
		scope.setType(new TxInputType());
		scope.setType(new TxOutputType());
		scope.setType(new TxIdType());
		scope.setType(new TxOutputIdType());
		scope.setType(new TimeType());
		scope.setType(new TimeRangeType());
		scope.setType(new HashType());
		scope.setType(new ValueType());
		scope.setType(new AddressType());
		scope.setType(new CredentialType());

		let userScope =  new Scope(scope);

		for (let decl of this.decls_) {
			decl.link(userScope);
		}

		return userScope;
	}

	eval(userScope) {
		for (let decl of this.decls_) {
			void decl.eval();
		}

		// look for entrypoint, and check its interface
		let main = userScope.getValue(new Word(Location.dummy(), "main"));

		let mainType = main.eval();

		if (!(mainType instanceof FuncType)) {
			main.typeError("entrypoint is not a function");
		} else if (!(BoolType.is(mainType.retType_))) {
			main.retType_.typeError("expected bool as main return type");
		} else if (mainType.argTypes_.length > 3) {
			main.typeError("too many arguments for main");
		} else {
			let haveDatum = false;
			let haveRedeemer = false;
			let haveScriptContext = false;
			for (let arg of mainType.argTypes_) {
				let t = arg.toString();

				if (t == "Datum") {
					if (haveDatum) {
						main.typeError("duplicate \'Datum\' argument");
					} else if (haveRedeemer) {
						main.typeError("\'Datum\' must come before \'Redeemer\'");
					} else if (haveScriptContext) {
						main.typeError("\'Datum\' must come before \'ScriptContext\'");
					} else {
						haveDatum = true;
					}
				} else if (t == "Redeemer") {
					if (haveRedeemer) {
						main.typeError("duplicate \'Redeemer\' argument");
					} else if (haveScriptContext) {
						main.typeError("\'Redeemer\' must come before \'ScriptContext\'");
					} else {
						haveRedeemer = true;
					}
				} else if (t == "ScriptContext") {
					if (haveScriptContext) {
						main.typeError("duplicate \'ScriptContext\' argument");
					} else {
						haveScriptContext = true;
					}
				} else {
					main.typeError("illegal argument type, must be \'Datum\', \'Redeemer\' or \'ScriptContext\'");
				}
			}

			this.haveDatum_ = haveDatum;
			this.haveRedeemer_ = haveRedeemer;
			this.haveScriptContext_ = haveScriptContext;
			this.entryPoint_ = main;
		}
	}

	linkAndEval() {
		let userScope = this.link();

		this.eval(userScope);

		// very strict usage requirements for all consts, usertypes, functions and variables
		userScope.assertAllUsed();

		return userScope;
	}

	toUntyped() {
		let userScope = this.linkAndEval();

		let registry = new Registry();

		userScope.registerGlobals(registry);

		let res = "func(";

		let mainArgs = [];
		let uMainArgs = [];
		if (this.haveDatum_) {
			mainArgs.push("datum");
			uMainArgs.push("datum");
		} else {
			mainArgs.push("_");
		}

		if (this.haveRedeemer_) {
			mainArgs.push("redeemer");
			uMainArgs.push("redeemer");
		} else {
			mainArgs.push("_");
		}

		if (this.haveScriptContext_) {
			mainArgs.push("ctx");
			uMainArgs.push("ctx");
		} else {
			mainArgs.push("_");
		}

		res += mainArgs.join(", ");

		res += "){\n  ifThenElse(";

		res += this.entryPoint_.toUntyped() + "(" + uMainArgs.join(", ") + "), func(){()}, func(){error()})()\n"; // deferred evaluation of branches!
		
		res += "}";

		// only user function declarations that are called more than once are added to global space, in the order they are encountere

		// wrap main wih global user functions
		res = userScope.usedMoreThanOnceToUntyped(res);

		// wrap res with builtin global functions
		return registry.wrap(res);
	}
}

class Named extends Token {
	constructor(loc, name) {
		super(loc);
		this.name_ = name; // word token
		this.useCount_ = 0;
	}

	get name() {
		return this.name_;
	}

	incrUseCount() {
		this.useCount_ += 1;
	}

	get used() {
		return this.useCount_ > 0;
	}
}

class StructTypeDecl extends Named {
	// name is a word token, name == nil is struct literal
	constructor(loc, name, fields) {
		super(loc, name);
		this.fields_ = fields;
		this.cache_ = null;
	}

	toString() {
		let parts = [];

		for (let member of this.fields_) {
			let [key, obj] = member;

			parts.push(key + ": " + obj.toString());
		}

		let inner = "{" + parts.join("") + "}";

		if (this.name_ == null) {
			return inner;
		} else {
			return "type " + this.name_.toString() + " " + inner;
		}
	}

	link(scope) {
		for (let f of this.fields_) {
			f[1].link(scope);
		}

		if (this.name_ != null) {
			scope.setType(this);
		}
	}

	eq(other) {
		// actually check the fields
		if (!other instanceof StructTypeDecl) {
			other = other.eval();
		}

		if (other instanceof StructTypeDecl) {
			if (this.name != null && other.name != null) {
				return this.name.toString() == other.name.toString();
			} else {
				assert(this.name_ != null);

				if (this.fields_.length != other.fields_.length) {
					return false;
				}

				for (let member of this.fields_) {
					let [key, obj_] = member;

					if (!other.fields_.has(key)) {
						return false;
					}

					let obj = obj_.eval();
					let otherObj = other.fields_.get(key).eval();

					if (!obj.eq(otherObj)) {
						return false;
					}
				}

				return true;
			}
		} else {
			return false;
		}
	}

	evalMember(name) {
		if (!this.fields_.has(name.toString())) {
			if (this.name_ != null) {
				name.referenceError("\'" + this.name_.toString() + "." + name.toString() + "\' undefined");
			} else {
				name.referenceError("member \'" + name.toString() + "\' undefined");
			}
		} else {
			let member = this.fields_.get(name.toString());

			return member.eval();
		}
	}

	eval() {
		if (this.cache_ != null) {
			return this.cache_;
		}

		for (let f of this.fields_) {
			let expr = f[1];
			let type = expr.eval();

			assertNoFunctions(type);
		}

		this.cache_ = this;
		return this.cache_;
	}

	// result has builtin type `data`
	memberAccessToUntyped(lhs, name) {
		let res = `unListData(${lhs})`;
		for (let f of this.fields_) {
			if (f == name.toString()) {
				res = `headList(${res})`;
				break;
			} else {
				res = `tailList(${res})`;
			}
		}

		return res;
	}
}

class StructLiteral extends StructTypeDecl {
	constructor(loc, type, fields) {
		super(loc, null, fields);
		this.type_ = type;
	}

	toString() {
		return this.type_.toString() + super.toString();
	}

	link(scope) {
		this.type_.link(scope);
		super.link(scope);
	}

	eval() {
		if (this.cache_ != null) {
			return this.cache_;
		}

		let structDecl = this.type_.eval();

		if (! structDecl instanceof StructTypeDecl) {
			this.type_.referenceError("not a struct type");
		}

		if (!structDecl.eq(this)) {
			this.type_.referenceError("struct fields don't correspond");
		}

		this.cache_ = structDecl;
		return this.cache_;
	}

	evalData() {
		// create simple list of fields
		let dataFields = [];

		for (let member of this.fields_) {
			let item = member[1];

			dataFields.push(item.evalData());
		}

		return new ListData(dataFields);
	}

	registerGlobals(registry) {
		for (let member of this.fields_) {
			let item = member[1];

			item.registerGlobals(registry);
		}
	}

	// the final return type is `data`
	toUntyped() {
		let res = "mkNilData(())";

		let exprs = [];
		for (let f of this.fields_) {
			exprs.push(f[1]);
		}

		for (let i = exprs.length - 1; i >= 0; i--) {
			let expr = exprs[i];
			let type = expr.eval();

			res = `mkCons(${toData(expr.toUntyped(), type)}, ${res})`;
		}

		return `listData(${res})`;
	}
}

class TypeAliasDecl extends Named {
	constructor(loc, name, type) {
		super(loc, name);
		this.type_ = type;
	}

	toString() {
		return "type " + this.name_.toString() + " " + this.type_.toString();
	}

	link(scope) {
		this.type_.link(scope);

		scope.setType(this);
	}

	// evaluate all aliases
	eval() {
		return this.type_.eval();
	}

	eq(other) {
		return this.type_.eval().eq(other.eval());
	}
}

class ConstDecl extends Named {
	constructor(loc, name, type, rhs) {
		super(loc, name);
		this.type_ = type;
		this.rhs_ = rhs;
	}

	toString() {
		return "const " + this.name_.toString() + " " + this.type_.toString() + " = " + this.rhs_.toString();
	}

	link(scope) {
		this.type_.link(scope);

		this.rhs_.link(scope);

		scope.setValue(new NamedValue(this.name_, this.rhs_));
	}

	eval() {
		// now assure that rhs is of certain type
		assertTypeMatch(this.type_.eval(), this.rhs_.eval()); 
	}
}

class FuncDecl extends Named {
	// name == null for FuncExpr
	constructor(loc, name, args, retType, body) {
		super(loc, name);
		this.args_ = args;
		this.retType_ = retType;
		this.body_ = body;
		this.recursive_ = false;
		this.argRefs_ = [];
	}

	set recursive(b) {
		this.recursive_ = b;
	}

	toString() {
		let s = "func ";
		if (this.name_ != null) {
			s += this.name_.toString();
		}

		let sArgs = [];
		for (let arg of this.args_) {
			let [name, type] = arg;

			sArgs.push(name.toString() + " " + type.toString());
		}

		return s + "(" + sArgs.join(",") + ") " + this.retType_.toString() + " {" + this.body_.toString() + "}";
	}

	link(scope) {
		// TODO: allow recursive calls of self
		let subScope = new FuncScope(scope, this);

		let i = 0;
		assert(this.argRefs_.length == 0);
		for (let arg of this.args_) {
			let [name, type] = arg;

			type.link(scope);

			let val = new NamedValue(name, type);
			this.argRefs_.push(val);

			subScope.setValue(val);

			i++;
		}

		this.retType_.link(scope);

		this.body_.link(subScope);

		if (this.name_ != null) {
			scope.setValue(this);
		}

		subScope.assertAllUsed();
	}

	eval() {
		let argTypes = [];

		for (let arg of this.args_) {
			argTypes.push(arg[1]);
		}

		let retType = this.retType_.eval();

		assertTypeMatch(retType, this.body_.eval());

		return new FuncType(this.loc, argTypes, retType);
	}

	registerGlobals(registry) {
		this.body_.registerGlobals(registry);
	}

	// user space functions are prefixed by u_
	toUntyped(args) { // input args must be expressions, not types!
		if (args == undefined) {
			let result = "func";

			result += "(";

			let argParts = [];

			for (let arg of this.args_) {
				let argName = arg[0];

				argParts.push(argName);
			}

			result += argParts.join(", ") + "){";

			result += this.body_.toUntyped();

			result += "}";

			return result;
		} else {
			// inline everything
			assert(args.length == this.argRefs_.length);

			for (let i = 0; i < this.argRefs_.length; i++) {
				this.argRefs_[i].expr_ = args[i];
			}

			return this.body_.toUntyped();
		}
	}
}

class NamedValue extends Named {
	constructor(name, type) {
		super(name.loc, name);
		this.type_ = type;
		this.expr_ = null;
	}

	eval() {
		return this.type_.eval();
	}

	toUntyped() {
		if (this.ref_ instanceof NamedValue && this.ref_.expr_ != null) {
			return this.ref_.expr_.toUntyped();
		} else if (this.type_.isLiteral()) {
			return this.type_.toString();
		} else {
			return this.name.toString();
		}
	}
}

class NamedType extends Token {
	constructor(name) {
		super(name.loc);
		this.name_ = name;
		this.ref_ = null;
	}

	toString() {
		return this.name_.toString();
	}

	link(scope) {
		let type = scope.getType(this.name_);

		this.ref_ = type;
	}

	eq(other) {
		assert(this.ref_ != null);

		return this.ref_.eval().eq(other);
	}

	eval() {
		assert(this.ref_ != null);

		return this.ref_.eval();
	}
}

class ListType extends Token {
	constructor(loc, itemType) {
		super(loc);
		this.itemType_ = itemType;
	}

	get itemType() {
		return this.itemType_.eval();
	}
	toString() {
		return "[]" + this.itemType_.toString();
	}

	link(scope) {
		this.itemType_.link(scope);
	}

	eq(other) {
		if (other instanceof ListType) {
			if (other.itemType_ == null || this.itemType_ == null) {
				return true;
			} else {
				return (this.itemType_.eq(other.itemType_));
			}
		} else {
			return false;
		}
	}

	eval() {
		return this;
	}
}

class FuncType extends Token {
	constructor(loc, argTypes, retType) {
		super(loc);
		this.argTypes_ = argTypes; // list
		this.retType_  = retType;
	}

	toString() {
		return "func (" + this.argTypes_.map(at => at.toString()).join(", ") + ") " + this.retType_.toString();
	}

	link(scope) {
		for (let arg of this.argTypes_) {
			arg.link(scope);
		}

		this.retType_.link(scope);
	}

	eq(other) {
		if (!(other instanceof FuncType)) {
			return false;
		} else if (this.argTypes_.length != other.argTypes_.length) {
			return false;
		} else if (!this.retType_.eval().eq(other.retType_.eval())) {
			return false;
		} else {
			for (let i = 0; i < this.argTypes_.length; i++) {
				if (!this.argTypes_[i].eval().eq(other.argTypes_[i].eval())) {
					return false;
				}
			}

			return true;
		}
	}

	assertEq(other) {
		if (!this.eq(other)) {
			other.loc.typeError("expected \'" + this.toString() + ", got \'" + other.toString());
		}
	}

	eval() {
		return this;
	}

	evalCall(loc, args) {
		let n = this.argTypes_.length;

		if (args.length != n) {			
			loc.typeError("expected " + n.toString() + " arg(s), got " + args.length.toString() + " arg(s)");
		}

		for (let i = 0; i < n; i++) {
			assertTypeMatch(this.argTypes_[i].eval(), args[i]);
		}

		return this.retType_.eval();
	}

	evalDataCall(loc, args) {
		loc.typeError("user functions can't be used in data eval");
	}
}

// used when empty list are passed into fold
class AnyType {
	constructor() {
	}

	eq(other) {
		return true;
	}
}

class Variable extends Token {
	constructor(name) {
		super(name.loc);
		this.name_ = name;
		this.ref_  = null;
	}

	toString() {
		return this.name_.toString();
	}

	link(scope) {
		let ref = scope.getValue(this.name_);

		this.ref_ = ref;
	}

	eval() {
		assert(this.ref_ != null);

		return this.ref_.eval();
	}

	registerGlobals(registry) {
	}

	toUntyped() {
		assert(this.ref_ != null);

		let res = this.ref_.toUntyped();

		return res;
	}
}

function assertNoFunctions(type) {
	if (type instanceof FuncType) {
		throw new Error("container can't contain function");
	} else if (type instanceof StructTypeDecl) {
		// handled by calling eval on StructTypeDecl itself
		return;
	} else if (type instanceof BoolType) {
		return;
	} else if (type instanceof IntegerType) {
		return;
	} else if (type instanceof ByteArrayType) {
		return;
	} else if (type instanceof StringType) {
		return;
	} else if (type instanceof ListType) {
		assertNoFunctions(type.itemType);
	} else {
		if (!type instanceof BuiltinType) {
			throw new Error("internal error: unhandled type " + type.toString());
		}
	}
}

class ListLiteral extends Expr {
	constructor(loc, itemType, items) {
		super(loc);
		this.itemType_ = itemType;
		this.items_ = items;
	}

	toString() {
		return "[]" + this.itemType_.toString() + "{" + this.items_.map(item => item.toString()).join(', ') + "}";
	}

	link(scope) {
		this.itemType_.link(scope);

		for (let item of this.items_) {
			item.link(scope);
		}
	}

	evalInternal() {
		let itemType = this.itemType_.eval();

		for (let item of this.items_) {
			assertTypeMatch(itemType, item.eval());
		}

		assertNoFunctions(itemType);

		return new ListType(this.loc, itemType);
	}

	registerGlobals(registry) {
		for (let item of this.items_) {
			item.registerGlobals(registry);
		}
	}

	toUntyped() {
		// unsure if list literals in untyped plutus-core accept arbitrary terms, so we will use the more verbose constructor functions 
		let res = "mkNilData(())";

		// starting from last element, keeping prepending a data version of that item
		let itemType = this.itemType_.eval();

		for (let i = this.items_.length - 1; i >= 0; i--) {
			let itemExpr = this.items_[i];
			res = `mkCons(${toData(itemExpr.toUntyped(), itemType)}, ${res})`;
		}

		return res;
	}
}

class UnaryOperator extends Expr {
	constructor(symbol, a) {
		super(symbol.loc);
		this.symbol_ = symbol;
		this.a_ = a;
	}

	toString() {
		return this.symbol_.toString() + this.a_.toString();
	}

	link(scope) {
		this.a_.link(scope);
	}

	evalInternal() {
		let op = this.symbol_.toString();
		let a = this.a_.eval();

		if (op == "+" || op == "-") {
			if (IntegerType.is(a)) {
				return new IntegerType(this.symbol_.loc);
			}
		} else if (op == "!") {
			if (BoolType.is(a)) {
				return new BoolType();
			}
		} else {
			throw new Error("unhandled unary operator");
		}

		this.symbol_.typeError("invalid operand type for " + op + ": \'" + a.toString() + "\'");
	}

	registerGlobals(registry) {
		this.a_.registerGlobals(registry);
	}

	toUntyped() {
		let op = this.symbol_.toString();
		let a = this.a_.eval();
		let au = a.toUntyped();

		if (op == "+") {
			assert(IntegerType.is(a));
			return au;
		} else if (op == "-") {
			assert(IntegerType.is(a));
			return `multiplyInteger(${au}, -1)`; // the minus sign should be part of literal parsing in the untyped ast builder
		} else if (op == "!") {
			assert(BoolType.is(a));
			return `ifThenElse(${au}, false, true)`; // doesn't need deferred evaluation of branches
		} else {
			throw new Error("unhandled unary operator");
		}
	}
}

class BinaryOperator extends Expr {
	constructor(symbol, a, b) {
		super(symbol.loc);
		this.symbol_ = symbol;
		this.a_ = a;
		this.b_ = b;
	}

	toString() {
		return this.a_.toString() + this.symbol_.toString() + this.b_.toString();
	}

	link(scope) {
		this.a_.link(scope);
		this.b_.link(scope);
	}

	evalInternal() {
		let op = this.symbol_.toString();
		let a = this.a_.eval();
		let b = this.b_.eval();

		if (op == "||" || op == "&&") {
			if (BoolType.is(a) && BoolType.is(b)) {
				return new BoolType();
			}
		} else if (op == "==" || op == "!=") {
			if (IntegerType.is(a) && IntegerType.is(b)) {
				return new BoolType(this.symbol_.loc);
			} else if (ByteArrayType.is(a) && ByteArrayType.is(b)) {
				return new BoolType();
			} else if (TimeType.is(a) && TimeType.is(b)) {
				return new BoolType();
			} else if (TxIdType.is(a) && TxIdType.is(b)) {
				return new BoolType();
			} else if (TxOutputIdType.is(a) && TxOutputIdType.is(b)) {
				return new BoolType();
			} else if (HashType.is(a) && HashType.is(b)) {
				return new BoolType();
			} 
		} else if (op == "<" || op == "<=" || op == ">" || op == ">=") {
			if (IntegerType.is(a) && IntegerType.is(b)) {
				return new BoolType(this.symbol_.loc);
			} else if (ByteArrayType.is(a) && ByteArrayType.is(b)) {
				return new BoolType();
			} else if (TimeType.is(a) && TimeType.is(b)) {
				return new BoolType();
			}
		} else if (op == "+") {
			if (IntegerType.is(a) && IntegerType.is(b)) {
				return new IntegerType(this.symbol_.loc);
			} else if (ByteArrayType.is(a) && ByteArrayType.is(b)) {
				return new ByteArrayType();
			} else if (ValueType.is(a) && ValueType.is(b)) {
				return new ValueType();
			}
		} else if (op == "-") {
			if (IntegerType.is(a) && IntegerType.is(b)) {
				return new IntegerType(this.symbol_.loc);
			} else if (ValueType.is(a) && ValueType.is(b)) {
				return new ValueType();
			}
		} else if (op == "*" || op == "/" || op == "%") {
			if (IntegerType.is(a) && IntegerType.is(b)) {
				return new IntegerType(this.symbol_.loc);
			}
		} else {
			throw new Error("unhandled binary operator");
		}

		this.symbol_.typeError("invalid operand types for " + op + ": \'" + a.toString() + "\' and \'" + b.toString() + "\'");
	}

	registerGlobals(registry) {
		let op = this.symbol_.toString();
		let a = this.a_.eval();
		let b = this.b_.eval();

		if (op == "!=") {
			Not.register(registry);

			if (TxOutputIdType.is(a) && TxOutputIdType.is(b)) {
				EqualsTxOutputId.register(registry);
			} else if (HashType.is(a) && HashType.is(b)) {
				EqualsHash.register(registry);
			}
		} else if (op == "==") {
			if (TxOutputIdType.is(a) && TxOutputIdType.is(b)) {
				EqualsTxOutputId.register(registry);
			} else if (HashType.is(a) && HashType.is(b)) {
				EqualsHash.register(registry);
			}
		} else if (op == "+") {
			if (ValueType.is(a) && ValueType.is(b)) {
				AddValues.register(registry);
			}
		} else if (op == "-") {
			if (ValueType.is(a) && ValueType.is(b)) {
				SubtractValues.register(registry);
			}
		}

		this.a_.registerGlobals(registry);
		this.b_.registerGlobals(registry);
	}

	evalData() {
		// for adding Values
		let op = this.symbol_.toString();
		let aType = this.a_.eval();
		let bType = this.b_.eval();

		let a = this.a_.evalData();
		let b = this.b_.evalData();

		if ((op == "+") && ValueType.is(aType) && ValueType.is(bType)) {
			let total = new Map(); // nested map

			// extract map data
			let aMap = a.items_[0];
			let bMap = b.items_[1];

			for (let m of [aMap, bMap]) {
				for (let p of m.pairs_) {
					let cs = p[0].toHex();

					let tnMap = p[1];

					for (let q of tnMap.pairs_) {
						let tn = q[0].toHex();
						let amount = q[1].value_; // IntegerData

						let key = cs + "-" + tn;
						if (!total.has(cs)) {
							total.set(cs, new Map());
						} 

						if (!total.get(cs).has(tn)) {
							total.get(cs).set(tn, 0);
						}
						
						total.get(cs).set(tn, total.get(cs).get(tn) + amount);
					}
				}
			}

			let pairs = [];
			for (let item of total) {
				let [cs, innerMap] = item;

				let innerPairs = [];
				for (let innerItem of innerMap) {
					let [tn, amount] = innerItem;

					innerPairs.push([new ListData([new ByteArrayData(hexToBytes(tn))]), new IntegerData(amount)]);
				}

				pairs.push([new ListData([new ByteArrayData(hexToBytes(cs))]), new MapData(innerPairs)]);
			}

			return new ListData([new MapData(pairs)]);
		} else {
			this.typeError("can't use this binary op in data eval");
		}
	}
	
	toUntyped() {
		let op = this.symbol_.toString();
		let a = this.a_.eval();
		let b = this.b_.eval();

		let au = this.a_.toUntyped();
		let bu = this.b_.toUntyped();
		let aut = `unIData(headList(unListData(${au})))`;
		let but = `unIData(headList(unListData(${bu})))`;

		if (op == "||") {
			assert(BoolType.is(a) && BoolType.is(b));
			return `ifThenElse(${au}, func(){true}, func(){${bu}})()`; // deferred evaluation of branches
		} else if (op == "&&") {
			assert(BoolType.is(a) && BoolType.is(b));
			return `ifThenElse(${au}, func(){${bu}}, func(){false})()`; // deferred evaluation of branches
		} else if (op == "==") {
			if (IntegerType.is(a) && IntegerType.is(b)) {
				return `equalsInteger(${au}, ${bu})`;
			} else if (ByteArrayType.is(a) && ByteArrayType.is(b)) {
				return `equalsByteString(${au}, ${bu})`;
			} else if (TimeType.is(a) && TimeType.is(b)) {
				return `equalsInteger(${aut}, ${but})`;
			} else if (TxIdType.is(a) && TxIdType.is(b)) {
				return `equalsByteString(unBData(${unData(au, 0, 0)}), unBData(${unData(bu, 0, 0)}))`;
			} else if (TxOutputIdType.is(a) && TxOutputIdType.is(b)) {
				return `equalsTxOutputId(${au}, ${bu})`;
			} else if (HashType.is(a) && HashType.is(b)) {
				return `equalsHash(${au}, ${bu})`;
			}
		} else if (op == "!=") {
			if (IntegerType.is(a) && IntegerType.is(b)) {
				return `not(equalsInteger(${au}, ${bu}))`;
			} else if (ByteArrayType.is(a) && ByteArrayType.is(b)) {
				return `not(equalsByteString(${au}, ${bu}))`;
			} else if (TimeType.is(a) && TimeType.is(b)) {
				return `not(equalsInteger(${aut}, ${but}))`;
			} else if (TxIdType.is(a) && TxIdType.is(b)) {
				return `not(equalsByteString(unBData(${unData(au, 0, 0)}), unBData(${unData(bu, 0, 0)})))`;
			} else if (TxOutputIdType.is(a) && TxOutputIdType.is(b)) {
				return `not(equalsTxOutputId(${au}, ${bu}))`;
			} else if (HashType.is(a) && HashType.is(b)) {
				return `not(equalsHash(${au}, ${bu}))`;
			}
 		} else if (op == "<") {
			if (IntegerType.is(a) && IntegerType.is(b)) {
				return `lessThanInteger(${au}, ${bu})`;
			} else if (ByteArrayType.is(a) && ByteArrayType.is(b)) {
				return `lessThanByteString(${au}, ${bu})`;
			} else if (TimeType.is(a) && TimeType.is(b)) {
				return `lessThanInteger(${aut}, ${but})`;
			}
		} else if (op == "<=") {
			if (IntegerType.is(a) && IntegerType.is(b)) {
				return `lessThanEqualsInteger(${au}, ${bu})`;
			} else if (ByteArrayType.is(a) && ByteArrayType.is(b)) {
				return `lessThanEqualsByteString(${au}, ${bu})`;
			} else if  (TimeType.is(a) && TimeType.is(b)) {
				return `lessThanEqualsInteger(${aut}, ${but})`;
			}
		} else if (op == ">") {
			if (IntegerType.is(a) && IntegerType.is(b)) {
				return `ifThenElse(lessThanEqualsInteger(${au}, ${bu}), false, true)`; // doesn't need deferred evaluation of branches
			} else if (ByteArrayType.is(a) && ByteArrayType.is(b)) {
				return `ifThenElse(lessThanEqualsByteString(${au}, ${bu}), false, true)`; // doesn't need deferred evaluation of branches
			} else if (TimeType.is(a) && TimeType.is(b)) {
				return `ifThenElse(lessThanEqualsInteger(${aut}, ${but}), false, true)`; // doesn't need deferred evaluation of branches
			}
		} else if (op == ">=") {
			if (IntegerType.is(a) && IntegerType.is(b)) {
				return `ifThenElse(lessThanInteger(${au}, ${bu}), false, true)`; // doesn't need deferred evaluation of branches
			} else if (ByteArrayType.is(a) && ByteArrayType.is(b)) {
				return `ifThenElse(lessThanByteString(${au}, ${bu}), false, true)`; // doesn't need deferred evaluation of branches
			} else if (TimeType.is(a) && TimeType.is(b)) {
				return `ifThenElse(lessThanInteger(${aut}, ${but}), false, true)`; // doesn't need deferred evaluation of branches
			}
		} else if (op == "+") {
			if (IntegerType.is(a) && IntegerType.is(b)) {
				return `addInteger(${au}, ${bu})`;
			} else if (ByteArrayType.is(a) && ByteArrayType.is(b)) {
				return `appendByteString(${au}, ${bu})`;
			} else if (ValueType.is(a) && ValueType.is(b)) {
				return `addValues(${au}, ${bu})`;
			}
		} else if (op == "-") {
			if (IntegerType.is(a) && IntegerType.is(b)) {
				return `subtractInteger(${au}, ${bu})`;
			} else if (ValueType.is(a) && ValueType.is(b)) {
				return `subtractValues(${au}, ${bu})`;
			}
		} else if (op == "*") {
			assert(IntegerType.is(a) && IntegerType.is(b));
			return `multiplyInteger(${au}, ${bu})`;
		} else if (op == "/") {
			assert(IntegerType.is(a) && IntegerType.is(b));
			return `divideInteger(${au}, ${bu})`;
		} else if (op == "%") {
			assert(IntegerType.is(a) && IntegerType.is(b));
			return `modInteger(${au}, ${bu})`;
		} else {
			throw new Error("unhandled binary operator");
		}

		throw new Error("should've been caught before");
	}
}

class Parens extends Expr {
	constructor(loc, expr) {
		super(loc);
		this.expr_ = expr;
	}

	toString() {
		return "(" + this.expr_.toString() + ")";
	}

	link(scope) {
		this.expr_.link(scope);
	}

	evalInternal() {
		return this.expr_.eval();
	}

	evalData() {
		return this.expr_.evalData();
	}

	registerGlobals(registry) {
		this.expr_.registerGlobals(registry);
	}

	toUntyped() {
		return this.expr_.toUntyped();
	}
}

class AssignExpr extends Expr {
	constructor(loc, name, type, rhs, lambda) {
		super(loc);
		this.name_ = name;
		this.type_ = type;
		this.rhs_  = rhs;
		this.lambda_ = lambda;
	}

	toString() {
		return this.name_.toString() + " " + this.type_.toString() + " = " + this.rhs_.toString() + "; " + this.lambda_.toString();
	}

	link(scope) {
		let subScope = new Scope(scope);

		this.type_.link(scope);
		this.rhs_.link(scope);

		subScope.setValue(new NamedValue(this.name_, this.type_));

		this.lambda_.link(subScope);

		subScope.assertAllUsed();
	}

	evalInternal() {
		let type = this.type_.eval();
		let rhs = this.rhs_.eval();

		assertTypeMatch(type, rhs);

		return this.lambda_.eval();
	}

	registerGlobals(registry) {
		this.rhs_.registerGlobals(registry);
		this.lambda_.registerGlobals(registry);
	}

	toUntyped() {
		return `func(${this.name_.toString()}){${this.lambda_.toUntyped()}}(${this.rhs_.toUntyped()})`;
	}
}

class FuncExpr extends FuncDecl {
	constructor(loc, args, retType, body) {
		super(loc, null, args, retType, body);
	}
}

class BranchExpr extends Expr {
	constructor(loc, conditions, blocks) {
		assert(blocks.length == conditions.length + 1);
		assert(blocks.length > 1);

		super(loc);
		this.conditions_ = conditions;
		this.blocks_ = blocks;
	}

	toString() {
		let s = "";
		for (let i = 0; i < this.conditions_.length; i++) {
			s += `if (${this.conditions_[i].toString()}) {${this.blocks_[i].toString()}} else `;
		}

		s += `{${this.blocks_[this.conditions_.length].toString()}}`;
	}

	link(scope) {
		for (let c of this.conditions_) {
			c.link(scope);
		}

		for (let b of this.blocks_) {
			b.link(scope);
		}
	}

	evalInternal() {
		for (let c of this.conditions_) {
			let cType = c.eval();

			if (!BoolType.is(cType)) {
				c.typeError("invalid condition type in branch expression: \'" + cType.toString() + "\'");
			}
		}

		let blockType = null;
		for (let b of this.blocks_) {
			let bType = b.eval();

			if (blockType == null) {
				blockType = bType;
			} else {
				if (!blockType.eq(bType)) {
					b.typeError("inconsistent branch block types");
				}
			}
		}

		return blockType;
	}

	registerGlobals(registry) {
		for (let c of this.conditions_) {
			c.registerGlobals(registry);
		}

		for (let b of this.blocks_) {
			b.registerGlobals(registry);
		}
	}

	toUntyped() {
		let n = this.conditions_.length;

		// each branch actually returns a function to allow deferred evaluation
		let res = `func(){${this.blocks_[n].toUntyped()}}`;

		for (let i = n-1; i >= 0; i--) {
			res = `ifThenElse(${this.conditions_[i].toUntyped()}, func(){${this.blocks_[i].toUntyped()}}, func(){${res}()})`;
		}

		return res + "()";
	}
}

class IndexExpr extends Expr {
	constructor(loc, lhs, index) {
		super(loc);
		this.lhs_ = lhs;
		this.index_ = index;
	}

	toString() {
		return this.lhs_.toString() + "[" + this.index_.toString() + "]";
	}

	link(scope) {
		this.lhs_.link(scope);
		this.index_.link(scope);
	}

	evalInternal() {
		let lhs = this.lhs_.eval();
		let index = this.index_.eval(); 

		if (!(lhs instanceof ListType && IntegerType.is(index))) {
			this.lhs_.typeError("invalid operand types for indexing: \'"  + lhs.toString() + "\' and \'" + index.toString() + "\'");
		}

		if (lhs.itemType == null) {
			this.lhs_.typeError("can't index empty list");
		}

		return lhs.itemType;
	}

	registerGlobals(registry) {
		this.lhs_.registerGlobals(registry);
		this.index_.registerGlobals(registry);
	}

	// list is always `[]data`, so item must be converted to correct type from data
	toUntyped() {
		// seems wasteful to fully inline this everytime
		let lhs = this.lhs_.toUntyped();
		let index = this.index_.toUntyped();

		// deferred evaluation of each ifThenElse branch
		return `func(self, lst, i){self(self, lst, i)}(func(self, lst, i) {
			ifThenElse(
				nullList(lst), 
				func(){error()}, 
				func(){ifThenElse(
					lessThanInteger(i, 0), 
					func(){error()}, 
					func(){ifThenElse(
						equalsInteger(i, 0), 
						func(){${fromData("headList(lst)", lhs.itemType)}}, 
						func(){self(self, tailList(lst), subtractInteger(i, 1))}
					)()}
				)()}
			)()
		}, ${lhs}, ${index})`;
	}
}

class CallExpr extends Expr {
	constructor(loc, lhs, args) {
		super(loc);
		this.lhs_ = lhs;
		this.args_ = args;
	}

	toString() {
		return this.lhs_.toString() + "(" + this.args_.map(a => a.toString()).join(", ") + ")";
	}

	link(scope) {
		this.lhs_.link(scope);

		for (let arg of this.args_) {
			arg.link(scope);
		}
	}

	evalInternal() {
		let lhs = this.lhs_.eval();

		if (! ((lhs instanceof FuncType) || (lhs instanceof BuiltinFunc))) {
			this.lhs_.typeError("\'" + this.lhs_.toString() + "\' not callable");
		}

		let args = [];
		for (let a of this.args_) {
			args.push(a.eval());
		}

		return lhs.evalCall(this.loc, args);
	}

	evalData() {
		let args = [];

		for (let arg of this.args_) {
			args.push(arg.evalData());
		}

		this.lhs_.evalDataCall(this.loc, args);
	}

	registerGlobals(registry) {
		this.lhs_.registerGlobals(registry);
		for (let a of this.args_) {
			a.registerGlobals(registry);
		}
	}

	toUntyped() {
		if (this.lhs_ instanceof Variable) {
			if (this.lhs_.ref_ instanceof FuncDecl) {
				if (this.lhs_.ref_.useCount_ == 1) {
					return this.lhs_.ref_.toUntyped(this.args_);
				} else {
					return `u_${this.lhs_.ref_.name.toString()}(${this.args_.map(a => a.toUntyped()).join(", ")})`;
				}
			}
		}

		return `${this.lhs_.toUntyped()}(${this.args_.map(a => a.toUntyped()).join(", ")})`;
	}
}

class BuiltinCall extends Expr {
	constructor(name, args, obj) {
		super(name.loc);
		this.name_ = name;
		this.args_ = args;
		this.obj_  = obj; // handles the actual type check etc.
	}

	toString() {
		return this.name_ + "(" + this.args_.map(a => a.toString()).join(", ") + ")";
	}

	link(scope) {
		for (let arg of this.args_) {
			arg.link(scope);
		}
	}

	evalArgs() {
		let args = [];
		for (let a of this.args_) {
			args.push(a.eval());
		}

		return args;
	}

	evalInternal() {
		let args = this.evalArgs();

		return this.obj_.evalCall(this.loc, args);
	}

	registerGlobals(registry) {
		this.obj_.registerGlobals(registry);
		for (let a of this.args_) {
			a.registerGlobals(registry);
		}
	}

	toUntyped() {
		return this.obj_.toUntyped(this.args_);
	}
}

// turn something of `data` type into whatever is needed
function fromData(str, type) {
	// convert to the relevant type
	if (type instanceof IntegerType) {
		return `unIData(${str})`;
	} else if (type instanceof ByteArrayType) {
		return `unBData(${str})`;
	} else if (type instanceof StringType) {
		return `decodeUtf8(unBData(${str}}))`;
	} else if (type instanceof BoolType) {
		return `ifThenElse(equalsInteger(unIData(${str}), 0), false, true)`; // doesn't need deferred evaluation
	} else if (type instanceof ListType) {
		return `unListData(${str})`; // list always contains only data in the final code
	} else {
		return str; // struct is data
	}
}

function toData(str, type) {
	if (type instanceof IntegerType) {
		return `iData(${str})`;
	} else if (type instanceof ByteArrayType) {
		return `bData(${str})`;
	} else if (type instanceof StringType) {
		return `bData(encodeUtf8(${str}))`;
	} else if (type instanceof BoolType) {
		return `iData(ifThenElse(${str}, 1, 0))`; // doesn't need deferred evaluation
	} else if (type instanceof ListType) {
		// assuming list is also a list of data
		return `listData(${str})`;
	} else {
		return str; // struct is data
	}
}

function unData(str, typeIdx, member) {
	let innerStr = "sndPair(pair)";
	for (let i = 0; i < member; i++) {
		innerStr = `tailList(${innerStr})`;
	}

	// deferred evaluation of ifThenElse branches
	return `func(pair){
		ifThenElse(
			equalsInteger(fstPair(pair), ${typeIdx}), 
			func(){headList(${innerStr})}, 
			func(){error()}
		)()
	}(unConstrData(${str}))`;
}

class MemberExpr extends Expr {
	constructor(loc, lhs, name) {
		super(loc);
		this.lhs_ = lhs;
		this.name_ = name;
	}
	
	toString() {
		return this.lhs_ + "." + this.name_.toString();
	}

	link(scope) {
		this.lhs_.link(scope);
	}

	evalInternal() {
		let lhs = this.lhs_.eval();

		if (!(lhs instanceof StructTypeDecl)) {
			this.typeError("\'" + this.lhs_ + "\' is not a struct");
		}

		return lhs.evalMember(this.name_);
	}

	registerGlobals(registry) {
		this.lhs_.registerGlobals(registry);
	}

	toUntyped() {
		let lhs = this.lhs_.eval();

		// member access is always for structs, which are always `data` -> []data
		let res = lhs.memberAccessToUntyped(this.lhs_.toUntyped(), this.name_);

		return fromData(res, lhs);
	}
}

class BuiltinType extends Named {
	// name is string
	constructor(loc, name) {
		if (isString(name)) {
			name = new Word(Location.dummy(), name);
		}

		super(loc, name);
	}

	isBuiltin() {
		return true;
	}

	toString() {
		return this.name_.toString();
	}

	// eval is the typeEvaluation of each expression, type checking is also done within this function
	eval() {
		return this;
	}

	get used() {
		return true;
	}
}

class IntegerType extends BuiltinType {
	constructor(loc) {
		super(loc, "Integer");
	}

	eq(other) {
		other = other.eval();

		return other instanceof IntegerType;
	}

	static assert(x) {
		assert((new IntegerType()).eq(x), "expected Integer, got " + x.eval().toString());
	}

	static is(x) {
		return (new IntegerType()).eq(x.eval());
	}
}

class BoolType extends BuiltinType {
	constructor(loc) {
		super(loc, "Bool");
	}

	eq(other) {
		other = other.eval();

		return other instanceof BoolType;
	}

	static assert(x) {
		assert((new BoolType()).eq(x), "expected Bool, got " + x.eval().toString());
	}

	static is(x) {
		return (new BoolType()).eq(x);
	}
}

class StringType extends BuiltinType {
	constructor(loc) {
		super(loc, "String");
	}

	eq(other) {
		other = other.eval();

		return other instanceof StringType;
	}

	static assert(x) {
		assert((new StringType()).eq(x), "expected String , got " + x.eval().toString());
	}

	static is(x) {
		return (new StringType()).eq(x);
	}
}

class ByteArrayType extends BuiltinType {
	constructor(loc) {
		super(loc, "ByteArray");
	}

	eq(other) {
		other = other.eval();

		return other instanceof ByteArrayType;
	}

	static assert(x) {
		assert((new ByteArrayType()).eq(x), "expected ByteArray, got " + x.eval().toString());
	}

	static is(x) {
		return (new ByteArrayType()).eq(x);
	}
}

class ScriptContextType extends BuiltinType {
	constructor(loc) {
		super(loc, "ScriptContext");
	}

	eq(other) {
		other = other.eval();

		return other instanceof ScriptContextType;
	}
}

class TxType extends BuiltinType {
	constructor(loc) {
		super(loc, "Tx");
	}

	eq(other) {
		other = other.eval();
		return other instanceof TxType;
	}
}

class TxIdType extends BuiltinType {
	constructor(loc) {
		super(loc, "TxId");
	}

	eq(other) {
		other = other.eval();
		return other instanceof TxIdType;
	}

	static is(x) {
		return (new TxIdType()).eq(x);
	}
}

class TxInputType extends BuiltinType {
	constructor(loc) {
		super(loc, "TxInput");
	}

	eq(other) {
		other = other.eval();
		return other instanceof TxInputType;
	}
}

class TxOutputType extends BuiltinType {
	constructor(loc) {
		super(loc, "TxOutput");
	}

	eq(other) {
		other = other.eval();
		return other instanceof TxOutputType;
	}

	static is(x) {
		return (new TxOutputType()).eq(x);
	}
}

class TxOutputIdType extends BuiltinType {
	constructor(loc) {
		super(loc, "TxOutputId");
	}

	eq(other) {
		other = other.eval();
		return other instanceof TxOutputIdType;
	}

	static is(x) {
		return (new TxOutputIdType()).eq(x);
	}
}

class TimeRangeType extends BuiltinType {
	constructor(loc) {
		super(loc, "TimeRange");
	}

	eq(other) {
		other = other.eval();
		return other instanceof TimeRangeType;
	}
}

class TimeType extends BuiltinType {
	constructor(loc) {
		super(loc, "Time");
	}

	eq(other) {
		other = other.eval();
		return other instanceof TimeType; 
	}

	static is(x) {
		return (new TimeType()).eq(x);
	}
}

class HashType extends BuiltinType {
	constructor(loc) {
		super(loc, "Hash");
	}

	eq(other) {
		other = other.eval();
		return other instanceof HashType;
	}

	static is(x) {
		return (new HashType()).eq(x);
	}
}

class ValueType extends BuiltinType {
	constructor(loc) {
		super(loc, "Value");
	}

	eq(other) {
		other = other.eval();
		return other instanceof ValueType; 
	}

	static is(x) {
		return (new ValueType()).eq(x);
	}
}

class AddressType extends BuiltinType {
	constructor(loc) {
		super(loc, "Address");
	}

	eq(other) {
		other = other.eval();
		return other instanceof AddressType;
	}
}

class CredentialType extends BuiltinType {
	constructor(loc) {
		super(loc, "Credential");
	}

	eq(other) {
		other = other.eval();
		return other instanceof CredentialType;
	}
}

class AssetClassType extends BuiltinType {
	constructor(loc) {
		super(loc, "AssetClass");
	}

	eq(other) {
		other = other.eval();
		return other instanceof AssetClassType;
	}
}

class BuiltinFunc extends Named {
	constructor(name, argTypes = [], retType = null, deps = []) {
		super(Location.dummy(), new Word(Location.dummy(), name));

		this.argTypes_ = argTypes;
		this.retType_ = retType;
		this.deps_ = deps;
	}

	isBuiltin() {
		return true;
	}
	
	link(scope) {
	}

	evalCall(loc, args) {
		if (args.length != this.argTypes_.length) {
			loc.typeError(this.name.toString() + "() expects " + this.argTypes_.length + " arg(s), got " + arg.length.toString() + " arg(s)");
		}

		for (let i = 0; i < args.length; i++) {
			let argType = args[i].eval();
			let expected =  this.argTypes_[i];

			if (!expected.eq(argType)) {
				loc.typeError("invalid argument " + (i+1).toString() + " type for " + this.name.toString() + "(): expected \'" + expected.toString() + "\', got \'" + argType.toString() + "\'");
			}
		}

		return this.retType_;
	}

	evalDataCall(loc, args) {
		loc.typeError("this builtinFunc can't be used in data eval");
	}

	eval() {
		return this;
	}

	registerGlobals(registry) {
	}

	get deps() {
		return this.deps_;
	}
}

class Not extends BuiltinFunc {
	constructor() {
		super("not");
	}

	static register(registry) {
		registry.register("not", "func(b){ifThenElse(b, false, true)}"); // doesn't need deferred evaluation of ifThenElse branches
	}
}

class And extends BuiltinFunc {
	constructor() {
		super("and");
	}

	static register(registry) {
		// deferred evaluation of ifThenElse branches
		registry.register("and", `func(a, b){
			ifThenElse(
				a, 
				func(){b}, 
				func(){false}
			)()
		}`);
	}
}

class Cast extends BuiltinFunc {
	constructor(name) {
		super(name);
	}

	argType() {
		let dstType = this.name.toString();
		if (dstType == "Integer") {
			return new BoolType();
		} else if (dstType == "ByteArray") {
			return new StringType();
		} else if (dstType == "String") {
			return new ByteArrayType();
		} else {
			throw new Error("unhandled cast");
		}
	}

	returnType() {
		let dstType = this.name.toString();
		if (dstType == "Integer") {
			return new IntegerType();
		} else if (dstType == "ByteArray") {
			return new ByteArrayType();
		} else if (dstType == "String") {
			return new StringType();
		} else {
			throw new Error("unhandled cast");
		}
	}

	evalCall(loc, args) {
		if (args.length != 1) {
			loc.typeError(this.name.toString() + "() expects 1 arg(s), got " + args.length.toString() + " arg(s)");
		}

		let argType = this.argType();

		if (!argType.eq(args[0])) {
			args[0].typeError("invalid operand type for " + this.name.toString() + "(): expected \'" + argType.toString() + "\', got \'" + args[0].toString() + "\'");
		}

		return this.returnType();
	}

	toUntyped(args) {
		let argType = args[0].eval();
		let dstType = this.name.toString();
		let au = args[0].toUntyped();

		if (dstType == "Integer") {
			assert(BoolType.is(argType));
			return `ifThenElse(${au}, 1, 0)`; // doesn't need deferred evaluation
		} else if (dstType == "ByteArray") {
			assert(StringType.is(argType));
			return `encodeUtf8(${au})`;
		} else if (dstType == "String") {
			assert(ByteArrayType.is(argType));
			return `decodeUtf8(${au})`;
		} else {
			throw new Error("unhandled cast");
		}
	}
}

class MakeTime extends BuiltinFunc {
	constructor() {
		super("Time", [new IntegerType()], new TimeType());
	}

	static register(registry) {
		registry.register("Time", `func(i){listData(mkCons(iData(i), mkNilData(())))}`);
	}

	registerGlobals(registry) {
		MakeTime.register(registry);
	}

	evalDataCall(loc, args) {
		return new ListData([args[0]]);
	}

	toUntyped(args) {
		return `Time(${args[0].toUntyped()})`;
	}
}

class MakeHash extends BuiltinFunc {
	constructor() {
		super("Hash", [new ByteArrayType()], new HashType());
	}

	static register(registry) {
		registry.register("Hash", `func(b){listData(mkCons(bData(b), mkNilData(())))}`);
	}

	registerGlobals(registry) {
		MakeHash.register(registry);
	}

	evalDataCall(loc, args) {
		return new ListData([args[0]]);
	}

	toUntyped(args) {
		return `Hash(${args[0].toUntyped()})`;
	}
}

// builtins are always inlined
class Fold extends BuiltinFunc {
	constructor() {
		super("fold");
	}

	evalCall(loc, args) {
		if (args.length != 3) {
			loc.typeError(this.name.toString() + "() expects 3 arg(s), got " + args.length.toString() + " arg(s)");
		}

		let startType = args[1].eval();
		let lstType = args[2].eval();

		if (!(lstType instanceof ListType)) {
			loc.typeError("expected list for arg 3, got \'" + lstType.toString() + "\'");
		}

		let itemType = lstType.itemType;

		if (itemType == null) {
			itemType = new AnyType();
		}

		let fnType = new FuncType(loc, [startType, itemType], startType);

		fnType.assertEq(args[0].eval());

		return startType;
	}

	static register(registry) {
		// deferred evaluation of ifThenElse branches
		registry.register("fold", `func(fn, z, lst){func(self){self(self, fn, z, lst)}(func(self, fn, z, lst){
			ifThenElse(
				nullList(lst), 
				func(){z}, 
				func(){self(self, fn, fn(z, headList(lst)), tailList(lst))}
			)()
		})}`)
	}

	registerGlobals(registry) {
		Fold.register(registry);
	}

	toUntyped(args) {
		let au = args[0].toUntyped();
		let bu = args[1].toUntyped();
		let cu = args[2].toUntyped();

		let retType = args[1].eval();
		let itemType = args[2].eval().itemType;

		return `fold(func(a, b) {${au}(a, ${fromData("b", itemType)})}, ${bu}, ${cu})`;
	}
}

class Filter extends BuiltinFunc {
	constructor() {
		super("filter");
	}

	evalCall(loc, args) {
		if (args.length != 2) {
			loc.typeError(this.name.toString() + "() expects 2 arg(s), got " + args.length.toString() + " arg(s)");
		}

		let lstType = args[1].eval();

		if  (!lstType instanceof ListType) {
			loc.typeError("expected list for arg 2, got \'" + lstType.toString() + "\'");
		}

		let itemType = lstType.itemType;
		if (itemType == null) {
			itemType = new AnyType();
		}

		let fnType = new FuncType(loc, [itemType], new BoolType());

		fnType.assertEq(args[0].eval());

		return new ListType(loc, lstType.itemType);
	}

	static register(registry) {
		// cant use the standard fold, because that would reverse the list

		// deferred evaluation of ifThenElse branches
		registry.register("filter", `func(fn, lst) {func(self){self(self, fn, lst)}(func(self, fn, lst){
			ifThenElse(
				nullList(lst), 
				func(){mkNilData(())}, 
				func(){ifThenElse(
					fn(headList(lst)), 
					func(){mkCons(headList(lst), self(self, fn, tailList(lst)))}, 
					func(){self(self, fn, tailList(lst))}
				)()}
			)()
		})}`);
	}

	registerGlobals(registry) {
		Filter.register(registry);
	}

	toUntyped(args) {
		let itemType = args[1].eval().itemType;

		return `filter(func(data){${args[0].toUntyped()}(${fromData("data", itemType)})}, ${args[1].toUntyped()})`;
	}
}

// calls error if not found
class Find extends BuiltinFunc {
	constructor() {
		super("find");
	}

	evalCall(loc, args) {
		if (args.length != 2) {
			loc.typeError(this.name.toString() + "() expects 3 arg(s), got " + args.length.toString() + " arg(s)");
		}

		let lstType = args[1].eval();

		if (!(lstType instanceof ListType)) {
			loc.typeError("expected list for arg 2, got \'" + lstType.toString() + "\'");
		}

		let itemType = lstType.itemType;

		if (itemType == null) {
			loc.typeError("can't find in empty list");
		}

		let fnType = new FuncType(loc, [itemType], new BoolType());

		fnType.assertEq(args[0].eval());

		return itemType;
	}

	static register(registry) {
		// deferred evaluation of ifThenElse branches
		registry.register("find", `func(fn, lst){func(self){self(self, fn, lst)}(func(self, fn, lst) {
			ifThenElse(
				nullList(lst), 
				func(){error()}, 
				func(){ifThenElse(
					fn(headList(lst)), 
					func(){headList(lst)}, 
					func(){self(self, fn, tailList(lst))}
				)()}
			)()
		})}`);
	}

	registerGlobals(registry) {
		Find.register(registry);
	}

	toUntyped(args) {
		let au = args[0].toUntyped();
		let bu = args[1].toUntyped();

		return `find(${au}, ${bu})`;
	}
}

class Contains extends BuiltinFunc {
	constructor() {
		super("contains");
	}

	evalCall(loc, args) {
		if (args.length != 2) {
			loc.typeError(this.name.toString() + "() expects 3 arg(s), got " + args.length.toString() + " arg(s)");
		}

		let lstType = args[1].eval();

		if (!(lstType instanceof ListType)) {
			loc.typeError("expected list for arg 2, got \'" + lstType.toString() + "\'");
		}

		let itemType = lstType.itemType;

		if (itemType == null) {
			loc.typeError("can't find in empty list");
		}

		let fnType = new FuncType(loc, [itemType], new BoolType());

		fnType.assertEq(args[0].eval());

		return itemType;
	}

	static register(registry) {
		// deferred evaluation of ifThenElse branches
		registry.register("contains", `func(fn, lst){func(self){self(self, fn, lst)}(func(self, fn, lst) {
			ifThenElse(
				nullList(lst), 
				func(){false}, 
				func(){ifThenElse(
					fn(headList(lst)), 
					func(){true}, 
					func(){self(self, fn, tailList(lst))}
				)()}
			)()
		})}`);
	}

	registerGlobals(registry) {
		Contains.register(registry);
	}

	toUntyped(args) {
		let au = args[0].toUntyped();
		let bu = args[1].toUntyped();

		return `contains(${au}, ${bu})`;
	}
}

class Len extends BuiltinFunc {
	constructor() {
		super("len");
	}

	evalCall(loc, args) {
		if (args.length != 1) {
			loc.typeError(this.name.toString() + "() expects 1 arg(s), got " + args.length.toString() + " arg(s)");
		}

		let argType = args[0].eval();

		if (argType instanceof ByteArrayType) {
			// ok
		} else if (argType instanceof ListType) {
			// ok
		} else {
			loc.typeError("invalid argument type for len(): expected \'ByteArray\' or \'[]Any\', got \'" + argType.toString() + "\'");
		}

		return new IntegerType();
	}

	toUntyped(args) {
		let argType = args[0].eval();
		let au = args[0].toUntyped();

		if (argType instanceof ByteArrayType) {
			return `lengthOfByteString(${au})`;
		} else if (argType instanceof ListType) {
			// deferred evaluation of ifThenElse branches
			return `func(self, lst){self(self, lst)}(func(self, lst){
				ifThenElse(
					nullList(lst), 
					func(){0}, 
					func(){addInteger(self(self, tail(lst)), 1)}
				)()
			}, lst)`;
		}
	}
}

class GetTx extends BuiltinFunc {
	constructor() {
		super("getTx", [new ScriptContextType()], new TxType());
	}

	static register(registry) {
		registry.register("getTx", `func(ctx){${unData("ctx", 0, 0)}}`);
	}

	registerGlobals(registry) {
		GetTx.register(registry);
	}

	toUntyped(args) {
		return `getTx(${args[0].toUntyped()})`;
	}
}

class GetSpendingPurposeTxOutputId extends BuiltinFunc {
	constructor() {
		super("getSpendingPurposeTxOutputId", [new ScriptContextType()], new TxOutputIdType());
	}

	static register(registry) {
		registry.register("getSpendingPurposeTxOutputId", `func(ctx){${unData(unData("ctx", 0, 1), 1, 0)}}`);
	}

	registerGlobals(registry) {
		GetSpendingPurposeTxOutputId.register(registry);
	}

	toUntyped(args) {
		return `getSpendingPurposeTxOutputId(${args[0].toUntyped()})`;
	}
}

class GetTxTimeRange extends BuiltinFunc {
	constructor() {
		super("getTxTimeRange", [new TxType()], new TimeRangeType());
	}

	toUntyped(args) {
		return unData(args[0].toUntyped(), 0, 6);
	}
}

class GetTimeRangeStart extends BuiltinFunc {
	constructor() {
		super("getTimeRangeStart", [new TimeRangeType()], new TimeType());
	}

	toUntyped(args) {
		return unData(unData(unData(args[0].toUntyped(), 0, 0), 0, 0), 1, 0);
	}
}

class GetTxInputs extends BuiltinFunc {
	constructor() {
		super("getTxInputs", [new TxType()], new ListType(Location.dummy(), new TxInputType()));
	}

	static register(registry) {
		registry.register("getTxInputs", `func(tx){unListData(${unData("tx", 0, 0)})}`);
	}

	registerGlobals(registry) {
		GetTxInputs.register(registry);
	}

	toUntyped(args) {
		return `getTxInputs(${args[0].toUntyped()})`;
	}
}

class GetTxOutputs extends BuiltinFunc {
	constructor() {
		super("getTxOutputs", [new TxType()], new ListType(Location.dummy(), new TxOutputType()));
	}

	static register(registry) {
		registry.register("getTxOutputs", `func(tx){unListData(${unData("tx", 0, 1)})}`);
	}

	registerGlobals(registry) {
		GetTxOutputs.register(registry);
	}

	toUntyped(args) {
		return `getTxOutputs(${args[0].toUntyped()})`;
	}
}

class GetTxOutputsAt extends BuiltinFunc {
	constructor() {
		super("getTxOutputsAt", [new TxType()], new ListType(Location.dummy(), new TxOutputType()));
	}

	static register(registry) {
		GetTxOutputs.register(registry);
		EqualsHash.register(registry);
		GetCredentialHash.register(registry);
		GetAddressCredential.register(registry);
		GetTxOutputAddress.register(registry);
		Filter.register(registry);

		registry.register("getTxOutputsAt", "func(tx, h){filter(func(o){equalsHash(h, getCredentialHash(getAddressCredential(getTxOutputAddress(o))))}, getTxOutputs(tx))}");
	}

	registerGlobals(registry) {
		GetTxOutputsAt.register(registry);
	}

	toUntyped(args) {
		return `getTxOutputsAt(${args[0].toUntyped()})`;
	}
}

class GetTxSignatories extends BuiltinFunc {
	constructor() {
		super("getTxSignatories", [new TxType()], new ListType(Location.dummy(), new HashType()));
	}

	static register(registry) {
		registry.register("getTxSignatories", `func(tx){${unData("tx", 0, 7)}}`);
	}

	registerGlobals(registry) {
		GetTxSignatories.register(registry);
	}

	toUntyped(args) {
		return `getTxSignatories(${args[0].toUntyped()})`;
	}
}

class GetTxId extends BuiltinFunc {
	constructor() {
		super("getTxId", [new TxType()], new TxIdType());
	}

	toUntyped(args) {
		return unData(args[0].toUntyped(), 0, 9);
	}
}

class IsTxSignedBy extends BuiltinFunc {
	constructor() {
		// second argument is in fact a PubKeyHash
		super("isTxSignedBy", [new TxType(), new HashType()], new BoolType());
	}

	static register(registry) {
		GetTxSignatories.register(registry);
		EqualsHash.register(registry);
		Contains.register(registry);

		registry.register("isTxSignedBy", "func(tx, h){contains(func(s){equalsHash(s, h)}, getTxSignatories(tx))}");
	}

	registerGlobals(registry) {
		IsTxSignedBy.register(registry);
	}

	toUntyped(args) {
		return `isTxSignedBy(${args[0].toUntyped()}, ${args[1].toUntyped()})`;
	}
}

class GetTxInputOutputId extends BuiltinFunc {
	constructor() {
		super("getTxInputOutputId", [new TxInputType()], new TxOutputIdType());
	}

	static register(registry) {
		registry.register("getTxInputOutputId", `func(i){${unData("i", 0, 0)}}`);
	}

	registerGlobals(registry) {
		GetTxInputOutputId.register(registry);
	}

	toUntyped(args) {
		return `getTxInputOutputId(${args[0].toUntyped()})`;
	}
}

class GetTxInputOutput extends BuiltinFunc {
	constructor() {
		super("getTxInputOutput", [new TxInputType()], new TxOutputType());
	}

	static register(registry) {
		registry.register("getTxInputOutput", `func(i){${unData("i", 0, 1)}}`);
	}

	registerGlobals(registry) {
		GetTxInputOutput.register(registry);
	}

	toUntyped(args) {
		return `getTxInputOutput(${args[0].toUntyped()})`;
	}
}

class GetTxOutputAddress extends BuiltinFunc {
	constructor() {
		super("getTxOutputAddress", [new TxOutputType()], new AddressType());
	}

	static register(registry) {
		registry.register("getTxOutputAddress", `func(o){${unData("o", 0, 0)}}`);
	}

	registerGlobals(registry) {
		GetTxOutputAddress.register(registry);
	}

	toUntyped(args) {
		return `getTxOutputAddress(${args[0].toUntyped()})`;
	}
}

class GetTxOutputValue extends BuiltinFunc {
	constructor() {
		super("getTxOutputValue", [new TxOutputType()], new ValueType());
	}

	static register(registry) {
		registry.register("getTxOutputValue", `func(o){${unData("o", 0, 1)}}`);
	}

	registerGlobals(registry) {
		GetTxOutputValue.register(registry);
	}

	toUntyped(args) {
		return `getTxOutputValue(${args[0].toUntyped()})`;
	}
}

class GetAddressCredential extends BuiltinFunc {
	constructor() {
		super("getAddressCredential", [new AddressType()], new CredentialType());
	}

	static register(registry) {
		registry.register("getAddressCredential", `func(a){${unData("a", 0, 0)}}`);
	}

	registerGlobals(registry) {
		GetAddressCredential.register(registry);
	}

	toUntyped(args) {
		return `getAddressCredential(${args[0].toUntyped()})`;
	}
}

class IsStakedAddress extends BuiltinFunc {
	constructor() {
		super("isStakedAddress", [new AddressType()], new BoolType());
	}

	toUntyped(args) {
		return `equalsInteger(fstPair(unConstrData(${unData(args[0].toUntyped(), 0, 1)})), 0)`;
	}
}

class IsPubKeyCredential extends BuiltinFunc {
	constructor() {
		super("isPubKeyCredential", [new CredentialType()], new BoolType());
	}

	toUntyped(args) {
		return `equalsInteger(fstPair(unConstrData(${args[0].toUntyped()})), 0)`;
	}
}

class IsScriptCredential extends BuiltinFunc {
	constructor() {
		super("isScriptCredential", [new CredentialType()], new BoolType());
	}

	toUntyped(args) {
		return `equalsInteger(fstPair(unConstrData(${args[0].toUntyped()})), 1)`;
	}
}

class GetCredentialHash extends BuiltinFunc {
	constructor() {
		super("getCredentialHash", [new CredentialType()], new HashType());
	}

	static register(registry) {
		registry.register("getCredentialHash", `func(c){headList(sndPair(unConstrData(c)))}`);
	}

	registerGlobals(registry) {
		GetCredentialHash.register(registry);
	}

	toUntyped(args) {
		return `getCredentialHash(${args[0]})`
	}
}

class EqualsTxOutputId extends BuiltinFunc {
	constructor() {
		super("equalsTxOutputId", [new TxOutputIdType(), new TxOutputIdType()], new BoolType());
	}

	static register(registry) {
		// deferred evaluation of ifThenElse branches
		registry.register("equalsTxOutputId", `func(a, b){
			ifThenElse(
				equalsByteString(unBData(${unData(unData("a", 0, 0), 0, 0)}), unBData(${unData(unData("b", 0, 0), 0, 0)})), 
				func(){equalsInteger(unIData(${unData("a", 0, 1)}), unIData(${unData("b", 0, 1)}))}, 
				func(){false}
			)()
		}`);
	}
}

class EqualsHash extends BuiltinFunc {
	constructor() {
		super("equalsHash", [new HashType(), new HashType()], new BoolType());
	}

	static register(registry) {
		registry.register("equalsHash", `func(a, b){equalsByteString(unBData(headList(unListData(a))), unBData(headList(unListData(b))))}`);
	}
}

class GetCurrentTxInput extends BuiltinFunc {
	constructor() {
		super("getCurrentTxInput", [new ScriptContextType()], new TxInputType());
	}
	
	static register(registry) {
		Find.register(registry);
		GetTx.register(registry);
		GetSpendingPurposeTxOutputId.register(registry);
		GetTxInputs.register(registry);
		GetTxInputOutputId.register(registry);
		EqualsTxOutputId.register(registry);

		registry.register("getCurrentTxInput", `func(ctx){func(id){find(func(input){equalsTxOutputId(getTxInputOutputId(input), id)}, getTxInputs(getTx(ctx)))}(getSpendingPurposeTxOutputId(ctx))}`)
	}

	registerGlobals(registry) {
		GetCurrentTxInput.register(registry);
	}

	toUntyped(args) {
		return `getCurrentTxInput(${args[0].toUntyped()})`;
	}
}

class GetOwnHash extends BuiltinFunc {
	constructor() {
		super("getOwnHash", [new ScriptContextType()], new HashType());
	}

	static register(registry) {
		GetCurrentTxInput.register(registry);
		GetTxInputOutput.register(registry);
		GetTxOutputAddress.register(registry);
		GetAddressCredential.register(registry);
		GetCredentialHash.register(registry);

		registry.register("getOwnHash", `func(ctx){
			getCredentialHash(getAddressCredential(getTxOutputAddress(getTxInputOutput(getCurrentTxInput(ctx)))))
		}`);
	}

	registerGlobals(registry) {
		GetOwnHash.register(registry)
	}

	toUntyped(args) {
		return `getOwnHash(${args[0].toUntyped()})`;
	}
}

class GetValueComponent extends BuiltinFunc {
	constructor() {
		super("getValueComponent", [new ValueType(), new AssetClassType()], new IntegerType());
	}

	static register(registry) {
		// deferred evaluation of ifThenElse branches
		registry.register("getValueComponent", `func(value, assetClass){func(map, currency, tokenName){
			func(outer, inner){outer(outer, map)}(func(outer, map) {
				ifThenElse(
					nullList(map), 
					func(){0}, 
					func(){ifThenElse(
						equalsByteString(unBData(fstPair(headList(map))), currency), 
						func(){inner(inner, unMapData(sndPair(headList(map))))}, 
						func(){outer(outer, tailList(map))}
					)()}
				)()
			}, func(inner, map) {
				ifThenElse(
					nullList(map), 
					func(){0}, 
					func(){ifThenElse(
						equalsByteString(unBData(fstPair(headList(map))), tokenName),
						func(){unIData(sndPair(headList(map)))},
						func(){inner(inner, tailList(map))}
					)()}
				)()
			})
		}(unMapData(headList(unListData(value))), unBData(headList(unListData(fstPair(headList(unMapData(assetClass)))))), unBData(headList(unListData(sndPair(headList(unMapData(assetClass)))))))}`)
	}

	registerGlobals(registry) {
		GetValueComponent.register(registry);
	}

	toUntyped(args) {
		return `getValueComponent(${args[0].toUntyped()}, ${args[1].toUntyped()})`;
	}
}

// not exposed to user! returns a list of ByteArray 
class GetValueMapKeys extends BuiltinFunc {
	static register(registry) {
		// deferred evaluation of ifThenElse branches
		registry.register("getValueMapKeys", `func(map){func(self){self(self)}(func(self, map) {
			ifThenElse(
				nullList(map), 
				func(){mkNilData(())}, 
				func(){mkCons(headList(unListData(fstPair(headList(map)))), self(self, tailList(map)))}
			)()
		})}`)
	}
}

// not exposed to user!
class IsInByteArrayList extends BuiltinFunc {
	static register(registry) {
		// deferred evaluation of ifThenElse branches
		registry.register("isInByteArrayList", `func(lst, key){func(self){self(self, lst)}(func(self, lst) {
			ifThenElse(
				nullList(lst), 
				func(){false}, 
				func(){ifThenElse(
					equalsByteString(unBData(headList(lst)), key), 
					func(){true}, 
					func(){self(self, tailList(lst))}
				)()}
			)()
		})}`)
	}
}

// not exposed to user! currencySymbol is just a byteString
class GetValueCurrencyComponents extends BuiltinFunc {
	static register(registry) {
		// deferred evaluation of ifThenElse branches
		registry.register("getValueCurrencyComponents", `func(value, currencySymbol) {
			func(self, map){self(self, map)}(func(self, map){
				ifThenElse(
					nullList(map), 
					func(){mkNilPairData(())},
					func(){ifThenElse(
						equalsByteString(unBData(headList(unListData(fstPair(headList(map))))), currencySymbol), 
						func(){unMapData(sndPair(headList(map)))},
						func(){self(self, tailList(map))}
					)()}
				)()
			}, unMapData(headList(unListData(value))))
		}`)
	}
}

// not exposed to user! O(n^2) algorithm
class MergeValueMapKeys extends BuiltinFunc {
	static register(registry) {
		IsInByteArrayList.register(registry);
		GetValueMapKeys.register(registry);

		// deferred evaluation of ifThenElse branches
		registry.register("mergeValueMapKeys", `func(a, b){
			func(aKeys) {
				func(self){self(self, aKeys, b)}(func(self, keys, map){
					ifThenElse(
						nullList(map), 
						func(){keys}, 
						func(){func(head) {
							ifThenElse(
								isInByteArrayList(aKeys, head), 
								func(){self(keys, tailList(map))},
								func(){mkCons(bData(head), self(keys, tailList(map)))}
							)()
						}(unBData(headList(unListData(fstPair(headList(map))))))}
					)()
				})
			}(getValueMapKeys(a))
		}`);
	}
}

// not exposed to user!
class GetCurrencyMapInteger extends BuiltinFunc {
	static register(registry) {
		// deferred evaluation of ifThenElse branches
		registry.register("getCurrencyMapInteger", `func(map, key) {
			func(self){self(self, map, key)}(func(self, map, key) {
				ifThenElse(
					nullList(map), 
					func(){0}, 
					func(){func(head) {
						ifThenElse(
							equalsByteString(head, key), 
							func(){unIData(sndPair(headList(map)))}, 
							func(){self(self, tailList(map), key)}
						)()
					}(unBData(headList(unListData(fstPair(headList(map))))))}
				)()
			})
		}`)
	}
}

// not exposed to user!
class AddValueCurrencyComponents extends BuiltinFunc {
	static generateCode(binaryFuncName) {
		// deferred evaluation of ifThenElse branches
		return `func(a, b) {
			func(self) {self(self, mergeValueMapKeys(a, b), mkNilPairData(()))} (
				func(self, keys, result) {
					ifThenElse(
						nullList(keys), 
						func(){result}, 
						func(){func(key, tail) {
							func(sum) {
								ifThenElse(
									equalsInteger(sum, 0), 
									func(){tail}, 
									func(){mkCons(mkPairData(listData(mkCons(bData(key), mkNilData(()))), iData(sum)), tail)}
								)()
							}(${binaryFuncName}(getCurrencyMapInteger(a, key), getCurrencyMapInteger(b, key)))
						}(unBData(headList(keys)), self(self, tailList(keys), result))}
					)()
				}
			)
		}`;
	}

	static register(registry) {
		MergeValueMapKeys.register(registry);
		GetCurrencyMapInteger.register(registry);

		registry.register("addValueCurrencyComponents", AddValueCurrencyComponents.generateCode("addInteger"));
	}
}


class AddValues extends BuiltinFunc {
	constructor() {
		super("addValues", [new ValueType(), new ValueType()], new ValueType());
	}

	static generateCode(subName) {
		// deferred evaluation of ifThenElse branches
		return `func(a, b){
			func(a, b){
				func(self) {listData(mkCons(mapData(self(self, mergeValueMapKeys(a, b), mkNilPairData(()))), mkNilData(())))}(
					func(self, keys, result) {
						ifThenElse(
							nullList(keys), 
							func(){result}, 
							func(){func(key){
								func(item, tail){
									ifThenElse(
										nullList(item), 
										func(){tail}, 
										func(){mkCons(mapData(item), tail)}
									)()
								}(${subName}(getValueCurrencyComponents(a, key), getValueCurrencyComponents(b, key)), self(self, tailList(keys), result))
							}(unBData(headList(keys)))}
						)()
					}
				)
			}(unMapData(headList(unListData(a))), unMapData(headList(unListData(b))))
		}`;
	}

	static register(registry) {
		MergeValueMapKeys.register(registry);
		GetValueCurrencyComponents.register(registry);
		AddValueCurrencyComponents.register(registry);

		registry.register("addValues", AddValues.generateCode("addValueCurrencyComponents"));
	}
}

class SubtractValueCurrencyComponents extends BuiltinFunc {
	static register(registry) {
		MergeValueMapKeys.register(registry);
		GetCurrencyMapInteger.register(registry);

		registry.register("subtractValueCurrencyComponents", AddValueCurrencyComponents.generateCode("subtractInteger"));
	}
}

class SubtractValues extends BuiltinFunc {
	constructor() {
		super("subtractValues", [new ValueType(), new ValueType()], new ValueType());
	}

	static register(registry) {
		MergeValueMapKeys.register(registry);
		GetValueCurrencyComponents.register(registry);
		SubtractValueCurrencyComponents.register(registry);

		registry.register("subtractValues", AddValues.generateCode("subtractValueCurrencyComponents"));
	}
}

class Zero extends BuiltinFunc {
	constructor() {
		super("zero", [], new ValueType());
	}

	static register(registry) {
		registry.register("zero", `func() {
			listData(mkCons(mapData(mkNilPairData(())), mkNilData(())))
		}`);
	}

	registerGlobals(registry) {
		Zero.register(registry);
	}

	evalDataCall(loc, args) {
		return new ListData([new MapData([])]);
	}

	toUntyped(args) {
		return`zero()`;
	}
}

class IsZero extends BuiltinFunc {
	constructor() {
		super("isZero", [new ValueType()], new BoolType());
	}

	static register(registry) {
		registry.register("isZero", `func(v) {
			nullList(unMapData(headList(unListData(v))))
		}`)
	}

	registerGlobals(registry) {
		IsZero.register(registry);
	}

	toUntyped(args) {
		return`isZero(${args[0].toUntyped()})`;
	}
}

// if any false is encountered -> return false immediately
class IsStrictlyGeqCurrencyComponents extends BuiltinFunc {
	static generateCode(compOp) {
		// deferred evaluation of ifThenElse branches
		return `func(a, b) {
			func(self) {self(self, mergeValueMapKeys(a, b))} (
				func(self, keys) {
					ifThenElse(
						nullList(keys), 
						func(){true}, 
						func(){func(key) {
							func(i, j) {
								ifThenElse(
									not(${compOp("i", "j")}), 
									func(){false}, 
									func(){self(self, tailList(keys))}
								)()
							}(getCurrencyMapInteger(a, key), getCurrencyMapInteger(b, key))
						}(unBData(headList(keys)))}
					)()
				}
			)
		}`
	}

	static register(registry) {
		Not.register(registry);
		MergeValueMapKeys.register(registry);
		GetCurrencyMapInteger.register(registry);

		registry.register("isStrictlyGeqCurrencyComponents", IsStrictlyGeqCurrencyComponents.generateCode((a, b)=>`not(lessThanInteger(${a}, ${b}))`));
	}
}

// if any false is encountered -> return false immediately
class IsStrictlyGeq extends BuiltinFunc {
	constructor() {
		super("isStrictlyGeq", [new ValueType(), new ValueType()], new BoolType());
	}

	static generateCode(subName) {
		// deferred evaluation of ifThenElse branches
		return `func(a, b) {
			func(a, b) {
				func(self) {self(self, mergeValueMapKeys(a, b))}(
					func(self, keys) {
						ifThenElse(
							nullList(keys), 
							func(){true}, 
							func(){func(key) {
								ifThenElse(
									not(${subName}(getValueCurrencyComponents(a, key), getValueCurrencyComponents(b, key))), 
									func(){false}, 
									func(){self(self, tailList(keys))}
								)()
							}(unBData(headList(keys)))}
						)()
					}
				)
			}(unMapData(headList(unListData(a))), unMapData(headList(unListData(b))))
		}`
	}

	static register(registry) {
		Not.register(registry);
		MergeValueMapKeys.register(registry);
		GetValueCurrencyComponents.register(registry);
		IsStrictlyGeqCurrencyComponents.register(registry);

		registry.register("isStrictlyGeq", IsStrictlyGeq.generateCode("isStrictlyGeqCurrencyComponents"));
	}

	registerGlobals(registry) {
		IsStrictlyGeq.register(registry);
	}

	toUntyped(args) {
		return `isStrictlyGeq(${args[0].toUntyped()}, ${args[1].toUntyped()})`;
	}
}

class IsStrictlyGtCurrencyComponents extends BuiltinFunc {
	static register(registry) {
		Not.register(registry);
		MergeValueMapKeys.register(registry);
		GetCurrencyMapInteger.register(registry);

		registry.register("isStrictlyGtCurrencyComponents", IsStrictlyGeqCurrencyComponents.generateCode((a, b)=>`not(lessThanEqualsInteger(${a}, ${b}))`));
	}
}

class IsStrictlyGt extends BuiltinFunc {
	constructor() {
		super("isStrictlyGt", [new ValueType(), new ValueType()], new BoolType());
	}

	static register(registry) {
		Not.register(registry);
		And.register(registry);
		IsZero.register(registry);
		MergeValueMapKeys.register(registry);
		GetValueCurrencyComponents.register(registry);
		IsStrictlyGtCurrencyComponents.register(registry);

		registry.register("isStrictlyGt", `func(a, b) {and(not(and(isZero(a), isZero(b))), ${IsStrictlyGeq.generateCode("isStrictlyGtCurrencyComponents")})(a, b))}`);
	}

	registerGlobals(registry) {
		IsStrictlyGt.register(registry);
	}

	toUntyped(args) {
		return `isStrictlyGt(${args[0].toUntyped()}, ${args[1].toUntyped()})`;
	}
}

class IsStrictlyLtCurrencyComponents extends BuiltinFunc {
	static register(registry) {
		Not.register(registry);
		MergeValueMapKeys.register(registry);
		GetCurrencyMapInteger.register(registry);

		registry.register("isStrictlyLtCurrencyComponents", IsStrictlyGeqCurrencyComponents.generateCode((a, b)=>`lessThanInteger(${a}, ${b}))`));
	}
}

class IsStrictlyLt extends BuiltinFunc {
	constructor() {
		super("isStrictlyLt", [new ValueType(), new ValueType()], new BoolType());
	}

	static register(registry) {
		Not.register(registry);
		And.register(registry);
		IsZero.register(registry);
		MergeValueMapKeys.register(registry);
		GetValueCurrencyComponents.register(registry);
		IsStrictlyLtCurrencyComponents.register(registry);

		registry.register("isStrictlyLt", `func(a, b) {and(not(and(isZero(a), isZero(b))), ${IsStrictlyGeq.generateCode("isStrictlyLtCurrencyComponents")})(a, b))}`);
	}

	registerGlobals(registry) {
		IsStrictlyLt.register(registry);
	}

	toUntyped(args) {
		return `isStrictlyLt(${args[0].toUntyped()}, ${args[1].toUntyped()})`;
	}
}

class IsStrictlyLeqCurrencyComponents extends BuiltinFunc {
	static register(registry) {
		Not.register(registry);
		MergeValueMapKeys.register(registry);
		GetCurrencyMapInteger.register(registry);

		registry.register("isStrictlyLeqCurrencyComponents", IsStrictlyGeqCurrencyComponents.generateCode((a, b)=>`lessThanEqualsInteger(${a}, ${b}))`));
	}
}

class IsStrictlyLeq extends BuiltinFunc {
	constructor() {
		super("isStrictlyLeq", [new ValueType(), new ValueType()], new BoolType());
	}

	static register(registry) {
		Not.register(registry);
		MergeValueMapKeys.register(registry);
		GetValueCurrencyComponents.register(registry);
		IsStrictlyLeqCurrencyComponents.register(registry);

		registry.register("isStrictlyLeq", IsStrictlyGeq.generateCode("isStrictlyLeqCurrencyComponents"));
	}

	registerGlobals(registry) {
		IsStrictlyLeq.register(registry);
	}

	toUntyped(args) {
		return `isStrictlyLeq(${args[0].toUntyped()}, ${args[1].toUntyped()})`;
	}
}

class IsStrictlyEqCurrencyComponents extends BuiltinFunc {
	static register(registry) {
		Not.register(registry);
		MergeValueMapKeys.register(registry);
		GetCurrencyMapInteger.register(registry);

		registry.register("isStrictlyEqCurrencyComponents", IsStrictlyGeqCurrencyComponents.generateCode((a, b)=>`equalsInteger(${a}, ${b}))`));
	}
}

class IsStrictlyEq extends BuiltinFunc {
	constructor() {
		super("isStrictlyEq", [new ValueType(), new ValueType()], new BoolType());
	}

	static register(registry) {
		Not.register(registry);
		MergeValueMapKeys.register(registry);
		GetValueCurrencyComponents.register(registry);
		IsStrictlyEqCurrencyComponents.register(registry);

		registry.register("isStrictlyEq", IsStrictlyGeq.generateCode("isStrictlyEqCurrencyComponents"));
	}

	registerGlobals(registry) {
		IsStrictlyEq.register(registry);
	}

	toUntyped(args) {
		return `isStrictlyEq(${args[0].toUntyped()}, ${args[1].toUntyped()})`;
	}
}

class ValueLockedBy extends BuiltinFunc {
	constructor() {
		super("valueLockedBy", [new TxType(), new HashType()], new ValueType());
	}

	static register(registry) {
		GetTxOutputsAt.register(registry);
		GetTxOutputValue.register(registry);
		AddValues.register(registry);
		Fold.register(registry);
		Zero.register(registry);

		registry.register("valueLockedBy", `func(tx, h) {
			func(outputs) {
				fold(func(prev, txOutput) {addValues(prev, getTxOutputValue(txOutput))}, zero(), outputs)
			}(getTxOutputsAt(tx, h))
		}`)
	}

	registerGlobals(registry) {
		ValueLockedBy.register(registry);
	}

	toUntyped(args) {
		return `valueLockedBy(${args[0].toUntyped()}, ${args[1].toUntyped()})`;
	}
}

class MakeList extends BuiltinFunc {
	static register(registry, n) {
		let itemNames = [];
		for (let i = 0; i < n; i++) {
			itemNames.push("item" + (i + 1).toString());
		}

		let inner = "mkNilData(())";

		for (let i = n-1; i>= 0; i--) {
			inner = `mkCons(${itemNames[i]}, ${inner})`;
		}

		let body = `func(${itemNames.join(", ")}) {
			${inner}	
		}`;

		registry.register("list" + n.toString(), body);
	}
}

class MakeAssetClass extends BuiltinFunc {
	constructor() {
		super("AssetClass", [new ByteArrayType(), new StringType()], new AssetClassType());
	}

	static register(registry) {
		MakeList.register(registry, 1);

		registry.register("AssetClass", `func(bs, s) {
			listData(list1(mkPairData(listData(list1(bs)), listData(list1(encodeUtf8(s))))))
		}`)
	}

	registerGlobals(registry) {
		MakeAssetClass.register(registry);
	}

	evalDataCall(loc, args) {
		// tokenName will already have been converted to ByteArray by StringLiteral
		return new MapData([new ListData([args[0]]), new ListData([args[1]])]); // 
	}

	toUntyped(args) {
		return `AssetClass(${args[0].toUntyped()}, ${args[1].toUntyped()})`;
	}
}

class MakeValue extends BuiltinFunc {
	constructor() {
		super("Value", [new AssetClassType(), new IntegerType()], new ValueType());
	}

	static register(registry) {
		registry.register("Value", `func(ac, i) {
			func(currencySymbol, tokenName) {
				listData(mkCons(mapData(mkCons(mkPairData(currencySymbol, mapData(mkCons(mkPairData(tokenName, iData(i)), mkNilPairData(())))), mkNilPairData(()))), mkNilData(())))
			}(headList(unListData(sndPair(headList(unMapData(ac))))), headList(unListData(sndPair(headList(unMapData(ac))))))
		}`)
	}

	registerGlobals(registry) {
		MakeValue.register(registry);
	}

	evalDataCall(loc, args) {
		let assetClassData = args[0];
		let currencySymbolData = assetClassData.pairs_[0][0];
		let tokenNameData = assetClassData.pairs_[0][1]

		return new ListData([new MapData([currencySymbolData, new MapData([tokenNameData, new IntegerData(args[1])])])]);
	}

	toUntyped(args) {
		return `Value(${args[0].toUntyped()}, ${args[1].toUntyped()})`;
	}
}

class Lovelace extends BuiltinFunc {
	constructor() {
		super("lovelace", [new IntegerType()], new ValueType());
	}

	static register(registry) {
		MakeValue.register(registry);
		MakeAssetClass.register(registry);

		registry.register("lovelace", `func(i) {
			func(ac) {
				Value(ac, i)
			}(AssetClass(#, ""))
		}`)
	}

	registerGlobals(registry) {
		Lovelace.register(registry);
	}

	evalDataCall(loc, args) {
		return new ListData([new MapData([new ListData([new ByteArrayData([])]), new MapData([new ListData([new ByteArrayData([])]), new IntegerData(args[0])])])]);
	}

	toUntyped(args) {
		return `lovelace(${args[0].toUntyped()})`;
	}
}



////////////////////////////////////////
// Data for schema of Datum and Redeemer
////////////////////////////////////////
class IntegerData {
	constructor(value) {
		this.value_ = value;
	}

	// returns string, not js object, because of unbounded integers 
	toSchemaJSON() {
		return `{"int": ${this.value_.toString()}}`;
	}
}

class ByteArrayData {
	constructor(bytes) {
		this.bytes_ = bytes;
	}

	toHex() {
		return bytesToHex(this.bytes_);
	}

	toSchemaJSON() {
		return `{"bytes": "${this.toHex()}"}`;
	}
}

class ListData {
	constructor(items) {
		this.items_ = items;
	}

	toSchemaJSON() {
		return `{"list":[${this.items_.map(item => item.toSchemaJSON()).join(", ")}]}`;
	}
}

class MapData {
	// pairs is list of lists (inner lists only have 2 items)
	constructor(pairs) {
		this.pairs_ = pairs;
	}

	toSchemaJSON() {
		return `{"map": [${this.pairs_.map(pair => {"{\"k\": " + pair[0].toSchemaJSON() + ", \"v\": " + pair[1].toSchemaJSON() + "}"}).join(", ")}]}`;
	}
}

class ConstrData {
	constructor(index, fields) {
		this.index_ = index;
		this.fields_ = fields;
	}

	toSchemaJSON() {
		return `{"constructors":${this.index_.toString()}, "fields": [${this.fields_.map(f => f.toSchemaJSON()).join(", ")}]}`;
	}
}

////////////////////////
// AST builder functions
////////////////////////
function buildProgram(ts) {
	let decls = []; // function, const, and type declarations

	while (ts.length != 0) {
		let t = ts.shift();

		if (t.isWord("data")) {
			decls.push(buildTypeDecl(t.loc, ts));
		} else if (t.isWord("const")) {
			decls.push(buildConstDecl(t.loc, ts));
		} else if (t.isWord("func")) {
			decls.push(buildFuncDecl(t.loc, ts));
		} else {
			t.syntaxError("invalid statement");
		}
	}

	return new PlutusLightProgram(decls);
}


function buildTypeDecl(start, ts) {
	let name = ts.shift().assertWord();

	assert(ts.length > 0);

	let t = ts[0];

	if (t.isGroup("{")) {
		return buildStructTypeDecl(start, name, ts);
	} else {
		t.syntaxError("type alias not yet supported");
		return buildTypeAliasDecl(start, name, ts);
	}
}

function buildStructTypeDecl(start, name, ts) {
	let struct = new Map();

	buildStructTypeDeclFields(ts.shift().fields, struct);

	return new StructTypeDecl(start, name, struct);
}

function buildStructTypeDeclFields(fields, struct) {
	for (let f of fields) {
		assert(f.length >= 0);

		let name = f.shift().assertWord();

		if (struct.has(name.toString())) {
			name.typeError("duplicate struct member \'" + name.toString() + "\'");
		}

		let type = buildTypeExpr(f);

		// no anonymous struct types allowed yet

		struct.set(name.toString(), type);
	}
}

function buildTypeAliasDecl(start, name, ts) {
	let stack = []; // keep track of blocks

	for (let i = 0; i < ts.length; i++) {
		let t = ts[i];

		if (t.isWord() && !t.isWord("func")) {
			if (t.isWord("type") || t.isWord("const")) {
				throw new Error("syntax error");
			}

			let type = buildTypeExpr(ts.slice(0, i+1));

			ts.splice(0, i+1);

			return new TypeAliasDecl(start, name, type);
		}
	}

	start.syntaxError("invalid syntax");
}

function buildConstDecl(start, ts) {
	let name = ts.shift().assertWord();

	let iEq = Symbol.find(ts, "=");

	assert(iEq != -1);

	let type = buildTypeExpr(ts.slice(0, iEq));
	let rhs = ts[iEq+1];

	// can only be a literal!
	if (!rhs.isLiteral()) {
		rhs.syntaxError("not a literal");
	}

	ts.splice(0, iEq+2);

	return new ConstDecl(start, name, type, rhs);
}

function buildFuncArgs(parens) {
	let args = new Map();

	for (let f of parens.fields) {
		let name = f.shift().assertWord();

		let type = buildTypeExpr(f);

		for (let prev of args) {
			assert(prev[0].toString() != name.toString());
		}

		args.set(name, type);
	}

	return args;
}

function buildCallArgs(parens) {
	let args = [];

	for (let f of parens.fields) {
		let expr = buildValExpr(f);

		args.push(expr);
	}

	return args;
}

function buildBuiltinCall(name, parens) {
	let key = name.toString();

	let obj = PLUTUS_LIGHT_BUILTIN_FUNCS[key];

	let args = buildCallArgs(parens);

	return new BuiltinCall(name, args, obj);
}

function buildFuncDecl(start, ts) {
	let name = ts.shift().assertWord();

	let parens = ts.shift().assertGroup("(");
	let args = buildFuncArgs(parens);

	let iBody = Group.find(ts, "{");

	if (iBody == -1) {

		start.syntaxError("no function body");
	} else if (iBody == 0) {
		start.syntaxError("no return type specified");
	}

	let retType = buildTypeExpr(ts.slice(0, iBody));
	let body = buildFuncBody(ts[iBody]);

	ts.splice(0, iBody+1);

	return new FuncDecl(start, name, args, retType, body);
}

function buildFuncBody(braces) {
	assert(braces.fields.length > 0, "empty function body");
	assert(braces.fields.length == 1);
	assert(braces.fields[0].length > 0, "empty function body");

	let body = buildValExpr(braces.fields[0]);

	return body;
}

function buildTypeExpr(ts) {
	assert(ts.length > 0);

	let t = ts.shift();

	if (t.isGroup("[")) {
		assert(t.fields.length == 0);

		let subType = buildTypeExpr(ts);

		return new ListType(t.loc, subType);
	} else if (t.isWord("func")) {
		return buildFuncType(t.loc, ts);
	} else if (t.isWord()) {
		if (ts.length != 0) {
			ts[0].syntaxError("invalid syntax (hint: are you missing a comma?)");
		}

		return new NamedType(t);
	} else {
		throw new Error("invalid syntax");
	}
}

function buildFuncType(start, ts) {
	let parens = ts.shift().assertGroup("(");

	let argTypes = [];
	for (let f of parens.fields) {
		argTypes.push(buildTypeExpr(f));
	}

	for (let i = 0; i < ts.length; i++) {
		let t = ts[i];

		if (t.isWord() && !t.isWord("func")) {
			let retType = buildTypeExpr(ts.slice(0, i+1));

			if (i+1 != ts.length) {
				ts[i+1].syntaxError("invalid syntax");
			}

			return new FuncType(start, argTypes, retType);
		}
	}

	start.syntaxError("invalid syntax");
}

function buildListLiteral(start, itemTypeTokens, braces) {
	let itemType = buildTypeExpr(itemTypeTokens);

	let items = [];

	for (let f of braces.fields) {
		items.push(buildValExpr(f));
	}

	return new ListLiteral(start, itemType, items);
}

function buildStructLiteral(typeName, braces) {
	let type = buildTypeExpr([typeName]);

	let fields = new Map();

	for (let f of braces.fields) {
		let name = f.shift().assertWord();
		void f.shift().assertSymbol(":");

		let val = buildValExpr(f);

		if (fields.has(name.toString())) {
			name.typeError("duplicate struct member \'" + name.toString() + "\'");
		}

		fields.set(name.toString(), val);
	}

	return new StructLiteral(braces.loc, type, fields);
}

function buildValExpr(ts, prec) {
	assert(ts.length > 0);

	if (prec == undefined) {
		return buildValExpr(ts, 0);
	} else {
		return EXPR_BUILDERS[prec](ts, prec);
	}
}

// returns a function!
function genBinaryOperatorBuilder(symbol) {
	// default behaviour is left-to-right associative
	return function(ts, prec) {
		let iOp = Symbol.findLast(ts, symbol);

		if (iOp != -1) {
			let a = buildValExpr(ts.slice(0, iOp), prec);
			let b = buildValExpr(ts.slice(iOp+1), prec+1);

			return new BinaryOperator(ts[iOp], a, b);
		} else {
			return buildValExpr(ts, prec+1);
		}
	};
}

function genUnaryOperatorBuilder(symbol) {
	// default behaviour is right-to-left associative
	return function(ts, prec) {
		if (ts[0].isSymbol(symbol)) {
			let rhs = buildValExpr(ts.slice(1), prec);

			return new UnaryOperator(ts[0], rhs);
		} else {
			return buildValExpr(ts, prec+1);
		}
	}
}

// lower index is lower precedence
const EXPR_BUILDERS = [
	// 0: lowest precedence is assignment
	function(ts, prec) {
		let iSep = Symbol.find(ts, ";");
	
		if (iSep == -1) {
			return buildValExpr(ts, prec+1);
		} else {
			let iEq = Symbol.find(ts, "=");
	
			assert(iEq != -1);
			assert(iEq < iSep);
	
			let name = ts[0].assertWord();
			
			if (1 == iEq) {
				ts[iEq].syntaxError("expected type expression before \'=\'");
			}

			let type = buildTypeExpr(ts.slice(1, iEq));
	
			let rhs = buildValExpr(ts.slice(iEq+1, iSep), prec+1);

			let lambdaTokens = ts.slice(iSep+1);

			if (lambdaTokens.length == 0) {
				ts[iSep].syntaxError("expected expression after \';\'");
			}

			let lambda = buildValExpr(lambdaTokens, prec);
	
			return new AssignExpr(ts[iEq].loc, name, type, rhs, lambda);
		}
	},
	genBinaryOperatorBuilder('||'), // 1: logical or operator
	genBinaryOperatorBuilder('&&'), // 2: logical and operator
	genBinaryOperatorBuilder(['==', '!=']), // 3: eq or neq
	genBinaryOperatorBuilder(['<', '<=', '>', '>=']), // 4: comparison
	genBinaryOperatorBuilder(['+', '-']), // 5: addition subtraction
	genBinaryOperatorBuilder(['*', '/', '%']), // 6: multiplication division remainder
	genUnaryOperatorBuilder(['!', '+', '-']), // 7: logical not, negate
	// 8: variables or literal values chained with: member access, indexing and calling
	function(ts, prec) {
		let t = ts.shift();

		let expr = null;

		if (t.isWord("func")) {
			let parens = ts[0].assertGroup("(");
			let args = buildFuncArgs(parens);
			let iBody = Group.find(ts, "{");
			assert(iBody != -1);
			let retType = buildTypeExpr(ts.slice(1, iBody));
			let body = buildFuncBody(ts[iBody]);

			ts = ts.slice(iBody+1);

			expr = new FuncExpr(t.loc, args, retType, body);
		} else if (t.isWord("if")) {
			let conditions = [];
			let blocks = [];
			while (true) {
				let parens = ts.shift().assertGroup("(");
				let braces = ts.shift().assertGroup("{");

				if (parens.fields_.length != 1) {
					parens.syntaxError("expected single condition");
				}

				if (braces.fields_.length != 1) {
					braces.syntaxError("expected single expession for branch block");
				}

				conditions.push(buildValExpr(parens.fields_[0]));
				blocks.push(buildValExpr(braces.fields_[0]));

				ts.shift().assertWord("else");

				let next = ts.shift();
				if (next.isGroup("{")) {
					// last group
					let braces = next;
					if (braces.fields_.length != 1) {
						braces.syntaxError("expected single expession for branch block");
					}
					blocks.push(buildValExpr(braces.fields_[0]));
					break;
				} else if (next.isWord("if")) {
					continue;
				} else {
					next.syntaxError("unexpected token");
				}
			}

			return new BranchExpr(t.loc, conditions, blocks);		
		} else if (t.isWord()) {
			if (t.toString() in PLUTUS_LIGHT_BUILTIN_FUNCS) {
				if (ts.length == 0) {
					t.referenceError("illegal reference of built-in function \'" + t.toString() + "\'");
				}

				let parens = ts.shift();
				if (!parens.isGroup("(")) {
					t.referenceError("illegal reference of built-in function \'" + t.toString() + "\'");
				}

				expr = buildBuiltinCall(t, parens);
			} else {
				expr = new Variable(t); // can later be turned into a typeexpr
			}
		} else if (t.isLiteral()) {
			expr = t; // token can simply be reused
		} else if (t.isGroup("(")) {
			assert(t.fields.length == 1);
			expr = new Parens(t.loc, buildValExpr(t.fields[0]));
		} else if (t.isGroup("[")) {
			if (t.fields.length != 0) {
				t.syntaxError("brackets must be empty for list type");
			}

			let itemTypeTokens = [];

			let tType = ts.shift();
			while (tType.isGroup("[") || tType.isWord()) {
				if (tType.isGroup("[")) {
					if (tType.fields.length != 0) {
						tType.syntaxError("brackets must be empty for list type");
					}

					itemTypeTokens.push(tType);
				}

				tType = ts.shift();
			}

			if (!tType.isGroup("{")) {
				tType.syntaxError("invalid literal list");
			}
			
			expr = buildListLiteral(t.loc, itemTypeTokens, tType);
		} else {
			t.syntaxError("invalid syntax");
		}

		// now we can parse the chaining
		while(ts.length > 0) {
			t = ts.shift();

			if (expr == null) {
				t.syntaxError("should be preceded by expression");
			}

			if (t.isGroup("(")) {
				expr = new CallExpr(t.loc, expr, buildCallArgs(t));
			} else if (t.isGroup("[")) {
				assert(t.fields.length == 1);

				expr = new IndexExpr(t.loc, expr, buildValExpr(t.fields[0]));
			} else if (t.isSymbol(".")) {
				let name = ts.shift().assertWord();

				expr = new MemberExpr(t.loc, expr, name);
			} else if (t.isGroup("{")) {
				if (expr == null) {
					t.syntaxError("empty literal struct not allowed");
				} else if (! expr instanceof Variable) {
					t.syntaxError("invalid struct literal");
				}
	
				let name = expr.name_;
	
				expr = buildStructLiteral(name, t);
			} else {
				t.syntaxError("invalid syntax: " + t.toString() + " (" + prec + ")");
			}
		}

		return expr;
	}
];



//////////////
// Untyped AST
//////////////

class UntypedScope {
	constructor(parent, name) {
		this.parent_ = parent;
		this.name_ = name;
	}

	getInternal(name, index) {
		if (this.name_.toString() == name.toString()) {
			return index;
		} else if (this.parent_ == null || this.parent_ == undefined) {
			throw new Error("variable " + name.toString() + " not found on line " + (name.loc_.line_ + 1).toString());
		} else {
			return this.parent_.getInternal(name, index+1);
		}
	}

	get(name) {
		// one-based
		return this.getInternal(name, 1);
	}
}

class UntypedFuncExpr {
	constructor(argNames, body) {
		this.argNames_ = argNames;
		this.body_ = body;
	}

	pretty(indent) {
		let s = "func(" + this.argNames_.map(n => n.toString()).join(", ") + ") {\n" + indent + "  ";
		s += this.body_.pretty(indent + "  ");
		s += "\n" + indent + "}";

		return s;
	}

	link(scope) {
		for (let argName of this.argNames_) {
			scope = new UntypedScope(scope, argName);
		}

		this.body_.link(scope);
	}

	toPlutusCore() {
		let term = this.body_.toPlutusCore();

		if (this.argNames_.length == 0) {
			// must wrap at least once, even if there are no args
			term = new PlutusCoreLambda(term);
		} else {
			for (let i = this.argNames_.length - 1; i >=0; i--) {
				term = new PlutusCoreLambda(term);
			}
		}

		return term;
	}
}

class UntypedErrorCallExpr {
	constructor() {
	}

	pretty(indent) {
		return "error()";
	}

	link(scope) {
	}

	toPlutusCore() {
		return new PlutusCoreError();
	}
}

class UntypedCallExpr {
	constructor(lhs, argExprs) {
		assert(lhs != null);
		this.lhs_ = lhs;
		this.argExprs_ = argExprs;
	}

	pretty(indent) {
		return this.lhs_.pretty(indent) + "(" + this.argExprs_.map(e => e.pretty(indent)).join(", ") + ")";
	}

	isBuiltin() {
		if (this.lhs_ instanceof UntypedVariable) {
			return VERSIONS["1.0.0"].builtins.findIndex(b => b == this.lhs_.name) != -1;
		} else {
			return false;
		}
	}

	link(scope) {
		if (!this.isBuiltin()) {
			this.lhs_.link(scope);
		}

		for (let arg of this.argExprs_) {
			arg.link(scope);
		}
	}

	toPlutusCore() {
		let term;
		if (this.isBuiltin()) {
			term = new PlutusCoreBuiltin(this.lhs_.name);
		} else {
			term = this.lhs_.toPlutusCore();
		}

		if (this.argExprs_.length == 0) {
			// a PlutusCore function application always requires a argument. In the zero-args case this is the unit value
			term = new PlutusCoreApplication(term, new PlutusCoreUnit());
		} else {
			for (let arg of this.argExprs_) {
				term = new PlutusCoreApplication(term, arg.toPlutusCore());
			}
		}

		return term;
	}
}

class UntypedVariable {
	constructor(name) {
		assert(name.toString() != "_");
		this.name_ = name;
		this.index_ = null; // debruijn index
	}

	get name() {
		return this.name_.toString();
	}

	pretty(indent) {
		if (this.index_ == null) { 
			return this.name_.toString();
		} else {
			return this.name_.toString() + "[" + this.index_.toString() + "]";
		}
	}

	link(scope) {
		this.index_ = scope.get(this.name_);
	}

	toPlutusCore() {
		return new PlutusCoreVariable(new PlutusCoreInteger(BigInt(this.index_)));
	}
}

function buildUntypedProgram(ts) {
	let expr = buildUntypedExpr(ts);

	assert(expr instanceof UntypedFuncExpr || expr instanceof UntypedCallExpr);

	let scope = null;
	expr.link(scope);

	return expr;
}

function buildUntypedExpr(ts) {
	let expr = null;

	while (ts.length > 0) {
		let t = ts.shift();

		if (t.isWord("func")) {
			assert(expr == null);

			ts.unshift(t);
			expr = buildUntypedFuncExpr(ts);
		} else if (t.isGroup("(")) {
			if (expr == null) {
				assert(t.fields.length == 0);
				expr = new UnitLiteral();
			} else {
				let args = [];
				for (let f of t.fields) {
					args.push(buildUntypedExpr(f));
				}

				expr = new UntypedCallExpr(expr, args);
			}
		} else if (t instanceof BoolLiteral) {
			assert(expr == null);
			expr = t;
		} else if (t instanceof IntegerLiteral) {
			assert(expr == null);
			expr = t;
		} else if (t instanceof ByteArrayLiteral) {
			assert(expr == null);
			expr = t;
		} else if (t instanceof StringLiteral) {
			assert(expr == null);
			expr = t;
		} else if (t.isWord("error")) {
			assert(expr == null);
			let parens = ts.shift().assertGroup("(");
			assert(parens.fields.length == 0);
			expr = new UntypedErrorCallExpr();
		} else if (t.isWord()) {
			assert(expr == null);
			expr = new UntypedVariable(t);
		} else {
			throw new Error("unhandled untyped token " + t.toString());
		}
	}

	assert(expr != null);
	return expr;
}

function buildUntypedFuncExpr(ts) {
	ts.shift().assertWord("func");

	let parens = ts.shift().assertGroup("(");
	let braces = ts.shift().assertGroup("{");

	let argNames = [];
	for (let f of parens.fields) {
		assert(f.length == 1, "expected single word per arg");
		argNames.push(f[0].assertWord());
	}

	assert(braces.fields.length == 1, "unexpected comma in function body");

	let bodyExpr = buildUntypedExpr(braces.fields[0]);

	return new UntypedFuncExpr(argNames, bodyExpr)
}


/////////////////////////
// Deserializer singleton
/////////////////////////

class Deserializer {
	constructor(bytes, version = "1.0.0") {
		this.view_    = new Uint8Array(bytes);
		this.pos_     = 0; // bit position, not byte position
		this.version_ = version;
	}

	tagWidth(category) {
		assert(category in VERSIONS[this.version_].widths, "unknown tag category " + category.toString());

		return VERSIONS[this.version_].widths[category];
	}

	builtinName(id) {
		let all = VERSIONS[this.version_].builtins;

		assert(id >= 0 && id < all.length, "builtin id " + id.toString() + " out of range");

		return all[id];
	}

	eof() {
		return idiv(this.pos_, 8) >= this.view_.length;
	}

	// n is number of bits to be read
	readBits(n) {
		assert(n <= 8, "reading more than 1 byte");
		assert(this.pos_ + n <= this.view_.length*8, "eof");

		// it is assumed we don't need to be at the byte boundary

		let res =  0;
		let i0  = this.pos_;
		let old = this.pos_;

		for (let i = this.pos_ + 1; i <= this.pos_ + n; i++) {
			if (i%8 == 0) {
				let nPart = i - i0;

				res += imask(this.view_[idiv(i, 8)-1], i0%8, 8) << (n - nPart);

				i0 = i;
			} else if (i == this.pos_ + n) {
				res += imask(this.view_[idiv(i, 8)], i0%8, i%8);
			}
		}

		this.pos_ += n;

		return res;
	}

	moveToByteBoundary(force = false) {
		if (this.pos_%8 != 0) {
			let n = 8 - this.pos_%8;

			let b = this.readBits(n);
		} else if (force) {
			this.readBits(8);
		}
	}

	readByte() {
		return this.readBits(8);
	}

	readLinkedList(elemSize) {
		// Cons and Nil constructors come from Lisp/Haskell
		//  cons 'a' creates a linked list node,
		//  nil      creates an empty linked list
		let nilOrCons = this.readBits(1);

		if (nilOrCons == 0) {
			return [];
		} else {
			return [this.readBits(elemSize)].concat(this.readLinkedList(elemSize));
		}
	}

	dumpRemainingBits() {
		if (!this.eof()) {
			console.log("remaining bytes:");
			for (let first = true, i = idiv(this.pos_, 8); i < this.view_.length; first = false, i++) {
				if (first && this.pos_%8 != 0) {
					console.log(byteToBitString(imask(this.view_[i], this.pos_%8, 8) << 8 - this.pos%7));
				} else {
					console.log(byteToBitString(this.view_[i]));
				}
			}
		} else {
			console.log("eof");
		}
	}

	readTerm() {
		let tag = this.readBits(this.tagWidth("term"));

		switch(tag) {
			case 0:
				return this.readVariable();
			case 1:
				return this.readDelay();
			case 2:
				return this.readLambda();
			case 3:
				return this.readApplication();
			case 4:
				return this.readConstant();
			case 5:
				return this.readForce();
			case 6:
				return new PlutusCoreError();
			case 7:
				return this.readBuiltin();
			default:
				throw new Error("term tag " + tag.toString() + " unhandled");
		}
	}

	readTypeList() {
		return this.readLinkedList(this.tagWidth("constType"));
	}

	readConstant() {
		let typeList = this.readTypeList();

		let res = this.readTypedConstant(typeList);

		assert(typeList.length == 0);

		return res;
	}

	readInteger(signed = false) {
		let bytes = [];

		let b = this.readByte();
		bytes.push(b);

		while (!PlutusCoreInteger.rawByteIsLast(b)) {
			b = this.readByte();
			bytes.push(b);
		}

		// strip the leading bit
		let res = new PlutusCoreInteger(PlutusCoreInteger.bytesToBigInt(bytes.map(b => PlutusCoreInteger.parseRawByte(b))));

		if (signed) {
			res = res.toSigned();
		}

		return res;
	}

	readVariable() {
		let index = this.readInteger()

		return new PlutusCoreVariable(index);
	}

	readLambda() {
		let rhs  = this.readTerm();

		return new PlutusCoreLambda(rhs);
	}

	readApplication() {
		let a = this.readTerm();
		let b = this.readTerm();

		return new PlutusCoreApplication(a, b);
	}

	readDelay() {
		let expr = this.readTerm();

		return new PlutusCoreDelay(expr);
	}

	readForce() {
		let expr = this.readTerm();

		return new PlutusCoreForce(expr);
	}

	readBuiltin() {
		let id = this.readBits(this.tagWidth("builtin"));

		let name = this.builtinName(id);

		return new PlutusCoreBuiltin(name);
	}

	readTypedConstant(typeList) {
		let type = assertDefined(typeList.shift());

		let res;

		assert(typeList.length == 0, "recursive types not yet handled");

		switch(type) {
			case 0: // signed Integer
				res = this.readInteger(true);
				break;
			case 1: // bytearray
				res = this.readByteArray();
				break;
			case 2: // utf8-string
				res = this.readString();
				break;
			case 3:
				res = new PlutusCoreUnit(); // no reading needed
				break;
			case 4: // Bool
				res = new PlutusCoreBool(this.readBits(1) == 1);
				break;
			default:
				throw new Error("unhandled constant type " + type.toString());
		}

		return res;
	}

	readChars() {
		this.moveToByteBoundary(true);

		let bytes = [];

		let nChunk = this.readByte();

		while(nChunk > 0) {
			for (let i = 0; i < nChunk; i++) {
				bytes.push(this.readByte());
			}

			nChunk = this.readByte();
		}

		return bytes;
	}

	readByteArray() {
		let bytes = this.readChars();

		return new PlutusCoreByteArray(bytes);
	}

	readString() {
		let bytes = this.readChars();

		let s = (new TextDecoder()).decode((new Uint8Array(bytes)).buffer);

		return new PlutusCoreString(s);
	}

	finalize() {
		this.moveToByteBoundary(true);
	}
}


//////////////////////////////////////////////////////////////
// Builtin funcs that need to be available during AST building
//////////////////////////////////////////////////////////////

var PLUTUS_LIGHT_BUILTIN_FUNCS;

// fill the PLUTUS_LIGHT_BUILTIN_FUNCS objects now
(function() {
	PLUTUS_LIGHT_BUILTIN_FUNCS = {};

	let add = function(obj) {
		PLUTUS_LIGHT_BUILTIN_FUNCS[obj.name.toString()] = obj;
	}

	add(new Cast("Integer"));
	add(new Cast("ByteArray"));
	add(new Cast("String"));
	add(new MakeTime());
	add(new MakeHash());
	add(new Fold());
	add(new Filter());
	add(new Find());
	add(new Contains());
	add(new Len());
	add(new GetTx());
	add(new GetTxTimeRange());
	add(new GetTxInputs());
	add(new GetTxOutputs());
	add(new GetTxOutputsAt());
	add(new GetTimeRangeStart());
	add(new GetTxSignatories());
	add(new GetTxId());
	add(new IsTxSignedBy());
	add(new GetTxInputOutputId());
	add(new GetTxInputOutput());
	add(new GetTxOutputAddress());
	add(new GetTxOutputValue());
	add(new GetAddressCredential());
	add(new IsStakedAddress());
	add(new IsPubKeyCredential());
	add(new IsScriptCredential());
	add(new GetCredentialHash());
	add(new GetCurrentTxInput());
	add(new GetOwnHash());
	add(new GetValueComponent());
	add(new IsZero());
	add(new Zero());
	add(new IsStrictlyGeq());
	add(new IsStrictlyGt());
	add(new IsStrictlyLeq());
	add(new IsStrictlyLt());
	add(new IsStrictlyEq());
	add(new ValueLockedBy());
	add(new MakeAssetClass());
	add(new MakeValue());
	add(new Lovelace());
}())


////////////////////////////////////////////////
// Functions for compiling Plutus-Light
////////////////////////////////////////////////

export function tokenizePlutusLight(src) {
	let tokenizer = new Tokenizer(src);
	
	return tokenizer.tokenize();
}

// same tokenizer can be used for untyped Plutus-Light
export function tokenizeUntypedPlutusLight(src) {
	let tokenizer = new Tokenizer(src);

	return tokenizer.tokenize();
}

export function parsePlutusLight(src) {
	let ts = tokenizePlutusLight(src);

	let program = buildProgram(ts);

	return program.toString();
}

// returns string
export function prettySource(src) {
	let lines = src.split("\n");

	let nLines = lines.length;
	let nDigits = Math.max(Math.ceil(Math.log10(nLines)), 2);

	for (let i = 0; i < lines.length; i++) {
		lines[i] = String(i+1).padStart(nDigits, '0') + "  " + lines[i];
	}

	return lines.join("\n");
}

export function compilePlutusLightProgram(typedSrc) {
	try {
		let typedTokens = tokenizePlutusLight(typedSrc);

		let program = buildProgram(typedTokens);

		let untypedSrc = program.toUntyped();

		// at this point there shouldn't be any errors
		let untypedTokens = tokenizeUntypedPlutusLight(untypedSrc);

		let untypedProgram = buildUntypedProgram(untypedTokens);

		let plutusCoreProgram = new PlutusCoreProgram(DEFAULT_VERSION.map(v => new PlutusCoreInteger(v)), untypedProgram.toPlutusCore());

		return serializePlutusCoreProgram(plutusCoreProgram);
	} catch (error) {
		if (error instanceof PlutusLightError) {
			// also pretty print the source
			console.log(prettySource(typedSrc) + "\n");

			console.error(error.message);
		} else {
			throw error;
		}
	}
}

// output is object of detailed schema of data (not yet stringified json)
export function compilePlutusLightData(programSrc, dataExprSrc) {
	try {
		let programTokens = tokenizePlutusLight(programSrc);

		program = buildProgram(programTokens);

		let scope = program.linkAndEval();

		// program must make sense before data is compiled

		let dataExprTokens = tokenizePlutusLight(dataExprSrc);

		dataExpr = buildValExpr(dataExprTokens);

		dataExpr.link(scope);

		// dataExpr must also make sense
		dataExpr.eval();

		let data = dataExpr.evalData();

		return data.toSchemaJSON();
	} catch (error) {
		if (error instanceof PlutusLightError) {
			// also pretty print the source
			console.log(prettySource(src) + "\n");

			console.error(error.message);
		} else {
			throw error;
		}
	}
}


///////////////////////////////////////////////////////
// Plutus-Core (de)serialization and analysis functions
///////////////////////////////////////////////////////

// arg 1: list of (unsigned) integers
// return value: a PlutusCoreProgram instance
export function deserializePlutusCoreBytes(bytes) {
	let reader = new Deserializer(bytes, "1.0.0");

	let version = [
		reader.readInteger(),
		reader.readInteger(),
		reader.readInteger(),
	];

	let versionKey = version.map(v => v.toString()).join(".");

	assert(versionKey in VERSIONS, "unsupported plutus-core version: " + versionKey);

	let expr = reader.readTerm();

	reader.finalize();

	return new PlutusCoreProgram(version, expr);
}

export function deserializePlutusCoreCborBytes(cborBytes) {
	// expects a double nested cbor list (so called 'text-envelope' format)
	let data = unwrapPlutusCoreCbor(unwrapPlutusCoreCbor(cborBytes));

	return deserializePlutusCoreBytes(data);
}

export function deserializePlutusCoreCborHexString(hexString) {
	return deserializePlutusCoreCborBytes(hexToBytes(hexString));
}

export function dumpPlutusCoreCborBytes(cborBytes) {
	let data = unwrapPlutusCoreCbor(unwrapPlutusCoreCbor(cborBytes));

	let chars = [];
	for (let b of data) {
		if (b >= 32 && b <= 126) {
			chars.push(String.fromCharCode(b));
		}
	}

	console.log(chars.join(''));
}

export function dumpPlutusCoreCborHexString(hexString) {
	return dumpPlutusCoreCborBytes(hexToBytes(hexString));
}

// returns hex representation of cbor text envelope
export function serializePlutusCoreProgram(program) {
	let bitWriter = new BitWriter();

	program.toFlat(bitWriter);

	let bytes = bitWriter.finalize();

	return bytesToHex(wrapPlutusCoreCbor(wrapPlutusCoreCbor(bytes)));
}

export function unwrapTextEnvelope(hexString) {
	let bytes = hexToBytes(hexString);

	return bytesToHex(unwrapPlutusCoreCbor(unwrapPlutusCoreCbor(bytes)));
}