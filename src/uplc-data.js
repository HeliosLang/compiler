//@ts-check
// Uplc data types

import {
    bytesToHex,
    hexToBytes,
    textToBytes
} from "./utils.js";

import {
    IR
} from "./tokens.js";

import {
    CborData
} from "./cbor.js";

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

		CborData.decodeList(bytes, (itemBytes) => {
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

		CborData.decodeMap(bytes, pairBytes => {
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

		let tag = CborData.decodeConstr(bytes, (fieldBytes) => {
			fields.push(UplcData.fromCbor(fieldBytes));
		});

		return new ConstrData(tag, fields);
	}
}
