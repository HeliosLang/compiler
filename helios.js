///////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////    Helios   //////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
//
// Author:      Christian Schmitz
// Email:       cschmitz398@gmail.com
// Website:     github.com/hyperion-bt/helios
// Version:     0.1.0
// Last update: July 2022
// License:     Unlicense
//
// About: Helios is a smart contract DSL for Cardano. 
//     This Javascript library contains functions to compile Helios sources into Plutus-Core.
//     The results can be used by cardano-cli to generate and submit blockchain transactions.
//     
// Dependencies: none
//
// Disclaimer: I made Helios available as FOSS so that the Cardano community can test 
//     it extensively. Please don't use this in production yet, it could still contain 
//     critical bugs. There are no backward compatibility guarantees (yet).
//
// Example usage:
//     > import * as helios from "helios.js";
//     > console.log(helios.compile("validator my_validator; ..."));
//
// Exports: 
//   * debug(bool) -> void
//         set whole library to debug mode          
//   * CompilationStage
//         enum with six values: Preprocess, Tokenize, BuildAST, Untype, PlutusCore and Final
//   * compile(src: string, 
//             config: {verbose: false, templateParameters: {}, stage: CompilationStage}) -> ...
//         different return types depending on config.stage:
//             config.stage==CompilationStage.Preprocess -> string
//             config.stage==CompilationStage.Tokenize   -> list of Tokens
//             config.stage==CompilationStage.BuildAST   -> Program
//             config.stage==CompilationStage.Untype     -> string
//             config.stage==CompilationStage.PlutusCore -> PlutusCoreProgram
//             config.stage==CompilationStage.Final      -> string
//
//     The final string output is a JSON string that can saved as a file and can then 
//     be used by cardano-cli as a '--tx-in-script-file' for transaction building, 
//     and as a '--payment-script-file' for address generation.
//
//
// Note: the Helios library is a single file, doesn't use TypeScript, and must stay 
//     unminified (so that unique git commit hash -> unique IPFS address of 'helios.js').
//
// Overview of internals:
//     1. Constants                         VERSION, DEBUG, debug, 
//                                          PLUTUS_CORE_VERSION_COMPONENTS, PLUTUS_CORE_VERSION, 
//                                          PLUTUS_CORE_TAG_WIDTHS, PLUTUS_CORE_BUILTINS
//
//     2. Utilities                         assert, assertDefined, idiv, ipow2, imask, padZeroes, 
//                                          byteToBitString, hexToBytes, bytesToHex, stringToBytes,
//                                          bytesToString, unwrapCborBytes, wrapCborBytes,
//                                          BitWriter, Source, UserError, Site
//
//     3. Plutus-Core AST objects           PlutusCoreValue, PlutusCoreStack, PlutusCoreAnon, PlutusCoreInt, PlutusCoreByteArray, 
//                                          PlutusCoreString, PlutusCoreBool, PlutusCoreUnit,
//                                          PlutusCorePair, PlutusCoreList, PlutusCoreMap, PlutusCoreData,
//                                          PlutusCoreTerm, PlutusCoreVariable, PlutusCoreDelay, 
//                                          PlutusCoreLambda, PlutusCoreCall, PlutusCoreForce, 
//                                          PlutusCoreError, PlutusCoreBuiltin, PlutusCoreProgram
//
//     4. Plutus-Core data objects          IntData, ByteArrayData, ListData, MapData, ConstrData
//
//     5. Token objects                     Token, Word, Symbol, Group, 
//                                          PrimitiveLiteral, IntLiteral, BoolLiteral, 
//                                          StringLiteral, ByteArrayLiteral, UnitLiteral
//
//     6. Tokenization                      Tokenizer, tokenize, tokenizeUntyped
//
//     7. Type evaluation objects           GeneralizedValue, Type, AnyType, DataType, BuiltinType, 
//                                          UserType, FuncType, Value, DataValue, FuncValue, 
//                                          TopFuncValue
//
//     8. Scopes                            GlobalScope, Scope, TopScope
//
//     9. AST expression objects            Expr, TypeExpr, TypeRefExpr, TypePathExpr, 
//                                          ListTypeExpr, MapTypeExpr, OptionTypeExpr, 
//                                          FuncTypeExpr, ValueExpr, AssignExpr, PrintExpr, 
//                                          PrimitiveLiteralExpr, StructLiteralField, 
//                                          StructLiteralExpr, ListLiteralExpr, NameTypePair, 
//                                          FuncArg, FuncLiteralExpr, ValueRefExpr, ValuePathExpr, 
//                                          UnaryExpr, BinaryExpr, ParensExpr, 
//                                          CallExpr, MemberExpr, IfElseExpr, 
//                                          SwitchCase, SwitchDefault, SwitchExpr
//
//    10. AST statement objects             Statement, NamedStatement, ConstStatement, DataField, 
//                                          DataDefinition, StructStatement, FuncStatement, 
//                                          EnumMember, EnumStatement, ImplRegistry, ImplStatement,
//                                          ScriptPurpose, Program
//
//    11. AST build functions               buildProgram, buildScriptPurpose, buildConstStatement, 
//                                          buildStructStatement, buildDataFields,
//                                          buildFuncStatement, buildFuncLiteralExpr, buildFuncArgs,
//                                          buildEnumStatement, buildEnumMember, 
//                                          buildImplStatement, buildImplMembers, buildTypeExpr, 
//                                          buildListTypeExpr, buildMapTypeExpr, 
//                                          buildOptionTypeExpr, buildFuncTypeExpr, 
//                                          buildTypePathExpr, buildTypeRefExpr, 
//                                          buildValueExpr, buildMaybeAssignOrPrintExpr, 
//                                          makeBinaryExprBuilder, makeUnaryExprBuilder, 
//                                          buildChainedValueExpr, buildChainStartValueExpr, 
//                                          buildCallArgs, buildIfElseExpr, buildSwitchExpr, 
//                                          buildSwitchCase, buildSwitchDefault, 
//                                          buildListLiteralExpr, buildStructLiteralExpr,
//                                          buildStructLiteralField, buildValuePathExpr
//
//    12. Builtin types                     IntType, BoolType, StringType, ByteArrayType, ListType,
//                                          MapType, OptionType, OptionSomeType, OptionNoneType,
//                                          HashType, PubKeyHashType, ValidatorHashType, 
//                                          MintinPolicyHashType, DatumHashType, ScriptContextType,
//                                          TxType, TxIdType, TxInputType, TxOutputType, 
//                                          TxOutputIdType, AddressType, CredentialType, 
//                                          CredentialPubKeyType, CredentialValidatorType, 
//                                          StakingCredentialType, TimeType, DurationType,
//                                          TimeRangeType, AssetClassType, MoneyValueType
//
//    13. Builtin low-level functions       RawFunc, makeRawFunctions, wrapWithRawFunctions
//
//    14. Untyped AST objects               UntypedScope, UntypedFuncExpr, UntypedErrorCallExpr,
//                                          UntypedCallExpr, UntypedVariable
//
//    15. Untyped AST build functions       buildUntypedProgram, buildUntypedExpr, 
//                                          buildUntypedFuncExpr
//
//    16. Compilation                       preprocess, CompilationStage, compile
//     
//    17. Plutus-Core deserialization       PlutusCoreDeserializer, deserializePlutusCore
//
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////
// Section 1: Global constants and variables
////////////////////////////////////////////

const VERSION = "0.2";
var DEBUG = false;
export function debug(b) {DEBUG = b};
const TAB = "    ";

const PLUTUS_CORE_VERSION_COMPONENTS = [1n, 0n, 0n];
const PLUTUS_CORE_VERSION = PLUTUS_CORE_VERSION_COMPONENTS.map(c => c.toString()).join(".");
const PLUTUS_CORE_TAG_WIDTHS = {
	term:      4,
	type:      3,
	constType: 4, 
	builtin:   7,
	constant:  4,
	kind:      1,
};
const PLUTUS_CORE_BUILTINS = (function() {
	function builtinInfo(name, forceCount) {
		// builtins might need be wrapped in `force` a number of times if they are not fully typed
		return {name: name, forceCount: forceCount};
	}

	return [
		builtinInfo("addInteger", 0), // 0
		builtinInfo("subtractInteger", 0),
		builtinInfo("multiplyInteger", 0),
		builtinInfo("divideInteger", 0),
		builtinInfo("quotientInteger", 0),
		builtinInfo("remainderInteger", 0),
		builtinInfo("modInteger", 0),
		builtinInfo("equalsInteger", 0),
		builtinInfo("lessThanInteger", 0),
		builtinInfo("lessThanEqualsInteger", 0),
		builtinInfo("appendByteString", 0), // 10
		builtinInfo("consByteString", 0),
		builtinInfo("sliceByteString", 0),
		builtinInfo("lengthOfByteString", 0),
		builtinInfo("indexByteString", 0),
		builtinInfo("equalsByteString", 0),
		builtinInfo("lessThanByteString", 0),
		builtinInfo("lessThanEqualsByteString", 0),
		builtinInfo("sha2_256", 0),
		builtinInfo("sha3_256", 0),
		builtinInfo("blake2b_256", 0), // 20
		builtinInfo("verifySignature", 1),
		builtinInfo("appendString", 0),
		builtinInfo("equalsString", 0),
		builtinInfo("encodeUtf8", 0),
		builtinInfo("decodeUtf8", 0),
		builtinInfo("ifThenElse", 1),
		builtinInfo("chooseUnit", 1),
		builtinInfo("trace", 1),
		builtinInfo("fstPair", 2),
		builtinInfo("sndPair", 2), // 30
		builtinInfo("chooseList", 1),
		builtinInfo("mkCons", 1), // got error 'A builtin expected a term argument, but something else was received. Caused by: (force (force (builtin mkCons)))' when forceCount was 2, so set forceCount to 1?
		builtinInfo("headList", 1),
		builtinInfo("tailList", 1),
		builtinInfo("nullList", 1),
		builtinInfo("chooseData", 0),
		builtinInfo("constrData", 0),
		builtinInfo("mapData", 0),
		builtinInfo("listData", 0),
		builtinInfo("iData", 0), // 40
		builtinInfo("bData", 0),
		builtinInfo("unConstrData", 0),
		builtinInfo("unMapData", 0),
		builtinInfo("unListData", 0),
		builtinInfo("unIData", 0),
		builtinInfo("unBData", 0),
		builtinInfo("equalsData", 0),
		builtinInfo("mkPairData", 0),
		builtinInfo("mkNilData", 0),
		builtinInfo("mkNilPairData", 0), // 50
		builtinInfo("serialiseData", 0),
		builtinInfo("verifyEcdsaSecp256k1Signature", 1),
		builtinInfo("verifySchnorrSecp256k1Signature", 1),
	];
})();


///////////////////////
// Section 2: utilities
///////////////////////

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

// integer division
// assumes a and b are whole numbers
function idiv(a, b) {
	return Math.floor(a/b);
	// alternatively: (a - a%b)/b
}

// 2^p for bigints
function ipow2(p) {
	return (p <= 0n) ? 1n : 2n<<(p-1n);
}

function imask(b, i0, i1) {
	assert(i0 < i1);

	const mask_bits = [
		0b11111111,
		0b01111111,
		0b00111111,
		0b00011111,
		0b00001111,
		0b00000111,
		0b00000011,
		0b00000001,
	];
	// mask with 0 from 

	return (b & mask_bits[i0]) >> (8 - i1);
}

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

function stringToBytes(str) {
	return Array.from((new TextEncoder()).encode(str));
}

function bytesToString(bytes) {
	return (new TextDecoder()).decode((new Uint8Array(bytes)).buffer);
}

// Very rudimentary cbor parser which unwraps the cbor text envelopes of the example scripts 
// in github.com/chris-moreton/plutus-scripts and github.com/input-output-hk/plutus-apps
// This function unwraps one level, so must be called twice 
//  (for some reason the text envelopes is cbor wrapped in cbor)
function unwrapCborBytes(bytes) { 
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

// roughly the inverse of unwrapCborBytes
function wrapCborBytes(bytes) {
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

// turn a string of zeroes and ones into a list of bytes
// finalization pads the bits using '0*1` if not yet aligned with the byte boundary
class BitWriter {
	constructor() {
		this.parts_ = [];
		this.n_ = 0;
	}

	write(bitChars) {
		for (let c of bitChars) {
			if (c != '0' && c != '1') {
				throw new Error("bad bit char");
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

class Source {
	constructor(raw) {
		this.raw_ = assertDefined(raw);
	}

	get raw() {
		return this.raw_;
	}

	// should work for utf-8 runes as well
	getChar(pos) {
		return this.raw_[pos];
	}

	get length() {
		return this.raw_.length;
	}

	posToLine(pos) {
		let line = 0;
		for (let i = 0; i < pos; i++) {
			if (this.raw_[i] == '\n') {
				line += 1;
			}
		}

		return line;
	}

	// returns [col, line]
	posToColAndLine(pos) {
		let col = 0;
		let line = 0;
		for (let i = 0; i < pos; i++) {
			if (this.raw_[i] == '\n') {
				col = 0;
				line += 1;
			} else {
				col += 1;
			}
		}

		return [col, line];
	}

	// add line-numbers, returns string
	pretty() {
		let lines = this.raw_.split("\n");

		let nLines = lines.length;
		let nDigits = Math.max(Math.ceil(Math.log10(nLines)), 2);

		for (let i = 0; i < lines.length; i++) {
			lines[i] = String(i+1).padStart(nDigits, '0') + "  " + lines[i];
		}

		return lines.join("\n");
	}
}

export class UserError extends Error {
	// line arg here is 0-based index
	constructor(type, src, pos, info = "") {
		let line = src.posToLine(pos);

		let msg = `${type} on line ${line+1}`;
		if (info != "") {
			msg += `: ${info}`;
		}

		super(msg);
		this.pos_ = pos;
		this.src_ = src;
	}

	static syntaxError(src, pos, info = "") {
		return new UserError("SyntaxError", src, pos, info);
	}

	static typeError(src, pos, info = "") {
		return new UserError("TypeError", src, pos, info);
	}

	static referenceError(src, pos, info = "") {
		return new UserError("ReferenceError", src, pos, info);
	}

	static runtimeError(src, pos, info = "") {
		return new UserError("RuntimeError", src, pos, info);
	}

	// returns a pair [col, line]
	getFilePos() {
		return this.src_.posToColAndLine(this.pos_);
	}

	dump(verbose = false) {
		if (verbose) {
			console.error(this.src_.pretty());
		}

		console.error("\n" + this.message);
	}

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

// each token has a site, which encapsulates a position in a Source
class Site {
	constructor(src, pos) {
		this.src_ = src;
		this.pos_ = pos;
	}

	static dummy() {
		return new Site(new Source(""), 0);
	}

	get line() {
		return this.src_.posToLine(this.pos_);
	}

	get src() {
		return this.src_;
	}

	syntaxError(info = "") {
		throw UserError.syntaxError(this.src_, this.pos_, info);
	}

	typeError(info = "") {
		throw UserError.typeError(this.src_, this.pos_, info);
	}

	referenceError(info = "") {
		throw UserError.referenceError(this.src_, this.pos_, info);
	}

	runtimeError(info = "") {
		throw UserError.runtimeError(this.src_, this.pos_, info);
	}

	getFilePos() {
		return this.src_.posToColAndLine(this.pos_);
	}
}


/////////////////////////////
// Section 3: Plutus-Core AST
/////////////////////////////

// a PlutusCoreValue is not the same as a term or a constant!
class PlutusCoreValue {
	constructor(site) {
		assert(site != undefined && (site instanceof Site));
		this.site_ = site;
	}

	copy(newSite) {
		throw new Error("not implemented");
	}

	get site() {
		return this.site_;
	}

	async call(rte, site, value) {
		site.typeError("not a plutus-core function");
	}

	async eval(rte) {
		return this;
	}

	get int() {
		this.site.typeError("not an int");
	}

	get bytes() {
		this.site.typeError("not a bytearray");
	}

	get string() {
		this.site.typeError("not a string");
	}

	get bool() {
		this.site.typeError("not a bool");
	}

	get first() {
		this.site.typeError("not a pair");
	}

	get second() {
		this.site.typeError("not a pair");
	}

	isStrictList() {
		return false;
	}

	get strictList() {
		this.site.typeError("not a list");
	}

	get list() {
		this.site.typeError("not a list/map");
	}

	get map() {
		this.site.typeError("not a map");
	}

	get data() {
		this.site.typeError("not data");
	}

	toString() {
		throw new Error("toString not implemented");
	}
}

// PlutusCore Runtime Environment used for controlling an evaluation (eg. by a debugger)
class PlutusCoreRTE {
	constructor(callbacks) {
		this.callbacks_ = callbacks;
	}

	get(i) {
		throw new Error("variable index out of range");
	}

	push(value, valueName = null) {
		return new PlutusCoreStack(this, value, valueName);
	}

	print(msg) {
		if (this.callbacks_.onPrint != undefined) {
			this.callbacks_.onPrint(msg);
		}
	}

	// `stack` here is actually a lists of pairs, not a regular stack
	async notify(site, rawStack) {
		if (this.callbacks_.onNotify != undefined) {
			await this.callbacks_.onNotify(site, rawStack);
		}
	}

	toList() {
		return [];
	}
}

class PlutusCoreStack {
	// valueName is optional
	constructor(parent, value = null, valueName = null) {
		this.parent_ = parent;
		this.value_ = value;
		this.valueName_ = valueName;
	}

	get(i) {
		i -= 1;

		if (i == 0) {
			assert(this.value_ != null, "plutus-core stack value not set");
			return this.value_;
		} else {
			assert(i > 0);
			assert(this.parent_ != null, "variable index out of range");
			return this.parent_.get(i);
		}
	}

	push(value, valueName = null) {
		return new PlutusCoreStack(this, value, valueName);
	}

	print(msg) {
		this.parent_.print(msg);
	}

	async notify(site, rawStack) {
		await this.parent_.notify(site, rawStack);
	}

	toList() {
		let lst = this.parent_.toList();
		lst.push([this.valueName_, this.value_]);
		return lst;
	}
}

class PlutusCoreAnon extends PlutusCoreValue {
	// fn is a callback
	// args can be list of argNames (for debugging), or the number of args
	constructor(site, rte, args, fn, argCount = 0, callSite = null) {
		super(site);
		assert(typeof argCount == "number");

		let nArgs = args;
		if (((typeof args) != 'number')) {
			assert(args instanceof Array);
			nArgs = args.length;
		} else {
			args = null;
		}
		assert(nArgs >= 1);

		this.rte_ = rte;
		this.nArgs_ = nArgs;
		this.args_  = args;
		this.argCount_ = argCount;
		this.fn_ = fn; // not async!
		this.callSite_ = callSite;
	}

	copy(newSite) {
		return new PlutusCoreAnon(newSite, this.rte_, this.args_ != null ? this.args_ : this.nArgs_, this.fn_, this.argCount_, this.callSite_);
	}

	async call(rte, site, value) {
		assert(site != undefined && site instanceof Site);
		let subStack = this.rte_.push(value, this.args_ != null ? this.args_[this.argCount_] : null); // this is the only place where the stack grows
		let argCount = this.argCount_ + 1;
		let callSite = this.callSite_ != null ? this.callSite_ : site;
		
		if (argCount == this.nArgs_) {
			let args = [];

			let rawStack = rte.toList(); // use the RTE of the callsite

			for (let i = this.nArgs_; i >= 1; i--) {
				let argValue = subStack.get(i);
				args.push(argValue);
				rawStack.push([`__arg${this.nArgs_ - i}`, argValue]);
			}
			
			// notify the RTE of the new live stack (list of pairs instead of PlutusCoreStack), and await permission to continue
			await this.rte_.notify(callSite, rawStack);

			let result = this.fn_(callSite, subStack, ...args);
			if (result instanceof Promise) {
				result = await result;
			}

			return result;
		} else {
			assert(this.nArgs_ > 1);

			return new PlutusCoreAnon(callSite, subStack, this.args_ != null ? this.args_ : this.nArgs_, this.fn_, argCount, callSite);			
		}
	}

	toString() {
		return "fn";
	}
}

class PlutusCoreInt extends PlutusCoreValue {
	// value is BigInt, which is supposed to be arbitrary precision
	constructor(site, value, signed = true) {
		super(site);
		assert(typeof value == 'bigint');
		this.value_  = value;
		this.signed_ = signed;
	}

	copy(newSite) {
		return new PlutusCoreInt(newSite, this.value_, this.signed_);
	}

	get value() {
		return this.value_;
	}

	get int() {
		if (!this.signed_) {
			throw new Error("can't use unsigned int in eval");
		}

		return this.value;
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
			value = value + BigInt(b)*ipow2(BigInt(i)*7n);
		}

		return value;
	}

	// apply zigzag encoding
	toUnsigned() {
		if (this.signed_) {
			if (this.value_ < 0n) {
				return new PlutusCoreInt(1n - this.value_*2n, false);
			} else {
				return new PlutusCoreInt(this.value_*2n, false);
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
				return new PlutusCoreInt(this.value_/2n, true);
			} else {
				return new PlutusCoreInt(-(this.value_+1n)/2n, true);
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

	assertInt() {
		if (!this.signed_) {
			throw new Error("can't use unsigned int in eval");
		}
		return this;
	}
}

class PlutusCoreByteArray extends PlutusCoreValue {
	constructor(site, bytes) {
		super(site);
		assert(bytes != undefined);
		this.bytes_ = bytes;
		for (let b of this.bytes_) {
			assert(typeof b == 'number');
		}
	}

	copy(newSite) {
		return new PlutusCoreByteArray(newSite, this.bytes_);
	}

	get bytes() {
		return this.bytes_.slice();
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

class PlutusCoreString extends PlutusCoreValue {
	constructor(site, value) {
		super(site);
		this.value_ = value;
	}

	copy(newSite) {
		return new PlutusCoreString(newSite, this.value_);
	}

	get value() {
		return this.value_;
	}

	get string() {
		return this.value;
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

class PlutusCoreBool extends PlutusCoreValue {
	constructor(site, value) {
		super(site);
		this.value_ = value;
	}

	copy(newSite) {
		return new PlutusCoreBool(newSite, this.value_);
	}

	get value() {
		return this.value_;
	}

	get bool() {
		return this.value_;
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

class PlutusCoreUnit extends PlutusCoreValue {
	constructor(site) {
		super(site);
	}

	copy(newSite) {
		return new PlutusCoreUnit(newSite);
	}

	toString() {
		return "()";
	}

	toFlat(bitWriter) {
		bitWriter.write('0100');
		bitWriter.write('100110'); // PlutusCore list that contains single '0011' entry
	}

	assertUnit() {
		return this;
	}
}

class PlutusCorePair extends PlutusCoreValue {
	constructor(site, first, second) {
		super(site);
		this.first_ = first;
		this.second_ = second;
	}

	copy(newSite) {
		return new PlutusCorePair(newSite, this.first_, this.second_);
	}

	toString() {
		return `(${this.first_.toString()}, ${this.second_.toString()})`;
	}

	get first() {
		return this.first_;
	}

	get second() {
		return this.second_;
	}
}

// needed for eval
class PlutusCoreList extends PlutusCoreValue {
	constructor(site, items) {
		super(site);
		this.items_ = items;
	}

	copy(newSite) {
		return new PlutusCoreList(newSite, this.items_.slice());
	}

	get list() {
		return this.items_.slice();
	}

	isStrictList() {
		return true;
	}

	get strictList() {
		return this.list;
	}

	toString() {
		return `[${this.items_.map(item => item.toString()).join(", ")}]`;
	}
}

// needed for eval
class PlutusCoreMap extends PlutusCoreValue {
	constructor(site, pairs) {
		super(site);
		this.pairs_ = pairs;
	}

	copy(newSite) {
		return new PlutusCoreMap(newSite, this.pairs_.slice());
	}

	get map() {
		return this.pairs_.slice();
	}

	get list() {
		return this.map;
	}

	toString() {
		return `[${this.pairs_.map(([fst, snd]) => `[${fst.toString()}, ${snd.toString()}]`).join(", ")}]`;
	}
}

// needed for eval
class PlutusCoreData extends PlutusCoreValue {
	constructor(site, data) {
		super(site);
		this.data_ = assertDefined(data);
		assert(!(data instanceof PlutusCoreData));
	}

	copy(newSite) {
		return new PlutusCoreData(newSite, this.data_);
	}

	get data() {
		return this.data_;
	}

	toString() {
		return `data(${this.data_.toString()})`;
	}
}

class PlutusCoreTerm {
	constructor(site, type) {
		assert(site != undefined && site instanceof Site);
		this.type_ = type;
		this.site_ = site;
	}

	get site() {
		return this.site_;
	}

	toString() {
		return "(Term " + this.type_.toString() + ")";
	}
}

class PlutusCoreVariable extends PlutusCoreTerm {
	// TODO: generate globally unique names from the DeBruijn indices
	constructor(site, index) {
		super(site, 0);
		this.index_ = index;
	}

	toString() {
		return "x" + this.index_.toString();
	}

	toFlat(bitWriter) {
		bitWriter.write('0000');
		this.index_.toFlat(bitWriter);
	}

	async eval(rte) {
		return rte.get(this.index_);
	}
}

class PlutusCoreDelay extends PlutusCoreTerm {
	constructor(site, expr) {
		super(site, 1);
		this.expr_ = expr;
	}

	toString() {
		return "(delay " + this.expr_.toString() + ")";
	}

	toFlat(bitWriter) {
		bitWriter.write('0001');
		this.expr_.toFlat(bitWriter);
	}

	async eval(rte) {
		return await this.expr_.eval(rte);
	}
}

class PlutusCoreLambda extends PlutusCoreTerm {
	constructor(site, rhs, argName = null) {
		super(site, 2);
		this.rhs_  = rhs;
		this.argName_ = argName;
	}

	toString() {
		return `(\u039b${this.argName_ != null ? " " + this.argName_ + " ->" : ""} ${this.rhs_.toString()})`;
	}

	toFlat(bitWriter) {
		bitWriter.write('0010');
		this.rhs_.toFlat(bitWriter);
	}

	async eval(rte) {
		return new PlutusCoreAnon(this.site, rte, this.argName_ != null ? [this.argName_] : 1, (callSite, subStack) => {
			return this.rhs_.eval(subStack);
		});
	}
}

// aka function application
class PlutusCoreCall extends PlutusCoreTerm {
	constructor(site, a, b) {
		super(site, 3);
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

	async eval(rte) {
		let fn = await this.a_.eval(rte);
		let arg = await this.b_.eval(rte);

		return await fn.call(rte, this.site, arg);
	}
}

class PlutusCoreForce extends PlutusCoreTerm {
	constructor(site, expr) {
		super(site, 5);
		this.expr_ = expr;
	}

	toString() {
		return "(force " + this.expr_.toString() + ")";
	}

	toFlat(bitWriter) {
		bitWriter.write('0101');
		this.expr_.toFlat(bitWriter);
	}

	async eval(rte) {
		return await this.expr_.eval(rte);
	}
}

class PlutusCoreError extends PlutusCoreTerm {
	constructor(site) {
		super(site, 6);
	}

	toString() {
		return "(error)";
	}

	toFlat(bitWriter) {
		bitWriter.write('0110');
	}

	async eval(rte) {
		this.site.runtimeError("explicit error call");
	}
}

class PlutusCoreBuiltin extends PlutusCoreTerm {
	constructor(site, name) {
		super(site, 7);
		this.name_ = name; // unknown builtin stays an integer
	}

	isKnown() {
		return typeof this.name_ == "string";
	}

	toString() {
		if (this.isKnown()) {
			return `(builtin ${this.name_})`;
		} else {
			return `(builtin unknown${this.name_.toString()})`;
		}
	}

	toFlat(bitWriter) {
		bitWriter.write('0111');

		let i;
		if (this.isKnown()) {
			i = PLUTUS_CORE_BUILTINS.findIndex(info => info.name == this.name_);
		} else {
			i = this.name_;
		}

		let bitString = padZeroes(i.toString(2), 7);
		
		bitWriter.write(bitString);
	}

	eval(rte) {
		switch(this.name_) {
			case "addInteger":
				return new PlutusCoreAnon(this.site, rte, ["a", "b"], (callSite, _, a, b) => {
					return new PlutusCoreInt(callSite, a.int + b.int);
				});
			case "subtractInteger":
				return new PlutusCoreAnon(this.site, rte, ["a", "b"], (callSite, _, a, b) => {
					return new PlutusCoreInt(callSite, a.int - b.int);
				});
			case "multiplyInteger":
				return new PlutusCoreAnon(this.site, rte, ["a", "b"], (callSite, _, a, b) => {
					return new PlutusCoreInt(callSite, a.int * b.int);
				});
			case "divideInteger":
				return new PlutusCoreAnon(this.site, rte, ["a", "b"], (callSite, _, a, b) => {
					return new PlutusCoreInt(callSite, a.int / b.int);
				});
			case "modInteger":
				return new PlutusCoreAnon(this.site, rte, ["a", "b"], (callSite, _, a, b) => {
					return new PlutusCoreInt(callSite, a.int % b.int);
				});
			case "equalsInteger":
				return new PlutusCoreAnon(this.site, rte, ["a", "b"], (callSite, _, a, b) => {
					return new PlutusCoreBool(callSite, a.int == b.int);
				});
			case "lessThanInteger":
				return new PlutusCoreAnon(this.site, rte, ["a", "b"], (callSite, _, a, b) => {
					return new PlutusCoreBool(callSite, a.int < b.int);
				});
			case "appendByteString":
				return new PlutusCoreAnon(this.site, rte, 2, (callSite, _, a, b) => {
					return new PlutusCoreByteArray(callSite, a.bytes.concat(b.bytes));
				});
			case "consByteString":
				return new PlutusCoreAnon(this.site, rte, 2, (callSite, _, a, b) => {
					let bytes = b.bytes;
					bytes.unshift(Number(a.int % 256n));
					return new PlutusCoreByteArray(callSite, bytes);
				});
			case "sliceByteString":
				return new PlutusCoreAnon(this.site, rte, 3, (callSite, _, a, b, c) => {
					let start = Number(a.int);
					let n = Number(b.int);
					let bytes = c.bytes;
					if (start < 0) {
						start = 0;
					}

					if (start + n > bytes.length) {
						n = bytes.length - start;
					}

					if (n < 0) {
						n = 0;
					}

					return new PlutusCoreBytes(callSite, bytes.slice(start, start + n));
				});
			case "lengthOfByteString":
				return new PlutusCoreAnon(this.site, rte, ["bytes"], (callSite, _, a) => {
					return new PlutusCoreInt(callSite, BigInt(a.bytes.length));
				});
			case "indexByteString":
				return new PlutusCoreAnon(this.site, rte, ["bytes", "i"], (callSite, _, a, b) => {
					let bytes = a.bytes;
					let i = b.int;
					if (i < 0 || i >= bytes.length) {
						throw new Error("index out of range");
					}

					return new PlutusCoreInt(callSite, bytes[i]);
				});
			case "equalsByteString":
				return new PlutusCoreAnon(this.site, rte, ["a", "b"], (callSite, _, a, b) => {
					let aBytes = a.bytes;
					let bBytes = b.bytes;

					let res = true;
					if (aBytes.length != bBytes.length) {
						res = false;
					} else {
						for (let i = 0; i < aBytes.length; i++) {
							if (aBytes[i] != bBytes[i]) {
								res = false;
								break;
							}
						}
					}

					return new PlutusCoreBool(callSite, res);
				});
			case "lessThanByteString":
				return new PlutusCoreAnon(this.site, rte, ["a", "b"], (callSite, _, a, b) => {
					let aBytes = a.bytes;
					let bBytes = b.bytes;

					let res = true;
					if (aBytes.length == 0) {
						res = bBytes.length != 0;
					} else if (bBytes.length == 0) {
						res = false;
					} else {
						for (let i = 0; i < Math.min(aBytes.length, bBytes.length); i++) {
							if (aBytes[i] >= bBytes[i]) {
								res = false;
								break;
							}
						}
					}

					return new PlutusCoreBool(callSite, res);
				});
			case "lessThanEqualsByteString":
				return new PlutusCoreAnon(this.site, rte, ["a", "b"], (callSite, _, a, b) => {
					let aBytes = a.bytes;
					let bBytes = b.bytes;

					let res = true;
					if (aBytes.length == 0) {
						res = true;
					} else if (bBytes.length == 0) {
						res = false;
					} else {
						for (let i = 0; i < Math.min(aBytes.length, bBytes.length); i++) {
							if (aBytes[i] > bBytes[i]) {
								res = false;
								break;
							}
						}
					}

					return new PlutusCoreBool(callSite, res);
				});
			case "appendString":
				return new PlutusCoreAnon(this.site, rte, 2, (callSite, _, a, b) => {
					return new PlutusCoreString(callSite, a.string + b.string);
				});
			case "equalsString":
				return new PlutusCoreAnon(this.site, rte, ["a", "b"], (callSite, _, a, b) => {
					return new PlutusCoreBool(callSite, a.string == b.string);
				});
			case "encodeUtf8":
				return new PlutusCoreAnon(this.site, rte, ["str"], (callSite, _, a) => {
					return new PlutusCoreByteArray(callSite, stringToBytes(a.string));
				});
			case "decodeUtf8":
				return new PlutusCoreAnon(this.site, rte, ["bytes"], (callSite, _, a) => {
					return new PlutusCoreString(callSite, bytesToString(a.bytes));
				});
			case "sha2_256":
			case "sha3_256":
			case "blake2b_256":
				throw new Error("these will be some fun ones to implement");
			case "verifyEd25519Signature":
				throw new Error("no immediate need, so don't bother yet");
			case "ifThenElse":
				return new PlutusCoreAnon(this.site, rte, ["cond", "a", "b"], (callSite, _, a, b, c) => {
					return a.bool ? b.copy(callSite) : c.copy(callSite);
				});
			case "chooseUnit":
				throw new Error("what is the point of this function?");
			case "trace":
				return new PlutusCoreAnon(this.site, rte, ["msg", "x"], (callSite, _, a, b) => {
					rte.print(a.string);
					return b.copy(callSite);
				});
			case "fstPair":
				return new PlutusCoreAnon(this.site, rte, ["pair"], (callSite, _, a) => {
					return a.first.copy(callSite);
				});
			case "sndPair":
				return new PlutusCoreAnon(this.site, rte, ["pair"], (callSite, _, b) => {
					return b.second.copy(callSite);
				});
			case "chooseList":
				throw new Error("no immediate need, so don't bother yet");
			case "mkCons":
				// only allow data items in list
				return new PlutusCoreAnon(this.site, rte, ["x", "lst"], (callSite, _, a, b) => {
					if (b.isStrictList()) {
						void a.data;
						let lst = b.list;
						lst.unshift(a);
						return new PlutusCoreList(callSite, lst);
					} else { // should be map
						void a.first.data;
						void b.second.data;
						let pairs = b.map;
						pairs.unshift(a);
						return new PlutusCoreMap(callSite, pairs);
					}
				});
			case "headList":
				return new PlutusCoreAnon(this.site, rte, ["lst"], (callSite, _, a) => {
					let lst = a.list;
					if (lst.length == 0) {
						this.site.runtimeError("empty list");
					}

					return lst[0].copy(callSite);
				});
			case "tailList":
				return new PlutusCoreAnon(this.site, rte, ["lst"], (callSite, _, a) => {
					let lst = a.list;
					if (lst.length == 0) {
						this.site.runtimeError("empty list");
					}

					if (a.isStrictList()) {
						return new PlutusCoreList(callSite, lst.slice(1));
					} else {
						return new PlutusCoreMap(callSite, lst.slice(1));
					}
				});
			case "nullList":
				return new PlutusCoreAnon(this.site, rte, ["lst"], (callSite, _, a) => {
					return new PlutusCoreBool(callSite, a.list.length == 0);
				});
			case "chooseData":
				throw new Error("no immediate need, so don't bother yet");
			case "constrData":
				return new PlutusCoreAnon(this.site, rte, ["idx", "fields"], (callSite, _, a, b) => {
					let i = a.int;
					assert(i >= 0);
					let lst = b.strictList;
					return new PlutusCoreData(callSite, new ConstrData(i, lst));
				});
			case "mapData":
				return new PlutusCoreAnon(this.site, rte, ["pairs"], (callSite, _, a) => {
					return new PlutusCoreData(callSite, new MapData(a.map));
				});
			case "listData":
				return new PlutusCoreAnon(this.site, rte, ["lst"], (callSite, _, a) => {
					return new PlutusCoreData(callSite, new ListData(a.strictList));
				});
			case "iData":
				return new PlutusCoreAnon(this.site, rte, ["i"], (callSite, _, a) => {
					return new PlutusCoreData(callSite, new IntData(a.int));
				});
			case "bData":
				return new PlutusCoreAnon(this.site, rte, ["bytes"], (callSite, _, a) => {
					return new PlutusCoreData(callSite, new ByteArrayData(a.bytes));
				});
			case "unConstrData":
				return new PlutusCoreAnon(this.site, rte, ["data"], (callSite, _, a) => {
					let data = a.data;
					if (!(data instanceof ConstrData)) {
						this.site.runtimeError("unexpected unConstrData argument");
					}

					return new PlutusCorePair(callSite, new PlutusCoreInt(callSite, data.index), new PlutusCoreList(callSite, data.fields));
				});
			case "unMapData":
				return new PlutusCoreAnon(this.site, rte, ["data"], (callSite, _, a) => {
					let data = a.data;
					if (!(data instanceof MapData)) {
						this.site.runtimeError("unexpected unMapData argument");
					}

					return new PlutusCoreMap(callSite, data.map);
				});
			case "unListData":
				return new PlutusCoreAnon(this.site, rte, ["data"], (callSite, _, a) => {
					let data = a.data;
					if (!(data instanceof ListData)) {
						this.site.runtimeError("unexpected unListData argument");
					}

					return new PlutusCoreList(callSite, data.list);
				});
			case "unIData":
				return new PlutusCoreAnon(this.site, rte, ["data"], (callSite, _, a) => {
					let data = a.data;
					if (!(data instanceof IntData)) {
						this.site.runtimeError("unexpected unIData argument");
					}

					return new PlutusCoreInt(callSite, data.value);
				});
			case "unBData":
				return new PlutusCoreAnon(this.site, rte, ["data"], (callSite, _, a) => {
					let data = a.data;
					if (!(data instanceof ByteArrayData)) {
						this.site.runtimeError("unexpected unBData argument");
					}

					return new PlutusCoreByteArray(callSite, data.bytes);
				});
			case "equalsData":
				return new PlutusCoreAnon(this.site, rte, ["a", "b"], (callSite, _, a, b) => {
					// just compare the schema jsons for now
					return new PlutusCoreBool(callSite, a.data.toSchemaJSON() == b.data.toSchemaJSON());
				});
			case "mkPairData":
				return new PlutusCoreAnon(this.site, rte, ["fst", "snd"], (callSite, _, a, b) => {
					void a.data;
					void b.data;
					return new PlutusCorePair(callSite, a.copy(callSite), b.copy(callSite));
				});
			case "mkNilData":
				return new PlutusCoreAnon(this.site, rte, ["unit"], (callSite, _, a) => {
					a.assertUnit();

					return new PlutusCoreList(callSite, []);
				});
			case "mkNilPairData":
				return new PlutusCoreAnon(this.site, rte, ["unit"], (callSite, _, a) => {
					a.assertUnit();

					return new PlutusCoreMap(callSite, []);
				});
			case "serialiseData":
				return new PlutusCoreAnon(this.site, rte, ["data"], (callSite, _, a) => {
					return new PlutusCoreByteArray(callSite, a.data.toCbor());
				});
			case "verifyEcdsaSecp256k1Signature":
			case "verifySchnorrSecp256k1Signature":
				throw new Error("no immediate need, so don't bother yet");
			default:
				throw new Error(`builtin ${this.name_} not yet implemented`);
		}
		
	}
}

class PlutusCoreProgram {
	constructor(expr, version = PLUTUS_CORE_VERSION_COMPONENTS.map(v => new PlutusCoreInt(expr.site, v, false))) {
		this.version_ = version;
		this.expr_    = expr;
	}

	get site() {
		return new Site(this.expr_.site.src, 0);
	}

	// returns the IR source
	get src() {
		return this.site.src.raw;
	}

	plutusScriptVersion() {
		switch (this.version_[0].toSring()) {
			case 2:
				return "PlutusScriptV2";
			case 3:
				return "PlutusScriptV3";
			default:
				return "PlutusScriptV1";
		}
	}

	toString() {
		return "(program " + 
			this.versionString + " " + 
			this.expr_.toString() + ")";
	}

	toFlat(bitWriter) {
		for (let v of this.version_) {
			v.toFlat(bitWriter);
		}

		this.expr_.toFlat(bitWriter);

		// final padding is handled by bitWriter upon finalization
	}

	async eval(rte) {
		return this.expr_.eval(rte);
	}

	async run(callbacks) {
		let rte = new PlutusCoreRTE(callbacks);

		try {
			let fn = await this.eval(rte);

			// program site is at pos 0, but now the call site is actually at the end 
			let globalCallSite = new Site(this.site.src, this.site.src.length);
			let result = await fn.call(rte, globalCallSite, new PlutusCoreUnit(globalCallSite));

			return result;
		} catch(e) {
			if (!(e instanceof UserError)) {
				throw e;
			}

			return e;
		}
	}

	// returns plutus-core script in JSON formats (as string, not as object!)
	serialize() {
		let bitWriter = new BitWriter();

		this.toFlat(bitWriter);

		let bytes = bitWriter.finalize();

		let cborHex = bytesToHex(wrapCborBytes(wrapCborBytes(bytes)));

		return `{"type": "${this.plutusScriptVersion()}", "description": "", "cborHex": "${cborHex}"}`;
	}
}


/////////////////////////////////
// Section 4: Plutus data objects
/////////////////////////////////

class IntData {
	constructor(value) {
		this.value_ = value;
	}

	get value() {
		return this.value_;
	}

	toString() {
		return this.value_.toString();
	}

	toUntyped() {
		return `__core__iData(${this.value_.toString()})`;
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

	static fromString(s) {
		let bytes = stringToBytes(s);

		return new ByteArrayData(bytes);
	}

	get bytes() {
		return this.bytes_.slice();
	}

	toHex() {
		return bytesToHex(this.bytes_);
	}

	toString() {
		return `#${this.toHex()}`;
	}

	toUntyped() {
		return `__core__bData(#${this.toHex()})`;
	}

	toSchemaJSON() {
		return `{"bytes": "${this.toHex()}"}`;
	}
}

class ListData {
	constructor(items) {
		this.items_ = items;
	}

	get list() {
		return this.items_.slice();
	}

	toString() {
		return `[${this.items_.map(item => item.toString()).join(", ")}]`;
	}

	toUntyped() {
		let lst = "__core__mkNilData(())";
		for (let i = this.items_.length - 1; i >= 0; i--) {
			lst = `__core__mkCons(${this.items_[i].toUntyped()}, ${lst})`;
		}

		return `__core__listData(${lst})`;
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

	get map() {
		return this.pairs_.slice();
	}

	toString() {
		return `[${this.pairs_.map(([fst, snd]) => `[${fst.toString()}, ${snd.toString()}]`).join(", ")}]`;
	}

	toUntyped() {
		let lst = "__core__mkNilPairData(())";

		for (let i = this.pairs_.length - 1; i >= 0; i--) {
			let a = this.pairs_[i][0].toUntyped();
			let b = this.pairs_[i][1].toUntyped();

			lst = `__core__mkCons(__core__mkPairData(${a}, ${b}), ${lst})`;
		}

		return `__core__mapData(${lst})`;
	}

	toSchemaJSON() {
		return `{"map": [${this.pairs_.map(pair => {return "{\"k\": " + pair[0].toSchemaJSON() + ", \"v\": " + pair[1].toSchemaJSON() + "}"}).join(", ")}]}`;
	}
}

class ConstrData {
	constructor(index, fields) {
		this.index_ = index;
		this.fields_ = fields;
	}

	get index() {
		return this.index_;
	}

	get fields() {
		return this.fields_.slice();
	}

	toString() {
		let parts = [this.index_.toString()];
		parts = parts.concat(this.fields_.map(field => field.toString()));
		return parts.join(", ");
	}

	toUntyped() {
		let lst = "__core__mkNilData(())";
		for (let i = this.fields_.length - 1; i >= 0; i--) {
			lst = `__core__mkCons(${this.fields_[i].toUntyped()}, ${lst})`
		}

		return `__core__constrData(${this.index_.toString()}, ${lst})`
	}

	toSchemaJSON() {
		return `{"constructor": ${this.index_.toString()}, "fields": [${this.fields_.map(f => f.toSchemaJSON()).join(", ")}]}`;
	}
}


///////////////////////////
// Section 5: Token objects
///////////////////////////


class Token {
	constructor(site) {
		this.site_ = assertDefined(site); // position in source of start of token
	}

	get site() {
		return this.site_;
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

	syntaxError(msg) {
		this.site_.syntaxError(msg);
	}

	typeError(msg) {
		this.site_.typeError(msg);
	}

	referenceError(msg) {
		this.site_.referenceError(msg);
	}

	assertWord(value) {
		if (value != undefined) {
			this.syntaxError(`expected \'${value}\', got \'${this.toString()}\'`);
		} else {
			this.syntaxError(`expected word, got ${this.toString()}`);
		}

		return this; // dead code, but to make clear that overrides need to return self
	}

	assertSymbol(symbol) {
		if (symbol != undefined) {
			this.syntaxError(`expected \'${symbol}\', got \'${this.toString()}\'`);	
		} else {
			this.syntaxError(`expected symbol, got \'${this.toString()}\'`);
		}

		return this; // dead code, but to make clear that overrides need to return self
	}

	assertGroup(type) {
		if (type != undefined) {
			this.syntaxError(`invalid syntax: expected \'${type}...${Group.matchSymbol(type)}\'`)
		} else {
			this.syntaxError(`invalid syntax: expected group`);
		}

		return this; // dead code, but to make clear that overrides need to return self
	}

	link(scope) {
		console.log(this);
		throw new Error("not implemented");
	}

	evalType() {
		throw new Error("not implemented");
	}

	evalData() {
		this.typeError("can't be used in data eval");
	}
}

class Word extends Token {
	constructor(site, value) {
		if (value == undefined) {
			value = site;
			site = Site.dummy();
		}

		super(site);
		this.value_ = value;
	}

	get value() {
		return this.value_;
	}

	isWord(value) {
		if (value != undefined) {
			if (value instanceof Array) {
				return value.lastIndexOf(this.value_) != -1;
			} else {
				return value == this.value_;
			}
		} else {
			return true;
		}
	}

	assertWord(value) {
		if (!this.isWord(value)) {
			super.assertWord(value);
		}

		return this;
	}

	assertNotInternal() {
		if (this.value_ == "_") {
			this.syntaxError("_ is reserved");
		} else if (this.value_.startsWith("__")) {
			this.syntaxError("__ prefix is reserved");
		} else if (this.value_.endsWith("__")) {
			this.syntaxError("__ suffix is reserved");
		}

		return this;
	}

	isKeyword() {
		switch(this.value_) {
			case "validator":
			case "mint_policy":
			case "reward_policy":
			case "certify_policy":
			case "const":
			case "func":
			case "struct":
			case "enum":
			case "if":
			case "else":
			case "switch":
			case "case":
			case "default":
				return true;
			default:
				return false;
		}
	}

	assertNotKeyword() {
		this.assertNotInternal();
	
		if (this.isKeyword()) {
			this.syntaxError(`${this.value_} is a reserved word`);
		}

		return this;
	}

	toString() {
		return this.value_;
	}

	// find the index of the first Word(value) in a list of tokens 
	// returns -1 if none found
	static find(ts, value) {
		return ts.findIndex(item => item.isWord(value));
	}
}

class Symbol extends Token {
	constructor(site, value) {
		if (value == undefined) {
			value = site;
			site = Site.dummy();
		}

		super(site);
		this.value_ = value;
	}

	get value() {
		return this.value_;
	}

	isSymbol(value) {
		if (value != undefined) {
			if (value instanceof Array) {
				return value.lastIndexOf(this.value_) != -1;
			} else {
				return value == this.value_;
			}	
		} else {
			return true;
		}
	}

	assertSymbol(value) {
		if (!this.isSymbol(value)) {
			super.assertSymbol(value);
		}

		return this;
	}

	toString() {
		return this.value_;
	}

	// find the index of the first Symbol(value) in a list of tokens 
	// returns -1 if none found
	static find(ts, value) {
		return ts.findIndex(item => item.isSymbol(value));
	}

	// find the index of the first Symbol(value) in a list of tokens 
	// returns -1 if none found
	static findLast(ts, value) {
		for (let i = ts.length - 1; i >= 0; i--) {
			if (ts[i].isSymbol(value)) {
				return i;
			}
		}

		return -1;
	}
}

class Group extends Token {
	// type is "(", "[" or "{"
	constructor(site, type, fields) {
		super(site);
		this.type_ = type;
		this.fields_ = fields; // list of lists of tokens
	}

	get fields() {
		return this.fields_.slice(); // copy, so fields_ doesn't get mutated
	}

	isGroup(type) {
		if (type != undefined) {
			return this.type_ == type;
		} else {
			return true;
		}
	}

	assertGroup(type, nFields = null) {
		if (type != undefined && this.type_ != type) {
			this.syntaxError(`invalid syntax: expected \'${type}...${Group.matchSymbol(type)}\', got \'${this.type_}...${Group.matchSymbol(this.type_)}\'`);
		}  else if (type != undefined && nFields != null && nFields != this.fields_.length) {
			this.syntaxError(`invalid syntax: expected \`${type}...${Group.matchSymbol(type)}\' with ${nFields} field(s), got \'${type}...${Group.matchSymbol(type)}\' with ${this.fields_.length} fields`);
		}

		return this;
	}

	toString() {
		let s = this.type_;

		let parts = [];
		for (let f of this.fields_) {
			parts.push(f.map(t => t.toString()).join(" "));
		}

		s += parts.join(", ") + Group.matchSymbol(this.type_);

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

	// find index of first Group(type) in list of tokens 
	// returns -1 if none found
	static find(ts, type) {
		return ts.findIndex(item => item.isGroup(type));
	}
}

class PrimitiveLiteral extends Token {
	constructor(loc) {
		super(loc);
	}

	isLiteral() {
		return true;
	}

	// used in untyped program
	link(scope) {
	}
}

// always signed
class IntLiteral extends PrimitiveLiteral {
	// value has type BigInt
	constructor(site, value) {
		if (value == null) {
			value = site;
			site = Site.dummy();
		}

		assert(typeof value == 'bigint');

		super(site);
		this.value_ = value;
	}

	get value() {
		return this.value_;
	}

	toString() {
		return this.value_.toString();
	}

	toUntyped() {
		return this.toString();
	}

	toPlutusCore() {
		// the 'true' argument means that this integer is signed
		return new PlutusCoreInt(this.site, this.value_, true);
	}
}

class BoolLiteral extends PrimitiveLiteral {
	constructor(site, value) {
		if (value == undefined) {
			value = site;
			site = Site.dummy();
		}

		super(site);
		this.value_ = value;
	}

	toString() {
		return this.value_ ? "true" : "false";
	}

	toUntyped() {
		return this.toString();
	}

	toPlutusCore() {
		return new PlutusCoreBool(this.site, this.value_);
	}
}

class ByteArrayLiteral extends PrimitiveLiteral {
	constructor(site, bytes) {
		if (bytes == undefined) {
			bytes = site;
			site = Site.dummy();
		}

		super(site);
		this.bytes_ = bytes;
	}

	toString() {
		return '#' + bytesToHex(this.bytes_);
	}

	toUntyped() {
		return this.toString();
	}

	toPlutusCore() {
		return new PlutusCoreByteArray(this.site, this.bytes_);
	}
}

// "..." is a utf8 string literal
class StringLiteral extends PrimitiveLiteral {
	constructor(site, value) {
		if (value == undefined) {
			value = site;
			site = Site.dummy();
		}

		super(site);
		this.value_ = value;
	}

	toString() {
		return `\"${this.value_.toString()}\"`;
	}

	toUntyped() {
		return this.toString();
	}

	toPlutusCore() {
		return new PlutusCoreString(this.site, this.value_);
	}
}

// these tokens are used by both typed and untyped Helios, but UnitLiteral is only used by untyped Helios
class UnitLiteral extends PrimitiveLiteral {
	constructor(site) {
		if (site == undefined) {
			site = Site.dummy();
		}

		super(site);
	}

	toString() {
		return "()";
	}

	toPlutusCore() {
		return new PlutusCoreUnit(this.site);
	}
}


//////////////////////////
// Section 6: Tokenization
//////////////////////////

class Tokenizer {
	constructor(src) {
		assert(src instanceof Source);

		this.src_ = src;
		this.pos_ = 0;
		this.ts_  = null; // set to empty to list at start of tokenize()
	}

	incrPos() {
		this.pos_ += 1;
	}

	decrPos() {
		this.pos_ -= 1;
		assert(this.pos_ >= 0);
	}

	get currentSite() {
		return new Site(this.src_, this.pos_);
	}

	readChar() {
		assert(this.pos_ >= 0);

		let c;
		if (this.pos_ < this.src_.length) {
			c = this.src_.getChar(this.pos_);
		} else {
			c = '\0';
		}

		this.incrPos();

		return c;
	}

	unreadChar() {
		this.decrPos();
	}

	ingestChar(site, c) {
		if (c == '_' || (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z')) {
			this.readWord(site, c);
		} else if (c == '/') {
			this.readMaybeComment(site);
		} else if (c == '0') {
			this.readSpecialInteger(site);
		} else if (c >= '1' && c <= '9') {
			this.readDecimalInteger(site, c);
		} else if (c == '#') {
			this.readByteArray(site);
		} else if (c == '"') {
			this.readString(site);
		} else if (c ==  '!' || c == '%' || c == '&' || (c >= '(' && c <= '.') || (c >= ':' && c <= '>') || c == '[' || c == ']' || (c >= '{' && c <= '}')) {
			this.readSymbol(site, c);
		} else if (!(c == ' ' || c == '\n' || c == '\t' || c == '\r')) {
			site.syntaxError(`invalid source character (utf-8 not yet supported outside string literals)`);
		}
	}

	tokenize() {
		this.ts_ = [];

		let site = this.currentSite;
		let c = this.readChar();

		while (c != '\0') {
			this.ingestChar(site, c);

			site = this.currentSite;
			c = this.readChar();
		}

		return Tokenizer.nestGroups(this.ts_);
	}

	// returns a generator
	// use gen.next().value to access to values
	// doesn't perform any grouping
	*streamTokens() {
		this.ts_ = [];

		let site = this.currentSite;
		let c = this.readChar();

		while (c != '\0') {
			this.ingestChar(site, c);

			while (this.ts_.length > 0) {
				yield this.ts_.shift();
			}

			site = this.currentSite;
			c = this.readChar();
		}

		assert(this.ts_.length == 0);
	}

	// immediately turns "true" or "false" into a BoolLiteral instead of keeping it as Word
	readWord(site, c0) {
		let chars = [];

		let c = c0;
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
			this.ts_.push(new BoolLiteral(site, value == "true"));
		} else {
			this.ts_.push(new Word(site, value));
		}
	}

	// comments are discarded
	readMaybeComment(site) {
		let c = this.readChar();

		if (c == '\0') {
			this.ts_.push(new Symbol(site, '/'));
		} else if (c == '/') {
			this.readSingleLineComment();
		} else if (c == '*') {
			this.readMultiLineComment(site);
		} else {
			this.ts_.push(new Symbol(site, '/'));
			this.unreadChar();
		}
	}

	// comments are discarded
	readSingleLineComment() {
		let c = this.readChar();

		while (c != '\n') {
			c = this.readChar();
		}
	}

	readMultiLineComment(site) {
		let prev = '';
		let c = this.readChar();

		while (true) {
			prev = c;
			c = this.readChar();

			if (c == '/' && prev == '*') {
				break;
			} else if (c == '\0') {
				site.syntaxError("unterminated multiline comment");
			}
		}
	}

	readSpecialInteger(site) {
		let c = this.readChar();

		if (c == '\0') {
			this.ts_.push(new IntLiteral(site, 0));
		} else if (c == 'b') {
			this.readBinaryInteger(site);
		} else if (c == 'o') {
			this.readOctalInteger(site);
		} else if (c == 'x') {
			this.readHexInteger(site);
		} else if ((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z')) {
			site.syntaxError(`bad literal integer type 0${c}`);
		} else if (c >= '0' && c <= '9') {
			this.readDecimalInteger(site, c);
		} else {
			this.ts_.push(new IntLiteral(site, 0n));
			this.unreadChar();
		}
	}

	readBinaryInteger(site) {
		this.readRadixInteger(site, "0b", c => (c == '0' || c == '1'));
	}

	readOctalInteger(site) {
		this.readRadixInteger(site, "0o", c => (c >= '0' && c <= '7'));
	}

	readHexInteger(site) {
		this.readRadixInteger(site, "0x", 
			c => ((c >= '0' && c <= '9') || (c >= 'a' || c <= 'f')));
	}

	readDecimalInteger(site, c0) {
		let chars = [];

		let c = c0;
		while (c != '\0') {
			if (c >= '0' && c <= '9') {
				chars.push(c);
			} else if ((c >= '0' && c <= '9') || (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z')) {
				site.syntaxError("invalid syntax for decimal integer literal");
			} else {
				this.unreadChar();
				break;
			}

			c = this.readChar();
		}

		this.ts_.push(new IntLiteral(site, BigInt(chars.join(''))));
	}

	readRadixInteger(site, prefix, valid) {
		let c = this.readChar();

		let chars = [];

		if (!(valid(c))) {
			site.syntaxError(`expected at least one char for ${prefix} integer literal`);
		}

		while (c != '\0') {
			if (valid(c)) {
				chars.push(c);
			} else if ((c >= '0' && c <= '9') || (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z')) {
				site.syntaxError(`invalid syntax for ${prefix} integer literal`);
			} else {
				this.unreadChar();
				break;
			}

			c = this.readChar();
		}

		this.ts_.push(new IntLiteral(site, BigInt(prefix + chars.join(''))));
	}

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

		this.ts_.push(new ByteArrayLiteral(site, bytes));
	}

	readString(site) {
		let c = this.readChar();

		let chars = [];

		let escaping = false;
		let escapeSite; // for escape syntax errors

		while (!(!escaping && c == '"')) {
			if (c == '\0') {
				site.syntaxError("unmatched '\"'");
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
					escapeSite.syntaxError(`invalid escape sequence ${c}`)
					throw new Error();
				}

				escaping = false;
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

		this.ts_.push(new StringLiteral(site, chars.join('')));
	}

	readSymbol(site, c0) {
		let chars = [c0];

		let parseSecondChar = (second) => {
			let d = this.readChar();

			if (d == second) {
				chars.push(d);
			} else {
				this.unreadChar();
			}
		}

		if (c0 == '|') {
			parseSecondChar('|');
		} else if (c0 == '&') {
			parseSecondChar('&');
		} else if (c0 == '!' || (c0 >= '<' && c0 <= '>')) { // could be !=, ==, <= or >=
			parseSecondChar('=');
		} else if (c0 == ':') {
			parseSecondChar(':');
		} else if (c0 == '-') {
			parseSecondChar('>');
		}

		this.ts_.push(new Symbol(site, chars.join('')));
	}

	static groupFields(ts) {
		assert(ts.length > 1);

		let open = ts.shift();

		let stack = [open]; // stack of symbols
		let curField = [];
		let fields = [];
		let lastComma = null;

		while (stack.length > 0 && ts.length > 0) {
			let t = ts.shift();
			let prev = stack.pop();

			if (!t.isSymbol(Group.matchSymbol(prev))) {
				stack.push(prev);

				if (Group.isCloseSymbol(t)) {
					t.syntaxError(`unmatched ${t.value}`);
				} else if (Group.isOpenSymbol(t)) {
					stack.push(t);
					curField.push(t);
				} else if (t.isSymbol(",") && stack.length == 1) {
					lastComma = t;
					if (curField.length == 0) {
						t.syntaxError("empty field");
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
			last.syntaxError(`EOF while matching \'${last.value}\'`);
		}
		
		if (curField.length > 0) {
			fields.push(curField);
		} else if (lastComma != null) {
			lastComma.syntaxError(`trailing comma`);
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

				res.push(new Group(t.site, t.value, fields));
			} else if (Group.isCloseSymbol(t)) {
				t.syntaxError(`unmatched \'${t.value}\'`);
			} else {
				res.push(t);
			}
		}

		return res;
	}
}

// can also be used
function tokenize(rawSrc) {
	let src = new Source(rawSrc);

	let tokenizer = new Tokenizer(src);
	
	return tokenizer.tokenize();
}

// same tokenizer can be used for untyped Helios
function tokenizeUntyped(rawSrc) {
	return tokenize(rawSrc);
}


/////////////////////////////////////
// Section 7: Type evaluation objects
/////////////////////////////////////

class GeneralizedValue {
	constructor() {
		this.used_ = false;
	}

	isType() {
		throw new Error("not implemented");
	}

	isValue() {
		throw new Error("not implemented");
	}

	isUsed() {
		return this.used_;
	}

	markAsUsed() {
		this.used_ = true;
	}

	getType(site) {
		throw new Error("not implemented");
	}

	isBaseOf(site, type) {
		throw new Error("not implemented");
	}

	isInstanceOf(site, type) {
		throw new Error("not implemented");
	}

	call(site, args) {
		throw new Error("not implemented");
	}

	// for `::`
	getTypeMember(name) {
		throw new Error("not implemented");
	}

	// for `.`
	getInstanceMember(name) {
		throw new Error("not implemented");
	}

	nFields(site) {
		throw new Error("not implemented");
	}

	getConstrIndex(site) {
		throw new Error("not implemented");
	}
}

class Type extends GeneralizedValue {
	constructor() {
		super();
	}

	static same(site, a, b) {
		return a.isBaseOf(site, b) && b.isBaseOf(site, a);
	}

	isType() {
		return true;
	}

	isValue() {
		return false;
	}

	getType(site) {
		site.typeError("can't use getType, not an instance " + this.toString());
	}

	isInstanceOf(site, type) {
		assert(false, "block");
		site.typeError("can't use isInstanceOf, not an instance " + this.toString());
	}

	call(site, args) {
		site.typeError("not callable");
	}
}

// used by find_datum_hash for example
class AnyType extends Type {
	constructor() {
		super();
	}

	isBaseOf(site, other) {
		return true;
	}
}

class DataType extends Type {
	constructor() {
		super();
	}

	isBaseOf(site, type) {
		return Object.getPrototypeOf(this) == Object.getPrototypeOf(type);
	}
}

// any builtin type that inherits from BuiltinType must implement toUntyped()
class BuiltinType extends DataType {
	constructor() {
		super();
	}

	getTypeMember(name) {
		name.referenceError(`${this.toString()}::${name.value} undefined`);
	}

	getInstanceMember(name) {
		switch(name.value) {
			case "trace":
				return Value.new(new FuncType([new StringType()], this));
			case "serialize":
				return Value.new(new FuncType([], new ByteArrayType()));
			case "__eq":
			case "__neq":
				return Value.new(new FuncType([this], new BoolType()));
			default:
				name.referenceError(`${this.toString()}.${name.value} undefined`);
		}
	}

	// by default builtin types don't have any fields
	nFields(site) {
		return 0;
	}

	// by default builtin types that are encoded as Plutus-Core data use the '0' constructor index
	getConstrIndex(site) {
		return 0;
	}

	// return base of type
	toUntyped() {
		throw new Error("not implemented")
	}
}

class UserType extends DataType {
	constructor(statement) {
		super();
		this.statement_ = statement;
	}

	isBaseOf(site, type) {
		if (type instanceof UserType) {
			this.statement_.isBaseOf(type.statement_);
		} else {
			return false;
		}
	}

	// for `::`
	getTypeMember(name) {
		return this.statement_.getTypeMember(name);
	}

	// for `.`
	getInstanceMember(name) {
		return this.statement_.getInstanceMember(name);
	}

	nFields(site) {
		return this.statement_.nFields(site);
	}

	getConstrIndex(site) {
		return this.statement_.getConstrIndex(site);
	}
}

class FuncType extends Type {
	constructor(argTypes, retType) {
		super();
		this.argTypes_ = argTypes;
		this.retType_ = retType;
	}

	get nArgs() {
		return this.argTypes_.length;
	}

	get retType() {
		return this.retType_;
	}

	toString() {
		return `(${this.argTypes_.map(a => a.toString()).join(", ")}) -> ${this.retType_.toString()}`;
	}

	// the name of first arg also needs to be self, but that is checked elsewhere
	maybeMethod(site, type) {
		if (this.argTypes_.length > 0) {
			return Type.same(site, this.argTypes_[0], type);
		} else {
			return false;
		}
	}
	
	isAssociated(site, type) {
		for (let arg of this.argTypes_.length) {
			if (Type.same(site, arg, type)) {
				return true;
			}
		}

		if (Type.same(site, type, this.retType_)) {
			return true;
		} else {
			return false;
		}
	}

	isBaseOf(site, type) {
		if (type instanceof FuncType) {
			if (this.nArgs != type.nArgs) {
				return false;
			} else {
				for (let i = 0; i < this.nArgs; i++) {
					if (!type.argTypes_[i].isBaseOf(site, this.argTypes_[i])) { // note the reversal of the check
						return false;
					}
				}

				return this.retType_.isBaseOf(site, type.retType_);
			}

		} else {
			return false;
		}
	}

	// returns a list of [haveDatum, haveRedeemer, haveScriptContext]
	checkAsMain(site, purpose) {
		let haveDatum = false;
		let haveRedeemer = false;
		let haveScriptContext = false;

		if (purpose == ScriptPurpose.Testing) {
			if (this.argTypes_ != 0) {
				site.typeError("test main should have 0 args");
			}
		} else if (!Type.same(site, this.retType_, new BoolType())) {
			site.typeError(`invalid main return type: expected Bool, got ${this.retType_.toString()}`);
		} else if (purpose == ScriptPurpose.Spending) {
			if (this.argTypes_.length > 3) {
				site.typeError("too many arguments for main");
			} 

			for (let arg of this.argTypes_) {
				let t = arg.toString();

				if (t == "Datum") {
					if (haveDatum) {
						site.typeError("duplicate \'Datum\' argument");
					} else if (haveRedeemer) {
						site.typeError("\'Datum\' must come before \'Redeemer\'");
					} else if (haveScriptContext) {
						site.typeError("\'Datum\' must come before \'ScriptContext\'");
					} else {
						haveDatum = true;
					}
				} else if (t == "Redeemer") {
					if (haveRedeemer) {
						site.typeError("duplicate \'Redeemer\' argument");
					} else if (haveScriptContext) {
						site.typeError("\'Redeemer\' must come before \'ScriptContext\'");
					} else {
						haveRedeemer = true;
					}
				} else if (t == "ScriptContext") {
					if (haveScriptContext) {
						site.typeError("duplicate \'ScriptContext\' argument");
					} else {
						haveScriptContext = true;
					}
				} else {
					site.typeError("illegal argument type, must be \'Datum\', \'Redeemer\' or \'ScriptContext\'");
				}
			}
		} else if (purpose == ScriptPurpose.Minting) {
			if (this.argTypes_.length > 2) {
				site.typeError("too many arguments for main");
			}

			for (let arg of this.argTypes_) {
				let t = arg.toString();

				if (t == "Redeemer") {
					if (haveRedeemer) {
						site.typeError(`duplicate "Redeemer" argument`);
					} else if (haveScriptContext) {
						site.typeError(`"Redeemer" must come before "ScriptContext"`);
					} else {
						haveRedeemer = true;
					}
				} else if (t == "ScriptContext") {
					if (haveScriptContext) {
						site.typeError(`duplicate "ScriptContext" argument`);
					} else {
						haveScriptContext = true;
					}
				} else {
					site.typeError(`illegal argument type, must be "Redeemer" or "ScriptContext"`);
				}
			}
		} else {
			throw new Error(`unhandled ScriptPurpose ${purpose.toString()}`);
		}

		return [haveDatum, haveRedeemer, haveScriptContext];
	}
}

class Value extends GeneralizedValue {
	constructor() {
		super();
	}

	static new(type) {
		if (type instanceof FuncType) {
			return new FuncValue(type);
		} else {
			return new DataValue(type);
		}
	}

	isType() {
		return false;
	}
	
	isValue() {
		return true;
	}

	isBaseOf(site, type) {
		site.typeError("not a type");
	}

	call(site, args) {
		site.typeError("not callable");
	}
}

class DataValue extends Value {
	constructor(type) {
		assert(!(type instanceof FuncType));

		super();
		this.type_ = type;
	}

	copy() {
		return new DataValue(this.type_);
	}

	toString() {
		return this.type_.toString();
	}

	getType(site) {
		return this.type_;
	}

	// type can be a class, or class instance
	isInstanceOf(site, type) {
		if (typeof type == 'function') {
			return this.type_ instanceof type;
		} else {
			return type.isBaseOf(site, this.type_);
		}
	}

	nFields(site) {
		return this.type_.nFields(site);
	}

	getInstanceMember(name) {
		return this.type_.getInstanceMember(name);
	}
}

class FuncValue extends Value {
	constructor(type) {
		assert(type instanceof FuncType);

		super();
		this.type_ = type;
	}
	
	get nArgs() {
		return this.type_.nArgs;
	}

	isRecursive() {
		return false;
	}

	copy() {
		return new FuncValue(this.type_);
	}

	toString() {
		return this.type_.toString();
	}

	getType() {
		return this.type_;
	}

	isInstanceOf(site, type) {
		if (typeof type == 'function') {
			return this.type_ instanceof type;
		} else {
			return type.isBaseOf(site, this.type_);
		}
	}
	
	call(site, args) {
		if (this.nArgs != args.length) {
			site.typeError(`expected ${this.nArgs} arg(s), got ${args.length}`);
		}

		for (let i = 0; i < this.nArgs; i++) {
			if (!args[i].isInstanceOf(site, this.type_.argTypes_[i])) {
				site.typeError(`expected ${this.type_.argTypes_[i].toString()} for arg ${i+1}, got ${args[i].toString()}`);
			}
		}

		return Value.new(this.type_.retType_);
	}

	nFields(site) {
		site.typeError("a function doesn't have fields");
	}

	getInstanceMember(name) {
		name.typeError("a function doesn't have any members");
	}
}

// only top functions (i.e. function statements) can be used recursively
class TopFuncValue extends FuncValue {
	constructor(type) {
		super(type);
		this.recursive_ = false;
	}

	markAsUsed() {
		super.markAsUsed();
		this.recursive_ = true;
	}

	isRecursive() {
		return this.recursive_;
	}
}


////////////////////
// Section 8: Scopes
////////////////////

// GlobalScope is for builtins
class GlobalScope {
	constructor() {
		// let there be no confusion: types are also values!
		// values_ contains a list of pairs
		this.values_ = []; 
	}

	has(name) {
		for (let pair of this.values_) {
			if (pair[0].toString() == name.toString()) {
				return true;
			}
		}

		return false;
	}

	// when setting in global scope assuming everything is unique
	set(name, value) {
		if (!(name instanceof Word)) {
			name = new Word(name);
		}

		assert(value.toUntyped != undefined);

		this.values_.push([name, value]);
	}

	get(name) {
		for (let pair of this.values_) {
			if (pair[0].toString() == name.toString()) {
				pair[1].markAsUsed();
				return pair[1];
			}
		}

		name.referenceError(`\'${name.toString()}\' undefined`);
	}

	static new() {
		let scope = new GlobalScope();

		// List (aka '[]'), Option, and Map types are accessed through special expressions

		// fill the global scope with builtin types
		scope.set("Int", new IntType());
		scope.set("Bool", new BoolType());
		scope.set("String", new StringType());
		scope.set("ByteArray", new ByteArrayType());
		scope.set("PubKeyHash", new PubKeyHashType());
		scope.set("ValidatorHash", new ValidatorHashType());
		scope.set("MintingPolicyHash", new MintingPolicyHashType());
		scope.set("DatumHash", new DatumHashType());
		scope.set("ScriptContext", new ScriptContextType());
		scope.set("Tx", new TxType());
		scope.set("TxId", new TxIdType());
		scope.set("TxInput", new TxInputType());
		scope.set("TxOutput", new TxOutputType());
		scope.set("TxOutputId", new TxOutputIdType());
		scope.set("Address", new AddressType());
		scope.set("Credential", new CredentialType());
		scope.set("StakingCredential", new StakingCredentialType());
		scope.set("Time", new TimeType());
		scope.set("Duration", new DurationType());
		scope.set("TimeRange", new TimeRangeType());
		scope.set("AssetClass", new AssetClassType());
		scope.set("Value", new MoneyValueType());

		return scope;
	}
}

class Scope {
	constructor(parent) {
		assert(parent != null);

		this.parent_ = parent;
		this.values_ = []; // list of pairs
	}

	has(name) {
		for (let pair of this.values_) {
			if (pair[0].toString() == name.toString()) {
				return true;
			}
		}

		if (this.parent_ != null) {
			return this.parent_.has(name);
		} else {
			return false;
		}
	}

	set(name, value) {
		if (this.has(name)) {
			name.syntaxError(`\'${name.toString()}\' already defined`);
		}

		this.values_.push([name, value]);
	}

	get(name) {
		if (!(name instanceof Word)) {
			name = new Word(name);
		}

		for (let pair of this.values_) {
			if (pair[0].toString() == name.toString()) {
				pair[1].markAsUsed();
				return pair[1];
			}
		}

		if (this.parent_ != null) {
			return this.parent_.get(name);
		} else {
			name.referenceError(`${name.toString()} undefined`);
		}
	}

	assertAllUsed() {
		for (let pair of this.values_) {
			if (!pair[1].isUsed()) {
				pair[0].referenceError(`\'${pair[0].toString()}\' unused`);
			}
		}
	}

	
}

class TopScope extends Scope {
	constructor(parent) {
		assert(parent instanceof GlobalScope);
		super(parent);
	}

	set(name, value) {
		super.set(name, value);
	}

	// map: name -> definition
	static wrapWithDefinitions(inner, map) {
		let keys = Array.from(map.keys()).reverse();

		let res = inner;
		for (let key of keys) {
			res = `(${key}) -> {
${res}
}(
	/*${key}*/
	${map.get(key)}
)`;
		}

		return res;
	}

	wrapAround(inner) {	
		// first collect, so we can optionally reverse
		let map = new Map(); // string -> string

		for (let pair of this.values_) {
			pair[1].toUntyped(map);
		}

		return TopScope.wrapWithDefinitions(inner, map);
	}
}


////////////////////////////////////
// Section 9: AST expression objects
////////////////////////////////////

// caches the evaluated type
// both TypeExpr and ValueExpr inherit from this
class Expr extends Token {
	constructor(site) {
		super(site);
		this.cache_ = null;
	}

	eval(scope) {
		if (this.cache_ == null) {
			this.cache_ = this.evalInternal(scope);
		}

		return this.cache_;
	}
}

class TypeExpr extends Expr {
	constructor(site) {
		super(site);
	}
}

class TypeRefExpr extends TypeExpr {
	constructor(name) {
		super(name.site);
		this.name_ = name;
	}

	toString() {
		return this.name_.toString();
	}

	evalInternal(scope) {
		let type = scope.get(this.name_);

		if (!type.isType()) {
			this.name_.typeError("not a type");
		}

		return type;
	}

	toUntyped() {
		return `__${this.name_.toString()}`;
	}
}

class TypePathExpr extends TypeExpr {
	constructor(site, rootName, memberName) {
		super(site);
		this.baseName_ = baseName;
		this.memberName_ = memberName;
	}

	toString() {
		return this.baseName_.toString() + "::" + this.memberName_.toString();
	}

	evalInternal(scope) {
		let baseType = scope.get(this.baseName_);

		if (!baseType.isType()) {
			this.baseName_.typeError("not a type");
		}

		let memberType = baseType.getTypeMember(this.memberName_);

		if (!memberType.isType()) {
			this.memberName_.typeError("not a type");
		}

		return memberType;
	}

	toUntyped() {
		return `__${this.baseName_.toString()}__${this.memberName_.toString()}`;
	}
}

class ListTypeExpr extends TypeExpr {
	constructor(site, itemTypeExpr) {
		super(site);
		this.itemTypeExpr_ = itemTypeExpr;
	}

	toString() {
		return `[]${this.itemTypeExpr_.toString()}`;
	}

	evalInternal(scope) {
		let itemType = this.itemTypeExpr_.eval(scope);

		assert(itemType.isType());

		if (itemType instanceof FuncType) {
			this.itemTypeExpr_.typeError("list item type can't be function");
		}

		return new ListType(itemType);
	}
}

class MapTypeExpr extends TypeExpr {
	constructor(site, keyTypeExpr, valueTypeExpr) {
		super(site);
		this.keyTypeExpr_ = keyTypeExpr;
		this.valueTypeExpr_ = valueTypeExpr;
	}

	toString() {
		return `Map[${this.keyTypeExpr_.toString()}]${this.valueTypeExpr_.toString()}`; 
	}

	evalInternal(scope) {
		let keyType = this.keyTypeExpr_.eval(scope);

		assert(keyType.isType());
		if (keyType instanceof FuncType) {
			this.keyTypeExpr_.typeError("map key type can't be function");
		}

		let valueType = this.valueTypeExpr_.eval(scope);

		assert(valueType.isType());

		if (valueType instanceof FuncType) {
			this.valueTypeExpr_.typeError("map value type can't be function");
		}

		return new MapType(keyType, valueType);
	}
}

class OptionTypeExpr extends TypeExpr {
	constructor(site, someTypeExpr) {
		super(site);
		this.someTypeExpr_ = someTypeExpr;
	}

	toString() {
		return `Option[${this.someTypeExpr_.toString()}]`;
	}

	evalInternal(scope) {
		let someType = this.someTypeExpr_.eval(scope);

		assert(someType.isType());
		if (someType instanceof FuncType) {
			this.someTypeExpr_.typeError("option some type can't be function");
		}

		return new OptionType(someType);
	}
}

class FuncTypeExpr extends TypeExpr {
	constructor(site, argTypeExprs, retTypeExpr) {
		super(site);
		this.argTypeExprs_ = argTypeExprs;
		this.retTypeExpr_ = retTypeExpr;
	}

	toString() {
		return `(${this.argTypeExprs_.map(a => a.toString()).join(", ")}) -> ${this.retTypeExpr_.toString()}`;
	}

	evalInternal(scope) {
		let argTypes = this.argTypeExprs_.map(a => a.eval(scope));

		let retType = this.retTypeExpr_.eval(scope);

		return new FuncType(argTypes, retType);
	}
}

class ValueExpr extends Expr {
	constructor(site) {
		super(site);
	}

	// ValueExpr should be indented to make debugging of the IR easier
	toUntyped(indent = "") {
		throw new Error("not implemented");
	}
}

class AssignExpr extends ValueExpr {
	constructor(site, name, typeExpr, upstreamExpr, downstreamExpr) {
		super(site);
		this.name_ = name;
		this.typeExpr_ = typeExpr; // is optional
		this.upstreamExpr_  = upstreamExpr;
		this.downstreamExpr_ = downstreamExpr;
	}

	toString() {
		let downstreamStr = this.downstreamExpr_.toString();
		assert(downstreamStr != undefined);

		let typeStr = "";
		if (this.typeExpr_ != null) {
			typeStr = `: ${this.typeExpr_.toString()}`;
		}
		return `${this.name_.toString()}${typeStr} = ${this.upstreamExpr_.toString()}; ${downstreamStr}`;
	}

	evalInternal(scope) {
		let subScope = new Scope(scope);

		let upstreamVal = this.upstreamExpr_.eval(scope);

		assert(upstreamVal.isValue());

		if (this.typeExpr_ != null) {
			let type = this.typeExpr_.eval(scope);
			
			assert(type.isType());

			if (!upstreamVal.isInstanceOf(this.upstreamExpr_.site, type)) {
				this.upstreamExpr_.typeError(`expected ${type.toString()}, got ${upstreamVal.toString()}`);
			}
		} else {
			if (!(this.upstreamExpr_.isLiteral())) {
				this.typeError("unable to infer type of assignment rhs");
			}
		}
		
		subScope.set(this.name_, upstreamVal.copy());

		let downstreamVal = this.downstreamExpr_.eval(subScope);

		subScope.assertAllUsed();

		return downstreamVal;
	}

	toUntyped(indet = "") {
		return `(${this.name_.toString()}) -> {${indent}${TAB}${this.downstreamExpr_.toUntyped(indent + TAB)}\n${indent}}(${this.upstreamExpr_.toUntyped(indent)})`;
	}
}

class PrintExpr extends Expr {
	constructor(site, msgExpr, downstreamExpr) {
		super(site);
		this.msgExpr_ = msgExpr;
		this.downstreamExpr_ = downstreamExpr;
	}

	toString() {
		let downstreamStr = this.downstreamExpr_.toString();
		assert(downstreamStr != undefined);
		return `print(${this.msgExpr_.toString()}); ${downstreamStr}`;
	}

	evalInternal(scope) {
		let subScope = new Scope(scope);

		let msgVal = this.msgExpr_.eval(scope);

		assert(msgVal.isValue());

		if (!msgVal.isInstanceOf(this.msgExpr_.site, StringType)) {
			this.msgExpr_.typeError("expected string arg for print");
		}
		
		let downstreamVal = this.downstreamExpr_.eval(scope);

		return this.downstreamExpr_.eval(scope);
	}

	toUntyped(indent = "") {
		return `__core__trace(__helios__common__unStringData(${this.msgExpr_.toUntyped(indent)}), () -> {\n${indent}${TAB}${this.downstreamExpr_.toUntyped(indent + TAB)}\n${indent}})()`;
	}
}

class PrimitiveLiteralExpr extends Expr {
	constructor(primitive) {
		super(primitive.site);
		assert(primitive instanceof PrimitiveLiteral);
		this.primitive_ = primitive;
	}

	toString() {
		return this.primitive_.toString();
	}

	evalInternal(scope) {
		if (this.primitive_ instanceof IntLiteral) {
			return new DataValue(new IntType());
		} else if (this.primitive_ instanceof BoolLiteral) {
			return new DataValue(new BoolType());
		} else if (this.primitive_ instanceof StringLiteral) {
			return new DataValue(new StringType());
		} else if (this.primitive_ instanceof ByteArrayLiteral) {
			return new DataValue(new ByteArrayType());
		} else {
			throw new Error("unhandled primitive type");
		}
	}

	toUntyped(indent = "") {
		let inner = this.primitive_.toUntyped(indent);
		if (this.primitive_ instanceof IntLiteral) {
			return `__core__iData(${inner})`;
		} else if (this.primitive_ instanceof BoolLiteral) {
			return `__helios__common__boolData(${inner})`;
		} else if (this.primitive_ instanceof StringLiteral) {
			return `__helios__common__stringData(${inner})`;
		} else if (this.primitive_ instanceof ByteArrayLiteral) {
			return `__core__bData(${inner})`;
		} else {
			throw new Error("unhandled primitive type");
		}
	}
}

class StructLiteralField {
	constructor(name, value) {
		this.name_ = name;
		this.value_ = value;
	}

	get site() {
		return this.name_.site;
	}

	get name() {
		return this.name_;
	}

	toString() {
		return `${this.name_}: ${this.value_.toString()}`;
	}

	eval(scope) {
		return this.value_.eval(scope);
	}

	toUntyped(indent = "") {
		return toData(this.value_.toUntyped(indent), this.value_.evalType());
	}
}

class StructLiteralExpr extends Expr {
	constructor(typeExpr, fields) {
		super(typeExpr.site);
		this.typeExpr_ = typeExpr;
		this.fields_ = fields; // list of StructLiteralField
		this.constrIndex_ = null;
	}

	isLiteral() {
		return true;
	}

	toString() {
		return `${this.typeExpr_.toString()}{${this.fields_.map(f => f.toString()).join(", ")}}`;
	}

	evalInternal(scope) {
		let type = this.typeExpr_.eval(scope);

		assert(type.isType());

		this.constrIndex_ = type.getConstrIndex(this.site);

		let refInstance = Value.new(type);

		if (refInstance.nFields(this.site) != this.fields_.length) {
			this.typeError("wrong number of fields");
		}

		for (let f of this.fields_) {
			if (!f.eval(scope).isInstanceOf(f.site, refInstance.getInstanceMember(f.name).getType(this.site))) {
				f.typeError("wrong type");
			}
		}
	}

	toUntyped(indent = "") {
		let res = "__core__mkNilData(())";

		let fields = this.fields_.slice().reverse();

		for (let f of fields) {
			res = `__core__mkCons(${f.toUntyped(indent)}, ${res})`;
		}

		let idx = this.constrIndex_;

		return `__core__constrData(${idx.toString()}, ${res})`;
	}
}

class ListLiteralExpr extends Expr {
	constructor(site, itemTypeExpr, itemExprs) {
		super(site);
		this.itemTypeExpr_ = itemTypeExpr;
		this.itemExprs_ = itemExprs;
		this.itemType_ = null;
	}

	isLiteral() {
		return true;
	}

	toString() {
		return `[]${this.itemTypeExpr_.toString()}{${this.itemExprs_.map(itemExpr => itemExpr.toString()).join(', ')}}`;
	}

	evalInternal(scope) {
		let itemType = this.itemTypeExpr_.eval(scope);

		if (itemType instanceof FuncType) {
			this.itemTypeExpr_.typeError("content of list can't be func");
		}

		assert(itemType.isType());

		for (let itemExpr of this.itemExprs_) {
			let itemVal = itemExpr.eval(scope);

			if (!itemVal.isInstanceOf(itemExpr.site, itemType)) {
				itemExpr.typeError(`expected ${itemType.toString()}, got ${itemVal.toString()}`);
			}
		}

		this.itemType_ = itemType;

		return Value.new(new ListType(itemType));
	}

	toUntyped(indent = "") {
		// unsure if list literals in untyped plutus-core accept arbitrary terms, so we will use the more verbose constructor functions 
		let res = "__core__mkNilData(())";

		// starting from last element, keeping prepending a data version of that item

		for (let i = this.itemExprs_.length - 1; i >= 0; i--) {
			res = `__core__mkCons(${this.itemExprs_[i].toUntyped(indent)}, ${res})`;
		}

		return `__core__listData(${res})`;
	}
}

class NameTypePair {
	constructor(name, typeExpr) {
		this.name_ = name;
		this.typeExpr_ = typeExpr;
	}

	get name() {
		return this.name_;
	}

	toString() {
		return `${this.name.toString()}: ${this.typeExpr_.toString()}`;
	}

	evalType(scope) {
		let type = this.typeExpr_.eval(scope);
		assert(type.isType());

		return type;
	}

	toUntyped() {
		return this.name_.toString();
	}
}

class FuncArg extends NameTypePair {
	constructor(name, typeExpr) {
		super(name, typeExpr);
	}
}

class FuncLiteralExpr extends Expr {
	constructor(site, args, retTypeExpr, bodyExpr) {
		super(site);
		this.args_ = args;
		this.retTypeExpr_ = retTypeExpr;
		this.bodyExpr_ = bodyExpr;
	}

	isLiteral() {
		return true;
	}

	toString() {
		return `(${this.args_.map(a => a.toString()).join(", ")}) -> ${this.retTypeExpr_.toString()} {${this.bodyExpr_.toString()}}`;
	}

	evalType(scope) {
		let argTypes = this.args_.map(a => a.evalType(scope));
		let retType = this.retTypeExpr_.eval(scope);

		return new FuncType(argTypes, retType);
	}

	evalInternal(scope) {
		let argTypes = this.args_.map(a => a.evalType(scope));
		let retType = this.retTypeExpr_.eval(scope);

		let res = new FuncValue(new FuncType(argTypes, retType));

		let subScope = new Scope(scope);

		for (let a of argTypes) {
			subScope.set(a.name, Value.new(a));
		}

		assert(retType.isType());

		let bodyVal = this.bodyExpr_.eval(subScope);

		if (!bodyVal.isInstanceOf(this.retTypeExpr_.site, retType)) {
			this.retTypeExpr_.typeError("wrong return type");
		}

		return res;
	}

	maybeMethod() {
		return this.args_.length > 0 && this.args_[0].name.toString() == "self";
	}

	toUntypedRecursive(recursiveName, indent = "") {
		assert(recursiveName != null);

		let args = this.args_.map(a => a.toUntyped());

		args.unshift(recursiveName);

		return `(${args.join(", ")}) -> {\n${indent}${TAB}${this.bodyExpr_.toUntyped(indent + TAB)}\n${indent}}`;
	}

	toUntyped(indent = "") {
		let args = this.args_.map(a => a.toUntyped());
		
		return `(${args.join(", ")}) -> {\n${indent}${TAB}${this.bodyExpr_.toUntyped(indent + TAB)}\n${indent}}`;
	}
}

class ValueRefExpr extends Expr {
	constructor(name) {
		super(name.site);
		this.name_ = name;
	}

	toString() {
		return this.name_.toString();
	}

	eval(scope) {
		let val = scope.get(this.name_);

		if (!val.isValue()) {
			this.typeError("not a value");
		}

		return val;
	}

	toUntyped(indent = "") {
		return this.toString();
	}
}

class ValuePathExpr extends Expr {
	constructor(baseTypeExpr, memberName) {
		assert(baseTypeExpr instanceof TypeRefExpr || baseTypeExpr instanceof TypePathExpr);
		// root is always some type
		this.baseTypeExpr_ = baseTypeExpr;
		this.memberName_ = memberName;
	}

	toString() {
		return `${this.baseTypeExpr_.toString()}::${this.memberName_.toString()}`;
	}

	eval(scope) {
		let baseType = this.baseTypeExpr_.eval(scope);
		assert(baseType.isType());

		let memberVal = baseType.getTypeMember(this.memberName_);
		if (!memberVal.isValue()) {
			this.typeError("member is not a value");
		}

		return memberVal;
	}

	toUntyped(indent = "") {
		return `${this.baseTypeExpr_.toUntyped()}__${this.memberName_.toString()}`;
	}
}

class UnaryExpr extends Expr {
	constructor(op, a) {
		super(op.site);
		this.op_ = op;
		this.a_ = a;
		this.aVal_ = a;
	}

	toString() {
		return `${this.op_.toString()}${this.a_.toString()}`;
	}

	translateOp() {
		let op = this.op_.toString();
		let site = this.op_.site;

		let name;

		if (op == "+") {
			name = "__pos";
		} else if (op == "-") {
			name = "__neg";
		} else if (op == "!") {
			name = "__not";
		}

		return new Word(site, name);
	}

	evalInternal(scope) {
		let a = this.a_.eval(scope);
		assert(a.isValue());
		this.fnVal_ = a.getInstanceMember(this.translateOp());
		this.aType_ = a.getType();

		return this.fnVal_.call(this.op_.site, []);
	}

	toUntyped(indent = "") {
		let path = this.aType_.toUntyped();
		return `${path}__${this.translateOp().value}(${this.a_.toUntyped(indent)})()`;
	}
}

class BinaryExpr extends Expr {
	constructor(op, a, b) {
		super(op.site);
		this.op_ = op;
		this.a_ = a;
		this.b_ = b;
		this.aType_ = null;
		this.fnVal_ = null;
	}

	toString() {
		return `${this.a_.toString()} ${this.op_.toString()} ${this.b_.toString()}`;
	}

	translateOp() {
		let op = this.op_.toString();
		let site = this.op_.site;
		let name;

		if (op == "||") {
			name = "__or";
		} else if (op == "&&") {
			name = "__and";
		} else if (op == "==") {
			name = "__eq";
		} else if (op == "!=") {
			name = "__neq";
		} else if (op == "<") {
			name = "__lt";
		} else if (op == "<=") {
			name = "__leq";
		} else if (op == ">") {
			name = "__gt";
		} else if (op == ">=") {
			name = "__geq";
		} else if (op == "+") {
			name = "__add";
		} else if (op == "-") {
			name = "__sub";
		} else if (op == "*") {
			name = "__mul";
		} else if (op == "/") {
			name = "__div";
		} else if (op == "%") {
			name = "__mod";
		} else {
			throw new Error("unhandled");
		}

		return new Word(site, name);
	}

	evalInternal(scope) {
		let a = this.a_.eval(scope);
		let b = this.b_.eval(scope);
		assert(a.isValue() && b.isValue());
		this.aType_ = a.getType(this.site);
		this.fnVal_ = a.getInstanceMember(this.translateOp());

		return this.fnVal_.call(this.op_.site, [b]);
	}

	toUntyped(indent = "") {
		let path = this.aType_.toUntyped();

		let op = this.translateOp().value;

		if (op == "__and") {
			return `${path}__and(
${indent}${TAB}() -> {${this.a_.toUntyped()}},
${indent}${TAB}() -> {${this.b_.toUntyped()}}
${indent})`;
		} else if (op == "__or") {
			return `${path}__or(
${indent}${TAB}() -> {${this.a_.toUntyped()}},
${indent}${TAB}() -> {${this.b_.toUntyped()}}
			)`;
		} else {
			return `${path}__${this.translateOp().value}(${this.a_.toUntyped(indent)})(${this.b_.toUntyped(indent)})`;
		}
	}
}

class ParensExpr extends Expr {
	constructor(site, expr) {
		super(site);
		this.expr_ = expr;
	}

	toString() {
		return `(${this.expr_.toString()})`;
	}

	evalInternal(scope) {
		return this.expr_.eval(scope);
	}

	toUntyped(indent = "") {
		return this.expr_.toUntyped(indent);
	}
}

class CallExpr extends Expr {
	constructor(site, fnExpr, argExprs) {
		super(site);
		this.fnExpr_ = fnExpr;
		this.argExprs_ = argExprs;
		this.recursive_ = false;
	}

	toString() {
		return `${this.fnExpr_.toString()}(${this.argExprs_.map(a => a.toString()).join(", ")})`;
	}

	evalInternal(scope) {
		let fnVal = this.fnExpr_.eval(scope);

		let argVals = this.argExprs_.map(argExpr => {
			let argVal = argExpr.eval(scope);
			assert(argVal.isValue());
			return argVal; 
		});

		if (fnVal.isRecursive()) {
			this.recursive_ = true;
		}

		return fnVal.call(this.site, argVals);
	}

	toUntyped(indent = "") {
		if (this.recursive_) {
			let innerArgs = this.argExprs_.map(a => a.toUntyped(indent + TAB));
			innerArgs.unshift("fn");
			return `(fn) -> {\n${indent}${TAB}fn(${innerArgs.join(", ")})\n${indent}}(${this.fnExpr_.toUntyped(indent)})`;
		} else {
			let innerArgs = this.argExprs_.map(a => a.toUntyped(indent));
			return `${this.fnExpr_.toUntyped(indent)}(${innerArgs.join(", ")})`;
		}
	}
}

class MemberExpr extends Expr {
	constructor(site, objExpr, memberName) {
		super(site);
		this.objExpr_ = objExpr;
		this.memberName_ = memberName;
		this.baseType_ = null;
	}
	
	toString() {
		return `${this.objExpr_.toString()}.${this.memberName_.toString()}`;
	}

	evalInternal(scope) {
		let objVal = this.objExpr_.eval(scope);
		assert(objVal.isValue());

		let member = objVal.getInstanceMember(this.memberName_);
		assert(member.isValue());

		this.baseType_ = objVal.getType();

		return member;
	}

	toUntyped(indent = "") {
		// members can be functions so, field getters are also encoded as functions for consistency
		return `${this.baseType_.toUntyped()}__${this.memberName_.toString()}(${this.objExpr_.toUntyped(indent)})`;
	}
}

class IfElseExpr extends Expr {
	constructor(site, conditions, branches) {
		assert(branches.length == conditions.length + 1);
		assert(branches.length > 1);

		super(site);
		this.conditions_ = conditions;
		this.branches_ = branches;
	}

	toString() {
		let s = "";
		for (let i = 0; i < this.conditions_.length; i++) {
			s += `if (${this.conditions_[i].toString()}) {${this.branches_[i].toString()}} else `;
		}

		s += `{${this.branches_[this.conditions_.length].toString()}}`;

		return s;
	}

	static reduceBranchType(site, prevType, newType) {
		if (prevType == null) {
			return newType;
		} else if (!prevType.isBaseOf(site, newType)) {
			if (newType.isBaseOf(site, prevType)) {
				return newType;
			} else {
				site.typeError("inconsistent types");
			}
		} else {
			return prevType;
		}
	}

	evalInternal(scope) {
		for (let c of this.conditions_) {
			let cVal = c.eval(scope);
			if (!cVal.isInstanceOf(c.site, BoolType)) {
				c.typeError("expected bool");
			}
		}

		let branchType = null;
		for (let b of this.branches_) {
			let branchVal = b.branch(scope);

			branchType = IfElseExpr.reduceBranchType(b.site, branchType, branchVal.getType());
		}

		return Value.new(branchType);
	}

	toUntyped(indent = "") {
		let n = this.conditions_.length;

		// each branch actually returns a function to allow deferred evaluation
		let res = `() -> {${this.branches_[n].toUntyped(indent)}}`;

		// TODO: nice indentation
		for (let i = n-1; i >= 0; i--) {
			res = `__core__ifThenElse(__helios__common__unBoolData(${this.conditions_[i].toUntyped(indent)}), () -> {${this.branches_[i].toUntyped(indent)}}, () -> {${res}()})`;
		}

		return res + "()";
	}
}

class SwitchCase extends Token {
	constructor(site, varName, typeExpr, bodyExpr) {
		super(site);
		this.varName_ = varName; // optional
		this.typeExpr_ = typeExpr; // not optional
		this.bodyExpr_ = bodyExpr;
		this.constrIndex_ = null;
	}

	get constrIndex() {
		return this.constrIndex_;
	}

	toString() {
		if (this.varName_ == null) {
			return `case ${this.typeExpr_.toString()} {${this.bodyExpr_.toString()}}`
		} else {
			return `case (${this.varName_.toString()} ${this.typeExpr_.toString()}) {${this.bodyExpr_.toString()}}`;
		}
	}

	eval(scope) {
		let type = this.typeExpr_.eval(scope);
		assert(type.isType());

		if (this.varName_ != null) {
			let caseScope = new Scope(scope);

			caseScope.set(this.varName_, Value.new(type));

			let bodyVal = this.bodyExpr_.eval(caseScope);

			caseScope.assertAllUsed();

			return bodyVal;
		} else {
			return this.bodyExpr_.eval(scope);
		}
	}

	evalCond(scope, switchParentType) {
		let caseType = this.typeExpr_.eval(scope, switchParentType);
		assert(caseType.isType());

		if (!switchParentType.isBaseOf(this.typeExpr_.site, caseType)) {
			this.typeExpr_.typeError("switching over wrong type");
		}

		this.constrIndex_ = caseType.getConstrIndex(this.typeExpr_.site);
	}

	toUntyped(indent = "") {
		return `(${this.varName_ != null ? this.varName_.toString() : "_"}) -> {
${indent}${TAB}${this.bodyExpr_.toUntyped(indent + TAB)}
${indent}}`;
	}
}

class SwitchDefault extends Token {
	constructor(site, bodyExpr) {
		super(site);
		this.bodyExpr_ = bodyExpr;
	}
	
	toString() {
		return  `default {${this.bodyExpr_.toString()}}`;
	}

	eval(scope) {
		return this.bodyExpr_.eval(scope);
	}

	toUntyped(indent = "") {
		return `(_) -> {\n${indent}${TAB}${this.body_.toUntyped(indent + TAB)}\n${indent}}`;
	}
}

class SwitchExpr extends Expr {
	constructor(site, expr, cases, default_ = null) {
		super(site);
		this.expr_ = expr;
		this.cases_ = cases;
		this.default_ = default_;
	}

	toString() {
		return `switch(${this.expr_.toString()}) ${this.cases_.map(c => c.toString()).join(" ")}${this.default_ == null ? "" : " " + this.default_.toString()}`;
	}

	eval(scope) {
		let switchVal = this.expr_.eval(scope);

		let switchParentType = switchVal.getType(this.site).getParentType(this.site); 

		let branchType = null;
		for (let c of this.cases_) {
			let branchVal = c.eval(scope);

			branchType = IfElseExpr.reduceBranchType(c.site, branchType, branchVal.getType(c.site));

			c.evalCond(scope);
		}

		if (this.default_ != null) {
			let defaultVal = this.default_.eval(scope);
			branchType = IfElseExpr.reduceBranchType(this.default_.site, branchType, defaultVal.getType(this.default_.site));
		} else {
			if (switchParentType.nMembers() > this.cases_.length) {
				this.typeError("insufficient coverage in switch expression");
			}
		}

		return Value.new(branchType);
	}

	toUntyped(indent = "") {
		// easier to include default in case
		let cases = this.cases_.slice();
		if (this.default_ != null) {
			cases.push(this.default_);
		}

		let n = cases.length;

		// TODO: nice indentation
		let res = cases[n-1].toUntyped(indent + TAB + TAB + TAB);

		for (let i = n-2; i >= 0; i--) {
			res = `__core__ifThenElse(__core__equalsInteger(i, ${cases[i].constrIndex.toString()}), () -> {${cases[i].toUntyped(indent + TAB + TAB + TAB)}}, () -> {${res}})()`;
		}

		return `(e) -> {
${indent}${TAB}(
${indent}${TAB}${TAB}(i) -> {
${indent}${TAB}${TAB}${TAB}${res}
${indent}${TAB}${TAB}}(__core__fstPair(__core__unConstrData(e)))
${indent}${TAB})(e)
${indent}}(${this.expr_.toUntyped(indent)})`;
	}
}


////////////////////////////////////
// Section 10: AST statement objects
////////////////////////////////////

// statements don't return a value from eval(scope)
class Statement extends Token {
	constructor(site) {
		super(site);
	}

	assertAllMembersUsed() {
	}
}

class NamedStatement extends Statement {
	constructor(site, name) {
		super(site);
		this.name_ = name;
	}

	get name() {
		return this.name_;
	}
}

class ConstStatement extends NamedStatement {
	constructor(site, name, typeExpr, valueExpr) {
		super(site, name);
		this.typeExpr_ = typeExpr; // can be null in case of type inference
		this.valueExpr_ = valueExpr;
		this.type_ = null;
	}

	toString() {
		return `const ${this.name.toString()}${this.typeExpr_ == null ? "" : ": " + this.typeExpr_.toString()} = ${this.valueExpr_.toString()};`;
	}

	evalInternal(scope) {
		let value = this.valueExpr_.eval(scope);

		if (this.typeExpr_ == null) {
			if (!this.valueExpr_.isLiteral()) {
				this.typeError("can't infer type");
			}

			this.type_ = value.getType();
		} else {
			this.type_ = this.typeExpr_.eval(scope);

			assert(this.type_.isType());

			if (!value.isInstanceOf(this.valueExpr_.site, this.type_)) {
				this.valueExpr_.typeError("wrong type");
			}
		}

		return Value.new(this.type_);
	}

	eval(scope) {
		scope.set(this.name, this.evalInternal(scope));
	}

	toUntypedInternal() {
		return this.valueExpr_.toUntyped();
	}

	toUntyped(map) {
		map.set(this.name.toString(), this.toUntypedInternal());
	}
}

class DataField extends NameTypePair {
	constructor(name, typeExpr) {
		super(name, typeExpr);
	}
}

class DataDefinition extends NamedStatement {
	constructor(site, name, fields) {
		super(site, name);
		this.fields_ = fields; // list of StructField
		this.fieldTypes_ = null;
		this.constrIndex_ = 0;
		this.registry_ = new ImplRegistry();
		this.fieldsUsed_ = new Set();
		this.autoMembersUsed_ = new Set();

		for (let f of this.fields_) {
			if (this.hasAutoMember(f.name)) {
				f.name.referenceError("reserved member");
			}
		}
	}

	// returns an index, -1 if not found
	findField(name) {
		let found = -1;
		let i = 0;
		for (let f of this.fields_) {
			if (f.name.toString() == name.toString()) {
				found = i;
				break;
			}
			i++;
		}

		return found;
	}

	toString() {
		return `${this.name_.toString()} {${this.fields_.map(f => f.toString()).join(", ")}}`;
	}

	evalInternal(scope) {
		this.fieldTypes_ = this.fields_.map(f => {
			let fieldType = f.evalType(scope);
			
			if (fieldType instanceof FuncType) {
				f.typeError("field can't be function type");
			}

			return fieldType;
		});

		return new UserType(this);
	}

	eval(scope) {
		scope.set(this.name, this.evalInternal(scope));
	}

	hasAutoMember(name) {
		switch(name.toString()) {
			case "trace":
			case "serialize":
				return true;
		}

		return false;
	}

	setImplAssoc(name, value) {
		if (this.findField(name) != -1) {
			name.referenceError("name of assoc member can't be same as field");
		} else if (this.hasAutoMember(name)) {
			name.referenceError("name of assoc member can't be same as auto member");
		}

		this.registry_.setAssoc(name, value);
	}

	setImplMethod(name, value) {
		if (this.findField(name) != -1) {
			name.referenceError("name of method member can't be same as field");
		}

		this.registry_.setMethod(name, value);
	}

	// otherType has already been unwrapped from UserType
	isBaseOf(other) {
		return this == other;
	}

	nFields(site) {
		return this.fields_.length;
	}

	getTypeMember(name) {
		return this.registry_.getAssoc(name); // this is easy because there is no 'self', path will be __MyStruct__MyMember
	}

	getInstanceMember(name, dryRun = false) {
		if (this.hasAutoMember(name)) {
			switch(name.toString()) {
				case "serialize":
					if (!dryRun) {
						this.autoMembersUsed_.add(name.toString());
					}
					return Value.new(new FuncType([], new ByteArrayType()));
				default:
					throw new Error("unhandled automember");
			}
		} else {
			let i = this.findField(name);

			if ( !this.fields_.has(name.toString())) {
				if (this.registry_.has(name)) {
					return this.registry_.getMethod(name, dryRun);
				} else {
					name.referenceError(`\'${this.name_.toString()}.${name.toString()}\' undefined`);
				}
			} else {
				if (!dryRun) {
					this.fieldsUsed_.add(name.toString());
				}
				return Value.new(this.fieldTypes_[i]);
			}
		}	
	}

	getConstrIndex(site) {
		return this.constrIndex_;
	}

	assertAllMembersUsed() {
		for (let f of this.fields_) {
			if (!this.fieldsUsed_.has(f.name.toString())) {
				f.name.referenceError("field unused");
			}
		}
	}

	getPath() {
		return `__user__${this.name.toString()}`;
	}

	toUntyped(map) {
		for (let i = 0; i < this.fields_.length; i++) {
			let f = this.fields_[i];
			let key = `${this.getPath()}__${f.name.toString()}`;

			let inner = `__core__sndPair(self)`;			
			for (let j = 0; j < i; j++) {
				inner = `__core__tailList(${inner})`;
			}

			let getter = `(self) -> {
				${fromData(`__core__headList(${inner})`, this.memberTypes_[i])}
			}`;

			map.set(key, getter)
		}

		for (let auto of this.autoMembersUsed_) {
			switch(auto) {
				case "serialize":
					map.set(auto, `(self) -> {
						() -> {__core__serialiseData(self)}
					}`);
					break;
				case "__eq":
					map.set(auto, `(self) -> {
						(other) -> {__core__equalsData(self, other)}
					}`);
					break;
				case "__neq":
					map.set(auto, `(self) -> {
						(other) -> {__helios__bool____not(__core__equalsData(self, other))}
					}`);
					break;
				default:
					throw new Error("unhandled auto member");
			}
		}
	}
}

class StructStatement extends DataDefinition {
	constructor(site, name, fields) {
		super(site, name, fields);
	}

	toString() {
		return "struct " + super.toString();
	}

	hasAutoMember(name) {
		switch(name.toString()) {
			case "__eq":
			case "__neq":
				return true;
		}

		return super.hasAutoMember(name);
	}

	getInstanceMember(name, dryRun = false) {
		if (this.hasAutoMember(name)) {
			switch(name.toString()) {
				case "__eq":
				case "__neq":
					if (!dryRun) {
						this.autoMembersUsed_.add(name.toString());
					}
					return Value.new(new FuncType([new UserType(this), new UserType(this)], new BoolType()));
			}
		}

		return super.getInstanceMember(name);
	}
}

class FuncStatement extends NamedStatement {
	constructor(site, name, funcExpr) {
		super(site, name);
		this.funcExpr_ = funcExpr;
		this.recursive_ = false;
	}

	toString() {
		return `func ${this.name.toString()}${this.funcExpr_.toString()}`;
	}

	evalInternal(scope) {
		return this.funcExpr_.evalInternal(scope);
	}

	evalType(scope) {
		return this.funcExpr_.evalType(scope);
	}

	eval(scope) {
		// add to scope before evaluating, to allow recursive calls

		let fnVal = new TopFuncValue(this.evalType(scope));
		
		scope.set(this.name, fnVal);

		void this.evalInternal(scope);
		
		if (fnVal.isRecursive()) {
			this.recursive_ = true;
		}
	}

	maybeMethod() {
		return this.funcExpr_.maybeMethod();
	}

	// no need to specify indent, Statement is at top level
	toUntyped(map) {
		let def;
		if (this.recursive_) {
			def = this.funcExpr_.toUntypedRecursive(this.name.toString(), TAB);
		} else {
			def = this.funcExpr_.toUntyped(TAB);
		}

		map.set(this.name.toString(), def);
	}
}

class EnumMember extends DataDefinition {
	constructor(name, fields) {
		super(name.site, name, fields);
		this.parent_ = null;
	}

	registerParent(parent, i) {
		this.parent_ = parent;
		this.constrIndex_ = i;
	}

	eval(scope) {
		super.eval(scope);

		for (let f of this.fields_) {
			let fType = f.evalType(scope);

			this.parent_.maybeSetAutoMember(f.name, Value.new(fType));
		}
	}

	setImplAssoc(name, value) {
		// make sure parent doesn't already have a assoc or method member with the same name
		if (this.parent_.hasMember(name)) {
			name.referenceError("name already used by parent enum");
		}

		super.setImplAssoc(name, value);
	}

	setImplMethod(name, value) {
		// make sure parent doesn't already have a assoc or method member with the same name
		if (this.parent_.hasMember(name)) {
			name.referenceError("name already used by parent enum");
		}

		super.setImplMember(name, value);

		// now check if all other enum members implement that same function
		this.parent_.maybeSetAutoMember(name, value);
	}

	getPath() {
		return `${this.parent_.getPath()}__${this.name.toString()}`;
	}
}

class EnumStatement extends NamedStatement {
	constructor(site, name, members) {
		super(site, name);
		this.members_ = members; // list of EnumMember
		this.membersUsed_ = new Set();
		this.memberTypes_ = null;
		this.registry_ = new ImplRegistry(); // methods and associated consts/funcs
		this.autoMembers_ = new Map();
		this.autoMembersUsed_ = new Set();

		for (let i = 0; i < this.members_.length; i++) {
			this.members_[i].registerParent(this, i);
		}
	}

	// returns an index
	findEnumMember(name) {
		let found = -1;
		let i = 0;
		for (let member of this.members_) {
			if (member.name.toString() == name.toString()) {
				found = i;
				break;
			}
			i++;
		}

		return found;
	}

	hasMember(name) {
		if (this.findEnumMember(name) != -1) {
			return true;
		} else {
			return this.registry_.has(name);
		}
	}

	toString() {
		return `enum ${this.name.toString()} {${this.members_.map(m => m.toStringInternal()).join(", ")}}`;
	}

	eval(scope) {
		this.memberTypes_ = this.members_.map(m => m.evalInternal(scope));

		scope.set(this.name, new UserType(this));
	}

	setImplAssoc(name, value) {
		if (this.findEnumMember(name) != -1) {
			name.referenceError("assoc member can have same name as enum type member");
		}

		this.registry_.setAssoc(name, value);
	}

	setImplMethod(name, value) {
		name.typeError("can't impl method directly on base type of enum");
	}

	maybeSetAutoMember(name, value) {
		let type = value.getType();

		// check that all members have the same field

		let retType = null;
		for (let m of this.members_) {
			try {
				let mVal = m.getInstanceMember(name, true);
				let mType = mVal.getType(name.site);

				if (!(mType instanceof FuncType)) {
					return;
				}

				if (type instanceof FuncType) {
					// all args must be exactly the same
					if (!type.hasSameArgs(mType)) {
						return;
					}

					retType = IfElseExpr.reduceBranchType(type.retType, mType.retType);
				} else {
					retType = IfElseExpr.reduceBranchType(retType, mVal.getType(name.site));
				}
			} catch (e) {
				// don't set auto member if any error is encountered
				return;
			}
		}

		let autoType;

		if (type instanceof FuncType) {
			autoType = new FuncType(type.argTypes, retType);
		} else {
			autoType = retType;
		}

		this.autoMembers_.set(name.toString(), autoType);
	}

	// other has already been 'unwrapped' from UserType
	isBaseOf(other) {
		return this == other || this.members_.findIndex(m => m == other) != -1;
	}

	nFields(site) {
		site.typeError("enum doesn't have fields");
	}

	getInstanceMember(name, dryRun = false) {
		if (this.autoMembers_.has(name.toString())) {
			if (!dryRun) {
				this.autoMembersUsed_.add(name.toString());
			}
			return Value.new(this.autoMembers_.get(name.toString()));
		} else {
			name.typeError("undefined enum member");
		}
	}

	getTypeMember(name) {
		let i = this.findEnumMember(name);
		if (i == -1) {
			if (this.registry_.has(name)) {
				return this.registry_.getAssoc(name);
			} else {
				name.referenceError(`${this.name.toString()}::${name.toString()} undefined`);
			}
		} else {
			this.membersUsed_.set(name.toString())
			return this.memberTypes_[i];
		}
	}

	getConstrIndex(site) {
		site.typeError("can't construct an enum directly (cast to a concrete type first)");
	}

	assertAllMembersUsed() {
		for (let m of this.members_) {
			if (!this.membersUsed_.has(m.name.toString())) {
				m.name.referenceError("unused");
			}

			m.assertAllMembersUsed();
		}
	}

	getPath() {
		return `__user__${this.name.toString()}`;
	}

	toUntyped(map) {
		for (let pair of this.autoMembers_) {
			let name = pair[0];

			if (this.autoMembersUsed_.has(name)) {
				let n = this.members_.length;
				let inner = `${this.members_[n-1].getPath()}__${name.toString()}`;
				for (let i = n-2; i >= 0; i--) {
					inner = `__core__ifThenElse(__core__equalsInteger(constrIdx, ${i}), ${this.members_[i].getPath()}__${name.toString()}, ${inner})`;
				}
		
				let autoDef = `(self) -> {
					(constrIdx) -> {
						${inner}
					}(__core__fstPair(__core__unConstrData(self)))(self)
				}`;

				map.set(`${this.getPath()}__${name}`, autoDef);
			}
		}
	}
}

class ImplRegistry {
	constructor() {
		this.methods_ = [];
		this.assocs_ = [];

		this.used_ = new Set(); // set of names as strings
	}

	findMethod(name) {
		return this.methods_.findIndex(pair => pair[0].toString() == name.toString);
	}

	findAssoc(name) {
		return this.assocs_.findIndex(pair => pair[0].toString() == name.toString);
	}

	has(name) {
		return this.findMethod(name) != -1 || this.findAssoc(name) != -1;
	}

	setAssoc(name, value) {
		if (this.has(name)) {
			name.referenceError("impl member with same name already set");
		}

		this.assocs_.push([name, value]);
	}

	setMethod(name, value) {
		if (this.has(name)) {
			name.referenceError("impl member with same name already set");
		}

		this.methods_.push([name, value]);
	}

	getAssoc(name, dryRun = false) {
		let i = this.findAssoc(name);
		if (i == -1) {
			name.referenceError("impl not found");
		}

		if (!dryRun) {
			this.used_.add(name.toString());
		}

		return this.assocs_[i][1];
	}

	getMethod(name, dryRun = false) {
		let i = this.findMethod(name);
		if (i == -1) {
			name.referenceError("impl not found");
		}

		if (!dryRun) {
			this.used_.add(name.toString());
		}

		return this.methods_[i][1];
	}

	assertAllMembersUsed() {
		for (let pair of this.methods_) {
			if (!this.used_.has(this.used_.pair[0].toString())) {
				pair[0].referenceError("impl unused");
			}
		}

		for (let pair of this.assocs_) {
			if (!this.used_.has(this.used_.pair[0].toString())) {
				pair[0].referenceError("impl unused");
			}
		}
	}
}

class ImplStatement extends Statement {
	constructor(site, typeExpr, statements) {
		super(site);
		assert(typeExpr instanceof TypeRefExpr || typeExpr instanceof TypePathExpr);
		this.typeExpr_ = typeExpr;
		this.statements_ = statements;
		this.typeStatementRef_ = null;
	}

	toString() {
		return `impl ${this.typeExpr_.toString()} {${this.statements_.map(s => s.toString())}}`;
	}

	eval(scope) {
		let type = this.typeExpr_.eval(scope);
		if (!(type instanceof UserType)) {
			this.typeExpr_.referenceError("not a user-type");
		}
		
		this.typeStatementRef_ = type.statement_;
		assert(this.typeStatementRef_ instanceof StructStatement || this.typeStatementRef_ instanceof EnumStatement);
		let refType = new UserType(this.typeStatementRef_);

		for (let s of this.statements_) {
			if (s instanceof ConstStatement) {
				let constVal = s.evalInternal(scope);
				let constType = constVal.getType(s.site);

				if (Type.same(s.site, constType, refType)) {
					this.typeStatementRef_.setImplAssoc(s.name, constVal);
				} else {
					s.typeError("not associated");
				}
			} else if (s instanceof FuncStatement) {
				let fnType = s.evalType(scope);
				let fnVal = Value.new(fnType);

				if (s.maybeMethod() && fnType.maybeMethod(s.site, new UserType(this.typeStatementRef_))) {
					this.typeStatementRef_.setImplMethod(s.name, fnVal);
				} else if (fnType.isAssociated(s.site, new UserType(this.typeStatementRef_))) {
					this.typeStatementRef_.setImplAssoc(s.name, fnVal);
				} else {
					s.typeError("not associated");
				}

				// now do the actual internal evaluation in which recursion is now possible
				void s.evalInternal(scope);
			}
		}
	}

	// all members should be used
	toUntyped(map) {
		let path = this.typeStatementRef_.getPath();

		for (let s of this.statements_) {
			let key = `${path}__${s.name.toString()}`
			let value;
			if (s instanceof FuncStatement) {
				value = s.toUntypedInternal(key);
			} else {
				value = s.toUntypedInternal();
			}

			map.set(key, value);
		}
	}
}

const ScriptPurpose = {
	Testing: -1,
	Minting: 0,
	Spending: 1,
};

class Program {
	constructor(purpose, name, statements) {
		this.purpose_ = purpose;
		this.name_ = name;
		this.statements_ = statements;
		this.scope_ = null;
		
		this.haveDatum_ = false;
		this.haveRedeemer_ = false;
		this.haveScriptContext_ = false;
	}

	get scope() {
		return this.scope_;
	}

	isTest() {
		return this.purpose_ == ScriptPurpose.Testing;
	}

	toString() {
		return this.statements_.map(s => s.toString()).join("\n");
	}

	// also creates the scope
	eval(globalScope) {
		this.scope_ = new TopScope(globalScope);

		for (let s of this.statements_) {
			s.eval(this.scope_);
		}

		this.checkMain();

		this.scope_.assertAllUsed();

		for (let s of this.statements_) {
			s.assertAllMembersUsed();
		}
	}

	checkMain() {
		let mainVal = this.scope_.get("main");
		let mainSite = this.statements_.find(s => s.name.toString() == "main").site;
		let mainType = mainVal.getType(mainSite);

		if (!(mainType instanceof FuncType)) {
			mainSite.typeError("entrypoint is not a function");
		}

		let [haveDatum, haveRedeemer, haveScriptContext] = mainType.checkAsMain(mainSite, this.purpose_);
		

		this.haveDatum_ = haveDatum;
		this.haveRedeemer_ = haveRedeemer;
		this.haveScriptContext_ = haveScriptContext;
	}

	toUntyped() {
		let mainArgs = [];
		let uMainArgs = [];
		if (this.haveDatum_) {
			mainArgs.push("datum");
			uMainArgs.push("datum");
		} else if (this.purpose_ == ScriptPurpose.Spending) {
			mainArgs.push("_");
		}

		if (this.haveRedeemer_) {
			mainArgs.push("redeemer");
			uMainArgs.push("redeemer");
		} else if (!this.isTest()) { // minting script can also have a redeemer
			mainArgs.push("_");
		}

		if (this.haveScriptContext_) {
			mainArgs.push("ctx");
			uMainArgs.push("ctx");
		} else if (!this.isTest()) {
			mainArgs.push("_");
		}

		// don't need to specify TAB because it is at top level
		let res = `    /*entry point*/
	(${mainArgs.join(", ")}) -> {
		__core__ifThenElse(
			__helios__common__unBoolData(main(${uMainArgs.join(", ")})),
			() -> {()},
			() -> {__core__error()}
		)()
	}`;

		let map = new Map(); // string -> string
		for (let statement of this.statements_) {
			statement.toUntyped(map);
		}

		// builtin functions are added when untyped program is built
		// also replace all tabs with four spaces
		return wrapWithRawFunctions(TopScope.wrapWithDefinitions(res, map)).replaceAll("\t", TAB);
	}
}


//////////////////////////////////
// Section 11: AST build functions
//////////////////////////////////

function buildProgram(ts) {
	if (ts.length == 0) {
		throw new Error("empty script");
	}

	let [purpose, name] = buildScriptPurpose(ts);

	let statements = [];

	while (ts.length != 0) {
		let t = ts.shift().assertWord();
		let kw = t.value;
		let s;

		if (kw == "const") {
			s = buildConstStatement(t.site, ts);
		} else if (kw == "struct") {
			s = buildStructStatement(t.site, ts);
		} else if (kw == "func") {
			s = buildFuncStatement(t.site, ts);
		} else if (kw == "enum") {
			s = buildEnumStatement(t.site, ts);
		} else if (kw == "impl") {
			s = buildImplStatement(t.site, ts);
		} else {
			t.syntaxError("invalid top-level syntax");
		}

		statements.push(s);
	}

	return new Program(purpose, name, statements);
}

// return [purpose, name]
function buildScriptPurpose(ts) {
	// need at least 3 tokens for the script purpose
	if (ts.length < 3) {
		ts[0].syntaxError("invalid script purpose syntax");
	}

	let purposeWord = ts.shift().assertWord();
	let purpose;
	if (purposeWord.isWord("validator")) {
		purpose = ScriptPurpose.Spending; 
	} else if (purposeWord.isWord("mint_policy")) {
		purpose = ScriptPurpose.Minting;
	} else if (purposeWord.isWord("test")) { // 'test' is not reserved as a keyword though
		purpose = ScriptPurpose.Testing;
	} else if (purposeWord.isKeyword()) {
		purposeWord.syntaxError(`script purpose missing`);
	} else {
		purposeWord.syntaxError(`unrecognized script purpose \'${purposeWord.value}\'`);
	}

	let name = ts.shift().assertWord().assertNotKeyword();
	ts.shift().assertSymbol(";");

	return [purpose, name];
}

function buildConstStatement(site, ts) {
	let name = ts.shift().assertWord().assertNotKeyword();

	let typeExpr = null;
	if (ts[0].isSymbol(":")) {
		ts.shift();

		let equalsPos = Symbol.find(ts, "=");

		if (equalsPos == -1) {
			site.syntaxError("invalid syntax");
		}

		typeExpr = buildTypeExpr(ts.spice(0, equalsPos));
	} else {
		ts.shift().assertSymbol("=");
	}

	let semicolonPos = Symbol.find(ts, ";");

	if (semicolonPos == -1) {
		site.syntaxError("invalid syntax");
	}

	let valueExpr = buildValueExpr(ts.splice(0, semicolonPos));

	return new ConstStatement(site, name, typeExpr, valueExpr);
}

function buildStructStatement(site, ts) {
	let name = ts.shift().assertWord().assertNotKeyword();

	assert(ts.length > 0);

	let braces = ts.shift().assertGroup("{");
	
	let fields = buildDataFields(braces);

	return new StructStatement(site, name, fields);
}

function buildDataFields(braces) {
	let rawFields = braces.fields;

	let fields = []

	for (let f of rawFields) {
		let ts = f.slice();

		if (ts.length == 0) {
			braces.syntaxError("empty field")
		} else if (ts.length < 2) {
			ts[0].syntaxError("invalid field syntax")
		}

		let fieldName = ts.shift().assertWord().assertNotKeyword();

		if (fields.findIndex(f => f.name.toString() == fieldName.toString()) != -1) {
			fieldName.typeError(`duplicate field \'${fieldName.toString()}\'`);
		}

		ts.shift().assertSymbol(":");

		let typeExpr = buildTypeExpr(ts);

		fields.push(new DataField(fieldName, typeExpr));
	}
}

function buildFuncStatement(site, ts) {
	let name = ts.shift().assertWord().assertNotKeyword();

	return new FuncStatement(site, name, buildFuncLiteralExpr(ts));
}

function buildFuncLiteralExpr(ts) {
	let parens = ts.shift().assertGroup("(");
	let site = parens.site;
	let args = buildFuncArgs(parens);

	ts.shift().assertSymbol("->");

	let bodyPos = Group.find(ts, "{");

	if (bodyPos == -1) {
		site.syntaxError("no function body");
	} else if (bodyPos == 0) {
		site.syntaxError("no return type specified");
	}

	let retTypeExpr = buildTypeExpr(ts.splice(0, bodyPos));
	let bodyExpr = buildValueExpr(ts.shift().assertGroup("{", 1).fields[0]);

	return new FuncLiteralExpr(site, args, retTypeExpr, bodyExpr);
}

// list of FuncArg
function buildFuncArgs(parens) {
	let args = [];

	for (let f of parens.fields) {
		let ts = f.slice();

		let name = ts.shift().assertWord().assertNotKeyword();

		for (let prev of args) {
			if (prev[0].toString() != name.toString()) {
				name.syntaxError("duplicate arg name");
			}
		}

		ts.shift().assertSymbol(":");

		let typeExpr = buildTypeExpr(ts);

		args.push(new FuncArg(name, typeExpr));
	}

	return args;
}

function buildEnumStatement(site, ts) {
	let name = ts.shift().assertWord().assertNotKeyword();

	if (ts.length == 0) {
		site.syntaxError("invalid syntax");
	}

	let t = ts.shift().assertGroup("{");
	if (t.fields.length == 0) {
		t.syntaxError("invalid enum: expected at least one member");
	}

	// list of EnumMember
	let members = [];
	for (let f of t.fields) {
		let ts = f.slice();

		if (ts.length == 0) {
			t.syntaxError("empty enum member");
		}

		let member = buildEnumMember(ts);

		for (let m of members) {
			if (m.name.toString() == member.name.toString()) {
				member.name.referenceError("duplicate enum member");
			}
		}

		members.push(member);
	}

	return new EnumStatement(site, name, members);
}

function buildEnumMember(ts) {
	let name = ts.shift().assertWord().assertNotKeyword();

	let braces = ts.shift().assertGroup("{");

	let fields = buildDataFields(braces);

	if (ts.length != 0) {
		ts[0].syntaxError("invalid enum member syntax");
	}

	return new EnumMember(name, fields);
}

function buildImplStatement(site, ts) {
	let bracesPos = Group.find(ts, "{");
	if (bracesPos == -1) {
		site.synaxError("invalid impl syntax");
	}

	let typeExpr = buildTypeExpr(ts.splice(0, bracesPos));
	if (!( (typeExpr instanceof TypeRefExpr) || (typeExpr instanceof TypePathExpr))) {
		typeExpr.syntaxError("invalid impl syntax");
	}

	let braces = ts.shift().assertGroup("{", 1);

	let statements = buildImplMembers(braces.fields[0]);

	return new ImplStatement(site, typeExpr, statements);
}

// returns list of statements
function buildImplMembers(ts) {
	let statements = [];

	while (ts.length != 0) {
		let t = ts.shift().assertWord();
		let kw = t.value;
		let s;

		if (kw == "const") {
			s = buildConstStatement(t.site, ts);
		} else if (kw == "func") {
			s = buildFuncStatement(t.site, ts);
		} else {
			t.syntaxError("invalid impl syntax");
		}

		statements.push(s);
	}

	return statements
}

function buildTypeExpr(ts) {
	assert(ts.length > 0);

	if (ts[0].isGroup("[")) {
		return buildListTypeExpr(ts);
	} else if (ts[0].isWord("Map")) {
		return buildMapTypeExpr(ts);
	} else if (ts[0].isWord("Option")) {
		return buildOptionTypeExpr(ts);
	} else if (ts.length > 1 && ts[0].isGroup("(") && ts[1].isSymbol("->")) {
		return buildFuncTypeExpr(ts);
	} else if (ts.length > 1 && ts[0].isWord() && ts[1].isSymbol("::")) {
		return buildTypePathExpr(ts);
	} else if (ts[0].isWord()) {
		return buildTypeRefExpr(ts);
	} else {
		ts[0].syntaxError("invalid type syntax")
	}
}

function buildListTypeExpr(ts) {
	ts.shift().assertGroup("[", 0);

	let itemTypeExpr = buildTypeExpr(ts);

	return new ListTypeExpr(t.site, itemTypeExpr);
}

function buildMapTypeExpr(ts) {
	let kw = ts.shift().assertWord("Map");

	let keyTypeExpr = buildTypeExpr(ts.shift().assertGroup("[", 1).fields[0]);

	let valueTypeExpr = buildTypeExpr(ts);

	return new MapTypeExpr(kw.site, keyTypeExpr, valueTypeExpr);
}

function buildOptionTypeExpr(ts) {
	let kw = ts.shift().assertWord("Option");

	let someTypeExpr = buildTypeExpr(ts.shift().assertGroup("[", 1).fields[0]);

	if (ts.length > 0) {
		ts[0].syntaxError("invalid type syntax");
	}

	return new OptionTypeExpr(kw.site, someTypeExpr);
}

function buildFuncTypeExpr(ts) {
	let parens = ts.shift().assertGroup("(");

	let argTypes = parens.fields.map(f => buildTypeExpr(f.slice()));
	
	ts.shift().assertSymbol("->");

	let retType = buildTypeExpr(ts);

	return new FuncTypeExpr(parens.site, argTypes, retType);
}

function buildTypePathExpr(ts) {
	let baseName = ts.shift().assertWord().assertNotKeyword();

	let symbol = ts.shift().assertSymbol("::");

	let memberName = ts.shift().assertWord();

	if (ts.length > 0) {
		ts[0].syntaxError("invalid type syntax");
	}

	return new TypePathExpr(symbol.site, baseName, memberName);
}

function buildTypeRefExpr(ts) {
	let name = ts.shift().assertWord().assertNotKeyword();

	if (ts.length > 0) {
		ts[0].syntaxError("invalid type syntax");
	}

	return new TypeRefExpr(name);
}

function buildValueExpr(ts, prec) {
	assert(ts.length > 0);

	// lower index in exprBuilders is lower precedence
	const exprBuilders = [
		// 0: lowest precedence is assignment
		function(ts_, prec_) {
			return buildMaybeAssignOrPrintExpr(ts_, prec_);
		},
		makeBinaryExprBuilder('||'), // 1: logical or operator
		makeBinaryExprBuilder('&&'), // 2: logical and operator
		makeBinaryExprBuilder(['==', '!=']), // 3: eq or neq
		makeBinaryExprBuilder(['<', '<=', '>', '>=']), // 4: comparison
		makeBinaryExprBuilder(['+', '-']), // 5: addition subtraction
		makeBinaryExprBuilder(['*', '/', '%']), // 6: multiplication division remainder
		makeUnaryExprBuilder(['!', '+', '-']), // 7: logical not, negate
		// 8: variables or literal values chained with: (enum)member access, indexing and calling
		function(ts_, prec_) {
			return buildChainedValueExpr(ts_, prec_);
		}
	];

	if (prec == undefined) {
		return buildValueExpr(ts, 0);
	} else {
		return exprBuilders[prec](ts, prec);
	}
}

function buildMaybeAssignOrPrintExpr(ts, prec) {
	let semicolonPos = Symbol.find(ts, ";");
	
	if (semicolonPos == -1) {
		return buildValueExpr(ts, prec+1);
	} else {
		let equalsPos = Symbol.find(ts, "=");
		let printPos = Word.find(ts, "print");

		if (equalsPos == -1 && printPos == -1) {
			ts[semicolonPos].syntaxError("expected = or print to preceed ;");
		}

		if (equalsPos != -1 && equalsPos < semicolonPos) {
			if (printPos != -1) {
				assert(printPos > semicolonPos);
			}

			assert(equalsPos < semicolonPos);

			let lts = ts.splice(0, equalsPos);

			let name = lts.shift().assertWord().assertNotKeyword();
			
			let typeExpr = null;
			if (lts.length > 0 && lts.shift().isSymbol(":")) {
				typeExpr = buildTypeExpr(lts);
			}

			let equalsSite = ts.shift().assertSymbol("=").site;

			semicolonPos = Symbol.find(ts, ";");
			assert(semicolonPos != -1);

			let upstreamExpr = buildValueExpr(ts.splice(0, semicolonPos), prec+1);

			let semicolonSite = ts.shift().assertSymbol(";").site;

			if (ts.length == 0) {
				semicolonSite.syntaxError("expected expression after \';\'");
			}

			let downstreamExpr = buildValueExpr(ts, prec);

			return new AssignExpr(equalsSite, name, typeExpr, upstreamExpr, downstreamExpr);
		} else if (printPos != -1 && printPos < semicolonPos) {
			if (equalsPos != -1) {
				assert(equalsPos > semicolonPos);
			}

			assert(printPos < semicolonPos);

			let site = ts.shift().assertWord("print").site;

			let parens = ts.shift().assertGroup("(", 1);

			let msgExpr = buildValueExpr(parens.fields[0]);

			ts.shift().assertSymbol(";");

			let downstreamExpr = buildValueExpr(ts, prec);

			return new PrintExpr(site, msgExpr, downstreamExpr);
		} else {
			throw new Error("unhandled");
		}
	}
}

// returns a function!
function makeBinaryExprBuilder(symbol) {
	// default behaviour is left-to-right associative
	return function(ts, prec) {
		let iOp = Symbol.findLast(ts, symbol);

		if (iOp == ts.length - 1) {
			// post-unary operator, which is invalid
			ts[iOp].syntaxError(`invalid syntax, \'${ts[iOp].toString()}\' can't be used as a post-unary operator`);
		} else if (iOp > 0) { // iOp == 0 means maybe a (pre)unary op, which is handled by a higher precedence
			let a = buildValueExpr(ts.slice(0, iOp), prec);
			let b = buildValueExpr(ts.slice(iOp+1), prec+1);

			return new BinaryExpr(ts[iOp], a, b);
		} else {
			return buildValueExpr(ts, prec+1);
		}
	};
}

function makeUnaryExprBuilder(symbol) {
	// default behaviour is right-to-left associative
	return function(ts, prec) {
		if (ts[0].isSymbol(symbol)) {
			let rhs = buildValueExpr(ts.slice(1), prec);

			return new UnaryExpr(ts[0], rhs);
		} else {
			return buildValueExpr(ts, prec+1);
		}
	}
}

function buildChainedValueExpr(ts, prec) {
	let expr = buildChainStartValueExpr(ts);

	// now we can parse the rest of the chaining
	while(ts.length > 0) {
		let t = ts.shift();

		if (t.isGroup("(")) {
			expr = new CallExpr(t.site, expr, buildCallArgs(t));
		} else if (t.isGroup("[")) {
			t.syntaxError("invalid expression: [...]");
		} else if (t.isSymbol(".")) {
			let name = ts.shift().assertWord().assertNotKeyword();

			expr = new MemberExpr(t.site, expr, name);
		} else if (t.isGroup("{")) {
			t.syntaxError("invalid syntax");
		} else if (t.isSymbol("::")) {
			t.syntaxError("invalid syntax");
		} else {
			t.syntaxError(`invalid syntax: ${t.toString()} (${prec})`);
		}
	}

	return expr;
}

function buildChainStartValueExpr(ts) {
	if (ts.length > 1 && ts[0].isGroup("(") && ts[1].isSymbol("->")) {
		return buildFuncLiteralExpr(ts);
	} else if (ts[0].isWord("if")) {
		return buildIfElseExpr(ts);
	} else if (ts[0].isWord("switch")) {	
		return buildSwitchExpr(ts);
	} else if (ts[0].isLiteral()) {
		return new PrimitiveLiteralExpr(ts.shift()); // can simply be reused
	} else if (ts[0].isGroup("(")) {
		return new ParensExpr(ts[0].site, buildValueExpr(ts.shift().assertGroup("(", 1).fields[0]));
	} else if (Group.find(ts, "{") != -1) {
		if (ts[0].isGroup("[")) {
			return buildListLiteralExpr(ts);
		} else {
			return buildStructLiteralExpr(ts);
		}
	} else if (Symbol.find(ts, "::") != -1) {
		return buildValuePathExpr(ts);
	} else if (ts[0].isWord()) {
		return new ValueRefExpr(ts.shift().assertWord().assertNotKeyword()); // can later be turned into a typeexpr
	} else {
		t.syntaxError("invalid syntax");
	}

	return expr;
}

function buildCallArgs(parens) {
	return parens.fields.map(fts => buildValueExpr(fts));
}

function buildIfElseExpr(ts) {
	let site = ts.shift().assertWord("if").site;
	
	let conditions = [];
	let branches = [];
	while (true) {
		let parens = ts.shift().assertGroup("(");
		let braces = ts.shift().assertGroup("{");

		if (parens.fields_.length != 1) {
			parens.syntaxError("expected single condition");
		}

		if (braces.fields_.length != 1) {
			braces.syntaxError("expected single expession for branch block");
		}

		conditions.push(buildValueExpr(parens.fields_[0]));
		branches.push(buildValueExpr(braces.fields_[0]));

		ts.shift().assertWord("else");

		let next = ts.shift();
		if (next.isGroup("{")) {
			// last group
			let braces = next;
			if (braces.fields_.length != 1) {
				braces.syntaxError("expected single expession for if-else branch");
			}
			branches.push(buildValueExpr(braces.fields_[0]));
			break;
		} else if (next.isWord("if")) {
			continue;
		} else {
			next.syntaxError("unexpected token");
		}
	}

	return new IfElseExpr(site, conditions, branches);
}

function buildSwitchExpr(ts) {
	let site = ts.shift().assertWord("switch").site;
	let parens = ts.shift().assertGroup("(", 1);

	let expr = buildValueExpr(parens.fields[0]);

	let braces = ts.shift().assertGroup("{", 1);

	let cases = [];
	let def = null;

	let tsInner = braces.fields[0].slice();

	while (tsInner.length > 0) {
		if (tsInner[0].isWord("case")) {
			if (def != null) {
				def.syntaxError("default select must come last");
			}
			cases.push(buildSwitchCase(tsInner));
		} else if (tsInner[0].isWord("default")) {
			if (def != null) {
				def.syntaxError("duplicate default");
			}

			def = buildSwitchDefault(tsInner);
		} else {
			ts[0].syntaxError("invalid switch syntax");
		}
	}

	// finaly check the uniqueness of each case
	// also check that each case uses the same enum
	let set = new Set()
	let base = null;
	for (let c of cases) {
		let t = c.typeExpr_.toString();
		if (set.has(t)) {
			c.typeExpr_.syntaxError("duplicate case");
		}

		set.add(t);

		let b = t.split("::")[0];
		if (base == null) {
			base = b;
		} else if (base != b) {
			c.typeExpr_.syntaxError("inconsistent enum name");
		}
	}

	if (cases.length < 1) {
		site.syntaxError("expected at least one case");
	}

	return new SwitchExpr(site, expr, cases, def);
}

function buildSwitchCase(ts) {
	let site = ts.shift().assertWord("case").site;

	let varName = null;
	let typeExpr;
	if (ts[0].isGroup("(")) {
		let parens = ts.shift().assertGroup("(", 1);
		let pts = parens.fields[0];
		if (pts.length < 5) {
			parens.syntaxError("invalid switch case syntax");
		}

		varName = pts.shift().assertWord().assertNotKeyword();
		pts.shift().assertSymol(":");
		typeExpr = buildTypeExpr(pts);

	} else {
		let bracesPos = Group.find(ts, "{");
		if (bracesPos == -1) {
			site.syntaxError("invalid switch case syntax");
		}

		typeExpr = buildTypeExpr(ts.splice(0, bracesPos));
	}

	if (!(typeExpr instanceof TypePathExpr)) {
		typeExpr.syntaxError(`invalid switch case type, expected an enum member type, got \'${typeExpr.toString()}\'`);
	}

	let braces = ts.shift().assertGroup("{", 1);
	let bodyExpr = buildValueExpr(braces.fields[0]);

	return new SwitchCase(site, varName, typeExpr, bodyExpr);
}

function buildSwitchDefault(ts) {
	let site = ts.shift().assertWord("default").site;
	let braces = ts.shift().assertGroup("{", 1);
	let bodyExpr = buildValueExpr(braces.fields[0]);

	return new SwitchDefault(site, bodyExpr);
}

function buildListLiteralExpr(ts) {
	let site = ts.shift().assertGroup("[", 0);

	let bracesPos = Group.find(ts, "{");

	if (bracesPos == -1) {
		site.syntaxError("invalid list literal expression syntax");
	}

	let itemTypeExpr = buildTypeExpr(ts.splice(0, bracesPos));

	let braces = ts.shift().assertGroup("{");

	let itemExprs = braces.fields.map(fts => buildValueExpr(fts));

	return new ListLiteralExpr(site, itemTypeExpr, itemExprs);
}

function buildStructLiteralExpr(ts) {
	let bracesPos = Group.find(ts, "{");
	assert (bracesPos != -1);

	let typeExpr = buildTypeExpr(ts.splice(0, bracesPos));

	let braces = ts.shift().assertGroup("{");

	let fields = braces.fields.map(fts => buildStructLiteralField(fts));

	return new StructLiteralExpr(typeExpr, fields);
}

function buildStructLiteralField(ts) {
	let name = ts.shift().assertWord().assertNotKeyword();
	ts.shift().assertSymbol("::");
	let valueExpr = buildValueExpr(ts);

	return new StructLiteralField(name, valueExpr);
}

function buildValuePathExpr(ts) {
	let dcolonPos = Symbol.findLast(ts, "::");
	assert(dcolonPos != -1);

	let typeExpr = buildTypeExpr(ts.splice(0, dcolonPos));

	let memberName = ts.shift().assertWord().assertNotKeyword();

	return new ValuePathExpr(typeExpr, memberName);
}


////////////////////////////
// Section 12: Builtin types
////////////////////////////

class IntType extends BuiltinType {
	constructor() {
		super();
	}

	toString() {
		return `Int`;
	}

	getInstanceMember(name) {
		switch(name.value) {
			case "__neg":
			case "__pos":
				return Value.new(new FuncType([], new IntType()));
			case "__add":
			case "__sub":
			case "__mul":
			case "__div":
			case "__mod":
				return Value.new(new FuncType([new IntType()], new IntType()));
			case "__geq":
			case "__gt":
			case "__leq":
			case "__lt":
				return Value.new(new FuncType([new IntType()], new BoolType()));
			case "to_bool":
				return Value.new(new FuncType([], new BoolType()));
			case "to_hex":
			case "show":
				return Value.new(new FuncType([], new StringType()));
			default:
				return super.getInstanceMember(name);
		}
	}

	toUntyped() {
		return "__helios__int";
	}
}

class BoolType extends BuiltinType {
	constructor() {
		super();
	}

	toString() {
		return `Bool`;
	}

	getTypeMember(name) {
		switch(name.value) {
			case "and":
			case "or":
				return Value.new(new FuncType([new FuncType([], new BoolType()), new FuncType([], new BoolType())], new BoolType()));
			default:
				return super.getTypeMember(name);
		}
	}
	getInstanceMember(name) {
		switch(name.value) {
			case "__not":
				return Value.new(new FuncType([], new BoolType()));
			case "__and":
			case "__or":
				return Value.new(new FuncType([new BoolType()], new BoolType()));
			case "to_int":
				return Value.new(new FuncType([], new IntType()));
			case "show":
				return Value.new(new FuncType([], new StringType()));
			default:
				return super.getInstanceMember(name);
		}
	}

	toUntyped() {
		return "__helios__bool";
	}
}

class StringType extends BuiltinType {
	constructor() {
		super();
	}

	toString() {
		return "String";
	}

	getInstanceMember(name) {
		switch(name.value) {
			case "__add":
				return Value.new(new FuncType([new StringType()], new StringType()));
			case "encode_utf8":
				return Value.new(new FuncType([], new ByteArrayType()));
			default:
				return super.getInstanceMember(name);
		}
	}

	toUntyped() {
		return "__helios__string";
	}
}

class ByteArrayType extends BuiltinType {
	constructor() {
		super();
	}

	toString() {
		return "ByteArray";
	}

	getInstanceMember(name) {
		switch(name.value) {
			case "__add":
				return Value.new(new FuncType([new ByteArrayType()], new ByteArrayType()));
			case "length":
				return Value.new(new IntType());
			case "sha2":
			case "sha3":
			case "blake2b":
				return Value.new(new FuncType([], new ByteArrayType()));
			case "decode_utf8":
			case "show":
				return Value.new(new FuncType([], new StringType()));
			default:
				return super.getInstanceMember(name);
		}
	}

	toUntyped() {
		return "__helios__bytearray";
	}
}

class ListType extends BuiltinType {
	constructor(itemType) {
		super();
		this.itemType_ = itemType;
	}

	get itemType() {
		return this.itemType_;
	}

	toString() {
		return "[]" + this.itemType_.toString();
	}

	isBaseOf(site, type) {
		if (type instanceof ListType) {
			 return this.itemType_.isBaseOf(site, type.itemType);
		} else {
			return false;
		}
	}

	getTypeMember(name) {
		switch(name.value) {
			case "new":
				return Value.new(new FuncType([new IntType(), this.itemType_], this));
			default:
				return supre.getTypeMember(name);
		}
	}

	getInstanceMember(name) {
		switch(name.value) {
			case "__add":
				return Value.new(new FuncType([this], this));
			case "length":
				return Value.new(new IntType());
			case "head":
				return Value.new(this.itemType_);
			case "tail":
				return Value.new(new ListType(this.itemType_));
			case "is_empty":
				return Value.new(new FuncType([], new BoolType()));
			case "get":
				return Value.new(new FuncType([new IntType()], this.itemType_));
			case "prepend":
				return Value.new(new FuncType([this.itemType_], new ListType(this.itemType_)));
			case "any":
			case "all":
				return Value.new(new FuncType([new FuncType([this.itemType_], new BoolType())], new BoolType()));
			case "find":
				return Value.new(new FuncType([new FuncType([this.itemType_], new BoolType())], this.itemType_));
			case "filter":
				return Value.new(new FuncType([new FuncType([this.itemType_], new BoolType())], new ListType(this.itemType_)));
			case "fold":
				return new FoldFuncValue(this.itemType_);
			case "map":
				return new MapFuncValue(this.itemType_);
			default:
				return super.getInstanceMember(name);
		}
	}

	toUntyped() {
		return "__helios__list";
	}
}

// lst.fold and lst.map are the only parametric function we have at the moment, so instead developing a parametric type system we can just create a special class for these unique cases 
class FoldFuncValue extends FuncValue {
	constructor(itemType) {
		super(null);
		this.itemType_ = itemType;
	}

	copy() {
		return new FoldFuncValue(this.itemType_);
	}

	toString() {
		return `[a](a, (a, ${this.itemType_.toString()}) -> a) -> a`;
	}

	getType(site) {
		site.typeError("can't get type of type parametric function");
	}

	isInstanceOf(site, type) {
		site.typeError("can't determine if type parametric function is instanceof a type");
	}

	call(site, args) {
		if (args.length != 2) {
			site.typeError(`expected 2 arg(s), got ${args.length}`);
		}

		let zType = args[1].getType(site);

		let fnType = new FuncType([zType, this.itemType_], zType);

		if (!args[0].isInstanceOf(site, fnType)) {
			site.typeError("wrong function type for fold");
		}

		return Value.new(zType);
	}
}

class MapFuncValue extends FuncValue {
	constructor(itemType) {
		super(null);
		this.itemType_ = itemType;
	}

	copy() {
		return new MapFuncValue(this.itemType_);
	}

	toString() {
		return `[a]((${this.itemType_.toString()}) -> a) -> []a`;
	}

	getType(site) {
		site.typeError("can't get type of type parametric function");
	}

	isInstanceOf(site, type) {
		site.typeError("can't determine if type parametric function is instanceof a type");
	}

	call(site, args) {
		if (args.length != 1) {
			site.typeError(`map expects 1 arg(s), got ${args.length})`);
		}

		let fnType = args[0].getType();

		if (!fnType instanceof FuncType) {
			site.typeError("arg is not a func type");
		}

		if (fnType.nArgs() != 1) {
			site.typeError("func arg takes wrong number of args");
		}

		let retItemType = fnType.retType;
		let testFuncType = new FuncType([this.itemType_], retItemType);

		if (!fnType.isBaseOf(testFuncType)) {
			site.typeError("bad map func");
		}

		return Value.new(new ListType(retItemType));
	}
}

class MapType extends BuiltinType {
	constructor(keyType, valueType) {
		super();
		this.keyType_ = keyType;
		this.valueType_ = valueType;
	}

	toString() {
		return `Map[${this.keyType_.toString()}]${this.valueType_.toString()}`;
	}

	getInstanceMember(name) {
		switch(name.value) {
			default:
				return super.getInstanceMember(name);
		}
	}

	toUntyped() {
		return "__helios__map";
	}
}

class OptionType extends BuiltinType {
	constructor(someType) {
		super();
		this.someType_ = someType;
	}

	toString() {
		return `Option[${this.someType_.toString()}]`;
	}

	isBaseOf(site, type) {
		return (new OptionSomeType(this.someType_)).isBaseOf(type) || (new OptionNoneType(this.someType_)).isBaseOf(type);
	}

	getTypeMember(name) {
		switch(name.value) {
			case "Some":
				return new OptionSomeType(this.someType_);
			case "None":
				return new OptionNoneType(this.someType_);
			default:
				return super.getTypeMember(name);
		}
	}

	getInstanceMember(name) {
		switch(name.value) {
			default:
				return super.getInstanceMember(name);
		}
	}

	toUntyped() {
		return "__helios__option";
	}
}

class OptionSomeType extends BuiltinType {
	constructor(someType) {
		super();
		this.someType_ = someType;
	}

	toString() {
		return `Option[${this.someType_.toString()}]::Some`;
	}

	getTypeMember(name) {
		switch(name.value) {
			case "new":
				return Value.new(new FuncType([this.someType_], this));
			case "cast":
				return Value.new(new FuncType([new OptionType(this.someType_)], this));
			default:
				return super.getTypeMember(name)
		}
	}
	
	getInstanceMember(name) {
		switch(name.value) {
			case "__eq": // more generic than __eq/__neq defined in BuiltinType
			case "__neq":
				return Value.new(new FuncType([new OptionType(this.someType_)], new BoolType()));
			case "value":
				return this.someType_;
			default:
				return super.getInstanceMember(name);
		}
	}
	
	getConstrIndex(site) {
		return 0;
	}

	toUntyped() {
		return "__helios__option__some";
	}
}

class OptionNoneType extends BuiltinType {
	constructor(someType) {
		super();
		this.someType_ = someType;
	}
	
	toString() {
		return `Option[${this.someType_.toString()}]::None`;
	}

	getTypeMember(name) {
		switch(name.value) {
			case "new":
				return Value.new(new FuncType([], this));
			case "cast":
				return Value.new(new FuncType([new OptionType(this.someType_)], this));
			default:
				return super.getTypeMember(name)
		}
	}

	getInstanceMember(name) {
		switch(name.value) {
			case "__eq": // more generic than __eq/__neq defined in BuiltinType
			case "__neq":
				return Value.new(new FuncType([new OptionType(this.someType_)], new BoolType()));
			default:
				return super.getInstanceMember(name);
		}
	}

	getConstrIndex(site) {
		return 1;
	}

	toUntyped() {
		return "__helios__option__none";
	}
}

class HashType extends BuiltinType {
	constructor() {
		super();
	}

	getTypeMember(name) {
		switch(name.value) {
			case "new":
				return Value.new(new FuncType([new ByteArrayType()], this));
			default:
				return super.getTypeMember(name);
		}
	}

	getInstanceMember(name) {
		switch(name.value) {
			case "show":
				return Value.new(new FuncType([], new StringType()));
			default:
				return super.getInstanceMember(name);
		}
	}

	toUntyped() {
		return "__helios__hash"
	}
}

class PubKeyHashType extends HashType {
	toString() {
		return "PubKeyHash";
	}
}

class ValidatorHashType extends HashType{
	toString() {
		return "ValidatorHash";
	}
}

class MintingPolicyHashType extends HashType{
	toString() {
		return "MintingPolicyHash";
	}
}

class DatumHashType extends HashType{
	toString() {
		return "DatumHash";
	}
}

class ScriptContextType extends BuiltinType {
	constructor() {
		super();
	}

	toString() {
		return "ScriptContext";
	}

	getInstanceMember(name) {
		switch(name.value) {
			case "tx":
				return Value.new(new TxType());
			case "get_spending_purpose_output_id":
				return Value.new(new FuncType([], new TxOutputIdType()));
			case "get_current_validator_hash":
				return Value.new(new FuncType([], new ValidatorHashType()));
			case "get_current_minting_policy_hash":
				return Value.new(new FuncType([], new MintingPolicyHashType()));
			case "get_current_input":
				return Value.new(new FuncType([], new TxInputType()));
			default:
				return super.getInstanceMember(name);
		}
	}

	toUntyped() {
		return "__helios__scriptcontext";
	}
}

class TxType extends BuiltinType {
	constructor() {
		super();
	}

	toString() {
		return "Tx";
	}

	getInstanceMember(name) {
		switch(name.value) {
			case "inputs":
				return Value.new(new ListType(new TxInputType()));
			case "outputs":
				return Value.new(new ListType(new TxOutputType()));
			case "fee":
				return Value.new(new MoneyValueType());
			case "minted":
				return Value.new(new MoneyValueType());
			case "time_range":
				return Value.new(new TimeRangeType());
			case "signatories":
				return Value.new(new ListType(new PubKeyHashType()));
			case "id":
				return Value.new(new TxIdType());
			case "now":
				return Value.new(new FuncType([], new TimeType()));
			case "find_datum_hash":
				return Value.new(new FuncType([new AnyType()], new DatumHashType()));
			case "outputs_sent_to":
				return Value.new(new FuncType([new PubKeyHashType()], new ListType(new TxOutputType())));
			case "outputs_locked_by":
				return Value.new(new FuncType([new ValidatorHashType()], new ListType(new TxOutputType())));
			case "value_sent_to":
				return Value.new(new FuncType([new PubKeyHashType()], new MoneyValueType()));
			case "value_locked_by":
				return Value.new(new FuncType([new ValidatorHashType()], new MoneyValueType()));
			case "value_locked_by_datum":
				return Value.new(new FuncType([new ValidatorHashType(), new AnyType()], new MoneyValueType()));
			case "is_signed_by":
				return Value.new(new FuncType([new PubKeyHashType()], new BoolType()));
			default:
				return super.getInstanceMember(name);
		}
	}

	toUntyped() {
		return "__helios__tx";
	}
}

class TxIdType extends BuiltinType {
	toString() {
		return "TxId";
	}

	toUntyped() {
		return "__helios__txid";
	}
}

class TxInputType extends BuiltinType {
	toString() {
		return "TxInput";
	}

	getInstanceMember(name) {
		switch(name.value) {
			case "output_id":
				return Value.new(new TxOutputIdType());
			case "output":
				return Value.new(new TxOutputType());
			default:
				return super.getInstanceMember(name);
		}
	}

	toUntyped() {
		return "__helios__txinput";
	}
}

class TxOutputType extends BuiltinType {
	toString() {
		return "TxOutput";
	}

	getInstanceMember(name) {
		switch(name.value) {
			case "address":
				return Value.new(new AddressType());
			case "value":
				return Value.new(new MoneyValueType());
			case "datum_hash":
				return Value.new(new OptionType(new DatumHashType()));
			default:
				return super.getInstanceMember(name);
		}
	}

	toUntyped() {
		return "__helios__txoutput";
	}
}

class TxOutputIdType extends BuiltinType {
	toString() {
		return "TxOutputId";
	}

	getTypeMember(name) {
		switch(name.value) {
			case "new":
				return Value.new(new FuncType([new ByteArrayType(), new IntType()], new TxOutputIdType()));
			default:
				return super.getTypeMember(name);
		}
	}

	toUntyped() {
		return "__helios__txoutputid";
	}
}

class AddressType extends BuiltinType {
	toString() {
		return "Address";
	}

	getInstanceMember(name) {
		switch(name.value) {
			case "credential":
				return Value.new(new CredentialType());
			case "staking_credential":
				return Value.new(new OptionType(new StakingCredentialType()));
			default:
				return super.getInstanceMember(name);
		}
	}

	toUntyped() {
		return "__helios__address";
	}
}

class CredentialType extends BuiltinType {
	toString() {
		return "Credential";
	}

	getTypeMember(name) {
		switch(name.value) {
			case "PubKey":
				return new CredentialPubKeyType();
			case "Validator":
				return new CredentialValidatorType();
			default:
				return super.getTypeMember(name);
		}
	}

	toUntyped() {
		return "__helios__credential";
	}
}

class CredentialPubKeyType extends BuiltinType {
	toString() {
		return "Credential::PubKey";
	}

	getTypeMember(name) {
		switch(name.value) {
			case "cast":
				return Value.new(new FuncType([new CredentialType()], this));
			default:
				return super.getTypeMember(name);
		}
	}

	getInstanceMember(name) {
		switch(name.value) {
			case "__eq":
			case "__neq":
				return Value.new(new FuncType([new CredentialType()], new BoolType()));
			case "hash":
				return Value.new(new PubKeyHashType());
			default:
				return super.getInstanceMember(name);
		}
	}

	getConstrIndex(site) {
		return 0;
	}

	toUntyped() {
		return "__helios__credential__pubkey";
	}
}

class CredentialValidatorType extends BuiltinType {
	toString() {
		return "Credential::Validator";
	}

	getTypeMember(name) {
		switch(name.value) {
			case "cast":
				return Value.new(new FuncType([new CredentialType()], this));
			default:
				return super.getTypeMember(name);
		}
	}

	getInstanceMember(name) {
		switch(name.value) {
			case "__eq":
			case "__neq":
				return Value.new(new FuncType([new CredentialType()], new BoolType()));
			case "hash":
				return Value.new(new ValidatorHashType());
			default:
				return super.getInstanceMember(name);
		}
	}

	getConstrIndex(site) {
		return 1;
	}

	toUntyped() {
		return "__helios__credential__validator";
	}
}

class StakingCredentialType extends BuiltinType {
	toString() {
		return "StakingCredential";
	}

	toUntyped() {
		return "__helios__stakingcredential";
	}
}

class TimeType extends BuiltinType {
	toString() {
		return "Time";
	}

	getTypeMember(name) {
		switch(name.value) {
			case "new":
				return Value.new(new FuncType([new IntType()], this));
			default:
				return super.getTypeMember();
		}
	}

	getInstanceMember(name) {
		switch(name.value) {
			case "__add":
				return Value.new(new FuncType([new DurationType()], new TimeType()));
			case "__sub":
				return Value.new(new FuncType([new TimeType()], new DurationType()));
			case "__geq":
			case "__gt":
			case "__leq":
			case "__lt":
				return Value.new(new FuncType([new TimeType()], new BoolType()));
			case "show":
				return Value.new(new FuncType([], new StringType()));
			default:
				return super.getInstanceMember(name);
		}
	}

	toUntyped() {
		return "__helios__time";
	}
}

class DurationType extends BuiltinType {
	toString() {
		return "Duration";
	}

	getTypeMember(name) {
		switch(name.value) {
			case "new":
				return Value.new(new FuncType([new IntType()], this));
			default:
				return super.getTypeMember();
		}
	}

	getInstanceMember(name) {
		switch(name.value) {
			case "__add":
			case "__sub":
			case "__mod":
				return Value.new(new FuncType([new DurationType()], new DurationType()));
			case "__mul":
			case "__div":
				return Value.new(new FuncType([new IntType()], new DurationType()));
			case "__geq":
			case "__gt":
			case "__leq":
			case "__lt":
				return Value.new(new FuncType([new DurationType()], new BoolType()));
			default:
				return super.getInstanceMember(name);
		}
	}
	
	toUntyped() {
		return "__helios__duration";
	}
}

class TimeRangeType extends BuiltinType {
	toString() {
		return "TimeRange";
	}

	getInstanceMember(name) {
		switch(name.value) {
			case "get_start":
				return Value.new(new FuncType([], new TimeType()));
			default:
				return super.getInstanceMember(name);
		}
	}

	toUntyped() {
		return "__helios__timerange";
	}
}

class AssetClassType extends BuiltinType {
	toString() {
		return "AssetClass";
	}

	getTypeMember(name) {
		switch(name.value) {
			case "ADA":
				return Value.new(new AssetClassType());
			case "new":
				return Value.new(new FuncType([new ByteArrayType(), new StringType()], new AssetClassType()));
			default:
				return super.getTypeMember(name);
		}
	}

	toUntyped() {
		return "__helios__assetclass";
	}
}

class MoneyValueType extends BuiltinType {
	toString() {
		return "Value";
	}

	getTypeMember(name) {
		switch(name.value) {
			case "ZERO":
				return Value.new(new MoneyValueType());
			case "lovelace":
				return Value.new(new FuncType([new IntType()], new MoneyValueType()));
			case "new":
				return Value.new(new FuncType([new AssetClassType(), new IntType()], new MoneyValueType()));
			default:
				return super.getTypeMember(name);
		}
	}

	getInstanceMember(name) {
		switch(name.value) {
			case "__add":
			case "__sub":
				return Value.new(new FuncType([new MoneyValueType()], new MoneyValueType()));
			case "__geq":
			case "__gt":
			case "__leq":
			case "__lt":
				return Value.new(new FuncType([new MoneyValueType()], new MoneyValueType()));
			case "is_zero":
				return Value.new(new FuncType([], new BoolType()));
			case "get":
				return Value.new(new FuncType([new AssetClassType()], new IntType()));
			default:
				return super.getInstanceMember(name);
		}
	}

	toUntyped() {
		return "__helios__value";
	}
}


//////////////////////////////////////////
// Section 13: Builtin low-level functions
//////////////////////////////////////////

class RawFunc {
	constructor(name, definition) {
		this.name_ = name;
		assert(definition != undefined);
		this.definition_ = definition;
		this.dependencies_ = new Set();

		let re = new RegExp("__helios__[a-zA-Z_0-9]*", "g");

		let matches = this.definition_.match(re);

		if (matches != null) {
			for (let match of matches) {
				this.dependencies_.add(match);
			}
		}
	}

	get name() {
		return this.name_;
	}

	load(db, dst) {
		if (dst.has(this.name_)) {
			return;
		} else {
			for (let dep of this.dependencies_) {
				db.get(dep).load(db, dst);
			}

			dst.set(this.name_, this.definition_);
		}
	}
}

function makeRawFunctions() {
	let db = new Map();

	// local utility functions
	function add(fn) {
		if (db.has(fn.name)) {
			throw new Error(`builtin ${fn.name} duplicate`);
		}
		db.set(fn.name, fn);
	}

	function addEqNeqSerialize(ns) {
		add(new RawFunc(`${ns}____eq`, "__helios__common____eq"));
		add(new RawFunc(`${ns}____neq`, "__helios__common____neq"));
		add(new RawFunc(`${ns}__serialize`, "__helios__common__serialize"));
	}
	
	// dataExpr is a string
	function unData(dataExpr, iConstr, iField, errorExpr = "__core__error()") {
		let inner = "__core__sndPair(pair)";
		for (let i = 0; i < iField; i++) {
			inner = `__core__tailList(${inner})`;
		}

		// deferred evaluation of ifThenElse branches
		return `
	(pair) -> {
		__core__ifThenElse(
			__core__equalsInteger(__core__fstPair(pair), ${iConstr}), 
			() -> {headList(${inner})}, 
			() -> {${errorExpr}}
		)()
	}(__core__unConstrData(${dataExpr}))`;
	}

	// dataExpr is a string
	function unDataVerbose(dataExpr, constrName, iConstr, iField) {
		if (!DEBUG) {
			return unData(dataExpr, iConstr, iField);
		} else {
			return unData(dataExpr, iConstr, iField, `__helios__common__verbose_error(__core__appendString("bad constr for ${constrName}, want ${iConstr.toString()} but got ", __helios__int__show(__core__fstPair(pair))()))`)
		}
	}
	
	function makeList(args, toData = false) {
		let n = args.length;
		let inner = "__core__mkNilData(())";

		for (let i = n-1; i>= 0; i--) {
			inner = `__core__mkCons(${args[i]}, ${inner})`;
		}

		if (toData) {
			inner = `__core__listData(${inner})`
		}

		return inner;
	}

	// Common builtins
	add(new RawFunc("__helios__common__verbose_error", `
	(msg) -> {
		__core__trace(msg, () -> {__core__error()})()
	}`));
	add(new RawFunc("__helios__common__assert_constr_index", `
	(data, i) -> {
		__core__ifThenElse(
			__core__equalsInteger(__core__fstPair(__core__unConstrData(data)), __core__unIData(i)),
			() -> {data},
			() -> {__core__error()}
		)()
	}`));
	add(new RawFunc("__helios__common____identity", `
	(self) -> {
		() -> {
			self
		}
	}`))
	add(new RawFunc("__helios__common__identity", `(self) -> {self}`));
	add(new RawFunc("__helios__common__not", `
	(b) -> {
		__core__ifThenElse(b, false, true)
	}`));
	add(new RawFunc("__helios__common____eq", `
	(self) -> {
		(other) -> {
			__helios__common__boolData(__core__equalsData(self, other))
		}
	}`));
	add(new RawFunc("__helios__common____neq", `
	(self) -> {
		(other) -> {
			__helios__common__boolData(__helios__common__not(equalsData(self, other)))
		}
	}`));
	add(new RawFunc("__helios__common__serialize", `
	(self) -> {
		() -> {__core__serialize(self)}
	}`));
	add(new RawFunc("__helios__common__is_in_bytearray_list", `
	(lst, key) -> {
		__helios__list__any(__core__listData(lst))((item) -> {__core__equalsByteString(item, key)})
	}`));
	add(new RawFunc("__helios__common__unBoolData", `
	(d) -> {
		__core__ifThenElse(
			__core__equalsInteger(__core__fstPair(__core__unConstrData(d)), 0), 
			false, 
			true
		)
	}`));
	add(new RawFunc("__helios__common__boolData", `
	(b) -> {
		__core__constrData(__core__ifThenElse(b, 1, 0), __core__mkNilData(()))
	}`));
	add(new RawFunc("__helios__common__unStringData", `
	(d) -> {
		__core__decodeUtf8(__core__unBData(d))
	}`));
	add(new RawFunc("__helios__common__stringData", `
	(s) -> {
		__core__bData(__core__encodeUtf8(s))
	}`));


	// Int builtins
	addEqNeqSerialize("__helios__int");
	add(new RawFunc("__helios__int____neg", `
	(self) -> {
		(self) -> {
			() -> {
				__core__iData(__core__multiplyInteger(self, -1))
			}
		}(__core__unIData(self))
	}`));
	add(new RawFunc("__helios__int____pos", "__helios__common____identity"));
	add(new RawFunc("__helios__int____add", `
	(self) -> {
		(a) -> {
			(b) -> {
				__core__iData(__core__addInteger(a, __core__unIData(b)))
			}
		}(__core__unIData(self))
	}`));
	add(new RawFunc("__helios__int____sub", `
	(self) -> {
		(a) -> {
			(b) -> {
				__core__iData(__core__subtractInteger(a, __core__unIData(b)))
			}
		}(__core__unIData(self))
	}`));
	add(new RawFunc("__helios__int____mul", `
	(self) -> {
		(a) -> {
			(b) -> {
				__core__iData(__core__multiplyInteger(a, __core__unIData(b)))
			}
		}(__core__unIData(self))
	}`));
	add(new RawFunc("__helios__int____div", `
	(self) -> {
		(a) -> {
			(b) -> {
				__core__iData(__core__divideInteger(a, __core__unIData(b)))
			}
		}(__core__unIData(self))
	}`));
	add(new RawFunc("__helios__int____mod", `
	(self) -> {
		(a) -> {
			(b) -> {
				__core__iData(__core__modInteger(a, __core__unIData(b)))
			}
		}(__core__unIData(self))
	}`));
	add(new RawFunc("__helios__int____geq", `
	(self) -> {
		(a) -> {
			(b) -> {
				__helios__common__boolData(__helios__common__not(__core__lessThanInteger(a, __core__unIData(b))))
			}
		}(__core__unIData(self))
	}`));
	add(new RawFunc("__helios__int____gt", `
	(self) -> {
		(a) -> {
			(b) -> {
				__helios__common__boolData(__helios__common__not(__core__lessThanEqualsInteger(a, __core__unIData(b))))
			}
		}(__core__unIData(self))
	}`));
	add(new RawFunc("__helios__int____leq", `
	(self) -> {
		(a) -> {
			(b) -> {
				__helios__common__boolData(__core__lessThanEqualsInteger(a, __core__unIData(b)))
			}
		}(__core__unIData(self))
	}`));
	add(new RawFunc("__helios__int____lt", `
	(self) -> {
		(a) -> {
			(a) -> {
				__helios__common__boolData(__core__lessThanInteger(a, __core__unIData(b)))
			}
		}(__core__unIData(self))
	}`));
	add(new RawFunc("__helios__int__to_bool", `
	(self) -> {
		(self) -> {
			() -> {
				__helios__common__boolData(__core__ifThenElse(__core__equalsInteger(self, 0), false, true))
			}
		}(__core__unIData(self))
	}`));
	add(new RawFunc("__helios__int__to_hex", `
	(self) -> {
		(self) -> {
			() -> {
				(recurse) -> {
					__core__bData(recurse(recurse, self))
				}(
					(recurse, self) -> {
						(partial) -> {
							(bytes) -> {
								__core__ifThenElse(
									__core__lessThanInteger(self, 16),
									() -> {bytes},
									() -> {__core__appendByteString(recurse(recurse, __core__divideInteger(self, 16)), bytes)}
								)()
							}(
								__core__consByteString(
									__core__ifThenElse(
										__core__lessThanInteger(partial, 10), 
										__core__addInteger(partial, 48), 
										__core__addInteger(partial, 87)
									), 
									#
								)
							)
						}(__core__modInteger(self, 16))
					}
				)
			}
		}(__core__unIData(self))
	}`));
	add(new RawFunc("__helios__int__show", `
	(self) -> {
		(self) -> {
			() -> {
				__helios__common__stringData(__core__decodeUtf8(
					(recurse) -> {
						__core__ifThenElse(
							__core__lessThanInteger(self, 0),
							() -> {__core__consByteString(45, recurse(recurse, __core__multiplyInteger(self, -1)))},
							() -> {recurse(recurse, self)}
						)()
					}(
						(recurse, i) -> {
							(bytes) -> {
								__core__ifThenElse(
									__core__lessThanInteger(i, 10),
									() -> {bytes},
									() -> {__core__appendByteString(recurse(recurse, __core__divideInteger(i, 10)), bytes)}
								)()
							}(__core__consByteString(__core__addInteger(__core__modInteger(i, 10), 48), #))
						}
					)
				))
			}
		}(__core__unIData(self))
	}`));
	

	// Bool builtins
	addEqNeqSerialize("__helios__bool");
	add(new RawFunc("__helios__bool__and", `
	(a, b) -> {
		__helios__common__boolData(
			__core__ifThenElse(
				__helios__common__unBoolData(a()), 
				() -> {__helios__common__unBoolData(b())}, 
				() -> {false}
			)()
		)
	}`));
	add(new RawFunc("__helios__bool__or", `
	(a, b) -> {
		__helios__common__boolData(
			__core__ifThenElse(
				__helios__common__unBoolData(a()), 
				() -> {true},
				() -> {__helios__common__unBoolData(b())}
			)()
		)
	}`));
	add(new RawFunc("__helios__bool____not", `
	(self) -> {
		(self) -> {
			() -> {
				__helios__common__boolData(__helios__common__not(self))
			}
		}(__helios__common__unBoolData(self))
	}`));
	add(new RawFunc("__helios__bool__to_int", `
	(self) -> {
		(self) -> {
			() -> {
				__core__iData(__core__ifThenElse(self, 1, 0))
			}
		}(__helios__common__unBoolData(self))
	}`));
	add(new RawFunc("__helios__bool__show", `
	(self) -> {
		(self) -> {
			() -> {
				__helios__common__stringData(__core__ifThenElse(self, "true", "false"))
			}
		}(__helios__common__unBoolData(self))
	}`));
	
	
	// String builtins
	addEqNeqSerialize("__helios__string");
	add(new RawFunc("__helios__string____add", `
	(self) -> {
		(self) -> {
			(other) -> {
				__helios__common__stringData(__core__appendString(self, __helios__common__unStringData(other)))
			}
		}(__helios__common__unStringData(self))
	}`));
	add(new RawFunc("__helios__string__encode_utf8", `
	(self) -> {
		(self) -> {
			__core__bData(__core__encodeUtf8(self))
		}(__helios__common__unStringData(self))
	}`));

	
	// ByteArray builtins
	addEqNeqSerialize("__helios__bytearray");
	add(new RawFunc("__helios__bytearray____add", `
	(self) -> {
		(a) -> {
			(b) -> {
				__core__bData(__core__appendByteString(a, __cure__unBData(b)))
			}
		}(__core__unBData(self))
	}`));
	add(new RawFunc("__helios__bytearray__length", `
	(self) -> {
		__core__iData(__core__lengthOfByteString(__core__unBData(self)))
	}`));
	add(new RawFunc("__helios__bytearray__sha2", `
	(self) -> {
		(self) -> {
			() -> {
				__core__bData(__core__sha2_256(self))
			}
		}(__core__unBData(self))
	}`));
	add(new RawFunc("__helios__bytearray__sha3", `
	(self) -> {
		(self) -> {
			() -> {
				__core__bData(__core__sha3_256(self))
			}
		}(__core__unBData(self))
	}`));
	add(new RawFunc("__helios__bytearray__blake2b", `
	(self) -> {
		(self) -> {
			() -> {
				__core__bData(__core__blake2b_256(self))
			}
		}(__core__unBData(self))
	}`));
	add(new RawFunc("__helios__bytearray__decode_utf8", `
	(self) -> {
		(self) -> {
			() -> {
				__helios__common__stringData(__core__decodeUtf8(self))
			}
		}(__core__unBData(self))
	}`));
	add(new RawFunc("__helios__bytearray__show", `
	(self) -> {
		(self) -> {
			() -> {
				(recurse) -> {
					__helios__common__stringData(recurse(recurse, self))
				}(
					(recurse, self) -> {
						(n) -> {
							__core__ifThenElse(
								__core__lessThanInteger(0, n),
								() -> {
									__core__appendString(
										__core__decodeUtf8(__core__unBData(__helios__int__to_hex(__core__indexByteString(self, 0))())), 
										recurse(recurse, __core__sliceByteString(1, n, self))
									)
								},
								() -> {
									""
								}
							)()
						}(__core__lengthOfByteString(self))
					}
				)
			}
		}(__core__unBData(self))
	}`));


	// List builtins
	addEqNeqSerialize("__helios__list");
	add(new RawFunc("__helios__list__new", `
	(n, item) -> {
		(recurse) -> {
			__core__listData(recurse(recurse, __core__mkNilData(()), 0))
		}(
			(recurse, lst, i) -> {
				__core__ifThenElse(
					__core__lessThanInteger(i, n),
					() -> {recurse(recurse, __core__mkCons(item, lst), __core__addInteger(i, 1))},
					() -> {lst}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__list____add", `
	(self) -> {
		(a) -> {
			(b) -> {
				(b) -> {
					(recurse) -> {
						__core__listData(recurse(recurse, b, a))
					}(
						(recurse, lst, rem) -> {
							__core__ifThenElse(
								__core__nullList(rem),
								() -> {lst},
								() -> {__core__mkCons(__core__headList(rem), recurse(recurse, lst, __core__tailList(rem)))}
							)()
						}
					)
				}(__core__unListData(b))
			}
		}(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__list__length", `
	(self) -> {
		(self) -> {
			(recurse) -> {
				__core__iData(recurse(recurse, self))
			}(
				(recurse, self) -> {
					__core__ifThenElse(
						__core__nullList(self), 
						() -> {0}, 
						() -> {__core__addInteger(recurse(recurse, __core__tailList(self)), 1)}
					)()
				}
			)
		}(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__list__head", `
	(self) -> {
		__core__headList(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__list__tail", `
	(self) -> {
		__core__listData(__core__tailList(__core__unListData(self)))
	}`));
	add(new RawFunc("__helios__list__is_empty", `
	(self) -> {
		(self) -> {
			() -> {
				__helios__common__boolData(__core__nullList(self))
			}
		}(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__list__get", `
	(self) -> {
		(self) -> {
			(index) -> {
				(recurse) -> {
					recurse(recurse, self, __core__unIData(index))
				}(
					(recurse, self, index) -> {
						__core__ifThenElse(
							__core__nullList(self), 
							() -> {__core__error()}, 
							() -> {__core__ifThenElse(
								__core__lessThanInteger(index, 0), 
								() -> {__core__error()}, 
								() -> {
									__core__ifThenElse(
										__core__equalsInteger(index, 0), 
										() -> {__core__headList(self)}, 
										() -> {recurse(recurse, __core__tailList(self), __core__subtractInteger(index, 1))}
									)()
								}
							)()}
						)()
					}
				)
			}
		}(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__list__any", `
	(self) -> {
		(self) -> {
			(fn) -> {
				(recurse) -> {
					__helios__common__boolData(recurse(recurse, self, fn))
				}(
					(recurse, self, fn) -> {
						__core__ifThenElse(
							__core__nullList(self), 
							() -> {false}, 
							() -> {
								__core__ifThenElse(
									__helios__common__unBoolData(fn(__core__headList(self))),
									() -> {true}, 
									() -> {recurse(recurse, __core__tailList(self), fn)}
								)()
							}
						)()
					}
				)
			}
		}(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__list__all", `
	(self) -> {
		(self) -> {
			(fn) -> {
				(recurse) -> {
					__helios__common__boolData(recurse(recurse, self, fn))
				}(
					(recurse, self, fn) -> {
						__core__ifThenElse(
							__core__nullList(self),
							() -> {true},
							() -> {
								__core__ifThenElse(
									__helios__common__unBoolData(fn(__core__headList(self))),
									() -> {recurse(recurse, __core__tailList(self), fn)},
									() -> {false}
								)()
							}
						)()
					}
				)
			}
		}(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__list__prepend", `
	(self) -> {
		(self) -> {
			(item) -> {
				__core__listData(__core__mkCons(item, self))
			}
		}(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__list__find", `
	(self) -> {
		(self) -> {
			(fn) -> {
				(recurse) -> {
					recurse(recurse, self, fn)
				}(
					(recurse, self, fn) -> {
						__core__ifThenElse(
							__core__nullList(self), 
							() -> {__core__error()}, 
							() -> {
								__core__ifThenElse(
									__helios__common__unBoolData(fn(__core__headList(self))), 
									() -> {__core__headList(self)}, 
									() -> {recurse(recurse, tailList(self), fn)}
								)()
							}
						)()
					}
				)
			}
		}(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__list__filter", `
	(self) -> {
		(self) -> {
			(fn) -> {
				(recurse) -> {
					__core__listData(recurse(recurse, self, fn))
				}(
					(recurse, self, fn) -> {
						__core__ifThenElse(
							__core__nullList(self), 
							() -> {__core__mkNilData(())}, 
							() -> {
								__core__ifThenElse(
									__helios__common__unBoolData(fn(__core__headList(self))),
									() -> {__core__mkCons(__core__headList(self), recurse(recurse, __core__tailList(self), fn))}, 
									() -> {recurse(recurse, __core__tailList(self), fn)}
								)()
							}
						)()
					}
				)		
			}
		}(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__list__fold", `
	(self) -> {
		(self) -> {
			(fn, z) -> {
				(recurse) -> {
					recurse(recurse, self, fn, z)
				}(
					(recurse, self, fn, z) -> {
						__core__ifThenElse(
							__core__nullList(self), 
							() -> {z}, 
							() -> {recurse(recurse, __core__tailList(self), fn, fn(z, __core__headList(self)))}
						)()
					}
				)
			}
		}(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__list__map", `
	(self) -> {
		(self) -> {
			(fn) -> {
				(recurse) -> {
					__core__listData(recurse(recurse, self, mkNilData(())))
				}(
					(recurse, rem, lst) -> {
						__core__ifThenElse(
							__core__nullList(rem),
							() -> {lst},
							() -> {
								__core__mkCons(
									fn(__core__headList(rem)), 
									recurse(recurse, __core__tailList(rem), lst)
								)
							}
						)()
					}
				)
			}
		}(__core__unListData(self))
	}`));
	

	// Map builtins
	addEqNeqSerialize("__helios__map");


	// Option builtins
	addEqNeqSerialize("__helios__option");
	addEqNeqSerialize("__helios__option__some");
	add(new RawFunc("__helios__option__some__new", `
	(data) -> {
		constrData(0, ${makeList(["data"])})
	}`));
	add(new RawFunc("__helios__option__some__cast", `
	(data) -> {
		__helios__common__assert_constr_index(data, 0)
	}`));
	add(new RawFunc("__helios__option__some__value", `
	(self) -> {
		() -> {
			${unData("self", 0, 0)}
		}
	}`));
	add(new RawFunc("__helios__option__none__new", `
	() -> {
		constrData(1, ${makeList([])})
	}`));
	add(new RawFunc("__helios__option__none__cast", `
	(data) -> {
		__helios__common__assert_constr_index(data, 1)
	}`));


	// Hash builtins
	addEqNeqSerialize("__helios__hash");
	add(new RawFunc("__helios__hash__new", `__helios__common__identity`));
	add(new RawFunc("__helios__hash__show", "__helios__bytearray__show"));


	// ScriptContext builtins
	addEqNeqSerialize("__helios__scriptcontext");
	add(new RawFunc("__helios__scriptcontext__tx", `
	(self) -> {
		${unData("self", 0, 0)}
	}`));
	add(new RawFunc("__helios__scriptcontext__get_spending_purpose_output_id", `
	(self) -> {
		() -> {
			${unData(unData(0, 1), 1, 0)}
		}
	}`));
	add(new RawFunc("__helios__scriptcontext__get_current_validator_hash", `
	(self) -> {
		() -> {
			__helios__credential__validator__hash(
				__helios__credential__validator__cast(
					__helios__address__credential(
						__helios__txoutput__address(
							__helios__txinput__output(
								__helios__scriptcontext__get_current_input(self)
							)
						)
					)
				)
			)
		}
	}`));
	add(new RawFunc("__helios__scriptcontext__get_current_minting_policy_hash", `
	(self) -> {
		() -> {
			${unData(unData("self", 0, 1), 0, 0)}
		}
	}`));
	add(new RawFunc("__helios__scriptcontext__get_current_input", `
	(self) -> {
		(id) -> {
			__helios__list__find(__helios__tx__inputs(__helios__scriptcontext__tx(self)))(
				(input) -> {
					__helios__common__boolData(__core__equalsData(__helios__txinput__output_id(input), id))
				}
			)
		}(__helios__scriptcontext__get_spending_purpose_output_id(ctx)())
	}`));
	

	// Tx builtins
	addEqNeqSerialize("__helios__tx");
	add(new RawFunc("__helios__tx__inputs", `
	(self) -> {
		${unData("self", 0, 0)}
	}`));
	add(new RawFunc("__helios__tx__outputs", `
	(self) -> {
		${unData("self", 0, 1)}
	}`));
	add(new RawFunc("__helios__tx__fee", `
	(self) -> {
		${unData("self", 0, 2)}
	}`));
	add(new RawFunc("__helios__tx__minted", `
	(self) -> {
		${unData("self", 0, 3)}
	}`));
	add(new RawFunc("__helios__tx__time_range", `
	(self) -> {
		${unData("self", 0, 6)}
	}`));
	add(new RawFunc("__helios__tx__signatories", `
	(self) -> {
		${unData("self", 0, 7)}
	}`));
	add(new RawFunc("__helios__tx__id", `
	(self) -> {
		${unData("self", 0, 9)}
	}`));
	add(new RawFunc("__helios__tx__now", `
	(self) -> {
		() -> {
			__helios__timerange__get_start(__helios__tx__time_range(self)())
		}
	}`));
	add(new RawFunc("__helios__tx__find_datum_hash", `
		(self) -> {
			(datum) -> {
				${unData(`__helios__list__find(__helios__tx__datums(self))()
					(tuple) -> {
						__core__equalsData(${unData("tuple", 0, 1)}, datum)
					}
				)`, 0, 0)}
			}
		}
	}`));
	add(new RawFunc("__helios__tx__outputs_sent_to", `
	(self) -> {
		(hash) -> {
			__helios__list__filter(__helios__tx__outputs(self))(
				(output) -> {
					__helios__common__boolData((credential) -> {
						__core__ifThenElse(
							__helios__common__unBoolData(__helios__credential__is_pubkey(credential)),
							() -> {
								__core__ifThenElse(
									__core__equalsData(
										hash, 
										__helios__credential__pubkey__hash(
											__helios__credential__pubkey__cast(credential)
										)
									),
									true,
									false
								)
							},
							() -> {false}
						)()
					}(__helios__address__credential(__helios__txoutput__address(output))))
				}
			)
		}
	}`));
	add(new RawFunc("__helios__tx__outputs_locked_by", `
	(self) -> {
		(hash) -> {
			__helios__list__filter(__helios__tx__outputs(self))(
				(output) -> {
					__helios__common__boolData((credential) -> {
						__core__ifThenElse(
							__helios__common__unBoolData(__helios__credential__is_validator(credential)),
							() -> {
								__core__ifThenElse(
									__core__equalsData(
										hash, 
										__helios__credential__validator__hash(
											__helios__credential__validator__cast(cred)
										)
									),
									true,
									false
								)
							},
							() -> {false}
						)()
					}(__helios__address__credential(__helios__txoutput__address(output))))
				}
			)
		}
	}`));
	add(new RawFunc("__helios__tx__value_sent_to", `
	(self) -> {
		(hash) -> {
			(outputs) -> {
				__helios__list__fold(outputs)(
					(prev, txOutput) -> {
						__helios__value____add(prev)(__helios__txoutput__value(txOutput))
					}, 
					__helios__value__ZERO
				)	
			}(__helios__tx__outputs_sent_to(self)(hash))
		}
	}`));
	add(new RawFunc("__helios__tx__value_locked_by", `
	(self) -> {
		(hash) -> {
			(outputs) -> {
				__helios__list__fold(outputs)(
					(prev, output) -> {
						__helios__value____add(prev)(__helios__txoutput__value(output))
					}, 
					__helios__value__ZERO
				)
			}(__helios__tx__outputs_locked_by(self)(hash))
		}
	}`));
	add(new RawFunc("__helios__tx__value_locked_by_datum", `
	(self) -> {
		(hash, datum) -> {
			(outputs, dhash) -> {
				__helios__list__fold(outputs)(
					(prev, output) -> {
						__core__ifThenElse(
							__core__equalsData(__helios__txoutput__get_datum_hash(output), dhash),
							() -> {
								__helios__value____add(prev)(__helios__txoutput__value(output))
							},
							() -> {prev}
						)()
					}, 
					__helios__value__ZERO
				)
			}(__helios__tx__outputs_locked_by(self)(hash), __helios__tx__find_datum_hash(self)(datum))
		}
	}`));
	add(new RawFunc("__helios__tx__is_signed_by", `
	(self) -> {
		(hash) -> {
			__helios__list__any(__helios__tx__signatories(self))(
				(signatory) -> {
					__core__boolData(__core__equalsData(signatory, hash))
				}
			)
		}
	}`));


	// TxId builtins
	addEqNeqSerialize("__helios__txid");


	// TxInput builtins
	addEqNeqSerialize("__helios__txinput");
	add(new RawFunc("__helios__txinput__output_id", `
	(self) -> {
		() -> {
			${unData("self", 0, 0)}
		}
	}`));
	add(new RawFunc("__helios__txinput__output", `
	(self) -> {
		() -> {
			${unData("self", 0, 1)}
		}
	}`));


	// TxOutput builtins
	addEqNeqSerialize("__helios__txoutput");
	add(new RawFunc("__helios__txoutput__address", `
	(self) -> {
		() -> {
			${unData("self", 0, 0)}
		}
	}`));
	add(new RawFunc("__helios__txoutput__value", `
	(self) -> {
		() -> {
			${unData("self", 0, 1)}
		}
	}`));
	add(new RawFunc("__helios__txoutput__datum_hash", `
	(self) -> {
		() -> {
			${unData("self", 0, 2)}
		}
	}`));
	add(new RawFunc("__helios__txoutput__get_datum_hash", `
	(self) -> {
		() -> {
			(pair) -> {
				__core__ifThenElse(
					__core__equalsInteger(__core__fstPair(pair), 0),
					() -> {__core__headList(__core__sndPair(pair))},
					() -> {__core__bData(#)}
				)()
			}(__core__unConstrData(${unData("self", 0, 2)}))
		}
	}`));


	// TxOutputId
	addEqNeqSerialize("__helios__txoutputid");
	add(new RawFunc("__helios__txoutputid__new", `
	(tx_id, idx) -> {
		constrData(0, ${makeList(`constrData(0, ${makeList("tx_id")})`, "idx")})
	}`));


	// Address
	addEqNeqSerialize("__helios__address");
	add(new RawFunc("__helios__address__credential", `
	(self) -> {
		() -> {
			${unData("self", 0, 0)}
		}
	}`));
	add(new RawFunc("__helios__address__staking_credential", `
	(self) -> {
		() -> {
			${unData("self", 0, 0)}
		}
	}`));
	add(new RawFunc("__helios__address__is_staked", `
	(self) -> {
		() -> {
			__helios__common__boolData(__core__equalsInteger(__core__fstPair(__core__unConstrData(${unData("self", 0, 1)})), 0))
		}
	}`));


	// Credential builtins
	addEqNeqSerialize("__helios__credential");
	add(new RawFunc("__helios__credential__is_pubkey", `
	(self) -> {
		() -> {
			__helios__common__boolData(__core__equalsInteger(__core__fstPair(__core__unConstrData(self)), 0)
		}
	}`));
	add(new RawFunc("__helios__credential__is_validator", `
	(self) -> {
		() -> {
			__helios__common__boolData(__core__equalsInteger(__core__fstPair(__core__unConstrData(self)), 1)
		}
	}`));


	// Credential::PubKey builtins
	addEqNeqSerialize("__helios__credential__pubkey");
	add(new RawFunc("__helios__credential__pubkey__cast", `
	(data) -> {
		__helios__common__assert_constr_index(data, 0)
	}`));
	add(new RawFunc("__helios__credential__pubkey__hash", `
	(self) -> {
		${unData("self", 0, 0)}
	}`));


	// Credential::Validator builtins
	addEqNeqSerialize("__helios__credential__validator");
	add(new RawFunc("__helios__credential__validator__cast", `
	(data) -> {
		__helios__common__assert_constr_index(data, 1)
	}`));
	add(new RawFunc("__helios__credential__validator__hash", `
	(self) -> {
		${unData("self", 1, 0)}
	}`));
	

	// StakingCredential builtins
	addEqNeqSerialize("__helios__stakingcredential");


	// Time builtins
	addEqNeqSerialize("__helios__time");
	add(new RawFunc("__helios__time__new", `__helios__common__identity`));
	add(new RawFunc("__helios__time____add", `__helios__int____add`));
	add(new RawFunc("__helios__time____sub", `__helios__int____sub`));
	add(new RawFunc("__helios__time____geq", `__helios__int____geq`));
	add(new RawFunc("__helios__time____gt", `__helios__int____gt`));
	add(new RawFunc("__helios__time____leq", `__helios__int____leq`));
	add(new RawFunc("__helios__time____lt", `__helios__int____lt`));
	add(new RawFunc("__helios__time__show", `__helios__int__show`));


	// Duratin builtins
	addEqNeqSerialize("__helios__duration");
	add(new RawFunc("__helios__duration__new", `__helios__common__identity`));
	add(new RawFunc("__helios__duration____add", `__helios__int____add`));
	add(new RawFunc("__helios__duration____sub", `__helios__int____sub`));
	add(new RawFunc("__helios__duration____mul", `__helios__int____mul`));
	add(new RawFunc("__helios__duration____div", `__helios__int____div`));
	add(new RawFunc("__helios__duration____mod", `__helios__int____mod`));
	add(new RawFunc("__helios__duration____geq", `__helios__int____geq`));
	add(new RawFunc("__helios__duration____gt", `__helios__int____gt`));
	add(new RawFunc("__helios__duration____leq", `__helios__int____leq`));
	add(new RawFunc("__helios__duration____lt", `__helios__int____lt`));
	

	// TimeRange builtins
	addEqNeqSerialize("__helios__timerange");
	add(new RawFunc("__helios__timerange__get_start", `
	(self) -> {
		() -> {
			${unData(unData(unData("timeRange", 0, 0), 0, 0), 1, 0)}
		}
	}`));


	// AssetClass builtins
	addEqNeqSerialize("__helios__assetclass");
	add(new RawFunc("__helios__assetclass__ADA", `__helios__assetclass_new(__core__bData(#), __helios__common__stringData(""))`));
	add(new RawFunc("__helios__assetclass__new", `
	(mintingPolicyHash, tokenName) -> {
		__core__constrData(0, ${makeList(["mintingPolicyHash", "tokenName"])})
	}`));


	// MoneyValue builtins
	add(new RawFunc("__helios__value__serialize", "__helios__common__serialize"));
	add(new RawFunc("__helios__value__ZERO", `__core__mapData(__core__mkNilPairData(()))`));
	add(new RawFunc("__helios__value__lovelace", `
	(i) -> {
		__helios__value__new(__helios__assetclass__ADA, i)
	}`));
	add(new RawFunc("__helios__value__new", `
	(assetClass, i) -> {
		(mintingPolicyHash, tokenName) -> {
			__core__mapData(
				__core__mkCons(
					__core__mkPairData(
						mintingPolicyHash, 
						__core__mapData(
							__core__mkCons(
								__core__mkPairData(tokenName, i), 
								__core__mkNilPairData(())
							)
						)
					), 
					__core__mkNilPairData(())
				)
			)
		}(${unData("assetClass", 0, 0)}, ${unData("assetClass", 0, 1)})
	}`));
	add(new RawFunc("__helios__value__get_map_keys", `
	(map) -> {
		(recurse) -> {
			recurse(recurse, map)
		}(
			(recurse, map) -> {
				__core__ifThenElse(
					__core__nullList(map), 
					() -> {__core__mkNilData(())}, 
					() -> {__core__mkCons(__core__fstPair(__core__headList(map)), recurse(recurse, __core__tailList(map)))}
				)()
			}
		)
	}`));	
	add(new RawFunc("__helios__value__merge_map_keys", `
	(a, b) -> {
		(aKeys) -> {
			(recurse) -> {
				recurse(recurse, aKeys, b)
			}(
				(recurse, keys, map) -> {
					__core__ifThenElse(
						__core__nullList(map), 
						() -> {keys}, 
						() -> {
							(key) -> {
								__core__ifThenElse(
									__helios__common__is_in_bytearray_list(aKeys, key), 
									() -> {recurse(recurse, keys, __core__tailList(map))},
									() -> {__core__mkCons(__core__bData(key), recurse(recurse, keys, __core__tailList(map)))}
								)()
							}(__core__fstPair(__core__headList(map)))
						}
					)()
				}
			)
		}(__helios__value__get_map_keys(a))
	}`));
	
	add(new RawFunc("__helios__value__get_inner_map", `
	(map, mintingPolicyHash) -> {
		(recurse) -> {
			recurse(recurse, map)
		}(
			(recurse, map) -> {
				__core__ifThenElse(
					__core__nullList(map), 
					() -> {__core__mkNilPairData(())},
					() -> {
						__core__ifThenElse(
							__core__equalsData(__core__fstPair(__core__headList(map))), mintingPolicyHash), 
							() -> {__core__unMapData(__core__sndPair(__core__headList(map)))},
							(){recurse(recurse, __core__tailList(map))}
						)()
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__value__get_inner_map_int", `
	(map, key) -> {
		(recurse) -> {
			recurse(recurse, map, key)
		}(
			(recurse, map, key) -> {
				__core__ifThenElse(
					__core__nullList(map), 
					() -> {0}, 
					() -> {
						__core__ifThenElse(
							__core__equalsData(__core__fstPair(__core__headList(map))), key), 
							(){__core__unIData(__core__sndPair(__core__headList(map)))}, 
							(){recurse(recurse, __core__tailList(map), key)}
						)()
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__value__add_or_subtract_inner", `
	(op) -> {
		(a, b) -> {
			(recurse) -> {
				recurse(recurse, __helios__value__merge_map_keys(a, b), __core__mkNilPairData(()))
			}(
				(recurse, keys, result) -> {
					__core__ifThenElse(
						__core__nullList(keys), 
						() -> {result}, 
						() -> {
							(key, tail) -> {
								(sum) -> {
									__core__ifThenElse(
										__core__equalsInteger(sum, 0), 
										() -> {tail}, 
										() -> {__core__mkCons(__core__mkPairData(key, __core__iData(sum)), tail)}
									)()
								}(op(__helios__value__get_inner_map_int(a, key), __helios__value__get_inner_map_int(b, key)))
							}(__core__headList(keys), recurse(recurse, __core_tailList(keys), result))
						}
					)()
				}
			)
		}
	}`));
	add(new RawFunc("__helios__value__add_or_subtract", `
	(op, a, b) -> {
		(a, b) -> {
			(recurse) -> {
				__core__mapData(recurse(recurse, __helios__value__merge_map_keys(a, b), __core__mkNilPairData(())))
			}(
				(recurse, keys, result) -> {
					__core__ifThenElse(
						__core__nullList(keys), 
						() -> {result}, 
						() -> {
							(key, tail) -> {
								(item) -> {
									__core__ifThenElse(
										__core__nullList(item), 
										() -> {tail}, 
										() -> {__core__mkCons(__core__mkPairData(key, __core__mapData(item)), tail)}
									)()
								}(__helios__value__add_or_substract_inner(op)(__helios__value__get_inner_map(a, key), __helios__value__get_inner_map(b, key)))
							}(__core__headList(keys), recurse(recurse, __core__tailList(keys), result))
						}
					)()
				}
			)
		}(__core__unMapData(a), __core__unMapData(b))
	}`));
	add(new RawFunc("__helios__value__compare_inner", `
	(comp, a, b) -> {
		(recurse) -> {
			recurse(recurse, __helios__value__merge_map_keys(a, b))
		}(
			(recurse, keys) -> {
				__core__ifThenElse(
					__core__nullList(keys), 
					() -> {true}, 
					() -> {
						(key) -> {
							__core__ifThenElse(
								__helios__common__not(comp(__helios__value__get_inner_map_int(a, key), __helios__value__get_inner_map_int(b, key))})(), 
								() -> {false}, 
								() -> {recurse(recurse, __core__tailList(keys))}
							)()
						}(__core__headList(keys))
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__value__compare", `
	(comp, a, b) -> {
		(a, b) -> {
			(recurse) -> {
				__helios__common__boolData(recurse(recurse, __helios__value__merge_map_keys(a, b)))
			}(
				(recurse, keys) -> {
					__core__ifThenElse(
						__core__nullList(keys), 
						() -> {true}, 
						() -> {
							(key) -> {
								__core__ifThenElse(
									__helios__common__not(
										__helios__value__compare_inner(
											comp, 
											__helios__value__get_inner_map(a, key), 
											__helios__value__get_inner_map(b, key)
										)
									), 
									() -> {false}, 
									() -> {recurse(recurse, __core__tailList(keys))}
								)()
							}(__core__headList(keys))
						}
					)()
				}
			)
		}(__core__unMapData(a), __core__unMapData(b))
	}`));
	add(new RawFunc("__helios__value____eq", `
	(self) -> {
		(other) -> {
			__helios__value__compare((a, b) -> {__core__equalsInteger(a, b)}, self, other)
		}
	}`));
	add(new RawFunc("__helios__value____neq", `
	(self) -> {
		(other) -> {
			__helios__bool____not(__helios__value____eq(self)(other))()
		}
	}`));
	add(new RawFunc("__helios__value____add", `
	(self) -> {
		(other) -> {
			__helios__value__add_or_subtract((a, b) -> {__core__addInteger(a, b)}, self, other)
		}
	}`));
	add(new RawFunc("__helios__value____sub", `
	(self) -> {
		(other) -> {
			__helios__value__add_or_subtract((a, b) -> {__core__subtractInteger(a, b)}, self, other)
		}
	}`));
	add(new RawFunc("__helios__value____geq", `
	(self) -> {
		(other) -> {
			__helios__value__compare((a, b) -> {__helios__common__not(__core__lessThanInteger(a, b))}, self, other)
		}
	}`));
	add(new RawFunc("__helios__value____gt", `
	(self) -> {
		(other) -> {
			__helios__bool__and(
				__helios__bool____not(
					helios__bool__and(
						__helios__value__is_zero(self),
						__helios__value__is_zero(other)
					)
				),
				__helios__value__compare((a, b) -> {__helios__common__not(__core__lessThanEqualsInteger(a, b))}, self, other)
			)
		}
	}`));
	add(new RawFunc("__helios__value____leq", `
	(self) -> {
		(other) -> {
			__helios__value__compare((a, b) -> {__core__lessThanEqualsInteger(a, b)}, self, other)
		}
	}`));
	add(new RawFunc("__helios__value____lt", `
	(self) -> {
		(other) -> {
			__helios__bool__and(
				__helios__bool____not(
					helios__bool__and(
						__helios__value__is_zero(self),
						__helios__value__is_zero(other)
					)
				),
				__helios__value__compare((a, b) -> {__core__lessThanInteger(a, b)}, self, other)
			)
		}
	}
	`));
	add(new RawFunc("__helios__value__is_zero", `
	(self) -> {
		() -> {
			__helios__common__boolData(__core__nullList(__core__unMapData(self)))
		}
	}`));
	add(new RawFunc("__helios__value__get", `
	(self) -> {
		(assetClass) -> {
			(map, mintingPolicyHash, tokenName) -> {
				(outer, inner) -> {
					__core__iData(outer(outer, inner, map))
				}(
					(outer, inner, map) -> {
						__core__ifThenElse(
							__core__nullList(map), 
							() -> {__core__iData(0)}, 
							() -> {
								__core__ifThenElse(
									__core__equalsData(__core__fstPair(__core__headList(map)), mintingPolicyHash), 
									() -> {inner(inner, __core__unMapData(__core__sndPair(__core__headList(map))))}, 
									() -> {outer(outer, inner, __core__tailList(map))}
								)()
							}
						)()
					}, (inner, map) -> {
						__core__ifThenElse(
							__core__nullList(map), 
							() -> {__core__iData(0)}, 
							() -> {
								__core__ifThenElse(
									__core__equalsData(__core__fstPair(__core__headList(map)), tokenName),
									() -> {__core__sndPair(__core__headList(map))},
									() -> {inner(inner, __core__tailList(map))}
								)()
							}
						)()
					}
				)
			}(__core__unMapData(self), ${unData("assetClass", 0, 0)}, ${unData("assetClass", 0, 1)})
		}
	}`));

	return db;
}

function wrapWithRawFunctions(src) {
	let db = makeRawFunctions();

	let re = new RegExp("__helios[a-zA-Z0-9_]*", "g");

	let matches = src.match(re);

	let map = new Map();

	if (matches != null) {
		for (let match of matches) {
			if (!map.has(match)) {
				if (!db.has(match)) {
					throw new Error(`builtin ${match} not found`);
				}

				let builtin = db.get(match);

				builtin.load(db, map);
			}
		}
	}

	return TopScope.wrapWithDefinitions(src, map);
}


//////////////////////////////////
// Section 14: Untyped AST objects
//////////////////////////////////

class UntypedScope {
	constructor(parent, name) {
		this.parent_ = parent;
		this.name_ = name;
	}

	getInternal(name, index) {
		if (this.name_.toString() == name.toString()) {
			return index;
		} else if (this.parent_ == null || this.parent_ == undefined) {
			let msg = `variable ${name.toString()} not found`;
			throw new Error(msg);
			name.referenceError(msg);
		} else {
			return this.parent_.getInternal(name, index+1);
		}
	}

	get(name) {
		// one-based
		return this.getInternal(name, 1);
	}

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

	static findBuiltin(name) {
		let i = PLUTUS_CORE_BUILTINS.findIndex(info => {return "__core__" + info.name == name});
		assert(i != -1, `${name} is not a real builtin`);
		return i;
	}
}

class UntypedExpr {
	constructor(site) {
		assert(site != undefined && site instanceof Site);
		this.site_ = site;
	}

	get site() {
		return this.site_;
	}
}

class UntypedFuncExpr extends UntypedExpr {
	constructor(site, argNames, body) {
		super(site);
		this.argNames_ = argNames;
		this.body_ = body;
	}

	toString(indent = "") {
		let s = "(" + this.argNames_.map(n => n.toString()).join(", ") + ") -> {\n" + indent + "  ";
		s += this.body_.toString(indent + "  ");
		s += "\n" + indent + "}";

		return s;
	}

	link(scope) {
		if (this.argNames_.length == 0) {
			scope = new UntypedScope(scope, "");
		} else {
			for (let argName of this.argNames_) {
				scope = new UntypedScope(scope, argName);
			}
		}

		this.body_.link(scope);
	}

	toPlutusCore() {
		let term = this.body_.toPlutusCore();

		if (this.argNames_.length == 0) {
			// must wrap at least once, even if there are no args
			term = new PlutusCoreLambda(this.site, term);
		} else {
			for (let i = this.argNames_.length - 1; i >=0; i--) {
				term = new PlutusCoreLambda(this.site, term, this.argNames_[i]);
			}
		}

		return term;
	}
}

class UntypedErrorCallExpr extends UntypedExpr {
	constructor(site) {
		super(site);
	}

	toString(indent) {
		return "error()";
	}

	link(scope) {
	}

	toPlutusCore() {
		return new PlutusCoreError(this.site);
	}
}

class UntypedCallExpr extends UntypedExpr {
	constructor(lhs, argExprs, parensSite) {
		super(lhs.site);
		assert(lhs != null);
		this.lhs_ = lhs;
		this.argExprs_ = argExprs;
		this.parensSite_ = parensSite;
	}

	toString(indent = "") {
		return this.lhs_.toString(indent) + "(" + this.argExprs_.map(e => e.toString(indent)).join(", ") + ")";
	}

	isBuiltin() {
		if (this.lhs_ instanceof UntypedVariable) {
			return UntypedScope.isBuiltin(this.lhs_.name, true);
		} else {
			return false;
		}
	}

	builtinForceCount() {
		if (this.lhs_ instanceof UntypedVariable && UntypedScope.isBuiltin(this.lhs_.name)) {
			let i = UntypedScope.findBuiltin(this.lhs_.name);

			let info = PLUTUS_CORE_BUILTINS[i];
			return info.forceCount;
		} else {
			return 0;
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
			term = new PlutusCoreBuiltin(this.site, this.lhs_.name.slice("__core__".length));

			let nForce = this.builtinForceCount();

			for (let i = 0; i < nForce; i++) {
				term = new PlutusCoreForce(this.site, term);
			}
		} else {
			term = this.lhs_.toPlutusCore();
		}

		if (this.argExprs_.length == 0) {
			// a PlutusCore function call (aka function application) always requires a argument. In the zero-args case this is the unit value
			term = new PlutusCoreCall(this.parensSite_, term, new PlutusCoreUnit(this.parensSite_));
		} else {
			for (let arg of this.argExprs_) {
				term = new PlutusCoreCall(this.parensSite_, term, arg.toPlutusCore());
			}
		}

		return term;
	}
}

class UntypedVariable extends UntypedExpr {
	constructor(name) {
		super(name.site);
		assert(name.toString() != "_");
		this.name_ = name;
		this.index_ = null; // debruijn index
	}

	get name() {
		return this.name_.toString();
	}

	toString() {
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
		return new PlutusCoreVariable(this.site, new PlutusCoreInt(this.site, BigInt(this.index_), false));
	}
}


//////////////////////////////////////////
// Section 15: Untyped AST build functions
//////////////////////////////////////////

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

		if (t.isGroup("(") && ts.length > 0 && ts[0].isSymbol("->")) {
			assert(expr == null);

			ts.unshift(t);
			expr = buildUntypedFuncExpr(ts);
		} else if (t.isGroup("(")) {
			if (expr == null) {
				if(t.fields.length == 1) {
					expr = buildUntypedExpr(t.fields[0])
				} else if (t.fields.length == 0) {
					expr = new UnitLiteral(t.site);
				} else {
					t.synaxError("unexpected parentheses with multiple fields");
				}
			} else {
				let args = [];
				for (let f of t.fields) {
					args.push(buildUntypedExpr(f));
				}

				expr = new UntypedCallExpr(expr, args, t.site);
			}
		} else if (t.isSymbol("-")) {
			// only makes sense next to IntegerLiterals
			let int = ts.shift();
			assert(int instanceof IntLiteral);
			expr = new IntLiteral(int.site, int.value_*(-1n));
		} else if (t instanceof BoolLiteral) {
			assert(expr == null);
			expr = t;
		} else if (t instanceof IntLiteral) {
			assert(expr == null);
			expr = t;
		} else if (t instanceof ByteArrayLiteral) {
			assert(expr == null);
			expr = t;
		} else if (t instanceof StringLiteral) {
			assert(expr == null);
			expr = t;
		} else if (t.isWord("__core__error")) {
			assert(expr == null);
			let parens = ts.shift().assertGroup("(");
			assert(parens.fields.length == 0);
			expr = new UntypedErrorCallExpr(t.site);
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
	let parens = ts.shift().assertGroup("(");
	ts.shift().assertSymbol("->");
	let braces = ts.shift().assertGroup("{");

	let argNames = [];
	for (let f of parens.fields) {
		assert(f.length == 1, "expected single word per arg");
		argNames.push(f[0].assertWord());
	}

	if (braces.fields_.length > 1) {
		braces.typeError("unexpected comma in function body")
	} else if (braces.fields_.length == 0) {
		braces.typeError("empty function body")
	}

	let bodyExpr = buildUntypedExpr(braces.fields[0]);

	return new UntypedFuncExpr(parens.site, argNames, bodyExpr)
}


//////////////////////////////////////
// Section 16: Compiler user functions
//////////////////////////////////////

function preprocess(src, templateParameters) {
	for (let key in templateParameters) {
		let value = templateParameters[key];

		let re = new RegExp(`\\$${key}`, 'g');

		src = src.replace(re, value);
	}

	// check that there are no remaining template parameters left

	let re = new RegExp('\$[a-zA-Z_][0-9a-zA-Z_]*');

	let matches = src.match(re);

	if (matches != null) {
		for (let match of matches) { // how to get the position in the code?
			throw UserError.syntaxError(new Source(src), match.index, `unsubstituted template parameter '${match[0]}'`);
		}
	}

	return src;
}

export const CompilationStage = {
	Preprocess: 0,
	Tokenize:   1,
	BuildAST:   2,
	Untype:     3,
	PlutusCore: 4,
	Final:      5,
};

const DEFAULT_CONFIG = {
	verbose: false,
	templateParameters: {},
	stage: CompilationStage.Final,
};

function compileInternal(typedSrc, config) {
	typedSrc = preprocess(typedSrc, config.templateParameters);

	if (config.stage == CompilationStage.Preprocess) {
		return typedSrc;
	}

	let ts = tokenize(typedSrc);

	if (config.stage == CompilationStage.Tokenize) {
		return ts;
	}

	if (ts.length == 0) {
		throw UserError.syntaxError(new Source(typedSrc), 0, "empty script");
	}

	let program = buildProgram(ts);

	if (config.stage == CompilationStage.BuildAST) {
		return program;
	}

	let globalScope = GlobalScope.new();
	program.eval(globalScope);
	let untypedSrc = program.toUntyped();

	if (config.stage == CompilationStage.Untype) {
		return untypedSrc;
	}

	let untypedTokens = tokenizeUntyped(untypedSrc);
	let untypedProgram = buildUntypedProgram(untypedTokens);
	let plutusCoreProgram = new PlutusCoreProgram(untypedProgram.toPlutusCore());

	if (config.stage == CompilationStage.PlutusCore) {
		return plutusCoreProgram;
	}
	
	assert(config.stage == CompilationStage.Final);

	return plutusCoreProgram.serialize();
}

// if any error is caught null is returned
// upon success [purpose, name] is returned
export function extractScriptPurposeAndName(rawSrc) {
	try {
		let src = new Source(rawSrc);

		let tokenizer = new Tokenizer(src);
		
		let gen = tokenizer.streamTokens();

		// eat 3 tokens: `<purpose> <name>;`
		let ts = [];
		for (let i = 0; i < 3; i++) {
			let yielded = gen.next();
			if (yielded.done) {
				return null;
			}

			ts.push(yielded.value);
		}

		let [purposeWord, nameWord] = buildScriptPurpose(ts);

		return [purposeWord.value, nameWord.value];
	} catch(e) {
		if (!(e instanceof UserError)) {
			throw e;
		} else {
			return null;
		}
	}
}

// config members:
//    templateParameters
//    stage (defaults to CompilationStage.Final)
// compile() returns a different object depending on 'stage':
//    Preprocess: substitute template parameters and return preprocessed string
//    Tokenize:   parse source and return list of tokens
//    BuildAST:   build AST and return top-level Program object
//    Untype:     performs type evaluation, returns untyped program as string
//    PlutusCore: build Plutus-Core program from untyped program, returns top-level PlutusCoreProgram object
//    Final:      encode Plutus-Core program in flat format and return JSON string containing cborHex representation of program
export function compile(typedSrc, config = Object.assign({}, DEFAULT_CONFIG)) {
	// additional checks of config
	config.verbose = config.verbose || false;
	config.templateParameters = config.templateParameters || {};
	config.stage = config.stage || CompilationStage.Final;

	return compileInternal(typedSrc, config);
}

// run a test script (first word of script must be 'testing')
export async function run(typedSrc, config = DEFAULT_CONFIG) {
	let program;

	UserError.catch(function() {
		config.stage = CompilationStage.PlutusCore;

		program = compileInternal(typedSrc, config);
	}, true);

	let result = await program.run({
		onPrint: function(msg) {console.log(msg)}
	});

	console.log(result.toString());
}

// TODO: use a special JSON schema instead
// output is a string with JSON content
/*export function compileData(programSrc, dataExprSrc, config = {
	templateParameters: {}
}) {
	config.templateParameters = config?.templateParameters??{};

	programSrc = preprocess(programSrc, config.templateParameters);
	let ts = tokenize(typedSrc);
	let program = return buildProgram(ts);
	let globalScope = GlobalScope.new();
	program.eval(globalScope);

	dataExprSrc = preprocess(dataExprSrc, config.templateParameters);
	let dataExprTokens = tokenize(dataExprSrc);
	let dataExpr = buildValueExpr(dataExprTokens);

	dataExpr.eval(program.scope);
	// TODO
	let data = dataExpr.evalData();

	return data.toSchemaJSON();
}*/


//////////////////////////////////////////
// Section 17: Plutus-Core deserialization
//////////////////////////////////////////

class PlutusCoreDeserializer {
	constructor(bytes) {
		this.view_    = new Uint8Array(bytes);
		this.pos_     = 0; // bit position, not byte position
	}

	tagWidth(category) {
		assert(category in PLUTUS_CORE_TAG_WIDTHS, `unknown tag category ${category.toString()}`);

		return PLUTUS_CORE_TAG_WIDTHS[category];
	}

	// returns the integer id if id is out of range
	builtinName(id) {
		let all = PLUTUS_CORE_BUILTINS;

		if (id >= 0 && id < all.length) {
			return all[id].name;
		} else {
			console.error(`Warning: builtin id ${id.toString()} out of range`);

			return id;
		}
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

			void this.readBits(n);
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
				return this.readCall(); // aka function application
			case 4:
				return this.readConstant();
			case 5:
				return this.readForce();
			case 6:
				return new PlutusCoreError(Site.dummy());
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

		while (!PlutusCoreInt.rawByteIsLast(b)) {
			b = this.readByte();
			bytes.push(b);
		}

		// strip the leading bit
		let res = new PlutusCoreInt(Site.dummy(), PlutusCoreInt.bytesToBigInt(bytes.map(b => PlutusCoreInt.parseRawByte(b))), false); // raw int is unsigned

		if (signed) {
			res = res.toSigned(); // unzigzag is performed here
		}

		return res;
	}

	readVariable() {
		let index = this.readInteger()

		return new PlutusCoreVariable(Site.dummy(), index);
	}

	readLambda() {
		let rhs  = this.readTerm();

		return new PlutusCoreLambda(Site.dummy(), rhs);
	}

	readCall() {
		let a = this.readTerm();
		let b = this.readTerm();

		return new PlutusCoreCall(Site.dummy(), a, b);
	}

	readDelay() {
		let expr = this.readTerm();

		return new PlutusCoreDelay(Site.dummy(), expr);
	}

	readForce() {
		let expr = this.readTerm();

		return new PlutusCoreForce(Site.dummy(), expr);
	}

	readBuiltin() {
		let id = this.readBits(this.tagWidth("builtin"));

		let name = this.builtinName(id);

		return new PlutusCoreBuiltin(Site.dummy(), name);
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
				res = new PlutusCoreUnit(Site.dumm()); // no reading needed
				break;
			case 4: // Bool
				res = new PlutusCoreBool(Site.dummy(), this.readBits(1) == 1);
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

		return new PlutusCoreByteArray(Site.dummy(), bytes);
	}

	readString() {
		let bytes = this.readChars();

		let s = bytesToString(bytes);

		return new PlutusCoreString(Site.dummy(), s);
	}

	finalize() {
		this.moveToByteBoundary(true);
	}
}

export function deserializePlutusCore(jsonString) {
	let obj = JSON.parse(jsonString);

	if (! ("cborHex" in obj)) {
		throw UserError.syntaxError(new Source(jsonString), 0, "cborHex field not in json")
	}

	let cborHex = obj.cborHex;
	if (typeof cborHex != "string") {
		throw UserError.syntaxError(new Source(jsonString), jsonString.match(/cborHex/).index, "cborHex not a string");
	}

	let bytes = unwrapCborBytes(unwrapCborBytes(hexToBytes(hexToString)));

	let reader = new PlutusCoreDeserializer(bytes);

	let version = [
		reader.readInteger(),
		reader.readInteger(),
		reader.readInteger(),
	];

	let versionKey = version.map(v => v.toString()).join(".");

	if (versionKey != PLUTUS_CORE_VERSION) {
		console.error("Warning: Plutus-Core script doesn't match version of Helios");
	}

	let expr = reader.readTerm();

	reader.finalize();

	return new PlutusCoreProgram(expr, version);
}
