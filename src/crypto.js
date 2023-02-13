//@ts-check
// Cryptography functions

/**
 * @typedef {import("./utils.js").NumberGenerator} NumberGenerator
 */

import { 
    BitReader,
    BitWriter,
    assert,
    bigIntToBytes,
    bytesToBigInt,
    imod8,
    padZeroes
} from "./utils.js";

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
export function setBlake2bDigestSize(s) {
    BLAKE2B_DIGEST_SIZE = s;
}

/**
 * Rfc 4648 base32 alphabet
 * @package
 * @type {string}
 */
const DEFAULT_BASE32_ALPHABET = "abcdefghijklmnopqrstuvwxyz234567";

/**
 * Bech32 base32 alphabet
 * @package
 * @type {string}
 */
const BECH32_BASE32_ALPHABET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
 
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
 *     ed25519 pubkey generation, signing, and signature verification (NOTE: the current implementation is very slow)
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
	static encodeBase32(bytes, alphabet = DEFAULT_BASE32_ALPHABET) {
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
	static decodeBase32(encoded, alphabet = DEFAULT_BASE32_ALPHABET) {
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

		return hrp + "1" + data.concat(chkSum).map(i => BECH32_BASE32_ALPHABET[i]).join("");
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

		const data = Crypto.decodeBase32(addr.slice(0, addr.length - 6), BECH32_BASE32_ALPHABET);

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
			const j = BECH32_BASE32_ALPHABET.indexOf(c);
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
	 * Calculates blake2-256 (32 bytes) hash of a list of uint8 numbers.
	 * Result is also a list of uint8 number.
	 * Blake2b is a 64bit algorithm, so we need to be careful when replicating 64-bit operations with 2 32-bit numbers (low-word overflow must spill into high-word, and shifts must go over low/high boundary)
	 * @example                                        
	 * bytesToHex(Crypto.blake2b([0, 1])) => "01cf79da4945c370c68b265ef70641aaa65eaa8f5953e3900d97724c2c5aa095"
	 * @example
	 * bytesToHex(Crypto.blake2b(textToBytes("abc"), 64)) => "ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d17d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923"
     * @package
	 * @param {number[]} bytes 
	 * @param {number} digestSize - 32 or 64
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

		// extract lowest BLAKE2B_DIGEST_SIZE (32 or 64) bytes from h

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