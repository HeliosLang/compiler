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
    Crypto
} from "./crypto.js";

/**
 * @typedef {import("./uplc-costmodels.js").Cost} Cost
 */

import {
    NetworkParams
} from "./uplc-costmodels.js";

import {
    UPLC_BUILTINS,
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
 * @package
 */
export const ScriptPurpose = {
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
export function getPurposeName(id) {
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
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		throw new Error("not yet implemented");
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
export class UplcAnon extends UplcValue {
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

	/**
	 * Should never be part of the uplc ast
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		throw new Error("not expected to be part of uplc ast");
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
export class UplcDelayedValue extends UplcValue {
	#evaluator;

	/**
	 * @param {Site} site
	 * @param {() => (UplcValue | Promise<UplcValue>)} evaluator
	 */
	constructor(site, evaluator) {
		super(site);
		this.#evaluator = evaluator;
	}

	/**
	 * Should never be part of ast
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		throw new Error("not expected to be part of uplc ast");
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

	/**
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		return other.transferUplcInt(
			this.site.transfer(other),
			this.#value,
			this.#signed
		);
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
export class UplcVariable extends UplcTerm {
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
	 * @param {TransferUplcAst} other 
	 */
	transfer(other) {
		return other.transferUplcVariable(
			this.site.transfer(other),
			this.#index.transfer(other)
		);
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
export class UplcDelay extends UplcTerm {
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
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		return other.transferUplcDelay(
			this.site.transfer(other),
			this.#expr.transfer(other)
		);
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
export class UplcLambda extends UplcTerm {
	#rhs;
	#argName;

	/**
	 * @param {Site} site
	 * @param {UplcTerm} rhs
	 * @param {null | string} argName
	 */
	constructor(site, rhs, argName = null) {
		super(site, 2);
		this.#rhs = rhs;
		this.#argName = argName;
	}

	/**
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		return other.transferUplcLambda(
			this.site.transfer(other),
			this.#rhs.transfer(other),
			this.#argName
		);
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
export class UplcCall extends UplcTerm {
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
	 * @param {TransferUplcAst} other
	 * @returns {any}
	 */
	transfer(other) {
		return other.transferUplcCall(
			this.site.transfer(other),
			this.#a.transfer(other),
			this.#b.transfer(other)
		);
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
export class UplcConst extends UplcTerm {
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
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		return other.transferUplcConst(
			this.#value.transfer(other)
		);
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
export class UplcForce extends UplcTerm {
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
	 * @param {TransferUplcAst} other 
	 * @returns {any}
	 */
	transfer(other) {
		return other.transferUplcForce(
			this.site.transfer(other),
			this.#expr.transfer(other)
		);
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
export class UplcBuiltin extends UplcTerm {
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