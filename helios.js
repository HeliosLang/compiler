//@ts-check
//////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////      Helios      /////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////
//
// Author:        Christian Schmitz
// Email:         cschmitz398@gmail.com
// Website:       https://www.hyperion-bt.org
// Repository:    https://github.com/hyperion-bt/helios
// Version:       0.13.28
// Last update:   April 2023
// License type:  BSD-3-Clause
//
//
// About: Helios is a smart contract DSL for Cardano.
//     This Javascript library contains functions to compile Helios sources into Plutus-core.
//     Transactions can also be built using Helios.
//
//
// Dependencies: none
//
//
// Disclaimer: I made Helios available as FOSS so that the Cardano community can test it 
//     extensively. I don't guarantee the library is bug-free, nor do I guarantee
//     backward compatibility with future versions.
//
//
// Example usage:
//     > import * as helios from "helios.js";
//     > console.log(helios.Program.new("spending my_validator ...").compile().serialize());
//     
//
// Documentation: https://www.hyperion-bt.org/helios-book
//
//
// Note: I recommend keeping the Helios library as a single unminified file for optimal 
//     auditability.
//
// 
// License text:
//     Copyright 2023 Christian Schmitz
//     
//     Redistribution and use in source and binary forms, with or without 
//     modification, are permitted provided that the following conditions are met:
//     
//     1. Redistributions of source code must retain the above copyright notice, this 
//     list of conditions and the following disclaimer.
//     
//     2. Redistributions in binary form must reproduce the above copyright notice, 
//     this list of conditions and the following disclaimer in the documentation 
//     and/or other materials provided with the distribution.
//     
//     3. Neither the name of the copyright holder nor the names of its contributors 
//     may be used to endorse or promote products derived from this software without 
//     specific prior written permission.
//     
//     THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS “AS IS” 
//     AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE 
//     IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
//     DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE 
//     FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL 
//     DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR 
//     SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER 
//     CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, 
//     OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE 
//     OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//     
//
//
// Overview of internals:
//     Section 1: Config                     VERSION, TAB, config
//
//     Section 2: Utilities                  assert, assertDefined, assertClass, assertNumber, 
//                                           reduceNull, reduceNullPairs, eq, assertEq, idiv, 
//                                           ipow2, imask, imod8, bigIntToBytes, bytesToBigInt, 
//                                           padZeroes, byteToBitString, hexToBytes, bytesToHex, 
//                                           textToBytes, bytesToText, replaceTabs, BitReader, 
//                                           BitWriter, Source, hl, deprecationWarning
//
//     Section 3: Tokens                     Site, RuntimeError, Token, assertToken, Word, 
//                                           SymbolToken, Group, PrimitiveLiteral, IntLiteral, 
//                                           BoolLiteral, ByteArrayLiteral, StringLiteral
//
//     Section 4: Cryptography functions     BLAKE2B_DIGEST_SIZE, setBlake2bDigestSize, imod32, 
//                                           irotr, posMod, UInt64, Crypto
//
//     Section 5: Cbor encoder/decoder       CborData
//
//     Section 6: Uplc data types            UPLC_DATA_NODE_MEM_SIZE, UplcData, IntData, 
//                                           ByteArrayData, ListData, MapData, ConstrData
//
//     Section 7: Helios data objects        HeliosData, HInt, Time, Duration, Bool, HString, 
//                                           ByteArray, HList, HMap, Option, Hash, DatumHash, 
//                                           PubKeyHash, ScriptHash, MintingPolicyHash, 
//                                           StakeKeyHash, StakingValidatorHash, ValidatorHash, 
//                                           TxId, TxOutputId, Address, AssetClass, Assets, Value
//
//     Section 8: Uplc cost-models           NetworkParams, CostModel, ConstCost, LinearCost, 
//                                           ArgSizeCost, Arg0SizeCost, Arg1SizeCost, 
//                                           Arg2SizeCost, MinArgSizeCost, MaxArgSizeCost, 
//                                           SumArgSizesCost, ArgSizeDiffCost, ArgSizeProdCost, 
//                                           ArgSizeDiagCost
//
//     Section 9: Uplc built-in functions    UPLC_BUILTINS, dumpCostModels, findUplcBuiltin, 
//                                           isUplcBuiltin
//
//     Section 10: Uplc AST                  ScriptPurpose, getPurposeName, UplcValue, UplcType, 
//                                           DEFAULT_UPLC_RTE_CALLBACKS, UplcRte, UplcStack, 
//                                           UplcAnon, UplcDelayedValue, UplcInt, UplcByteArray, 
//                                           UplcString, UplcUnit, UplcBool, UplcPair, UplcList, 
//                                           UplcDataValue, UplcTerm, UplcVariable, UplcDelay, 
//                                           UplcLambda, UplcCall, UplcConst, UplcForce, 
//                                           UplcError, UplcBuiltin
//
//     Section 11: Uplc program              UPLC_VERSION_COMPONENTS, UPLC_VERSION, 
//                                           PLUTUS_SCRIPT_VERSION, deserializeUplcBytes, 
//                                           deserializeUplc
//
//     Section 12: Tokenization              Tokenizer, tokenize, tokenizeIR
//
//     Section 13: Helios eval entities      EvalEntity, Type, AnyType, DataType, AnyDataType, 
//                                           BuiltinType, BuiltinEnumMember, StatementType, 
//                                           StructStatementType, EnumStatementType, 
//                                           EnumMemberStatementType, ArgType, FuncType, NotType, 
//                                           Instance, DataInstance, ConstStatementInstance, 
//                                           FuncInstance, FuncStatementInstance, MultiInstance, 
//                                           VoidInstance, ErrorInstance, BuiltinFuncInstance, 
//                                           PrintFunc, VoidType, ErrorType, IntType, BoolType, 
//                                           StringType, ByteArrayType, ParamType, ParamFuncValue, 
//                                           ListType, MapType, OptionType, OptionSomeType, 
//                                           OptionNoneType, HashType, PubKeyHashType, 
//                                           StakeKeyHashType, PubKeyType, ScriptHashType, 
//                                           ValidatorHashType, MintingPolicyHashType, 
//                                           StakingValidatorHashType, DatumHashType, 
//                                           ScriptContextType, ScriptPurposeType, 
//                                           MintingScriptPurposeType, SpendingScriptPurposeType, 
//                                           RewardingScriptPurposeType, 
//                                           CertifyingScriptPurposeType, StakingPurposeType, 
//                                           StakingRewardingPurposeType, 
//                                           StakingCertifyingPurposeType, DCertType, 
//                                           RegisterDCertType, DeregisterDCertType, 
//                                           DelegateDCertType, RegisterPoolDCertType, 
//                                           RetirePoolDCertType, TxType, TxIdType, TxInputType, 
//                                           TxOutputType, OutputDatumType, NoOutputDatumType, 
//                                           HashedOutputDatumType, InlineOutputDatumType, 
//                                           RawDataType, TxOutputIdType, AddressType, 
//                                           CredentialType, CredentialPubKeyType, 
//                                           CredentialValidatorType, StakingHashType, 
//                                           StakingHashStakeKeyType, StakingHashValidatorType, 
//                                           StakingCredentialType, StakingHashCredentialType, 
//                                           StakingPtrCredentialType, TimeType, DurationType, 
//                                           TimeRangeType, AssetClassType, ValueType
//
//     Section 14: Scopes                    GlobalScope, Scope, TopScope, ModuleScope, 
//                                           FuncStatementScope
//
//     Section 15: Helios AST expressions    Expr, TypeExpr, TypeRefExpr, TypePathExpr, 
//                                           ListTypeExpr, MapTypeExpr, OptionTypeExpr, 
//                                           VoidTypeExpr, FuncArgTypeExpr, FuncTypeExpr, 
//                                           ValueExpr, AssignExpr, PrintExpr, VoidExpr, 
//                                           ChainExpr, PrimitiveLiteralExpr, LiteralDataExpr, 
//                                           StructLiteralField, StructLiteralExpr, 
//                                           ListLiteralExpr, MapLiteralExpr, NameTypePair, 
//                                           FuncArg, FuncLiteralExpr, ValueRefExpr, 
//                                           ValuePathExpr, UnaryExpr, BinaryExpr, ParensExpr, 
//                                           CallArgExpr, CallExpr, MemberExpr, IfElseExpr, 
//                                           DestructExpr, SwitchCase, UnconstrDataSwitchCase, 
//                                           SwitchDefault, SwitchExpr, EnumSwitchExpr, 
//                                           DataSwitchExpr
//
//     Section 16: Literal functions         buildLiteralExprFromJson, buildLiteralExprFromValue
//
//     Section 17: Helios AST statements     Statement, ImportStatement, ConstStatement, 
//                                           DataField, DataDefinition, StructStatement, 
//                                           FuncStatement, EnumMember, EnumStatement, 
//                                           ImplDefinition
//
//     Section 18: Helios AST building       AUTOMATIC_METHODS, importPathTranslator, 
//                                           setImportPathTranslator, buildProgramStatements, 
//                                           buildScriptPurpose, buildScript, 
//                                           extractScriptPurposeAndName, buildConstStatement, 
//                                           splitDataImpl, buildStructStatement, buildDataFields, 
//                                           buildFuncStatement, buildFuncLiteralExpr, 
//                                           buildFuncArgs, buildEnumStatement, 
//                                           buildImportStatements, buildEnumMember, 
//                                           buildImplDefinition, buildImplMembers, buildTypeExpr, 
//                                           buildListTypeExpr, buildMapTypeExpr, 
//                                           buildOptionTypeExpr, buildFuncTypeExpr, 
//                                           buildFuncArgTypeExpr, buildFuncRetTypeExprs, 
//                                           buildTypePathExpr, buildTypeRefExpr, buildValueExpr, 
//                                           buildMaybeAssignOrPrintExpr, buildDestructExpr, 
//                                           buildDestructExprs, buildAssignLhs, 
//                                           makeBinaryExprBuilder, makeUnaryExprBuilder, 
//                                           buildChainedValueExpr, buildCallExpr, 
//                                           buildChainStartValueExpr, buildParensExpr, 
//                                           buildCallArgs, buildCallArgExpr, buildIfElseExpr, 
//                                           buildSwitchExpr, buildSwitchCaseName, 
//                                           buildSwitchCase, buildSwitchCaseNameType, 
//                                           buildMultiArgSwitchCase, buildSingleArgSwitchCase, 
//                                           buildSwitchCaseBody, buildSwitchDefault, 
//                                           buildListLiteralExpr, buildMapLiteralExpr, 
//                                           buildStructLiteralExpr, buildStructLiteralField, 
//                                           buildStructLiteralNamedField, 
//                                           buildStructLiteralUnnamedField, buildValuePathExpr
//
//     Section 19: IR definitions            onNotifyRawUsage, setRawUsageNotifier, RawFunc, 
//                                           makeRawFunctions, wrapWithRawFunctions
//
//     Section 20: IR Context objects        IRScope, IRVariable, IRValue, IRFuncValue, 
//                                           IRLiteralValue, IRDeferredValue, IRCallStack
//
//     Section 21: IR AST objects            IRNameExprRegistry, IRExprRegistry, IRExpr, 
//                                           IRNameExpr, IRLiteralExpr, IRConstExpr, IRFuncExpr, 
//                                           IRCallExpr, IRCoreCallExpr, IRUserCallExpr, 
//                                           IRAnonCallExpr, IRNestedAnonCallExpr, IRFuncDefExpr, 
//                                           IRErrorCallExpr
//
//     Section 22: IR AST build functions    buildIRExpr, buildIRFuncExpr
//
//     Section 23: IR Program                IRProgram, IRParametricProgram
//
//     Section 24: Helios program            Module, MainModule, RedeemerProgram, 
//                                           DatumRedeemerProgram, TestingProgram, 
//                                           SpendingProgram, MintingProgram, StakingProgram
//
//     Section 25: Tx types                  Tx, TxBody, TxWitnesses, TxInput, UTxO, TxRefInput, 
//                                           TxOutput, DCert, StakeAddress, Signature, Redeemer, 
//                                           SpendingRedeemer, MintingRedeemer, Datum, 
//                                           HashedDatum, InlineDatum, encodeMetadata, 
//                                           decodeMetadata, TxMetadata
//
//     Section 26: Highlighting function     SyntaxCategory, highlight
//
//     Section 27: Fuzzy testing framework   FuzzyTest
//
//     Section 28: CoinSelection             CoinSelection
//
//     Section 29: Wallets                   Cip30Wallet, WalletHelper
//
//     Section 30: Network                   BlockfrostV0
//
//     Section 31: Emulator                  WalletEmulator, GenesisTx, RegularTx, NetworkEmulator
//
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////


////////////////////
// Section 1: Config
////////////////////

/**
 * Version of the Helios library.
 */
export const VERSION = "0.13.28";

/**
 * A tab used for indenting of the IR.
 * 2 spaces.
 * @package
 * @type {string}
 */
const TAB = "  ";

/**
 * Modifiable config vars
 * @type {{
 *   DEBUG: boolean,
 *   STRICT_BABBAGE: boolean,
 *   IS_TESTNET: boolean,
 *   N_DUMMY_INPUTS: number
 * }}
 */
export const config = {
    /**
     * Global debug flag. Not currently used for anything though.
     */
    DEBUG: false,

    /**
     * Set this to true if you want to experiment with transactions serialized using the strict babbage cddl format
     */
    STRICT_BABBAGE: false,

    /**
     * Set to false if using the library for mainnet (impacts Addresses)
     */
    IS_TESTNET: true,

    /**
     * Calculating the execution budget during tx building requires knowing all the inputs beforehand,
     *   which is very difficult because balancing is done after the budget is calculated.
     * Instead we use at least 1 dummy input, which should act as a representative balancing input.
     * For increased robustness we use 2 dummy inputs, one with Txid 0 and other with TxId ffff...,
     *   because eg. there are case where the TxId is being printed, and a Txid of ffff... would overestimate the fee
     * This value must be '1' or '2'
     */
    N_DUMMY_INPUTS: 2
}



///////////////////////
// Section 2: Utilities
///////////////////////


/**
 * Throws an error if 'cond' is false.
 * @package
 * @param {boolean} cond 
 * @param {string} msg 
 */
function assert(cond, msg = "unexpected") {
	if (!cond) {
		throw new Error(msg);
	}
}

/**
 * Throws an error if 'obj' is undefined. Returns 'obj' itself (for chained application).
 * @package
 * @template T
 * @param {T | undefined | null} obj 
 * @param {string} msg 
 * @returns {T}
 */
function assertDefined(obj, msg = "unexpected undefined value") {
	if (obj === undefined || obj === null ) {
		throw new Error(msg);
	}

	return obj;
}

/**
 * @package
 * @template Tin, Tout
 * @param {Tin} obj
 * @param {{new(...any): Tout}} C
 * @returns {Tout}
 */
function assertClass(obj, C, msg = "unexpected class") {
	if (obj instanceof C) {
		return obj;
	} else {
		throw new Error(msg);
	}
}

/**
 * @package
 * @param {any} obj 
 * @param {string} msg 
 * @returns {number}
 */
function assertNumber(obj, msg = "expected a number") {
	if (obj === undefined || obj === null) {
		throw new Error(msg);
	} else if (typeof obj == "number") {
		return obj;
	} else {
		throw new Error(msg);
	}
}

/**
 * @package
 * @template T
 * @param {(T | null)[]} lst
 * @returns {null | (T[])}
 */
function reduceNull(lst) {
	/**
	 * @type {T[]}
	 */
	const nonNullLst = [];

	let someNull = false;

	lst.forEach(item => {
		if (item !== null && !someNull) {
			nonNullLst.push(item);
		} else {
			someNull = true;
		}
	});

	if (someNull) {
		return null;
	} else {
		return nonNullLst;
	}
}

/**
 * @template Ta
 * @template Tb
 * @param {[Ta | null, Tb | null][]} pairs
 * @returns {null | [Ta, Tb][]}
 */
export function reduceNullPairs(pairs) {
	/**
	 * @type {[Ta, Tb][]}
	 */
	const nonNullPairs = [];

	let someNull = false;

	pairs.forEach(([a, b]) => {
		if (a === null || b === null) {
			someNull = true;
		} else if (!someNull) {
			nonNullPairs.push([a, b]);
		}
	});

	if (someNull) {
		return null;
	} else {
		return nonNullPairs;
	}
}

/**
 * Compares two objects (deep recursive comparison)
 * @package
 * @template T
 * @param {T} a 
 * @param {T} b 
 * @returns {boolean}
 */
function eq(a, b) {
	if (a === undefined || b === undefined) {
		throw new Error("one of the args is undefined");
	} else if (typeof a == "string") {
		return a === b;
	} else if (typeof a == "number") {
		return a === b;
	} else if (typeof a == "boolean") {
		return a === b;
	} else if (typeof a == "bigint") {
		return a === b;
	} else if (a instanceof Array && b instanceof Array) {
		if (a.length != b.length) {
			return false;
		}

		for (let i = 0; i < a.length; i++) {
			if (!eq(a[i], b[i])) {
				return false;
			}
		}

		return true;
	} else {
		throw new Error("eq not yet implemented for these types");
	}
}

/**
 * Throws an error if two object aren't equal (deep comparison).
 * Used by unit tests that are autogenerated from JSDoc inline examples.
 * @package
 * @template T
 * @param {T} a
 * @param {T} b
 * @param {string} msg
 */
function assertEq(a, b, msg) {
	if (!eq(a, b)) {
		console.log(a);
		console.log(b);
		throw new Error(msg);
	}
}

/**
 * Divides two integers. Assumes a and b are whole numbers. Rounds down the result.
 * @example
 * idiv(355, 113) => 3
 * @package
 * @param {number} a
 * @param {number} b 
 */
function idiv(a, b) {
	return Math.floor(a / b);
	// alternatively: (a - a%b)/b
}

/**
 * 2 to the power 'p' for bigint.
 * @package
 * @param {bigint} p
 * @returns {bigint}
 */
function ipow2(p) {
	return (p <= 0n) ? 1n : 2n << (p - 1n);
}

/**
 * Masks bits of 'b' by setting bits outside the range ['i0', 'i1') to 0. 
 * 'b' is an 8 bit integer (i.e. number between 0 and 255).
 * The return value is also an 8 bit integer, shift right by 'i1'.
 
 * @example
 * imask(0b11111111, 1, 4) => 0b0111 // (i.e. 7)
 * @package
 * @param {number} b 
 * @param {number} i0 
 * @param {number} i1 
 * @returns {number}
 */
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

	return (b & mask_bits[i0]) >> (8 - i1);
}

/**
 * Make sure resulting number fits in uint8
 * @package
 * @param {number} x
 */
function imod8(x) {
	return x & 0xff;
}

/**
 * Converts an unbounded integer into a list of uint8 numbers (big endian)
 * Used by the CBOR encoding of data structures, and by Ed25519
 * @package
 * @param {bigint} x
 * @returns {number[]}
 */
function bigIntToBytes(x) {
	if (x == 0n) {
		return [0];
	} else {
		/**
		 * @type {number[]}
		 */
		const res = [];

		while (x > 0n) {
			res.unshift(Number(x%256n));

			x = x/256n;
		}

		return res;
	}
}

/**
 * Converts a list of uint8 numbers into an unbounded int (big endian)
 * Used by the CBOR decoding of data structures.
 * @package
 * @param {number[]} b
 * @return {bigint}
 */
function bytesToBigInt(b) {
	let s = 1n;
	let total = 0n;

	while (b.length > 0) {
		total += BigInt(assertDefined(b.pop()))*s;

		s *= 256n;
	}

	return total;
}

/**
 * Prepends zeroes to a bit-string so that 'result.length == n'.
 * @example
 * padZeroes("1111", 8) => "00001111"
 * @package
 * @param {string} bits
 * @param {number} n 
 * @returns {string}
 */
function padZeroes(bits, n) {
	// padded to multiple of n
	if (bits.length % n != 0) {
		const nPad = n - bits.length % n;

		bits = (new Array(nPad)).fill('0').join('') + bits;
	}

	return bits;
}

/**
 * Converts a 8 bit integer number into a bit string with an optional "0b" prefix.
 * The result is padded with leading zeroes to become 'n' chars long ('2 + n' chars long if you count the "0b" prefix). 
 * @example
 * byteToBitString(7) => "0b00000111"
 * @package
 * @param {number} b 
 * @param {number} n
 * @param {boolean} prefix
 * @returns {string}
 */
function byteToBitString(b, n = 8, prefix = true) {
	const s = padZeroes(b.toString(2), n);

	if (prefix) {
		return "0b" + s;
	} else {
		return s;
	}
}

/**
 * Converts a hexadecimal representation of bytes into an actual list of uint8 bytes.
 * @example
 * hexToBytes("00ff34") => [0, 255, 52] 
 * @param {string} hex 
 * @returns {number[]}
 */
export function hexToBytes(hex) {
	hex = hex.trim();
	
	const bytes = [];

	for (let i = 0; i < hex.length; i += 2) {
		bytes.push(parseInt(hex.slice(i, i + 2), 16));
	}

	return bytes;
}

/**
 * Converts a list of uint8 bytes into its hexadecimal string representation.
 * @example
 * bytesToHex([0, 255, 52]) => "00ff34"
 * @param {number[]} bytes
 * @returns {string}
 */
export function bytesToHex(bytes) {
	const parts = [];

	for (let b of bytes) {
		parts.push(padZeroes(b.toString(16), 2));
	}

	return parts.join('');
}

/**
 * Encodes a string into a list of uint8 bytes using UTF-8 encoding.
 * @example
 * textToBytes("hello world") => [104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]
 * @param {string} str 
 * @returns {number[]}
 */
export function textToBytes(str) {
	return Array.from((new TextEncoder()).encode(str));
}

/**
 * Decodes a list of uint8 bytes into a string using UTF-8 encoding.
 * @example
 * bytesToText([104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]) => "hello world"
 * @param {number[]} bytes 
 * @returns {string}
 */
export function bytesToText(bytes) {
	return (new TextDecoder("utf-8", {fatal: true})).decode((new Uint8Array(bytes)).buffer);
}

/**
 * Replaces the tab characters of a string with spaces.
 * This is used to create a prettier IR (which is built-up from many template js strings in this file, which might contain tabs depending on the editor used)
 * @example
 * replaceTabs("\t\t\t") => [TAB, TAB, TAB].join("")
 * @package
 * @param {string} str 
 * @returns {string}
 */
function replaceTabs(str) {
	return str.replace(new RegExp("\t", "g"), TAB);
}

/**
 * Read non-byte aligned numbers
 * @package
 */
class BitReader {
    /**
     * @type {Uint8Array}
     */
	#view;

    /**
     * @type {number}
     */
	#pos;

    /**
     * @type {boolean}
     */
	#truncate;

	/**
	 * @param {number[]} bytes
	 * @param {boolean} truncate - if true then read last bits as low part of number, if false pad with zero bits
	 */
	constructor(bytes, truncate = true) {
		this.#view = new Uint8Array(bytes);
		this.#pos = 0; // bit position, not byte position
		this.#truncate = truncate;
	}

	/**
     * @package
	 * @returns {boolean}
	 */
	eof() {
		return idiv(this.#pos, 8) >= this.#view.length;
	}

	/**
	 * Reads a number of bits (<= 8) and returns the result as an unsigned number
     * @package
	 * @param {number} n - number of bits to read
	 * @returns {number}
	 */
	readBits(n) {
		assert(n <= 8, "reading more than 1 byte");

		let leftShift = 0;
		if (this.#pos + n > this.#view.length * 8) {
			const newN = (this.#view.length*8 - this.#pos);

			if (!this.#truncate) {
				leftShift = n - newN;
			}

			n = newN;
		}

		assert(n > 0, "eof");

		// it is assumed we don't need to be at the byte boundary

		let res = 0;
		let i0 = this.#pos;

		for (let i = this.#pos + 1; i <= this.#pos + n; i++) {
			if (i % 8 == 0) {
				const nPart = i - i0;

				res += imask(this.#view[idiv(i, 8) - 1], i0 % 8, 8) << (n - nPart);

				i0 = i;
			} else if (i == this.#pos + n) {
				res += imask(this.#view[idiv(i, 8)], i0 % 8, i % 8);
			}
		}

		this.#pos += n;
		return res << leftShift;
	}

	/**
	 * Moves position to next byte boundary
     * @package
	 * @param {boolean} force - if true then move to next byte boundary if already at byte boundary
	 */
	moveToByteBoundary(force = false) {
		if (this.#pos % 8 != 0) {
			let n = 8 - this.#pos % 8;

			void this.readBits(n);
		} else if (force) {
			this.readBits(8);
		}
	}

	/**
	 * Reads 8 bits
     * @package
	 * @returns {number}
	 */
	readByte() {
		return this.readBits(8);
	}

	/**
	 * Dumps remaining bits we #pos isn't yet at end.
	 * This is intended for debugging use.
     * @package
	 */
	dumpRemainingBits() {
		if (!this.eof()) {
			console.log("remaining bytes:");
			for (let first = true, i = idiv(this.#pos, 8); i < this.#view.length; first = false, i++) {
				if (first && this.#pos % 8 != 0) {
					console.log(byteToBitString(imask(this.#view[i], this.#pos % 8, 8) << 8 - this.#pos % 7));
				} else {
					console.log(byteToBitString(this.#view[i]));
				}
			}
		} else {
			console.log("eof");
		}
	}
}

/**
 * BitWriter turns a string of '0's and '1's into a list of bytes.
 * Finalization pads the bits using '0*1' if not yet aligned with the byte boundary.
 * @package
 */
class BitWriter {
	/**
	 * Concatenated and padded upon finalization
	 * @type {string[]}
	 */
	#parts;

	/**
	 * Number of bits written so far
	 * @type {number}
	 */
	#n;

	constructor() {
		this.#parts = [];
		this.#n = 0;
	}

	/**
     * @package
	 * @type {number}
	 */
	get length() {
		return this.#n;
	}

	/**
	 * Write a string of '0's and '1's to the BitWriter.
     * @package
	 * @param {string} bitChars
	 */
	write(bitChars) {
		for (let c of bitChars) {
			if (c != '0' && c != '1') {
				throw new Error("bad bit char");
			}
		}

		this.#parts.push(bitChars);
		this.#n += bitChars.length;
	}

	/**
     * @package
	 * @param {number} byte
	 */
	writeByte(byte) {
		this.write(padZeroes(byte.toString(2), 8));
	}

	/**
	 * Add padding to the BitWriter in order to align with the byte boundary.
	 * If 'force == true' then 8 bits are added if the BitWriter is already aligned.
     * @package
	 * @param {boolean} force 
	 */
	padToByteBoundary(force = false) {
		let nPad = 0;
		if (this.#n % 8 != 0) {
			nPad = 8 - this.#n % 8;
		} else if (force) {
			nPad = 8;
		}

		if (nPad != 0) {
			let padding = (new Array(nPad)).fill('0');
			padding[nPad - 1] = '1';

			this.#parts.push(padding.join(''));

			this.#n += nPad;
		}
	}

	/**
	 * Pads the BitWriter to align with the byte boundary and returns the resulting bytes.
     * @package
	 * @param {boolean} force - force padding (will add one byte if already aligned)
	 * @returns {number[]}
	 */
	finalize(force = true) {
		this.padToByteBoundary(force);

		let chars = this.#parts.join('');

		let bytes = [];

		for (let i = 0; i < chars.length; i += 8) {
			let byteChars = chars.slice(i, i + 8);
			let byte = parseInt(byteChars, 2);

			bytes.push(byte);
		}

		return bytes;
	}
}

/**
 * Function that generates a random number between 0 and 1
 * @typedef {() => number} NumberGenerator
 */

/**
 * A Source instance wraps a string so we can use it cheaply as a reference inside a Site.
 * Also used by VSCode plugin
 */
export class Source {
	#raw;
	#fileIndex;
	#errors; // errors are collected into this object

	/**
	 * @param {string} raw 
	 * @param {?number} fileIndex
	 */
	constructor(raw, fileIndex = null) {
		this.#raw = assertDefined(raw);
		this.#fileIndex = fileIndex;
		this.#errors = [];
	}

    /**
     * @package
     * @type {string}
     */
	get raw() {
		return this.#raw;
	}

    /**
     * @package
     * @type {?number}
     */
	get fileIndex() {
		return this.#fileIndex;
	}

	/**
	 * @type {Error[]}
	 */
	get errors() {
		return this.#errors;
	}

	throwErrors() {
		if (this.#errors.length > 0) {
			throw this.#errors[0];
		}
	}

	/**
	 * Get char from the underlying string.
	 * Should work fine utf-8 runes.
     * @package
	 * @param {number} pos
	 * @returns {string}
	 */
	getChar(pos) {
		return this.#raw[pos];
	}
	
	/**
	 * Returns word under pos
     * @package
	 * @param {number} pos 
	 * @returns {?string}
	 */
	getWord(pos) {
		/** @type {string[]} */
		const chars = [];

		/**
		 * @param {string | undefined} c 
		 * @returns {boolean}
		 */
		function isWordChar(c) {
			if (c === undefined) {
				return false;
			} else {
				return (c == '_' || (c >= '0' && c <= '9') || (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z'));
			}
		}

		let c = this.#raw[pos];
		while (isWordChar(c)) {
			chars.push(c);
			pos += 1;
			c = this.#raw[pos];
		}

		if (chars.length == 0) {
			return null;
		} else {
			return chars.join("");
		}
	}

    /**
     * @package
     * @type {number}
     */
	get length() {
		return this.#raw.length;
	}

	/**
	 * Calculates the line number of the line where the given character is located (0-based).
     * @package
	 * @param {number} pos 
	 * @returns {number}
	 */
	posToLine(pos) {
		let line = 0;
		for (let i = 0; i < pos; i++) {
			if (this.#raw[i] == '\n') {
				line += 1;
			}
		}

		return line;
	}

	/**
	 * Calculates the column and line number where the given character is located (0-based).
     * @package
	 * @param {number} pos
	 * @returns {[number, number]}
	 */
	// returns [col, line]
	posToLineAndCol(pos) {
		let col = 0;
		let line = 0;
		for (let i = 0; i < pos; i++) {
			if (this.#raw[i] == '\n') {
				col = 0;
				line += 1;
			} else {
				col += 1;
			}
		}

		return [line, col];
	}

	/**
	 * Creates a more human-readable version of the source by prepending the line-numbers to each line.
	 * The line-numbers are at least two digits.
	 * @example
	 * (new Source("hello\nworld")).pretty() => "01  hello\n02  world"
     * @package
	 * @returns {string}
	 */
	pretty() {
		const lines = this.#raw.split("\n");

		const nLines = lines.length;
		const nDigits = Math.max(Math.ceil(Math.log10(nLines)), 2); // line-number is at least two digits

		for (let i = 0; i < nLines; i++) {
			lines[i] = String(i + 1).padStart(nDigits, '0') + "  " + lines[i];
		}

		return lines.join("\n");
	}
}

/**
 * A tag function for a helios source.
 * Is just a marker so IDE support can work on literal helios sources inside javascript/typescript files.
 * @example
 * hl`hello ${"world"}!` => "hello world!"
 * @param {string[]} a 
 * @param  {...any} b 
 * @returns {string}
 */
export function hl(a, ...b) {
	return a.map((part, i) => {
		if (i < b.length) {
			return part + b[i].toString();
		} else {
			return part;
		}
	}).join("");
}

/**
 * Display a warning message that a certain feature will be deprecated at some point in the future.
 * @package
 * @param {string} feature
 * @param {string} futureVersion
 * @param {string} alternative
 * @param {string} docUrl
 */
function deprecationWarning(feature, futureVersion, alternative, docUrl = "") {
	let msg = `${feature} is DEPRECATED, and will be removed from version ${futureVersion} onwards!
${alternative}`;

	if (docUrl != "") {
		msg += `\n(for more information: ${docUrl})`;
	}

	console.warn(msg);
}



////////////////////
// Section 3: Tokens
////////////////////

/**
 * Each Token/Expression/Statement has a Site, which encapsulates a position in a Source
 * @package
 */
class Site {
	#src;
	#startPos;
	#endPos;

	/** @type {?Site} - end of token, exclusive, TODO: replace with endPos */
	#endSite;

	/**@type {?Site} */
	#codeMapSite;

	/**
	 * @param {Source} src 
	 * @param {number} startPos
	 * @param {number} endPos 
	 */
	constructor(src, startPos, endPos = startPos + 1) {
		this.#src = src;
		this.#startPos = startPos;
		this.#endPos = endPos;
		this.#endSite = null;
		this.#codeMapSite = null;
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
class RuntimeError extends UserError {
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
function assertToken(t, site, msg = "expected token") {
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
class Word extends Token {
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
class SymbolToken extends Token {
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
class Group extends Token {
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
class PrimitiveLiteral extends Token {
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
class IntLiteral extends PrimitiveLiteral {
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
class BoolLiteral extends PrimitiveLiteral {
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
class ByteArrayLiteral extends PrimitiveLiteral {
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
class StringLiteral extends PrimitiveLiteral {
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
 class IR {
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



////////////////////////////////////
// Section 4: Cryptography functions
////////////////////////////////////
/**
 * Size of default Blake2b digest
 * @package
 */
var BLAKE2B_DIGEST_SIZE = 32; // bytes

/**
 * Changes the value of BLAKE2B_DIGEST_SIZE 
 *  (because the nodejs crypto module only supports 
 *   blake2b-512 and not blake2b-256, and we want to avoid non-standard dependencies in the 
 *   test-suite)
 * @package
 * @param {number} s - 32 or 64
 */
function setBlake2bDigestSize(s) {
    BLAKE2B_DIGEST_SIZE = s;
}
 
/**
 * Make sure resulting number fits in uint32
 * @package
 * @param {number} x
 */
function imod32(x) {
	return x >>> 0;
}

/**
 * 32 bit number rotation
 * @package
 * @param {number} x - originally uint32
 * @param {number} n
 * @returns {number} - originally uint32
 */
function irotr(x, n) {
	return imod32((x >>> n) | (x << (32 - n)));
}

/**
 * @package
 * @param {bigint} x 
 * @param {bigint} n 
 * @returns {bigint}
 */
function posMod(x, n) {
	const res = x % n;

	if (res < 0n) {
		return res + n;
	} else {
		return res;
	}
}

/**
 * UInt64 number (represented by 2 UInt32 numbers)
 * @package
 */
class UInt64 {
	#high;
	#low;

	/**
	 * @param {number} high  - uint32 number
	 * @param {number} low - uint32 number
	 */
	constructor(high, low) {		
		this.#high = imod32(high);
		this.#low = imod32(low);
	}

	/**
     * @package
	 * @returns {UInt64}
	 */
	static zero() {
		return new UInt64(0, 0);
	}

	/**
     * @package
	 * @param {number[]} bytes - 8 uint8 numbers
	 * @param {boolean} littleEndian
	 * @returns {UInt64}
	 */
	static fromBytes(bytes, littleEndian = true) {
		/** @type {number} */
		let low;

		/** @type {number} */
		let high;

		if (littleEndian) {
			low  = (bytes[0] << 0) | (bytes[1] << 8) | (bytes[2] << 16) | (bytes[3] << 24);
			high = (bytes[4] << 0) | (bytes[5] << 8) | (bytes[6] << 16) | (bytes[7] << 24);
		} else {
			high = (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | (bytes[3] << 0);
			low  = (bytes[4] << 24) | (bytes[5] << 16) | (bytes[6] << 8) | (bytes[7] << 0);
		}

		return new UInt64(imod32(high), imod32(low));
	}

	/**
     * @package
	 * @param {string} str 
	 * @returns {UInt64}
	 */
	static fromString(str) {
		const high = parseInt(str.slice(0,  8), 16);
		const low  = parseInt(str.slice(8, 16), 16);

		return new UInt64(high, low);
	}

    /**
     * @package
     * @type {number}
     */
	get high() {
		return this.#high;
	}

    /**
     * @package
     * @type {number}
     */
	get low() {
		return this.#low;
	}

	/**
	 * Returns [low[0], low[1], low[2], low[3], high[0], high[1], high[2], high[3]] if littleEndian==true
     * @package
	 * @param {boolean} littleEndian
	 * @returns {number[]}
	 */
	toBytes(littleEndian = true) {
		const res = [
			(0x000000ff & this.#low),
			(0x0000ff00 & this.#low) >>> 8,
			(0x00ff0000 & this.#low) >>> 16,
			(0xff000000 & this.#low) >>> 24,
			(0x000000ff & this.#high),
			(0x0000ff00 & this.#high) >>> 8,
			(0x00ff0000 & this.#high) >>> 16,
			(0xff000000 & this.#high) >>> 24,
		];

		if (!littleEndian) {
			res.reverse(); 
		} 
		
		return res;
	}

	/**
     * @package
	 * @param {UInt64} other 
	 * @returns {boolean}
	 */
	eq(other) {
		return (this.#high == other.#high) && (this.#low == other.#low);
	}

	/**
     * @package
	 * @returns {UInt64} 
	 */
	not() {
		return new UInt64(~this.#high, ~this.#low);
	}

	/**
     * @package
	 * @param {UInt64} other
	 * @returns {UInt64}
	 */
	and(other) {
		return new UInt64(this.#high & other.#high, this.#low & other.#low);
	}

	/**
     * @package
	 * @param {UInt64} other 
	 * @returns {UInt64}
	 */
	xor(other) {
		return new UInt64(this.#high ^ other.#high, this.#low ^ other.#low);
	}

	/**
     * @package
	 * @param {UInt64} other 
	 * @returns {UInt64}
	 */
	add(other) {
		const low = this.#low + other.#low;

		let high = this.#high + other.#high;

		if (low >= 0x100000000) {
			high += 1;
		}

		return new UInt64(high, low);
	}

	/**
     * @package
	 * @param {number} n 
	 * @returns {UInt64}
	 */
	rotr(n) {
		if (n == 32) {
			return new UInt64(this.#low, this.#high);
		} else if (n > 32) {
			return (new UInt64(this.#low, this.#high)).rotr(n - 32);
		} else {
			return new UInt64(
				imod32((this.#high >>> n) | (this.#low  << (32 - n))), 
				imod32((this.#low  >>> n) | (this.#high << (32 - n)))
			);
		}
	}

	/**
     * @package
	 * @param {number} n
	 * @returns {UInt64}
	 */
	shiftr(n) {
		if (n >= 32) {
			return new UInt64(0, this.#high >>> n - 32);
		} else {
			return new UInt64(this.#high >>> n, (this.#low >>> n) | (this.#high << (32 - n)));
		}
	}	
}

/**
 * A collection of cryptography primitives are included here in order to avoid external dependencies
 *     mulberry32: random number generator
 *     base32 encoding and decoding
 *     bech32 encoding, checking, and decoding
 *     sha2_256, sha2_512, sha3 and blake2b hashing
 *     ed25519 pubkey generation, signing, and signature verification (NOTE: the current implementation is simple but slow)
 */
export class Crypto {
	/**
	 * Returns a simple random number generator
     * @package
	 * @param {number} seed
	 * @returns {NumberGenerator} - a random number generator
	 */
	static mulberry32(seed) {
		/**
		 * @type {NumberGenerator}
		 */
		return function() {
			let t = seed += 0x6D2B79F5;
			t = Math.imul(t ^ t >>> 15, t | 1);
			t ^= t + Math.imul(t ^ t >>> 7, t | 61);
			return ((t ^ t >>> 14) >>> 0) / 4294967296;
		}
	}

	/**
	 * Alias for rand generator of choice
     * @package
	 * @param {number} seed
	 * @returns {NumberGenerator} - the random number generator function
	 */
	static rand(seed) {
		return this.mulberry32(seed);
	}

	/**
	 * Rfc 4648 base32 alphabet
	 * @type {string}
	 */
	static get DEFAULT_BASE32_ALPHABET() {
		return "abcdefghijklmnopqrstuvwxyz234567";
	}

	/**
	 * Bech32 base32 alphabet
	 * @type {string}
	 */
	static get BECH32_BASE32_ALPHABET() {
		return "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
	}
	
	/**
	 * Encode bytes in special base32.
	 * @example
	 * Crypto.encodeBase32(textToBytes("f")) => "my"
	 * @example
	 * Crypto.encodeBase32(textToBytes("fo")) => "mzxq"
	 * @example
	 * Crypto.encodeBase32(textToBytes("foo")) => "mzxw6"
	 * @example
	 * Crypto.encodeBase32(textToBytes("foob")) => "mzxw6yq"
	 * @example
	 * Crypto.encodeBase32(textToBytes("fooba")) => "mzxw6ytb"
	 * @example
	 * Crypto.encodeBase32(textToBytes("foobar")) => "mzxw6ytboi"
     * @package
	 * @param {number[]} bytes - uint8 numbers
	 * @param {string} alphabet - list of chars
	 * @return {string}
	 */
	static encodeBase32(bytes, alphabet = Crypto.DEFAULT_BASE32_ALPHABET) {
		return Crypto.encodeBase32Bytes(bytes).map(c => alphabet[c]).join("");
	}

	/**
	 * Internal method
     * @package
	 * @param {number[]} bytes 
	 * @returns {number[]} - list of numbers between 0 and 32
	 */
	static encodeBase32Bytes(bytes)  {
		const result = [];

		const reader = new BitReader(bytes, false);

		while (!reader.eof()) {
			result.push(reader.readBits(5));
		}

		return result;
	}

	/**
	 * Decode base32 string into bytes.
	 * @example
	 * bytesToText(Crypto.decodeBase32("my")) => "f"
	 * @example
	 * bytesToText(Crypto.decodeBase32("mzxq")) => "fo"
	 * @example
	 * bytesToText(Crypto.decodeBase32("mzxw6")) => "foo"
	 * @example
	 * bytesToText(Crypto.decodeBase32("mzxw6yq")) => "foob"
	 * @example
	 * bytesToText(Crypto.decodeBase32("mzxw6ytb")) => "fooba"
	 * @example
	 * bytesToText(Crypto.decodeBase32("mzxw6ytboi")) => "foobar"
     * @package
	 * @param {string} encoded
	 * @param {string} alphabet
	 * @return {number[]}
	 */
	static decodeBase32(encoded, alphabet = Crypto.DEFAULT_BASE32_ALPHABET) {
		const writer = new BitWriter();

		const n = encoded.length;

		for (let i = 0; i < n; i++) {
			const c = encoded[i];
			const code = alphabet.indexOf(c.toLowerCase());

			if (i == n - 1) {
				// last, make sure we align to byte

				const nCut = n*5 - 8*Math.floor(n*5/8);

				const bits = padZeroes(code.toString(2), 5)

				writer.write(bits.slice(0, 5 - nCut));
			} else {
				const bits = padZeroes(code.toString(2), 5);

				writer.write(bits);
			}
		}

		const result = writer.finalize(false);

		return result;
	}

	/**
	 * Expand human readable prefix of the bech32 encoding so it can be used in the checkSum
	 * Internal method.
     * @package
	 * @param {string} hrp
	 * @returns {number[]}
	 */
	static expandBech32HumanReadablePart(hrp) {
		const bytes = [];
		for (let c of hrp) {
			bytes.push(c.charCodeAt(0) >> 5);
		}

		bytes.push(0);

		for (let c of hrp) {
			bytes.push(c.charCodeAt(0) & 31);
		}

		return bytes;
	}

	/**
	 * Used as part of the bech32 checksum.
	 * Internal method.
     * @package
	 * @param {number[]} bytes 
	 * @returns {number}
	 */
	static calcBech32Polymod(bytes) {
		const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

		let chk = 1;
		for (let b of bytes) {
			const c = (chk >> 25);
			chk = (chk & 0x1fffffff) << 5 ^ b;

			for (let i = 0; i < 5; i++) {
				if (((c >> i) & 1) != 0) {
					chk ^= GEN[i];
				}
			}
		}

		return chk;
	}

	/**
	 * Generate the bech32 checksum
	 * Internal method
     * @package
	 * @param {string} hrp 
	 * @param {number[]} data - numbers between 0 and 32
	 * @returns {number[]} - 6 numbers between 0 and 32
	 */
	static calcBech32Checksum(hrp, data) {
		const bytes = Crypto.expandBech32HumanReadablePart(hrp).concat(data);

		const chk = Crypto.calcBech32Polymod(bytes.concat([0,0,0,0,0,0])) ^ 1;

		const chkSum = [];
		for (let i = 0; i < 6; i++) {
			chkSum.push((chk >> 5 * (5 - i)) & 31);
		}

		return chkSum;
	}

	/**
	 * Creates a bech32 checksummed string (used to represent Cardano addresses)
	 * @example
	 * Crypto.encodeBech32("foo", textToBytes("foobar")) => "foo1vehk7cnpwgry9h96"
	 * @example
	 * Crypto.encodeBech32("addr_test", hexToBytes("70a9508f015cfbcffc3d88ac4c1c934b5b82d2bb281d464672f6c49539")) => "addr_test1wz54prcptnaullpa3zkyc8ynfddc954m9qw5v3nj7mzf2wggs2uld"
     * @package
	 * @param {string} hrp 
	 * @param {number[]} data - uint8 0 - 256
	 * @returns {string}
	 */
	static encodeBech32(hrp, data) {
		assert(hrp.length > 0, "human-readable-part must have non-zero length");

		data = Crypto.encodeBase32Bytes(data);

		const chkSum = Crypto.calcBech32Checksum(hrp, data);

		return hrp + "1" + data.concat(chkSum).map(i => Crypto.BECH32_BASE32_ALPHABET[i]).join("");
	}

	/**
	 * Decomposes a bech32 checksummed string (i.e. Cardano address), and returns the human readable part and the original bytes
	 * Throws an error if checksum is invalid.
	 * @example
	 * bytesToHex(Crypto.decodeBech32("addr_test1wz54prcptnaullpa3zkyc8ynfddc954m9qw5v3nj7mzf2wggs2uld")[1]) => "70a9508f015cfbcffc3d88ac4c1c934b5b82d2bb281d464672f6c49539"
     * @package
	 * @param {string} addr 
	 * @returns {[string, number[]]}
	 */
	static decodeBech32(addr) {
		assert(Crypto.verifyBech32(addr), "invalid bech32 addr");

		const i = addr.indexOf("1");

		assert(i != -1);

		const hrp = addr.slice(0, i);

		addr = addr.slice(i+1);

		const data = Crypto.decodeBase32(addr.slice(0, addr.length - 6), Crypto.BECH32_BASE32_ALPHABET);

		return [hrp, data];
	}

	/**
	 * Verify a bech32 checksum
	 * @example
	 * Crypto.verifyBech32("foo1vehk7cnpwgry9h96") => true
	 * @example
	 * Crypto.verifyBech32("foo1vehk7cnpwgry9h97") => false
	 * @example
	 * Crypto.verifyBech32("a12uel5l") => true
	 * @example
	 * Crypto.verifyBech32("mm1crxm3i") => false
	 * @example
	 * Crypto.verifyBech32("A1G7SGD8") => false
	 * @example
	 * Crypto.verifyBech32("abcdef1qpzry9x8gf2tvdw0s3jn54khce6mua7lmqqqxw") => true
	 * @example
	 * Crypto.verifyBech32("?1ezyfcl") => true
	 * @example
	 * Crypto.verifyBech32("addr_test1wz54prcptnaullpa3zkyc8ynfddc954m9qw5v3nj7mzf2wggs2uld") => true
     * @package
	 * @param {string} addr
	 * @returns {boolean}
	 */
	static verifyBech32(addr) {
		const data =[];

		const i = addr.indexOf("1");
        
		if (i == -1 || i == 0) {
			return false;
		}

		const hrp = addr.slice(0, i);

		addr = addr.slice(i + 1);

		for (let c of addr) {
			const j = Crypto.BECH32_BASE32_ALPHABET.indexOf(c);
			if (j == -1) {
				return false;
			}

			data.push(j);
		}

		const chkSumA = data.slice(data.length - 6);

		const chkSumB = Crypto.calcBech32Checksum(hrp, data.slice(0, data.length - 6));

		for (let j = 0; j < 6; j++) {
			if (chkSumA[j] != chkSumB[j]) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Calculates sha2-256 (32bytes) hash of a list of uint8 numbers.
	 * Result is also a list of uint8 number.
	 * @example 
	 * bytesToHex(Crypto.sha2_256([0x61, 0x62, 0x63])) => "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
	 * @example
	 * Crypto.sha2_256(textToBytes("Hello, World!")) => [223, 253, 96, 33, 187, 43, 213, 176, 175, 103, 98, 144, 128, 158, 195, 165, 49, 145, 221, 129, 199, 247, 10, 75, 40, 104, 138, 54, 33, 130, 152, 111]
     * @package
	 * @param {number[]} bytes - list of uint8 numbers
	 * @returns {number[]} - list of uint8 numbers
	 */
	static sha2_256(bytes) {
		/**
		 * Pad a bytearray so its size is a multiple of 64 (512 bits).
		 * Internal method.
		 * @param {number[]} src - list of uint8 numbers
		 * @returns {number[]}
		 */
		function pad(src) {
			const nBits = src.length*8;

			const dst = src.slice();

			dst.push(0x80);

			let nZeroes = (64 - dst.length%64) - 8;
			if (nZeroes < 0) {
				nZeroes += 64;
			}

			for (let i = 0; i < nZeroes; i++) {
				dst.push(0);
			}

			// assume nBits fits in 32 bits

			dst.push(0);
			dst.push(0);
			dst.push(0);
			dst.push(0);
			dst.push(imod8(nBits >> 24));
			dst.push(imod8(nBits >> 16));
			dst.push(imod8(nBits >> 8));
			dst.push(imod8(nBits >> 0));
			
			return dst;
		}

		/**
		 * @type {number[]} - 64 uint32 numbers
		 */
		const k = [
			0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
			0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
			0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
			0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
			0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
			0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
			0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
			0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
			0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
			0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
			0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
			0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
			0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
			0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
			0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
			0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
		];

		/**
		 * Initial hash (updated during compression phase)
		 * @type {number[]} - 8 uint32 number
		 */
		const hash = [
			0x6a09e667, 
			0xbb67ae85, 
			0x3c6ef372, 
			0xa54ff53a, 
			0x510e527f, 
			0x9b05688c, 
			0x1f83d9ab, 
			0x5be0cd19,
		];
	
		/**
		 * @param {number} x
		 * @returns {number}
		 */
		function sigma0(x) {
			return irotr(x, 7) ^ irotr(x, 18) ^ (x >>> 3);
		}

		/**
		 * @param {number} x
		 * @returns {number}
		 */
		function sigma1(x) {
			return irotr(x, 17) ^ irotr(x, 19) ^ (x >>> 10);
		}

		bytes = pad(bytes);

		// break message in successive 64 byte chunks
		for (let chunkStart = 0; chunkStart < bytes.length; chunkStart += 64) {
			const chunk = bytes.slice(chunkStart, chunkStart + 64);

			const w = (new Array(64)).fill(0); // array of 32 bit numbers!

			// copy chunk into first 16 positions of w
			for (let i = 0; i < 16; i++) {
				w[i] = (chunk[i*4 + 0] << 24) |
					   (chunk[i*4 + 1] << 16) |
					   (chunk[i*4 + 2] <<  8) |
					   (chunk[i*4 + 3]);
			}

			// extends the first 16 positions into the remaining 48 positions
			for (let i = 16; i < 64; i++) {
				w[i] = imod32(w[i-16] + sigma0(w[i-15]) + w[i-7] + sigma1(w[i-2]));
			}

			// intialize working variables to current hash value
			let a = hash[0];
			let b = hash[1];
			let c = hash[2];
			let d = hash[3];
			let e = hash[4];
			let f = hash[5];
			let g = hash[6];
			let h = hash[7];

			// compression function main loop
			for (let i = 0; i < 64; i++) {
				const S1 = irotr(e, 6) ^ irotr(e, 11) ^ irotr(e, 25);
				const ch = (e & f) ^ ((~e) & g);
				const temp1 = imod32(h + S1 + ch + k[i] + w[i]);
				const S0 = irotr(a, 2) ^ irotr(a, 13) ^ irotr(a, 22);
				const maj = (a & b) ^ (a & c) ^ (b & c);
				const temp2 = imod32(S0 + maj);

				h = g;
				g = f;
				f = e;
				e = imod32(d + temp1);
				d = c;
				c = b;
				b = a;
				a = imod32(temp1 + temp2);
			}

			// update the hash
			hash[0] = imod32(hash[0] + a);
			hash[1] = imod32(hash[1] + b);
			hash[2] = imod32(hash[2] + c);
			hash[3] = imod32(hash[3] + d);
			hash[4] = imod32(hash[4] + e);
			hash[5] = imod32(hash[5] + f);
			hash[6] = imod32(hash[6] + g);
			hash[7] = imod32(hash[7] + h);
		}

		// produce the final digest of uint8 numbers
		const result = [];
		for (let i = 0; i < 8; i++) {
			const item = hash[i];

			result.push(imod8(item >> 24));
			result.push(imod8(item >> 16));
			result.push(imod8(item >>  8));
			result.push(imod8(item >>  0));
		}
	
		return result;
	}

	/**
	 * Calculates sha2-512 (64bytes) hash of a list of uint8 numbers.
	 * Result is also a list of uint8 number.
	 * @example 
	 * bytesToHex(Crypto.sha2_512([0x61, 0x62, 0x63])) => "ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f"
	 * @example 
	 * bytesToHex(Crypto.sha2_512([])) => "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e"
     * @package
	 * @param {number[]} bytes - list of uint8 numbers
	 * @returns {number[]} - list of uint8 numbers
	 */
	static sha2_512(bytes) {
		/**
		 * Pad a bytearray so its size is a multiple of 128 (1024 bits).
		 * Internal method.
		 * @param {number[]} src - list of uint8 numbers
		 * @returns {number[]}
		 */
		function pad(src) {
			const nBits = src.length*8;

			const dst = src.slice();

			dst.push(0x80);

			let nZeroes = (128 - dst.length%128) - 8;
			if (nZeroes < 0) {
				nZeroes += 128;
			}

			for (let i = 0; i < nZeroes; i++) {
				dst.push(0);
			}

			// assume nBits fits in 32 bits

			dst.push(0);
			dst.push(0);
			dst.push(0);
			dst.push(0);
			dst.push(imod8(nBits >> 24));
			dst.push(imod8(nBits >> 16));
			dst.push(imod8(nBits >> 8));
			dst.push(imod8(nBits >> 0));
			
			return dst;
		}

		/**
		 * @type {UInt64[]} - 80 uint64 numbers
		 */
		const k = [
			new UInt64(0x428a2f98, 0xd728ae22), new UInt64(0x71374491, 0x23ef65cd), 
			new UInt64(0xb5c0fbcf, 0xec4d3b2f), new UInt64(0xe9b5dba5, 0x8189dbbc),
			new UInt64(0x3956c25b, 0xf348b538), new UInt64(0x59f111f1, 0xb605d019), 
			new UInt64(0x923f82a4, 0xaf194f9b), new UInt64(0xab1c5ed5, 0xda6d8118),
			new UInt64(0xd807aa98, 0xa3030242), new UInt64(0x12835b01, 0x45706fbe), 
			new UInt64(0x243185be, 0x4ee4b28c), new UInt64(0x550c7dc3, 0xd5ffb4e2),
			new UInt64(0x72be5d74, 0xf27b896f), new UInt64(0x80deb1fe, 0x3b1696b1), 
			new UInt64(0x9bdc06a7, 0x25c71235), new UInt64(0xc19bf174, 0xcf692694),
			new UInt64(0xe49b69c1, 0x9ef14ad2), new UInt64(0xefbe4786, 0x384f25e3), 
			new UInt64(0x0fc19dc6, 0x8b8cd5b5), new UInt64(0x240ca1cc, 0x77ac9c65),
			new UInt64(0x2de92c6f, 0x592b0275), new UInt64(0x4a7484aa, 0x6ea6e483), 
			new UInt64(0x5cb0a9dc, 0xbd41fbd4), new UInt64(0x76f988da, 0x831153b5),
			new UInt64(0x983e5152, 0xee66dfab), new UInt64(0xa831c66d, 0x2db43210), 
			new UInt64(0xb00327c8, 0x98fb213f), new UInt64(0xbf597fc7, 0xbeef0ee4),
			new UInt64(0xc6e00bf3, 0x3da88fc2), new UInt64(0xd5a79147, 0x930aa725), 
			new UInt64(0x06ca6351, 0xe003826f), new UInt64(0x14292967, 0x0a0e6e70),
			new UInt64(0x27b70a85, 0x46d22ffc), new UInt64(0x2e1b2138, 0x5c26c926), 
			new UInt64(0x4d2c6dfc, 0x5ac42aed), new UInt64(0x53380d13, 0x9d95b3df),
			new UInt64(0x650a7354, 0x8baf63de), new UInt64(0x766a0abb, 0x3c77b2a8), 
			new UInt64(0x81c2c92e, 0x47edaee6), new UInt64(0x92722c85, 0x1482353b),
			new UInt64(0xa2bfe8a1, 0x4cf10364), new UInt64(0xa81a664b, 0xbc423001), 
			new UInt64(0xc24b8b70, 0xd0f89791), new UInt64(0xc76c51a3, 0x0654be30),
			new UInt64(0xd192e819, 0xd6ef5218), new UInt64(0xd6990624, 0x5565a910), 
			new UInt64(0xf40e3585, 0x5771202a), new UInt64(0x106aa070, 0x32bbd1b8),
			new UInt64(0x19a4c116, 0xb8d2d0c8), new UInt64(0x1e376c08, 0x5141ab53), 
			new UInt64(0x2748774c, 0xdf8eeb99), new UInt64(0x34b0bcb5, 0xe19b48a8),
			new UInt64(0x391c0cb3, 0xc5c95a63), new UInt64(0x4ed8aa4a, 0xe3418acb), 
			new UInt64(0x5b9cca4f, 0x7763e373), new UInt64(0x682e6ff3, 0xd6b2b8a3),
			new UInt64(0x748f82ee, 0x5defb2fc), new UInt64(0x78a5636f, 0x43172f60), 
			new UInt64(0x84c87814, 0xa1f0ab72), new UInt64(0x8cc70208, 0x1a6439ec),
			new UInt64(0x90befffa, 0x23631e28), new UInt64(0xa4506ceb, 0xde82bde9), 
			new UInt64(0xbef9a3f7, 0xb2c67915), new UInt64(0xc67178f2, 0xe372532b),
			new UInt64(0xca273ece, 0xea26619c), new UInt64(0xd186b8c7, 0x21c0c207), 
			new UInt64(0xeada7dd6, 0xcde0eb1e), new UInt64(0xf57d4f7f, 0xee6ed178),
			new UInt64(0x06f067aa, 0x72176fba), new UInt64(0x0a637dc5, 0xa2c898a6), 
			new UInt64(0x113f9804, 0xbef90dae), new UInt64(0x1b710b35, 0x131c471b),
			new UInt64(0x28db77f5, 0x23047d84), new UInt64(0x32caab7b, 0x40c72493), 
			new UInt64(0x3c9ebe0a, 0x15c9bebc), new UInt64(0x431d67c4, 0x9c100d4c),
			new UInt64(0x4cc5d4be, 0xcb3e42b6), new UInt64(0x597f299c, 0xfc657e2a), 
			new UInt64(0x5fcb6fab, 0x3ad6faec), new UInt64(0x6c44198c, 0x4a475817),
		];

		/**
		 * Initial hash (updated during compression phase)
		 * @type {UInt64[]} - 8 uint64 numbers
		 */
		const hash = [
			new UInt64(0x6a09e667, 0xf3bcc908),
			new UInt64(0xbb67ae85, 0x84caa73b),
			new UInt64(0x3c6ef372, 0xfe94f82b),
			new UInt64(0xa54ff53a, 0x5f1d36f1),
			new UInt64(0x510e527f, 0xade682d1),
			new UInt64(0x9b05688c, 0x2b3e6c1f),
			new UInt64(0x1f83d9ab, 0xfb41bd6b),
			new UInt64(0x5be0cd19, 0x137e2179),
		];
	
		/**
		 * @param {UInt64} x
		 * @returns {UInt64} 
		 */
		function sigma0(x) {
			return x.rotr(1).xor(x.rotr(8)).xor(x.shiftr(7));
		}

		/**
		 * @param {UInt64} x
		 * @returns {UInt64}
		 */
		function sigma1(x) {
			return x.rotr(19).xor(x.rotr(61)).xor(x.shiftr(6));
		}

		bytes = pad(bytes);

		// break message in successive 64 byte chunks
		for (let chunkStart = 0; chunkStart < bytes.length; chunkStart += 128) {
			const chunk = bytes.slice(chunkStart, chunkStart + 128);

			const w = (new Array(80)).fill(UInt64.zero()); // array of 32 bit numbers!

			// copy chunk into first 16 hi/lo positions of w (i.e. into first 32 uint32 positions)
			for (let i = 0; i < 16; i++) {
				w[i] = UInt64.fromBytes(chunk.slice(i*8, i*8 + 8), false);
			}

			// extends the first 16 positions into the remaining 80 positions
			for (let i = 16; i < 80; i++) {
				w[i] = sigma1(w[i-2]).add(w[i-7]).add(sigma0(w[i-15])).add(w[i-16]);
			}

			// intialize working variables to current hash value
			let a = hash[0];
			let b = hash[1];
			let c = hash[2];
			let d = hash[3];
			let e = hash[4];
			let f = hash[5];
			let g = hash[6];
			let h = hash[7];

			// compression function main loop
			for (let i = 0; i < 80; i++) {
				const S1 = e.rotr(14).xor(e.rotr(18)).xor(e.rotr(41));
				const ch = e.and(f).xor(e.not().and(g));
				const temp1 = h.add(S1).add(ch).add(k[i]).add(w[i]);
				const S0 = a.rotr(28).xor(a.rotr(34)).xor(a.rotr(39));
				const maj = a.and(b).xor(a.and(c)).xor(b.and(c));
				const temp2 = S0.add(maj);

				h = g;
				g = f;
				f = e;
				e = d.add(temp1);
				d = c;
				c = b;
				b = a;
				a = temp1.add(temp2);
			}

			// update the hash
			hash[0] = hash[0].add(a);
			hash[1] = hash[1].add(b);
			hash[2] = hash[2].add(c);
			hash[3] = hash[3].add(d);
			hash[4] = hash[4].add(e);
			hash[5] = hash[5].add(f);
			hash[6] = hash[6].add(g);
			hash[7] = hash[7].add(h);
		}

		// produce the final digest of uint8 numbers
		let result = [];
		for (let i = 0; i < 8; i++) {
			const item = hash[i];

			result = result.concat(item.toBytes(false));
		}
	
		return result;
	}

	/**
	 * Calculates sha3-256 (32bytes) hash of a list of uint8 numbers.
	 * Result is also a list of uint8 number.
	 * Sha3 only bit-wise operations, so 64-bit operations can easily be replicated using 2 32-bit operations instead
	 * @example
	 * bytesToHex(Crypto.sha3(textToBytes("abc"))) => "3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532"
	 * @example
	 * bytesToHex(Crypto.sha3((new Array(136)).fill(1))) => "b36dc2167c4d9dda1a58b87046c8d76a6359afe3612c4de8a38857e09117b2db"
	 * @example
	 * bytesToHex(Crypto.sha3((new Array(135)).fill(2))) => "5bdf5d815d29a9d7161c66520efc17c2edd7898f2b99a029e8d2e4ff153407f4"
	 * @example
	 * bytesToHex(Crypto.sha3((new Array(134)).fill(3))) => "8e6575663dfb75a88f94a32c5b363c410278b65020734560d968aadd6896a621"
	 * @example
	 * bytesToHex(Crypto.sha3((new Array(137)).fill(4))) => "f10b39c3e455006aa42120b9751faa0f35c821211c9d086beb28bf3c4134c6c6"
     * @package
	 * @param {number[]} bytes - list of uint8 numbers
	 * @returns {number[]} - list of uint8 numbers
	 */
	static sha3(bytes) {
		/**
		 * @type {number} - state width (1600 bits, )
		 */
		const WIDTH = 200;

		/**
		 * @type {number} - rate (1088 bits, 136 bytes)
		 */
		const RATE = 136;

		/**
		 * @type {number} - capacity
		 */
		const CAP = WIDTH - RATE;

		/**
		 * Apply 1000...1 padding until size is multiple of r.
		 * If already multiple of r then add a whole block of padding.
		 * @param {number[]} src - list of uint8 numbers
		 * @returns {number[]} - list of uint8 numbers
		 */
		function pad(src) {
			const dst = src.slice();

			/** @type {number} */
			let nZeroes = RATE - 2 - (dst.length%RATE);
			if (nZeroes < -1) {
				nZeroes += RATE - 2;
			}

			if (nZeroes == -1) {
				dst.push(0x86);
			} else {
				dst.push(0x06);

				for (let i = 0; i < nZeroes; i++) {
					dst.push(0);
				}

				dst.push(0x80);
			}

			assert(dst.length%RATE == 0);
			
			return dst;
		}

		/**
		 * 24 numbers used in the sha3 permute function
		 * @type {number[]}
		 */
		const OFFSETS = [6, 12, 18, 24, 3, 9, 10, 16, 22, 1, 7, 13, 19, 20, 4, 5, 11, 17, 23, 2, 8, 14, 15, 21];

		/**
		 * 24 numbers used in the sha3 permute function
		 * @type {number[]}
		 */
		const SHIFTS = [-12, -11, 21, 14, 28, 20, 3, -13, -29, 1, 6, 25, 8, 18, 27, -4, 10, 15, -24, -30, -23, -7, -9, 2];

		/**
		 * Round constants used in the sha3 permute function
		 * @type {UInt64[]} 
		 */
		const RC = [
			new UInt64(0x00000000, 0x00000001) , 
			new UInt64(0x00000000, 0x00008082) , 
			new UInt64(0x80000000, 0x0000808a) ,
			new UInt64(0x80000000, 0x80008000) ,
			new UInt64(0x00000000, 0x0000808b) ,
			new UInt64(0x00000000, 0x80000001) ,
			new UInt64(0x80000000, 0x80008081) ,
			new UInt64(0x80000000, 0x00008009) ,
			new UInt64(0x00000000, 0x0000008a) ,
			new UInt64(0x00000000, 0x00000088) ,
			new UInt64(0x00000000, 0x80008009) ,
			new UInt64(0x00000000, 0x8000000a) ,
			new UInt64(0x00000000, 0x8000808b) ,
			new UInt64(0x80000000, 0x0000008b) ,
			new UInt64(0x80000000, 0x00008089) ,
			new UInt64(0x80000000, 0x00008003) ,
			new UInt64(0x80000000, 0x00008002) ,
			new UInt64(0x80000000, 0x00000080) ,
			new UInt64(0x00000000, 0x0000800a) ,
			new UInt64(0x80000000, 0x8000000a) ,
			new UInt64(0x80000000, 0x80008081) ,
			new UInt64(0x80000000, 0x00008080) ,
			new UInt64(0x00000000, 0x80000001) ,
			new UInt64(0x80000000, 0x80008008) ,
		];
		
		/**
		 * @param {UInt64[]} s 
		 */
		function permute(s) {	
			/**
			 * @type {UInt64[]}
			 */		
			const c = new Array(5);

			/**
			 * @type {UInt64[]}
			 */
			const b = new Array(25);
			
			for (let round = 0; round < 24; round++) {
				for (let i = 0; i < 5; i++) {
					c[i] = s[i].xor(s[i+5]).xor(s[i+10]).xor(s[i+15]).xor(s[i+20]);
				}

				for (let i = 0; i < 5; i++) {
					const i1 = (i+1)%5;
					const i2 = (i+4)%5;

					const tmp = c[i2].xor(c[i1].rotr(63));

					for (let j = 0; j < 5; j++) {
						s[i+5*j] = s[i+5*j].xor(tmp);
					}
				}				

				b[0] = s[0];

				for(let i = 1; i < 25; i++) {
					const offset = OFFSETS[i-1];

					const left = Math.abs(SHIFTS[i-1]);
					const right = 32 - left;

					if (SHIFTS[i-1] < 0) {
						b[i] = s[offset].rotr(right);
					} else {
						b[i] = s[offset].rotr(right + 32);
					}
				}

				for (let i = 0; i < 5; i++) {
					for (let j = 0; j < 5; j++) {
						s[i*5+j] = b[i*5+j].xor(b[i*5 + (j+1)%5].not().and(b[i*5 + (j+2)%5]))
					}
				}

				s[0] = s[0].xor(RC[round]);
			}
		}

		bytes = pad(bytes);

		// initialize the state
		/**
		 * @type {UInt64[]}
		 */
		const state = (new Array(WIDTH/8)).fill(UInt64.zero());

		for (let chunkStart = 0; chunkStart < bytes.length; chunkStart += RATE) {
			// extend the chunk to become length WIDTH
			const chunk = bytes.slice(chunkStart, chunkStart + RATE).concat((new Array(CAP)).fill(0));

			// element-wise xor with 'state'
			for (let i = 0; i < WIDTH; i += 8) {
				state[i/8] = state[i/8].xor(UInt64.fromBytes(chunk.slice(i, i+8)));

				// beware: a uint32 is stored as little endian, but a pair of uint32s that form a uin64 are stored in big endian format!
			}

			// apply block permutations
			permute(state);
		}

		/** @type {number[]} */
		let hash = [];
		for (let i = 0; i < 4; i++) {
			hash = hash.concat(state[i].toBytes());
		}

		return hash;
	}

	/**
	 * Calculates blake2b hash of a list of uint8 numbers (variable digest size).
	 * Result is also a list of uint8 number.
	 * Blake2b is a 64bit algorithm, so we need to be careful when replicating 64-bit operations with 2 32-bit numbers (low-word overflow must spill into high-word, and shifts must go over low/high boundary)
	 * @example                                        
	 * bytesToHex(Crypto.blake2b([0, 1])) => "01cf79da4945c370c68b265ef70641aaa65eaa8f5953e3900d97724c2c5aa095"
	 * @example
	 * bytesToHex(Crypto.blake2b(textToBytes("abc"), 64)) => "ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d17d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923"
     * @package
	 * @param {number[]} bytes 
	 * @param {number} digestSize - at most 64
	 * @returns {number[]}
	 */
	static blake2b(bytes, digestSize = BLAKE2B_DIGEST_SIZE) {
		/**
		 * 128 bytes (16*8 byte words)
		 * @type {number}
		 */
		const WIDTH = 128;

		/**
		 * Initialization vector
		 */
		const IV = [
			new UInt64(0x6a09e667, 0xf3bcc908), 
			new UInt64(0xbb67ae85, 0x84caa73b),
			new UInt64(0x3c6ef372, 0xfe94f82b), 
			new UInt64(0xa54ff53a, 0x5f1d36f1),
			new UInt64(0x510e527f, 0xade682d1),
			new UInt64(0x9b05688c, 0x2b3e6c1f),
			new UInt64(0x1f83d9ab, 0xfb41bd6b), 
			new UInt64(0x5be0cd19, 0x137e2179), 
		];

		const SIGMA = [
			[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
			[14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3],
			[11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4],
			[7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8],
			[9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13],
			[2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9],
			[12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11],
			[13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10],
			[6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5],
			[10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0],
		];

		/**
		 * @param {number[]} src - list of uint8 bytes
		 * @returns {number[]} - list of uint8 bytes
		 */
		function pad(src) {
			const dst = src.slice();

			const nZeroes = dst.length == 0 ? WIDTH : (WIDTH - dst.length%WIDTH)%WIDTH;

			// just padding with zeroes, the actual message length is used during compression stage of final block in order to uniquely hash messages of different lengths
			for (let i = 0; i < nZeroes; i++) {
				dst.push(0);
			}
			
			return dst;
		}

		/**
		 * @param {UInt64[]} v
		 * @param {UInt64[]} chunk
		 * @param {number} a - index
		 * @param {number} b - index
		 * @param {number} c - index
		 * @param {number} d - index
		 * @param {number} i - index in chunk for low word 1
		 * @param {number} j - index in chunk for low word 2
		 */
		function mix(v, chunk, a, b, c, d, i, j) {
			const x = chunk[i];
			const y = chunk[j];

			v[a] = v[a].add(v[b]).add(x);
			v[d] = v[d].xor(v[a]).rotr(32);
			v[c] = v[c].add(v[d]);
			v[b] = v[b].xor(v[c]).rotr(24);
			v[a] = v[a].add(v[b]).add(y);
			v[d] = v[d].xor(v[a]).rotr(16);
			v[c] = v[c].add(v[d]);
			v[b] = v[b].xor(v[c]).rotr(63);
		}

		/**
		 * @param {UInt64[]} h - state vector
		 * @param {UInt64[]} chunk
		 * @param {number} t - chunkEnd (expected to fit in uint32)
		 * @param {boolean} last
		 */
		function compress(h, chunk, t, last) {
			// work vectors
			const v = h.slice().concat(IV.slice());

			v[12] = v[12].xor(new UInt64(0, imod32(t))); // v[12].high unmodified
			// v[13] unmodified

			if (last) {
				v[14] = v[14].xor(new UInt64(0xffffffff, 0xffffffff));
			}

			for (let round = 0; round < 12; round++) {
				const s = SIGMA[round%10];

				for (let i = 0; i < 4; i++) {
					mix(v, chunk, i, i+4, i+8, i+12, s[i*2], s[i*2+1]);
				}
				
				for (let i = 0; i < 4; i++) {
					mix(v, chunk, i, (i+1)%4 + 4, (i+2)%4 + 8, (i+3)%4 + 12, s[8+i*2], s[8 + i*2 + 1]);
				}
			}

			for (let i = 0; i < 8; i++) {
				h[i] = h[i].xor(v[i].xor(v[i+8]));
			}		
		}
 
		const nBytes = bytes.length;

		bytes = pad(bytes);

		// init hash vector
		const h = IV.slice();
		

		// setup the param block
		const paramBlock = new Uint8Array(64);
		paramBlock[0] = digestSize; // n output  bytes
		paramBlock[1] = 0; // key-length (always zero in our case) 
		paramBlock[2] = 1; // fanout
		paramBlock[3] = 1; // depth

		//mix in the parameter block
		const paramBlockView = new DataView(paramBlock.buffer);
		for (let i = 0; i < 8; i++) {
			h[i] = h[i].xor(new UInt64(
				paramBlockView.getUint32(i*8+4, true),
				paramBlockView.getUint32(i*8, true),
			));
		}
		
		// loop all chunks
		for (let chunkStart = 0; chunkStart < bytes.length; chunkStart += WIDTH) {
			const chunkEnd = chunkStart + WIDTH; // exclusive
			const chunk = bytes.slice(chunkStart, chunkStart + WIDTH);

			const chunk64 = new Array(WIDTH/8);
			for (let i = 0; i < WIDTH; i += 8) {
				chunk64[i/8] = UInt64.fromBytes(chunk.slice(i, i+8));
			}
			
			if (chunkStart == bytes.length - WIDTH) {
				// last block
				compress(h, chunk64, nBytes, true);
			} else {
				compress(h, chunk64, chunkEnd, false);
			}
		}

		// extract lowest BLAKE2B_DIGEST_SIZE bytes from h

		/** @type {number[]} */
		let hash = [];
		for (let i = 0; i < digestSize/8; i++) {
			hash = hash.concat(h[i].toBytes());
		}

		return hash.slice(0, digestSize);
	}

	/**
	 * Crypto.Ed25519 exports the following functions:
	 *  * Crypto.Ed25519.derivePublicKey(privateKey)
	 *  * Crypto.Ed25519.sign(message, privateKey)
	 *  * Crypto.Ed25519.verify(message, signature, publicKey)
	 * 
	 * This is implementation is slow (~0.5s per verification), but should be good enough for simple client-side usage
	 * 
	 * Ported from: https://ed25519.cr.yp.to/python/ed25519.py
     * @package
	 */
	static get Ed25519() {
		const Q = 57896044618658097711785492504343953926634992332820282019728792003956564819949n; // ipowi(255n) - 19n
		const Q38 = 7237005577332262213973186563042994240829374041602535252466099000494570602494n; // (Q + 3n)/8n
		const CURVE_ORDER = 7237005577332262213973186563042994240857116359379907606001950938285454250989n; // ipow2(252n) + 27742317777372353535851937790883648493n;
		const D = -4513249062541557337682894930092624173785641285191125241628941591882900924598840740n; // -121665n * invert(121666n);
		const I = 19681161376707505956807079304988542015446066515923890162744021073123829784752n; // expMod(2n, (Q - 1n)/4n, Q);
		
		/**
		 * @type {[bigint, bigint]}
		 */
		const BASE = [
			15112221349535400772501151409588531511454012693041857206046113283949847762202n, // recoverX(B[1]) % Q
			46316835694926478169428394003475163141307993866256225615783033603165251855960n, // (4n*invert(5n)) % Q
		];

		/**
		 * @param {bigint} b 
		 * @param {bigint} e 
		 * @param {bigint} m 
		 * @returns {bigint}
		 */
		function expMod(b, e, m) {
			if (e == 0n) {
				return 1n;
			} else {
				let t = expMod(b, e/2n, m);
				t = (t*t) % m;

				if ((e % 2n) != 0n) {
					t = posMod(t*b, m)
				}

				return t;
			}
		}

		/**
		 * @param {bigint} n 
		 * @returns {bigint}
		 */
		function invert(n) {
			let a = posMod(n, Q);
			let b = Q;

			let x = 0n;
			let y = 1n;
			let u = 1n;
			let v = 0n;

			while (a !== 0n) {
				const q = b / a;
				const r = b % a;
				const m = x - u*q;
				const n = y - v*q;
				b = a;
				a = r;
				x = u;
				y = v;
				u = m;
				v = n;
			}

			return posMod(x, Q)
		}

		/**
		 * @param {bigint} y 
		 * @returns {bigint}
		 */
		function recoverX(y) {
			const yy = y*y;
			const xx = (yy - 1n) * invert(D*yy + 1n);
			let x = expMod(xx, Q38, Q);

			if (((x*x - xx) % Q) != 0n) {
				x = (x*I) % Q;
			}

			if ((x%2n) != 0n) {
				x = Q - x;
			}

			return x;
		}		

		/**
		 * Curve point 'addition'
		 * Note: this is probably the bottleneck of this Ed25519 implementation
		 * @param {[bigint, bigint]} a 
		 * @param {[bigint, bigint]} b 
		 * @returns {[bigint, bigint]}
		 */
		function edwards(a, b) {
			const x1 = a[0];
			const y1 = a[1];
			const x2 = b[0];
			const y2 = b[1];
			const dxxyy = D*x1*x2*y1*y2;
			const x3 = (x1*y2+x2*y1) * invert(1n+dxxyy);
			const y3 = (y1*y2+x1*x2) * invert(1n-dxxyy);
			return [posMod(x3, Q), posMod(y3, Q)];
		}

		/**
		 * @param {[bigint, bigint]} point 
		 * @param {bigint} n 
		 * @returns {[bigint, bigint]}
		 */
		function scalarMul(point, n) {
			if (n == 0n) {
				return [0n, 1n];
			} else {
				let sum = scalarMul(point, n/2n);
				sum = edwards(sum, sum);
				if ((n % 2n) != 0n) {
					sum = edwards(sum, point);
				}

				return sum;
			}
		}

		/**
		 * Curve point 'multiplication'
		 * @param {bigint} y 
		 * @returns {number[]}
		 */
		function encodeInt(y) {
			const bytes = bigIntToBytes(y).reverse();
			
			while (bytes.length < 32) {
				bytes.push(0);
			}

			return bytes;
		}

		/**
		 * @param {number[]} s 
		 * @returns {bigint}
		 */
		function decodeInt(s) {
			return bytesToBigInt(s.reverse());
		}

		/**
		 * @param {[bigint, bigint]} point
		 * @returns {number[]}
		 */
		function encodePoint(point) {
			const [x, y] = point;

			const bytes = encodeInt(y);

			// last bit is determined by x

			bytes[31] = (bytes[31] & 0b011111111) | (Number(x & 1n) * 0b10000000);

			return bytes;
		}

		/**
		 * @param {number[]} bytes 
		 * @param {number} i - bit index
		 * @returns {number} - 0 or 1
		 */
		function getBit(bytes, i) {
			return (bytes[Math.floor(i/8)] >> i%8) & 1
		}

		/**
		 * @param {[bigint, bigint]} point
		 * @returns {boolean}
		 */
		function isOnCurve(point) {
			const x = point[0];
			const y = point[1];
			const xx = x*x;
			const yy = y*y;
			return (-xx + yy - 1n - D*xx*yy) % Q == 0n;
		}

		/**
		 * @param {number[]} s 
		 */
		function decodePoint(s) {
			assert(s.length == 32);

			const bytes = s.slice();
			bytes[31] = bytes[31] & 0b01111111;

			const y = decodeInt(bytes);

			let x = recoverX(y);
			if (Number(x & 1n) != getBit(s, 255)) {
				x = Q - x;
			}

			/**
			 * @type {[bigint, bigint]}
			 */
			const point = [x, y];

			if (!isOnCurve(point)) {
				throw new Error("point isn't on curve");
			}

			return point;
		}

		/**
		 * Couldn't think of a proper name for this function
		 * @param {number[]} h 
		 * @returns {bigint}
		 */
		function calca(h) {
			const a = 28948022309329048855892746252171976963317496166410141009864396001978282409984n; // ipow2(253)

			const bytes = h.slice(0, 32);
			bytes[0] = bytes[0] & 0b11111000;
			bytes[31] = bytes[31] & 0b00111111;

			const x = bytesToBigInt(bytes.reverse());
			return a + x;
		}

		/**
		 * @param {number[]} m 
		 * @returns {bigint}
		 */
		function ihash(m) {
			const h = Crypto.sha2_512(m);

			return decodeInt(h);
		}

		return {
			/**
			 * @param {number[]} privateKey 
			 * @returns {number[]}
			 */
			derivePublicKey: function(privateKey) {
				const privateKeyHash = Crypto.sha2_512(privateKey);
				const a = calca(privateKeyHash);
				const A = scalarMul(BASE, a);

				return encodePoint(A);
			},

			/**
			 * @param {number[]} message 
			 * @param {number[]} privateKey 
			 * @returns {number[]}
			 */
			sign: function(message, privateKey) {
				const privateKeyHash = Crypto.sha2_512(privateKey);
				const a = calca(privateKeyHash);

				// for convenience calculate publicKey here:
				const publicKey = encodePoint(scalarMul(BASE, a));

				const r = ihash(privateKeyHash.slice(32, 64).concat(message));
				const R = scalarMul(BASE, r);
				const S = posMod(r + ihash(encodePoint(R).concat(publicKey).concat(message))*a, CURVE_ORDER);

				return encodePoint(R).concat(encodeInt(S));
			},

			/**
			 * @param {number[]} signature 
			 * @param {number[]} message 
			 * @param {number[]} publicKey 
			 * @returns {boolean}
			 */
			verify: function(signature, message, publicKey) {
				if (signature.length != 64) {
					throw new Error(`unexpected signature length ${signature.length}`);
				}
	
				if (publicKey.length != 32) {
					throw new Error(`unexpected publickey length ${publicKey.length}`);
				}

				const R = decodePoint(signature.slice(0, 32));
				const A = decodePoint(publicKey);
				const S = decodeInt(signature.slice(32, 64));
				const h = ihash(signature.slice(0, 32).concat(publicKey).concat(message));

				const left = scalarMul(BASE, S);
				const right = edwards(R, scalarMul(A, h));

				return (left[0] == right[0]) && (left[1] == right[1]);
			}
		}
	}
}


//////////////////////////////////
// Section 5: Cbor encoder/decoder
//////////////////////////////////

/**
 * @typedef {(i: number, bytes: number[]) => void} Decoder
 */

/**
 * Base class of any Cbor serializable data class
 * Also contains helper methods for (de)serializing data to/from Cbor
 */
export class CborData {
	constructor() {
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		throw new Error("not yet implemented");
	}

	/**
	 * @param {number} m - major type
	 * @param {bigint} n - size parameter
	 * @returns {number[]} - uint8 bytes
	 */
	static encodeHead(m, n) {
		if (n <= 23n) {
			return [32*m + Number(n)];
		} else if (n >= 24n && n <= 255n) {
			return [32*m + 24, Number(n)];
		} else if (n >= 256n && n <= 256n*256n - 1n) {
			return [32*m + 25, Number((n/256n)%256n), Number(n%256n)];
		} else if (n >= 256n*256n && n <= 256n*256n*256n*256n - 1n) {
			let e4 = bigIntToBytes(n);

			while (e4.length < 4) {
				e4.unshift(0);
			}
			return [32*m + 26].concat(e4);
		} else if (n >= 256n*256n*256n*256n && n <= 256n*256n*256n*256n*256n*256n*256n*256n - 1n) {
			let e8 = bigIntToBytes(n);

			while(e8.length < 8) {
				e8.unshift(0);
			}
			return [32*m + 27].concat(e8);
		} else {
			throw new Error("n out of range");
		}
	}

	/**
	 * @param {number[]} bytes - mutated to contain the rest
	 * @returns {[number, bigint]} - [majorType, n]
	 */
	static decodeHead(bytes) {
		if (bytes.length == 0) {
			throw new Error("empty cbor head");
		}

		let first = assertDefined(bytes.shift());

		if (first%32 <= 23) {
			return [idiv(first, 32), BigInt(first%32)];
		} else if (first%32 == 24) {
			return [idiv(first, 32), bytesToBigInt(bytes.splice(0, 1))];
		} else if (first%32 == 25) {
			return [idiv(first, 32), bytesToBigInt(bytes.splice(0, 2))];
		} else if (first%32 == 26) {
			return [idiv(first, 32), bytesToBigInt(bytes.splice(0, 4))];
		} else if (first%32 == 27) {
			return [idiv(first, 32), bytesToBigInt(bytes.splice(0, 8))];
		} else {
			throw new Error("bad header");
		}
	}

	/**
	 * @param {number} m
	 * @returns {number[]}
	 */
	static encodeIndefHead(m) {
		return [32*m + 31];
	}

	/**
	 * @param {number[]} bytes - cbor bytes
	 * @returns {number} - majorType
	 */
	static decodeIndefHead(bytes) {
		let first = assertDefined(bytes.shift());

		let m = idiv(first - 31, 32);

		return m;
	}

	/**
	 * @param {number[]} bytes
	 * @returns {boolean}
	 */
	static isNull(bytes) {
		return bytes[0] == 246;
	}

	/**
	 * @returns {number[]}
	 */
	static encodeNull() {
		return [246];
	}

	/**
	 * Throws error if not null
	 * @param {number[]} bytes
	 */
	static decodeNull(bytes) {
		let b = assertDefined(bytes.shift());

		if (b != 246) {
			throw new Error("not null");
		}
	}

	/**
	 * @param {boolean} b
	 * @returns {number[]}
	 */
	static encodeBool(b) {
		if (b) {
			return [245];
		} else {
			return [244];
		}
	}

	/**
	 * @param {number[]} bytes
	 * @returns {boolean}
	 */
	static decodeBool(bytes) {
		let b = assertDefined(bytes.shift());

		if (b == 245) {
			return true;
		} else if (b == 244) {
			return false;
		} else {
			throw new Error("unexpected non-boolean cbor object");
		}
	}

	/**
	 * @param {number[]} bytes
	 * @returns {boolean}
	 */
	static isDefBytes(bytes) {
		if (bytes.length == 0) {
			throw new Error("empty cbor bytes");
		}

		let [m, _] = CborData.decodeHead(bytes.slice(0, 9));

		return m == 2;
	}

	/**
	 * @param {number[]} bytes
	 * @returns {boolean}
	 */
	static isIndefBytes(bytes) {
		if (bytes.length == 0) {
			throw new Error("empty cbor bytes");
		}

		return 2*32 + 31 == bytes[0];
	}

	/**
	 * @example
	 * bytesToHex(CborData.encodeBytes(hexToBytes("4d01000033222220051200120011"))) => "4e4d01000033222220051200120011"
	 * @param {number[]} bytes
	 * @param {boolean} splitInChunks
	 * @returns {number[]} - cbor bytes
	 */
	static encodeBytes(bytes, splitInChunks = false) {
		bytes = bytes.slice();

		if (bytes.length <= 64 || !splitInChunks) {
			let head = CborData.encodeHead(2, BigInt(bytes.length));
			return head.concat(bytes);
		} else {
			let res = CborData.encodeIndefHead(2);

			while (bytes.length > 0) {
				let chunk = bytes.splice(0, 64);

				res = res.concat(CborData.encodeHead(2, BigInt(chunk.length))).concat(chunk);
			}

			res.push(255);

			return res;
		}
	}

	/**
	 * Decodes both an indef array of bytes, and a bytearray of specified length
	 * @example
	 * bytesToHex(CborData.decodeBytes(hexToBytes("4e4d01000033222220051200120011"))) => "4d01000033222220051200120011"
	 * @param {number[]} bytes - cborbytes, mutated to form remaining
	 * @returns {number[]} - byteArray
	 */
	static decodeBytes(bytes) {
		// check header type
		assert(bytes.length > 0);

		if (CborData.isIndefBytes(bytes)) {
			// multiple chunks
			void bytes.shift();

			/**
			 * @type {number[]}
			 */
			let res = [];

			while(bytes[0] != 255) {
				let [_, n] = CborData.decodeHead(bytes);
				if (n > 64n) {
					throw new Error("bytearray chunk too large");
				}

				res = res.concat(bytes.splice(0, Number(n)));
			}

			assert(bytes.shift() == 255);

			return res;
		} else {
			let [_, n] = CborData.decodeHead(bytes);

			return bytes.splice(0, Number(n));
		}
	}

	/**
	 * @param {number[]} bytes
	 * @returns {boolean}
	 */
	static isUtf8(bytes) {
		if (bytes.length == 0) {
			throw new Error("empty cbor bytes");
		}

		return bytes[0] === 120;
	}

	/**
	 * Encodes a Utf8 string into Cbor bytes.
	 * Strings longer than 64 bytes are split into lists with 64 byte chunks
	 * Note: string splitting isn't reversible
	 * @param {string} str
	 * @param {boolean} split
	 * @returns {number[]}
	 */
	static encodeUtf8(str, split = false) {
		const bytes = textToBytes(str);

		if (split && bytes.length > 64) {
			/** @type {number[][]} */
			const chunks = [];

			for (let i = 0; i < bytes.length; i += 64) {
				const chunk = bytes.slice(i, i + 64);

				chunks.push([120, chunk.length].concat(chunk));
			}

			return CborData.encodeDefList(chunks);
		} else {
			return [120, bytes.length].concat(bytes);
		}
	}

	/**
	* @param {number[]} bytes
	* @returns {string}
	*/
	static decodeUtf8Internal(bytes) {
		assert(bytes.shift() === 120);

		const length = bytes.shift();

		return bytesToText(bytes.splice(0, length));
	}

	/**
	* @param {number[]} bytes
	* @returns {string}
	*/
	static decodeUtf8(bytes) {
		assert(bytes.length > 0);

		if (CborData.isDefList(bytes)) {
			let result = "";

			CborData.decodeList(bytes, (_, itemBytes) => {
				result += CborData.decodeUtf8Internal(itemBytes);
			});

			return result;
		} else {
			return CborData.decodeUtf8Internal(bytes);
		}
	}

	/**
	 * @param {bigint} n
	 * @returns {number[]} - cbor bytes
	 */
	static encodeInteger(n) {
		if (n >= 0n && n <= (2n << 63n) - 1n) {
			return CborData.encodeHead(0, n);
		} else if (n >= (2n << 63n)) {
			return CborData.encodeHead(6, 2n).concat(CborData.encodeBytes(bigIntToBytes(n)));
		} else if (n <= -1n && n >= -(2n << 63n)) {
			return CborData.encodeHead(1, -n - 1n);
		} else {
			return CborData.encodeHead(6, 3n).concat(CborData.encodeBytes(bigIntToBytes(-n - 1n)));
		}
	}

	/**
	 * @param {number[]} bytes
	 * @returns {bigint}
	 */
	static decodeInteger(bytes) {
		let [m, n] = CborData.decodeHead(bytes);

		if (m == 0) {
			return n;
		} else if (m == 1) {
			return -n - 1n;
		} else if (m == 6) {
			if (n == 2n) {
				let b = CborData.decodeBytes(bytes);

				return bytesToBigInt(b);
			} else if (n == 3n) {
				let b = CborData.decodeBytes(bytes);

				return -bytesToBigInt(b) - 1n;
			} else {
				throw new Error(`unexpected tag n:${n}`);
			}
		} else {
			throw new Error(`unexpected tag m:${m}`);
		}
	}

	/**
	 * @param {number[]} bytes
	 * @returns {boolean}
	 */
	static isIndefList(bytes) {
		if (bytes.length == 0) {
			throw new Error("empty cbor bytes");
		}

		return 4*32 + 31 == bytes[0];
	}

	/**
	 * @returns {number[]}
	 */
	static encodeIndefListStart() {
		return CborData.encodeIndefHead(4);
	}

	/**
	 * @param {CborData[] | number[][]} list
	 * @returns {number[]}
	 */
	static encodeListInternal(list) {
		/**
		 * @type {number[]}
		 */
		let res = [];
		for (let item of list) {
			if (item instanceof CborData) {
				res = res.concat(item.toCbor());
			} else {
				res = res.concat(item);
			}
		}

		return res;
	}

	/**
	 * @returns {number[]}
	 */
	static encodeIndefListEnd() {
		return [255];
	}

	/**
	 * @param {CborData[] | number[][]} list
	 * @returns {number[]}
	 */
	static encodeList(list) {
		// This follows the serialization format that the Haskell input-output-hk/plutus UPLC evaluator
		// https://github.com/well-typed/cborg/blob/4bdc818a1f0b35f38bc118a87944630043b58384/serialise/src/Codec/Serialise/Class.hs#L181
		return list.length ? CborData.encodeIndefList(list) : CborData.encodeDefList(list);
	}

	/**
	 * @param {CborData[] | number[][]} list
	 * @returns {number[]}
	 */
	static encodeIndefList(list) {
		return CborData.encodeIndefListStart().concat(CborData.encodeListInternal(list)).concat(CborData.encodeIndefListEnd());
	}

	/**
	 * @param {number[]} bytes
	 * @returns {boolean}
	 */
	static isDefList(bytes) {
		try {
			let [m, _] = CborData.decodeHead(bytes.slice(0, 9));
			return m == 4;
		} catch (error) {
			if (error.message.includes("bad header")) return false;
			throw error;
		}
	}

	/**
	 * @param {bigint} n
	 * @returns {number[]}
	 */
	static encodeDefListStart(n) {
		return CborData.encodeHead(4, n);
	}

	/**
	 * @param {CborData[] | number[][]} list
	 * @returns {number[]}
	 */
	static encodeDefList(list) {
		return CborData.encodeDefListStart(BigInt(list.length)).concat(CborData.encodeListInternal(list));
	}

	/**
	 * @param {number[]} bytes
	 * @returns {boolean}
	 */
	static isList(bytes) {
		return CborData.isIndefList(bytes) || CborData.isDefList(bytes);
	}

	/**
	 * @param {number[]} bytes
	 * @param {Decoder} itemDecoder
	 */
	static decodeList(bytes, itemDecoder) {
		if (CborData.isIndefList(bytes)) {
			assert(CborData.decodeIndefHead(bytes) == 4);

			let i = 0;
			while(bytes[0] != 255) {
				itemDecoder(i, bytes);
				i++;
			}

			assert(bytes.shift() == 255);
		} else {
			let [m, n] = CborData.decodeHead(bytes);

			assert(m == 4);

			for (let i = 0; i < Number(n); i++) {
				itemDecoder(i, bytes);
			}
		}
	}

	/**
	 * @param {number[]} bytes
	 * @returns {boolean}
	 */
	static isTuple(bytes) {
		return CborData.isIndefList(bytes) || CborData.isDefList(bytes);
	}

	/**
	 * @param {number[][]} tuple
	 * @returns {number[]}
	 */
	static encodeTuple(tuple) {
		return CborData.encodeDefList(tuple);
	}


	/**
	 * @param {number[]} bytes
	 * @param {Decoder} tupleDecoder
	 * @returns {number} - returns the size of the tuple
	 */
	static decodeTuple(bytes, tupleDecoder) {
		let count = 0;

		CborData.decodeList(bytes, (_, itemBytes) => {
			tupleDecoder(count, itemBytes);
			count++;
		});

		return count;
	}

	/**
	 * @param {number[]} bytes
	 * @returns {boolean}
	 */
	static isMap(bytes) {
		let [m, _] = CborData.decodeHead(bytes.slice(0, 9));

		return m == 5;
	}

	/**
	 * @param {[CborData | number[], CborData | number[]][]} pairList
	 * @returns {number[]}
	 */
	static encodeMapInternal(pairList) {
		/**
		 * @type {number[]}
		 */
		let res = [];

		for (let pair of pairList) {
			let key = pair[0];
			let value = pair[1];

			if (key instanceof CborData) {
				res = res.concat(key.toCbor());
			} else {
				res = res.concat(key);
			}

			if (value instanceof CborData) {
				res = res.concat(value.toCbor());
			} else {
				res = res.concat(value);
			}
		}

		return res;
	}

	/**
	 * A decode map method doesn't exist because it specific for the requested type
	 * @param {[CborData | number[], CborData | number[]][]} pairList
	 * @returns {number[]}
	 */
	static encodeMap(pairList) {
		return CborData.encodeHead(5, BigInt(pairList.length)).concat(CborData.encodeMapInternal(pairList));
	}

	/**
	 * @param {number[]} bytes
	 * @param {Decoder} pairDecoder
	 */
	static decodeMap(bytes, pairDecoder) {
		let [m, n] = CborData.decodeHead(bytes);

		assert(m == 5);

		for (let i = 0; i < n; i++) {
			pairDecoder(i, bytes);
		}
	}

	/**
	 * @param {number[]} bytes
	 * @returns {boolean}
	 */
	static isObject(bytes) {
		return CborData.isMap(bytes);
	}

	/**
	 * @param {Map<number, CborData | number[]>} object
	 * @returns {number[]}
	 */
	static encodeObject(object) {
		return CborData.encodeMap(Array.from(object.entries()).map(pair => [
			CborData.encodeInteger(BigInt(pair[0])),
			pair[1]
		]));
	}

	/**
	 * @param {number[]} bytes
	 * @param {Decoder} fieldDecoder
	 * @returns {Set<number>}
	 */
	static decodeObject(bytes, fieldDecoder) {
		/** @type {Set<number>} */
		let done = new Set();

		CborData.decodeMap(bytes, (_, pairBytes) => {
			let i = Number(CborData.decodeInteger(pairBytes));

			fieldDecoder(i, pairBytes);
			
			done.add(i);
		});

		return done;
	}

	/**
	 * Unrelated to constructor
	 * @param {bigint} tag
	 * @returns {number[]}
	 */
	static encodeTag(tag) {
		return CborData.encodeHead(6, tag);
	}

	/**
	 * @param {number[]} bytes
	 * @returns {bigint}
	 */
	static decodeTag(bytes) {
		let [m, n] = CborData.decodeHead(bytes);

		assert(m == 6);

		return n;
	}

	/**
	 * @param {number[]} bytes
	 * @returns {boolean}
	 */
	static isConstr(bytes) {
		if (bytes.length == 0) {
			throw new Error("empty cbor bytes");
		}

		let [m, _] = CborData.decodeHead(bytes.slice(0, 9));

		return m == 6;
	}

	/**
	 * Encode a constructor tag of a ConstrData type
	 * @param {number} tag
	 * @returns {number[]}
	 */
	static encodeConstrTag(tag) {
		if (tag >= 0 && tag <= 6) {
			return CborData.encodeHead(6, 121n + BigInt(tag));
		} else if (tag >= 7 && tag <= 127) {
			return CborData.encodeHead(6, 1280n + BigInt(tag - 7));
		} else {
			return CborData.encodeHead(6, 102n).concat(CborData.encodeHead(4, 2n)).concat(CborData.encodeInteger(BigInt(tag)));
		}
	}

	/**
	 * @param {number} tag
	 * @param {CborData[] | number[][]} fields
	 * @returns {number[]}
	 */
	static encodeConstr(tag, fields) {
		return CborData.encodeConstrTag(tag).concat(CborData.encodeList(fields));
	}

	/**
	 * @param {number[]} bytes
	 * @returns {number}
	 */
	static decodeConstrTag(bytes) {
		// constr
		let [m, n] = CborData.decodeHead(bytes);

		assert(m == 6);

		if (n < 127n) {
			return Number(n - 121n);
		} else if (n == 102n) {
			let [mCheck, nCheck] = CborData.decodeHead(bytes);
			assert(mCheck == 4 && nCheck == 2n);

			return Number(CborData.decodeInteger(bytes));
		} else {
			return Number(n - 1280n + 7n);
		}
	}

	/**
	 * Returns the tag
	 * @param {number[]} bytes
	 * @param {Decoder} fieldDecoder
	 * @returns {number}
	 */
	static decodeConstr(bytes, fieldDecoder) {
		let tag = CborData.decodeConstrTag(bytes);

		CborData.decodeList(bytes, fieldDecoder);

		return tag;
	}
}



/////////////////////////////
// Section 6: Uplc data types
/////////////////////////////

/**
 * Min memory used by a UplcData value during validation
 * @package
 * @type {number}
 */
const UPLC_DATA_NODE_MEM_SIZE = 4;

/**
 * Base class for Plutus-core data classes (not the same as Plutus-core value classes!)
 */
export class UplcData extends CborData {
	constructor() {
		super();
	}

	/**
	 * Estimate of memory usage during validation
	 * @type {number}
	 */
	get memSize() {
		throw new Error("not yet implemented");
	}

	/**
	 * Compares the schema jsons
	 * @param {UplcData} other
	 * @returns {boolean}
	 */
	isSame(other) {
		return this.toSchemaJson() == other.toSchemaJson();
	}

	/**
	 * @type {number[]}
	 */
	get bytes() {
		throw new Error("not a bytearray");
	}

	/**
	 * @type {bigint}
	 */
	get int() {
		throw new Error("not an int");
	}

	/**
	 * @type {number}
	 */
	get index() {
		throw new Error("not a constr");
	}

	/**
	 * @type {UplcData[]}
	 */
	get fields() {
		throw new Error("not a constr");
	}

	/**
	 * @type {UplcData[]}
	 */
	get list() {
		throw new Error("not a list");
	}

	/**
	 * @type {[UplcData, UplcData][]}
	 */
	get map() {
		throw new Error("not a map");
	}

	/**
	 * @returns {string}
	 */
	toString() {
		throw new Error("not yet implemented");
	}

	/**
	 * @returns {IR}
	 */
	toIR() {
		throw new Error("not yet implemented");
	}

	/**
	 * @returns {string}
	 */
	toSchemaJson() {
		throw new Error("not yet implemented");
	}

	/**
	 * @param {string | number[]} bytes
	 * @returns {UplcData}
	 */
	static fromCbor(bytes) {
		if (typeof bytes == "string") {
			return UplcData.fromCbor(hexToBytes(bytes));
		} else {
			if (CborData.isList(bytes)) {
				return ListData.fromCbor(bytes);
			} else if (CborData.isIndefBytes(bytes)) {
				return ByteArrayData.fromCbor(bytes);
			} else {
				if (CborData.isDefBytes(bytes)) {
					return ByteArrayData.fromCbor(bytes);
				} else if (CborData.isMap(bytes)) {
					return MapData.fromCbor(bytes);
				} else if (CborData.isConstr(bytes)) {
					return ConstrData.fromCbor(bytes);
				} else {
					// int, must come last
					return IntData.fromCbor(bytes);
				}
			}
		}
	}
}

/**
 * Plutus-core int data class
 */
export class IntData extends UplcData {
	#value;

	/**
	 * @param {bigint} value
	 */
	constructor(value) {
		super();
		this.#value = value;
	}

	/**
	 * @type {bigint}
	 */
	get value() {
		return this.#value;
	}

	/**
	 * Alias getter
	 * @type {bigint}
	 */
	get int() {
		return this.#value;
	}

    /**
     * Calculate the mem size of a integer (without the DATA_NODE overhead)
     * @param {bigint} value
     * @returns {number}
     */
    static memSizeInternal(value) {
        if (value == 0n) {
			return 1;
		} else {
			const abs = value > 0n ? value : -value;

			return Math.floor(Math.floor(Math.log2(Number(abs)))/64) + 1;
		}
    }

	/**
	 * @type {number}
	 */
	get memSize() {
		return UPLC_DATA_NODE_MEM_SIZE + IntData.memSizeInternal(this.#value);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return this.#value.toString();
	}

	/**
	 * Returns integer literal wrapped with integer data function call.
	 * @returns {IR}
	 */
	toIR() {
		return new IR(`__core__iData(${this.#value.toString()})`);
	}

	/**
	 * Returns string, not js object, because of unbounded integers
	 * @returns {string}
	 */
	toSchemaJson() {
		return `{"int": ${this.#value.toString()}}`;
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return CborData.encodeInteger(this.#value);
	}

	/**
	 * @param {number[]} bytes
	 * @returns {IntData}
	 */
	static fromCbor(bytes) {
		return new IntData(CborData.decodeInteger(bytes));
	}
}

/**
 * Plutus-core bytearray data class.
 * Wraps a regular list of uint8 numbers (so not Uint8Array)
 */
export class ByteArrayData extends UplcData {
	#bytes;

	/**
	 * @param {number[]} bytes
	 */
	constructor(bytes) {
		super();
		this.#bytes = bytes;
	}

	/**
	 * Applies utf-8 encoding
	 * @param {string} s
	 * @returns {ByteArrayData}
	 */
	static fromString(s) {
		let bytes = textToBytes(s);

		return new ByteArrayData(bytes);
	}

	get bytes() {
		return this.#bytes.slice();
	}

    /**
     * Calculates the mem size of a byte array without the DATA_NODE overhead.
     * @param {number[]} bytes
     * @returns {number}
     */
    static memSizeInternal(bytes) {
        let n = bytes.length;
		if (n === 0) {
			return 1; // this is so annoying: haskell reference implementation says it should be 0, but current (20220925) testnet and mainnet settings say it's 1
		} else {
			return Math.floor((bytes.length - 1)/8) + 1;
		}
    }

	get memSize() {
		return UPLC_DATA_NODE_MEM_SIZE + ByteArrayData.memSizeInternal(this.#bytes);
	}

	/**
	 * @returns {string}
	 */
	toHex() {
		return bytesToHex(this.#bytes);
	}

	toString() {
		return `#${this.toHex()}`;
	}

	/**
	 * Returns bytearray literal wrapped with bytearray data function as IR.
	 * @returns {IR}
	 */
	toIR() {
		return new IR(`__core__bData(#${this.toHex()})`);
	}

	/**
	 * @returns {string}
	 */
	toSchemaJson() {
		return `{"bytes": "${this.toHex()}"}`;
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return CborData.encodeBytes(this.#bytes, true);
	}

	/**
	 * @param {number[]} bytes
	 * @returns {ByteArrayData}
	 */
	static fromCbor(bytes) {
		return new ByteArrayData(CborData.decodeBytes(bytes));
	}

	/**
	 * Bytearray comparison, which can be used for sorting bytearrays
	 * @example
	 * ByteArrayData.comp(hexToBytes("0101010101010101010101010101010101010101010101010101010101010101"), hexToBytes("0202020202020202020202020202020202020202020202020202020202020202")) => -1
	 * @param {number[]} a
	 * @param {number[]} b
	 * @returns {number} - 0 -> equals, 1 -> gt, -1 -> lt
	 */
	static comp(a, b) {
		/** @return {boolean} */
		function lessThan() {
			for (let i = 0; i < Math.min(a.length, b.length); i++) {
				if (a[i] != b[i]) {
					return a[i] < b[i];
				}
			}

			return a.length < b.length;
		}

		/** @return {number} */
		function lessOrGreater() {
			return lessThan() ? -1 : 1;
		}

		if (a.length != b.length) {
			return lessOrGreater();
		} else {
			for (let i = 0; i < a.length; i++) {
				if (a[i] != b[i]) {
					return lessOrGreater();
				}
			}

			return 0;
		}
	}
}

/**
 * Plutus-core list data class
 */
export class ListData extends UplcData {
	#items;

	/**
	 * @param {UplcData[]} items
	 */
	constructor(items) {
		super();
		this.#items = items;
	}

	/**
	 * @type {UplcData[]}
	 */
	get list() {
		return this.#items.slice();
	}

	/**
	 * @type {number}
	 */
	get memSize() {
		let sum = UPLC_DATA_NODE_MEM_SIZE;

		for (let item of this.#items) {
			sum += item.memSize;
		}

		return sum;
	}

	toString() {
		return `[${this.#items.map(item => item.toString()).join(", ")}]`;
	}

	/**
	 * @returns {IR}
	 */
	toIR() {
		let ir = new IR("__core__mkNilData(())");
		for (let i = this.#items.length - 1; i >= 0; i--) {
			ir = new IR([new IR("__core__mkCons("), this.#items[i].toIR(), new IR(", "), ir, new IR(")")]);
		}

		return new IR([new IR("__core__listData("), ir, new IR(")")]);
	}

	/**
	 * @returns {string}
	 */
	toSchemaJson() {
		return `{"list":[${this.#items.map(item => item.toSchemaJson()).join(", ")}]}`;
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return CborData.encodeList(this.#items);
	}

	/**
	 * @param {number[]} bytes
	 * @returns {ListData}
	 */
	static fromCbor(bytes) {
		/**
		 * @type {UplcData[]}
		 */
		let list = [];

		CborData.decodeList(bytes, (_, itemBytes) => {
			list.push(UplcData.fromCbor(itemBytes));
		});

		return new ListData(list);
	}
}

/**
 * Plutus-core map data class
 */
export class MapData extends UplcData {
	#pairs;

	/**
	 * @param {[UplcData, UplcData][]} pairs
	 */
	constructor(pairs) {
		super();
		this.#pairs = pairs;
	}

	/**
	 * @type {[UplcData, UplcData][]}
	 */
	get map() {
		return this.#pairs.slice();
	}

	get memSize() {
		let sum = UPLC_DATA_NODE_MEM_SIZE;

		for (let [k, v] of this.#pairs) {
			sum += k.memSize + v.memSize;
		}

		return sum;
	}

	toString() {
		return `{${this.#pairs.map(([fst, snd]) => `${fst.toString()}: ${snd.toString()}`).join(", ")}}`;
	}

	/**
	 * @returns {IR}
	 */
	toIR() {
		let ir = new IR("__core__mkNilPairData(())");

		for (let i = this.#pairs.length - 1; i >= 0; i--) {
			let a = this.#pairs[i][0].toIR();
			let b = this.#pairs[i][1].toIR();

			ir = new IR([new IR("__core__mkCons(__core__mkPairData("), a, new IR(", "), b, new IR(", "), new IR(")"), new IR(", "), ir, new IR(")")]);
		}

		return new IR([new IR("__core__mapData("), ir, new IR(")")]);
	}

	/**
	 * @returns {string}
	 */
	toSchemaJson() {
		return `{"map": [${this.#pairs.map(pair => { return "{\"k\": " + pair[0].toSchemaJson() + ", \"v\": " + pair[1].toSchemaJson() + "}" }).join(", ")}]}`;
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return CborData.encodeMap(this.#pairs);
	}

	/**
	 * @param {number[]} bytes
	 * @returns {MapData}
	 */
	static fromCbor(bytes) {
		/**
		 * @type {[UplcData, UplcData][]}
		 */
		let pairs = [];

		CborData.decodeMap(bytes, (_, pairBytes) => {
			pairs.push([UplcData.fromCbor(pairBytes), UplcData.fromCbor(pairBytes)]);
		});

		return new MapData(pairs);
	}
}

/**
 * Plutus-core constructed data class
 */
export class ConstrData extends UplcData {
	#index;
	#fields;

	/**
	 * @param {number} index
	 * @param {UplcData[]} fields
	 */
	constructor(index, fields) {
		super();
		this.#index = index;
		this.#fields = fields;
	}

	/**
	 * @type {number}
	 */
	get index() {
		return this.#index;
	}

	/**
	 * @type {UplcData[]}
	 */
	get fields() {
		return this.#fields.slice();
	}

	/**
	 * @type {number}
	 */
	get memSize() {
		let sum = UPLC_DATA_NODE_MEM_SIZE;

		for (let field of this.#fields) {
			sum += field.memSize;
		}

		return sum;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		let parts = this.#fields.map(field => field.toString());
		return `${this.#index.toString()}{${parts.join(", ")}}`;
	}

	/**
	 * @returns {IR}
	 */
	toIR() {
		let ir = new IR("__core__mkNilData(())");
		for (let i = this.#fields.length - 1; i >= 0; i--) {
			ir = new IR([new IR("__core__mkCons("), this.#fields[i].toIR(), new IR(", "), ir, new IR(")")]);
		}

		return new IR([new IR("__core__constrData("), new IR(this.#index.toString()), new IR(", "), ir, new IR(")")]);
	}

	/**
	 * @returns {string}
	 */
	toSchemaJson() {
		return `{"constructor": ${this.#index.toString()}, "fields": [${this.#fields.map(f => f.toSchemaJson()).join(", ")}]}`;
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return CborData.encodeConstr(this.#index, this.#fields);
	}

	/**
	 * @param {number[]} bytes
	 * @returns {ConstrData}
	 */
	static fromCbor(bytes) {
		/**
		 * @type {UplcData[]}
		 */
		let fields = [];

		let tag = CborData.decodeConstr(bytes, (_, fieldBytes) => {
			fields.push(UplcData.fromCbor(fieldBytes));
		});

		return new ConstrData(tag, fields);
	}
}



/////////////////////////////////
// Section 7: Helios data objects
/////////////////////////////////

/**
 * Base-type of all data-types that exist both on- and off-chain, and map directly to Helios instances.
 */
export class HeliosData extends CborData {
	constructor() {
        super();
	}

    /**
     * Name begins with underscore so it can never conflict with structure field names.
     * @package
     * @returns {UplcData}
     */
	_toUplcData() {
        throw new Error("not yet implemented");
	}

    /**
     * @returns {string}
     */
	toSchemaJson() {
		return this._toUplcData().toSchemaJson();
	}
}

/**
 * @template {HeliosData} T
 * @typedef {{
 *   new(...args: any[]): T;
 *   fromUplcCbor: (bytes: (string | number[])) => T,
 *   fromUplcData: (data: UplcData) => T
 * }} HeliosDataClass
 */

/**
 * Helios Int type
 */
export class HInt extends HeliosData {
    /** 
     * @type {bigint} 
     */
    #value;

    /**
     * @package
     * @param {number | bigint | string} rawValue
     * @returns {bigint}
     */
    static cleanConstructorArg(rawValue) {
        const value = BigInt(rawValue);

        if (value.toString() != rawValue.toString()) {
            throw new Error("not a valid integer");
        }

        return value;
    }

    /**
     * @param {number | bigint | string} rawValue
     */
    constructor(rawValue) {
        super();

        this.#value = HInt.cleanConstructorArg(rawValue);
    }

    /**
     * @type {bigint}
     */
    get value() {
        return this.#value;
    }

    /**
     * @package
     * @returns {UplcData}
     */
    _toUplcData() {
        return new IntData(this.#value);
    }

    /**
     * @param {UplcData} data
     * @returns {HInt}
     */
    static fromUplcData(data) {
        return new HInt(data.int);
    }

    /**
     * @param {string | number[]} bytes
     * @returns {HInt}
     */
    static fromUplcCbor(bytes) {
        return HInt.fromUplcData(UplcData.fromCbor(bytes));
    }
}

/**
 * Milliseconds since 1 jan 1970
 */
export class Time extends HInt {
     /**
     * @package
     * @param {number | bigint | string | Date} rawValue
     * @returns {bigint}
     */
      static cleanConstructorArg(rawValue) {

        if (rawValue instanceof Date) {
            return BigInt(rawValue.getTime());
        } else {
            const value = BigInt(rawValue);

            if (value.toString() != rawValue.toString()) {
                throw new Error("not a valid integer");
            } else {
                return value;
            }
        }
    }

    /**
     * @param {number | bigint | string | Date} rawValue
     */
    constructor(rawValue) {
        super(Time.cleanConstructorArg(rawValue));
    }

    /**
     * @param {UplcData} data
     * @returns {Time}
     */
    static fromUplcData(data) {
        return new Time(data.int);
    }

    /**
     * @param {string | number[]} bytes
     * @returns {Time}
     */
    static fromUplcCbor(bytes) {
        return Time.fromUplcData(UplcData.fromCbor(bytes));
    }
}

/**
 * Difference between two time values in milliseconds.
 */
export class Duration extends HInt {
    /**
     * @param {UplcData} data
     * @returns {Duration}
     */
    static fromUplcData(data) {
        return new Duration(data.int);
    }

    /**
     * @param {string | number[]} bytes
     * @returns {Duration}
     */
    static fromUplcCbor(bytes) {
        return Duration.fromUplcData(UplcData.fromCbor(bytes));
    }
}

/**
 * Helios Bool type
 */
export class Bool extends HeliosData {
    /** 
     * @type {boolean} 
     */
    #value;

    /**
     * @package
     * @param {boolean | string} rawValue 
     * @returns {boolean}
     */
    static cleanConstructorArg(rawValue) {
        if (typeof rawValue == "string") {
            if (rawValue == "false") {
                return false;
            } else if (rawValue == "true") {
                return true;
            } else {
                throw new Error("not a valid string representation of a Bool");
            }
        } else if (typeof rawValue == "boolean") {
            return rawValue;
        } else {
            throw new Error("can't convert to boolean");
        }
    }

    /**
     * @param {boolean | string} rawValue 
     */
    constructor(rawValue) {
        super();

        this.#value = Bool.cleanConstructorArg(rawValue);
    }

    get bool() {
        return this.#value;
    }
    
    /**
     * @package
     * @returns {UplcData}
     */
    _toUplcData() {
        return new ConstrData(this.#value ? 1 : 0, []);
    }

    /** 
     * @param {UplcData} data
     * @returns {Bool}
     */
    static fromUplcData(data) {
        assert(data.fields.length == 0, "bool data can't have fields");

        if (data.index == 0) {
            return new Bool(false);
        } else if (data.index == 1) {
            return new Bool(true);
        } else {
            throw new Error("expected 0 or 1 for ConstrData representing Bool");
        }
    }

    /**
     * @param {string | number[]} bytes 
     * @returns {Bool}
     */
    static fromUplcCbor(bytes) {
        return Bool.fromUplcData(UplcData.fromCbor(bytes));
    }
}

/**
 * Helios String type.
 * Can't be named 'String' because that would interfere with the javascript 'String'-type
 */
export class HString extends HeliosData {
    /**
     * @type {string}
     */
    #value;

    /**
     * @param {string} value 
     */
    constructor(value) {
        super();

        this.#value = value;
    }

    get string() {
        return this.#value;
    }

    /**
     * @package
     * @returns {UplcData}
     */
    _toUplcData() {
        return new ByteArrayData(textToBytes(this.#value));
    }

    /**
     * @param {UplcData} data 
     * @returns {HString}
     */
    static fromUplcData(data) {
        return new HString(bytesToText(data.bytes));
    }

    /**
     * @param {string | number[]} bytes 
     * @returns {HString}
     */
    static fromUplcCbor(bytes) {
        return HString.fromUplcData(UplcData.fromCbor(bytes));
    }
}

/**
 * Helios ByteArray type
 */
export class ByteArray extends HeliosData {
    /**
     * @type {number[]}
     */
    #bytes;

    /**
     * @package
     * @param {string | number[]} rawValue 
     */
    static cleanConstructorArg(rawValue) {
        if (Array.isArray(rawValue)) {
            return rawValue;
        } else if (typeof rawValue == "string") {
            if (rawValue.startsWith("#")) {
                rawValue = rawValue.slice(1);
            }

            return hexToBytes(rawValue);
        } else {
            throw new Error("unexpected bytes type");
        }
    }

    /**
     * @param {string | number[]} rawValue 
     */
    constructor(rawValue) {
        super();

        this.#bytes = ByteArray.cleanConstructorArg(rawValue);
    }

    /**
     * @type {number[]}
     */
    get bytes() {
        return this.#bytes;
    }

    /**
     * @type {string}
     */
    get hex() {
        return bytesToHex(this.#bytes);
    }

    /**
     * @package
     * @returns {UplcData}
     */
    _toUplcData() {
        return new ByteArrayData(this.#bytes);
    }

    /**
     * @param {UplcData} data 
     * @returns {ByteArray}
     */
    static fromUplcData(data) {
        return new ByteArray(data.bytes);
    }

    /**
     * @param {string | number[]} bytes
     * @returns {ByteArray}
     */
    static fromUplcCbor(bytes) {
        return ByteArray.fromUplcData(UplcData.fromCbor(bytes));
    }
}

/**
 * Dynamically constructs a new List class, depending on the item type.
 * @template {HeliosData} T
 * @param {HeliosDataClass<T>} ItemClass
 * @returns {HeliosDataClass<HList_>}
 */
export function HList(ItemClass) {
    assert(!new.target, "List can't be called with new");
    assert(ItemClass.prototype instanceof HeliosData);

    const typeName = `[]${ItemClass.name}`;

    class HList_ extends HeliosData {
        /** 
         * @type {T[]} 
         */
        #items;

        /**
         * @param {any[]} rawList 
         */
        constructor(rawList) {
            super();

            this.#items = rawList.map(item => {
                if (item instanceof ItemClass) {
                    return item;
                } else {
                    return new ItemClass(item);
                }
            });
        }

        /**
         * @package
         * @type {string}
         */
        get _listTypeName() {
            return typeName;
        }

        /**
         * Overload 'instanceof' operator
         * @package
         * @param {any} other 
         * @returns {boolean}
         */
        static [Symbol.hasInstance](other) {
            return (other._listTypeName === typeName) && (other instanceof HeliosData);
        }

        /**
         * @type {T[]}
         */
        get items() {
            return this.#items;
        }

        /**
         * @package
         * @returns {UplcData}
         */
        _toUplcData() {
            return new ListData(this.#items.map(item => item._toUplcData()))
        }

        /**
         * @param {UplcData} data 
         * @returns {HList_}
         */
        static fromUplcData(data) {
            return new HList_(data.list.map(d => ItemClass.fromUplcData(d)));
        }

        /**
         * @param {string | number[]} bytes 
         * @returns {HList_}
         */
        static fromUplcCbor(bytes) {
            return HList_.fromUplcData(UplcData.fromCbor(bytes));
        }
    }

    Object.defineProperty(HList_, "name", {
        value: typeName,
        writable: false
    });

    return HList_;
}

/**
 * @template {HeliosData} TKey
 * @template {HeliosData} TValue
 * @param {HeliosDataClass<TKey>} KeyClass 
 * @param {HeliosDataClass<TValue>} ValueClass
 * @returns {HeliosDataClass<HMap_>}
 */
export function HMap(KeyClass, ValueClass) {
    assert(!new.target, "HMap can't be called with new");
    assert(KeyClass.prototype instanceof HeliosData);
    assert(ValueClass.prototype instanceof HeliosData);
    
    const typeName = `Map[${KeyClass.name}]${ValueClass.name}`;

    class HMap_ extends HeliosData {
        /**
         * @type {[TKey, TValue][]}
         */
        #pairs;

        /**
         * @package
         * @param {...any} args
         * @returns {[any, any][]}
         */
        static cleanConstructorArgs(...args) {
            /** @type {[any, any][]} */
            let pairs = [];

            if (args.length == 1) {
                const arg = args[0];

                if (arg instanceof Map) {
                    return HMap_.cleanConstructorArgs(Array.from(arg.entries()));
                } else if (!Array.isArray(arg)) {
                    throw new Error("expected array or Map arg");
                } else {
                    const lst = arg;

                    pairs = lst.map(item => {
                        if (!Array.isArray(item)) {
                            throw new Error("expected array item (pair)");
                        } else if (item.length != 2) {
                            throw new Error("expected array item of length 2 (pair)");
                        } else {
                            return [item[0], item[1]];
                        }
                    });
                }
            } else if (args.length == 2) {
                const [keys, values] = args;

                if (!Array.isArray(keys)) {
                    throw new Error("expected keys array arg");
                } else if (!Array.isArray(values)) {
                    throw new Error("expected values array arg");
                } else if (keys.length != values.length) {
                    throw new Error("keys and values list don't have same length");
                } else {
                    pairs = keys.map((key, i) => {
                        const value = values[i];

                        return [key, value];
                    });
                }
            } else {
                throw new Error("unexpected number of args");
            }

            return pairs;
        }

        /**
         * @param  {...any} args
         */
        constructor(...args) {
            const rawPairs = HMap_.cleanConstructorArgs(...args);

            /**
             * @type {[TKey, TValue][]}
             */
            const pairs = rawPairs.map(([rawKey, rawValue]) => {
                const key = function() {
                    if (rawKey instanceof KeyClass) {
                        return rawKey;
                    } else {
                        return new KeyClass(rawKey);
                    }
                }();

                const value = function() {
                    if (rawValue instanceof ValueClass) {
                        return rawValue;
                    } else {
                        return new ValueClass(rawValue);
                    }
                }();

                return [key, value];
            });

            super();

            this.#pairs = pairs;
        }

        /**
         * @package
         * @type {string}
         */
        get _mapTypeName() {
            return typeName;
        }

        /**
         * Overload 'instanceof' operator
         * @package
         * @param {any} other 
         * @returns {boolean}
         */
        static [Symbol.hasInstance](other) {
            return (other._mapTypeName === typeName) && (other instanceof HeliosData);
        }

        /**
         * @type {[TKey, TValue][]}
         */
        get pairs() {
            return this.#pairs;
        }

        /**
         * @package
         * @returns {UplcData}
         */
        _toUplcData() {
            return new MapData(this.#pairs.map(([key, value]) => [key._toUplcData(), value._toUplcData()]));
        }

        /**
         * @param {UplcData} data 
         * @returns {HMap_}
         */
        static fromUplcData(data) {
            return new HMap_(data.map.map(([kd, vd]) => [KeyClass.fromUplcData(kd), ValueClass.fromUplcData(vd)]));
        }

        /**
         * @param {string | number[]} bytes 
         * @returns {HMap_}
         */
        static fromUplcCbor(bytes) {
            return HMap_.fromUplcData(UplcData.fromCbor(bytes));
        }
    }

    Object.defineProperty(HMap_, "name", {
        value: typeName,
        writable: false
    });

    return HMap_;
}

/**
 * @template {HeliosData} T
 * @param {HeliosDataClass<T>} SomeClass
 * @returns {HeliosDataClass<Option_>}
 */
export function Option(SomeClass) {
    assert(!new.target, "Option can't be called with new");
    assert(SomeClass.prototype instanceof HeliosData);

    const typeName = `Option[${SomeClass.name}]`;

    class Option_ extends HeliosData {
        /**
         * @type {?T}
         */
        #value;

        /**
         * @package
         * @param {?any} rawValue 
         * @returns {?T}
         */
        static cleanConstructorArg(rawValue) {
            if (rawValue == null) {
                return null;
            } else if (!(rawValue instanceof SomeClass)) {
                return new SomeClass(rawValue);
            } else {
                return rawValue;
            }
        }

        /** 
         * @param {?any} rawValue
         */
        constructor(rawValue = null) {
            super();

            this.#value = Option_.cleanConstructorArg(rawValue);
        }

        /**
         * @package
         * @type {string}
         */
        get _optionTypeName() {
            return typeName;
        }

        /**
         * Overload 'instanceof' operator
         * @package
         * @param {any} other 
         * @returns {boolean}
         */
        static [Symbol.hasInstance](other) {
            return (other._optionTypeName === typeName) && (other instanceof HeliosData);
        }

        /**
         * @type {?T}
         */
        get some() {
            return this.#value;
        }

        /**
         * @package
         * @returns {UplcData}
         */
        _toUplcData() {
            return new ConstrData(this.#value === null ? 1 : 0, this.#value === null ? [] : [this.#value._toUplcData()]);
        }

        /**
         * @param {UplcData} data 
         * @returns {Option_}
         */
        static fromUplcData(data) {
            if (data.index == 1) {
                assert(data.fields.length == 0);

                return new Option_(null);
            } else if (data.index == 0) {
                assert(data.fields.length == 1);

                return new Option_(SomeClass.fromUplcData(data.fields[0]))
            } else {
                throw new Error("unexpected option constr index");
            }
        }

        /**
         * @param {string | number[]} bytes
         * @returns {Option_}
         */
        static fromUplcCbor(bytes) {
            return Option_.fromUplcData(UplcData.fromCbor(bytes));
        }
    }

    Object.defineProperty(HList, "name", {
        value: typeName,
        writable: false
    });

    return Option_;
}


/**
 * Base class of all hash-types
 * @package
 */
class Hash extends HeliosData {
	/** @type {number[]} */
	#bytes;

	/**
	 * @param {string | number[]} rawValue 
	 * @returns {number[]}
	 */
	static cleanConstructorArg(rawValue) {
		if (typeof rawValue == "string") {
			return hexToBytes(rawValue);
		} else {
			return rawValue;
		}
	}

	/**
	 * @param {number[]} bytes 
	 */
	constructor(bytes) {
		super();
		this.#bytes = bytes;
	}

	/**
	 * @returns {number[]}
	 */
	get bytes() {
		return this.#bytes;
	}

	/**
	 * @returns {string}
	 */
	get hex() {
		return bytesToHex(this.#bytes);
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return CborData.encodeBytes(this.#bytes);
	}

    /**
     * @returns {UplcData}
     */
    _toUplcData() {
        return new ByteArrayData(this.#bytes);
    }

	/**
	 * Used internally for metadataHash and scriptDataHash
	 * @param {number[]} bytes 
	 * @returns {Hash}
	 */
	static fromCbor(bytes) {
		return new Hash(CborData.decodeBytes(bytes));
	}

	/**
	 * Might be needed for internal use
	 * @param {string} str 
	 * @returns {Hash}
	 */
	static fromHex(str) {
		return new Hash(hexToBytes(str));
	}

	/**
	 * @returns {string}
	 */
	dump() {
		return bytesToHex(this.#bytes);
	}

	/**
	 * @param {Hash} other
	 */
	eq(other) {
		return eq(this.#bytes, other.#bytes);
	}

	/**
	 * @param {Hash} a 
	 * @param {Hash} b 
	 * @returns {number}
	 */
	static compare(a, b) {
		return ByteArrayData.comp(a.#bytes, b.#bytes);
	}
}

export class DatumHash extends Hash {
	/**
	 * @param {string | number[]} rawValue
	 */
	constructor(rawValue) {
		const bytes = Hash.cleanConstructorArg(rawValue);

		assert(bytes.length == 32);
		super(bytes);
	}

	/**
	 * @param {number[]} bytes 
	 * @returns {DatumHash}
	 */
	static fromCbor(bytes) {
		return new DatumHash(CborData.decodeBytes(bytes));
	}

	/**
	 * @param {UplcData} data 
	 * @returns {DatumHash}
	 */
	 static fromUplcData(data) {
		return new DatumHash(data.bytes);
	}
	
	/**
	 * @param {string | number[]} bytes 
	 * @returns {DatumHash}
	 */
	static fromUplcCbor(bytes) {
		return DatumHash.fromUplcData(UplcData.fromCbor(bytes));
	}

	/**
	 * @param {string} str 
	 * @returns {DatumHash}
	 */
	static fromHex(str) {
		return new DatumHash(hexToBytes(str));
	}
}

export class PubKeyHash extends Hash {
	
	/**
	 * @param {string | number[]} rawValue 
	 */
	constructor(rawValue) {
		const bytes = Hash.cleanConstructorArg(rawValue);

		assert(bytes.length == 28, `expected 28 bytes for PubKeyHash, got ${bytes.length}`);
		super(bytes);
	}

	/**
	 * @param {number[]} bytes 
	 * @returns {PubKeyHash}
	 */
	static fromCbor(bytes) {
		return new PubKeyHash(CborData.decodeBytes(bytes));
	}

	/**
	 * @param {UplcData} data 
	 * @returns {PubKeyHash}
	 */
	static fromUplcData(data) {
		return new PubKeyHash(data.bytes);
	}
	
	/**
	 * @param {string | number[]} bytes 
	 * @returns {PubKeyHash}
	 */
	static fromUplcCbor(bytes) {
		return PubKeyHash.fromUplcData(UplcData.fromCbor(bytes));
	}

	/**
	 * @param {string} str 
	 * @returns {PubKeyHash}
	 */
	static fromHex(str) {
		return new PubKeyHash(hexToBytes(str));
	}
}

export class ScriptHash extends Hash {
	/**
	 * @param {string | number[]} rawValue
	 */
	constructor(rawValue) {
		const bytes = Hash.cleanConstructorArg(rawValue);

		assert(bytes.length == 28, `expected 28 bytes for ScriptHash, got ${bytes.length}`);
		super(bytes);
	}
}

export class MintingPolicyHash extends ScriptHash {
	/**
	 * @param {number[]} bytes 
	 * @returns {MintingPolicyHash}
	 */
	static fromCbor(bytes) {
		return new MintingPolicyHash(CborData.decodeBytes(bytes));
	}

	/**
	 * @param {UplcData} data 
	 * @returns {MintingPolicyHash}
	 */
	static fromUplcData(data) {
		return new MintingPolicyHash(data.bytes);
	}
			
	/**
	 * @param {string | number[]} bytes 
	 * @returns {MintingPolicyHash}
	 */
	static fromUplcCbor(bytes) {
		return MintingPolicyHash.fromUplcData(UplcData.fromCbor(bytes));
	}

	/**
	 * @param {string} str 
	 * @returns {MintingPolicyHash}
	 */
	static fromHex(str) {
		return new MintingPolicyHash(hexToBytes(str));
	}

	/**
	 * Encodes as bech32 string using 'asset' as human readable part
	 * @returns {string}
	 */
	toBech32() {
		return Crypto.encodeBech32("asset", Crypto.blake2b(this.bytes, 20));
	}
}

export class StakeKeyHash extends Hash {
	/**
	 * @param {number[]} rawValue
	 */
	constructor(rawValue) {
		const bytes = Hash.cleanConstructorArg(rawValue);
		
		assert(bytes.length == 28, `expected 28 bytes for StakeKeyHash, got ${bytes.length}`);
		super(bytes);
	}

	/**
	 * @param {number[]} bytes 
	 * @returns {StakeKeyHash}
	 */
	static fromCbor(bytes) {
		return new StakeKeyHash(CborData.decodeBytes(bytes));
	}

	/**
	 * @param {UplcData} data 
	 * @returns {StakeKeyHash}
	 */
	static fromUplcData(data) {
		return new StakeKeyHash(data.bytes);
	}
		
	/**
	 * @param {string | number[]} bytes 
	 * @returns {StakeKeyHash}
	 */
	static fromUplcCbor(bytes) {
		return StakeKeyHash.fromUplcData(UplcData.fromCbor(bytes));
	}

	/**
	 * @param {string} str 
	 * @returns {StakeKeyHash}
	 */
	static fromHex(str) {
		return new StakeKeyHash(hexToBytes(str));
	}
}

export class StakingValidatorHash extends ScriptHash {
	/**
	 * @param {number[]} bytes 
	 * @returns {StakingValidatorHash}
	 */
	static fromCbor(bytes) {
		return new StakingValidatorHash(CborData.decodeBytes(bytes));
	}

	/**
	 * @param {UplcData} data 
	 * @returns {StakingValidatorHash}
	 */
	static fromUplcData(data) {
		return new StakingValidatorHash(data.bytes);
	}
			
	/**
	 * @param {string | number[]} bytes 
	 * @returns {StakingValidatorHash}
	 */
	static fromUplcCbor(bytes) {
		return StakingValidatorHash.fromUplcData(UplcData.fromCbor(bytes));
	}

	/**
	 * @param {string} str 
	 * @returns {StakingValidatorHash}
	 */
	static fromHex(str) {
		return new StakingValidatorHash(hexToBytes(str));
	}
}

export class ValidatorHash extends ScriptHash {
	/**
	 * @param {number[]} bytes 
	 * @returns {ValidatorHash}
	 */
	static fromCbor(bytes) {
		return new ValidatorHash(CborData.decodeBytes(bytes));
	}

	/**
	 * @param {UplcData} data 
	 * @returns {ValidatorHash}
	 */
	static fromUplcData(data) {
		return new ValidatorHash(data.bytes);
	}
		
	/**
	 * @param {string | number[]} bytes 
	 * @returns {ValidatorHash}
	 */
	static fromUplcCbor(bytes) {
		return ValidatorHash.fromUplcData(UplcData.fromCbor(bytes));
	}

	/**
	 * @param {string} str 
	 * @returns {ValidatorHash}
	 */
	static fromHex(str) {
		return new ValidatorHash(hexToBytes(str));
	}
}

/**
 * Hash of a transaction
 */
export class TxId extends Hash {
	/**
	 * @param {string | number[]} rawValue 
	 */
	constructor(rawValue) {
        const bytes = Hash.cleanConstructorArg(rawValue);

		assert(bytes.length == 32, `expected 32 bytes for TxId, got ${bytes.length}`);
		super(bytes);
	}

    /**
     * @returns {UplcData}
     */
    _toUplcData() {
        return new ConstrData(0, [new ByteArrayData(this.bytes)]);
    }

	/**
	 * @param {number[]} bytes 
	 * @returns {TxId}
	 */
	static fromCbor(bytes) {
		return new TxId(CborData.decodeBytes(bytes));
	}

    /**
     * @param {UplcData} data
     * @returns {TxId}
     */
    static fromUplcData(data) {
        assert(data.index == 0);
        assert(data.fields.length == 1);

        return new TxId(data.fields[0].bytes);
    }

    /**
     * @param {string | number[]} bytes 
     * @returns {TxId}
     */
    static fromUplcCbor(bytes) {
        return TxId.fromUplcData(UplcData.fromCbor(bytes));
    }

	/**
	 * @param {string} str 
	 * @returns {TxId}
	 */
	static fromHex(str) {
		return new TxId(hexToBytes(str));
	}

	/**
	 * Filled with 255 so that the internal show() function has max execution budget cost
	 * @param {number} fill
	 * @returns {TxId}
	 */
	static dummy(fill = 255) {
		return new TxId((new Array(32)).fill(fill));
	}
}

/**
 * Id of a Utxo
 */
export class TxOutputId extends HeliosData {
    /** @type {TxId} */
    #txId;

    /** @type {HInt} */
    #utxoIdx;

    /**
     * @param  {...any} args
     * @returns {[any, any]}
     */
    static cleanConstructorArgs(...args) {
        if (args.length == 1) {
            const arg = args[0];

            if (typeof arg == "string") {
                const parts = arg.split("#");

                assert(parts.length == 2);

                return [parts[0], parts[1]];
            } else {
                throw new Error("unexpected single arg type");
            }
        } else if (args.length == 2) {
            return [args[0], args[1]];
        } else {
            throw new Error("unexpected number of args");
        }
    }

    /**
     * @param {...any} args
     */
    constructor(...args) {
        const [rawTxId, rawUtxoIdx] = TxOutputId.cleanConstructorArgs(...args);

        const txId = (rawTxId instanceof TxId) ? rawTxId : new TxId(rawTxId);
        const utxoIdx = (rawUtxoIdx instanceof HInt) ? rawUtxoIdx : new HInt(rawUtxoIdx);

        super();

        this.#txId = txId;
        this.#utxoIdx = utxoIdx;
    }

    get txId() {
        return this.#txId;
    }

    get utxoIdx() {
        return this.#utxoIdx;
    }

    /**
     * @returns {UplcData}
     */
    _toUplcData() {
        return new ConstrData(0, [this.#txId._toUplcData(), this.#utxoIdx._toUplcData()])
    }

    /**
     * @param {UplcData} data
     * @returns {TxOutputId}
     */
    static fromUplcData(data) {
        assert(data.index == 0);
        assert(data.fields.length == 2);

        return new TxOutputId(TxId.fromUplcData(data.fields[0]), HInt.fromUplcData(data.fields[1]));
    }

    /**
     * @param {string | number[]} bytes 
     * @returns {TxOutputId}
     */
    static fromUplcCbor(bytes) {
        return TxOutputId.fromUplcData(UplcData.fromCbor(bytes));
    }
}

/**
 * See CIP19 for formatting of first byte
 */
export class Address extends HeliosData {
	/** @type {number[]} */
	#bytes;

    /**
	 * @param {number[] | string} rawValue
	 * @returns {number[]}
	 */
    static cleanConstructorArg(rawValue) {
        if (typeof rawValue == "string") {
            if (rawValue.startsWith("addr")) {
                return Address.fromBech32(rawValue).bytes;
            } else {
                if (rawValue.startsWith("#")) {
                    rawValue = rawValue.slice(1);
                }

                return hexToBytes(rawValue);
            }
        } else {
            return rawValue;
        }
    }

	/**
	 * @param {string | number[]} rawValue
	 */
	constructor(rawValue) {
		super();
		this.#bytes = Address.cleanConstructorArg(rawValue);

        assert(this.#bytes.length == 29 || this.#bytes.length == 57, `expected 29 or 57 bytes for Address, got ${this.#bytes.length}`);
	}

	get bytes() {
		return this.#bytes.slice();
	}

	toCbor() {
		return CborData.encodeBytes(this.#bytes);
	}

	/**
	 * @param {number[]} bytes
	 * @returns {Address}
	 */
	static fromCbor(bytes) {
		return new Address(CborData.decodeBytes(bytes));
	}

	/**
	 * @param {string} str
	 * @returns {Address}
	 */
	static fromBech32(str) {
		// ignore the prefix (encoded in the bytes anyway)
		let [prefix, bytes] = Crypto.decodeBech32(str);

		let result = new Address(bytes);

		assert(prefix == (Address.isForTestnet(result) ? "addr_test" : "addr"), "invalid Address prefix");

		return result;
	}

	/**
	 * Doesn't check validity
	 * @param {string} hex
	 * @returns {Address}
	 */
	static fromHex(hex) {
		return new Address(hexToBytes(hex));
	}

	/**
	 * Returns the raw Address bytes as a hex encoded string
	 * @returns {string}
	 */
	toHex() {
		return bytesToHex(this.#bytes);
	}

    /**
     * @param {PubKeyHash | ValidatorHash} hash 
     * @param {?(StakeKeyHash | StakingValidatorHash)} stakingHash 
     * @param {boolean} isTestnet
     * @returns {Address}
     */
    static fromHashes(hash, stakingHash = null, isTestnet = config.IS_TESTNET) {
        if (hash instanceof PubKeyHash) {
            return Address.fromPubKeyHash(hash, stakingHash, isTestnet);
        } else if (hash instanceof ValidatorHash) {
            return Address.fromValidatorHash(hash, stakingHash, isTestnet);
        } else {
            throw new Error("unexpected");
        }
    }

	/**
	 * Simple payment address without a staking part
	 * @param {PubKeyHash} hash
	 * @param {?(StakeKeyHash | StakingValidatorHash)} stakingHash
     * @param {boolean} isTestnet
	 * @returns {Address}
	 */
	static fromPubKeyHash(hash, stakingHash = null, isTestnet = config.IS_TESTNET) {
		if (stakingHash !== null) {
			if (stakingHash instanceof StakeKeyHash) {
				return new Address(
					[isTestnet ? 0x00 : 0x01].concat(hash.bytes).concat(stakingHash.bytes)
				);
			} else {
				assert(stakingHash instanceof StakingValidatorHash);
				return new Address(
					[isTestnet ? 0x20 : 0x21].concat(hash.bytes).concat(stakingHash.bytes)
				);
			}
		} else {
			return new Address([isTestnet ? 0x60 : 0x61].concat(hash.bytes));
		}
	}

	/**
	 * Simple script address without a staking part
	 * Only relevant for validator scripts
	 * @param {ValidatorHash} hash
	 * @param {?(StakeKeyHash | StakingValidatorHash)} stakingHash
     * @param {boolean} isTestnet
	 * @returns {Address}
	 */
	static fromValidatorHash(hash, stakingHash = null, isTestnet = config.IS_TESTNET) {
		if (stakingHash !== null) {
			if (stakingHash instanceof StakeKeyHash) {
				return new Address(
					[isTestnet ? 0x10 : 0x11].concat(hash.bytes).concat(stakingHash.bytes)
				);
			} else {
				assert(stakingHash instanceof StakingValidatorHash);
				return new Address(
					[isTestnet ? 0x30 : 0x31].concat(hash.bytes).concat(stakingHash.bytes)
				);
			}
		} else {
			return new Address([isTestnet ? 0x70 : 0x71].concat(hash.bytes));
		}
	}


	/**
	 * @returns {string}
	 */
	toBech32() {
		return Crypto.encodeBech32(
			Address.isForTestnet(this) ? "addr_test" : "addr",
			this.#bytes
		);
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		return {
			hex: bytesToHex(this.#bytes),
			bech32: this.toBech32(),
		};
	}

	/**
	 * @param {Address} address
	 * @returns {boolean}
	 */
	static isForTestnet(address) {
		let type = address.bytes[0] & 0b00001111;

		return type == 0;
	}

	/**
     * 
     * @private
	 * @returns {ConstrData}
	 */
	toCredentialData() {
		let vh = this.validatorHash;

		if (vh !== null) {
			return new ConstrData(1, [new ByteArrayData(vh.bytes)]);
		} else {
			let pkh = this.pubKeyHash;

			if (pkh === null) {
				throw new Error("unexpected");
			} else {
				return new ConstrData(0, [new ByteArrayData(pkh.bytes)]);
			}
		}
	}

	/**
	 * @returns {ConstrData}
	 */
	toStakingData() {
        const type = this.#bytes[0] >> 4;
		const sh = this.stakingHash;

		if (sh == null) {
			return new ConstrData(1, []); // none
		} else {
            if (type == 4 || type == 5) {
                throw new Error("not yet implemented");
            } else if (type == 3 || type == 2) {
                // some
                return new ConstrData(0, [
                    // staking credential -> 0, 1 -> pointer
                    new ConstrData(0, [
                        // StakingValidator credential
                        new ConstrData(1, [new ByteArrayData(sh.bytes)]),
                    ]),
                ]);
            } else if (type == 0 || type == 1) {
                // some
                return new ConstrData(0, [
                    // staking credential -> 0, 1 -> pointer
                    new ConstrData(0, [
                        // StakeKeyHash credential
                        new ConstrData(0, [new ByteArrayData(sh.bytes)]),
                    ]),
                ]);
            } else {
                throw new Error("unexpected");
            }
		}
	}

	/**
	 * @returns {UplcData}
	 */
	_toUplcData() {
		return new ConstrData(0, [this.toCredentialData(), this.toStakingData()]);
	}

    /**
     * @param {UplcData} data 
     * @param {boolean} isTestnet
     * @returns {Address}
     */
    static fromUplcData(data, isTestnet = config.IS_TESTNET) {
        assert(data.index == 0);
        assert(data.fields.length == 2);
        
        const credData = data.fields[0];
        const stakData = data.fields[1];

        assert(credData.fields.length == 1);

        /**
         * @type {?(StakeKeyHash | StakingValidatorHash)}
         */
        let sh;

		// for some weird reason Option::None has index 1
        if (stakData.index == 1) {
            sh = null;
        } else if (stakData.index == 0) {
            assert(stakData.fields.length == 1);

            const inner = stakData.fields[0];
            assert(inner.fields.length == 1);

            if (inner.index == 0) {
                const innerInner = inner.fields[0];
                assert(innerInner.fields.length == 1);

                if (innerInner.index == 0) {
                    sh = new StakeKeyHash(innerInner.fields[0].bytes);
                } else if (innerInner.index == 1) {
                    sh = new StakingValidatorHash(innerInner.fields[0].bytes);
                } else {
                    throw new Error("unexpected");
                }
            } else if (inner.index == 1) {
                throw new Error("staking pointer not yet handled");
            } else {
                throw new Error("unexpected");
            }
        } else {
            throw new Error("unexpected");
        }

        if (credData.index == 0) {
            return Address.fromPubKeyHash(new PubKeyHash(credData.fields[0].bytes), sh, isTestnet);
        } else if (credData.index == 1) {
            return Address.fromValidatorHash(new ValidatorHash(credData.fields[0].bytes), sh, isTestnet);
        } else {
            throw new Error("unexpected");
        }
    }

    /**
     * @param {string | number[]} bytes 
     * @param {boolean} isTestnet
     * @returns {Address}
     */
    static fromUplcCbor(bytes, isTestnet = config.IS_TESTNET) {
        return Address.fromUplcData(UplcData.fromCbor(bytes), isTestnet);
    }

	/**
	 * @type {?PubKeyHash}
	 */
	get pubKeyHash() {
		let type = this.#bytes[0] >> 4;

		if (type % 2 == 0) {
			return new PubKeyHash(this.#bytes.slice(1, 29));
		} else {
			return null;
		}
	}

	/**
	 * @type {?ValidatorHash}
	 */
	get validatorHash() {
		let type = this.#bytes[0] >> 4;

		if (type % 2 == 1) {
			return new ValidatorHash(this.#bytes.slice(1, 29));
		} else {
			return null;
		}
	}

	/**
	 * @type {?(StakeKeyHash | StakingValidatorHash)}
	 */
	get stakingHash() {
		let type = this.#bytes[0] >> 4;

        let bytes = this.#bytes.slice(29);
        

        if (type == 0 || type == 1) {
            assert(bytes.length == 28);
            return new StakeKeyHash(bytes);
        } else if (type == 2 || type == 3) {
            assert(bytes.length == 28);
            return new StakingValidatorHash(bytes);
        } else if (type == 4 || type == 5) {
            throw new Error("staking pointer not yet supported");
        } else {
			return null;
		}
	}

	/**
	 * Used to sort txbody withdrawals
	 * @param {Address} a
	 * @param {Address} b
	 * @return {number}
	 */
	static compStakingHashes(a, b) {
		return Hash.compare(assertDefined(a.stakingHash), assertDefined(b.stakingHash));
	}
}

export class AssetClass extends HeliosData {
	/**
	 * @type {MintingPolicyHash}
	 */
	#mph;

	/**
	 * @type {number[]}
	 */
	#tokenName;

	/**
	 * @param {any[]} args
	 * @returns {[MintingPolicyHash, number[]]}
	 */
	static cleanConstructorArgs(args) {
		if (args.length == 1) {
			const arg = args[0];	

			if (typeof arg == "string") {
				const fields = arg.split(".")

				assert(fields.length == 2, "expected '.' in hex encoded AssetClass");

				return [new MintingPolicyHash(fields[0]), hexToBytes(fields[1])];
			} else {
				throw new Error("unexpected AssetClass arg type");
			}
		} else if (args.length == 2) {
			const arg0 = args[0];
			const arg1 = args[1];

			return [
				arg0 instanceof MintingPolicyHash ? arg0 : new MintingPolicyHash(arg0),
				Array.isArray(arg1) ? arg1 : hexToBytes(arg1)
			];
		} else {
			throw new Error("unexpected number of AssetClass args");
		}
	}

	/**
	 * 
	 * @param {any[]} args 
	 */
	constructor(...args) {
		super();
		const [mph, tokenName] = AssetClass.cleanConstructorArgs(args);

		this.#mph = mph;
		this.#tokenName = tokenName;
	}

	/**
	 * Used when generating script contexts for running programs
	 * @returns {ConstrData}
	 */
	_toUplcData() {
		return new ConstrData(0, [
			this.#mph._toUplcData(),
			new ByteArrayData(this.#tokenName)
		])
	}

	/**
	 * 
	 * @param {UplcData} data 
	 * @returns {AssetClass}
	 */
	static fromUplcData(data) {
		assert(data.index == 0);
		assert(data.fields.length == 2);

		const mph = MintingPolicyHash.fromUplcData(data.fields[0]);
		const tokenName = data.fields[1].bytes;

		return new AssetClass(mph, tokenName);
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return CborData.encodeConstr(0, [
			this.#mph.toCbor(),
			CborData.encodeBytes(this.#tokenName)
		]);
	}

	/**
	 * @param {number[]} bytes 
	 */
	static fromCbor(bytes) {
		/**
		 * @type {MintingPolicyHash | null}
		 */
		let mph = null;

		/**
		 * @type {number[] | null}
		 */
		let tokenName = null;

		const tag = CborData.decodeConstr(bytes, (i, fieldBytes) => {
			switch (i) {
				case 0:
					mph = MintingPolicyHash.fromCbor(fieldBytes);
					break;
				case 1:
					tokenName = CborData.decodeBytes(fieldBytes);
					break;
				default:
					throw new Error("unexpected field");
			} 
		});

		assert(tag == 0);

		if (mph == null || tokenName == null) {
			throw new Error("insufficient fields");
		} else {
			return new AssetClass(mph, tokenName);
		}
	}

    /**
     * @param {string | number[]} bytes
     * @returns {AssetClass}
     */
    static fromUplcCbor(bytes) {
        return AssetClass.fromUplcData(UplcData.fromCbor(bytes));
    }
}


/**
 * Collection of non-lovelace assets
 */
export class Assets extends CborData {
	/** @type {[MintingPolicyHash, [number[], bigint][]][]} */
	#assets;

	/**
	 * @param {[MintingPolicyHash | number[] | string, [number[] | string, bigint | number][]][]} assets 
	 */
	constructor(assets = []) {
		super();
		this.#assets = assets.map(([rawMph, tokens]) => {
			const mph = rawMph instanceof MintingPolicyHash ? rawMph : new MintingPolicyHash(rawMph);

			return [
				mph,
				tokens.map(([rawName, amount]) => {
					const name = Array.isArray(rawName) ? rawName : hexToBytes(rawName);

					return [name, BigInt(amount)];
				})
			];
		});
	}

	/**
	 * @type {MintingPolicyHash[]}
	 */
	get mintingPolicies() {
		return this.#assets.map(([mph, _]) => mph);
	}

	/**
	 * @type {number}
	 */
	get nTokenTypes() {
		let count = 0;
		
		this.#assets.forEach(([mph, tokens]) => {
			tokens.forEach(([tokenName, _]) => {
				count += 1
			})
		})

		return count;
	}

	/**
	 * @returns {boolean}
	 */
	isZero() {
		return this.#assets.length == 0;
	}

	/**
	 * @param {MintingPolicyHash} mph
	 * @param {number[]} tokenName 
	 * @returns {boolean}
	 */
	has(mph, tokenName) {
		let inner = this.#assets.find(asset => mph.eq(asset[0]));

		if (inner !== undefined) {
			return inner[1].findIndex(pair => eq(pair[0], tokenName)) != -1;
		} else {
			return false;
		}
	}

	/**
	 * @param {MintingPolicyHash} mph
	 * @param {number[]} tokenName 
	 * @returns {bigint}
	 */
	get(mph, tokenName) {
		let inner = this.#assets.find(asset => mph.eq(asset[0]));

		if (inner !== undefined) {
			let token = inner[1].find(pair => eq(pair[0], tokenName));

			if (token !== undefined) {
				return token[1];
			} else {
				return 0n;
			}
		} else {
			return 0n;
		}
	}

	/**
	 * Mutates 'this'
	 */
	removeZeroes() {
		for (let asset of this.#assets) {
			asset[1] = asset[1].filter(token => token[1] != 0n);
		}

		this.#assets = this.#assets.filter(asset => asset[1].length != 0);
	}

	/**
	 * Mutates 'this'
	 * @param {MintingPolicyHash} mph
	 * @param {number[]} tokenName 
	 * @param {bigint} quantity
	 */
	addComponent(mph, tokenName, quantity) {
		if (quantity == 0n) {
			return;
		}

		let inner = this.#assets.find(asset => mph.eq(asset[0]));

		if (inner === undefined) {
			this.#assets.push([mph, [[tokenName, quantity]]]);
		} else {
			let token = inner[1].find(pair => eq(pair[0], tokenName));

			if (token === undefined) {
				inner[1].push([tokenName, quantity]);
			} else {
				token[1] += quantity;
			}
		}

		this.removeZeroes();
	}

	/**
	 * @param {Assets} other 
	 * @param {(a: bigint, b: bigint) => bigint} op 
	 * @returns {Assets}
	 */
	applyBinOp(other, op) {
		let res = new Assets();

		for (let [mph, tokens] of this.#assets) {
			for (let [tokenName, quantity] of tokens) {
				res.addComponent(mph, tokenName, op(quantity, 0n));
			}
		}

		for (let [mph, tokens] of other.#assets) {
			for (let [tokenName, quantity] of tokens) {
				res.addComponent(mph, tokenName, op(0n, quantity));
			}
		}

		return res;
	}

	/**
	 * @param {Assets} other 
	 * @returns {Assets}
	 */
	add(other) {
		return this.applyBinOp(other, (a, b) => a + b);
	}

	/**
	 * @param {Assets} other 
	 * @returns {Assets}
	 */
	sub(other) {
		return this.applyBinOp(other, (a, b) => a - b);
	}

	/**
	 * Mutates 'this'
	 * Throws error if mph is already contained in 'this'
	 * @param {MintingPolicyHash} mph
	 * @param {[number[], bigint][]} tokens
	 */
	addTokens(mph, tokens) {
		for (let asset of this.#assets) {
			if (asset[0].eq(mph)) {
				throw new Error(`MultiAsset already contains ${bytesToHex(mph.bytes)}`);
			}
		}

		this.#assets.push([mph, tokens.slice()]);

		// sort immediately
		this.sort();
	}

	/**
	 * @param {MintingPolicyHash} mph
	 * @returns {number[][]}
	 */
	getTokenNames(mph) {
		for (let [otherMph, tokens] of this.#assets) {
			if (otherMph.eq(mph)) {
				return tokens.map(([tokenName, _]) => tokenName);
			}
		}

		return [];
	}

	/**
	 * @param {Assets} other 
	 * @returns {boolean}
	 */
	eq(other) {
		for (let asset of this.#assets) {
			for (let token of asset[1]) {
				if (token[1] != other.get(asset[0], token[0])) {
					return false;
				}
			}
		}

		for (let asset of other.#assets) {
			for (let token of asset[1]) {
				if (token[1] != this.get(asset[0], token[0])) {
					return false;
				}
			}
		}

		return true;
	}

	/**
	 * Strict gt, if other contains assets this one doesn't contain => return false
	 * @param {Assets} other 
	 * @returns {boolean}
	 */
	gt(other) {
		if (this.isZero()) {
			return false;
		}

		for (let asset of this.#assets) {
			for (let token of asset[1]) {
				if (token[1] <= other.get(asset[0], token[0])) {
					return false;
				}
			}
		}

		for (let asset of other.#assets) {
			for (let token of asset[1]) {
				if (!this.has(asset[0], token[0])) {
					return false;
				}
			}
		}

		return true;
	}

	/**
	 * @param {Assets} other 
	 * @returns {boolean}
	 */
	ge(other) {
		if (this.isZero()) {
			return other.isZero();
		}

		for (let asset of this.#assets) {
			for (let token of asset[1]) {
				if (token[1] < other.get(asset[0], token[0])) {
					return false;
				}
			}
		}

		for (let asset of other.#assets) {
			for (let token of asset[1]) {
				if (!this.has(asset[0], token[0])) {
					return false;
				}
			}
		}

		return true;
	}

	/**
	 * @returns {boolean}
	 */
	allPositive() {
		for (let asset of this.#assets) {
			for (let pair of asset[1]) {
				if (pair[1] < 0n) {
					return false;
				} else if (pair[1] == 0n) {
					throw new Error("unexpected");
				}
			}
		}

		return true;
	}

	/**
	 * Throws an error if any contained quantity <= 0n
	 */
	assertAllPositive() {
		assert(this.allPositive(), "non-positive token amounts detected");
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return CborData.encodeMap(
			this.#assets.map(
				outerPair => {
					return [outerPair[0].toCbor(), CborData.encodeMap(outerPair[1].map(
						innerPair => {
							return [
								CborData.encodeBytes(innerPair[0]), CborData.encodeInteger(innerPair[1])
							]
						}
					))]
				}
			)
		)
	}

	/**
	 * @param {number[]} bytes
	 * @returns {Assets}
	 */
	static fromCbor(bytes) {
		let ms = new Assets();

		CborData.decodeMap(bytes, (_, pairBytes) => {
			let mph = MintingPolicyHash.fromCbor(pairBytes);

			/**
			 * @type {[number[], bigint][]}
			 */
			let innerMap = [];
			
			CborData.decodeMap(pairBytes, (_, innerPairBytes) => {
				innerMap.push([
					CborData.decodeBytes(innerPairBytes),
					CborData.decodeInteger(innerPairBytes),
				]);
			});

			ms.#assets.push([mph, innerMap]);
		});

		return ms;
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		let obj = {};

		for (let [mph, tokens] of this.#assets) {
			let innerObj = {};

			for (let [tokenName, quantity] of tokens) {
				innerObj[bytesToHex(tokenName)] = quantity.toString();
			}

			obj[mph.dump()] = innerObj;
		}

		return obj;
	}

	/**
	 * Used when generating script contexts for running programs
	 * @returns {MapData}
	 */
	_toUplcData() {
		/** @type {[UplcData, UplcData][]} */
		let pairs = [];

		for (let asset of this.#assets) {
			/** @type {[UplcData, UplcData][]} */
			let innerPairs = [];

			for (let token of asset[1]) {
				innerPairs.push([
					new ByteArrayData(token[0]),
					new IntData(token[1]),
				]);
			}

			pairs.push([
				new ByteArrayData(asset[0].bytes),
				new MapData(innerPairs),
			])
		}

		return new MapData(pairs);
	}

	/**
	 * Makes sure minting policies are in correct order
	 * Mutates 'this'
	 * Order of tokens per mintingPolicyHash isn't changed
	 */
	sort() {
		this.#assets.sort((a, b) => {
			return Hash.compare(a[0], b[0]);
		});
	}

	assertSorted() {
		this.#assets.forEach((b, i) => {
			if (i > 0) {
				const a = this.#assets[i-1];

				assert(Hash.compare(a[0], b[0]) == -1, "assets not sorted")
			}
		})
	}
}

export class Value extends HeliosData {
	/** @type {bigint} */
	#lovelace;

	/** @type {Assets} */
	#assets;
	
	/**
	 * @param {bigint} lovelace 
	 * @param {Assets} assets 
	 */
	constructor(lovelace = 0n, assets = new Assets()) {
		super();
		this.#lovelace = lovelace;
		this.#assets = assets;
	}

	/**
	 * @param {MintingPolicyHash} mph 
	 * @param {number[]} tokenName 
	 * @param {bigint} quantity 
	 * @returns {Value}
	 */
	static asset(mph, tokenName, quantity) {
		return new Value(0n, new Assets([
			[mph, [
				[tokenName, quantity]
			]]
		]));
	}

	/**
	 * @type {bigint}
	 */
	get lovelace() {
		return this.#lovelace;
	}

	/**
	 * Setter for lovelace
	 * Note: mutation is handy when balancing transactions
	 * @param {bigint} lovelace
	 */
	setLovelace(lovelace) {
		this.#lovelace = lovelace;
	}

	/**
	 * @type {Assets}
	 */
	get assets() {
		return this.#assets;
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		if (this.#assets.isZero()) {
			return CborData.encodeInteger(this.#lovelace);
		} else {
			return CborData.encodeTuple([
				CborData.encodeInteger(this.#lovelace),
				this.#assets.toCbor()
			]);
		}
	}

	/**
	 * @param {number[]} bytes 
	 * @returns {Value}
	 */
	static fromCbor(bytes) {
		let mv = new Value();

		if (CborData.isTuple(bytes)) {
			CborData.decodeTuple(bytes, (i, fieldBytes) => {
				switch(i) {
					case 0:
						mv.#lovelace = CborData.decodeInteger(fieldBytes);
						break;
					case 1:
						mv.#assets = Assets.fromCbor(fieldBytes);
						break;
					default:
						throw new Error("unrecognized field");
				}
			});
		} else {
			mv.#lovelace = CborData.decodeInteger(bytes);
		}

		return mv;
	}

	/**
	 * @param {Value[]} values 
	 * @returns {Value}
	 */
	static sum(values) {
		let s = new Value(0n);

		values.forEach(v => {
			s = s.add(v);
		});

		return s;
	}
	
	/**
	 * @param {Value} other 
	 * @returns {Value}
	 */
	add(other) {
		return new Value(this.#lovelace + other.#lovelace, this.#assets.add(other.#assets));
	}

	/**
	 * @param {Value} other 
	 * @returns {Value}
	 */
	sub(other) {
		return new Value(this.#lovelace - other.#lovelace, this.#assets.sub(other.#assets));
	}

	/**
	 * @param {Value} other 
	 * @returns {boolean}
	 */
	eq(other) {
		return (this.#lovelace == other.#lovelace) && (this.#assets.eq(other.#assets));
	}

	/**
	 * Strictly greater than. Returns false if any asset is missing 
	 * @param {Value} other 
	 * @returns {boolean}
	 */
	gt(other) {
		return (this.#lovelace > other.#lovelace) && (this.#assets.gt(other.#assets));
	}

	/**
	 * Strictly >= 
	 * @param {Value} other 
	 * @returns {boolean}
	 */
	ge(other) {
		return (this.#lovelace >= other.#lovelace) && (this.#assets.ge(other.#assets));
	}

	/**
	 * Throws an error if any contained quantity is negative
	 * Used when building transactions because transactions can't contain negative values
	 * @returns {Value} - returns this
	 */
	assertAllPositive() {
		assert(this.#lovelace >= 0n);

		this.#assets.assertAllPositive();

		return this;
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		return {
			lovelace: this.#lovelace.toString(),
			assets: this.#assets.dump()
		};
	}

	/**
	 * Used when building script context
	 * @param {boolean} isInScriptContext
	 * @returns {MapData}
	 */
	_toUplcData(isInScriptContext = false) {
		let map = this.#assets._toUplcData();

		if (this.#lovelace != 0n || isInScriptContext) {
			let inner = map.map; 

			inner.unshift([
				new ByteArrayData([]),
				new MapData([
					[new ByteArrayData([]), new IntData(this.#lovelace)]
				]),
			]);

			// 'inner' is copy, so mutating won't change the original
			map = new MapData(inner);
		}

		return map;
	}

	/**
	 * Useful when deserializing inline datums
	 * @param {UplcData} data
	 * @returns {Value}
	 */
	static fromUplcData(data) {
		let sum = new Value();

		let outerMap = data.map;

		for (let [mphData, tokensData] of outerMap) {
			let mphBytes = mphData.bytes;

			let innerMap = tokensData.map;

			if (mphBytes.length == 0) {
				//lovelace
				assert(innerMap.length == 1 && innerMap[0][0].bytes.length == 0); 
				sum = sum.add(new Value(innerMap[0][1].int));
			} else {
				// other assets
				let mph = new MintingPolicyHash(mphBytes);

				for (let [tokenNameData, quantityData] of innerMap) {
					let tokenName = tokenNameData.bytes;
					let quantity = quantityData.int;

					sum = sum.add(Value.asset(mph, tokenName, quantity));
				}
			}
		}

		return sum;
	}

	/**
	 * @param {string | number[]} bytes 
	 * @returns {Value}
	 */
	static fromUplcCbor(bytes) {
		return Value.fromUplcData(UplcData.fromCbor(bytes));
	}
}


//////////////////////////////
// Section 8: Uplc cost-models
//////////////////////////////

/**
 * @typedef {Object} Cost
 * @property {bigint} mem
 * @property {bigint} cpu
 */

/**
 * NetworkParams contains all protocol parameters. These are needed to do correct, up-to-date, cost calculations.
 */
export class NetworkParams {
	#raw;

	/**
	 * @param {Object} raw 
	 */
	constructor(raw) {
		this.#raw = raw;
	}
	
    /**
     * @package
     * @type {Object}
     */
	get costModel() {
		return assertDefined(this.#raw?.latestParams?.costModels?.PlutusScriptV2, "'obj.latestParams.costModels.PlutusScriptV2' undefined");
	}

	/**
     * @package
	 * @param {string} key 
	 * @returns {number}
	 */
	getCostModelParameter(key) {
		return assertNumber(this.costModel[key], `'obj.${key}' undefined`);
	}

	/**
     * @package
	 * @param {string} name 
	 * @returns {Cost}
	 */
	getTermCost(name) {
		let memKey = `cek${name}Cost-exBudgetMemory`;
		let cpuKey = `cek${name}Cost-exBudgetCPU`;

		return {
			mem: BigInt(assertNumber(this.costModel[memKey], `'obj.${memKey}' undefined`)),
			cpu: BigInt(assertNumber(this.costModel[cpuKey], `'obj.${cpuKey}' undefined`)),
		};
	}

	/**
     * @package
	 * @type {Cost}
	 */
	get plutusCoreStartupCost() {
		return this.getTermCost("Startup");
	}

	/**
     * @package
	 * @type {Cost}
	 */
	get plutusCoreVariableCost() {
		return this.getTermCost("Var");
	}

	/**
     * @package
	 * @type {Cost}
	 */
	get plutusCoreLambdaCost() {
		return this.getTermCost("Lam");
	}

	/**
     * @package
	 * @type {Cost}
	 */
	get plutusCoreDelayCost() {
		return this.getTermCost("Delay");
	}

	/**
     * @package
	 * @type {Cost}
	 */
	get plutusCoreCallCost() {
		return this.getTermCost("Apply");
	}

	/**
     * @package
	 * @type {Cost}
	 */
	get plutusCoreConstCost() {
		return this.getTermCost("Const");
	}

	/**
     * @package
	 * @type {Cost}
	 */
	get plutusCoreForceCost() {
		return this.getTermCost("Force");
	}

	/**
     * @package
	 * @type {Cost}
	 */
	get plutusCoreBuiltinCost() {
		return this.getTermCost("Builtin");
	}

	/**
     * @package
	 * @type {[number, number]} - a + b*size
	 */
	get txFeeParams() {
		return [
			assertNumber(this.#raw?.latestParams?.txFeeFixed),
			assertNumber(this.#raw?.latestParams?.txFeePerByte),
		];
	}

	/**
     * @package
	 * @type {[number, number]} - [memFee, cpuFee]
	 */
	get exFeeParams() {
		return [
			assertNumber(this.#raw?.latestParams?.executionUnitPrices?.priceMemory),
			assertNumber(this.#raw?.latestParams?.executionUnitPrices?.priceSteps),
		];
	}
	
	/**
     * @package
	 * @type {number[]}
	 */
	get sortedCostParams() {
		let baseObj = this.#raw?.latestParams?.costModels?.PlutusScriptV2;
		let keys = Object.keys(baseObj);

		keys.sort();

		return keys.map(key => assertNumber(baseObj[key]));
	}

	/**
     * @package
	 * @type {number}
	 */
	get lovelacePerUTXOByte() {
		return assertNumber(this.#raw?.latestParams?.utxoCostPerByte);
	}

	/**
     * @package
	 * @type {number}
	 */
	get minCollateralPct() {
		return assertNumber(this.#raw?.latestParams?.collateralPercentage);
	}

	/**
     * @package
	 * @type {number}
	 */
	get maxCollateralInputs() {
		return assertNumber(this.#raw?.latestParams?.maxCollateralInputs);
	}

	/**
     * @package
	 * @type {[number, number]} - [mem, cpu]
	 */
	get maxTxExecutionBudget() {
		return [
			assertNumber(this.#raw?.latestParams?.maxTxExecutionUnits?.memory),
			assertNumber(this.#raw?.latestParams?.maxTxExecutionUnits?.steps),
		];
	}

	/**
     * @package
	 * @type {number}
	 */
	get maxTxSize() {
		return assertNumber(this.#raw?.latestParams?.maxTxSize);
	}

	/**
	 * @package
	 * @type {bigint}
	 */
	get maxTxFee() {
		const [a, b] = this.txFeeParams;
		const [feePerMem, feePerCpu] = this.exFeeParams;
		const [maxMem, maxCpu] = this.maxTxExecutionBudget;

		return BigInt(a) + BigInt(Math.ceil(b*this.maxTxSize)) + BigInt(Math.ceil(feePerMem*maxMem)) + BigInt(Math.ceil(feePerCpu*maxCpu));
	}

	/**
	 * Use the latest slot in networkParameters to determine time.
     * @package
	 * @param {bigint} slot
	 * @returns {bigint}
	 */
	slotToTime(slot) {
		let secondsPerSlot = assertNumber(this.#raw?.shelleyGenesis?.slotLength);

		let lastSlot = BigInt(assertNumber(this.#raw?.latestTip?.slot));
		let lastTime = BigInt(assertNumber(this.#raw?.latestTip?.time));

		let slotDiff = slot - lastSlot;

		return lastTime + slotDiff*BigInt(secondsPerSlot*1000);
	}

	/**
	 * Use the latest slot in network parameters to determine slot.
     * @package
	 * @param {bigint} time - milliseconds since 1970
	 * @returns {bigint}
	 */
	timeToSlot(time) {
		let secondsPerSlot = assertNumber(this.#raw?.shelleyGenesis?.slotLength);

		let lastSlot = BigInt(assertNumber(this.#raw?.latestTip?.slot));
		let lastTime = BigInt(assertNumber(this.#raw?.latestTip?.time));

		let timeDiff = time - lastTime;

		return lastSlot + BigInt(Math.round(Number(timeDiff)/(1000*secondsPerSlot)));
	}
}

/**
 * Each builtin has an associated CostModel.
 * The CostModel calculates the execution cost of a builtin, depending on the byte-size of the inputs.
 * @package
 */
class CostModel {
	constructor() {
	}

	/**
	 * @param {NetworkParams} params
	 * @param {string} baseName
	 * @returns {CostModel}
	 */
	static fromParams(params, baseName) {
		throw new Error("not yet implemented");
	}

	/**
	 * @param {number[]} args 
	 * @returns {bigint}
	 */
	calc(args) {
		throw new Error("not yet implemented");
	}

	/**
	 * @returns {string}
	 */
	dump() {
		throw new Error("not yet implemented");
	}
}

/**
 * A simple constant cost, independent of arg size.
 * @package
 */
class ConstCost extends CostModel {
	#constant;

	/**
	 * @param {bigint} constant
	 */
	constructor(constant) {
		super();
		this.#constant = constant;
	}

	/**
	 * @param {NetworkParams} params 
	 * @param {string} baseName - eg. addInteger-cpu-arguments
	 * @returns {ConstCost}
	 */
	static fromParams(params, baseName) {
		let a = params.getCostModelParameter(`${baseName}`);

		return new ConstCost(BigInt(a));
	}

	/**
	 * @param {number[]} args
	 * @returns {bigint}
	 */
	calc(args) {
		return this.#constant;
	}

	/**
	 * @returns {string}
	 */
	dump() {
		return `const: ${this.#constant.toString()}`;
	}
}

/**
 * cost = a + b*size(arg)
 * @package
 */
class LinearCost extends CostModel {
	#a;
	#b;

	/**
	 * a + b*SizeFn(x, y)
	 * @param {bigint} a - intercept
	 * @param {bigint} b - slope
	 */
	constructor(a, b) {
		super();
		this.#a = a;
		this.#b = b;
	}

	/**
	 * @param {NetworkParams} params 
	 * @param {string} baseName - eg. addInteger-cpu-arguments
	 * @returns {[bigint, bigint]}
	 */
	static getParams(params, baseName) {
		let a = params.getCostModelParameter(`${baseName}-intercept`);
		let b = params.getCostModelParameter(`${baseName}-slope`);

		return [BigInt(a), BigInt(b)];
	}

	/**
	 * @param  {number} size
	 * @returns {bigint}
	 */
	calcInternal(size) {
		return this.#a + this.#b*BigInt(size);
	}

	/**
	 * @returns {string}
	 */
	dump() {
		return `intercept: ${this.#a.toString()}, slope: ${this.#b.toString()}`;
	}
}

/**
 * cost = a + b*size(args[i])
 * @package
 */
class ArgSizeCost extends LinearCost {
	#i;

	/**
	 * @param {bigint} a - intercept
	 * @param {bigint} b - slope
	 * @param {number} i - index of the arg
	 */
	constructor(a, b, i) {
		super(a, b);
		this.#i = i;
	}

	/**
	 * @param {number[]} args
	 * @returns {bigint}
	 */
	calc(args) {
		assert(this.#i < args.length && this.#i >= 0);

		return this.calcInternal(args[this.#i]);
	}
}

/**
 * cost = a + b*size(arg0)
 * @package
 */
class Arg0SizeCost extends ArgSizeCost {
	/**
	 * @param {bigint} a 
	 * @param {bigint} b 
	 */
	constructor(a, b) {
		super(a, b, 0);
	}

	/**
	 * @param {NetworkParams} params 
	 * @param {string} baseName - eg. addInteger-cpu-arguments
	 * @returns {Arg0SizeCost}
	 */
	static fromParams(params, baseName) {
		let [a, b] = LinearCost.getParams(params, baseName);

		return new Arg0SizeCost(a, b);
	}
}

/**
 * cost = a + b*size(arg1)
 * @package
 */
class Arg1SizeCost extends ArgSizeCost {
	/**
	 * @param {bigint} a 
	 * @param {bigint} b 
	 */
	constructor(a, b) {
		super(a, b, 1);
	}

	/**
	 * @param {NetworkParams} params 
	 * @param {string} baseName - eg. addInteger-cpu-arguments
	 * @returns {Arg1SizeCost}
	 */
	static fromParams(params, baseName) {
		let [a, b] = LinearCost.getParams(params, baseName);

		return new Arg1SizeCost(a, b);
	}
}

/**
 * cost = a + b*size(arg2)
 * @package
 */
class Arg2SizeCost extends ArgSizeCost {
	/**
	 * @param {bigint} a 
	 * @param {bigint} b 
	 */
	constructor(a, b) {
		super(a, b, 2);
	}

	/**
	 * @param {NetworkParams} params 
	 * @param {string} baseName - eg. addInteger-cpu-arguments
	 * @returns {Arg2SizeCost}
	 */
	static fromParams(params, baseName) {
		let [a, b] = LinearCost.getParams(params, baseName);

		return new Arg2SizeCost(a, b);
	}
}

/**
 * cost = a + b*min(args)
 * @package
 */
class MinArgSizeCost extends LinearCost {
	/**
	 * @param {bigint} a - intercept
	 * @param {bigint} b - slope
	 */
	constructor(a, b) {
		super(a, b);
	}
	/**
	 * @param {NetworkParams} params 
	 * @param {string} baseName - eg. addInteger-cpu-arguments
	 * @returns {MaxArgSizeCost}
	 */
	static fromParams(params, baseName) {
		let [a, b] = LinearCost.getParams(params, baseName);

		return new MinArgSizeCost(a, b);
	}

	/**
	 * @param  {number[]} args
	 * @returns {bigint}
	 */
	calc(args) {
		return this.calcInternal(Math.min(...args));
	}
}

/**
 * cost = a + b*max(args)
 * @package
 */
class MaxArgSizeCost extends LinearCost {
	/**
	 * @param {bigint} a - intercept
	 * @param {bigint} b - slope
	 */
	constructor(a, b) {
		super(a, b);
	}

	/**
	 * @param {NetworkParams} params 
	 * @param {string} baseName - eg. addInteger-cpu-arguments
	 * @returns {MaxArgSizeCost}
	 */
	static fromParams(params, baseName) {
		let [a, b] = LinearCost.getParams(params, baseName);

		return new MaxArgSizeCost(a, b);
	}

	/**
	 * @param  {number[]} args
	 * @returns {bigint}
	 */
	calc(args) {
		return this.calcInternal(Math.max(...args));
	}
}

/**
 * cost = a + b*sum(sizes(args))
 * @package
 */
class SumArgSizesCost extends LinearCost {
	/**
	 * @param {bigint} a - intercept
	 * @param {bigint} b - slope
	 */
	constructor(a, b) {
		super(a, b);
	}

	/**
	 * @param {NetworkParams} params 
	 * @param {string} baseName - eg. addInteger-cpu-arguments
	 * @returns {MaxArgSizeCost}
	 */
	static fromParams(params, baseName) {
		let [a, b] = LinearCost.getParams(params, baseName);

		return new SumArgSizesCost(a, b);
	}

	/**
	 * @param  {number[]} args
	 * @returns {bigint}
	 */
	calc(args) {
		let sum = 0;

		for (let arg of args) {
			sum += arg;
		}

		return this.calcInternal(sum);
	}
}

/**
 * cost = a + b*max(size(arg0)-size(arg1), min)
 * (only for Uplc functions with two arguments) 
 * @package
 */
class ArgSizeDiffCost extends LinearCost {
	#min;

	/**
	 * @param {bigint} a - intercept
	 * @param {bigint} b - slope
	 * @param {number} min
	 */
	constructor(a, b, min) {
		super(a, b);
		this.#min = min
	}
	/**
	 * @param {NetworkParams} params 
	 * @param {string} baseName - eg. addInteger-cpu-arguments
	 * @returns {ArgSizeDiffCost}
	 */
	static fromParams(params, baseName) {
		let [a, b] = LinearCost.getParams(params, baseName);
		let min = params.getCostModelParameter(`${baseName}-minimum`);

		return new ArgSizeDiffCost(a, b, min);
	}

	/**
	 * @param {number[]} args
	 * @returns {bigint}
	 */
	calc(args) {
		assert(args.length == 2);
		let [x, y] = args;

		return this.calcInternal(Math.max(x - y, this.#min));
	}

	/**
	 * @returns {string}
	 */
	dump() {
		return super.dump() + `, minimum: ${this.#min.toString()}`;
	}
}

/**
 * cost = (size(arg0) > size(arg1)) ? constant : a + b*size(arg0)*size(arg1)
 * (only for Uplc functions with two arguments)
 * @package
 */
class ArgSizeProdCost extends LinearCost {
	#constant;

	/**
	 * @param {bigint} a - intercept
	 * @param {bigint} b - slope
	 * @param {bigint} constant
	 */
	constructor(a, b, constant) {
		super(a, b);
		this.#constant = constant;
	}

	/**
	 * @param {NetworkParams} params 
	 * @param {string} baseName - eg. addInteger-cpu-arguments
	 * @returns {MaxArgSizeCost}
	 */
	static fromParams(params, baseName) {
		const [a, b] = LinearCost.getParams(params, `${baseName}-model-arguments`);
		const constant = params.getCostModelParameter(`${baseName}-constant`);

		return new ArgSizeProdCost(a, b, BigInt(constant));
	}

	/**
	 * @param {number[]} args
	 * @returns {bigint}
	 */
	calc(args) {
		assert(args.length == 2);
		
		const [x, y] = args;

		if (x > y) {
			return this.#constant;
		} else {
			return this.calcInternal(x*y);
		}
	}

	/**
	 * @returns {string}
	 */
	dump() {
		return super.dump() + `, constant: ${this.#constant.toString()}`;
	}
}

/**
 * cost = (size(arg0) != size(arg1)) ? constant : a + b*size(arg0)
 * (only for Uplc functions with two arguments)
 * @package
 */
class ArgSizeDiagCost extends LinearCost {
	#constant;

	/**
	 * @param {bigint} a
	 * @param {bigint} b
	 * @param {bigint} constant
	 */
	constructor(a, b, constant) {
		super(a, b);
		this.#constant = constant;
	}
	/**
	 * @param {NetworkParams} params 
	 * @param {string} baseName - eg. addInteger-cpu-arguments
	 * @returns {ArgSizeDiagCost}
	 */
	static fromParams(params, baseName) {
		const [a, b] = LinearCost.getParams(params, baseName);
		const constant = params.getCostModelParameter(`${baseName}-constant`);

		return new ArgSizeDiagCost(a, b, BigInt(constant));
	}

	/**
	 * @param {number[]} args 
	 * @returns {bigint}
	 */
	calc(args) {
		assert(args.length == 2);

		if (args[0] == args[1]) {
			return this.calcInternal(args[0]);
		} else {
			return this.#constant;
		}
	}

	/**
	 * @returns {string}
	 */
	dump() {
		return super.dump() + `, constant: ${this.#constant.toString()}`;
	}
}

/**
 * @typedef CostModelClass
 * @property {(params: NetworkParams, baseName: string) => CostModel} fromParams
 */


/////////////////////////////////////
// Section 9: Uplc built-in functions
/////////////////////////////////////

/**
 * Cost-model configuration of UplcBuiltin.
 * Also specifies the number of times a builtin must be 'forced' before being callable.
 * @package
 */
 class UplcBuiltinConfig {
	#name;
	#forceCount;
	#memCostModelClass;
	#cpuCostModelClass;

	/**
	 * @param {string} name 
	 * @param {number} forceCount - number of type parameters of a Plutus-core builtin function (0, 1 or 2)
	 * @param {CostModelClass} memCostModelClass 
	 * @param {CostModelClass} cpuCostModelClass 
	 */
	constructor(name, forceCount, memCostModelClass, cpuCostModelClass) {
		this.#name = name;
		this.#forceCount = forceCount;
		this.#memCostModelClass = memCostModelClass;
		this.#cpuCostModelClass = cpuCostModelClass;
	}

	get name() {
		return this.#name;
	}

	get forceCount() {
		return this.#forceCount;
	}

	/**
	 * @param {NetworkParams} params
	 * @returns {[CostModel, CostModel]}
	 */
	instantiateCostModels(params) {
		if (this.#memCostModelClass !== null && this.#cpuCostModelClass !== null) {
			let memCostModel = this.#memCostModelClass.fromParams(params, `${this.#name}-memory-arguments`);
			let cpuCostModel = this.#cpuCostModelClass.fromParams(params, `${this.#name}-cpu-arguments`);

			return [memCostModel, cpuCostModel];
		} else {
			throw new Error(`cost model not yet implemented for builtin ${this.#name}`);
		}
	}

	/**
	 * @param {NetworkParams} params
	 * @param {number[]} argSizes
	 * @returns {Cost}
	 */
	calcCost(params, argSizes) {
		// Note: instantiating everytime might be slow. Should this be cached (eg. in the params object?)?
		const [memCostModel, cpuCostModel] = this.instantiateCostModels(params);

		const memCost = memCostModel.calc(argSizes);
		const cpuCost = cpuCostModel.calc(argSizes);

		return {mem: memCost, cpu: cpuCost};
	}

	/**
	 * @param {NetworkParams} params
	 */
	dumpCostModel(params) {
		const [memCostModel, cpuCostModel] = this.instantiateCostModels(params);

		console.log(`${this.name}-memory-arguments={${memCostModel.dump()},\n${this.name}-cpu-arguments={${cpuCostModel.dump()}}`);
	}
}

/** 
 * A list of all PlutusScript builins, with associated costmodels (actual costmodel parameters are loaded from NetworkParams during runtime)
 * @package
 * @type {UplcBuiltinConfig[]} 
 */
const UPLC_BUILTINS = (
	/**
	 * @returns {UplcBuiltinConfig[]}
	 */
	function () {
		/**
		 * Constructs a builtinInfo object
		 * @param {string} name 
		 * @param {number} forceCount 
		 * @param {CostModelClass} memCostModel
		 * @param {CostModelClass} cpuCostModel
		 * @returns {UplcBuiltinConfig}
		 */
		function builtinConfig(name, forceCount, memCostModel, cpuCostModel) {
			// builtins might need be wrapped in `force` a number of times if they are not fully typed
			return new UplcBuiltinConfig(name, forceCount, memCostModel, cpuCostModel);
		}

		return [
			builtinConfig("addInteger",               0, MaxArgSizeCost, MaxArgSizeCost), // 0
			builtinConfig("subtractInteger",          0, MaxArgSizeCost, MaxArgSizeCost),
			builtinConfig("multiplyInteger",          0, SumArgSizesCost, SumArgSizesCost),
			builtinConfig("divideInteger",            0, ArgSizeDiffCost, ArgSizeProdCost),
			builtinConfig("quotientInteger",          0, ArgSizeDiffCost, ArgSizeProdCost), 
			builtinConfig("remainderInteger",         0, ArgSizeDiffCost, ArgSizeProdCost),
			builtinConfig("modInteger",               0, ArgSizeDiffCost, ArgSizeProdCost),
			builtinConfig("equalsInteger",            0, ConstCost, MinArgSizeCost),
			builtinConfig("lessThanInteger",          0, ConstCost, MinArgSizeCost),
			builtinConfig("lessThanEqualsInteger",    0, ConstCost, MinArgSizeCost),
			builtinConfig("appendByteString",         0, SumArgSizesCost, SumArgSizesCost), // 10
			builtinConfig("consByteString",           0, SumArgSizesCost, Arg1SizeCost),
			builtinConfig("sliceByteString",          0, Arg2SizeCost, Arg2SizeCost),
			builtinConfig("lengthOfByteString",       0, ConstCost, ConstCost),
			builtinConfig("indexByteString",          0, ConstCost, ConstCost),
			builtinConfig("equalsByteString",         0, ConstCost, ArgSizeDiagCost),
			builtinConfig("lessThanByteString",       0, ConstCost, MinArgSizeCost),
			builtinConfig("lessThanEqualsByteString", 0, ConstCost, MinArgSizeCost),
			builtinConfig("sha2_256",                 0, ConstCost, Arg0SizeCost),
			builtinConfig("sha3_256",                 0, ConstCost, Arg0SizeCost),
			builtinConfig("blake2b_256",              0, ConstCost, Arg0SizeCost), // 20
			builtinConfig("verifyEd25519Signature",   0, ConstCost, Arg2SizeCost),
			builtinConfig("appendString",             0, SumArgSizesCost, SumArgSizesCost),
			builtinConfig("equalsString",             0, ConstCost, ArgSizeDiagCost),
			builtinConfig("encodeUtf8",               0, Arg0SizeCost, Arg0SizeCost),
			builtinConfig("decodeUtf8",               0, Arg0SizeCost, Arg0SizeCost),
			builtinConfig("ifThenElse",               1, ConstCost, ConstCost),
			builtinConfig("chooseUnit",               1, ConstCost, ConstCost),
			builtinConfig("trace",                    1, ConstCost, ConstCost),
			builtinConfig("fstPair",                  2, ConstCost, ConstCost),
			builtinConfig("sndPair",                  2, ConstCost, ConstCost), // 30
			builtinConfig("chooseList",               2, ConstCost, ConstCost),
			builtinConfig("mkCons",                   1, ConstCost, ConstCost),
			builtinConfig("headList",                 1, ConstCost, ConstCost),
			builtinConfig("tailList",                 1, ConstCost, ConstCost),
			builtinConfig("nullList",                 1, ConstCost, ConstCost),
			builtinConfig("chooseData",               1, ConstCost, ConstCost),
			builtinConfig("constrData",               0, ConstCost, ConstCost),
			builtinConfig("mapData",                  0, ConstCost, ConstCost),
			builtinConfig("listData",                 0, ConstCost, ConstCost),
			builtinConfig("iData",                    0, ConstCost, ConstCost), // 40
			builtinConfig("bData",                    0, ConstCost, ConstCost),
			builtinConfig("unConstrData",             0, ConstCost, ConstCost),
			builtinConfig("unMapData",                0, ConstCost, ConstCost),
			builtinConfig("unListData",               0, ConstCost, ConstCost),
			builtinConfig("unIData",                  0, ConstCost, ConstCost),
			builtinConfig("unBData",                  0, ConstCost, ConstCost),
			builtinConfig("equalsData",               0, ConstCost, MinArgSizeCost),
			builtinConfig("mkPairData",               0, ConstCost, ConstCost),
			builtinConfig("mkNilData",                0, ConstCost, ConstCost),
			builtinConfig("mkNilPairData",            0, ConstCost, ConstCost), // 50
			builtinConfig("serialiseData",            0, Arg0SizeCost, Arg0SizeCost),
			builtinConfig("verifyEcdsaSecp256k1Signature",   0, ConstCost, ConstCost), // these parameters are from aiken, but the cardano-cli parameter file differ?
			builtinConfig("verifySchnorrSecp256k1Signature", 0, ConstCost, Arg1SizeCost), // these parameters are from, but the cardano-cli parameter file differs?
		];
	}
)();

/**
 * Use this function to check cost-model parameters
 * @package
 * @param {NetworkParams} networkParams
 */
function dumpCostModels(networkParams) {
	for (let builtin of UPLC_BUILTINS) {
		builtin.dumpCostModel(networkParams);
	}
}

/**
 * Returns index of a named builtin
 * Throws an error if builtin doesn't exist
 * @param {string} name 
 * @returns 
 */
export function findUplcBuiltin(name) {
	let i = UPLC_BUILTINS.findIndex(info => { return "__core__" + info.name == name });
	assert(i != -1, `${name} is not a real builtin`);
	return i;
}

/**
 * Checks if a named builtin exists
 * @param {string} name 
 * @param {boolean} strict - if true then throws an error if builtin doesn't exist
 * @returns {boolean}
 */
export function isUplcBuiltin(name, strict = false) {
	if (name.startsWith("__core")) {
		if (strict) {
			void this.findBuiltin(name); // assert that builtin exists
		}
		return true;
	} else {
		return false;
	}
}


///////////////////////
// Section 10: Uplc AST
///////////////////////


/**
 * A Helios/Uplc Program can have different purposes
 * @package
 */
const ScriptPurpose = {
	Testing: -1,
	Minting:  0,
	Spending: 1,
	Staking:  2,
	Module:   3
};

/**
 * @package
 * @param {number} id
 * @returns {string}
 */
function getPurposeName(id) {
	switch (id) {
		case ScriptPurpose.Testing:
			return "testing";
		case ScriptPurpose.Minting:
			return "minting";
		case ScriptPurpose.Spending:
			return "spending";
		case ScriptPurpose.Staking:
			return "staking";
		case ScriptPurpose.Module:
			return "module";
		default:
			throw new Error(`unhandled ScriptPurpose ${id}`);
	}
}


/** 
 * a UplcValue is passed around by Plutus-core expressions.
 */
export class UplcValue {
	#site;

	/**
	 * @param {Site} site 
	 */
	constructor(site) {
		assert(site != undefined && (site instanceof Site));
		this.#site = site;
	}

	/**
	 * Return a copy of the UplcValue at a different Site.
     * @package
	 * @param {Site} newSite 
	 * @returns {UplcValue}
	 */
	copy(newSite) {
		throw new Error("not implemented");
	}

    /**
     * @package
     * @type {Site}
     */
	get site() {
		return this.#site;
	}

	/**
	 * @package
	 * @type {number}
	 */
	get length() {
		throw new Error("not a list nor a map");
	}

	/**
	 * Size in words (8 bytes, 64 bits) occupied in target node
     * @package
	 * @type {number}
	 */
	get memSize() {
		throw new Error("not yet implemented");
	}

	/**
	 * Throws an error because most values can't be called (overridden by UplcAnon)
     * @package
	 * @param {UplcRte | UplcStack} rte 
	 * @param {Site} site 
	 * @param {UplcValue} value
	 * @returns {Promise<UplcValue>}
	 */
	async call(rte, site, value) {
		throw site.typeError(`expected a Plutus-core function, got '${this.toString()}'`);
	}

	/**
     * @package
	 * @param {UplcRte | UplcStack} rte 
	 * @returns {Promise<UplcValue>}
	 */
	async eval(rte) {
		return this;
	}

	/**
	 * @type {bigint}
	 */
	get int() {
		throw this.site.typeError(`expected a Plutus-core int, got '${this.toString()}'`);
	}

	/**
	 * @type {number[]}
	 */
	get bytes() {
		throw this.site.typeError(`expected a Plutus-core bytearray, got '${this.toString()}'`);
	}

	/**
	 * @type {string}
	 */
	get string() {
		throw this.site.typeError(`expected a Plutus-core string, got '${this.toString()}'`);
	}
	
	/**
	 * @type {boolean}
	 */
	get bool() {
		throw this.site.typeError(`expected a Plutus-core bool, got '${this.toString()}'`);
	}

	/**
	 * Distinguishes a pair from a mapItem
	 * @returns {boolean}
	 */
	isPair() {
		return false;
	}

	/**
	 * @type {UplcValue}
	 */
	get first() {
		throw this.site.typeError(`expected a Plutus-core pair, got '${this.toString()}'`);
	}

	/**
	 * @type {UplcValue}
	 */
	get second() {
		throw this.site.typeError(`expected a Plutus-core pair, got '${this.toString()}'`);
	}

	/**
	 * Distinguishes a list from a map
	 * @returns {boolean}
	 */
	isList() {
		return false;
	}

	/**
	 * @type {UplcType}
	 */
	get itemType() {
		throw this.site.typeError("not a list");
	}

	/**
	 * @type {UplcValue[]}
	 */
	get list() {
		throw this.site.typeError(`expected a Plutus-core list, got '${this.toString()}'`);
	}

    /**
     * @returns {boolean}
     */
	isData() {
		return false;
	}

	/**
	 * @type {UplcData}
	 */
	get data() {
		throw this.site.typeError(`expected Plutus-core data, got '${this.toString()}'`);
	}

	/**
     * @package
	 * @returns {Promise<UplcValue>}
	 */
	force() {
		throw this.site.typeError(`expected delayed value, got '${this.toString()}'`);
	}

	/**
     * @package
	 * @returns {UplcUnit}
	 */
	assertUnit() {
		throw this.site.typeError(`expected Plutus-core unit, got '${this.toString}'`);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		throw new Error("not yet implemented");
	}

	/**
     * @package
	 * @returns {string}
	 */
	typeBits() {
		throw new Error("not yet implemented");
	}

	/**
	 * Encodes value without type header
     * @package
	 * @param {BitWriter} bitWriter
	 */
	toFlatValueInternal(bitWriter) {
		throw new Error("not yet implemented");
	}

	/**
	 * Encodes value with plutus flat encoding.
	 * Member function not named 'toFlat' as not to confuse with 'toFlat' member of terms.
     * @package
	 * @param {BitWriter} bitWriter
	 */
	toFlatValue(bitWriter) {
		bitWriter.write('1' + this.typeBits() + '0');
		
		this.toFlatValueInternal(bitWriter);
	}
}

export class UplcType {
	#typeBits;

	/**
	 * @param {string} typeBits 
	 */
	constructor(typeBits) {
		this.#typeBits = typeBits;
	}

	/**
	 * @returns {string}
	 */
	typeBits() {
		return this.#typeBits;
	}

	/**
	 * @param {UplcValue} value 
	 * @returns {boolean}
	 */
	isSameType(value) {
		return this.#typeBits == value.typeBits();
	}

	/**
	 * @returns {UplcType}
	 */
	static newDataType() {
		return new UplcType("1000");
	}

	/**
	 * @returns {UplcType}
	 */
	static newDataPairType() {
		return new UplcType(["0111", "0111", "0110", "1000", "1000"].join("1"));
	}

	/**
	 * @param {number[]} lst
	 * @returns {UplcType}
	 */
	static fromNumbers(lst) {
		return new UplcType(lst.map(x => byteToBitString(x, 4, false)).join("1"));
	}
}

/**
 * @package
 * @typedef {[?string, UplcValue][]} UplcRawStack
 */

/**
* @typedef {object} UplcRTECallbacks
* @property {(msg: string) => Promise<void>} [onPrint]
* @property {(site: Site, rawStack: UplcRawStack) => Promise<boolean>} [onStartCall]
* @property {(site: Site, rawStack: UplcRawStack) => Promise<void>} [onEndCall]
* @property {(name: string, isTerm: boolean, cost: Cost) => void} [onIncrCost]
*/

/**
 * @type {UplcRTECallbacks}
 */
export const DEFAULT_UPLC_RTE_CALLBACKS = {
	onPrint: async function (/** @type {string} */ msg) {return},
	onStartCall: async function(/** @type {Site} */ site, /** @type {UplcRawStack} */ rawStack) {return false},
	onEndCall: async function(/** @type {Site} */ site, /** @type {UplcRawStack} */ rawStack) {return},
	onIncrCost: function(/** @type {string} */ name, /** @type {boolean} */ isTerm, /** @type {Cost} */ cost) {return},
}

/**
 * Plutus-core Runtime Environment is used for controlling the programming evaluation (eg. by a debugger)
 * @package
 */
class UplcRte {
	#callbacks;

	#networkParams;

	/**
	 * this.onNotifyCalls is set to 'false' when the debugger is in step over-mode.
	 * @type {boolean}
	 */
	#notifyCalls;

	/**
	 * this.onNotifyCalls is set back to true if the endCall is called with the same rawStack as the marker.
	 * @type {?UplcRawStack}
	 */
	#marker;

	/**
	 * @typedef {[?string, UplcValue][]} UplcRawStack
	 */

	/**
	 * @param {UplcRTECallbacks} callbacks 
	 * @param {?NetworkParams} networkParams
	 */
	constructor(callbacks = DEFAULT_UPLC_RTE_CALLBACKS, networkParams = null) {
		assertDefined(callbacks);
		this.#callbacks = callbacks;
		this.#networkParams = networkParams;
		this.#notifyCalls = true;
		this.#marker = null;
	}

	/**
	 * @param {string} name - for breakdown
	 * @param {boolean} isTerm
	 * @param {Cost} cost 
	 */
	incrCost(name, isTerm, cost) {
		if (cost.mem <= 0n || cost.cpu <= 0n) {
			throw new Error("cost not increasing");
		}

		if (this.#callbacks.onIncrCost !== undefined) {
			this.#callbacks.onIncrCost(name, isTerm, cost);
		}
	}

	incrStartupCost() {
		if (this.#networkParams !== null) {
			this.incrCost("startup", true, this.#networkParams.plutusCoreStartupCost);
		}
	}

	incrVariableCost() {
		if (this.#networkParams !== null) {
			this.incrCost("variable", true, this.#networkParams.plutusCoreVariableCost);
		}
	}

	incrLambdaCost() {
		if (this.#networkParams !== null) {
			this.incrCost("lambda", true, this.#networkParams.plutusCoreLambdaCost);
		}
	}

	incrDelayCost() {
		if (this.#networkParams !== null) {
			this.incrCost("delay", true, this.#networkParams.plutusCoreDelayCost);
		}
	}

	incrCallCost() {
		if (this.#networkParams !== null) {
			this.incrCost("call", true, this.#networkParams.plutusCoreCallCost);
		}
	}

	incrConstCost() {
		if (this.#networkParams !== null) {
			this.incrCost("const", true, this.#networkParams.plutusCoreConstCost);
		}
	}

	incrForceCost() {
		if (this.#networkParams !== null) {
			this.incrCost("force", true, this.#networkParams.plutusCoreForceCost);
		}
	}

	incrBuiltinCost() {
		if (this.#networkParams !== null) {
			this.incrCost("builtin", true, this.#networkParams.plutusCoreBuiltinCost);
		}
	}

	/**
	 * @param {UplcBuiltin} fn
	 * @param {UplcValue[]} args
	 */
	calcAndIncrCost(fn, ...args) {
		if (this.#networkParams !== null) {
			let cost = fn.calcCost(this.#networkParams, ...args);

			this.incrCost(fn.name, false, cost);
		}
	}

	/**
	 * Gets variable using Debruijn index. Throws error here because UplcRTE is the stack root and doesn't contain any values.
	 * @param {number} i 
	 * @returns {UplcValue}
	 */
	get(i) {
		throw new Error("variable index out of range");
	}

	/**
	 * Creates a child stack.
	 * @param {UplcValue} value 
	 * @param {?string} valueName 
	 * @returns {UplcStack}
	 */
	push(value, valueName = null) {
		return new UplcStack(this, value, valueName);
	}

	/**
	 * Calls the print callback (or does nothing if print callback isn't defined)
	 * @param {string} msg 
	 * @returns {Promise<void>}
	 */
	async print(msg) {
		if (this.#callbacks.onPrint != undefined) {
			await this.#callbacks.onPrint(msg);
		}
	}

	/**
	 * Calls the onStartCall callback.
	 * @param {Site} site 
	 * @param {UplcRawStack} rawStack 
	 * @returns {Promise<void>}
	 */
	async startCall(site, rawStack) {
		if (this.#notifyCalls && this.#callbacks.onStartCall != undefined) {
			let stopNotifying = await this.#callbacks.onStartCall(site, rawStack);
			if (stopNotifying) {
				this.#notifyCalls = false;
				this.#marker = rawStack;
			}
		}
	}

	/**
	 * Calls the onEndCall callback if '#notifyCalls == true'.
	 * '#notifyCalls' is set to true if 'rawStack == #marker'.
	 * @param {Site} site 
	 * @param {UplcRawStack} rawStack 
	 * @param {UplcValue} result 
	 * @returns {Promise<void>}
	 */
	async endCall(site, rawStack, result) {
		if (!this.#notifyCalls && this.#marker == rawStack) {
			this.#notifyCalls = true;
			this.#marker = null;
		}

		if (this.#notifyCalls && this.#callbacks.onEndCall != undefined) {
			rawStack = rawStack.slice();
			rawStack.push(["__result", result]);
			await this.#callbacks.onEndCall(site, rawStack);
		}
	}

	/**
	 * @returns {UplcRawStack}
	 */
	toList() {
		return [];
	}
}

/**
 * UplcStack contains a value that can be retrieved using a Debruijn index.
 */
class UplcStack {
	#parent;
	#value;
	#valueName;

	/**
	 * @param {(?UplcStack) | UplcRte} parent
	 * @param {?UplcValue} value
	 * @param {?string} valueName
	 */
	constructor(parent, value = null, valueName = null) {
		this.#parent = parent;
		this.#value = value;
		this.#valueName = valueName;
	}

	incrStartupCost() {
		if (this.#parent !== null) {
			this.#parent.incrStartupCost()
		}
	}

	incrVariableCost() {
		if (this.#parent !== null) {
			this.#parent.incrVariableCost()
		}
	}

	incrLambdaCost() {
		if (this.#parent !== null) {
			this.#parent.incrLambdaCost()
		}
	}
	
	incrDelayCost() {
		if (this.#parent !== null) {
			this.#parent.incrDelayCost();
		}
	}

	incrCallCost() {
		if (this.#parent !== null) {
			this.#parent.incrCallCost();
		}
	}

	incrConstCost() {
		if (this.#parent !== null) {
			this.#parent.incrConstCost();
		}
	}

	incrForceCost() {
		if (this.#parent !== null) {
			this.#parent.incrForceCost()
		}
	}

	incrBuiltinCost() {
		if (this.#parent !== null) {
			this.#parent.incrBuiltinCost()
		}
	}

	/**
	 * @param {UplcBuiltin} fn
	 * @param {UplcValue[]} args
	 */
	calcAndIncrCost(fn, ...args) {
		if (this.#parent !== null) {
			this.#parent.calcAndIncrCost(fn, ...args);
		}
	}

	/**
	 * Gets a value using the Debruijn index. If 'i == 1' then the current value is returned.
	 * Otherwise 'i' is decrement and passed to the parent stack.
	 * @param {number} i 
	 * @returns {UplcValue}
	 */
	get(i) {
		i -= 1;

		if (i == 0) {
			if (this.#value === null) {
				throw new Error("Plutus-core stack value not set");
			} else {
				return this.#value;
			}
		} else {
			assert(i > 0);
			if (this.#parent === null) {
				throw new Error("variable index out of range");
			} else {
				return this.#parent.get(i);
			}
		}
	}

	/**
	 * Instantiates a child stack.
	 * @param {UplcValue} value 
	 * @param {?string} valueName 
	 * @returns {UplcStack}
	 */
	push(value, valueName = null) {
		return new UplcStack(this, value, valueName);
	}

	/**
	 * Calls the onPrint callback in the RTE (root of stack).
	 * @param {string} msg 
	 * @returns {Promise<void>}
	 */
	async print(msg) {
		if (this.#parent !== null) {
			await this.#parent.print(msg);
		}
	}

	/**
	 * Calls the onStartCall callback in the RTE (root of stack).
	 * @param {Site} site 
	 * @param {UplcRawStack} rawStack 
	 * @returns {Promise<void>}
	 */
	async startCall(site, rawStack) {
		if (this.#parent !== null) {
			await this.#parent.startCall(site, rawStack);
		}
	}

	/** 
	 * Calls the onEndCall callback in the RTE (root of stack).
	 * @param {Site} site
	 * @param {UplcRawStack} rawStack
	 * @param {UplcValue} result
	 * @returns {Promise<void>}
	*/
	async endCall(site, rawStack, result) {
		if (this.#parent !== null) {
			await this.#parent.endCall(site, rawStack, result);
		}
	}

	/** 
	 * @returns {UplcRawStack}
	*/
	toList() {
		let lst = this.#parent !== null ? this.#parent.toList() : [];
		if (this.#value !== null) {
			lst.push([this.#valueName, this.#value]);
		}
		return lst;
	}
}

/**
 * Anonymous Plutus-core function.
 * Returns a new UplcAnon whenever it is called/applied (args are 'accumulated'), except final application, when the function itself is evaluated.
 * @package
 */
class UplcAnon extends UplcValue {
	/**
	 * @typedef {(callSite: Site, subStack: UplcStack, ...args: UplcValue[]) => (UplcValue | Promise<UplcValue>)} UplcAnonCallback
	 */

	#rte;
	#nArgs;
	#argNames;

	/**
	 * Increment every time function a new argument is applied.
	 */
	#argCount;

	/**
	 * Callback that is called when function is fully applied.
	 * @type {UplcAnonCallback}
	 */
	#fn;
	#callSite;

	/**
	 * 
	 * @param {Site} site 
	 * @param {UplcRte | UplcStack} rte 
	 * @param {string[] | number} args - args can be list of argNames (for debugging), or the number of args
	 * @param {UplcAnonCallback} fn 
	 * @param {number} argCount 
	 * @param {?Site} callSite 
	 */
	constructor(site, rte, args, fn, argCount = 0, callSite = null) {
		super(site);
		assert(typeof argCount == "number");

		let nArgs = 0;
		/** @type {?string[]} */
		let argNames = null;
		if ((typeof args != 'number')) {
			if (args instanceof Array) {
				nArgs = args.length;
				argNames = args;
			} else {
				throw new Error("not an Array");
			}
		} else {
			nArgs = args;
		}

		assert(nArgs >= 1);

		this.#rte = rte;
		this.#nArgs = nArgs;
		this.#argNames = argNames;
		this.#argCount = argCount;
		this.#fn = fn;
		this.#callSite = callSite;
	}

	get memSize() {
		return 1;
	}

	/**
	 * @param {Site} newSite 
	 * @returns {UplcAnon}
	 */
	copy(newSite) {
		return new UplcAnon(
			newSite,
			this.#rte,
			this.#argNames !== null ? this.#argNames : this.#nArgs,
			this.#fn,
			this.#argCount,
			this.#callSite,
		);
	}

	/**
	 * @param {Site} callSite
	 * @param {UplcStack} subStack
	 * @param {UplcValue[]} args
	 * @returns {UplcValue | Promise<UplcValue>}
	 */
	callSync(callSite, subStack, args) {
		return this.#fn(callSite, subStack, ...args);
	}

	/**
	 * @param {UplcRte | UplcStack} rte 
	 * @param {Site} site 
	 * @param {UplcValue} value 
	 * @returns {Promise<UplcValue>}
	 */
	async call(rte, site, value) {
		assert(site != undefined && site instanceof Site);

		let subStack = this.#rte.push(value, this.#argNames !== null ? this.#argNames[this.#argCount] : null); // this is the only place where the stack grows
		let argCount = this.#argCount + 1;
		let callSite = this.#callSite !== null ? this.#callSite : site;

		// function is fully applied, collect the args and call the callback
		if (argCount == this.#nArgs) {
			/** @type {UplcValue[]} */
			let args = [];

			let rawStack = rte.toList(); // use the RTE of the callsite

			for (let i = this.#nArgs; i >= 1; i--) {
				let argValue = subStack.get(i);
				args.push(argValue);
				rawStack.push([`__arg${this.#nArgs - i}`, argValue]);
			}

			// notify the RTE of the new live stack (list of pairs instead of UplcStack), and await permission to continue
			await this.#rte.startCall(callSite, rawStack);

			try {
				let result = this.callSync(callSite, subStack, args);

				if (result instanceof Promise) {
					result = await result;
				}
	
				// the same rawStack object can be used as a marker for 'Step-Over' in the debugger
				await this.#rte.endCall(callSite, rawStack, result);
	
				return result.copy(callSite);
			} catch(e) {
				// TODO: better trace
				if (e instanceof RuntimeError) {
					e = e.addTraceSite(callSite);
				}

				throw e;
			}
		} else {
			// function isn't yet fully applied, return a new partially applied UplcAnon
			assert(this.#nArgs > 1);

			return new UplcAnon(
				callSite,
				subStack,
				this.#argNames !== null ? this.#argNames : this.#nArgs,
				this.#fn,
				argCount,
				callSite,
			);
		}
	}

	toString() {
		return "fn";
	}

	/**
	 * @returns {string}
	 */
	typeBits() {
		throw new Error("a UplcAnon value doesn't have a literal representation");
	}

	/**
	 * Encodes value with plutus flat encoding.
	 * Member function not named 'toFlat' as not to confuse with 'toFlat' member of terms.
	 * @param {BitWriter} bitWriter
	 */
	toFlatValue(bitWriter) {
		throw new Error("a UplcAnon value doesn't have a literal representation");
	}
}

/**
 * @package
 */
class UplcDelayedValue extends UplcValue {
	#evaluator;

	/**
	 * @param {Site} site
	 * @param {() => (UplcValue | Promise<UplcValue>)} evaluator
	 */
	constructor(site, evaluator) {
		super(site);
		this.#evaluator = evaluator;
	}

	get memSize() {
		return 1;
	}

	/**
	 * @param {Site} newSite 
	 * @returns {UplcValue}
	 */
	copy(newSite) {
		return new UplcDelayedValue(newSite, this.#evaluator);
	}

	/**
	 * @return {Promise<UplcValue>}
	 */
	force() {
		let res = this.#evaluator();

		if (res instanceof Promise) {
			return res;
		} else {
			return new Promise((resolve, _) => {
				resolve(res);
			});
		}
	}

	toString() {
		return `delay`;
	}

	/**
	 * @returns {string}
	 */
	typeBits() {
		throw new Error("a UplcDelayedValue value doesn't have a literal representation");
	}

	/**
	 * Encodes value with plutus flat encoding.
	 * Member function not named 'toFlat' as not to confuse with 'toFlat' member of terms.
	 * @param {BitWriter} bitWriter
	 */
	toFlatValue(bitWriter) {
		throw new Error("a UplcDelayedValue value doesn't have a literal representation");
	}
}

/**
 * Plutus-core Integer class
 */
export class UplcInt extends UplcValue {
	#value;
	#signed;

	/**
	 * @param {Site} site
	 * @param {bigint} value - supposed to be arbitrary precision
	 * @param {boolean} signed - unsigned is only for internal use
	 */
	constructor(site, value, signed = true) {
		super(site);
		assert(typeof value == 'bigint', "not a bigint");
		this.#value = value;
		this.#signed = signed;
	}

	/**
	 * Constructs a UplcInt without requiring a Site
	 * @param {bigint | number} value
	 * @returns {UplcInt} 
	 */
	static new(value) {
		if (typeof value == 'number') {
			assert(value % 1.0 == 0.0, "must be whole number");
			return new UplcInt(Site.dummy(), BigInt(value));
		} else {
			return new UplcInt(Site.dummy(), value);
		}
	}

	get signed() {
		return this.#signed;
	}

	/**
	 * Creates a UplcInt wrapped in a UplcConst, so it can be used a term
	 * @param {Site} site 
	 * @param {bigint} value 
	 * @returns 
	 */
	static newSignedTerm(site, value) {
		return new UplcConst(new UplcInt(site, value, true));
	}

	/**
	 * @type {number}
	 */
	get memSize() {
        return IntData.memSizeInternal(this.#value);
	}

	/**
	 * @param {Site} newSite 
	 * @returns {UplcInt}
	 */
	copy(newSite) {
		return new UplcInt(newSite, this.#value, this.#signed);
	}

	/**
	 * @type {bigint}
	 */
	get int() {
		return this.#value;
	}

	/**
	 * Parses a single byte in the Plutus-core byte-list representation of an int
	 * @param {number} b 
	 * @returns {number}
	 */
	static parseRawByte(b) {
		return b & 0b01111111;
	}

	/**
	 * Returns true if 'b' is the last byte in the Plutus-core byte-list representation of an int.
	 * @param {number} b 
	 * @returns {boolean}
	 */
	static rawByteIsLast(b) {
		return (b & 0b10000000) == 0;
	}

	/**
	 * Combines a list of Plutus-core bytes into a bigint (leading bit of each byte is ignored).
     * Differs from bytesToBigInt in utils.js because only 7 bits are used from each byte.
	 * @param {number[]} bytes
	 * @returns {bigint}
	 */
	static bytesToBigInt(bytes) {
		let value = BigInt(0);

		let n = bytes.length;

		for (let i = 0; i < n; i++) {
			let b = bytes[i];

			// 7 (not 8), because leading bit isn't used here
			value = value + BigInt(b) * ipow2(BigInt(i) * 7n);
		}

		return value;
	}

	/**
	 * Applies zigzag encoding
	 * @example
	 * (new UplcInt(Site.dummy(), -1n, true)).toUnsigned().int => 1n
	 * @example
	 * (new UplcInt(Site.dummy(), -1n, true)).toUnsigned().toSigned().int => -1n
	 * @example
	 * (new UplcInt(Site.dummy(), -2n, true)).toUnsigned().toSigned().int => -2n
	 * @example
	 * (new UplcInt(Site.dummy(), -3n, true)).toUnsigned().toSigned().int => -3n
	 * @example
	 * (new UplcInt(Site.dummy(), -4n, true)).toUnsigned().toSigned().int => -4n
	 * @returns {UplcInt}
	 */
	toUnsigned() {
		if (this.#signed) {
			if (this.#value < 0n) {
				return new UplcInt(this.site, -this.#value*2n - 1n, false);
			} else {
				return new UplcInt(this.site, this.#value * 2n, false);
			}
		} else {
			return this;
		}
	}

	/** 
	 * Unapplies zigzag encoding 
	 * @example
	 * (new UplcInt(Site.dummy(), 1n, false)).toSigned().int => -1n
	 * @returns {UplcInt}
	*/
	toSigned() {
		if (this.#signed) {
			return this;
		} else {
			if (this.#value % 2n == 0n) {
				return new UplcInt(this.site, this.#value / 2n, true);
			} else {
				return new UplcInt(this.site, -(this.#value + 1n) / 2n, true);
			}
		}
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return this.#value.toString();
	}

	/**
	 * @param {BitWriter} bitWriter
	 */
	toFlatInternal(bitWriter) {
		let zigzag = this.toUnsigned();
		let bitString = padZeroes(zigzag.#value.toString(2), 7);

		// split every 7th
		let parts = [];
		for (let i = 0; i < bitString.length; i += 7) {
			parts.push(bitString.slice(i, i + 7));
		}

		// reverse the parts
		parts.reverse();

		for (let i = 0; i < parts.length; i++) {
			if (i == parts.length - 1) {
				// last
				bitWriter.write('0' + parts[i]);
			} else {
				bitWriter.write('1' + parts[i]);
			}
		}
	}

	/**
	 * Encodes unsigned integer with plutus flat encoding.
	 * Throws error if signed.
	 * Used by encoding plutus core program version and debruijn indices.
	 * @param {BitWriter} bitWriter 
	 */
	toFlatUnsigned(bitWriter) {
		assert(!this.#signed);

		this.toFlatInternal(bitWriter);
	}

	/**
	 * @returns {string}
	 */
	typeBits() {
		return "0000";
	}

	/**
	 * @param {BitWriter} bitWriter 
	 */
	toFlatValueInternal(bitWriter) {
		assert(this.#signed);

		this.toFlatInternal(bitWriter);
	}
}

/**
 * Plutus-core ByteArray value class
 * Wraps a regular list of uint8 numbers (so not Uint8Array)
 */
export class UplcByteArray extends UplcValue {
	#bytes;

	/**
	 * @param {Site} site
	 * @param {number[]} bytes
	 */
	constructor(site, bytes) {
		super(site);
		assert(bytes != undefined);
		this.#bytes = bytes;
		for (let b of this.#bytes) {
			assert(typeof b == 'number');
		}
	}

	/**
	 * Construct a UplcByteArray without requiring a Site
	 * @param {number[]} bytes 
	 * @returns {UplcByteArray}
	 */
	static new(bytes) {
		return new UplcByteArray(Site.dummy(), bytes);
	}

	/**
	 * Creates new UplcByteArray wrapped in UplcConst so it can be used as a term.
	 * @param {Site} site 
	 * @param {number[]} bytes 
	 * @returns 
	 */
	static newTerm(site, bytes) {
		return new UplcConst(new UplcByteArray(site, bytes));
	}

	/**
	 * @type {number}
	 */
	get memSize() {
        return ByteArrayData.memSizeInternal(this.#bytes);
	}

	/**
	 * @param {Site} newSite 
	 * @returns {UplcByteArray}
	 */
	copy(newSite) {
		return new UplcByteArray(newSite, this.#bytes);
	}

	/**
	 * @type {number[]}
	 */
	get bytes() {
		return this.#bytes.slice();
	}

	/**
	 * Returns hex representation of byte array
	 * @returns {string}
	 */
	toString() {
		return `#${bytesToHex(this.#bytes)}`;
	}

	/**
	 * @returns {string}
	 */
	typeBits() {
		return "0001";
	}

	/**
	 * @param {BitWriter} bitWriter
	 */
	toFlatValueInternal(bitWriter) {
		UplcByteArray.writeBytes(bitWriter, this.#bytes);
	}

	/**
	 * Write a list of bytes to the bitWriter using flat encoding.
	 * Used by UplcString, UplcByteArray and UplcDataValue
	 * Equivalent to E_B* function in Plutus-core docs
	 * @param {BitWriter} bitWriter 
	 * @param {number[]} bytes 
	 */
	static writeBytes(bitWriter, bytes) {
		bitWriter.padToByteBoundary(true);

		// the rest of this function is equivalent to E_C* function in Plutus-core docs
		let n = bytes.length;
		let pos = 0;

		// write chunks of 255
		while (pos < n) {
			// each iteration is equivalent to E_C function in Plutus-core docs

			let nChunk = Math.min(n - pos, 255);

			// equivalent to E_8 function in Plutus-core docs
			bitWriter.write(padZeroes(nChunk.toString(2), 8));

			for (let i = pos; i < pos + nChunk; i++) {
				let b = bytes[i];

				// equivalent to E_8 function in Plutus-core docs
				bitWriter.write(padZeroes(b.toString(2), 8));
			}

			pos += nChunk;
		}

		bitWriter.write('00000000');
	}
}

/**
 * Plutus-core string value class
 */
export class UplcString extends UplcValue {
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
	 * Constructs a UplcStrin without requiring a Site
	 * @param {string} value 
	 * @returns {UplcString}
	 */
	static new(value) {
		return new UplcString(Site.dummy(), value);
	}

	/**
	 * Creates a new UplcString wrapped with UplcConst so it can be used as a term.
	 * @param {Site} site 
	 * @param {string} value 
	 * @returns {UplcConst}
	 */
	static newTerm(site, value) {
		return new UplcConst(new UplcString(site, value));
	}

	/**
	 * @type {number}
	 */
	get memSize() {
		return this.#value.length;
	}

	/**
	 * @param {Site} newSite 
	 * @returns {UplcString}
	 */
	copy(newSite) {
		return new UplcString(newSite, this.#value);
	}

	/**
	 * @type {string}
	 */
	get string() {
		return this.#value;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `"${this.#value}"`;
	}

	/**
	 * @returns {string}
	 */
	typeBits() {
		return "0010";
	}

	/**
	 * @param {BitWriter} bitWriter
	 */
	toFlatValueInternal(bitWriter) {
		let bytes = Array.from((new TextEncoder()).encode(this.#value));

		UplcByteArray.writeBytes(bitWriter, bytes);
	}
}

/**
 * Plutus-core unit value class
 */
export class UplcUnit extends UplcValue {
	/**
	 * @param {Site} site 
	 */
	constructor(site) {
		super(site);
	}

	/**
	 * Constructs a UplcUnit without requiring a Site
	 * @returns {UplcUnit}
	 */
	static new () {
		return new UplcUnit(Site.dummy());
	}

	/**
	 * Creates a new UplcUnit wrapped with UplcConst so it can be used as a term
	 * @param {Site} site 
	 * @returns {UplcConst}
	 */
	static newTerm(site) {
		return new UplcConst(new UplcUnit(site));
	}

	/**
	 * @type {number}
	 */
	get memSize() {
		return 1;
	}

	/**
	 * @param {Site} newSite 
	 * @returns {UplcUnit}
	 */
	copy(newSite) {
		return new UplcUnit(newSite);
	}

	toString() {
		return "()";
	}

	/**
	 * @returns {string}
	 */
	typeBits() {
		return "0011";
	}

	/**
	 * @param {BitWriter} bitWriter
	 */
	toFlatValueInternal(bitWriter) {
	}

	/**
	 * @returns {UplcUnit}
	 */
	assertUnit() {
		return this;
	}
}

/**
 * Plutus-core boolean value class
 */
export class UplcBool extends UplcValue {
	#value;

	/**
	 * @param {Site} site 
	 * @param {boolean} value 
	 */
	constructor(site, value) {
		super(site);
		this.#value = value;
	}

	/**
	 * Constructs a UplcBool without requiring a Site
	 * @param {boolean} value 
	 * @returns {UplcBool}
	 */
	static new(value) {
		return new UplcBool(Site.dummy(), value);
	}

	/**
	 * Creates a new UplcBool wrapped with UplcConst so it can be used as a term.
	 * @param {Site} site 
	 * @param {boolean} value 
	 * @returns {UplcConst}
	 */
	static newTerm(site, value) {
		return new UplcConst(new UplcBool(site, value));
	}

	/**
	 * @type {number}
	 */
	get memSize() {
		return 1;
	}

	/**
	 * @param {Site} newSite 
	 * @returns {UplcBool}
	 */
	copy(newSite) {
		return new UplcBool(newSite, this.#value);
	}

	/**
	 * @type {boolean}
	 */
	get bool() {
		return this.#value;
	}

	/**
	 * @type {UplcData}
	 */
	get data() {
		return new ConstrData(this.#value ? 1 : 0, []);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return this.#value ? "true" : "false";
	}

	/**
	 * @returns {string}
	 */
	typeBits() {
		return '0100';
	}

	/**
	 * @param {BitWriter} bitWriter
	 */
	toFlatValueInternal(bitWriter) {
		if (this.#value) {
			bitWriter.write('1');
		} else {
			bitWriter.write('0');
		}
	}
}

/**
 * Plutus-core pair value class
 * Can contain any other value type.
 */
export class UplcPair extends UplcValue {
	#first;
	#second;

	/**
	 * @param {Site} site
	 * @param {UplcValue} first
	 * @param {UplcValue} second
	 */
	constructor(site, first, second) {
		super(site);
		this.#first = first;
		this.#second = second;
	}

	/**
	 * Constructs a UplcPair without requiring a Site
	 * @param {UplcValue} first 
	 * @param {UplcValue} second 
	 * @returns {UplcPair}
	 */
	static new(first, second) {
		return new UplcPair(Site.dummy(), first, second);
	}

	/**
	 * Creates a new UplcBool wrapped with UplcConst so it can be used as a term.
	 * @param {Site} site 
	 * @param {UplcValue} first
	 * @param {UplcValue} second
	 * @returns {UplcConst}
	 */
	static newTerm(site, first, second) {
		return new UplcConst(new UplcPair(site, first, second));
	}

	/**
	 * @type {number}
	 */
	get memSize() {
		return this.#first.memSize + this.#second.memSize;
	}

	/**
	 * @param {Site} newSite 
	 * @returns {UplcPair}
	 */
	copy(newSite) {
		return new UplcPair(newSite, this.#first, this.#second);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `(${this.#first.toString()}, ${this.#second.toString()})`;
	}

	/**
	 * @returns {boolean}
	 */
	isPair() {
		return true;
	}

	/**
	 * @type {UplcValue}
	 */
	get first() {
		return this.#first;
	}

	/**
	 * @type {UplcValue}
	 */
	get second() {
		return this.#second;
	}

	/**
	 * @type {UplcData}
	 */
	get key() {
		return this.#first.data;
	}

	/**
	 * @type {UplcData}
	 */
	get value() {
		return this.#second.data;
	}

	/**
	 * @returns {string}
	 */
	typeBits() {
		// 7 (7 (6) (fst)) (snd)
		return ["0111", "0111", "0110", this.#first.typeBits(), this.#second.typeBits()].join("1");
	}

	/**
	 * @param {BitWriter} bitWriter
	 */
	toFlatValueInternal(bitWriter) {
		this.#first.toFlatValueInternal(bitWriter);
		this.#second.toFlatValueInternal(bitWriter);
	}
}

/** 
 * Plutus-core list value class.
 * Only used during evaluation.
*/
export class UplcList extends UplcValue {
	#itemType;
	#items;

	/**
	 * @param {Site} site 
	 * @param {UplcType} itemType 
	 * @param {UplcValue[]} items 
	 */
	constructor(site, itemType, items) {
		super(site);
		this.#itemType = itemType;
		this.#items = items;
	}

	/**
	 * Constructs a UplcList without requiring a Site
	 * @param {UplcType} type 
	 * @param {UplcValue[]} items 
	 */
	static new(type, items) {
		return new UplcList(Site.dummy(), type, items);
	}

	/**
	 * @type {number}
	 */
	get length() {
		return this.#items.length;
	}

	/**
	 * @type {number}
	 */
	get memSize() {
		let sum = 0;

		for (let item of this.#items) {
			sum += item.copy(this.site).memSize;
		}

		return sum;
	}

	get itemType() {
		return this.#itemType;
	}

	/**
	 * @param {Site} newSite
	 * @returns {UplcList}
	 */
	copy(newSite) {
		return new UplcList(newSite, this.#itemType, this.#items.slice());
	}

	/**
	 * @returns {boolean}
	 */
	isList() {
		return true;
	}

	/**
	 * @type {UplcValue[]}
	 */
	get list() {
		return this.#items.slice();
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `[${this.#items.map(item => item.toString()).join(", ")}]`;
	}

	/**
	 * @returns {string}
	 */
	typeBits() {
		// 7 (5) (type bits of content)
		return ["0111", "0101", this.#itemType.typeBits()].join("1");
	}

	/**
	 * @param {BitWriter} bitWriter 
	 */
	toFlatValueInternal(bitWriter) {
		for (let item of this.#items) {
			bitWriter.write('1');

			item.copy(this.site).toFlatValueInternal(bitWriter);
		}

		bitWriter.write('0');
	}
}

/**
 * Wrapper for UplcData.
 */
export class UplcDataValue extends UplcValue {
	#data;

	/**
	 * @param {Site} site 
	 * @param {UplcData} data 
	 */
	constructor(site, data) {
		super(site);
		this.#data = assertDefined(data);
		assert(data instanceof UplcData);
	}

	/**
	 * @type {number}
	 */
	get memSize() {
		return this.#data.memSize;
	}

	/**
	 * @param {Site} newSite 
	 * @returns {UplcDataValue}
	 */
	copy(newSite) {
		return new UplcDataValue(newSite, this.#data);
	}

	/**
	 * @returns {boolean}
	 */
	isData() {
		return true;
	}

	/**
	 * @type {UplcData}
	 */
	get data() {
		return this.#data;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `data(${this.#data.toString()})`;
	}

	/**
	 * @returns {string}
	 */
	typeBits() {
		return UplcType.newDataType().typeBits();
	}

	/**
	 * @param {BitWriter} bitWriter
	 */
	toFlatValueInternal(bitWriter) {
		UplcByteArray.writeBytes(bitWriter, this.#data.toCbor());
	}

	/**
	 * @param {UplcDataValue | UplcData} data 
	 * @returns {UplcData}
	 */
	static unwrap(data) {
		if (data instanceof UplcDataValue) {
			return data.data;
		} else {
			return data;
		}
	}
}

/**
 * Base class of Plutus-core terms
 * @package
 */
class UplcTerm {
	#site;
	#type;

	/**
	 * @param {Site} site
	 * @param {number} type
	 */
	constructor(site, type) {
		assert(site != undefined && site instanceof Site);
		this.#site = site;
		this.#type = type;
	}

	/**
	 * @type {Site}
	 */
	get site() {
		return this.#site;
	}

	/**
	 * Generic term toString method
	 * @returns {string}
	 */
	toString() {
		return `(Term ${this.#type.toString()})`;
	}

	/**
	 * Calculates a value, and also increments the cost
	 * @param {UplcRte | UplcStack} rte 
	 * @returns {Promise<UplcValue>}
	 */
	async eval(rte) {
		throw new Error("not yet implemented");
	}

	/**
	 * Writes bits of flat encoded Plutus-core terms to bitWriter. Doesn't return anything.
	 * @param {BitWriter} bitWriter 
	 */
	toFlat(bitWriter) {
		throw new Error("not yet implemented");
	}
}

/**
 * Plutus-core variable ref term (index is a Debruijn index)
 * @package
 */
class UplcVariable extends UplcTerm {
	#index;

	/**
	 * @param {Site} site 
	 * @param {UplcInt} index 
	 */
	constructor(site, index) {
		super(site, 0);
		this.#index = index;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `x${this.#index.toString()}`;
	}

	/**
	 * @param {BitWriter} bitWriter 
	 */
	toFlat(bitWriter) {
		bitWriter.write('0000');
		this.#index.toFlatUnsigned(bitWriter);
	}

	/**
	 * @param {UplcRte | UplcStack} rte
	 * @returns {Promise<UplcValue>}
	 */
	async eval(rte) {
		// add costs before get the value
		rte.incrVariableCost();

		return rte.get(Number(this.#index.int));
	}
}

/**
 * Plutus-core delay term.
 * @package
 */
class UplcDelay extends UplcTerm {
	#expr;

	/**
	 * @param {Site} site 
	 * @param {UplcTerm} expr 
	 */
	constructor(site, expr) {
		super(site, 1);
		this.#expr = expr;
	}

	/**
	 * @returns {string} 
	 */
	toString() {
		return `(delay ${this.#expr.toString()})`;
	}

	/**
	 * @param {BitWriter} bitWriter 
	 */
	toFlat(bitWriter) {
		bitWriter.write('0001');
		this.#expr.toFlat(bitWriter);
	}

	/**
	 * @param {UplcRte | UplcStack} rte 
	 * @returns {Promise<UplcValue>}
	 */
	async eval(rte) {
		rte.incrDelayCost();

		return new UplcDelayedValue(this.site, () =>  this.#expr.eval(rte));
	}
}

/**
 * Plutus-core lambda term
 * @package
 */
class UplcLambda extends UplcTerm {
	#rhs;
	#argName;

	/**
	 * @param {Site} site
	 * @param {UplcTerm} rhs
	 * @param {?string} argName
	 */
	constructor(site, rhs, argName = null) {
		super(site, 2);
		this.#rhs = rhs;
		this.#argName = argName;
	}

	/**
	 * Returns string with unicode lambda symbol
	 * @returns {string}
	 */
	toString() {
		return `(\u039b${this.#argName !== null ? " " + this.#argName + " ->" : ""} ${this.#rhs.toString()})`;
	}

	/**
	 * @param {BitWriter} bitWriter 
	 */
	toFlat(bitWriter) {
		bitWriter.write('0010');
		this.#rhs.toFlat(bitWriter);
	}

	/**
	 * @param {UplcRte | UplcStack} rte 
	 * @returns {Promise<UplcValue>}
	 */
	async eval(rte) {
		rte.incrLambdaCost();

		return new UplcAnon(this.site, rte, this.#argName !== null ? [this.#argName] : 1, (callSite, subStack) => {
			return this.#rhs.eval(subStack);
		});
	}
}

/**
 * Plutus-core function application term (i.e. function call)
 * @package
 */
class UplcCall extends UplcTerm {
	#a;
	#b;

	/**
	 * @param {Site} site
	 * @param {UplcTerm} a
	 * @param {UplcTerm} b
	 */
	constructor(site, a, b) {
		super(site, 3);
		this.#a = a;
		this.#b = b;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `[${this.#a.toString()} ${this.#b.toString()}]`;
	}

	/**
	 * @param {BitWriter} bitWriter 
	 */
	toFlat(bitWriter) {
		bitWriter.write('0011');
		this.#a.toFlat(bitWriter);
		this.#b.toFlat(bitWriter);
	}

	/**
	 * @param {UplcRte | UplcStack} rte 
	 * @returns 
	 */
	async eval(rte) {
		rte.incrCallCost();

		let fn = await this.#a.eval(rte);
		let arg = await this.#b.eval(rte);

		return await fn.call(rte, this.site, arg);
	}
}

/**
 * Plutus-core const term (i.e. a literal in conventional sense)
 * @package
 */
class UplcConst extends UplcTerm {
	#value;

	/**
	 * @param {UplcValue} value 
	 */
	constructor(value) {
		super(value.site, 4);

		this.#value = value;

		if (value instanceof UplcInt) {
			assert(value.signed);
		}
	}

	/**
	 * @type {UplcValue}
	 */
	get value() {
		return this.#value;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return this.#value.toString();
	}

	/**
	 * @param {BitWriter} bitWriter 
	 */
	toFlat(bitWriter) {
		bitWriter.write('0100');
		this.#value.toFlatValue(bitWriter);
	}

	/**
	 * @param {UplcStack | UplcRte} rte 
	 * @returns {Promise<UplcValue>}
	 */
	async eval(rte) {
		rte.incrConstCost();

		return await this.#value.eval(rte);
	}
}

/**
 * Plutus-core force term
 * @package
 */
class UplcForce extends UplcTerm {
	#expr;

	/**
	 * @param {Site} site
	 * @param {UplcTerm} expr
	 */
	constructor(site, expr) {
		super(site, 5);
		this.#expr = expr;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `(force ${this.#expr.toString()})`;
	}

	/**
	 * @param {BitWriter} bitWriter 
	 */
	toFlat(bitWriter) {
		bitWriter.write('0101');
		this.#expr.toFlat(bitWriter);
	}

	/**
	 * @param {UplcRte | UplcStack} rte 
	 * @returns {Promise<UplcValue>}
	 */
	async eval(rte) {
		rte.incrForceCost();

		return await (await this.#expr.eval(rte)).force();
	}
}

/**
 * Plutus-core error term
 * @package
 */
class UplcError extends UplcTerm {
	/** 'msg' is only used for debuggin and doesn't actually appear in the final program */
	#msg;

	/**
	 * @param {Site} site 
	 * @param {string} msg 
	 */
	constructor(site, msg = "") {
		super(site, 6);
		this.#msg = msg;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return "(error)";
	}

	/**
	 * @param {BitWriter} bitWriter 
	 */
	toFlat(bitWriter) {
		bitWriter.write('0110');
	}

	/**
	 * Throws a RuntimeError when evaluated.
	 * @param {UplcRte | UplcStack} rte 
	 * @returns {Promise<UplcValue>}
	 */
	async eval(rte) {
		throw this.site.runtimeError(this.#msg);
	}
}

/**
 * Plutus-core builtin function ref term
 * @package
 */
class UplcBuiltin extends UplcTerm {
	/** unknown builtins stay integers */
	#name;

	/**
	 * @param {Site} site 
	 * @param {string | number} name 
	 */
	constructor(site, name) {
		super(site, 7);
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
		if (typeof this.#name == "string") {
			return `(builtin ${this.#name})`;
		} else {
			return `(builtin unknown${this.#name.toString()})`;
		}
	}

	/**
	 * @param {BitWriter} bitWriter 
	 */
	toFlat(bitWriter) {
		bitWriter.write('0111');

		/** @type {number} */
		let i;

		if (typeof this.#name == "string") {
			i = UPLC_BUILTINS.findIndex(info => info.name == this.#name);
		} else {
			i = this.#name;
		}

		let bitString = padZeroes(i.toString(2), 7);

		bitWriter.write(bitString);
	}

	/**
	 * @param {NetworkParams} params
	 * @param  {...UplcValue} args
	 * @returns {Cost}
	 */
	calcCost(params, ...args) {
		let i = UPLC_BUILTINS.findIndex(info => info.name == this.#name);

		let argSizes = args.map(a => a.memSize);

		if (!argSizes.every(size => !Number.isNaN(size) && size >= 0)) {
			throw new Error("invalid arg size");
		}

		return UPLC_BUILTINS[i].calcCost(params, argSizes);
	}

	/**
	 * Used by IRCoreCallExpr
	 * @param {Word} name
	 * @param {UplcValue[]} args
	 * @returns {UplcValue}
	 */
	static evalStatic(name, args) {
		let builtin = new UplcBuiltin(name.site, name.value);

		let dummyRte = new UplcRte();

		let anon = builtin.evalInternal(dummyRte);

		let subStack = new UplcStack(dummyRte);

		let res = anon.callSync(name.site, subStack, args);

		if (res instanceof Promise) {
			throw new Error("can't call trace through evalStatic");
		} else {
			return res;
		}
	}

	/**
	 * @param {UplcRte | UplcStack} rte
	 * @returns {UplcAnon}
	 */
	evalInternal(rte = new UplcRte()) {
		if (typeof this.#name == "number") {
			throw new Error("can't evaluate unknown Plutus-core builtin");
		}

		switch (this.#name) {
			case "addInteger":
				// returning a lambda is assumed to be free
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					// but calling a lambda has a cost associated
					rte.calcAndIncrCost(this, a, b);

					return new UplcInt(callSite, a.int + b.int);
				});
			case "subtractInteger":
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					rte.calcAndIncrCost(this, a, b);

					return new UplcInt(callSite, a.int - b.int);
				});
			case "multiplyInteger":
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					rte.calcAndIncrCost(this, a, b);

					return new UplcInt(callSite, a.int * b.int);
				});
			case "divideInteger":
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					rte.calcAndIncrCost(this, a, b);

					if (b.int === 0n) {
						throw callSite.runtimeError("division by zero");
					} else {
						return new UplcInt(callSite, a.int / b.int);
					}
				});
			case "modInteger":
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					rte.calcAndIncrCost(this, a, b);

					if (b.int === 0n) {
						throw callSite.runtimeError("division by zero");
					} else {
						return new UplcInt(callSite, a.int % b.int);
					}
				});
			case "equalsInteger":
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					rte.calcAndIncrCost(this, a, b);

					return new UplcBool(callSite, a.int == b.int);
				});
			case "lessThanInteger":
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					rte.calcAndIncrCost(this, a, b);

					return new UplcBool(callSite, a.int < b.int);
				});
			case "lessThanEqualsInteger":
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					rte.calcAndIncrCost(this, a, b);

					return new UplcBool(callSite, a.int <= b.int);
				});
			case "appendByteString":
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					rte.calcAndIncrCost(this, a, b);

					return new UplcByteArray(callSite, a.bytes.concat(b.bytes));
				});
			case "consByteString":
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					rte.calcAndIncrCost(this, a, b);

					let bytes = b.bytes;
					bytes.unshift(Number(a.int % 256n));
					return new UplcByteArray(callSite, bytes);
				});
			case "sliceByteString":
				return new UplcAnon(this.site, rte, 3, (callSite, _, a, b, c) => {
					rte.calcAndIncrCost(this, a, b, c);

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

					let sub = bytes.slice(start, start + n);

					return new UplcByteArray(callSite, sub);
				});
			case "lengthOfByteString":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					return new UplcInt(callSite, BigInt(a.bytes.length));
				});
			case "indexByteString":
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					rte.calcAndIncrCost(this, a, b);

					let bytes = a.bytes;
					let i = b.int;
					if (i < 0 || i >= bytes.length) {
						throw new Error("index out of range");
					}

					return new UplcInt(callSite, BigInt(bytes[Number(i)]));
				});
			case "equalsByteString":
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					rte.calcAndIncrCost(this, a, b);

					return new UplcBool(callSite, ByteArrayData.comp(a.bytes, b.bytes) == 0);
				});
			case "lessThanByteString":
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					rte.calcAndIncrCost(this, a, b);

					return new UplcBool(callSite, ByteArrayData.comp(a.bytes, b.bytes) == -1);
				});
			case "lessThanEqualsByteString":
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					rte.calcAndIncrCost(this, a, b);

					return new UplcBool(callSite, ByteArrayData.comp(a.bytes, b.bytes) <= 0);
				});
			case "appendString":
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					rte.calcAndIncrCost(this, a, b);

					return new UplcString(callSite, a.string + b.string);
				});
			case "equalsString":
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					rte.calcAndIncrCost(this, a, b);

					return new UplcBool(callSite, a.string == b.string);
				});
			case "encodeUtf8":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					return new UplcByteArray(callSite, textToBytes(a.string));
				});
			case "decodeUtf8":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					try {
						return new UplcString(callSite, bytesToText(a.bytes));
					} catch(_) {
						throw callSite.runtimeError("invalid utf-8");
					}
				});
			case "sha2_256":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					return new UplcByteArray(callSite, Crypto.sha2_256(a.bytes))
				});
			case "sha3_256":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					return new UplcByteArray(callSite, Crypto.sha3(a.bytes))
				});
			case "blake2b_256":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					return new UplcByteArray(callSite, Crypto.blake2b(a.bytes)); 
				});
			case "verifyEd25519Signature":
				return new UplcAnon(this.site, rte, 3, (callSite, _, key, msg, signature) => {
					rte.calcAndIncrCost(this, key, msg, signature);

					let keyBytes = key.bytes;
					if (keyBytes.length != 32) {
						throw callSite.runtimeError(`expected key of length 32 for verifyEd25519Signature, got key of length ${keyBytes.length}`);
					}

					let msgBytes = msg.bytes;
					
					let signatureBytes = signature.bytes;
					if (signatureBytes.length != 64) {
						throw callSite.runtimeError(`expected signature of length 64 for verifyEd25519Signature, got signature of length ${signatureBytes.length}`);
					}

					let ok = Crypto.Ed25519.verify(signatureBytes, msgBytes, keyBytes);

					return new UplcBool(callSite, ok);
				});
			case "ifThenElse":
				return new UplcAnon(this.site, rte, 3, (callSite, _, a, b, c) => {
					rte.calcAndIncrCost(this, a, b, c);

					return a.bool ? b.copy(callSite) : c.copy(callSite);
				});
			case "chooseUnit":
				// what is the point of this function?
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					rte.calcAndIncrCost(this, a, b);

					a.assertUnit();

					return b.copy(callSite);
				});
			case "trace":
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					rte.calcAndIncrCost(this, a, b);

					return rte.print(a.string).then(() => {
						return b.copy(callSite);
					});
				});
			case "fstPair":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					if (a.isPair()) {
						return a.first.copy(callSite);
					} else {
						throw callSite.typeError(`expected pair or data-pair for first arg, got '${a.toString()}'`);
					}
				});
			case "sndPair":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					if (a.isPair()) {
						return a.second.copy(callSite);
					} else {
						throw callSite.typeError(`expected pair or data-pair for first arg, got '${a.toString()}'`);
					}
				});
			case "chooseList":
				return new UplcAnon(this.site, rte, 3, (callSite, _, a, b, c) => {
					rte.calcAndIncrCost(this, a, b, c);

					if (a.isList()) {
						if (a.length == 0) {
							return b.copy(callSite);
						} else {
							return c.copy(callSite);
						}
					} else {
						throw callSite.typeError(`expected list or map first arg, got '${a.toString()}'`);
					}
				});
			case "mkCons":
				// only allow data items in list
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					rte.calcAndIncrCost(this, a, b);

					if (b.isList()) {
						if (!b.itemType.isSameType(a)) {
							throw callSite.typeError(`wrong type for 2nd arg of mkCons`);
						}

						let lst = b.list;
						lst.unshift(a);

						return new UplcList(callSite, b.itemType, lst);
					} else {
						throw callSite.typeError(`expected list or map for second arg, got '${b.toString()}'`);
					}
				});
			case "headList":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					if (a.isList()) {
						const lst = a.list;
						if (lst.length == 0) {
							throw callSite.runtimeError("empty list");
						}

						return lst[0].copy(callSite);
					} else {
						throw callSite.typeError(`__core__head expects list or map, got '${a.toString()}'`);
					}
				});
			case "tailList":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					if (a.isList()) {
						let lst = a.list;
						if (lst.length == 0) {
							throw callSite.runtimeError("empty list");
						}

						return new UplcList(callSite, a.itemType, lst.slice(1));
					} else {
						throw callSite.typeError(`__core__tail expects list or map, got '${a.toString()}'`);
					}
				});
			case "nullList":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					if (a.isList()) {
						return new UplcBool(callSite, a.list.length == 0);
					} else {
						throw callSite.typeError(`__core__nullList expects list or map, got '${a.toString()}'`);
					}
				});
			case "chooseData":
				return new UplcAnon(this.site, rte, 6, (callSite, _, a, b, c, d, e, f) => {
					rte.calcAndIncrCost(this, a, b, c, d, e, f);

					let data = a.data;

					if (data instanceof ConstrData) {
						return b;
					} else if (data instanceof MapData) {
						return c;
					} else if (data instanceof ListData) {
						return d;
					} else if (data instanceof IntData) {
						return e;
					} else if (data instanceof ByteArrayData) {
						return f;
					} else {
						throw new Error("unexpected");
					}
				});
			case "constrData":
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					rte.calcAndIncrCost(this, a, b);

					const i = a.int;
					assert(i >= 0);

					const lst = b.list;

					return new UplcDataValue(callSite, new ConstrData(Number(i), lst.map(item => item.data)));
				});
			case "mapData":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					return new UplcDataValue(callSite, new MapData(a.list.map(pair => {
						return [pair.first.data, pair.second.data];
					})));
				});
			case "listData":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					return new UplcDataValue(callSite, new ListData(a.list.map(item => item.data)));
				});
			case "iData":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);
					
					return new UplcDataValue(callSite, new IntData(a.int));
				});
			case "bData":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					return new UplcDataValue(callSite, new ByteArrayData(a.bytes));
				});
			case "unConstrData":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					if (!a.isData()) {
						throw callSite.typeError(`expected data for arg of unConstrData, got ${a.toString()}`);
					}

					let data = a.data;
					if (!(data instanceof ConstrData)) {
						throw callSite.runtimeError(`unexpected unConstrData argument '${data.toString()}'`);
					} else {
						return new UplcPair(callSite, new UplcInt(callSite, BigInt(data.index)), new UplcList(callSite, UplcType.newDataType(), data.fields.map(f => new UplcDataValue(callSite, f))));
					}
				});
			case "unMapData":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					if (!a.isData()) {
						throw callSite.typeError(`expected data for arg of unMapData, got ${a.toString()}`);
					}

					let data = a.data;
					if (!(data instanceof MapData)) {
						throw callSite.runtimeError(`unexpected unMapData argument '${data.toString()}'`);
					} else {
						return new UplcList(callSite, UplcType.newDataPairType(), data.map.map(([fst, snd]) => new UplcPair(callSite, new UplcDataValue(callSite, fst), new UplcDataValue(callSite, snd))));
					}
				});
			case "unListData":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					if (!a.isData()) {
						throw callSite.typeError(`expected data for arg of unListData, got ${a.toString()}`);
					}

					let data = a.data;
					if (!(data instanceof ListData)) {
						throw callSite.runtimeError(`unexpected unListData argument '${data.toString()}'`);
					} else {
						return new UplcList(callSite, UplcType.newDataType(), data.list.map(item => new UplcDataValue(callSite, item)));
					}
				});
			case "unIData":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					if (!a.isData()) {
						throw callSite.typeError(`expected data for arg of unIData, got ${a.toString()}`);
					}

					let data = a.data;
					if (!(data instanceof IntData)) {
						throw callSite.runtimeError(`unexpected unIData argument '${data.toString()}'`);
					} else {
						return new UplcInt(callSite, data.value);
					}
				});
			case "unBData":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					if (!a.isData()) {
						throw callSite.typeError(`expected data for arg of unBData, got ${a.toString()}`);
					}

					let data = a.data;
					if (!(data instanceof ByteArrayData)) {
						throw callSite.runtimeError(`unexpected unBData argument '${data.toString()}'`);
					} else {
						return new UplcByteArray(callSite, data.bytes);
					}
				});
			case "equalsData":
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					rte.calcAndIncrCost(this, a, b);

					if (!a.isData()) {
						throw callSite.typeError(`expected data for 1st arg of equalsData, got ${a.toString()}`);
					}

					if (!b.isData()) {
						throw callSite.typeError(`expected data for 2nd arg of equalsData, got ${b.toString()}`);
					}

					return new UplcBool(callSite, a.data.isSame(b.data));
				});
			case "mkPairData":
				return new UplcAnon(this.site, rte, 2, (callSite, _, a, b) => {
					rte.calcAndIncrCost(this, a, b);

					return new UplcPair(callSite, new UplcDataValue(callSite, a.data), new UplcDataValue(callSite, b.data));
				});
			case "mkNilData":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					a.assertUnit();

					return new UplcList(callSite, UplcType.newDataType(), []);
				});
			case "mkNilPairData":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					a.assertUnit();

					return new UplcList(callSite, UplcType.newDataPairType(), []);
				});
			case "serialiseData":
				return new UplcAnon(this.site, rte, 1, (callSite, _, a) => {
					rte.calcAndIncrCost(this, a);

					return new UplcByteArray(callSite, a.data.toCbor());
				});
			case "verifyEcdsaSecp256k1Signature":
			case "verifySchnorrSecp256k1Signature":
				throw new Error("no immediate need, so don't bother yet");
			default:
				throw new Error(`builtin ${this.#name} not yet implemented`);
		}
	}

	/**
	 * Returns appropriate callback wrapped with UplcAnon depending on builtin name.
	 * Emulates every Plutus-core that Helios exposes to the user.
	 * @param {UplcRte | UplcStack} rte 
	 * @returns {Promise<UplcValue>}
	 */
	async eval(rte) {
		rte.incrBuiltinCost();

		/**
		 * @type {UplcValue}
		 */
		let v = this.evalInternal(rte);

		if  (typeof this.#name === 'string') {
			let nForce = UPLC_BUILTINS[findUplcBuiltin("__core__" + this.#name)].forceCount;

			for  (let i = 0; i < nForce; i++) {
				const vPrev = v;

				v = new UplcDelayedValue(this.site, () => vPrev);
			}
		}
 
		return v;
	}
}



///////////////////////////
// Section 11: Uplc program
///////////////////////////

/**
 * This library uses version "1.0.0" of Plutus-core
 * @package
 */
const UPLC_VERSION_COMPONENTS = [1n, 0n, 0n];

 /**
  * i.e. "1.0.0"
  * @package
  * @type {string}
  */
const UPLC_VERSION = UPLC_VERSION_COMPONENTS.map(c => c.toString()).join(".");

/**
 * This library uses V2 of the Plutus Ledger API, and is no longer compatible with V1
 * @package
 */
const PLUTUS_SCRIPT_VERSION = "PlutusScriptV2";

/**
 * @package
 * @type {Object.<string, number>}
 */
 const UPLC_TAG_WIDTHS = {
	term:      4,
	type:      3,
	constType: 4,
	builtin:   7,
	constant:  4,
	kind:      1
};

/**
 * Plutus-core program class
 */
 export class UplcProgram {
	#version;
	#expr;
	#purpose;

	/**
	 * @param {UplcTerm} expr 
	 * @param {?number} purpose // TODO: enum type
	 * @param {UplcInt[]} version
	 */
	constructor(expr, purpose = null, version = UPLC_VERSION_COMPONENTS.map(v => new UplcInt(expr.site, v, false))) {
		this.#version = version;
		this.#expr = expr;
		this.#purpose = purpose;
	}

	/**
	 * @type {UplcTerm}
	 */
	get expr() {
		return this.#expr;
	}

	/**
	 * @type {Site}
	 */
	get site() {
		return new Site(this.#expr.site.src, 0);
	}

	/**
	 * Returns the IR source
	 * @type {string}
	 */
	get src() {
		return this.site.src.raw;
	}

	/**
	 * Returns version of Plutus-core (!== Plutus script version!)
	 * @type {string}
	 */
	get versionString() {
		return this.#version.map(v => v.toString()).join(".");
	}

	/**
	 * @returns {string}
	 */
	plutusScriptVersion() {
		// Note: only supports PlutusScriptV2 for now
		return PLUTUS_SCRIPT_VERSION;
	}

	/**
	 * Returns 1 for PlutusScriptV1, 2 for PlutusScriptV2
	 * @returns {number}
	 */
	versionTag() {
		let v = this.plutusScriptVersion();

		switch (v) {
			case "PlutusScriptV1":
				return 1;
			case "PlutusScriptV2":
				return 2;
			default:
				throw new Error(`unhandled script version '${v}'`);
		}
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `(program ${this.versionString} ${this.#expr.toString()})`;
	}

	/**
	 * Flat encodes the entire Plutus-core program.
	 * Note that final padding isn't added now but is handled by bitWriter upon finalization.
	 * @param {BitWriter} bitWriter 
	 */
	toFlat(bitWriter) {
		for (let v of this.#version) {
			v.toFlatUnsigned(bitWriter);
		}

		this.#expr.toFlat(bitWriter);
	}

	/**
	 * @param {UplcRte} rte 
	 * @returns {Promise<UplcValue>}
	 */
	async eval(rte) {
		return this.#expr.eval(rte);
	}

	/**
	 * Evaluates the term contained in UplcProgram (assuming it is a lambda term)
	 * @param {?UplcValue[]} args
	 * @param {UplcRTECallbacks} callbacks
	 * @param {?NetworkParams} networkParams
	 * @returns {Promise<UplcValue>}
	 */
	async runInternal(args, callbacks = DEFAULT_UPLC_RTE_CALLBACKS, networkParams = null) {
		assertDefined(callbacks);

		let rte = new UplcRte(callbacks, networkParams);

		// add the startup costs
		rte.incrStartupCost();

		let fn = await this.eval(rte);

		// program site is at pos 0, but now the call site is actually at the end 
		let globalCallSite = new Site(this.site.src, this.site.src.length);
		
		/** @type {UplcValue} */
		let result = fn;

		if (args !== null) {
			if (args.length === 0 && fn instanceof UplcDelayedValue) {
				result = await fn.force();
			} else {
				for (let arg of args) {
					// each call also adds to the total cost
					rte.incrCallCost();
					rte.incrConstCost();

					result = await result.call(rte, globalCallSite, arg);
				}
			}
		}

		return result;
	}

	/**
	 * Wrap the top-level term with consecutive UplcCall terms
	 * No checks are performed whether this makes sense or not, so beware
	 * Throws an error if you are trying to apply an  with anon func.
	 * @param {(UplcValue | HeliosData)[]} args
	 * @returns {UplcProgram} - a new UplcProgram instance
	 */
	apply(args) {
		let expr = this.expr;

		for (let arg of args) {
			if (arg instanceof UplcValue) {
				if (arg instanceof UplcAnon) {
					throw new Error("UplcAnon cannot be applied to UplcProgram");
				}
				
				expr = new UplcCall(arg.site, expr, new UplcConst(arg));
			} else if (arg instanceof HeliosData) {
				expr = new UplcCall(Site.dummy(), expr, new UplcConst(new UplcDataValue(Site.dummy(), arg._toUplcData())));
			}
		}

		return new UplcProgram(expr, this.#purpose, this.#version);
	}

	/**
	 * @param {?UplcValue[]} args - if null the top-level term is returned as a value
	 * @param {UplcRTECallbacks} callbacks 
	 * @param {?NetworkParams} networkParams
	 * @returns {Promise<UplcValue | UserError>}
	 */
	async run(args, callbacks = DEFAULT_UPLC_RTE_CALLBACKS, networkParams = null) {
		try {
			return await this.runInternal(args, callbacks, networkParams);
		} catch (e) {
			if (!(e instanceof UserError)) {
				throw e;
			} else {
				return e;
			}
		}
	}

	/**
	 * @param {?UplcValue[]} args
	 * @returns {Promise<[(UplcValue | UserError), string[]]>}
	 */
	async runWithPrint(args) {
		/**
		 * @type {string[]}
		 */
		const messages = [];

		const callbacks = Object.assign({}, DEFAULT_UPLC_RTE_CALLBACKS);

		callbacks.onPrint = async function(msg) {
			messages.push(msg);
		};

		const res = await this.run(args, callbacks);

		return [res, messages];
	}

	/**
	 * @typedef {{
	 *   mem: bigint, 
	 *   cpu: bigint,
	 *   size: number,
	 *   builtins: {[name: string]: Cost},
	 *   terms: {[name: string]: Cost},
	 *   result: UserError | UplcValue,
	 *   messages: string[]
	 * }} Profile
	 * mem:  in 8 byte words (i.e. 1 mem unit is 64 bits)
	 * cpu:  in reference cpu microseconds
	 * size: in bytes
	 * builtins: breakdown per builtin
	 * terms: breakdown per termtype
	 * result: result of evaluation
	 * messages: printed messages (can be helpful when debugging)
	 */

	/**
	 * @param {UplcValue[]} args
	 * @param {NetworkParams} networkParams
	 * @returns {Promise<Profile>}
	 */
	async profile(args, networkParams) {
		let callbacks = Object.assign({}, DEFAULT_UPLC_RTE_CALLBACKS);

		let memCost = 0n;
		let cpuCost = 0n;

		/**
		 * @type {{[name: string]: Cost}}
		 */
		const builtins = {};

		/**
		 * @type {{[name: string]: Cost}}
		 */
		const terms = {};
		
		/**
		 * @type {(name: string, isTerm: boolean, cost: Cost) => void}
		 */
		callbacks.onIncrCost = (name, isTerm, cost) => {
			memCost += cost.mem;
			cpuCost += cost.cpu;

			if (name !== undefined) {
				if (isTerm) {
					const prev = terms[name];
					if (prev !== undefined) {
						terms[name] = {
							mem: prev.mem + cost.mem,
							cpu: prev.cpu + cost.cpu
						};
					} else {
						terms[name] = cost;
					}
				} else {
					const prev = builtins[name];

					if (prev !== undefined) {
						builtins[name] = {
							mem: prev.mem + cost.mem,
							cpu: prev.cpu + cost.cpu
						};
					} else {
						builtins[name] = cost;
					}
				}
			}
		};
		
		/** @type {string[]} */
		let messages = [];

		/**
		 * @type {(msg: string) => Promise<void>}
		 */
		callbacks.onPrint = async function(msg) {
			messages.push(msg);
		};

		let result = await this.run(args, callbacks, networkParams);

		return {
			mem: memCost,
			cpu: cpuCost,
			size: this.calcSize(),
			builtins: builtins,
			terms: terms,
			result: result,
			messages: messages
		};
	}

	/**
	 * Returns flat bytes of serialized script
	 * @returns {number[]}
	 */
	serializeBytes() {
		let bitWriter = new BitWriter();

		this.toFlat(bitWriter);

		return bitWriter.finalize();
	}

	/**
	 * Calculates the on chain size of the program (number of bytes).
	 * @returns {number}
	 */
	calcSize() {
		return this.serializeBytes().length;
	}

	/**
	 * Returns the Cbor encoding of a script (flat bytes wrapped twice in Cbor bytearray)
	 * @returns {number[]}
	 */
	toCbor() {
		return CborData.encodeBytes(CborData.encodeBytes(this.serializeBytes()));
	}

	/**
	 * Returns Plutus-core script in JSON format (as string, not as object!)
	 * @returns {string}
	 */
	serialize() {
		let cborHex = bytesToHex(this.toCbor());

		return `{"type": "${this.plutusScriptVersion()}", "description": "", "cborHex": "${cborHex}"}`;
	}

	/**
	 * @returns {number[]} - 28 byte hash
	 */
	hash() {
		let innerBytes = CborData.encodeBytes(this.serializeBytes());

		innerBytes.unshift(this.versionTag());

		// used for both script addresses and minting policy hashes
		return Crypto.blake2b(innerBytes, 28);
	}

	/**
	 * @type {ValidatorHash}
	 */
	get validatorHash() {
		assert(this.#purpose === null || this.#purpose === ScriptPurpose.Spending);

		return new ValidatorHash(this.hash());
	}

	/**
	 * @type {MintingPolicyHash}
	 */
	get mintingPolicyHash() {
		assert(this.#purpose === null || this.#purpose === ScriptPurpose.Minting);

		return new MintingPolicyHash(this.hash());
	}

	/**
	 * @type {StakingValidatorHash}
	 */
	get stakingValidatorHash() {
		assert(this.#purpose === null || this.#purpose === ScriptPurpose.Staking);

		return new StakingValidatorHash(this.hash());
	}

	/**
	 * @param {number[] | string} bytes 
	 * @returns {UplcProgram}
	 */
	static fromCbor(bytes) {
		if (typeof bytes == "string") {
			return UplcProgram.fromCbor(hexToBytes(bytes))
		} else {
			return deserializeUplcBytes(CborData.decodeBytes(CborData.decodeBytes(bytes)));
		}
	}
}

/**
 * Plutus-core deserializer creates a Plutus-core form an array of bytes
 */
 class UplcDeserializer extends BitReader {
	
	/**
	 * @param {number[]} bytes 
	 */
	constructor(bytes) {
		super(bytes);
	}

	/**
	 * @param {string} category 
	 * @returns {number}
	 */
	tagWidth(category) {
		assert(category in UPLC_TAG_WIDTHS, `unknown tag category ${category.toString()}`);

		return UPLC_TAG_WIDTHS[category];
	}

	/**
	 * Returns the name of a known builtin
	 * Returns the integer id if id is out of range (thus if the builtin is unknown)
	 * @param {number} id
	 * @returns {string | number}
	 */
	builtinName(id) {
		let all = UPLC_BUILTINS;

		if (id >= 0 && id < all.length) {
			return all[id].name;
		} else {
			console.error(`Warning: builtin id ${id.toString()} out of range`);

			return id;
		}
	}

	/**
	 * Reads a Plutus-core list with a specified size per element
	 * Calls itself recursively until the end of the list is reached
	 * @param {number} elemSize 
	 * @returns {number[]}
	 */
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

	/**
	 * Reads a single UplcTerm
	 * @returns {UplcTerm}
	 */
	readTerm() {
		let tag = this.readBits(this.tagWidth("term"));

		switch (tag) {
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
				return new UplcError(Site.dummy());
			case 7:
				return this.readBuiltin();
			default:
				throw new Error("term tag " + tag.toString() + " unhandled");
		}
	}

	/**
	 * Reads a single unbounded integer
	 * @param {boolean} signed 
	 * @returns {UplcInt}
	 */
	readInteger(signed = false) {
		let bytes = [];

		let b = this.readByte();
		bytes.push(b);

		while (!UplcInt.rawByteIsLast(b)) {
			b = this.readByte();
			bytes.push(b);
		}

		// strip the leading bit
		let res = new UplcInt(Site.dummy(), UplcInt.bytesToBigInt(bytes.map(b => UplcInt.parseRawByte(b))), false); // raw int is unsigned

		if (signed) {
			res = res.toSigned(); // unzigzag is performed here
		}

		return res;
	}

	/**
	 * Reads bytearray or string characters
	 * @returns {number[]}
	 */
	readBytes() {
		this.moveToByteBoundary(true);

		let bytes = [];

		let nChunk = this.readByte();

		while (nChunk > 0) {
			for (let i = 0; i < nChunk; i++) {
				bytes.push(this.readByte());
			}

			nChunk = this.readByte();
		}

		return bytes;
	}

	/**
	 * Reads a literal bytearray
	 * @returns {UplcByteArray}
	 */
	readByteArray() {
		let bytes = this.readBytes();

		return new UplcByteArray(Site.dummy(), bytes);
	}

	/**
	 * Reads a literal string
	 * @returns {UplcString}
	 */
	readString() {
		let bytes = this.readBytes();

		let s = bytesToText(bytes);

		return new UplcString(Site.dummy(), s);
	}

	/**
	 * @param {() => UplcValue} typedReader 
	 * @returns {UplcValue[]}
	 */
	readList(typedReader) {
		/** @type {UplcValue[]} */
		let items = [];

		while (this.readBits(1) == 1) {
			items.push(typedReader());
		}

		return items;
	}

	/**
	 * Reads a data object
	 * @returns {UplcData}
	 */
	readData() {
		let bytes = this.readBytes();

		return UplcData.fromCbor(bytes);
	}

	/**
	 * Reads a variable term
	 * @returns {UplcVariable}
	 */
	readVariable() {
		let index = this.readInteger()

		return new UplcVariable(Site.dummy(), index);
	}

	/**
	 * Reads a lambda expression term
	 * @returns {UplcLambda}
	 */
	readLambda() {
		let rhs = this.readTerm();

		return new UplcLambda(Site.dummy(), rhs);
	}

	/**
	 * Reads a function application term
	 * @returns {UplcCall}
	 */
	readCall() {
		let a = this.readTerm();
		let b = this.readTerm();

		return new UplcCall(Site.dummy(), a, b);
	}

	/**
	 * Reads a single constant
	 * @returns {UplcConst}
	 */
	readConstant() {
		let typeList = this.readLinkedList(this.tagWidth("constType"));

		let res = new UplcConst(this.readTypedValue(typeList));

		return res;
	}

	/**
	 * Reads a single constant
	 * @param {number[]} typeList 
	 * @returns {UplcValue}
	 */
	readTypedValue(typeList) {
		const typedReader = this.constructTypedReader(typeList);

		assertEq(typeList.length, 0, "Did not consume all type parameters");

		return typedReader();
	}

	/**
	 * Constructs a reader for a single construct recursively
	 * @param {number[]} typeList 
	 * NOTE: the implicit assumption is that this functions modifies the typeList
	 * by removing all elements that it "consumed" to define a type
	 * @returns {() => UplcValue}
	 */
	constructTypedReader(typeList){
		const type = assertDefined(typeList.shift());

		switch (type) {
			case 0: // signed Integer
				return () => this.readInteger(true);
			case 1: // bytearray
				return () => this.readByteArray();
			case 2: // utf8-string
				return () => this.readString();
			case 3:
				return () => new UplcUnit(Site.dummy()); // no reading needed
			case 4: // Bool
				return () => new UplcBool(Site.dummy(), this.readBits(1) == 1);
			case 5:
			case 6:
				throw new Error("unexpected type tag without type application");
			case 7:
				let containerType = assertDefined(typeList.shift());
				if (containerType == 5) {
					// typeList is consumed by the construct call, so make sure to read it before!
					const listType = UplcType.fromNumbers(typeList);
					const typeReader = this.constructTypedReader(typeList);

					return () => new UplcList(Site.dummy(), listType, this.readList(typeReader));
				} else {
					assertEq(containerType, 7, "Unexpected type tag");
					containerType = assertDefined(typeList.shift());
					if (containerType == 6) {
						// typeList is consumed by the construct call, so make sure to read it in correct order!
						const leftReader = this.constructTypedReader(typeList);
						const rightReader = this.constructTypedReader(typeList);
						return () => new UplcPair(Site.dummy(), leftReader(), rightReader())
					}
				}
			case 8:
				return () => new UplcDataValue(Site.dummy(), this.readData());
			default:
				throw new Error(`unhandled constant type ${type.toString()}`);
		}
	}

	/**
	 * Reads a delay term
	 * @returns {UplcDelay}
	 */
	readDelay() {
		let expr = this.readTerm();

		return new UplcDelay(Site.dummy(), expr);
	}

	/**
	 * Reads a force term
	 * @returns {UplcForce}
	 */
	readForce() {
		let expr = this.readTerm();

		return new UplcForce(Site.dummy(), expr);
	}

	/**
	 * Reads a builtin function ref term
	 * @returns {UplcBuiltin}
	 */
	readBuiltin() {
		let id = this.readBits(this.tagWidth("builtin"));

		let name = this.builtinName(id);

		return new UplcBuiltin(Site.dummy(), name);
	}

	/**
	 * Move to the next byteboundary
	 * (and check that we are at the end)
	 */
	finalize() {
		this.moveToByteBoundary(true);
	}
}

/**
 * @param {number[]} bytes 
 * @returns {UplcProgram}
 */
export function deserializeUplcBytes(bytes) {
	let reader = new UplcDeserializer(bytes);

	let version = [
		reader.readInteger(),
		reader.readInteger(),
		reader.readInteger(),
	];

	let versionKey = version.map(v => v.toString()).join(".");

	if (versionKey != UPLC_VERSION) {
		console.error(`Warning: Plutus-core script doesn't match version of Helios (expected ${UPLC_VERSION}, got ${versionKey})`);
	}

	let expr = reader.readTerm();

	reader.finalize();

	return new UplcProgram(expr, null, version);
}

/**
 * Parses a plutus core program. Returns a UplcProgram object
 * @param {string} jsonString 
 * @returns {UplcProgram}
 */
export function deserializeUplc(jsonString) {
	let obj = JSON.parse(jsonString);

	if (!("cborHex" in obj)) {
		throw UserError.syntaxError(new Source(jsonString), 0, 1, "cborHex field not in json")
	}

	let cborHex = obj.cborHex;
	if (typeof cborHex !== "string") {
		let src = new Source(jsonString);
		let re = /cborHex/;
		let cborHexMatch = jsonString.match(re);
		if (cborHexMatch === null) {
			throw UserError.syntaxError(src, 0, 1, "'cborHex' key not found");
		} else {
			const pos = jsonString.search(re)
			throw UserError.syntaxError(src, pos, pos+1, "cborHex not a string");
		}
	}

	return UplcProgram.fromCbor(hexToBytes(cborHex));
}


///////////////////////////
// Section 12: Tokenization
///////////////////////////

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

	/**
	 * @param {Source} src 
	 * @param {?CodeMap} codeMap 
	 */
	constructor(src, codeMap = null) {
		assert(src instanceof Source);

		this.#src = src;
		this.#pos = 0;
		this.#ts = []; // reset to empty to list at start of tokenize()
		this.#codeMap = codeMap; // can be a list of pairs [pos, site in another source]
		this.#codeMapPos = 0; // not used if codeMap === null
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
			this.readDecimalInteger(site, c);
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
	 * @param {string} c0 - first character
	 */
	readDecimalInteger(site, c0) {
		let chars = [];

		let c = c0;
		while (c != '\0') {
			if (c >= '0' && c <= '9') {
				chars.push(c);
			} else {
				if ((c >= '0' && c <= '9') || (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z')) {
					const errorSite = new Site(site.src, site.startPos, this.currentSite.startPos);

					errorSite.syntaxError("invalid syntax for decimal integer literal");
				}

				this.unreadChar();
				break;
			}

			c = this.readChar();
		}

		this.pushToken(
			new IntLiteral(
				new Site(site.src, site.startPos, this.currentSite.startPos),
				BigInt(chars.join(''))
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
	 * Reads literal string delimited by double quotes.
	 * Allows for three escape character: '\\', '\n' and '\t'
	 * @param {Site} site 
	 */
	readString(site) {
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

		this.pushToken(
			new StringLiteral(
				new Site(site.src, site.startPos, this.currentSite.startPos),
				chars.join('')
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
			if (!parseSecondChar('=')) {
				parseSecondChar('>');
			}
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
	buildGroup(ts) {
		const open = assertDefined(ts.shift()).assertSymbol();

		if (!open) {
			return null;
		}

		const stack = [open]; // stack of symbols
		let curField = [];
		let fields = [];

		/** @type {?SymbolToken} */
		let firstComma = null;

		/** @type {?SymbolToken} */
		let lastComma = null;

		/** @type {?Site} */
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

		const groupedFields = reduceNull(fields.map(f => this.nestGroups(f)));

		if (!groupedFields) {
			return null;
		}

		let site = open.site;

		if (endSite) {
			site = site.merge(endSite);
		}

		return new Group(site, open.value, groupedFields, firstComma);
	}

	/**
	 * Match group open with group close symbols in order to form groups.
	 * This is recursively applied to nested groups.
	 * @param {Token[]} ts 
	 * @returns {Token[] | null}
	 */
	nestGroups(ts) {
		/**
		 * @type {(Token | null)[]}
		 */
		let res = [];

		let t = ts.shift();
		while (t != undefined) {
			if (Group.isOpenSymbol(t)) {
				ts.unshift(t);

				res.push(this.buildGroup(ts));
			} else if (Group.isCloseSymbol(t)) {
				t.syntaxError(`unmatched '${assertDefined(t.assertSymbol()).value}'`);
			} else {
				res.push(t);
			}

			t = ts.shift();
		}

		return reduceNull(res);
	}
}

/**
 * Tokenizes a string (wrapped in Source)
 * Also used by VSCode plugin
 * @param {Source} src 
 * @returns {Token[] | null}
 */
export function tokenize(src) {
	let tokenizer = new Tokenizer(src);

	return tokenizer.tokenize();
}

/**
 * Tokenizes an IR string with a codemap to the original source
 * @package
 * @param {string} rawSrc 
 * @param {CodeMap} codeMap 
 * @returns {Token[]}
 */
function tokenizeIR(rawSrc, codeMap) {
	let src = new Source(rawSrc);

	// the Tokenizer for Helios can simply be reused for the IR
	let tokenizer = new Tokenizer(src, codeMap);

	const ts = tokenizer.tokenize();

	if (src.errors.length > 0) {
		throw src.errors[0];
	} else if (ts === null) {
		throw new Error("should've been thrown above");
	}

	return ts;
}



///////////////////////////////////
// Section 13: Helios eval entities
///////////////////////////////////

/**
 * We can't use StructStatement etc. directly because that would give circular dependencies
 * @typedef {{
 *   name: Word,
 *   getTypeMember(key: Word): EvalEntity,
 *   getInstanceMember(key: Word): Instance,
 *   nFields(site: Site): number,
 *   hasField(key: Word): boolean,
 *   getFieldType(site: Site, i: number): Type,
 * 	 getFieldIndex(site: Site, name: string): number,
 *   getFieldName(i: number): string,
 *   getConstrIndex(site: Site): number,
 *   nEnumMembers(site: Site): number,
 *   path: string,
 *   use: () => void
 * }} UserTypeStatement
 */

/**
 * We can't use ConstStatement directly because that would give a circular dependency
 * @typedef {{
 *   name: Word,
 *   path: string,
 *   use: () => void
 * }} ConstTypeStatement
 */

/**
 * We can't use EnumMember directly because that would give a circular dependency
 * @typedef {UserTypeStatement & {
 * 	 parent: EnumTypeStatement,
 *   getConstrIndex(site: Site): number
*  }} EnumMemberTypeStatement
 */

/**
 * We can't use EnumStatement directly because that would give a circular dependency
 * @typedef {UserTypeStatement & {
 *   type: Type,
 *   nEnumMembers(site: Site): number,
 *   getEnumMember(site: Site, i: number): EnumMemberTypeStatement
 * }} EnumTypeStatement
 */

/**
 * We can't use FuncStatement directly because that would give a circular dependency
 * @typedef {{
 *   path: string,
 *   use: () => void,
 *   setRecursive: () => void,
 *   isRecursive: () => boolean
 * }} RecurseableStatement
 */

/**
 * We can't use Scope directly because that would give a circular dependency
 * @typedef {{
 *   isRecursive: (statement: RecurseableStatement) => boolean
 * }} RecursivenessChecker
 */

/**
 * Base class of Instance and Type.
 * Any member function that takes 'site' as its first argument throws a TypeError if used incorrectly (eg. calling a non-FuncType).
 * @package
 */
class EvalEntity {
	constructor() {
		this.used_ = false;
	}

	/**
	 * @param {Site} site
	 * @returns {Type}
	 */
	assertType(site) {
		throw site.typeError("not a type");
	}

	/**
	 * @returns {boolean}
	 */
	isType() {
		throw new Error("not yet implemented");
	}

	/**
	 * @param {Site} site
	 * @returns {Instance}
	 */
	assertValue(site) {
		throw site.typeError("not a value");
	}

	/**
	 * @returns {boolean}
	 */
	isValue() {
		throw new Error("not yet implemented");
	}

	/**
	 * @returns {boolean}
	 */
	isUsed() {
		return this.used_;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		throw new Error("not yet implemented");
	}

	/**
	 * Used by Scope to mark named Values/Types as used.
	 * At the end of the Scope an error is thrown if any named Values/Types aren't used.
	 */
	markAsUsed() {
		this.used_ = true;
	}

	/**
	 * Gets type of a value. Throws error when trying to get type of type.
	 * @param {Site} site
	 * @returns {Type}
	 */
	getType(site) {
		throw new Error("not yet implemented");
	}

	/**
	 * Returns 'true' if 'this' is a base-type of 'type'. Throws an error if 'this' isn't a Type.
	 * @param {Site} site
	 * @param {Type} type
	 * @returns {boolean}
	 */
	isBaseOf(site, type) {
		throw new Error("not yet implemented");
	}

	/**
	 * Returns 'true' if 'this' is an instance of 'type'. Throws an error if 'this' isn't a Instance.
	 * 'type' can be a class, or a class instance.
	 * @param {Site} site 
	 * @param {Type | TypeClass} type 
	 * @returns {boolean}
	 */
	isInstanceOf(site, type) {
		throw new Error("not yet implemented");
	}

	/**
	 * Returns the return type of a function (wrapped as a Instance) if the args have the correct types. 
	 * Throws an error if 'this' isn't a function value, or if the args don't correspond.
	 * @param {Site} site 
	 * @param {Instance[]} args
	 * @param {{[name: string]: Instance}} namedArgs
	 * @returns {Instance}
	 */
	call(site, args, namedArgs = {}) {
		throw new Error("not yet implemented");
	}

	/**
	 * Gets a member of a Type (i.e. the '::' operator).
	 * Throws an error if the member doesn't exist or if 'this' isn't a DataType.
	 * @param {Word} name
	 * @returns {EvalEntity} - can be Instance or Type
	 */
	getTypeMember(name) {
		throw new Error("not yet implemented");
	}

	/**
	 * Gets a member of a Instance (i.e. the '.' operator).
	 * Throws an error if the member doesn't exist or if 'this' isn't a DataInstance.
	 * @param {Word} name
	 * @returns {Instance} - can be FuncInstance or DataInstance
	 */
	getInstanceMember(name) {
		throw new Error("not yet implemented");
	}

	/**
	 * Returns the number of fields in a struct.
	 * Used to check if a literal struct constructor is correct.
	 * @param {Site} site
	 * @returns {number}
	 */
	nFields(site) {
		throw new Error("not yet implemented");
	}

	/**
	 * Returns the type of struct or enumMember fields.
	 * Used to check if literal struct constructor is correct.
	 * @param {Site} site
	 * @param {number} i
	 * @returns {Type}
	 */
	getFieldType(site, i) {
		throw new Error("not yet implemented");
	}

	/**
	 * Returns the index of struct or enumMember fields.
	 * Used to order literal struct fields.
	 * @param {Site} site
	 * @param {string} name
	 * @returns {number}
	 */
	getFieldIndex(site, name) {
		throw new Error("not yet implemented");
	}

	/**
	 * Returns the constructor index so Plutus-core data can be created correctly.
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		throw new Error("not yet implemented");
	}
}

/**
 * Types are used during type-checking of Helios
 * @package
 */
class Type extends EvalEntity {
	constructor() {
		super();
	}

	/**
	 * Compares two types. Throws an error if neither is a Type.
	 * @example
	 * Type.same(Site.dummy(), new IntType(), new IntType()) => true
	 * @param {Site} site 
	 * @param {Type} a 
	 * @param {Type} b 
	 * @returns {boolean}
	 */
	static same(site, a, b) {
		return a.isBaseOf(site, b) && b.isBaseOf(site, a);
	}

	/**
	 * @returns {boolean}
	 */
	isType() {
		return true;
	}

	/**
	 * @param {Site} site
	 * @returns {Type}
	 */
	assertType(site) {
		return this;
	}

	/**
	 * @returns {boolean}
	 */
	isValue() {
		return false;
	}

	/**
	 * Returns the underlying Type. Throws an error in this case because a Type can't return another Type.
	 * @param {Site} site 
	 * @returns {Type}
	 */
	getType(site) {
		throw site.typeError(`can't use getType(), '${this.toString()}' isn't an instance`);
	}

	/**
	 * Throws an error because a Type can't be an instance of another Type.
	 * @param {Site} site 
	 * @param {Type | TypeClass} type
	 * @returns {boolean}
	 */
	isInstanceOf(site, type) {
		throw site.typeError(`can't use isInstanceOf(), '${this.toString()}' isn't an instance`);
	}

	/**
	 * Throws an error because a Type isn't callable.
	 * @param {Site} site 
	 * @param {Instance[]} args 
	 * @param {{[name: string]: Instance}} namedArgs
	 * @returns {Instance}
	 */
	call(site, args, namedArgs = {}) {
		throw site.typeError("not callable");
	}

	/**
	 * @returns {boolean}
	 */
	isEnumMember() {
		return false;
	}

	/**
	 * Throws error for non-enum members
	 * @param {Site} site 
	 * @returns {Type}
	 */
	parentType(site) {
		throw site.typeError(`'${this.toString}' isn't an enum member`);
	}

	/**
	 * Returns number of members of an enum type
	 * Throws an error if not an enum type
	 * @param {Site} site
	 * @returns {number}
	 */
	nEnumMembers(site) {
		throw site.typeError(`'${this.toString()}' isn't an enum type`);
	}

	/**
	 * Returns the base path in the IR (eg. __helios__bool, __helios__error, etc.)
	 * @type {string}
	 */
	get path() {
		throw new Error("not yet implemented");
	}

	/**
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		throw new Error(`${this.toString()} doesn't have a corresponding userType`);
	}
}


/**
 * AnyType matches any other type in the type checker.
 * @package
 */
class AnyType extends Type {
	constructor() {
		super();
	}

	/**
	 * @param {Site} site 
	 * @param {Type} other 
	 * @returns {boolean}
	 */
	isBaseOf(site, other) {
		return true;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return "Any";
	}
}

/**
 * Base class of non-FuncTypes.
 */
class DataType extends Type {
	constructor() {
		super();
	}

	/**
	 * @param {Site} site 
	 * @param {Type} type 
	 * @returns {boolean}
	 */
	isBaseOf(site, type) {
		type = ParamType.unwrap(type, this);

		return Object.getPrototypeOf(this) == Object.getPrototypeOf(type);
	}
}

/**
 * Matches everything except FuncType.
 * Used by find_datum_hash.
 */
class AnyDataType extends Type {
	constructor() {
		super();
	}

	/**
	 * @param {Site} site
	 * @param {Type} type
	 * @returns {boolean}
	 */
	isBaseOf(site, type) {
		return !(type instanceof FuncType);
	}
}

/**
 * Base class of all builtin types (eg. IntType)
 * Note: any builtin type that inherits from BuiltinType must implement get path()
 * @package
 */
class BuiltinType extends DataType {
	#macrosAllowed; // macros are allowed after the definition of the main function

	constructor() {
		super();
		this.#macrosAllowed = false;
	}

	allowMacros() {
		this.#macrosAllowed = true;
	}

	get macrosAllowed() {
		return this.#macrosAllowed;
	}

	/**
	 * Returns Type member (i.e. '::' operator).
	 * @param {Word} name
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "__eq":
			case "__neq":
				return Instance.new(new FuncType([this, this], new BoolType()));
			case "from_data":
				return Instance.new(new FuncType([new RawDataType()], this));
			default:
				throw name.referenceError(`${this.toString()}::${name.value} undefined`);
		}
	}

	/**
	 * Returns one of default instance members, or throws an error.
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "serialize":
				return Instance.new(new FuncType([], new ByteArrayType()));
			default:
				throw name.referenceError(`${this.toString()}.${name.value} undefined`);
		}
	}

	/**
	 * Returns the number of data fields in a builtin type (not yet used)
	 * @param {Site} site 
	 * @returns {number}
	 */
	nFields(site) {
		return 0;
	}

	/**
	 * Returns the constructor index of a builtin type (eg. 1 for Option::None).
	 * By default non-enum builtin types that are encoded as Plutus-core data use the '0' constructor index.
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return 0;
	}

	/**
	 * Use 'path' getter instead of 'toIR()' in order to get the base path.
	 */
	toIR() {
		throw new Error("use path getter instead");
	}
}

/**
 * @package
 */
class BuiltinEnumMember extends BuiltinType {
	#parentType;

	/**
	 * @param {BuiltinType} parentType 
	 */
	constructor(parentType) {
		super();
		this.#parentType = parentType;
	}

	/**
	 * @returns {boolean}
	 */
	isEnumMember() {
		return true;
	}

	/**
	 * @param {Site} site 
	 * @returns {Type}
	 */
	parentType(site) {
		return this.#parentType;
	}

	/**
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "__eq":
			case "__neq":
				return Instance.new(new FuncType([this.#parentType, this.#parentType], new BoolType()));
			case "from_data":
				throw name.referenceError(`'${this.toString()}::from_data' undefined`);
			default:
				return super.getTypeMember(name);
		}
	}
	
	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			default:
				return super.getInstanceMember(name);
		}
	}
}

/**
 * Type wrapper for Struct statements and Enums and Enum members.
 * @package
 * @template {UserTypeStatement} T
 */
class StatementType extends DataType {
	#statement;

	/**
	 * @param {T} statement 
	 */
	constructor(statement) {
		super();
		this.#statement = statement;
	}

	/**
	 * @type {string}
	 */
	get name() {
		return this.#statement.name.value;
	}

	/**
	 * @returns {T}
	 */
	get statement() {
		return this.#statement;
	}

	/**
	 * @param {Site} site 
	 * @param {Type} type 
	 * @returns {boolean}
	 */
	isBaseOf(site, type) {
		type = ParamType.unwrap(type, this);

		if (type instanceof StatementType) {
			return type.path.startsWith(this.path);
		} else {
			return false;
		}
	}

	/**
	 * Returns the name of the type.
	 * @returns {string}
	 */
	toString() {
		return this.#statement.name.toString();
	}

	/**
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		return this.#statement.getTypeMember(name);
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		return this.#statement.getInstanceMember(name);
	}

	/**
	 * Returns the number of fields in a Struct or in an EnumMember.
	 * @param {Site} site 
	 * @returns {number}
	 */
	nFields(site) {
		return this.#statement.nFields(site);
	}

	/**
	 * Returns the i-th field of a Struct or an EnumMember
	 * @param {Site} site
	 * @param {number} i
	 * @returns {Type}
	 */
	getFieldType(site, i) {
		return this.#statement.getFieldType(site, i);
	}

	/**
	 * Returns the index of a named field of a Struct or an EnumMember
	 * @param {Site} site
	 * @param {string} name
	 * @returns {number}
	 */
	getFieldIndex(site, name) {
		return this.#statement.getFieldIndex(site, name);
	}

	/**
	 * Returns the constructor index so that __core__constrData can be called correctly.
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return this.#statement.getConstrIndex(site);
	}

	/**
	 * Returns the number of members of an EnumStatement
	 * @param {Site} site
	 * @returns {number}
	 */
	nEnumMembers(site) {
		return this.#statement.nEnumMembers(site);
	}

	get path() {
		return this.#statement.path;
	}

	/**
	 * A StatementType can instantiate itself if the underlying statement is an enum member with no fields
	 * @param {Site} site
	 * @returns {Instance}
	 */
	assertValue(site) {
		throw site.typeError(`expected a value, got a type`);
	}
}

/**
 * @package
 * @extends {StatementType<UserTypeStatement>}
 */
class StructStatementType extends StatementType {
	/**
	 * @param {UserTypeStatement} statement - can't use StructStatement because that would give a circular dependency
	 */
	constructor(statement) {
		super(statement);
	}

	/**
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		const statement = this.statement;

		const nFields = this.nFields(Site.dummy());

		/**
		 * @type {[string, Type][]} - [name, type]
		 */
		const fields = [];

		for (let i = 0; i < nFields; i++) {
			fields.push([statement.getFieldName(i), statement.getFieldType(Site.dummy(), i)]);
		}

		class Struct extends HeliosData {
			/**
			 * So we can access fields by index
			 * @type {HeliosData[]}
			 */
			#fields;

			/**
			 * @param  {...any} args
			 */
			constructor(...args) {
				super();
				if (args.length != nFields) {
					throw new Error(`expected ${nFields} args, got ${args.length}`);
				}

				this.#fields = [];

				args.forEach((arg, i) => {
					const [fieldName, fieldType] = fields[i];
					const FieldClass = fieldType.userType;

					const instance = arg instanceof FieldClass ? arg : new FieldClass(arg);

					this.#fields.push(instance);
					this[fieldName] = instance;
				});
			}

			/**
			 * Overload 'instanceof' operator
			 * @param {any} other 
			 * @returns {boolean}
			 */
			static [Symbol.hasInstance](other) {
				return (other._structStatement === statement) && (other instanceof HeliosData);
			}

			/**
			 * @type {UserTypeStatement}
			 */
			get _structStatement() {
				return statement;
			}

			/**
			 * @returns {UplcData}
			 */
			_toUplcData() {
				if (this.#fields.length == 1) {
					return this.#fields[0]._toUplcData();
				} else {
					return new ListData(this.#fields.map(f => f._toUplcData()));
				}
			}

			/**
			 * @param {string | number[]} bytes 
			 * @returns {Struct}
			 */
			static fromUplcCbor(bytes) {
				return Struct.fromUplcData(UplcData.fromCbor(bytes));
			}

			/**
			 * @param {UplcData} data 
			 * @returns {Struct}
			 */
			static fromUplcData(data) {
				const dataItems = data.list;

				if (dataItems.length != nFields) {
					throw new Error("unexpected number of fields");
				}

				const args = dataItems.map((item, i) => {
					return fields[i][1].userType.fromUplcData(item);
				});

				return new Struct(...args);
			}
		}

		Object.defineProperty(Struct, "name", {value: this.name, writable: false});		

		return Struct;
	}
}

/**
 * @package
 * @extends {StatementType<EnumTypeStatement>}
 */
class EnumStatementType extends StatementType {
	/**
	 * @param {EnumTypeStatement} statement - can't use EnumStatement because that would give a circular dependency
	 */
	constructor(statement) {
		super(statement);
	}

	/**
	 * @package
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		const statement = this.statement;

		const nVariants = statement.nEnumMembers(Site.dummy());

		/**
		 * @type {HeliosDataClass<HeliosData>[]}
		 */
		const variants = [];

		for (let i = 0; i < nVariants; i++) {
			variants.push(
				(new EnumMemberStatementType(statement.getEnumMember(Site.dummy(), i))).userType
			);
		}

		class Enum extends HeliosData {
			constructor() {
				super();
				throw new Error("can't be constructed (hint: construct an enum)");
			}

			/**
			 * Overload 'instanceof' operator
			 * @param {any} other 
			 * @returns {boolean}
			 */
			static [Symbol.hasInstance](other) {
				return (other._enumStatement === statement) && (other instanceof HeliosData);
			}

			/**
			 * @type {EnumTypeStatement}
			 */
			get _enumStatement() {
				return statement;
			}

			/**
			 * @param {string | number[]} bytes
			 * @returns {HeliosData}
			 */
			static fromUplcCbor(bytes) {
				return Enum.fromUplcData(UplcData.fromCbor(bytes));
			}

			/**
			 * @param {UplcData} data 
			 * @returns {HeliosData}
			 */
			static fromUplcData(data) {
				const variant = assertDefined(variants[data.index], "index out of range");

				return variant.fromUplcData(data);
			}
		}

		Object.defineProperty(Enum, "name", {value: this.name, writable: false});

		for (let v of variants) {
			Object.defineProperty(Enum, v.name, {value: v, writable: false});
		}

		return Enum;
	}
}

/**
 * @package
 * @extends {StatementType<EnumMemberTypeStatement>}
 */
class EnumMemberStatementType extends StatementType {
    /**
     * @param {EnumMemberTypeStatement} statement - can't use EnumMember because that would give a circular dependency
     */
    constructor(statement) {
        super(statement);
    }

	/**
	 * @returns {boolean}
	 */
	isEnumMember() {
		return true;
	}

	/**
	 * @param {Site} site 
	 * @returns {Type}
	 */
	parentType(site) {
		return this.statement.parent.type;
	}

    /**
	 * A StatementType can instantiate itself if the underlying statement is an enum member with no fields
	 * @package
	 * @param {Site} site
	 * @returns {Instance}
	 */
    assertValue(site) {
        if (this.statement.nFields(site) == 0) {
            return Instance.new(this);
        } else {
            throw site.typeError(`expected '{...}' after '${this.statement.name.toString()}'`);
        }
    }

	/**
	 * @package
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		const statement = this.statement;

		const enumStatement = statement.parent;

		const index = statement.getConstrIndex(Site.dummy());

		const nFields = this.nFields(Site.dummy());

		/**
		 * @type {[string, Type][]} - [name, type]
		 */
		const fields = [];

		for (let i = 0; i < nFields; i++) {
			fields.push([statement.getFieldName(i), statement.getFieldType(Site.dummy(), i)]);
		}

		// similar to Struct
		class EnumVariant extends HeliosData {
			/**
			 * So we can access fields by index
			 * @type {HeliosData[]}
			 */
			#fields;

			/**
			 * @param  {...any} args
			 */
			constructor(...args) {
				super();
				if (args.length != nFields) {
					throw new Error(`expected ${nFields} args, got ${args.length}`);
				}
 
				this.#fields = [];
 
				args.forEach((arg, i) => {
					const [fieldName, fieldType] = fields[i];
					const FieldClass = fieldType.userType;
 
					const instance = arg instanceof FieldClass ? arg : new FieldClass(arg);

 					this.#fields.push(instance);
					this[fieldName] = instance;

				});
			}
 
			/**
			 * Overload 'instanceof' operator
			 * @param {any} other 
			 * @returns {boolean}
			 */
			static [Symbol.hasInstance](other) {
				return (other._enumVariantStatement === statement) && (other instanceof HeliosData);
			}
 
			/**
			 * @type {EnumTypeStatement}
			 */
			get _enumStatement() {
				return enumStatement;
			}

			/**
			 * @type {EnumMemberTypeStatement}
			 */
			get _enumVariantStatement() {
				return statement;
			}
 
			/**
			 * @returns {UplcData}
			 */
			_toUplcData() {
				return new ConstrData(index, this.#fields.map(f => f._toUplcData()));
			}
 
			/**
			 * @param {string | number[]} bytes 
			 * @returns {EnumVariant}
			 */
			static fromUplcCbor(bytes) {
				return EnumVariant.fromUplcData(UplcData.fromCbor(bytes));
			}
 
			/**
			 * @param {UplcData} data 
			 * @returns {EnumVariant}
			 */
			static fromUplcData(data) {
				assert(data.index == index, "wrong index");

				const dataItems = data.list;
 
				if (dataItems.length != nFields) {
					throw new Error("unexpected number of fields");
				}
 
				const args = dataItems.map((item, i) => {
					return fields[i][1].userType.fromUplcData(item);
				});
 
				return new EnumVariant(...args);
			}
		}

		Object.defineProperty(EnumVariant, "name", {value: this.name, writable: false});

		return EnumVariant;
	}
}

/**
 * @package
 */
class ArgType {
	#name;
	#type;
	#optional;

	/**
	 * 
	 * @param {null | Word} name 
	 * @param {Type} type 
	 * @param {boolean} optional 
	 */
	constructor(name, type, optional = false) {
		this.#name = name;
		this.#type = type;
		this.#optional = optional;
	}

	/**
	 * @type {string}
	 */
	get name() {
		if (this.#name === null) {
			return "";
		} else {
			return this.#name.toString();
		}
	}
	/**
	 * @type {Type}
	 */
	get type() {
		return this.#type;
	}

	/**
	 * @returns {boolean}
	 */
	isNamed() {
		return this.#name !== null;
	}

	/**
	 * @returns {boolean}
	 */
	isOptional() {
		return this.#optional;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return [
			this.#name != null ? `${this.#name.toString()}: ` : "",
			this.#optional ? "?" : "",
			this.#type.toString()
		].join("");
	}

	/**
	 * @param {Site} site 
	 * @param {ArgType} other 
	 * @returns {boolean}
	 */
	isBaseOf(site, other) {
		// if this arg has a default value, the other arg must also have a default value
		if (this.#optional && !other.#optional) {
			return false;
		}

		// if this is named, the other must be named as well
		if (this.#name != null) {
			return this.#name.toString() == (other.#name?.toString() ?? "");
		}

		if (this.#type instanceof ParamType) {
			this.#type.setType(site, other.#type);
		} else {
			if (!other.#type.isBaseOf(site, this.#type)) { // note the reversal of the check
				return false;
			}
		}

		return true;
	}
}

/**
 * Function type with arg types and a return type
 * @package
 */
class FuncType extends Type {
	/**
	 * @type {ArgType[]}
	 */
	#argTypes;

	/**
	 * @type {Type[]}
	 */
	#retTypes;

	/**
	 * @param {Type[] | ArgType[]} argTypes 
	 * @param {Type | Type[]} retTypes 
	 */
	constructor(argTypes, retTypes) {
		super();
		this.#argTypes = argTypes.map(at => {
			if (at instanceof Type) {
				return new ArgType(null, at);
			} else {
				return at;
			}
		});

		if (!Array.isArray(retTypes)) {
			retTypes = [retTypes];
		}

		this.#retTypes = retTypes;
	}

	/**
	 * @type {number}
	 */
	get nArgs() {
		return this.#argTypes.length;
	}

	/**
	 * @type {number}
	 */
	get nNonOptArgs() {
		return this.#argTypes.filter(at => !at.isOptional()).length;
	}

	/**
	 * @type {number}
	 */
	get nOptArgs() {
		return this.#argTypes.filter(at => at.isOptional()).length;
	}

	/**
	 * @type {Type[]}
	 */
	get argTypes() {
		return this.#argTypes.slice().map(at => at.type);
	}

	/**
	 * @type {Type[]}
	 */
	get retTypes() {
		return this.#retTypes;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		if (this.#retTypes.length === 1) {
			return `(${this.#argTypes.map(a => a.toString()).join(", ")}) -> ${this.#retTypes.toString()}`;
		} else {
			return `(${this.#argTypes.map(a => a.toString()).join(", ")}) -> (${this.#retTypes.map(t => t.toString()).join(", ")})`;
		}
	}

	/**
	 * Checks if the type of the first arg is the same as 'type'
	 * Also returns false if there are no args.
	 * For a method to be a valid instance member its first argument must also be named 'self', but that is checked elsewhere
	 * @param {Site} site 
	 * @param {Type} type 
	 * @returns {boolean}
	 */
	isMaybeMethod(site, type) {
		if (this.#argTypes.length > 0) {
			return Type.same(site, this.#argTypes[0].type, type);
		} else {
			return false;
		}
	}

	/** 
	 * Checks if any of 'this' argTypes or retType is same as Type.
	 * Only if this checks return true is the association allowed.
	 * @param {Site} site
	 * @param {Type} type
	 * @returns {boolean}
	 */
	isAssociated(site, type) {
		for (let arg of this.#argTypes) {
			if (Type.same(site, arg.type, type)) {
				return true;
			}
		}

		for (let rt of this.#retTypes) {
			if (Type.same(site, type, rt)) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Checks if 'this' is a base type of another FuncType.
	 * The number of args needs to be the same.
	 * Each argType of the FuncType we are checking against needs to be the same or less specific (i.e. isBaseOf(this.#argTypes[i]))
	 * The retType of 'this' needs to be the same or more specific
	 * @param {Site} site 
	 * @param {Type} other 
	 * @returns {boolean}
	 */
	isBaseOf(site, other) {
		if (other instanceof FuncType) {
			if (this.nNonOptArgs != other.nNonOptArgs) {
				return false;
			} else {
				for (let i = 0; i < this.nNonOptArgs; i++) {
					if (!this.#argTypes[i].isBaseOf(site, other.#argTypes[i])) {
						return false;
					}
				}

				if (this.#retTypes.length === other.#retTypes.length) {
					for (let i = 0; i < this.#retTypes.length; i++) {
						if (!this.#retTypes[i].isBaseOf(site, other.#retTypes[i])) {
							return false;
						}
					}

					return true;
				} else {
					return false;
				}
			}

		} else {
			return false;
		}
	}
	
	/**
	 * Throws an error if name isn't found
	 * @param {Site} site 
	 * @param {string} name 
	 * @returns {number}
	 */
	getNamedIndex(site, name) {
		const i = this.#argTypes.findIndex(at => at.name == name);

		if (i == -1) {
			throw site.typeError(`arg name ${name} not found`);
		} else {
			return i;
		}
	}

	/**
	 * Checks if arg types are valid.
	 * Throws errors if not valid. Returns the return type if valid. 
	 * @param {Site} site 
	 * @param {Instance[]} posArgs
	 * @param {{[name: string]: Instance}} namedArgs
	 * @returns {Type[]}
	 */
	checkCall(site, posArgs, namedArgs = {}) {
		if (posArgs.length < this.nNonOptArgs) {
			// check if each nonOptArg is covered by the named args
			for (let i = 0; i < this.nNonOptArgs; i++) {
				if (!this.#argTypes[i].isNamed()) {
					throw site.typeError(`expected at least ${this.#argTypes.filter(at => !at.isNamed()).length} positional arg(s), got ${posArgs.length} positional arg(s)`);
				} else {
					if (!(this.#argTypes[i].name in namedArgs)) {
						throw site.typeError(`named arg ${this.#argTypes[i].name} missing from call`);
					}
				}
			}

		} else if (posArgs.length > this.#argTypes.length) {
			throw site.typeError(`expected at most ${this.#argTypes.length} arg(s), got ${posArgs.length} arg(s)`);
		}

		for (let i = 0; i < posArgs.length; i++) {
			if (!posArgs[i].isInstanceOf(site, this.#argTypes[i].type)) {
				throw site.typeError(`expected '${this.#argTypes[i].type.toString()}' for arg ${i + 1}, got '${posArgs[i].toString()}'`);
			}
		}

		for (let key in namedArgs) {
			const i = this.#argTypes.findIndex(at => at.name == key);

			if (i == -1) {
				throw site.typeError(`arg named ${key} not found in function type ${this.toString()}`);
			}

			if (i < posArgs.length) {
				throw site.typeError(`named arg '${key}' already covered by positional arg ${i+1}`);
			}

			const thisArg = this.#argTypes[i];

			if (!namedArgs[key].isInstanceOf(site, thisArg.type)) {
				throw site.typeError(`expected '${thisArg.type.toString()}' for arg '${key}', got '${namedArgs[key].toString()}`);
			}
		}

		return this.#retTypes;
	}
}

class NotType extends EvalEntity {
	constructor() {
		super();
	}
	
	/**
	 * @returns {boolean}
	 */
	isType() {
		return false;
	}

	/**
	 * Throws an error because NotType can't be a base-Type of anything.
	 * @param {Site} site 
	 * @param {Type} type 
	 * @returns {boolean}
	 */
	isBaseOf(site, type) {
		throw site.typeError("not a type");
	}

	/**
	 * @param {Word} name
	 * @returns {EvalEntity} - can be Instance or Type
	 */
	getTypeMember(name) {
		throw new Error("not a type");
	}
}

/**
 * Base class for DataInstance and FuncInstance
 * @package
 */
class Instance extends NotType {
	constructor() {
		super();
	}

	/**
	 * @param {Type | Type[]} type 
	 * @returns {Instance}
	 */
	static new(type) {
		if (Array.isArray(type)) {
			if (type.length === 1) {
				return Instance.new(type[0]);
			} else {
				return new MultiInstance(type.map(t => Instance.new(t)));
			}
		} else if (type instanceof FuncType) {
			return new FuncInstance(type);
		} else if (type instanceof ParamType) {
			const t = type.type;
			if (t == null) {
				throw new Error("expected non-null type");
			} else {
				return Instance.new(t);
			}
		} else if (type instanceof ErrorType) {
			return new ErrorInstance();
		} else if (type instanceof VoidType) {
			return new VoidInstance();
		} else {
			return new DataInstance(type);
		}
	}

	/**
	 * @returns {boolean}
	 */
	isValue() {
		return true;
	}

	/**
	 * @param {Site} site
	 * @returns {Instance}
	 */
	assertValue(site) {
		return this;
	}
}


/**
 * A regular non-Func Instance. DataValues can always be compared, serialized, used in containers.
 * @package
 */
class DataInstance extends Instance {
	#type;

	/**
	 * @param {DataType} type 
	 */
	constructor(type) {
		assert(!(type instanceof FuncType));

		super();
		this.#type = type;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return this.#type.toString();
	}

	/**
	 * Gets the underlying Type.
	 * @param {Site} site 
	 * @returns {Type}
	 */
	getType(site) {
		return this.#type;
	}

	/**
	 * @typedef {new(...any) => Type} TypeClass
	 */

	/**
	 * Checks if 'this' is instance of 'type'.
	 * 'type' can be a class, or a class instance.
	 * @param {Site} site 
	 * @param {Type | TypeClass} type 
	 * @returns 
	 */
	isInstanceOf(site, type) {
		if (typeof type == 'function') {
			return this.#type instanceof type;
		} else {
			return type.isBaseOf(site, this.#type);
		}
	}

	/**
	 * Returns the number of fields of a struct, enum member, or builtin type.
	 * @param {Site} site 
	 * @returns {number}
	 */
	nFields(site) {
		return this.#type.nFields(site);
	}

	/**
	 * Returns the i-th field of a Struct or an EnumMember
	 * @param {Site} site
	 * @param {number} i
	 * @returns {Type}
	 */
	getFieldType(site, i) {
		return this.#type.getFieldType(site, i);
	}

	/**
	 * Returns the index of a named field
	 * @param {Site} site 
	 * @param {string} name 
	 * @returns {number}
	 */
	getFieldIndex(site, name) {
		return this.#type.getFieldIndex(site, name);
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		return this.#type.getInstanceMember(name);
	}

	/**
	 * Throws an error bec
	 * @param {Site} site 
	 * @param {Instance[]} args 
	 * @param {{[name: string]: Instance}} namedArgs
	 * @returns {Instance}
	 */
	call(site, args, namedArgs = {}) {
		throw site.typeError("not callable");
	}
}

/**
 * @package
 */
class ConstStatementInstance extends DataInstance {
	#statement;

	/**
	 * @param {DataType} type 
	 * @param {ConstTypeStatement} statement - can't use ConstStatement because that would give circular dependency
	 */
	constructor(type, statement) {
		super(type);
		this.#statement = statement;
	}

	/**
	 * @type {ConstTypeStatement}
	 */
	get statement() {
		return this.#statement
	}
}

/**
 * A callable Instance.
 * @package
 */
class FuncInstance extends Instance {
	#type;

	/**
	 * @param {FuncType} type 
	 */
	constructor(type) {
		assert(type instanceof FuncType);

		super();
		this.#type = type;
	}

	/**
	 * @param {RecursivenessChecker} scope
	 * @returns {boolean}
	 */
	isRecursive(scope) {
		return false;
	}

	/**
	 * Returns a string representing the type.
	 * @returns {string}
	 */
	toString() {
		return this.#type.toString();
	}

	/**
	 * Returns the underlying FuncType as Type.
	 * @param {Site} site
	 * @returns {Type}
	 */
	getType(site) {
		return this.#type;
	}

	/**
	 * Returns the underlying FuncType directly.
	 * @returns {FuncType}
	 */
	getFuncType() {
		return this.#type;
	}

	/**
	 * Checks if 'this' is an instance of 'type'.
	 * Type can be a class or a class instance. 
	 * @param {Site} site 
	 * @param {Type | TypeClass} type 
	 * @returns {boolean}
	 */
	isInstanceOf(site, type) {
		if (typeof type == 'function') {
			return this.#type instanceof type;
		} else {
			return type.isBaseOf(site, this.#type);
		}
	}

	/**
	 * @param {Site} site 
	 * @param {Instance[]} args 
	 * @param {{[name: string]: Instance}} namedArgs
	 * @returns {Instance}
	 */
	call(site, args, namedArgs = {}) {
		return Instance.new(this.#type.checkCall(site, args, namedArgs));
	}

	/**
	 * Throws an error because a function value doesn't have any fields.
	 * @param {Site} site 
	 * @returns {number}
	 */
	nFields(site) {
		throw site.typeError("a function doesn't have fields");
	}

	/**
	 * Throws an error because a function value doesn't have any fields.
	 * @param {Site} site
	 * @param {number} i
	 * @returns {Type}
	 */
	getFieldType(site, i) {
		throw site.typeError("a function doesn't have fields");
	}

	/**
	 * Throws an error because a function value have any fields.
	 * @param {Site} site 
	 * @param {string} name 
	 * @returns {number}
	 */
	getFieldIndex(site, name) {
		throw site.typeError("a function doesn't have fields");
	}

	/**
	 * Throws an error because a function value doesn't have members.
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		throw name.typeError("a function doesn't have any members");
	}
}

/**
 * Special function value class for top level functions because they can be used recursively.
 * @package
 */
class FuncStatementInstance extends FuncInstance {
	#statement

	/**
	 * @param {FuncType} type 
	 * @param {RecurseableStatement} statement - can't use FuncStatement because that would give circular dependency
	 */
	constructor(type, statement) {
		super(type);
		this.#statement = statement;
	}

	/**
	 * @type {RecurseableStatement}
	 */
	get statement() {
		return this.#statement;
	}

	/**
	 * @param {RecursivenessChecker} scope
	 * @returns {boolean}
	 */
	isRecursive(scope) {
		if (this.#statement.isRecursive()) {
			return true;
		} else {
			return scope.isRecursive(this.#statement);
		}
	}
}

/**
 * Wraps multiple return values
 * @package
 */
class MultiInstance extends Instance {
	#values;

	/**
	 * @param {Instance[]} values 
	 */
	constructor(values) {
		super();
		this.#values = values;
	}

	get values() {
		return this.#values;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `(${this.#values.map(v => v.toString()).join(", ")})`;
	}

	/**
	 * @param {Instance[]} vals
	 * @returns {Instance[]}
	 */
	static flatten(vals) {
		/**
		 * @type {Instance[]}
		 */
		let result = [];

		for (let v of vals) {
			if (v instanceof MultiInstance) {
				result = result.concat(v.values);
			} else {
				result.push(v);
			}
		}

		return result;
	}
}

/**
 * Returned by functions that don't return anything (eg. assert, error, print)
 * @package
 */
class VoidInstance extends Instance {
	constructor() {
		super();
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return "()"
	}

	/**
	 * @param {Site} site 
	 * @param {Type | TypeClass} type 
	 * @returns {boolean}
	 */
	isInstanceOf(site, type) {
		return type instanceof VoidType;
	}

	/**
	 * @param {Site} site 
	 * @returns {Type}
	 */
	getType(site) {
		return new VoidType();
	}

	/**
	 * @param {Site} site 
	 * @param {Instance[]} args
	 * @param {{[name: string]: Instance}} namedArgs
	 * @returns {Instance}
	 */
	call(site, args, namedArgs = {}) {
		throw new Error("can't call void");
	}

	/**
	 * @param {Word} name
	 * @returns {Instance} - can be FuncInstance or DataInstance
	 */
	getInstanceMember(name) {
		throw new Error("can't get member of void");
	}

	/**
	 * @param {Site} site
	 * @returns {number}
	 */
	nFields(site) {
		throw new Error("can't get nFields of void");
	}

	/**
	 * @param {Site} site
	 * @param {number} i
	 * @returns {Type}
	 */
	getFieldType(site, i) {
		throw new Error("can't get field-type of void");
	}

	/**
	 * @param {Site} site
	 * @param {string} name
	 * @returns {number}
	 */
	getFieldIndex(site, name) {
		throw new Error("can't get field-type of void");
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		throw new Error("can't get constr index of void");
	}
}

/**
 * Returned by an error()
 * Special case of no-return-value that indicates that execution can't proceed.
 * @package
 */
class ErrorInstance extends VoidInstance {
	/**
	 * @param {Site} site 
	 * @returns {Type}
	 */
	 getType(site) {
		return new ErrorType();
	}
}

/**
 * Parent-class for AssertFunc, ErrorFunc and PrintFunc
 * @package
 */
class BuiltinFuncInstance extends FuncInstance {
	/**
	 * Returns the base path in the IR (eg. __helios__bool, __helios__error, etc.)
	 * @type {string}
	 */
	get path() {
		throw new Error("not implemented")
	}
}

/**
 * Special builtin function that throws an error if condition is false and returns Void
 * @package
 */
 class AssertFunc extends BuiltinFuncInstance {
	constructor() {
		super(new FuncType([new BoolType(), new StringType()], new VoidType()));
	}

	get path() {
		return "__helios__assert";
	}
}

/**
 * Special builtin function that throws an error and returns ErrorInstance (special case of Void)
 * @package
 */
 class ErrorFunc extends BuiltinFuncInstance {
	constructor() {
		super(new FuncType([new StringType()], new ErrorType()));
	}

	get path() {
		return "__helios__error";
	}
}

/**
 * Special builtin function that prints a message and returns void
 * @package
 */
class PrintFunc extends BuiltinFuncInstance {
	constructor() {
		super(new FuncType([new StringType()], new VoidType()));
	}

	get path() {
		return "__helios__print";
	}
}

/**
 * Type of return-value of functions that don't return anything (eg. assert, print, error)
 * @package
 */
class VoidType extends Type {
	constructor() {
		super();
	}

	toString() {
		return "()";
	}

	/**
	 * @param {Site} site 
	 * @param {Type} type 
	 * @returns {boolean}
	 */
	isBaseOf(site, type) {
		return type instanceof VoidType;
	}
}

/**
 * Type of special case of no-return value where execution can't continue.
 * @package
 */
class ErrorType extends VoidType {
	constructor() {
		super();
	}

	/**
	 * @param {Site} site 
	 * @param {Type} type 
	 * @returns {boolean}
	 */
	isBaseOf(site, type) {
		return type instanceof ErrorType;
	}
}

/**
 * Builtin Int type
 * @package
 */
class IntType extends BuiltinType {
	constructor() {
		super();
	}

	toString() {
		return "Int";
	}

	/**
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "__neg":
			case "__pos":
				return Instance.new(new FuncType([this], new IntType()));
			case "__add":
			case "__sub":
			case "__mul":
			case "__div":
			case "__mod":
				return Instance.new(new FuncType([this, new IntType()], new IntType()));
			case "__geq":
			case "__gt":
			case "__leq":
			case "__lt":
				return Instance.new(new FuncType([this, new IntType()], new BoolType()));
			case "from_big_endian":
			case "from_little_endian":
				return Instance.new(new FuncType([new ByteArrayType()], new IntType()));
			case "max":
			case "min": 
				return Instance.new(new FuncType([new IntType(), new IntType()], new IntType()));
			case "from_base58":
			case "parse":
				return Instance.new(new FuncType([new StringType()], new IntType()));
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "decode_zigzag":
			case "encode_zigzag":
			case "abs":
				return Instance.new(new FuncType([], new IntType()));
			case "bound":
				return Instance.new(new FuncType([new IntType(), new IntType()], new IntType()));
			case "bound_min":
			case "bound_max":
				return Instance.new(new FuncType([new IntType()], new IntType()));
			case "to_bool":
				return Instance.new(new FuncType([], new BoolType()));
			case "to_big_endian":
			case "to_little_endian":
				return Instance.new(new FuncType([], new ByteArrayType()));
			case "to_base58":
			case "to_hex":
			case "show":
				return Instance.new(new FuncType([], new StringType()));
			default:
				return super.getInstanceMember(name);
		}
	}

	get path() {
		return "__helios__int";
	}

	get userType() {
		return HInt;
	}
}

/**
 * Builtin bool type
 * @package
 */
class BoolType extends BuiltinType {
	constructor() {
		super();
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return "Bool";
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "__not":
				return Instance.new(new FuncType([this], new BoolType()));
			case "__and":
			case "__or":
				return Instance.new(new FuncType([this, new BoolType()], new BoolType()));
			case "and":
			case "or":
				return Instance.new(new FuncType([new FuncType([], new BoolType()), new FuncType([], new BoolType())], new BoolType()));
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "to_int":
				return Instance.new(new FuncType([], new IntType()));
			case "show":
				return Instance.new(new FuncType([], new StringType()));
			case "trace":
				return Instance.new(new FuncType([new StringType()], new BoolType()));
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @package
	 * @type {string}
	 */
	get path() {
		return "__helios__bool";
	}

	/**
	 * @package
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		return Bool;
	}
}

/**
 * Builtin string type
 * @package
 */
class StringType extends BuiltinType {
	constructor() {
		super();
	}

	toString() {
		return "String";
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "__add":
				return Instance.new(new FuncType([this, new StringType()], new StringType()));
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "starts_with":
			case "ends_with":
				return Instance.new(new FuncType([new StringType()], new BoolType()));
			case "encode_utf8":
				return Instance.new(new FuncType([], new ByteArrayType()));
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @package
	 * @type {string}
	 */
	get path() {
		return "__helios__string";
	}

	/**
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		return HString;
	}
}

/**
 * Builtin bytearray type
 * @package
 */
class ByteArrayType extends BuiltinType {
	#size;

	/**
	 * @param {?number} size - can be null or 32 (result of hashing)
	 */
	constructor(size = null) {
		super();

		this.#size = size;
	}

	toString() {
		return "ByteArray";
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "__add":
				return Instance.new(new FuncType([this, new ByteArrayType()], new ByteArrayType()));
			case "__geq":
			case "__gt":
			case "__leq":
			case "__lt":
				return Instance.new(new FuncType([this, new ByteArrayType()], new BoolType()));
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "length":
				return Instance.new(new IntType());
			case "slice":
				return Instance.new(new FuncType([new IntType(), new IntType()], new ByteArrayType()));
			case "starts_with":
			case "ends_with":
				return Instance.new(new FuncType([new ByteArrayType()], new BoolType()));
			case "prepend":
				return Instance.new(new FuncType([new IntType()], new ByteArrayType()));
			case "sha2":
			case "sha3":
			case "blake2b":
				return Instance.new(new FuncType([], new ByteArrayType(32)));
			case "decode_utf8":
			case "show":
				return Instance.new(new FuncType([], new StringType()));
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @package
	 * @type {string}
	 */
	get path() {
		return `__helios__bytearray${this.#size === null ? "" : this.#size}`;
	}

	/**
	 * @package
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		return ByteArray;
	}
}


class ParamType extends Type {
	/** @type {?Type} */
	#type;

	/** @type {string} */
	#name;

	#checkType;

	/**
	 * @param {string} name - typically "a" or "b"
	 * @param {?(site: Site, type: Type) => void} checkType
	 */
	constructor(name, checkType = null) {
		super();
		this.#type = null;
		this.#name = name;
		this.#checkType = checkType;
	}

	/**
	 * @returns {boolean}
	 */
	isInferred() {
		return this.#type !== null;
	}

	/**
	 * @param {Site} site
	 * @param {Type} type 
	 */
	setType(site, type) {
		if (this.#checkType !== null) {
			this.#checkType(site, type);
		}

		this.#type = type;
	}

	/**
	 * @param {Type} type 
	 * @param {?Type} expected
	 * @returns {Type}
	 */
	static unwrap(type, expected = null) {
		if (type instanceof AnyType) {
			if (expected !== null) {
				return expected;
			} else {
				throw new Error("unable to infer type of AnyType");
			}
		} else if (type instanceof ParamType) {
			let origType = type.type;

			if (origType === null) {
				if (expected !== null) {
					type.setType(Site.dummy(), expected);
					return expected;
				} else {
					throw new Error("unable to infer ParamType");
				}
			} else {
				return origType;
			}
		} else {
			return type;
		}
	}

	/**
	 * @type {?Type}
	 */
	get type() {
		if (this.#type instanceof ParamType) {
			return this.#type.type;
		} else {
			return this.#type;
		}
	}

	toString() {
		if (this.#type === null) {
			return this.#name;
		} else {
			return this.#type.toString();
		}
	}

	/**
	 * Returns number of members of an enum type
	 * Throws an error if not an enum type
	 * @param {Site} site
	 * @returns {number}
	 */
	nEnumMembers(site) {
		if (this.#type === null) {
			throw new Error("param type not yet infered");
		} else {
			return this.#type.nEnumMembers(site);
		}
	}

	/**
	 * Returns the number of fields of a struct, enum member, or builtin type.
	 * @param {Site} site 
	 * @returns {number}
	 */
	nFields(site) {
		if (this.#type === null) {
			throw new Error("should've been set");
		} else {
			return this.#type.nFields(site);
		}
	}

	/**
	 * Returns the i-th field of a Struct or an EnumMember
	 * @param {Site} site
	 * @param {number} i
	 * @returns {Type}
	 */
	getFieldType(site, i) {
		if (this.#type === null) {
			throw new Error("should've been set");
		} else {
			return this.#type.getFieldType(site, i);
		}
	}

	/**
	 * Returns the i-th field of a Struct or an EnumMember
	 * @param {Site} site
	 * @param {string} name
	 * @returns {number}
	 */
	getFieldIndex(site, name) {
		if (this.#type === null) {
			throw new Error("should've been set");
		} else {
			return this.#type.getFieldIndex(site, name);
		}
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		if (this.#type === null) {
			throw new Error("should've been set");
		} else {
			return this.#type.getInstanceMember(name);
		}
	}
	
	/**
	 * Returns 'true' if 'this' is a base-type of 'type'. Throws an error if 'this' isn't a Type.
	 * @param {Site} site
	 * @param {Type} type
	 * @returns {boolean}
	 */
	isBaseOf(site, type) {
		if (this.#type === null) {
			this.setType(site, type);
			return true;
		} else {
			return this.#type.isBaseOf(site, type);
		}
	}

	/**
	 * Returns the base path of type (eg. __helios__bool).
	 * This is used extensively in the Intermediate Representation.
	 * @type {string}
	 */
	get path() {
		if (this.#type === null) {
			throw new Error("param type not yet infered");
		} else {
			return this.#type.path;
		}
	}
}

/**
 * @package
 */
class ParamFuncValue extends FuncInstance {
	#params;
	#fnType;
	#correctMemberName;

	/**
	 * @param {ParamType[]} params
	 * @param {FuncType} fnType 
	 * @param {?() => string} correctMemberName
	 */
	constructor(params, fnType, correctMemberName = null) {
		super(fnType);
		this.#params = params;
		this.#fnType = fnType;
		this.#correctMemberName = correctMemberName;
	}

	get correctMemberName() {
		return this.#correctMemberName;
	}

	/**
	 * @returns {boolean}
	 */
	allInferred() {
		return this.#params.every(p => p.isInferred());
	}

	toString() {
		return this.#fnType.toString();
	}

	/**
	 * @param {Site} site 
	 * @returns {Type}
	 */
	getType(site) {
		if (this.allInferred()) {
			return this.#fnType;
		} else {
			throw site.typeError("can't get type of type parametric function");
		}
	}

	/**
	 * @param {Site} site 
	 * @param {Type} type 
	 * @returns {boolean}
	 */
	isInstanceOf(site, type) {
		if (this.allInferred()) {
			return (new FuncInstance(this.#fnType)).isInstanceOf(site, type);
		} else {
			throw site.typeError("can't determine if type parametric function is instanceof a type");
		}
	}

	/**
	 * @param {Site} site 
	 * @param {Instance[]} args
	 * @param {{[name: string]: Instance}} namedArgs
	 * @returns {Instance}
	 */
	call(site, args, namedArgs = {}) {
		return (new FuncInstance(this.#fnType)).call(site, args, namedArgs);
	}
}

/**
 * Builtin list type
 * @package
 */
class ListType extends BuiltinType {
	#itemType;

	/**
	 * @param {Type} itemType 
	 */
	constructor(itemType) {
		super();
		this.#itemType = itemType;
	}

	/**
	 * @package
	 * @type {Type}
	 */
	get itemType() {
		return this.#itemType;
	}

	toString() {
		return `[]${this.#itemType.toString()}`;
	}

	/**
	 * @package
	 * @param {Site} site 
	 * @param {Type} type 
	 * @returns {boolean}
	 */
	isBaseOf(site, type) {
		type = ParamType.unwrap(type, this);

		if (type instanceof ListType) {
			return this.#itemType.isBaseOf(site, type.itemType);
		} else {
			return false;
		}
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "__add":
				return Instance.new(new FuncType([this, this], this));
			case "new":
				return Instance.new(new FuncType([new IntType(), new FuncType([new IntType()], this.#itemType)], this));
			case "new_const":
				return Instance.new(new FuncType([new IntType(), this.#itemType], this));
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "length":
				return Instance.new(new IntType());
			case "head":
				return Instance.new(this.#itemType);
			case "tail":
				return Instance.new(new ListType(this.#itemType));
			case "is_empty":
				return Instance.new(new FuncType([], new BoolType()));
			case "get":
				return Instance.new(new FuncType([new IntType()], this.#itemType));
			case "prepend":
				return Instance.new(new FuncType([this.#itemType], new ListType(this.#itemType)));
			case "any":
			case "all":
				return Instance.new(new FuncType([new FuncType([this.#itemType], new BoolType())], new BoolType()));
			case "find":
				return Instance.new(new FuncType([new FuncType([this.#itemType], new BoolType())], this.#itemType));
			case "find_safe":
				return Instance.new(new FuncType([new FuncType([this.#itemType], new BoolType())], new OptionType(this.#itemType)));
			case "filter":
				return Instance.new(new FuncType([new FuncType([this.#itemType], new BoolType())], new ListType(this.#itemType)));
			case "for_each":
				return Instance.new(new FuncType([new FuncType([this.#itemType], new VoidType())], new VoidType()));
			case "fold": {
				let a = new ParamType("a");
				return new ParamFuncValue([a], new FuncType([new FuncType([a, this.#itemType], a), a], a));
			}
			case "fold_lazy": {
				let a = new ParamType("a");
				return new ParamFuncValue([a], new FuncType([new FuncType([this.#itemType, new FuncType([], a)], a), a], a));
			}
			case "map": {
				let a = new ParamType("a");
				return new ParamFuncValue([a], new FuncType([new FuncType([this.#itemType], a)], new ListType(a)), () => {
					let type = a.type;
					if (type === null) {
						throw new Error("should've been inferred by now");
					} else {
						if ((new BoolType()).isBaseOf(Site.dummy(), type)) {
							return "map_to_bool";
						} else {
							return "map";
						}
					}
				});
			}
			case "get_singleton":
				return Instance.new(new FuncType([], this.#itemType));
			case "sort":
				return Instance.new(new FuncType([new FuncType([this.#itemType, this.#itemType], new BoolType())], new ListType(this.#itemType)));
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @package
	 * @type {string}
	 */
	get path() {
		return `__helios__${this.#itemType instanceof BoolType ? "bool" : ""}list`;
	}

	/**
	 * @package
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		return HList(this.#itemType.userType);
	}
}

/**
 * Builtin map type (in reality list of key-value pairs)
 * @package
 */
class MapType extends BuiltinType {
	#keyType;
	#valueType;

	/**
	 * @param {Type} keyType 
	 * @param {Type} valueType 
	 */
	constructor(keyType, valueType) {
		super();
		this.#keyType = keyType;
		this.#valueType = valueType;
	}

	/**
	 * @package
	 * @type {Type}
	 */
	get keyType() {
		return this.#keyType;
	}

	/**
	 * @package
	 * @type {Type}
	 */
	get valueType() {
		return this.#valueType;
	}

	toString() {
		return `Map[${this.#keyType.toString()}]${this.#valueType.toString()}`;
	}

	/**
	 * @package
	 * @param {Site} site 
	 * @param {Type} type 
	 * @returns {boolean}
	 */
	isBaseOf(site, type) {
		type = ParamType.unwrap(type, this);

		if (type instanceof MapType) {
			return this.#keyType.isBaseOf(site, type.#keyType) && this.#valueType.isBaseOf(site, type.#valueType);
		} else {
			return false;
		}
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "__add":
				return Instance.new(new FuncType([this, this], this));
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "all":
			case "any":
				return Instance.new(new FuncType([new FuncType([this.#keyType, this.#valueType], new BoolType())], new BoolType()));
			case "delete":
				return Instance.new(new FuncType([this.#keyType], this));
			case "filter":
				return Instance.new(new FuncType([new FuncType([this.#keyType, this.#valueType], new BoolType())], this));
			case "find":
				return Instance.new(new FuncType([new FuncType([this.#keyType, this.#valueType], new BoolType())], [this.#keyType, this.#valueType]));
			case "find_safe":
				return Instance.new(new FuncType([new FuncType([this.#keyType, this.#valueType], new BoolType())], [new FuncType([], [this.#keyType, this.#valueType]), new BoolType()]))
			case "find_key":
				return Instance.new(new FuncType([new FuncType([this.#keyType], new BoolType())], this.#keyType));
			case "find_key_safe":
				return Instance.new(new FuncType([new FuncType([this.#keyType], new BoolType())], new OptionType(this.#keyType)));
			case "find_value":
				return Instance.new(new FuncType([new FuncType([this.#valueType], new BoolType())], this.#valueType));
			case "find_value_safe":
				return Instance.new(new FuncType([new FuncType([this.#valueType], new BoolType())], new OptionType(this.#valueType)));
			case "fold": {
				let a = new ParamType("a");
				return new ParamFuncValue([a], new FuncType([new FuncType([a, this.#keyType, this.#valueType], a), a], a));
			}
			case "fold_lazy": {
				let a = new ParamType("a");
				return new ParamFuncValue([a], new FuncType([new FuncType([this.#keyType, this.#valueType, new FuncType([], a)], a), a], a));
			}
			case "for_each":
				return Instance.new(new FuncType([new FuncType([this.#keyType, this.#valueType], new VoidType())], new VoidType()));
			case "get":
				return Instance.new(new FuncType([this.#keyType], this.#valueType));
			case "get_safe":
				return Instance.new(new FuncType([this.#keyType], new OptionType(this.#valueType)));
			case "head":
				return Instance.new(new FuncType([], [this.#keyType, this.#valueType]));
			case "head_key":
				return Instance.new(this.#keyType);
			case "head_value":
				return Instance.new(this.#valueType);
			case "is_empty":
				return Instance.new(new FuncType([], new BoolType()));
			case "length":
				return Instance.new(new IntType());
			case "map": {
				let a = new ParamType("a", (site, type) => {
					if ((new BoolType()).isBaseOf(site, type)) {
						throw site.typeError("Map keys can't be of 'Bool' type");
					}
				});

				let b = new ParamType("b");

				return new ParamFuncValue([a, b], new FuncType([new FuncType([this.#keyType, this.#valueType], [a, b])], new MapType(a, b)), () => {
					let type = b.type;
					if (type === null) {
						throw new Error("should've been inferred by now");
					} else {
						if ((new BoolType()).isBaseOf(Site.dummy(), type)) {
							return "map_to_bool";
						} else {
							return "map";
						}
					}
				});
			}
			case "prepend":
				return Instance.new(new FuncType([this.#keyType, this.#valueType], this));
			case "set":
				return Instance.new(new FuncType([this.#keyType, this.#valueType], this));
			case "sort":
				return Instance.new(new FuncType([new FuncType([this.#keyType, this.#valueType, this.#keyType, this.#valueType], new BoolType())], new MapType(this.#keyType, this.#valueType)));
			case "tail":
				return Instance.new(this);
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @package
	 * @type {string}
	 */
	get path() {
		return `__helios__${this.#valueType instanceof BoolType ? "bool" : ""}map`;
	}

	/**
	 * @package
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		return HMap(this.#keyType.userType, this.#valueType.userType);
	}
}

/**
 * Builtin option type
 * @package
 */
class OptionType extends BuiltinType {
	#someType;

	/**
	 * @param {Type} someType 
	 */
	constructor(someType) {
		super();
		this.#someType = someType;
	}

	toString() {
		return `Option[${this.#someType.toString()}]`;
	}

	/**
	 * @package
	 * @param {Site} site 
	 * @returns {number}
	 */
	nEnumMembers(site) {
		return 2;
	}

	/**
	 * @package
	 * @param {Site} site 
	 * @param {Type} type 
	 * @returns {boolean}
	 */
	isBaseOf(site, type) {
		type = ParamType.unwrap(type, this);

		if (type instanceof OptionType) {
			return this.#someType.isBaseOf(site, type.#someType);
		} else {
			return (new OptionSomeType(this.#someType)).isBaseOf(site, type) || 
				(new OptionNoneType(this.#someType)).isBaseOf(site, type);
		}
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "Some":
				return new OptionSomeType(this.#someType);
			case "None":
				return new OptionNoneType(this.#someType);
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "map": {
				let a = new ParamType("a");
				return new ParamFuncValue([a], new FuncType([new FuncType([this.#someType], a)], new OptionType(a)), () => {
					let type = a.type;
					if (type === null) {
						throw new Error("should've been inferred by now");
					} else {
						if ((new BoolType()).isBaseOf(Site.dummy(), type)) {
							return "map_to_bool";
						} else {
							return "map";
						}
					}
				});
			}
			case "unwrap":
				return Instance.new(new FuncType([], this.#someType));
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @package
	 * @type {string}
	 */
	get path() {
		return `__helios__${this.#someType instanceof BoolType ? "bool" : ""}option`;
	}

	/**
	 * @package
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		return Option(this.#someType.userType);
	}
}

/**
 * Member type of OptionType with some content
 */
class OptionSomeType extends BuiltinEnumMember {
	#someType;

	/**
	 * @param {Type} someType 
	 */
	constructor(someType) {
		super(new OptionType(someType));
		this.#someType = someType;
	}

	toString() {
		return `Option[${this.#someType.toString()}]::Some`;
	}

	/**
	 * @param {Site} site 
	 * @param {Type} type 
	 * @returns {boolean}
	 */
	isBaseOf(site, type) {
		type = ParamType.unwrap(type, this);

		if (type instanceof OptionSomeType) {
			return this.#someType.isBaseOf(site, type.#someType);
		} else {
			return false;
		}
	}

	/**
	 * @param {Site} site
	 * @returns {number}
	 */
	nFields(site) {
		return 1;
	}

	/**
	 * @param {Site} site
	 * @param {number} i
	 * @returns {Type}
	 */
	getFieldType(site, i) {
		assert(i == 0);
		return this.#someType;
	}

	/**
	 * @param {Site} site
	 * @param {string} name
	 * @returns {number}
	 */
	getFieldIndex(site, name) {
		assert(name == "some");
		return 0;
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "some":
				return Instance.new(this.#someType);
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return 0;
	}

	get path() {
		return `__helios__${this.#someType instanceof BoolType ? "bool" : ""}option__some`;
	}
}

/**
 * Member type of OptionType with no content
 * @package
 */
class OptionNoneType extends BuiltinEnumMember {
	#someType;

	/**
	 * @param {Type} someType 
	 */
	constructor(someType) {
		super(new OptionType(someType));
		this.#someType = someType;
	}

	toString() {
		return `Option[${this.#someType.toString()}]::None`;
	}

	/**
	 * @param {Site} site 
	 * @param {Type} type 
	 * @returns {boolean}
	 */
	isBaseOf(site, type) {
		type = ParamType.unwrap(type, this);

		if (type instanceof OptionNoneType) {
			return this.#someType.isBaseOf(site, type.#someType);
		} else {
			return false;
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return 1;
	}

	get path() {
		return `__helios__${this.#someType instanceof BoolType ? "bool" : ""}option__none`;
	}

	/**
	 * Instantiates self as value
	 * @param {Site} site
	 * @returns {Instance}
	 */
	assertValue(site) {
		return Instance.new(this);
	}
}

/**
 * Base type of other ValidatorHash etc. (all functionality is actually implemented here)
 * @package
 */
class HashType extends BuiltinType {
	constructor() {
		super();
	}

	/**
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "__geq":
			case "__gt":
			case "__leq":
			case "__lt":
				return Instance.new(new FuncType([this, this], new BoolType()));
			case "new":
				return Instance.new(new FuncType([new ByteArrayType()], this));
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "show":
				return Instance.new(new FuncType([], new StringType()));
			default:
				return super.getInstanceMember(name);
		}
	}

	get path() {
		return "__helios__hash";
	}
}

/**
 * Builtin PubKeyHash type
 * @package
 */
class PubKeyHashType extends HashType {
	toString() {
		return "PubKeyHash";
	}

	/**
	 * @package
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		return PubKeyHash;
	}
}

/**
 * Builtin StakeKeyHash type
 * @package
 */
class StakeKeyHashType extends HashType {
	toString() {
		return "StakeKeyHash";
	}

	/**
	 * @package
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		return StakeKeyHash;
	}
}

/**
 * Builtin PubKey type
 * @package
 */
class PubKeyType extends BuiltinType {
	toString() {
		return "PubKey";
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "new":
				return Instance.new(new FuncType([new ByteArrayType()], this));
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @package
	 * @param {Word} name
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "show":
				return Instance.new(new FuncType([], new StringType()));
			case "verify":
				return Instance.new(new FuncType([new ByteArrayType(), new ByteArrayType()], new BoolType()));
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @package
	 * @type {string}
	 */
	get path() {
		return "__helios__pubkey";
	}
}

/**
 * Generalization of ValidatorHash type and MintingPolicyHash type
 * Must be cast before being able to use the Hash type methods
 * @package
 */
class ScriptHashType extends BuiltinType {
	constructor() {
		super();
	}

	toString() {
		return "ScriptHash";
	}

	get path() {
		return "__helios__scripthash";
	}
}

/**
 * Builtin ValidatorHash type
 * @package
 */
class ValidatorHashType extends HashType {
	#purpose;

	/**
	 * @param {number} purpose 
	 */
	constructor(purpose = -1) {
		super();
		this.#purpose = purpose;
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "CURRENT":
				if (this.macrosAllowed) {
					if (this.#purpose == ScriptPurpose.Spending || this.#purpose == ScriptPurpose.Testing) {
						return Instance.new(this);
					} else {
						throw name.referenceError("'ValidatorHash::CURRENT' only available in spending script");
					}
				} else {
					throw name.referenceError("'ValidatorHash::CURRENT' can only be used after 'main'");
				}
			case "from_script_hash":
				return Instance.new(new FuncType([new ScriptHashType()], new ValidatorHashType()));
			default:
				return super.getTypeMember(name);
		}
	}

	toString() {
		return "ValidatorHash";
	}

	/**
	 * @package
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		return ValidatorHash;
	}
}

/**
 * Builtin MintingPolicyHash type
 * @package
 */
class MintingPolicyHashType extends HashType {
	#purpose;

	/**
	 * @param {number} purpose 
	 */
	constructor(purpose = -1) {
		super();
		this.#purpose = purpose;
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "CURRENT":
				if (this.macrosAllowed) {
					if (this.#purpose == ScriptPurpose.Minting) {
						return Instance.new(this);
					} else {
						throw name.referenceError("'MintingPolicyHash::CURRENT' only available in minting script");
					}
				} else {
					throw name.referenceError("'MintingPolicyHash::CURRENT' can only be used after 'main'");
				}
			case "from_script_hash":
				return Instance.new(new FuncType([new ScriptHashType()], new MintingPolicyHashType()));
			default:
				return super.getTypeMember(name);
		}
	}

	toString() {
		return "MintingPolicyHash";
	}

	/**
	 * @package
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		return MintingPolicyHash;
	}
}

/**
 * Builtin StakingValidatorHash type
 * @package
 */
class StakingValidatorHashType extends HashType {
	#purpose;

	/**
	 * @param {number} purpose 
	 */
	constructor(purpose = -1) {
		super();
		this.#purpose = purpose;
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "CURRENT":
				if (this.macrosAllowed) {
					if (this.#purpose == ScriptPurpose.Staking) {
						return Instance.new(this);
					} else {
						throw name.referenceError("'StakingValidatorHash::CURRENT' only available in minting script");
					}
				} else {
					throw name.referenceError("'StakingValidatorHash::CURRENT' can only be used after 'main'");
				}
			case "from_script_hash":
				return Instance.new(new FuncType([new ScriptHashType()], new StakingValidatorHashType()));
			default:
				return super.getTypeMember(name);
		}
	}

	toString() {
		return "StakingValidatorHash";
	}

	/**
	 * @package
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		return StakingValidatorHash;
	}
}

/**
 * Builtin DatumHash type
 * @package
 */
class DatumHashType extends HashType {
	toString() {
		return "DatumHash";
	}

	/**
	 * @package
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		return DatumHash;
	}
}

/**
 * Builtin ScriptContext type
 * @package
 */
class ScriptContextType extends BuiltinType {
	#purpose;

	/**
	 * @param {number} purpose 
	 */
	constructor(purpose) {
		super();
		this.#purpose = purpose;
	}

	toString() {
		return "ScriptContext";
	}

	/**
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "new_spending":
				if (this.macrosAllowed) {
					if (this.#purpose == ScriptPurpose.Spending || this.#purpose == ScriptPurpose.Testing) {
						return Instance.new(new FuncType([new TxType(), new TxOutputIdType()], this));
					} else {
						throw name.referenceError("'ScriptContext::new_spending' only avaiable for spending");
					}
				} else {
					if (this.#purpose == ScriptPurpose.Staking || this.#purpose == ScriptPurpose.Minting) {
						throw name.referenceError("'ScriptContext::new_spending' only avaiable for spending  scripts");
					} else {
						throw name.referenceError("'ScriptContext::new_spending' can only be used after 'main'");
					}
				}
			case "new_minting":
				if (this.macrosAllowed) {
					if (this.#purpose == ScriptPurpose.Minting || this.#purpose == ScriptPurpose.Testing) {
						return Instance.new(new FuncType([new TxType(), new MintingPolicyHashType()], this));
					} else {
						throw name.referenceError("'ScriptContext::new_minting' only avaiable for minting scripts");
					}
				} else {
					if (this.#purpose == ScriptPurpose.Staking || this.#purpose == ScriptPurpose.Spending) {
						throw name.referenceError("'ScriptContext::new_minting' only avaiable for minting scripts");
					} else {
						throw name.referenceError("'ScriptContext::new_minting' can only be used after 'main'");
					}
				}
			case "new_rewarding":
				if (this.macrosAllowed) {
					if (this.#purpose == ScriptPurpose.Staking || this.#purpose == ScriptPurpose.Testing) {
						return Instance.new(new FuncType([new TxType(), new StakingCredentialType()], this));
					} else {
						throw name.referenceError("'ScriptContext::new_rewarding' only avaiable for staking scripts");
					}
				} else {
					if (this.#purpose == ScriptPurpose.Spending || this.#purpose == ScriptPurpose.Minting) {
						throw name.referenceError("'ScriptContext::new_rewarding' only avaiable for staking scripts");
					} else {
						throw name.referenceError("'ScriptContext::new_rewarding' can only be used after 'main'");
					}
				}
			case "new_certifying":
				if (this.macrosAllowed) {
					if (this.#purpose == ScriptPurpose.Staking || this.#purpose == ScriptPurpose.Testing) {
						return Instance.new(new FuncType([new TxType(), new DCertType()], this));
					} else {
						throw name.referenceError("'ScriptContext::new_certifying' only avaiable for staking scripts");
					}
				} else {
					if (this.#purpose == ScriptPurpose.Spending || this.#purpose == ScriptPurpose.Minting) {
						throw name.referenceError("'ScriptContext::new_certifying' only avaiable for staking scripts");
					} else {
						throw name.referenceError("'ScriptContext::new_certifying' can only be used after 'main'");
					}
				}
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "tx":
				return Instance.new(new TxType());
			case "get_spending_purpose_output_id":
				if (this.#purpose == ScriptPurpose.Minting || this.#purpose == ScriptPurpose.Staking) {
					throw name.referenceError("not available in minting/staking script");
				} else {
					return Instance.new(new FuncType([], new TxOutputIdType()));
				}
			case "get_current_validator_hash":
				if (this.#purpose == ScriptPurpose.Minting || this.#purpose == ScriptPurpose.Staking) {
					throw name.referenceError("not available in minting/staking script");
				} else {
					return Instance.new(new FuncType([], new ValidatorHashType(this.#purpose)));
				}
			case "get_current_minting_policy_hash":
				if (this.#purpose == ScriptPurpose.Spending || this.#purpose == ScriptPurpose.Staking) {
					throw name.referenceError("not available in spending/staking script");
				} else {
					return Instance.new(new FuncType([], new MintingPolicyHashType(this.#purpose)));
				}
			case "get_current_input":
				if (this.#purpose == ScriptPurpose.Minting || this.#purpose == ScriptPurpose.Staking) {
					throw name.referenceError("not available in minting/staking script");
				} else {
					return Instance.new(new FuncType([], new TxInputType()));
				}
			case "get_cont_outputs":
				if (this.#purpose == ScriptPurpose.Minting || this.#purpose == ScriptPurpose.Staking) {
					throw name.referenceError("not available in minting/staking script");
				} else {
					return Instance.new(new FuncType([], new ListType(new TxOutputType())));
				}
			case "get_staking_purpose":
				if (this.#purpose == ScriptPurpose.Minting || this.#purpose == ScriptPurpose.Spending) {
					throw name.referenceError("not available in minting/spending script");
				} else {
					return Instance.new(new FuncType([], new StakingPurposeType()));
				}
			case "get_script_purpose":
				return Instance.new(new FuncType([], new ScriptPurposeType()));
			default:
				return super.getInstanceMember(name);
		}
	}

	get path() {
		return "__helios__scriptcontext";
	}
}

/**
 * Builtin ScriptPurpose type (Minting| Spending| Rewarding | Certifying)
 * @package
 */
class ScriptPurposeType extends BuiltinType {
	toString() {
		return "ScriptPurpose";
	}

	/**
	 * @param {Site} site 
	 * @param {Type} type 
	 * @returns {boolean}
	 */
	isBaseOf(site, type) {
		let b = super.isBaseOf(site, type) ||
				(new MintingScriptPurposeType()).isBaseOf(site, type) || 
				(new SpendingScriptPurposeType()).isBaseOf(site, type) || 
				(new RewardingScriptPurposeType()).isBaseOf(site, type) || 
				(new CertifyingScriptPurposeType()).isBaseOf(site, type); 

		return b;
	}

	/**
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "new_minting":
				return Instance.new(new FuncType([new MintingPolicyHashType()], new MintingScriptPurposeType()));
			case "new_spending":
				return Instance.new(new FuncType([new TxOutputIdType()], new SpendingScriptPurposeType()));
			case "new_rewarding":
				return Instance.new(new FuncType([new StakingCredentialType()], new RewardingScriptPurposeType()));
			case "new_certifying":
				return Instance.new(new FuncType([new DCertType()], new CertifyingScriptPurposeType()));
			case "Minting":
				return new MintingScriptPurposeType();
			case "Spending":
				return new SpendingScriptPurposeType();
			case "Rewarding":
				return new RewardingScriptPurposeType();
			case "Certifying":
				return new CertifyingScriptPurposeType();
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	nEnumMembers(site) {
		return 4;
	}

	get path() {
		return "__helios__scriptpurpose";
	}
}

/**
 * Builtin ScriptPurpose::Minting
 */
class MintingScriptPurposeType extends BuiltinEnumMember {
	constructor() {
		super(new ScriptPurposeType());
	}

	toString() {
		return "ScriptPurpose::Minting";
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "policy_hash":
				return Instance.new(new MintingPolicyHashType());
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return 0;
	}

	get path() {
		return "__helios__scriptpurpose__minting";
	}
}

/**
 * Builtin ScriptPurpose::Spending
 */
class SpendingScriptPurposeType extends BuiltinEnumMember {
	constructor() {
		super(new ScriptPurposeType());
	}

	toString() {
		return "ScriptPurpose::Spending";
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "output_id":
				return Instance.new(new TxOutputIdType());
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return 1;
	}

	get path() {
		return "__helios__scriptpurpose__spending";
	}
}

/**
 * Builtin ScriptPurpose::Rewarding
 */
class RewardingScriptPurposeType extends BuiltinEnumMember {
	/**
	 * @param {?BuiltinType} parentType 
	 */
	constructor(parentType = null) {
		super(parentType === null ? new ScriptPurposeType() : parentType);
	}

	toString() {
		return "ScriptPurpose::Rewarding";
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "credential":
				return Instance.new(new StakingCredentialType());
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return 2;
	}

	get path() {
		return "__helios__scriptpurpose__rewarding";
	}
}

/**
 * Builtin ScriptPurpose::Certifying type
 */
class CertifyingScriptPurposeType extends BuiltinEnumMember {
	/**
	 * @param {?BuiltinType} parentType
	 */
	constructor(parentType = null) {
		super(parentType === null ? new ScriptPurposeType() : parentType);
	}

	toString() {
		return "ScriptPurpose::Certifying";
	}


	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "dcert":
				return Instance.new(new DCertType());
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return 3;
	}

	get path() {
		return "__helios__scriptpurpose__certifying";
	}
}

/**
 * Builtin StakingPurpose type (Rewarding or Certifying)
 * @package
 */
class StakingPurposeType extends BuiltinType {
	toString() {
		return "StakingPurpose";
	}

	/**
	 * @param {Site} site 
	 * @param {Type} type 
	 * @returns {boolean}
	 */
	isBaseOf(site, type) {
		let b = super.isBaseOf(site, type) ||
				(new StakingRewardingPurposeType()).isBaseOf(site, type) || 
				(new StakingCertifyingPurposeType()).isBaseOf(site, type); 

		return b;
	}

	/**
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "Rewarding":
				return new StakingRewardingPurposeType();
			case "Certifying":
				return new StakingCertifyingPurposeType();
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	nEnumMembers(site) {
		return 2;
	}

	get path() {
		return "__helios__stakingpurpose";
	}
}

/**
 * Builtin StakingPurpose::Rewarding
 */
class StakingRewardingPurposeType extends RewardingScriptPurposeType {
	constructor() {
		super(new StakingPurposeType());
	}

	toString() {
		return "StakingPurpose::Rewarding";
	}

	get path() {
		return "__helios__stakingpurpose__rewarding";
	}
}

/**
 * Builtin StakingPurpose::Certifying type
 */
class StakingCertifyingPurposeType extends CertifyingScriptPurposeType {
	constructor() {
		super(new StakingPurposeType());
	}

	toString() {
		return "StakingPurpose::Certifying";
	}

	get path() {
		return "__helios__stakingpurpose__certifying";
	}
}

/**
 * Staking action type (confusingly named D(igest)(of)?Cert(ificate))
 * TODO: think of better name
 * @package
 */
class DCertType extends BuiltinType {
	toString() {
		return "DCert";
	}

	/**
	 * @param {Site} site 
	 * @param {Type} type 
	 * @returns {boolean}
	 */
	isBaseOf(site, type) {
		let b = super.isBaseOf(site, type) ||
				(new RegisterDCertType()).isBaseOf(site, type) || 
				(new DeregisterDCertType()).isBaseOf(site, type) || 
				(new DelegateDCertType()).isBaseOf(site, type) || 
				(new RegisterPoolDCertType()).isBaseOf(site, type) ||
				(new RetirePoolDCertType()).isBaseOf(site, type); 

		return b;
	}

	/**
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "new_register":
				return Instance.new(new FuncType([new StakingCredentialType()], new RegisterDCertType()));
			case "new_deregister":
				return Instance.new(new FuncType([new StakingCredentialType()], new DeregisterDCertType()));
			case "new_delegate":
				return Instance.new(new FuncType([new StakingCredentialType(), new PubKeyHashType()], new DelegateDCertType()));
			case "new_register_pool":
				return Instance.new(new FuncType([new PubKeyHashType(), new PubKeyHashType()], new RegisterPoolDCertType()));
			case "new_retire_pool":
				return Instance.new(new FuncType([new PubKeyHashType(), new IntType()], new RetirePoolDCertType()));
			case "Register":
				return new RegisterDCertType();
			case "Deregister":
				return new DeregisterDCertType();
			case "Delegate":
				return new DelegateDCertType();
			case "RegisterPool":
				return new RegisterPoolDCertType();
			case "RetirePool":
				return new RetirePoolDCertType();
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	nEnumMembers(site) {
		return 5;
	}

	get path() {
		return "__helios__dcert";
	}
}

class RegisterDCertType extends BuiltinEnumMember {
	constructor() {
		super(new DCertType());
	}

	toString() {
		return "DCert::Register";
	}
	
	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "credential":
				return Instance.new(new StakingCredentialType());
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return 0;
	}

	get path() {
		return "__helios__dcert__register";
	}
}

class DeregisterDCertType extends BuiltinEnumMember {
	constructor() {
		super(new DCertType());
	}

	toString() {
		return "DCert::Deregister";
	}
	
	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "credential":
				return Instance.new(new StakingCredentialType());
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return 1;
	}

	get path() {
		return "__helios__dcert__deregister";
	}
}

class DelegateDCertType extends BuiltinEnumMember {
	constructor() {
		super(new DCertType());
	}

	toString() {
		return "DCert::Delegate";
	}
	
	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "delegator":
				return Instance.new(new StakingCredentialType());
			case "pool_id":
				return Instance.new(new PubKeyHashType());
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return 2;
	}

	get path() {
		return "__helios__dcert__delegate";
	}
}

class RegisterPoolDCertType extends BuiltinEnumMember {
	constructor() {
		super(new DCertType());
	}

	toString() {
		return "DCert::RegisterPool";
	}
	
	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "pool_id":
				return Instance.new(new PubKeyHashType());
			case "pool_vrf":
				return Instance.new(new PubKeyHashType());
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return 3;
	}

	get path() {
		return "__helios__dcert__registerpool";
	}
}

class RetirePoolDCertType extends BuiltinEnumMember {
	constructor() {
		super(new DCertType());
	}

	toString() {
		return "DCert::RetirePool";
	}
	
	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "pool_id":
				return Instance.new(new PubKeyHashType());
			case "epoch":
				return Instance.new(new IntType());
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return 4;
	}

	get path() {
		return "__helios__dcert__retirepool";
	}
}

/**
 * Builtin Tx type
 * @package
 */
class TxType extends BuiltinType {
	constructor() {
		super();
	}

	toString() {
		return "Tx";
	}

	/**
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "new":
				if (this.macrosAllowed) {
					return Instance.new(new FuncType([
						new ListType(new TxInputType()), // 0
						new ListType(new TxInputType()), // 1
						new ListType(new TxOutputType()), // 2
						new ValueType(), // 3
						new ValueType(), // 4
						new ListType(new DCertType()), // 5
						new MapType(new StakingCredentialType(), new IntType()), // 6
						new TimeRangeType(), // 7
						new ListType(new PubKeyHashType()), // 8
						new MapType(new ScriptPurposeType(), new AnyDataType()), // 9
						new MapType(new DatumHashType(), new AnyDataType()) // 10
					], this));
				} else {
					throw name.referenceError("'Tx::new' can only be used after 'main'");
				}
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "inputs":
				return Instance.new(new ListType(new TxInputType()));
			case "ref_inputs":
				return Instance.new(new ListType(new TxInputType()));
			case "outputs":
				return Instance.new(new ListType(new TxOutputType()));
			case "fee":
				return Instance.new(new ValueType());
			case "minted":
				return Instance.new(new ValueType());
			case "dcerts":
				return Instance.new(new ListType(new DCertType()));
			case "withdrawals":
				return Instance.new(new MapType(new StakingCredentialType(), new IntType()));
			case "time_range":
				return Instance.new(new TimeRangeType());
			case "signatories":
				return Instance.new(new ListType(new PubKeyHashType()));
			case "redeemers":
				return Instance.new(new MapType(new ScriptPurposeType(), new RawDataType()));
			case "datums":
				return Instance.new(new MapType(new DatumHashType(), new RawDataType()));
			case "id":
				return Instance.new(new TxIdType());
			case "find_datum_hash":
				return Instance.new(new FuncType([new AnyDataType()], new DatumHashType()));
			case "get_datum_data":
				return Instance.new(new FuncType([new TxOutputType()], new RawDataType()));
			case "outputs_sent_to":
				return Instance.new(new FuncType([new PubKeyHashType()], new ListType(new TxOutputType())));
			case "outputs_sent_to_datum":
				return Instance.new(new FuncType([new PubKeyHashType(), new AnyDataType(), new BoolType()], new ListType(new TxOutputType())));
			case "outputs_locked_by":
				return Instance.new(new FuncType([new ValidatorHashType()], new ListType(new TxOutputType())));
			case "outputs_locked_by_datum":
				return Instance.new(new FuncType([new ValidatorHashType(), new AnyDataType(), new BoolType()], new ListType(new TxOutputType())));
			case "value_sent_to":
				return Instance.new(new FuncType([new PubKeyHashType()], new ValueType()));
			case "value_sent_to_datum":
				return Instance.new(new FuncType([new PubKeyHashType(), new AnyDataType(), new BoolType()], new ValueType()));
			case "value_locked_by":
				return Instance.new(new FuncType([new ValidatorHashType()], new ValueType()));
			case "value_locked_by_datum":
				return Instance.new(new FuncType([new ValidatorHashType(), new AnyDataType(), new BoolType()], new ValueType()));
			case "is_signed_by":
				return Instance.new(new FuncType([new PubKeyHashType()], new BoolType()));
			default:
				return super.getInstanceMember(name);
		}
	}

	get path() {
		return "__helios__tx";
	}
}

/**
 * Builtin TxId type
 * @package
 */
class TxIdType extends BuiltinType {
	toString() {
		return "TxId";
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "__geq":
			case "__gt":
			case "__leq":
			case "__lt":
				return Instance.new(new FuncType([this, this], new BoolType()));
			case "new":
				return Instance.new(new FuncType([new ByteArrayType()], this));
			case "CURRENT":
				if (this.macrosAllowed) {
					return Instance.new(this);
				} else {
					throw name.referenceError("'TxId::CURRENT' can only be used after 'main'");
				}
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "show":
				return Instance.new(new FuncType([], new StringType()));
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @package
	 * @type {string}
	 */
	get path() {
		return "__helios__txid";
	}

	/**
	 * @package
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		return TxId;
	}
}

/**
 * Builtin TxInput type
 * @package
 */
class TxInputType extends BuiltinType {
	toString() {
		return "TxInput";
	}

	/**
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "new":
				if (this.macrosAllowed) {
					return Instance.new(new FuncType([
						new TxOutputIdType(), // 0
						new TxOutputType(), // 1
					], this));
				} else {
					throw name.referenceError("'TxInput::new' can only be used after 'main'");
				}
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "output_id":
				return Instance.new(new TxOutputIdType());
			case "output":
				return Instance.new(new TxOutputType());
			default:
				return super.getInstanceMember(name);
		}
	}

	get path() {
		return "__helios__txinput";
	}
}

/**
 * Builtin TxOutput type
 * @package
 */
class TxOutputType extends BuiltinType {
	toString() {
		return "TxOutput";
	}

	/**
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "new":
				return Instance.new(new FuncType([
					new AddressType(), // 0
					new ValueType(), // 1
					new OutputDatumType(), // 2
				], this));
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "address":
				return Instance.new(new AddressType());
			case "value":
				return Instance.new(new ValueType());
			case "datum":
				return Instance.new(new OutputDatumType());
			case "ref_script_hash":
				return Instance.new(new OptionType(new ScriptHashType()));
			default:
				return super.getInstanceMember(name);
		}
	}

	get path() {
		return "__helios__txoutput";
	}
}

/**
 * @package
 */
class OutputDatumType extends BuiltinType {
	toString() {
		return "OutputDatum";
	}

	/**
	 * @param {Site} site 
	 * @param {Type} type 
	 * @returns {boolean}
	 */
	isBaseOf(site, type) {
		let b = super.isBaseOf(site, type) ||
				(new NoOutputDatumType()).isBaseOf(site, type) || 
				(new HashedOutputDatumType()).isBaseOf(site, type) || 
				(new InlineOutputDatumType()).isBaseOf(site, type);; 

		return b;
	}

	/**
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "new_none":
				return Instance.new(new FuncType([], new NoOutputDatumType()));
			case "new_hash":
				return Instance.new(new FuncType([new DatumHashType()], new HashedOutputDatumType()));
			case "new_inline": {
				let a = new ParamType("a");
				return new ParamFuncValue([a], new FuncType([a], new InlineOutputDatumType()), () => {
					let type = a.type;
					if (type === null) {
						throw new Error("should've been inferred by now");
					} else {
						if (a.type instanceof FuncType) {
							throw name.site.typeError("can't use function as argument to OutputDatum::new_inline()");
						} else if ((new BoolType()).isBaseOf(Site.dummy(), type)) {
							return "new_inline_from_bool";
						} else {
							return "new_inline";
						}
					}
				});
			}
			case "None":
				return new NoOutputDatumType();
			case "Hash":
				return new HashedOutputDatumType();
			case "Inline":
				return new InlineOutputDatumType();
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "get_inline_data":
				return Instance.new(new FuncType([], new RawDataType()));
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	nEnumMembers(site) {
		return 3;
	}

	get path() {
		return "__helios__outputdatum";
	}
}

/**
 * @package
 */
class NoOutputDatumType extends BuiltinEnumMember {
	constructor() {
		super(new OutputDatumType);
	}

	toString() {
		return "OutputDatum::None";
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return 0;
	}

	get path() {
		return "__helios__outputdatum__none";
	}
}

/**
 * @package
 */
class HashedOutputDatumType extends BuiltinEnumMember {
	constructor() {
		super(new OutputDatumType());
	}

	toString() {
		return "OutputDatum::Hash";
	}
	
	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "hash":
				return Instance.new(new DatumHashType());
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return 1;
	}

	get path() {
		return "__helios__outputdatum__hash";
	}
}

/**
 * @package
 */
class InlineOutputDatumType extends BuiltinEnumMember {
	constructor() {
		super(new OutputDatumType());
	}

	toString() {
		return "OutputDatum::Inline";
	}
	
	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "data":
				return Instance.new(new RawDataType());
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return 2;
	}

	get path() {
		return "__helios__outputdatum__inline";
	}
}

/**
 * Type of external data that must be cast/type-checked before using
 * Not named 'Data' in Js because it's too generic
 * @package
 */
class RawDataType extends BuiltinType {
	toString() {
		return "Data";
	}

	/**
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "from_data":
				throw name.referenceError(`calling Data::from_data(data) is useless`);
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "tag":
				return Instance.new(new IntType());
			default:
				return super.getInstanceMember(name);
		}
	}

	get path() {
		return "__helios__data";
	}
}

/**
 * Builtin TxOutputId type
 * @package
 */
class TxOutputIdType extends BuiltinType {
	toString() {
		return "TxOutputId";
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "__lt":
			case "__leq":
			case "__gt":
			case "__geq":
				return Instance.new(new FuncType([this, new TxOutputIdType()], new BoolType()));
			case "new":
				return Instance.new(new FuncType([new TxIdType(), new IntType()], new TxOutputIdType()));
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "tx_id":
				return Instance.new(new TxIdType());
			case "index":
				return Instance.new(new IntType());
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @package
	 * @type {string}
	 */
	get path() {
		return "__helios__txoutputid";
	}

	/**
	 * @package
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		return TxOutputId;
	}
}

/**
 * Buitin Address type
 * @package
 */
class AddressType extends BuiltinType {
	toString() {
		return "Address";
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "new":
				return Instance.new(new FuncType([
					new CredentialType(), // 0
					new OptionType(new StakingCredentialType()), // 1
				], this));
			case "new_empty":
				return Instance.new(new FuncType([], this));
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "credential":
				return Instance.new(new CredentialType());
			case "staking_credential":
				return Instance.new(new OptionType(new StakingCredentialType()));
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @package
	 * @type {string}
	 */
	get path() {
		return "__helios__address";
	}

	/**
	 * @package
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		return Address;
	}
}

/**
 * Builtin Credential type
 * @package
 */
class CredentialType extends BuiltinType {
	toString() {
		return "Credential";
	}

	/**
	 * @package
	 * @param {Site} site 
	 * @param {Type} type 
	 * @returns {boolean}
	 */
	isBaseOf(site, type) {
		let b = super.isBaseOf(site, type) ||
				(new CredentialPubKeyType()).isBaseOf(site, type) || 
				(new CredentialValidatorType()).isBaseOf(site, type); 

		return b;
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "PubKey":
				return new CredentialPubKeyType();
			case "Validator":
				return new CredentialValidatorType();
			case "new_pubkey":
				return Instance.new(new FuncType([new PubKeyHashType()], new CredentialPubKeyType()));
			case "new_validator":
				return Instance.new(new FuncType([new ValidatorHashType()], new CredentialValidatorType()));
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @package
	 * @param {Site} site 
	 * @returns {number}
	 */
	nEnumMembers(site) {
		return 2;
	}

	/**
	 * @package
	 * @type {string}
	 */
	get path() {
		return "__helios__credential";
	}
}

/**
 * Builtin Credential::PubKey
 */
class CredentialPubKeyType extends BuiltinEnumMember {
	constructor() {
		super(new CredentialType());
	}

	toString() {
		return "Credential::PubKey";
	}
	
	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "hash":
				return Instance.new(new PubKeyHashType());
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return 0;
	}

	get path() {
		return "__helios__credential__pubkey";
	}
}

/**
 * Builtin Credential::Validator type
 */
class CredentialValidatorType extends BuiltinEnumMember {
	constructor() {
		super(new CredentialType());
	}

	toString() {
		return "Credential::Validator";
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "hash":
				return Instance.new(new ValidatorHashType());
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return 1;
	}

	get path() {
		return "__helios__credential__validator";
	}
}

/**
 * Builtin StakingHash type
 * @package
 */
class StakingHashType extends BuiltinType {
	toString() {
		return "StakingHash";
	}

	/**
	 * @param {Site} site 
	 * @param {Type} type 
	 * @returns {boolean}
	 */
	isBaseOf(site, type) {
		let b = super.isBaseOf(site, type) ||
				(new StakingHashStakeKeyType()).isBaseOf(site, type) || 
				(new StakingHashValidatorType()).isBaseOf(site, type); 

		return b;
	}

	/**
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "StakeKey":
				return new StakingHashStakeKeyType();
			case "Validator":
				return new StakingHashValidatorType();
			case "new_stakekey":
				return Instance.new(new FuncType([new StakeKeyHashType()], new StakingHashStakeKeyType()));
			case "new_validator":
				return Instance.new(new FuncType([new StakingValidatorHashType()], new StakingHashValidatorType()));
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	nEnumMembers(site) {
		return 2;
	}

	get path() {
		return "__helios__stakinghash";
	}
}

/**
 * Builtin StakingHash::StakeKey
 */
class StakingHashStakeKeyType extends BuiltinEnumMember {
	constructor() {
		super(new StakingHashType());
	}

	toString() {
		return "StakingHash::StakeKey";
	}
	
	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "hash":
				return Instance.new(new StakeKeyHashType());
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return 0;
	}

	get path() {
		return "__helios__stakinghash__stakekey";
	}
}

/**
 * Builtin StakingHash::Validator type
 */
class StakingHashValidatorType extends BuiltinEnumMember {
	constructor() {
		super(new StakingHashType());
	}

	toString() {
		return "StakingHash::Validator";
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "hash":
				return Instance.new(new StakingValidatorHashType());
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return 1;
	}

	get path() {
		return "__helios__stakinghash__validator";
	}
}

/**
 * Builtin StakingCredential type
 * @package
 */
class StakingCredentialType extends BuiltinType {
	toString() {
		return "StakingCredential";
	}

	/**
	 * @param {Site} site 
	 * @param {Type} type 
	 * @returns {boolean}
	 */
	isBaseOf(site, type) {
		let b = super.isBaseOf(site, type) ||
				(new StakingHashCredentialType()).isBaseOf(site, type) || 
				(new StakingPtrCredentialType()).isBaseOf(site, type); 

		return b;
	}

	/**
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "Hash":
				return new StakingHashCredentialType();
			case "Ptr":
				return new StakingPtrCredentialType();
			case "new_hash":
				return Instance.new(new FuncType([new StakingHashType()], new StakingHashCredentialType()));
			case "new_ptr":
				return Instance.new(new FuncType([new IntType(), new IntType(), new IntType()], new StakingPtrCredentialType()));
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	nEnumMembers(site) {
		return 2;
	}

	get path() {
		return "__helios__stakingcredential";
	}
}

/**
 * Builtin StakingCredential::Hash
 */
class StakingHashCredentialType extends BuiltinEnumMember {
	constructor() {
		super(new StakingCredentialType());
	}

	toString() {
		return "StakingCredential::Hash";
	}
	
	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "hash":
				return Instance.new(new StakingHashType());
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return 0;
	}

	get path() {
		return "__helios__stakingcredential__hash";
	}
}

/**
 * Builtin StakingCredential::Ptr
 */
class StakingPtrCredentialType extends BuiltinEnumMember {
	constructor() {
		super(new StakingCredentialType());
	}

	toString() {
		return "StakingCredential::Ptr";
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return 1;
	}

	get path() {
		return "__helios__stakingcredential__ptr";
	}
}

/**
 * Builtin Time type. Opaque alias of Int representing milliseconds since 1970
 */
export class TimeType extends BuiltinType {
	toString() {
		return "Time";
	}

	/**
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "__add":
				return Instance.new(new FuncType([this, new DurationType()], new TimeType()));
			case "__sub":
				return Instance.new(new FuncType([this, new TimeType()], new DurationType()));
			case "__sub_alt":
				return Instance.new(new FuncType([this, new DurationType()], new TimeType()));
			case "__geq":
			case "__gt":
			case "__leq":
			case "__lt":
				return Instance.new(new FuncType([this, new TimeType()], new BoolType()));
			case "new":
				return Instance.new(new FuncType([new IntType()], this));
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "show":
				return Instance.new(new FuncType([], new StringType()));
			default:
				return super.getInstanceMember(name);
		}
	}

	get path() {
		return "__helios__time";
	}

	/**
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		return Time;
	}
}

/**
 * Builtin Duration type
 * @package
 */
class DurationType extends BuiltinType {
	toString() {
		return "Duration";
	}

	/**
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "__add":
			case "__sub":
			case "__mod":
				return Instance.new(new FuncType([this, new DurationType()], new DurationType()));
			case "__mul":
			case "__div":
				return Instance.new(new FuncType([this, new IntType()], new DurationType()));
			case "__div_alt":
				return Instance.new(new FuncType([this, new DurationType()], new IntType()));
			case "__geq":
			case "__gt":
			case "__leq":
			case "__lt":
				return Instance.new(new FuncType([this, new DurationType()], new BoolType()));
			case "new":
				return Instance.new(new FuncType([new IntType()], this));
			case "SECOND":
			case "MINUTE":
			case "HOUR":
			case "DAY":
			case "WEEK":
				return Instance.new(this)
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			default:
				return super.getInstanceMember(name);
		}
	}

	get path() {
		return "__helios__duration";
	}

	get userType() {
		return Duration;
	}
}

/**
 * Builtin TimeRange type
 * @package
 */
class TimeRangeType extends BuiltinType {
	toString() {
		return "TimeRange";
	}
	/**
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "new":
				return Instance.new(new FuncType([new TimeType(), new TimeType()], new TimeRangeType()));
			case "ALWAYS":
				return Instance.new(new TimeRangeType());
			case "NEVER":
				return Instance.new(new TimeRangeType());
			case "from":
				return Instance.new(new FuncType([new TimeType()], new TimeRangeType()));
			case "to":
				return Instance.new(new FuncType([new TimeType()], new TimeRangeType()));
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "is_before": // is_before condition never overlaps with contains
			case "is_after": // is_after condition never overlaps with contains
			case "contains":
				return Instance.new(new FuncType([new TimeType()], new BoolType()));
			case "start":
			case "end":
				return Instance.new(new TimeType());
			case "show":
				return Instance.new(new FuncType([], new StringType()));
			default:
				return super.getInstanceMember(name);
		}
	}

	get path() {
		return "__helios__timerange";
	}
}

/**
 * Builtin AssetClass type
 * @package
 */
class AssetClassType extends BuiltinType {
	toString() {
		return "AssetClass";
	}

	/**
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "ADA":
				return Instance.new(new AssetClassType());
			case "new":
				return Instance.new(new FuncType([new MintingPolicyHashType(), new ByteArrayType()], new AssetClassType()));
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "mph":
				return Instance.new(new MintingPolicyHashType());
			case "token_name":
				return Instance.new(new ByteArrayType());
			default:
				return super.getInstanceMember(name);
		}
	}

	get path() {
		return "__helios__assetclass";
	}

	/**
	 * @package
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		return AssetClass;
	}
}

/**
 * Builtin money Value type
 * @package
 */
class ValueType extends BuiltinType {
	toString() {
		return "Value";
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "__add":
			case "__sub":
				return Instance.new(new FuncType([this, new ValueType()], new ValueType()));
			case "__mul":
			case "__div":
				return Instance.new(new FuncType([this, new IntType()], new ValueType()));
			case "__geq":
			case "__gt":
			case "__leq":
			case "__lt":
				return Instance.new(new FuncType([this, new ValueType()], new BoolType()));
			case "ZERO":
				return Instance.new(new ValueType());
			case "lovelace":
				return Instance.new(new FuncType([new IntType()], new ValueType()));
			case "new":
				return Instance.new(new FuncType([new AssetClassType(), new IntType()], new ValueType()));
			case "from_map":
				return Instance.new(new FuncType([new MapType(new MintingPolicyHashType(), new MapType(new ByteArrayType(), new IntType()))], new ValueType()));
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "contains":
				return Instance.new(new FuncType([new ValueType()], new BoolType()));
			case "is_zero":
				return Instance.new(new FuncType([], new BoolType()));
			case "get":
				return Instance.new(new FuncType([new AssetClassType()], new IntType()));
			case "get_safe":
				return Instance.new(new FuncType([new AssetClassType()], new IntType()));
			case "get_lovelace":
				return Instance.new(new FuncType([], new IntType()));
			case "get_assets":
				return Instance.new(new FuncType([], new ValueType()));
			case "get_policy":
				return Instance.new(new FuncType([new MintingPolicyHashType()], new MapType(new ByteArrayType(), new IntType())));
			case "contains_policy":
				return Instance.new(new FuncType([new MintingPolicyHashType()], new BoolType()));
			case "show":
				return Instance.new(new FuncType([], new StringType()));
			case "to_map":
				return Instance.new(new FuncType([], new MapType(new MintingPolicyHashType(), new MapType(new ByteArrayType(), new IntType()))));
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @package
	 * @type {string}
	 */
	get path() {
		return "__helios__value";
	}

	/**
	 * @package
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		return Value;
	}
}


/////////////////////
// Section 14: Scopes
/////////////////////

/**
 * GlobalScope sits above the top-level scope and contains references to all the builtin Values and Types
 * @package
 */
class GlobalScope {
	/**
	 * @type {[Word, EvalEntity][]}
	 */
	#values;

	constructor() {
		this.#values = [];
	}

	/**
	 * Checks if scope contains a name
	 * @param {Word} name 
	 * @returns {boolean}
	 */
	has(name) {
		for (let pair of this.#values) {
			if (pair[0].toString() == name.toString()) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Sets a global name, doesn't check for uniqueness
	 * Called when initializing GlobalScope
	 * @param {string | Word} name
	 * @param {EvalEntity} value
	 */
	set(name, value) {
		/** @type {Word} */
		let nameWord = !(name instanceof Word) ? Word.new(name) : name;

		this.#values.push([nameWord, value]);
	}

	/**
	 * Gets a named value from the scope.
	 * Throws an error if not found.
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	get(name) {
		for (let pair of this.#values) {
			if (pair[0].toString() == name.toString()) {
				pair[1].markAsUsed();
				return pair[1];
			}
		}

		throw name.referenceError(`'${name.toString()}' undefined`);
	}

	/**
	 * Check if funcstatement is called recursively (always false here)
	 * @param {RecurseableStatement} statement
	 * @returns {boolean}
	 */
	isRecursive(statement) {
		return false;
	}

	/**
	 * @returns {boolean}
	 */
	isStrict() {
		throw new Error("should've been returned be TopScope");
	}

	/**
	 * Initialize the GlobalScope with all the builtins
	 * @param {number} purpose
	 * @returns {GlobalScope}
	 */
	static new(purpose) {
		let scope = new GlobalScope();

		// List (aka '[]'), Option, and Map types are accessed through special expressions

		// fill the global scope with builtin types
        scope.set("Address",              new AddressType());
        scope.set("AssetClass",           new AssetClassType());
        scope.set("Bool",                 new BoolType());
        scope.set("ByteArray",            new ByteArrayType());
        scope.set("Credential",           new CredentialType());
        scope.set("DatumHash",            new DatumHashType());
        scope.set("Data",                 new RawDataType());
        scope.set("DCert",                new DCertType());
        scope.set("Duration",             new DurationType());
		scope.set("Int",                  new IntType());
        scope.set("MintingPolicyHash",    new MintingPolicyHashType(purpose));
        scope.set("OutputDatum",          new OutputDatumType());
        scope.set("PubKey",               new PubKeyType());
		scope.set("PubKeyHash",           new PubKeyHashType());
        scope.set("ScriptContext",        new ScriptContextType(purpose));
        scope.set("ScriptHash",           new ScriptHashType());
        scope.set("ScriptPurpose",        new ScriptPurposeType());
        scope.set("StakeKeyHash",         new StakeKeyHashType());
        scope.set("StakingCredential",    new StakingCredentialType());
        scope.set("StakingHash",          new StakingHashType());
        scope.set("StakingPurpose",       new StakingPurposeType());
        scope.set("StakingValidatorHash", new StakingValidatorHashType(purpose));
		scope.set("String",               new StringType());
        scope.set("Time",                 new TimeType());
        scope.set("TimeRange",            new TimeRangeType());
        scope.set("Tx",                   new TxType());
        scope.set("TxId",                 new TxIdType());
        scope.set("TxInput",              new TxInputType());
        scope.set("TxOutput",             new TxOutputType());
        scope.set("TxOutputId",           new TxOutputIdType());
		scope.set("ValidatorHash",        new ValidatorHashType(purpose));
        scope.set("Value",                new ValueType());

        // builtin functions
        scope.set("assert",               new AssertFunc());
		scope.set("error",                new ErrorFunc());
        scope.set("print",                new PrintFunc());
		

		return scope;
	}

	allowMacros() {
		for (let [_, value] of this.#values) {
			if (value instanceof BuiltinType) {
				value.allowMacros();
			}
		}
	}

	/**
	 * @param {(name: string, type: Type) => void} callback 
	 */
	loopTypes(callback) {
		for (let [k, v] of this.#values) {
			if (v instanceof Type) {
				callback(k.value, v);
			}
		}
	}
}

/**
 * User scope
 * @package
 */
class Scope {
	/** @type {GlobalScope | Scope} */
	#parent;

	/** 
	 * TopScope can elverage the #values to store ModuleScopes
	 * @type {[Word, (EvalEntity | Scope)][]} 
	 */
	#values;

	/**
	 * @param {GlobalScope | Scope} parent 
	 */
	constructor(parent) {
		this.#parent = parent;
		this.#values = []; // list of pairs
	}

	/**
	 * Used by top-scope to loop over all the statements
	 */
	get values() {
		return this.#values.slice();
	}

	/**
	 * Checks if scope contains a name
	 * @param {Word} name 
	 * @returns {boolean}
	 */
	has(name) {
		for (let pair of this.#values) {
			if (pair[0].toString() == name.toString()) {
				return true;
			}
		}

		if (this.#parent !== null) {
			return this.#parent.has(name);
		} else {
			return false;
		}
	}

	/**
	 * Sets a named value. Throws an error if not unique
	 * @param {Word} name 
	 * @param {EvalEntity | Scope} value 
	 */
	set(name, value) {
		if (this.has(name)) {
			throw name.syntaxError(`'${name.toString()}' already defined`);
		}

		this.#values.push([name, value]);
	}

	/**
	 * Gets a named value from the scope. Throws an error if not found
	 * @param {Word} name 
	 * @returns {EvalEntity | Scope}
	 */
	get(name) {
		if (!(name instanceof Word)) {
			name = Word.new(name);
		}

		for (let [key, entity] of this.#values) {
			if (key.toString() == name.toString()) {
				if (entity instanceof EvalEntity) {
					entity.markAsUsed();
				}

				return entity;
			}
		}

		if (this.#parent !== null) {
			return this.#parent.get(name);
		} else {
			throw name.referenceError(`'${name.toString()}' undefined`);
		}
	}

	/**
	 * Check if function statement is called recursively
	 * @param {RecurseableStatement} statement
	 * @returns {boolean}
	 */
	isRecursive(statement) {
		return this.#parent.isRecursive(statement);
	}

	/**
	 * @returns {boolean}
	 */
	isStrict() {
		return this.#parent.isStrict();
	}

	/**
	 * Asserts that all named values are user.
	 * Throws an error if some are unused.
	 * Check is only run if we are in strict mode
	 * @param {boolean} onlyIfStrict
	 */
	assertAllUsed(onlyIfStrict = true) {
		if (!onlyIfStrict || this.isStrict()) {
			for (let [name, entity] of this.#values) {
				if (entity instanceof EvalEntity && !entity.isUsed()) {
					throw name.referenceError(`'${name.toString()}' unused`);
				}
			}
		}
	}

	/**
	 * @param {Word} name 
	 * @returns {boolean}
	 */
	isUsed(name) {
		for (let [name, entity] of this.#values) {
			if (name.value == name.value && entity instanceof EvalEntity) {
				return entity.isUsed();
			}
		}

		throw new Error(`${name.value} not found`);
	}

	/**
	 * @param {Site} site 
	 * @returns {Type}
	 */
	assertType(site) {
		throw site.typeError("expected a type, got a module");
	}

	/**
	 * @param {Site} site 
	 * @returns {Instance}
	 */
	assertValue(site) {
		throw site.typeError("expected a value, got a module");
	}

	dump() {
		console.log("DUMPING SCOPE", this.#values.length);
		this.#values.forEach(([w, v]) => {
			console.log(w.value, v);
		});
	}

	/**
	 * @param {(name: string, type: Type) => void} callback 
	 */
	loopTypes(callback) {
		this.#parent.loopTypes(callback);

		for (let [k, v] of this.#values) {
			if (v instanceof Type) {
				callback(k.value, v);
			}
		}
	}
}

/**
 * TopScope is a special scope that can contain UserTypes
 * @package
 */
class TopScope extends Scope {
	#strict;

	/**
	 * @param {GlobalScope} parent 
	 * @param {boolean} strict
	 */
	constructor(parent, strict = true) {
		super(parent);
		this.#strict = strict;
	}

	/**
	 * @param {Word} name 
	 * @param {EvalEntity | Scope} value 
	 */
	set(name, value) {
		super.set(name, value);
	}

	/**
	 * @param {boolean} s 
	 */
	setStrict(s) {
		this.#strict = s;
	}

	/**
	 * @returns {boolean}
	 */
	isStrict() {
		return this.#strict;
	}

	/**
	 * @param {Word} name 
	 * @returns {ModuleScope}
	 */
	getModuleScope(name) {
		const maybeModuleScope = this.get(name);
		if (maybeModuleScope instanceof ModuleScope) {
			return maybeModuleScope;
		} else {
			throw new Error("expected ModuleScope");
		}
	}
}

/**
 * @package
 */
class ModuleScope extends Scope {
}

/**
 * FuncStatementScope is a special scope used to detect recursion
 * @package
 */
class FuncStatementScope extends Scope {
	#statement;

	/**
	 * @param {Scope} parent
	 * @param {RecurseableStatement} statement
	 */
	constructor(parent, statement) {
		super(parent);

		this.#statement = statement;
	}

	/**
	 * @param {RecurseableStatement} statement 
	 * @returns {boolean}
	 */
	isRecursive(statement) {
		if (this.#statement === statement) {
			this.#statement.setRecursive();
			return true;
		} else {
			return super.isRecursive(statement);
		}
	}
}


/////////////////////////////////////
// Section 15: Helios AST expressions
/////////////////////////////////////

/**
 * Base class of every Type and Instance expression.
 */
class Expr extends Token {
	/**
	 * @param {Site} site 
	 */
	constructor(site) {
		super(site);
	}

	use() {
		throw new Error("not yet implemented");
	}
}

/**
 * Base class of every Type expression
 * Caches evaluated Type.
 * @package
 */
class TypeExpr extends Expr {
	#cache;

	/**
	 * @param {Site} site 
	 * @param {?Type} cache
	 */
	constructor(site, cache = null) {
		super(site);
		this.#cache = cache;
	}

	get type() {
		if (this.#cache === null) {
			throw new Error("type not yet evaluated");
		} else {
			return this.#cache;
		}
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Type}
	 */
	evalInternal(scope) {
		throw new Error("not yet implemented");
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Type}
	 */
	eval(scope) {
		if (this.#cache === null) {
			this.#cache = this.evalInternal(scope);
		}

		return this.#cache;
	}
}

/**
 * Type reference class (i.e. using a Word)
 * @package
 */
class TypeRefExpr extends TypeExpr {
	#name;

	/**
	 * @param {Word} name
	 * @param {?Type} cache
	 */
	constructor(name, cache = null) {
		super(name.site, cache);
		this.#name = name;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return this.#name.toString();
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Type}
	 */
	evalInternal(scope) {
		let type = scope.get(this.#name);

		return type.assertType(this.#name.site);
	}

	get path() {
		return this.type.path;
	}

	use() {
		let t = this.type;

		if (t instanceof StatementType) {
			t.statement.use();
		}
	}
}

/**
 * Type::Member expression
 * @package
 */
class TypePathExpr extends TypeExpr {
	#baseExpr;
	#memberName;

	/**
	 * @param {Site} site 
	 * @param {TypeExpr} baseExpr 
	 * @param {Word} memberName
	 */
	constructor(site, baseExpr, memberName) {
		super(site);
		this.#baseExpr = baseExpr;
		this.#memberName = memberName;
	}

	toString() {
		return `${this.#baseExpr.toString()}::${this.#memberName.toString()}`;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Type}
	 */
	evalInternal(scope) {
		let enumType = this.#baseExpr.eval(scope);

		let memberType = enumType.getTypeMember(this.#memberName);

		return memberType.assertType(this.#memberName.site);
	}

	get path() {
		return this.type.path;
	}

	use() {
		this.#baseExpr.use();
	}
}

/**
 * []ItemType
 * @package
 */
class ListTypeExpr extends TypeExpr {
	#itemTypeExpr;

	/**
	 * @param {Site} site 
	 * @param {TypeExpr} itemTypeExpr 
	 */
	constructor(site, itemTypeExpr) {
		super(site);
		this.#itemTypeExpr = itemTypeExpr;
	}

	toString() {
		return `[]${this.#itemTypeExpr.toString()}`;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Type}
	 */
	evalInternal(scope) {
		let itemType = this.#itemTypeExpr.eval(scope);

		if (itemType instanceof FuncType) {
			throw this.#itemTypeExpr.typeError("list item type can't be function");
		}

		return new ListType(itemType);
	}

	use() {
		this.#itemTypeExpr.use();
	}
}

/**
 * Map[KeyType]ValueType expression
 * @package
 */
class MapTypeExpr extends TypeExpr {
	#keyTypeExpr;
	#valueTypeExpr;

	/**
	 * @param {Site} site 
	 * @param {TypeExpr} keyTypeExpr 
	 * @param {TypeExpr} valueTypeExpr 
	 */
	constructor(site, keyTypeExpr, valueTypeExpr) {
		super(site);
		this.#keyTypeExpr = keyTypeExpr;
		this.#valueTypeExpr = valueTypeExpr;
	}

	toString() {
		return `Map[${this.#keyTypeExpr.toString()}]${this.#valueTypeExpr.toString()}`;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Type}
	 */
	evalInternal(scope) {
		let keyType = this.#keyTypeExpr.eval(scope);

		if (keyType instanceof FuncType) {
			throw this.#keyTypeExpr.typeError("map key type can't be function");
		} else if (keyType instanceof BoolType) {
			throw this.#keyTypeExpr.typeError("map key type can't be a boolean");
		}

		let valueType = this.#valueTypeExpr.eval(scope);

		if (valueType instanceof FuncType) {
			throw this.#valueTypeExpr.typeError("map value type can't be function");
		}

		return new MapType(keyType, valueType);
	}

	use() {
		this.#keyTypeExpr.use();
		this.#valueTypeExpr.use();
	}
}

/**
 * Option[SomeType] expression
 * @package
 */
class OptionTypeExpr extends TypeExpr {
	#someTypeExpr;

	/**
	 * @param {Site} site 
	 * @param {TypeExpr} someTypeExpr 
	 */
	constructor(site, someTypeExpr) {
		super(site);
		this.#someTypeExpr = someTypeExpr;
	}

	toString() {
		return `Option[${this.#someTypeExpr.toString()}]`;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Type}
	 */
	evalInternal(scope) {
		let someType = this.#someTypeExpr.eval(scope);

		if (someType instanceof FuncType) {
			throw this.#someTypeExpr.typeError("option some type can't be function");
		}

		return new OptionType(someType);
	}

	use() {
		this.#someTypeExpr.use();
	}
}

/**
 * '()' which can only be used as return type of func
 * @package
 */
class VoidTypeExpr extends TypeExpr {
	constructor(site) {
		super(site);
	}

	toString() {
		return "()";
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Type}
	 */
	evalInternal(scope) {
		return new VoidType();
	}
	
	use() {
	}
}

/**
 * @package
 */
class FuncArgTypeExpr extends Token {
	#name;
	#typeExpr;
	optional;

	/**
	 * @param {Site} site 
	 * @param {null | Word} name 
	 * @param {TypeExpr} typeExpr 
	 * @param {boolean} optional 
	 */
	constructor(site, name, typeExpr, optional) {
		super(site);
		this.#name = name;
		this.#typeExpr = typeExpr;
		this.optional = optional;
	}

	/**
	 * @returns {boolean}
	 */
	isNamed() {
		return this.#name == null;
	}

	/**
	 * @returns {boolean}
	 */
	isOptional() {
		return this.optional;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return [
			this.#name != null ? `${this.#name.toString()}: ` : "",
			this.optional ? "?" : "",
			this.#typeExpr.toString()
		].join("");
	}

	/**
	 * @param {Scope} scope 
	 * @returns {ArgType}
	 */
	eval(scope) {
		return new ArgType(this.#name, this.#typeExpr.eval(scope), this.optional);
	}

	use() {
		this.#typeExpr.use();
	}
}

/**
 * (ArgType1, ...) -> RetType expression
 * @package
 */
class FuncTypeExpr extends TypeExpr {
	#argTypeExprs;
	#retTypeExprs;

	/**
	 * @param {Site} site 
	 * @param {FuncArgTypeExpr[]} argTypeExprs 
	 * @param {TypeExpr[]} retTypeExprs 
	 */
	constructor(site, argTypeExprs, retTypeExprs) {
		super(site);
		this.#argTypeExprs = argTypeExprs;
		this.#retTypeExprs = retTypeExprs;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		if (this.#retTypeExprs.length === 1) {
			return `(${this.#argTypeExprs.map(a => a.toString()).join(", ")}) -> ${this.#retTypeExprs.toString()}`;
		} else {
			return `(${this.#argTypeExprs.map(a => a.toString()).join(", ")}) -> (${this.#retTypeExprs.map(e => e.toString()).join(", ")})`;
		}
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Type}
	 */
	evalInternal(scope) {
		let argTypes = this.#argTypeExprs.map(a => a.eval(scope));

		let retTypes = this.#retTypeExprs.map(e => e.eval(scope));

		return new FuncType(argTypes, retTypes);
	}

	use() {
		this.#argTypeExprs.forEach(arg => arg.use());
		this.#retTypeExprs.forEach(e => e.use());
	}
}

/**
 * Base class of expression that evaluate to Values.
 * @package
 */
class ValueExpr extends Expr {
	/** @type {?Instance} */
	#cache;

	/**
	 * @param {Site} site 
	 */
	constructor(site) {
		super(site);

		this.#cache = null;
	}

	/**
	 * @type {Instance}
	 */
	get value() {
		if (this.#cache === null) {
			throw new Error("type not yet evaluated");
		} else {
			return this.#cache;
		}
	}

	get type() {
		return this.value.getType(this.site);
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	evalInternal(scope) {
		throw new Error("not yet implemented");
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	eval(scope) {
		if (this.#cache === null) {
			this.#cache = this.evalInternal(scope);
		}

		return this.#cache;
	}

	/**
	 * Returns Intermediate Representation of a value expression.
	 * The IR should be indented to make debugging easier.
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		throw new Error("not implemented");
	}
}

/**
 * '... = ... ; ...' expression
 * @package
 */
class AssignExpr extends ValueExpr {
	#nameTypes;
	#upstreamExpr;
	#downstreamExpr;

	/**
	 * @param {Site} site 
	 * @param {DestructExpr[]} nameTypes 
	 * @param {ValueExpr} upstreamExpr 
	 * @param {ValueExpr} downstreamExpr 
	 */
	constructor(site, nameTypes, upstreamExpr, downstreamExpr) {
		super(site);
		assert(nameTypes.length > 0);
		this.#nameTypes = nameTypes;
		this.#upstreamExpr = assertDefined(upstreamExpr);
		this.#downstreamExpr = assertDefined(downstreamExpr);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		let downstreamStr = this.#downstreamExpr.toString();
		assert(downstreamStr != undefined);

		if (this.#nameTypes.length === 1) {
			return `${this.#nameTypes.toString()} = ${this.#upstreamExpr.toString()}; ${downstreamStr}`;
		} else {
			return `(${this.#nameTypes.map(nt => nt.toString()).join(", ")}) = ${this.#upstreamExpr.toString()}; ${downstreamStr}`;
		}
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	evalInternal(scope) {
		let subScope = new Scope(scope);

		let upstreamVal = this.#upstreamExpr.eval(scope);

		if (this.#nameTypes.length > 1) {
			if (!(upstreamVal instanceof MultiInstance)) {
				throw this.typeError("rhs ins't a multi-value");
			} else {
				let vals = upstreamVal.values;

				if (this.#nameTypes.length != vals.length) {
					throw this.typeError(`expected ${this.#nameTypes.length} rhs in multi-assign, got ${vals.length}`);
				} else {
					this.#nameTypes.forEach((nt, i) => nt.evalInAssignExpr(subScope, vals[i].getType(nt.site), i));
				}
			}
		} else {
			if (!upstreamVal.isValue()) {
				throw this.typeError("rhs isn't a value");
			}

			if (this.#nameTypes[0].hasType()) {
				this.#nameTypes[0].evalInAssignExpr(subScope, upstreamVal.getType(this.#nameTypes[0].site), 0);
			} else if (this.#upstreamExpr.isLiteral()) {
				// enum variant type resulting from a constructor-like associated function must be cast back into its enum type
				if ((this.#upstreamExpr instanceof CallExpr &&
					this.#upstreamExpr.fnExpr instanceof ValuePathExpr) || 
					(this.#upstreamExpr instanceof ValuePathExpr && 
					!this.#upstreamExpr.isZeroFieldConstructor())) 
				{
					let upstreamType = upstreamVal.getType(this.#upstreamExpr.site);

					if (upstreamType.isEnumMember()) {
						upstreamVal = Instance.new(upstreamType.parentType(Site.dummy()));
					}
				}

				subScope.set(this.#nameTypes[0].name, upstreamVal);
			} else {
				throw this.typeError("unable to infer type of assignment rhs");
			}
		}

		const downstreamVal = this.#downstreamExpr.eval(subScope);

		subScope.assertAllUsed();

		return downstreamVal;
	}

	use() {
		this.#nameTypes.forEach(nt => nt.use());
		this.#upstreamExpr.use();
		this.#downstreamExpr.use();
	}

	/**
	 * 
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		
		if (this.#nameTypes.length === 1) {
			let inner = this.#downstreamExpr.toIR(indent + TAB);

			inner = this.#nameTypes[0].wrapDestructIR(indent, inner, 0);

			let upstream = this.#upstreamExpr.toIR(indent);

			// enum member run-time error IR
			if (this.#nameTypes[0].hasType()) {
				const t = this.#nameTypes[0].type;

				if (t.isEnumMember()) {
					upstream = new IR([
						new IR("__helios__common__assert_constr_index("),
						upstream,
						new IR(`, ${t.getConstrIndex(this.#nameTypes[0].site)})`)
					]);
				}
			}

			return new IR([
				new IR("("),
				this.#nameTypes[0].toNameIR(0),
				new IR(") "),
				new IR("->", this.site), new IR(` {\n${indent}${TAB}`),
				inner,
				new IR(`\n${indent}}(`),
				upstream,
				new IR(")")
			]);
		} else {
			let inner = this.#downstreamExpr.toIR(indent + TAB + TAB);

			for (let i = this.#nameTypes.length - 1; i >= 0; i--) {
				// internally generates enum-member error IR
				inner = this.#nameTypes[i].wrapDestructIR(indent, inner, i);
			}

			const ir = new IR([
				this.#upstreamExpr.toIR(indent),
				new IR(`(\n${indent + TAB}(`), new IR(this.#nameTypes.map((nt, i) => nt.toNameIR(i))).join(", "), new IR(") ->", this.site), new IR(` {\n${indent}${TAB}${TAB}`),
				inner,
				new IR(`\n${indent + TAB}}\n${indent})`)
			]);

			return ir;
		}
	}
}

/**
 * print(...); ... expression
 * @package
 */
class PrintExpr extends ValueExpr {
	#msgExpr;
	#downstreamExpr;

	/**
	 * @param {Site} site 
	 * @param {ValueExpr} msgExpr 
	 * @param {ValueExpr} downstreamExpr 
	 */
	constructor(site, msgExpr, downstreamExpr) {
		super(site);
		this.#msgExpr = msgExpr;
		this.#downstreamExpr = downstreamExpr;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		let downstreamStr = this.#downstreamExpr.toString();
		assert(downstreamStr != undefined);
		return `print(${this.#msgExpr.toString()}); ${downstreamStr}`;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	evalInternal(scope) {
		let msgVal = this.#msgExpr.eval(scope);

		assert(msgVal.isValue());

		if (!msgVal.isInstanceOf(this.#msgExpr.site, StringType)) {
			throw this.#msgExpr.typeError("expected string arg for print");
		}

		let downstreamVal = this.#downstreamExpr.eval(scope);

		return downstreamVal;
	}

	use() {
		this.#msgExpr.use();
		this.#downstreamExpr.use();
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		return new IR([
			new IR("__core__trace", this.site), new IR("("), new IR("__helios__common__unStringData("),
			this.#msgExpr.toIR(indent),
			new IR(`), () -> {\n${indent}${TAB}`),
			this.#downstreamExpr.toIR(indent + TAB),
			new IR(`\n${indent}})()`)
		]);
	}
}

/**
 * Helios equivalent of unit
 * @package
 */
class VoidExpr extends ValueExpr {
	/**
	 * @param {Site} site
	 */
	constructor(site) {
		super(site);
	}

	toString() {
		return "()";
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	evalInternal(scope) {
		return new VoidInstance();
	}

	use() {
	}

	toIR() {
		return new IR("()", this.site);
	}
}

/**
 * expr(...); ...
 * @package
 */
class ChainExpr extends ValueExpr {
	#upstreamExpr;
	#downstreamExpr;

	/**
	 * @param {Site} site 
	 * @param {ValueExpr} upstreamExpr 
	 * @param {ValueExpr} downstreamExpr 
	 */
	constructor(site, upstreamExpr, downstreamExpr) {
		super(site);
		this.#upstreamExpr = upstreamExpr;
		this.#downstreamExpr = downstreamExpr;
	}

	toString() {
		return `${this.#upstreamExpr.toString()}; ${this.#downstreamExpr.toString()}`;
	}

	/**
	 * @param {Scope} scope
	 * @returns {Instance}
	 */
	evalInternal(scope) {
		let upstreamVal = this.#upstreamExpr.eval(scope);

		if (upstreamVal instanceof ErrorInstance) {
			throw this.#downstreamExpr.typeError("unreachable code (upstream always throws error)");
		} else if (!(upstreamVal instanceof VoidInstance)) {
			throw this.#upstreamExpr.typeError("unexpected return value (hint: use '='");
		}

		return this.#downstreamExpr.eval(scope);
	}

	use() {
		this.#upstreamExpr.use();
		this.#downstreamExpr.use();
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		return new IR([
			new IR("__core__chooseUnit(", this.site),
			this.#upstreamExpr.toIR(indent),
			new IR(", "),
			this.#downstreamExpr.toIR(indent),
			new IR(")")
		]);
	}
}

/**
 * Literal expression class (wraps literal tokens)
 * @package
 */
class PrimitiveLiteralExpr extends ValueExpr {
	#primitive;

	/**
	 * @param {PrimitiveLiteral} primitive 
	 */
	constructor(primitive) {
		super(primitive.site);
		this.#primitive = primitive;
	}

	isLiteral() {
		return true;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return this.#primitive.toString();
	}

	/**
	 * @type {Type}
	 */
	get type() {
		if (this.#primitive instanceof IntLiteral) {
			return new IntType();
		} else if (this.#primitive instanceof BoolLiteral) {
			return new BoolType();
		} else if (this.#primitive instanceof StringLiteral) {
			return new StringType();
		} else if (this.#primitive instanceof ByteArrayLiteral) {
			return new ByteArrayType(this.#primitive.bytes.length == 32 ? 32 : null);
		} else {
			throw new Error("unhandled primitive type");
		}	
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	evalInternal(scope) {
		return new DataInstance(this.type);
	}

	use() {
	}

	/**
	 * @param {string} indent
	 * @returns {IR}
	 */
	toIR(indent = "") {
		// all literals can be reused in their string-form in the IR
		let inner = new IR(this.#primitive.toString(), this.#primitive.site);

		if (this.#primitive instanceof IntLiteral) {
			return new IR([new IR("__core__iData", this.site), new IR("("), inner, new IR(")")]);
		} else if (this.#primitive instanceof BoolLiteral) {
			return inner;
		} else if (this.#primitive instanceof StringLiteral) {
			return new IR([new IR("__helios__common__stringData", this.site), new IR("("), inner, new IR(")")]);
		} else if (this.#primitive instanceof ByteArrayLiteral) {
			return new IR([new IR("__core__bData", this.site), new IR("("), inner, new IR(")")]);
		} else {
			throw new Error("unhandled primitive type");
		}
	}
}

/**
 * Literal UplcData which is the result of parameter substitutions.
 * @package
 */
class LiteralDataExpr extends ValueExpr {
	#type;
	#data;

	/**
	 * @param {Site} site 
	 * @param {Type} type
	 * @param {UplcData} data
	 */
	constructor(site, type, data) {
		super(site);
		this.#type = type;
		this.#data = data;
	}

	/**
	 * @package
	 * @type {Type}
	 */
	get type() {
		return this.#type;
	}

	/**
	 * @returns {boolean}
	 */
	isLiteral() {
		return true;
	}

	toString() {
		return `##${bytesToHex(this.#data.toCbor())}`;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	evalInternal(scope) {
		return Instance.new(this.#type);
	}

	use() {
	}

	toIR(indent = "") {
		return new IR(this.toString(), this.site);
	}
}

/**
 * Struct field (part of a literal struct constructor)
 * @package
 */
class StructLiteralField {
	#name;
	#value;

	/**
	 * @param {?Word} name 
	 * @param {ValueExpr} value 
	 */
	constructor(name, value) {
		this.#name = name;
		this.#value = value;
	}

	get site() {
		if (this.#name === null) {
			return this.#value.site;
		} else {
			return this.#name.site;
		}
	}

	/**
	 * @returns {boolean}
	 */
	isNamed() {
		return this.#name !== null;
	}

	get name() {
		if (this.#name === null) {
			throw new Error("name of field not given");
		} else {
			return this.#name;
		}
	}

	toString() {
		if (this.#name === null) {
			return this.#value.toString();
		} else {
			return `${this.#name.toString()}: ${this.#value.toString()}`;
		}
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	eval(scope) {
		return this.#value.eval(scope);
	}

	use() {
		this.#value.use();
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		return this.#value.toIR(indent);
	}
}

/**
 * Struct literal constructor
 * @package
 */
class StructLiteralExpr extends ValueExpr {
	#typeExpr;
	#fields;
	/** @type {?number} - set during evaluation */
	#constrIndex;

	/**
	 * @param {TypeExpr} typeExpr 
	 * @param {StructLiteralField[]} fields 
	 */
	constructor(typeExpr, fields) {
		super(typeExpr.site);
		this.#typeExpr = typeExpr;
		this.#fields = fields;
		this.#constrIndex = null;
	}

	isLiteral() {
		return true;
	}

	toString() {
		return `${this.#typeExpr.toString()}{${this.#fields.map(f => f.toString()).join(", ")}}`;
	}

	isNamed() {
		// the expression builder already checked that all fields are named or all or positional (i.e. not mixed)
		return this.#fields.length > 0 && this.#fields[0].isNamed();
	}

	/**
	 * @param {Scope} scope 
	 * @returns 
	 */
	evalInternal(scope) {
		let type = this.#typeExpr.eval(scope);

		assert(type.isType());

		this.#constrIndex = type.getConstrIndex(this.site);

		let instance = Instance.new(type);

		if (instance.nFields(this.site) != this.#fields.length) {
			throw this.typeError(`wrong number of fields for ${type.toString()}, expected ${instance.nFields(this.site)}, got ${this.#fields.length}`);
		}

		for (let i = 0; i < this.#fields.length; i++) {
			let f = this.#fields[i];
		
			let fieldVal = f.eval(scope);

			if (f.isNamed()) {
				// check the named type
				let memberType = instance.getInstanceMember(f.name).getType(f.name.site);

				if (!fieldVal.isInstanceOf(f.site, memberType)) {
					throw f.site.typeError(`wrong field type for '${f.name.toString()}', expected ${memberType.toString()}, got ${fieldVal.getType(Site.dummy()).toString()}`);
				}
			} else {
				// check the positional type
				let memberType = instance.getFieldType(f.site, i);
				
				if (!fieldVal.isInstanceOf(f.site, memberType)) {
					throw f.site.typeError(`wrong field type for field ${i.toString()}, expected ${memberType.toString()}, got ${fieldVal.getType(Site.dummy()).toString()}`);
				}
			}
		}

		return instance;
	}

	use() {
		this.#typeExpr.use();

		for (let f of this.#fields) {
			f.use();
		}
	}

	/**
	 * @param {Site} site
	 * @param {Type} type
	 * @param {IR[]} fields
	 * @param {number | null} constrIndex
	 */
	static toIRInternal(site, type, fields, constrIndex) {
		let ir = new IR("__core__mkNilData(())");

		const instance = Instance.new(type);

		for (let i = fields.length - 1; i >= 0; i--) {
			let f = fields[i];

			const isBool = instance.getFieldType(site, i) instanceof BoolType;

			if (isBool) {
				f = new IR([
					new IR("__helios__common__boolData("),
					f,
					new IR(")"),
				]);
			}

			// in case of a struct with only one field, return that field directly 
			if (fields.length == 1 && type instanceof StructStatementType) {
				return f;
			}

			ir = new IR([
				new IR("__core__mkCons("),
				f,
				new IR(", "),
				ir,
				new IR(")")
			]);
		}

		if (constrIndex === null) {
			throw new Error("constrIndex not yet set");
		} else if (constrIndex == -1) {
			// regular struct
			return new IR([
				new IR("__core__listData", site),
				new IR("("), 
				ir,
				new IR(")")
			]);
		} else {
			return new IR([
				new IR("__core__constrData", site), new IR(`(${constrIndex.toString()}, `),
				ir,
				new IR(")")
			]);
		}
	}

	/**
	 * @param {string} indent
	 * @returns {IR}
	 */
	toIR(indent = "") {
		const type = this.#typeExpr.type;

		const fields = this.#fields.slice();

		// sort fields by correct name
		if (this.isNamed()) {
			fields.sort((a, b) => type.getFieldIndex(this.site, a.name.value) - type.getFieldIndex(this.site, b.name.value));
		}

		const irFields = fields.map(f => f.toIR(indent));

		return StructLiteralExpr.toIRInternal(this.site, type, irFields, this.#constrIndex);
	}
}

/**
 * []{...} expression
 * @package
 */
class ListLiteralExpr extends ValueExpr {
	#itemTypeExpr;
	#itemExprs;

	/**
	 * @param {Site} site 
	 * @param {TypeExpr} itemTypeExpr 
	 * @param {ValueExpr[]} itemExprs 
	 */
	constructor(site, itemTypeExpr, itemExprs) {
		super(site);
		this.#itemTypeExpr = itemTypeExpr;
		this.#itemExprs = itemExprs;
	}

	isLiteral() {
		return true;
	}

	toString() {
		return `[]${this.#itemTypeExpr.toString()}{${this.#itemExprs.map(itemExpr => itemExpr.toString()).join(', ')}}`;
	}

	/**
	 * @param {Scope} scope
	 */
	evalInternal(scope) {
		let itemType = this.#itemTypeExpr.eval(scope);

		if (itemType instanceof FuncType) {
			throw this.#itemTypeExpr.typeError("content of list can't be func");
		}

		for (let itemExpr of this.#itemExprs) {
			let itemVal = itemExpr.eval(scope);

			if (!itemVal.isInstanceOf(itemExpr.site, itemType)) {
				throw itemExpr.typeError(`expected ${itemType.toString()}, got ${itemVal.toString()}`);
			}
		}

		return Instance.new(new ListType(itemType));
	}

	use() {
		this.#itemTypeExpr.use();

		for (let item of this.#itemExprs) {
			item.use();
		}
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		let isBool = this.#itemTypeExpr.type instanceof BoolType;

		// unsure if list literals in untyped Plutus-core accept arbitrary terms, so we will use the more verbose constructor functions 
		let res = new IR("__core__mkNilData(())");

		// starting from last element, keeping prepending a data version of that item

		for (let i = this.#itemExprs.length - 1; i >= 0; i--) {
			let itemIR = this.#itemExprs[i].toIR(indent);

			if (isBool) {
				itemIR = new IR([
					new IR("__helios__common__boolData("),
					itemIR,
					new IR(")"),
				]);
			}

			res = new IR([
				new IR("__core__mkCons("),
				itemIR,
				new IR(", "),
				res,
				new IR(")")
			]);
		}

		return new IR([new IR("__core__listData", this.site), new IR("("), res, new IR(")")]);
	}
}

/**
 * Map[...]...{... : ...} expression
 * @package
 */
class MapLiteralExpr extends ValueExpr {
	#keyTypeExpr;
	#valueTypeExpr;
	#pairExprs;

	/**
	 * @param {Site} site 
	 * @param {TypeExpr} keyTypeExpr 
	 * @param {TypeExpr} valueTypeExpr
	 * @param {[ValueExpr, ValueExpr][]} pairExprs 
	 */
	constructor(site, keyTypeExpr, valueTypeExpr, pairExprs) {
		super(site);
		this.#keyTypeExpr = keyTypeExpr;
		this.#valueTypeExpr = valueTypeExpr;
		this.#pairExprs = pairExprs;
	}

	isLiteral() {
		return true;
	}

	toString() {
		return `Map[${this.#keyTypeExpr.toString()}]${this.#valueTypeExpr.toString()}{${this.#pairExprs.map(([keyExpr, valueExpr]) => `${keyExpr.toString()}: ${valueExpr.toString()}`).join(', ')}}`;
	}

	/**
	 * @param {Scope} scope
	 */
	evalInternal(scope) {
		let keyType = this.#keyTypeExpr.eval(scope);
		let valueType = this.#valueTypeExpr.eval(scope);

		if (keyType instanceof FuncType) {
			throw this.#keyTypeExpr.typeError("key-type of Map can't be func");
		} else if (valueType instanceof FuncType) {
			throw this.#valueTypeExpr.typeError("value-type of Map can't be func");
		}

		for (let [keyExpr, valueExpr] of this.#pairExprs) {
			let keyVal = keyExpr.eval(scope);
			let valueVal = valueExpr.eval(scope);

			if (!keyVal.isInstanceOf(keyExpr.site, keyType)) {
				throw keyExpr.typeError(`expected ${keyType.toString()} for map key, got ${keyVal.toString()}`);
			} else if (!valueVal.isInstanceOf(valueExpr.site, valueType)) {
				throw valueExpr.typeError(`expected ${valueType.toString()} for map value, got ${valueVal.toString()}`);
			}
		}

		return Instance.new(new MapType(keyType, valueType));
	}

	use() {
		this.#keyTypeExpr.use();
		this.#valueTypeExpr.use();

		for (let [fst, snd] of this.#pairExprs) {
			fst.use();
			snd.use();
		}
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		let isBoolValue = this.#valueTypeExpr.type instanceof BoolType;

		// unsure if list literals in untyped Plutus-core accept arbitrary terms, so we will use the more verbose constructor functions 
		let res = new IR("__core__mkNilPairData(())");

		// starting from last element, keeping prepending a data version of that item

		for (let i = this.#pairExprs.length - 1; i >= 0; i--) {
			let [keyExpr, valueExpr] = this.#pairExprs[i];

			let valueIR = valueExpr.toIR(indent);

			if (isBoolValue) {
				valueIR = new IR([
					new IR("__helios__common__boolData("),
					valueIR,
					new IR(")"),
				]);
			}

			res = new IR([
				new IR("__core__mkCons("),
				new IR("__core__mkPairData("),
				keyExpr.toIR(indent),
				new IR(","),
				valueIR,
				new IR(")"),
				new IR(", "),
				res,
				new IR(")")
			]);
		}

		return new IR([new IR("__core__mapData", this.site), new IR("("), res, new IR(")")]);
	}
}

/**
 * NameTypePair is base class of FuncArg and DataField (differs from StructLiteralField) 
 * @package
 */
class NameTypePair {
	#name;
	#typeExpr;

	/**
	 * @param {Word} name 
	 * @param {?TypeExpr} typeExpr 
	 */
	constructor(name, typeExpr) {
		this.#name = name;
		this.#typeExpr = typeExpr;
	}

	/**
	 * @type {Site}
	 */
	get site() {
		return this.#name.site;
	}

	/**
	 * @type {Word}
	 */
	get name() {
		return this.#name;
	}

	isIgnored() {
		return this.name.value === "_";
	}

	/**
	 * @returns {boolean}
	 */
	hasType() {
		return this.#typeExpr !== null;
	}

	/**
	 * Throws an error if called before evalType()
	 * @type {Type}
	 */
	get type() {
		if (this.isIgnored()) {
			return new AnyType();
		} else if (this.#typeExpr === null) {
			throw new Error("typeExpr not set");
		} else {
			return this.#typeExpr.type;
		}
	}

	/**
	 * @type {string}
	 */
	get typeName() {
		if (this.#typeExpr === null) {
			return "";
		} else {
			return this.#typeExpr.toString();
		}
	}

	toString() {
		if (this.#typeExpr === null) {
			return this.name.toString();
		} else {
			return `${this.name.toString()}: ${this.#typeExpr.toString()}`;
		}
	}

	/**
	 * Evaluates the type, used by FuncLiteralExpr and DataDefinition
	 * @param {Scope} scope 
	 * @returns {Type}
	 */
	evalType(scope) {
		if (this.isIgnored()) {
			return new AnyType();
		} else if (this.#typeExpr === null) {
			throw new Error("typeExpr not set");
		} else {
			return this.#typeExpr.eval(scope);
		}
	}

	use() {
		if (this.#typeExpr !== null) {
			this.#typeExpr.use();
		}
	}

	/**
	 * @returns {IR}
	 */
	toIR() {
		return new IR(this.#name.toString(), this.#name.site);
	}
}

/**
 * Function argument class
 * @package
 */
class FuncArg extends NameTypePair {
	#defaultValueExpr;

	/**
	 * @param {Word} name 
	 * @param {?TypeExpr} typeExpr
	 * @param {null | ValueExpr} defaultValueExpr
	 */
	constructor(name, typeExpr, defaultValueExpr = null) {
		super(name, typeExpr);

		this.#defaultValueExpr = defaultValueExpr;
	}

	/**
	 * @param {Scope} scope 
	 */
	evalDefault(scope) {
		if (this.#defaultValueExpr != null) {
			const v = this.#defaultValueExpr.eval(scope);

			const t = this.evalType(scope);

			if (!v.isInstanceOf(this.#defaultValueExpr.site, t)) {
				throw this.#defaultValueExpr.site.typeError(`expected ${t.toString()}, got ${v.getType(Site.dummy()).toString()}`);
			}
		}
	}

	/**
	 * @param {Scope} scope 
	 * @returns {ArgType}
	 */
	evalArgType(scope) {
		const t = super.evalType(scope);

		return new ArgType(this.name, t, this.#defaultValueExpr != null);
	}

	/**
	 * @returns {IR}
	 */
	toIR() {
		const name = super.toIR();

		if (this.#defaultValueExpr == null) {
			return name;
		} else {
			return new IR([
				new IR(`__useopt__${this.name.toString()}`),
				new IR(", "),
				name
			]);
		}
	}

	/**
	 * @param {IR} bodyIR 
	 * @param {string} name 
	 * @param {IR} defaultIR 
	 * @returns {IR}
	 */
	static wrapWithDefaultInternal(bodyIR, name, defaultIR) {
		return new IR([
			new IR(`(${name}) -> {`),
			bodyIR,
			new IR([
				new IR(`}(__core__ifThenElse(__useopt__${name}, () -> {${name}}, () -> {`),
				defaultIR, 
				new IR("})())")
			])
		]);
	}

	/**
	 * (argName) -> {
	 *   <bodyIR>
	 * }(
	 *   ifThenElse(
	 * 		__useoptarg__argName,
	 *  	() -> {
	 *        argName
	 *      },
	 *      () -> {
	 *        <defaultValueExpr>
	 *      }
	 *   )()
	 * )
	 * TODO: indentation
	 * @param {IR} bodyIR 
	 * @returns {IR}
	 */
	wrapWithDefault(bodyIR) {
		if (this.#defaultValueExpr == null) {
			return bodyIR;
		} else {
			const name = this.name.toString();

			return FuncArg.wrapWithDefaultInternal(bodyIR, name, this.#defaultValueExpr.toIR(""));
		}
	}
}

/**
 * (..) -> RetTypeExpr {...} expression
 * @package
 */
class FuncLiteralExpr extends ValueExpr {
	#args;
	#retTypeExprs;
	#bodyExpr;

	/**
	 * @param {Site} site 
	 * @param {FuncArg[]} args 
	 * @param {(?TypeExpr)[]} retTypeExprs 
	 * @param {ValueExpr} bodyExpr 
	 */
	constructor(site, args, retTypeExprs, bodyExpr) {
		super(site);
		this.#args = args;
		this.#retTypeExprs = retTypeExprs;
		this.#bodyExpr = bodyExpr;
	}

	/**
	 * @type {Type[]}
	 */
	get argTypes() {
		return this.#args.map(a => a.type);
	}

	/**
	 * @type {string[]}
	 */
	get argTypeNames() {
		return this.#args.map(a => a.typeName)
	}

	/**
	 * @type {Type[]}
	 */
	get retTypes() {
		return this.#retTypeExprs.map(e => {
			if (e == null) {
				return new AnyType();
			} else {
				return e.type
			}
		});
	}

	/**
	 * @returns {boolean}
	 */
	isLiteral() {
		return true;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		if (this.#retTypeExprs.length === 1) {
			let retTypeExpr = this.#retTypeExprs[0];
			if (retTypeExpr == null) {
				return `(${this.#args.map(a => a.toString()).join(", ")}) -> {${this.#bodyExpr.toString()}}`;
			} else {
				return `(${this.#args.map(a => a.toString()).join(", ")}) -> ${retTypeExpr.toString()} {${this.#bodyExpr.toString()}}`;
			}
		} else {
			return `(${this.#args.map(a => a.toString()).join(", ")}) -> (${this.#retTypeExprs.map(e => assertDefined(e).toString()).join(", ")}) {${this.#bodyExpr.toString()}}`;
		}
	}

	/**
	 * @param {Scope} scope 
	 * @returns 
	 */
	evalType(scope) {
		let args = this.#args;
		if (this.isMethod()) {
			args = args.slice(1);
		}

		let argTypes = args.map(a => a.evalArgType(scope));

		let retTypes = this.#retTypeExprs.map(e => {
			if (e == null) {
				return new AnyType();
			} else {
				return e.eval(scope)
			}
		});

		return new FuncType(argTypes, retTypes);
	}

	/**
	 * @param {Scope} scope 
	 * @returns {FuncInstance}
	 */
	evalInternal(scope) {
		let fnType = this.evalType(scope);
		
		// argTypes is calculated separately again here so it includes self
		let argTypes = this.#args.map(a => a.evalType(scope));

		let res = new FuncInstance(fnType);

		let subScope = new Scope(scope);
		argTypes.forEach((a, i) => {
			if (!this.#args[i].isIgnored()) {
				this.#args[i].evalDefault(subScope);

				subScope.set(this.#args[i].name, Instance.new(a));
			}
		});

		let bodyVal = this.#bodyExpr.eval(subScope);

		if (this.#retTypeExprs.length === 1) {
			if (this.#retTypeExprs[0] == null) {
				if (bodyVal instanceof MultiInstance) {
					return new FuncInstance(new FuncType(fnType.argTypes, bodyVal.values.map(v => v.getType(this.site))));
				} else {
					return new FuncInstance(new FuncType(fnType.argTypes, bodyVal.getType(this.site)));
				}
			} else if (bodyVal instanceof MultiInstance) {
				throw this.#retTypeExprs[0].typeError("unexpected multi-value body");
			} else if (!bodyVal.isInstanceOf(this.#retTypeExprs[0].site, fnType.retTypes[0])) {
				throw this.#retTypeExprs[0].typeError(`wrong return type, expected ${fnType.retTypes[0].toString()} but got ${this.#bodyExpr.type.toString()}`);
			}
		} else {
			if (bodyVal instanceof MultiInstance) {
				/** @type {Instance[]} */
				let bodyVals = bodyVal.values;

				if (bodyVals.length !== this.#retTypeExprs.length) {
					throw this.#bodyExpr.typeError(`expected multi-value function body with ${this.#retTypeExprs.length} values, but got ${bodyVals.length} values`);
				} else {
					for (let i = 0; i < bodyVals.length; i++) {
						let v = bodyVals[i];

						let retTypeExpr = assertDefined(this.#retTypeExprs[i]);
						if (!v.isInstanceOf(retTypeExpr.site, fnType.retTypes[i])) {
							throw retTypeExpr.typeError(`wrong return type for value ${i}, expected ${fnType.retTypes[i].toString()} but got ${v.getType(this.#bodyExpr.site).toString()}`);
						}
					}
				}
			} else {
				throw this.#bodyExpr.typeError(`expected multi-value function body, but got ${this.#bodyExpr.type.toString()}`);
			}
		}

		subScope.assertAllUsed();

		return res;
	}

	isMethod() {
		return this.#args.length > 0 && this.#args[0].name.toString() == "self";
	}

	use() {
		for (let arg of this.#args) {
			arg.use();
		}

		this.#retTypeExprs.forEach(e => {
			if (e !== null) {
				e.use();
			}
		});
		this.#bodyExpr.use();
	}

	/**
	 * @returns {IR}
	 */
	argsToIR() {
		let args = this.#args.map(a => a.toIR());
		if (this.isMethod()) {
			args = args.slice(1);
		}

		return (new IR(args)).join(", ");
	}

	/**
	 * In reverse order, because later opt args might depend on earlier args
	 * @param {IR} innerIR 
	 * @returns {IR}
	 */
	wrapWithDefaultArgs(innerIR) {
		const args = this.#args.slice().reverse();

		for (let arg of args) {
			innerIR = arg.wrapWithDefault(innerIR);
		}

		return innerIR;
	}

	/**
	 * @param {?string} recursiveName 
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIRInternal(recursiveName, indent = "") {
		let argsWithCommas = this.argsToIR();

		let innerIndent = indent;
		let methodIndent = indent;
		if (this.isMethod()) {
			innerIndent += TAB;
		}

		if (recursiveName !== null) {
			innerIndent += TAB;
			methodIndent += TAB;
		}

		let innerIR = this.#bodyExpr.toIR(innerIndent + TAB);

		innerIR = this.wrapWithDefaultArgs(innerIR);

		let ir = new IR([
			new IR("("),
			argsWithCommas,
			new IR(") "), new IR("->", this.site), new IR(` {\n${innerIndent}${TAB}`),
			innerIR,
			new IR(`\n${innerIndent}}`),
		]);

		// wrap with 'self'
		if (this.isMethod()) {
			ir = new IR([
				new IR(`(self) -> {\n${methodIndent}${TAB}`),
				ir,
				new IR(`\n${methodIndent}}`),
			]);
		}

		if (recursiveName !== null) {
			ir = new IR([
				new IR("("),
				new IR(recursiveName),
				new IR(`) -> {\n${indent}${TAB}`),
				ir,
				new IR(`\n${indent}}`)
			]);
		}

		return ir;
	}

	/**
	 * @param {string} recursiveName 
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIRRecursive(recursiveName, indent = "") {
		return this.toIRInternal(recursiveName, indent);
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		return this.toIRInternal(null, indent);
	}
}

/**
 * Variable expression
 * @package
 */
class ValueRefExpr extends ValueExpr {
	#name;
	#isRecursiveFunc;

	/**
	 * @param {Word} name 
	 */
	constructor(name) {
		super(name.site);
		this.#name = name;
		this.#isRecursiveFunc = false;
	}

	toString() {
		return this.#name.toString();
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	evalInternal(scope) {
		let val = scope.get(this.#name);

		if (val instanceof FuncInstance && val.isRecursive(scope)) {
			this.#isRecursiveFunc = true;
		}

		return val.assertValue(this.#name.site);
	}

	use() {
		if (this.value instanceof FuncStatementInstance) {
			this.value.statement.use();
		} else if (this.value instanceof ConstStatementInstance) {
			this.value.statement.use();
		}
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		let path = this.toString();

		if (this.value instanceof FuncStatementInstance || this.value instanceof ConstStatementInstance) {
			path = this.value.statement.path;
		} else if (this.value instanceof BuiltinFuncInstance) {
			path = this.value.path;
		}

		let ir = new IR(path, this.site);

		if (this.#isRecursiveFunc) {
			ir = new IR([
				ir,
				new IR("("),
				ir,
				new IR(")")
			]);
		}
		
		return ir;
	}
}

/**
 * Word::Word::... expression
 * @package
 */
class ValuePathExpr extends ValueExpr {
	#baseTypeExpr;
	#memberName;
	#isRecursiveFunc;

	/**
	 * @param {TypeExpr} baseTypeExpr 
	 * @param {Word} memberName 
	 */
	constructor(baseTypeExpr, memberName) {
		super(memberName.site);
		this.#baseTypeExpr = baseTypeExpr;
		this.#memberName = memberName;
		this.#isRecursiveFunc = false;
	}

	/**
	 * @type {Type}
	 */
	get baseType() {
		return this.#baseTypeExpr.type;
	}

	toString() {
		return `${this.#baseTypeExpr.toString()}::${this.#memberName.toString()}`;
	}

	isZeroFieldConstructor() {
		let type = this.type;

		if (type instanceof EnumMemberStatementType && type.statement.name.value === this.#memberName.value) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Returns true if ValuePathExpr constructs a literal enum member with zero field or
	 * if this baseType is also a baseType of the returned value
	 * @returns {boolean}
	 */
	isLiteral() {
		if (this.isZeroFieldConstructor()) {
			return true;
		} else {
			let type = this.type;

			if (this.baseType.isBaseOf(this.site, type)) {
				return true;
			} else {
				return false;
			}
		}
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	evalInternal(scope) {
		let baseType = this.#baseTypeExpr.eval(scope);
		assert(baseType.isType());

		let memberVal = baseType.getTypeMember(this.#memberName);

		if (memberVal instanceof FuncInstance && memberVal.isRecursive(scope)) {
			this.#isRecursiveFunc = true;
		}

		return memberVal.assertValue(this.#memberName.site);
	}

	use() {
		this.#baseTypeExpr.use();

		if (this.value instanceof ConstStatementInstance) {
			this.value.statement.use();
		} else if (this.value instanceof FuncStatementInstance) {
			this.value.statement.use();
		}
	}

	/**
	 * @param {string} indent
	 * @returns {IR}
	 */
	toIR(indent = "") {
		// if we are directly accessing an enum member as a zero-field constructor we must change the code a bit
		let memberVal = this.#baseTypeExpr.type.getTypeMember(this.#memberName);

		if ((memberVal instanceof EnumMemberStatementType) || (memberVal instanceof OptionNoneType)) {
			let cId = memberVal.getConstrIndex(this.#memberName.site);

			assert(cId >= 0);

			return new IR(`__core__constrData(${cId.toString()}, __core__mkNilData(()))`, this.site)
		} else {
			let ir = new IR(`${this.#baseTypeExpr.type.path}__${this.#memberName.toString()}`, this.site);

			if (this.#isRecursiveFunc) {
				ir = new IR([
					ir,
					new IR("("),
					ir,
					new IR(")")
				]);
			}

			return ir;
		}
	}
}

/**
 * Unary operator expression
 * Note: there are no post-unary operators, only pre
 * @package
 */
class UnaryExpr extends ValueExpr {
	#op;
	#a;

	/**
	 * @param {SymbolToken} op 
	 * @param {ValueExpr} a 
	 */
	constructor(op, a) {
		super(op.site);
		this.#op = op;
		this.#a = a;
	}

	toString() {
		return `${this.#op.toString()}${this.#a.toString()}`;
	}

	/**
	 * Turns an op symbol into an internal name
	 * @returns {Word}
	 */
	translateOp() {
		let op = this.#op.toString();
		let site = this.#op.site;

		if (op == "+") {
			return new Word(site, "__pos");
		} else if (op == "-") {
			return new Word(site, "__neg");
		} else if (op == "!") {
			return new Word(site, "__not");
		} else {
			throw new Error("unhandled unary op");
		}
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	evalInternal(scope) {
		let a = this.#a.eval(scope);

		let fnVal = a.assertValue(this.#a.site).getType(this.site).getTypeMember(this.translateOp());

		// ops are immediately applied
		return fnVal.call(this.#op.site, [a]);
	}

	use() {
		this.#a.use();
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		let path = this.type.path;

		return new IR([
			new IR(`${path}__${this.translateOp().value}`, this.site), new IR("("),
			this.#a.toIR(indent),
			new IR(")")
		]);
	}
}

/**
 * Binary operator expression
 * @package
 */
class BinaryExpr extends ValueExpr {
	#op;
	#a;
	#b;
	#swap; // swap a and b for commutative ops
	#alt; // use alt (each operator can have one overload)

	/**
	 * @param {SymbolToken} op 
	 * @param {ValueExpr} a 
	 * @param {ValueExpr} b 
	 */
	constructor(op, a, b) {
		super(op.site);
		this.#op = op;
		this.#a = a;
		this.#b = b;
		this.#swap = false;
		this.#alt = false;
	}

	/** 
	 * @type {ValueExpr}
	 */
	get first() {
		return this.#swap ? this.#b : this.#a;
	}

	/**
	 * @type {ValueExpr} 
	 */
	get second() {
		return this.#swap ? this.#a : this.#b;
	}

	toString() {
		return `${this.#a.toString()} ${this.#op.toString()} ${this.#b.toString()}`;
	}

	/**
	 * Turns op symbol into internal name
	 * @param {boolean} alt
	 * @returns {Word}
	 */
	translateOp(alt = false) {
		let op = this.#op.toString();
		let site = this.#op.site;
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

		if (alt) {
			name += "_alt";
		}

		return new Word(site, name);
	}

	isCommutative() {
		let op = this.#op.toString();
		return op == "+" || op == "*";
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	evalInternal(scope) {
		let a = this.#a.eval(scope);
		let b = this.#b.eval(scope);

		assert(a.isValue() && b.isValue());

		/**
		 * @type {?UserError}
		 */
		let firstError = null;

		for (let swap of (this.isCommutative() ? [false, true] : [false])) {
			for (let alt of [false, true]) {
				let first  = swap ? b : a;
				let second = swap ? a : b;

				try {
					let fnVal = first.getType(this.site).getTypeMember(this.translateOp(alt));

					let res = fnVal.call(this.#op.site, [first, second]);

					this.#swap = swap;
					this.#alt  = alt;

					return res;
				} catch (e) {
					if (e instanceof UserError) {
						if (firstError === null) {
							firstError = e;
						}
						continue;
					} else {
						throw e;
					}
				}
			}
		}

		if (firstError !== null) {
			throw firstError;
		} else {
			throw new Error("unexpected");
		}
	}

	use() {
		this.#a.use();
		this.#b.use();
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		let path = this.first.type.path;

		let op = this.translateOp(this.#alt).value;

		if (op == "__and" || op == "__or") {
			return new IR([
				new IR(`${path}${op}`, this.site), new IR(`(\n${indent}${TAB}() -> {`),
				this.first.toIR(indent + TAB),
				new IR(`},\n${indent}${TAB}() -> {`),
				this.second.toIR(indent + TAB),
				new IR(`}\n${indent})`)
			]);
		} else {
			return new IR([
				new IR(`${path}__${op}`, this.site), new IR("("),
				this.first.toIR(indent),
				new IR(", "),
				this.second.toIR(indent),
				new IR(")")
			]);
		}
	}
}

/**
 * Parentheses expression
 * @package
 */
class ParensExpr extends ValueExpr {
	#exprs;

	/**
	 * @param {Site} site 
	 * @param {ValueExpr[]} exprs
	 */
	constructor(site, exprs) {
		super(site);
		this.#exprs = exprs;
	}

	toString() {
		return `(${this.#exprs.map(e => e.toString()).join(", ")})`;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	evalInternal(scope) {
		if (this.#exprs.length === 1) {
			return this.#exprs[0].eval(scope);
		} else {
			return new MultiInstance(this.#exprs.map(e => {
				const v = e.eval(scope);

				if (v.getType(e.site) instanceof ErrorType) {
					throw e.site.typeError("unexpected error call in multi-valued expression");
				}

				return v;
			}));
		}
	}

	use() {
		this.#exprs.forEach(e => e.use());
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		if (this.#exprs.length === 1) {
			return this.#exprs[0].toIR(indent);
		} else {
			return new IR(
				[new IR(`(callback) -> {\n${indent + TAB}callback(\n${indent + TAB + TAB}`, this.site)]
				.concat(new IR(this.#exprs.map(e => e.toIR(indent + TAB + TAB))).join(`,\n${indent + TAB + TAB}`))
				.concat([new IR(`\n${indent + TAB})\n${indent}}`)])
			);
		}
	}
}

/**
 * @package
 */
class CallArgExpr extends Token {
	#name;
	#valueExpr;

	/**
	 * @param {Site} site 
	 * @param {null | Word} name 
	 * @param {ValueExpr} valueExpr 
	 */
	constructor(site, name, valueExpr) {
		super(site);

		this.#name = name;
		this.#valueExpr = valueExpr;
	}

	/**
	 * @type {string}
	 */
	get name() {
		return this.#name?.toString() ?? "";
	}

	/**
	 * @type {ValueExpr}
	 */
	get valueExpr() {
		return this.#valueExpr;
	}

	/**
	 * @type {Instance}
	 */
	get value() {
		return this.#valueExpr.value;
	}

	/**
	 * @returns {boolean}
	 */
	isNamed() {
		return this.#name != null;
	}

	/**
	 * @returns {boolean}
	 */
	isLiteral() {
		return this.#valueExpr.isLiteral();
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return [
			this.#name != null ? `${this.#name.toString()}: `: "",
			this.#valueExpr.toString()
		].join("");
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	eval(scope) {
		return this.#valueExpr.eval(scope);
	}

	use() {
		this.#valueExpr.use();
	}
}

/**
 * ...(...) expression
 * @package
 */
class CallExpr extends ValueExpr {
	#fnExpr;
	#argExprs;

	/**
	 * @param {Site} site 
	 * @param {ValueExpr} fnExpr 
	 * @param {CallArgExpr[]} argExprs 
	 */
	constructor(site, fnExpr, argExprs) {
		super(site);
		this.#fnExpr = fnExpr;
		this.#argExprs = argExprs;
	}

	get fnExpr() {
		return this.#fnExpr;
	}

	toString() {
		return `${this.#fnExpr.toString()}(${this.#argExprs.map(a => a.toString()).join(", ")})`;
	}

	isLiteral() {
		if (this.#fnExpr instanceof ValuePathExpr && this.#fnExpr.baseType.isBaseOf(this.site, this.type)) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	evalInternal(scope) {
		const fnVal = this.#fnExpr.eval(scope);

		const argVals = this.#argExprs.map(ae => ae.eval(scope));

		/**
		 * @type {Instance[]}
		 */
		let posArgVals = [];

		this.#argExprs.forEach((argExpr, i) => {
			if (!argExpr.isNamed()) {
				posArgVals.push(argVals[i]);
			}
		});

		posArgVals = MultiInstance.flatten(posArgVals);

		/**
		 * @type {{[name: string]: Instance}}
		 */
		const namedArgVals = {};

		this.#argExprs.forEach((argExpr, i) => {
			if (argExpr.isNamed()) {
				const val = argVals[i];

				// can't be multi instance
				if (val instanceof MultiInstance) {
					throw argExpr.typeError("can't use multiple return values as named argument");
				}

				namedArgVals[argExpr.name] = val;
			}
		});

		assert(posArgVals.every(pav => pav != undefined));

		return fnVal.call(this.site, posArgVals, namedArgVals);
	}

	use() {
		this.#fnExpr.use();

		for (let arg of this.#argExprs) {
			arg.use();
		}
	}

	/**
	 * Don't call this inside eval() because param types won't yet be complete.
	 * @type {FuncType}
	 */
	get fn() {
		return assertClass(this.#fnExpr.value.getType(this.#fnExpr.site), FuncType);
	}

	/**
	 * @returns {[ValueExpr[], IR[]]} - first list are positional args, second list named args and remaining opt args
	 */
	expandArgs() {
		const fn = this.fn;
		const nNonOptArgs = fn.nNonOptArgs;

		/**
		 * @type {ValueExpr[]}
		 */
		const positional = [];

		this.#argExprs.forEach(ae => {
			if (!ae.isNamed()) {
				positional.push(ae.valueExpr);
			}
		});

		/**
		 * @type {IR[]}
		 */
		const namedOptional = [];

		this.#argExprs.forEach(ae => {
			if (ae.isNamed()) {
				const i = fn.getNamedIndex(ae.site, ae.name);

				if (i < nNonOptArgs) {
					positional[i] = ae.valueExpr;
				} else {
					namedOptional[i - nNonOptArgs] = new IR([
						new IR("true"),
						new IR(", "),
						ae.valueExpr.toIR()
					]);
				}
			}
		});

		for (let i = nNonOptArgs; i < fn.nArgs; i++) {
			if (namedOptional[i - nNonOptArgs] == undefined) {
				namedOptional[i - nNonOptArgs] = new IR([
					new IR("false"),
					new IR(", "),
					new IR("()")
				]);
			}
		}

		return [positional.filter(p => p != undefined), namedOptional];
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		const fn = this.fn;

		/**
		 * First step is to eliminate the named args
		 * @type {[ValueExpr[], IR[]]}
		 */
		const [positional, namedOptional] = this.expandArgs();

		if (positional.some(e => (!e.isLiteral()) && (e.value instanceof MultiInstance))) {
			// count the number of final args
			let n = 0;

			positional.forEach((e, i) => {
				if ((!e.isLiteral()) && (e.value instanceof MultiInstance)) {
					n += e.value.values.length;
				} else {
					n += 1;
				}
			});

			n += namedOptional.length;

			if (n > fn.nArgs) {
				namedOptional.splice(0, n - fn.nArgs);
			}

			let names = [];

			for (let i = 0; i < fn.nArgs; i++) {
				if (i >= fn.nNonOptArgs) {
					names.push(`__useopt__x${i}`);
				}

				names.push(`x${i}`);
			}

			let ir = new IR([
				this.#fnExpr.toIR(),
				new IR("("),
				new IR(names.map(n => new IR(n))).join(", "),
				new IR(")", this.site)
			]);

			for (let namedIR of namedOptional.slice().reverse()) {
				const n2 = assertDefined(names.pop());
				const n1 = assertDefined(names.pop());
				assert(n1.startsWith("__useopt__"));

				ir = new IR([
					new IR("("),
					new IR(n1),
					new IR(", "),
					new IR(n2),
					new IR(") -> {"),
					ir,
					new IR("}("),
					assertDefined(namedIR), // bool - val pair
					new IR(")")
				]);
			}

			for (let i = positional.length - 1; i >= 0; i--) {
				const e = positional[i];

				if ((!e.isLiteral()) && (e.value instanceof MultiInstance)) {
					const nMulti = e.value.values.length;
					const multiNames = [];
					const multiOpt = [];

					while (multiNames.length < nMulti) {
						multiNames.unshift(assertDefined(names.pop()));

						if (names.length > 0 && names[names.length-1] == `__useopt__${multiNames[0]}`) {
							multiOpt.unshift(assertDefined(names.pop()));
						}
					}

					if (multiOpt.length > 0) {
						ir = new IR([
							new IR("("),
							new IR(multiOpt.map(n => new IR(n))).join(", "),
							new IR(") -> {"),
							ir,
							new IR("}("),
							new IR(multiOpt.map(n => new IR("true"))).join(", "),
							new IR(")")
						])
					}

					ir = new IR([
						e.toIR(),
						new IR("(("),
						new IR(multiNames.map(n => new IR(n))).join(", "),
						new IR(") -> {"),
						ir,
						new IR("})")
					]);
				} else {
					const name = assertDefined(names.pop());

					if (names.length > 0 && names[names.length - 1] == `__useopt__${name}`) {
						ir = new IR([
							new IR("("),
							new IR(assertDefined(names.pop())),
							new IR(") -> {"),
							new IR("}(true)")
						]);
					}

					ir = new IR([
						new IR("("),
						new IR(name),
						new IR(") -> {"),
						ir,
						new IR("}("),
						e.toIR(),
						new IR(")")
					]);
				}
			}

			return ir;
		} else {
			if (positional.length + namedOptional.length > fn.nArgs) {
				namedOptional.splice(0, positional.length + namedOptional.length - fn.nArgs);
			}

			let args = positional.map((a, i) => {
				let ir = a.toIR(indent);

				if (i >= fn.nNonOptArgs) {
					ir = new IR([
						new IR("true, "),
						ir
					]);
				}

				return ir;
			}).concat(namedOptional);

			return new IR([
				this.#fnExpr.toIR(indent),
				new IR("("),
				(new IR(args)).join(", "),
				new IR(")", this.site)
			]);
		}
	}
}

/**
 *  ... . ... expression
 * @package
 */
class MemberExpr extends ValueExpr {
	#objExpr;
	#memberName;
	#isRecursiveFunc;

	/**
	 * @param {Site} site 
	 * @param {ValueExpr} objExpr 
	 * @param {Word} memberName 
	 */
	constructor(site, objExpr, memberName) {
		super(site);
		this.#objExpr = objExpr;
		this.#memberName = memberName;
		this.#isRecursiveFunc = false;
	}

	toString() {
		return `${this.#objExpr.toString()}.${this.#memberName.toString()}`;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	evalInternal(scope) {
		let objVal = this.#objExpr.eval(scope);

		let memberVal = objVal.assertValue(this.#objExpr.site).getInstanceMember(this.#memberName);

		if (memberVal instanceof FuncInstance && memberVal.isRecursive(scope)) {
			this.#isRecursiveFunc = true;
		}

		return memberVal;
	}

	use() {
		this.#objExpr.use();

		if (this.value instanceof FuncStatementInstance) {
			this.value.statement.use();
		} else if (this.value instanceof ConstStatementInstance) {
			this.value.statement.use();
		}
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		// members can be functions so, field getters are also encoded as functions for consistency

		let objPath = this.#objExpr.type.path;

		// if we are getting the member of an enum member we should check if it a field or method, because for a method we have to use the parent type
		if ((this.#objExpr.type instanceof EnumMemberStatementType) && (!this.#objExpr.type.statement.hasField(this.#memberName))) {
			objPath = this.#objExpr.type.statement.parent.path;
		}

		// if the memberVal was a ParamFuncValue then the member name might need to be modified if the output type of some callbacks is a Bool
		if (this.value instanceof ParamFuncValue && this.value.correctMemberName !== null) {
			this.#memberName = new Word(this.#memberName.site, this.value.correctMemberName());
		}

		let ir = new IR(`${objPath}__${this.#memberName.toString()}`, this.site);

		if (this.#isRecursiveFunc) {
			ir = new IR([
				ir,
				new IR("("),
				ir,
				new IR(")"),
			]);
		}

		return new IR([
			ir, new IR("("),
			this.#objExpr.toIR(indent),
			new IR(")"),
		]);
	}
}

/**
 * if-then-else expression 
 * @package
 */
class IfElseExpr extends ValueExpr {
	#conditions;
	#branches;

	/**
	 * @param {Site} site 
	 * @param {ValueExpr[]} conditions 
	 * @param {ValueExpr[]} branches 
	 */
	constructor(site, conditions, branches) {
		assert(branches.length == conditions.length + 1);
		assert(branches.length > 1);

		super(site);
		this.#conditions = conditions;
		this.#branches = branches;
	}

	toString() {
		let s = "";
		for (let i = 0; i < this.#conditions.length; i++) {
			s += `if (${this.#conditions[i].toString()}) {${this.#branches[i].toString()}} else `;
		}

		s += `{${this.#branches[this.#conditions.length].toString()}}`;

		return s;
	}

	/**
	 * @param {Site} site
	 * @param {?Type} prevType
	 * @param {Type} newType
	 */
	static reduceBranchType(site, prevType, newType) {
		if (prevType === null || prevType instanceof ErrorType) {
			return newType;
		} else if (newType instanceof ErrorType) {
			return prevType;
		} else if (!prevType.isBaseOf(site, newType)) {
			if (newType.isBaseOf(site, prevType)) {
				return newType;
			} else {
				// check if enumparent is base of newType and of prevType
				if (newType.isEnumMember()) {
					const parentType = newType.parentType(Site.dummy());

					if (parentType.isBaseOf(site, prevType) && parentType.isBaseOf(site, newType)) {
						return parentType;
					}
				}

				throw site.typeError("inconsistent types");
			}
		} else {
			return prevType;
		}
	}

	/**
	 * @param {Site} site
	 * @param {?Type[]} prevTypes
	 * @param {Instance} newValue
	 * @returns {?Type[]}
	 */
	static reduceBranchMultiType(site, prevTypes, newValue) {
		if (!(newValue instanceof MultiInstance) && newValue.getType(site) instanceof ErrorType) {
			return prevTypes;
		}

		const newTypes = (newValue instanceof MultiInstance) ?
			newValue.values.map(v => v.getType(site)) :
			[newValue.getType(site)];

		if (prevTypes === null) {
			return newTypes;
		} else if (prevTypes.length !== newTypes.length) {
			throw site.typeError("inconsistent number of multi-value types");
		} else {
			return prevTypes.map((pt, i) => IfElseExpr.reduceBranchType(site, pt, newTypes[i]));
		}
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	evalInternal(scope) {
		for (let c of this.#conditions) {
			let cVal = c.eval(scope);
			if (!cVal.isInstanceOf(c.site, BoolType)) {
				throw c.typeError("expected bool");
			}
		}

		/**
		 * Supports multiple return values
		 * @type {?Type[]}
		 */
		let branchMultiType = null;

		for (let b of this.#branches) {
			let branchVal = b.eval(scope);

			branchMultiType = IfElseExpr.reduceBranchMultiType(
				b.site, 
				branchMultiType, 
				branchVal
			);
		}

		if (branchMultiType === null) {
			// i.e. every branch throws an error
			return Instance.new(new ErrorType());
		} else  {
			return Instance.new(branchMultiType);
		}
	}

	use() {
		for (let c of this.#conditions) {
			c.use();
		}

		for (let b of this.#branches) {
			b.use();
		}
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		let n = this.#conditions.length;

		// each branch actually returns a function to allow deferred evaluation
		let res = new IR([
			new IR("() -> {"),
			this.#branches[n].toIR(indent),
			new IR("}")
		]);

		// TODO: nice indentation
		for (let i = n - 1; i >= 0; i--) {
			res = new IR([
				new IR("__core__ifThenElse("),
				this.#conditions[i].toIR(indent),
				new IR(", () -> {"),
				this.#branches[i].toIR(indent),
				new IR("}, () -> {"),
				res,
				new IR("()})"),
			]);
		}

		return new IR([res, new IR("()", this.site)]);
	}
}

/**
 * DestructExpr is for the lhs-side of assignments and for switch cases
 * @package
 */
class DestructExpr {
	#name;
	#typeExpr;
	#destructExprs;

	/**
	 * @param {Word} name - use an underscore as a sink
	 * @param {?TypeExpr} typeExpr 
	 * @param {DestructExpr[]} destructExprs
	 */
	constructor(name, typeExpr, destructExprs = []) {
		this.#name = name;
		this.#typeExpr = typeExpr;
		this.#destructExprs = destructExprs;

		assert (!(this.#typeExpr == null && this.#destructExprs.length > 0));
	}

	/**
	 * @type {Site}
	 */
	get site() {
		return this.#name.site;
	}

	/**
	 * @type {Word}
	 */
	get name() {
		return this.#name;
	}

	/**
	 * @returns {boolean}
	 */
	hasDestructExprs() {
		return this.#destructExprs.length > 0;
	}

	isIgnored() {
		return this.name.value === "_";
	}

	/**
	 * @returns {boolean}
	 */
	hasType() {
		return this.#typeExpr !== null;
	}

	/**
	 * Throws an error if called before evalType()
	 * @type {Type}
	 */
	get type() {
		if (this.#typeExpr === null) {
			if (this.isIgnored()) {
				return new AnyType();
			} else {
				throw new Error("typeExpr not set");
			}
		} else {
			return this.#typeExpr.type;
		}
	}

	/**
	 * @type {Word}
	 */
	get typeName() {
		if (this.#typeExpr === null) {
			return new Word(this.site, "");
		} else {
			return new Word(this.#typeExpr.site, this.#typeExpr.toString());
		}
	}

	toString() {
		if (this.#typeExpr === null) {
			return this.name.toString();
		} else {
			let destructStr = "";

			if (this.#destructExprs.length > 0) {
				destructStr = `{${this.#destructExprs.map(de => de.toString()).join(", ")}}`;
			}

			if (this.isIgnored()) {
				return `${this.#typeExpr.toString()}${destructStr}`;
			} else {
				return `${this.name.toString()}: ${this.#typeExpr.toString()}${destructStr}`;
			}
		}
	}

	/**
	 * Evaluates the type, used by FuncLiteralExpr and DataDefinition
	 * @param {Scope} scope 
	 * @returns {Type}
	 */
	evalType(scope) {
		if (this.#typeExpr === null) {
			if (this.isIgnored()) {
				return new AnyType();
			} else {
				throw new Error("typeExpr not set");
			}
		} else {
			return this.#typeExpr.eval(scope);
		}
	}

	/**
	 * @param {Scope} scope 
	 * @param {Type} upstreamType 
	 */
	evalDestructExprs(scope, upstreamType) {
		if (this.#destructExprs.length > 0) {
			if (!(upstreamType instanceof AnyType) && upstreamType.nFields(this.site) != this.#destructExprs.length) {
				throw this.site.typeError(`wrong number of destruct fields, expected ${upstreamType.nFields(this.site)}, got ${this.#destructExprs.length}`);
			}

			for (let i = 0; i < this.#destructExprs.length; i++) {

				this.#destructExprs[i].evalInternal(
					scope, 
					upstreamType.getFieldType(this.site, i), 
					i
				);
			}
		}
	}

	/**
	 * @param {Scope} scope 
	 * @param {Type} upstreamType
	 * @param {number} i
	 */
	evalInternal(scope, upstreamType, i) {
		if (this.hasType()) {
			let t = this.evalType(scope)

			assert(t.isType());

			// differs from upstreamType because can be enum parent
			let checkType = t;

			// if t is enum variant, get parent instead (exact variant is checked at runtime instead)
			if (t.isEnumMember() && !upstreamType.isEnumMember()) {
				checkType = t.parentType(this.site);
			}

			if (!Instance.new(upstreamType).isInstanceOf(this.site, checkType)) {
				throw this.site.typeError(`expected ${checkType.toString()} for destructure field ${i+1}, got ${upstreamType.toString()}`);
			}

			if (!this.isIgnored()) {
				// TODO: take into account ghost type parameters
				scope.set(this.name, Instance.new(t));
			}

			this.evalDestructExprs(scope, t);
		} else {
			if (!this.isIgnored()) {
				// TODO: take into account ghost type parameters
				scope.set(this.name, Instance.new(upstreamType));
			}

			this.evalDestructExprs(scope, upstreamType);
		}
	}

	/**
	 * @param {Scope} scope
	 * @param {Type} caseType
	 */
	evalInSwitchCase(scope, caseType) {
		if (!this.isIgnored()) {
			scope.set(this.#name, Instance.new(caseType));
		}

		this.evalDestructExprs(scope, caseType)
	}

	/**
	 * @param {Scope} scope 
	 * @param {Type} upstreamType
	 * @param {number} i
	 */
	evalInAssignExpr(scope, upstreamType, i) {
		let t = this.evalType(scope)

		assert(t.isType());

		// differs from upstreamType because can be enum parent
		let checkType = t;

		// if t is enum variant, get parent instead (exact variant is checked at runtime instead)
		if (t.isEnumMember() && !upstreamType.isEnumMember()) {
			checkType = t.parentType(this.site);
		}

		if (!Instance.new(upstreamType).isInstanceOf(this.site, checkType)) {
			throw this.site.typeError(`expected ${checkType.toString()} for rhs ${i+1}, got ${upstreamType.toString()}`);
		}

		if (!this.isIgnored()) {
			// TODO: take into account ghost type parameters
			scope.set(this.name, Instance.new(t));
		}

		this.evalDestructExprs(scope, t);
	}

	use() {
		if (this.#typeExpr !== null) {
			this.#typeExpr.use();
		}
	}

	/**
	 * @param {number} argIndex 
	 * @returns {IR}
	 */
	toNameIR(argIndex) {
		if (this.isIgnored()) {
			return new IR(`__lhs_${argIndex}`);
		} else {
			return new IR(this.#name.toString(), this.#name.site)
		}
	}

	/**
	 * @param {number} fieldIndex
	 * @param {boolean} isSwitchCase
	 * @returns {string}
	 */
	getFieldFn(fieldIndex, isSwitchCase = false) {
		if (isSwitchCase) {
			return `__helios__common__field_${fieldIndex}`;
		}

		const type = this.type;

		if (type.isEnumMember()) {
			return `__helios__common__field_${fieldIndex}`;
		} else if (type instanceof StructStatementType) {
			if (type.nFields(Site.dummy()) == 1) {
				return "";
			} else {
				return `__helios__common__tuple_field_${fieldIndex}`;
			}
		} else {
			return "";
		}
	}

	/**
	 * @param {string} indent
	 * @param {IR} inner 
	 * @param {string} objName 
	 * @param {number} fieldIndex 
	 * @param {string} fieldFn
	 * @returns {IR}
	 */
	wrapDestructIRInternal(indent, inner, objName, fieldIndex, fieldFn) {
		if (this.isIgnored() && this.#destructExprs.length == 0) {
			return inner;
		} else {
			const baseName = this.isIgnored() ? `${objName}_${fieldIndex}` : this.#name.toString();

			for (let i = this.#destructExprs.length - 1; i >= 0; i--) {
				inner = this.#destructExprs[i].wrapDestructIRInternal(indent + TAB, inner, baseName, i, this.getFieldFn(i));
			}

			let getter = `${fieldFn}(${objName})`;

			// assert correct constructor index
			if (this.#typeExpr && this.type.isEnumMember()) {
				const constrIdx = this.type.getConstrIndex(this.#typeExpr.site);

				getter = `__helios__common__assert_constr_index(${getter}, ${constrIdx})`;
			}
			
			return new IR([
				new IR("("),
				new IR(baseName, this.#name.site),
				new IR(") "),
				new IR("->", this.site), new IR(` {\n${indent}${TAB}`),
				inner,
				new IR(`\n${indent}}(${getter})`),
			]);
		}
	}

	/**
	 * @param {string} indent
	 * @param {IR} inner 
	 * @param {number} argIndex 
	 * @param {boolean} isSwitchCase
	 * @returns {IR}
	 */
	wrapDestructIR(indent, inner, argIndex, isSwitchCase = false) {
		if (this.#destructExprs.length == 0) {
			return inner;
		} else {
			const baseName = this.isIgnored() ? `__lhs_${argIndex}` : this.#name.toString();

			for (let i = this.#destructExprs.length - 1; i >= 0; i--) {
				const de = this.#destructExprs[i];

				inner = de.wrapDestructIRInternal(indent + TAB, inner, baseName, i, this.getFieldFn(i, isSwitchCase));
			}

			return inner;
		}
	}

	/**
	 * @returns {IR}
	 */
	toIR() {
		return new IR(this.#name.toString(), this.#name.site);
	}
}

/**
 * Switch case for a switch expression
 * @package
 */
class SwitchCase extends Token {
	#lhs;
	#bodyExpr;

	/** @type {?number} */
	#constrIndex;

	/**
	 * @param {Site} site 
	 * @param {DestructExpr} lhs
	 * @param {ValueExpr} bodyExpr 
	 */
	constructor(site, lhs, bodyExpr) {
		super(site);
		this.#lhs = lhs;
		this.#bodyExpr = bodyExpr;
		this.#constrIndex = null;
	}

	/**
	 * @type {ValueExpr}
	 */
	get body() {
		return this.#bodyExpr;
	}

	/**
	 * Used by parser to check if typeExpr reference the same base enum
	 * @type {Word} - word representation of type
	 */
	get memberName() {
		return this.#lhs.typeName;
	}

	isDataMember() {
		switch (this.memberName.value) {
			case "Int":
			case "[]Data":
			case "ByteArray":
			case "Map[Data]Data":
				return true;
			default:
				return false;
		}
	}

	get constrIndex() {
		if (this.#constrIndex === null) {
			throw new Error("constrIndex not yet set");
		} else {
			return this.#constrIndex;
		}
	}

	toString() {
		return `${this.#lhs.toString()} => ${this.#bodyExpr.toString()}`;
	}

	/**
	 * Evaluates the switch type and body value of a case.
	 * @param {Scope} scope 
	 * @param {Type} enumType
	 * @returns {Instance}
	 */
	evalEnumMember(scope, enumType) {
		const caseType = enumType.getTypeMember(this.memberName).assertType(this.memberName.site);

		this.#constrIndex = caseType.getConstrIndex(this.memberName.site);

		assert(this.#constrIndex >= 0);

		const caseScope = new Scope(scope);

		this.#lhs.evalInSwitchCase(caseScope, caseType);

		const bodyVal = this.#bodyExpr.eval(caseScope);

		caseScope.assertAllUsed();

		return bodyVal;
	}

	/**
	 * Evaluates the switch type and body value of a case.
	 * @param {Scope} scope
	 * @returns {Instance}
	 */
	evalDataMember(scope) {
		/** @type {Type} */
		let memberType;

		switch (this.memberName.value) {
			case "Int":
				memberType = new IntType();
				break;
			case "ByteArray":
				memberType = new ByteArrayType();
				break;
			case "[]Data":
				memberType = new ListType(new RawDataType());
				break;
			case "Map[Data]Data":
				memberType = new MapType(new RawDataType(), new RawDataType());
				break;
			default:
				let maybeMemberType = scope.get(this.memberName);
				if (maybeMemberType instanceof Type) {
					memberType = maybeMemberType;

					if (!(memberType instanceof EnumStatementType)) {
						throw this.memberName.typeError("expected an enum type");
					}
				} else {
					throw this.memberName.typeError("expected a type");
				}
		}

		const caseScope = new Scope(scope);

		this.#lhs.evalInSwitchCase(caseScope, memberType);

		const bodyVal = this.#bodyExpr.eval(caseScope);

		caseScope.assertAllUsed();

		return bodyVal;
	}

	use() {
		this.#bodyExpr.use();
	}

	/**
	 * Accept an arg because will be called with the result of the controlexpr
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		let inner = this.#bodyExpr.toIR(indent + TAB);

		inner = this.#lhs.wrapDestructIR(indent, inner, 0, true);

		return new IR([
			new IR("("),
			this.#lhs.toNameIR(0), 
			new IR(") "),
			new IR("->", this.site), new IR(` {\n${indent}${TAB}`),
			inner,
			new IR(`\n${indent}}`),
		]);
	}
}

/**
 * @package
 */
class UnconstrDataSwitchCase extends SwitchCase {
	#intVarName;
	#lstVarName;

	/**
	 * @param {Site} site 
	 * @param {?Word} intVarName 
	 * @param {?Word} lstVarName 
	 * @param {ValueExpr} bodyExpr 
	 */
	constructor(site, intVarName, lstVarName, bodyExpr) {
		super(site, new DestructExpr(new Word(site, "_"), new TypeRefExpr(new Word(site, "(Int, []Data)"))), bodyExpr);

		this.#intVarName = intVarName;
		this.#lstVarName = lstVarName;
	}

	isDataMember() {
		return true;
	}

	toString() {
		return `(${this.#intVarName === null ? "" : this.#intVarName.value + ": "}Int, ${this.#lstVarName === null ? "" : this.#lstVarName.value + ": "} []Data) => ${this.body.toString()}`;
	}

	/**
	 * @param {Scope} scope 
	 * @param {Type} enumType
	 * @returns {Instance}
	 */
	evalEnumMember(scope, enumType) {
		throw new Error("not available");
	}

	/**
	 * Evaluates the switch type and body value of a case.
	 * @param {Scope} scope
	 * @returns {Instance}
	 */
	evalDataMember(scope) {
		if (this.#intVarName !== null || this.#lstVarName !== null) {
			let caseScope = new Scope(scope);

			if (this.#intVarName !== null) {
				caseScope.set(this.#intVarName, Instance.new(new IntType()));
			}

			if (this.#lstVarName !== null) {
				caseScope.set(this.#lstVarName, Instance.new(new ListType(new RawDataType())));
			}

			let bodyVal = this.body.eval(caseScope);

			caseScope.assertAllUsed();

			return bodyVal;
		} else {
			return this.body.eval(scope);
		}
	}

	/**
	 * Accepts two args
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		return new IR([
			new IR(`(data) -> {\n${indent}${TAB}`),
			new IR(`(pair) -> {\n${indent}${TAB}${TAB}`),
			new IR(`(${this.#intVarName !== null ? this.#intVarName.toString() : "_"}, ${this.#lstVarName !== null ? this.#lstVarName.toString() : "_"}) `), new IR("->", this.site), new IR(` {\n${indent}${TAB}${TAB}${TAB}`),
			this.body.toIR(indent + TAB + TAB + TAB),
			new IR(`\n${indent}${TAB}${TAB}}(__core__iData(__core__fstPair(pair)), __core__listData(__core__sndPair(pair)))`),
			new IR(`\n${indent}${TAB}}(__core__unConstrData(data))`),
			new IR(`\n${indent}}`)
		]);
	}
}

/**
 * Default switch case
 * @package
 */
class SwitchDefault extends Token {
	#bodyExpr;

	/**
	 * @param {Site} site
	 * @param {ValueExpr} bodyExpr
	 */
	constructor(site, bodyExpr) {
		super(site);
		this.#bodyExpr = bodyExpr;
	}

	toString() {
		return `else => ${this.#bodyExpr.toString()}`;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	eval(scope) {
		return this.#bodyExpr.eval(scope);
	}

	use() {
		this.#bodyExpr.use();
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		return new IR([
			new IR(`(_) `), new IR("->", this.site), new IR(` {\n${indent}${TAB}`),
			this.#bodyExpr.toIR(indent + TAB),
			new IR(`\n${indent}}`)
		]);
	}
}

/**
 * Parent class of EnumSwitchExpr and DataSwitchExpr
 */
class SwitchExpr extends ValueExpr {
	#controlExpr;
	#cases;
	#defaultCase;

	/** 
	 * @param {Site} site
	 * @param {ValueExpr} controlExpr - input value of the switch
	 * @param {SwitchCase[]} cases
	 * @param {?SwitchDefault} defaultCase
	*/
	constructor(site, controlExpr, cases, defaultCase = null) {
		super(site);
		this.#controlExpr = controlExpr;
		this.#cases = cases;
		this.#defaultCase = defaultCase;
	}

	get controlExpr() {
		return this.#controlExpr;
	}

	get cases() {
		return this.#cases;
	}

	get defaultCase() {
		return this.#defaultCase;
	}

	/**
	 * If there isn't enough coverage then we can simply set the default case to void, so the other branches can be error, print or assert
	 */
	setDefaultCaseToVoid() {
		this.#defaultCase = new SwitchDefault(this.site, new VoidExpr(this.site));
	}

	toString() {
		return `${this.#controlExpr.toString()}.switch{${this.#cases.map(c => c.toString()).join(", ")}${this.#defaultCase === null ? "" : ", " + this.#defaultCase.toString()}}`;
	}

	use() {
		this.#controlExpr.use();

		for (let c of this.#cases) {
			c.use();
		}

		if (this.#defaultCase !== null) {
			this.#defaultCase.use();
		}
	}
}

/**
 * Switch expression for Enum, with SwitchCases and SwitchDefault as children
 * @package
 */
class EnumSwitchExpr extends SwitchExpr {
	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	evalInternal(scope) {
		let controlVal = this.controlExpr.eval(scope);
		let enumType = controlVal.getType(this.controlExpr.site);
		let nEnumMembers = enumType.nEnumMembers(this.controlExpr.site);

		// check that we have enough cases to cover the enum members
		if (this.defaultCase === null && nEnumMembers > this.cases.length) {
			// mutate defaultCase to VoidExpr
			this.setDefaultCaseToVoid();
		}

		/** @type {?Type[]} */
		let branchMultiType = null;

		for (let c of this.cases) {
			let branchVal = c.evalEnumMember(scope, enumType);
	
			branchMultiType = IfElseExpr.reduceBranchMultiType(
				c.site, 
				branchMultiType, 
				branchVal
			);
		}

		if (this.defaultCase !== null) {
			let defaultVal = this.defaultCase.eval(scope);

			branchMultiType = IfElseExpr.reduceBranchMultiType(
				this.defaultCase.site,
				branchMultiType, 
				defaultVal
			);
		}

		if (branchMultiType === null) {
			return Instance.new(new ErrorType());
		} else {
			return Instance.new(branchMultiType);
		}
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		let cases = this.cases.slice();

		/** @type {SwitchCase | SwitchDefault} */
		let last;
		if (this.defaultCase !== null) {
			last = this.defaultCase;
		} else {
			last = assertDefined(cases.pop());
		}

		let n = cases.length;

		let res = last.toIR(indent + TAB + TAB + TAB);

		for (let i = n - 1; i >= 0; i--) {
			res = new IR([
				new IR(`__core__ifThenElse(__core__equalsInteger(i, ${cases[i].constrIndex.toString()}), () -> {`),
				cases[i].toIR(indent + TAB + TAB + TAB),
				new IR(`}, () -> {`),
				res,
				new IR(`})()`)
			]);
		}

		return new IR([
			new IR(`(e) `), new IR("->", this.site), new IR(` {\n${indent}${TAB}(\n${indent}${TAB}${TAB}(i) -> {\n${indent}${TAB}${TAB}${TAB}`),
			res,
			new IR(`\n${indent}${TAB}${TAB}}(__core__fstPair(__core__unConstrData(e)))\n${indent}${TAB})(e)\n${indent}}(`),
			this.controlExpr.toIR(indent),
			new IR(")"),
		]);
	}
}

/**
 * Switch expression for Data
 * @package
 */
class DataSwitchExpr extends SwitchExpr {
	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	evalInternal(scope) {
		let controlVal = this.controlExpr.eval(scope);
		let dataType = controlVal.getType(this.controlExpr.site);

		let controlSite = this.controlExpr.site;
		if (!dataType.isBaseOf(controlSite, new RawDataType())) {
			throw this.controlExpr.typeError(`expected Data type, got ${controlVal.getType(controlSite).toString()}`);
		}

		// check that we have enough cases to cover the enum members
		if (this.defaultCase === null && this.cases.length < 5) {
			// mutate defaultCase to VoidExpr
			this.setDefaultCaseToVoid();
		}

		/** @type {?Type[]} */
		let branchMultiType = null;

		for (let c of this.cases) {
			let branchVal = c.evalDataMember(scope);

			branchMultiType = IfElseExpr.reduceBranchMultiType(
				c.site, 
				branchMultiType, 
				branchVal
			);
		}

		if (this.defaultCase !== null) {
			let defaultVal = this.defaultCase.eval(scope);

			branchMultiType = IfElseExpr.reduceBranchMultiType(
				this.defaultCase.site, 
				branchMultiType, 
				defaultVal
			);
		}

		if (branchMultiType === null) {
			// only possible if each branch is an error
			return Instance.new(new ErrorType());
		} else {
			return Instance.new(branchMultiType);
		}
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		/** @type {[?IR, ?IR, ?IR, ?IR, ?IR]} */
		let cases = [null, null, null, null, null]; // constr, map, list, int, byteArray

		for (let c of this.cases) {
			let ir = c.toIR(indent + TAB + TAB);

			switch (c.memberName.value) {
				case "ByteArray":
					cases[4] = ir;
					break;
				case "Int":
					cases[3] = ir;
					break;
				case "[]Data":
					cases[2] = ir;
					break;
				case "Map[Data]Data":
					cases[1] = ir;
					break;
				case "(Int, []Data)":
					cases[0] = ir;
					break;
				default:
					if (cases[0] !== null) {
						throw new Error("should've been caught before");
					}

					cases[0] = ir;
			}
		}

		if (this.defaultCase !== null) {
			for (let i = 0; i < 5; i++) {
				if (cases[i] === null) {
					cases[i] = new IR(`${indent}${TAB}def`);
				}
			}
		}

		let res = new IR([
			new IR(`${indent}__core__chooseData(e, `, this.site),
			new IR(cases.map(c => assertDefined(c))).join(", "),
			new IR(`${indent})`)
		]);

		if (this.defaultCase !== null) {
			res = new IR([
				new IR(`${indent}(def) -> {\n`),
				res,
				new IR(`\n${indent}}(`),
				this.defaultCase.toIR(indent),
				new IR(`)`)
			]);
		}

		res = new IR([
			new IR(`${indent}(e) -> {\n`),
			res,
			new IR("(e)"),
			new IR(`${indent}}(`),
			this.controlExpr.toIR(indent),
			new IR(")")
		]);

		return res;
	}
}


////////////////////////////////
// Section 16: Literal functions
////////////////////////////////

/**
 * @package
 * @param {Site} site
 * @param {Type} type - expected type
 * @param {any} value - result of JSON.parse(string)
 * @param {string} path - context for debugging
 * @returns {ValueExpr}
 */
function buildLiteralExprFromJson(site, type, value, path) {
	if (value === null) {
		throw site.typeError(`expected non-null value for parameter '${path}'`);
	} else if (type instanceof BoolType) {
		if (typeof value == "boolean") {
			return new PrimitiveLiteralExpr(new BoolLiteral(site, value));
		} else {
			throw site.typeError(`expected boolean for parameter '${path}', got '${value}'`);
		}
	} else if (type instanceof StringType) {
		if (typeof value == "string") {
			return new PrimitiveLiteralExpr(new StringLiteral(site, value));
		} else {
			throw site.typeError(`expected string for parameter '${path}', got '${value}'`);
		}
	} else if (type instanceof IntType) {
		if (typeof value == "number") {
			if (value%1 == 0.0) {
				return new PrimitiveLiteralExpr(new IntLiteral(site, BigInt(value)));
			} else {
				throw site.typeError(`expected round number for parameter '${path}', got '${value}'`);
			}
		} else {
			throw site.typeError(`expected number for parameter '${path}', got '${value}'`);
		}
	} else if (type instanceof ByteArrayType || type instanceof HashType) {
		if (value instanceof Array) {
			/**
			 * @type {number[]}
			 */
			const bytes = [];

			for (let item of value) {
				if (typeof item == "number" && item%1 == 0.0 && item >= 0 && item < 256) {
					bytes.push(item);
				} else {
					throw site.typeError(`expected uint8[] for parameter '${path}', got '${value}'`);
				}
			}

			/** @type {ValueExpr} */
			let litExpr = new PrimitiveLiteralExpr(new ByteArrayLiteral(site, bytes));

			if (type instanceof HashType) {
				litExpr = new CallExpr(site, new ValuePathExpr(new TypeRefExpr(new Word(site, type.toString()), type), new Word(site, "new")), [new CallArgExpr(litExpr.site, null, litExpr)]);
			}

			return litExpr;
		} else {
			throw site.typeError(`expected array for parameter '${path}', got '${value}'`);
		}
	} else if (type instanceof ListType) {
		if (value instanceof Array) {
			/**
			 * @type {ValueExpr[]}
			 */
			const items = [];

			for (let item of value) {
				items.push(buildLiteralExprFromJson(site, type.itemType, item, path + "[]"));
			}

			return new ListLiteralExpr(site, new TypeExpr(site, type.itemType), items);
		} else {
			throw site.typeError(`expected array for parameter '${path}', got '${value}'`);
		}
	} else if (type instanceof MapType) {
		/**
		 * @type {[ValueExpr, ValueExpr][]}
		 */
		const pairs = [];

		if (value instanceof Object && type.keyType instanceof StringType) {
			for (let key in value) {
				pairs.push([new PrimitiveLiteralExpr(new StringLiteral(site, key)), buildLiteralExprFromJson(site, type.valueType, value[key], path + "." + key)]);
			}
		} else if (value instanceof Array) {
			for (let item of value) {
				if (item instanceof Array && item.length == 2) {
					pairs.push([
						buildLiteralExprFromJson(site, type.keyType, item[0], path + "[0]"),
						buildLiteralExprFromJson(site, type.valueType, item[1], path + "[1]"),
					]);
				} else {
					throw site.typeError(`expected array of pairs for parameter '${path}', got '${value}'`);
				}
			}
		} else {
			throw site.typeError(`expected array or object for parameter '${path}', got '${value}'`);
		}

		return new MapLiteralExpr(
			site, 
			new TypeExpr(site, type.keyType), 
			new TypeExpr(site, type.valueType),
			pairs
		);
	} else if (type instanceof StructStatementType || type instanceof EnumMemberStatementType) {
		if (value instanceof Object) {
			const nFields = type.statement.nFields(site);

			/**
			 * @type {StructLiteralField[]}
			 */
			const fields = new Array(nFields);

			const nActual = Object.entries(value).length;

			if (nFields != nActual) {
				throw site.typeError(`expected object with ${nFields.toString} fields for parameter '${path}', got '${value}' with ${nActual.toString()} fields`);
			}

			for (let i = 0; i < nFields; i++) {
				const key = type.statement.getFieldName(i);

				const subValue = value[key];

				if (subValue === undefined) {
					throw site.typeError(`expected object with key '${key}' for parameter '${path}', got '${value}`);
				}

				const fieldType = type.statement.getFieldType(site, i);

				const valueExpr = buildLiteralExprFromJson(site, fieldType, subValue, path + "." + key);

				fields[i] = new StructLiteralField(nFields == 1 ? null : new Word(site, key), valueExpr);
			}

			return new StructLiteralExpr(new TypeExpr(site, type), fields);
		} else {
			throw site.typeError(`expected object for parameter '${path}', got '${value}'`);
		}
	} else {
		throw site.typeError(`unhandled parameter type '${type.toString()}', for parameter ${path}`);
	}
}

/**
 * @package
 * @param {Site} site
 * @param {Type} type - expected type
 * @param {UplcValue} value 
 * @param {string} path - context for debugging
 * @returns {ValueExpr}
 */
function buildLiteralExprFromValue(site, type, value, path) {
	if (type instanceof BoolType) {
		if (value instanceof UplcBool) {
			return new PrimitiveLiteralExpr(new BoolLiteral(site, value.bool));
		} else {
			throw site.typeError(`expected UplcBool for parameter '${path}', got '${value}'`);
		}
	} else if (type instanceof StringType) {
		if (value instanceof UplcDataValue && value.data instanceof ByteArrayData) {
			return new PrimitiveLiteralExpr(new StringLiteral(site, bytesToText(value.data.bytes)));
		} else {
			throw site.typeError(`expected ByteArrayData for parameter '${path}', got '${value}'`);
		}
	} else if (type instanceof IntType) {
		if (value instanceof UplcDataValue && value.data instanceof IntData) {
			return new PrimitiveLiteralExpr(new IntLiteral(site, value.data.value));
		} else {
			throw site.typeError(`expected IntData for parameter '${path}', got '${value}'`);
		}
	} else if (type instanceof ByteArrayType) {
		if (value instanceof UplcDataValue && value.data instanceof ByteArrayData) {
			return new PrimitiveLiteralExpr(new ByteArrayLiteral(site, value.data.bytes));
		} else {
			throw site.typeError(`expected ByteArrayData for parameter '${path}', got '${value}'`);
		}
	} else if (type instanceof ListType) {
		if (value instanceof UplcDataValue && value.data instanceof ListData) {
			/**
			 * @type {ValueExpr[]}
			 */
			const items = [];

			for (let data of value.data.list) {
				items.push(buildLiteralExprFromValue(site, type.itemType, new UplcDataValue(site, data), path + "[]"));
			}

			return new ListLiteralExpr(site, new TypeExpr(site, type.itemType), items);
		} else {
			throw site.typeError(`expected ListData for parameter '${path}', got '${value}'`);
		}
	} else if (type instanceof MapType) {
		if (value instanceof UplcDataValue && value.data instanceof MapData) {
			/**
			 * @type {[ValueExpr, ValueExpr][]}
			 */
			const pairs = [];

			for (let dataPair of value.data.map) {
				const keyExpr = buildLiteralExprFromValue(site, type.keyType, new UplcDataValue(site, dataPair[0]), path + "{key}");
				const valueExpr = buildLiteralExprFromValue(site, type.valueType, new UplcDataValue(site, dataPair[1]), path + "{value}");

				pairs.push([keyExpr, valueExpr]);
			}

			return new MapLiteralExpr(
				site, 
				new TypeExpr(site, type.keyType), 
				new TypeExpr(site, type.valueType),
				pairs
			);
		} else {
			throw site.typeError(`expected ListData for parameter '${path}', got '${value}'`);
		}
	} else if (type instanceof StructStatementType || type instanceof EnumMemberStatementType) {
		if (value instanceof UplcDataValue && value.data instanceof ConstrData) {
			const nFields = type.statement.nFields(site);
			/**
			 * @type {StructLiteralField[]}
			 */
			const fields = new Array(nFields);

			if (nFields != value.data.fields.length) {
				throw site.typeError(`expected ConstrData with ${nFields.toString} fields for parameter '${path}', got '${value}' with ${value.data.fields.length.toString()} fields`);
			}

			for (let i = 0; i < nFields; i++) {
				const f = value.data.fields[i];

				const fieldType = type.statement.getFieldType(site, i);

				const valueExpr = buildLiteralExprFromValue(site, fieldType, new UplcDataValue(site, f), path + "." + i.toString());

				fields[i] = new StructLiteralField(nFields == 1 ? null : new Word(site, type.statement.getFieldName(i)), valueExpr);
			}

			return new StructLiteralExpr(new TypeExpr(site, type), fields);
		} else {
			throw site.typeError(`expected ConstrData for parameter '${path}', got '${value}'`);
		}
	} else {
		throw site.typeError(`unhandled parameter type '${type.toString()}', for parameter ${path}`);
	}
}


////////////////////////////////////
// Section 17: Helios AST statements
////////////////////////////////////

/**
 * Base class for all statements
 * Doesn't return a value upon calling eval(scope)
 * @package
 */
class Statement extends Token {
	#name;
	#used;
	#basePath; // set by the parent Module

	/**
	 * @param {Site} site 
	 * @param {Word} name 
	 */
	constructor(site, name) {
		super(site);
		this.#name = name;
		this.#used = false;
		this.#basePath = "__user";
	}

	/**
	 * @param {string} basePath 
	 */
	setBasePath(basePath) {
		this.#basePath = basePath;
	}

	get path() {
		return `${this.#basePath}__${this.name.toString()}`;
	}

	/**
	 * @type {Word}
	 */
	get name() {
		return this.#name;
	}

	/**
	 * @type {boolean}
	 */
	get used() {
		return this.#used;
	}

	/**
	 * @param {ModuleScope} scope 
	 */
	eval(scope) {
		throw new Error("not yet implemented");
	}

	use() {
		this.#used = true;
	}

	/**
	 * @param {Uint8Array} mask
	 */
	hideUnused(mask) {
		if (!this.#used) {
			if (this.site.endSite === null) {
				mask.fill(0, this.site.startPos);
			} else {
				mask.fill(0, this.site.startPos, this.site.endSite.startPos);
			}
		}
	}

	/**
	 * Returns IR of statement.
	 * No need to specify indent here, because all statements are top-level
	 * @param {IRDefinitions} map 
	 */
	toIR(map) {
		throw new Error("not yet implemented");
	}
}

/**
 * Each field is given a separate ImportStatement
 * @package
 */
class ImportStatement extends Statement {
	#origName;
	#moduleName;

	/** 
	 * @type {?Statement} 
	 */
	#origStatement;

	/**
	 * @param {Site} site 
	 * @param {Word} name
	 * @param {Word} origName
	 * @param {Word} moduleName
	 */
	constructor(site, name, origName, moduleName) {
		super(site, name);
		this.#origName = origName;
		this.#moduleName = moduleName;
		this.#origStatement = null;
	}

	/**
	 * @type {Word}
	 */
	get moduleName() {
		return this.#moduleName;
	}

	/**
	 * @type {Statement}
	 */
	get origStatement() {
		if (this.#origStatement == null) {
			throw new Error("should be set");
		} else {
			return this.#origStatement;
		}
	}

	/**
	 * @param {ModuleScope} scope
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		let importedScope = scope.get(this.#moduleName);

		if (importedScope instanceof Scope) {
			let importedEntity = importedScope.get(this.#origName);

			if (importedEntity instanceof Scope) {
				throw this.#origName.typeError(`can't import a module from a module`);
			} else {
				return importedEntity;
			}
		} else {
			throw this.#moduleName.typeError(`${this.name.toString()} isn't a module`);
		}
	}

	/**
	 * @param {ModuleScope} scope 
	 */
	eval(scope) {
		let v = this.evalInternal(scope);

		if (v instanceof FuncStatementInstance || v instanceof ConstStatementInstance || v instanceof StatementType) {
			this.#origStatement = assertClass(v.statement, Statement);
		} else {
			throw new Error("unexpected import entity");
		}

		scope.set(this.name, v);
	}

	use() {
		super.use();

		if (this.#origStatement === null) {
			throw new Error("should be set");
		} else {
			this.#origStatement.use();
		}
	}

	/**
	 * @param {IRDefinitions} map 
	 */
	toIR(map) {
		// import statements only have a scoping function and don't do anything to the IR
	}
}

/**
 * Const value statement
 * @package
 */
class ConstStatement extends Statement {
	/**
	 * @type {?TypeExpr}
	 */
	#typeExpr;

	/**
	 * @type {ValueExpr}
	 */
	#valueExpr;

	/**
	 * @param {Site} site 
	 * @param {Word} name 
	 * @param {?TypeExpr} typeExpr - can be null in case of type inference
	 * @param {ValueExpr} valueExpr 
	 */
	constructor(site, name, typeExpr, valueExpr) {
		super(site, name);
		this.#typeExpr = typeExpr;
		this.#valueExpr = valueExpr;
	}

	get type() {
		if (this.#typeExpr === null) {
			return this.#valueExpr.type;
		} else {
			return this.#typeExpr.type;
		}
	}

	/**
	 * @param {string | UplcValue} value 
	 */
	changeValue(value) {
		let type = this.type;
		let site = this.#valueExpr.site;

		if (typeof value == "string") {
			this.#valueExpr = buildLiteralExprFromJson(site, type, JSON.parse(value), this.name.value);
		} else {
			this.#valueExpr = buildLiteralExprFromValue(site, type, value, this.name.value);
		}
	}

	/**
	 * Use this to change a value of something that is already typechecked.
	 * @param {UplcData} data
	 */
	changeValueSafe(data) {
		const type = this.type;
		const site = this.#valueExpr.site;

		if ((new BoolType()).isBaseOf(site, type)) {
			this.#valueExpr = new PrimitiveLiteralExpr(new BoolLiteral(site, data.index == 1));
		} else {
			this.#valueExpr = new LiteralDataExpr(site, type, data);
		}
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `const ${this.name.toString()}${this.#typeExpr === null ? "" : ": " + this.#typeExpr.toString()} = ${this.#valueExpr.toString()};`;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	evalInternal(scope) {
		let value = this.#valueExpr.eval(scope);

		/** @type {Type} */
		let type;

		if (this.#typeExpr === null) {
			if (!this.#valueExpr.isLiteral()) {
				throw this.typeError("can't infer type");
			}

			type = this.#valueExpr.type;
		} else {
			type = this.#typeExpr.eval(scope);

			if (!value.isInstanceOf(this.#valueExpr.site, type)) {
				throw this.#valueExpr.typeError("wrong type");
			}
		}

		return new ConstStatementInstance(type, this);
	}

	/**
	 * Evaluates rhs and adds to scope
	 * @param {TopScope} scope 
	 */
	eval(scope) {
		scope.set(this.name, this.evalInternal(scope));
	}

	use() {
		if (!this.used) {
			super.use();

			this.#valueExpr.use();

			if (this.#typeExpr !== null) {
				this.#typeExpr.use();
			}
		}
	}

	/**
	 * @returns {IR}
	 */
	toIRInternal() {
		return new IR([
			new IR("const(", this.site),
			this.#valueExpr.toIR(),
			new IR(")")
		])
		
	}

	/**
	 * @param {IRDefinitions} map 
	 */
	toIR(map) {
		map.set(this.path, this.toIRInternal());
	}
}

/**
 * Single field in struct or enum member
 * @package
 */
class DataField extends NameTypePair {
	/**
	 * @param {Word} name 
	 * @param {TypeExpr} typeExpr 
	 */
	constructor(name, typeExpr) {
		super(name, typeExpr);
	}
}

/**
 * Base class for struct and enum member
 * @package
 */
class DataDefinition extends Statement {
	#fields;

	/** @type {Set<string>} */
	#usedAutoMethods;

	/**
	 * @param {Site} site 
	 * @param {Word} name 
	 * @param {DataField[]} fields 
	 */
	constructor(site, name, fields) {
		super(site, name);
		this.#fields = fields;
		this.#usedAutoMethods = new Set();
	}

	/**
	 * @type {Type}
	 */
	get type() {
		throw new Error("not yet implemented");
	}

	get fields() {
		return this.#fields.slice();
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		throw new Error("not yet implemented");
	}

	/**
	 * Returns index of a field.
	 * Returns -1 if not found.
	 * @param {Word} name 
	 * @returns {number}
	 */
	findField(name) {
		let found = -1;
		let i = 0;
		for (let f of this.#fields) {
			if (f.name.toString() == name.toString()) {
				found = i;
				break;
			}
			i++;
		}

		return found;
	}

	/**
	 * @param {Word} name 
	 * @returns {boolean}
	 */
	hasField(name) {
		return this.findField(name) != -1;
	}

	/**
	 * @param {Word} name 
	 * @returns {boolean}
	 */
	hasMember(name) {
		return this.hasField(name) || name.value == "copy";
	}

	toString() {
		return `${this.name.toString()} {${this.#fields.map(f => f.toString()).join(", ")}}`;
	}

	/**
	 * @param {Scope} scope
	 */
	evalInternal(scope) {
		for (let f of this.#fields) {
			let fieldType = f.evalType(scope);

			if (fieldType instanceof FuncType) {
				throw f.site.typeError("field can't be function type");
			}
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	nFields(site) {
		return this.#fields.length;
	}

	/**
	 * @param {Site} site 
	 * @param {number} i 
	 * @returns {Type}
	 */
	getFieldType(site, i) {
		return this.#fields[i].type;
	}

	/**
	 * @param {Site} site 
	 * @param {string} name 
	 * @returns {number}
	 */
	getFieldIndex(site, name) {
		const i = this.findField(new Word(Site.dummy(), name));

		if (i == -1) {
			throw site.typeError(`field ${name} not find in ${this.toString()}`);
		} else {
			return i;
		}
	}

	/**
	 * @param {number} i
	 * @returns {string}
	 */
	getFieldName(i) {
		return this.#fields[i].name.toString();
	}
	
	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	nEnumMembers(site) {
		throw site.typeError(`'${this.name.value}' isn't an enum type`);
	}

	/**
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		if (this.hasField(name)) {
			throw name.referenceError(`'${this.name.toString()}::${name.toString()}' undefined (did you mean '${this.name.toString()}.${name.toString()}'?)`);
		} else {
			throw name.referenceError(`'${this.name.toString()}::${name.toString()}' undefined`);
		}
	}

	/**
	 * Gets insance member value.
	 * If dryRun == true usage is triggered
	 * @param {Word} name 
	 * @param {boolean} dryRun 
	 * @returns {Instance}
	 */
	getInstanceMember(name, dryRun = false) {
		switch (name.value) {
			case "copy":
				this.#usedAutoMethods.add(name.value);
				return Instance.new(new FuncType(this.#fields.map(f => new ArgType(f.name, f.type, true)), this.type));
			default:
				let i = this.findField(name);

				if (i == -1) {
					throw name.referenceError(`'${this.name.toString()}.${name.toString()}' undefined`);
				} else {
					return Instance.new(this.#fields[i].type);
				}
		}
		
	}

	use() {
		if (!this.used) {
			super.use();
			
			for (let f of this.#fields) {
				f.use();
			}
		}
	}

	/**
	 * @package
	 * @param {IRDefinitions} map 
	 * @param {string[]} getterNames
	 */
	copyToIR(map, getterNames) {
		const key = `${this.path}__copy`;

		// using existing IR generators as much as possible

		let ir = StructLiteralExpr.toIRInternal(this.site, this.type, this.#fields.map(df => new IR(df.name.value)), this.getConstrIndex(this.site));

		// wrap with defaults

		for (let i = getterNames.length - 1; i >= 0; i--) {
			const fieldName = this.#fields[i].name.toString();

			ir = FuncArg.wrapWithDefaultInternal(ir, fieldName, new IR([
				new IR(getterNames[i]),
				new IR("(self)")
			]))
		}

		ir = new IR([
			new IR("(self) -> {"),
			new IR("("),
			new IR(this.#fields.map(f => new IR(`__useopt__${f.name.toString()}, ${f.name.toString()}`))).join(", "),
			new IR(") -> {"),
			ir,
			new IR("}}")
		]);

		map.set(key, ir);
	}

	/**
	 * Doesn't return anything, but sets its IRdef in the map
	 * @param {IRDefinitions} map
	 * @param {boolean} isConstr
	 */
	toIR(map, isConstr = true) {
		const getterBaseName = isConstr ? "__helios__common__field" : "__helios__common__tuple_field";

		/**
		 * @type {string[]}
		 */
		const getterNames = [];

		// add a getter for each field
		for (let i = 0; i < this.#fields.length; i++) {
			let f = this.#fields[i];
			let key = `${this.path}__${f.name.toString()}`;
			getterNames.push(key);
			let isBool = f.type instanceof BoolType;

			/**
			 * @type {IR}
			 */
			let getter;

			if (i < 20) {

				getter = new IR(`${getterBaseName}_${i}`, f.site);

				if (isBool) {
					getter = new IR([
						new IR("(self) "), new IR("->", f.site), new IR(" {"),
						new IR(`__helios__common__unBoolData(${getterBaseName}_${i}(self))`),
						new IR("}"),
					]);
				}
			} else {
				let inner = isConstr ? new IR("__core__sndPair(__core__unConstrData(self))") : new IR("__core__unListData(self)");

				for (let j = 0; j < i; j++) {
					inner = new IR([new IR("__core__tailList("), inner, new IR(")")]);
				}

				inner = new IR([
					new IR("__core__headList("),
					inner,
					new IR(")"),
				]);

				if (isBool) {
					inner = new IR([new IR("__helios__common__unBoolData("), inner, new IR(")")]);
				}

				getter = new IR([
					new IR("(self) "), new IR("->", f.site), new IR(" {"),
					inner,
					new IR("}"),
				]);
			}

			map.set(key, getter)
		}

		if (this.#usedAutoMethods.has("copy")) {
			this.copyToIR(map, getterNames);
		}
	}
}

/**
 * Struct statement
 * @package
 */
class StructStatement extends DataDefinition {
	#impl;

	/**
	 * @param {Site} site 
	 * @param {Word} name 
	 * @param {DataField[]} fields 
	 * @param {ImplDefinition} impl
	 */
	constructor(site, name, fields, impl) {
		super(site, name, fields);

		this.#impl = impl;
	}

	get type() {
		return new StructStatementType(this);
	}

	toString() {
		return "struct " + super.toString();
	}

	/**
	 * Returns -1, which means -> don't use ConstrData, but use []Data directly
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return -1;
	}

	/**
	 * Evaluates own type and adds to scope
	 * @param {TopScope} scope 
	 */
	eval(scope) {
		if (scope.isStrict() && this.fields.length == 0) {
			throw this.syntaxError("expected at least 1 struct field");
		}

		// add before so recursive types are possible
		scope.set(this.name, this.type);

		this.evalInternal(scope);

		// check the types of the member methods
		this.#impl.eval(scope);
	}

	/**
	 * @param {Word} name 
	 * @param {boolean} dryRun 
	 * @returns {Instance}
	 */
	getInstanceMember(name, dryRun = false) {
		if (super.hasMember(name)) {
			return super.getInstanceMember(name, dryRun);
		} else {
			return this.#impl.getInstanceMember(name, dryRun);
		}
	}

	/**
	 * @param {Word} name
	 * @param {boolean} dryRun
	 * @returns {EvalEntity}
	 */
	getTypeMember(name, dryRun = false) {
		// only the impl can contain potentially contain type members
		return this.#impl.getTypeMember(name, dryRun);
	}

	/**
	 * @param {Uint8Array} mask
	 */
	hideUnused(mask) {
		super.hideUnused(mask);

		this.#impl.hideUnused(mask);
	}

	/**
	 * @param {IRDefinitions} map
	 */
	toIR(map) {
		if (this.fields.length == 1) {
			let f = this.fields[0];
			let key = `${this.path}__${f.name.toString()}`;
			let isBool = f.type instanceof BoolType;

			if (isBool) {
				map.set(key, new IR("__helios__common__unBoolData", f.site));
			} else {
				map.set(key, new IR("__helios__common__identity", f.site));
			}
		} else {
			super.toIR(map, false);
		}

		this.#impl.toIR(map);
	}
}

/**
 * Function statement
 * (basically just a named FuncLiteralExpr)
 * @package
 */
class FuncStatement extends Statement {
	#funcExpr;
	#recursive;

	/**
	 * @param {Site} site 
	 * @param {Word} name 
	 * @param {FuncLiteralExpr} funcExpr 
	 */
	constructor(site, name, funcExpr) {
		super(site, name);
		this.#funcExpr = funcExpr;
		this.#recursive = false;
	}

	/**
	 * @type {Type[]}
	 */
	get argTypes() {
		return this.#funcExpr.argTypes;
	}

	/**
	 * @type {string[]}
	 */
	get argTypeNames() {
		return this.#funcExpr.argTypeNames;
	}

	/**
	 * @type {Type[]}
	 */
	get retTypes() {
		return this.#funcExpr.retTypes;
	}

	toString() {
		return `func ${this.name.toString()}${this.#funcExpr.toString()}`;
	}

	/**
	 * Evaluates a function and returns a func value
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	evalInternal(scope) {
		return this.#funcExpr.evalInternal(scope);
	}

	/**
	 * Evaluates type of a funtion.
	 * Separate from evalInternal so we can use this function recursively inside evalInternal
	 * @param {Scope} scope 
	 * @returns {FuncType}
	 */
	evalType(scope) {
		return this.#funcExpr.evalType(scope);
	}

	use() {
		if (!this.used) {
			super.use();

			this.#funcExpr.use();
		}
	}

	isRecursive() {
		return this.#recursive;
	}

	/**
	 * Called in FuncStatementScope as soon as recursion is detected
	 */
	setRecursive() {
		this.#recursive = true;
	}

	/**
	 * @param {Scope} scope 
	 */
	eval(scope) {
		// add to scope before evaluating, to allow recursive calls

		let fnType = this.evalType(scope);

		let fnVal = new FuncStatementInstance(fnType, this);

		scope.set(this.name, fnVal);

		void this.#funcExpr.evalInternal(new FuncStatementScope(scope, this));
	}

	/**
	 * Returns IR of function.
	 * @param {string} fullName - fullName has been prefixed with a type path for impl members
	 * @returns {IR}
	 */
	toIRInternal(fullName = this.path) {
		if (this.#recursive) {
			return this.#funcExpr.toIRRecursive(fullName, TAB);
		} else {
			return this.#funcExpr.toIR(TAB);
		}
	}

	/**
	 * @param {IRDefinitions} map 
	 */
	toIR(map) {
		map.set(this.path, this.toIRInternal());
	}

	/**
	 * @param {Statement} s 
	 * @returns {boolean}
	 */
	static isMethod(s) {
		if (s instanceof FuncStatement) {
			return s.#funcExpr.isMethod();
		} else {
			return false;
		}
	}
}

/**
 * EnumMember defintion is similar to a struct definition
 * @package
 */
class EnumMember extends DataDefinition {
	/** @type {?EnumStatement} */
	#parent;

	/** @type {?number} */
	#constrIndex;

	/**
	 * @param {Word} name
	 * @param {DataField[]} fields
	 */
	constructor(name, fields) {
		super(name.site, name, fields);
		this.#parent = null; // registered later
		this.#constrIndex = null;
	}

	/** 
	 * @param {EnumStatement} parent
	 * @param {number} i
	*/
	registerParent(parent, i) {
		this.#parent = parent;
		this.#constrIndex = i;
	}
	
	/**
	 * @type {EnumStatement}
	 */
	get parent() {
		if (this.#parent === null) {
			throw new Error("parent not yet registered");
		} else {
			return this.#parent;
		}
	}

	get type() {
		return new EnumMemberStatementType(this);
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		if (this.#constrIndex === null) {
			throw new Error("constrIndex not set");
		} else {
			return this.#constrIndex;
		}
	}

	/**
	 * @param {Scope} scope 
	 */
	eval(scope) {
		if (this.#parent === null) {
			throw new Error("parent should've been registered");
		}

		super.evalInternal(scope); // the internally created type isn't be added to the scope. (the parent enum type takes care of that)
	}

	/**
	 * @param {Word} name 
	 * @param {boolean} dryRun 
	 * @returns {Instance}
	 */
	getInstanceMember(name, dryRun = false) {
		if (this.hasField(name)) {
			return super.getInstanceMember(name, dryRun);
		} else {
			if (this.#parent === null) {
				throw new Error("parent should've been registered");
			} else {
				return this.#parent.getInstanceMember(name, dryRun);
			}
		}
	}

	get path() {
		return `${this.parent.path}__${this.name.toString()}`;
	}
}

/**
 * Enum statement, containing at least one member
 * @package
 */
class EnumStatement extends Statement {
	#members;
	#impl;

	/**
	 * @param {Site} site 
	 * @param {Word} name 
	 * @param {EnumMember[]} members 
	 * @param {ImplDefinition} impl
	 */
	constructor(site, name, members, impl) {
		super(site, name);
		this.#members = members;
		this.#impl = impl;
		
		for (let i = 0; i < this.#members.length; i++) {
			this.#members[i].registerParent(this, i);
		}
	}

	get type() {
		return new EnumStatementType(this);
	}

	/**
	 * Returns index of enum member.
	 * Returns -1 if not found
	 * @param {Word} name 
	 * @returns {number}
	 */
	// returns an index
	findEnumMember(name) {
		let found = -1;
		let i = 0;
		for (let member of this.#members) {
			if (member.name.toString() == name.toString()) {
				found = i;
				break;
			}
			i++;
		}

		return found;
	}

	/**
	 * @param {Site} site 
	 * @param {number} i
	 * @returns {EnumMember}
	 */
	getEnumMember(site, i) {
		return assertDefined(this.#members[i]);
	}

	/**
	 * @param {Word} name
	 * @returns {boolean}
	 */
	hasEnumMember(name) {
		return this.findEnumMember(name) != -1;
	}

	toString() {
		return `enum ${this.name.toString()} {${this.#members.map(m => m.toString()).join(", ")}}`;
	}

	/**
	 * @param {Scope} scope 
	 */
	eval(scope) {
		scope.set(this.name, this.type);

		this.#members.forEach(m => {
			m.eval(scope);
		});

		this.#impl.eval(scope);
	}

	use() {
		if (!this.used) {
			super.use();

			for (let m of this.#members) {
				m.use();
			}
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	nFields(site) {
		throw site.typeError("enum doesn't have fields");
	}

	/**
	 * @param {Site} site
	 * @param {number} i
	 * @returns {Type}
	 */
	getFieldType(site, i) {
		throw site.typeError("enum doesn't have fields");
	}

	/**f
	 * @param {Site} site 
	 * @param {string} name 
	 * @returns {number}
	 */
	getFieldIndex(site, name) {
		throw site.typeError("enum doesn't have fields");
	}

	/**
	 * @param {number} i 
	 * @returns {string}
	 */
	getFieldName(i) {
		throw Site.dummy().typeError("enum doesn't have fields");
	}
	
    /**
     * @param {Word} name 
     * @returns {boolean}
     */
    hasField(name) {
        throw name.site.typeError("enum doesn't have fields");
    }

	/** 
	 * @param {Word} name 
	 * @param {boolean} dryRun 
	 * @returns {Instance}
	 */
	getInstanceMember(name, dryRun = false) {
		if (this.hasEnumMember(name)) {
			throw name.referenceError(`'${name.toString()}' is an enum of '${this.toString}' (did you mean '${this.toString()}::${name.toString()}'?)`);
		} else {
			return this.#impl.getInstanceMember(name, dryRun);
		}
	}

	/**
	 * @param {Word} name 
	 * @param {boolean} dryRun
	 * @returns {EvalEntity}
	 */
	getTypeMember(name, dryRun = false) {
		let i = this.findEnumMember(name);
		if (i == -1) {
			return this.#impl.getTypeMember(name, dryRun);
		} else {
			return this.#members[i].type;
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		throw site.typeError("can't construct an enum directly (cast to a concrete type first)");
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	nEnumMembers(site) {
		return this.#members.length;
	}

	/**
	 * @param {Uint8Array} mask
	 */
	hideUnused(mask) {
		super.hideUnused(mask);

		this.#impl.hideUnused(mask);
	}

	/**
	 * @param {IRDefinitions} map 
	 */
	toIR(map) {
		for (let member of this.#members) {
			member.toIR(map);
		}

		this.#impl.toIR(map);
	}
}

/**
 * Impl statements, which add functions and constants to registry of user types (Struct, Enum Member and Enums)
 * @package
 */
class ImplDefinition {
	#selfTypeExpr;
	#statements;

	/** @type {Instance[]} - filled during eval to allow same recursive behaviour as for top-level statements */
	#statementValues;

	/** @type {Set<string>} */
	#usedStatements;

	/**
	 * @param {TypeRefExpr} selfTypeExpr;
	 * @param {(FuncStatement | ConstStatement)[]} statements 
	 */
	constructor(selfTypeExpr, statements) {
		this.#selfTypeExpr = selfTypeExpr;
		this.#statements = statements;
		this.#statementValues = [];
		this.#usedStatements = new Set(); // used for code-generation, but not for cleanSource filtering
	}

	toString() {
		return `${this.#statements.map(s => s.toString()).join("\n")}`;
	}

	/**
	 * @param {Scope} scope 
	 */
	eval(scope) {
		let selfType = this.#selfTypeExpr.eval(scope);

		if (!(selfType instanceof StatementType)) {
			throw this.#selfTypeExpr.referenceError("not a user-type");
		} else {
			for (let s of this.#statements) {
				if (s instanceof FuncStatement) {
					// override eval() of FuncStatement because we don't want the function to add itself to the scope directly.
					let v = new FuncStatementInstance(s.evalType(scope), s);

					this.#statementValues.push(v); // add func type to #statementValues in order to allow recursive calls (acts as a special scope)

					// eval internal doesn't add anything to scope
					void s.evalInternal(new FuncStatementScope(scope, s));
				} else {
					// eval internal doesn't add anything to scope
					this.#statementValues.push(s.evalInternal(scope));
				}
			}
		}
	}

	/**
	 * @param {Word} name
	 * @param {boolean} dryRun
	 * @returns {Instance}
	 */
	getInstanceMember(name, dryRun = false) {
		switch (name.value) {
			case "serialize":
				this.#usedStatements.add(name.toString());
				return Instance.new(new FuncType([], new ByteArrayType()));
			
			default:
				// loop the contained statements to find one with name 'name'
				for (let i = 0; i < this.#statementValues.length; i++) {
					let s = this.#statements[i];

					if (name.toString() == s.name.toString()) {
						if (FuncStatement.isMethod(s)) {
							if (!dryRun) {
								this.#usedStatements.add(name.toString());
							}

							return this.#statementValues[i];
						} else {
							throw name.referenceError(`'${this.#selfTypeExpr.toString()}.${name.toString()}' isn't a method (did you mean '${this.#selfTypeExpr.toString()}::${name.toString()}'?)`);
						}
					}
				}

				throw name.referenceError(`'${this.#selfTypeExpr.toString()}.${name.toString()}' undefined`);
		}
	}
	
	/**
	 * @param {Word} name 
	 * @param {boolean} dryRun 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name, dryRun = false) {
		switch (name.value) {
			case "__eq":
			case "__neq":
				this.#usedStatements.add(name.toString());
				return Instance.new(new FuncType([this.#selfTypeExpr.type, this.#selfTypeExpr.type], new BoolType()));
			case "from_data":
				this.#usedStatements.add(name.toString());
				return Instance.new(new FuncType([new RawDataType()], this.#selfTypeExpr.type));
			default:
				for (let i = 0; i < this.#statementValues.length; i++) {
					let s = this.#statements[i];

					if (name.toString() == s.name.toString()) {
						if (FuncStatement.isMethod(s)) {
							throw name.referenceError(`'${this.#selfTypeExpr.toString()}::${name.value}' is a method (did you mean '${this.#selfTypeExpr.toString()}.${name.toString()}'?)`)
						} else {
							if (!dryRun) {
								this.#usedStatements.add(name.toString());
							}

							return this.#statementValues[i];
						}
					}
				}

				throw name.referenceError(`'${this.#selfTypeExpr.toString()}::${name.toString()}' undefined`);
		}
	}

	/**
	 * @param {Uint8Array} mask
	 */
	hideUnused(mask) {
		for (let s of this.#statements) {
			if (!s.used) {
				let site = s.site;

				if (site.endSite === null) {
					mask.fill(0, site.startPos);
				} else {
					mask.fill(0, site.startPos, site.endSite.startPos);
				}
			}
		}
	}

	/**
	 * Returns IR of all impl members
	 * @param {IRDefinitions} map 
	 */
	toIR(map) {
		let path = this.#selfTypeExpr.path;
		let site = this.#selfTypeExpr.site;

		if (this.#usedStatements.has("__eq")) {
			map.set(`${path}____eq`, new IR("__helios__common____eq", site));
		}

		if (this.#usedStatements.has("__neq")) {
			map.set(`${path}____neq`, new IR("__helios__common____neq", site));
		}

		if (this.#usedStatements.has("serialize")) {
			map.set(`${path}__serialize`, new IR("__helios__common__serialize", site));
		}

		if (this.#usedStatements.has("from_data")) {
			map.set(`${path}__from_data`, new IR("__helios__common__identity", site));
		}

		for (let s of this.#statements) {
			let key = `${path}__${s.name.toString()}`
			if (s instanceof FuncStatement) {
				map.set(key, s.toIRInternal(key));
			} else {
				map.set(key, s.toIRInternal());
			}
		}
	}
}


//////////////////////////////////
// Section 18: Helios AST building
//////////////////////////////////

const AUTOMATIC_METHODS = [
	"__eq",
	"__neq",
	"copy",
	"from_data",
	"serialize"
];

/**
 * @type {null | ((path: StringLiteral) => (string | null))}
 */
let importPathTranslator = null

/**
 * Used by VSCode plugin
 * @param {(path: StringLiteral) => (string | null)} fn 
 */
export function setImportPathTranslator(fn) {
	importPathTranslator = fn
}

/**
 * @package
 * @param {Token[]} ts
 * @returns {Statement[]}
 */
function buildProgramStatements(ts) {
	/**
	 * @type {Statement[]}
	 */
	let statements = [];

	while (ts.length != 0) {
		const t = ts.shift()?.assertWord();

		if (!t) {
			continue;
		}

		const kw = t.value;

		/**
		 * @type {Statement | (Statement | null)[] | null}
		 */
		let s = null;

		if (kw == "const") {
			s = buildConstStatement(t.site, ts);
		} else if (kw == "struct") {
			s = buildStructStatement(t.site, ts);
		} else if (kw == "func") {
			s = buildFuncStatement(t.site, ts);
		} else if (kw == "enum") {
			s = buildEnumStatement(t.site, ts);
		} else if (kw == "import") {
			s = buildImportStatements(t.site, ts);
		} else {
			t.syntaxError(`invalid top-level keyword '${kw}'`);
		}

		if (s) {
			if (Array.isArray(s)) {
				for (let s_ of s) {
					if (s_) {
						statements.push(s_);
					}
				}
			} else {
				statements.push(s);
			}
		}
	}

	return statements;
}

/**
 * @package
 * @param {Token[]} ts
 * @param {null | number} expectedPurpose
 * @returns {[number, Word] | null} - [purpose, name] (ScriptPurpose is an integer)
 * @package
 */
function buildScriptPurpose(ts, expectedPurpose = null) {
	// need at least 2 tokens for the script purpose
	if (ts.length < 2) {

		if (ts.length == 0) {
			Site.dummy().syntaxError("invalid script purpose syntax");
		} else {
			ts[0].syntaxError("invalid script purpose syntax");
			ts.splice(0);
		}

		return null;
	}

	const purposeWord = ts.shift()?.assertWord();

	if (!purposeWord) {
		return null;
	}

	/**
	 * @type {number | null}
	 */
	let purpose = null;

	if (purposeWord.isWord("spending")) {
		purpose = ScriptPurpose.Spending;
	} else if (purposeWord.isWord("minting")) {
		purpose = ScriptPurpose.Minting;
	} else if (purposeWord.isWord("staking")) {
		purpose = ScriptPurpose.Staking;
	} else if (purposeWord.isWord("testing")) { // 'test' is not reserved as a keyword though
		purpose = ScriptPurpose.Testing;
	} else if (purposeWord.isWord("module")) {
		purpose = ScriptPurpose.Module;
	} else if (purposeWord.isKeyword()) {
		purposeWord.syntaxError(`script purpose missing`);

		ts.unshift(purposeWord);

		return null;
	} else {
		purposeWord.syntaxError(`unrecognized script purpose '${purposeWord.value}' (expected 'testing', 'spending', 'staking', 'minting' or 'module')`);
		purpose = -1;
	}

	if (expectedPurpose !== null && purpose !== null) {
		if (expectedPurpose != purpose) {
			purposeWord.syntaxError(`expected '${getPurposeName(purpose)}' script purpose`);
		}
	}

	const name = assertToken(ts.shift(), purposeWord.site)?.assertWord()?.assertNotKeyword();

	if (!name) {
		return null;
	}

	if (name.value === "main") {
		name.syntaxError(`${purposeWord.value} script can't be named 'main'`);
	}

	return [purpose, name];
}

/**
 * Also used by VSCode plugin
 * @param {Token[]} ts 
 * @param {number | null} expectedPurpose 
 * @returns {[number | null, Word | null, Statement[], number]}
 */
export function buildScript(ts, expectedPurpose = null) {
	const first = ts[0];

	const purposeName = buildScriptPurpose(ts, expectedPurpose);

	const statements = buildProgramStatements(ts);

	let mainIdx = -1;

	const [purpose, name] = purposeName !== null ? purposeName : [null, null];

	if (purpose != ScriptPurpose.Module) {
		mainIdx = statements.findIndex(s => s.name.value === "main");

		if (mainIdx == -1) {
			if (name !== null) {
				first.site.merge(name.site).syntaxError("entrypoint 'main' not found");
			} else {
				first.site.syntaxError("entrypoint 'main' not found");
			}
		}
	}

	return [purpose, name, statements, mainIdx];
}

/**
 * Parses Helios quickly to extract the script purpose header.
 * Returns null if header is missing or incorrectly formed (instead of throwing an error)
 * @param {string} rawSrc 
 * @returns {?[string, string]} - [purpose, name]
 */
export function extractScriptPurposeAndName(rawSrc) {
	try {
		let src = new Source(rawSrc);

		let tokenizer = new Tokenizer(src);

		let gen = tokenizer.streamTokens();

		// Don't parse the whole script, just 'eat' 2 tokens: `<purpose> <name>`
		let ts = [];
		for (let i = 0; i < 2; i++) {
			let yielded = gen.next();
			if (yielded.done) {
				return null;
			}

			ts.push(yielded.value);
		}

		const purposeName = buildScriptPurpose(ts);

		src.throwErrors();

		if (purposeName !== null) {
			const [purpose, name] = purposeName;

			return [getPurposeName(purpose), name.value];
		} else {
			throw new Error("unexpected"); // should've been caught above by calling src.throwErrors()
		}
	} catch (e) {
		if (!(e instanceof UserError)) {
			throw e;
		} else {
			return null;
		}
	}
}

/**
 * @package
 * @param {Site} site 
 * @param {Token[]} ts 
 * @returns {ConstStatement | null}
 */
function buildConstStatement(site, ts) {
	if (ts.length == 0) {
		site.syntaxError("invalid syntax (expected name after 'const')");
		return null;
	}

	const name = assertToken(ts.shift(), site)?.assertWord()?.assertNotKeyword();

	if (!name) {
		return null;
	}

	let typeExpr = null;

	if (ts.length > 0 && ts[0].isSymbol(":")) {
		const colon = assertDefined(ts.shift());

		const equalsPos = SymbolToken.find(ts, "=");

		if (equalsPos == -1) {
			ts.unshift(colon);
			site.merge(ts[ts.length-1].site).syntaxError("invalid syntax (expected '=' after 'const')");
			ts.splice(0);
			return null;
		} else if (equalsPos == 0) {
			colon.site.merge(ts[0].site).syntaxError("expected type expression between ':' and '='");
			ts.shift();
			return null;
		}

		typeExpr = buildTypeExpr(colon.site, ts.splice(0, equalsPos));
	}

	const maybeEquals = ts.shift();

	if (maybeEquals === undefined) {
		site.merge(name.site).syntaxError("expected '=' after 'const'");
		ts.splice(0);
		return null;
	} else if (!maybeEquals.isSymbol("=")) {
		site.merge(maybeEquals.site).syntaxError("expected '=' after 'const'");
		return null;
	} else {
		const equals = maybeEquals.assertSymbol("=");

		if (!equals) {
			return null;
		}

		const nextStatementPos = Word.find(ts, ["const", "func", "struct", "enum", "import"]);

		const tsValue = nextStatementPos == -1 ? ts.splice(0) : ts.splice(0, nextStatementPos);

		if (tsValue.length == 0) {
			equals.syntaxError("expected expression after '='");
			return null;
		} else {
			const endSite = tsValue[tsValue.length-1].site;

			const valueExpr = buildValueExpr(tsValue);

			if (valueExpr === null) {
				return null;
			} else {
				return new ConstStatement(site.merge(endSite), name, typeExpr, valueExpr);
			}
		}
	}
}

/**
 * @package
 * @param {Token[]} ts
 * @returns {[Token[], Token[]]}
 */
function splitDataImpl(ts) {
	const implPos = Word.find(ts, ["const", "func"]);

	if (implPos == -1) {
		return [ts, []];
	} else {
		return [ts.slice(0, implPos), ts.slice(implPos)];
	}
}

/**
 * @package
 * @param {Site} site 
 * @param {Token[]} ts 
 * @returns {StructStatement | null}
 */
function buildStructStatement(site, ts) {
	const maybeName = ts.shift();

	if (maybeName === undefined) {
		site.syntaxError("expected name after 'struct'");
		return null;
	} else {
		if (!maybeName.isWord()) {
			maybeName.syntaxError("expected name after 'struct'");
			return null;
		} else if (maybeName.isKeyword()) {
			maybeName.syntaxError("unexpected keyword after 'struct'");
		}

		const name = maybeName?.assertWord();

		if (!name) {
			return null;
		}

		const maybeBraces = ts.shift();

		if (maybeBraces === undefined) {
			name.syntaxError(`expected '{...}' after 'struct ${name.toString()}'`);
			return null;
		} else {
			if (!maybeBraces.isGroup("{", 1)) {
				maybeBraces.syntaxError("expected non-empty '{..}' without separators");
				return null;
			}

			const braces = maybeBraces.assertGroup("{", 1);

			if (!braces) {
				return null;
			}

			const [tsFields, tsImpl] = splitDataImpl(braces.fields[0]);

			const fields = buildDataFields(tsFields);

			const impl = buildImplDefinition(tsImpl, new TypeRefExpr(name), fields.map(f => f.name), braces.site.endSite);

			if (impl === null) {
				return null;
			} else {
				return new StructStatement(site.merge(braces.site), name, fields, impl);
			}
		}
	}
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {DataField[]}
 */
function buildDataFields(ts) {
	/** @type {DataField[]} */
	const fields = []

	/**
	 * @param {Word} fieldName
	 */
	function assertUnique(fieldName) {
		if (fields.findIndex(f => f.name.toString() == fieldName.toString()) != -1) {
			fieldName.typeError(`duplicate field \'${fieldName.toString()}\'`);
		}
	}

	while (ts.length > 0) {
		const colonPos = SymbolToken.find(ts, ":");

		if (colonPos == -1) {
			ts[0].site.merge(ts[ts.length-1].site).syntaxError("expected ':' in data field");
			return fields;
		}

		const colon = ts[colonPos];
		const tsBef = ts.slice(0, colonPos);
		const tsAft = ts.slice(colonPos+1);
		const maybeFieldName = tsBef.shift();
		if (maybeFieldName === undefined) {
			colon.syntaxError("expected word before ':'");
			continue;
		} else {
			const fieldName = maybeFieldName?.assertWord()?.assertNotKeyword();

			if (!fieldName) {
				return fields;
			}

			assertUnique(fieldName);

			if (tsAft.length == 0) {
				colon.syntaxError("expected type expression after ':'");
				return fields;
			}

			const nextColonPos = SymbolToken.find(tsAft, ":");

			if (nextColonPos != -1) {
				if (nextColonPos == 0) {
					tsAft[nextColonPos].syntaxError("expected word before ':'");
					return fields;
				}

				void tsAft[nextColonPos-1].assertWord();

				ts = tsAft.splice(nextColonPos-1);
			} else {
				ts = [];
			}

			const typeExpr = buildTypeExpr(colon.site, tsAft);

			if (!typeExpr) {
				return fields;
			}

			fields.push(new DataField(fieldName, typeExpr));
		}
	}

	return fields;
}

/**
 * @package
 * @param {Site} site 
 * @param {Token[]} ts 
 * @param {?TypeExpr} methodOf - methodOf !== null then first arg can be named 'self'
 * @returns {FuncStatement | null}
 */
function buildFuncStatement(site, ts, methodOf = null) {
	const name = assertToken(ts.shift(), site)?.assertWord()?.assertNotKeyword();

	if (!name) {
		return null;
	}

	if (ts.length == 0) {
		name.site.syntaxError("invalid syntax");
		return null;
	}

	const fnExpr = buildFuncLiteralExpr(ts, methodOf, false);

	if (!fnExpr) {
		return null;
	}

	return new FuncStatement(site.merge(fnExpr.site), name, fnExpr);
}

/**
 * @package
 * @param {Token[]} ts 
 * @param {?TypeExpr} methodOf - methodOf !== null then first arg can be named 'self'
 * @param {boolean} allowInferredRetType
 * @returns {FuncLiteralExpr | null}
 */
function buildFuncLiteralExpr(ts, methodOf = null, allowInferredRetType = false) {
	const parens = assertDefined(ts.shift()).assertGroup("(");

	if (!parens) {
		return null;
	}

	const site = parens.site;
	const args = buildFuncArgs(parens, methodOf);

	const arrow = assertToken(ts.shift(), site)?.assertSymbol("->");

	if (!arrow) {
		return null;
	}

	const bodyPos = Group.find(ts, "{");

	if (bodyPos == -1) {
		site.syntaxError("no function body");
		return null;
	} else if (bodyPos == 0 && !allowInferredRetType) {
		site.syntaxError("no return type specified");
	}

	const retTypeExprs = buildFuncRetTypeExprs(arrow.site, ts.splice(0, bodyPos), allowInferredRetType);

	if (retTypeExprs === null) {
		return null;
	}

	const bodyGroup = assertToken(ts.shift(), site)?.assertGroup("{", 1)

	if (!bodyGroup) {
		return null;
	}

	const bodyExpr = buildValueExpr(bodyGroup.fields[0]);

	if (!bodyExpr) {
		return null;
	}

	return new FuncLiteralExpr(site, args, retTypeExprs, bodyExpr);
}

/**
 * @package
 * @param {Group} parens 
 * @param {?TypeExpr} methodOf - methodOf !== nul then first arg can be named 'self'
 * @returns {FuncArg[]}
 */
function buildFuncArgs(parens, methodOf = null) {
	/** @type {FuncArg[]} */
	const args = [];

	let hasDefaultArgs = false;

	for (let i = 0; i < parens.fields.length; i++) {
		const f = parens.fields[i];
		const ts = f.slice();

		const name = assertToken(ts.shift(), parens.site)?.assertWord();

		if (!name) {
			continue;
		}

		if (name.toString() == "self") {
			if (i != 0 || methodOf === null) {
				name.syntaxError("'self' is reserved");
			} else {
				if (ts.length > 0) {
					if (ts[0].isSymbol(":")) {
						ts[0].syntaxError("unexpected type expression after 'self'");
					} else {
						ts[0].syntaxError("unexpected token");
					}
				} else {
					args.push(new FuncArg(name, methodOf));
				}
			}
		} else if (name.toString() == "_") {
			if (ts.length > 0) {
				if (ts[0].isSymbol(":")) {
					ts[0].syntaxError("unexpected type expression after '_'");
				} else {
					ts[0].syntaxError("unexpected token");
				}
			} else {
				args.push(new FuncArg(name, methodOf));
			}
		} else {
			if (name.isKeyword()) {
				name.syntaxError("unexpected keyword");
			}

			for (let prev of args) {
				if (prev.name.toString() == name.toString()) {
					name.syntaxError(`duplicate argument '${name.toString()}'`);
				}
			}

			const maybeColon = ts.shift();
			if (maybeColon === undefined) {
				name.syntaxError(`expected ':' after '${name.toString()}'`);
			} else {
				const colon = maybeColon.assertSymbol(":");

				if (!colon) {
					continue;
				}

				const equalsPos = SymbolToken.find(ts, "=");

				/**
				 * @type {null | ValueExpr}
				 */
				let defaultValueExpr = null;

				if (equalsPos != -1) {
					if (equalsPos == ts.length-1) {
						ts[equalsPos].syntaxError("expected expression after '='");
					} else {
						const vts = ts.splice(equalsPos);

						vts.shift()?.assertSymbol("=");
						
						defaultValueExpr = buildValueExpr(vts);

						hasDefaultArgs = true;
					}
				} else {
					if (hasDefaultArgs) {
						name.syntaxError("positional args must come before default args");
					}
				}

				/**
				 * @type {TypeExpr | null}
				 */
				let typeExpr = null;

				if (ts.length == 0) {
					colon.syntaxError("expected type expression after ':'");
				} else {
					typeExpr = buildTypeExpr(colon.site, ts);
				}

				args.push(new FuncArg(name, typeExpr, defaultValueExpr));
			}
		}
	}

	return args;
}

/**
 * @package
 * @param {Site} site 
 * @param {Token[]} ts 
 * @returns {EnumStatement | null}
 */
function buildEnumStatement(site, ts) {
	const maybeName = ts.shift();

	if (maybeName === undefined) {
		site.syntaxError("expected word after 'enum'");
		return null
	} else {
		const name = maybeName.assertWord()?.assertNotKeyword();

		if (!name) {
			return null;
		}

		const maybeBraces = ts.shift();

		if (maybeBraces === undefined) {
			name.syntaxError(`expected '{...}' after 'enum ${name.toString()}'`);
			return null;
		} else {
			const braces = maybeBraces.assertGroup("{", 1);

			if (!braces) {
				return null;
			}

			const [tsMembers, tsImpl] = splitDataImpl(braces.fields[0]);

			if (tsMembers.length == 0) {
				braces.syntaxError("expected at least one enum member");
			}

			/** @type {EnumMember[]} */
			const members = [];

			while (tsMembers.length > 0) {
				const member = buildEnumMember(tsMembers);

				if (!member) {
					continue;
				}

				members.push(member);
			}

			const impl = buildImplDefinition(tsImpl, new TypeRefExpr(name), members.map(m => m.name), braces.site.endSite);

			if (!impl) {
				return null;
			}

			return new EnumStatement(site.merge(braces.site), name, members, impl);
		}
	}
}

/**
 * @package
 * @param {Site} site 
 * @param {Token[]} ts 
 * @returns {(ImportStatement | null)[] | null}
 */
function buildImportStatements(site, ts) {
	const maybeBraces = ts.shift();

	if (maybeBraces === undefined) {
		site.syntaxError("expected '{...}' after 'import'");
		return null;
	} else {
		const braces = maybeBraces.assertGroup("{");
		if (!braces) {
			return null;
		}

		const maybeFrom = assertToken(ts.shift(), maybeBraces.site, "expected 'from' after 'import {...}'")?.assertWord("from");
		if (!maybeFrom) {
			return null;
		}

		const maybeModuleName = assertToken(ts.shift(), maybeFrom.site, "expected module name after 'import {...} from'");
		if (!maybeModuleName) {
			return null;
		}

		/**
		 * @type {null | undefined | Word}
		 */
		let moduleName = null;

		if (maybeModuleName instanceof StringLiteral && importPathTranslator) {
			let translated = importPathTranslator(maybeModuleName);

			if (!translated) {
				return null;
			}

			moduleName = new Word(maybeModuleName.site, translated);
		} else {
			moduleName = maybeModuleName.assertWord()?.assertNotKeyword();
		}

		if (!moduleName) {
			return null;
		}

		const mName = moduleName;

		if (braces.fields.length === 0) {
			braces.syntaxError("expected at least 1 import field");
		}

		return braces.fields.map(fts => {
			const ts = fts.slice();
			const maybeOrigName = ts.shift();

			if (maybeOrigName === undefined) {
				braces.syntaxError("empty import field");
				return null;
			} else {
				const origName = maybeOrigName.assertWord();

				if (!origName) {
					return null;
				} else if (ts.length === 0) {
					return new ImportStatement(site, origName, origName, mName);
				} else {
					const maybeAs = ts.shift();

					if (maybeAs === undefined) {
						maybeOrigName.syntaxError(`expected 'as' or nothing after '${origName.value}'`);
						return null;
					} else {
						maybeAs.assertWord("as");

						const maybeNewName = ts.shift();

						if (maybeNewName === undefined) {
							maybeAs.syntaxError("expected word after 'as'");
							return null;
						} else {
							const newName = maybeNewName.assertWord();

							if (!newName) {
								return null;
							}

							const rem = ts.shift();
							if (rem !== undefined) {
								rem.syntaxError("unexpected token");
								return null;
							} else {
								return new ImportStatement(site, newName, origName, mName);
							}
						}
					}
				}
			}
		}).filter(f => f !== null)
	}
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {EnumMember | null}
 */
function buildEnumMember(ts) {
	const name = assertDefined(ts.shift()).assertWord()?.assertNotKeyword();

	if (!name) {
		return null;
	} else if (ts.length == 0 || ts[0].isWord()) {
		return new EnumMember(name, []);
	} else {
		const braces = assertToken(ts.shift(), name.site)?.assertGroup("{", 1);

		if (!braces) {
			return null;
		} else {
			const fields = buildDataFields(braces.fields[0]);

			return new EnumMember(name, fields);
		}
	}
}

/** 
 * @package
 * @param {Token[]} ts 
 * @param {TypeRefExpr} selfTypeExpr - reference to parent type
 * @param {Word[]} fieldNames - to check if impl statements have a unique name
 * @param {?Site} endSite
 * @returns {ImplDefinition | null}
 */
function buildImplDefinition(ts, selfTypeExpr, fieldNames, endSite) {
	/**
	 * @param {Word} name
	 * @returns {boolean}
	 */
	function isNonAuto(name) {
		if (AUTOMATIC_METHODS.findIndex(n => n == name.toString()) != -1) {
			name.syntaxError(`'${name.toString()}' is a reserved member`);
			return false;
		} else {
			return true;
		}
	}

	for (let fieldName of fieldNames) {
		if (!isNonAuto(fieldName)) {
			return null;
		}
	}

	const statements = buildImplMembers(ts, selfTypeExpr);

	/** 
	 * @param {number} i
	 * @returns {boolean} - ok
	 */
	function isUnique(i) {
		let s = statements[i];

		isNonAuto(s.name);

		for (let fieldName of fieldNames) {
			if (fieldName.toString() == s.name.toString()) {
				s.name.syntaxError(`'${s.name.toString()}' is duplicate`);
				return false;
			}
		}

		for (let j = i+1; j < statements.length; j++) {
			if (statements[j].name.toString() == s.name.toString()) {
				statements[j].name.syntaxError(`'${s.name.toString()}' is duplicate`);
				return false;
			}
		}

		return true;
	}

	const n = statements.length;

	for (let i = 0; i < n; i++) {
		if (!isUnique(i)) {
			return null;
		}
	}

	if (n > 0 && endSite !== null) {
		statements[n-1].site.setEndSite(endSite);
	}

	return new ImplDefinition(selfTypeExpr, statements);
}

/**
 * @package
 * @param {Token[]} ts 
 * @param {TypeExpr} methodOf
 * @returns {(ConstStatement | FuncStatement)[]}
 */
function buildImplMembers(ts, methodOf) {
	/** @type {(ConstStatement | FuncStatement)[]} */
	const statements = [];

	while (ts.length != 0) {
		const t = assertDefined(ts.shift()).assertWord();

		if (!t) {
			continue;
		}

		const kw = t.value;

		/**
		 * @type {null | ConstStatement | FuncStatement}
		 */
		let s = null;

		if (kw == "const") {
			s = buildConstStatement(t.site, ts);
		} else if (kw == "func") {
			s = buildFuncStatement(t.site, ts, methodOf);
		} else {
			t.syntaxError("invalid impl syntax");
		}

		if (s) {
			statements.push(s);
		}
	}

	return statements
}

/**
 * @package
 * @param {Site} site
 * @param {Token[]} ts 
 * @returns {TypeExpr | null}
 */
function buildTypeExpr(site, ts) {
	if (ts.length == 0) {
		site.syntaxError("expected token");
		return null;
	}

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
		ts[0].syntaxError("invalid type syntax");
		return null;
	}
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {ListTypeExpr | null}
 */
function buildListTypeExpr(ts) {
	const brackets = assertDefined(ts.shift()).assertGroup("[", 0);

	if (!brackets) {
		return null
	}

	const itemTypeExpr = buildTypeExpr(brackets.site, ts);

	if (!itemTypeExpr) {
		return null;
	}

	return new ListTypeExpr(brackets.site, itemTypeExpr);
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {MapTypeExpr | null}
 */
function buildMapTypeExpr(ts) {
	const kw = assertDefined(ts.shift()).assertWord("Map");

	if (!kw) {
		return null;
	}

	const maybeKeyTypeExpr = assertToken(ts.shift(), kw.site, "missing Map key-type");

	if (!maybeKeyTypeExpr) {
		return null;
	}

	const keyTypeTs = maybeKeyTypeExpr.assertGroup("[", 1)?.fields[0];
	if (keyTypeTs === null || keyTypeTs === undefined) {
		return null;
	} else if (keyTypeTs.length == 0) {
		kw.syntaxError("missing Map key-type (brackets can't be empty)");
		return null;
	} 

	const keyTypeExpr = buildTypeExpr(kw.site, keyTypeTs);
	if (!keyTypeExpr) {
		return null;
	}

	if (ts.length == 0) {
		kw.syntaxError("missing Map value-type");
		return null;
	} 

	const valueTypeExpr = buildTypeExpr(kw.site, ts);

	if (!valueTypeExpr) {
		return null;
	}

	return new MapTypeExpr(kw.site, keyTypeExpr, valueTypeExpr);
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {TypeExpr | null}
 */
function buildOptionTypeExpr(ts) {
	const kw = assertDefined(ts.shift()).assertWord("Option");

	if (!kw) {
		return null;
	}

	const typeTs = assertToken(ts.shift(), kw.site)?.assertGroup("[", 1)?.fields[0];

	if (!typeTs) {
		return null;
	}

	const someTypeExpr = buildTypeExpr(kw.site, typeTs);
	if (!someTypeExpr) {
		return null;
	}

	const typeExpr = new OptionTypeExpr(kw.site, someTypeExpr);
	if (ts.length > 0) {
		if (ts[0].isSymbol("::") && ts[1].isWord(["Some", "None"])) {
			if (ts.length > 2) {
				ts[2].syntaxError("unexpected token");
				return null;
			} else {
				const memberName = ts[1].assertWord()

				if (!memberName) {
					return null;
				}

				return new TypePathExpr(ts[0].site, typeExpr, memberName);
			}
		} else {
			ts[0].syntaxError("invalid option type syntax");
			return null;
		}
	} else {
		return typeExpr;
	}
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {FuncTypeExpr | null}
 */
function buildFuncTypeExpr(ts) {
	const parens = assertDefined(ts.shift()).assertGroup("(");

	if (!parens) {
		return null;
	}

	let hasOptArgs = false;

	const argTypes = reduceNull(parens.fields.map(f => {
		const fts = f.slice();

		if (fts.length == 0) {
			parens.syntaxError("expected func arg type");
			return null;
		}

		const funcArgTypeExpr = buildFuncArgTypeExpr(fts);

		if (!funcArgTypeExpr) {
			return null;
		}

		if (hasOptArgs) {
			if (!funcArgTypeExpr.isOptional()) {
				funcArgTypeExpr.syntaxError("optional arguments must come last");
				return null;
			}
		} else {
			if (funcArgTypeExpr.isOptional()) {
				hasOptArgs = true;
			}
		}

		return funcArgTypeExpr;
	}));

	if (!argTypes) {
		return null;
	} else {
		if (argTypes.some(at => at.isNamed()) && argTypes.some(at => !at.isNamed())) {
			argTypes[0].syntaxError("can't mix named and unnamed args in func type");
			return null;
		}
	
		const arrow = assertToken(ts.shift(), parens.site)?.assertSymbol("->");

		if (!arrow) {
			return null;
		}
	
		const retTypes = buildFuncRetTypeExprs(arrow.site, ts, false);

		if (!retTypes) {
			return null;
		}

		return new FuncTypeExpr(parens.site, argTypes, retTypes.map(t => assertDefined(t)));
	}
}

/**
 * 
 * @param {Token[]} ts 
 * @returns {FuncArgTypeExpr | null}
 */
function buildFuncArgTypeExpr(ts) {
	const colonPos = SymbolToken.find(ts, ":");

	if (colonPos != -1 && colonPos != 1) {
		ts[0].syntaxError("invalid syntax");
		return null;
	}

	/**
	 * @type {Word | null}
	 */
	let name = null;

	if (colonPos != -1) {
		name = assertDefined(ts.shift()).assertWord()?.assertNotKeyword() ?? null;

		if (!name) {
			return null;
		}

		const colon = assertDefined(ts.shift()).assertSymbol(":");

		if (!colon) {
			return null;
		}
		
		if (ts.length == 0) {
			colon.syntaxError("expected type expression after ':'");
			return null;
		}
	}

	const next = assertDefined(ts[0]);

	const hasDefault = next.isSymbol("?");
	if (hasDefault) {
		const opt = assertDefined(ts.shift());

		if (ts.length == 0) {
			opt.syntaxError("invalid type expression after '?'");
			return null;
		}
	}

	const typeExpr = buildTypeExpr(next.site, ts);
	if (!typeExpr) {
		return null;
	}

	return new FuncArgTypeExpr(name !== null ? name.site : typeExpr.site, name, typeExpr, hasDefault);
}

/**
 * @package
 * @param {Site} site 
 * @param {Token[]} ts 
 * @param {boolean} allowInferredRetType
 * @returns {null | (null | TypeExpr)[]}
 */
function buildFuncRetTypeExprs(site, ts, allowInferredRetType = false) {
	if (ts.length === 0) {
		if (allowInferredRetType) {
			return [null];
		} else {
			site.syntaxError("expected type expression after '->'");
			return null;
		}
	} else {
		if (ts[0].isGroup("(") && (ts.length == 1 || !ts[1].isSymbol("->"))) {
			const group = assertToken(ts.shift(), site)?.assertGroup("(");

			if (!group) {
				return null;
			} else if (group.fields.length == 0) {
				return [new VoidTypeExpr(group.site)];
			} else if (group.fields.length == 1) {
				group.syntaxError("expected 0 or 2 or more types in multi return type");
				return null;
			} else {
				return group.fields.map(fts => {
					fts = fts.slice();

					return buildTypeExpr(group.site, fts);
				});
			}
		} else {
			return [buildTypeExpr(site, ts)];
		}
	}
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {null | TypePathExpr}
 */
function buildTypePathExpr(ts) {
	const baseName = assertDefined(ts.shift()).assertWord()?.assertNotKeyword();

	if (!baseName) {
		return null;
	}

	const symbol = assertToken(ts.shift(), baseName.site)?.assertSymbol("::");

	if (!symbol) {
		return null;
	}

	const memberName = assertToken(ts.shift(), symbol.site)?.assertWord();

	if (!memberName) {
		return null;
	}

	if (ts.length > 0) {
		ts[0].syntaxError("invalid type syntax");
		return null;
	}
	
	return new TypePathExpr(symbol.site, new TypeRefExpr(baseName), memberName);
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {TypeRefExpr | null}
 */
function buildTypeRefExpr(ts) {
	const name = assertDefined(ts.shift()).assertWord()?.assertNotKeyword();

	if (!name) {
		return null;
	}

	if (ts.length > 0) {
		ts[0].syntaxError("invalid type syntax");
		return null;
	}

	return new TypeRefExpr(name);
}

/**
 * @package
 * @param {Token[]} ts 
 * @param {number} prec 
 * @returns {ValueExpr | null}
 */
function buildValueExpr(ts, prec = 0) {
	assert(ts.length > 0);

	// lower index in exprBuilders is lower precedence
	/** @type {((ts: Token[], prev: number) => (ValueExpr | null))[]} */
	const exprBuilders = [
		/**
		 * 0: lowest precedence is assignment
		 * @param {Token[]} ts_ 
		 * @param {number} prec_ 
		 * @returns 
		 */
		function (ts_, prec_) {
			return buildMaybeAssignOrPrintExpr(ts_, prec_);
		},
		makeBinaryExprBuilder('||'), // 1: logical or operator
		makeBinaryExprBuilder('&&'), // 2: logical and operator
		makeBinaryExprBuilder(['==', '!=']), // 3: eq or neq
		makeBinaryExprBuilder(['<', '<=', '>', '>=']), // 4: comparison
		makeBinaryExprBuilder(['+', '-']), // 5: addition subtraction
		makeBinaryExprBuilder(['*', '/', '%']), // 6: multiplication division remainder
		makeUnaryExprBuilder(['!', '+', '-']), // 7: logical not, negate
		/**
		 * 8: variables or literal values chained with: (enum)member access, indexing and calling
		 * @param {Token[]} ts_ 
		 * @param {number} prec_ 
		 * @returns 
		 */
		function (ts_, prec_) {
			return buildChainedValueExpr(ts_, prec_);
		}
	];

	return exprBuilders[prec](ts, prec);
}

/**
 * @package
 * @param {Token[]} ts
 * @param {number} prec
 * @returns {ValueExpr | null}
 */
function buildMaybeAssignOrPrintExpr(ts, prec) {
	let semicolonPos = SymbolToken.find(ts, ";");
	const equalsPos = SymbolToken.find(ts, "=");
	const printPos = Word.find(ts, "print");

	if (semicolonPos == -1) {
		if (equalsPos != -1) {
			ts[equalsPos].syntaxError("invalid assignment syntax, expected ';' after '...=...'");
			return null;
		} else {
			return buildValueExpr(ts, prec + 1);
		}
	} else {
		if ((equalsPos == -1 || equalsPos > semicolonPos) && (printPos == -1 || printPos > semicolonPos)) {
			const upstreamExpr = buildValueExpr(ts.splice(0, semicolonPos), prec+1);
			const site = assertDefined(ts.shift()).site;

			if (ts.length == 0) {
				site.syntaxError("expected expression after ';'");
				return null;
			} else if (upstreamExpr === null) {
				// error will already have been created
				return null;
			} else {
				const downstreamExpr = buildValueExpr(ts, prec);

				if (downstreamExpr === null) {
					// error will already have been created
					return null;
				} else {
					return new ChainExpr(site, upstreamExpr, downstreamExpr);
				}
			}
		} else if (equalsPos != -1 && equalsPos < semicolonPos) {
			if (printPos != -1) {
				if (printPos <= semicolonPos) {
					ts[printPos].syntaxError("expected ';' after 'print(...)'");
					return null;
				}
			}

			const equals = ts[equalsPos].assertSymbol("=");

			if (!equals) {
				return null;
			}

			const equalsSite = equals.site;

			const lts = ts.splice(0, equalsPos);

			const lhs = buildAssignLhs(equalsSite, lts);
			
			assertDefined(ts.shift()).assertSymbol("=");

			semicolonPos = SymbolToken.find(ts, ";");
			assert(semicolonPos != -1);

			let upstreamTs = ts.splice(0, semicolonPos);
			if (upstreamTs.length == 0) {
				equalsSite.syntaxError("expected expression between '=' and ';'");
				return null;
			}

			const upstreamExpr = buildValueExpr(upstreamTs, prec + 1);

			const semicolon  = assertToken(ts.shift(), equalsSite)?.assertSymbol(";");

			if (!semicolon) {
				return null;
			}

			const semicolonSite = semicolon.site;

			if (ts.length == 0) {
				semicolonSite.syntaxError("expected expression after ';'");
				return null;
			}

			const downstreamExpr = buildValueExpr(ts, prec);

			if (downstreamExpr === null || upstreamExpr === null || lhs === null) {
				// error will already have been thrown internally
				return null;
			} else {
				return new AssignExpr(equalsSite, lhs, upstreamExpr, downstreamExpr);
			}
		} else if (printPos != -1 && printPos < semicolonPos) {
			if (equalsPos != -1) {
				if (equalsPos <= semicolonPos) {
					ts[equalsPos].syntaxError("expected ';' after '...=...'");
					return null;
				}
			}

			const print = assertDefined(ts.shift()).assertWord("print");

			if (!print) {
				return null;
			}

			const printSite = print.site;

			const maybeParens = ts.shift();

			if (maybeParens === undefined) {
				ts[printPos].syntaxError("expected '(...)' after 'print'");
				return null;
			} else {
				const parens = maybeParens.assertGroup("(", 1);

				if (!parens) {
					return null;
				}

				const msgExpr = buildValueExpr(parens.fields[0]);

				const semicolon = assertToken(ts.shift(), parens.site)?.assertSymbol(";")

				if (!semicolon) {
					return null;
				}

				const semicolonSite = semicolon.site;

				if (ts.length == 0) {
					semicolonSite.syntaxError("expected expression after ';'");
					return null;
				}

				const downstreamExpr = buildValueExpr(ts, prec);

				if (!downstreamExpr || !msgExpr) {
					return null;
				}

				return new PrintExpr(printSite, msgExpr, downstreamExpr);
			}
		} else {
			ts[0].syntaxError("unhandled");
			return null;
		}
	}
}

/**
 * @package
 * @param {Site} site
 * @param {Token[]} ts 
 * @param {boolean} isSwitchCase
 * @returns {DestructExpr | null}
 */
function buildDestructExpr(site, ts, isSwitchCase = false) {
	if (ts.length == 0) {
		site.syntaxError("expected token inside destructuring braces");
		return null;
	}

	let maybeName = assertToken(ts.shift(), site);

	if (!maybeName) {
		return null;
	}

	if (maybeName.isWord("_")) {
		if (ts.length != 0) {
			maybeName.syntaxError("unexpected tokens after '_'");
			return null;
		} else {
			return new DestructExpr(new Word(maybeName.site, "_"), null);
		}
	} else {
		let name = new Word(maybeName.site, "_");

		if (ts.length >= 1 && ts[0].isSymbol(":")) {
			let name_ = maybeName.assertWord()?.assertNotKeyword();

			if (!name_) {
				return null;
			}

			name = name_;

			const colon = assertToken(ts.shift(), name.site)?.assertSymbol(":");

			if (!colon) {
				return null;
			}

			if (ts.length == 0) {
				colon.syntaxError("expected type expression after ':'");
				return null;
			} 

			const destructExprs = buildDestructExprs(ts);

			if (destructExprs === null || destructExprs === undefined) {
				return null
			}

			const typeExpr = buildTypeExpr(colon.site, ts);

			if (!typeExpr) {
				return null;
			}

			return new DestructExpr(name, typeExpr, destructExprs);
		} else if (ts.length == 0) {
			if (isSwitchCase) {
				const typeName = maybeName.assertWord()?.assertNotKeyword();

				if (!typeName) {
					return null;
				}

				const typeExpr = new TypeRefExpr(typeName);

				if (!typeExpr) {
					return null;
				} 

				return new DestructExpr(name, typeExpr);
			} else {
				const name = maybeName.assertWord()?.assertNotKeyword();

				if (!name) {
					return null;
				}

				return new DestructExpr(name, null);
			}
		} else {
			ts.unshift(maybeName);

			const destructExprs = buildDestructExprs(ts);

			if (destructExprs === null || destructExprs === undefined) {
				return null;
			}
	
			const typeExpr = buildTypeExpr(site, ts);

			if (!typeExpr) {
				return null;
			}

			return new DestructExpr(name, typeExpr, destructExprs);
		}
	}
}

/**
 * Pops the last element of ts if it is a braces group
 * @param {Token[]} ts
 * @returns {null | DestructExpr[]}
 */
function buildDestructExprs(ts) {
	if (ts.length == 0) {
		return [];
	} else if (ts[ts.length -1].isGroup("{")) {
		const group = assertDefined(ts.pop()).assertGroup("{");

		if (!group) {
			return null;
		}

		const destructExprs = group.fields.map(fts => {
			return buildDestructExpr(group.site, fts);
		});
	
		if (destructExprs.every(le => le !== null && le.isIgnored() && !le.hasDestructExprs())) {
			group.syntaxError("expected at least one used field while destructuring")
			return null;
		}

		return reduceNull(destructExprs);
	} else {
		return [];
	}	
}

/**
 * @package
 * @param {Site} site 
 * @param {Token[]} ts 
 * @returns {null | DestructExpr[]}
 */
function buildAssignLhs(site, ts) {
	const maybeName = ts.shift();
	if (maybeName === undefined) {
		site.syntaxError("expected a name before '='");
		return null;
	} else {
		/**
		 * @type {DestructExpr[]}
		 */
		const pairs = [];

		if (maybeName.isWord()) {
			ts.unshift(maybeName);

			const lhs = buildDestructExpr(maybeName.site, ts);

			if (lhs === null) {
				return null;
			} else if (lhs.isIgnored() && !lhs.hasDestructExprs()) {
				maybeName.syntaxError(`unused assignment ${maybeName.toString()}`);
				return null;
			}

			pairs.push(lhs);
		} else if (maybeName.isGroup("(")) {
			const group = maybeName.assertGroup("(");

			if (!group) {
				return null;
			}

			if (group.fields.length < 2) {
				group.syntaxError("expected at least 2 lhs' for multi-assign");
				return null;
			}

			let someNoneUnderscore = false;
			for (let fts of group.fields) {
				if (fts.length == 0) {
					group.syntaxError("unexpected empty field for multi-assign");
					return null;
				}

				fts = fts.slice();

				const lhs = buildDestructExpr(group.site, fts);

				if (!lhs) {
					return null;
				}
				
				if (!lhs.isIgnored() || lhs.hasDestructExprs()) {
					someNoneUnderscore = true;
				}

				// check that name is unique
				pairs.forEach(p => {
					if (!lhs.isIgnored() && p.name.value === lhs.name.value) {
						lhs.name.syntaxError(`duplicate name '${lhs.name.value}' in lhs of multi-assign`);
					}
				});

				pairs.push(lhs);
			}

			if (!someNoneUnderscore) {
				group.syntaxError("expected at least one non-underscore in lhs of multi-assign");
				return null;
			}
		} else {
			maybeName.syntaxError("unexpected syntax for lhs of =");
			return null;
		}

		return pairs;
	}
}

/**
 * @package
 * @param {string | string[]} symbol 
 * @returns {(ts: Token[], prec: number) => (ValueExpr | null)}
 */
function makeBinaryExprBuilder(symbol) {
	// default behaviour is left-to-right associative
	return function (ts, prec) {
		const iOp = SymbolToken.findLast(ts, symbol);

		if (iOp == ts.length - 1) {
			// post-unary operator, which is invalid
			ts[iOp].syntaxError(`invalid syntax, '${ts[iOp].toString()}' can't be used as a post-unary operator`);
			return null;
		} else if (iOp > 0) { // iOp == 0 means maybe a (pre)unary op, which is handled by a higher precedence
			const a = buildValueExpr(ts.slice(0, iOp), prec);
			const b = buildValueExpr(ts.slice(iOp + 1), prec + 1);
			const op = ts[iOp].assertSymbol();

			if (!a || !b || !op) {
				return null;
			}

			return new BinaryExpr(op, a, b);
		} else {
			return buildValueExpr(ts, prec + 1);
		}
	};
}

/**
 * @package
 * @param {string | string[]} symbol 
 * @returns {(ts: Token[], prec: number) => (ValueExpr | null)}
 */
function makeUnaryExprBuilder(symbol) {
	// default behaviour is right-to-left associative
	return function (ts, prec) {
		if (ts[0].isSymbol(symbol)) {
			const rhs = buildValueExpr(ts.slice(1), prec);
			const op = ts[0].assertSymbol();

			if (!rhs || !op) {
				return null;
			}

			return new UnaryExpr(op, rhs);
		} else {
			return buildValueExpr(ts, prec + 1);
		}
	}
}

/**
 * @package
 * @param {Token[]} ts 
 * @param {number} prec 
 * @returns {ValueExpr | null}
 */
function buildChainedValueExpr(ts, prec) {
	/** @type {ValueExpr | null} */
	let expr = buildChainStartValueExpr(ts);

	// now we can parse the rest of the chaining
	while (ts.length > 0) {
		if (expr === null) {
			return null;
		}

		const t = assertDefined(ts.shift());

		if (t.isGroup("(")) {
			expr = buildCallExpr(t.site, expr, assertDefined(t.assertGroup()));
		} else if (t.isGroup("[")) {
			t.syntaxError("invalid expression '[...]'");
			return null;
		} else if (t.isSymbol(".") && ts.length > 0 && ts[0].isWord("switch")) {
			expr = buildSwitchExpr(expr, ts);
		} else if (t.isSymbol(".")) {
			const name = assertToken(ts.shift(), t.site)?.assertWord()?.assertNotKeyword();

			if (!name) {
				return null;
			}

			expr = new MemberExpr(t.site, expr, name);
		} else if (t.isGroup("{")) {
			t.syntaxError("invalid syntax");
			return null;
		} else if (t.isSymbol("::")) {
			t.syntaxError("invalid syntax");
			return null;
		} else {
			t.syntaxError(`invalid syntax '${t.toString()}'`);
			return null;
		}
	}

	return expr;
}

/**
 * @param {Site} site 
 * @param {ValueExpr} fnExpr 
 * @param {Group} parens
 * @returns {CallExpr | null}
 */
function buildCallExpr(site, fnExpr, parens) {
	const callArgs = buildCallArgs(parens);

	if (callArgs === null) {
		return null;
	} else {
		return new CallExpr(site, fnExpr, callArgs);
	}
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {ValueExpr | null}
 */
function buildChainStartValueExpr(ts) {
	if (ts.length > 1 && ts[0].isGroup("(") && ts[1].isSymbol("->")) {
		return buildFuncLiteralExpr(ts, null, true);
	} else if (ts[0].isWord("if")) {
		return buildIfElseExpr(ts);
	} else if (ts[0].isWord("switch")) {
		ts[0].syntaxError("expected '... .switch' instead of 'switch'");
		return null;
	} else if (ts[0].isLiteral()) {
		return new PrimitiveLiteralExpr(assertDefined(ts.shift())); // can simply be reused
	} else if (ts[0].isGroup("(")) {
		return buildParensExpr(ts);
	} else if (Group.find(ts, "{") != -1) {
		if (ts[0].isGroup("[")) {
			return buildListLiteralExpr(ts);
		} else if (ts[0].isWord("Map") && ts[1].isGroup("[")) {
			return buildMapLiteralExpr(ts); 
		} else {
			// could be switch or literal struct construction
			const iBraces = Group.find(ts, "{");
			const iSwitch = Word.find(ts, "switch");
			const iPeriod = SymbolToken.find(ts, ".");

			if (iSwitch != -1 && iPeriod != -1 && iSwitch < iBraces && iPeriod < iBraces && iSwitch > iPeriod) {
				return buildValueExpr(ts.splice(0, iPeriod));
			} else {
				return buildStructLiteralExpr(ts);
			}
		}
	} else if (SymbolToken.find(ts, "::") != -1) {
		return buildValuePathExpr(ts);
	} else if (ts[0].isWord()) {
		if (ts[0].isWord("const") || ts[0].isWord("struct") || ts[0].isWord("enum") || ts[0].isWord("func") || ts[0].isWord("import")) {
			ts[0].syntaxError(`invalid use of '${assertDefined(ts[0].assertWord()).value}', can only be used as top-level statement`);
			return null;
		} else {
			const name = assertDefined(ts.shift()?.assertWord());

			if (name.value == "self") {
				return new ValueRefExpr(name);
			} else {
				const n = name.assertNotKeyword();

				if (!n) {
					return null;
				}

				return new ValueRefExpr(n);
			}
		}
	} else {
		ts[0].syntaxError("invalid syntax");
		return null;
	}
}

/**
 * @package
 * @param {Token[]} ts
 * @returns {ValueExpr | null}
 */
function buildParensExpr(ts) {
	const group = assertDefined(ts.shift()).assertGroup("(");

	if (!group) {
		return null;
	}

	const site = group.site;

	if (group.fields.length === 0) {
		group.syntaxError("expected at least one expr in parens");
		return null;
	} else {
		const fields = group.fields.map(fts => buildValueExpr(fts));

		/**
		 * @type {ValueExpr[]}
		 */
		const nonNullFields = [];

		fields.forEach(f => {
			if (f !== null) {
				nonNullFields.push(f);
			}
		});

		if (nonNullFields.length == 0) {
			// error will already have been thrown internally
			return null;
		} else {
			return new ParensExpr(site, nonNullFields);
		}
	}
}

/**
 * @package
 * @param {Group} parens 
 * @returns {CallArgExpr[] | null}
 */
function buildCallArgs(parens) {
	/**
	 * @type {Set<string>}
	 */
	const names = new Set();

	const callArgs = reduceNull(parens.fields.map(fts => {
		const callArg = buildCallArgExpr(parens.site, fts);

		if (callArg !== null && callArg.isNamed()) {
			if (names.has(callArg.name)) {
				callArg.syntaxError(`duplicate named call arg ${callArg.name}`);
			}

			names.add(callArg.name);
		}

		return callArg;
	}));

	if (callArgs === null) {
		return null;
	} else {
		if (callArgs.some(ca => ca.isNamed()) && callArgs.some(ca => !ca.isNamed())) {
			callArgs[0].syntaxError("can't mix positional and named args");
			return null;
		}

		return callArgs;
	}
}

/**
 * @param {Site} site 
 * @param {Token[]} ts 
 * @returns {CallArgExpr | null}
 */
function buildCallArgExpr(site, ts) {
	if (ts.length == 0) {
		site.syntaxError("invalid syntax");
		return null;
	}

	/**
	 * @type {null | undefined | Word}
	 */
	let name = null;

	if (ts.length >= 2 && ts[0].isWord() && ts[1].isSymbol(":")) {
		name = assertDefined(ts.shift()).assertWord()?.assertNotKeyword();

		if (!name) {
			return null;
		}

		const colon = assertDefined(ts.shift());

		if (ts.length == 0) {
			colon.syntaxError("expected value expressions after ':'");
			return null;
		}
	}

	const value = buildValueExpr(ts);

	if (!value) {
		return null;
	}

	return new CallArgExpr(name != null ? name.site : value.site, name, value);
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {IfElseExpr | null}
 */
function buildIfElseExpr(ts) {
	const ifWord = assertDefined(ts.shift()).assertWord("if");

	if (!ifWord) {
		return null;
	}

	const site = ifWord.site;

	/** @type {ValueExpr[]} */
	const conditions = [];

	/** @type {ValueExpr[]} */
	const branches = [];
	while (true) {
		const parens = assertToken(ts.shift(), site)?.assertGroup("(");

		if (!parens) {
			return null;
		}

		const braces = assertToken(ts.shift(), site)?.assertGroup("{");

		if (!braces) {
			return null;
		}

		if (parens.fields.length != 1) {
			parens.syntaxError("expected single if-else condition");
			return null;
		}

		if (braces.fields.length == 0) {
			braces.syntaxError("branch body can't be empty");
			return null;
		} else if (braces.fields.length != 1) {
			braces.syntaxError("expected single if-else branch expession");
			return null;
		}

		const cond = buildValueExpr(parens.fields[0]);
		const branch = buildValueExpr(braces.fields[0]);

		if (cond === null || branch === null) {
			continue;
		}

		conditions.push(cond);
		branches.push(branch);

		const maybeElse = ts.shift();

		if (maybeElse === undefined ) {
			// add a void else branch
			branches.push(new VoidExpr(braces.site));
			break;
		} else {
			const elseWord = maybeElse.assertWord("else");

			if (!elseWord) {
				return null;
			}

			const next = assertToken(ts.shift(), elseWord.site);

			if (!next) {
				return null;
			} else if (next.isGroup("{")) {
				// last group
				const braces = next.assertGroup();

				if (!braces) {
					return null;
				}

				if (braces.fields.length != 1) {
					braces.syntaxError("expected single expession for if-else branch");
					return null;
				}

				const elseBranch = buildValueExpr(braces.fields[0]);

				if (!elseBranch) {
					return null;
				}

				branches.push(elseBranch);
				break;
			} else if (next.isWord("if")) {
				continue;
			} else {
				next.syntaxError("unexpected token");
				return null;
			}
		}
	}

	return new IfElseExpr(site, conditions, branches);
}

/**
 * @package
 * @param {ValueExpr} controlExpr
 * @param {Token[]} ts 
 * @returns {ValueExpr | null} - EnumSwitchExpr or DataSwitchExpr
 */
function buildSwitchExpr(controlExpr, ts) {
	const switchWord = assertDefined(ts.shift()).assertWord("switch");

	if (!switchWord) {
		return null;
	}

	const site = switchWord.site;

	const braces = assertToken(ts.shift(), site)?.assertGroup("{");

	if (!braces) {
		return null;
	}

	/** @type {SwitchCase[]} */
	const cases = [];

	/** @type {null | SwitchDefault} */
	let def = null;

	for (let tsInner of braces.fields) {
		if (tsInner[0].isWord("else") || tsInner[0].isWord("_")) {
			if (def !== null) {
				def.syntaxError("duplicate default case in switch");
				return null;
			}

			def = buildSwitchDefault(tsInner);
		} else {
			if (def !== null) {
				def.syntaxError("switch default case must come last");
				return null;
			}

			const c = buildSwitchCase(tsInner);

			if (c === null) {
				return null;
			} else {
				cases.push(c);
			}
		}
	}

	// check the uniqueness of each case here
	/** @type {Set<string>} */
	const set = new Set()
	for (let c of cases) {
		let t = c.memberName.toString();
		if (set.has(t)) {
			c.memberName.syntaxError(`duplicate switch case '${t}')`);
			return null;
		}

		set.add(t);
	}

	if (cases.length < 1) {
		site.syntaxError("expected at least one switch case");
		return null;
	}

	if (cases.some(c => c.isDataMember())) {
		if (cases.length + (def === null ? 0 : 1) > 5) {
			site.syntaxError(`too many cases for data switch, expected 5 or less, got ${cases.length.toString()}`);
			return null;
		} else {
			let count = 0;
			cases.forEach(c => {if (!c.isDataMember()){count++}});

			if (count > 1) {
				site.syntaxError(`expected at most 1 enum case in data switch, got ${count}`);
				return null;
			} else {
				if (count === 1 && cases.some(c => c instanceof UnconstrDataSwitchCase)) {
					site.syntaxError(`can't have both enum and (Int, []Data) in data switch`);
					return null;
				} else {
					return new DataSwitchExpr(site, controlExpr, cases, def);
				}
			}
		}
	} else {
		return new EnumSwitchExpr(site, controlExpr, cases, def);
	}
}

/**
 * @package
 * @param {Site} site
 * @param {Token[]} ts
 * @param {boolean} isAfterColon
 * @returns {Word | null} 
 */
function buildSwitchCaseName(site, ts, isAfterColon) {
	const first = ts.shift();

	if (first === undefined) {
		if (isAfterColon) {
			site.syntaxError("invalid switch case syntax, expected member name after ':'");
			return null;
		} else {
			site.syntaxError("invalid switch case syntax");
			return null;
		}
	}
		
	if (first.isWord("Map")) {
		const second = ts.shift();

		if (!second) {
			site.syntaxError("expected token after 'Map'");
			return null;
		}

		const keyTs = second.assertGroup("[]", 1)?.fields[0];

		if (keyTs === undefined || keyTs === null) {
			return null;
		}

		const key = keyTs.shift();

		if (key === undefined) {
			second.syntaxError("expected 'Map[Data]Data'");
			return null;
		}

		key.assertWord("Data");

		if (keyTs.length > 0) {
			keyTs[0].syntaxError("unexpected token after 'Data'");
			return null;
		}

		const third = ts.shift();

		if (third === undefined) {
			site.syntaxError("expected token after 'Map[Data]");
			return null;
		}

		third.assertWord("Data");

		if (ts.length > 0) {
			ts[0].syntaxError("unexpected token after 'Map[Data]Data'");
			return null;
		}

		return new Word(first.site, "Map[Data]Data");
	} else if (first.isWord()) {
		if (ts.length > 0) {
			ts[0].syntaxError("unexpected token");
			return null;
		}

		return first?.assertWord()?.assertNotKeyword() ?? null;
	} else if (first.isGroup("[")) {
		// list 
		first.assertGroup("[", 0);

		const second = ts.shift();

		if (second === undefined) {
			site.syntaxError("expected token after '[]'");
			return null;
		} else if (ts.length > 0) {
			ts[0].syntaxError("unexpected token");
			return null;
		}

		second.assertWord("Data");

		return new Word(first.site, "[]Data");
	} else {
		first.syntaxError("invalid switch case name syntax");
		return null;
	}
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {SwitchCase | null}
 */
function buildSwitchCase(ts) {
	const arrowPos = SymbolToken.find(ts, "=>");

	if (arrowPos == -1) {
		ts[0].syntaxError("expected '=>' in switch case");
		return null;
	} else if (arrowPos == 0) {
		ts[0].syntaxError("expected '<word>' or '<word>: <word>' to the left of '=>'");
		return null;
	}

	const tsLeft = ts.splice(0, arrowPos);

	if (tsLeft.length === 1 && tsLeft[0].isGroup("(")) {
		return buildMultiArgSwitchCase(tsLeft, ts);
	} else {
		return buildSingleArgSwitchCase(tsLeft, ts);
	}
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {null | [?Word, Word]} - varName is optional
 */
function buildSwitchCaseNameType(ts) {
	const colonPos = SymbolToken.find(ts, ":");

	/** @type {null | Word} */
	let varName = null;

	/** @type {null | Word} */
	let memberName = null;

	if (colonPos != -1) {
		const maybeVarName = assertDefined(ts.shift()).assertWord()?.assertNotKeyword();

		if (!maybeVarName) {
			return null;
		}

		varName = maybeVarName;
		
		const maybeColon = ts.shift();

		if (maybeColon === undefined) {
			varName.syntaxError("invalid switch case syntax, expected '(<name>: <enum-member>)', got '(<name>)'");
			return null;
		} else {
			void maybeColon.assertSymbol(":");

			memberName = buildSwitchCaseName(maybeColon.site, ts, true);
		}
	} else {
		memberName = buildSwitchCaseName(ts[0].site, ts, false);
	}

	if (ts.length !== 0) {
		ts[0].syntaxError("unexpected token");
		return null;
	}

	if (memberName === null) {
		// error will already have been thrown internally
		return null;
	} else {
		return [varName, memberName];
	}
}

/**
 * @package
 * @param {Token[]} tsLeft
 * @param {Token[]} ts
 * @returns {SwitchCase | null}
 */
function buildMultiArgSwitchCase(tsLeft, ts) {
	const parens = assertDefined(tsLeft.shift()).assertGroup("(");

	if (!parens) {
		return null;
	}

	const pairs = reduceNull(parens.fields.map(fts => buildSwitchCaseNameType(fts)));

	if (pairs === null) {
		return null;
	}

	assert(tsLeft.length === 0);

	if (pairs.length !== 2) {
		parens.syntaxError(`expected (Int, []Data) case, got (${pairs.map(p => p[1].value).join(", ")}`);
		return null;
	} else if (pairs[0][1].value != "Int" || pairs[1][1].value != "[]Data") {
		parens.syntaxError(`expected (Int, []Data) case, got (${pairs[0][1].value}, ${pairs[1][1].value})`);
		return null;
	} else {
		const maybeArrow = ts.shift();

		if (maybeArrow === undefined) {
			parens.syntaxError("expected '=>'");
			return null;
		} else {
			const arrow = maybeArrow.assertSymbol("=>");

			if (!arrow) {
				return null;
			}

			const bodyExpr = buildSwitchCaseBody(arrow.site, ts);

			if (bodyExpr === null) {
				return null;
			} else {
				return new UnconstrDataSwitchCase(arrow.site, pairs[0][0], pairs[1][0], bodyExpr);
			}
		}
	}
}

/**
 * @package
 * @param {Token[]} tsLeft 
 * @param {Token[]} ts 
 * @returns {SwitchCase | null}
 */
function buildSingleArgSwitchCase(tsLeft, ts) {
	const site = tsLeft[tsLeft.length-1].site;

	const destructExpr = buildDestructExpr(site, tsLeft, true);

	if (destructExpr === null) {
		return null;
	} else if (!destructExpr.hasType()) {
		destructExpr.site.syntaxError("invalid switch case syntax");
		return null;
	}
	
	const maybeArrow = ts.shift();

	if (maybeArrow === undefined) {
		site.syntaxError("expected '=>'");
		return null;
	} else {
		const arrow = maybeArrow.assertSymbol("=>");

		if (!arrow) {
			return null;
		}

		const bodyExpr = buildSwitchCaseBody(arrow.site, ts);

		if (bodyExpr === null) {
			return null;
		} else {
			return new SwitchCase(arrow.site, destructExpr, bodyExpr);
		}
	}
}

/**
 * @package
 * @param {Site} site 
 * @param {Token[]} ts 
 * @returns {ValueExpr | null}
 */
function buildSwitchCaseBody(site, ts) {
	/** @type {?ValueExpr} */
	let bodyExpr = null;

	if (ts.length == 0) {
		site.syntaxError("expected expression after '=>'");
		return null;
	} else if (ts[0].isGroup("{")) {
		if (ts.length > 1) {
			ts[1].syntaxError("unexpected token");
			return null;
		}

		const tsBody = ts[0].assertGroup("{", 1)?.fields[0];

		if (tsBody === undefined || tsBody === null) {
			return null;
		}

		bodyExpr = buildValueExpr(tsBody);
	} else {
		bodyExpr = buildValueExpr(ts);
	}

	return bodyExpr;
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {SwitchDefault | null}
 */
function buildSwitchDefault(ts) {
	const elseWord = assertDefined(ts.shift()).assertWord();

	if (!elseWord) {
		return null;
	} else if (!(elseWord.isWord("else") || elseWord.isWord("_"))) {
		elseWord.syntaxError("expected 'else' or '_'");
		return null;
	}

	const site = elseWord.site;

	const maybeArrow = ts.shift();
	if (maybeArrow === undefined) {
		site.syntaxError(`expected '=>' after '${elseWord.value}'`);
		return null;
	} else {
		const arrow = maybeArrow.assertSymbol("=>");

		if (!arrow) {
			return null;
		}

		/** @type {null | ValueExpr} */
		let bodyExpr = null;

		if (ts.length == 0) {
			arrow.syntaxError("expected expression after '=>'");
			return null;
		} else if (ts[0].isGroup("{")) {
			if (ts.length > 1) {
				ts[1].syntaxError("unexpected token");
				return null;
			} else {
				const bodyTs = ts[0].assertGroup("{", 1)?.fields[0];

				if (bodyTs === undefined || bodyTs === null) {
					return null;
				}

				bodyExpr = buildValueExpr(bodyTs);
			}
		} else {
			bodyExpr = buildValueExpr(ts);
		}

		if (!bodyExpr) {
			arrow.syntaxError("empty switch default case body");
			return null;
		}

		return new SwitchDefault(arrow.site, bodyExpr);
	}
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {ListLiteralExpr | null}
 */
function buildListLiteralExpr(ts) {
	const group = assertDefined(ts.shift()).assertGroup("[", 0);

	if (!group) {
		return null;
	}

	const site = group.site;

	const bracesPos = Group.find(ts, "{");

	if (bracesPos == -1) {
		site.syntaxError("invalid list literal expression syntax");
		return null;
	}

	const itemTypeExpr = buildTypeExpr(site, ts.splice(0, bracesPos));

	if (!itemTypeExpr) {
		return null;
	}

	const braces = assertToken(ts.shift(), site)?.assertGroup("{");

	if (!braces) {
		return null;
	}

	const itemExprs = reduceNull(braces.fields.map(fts => buildValueExpr(fts)));

	if (itemExprs === null) {
		// error will have already been thrown internally
		return null;
	}

	return new ListLiteralExpr(site, itemTypeExpr, itemExprs);
}

/**
 * @package
 * @param {Token[]} ts
 * @returns {MapLiteralExpr | null}
 */
function buildMapLiteralExpr(ts) {
	const mapWord = assertDefined(ts.shift()).assertWord("Map");

	if (!mapWord) {
		return null;
	}

	const site = mapWord.site;

	const bracket = assertDefined(ts.shift()).assertGroup("[", 1);

	if (!bracket) {
		return null;
	}

	const keyTypeExpr = buildTypeExpr(site, bracket.fields[0]);

	if (!keyTypeExpr) {
		return null;
	}

	const bracesPos = Group.find(ts, "{");

	if (bracesPos == -1) {
		site.syntaxError("invalid map literal expression syntax");
		return null;
	}

	const valueTypeExpr = buildTypeExpr(site, ts.splice(0, bracesPos));

	if (!valueTypeExpr) {
		return null;
	}

	const braces = assertDefined(ts.shift()).assertGroup("{");

	if (!braces) {
		return null;
	}

	/**
	 * @type {null | [ValueExpr, ValueExpr][]}
	 */
	const pairs = reduceNullPairs(braces.fields.map(fts => {
		const colonPos = SymbolToken.find(fts, ":");

		if (colonPos == -1) {
			if (fts.length == 0) {
				braces.syntaxError("unexpected empty field");
			} else {
				fts[0].syntaxError("expected ':' in map literal field");
			}
		} else if (colonPos == 0) {
			fts[colonPos].syntaxError("expected expression before ':' in map literal field");
		} else if (colonPos == fts.length - 1) {
			fts[colonPos].syntaxError("expected expression after ':' in map literal field");
		} else {
			const keyExpr = buildValueExpr(fts.slice(0, colonPos));

			const valueExpr = buildValueExpr(fts.slice(colonPos+1));

			/**
			 * @type {[ValueExpr | null, ValueExpr | null]}
			 */
			return [keyExpr, valueExpr];
		}

		return [null, null];
	}));

	if (pairs === null) {
		return null;
	}

	return new MapLiteralExpr(site, keyTypeExpr, valueTypeExpr, pairs);
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {StructLiteralExpr | null}
 */
function buildStructLiteralExpr(ts) {
	const bracesPos = Group.find(ts, "{");

	assert(bracesPos != -1);

	const site = ts[bracesPos].site;

	if (bracesPos == 0) {
		site.syntaxError("expected struct type before braces");
		return null;
	}
	
	const typeExpr = buildTypeExpr(site, ts.splice(0, bracesPos));

	if (!typeExpr) {
		return null;
	}

	const braces = assertDefined(ts.shift()).assertGroup("{");

	if (!braces) {
		return null;
	}

	const fields = reduceNull(braces.fields.map(fts => buildStructLiteralField(braces.site, fts)));

	if (fields === null) {
		return null;
	} 
	
	if (fields.every(f => f.isNamed()) || fields.every(f => !f.isNamed())) {
		return new StructLiteralExpr(typeExpr, fields);
	} else {
		braces.site.syntaxError("mangled literal struct (hint: specify all fields positionally or all with keys)");
		return null;
	}
}

/**
 * @package
 * @param {Site} site - site of the braces
 * @param {Token[]} ts
 * @returns {StructLiteralField | null}
 */
function buildStructLiteralField(site, ts) {
	if (ts.length > 2 && ts[0].isWord() && ts[1].isSymbol(":")) {
		return buildStructLiteralNamedField(site, ts);
	} else {
		return buildStructLiteralUnnamedField(site, ts);
	}
}

/**
 * @package
 * @param {Site} site
 * @param {Token[]} ts
 * @returns {StructLiteralField | null}
 */
function buildStructLiteralNamedField(site, ts) {
	const name = assertToken(ts.shift(), site, "empty struct literal field")?.assertWord()?.assertNotKeyword();

	if (!name) {
		return null;
	}

	const colon = assertToken(ts.shift(), name.site, "expected ':' after struct field name")?.assertSymbol(":");

	if (!colon) {
		return null;
	}

	if (ts.length == 0) {
		colon.syntaxError("expected expression after ':'");
		return null;
	}
	const valueExpr = buildValueExpr(ts);

	if (!valueExpr) {
		return null;
	}

	return new StructLiteralField(name, valueExpr);
}

/**
 * @package
 * @param {Site} site
 * @param {Token[]} ts
 * @returns {StructLiteralField | null}
 */
function buildStructLiteralUnnamedField(site, ts) {
	const valueExpr = buildValueExpr(ts);

	if (!valueExpr) {
		return null;
	}

	return new StructLiteralField(null, valueExpr);
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {ValueExpr | null}
 */
function buildValuePathExpr(ts) {
	const dcolonPos = SymbolToken.findLast(ts, "::");

	assert(dcolonPos != -1);

	const typeExpr = buildTypeExpr(ts[dcolonPos].site, ts.splice(0, dcolonPos));

	if (!typeExpr) {
		return null;
	}

	const dcolon = assertDefined(ts.shift()?.assertSymbol("::"));

	const memberName = assertToken(ts.shift(), dcolon.site)?.assertWord()?.assertNotKeyword();

	if (!memberName) {
		return null;
	}
	
	return new ValuePathExpr(typeExpr, memberName);
}


/////////////////////////////
// Section 19: IR definitions
/////////////////////////////

/**
 * For collecting test coverage statistics
 * @type {?((name: string, count: number) => void)}
 */
var onNotifyRawUsage = null;

/**
 * Set the statistics collector (used by the test-suite)
 * @param {(name: string, count: number) => void} callback 
 */
function setRawUsageNotifier(callback) {
	onNotifyRawUsage = callback;
}

/**
 * Wrapper for a builtin function (written in IR)
 */
class RawFunc {
	#name;
	#definition;

	/** @type {Set<string>} */
	#dependencies;

	/**
	 * Construct a RawFunc, and immediately scan the definition for dependencies
	 * @param {string} name 
	 * @param {string} definition 
	 */
	constructor(name, definition) {
		this.#name = name;
		assert(definition != undefined);
		this.#definition = definition;
		this.#dependencies = new Set();

		let re = new RegExp("__helios__[a-zA-Z_0-9]*", "g");

		let matches = this.#definition.match(re);

		if (matches !== null) {
			for (let match of matches) {
				this.#dependencies.add(match);
			}
		}
	}

	get name() {
		return this.#name;
	}

	/**
	 * Loads 'this.#dependecies' (if not already loaded), then load 'this'
	 * @param {Map<string, RawFunc>} db 
	 * @param {Map<string, IR>} dst 
	 * @returns {void}
	 */
	load(db, dst) {
		if (onNotifyRawUsage !== null) {
			onNotifyRawUsage(this.#name, 1);
		}

		if (dst.has(this.#name)) {
			return;
		} else {
			for (let dep of this.#dependencies) {
				if (!db.has(dep)) {
					throw new Error(`InternalError: dependency ${dep} is not a builtin`);
				} else {
					assertDefined(db.get(dep)).load(db, dst);
				}
			}

			dst.set(this.#name, new IR(replaceTabs(this.#definition)));
		}
	}
}

/**
 * Initializes the db containing all the builtin functions
 * @returns {Map<string, RawFunc>}
 */
// only need to wrap these source in IR right at the very end
function makeRawFunctions() {
	/** @type {Map<string, RawFunc>} */
	let db = new Map();

	// local utility functions

	/**
	 * @param {RawFunc} fn 
	 */
	function add(fn) {
		if (db.has(fn.name)) {
			throw new Error(`builtin ${fn.name} duplicate`);
		}
		db.set(fn.name, fn);
	}

	/**
	 * Adds basic auto members to a fully named type
	 * @param {string} ns 
	 */
	function addDataFuncs(ns) {
		add(new RawFunc(`${ns}____eq`, "__helios__common____eq"));
		add(new RawFunc(`${ns}____neq`, "__helios__common____neq"));
		add(new RawFunc(`${ns}__serialize`, "__helios__common__serialize"));
		add(new RawFunc(`${ns}__from_data`, "__helios__common__identity"));
	}

	/**
	 * Adds basic auto members to a fully named enum type
	 * @param {string} ns 
	 */
	function addEnumDataFuncs(ns) {
		add(new RawFunc(`${ns}____eq`, "__helios__common____eq"));
		add(new RawFunc(`${ns}____neq`, "__helios__common____neq"));
		add(new RawFunc(`${ns}__serialize`, "__helios__common__serialize"));
	}

	/**
	 * Generates the IR needed to unwrap a Plutus-core constrData
	 * @param {string} dataExpr
	 * @param {number} iConstr 
	 * @param {number} iField 
	 * @param {string} errorExpr 
	 * @returns {string}
	 */
	function unData(dataExpr, iConstr, iField, errorExpr = "error(\"unexpected constructor index\")") {
		let inner = "__core__sndPair(pair)";
		for (let i = 0; i < iField; i++) {
			inner = `__core__tailList(${inner})`;
		}

		// deferred evaluation of ifThenElse branches
		return `(pair) -> {__core__ifThenElse(__core__equalsInteger(__core__fstPair(pair), ${iConstr}), () -> {__core__headList(${inner})}, () -> {${errorExpr}})()}(__core__unConstrData(${dataExpr}))`;
	}

	/**
	 * Generates verbose IR for unwrapping a Plutus-core constrData.
	 * If config.DEBUG === false then returns IR without print statement
	 * @param {string} dataExpr
	 * @param {string} constrName
	 * @param {number} iConstr
	 * @param {number} iField
	 * @returns {string}
	 */
	function unDataVerbose(dataExpr, constrName, iConstr, iField) {
		if (!config.DEBUG) {
			return unData(dataExpr, iConstr, iField);
		} else {
			return unData(dataExpr, iConstr, iField, `__helios__common__verbose_error(__core__appendString("bad constr for ${constrName}, want ${iConstr.toString()} but got ", __helios__int__show(__core__fstPair(pair))()))`)
		}
	}

	/**
	 * Generates IR for constructing a list.
	 * By default the result is kept as list, and not converted to data
	 * @param {string[]} args 
	 * @param {boolean} toData 
	 * @returns 
	 */
	function makeList(args, toData = false) {
		let n = args.length;
		let inner = "__core__mkNilData(())";

		for (let i = n - 1; i >= 0; i--) {
			inner = `__core__mkCons(${args[i]}, ${inner})`;
		}

		if (toData) {
			inner = `__core__listData(${inner})`
		}

		return inner;
	}


	// Common builtins
	add(new RawFunc("__helios__common__verbose_error",
	`(msg) -> {
		__core__trace(msg, () -> {error("")})()
	}`));
	add(new RawFunc("__helios__common__assert_constr_index",
	`(data, i) -> {
		__core__ifThenElse(
			__core__equalsInteger(__core__fstPair(__core__unConstrData(data)), i),
			() -> {data},
			() -> {error("unexpected constructor index")}
		)()
	}`));
	add(new RawFunc("__helios__common__identity",
	`(self) -> {self}`));
	add(new RawFunc("__helios__common__not",
	`(b) -> {
		__core__ifThenElse(b, false, true)
	}`));
	add(new RawFunc("__helios__common____eq", "__core__equalsData"));
	add(new RawFunc("__helios__common____neq",
	`(a, b) -> {
		__helios__common__not(__core__equalsData(a, b))
	}`));
	add(new RawFunc("__helios__common__serialize",
	`(self) -> {
		() -> {
			__core__bData(__core__serialiseData(self))
		}
	}`));
	add(new RawFunc("__helios__common__any",
	`(self, fn) -> {
		(recurse) -> {
			recurse(recurse, self, fn)
		}(
			(recurse, self, fn) -> {
				__core__chooseList(
					self, 
					() -> {false}, 
					() -> {
						__core__ifThenElse(
							fn(__core__headList(self)),
							() -> {true}, 
							() -> {recurse(recurse, __core__tailList(self), fn)}
						)()
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__all", 
	`(self, fn) -> {
		(recurse) -> {
			recurse(recurse, self, fn)
		}(
			(recurse, self, fn) -> {
				__core__chooseList(
					self,
					() -> {true},
					() -> {
						__core__ifThenElse(
							fn(__core__headList(self)),
							() -> {recurse(recurse, __core__tailList(self), fn)},
							() -> {false}
						)()
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__map",
	`(self, fn, init) -> {
		(recurse) -> {
			recurse(recurse, self, init)
		}(
			(recurse, rem, lst) -> {
				__core__chooseList(
					rem,
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
	}`));
	add(new RawFunc("__helios__common__filter", 
	`(self, fn, nil) -> {
		(recurse) -> {
			recurse(recurse, self, fn)
		}(
			(recurse, self, fn) -> {
				__core__chooseList(
					self, 
					() -> {nil}, 
					() -> {
						__core__ifThenElse(
							fn(__core__headList(self)),
							() -> {__core__mkCons(__core__headList(self), recurse(recurse, __core__tailList(self), fn))}, 
							() -> {recurse(recurse, __core__tailList(self), fn)}
						)()
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__filter_list", 
	`(self, fn) -> {
		__helios__common__filter(self, fn, __helios__common__list_0)
	}`));
	add(new RawFunc("__helios__common__filter_map",
	`(self, fn) -> {
		__helios__common__filter(self, fn, __core__mkNilPairData(()))
	}`));
	add(new RawFunc("__helios__common__find",
	`(self, fn, callback) -> {
		(recurse) -> {
			recurse(recurse, self, fn)
		}(
			(recurse, self, fn) -> {
				__core__chooseList(
					self, 
					() -> {error("not found")}, 
					() -> {
						__core__ifThenElse(
							fn(__core__headList(self)), 
							() -> {callback(__core__headList(self))}, 
							() -> {recurse(recurse, __core__tailList(self), fn)}
						)()
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__find_safe",
	`(self, fn, callback) -> {
		(recurse) -> {
			recurse(recurse, self, fn)
		}(
			(recurse, self, fn) -> {
				__core__chooseList(
					self, 
					() -> {__core__constrData(1, __helios__common__list_0)}, 
					() -> {
						__core__ifThenElse(
							fn(__core__headList(self)), 
							() -> {__core__constrData(0, __helios__common__list_1(callback(__core__headList(self))))}, 
							() -> {recurse(recurse, __core__tailList(self), fn)}
						)()
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__fold",
	`(self, fn, z) -> {
		(recurse) -> {
			recurse(recurse, self, fn, z)
		}(
			(recurse, self, fn, z) -> {
				__core__chooseList(
					self, 
					() -> {z}, 
					() -> {recurse(recurse, __core__tailList(self), fn, fn(z, __core__headList(self)))}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__fold_lazy",
	`(self, fn, z) -> {
		(recurse) -> {
			recurse(recurse, self, fn, z)
		}(
			(recurse, self, fn, z) -> {
				__core__chooseList(
					self, 
					() -> {z}, 
					() -> {fn(__core__headList(self), () -> {recurse(recurse, __core__tailList(self), fn, z)})}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__insert_in_sorted",
	`(x, lst, comp) -> {
		(recurse) -> {
			recurse(recurse, lst)
		}(
			(recurse, lst) -> {
				__core__chooseList(
					lst,
					() -> {__core__mkCons(x, lst)},
					() -> {
						(head) -> {
							__core__ifThenElse(
								comp(x, head),
								() -> {__core__mkCons(x, lst)},
								() -> {__core__mkCons(head, recurse(recurse, __core__tailList(lst)))}
							)()
						}(__core__headList(lst))
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__sort", 
	`(lst, comp) -> {
		(recurse) -> {
			recurse(recurse, lst)
		}(
			(recurse, lst) -> {
				__core__chooseList(
					lst,
					() -> {lst},
					() -> {
						(head, tail) -> {
							__helios__common__insert_in_sorted(head, tail, comp)
						}(__core__headList(lst), recurse(recurse, __core__tailList(lst)))
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__map_get",
	`(self, key, fnFound, fnNotFound) -> {
		(self) -> {
			(recurse) -> {
				recurse(recurse, self, key)
			}(
				(recurse, self, key) -> {
					__core__chooseList(
						self, 
						fnNotFound, 
						() -> {
							__core__ifThenElse(
								__core__equalsData(key, __core__fstPair(__core__headList(self))), 
								() -> {fnFound(__core__sndPair(__core__headList(self)))}, 
								() -> {recurse(recurse, __core__tailList(self), key)}
							)()
						}
					)()
				}
			)
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__common__is_in_bytearray_list",
	`(lst, key) -> {
		__helios__common__any(lst, (item) -> {__core__equalsData(item, key)})
	}`));
	add(new RawFunc("__helios__common__unBoolData",
	`(d) -> {
		__core__ifThenElse(
			__core__equalsInteger(__core__fstPair(__core__unConstrData(d)), 0), 
			false, 
			true
		)
	}`));
	add(new RawFunc("__helios__common__boolData",
	`(b) -> {
		__core__constrData(__core__ifThenElse(b, 1, 0), __helios__common__list_0)
	}`));
	add(new RawFunc("__helios__common__unStringData",
	`(d) -> {
		__core__decodeUtf8(__core__unBData(d))
	}`));
	add(new RawFunc("__helios__common__stringData",
	`(s) -> {
		__core__bData(__core__encodeUtf8(s))
	}`));
	add(new RawFunc("__helios__common__length", 
	`(lst) -> {
		(recurse) -> {
			__core__iData(recurse(recurse, lst))
		}(
			(recurse, lst) -> {
				__core__chooseList(
					lst, 
					() -> {0}, 
					() -> {__core__addInteger(recurse(recurse, __core__tailList(lst)), 1)}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__max",
	`(a, b) -> {
		__core__ifThenElse(
			__core__lessThanInteger(a, b),
			b,
			a
		)
	}`));
	add(new RawFunc("__helios__common__min", 
	`(a, b) -> {
		__core__ifThenElse(
			__core__lessThanEqualsInteger(a, b),
			a,
			b
		)
	}`));
	add(new RawFunc("__helios__common__concat", 
	`(a, b) -> {
		(recurse) -> {
			recurse(recurse, b, a)
		}(
			(recurse, lst, rem) -> {
				__core__chooseList(
					rem,
					() -> {lst},
					() -> {__core__mkCons(__core__headList(rem), recurse(recurse, lst, __core__tailList(rem)))}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__slice_bytearray",
	`(self, selfLengthFn) -> {
		(start, end) -> {
			(self) -> {
				(start, end) -> {
					(normalize) -> {
						__core__bData(
							(fn) -> {
								fn(normalize(start))
							}(
								(start) -> {
									(fn) -> {
										fn(normalize(end))
									}(
										(end) -> {
											__core__sliceByteString(start, __core__subtractInteger(end, __helios__common__max(start, 0)), self)
										}
									)
								}
							)
						)
					}(
						(pos) -> {
							__core__ifThenElse(
								__core__lessThanInteger(pos, 0),
								() -> {
									__core__addInteger(__core__addInteger(selfLengthFn(self), 1), pos)
								},
								() -> {
									pos
								}
							)()
						}
					)
				}(__core__unIData(start), __core__unIData(end))
			}(__core__unBData(self))
		}
	}`));
	add(new RawFunc("__helios__common__starts_with", 
	`(self, selfLengthFn) -> {
		(self) -> {
			(prefix) -> {
				(prefix) -> {
					(n, m) -> {
						__core__ifThenElse(
							__core__lessThanInteger(n, m),
							() -> {false},
							() -> {
								__core__equalsByteString(prefix, __core__sliceByteString(0, m, self))
							}
						)()
					}(selfLengthFn(self), __core__lengthOfByteString(prefix))
				}(__core__unBData(prefix))
			}
		}(__core__unBData(self))
	}`));
	add(new RawFunc("__helios__common__ends_with",
	`(self, selfLengthFn) -> {
		(self) -> {
			(suffix) -> {
				(suffix) -> {
					(n, m) -> {
						__core__ifThenElse(
							__core__lessThanInteger(n, m),
							() -> {false},
							() -> {
								__core__equalsByteString(suffix, __core__sliceByteString(__core__subtractInteger(n, m), m, self))
							}
						)()
					}(selfLengthFn(self), __core__lengthOfByteString(suffix))
				}(__core__unBData(suffix))
			}
		}(__core__unBData(self))
	}`));
	add(new RawFunc("__helios__common__fields", 
	`(self) -> {
		__core__sndPair(__core__unConstrData(self))
	}`));
	add(new RawFunc("__helios__common__field_0", 
	`(self) -> {
		__core__headList(__helios__common__fields(self))
	}`));
	add(new RawFunc("__helios__common__fields_after_0",
	`(self) -> {
		__core__tailList(__helios__common__fields(self))
	}`));
	for (let i = 1; i < 20; i++) {
		add(new RawFunc(`__helios__common__field_${i.toString()}`,
	`(self) -> {
		__core__headList(__helios__common__fields_after_${(i-1).toString()}(self))
	}`));
		add(new RawFunc(`__helios__common__fields_after_${i.toString()}`,
	`(self) -> {
		__core__tailList(__helios__common__fields_after_${(i-1).toString()}(self))
	}`));
	}
	add(new RawFunc("__helios__common__tuple_field_0",
	`(self) -> {
		__core__headList(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__common__tuple_fields_after_0", 
	`(self) -> {
		__core__tailList(__core__unListData(self))
	}`));
	for (let i = 1; i < 20; i++) {
		add(new RawFunc(`__helios__common__tuple_field_${i.toString()}`,
	`(self) -> {
		__core__headList(__helios__common__tuple_fields_after_${(i-1).toString()}(self))
	}`));
		add(new RawFunc(`__helios__common__tuple_fields_after_${i.toString()}`,
	`(self) -> {
		__core__tailList(__helios__common__tuple_fields_after_${(i-1).toString()}(self))
	}`));
	}
	add(new RawFunc("__helios__common__list_0", "__core__mkNilData(())"));
	add(new RawFunc("__helios__common__list_1", 
	`(a) -> {
		__core__mkCons(a, __helios__common__list_0)
	}`));
	for (let i = 2; i < 20; i++) {
		/**
		 * @type {string[]}
		 */
		let args = [];

		for (let j = 0; j < i; j++) {
			args.push(`arg${j.toString()}`);
		}

		let woFirst = args.slice()
		let first = assertDefined(woFirst.shift());

		add(new RawFunc(`__helios__common__list_${i.toString()}`,
	`(${args.join(", ")}) -> {
		__core__mkCons(${first}, __helios__common__list_${(i-1).toString()}(${woFirst.join(", ")}))
	}`));
	}
	add(new RawFunc("__helios__common__hash_datum_data", 
	`(data) -> {
		__core__bData(__core__blake2b_256(__core__serialiseData(data)))
	}`));


	// Global builtin functions
	add(new RawFunc("__helios__print", 
	`(msg) -> {
		__core__trace(__helios__common__unStringData(msg), ())
	}`));
	add(new RawFunc("__helios__error",
	`(msg) -> {
		__core__trace(
			__helios__common__unStringData(msg), 
			() -> {
				error("error thrown by user-code")
			}
		)()
	}`));
	add(new RawFunc("__helios__assert",
	`(cond, msg) -> {
		__core__ifThenElse(
			cond,
			() -> {
				()
			},
			() -> {
				__core__trace(
					__helios__common__unStringData(msg),
					() -> {
						error("assert failed")
					}
				)()
			}
		)()
	}`));


	// Int builtins
	addDataFuncs("__helios__int");
	add(new RawFunc("__helios__int____neg",
	`(self) -> {
		__core__iData(__core__multiplyInteger(__core__unIData(self), -1))	
	}`));
	add(new RawFunc("__helios__int____pos", "__helios__common__identity"));
	add(new RawFunc("__helios__int____add",
	`(a, b) -> {
		__core__iData(__core__addInteger(__core__unIData(a), __core__unIData(b)))
	}`));
	add(new RawFunc("__helios__int____sub",
	`(a, b) -> {
		__core__iData(__core__subtractInteger(__core__unIData(a), __core__unIData(b)))
	}`));
	add(new RawFunc("__helios__int____mul",
	`(a, b) -> {
		__core__iData(__core__multiplyInteger(__core__unIData(a), __core__unIData(b)))
	}`));
	add(new RawFunc("__helios__int____div",
	`(a, b) -> {
		__core__iData(__core__divideInteger(__core__unIData(a), __core__unIData(b)))
	}`));
	add(new RawFunc("__helios__int____mod",
	`(a, b) -> {
		__core__iData(__core__modInteger(__core__unIData(a), __core__unIData(b)))
	}`));
	add(new RawFunc("__helios__int____geq",
	`(a, b) -> {
		__helios__common__not(__core__lessThanInteger(__core__unIData(a), __core__unIData(b)))
	}`));
	add(new RawFunc("__helios__int____gt",
	`(a, b) -> {
		__helios__common__not(__core__lessThanEqualsInteger(__core__unIData(a), __core__unIData(b)))
	}`));
	add(new RawFunc("__helios__int____leq",
	`(a, b) -> {
		__core__lessThanEqualsInteger(__core__unIData(a), __core__unIData(b))
	}`));
	add(new RawFunc("__helios__int____lt",
	`(a, b) -> {
		__core__lessThanInteger(__core__unIData(a), __core__unIData(b))
	}`));
	add(new RawFunc("__helios__int__min",
	`(a, b) -> {
		__core__ifThenElse(
			__core__lessThanInteger(__core__unIData(a), __core__unIData(b)),
			a,
			b
		)
	}`));
	add(new RawFunc("__helios__int__max",
	`(a, b) -> {
		__core__ifThenElse(
			__core__lessThanInteger(__core__unIData(a), __core__unIData(b)),
			b,
			a
		)
	}`));
	add(new RawFunc("__helios__int__bound_min",
	`(self) -> {
		(other) -> {
			__helios__int__max(self, other)
		}
	}`));
	add(new RawFunc("__helios__int__bound_max",
	`(self) -> {
		(other) -> {
			__helios__int__min(self, other)
		}
	}`));
	add(new RawFunc("__helios__int__bound",
	`(self) -> {
		(min, max) -> {
			__helios__int__max(__helios__int__min(self, max), min)
		}
	}`));
	add(new RawFunc("__helios__int__abs",
	`(self) -> {
		() -> {
			(i) -> {
				__core__ifThenElse(
					__core__lessThanInteger(i, 0),
					() -> {
						__core__iData(__core__multiplyInteger(i, -1))
					},
					() -> {
						self
					}
				)()
			}(__core__unIData(self))
		}
	}`));
	add(new RawFunc("__helios__int__encode_zigzag",
	`(self) -> {
		() -> {
			(i) -> {
				__core__iData(
					__core__ifThenElse(
						__core__lessThanInteger(i, 0),
						() -> {
							__core__subtractInteger(__core__multiplyInteger(i, -2), 1)
						},
						() -> {
							__core__multiplyInteger(i, 2)
						}
					)()
				)
			}(__core__unIData(self))
		}
	}`));
	add(new RawFunc("__helios__int__decode_zigzag",
	`(self) -> {
		() -> {
			(i) -> {
				__core__ifThenElse(
					__core__lessThanInteger(i, 0),
					() -> {
						error("expected positive int")
					},
					() -> {
						__core__iData(
							__core__ifThenElse(
								__core__equalsInteger(__core__modInteger(i, 2), 0),
								() -> {
									__core__divideInteger(i, 2)
								},
								() -> {
									__core__divideInteger(__core__addInteger(i, 1), -2)
								}
							)()
						)
					}
				)()
			}(__core__unIData(self))
		}
	}`));
	add(new RawFunc("__helios__int__to_bool",
	`(self) -> {
		() -> {
			__core__ifThenElse(__core__equalsInteger(__core__unIData(self), 0), false, true)
		}
	}`));
	add(new RawFunc("__helios__int__to_hex",
	`(self) -> {
		(self) -> {
			() -> {
				(recurse) -> {
					__core__bData(
						__core__ifThenElse(
							__core__lessThanInteger(self, 0),
							() -> {
								__core__consByteString(
									45,
									recurse(recurse, __core__multiplyInteger(self, -1), #)
								)
							},
							() -> {
								recurse(recurse, self, #)
							}
						)()
					)
				}(
					(recurse, self, bytes) -> {
						(digit) -> {
							(bytes) -> {
								__core__ifThenElse(
									__core__lessThanInteger(self, 16),
									() -> {bytes},
									() -> {
										recurse(recurse, __core__divideInteger(self, 16), bytes)
									}
								)()
							}(
								__core__consByteString(
									__core__ifThenElse(
										__core__lessThanInteger(digit, 10), 
										__core__addInteger(digit, 48), 
										__core__addInteger(digit, 87)
									), 
									bytes
								)
							)
						}(__core__modInteger(self, 16))
					}
				)
			}
		}(__core__unIData(self))
	}`));
	add(new RawFunc("__helios__common__BASE58_ALPHABET", "#31323334353637383941424344454647484a4b4c4d4e505152535455565758595a6162636465666768696a6b6d6e6f707172737475767778797a"))
	add(new RawFunc("__helios__int__to_base58",
	`(self) -> {
		(self) -> {
			() -> {
				__core__bData(
					__core__ifThenElse(
						__core__lessThanInteger(self, 0),
						() -> {
							error("expected positive number")
						},
						() -> {
							(recurse) -> {
								recurse(recurse, self, #)
							}(
								(recurse, self, bytes) -> {
									(digit) -> {
										(bytes) -> {
											__core__ifThenElse(
												__core__lessThanInteger(self, 58),
												() -> {
													bytes
												},
												() -> {
													recurse(recurse, __core__divideInteger(self, 58), bytes)
												}
											)()
										}(
											__core__consByteString(
												__core__indexByteString(__helios__common__BASE58_ALPHABET, digit),
												bytes
											)
										)
									}(__core__modInteger(self, 58))
								}
							)
						}
					)()
				)
			}
		}(__core__unIData(self))
	}`));
	add(new RawFunc("__helios__int__BASE58_INVERSE_ALPHABET_1", "#ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000102030405060708ffffffffffff"));
	add(new RawFunc("__helios__int__BASE58_INVERSE_ALPHABET_2", "#ff090a0b0c0d0e0f10ff1112131415ff161718191a1b1c1d1e1f20ffffffffffff2122232425262728292a2bff2c2d2e2f30313233343536373839ffffffffff"));
	add(new RawFunc("__helios__int__invert_base58_char", 
	`(char) -> {
		(digit) -> {
			__core__ifThenElse(
				__core__equalsInteger(digit, 0xff),
				() -> {
					error("invalid base58 character")
				},
				() -> {
					digit
				}
			)()
		}(
			__core__ifThenElse(
				__core__lessThanInteger(char, 64),
				() -> {
					__core__indexByteString(__helios__int__BASE58_INVERSE_ALPHABET_1, char)
				},
				() -> {
					__core__ifThenElse(
						__core__lessThanInteger(char, 128),
						() -> {
							__core__indexByteString(
								__helios__int__BASE58_INVERSE_ALPHABET_2,
								__core__subtractInteger(char, 64)
							)
						},
						() -> {
							0xff
						}
					)()
				}
			)()
		)
	}`));
	add(new RawFunc("__helios__int__from_base58",
	`(str) -> {
		(bytes) -> {
			__core__iData(
				(n) -> {
					(recurse) -> {
						recurse(recurse, 0, 1, __core__subtractInteger(n, 1))
					}(
						(recurse, acc, pow, i) -> {
							__core__ifThenElse(
								__core__equalsInteger(i, -1),
								() -> {
									acc
								},
								() -> {
									(new_acc) -> {
										recurse(recurse, new_acc, __core__multiplyInteger(pow, 58), __core__subtractInteger(i, 1))
									}(
										__core__addInteger(
											acc,
											__core__multiplyInteger(
												__helios__int__invert_base58_char(
													__core__indexByteString(bytes, i)
												),
												pow
											)
										)
									)
								}
							)()
						}
					)
				}(__core__lengthOfByteString(bytes))
			)
		}(__core__unBData(str))
	}`));
	add(new RawFunc("__helios__int__show",
	`(self) -> {
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
	add(new RawFunc("__helios__int__parse_digit",
	`(digit) -> {
		__core__ifThenElse(
			__core__lessThanEqualsInteger(digit, 57),
			() -> {
				__core__ifThenElse(
					__core__lessThanEqualsInteger(48, digit),
					() -> {
						__core__subtractInteger(digit, 48)
					},
					() -> {
						error("not a digit")
					}
				)()
			},
			() -> {
				error("not a digit")
			}
		)()
	}`));
	add(new RawFunc("__helios__int__parse",
	`(string) -> {
		(bytes) -> {
			__core__iData(
				(n, b0) -> {
					(recurse) -> {
						__core__ifThenElse(
							__core__equalsInteger(b0, 48),
							() -> {
								__core__ifThenElse(
									__core__equalsInteger(n, 1),
									() -> {
										0
									},
									() -> {
										error("zero padded integer can't be parsed")
									}
								)()
							},
							() -> {
								__core__ifThenElse(
									__core__equalsInteger(b0, 45),
									() -> {
										__core__ifThenElse(
											__core__equalsInteger(__core__indexByteString(bytes, 1), 48),
											() -> {
												error("-0 not allowed")
											},
											() -> {
												__core__multiplyInteger(
													recurse(recurse, 0, 1),
													-1
												)
											}
										)()
									},
									() -> {
										recurse(recurse, 0, 0)
									}
								)()
							}
						)()
					}(
						(recurse, acc, i) -> {
							__core__ifThenElse(
								__core__equalsInteger(i, n),
								() -> {
									acc
								},
								() -> {
									(new_acc) -> {
										recurse(recurse, new_acc, __core__addInteger(i, 1))
									}(
										__core__addInteger(
											__core__multiplyInteger(acc, 10), 
											__helios__int__parse_digit(__core__indexByteString(bytes, i))
										)
									)
								}
							)()
						}
					)
				}(__core__lengthOfByteString(bytes), __core__indexByteString(bytes, 0))
			)
		}(__core__unBData(string))
	}`));
	add(new RawFunc("__helios__int__from_big_endian",
	`(bytes) -> {
		(bytes) -> {
			__core__iData(
				(n) -> {
					(recurse) -> {
						recurse(recurse, 0, 1, __core__subtractInteger(n, 1))
					}(
						(recurse, acc, pow, i) -> {
							__core__ifThenElse(
								__core__equalsInteger(i, -1),
								() -> {
									acc
								},
								() -> {
									(new_acc) -> {
										recurse(recurse, new_acc, __core__multiplyInteger(pow, 256), __core__subtractInteger(i, 1))
									}(
										__core__addInteger(
											acc,
											__core__multiplyInteger(__core__indexByteString(bytes, i), pow)
										)
									)
								}
							)()
						}
					)
				}(__core__lengthOfByteString(bytes))
			)
		}(__core__unBData(bytes))
	}`));
	add(new RawFunc("__helios__int__from_little_endian", 
	`(bytes) -> {
		(bytes) -> {
			__core__iData(
				(n) -> {
					(recurse) -> {
						recurse(recurse, 0, 1, 0)
					}(
						(recurse, acc, pow, i) -> {
							__core__ifThenElse(
								__core__equalsInteger(i, n),
								() -> {
									acc
								},
								() -> {
									(new_acc) -> {
										recurse(recurse, new_acc, __core__multiplyInteger(pow, 256), __core__addInteger(i, 1))
									}(
										__core__addInteger(
											acc,
											__core__multiplyInteger(__core__indexByteString(bytes, i), pow)
										)
									)
								}
							)()
						}
					)
				}(__core__lengthOfByteString(bytes))
			)
		}(__core__unBData(bytes))
	}`));
	add(new RawFunc("__helios__int__to_big_endian",
	`(self) -> {
		(self) -> {
			() -> {
				__core__ifThenElse(
					__core__lessThanInteger(self, 0),
					() -> {
						error("can't convert negative number to big endian bytearray")
					},
					() -> {
						(recurse) -> {
							__core__bData(recurse(recurse, self, #))
						}(
							(recurse, self, bytes) -> {
								(bytes) -> {
									__core__ifThenElse(
										__core__lessThanInteger(self, 256),
										() -> {
											bytes
										},
										() -> {
											recurse(
												recurse,
												__core__divideInteger(self, 256),
												bytes
											)
										}
									)()
								}(__core__consByteString(self, bytes))
							}
						)
					}
				)()
			}
		}(__core__unIData(self))
	}`));
	add(new RawFunc("__helios__int__to_little_endian",
	`(self) -> {
		(self) -> {
			() -> {
				__core__ifThenElse(
					__core__lessThanInteger(self, 0),
					() -> {
						error("can't convert negative number to big endian bytearray")
					},
					() -> {
						(recurse) -> {
							__core__bData(recurse(recurse, self))
						}(
							(recurse, self) -> {
								__core__consByteString(self,
									__core__ifThenElse(
										__core__lessThanInteger(self, 256),
										() -> {
											#
										},
										() -> {
											recurse(recurse, __core__divideInteger(self, 256))
										}
									)()
								)
							}
						)
					}
				)()
			}
		}(__core__unIData(self))
	}`))


	// Bool builtins
	add(new RawFunc(`__helios__bool____eq`, 
	`(a, b) -> {
		__core__ifThenElse(a, b, __helios__common__not(b))
	}`));
	add(new RawFunc(`__helios__bool____neq`,
	`(a, b) -> {
		__core__ifThenElse(a, __helios__common__not(b), b)
	}`));
	add(new RawFunc(`__helios__bool__serialize`, 
	`(self) -> {
		__helios__common__serialize(__helios__common__boolData(self))
	}`));
	add(new RawFunc(`__helios__bool__from_data`,
	`(data) -> {
		__helios__common__unBoolData(data)
	}`));
	add(new RawFunc("__helios__bool__and",
	`(a, b) -> {
		__core__ifThenElse(
			a(), 
			() -> {b()}, 
			() -> {false}
		)()
	}`));
	add(new RawFunc("__helios__bool__or",
	`(a, b) -> {
		__core__ifThenElse(
			a(), 
			() -> {true},
			() -> {b()}
		)()
	}`));
	add(new RawFunc("__helios__bool____not", "__helios__common__not"));
	add(new RawFunc("__helios__bool__to_int",
	`(self) -> {
		() -> {
			__core__iData(__core__ifThenElse(self, 1, 0))
		}
	}`));
	add(new RawFunc("__helios__bool__show",
	`(self) -> {
		() -> {
			__helios__common__stringData(__core__ifThenElse(self, "true", "false"))
		}
	}`));
	add(new RawFunc("__helios__bool__trace",
	`(self) -> {
		(prefix) -> {
			__core__trace(
				__helios__common__unStringData(
					__helios__string____add(
						prefix,
						__helios__bool__show(self)()
					)
				), 
				self
			)
		}
	}`));


	// String builtins
	addDataFuncs("__helios__string");
	add(new RawFunc("__helios__string____add",
	`(a, b) -> {
		__helios__common__stringData(__core__appendString(__helios__common__unStringData(a), __helios__common__unStringData(b)))	
	}`));
	add(new RawFunc("__helios__string__starts_with", "__helios__bytearray__starts_with"));
	add(new RawFunc("__helios__string__ends_with", "__helios__bytearray__ends_with"));
	add(new RawFunc("__helios__string__encode_utf8",
	`(self) -> {
		(self) -> {
			() -> {
				__core__bData(__core__encodeUtf8(self))
			}
		}(__helios__common__unStringData(self))
	}`));


	// ByteArray builtins
	addDataFuncs("__helios__bytearray");
	add(new RawFunc("__helios__bytearray____add",
	`(a, b) -> {
		__core__bData(__core__appendByteString(__core__unBData(a), __core__unBData(b)))
	}`));
	add(new RawFunc("__helios__bytearray____geq",
	`(a, b) -> {
		__helios__common__not(__core__lessThanByteString(__core__unBData(a), __core__unBData(b)))
	}`));
	add(new RawFunc("__helios__bytearray____gt",
	`(a, b) -> {
		__helios__common__not(__core__lessThanEqualsByteString(__core__unBData(a), __core__unBData(b)))
	}`));
	add(new RawFunc("__helios__bytearray____leq",
	`(a, b) -> {
		__core__lessThanEqualsByteString(__core__unBData(a), __core__unBData(b))
	}`));
	add(new RawFunc("__helios__bytearray____lt",
	`(a, b) -> {
		__core__lessThanByteString(__core__unBData(a), __core__unBData(b))
	}`));
	add(new RawFunc("__helios__bytearray__length",
	`(self) -> {
		__core__iData(__core__lengthOfByteString(__core__unBData(self)))
	}`));
	add(new RawFunc("__helios__bytearray__slice",
	`(self) -> {
		__helios__common__slice_bytearray(self, __core__lengthOfByteString)
	}`));
	add(new RawFunc("__helios__bytearray__starts_with", 
	`(self) -> {
		__helios__common__starts_with(self, __core__lengthOfByteString)
	}`));
	add(new RawFunc("__helios__bytearray__ends_with",
	`(self) -> {
		__helios__common__ends_with(self, __core__lengthOfByteString)
	}`));
	add(new RawFunc("__helios__bytearray__prepend", 
	`(self) -> {
		(byte) -> {
			__core__bData(
				__core__consByteString(
					__core__unIData(byte),
					__core__unBData(self)
				)
			)
		}
	}`));
	add(new RawFunc("__helios__bytearray__sha2",
	`(self) -> {
		(self) -> {
			() -> {
				__core__bData(__core__sha2_256(self))
			}
		}(__core__unBData(self))
	}`));
	add(new RawFunc("__helios__bytearray__sha3",
	`(self) -> {
		(self) -> {
			() -> {
				__core__bData(__core__sha3_256(self))
			}
		}(__core__unBData(self))
	}`));
	add(new RawFunc("__helios__bytearray__blake2b",
	`(self) -> {
		(self) -> {
			() -> {
				__core__bData(__core__blake2b_256(self))
			}
		}(__core__unBData(self))
	}`));
	add(new RawFunc("__helios__bytearray__decode_utf8",
	`(self) -> {
		(self) -> {
			() -> {
				__helios__common__stringData(__core__decodeUtf8(self))
			}
		}(__core__unBData(self))
	}`));
	add(new RawFunc("__helios__bytearray__show",
	`(self) -> {
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
										__core__decodeUtf8((hexBytes) -> {
											__core__ifThenElse(
												__core__equalsInteger(__core__lengthOfByteString(hexBytes), 1),
												__core__consByteString(48, hexBytes),
												hexBytes
											)
										}(__core__unBData(__helios__int__to_hex(__core__iData(__core__indexByteString(self, 0)))()))), 
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
	add(new RawFunc("__helios__bytearray32____eq", "__helios__bytearray____eq"));
	add(new RawFunc("__helios__bytearray32____neq", "__helios__bytearray____neq"));
	add(new RawFunc("__helios__bytearray32__serialize", "__helios__bytearray__serialize"));
	add(new RawFunc("__helios__bytearray32____add", "__helios__bytearray____add"));
	add(new RawFunc("__helios__bytearray32__length", "(_) -> {__core__iData(32)}"));
	add(new RawFunc("__helios__bytearray32__slice", 
	`(self) -> {
		__helios__common__slice_bytearray(self, (self) -> {32})
	}`));
	add(new RawFunc("__helios__bytearray32__starts_with", 
	`(self) -> {
		__helios__common__starts_with(self, (self) -> {32})
	}`));
	add(new RawFunc("__helios__bytearray32__ends_with", 
	`(self) -> {
		__helios__common__ends_with(self, (self) -> {32})
	}`));
	add(new RawFunc("__helios__bytearray32__sha2", "__helios__bytearray__sha2"));
	add(new RawFunc("__helios__bytearray32__sha3", "__helios__bytearray__sha3"));
	add(new RawFunc("__helios__bytearray32__blake2b", "__helios__bytearray__blake2b"));
	add(new RawFunc("__helios__bytearray32__decode_utf8", "__helios__bytearray__decode_utf8"));
	add(new RawFunc("__helios__bytearray32__show", "__helios__bytearray__show"));


	// List builtins
	addDataFuncs("__helios__list");
	add(new RawFunc("__helios__list__new",
	`(n, fn) -> {
		(n) -> {
			(recurse) -> {
				__core__listData(recurse(recurse, 0))
			}(
				(recurse, i) -> {
					__core__ifThenElse(
						__core__lessThanInteger(i, n),
						() -> {__core__mkCons(fn(__core__iData(i)), recurse(recurse, __core__addInteger(i, 1)))},
						() -> {__core__mkNilData(())}
					)()
				}
			)
		}(__core__unIData(n))
	}`));
	add(new RawFunc("__helios__list__new_const",
	`(n, item) -> {
		__helios__list__new(n, (i) -> {item})
	}`));
	add(new RawFunc("__helios__list____add",
	`(a, b) -> {
		__core__listData(__helios__common__concat(__core__unListData(a), __core__unListData(b)))
	}`));
	add(new RawFunc("__helios__list__length",
	`(self) -> {
		__helios__common__length(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__list__head",
	`(self) -> {
		__core__headList(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__list__tail",
	`(self) -> {
		__core__listData(__core__tailList(__core__unListData(self)))
	}`));
	add(new RawFunc("__helios__list__is_empty",
	`(self) -> {
		(self) -> {
			() -> {
				__core__nullList(self)
			}
		}(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__list__get",
	`(self) -> {
		(self) -> {
			(index) -> {
				(recurse) -> {
					recurse(recurse, self, __core__unIData(index))
				}(
					(recurse, self, index) -> {
						__core__chooseList(
							self, 
							() -> {error("index out of range")}, 
							() -> {__core__ifThenElse(
								__core__lessThanInteger(index, 0), 
								() -> {error("index out of range")}, 
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
	add(new RawFunc("__helios__list__get_singleton",
	`(self) -> {
		(self) -> {
			() -> {
				__core__chooseUnit(
					__helios__assert(
						__core__nullList(__core__tailList(self)),
						__helios__common__stringData("not a singleton list")
					),
					__core__headList(self)
				)
			}
		}(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__list__any",
	`(self) -> {
		(self) -> {
			(fn) -> {
				__helios__common__any(self, fn)
			}
		}(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__list__all",
	`(self) -> {
		(self) -> {
			(fn) -> {
				__helios__common__all(self, fn)
			}
		}(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__list__prepend",
	`(self) -> {
		(self) -> {
			(item) -> {
				__core__listData(__core__mkCons(item, self))
			}
		}(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__list__find",
	`(self) -> {
		(self) -> {
			(fn) -> {
				__helios__common__find(self, fn, __helios__common__identity)
			}
		}(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__list__find_safe",
	`(self) -> {
		(self) -> {
			(fn) -> {
				__helios__common__find_safe(self, fn, __helios__common__identity)
			}
		}(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__list__filter",
	`(self) -> {
		(self) -> {
			(fn) -> {
				__core__listData(__helios__common__filter_list(self, fn))
			}
		}(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__list__for_each",
	`(self) -> {
		(self) -> {
			(fn) -> {
				(recurse) -> {
					recurse(recurse, self)
				}(
					(recurse, lst) -> {
						__core__chooseList(
							lst,
							() -> {
								()
							},
							() -> {
								__core__chooseUnit(
									fn(__core__headList(lst)),
									recurse(recurse, __core__tailList(lst))
								)
							}
						)()
					}
				)
			}
		}(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__list__fold",
	`(self) -> {
		(self) -> {
			(fn, z) -> {
				__helios__common__fold(self, fn, z)
			}
		}(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__list__fold_lazy",
	`(self) -> {
		(self) -> {
			(fn, z) -> {
				__helios__common__fold_lazy(self, fn, z)
			}
		}(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__list__map",
	`(self) -> {
		(self) -> {
			(fn) -> {
				__core__listData(__helios__common__map(self, fn, __core__mkNilData(())))
			}
		}(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__list__map_to_bool",
	`(self) -> {
		(fn) -> {
			__helios__list__map(self)(
				(item) -> {
					__helios__common__boolData(fn(item))
				}
			)
		}
	}`));
	add(new RawFunc("__helios__list__sort",
	`(self) -> {
		(self) -> {
			(comp) -> {
				__core__listData(__helios__common__sort(self, comp))
			}
		}(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__boollist__new", 
	`(n, fn) -> {
		__helios__list__new(
			n, 
			(i) -> {
				__helios__common__boolData(fn(i))
			}
		)
	}`));
	add(new RawFunc("__helios__boollist__new_const", 
	`(n, item) -> {
		__helios__list__new_const(n, __helios__common__boolData(item))
	}`));
	add(new RawFunc("__helios__boollist____eq", "__helios__list____eq"));
	add(new RawFunc("__helios__boollist____neq", "__helios__list____neq"));
	add(new RawFunc("__helios__boollist__serialize", "__helios__list__serialize"));
	add(new RawFunc("__helios__boollist__from_data", "__helios__list__from_data"));
	add(new RawFunc("__helios__boollist____add", "__helios__list____add"));
	add(new RawFunc("__helios__boollist__length", "__helios__list__length"));
	add(new RawFunc("__helios__boollist__head", 
	`(self) -> {
		__helios__common__unBoolData(__helios__list__head(self))
	}`));
	add(new RawFunc("__helios__boollist__tail", "__helios__list__tail"));
	add(new RawFunc("__helios__boollist__is_empty", "__helios__list__is_empty"));
	add(new RawFunc("__helios__boollist__get", 
	`(self) -> {
		(index) -> {
			__helios__common__unBoolData(__helios__list__get(self)(index))
		}
	}`));
	add(new RawFunc("__helios__boollist__get_singleton",
	`(self) -> {
		() -> {
			__helios__common__unBoolData(__helios__list__get_singleton(self)())
		}
	}`));
	add(new RawFunc("__helios__boollist__any", 
	`(self) -> {
		(fn) -> {
			__helios__list__any(self)(
				(item) -> {
					fn(__helios__common__unBoolData(item))
				}
			)
		}
	}`));
	add(new RawFunc("__helios__boollist__all",
	`(self) -> {
		(fn) -> {
			__helios__list__all(self)(
				(item) -> {
					fn(__helios__common__unBoolData(item))
				}
			)
		}
	}`));
	add(new RawFunc("__helios__boollist__prepend",
	`(self) -> {
		(item) -> {
			__helios__list__prepend(self)(__helios__common__boolData(item))
		}
	}`));
	add(new RawFunc("__helios__boollist__find",
	`(self) -> {
		(fn) -> {
			__helios__common__unBoolData(
				__helios__list__find(self)(
					(item) -> {
						fn(__helios__common__unBoolData(item))
					}
				)
			)
		}
	}`));
	add(new RawFunc("__helios__boollist__find_safe",
	`(self) -> {
		(fn) -> {
			__helios__list__find_safe(self)(
				(item) -> {
					fn(__helios__common__unBoolData(item))
				}
			)
		}
	}`));
	add(new RawFunc("__helios__boollist__filter",
	`(self) -> {
		(fn) -> {
			__helios__list__filter(self)(
				(item) -> {
					fn(__helios__common__unBoolData(item))
				}
			)
		}
	}`));
	add(new RawFunc("__helios__boollist__for_each",
	`(self) -> {
		(fn) -> {
			__helios__list__for_each(self)(
				(item) -> {
					fn(__helios__common__unBoolData(item))
				}
			)
		}
	}`));
	add(new RawFunc("__helios__boollist__fold",
	`(self) -> {
		(fn, z) -> {
			__helios__list__fold(self)(
				(prev, item) -> {
					fn(prev, __helios__common__unBoolData(item))
				},
				z
			)
		}
	}`));
	add(new RawFunc("__helios__boollist__fold_lazy",
	`(self) -> {
		(fn, z) -> {
			__helios__list__fold_lazy(self)(
				(item, next) -> {
					fn(__helios__common__unBoolData(item), next)
				},
				z
			)
		}
	}`));
	add(new RawFunc("__helios__boollist__map",
	`(self) -> {
		(fn) -> {
			__helios__list__map(self)(
				(item) -> {
					fn(__helios__common__unBoolData(item))
				}
			)
		}
	}`));
	add(new RawFunc("__helios__boollist__map_to_bool",
	`(self) -> {
		(fn) -> {
			__helios__list__map(self)(
				(item) -> {
					__helios__common__boolData(fn(__helios__common__unBoolData(item)))
				}
			)
		}
	}`));
	add(new RawFunc("__helios__boollist__sort",
	`(self) -> {
		(self) -> {
			(comp) -> {
				(comp) -> {
					__core__listData(__helios__common__sort(self, comp))
				}(
					(a, b) -> {
						comp(__helios__common__unBoolData(a), __helios__common__unBoolData(b))
					}
				)
			}
		}(__core__unListData(self))
	}`));


	// Map builtins
	addDataFuncs("__helios__map");
	add(new RawFunc("__helios__map____add",
	`(a, b) -> {
		__core__mapData(__helios__common__concat(__core__unMapData(a), __core__unMapData(b)))
	}`));
	add(new RawFunc("__helios__map__prepend",
	`(self) -> {
		(self) -> {
			(key, value) -> {
				__core__mapData(__core__mkCons(__core__mkPairData(key, value), self))
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__map__head",
	`(self) -> {
		(head) -> {
			() -> {
				(callback) -> {
					callback(__core__fstPair(head), __core__sndPair(head))
				}
			}
		}(__core__headList(__core__unMapData(self)))
	}`));
	add(new RawFunc("__helios__map__head_key",
	`(self) -> {
		__core__fstPair(__core__headList(__core__unMapData(self)))
	}`));
	add(new RawFunc("__helios__map__head_value",
	`(self) -> {
		__core__sndPair(__core__headList(__core__unMapData(self)))
	}`));
	add(new RawFunc("__helios__map__length",
	`(self) -> {
		__helios__common__length(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__map__tail",
	`(self) -> {
		__core__mapData(__core__tailList(__core__unMapData(self)))
	}`));
	add(new RawFunc("__helios__map__is_empty",
	`(self) -> {
		(self) -> {
			() -> {
				__core__nullList(self)
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__map__get",
	`(self) -> {
		(key) -> {
			__helios__common__map_get(self, key, (x) -> {x}, () -> {error("key not found")})
		}
	}`));
	add(new RawFunc("__helios__map__get_safe",
	`(self) -> {
		(key) -> {
			__helios__common__map_get(
				self, 
				key, 
				(x) -> {
					__core__constrData(0, __helios__common__list_1(x))
				}, 
				() -> {
					__core__constrData(1, __helios__common__list_0)
				}
			)
		}
	}`));
	add(new RawFunc("__helios__map__all",
	`(self) -> {
		(self) -> {
			(fn) -> {
				(fn) -> {
					__helios__common__all(self, fn)
				}(
					(pair) -> {
						fn(__core__fstPair(pair), __core__sndPair(pair))
					}
				)
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__map__any",
	`(self) -> {
		(self) -> {
			(fn) -> {
				(fn) -> {
					__helios__common__any(self, fn)
				}(
					(pair) -> {
						fn(__core__fstPair(pair), __core__sndPair(pair))
					}
				)
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__map__delete",
	`(self) -> {
		(self) -> {
			(key) -> {
				(recurse) -> {
					__core__mapData(recurse(recurse, self))
				}(
					(recurse, self) -> {
						__core__chooseList(
							self,
							() -> {self},
							() -> {
								(head, tail) -> {
									__core__ifThenElse(
										__core__equalsData(key, __core__fstPair(head)),
										() -> {recurse(recurse, tail)},
										() -> {__core__mkCons(head, recurse(recurse, tail))}
									)()
								}(__core__headList(self), __core__tailList(self))
							}
						)()
					}
				)
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__map__filter",
	`(self) -> {
		(self) -> {
			(fn) -> {
				(fn) -> {
					__core__mapData(__helios__common__filter_map(self, fn))
				}(
					(pair) -> {
						fn(__core__fstPair(pair), __core__sndPair(pair))
					}
				)
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__map__find",
	`(self) -> {
		(self) -> {
			(fn) -> {
				(recurse) -> {
					recurse(recurse, self, fn)
				}(
					(recurse, self, fn) -> {
						__core__chooseList(
							self, 
							() -> {error("not found")}, 
							() -> {
								(head) -> {
									__core__ifThenElse(
										fn(__core__fstPair(head), __core__sndPair(head)), 
										() -> {
											(callback) -> {
												callback(__core__fstPair(head), __core__sndPair(head))
											}
										}, 
										() -> {recurse(recurse, __core__tailList(self), fn)}
									)()
								}(__core__headList(self))
							}
						)()
					}
				)
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__map__find_safe",
	`(self) -> {
		(self) -> {
			(fn) -> {
				(recurse) -> {
					recurse(recurse, self, fn)
				}(
					(recurse, self, fn) -> {
						__core__chooseList(
							self, 
							() -> {
								(callback) -> {
									callback(() -> {error("not found")}, false)
								}
							}, 
							() -> {
								(head) -> {
									__core__ifThenElse(
										fn(__core__fstPair(head), __core__sndPair(head)), 
										() -> {
											(callback) -> {
												callback(
													() -> {
														(callback) -> {
															callback(__core__fstPair(head), __core__sndPair(head))
														}
													},
													true
												)
											}
										}, 
										() -> {recurse(recurse, __core__tailList(self), fn)}
									)()
								}(__core__headList(self))
							}
						)()
					}
				)
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__map__find_key",
	`(self) -> {
		(self) -> {
			(fn) -> {
				(fn) -> {
					__helios__common__find(
						self, 
						fn,
						__core__fstPair
					)
				}(
					(pair) -> {
						fn(__core__fstPair(pair))
					}
				)
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__map__find_key_safe",
	`(self) -> {
		(self) -> {
			(fn) -> {
				(fn) -> {
					__helios__common__find_safe(
						self,
						fn,
						__core__fstPair
					)
				}(
					(pair) -> {
						fn(__core__fstPair(pair))
					}
				)
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__map__find_value",
	`(self) -> {
		(self) -> {
			(fn) -> {
				(fn) -> {
					__helios__common__find(
						self, 
						fn,
						__core__sndPair
					)
				}(
					(pair) -> {
						fn(__core__sndPair(pair))
					}
				)
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__map__find_value_safe",
	`(self) -> {
		(self) -> {
			(fn) -> {
				(fn) -> {
					__helios__common__find_safe(
						self,
						fn,
						__core__sndPair
					)
				}(
					(pair) -> {
						fn(__core__sndPair(pair))
					}
				)
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__map__map",
	`(self) -> {
		(self) -> {
			(fn) -> {
				(fn) -> {
					__core__mapData(__helios__common__map(self, fn, __core__mkNilPairData(())))
				}(
					(pair) -> {
						(mapped_pair) -> {
							mapped_pair(
								(key, value) -> {
									__core__mkPairData(key, value)
								}
							)
						}(fn(__core__fstPair(pair), __core__sndPair(pair)))
					}
				)
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__map__map_to_bool",
	`(self) -> {
		(self) -> {
			(fn) -> {
				(fn) -> {
					__core__mapData(__helios__common__map(self, fn, __core__mkNilPairData(())))
				}(
					(pair) -> {
						(mapped_pair) -> {
							mapped_pair(
								(key, value) -> {
									__core__mkPairData(key, __helios__common__boolData(value))
								}
							)
						}(fn(__core__fstPair(pair), __core__sndPair(pair)))
					}
				)
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__map__fold",
	`(self) -> {
		(self) -> {
			(fn, z) -> {
				(fn) -> {
					__helios__common__fold(self, fn, z)
				}(
					(z, pair) -> {
						fn(z, __core__fstPair(pair), __core__sndPair(pair))
					}
				)
				
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__map__fold_lazy",
	`(self) -> {
		(self) -> {
			(fn, z) -> {
				(fn) -> {
					__helios__common__fold_lazy(self, fn, z)
				}(
					(pair, next) -> {
						fn(__core__fstPair(pair), __core__sndPair(pair), next)
					}
				)
				
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__map__for_each",
	`(self) -> {
		(self) -> {
			(fn) -> {
				(recurse) -> {
					recurse(recurse, self)
				}(
					(recurse, map) -> {
						__core__chooseList(
							map,
							() -> {
								()
							},
							() -> {
								(head) -> {
									__core__chooseUnit(
										fn(__core__fstPair(head), __core__sndPair(head)),
										recurse(recurse, __core__tailList(map))
									)
								}(__core__headList(map))
							}
						)()
					}
				)
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__map__set", 
	`(self) -> {
		(self) -> {
			(key, value) -> {
				(recurse) -> {
					__core__mapData(recurse(recurse, self))
				}(
					(recurse, self) -> {
						__core__chooseList(
							self,
							() -> {
								__core__mkCons(__core__mkPairData(key, value), __core__mkNilPairData(()))
							},
							() -> {
								(head, tail) -> {
									__core__ifThenElse(
										__core__equalsData(key, __core__fstPair(head)),
										() -> {
											__core__mkCons(__core__mkPairData(key, value), tail)
										},
										() -> {
											__core__mkCons(head, recurse(recurse, tail))
										}
									)()
								}(__core__headList(self), __core__tailList(self))
							}
						)()
					}
				)
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__map__sort",
	`(self) -> {
		(self) -> {
			(comp) -> {
				(comp) -> {
					__core__mapData(__helios__common__sort(self, comp))
				}(
					(a, b) -> {
						comp(__core__fstPair(a), __core__sndPair(a), __core__fstPair(b), __core__sndPair(b))
					}
				)
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__boolmap____eq", "__helios__map____eq"));
	add(new RawFunc("__helios__boolmap____neq", "__helios__map____neq"));
	add(new RawFunc("__helios__boolmap__serialize", "__helios__map__serialize"));
	add(new RawFunc("__helios__boolmap__from_data", "__helios__map__from_data"));
	add(new RawFunc("__helios__boolmap____add", "__helios__map____add"));
	add(new RawFunc("__helios__boolmap__prepend",
	`(self) -> {
		(self) -> {
			(key, value) -> {
				__core__mapData(
					__core__mkCons(
						__core__mkPairData(key, __helios__common__boolData(value)),
						self
					)
				)
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__boolmap__head",
	`(self) -> {
		(head) -> {
			() -> {
				(callback) -> {
					callback(__core__fstPair(head), __helios__common__unBoolData(__core__sndPair(head)))
				}
			}
		}(__core__headList(__core__unMapData(self)))
	}`));
	add(new RawFunc("__helios__boolmap__head_key", "__helios__map__head_key"));
	add(new RawFunc("__helios__boolmap__head_value",
	`(self) -> {
		__helios__common__unBoolData(__helios__map__head_value(self))
	}`));
	add(new RawFunc("__helios__boolmap__length", "__helios__map__length"));
	add(new RawFunc("__helios__boolmap__tail", "__helios__map__tail"));
	add(new RawFunc("__helios__boolmap__is_empty", "__helios__map__is_empty"));
	add(new RawFunc("__helios__boolmap__get", 
	`(self) -> {
		(key) -> {
			__helios__common__unBoolData(__helios__map__get(self)(key))
		}
	}`));
	add(new RawFunc("__helios__boolmap__all",
	`(self) -> {
		(fn) -> {
			__helios__map__all(self)(
				(key, value) -> {
					fn(key, __helios__common__unBoolData(value))
				}
			)
		}
	}`));
	add(new RawFunc("__helios__boolmap__any",
	`(self) -> {
		(fn) -> {
			__helios__map__any(self)(
				(key, value) -> {
					fn(key, __helios__common__unBoolData(value))
				}
			)
		}
	}`));
	add(new RawFunc("__helios__boolmap__delete", "__helios__map__delete"));
	add(new RawFunc("__helios__boolmap__filter",
	`(self) -> {
		(fn) -> {
			__helios__map__filter(self)(
				(key, value) -> {
					fn(key, __helios__common__unBoolData(value))
				}
			)
		}
	}`));
	add(new RawFunc("__helios__boolmap__find",
	`(self) -> {
		(fn) -> {
			(fn) -> {
				(result) -> {
					(callback) -> {
						result((key, value) -> {
							callback(key, __helios__common__unBoolData(value))
						})
					}
				}(__helios__map__find(self)(fn))
			}(
				(fst, snd) -> {
					fn(fst, __helios__common__unBoolData(snd))
				}
			)
		}
	}`));
	add(new RawFunc("__helios__boolmap__find_safe",
	`(self) -> {
		(fn) -> {
			(fn) -> {
				(resultok) -> {
					(callback) -> {
						resultok((result, ok) -> {
							callback(
								() -> {
									(inner_callback) -> {
										result()(
											(key, value) -> {
												inner_callback(key, __helios__common__unBoolData(value))
											}
										)
									}
								}, 
								ok
							)
						})
					}
				}(__helios__map__find_safe(self)(fn))
			}(
				(fst, snd) -> {
					fn(fst, __helios__common__unBoolData(snd))
				}
			)
		}
	}`));
	add(new RawFunc("__helios__boolmap__find_key", "__helios__map__find_key"));
	add(new RawFunc("__helios__boolmap__find_key_safe", "__helios__map__find_key_safe"));
	add(new RawFunc("__helios__boolmap__find_value",
	`(self) -> {
		(self) -> {
			(fn) -> {
				(fn) -> {
					__helios__common__find(
						self, 
						fn,
						(result) -> {
							__helios__common__unBoolData(__core__sndPair(result))
						}	
					)
				}(
					(pair) -> {
						fn(__helios__common__unBoolData(__core__sndPair(pair)))
					}
				)
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__boolmap__find_value_safe",
	`(self) -> {
		(self) -> {
			(fn) -> {
				(fn) -> {
					__helios__common__find_safe(
						self, 
						fn,
						(result) -> {
							__core__sndPair(result)
						}	
					)
				}(
					(pair) -> {
						fn(__helios__common__unBoolData(__core__sndPair(pair)))
					}
				)
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__boolmap__map",
	`(self) -> {
		(self) -> {
			(fn) -> {
				(fn) -> {
					__core__mapData(__helios__common__map(self, fn, __core__mkNilPairData(())))
				}(
					(pair) -> {
						(mapped_pair) -> {
							mapped_pair(
								(key, value) -> {
									__core__mkPairData(key, value)
								}
							)
						}(fn(__core__fstPair(pair), __helios__common__unBoolData(__core__sndPair(pair))))
					}
				)
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__boolmap__map_to_bool",
	`(self) -> {
		(self) -> {
			(fn) -> {
				(fn) -> {
					__core__mapData(__helios__common__map(self, fn, __core__mkNilPairData(())))
				}(
					(pair) -> {
						(mapped_pair) -> {
							mapped_pair(
								(key, value) -> {
									__core__mkPairData(key, __helios__common__boolData(value))
								}
							)
						}(fn(__core__fstPair(pair), __helios__common__unBoolData(__core__sndPair(pair))))
					}
				)
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__boolmap__fold",
	`(self) -> {
		(fn, z) -> {
			__helios__map__fold(self)(
				(prev, key, value) -> {
					fn(prev, key, __helios__common__unBoolData(value))
				},
				z
			)
		}
	}`));
	add(new RawFunc("__helios__boolmap__fold_lazy",
	`(self) -> {
		(fn, z) -> {
			__helios__map__fold_lazy(self)(
				(key, value, next) -> {
					fn(key, __helios__common__unBoolData(value), next)
				},
				z
			)
		}
	}`));
	add(new RawFunc("__helios__boolmap__for_each",
	`(self) -> {
		(fn) -> {
			__helios__map__for_each(self)(
				(key, value) -> {
					fn(key, __helios__common__unBoolData(value))
				}
			)
		}
	}`));
	add(new RawFunc("__helios__boolmap__set", 
	`(self) -> {
		(key, value) -> {
			__helios__map__set(self)(key, __helios__common__boolData(value))
		}
	}`));
	add(new RawFunc("__helios__boolmap__sort",
	`(self) -> {
		(comp) -> {
			(comp) -> {
				__helios__map__sort(self)(comp)
			}(
				(ak, av, bk, bv) -> {
					comp(ak, __helios__common__unBoolData(av), bk, __helios__common__unBoolData(bv))
				}
			)
		}
	}`));


	// Option[T] builtins
	addDataFuncs("__helios__option");
	add(new RawFunc("__helios__option__map", 
	`(self) -> {
		(fn) -> {
			(pair) -> {
				__core__ifThenElse(
					__core__equalsInteger(__core__fstPair(pair), 0),
					() -> {
						__helios__option__some__new(fn(__core__headList(__core__sndPair(pair))))
					},
					() -> {
						__helios__option__none__new()
					}
				)()
			}(__core__unConstrData(self))
		}
	}`));
	add(new RawFunc("__helios__option__map_to_bool",
	`(self) -> {
		(fn) -> {
			(fn) -> {
				__helios__option__map(self)(fn)
			}(
				(data) -> {
					__helios__common__boolData(fn(data))
				}
			)
		}
	}`));
	add(new RawFunc("__helios__option__unwrap", 
	`(self) -> {
		() -> {
			__helios__common__field_0(self)
		}
	}`));


	// Option[T]::Some
	addEnumDataFuncs("__helios__option__some");
	add(new RawFunc("__helios__option__some__new",
	`(data) -> {
		__core__constrData(0, __helios__common__list_1(data))
	}`));
	add(new RawFunc("__helios__option__some__cast",
	`(data) -> {
		__helios__common__assert_constr_index(data, 0)
	}`));
	add(new RawFunc("__helios__option__some__some", "__helios__common__field_0"));
	

	// Option[T]::None
	addEnumDataFuncs("__helios__option__none");
	add(new RawFunc("__helios__option__none__new",
	`() -> {
		__core__constrData(1, __helios__common__list_0)
	}`));
	add(new RawFunc("__helios__option__none__cast",
	`(data) -> {
		__helios__common__assert_constr_index(data, 1)
	}`));


	// Option[Bool]
	add(new RawFunc("__helios__booloption____eq", "__helios__option____eq"));
	add(new RawFunc("__helios__booloption____neq", "__helios__option____neq"));
	add(new RawFunc("__helios__booloption__serialize", "__helios__option__serialize"));
	add(new RawFunc("__helios__booloption__from_data", "__helios__option__from_data"));
	add(new RawFunc("__helios__booloption__unwrap", `
	(self) -> {
		() -> {
			__helios__common__unBoolData(__helios__common__field_0(self))
		}
	}`));
	add(new RawFunc("__helios__booloption__map",
	`(self) -> {
		(fn) -> {
			(fn) -> {
				__helios__option__map(self)(fn)
			}(
				(data) -> {
					fn(__helios__common__unBoolData(data))
				}
			)
		}
	}`));
	add(new RawFunc("__helios__booloption__map_to_bool",
	`(self) -> {
		(fn) -> {
			(fn) -> {
				__helios__option__map(self)(fn)
			}(
				(data) -> {
					__helios__common__boolData(fn(__helios__common__unBoolData(data)))
				}
			)
		}
	}`));

	
	// Option[Bool]::Some
	add(new RawFunc("__helios__booloption__some____eq", "__helios__option__some____eq"));
	add(new RawFunc("__helios__booloption__some____neq", "__helios__option__some____neq"));
	add(new RawFunc("__helios__booloption__some__serialize", "__helios__option__some__serialize"));
	add(new RawFunc("__helios__booloption__some__new", 
	`(b) -> {
		__helios__option__some__new(__helios__common__boolData(b))
	}`));
	add(new RawFunc("__helios__booloption__some__cast", "__helios__option__some__cast"));
	add(new RawFunc("__helios__booloption__some__some", 
	`(self) -> {
		__helios__common__unBoolData(__helios__option__some__some(self))
	}`));

	
	// Option[Bool]::None
	add(new RawFunc("__helios__booloption__none____eq",      "__helios__option__none____eq"));
	add(new RawFunc("__helios__booloption__none____neq",     "__helios__option__none____neq"));
	add(new RawFunc("__helios__booloption__none__serialize", "__helios__option__none__serialize"));
	add(new RawFunc("__helios__booloption__none__new",       "__helios__option__none__new"));
	add(new RawFunc("__helios__booloption__none__cast",      "__helios__option__none__cast"));

	
	// Hash builtins
	addDataFuncs("__helios__hash");
	add(new RawFunc("__helios__hash____lt", "__helios__bytearray____lt"));
	add(new RawFunc("__helios__hash____leq", "__helios__bytearray____leq"));
	add(new RawFunc("__helios__hash____gt", "__helios__bytearray____gt"));
	add(new RawFunc("__helios__hash____geq", "__helios__bytearray____geq"));
	add(new RawFunc("__helios__hash__new", `__helios__common__identity`));
	add(new RawFunc("__helios__hash__show", "__helios__bytearray__show"));
	add(new RawFunc("__helios__hash__CURRENT", "__core__bData(#0000000000000000000000000000000000000000000000000000000000000000)"));
	add(new RawFunc("__helios__hash__from_script_hash", "__helios__common__identity"));

	
	// ScriptHash builtin
	addDataFuncs("__helios__scripthash");


	// PubKey builtin
	addDataFuncs("__helios__pubkey");
	add(new RawFunc("__helios__pubkey__new", "__helios__common__identity"));
	add(new RawFunc("__helios__pubkey__show", "__helios__bytearray__show"));
	add(new RawFunc("__helios__pubkey__verify", 
	`(self) -> {
		(message, signature) -> {
			__core__verifyEd25519Signature(__core__unBData(self), __core__unBData(message), __core__unBData(signature))
		}
	}`));


	// ScriptContext builtins
	addDataFuncs("__helios__scriptcontext");
	add(new RawFunc("__helios__scriptcontext__new_spending",
	`(tx, output_id) -> {
		__core__constrData(0, __helios__common__list_2(
			tx,
			__core__constrData(1, __helios__common__list_1(output_id))
		))
	}`));
	add(new RawFunc("__helios__scriptcontext__new_minting",
	`(tx, mph) -> {
		__core__constrData(0, __helios__common__list_2(
			tx,
			__core__constrData(0, __helios__common__list_1(mph))
		))
	}`));
	add(new RawFunc("__helios__scriptcontext__new_rewarding",
	`(tx, cred) -> {
		__core__constrData(0, __helios__common__list_2(
			tx,
			__core__constrData(2, __helios__common__list_1(cred))
		))
	}`));
	add(new RawFunc("__helios__scriptcontext__new_certifying",
	`(tx, dcert) -> {
		__core__constrData(0, __helios__common__list_2(
			tx,
			__core__constrData(3, __helios__common__list_1(dcert))
		))
	}`));
	add(new RawFunc("__helios__scriptcontext__tx", "__helios__common__field_0"));
	add(new RawFunc("__helios__scriptcontext__purpose", "__helios__common__field_1"));
	add(new RawFunc("__helios__scriptcontext__get_current_input",
	`(self) -> {
		() -> {
			(id) -> {
				__helios__list__find(__helios__tx__inputs(__helios__scriptcontext__tx(self)))(
					(input) -> {
						__core__equalsData(__helios__txinput__output_id(input), id)
					}
				)
			}(__helios__scriptcontext__get_spending_purpose_output_id(self)())
		}
	}`));
	add(new RawFunc("__helios__scriptcontext__get_cont_outputs",
	`(self) -> {
		() -> {
			(vh) -> {
				(outputs) -> {
					__helios__list__filter(outputs)(
						(output) -> {
							(credential) -> {
								(pair) -> {
									__core__ifThenElse(
										__core__equalsInteger(__core__fstPair(pair), 0),
										() -> {
											false
										},
										() -> {
											__core__equalsData(__core__headList(__core__sndPair(pair)), vh)
										}
									)()
								}(__core__unConstrData(credential))
							}(__helios__address__credential(__helios__txoutput__address(output)))
						}
					)
				}(__helios__tx__outputs(__helios__scriptcontext__tx(self)))
			}(__helios__scriptcontext__get_current_validator_hash(self)())
		}
	}`));
	add(new RawFunc("__helios__scriptcontext__get_spending_purpose_output_id",
	`(self) -> {
		() -> {
			__helios__common__field_0(__helios__common__field_1(self))
		}
	}`));
	add(new RawFunc("__helios__scriptcontext__get_current_validator_hash",
	`(self) -> {
		() -> {
			__helios__credential__validator__hash(
				__helios__credential__validator__cast(
					__helios__address__credential(
						__helios__txoutput__address(
							__helios__txinput__output(
								__helios__scriptcontext__get_current_input(self)()
							)
						)
					)
				)
			)
		}
	}`));
	add(new RawFunc("__helios__scriptcontext__get_current_minting_policy_hash", "__helios__scriptcontext__get_spending_purpose_output_id"));
	add(new RawFunc("__helios__scriptcontext__get_staking_purpose", 
	`(self) -> {
		() -> {
			__helios__scriptcontext__purpose(self)
		}
	}`));
	add(new RawFunc("__helios__scriptcontext__get_script_purpose", 
	`(self) -> {
		() -> {
			__helios__scriptcontext__purpose(self)
		}
	}`));


	// StakingPurpose builtins
	addDataFuncs("__helios__stakingpurpose");


	// StakingPurpose::Rewarding builtins
	addEnumDataFuncs("__helios__stakingpurpose__rewarding");
	add(new RawFunc("__helios__stakingpurpose__rewarding__credential", "__helios__common__field_0"));

	
	// StakingPurpose::Certifying builtins
	addEnumDataFuncs("__helios__stakingpurpose__certifying");
	add(new RawFunc("__helios__stakingpurpose__certifying__dcert", "__helios__common__field_0"));


	// ScriptPurpose builtins
	addDataFuncs("__helios__scriptpurpose");
	add(new RawFunc("__helios__scriptpurpose__new_minting",
	`(mintingPolicyHash) -> {
		__core__constrData(0, __helios__common__list_1(mintingPolicyHash))
	}`));
	add(new RawFunc("__helios__scriptpurpose__new_spending",
	`(output_id) -> {
		__core__constrData(1, __helios__common__list_1(output_id))
	}`));
	add(new RawFunc("__helios__scriptpurpose__new_rewarding",
	`(cred) -> {
		__core__constrData(2, __helios__common__list_1(cred))
	}`));
	add(new RawFunc("__helios__scriptpurpose__new_certifying",
	`(dcert) -> {
		__core__constrData(3, __helios__common__list_1(dcert))
	}`));


	// ScriptPurpose::Minting builtins
	addEnumDataFuncs("__helios__scriptpurpose__minting");
	add(new RawFunc("__helios__scriptpurpose__minting__policy_hash", "__helios__common__field_0"));

	
	// ScriptPurpose::Spending builtins
	addEnumDataFuncs("__helios__scriptpurpose__spending");
	add(new RawFunc("__helios__scriptpurpose__spending__output_id", "__helios__common__field_0"));

	
	// ScriptPurpose::Rewarding builtins
	addEnumDataFuncs("__helios__scriptpurpose__rewarding");
	add(new RawFunc("__helios__scriptpurpose__rewarding__credential", "__helios__common__field_0"));

	
	// ScriptPurpose::Certifying builtins
	addEnumDataFuncs("__helios__scriptpurpose__certifying");
	add(new RawFunc("__helios__scriptpurpose__certifying__dcert", "__helios__common__field_0"));


	// DCert builtins
	addDataFuncs("__helios__dcert");
	add(new RawFunc("__helios__dcert__new_register",
	`(cred) -> {
		__core__constrData(0, __helios__common__list_1(cred))
	}`));
	add(new RawFunc("__helios__dcert__new_deregister",
	`(cred) -> {
		__core__constrData(1, __helios__common__list_1(cred))
	}`));
	add(new RawFunc("__helios__dcert__new_delegate",
	`(cred, pool_id) -> {
		__core__constrData(2, __helios__common__list_2(cred, pool_id))
	}`));
	add(new RawFunc("__helios__dcert__new_register_pool",
	`(id, vrf) -> {
		__core__constrData(3, __helios__common__list_2(id, vrf))
	}`));
	add(new RawFunc("__helios__dcert__new_retire_pool",
	`(id, epoch) -> {
		__core__constrData(4, __helios__common__list_2(id, epoch))
	}`));


	// DCert::Register builtins
	addEnumDataFuncs("__helios__dcert__register");
	add(new RawFunc("__helios__dcert__register__credential", "__helios__common__field_0"));


	// DCert::Deregister builtins
	addEnumDataFuncs("__helios__dcert__deregister");
	add(new RawFunc("__helios__dcert__deregister__credential", "__helios__common__field_0"));


	// DCert::Delegate builtins
	addEnumDataFuncs("__helios__dcert__delegate");
	add(new RawFunc("__helios__dcert__delegate__delegator", "__helios__common__field_0"));
	add(new RawFunc("__helios__dcert__delegate__pool_id", "__helios__common__field_1"));


	// DCert::RegisterPool builtins
	addEnumDataFuncs("__helios__dcert__registerpool");
	add(new RawFunc("__helios__dcert__registerpool__pool_id", "__helios__common__field_0"));
	add(new RawFunc("__helios__dcert__registerpool__pool_vrf", "__helios__common__field_1"));


	// DCert::RetirePool builtins
	addEnumDataFuncs("__helios__dcert__retirepool");
	add(new RawFunc("__helios__dcert__retirepool__pool_id", "__helios__common__field_0"));
	add(new RawFunc("__helios__dcert__retirepool__epoch", "__helios__common__field_1"));


	// Tx builtins
	addDataFuncs("__helios__tx");
	add(new RawFunc("__helios__tx__new",
	`(inputs, ref_inputs, outputs, fee, minted, dcerts, withdrawals, validity, signatories, redeemers, datums) -> {
		__core__constrData(0, __helios__common__list_12(
			inputs,
			ref_inputs,
			outputs,
			fee,
			minted,
			dcerts,
			withdrawals,
			validity,
			signatories,
			redeemers,
			datums,
			__helios__txid__CURRENT
		))
	}`));
	add(new RawFunc("__helios__tx__inputs", "__helios__common__field_0"));
	add(new RawFunc("__helios__tx__ref_inputs", "__helios__common__field_1"))
	add(new RawFunc("__helios__tx__outputs", "__helios__common__field_2"));
	add(new RawFunc("__helios__tx__fee", "__helios__common__field_3"));
	add(new RawFunc("__helios__tx__minted", "__helios__common__field_4"));
	add(new RawFunc("__helios__tx__dcerts", "__helios__common__field_5"));
	add(new RawFunc("__helios__tx__withdrawals", "__helios__common__field_6"));
	add(new RawFunc("__helios__tx__time_range", "__helios__common__field_7"));
	add(new RawFunc("__helios__tx__signatories", "__helios__common__field_8"));
	add(new RawFunc("__helios__tx__redeemers", "__helios__common__field_9"));
	add(new RawFunc("__helios__tx__datums", "__helios__common__field_10"));
	add(new RawFunc("__helios__tx__id", "__helios__common__field_11"));
	add(new RawFunc("__helios__tx__find_datum_hash",
	`(self) -> {
		(datum) -> {
			__core__fstPair(__helios__common__find(
				__core__unMapData(__helios__tx__datums(self)),
				(pair) -> {
					__core__equalsData(__core__sndPair(pair), datum)
				},
				__helios__common__identity
			))
		}
	}`));
	add(new RawFunc("__helios__tx__get_datum_data",
	`(self) -> {
		(output) -> {
			(pair) -> {
				(idx) -> {
					__core__ifThenElse(
						__core__equalsInteger(idx, 1),
						() -> {
							__helios__map__get(__helios__tx__datums(self))(__core__headList(__core__sndPair(pair)))
						},
						() -> {
							__core__ifThenElse(
								__core__equalsInteger(idx, 2),
								() -> {
									__core__headList(__core__sndPair(pair))
								},
								() -> {error("output doesn't have a datum")}
							)()
						}
					)()
				}(__core__fstPair(pair))
			}(__core__unConstrData(__helios__txoutput__datum(output)))
		}
	}`));
	add(new RawFunc("__helios__tx__filter_outputs",
	`(self, fn) -> {
		__core__listData(
			__helios__common__filter_list(
				__core__unListData(__helios__tx__outputs(self)), 
				fn
			)
		)
	}`));
	add(new RawFunc("__helios__tx__outputs_sent_to",
	`(self) -> {
		(pubKeyHash) -> {
			__helios__tx__filter_outputs(self, (output) -> {
				__helios__txoutput__is_sent_to(output)(pubKeyHash)
			})
		}
	}`));
	add(new RawFunc("__helios__tx__outputs_sent_to_datum",
	`(self) -> {
		(pubKeyHash, datum, isInline) -> {
			__core__ifThenElse(
				isInline,
				() -> {
					__helios__tx__outputs_sent_to_inline_datum(self, pubKeyHash, datum)
				},
				() -> {
					__helios__tx__outputs_sent_to_datum_hash(self, pubKeyHash, datum)
				}
			)()
		}
	}`));
	add(new RawFunc("__helios__tx__outputs_sent_to_datum_hash",
	`(self, pubKeyHash, datum) -> {
		(datumHash) -> {
			__helios__tx__filter_outputs(
				self, 
				(output) -> {
					__helios__bool__and(
						() -> {
							__helios__txoutput__is_sent_to(output)(pubKeyHash)
						},
						() -> {
							__helios__txoutput__has_datum_hash(output, datumHash)
						}
					)
				}
			)
		}(__helios__common__hash_datum_data(datum))
	}`));
	add(new RawFunc("__helios__tx__outputs_sent_to_inline_datum",
	`(self, pubKeyHash, datum) -> {
		__helios__tx__filter_outputs(
			self, 
			(output) -> {
				__helios__bool__and(
					() -> {
						__helios__txoutput__is_sent_to(output)(pubKeyHash)
					},
					() -> {
						__helios__txoutput__has_inline_datum(output, datum)
					}
				)
			}
		)
	}`));
	add(new RawFunc("__helios__tx__outputs_locked_by",
	`(self) -> {
		(validatorHash) -> {
			__helios__tx__filter_outputs(self, (output) -> {
				__helios__txoutput__is_locked_by(output)(validatorHash)
			})
		}
	}`));
	add(new RawFunc("__helios__tx__outputs_locked_by_datum",
	`(self) -> {
		(validatorHash, datum, isInline) -> {
			__core__ifThenElse(
				isInline,
				() -> {
					__helios__tx__outputs_locked_by_inline_datum(self, validatorHash, datum)
				},
				() -> {
					__helios__tx__outputs_locked_by_datum_hash(self, validatorHash, datum)
				}
			)()
		}
	}`));
	add(new RawFunc("__helios__tx__outputs_locked_by_datum_hash",
	`(self, validatorHash, datum) -> {
		(datumHash) -> {
			__helios__tx__filter_outputs(
				self, 
				(output) -> {
					__helios__bool__and(
						() -> {
							__helios__txoutput__is_locked_by(output)(validatorHash)
						},
						() -> {
							__helios__txoutput__has_datum_hash(output, datumHash)
						}
					)
				}
			)
		}(__helios__common__hash_datum_data(datum))
	}`));
	add(new RawFunc("__helios__tx__outputs_locked_by_inline_datum",
	`(self, validatorHash, datum) -> {
		__helios__tx__filter_outputs(
			self, 
			(output) -> {
				__helios__bool__and(
					() -> {
						__helios__txoutput__is_locked_by(output)(validatorHash)
					},
					() -> {
						__helios__txoutput__has_inline_datum(output, datum)
					}
				)
			}
		)
	}`));
	add(new RawFunc("__helios__tx__value_sent_to",
	`(self) -> {
		(pubKeyHash) -> {
			__helios__txoutput__sum_values(__helios__tx__outputs_sent_to(self)(pubKeyHash))
		}
	}`));
	add(new RawFunc("__helios__tx__value_sent_to_datum",
	`(self) -> {
		(pubKeyHash, datum, isInline) -> {
			__helios__txoutput__sum_values(__helios__tx__outputs_sent_to_datum(self)(pubKeyHash, datum, isInline))
		}
	}`));
	add(new RawFunc("__helios__tx__value_locked_by",
	`(self) -> {
		(validatorHash) -> {
			__helios__txoutput__sum_values(__helios__tx__outputs_locked_by(self)(validatorHash))
		}
	}`));
	add(new RawFunc("__helios__tx__value_locked_by_datum",
	`(self) -> {
		(validatorHash, datum, isInline) -> {
			__helios__txoutput__sum_values(__helios__tx__outputs_locked_by_datum(self)(validatorHash, datum, isInline))
		}
	}`));
	add(new RawFunc("__helios__tx__is_signed_by",
	`(self) -> {
		(hash) -> {
			__helios__common__any(
				__core__unListData(__helios__tx__signatories(self)),
				(signatory) -> {
					__core__equalsData(signatory, hash)
				}
			)
		}
	}`));


	// TxId builtins
	addDataFuncs("__helios__txid");
	add(new RawFunc("__helios__txid__bytes",
	`(self) -> {
		__core__headList(__core__sndPair(__core__unConstrData(self)))
	}`));
	add(new RawFunc("__helios__txid____lt", 
	`(a, b) -> {
		__helios__bytearray____lt(__helios__txid__bytes(a), __helios__txid__bytes(b))
	}`));
	add(new RawFunc("__helios__txid____leq", 
	`(a, b) -> {
		__helios__bytearray____leq(__helios__txid__bytes(a), __helios__txid__bytes(b))
	}`));
	add(new RawFunc("__helios__txid____gt", 
	`(a, b) -> {
		__helios__bytearray____gt(__helios__txid__bytes(a), __helios__txid__bytes(b))
	}`));
	add(new RawFunc("__helios__txid____geq", 
	`(a, b) -> {
		__helios__bytearray____geq(__helios__txid__bytes(a), __helios__txid__bytes(b))
	}`));
	add(new RawFunc("__helios__txid__new",
	`(bytes) -> {
		__core__constrData(0, __helios__common__list_1(bytes)) 
	}`));
	add(new RawFunc("__helios__txid__CURRENT", "__helios__txid__new(__core__bData(#0000000000000000000000000000000000000000000000000000000000000000))"));
	add(new RawFunc("__helios__txid__show",
	`(self) -> {
		__helios__bytearray__show(__helios__txid__bytes(self))
	}`));


	// TxInput builtins
	addDataFuncs("__helios__txinput");
	add(new RawFunc("__helios__txinput__new",
	`(output_id, output) -> {
		__core__constrData(0, __helios__common__list_2(output_id, output))
	}`));
	add(new RawFunc("__helios__txinput__output_id", "__helios__common__field_0"));
	add(new RawFunc("__helios__txinput__output", "__helios__common__field_1"));
	

	// TxOutput builtins
	addDataFuncs("__helios__txoutput");
	add(new RawFunc("__helios__txoutput__new", 
	`(address, value, datum) -> {
		__core__constrData(0, __helios__common__list_4(address, value, datum, __helios__option__none__new()))
	}`));
	add(new RawFunc("__helios__txoutput__address", "__helios__common__field_0"));
	add(new RawFunc("__helios__txoutput__value", "__helios__common__field_1"));
	add(new RawFunc("__helios__txoutput__datum", "__helios__common__field_2"));
	add(new RawFunc("__helios__txoutput__ref_script_hash", "__helios__common__field_3"));
	add(new RawFunc("__helios__txoutput__get_datum_hash",
	`(self) -> {
		() -> {
			(pair) -> {
				__core__ifThenElse(
					__core__equalsInteger(__core__fstPair(pair), 1),
					() -> {__core__headList(__core__sndPair(pair))},
					() -> {__core__bData(#)}
				)()
			}(__core__unConstrData(__helios__txoutput__datum(self)))
		}
	}`));
	add(new RawFunc("__helios__txoutput__has_datum_hash",
	`(self, datumHash) -> {
		__core__equalsData(__helios__txoutput__get_datum_hash(self)(), datumHash)
	}`));
	add(new RawFunc("__helios__txoutput__has_inline_datum",
	`(self, datum) -> {
		(pair) -> {
			__core__ifThenElse(
				__core__equalsInteger(__core__fstPair(pair), 2),
				() -> {__core__equalsData(datum, __core__headList(__core__sndPair(pair)))},
				() -> {false}
			)()
		}(__core__unConstrData(__helios__txoutput__datum(self)))
	}`));
	add(new RawFunc("__helios__txoutput__is_locked_by",
	`(self) -> {
		(hash) -> {
			(credential) -> {
				__core__ifThenElse(
					__helios__credential__is_validator(credential),
					() -> {
						__core__equalsData(
							hash, 
							__helios__credential__validator__hash(
								__helios__credential__validator__cast(credential)
							)
						)
					},
					() -> {false}
				)()
			}(__helios__address__credential(__helios__txoutput__address(self)))
		}
	}`));
	add(new RawFunc("__helios__txoutput__is_sent_to",
	`(self) -> {
		(pkh) -> {
			(credential) -> {
				__core__ifThenElse(
					__helios__credential__is_pubkey(credential),
					() -> {
						__core__equalsData(
							pkh, 
							__helios__credential__pubkey__hash(
								__helios__credential__pubkey__cast(credential)
							)
						)
					},
					() -> {false}
				)()
			}(__helios__address__credential(__helios__txoutput__address(self)))
		}
	}`));
	add(new RawFunc("__helios__txoutput__sum_values",
	`(outputs) -> {
		__helios__list__fold(outputs)(
			(prev, txOutput) -> {
				__helios__value____add(
					prev,
					__helios__txoutput__value(txOutput)
				)
			}, 
			__helios__value__ZERO
		)	
	}`));


	// OutputDatum
	addDataFuncs("__helios__outputdatum");
	add(new RawFunc("__helios__outputdatum__new_none",
	`() -> {
		__core__constrData(0, __helios__common__list_0)
	}`));
	add(new RawFunc("__helios__outputdatum__new_hash",
	`(hash) -> {
		__core__constrData(1, __helios__common__list_1(hash))
	}`));
	add(new RawFunc("__helios__outputdatum__new_inline",
	`(data) -> {
		__core__constrData(2, __helios__common__list_1(data))
	}`));
	add(new RawFunc("__helios__outputdatum__new_inline_from_bool",
	`(b) -> {
		__helios__outputdatum__new_inline(_helios__common__boolData(b))
	}`));
	add(new RawFunc("__helios__outputdatum__get_inline_data",
	`(self) -> {
		() -> {
			(pair) -> {
				(index, fields) -> {
					__core__ifThenElse(
						__core__equalsInteger(index, 2),
						() -> {
							__core__headList(fields)
						},
						() -> {
							error("not an inline datum")
						}
					)()
				}(__core__fstPair(pair), __core__sndPair(pair))
			}(__core__unConstrData(self))
		}
	}`));


	// OutputDatum::None
	addEnumDataFuncs("__helios__outputdatum__none");
	

	// OutputDatum::Hash
	addEnumDataFuncs("__helios__outputdatum__hash");
	add(new RawFunc("__helios__outputdatum__hash__hash", "__helios__common__field_0"));


	// OutputDatum::Inline
	addEnumDataFuncs("__helios__outputdatum__inline");
	add(new RawFunc("__helios__outputdatum__inline__data", "__helios__common__field_0"));


	// RawData
	addDataFuncs("__helios__data");
	add(new RawFunc("__helios__data__tag", 
	`(self) -> {
		__core__iData(__core__fstPair(__core__unConstrData(self)))
	}`));


	// TxOutputId
	addDataFuncs("__helios__txoutputid");
	add(new RawFunc("__helios__txoutputid__tx_id", "__helios__common__field_0"));
	add(new RawFunc("__helios__txoutputid__index", "__helios__common__field_1"));
	add(new RawFunc("__helios__txoutputid__comp", 
	`(a, b, comp_txid, comp_index) -> {
		(a_txid, a_index) -> {
			(b_txid, b_index) -> {
				__core__ifThenElse(
					__core__equalsData(a_txid, b_txid),
					() -> {
						comp_index(a_index, b_index)
					},
					() -> {
						comp_txid(a_txid, b_txid)
					}
				)()
			}(__helios__txoutputid__tx_id(b), __helios__txoutputid__index(b))
		}(__helios__txoutputid__tx_id(a), __helios__txoutputid__index(a))
	}`));
	add(new RawFunc("__helios__txoutputid____lt", 
	`(a, b) -> {
		__helios__txoutputid__comp(a, b, __helios__txid____lt, __helios__int____lt)
	}`));
	add(new RawFunc("__helios__txoutputid____leq", 
	`(a, b) -> {
		__helios__txoutputid__comp(a, b, __helios__txid____leq, __helios__int____leq)
	}`));
	add(new RawFunc("__helios__txoutputid____gt", 
	`(a, b) -> {
		__helios__txoutputid__comp(a, b, __helios__txid____gt, __helios__int____gt)
	}`));
	add(new RawFunc("__helios__txoutputid____geq", 
	`(a, b) -> {
		__helios__txoutputid__comp(a, b, __helios__txid____geq, __helios__int____geq)
	}`));
	add(new RawFunc("__helios__txoutputid__new",
	`(tx_id, idx) -> {
		__core__constrData(0, __helios__common__list_2(tx_id, idx))
	}`));


	// Address
	addDataFuncs("__helios__address");
	add(new RawFunc("__helios__address__new", 
	`(cred, staking_cred) -> {
		__core__constrData(0, __helios__common__list_2(cred, staking_cred))
	}`));
	add(new RawFunc("__helios__address__new_empty",
	`() -> {
		__core__constrData(0, __helios__common__list_2(__helios__credential__new_pubkey(__core__bData(#)), __helios__option__none__new()))
	}`))
	add(new RawFunc("__helios__address__credential", "__helios__common__field_0"));
	add(new RawFunc("__helios__address__staking_credential", "__helios__common__field_1"));
	add(new RawFunc("__helios__address__is_staked",
	`(self) -> {
		() -> {
			__core__equalsInteger(__core__fstPair(__core__unConstrData(__helios__common__field_1(self))), 0)
		}
	}`));


	// Credential builtins
	addDataFuncs("__helios__credential");
	add(new RawFunc("__helios__credential__new_pubkey",
	`(hash) -> {
		__core__constrData(0, __helios__common__list_1(hash))
	}`));
	add(new RawFunc("__helios__credential__new_validator",
	`(hash) -> {
		__core__constrData(1, __helios__common__list_1(hash))
	}`));
	add(new RawFunc("__helios__credential__is_pubkey",
	`(self) -> {
		__core__equalsInteger(__core__fstPair(__core__unConstrData(self)), 0)
	}`));
	add(new RawFunc("__helios__credential__is_validator",
	`(self) -> {
		__core__equalsInteger(__core__fstPair(__core__unConstrData(self)), 1)
	}`));


	// Credential::PubKey builtins
	addEnumDataFuncs("__helios__credential__pubkey");
	add(new RawFunc("__helios__credential__pubkey__cast",
	`(data) -> {
		__helios__common__assert_constr_index(data, 0)
	}`));
	add(new RawFunc("__helios__credential__pubkey__hash", "__helios__common__field_0"));


	// Credential::Validator builtins
	addEnumDataFuncs("__helios__credential__validator");
	add(new RawFunc("__helios__credential__validator__cast",
	`(data) -> {
		__helios__common__assert_constr_index(data, 1)
	}`));
	add(new RawFunc("__helios__credential__validator__hash", "__helios__common__field_0"));


	// StakingHash builtins
	addDataFuncs("__helios__stakinghash");
	add(new RawFunc("__helios__stakinghash__new_stakekey", "__helios__credential__new_pubkey"));
	add(new RawFunc("__helios__stakinghash__new_validator", "__helios__credential__new_validator"));
	add(new RawFunc("__helios__stakinghash__is_stakekey", "__helios__credential__is_stakekey"));
	add(new RawFunc("__helios__stakinghash__is_validator", "__helios__credential__is_validator"));


	// StakingHash::StakeKey builtins
	addEnumDataFuncs("__helios__stakinghash__stakekey");
	add(new RawFunc("__helios__stakinghash__stakekey__cast", "__helios__credential__pubkey__cast"));
	add(new RawFunc("__helios__stakinghash__stakekey__hash", "__helios__credential__pubkey__hash"));


	// StakingHash::Validator builtins
	addEnumDataFuncs("__helios__stakinghash__validator");
	add(new RawFunc("__helios__stakinghash__validator__cast", "__helios__credential__validator__cast"));
	add(new RawFunc("__helios__stakinghash__validator__hash", "__helios__credential__validator__hash"));


	// StakingCredential builtins
	addDataFuncs("__helios__stakingcredential");
	add(new RawFunc("__helios__stakingcredential__new_hash", 
	`(cred) -> {
		__core__constrData(0, __helios__common__list_1(cred))
	}`));
	add(new RawFunc("__helios__stakingcredential__new_ptr", 
	`(i, j, k) -> {
		__core__constrData(1, __helios__common__list_3(i, j, k))
	}`));

	
	// StakingCredential::Hash builtins
	addEnumDataFuncs("__helios__stakingcredential__hash");
	add(new RawFunc("__helios__stakingcredential__hash__hash", "__helios__common__field_0"));


	// StakingCredential::Ptr builtins
	addEnumDataFuncs("__helios__stakingcredential__ptr");


	// Time builtins
	addDataFuncs("__helios__time");
	add(new RawFunc("__helios__time__new", `__helios__common__identity`));
	add(new RawFunc("__helios__time____add", `__helios__int____add`));
	add(new RawFunc("__helios__time____sub", `__helios__int____sub`));
	add(new RawFunc("__helios__time____sub_alt", `__helios__int____sub`));
	add(new RawFunc("__helios__time____geq", `__helios__int____geq`));
	add(new RawFunc("__helios__time____gt", `__helios__int____gt`));
	add(new RawFunc("__helios__time____leq", `__helios__int____leq`));
	add(new RawFunc("__helios__time____lt", `__helios__int____lt`));
	add(new RawFunc("__helios__time__show", `__helios__int__show`));


	// Duratin builtins
	addDataFuncs("__helios__duration");
	add(new RawFunc("__helios__duration__new", `__helios__common__identity`));
	add(new RawFunc("__helios__duration____add", `__helios__int____add`));
	add(new RawFunc("__helios__duration____sub", `__helios__int____sub`));
	add(new RawFunc("__helios__duration____mul", `__helios__int____mul`));
	add(new RawFunc("__helios__duration____div", `__helios__int____div`));
	add(new RawFunc("__helios__duration____div_alt", `__helios__int____div`));
	add(new RawFunc("__helios__duration____mod", `__helios__int____mod`));
	add(new RawFunc("__helios__duration____geq", `__helios__int____geq`));
	add(new RawFunc("__helios__duration____gt", `__helios__int____gt`));
	add(new RawFunc("__helios__duration____leq", `__helios__int____leq`));
	add(new RawFunc("__helios__duration____lt", `__helios__int____lt`));
	add(new RawFunc("__helios__duration__SECOND", "__core__iData(1000)"));
	add(new RawFunc("__helios__duration__MINUTE", "__core__iData(60000)"));
	add(new RawFunc("__helios__duration__HOUR", "__core__iData(3600000)"));
	add(new RawFunc("__helios__duration__DAY", "__core__iData(86400000)"));
	add(new RawFunc("__helios__duration__WEEK", "__core__iData(604800000)"));


	// TimeRange builtins
	addDataFuncs("__helios__timerange");
	add(new RawFunc("__helios__timerange__new", `
	(a, b) -> {
		__core__constrData(0, __helios__common__list_2(
			__core__constrData(0, __helios__common__list_2(
				__core__constrData(1, __helios__common__list_1(a)),
				__helios__common__boolData(true)
			)),
			__core__constrData(0, __helios__common__list_2(
				__core__constrData(1, __helios__common__list_1(b)),
				__helios__common__boolData(true)
			))
		))
	}`));
	add(new RawFunc("__helios__timerange__ALWAYS", `
	__core__constrData(0, __helios__common__list_2(
		__core__constrData(0, __helios__common__list_2(
			__core__constrData(0, __helios__common__list_0),
			__helios__common__boolData(true)
		)),
		__core__constrData(0, __helios__common__list_2(
			__core__constrData(2, __helios__common__list_0),
			__helios__common__boolData(true)
		))
	))`));
	add(new RawFunc("__helios__timerange__NEVER", `
	__core__constrData(0, __helios__common__list_2(
		__core__constrData(0, __helios__common__list_2(
			__core__constrData(2, __helios__common__list_0),
			__helios__common__boolData(true)
		)),
		__core__constrData(0, __helios__common__list_2(
			__core__constrData(0, __helios__common__list_0),
			__helios__common__boolData(true)
		))
	))`));
	add(new RawFunc("__helios__timerange__from", `
	(a) -> {
		__core__constrData(0, __helios__common__list_2(
			__core__constrData(0, __helios__common__list_2(
				__core__constrData(1, __helios__common__list_1(a)),
				__helios__common__boolData(true)
			)),
			__core__constrData(0, __helios__common__list_2(
				__core__constrData(2, __helios__common__list_0),
				__helios__common__boolData(true)
			))
		))
	}`));
	add(new RawFunc("__helios__timerange__to", `
	(b) -> {
		__core__constrData(0, __helios__common__list_2(
			__core__constrData(0, __helios__common__list_2(
				__core__constrData(0, __helios__common__list_0),
				__helios__common__boolData(true)
			)),
			__core__constrData(0, __helios__common__list_2(
				__core__constrData(1, __helios__common__list_1(b)),
				__helios__common__boolData(true)
			))
		))
	}`));
	add(new RawFunc("__helios__timerange__is_before", 
	`(self) -> {
		(t) -> {
			(upper) -> {
				(extended, closed) -> {
					(extType) -> {
						__core__ifThenElse(
							__core__equalsInteger(extType, 2),
							() -> {false},
							() -> {
								__core__ifThenElse(
									__core__equalsInteger(extType, 0),
									() -> {true},
									() -> {
										__core__ifThenElse(
											closed,
											() -> {__core__lessThanInteger(__core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))), __core__unIData(t))},
											() -> {__core__lessThanEqualsInteger(__core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))), __core__unIData(t))}
										)()
									}
								)()
							}
						)()
					}(__core__fstPair(__core__unConstrData(extended)))
				}(__helios__common__field_0(upper), __helios__common__unBoolData(__helios__common__field_1(upper)))
			}(__helios__common__field_1(self))
		}
	}`));
	add(new RawFunc("__helios__timerange__is_after",
	`(self) -> {
		(t) -> {
			(lower) -> {
				(extended, closed) -> {
					(extType) -> {
						__core__ifThenElse(
							__core__equalsInteger(extType, 0),
							() -> {false},
							() -> {
								__core__ifThenElse(
									__core__equalsInteger(extType, 2),
									() -> {true},
									() -> {
										__core__ifThenElse(
											closed,
											() -> {__core__lessThanInteger(__core__unIData(t), __core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))))},
											() -> {__core__lessThanEqualsInteger(__core__unIData(t), __core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))))}
										)()
									}
								)()
							}
						)()
					}(__core__fstPair(__core__unConstrData(extended)))
				}(__helios__common__field_0(lower), __helios__common__unBoolData(__helios__common__field_1(lower)))
			}(__helios__common__field_0(self))
		}
	}`));
	add(new RawFunc("__helios__timerange__contains",
	`(self) -> {
		(t) -> {
			(lower) -> {
				(extended, closed) -> {
					(lowerExtType, checkUpper) -> {
						__core__ifThenElse(
							__core__equalsInteger(lowerExtType, 2),
							() -> {false},
							() -> {
								__core__ifThenElse(
									__core__equalsInteger(lowerExtType, 0),
									() -> {checkUpper()},
									() -> {
										__core__ifThenElse(
											__core__ifThenElse(
												closed,
												() -> {__core__lessThanEqualsInteger(__core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))), __core__unIData(t))},
												() -> {__core__lessThanInteger(__core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))), __core__unIData(t))}
											)(),
											() -> {checkUpper()},
											() -> {false}
										)()
									}
								)()
							}
						)()
					}(__core__fstPair(__core__unConstrData(extended)), () -> {
						(upper) -> {
							(extended, closed) -> {
								(upperExtType) -> {
									__core__ifThenElse(
										__core__equalsInteger(upperExtType, 0),
										() -> {false},
										() -> {
											__core__ifThenElse(
												__core__equalsInteger(upperExtType, 2),
												() -> {true},
												() -> {
													__core__ifThenElse(
														__core__ifThenElse(
															closed,
															() -> {__core__lessThanEqualsInteger(__core__unIData(t), __core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))))},
															() -> {__core__lessThanInteger(__core__unIData(t), __core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))))}
														)(),
														true,
														false
													)
												}
											)()
										}
									)()
								}(__core__fstPair(__core__unConstrData(extended)))
							}(__helios__common__field_0(upper), __helios__common__unBoolData(__helios__common__field_1(upper)))
						}(__helios__common__field_1(self))
					})
				}(__helios__common__field_0(lower), __helios__common__unBoolData(__helios__common__field_1(lower)))
			}(__helios__common__field_0(self))
		}
	}`));
	add(new RawFunc("__helios__timerange__start",
	`(self) -> {
		__helios__common__field_0(__helios__common__field_0(__helios__common__field_0(self)))
	}`));
	add(new RawFunc("__helios__timerange__end",
	`(self) -> {
		__helios__common__field_0(__helios__common__field_0(__helios__common__field_1(self)))
	}`));
	add(new RawFunc("__helios__timerange__show",
	`(self) -> {
		() -> {
			(show_extended) -> {
				__helios__string____add(
					(lower) -> {
						(extended, closed) -> {
							__helios__string____add(
								__core__ifThenElse(
									closed,
									() -> {__helios__common__stringData("[")},
									() -> {__helios__common__stringData("(")}
								)(),
								show_extended(extended)
							)
						}(__helios__common__field_0(lower), __helios__common__unBoolData(__helios__common__field_1(lower)))
					}(__helios__common__field_0(self)),
					__helios__string____add(
						__helios__common__stringData(","),
						(upper) -> {
							(extended, closed) -> {
								__helios__string____add(
									show_extended(extended),
									__core__ifThenElse(
										closed,
										() -> {__helios__common__stringData("]")},
										() -> {__helios__common__stringData(")")}
									)()
								)
							}(__helios__common__field_0(upper), __helios__common__unBoolData(__helios__common__field_1(upper)))
						}(__helios__common__field_1(self))
					)
				)
			}(
				(extended) -> {
					(extType) -> {
						__core__ifThenElse(
							__core__equalsInteger(extType, 0),
							() -> {__helios__common__stringData("-inf")},
							() -> {
								__core__ifThenElse(
									__core__equalsInteger(extType, 2),
									() -> {__helios__common__stringData("+inf")},
									() -> {
										(fields) -> {
											__helios__int__show(__core__headList(fields))()
										}(__core__sndPair(__core__unConstrData(extended)))
									}
								)()
							}
						)()
					}(__core__fstPair(__core__unConstrData(extended)))
				}
			)
		}
	}`))


	// AssetClass builtins
	addDataFuncs("__helios__assetclass");
	add(new RawFunc("__helios__assetclass__ADA", `__helios__assetclass__new(__core__bData(#), __core__bData(#))`));
	add(new RawFunc("__helios__assetclass__new",
	`(mph, token_name) -> {
		__core__constrData(0, __helios__common__list_2(mph, token_name))
	}`));
	add(new RawFunc("__helios__assetclass__mph", "__helios__common__field_0"));
	add(new RawFunc("__helios__assetclass__token_name", "__helios__common__field_1"));


	// Value builtins
	add(new RawFunc("__helios__value__serialize", "__helios__common__serialize"));
	add(new RawFunc("__helios__value__from_data", "__helios__common__identity"));
	add(new RawFunc("__helios__value__ZERO", `__core__mapData(__core__mkNilPairData(()))`));
	add(new RawFunc("__helios__value__lovelace",
	`(i) -> {
		__helios__value__new(__helios__assetclass__ADA, i)
	}`));
	add(new RawFunc("__helios__value__new",
	`(assetClass, i) -> {
		__core__ifThenElse(
			__core__equalsInteger(0, __core__unIData(i)),
			() -> {
				__helios__value__ZERO
			},
			() -> {
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
				}(__helios__common__field_0(assetClass), __helios__common__field_1(assetClass))
			}
		)()
	}`));
	add(new RawFunc("__helios__value__from_map", "__helios__common__identity"));
	add(new RawFunc("__helios__value__to_map", 
	`(self) -> {
		() -> {
			self
		}
	}`));
	add(new RawFunc("__helios__value__get_map_keys",
	`(map) -> {
		(recurse) -> {
			recurse(recurse, map)
		}(
			(recurse, map) -> {
				__core__chooseList(
					map, 
					() -> {__helios__common__list_0}, 
					() -> {__core__mkCons(__core__fstPair(__core__headList(map)), recurse(recurse, __core__tailList(map)))}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__value__merge_map_keys",
	`(a, b) -> {
		(aKeys) -> {
			(recurse) -> {
				(uniqueBKeys) -> {
					__helios__common__concat(aKeys, uniqueBKeys)
				}(recurse(recurse, aKeys, b))
			}(
				(recurse, keys, map) -> {
					__core__chooseList(
						map, 
						() -> {__helios__common__list_0}, 
						() -> {
							(key) -> {
								__core__ifThenElse(
									__helios__common__is_in_bytearray_list(aKeys, key), 
									() -> {recurse(recurse, keys, __core__tailList(map))},
									() -> {__core__mkCons(key, recurse(recurse, keys, __core__tailList(map)))}
								)()
							}(__core__fstPair(__core__headList(map)))
						}
					)()
				}
			)
		}(__helios__value__get_map_keys(a))
	}`));

	add(new RawFunc("__helios__value__get_inner_map",
	`(map, mph) -> {
		(recurse) -> {
			recurse(recurse, map)
		}(
			(recurse, map) -> {
				__core__chooseList(
					map, 
					() -> {__core__mkNilPairData(())},
					() -> {
						__core__ifThenElse(
							__core__equalsData(__core__fstPair(__core__headList(map)), mph), 
							() -> {__core__unMapData(__core__sndPair(__core__headList(map)))},
							() -> {recurse(recurse, __core__tailList(map))}
						)()
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__value__get_inner_map_int",
	`(map, key) -> {
		(recurse) -> {
			recurse(recurse, map, key)
		}(
			(recurse, map, key) -> {
				__core__chooseList(
					map, 
					() -> {0}, 
					() -> {
						__core__ifThenElse(
							__core__equalsData(__core__fstPair(__core__headList(map)), key), 
							() -> {__core__unIData(__core__sndPair(__core__headList(map)))}, 
							() -> {recurse(recurse, __core__tailList(map), key)}
						)()
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__value__add_or_subtract_inner",
	`(op) -> {
		(a, b) -> {
			(recurse) -> {
				recurse(recurse, __helios__value__merge_map_keys(a, b), __core__mkNilPairData(()))
			}(
				(recurse, keys, result) -> {
					__core__chooseList(
						keys, 
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
							}(__core__headList(keys), recurse(recurse, __core__tailList(keys), result))
						}
					)()
				}
			)
		}
	}`));
	add(new RawFunc("__helios__value__add_or_subtract",
	`(op, a, b) -> {
		(a, b) -> {
			(recurse) -> {
				__core__mapData(recurse(recurse, __helios__value__merge_map_keys(a, b), __core__mkNilPairData(())))
			}(
				(recurse, keys, result) -> {
					__core__chooseList(
						keys, 
						() -> {result}, 
						() -> {
							(key, tail) -> {
								(item) -> {
									__core__chooseList(
										item, 
										() -> {tail}, 
										() -> {__core__mkCons(__core__mkPairData(key, __core__mapData(item)), tail)}
									)()
								}(__helios__value__add_or_subtract_inner(op)(__helios__value__get_inner_map(a, key), __helios__value__get_inner_map(b, key)))
							}(__core__headList(keys), recurse(recurse, __core__tailList(keys), result))
						}
					)()
				}
			)
		}(__core__unMapData(a), __core__unMapData(b))
	}`));
	add(new RawFunc("__helios__value__map_quantities",
	`(self, op) -> {
		(self) -> {
			(recurseInner) -> {
				(recurseOuter) -> {
					__core__mapData(recurseOuter(recurseOuter, self))
				}(
					(recurseOuter, outer) -> {
						__core__chooseList(
							outer,
							() -> {__core__mkNilPairData(())},
							() -> {
								(head) -> {
									__core__mkCons(
										__core__mkPairData(
											__core__fstPair(head), 
											__core__mapData(recurseInner(recurseInner, __core__unMapData(__core__sndPair(head))))
										),  
										recurseOuter(recurseOuter, __core__tailList(outer))
									)
								}(__core__headList(outer))
							}
						)()
					}
				)
			}(
				(recurseInner, inner) -> {
					__core__chooseList(
						inner,
						() -> {__core__mkNilPairData(())},
						() -> {
							(head) -> {
								__core__mkCons(
									__core__mkPairData(
										__core__fstPair(head),
										__core__iData(op(__core__unIData(__core__sndPair(head))))
									),
									recurseInner(recurseInner, __core__tailList(inner))
								)
							}(__core__headList(inner))
						}
					)()
				}
			)
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__value__compare_inner",
	`(comp, a, b) -> {
		(recurse) -> {
			recurse(recurse, __helios__value__merge_map_keys(a, b))
		}(
			(recurse, keys) -> {
				__core__chooseList(
					keys, 
					() -> {true}, 
					() -> {
						(key) -> {
							__core__ifThenElse(
								__helios__common__not(comp(__helios__value__get_inner_map_int(a, key), __helios__value__get_inner_map_int(b, key))), 
								() -> {false}, 
								() -> {recurse(recurse, __core__tailList(keys))}
							)()
						}(__core__headList(keys))
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__value__compare",
	`(comp, a, b) -> {
		(a, b) -> {
			(recurse) -> {
				recurse(recurse, __helios__value__merge_map_keys(a, b))
			}(
				(recurse, keys) -> {
					__core__chooseList(
						keys, 
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
	add(new RawFunc("__helios__value____eq",
	`(a, b) -> {
		__helios__value__compare(__core__equalsInteger, a, b)
	}`));
	add(new RawFunc("__helios__value____neq",
	`(a, b) -> {
		__helios__common__not(__helios__value____eq(a, b))
	}`));
	add(new RawFunc("__helios__value____add",
	`(a, b) -> {
		__helios__value__add_or_subtract(__core__addInteger, a, b)
	}`));
	add(new RawFunc("__helios__value____sub",
	`(a, b) -> {
		__helios__value__add_or_subtract(__core__subtractInteger, a, b)
	}`));
	add(new RawFunc("__helios__value____mul",
	`(a, b) -> {
		(scale) -> {
			__helios__value__map_quantities(a, (qty) -> {__core__multiplyInteger(qty, scale)})
		}(__core__unIData(b))
	}`));
	add(new RawFunc("__helios__value____div",
	`(a, b) -> {
		(den) -> {
			__helios__value__map_quantities(a, (qty) -> {__core__divideInteger(qty, den)})
		}(__core__unIData(b))
	}`));
	add(new RawFunc("__helios__value____geq",
	`(a, b) -> {
		__helios__value__compare((a_qty, b_qty) -> {__helios__common__not(__core__lessThanInteger(a_qty, b_qty))}, a, b)
	}`));
	add(new RawFunc("__helios__value__contains", `
	(self) -> {
		(value) -> {
			__helios__value____geq(self, value)
		}
	}`));
	add(new RawFunc("__helios__value____gt",
	`(a, b) -> {
		__helios__bool__and(
			() -> {
				__helios__common__not(
					__helios__bool__and(
						__helios__value__is_zero(a),
						__helios__value__is_zero(b)
					)
				)
			},
			() -> {
				__helios__value__compare(
					(a_qty, b_qty) -> {
						__helios__common__not(__core__lessThanEqualsInteger(a_qty, b_qty))
					}, 
					a, 
					b
				)
			}
		)
	}`));
	add(new RawFunc("__helios__value____leq",
	`(a, b) -> {
		__helios__value__compare(__core__lessThanEqualsInteger, a, b)
	}`));
	add(new RawFunc("__helios__value____lt",
	`(a, b) -> {
		__helios__bool__and(
			() -> {
				__helios__common__not(
					__helios__bool__and(
						__helios__value__is_zero(a),
						__helios__value__is_zero(b)
					)
				)
			},
			() -> {
				__helios__value__compare(
					(a_qty, b_qty) -> {
						__core__lessThanInteger(a_qty, b_qty)
					}, 
					a, 
					b
				)
			}
		)
	}`));
	add(new RawFunc("__helios__value__is_zero",
	`(self) -> {
		() -> {
			__core__nullList(__core__unMapData(self))
		}
	}`));
	add(new RawFunc("__helios__value__get",
	`(self) -> {
		(assetClass) -> {
			(map, mintingPolicyHash, tokenName) -> {
				(outer, inner) -> {
					outer(outer, inner, map)
				}(
					(outer, inner, map) -> {
						__core__chooseList(
							map, 
							() -> {error("policy not found")}, 
							() -> {
								__core__ifThenElse(
									__core__equalsData(__core__fstPair(__core__headList(map)), mintingPolicyHash), 
									() -> {inner(inner, __core__unMapData(__core__sndPair(__core__headList(map))))}, 
									() -> {outer(outer, inner, __core__tailList(map))}
								)()
							}
						)()
					}, (inner, map) -> {
						__core__chooseList(
							map, 
							() -> {error("tokenName not found")}, 
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
			}(__core__unMapData(self), __helios__common__field_0(assetClass), __helios__common__field_1(assetClass))
		}
	}`));
	add(new RawFunc("__helios__value__get_safe",
	`(self) -> {
		(assetClass) -> {
			(map, mintingPolicyHash, tokenName) -> {
				(outer, inner) -> {
					outer(outer, inner, map)
				}(
					(outer, inner, map) -> {
						__core__chooseList(
							map, 
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
						__core__chooseList(
							map, 
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
			}(__core__unMapData(self), __helios__common__field_0(assetClass), __helios__common__field_1(assetClass))
		}
	}`));
	add(new RawFunc("__helios__value__get_lovelace",
	`(self) -> {
		() -> {
			__helios__value__get_safe(self)(__helios__assetclass__ADA)
		}
	}`));
	add(new RawFunc("__helios__value__get_assets",
	`(self) -> {
		() -> {
			__helios__map__filter(self)(
				(key, _) -> {
					__helios__common__not(__core__equalsByteString(__core__unBData(key), #))
				}
			)
		}
	}`));
	add(new RawFunc("__helios__value__get_policy", 
	`(self) -> {
		(mph) -> {
			(map) -> {
				(recurse) -> {
					recurse(recurse, map)
				}(
					(recurse, map) -> {
						__core__chooseList(
							map,
							() -> {error("policy not found")},
							() -> {
								__core__ifThenElse(
									__core__equalsData(__core__fstPair(__core__headList(map)), mph),
									() -> {__core__sndPair(__core__headList(map))},
									() -> {recurse(recurse, __core__tailList(map))}
								)()
							}
						)()
					}
				)
			}(__core__unMapData(self))
		} 
	}`));
	add(new RawFunc("__helios__value__contains_policy",
	`(self) -> {
		(mph) -> {
			(map) -> {
				(recurse) -> {
					recurse(recurse, map)
				}(
					(recurse, map) -> {
						__core__chooseList(
							map,
							() -> {false},
							() -> {
								__core__ifThenElse(
									__core__equalsData(__core__fstPair(__core__headList(map)), mph),
									() -> {true},
									() -> {recurse(recurse, __core__tailList(map))}
								)()
							}
						)()
					}
				)
			}(__core__unMapData(self))
		}
	}`));
	add(new RawFunc("__helios__value__show",
	`(self) -> {
		() -> {
			__helios__map__fold(self)(
				(prev, mph, tokens) -> {
					__helios__map__fold(tokens)(
						(prev, token_name, qty) -> {
							__helios__string____add(
								prev,
								__core__ifThenElse(
									__helios__bytearray____eq(mph, __core__bData(#)),
									() -> {
										__helios__string____add(
											__helios__common__stringData("lovelace: "),
											__helios__string____add(
												__helios__int__show(qty)(),
												__helios__common__stringData("\\n")
											)
										)
									},
									() -> {
										__helios__string____add(
											__helios__bytearray__show(mph)(),
											__helios__string____add(
												__helios__common__stringData("."),
												__helios__string____add(
													__helios__bytearray__show(token_name)(),
													__helios__string____add(
														__helios__common__stringData(": "),
														__helios__string____add(
															__helios__int__show(qty)(),
															__helios__common__stringData("\\n")
														)
													)
												)
											)
										)
									}
								)()
							)
						},
						prev
					)
				},
				__helios__common__stringData("")
			)
		}
	}`))

	return db;
}

/**
 * @param {IR} ir 
 * @returns {IR}
 * @package
 */
function wrapWithRawFunctions(ir) {
	let db = makeRawFunctions();

	// notify statistics of existence of builtin in correct order
	if (onNotifyRawUsage !== null) {
		for (let [name, _] of db) {
			onNotifyRawUsage(name, 0);
		}
	}

	let re = new RegExp("__helios[a-zA-Z0-9_]*", "g");

	let [src, _] = ir.generateSource();

	//console.log(src);

	let matches = src.match(re);

	let map = new Map();

	if (matches !== null) {
		for (let match of matches) {
			if (!map.has(match)) {
				if (!db.has(match)) {
					throw new Error(`builtin ${match} not found`);
				}

				let builtin = assertDefined(db.get(match));

				builtin.load(db, map);
			}
		}
	}

	return IR.wrapWithDefinitions(ir, map);
}



/////////////////////////////////
// Section 20: IR Context objects
/////////////////////////////////

/**
 * Scope for IR names.
 * Works like a stack of named values from which a Debruijn index can be derived
 * @package
 */
class IRScope {
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
class IRVariable extends Token {
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
}

/**
 * @package
 */
class IRValue {
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
class IRFuncValue extends IRValue {
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
class IRLiteralValue extends IRValue {
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
class IRDeferredValue extends IRValue {
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
class IRCallStack {
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


/////////////////////////////
// Section 21: IR AST objects
/////////////////////////////

/**
 * @typedef {Map<IRVariable, IRLiteralExpr>} IRLiteralRegistry
 */

export class IRNameExprRegistry {
	/**
	 * @type {Map<IRVariable, Set<IRNameExpr>>}
	 */
	#map;

	/**
	 * @type {Set<IRVariable>}
	 */
	#maybeInsideLoop;

	/**
	 * Reset whenever recursion is detected.
	 * @type {Set<IRVariable>}
	 */
	#variables;

	/**
	 * @param {Map<IRVariable, Set<IRNameExpr>>} map
	 */
	constructor(map = new Map(), maybeInsideLoop = new Set()) {
		this.#map = map;
		this.#maybeInsideLoop = maybeInsideLoop;
		this.#variables = new Set();
	}

	/**
	 * @param {IRNameExpr} nameExpr 
	 */
	register(nameExpr) {
		if (!nameExpr.isCore()) {
			const variable = nameExpr.variable;

			if (!this.#map.has(variable)) {
				this.#map.set(variable, new Set([nameExpr]));
			} else {
				assertDefined(this.#map.get(variable)).add(nameExpr);
			}

			// add another reference in case of recursion
			if (!this.#variables.has(variable)) {
				this.#maybeInsideLoop.add(variable);
			}
		}
	}

	/**
	 * Used to prevent inlining upon recursion
	 * @param {IRVariable} variable
	 */
	registerVariable(variable) {
		this.#variables.add(variable)
	}

	/**
	 * @param {IRVariable} variable 
	 * @returns {number}
	 */
	countReferences(variable) {
		const set = this.#map.get(variable);

		if (set == undefined) {
			return 0;
		} else {
			return set.size;
		}
	}

	/**
	 * @param {IRVariable} variable 
	 * @returns {boolean}
	 */
	maybeInsideLoop(variable) {
		return this.#maybeInsideLoop.has(variable);
	}

	/**
	 * Called whenever recursion is detected
	 * @returns {IRNameExprRegistry}
	 */
	resetVariables() {
		return new IRNameExprRegistry(this.#map, this.#maybeInsideLoop);
	}
}

export class IRExprRegistry {
	#nameExprs;

	/**
	 * @type {Map<IRVariable, IRExpr>}
	 */
	#inline;

	/**
	 * @param {IRNameExprRegistry} nameExprs 
	 */
	constructor(nameExprs) {
		this.#nameExprs = nameExprs;
		this.#inline = new Map();
	}

	/**
	 * @param {IRVariable} variable 
	 * @returns {number}
	 */
	countReferences(variable) {
		return this.#nameExprs.countReferences(variable);
	}

	/**
	 * @param {IRVariable} variable 
	 * @returns {boolean}
	 */
	maybeInsideLoop(variable) {
		return this.#nameExprs.maybeInsideLoop(variable);
	}

	/**
	 * @param {IRVariable} variable
	 * @returns {boolean}
	 */
	isInlineable(variable) {
		return this.#inline.has(variable);
	}

	/**
	 * @param {IRVariable} variable
	 * @returns {IRExpr}
	 */
	getInlineable(variable) {
		return assertDefined(this.#inline.get(variable)).copy(new Map());
	}

	/**
	 * @param {IRVariable} variable 
	 * @param {IRExpr} expr 
	 */
	addInlineable(variable, expr) {
		this.#inline.set(variable, expr);
	}
}

/**
 * Base class of all Intermediate Representation expressions
 * @package
 */
class IRExpr extends Token {
	/**
	 * @param {Site} site 
	 */
	constructor(site) {
		super(site);
	}

	/**
	 * For pretty printing the IR
	 * @param {string} indent 
	 * @returns {string}
	 */
	toString(indent = "") {
		throw new Error("not yet implemented");
	}

	/**
	 * Link IRNameExprs to variables
	 * @param {IRScope} scope 
	 */
	resolveNames(scope) {
		throw new Error("not yet implemented");
	}

	/**
	 * Turns all IRConstExpr istances into IRLiteralExpr instances
	 * @param {IRCallStack} stack 
	 * @returns {IRExpr}
	 */
	evalConstants(stack) {
		throw new Error("not yet implemented");
	}

	/**
	 * Evaluates an expression to something (hopefully) literal
	 * Returns null if it the result would be worse than the current expression
	 * Doesn't return an IRLiteral because the resulting expression might still be an improvement, even if it isn't a literal
	 * @param {IRCallStack} stack
	 * @returns {?IRValue}
	 */
	eval(stack) {
		throw new Error("not yet implemented");
	}

	/**
	 * Used to inline literals and to evaluate IRCoreCallExpr instances with only literal args.
	 * @param {IRLiteralRegistry} literals
	 * @returns {IRExpr}
	 */
	simplifyLiterals(literals) {
		throw new Error("not yet implemented");
	}

	/**
	 * Used before simplifyTopology
	 * @param {IRNameExprRegistry} nameExprs
	 */
	registerNameExprs(nameExprs) {
		throw new Error("not yet implemented");
	}

	/**
	 * Used during inlining/expansion to make sure multiple inlines of IRNameExpr don't interfere when setting the Debruijn index
	 * @param {Map<IRVariable, IRVariable>} newVars
	 * @returns {IRExpr}
	 */
	copy(newVars) {
		throw new Error("not yet implemented");
	}

	/**
	 * @param {IRExprRegistry} registry 
	 * @returns {IRExpr}
	 */
	simplifyTopology(registry) {
		throw new Error("not yet implemented");
	}

	/**
	 * @returns {UplcTerm}
	 */
	toUplc() {
		throw new Error("not yet implemented");
	}
}

/**
 * Intermediate Representation variable reference expression
 * @package
 */
class IRNameExpr extends IRExpr {
	#name;

	/**
	 * @type {?number} - cached debruijn index 
	 */
	#index;

	/**
	 * @type {?IRVariable} - cached variable
	 */
	#variable;

	/**
	 * @type {?IRValue} - cached eval result (reused when eval is called within simplifyLiterals)
	 */
	#value;

	/**
	 * @param {Word} name 
	 * @param {?IRVariable} variable
	 * @param {?IRValue} value
	 */
	constructor(name, variable = null, value = null) {
		super(name.site);
		assert(name.toString() != "_");
		assert(!name.toString().startsWith("undefined"));
		this.#name = name;
		this.#index = null;
		this.#variable = variable;
		this.#value = value;
	}

	/**
	 * @type {string}
	 */
	get name() {
		return this.#name.toString();
	}

	/**
	 * isVariable() should be used to check if a IRNameExpr.variable is equal to a IRVariable (includes special handling of "__core*")
	 * @type {IRVariable}
	 */
	get variable() {
		if (this.#variable === null) {
			throw new Error(`variable should be set (name: ${this.name})`);
		} else {
			return this.#variable;
		}
	}

	/**
	 * @package
	 * @returns {boolean}
	 */
	isCore() {
		const name = this.name;

		return name.startsWith("__core");
	}

	/**
	 * @param {IRVariable} ref 
	 * @returns {boolean}
	 */
	isVariable(ref) {
		if (this.isCore()) {
			return false;
		} else {
			return this.variable === ref;
		}
	}

	/**
	 * @param {string} indent 
	 * @returns {string}
	 */
	toString(indent = "") {
		return this.#name.toString();
	}

	/**
	 * @param {IRScope} scope
	 */
	resolveNames(scope) {
		if (!this.name.startsWith("__core")) {
			if (this.#variable == null || this.name.startsWith("__PARAM")) {
				[this.#index, this.#variable] = scope.get(this.#name);
			} else {
				[this.#index, this.#variable] = scope.get(this.#variable);
			}
		}
	}

	/**
	 * @param {IRCallStack} stack 
	 * @returns {IRExpr}
	 */
	evalConstants(stack) {
		if (this.#variable != null) {
			this.#value = stack.get(this.#variable);
		}

		return this;
	}

	/**
	 * @param {IRCallStack} stack
	 * @returns {?IRValue}
	 */
	eval(stack) {
		if (this.isCore()) {
			return new IRFuncValue((args) => {
				return IRCoreCallExpr.evalValues(this.site, stack.throwRTErrors, this.#name.value.slice("__core__".length), args);
			});
		} else if (this.#variable === null) {
			throw new Error("variable should be set");
		} else {
			// prefer result from stack, and use cached result as backup
			const result = stack.get(this.#variable);

			if (result == null) {
				return this.#value;
			} else {
				return result;
			}
		}
	}

	/**
	 * @param {IRLiteralRegistry} literals
	 * @returns {IRExpr}
	 */
	simplifyLiterals(literals) {
		if (this.#variable !== null && literals.has(this.#variable)) {
			return assertDefined(literals.get(this.#variable));
		} else if (this.#value instanceof IRLiteralExpr) {
			return this.#value;
		} else {
			return this;
		}
	}

	/**
	 * @param {IRNameExprRegistry} nameExprs
	 */
	registerNameExprs(nameExprs) {
		nameExprs.register(this);
	}

	/**
	 * @param {Map<IRVariable, IRVariable>} newVars
	 * @returns {IRExpr}
	 */
	copy(newVars) {
		let v = this.#variable;

		if (v != null) {
			const maybeNewVar = newVars.get(v);

			if (maybeNewVar != undefined) {
				v = maybeNewVar;
			}
		}

		return new IRNameExpr(this.#name, v, this.#value);
	}

	/**
	 * @param {IRExprRegistry} registry 
	 * @returns {IRExpr}
	 */
	simplifyTopology(registry) {
		if (!this.isCore() && registry.isInlineable(this.variable)) {
			return registry.getInlineable(this.variable);
		} else {
			return this;
		}
	}

	/**
	 * @returns {UplcTerm}
	 */
	toUplc() {
		if (this.name.startsWith("__core")) {
			return IRCoreCallExpr.newUplcBuiltin(this.site, this.name);
		} else if (this.#index === null) {
			// use a dummy index (for size calculation)
			return new UplcVariable(
				this.site,
				new UplcInt(this.site, BigInt(0), false),
			);
		} else {
			return new UplcVariable(
				this.site,
				new UplcInt(this.site, BigInt(this.#index), false),
			);
		}
	}
}

/**
 * IR wrapper for UplcValues, representing literals
 * @package
 */
class IRLiteralExpr extends IRExpr {
	/**
	 * @type {UplcValue}
	 */
	#value;

	/**
	 * @param {UplcValue} value 
	 */
	constructor(value) {
		super(value.site);

		this.#value = value;
	}

	/**
	 * @type {UplcValue}
	 */
	get value() {
		return this.#value;
	}

	/**
	 * @param {string} indent 
	 * @returns {string}
	 */
	toString(indent = "") {
		return this.#value.toString();
	}

	/**
	 * Linking doesn't do anything for literals
	 * @param {IRScope} scope 
	 */
	resolveNames(scope) {
	}

	/**
	 * @param {IRCallStack} stack
	 */
	evalConstants(stack) {
		return this;
	}

	/**
	 * @param {IRCallStack} stack
	 * @returns {?IRValue}
	 */
	eval(stack) {
		return new IRLiteralValue(this.value);
	}

	/**
	 * @param {IRLiteralRegistry} literals
	 * @returns {IRExpr}
	 */
	simplifyLiterals(literals) {
		return this;
	}

	/**
	 * @param {IRNameExprRegistry} nameExprs
	 */
	registerNameExprs(nameExprs) {
	}

	/**
	 * @param {Map<IRVariable, IRVariable>} newVars
	 * @returns {IRExpr}
	 */
	copy(newVars) {
		return new IRLiteralExpr(this.#value);
	}

	/**
	 * @param {IRExprRegistry} registry 
	 * @returns {IRExpr}
	 */
	simplifyTopology(registry) {
		return this;
	}

	/**
	 * @returns {UplcConst}
	 */
	toUplc() {
		return new UplcConst(this.#value);
	}
}

/**
 * The IRExpr simplify methods aren't implemented because any IRConstExpr instances should've been eliminated during evalConstants.
 * @package
 */
class IRConstExpr extends IRExpr {
	#expr;

	/**
	 * @param {Site} site 
	 * @param {IRExpr} expr 
	 */
	constructor(site, expr) {
		super(site);
		this.#expr = expr;
	}

	toString(indent = "") {
		return `const(${this.#expr.toString(indent)})`;
	}

	/**
	 * @param {IRScope} scope 
	 */
	resolveNames(scope) {
		this.#expr.resolveNames(scope);
	}

	/**
	 * @param {IRCallStack} stack
	 * @returns {IRExpr}
	 */
	evalConstants(stack) {
		const result = this.#expr.eval(stack);

		if (result != null) {
			return new IRLiteralExpr(result.value);
		} else {
			throw new Error("unable to evaluate const");
		}
	}

	/**
	 * @param {IRCallStack} stack 
	 * @returns {?IRValue}
	 */
	eval(stack) {
		return this.#expr.eval(stack);
	}
}

/**
 * IR function expression with some args, that act as the header, and a body expression
 * @package
 */
class IRFuncExpr extends IRExpr {
	#args;
	#body;

	/**
	 * @param {Site} site 
	 * @param {IRVariable[]} args 
	 * @param {IRExpr} body 
	 */
	constructor(site, args, body) {
		super(site);
		this.#args = args;
		this.#body = assertDefined(body);
	}

	get args() {
		return this.#args.slice();
	}

	get body() {
		return this.#body;
	}

	/**
	 * @returns {boolean}
	 */
	hasOptArgs() {
		const b = this.#args.some(a => a.name.startsWith("__useopt__"));

		if (b) {
			return b;
		}

		if (this.#body instanceof IRFuncExpr) {
			return this.#body.hasOptArgs();
		} else {
			return false;
		}
	}

	/**
	 * @param {string} indent 
	 * @returns {string}
	 */
	toString(indent = "") {
		let innerIndent = (this.#body instanceof IRUserCallExpr && this.#body.argExprs.length == 1 && this.#body.fnExpr instanceof IRFuncExpr && this.#body.fnExpr.args[0].name.startsWith("__")) ? indent : indent + TAB;

		let s = "(" + this.#args.map(n => n.toString()).join(", ") + ") -> {\n" + innerIndent;
		s += this.#body.toString(innerIndent);
		s += "\n" + indent + "}";

		return s;
	}

	/**
	 * @param {IRScope} scope 
	 */
	resolveNames(scope) {
		// in the zero-arg case no Debruijn indices need to be added because we use Delay/Force

		for (let arg of this.#args) {
			scope = new IRScope(scope, arg);
		}

		this.#body.resolveNames(scope);
	}

	/**
	 * @param {IRCallStack} stack 
	 */
	evalConstants(stack) {
		return new IRFuncExpr(this.site, this.args, this.#body.evalConstants(stack));
	}

	/**
	 * @param {IRCallStack} stack
	 * @returns {?IRValue}
	 */
	eval(stack) {
		return new IRFuncValue((args) => {
			if (args.length != this.#args.length) {
				throw this.site.syntaxError(`expected ${this.#args.length} arg(s), got ${args.length} arg(s)`);
			}

			for (let i = 0; i < args.length; i++) {
				stack = stack.set(this.#args[i], args[i]);
			}

			return this.#body.eval(stack);
		});
	}

	/**
	 * @param {IRLiteralRegistry} literals 
	 * @returns {IRExpr}
	 */
	simplifyLiterals(literals) {
		return new IRFuncExpr(this.site, this.args, this.#body.simplifyLiterals(literals));
	}
	
	/**
	 * @param {IRNameExprRegistry} nameExprs
	 */
	registerNameExprs(nameExprs) {
		nameExprs = nameExprs.resetVariables();

		this.#args.forEach(a => nameExprs.registerVariable(a));

		this.#body.registerNameExprs(nameExprs);
	}

	/**
	 * @param {Map<IRVariable, IRVariable>} newVars
	 * @returns {IRExpr}
	 */
	copy(newVars) {
		return new IRFuncExpr(this.site, this.args.map(oldArg => oldArg.copy(newVars)), this.#body.copy(newVars));
	}

	/**
	 * @param {IRExprRegistry} registry 
	 * @returns {IRExpr}
	 */
	simplifyTopology(registry) {
		return new IRFuncExpr(this.site, this.args, this.#body.simplifyTopology(registry));
	}

	/** 
	 * @returns {UplcTerm}
	 */
	toUplc() {
		let term = this.#body.toUplc();

		if (this.#args.length == 0) {
			// a zero-arg func is turned into a UplcDelay term
			term = new UplcDelay(this.site, term);
		} else {
			for (let i = this.#args.length - 1; i >= 0; i--) {
				term = new UplcLambda(this.site, term, this.#args[i].toString());
			}
		}

		return term;
	}
}

/**
 * Base class of IRUserCallExpr and IRCoreCallExpr
 * @package
 */
class IRCallExpr extends IRExpr {
	#argExprs;
	#parensSite;

	/**
	 * @param {Site} site
	 * @param {IRExpr[]} argExprs 
	 * @param {Site} parensSite 
	 */
	constructor(site, argExprs, parensSite) {
		super(site);
		this.#argExprs = argExprs;
		this.#parensSite = parensSite;
		
	}

	get argExprs() {
		return this.#argExprs.slice();
	}

	get parensSite() {
		return this.#parensSite;
	}

	/**
	 * @param {string} indent 
	 * @returns {string}
	 */
	argsToString(indent = "") {
		return this.#argExprs.map(argExpr => argExpr.toString(indent)).join(", ")
	}

	/**
	 * @param {IRScope} scope 
	 */
	resolveNamesInArgs(scope) {
		for (let argExpr of this.#argExprs) {
			argExpr.resolveNames(scope);
		}
	}

	/**
	 * @param {IRCallStack} stack 
	 * @returns {IRExpr[]}
	 */
	evalConstantsInArgs(stack) {
		return this.#argExprs.map(a => a.evalConstants(stack));
	}

	/** 
	 * @param {IRCallStack} stack
	 * @returns {?IRValue[]} 
	 */
	evalArgs(stack) {
		/**
		 * @type {IRValue[]}
		 */
		let args = [];

		for (let argExpr of this.argExprs) {
			let argVal = argExpr.eval(stack);
			if (argVal !== null) {
				args.push(argVal);
			} else {
				return null;
			}
		}

		return args;
	}

	/**
	 * @param {IRLiteralRegistry} literals
	 * @returns {IRExpr[]}
	 */
	simplifyLiteralsInArgs(literals) {
		return this.#argExprs.map(a => a.simplifyLiterals(literals));
	}

	/**
	 * @param {IRNameExprRegistry} nameExprs 
	 */
	registerNameExprsInArgs(nameExprs) {
		this.#argExprs.forEach(a => a.registerNameExprs(nameExprs));
	}

	/**
	 * @param {IRExprRegistry} registry 
	 * @returns {IRExpr[]}
	 */
	simplifyTopologyInArgs(registry) {
		return this.#argExprs.map(a => a.simplifyTopology(registry));
	}

	/**
	 * @param {UplcTerm} term
	 * @returns {UplcTerm}
	 */
	toUplcCall(term) {
		if (this.#argExprs.length == 0) {
			// assuming underlying zero-arg function has been converted into a UplcDelay term
			term = new UplcForce(this.site, term);
		} else {
			for (let argExpr of this.#argExprs) {
				term = new UplcCall(this.site, term, argExpr.toUplc());
			}
		}

		return term;
	}
}

/**
 * IR function call of core functions
 * @package
 */
class IRCoreCallExpr extends IRCallExpr {
	#name;

	/**
	 * @param {Word} name 
	 * @param {IRExpr[]} argExprs 
	 * @param {Site} parensSite 
	 */
	constructor(name, argExprs, parensSite) {
		super(name.site, argExprs, parensSite);
		assert(name.value !== "" && name.value !== "error");
		this.#name = name;

		assert(this.builtinName !== "", name.value);
	}

	get builtinName() {
		return this.#name.toString().slice(8);
	}

	/**
	 * @returns {boolean}
	 */
	isCast() {
		let name = this.builtinName;

		return name == "iData" || name == "bData" || name == "unIData" || name == "unBData" || name == "mapData" || name == "unMapData" || name == "listData" || name == "unListData";
	}

	/**
	 * @param {string} indent
	 * @returns {string}
	 */
	toString(indent = "") {
		if (this.builtinName == "ifThenElse") {
			return `${this.#name.toString()}(\n${indent}${TAB}${this.argExprs[0].toString(indent + TAB)},\n${indent}${TAB}${this.argExprs[1].toString(indent + TAB)},\n${indent}${TAB}${this.argExprs[2].toString(indent+TAB)}\n${indent})`;
		} else {
			return `${this.#name.toString()}(${this.argsToString(indent)})`;
		}
	}

	/**
	 * @param {IRScope} scope 
	 */
	resolveNames(scope) {
		this.resolveNamesInArgs(scope);
	}

	/**
	 * @param {Site} site
	 * @param {boolean} throwRTErrors
	 * @param {string} builtinName
	 * @param {IRValue[]} args 
	 * @returns {?IRValue}
	 */
	static evalValues(site, throwRTErrors, builtinName, args) {
		if (builtinName == "ifThenElse") {
			let cond = args[0].value;
			if (cond !== null && cond instanceof UplcBool) {
				if (cond.bool) {
					return args[1];
				} else {
					return args[2];
				}
			} else {
				return null;
			}
		} else if (builtinName == "chooseList") {
			const lst = args[0].value;

			if (lst !== null && lst instanceof UplcList) {
				if (lst.length == 0) {
					return args[1];
				} else {
					return args[2];
				}
			} else {
				return null;
			}
		} else if (builtinName == "trace") {
			return args[1];
		} else {
			/**
			 * @type {UplcValue[]}
			 */
			let argValues = [];

			for (let arg of args) {
				if (arg.value !== null) {
					argValues.push(arg.value);
				} else {
					return null;
				}
			}

			try {
				let result = UplcBuiltin.evalStatic(new Word(Site.dummy(), builtinName), argValues);

				return new IRLiteralValue(result);
			} catch(e) {
				// runtime errors like division by zero are allowed if throwRTErrors is false
				if (e instanceof RuntimeError) {
					if (!throwRTErrors) {
						return null;
					} else {
						throw e.addTraceSite(site);
					}
				} else {
					throw e;
				}
			}
		}
	}

	/**
	 * @param {IRCallStack} stack 
	 * @returns {IRExpr}
	 */
	evalConstants(stack) {
		return new IRCoreCallExpr(this.#name, this.evalConstantsInArgs(stack), this.parensSite);
	}
	
	/**
	 * @param {IRCallStack} stack
	 * @returns {?IRValue}
	 */
	eval(stack) {
		let args = this.evalArgs(stack);

		if (args !== null) {
			return IRCoreCallExpr.evalValues(this.site, stack.throwRTErrors, this.builtinName, args);
		}
		
		return null;
	}

	/**
	 * @param {IRLiteralRegistry} literals
	 * @returns {IRExpr}
	 */
	simplifyLiterals(literals) {
		const args = this.simplifyLiteralsInArgs(literals);

		if (args.length > 0 && args.every(a => a instanceof IRLiteralExpr)) {
			try {
				const res = IRCoreCallExpr.evalValues(
					this.site,
					false,
					this.builtinName,
					args.map(a => new IRLiteralValue(assertClass(a, IRLiteralExpr).value))
				);

				if (res != null) {
					return new IRLiteralExpr(res.value);
				}
			} catch (e) {
			}
		}

		switch(this.builtinName) {
			case "addInteger": {
					// check if first or second arg evaluates to 0
					const [a, b] = args;

					if (a instanceof IRLiteralExpr && a.value instanceof UplcInt && a.value.int == 0n) {
						return b;
					} else if (b instanceof IRLiteralExpr && b.value instanceof UplcInt && b.value.int == 0n) {
						return a;
					}
				}
				break;
			case "appendByteString": {
					// check if either 1st or 2nd arg is the empty bytearray
					const [a, b] = args;
					if (a instanceof IRLiteralExpr && a.value instanceof UplcByteArray && a.value.bytes.length == 0) {
						return b;
					} else if (b instanceof IRLiteralExpr && b.value instanceof UplcByteArray && b.value.bytes.length == 0) {
						return a;
					}
				}
				break;
			case "appendString": {
					// check if either 1st or 2nd arg is the empty string
					const [a, b] = args;
					if (a instanceof IRLiteralExpr && a.value instanceof UplcString && a.value.string.length == 0) {
						return b;
					} else if (b instanceof IRLiteralExpr && b.value instanceof UplcString && b.value.string.length == 0) {
						return a;
					}
				}
				break;
			case "divideInteger": {
					// check if second arg is 1
					const [a, b] = args;
					if (b instanceof IRLiteralExpr && b.value instanceof UplcInt) {
						if (b.value.int == 1n) {
							return a;
						} else if (b.value.int == 0n) {
							return new IRCoreCallExpr(this.#name, args, this.parensSite);
						}
					}
				}
				break;
			case "ifThenElse": {
					const [cond, a, b] = args;

					if (cond instanceof IRLiteralExpr && cond.value instanceof UplcBool) {
						// if the condition is a literal, one the branches can be returned
						if (cond.value.bool) {
							return a;
						} else {
							return b;
						}
					} else if (a instanceof IRLiteralExpr && a.value instanceof UplcBool && b instanceof IRLiteralExpr && b.value instanceof UplcBool) {
						if (a.value.bool && !b.value.bool) {
							return cond;
						} else if (
							!a.value.bool && 
							b.value.bool && 
							cond instanceof IRUserCallExpr && 
							cond.fnExpr instanceof IRNameExpr && 
							cond.fnExpr.name === "__helios__common__not"
						) {
							return cond.argExprs[0];
						}	
					}
				}
				break;
			case "modInteger": {
					// check if second arg is 1
					const [a, b] = args;
					if (b instanceof IRLiteralExpr && b.value instanceof UplcInt && b.value.int == 1n) {
						return new IRLiteralExpr(new UplcInt(this.site, 0n));
					}
				}
				break;
			case "multiplyInteger": {
					// check if first arg is 0 or 1
					const [a, b] = args;
					if (a instanceof IRLiteralExpr && a.value instanceof UplcInt) {
						if (a.value.int == 0n) {
							return a;
						} else if (a.value.int == 1n) {
							return b;
						}
					} else if (b instanceof IRLiteralExpr && b.value instanceof UplcInt) {
						if (b.value.int == 0n) {
							return b;
						} else if (b.value.int == 1n) {
							return a;
						}
					}
				}
				break;
			case "subtractInteger": {
					// check if second arg evaluates to 0
					const [a, b] = args;
					if (b instanceof IRLiteralExpr && b.value instanceof UplcInt && b.value.int == 0n) {
						return a;
					}
				}
				break;
		}

		if (args.every(a => a instanceof IRLiteralExpr)) {
			return new IRLiteralExpr(
				UplcBuiltin.evalStatic(
					new Word(this.#name.site, this.builtinName),
					args.map(a => assertClass(a, IRLiteralExpr).value)
				)
			);
		} else {
			return new IRCoreCallExpr(this.#name, args, this.parensSite);
		}
	}

	/**
	 * @param {IRNameExprRegistry} nameExprs
	 */
	registerNameExprs(nameExprs) {
		this.registerNameExprsInArgs(nameExprs);
	}

	/**
	 * @param {Map<IRVariable, IRVariable>} newVars
	 * @returns {IRExpr}
	 */
	copy(newVars) {
		return new IRCoreCallExpr(this.#name, this.argExprs.map(a => a.copy(newVars)), this.parensSite);
	}

	/**
	 * @param {IRExprRegistry} registry 
	 * @returns {IRExpr}
	 */
	simplifyTopology(registry) {
		const args = this.simplifyTopologyInArgs(registry);

		switch(this.builtinName) {
			case "encodeUtf8":
				// we can't eliminate a call to decodeUtf8, as it might throw some errors
				break;
			case "decodeUtf8": {
				// check if arg is a call to encodeUtf8
				const [arg] = args;
				if (arg instanceof IRCoreCallExpr && arg.builtinName == "encodeUtf8") {
					return arg.argExprs[0];
				}
				
				break;
			}		
			case "equalsData": {
				const [a, b] = args;

				if (a instanceof IRCoreCallExpr && b instanceof IRCoreCallExpr) {
					if (a.builtinName === "iData" && b.builtinName === "iData") {
						return new IRCoreCallExpr(new Word(this.site, "__core__equalsInteger"), [a.argExprs[0], b.argExprs[0]], this.parensSite);	
					} else if (a.builtinName === "bData" && b.builtinName === "bData") {
						return new IRCoreCallExpr(new Word(this.site, "__core__equalsByteString"), [a.argExprs[0], b.argExprs[0]], this.parensSite);	
					} else if (a.builtinName === "decodeUtf8" && b.builtinName === "decodeUtf8") {
						return new IRCoreCallExpr(new Word(this.site, "__core__equalsString"), [a.argExprs[0], b.argExprs[0]], this.parensSite);
					}
				}

				break;
			}
			case "ifThenElse": {
				const [cond, a, b] = args;

				if (cond instanceof IRCoreCallExpr && cond.builtinName === "nullList") {
					return new IRCoreCallExpr(new Word(this.site, "__core__chooseList"), [cond.argExprs[0], a, b], this.parensSite);
				}

				break;
			}
			case "trace":
				return args[1];
			case "unIData": {
				// check if arg is a call to iData
				const a = args[0];
				if (a instanceof IRCoreCallExpr && a.builtinName == "iData") {
					return a.argExprs[0];
				}

				break;
			}
			case "iData": {
				// check if arg is a call to unIData
				const a = args[0];
				if (a instanceof IRCoreCallExpr && a.builtinName == "unIData") {
					return a.argExprs[0];
				}

				break;
			}
			case "unBData": {
				// check if arg is a call to bData
				const a = args[0];
				if (a instanceof IRCoreCallExpr && a.builtinName == "bData") {
					return a.argExprs[0];
				}

				break;
			}
			case "bData": {
				// check if arg is a call to unBData
				const a = args[0];
				if (a instanceof IRCoreCallExpr && a.builtinName == "unBData") {
					return a.argExprs[0];
				}

				break;
			}
			case "unMapData": {
				// check if arg is call to mapData
				const a = args[0];
				if (a instanceof IRCoreCallExpr && a.builtinName == "mapData") {
					return a.argExprs[0];
				}
				
				break;
			}
			case "mapData": {
				// check if arg is call to unMapData
				const a = args[0];
				if (a instanceof IRCoreCallExpr && a.builtinName == "unMapData") {
					return a.argExprs[0];
				}

				break;
			}
			case "listData": {
				// check if arg is call to unListData
				const a = args[0];
				if (a instanceof IRCoreCallExpr && a.builtinName == "unListData") {
					return a.argExprs[0];
				}

				break;
			}
			case "unListData": {
				// check if arg is call to listData
				const a = args[0];
				if (a instanceof IRCoreCallExpr && a.builtinName == "listData") {
					return a.argExprs[0];
				}
				
				break;
			}		
		}

		return new IRCoreCallExpr(this.#name, args, this.parensSite);
	}

	/**
	 * @param {Site} site
	 * @param {string} name - full name of builtin, including prefix
	 * @returns {UplcTerm}
	 */
	static newUplcBuiltin(site, name) {
		let builtinName = name.slice("__core__".length);
		assert(!builtinName.startsWith("__core__"));

		/**
		 * @type {UplcTerm}
		 */
		let term = new UplcBuiltin(site, builtinName);

		let nForce = UPLC_BUILTINS[IRScope.findBuiltin(name)].forceCount;
 
		for (let i = 0; i < nForce; i++) {
			term = new UplcForce(site, term);
		}
 
		return term;
	}

	/**
	 * @returns {UplcTerm}
	 */
	toUplc() {
		let term = IRCoreCallExpr.newUplcBuiltin(this.site, this.#name.value);

		return this.toUplcCall(term);
	}
}

/**
 * IR function call of non-core function
 * @package
 */
class IRUserCallExpr extends IRCallExpr {
	#fnExpr;

	/**
	 * @param {IRExpr} fnExpr 
	 * @param {IRExpr[]} argExprs 
	 * @param {Site} parensSite 
	 */
	constructor(fnExpr, argExprs, parensSite) {
		super(fnExpr.site, argExprs, parensSite);

		this.#fnExpr = fnExpr;
	}

	/**
	 * @param {IRExpr} fnExpr 
	 * @param {IRExpr[]} argExprs 
	 * @param {Site} parensSite 
	 * @returns {IRUserCallExpr}
	 */
	static new(fnExpr, argExprs, parensSite) {
		if (fnExpr instanceof IRAnonCallExpr) {
			return new IRNestedAnonCallExpr(fnExpr, argExprs, parensSite);
		} else if (fnExpr instanceof IRFuncExpr) {
			if (argExprs.length == 1 && argExprs[0] instanceof IRFuncExpr) {
				const argExpr = argExprs[0];

				if (argExpr instanceof IRFuncExpr) {
					return new IRFuncDefExpr(fnExpr, argExpr, parensSite);
				}
			}

			return new IRAnonCallExpr(fnExpr, argExprs, parensSite);
		} else {
			return new IRUserCallExpr(fnExpr, argExprs, parensSite);
		}
	}

	get fnExpr() {
		return this.#fnExpr;
	}

	/**
	 * @param {string} indent
	 * @returns {string}
	 */
	toString(indent = "") {
		let comment = (this.#fnExpr instanceof IRFuncExpr && this.#fnExpr.args.length == 1 && this.#fnExpr.args[0].name.startsWith("__")) ? `/*${this.#fnExpr.args[0].name}*/` : "";

		return `${this.#fnExpr.toString(indent)}(${comment}${this.argsToString(indent)})`;
	}

	/**
	 * @param {IRScope} scope 
	 */
	resolveNames(scope) {
		this.#fnExpr.resolveNames(scope);

		super.resolveNamesInArgs(scope);
	}

	/**
	 * @param {IRCallStack} stack
	 * @returns {IRExpr}
	 */
	evalConstants(stack) {
		return IRUserCallExpr.new(
			this.#fnExpr.evalConstants(stack),
			this.evalConstantsInArgs(stack),
			this.parensSite
		);
	}

	/**
	 * @param {IRCallStack} stack 
	 * @returns {?IRValue}
	 */
	eval(stack) {
		let args = this.evalArgs(stack);

		if (args === null) {
			return null;
		} else {
			let fn = this.#fnExpr.eval(stack);

			if (fn === null) {
				return null;
			} else {
				try {
					return fn.call(args);
				} catch (e) {
					if (e instanceof RuntimeError) {
						if (!stack.throwRTErrors) {
							return null;
						} else {
							throw e.addTraceSite(this.site);
						}
					} else {
						throw e;
					}
				}
			}
		}
	}

	/**
	 * @param {IRLiteralRegistry} literals
	 * @returns {(IRExpr[] | IRLiteralExpr)}
	 */
	simplifyLiteralsInArgsAndTryEval(literals) {
		const args = this.simplifyLiteralsInArgs(literals);

		if (args.length > 0 && args.every(a => ((a instanceof IRLiteralExpr) || (a instanceof IRFuncExpr)))) {
			try {
				const fn = this.#fnExpr.eval(new IRCallStack(false));

				if (fn != null) {
					const res = fn.call(
						args.map(a => {
							const v = a.eval(new IRCallStack(false));

							if (v == null) {
								// caught by outer catch
								throw new Error("null eval sub-result");
							} else {
								return v;
							}
						})
					);

					if (res != null) {
						return new IRLiteralExpr(res.value);
					}
				}
			} catch(e) {
			}
		}

		return args;
	}

	/**
	 * @param {IRLiteralRegistry} literals
	 * @returns {IRExpr}
	 */
	simplifyLiterals(literals) {
		const argsOrLiteral = this.simplifyLiteralsInArgsAndTryEval(literals);

		if (argsOrLiteral instanceof IRLiteralExpr) {
			return argsOrLiteral;
		} else {
			const args = argsOrLiteral;

			return IRUserCallExpr.new(
				this.#fnExpr.simplifyLiterals(literals),
				args, 
				this.parensSite
			);
		}
	}

	/**
	 * @param {IRNameExprRegistry} nameExprs 
	 */
	registerNameExprs(nameExprs) {
		this.registerNameExprsInArgs(nameExprs);
		
		this.#fnExpr.registerNameExprs(nameExprs);
	}

	/**
	 * @param {Map<IRVariable, IRVariable>} newVars 
	 * @returns {IRExpr}
	 */
	copy(newVars) {
		return new IRUserCallExpr(this.#fnExpr.copy(newVars), this.argExprs.map(a => a.copy(newVars)), this.parensSite);
	}

	/**
	 * @param {IRExprRegistry} registry 
	 * @returns {IRExpr}
	 */
	simplifyTopology(registry) {
		const args = this.simplifyTopologyInArgs(registry);

		if (this.#fnExpr instanceof IRNameExpr) {
			if (this.#fnExpr.isCore()) {
				return new IRCoreCallExpr(new Word(this.#fnExpr.site, this.#fnExpr.name), args, this.parensSite);
			} else {
				switch (this.#fnExpr.name) {
					case "__helios__common__boolData": {
							// check if arg is a call to __helios__common__unBoolData
							const a = args[0];
							if (a instanceof IRUserCallExpr && a.fnExpr instanceof IRNameExpr && a.fnExpr.name == "__helios__common__unBoolData") {
								return a.argExprs[0];
							}
						}
						break;
					case "__helios__common__unBoolData": {
							// check if arg is a call to __helios__common__boolData
							const a = args[0];
							if (a instanceof IRUserCallExpr && a.fnExpr instanceof IRNameExpr && a.fnExpr.name == "__helios__common__boolData") {
								return a.argExprs[0];
							}
						}
						break;
					case "__helios__common__not": {
							const a = args[0];
							if (a instanceof IRUserCallExpr && a.fnExpr instanceof IRNameExpr && a.fnExpr.name == "__helios__common__not") {
								return a.argExprs[0];
							}
						}
						break;
					case "__helios__common__concat": {
							// check if either 1st or 2nd arg is the empty list
							const [a, b] = args;
							if (a instanceof IRLiteralExpr && a.value instanceof UplcList && a.value.length == 0) {
								return b;
							} else {
								if (b instanceof IRLiteralExpr && b.value instanceof UplcList && b.value.length == 0) {
									return a;
								}
							}
						}
						break;
				}
			}
		}

		return IRUserCallExpr.new(
			this.#fnExpr.simplifyTopology(registry),
			args,
			this.parensSite
		);
	}

	/**
	 * @returns {UplcTerm}
	 */
	toUplc() {
		return super.toUplcCall(this.#fnExpr.toUplc());
	}
}

export class IRAnonCallExpr extends IRUserCallExpr {
	#anon;

	/**
	 * @param {IRFuncExpr} fnExpr 
	 * @param {IRExpr[]} argExprs 
	 * @param {Site} parensSite 
	 */
	constructor(fnExpr, argExprs, parensSite) {
		super(fnExpr, argExprs, parensSite)

		this.#anon = fnExpr;
	}

	/**
	 * Internal function
	 * @type {IRFuncExpr}
	 */
	get anon() {
		return this.#anon;
	}

	/**
	 * @type {IRVariable[]}
	 */
	get argVariables() {
		return this.#anon.args;
	}

	/**
	 * Add args to the stack as IRDeferredValue instances
	 * @param {IRCallStack} stack
	 */
	evalConstants(stack) {
		const argExprs = this.evalConstantsInArgs(stack);

		const parentStack = stack;

		argExprs.forEach((argExpr, i) => {
			stack = stack.set(this.argVariables[i], new IRDeferredValue(() => argExpr.eval(parentStack)));
		});

		const anonBody = this.#anon.body.evalConstants(stack);

		if (anonBody instanceof IRLiteralExpr) {
			return anonBody;
		} else {
			return IRUserCallExpr.new(
				new IRFuncExpr(
					this.#anon.site,
					this.#anon.args,
					anonBody
				),
				argExprs,
				this.parensSite
			);
		}
	}

	/**
	 * Add literal args to the map
	 * @param {IRLiteralRegistry} literals
	 * @returns {IRExpr}
	 */
	simplifyLiterals(literals) {
		const argsOrLiteral = super.simplifyLiteralsInArgsAndTryEval(literals);

		if (argsOrLiteral instanceof IRLiteralExpr) {
			return argsOrLiteral;
		} else {
			const args = argsOrLiteral;

			args.forEach((arg, i) => {
				if (arg instanceof IRLiteralExpr) {
					literals.set(this.argVariables[i], arg);
				}
			});

			const anonBody = this.#anon.body.simplifyLiterals(literals);

			if (anonBody instanceof IRLiteralExpr) {
				return anonBody;
			} else {
				return new IRAnonCallExpr(
					new IRFuncExpr(
						this.#anon.site,
						this.#anon.args,
						anonBody
					),
					args,
					this.parensSite
				);
			}
		}
	}

	/**
	 * @param {IRNameExprRegistry} nameExprs 
	 */
	registerNameExprs(nameExprs) {
		this.registerNameExprsInArgs(nameExprs);

		this.argVariables.forEach(a => nameExprs.registerVariable(a));

		this.#anon.body.registerNameExprs(nameExprs);
	}
	
	/**
	 * @param {IRExprRegistry} registry 
	 * @returns {IRExpr}
	 */
	simplifyTopology(registry) {
		const args = this.simplifyTopologyInArgs(registry);

		// remove unused args, inline args that are only referenced once, inline all IRNameExprs, inline function with default args 
		const remainingIds = this.argVariables.map((variable, i) => {
			const n = registry.countReferences(variable);

			const arg = args[i];

			if (
				n == 0 
				|| (n == 1 && (!registry.maybeInsideLoop(variable) || arg instanceof IRFuncExpr)) 
				|| arg instanceof IRNameExpr 
				|| (arg instanceof IRFuncExpr && arg.hasOptArgs())
			) {
				if (n > 0) {
					// inline
					registry.addInlineable(variable, arg);
				}

				return -1;
			} else {
				return i;
			}
		}).filter(i => i != -1);

		const remainingVars = remainingIds.map(i => this.argVariables[i]);
		const remainingExprs = remainingIds.map(i => args[i]);

		const anonBody = this.#anon.body.simplifyTopology(registry);

		if (anonBody instanceof IRLiteralExpr || remainingExprs.length == 0) {
			return anonBody;
		} else {
			return new IRAnonCallExpr(
				new IRFuncExpr(
					this.#anon.site,
					remainingVars,
					anonBody
				),
				remainingExprs,
				this.parensSite
			);
		}
	}
}

export class IRNestedAnonCallExpr extends IRUserCallExpr {
	#anon;

	/**
	 * @param {IRAnonCallExpr} anon
	 * @param {IRExpr[]} outerArgExprs
	 * @param {Site} parensSite
	 */
	constructor(anon, outerArgExprs, parensSite) {
		super(anon, outerArgExprs, parensSite);

		this.#anon = anon;
	}

	/**
	 * Flattens consecutive nested calls
	 * @param {IRExprRegistry} registry
	 * @returns {IRExpr}
	 */
	simplifyTopology(registry) {
		const anon = this.#anon.simplifyTopology(registry);

		const args = this.simplifyTopologyInArgs(registry);

		if (anon instanceof IRAnonCallExpr && anon.anon.body instanceof IRFuncExpr) {
			// flatten
			const allArgs = anon.argExprs.slice().concat(args);
			const allVars = anon.argVariables.slice().concat(anon.anon.body.args.slice());

			assert(allArgs.length == allVars.length);

			return IRUserCallExpr.new(
				new IRFuncExpr(
					anon.anon.body.site,
					allVars,
					anon.anon.body.body
				),
				allArgs,
				this.parensSite
			);
		} else {
			return IRUserCallExpr.new(
				anon,
				args,
				this.parensSite
			);
		}
	}
}

export class IRFuncDefExpr extends IRAnonCallExpr {
	#def;

	/**
	 * @param {IRFuncExpr} fnExpr 
	 * @param {IRFuncExpr} defExpr 
	 * @param {Site} parensSite
	 */
	constructor(fnExpr, defExpr, parensSite) {
		super(fnExpr, [defExpr], parensSite);

		this.#def = defExpr;
	}
}

/**
 * Intermediate Representation error call (with optional literal error message)
 * @package
 */
class IRErrorCallExpr extends IRExpr {
	#msg;

	/**
	 * @param {Site} site 
	 * @param {string} msg 
	 */
	constructor(site, msg = "") {
		super(site);
		this.#msg = msg;
	}

	/**
	 * @param {string} indent 
	 * @returns {string}
	 */
	toString(indent = "") {
		return "error()";
	}

	/**
	 * @param {IRScope} scope 
	 */
	resolveNames(scope) {
	}

	/**
	 * @param {IRCallStack} stack
	 * @returns {IRExpr}
	 */
	evalConstants(stack) {
		return this;
	}

	/**
	 * @param {IRCallStack} stack
	 * @returns {?IRValue}
	 */
	eval(stack) {
		if (stack.throwRTErrors) {
			throw this.site.runtimeError(this.#msg);
		} else {
			return null;
		}
	}

	/**
	 * @param {IRLiteralRegistry} literals 
	 * @returns {IRExpr}
	 */
	simplifyLiterals(literals) {
		return this;
	}

	/**
	 * @param {IRNameExprRegistry} nameExprs
	 */
	registerNameExprs(nameExprs) {
	}

	/**
	 * @param {Map<IRVariable, IRVariable>} newVars 
	 * @returns {IRExpr}
	 */
	copy(newVars) {
		return new IRErrorCallExpr(this.site, this.#msg);
	}

	/**
	 * @param {IRExprRegistry} registry
	 * @returns {IRExpr}
	 */
	simplifyTopology(registry) {
		return this;
	}

	/**
	 * @returns {UplcTerm}
	 */
	toUplc() {
		return new UplcError(this.site, this.#msg);
	}
}


/////////////////////////////////////
// Section 22: IR AST build functions
/////////////////////////////////////

/**
 * Build an Intermediate Representation expression
 * @param {Token[]} ts 
 * @returns {IRExpr}
 * @package
 */
function buildIRExpr(ts) {
	/** @type {?IRExpr} */
	let expr = null;

	while (ts.length > 0) {
		let t = ts.shift();

		if (t === undefined) {
			throw new Error("unexpected");
		} else {
			if (t.isGroup("(") && ts.length > 0 && ts[0].isSymbol("->")) {
				assert(expr === null);

				ts.unshift(t);

				expr = buildIRFuncExpr(ts);
			} else if (t.isGroup("(")) {
				let group = t.assertGroup();

				if (expr === null) {
					if (group.fields.length == 1) {
						expr = buildIRExpr(group.fields[0])
					} else if (group.fields.length == 0) {
						expr = new IRLiteralExpr(new UplcUnit(t.site));
					} else {
						group.syntaxError("unexpected parentheses with multiple fields");
					}
				} else {
					let args = [];
					for (let f of group.fields) {
						args.push(buildIRExpr(f));
					}

					if (expr instanceof IRNameExpr && expr.name.startsWith("__core")) {
						if (!IRScope.isBuiltin(expr.name)) {
							throw expr.site.referenceError(`builtin '${expr.name}' undefined`);
						}

						expr = new IRCoreCallExpr(new Word(expr.site, expr.name), args, t.site);
					} else {
						expr = IRUserCallExpr.new(expr, args, t.site);
					}
				}
			} else if (t.isSymbol("-")) {
				// only makes sense next to IntegerLiterals
				let int = assertDefined(ts.shift());
				if (int instanceof IntLiteral) {
					expr = new IRLiteralExpr(new UplcInt(int.site, int.value * (-1n)));
				} else {
					throw int.site.typeError(`expected literal int, got ${int}`);
				}
			} else if (t instanceof BoolLiteral) {
				assert(expr === null);
				expr = new IRLiteralExpr(new UplcBool(t.site, t.value));
			} else if (t instanceof IntLiteral) {
				assert(expr === null);
				expr = new IRLiteralExpr(new UplcInt(t.site, t.value));
			} else if (t instanceof ByteArrayLiteral) {
				assert(expr === null);
				if (t.bytes.length == 0 && ts[0] != undefined && ts[0] instanceof ByteArrayLiteral) {
					// literal data is ##<...>
					const next = assertDefined(ts.shift());

					if (next instanceof ByteArrayLiteral) {
						expr = new IRLiteralExpr(new UplcDataValue(next.site, UplcData.fromCbor(next.bytes)));
					} else {
						throw new Error("unexpected");
					}
				} else {
					expr = new IRLiteralExpr(new UplcByteArray(t.site, t.bytes));
				}
			} else if (t instanceof StringLiteral) {
				assert(expr === null);
				expr = new IRLiteralExpr(new UplcString(t.site, t.value));
			} else if (t.isWord("const")) {
				assert(expr === null);

				let maybeGroup = ts.shift();
				if (maybeGroup === undefined) {
					throw t.site.syntaxError("expected parens after const");
				} else {
					let parens = maybeGroup.assertGroup("(", 1);
					let pts = parens.fields[0];

					expr = new IRConstExpr(t.site, buildIRExpr(pts));
				}
			} else if (t.isWord("error")) {
				assert(expr === null);

				let maybeGroup = ts.shift();
				if (maybeGroup === undefined) {
					throw t.site.syntaxError("expected parens after error");
				} else {
					let parens = maybeGroup.assertGroup("(", 1);
					let pts = parens.fields[0];

					if (pts.length != 1) {
						throw parens.syntaxError("error call expects a single literal string msg arg");
					}

					let msg = pts[0];
					if (!(msg instanceof StringLiteral)) {
						throw msg.syntaxError("error call expects literal string msg arg");
					}
					expr = new IRErrorCallExpr(t.site, msg.value);
				}
			} else if (t.isWord()) {
				assert(expr === null);
				expr = new IRNameExpr(t.assertWord());
			} else {
				throw new Error("unhandled untyped token " + t.toString());
			}
		}
	}

	if (expr === null) {
		throw new Error("expr is null");
	} else {
		return expr;
	}
}

/**
 * Build an IR function expression
 * @param {Token[]} ts 
 * @returns {IRFuncExpr}
 */
function buildIRFuncExpr(ts) {
	let maybeParens = ts.shift();
	if (maybeParens === undefined) {
		throw new Error("empty func expr");
	} else {
		let parens = maybeParens.assertGroup("(");

		assertDefined(ts.shift()).assertSymbol("->");
		let braces = assertDefined(ts.shift()).assertGroup("{");

		/**
		 * @type {Word[]}
		 */
		let argNames = [];

		for (let f of parens.fields) {
			assert(f.length == 1, "expected single word per arg");
			argNames.push(f[0].assertWord());
		}

		if (braces.fields.length > 1) {
			throw braces.syntaxError("unexpected comma in function body")
		} else if (braces.fields.length == 0) {
			throw braces.syntaxError("empty function body")
		}

		let bodyExpr = buildIRExpr(braces.fields[0]);

		return new IRFuncExpr(parens.site, argNames.map(a => new IRVariable(a)), bodyExpr)
	}
}


/////////////////////////
// Section 23: IR Program
/////////////////////////


/**
 * Wrapper for IRFuncExpr, IRCallExpr or IRLiteralExpr
 * @package
 */
class IRProgram {
	#expr;
	#purpose;

	/**
	 * @param {IRFuncExpr | IRCallExpr | IRLiteralExpr} expr
	 * @param {?number} purpose
	 */
	constructor(expr, purpose) {
		this.#expr = expr;
		this.#purpose = purpose;
	}

	/**
	 * @param {IRExpr} expr 
	 * @returns {IRFuncExpr | IRCallExpr | IRLiteralExpr}
	 */
	static assertValidRoot(expr) {
		if (expr instanceof IRFuncExpr || expr instanceof IRCallExpr || expr instanceof IRLiteralExpr) {
			return expr;
		} else {
			throw new Error("invalid IRExpr type for IRProgram");
		}
	}

	/**
	 * @package
	 * @param {IR} ir 
	 * @param {?number} purpose
	 * @param {boolean} simplify
	 * @param {boolean} throwSimplifyRTErrors - if true -> throw RuntimErrors caught during evaluation steps
	 * @param {IRScope} scope
	 * @returns {IRProgram}
	 */
	static new(ir, purpose, simplify = false, throwSimplifyRTErrors = false, scope = new IRScope(null, null)) {
		let [irSrc, codeMap] = ir.generateSource();

		let irTokens = tokenizeIR(irSrc, codeMap);

		let expr = buildIRExpr(irTokens);
	
		expr.resolveNames(scope);

		expr = expr.evalConstants(new IRCallStack(throwSimplifyRTErrors));

		if (simplify) {
			// inline literals and evaluate core expressions with only literal args (some can be evaluated with only partial literal args)
			expr = this.simplify(expr);

			// make sure the debruijn indices are correct
			expr.resolveNames(scope);
		}

		const program = new IRProgram(IRProgram.assertValidRoot(expr), purpose);

		return program;
	}

	/**
	 * @param {IRExpr} expr
	 * @returns {IRExpr}
	 */
	static simplify(expr) {
		let dirty = true;
		let oldState = expr.toString();

		while (dirty) {
			dirty = false;

			expr = expr.simplifyLiterals(new Map());

			const nameExprs = new IRNameExprRegistry();

			expr.registerNameExprs(nameExprs);

			expr = expr.simplifyTopology(new IRExprRegistry(nameExprs));

			const newState = expr.toString();

			if (newState != oldState) {
				dirty = true;
				oldState = newState;
			}
		}

		return expr;
	}

	/**
	 * @package
	 * @type {IRFuncExpr | IRCallExpr | IRLiteralExpr}
	 */
	get expr() {
		return this.#expr;
	}

	/**
	 * @package
	 * @type {?number}
	 */
	get purpose() {
		return this.#purpose;
	}

	/**
	 * @package
	 * @type {Site}
	 */
	get site() {
		return this.#expr.site;
	}

	/**
	 * @type {UplcData}
	 */
	get data() {
		if (this.#expr instanceof IRLiteralExpr) {
			let v = this.#expr.value;

			return v.data;
		} else {
			console.log(this.#expr.toString());
			throw new Error("expected data literal");
		}
	}

	toString() {
		return this.#expr.toString();
	}

	/**
	 * @returns {UplcProgram}
	 */
	toUplc() {
		return new UplcProgram(this.#expr.toUplc(), this.#purpose);
	}

	/**
	 * @returns {number}
	 */
	calcSize() {
		return this.toUplc().calcSize();
	}
}

export class IRParametricProgram {
	#irProgram;
	#parameters;

	/**
	 * @param {IRProgram} irProgram
	 * @param {string[]} parameters
	 */
	constructor(irProgram, parameters) {
		this.#irProgram = irProgram;
		this.#parameters = parameters;
	}

	/**
	 * @package
	 * @param {IR} ir 
	 * @param {?number} purpose
	 * @param {string[]} parameters
	 * @param {boolean} simplify
	 * @returns {IRParametricProgram}
	 */
	static new(ir, purpose, parameters, simplify = false) {
		let scope = new IRScope(null, null);

		parameters.forEach((p, i) => {
			const internalName = `__PARAM_${i}`;

			scope = new IRScope(scope, new IRVariable(new Word(Site.dummy(), internalName)));
		});

		const irProgram = IRProgram.new(ir, purpose, simplify, false, scope);

		return new IRParametricProgram(irProgram, parameters);
	}

	/**
	 * @returns {UplcProgram}
	 */
	toUplc() {
		let exprUplc = this.#irProgram.expr.toUplc();

		this.#parameters.forEach(p => {
			exprUplc = new UplcLambda(Site.dummy(), exprUplc, p);
		});

		return new UplcProgram(exprUplc, this.#irProgram.purpose);
	}
}



/////////////////////////////
// Section 24: Helios program
/////////////////////////////

/**
 * A Module is a collection of statements
 */
class Module {
	#name;
	#statements;

	/**
	 * @param {Word} name 
	 * @param {Statement[]} statements
	 */
	constructor(name, statements) {
		this.#name = name;
		this.#statements = statements;

		this.#statements.forEach(s => s.setBasePath(`__module__${this.#name.toString()}`));
	}

	/**
	 * @param {string} rawSrc
	 * @param {?number} fileIndex - a unique optional index passed in from outside that makes it possible to associate a UserError with a specific file
	 * @returns {Module}
	 */
	static new(rawSrc, fileIndex = null) {
		const src = new Source(rawSrc, fileIndex);

		const ts = tokenize(src);

		src.throwErrors();

		if (ts === null) {
			throw new Error("should've been thrown above");
		}

		if (ts.length == 0) {
			throw UserError.syntaxError(src, 0, 1, "empty script");
		}

		const [purpose, name, statements, mainIdx] = buildScript(ts, ScriptPurpose.Module);

		src.throwErrors();

		if (name !== null) {
			return new Module(name, statements);
		} else {
			throw new Error("unexpected"); // should've been caught by calling src.throwErrors() above
		}
	}

	/**
	 * @type {Word}
	 */
	get name() {
		return this.#name;
	}

	/**
	 * @type {Statement[]}
	 */
	get statements() {
		return this.#statements.slice();
	}

	toString() {
		return this.#statements.map(s => s.toString()).join("\n");
	}

	/**
	 * @param {ModuleScope} scope 
	 */
	evalTypes(scope) {
		for (let s of this.statements) {
			s.eval(scope);
		}
	}

	/**
	 * Cleans the program by removing everything that is unecessary for the smart contract (easier to audit)
	 * @returns {string}
	 */
	cleanSource() {
		let raw = this.name.site.src.raw;
		let n = raw.length;

		let mask = new Uint8Array(n);

		mask.fill(1); // hide the unused parts by setting to 0

		for (let s of this.#statements) {
			s.hideUnused(mask);
		}

		/** @type {string[]} */
		let chars = [];

		for (let i = 0; i < n; i++) {
			let c = raw.charAt(i);

			if (c == '\n' || c == ' ') {
				chars.push(c);
			} else if (mask[i] == 1) {
				chars.push(c);
			} else {
				chars.push(' ');
			}
		}

		let lines = chars.join("").split("\n").map(l => {
			if (l.trim().length == 0) {
				return "";
			} else {
				return l;
			}
		});

		// remove more than one consecutive empty line

		/**
		 * @type {string[]}
		 */
		let parts = [];

		for (let i = 0; i < lines.length; i++) {
			if (!(i > 0 && lines[i-1].length == 0 && lines[i].length == 0)) {
				parts.push(lines[i]);
			}
		}

		return parts.join("\n");
	}

	/**
	 * This module can depend on other modules
	 * TODO: detect circular dependencies
	 * @param {Module[]} modules 
	 * @param {Module[]} stack
	 * @returns {Module[]}
	 */
	filterDependencies(modules, stack = []) {
		/**
		 * @type {Module[]}
		 */
		let deps = [];

		/** @type {Module[]} */
		let newStack = [this];
		newStack = newStack.concat(stack);

		for (let s of this.#statements) {
			if (s instanceof ImportStatement) {
				let mn = s.moduleName.value;

				if (mn == this.name.value) {
					throw s.syntaxError("can't import self");
				} else if (stack.some(d => d.name.value == mn)) {
					throw s.syntaxError("circular import detected");
				}

				// if already in deps, then don't add (because it will have been added before along with all its dependencies)
				if (!deps.some(d => d.name.value == mn)) {
					let m = modules.find(m => m.name.value == mn);

					if (m === undefined) {
						throw s.referenceError(`module '${mn}' not found`);
					} else {
						// only add deps that weren't added before
						let newDeps = m.filterDependencies(modules, newStack).concat([m]).filter(d => !deps.some(d_ => d_.name.value == d.name.value));

						deps = deps.concat(newDeps);
					}
				}
			}
		}

		return deps;
	}
}

/**
 * The entrypoint module
 */
class MainModule extends Module {
	/**
	 * @param {Word} name 
	 * @param {Statement[]} statements 
	 */
	constructor(name, statements) {
		super(name, statements);
	}

	/**
	 * @type {FuncStatement}
	 */
	get mainFunc() {
		for (let s of this.statements) {
			if (s.name.value == "main") {
				if (!(s instanceof FuncStatement)) {	
					throw s.typeError("'main' isn't a function statement");
				} else {
					return s;
				}
			}
		}

		throw new Error("'main' not found (is a module being used as an entrypoint?)");
	}
}

/**
 * @typedef {Object.<string, HeliosDataClass<HeliosData>>} UserTypes
 */

/**
 * Helios root object
 */
 export class Program {
	#purpose;
	#modules;

	/** @type {UserTypes} */
	#types;

	/**
	 * Cache of const values
	 * @type {Object.<string, HeliosData>}
	 */
	#parameters;
	
	/**
	 * @param {number} purpose
	 * @param {Module[]} modules
	 */
	constructor(purpose, modules) {
		this.#purpose = purpose;
		this.#modules = modules;
		this.#types = {};
		this.#parameters = {};
	}

	/**
	 * @param {string} rawSrc 
	 * @returns {[purpose, Module[]]}
	 */
	static parseMain(rawSrc) {
		const src = new Source(rawSrc, 0);

		const ts = tokenize(src);

		src.throwErrors();

		if (ts === null) {
			throw new Error("should've been thrown above");
		}

		if (ts.length == 0) {
			throw UserError.syntaxError(src, 0, 1, "empty script");
		}

		const [purpose, name, statements, mainIdx] = buildScript(ts);

		src.throwErrors();

		if (purpose !== null && name !== null) {
			/**
			 * @type {Module[]}
			 */
			const modules = [new MainModule(name, statements.slice(0, mainIdx+1))];

			if (mainIdx < statements.length - 1) {
				modules.push(new Module(name, statements.slice(mainIdx+1)));
			}

			return [purpose, modules];
		} else {
			throw new Error("unexpected"); // should've been caught by calling src.throwErrors() above
		}
	}

	/**
	 * 
	 * @param {string} mainName 
	 * @param {string[]} moduleSrcs
	 * @returns {Module[]}
	 */
	static parseImports(mainName, moduleSrcs = []) {
		let imports = moduleSrcs.map((src, i) => Module.new(src, i+1));

		/**
		 * @type {Set<string>}
		 */
		let names = new Set();

		names.add(mainName);

		for (let m of imports) {
			if (names.has(m.name.value)) {
				throw m.name.syntaxError(`non-unique module name '${m.name.value}'`);
			}

			names.add(m.name.value);
		}

		return imports;
	}

	/**
	 * Creates  a new program.
	 * @param {string} mainSrc 
	 * @param {string[]} moduleSrcs - optional sources of modules, which can be used for imports
	 * @returns {Program}
	 */
	static new(mainSrc, moduleSrcs = []) {
		let [purpose, modules] = Program.parseMain(mainSrc);

		let site = modules[0].name.site;

		let imports = Program.parseImports(modules[0].name.value, moduleSrcs);
		
		let mainImports = modules[0].filterDependencies(imports);

		/** @type {Module[]} */
		let postImports = [];

		if (modules.length > 1) {
			postImports = modules[modules.length - 1].filterDependencies(imports).filter(m => !mainImports.some(d => d.name.value == m.name.value));
		}

		// create the final order of all the modules (this is the order in which statements will be added to the IR)
		modules = mainImports.concat([modules[0]]).concat(postImports).concat(modules.slice(1));
	
		/**
		 * @type {Program}
		 */
		let program;

		switch (purpose) {
			case ScriptPurpose.Testing:
				program = new TestingProgram(modules);
				break;
			case ScriptPurpose.Spending:
				program = new SpendingProgram(modules);
				break;
			case ScriptPurpose.Minting:
				program = new MintingProgram(modules);
				break
			case ScriptPurpose.Staking:
				program = new StakingProgram(modules);
				break
			case ScriptPurpose.Module:
				throw site.syntaxError("can't use module for main");
			default:
				throw new Error("unhandled script purpose");
		}

		const topScope = program.evalTypes();

		program.fillTypes(topScope);

		return program;
	}

	/** 
	 * @type {Module[]} 
	 */
	get mainImportedModules() {
		/** @type {Module[]} */
		let ms = [];

		for (let m of this.#modules) {
			if (m instanceof MainModule) {
				break;
			} else {
				ms.push(m);
			}
		}

		return ms;
	}

	/**
	 * @type {MainModule}
	 */
	get mainModule() {
		for (let m of this.#modules) {
			if (m instanceof MainModule) {
				return m;
			}
		}

		throw new Error("MainModule not found");
	}

	/**
	 * @type {?Module}
	 */
	get postModule() {
		let m = this.#modules[this.#modules.length - 1];

		if (m instanceof MainModule) {
			return null;
		} else {
			return m;
		}
	}

	/**
	 * @type {string}
	 */
	get name() {
		return this.mainModule.name.value;
	}

	/**
	 * @type {FuncStatement}
	 */
	get mainFunc() {
		return this.mainModule.mainFunc;
	}

	/**
	 * @type {string}
	 */
	get mainPath() {
		return this.mainFunc.path;
	}

	/**
	 * @type {Statement[]}
	 */
	get mainStatements() {
		return this.mainModule.statements;
	}

	/**
	 * Needed to list the paramTypes, and to call changeParam
	 * @type {Statement[]}
	 */
	get mainAndPostStatements() {
		let statements = this.mainModule.statements;

		if (this.postModule != null) {
			statements = statements.concat(this.postModule.statements);
		}

		return statements;
	}

	/**
	 * @type {[Statement, boolean][]} - boolean value marks if statement is import or not
	 */
	get allStatements() {
		/**
		 * @type {[Statement, boolean][]}
		 */
		let statements = [];

		for (let i = 0; i < this.#modules.length; i++) {
			let m = this.#modules[i];

			let isImport = !(m instanceof MainModule || (i == this.#modules.length - 1));

			statements = statements.concat(m.statements.map(s => [s, isImport]));
		}

		return statements;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return this.#modules.map(m => m.toString()).join("\n");
	}

	/**
	 * @returns {[string[], string]}
	 */
	cleanSource() {
		return [this.mainImportedModules.map(m => m.cleanSource()), this.mainModule.cleanSource()];
	}

	/**
	 * @param {GlobalScope} globalScope
	 * @returns {TopScope}
	 */
	evalTypesInternal(globalScope) {
		const topScope = new TopScope(globalScope);

		// loop through the modules

		for (let i = 0; i < this.#modules.length; i++) {
			const m = this.#modules[i];

			// reuse main ModuleScope for post module
			const moduleScope = (m ===  this.postModule) ? topScope.getModuleScope(this.mainModule.name) : new ModuleScope(topScope);

			m.evalTypes(moduleScope);

			if (m instanceof MainModule) {
				globalScope.allowMacros();
				topScope.setStrict(false);
			}

			if (m !== this.postModule) {
				topScope.set(m.name, moduleScope);
			}
		}

		this.mainFunc.use();
		
		return topScope;
	}

	/**
	 * @returns {TopScope}
	 */
	evalTypes() {
		throw new Error("not yet implemeneted");
	}

	/**
	 * @type {UserTypes}
	 */
	get types() {
		return this.#types;
	}

	/**
	 * Fill #types with convenient javascript equivalents of Int, ByteArray etc.
	 * @param {TopScope} topScope
	 */
	fillTypes(topScope) {
		const mainModuleScope = topScope.getModuleScope(this.mainModule.name);

		mainModuleScope.loopTypes((name, type) => {
			if (type instanceof StructStatementType || type instanceof EnumStatementType) {
				if (name in this.#types) {
					throw new Error(`unexpected duplicate type name ${name} in main program scope`);
				}

				this.#types[name] = type.userType;;
			}
		});
	}

	/**
	 * @type {Object.<string, Type>}
	 */
	get paramTypes() {
		/**
		 * @type {Object.<string, Type>}
		 */
		let res = {};

		for (let s of this.mainAndPostStatements) {
			if (s instanceof ConstStatement) {
				res[s.name.value] = s.type;
			} else if (s instanceof ImportStatement && s.origStatement instanceof ConstStatement) {
				res[s.name.value] = s.origStatement.type;
			}
		}

		return res;
	}

	/**
	 * Change the literal value of a const statements  
	 * @param {string} name 
	 * @param {string | UplcValue} value 
	 * @returns {Program} - returns 'this' so that changeParam calls can be chained
	 */
	changeParam(name, value) {
		deprecationWarning("program.changeParam", "0.14.0", "use program.parameters instead", "https://www.hyperion-bt.org/helios-book/api/reference/program.html#parameters-1");

		for (let s of this.mainAndPostStatements) {
			if (s instanceof ConstStatement && s.name.value == name) {
				s.changeValue(value);
				return this;
			} else if (s instanceof ImportStatement && s.name.value == name && s.origStatement instanceof ConstStatement) {
				s.origStatement.changeValue(value);
				return this;
			}
		}

		throw this.mainFunc.referenceError(`param '${name}' not found`);
	}

	/**
	 * Change the literal value of a const statements  
	 * @package
	 * @param {string} name 
	 * @param {UplcData} data
	 */
	changeParamSafe(name, data) {
		for (let s of this.mainAndPostStatements) {
			if (s instanceof ConstStatement && s.name.value == name) {
				s.changeValueSafe(data);
				return this;
			} else if (s instanceof ImportStatement && s.name.value == name && s.origStatement instanceof ConstStatement) {
				s.origStatement.changeValueSafe(data);
				return this;
			}
		}

		throw this.mainFunc.referenceError(`param '${name}' not found`);
	}

	/**
	 * Doesn't use wrapEntryPoint
	 * @param {string} name 
	 * @returns {UplcValue}
	 */
	evalParam(name) {
		/**
		 * @type {Map<string, IR>}
		 */
		let map = new Map();

		/** @type {?ConstStatement} */
		let constStatement = null;

		for (let s of this.mainAndPostStatements) {
			if (s instanceof ImportStatement && s.name.value == name && s.origStatement instanceof ConstStatement) {
				constStatement = s.origStatement;
				break;
			}
		}

		for (let [s, isImport] of this.allStatements) {
			s.toIR(map);
			if (s instanceof ConstStatement && ((s.name.value == name && !isImport) || s === constStatement)) {
				constStatement = s;
				break;
			}
		}

		if (constStatement === null) {
			throw new Error(`param '${name}' not found`);
		} else {
			let path = constStatement.path;

			let ir = assertDefined(map.get(path));

			map.delete(path);

			ir = wrapWithRawFunctions(IR.wrapWithDefinitions(ir, map));

			let irProgram = IRProgram.new(ir, this.#purpose, true, true);

			return new UplcDataValue(irProgram.site, irProgram.data);
		}
	}
	
	/**
	 * Alternative way to get the parameters as HeliosData instances
	 * @returns {Object.<string, HeliosData>}
	 */
	get parameters() {
		const that = this;

		// not expensive, so doesn't need to be evaluated on-demand
		const types = this.paramTypes;

		const handler = {
			/**
			 * Return from this.#parameters if available, or calculate
			 * @param {Object.<string, HeliosData>} target 
			 * @param {string} name
			 * @returns 
			 */
			get(target, name) {
				if (name in target) {
					return target[name];
				} else {
					const type = assertDefined(types[name], `invalid param name '${name}'`);
					
					const uplcValue = that.evalParam(name);

					const value = (uplcValue instanceof UplcBool) ? new Bool(uplcValue.bool) : type.userType.fromUplcData(uplcValue.data);
						
					target[name] = value;

					// TODO: return Proxy instead?
					return value;
				}
			},
		};

		return new Proxy(this.#parameters, handler);
	}

	/**
	 * @param {Object.<string, HeliosData | any>} values
	 */
	set parameters(values) {
		const types = this.paramTypes;

		for (let name in values) {
			const rawValue = values[name];

			const UserType = assertDefined(types[name], `invalid param name '${name}'`).userType;

			const value = rawValue instanceof UserType ? rawValue : new UserType(rawValue);

			this.#parameters[name] = value;

			this.changeParamSafe(name, value._toUplcData());
		}
	}

	/**
	 * @package
	 * @param {IR} ir
	 * @param {string[]} parameters
	 * @returns {IR}
	 */
	wrapEntryPoint(ir, parameters) {
		// find the constStatements associated with the parameters
		/**
		 * @type {(ConstStatement | null)[]}
		 */
		const parameterStatements = new Array(parameters.length).fill(null);

		if (parameters.length > 0) {
			for (let statement of this.mainStatements) {
				if (statement instanceof ConstStatement) {
					const i = parameters.findIndex(p => statement.name.value == p);

					if (i != -1) {
						parameterStatements[i] = statement;
					}
				} else if (statement instanceof ImportStatement && statement.origStatement instanceof ConstStatement) {
					const i = parameters.findIndex(p => statement.name.value == p);

					if (i != -1) {
						parameterStatements[i] = statement.origStatement;
					}
				}
			}

			parameters.forEach((p, i) => {
				if (parameterStatements[i] == null) {
					throw new Error(`parameter ${p} not found (hint: must come before main)`);
				}
			});
		}		

		/**
		 * @type {Map<string, IR>}
		 */
		const map = new Map();

		for (let [statement, _] of this.allStatements) {
			if (parameters.length > 0 && statement instanceof ConstStatement) {
				const i = parameterStatements.findIndex(cs => cs === statement);

				if (i != -1) {
					let ir = new IR(`__PARAM_${i}`);

					if (statement.type instanceof BoolType) {
						ir = new IR([
							new IR("__helios__common__unBoolData("),
							ir,
							new IR(")")
						]);
					}

					map.set(statement.path, ir); 

					continue;
				}
			}

			statement.toIR(map);

			if (statement.name.value == "main") {
				break;
			}
		}
 
		// builtin functions are added when the IR program is built
		// also replace all tabs with four spaces
		return wrapWithRawFunctions(IR.wrapWithDefinitions(ir, map));
	}

	/**
	 * @package
	 * @param {string[]}  parameters
	 * @returns {IR}
	 */
	toIR(parameters = []) {
		throw new Error("not yet implemented");
	}

	/**
	 * @returns {string}
	 */
	prettyIR(simplify = false) {
		const ir = this.toIR([]);

		const irProgram = IRProgram.new(ir, this.#purpose, simplify);

		return new Source(irProgram.toString()).pretty();
	}

	/**
	 * @param {boolean} simplify 
	 * @returns {UplcProgram}
	 */
	compile(simplify = false) {
		const ir = this.toIR([]);

		const irProgram = IRProgram.new(ir, this.#purpose, simplify);
		
		//console.log(new Source(irProgram.toString()).pretty());
		
		return irProgram.toUplc();
	}

	/**
	 * Compile a special Uplc
	 * @param {string[]} parameters
	 * @param {boolean} simplify
	 * @returns {UplcProgram}
	 */
	compileParametric(parameters, simplify = false) {
		assert(parameters.length > 0, "expected at least 1 parameter (hint: use program.compile() instead)");

		const ir = this.toIR(parameters);

		const irProgram = IRParametricProgram.new(ir, this.#purpose, parameters, simplify);

		// TODO: UplcParametricProgram
		return irProgram.toUplc();
	}
}

class RedeemerProgram extends Program {
	/**
	 * @param {number} purpose
	 * @param {Module[]} modules 
	 */
	constructor(purpose, modules) {
		super(purpose, modules);
	}

	/**
	 * @package
	 * @param {GlobalScope} scope
	 * @returns {TopScope}
	 */
	evalTypesInternal(scope) {
		const topScope = super.evalTypesInternal(scope);

		// check the 'main' function

		let main = this.mainFunc;
		let argTypeNames = main.argTypeNames;
		let retTypes = main.retTypes;
		let haveRedeemer = false;
		let haveScriptContext = false;
		let haveUnderscores = argTypeNames.some(name => name =="");

		if (argTypeNames.length > 2) {
			throw main.typeError("too many arguments for main");
		} else if (haveUnderscores) {
			// empty type name comes from an underscore
			assert(argTypeNames.length == 2, "expected 2 arguments");
		} else if (argTypeNames.length != 2) {
			deprecationWarning("main with variable arguments", "0.14.0", "use underscores instead", "https://www.hyperion-bt.org/helios-book/lang/script-structure.html#main-function-4");
		}

		for (let i = 0; i < argTypeNames.length; i++) {
			const t = argTypeNames[i];

			if (t == "") {
				continue
			} else if (t == "Redeemer") {
				if (haveUnderscores && i != 0) {
					throw main.typeError(`unexpected Redeemer type for arg ${i} of main`);
				}

				if (haveRedeemer) {
					throw main.typeError(`duplicate 'Redeemer' argument`);
				} else if (haveScriptContext) {
					throw main.typeError(`'Redeemer' must come before 'ScriptContext'`);
				} else {
					haveRedeemer = true;
				}
			} else if (t == "ScriptContext") {
				if (haveUnderscores && i != 1) {
					throw main.typeError(`unexpected ScriptContext type for arg ${i} of main`);
				}

				if (haveScriptContext) {
					throw main.typeError(`duplicate 'ScriptContext' argument`);
				} else {
					haveScriptContext = true;
				}
			} else {
				throw main.typeError(`illegal argument type, must be 'Redeemer' or 'ScriptContext', got '${t}'`);
			}
		}

		if (retTypes.length !== 1) {
			throw main.typeError(`illegal number of return values for main, expected 1, got ${retTypes.length}`);
		} else if (!(retTypes[0] instanceof BoolType)) {
			throw main.typeError(`illegal return type for main, expected 'Bool', got '${retTypes[0].toString()}'`);
		}

		return topScope;
	}

	/**
	 * @package
	 * @param {string[]} parameters
	 * @returns {IR} 
	 */
	toIR(parameters = []) {
		/** @type {IR[]} */
		const outerArgs = [];

		/** @type {IR[]} */
		const innerArgs = [];

		for (let t of this.mainFunc.argTypeNames) {
			if (t == "Redeemer") {
				innerArgs.push(new IR("redeemer"));
				outerArgs.push(new IR("redeemer"));
			} else if (t == "ScriptContext") {
				innerArgs.push(new IR("ctx"));
				if (outerArgs.length == 0) {
					outerArgs.push(new IR("_"));
				}
				outerArgs.push(new IR("ctx"));
			} else if (t == "") {
				innerArgs.push(new IR("0")); // use a literal to make life easier for the optimizer
				outerArgs.push(new IR("_"));
			} else {
				throw new Error("unexpected");
			}
		}

		while(outerArgs.length < 2) {
			outerArgs.push(new IR("_"));
		}

		const ir = new IR([
			new IR(`${TAB}/*entry point*/\n${TAB}(`),
			new IR(outerArgs).join(", "),
			new IR(`) -> {\n${TAB}${TAB}`),
			new IR(`__core__ifThenElse(\n${TAB}${TAB}${TAB}${this.mainPath}(`),
			new IR(innerArgs).join(", "),
			new IR(`),\n${TAB}${TAB}${TAB}() -> {()},\n${TAB}${TAB}${TAB}() -> {error("transaction rejected")}\n${TAB}${TAB})()`),
			new IR(`\n${TAB}}`),
		]);

		return this.wrapEntryPoint(ir, parameters);
	}
}

class DatumRedeemerProgram extends Program {
	/**
	 * @param {number} purpose
	 * @param {Module[]} modules
	 */
	constructor(purpose, modules) {
		super(purpose, modules);
	}

	/**
	 * @package
	 * @param {GlobalScope} scope 
	 * @returns {TopScope}
	 */
	evalTypesInternal(scope) {
		const topScope = super.evalTypesInternal(scope);

		// check the 'main' function

		const main = this.mainFunc;
		const argTypeNames = main.argTypeNames;
		const retTypes = main.retTypes;
		const haveUnderscores = argTypeNames.some(name => name == "");
		let haveDatum = false;
		let haveRedeemer = false;
		let haveScriptContext = false;

		if (argTypeNames.length > 3) {
			throw main.typeError("too many arguments for main");
		} else if (haveUnderscores) {
			assert(argTypeNames.length == 3, "expected 3 args");
		} else if (argTypeNames.length != 3) {
			deprecationWarning("main with variable arguments", "0.14.0", "use underscores instead", "https://www.hyperion-bt.org/helios-book/lang/script-structure.html#main-function-4");
		}

		for (let i = 0; i < argTypeNames.length; i++) {
			const t = argTypeNames[i];

			if (t == "") {
				continue;
			} else if (t == "Datum") {
				if (haveUnderscores && i != 0) {
					throw main.typeError(`unexpected Datum type for arg ${i} of main`);
				}

				if (haveDatum) {
					throw main.typeError("duplicate 'Datum' argument");
				} else if (haveRedeemer) {
					throw main.typeError("'Datum' must come before 'Redeemer'");
				} else if (haveScriptContext) {
					throw main.typeError("'Datum' must come before 'ScriptContext'");
				} else {
					haveDatum = true;
				}
			} else if (t == "Redeemer") {
				if (haveUnderscores && i != 1) {
					throw main.typeError(`unexpected Redeemer type for arg ${i} of main`);
				}

				if (haveRedeemer) {
					throw main.typeError("duplicate 'Redeemer' argument");
				} else if (haveScriptContext) {
					throw main.typeError("'Redeemer' must come before 'ScriptContext'");
				} else {
					haveRedeemer = true;
				}
			} else if (t == "ScriptContext") {
				if (haveUnderscores && i != 2) {
					throw main.typeError(`unexpected ScriptContext type for arg ${i} of main`);
				}

				if (haveScriptContext) {
					throw main.typeError("duplicate 'ScriptContext' argument");
				} else {
					haveScriptContext = true;
				}
			} else {
				throw main.typeError(`illegal argument type, must be 'Datum', 'Redeemer' or 'ScriptContext', got '${t}'`);
			}
		}

		if (retTypes.length !== 1) {
			throw main.typeError(`illegal number of return values for main, expected 1, got ${retTypes.length}`);
		} else if (!(retTypes[0] instanceof BoolType)) {
			throw main.typeError(`illegal return type for main, expected 'Bool', got '${retTypes[0].toString()}'`);
		}

		return topScope;
	}

	/**
	 * @package
	 * @param {string[]} parameters
	 * @returns {IR}
	 */
	toIR(parameters = []) {
		/** @type {IR[]} */
		const outerArgs = [];

		/** @type {IR[]} */
		const innerArgs = [];

		for (let t of this.mainFunc.argTypeNames) {
			if (t == "Datum") {
				innerArgs.push(new IR("datum"));
				outerArgs.push(new IR("datum"));
			} else if (t == "Redeemer") {
				innerArgs.push(new IR("redeemer"));
				if (outerArgs.length == 0) {
					outerArgs.push(new IR("_"));
				}
				outerArgs.push(new IR("redeemer"));
			} else if (t == "ScriptContext") {
				innerArgs.push(new IR("ctx"));
				while (outerArgs.length < 2) {
					outerArgs.push(new IR("_"));
				}
				outerArgs.push(new IR("ctx"));
			} else if (t == "") {
				innerArgs.push(new IR("0")); // use a literal to make life easier for the optimizer
				outerArgs.push(new IR("_"));
			} else {
				throw new Error("unexpected");
			}
		}

		while(outerArgs.length < 3) {
			outerArgs.push(new IR("_"));
		}

		const ir = new IR([
			new IR(`${TAB}/*entry point*/\n${TAB}(`),
			new IR(outerArgs).join(", "),
			new IR(`) -> {\n${TAB}${TAB}`),
			new IR(`__core__ifThenElse(\n${TAB}${TAB}${TAB}${this.mainPath}(`),
			new IR(innerArgs).join(", "),
			new IR(`),\n${TAB}${TAB}${TAB}() -> {()},\n${TAB}${TAB}${TAB}() -> {error("transaction rejected")}\n${TAB}${TAB})()`),
			new IR(`\n${TAB}}`),
		]);

		return this.wrapEntryPoint(ir, parameters);
	}
}

class TestingProgram extends Program {
	/**
	 * @param {Module[]} modules 
	 */
	constructor(modules) {
		super(ScriptPurpose.Testing, modules);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `testing ${this.name}\n${super.toString()}`;
	}

	/**
	 * @package
	 * @returns {TopScope}
	 */
	evalTypes() {
		const scope = GlobalScope.new(ScriptPurpose.Testing);

		const topScope = this.evalTypesInternal(scope);

		// main can have any arg types, and any return type 

		if (this.mainFunc.retTypes.length > 1) {
			throw this.mainFunc.typeError("program entry-point can only return one value");
		}

		return topScope;
	}

	/**
	 * @package
	 * @param {string[]} parameters
	 * @returns {IR}
	 */
	toIR(parameters = []) {
		const innerArgs = this.mainFunc.argTypes.map((t, i) => {
			if (t instanceof BoolType) {
				return new IR(`__helios__common__unBoolData(arg${i})`);
			} else {
				return new IR(`arg${i}`);
			}
		});

		let ir = new IR([
			new IR(`${this.mainPath}(`),
			new IR(innerArgs).join(", "),
			new IR(")"),
		]);

		if (this.mainFunc.retTypes[0] instanceof BoolType) {
			ir = new IR([
				new IR("__helios__common__boolData("),
				ir,
				new IR(")")
			]);
		}

		const outerArgs = this.mainFunc.argTypes.map((_, i) => new IR(`arg${i}`));

		ir = new IR([
			new IR(`${TAB}/*entry point*/\n${TAB}(`),
			new IR(outerArgs).join(", "),
			new IR(`) -> {\n${TAB}${TAB}`),
			ir,
			new IR(`\n${TAB}}`),
		]);

		return this.wrapEntryPoint(ir, parameters);
	}
}

class SpendingProgram extends DatumRedeemerProgram {
	/**
	 * @param {Module[]} modules
	 */
	constructor(modules) {
		super(ScriptPurpose.Spending, modules);
	}

	toString() {
		return `spending ${this.name}\n${super.toString()}`;
	}

	/**
	 * @package
	 * @returns {TopScope}
	 */
	evalTypes() {
		const scope = GlobalScope.new(ScriptPurpose.Spending);

		return this.evalTypesInternal(scope);	
	}
}

class MintingProgram extends RedeemerProgram {
	/**
	 * @param {Module[]} modules 
	 */
	constructor(modules) {
		super(ScriptPurpose.Minting, modules);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `minting ${this.name}\n${super.toString()}`;
	}

	/**
	 * @package
	 * @returns {TopScope}
	 */
	evalTypes() {
		const scope = GlobalScope.new(ScriptPurpose.Minting);

		return this.evalTypesInternal(scope);	
	}
}

class StakingProgram extends RedeemerProgram {
	/**
	 * @param {Module[]} modules 
	 */
	constructor(modules) {
		super(ScriptPurpose.Staking, modules);
	}

	toString() {
		return `staking ${this.name}\n${super.toString()}`;
	}

	/**
	 * @package
	 * @returns {TopScope}
	 */
	evalTypes() {
		const scope = GlobalScope.new(ScriptPurpose.Staking);

		return this.evalTypesInternal(scope);	
	}
}


///////////////////////
// Section 25: Tx types
///////////////////////

export class Tx extends CborData {
	/**
	 * @type {TxBody}
	 */
	#body;

	/**
	 * @type {TxWitnesses}
	 */
	#witnesses;

	/**
	 * @type {boolean}
	 */
	#valid;

	/** 
	 * @type {?TxMetadata} 
	 */
	#metadata;

	// the following field(s) aren't used by the serialization (only for building)
	/**
	 * Upon finalization the slot is calculated and stored in the body
	 * @type {?Date} 
	 */
	#validTo;

	/**
	 * Upon finalization the slot is calculated and stored in the body 
	 *  @type {?Date} 
	 */
	#validFrom;

	constructor() {
		super();
		this.#body = new TxBody();
		this.#witnesses = new TxWitnesses();
		this.#valid = false; // building is only possible if valid==false
		this.#metadata = null;
		this.#validTo = null;
		this.#validFrom = null;
	}

	/**
	 * @type {TxBody}
	 */
	get body() {
		return this.#body;
	}

	/**
	 * @type {number[]}
	 */
	get bodyHash() {
		return Crypto.blake2b(this.#body.toCbor());
	}

	/**
	 * @type {TxWitnesses}
	 */
	get witnesses() {
		return this.#witnesses;
	}

	/**
	 * Used by emulator to check if tx is valid.
	 * @param {bigint} slot
	 * @returns {boolean}
	 */
	isValid(slot) {
		if (!this.#valid) {
			return false;
		} else {
			return this.#body.isValid(slot);
		}
	}

	/** 
	 * @returns {number[]}
	 */
	toCbor() {
		return CborData.encodeTuple([
			this.#body.toCbor(),
			this.#witnesses.toCbor(),
			CborData.encodeBool(this.#valid),
			this.#metadata === null ? CborData.encodeNull() : this.#metadata.toCbor(),
		]);
	}

	/**
	 * @param {number[]} bytes 
	 * @returns {Tx}
	 */
	static fromCbor(bytes) {
		bytes = bytes.slice();

		let tx = new Tx();

		let n = CborData.decodeTuple(bytes, (i, fieldBytes) => {
			switch(i) {
				case 0:
					tx.#body = TxBody.fromCbor(fieldBytes);
					break;
				case 1:
					tx.#witnesses = TxWitnesses.fromCbor(fieldBytes);
					break;
				case 2:
					tx.#valid = CborData.decodeBool(fieldBytes);
					break;
				case 3:
					if (CborData.isNull(fieldBytes)) {
						CborData.decodeNull(fieldBytes);

						tx.#metadata = null;
					} else {
						tx.#metadata = TxMetadata.fromCbor(fieldBytes);
					}
					break;
				default:
					throw new Error("bad tuple size");
			}
		});

		assert(n == 4);
		assert(bytes.length == 0);

		return tx;
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		return {
			body: this.#body.dump(),
			witnesses: this.#witnesses.dump(),
			valid: this.#valid,
			metadata: this.#metadata !== null ? this.#metadata.dump() : null
		};
	}

	/**
	 * @param {Date} t
	 * @returns {Tx}
	 */
	validFrom(t) {
		assert(!this.#valid);

		this.#validFrom = t;

		return this;
	}

	/**
	 * @param {Date} t
	 * @returns {Tx}
	 */
	validTo(t) {
		assert(!this.#valid);

		this.#validTo = t;

		return this;
	}

	/**
	 * Throws error if assets of given mph are already being minted in this transaction
	 * @param {MintingPolicyHash} mph 
	 * @param {[number[] | string, bigint][]} tokens - list of pairs of [tokenName, quantity], tokenName can be list of bytes or hex-string
	 * @param {UplcDataValue | UplcData} redeemer
	 * @returns {Tx}
	 */
	mintTokens(mph, tokens, redeemer) {
		assert(!this.#valid);

		this.#body.addMint(mph, tokens.map(([name, amount]) => {
			if (typeof name == "string" ) {
				return [hexToBytes(name), amount];
			} else {
				return [name, amount];
			}
		}));

		this.#witnesses.addMintingRedeemer(mph, UplcDataValue.unwrap(redeemer));

		return this;
	}

	/**
	 * @param {UTxO} input
	 * @param {?(UplcDataValue | UplcData)} redeemer
	 * @returns {Tx}
	 */
	addInput(input, redeemer = null) {
		assert(!this.#valid);

		if (input.origOutput === null) {
			throw new Error("TxInput.origOutput must be set when building transaction");
		} else {
			void this.#body.addInput(input.asTxInput);

			if (redeemer !== null) {
				assert(input.origOutput.address.validatorHash !== null, "input isn't locked by a script");

				this.#witnesses.addSpendingRedeemer(input.asTxInput, UplcDataValue.unwrap(redeemer));

				if (input.origOutput.datum === null) {
					throw new Error("expected non-null datum");
				} else {
					let datum = input.origOutput.datum;

					if (datum instanceof HashedDatum) {
						let datumData = datum.data;
						if (datumData === null) {
							throw new Error("expected non-null datum data");
						} else {
							this.#witnesses.addDatumData(datumData);
						}
					}
				}
			} else {
				assert(input.origOutput.address.pubKeyHash !== null, "input is locked by a script, but redeemer isn't specified");
			}
		}

		return this;
	}

	/**
	 * @param {UTxO[]} inputs
	 * @param {?(UplcDataValue | UplcData)} redeemer
	 * @returns {Tx}
	 */
	addInputs(inputs, redeemer = null) {
		for (let input of inputs) {
			this.addInput(input, redeemer);
		}

		return this;
	}

	/**
	 * @param {TxRefInput} input
	 * @param {?UplcProgram} refScript
	 * @returns {Tx}
	 */
	addRefInput(input, refScript = null) {
		assert(!this.#valid);

		this.#body.addRefInput(input);

		if (refScript !== null) {
			this.#witnesses.attachScript(refScript, true);
		}

		return this;
	}

	/**
	 * @param {TxRefInput[]} inputs
	 * @returns {Tx}
	 */
	addRefInputs(inputs) {
		for (let input of inputs) {
			this.addRefInput(input);
		}

		return this;
	}

	/**
	 * @param {TxOutput} output 
	 * @returns {Tx}
	 */
	addOutput(output) {
		assert(!this.#valid);
		
		// min lovelace is checked during build, because 
		this.#body.addOutput(output);

		return this;
	}

	/**
	 * @param {TxOutput[]} outputs 
	 * @returns {Tx}
	 */
	addOutputs(outputs) {
		for (let output of outputs) {
			this.addOutput(output);
		}

		return this;
	}

	/**
	 * @param {PubKeyHash} hash
	 * @returns {Tx}
	 */
	addSigner(hash) {
		assert(!this.#valid);

		this.#body.addSigner(hash);

		return this;
	}

	/**
	 * Unused scripts are detected during finalize(), in which case an error is thrown
	 * Throws error if script was already added before
	 * @param {UplcProgram} program
	 * @returns {Tx}
	 */
	attachScript(program) {
		assert(!this.#valid);

		this.#witnesses.attachScript(program);

		return this;
	}

	/**
	 * Usually adding only one collateral input is enough
	 * Must be less than the limit in networkParams (eg. 3), or else an error is thrown during finalization
	 * @param {UTxO} input 
	 * @returns {Tx}
	 */
	addCollateral(input) {
		assert(!this.#valid);

		this.#body.addCollateral(input.asTxInput);

		return this;
	}

	/**
	 * Calculates tx fee (including script execution)
	 * Shouldn't be used directly
	 * @param {NetworkParams} networkParams
	 * @returns {bigint}
	 */
	estimateFee(networkParams) {
		let [a, b] = networkParams.txFeeParams;

		if (!this.#valid) {
			// add dummy signatures
			let nUniquePubKeyHashes = this.#body.countUniqueSigners();
			
			this.#witnesses.addDummySignatures(nUniquePubKeyHashes);
		}

		let size = this.toCbor().length;

		if (!this.#valid) {
			// clean up the dummy signatures
			this.#witnesses.removeDummySignatures();
		}

		let sizeFee = BigInt(a) + BigInt(size)*BigInt(b);

		let exFee = this.#witnesses.estimateFee(networkParams);

		return sizeFee + exFee;
	}

	/**
	 * Iterates until fee is exact
	 * Shouldn't be used directly
	 * @param {NetworkParams} networkParams
	 * @param {bigint} fee
	 * @returns {bigint}
	 */
	setFee(networkParams, fee) {
		let oldFee = this.#body.fee;

		while (oldFee != fee) {
			this.#body.setFee(fee);

			oldFee = fee;

			fee = this.estimateFee(networkParams);
		}

		return fee;
	}

	/**
	 * Checks that all necessary scripts are included, and that all included scripts are used
	 * Shouldn't be used directly
	 */
	checkScripts() {
		let scripts = this.#witnesses.scripts;

		/**
		 * @type {Set<string>}
		 */
		const currentScripts = new Set();
		scripts.forEach(script => {
			currentScripts.add(bytesToHex(script.hash()))
		})

		/** 
		 * @type {Map<string, number>} 
		 */
		let wantedScripts = new Map();

		this.#body.collectScriptHashes(wantedScripts);

		if (wantedScripts.size < scripts.length) {
			throw new Error("too many scripts included");
		} else if (wantedScripts.size > scripts.length) {
			wantedScripts.forEach((value, key) => {
				if (!currentScripts.has(key)) {
					if (value >= 0) {
						throw new Error(`missing script for input ${value}`);
					} else if (value < 0) {
						throw new Error(`missing script for minting policy ${-value-1}`);
					}
				}
			});
		}

		currentScripts.forEach((key) => {
			if (!wantedScripts.has(key)) {
				console.log(wantedScripts, currentScripts)
				throw new Error("unused script");
			}
		});
	}

	/**
	 * @param {NetworkParams} networkParams 
	 * @param {Address} changeAddress
	 * @returns {Promise<void>}
	 */
	async executeRedeemers(networkParams, changeAddress) {
		await this.#witnesses.executeRedeemers(networkParams, this.#body, changeAddress);
	}

	/**
	 * @param {NetworkParams} networkParams 
	 * @returns {Promise<void>}
	 */
	async checkExecutionBudgets(networkParams) {
		await this.#witnesses.checkExecutionBudgets(networkParams, this.#body);
	}

	/**
	 * @param {Address} changeAddress 
	 */
	balanceAssets(changeAddress) {
		const inputAssets = this.#body.sumInputAndMintedAssets();

		const outputAssets = this.#body.sumOutputAssets();

		if (inputAssets.eq(outputAssets)) {
			return;
		} else if (outputAssets.ge(inputAssets)) {
			throw new Error("not enough input assets");
		} else {
			const diff = inputAssets.sub(outputAssets);

			const changeOutput = new TxOutput(changeAddress, new Value(0n, diff));

			this.#body.addOutput(changeOutput);
		}
	}

	/**
	 * Calculate the base fee which will be multiplied by the required min collateral percentage 
	 * @param {NetworkParams} networkParams 
	 * @param {Address} changeAddress 
	 * @param {UTxO[]} spareUtxos 
	 */
	estimateCollateralBaseFee(networkParams, changeAddress, spareUtxos) {
		assert(config.N_DUMMY_INPUTS == 1 || config.N_DUMMY_INPUTS == 2, "expected N_DUMMY_INPUTs == 1 or N_DUMMY_INPUTS == 2");

		// create the collateral return output (might not actually be added if there isn't enough lovelace)
		const dummyOutput = new TxOutput(changeAddress, new Value(0n));
		dummyOutput.correctLovelace(networkParams);

		// some dummy UTxOs on to be able to correctly calculate the collateral (assuming it uses full body fee)
		const dummyCollateral = spareUtxos.map(spare => spare.asTxInput).concat(this.#body.inputs).slice(0, 3);
		dummyCollateral.forEach(input => {
			this.#body.collateral.push(input);
		});

		const dummyInputs = dummyCollateral.slice(0, config.N_DUMMY_INPUTS);

		this.#body.setCollateralReturn(dummyOutput);
		dummyInputs.forEach(dummyInput => this.#body.addInput(dummyInput, false));
		this.#body.addOutput(dummyOutput);

		const baseFee = this.estimateFee(networkParams);

		// remove the dummy inputs and outputs
		while(this.#body.collateral.length) {
			this.#body.collateral.pop();
		}
		this.#body.setCollateralReturn(null);
		dummyInputs.forEach(dummyInput => this.#body.removeInput(dummyInput));
		this.#body.removeOutput(dummyOutput);

		return baseFee;
	}
	
	/**
	 * @param {NetworkParams} networkParams
	 * @param {Address} changeAddress
	 * @param {UTxO[]} spareUtxos
	 */
	balanceCollateral(networkParams, changeAddress, spareUtxos) {
		// don't do this step if collateral was already added explicitly
		if (this.#body.collateral.length > 0 || !this.isSmart()) {
			return;
		}

		const baseFee = this.estimateCollateralBaseFee(networkParams, changeAddress, spareUtxos);

		const minCollateral = ((baseFee*BigInt(networkParams.minCollateralPct)) + 100n)/100n; // integer division that rounds up

		let collateral = 0n;
		/**
		 * @type {TxInput[]}
		 */
		const collateralInputs = [];

		/**
		 * @param {TxInput[]} inputs 
		 */
		function addCollateralInputs(inputs) {
			// first try using the UTxOs that already form the inputs
			const cleanInputs = inputs.filter(utxo => utxo.value.assets.isZero()).sort((a, b) => Number(a.value.lovelace - b.value.lovelace));

			for (let input of cleanInputs) {
				if (collateral > minCollateral) {
					break;
				}

				while (collateralInputs.length >= networkParams.maxCollateralInputs) {
					collateralInputs.shift();
				}
	
				collateralInputs.push(input);
				collateral += input.value.lovelace;
			}
		}
		
		addCollateralInputs(this.#body.inputs.slice());

		addCollateralInputs(spareUtxos.map(utxo => utxo.asTxInput));

		// create the collateral return output if there is enough lovelace
		const changeOutput = new TxOutput(changeAddress, new Value(0n));
		changeOutput.correctLovelace(networkParams);

		if (collateral < minCollateral) {
			throw new Error("unable to find enough collateral input");
		} else {
			if (collateral > minCollateral + changeOutput.value.lovelace) {
				changeOutput.setValue(new Value(0n));

				changeOutput.correctLovelace(networkParams);

				if (collateral > minCollateral + changeOutput.value.lovelace) {
					changeOutput.setValue(new Value(collateral - minCollateral));
					this.#body.setCollateralReturn(changeOutput);
				} else {
					console.log(`not setting collateral return: collateral input too low (${collateral})`);
				}
			}
		}

		collateralInputs.forEach(utxo => {
			this.#body.addCollateral(utxo);
		});
	}

	/**
	 * Calculates fee and balances transaction by sending an output back to changeAddress
	 * First assumes that change output isn't needed, and if that assumption doesn't result in a balanced transaction the change output is created.
	 * Iteratively increments the fee because the fee increase the tx size which in turn increases the fee (always converges within two steps though).
	 * Throws error if transaction can't be balanced.
	 * Shouldn't be used directly
	 * @param {NetworkParams} networkParams 
	 * @param {Address} changeAddress
	 * @param {UTxO[]} spareUtxos - used when there are yet enough inputs to cover everything (eg. due to min output lovelace requirements, or fees)
	 */
	balanceLovelace(networkParams, changeAddress, spareUtxos) {
		// don't include the changeOutput in this value
		let nonChangeOutputValue = this.#body.sumOutputValue();

		// assume a change output is always needed
		const changeOutput = new TxOutput(changeAddress, new Value(0n));

		changeOutput.correctLovelace(networkParams);

		this.#body.addOutput(changeOutput);
		
		const minLovelace = changeOutput.value.lovelace;

		let fee = this.setFee(networkParams, this.estimateFee(networkParams));
		
		let inputValue = this.#body.sumInputAndMintedValue();

		let feeValue = new Value(fee);

		nonChangeOutputValue = feeValue.add(nonChangeOutputValue);

		spareUtxos = spareUtxos.filter(utxo => utxo.value.assets.isZero());
		
		// use some spareUtxos if the inputValue doesn't cover the outputs and fees

		while (!inputValue.ge(nonChangeOutputValue.add(changeOutput.value))) {
			let spare = spareUtxos.pop();

			if (spare === undefined) {
				throw new Error("transaction doesn't have enough inputs to cover the outputs + fees + minLovelace");
			} else {
				this.#body.addInput(spare.asTxInput);

				inputValue = inputValue.add(spare.value);
			}
		}

		// use to the exact diff, which is >= minLovelace
		let diff = inputValue.sub(nonChangeOutputValue);

		assert(diff.assets.isZero(), "unexpected unbalanced assets");
		assert(diff.lovelace >= minLovelace);

		changeOutput.setValue(diff);

		// we can mutate the lovelace value of 'changeOutput' until we have a balanced transaction with precisely the right fee

		let oldFee = fee;
		fee = this.estimateFee(networkParams);

		while (fee != oldFee) {
			this.#body.setFee(fee);

			let diffFee = fee - oldFee;

			// use some more spareUtxos
			while (diffFee  > (changeOutput.value.lovelace - minLovelace)) {
				let spare = spareUtxos.pop();

				if (spare === undefined) {
					throw new Error("not enough clean inputs to cover fees");
				} else {
					this.#body.addInput(spare.asTxInput);

					inputValue = inputValue.add(spare.value);

					diff = diff.add(spare.value);

					changeOutput.setValue(diff);
				}
			}

			changeOutput.value.setLovelace(changeOutput.value.lovelace - diffFee);

			// changeOutput.value.lovelace should still be >= minLovelace at this point

			oldFee = fee;

			fee = this.estimateFee(networkParams);
		}
	}

	/**
	 * Shouldn't be used directly
	 * @param {NetworkParams} networkParams
	 */
	syncScriptDataHash(networkParams) {
		const hash = this.#witnesses.calcScriptDataHash(networkParams);

		this.#body.setScriptDataHash(hash);
	}

	/**
	 * @returns {boolean}
	 */
	isSmart() {
		return this.#witnesses.scripts.length > 0;
	}

	/**
	 * Throws an error if there isn't enough collateral
	 * Also throws an error if the script doesn't require collateral, but collateral was actually included
	 * Shouldn't be used directly
	 * @param {NetworkParams} networkParams 
	 */
	checkCollateral(networkParams) {
		if (this.isSmart()) {
			let minCollateralPct = networkParams.minCollateralPct;

			// only use the exBudget 

			const fee = this.#body.fee;

			this.#body.checkCollateral(networkParams, BigInt(Math.ceil(minCollateralPct*Number(fee)/100.0)));
		} else {
			this.#body.checkCollateral(networkParams, null);
		}
	}

	/**
	 * Throws error if tx is too big
	 * Shouldn't be used directly
	 * @param {NetworkParams} networkParams 
	 */
	checkSize(networkParams) {
		let size = this.toCbor().length;

		if (size > networkParams.maxTxSize) {
			throw new Error("tx too big");
		}
	}

	/**
	 * Final check that fee is big enough
	 * @param {NetworkParams} networkParams 
	 */
	checkFee(networkParams) {
		assert(this.estimateFee(networkParams) <= this.#body.fee, "fee too small");
	}

	/**
	 * Assumes transaction hasn't yet been signed by anyone (i.e. witnesses.signatures is empty)
	 * Mutates 'this'
	 * Note: this is an async function so that a debugger can optionally be attached in the future
	 * @param {NetworkParams} networkParams
	 * @param {Address}       changeAddress
	 * @param {UTxO[]}        spareUtxos - might be used during balancing if there currently aren't enough inputs
	 * @returns {Promise<Tx>}
	 */
	async finalize(networkParams, changeAddress, spareUtxos = []) {
		assert(!this.#valid);

		if (this.#metadata !== null) {
			// Calculate the Metadata hash and add to the TxBody
			this.#body.setMetadataHash(
				new Hash(Crypto.blake2b(this.#metadata.toCbor()))
			);
		}

		if (this.#validTo !== null) {
			this.#body.validTo(
				networkParams.timeToSlot(BigInt(this.#validTo.getTime()))
			);
		}

		if (this.#validFrom !== null) {
			this.#body.validFrom(networkParams.timeToSlot(BigInt(this.#validFrom.getTime())));
		}

		// inputs, minted assets, and withdrawals must all be in a particular order
		this.#body.sort();

		// after inputs etc. have been sorted we can calculate the indices of the redeemers referring to those inputs
		this.#witnesses.updateRedeemerIndices(this.#body);

		this.checkScripts();

		// balance the non-ada assets
		this.balanceAssets(changeAddress)

		// make sure that each output contains the necessary minimum amount of lovelace	
		this.#body.correctOutputs(networkParams);

		// the scripts executed at this point will not see the correct txHash nor the correct fee
		await this.executeRedeemers(networkParams, changeAddress);

		// balance collateral (if collateral wasn't already set manually)
		this.balanceCollateral(networkParams, changeAddress, spareUtxos.slice());

		// balance the lovelace
		this.balanceLovelace(networkParams, changeAddress, spareUtxos.slice());

		// run updateRedeemerIndices again because new inputs may have been added and sorted
		this.#witnesses.updateRedeemerIndices(this.#body);

		// we can only sync scriptDataHash after the redeemer execution costs have been estimated, and final redeemer indices have been determined
		this.syncScriptDataHash(networkParams);

		// a bunch of checks
		this.#body.checkOutputs(networkParams);

		this.checkCollateral(networkParams);

		await this.checkExecutionBudgets(networkParams);

		this.#witnesses.checkExecutionBudgetLimits(networkParams);

		this.checkSize(networkParams);

		this.checkFee(networkParams);

		this.#valid = true;

		return this;
	}

	/**
	 * Throws an error if verify==true and signature is invalid 
	 * Adding many signatures might be a bit slow
	 * @param {Signature} signature 
	 * @param {boolean} verify
	 * @returns {Tx}
	 */
	addSignature(signature, verify = true) {
		assert(this.#valid);

		if (verify) {
			signature.verify(this.bodyHash);
		}

		this.#witnesses.addSignature(signature);

		return this;
	}

	/**
	 * Throws an error if verify==true and any of the signatures is invalid
	 * Adding many signatures might be a bit slow
	 * @param {Signature[]} signatures 
	 * @param {boolean} verify 
	 * @returns {Tx}
	 */
	addSignatures(signatures, verify = true) {
		for (let s of signatures) {
			this.addSignature(s, verify);
		}

		return this;
	}

	/**
	 * @param {number} tag
	 * @param {Metadata} data
	 * @returns {Tx}
	 */
	addMetadata(tag, data) {
		if (this.#metadata === null) {
			this.#metadata = new TxMetadata();
		}

		this.#metadata.add(tag, data);

		return this;
	}

	/**
	 * @returns {TxId}
	 */
	id() {
		assert(this.#valid, "can't get TxId of unfinalized Tx");
		return new TxId(this.bodyHash);
	}
}

/**
 * inputs, minted assets, and withdrawals need to be sorted in order to form a valid transaction
 */
class TxBody extends CborData {
	/**
	 * Inputs must be sorted before submitting (first by TxId, then by utxoIndex)
	 * Spending redeemers must point to the sorted inputs
	 * @type {TxInput[]} 
	 */
	#inputs;

	/** @type {TxOutput[]} */
	#outputs;

	/** @type {bigint} in lovelace */
	#fee;

	/** @type {?bigint} */
	#lastValidSlot;

	/** @type {DCert[]} */
	#certs;

	/**
	 * Withdrawals must be sorted by address
	 * Stake rewarding redeemers must point to the sorted withdrawals
	 * @type {Map<Address, bigint>} 
	 */
	#withdrawals;

	/** @type {?bigint} */
	#firstValidSlot;

	/**
	 * Internally the assets must be sorted by mintingpolicyhash
	 * Minting redeemers must point to the sorted minted assets
	 * @type {Assets} 
	 */
	#minted;

	/** @type {?Hash} */
	#scriptDataHash;

	/** @type {TxInput[]} */
	#collateral;

	/** @type {PubKeyHash[]} */
	#signers;

	/** @type {?TxOutput} */
	#collateralReturn;

	/** @type {bigint} */
	#totalCollateral;

	/** @type {TxInput[]} */
	#refInputs;

	/** @type {?Hash} */
	#metadataHash;

	constructor() {
		super();

		this.#inputs = [];
		this.#outputs = [];
		this.#fee = 0n;
		this.#lastValidSlot = null;
		this.#certs = [];
		this.#withdrawals = new Map();
		this.#firstValidSlot = null;
		this.#minted = new Assets(); // starts as zero value (i.e. empty map)
		this.#scriptDataHash = new Hash((new Array(32)).fill(0)); // initially dummy for more correct body size, (re)calculated upon finalization
		this.#collateral = [];
		this.#signers = [];
		this.#collateralReturn = null;
		this.#totalCollateral = 0n; // doesn't seem to be used anymore
		this.#refInputs = [];
		this.#metadataHash = null;
	}

	/**
	 * @type {TxInput[]}
	 */
	get inputs() {
		return this.#inputs;
	}

	/**
	 * @type {TxOutput[]}
	 */
	get outputs() {
		return this.#outputs;
	}

	get fee() {
		return this.#fee;
	}

	/**
	 * @param {bigint} fee
	 */
	setFee(fee) {
		this.#fee = fee;
	}

	/**
	 * @type {Assets}
	 */
	get minted() {
		return this.#minted;
	}

	/**
	 * @type {TxInput[]}
	 */
	get collateral() {
		return this.#collateral;
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		/**
		 * @type {Map<number, number[]>}
		 */
		let object = new Map();

		object.set(0, CborData.encodeDefList(this.#inputs));
		object.set(1, CborData.encodeDefList(this.#outputs));
		object.set(2, CborData.encodeInteger(this.#fee));
		
		if (this.#lastValidSlot !== null) {
			object.set(3, CborData.encodeInteger(this.#lastValidSlot));
		}

		if (this.#certs.length != 0) {
			object.set(4, CborData.encodeDefList(this.#certs));
		}

		if (this.#withdrawals.size != 0) {
			throw new Error("not yet implemented");
		}

		if (this.#metadataHash !== null) {
			object.set(7, this.#metadataHash.toCbor());
		}

		if (this.#firstValidSlot !== null) {
			object.set(8, CborData.encodeInteger(this.#firstValidSlot));
		}

		if (!this.#minted.isZero()) {
			object.set(9, this.#minted.toCbor());
		}

		if (this.#scriptDataHash !== null) {
			object.set(11, this.#scriptDataHash.toCbor());
		}

		if (this.#collateral.length != 0) {
			object.set(13, CborData.encodeDefList(this.#collateral));
		}

		if (this.#signers.length != 0) {
			object.set(14, CborData.encodeDefList(this.#signers));
		}

		// what is NetworkId used for?
		//object.set(15, CborData.encodeInteger(2n));

		if (this.#collateralReturn !== null) {
			object.set(16, this.#collateralReturn.toCbor());
		}

		if (this.#totalCollateral > 0n) {
			object.set(17, CborData.encodeInteger(this.#totalCollateral));
		}

		if (this.#refInputs.length != 0) {
			object.set(18, CborData.encodeDefList(this.#refInputs));
		}

		return CborData.encodeObject(object);
	}

	/**
	 * @param {number[]} bytes
	 * @returns {TxBody}
	 */
	static fromCbor(bytes) {
		let txBody = new TxBody();

		let done = CborData.decodeObject(bytes, (i, fieldBytes) => {
			switch(i) {
				case 0:
					CborData.decodeList(fieldBytes, (_, itemBytes) => {
						txBody.#inputs.push(TxInput.fromCbor(itemBytes));
					});
					break;
				case 1:
					CborData.decodeList(fieldBytes, (_, itemBytes) => {
						txBody.#outputs.push(TxOutput.fromCbor(itemBytes));
					})
					break;
				case 2:
					txBody.#fee = CborData.decodeInteger(fieldBytes);
					break;
				case 3:
					txBody.#lastValidSlot = CborData.decodeInteger(fieldBytes);
					break;
				case 4:
					CborData.decodeList(fieldBytes, (_, itemBytes) => {
						txBody.#certs.push(DCert.fromCbor(itemBytes));
					});
					break;
				case 5:
					throw new Error("not yet implemented");
				case 6:
					throw new Error("not yet implemented");
				case 7:
					txBody.#metadataHash = Hash.fromCbor(fieldBytes);
					break;
				case 8:
					txBody.#firstValidSlot = CborData.decodeInteger(fieldBytes);
					break;
				case 9:
					txBody.#minted = Assets.fromCbor(fieldBytes);
					break;
				case 10:
					throw new Error("unhandled field");
				case 11:
					txBody.#scriptDataHash = Hash.fromCbor(fieldBytes);
					break;
				case 12:
					throw new Error("unhandled field");
				case 13:
					CborData.decodeList(fieldBytes, (_, itemBytes) => {
						txBody.#collateral.push(TxInput.fromCbor(itemBytes));
					});
					break;
				case 14:
					CborData.decodeList(fieldBytes, (_, itemBytes) => {
						txBody.#signers.push(PubKeyHash.fromCbor(itemBytes));
					});
					break;
				case 15:
					assert(CborData.decodeInteger(fieldBytes) == 2n);
					break;
				case 16:
					txBody.#collateralReturn = TxOutput.fromCbor(fieldBytes);
					break;
				case 17:
					txBody.#totalCollateral = CborData.decodeInteger(fieldBytes);
					break;
				case 18:
					CborData.decodeList(fieldBytes, itemBytes => {
						txBody.#refInputs.push(TxInput.fromCbor(fieldBytes));
					});
					break;
				default:
					throw new Error("unrecognized field");
			}
		});

		assert(done.has(0) && done.has(1) && done.has(2));

		return txBody;
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		return {
			inputs: this.#inputs.map(input => input.dump()),
			outputs: this.#outputs.map(output => output.dump()),
			fee: this.#fee.toString(),
			lastValidSlot: this.#lastValidSlot === null ? null : this.#lastValidSlot.toString(),
			firstValidSlot: this.#firstValidSlot === null ? null : this.#firstValidSlot.toString(),
			minted: this.#minted.isZero() ? null : this.#minted.dump(),
			metadataHash: this.#metadataHash === null ? null : this.#metadataHash.dump(),
			scriptDataHash: this.#scriptDataHash === null ? null : this.#scriptDataHash.dump(),
			collateral: this.#collateral.length == 0 ? null : this.#collateral.map(c => c.dump()),
			signers: this.#signers.length == 0 ? null : this.#signers.map(rs => rs.dump()),
			collateralReturn: this.#collateralReturn === null ? null : this.#collateralReturn.dump(),
			//totalCollateral: this.#totalCollateral.toString(), // doesn't seem to be used anymore
			refInputs: this.#refInputs.map(ri => ri.dump()),
		};
	}

	/**
	 * For now simply returns minus infinity to plus infinity (WiP)
	 * @param {NetworkParams} networkParams
	 * @returns {ConstrData}
	 */
	toValidTimeRangeData(networkParams) {
		return new ConstrData(0, [
			new ConstrData(0, [ // LowerBound
				this.#firstValidSlot === null ? new ConstrData(0, []) : new ConstrData(1, [new IntData(networkParams.slotToTime(this.#firstValidSlot))]), // NegInf
				new ConstrData(1, []), // true
			]),
			new ConstrData(0, [ // UpperBound
				this.#lastValidSlot === null ? new ConstrData(2, []) : new ConstrData(1, [new IntData(networkParams.slotToTime(this.#lastValidSlot))]), // PosInf
				new ConstrData(1, []), // true
			]),
		]);
	}

	/**
	 * @param {NetworkParams} networkParams
	 * @param {Redeemer[]} redeemers
	 * @param {ListData} datums 
	 * @param {TxId} txId
	 * @returns {ConstrData}
	 */
	toTxData(networkParams, redeemers, datums, txId) {
		return new ConstrData(0, [
			new ListData(this.#inputs.map(input => input.toData())),
			new ListData(this.#refInputs.map(input => input.toData())),
			new ListData(this.#outputs.map(output => output.toData())),
			(new Value(this.#fee))._toUplcData(),
			// NOTE: all other Value instances in ScriptContext contain some lovelace, but #minted can never contain any lovelace, yet cardano-node always prepends 0 lovelace to the #minted MapData
			(new Value(0n, this.#minted))._toUplcData(true), 
			new ListData(this.#certs.map(cert => cert.toData())),
			new MapData(Array.from(this.#withdrawals.entries()).map(w => [w[0].toStakingData(), new IntData(w[1])])),
			this.toValidTimeRangeData(networkParams),
			new ListData(this.#signers.map(rs => new ByteArrayData(rs.bytes))),
			new MapData(redeemers.map(r => [r.toScriptPurposeData(this), r.data])),
			new MapData(datums.list.map(d => [
				new ByteArrayData(Crypto.blake2b(d.toCbor())), 
				d
			])),
			new ConstrData(0, [new ByteArrayData(txId.bytes)])
		]);
	}

	/**
	 * @param {NetworkParams} networkParams 
	 * @param {Redeemer[]} redeemers
	 * @param {ListData} datums
	 * @param {number} redeemerIdx
	 * @returns {UplcData}
	 */
	toScriptContextData(networkParams, redeemers, datums, redeemerIdx) {		
		return new ConstrData(0, [
			// tx (we can't know the txId right now, because we don't know the execution costs yet, but a dummy txId should be fine)
			this.toTxData(networkParams, redeemers, datums, TxId.dummy()),
			redeemers[redeemerIdx].toScriptPurposeData(this),
		]);
	}

	/**
	 * @returns {Value}
	 */
	sumInputValue() {
		let sum = new Value();

		for (let input of this.#inputs) {
			if (input.origOutput !== null) {
				sum = sum.add(input.origOutput.value);
			}
		}

		return sum;
	}

	/**
	 * Throws error if any part of the sum is negative (i.e. more is burned than input)
	 * @returns {Value}
	 */
	sumInputAndMintedValue() {
		return this.sumInputValue().add(new Value(0n, this.#minted)).assertAllPositive();
	}

	/**
	 * @returns {Assets}
	 */
	sumInputAndMintedAssets() {
		return this.sumInputAndMintedValue().assets;
	}

	/**
	 * @returns {Value}
	 */
	sumOutputValue() {
		let sum = new Value();

		for (let output of this.#outputs) {
			sum = sum.add(output.value);
		}

		return sum;
	}

	/**
	 * @returns {Assets}
	 */
	sumOutputAssets() {
		return this.sumOutputValue().assets;
	}

	/**
	 * @param {bigint} slot
	 */
	validFrom(slot) {
		this.#firstValidSlot = slot;
	}

	/**
	 * @param {bigint} slot
	 */
	validTo(slot) {
		this.#lastValidSlot = slot;
	}

	/**
	 * Throws error if this.#minted already contains mph
	 * @param {MintingPolicyHash} mph - minting policy hash
	 * @param {[number[], bigint][]} tokens
	 */
	addMint(mph, tokens) {
		this.#minted.addTokens(mph, tokens);
	}

	/**
	 * @param {TxInput} input 
	 * @param {boolean} checkUniqueness
	 */
	addInput(input, checkUniqueness = true) {
		if (input.origOutput === null) {
			throw new Error("TxInput.origOutput must be set when building transaction");
		}

		input.origOutput.value.assertAllPositive();

		if (checkUniqueness) {
			assert(this.#inputs.every(prevInput => {
				return  !prevInput.txId.eq(input.txId) || prevInput.utxoIdx != input.utxoIdx
			}), "input already added before");
		}

		// push, then sort immediately
		this.#inputs.push(input);
		this.#inputs.sort(TxInput.comp);
	}

	/**
	 * Used to remove dummy inputs
	 * Dummy inputs are needed to be able to correctly estimate fees
	 * Throws an error if input doesn't exist in list of inputs
	 * Internal use only!
	 * @param {TxInput} input
	 */
	removeInput(input) {
		let idx = -1;

		// search from end, so removal is exact inverse of addition
		for (let i = this.#inputs.length - 1; i >= 0; i--) {
			if (this.#inputs[i] == input) {
				idx = i;
				break;
			}
		}

		const n = this.#inputs.length;

		assert(idx != -1, "input not found");

		this.#inputs = this.#inputs.filter((_, i) => i != idx);

		assert(this.#inputs.length == n - 1, "input not removed");
	}

	/**
	 * @param {TxInput} input 
	 */
	addRefInput(input) {
		this.#refInputs.push(input);
	}

	/**
	 * @param {TxOutput} output
	 */
	addOutput(output) {
		output.value.assertAllPositive();

		this.#outputs.push(output);
	}

	/**
	 * Used to remove dummy outputs
	 * Dummy outputs are needed to be able to correctly estimate fees
	 * Throws an error if the output doesn't exist in list of outputs
	 * Internal use only!
	 * @param {TxOutput} output 
	 */
	removeOutput(output) {
		let idx = -1;

		// search from end, so removal is exact inverse of addition
		for (let i = this.#outputs.length - 1; i >= 0; i--) {
			if (this.#outputs[i] == output) {
				idx = i;
				break;
			}
		}

		const n = this.#outputs.length;

		assert(idx != -1, "output not found");

		this.#outputs = this.#outputs.filter((_, i) => i != idx);

		assert(this.#outputs.length == n - 1, "output not removed");
	}

	/**
	 * @param {PubKeyHash} hash 
	 */
	addSigner(hash) {
		this.#signers.push(hash);
	}

	/**
	 * @param {TxInput} input 
	 */
	addCollateral(input) {
		this.#collateral.push(input);
	}
	
	/**
	 * @param {Hash | null} scriptDataHash
	 */
	setScriptDataHash(scriptDataHash) {
		this.#scriptDataHash = scriptDataHash;
	}

	/**
	 * @param {Hash} metadataHash
	 */
	setMetadataHash(metadataHash) {
		this.#metadataHash = metadataHash;
	}

	/**
	 * @param {TxOutput | null} output 
	 */
	setCollateralReturn(output) {
		this.#collateralReturn = output;
	}

	/**
	 * Calculates the number of dummy signatures needed to get precisely the right tx size
	 * @returns {number}
	 */
	countUniqueSigners() {
		/** @type {Set<PubKeyHash>} */
		let set = new Set();

		const inputs = this.#inputs.concat(this.#collateral);

		for (let input of inputs) {
			let origOutput = input.origOutput;

			if (origOutput !== null) {
				let pubKeyHash = origOutput.address.pubKeyHash;

				if (pubKeyHash !== null) {
					set.add(pubKeyHash);
				}
			}
		}

		for (let rs of this.#signers) {
			set.add(rs);
		}

		return set.size;
	}

	/**
	 * Script hashes are found in addresses of TxInputs and hashes of the minted MultiAsset
	 * @param {Map<string, number>} set - hashes in hex format
	 */
	collectScriptHashes(set) {
		for (let i = 0; i < this.#inputs.length; i++) {
			const input = this.#inputs[i];

			if (input.origOutput !== null) {
				let scriptHash = input.origOutput.address.validatorHash;

				if (scriptHash !== null) {
					const hash = bytesToHex(scriptHash.bytes);

					if (!set.has(hash)) { 
						set.set(hash, i);
					}
				}
			}
		}

		let mphs = this.#minted.mintingPolicies;

		for (let i = 0; i < mphs.length; i++) {
			const mph = mphs[i];

			const hash = bytesToHex(mph.bytes);

			if (!set.has(hash)) {
				set.set(hash, -i-1);
			}
		}
	}

	/**
	 * Makes sure each output contains the necessary min lovelace
	 * @param {NetworkParams} networkParams
	 */
	correctOutputs(networkParams) {
		for (let output of this.#outputs) {
			output.correctLovelace(networkParams);
		}
	}

	/**
	 * Checks that each output contains enough lovelace
	 * @param {NetworkParams} networkParams
	 */
	checkOutputs(networkParams) {
		for (let output of this.#outputs) {
			let minLovelace = output.calcMinLovelace(networkParams);

			assert(minLovelace <= output.value.lovelace, `not enough lovelace in output (expected at least ${minLovelace.toString()}, got ${output.value.lovelace})`);
		}
	}
	
	/**
	 * @param {NetworkParams} networkParams
	 * @param {?bigint} minCollateral 
	 */
	checkCollateral(networkParams, minCollateral) {
		assert(this.#collateral.length <= networkParams.maxCollateralInputs);

		if (minCollateral === null) {
			assert(this.#collateral.length == 0, "unnecessary collateral included");
		} else {
			let sum = new Value();

			for (let col of this.#collateral) {
				if (col.origOutput === null) {
					throw new Error("expected collateral TxInput.origOutput to be set");
				} else if (!col.origOutput.value.assets.isZero()) {
					throw new Error("collateral can only contain lovelace");
				} else {
					sum = sum.add(col.origOutput.value);
				}
			}

			if (this.#collateralReturn != null) {
				sum = sum.sub(this.#collateralReturn.value);
			}

			assert(sum.lovelace >= minCollateral, "not enough collateral");

			if (sum.lovelace > minCollateral*5n){
				console.error("Warning: way too much collateral");
			}
		}
	}

	/**
	 * Makes sore inputs, withdrawals, and minted assets are in correct order
	 * Mutates
	 */
	sort() {
		// inputs should've been added in sorted manner, so this is just a check
		this.#inputs.forEach((input, i) => {
			if (i > 0) {
				const prev = this.#inputs[i-1];

				// can be less than -1 if utxoIds aren't consecutive
				assert(TxInput.comp(prev, input) <= -1, "inputs not sorted");
			}
		});

		// TODO: also add withdrawals in sorted manner
		this.#withdrawals = new Map(Array.from(this.#withdrawals.entries()).sort((a, b) => {
			return Address.compStakingHashes(a[0], b[0]);
		}));

		// minted assets should've been added in sorted manner, so this is just a check
		this.#minted.assertSorted();
	}

	/**
	 * Used by (indirectly) by emulator to check if slot range is valid.
	 * @param {bigint} slot
	 */
	isValid(slot) {
		if (this.#lastValidSlot != null) {
			if (slot > this.#lastValidSlot) {
				return false;
			}
		}

		if (this.#firstValidSlot != null) {
			if (slot < this.#firstValidSlot) {
				return false;
			}
		}

		return true;
	}
}

export class TxWitnesses extends CborData {
	/** @type {Signature[]} */
	#signatures;

	/** @type {ListData} */
	#datums;

	/** @type {Redeemer[]} */
	#redeemers;

	/** @type {UplcProgram[]} */
	#scripts;

	/** @type {UplcProgram[]} */
	#refScripts;

	constructor() {
		super();
		this.#signatures = [];
		this.#datums = new ListData([]);
		this.#redeemers = [];
		this.#scripts = [];
		this.#refScripts = [];
	}

	/**
	 * @type {Signature[]}
	 */
	get signatures() {
		return this.#signatures;
	}

	/**
	 * Returns all the scripts, including the reference scripts
	 * @type {UplcProgram[]}
	 */
	get scripts() {
		return this.#scripts.slice().concat(this.#refScripts.slice());
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		/**
		 * @type {Map<number, number[]>}
		 */
		let object = new Map();

		if (this.#signatures.length != 0) {
			object.set(0, CborData.encodeDefList(this.#signatures));
		}

		if (this.#datums.list.length != 0) {
			object.set(4, this.#datums.toCbor());
		}

		if (this.#redeemers.length != 0) {
			object.set(5, CborData.encodeDefList(this.#redeemers));
		}

		if (this.#scripts.length != 0) {
			/**
			 * @type {number[][]}
			 */
			let scriptBytes = this.#scripts.map(s => s.toCbor());

			object.set(6, CborData.encodeDefList(scriptBytes));
		}

		return CborData.encodeObject(object);
	}

	/**
	 * @param {number[]} bytes 
	 * @returns {TxWitnesses}
	 */
	static fromCbor(bytes) {
		let txWitnesses = new TxWitnesses();

		CborData.decodeObject(bytes, (i, fieldBytes) => {
			switch(i) {
				case 0:
					CborData.decodeList(fieldBytes, (_, itemBytes) => {
						txWitnesses.#signatures.push(Signature.fromCbor(itemBytes));
					});
					break;
				case 1:
				case 2:
				case 3:
					throw new Error("unhandled field");
				case 4:
					txWitnesses.#datums = ListData.fromCbor(fieldBytes);
					break;
				case 5:
					CborData.decodeList(fieldBytes, (_, itemBytes) => {
						txWitnesses.#redeemers.push(Redeemer.fromCbor(itemBytes));
					});
					break;
				case 6:
					CborData.decodeList(fieldBytes, (_, itemBytes) => {
						txWitnesses.#scripts.push(UplcProgram.fromCbor(itemBytes));
					});
					break;
				default:
					throw new Error("unrecognized field");
			}
		});

		return txWitnesses;
	}

	/**
	 * Throws error if signatures are incorrect
	 * @param {number[]} bodyBytes 
	 */
	verifySignatures(bodyBytes) {
		for (let signature of this.#signatures) {
			signature.verify(Crypto.blake2b(bodyBytes));
		}
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		return {
			signatures: this.#signatures.map(pkw => pkw.dump()),
			datums: this.#datums.list.map(datum => datum.toString()),
			redeemers: this.#redeemers.map(redeemer => redeemer.dump()),
			scripts: this.#scripts.map(script => bytesToHex(script.toCbor())),
			refScripts: this.#refScripts.map(script => bytesToHex(script.toCbor())),
		};
	}

	/**
	 * @param {NetworkParams} networkParams
	 * @returns {bigint}
	 */
	estimateFee(networkParams) {
		let sum = 0n;

		for (let redeemer of this.#redeemers) {
			sum += redeemer.estimateFee(networkParams);
		}

		return sum;
	}

	/**
	 * @param {Signature} signature 
	 */
	addSignature(signature) {
		this.#signatures.push(signature);
	}

	/**
	 * @param {number} n
	 */
	addDummySignatures(n) {
		for (let i = 0 ; i < n; i++) {
			this.#signatures.push(Signature.dummy());
		}
	}

	removeDummySignatures() {
		this.#signatures = this.#signatures.filter(pkw => !pkw.isDummy());
	}

	/**
	 * Index is calculated later
	 * @param {TxInput} input
	 * @param {UplcData} redeemerData 
	 */
	addSpendingRedeemer(input, redeemerData) {
		this.#redeemers.push(new SpendingRedeemer(input, -1, redeemerData)); // actual input index is determined later
	}

	/**
	 * @param {MintingPolicyHash} mph
	 * @param {UplcData} redeemerData
	 */
	addMintingRedeemer(mph, redeemerData) {
		this.#redeemers.push(new MintingRedeemer(mph, -1, redeemerData));
	}

	/**
	 * @param {UplcData} data 
	 */
	addDatumData(data) {
		// check that it hasn't already been included
		for (let prev of this.#datums.list) {
			if (eq(prev.toCbor(), data.toCbor())) {
				return;
			}
		}

		let lst = this.#datums.list;
		lst.push(data);

		this.#datums = new ListData(lst);
	}

	/**
	 * Throws error if script was already added before
	 * @param {UplcProgram} program 
	 * @param {boolean} isRef
	 */
	attachScript(program, isRef = false) {
		let h = program.hash();

		assert(this.#scripts.every(s => !eq(s.hash(), h)));
		assert(this.#refScripts.every(s => !eq(s.hash(), h)));

		if (isRef) {
			this.#refScripts.push(program);
		} else {
			this.#scripts.push(program);
		}
	}

	/**
	 * Retrieves either a regular script or a reference script
	 * @param {Hash} scriptHash - can be ValidatorHash or MintingPolicyHash
	 * @returns {UplcProgram}
	 */
	getScript(scriptHash) {
		return assertDefined(this.scripts.find(s => eq(s.hash(), scriptHash.bytes)));
	}

	/**
	 * @param {TxBody} body
	 */
	updateRedeemerIndices(body) {
		for (let redeemer of this.#redeemers) {
			redeemer.updateIndex(body);
		}
	}

	/**
	 * @param {NetworkParams} networkParams 
	 * @returns {Hash | null} - returns null if there are no redeemers
	 */
	calcScriptDataHash(networkParams) {
		if (this.#redeemers.length > 0) {
			let bytes = CborData.encodeDefList(this.#redeemers);

			if (this.#datums.list.length > 0) {
				bytes = bytes.concat(this.#datums.toCbor());
			}

			// language view encodings?
			let sortedCostParams = networkParams.sortedCostParams;

			bytes = bytes.concat(CborData.encodeMap([[
				CborData.encodeInteger(1n), 
				CborData.encodeDefList(sortedCostParams.map(cp => CborData.encodeInteger(BigInt(cp)))),
			]]));

			return new Hash(Crypto.blake2b(bytes));
		} else {
			return null;
		}
	}

	/**
	 * 
	 * @param {NetworkParams} networkParams 
	 * @param {TxBody} body
	 * @param {Redeemer} redeemer 
	 * @param {UplcData} scriptContext
	 * @returns {Promise<Cost>} 
	 */
	async executeRedeemer(networkParams, body, redeemer, scriptContext) {
		if (redeemer instanceof SpendingRedeemer) {
			const idx = redeemer.inputIndex;

			const origOutput = body.inputs[idx].origOutput;

			if (origOutput === null) {
				throw new Error("expected origOutput to be non-null");
			} else {
				const datumData = origOutput.getDatumData();

				const validatorHash = origOutput.address.validatorHash;

				if (validatorHash === null || validatorHash === undefined) {
					throw new Error("expected validatorHash to be non-null");
				} else {
					const script = this.getScript(validatorHash);

					const args = [
						new UplcDataValue(Site.dummy(), datumData), 
						new UplcDataValue(Site.dummy(), redeemer.data), 
						new UplcDataValue(Site.dummy(), scriptContext),
					];

					const profile = await script.profile(args, networkParams);

					profile.messages.forEach(m => console.log(m));

					if (profile.result instanceof UserError) {	
						throw profile.result;
					} else {
						return {mem: profile.mem, cpu: profile.cpu};
					}
				}
			}
		} else if (redeemer instanceof MintingRedeemer) {
			const mph = body.minted.mintingPolicies[redeemer.mphIndex];

			const script = this.getScript(mph);

			const args = [
				new UplcDataValue(Site.dummy(), redeemer.data),
				new UplcDataValue(Site.dummy(), scriptContext),
			];

			const profile = await script.profile(args, networkParams);

			profile.messages.forEach(m => console.log(m));

			if (profile.result instanceof UserError) {	
				throw profile.result;
			} else {
				return {mem: profile.mem, cpu: profile.cpu};
			}
		} else {
			throw new Error("unhandled redeemer type");
		}
	}

	/**
	 * Executes the redeemers in order to calculate the necessary ex units
	 * @param {NetworkParams} networkParams 
	 * @param {TxBody} body - needed in order to create correct ScriptContexts
	 * @param {Address} changeAddress - needed for dummy input and dummy output
	 * @returns {Promise<void>}
	 */
	async executeRedeemers(networkParams, body, changeAddress) {
		assert(config.N_DUMMY_INPUTS == 1 || config.N_DUMMY_INPUTS == 2, "expected N_DUMMY_INPUTS==1 or N_DUMMY_INPUTS==2");
		const twoDummyInputs = config.N_DUMMY_INPUTS == 2;

		const fee = networkParams.maxTxFee;

		// Additional 2 dummy inputs and 1 dummy output to compensate for balancing inputs and outputs that might be added later
		// The reason for needing 2 dummy inputs is that one needs to be at the beginning of the body.inputs list (TxId 0000...), and the other needs TxId ffffff (at the end of the list)
		// TxId ffffff overestimates the cost of printing the TxIds, and the dummy TxId 00000 overestimates iterating over body.inputs
		// We can't just prepend a dummy input with TxId ffffff, because some scripts might be relying on the order of the inputs (eg. counting votes in DAOs)

		// 1000 ADA should be enough as a dummy input/output
		const dummyInput1 = new TxInput(
			TxId.dummy(0),
			0n,
			new TxOutput(
				changeAddress,
				new Value(fee + 1000_000_000n)
			)
		);
		
		const dummyInput2 = new TxInput(
			TxId.dummy(255),
			999n,
			new TxOutput(
				changeAddress,
				new Value(1000_000_000n)
			)
		);

		const dummyOutput = new TxOutput(
			changeAddress,
			new Value(twoDummyInputs ? 2000_000_000n : 1000_000_000n)
		);

		body.setFee(fee);
		body.addInput(dummyInput1, false);
		if (twoDummyInputs) {
			body.addInput(dummyInput2, false);
		}
		body.addOutput(dummyOutput);

		this.updateRedeemerIndices(body);

		for (let i = 0; i < this.#redeemers.length; i++) {
			const redeemer = this.#redeemers[i];

			const scriptContext = body.toScriptContextData(networkParams, this.#redeemers, this.#datums, i);

			const cost = await this.executeRedeemer(networkParams, body, redeemer, scriptContext);

			redeemer.setCost(cost);
		}

		body.removeInput(dummyInput1);
		if (twoDummyInputs) {
			body.removeInput(dummyInput2);
		}
		body.removeOutput(dummyOutput);

		this.updateRedeemerIndices(body);
	}

	/**
	 * Reruns all the redeemers to make sure the ex budgets are still correct (can change due to outputs added during rebalancing)
	 * @param {NetworkParams} networkParams 
	 * @param {TxBody} body 
	 */
	async checkExecutionBudgets(networkParams, body) {
		for (let i = 0; i < this.#redeemers.length; i++) {
			const redeemer = this.#redeemers[i];

			const scriptContext = body.toScriptContextData(networkParams, this.#redeemers, this.#datums, i);

			const cost = await this.executeRedeemer(networkParams, body, redeemer, scriptContext);

			if (redeemer.memCost < cost.mem) {
				throw new Error("internal finalization error, redeemer mem budget too low");
			} else if (redeemer.cpuCost < cost.cpu) {
				throw new Error("internal finalization error, redeemer cpu budget too low");
			}
		}
	}

	/**
	 * Throws error if execution budget is exceeded
	 * @param {NetworkParams} networkParams
	 */
	checkExecutionBudgetLimits(networkParams) {
		let totalMem = 0n;
		let totalCpu = 0n;

		for (let redeemer of this.#redeemers) {
			totalMem += redeemer.memCost;
			totalCpu += redeemer.cpuCost;
		}

		let [maxMem, maxCpu] = networkParams.maxTxExecutionBudget;

		if (totalMem >= BigInt(maxMem)) {
			throw new Error("execution budget exceeded for mem");
		}

		if (totalCpu >= BigInt(maxCpu)) {
			throw new Error("execution budget exceeded for cpu");
		}
	}
}

/**
 * @package
 */
class TxInput extends CborData {
	/** @type {TxId} */
	#txId;

	/** @type {bigint} */
	#utxoIdx;

	/** @type {?TxOutput} */
	#origOutput;

	/**
	 * @param {TxId} txId 
	 * @param {bigint} utxoIdx 
	 * @param {?TxOutput} origOutput - used during building, not part of serialization
	 */
	constructor(txId, utxoIdx, origOutput = null) {
		super();
		this.#txId = txId;
		this.#utxoIdx = utxoIdx;
		this.#origOutput = origOutput;
	}
	
	/**
	 * @type {TxId}
	 */
	get txId() {
		return this.#txId;
	}

	/**
	 * @type {bigint}
	 */
	get utxoIdx() {
		return this.#utxoIdx;
	}

	/**
	 * @type {TxOutput}
	 */
	get origOutput() {
		if (this.#origOutput === null) {
			throw new Error("origOutput not set");
		} else {
			return this.#origOutput;
		}
	}

	/**
	 * Shortcut
	 * @type {Value}
	 */
	get value() {
		return this.origOutput.value;
	}

	/**
	 * Shortcut
	 * @type {Address}
	 */
	get address() {
		return this.origOutput.address;
	}

	/**
	 * @returns {ConstrData}
	 */
	toOutputIdData() {
		return new ConstrData(0, [
			new ConstrData(0, [new ByteArrayData(this.#txId.bytes)]),
			new IntData(this.#utxoIdx),
		]);
	}

	/**
	 * @returns {ConstrData}
	 */
	toData() {
		if (this.#origOutput === null) {
			throw new Error("expected to be non-null");
		} else {
			return new ConstrData(0, [
				this.toOutputIdData(),
				this.#origOutput.toData(),
			]);
		}
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return CborData.encodeTuple([
			this.#txId.toCbor(),
			CborData.encodeInteger(this.#utxoIdx),
		]);
	}

	/**
	 * @param {number[]} bytes 
	 * @returns {TxInput}
	 */
	static fromCbor(bytes) {
		/** @type {?TxId} */
		let txId = null;

		/** @type {?bigint} */
		let utxoIdx = null;

		CborData.decodeTuple(bytes, (i, fieldBytes) => {
			switch(i) {
				case 0:
					txId = TxId.fromCbor(fieldBytes);
					break;
				case 1:
					utxoIdx = CborData.decodeInteger(fieldBytes);
					break;
				default:
					throw new Error("unrecognized field");
			}
		});

		if (txId === null || utxoIdx === null) {
			throw new Error("unexpected");
		} else {
			return new TxInput(txId, utxoIdx);
		}
	}

	/**
	 * Tx inputs must be ordered. 
	 * The following function can be used directly by a js array sort
	 * @param {TxInput} a
	 * @param {TxInput} b
	 * @returns {number}
	 */
	static comp(a, b) {
		let res = ByteArrayData.comp(a.#txId.bytes, b.#txId.bytes);

		if (res == 0) {
			return Number(a.#utxoIdx - b.#utxoIdx);
		} else {
			return res;
		}
	} 

	/**
	 * @returns {Object}
	 */
	dump() {
		return {
			txId: this.#txId.dump(),
			utxoIdx: this.#utxoIdx.toString(),
			origOutput: this.#origOutput !== null ? this.#origOutput.dump() : null,
		};
	}
}

/**
 * UTxO wraps TxInput
 */
export class UTxO {
	#input;

	/**
	 * @param {TxId} txId 
	 * @param {bigint} utxoIdx 
	 * @param {TxOutput} origOutput
	 */
	constructor(txId, utxoIdx, origOutput) {
		this.#input = new TxInput(txId, utxoIdx, origOutput);
	}

	/**
	 * @type {TxId}
	 */
	get txId() {
		return this.#input.txId;
	}

	/**
	 * @type {bigint}
	 */
	get utxoIdx() {
		return this.#input.utxoIdx;
	}

	/**
	 * @type {TxInput}
	 */
	get asTxInput() {
		return this.#input;
	}

	/**
	 * @type {Value}
	 */
	get value() {
		return this.#input.value;
	}

	/**
	 * @type {TxOutput}
	 */
	get origOutput() {
		return this.#input.origOutput;
	}

	/**
	 * Deserializes UTxO format used by wallet connector
	 * @param {number[]} bytes
	 * @returns {UTxO}
	 */
	static fromCbor(bytes) {
		/** @type {?TxInput} */
		let maybeTxInput = null;

		/** @type {?TxOutput} */
		let origOutput = null;

		CborData.decodeTuple(bytes, (i, fieldBytes) => {
			switch(i) {
				case 0:
					maybeTxInput = TxInput.fromCbor(fieldBytes);
					break;
				case 1:
					origOutput = TxOutput.fromCbor(fieldBytes);
					break;
				default:
					throw new Error("unrecognized field");
			}
		});

		if (maybeTxInput !== null && origOutput !== null) {
            /** @type {TxInput} */
            const txInput = maybeTxInput;
            
			return new UTxO(txInput.txId, txInput.utxoIdx, origOutput);
		} else {
			throw new Error("unexpected");
		}
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return CborData.encodeTuple([
			this.#input.toCbor(),
			this.#input.origOutput.toCbor()
		]);
	}

	/**
	 * @param {UTxO[]} utxos
	 * @returns {Value}
	 */
	static sumValue(utxos) {
		let sum = new Value();

		for (let utxo of utxos) {
			sum = sum.add(utxo.value);
		}

		return sum;
	}
}

export class TxRefInput extends TxInput {
	/**
	 * @param {TxId} txId 
	 * @param {bigint} utxoId
	 * @param {TxOutput} origOutput
	 */
	constructor(txId, utxoId, origOutput) {
		super(txId, utxoId, origOutput);
	}
}

export class TxOutput extends CborData {
	/** @type {Address} */
	#address;

	/** @type {Value} */
	#value;

	/** @type {?Datum} */
	#datum;

	/** @type {?UplcProgram} */
	#refScript;

	/**
	 * @param {Address} address 
	 * @param {Value} value 
	 * @param {?Datum} datum 
	 * @param {?UplcProgram} refScript 
	 */
	constructor(address, value, datum = null, refScript = null) {
		assert(datum === null || datum instanceof Datum); // check this explicitely because caller might be using this constructor without proper type-checking
		super();
		this.#address = address;
		this.#value = value;
		this.#datum = datum;
		this.#refScript = refScript;
	}

	get address() {
		return this.#address;
	}

	/**
	 * Mutation is handy when correctin the quantity of lovelace in a utxo
	 * @param {Address} addr
	 */
	setAddress(addr) {
		this.#address = addr;
	}

	get value() {
		return this.#value;
	}

	/**
	 * Mutation is handy when correcting the quantity of lovelace in a utxo
	 * @param {Value} val
	 */
	setValue(val) {
		this.#value = val;
	}

	get datum() {
		return this.#datum;
	}

	/**
	 * Mutation is handy when correctin the quantity of lovelace in a utxo 
	 * @param {Datum} datum 
	 */
	setDatum(datum) {
		this.#datum = datum;
	}

	/**
	 * @returns {UplcData}
	 */
	getDatumData() {
		if (this.#datum === null) {
			throw new Error("no datum data available");
		} else {
			let data = this.#datum.data;
			if (data === null) {
				throw new Error("no datum data available");
			} else {
				return data;
			}
		}
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		if ((this.#datum === null || this.#datum instanceof HashedDatum) && this.#refScript === null && !config.STRICT_BABBAGE) {
			// this is needed to match eternl wallet (de)serialization (annoyingly eternl deserializes the tx and then signs its own serialization)
			// hopefully cardano-cli signs whatever serialization we choose (so we use the eternl variant in order to be compatible with both)

			let fields = [
				this.#address.toCbor(),
				this.#value.toCbor()
			];

			if (this.#datum !== null) {
				if (this.#datum instanceof HashedDatum) {
					fields.push(this.#datum.hash.toCbor());
				} else {
					throw new Error("unexpected");
				}
			}

			return CborData.encodeTuple(fields);
		} else {
			/** @type {Map<number, number[]>} */
			let object = new Map();

			object.set(0, this.#address.toCbor());
			object.set(1, this.#value.toCbor());

			if (this.#datum !== null) {
				object.set(2, this.#datum.toCbor());
			}

			if (this.#refScript !== null) {
				object.set(3, CborData.encodeTag(24n).concat(CborData.encodeBytes(
					CborData.encodeTuple([
						CborData.encodeInteger(BigInt(this.#refScript.versionTag())),
						this.#refScript.toCbor()
					])
				)));
			}

			return CborData.encodeObject(object);
		}
	}

	/**
	 * @param {number[]} bytes 
	 * @returns {TxOutput}
	 */
	static fromCbor(bytes) {
		/** @type {?Address} */
		let address = null;

		/** @type {?Value} */
		let value = null;

		/** @type {?Datum} */
		let outputDatum = null;

		/** @type {?UplcProgram} */
		let refScript = null;

		if (CborData.isObject(bytes)) {
			CborData.decodeObject(bytes, (i, fieldBytes) => {
				switch(i) { 
					case 0:
						address = Address.fromCbor(fieldBytes);
						break;
					case 1:
						value = Value.fromCbor(fieldBytes);
						break;
					case 2:
						outputDatum = Datum.fromCbor(fieldBytes);
						break;
					case 3:
						assert(CborData.decodeTag(fieldBytes) == 24n);

						let tupleBytes = CborData.decodeBytes(fieldBytes);

						CborData.decodeTuple(tupleBytes, (tupleIdx, innerTupleBytes) => {
							assert(refScript === null);

							switch(tupleIdx) {
								case 0:
									throw new Error("native refScript unhandled");
								case 1:
									throw new Error("plutuScriptV1 as refScript unhandled");
								case 2:
									refScript = UplcProgram.fromCbor(innerTupleBytes);
								default:
									throw new Error("unhandled script type for refScript");
							}
						});

						break;
					default:
						throw new Error("unrecognized field");
				}
			});
		} else if (CborData.isTuple(bytes)) {
			// this is the pre-vasil format, which is still sometimes returned by wallet connector functions
			CborData.decodeTuple(bytes, (i, fieldBytes) => {
				switch(i) { 
					case 0:
						address = Address.fromCbor(fieldBytes);
						break;
					case 1:
						value = Value.fromCbor(fieldBytes);
						break;
					case 2:
						outputDatum = new HashedDatum(DatumHash.fromCbor(fieldBytes));
						break;
					default:
						throw new Error("unrecognized field");
				}
			});
		} else {
			throw new Error("expected object or tuple for TxOutput");
		}

		if (address === null || value === null) {
			throw new Error("unexpected");
		} else {
			return new TxOutput(address, value, outputDatum, refScript);
		}
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		return {
			address: this.#address.dump(),
			value: this.#value.dump(),
			datum: this.#datum === null ? null : this.#datum.dump(),
			refScript: this.#refScript === null ? null : bytesToHex(this.#refScript.toCbor()),
		};
	}

	/**
	 * @returns {ConstrData}
	 */
	toData() {
		let datum = new ConstrData(0, []); // none
		if (this.#datum !== null) {
			datum = this.#datum.toData();
		}

		return new ConstrData(0, [
			this.#address._toUplcData(),
			this.#value._toUplcData(),
			datum,
			new ConstrData(1, []), // TODO: how to include the ref script
		]);
	}

	/**
	 * Each UTxO must contain some minimum quantity of lovelace to avoid that the blockchain is used for data storage
	 * @param {NetworkParams} networkParams
	 * @returns {bigint}
	 */
	calcMinLovelace(networkParams) {
		let lovelacePerByte = networkParams.lovelacePerUTXOByte;

		let correctedSize = this.toCbor().length + 160; // 160 accounts for some database overhead?

		return BigInt(correctedSize)*BigInt(lovelacePerByte);
	}

	/**
	 * Mutates. Makes sure the output contains at least the minimum quantity of lovelace.
	 * Other parts of the output can optionally also be mutated
	 * @param {NetworkParams} networkParams 
	 * @param {?((output: TxOutput) => void)} updater
	 */
	correctLovelace(networkParams, updater = null) {
		let minLovelace = this.calcMinLovelace(networkParams);

		while (this.#value.lovelace < minLovelace) {
			this.#value.setLovelace(minLovelace);

			if (updater != null) {
				updater(this);
			}

			minLovelace = this.calcMinLovelace(networkParams);
		}
	}
}

// TODO: enum members
class DCert extends CborData {
	constructor() {
		super();
	}

	/**
	 * @param {number[]} bytes 
	 * @returns {DCert}
	 */
	static fromCbor(bytes) {
		throw new Error("not yet implemented");
	}

	/**
	 * @returns {ConstrData}
	 */
	toData() {
		throw new Error("not yet implemented");
	}
}

/**
 * Convenience address that is used to query all assets controlled by a given StakeHash (can be scriptHash or regular stakeHash)
 */
export class StakeAddress {
	#bytes;

	/**
	 * @param {number[]} bytes 
	 */
	constructor(bytes) {
		assert(bytes.length == 29);

		this.#bytes = bytes;
	}

	/**
	 * @type {number[]}
	 */
	get bytes() {
		return this.#bytes;
	}

	/**
	 * @param {StakeAddress} sa
	 * @returns {boolean}
	 */
	static isForTestnet(sa) {
		return Address.isForTestnet(new Address(sa.bytes));
	}

	/**
	 * Convert regular Address into StakeAddress.
	 * Throws an error if the given Address doesn't have a staking part.
	 * @param {Address} addr 
	 * @returns {StakeAddress}
	 */
	static fromAddress(addr) {
		const sh = addr.stakingHash;

		if (sh === null) {
			throw new Error("address doesn't have a staking part");
		} else {
			return StakeAddress.fromHash(Address.isForTestnet(addr), sh);
		}
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return CborData.encodeBytes(this.#bytes);
	}

	/**
	 * @param {number[]} bytes
	 * @returns {StakeAddress}
	 */
	static fromCbor(bytes) {
		return new StakeAddress(CborData.decodeBytes(bytes));
	}

	/**
	 * @returns {string}
	 */
	toBech32() {
		return Crypto.encodeBech32(
			StakeAddress.isForTestnet(this) ? "stake_test" : "stake",
			this.bytes
		);
	}

	/**
	 * @param {string} str
	 * @returns {StakeAddress}
	 */
	static fromBech32(str) {
		let [prefix, bytes] = Crypto.decodeBech32(str);

		let result = new StakeAddress(bytes);

		assert(prefix == (StakeAddress.isForTestnet(result) ? "stake_test" : "stake"), "invalid StakeAddress prefix");

		return result;
	}

	/**
	 * Returns the raw StakeAddress bytes as a hex encoded string
	 * @returns {string}
	 */
	toHex() {
		return bytesToHex(this.#bytes);
	}

	/**
	 * Doesn't check validity
	 * @param {string} hex
	 * @returns {StakeAddress}
	 */
	static fromHex(hex) {
		return new StakeAddress(hexToBytes(hex));
	}

	/**
	 * Address with only staking part (regular StakeKeyHash)
	 * @param {boolean} isTestnet
	 * @param {StakeKeyHash} hash
	 * @returns {StakeAddress}
	 */
	static fromStakeKeyHash(isTestnet, hash) {
		return new StakeAddress(
			[isTestnet ? 0xe0 : 0xe1].concat(hash.bytes)
		);
	}

	/**
	 * Address with only staking part (script StakingValidatorHash)
	 * @param {boolean} isTestnet
	 * @param {StakingValidatorHash} hash
	 * @returns {StakeAddress}
	 */
	static fromStakingValidatorHash(isTestnet, hash) {
		return new StakeAddress(
			[isTestnet ? 0xf0 : 0xf1].concat(hash.bytes)
		);
	}

	/**
	 * @param {boolean} isTestnet
	 * @param {StakeKeyHash | StakingValidatorHash} hash
	 * @returns {StakeAddress}
	 */
	static fromHash(isTestnet, hash) {
		if (hash instanceof StakeKeyHash) {
			return StakeAddress.fromStakeKeyHash(isTestnet, hash);
		} else {
			return StakeAddress.fromStakingValidatorHash(isTestnet, hash);
		}
	}

	/**
	 * @returns {StakeKeyHash | StakingValidatorHash}
	 */
	get stakingHash() {
		const type = this.bytes[0];

		if (type == 0xe0 || type == 0xe1) {
			return new StakeKeyHash(this.bytes.slice(1));
		} else if (type == 0xf0 || type == 0xf1) {
			return new StakingValidatorHash(this.bytes.slice(1));
		} else {
			throw new Error("bad StakeAddress header");
		}
	}
}

export class Signature extends CborData {
	/** @type {number[]} */
	#pubKey;

	/** @type {number[]} */
	#signature;

	/**
	 * @param {number[]} pubKey 
	 * @param {number[]} signature 
	 */
	constructor(pubKey, signature) {
		super();
		this.#pubKey = pubKey;
		this.#signature = signature;
	}

	/**
	 * @returns {Signature}
	 */
	static dummy() {
		return new Signature((new Array(32)).fill(0), (new Array(64)).fill(0));
	}

	/**
	 * @returns {boolean}
	 */
	isDummy() {
		return this.#pubKey.every(b => b == 0) && this.#signature.every(b => b == 0);
	}

	toCbor() {
		return CborData.encodeTuple([
			CborData.encodeBytes(this.#pubKey),
			CborData.encodeBytes(this.#signature),
		]);
	}

	/**
	 * @param {number[]} bytes 
	 * @returns {Signature}
	 */
	static fromCbor(bytes) {
		/** @type {?number[]} */
		let pubKey = null;

		/** @type {?number[]} */
		let signature = null;

		let n = CborData.decodeTuple(bytes, (i, fieldBytes) => {
			switch(i) {
				case 0:
					pubKey = CborData.decodeBytes(fieldBytes);
					break;
				case 1:
					signature = CborData.decodeBytes(fieldBytes);
					break;
				default:
					throw new Error("unrecognized field");
			}
		});

		assert(n == 2);

		if (pubKey === null || signature === null) {
			throw new Error("unexpected");
		} else {
			return new Signature(pubKey, signature);
		}
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		return {
			pubKey: bytesToHex(this.#pubKey),
			pubKeyHash: bytesToHex(Crypto.blake2b(this.#pubKey, 28)),
			signature: bytesToHex(this.#signature),
		};
	}

	/**
	 * Throws error if incorrect
	 * @param {number[]} msg
	 */
	verify(msg) {
		if (this.#signature === null) {
			throw new Error("signature can't be null");
		} else {
			if (this.#pubKey === null) {
				throw new Error("pubKey can't be null");
			} else {
				if (!Crypto.Ed25519.verify(this.#signature, msg, this.#pubKey)) {
					throw new Error("incorrect signature");
				}
			}
		}
	}
}

class Redeemer extends CborData {
	/** @type {UplcData} */
	#data;

	/** @type {Cost} */
	#exUnits;

	/**
	 * @param {UplcData} data 
	 * @param {Cost} exUnits 
	 */
	constructor(data, exUnits = {mem: 0n, cpu: 0n}) {
		super();
		this.#data = data;
		this.#exUnits = exUnits;
	}

	/**
	 * @type {UplcData}
	 */
	get data() {
		return this.#data;
	}

	/**
	 * @type {bigint}
	 */
	get memCost() {
		return this.#exUnits.mem;
	}

	/**
	 * @type {bigint}
	 */
	get cpuCost() {
		return this.#exUnits.cpu;
	}

	/**
	 * type:
	 *   0 -> spending
	 *   1 -> minting 
	 *   2 -> certifying
	 *   3 -> rewarding
	 * @param {number} type 
	 * @param {number} index 
	 * @returns {number[]}
	 */
	toCborInternal(type, index) {
		return CborData.encodeTuple([
			CborData.encodeInteger(BigInt(type)),
			CborData.encodeInteger(BigInt(index)),
			this.#data.toCbor(),
			CborData.encodeTuple([
				CborData.encodeInteger(this.#exUnits.mem),
				CborData.encodeInteger(this.#exUnits.cpu),
			]),
		]);
	}

	/**
	 * @param {number[]} bytes 
	 * @returns {Redeemer}
	 */
	static fromCbor(bytes) {
		/** @type {?number} */
		let type = null;

		/** @type {?number} */
		let index = null;

		/** @type {?UplcData} */
		let data = null;

		/** @type {?Cost} */
		let cost = null;

		let n = CborData.decodeTuple(bytes, (i, fieldBytes) => {
			switch(i) {
				case 0:
					type = Number(CborData.decodeInteger(fieldBytes));
					break;
				case 1:
					index = Number(CborData.decodeInteger(fieldBytes));
					break;
				case 2:
					data = UplcData.fromCbor(fieldBytes);
					break;
				case 3: 
					/** @type {?bigint} */
					let mem = null;

					/** @type {?bigint} */
					let cpu = null;

					let m = CborData.decodeTuple(fieldBytes, (j, subFieldBytes) => {
						switch (j) {
							case 0:
								mem = CborData.decodeInteger(subFieldBytes);
								break;
							case 1:
								cpu = CborData.decodeInteger(subFieldBytes);
								break;
							default:
								throw new Error("unrecognized field");
						}
					});

					assert(m == 2);

					if (mem === null || cpu === null) {
						throw new Error("unexpected");
					} else {
						cost = {mem: mem, cpu: cpu};
					}
					break;
				default:
					throw new Error("unrecognized field");
			}
		});

		assert(n == 4);

		if (type === null || index === null || data === null || cost === null) {
			throw new Error("unexpected");
		} else {

			switch(type) {
				case 0:
					return new SpendingRedeemer(null, index, data, cost);
				case 1:
					return new MintingRedeemer(null, index, data, cost);
				default:
					throw new Error("unhandled redeemer type (Todo)");	
			}
		}
	}

	/**
	 * @returns {Object}
	 */
	dumpInternal() {
		return {
			data: this.#data.toString(),
			exUnits: {
				mem: this.#exUnits.mem.toString(),
				cpu: this.#exUnits.cpu.toString(),
			},
		}
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		throw new Error("not yet implemented");
	}

	/**
	 * @param {TxBody} body 
	 * @returns {ConstrData}
	 */
	toScriptPurposeData(body) {
		throw new Error("not yet implemented");
	}

	/**
	 * @param {TxBody} body 
	 */
	updateIndex(body) {
		throw new Error("not yet implemented");
	}

	/**
	 * @param {Cost} cost 
	 */
	setCost(cost) {
		this.#exUnits = cost;
	}

	/**
	 * @param {NetworkParams} networkParams 
	 * @returns {bigint}
	 */
	estimateFee(networkParams) {
		// this.#exUnits.mem and this.#exUnits can be 0 if we are estimating the fee for an initial balance
		
		let [memFee, cpuFee] = networkParams.exFeeParams;

		return BigInt(Math.ceil(Number(this.#exUnits.mem)*memFee + Number(this.#exUnits.cpu)*cpuFee));
	}
}

class SpendingRedeemer extends Redeemer {
	#input;
	#inputIndex;

	/**
	 * @param {?TxInput} input
	 * @param {number} inputIndex
	 * @param {UplcData} data 
	 * @param {Cost} exUnits 
	 */
	constructor(input, inputIndex, data, exUnits = {mem: 0n, cpu: 0n}) {
		super(data, exUnits);

		this.#input = input
		this.#inputIndex = inputIndex;
	}

	/**
	 * @type {number}
	 */
	get inputIndex() {
		return this.#inputIndex;
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return this.toCborInternal(0, this.#inputIndex);
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		let obj = super.dumpInternal();

		obj["type"] = 0;
		obj["typeName"] = "spending";
		obj["inputIndex"] = this.#inputIndex;

		return obj;
	}

	/**
	 * @param {TxBody} body 
	 * @returns {ConstrData}
	 */
	toScriptPurposeData(body) {
		return new ConstrData(1, [
			body.inputs[this.#inputIndex].toOutputIdData(),
		]);
	}

	/**
	 * @param {TxBody} body
	 */
	updateIndex(body) {
		if (this.#input == null) {
			throw new Error("input can't be null");
		} else {
			this.#inputIndex = body.inputs.findIndex(i => {
				return i.txId.eq(assertDefined(this.#input).txId) && (i.utxoIdx == assertDefined(this.#input).utxoIdx)
			});

			assert(this.#inputIndex != -1);
		}
	}
}

class MintingRedeemer extends Redeemer {
	#mph;
	#mphIndex;

	/**
	 * @param {?MintingPolicyHash} mph
	 * @param {number} mphIndex
	 * @param {UplcData} data
	 * @param {Cost} exUnits
	 */
	constructor(mph, mphIndex, data, exUnits = {mem: 0n, cpu: 0n}) {
		super(data, exUnits);

		this.#mph = mph;
		this.#mphIndex = mphIndex;
	}

	/**
	 * @type {number}
	 */
	get mphIndex() {
		return this.#mphIndex;
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return this.toCborInternal(1, this.#mphIndex);
	}

	/** 
	 * @returns {Object}
	 */
	dump() {
		let obj = super.dumpInternal();

		obj["type"] = 1;
		obj["typeName"] = "minting";
		obj["mphIndex"] = this.#mphIndex;

		return obj;
	}

	/**
	 * @param {TxBody} body 
	 * @returns {ConstrData}
	 */
	toScriptPurposeData(body) {
		let mph = body.minted.mintingPolicies[this.#mphIndex];

		return new ConstrData(0, [
			new ByteArrayData(mph.bytes),
		]);
	}

	/**
	 * @param {TxBody} body 
	 */
	updateIndex(body) {
		if (this.#mph === null) {
			throw new Error("can't have null mph at this point");
		} else {
			this.#mphIndex = body.minted.mintingPolicies.findIndex(mph => mph.eq(assertDefined(this.#mph)));

			assert(this.#mphIndex != -1);
		}
	}
}

/**
 * Inside helios this type is named OutputDatum in order to distinguish it from the user defined Datum,
 * but outside helios scripts there isn't much sense to keep using the name 'OutputDatum' instead of Datum
 */
export class Datum extends CborData {
	constructor() {
		super();
	}

	/**
	 * @param {number[]} bytes 
	 * @returns {Datum}
	 */
	static fromCbor(bytes) {
		/** @type {?number} */
		let type = null;

		/** @type {?Datum} */
		let res = null;

		let n = CborData.decodeTuple(bytes, (i, fieldBytes) => {
			switch(i) {
				case 0:
					type = Number(CborData.decodeInteger(fieldBytes));
					break;
				case 1:
					if (type == 0) {
						res = new HashedDatum(DatumHash.fromCbor(fieldBytes));
					} else if (type == 1) {
						assert(CborData.decodeTag(fieldBytes) == 24n);

						let dataBytes = CborData.decodeBytes(fieldBytes);
						let data = UplcData.fromCbor(dataBytes);

						res = new InlineDatum(data);
					}
					break;
				default:
					throw new Error("unrecognized field label");
			}
		});

		assert(n == 2);

		if (type === null || res === null) {
			throw new Error("unexpected");
		} else {
			return res;
		}
	}

	/**
	 * @param {UplcDataValue | UplcData | HeliosData} data
	 * @returns {HashedDatum}
	 */
	static hashed(data) {
		if (data instanceof HeliosData) {
			return HashedDatum.fromData(data._toUplcData());
		} else {
			return HashedDatum.fromData(UplcDataValue.unwrap(data));
		}
	}

	/**
	 * @param {UplcDataValue | UplcData | HeliosData} data
	 * @returns {InlineDatum}
	 */
	static inline(data) {
		if (data instanceof HeliosData) {
			return new InlineDatum(data._toUplcData());
		} else {
			return new InlineDatum(UplcDataValue.unwrap(data));
		}
	}

	/**
	 * @returns {boolean}
	 */
	isInline() {
		throw new Error("not yet implemented");
	}

	/**
	 * @returns {boolean}
	 */
	isHashed() {
		throw new Error("not yet implemented");
	}

	/**
	 * @type {DatumHash}
	 */
	get hash() {
		throw new Error("not yet implemented");
	}

	/**
	 * @type {?UplcData}
	 */
	get data() {
		throw new Error("not yet implemented");
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		throw new Error("not yet implemented");
	}

	/**
	 * @returns {ConstrData}
	 */
	toData() {
		throw new Error("not yet implemented");
	}
}

/**
 * Inside helios this type is named OutputDatum::Hash in order to distinguish it from the user defined Datum,
 * but outside helios scripts there isn't much sense to keep using the name 'OutputDatum' instead of Datum
 */
export class HashedDatum extends Datum {
	/** @type {DatumHash} */
	#hash;

	/** @type {?UplcData} */
	#origData;

	/**
	 * @param {DatumHash} hash 
	 * @param {?UplcData} origData
	 */
	constructor(hash, origData = null) {
		super();
		this.#hash = hash;
		this.#origData = origData;

		if (this.#origData !== null) {
			assert(eq(this.#hash.bytes, Crypto.blake2b(this.#origData.toCbor())));
		}
	}

	/**
	 * @returns {boolean}
	 */
	isInline() {
		return false;
	}

	/**
	 * @returns {boolean}
	 */
	isHashed() {
		return true;
	}

	/**
	 * @type {DatumHash}
	 */
	get hash() {
		return this.#hash;
	}

	/**
	 * @type {?UplcData}
	 */
	get data() {
		return this.#origData;
	}

	/**
	 * Used by script context emulation
	 * @returns {ConstrData}
	 */
	toData() {
		return new ConstrData(1, [new ByteArrayData(this.#hash.bytes)]);
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return CborData.encodeTuple([
			CborData.encodeInteger(0n),
			this.#hash.toCbor(),
		]);
	}

	/**
	 * @param {UplcData} data 
	 * @returns {HashedDatum}
	 */
	static fromData(data) {
		return new HashedDatum(new Hash(Crypto.blake2b(data.toCbor())), data);
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		return {
			hash: this.#hash.dump(),
			cbor: this.#origData === null ? null : bytesToHex(this.#origData.toCbor()),
			schema: this.#origData === null ? null : JSON.parse(this.#origData.toSchemaJson())
		};
	}
}

/**
 * Inside helios this type is named OutputDatum::Inline in order to distinguish it from the user defined Datum,
 * but outside helios scripts there isn't much sense to keep using the name 'OutputDatum' instead of Datum
 */
class InlineDatum extends Datum {
	/** @type {UplcData} */
	#data;

	/**
	 * @param {UplcData} data
	 */
	constructor(data) {
		super();
		this.#data = data;
	}

	/**
	 * @returns {boolean}
	 */
	isInline() {
		return true;
	}

	/**
	 * @returns {boolean}
	 */
	isHashed() {
		return false;
	}

	/**
	 * @type {DatumHash}
	 */
	get hash() {
		return new DatumHash(Crypto.blake2b(this.#data.toCbor()));
	}

	/**
	 * @type {UplcData}
	 */
	get data() {
		return this.#data;
	}

	/**
	 * Used by script context emulation
	 * @returns {ConstrData}
	 */
	toData() {
		return new ConstrData(2, [this.#data]);
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return CborData.encodeTuple([
			CborData.encodeInteger(1n),
			CborData.encodeTag(24n).concat(CborData.encodeBytes(this.#data.toCbor()))
		]);
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		return {
			inlineCbor: bytesToHex(this.#data.toCbor()),
			inlineSchema: JSON.parse(this.#data.toSchemaJson())
		};
	}
}

/**
 * The inner 'any' is also Metadata, but jsdoc doesn't allow declaring recursive types
 * Metadata is essentially a JSON schema object
 * @typedef {{map: [any, any][]} | any[] | string | number} Metadata
 */

/**
 * @param {Metadata} metadata 
 * @returns {number[]}
 */
function encodeMetadata(metadata) {
	if (typeof metadata === 'string') {
		return CborData.encodeUtf8(metadata, true);
	} else if (typeof metadata === 'number') {
		assert(metadata % 1.0 == 0.0);

		return CborData.encodeInteger(BigInt(metadata));
	} else if (Array.isArray(metadata)) {
		return CborData.encodeDefList(metadata.map(item => encodeMetadata(item)));
	} else if (metadata instanceof Object && "map" in metadata && Object.keys(metadata).length == 1) {
		let pairs = metadata["map"];

		if (Array.isArray(pairs)) {
			return CborData.encodeMap(pairs.map(pair => {
				if (Array.isArray(pair) && pair.length == 2) {
					return [
						encodeMetadata(pair[0]),
						encodeMetadata(pair[1])
					];
				} else {
					throw new Error("invalid metadata schema");		
				}
			}));
		} else {
			throw new Error("invalid metadata schema");
		}
	} else {
		throw new Error("invalid metadata schema");
	}
}

/**
 * Shifts bytes to next Cbor element
 * @param {number[]} bytes 
 * @returns {Metadata}
 */
function decodeMetadata(bytes) {
	if (CborData.isUtf8(bytes)) {
		return CborData.decodeUtf8(bytes);
	} else if (CborData.isList(bytes)) {
		/**
		 * @type {Metadata[]}
		 */
		let items = [];

		CborData.decodeList(bytes, (_, itemBytes) => {
			items.push(decodeMetadata(itemBytes));
		});

		return items;
	} else if (CborData.isMap(bytes)) {
		/**
		 * @type {[Metadata, Metadata][]}
		 */
		let pairs = [];

		CborData.decodeMap(bytes, (_, pairBytes) => {
			pairs.push([
				decodeMetadata(pairBytes),
				decodeMetadata(pairBytes)
			]);
		});

		return {"map": pairs};
	} else {
		return Number(CborData.decodeInteger(bytes));
	}
}

class TxMetadata {
	/**
	 * @type {Object.<number, Metadata>} 
	 */
	#metadata;

	constructor() {
		this.#metadata = {};
	}

	/**
	 *
	 * @param {number} tag
	 * @param {Metadata} data
	 */
	add(tag, data) {
		this.#metadata[tag] = data;
	}

	/**
	 * @type {number[]}
	 */
	get keys() {
		return Object.keys(this.#metadata).map(key => parseInt(key)).sort();
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		let obj = {};

		for (let key of this.keys) {
			obj[key] =this.#metadata[key];
		}

		return obj;
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		/**
		 * @type {[number[], number[]][]}
		 */
		const pairs = this.keys.map(key => [
			CborData.encodeInteger(BigInt(key)),
			encodeMetadata(this.#metadata[key])
		]);
		
		return CborData.encodeMap(pairs);
	}

	/**
	* Decodes a TxMetadata instance from Cbor
	* @param {number[]} data
	* @returns {TxMetadata}
	*/
	static fromCbor(data) {
		const txMetadata = new TxMetadata();

		CborData.decodeMap(data, (_, pairBytes) => {
			txMetadata.add(
				Number(CborData.decodeInteger(pairBytes)), 
				decodeMetadata(pairBytes)
			);
		});

		return txMetadata;
	}
}



////////////////////////////////////
// Section 26: Highlighting function
////////////////////////////////////

/**
 * Categories for syntax highlighting
 */
const SyntaxCategory = {
	Normal:     0,
	Comment:    1,
	Literal:    2,
	Symbol:     3,
	Type:       4,
	Keyword:    5,
	Error:      6,
};

/**
 * Applies syntax highlighting by returning a list of char categories.
 * Not part of Tokeizer because it needs to be very fast and can't throw errors.
 * Doesn't depend on any other functions so it can easily be ported to other languages.
 * @param {string} src
 * @returns {Uint8Array}
 */
export function highlight(src) {
	let n = src.length;

	const SyntaxState = {
		Normal:        0,
		SLComment:     1,
		MLComment:     2,
		String:        3,
		NumberStart:   4,
		HexNumber:     5,
		BinaryNumber:  6,
		OctalNumber:   7,
		DecimalNumber: 8,
		ByteArray:     9,
	};

	// array of categories
	let data = new Uint8Array(n);

	let j = 0; // position in data
	let state = SyntaxState.Normal;

	/** @type {SymbolToken[]} */
	let groupStack = [];
	
	for (let i = 0; i < n; i++) {
		let c = src[i];
		let isLast = i == n - 1;

		switch (state) {
			case SyntaxState.Normal:
				if (c == "/") {
					// maybe comment
					if (!isLast && src[i+1] == "/") {
						data[j++] = SyntaxCategory.Comment;
						data[j++] = SyntaxCategory.Comment;
		
						i++;
						state = SyntaxState.SLComment;
					} else if (!isLast && src[i+1] == "*") {
						data[j++] = SyntaxCategory.Comment;
						data[j++] = SyntaxCategory.Comment;

						i++;
						state = SyntaxState.MLComment;
					} else {
						data[j++] = SyntaxCategory.Symbol;
					}
				} else if (c == "[" || c == "]" || c == "{" || c == "}" || c == "(" || c == ")") {
					let s = new SymbolToken(new Site(new Source(src), i), c);

					if (Group.isOpenSymbol(s)) {
						groupStack.push(s);
						data[j++] = SyntaxCategory.Normal;
					} else {
						let prevGroup = groupStack.pop();

						if (prevGroup === undefined) {
							data[j++] = SyntaxCategory.Error;
						} else if (c == Group.matchSymbol(prevGroup)) {
							data[j++] = SyntaxCategory.Normal;
						} else {
							data[prevGroup.site.startPos] = SyntaxCategory.Error;
							data[j++] = SyntaxCategory.Error;
						}
					}
				} else if (c == "%" || c == "!" || c == "&" || c == "*" || c == "+" || c == "-" || c == "<" || c == "=" || c == ">" || c == "|") {
					// symbol
					switch (c) {
						case "&":
							if (!isLast && src[i+1] == "&") {
								data[j++] = SyntaxCategory.Symbol;
								data[j++] = SyntaxCategory.Symbol;
								i++;
							} else {
								data[j++] = SyntaxCategory.Normal;
							}
							break;
						case "|":
							if (!isLast && src[i+1] == "|") {
								data[j++] = SyntaxCategory.Symbol;
								data[j++] = SyntaxCategory.Symbol;
								i++;
							} else {
								data[j++] = SyntaxCategory.Normal;
							}
							break;
						case "!":
							if (!isLast && src[i+1] == "=") {
								data[j++] = SyntaxCategory.Symbol;
								data[j++] = SyntaxCategory.Symbol;
								i++;
							} else {
								data[j++] = SyntaxCategory.Symbol;
							}
							break;
						case "=":
							if (!isLast && (src[i+1] == "=" || src[i+1] == ">")) {
								data[j++] = SyntaxCategory.Symbol;
								data[j++] = SyntaxCategory.Symbol;
								i++;
							} else {
								data[j++] = SyntaxCategory.Symbol;
							}
							break;
						case ">":
							if (!isLast && src[i+1] == "=") {
								data[j++] = SyntaxCategory.Symbol;
								data[j++] = SyntaxCategory.Symbol;
								i++;
							} else {
								data[j++] = SyntaxCategory.Symbol;
							}
							break;
						case "<":
							if (!isLast && src[i+1] == "=") {
								data[j++] = SyntaxCategory.Symbol;
								data[j++] = SyntaxCategory.Symbol;
								i++;
							} else {
								data[j++] = SyntaxCategory.Symbol;
							}
							break;
						case "-":
							if (!isLast && src[i+1] == ">") {
								data[j++] = SyntaxCategory.Symbol;
								data[j++] = SyntaxCategory.Symbol;
								i++;
							} else {
								data[j++] = SyntaxCategory.Symbol;
							}
							break;
						default:
							data[j++] = SyntaxCategory.Symbol;
					}
				} else if (c == "\"") {
					// literal string
					data[j++] = SyntaxCategory.Literal;
					state = SyntaxState.String;
				} else if (c == "0") {
					// literal number
					data[j++] = SyntaxCategory.Literal;
					state = SyntaxState.NumberStart;
				} else if (c >= "1" && c <= "9") {
					// literal decimal number
					data[j++] = SyntaxCategory.Literal;
					state = SyntaxState.DecimalNumber;
				} else if (c == "#") {
					data[j++] = SyntaxCategory.Literal;
					state = SyntaxState.ByteArray;
				} else if ((c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c == "_") {
					// maybe keyword, builtin type, or boolean
					let i0 = i;
					let chars = [c];
					// move i to the last word char
					while (i + 1 < n) {
						let d = src[i+1];

						if ((d >= "a" && d <= "z") || (d >= "A" && d <= "Z") || d == "_" || (d >= "0" && d <= "9")) {
							chars.push(d);
							i++;
						} else {
							break;
						}
					}

					let word = chars.join("");
					/** @type {number} */
					let type;
					switch (word) {
						case "true":
						case "false":
							type = SyntaxCategory.Literal;
							break;
						case "Bool":
						case "Int":
						case "ByteArray":
						case "String":
						case "Option":
							type = SyntaxCategory.Type;
							break;
						case "if":
						case "else":
						case "switch":
						case "func":
						case "const":
						case "struct":
						case "enum":
						case "import":
						case "print":
						case "error":
						case "self":
							type = SyntaxCategory.Keyword;
							break;
						case "testing":
						case "spending":
						case "staking":
						case "minting":
						case "module":
							if (i0 == 0) {
								type = SyntaxCategory.Keyword;
							} else {
								type = SyntaxCategory.Normal;
							}
							break;
						default:
							type = SyntaxCategory.Normal;
					}

					for (let ii = i0; ii < i0 + chars.length; ii++) {
						data[j++] = type;
					}
				} else {
					data[j++] = SyntaxCategory.Normal;
				}
				break;
			case SyntaxState.SLComment:
				data[j++] = SyntaxCategory.Comment;
				if (c == "\n") {
					state = SyntaxState.Normal;
				}
				break;
			case SyntaxState.MLComment:
				data[j++] = SyntaxCategory.Comment;

				if (c == "*" && !isLast && src[i+1] == "/") {
					i++;
					data[j++] = SyntaxCategory.Comment;
					state = SyntaxState.Normal;
				}
				break;
			case SyntaxState.String:
				data[j++] = SyntaxCategory.Literal;

				if (c == "\"") {
					state = SyntaxState.Normal;
				}
				break;
			case SyntaxState.NumberStart:
				if (c == "x") {
					data[j++] = SyntaxCategory.Literal;
					state = SyntaxState.HexNumber;
				} else if (c == "o") {
					data[j++] = SyntaxCategory.Literal;
					state = SyntaxState.OctalNumber;
				} else if (c == "b") {
					data[j++] = SyntaxCategory.Literal;
					state = SyntaxState.BinaryNumber;
				} else if (c >= "0" && c <= "9") {
					data[j++] = SyntaxCategory.Literal;
					state = SyntaxState.DecimalNumber;
				} else {
					i--;
					state = SyntaxState.Normal;
				}
				break;
			case SyntaxState.DecimalNumber:
				if (c >= "0" && c <= "9") {
					data[j++] = SyntaxCategory.Literal;
				} else {
					i--;
					state = SyntaxState.Normal;
				}
				break;
			case SyntaxState.HexNumber:
			case SyntaxState.ByteArray:
				if ((c >= "a" && c <= "f") || (c >= "0" && c <= "9")) {
					data[j++] = SyntaxCategory.Literal;
				} else {
					i--;
					state = SyntaxState.Normal;
				}
				break;
			case SyntaxState.OctalNumber:
				if (c >= "0" && c <= "7") {
					data[j++] = SyntaxCategory.Literal;
				} else {
					i--;
					state = SyntaxState.Normal;
				}
				break;
			case SyntaxState.BinaryNumber:
				if (c == "0" || c == "1") {
					data[j++] = SyntaxCategory.Literal;
				} else {
					i--;
					state = SyntaxState.Normal;
				}
				break;
			default:
				throw new Error("unhandled SyntaxState");
		}		
	}

	for (let s of groupStack) {
		data[s.site.startPos] = SyntaxCategory.Error;
	}

	return data;
}


//////////////////////////////////////
// Section 27: Fuzzy testing framework
//////////////////////////////////////

/**
 * @typedef {() => UplcData} ValueGenerator
 */

/**
 * @typedef {(args: UplcValue[], res: (UplcValue | UserError)) => (boolean | Object.<string, boolean>)} PropertyTest
 */

/**
 * Creates generators and runs script tests
 */
export class FuzzyTest {
	/**
	 * @type {NumberGenerator} - seed generator
	 */
	#rand;

	#runsPerTest;

	#simplify;

	/**
	 * @param {number} seed
	 * @param {number} runsPerTest
	 * @param {boolean} simplify - if true then also test the simplified program
	 */
	constructor(seed = 0, runsPerTest = 100, simplify = false) {
		console.log("starting fuzzy testing  with seed", seed);

		this.#rand = Crypto.rand(seed);
		this.#runsPerTest = runsPerTest;
		this.#simplify = simplify;
	}

	/**
	 * @returns {NumberGenerator}
	 */
	newRand() {
		let seed = this.#rand()*1000000;

		return Crypto.rand(seed);
	}

	/**
	 * Returns a gernator for whole numbers between min and max
	 * @param {number} min
	 * @param {number} max
	 * @returns {() => bigint}
	 */
	rawInt(min = -10000000, max = 10000000) {
		let rand = this.newRand();

		return function() {
			return BigInt(Math.floor(rand()*(max - min)) + min);
		}
	}

	/**
	 * Returns a generator for whole numbers between min and max, wrapped with IntData
	 * @param {number} min
	 * @param {number} max
	 * @returns {ValueGenerator}
	 */
	int(min = -10000000, max = 10000000) {		
		let rand = this.rawInt(min, max);

		return function() {
			return new IntData(rand());
		}
	}

	/**
	 * Returns a generator for strings containing any utf-8 character
	 * @param {number} minLength
	 * @param {number} maxLength
	 * @returns {ValueGenerator}
	 */
	string(minLength = 0, maxLength = 64) {
		let rand = this.newRand();

		return function() {
			let n = Math.round(rand()*(maxLength - minLength)) + minLength;
			if (n < 0) {
				n = 0;
			}

			let chars = [];
			for (let i = 0; i < n; i++) {
				chars.push(String.fromCodePoint(Math.round(rand()*1112064)));
			}
			
			return ByteArrayData.fromString(chars.join(""));
		}
	}

	/** 
	 * Returns a generator for strings with ascii characters from 32 (space) to 126 (tilde)
	 * @param {number} minLength
	 * @param {number} maxLength
	 * @returns {ValueGenerator}
	 */
	ascii(minLength = 0, maxLength = 64) {
		let rand = this.newRand();

		return function() {
			let n = Math.round(rand()*(maxLength - minLength)) + minLength;
			if (n < 0) {
				n = 0;
			}

			let chars = [];
			for (let i = 0; i < n; i++) {
				chars.push(String.fromCharCode(Math.round(rand()*94 + 32)));
			}
			
			return ByteArrayData.fromString(chars.join(""));
		}
	}

	/**
	 * Returns a generator for bytearrays containing only valid ascii characters
	 * @param {number} minLength
	 * @param {number} maxLength
	 * @returns {ValueGenerator}
	 */
	asciiBytes(minLength = 0, maxLength = 64) {
		let rand = this.newRand();

		return function() {
			let n = Math.round(rand()*(maxLength - minLength)) + minLength;
			if (n < 0) {
				n = 0;
			}

			let bytes = [];
			for (let i = 0; i < n; i++) {
				bytes.push(Math.floor(rand()*94 + 32));
			}

			return new ByteArrayData(bytes);
		}
	}

	/**
	 * Returns a generator for bytearrays the are also valid utf8 strings
	 * @param {number} minLength - length of the string, not of the bytearray!
	 * @param {number} maxLength - length of the string, not of the bytearray!
	 * @returns {ValueGenerator}
	 */
	utf8Bytes(minLength = 0, maxLength = 64) {
		return this.string(minLength, maxLength);
	}

	/**
	 * Returns a generator for number[]
	 * @param {number} minLength
	 * @param {number} maxLength
	 * @returns {() => number[]}
	 */
	rawBytes(minLength = 0, maxLength = 64) {
		let rand = this.newRand();

		return function() {
			let n = Math.round(rand()*(maxLength - minLength)) + minLength;
			if (n < 0) {
				n = 0;
			}

			let bytes = [];
			for (let i = 0; i < n; i++) {
				bytes.push(Math.floor(rand()*256));
			}

			return bytes;
		}
	}

	/**
	 * Returns a generator for bytearrays 
	 * @param {number} minLength
	 * @param {number} maxLength
	 * @returns {ValueGenerator}
	 */
	bytes(minLength = 0, maxLength = 64) {
		let rand = this.rawBytes(minLength, maxLength);

		return function() {
			let bytes = rand();

			return new ByteArrayData(bytes);
		}
	}
	/**
	 * Returns a generator for booleans,
	 * @returns {() => boolean}
	 */
	rawBool() {
		let rand = this.newRand();

		return function() {
			let x = rand();

			return x >= 0.5;
		}
	}

	/**
	 * Returns a generator for booleans, wrapped with ConstrData
	 * @returns {ValueGenerator}
	 */
	bool() {
		let rand = this.rawBool();

		return function() {
			return new ConstrData(rand() ? 1 : 0, []);
		}
	}

	/**
	 * Returns a generator for options
	 * @param {ValueGenerator} someGenerator
	 * @param {number} noneProbability
	 * @returns {ValueGenerator}
	 */
	option(someGenerator, noneProbability = 0.5) {
		let rand = this.newRand();

		return function() {
			let x = rand();

			if (x < noneProbability) {
				return new ConstrData(1, []);
			} else {
				return new ConstrData(0, [someGenerator()]);
			}
		}
	}

	/**
	 * Returns a generator for lists
	 * @param {ValueGenerator} itemGenerator
	 * @param {number} minLength
	 * @param {number} maxLength
	 * @returns {ValueGenerator}
	 */
	list(itemGenerator, minLength = 0, maxLength = 10) {
		let rand = this.newRand();

		if (minLength < 0) {
			minLength = 0;
		}

		if (maxLength < 0) {
			maxLength = 0;
		}

		return function() {
			let n = Math.round(rand()*(maxLength - minLength)) + minLength;
			if (n < 0) {
				n = 0;
			}

			/**
			 * @type {UplcData[]}
			 */
			let items = [];

			for (let i = 0; i < n; i++) {
				items.push(itemGenerator());
			}

			return new ListData(items);
		}
	}

	/**
	 * Returns a generator for maps
	 * @param {ValueGenerator} keyGenerator
	 * @param {ValueGenerator} valueGenerator
	 * @param {number} minLength
	 * @param {number} maxLength
	 * @returns {ValueGenerator}
	 */
	map(keyGenerator, valueGenerator, minLength = 0, maxLength = 10) {
		let rand = this.newRand();

		if (minLength < 0) {
			minLength = 0;
		}

		if (maxLength < 0) {
			maxLength = 0;
		}

		return function() {
			let n = Math.round(rand()*(maxLength - minLength)) + minLength;

			if (n < 0) {
				n = 0;
			}

			/**
			 * @type {[UplcData, UplcData][]}
			 */
			let pairs = [];

			for (let i = 0; i < n; i++) {
				pairs.push([keyGenerator(), valueGenerator()]);
			}

			return new MapData(pairs);
		};
	}

	/**
	 * Returns a generator for objects
	 * @param {...ValueGenerator} itemGenerators
	 * @returns {ValueGenerator}
	 */
	object(...itemGenerators) {
		return function() {
			let items = itemGenerators.map(g => g());

			return new ConstrData(0, items);
		}
	}

	/**
	 * Returns a generator for tagged constr
	 * @param {number | NumberGenerator} tag
	 * @param {...ValueGenerator} fieldGenerators
	 * @returns {ValueGenerator}
	 */
	constr(tag, ...fieldGenerators) {
		return function() {
			const fields = fieldGenerators.map(g => g());

			const finalTag = (typeof tag == "number") ? tag : Math.round(tag()*100);
			
			return new ConstrData(finalTag, fields);
		}
	}

	/**
	 * Run a test
	 * @param {ValueGenerator[]} argGens
	 * @param {string} src
	 * @param {PropertyTest} propTest
	 * @param {number} nRuns
	 * @param {boolean} simplify
	 * @returns {Promise<void>} - throws an error if any of the property tests fail
	 */
	async test(argGens, src, propTest, nRuns = this.#runsPerTest, simplify = false) {
		// compilation errors here aren't caught

		let purposeName = extractScriptPurposeAndName(src);

		if (purposeName === null) {
			throw new Error("failed to get script purpose and name");
		} else {
			let [_, testName] = purposeName;

			let program = Program.new(src).compile(simplify);

			for (let it = 0; it < nRuns; it++) {
				let args = argGens.map(gen => new UplcDataValue(Site.dummy(), gen()));
			
				let result = await program.run(args);

				let obj = propTest(args, result);

				if (typeof obj == "boolean") {
					if (!obj) {
						throw new Error(`property test '${testName}' failed (info: (${args.map(a => a.toString()).join(', ')}) => ${result.toString()})`);
					}
				} else {
					// check for failures
					for (let key in obj) {
						if (!obj[key]) {
							throw new Error(`property test '${testName}:${key}' failed (info: (${args.map(a => a.toString()).join(', ')}) => ${result.toString()})`);
						}
					}
				}
			}

			console.log(`property tests for '${testName}' succeeded${simplify ? " (simplified)":""} (${program.calcSize()} bytes)`);
		}

		if (!simplify && this.#simplify) {
			await this.test(argGens, src, propTest, nRuns, true);
		}
	}

	/**
	 * @param {Object.<string, ValueGenerator>} paramGenerators
	 * @param {string[]} paramArgs
	 * @param {string} src
	 * @param {PropertyTest} propTest
	 * @param {number} nRuns
	 * @param {boolean} simplify
	 * @returns {Promise<void>}
	 */
	async testParams(paramGenerators, paramArgs, src, propTest, nRuns = this.#runsPerTest, simplify = false) {
		let program = Program.new(src);

		let purposeName = extractScriptPurposeAndName(src);

		if (purposeName === null) {
			throw new Error("failed to get script purpose and name");
		} else {
			let [_, testName] = purposeName;

			for (let it = 0; it < nRuns; it++) {

				for (let key in paramGenerators) {
					program.changeParamSafe(key, paramGenerators[key]())
				}

				let args = paramArgs.map(paramArg => program.evalParam(paramArg));
			
				let coreProgram = Program.new(src).compile(simplify);

				let result = await coreProgram.run(args);

				let obj = propTest(args, result);

				if (typeof obj == "boolean") {
					if (!obj) {
						throw new Error(`property test '${testName}' failed (info: (${args.map(a => a.toString()).join(', ')}) => ${result.toString()})`);
					}
				} else {
					// check for failures
					for (let key in obj) {
						if (!obj[key]) {
							throw new Error(`property test '${testName}:${key}' failed (info: (${args.map(a => a.toString()).join(', ')}) => ${result.toString()})`);
						}
					}
				}
			}

			console.log(`property tests for '${testName}' succeeded${simplify ? " (simplified)":""}`);
		}

		if (!simplify && this.#simplify) {
			await this.testParams(paramGenerators, paramArgs, src, propTest, nRuns, true);
		}
	}
}


////////////////////////////
// Section 28: CoinSelection
////////////////////////////



/**
 * Collection of coin selection algorithms
 */
export class CoinSelection {
    /**
     * @param {UTxO[]} utxos 
     * @param {Value} amount 
     * @param {boolean} largestFirst
     * @returns {[UTxO[], UTxO[]]} - [picked, not picked that can be used as spares]
     */
    static selectExtremumFirst(utxos, amount, largestFirst) {
        let sum = new Value();

        /** @type {UTxO[]} */
        let notSelected = utxos.slice();

        /** @type {UTxO[]} */
        const selected = [];

        /**
         * Selects smallest utxos until 'needed' is reached
         * @param {bigint} neededQuantity
         * @param {(utxo: UTxO) => bigint} getQuantity
         */
        function select(neededQuantity, getQuantity) {
            // first sort notYetPicked in ascending order when picking smallest first,
            // and in descending order when picking largest first
            // sort UTxOs that contain more assets last
            notSelected.sort((a, b) => {
                const qa = getQuantity(a);
                const qb = getQuantity(b);

                const sign = largestFirst ? -1 : 1;

                if (qa != 0n && qb == 0n) {
                    return sign;
                } else if (qa == 0n && qb != 0n) {
                    return -sign;
                } else if (qa == 0n && qb == 0n) {
                    return 0;
                } else {
                    const na = a.value.assets.nTokenTypes;
                    const nb = b.value.assets.nTokenTypes;

                    if (na == nb) {
                        return Number(qa - qb)*sign;
                    } else if (na < nb) {
                        return sign;
                    } else {
                        return -sign
                    }
                }
            });

            let count = 0n;
            const remaining = [];

            while (count < neededQuantity || count == 0n) { // must select at least one utxo if neededQuantity == 0n
                const utxo = notSelected.shift();

                if (utxo === undefined) {
                    throw new Error("not enough utxos to cover amount");
                } else {
                    const qty = getQuantity(utxo);

                    if (qty > 0n) {
                        count += qty;
                        selected.push(utxo);
                        sum = sum.add(utxo.value);
                    } else {
                        remaining.push(utxo)
                    }
                }
            }

            notSelected = notSelected.concat(remaining);
        }

        /**
         * Select UTxOs while looping through (MintingPolicyHash,TokenName) entries
         */
        const mphs = amount.assets.mintingPolicies;

        for (const mph of mphs) {
            const tokenNames = amount.assets.getTokenNames(mph);

            for (const tokenName of tokenNames) {
                const need = amount.assets.get(mph, tokenName);
                const have = sum.assets.get(mph, tokenName);

                if (have < need) {
                    const diff = need - have;

                    select(diff, (utxo) => utxo.value.assets.get(mph, tokenName));
                }
            }
        }

        // now use the same strategy for lovelace
        const need = amount.lovelace;
        const have = sum.lovelace;

        if (have < need) {
            const diff = need - have;

            select(diff, (utxo) => utxo.value.lovelace);
        }

        assert(selected.length + notSelected.length == utxos.length, "internal error: select algorithm doesn't conserve utxos");

        return [selected, notSelected];
    }

    /**
     * @param {UTxO[]} utxos 
     * @param {Value} amount 
     * @returns {[UTxO[], UTxO[]]} - [selected, not selected]
     */
    static selectSmallestFirst(utxos, amount) {
        return CoinSelection.selectExtremumFirst(utxos, amount, false);
    }

    /**
     * @param {UTxO[]} utxos 
     * @param {Value} amount 
     * @returns {[UTxO[], UTxO[]]} - [selected, not selected]
     */
    static selectLargestFirst(utxos, amount) {
        return CoinSelection.selectExtremumFirst(utxos, amount, true);
    }
}


//////////////////////
// Section 29: Wallets
//////////////////////


/**
 * @typedef {{
 *     isMainnet(): Promise<boolean>,
 *     usedAddresses: Promise<Address[]>,
 *     unusedAddresses: Promise<Address[]>,
 *     utxos: Promise<UTxO[]>,
 *     signTx(tx: Tx): Promise<Signature[]>,
 *     submitTx(tx: Tx): Promise<TxId>
 * }} Wallet
 */

/**
 * @typedef {{
 *     getNetworkId(): Promise<number>,
 *     getUsedAddresses(): Promise<string[]>,
 *     getUnusedAddresses(): Promise<string[]>,
 *     getUtxos(): Promise<string[]>,
 *     signTx(txHex: string, partialSign: boolean): Promise<string>,
 *     submitTx(txHex: string): Promise<string>
 * }} Cip30Handle
 */

/**
 * @implements {Wallet}
 */
export class Cip30Wallet {
    #handle;

    /**
     * @param {Cip30Handle} handle 
     */
    constructor(handle) {
        this.#handle = handle;
    }

    /**
     * @returns {Promise<boolean>}
     */
    async isMainnet() {
        return (await this.#handle.getNetworkId()) == 1;
    }

    /**
     * @type {Promise<Address[]>}
     */
    get usedAddresses() {
        return this.#handle.getUsedAddresses().then(addresses => addresses.map(a => new Address(a)));
    }

    /**
     * @type {Promise<Address[]>}
     */
    get unusedAddresses() {
        return this.#handle.getUnusedAddresses().then(addresses => addresses.map(a => new Address(a)));
    }

    /**
     * @type {Promise<UTxO[]>}
     */
    get utxos() {
        return this.#handle.getUtxos().then(utxos => utxos.map(u => UTxO.fromCbor(hexToBytes(u))));
    }

    /**
     * @param {Tx} tx 
     * @returns {Promise<Signature[]>}
     */
    async signTx(tx) {
        const res = await this.#handle.signTx(bytesToHex(tx.toCbor()), true);
        
        return TxWitnesses.fromCbor(hexToBytes(res)).signatures;
    }

    /**
     * @param {Tx} tx 
     * @returns {Promise<TxId>}
     */
    async submitTx(tx) {
        const responseText = await this.#handle.submitTx(bytesToHex(tx.toCbor()));

        return new TxId(responseText);
    }
}

export class WalletHelper {
    #wallet;

    /**
     * @param {Wallet} wallet 
     */
    constructor(wallet) {
        this.#wallet = wallet;
    }

    /**
     * @type {Promise<Address[]>}
     */
    get allAddresses() {
        return this.#wallet.usedAddresses.then(usedAddress => this.#wallet.unusedAddresses.then(unusedAddresses => usedAddress.concat(unusedAddresses)));
    }

    /**
     * @returns {Promise<Value>}
     */
    async calcBalance() {
        let sum = new Value();

        const utxos = await this.#wallet.utxos;

        for (const utxo of utxos) {
            sum = sum.add(utxo.value);
        }

        return sum;
    }

    /**
     * @type {Promise<Address>}
     */
    get baseAddress() {
        return this.allAddresses.then(addresses => assertDefined(addresses[0]));
    }

    /**
     * @type {Promise<Address>}
     */
    get changeAddress() {
        return this.#wallet.unusedAddresses.then(addresses => {
            if (addresses.length == 0) {
                return this.#wallet.usedAddresses.then(addresses => {
                    if (addresses.length == 0) {
                        throw new Error("no addresses found")
                    } else {
                        return addresses[addresses.length-1];
                    }
                })
            } else {
                return addresses[0];
            }
        });
    }

    /**
     * Returns the first UTxO, so the caller can check precisely which network the user is connected to (eg. preview or preprod)
     * @type {Promise<?UTxO>}
     */
    get refUtxo() {
        return this.#wallet.utxos.then(utxos => {
            if(utxos.length == 0) {
                return null;
            } else {
                return assertDefined(utxos[0])
            }
        });
    }

    /**
     * @param {Value} amount 
     * @param {(allUtxos: UTxO[], anount: Value) => [UTxO[], UTxO[]]} algorithm
     * @returns {Promise<[UTxO[], UTxO[]]>} - [picked, not picked that can be used as spares]
     */ 
    async pickUtxos(amount, algorithm = CoinSelection.selectSmallestFirst) {
        return algorithm(await this.#wallet.utxos, amount);
    }

    /**
     * Returned collateral can't contain an native assets (pure lovelace)
     * TODO: combine UTxOs if a single UTxO isn't enough
     * @param {bigint} amount - 2 Ada should cover most things
     * @returns {Promise<UTxO>}
     */
    async pickCollateral(amount = 2000000n) {
        const pureUtxos = (await this.#wallet.utxos).filter(utxo => utxo.value.assets.isZero());

        if (pureUtxos.length == 0) {
            throw new Error("no pure UTxOs in wallet (needed for collateral)");
        }

        const bigEnough = pureUtxos.filter(utxo => utxo.value.lovelace >= amount);

        if (bigEnough.length == 0) {
            throw new Error("no UTxO in wallet that is big enough to cover collateral");
        }

        bigEnough.sort((a,b) => Number(a.value.lovelace - b.value.lovelace));

        return bigEnough[0];
    }

    /**
     * @param {Address} addr
     * @returns {Promise<boolean>}
     */
    async isOwnAddress(addr) {
        const pkh = addr.pubKeyHash;

        if (pkh === null) {
            return false;
        } else {
            return this.isOwnPubKeyHash(pkh);
        }
    }

        /**
     * @param {PubKeyHash} pkh
     * @returns {Promise<boolean>}
     */
    async isOwnPubKeyHash(pkh) {
        const addresses = await this.allAddresses;

        for (const addr of addresses) {
            const aPkh = addr.pubKeyHash;

            if (aPkh !== null && aPkh.eq(pkh)) {
                return true;
            }
        }

        return false;
    }
}


//////////////////////
// Section 30: Network
//////////////////////

/**
 * @typedef {{
 *     getUtxos(address: Address): Promise<UTxO[]>,
 *     submitTx(tx: Tx): Promise<TxId>
 * }} Network
 */

/**
 * @implements {Network}
 */
export class BlockfrostV0 {
    #networkName;
    #projectId;

    /**
     * @param {string} networkName - "preview", "preprod" or "mainnet"
     * @param {string} projectId
     */
    constructor(networkName, projectId) {
        this.#networkName = networkName;
        this.#projectId = projectId
    }

    /**
     * Determine the network which the wallet is connected to.
     * @param {Wallet} wallet 
     * @param {{
     *     preview?: string,
     *     preprod?: string,
     *     mainnet?: string
     * }} projectIds 
     * @returns {Promise<BlockfrostV0>}
     */
    static async resolve(wallet, projectIds) {
        if (await wallet.isMainnet()) {
            return new BlockfrostV0("mainnet", assertDefined(projectIds["mainnet"]));
        } else {
            const helper = new WalletHelper(wallet);

            const refUtxo = await helper.refUtxo;

            if (refUtxo === null) {
                throw new Error("empty wallet, can't determine which testnet you are connecting to");
            } else {
                const preprodProjectId = projectIds["preprod"];
                const previewProjectId = projectIds["preview"];

                if (preprodProjectId !== undefined) {
                    const preprodNetwork = new BlockfrostV0("preprod", preprodProjectId);

                    if (await preprodNetwork.hasUtxo(refUtxo)) {
                        return preprodNetwork;
                    }
                } 
                
                if (previewProjectId !== undefined) {
                    const previewNetwork = new BlockfrostV0("preview", previewProjectId);

                    if (!(await previewNetwork.hasUtxo(refUtxo))) {
                        throw new Error("not preview network (hint: provide project id for preprod");
                    } else {
                        return previewNetwork;
                    }
                } else {
                    if (preprodProjectId === undefined) {
                        throw new Error("no project ids for testnets");
                    } else {
                        throw new Error("no project id for preview testnet");
                    }
                }
            }
        }
    }

    /**
     * @param {any} obj 
     * @returns 
     */
    static parseValue(obj) {
        let value = new Value();

        for (let item of obj) {
            let qty = BigInt(item.quantity);

            if (item.unit == "lovelace") {
                value = value.add(new Value(qty));
            } else {
                let policyID = item.unit.substring(0, 56);
                let mph = MintingPolicyHash.fromHex(policyID);

                let token = hexToBytes(item.unit.substring(56));

                value = value.add(new Value(0n, new Assets([
                    [mph, [
                        [token, qty]
                    ]]
                ])));
            }
        }

        return value;
    }

    /**
     * Used by BlockfrostV0.resolve()
     * @param {UTxO} utxo
     * @returns {Promise<boolean>}
     */
    async hasUtxo(utxo) {
        const txId = utxo.txId;

        const url = `https://cardano-${this.#networkName}.blockfrost.io/api/v0/txs/${txId.hex}/utxos`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "project_id": this.#projectId
            }
        });

        return response.ok;
    }

    /**
     * Returns oldest UTxOs first, newest last.
     * TODO: pagination
     * @param {Address} address 
     * @returns {Promise<UTxO[]>}
     */
    async getUtxos(address) {
        const url = `https://cardano-${this.#networkName}.blockfrost.io/api/v0/addresses/${address.toBech32()}/utxos?order=asc`;

        const response = await fetch(url, {
            headers: {
                "project_id": this.#projectId
            }
        });

        /** 
         * @type {any} 
         */
        let all = await response.json();

        if (all?.status_code >= 300) {
            all = []; 
        }

        return all.map(obj => {
            return new UTxO(
                TxId.fromHex(obj.tx_hash),
                BigInt(obj.output_index),
                new TxOutput(
                    address,
                    BlockfrostV0.parseValue(obj.amount),
                    Datum.inline(ConstrData.fromCbor(hexToBytes(obj.inline_datum)))
                )
            );
        });
    }  

    /** 
     * @param {Tx} tx 
     * @returns {Promise<TxId>}
     */
    async submitTx(tx) {
        const data = new Uint8Array(tx.toCbor());
        const url = `https://cardano-${this.#networkName}.blockfrost.io/api/v0/tx/submit`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "content-type": "application/cbor",
                "project_id": this.#projectId
            },
            body: data
        }).catch(e => {
            console.error(e);
            throw e;
        });

        const responseText = await response.text();

        if (response.status != 200) {
            throw new Error(responseText);
        } else {
            return new TxId(JSON.parse(responseText));  
        }
    }   
}


///////////////////////
// Section 31: Emulator
///////////////////////
/**
 * Single address wallet emulator.
 * @implements {Wallet}
 */
export class WalletEmulator {
    #network;
    #privateKey;
    #publicKey;

    /** 
     * @param {Network} network
     * @param {NumberGenerator} random - used to generate the private key
     */
    constructor(network, random) {
        this.#network = network;
        this.#privateKey = WalletEmulator.genPrivateKey(random);
        this.#publicKey = Crypto.Ed25519.derivePublicKey(this.#privateKey);

        // TODO: staking credentials
    }

    /**
     * Generate a private key from a random number generator (not cryptographically secure!)
     * @param {NumberGenerator} random 
     * @returns {number[]} - Ed25519 private key is 32 bytes long
     */
    static genPrivateKey(random) {
        const key = [];

        for (let i = 0; i < 32; i++) {
            key.push(Math.floor(random()*256)%256);
        }

        return key;
    }

    /**
     * @type {PubKeyHash}
     */
    get pubKeyHash() {
        return new PubKeyHash(Crypto.blake2b(this.#publicKey, 28));
    }

    get address() {
        return Address.fromPubKeyHash(this.pubKeyHash);
    }

    /**
     * @returns {Promise<boolean>}
     */
    async isMainnet() {
        return false;
    }

    /**
     * Assumed wallet was initiated with at least 1 UTxO at the pubkeyhash address.
     * @returns {Promise<Address[]>}
     */
    get usedAddresses() {
        return new Promise((resolve, _) => {
            resolve([this.address])
        });
    }

    get unusedAddresses() {
        return new Promise((resolve, _) => {
            resolve([])
        });
    }

    get utxos() {
        return new Promise((resolve, _) => {
            resolve(this.#network.getUtxos(this.address));
        });
    }

    /**
     * Simply assumed the tx needs to by signed by this wallet without checking.
     * @param {Tx} tx
     * @returns {Promise<Signature[]>}
     */
    async signTx(tx) {
        return [
            new Signature(
                this.#publicKey,
                Crypto.Ed25519.sign(tx.bodyHash, this.#privateKey)
            )
        ];
    }

    /**
     * @param {Tx} tx 
     * @returns {Promise<TxId>}
     */
    async submitTx(tx) {
        return await this.#network.submitTx(tx);
    }
}

/**
 * collectUtxos removes tx inputs from the list, and appends txoutputs sent to the address to the end.
 * @typedef {{
 *     id(): TxId,
 *     consumes(txId: TxId, utxoIdx: bigint): boolean,
 *     collectUtxos(address: Address, utxos: UTxO[]): UTxO[]
 * }} EmulatorTx
 */

/**
 * @implements {EmulatorTx}
 */
class GenesisTx {
    #id;
    #address;
    #lovelace;
    #assets;

    /**
     * @param {number} id
     * @param {Address} address 
     * @param {bigint} lovelace
     * @param {Assets} assets 
     */
    constructor(id, address, lovelace, assets) {
        this.#id = id;
        this.#address = address;
        this.#lovelace = lovelace;
        this.#assets = assets;
    }

    /**
     * Simple incremental txId for genesis transactions.
     * It's very unlikely that regular transactions have the same hash.
     * @return {TxId}
     */
    id() {
        let bytes = bigIntToBytes(BigInt(this.#id));

        if (bytes.length < 32) {
            bytes = (new Array(32 - bytes.length)).fill(0).concat(bytes);
        }

        return new TxId(bytes);
    }

    /**
     * @param {TxId} txId 
     * @param {bigint} utxoIdx 
     * @returns 
     */
    consumes(txId, utxoIdx) {
        return false;
    }

    /**
     * @param {Address} address
     * @param {UTxO[]} utxos
     * @returns {UTxO[]}
     */
    collectUtxos(address, utxos) {
        if (eq(this.#address.bytes, address.bytes)) {
            utxos = utxos.slice();

            utxos.push(new UTxO(
                this.id(),
                0n,
                new TxOutput(
                    this.#address,
                    new Value(this.#lovelace, this.#assets)
                )
            ));

            return utxos;
        } else {
            return utxos;
        }
    }
}

/**
 * @implements {EmulatorTx}
 */
class RegularTx {
    #tx;

    /**
     * @param {Tx} tx 
     */
    constructor(tx) {
        this.#tx = tx;
    }

    /**
     * @returns {TxId}
     */
    id() {
        return this.#tx.id();
    }

    /**
     * @param {TxId} txId
     * @param {bigint} utxoIdx
     * @returns {boolean}
     */
    consumes(txId, utxoIdx) {
        const txInputs = this.#tx.body.inputs;

        return txInputs.some(txInput => {
            return txInput.txId.hex == txId.hex && txInput.utxoIdx == utxoIdx;
        });
    }

    /**
     * @param {Address} address 
     * @param {UTxO[]} utxos 
     * @returns {UTxO[]}
     */
    collectUtxos(address, utxos) {
        utxos = utxos.filter(utxo => !this.consumes(utxo.txId, utxo.utxoIdx));

        const txOutputs = this.#tx.body.outputs;

        txOutputs.forEach((txOutput, utxoId) => {
            if (eq(txOutput.address.bytes, address.bytes)) {
                utxos.push(new UTxO(
                    this.id(),
                    BigInt(utxoId),
                    txOutput
                ));
            }
        });

        return utxos;
    }
}

/**
 * @implements {Network}
 */
export class NetworkEmulator {
    /**
     * @type {bigint}
     */
    #slot;

    /**
     * @type {NumberGenerator}
     */
    #random;

    /**
     * @type {GenesisTx[]}
     */
    #genesis;

    /**
     * @type {EmulatorTx[]}
     */
    #mempool;

    /**
     * @type {EmulatorTx[][]}
     */
    #blocks;

    /**
     * @param {number} seed 
     */
    constructor(seed = 0) {
        this.#slot = 0n;
        this.#random = Crypto.mulberry32(seed);
        this.#genesis = [];
        this.#mempool = [];
        this.#blocks = [];
    }

    /**
     * Creates a WalletEmulator and adds a block with a single fake unbalanced Tx
     * @param {bigint} lovelace
     * @param {Assets} assets
     * @returns {WalletEmulator}
     */
    createWallet(lovelace = 0n, assets = new Assets([])) {
        const wallet = new WalletEmulator(this, this.#random);

        this.createUtxo(wallet, lovelace, assets);

        return wallet;
    }

    /**
     * Creates a UTxO using a GenesisTx.
     * @param {WalletEmulator} wallet 
     * @param {bigint} lovelace 
     * @param {Assets} assets 
     */
    createUtxo(wallet, lovelace, assets = new Assets([])) {
        if (lovelace != 0n || !assets.isZero()) {
            const tx = new GenesisTx(
                this.#genesis.length,
                wallet.address,
                lovelace,
                assets
            );

            this.#genesis.push(tx);
            this.#mempool.push(tx);
        }
    }

    /**
     * Mint a block with the current mempool, and advance the slot.
     * @param {bigint} nSlots 
     */
    tick(nSlots) {
        if (this.#mempool.length > 0) {
            this.#blocks.push(this.#mempool);

            this.#mempool = [];
        }

        this.#slot += nSlots;
    }

    /**
     * @param {Address} address
     * @returns {Promise<UTxO[]>}
     */
    async getUtxos(address) {
        /**
         * @type {UTxO[]}
         */
        let utxos = [];

        for (let block of this.#blocks) {
            for (let tx of block) {
                utxos = tx.collectUtxos(address, utxos);
            }
        }

        return utxos;
    }

    /**
     * @param {TxId} txId 
     * @param {bigint} utxoIdx 
     * @returns {boolean}
     */
    isConsumed(txId, utxoIdx) {
        return this.#blocks.some(b => {
            return b.some(tx => {
                return tx.consumes(txId, utxoIdx)
            })
        }) || this.#mempool.some(tx => {
            return tx.consumes(txId, utxoIdx);
        })
    }

    /**
     * @param {Tx} tx 
     * @returns {Promise<TxId>}
     */
    async submitTx(tx) {
        assert(tx.isValid(this.#slot), "tx invalid (not finalized or slot out of range)");

        // make sure that none of the inputs have been consumed before
        assert(tx.body.inputs.every(input => !this.isConsumed(input.txId, input.utxoIdx)), "input already consumed before");

        this.#mempool.push(new RegularTx(tx));

        return tx.id();
    }
}

/**
 * The following functions are used for some tests in ./test/, and aren't
 * intended to be used by regular users of this library.
 */
export const exportedForTesting = {
	assert: assert,
	assertClass: assertClass,
	bigIntToBytes: bigIntToBytes,
	bytesToBigInt: bytesToBigInt,
	setRawUsageNotifier: setRawUsageNotifier,
	setBlake2bDigestSize: setBlake2bDigestSize,
	dumpCostModels: dumpCostModels,
	Site: Site,
	Source: Source,
	Crypto: Crypto,
	MapData: MapData,
	UplcData: UplcData,
	CborData: CborData,
	ConstrData: ConstrData,
	IntData: IntData,
	ByteArrayData: ByteArrayData,
	ListData: ListData,
	UplcBool: UplcBool,
	UplcValue: UplcValue,
	UplcDataValue: UplcDataValue,
	ScriptPurpose: ScriptPurpose,
	UplcTerm: UplcTerm,
	UplcProgram: UplcProgram,
	UplcLambda: UplcLambda,
	UplcCall: UplcCall,
	UplcBuiltin: UplcBuiltin,
	UplcVariable: UplcVariable,
	UplcConst: UplcConst,
	UplcInt: UplcInt,
	IRProgram: IRProgram,
	Tx: Tx,
	TxInput: TxInput,
	TxBody: TxBody
};