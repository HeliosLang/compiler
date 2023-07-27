//@ts-check
// Uplc program

import {
    BitReader,
    BitWriter,
    Source,
    assert,
    assertDefined,
    bytesToHex,
    bytesToText,
    hexToBytes,
	assertEq
} from "./utils.js";

/**
 * @typedef {import("./utils.js").TransferUplcAst} TransferUplcAst
 */

import {
	RuntimeError,
    Site,
    UserError
} from "./tokens.js";

import {
    Crypto
} from "./crypto.js";

import {
    CborData
} from "./cbor.js";

import {
	ByteArrayData,
    ConstrData,
	IntData,
	ListData,
    MapData,
    UplcData
} from "./uplc-data.js";

import {
	HeliosData,
    MintingPolicyHash,
    StakingValidatorHash,
    ValidatorHash
} from "./helios-data.js";

/**
 * @typedef {import("./uplc-costmodels.js").Cost} Cost
 */

import {
    NetworkParams
} from "./uplc-costmodels.js";

import {
    UPLC_BUILTINS, UPLC_MACROS, UPLC_MACROS_OFFSET
} from "./uplc-builtins.js";

/**
 * @typedef {import("./uplc-ast.js").ScriptPurpose} ScriptPurpose
 */

/**
 * @typedef {import("./uplc-ast.js").UplcRTECallbacks} UplcRTECallbacks
 */

/**
 * @typedef {import("./uplc-ast.js").UplcValueTerm} UplcValueTerm
 */

import {
    DEFAULT_UPLC_RTE_CALLBACKS,
    UplcAnon,
    UplcBool,
    UplcBuiltin,
    UplcByteArray,
    UplcCall,
    UplcConst,
    UplcDataValue,
    UplcDelay,
    UplcDelayedValue,
    UplcError,
    UplcForce,
    UplcInt,
    UplcLambda,
    UplcList,
    UplcPair,
    UplcRte,
    UplcString,
    UplcTerm,
	UplcType,
    UplcUnit,
    UplcValue,
    UplcVariable,
	evalCek
} from "./uplc-ast.js";
import { config } from "./config.js";

/**
 * This library uses version "1.0.0" of Plutus-core
 * @internal
 */
const UPLC_VERSION_COMPONENTS = [1n, 0n, 0n];

 /**
  * i.e. "1.0.0"
  * @internal
  * @type {string}
  */
const UPLC_VERSION = UPLC_VERSION_COMPONENTS.map(c => c.toString()).join(".");

/**
 * This library uses V2 of the Plutus Ledger API, and is no longer compatible with V1
 * @internal
 */
const PLUTUS_SCRIPT_VERSION = "PlutusScriptV2";

/**
 * @internal
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
 * TODO: purpose as enum type
 * @typedef {{
 *   purpose: null | ScriptPurpose 
 *   callsTxTimeRange: boolean
 *   name?: string
 * }} ProgramProperties
 */

/**
 * The constructor returns 'any' because it is an instance of TransferableUplcProgram, and the instance methods don't need to be defined here
 * @internal
 * @template TInstance
 * @typedef {{
 *   transferUplcProgram: (expr: any, properties: ProgramProperties, version: any[]) => TInstance,
 *   transferUplcAst: TransferUplcAst
 * }} TransferableUplcProgram
 */

/**
 * @typedef {{
*   mem: bigint, 
*   cpu: bigint,
*   size?: number,
*   builtins?: {[name: string]: Cost},
*   terms?: {[name: string]: Cost},
*   result?: RuntimeError | UplcValue,
*   messages?: string[]
* }} Profile
*
*
* mem:  in 8 byte words (i.e. 1 mem unit is 64 bits)
* cpu:  in reference cpu microseconds
* size: in bytes
* builtins: breakdown per builtin
* terms: breakdown per termtype
* result: result of evaluation
* messages: printed messages (can be helpful when debugging)
*/

/**
 * Plutus-core program class
 */
 export class UplcProgram {
	#version;
	#expr;
	#properties;

	/**
	 * @param {UplcTerm} expr 
	 * @param {ProgramProperties} properties
	 * @param {UplcInt[]} version
	 */
	constructor(expr, properties = {purpose: null, callsTxTimeRange: false}, version = UPLC_VERSION_COMPONENTS.map(v => new UplcInt(expr.site, v, false))) {
		this.#version    = version;
		this.#expr       = expr;
		this.#properties = properties;
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
	 * @type {ProgramProperties}
	 */
	get properties() {
		return this.#properties;
	}

	/**
	 * @template TInstance
	 * @param {TransferableUplcProgram<TInstance>} other
	 * @returns {TInstance}
	 */
	transfer(other) {
		return other.transferUplcProgram(
			this.#expr.transfer(other.transferUplcAst),
			this.#properties,
			this.#version.map(i => i.transfer(other.transferUplcAst))
		);
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
		this.toFlatWithMapping(bitWriter, null);
	}

	/**
	 * @param {BitWriter} bitWriter
	 * @param {null | Map<string, number>} codeMapFileIndices
	 */
	toFlatWithMapping(bitWriter, codeMapFileIndices) {
		for (let v of this.#version) {
			v.toFlatUnsigned(bitWriter);
		}

		this.#expr.toFlat(bitWriter, codeMapFileIndices);
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
	 * @param {null | UplcValue[]} args
	 * @param {UplcRTECallbacks} callbacks
	 * @param {null | NetworkParams} networkParams
	 * @returns {Promise<UplcValue>}
	 */
	async runInternal(args, callbacks = DEFAULT_UPLC_RTE_CALLBACKS, networkParams = null) {
		assertDefined(callbacks);

		let rte = new UplcRte(callbacks, networkParams);
		
		if (config.EXPERIMENTAL_CEK) {
			return await evalCek(rte, this.#expr, args);
		} else {
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

		return new UplcProgram(expr, this.#properties, this.#version);
	}

	/**
	 * @param {null | UplcValue[]} args - if null the top-level term is returned as a value
	 * @param {UplcRTECallbacks} callbacks 
	 * @param {null | NetworkParams} networkParams
	 * @returns {Promise<UplcValue | RuntimeError>}
	 */
	async run(args, callbacks = DEFAULT_UPLC_RTE_CALLBACKS, networkParams = null) {
		try {
			return await this.runInternal(args, callbacks, networkParams);
		} catch (e) {
			if (!(e instanceof RuntimeError)) {
				throw e;
			} else {
				return e;
			}
		}
	}

	/**
	 * @param {null | UplcValue[]} args
	 * @returns {Promise<[(UplcValue | RuntimeError), string[]]>}
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
	 * @internal
	 * @param {Map<string, number>} codeMapFileIndices 
	 */
	toCborWithMapping(codeMapFileIndices) {
		let bitWriter = new BitWriter();

		this.toFlatWithMapping(bitWriter, codeMapFileIndices);

		return CborData.encodeBytes(CborData.encodeBytes(bitWriter.finalize()));
	}

	/**
	 * Returns Plutus-core script in JSON format (as string, not as object!)
	 * @returns {string}
	 */
	serialize() {
		const cborHex = bytesToHex(this.toCbor());

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
		const purpose = this.#properties.purpose;

		assert(purpose === null || purpose === "spending");

		return new ValidatorHash(this.hash());
	}

	/**
	 * @type {MintingPolicyHash}
	 */
	get mintingPolicyHash() {
		const purpose = this.#properties.purpose;

		assert(purpose === null || purpose === "minting");

		return new MintingPolicyHash(this.hash());
	}

	/**
	 * @type {StakingValidatorHash}
	 */
	get stakingValidatorHash() {
		const purpose = this.#properties.purpose;

		assert(purpose === null || purpose === "staking");

		return new StakingValidatorHash(this.hash());
	}


	/**
	 * @internal
	 * @param {number[] | string} bytes 
	 * @param {ProgramProperties} properties
	 * @param {Source[]} files
	 * @returns {UplcProgram}
	 */
	static fromCborWithMapping(bytes, files, properties = {purpose: null, callsTxTimeRange: false}) {
		if (typeof bytes == "string") {
			return UplcProgram.fromCborWithMapping(hexToBytes(bytes), files, properties)
		} else {
			bytes = CborData.decodeBytes(CborData.decodeBytes(bytes));

			return UplcProgram.fromFlatWithMapping(bytes, files, properties);
		}
	}

	/**
	 * @param {number[] | string} bytes 
	 * @param {ProgramProperties} properties
	 * @returns {UplcProgram}
	 */
   	static fromCbor(bytes, properties = {purpose: null, callsTxTimeRange: false}) {
		return UplcProgram.fromCborWithMapping(bytes, [], properties);
	}

	/**
	 * @param {number[]} bytes 
	 * @param {ProgramProperties} properties
	 * @returns {UplcProgram}
	 */
	static fromFlat(bytes, properties = {purpose: null, callsTxTimeRange: false}) {
		return UplcProgram.fromFlatWithMapping(bytes, [], properties);
	}

	/**
	 * @internal
	 * @param {number[]} bytes 
	 * @param {ProgramProperties} properties
	 * @param {Source[]} files
	 * @returns {UplcProgram}
	 */
	static fromFlatWithMapping(bytes, files, properties = {purpose: null, callsTxTimeRange: false}) {
		const reader = new UplcDeserializer(bytes, files);

		const version = [
			reader.readInteger(),
			reader.readInteger(),
			reader.readInteger(),
		];

		const versionKey = version.map(v => v.toString()).join(".");

		if (versionKey != UPLC_VERSION) {
			console.error(`Warning: Plutus-core script doesn't match version of Helios (expected ${UPLC_VERSION}, got ${versionKey})`);
		}

		const expr = reader.readTerm();

		reader.finalize();

		return new UplcProgram(expr, properties, version);
	}

	/**
	 * Intended for transfer only
	 * @param {any} expr 
	 * @param {ProgramProperties} properties 
	 * @param {any[]} version 
	 * @returns {UplcProgram}
	 */
	static transferUplcProgram(expr, properties, version) {
		if (!(expr instanceof UplcTerm)) {
			throw new Error("program expr not transferred correctly");
		} else if (!version.every(v => v instanceof UplcInt)) {
			throw new Error("program version ints not transferred correctly");
		} else {
			return new UplcProgram(expr, properties, version);
		}
	}

	/**
	 * @type {TransferUplcAst}
	 */
	static get transferUplcAst() {
		return {
			transferByteArrayData: (bytes) => new ByteArrayData(bytes),
			transferConstrData:    (index, fields) => new ConstrData(index, fields),
			transferIntData:       (value) => new IntData(value),
			transferListData:      (items) => new ListData(items),
			transferMapData:       (pairs) => new MapData(pairs),
			transferSite:          (src, startPos, endPos, codeMapSite = null) => new Site(src, startPos, endPos, codeMapSite),
			transferSource:        (raw, file) => new Source(raw, file?.toString() ?? "<>"), // in older versions of Helios the file arg had type (null | number)
			transferUplcBool:      (site, value) => new UplcBool(site, value),
			transferUplcBuiltin:   (site, name) => new UplcBuiltin(site, name),
			transferUplcByteArray: (site, bytes) => new UplcByteArray(site, bytes),
			transferUplcCall:      (site, a, b) => new UplcCall(site, a, b),
			transferUplcConst:     (value) => new UplcConst(value),
			transferUplcDataValue: (site, data) => new UplcDataValue(site, data),
			transferUplcDelay:     (site, expr) => new UplcDelay(site, expr),
			transferUplcError:     (site, msg) => new UplcError(site, msg),
			transferUplcForce:     (site, expr) => new UplcForce(site, expr),
			transferUplcInt:       (site, value, signed) => new UplcInt(site, value, signed),
			transferUplcLambda:    (site, rhs, name = null) => new UplcLambda(site, rhs, name),
			transferUplcList:      (site, itemType, items) => new UplcList(site, itemType, items),
			transferUplcPair:      (site, first, second) => new UplcPair(site, first, second),
			transferUplcString:    (site, value) => new UplcString(site, value),
			transferUplcType:      (typeBits) => new UplcType(typeBits),
			transferUplcUnit:      (site) => new UplcUnit(site),
			transferUplcVariable:  (site, index) => new UplcVariable(site, index)
		};
	}
}

/**
 * Plutus-core deserializer creates a Plutus-core form an array of bytes
 */
 class UplcDeserializer extends BitReader {
	/**
	 * @readonly
	 * @type {Source[]}
	 */
	#files;

	/**
	 * @param {number[]} bytes 
	 * @param {Source[]} files - for serialized codeMapping
	 */
	constructor(bytes, files = []) {
		super(bytes);

		this.#files = files;
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
		} else if (id >= UPLC_MACROS_OFFSET && id < UPLC_MACROS_OFFSET + UPLC_MACROS.length) {
			return `macro__${assertDefined(UPLC_MACROS[id - UPLC_MACROS_OFFSET])}`;
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
			case 11:
				return this.readCallWithSite();
			case 13:
				return this.readForceWithSite();
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
	 * Reads a function application term with a callSite (needed for bundler)
	 * @internal
	 * @returns {UplcCall}
	 */
	readCallWithSite() {
		let [fileIndex, pos] = [
			Number(this.readInteger().value),
			Number(this.readInteger().value)
		];

		const src = assertDefined(this.#files[fileIndex], "serialized UplcProgram contains codeMapping symbols, requires list of original sources");

		let site = new Site(src, pos);
		// also add self as codeMapSite
		site = new Site(src, pos, undefined, site);

		let a = this.readTerm();
		let b = this.readTerm();

		return new UplcCall(site, a, b);
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
	 * @internal
	 * @returns {UplcForce}
	 */
	readForceWithSite() {
		let [fileIndex, pos] = [
			Number(this.readInteger().value),
			Number(this.readInteger().value)
		];
		
		const src = assertDefined(this.#files[fileIndex], "serialized UplcProgram contains codeMapping symbols, requires list of original sources");

		let site = new Site(src, pos);
		// also add self as codeMapSite
		site = new Site(src, pos, undefined, site);

		let expr = this.readTerm();

		return new UplcForce(site, expr);
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
 * @param {ProgramProperties} properties
 * @returns {UplcProgram}
 */
export function deserializeUplcBytes(bytes, properties = {purpose: null, callsTxTimeRange: false}) {
	return UplcProgram.fromFlat(bytes, properties);
}

/**
 * Parses a plutus core program. Returns a UplcProgram object
 * @param {string} jsonString 
 * @returns {UplcProgram}
 */
export function deserializeUplc(jsonString) {
	let obj = JSON.parse(jsonString);

	if (!("cborHex" in obj)) {
		throw UserError.syntaxError(new Source(jsonString, "<json>"), 0, 1, "cborHex field not in json")
	}

	let cborHex = obj.cborHex;
	if (typeof cborHex !== "string") {
		let src = new Source(jsonString, "<json>");
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
