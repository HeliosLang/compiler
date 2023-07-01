//@ts-check
// Cbor encoder/decoder

import {
    assert,
    assertDefined,
    bigIntToBytes,
    bytesToBigInt,
	bytesToHex,
    bytesToText,
    idiv,
    textToBytes
} from "./utils.js";

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
	 * @returns {string}
	 */
	toCborHex() {
		return bytesToHex(this.toCbor())
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
	 * Strings can be split into lists with chunks of up to 64 bytes
	 * to play nice with Cardano tx metadata constraints.
	 * @param {string} str
	 * @param {boolean} split
	 * @returns {number[]}
	 */
	static encodeUtf8(str, split = false) {
		const bytes = textToBytes(str);

		if (split && bytes.length > 64) {
			/** @type {number[][]} */
			const chunks = [];

			let i = 0;
			while (i < bytes.length) {
				// We encode the largest chunk up to 64 bytes
				// that is valid UTF-8
				let maxChunkLength = 64, chunk;
				while (true) {
					try {
						chunk = bytes.slice(i, i + maxChunkLength);
						bytesToText(chunk); // Decode to validate utf-8
						break;
					} catch(_) {
						maxChunkLength--;
					}
				}
				chunks.push([120, chunk.length].concat(chunk));
				i += chunk.length;
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
