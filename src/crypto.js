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
    bigIntToLe32Bytes,
    imod8,
    leBytesToBigInt,
    padZeroes
} from "./utils.js";

/**
 * Size of default Blake2b digest
 * @internal
 */
var BLAKE2B_DIGEST_SIZE = 32; // bytes

/**
 * Changes the value of BLAKE2B_DIGEST_SIZE 
 *  (because the nodejs crypto module only supports 
 *   blake2b-512 and not blake2b-256, and we want to avoid non-standard dependencies in the 
 *   test-suite)
 * @internal
 * @param {number} s - 32 or 64
 */
export function setBlake2bDigestSize(s) {
    BLAKE2B_DIGEST_SIZE = s;
}

/**
 * Make sure resulting number fits in uint32
 * @internal
 * @param {number} x
 */
function imod32(x) {
    return x >>> 0;
}

/**
 * 32 bit number rotation
 * @internal
 * @param {number} x - originally uint32
 * @param {number} n
 * @returns {number} - originally uint32
 */
function irotr(x, n) {
    return imod32((x >>> n) | (x << (32 - n)));
}

/**
 * Positive modulo operator
 * @internal
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
 * @internal
 * @param {NumberGenerator} random 
 * @param {number} n 
 * @returns {number[]}
 */
export function randomBytes(random, n) {
    const key = [];

    for (let i = 0; i < n; i++) {
        key.push(Math.floor(random() * 256) % 256);
    }

    return key;
}

/**
 * TODO: switch to using UInt64Fast instead of UInt64 everywhere
 * First entry: high
 * Second entry: low
 * @typedef {[number, number]} UInt64Fast
 */

const UINT64_ZERO = [0, 0];

/**
 * 
 * @param {number[]} bytes 
 * @param {boolean} littleEndian 
 * @returns {UInt64Fast}
 */
function uint64FromBytes(bytes, littleEndian = true) {
    /** @type {number} */
    let low;

    /** @type {number} */
    let high;

    if (littleEndian) {
        low = (bytes[0] << 0) | (bytes[1] << 8) | (bytes[2] << 16) | (bytes[3] << 24);
        high = (bytes[4] << 0) | (bytes[5] << 8) | (bytes[6] << 16) | (bytes[7] << 24);
    } else {
        high = (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | (bytes[3] << 0);
        low = (bytes[4] << 24) | (bytes[5] << 16) | (bytes[6] << 8) | (bytes[7] << 0);
    }

    return [imod32(high), imod32(low)];
}

/**
 * @param {string} str
 * @returns {UInt64Fast}
 */
function uint64FromString(str) {
    const high = parseInt(str.slice(0, 8), 16);
    const low = parseInt(str.slice(8, 16), 16);

    return [imod32(high), imod32(low)];
}

/**
 * Returns [low[0], low[1], low[2], low[3], high[0], high[1], high[2], high[3]] if littleEndian==true
 * @internal
 * @param {UInt64Fast} uint64
 * @param {boolean} littleEndian
 * @returns {number[]}
 */
function uint64ToBytes([high, low], littleEndian = true) {
    const res = [
        (0x000000ff & low),
        (0x0000ff00 & low) >>> 8,
        (0x00ff0000 & low) >>> 16,
        (0xff000000 & low) >>> 24,
        (0x000000ff & high),
        (0x0000ff00 & high) >>> 8,
        (0x00ff0000 & high) >>> 16,
        (0xff000000 & high) >>> 24,
    ];

    if (!littleEndian) {
        res.reverse();
    }

    return res;
}

/**
 * @internal
 * @param {UInt64Fast} a
 * @param {UInt64Fast} b
 * @returns {boolean}
 */
function uint64Eq([ha, la], [hb, lb]) {
    return (ha == hb) && (la == lb);
}

/**
 * @internal
 * @param {UInt64Fast} uint64
 * @returns {UInt64Fast} 
 */
function uint64Not([high, low]) {
   return [imod32(~high), imod32(~low)];
}

/**
 * @internal
 * @param {UInt64Fast} a
 * @param {UInt64Fast} b
 * @returns {UInt64Fast}
 */
function uint64And([ha, la], [hb, lb]) {
    return [imod32(ha & hb), imod32(la & lb)];
}

/**
 * @internal
 * @param {UInt64Fast} a
 * @param {UInt64Fast} b
 * @returns {UInt64Fast}
 */
function uint64Xor([ha, la], [hb, lb]) {
    return [imod32(ha ^ hb), imod32(la ^ lb)];
}

/**
 * @internal
 * @param {UInt64Fast} a 
 * @param {UInt64Fast} b
 * @returns {UInt64Fast}
 */
function uint64Add([ha, la], [hb, lb]) {
    const low = la + lb;

    let high = ha + hb;

    if (low >= 0x100000000) {
        high += 1;
    }

    return [imod32(high), imod32(low)];
}

/**
 * @internal
 * @param {UInt64Fast} uint64
 * @param {number} n 
 * @returns {UInt64Fast}
 */
function uint64Rotr([high, low], n) {
    if (n == 32) {
        return [low, high];
    } else if (n > 32) {
        n -= 32;
        [high, low] = [low, high];
    }

    return [
        imod32((high >>> n) | (low << (32 - n))),
        imod32((low >>> n) | (high << (32 - n)))
    ];
}

/**
 * @internal
 * @param {UInt64Fast} uint64
 * @param {number} n
 * @returns {UInt64Fast}
 */
function uint64Shiftr([high, low], n) {
    if (n >= 32) {
        return [
            0, 
            imod32(high >>> n - 32)
        ];
    } else {
        return [
            imod32(high >>> n), 
            imod32((low >>> n) | (high << (32 - n)))
        ];
    }
}

/**
 * UInt64 number (represented by 2 UInt32 numbers)
 * @internal
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
     * @internal
     * @returns {UInt64}
     */
    static zero() {
        return new UInt64(0, 0);
    }

    /**
     * @internal
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
            low = (bytes[0] << 0) | (bytes[1] << 8) | (bytes[2] << 16) | (bytes[3] << 24);
            high = (bytes[4] << 0) | (bytes[5] << 8) | (bytes[6] << 16) | (bytes[7] << 24);
        } else {
            high = (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | (bytes[3] << 0);
            low = (bytes[4] << 24) | (bytes[5] << 16) | (bytes[6] << 8) | (bytes[7] << 0);
        }

        return new UInt64(imod32(high), imod32(low));
    }

    /**
     * @internal
     * @param {string} str 
     * @returns {UInt64}
     */
    static fromString(str) {
        const high = parseInt(str.slice(0, 8), 16);
        const low = parseInt(str.slice(8, 16), 16);

        return new UInt64(high, low);
    }

    /**
     * @internal
     * @type {number}
     */
    get high() {
        return this.#high;
    }

    /**
     * @internal
     * @type {number}
     */
    get low() {
        return this.#low;
    }

    /**
     * Returns [low[0], low[1], low[2], low[3], high[0], high[1], high[2], high[3]] if littleEndian==true
     * @internal
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
     * @internal
     * @param {UInt64} other 
     * @returns {boolean}
     */
    eq(other) {
        return (this.#high == other.#high) && (this.#low == other.#low);
    }

    /**
     * @internal
     * @returns {UInt64} 
     */
    not() {
        return new UInt64(~this.#high, ~this.#low);
    }

    /**
     * @internal
     * @param {UInt64} other
     * @returns {UInt64}
     */
    and(other) {
        return new UInt64(this.#high & other.#high, this.#low & other.#low);
    }

    /**
     * @internal
     * @param {UInt64} other 
     * @returns {UInt64}
     */
    xor(other) {
        return new UInt64(this.#high ^ other.#high, this.#low ^ other.#low);
    }

    /**
     * @internal
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
     * @internal
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
                imod32((this.#high >>> n) | (this.#low << (32 - n))),
                imod32((this.#low >>> n) | (this.#high << (32 - n)))
            );
        }
    }

    /**
     * @internal
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
 * @internal
 * @param {number[]} bytes 
 * @returns {number[]} - list of numbers between 0 and 32
 */
function encodeBase32Bytes(bytes) {
    const result = [];

    const reader = new BitReader(bytes, false);

    while (!reader.eof()) {
        result.push(reader.readBits(5));
    }

    return result;
}

/**
 * Expand human readable prefix of the bech32 encoding so it can be used in the checkSum.
 * @internal
 * @param {string} hrp
 * @returns {number[]}
 */
function expandBech32HumanReadablePart(hrp) {
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
 * Generate the bech32 checksum.
 * @internal
 * @param {string} hrp 
 * @param {number[]} data - numbers between 0 and 32
 * @returns {number[]} - 6 numbers between 0 and 32
 */
function calcBech32Checksum(hrp, data) {
    const bytes = expandBech32HumanReadablePart(hrp).concat(data);

    const chk = calcBech32Polymod(bytes.concat([0, 0, 0, 0, 0, 0])) ^ 1;

    const chkSum = [];
    for (let i = 0; i < 6; i++) {
        chkSum.push((chk >> 5 * (5 - i)) & 31);
    }

    return chkSum;
}


/**
 * Used as part of the bech32 checksum.
 * @internal
 * @param {number[]} bytes 
 * @returns {number}
 */
function calcBech32Polymod(bytes) {
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
 * Don't use this directly, use Crypto.hmacSha2_256 or Crypto.hmacSha2_512 instead
 * @internal
 * @param {(x: number[]) => number[]} algorithm 
 * @param {number} b - blockSize of algorithm
 * @param {number[]} key 
 * @param {number[]} message 
 * @returns {number[]}
 */
function hmac(algorithm, b, key, message) {
    if (key.length > b) {
        key = algorithm(key);
    } else {
        key = key.slice();
    }

    while (key.length < b) {
        key.push(0x00);
    }

    const iPadded = key.map(k => (k ^ 0x36));
    const oPadded = key.map(k => (k ^ 0x5c));

    return algorithm(oPadded.concat(algorithm(iPadded.concat(message))));
}

/**
 * Rfc 4648 base32 alphabet
 * @type {string}
 */
const DEFAULT_BASE32_ALPHABET = "abcdefghijklmnopqrstuvwxyz234567";

/**
 * Bech32 base32 alphabet
 * @type {string}
 */
const BECH32_BASE32_ALPHABET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
/**
 * The Helios `Crypto` namespace contains a collection of cryptography primitives.
 * 
 * These functions have been implemented as part of the Helios library in order to avoid external dependencies
 * (there still isn't a standardized Javascript [Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto) that provides all the needed functionality).
 * @namespace
 */
export const Crypto = {
    /**
     * A simple pseudo-random number generator for use in tests that requires some randomness but need to be deterministic
     * (i.e. each test run gives the same result).
     * @param {number} seed
     * @returns {NumberGenerator} The returned function returns a new random number between 0 and 1 upon each call.
     */
    mulberry32: (seed) => {
        /**
         * @type {NumberGenerator}
         */
        return function () {
            let t = seed += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        }
    },

    /**
     * Alias for `mulberry32`.
     * @param {number} seed
     * @returns {NumberGenerator} The returned function returns a new random number between 0 and 1 upon each call.
     */
    rand: (seed) => {
        return Crypto.mulberry32(seed);
    },

    /**
     * Encodes bytes in using Base32.
     * @example
     * Crypto.encodeBase32(textToBytes("f")) == "my"
     * @example
     * Crypto.encodeBase32(textToBytes("fo")) == "mzxq"
     * @example
     * Crypto.encodeBase32(textToBytes("foo")) == "mzxw6"
     * @example
     * Crypto.encodeBase32(textToBytes("foob")) == "mzxw6yq"
     * @example
     * Crypto.encodeBase32(textToBytes("fooba")) == "mzxw6ytb"
     * @example
     * Crypto.encodeBase32(textToBytes("foobar")) == "mzxw6ytboi"
     * @param {number[]} bytes list of uint8 numbers
     * @param {string} alphabet list of chars, defaults to "abcdefghijklmnopqrstuvwxyz234567"
     * @return {string}
     */
    encodeBase32: (bytes, alphabet = DEFAULT_BASE32_ALPHABET) => {
        return encodeBase32Bytes(bytes).map(c => alphabet[c]).join("");
    },

    /**
     * Decodes a Base32 string into bytes.
     * @example
     * bytesToText(Crypto.decodeBase32("my")) == "f"
     * @example
     * bytesToText(Crypto.decodeBase32("mzxq")) == "fo"
     * @example
     * bytesToText(Crypto.decodeBase32("mzxw6")) == "foo"
     * @example
     * bytesToText(Crypto.decodeBase32("mzxw6yq")) == "foob"
     * @example
     * bytesToText(Crypto.decodeBase32("mzxw6ytb")) == "fooba"
     * @example
     * bytesToText(Crypto.decodeBase32("mzxw6ytboi")) == "foobar"
     * @param {string} encoded 
     * @param {string} alphabet list of chars, defaults to "abcdefghijklmnopqrstuvwxyz234567"
     * @return {number[]}
     */
    decodeBase32: (encoded, alphabet = DEFAULT_BASE32_ALPHABET) => {
        const writer = new BitWriter();

        const n = encoded.length;

        for (let i = 0; i < n; i++) {
            const c = encoded[i];
            const code = alphabet.indexOf(c.toLowerCase());

            if (i == n - 1) {
                // last, make sure we align to byte

                const nCut = n * 5 - 8 * Math.floor(n * 5 / 8);

                const bits = padZeroes(code.toString(2), 5)

                writer.write(bits.slice(0, 5 - nCut));
            } else {
                const bits = padZeroes(code.toString(2), 5);

                writer.write(bits);
            }
        }

        const result = writer.finalize(false);

        return result;
    },

    /**
     * Creates a Bech32 checksummed string (eg. used to represent Cardano addresses).
     * @example
     * Crypto.encodeBech32("foo", textToBytes("foobar")) == "foo1vehk7cnpwgry9h96"
     * @example
     * Crypto.encodeBech32("addr_test", hexToBytes("70a9508f015cfbcffc3d88ac4c1c934b5b82d2bb281d464672f6c49539")) == "addr_test1wz54prcptnaullpa3zkyc8ynfddc954m9qw5v3nj7mzf2wggs2uld"
     * @param {string} hrp  human-readable part (eg. "addr")
     * @param {number[]} data a list of uint8 bytes
     * @returns {string}
     */
    encodeBech32: (hrp, data) => {
        assert(hrp.length > 0, "human-readable-part must have non-zero length");

        data = encodeBase32Bytes(data);

        const chkSum = calcBech32Checksum(hrp, data);

        return hrp + "1" + data.concat(chkSum).map(i => BECH32_BASE32_ALPHABET[i]).join("");
    },

    /**
     * Decomposes a Bech32 checksummed string (eg. a Cardano address), and returns the human readable part and the original bytes
     * Throws an error if checksum is invalid.
     * @example
     * bytesToHex(Crypto.decodeBech32("addr_test1wz54prcptnaullpa3zkyc8ynfddc954m9qw5v3nj7mzf2wggs2uld")[1]) == "70a9508f015cfbcffc3d88ac4c1c934b5b82d2bb281d464672f6c49539"
     * @param {string} addr 
     * @returns {[string, number[]]} First part is the human-readable part, second part is a list containing the underlying bytes.
     */
    decodeBech32: (addr) => {
        assert(Crypto.verifyBech32(addr), "invalid bech32 addr");

        const i = addr.indexOf("1");

        assert(i != -1);

        const hrp = addr.slice(0, i);

        addr = addr.slice(i + 1);

        const data = Crypto.decodeBase32(addr.slice(0, addr.length - 6), BECH32_BASE32_ALPHABET);

        return [hrp, data];
    },

    /**
     * Verifies a Bech32 checksum.
     * @example
     * Crypto.verifyBech32("foo1vehk7cnpwgry9h96") == true
     * @example
     * Crypto.verifyBech32("foo1vehk7cnpwgry9h97") == false
     * @example
     * Crypto.verifyBech32("a12uel5l") == true
     * @example
     * Crypto.verifyBech32("mm1crxm3i") == false
     * @example
     * Crypto.verifyBech32("A1G7SGD8") == false
     * @example
     * Crypto.verifyBech32("abcdef1qpzry9x8gf2tvdw0s3jn54khce6mua7lmqqqxw") == true
     * @example
     * Crypto.verifyBech32("?1ezyfcl") == true
     * @example
     * Crypto.verifyBech32("addr_test1wz54prcptnaullpa3zkyc8ynfddc954m9qw5v3nj7mzf2wggs2uld") == true
     * @param {string} encoded
     * @returns {boolean}
     */
    verifyBech32: (encoded) => {
        const data = [];

        const i = encoded.indexOf("1");

        if (i == -1 || i == 0) {
            return false;
        }

        const hrp = encoded.slice(0, i);

        encoded = encoded.slice(i + 1);

        for (let c of encoded) {
            const j = BECH32_BASE32_ALPHABET.indexOf(c);
            if (j == -1) {
                return false;
            }

            data.push(j);
        }

        const chkSumA = data.slice(data.length - 6);

        const chkSumB = calcBech32Checksum(hrp, data.slice(0, data.length - 6));

        for (let j = 0; j < 6; j++) {
            if (chkSumA[j] != chkSumB[j]) {
                return false;
            }
        }

        return true;
    },

    /**
     * Calculates sha2-256 (32bytes) hash of a list of bytes.
     * Result is also a list of bytes.
     * @example 
     * bytesToHex(Crypto.sha2_256([0x61, 0x62, 0x63])) == "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
     * @example
     * Crypto.sha2_256(textToBytes("Hello, World!")) == [223, 253, 96, 33, 187, 43, 213, 176, 175, 103, 98, 144, 128, 158, 195, 165, 49, 145, 221, 129, 199, 247, 10, 75, 40, 104, 138, 54, 33, 130, 152, 111]
     * @param {number[]} bytes List of uint8 numbers
     * @returns {number[]} List of uint8 numbers.
     */
    sha2_256: (bytes) => {
        /**
         * Pad a bytearray so its size is a multiple of 64 (512 bits).
         * Internal method.
         * @param {number[]} src - list of uint8 numbers
         * @returns {number[]}
         */
        function pad(src) {
            const nBits = src.length * 8;

            let dst = src.slice();

            dst.push(0x80);

            if ((dst.length + 8) % 64 != 0) {
                let nZeroes = (64 - dst.length % 64) - 8;
                if (nZeroes < 0) {
                    nZeroes += 64;
                }

                for (let i = 0; i < nZeroes; i++) {
                    dst.push(0);
                }
            }

            assert((dst.length + 8) % 64 == 0, "bad padding");

            const lengthPadding = bigIntToBytes(BigInt(nBits));

            assert(lengthPadding.length <= 8, "input data too big");

            while (lengthPadding.length < 8) {
                lengthPadding.unshift(0)
            }

            dst = dst.concat(lengthPadding);

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
                w[i] = (chunk[i * 4 + 0] << 24) |
                    (chunk[i * 4 + 1] << 16) |
                    (chunk[i * 4 + 2] << 8) |
                    (chunk[i * 4 + 3]);
            }

            // extends the first 16 positions into the remaining 48 positions
            for (let i = 16; i < 64; i++) {
                w[i] = imod32(w[i - 16] + sigma0(w[i - 15]) + w[i - 7] + sigma1(w[i - 2]));
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
            result.push(imod8(item >> 8));
            result.push(imod8(item >> 0));
        }

        return result;
    },

    /**
     * Calculates sha2-512 (64bytes) hash of a list of uint8 numbers.
     * Result is also a list of uint8 number.
     * @example 
     * bytesToHex(Crypto.sha2_512([0x61, 0x62, 0x63])) == "ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f"
     * @example 
     * bytesToHex(Crypto.sha2_512([])) == "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e"
     * @example
     * bytesToHex(Crypto.sha2_512(textToBytes("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"))) == "204a8fc6dda82f0a0ced7beb8e08a41657c16ef468b228a8279be331a703c33596fd15c13b1b07f9aa1d3bea57789ca031ad85c7a71dd70354ec631238ca3445"
     * @example
     * bytesToHex(Crypto.sha2_512(textToBytes("abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstuu"))) == "23565d109ac0e2aa9fb162385178895058b28489a6bc31cb55491ed83956851ab1d4bbd46440586f5c9c4b69c9c280118cbc55c71495d258cc27cc6bb25ee720"
     * @param {number[]} bytes List of uint8 numbers
     * @returns {number[]} List of uint8 numbers.
     */
    sha2_512: (bytes) => {
        /**
         * Pad a bytearray so its size is a multiple of 128 (1024 bits).
         * Internal method.
         * @param {number[]} src - list of uint8 numbers
         * @returns {number[]}
         */
        function pad(src) {
            const nBits = src.length * 8;

            let dst = src.slice();

            dst.push(0x80);

            if ((dst.length + 16) % 128 != 0) {
                let nZeroes = (128 - dst.length % 128) - 16;
                if (nZeroes < 0) {
                    nZeroes += 128;
                }

                for (let i = 0; i < nZeroes; i++) {
                    dst.push(0);
                }
            }

            assert((dst.length + 16) % 128 == 0, "bad padding");

            // assume nBits fits in 32 bits
            const lengthPadding = bigIntToBytes(BigInt(nBits));

            assert(lengthPadding.length <= 16, "input data too big");

            while (lengthPadding.length < 16) {
                lengthPadding.unshift(0);
            }

            dst = dst.concat(lengthPadding);

            assert(dst.length % 128 == 0, "bad length padding");

            return dst;
        }

        /**
         * @type {UInt64Fast[]} - 80 uint64 numbers
         */
        const k = [
            [0x428a2f98, 0xd728ae22], [0x71374491, 0x23ef65cd],
            [0xb5c0fbcf, 0xec4d3b2f], [0xe9b5dba5, 0x8189dbbc],
            [0x3956c25b, 0xf348b538], [0x59f111f1, 0xb605d019],
            [0x923f82a4, 0xaf194f9b], [0xab1c5ed5, 0xda6d8118],
            [0xd807aa98, 0xa3030242], [0x12835b01, 0x45706fbe],
            [0x243185be, 0x4ee4b28c], [0x550c7dc3, 0xd5ffb4e2],
            [0x72be5d74, 0xf27b896f], [0x80deb1fe, 0x3b1696b1],
            [0x9bdc06a7, 0x25c71235], [0xc19bf174, 0xcf692694],
            [0xe49b69c1, 0x9ef14ad2], [0xefbe4786, 0x384f25e3],
            [0x0fc19dc6, 0x8b8cd5b5], [0x240ca1cc, 0x77ac9c65],
            [0x2de92c6f, 0x592b0275], [0x4a7484aa, 0x6ea6e483],
            [0x5cb0a9dc, 0xbd41fbd4], [0x76f988da, 0x831153b5],
            [0x983e5152, 0xee66dfab], [0xa831c66d, 0x2db43210],
            [0xb00327c8, 0x98fb213f], [0xbf597fc7, 0xbeef0ee4],
            [0xc6e00bf3, 0x3da88fc2], [0xd5a79147, 0x930aa725],
            [0x06ca6351, 0xe003826f], [0x14292967, 0x0a0e6e70],
            [0x27b70a85, 0x46d22ffc], [0x2e1b2138, 0x5c26c926],
            [0x4d2c6dfc, 0x5ac42aed], [0x53380d13, 0x9d95b3df],
            [0x650a7354, 0x8baf63de], [0x766a0abb, 0x3c77b2a8],
            [0x81c2c92e, 0x47edaee6], [0x92722c85, 0x1482353b],
            [0xa2bfe8a1, 0x4cf10364], [0xa81a664b, 0xbc423001],
            [0xc24b8b70, 0xd0f89791], [0xc76c51a3, 0x0654be30],
            [0xd192e819, 0xd6ef5218], [0xd6990624, 0x5565a910],
            [0xf40e3585, 0x5771202a], [0x106aa070, 0x32bbd1b8],
            [0x19a4c116, 0xb8d2d0c8], [0x1e376c08, 0x5141ab53],
            [0x2748774c, 0xdf8eeb99], [0x34b0bcb5, 0xe19b48a8],
            [0x391c0cb3, 0xc5c95a63], [0x4ed8aa4a, 0xe3418acb],
            [0x5b9cca4f, 0x7763e373], [0x682e6ff3, 0xd6b2b8a3],
            [0x748f82ee, 0x5defb2fc], [0x78a5636f, 0x43172f60],
            [0x84c87814, 0xa1f0ab72], [0x8cc70208, 0x1a6439ec],
            [0x90befffa, 0x23631e28], [0xa4506ceb, 0xde82bde9],
            [0xbef9a3f7, 0xb2c67915], [0xc67178f2, 0xe372532b],
            [0xca273ece, 0xea26619c], [0xd186b8c7, 0x21c0c207],
            [0xeada7dd6, 0xcde0eb1e], [0xf57d4f7f, 0xee6ed178],
            [0x06f067aa, 0x72176fba], [0x0a637dc5, 0xa2c898a6],
            [0x113f9804, 0xbef90dae], [0x1b710b35, 0x131c471b],
            [0x28db77f5, 0x23047d84], [0x32caab7b, 0x40c72493],
            [0x3c9ebe0a, 0x15c9bebc], [0x431d67c4, 0x9c100d4c],
            [0x4cc5d4be, 0xcb3e42b6], [0x597f299c, 0xfc657e2a],
            [0x5fcb6fab, 0x3ad6faec], [0x6c44198c, 0x4a475817],
        ];

        /**
         * Initial hash (updated during compression phase)
         * @type {UInt64Fast[]} - 8 uint64 numbers
         */
        const hash = [
            [0x6a09e667, 0xf3bcc908],
            [0xbb67ae85, 0x84caa73b],
            [0x3c6ef372, 0xfe94f82b],
            [0xa54ff53a, 0x5f1d36f1],
            [0x510e527f, 0xade682d1],
            [0x9b05688c, 0x2b3e6c1f],
            [0x1f83d9ab, 0xfb41bd6b],
            [0x5be0cd19, 0x137e2179],
        ];

        /**
         * @param {UInt64Fast} x
         * @returns {UInt64Fast} 
         */
        function sigma0(x) {
            //return x.rotr(1).xor(x.rotr(8)).xor(x.shiftr(7));

            return uint64Xor(
                uint64Xor(
                    uint64Rotr(x, 1),
                    uint64Rotr(x, 8)
                ),
                uint64Shiftr(x, 7)
            );
        }

        /**
         * @param {UInt64Fast} x
         * @returns {UInt64Fast}
         */
        function sigma1(x) {
            //return x.rotr(19).xor(x.rotr(61)).xor(x.shiftr(6));

            return uint64Xor(
                uint64Xor(
                    uint64Rotr(x, 19),
                    uint64Rotr(x, 61)
                ),
                uint64Shiftr(x, 6)
            );
        }

        bytes = pad(bytes);

        // break message in successive 64 byte chunks
        for (let chunkStart = 0; chunkStart < bytes.length; chunkStart += 128) {
            const chunk = bytes.slice(chunkStart, chunkStart + 128);

            /**
             * @type {UInt64Fast[]}
             */
            const w = (new Array(80)).fill(UINT64_ZERO); // array of 32 bit numbers!

            // copy chunk into first 16 hi/lo positions of w (i.e. into first 32 uint32 positions)
            for (let i = 0; i < 16; i++) {
                w[i] = uint64FromBytes(chunk.slice(i * 8, i * 8 + 8), false);
            }

            // extends the first 16 positions into the remaining 80 positions
            for (let i = 16; i < 80; i++) {
                //w[i] = sigma1(w[i - 2]).add(w[i - 7]).add(sigma0(w[i - 15])).add(w[i - 16]);

                w[i] = uint64Add(
                    uint64Add(
                        uint64Add(
                            sigma1(w[i - 2]),
                            w[i - 7]
                        ),
                        sigma0(w[i - 15])
                    ),
                    w[i - 16]
                );
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
                //const S1 = e.rotr(14).xor(e.rotr(18)).xor(e.rotr(41));

                const S1 = uint64Xor(
                    uint64Xor(
                        uint64Rotr(e, 14),
                        uint64Rotr(e, 18)
                    ),
                    uint64Rotr(e, 41)
                );

                //const ch = e.and(f).xor(e.not().and(g));

                const ch = uint64Xor(
                    uint64And(
                        e,
                        f
                    ),
                    uint64And(
                        uint64Not(e),
                        g
                    )
                );

                //const temp1 = h.add(S1).add(ch).add(k[i]).add(w[i]);

                const temp1 = uint64Add(
                    uint64Add(
                        uint64Add(
                            uint64Add(
                                h, 
                                S1
                            ),
                            ch
                        ),
                        k[i]
                    ),
                    w[i]
                );  

                //const S0 = a.rotr(28).xor(a.rotr(34)).xor(a.rotr(39));

                const S0 = uint64Xor(
                    uint64Xor(
                        uint64Rotr(a, 28),
                        uint64Rotr(a, 34)
                    ),
                    uint64Rotr(a, 39)
                );

                //const maj = a.and(b).xor(a.and(c)).xor(b.and(c));

                const maj = uint64Xor(
                    uint64Xor(
                        uint64And(a, b),
                        uint64And(a, c)
                    ),
                    uint64And(b, c)
                );

                //const temp2 = S0.add(maj);

                const temp2 = uint64Add(S0, maj);

                h = g;
                g = f;
                f = e;

                //e = d.add(temp1);
                e = uint64Add(d, temp1);
                d = c;
                c = b;
                b = a;

                //a = temp1.add(temp2);
                a = uint64Add(temp1, temp2);
            }

            // update the hash
            hash[0] = uint64Add(hash[0], a);
            hash[1] = uint64Add(hash[1], b);
            hash[2] = uint64Add(hash[2], c);
            hash[3] = uint64Add(hash[3], d);
            hash[4] = uint64Add(hash[4], e);
            hash[5] = uint64Add(hash[5], f);
            hash[6] = uint64Add(hash[6], g);
            hash[7] = uint64Add(hash[7], h);
        }

        // produce the final digest of uint8 numbers
        let result = [];
        for (let i = 0; i < 8; i++) {
            const item = hash[i];

            result = result.concat(uint64ToBytes(item, false));
        }

        return result;
    },

    /**
     * Calculates sha3-256 (32bytes) hash of a list of uint8 numbers.
     * Result is also a list of uint8 number.
     * @example
     * bytesToHex(Crypto.sha3(textToBytes("abc"))) == "3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532"
     * @example
     * bytesToHex(Crypto.sha3((new Array(136)).fill(1))) == "b36dc2167c4d9dda1a58b87046c8d76a6359afe3612c4de8a38857e09117b2db"
     * @example
     * bytesToHex(Crypto.sha3((new Array(135)).fill(2))) == "5bdf5d815d29a9d7161c66520efc17c2edd7898f2b99a029e8d2e4ff153407f4"
     * @example
     * bytesToHex(Crypto.sha3((new Array(134)).fill(3))) == "8e6575663dfb75a88f94a32c5b363c410278b65020734560d968aadd6896a621"
     * @example
     * bytesToHex(Crypto.sha3((new Array(137)).fill(4))) == "f10b39c3e455006aa42120b9751faa0f35c821211c9d086beb28bf3c4134c6c6"
     * @param {number[]} bytes List of uint8 numbers
     * @returns {number[]} List of uint8 numbers.
     */
    sha3: (bytes) => {
        /**
         * Sha3 uses only bit-wise operations, so 64-bit operations can easily be replicated using 2 32-bit operations instead.
         */

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
            let nZeroes = RATE - 2 - (dst.length % RATE);
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

            assert(dst.length % RATE == 0);

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
            new UInt64(0x00000000, 0x00000001),
            new UInt64(0x00000000, 0x00008082),
            new UInt64(0x80000000, 0x0000808a),
            new UInt64(0x80000000, 0x80008000),
            new UInt64(0x00000000, 0x0000808b),
            new UInt64(0x00000000, 0x80000001),
            new UInt64(0x80000000, 0x80008081),
            new UInt64(0x80000000, 0x00008009),
            new UInt64(0x00000000, 0x0000008a),
            new UInt64(0x00000000, 0x00000088),
            new UInt64(0x00000000, 0x80008009),
            new UInt64(0x00000000, 0x8000000a),
            new UInt64(0x00000000, 0x8000808b),
            new UInt64(0x80000000, 0x0000008b),
            new UInt64(0x80000000, 0x00008089),
            new UInt64(0x80000000, 0x00008003),
            new UInt64(0x80000000, 0x00008002),
            new UInt64(0x80000000, 0x00000080),
            new UInt64(0x00000000, 0x0000800a),
            new UInt64(0x80000000, 0x8000000a),
            new UInt64(0x80000000, 0x80008081),
            new UInt64(0x80000000, 0x00008080),
            new UInt64(0x00000000, 0x80000001),
            new UInt64(0x80000000, 0x80008008),
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
                    c[i] = s[i].xor(s[i + 5]).xor(s[i + 10]).xor(s[i + 15]).xor(s[i + 20]);
                }

                for (let i = 0; i < 5; i++) {
                    const i1 = (i + 1) % 5;
                    const i2 = (i + 4) % 5;

                    const tmp = c[i2].xor(c[i1].rotr(63));

                    for (let j = 0; j < 5; j++) {
                        s[i + 5 * j] = s[i + 5 * j].xor(tmp);
                    }
                }

                b[0] = s[0];

                for (let i = 1; i < 25; i++) {
                    const offset = OFFSETS[i - 1];

                    const left = Math.abs(SHIFTS[i - 1]);
                    const right = 32 - left;

                    if (SHIFTS[i - 1] < 0) {
                        b[i] = s[offset].rotr(right);
                    } else {
                        b[i] = s[offset].rotr(right + 32);
                    }
                }

                for (let i = 0; i < 5; i++) {
                    for (let j = 0; j < 5; j++) {
                        s[i * 5 + j] = b[i * 5 + j].xor(b[i * 5 + (j + 1) % 5].not().and(b[i * 5 + (j + 2) % 5]))
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
        const state = (new Array(WIDTH / 8)).fill(UInt64.zero());

        for (let chunkStart = 0; chunkStart < bytes.length; chunkStart += RATE) {
            // extend the chunk to become length WIDTH
            const chunk = bytes.slice(chunkStart, chunkStart + RATE).concat((new Array(CAP)).fill(0));

            // element-wise xor with 'state'
            for (let i = 0; i < WIDTH; i += 8) {
                state[i / 8] = state[i / 8].xor(UInt64.fromBytes(chunk.slice(i, i + 8)));

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
    },

    /**
     * Calculates blake2b hash of a list of uint8 numbers (variable digest size).
     * Result is also a list of uint8 numbers.
     * @example                                        
     * bytesToHex(Crypto.blake2b([0, 1])) == "01cf79da4945c370c68b265ef70641aaa65eaa8f5953e3900d97724c2c5aa095"
     * @example
     * bytesToHex(Crypto.blake2b(textToBytes("abc"), 64)) == "ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d17d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923"
     * @param {number[]} bytes 
     * @param {number} digestSize Defaults to 32. Can't be greater than 64.
     * @returns {number[]} List of uint8 numbers.
     */
    blake2b: (bytes, digestSize = BLAKE2B_DIGEST_SIZE) => {
        /**
         * Blake2b is a 64bit algorithm, so we need to be careful when replicating 64-bit operations with 2 32-bit numbers
         * (low-word overflow must spill into high-word, and shifts must go over low/high boundary).
         */

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

            const nZeroes = dst.length == 0 ? WIDTH : (WIDTH - dst.length % WIDTH) % WIDTH;

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
                const s = SIGMA[round % 10];

                for (let i = 0; i < 4; i++) {
                    mix(v, chunk, i, i + 4, i + 8, i + 12, s[i * 2], s[i * 2 + 1]);
                }

                for (let i = 0; i < 4; i++) {
                    mix(v, chunk, i, (i + 1) % 4 + 4, (i + 2) % 4 + 8, (i + 3) % 4 + 12, s[8 + i * 2], s[8 + i * 2 + 1]);
                }
            }

            for (let i = 0; i < 8; i++) {
                h[i] = h[i].xor(v[i].xor(v[i + 8]));
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
                paramBlockView.getUint32(i * 8 + 4, true),
                paramBlockView.getUint32(i * 8, true),
            ));
        }

        // loop all chunks
        for (let chunkStart = 0; chunkStart < bytes.length; chunkStart += WIDTH) {
            const chunkEnd = chunkStart + WIDTH; // exclusive
            const chunk = bytes.slice(chunkStart, chunkStart + WIDTH);

            const chunk64 = new Array(WIDTH / 8);
            for (let i = 0; i < WIDTH; i += 8) {
                chunk64[i / 8] = UInt64.fromBytes(chunk.slice(i, i + 8));
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
        for (let i = 0; i < digestSize / 8; i++) {
            hash = hash.concat(h[i].toBytes());
        }

        return hash.slice(0, digestSize);
    },

    /**
     * Hmac using sha2-256.
     * @example
     * bytesToHex(Crypto.hmacSha2_256(textToBytes("key"), textToBytes("The quick brown fox jumps over the lazy dog"))) == "f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8"
     * @param {number[]} key 
     * @param {number[]} message 
     * @returns {number[]}
     */
    hmacSha2_256: (key, message) => {
        return hmac((x) => Crypto.sha2_256(x), 64, key, message);
    },

    /**
     * Hmac using sha2-512.
     * @example
     * bytesToHex(Crypto.hmacSha2_512(textToBytes("key"), textToBytes("The quick brown fox jumps over the lazy dog"))) == "b42af09057bac1e2d41708e48a902e09b5ff7f12ab428a4fe86653c73dd248fb82f948a549f7b791a5b41915ee4d1ec3935357e4e2317250d0372afa2ebeeb3a"
     * @param {number[]} key 
     * @param {number[]} message 
     * @returns {number[]}
     */
    hmacSha2_512: (key, message) => {
        return hmac((x) => Crypto.sha2_512(x), 128, key, message);
    },

    /**
     * Password-Based Key Derivation Function 2.
     * @example
     * bytesToHex(Crypto.pbkdf2(Crypto.hmacSha2_256, textToBytes("password"), textToBytes("salt"), 1, 20)) == "120fb6cffcf8b32c43e7225256c4f837a86548c9"
     * @example
     * bytesToHex(Crypto.pbkdf2(Crypto.hmacSha2_512, textToBytes("password"), textToBytes("salt"), 2, 20)) == "e1d9c16aa681708a45f5c7c4e215ceb66e011a2e"
     * @param {(key: number[], msg: number[]) => number[]} prf 
     * @param {number[]} password 
     * @param {number[]} salt 
     * @param {number} iters
     * @param {number} dkLength 
     * @returns {number[]}
     */
    pbkdf2: (prf, password, salt, iters, dkLength) => {
        /**
         * @param {number[]} a 
         * @param {number[]} b 
         * @returns {number[]}
         */
        const xor = (a, b) => {
            const c = new Array(a.length);

            for (let i = 0; i < a.length; i++) {
                c[i] = a[i] ^ b[i];
            }

            return c;
        }

        /**
         * @type {number[]}
         */
        let dk = [];

        let i = 1n;
        while (dk.length < dkLength) {
            const bi = bigIntToBytes(i);
            while (bi.length < 4) {
                bi.unshift(0);
            }

            let U = prf(password, salt.slice().concat(bi));
            let T = U;

            for (let j = 1; j < iters; j++) {
                U = prf(password, U);
                T = xor(T, U);
            }

            dk = dk.concat(T);

            i += 1n;
        }

        if (dk.length > dkLength) {
            dk = dk.slice(0, dkLength);
        }

        return dk;
    }
}


/**
 * @template {CurvePoint<T>} T
 * @typedef {{
 *   add(other: T): T
 *   mul(scalar: bigint): T
 *   equals(other: T): boolean
 *   encode(): number[]
 * }} CurvePoint
 */

const ED25519_Q = 57896044618658097711785492504343953926634992332820282019728792003956564819949n; // ipowi(255n) - 19n
const ED25519_Q38 = 7237005577332262213973186563042994240829374041602535252466099000494570602494n; // (Q + 3n)/8n
const ED25519_CURVE_ORDER = 7237005577332262213973186563042994240857116359379907606001950938285454250989n; // ipow2(252n) + 27742317777372353535851937790883648493n;
const ED25519_D = -4513249062541557337682894930092624173785641285191125241628941591882900924598840740n; // -121665n * invert(121666n);
const ED25519_I = 19681161376707505956807079304988542015446066515923890162744021073123829784752n; // expMod(2n, (Q - 1n)/4n, Q);

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
        let t = expMod(b, e / 2n, m);
        t = (t * t) % m;

        if ((e % 2n) != 0n) {
            t = posMod(t * b, m)
        }

        return t;
    }
}

/**
* @param {bigint} x 
* @returns {bigint}
*/
function curveMod(x) {
    return posMod(x, ED25519_Q)
}

/**
* @param {bigint} n 
* @returns {bigint}
*/
function curveInvert(n) {
    let a = curveMod(n);
    let b = ED25519_Q;

    let x = 0n;
    let y = 1n;
    let u = 1n;
    let v = 0n;

    while (a !== 0n) {
        const q = b / a;
        const r = b % a;
        const m = x - u * q;
        const n = y - v * q;
        b = a;
        a = r;
        x = u;
        y = v;
        u = m;
        v = n;
    }

    return curveMod(x);
}

/**
* @param {bigint} y 
* @returns {bigint}
*/
function recoverX(y) {
    const yy = y * y;
    const xx = (yy - 1n) * curveInvert(ED25519_D * yy + 1n);
    let x = expMod(xx, ED25519_Q38, ED25519_Q);

    if (((x * x - xx) % ED25519_Q) != 0n) {
        x = (x * ED25519_I) % ED25519_Q;
    }

    if ((x % 2n) != 0n) {
        x = ED25519_Q - x;
    }

    return x;
}

/**
* Curve point 'multiplication'
* @param {bigint} y 
* @returns {number[]}
*/
function encodeCurveInt(y) {
    return bigIntToLe32Bytes(y);
}

/**
* @param {number[]} s 
* @returns {bigint}
*/
function decodeCurveInt(s) {
    return leBytesToBigInt(s);
}

/**
* @param {number[]} bytes 
* @param {number} i - bit index
* @returns {number} - 0 or 1
*/
function getBit(bytes, i) {
    return (bytes[Math.floor(i / 8)] >> i % 8) & 1
}

/**
 * @internal
 * @implements {CurvePoint<AffinePoint>}
 */
class AffinePoint {
    #x;
    #y;

    /**
     * @param {bigint} x 
     * @param {bigint} y 
     */
    constructor(x, y) {
        this.#x = x;
        this.#y = y;
    }

    /**
     * @type {AffinePoint}
     */
    static get BASE() {
        return new AffinePoint(
            15112221349535400772501151409588531511454012693041857206046113283949847762202n, // recoverX(B[1]) % Q
            46316835694926478169428394003475163141307993866256225615783033603165251855960n  // (4n*invert(5n)) % Q
        );
    }

    /**
     * @type {AffinePoint}
     */
    static get ZERO() {
        return new AffinePoint(0n, 1n);
    }

    /**
     * @param {number[]} bytes 
     * @returns {AffinePoint}
     */
    static decode(bytes) {
        assert(bytes.length == 32);

        const tmp = bytes.slice();
        tmp[31] = tmp[31] & 0b01111111;

        const y = decodeCurveInt(tmp);

        let x = recoverX(y);
        if (Number(x & 1n) != getBit(bytes, 255)) {
            x = ED25519_Q - x;
        }

        const point = new AffinePoint(x, y);

        assert(point.isOnCurve(), "point isn't on curve");

        return point;
    }

    /**
     * @type {bigint}
     */
    get x() {
        return this.#x;
    }

    /**
     * @type {bigint}
     */
    get y() {
        return this.#y;
    }

    /** 
     * Curve point 'addition'
     * Note: the invert call in this calculation is very slow (prefer ExtendedPoint for speed)
     * @param {AffinePoint} other 
     * @returns {AffinePoint}
     */
    add(other) {
        const x1 = this.#x;
        const y1 = this.#y;
        const x2 = other.#x;
        const y2 = other.#y;
        const dxxyy = ED25519_D * x1 * x2 * y1 * y2;
        const x3 = (x1 * y2 + x2 * y1) * curveInvert(1n + dxxyy);
        const y3 = (y1 * y2 + x1 * x2) * curveInvert(1n - dxxyy);

        return new AffinePoint(
            curveMod(x3),
            curveMod(y3)
        );
    }

    /**
     * @param {AffinePoint} other 
     * @returns {boolean}
     */
    equals(other) {
        return this.x == other.x && this.y == other.y;
    }

    /**
     * @returns {boolean}
     */
    isOnCurve() {
        const x = this.#x;
        const y = this.#y;
        const xx = x * x;
        const yy = y * y;
        return (-xx + yy - 1n - ED25519_D * xx * yy) % ED25519_Q == 0n;
    }

    /**
     * @param {bigint} s 
     * @returns {AffinePoint}
     */
    mul(s) {
        if (s == 0n) {
            return AffinePoint.ZERO;
        } else {
            let sum = this.mul(s / 2n);

            sum = sum.add(sum);

            if ((s % 2n) != 0n) {
                sum = sum.add(this);
            }

            return sum;
        }
    }

    /**
     * @returns {number[]}
     */
    encode() {
        const bytes = encodeCurveInt(this.#y);

        // last bit is determined by x

        bytes[31] = (bytes[31] & 0b011111111) | (Number(this.#x & 1n) * 0b10000000);

        return bytes;
    }
}

/**
 * Extended point implementation take from @noble/ed25519
 * @internal
 * @implements {CurvePoint<ExtendedPoint>}
 */
class ExtendedPoint {
    #x;
    #y;
    #z;
    #t;

    /**
     * @param {bigint} x 
     * @param {bigint} y 
     * @param {bigint} z 
     * @param {bigint} t 
     */
    constructor(x, y, z, t) {
        this.#x = x;
        this.#y = y;
        this.#z = z;
        this.#t = t;
    }

    /**
     * @type {ExtendedPoint}
     */
    static get BASE() {
        return new ExtendedPoint(
            AffinePoint.BASE.x,
            AffinePoint.BASE.y,
            1n,
            curveMod(AffinePoint.BASE.x * AffinePoint.BASE.y)
        )
    }

    /**
     * @type {ExtendedPoint}
     */
    static get ZERO() {
        return new ExtendedPoint(0n, 1n, 1n, 0n);
    }

    /**
     * @param {number[]} bytes 
     * @returns {ExtendedPoint}
     */
    static decode(bytes) {
        return ExtendedPoint.fromAffine(AffinePoint.decode(bytes));
    }

    /**
     * @param {AffinePoint} affine 
     * @returns {ExtendedPoint}
     */
    static fromAffine(affine) {
        return new ExtendedPoint(affine.x, affine.y, 1n, curveMod(affine.x * affine.y));
    }

    /**
     * @param {ExtendedPoint} other 
     * @returns {ExtendedPoint}
     */
    add(other) {
        const x1 = this.#x;
        const y1 = this.#y;
        const z1 = this.#z;
        const t1 = this.#t;

        const x2 = other.#x;
        const y2 = other.#y;
        const z2 = other.#z;
        const t2 = other.#t;

        const a = curveMod(x1 * x2);
        const b = curveMod(y1 * y2);
        const c = curveMod(ED25519_D * t1 * t2);
        const d = curveMod(z1 * z2);
        const e = curveMod((x1 + y1) * (x2 + y2) - a - b);
        const f = curveMod(d - c);
        const g = curveMod(d + c);
        const h = curveMod(a + b);
        const x3 = curveMod(e * f);
        const y3 = curveMod(g * h);
        const z3 = curveMod(f * g);
        const t3 = curveMod(e * h);

        return new ExtendedPoint(x3, y3, z3, t3);
    }

    /**
     * @returns {number[]}
     */
    encode() {
        return this.toAffine().encode()
    }

    /**
     * @param {ExtendedPoint} other 
     * @returns {boolean}
     */
    equals(other) {
        return (curveMod(this.#x * other.#z) == curveMod(other.#x * this.#z)) && (curveMod(this.#y * other.#z) == curveMod(other.#y * this.#z));
    }

    /**
     * @returns {boolean}
     */
    isBase() {
        return this.equals(ExtendedPoint.BASE);
    }

    /**
     * @returns {boolean}
     */
    isZero() {
        return this.equals(ExtendedPoint.ZERO);
    }

    /**
     * @param {bigint} s 
     * @returns {ExtendedPoint}
     */
    mul(s) {
        if (s == 0n) {
            return ExtendedPoint.ZERO;
        } else {
            let sum = this.mul(s / 2n);

            sum = sum.add(sum);

            if ((s % 2n) != 0n) {
                sum = sum.add(this);
            }

            return sum;
        }
    }

    /**
     * @returns {AffinePoint}
     */
    toAffine() {
        if (this.isZero()) {
            return AffinePoint.ZERO;
        } else {
            const zInverse = curveInvert(this.#z);

            return new AffinePoint(
                curveMod(this.#x * zInverse),
                curveMod(this.#y * zInverse)
            );
        }
    }
}

/**
 * @internal
 * @param {number[]} h 
 * @returns {bigint}
 */
function clamp(h) {
    const bytes = h.slice(0, 32);

    bytes[0] &= 0b11111000;
    bytes[31] &= 0b00111111;
    bytes[31] |= 0b01000000;

    return decodeCurveInt(bytes);
}

/**
 * @internal
 * @param {number[]} m 
 * @returns {bigint}
 */
function nonce(m) {
    const h = Crypto.sha2_512(m);

    return decodeCurveInt(h);
}

/**
 * @internal
 */
const CurvePointImpl = ExtendedPoint;

/**
 * The elliptic curve signature algorithm used by Cardano wallets.
 * 
 * Ported from: [https://ed25519.cr.yp.to/python/ed25519.py](https://ed25519.cr.yp.to/python/ed25519.py).
 * 
 * ExtendedPoint implementation taken from: [https://github.com/paulmillr/noble-ed25519](https://github.com/paulmillr/noble-ed25519).
 * @namespace
 */
export const Ed25519 = {
    /**
     * Similar to `Ed25519.derivePublicKey`, but doesn't hash the input key.
     * @param {number[]} extendedKey
     * @returns {number[]} 32 byte public key.
     */
    deriveBip32PublicKey: (extendedKey) => {
        const a = clamp(extendedKey);
        const A = CurvePointImpl.BASE.mul(a);

        return A.encode();
    },

    /**
     * Derive a public key from a private key.
     * The private key can be any number of bytes (it's hashed internally).
     * The returned public key is 32 bytes long.
     * @param {number[]} privateKey
     * @returns {number[]} 32 byte public key.
     */
    derivePublicKey: (privateKey) => {
        return Ed25519.deriveBip32PublicKey(Crypto.sha2_512(privateKey));
    },

    /**
     * Like `Ed25519.sign`, but doesn't hash the input key.
     * @param {number[]} message 
     * @param {number[]} extendedKey 
     * @returns {number[]} 64 byte signature.
     */
    signBip32: (message, extendedKey) => {
        const a = clamp(extendedKey);

        // for convenience calculate publicKey here:
        const publicKey = CurvePointImpl.BASE.mul(a).encode();

        const r = nonce(extendedKey.slice(32, 64).concat(message));
        const R = CurvePointImpl.BASE.mul(r);
        const Rencoded = R.encode();
        const ih = nonce(Rencoded.concat(publicKey).concat(message));
        const S = posMod(r + ih * a, ED25519_CURVE_ORDER);

        return Rencoded.concat(encodeCurveInt(S));
    },

    /**
     * Creates a 64 byte signature.
     * @param {number[]} message 
     * @param {number[]} privateKey 
     * @returns {number[]} 64 byte signature.
     */
    sign: (message, privateKey) => {
        return Ed25519.signBip32(message, Crypto.sha2_512(privateKey));
    },

    /**
     * Returns `true` if the signature is correct.
     * @param {number[]} signature 
     * @param {number[]} message 
     * @param {number[]} publicKey 
     * @returns {boolean}
     */
    verify: (signature, message, publicKey) => {
        if (signature.length != 64) {
            throw new Error(`unexpected signature length ${signature.length}`);
        }

        if (publicKey.length != 32) {
            throw new Error(`unexpected publickey length ${publicKey.length}`);
        }

        const R = CurvePointImpl.decode(signature.slice(0, 32));
        const A = CurvePointImpl.decode(publicKey);
        const S = decodeCurveInt(signature.slice(32, 64));
        const h = nonce(signature.slice(0, 32).concat(publicKey).concat(message));

        const left = CurvePointImpl.BASE.mul(S);
        const right = R.add(A.mul(h));

        return left.equals(right);
    }
}

/**
 * Standard English Bip39 dictionary consisting of 2048 words allowing wallet root keys to be formed by a phrase of 12, 15, 18, 21 or 24 of these words.
 */
export const BIP39_DICT_EN = [
    "abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract", "absurd", "abuse", "access", "accident", "account", "accuse", "achieve", "acid", "acoustic", "acquire", "across", "act", "action", "actor", "actress", "actual", "adapt", "add", "addict", "address", "adjust", "admit", "adult", "advance", "advice", "aerobic", "affair", "afford", "afraid", "again", "age", "agent", "agree", "ahead", "aim", "air", "airport", "aisle", "alarm", "album", "alcohol", "alert", "alien", "all", "alley", "allow", "almost", "alone", "alpha", "already", "also", "alter", "always", "amateur", "amazing", "among", "amount", "amused", "analyst", "anchor", "ancient", "anger", "angle", "angry", "animal", "ankle", "announce", "annual", "another", "answer", "antenna", "antique", "anxiety", "any", "apart", "apology", "appear", "apple", "approve", "april", "arch", "arctic", "area", "arena", "argue", "arm", "armed", "armor", "army", "around", "arrange", "arrest", "arrive", "arrow", "art", "artefact", "artist", "artwork", "ask", "aspect", "assault", "asset", "assist", "assume", "asthma", "athlete", "atom", "attack", "attend", "attitude", "attract", "auction", "audit", "august", "aunt", "author", "auto", "autumn", "average", "avocado", "avoid", "awake", "aware", "away", "awesome", "awful", "awkward", "axis",
    "baby", "bachelor", "bacon", "badge", "bag", "balance", "balcony", "ball", "bamboo", "banana", "banner", "bar", "barely", "bargain", "barrel", "base", "basic", "basket", "battle", "beach", "bean", "beauty", "because", "become", "beef", "before", "begin", "behave", "behind", "believe", "below", "belt", "bench", "benefit", "best", "betray", "better", "between", "beyond", "bicycle", "bid", "bike", "bind", "biology", "bird", "birth", "bitter", "black", "blade", "blame", "blanket", "blast", "bleak", "bless", "blind", "blood", "blossom", "blouse", "blue", "blur", "blush", "board", "boat", "body", "boil", "bomb", "bone", "bonus", "book", "boost", "border", "boring", "borrow", "boss", "bottom", "bounce", "box", "boy", "bracket", "brain", "brand", "brass", "brave", "bread", "breeze", "brick", "bridge", "brief", "bright", "bring", "brisk", "broccoli", "broken", "bronze", "broom", "brother", "brown", "brush", "bubble", "buddy", "budget", "buffalo", "build", "bulb", "bulk", "bullet", "bundle", "bunker", "burden", "burger", "burst", "bus", "business", "busy", "butter", "buyer", "buzz",
    "cabbage", "cabin", "cable", "cactus", "cage", "cake", "call", "calm", "camera", "camp", "can", "canal", "cancel", "candy", "cannon", "canoe", "canvas", "canyon", "capable", "capital", "captain", "car", "carbon", "card", "cargo", "carpet", "carry", "cart", "case", "cash", "casino", "castle", "casual", "cat", "catalog", "catch", "category", "cattle", "caught", "cause", "caution", "cave", "ceiling", "celery", "cement", "census", "century", "cereal", "certain", "chair", "chalk", "champion", "change", "chaos", "chapter", "charge", "chase", "chat", "cheap", "check", "cheese", "chef", "cherry", "chest", "chicken", "chief", "child", "chimney", "choice", "choose", "chronic", "chuckle", "chunk", "churn", "cigar", "cinnamon", "circle", "citizen", "city", "civil", "claim", "clap", "clarify", "claw", "clay", "clean", "clerk", "clever", "click", "client", "cliff", "climb", "clinic", "clip", "clock", "clog", "close", "cloth", "cloud", "clown", "club", "clump", "cluster", "clutch", "coach", "coast", "coconut", "code", "coffee", "coil", "coin", "collect", "color", "column", "combine", "come", "comfort", "comic", "common", "company", "concert", "conduct", "confirm", "congress", "connect", "consider", "control", "convince", "cook", "cool", "copper", "copy", "coral", "core", "corn", "correct", "cost", "cotton", "couch", "country", "couple", "course", "cousin", "cover", "coyote", "crack", "cradle", "craft", "cram", "crane", "crash", "crater", "crawl", "crazy", "cream", "credit", "creek", "crew", "cricket", "crime", "crisp", "critic", "crop", "cross", "crouch", "crowd", "crucial", "cruel", "cruise", "crumble", "crunch", "crush", "cry", "crystal", "cube", "culture", "cup", "cupboard", "curious", "current", "curtain", "curve", "cushion", "custom", "cute", "cycle",
    "dad", "damage", "damp", "dance", "danger", "daring", "dash", "daughter", "dawn", "day", "deal", "debate", "debris", "decade", "december", "decide", "decline", "decorate", "decrease", "deer", "defense", "define", "defy", "degree", "delay", "deliver", "demand", "demise", "denial", "dentist", "deny", "depart", "depend", "deposit", "depth", "deputy", "derive", "describe", "desert", "design", "desk", "despair", "destroy", "detail", "detect", "develop", "device", "devote", "diagram", "dial", "diamond", "diary", "dice", "diesel", "diet", "differ", "digital", "dignity", "dilemma", "dinner", "dinosaur", "direct", "dirt", "disagree", "discover", "disease", "dish", "dismiss", "disorder", "display", "distance", "divert", "divide", "divorce", "dizzy", "doctor", "document", "dog", "doll", "dolphin", "domain", "donate", "donkey", "donor", "door", "dose", "double", "dove", "draft", "dragon", "drama", "drastic", "draw", "dream", "dress", "drift", "drill", "drink", "drip", "drive", "drop", "drum", "dry", "duck", "dumb", "dune", "during", "dust", "dutch", "duty", "dwarf", "dynamic",
    "eager", "eagle", "early", "earn", "earth", "easily", "east", "easy", "echo", "ecology", "economy", "edge", "edit", "educate", "effort", "egg", "eight", "either", "elbow", "elder", "electric", "elegant", "element", "elephant", "elevator", "elite", "else", "embark", "embody", "embrace", "emerge", "emotion", "employ", "empower", "empty", "enable", "enact", "end", "endless", "endorse", "enemy", "energy", "enforce", "engage", "engine", "enhance", "enjoy", "enlist", "enough", "enrich", "enroll", "ensure", "enter", "entire", "entry", "envelope", "episode", "equal", "equip", "era", "erase", "erode", "erosion", "error", "erupt", "escape", "essay", "essence", "estate", "eternal", "ethics", "evidence", "evil", "evoke", "evolve", "exact", "example", "excess", "exchange", "excite", "exclude", "excuse", "execute", "exercise", "exhaust", "exhibit", "exile", "exist", "exit", "exotic", "expand", "expect", "expire", "explain", "expose", "express", "extend", "extra", "eye", "eyebrow",
    "fabric", "face", "faculty", "fade", "faint", "faith", "fall", "false", "fame", "family", "famous", "fan", "fancy", "fantasy", "farm", "fashion", "fat", "fatal", "father", "fatigue", "fault", "favorite", "feature", "february", "federal", "fee", "feed", "feel", "female", "fence", "festival", "fetch", "fever", "few", "fiber", "fiction", "field", "figure", "file", "film", "filter", "final", "find", "fine", "finger", "finish", "fire", "firm", "first", "fiscal", "fish", "fit", "fitness", "fix", "flag", "flame", "flash", "flat", "flavor", "flee", "flight", "flip", "float", "flock", "floor", "flower", "fluid", "flush", "fly", "foam", "focus", "fog", "foil", "fold", "follow", "food", "foot", "force", "forest", "forget", "fork", "fortune", "forum", "forward", "fossil", "foster", "found", "fox", "fragile", "frame", "frequent", "fresh", "friend", "fringe", "frog", "front", "frost", "frown", "frozen", "fruit", "fuel", "fun", "funny", "furnace", "fury", "future",
    "gadget", "gain", "galaxy", "gallery", "game", "gap", "garage", "garbage", "garden", "garlic", "garment", "gas", "gasp", "gate", "gather", "gauge", "gaze", "general", "genius", "genre", "gentle", "genuine", "gesture", "ghost", "giant", "gift", "giggle", "ginger", "giraffe", "girl", "give", "glad", "glance", "glare", "glass", "glide", "glimpse", "globe", "gloom", "glory", "glove", "glow", "glue", "goat", "goddess", "gold", "good", "goose", "gorilla", "gospel", "gossip", "govern", "gown", "grab", "grace", "grain", "grant", "grape", "grass", "gravity", "great", "green", "grid", "grief", "grit", "grocery", "group", "grow", "grunt", "guard", "guess", "guide", "guilt", "guitar", "gun", "gym",
    "habit", "hair", "half", "hammer", "hamster", "hand", "happy", "harbor", "hard", "harsh", "harvest", "hat", "have", "hawk", "hazard", "head", "health", "heart", "heavy", "hedgehog", "height", "hello", "helmet", "help", "hen", "hero", "hidden", "high", "hill", "hint", "hip", "hire", "history", "hobby", "hockey", "hold", "hole", "holiday", "hollow", "home", "honey", "hood", "hope", "horn", "horror", "horse", "hospital", "host", "hotel", "hour", "hover", "hub", "huge", "human", "humble", "humor", "hundred", "hungry", "hunt", "hurdle", "hurry", "hurt", "husband", "hybrid",
    "ice", "icon", "idea", "identify", "idle", "ignore", "ill", "illegal", "illness", "image", "imitate", "immense", "immune", "impact", "impose", "improve", "impulse", "inch", "include", "income", "increase", "index", "indicate", "indoor", "industry", "infant", "inflict", "inform", "inhale", "inherit", "initial", "inject", "injury", "inmate", "inner", "innocent", "input", "inquiry", "insane", "insect", "inside", "inspire", "install", "intact", "interest", "into", "invest", "invite", "involve", "iron", "island", "isolate", "issue", "item", "ivory",
    "jacket", "jaguar", "jar", "jazz", "jealous", "jeans", "jelly", "jewel", "job", "join", "joke", "journey", "joy", "judge", "juice", "jump", "jungle", "junior", "junk", "just",
    "kangaroo", "keen", "keep", "ketchup", "key", "kick", "kid", "kidney", "kind", "kingdom", "kiss", "kit", "kitchen", "kite", "kitten", "kiwi", "knee", "knife", "knock", "know",
    "lab", "label", "labor", "ladder", "lady", "lake", "lamp", "language", "laptop", "large", "later", "latin", "laugh", "laundry", "lava", "law", "lawn", "lawsuit", "layer", "lazy", "leader", "leaf", "learn", "leave", "lecture", "left", "leg", "legal", "legend", "leisure", "lemon", "lend", "length", "lens", "leopard", "lesson", "letter", "level", "liar", "liberty", "library", "license", "life", "lift", "light", "like", "limb", "limit", "link", "lion", "liquid", "list", "little", "live", "lizard", "load", "loan", "lobster", "local", "lock", "logic", "lonely", "long", "loop", "lottery", "loud", "lounge", "love", "loyal", "lucky", "luggage", "lumber", "lunar", "lunch", "luxury", "lyrics",
    "machine", "mad", "magic", "magnet", "maid", "mail", "main", "major", "make", "mammal", "man", "manage", "mandate", "mango", "mansion", "manual", "maple", "marble", "march", "margin", "marine", "market", "marriage", "mask", "mass", "master", "match", "material", "math", "matrix", "matter", "maximum", "maze", "meadow", "mean", "measure", "meat", "mechanic", "medal", "media", "melody", "melt", "member", "memory", "mention", "menu", "mercy", "merge", "merit", "merry", "mesh", "message", "metal", "method", "middle", "midnight", "milk", "million", "mimic", "mind", "minimum", "minor", "minute", "miracle", "mirror", "misery", "miss", "mistake", "mix", "mixed", "mixture", "mobile", "model", "modify", "mom", "moment", "monitor", "monkey", "monster", "month", "moon", "moral", "more", "morning", "mosquito", "mother", "motion", "motor", "mountain", "mouse", "move", "movie", "much", "muffin", "mule", "multiply", "muscle", "museum", "mushroom", "music", "must", "mutual", "myself", "mystery", "myth",
    "naive", "name", "napkin", "narrow", "nasty", "nation", "nature", "near", "neck", "need", "negative", "neglect", "neither", "nephew", "nerve", "nest", "net", "network", "neutral", "never", "news", "next", "nice", "night", "noble", "noise", "nominee", "noodle", "normal", "north", "nose", "notable", "note", "nothing", "notice", "novel", "now", "nuclear", "number", "nurse", "nut",
    "oak", "obey", "object", "oblige", "obscure", "observe", "obtain", "obvious", "occur", "ocean", "october", "odor", "off", "offer", "office", "often", "oil", "okay", "old", "olive", "olympic", "omit", "once", "one", "onion", "online", "only", "open", "opera", "opinion", "oppose", "option", "orange", "orbit", "orchard", "order", "ordinary", "organ", "orient", "original", "orphan", "ostrich", "other", "outdoor", "outer", "output", "outside", "oval", "oven", "over", "own", "owner", "oxygen", "oyster", "ozone",
    "pact", "paddle", "page", "pair", "palace", "palm", "panda", "panel", "panic", "panther", "paper", "parade", "parent", "park", "parrot", "party", "pass", "patch", "path", "patient", "patrol", "pattern", "pause", "pave", "payment", "peace", "peanut", "pear", "peasant", "pelican", "pen", "penalty", "pencil", "people", "pepper", "perfect", "permit", "person", "pet", "phone", "photo", "phrase", "physical", "piano", "picnic", "picture", "piece", "pig", "pigeon", "pill", "pilot", "pink", "pioneer", "pipe", "pistol", "pitch", "pizza", "place", "planet", "plastic", "plate", "play", "please", "pledge", "pluck", "plug", "plunge", "poem", "poet", "point", "polar", "pole", "police", "pond", "pony", "pool", "popular", "portion", "position", "possible", "post", "potato", "pottery", "poverty", "powder", "power", "practice", "praise", "predict", "prefer", "prepare", "present", "pretty", "prevent", "price", "pride", "primary", "print", "priority", "prison", "private", "prize", "problem", "process", "produce", "profit", "program", "project", "promote", "proof", "property", "prosper", "protect", "proud", "provide", "public", "pudding", "pull", "pulp", "pulse", "pumpkin", "punch", "pupil", "puppy", "purchase", "purity", "purpose", "purse", "push", "put", "puzzle", "pyramid",
    "quality", "quantum", "quarter", "question", "quick", "quit", "quiz", "quote",
    "rabbit", "raccoon", "race", "rack", "radar", "radio", "rail", "rain", "raise", "rally", "ramp", "ranch", "random", "range", "rapid", "rare", "rate", "rather", "raven", "raw", "razor", "ready", "real", "reason", "rebel", "rebuild", "recall", "receive", "recipe", "record", "recycle", "reduce", "reflect", "reform", "refuse", "region", "regret", "regular", "reject", "relax", "release", "relief", "rely", "remain", "remember", "remind", "remove", "render", "renew", "rent", "reopen", "repair", "repeat", "replace", "report", "require", "rescue", "resemble", "resist", "resource", "response", "result", "retire", "retreat", "return", "reunion", "reveal", "review", "reward", "rhythm", "rib", "ribbon", "rice", "rich", "ride", "ridge", "rifle", "right", "rigid", "ring", "riot", "ripple", "risk", "ritual", "rival", "river", "road", "roast", "robot", "robust", "rocket", "romance", "roof", "rookie", "room", "rose", "rotate", "rough", "round", "route", "royal", "rubber", "rude", "rug", "rule", "run", "runway", "rural",
    "sad", "saddle", "sadness", "safe", "sail", "salad", "salmon", "salon", "salt", "salute", "same", "sample", "sand", "satisfy", "satoshi", "sauce", "sausage", "save", "say", "scale", "scan", "scare", "scatter", "scene", "scheme", "school", "science", "scissors", "scorpion", "scout", "scrap", "screen", "script", "scrub", "sea", "search", "season", "seat", "second", "secret", "section", "security", "seed", "seek", "segment", "select", "sell", "seminar", "senior", "sense", "sentence", "series", "service", "session", "settle", "setup", "seven", "shadow", "shaft", "shallow", "share", "shed", "shell", "sheriff", "shield", "shift", "shine", "ship", "shiver", "shock", "shoe", "shoot", "shop", "short", "shoulder", "shove", "shrimp", "shrug", "shuffle", "shy", "sibling", "sick", "side", "siege", "sight", "sign", "silent", "silk", "silly", "silver", "similar", "simple", "since", "sing", "siren", "sister", "situate", "six", "size", "skate", "sketch", "ski", "skill", "skin", "skirt", "skull", "slab", "slam", "sleep", "slender", "slice", "slide", "slight", "slim", "slogan", "slot", "slow", "slush", "small", "smart", "smile", "smoke", "smooth", "snack", "snake", "snap", "sniff", "snow", "soap", "soccer", "social", "sock", "soda", "soft", "solar", "soldier", "solid", "solution", "solve", "someone", "song", "soon", "sorry", "sort", "soul", "sound", "soup", "source", "south", "space", "spare", "spatial", "spawn", "speak", "special", "speed", "spell", "spend", "sphere", "spice", "spider", "spike", "spin", "spirit", "split", "spoil", "sponsor", "spoon", "sport", "spot", "spray", "spread", "spring", "spy", "square", "squeeze", "squirrel", "stable", "stadium", "staff", "stage", "stairs", "stamp", "stand", "start", "state", "stay", "steak", "steel", "stem", "step", "stereo", "stick", "still", "sting", "stock", "stomach", "stone", "stool", "story", "stove", "strategy", "street", "strike", "strong", "struggle", "student", "stuff", "stumble", "style", "subject", "submit", "subway", "success", "such", "sudden", "suffer", "sugar", "suggest", "suit", "summer", "sun", "sunny", "sunset", "super", "supply", "supreme", "sure", "surface", "surge", "surprise", "surround", "survey", "suspect", "sustain", "swallow", "swamp", "swap", "swarm", "swear", "sweet", "swift", "swim", "swing", "switch", "sword", "symbol", "symptom", "syrup", "system",
    "table", "tackle", "tag", "tail", "talent", "talk", "tank", "tape", "target", "task", "taste", "tattoo", "taxi", "teach", "team", "tell", "ten", "tenant", "tennis", "tent", "term", "test", "text", "thank", "that", "theme", "then", "theory", "there", "they", "thing", "this", "thought", "three", "thrive", "throw", "thumb", "thunder", "ticket", "tide", "tiger", "tilt", "timber", "time", "tiny", "tip", "tired", "tissue", "title", "toast", "tobacco", "today", "toddler", "toe", "together", "toilet", "token", "tomato", "tomorrow", "tone", "tongue", "tonight", "tool", "tooth", "top", "topic", "topple", "torch", "tornado", "tortoise", "toss", "total", "tourist", "toward", "tower", "town", "toy", "track", "trade", "traffic", "tragic", "train", "transfer", "trap", "trash", "travel", "tray", "treat", "tree", "trend", "trial", "tribe", "trick", "trigger", "trim", "trip", "trophy", "trouble", "truck", "true", "truly", "trumpet", "trust", "truth", "try", "tube", "tuition", "tumble", "tuna", "tunnel", "turkey", "turn", "turtle", "twelve", "twenty", "twice", "twin", "twist", "two", "type", "typical",
    "ugly", "umbrella", "unable", "unaware", "uncle", "uncover", "under", "undo", "unfair", "unfold", "unhappy", "uniform", "unique", "unit", "universe", "unknown", "unlock", "until", "unusual", "unveil", "update", "upgrade", "uphold", "upon", "upper", "upset", "urban", "urge", "usage", "use", "used", "useful", "useless", "usual", "utility",
    "vacant", "vacuum", "vague", "valid", "valley", "valve", "van", "vanish", "vapor", "various", "vast", "vault", "vehicle", "velvet", "vendor", "venture", "venue", "verb", "verify", "version", "very", "vessel", "veteran", "viable", "vibrant", "vicious", "victory", "video", "view", "village", "vintage", "violin", "virtual", "virus", "visa", "visit", "visual", "vital", "vivid", "vocal", "voice", "void", "volcano", "volume", "vote", "voyage",
    "wage", "wagon", "wait", "walk", "wall", "walnut", "want", "warfare", "warm", "warrior", "wash", "wasp", "waste", "water", "wave", "way", "wealth", "weapon", "wear", "weasel", "weather", "web", "wedding", "weekend", "weird", "welcome", "west", "wet", "whale", "what", "wheat", "wheel", "when", "where", "whip", "whisper", "wide", "width", "wife", "wild", "will", "win", "window", "wine", "wing", "wink", "winner", "winter", "wire", "wisdom", "wise", "wish", "witness", "wolf", "woman", "wonder", "wood", "wool", "word", "work", "world", "worry", "worth", "wrap", "wreck", "wrestle", "wrist", "write", "wrong",
    "yard", "year", "yellow", "you", "young", "youth",
    "zebra", "zero", "zone", "zoo"
];
