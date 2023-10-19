//@ts-check
// Uplc AST

import {
    BitWriter,
    assert,
    assertDefined,
    bytesToHex,
    bytesToText,
    ipow2,
    padZeroes,
    textToBytes,
	byteToBitString
} from "./utils.js";

/**
 * @typedef {import("./utils.js").TransferUplcAst} TransferUplcAst
 */

import {
    RuntimeError,
    Site,
    Word
} from "./tokens.js";

import {
    Crypto,
	Ed25519
} from "./crypto.js";

/**
 * @typedef {import("./uplc-costmodels.js").Cost} Cost
 */

import {
    NetworkParams
} from "./uplc-costmodels.js";

import {
	BUILTIN_PREFIX,
    UPLC_BUILTINS,
    UPLC_MACROS,
    UPLC_MACROS_OFFSET,
    findUplcBuiltin
} from "./uplc-builtins.js";

import {
    ByteArrayData,
    ConstrData,
    IntData,
    ListData,
    MapData,
    UplcData
} from "./uplc-data.js";

/**
 * A Helios/Uplc Program can have different purposes
 * @typedef {"testing" | "minting" | "spending" | "staking" | "endpoint" | "module" | "unknown"} ScriptPurpose
 */

/**
 * UplcValue is passed around by Plutus-core expressions.
 * @interface
 * @typedef {object} UplcValue
 * @property {(other: TransferUplcAst) => any} transfer
 * @property {bigint} int
 * @property {number[]} bytes
 * @property {string} string
 * @property {boolean} bool
 * @property {() => boolean} isPair
 * @property {UplcValue} first
 * @property {UplcValue} second
 * @property {() => boolean} isList
 * @property {UplcType} itemType
 * @property {UplcValue[]} list
 * @property {number} length only relevant for lists and maps
 * @property {() => boolean} isData
 * @property {UplcData} data
 * @property {() => string} toString
 * @property {(newSite: Site) => UplcValue} copy return a copy of the UplcValue at a different Site
 * @property {Site} site
 * @property {number} memSize size in words (8 bytes, 64 bits) occupied in target node
 * @property {number} flatSize size taken up in serialized UPLC program (number of bits)
 * @property {() => boolean} isAny
 * @property {(bitWriter: BitWriter) => void} toFlatValue
 * @property {(bitWriter: BitWriter) => void} toFlatValueInternal like toFlatValue(), but without the typebits
 * @property {() => string} typeBits
 * @property {() => UplcUnit} assertUnit
 */

/** 
 * Base cass for UplcValue implementations.
 */
export class UplcValueImpl {
	#site;

	/**
	 * @param {Site} site 
	 */
	constructor(site) {
		assert(site != undefined && (site instanceof Site));
		this.#site = site;
	}

    /**
     * @type {Site}
     */
	get site() {
		return this.#site;
	}

	/**
	 * @type {number}
	 */
	get length() {
		throw new Error("not a list nor a map");
	}

	/**
	 * @returns {boolean}
	 */
	isAny() {
		return false;
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
	 * @returns {UplcUnit}
	 */
	assertUnit() {
		throw this.site.typeError(`expected Plutus-core unit, got '${this.toString}'`);
	}

	/**
	 * @returns {string}
	 */
	typeBits() {
		throw new Error("not yet implemented");
	}

	/**
	 * Encodes value without type header
	 * @param {BitWriter} bitWriter
	 */
	toFlatValueInternal(bitWriter) {
		throw new Error("not yet implemented");
	}

	/**
	 * Encodes value with plutus flat encoding.
	 * Member function not named 'toFlat' as not to confuse with 'toFlat' member of terms.
	 * @param {BitWriter} bitWriter
	 */
	toFlatValue(bitWriter) {
		bitWriter.write('1' + this.typeBits() + '0');
		
		this.toFlatValueInternal(bitWriter);
	}
}

/**
 * Represents the typeBits of a UPLC primitive.
 */
export class UplcType {
	#typeBits;

	/**
	 * @param {string} typeBits 
	 */
	constructor(typeBits) {
		this.#typeBits = typeBits;
	}

	/**
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		return other.transferUplcType(
			this.#typeBits
		);
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
	 * @returns {boolean}
	 */
	isData() {
		return this.#typeBits == UplcType.newDataType().#typeBits;
	}

	/**
	 * @returns {boolean}
	 */
	isDataPair() {
		return this.#typeBits == UplcType.newDataPairType().#typeBits;
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
 * @typedef {[null | string, UplcValue][]} UplcRawStack
 */

/**
 * @typedef {{
 *	 onPrint: (msg: string) => Promise<void>
 *   onStartCall: (site: Site, rawStack: UplcRawStack) => Promise<boolean>
 *   onEndCall: (site: Site, rawStack: UplcRawStack) => Promise<void>
 *   onIncrCost: (name: string, isTerm: boolean, cost: Cost) => void
 * }} UplcRTECallbacks
 */

/**
 * @internal
 * @typedef {UplcRTECallbacks & {
 *   macros?: {[name: string]: (rte: UplcRte, args: UplcValue[]) => Promise<UplcValue>}
 * }} UplcRTECallbacksInternal
 */

/**
 * Configures the Uplc evaluator to print messages to `console`.
 * @type {UplcRTECallbacks}
 */
export const DEFAULT_UPLC_RTE_CALLBACKS = {
	onPrint: async (/** @type {string} */ msg) => {console.log(msg)},
	onStartCall: async (/** @type {Site} */ site, /** @type {UplcRawStack} */ rawStack) => {return false},
	onEndCall: async (/** @type {Site} */ site, /** @type {UplcRawStack} */ rawStack) => {return},
	onIncrCost: (/** @type {string} */ name, /** @type {boolean} */ isTerm, /** @type {Cost} */ cost) => {return},
}

/**
 * Plutus-core Runtime Environment is used for controlling the programming evaluation (eg. by a debugger)
 * @internal
 */
export class UplcRte {
	#callbacks;

	#networkParams;

	/**
	 * this.onNotifyCalls is set to 'false' when the debugger is in step over-mode.
	 * @type {boolean}
	 */
	#notifyCalls;

	/**
	 * this.onNotifyCalls is set back to true if the endCall is called with the same rawStack as the marker.
	 * @type {null | UplcRawStack}
	 */
	#marker;

	/**
	 * @type {string[]}
	 */
	#messages;

	/**
	 * @type {string | RuntimeError}
	 */
	#error;

	// cache the costs for quicker lookup
	#startupCost;
	#variableCost;
	#lambdaCost;
	#delayCost;
	#callCost;
	#constCost;
	#forceCost;
	#builtinCost;


	
	/**
	 * @param {UplcRTECallbacksInternal} callbacks 
	 * @param {null | NetworkParams} networkParams
	 */
	constructor(callbacks = DEFAULT_UPLC_RTE_CALLBACKS, networkParams = null) {
		assertDefined(callbacks);
		this.#callbacks = callbacks;
		this.#networkParams = networkParams;
		this.#notifyCalls = true;
		this.#marker = null;
		this.#messages = [];
		this.#error = "";

		this.#startupCost = networkParams?.plutusCoreStartupCost ?? {mem: 0n, cpu: 0n};
		this.#variableCost = networkParams?.plutusCoreVariableCost ?? {mem: 0n, cpu: 0n};
		this.#lambdaCost = networkParams?.plutusCoreLambdaCost ?? {mem: 0n, cpu: 0n};
		this.#delayCost = networkParams?.plutusCoreDelayCost ?? {mem: 0n, cpu: 0n};
		this.#callCost = networkParams?.plutusCoreCallCost ?? {mem: 0n, cpu: 0n};
		this.#constCost = networkParams?.plutusCoreConstCost ?? {mem: 0n, cpu: 0n};
		this.#forceCost = networkParams?.plutusCoreForceCost ?? {mem: 0n, cpu: 0n};
		this.#builtinCost = networkParams?.plutusCoreBuiltinCost ?? {mem: 0n, cpu: 0n};
	}

	/**
	 * @type {string[]}
	 */
	get messages() {
		return this.#messages;
	}

	/**
	 * @returns {string}
	 */
	popLastMessage() {
		return this.#messages.pop() ?? "";
	}

	/**
	 * @returns {boolean}
	 */
	hasError() {
		return this.#error != "";
	}

	/**
	 * @returns {string | RuntimeError}
	 */
	getError() {
		return this.#error;
	}

	/**
	 * @param {string | RuntimeError} err 
	 * @returns {UplcValue}
	 */
	error(err) {
		this.#error = err;
		return new UplcAny(Site.dummy());
	}

	throwError() {
		if (this.#error instanceof RuntimeError) {
			throw this.#error;
		} else if (this.#error != "") {
			throw new RuntimeError(this.#error);
		}
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
			this.incrCost("startup", true, this.#startupCost);
		}
	}

	incrVariableCost() {
		if (this.#networkParams !== null) {
			this.incrCost("variable", true, this.#variableCost);
		}
	}

	incrLambdaCost() {
		if (this.#networkParams !== null) {
			this.incrCost("lambda", true, this.#lambdaCost);
		}
	}

	incrDelayCost() {
		if (this.#networkParams !== null) {
			this.incrCost("delay", true, this.#delayCost);
		}
	}

	incrCallCost() {
		if (this.#networkParams !== null) {
			this.incrCost("call", true, this.#callCost);
		}
	}

	incrConstCost() {
		if (this.#networkParams !== null) {
			this.incrCost("const", true, this.#constCost);
		}
	}

	incrForceCost() {
		if (this.#networkParams !== null) {
			this.incrCost("force", true, this.#forceCost);
		}
	}

	incrBuiltinCost() {
		if (this.#networkParams !== null) {
			this.incrCost("builtin", true, this.#builtinCost);
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
	 * @param {string} name 
	 * @param {UplcValue[]} args 
	 * @returns {Promise<UplcValue>}
	 */
	callMacro(name, args) {
		const macros = this.#callbacks.macros;

		if (!macros) {
			// use RuntimeError so that IR evalConstants method can fail safely when optimizing
			throw new RuntimeError("macros not avaiable");
		}

		const macro = macros[name];

		if (!macro) {
			throw new Error(`macro ${name} not found`);
		}

		return macro(this, args);
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
	 * @param {string | string[]} rawMsg 
	 * @returns {Promise<void>}
	 */
	async print(rawMsg) {
		const lines = Array.isArray(rawMsg) ? rawMsg : [rawMsg];

		if (this.#callbacks.onPrint != undefined) {
			for (let l of lines) {
				this.#callbacks.onPrint(l);
			}
		}

		this.#messages = this.#messages.concat(lines);
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
	 * @param {null | UplcStack | UplcRte} parent
	 * @param {null | UplcValue} value
	 * @param {null | string} valueName
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
	 * 
	 * @param {string} name 
	 * @param {UplcValue[]} args 
	 * @returns {Promise<UplcValue>}
	 */
	async callMacro(name, args) {
		if (this.#parent) {
			return await this.#parent.callMacro(name, args);
		} else {
			throw new Error("parent not set, can't call macro")
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
 * Allows doing a dummy eval of a UplcProgram in order to determine some non-changing properties (eg. the address fetched via the network in an EndpointProgram)
 * @internal
 * @implements {UplcValue}
 */
export class UplcAny extends UplcValueImpl {
	/**
	 * @param {Site} site 
	 */
	constructor(site) {
		super(site);
	}

	/**
	 * Should never be part of the uplc ast
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		throw new Error("not expected to be part of Uplc ast");
	}

	/**
	 * @type {number}
	 */
	get memSize() {
		return 1;
	}

	/**
	 * @type {number}
	 */
	get flatSize() {
		throw new Error("UplcAny shouldn't be part of Ast");
	}

	/**
	 * @param {Site} newSite 
	 * @returns {UplcValue}
	 */
	copy(newSite) {
		return new UplcAny(
			newSite
		);
	}

	/**
	 * @returns {boolean}
	 */
	isAny() {
		return true;
	}

	/**
	 * @type {UplcValue}
	 */
	get first() {
		return this;
	}

	/**
	 * @type {UplcValue}
	 */
	get second() {
		return this;
	}

	/**
     * @internal
	 * @returns {UplcUnit}
	 */
	assertUnit() {
		return new UplcUnit(this.site);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return "Any";
	}
}

/**
 * Primitive equivalent of `IntData`.
 * @implements {UplcValue}
 */
export class UplcInt extends UplcValueImpl {
	/**
	 * @readonly
	 * @type {bigint}
	 */
	value;

	/**
	 * @readonly
	 * @type {boolean}
	 */
	signed;

	/**
	 * @param {Site} site
	 * @param {bigint} value - supposed to be arbitrary precision
	 * @param {boolean} signed - unsigned is only for internal use
	 */
	constructor(site, value, signed = true) {
		super(site);
		assert(typeof value == 'bigint', "not a bigint");
		this.value = value;
		this.signed = signed;
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

	

	/**
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		return other.transferUplcInt(
			this.site.transfer(other),
			this.value,
			this.signed
		);
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
        return IntData.memSizeInternal(this.value);
	}

	/**
	 * 4 for type, 7 for simple int, (7 + 1)*ceil(n/7) for large int
	 * @type {number}
	 */
	get flatSize() {
		const n = this.toUnsigned().value.toString(2).length;
		return 4 + ((n <= 7) ? 7 : Math.ceil(n / 7)*8);
	}

	/**
	 * @param {Site} newSite 
	 * @returns {UplcInt}
	 */
	copy(newSite) {
		return new UplcInt(newSite, this.value, this.signed);
	}

	/**
	 * @type {bigint}
	 */
	get int() {
		return this.value;
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
	 * (new UplcInt(Site.dummy(), -1n, true)).toUnsigned().int == 1n
	 * @example
	 * (new UplcInt(Site.dummy(), -1n, true)).toUnsigned().toSigned().int == -1n
	 * @example
	 * (new UplcInt(Site.dummy(), -2n, true)).toUnsigned().toSigned().int == -2n
	 * @example
	 * (new UplcInt(Site.dummy(), -3n, true)).toUnsigned().toSigned().int == -3n
	 * @example
	 * (new UplcInt(Site.dummy(), -4n, true)).toUnsigned().toSigned().int == -4n
	 * @returns {UplcInt}
	 */
	toUnsigned() {
		if (this.signed) {
			if (this.value < 0n) {
				return new UplcInt(this.site, -this.value*2n - 1n, false);
			} else {
				return new UplcInt(this.site, this.value * 2n, false);
			}
		} else {
			return this;
		}
	}

	/** 
	 * Unapplies zigzag encoding 
	 * @example
	 * (new UplcInt(Site.dummy(), 1n, false)).toSigned().int == -1n
	 * @returns {UplcInt}
	*/
	toSigned() {
		if (this.signed) {
			return this;
		} else {
			if (this.value % 2n == 0n) {
				return new UplcInt(this.site, this.value / 2n, true);
			} else {
				return new UplcInt(this.site, -(this.value + 1n) / 2n, true);
			}
		}
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return this.value.toString();
	}

	/**
	 * @internal
	 * @param {BitWriter} bitWriter
	 */
	toFlatInternal(bitWriter) {
		let zigzag = this.toUnsigned();
		let bitString = padZeroes(zigzag.value.toString(2), 7);

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
	 * @internal
	 * @param {BitWriter} bitWriter 
	 */
	toFlatUnsigned(bitWriter) {
		assert(!this.signed);

		this.toFlatInternal(bitWriter);
	}

	/**
	 * @returns {string}
	 */
	typeBits() {
		return "0000";
	}

	/**
	 * @internal
	 * @param {BitWriter} bitWriter 
	 */
	toFlatValueInternal(bitWriter) {
		assert(this.signed);

		this.toFlatInternal(bitWriter);
	}
}

/**
 * Primitive equivalent of `ByteArrayData`.
 * @implements {UplcValue}
 */
export class UplcByteArray extends UplcValueImpl {
	#bytes;

	/**
	 * @param {Site} site
	 * @param {number[]} bytes
	 */
	constructor(site, bytes) {
		super(site);
		this.#bytes = bytes;
	}

	/**
	 * Construct a UplcByteArray without requiring a Site
	 * @internal
	 * @param {number[]} bytes 
	 * @returns {UplcByteArray}
	 */
	static new(bytes) {
		return new UplcByteArray(Site.dummy(), bytes);
	}

	/**
	 * Creates new UplcByteArray wrapped in UplcConst so it can be used as a term.
	 * @internal
	 * @param {Site} site 
	 * @param {number[]} bytes 
	 * @returns {UplcConst}
	 */
	static newTerm(site, bytes) {
		return new UplcConst(new UplcByteArray(site, bytes));
	}

	/**
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		return other.transferUplcByteArray(
			this.site.transfer(other),
			this.#bytes
		)
	}

	/**
	 * @type {number}
	 */
	get memSize() {
        return ByteArrayData.memSizeInternal(this.#bytes);
	}

	/**
	 * 4 for header, 8 bits per byte, 8 bits per chunk of 256 bytes, 8 bits final padding
	 * @type {number}
	 */
	get flatSize() {
		const n = this.#bytes.length;

		return 4 + n*8 + Math.ceil(n/256)*8 + 8;
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
	 * @internal
	 * @returns {string}
	 */
	typeBits() {
		return "0001";
	}

	/**
	 * @internal
	 * @param {BitWriter} bitWriter
	 */
	toFlatValueInternal(bitWriter) {
		UplcByteArray.writeBytes(bitWriter, this.#bytes);
	}

	/**
	 * Write a list of bytes to the bitWriter using flat encoding.
	 * Used by UplcString, UplcByteArray and UplcDataValue
	 * Equivalent to E_B* function in Plutus-core docs
	 * @internal
	 * @param {BitWriter} bitWriter 
	 * @param {number[]} bytes 
	 * @param {boolean} pad
	 */
	static writeBytes(bitWriter, bytes, pad = true) {
		if (pad) {
			bitWriter.padToByteBoundary(true);
		}

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

		if (pad) {
			bitWriter.write('00000000');
		}
	}
}

/**
 * Primitive string value.
 * @implements {UplcValue}
 */
export class UplcString extends UplcValueImpl {
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
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		return other.transferUplcString(
			this.site.transfer(other),
			this.#value
		);
	}

	/**
	 * @type {number}
	 */
	get memSize() {
		return this.#value.length;
	}

	/**
	 * @type {number}
	 */
	get flatSize() {
		const bytes = Array.from((new TextEncoder()).encode(this.#value));
		return (new UplcByteArray(Site.dummy(), bytes)).flatSize
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
 * Primitive unit value.
 * @implements {UplcValue}
 */
export class UplcUnit extends UplcValueImpl {
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
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		return other.transferUplcUnit(
			this.site.transfer(other)
		);
	}

	/**
	 * @type {number}
	 */
	get memSize() {
		return 1;
	}

	/**
	 * @type {number}
	 */
	get flatSize() {
		return 4;
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
 * JS/TS equivalent of the Helios language `Bool` type.
 * @implements {UplcValue}
 */
export class UplcBool extends UplcValueImpl {
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
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		return other.transferUplcBool(
			this.site.transfer(other),
			this.#value
		);
	}

	/**
	 * @type {number}
	 */
	get memSize() {
		return 1;
	}

	/**
	 * 4 for type, 1 for value
	 * @type {number}
	 */
	get flatSize() {
		return 5;
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
 * Primitive pair value.
 * @implements {UplcValue}
 */
export class UplcPair extends UplcValueImpl {
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
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		return other.transferUplcPair(
			this.site.transfer(other),
			this.#first.transfer(other),
			this.#second.transfer(other)
		);
	}

	/**
	 * @type {number}
	 */
	get memSize() {
		return this.#first.memSize + this.#second.memSize;
	}

	/**
	 * 16 additional type bits on top of #first and #second bits
	 */
	get flatSize() {
		return 16 + this.#first.flatSize + this.#second.flatSize;
	}

	/**
	 * @param {Site} newSite 
	 * @returns {UplcValue}
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
 * @implements {UplcList}
*/
export class UplcList extends UplcValueImpl {
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
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		return other.transferUplcList(
			this.site.transfer(other),
			this.#itemType.transfer(other),
			this.#items.map(item => item.transfer(other))
		);
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

	/**
	 * 10 + nItemType type bits, value bits of each item (must be corrected by itemType)
	 * @type {number}
	 */
	get flatSize() {
		const nItemType = this.#itemType.typeBits.length;

		return 10 + nItemType + this.#items.reduce((prev, item) => item.flatSize - nItemType + prev, 0);
	}

	/**
	 * @type {UplcType}
	 */
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
	 * @returns {boolean}
	 */
	isDataList() {
		return this.#itemType.isData();
	}
	
	/**
	 * @returns {boolean}
	 */
	isDataMap() {
		return this.#itemType.isDataPair();
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
 * `UplcValue` that wraps a `UplcData` instance.
 * @implements {UplcValue}
 */
export class UplcDataValue extends UplcValueImpl {
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
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		return other.transferUplcDataValue(
			this.site.transfer(other),
			this.#data.transfer(other)
		);
	}

	/**
	 * @type {number}
	 */
	get memSize() {
		return this.#data.memSize;
	}

	/**
	 * Same number of header bits as UplcByteArray
	 * @type {number}
	 */
	get flatSize() {
		const bytes = this.#data.toCbor();

		return (new UplcByteArray(Site.dummy(), bytes)).flatSize;
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
 */
export class UplcTerm {
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
	 * @type {number}
	 */
	get type() {
		return this.#type;
	}

	/**
	 * @type {Site}
	 */
	get site() {
		return this.#site;
	}

	/**
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		throw new Error("not yet implemented");
	}

	/**
	 * Generic term toString method
	 * @returns {string}
	 */
	toString() {
		return `(Term ${this.#type.toString()})`;
	}
	
	/**
	 * Writes bits of flat encoded Plutus-core terms to bitWriter. Doesn't return anything.
	 * @internal
	 * @param {BitWriter} bitWriter 
	 * @param {null | Map<string, number>} codeMapFileIndices
	 */
	toFlat(bitWriter, codeMapFileIndices = null) {
		throw new Error("not yet implemented");
	}
}

/**
 * Plutus-core variable ref term (index is a Debruijn index)
 */
export class UplcVariable extends UplcTerm {
	/**
	 * @readonly
	 * @type {UplcInt}
	 */
	index;

	/**
	 * @param {Site} site 
	 * @param {UplcInt} index 
	 */
	constructor(site, index) {
		super(site, 0);
		this.index = index;
	}

	/**
	 * @param {TransferUplcAst} other 
	 */
	transfer(other) {
		return other.transferUplcVariable(
			this.site.transfer(other),
			this.index.transfer(other)
		);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `x${this.index.toString()}`;
	}

	/**
	 * @internal
	 * @param {BitWriter} bitWriter 
	 * @param {null | Map<string, number>} codeMapFileIndices
	 */
	toFlat(bitWriter, codeMapFileIndices = null) {
		bitWriter.write('0000');
		this.index.toFlatUnsigned(bitWriter);
	}

	/**
	 * @internal
	 * @param {UplcRte} rte
	 * @param {UplcFrame[]} stack
	 * @param {ComputingState} state
	 * @returns {CekState}
	 */
	computeCek(rte, stack, state) {
		rte.incrVariableCost();
        const i = Number(this.index.value);

		const v = state.env.values[state.env.values.length - i];

        return {reducing: v};
	}
}

/**
 * Plutus-core delay term.
 */
export class UplcDelay extends UplcTerm {
	/**
	 * @readonly
	 * @type {UplcTerm}
	 */
	expr;

	/**
	 * @param {Site} site 
	 * @param {UplcTerm} expr 
	 */
	constructor(site, expr) {
		super(site, 1);
		this.expr = expr;
	}

	/**
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		return other.transferUplcDelay(
			this.site.transfer(other),
			this.expr.transfer(other)
		);
	}

	/**
	 * @returns {string} 
	 */
	toString() {
		return `(delay ${this.expr.toString()})`;
	}

	/**
	 * @internal
	 * @param {BitWriter} bitWriter 
	 * @param {null | Map<string, number>} codeMapFileIndices
	 */
	toFlat(bitWriter, codeMapFileIndices = null) {
		bitWriter.write('0001');
		this.expr.toFlat(bitWriter, codeMapFileIndices);
	}

	/**
	 * @internal
	 * @param {UplcRte} rte 
	 * @param {UplcFrame[]} stack
	 * @param {ComputingState} state 
	 * @returns {CekState}
	 */
	computeCek(rte, stack, state) {
		rte.incrDelayCost();
		return {reducing: new UplcDelayWithEnv(this, state.env)};
	}
}

/**
 * Plutus-core lambda term
 */
export class UplcLambda extends UplcTerm {
	/**
	 * @readonly
	 * @type {UplcTerm}
	 */
	expr;

	#argName;

	/**
	 * @param {Site} site
	 * @param {UplcTerm} expr
	 * @param {null | string} argName
	 */
	constructor(site, expr, argName = null) {
		super(site, 2);
		this.expr = expr;
		this.#argName = argName;
	}

	/**
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		return other.transferUplcLambda(
			this.site.transfer(other),
			this.expr.transfer(other),
			this.#argName
		);
	}

	/**
	 * Returns string with unicode lambda symbol
	 * @returns {string}
	 */
	toString() {
		return `(\u039b${this.#argName !== null ? " " + this.#argName + " ->" : ""} ${this.expr.toString()})`;
	}

	/**
	 * @internal
	 * @param {BitWriter} bitWriter 
	 * @param {null | Map<string, number>} codeMapFileIndices
	 */
	toFlat(bitWriter, codeMapFileIndices = null) {
		bitWriter.write('0010');
		this.expr.toFlat(bitWriter, codeMapFileIndices);
	}

	/**
	 * @internal
	 * @param {UplcRte} rte 
	 * @param {UplcFrame[]} stack
	 * @param {ComputingState} state 
	 * @returns {CekState}
	 */
	computeCek(rte, stack, state) {
		rte.incrLambdaCost();
		return {reducing: new UplcLambdaWithEnv(this, state.env)};
	}
}

/**
 * Plutus-core function application term (i.e. function call)
 */
export class UplcCall extends UplcTerm {
	/**
	 * @readonly
	 * @type {UplcTerm}
	 */
	fn;

	/**
	 * @readonly
	 * @type {UplcTerm}
	 */
	arg;

	/**
	 * @param {Site} site
	 * @param {UplcTerm} fn
	 * @param {UplcTerm} arg
	 */
	constructor(site, fn, arg) {
		super(site, 3);
		this.fn = fn;
		this.arg = arg;
	}

	/**
	 * @internal
	 * @type {Site}
	 */
	get callSite() {
		return this.site;
	}

	/**
	 * @param {TransferUplcAst} other
	 * @returns {any}
	 */
	transfer(other) {
		return other.transferUplcCall(
			this.site.transfer(other),
			this.fn.transfer(other),
			this.arg.transfer(other)
		);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `[${this.fn.toString()} ${this.arg.toString()}]`;
	}

	/**
	 * @internal
	 * @param {BitWriter} bitWriter 
	 * @param {null | Map<string, number>} codeMapFileIndices
	 */
	toFlat(bitWriter, codeMapFileIndices = null) {
		if (codeMapFileIndices && this.site.codeMapSite) {
			bitWriter.write('1011');
			
			const site = this.site.codeMapSite;

			(new UplcInt(site, BigInt(assertDefined(codeMapFileIndices.get(site.src.name))), false)).toFlatUnsigned(bitWriter);
			(new UplcInt(site, BigInt(site.startPos), false)).toFlatUnsigned(bitWriter);
		} else {
			bitWriter.write('0011');
		}

		this.fn.toFlat(bitWriter, codeMapFileIndices);
		this.arg.toFlat(bitWriter, codeMapFileIndices);
	}

	/**
	 * @internal
	 * @param {UplcRte} rte 
	 * @param {UplcFrame[]} stack 
	 * @param {ComputingState} state 
	 * @returns {CekState}
	 */
	computeCek(rte, stack, state) {
		rte.incrCallCost();

        stack.push(new PreCallFrame(this, state.env));
        return {computing: this.fn, env: state.env};
	}
}

/**
 * Plutus-core const term (i.e. a literal in conventional sense)
 */
export class UplcConst extends UplcTerm {
	/**
	 * @readonly
	 * @type {UplcValue}
	 */
	value;

	/**
	 * @param {UplcValue} value 
	 */
	constructor(value) {
		super(value.site, 4);

		this.value = value;

		if (value instanceof UplcInt) {
			assert(value.signed);
		}
	}

	get flatSize() {
		return 4 + this.value.flatSize;
	}

	/**
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		return other.transferUplcConst(
			this.value.transfer(other)
		);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return this.value.toString();
	}

	/**
	 * @internal
	 * @param {BitWriter} bitWriter 
	 * @param {null | Map<string, number>} codeMapFileIndices
	 */
	toFlat(bitWriter, codeMapFileIndices = null) {
		bitWriter.write('0100');
		this.value.toFlatValue(bitWriter);
	}

	/**
	 * @internal
	 * @param {UplcRte} rte 
	 * @param {UplcFrame[]} stack
	 * @param {ComputingState} state 
	 * @returns {CekState}
	 */
	computeCek(rte, stack, state) {
		rte.incrConstCost();
        return {reducing: this};
	}

	/**
	 * @internal
	 * @param {UplcRte} rte 
	 * @param {UplcFrame[]} stack 
	 * @param {PreCallFrame} frame 
	 * @returns {CekState}
	 */
	reducePreCallFrame(rte, stack, frame) {
		if (this.value.isAny()) {
			return {reducing: this};
		} else {
			throw new Error("UplcCall term expects UplcLambdaWithEnv or UplcBuiltin for first arg");
		}
	}

	/**
	 * @internal
	 * @param {UplcRte} rte 
	 * @param {UplcFrame[]} stack 
	 * @param {ForceFrame} frame 
	 * @returns {CekState}
	 */
	reduceForceFrame(rte, stack, frame) {
		if (this.value.isAny()) {
			return {reducing: this};
		} else {
			throw new Error(`unexpected ${this.toString()} term in force`);
		}
	}
}

/**
 * Plutus-core force term
 */
export class UplcForce extends UplcTerm {
	/**
	 * @readonly
	 */
	expr;

	/**
	 * @param {Site} site
	 * @param {UplcTerm} expr
	 */
	constructor(site, expr) {
		super(site, 5);
		this.expr = expr;
	}

	/**
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		return other.transferUplcForce(
			this.site.transfer(other),
			this.expr.transfer(other)
		);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `(force ${this.expr.toString()})`;
	}

	/**
	 * @internal
	 * @param {BitWriter} bitWriter 
	 * @param {null | Map<string, number>} codeMapFileIndices
	 */
	toFlat(bitWriter, codeMapFileIndices = null) {
		if (codeMapFileIndices && this.site.codeMapSite) {
			bitWriter.write('1101');
			
			const site = this.site.codeMapSite;
			(new UplcInt(site, BigInt(assertDefined(codeMapFileIndices.get(site.src.name))), false)).toFlatUnsigned(bitWriter);
			(new UplcInt(site, BigInt(site.startPos), false)).toFlatUnsigned(bitWriter);
		} else {
			bitWriter.write('0101');
		}
		
		this.expr.toFlat(bitWriter, codeMapFileIndices);
	}

	/**
	 * @internal
	 * @param {UplcRte} rte 
	 * @param {UplcFrame[]} stack 
	 * @param {ComputingState} state 
	 * @returns {CekState}
	 */
	computeCek(rte, stack, state) {
		rte.incrForceCost();
		stack.push(new ForceFrame(this, state.env));
       	return {computing: this.expr, env: state.env};
	}
}

/**
 * Plutus-core error term
 */
export class UplcError extends UplcTerm {
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
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		return other.transferUplcError(
			this.site.transfer(other),
			this.#msg
		);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return "(error)";
	}

	/**
	 * @internal
	 * @param {BitWriter} bitWriter 
	 * @param {null | Map<string, number>} codeMapFileIndices
	 */
	toFlat(bitWriter, codeMapFileIndices = null) {
		bitWriter.write('0110');
	}

	/**
	 * @internal
	 * @param {UplcRte} rte 
	 * @param {UplcFrame[]} stack 
	 * @param {ComputingState} state 
	 * @returns {CekState}
	 */
	computeCek(rte, stack, state) {
		return {error: "", env: state.env};
	}
}

/**
 * Plutus-core builtin function ref term
 */
export class UplcBuiltin extends UplcTerm {
	/** 
	 * Unknown builtins stay integers
	 * @type {string | number}
	 */
	#name;

	/**
	 * @type {number}
	 */
	#forceCount;

	/**
	 * @type {number}
	 */
	#nArgs;

	/**
	 * @param {Site} site 
	 * @param {string | number} name 
	 */
	constructor(site, name) {
		super(site, 7);
		this.#name = assertDefined(name);
		this.#forceCount = (typeof this.#name === "string" && !this.#name.startsWith("macro__")) ? UPLC_BUILTINS[findUplcBuiltin(BUILTIN_PREFIX + this.#name)].forceCount : 0;
		
		if (this.isMacro()) {
			this.#nArgs = -1;
		} else if (typeof this.#name == "string") {
			const i =  UPLC_BUILTINS.findIndex(info => info.name == this.#name);

			assert(i != -1);

			this.#nArgs = UPLC_BUILTINS[i].nArgs;
		} else {
			throw new Error("unknown number of arguments");
		}
	}

	/**
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		return other.transferUplcBuiltin(
			this.site.transfer(other),
			this.#name
		);
	}

	/**
	 * @type {string}
	 */
	get name() {
		return this.#name.toString();
	}

	/**
	 * @type {number} 
	 */
	get nArgs() {
		return this.#nArgs;
	}

	/**
	 * @internal
	 * @returns {boolean}
	 */
	allowAny() {
		if (typeof this.#name == "string") {
			if (this.#name.startsWith("macro__")) {
				return true;
			} else {
				let i = UPLC_BUILTINS.findIndex(info => info.name == this.#name);

				assert(i != -1);

				return UPLC_BUILTINS[i].allowAny;
			}
		} else {
			return true;
		}
	}

	/**
	 * @internal
	 * @returns {boolean}
	 */
	isMacro() {
		if (typeof this.#name == "string") {
			return this.#name.startsWith("macro__");
		} else {
			return false;
		}
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
	 * @internal
	 * @param {BitWriter} bitWriter 
	 * @param {null | Map<string, number>} codeMapFileIndices
	 */
	toFlat(bitWriter, codeMapFileIndices = null) {
		bitWriter.write('0111');

		/** 
		 * @type {number} 
		 */
		let i;

		if (typeof this.#name == "string") {
			if (this.#name.startsWith("macro__")) {
				const macroName = this.#name.slice(("macro__").length);

				i = UPLC_MACROS.findIndex(entry => entry == macroName);

				assert(i != -1, `macro '${macroName}' not found`);

				i += UPLC_MACROS_OFFSET;
			} else {
				i = UPLC_BUILTINS.findIndex(info => info.name == this.#name);

				assert(i != -1);
			}
		} else {
			i = this.#name;
		}

		let bitString = padZeroes(i.toString(2), 7);

		bitWriter.write(bitString);
	}

	/**
	 * @internal
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
	 * Used by IREvaluator
	 * @internal
	 * @param {Word} name
	 * @param {UplcValue[]} args
	 * @returns {UplcValue}
	 */
	static evalStatic(name, args) {
		let builtin = new UplcBuiltin(name.site, name.value);

		let rte = new UplcRte();

		let res = builtin.evalBuiltin(rte, name.site, args, true);

		rte.throwError()

		if (res instanceof Promise) {
			throw new Error("can't call trace through evalStatic");
		} else {
			return res;
		}
	}

	/**
	 * @internal
	 * @param {UplcRte} rte
	 * @param {UplcFrame[]} stack
	 * @param {ComputingState} state
	 * @returns {CekState}
	 */
	computeCek(rte, stack, state) {
		rte.incrBuiltinCost();
        return {reducing: new AppliedUplcBuiltin(this)};
	}

	/**
	 * @internal
	 * @param {UplcRte} rte 
	 * @param {Site} site
	 * @param {UplcValue[]} args
	 * @returns {Promise<UplcValue>}
	 */
	evalMacro(rte, site, args) {
		assert(this.isMacro());
		if (typeof this.#name == "string") {
			// don't include the last Unit
			return rte.callMacro(this.#name.slice(("macro__").length), args);
		} else {
			throw new Error("unexpected");
		}
	}

	/**
	 * @internal
	 * @param {UplcRte} rte 
	 * @param {Site} site
	 * @param {UplcValue[]} args
	 * @param {boolean} syncTrace if true => don't call rte.print method (used by IREvaluator)
	 * @returns {UplcValue | Promise<UplcValue>} // trace returns a Promise (async print), all the other builtins return a synchronous value
	 */
	evalBuiltin(rte, site, args, syncTrace = false) {
		if (!this.allowAny() && args.some(a => a.isAny())) {
			return new UplcAny(site);
		} 

		rte.calcAndIncrCost(this, ...args);

		/**
		 * @type {{[name: string]: (...args: UplcValue[]) => (UplcValue | Promise<UplcValue>)}}
		 */
		const callbacks = {
			addInteger: (a, b) => {
				return new UplcInt(site, a.int + b.int);
			},
			subtractInteger: (a, b) => {
				return new UplcInt(site, a.int - b.int);
			},
			divideInteger: (a, b) => {
				if (b.int === 0n) {
					return rte.error("division by zero");
				} else {
					return new UplcInt(site, a.int / b.int);
				}
			},
			multiplyInteger: (a, b) => {
				return new UplcInt(site, a.int * b.int);
			},
			quotientInteger: (a, b) => {
				if (b.int === 0n) {
					return rte.error("division by zero");
				} else {
					return new UplcInt(site, a.int/b.int + (b.int < 0n ? 1n : 0n));
				}
			},
			modInteger: (a, b) => {
				if (b.int === 0n) {
					return rte.error("division by zero");
				} else {
					return new UplcInt(site, a.int % b.int);
				}
			},
			remainderInteger: (a, b) => {
				if (b.int == 0n) {
					return rte.error("division by zero");
				} else {
					return new UplcInt(site, a.int - (a.int/b.int + (b.int < 0n ? 1n : 0n))*b.int);
				}
			},
			equalsInteger: (a, b) => {
				return new UplcBool(site, a.int == b.int);
			},
			lessThanInteger: (a, b) => {
				return new UplcBool(site, a.int < b.int);
			},
			lessThanEqualsInteger: (a, b) => {
				return new UplcBool(site, a.int <= b.int);
			},
			appendByteString: (a, b) => {
				return new UplcByteArray(site, a.bytes.concat(b.bytes));	
			},
			consByteString: (a, b) => {
				let bytes = b.bytes;

				const byte = Number(a.int)

				if (byte < 0 || byte >= 256) {
					return rte.error("byte out of range");
				}

				bytes.unshift(byte);
				
				return new UplcByteArray(site, bytes);
			},
			sliceByteString: (a, b, c) => {
				const bytes = c.bytes;
				let start = Math.max(Number(a.int), 0);
				let end = Math.min(Number(a.int) + Number(b.int) - 1, bytes.length - 1);
				
				if (end < start) {
					return new UplcByteArray(site, []);
				} else {
					return new UplcByteArray(site, bytes.slice(start, end + 1));
				}
			},
			lengthOfByteString: (a) => {
				return new UplcInt(site, BigInt(a.bytes.length));
			},
			indexByteString: (a, b) => {
				let bytes = a.bytes;
				let i = b.int;
				if (i < 0 || i >= bytes.length) {
					throw new Error("index out of range");
				}

				return new UplcInt(site, BigInt(bytes[Number(i)]));
			},
			equalsByteString: (a, b) => {
				return new UplcBool(site, ByteArrayData.comp(a.bytes, b.bytes) == 0);
			},
			lessThanByteString: (a, b) => {
				return new UplcBool(site, ByteArrayData.comp(a.bytes, b.bytes) == -1);
			},
			lessThanEqualsByteString: (a, b) => {
				return new UplcBool(site, ByteArrayData.comp(a.bytes, b.bytes) <= 0);
			},
			appendString: (a, b) => {
				return new UplcString(site, a.string + b.string);
			},
			equalsString: (a, b) => {
				return new UplcBool(site, a.string == b.string);
			},
			encodeUtf8: (a) => {
				return new UplcByteArray(site, textToBytes(a.string));
			},
			decodeUtf8: (a) => {
				try {
					return new UplcString(site, bytesToText(a.bytes));
				} catch(_) {
					return rte.error("invalid utf-8");
				}
			},
			sha2_256: (a) => {
				return new UplcByteArray(site, Crypto.sha2_256(a.bytes))
			},
			sha3_256: (a) => {
				return new UplcByteArray(site, Crypto.sha3(a.bytes))
			},
			blake2b_256: (a) => {
				return new UplcByteArray(site, Crypto.blake2b(a.bytes)); 
			},
			verifyEd25519Signature: (key, msg, signature) => {
				rte.calcAndIncrCost(this, key, msg, signature);

				let keyBytes = key.bytes;
				if (keyBytes.length != 32) {
					return rte.error(`expected key of length 32 for verifyEd25519Signature, got key of length ${keyBytes.length}`);
				}

				let msgBytes = msg.bytes;
				
				let signatureBytes = signature.bytes;
				if (signatureBytes.length != 64) {
					return rte.error(`expected signature of length 64 for verifyEd25519Signature, got signature of length ${signatureBytes.length}`);
				}

				let ok = Ed25519.verify(signatureBytes, msgBytes, keyBytes);

				return new UplcBool(site, ok);
			},
			ifThenElse: (a, b, c) => {
				if (a.isAny()) {
					return new UplcAny(site);
				} else {
					return a.bool ? b : c;
				}
			},
			chooseUnit: (a, b) => {
				a.assertUnit();

				return b;
			},
			trace: (a, b) => {
				if (a.isAny() || syncTrace) {
					return b;
				} else {
					return rte.print(a.string.split("\n").map(l => `INFO (${site.toString()}) ${l}`)).then(() => {
						return b;
					});
				}
			},
			fstPair: (a) => {
				if (a.isPair()) {
					return a.first;
				} else {
					throw site.typeError(`expected pair or data-pair for first arg, got '${a.toString()}'`);
				}
			},
			sndPair: (a) => {
				if (a.isPair()) {
					return a.second;
				} else {
					throw site.typeError(`expected pair or data-pair for first arg, got '${a.toString()}'`);
				}
			},
			chooseList: (a, b, c) => {
				if (a.isAny()) {
					return new UplcAny(site);
				} else if (a.isList()) {
					if (a.length == 0) {
						return b;
					} else {
						return c;
					}
				} else {
					throw site.typeError(`expected list or map first arg, got '${a.toString()}'`);
				}
			},
			mkCons: (a, b) => {
				if (b.isList()) {
					if (!b.itemType.isSameType(a)) {
						throw site.typeError(`wrong type for 2nd arg of mkCons, expected ${a.toString()}, got ${b.toString()}`);
					}

					let lst = b.list;
					lst.unshift(a);

					return new UplcList(site, b.itemType, lst);
				} else {
					throw site.typeError(`expected list or map for second arg, got '${b.toString()}'`);
				}
			},
			headList: (a) => {
				if (a.isList()) {
					const lst = a.list;
					if (lst.length == 0) {
						return rte.error("empty list");
					}

					return lst[0];
				} else {
					throw site.typeError(`__core__headList expects list or map, got '${a.toString()}'`);
				}
			},
			tailList: (a) => {
				if (a.isList()) {
					let lst = a.list;
					if (lst.length == 0) {
						return rte.error("empty list");
					}

					return new UplcList(site, a.itemType, lst.slice(1));
				} else {
					throw site.typeError(`__core__tailList expects list or map, got '${a.toString()}'`);
				}
			},
			nullList: (a) => {
				if (a.isList()) {
					return new UplcBool(site, a.list.length == 0);
				} else {
					throw site.typeError(`__core__nullList expects list or map, got '${a.toString()}'`);
				}
			},
			chooseData: (a, b, c, d, e, f) => {
				if (a.isAny()) {
					return new UplcAny(site);
				} else {
					const data = a.data;

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
				}
			},
			constrData: (a, b) => {
				const i = a.int;
				assert(i >= 0);

				const lst = b.list;

				return new UplcDataValue(site, new ConstrData(Number(i), lst.map(item => item.data)));
			},
			mapData: (a) => {
				return new UplcDataValue(site, new MapData(a.list.map(pair => {
					return [pair.first.data, pair.second.data];
				})));
			},
			listData: (a) => {
				return new UplcDataValue(site, new ListData(a.list.map(item => item.data)));
			},
			iData: (a) => {
				return new UplcDataValue(site, new IntData(a.int));
			},
			bData: (a) => {
				return new UplcDataValue(site, new ByteArrayData(a.bytes));
			},
			unConstrData: (a) => {
				if (!a.isData()) {
					throw site.typeError(`expected data for arg of unConstrData, got ${a.toString()}`);
				}

				let data = a.data;
				if (!(data instanceof ConstrData)) {
					return rte.error(`unexpected unConstrData argument '${data.toString()}'`);
				} else {
					return new UplcPair(site, new UplcInt(site, BigInt(data.index)), new UplcList(site, UplcType.newDataType(), data.fields.map(f => new UplcDataValue(site, f))));
				}
			},
			unMapData: (a) => {
				if (!a.isData()) {
					throw site.typeError(`expected data for arg of unMapData, got ${a.toString()}`);
				}

				let data = a.data;
				if (!(data instanceof MapData)) {
					return rte.error(`unexpected unMapData argument '${data.toString()}'`);
				} else {
					return new UplcList(site, UplcType.newDataPairType(), data.map.map(([fst, snd]) => new UplcPair(site, new UplcDataValue(site, fst), new UplcDataValue(site, snd))));
				}
			},
			unListData: (a) => {
				if (!a.isData()) {
					throw site.typeError(`expected data for arg of unListData, got ${a.toString()}`);
				}

				let data = a.data;
				if (!(data instanceof ListData)) {
					return rte.error(`unexpected unListData argument '${data.toString()}'`);
				} else {
					return new UplcList(site, UplcType.newDataType(), data.list.map(item => new UplcDataValue(site, item)));
				}
			},
			unIData: (a) => {
				if (!a.isData()) {
					throw site.typeError(`expected data for arg of unIData, got ${a.toString()}`);
				}

				let data = a.data;
				if (!(data instanceof IntData)) {
					return rte.error(`unexpected unIData argument '${data.toString()}'`);
				} else {
					return new UplcInt(site, data.value);
				}
			},
			unBData: (a) => {
				if (!a.isData()) {
					throw site.typeError(`expected data for arg of unBData, got ${a.toString()}`);
				}

				let data = a.data;
				if (!(data instanceof ByteArrayData)) {
					return rte.error(`unexpected unBData argument '${data.toString()}'`);
				} else {
					return new UplcByteArray(site, data.bytes);
				}
			},
			equalsData: (a, b) => {
				if (!a.isData()) {
					throw site.typeError(`expected data for 1st arg of equalsData, got ${a.toString()}`);
				}

				if (!b.isData()) {
					throw site.typeError(`expected data for 2nd arg of equalsData, got ${b.toString()}`);
				}

				return new UplcBool(site, a.data.isSame(b.data));
			},
			mkPairData: (a, b) => {
				return new UplcPair(site, new UplcDataValue(site, a.data), new UplcDataValue(site, b.data));
			},
			mkNilData: (a) => {
				a.assertUnit();
				return new UplcList(site, UplcType.newDataType(), []);
			},
			mkNilPairData: (a) => {
				a.assertUnit();

				return new UplcList(site, UplcType.newDataPairType(), []);
			},
			serialiseData: (a) => {
				return new UplcByteArray(site, a.data.toCbor());
			},
			verifyEcdsaSecp256k1Signature: (a, b, c) => {
				throw new Error("no immediate need, so don't bother yet");
			},
			verifySchnorrSecp256k1Signature: (a, b, c) => {
				throw new Error("no immediate need, so don't bother yet");
			}
		};
			
		return assertDefined(callbacks[this.#name], `UplcBuiltin ${this.#name} not yet implemented`)(...args);
	}

	/**
	 * @internal
	 * @type {number}
	 */
	get forceCount() {
		return this.#forceCount;
	}
}

/**
 * @internal
 */
export class UplcFrame {
	/**
	 * @param {UplcRte} rte 
	 * @param {UplcFrame[]} stack 
	 * @param {ReducingState} state 
	 * @returns {Promise<CekState>}
	 */
	async reduceCek(rte, stack, state) {
		throw new Error("not yet implemented");
	}

	/**
	 * @type {Site}
	 */
	get site() {
		throw new Error("not yet implemented");
	}
}

/**
 * @internal
 */
export class ForceFrame extends UplcFrame {
    /**
     * @readonly
     * @type {UplcForce}
     */
    term;

	/**
	 * @readonly
	 * @type {CekEnv}
	 */
	env;

    /**
     * @param {UplcForce} term
	 * @param {CekEnv} env
     */
    constructor(term, env) {
        super();
        this.term = term;
		this.env = env;
    }

	get site() {
		return this.term.site;
	}

	/**
	 * @param {UplcRte} rte 
	 * @param {UplcFrame[]} stack 
	 * @param {ReducingState} state 
	 * @returns {Promise<CekState>}
	 */
	async reduceCek(rte, stack, state) {
		const term = state.reducing;

		return await term.reduceForceFrame(rte, stack, this);
	}
}

/**
 * @internal
 */
export class PreCallFrame extends UplcFrame {
    /**
     * @readonly
     * @type {UplcCall}
     */
    term;

    /**
     * @readonly
     * @type {CekEnv}
     */
    env;

    /**
     * @param {UplcCall} term
     * @param {CekEnv} env
     */
    constructor(term, env) {
        super();
        this.term = term;
        this.env = env;
    }

	/**
	 * @type {Site}
	 */
	get site() {
		return this.term.site;
	}

	/**
	 * 
	 * @param {UplcRte} rte 
	 * @param {UplcFrame[]} stack 
	 * @param {ReducingState} state 
	 * @returns {Promise<CekState>}
	 */
	async reduceCek(rte, stack, state) {
		const term = state.reducing;

		return term.reducePreCallFrame(rte, stack, this);
	}
}

/**
 * @internal
 */
export class CallFrame extends UplcFrame {
    /**
     * @readonly
     * @type {UplcCall}
     */
    term;

    /**
     * @readonly
     * @type {UplcLambdaWithEnv | AppliedUplcBuiltin}
     */
    fn;

	/**
	 * @readonly
	 * @type {CekEnv}
	 */
	env;

    /**
     * @param {UplcCall} term
     * @param {UplcLambdaWithEnv | AppliedUplcBuiltin} fn
	 * @param {CekEnv} env
     */
    constructor(term, fn, env) {
        super();
        this.term = term;
        this.fn = fn;
		this.env = env;
    }

	/**
	 * @type {Site}
	 */
	get site() {
		return this.term.site;
	}

	/**
	 * @param {UplcRte} rte 
	 * @param {UplcFrame[]} stack 
	 * @param {ReducingState} state 
	 * @returns {Promise<CekState>}
	 */
	async reduceCek(rte, stack, state) {
		return this.fn.reduceCallFrame(rte, stack, state, this);
	}
}

/**
 * @internal
 * @template {UplcTerm} T
 */
class UplcTermWithEnv {
    /**
    * @readonly
    * @type {T}
    */
    term;

    /**
     * @readonly
     * @type {CekEnv}
     */
    env;

    /**
     * @param {T} term 
     * @param {CekEnv} env 
     */
    constructor(term, env) {
        this.term = term;
        this.env = env;
    }

	/**
	 * @type {Site}
	 */
	get site() {
		return this.term.site;
	}

    toString() {
        return `(WithEnv ${this.term.toString()})`;
    }
}

/**
 * @internal
 * @extends {UplcTermWithEnv<UplcLambda>}
 */
class UplcLambdaWithEnv extends UplcTermWithEnv {
	/**
	 * @param {UplcRte} rte 
	 * @param {UplcFrame[]} stack 
	 * @param {PreCallFrame} frame 
	 * @returns {Promise<CekState>}
	 */
	async reducePreCallFrame(rte, stack, frame) {
		stack.push(new CallFrame(frame.term, this, frame.env));
		return {computing: frame.term.arg, env: frame.env};
	}

	/**
	 * @param {UplcRte} rte 
	 * @param {UplcFrame[]} stack 
	 * @param {ForceFrame} frame 
	 * @returns {Promise<CekState>}
	 */
	async reduceForceFrame(rte, stack, frame) {
		throw new Error("expected force after delay");
	}

	/**
	 * @param {UplcRte} rte 
	 * @param {UplcFrame[]} stack 
	 * @param {ReducingState} state 
	 * @param {CallFrame} frame 
	 * @returns {Promise<CekState>}
	 */
	async reduceCallFrame(rte, stack, state, frame) {
		return {
			computing: this.term.expr, 
			env: {
				values: this.env.values.concat([state.reducing]),
				callSites: frame.env.callSites.concat([frame.term.callSite])
			}
		};
	}
}

/**
 * @internal
 * @extends {UplcTermWithEnv<UplcDelay>}
 */
class UplcDelayWithEnv extends UplcTermWithEnv {
	/**
	 * @param {UplcRte} rte 
	 * @param {UplcFrame[]} stack 
	 * @param {PreCallFrame} frame 
	 * @returns {CekState}
	 */
	reducePreCallFrame(rte, stack, frame) {
		throw new Error("UplcCall term expects UplcLambdaWithEnv or UplcBuiltin for first arg");
	}

	/**
	 * @param {UplcRte} rte 
	 * @param {UplcFrame[]} stack 
	 * @param {ForceFrame} frame 
	 * @returns {CekState}
	 */
	reduceForceFrame(rte, stack, frame) {
		return {
			computing: this.term.expr, 
			env: {
				values: this.env.values,
				callSites: frame.env.callSites.concat([frame.term.site])
			}
		};
	}
}

/**
 * @internal
 * @implements {UplcValue}
 */
class UplcAnonValue extends UplcValueImpl {
    /**
     * @readonly
     * @type {AppliedUplcBuiltin | UplcLambdaWithEnv | UplcDelayWithEnv}
     */
    term;

    /**
     * @param {Site} site
     * @param {AppliedUplcBuiltin | UplcLambdaWithEnv | UplcDelayWithEnv} term 
     */
    constructor(site, term) {
        super(site);
        this.term = term;
    }

	/**
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		throw new Error("shouldn't be part of AST");
	}

	/**
	 * @param {Site} newSite 
	 * @returns {UplcValue}
	 */
	copy(newSite) {
		throw new Error("shouldn't be part of AST");
	}

    /**
     * @type {number}
     */
    get memSize() {
        return 1;
    }

	/**
	 * @type {number}
	 */
	get flatSize() {
		throw new Error("shouldn't be part of AST");
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return this.term.toString();
	}
}

/**
 * @internal
 */
class AppliedUplcBuiltin {
    /**
     * @readonly
     * @type {UplcBuiltin}
     */
    term;

    /**
     * @readonly
     * @type {number}
     */
    forceCount;

    /**
     * @readonly
     * @type {CekValue[]}
     */
    args;

    /**
     * @param {UplcBuiltin} term
     * @param {number} forceCount
     * @param {CekValue[]} args
     */
    constructor(term, forceCount = 0, args = []) {
        this.term = term;
        this.forceCount = forceCount;
        this.args = args;
    }

	/**
	 * @type {Site}
	 */
	get site() {
		return this.term.site;
	}

    /**
     * @returns {string}
     */
    toString() {
        return `(AppliedBuiltin ${this.forceCount} [${this.args.map(a => a.toString()).join(", ")}] ${this.term.toString()})`;
    }

    /**
     * @returns {AppliedUplcBuiltin}
     */
    force() {
        assert(this.forceCount < this.term.forceCount);

        return new AppliedUplcBuiltin(this.term, this.forceCount + 1, this.args);
    }

    /**
     * @param {CekValue} arg 
     * @returns {AppliedUplcBuiltin}
     */
    apply(arg) {
        assert(this.term.nArgs == -1 || this.args.length < this.term.nArgs);

        return new AppliedUplcBuiltin(this.term, this.forceCount, this.args.concat([arg]));
    }

    /**
     * @returns {boolean}
     */
    isFullForced() {
        return this.forceCount == this.term.forceCount;
    }

    /**
     * @returns {boolean}
     */
    isFullyApplied() {
        if (this.term.isMacro()) {
            if (this.args.length == 0) {
                return false;
            } else {
                const last = this.args[this.args.length - 1];

                if (last instanceof UplcConst && last.value instanceof UplcUnit) {
                    return true;
                } else {
                    return false;
                }
            }
        } else {
            return this.args.length == this.term.nArgs;
        }
    }

    /**
	 * @internal
     * @param {UplcRte} rte
     * @param {Site[]} sites
     * @returns {Promise<CekValue>}
     */
    async evalCek(rte, sites) {
		let site = sites[sites.length - 1];

        const args = this.args.map(a => {
            if (a instanceof UplcConst) {
                return a.value;
            } else {
                return new UplcAnonValue(Site.dummy(), a);
            }
        });

		/**
		 * @type {UplcValue}
		 */
		let res;

		if (this.term.isMacro()) {
			// don't include the last unit
			assertDefined(args.pop()).assertUnit();
			res = await this.term.evalMacro(rte, site, args);
		} else {
			if (!this.term.allowAny() && args.some(a => a.isAny())) {
				res = new UplcAny(site);
			} else if (this.term.name == "trace") {
				if (!site.codeMapSite) {
					for (let i = sites.length - 1; i >= 0; i--) {
						const s = sites[i];
						if (s.codeMapSite) {
							site = s.codeMapSite;
							break;
						}
					}
				} else {
					site = site.codeMapSite;
				}
				
				res = await this.term.evalBuiltin(rte, site, args);
			} else {
				res = await this.term.evalBuiltin(rte, site, args);
			}
		}

		if (res instanceof UplcAnonValue) {
			return res.term;
		} else {
			return new UplcConst(res);
		}
    }

	/**
	 * @param {UplcRte} rte 
	 * @param {UplcFrame[]} stack 
	 * @param {PreCallFrame} frame 
	 * @returns {Promise<CekState>}
	 */
	async reducePreCallFrame(rte, stack, frame) {
		stack.push(new CallFrame(frame.term, this, frame.env));
		return {computing: frame.term.arg, env: frame.env};
	}

	/**
	 * @param {UplcRte} rte 
	 * @param {UplcFrame[]} stack 
	 * @param {ForceFrame} frame 
	 * @returns {Promise<CekState>}
	 */
	async reduceForceFrame(rte, stack, frame) {
		if (!this.isFullForced()) {
			return {reducing: this.force()};
		} else {
			throw new Error(`can't apply force to ${this.term.name}`);
		}
	}

	/**
	 * @param {UplcRte} rte 
	 * @param {UplcFrame[]} stack 
	 * @param {ReducingState} state 
	 * @param {CallFrame} frame 
	 * @returns {Promise<CekState>}
	 */
	async reduceCallFrame(rte, stack, state, frame) {
		if (!this.isFullForced()) {
			throw new Error("must be fully forced before call");
		} else if (!this.isFullyApplied()) {
			const fn = this.apply(state.reducing);

			if (fn.isFullyApplied()) {
				const callSites = frame.env.callSites.concat([frame.term.callSite]);

				const res = await fn.evalCek(rte, callSites);

				if (rte.hasError()) {
					return {
						error: rte.getError(), 
						env: {
							values: frame.env.values,
							callSites: callSites
						}
					};
				} else {
					return {reducing: res};
				}
			} else {
				return {reducing: fn};
			}
		} else {
			throw new Error("already fully applied");
		}
	}
}

/**
 * @internal
 * @typedef {UplcConst | AppliedUplcBuiltin | UplcLambdaWithEnv | UplcDelayWithEnv} CekValue
 */

/**
 * @internal
 * @typedef {{
 * 	 values: CekValue[],
 *   callSites: Site[]
 * }} CekEnv
 */

/**
 * @internal
 * @typedef {{computing: UplcTerm, env: CekEnv}} ComputingState
 */

/**
 * @internal
 * @typedef {{reducing: CekValue}} ReducingState
 */

/**
 * @internal
 * @typedef {{error: string | RuntimeError, env: CekEnv}} ErrorState
 */

/**
 * @internal
 * @typedef {ComputingState | ReducingState | ErrorState} CekState
 */

/**
 * @internal
 * @param {UplcRte} rte
 * @param {UplcTerm} start
 * @param {null | UplcValue[]} args
 * @returns {Promise<UplcValue>}
 */
export async function evalCek(rte, start, args = null) {
    if (args !== null) {
        if (args.length == 0) {
            start = new UplcForce(start.site, start);
        } else {
            for (let arg of args) {
                start = new UplcCall(start.site, start, new UplcConst(arg));
            }
        }
    }

    /**
     * @type {UplcFrame[]}
     */
    const stack = [];

    /**
     * @type {CekState}
     */
    let state = {computing: start, env: {values: [], callSites: []}};

    // add the startup costs
    rte.incrStartupCost();

	while (true) {
		if ("computing" in state) {
			const term = state.computing;

			state = term.computeCek(rte, stack, state);
		} else if ("reducing" in state) {
			const f = stack.pop();

			const term = state.reducing;

			if (!f) {
				if (term instanceof UplcConst) {
					return term.value;
				} else {
					throw new Error("final UplcTerm in CEK isn't a UplcConst but a " + term.toString());
				}
			} else {
				state = await f.reduceCek(rte, stack, state);
			}
		} else if ("error" in state) {
			/**
			 * @type {string[]}
			 */
			let lines = rte.messages.slice();

			let err = state.error;

			const summary = "thrown during UPLC evaluation";

			if (typeof err == "string") {
				let msg = err;

				if (msg == "" && lines.length > 0) {
					msg = assertDefined(lines.pop()).split(")").slice(1).join(")").trim();
				}

				/**
				 * @type {boolean}
				 */
				let codeMapSiteFound = false;

				for (let i = state.env.callSites.length - 1; i >= 0; i--) {
					const s = state.env.callSites[i];

					if (s.codeMapSite) {
						if (!codeMapSiteFound) {
							lines.push(`ERROR (${s.codeMapSite.toString()}) ${msg}`);
							codeMapSiteFound = true;
						} else {
							lines.push(`TRACE (${s.codeMapSite.toString()})`);
						}
					}
				}

				if (!codeMapSiteFound) {
					lines.push(`ERROR ${msg}`);
				}

				
			} else {
				lines = lines.concat(err.message.split("\n").filter(l => l != summary));
			}

			lines.unshift(summary);

			throw new RuntimeError(lines.join("\n"));
		} else {
			throw new Error("unhandled CEK state");
		}
	}
}