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
 * Also 
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
}

/**
 * Helper methods for (de)serializing data to/from Cbor.
 * 
 * **Note**: Each decoding method mutates the input `bytes` by shifting it to the following CBOR element.
 * @namespace
 */
export const Cbor = {
	/**
	 * @param {number} m - major type
	 * @param {bigint} n - size parameter
	 * @returns {number[]} - uint8 bytes
	 */
	encodeHead: (m, n) => {
		if (n <= 23n) {
			return [32*m + Number(n)];
		} else if (n >= 24n && n <= 255n) {
			return [32*m + 24, Number(n)];
		} else if (n >= 256n && n <= 256n*256n - 1n) {
			return [32*m + 25, Number((n/256n)%256n), Number(n%256n)];
		} else if (n >= 256n*256n && n <= 256n*256n*256n*256n - 1n) {
			const e4 = bigIntToBytes(n);

			while (e4.length < 4) {
				e4.unshift(0);
			}
			return [32*m + 26].concat(e4);
		} else if (n >= 256n*256n*256n*256n && n <= 256n*256n*256n*256n*256n*256n*256n*256n - 1n) {
			const e8 = bigIntToBytes(n);

			while(e8.length < 8) {
				e8.unshift(0);
			}
			return [32*m + 27].concat(e8);
		} else {
			throw new Error("n out of range");
		}
	},

	/**
	 * @param {number[]} bytes - mutated to contain the rest
	 * @returns {[number, bigint]} - [majorType, n]
	 */
	decodeHead: (bytes) => {
		if (bytes.length == 0) {
			throw new Error("empty cbor head");
		}

		const first = assertDefined(bytes.shift());

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
	},

	/**
	 * @param {number} m
	 * @returns {number[]}
	 */
	encodeIndefHead: (m) => {
		return [32*m + 31];
	},

	/**
	 * @param {number[]} bytes - cbor bytes
	 * @returns {number} - majorType
	 */
	decodeIndefHead: (bytes) => {
		const first = assertDefined(bytes.shift());

		const m = idiv(first - 31, 32);

		return m;
	},

	/**
	 * @param {number[]} bytes
	 * @returns {boolean}
	 */
	isNull: (bytes) => {
		return bytes[0] == 246;
	},

	/**
	 * Encode `null` into its CBOR representation.
	 * @returns {number[]}
	 */
	encodeNull: () => {
		return [246];
	},

	/**
	 * Checks if next element in `bytes` is a `null`.
	 * Throws an error if it isn't. 
	 * @param {number[]} bytes
	 */
	decodeNull: (bytes) => {
		const b = assertDefined(bytes.shift());

		if (b != 246) {
			throw new Error("not null");
		}
	},

	/**
	 * Encodes a `boolean` into its CBOR representation.
	 * @param {boolean} b
	 * @returns {number[]}
	 */
	encodeBool: (b) => {
		if (b) {
			return [245];
		} else {
			return [244];
		}
	},

	/**
	 * Decodes a CBOR encoded `boolean`.
	 * Throws an error if the next element in bytes isn't a `boolean`.
	 * @param {number[]} bytes
	 * @returns {boolean}
	 */
	decodeBool: (bytes) => {
		const b = assertDefined(bytes.shift());

		if (b == 245) {
			return true;
		} else if (b == 244) {
			return false;
		} else {
			throw new Error("unexpected non-boolean cbor object");
		}
	},

	/**
	 * @param {number[]} bytes 
	 * @returns {boolean}
	 */
	isBytes: (bytes) => {
		return Cbor.isDefBytes(bytes) || Cbor.isIndefBytes(bytes);
	},

	/**
	 * @param {number[]} bytes
	 * @returns {boolean}
	 */
	isDefBytes: (bytes) => {
		if (bytes.length == 0) {
			throw new Error("empty cbor bytes");
		}

		const [m, _] = Cbor.decodeHead(bytes.slice(0, 9));

		return m == 2;
	},

	/**
	 * @param {number[]} bytes
	 * @returns {boolean}
	 */
	isIndefBytes: (bytes) => {
		if (bytes.length == 0) {
			throw new Error("empty cbor bytes");
		}

		return 2*32 + 31 == bytes[0];
	},

	/**
	 * Wraps a list of bytes using CBOR. Optionally splits the bytes into chunks.
	 * @example
	 * bytesToHex(Cbor.encodeBytes(hexToBytes("4d01000033222220051200120011"))) == "4e4d01000033222220051200120011"
	 * @param {number[]} bytes
	 * @param {boolean} splitIntoChunks
	 * @returns {number[]} - cbor bytes
	 */
	encodeBytes: (bytes, splitIntoChunks = false) => {
		bytes = bytes.slice();

		if (bytes.length <= 64 || !splitIntoChunks) {
			const head = Cbor.encodeHead(2, BigInt(bytes.length));
			return head.concat(bytes);
		} else {
			let res = Cbor.encodeIndefHead(2);

			while (bytes.length > 0) {
				const chunk = bytes.splice(0, 64);

				res = res.concat(Cbor.encodeHead(2, BigInt(chunk.length))).concat(chunk);
			}

			res.push(255);

			return res;
		}
	},

	/**
	 * Unwraps a CBOR encoded list of bytes. 
	 * @example
	 * bytesToHex(Cbor.decodeBytes(hexToBytes("4e4d01000033222220051200120011"))) == "4d01000033222220051200120011"
	 * @param {number[]} bytes - cborbytes, mutated to form remaining
	 * @returns {number[]} - byteArray
	 */
	decodeBytes: (bytes) => {
		// check header type
		assert(bytes.length > 0);

		if (Cbor.isIndefBytes(bytes)) {
			// multiple chunks
			void bytes.shift();

			/**
			 * @type {number[]}
			 */
			let res = [];

			while(bytes[0] != 255) {
				const [_, n] = Cbor.decodeHead(bytes);
				if (n > 64n) {
					throw new Error("bytearray chunk too large");
				}

				res = res.concat(bytes.splice(0, Number(n)));
			}

			assert(bytes.shift() == 255);

			return res;
		} else {
			const [_, n] = Cbor.decodeHead(bytes);

			return bytes.splice(0, Number(n));
		}
	},

	/**
	 * @param {number[]} bytes
	 * @returns {boolean}
	 */
	isUtf8: (bytes) => {
		const [m, _] = Cbor.decodeHead(bytes.slice());

		return m == 3;
	},

	/**
	 * Encodes a Utf8 string into Cbor bytes.
	 * Strings can be split into lists with chunks of up to 64 bytes
	 * to play nice with Cardano tx metadata constraints.
	 * @param {string} str
	 * @param {boolean} split
	 * @returns {number[]}
	 */
	encodeUtf8: (str, split = false) => {
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
				chunks.push(Cbor.encodeHead(3, BigInt(chunk.length)).concat(chunk));
				i += chunk.length;
			}

			return Cbor.encodeDefList(chunks);
		} else {
			return Cbor.encodeHead(3, BigInt(bytes.length)).concat(bytes);
		}
	},

	/**
	 * @internal
	 * @param {number[]} bytes
	 * @returns {string}
	 */
	decodeUtf8Internal: (bytes) => {
		const [m, n] = Cbor.decodeHead(bytes);

		assert(m === 3);

		return bytesToText(bytes.splice(0, Number(n)));
	},

	/**
	 * @param {number[]} bytes
	 * @returns {string}
	 */
	decodeUtf8: (bytes) => {
		assert(bytes.length > 0);

		if (Cbor.isDefList(bytes)) {
			let result = "";

			Cbor.decodeList(bytes, (_, itemBytes) => {
				result += Cbor.decodeUtf8Internal(itemBytes);
			});

			return result;
		} else {
			return Cbor.decodeUtf8Internal(bytes);
		}
	},

	/**
	 * Encodes a bigint integer using CBOR.
	 * @param {bigint} n
	 * @returns {number[]}
	 */
	encodeInteger: (n) => {
		if (n >= 0n && n <= (2n << 63n) - 1n) {
			return Cbor.encodeHead(0, n);
		} else if (n >= (2n << 63n)) {
			return Cbor.encodeHead(6, 2n).concat(Cbor.encodeBytes(bigIntToBytes(n)));
		} else if (n <= -1n && n >= -(2n << 63n)) {
			return Cbor.encodeHead(1, -n - 1n);
		} else {
			return Cbor.encodeHead(6, 3n).concat(Cbor.encodeBytes(bigIntToBytes(-n - 1n)));
		}
	},

	/**
	 * Decodes a CBOR encoded bigint integer.
	 * @param {number[]} bytes
	 * @returns {bigint}
	 */
	decodeInteger: (bytes) => {
		const [m, n] = Cbor.decodeHead(bytes);

		if (m == 0) {
			return n;
		} else if (m == 1) {
			return -n - 1n;
		} else if (m == 6) {
			if (n == 2n) {
				const b = Cbor.decodeBytes(bytes);

				return bytesToBigInt(b);
			} else if (n == 3n) {
				const b = Cbor.decodeBytes(bytes);

				return -bytesToBigInt(b) - 1n;
			} else {
				throw new Error(`unexpected tag n:${n}`);
			}
		} else {
			throw new Error(`unexpected tag m:${m}`);
		}
	},

	/**
	 * @param {number[]} bytes
	 * @returns {boolean}
	 */
	isIndefList: (bytes) => {
		if (bytes.length == 0) {
			throw new Error("empty cbor bytes");
		}

		return 4*32 + 31 == bytes[0];
	},

	/**
	 * @internal
	 * @returns {number[]}
	 */
	encodeIndefListStart: () => {
		return Cbor.encodeIndefHead(4);
	},

	/**
	 * @internal
	 * @param {CborData[] | number[][]} list
	 * @returns {number[]}
	 */
	encodeListInternal: (list) => {
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
	},

	/**
	 * @internal
	 * @returns {number[]}
	 */
	encodeIndefListEnd: () => {
		return [255];
	},

	/**
	 * This follows the serialization format that the Haskell input-output-hk/plutus UPLC evaluator (i.e. empty lists use `encodeDefList`, non-empty lists use `encodeIndefList`).
	 * See [well-typed/cborg/serialise/src/Codec/Serialise/Class.hs](https://github.com/well-typed/cborg/blob/4bdc818a1f0b35f38bc118a87944630043b58384/serialise/src/Codec/Serialise/Class.hs#L181).
	 * @param {CborData[] | number[][]} list
	 * @returns {number[]}
	 */
	encodeList: (list) => {
		return list.length ? Cbor.encodeIndefList(list) : Cbor.encodeDefList(list);
	},

	/**
	 * Encodes a list of CBOR encodeable items using CBOR indefinite length encoding.
	 * @param {CborData[] | number[][]} list Each item is either already serialized, or a CborData instance with a toCbor() method.
	 * @returns {number[]}
	 */
	encodeIndefList: (list) => {
		return Cbor.encodeIndefListStart().concat(Cbor.encodeListInternal(list)).concat(Cbor.encodeIndefListEnd());
	},

	/**
	 * @param {number[]} bytes
	 * @returns {boolean}
	 */
	isDefList: (bytes) => {
		try {
			const [m, _] = Cbor.decodeHead(bytes.slice(0, 9));
			return m == 4;
		} catch (error) {
			if (error.message.includes("bad header")) return false;
			throw error;
		}
	},

	/**
	 * @param {bigint} n
	 * @returns {number[]}
	 */
	encodeDefListStart: (n) => {
		return Cbor.encodeHead(4, n);
	},

	/**
	 * Encodes a list of CBOR encodeable items using CBOR definite length encoding
	 * (i.e. header bytes of the element represent the length of the list).
	 * @param {CborData[] | number[][]} list Each item is either already serialized, or a CborData instance with a toCbor() method.
	 * @returns {number[]}
	 */
	encodeDefList: (list) => {
		return Cbor.encodeDefListStart(BigInt(list.length)).concat(Cbor.encodeListInternal(list));
	},

	/**
	 * @param {number[]} bytes
	 * @returns {boolean}
	 */
	isList: (bytes) => {
		return Cbor.isIndefList(bytes) || Cbor.isDefList(bytes);
	},

	/**
	 * Decodes a CBOR encoded list.
	 * A decoder function is called with the bytes of every contained item (nothing is returning directly).
	 * @param {number[]} bytes
	 * @param {Decoder} itemDecoder
	 */
	decodeList: (bytes, itemDecoder) => {
		if (Cbor.isIndefList(bytes)) {
			assert(Cbor.decodeIndefHead(bytes) == 4);

			let i = 0;
			while(bytes[0] != 255) {
				itemDecoder(i, bytes);
				i++;
			}

			assert(bytes.shift() == 255);
		} else {
			const [m, n] = Cbor.decodeHead(bytes);

			assert(m == 4);

			for (let i = 0; i < Number(n); i++) {
				itemDecoder(i, bytes);
			}
		}
	},

	/**
	 * @param {number[]} bytes
	 * @returns {boolean}
	 */
	isTuple: (bytes) => {
		return Cbor.isIndefList(bytes) || Cbor.isDefList(bytes);
	},

	/**
	 * @param {number[][]} tuple
	 * @returns {number[]}
	 */
	encodeTuple: (tuple) => {
		return Cbor.encodeDefList(tuple);
	},

	/**
	 * @param {number[]} bytes
	 * @param {Decoder} tupleDecoder
	 * @returns {number} - returns the size of the tuple
	 */
	decodeTuple: (bytes, tupleDecoder) => {
		let count = 0;

		Cbor.decodeList(bytes, (_, itemBytes) => {
			tupleDecoder(count, itemBytes);
			count++;
		});

		return count;
	},

	/**
	 * @param {number[]} bytes
	 * @returns {boolean}
	 */
	isMap: (bytes) => {
		const [m, _] = Cbor.decodeHead(bytes.slice(0, 9));

		return m == 5;
	},

	/**
	 * @internal
	 * @param {[CborData | number[], CborData | number[]][]} pairList
	 * @returns {number[]}
	 */
	encodeMapInternal: (pairList) => {
		/**
		 * @type {number[]}
		 */
		let res = [];

		for (let pair of pairList) {
			const key = pair[0];
			const value = pair[1];

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
	},

	/**
	 * Encodes a list of key-value pairs.
	 * @param {[CborData | number[], CborData | number[]][]} pairList  Each key and each value is either a CborData instance with a toCbor method defined, or an already encoded list of CBOR bytes.
	 * @returns {number[]}
	 */
	encodeMap: (pairList) => {
		return Cbor.encodeHead(5, BigInt(pairList.length)).concat(Cbor.encodeMapInternal(pairList));
	},

	/**
	 * Decodes a CBOR encoded map.
	 * Calls a decoder function for each key-value pair (nothing is returned directly).
	 * 
	 * The decoder function is responsible for separating the key from the value,
	 * which are simply stored as consecutive CBOR elements.
	 * @param {number[]} bytes
	 * @param {Decoder} pairDecoder
	 */
	decodeMap: (bytes, pairDecoder) => {
		const [m, n] = Cbor.decodeHead(bytes);

		assert(m == 5);

		for (let i = 0; i < n; i++) {
			pairDecoder(i, bytes);
		}
	},

	/**
	 * @param {number[]} bytes
	 * @returns {boolean}
	 */
	isObject: (bytes) => {
		return Cbor.isMap(bytes);
	},

	/**
	 * Encodes an object with optional fields.
	 * @param {Map<number, CborData | number[]>} object A `Map` with integer keys representing the field indices.
	 * @returns {number[]}
	 */
	encodeObject: (object) => {
		return Cbor.encodeMap(Array.from(object.entries()).map(pair => [
			Cbor.encodeInteger(BigInt(pair[0])),
			pair[1]
		]));
	},

	/**
	 * Decodes a CBOR encoded object. For each field a decoder is called which takes the field index and the field bytes as arguments.
	 * @param {number[]} bytes
	 * @param {Decoder} fieldDecoder
	 * @returns {Set<number>}
	 */
	decodeObject: (bytes, fieldDecoder) => {
		/** @type {Set<number>} */
		const done = new Set();

		Cbor.decodeMap(bytes, (_, pairBytes) => {
			let i = Number(Cbor.decodeInteger(pairBytes));

			fieldDecoder(i, pairBytes);

			done.add(i);
		});

		return done;
	},

	/**
	 * Unrelated to constructor
	 * @param {bigint} tag
	 * @returns {number[]}
	 */
	encodeTag: (tag) => {
		return Cbor.encodeHead(6, tag);
	},

	/**
	 * @param {number[]} bytes
	 * @returns {bigint}
	 */
	decodeTag: (bytes) => {
		const [m, n] = Cbor.decodeHead(bytes);

		assert(m == 6);

		return n;
	},

	/**
	 * @param {number[]} bytes
	 * @returns {boolean}
	 */
	isConstr: (bytes) => {
		if (bytes.length == 0) {
			throw new Error("empty cbor bytes");
		}

		const [m, _] = Cbor.decodeHead(bytes.slice(0, 9));

		return m == 6;
	},

	/**
	 * Encode a constructor tag of a ConstrData type
	 * @param {number} tag
	 * @returns {number[]}
	 */
	encodeConstrTag: (tag) => {
		if (tag >= 0 && tag <= 6) {
			return Cbor.encodeHead(6, 121n + BigInt(tag));
		} else if (tag >= 7 && tag <= 127) {
			return Cbor.encodeHead(6, 1280n + BigInt(tag - 7));
		} else {
			return Cbor.encodeHead(6, 102n).concat(Cbor.encodeHead(4, 2n)).concat(Cbor.encodeInteger(BigInt(tag)));
		}
	},

	/**
	 * @param {number} tag
	 * @param {CborData[] | number[][]} fields
	 * @returns {number[]}
	 */
	encodeConstr: (tag, fields) => {
		return Cbor.encodeConstrTag(tag).concat(Cbor.encodeList(fields));
	},

	/**
	 * @param {number[]} bytes
	 * @returns {number}
	 */
	decodeConstrTag: (bytes) => {
		// constr
		const [m, n] = Cbor.decodeHead(bytes);

		assert(m == 6);

		if (n < 127n) {
			return Number(n - 121n);
		} else if (n == 102n) {
			const [mCheck, nCheck] = Cbor.decodeHead(bytes);
			assert(mCheck == 4 && nCheck == 2n);

			return Number(Cbor.decodeInteger(bytes));
		} else {
			return Number(n - 1280n + 7n);
		}
	},

	/**
	 * Returns the tag
	 * @param {number[]} bytes
	 * @param {Decoder} fieldDecoder
	 * @returns {number}
	 */
	decodeConstr: (bytes, fieldDecoder) => {
		const tag = Cbor.decodeConstrTag(bytes);

		Cbor.decodeList(bytes, fieldDecoder);

		return tag;
	}
}
