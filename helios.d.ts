/**
 * Converts a hexadecimal representation of bytes into an actual list of uint8 bytes.
 * @example
 * hexToBytes("00ff34") => [0, 255, 52]
 * @param {string} hex
 * @returns {number[]}
 */
export function hexToBytes(hex: string): number[];
/**
 * Converts a list of uint8 bytes into its hexadecimal string representation.
 * @example
 * bytesToHex([0, 255, 52]) => "00ff34"
 * @param {number[]} bytes
 * @returns {string}
 */
export function bytesToHex(bytes: number[]): string;
/**
 * Encodes a string into a list of uint8 bytes using UTF-8 encoding.
 * @example
 * textToBytes("hello world") => [104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]
 * @param {string} str
 * @returns {number[]}
 */
export function textToBytes(str: string): number[];
/**
 * Decodes a list of uint8 bytes into a string using UTF-8 encoding.
 * @example
 * bytesToText([104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]) => "hello world"
 * @param {number[]} bytes
 * @returns {string}
 */
export function bytesToText(bytes: number[]): string;
/**
 * A tag function for a helios source.
 * Is just a marker so IDE support can work on literal helios sources inside javascript/typescript files.
 * @example
 * hl`hello ${"world"}!` => "hello world!"
 * @param {string[]} a
 * @param  {...any} b
 * @returns {string}
 */
export function hl(a: string[], ...b: any[]): string;
/**
 * Dynamically constructs a new List class, depending on the item type.
 * @template {HeliosData} T
 * @param {HeliosDataClass<T>} ItemClass
 * @returns {HeliosDataClass<List_>}
 */
export function List<T extends HeliosData>(ItemClass: HeliosDataClass<T>): HeliosDataClass<{
    /**
     * @type {T[]}
     */
    "__#1@#items": T[];
    /**
     * @package
     * @type {string}
     */
    readonly _listTypeName: string;
    /**
     * @type {T[]}
     */
    readonly items: T[];
    /**
     * @package
     * @returns {UplcData}
     */
    _toUplcData(): UplcData;
    /**
     * @returns {string}
     */
    toSchemaJson(): string;
    /**
     * @returns {number[]}
     */
    toCbor(): number[];
}>;
/**
 * @template {HeliosData} TKey
 * @template {HeliosData} TValue
 * @param {HeliosDataClass<TKey>} KeyClass
 * @param {HeliosDataClass<TValue>} ValueClass
 * @returns {HeliosDataClass<HeliosMap_>}
 */
export function HeliosMap<TKey extends HeliosData, TValue extends HeliosData>(KeyClass: HeliosDataClass<TKey>, ValueClass: HeliosDataClass<TValue>): HeliosDataClass<{
    /**
     * @type {[TKey, TValue][]}
     */
    "__#2@#pairs": [TKey, TValue][];
    /**
     * @package
     * @type {string}
     */
    readonly _mapTypeName: string;
    /**
     * @type {[TKey, TValue][]}
     */
    readonly pairs: [TKey, TValue][];
    /**
     * @package
     * @returns {UplcData}
     */
    _toUplcData(): UplcData;
    /**
     * @returns {string}
     */
    toSchemaJson(): string;
    /**
     * @returns {number[]}
     */
    toCbor(): number[];
}>;
/**
 * @template {HeliosData} T
 * @param {HeliosDataClass<T>} SomeClass
 * @returns {HeliosDataClass<Option_>}
 */
export function Option<T extends HeliosData>(SomeClass: HeliosDataClass<T>): HeliosDataClass<{
    /**
     * @type {?T}
     */
    "__#3@#value": T;
    /**
     * @package
     * @type {string}
     */
    readonly _optionTypeName: string;
    /**
     * @type {?T}
     */
    readonly some: T;
    /**
     * @package
     * @returns {UplcData}
     */
    _toUplcData(): UplcData;
    /**
     * @returns {string}
     */
    toSchemaJson(): string;
    /**
     * @returns {number[]}
     */
    toCbor(): number[];
}>;
/**
 * Returns index of a named builtin
 * Throws an error if builtin doesn't exist
 * @param {string} name
 * @returns
 */
export function findUplcBuiltin(name: string): number;
/**
 * Checks if a named builtin exists
 * @param {string} name
 * @param {boolean} strict - if true then throws an error if builtin doesn't exist
 * @returns {boolean}
 */
export function isUplcBuiltin(name: string, strict?: boolean): boolean;
/**
 * @param {number[]} bytes
 * @returns {UplcProgram}
 */
export function deserializeUplcBytes(bytes: number[]): UplcProgram;
/**
 * Parses a plutus core program. Returns a UplcProgram object
 * @param {string} jsonString
 * @returns {UplcProgram}
 */
export function deserializeUplc(jsonString: string): UplcProgram;
/**
 * Parses Helios quickly to extract the script purpose header.
 * Returns null if header is missing or incorrectly formed (instead of throwing an error)
 * @param {string} rawSrc
 * @returns {?[string, string]} - [purpose, name]
 */
export function extractScriptPurposeAndName(rawSrc: string): [string, string] | null;
/**
 * Applies syntax highlighting by returning a list of char categories.
 * Not part of Tokeizer because it needs to be very fast and can't throw errors.
 * Doesn't depend on any other functions so it can easily be ported to other languages.
 * @param {string} src
 * @returns {Uint8Array}
 */
export function highlight(src: string): Uint8Array;
/**
 * Version of the Helios library.
 */
export const VERSION: "0.12.8";
/**
 * Set to false if using the library for mainnet (impacts Addresses)
 * @type {boolean}
 */
export const IS_TESTNET: boolean;
/**
 * UserErrors are generated when the user of Helios makes a mistake (eg. a syntax error),
 * or when the user of Helios throws an explicit error inside a script (eg. division by zero).
 */
export class UserError extends Error {
    /**
     * @param {string} type
     * @param {Source} src
     * @param {number} pos
     * @param {string} info
     */
    static new(type: string, src: Source, pos: number, info?: string): UserError;
    /**
     * Constructs a SyntaxError
     * @param {Source} src
     * @param {number} pos
     * @param {string} info
     * @returns {UserError}
     */
    static syntaxError(src: Source, pos: number, info?: string): UserError;
    /**
     * Constructs a TypeError
     * @param {Source} src
     * @param {number} pos
     * @param {string} info
     * @returns {UserError}
     */
    static typeError(src: Source, pos: number, info?: string): UserError;
    /**
     * @param {Error} e
     * @returns {boolean}
     */
    static isTypeError(e: Error): boolean;
    /**
     * Constructs a ReferenceError (i.e. name undefined, or name unused)
     * @param {Source} src
     * @param {number} pos
     * @param {string} info
     * @returns {UserError}
     */
    static referenceError(src: Source, pos: number, info?: string): UserError;
    /**
     * @param {Error} e
     * @returns {boolean}
     */
    static isReferenceError(e: Error): boolean;
    /**
     * Catches any UserErrors thrown inside 'fn()`.
     * Dumps the error
     * @template T
     * @param {() => T} fn
     * @param {boolean} verbose
     * @returns {T | undefined}
     */
    static catch<T>(fn: () => T, verbose?: boolean): T;
    /**
     * @param {string} msg
     * @param {Source} src
     * @param {number} pos
     */
    constructor(msg: string, src: Source, pos: number);
    /**
     * @type {Source}
     */
    get src(): Source;
    get data(): void;
    /**
     * @type {number}
     */
    get pos(): number;
    /**
     * Calculates column/line position in 'this.src'.
     * @returns {[number, number]}
     */
    getFilePos(): [number, number];
    /**
     * Dumps the error without throwing.
     * If 'verbose == true' the Source is also pretty printed with line-numbers.
     * @param {boolean} verbose
     */
    dump(verbose?: boolean): void;
    #private;
}
/**
 * Token is the base class of all Expressions and Statements
 */
export class Token {
    /**
     * @param {Site} site
     */
    constructor(site: Site);
    get site(): Site;
    /**
     * @returns {string}
     */
    toString(): string;
    /**
     * Returns 'true' if 'this' is a literal primitive, a literal struct constructor, or a literal function expression.
     * @returns {boolean}
     */
    isLiteral(): boolean;
    /**
     * Returns 'true' if 'this' is a Word token.
     * @param {?(string | string[])} value
     * @returns {boolean}
     */
    isWord(value?: (string | string[]) | null): boolean;
    /**
     * Returns 'true' if 'this' is a Symbol token (eg. '+', '(' etc.)
     * @param {?(string | string[])} value
     * @returns {boolean}
     */
    isSymbol(value?: (string | string[]) | null): boolean;
    /**
     * Returns 'true' if 'this' is a group (eg. '(...)').
     * @param {?string} value
     * @returns {boolean}
     */
    isGroup(value: string | null): boolean;
    /**
     * Returns a SyntaxError at the current Site.
     * @param {string} msg
     * @returns {UserError}
     */
    syntaxError(msg: string): UserError;
    /**
     * Returns a TypeError at the current Site.
     * @param {string} msg
     * @returns {UserError}
     */
    typeError(msg: string): UserError;
    /**
     * Returns a ReferenceError at the current Site.
     * @param {string} msg
     * @returns {UserError}
     */
    referenceError(msg: string): UserError;
    /**
     * Throws a SyntaxError if 'this' isn't a Word.
     * @param {?(string | string[])} value
     * @returns {Word}
     */
    assertWord(value?: (string | string[]) | null): Word;
    /**
     * Throws a SyntaxError if 'this' isn't a Symbol.
     * @param {?(string | string[])} value
     * @returns {SymbolToken}
     */
    assertSymbol(value?: (string | string[]) | null): SymbolToken;
    /**
     * Throws a SyntaxError if 'this' isn't a Group.
     * @param {?string} type
     * @param {?number} nFields
     * @returns {Group}
     */
    assertGroup(type?: string | null, nFields?: number | null): Group;
    #private;
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
    static mulberry32(seed: number): NumberGenerator;
    /**
     * Alias for rand generator of choice
     * @package
     * @param {number} seed
     * @returns {NumberGenerator} - the random number generator function
     */
    static rand(seed: number): NumberGenerator;
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
    static encodeBase32(bytes: number[], alphabet?: string): string;
    /**
     * Internal method
     * @package
     * @param {number[]} bytes
     * @returns {number[]} - list of numbers between 0 and 32
     */
    static encodeBase32Bytes(bytes: number[]): number[];
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
    static decodeBase32(encoded: string, alphabet?: string): number[];
    /**
     * Expand human readable prefix of the bech32 encoding so it can be used in the checkSum
     * Internal method.
     * @package
     * @param {string} hrp
     * @returns {number[]}
     */
    static expandBech32HumanReadablePart(hrp: string): number[];
    /**
     * Used as part of the bech32 checksum.
     * Internal method.
     * @package
     * @param {number[]} bytes
     * @returns {number}
     */
    static calcBech32Polymod(bytes: number[]): number;
    /**
     * Generate the bech32 checksum
     * Internal method
     * @package
     * @param {string} hrp
     * @param {number[]} data - numbers between 0 and 32
     * @returns {number[]} - 6 numbers between 0 and 32
     */
    static calcBech32Checksum(hrp: string, data: number[]): number[];
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
    static encodeBech32(hrp: string, data: number[]): string;
    /**
     * Decomposes a bech32 checksummed string (i.e. Cardano address), and returns the human readable part and the original bytes
     * Throws an error if checksum is invalid.
     * @example
     * bytesToHex(Crypto.decodeBech32("addr_test1wz54prcptnaullpa3zkyc8ynfddc954m9qw5v3nj7mzf2wggs2uld")[1]) => "70a9508f015cfbcffc3d88ac4c1c934b5b82d2bb281d464672f6c49539"
     * @package
     * @param {string} addr
     * @returns {[string, number[]]}
     */
    static decodeBech32(addr: string): [string, number[]];
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
    static verifyBech32(addr: string): boolean;
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
    static sha2_256(bytes: number[]): number[];
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
    static sha2_512(bytes: number[]): number[];
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
    static sha3(bytes: number[]): number[];
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
    static blake2b(bytes: number[], digestSize?: number): number[];
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
    static get Ed25519(): {
        /**
         * @param {number[]} privateKey
         * @returns {number[]}
         */
        derivePublicKey: (privateKey: number[]) => number[];
        /**
         * @param {number[]} message
         * @param {number[]} privateKey
         * @returns {number[]}
         */
        sign: (message: number[], privateKey: number[]) => number[];
        /**
         * @param {number[]} signature
         * @param {number[]} message
         * @param {number[]} publicKey
         * @returns {boolean}
         */
        verify: (signature: number[], message: number[], publicKey: number[]) => boolean;
    };
}
/**
 * @typedef {(bytes: number[]) => void} Decoder
 */
/**
 * @typedef {(i: number, bytes: number[]) => void} IDecoder
 */
/**
 * Base class of any Cbor serializable data class
 * Also contains helper methods for (de)serializing data to/from Cbor
 */
export class CborData {
    /**
     * @param {number} m - major type
     * @param {bigint} n - size parameter
     * @returns {number[]} - uint8 bytes
     */
    static encodeHead(m: number, n: bigint): number[];
    /**
     * @param {number[]} bytes - mutated to contain the rest
     * @returns {[number, bigint]} - [majorType, n]
     */
    static decodeHead(bytes: number[]): [number, bigint];
    /**
     * @param {number} m
     * @returns {number[]}
     */
    static encodeIndefHead(m: number): number[];
    /**
     * @param {number[]} bytes - cbor bytes
     * @returns {number} - majorType
     */
    static decodeIndefHead(bytes: number[]): number;
    /**
     * @param {number[]} bytes
     * @returns {boolean}
     */
    static isNull(bytes: number[]): boolean;
    /**
     * @returns {number[]}
     */
    static encodeNull(): number[];
    /**
     * Throws error if not null
     * @param {number[]} bytes
     */
    static decodeNull(bytes: number[]): void;
    /**
     * @param {boolean} b
     * @returns {number[]}
     */
    static encodeBool(b: boolean): number[];
    /**
     * @param {number[]} bytes
     * @returns {boolean}
     */
    static decodeBool(bytes: number[]): boolean;
    /**
     * @param {number[]} bytes
     * @returns {boolean}
     */
    static isDefBytes(bytes: number[]): boolean;
    /**
     * @param {number[]} bytes
     * @returns {boolean}
     */
    static isIndefBytes(bytes: number[]): boolean;
    /**
     * @example
     * bytesToHex(CborData.encodeBytes(hexToBytes("4d01000033222220051200120011"))) => "4e4d01000033222220051200120011"
     * @param {number[]} bytes
     * @param {boolean} splitInChunks
     * @returns {number[]} - cbor bytes
     */
    static encodeBytes(bytes: number[], splitInChunks?: boolean): number[];
    /**
     * Decodes both an indef array of bytes, and a bytearray of specified length
     * @example
     * bytesToHex(CborData.decodeBytes(hexToBytes("4e4d01000033222220051200120011"))) => "4d01000033222220051200120011"
     * @param {number[]} bytes - cborbytes, mutated to form remaining
     * @returns {number[]} - byteArray
     */
    static decodeBytes(bytes: number[]): number[];
    /**
     * @param {number[]} bytes
     * @returns {boolean}
     */
    static isUtf8(bytes: number[]): boolean;
    /**
     * Encodes a Utf8 string into Cbor bytes.
     * Strings longer than 64 bytes are split into lists with 64 byte chunks
     * Note: string splitting isn't reversible
     * @param {string} str
     * @param {boolean} split
     * @returns {number[]}
     */
    static encodeUtf8(str: string, split?: boolean): number[];
    /**
    * @param {number[]} bytes
    * @returns {string}
    */
    static decodeUtf8Internal(bytes: number[]): string;
    /**
    * @param {number[]} bytes
    * @returns {string}
    */
    static decodeUtf8(bytes: number[]): string;
    /**
     * @param {bigint} n
     * @returns {number[]} - cbor bytes
     */
    static encodeInteger(n: bigint): number[];
    /**
     * @param {number[]} bytes
     * @returns {bigint}
     */
    static decodeInteger(bytes: number[]): bigint;
    /**
     * @param {number[]} bytes
     * @returns {boolean}
     */
    static isIndefList(bytes: number[]): boolean;
    /**
     * @returns {number[]}
     */
    static encodeIndefListStart(): number[];
    /**
     * @param {CborData[] | number[][]} list
     * @returns {number[]}
     */
    static encodeListInternal(list: CborData[] | number[][]): number[];
    /**
     * @returns {number[]}
     */
    static encodeIndefListEnd(): number[];
    /**
     * @param {CborData[] | number[][]} list
     * @returns {number[]}
     */
    static encodeList(list: CborData[] | number[][]): number[];
    /**
     * @param {CborData[] | number[][]} list
     * @returns {number[]}
     */
    static encodeIndefList(list: CborData[] | number[][]): number[];
    /**
     * @param {number[]} bytes
     * @returns {boolean}
     */
    static isDefList(bytes: number[]): boolean;
    /**
     * @param {bigint} n
     * @returns {number[]}
     */
    static encodeDefListStart(n: bigint): number[];
    /**
     * @param {CborData[] | number[][]} list
     * @returns {number[]}
     */
    static encodeDefList(list: CborData[] | number[][]): number[];
    /**
     * @param {number[]} bytes
     * @returns {boolean}
     */
    static isList(bytes: number[]): boolean;
    /**
     * @param {number[]} bytes
     * @param {Decoder} itemDecoder
     */
    static decodeList(bytes: number[], itemDecoder: Decoder): void;
    /**
     * @param {number[]} bytes
     * @returns {boolean}
     */
    static isTuple(bytes: number[]): boolean;
    /**
     * @param {number[][]} tuple
     * @returns {number[]}
     */
    static encodeTuple(tuple: number[][]): number[];
    /**
     * @param {number[]} bytes
     * @param {IDecoder} tupleDecoder
     * @returns {number} - returns the size of the tuple
     */
    static decodeTuple(bytes: number[], tupleDecoder: IDecoder): number;
    /**
     * @param {number[]} bytes
     * @returns {boolean}
     */
    static isMap(bytes: number[]): boolean;
    /**
     * @param {[CborData | number[], CborData | number[]][]} pairList
     * @returns {number[]}
     */
    static encodeMapInternal(pairList: [CborData | number[], CborData | number[]][]): number[];
    /**
     * A decode map method doesn't exist because it specific for the requested type
     * @param {[CborData | number[], CborData | number[]][]} pairList
     * @returns {number[]}
     */
    static encodeMap(pairList: [CborData | number[], CborData | number[]][]): number[];
    /**
     * @param {number[]} bytes
     * @param {Decoder} pairDecoder
     */
    static decodeMap(bytes: number[], pairDecoder: Decoder): void;
    /**
     * @param {number[]} bytes
     * @returns {boolean}
     */
    static isObject(bytes: number[]): boolean;
    /**
     * @param {Map<number, CborData | number[]>} object
     * @returns {number[]}
     */
    static encodeObject(object: Map<number, CborData | number[]>): number[];
    /**
     * @param {number[]} bytes
     * @param {IDecoder} fieldDecoder
     * @returns {Set<number>}
     */
    static decodeObject(bytes: number[], fieldDecoder: IDecoder): Set<number>;
    /**
     * Unrelated to constructor
     * @param {bigint} tag
     * @returns {number[]}
     */
    static encodeTag(tag: bigint): number[];
    /**
     * @param {number[]} bytes
     * @returns {bigint}
     */
    static decodeTag(bytes: number[]): bigint;
    /**
     * @param {number[]} bytes
     * @returns {boolean}
     */
    static isConstr(bytes: number[]): boolean;
    /**
     * Encode a constructor tag of a ConstrData type
     * @param {number} tag
     * @returns {number[]}
     */
    static encodeConstrTag(tag: number): number[];
    /**
     * @param {number} tag
     * @param {CborData[] | number[][]} fields
     * @returns {number[]}
     */
    static encodeConstr(tag: number, fields: CborData[] | number[][]): number[];
    /**
     * @param {number[]} bytes
     * @returns {number}
     */
    static decodeConstrTag(bytes: number[]): number;
    /**
     * Returns the tag
     * @param {number[]} bytes
     * @param {Decoder} fieldDecoder
     * @returns {number}
     */
    static decodeConstr(bytes: number[], fieldDecoder: Decoder): number;
    /**
     * @returns {number[]}
     */
    toCbor(): number[];
}
/**
 * Base class for Plutus-core data classes (not the same as Plutus-core value classes!)
 */
export class UplcData extends CborData {
    /**
     * @param {string | number[]} bytes
     * @returns {UplcData}
     */
    static fromCbor(bytes: string | number[]): UplcData;
    /**
     * Estimate of memory usage during validation
     * @type {number}
     */
    get memSize(): number;
    /**
     * Compares the schema jsons
     * @param {UplcData} other
     * @returns {boolean}
     */
    isSame(other: UplcData): boolean;
    /**
     * @type {number[]}
     */
    get bytes(): number[];
    /**
     * @type {bigint}
     */
    get int(): bigint;
    /**
     * @type {number}
     */
    get index(): number;
    /**
     * @type {UplcData[]}
     */
    get fields(): UplcData[];
    /**
     * @type {UplcData[]}
     */
    get list(): UplcData[];
    /**
     * @type {[UplcData, UplcData][]}
     */
    get map(): [UplcData, UplcData][];
    /**
     * @returns {IR}
     */
    toIR(): IR;
    /**
     * @returns {string}
     */
    toSchemaJson(): string;
}
/**
 * Plutus-core int data class
 */
export class IntData extends UplcData {
    /**
     * Calculate the mem size of a integer (without the DATA_NODE overhead)
     * @param {bigint} value
     * @returns {number}
     */
    static memSizeInternal(value: bigint): number;
    /**
     * @param {number[]} bytes
     * @returns {IntData}
     */
    static fromCbor(bytes: number[]): IntData;
    /**
     * @param {bigint} value
     */
    constructor(value: bigint);
    /**
     * @type {bigint}
     */
    get value(): bigint;
    #private;
}
/**
 * Plutus-core bytearray data class.
 * Wraps a regular list of uint8 numbers (so not Uint8Array)
 */
export class ByteArrayData extends UplcData {
    /**
     * Applies utf-8 encoding
     * @param {string} s
     * @returns {ByteArrayData}
     */
    static fromString(s: string): ByteArrayData;
    /**
     * Calculates the mem size of a byte array without the DATA_NODE overhead.
     * @param {number[]} bytes
     * @returns {number}
     */
    static memSizeInternal(bytes: number[]): number;
    /**
     * @param {number[]} bytes
     * @returns {ByteArrayData}
     */
    static fromCbor(bytes: number[]): ByteArrayData;
    /**
     * Bytearray comparison, which can be used for sorting bytearrays
     * @param {number[]} a
     * @param {number[]} b
     * @returns {number} - 0 -> equals, 1 -> gt, -1 -> lt
     */
    static comp(a: number[], b: number[]): number;
    /**
     * @param {number[]} bytes
     */
    constructor(bytes: number[]);
    /**
     * @returns {string}
     */
    toHex(): string;
    #private;
}
/**
 * Plutus-core list data class
 */
export class ListData extends UplcData {
    /**
     * @param {number[]} bytes
     * @returns {ListData}
     */
    static fromCbor(bytes: number[]): ListData;
    /**
     * @param {UplcData[]} items
     */
    constructor(items: UplcData[]);
    #private;
}
/**
 * Plutus-core map data class
 */
export class MapData extends UplcData {
    /**
     * @param {number[]} bytes
     * @returns {MapData}
     */
    static fromCbor(bytes: number[]): MapData;
    /**
     * @param {[UplcData, UplcData][]} pairs
     */
    constructor(pairs: [UplcData, UplcData][]);
    #private;
}
/**
 * Plutus-core constructed data class
 */
export class ConstrData extends UplcData {
    /**
     * @param {number[]} bytes
     * @returns {ConstrData}
     */
    static fromCbor(bytes: number[]): ConstrData;
    /**
     * @param {number} index
     * @param {UplcData[]} fields
     */
    constructor(index: number, fields: UplcData[]);
    #private;
}
/**
 * Base-type of all data-types that exist both on- and off-chain, and map directly to Helios instances.
 */
export class HeliosData extends CborData {
    /**
     * Name begins with underscore so it can never conflict with structure field names.
     * @package
     * @returns {UplcData}
     */
    _toUplcData(): UplcData;
    /**
     * @returns {string}
     */
    toSchemaJson(): string;
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
export class Int extends HeliosData {
    /**
     * @package
     * @param {number | bigint | string} rawValue
     * @returns {bigint}
     */
    static cleanConstructorArg(rawValue: number | bigint | string): bigint;
    /**
     * @param {UplcData} data
     * @returns {Int}
     */
    static fromUplcData(data: UplcData): Int;
    /**
     * @param {string | number[]} bytes
     * @returns {Int}
     */
    static fromUplcCbor(bytes: string | number[]): Int;
    /**
     * @param {number | bigint | string} rawValue
     */
    constructor(rawValue: number | bigint | string);
    /**
     * @type {bigint}
     */
    get value(): bigint;
    #private;
}
/**
 * Milliseconds since 1 jan 1970
 */
export class Time extends Int {
    /**
    * @package
    * @param {number | bigint | string | Date} rawValue
    * @returns {bigint}
    */
    static cleanConstructorArg(rawValue: number | bigint | string | Date): bigint;
    /**
     * @param {number | bigint | string | Date} rawValue
     */
    constructor(rawValue: number | bigint | string | Date);
}
/**
 * Difference between two time values in milliseconds.
 */
export class Duration extends Int {
}
/**
 * Helios Bool type
 */
export class Bool extends HeliosData {
    /**
     * @package
     * @param {boolean | string} rawValue
     * @returns {boolean}
     */
    static cleanConstructorArg(rawValue: boolean | string): boolean;
    /**
     * @param {UplcData} data
     * @returns {Bool}
     */
    static fromUplcData(data: UplcData): Bool;
    /**
     * @param {string | number[]} bytes
     * @returns {Bool}
     */
    static fromUplcCbor(bytes: string | number[]): Bool;
    /**
     * @param {boolean | string} rawValue
     */
    constructor(rawValue: boolean | string);
    get bool(): boolean;
    #private;
}
/**
 * Helios String type.
 * Can't be named 'String' because that would interfere with the javascript 'String'-type
 */
export class HeliosString extends HeliosData {
    /**
     * @param {UplcData} data
     * @returns {HeliosString}
     */
    static fromUplcData(data: UplcData): HeliosString;
    /**
     * @param {string | number[]} bytes
     * @returns {HeliosString}
     */
    static fromUplcCbor(bytes: string | number[]): HeliosString;
    /**
     * @param {string} value
     */
    constructor(value: string);
    get string(): string;
    #private;
}
/**
 * Helios ByteArray type
 */
export class ByteArray extends HeliosData {
    /**
     * @package
     * @param {string | number[]} rawValue
     */
    static cleanConstructorArg(rawValue: string | number[]): number[];
    /**
     * @param {UplcData} data
     * @returns {ByteArray}
     */
    static fromUplcData(data: UplcData): ByteArray;
    /**
     * @param {string | number[]} bytes
     * @returns {ByteArray}
     */
    static fromUplcCbor(bytes: string | number[]): ByteArray;
    /**
     * @param {string | number[]} rawValue
     */
    constructor(rawValue: string | number[]);
    /**
     * @type {number[]}
     */
    get bytes(): number[];
    /**
     * @type {string}
     */
    get hex(): string;
    #private;
}
export class DatumHash extends Hash {
    /**
     * @param {UplcData} data
     * @returns {DatumHash}
     */
    static fromUplcData(data: UplcData): DatumHash;
    /**
     * @param {string | number[]} bytes
     * @returns {DatumHash}
     */
    static fromUplcCbor(bytes: string | number[]): DatumHash;
    /**
     * @param {string | number[]} rawValue
     */
    constructor(rawValue: string | number[]);
}
export class PubKeyHash extends Hash {
    /**
     * @param {UplcData} data
     * @returns {PubKeyHash}
     */
    static fromUplcData(data: UplcData): PubKeyHash;
    /**
     * @param {string | number[]} bytes
     * @returns {PubKeyHash}
     */
    static fromUplcCbor(bytes: string | number[]): PubKeyHash;
    /**
     * @param {string | number[]} rawValue
     */
    constructor(rawValue: string | number[]);
}
export class ScriptHash extends Hash {
    /**
     * @param {string | number[]} rawValue
     */
    constructor(rawValue: string | number[]);
}
export class MintingPolicyHash extends ScriptHash {
    /**
     * @param {number[]} bytes
     * @returns {MintingPolicyHash}
     */
    static fromCbor(bytes: number[]): MintingPolicyHash;
    /**
     * @param {UplcData} data
     * @returns {MintingPolicyHash}
     */
    static fromUplcData(data: UplcData): MintingPolicyHash;
    /**
     * @param {string | number[]} bytes
     * @returns {MintingPolicyHash}
     */
    static fromUplcCbor(bytes: string | number[]): MintingPolicyHash;
    /**
     * @param {string} str
     * @returns {MintingPolicyHash}
     */
    static fromHex(str: string): MintingPolicyHash;
    /**
     * Encodes as bech32 string using 'asset' as human readable part
     * @returns {string}
     */
    toBech32(): string;
}
export class StakeKeyHash extends Hash {
    /**
     * @param {UplcData} data
     * @returns {StakeKeyHash}
     */
    static fromUplcData(data: UplcData): StakeKeyHash;
    /**
     * @param {string | number[]} bytes
     * @returns {StakeKeyHash}
     */
    static fromUplcCbor(bytes: string | number[]): StakeKeyHash;
}
export class StakingValidatorHash extends ScriptHash {
    /**
     * @param {UplcData} data
     * @returns {StakingValidatorHash}
     */
    static fromUplcData(data: UplcData): StakingValidatorHash;
    /**
     * @param {string | number[]} bytes
     * @returns {StakingValidatorHash}
     */
    static fromUplcCbor(bytes: string | number[]): StakingValidatorHash;
}
export class ValidatorHash extends ScriptHash {
    /**
     * @param {UplcData} data
     * @returns {ValidatorHash}
     */
    static fromUplcData(data: UplcData): ValidatorHash;
    /**
     * @param {string | number[]} bytes
     * @returns {ValidatorHash}
     */
    static fromUplcCbor(bytes: string | number[]): ValidatorHash;
}
/**
 * Hash of a transaction
 */
export class TxId extends Hash {
    /**
     * @param {UplcData} data
     * @returns {TxId}
     */
    static fromUplcData(data: UplcData): TxId;
    /**
     * @param {string | number[]} bytes
     * @returns {TxId}
     */
    static fromUplcCbor(bytes: string | number[]): TxId;
    /**
     * Filled with 255 so that the internal show() function has max execution budget cost
     * @returns {TxId}
     */
    static dummy(): TxId;
    /**
     * @param {string | number[]} rawValue
     */
    constructor(rawValue: string | number[]);
}
/**
 * Id of a Utxo
 */
export class TxOutputId extends HeliosData {
    /**
     * @param  {...any} args
     * @returns {[any, any]}
     */
    static cleanConstructorArgs(...args: any[]): [any, any];
    /**
     * @param {UplcData} data
     * @returns {TxOutputId}
     */
    static fromUplcData(data: UplcData): TxOutputId;
    /**
     * @param {string | number[]} bytes
     * @returns {TxOutputId}
     */
    static fromUplcCbor(bytes: string | number[]): TxOutputId;
    /**
     * @param {...any} args
     */
    constructor(...args: any[]);
    get txId(): TxId;
    get utxoIdx(): Int;
    #private;
}
/**
 * See CIP19 for formatting of first byte
 */
export class Address extends HeliosData {
    /**
     * @param {number[] | string} rawValue
     */
    static cleanConstructorArg(rawValue: number[] | string): number[];
    /**
     * @param {number[]} bytes
     * @returns {Address}
     */
    static fromCbor(bytes: number[]): Address;
    /**
     * @param {string} str
     * @returns {Address}
     */
    static fromBech32(str: string): Address;
    /**
     * Doesn't check validity
     * @param {string} hex
     * @returns {Address}
     */
    static fromHex(hex: string): Address;
    /**
     * @param {PubKeyHash | ValidatorHash} hash
     * @param {?(StakeKeyHash | StakingValidatorHash)} stakingHash
     * @param {boolean} isTestnet
     * @returns {Address}
     */
    static fromHashes(hash: PubKeyHash | ValidatorHash, stakingHash?: (StakeKeyHash | StakingValidatorHash) | null, isTestnet?: boolean): Address;
    /**
     * Simple payment address without a staking part
     * @param {PubKeyHash} hash
     * @param {?(StakeKeyHash | StakingValidatorHash)} stakingHash
     * @param {boolean} isTestnet
     * @returns {Address}
     */
    static fromPubKeyHash(hash: PubKeyHash, stakingHash?: (StakeKeyHash | StakingValidatorHash) | null, isTestnet?: boolean): Address;
    /**
     * Simple script address without a staking part
     * Only relevant for validator scripts
     * @param {ValidatorHash} hash
     * @param {?(StakeKeyHash | StakingValidatorHash)} stakingHash
     * @param {boolean} isTestnet
     * @returns {Address}
     */
    static fromValidatorHash(hash: ValidatorHash, stakingHash?: (StakeKeyHash | StakingValidatorHash) | null, isTestnet?: boolean): Address;
    /**
     * @param {UplcData} data
     * @param {boolean} isTestnet
     * @returns {Address}
     */
    static fromUplcData(data: UplcData, isTestnet?: boolean): Address;
    /**
     * @param {string | number[]} bytes
     * @param {boolean} isTestnet
     * @returns {Address}
     */
    static fromUplcCbor(bytes: string | number[], isTestnet?: boolean): Address;
    /**
     * Used to sort txbody withdrawals
     * @param {Address} a
     * @param {Address} b
     * @return {number}
     */
    static compStakingHashes(a: Address, b: Address): number;
    /**
     * @param {string | number[]} rawValue
     */
    constructor(rawValue: string | number[]);
    get bytes(): number[];
    /**
     * Returns the raw Address bytes as a hex encoded string
     * @returns {string}
     */
    toHex(): string;
    /**
     * @returns {string}
     */
    toBech32(): string;
    /**
     * @returns {Object}
     */
    dump(): any;
    /**
     * @returns {boolean}
     */
    isForTestnet(): boolean;
    /**
     *
     * @private
     * @returns {ConstrData}
     */
    private toCredentialData;
    /**
     * @returns {ConstrData}
     */
    toStakingData(): ConstrData;
    /**
     * @type {?PubKeyHash}
     */
    get pubKeyHash(): PubKeyHash;
    /**
     * @type {?ValidatorHash}
     */
    get validatorHash(): ValidatorHash;
    /**
     * @type {?(StakeKeyHash | StakingValidatorHash)}
     */
    get stakingHash(): StakeKeyHash | StakingValidatorHash;
    #private;
}
/**
 * Collection of non-lovelace assets
 */
export class Assets extends CborData {
    /**
     * @param {number[]} bytes
     * @returns {Assets}
     */
    static fromCbor(bytes: number[]): Assets;
    /**
     * @param {[MintingPolicyHash | number[] | string, [number[] | string, bigint | number][]][]} assets
     */
    constructor(assets?: [MintingPolicyHash | number[] | string, [number[] | string, bigint | number][]][]);
    /**
     * @type {MintingPolicyHash[]}
     */
    get mintingPolicies(): MintingPolicyHash[];
    /**
     * @type {number}
     */
    get nTokenTypes(): number;
    /**
     * @returns {boolean}
     */
    isZero(): boolean;
    /**
     * @param {MintingPolicyHash} mph
     * @param {number[]} tokenName
     * @returns {boolean}
     */
    has(mph: MintingPolicyHash, tokenName: number[]): boolean;
    /**
     * @param {MintingPolicyHash} mph
     * @param {number[]} tokenName
     * @returns {bigint}
     */
    get(mph: MintingPolicyHash, tokenName: number[]): bigint;
    /**
     * Mutates 'this'
     */
    removeZeroes(): void;
    /**
     * Mutates 'this'
     * @param {MintingPolicyHash} mph
     * @param {number[]} tokenName
     * @param {bigint} quantity
     */
    addComponent(mph: MintingPolicyHash, tokenName: number[], quantity: bigint): void;
    /**
     * @param {Assets} other
     * @param {(a: bigint, b: bigint) => bigint} op
     * @returns {Assets}
     */
    applyBinOp(other: Assets, op: (a: bigint, b: bigint) => bigint): Assets;
    /**
     * @param {Assets} other
     * @returns {Assets}
     */
    add(other: Assets): Assets;
    /**
     * @param {Assets} other
     * @returns {Assets}
     */
    sub(other: Assets): Assets;
    /**
     * Mutates 'this'
     * Throws error if mph is already contained in 'this'
     * @param {MintingPolicyHash} mph
     * @param {[number[], bigint][]} tokens
     */
    addTokens(mph: MintingPolicyHash, tokens: [number[], bigint][]): void;
    /**
     * @param {MintingPolicyHash} mph
     * @returns {number[][]}
     */
    getTokenNames(mph: MintingPolicyHash): number[][];
    /**
     * @param {Assets} other
     * @returns {boolean}
     */
    eq(other: Assets): boolean;
    /**
     * Strict gt, if other contains assets this one doesn't contain => return false
     * @param {Assets} other
     * @returns {boolean}
     */
    gt(other: Assets): boolean;
    /**
     * @param {Assets} other
     * @returns {boolean}
     */
    ge(other: Assets): boolean;
    /**
     * @returns {boolean}
     */
    allPositive(): boolean;
    /**
     * Throws an error if any contained quantity <= 0n
     */
    assertAllPositive(): void;
    /**
     * @returns {Object}
     */
    dump(): any;
    /**
     * Used when generating script contexts for running programs
     * @returns {MapData}
     */
    _toUplcData(): MapData;
    /**
     * Makes sure minting policies are in correct order
     * Mutates 'this'
     * Order of tokens per mintingPolicyHash isn't changed
     */
    sort(): void;
    #private;
}
export class Value extends HeliosData {
    /**
     * @param {MintingPolicyHash} mph
     * @param {number[]} tokenName
     * @param {bigint} quantity
     * @returns {Value}
     */
    static asset(mph: MintingPolicyHash, tokenName: number[], quantity: bigint): Value;
    /**
     * @param {number[]} bytes
     * @returns {Value}
     */
    static fromCbor(bytes: number[]): Value;
    /**
     * @param {Value[]} values
     * @returns {Value}
     */
    static sum(values: Value[]): Value;
    /**
     * Useful when deserializing inline datums
     * @param {UplcData} data
     * @returns {Value}
     */
    static fromUplcData(data: UplcData): Value;
    /**
     * @param {string | number[]} bytes
     * @returns {Value}
     */
    static fromUplcCbor(bytes: string | number[]): Value;
    /**
     * @param {bigint} lovelace
     * @param {Assets} assets
     */
    constructor(lovelace?: bigint, assets?: Assets);
    /**
     * @type {bigint}
     */
    get lovelace(): bigint;
    /**
     * Setter for lovelace
     * Note: mutation is handy when balancing transactions
     * @param {bigint} lovelace
     */
    setLovelace(lovelace: bigint): void;
    /**
     * @type {Assets}
     */
    get assets(): Assets;
    /**
     * @param {Value} other
     * @returns {Value}
     */
    add(other: Value): Value;
    /**
     * @param {Value} other
     * @returns {Value}
     */
    sub(other: Value): Value;
    /**
     * @param {Value} other
     * @returns {boolean}
     */
    eq(other: Value): boolean;
    /**
     * Strictly greater than. Returns false if any asset is missing
     * @param {Value} other
     * @returns {boolean}
     */
    gt(other: Value): boolean;
    /**
     * Strictly >=
     * @param {Value} other
     * @returns {boolean}
     */
    ge(other: Value): boolean;
    /**
     * Throws an error if any contained quantity is negative
     * Used when building transactions because transactions can't contain negative values
     * @returns {Value} - returns this
     */
    assertAllPositive(): Value;
    /**
     * @returns {Object}
     */
    dump(): any;
    /**
     * Used when building script context
     * @param {boolean} isInScriptContext
     * @returns {MapData}
     */
    _toUplcData(isInScriptContext?: boolean): MapData;
    #private;
}
/**
 * @typedef {Object} Cost
 * @property {bigint} mem
 * @property {bigint} cpu
 */
/**
 * NetworkParams contains all protocol parameters. These are needed to do correct, up-to-date, cost calculations.
 */
export class NetworkParams {
    /**
     * @param {Object} raw
     */
    constructor(raw: any);
    /**
     * @package
     * @type {Object}
     */
    get costModel(): any;
    /**
     * @package
     * @param {string} key
     * @returns {number}
     */
    getCostModelParameter(key: string): number;
    /**
     * @package
     * @param {string} name
     * @returns {Cost}
     */
    getTermCost(name: string): Cost;
    /**
     * @package
     * @type {Cost}
     */
    get plutusCoreStartupCost(): Cost;
    /**
     * @package
     * @type {Cost}
     */
    get plutusCoreVariableCost(): Cost;
    /**
     * @package
     * @type {Cost}
     */
    get plutusCoreLambdaCost(): Cost;
    /**
     * @package
     * @type {Cost}
     */
    get plutusCoreDelayCost(): Cost;
    /**
     * @package
     * @type {Cost}
     */
    get plutusCoreCallCost(): Cost;
    /**
     * @package
     * @type {Cost}
     */
    get plutusCoreConstCost(): Cost;
    /**
     * @package
     * @type {Cost}
     */
    get plutusCoreForceCost(): Cost;
    /**
     * @package
     * @type {Cost}
     */
    get plutusCoreBuiltinCost(): Cost;
    /**
     * @package
     * @type {[number, number]} - a + b*size
     */
    get txFeeParams(): [number, number];
    /**
     * @package
     * @type {[number, number]} - [memFee, cpuFee]
     */
    get exFeeParams(): [number, number];
    /**
     * @package
     * @type {number[]}
     */
    get sortedCostParams(): number[];
    /**
     * @package
     * @type {number}
     */
    get lovelacePerUTXOByte(): number;
    /**
     * @package
     * @type {number}
     */
    get minCollateralPct(): number;
    /**
     * @package
     * @type {number}
     */
    get maxCollateralInputs(): number;
    /**
     * @package
     * @type {[number, number]} - [mem, cpu]
     */
    get maxTxExecutionBudget(): [number, number];
    /**
     * @package
     * @type {number}
     */
    get maxTxSize(): number;
    /**
     * @package
     * @type {bigint}
     */
    get maxTxFee(): bigint;
    /**
     * Use the latest slot in networkParameters to determine time.
     * @package
     * @param {bigint} slot
     * @returns {bigint}
     */
    slotToTime(slot: bigint): bigint;
    /**
     * Use the latest slot in network parameters to determine slot.
     * @package
     * @param {bigint} time - milliseconds since 1970
     * @returns {bigint}
     */
    timeToSlot(time: bigint): bigint;
    #private;
}
/**
 * a UplcValue is passed around by Plutus-core expressions.
 */
export class UplcValue {
    /**
     * @param {Site} site
     */
    constructor(site: Site);
    /**
     * Return a copy of the UplcValue at a different Site.
     * @package
     * @param {Site} newSite
     * @returns {UplcValue}
     */
    copy(newSite: Site): UplcValue;
    /**
     * @package
     * @type {Site}
     */
    get site(): Site;
    /**
     * @package
     * @type {number}
     */
    get length(): number;
    /**
     * Size in words (8 bytes, 64 bits) occupied in target node
     * @package
     * @type {number}
     */
    get memSize(): number;
    /**
     * Throws an error because most values can't be called (overridden by UplcAnon)
     * @package
     * @param {UplcRte | UplcStack} rte
     * @param {Site} site
     * @param {UplcValue} value
     * @returns {Promise<UplcValue>}
     */
    call(rte: UplcRte | UplcStack, site: Site, value: UplcValue): Promise<UplcValue>;
    /**
     * @package
     * @param {UplcRte | UplcStack} rte
     * @returns {Promise<UplcValue>}
     */
    eval(rte: UplcRte | UplcStack): Promise<UplcValue>;
    /**
     * @type {bigint}
     */
    get int(): bigint;
    /**
     * @type {number[]}
     */
    get bytes(): number[];
    /**
     * @type {string}
     */
    get string(): string;
    /**
     * @type {boolean}
     */
    get bool(): boolean;
    /**
     * Distinguishes a pair from a mapItem
     * @returns {boolean}
     */
    isPair(): boolean;
    /**
     * @type {UplcValue}
     */
    get first(): UplcValue;
    /**
     * @type {UplcValue}
     */
    get second(): UplcValue;
    /**
     * Distinguishes a list from a map
     * @returns {boolean}
     */
    isList(): boolean;
    /**
     * @type {UplcType}
     */
    get itemType(): UplcType;
    /**
     * @type {UplcValue[]}
     */
    get list(): UplcValue[];
    /**
     * @returns {boolean}
     */
    isData(): boolean;
    /**
     * @type {UplcData}
     */
    get data(): UplcData;
    /**
     * @package
     * @returns {Promise<UplcValue>}
     */
    force(): Promise<UplcValue>;
    /**
     * @package
     * @returns {UplcUnit}
     */
    assertUnit(): UplcUnit;
    /**
     * @returns {string}
     */
    toString(): string;
    /**
     * @package
     * @returns {string}
     */
    typeBits(): string;
    /**
     * Encodes value without type header
     * @package
     * @param {BitWriter} bitWriter
     */
    toFlatValueInternal(bitWriter: BitWriter): void;
    /**
     * Encodes value with plutus flat encoding.
     * Member function not named 'toFlat' as not to confuse with 'toFlat' member of terms.
     * @package
     * @param {BitWriter} bitWriter
     */
    toFlatValue(bitWriter: BitWriter): void;
    #private;
}
export class UplcType {
    /**
     * @returns {UplcType}
     */
    static newDataType(): UplcType;
    /**
     * @returns {UplcType}
     */
    static newDataPairType(): UplcType;
    /**
     * @param {number[]} lst
     * @returns {UplcType}
     */
    static fromNumbers(lst: number[]): UplcType;
    /**
     * @param {string} typeBits
     */
    constructor(typeBits: string);
    /**
     * @returns {string}
     */
    typeBits(): string;
    /**
     * @param {UplcValue} value
     * @returns {boolean}
     */
    isSameType(value: UplcValue): boolean;
    #private;
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
export const DEFAULT_UPLC_RTE_CALLBACKS: UplcRTECallbacks;
/**
 * Plutus-core Integer class
 */
export class UplcInt extends UplcValue {
    /**
     * Constructs a UplcInt without requiring a Site
     * @param {bigint | number} value
     * @returns {UplcInt}
     */
    static new(value: bigint | number): UplcInt;
    /**
     * Creates a UplcInt wrapped in a UplcConst, so it can be used a term
     * @param {Site} site
     * @param {bigint} value
     * @returns
     */
    static newSignedTerm(site: Site, value: bigint): UplcConst;
    /**
     * Parses a single byte in the Plutus-core byte-list representation of an int
     * @param {number} b
     * @returns {number}
     */
    static parseRawByte(b: number): number;
    /**
     * Returns true if 'b' is the last byte in the Plutus-core byte-list representation of an int.
     * @param {number} b
     * @returns {boolean}
     */
    static rawByteIsLast(b: number): boolean;
    /**
     * Combines a list of Plutus-core bytes into a bigint (leading bit of each byte is ignored).
     * Differs from bytesToBigInt in utils.js because only 7 bits are used from each byte.
     * @param {number[]} bytes
     * @returns {bigint}
     */
    static bytesToBigInt(bytes: number[]): bigint;
    /**
     * @param {Site} site
     * @param {bigint} value - supposed to be arbitrary precision
     * @param {boolean} signed - unsigned is only for internal use
     */
    constructor(site: Site, value: bigint, signed?: boolean);
    get signed(): boolean;
    /**
     * @param {Site} newSite
     * @returns {UplcInt}
     */
    copy(newSite: Site): UplcInt;
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
    toUnsigned(): UplcInt;
    /**
     * Unapplies zigzag encoding
     * @example
     * (new UplcInt(Site.dummy(), 1n, false)).toSigned().int => -1n
     * @returns {UplcInt}
    */
    toSigned(): UplcInt;
    /**
     * @param {BitWriter} bitWriter
     */
    toFlatInternal(bitWriter: BitWriter): void;
    /**
     * Encodes unsigned integer with plutus flat encoding.
     * Throws error if signed.
     * Used by encoding plutus core program version and debruijn indices.
     * @param {BitWriter} bitWriter
     */
    toFlatUnsigned(bitWriter: BitWriter): void;
    #private;
}
/**
 * Plutus-core ByteArray value class
 * Wraps a regular list of uint8 numbers (so not Uint8Array)
 */
export class UplcByteArray extends UplcValue {
    /**
     * Construct a UplcByteArray without requiring a Site
     * @param {number[]} bytes
     * @returns {UplcByteArray}
     */
    static new(bytes: number[]): UplcByteArray;
    /**
     * Creates new UplcByteArray wrapped in UplcConst so it can be used as a term.
     * @param {Site} site
     * @param {number[]} bytes
     * @returns
     */
    static newTerm(site: Site, bytes: number[]): UplcConst;
    /**
     * Write a list of bytes to the bitWriter using flat encoding.
     * Used by UplcString, UplcByteArray and UplcDataValue
     * Equivalent to E_B* function in Plutus-core docs
     * @param {BitWriter} bitWriter
     * @param {number[]} bytes
     */
    static writeBytes(bitWriter: BitWriter, bytes: number[]): void;
    /**
     * @param {Site} site
     * @param {number[]} bytes
     */
    constructor(site: Site, bytes: number[]);
    /**
     * @param {Site} newSite
     * @returns {UplcByteArray}
     */
    copy(newSite: Site): UplcByteArray;
    #private;
}
/**
 * Plutus-core string value class
 */
export class UplcString extends UplcValue {
    /**
     * Constructs a UplcStrin without requiring a Site
     * @param {string} value
     * @returns {UplcString}
     */
    static new(value: string): UplcString;
    /**
     * Creates a new UplcString wrapped with UplcConst so it can be used as a term.
     * @param {Site} site
     * @param {string} value
     * @returns {UplcConst}
     */
    static newTerm(site: Site, value: string): UplcConst;
    /**
     * @param {Site} site
     * @param {string} value
     */
    constructor(site: Site, value: string);
    /**
     * @param {Site} newSite
     * @returns {UplcString}
     */
    copy(newSite: Site): UplcString;
    #private;
}
/**
 * Plutus-core unit value class
 */
export class UplcUnit extends UplcValue {
    /**
     * Constructs a UplcUnit without requiring a Site
     * @returns {UplcUnit}
     */
    static new(): UplcUnit;
    /**
     * Creates a new UplcUnit wrapped with UplcConst so it can be used as a term
     * @param {Site} site
     * @returns {UplcConst}
     */
    static newTerm(site: Site): UplcConst;
}
/**
 * Plutus-core boolean value class
 */
export class UplcBool extends UplcValue {
    /**
     * Constructs a UplcBool without requiring a Site
     * @param {boolean} value
     * @returns {UplcBool}
     */
    static new(value: boolean): UplcBool;
    /**
     * Creates a new UplcBool wrapped with UplcConst so it can be used as a term.
     * @param {Site} site
     * @param {boolean} value
     * @returns {UplcConst}
     */
    static newTerm(site: Site, value: boolean): UplcConst;
    /**
     * @param {Site} site
     * @param {boolean} value
     */
    constructor(site: Site, value: boolean);
    /**
     * @param {Site} newSite
     * @returns {UplcBool}
     */
    copy(newSite: Site): UplcBool;
    #private;
}
/**
 * Plutus-core pair value class
 * Can contain any other value type.
 */
export class UplcPair extends UplcValue {
    /**
     * Constructs a UplcPair without requiring a Site
     * @param {UplcValue} first
     * @param {UplcValue} second
     * @returns {UplcPair}
     */
    static new(first: UplcValue, second: UplcValue): UplcPair;
    /**
     * Creates a new UplcBool wrapped with UplcConst so it can be used as a term.
     * @param {Site} site
     * @param {UplcValue} first
     * @param {UplcValue} second
     * @returns {UplcConst}
     */
    static newTerm(site: Site, first: UplcValue, second: UplcValue): UplcConst;
    /**
     * @param {Site} site
     * @param {UplcValue} first
     * @param {UplcValue} second
     */
    constructor(site: Site, first: UplcValue, second: UplcValue);
    /**
     * @param {Site} newSite
     * @returns {UplcPair}
     */
    copy(newSite: Site): UplcPair;
    /**
     * @type {UplcData}
     */
    get key(): UplcData;
    /**
     * @type {UplcData}
     */
    get value(): UplcData;
    #private;
}
/**
 * Plutus-core list value class.
 * Only used during evaluation.
*/
export class UplcList extends UplcValue {
    /**
     * Constructs a UplcList without requiring a Site
     * @param {UplcType} type
     * @param {UplcValue[]} items
     */
    static new(type: UplcType, items: UplcValue[]): UplcList;
    /**
     * @param {Site} site
     * @param {UplcType} itemType
     * @param {UplcValue[]} items
     */
    constructor(site: Site, itemType: UplcType, items: UplcValue[]);
    /**
     * @param {Site} newSite
     * @returns {UplcList}
     */
    copy(newSite: Site): UplcList;
    #private;
}
/**
 * Wrapper for UplcData.
 */
export class UplcDataValue extends UplcValue {
    /**
     * @param {UplcDataValue | UplcData} data
     * @returns {UplcData}
     */
    static unwrap(data: UplcDataValue | UplcData): UplcData;
    /**
     * @param {Site} site
     * @param {UplcData} data
     */
    constructor(site: Site, data: UplcData);
    /**
     * @param {Site} newSite
     * @returns {UplcDataValue}
     */
    copy(newSite: Site): UplcDataValue;
    #private;
}
/**
 * Plutus-core program class
 */
export class UplcProgram {
    /**
     * @param {number[]} bytes
     * @returns {UplcProgram}
     */
    static fromCbor(bytes: number[]): UplcProgram;
    /**
     * @param {UplcTerm} expr
     * @param {?number} purpose // TODO: enum type
     * @param {UplcInt[]} version
     */
    constructor(expr: UplcTerm, purpose?: number | null, version?: UplcInt[]);
    /**
     * @type {UplcTerm}
     */
    get expr(): UplcTerm;
    /**
     * @type {Site}
     */
    get site(): Site;
    /**
     * Returns the IR source
     * @type {string}
     */
    get src(): string;
    /**
     * Returns version of Plutus-core (!== Plutus script version!)
     * @type {string}
     */
    get versionString(): string;
    /**
     * @returns {string}
     */
    plutusScriptVersion(): string;
    /**
     * Returns 1 for PlutusScriptV1, 2 for PlutusScriptV2
     * @returns {number}
     */
    versionTag(): number;
    /**
     * @returns {string}
     */
    toString(): string;
    /**
     * Flat encodes the entire Plutus-core program.
     * Note that final padding isn't added now but is handled by bitWriter upon finalization.
     * @param {BitWriter} bitWriter
     */
    toFlat(bitWriter: BitWriter): void;
    /**
     * @param {UplcRte} rte
     * @returns {Promise<UplcValue>}
     */
    eval(rte: UplcRte): Promise<UplcValue>;
    /**
     * Evaluates the term contained in UplcProgram (assuming it is a lambda term)
     * @param {?UplcValue[]} args
     * @param {UplcRTECallbacks} callbacks
     * @param {?NetworkParams} networkParams
     * @returns {Promise<UplcValue>}
     */
    runInternal(args: UplcValue[] | null, callbacks?: UplcRTECallbacks, networkParams?: NetworkParams | null): Promise<UplcValue>;
    /**
     * Wrap the top-level term with consecutive UplcCall terms
     * No checks are performed whether this makes sense or not, so beware
     * Throws an error if you are trying to apply an  with anon func.
     * @param {(UplcValue | HeliosData)[]} args
     * @returns {UplcProgram} - a new UplcProgram instance
     */
    apply(args: (UplcValue | HeliosData)[]): UplcProgram;
    /**
     * @param {?UplcValue[]} args - if null the top-level term is returned as a value
     * @param {UplcRTECallbacks} callbacks
     * @param {?NetworkParams} networkParams
     * @returns {Promise<UplcValue | UserError>}
     */
    run(args: UplcValue[] | null, callbacks?: UplcRTECallbacks, networkParams?: NetworkParams | null): Promise<UplcValue | UserError>;
    /**
     * @param {?UplcValue[]} args
     * @returns {Promise<[(UplcValue | UserError), string[]]>}
     */
    runWithPrint(args: UplcValue[] | null): Promise<[(UplcValue | UserError), string[]]>;
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
    profile(args: UplcValue[], networkParams: NetworkParams): Promise<{
        mem: bigint;
        cpu: bigint;
        size: number;
        builtins: {
            [name: string]: Cost;
        };
        terms: {
            [name: string]: Cost;
        };
        result: UserError | UplcValue;
        messages: string[];
    }>;
    /**
     * Returns flat bytes of serialized script
     * @returns {number[]}
     */
    serializeBytes(): number[];
    /**
     * Calculates the on chain size of the program (number of bytes).
     * @returns {number}
     */
    calcSize(): number;
    /**
     * Returns the Cbor encoding of a script (flat bytes wrapped twice in Cbor bytearray)
     * @returns {number[]}
     */
    toCbor(): number[];
    /**
     * Returns Plutus-core script in JSON format (as string, not as object!)
     * @returns {string}
     */
    serialize(): string;
    /**
     * @returns {number[]} - 28 byte hash
     */
    hash(): number[];
    /**
     * @type {ValidatorHash}
     */
    get validatorHash(): ValidatorHash;
    /**
     * @type {MintingPolicyHash}
     */
    get mintingPolicyHash(): MintingPolicyHash;
    /**
     * @type {StakingValidatorHash}
     */
    get stakingValidatorHash(): StakingValidatorHash;
    #private;
}
export class Tokenizer {
    /**
     * Separates tokens in fields (separted by commas)
     * @param {Token[]} ts
     * @returns {Group}
     */
    static buildGroup(ts: Token[]): Group;
    /**
     * Match group open with group close symbols in order to form groups.
     * This is recursively applied to nested groups.
     * @param {Token[]} ts
     * @returns {Token[]}
     */
    static nestGroups(ts: Token[]): Token[];
    /**
     * @param {Source} src
     * @param {?CodeMap} codeMap
     */
    constructor(src: Source, codeMap?: CodeMap | null);
    incrPos(): void;
    decrPos(): void;
    get currentSite(): Site;
    /**
     * @param {Token} t
     */
    pushToken(t: Token): void;
    /**
     * Reads a single char from the source and advances #pos by one
     * @returns {string}
     */
    readChar(): string;
    /**
     * Decreases #pos by one
     */
    unreadChar(): void;
    /**
     * Start reading precisely one token
     * @param {Site} site
     * @param {string} c
     */
    readToken(site: Site, c: string): void;
    /**
     * Tokenize the complete source.
     * Nests groups before returning a list of tokens
     * @returns {Token[]}
     */
    tokenize(): Token[];
    /**
     * Returns a generator
     * Use gen.next().value to access to the next Token
     * Doesn't perform any grouping
     * Used for quickly parsing the ScriptPurpose header of a script
     * @returns {Generator<Token>}
     */
    streamTokens(): Generator<Token>;
    /**
     * Reads one word token.
     * Immediately turns "true" or "false" into a BoolLiteral instead of keeping it as Word
     * @param {Site} site
     * @param {string} c0 - first character
     */
    readWord(site: Site, c0: string): void;
    /**
     * Reads and discards a comment if current '/' char is followed by '/' or '*'.
     * Otherwise pushes Symbol('/') onto #ts
     * @param {Site} site
     */
    readMaybeComment(site: Site): void;
    /**
     * Reads and discards a single line comment (from '//' to end-of-line)
     */
    readSingleLineComment(): void;
    /**
     * Reads and discards a multi-line comment (from '/' '*' to '*' '/')
     * @param {Site} site
     */
    readMultiLineComment(site: Site): void;
    /**
     * REads a literal integer
     * @param {Site} site
     */
    readSpecialInteger(site: Site): void;
    /**
     * @param {Site} site
     */
    readBinaryInteger(site: Site): void;
    /**
     * @param {Site} site
     */
    readOctalInteger(site: Site): void;
    /**
     * @param {Site} site
     */
    readHexInteger(site: Site): void;
    /**
     * @param {Site} site
     * @param {string} c0 - first character
     */
    readDecimalInteger(site: Site, c0: string): void;
    /**
     * @param {Site} site
     * @param {string} prefix
     * @param {(c: string) => boolean} valid - checks if character is valid as part of the radix
     */
    readRadixInteger(site: Site, prefix: string, valid: (c: string) => boolean): void;
    /**
     * Reads literal hexadecimal representation of ByteArray
     * @param {Site} site
     */
    readByteArray(site: Site): void;
    /**
     * Reads literal string delimited by double quotes.
     * Allows for three escape character: '\\', '\n' and '\t'
     * @param {Site} site
     */
    readString(site: Site): void;
    /**
     * Reads single or double character symbols
     * @param {Site} site
     * @param {string} c0 - first character
     */
    readSymbol(site: Site, c0: string): void;
    #private;
}
/**
 * Builtin Time type. Opaque alias of Int representing milliseconds since 1970
 */
export class TimeType extends BuiltinType {
}
/**
 * @typedef {Map<IRVariable, IRLiteralExpr>} IRLiteralRegistry
 */
export class IRNameExprRegistry {
    /**
     * @param {Map<IRVariable, Set<IRNameExpr>>} map
     */
    constructor(map?: Map<IRVariable, Set<IRNameExpr>>, maybeInsideLoop?: Set<any>);
    /**
     * @param {IRNameExpr} nameExpr
     */
    register(nameExpr: IRNameExpr): void;
    /**
     * Used to prevent inlining upon recursion
     * @param {IRVariable} variable
     */
    registerVariable(variable: IRVariable): void;
    /**
     * @param {IRVariable} variable
     * @returns {number}
     */
    countReferences(variable: IRVariable): number;
    /**
     * @param {IRVariable} variable
     * @returns {boolean}
     */
    maybeInsideLoop(variable: IRVariable): boolean;
    /**
     * Called whenever recursion is detected
     * @returns {IRNameExprRegistry}
     */
    resetVariables(): IRNameExprRegistry;
    #private;
}
export class IRExprRegistry {
    /**
     * @param {IRNameExprRegistry} nameExprs
     */
    constructor(nameExprs: IRNameExprRegistry);
    /**
     * @param {IRVariable} variable
     * @returns {number}
     */
    countReferences(variable: IRVariable): number;
    /**
     * @param {IRVariable} variable
     * @returns {boolean}
     */
    maybeInsideLoop(variable: IRVariable): boolean;
    /**
     * @param {IRVariable} variable
     * @returns {boolean}
     */
    isInlineable(variable: IRVariable): boolean;
    /**
     * @param {IRVariable} variable
     * @returns {IRExpr}
     */
    getInlineable(variable: IRVariable): IRExpr;
    /**
     * @param {IRVariable} variable
     * @param {IRExpr} expr
     */
    addInlineable(variable: IRVariable, expr: IRExpr): void;
    #private;
}
export class IRAnonCallExpr extends IRUserCallExpr {
    /**
     * @param {IRFuncExpr} fnExpr
     * @param {IRExpr[]} argExprs
     * @param {Site} parensSite
     */
    constructor(fnExpr: IRFuncExpr, argExprs: IRExpr[], parensSite: Site);
    /**
     * Internal function
     * @type {IRFuncExpr}
     */
    get anon(): IRFuncExpr;
    /**
     * @type {IRVariable[]}
     */
    get argVariables(): IRVariable[];
    /**
     * Add args to the stack as IRDeferredValue instances
     * @param {IRCallStack} stack
     */
    evalConstants(stack: IRCallStack): IRLiteralExpr | IRUserCallExpr;
    #private;
}
export class IRNestedAnonCallExpr extends IRUserCallExpr {
    /**
     * @param {IRAnonCallExpr} anon
     * @param {IRExpr[]} outerArgExprs
     * @param {Site} parensSite
     */
    constructor(anon: IRAnonCallExpr, outerArgExprs: IRExpr[], parensSite: Site);
    #private;
}
export class IRFuncDefExpr extends IRAnonCallExpr {
    /**
     * @param {IRFuncExpr} fnExpr
     * @param {IRFuncExpr} defExpr
     * @param {Site} parensSite
     */
    constructor(fnExpr: IRFuncExpr, defExpr: IRFuncExpr, parensSite: Site);
    #private;
}
export class IRParametricProgram {
    /**
     * @package
     * @param {IR} ir
     * @param {?number} purpose
     * @param {string[]} parameters
     * @param {boolean} simplify
     * @returns {IRParametricProgram}
     */
    static new(ir: IR, purpose: number | null, parameters: string[], simplify?: boolean): IRParametricProgram;
    /**
     * @param {IRProgram} irProgram
     * @param {string[]} parameters
     */
    constructor(irProgram: IRProgram, parameters: string[]);
    /**
     * @returns {UplcProgram}
     */
    toUplc(): UplcProgram;
    #private;
}
/**
 * @typedef {Object.<string, HeliosDataClass<HeliosData>>} UserTypes
 */
/**
 * Helios root object
 */
export class Program {
    /**
     * @param {string} rawSrc
     * @returns {[purpose, Module[]]}
     */
    static parseMain(rawSrc: string): [number, Module[]];
    /**
     *
     * @param {string} mainName
     * @param {string[]} moduleSrcs
     * @returns {Module[]}
     */
    static parseImports(mainName: string, moduleSrcs?: string[]): Module[];
    /**
     * Creates  a new program.
     * @param {string} mainSrc
     * @param {string[]} moduleSrcs - optional sources of modules, which can be used for imports
     * @returns {Program}
     */
    static new(mainSrc: string, moduleSrcs?: string[]): Program;
    /**
     * @param {number} purpose
     * @param {Module[]} modules
     */
    constructor(purpose: number, modules: Module[]);
    /**
     * @type {Module[]}
     */
    get mainImportedModules(): Module[];
    /**
     * @type {MainModule}
     */
    get mainModule(): MainModule;
    /**
     * @type {?Module}
     */
    get postModule(): Module;
    /**
     * @type {string}
     */
    get name(): string;
    /**
     * @type {FuncStatement}
     */
    get mainFunc(): FuncStatement;
    /**
     * @type {string}
     */
    get mainPath(): string;
    /**
     * @type {Statement[]}
     */
    get mainStatements(): Statement[];
    /**
     * Needed to list the paramTypes, and to call changeParam
     * @type {Statement[]}
     */
    get mainAndPostStatements(): Statement[];
    /**
     * @type {[Statement, boolean][]} - boolean value marks if statement is import or not
     */
    get allStatements(): [Statement, boolean][];
    /**
     * @returns {string}
     */
    toString(): string;
    /**
     * @returns {[string[], string]}
     */
    cleanSource(): [string[], string];
    /**
     * @param {GlobalScope} globalScope
     * @returns {TopScope}
     */
    evalTypesInternal(globalScope: GlobalScope): TopScope;
    /**
     * @returns {TopScope}
     */
    evalTypes(): TopScope;
    /**
     * @type {UserTypes}
     */
    get types(): {
        [x: string]: HeliosDataClass<HeliosData>;
    };
    /**
     * Fill #types with convenient javascript equivalents of Int, ByteArray etc.
     * @param {TopScope} topScope
     */
    fillTypes(topScope: TopScope): void;
    /**
     * @type {Object.<string, Type>}
     */
    get paramTypes(): {
        [x: string]: Type;
    };
    /**
     * Change the literal value of a const statements
     * @param {string} name
     * @param {string | UplcValue} value
     * @returns {Program} - returns 'this' so that changeParam calls can be chained
     */
    changeParam(name: string, value: string | UplcValue): Program;
    /**
     * Change the literal value of a const statements
     * @package
     * @param {string} name
     * @param {UplcData} data
     */
    changeParamSafe(name: string, data: UplcData): Program;
    /**
     * Doesn't use wrapEntryPoint
     * @param {string} name
     * @returns {UplcValue}
     */
    evalParam(name: string): UplcValue;
    /**
     * @param {Object.<string, HeliosData | any>} values
     */
    set parameters(arg: {
        [x: string]: HeliosData;
    });
    /**
     * Alternative way to get the parameters as HeliosData instances
     * @returns {Object.<string, HeliosData>}
     */
    get parameters(): {
        [x: string]: HeliosData;
    };
    /**
     * @package
     * @param {IR} ir
     * @param {string[]} parameters
     * @returns {IR}
     */
    wrapEntryPoint(ir: IR, parameters: string[]): IR;
    /**
     * @package
     * @param {string[]}  parameters
     * @returns {IR}
     */
    toIR(parameters?: string[]): IR;
    /**
     * @returns {string}
     */
    prettyIR(simplify?: boolean): string;
    /**
     * @param {boolean} simplify
     * @returns {UplcProgram}
     */
    compile(simplify?: boolean): UplcProgram;
    /**
     * Compile a special Uplc
     * @param {string[]} parameters
     * @param {boolean} simplify
     * @returns {UplcProgram}
     */
    compileParametric(parameters: string[], simplify?: boolean): UplcProgram;
    #private;
}
export class Tx extends CborData {
    /**
     * @param {number[]} bytes
     * @returns {Tx}
     */
    static fromCbor(bytes: number[]): Tx;
    /**
     * @type {TxBody}
     */
    get body(): TxBody;
    /**
     * @type {number[]}
     */
    get bodyHash(): number[];
    /**
     * @type {TxWitnesses}
     */
    get witnesses(): TxWitnesses;
    /**
     * Used by emulator to check if tx is valid.
     * @param {bigint} slot
     * @returns {boolean}
     */
    isValid(slot: bigint): boolean;
    /**
     * @returns {Object}
     */
    dump(): any;
    /**
     * @param {Date} t
     * @returns {Tx}
     */
    validFrom(t: Date): Tx;
    /**
     * @param {Date} t
     * @returns {Tx}
     */
    validTo(t: Date): Tx;
    /**
     * Throws error if assets of given mph are already being minted in this transaction
     * @param {MintingPolicyHash} mph
     * @param {[number[] | string, bigint][]} tokens - list of pairs of [tokenName, quantity], tokenName can be list of bytes or hex-string
     * @param {UplcDataValue | UplcData} redeemer
     * @returns {Tx}
     */
    mintTokens(mph: MintingPolicyHash, tokens: [number[] | string, bigint][], redeemer: UplcDataValue | UplcData): Tx;
    /**
     * @param {UTxO} input
     * @param {?(UplcDataValue | UplcData)} redeemer
     * @returns {Tx}
     */
    addInput(input: UTxO, redeemer?: (UplcDataValue | UplcData) | null): Tx;
    /**
     * @param {UTxO[]} inputs
     * @param {?(UplcDataValue | UplcData)} redeemer
     * @returns {Tx}
     */
    addInputs(inputs: UTxO[], redeemer?: (UplcDataValue | UplcData) | null): Tx;
    /**
     * @param {TxRefInput} input
     * @param {?UplcProgram} refScript
     * @returns {Tx}
     */
    addRefInput(input: TxRefInput, refScript?: UplcProgram | null): Tx;
    /**
     * @param {TxRefInput[]} inputs
     * @returns {Tx}
     */
    addRefInputs(inputs: TxRefInput[]): Tx;
    /**
     * @param {TxOutput} output
     * @returns {Tx}
     */
    addOutput(output: TxOutput): Tx;
    /**
     * @param {TxOutput[]} outputs
     * @returns {Tx}
     */
    addOutputs(outputs: TxOutput[]): Tx;
    /**
     * @param {PubKeyHash} hash
     * @returns {Tx}
     */
    addSigner(hash: PubKeyHash): Tx;
    /**
     * Unused scripts are detected during finalize(), in which case an error is thrown
     * Throws error if script was already added before
     * @param {UplcProgram} program
     * @returns {Tx}
     */
    attachScript(program: UplcProgram): Tx;
    /**
     * Usually adding only one collateral input is enough
     * Must be less than the limit in networkParams (eg. 3), or else an error is thrown during finalization
     * @param {UTxO} input
     * @returns {Tx}
     */
    addCollateral(input: UTxO): Tx;
    /**
     * Calculates tx fee (including script execution)
     * Shouldn't be used directly
     * @param {NetworkParams} networkParams
     * @returns {bigint}
     */
    estimateFee(networkParams: NetworkParams): bigint;
    /**
     * Iterates until fee is exact
     * Shouldn't be used directly
     * @param {NetworkParams} networkParams
     * @param {bigint} fee
     * @returns {bigint}
     */
    setFee(networkParams: NetworkParams, fee: bigint): bigint;
    /**
     * Checks that all necessary scripts are included, and that all included scripts are used
     * Shouldn't be used directly
     */
    checkScripts(): void;
    /**
     * @param {NetworkParams} networkParams
     * @param {Address} changeAddress
     * @returns {Promise<void>}
     */
    executeRedeemers(networkParams: NetworkParams, changeAddress: Address): Promise<void>;
    /**
     * @param {Address} changeAddress
     */
    balanceAssets(changeAddress: Address): void;
    /**
     * @param {NetworkParams} networkParams
     * @param {Address} changeAddress
     * @param {UTxO[]} spareUtxos
     */
    balanceCollateral(networkParams: NetworkParams, changeAddress: Address, spareUtxos: UTxO[]): void;
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
    balanceLovelace(networkParams: NetworkParams, changeAddress: Address, spareUtxos: UTxO[]): void;
    /**
     * Shouldn't be used directly
     * @param {NetworkParams} networkParams
     */
    syncScriptDataHash(networkParams: NetworkParams): void;
    /**
     * @returns {boolean}
     */
    isSmart(): boolean;
    /**
     * Throws an error if there isn't enough collateral
     * Also throws an error if the script doesn't require collateral, but collateral was actually included
     * Shouldn't be used directly
     * @param {NetworkParams} networkParams
     */
    checkCollateral(networkParams: NetworkParams): void;
    /**
     * Throws error if tx is too big
     * Shouldn't be used directly
     * @param {NetworkParams} networkParams
     */
    checkSize(networkParams: NetworkParams): void;
    /**
     * Final check that fee is big enough
     * @param {NetworkParams} networkParams
     */
    checkFee(networkParams: NetworkParams): void;
    /**
     * Assumes transaction hasn't yet been signed by anyone (i.e. witnesses.signatures is empty)
     * Mutates 'this'
     * Note: this is an async function so that a debugger can optionally be attached in the future
     * @param {NetworkParams} networkParams
     * @param {Address}       changeAddress
     * @param {UTxO[]}        spareUtxos - might be used during balancing if there currently aren't enough inputs
     * @returns {Promise<Tx>}
     */
    finalize(networkParams: NetworkParams, changeAddress: Address, spareUtxos?: UTxO[]): Promise<Tx>;
    /**
     * Throws an error if verify==true and signature is invalid
     * Adding many signatures might be a bit slow
     * @param {Signature} signature
     * @param {boolean} verify
     * @returns {Tx}
     */
    addSignature(signature: Signature, verify?: boolean): Tx;
    /**
     * Throws an error if verify==true and any of the signatures is invalid
     * Adding many signatures might be a bit slow
     * @param {Signature[]} signatures
     * @param {boolean} verify
     * @returns {Tx}
     */
    addSignatures(signatures: Signature[], verify?: boolean): Tx;
    /**
     * @param {number} tag
     * @param {Metadata} data
     * @returns {Tx}
     */
    addMetadata(tag: number, data: Metadata): Tx;
    /**
     * @returns {TxId}
     */
    id(): TxId;
    #private;
}
export class TxWitnesses extends CborData {
    /**
     * @param {number[]} bytes
     * @returns {TxWitnesses}
     */
    static fromCbor(bytes: number[]): TxWitnesses;
    /**
     * @type {Signature[]}
     */
    get signatures(): Signature[];
    /**
     * Returns all the scripts, including the reference scripts
     * @type {UplcProgram[]}
     */
    get scripts(): UplcProgram[];
    /**
     * Throws error if signatures are incorrect
     * @param {number[]} bodyBytes
     */
    verifySignatures(bodyBytes: number[]): void;
    /**
     * @returns {Object}
     */
    dump(): any;
    /**
     * @param {NetworkParams} networkParams
     * @returns {bigint}
     */
    estimateFee(networkParams: NetworkParams): bigint;
    /**
     * @param {Signature} signature
     */
    addSignature(signature: Signature): void;
    /**
     * @param {number} n
     */
    addDummySignatures(n: number): void;
    removeDummySignatures(): void;
    /**
     * Index is calculated later
     * @param {TxInput} input
     * @param {UplcData} redeemerData
     */
    addSpendingRedeemer(input: TxInput, redeemerData: UplcData): void;
    /**
     * @param {MintingPolicyHash} mph
     * @param {UplcData} redeemerData
     */
    addMintingRedeemer(mph: MintingPolicyHash, redeemerData: UplcData): void;
    /**
     * @param {UplcData} data
     */
    addDatumData(data: UplcData): void;
    /**
     * Throws error if script was already added before
     * @param {UplcProgram} program
     * @param {boolean} isRef
     */
    attachScript(program: UplcProgram, isRef?: boolean): void;
    /**
     * Retrieves either a regular script or a reference script
     * @param {Hash} scriptHash - can be ValidatorHash or MintingPolicyHash
     * @returns {UplcProgram}
     */
    getScript(scriptHash: Hash): UplcProgram;
    /**
     * @param {TxBody} body
     */
    updateRedeemerIndices(body: TxBody): void;
    /**
     * @param {NetworkParams} networkParams
     * @returns {?Hash} - returns null if there are no redeemers
     */
    calcScriptDataHash(networkParams: NetworkParams): Hash | null;
    /**
     * Executes the redeemers in order to calculate the necessary ex units
     * @param {NetworkParams} networkParams
     * @param {TxBody} body - needed in order to create correct ScriptContexts
     * @param {Address} changeAddress - needed for dummy input and dummy output
     * @returns {Promise<void>}
     */
    executeRedeemers(networkParams: NetworkParams, body: TxBody, changeAddress: Address): Promise<void>;
    /**
     * Throws error if execution budget is exceeded
     * @param {NetworkParams} networkParams
     */
    checkExecutionBudget(networkParams: NetworkParams): void;
    #private;
}
/**
 * UTxO wraps TxInput
 */
export class UTxO {
    /**
     * Deserializes UTxO format used by wallet connector
     * @param {number[]} bytes
     * @returns {UTxO}
     */
    static fromCbor(bytes: number[]): UTxO;
    /**
     * @param {UTxO[]} utxos
     * @returns {Value}
     */
    static sumValue(utxos: UTxO[]): Value;
    /**
     * @param {TxId} txId
     * @param {bigint} utxoIdx
     * @param {TxOutput} origOutput
     */
    constructor(txId: TxId, utxoIdx: bigint, origOutput: TxOutput);
    /**
     * @type {TxId}
     */
    get txId(): TxId;
    /**
     * @type {bigint}
     */
    get utxoIdx(): bigint;
    /**
     * @type {TxInput}
     */
    get asTxInput(): TxInput;
    /**
     * @type {Value}
     */
    get value(): Value;
    /**
     * @type {TxOutput}
     */
    get origOutput(): TxOutput;
    /**
     * @returns {number[]}
     */
    toCbor(): number[];
    #private;
}
export class TxRefInput extends TxInput {
    /**
     * @param {TxId} txId
     * @param {bigint} utxoId
     * @param {TxOutput} origOutput
     */
    constructor(txId: TxId, utxoId: bigint, origOutput: TxOutput);
}
export class TxOutput extends CborData {
    /**
     * @param {number[]} bytes
     * @returns {TxOutput}
     */
    static fromCbor(bytes: number[]): TxOutput;
    /**
     * @param {Address} address
     * @param {Value} value
     * @param {?Datum} datum
     * @param {?UplcProgram} refScript
     */
    constructor(address: Address, value: Value, datum?: Datum | null, refScript?: UplcProgram | null);
    get address(): Address;
    /**
     * Mutation is handy when correctin the quantity of lovelace in a utxo
     * @param {Address} addr
     */
    setAddress(addr: Address): void;
    get value(): Value;
    /**
     * Mutation is handy when correcting the quantity of lovelace in a utxo
     * @param {Value} val
     */
    setValue(val: Value): void;
    get datum(): Datum;
    /**
     * Mutation is handy when correctin the quantity of lovelace in a utxo
     * @param {Datum} datum
     */
    setDatum(datum: Datum): void;
    /**
     * @returns {UplcData}
     */
    getDatumData(): UplcData;
    /**
     * @returns {Object}
     */
    dump(): any;
    /**
     * @returns {ConstrData}
     */
    toData(): ConstrData;
    /**
     * Each UTxO must contain some minimum quantity of lovelace to avoid that the blockchain is used for data storage
     * @param {NetworkParams} networkParams
     * @returns {bigint}
     */
    calcMinLovelace(networkParams: NetworkParams): bigint;
    /**
     * Mutates. Makes sure the output contains at least the minimum quantity of lovelace.
     * Other parts of the output can optionally also be mutated
     * @param {NetworkParams} networkParams
     * @param {?((output: TxOutput) => void)} updater
     */
    correctLovelace(networkParams: NetworkParams, updater?: (output: TxOutput) => void): void;
    #private;
}
/**
 * Convenience address that is used to query all assets controlled by a given StakeHash (can be scriptHash or regular stakeHash)
 */
export class StakeAddress extends Address {
    /**
     * Address with only staking part (regular StakeKeyHash)
     * @param {boolean} isTestnet
     * @param {StakeKeyHash} hash
     * @returns {StakeAddress}
     */
    static fromStakeKeyHash(isTestnet: boolean, hash: StakeKeyHash): StakeAddress;
    /**
     * Address with only staking part (script StakingValidatorHash)
     * @param {boolean} isTestnet
     * @param {StakingValidatorHash} hash
     * @returns {StakeAddress}
     */
    static fromStakingValidatorHash(isTestnet: boolean, hash: StakingValidatorHash): StakeAddress;
}
export class Signature extends CborData {
    /**
     * @returns {Signature}
     */
    static dummy(): Signature;
    /**
     * @param {number[]} bytes
     * @returns {Signature}
     */
    static fromCbor(bytes: number[]): Signature;
    /**
     * @param {number[]} pubKey
     * @param {number[]} signature
     */
    constructor(pubKey: number[], signature: number[]);
    /**
     * @returns {boolean}
     */
    isDummy(): boolean;
    /**
     * @returns {Object}
     */
    dump(): any;
    /**
     * Throws error if incorrect
     * @param {number[]} msg
     */
    verify(msg: number[]): void;
    #private;
}
/**
 * Inside helios this type is named OutputDatum in order to distinguish it from the user defined Datum,
 * but outside helios scripts there isn't much sense to keep using the name 'OutputDatum' instead of Datum
 */
export class Datum extends CborData {
    /**
     * @param {number[]} bytes
     * @returns {Datum}
     */
    static fromCbor(bytes: number[]): Datum;
    /**
     * @param {UplcDataValue | UplcData | HeliosData} data
     * @returns {HashedDatum}
     */
    static hashed(data: UplcDataValue | UplcData | HeliosData): HashedDatum;
    /**
     * @param {UplcDataValue | UplcData | HeliosData} data
     * @returns {InlineDatum}
     */
    static inline(data: UplcDataValue | UplcData | HeliosData): InlineDatum;
    /**
     * @returns {boolean}
     */
    isInline(): boolean;
    /**
     * @returns {boolean}
     */
    isHashed(): boolean;
    /**
     * @type {DatumHash}
     */
    get hash(): DatumHash;
    /**
     * @type {?UplcData}
     */
    get data(): UplcData;
    /**
     * @returns {Object}
     */
    dump(): any;
    /**
     * @returns {ConstrData}
     */
    toData(): ConstrData;
}
/**
 * Inside helios this type is named OutputDatum::Hash in order to distinguish it from the user defined Datum,
 * but outside helios scripts there isn't much sense to keep using the name 'OutputDatum' instead of Datum
 */
export class HashedDatum extends Datum {
    /**
     * @param {UplcData} data
     * @returns {HashedDatum}
     */
    static fromData(data: UplcData): HashedDatum;
    /**
     * @param {DatumHash} hash
     * @param {?UplcData} origData
     */
    constructor(hash: DatumHash, origData?: UplcData | null);
    #private;
}
/**
 * @typedef {() => UplcValue} ValueGenerator
 */
/**
 * @typedef {(args: UplcValue[], res: (UplcValue | UserError)) => (boolean | Object.<string, boolean>)} PropertyTest
 */
/**
 * Creates generators and runs script tests
 */
export class FuzzyTest {
    /**
     * @param {number} seed
     * @param {number} runsPerTest
     * @param {boolean} simplify - if true then also test the simplified program
     */
    constructor(seed?: number, runsPerTest?: number, simplify?: boolean);
    /**
     * @returns {NumberGenerator}
     */
    newRand(): NumberGenerator;
    /**
     * Returns a gernator for whole numbers between min and max
     * @param {number} min
     * @param {number} max
     * @returns {() => bigint}
     */
    rawInt(min?: number, max?: number): () => bigint;
    /**
     * Returns a generator for whole numbers between min and max, wrapped with IntData
     * @param {number} min
     * @param {number} max
     * @returns {ValueGenerator}
     */
    int(min?: number, max?: number): ValueGenerator;
    /**
     * Returns a generator for strings containing any utf-8 character
     * @param {number} minLength
     * @param {number} maxLength
     * @returns {ValueGenerator}
     */
    string(minLength?: number, maxLength?: number): ValueGenerator;
    /**
     * Returns a generator for strings with ascii characters from 32 (space) to 126 (tilde)
     * @param {number} minLength
     * @param {number} maxLength
     * @returns {ValueGenerator}
     */
    ascii(minLength?: number, maxLength?: number): ValueGenerator;
    /**
     * Returns a generator for bytearrays containing only valid ascii characters
     * @param {number} minLength
     * @param {number} maxLength
     * @returns {ValueGenerator}
     */
    asciiBytes(minLength?: number, maxLength?: number): ValueGenerator;
    /**
     * Returns a generator for bytearrays the are also valid utf8 strings
     * @param {number} minLength - length of the string, not of the bytearray!
     * @param {number} maxLength - length of the string, not of the bytearray!
     * @returns {ValueGenerator}
     */
    utf8Bytes(minLength?: number, maxLength?: number): ValueGenerator;
    /**
     * Returns a generator for number[]
     * @param {number} minLength
     * @param {number} maxLength
     * @returns {() => number[]}
     */
    rawBytes(minLength?: number, maxLength?: number): () => number[];
    /**
     * Returns a generator for bytearrays
     * @param {number} minLength
     * @param {number} maxLength
     * @returns {ValueGenerator}
     */
    bytes(minLength?: number, maxLength?: number): ValueGenerator;
    /**
     * Returns a generator for booleans,
     * @returns {() => boolean}
     */
    rawBool(): () => boolean;
    /**
     * Returns a generator for booleans, wrapped with ConstrData
     * @returns {ValueGenerator}
     */
    bool(): ValueGenerator;
    /**
     * Returns a generator for options
     * @param {ValueGenerator} someGenerator
     * @param {number} noneProbability
     * @returns {ValueGenerator}
     */
    option(someGenerator: ValueGenerator, noneProbability?: number): ValueGenerator;
    /**
     * Returns a generator for lists
     * @param {ValueGenerator} itemGenerator
     * @param {number} minLength
     * @param {number} maxLength
     * @returns {ValueGenerator}
     */
    list(itemGenerator: ValueGenerator, minLength?: number, maxLength?: number): ValueGenerator;
    /**
     * Returns a generator for maps
     * @param {ValueGenerator} keyGenerator
     * @param {ValueGenerator} valueGenerator
     * @param {number} minLength
     * @param {number} maxLength
     * @returns {ValueGenerator}
     */
    map(keyGenerator: ValueGenerator, valueGenerator: ValueGenerator, minLength?: number, maxLength?: number): ValueGenerator;
    /**
     * Returns a generator for objects
     * @param {...ValueGenerator} itemGenerators
     * @returns {ValueGenerator}
     */
    object(...itemGenerators: ValueGenerator[]): ValueGenerator;
    /**
     * Returns a generator for tagged constr
     * @param {number | NumberGenerator} tag
     * @param {...ValueGenerator} fieldGenerators
     * @returns {ValueGenerator}
     */
    constr(tag: number | NumberGenerator, ...fieldGenerators: ValueGenerator[]): ValueGenerator;
    /**
     * Run a test
     * @param {ValueGenerator[]} argGens
     * @param {string} src
     * @param {PropertyTest} propTest
     * @param {number} nRuns
     * @param {boolean} simplify
     * @returns {Promise<void>} - throws an error if any of the property tests fail
     */
    test(argGens: ValueGenerator[], src: string, propTest: PropertyTest, nRuns?: number, simplify?: boolean): Promise<void>;
    /**
     * @param {Object.<string, ValueGenerator>} paramGenerators
     * @param {string[]} paramArgs
     * @param {string} src
     * @param {PropertyTest} propTest
     * @param {number} nRuns
     * @param {boolean} simplify
     * @returns {Promise<void>}
     */
    testParams(paramGenerators: {
        [x: string]: ValueGenerator;
    }, paramArgs: string[], src: string, propTest: PropertyTest, nRuns?: number, simplify?: boolean): Promise<void>;
    #private;
}
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
    static selectExtremumFirst(utxos: UTxO[], amount: Value, largestFirst: boolean): [UTxO[], UTxO[]];
    /**
     * @param {UTxO[]} utxos
     * @param {Value} amount
     * @returns {[UTxO[], UTxO[]]} - [selected, not selected]
     */
    static selectSmallestFirst(utxos: UTxO[], amount: Value): [UTxO[], UTxO[]];
    /**
     * @param {UTxO[]} utxos
     * @param {Value} amount
     * @returns {[UTxO[], UTxO[]]} - [selected, not selected]
     */
    static selectLargestFirst(utxos: UTxO[], amount: Value): [UTxO[], UTxO[]];
}
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
export class Cip30Wallet implements Wallet {
    /**
     * @param {Cip30Handle} handle
     */
    constructor(handle: Cip30Handle);
    /**
     * @returns {Promise<boolean>}
     */
    isMainnet(): Promise<boolean>;
    /**
     * @type {Promise<Address[]>}
     */
    get usedAddresses(): Promise<Address[]>;
    /**
     * @type {Promise<Address[]>}
     */
    get unusedAddresses(): Promise<Address[]>;
    /**
     * @type {Promise<UTxO[]>}
     */
    get utxos(): Promise<UTxO[]>;
    /**
     * @param {Tx} tx
     * @returns {Promise<Signature[]>}
     */
    signTx(tx: Tx): Promise<Signature[]>;
    /**
     * @param {Tx} tx
     * @returns {Promise<TxId>}
     */
    submitTx(tx: Tx): Promise<TxId>;
    #private;
}
export class WalletHelper {
    /**
     * @param {Wallet} wallet
     */
    constructor(wallet: Wallet);
    /**
     * @type {Promise<Address[]>}
     */
    get allAddresses(): Promise<Address[]>;
    /**
     * @returns {Promise<Value>}
     */
    calcBalance(): Promise<Value>;
    /**
     * @type {Promise<Address>}
     */
    get baseAddress(): Promise<Address>;
    /**
     * @type {Promise<Address>}
     */
    get changeAddress(): Promise<Address>;
    /**
     * Returns the first UTxO, so the caller can check precisely which network the user is connected to (eg. preview or preprod)
     * @type {Promise<?UTxO>}
     */
    get refUtxo(): Promise<UTxO>;
    /**
     * @param {Value} amount
     * @param {(allUtxos: UTxO[], anount: Value) => [UTxO[], UTxO[]]} algorithm
     * @returns {Promise<[UTxO[], UTxO[]]>} - [picked, not picked that can be used as spares]
     */
    pickUtxos(amount: Value, algorithm?: (allUtxos: UTxO[], anount: Value) => [UTxO[], UTxO[]]): Promise<[UTxO[], UTxO[]]>;
    /**
     * Returned collateral can't contain an native assets (pure lovelace)
     * TODO: combine UTxOs if a single UTxO isn't enough
     * @param {bigint} amount - 2 Ada should cover most things
     * @returns {Promise<UTxO>}
     */
    pickCollateral(amount?: bigint): Promise<UTxO>;
    /**
     * @param {Address} addr
     * @returns {Promise<boolean>}
     */
    isOwnAddress(addr: Address): Promise<boolean>;
    /**
 * @param {PubKeyHash} pkh
 * @returns {Promise<boolean>}
 */
    isOwnPubKeyHash(pkh: PubKeyHash): Promise<boolean>;
    #private;
}
/**
 * @typedef {{
 *     getUtxos(address: Address): Promise<UTxO[]>,
 *     submitTx(tx: Tx): Promise<TxId>
 * }} Network
 */
/**
 * @implements {Network}
 */
export class BlockfrostV0 implements Network {
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
    static resolve(wallet: Wallet, projectIds: {
        preview?: string;
        preprod?: string;
        mainnet?: string;
    }): Promise<BlockfrostV0>;
    /**
     * @param {any} obj
     * @returns
     */
    static parseValue(obj: any): Value;
    /**
     * @param {string} networkName - "preview", "preprod" or "mainnet"
     * @param {string} projectId
     */
    constructor(networkName: string, projectId: string);
    /**
     * Used by BlockfrostV0.resolve()
     * @param {UTxO} utxo
     * @returns {Promise<boolean>}
     */
    hasUtxo(utxo: UTxO): Promise<boolean>;
    /**
     * Returns oldest UTxOs first, newest last.
     * TODO: pagination
     * @param {Address} address
     * @returns {Promise<UTxO[]>}
     */
    getUtxos(address: Address): Promise<UTxO[]>;
    /**
     * @param {Tx} tx
     * @returns {Promise<TxId>}
     */
    submitTx(tx: Tx): Promise<TxId>;
    #private;
}
/**
 * Single address wallet emulator.
 * @implements {Wallet}
 */
export class WalletEmulator implements Wallet {
    /**
     * Generate a private key from a random number generator (not cryptographically secure!)
     * @param {NumberGenerator} random
     * @returns {number[]} - Ed25519 private key is 32 bytes long
     */
    static genPrivateKey(random: NumberGenerator): number[];
    /**
     * @param {Network} network
     * @param {NumberGenerator} random - used to generate the private key
     */
    constructor(network: Network, random: NumberGenerator);
    /**
     * @type {PubKeyHash}
     */
    get pubKeyHash(): PubKeyHash;
    get address(): Address;
    /**
     * @returns {Promise<boolean>}
     */
    isMainnet(): Promise<boolean>;
    /**
     * Assumed wallet was initiated with at least 1 UTxO at the pubkeyhash address.
     * @returns {Promise<Address[]>}
     */
    get usedAddresses(): Promise<Address[]>;
    get unusedAddresses(): Promise<any>;
    get utxos(): Promise<any>;
    /**
     * Simply assumed the tx needs to by signed by this wallet without checking.
     * @param {Tx} tx
     * @returns {Promise<Signature[]>}
     */
    signTx(tx: Tx): Promise<Signature[]>;
    /**
     * @param {Tx} tx
     * @returns {Promise<TxId>}
     */
    submitTx(tx: Tx): Promise<TxId>;
    #private;
}
/**
 * @implements {Network}
 */
export class NetworkEmulator implements Network {
    /**
     * @param {number} seed
     */
    constructor(seed?: number);
    /**
     * Creates a WalletEmulator and adds a block with a single fake unbalanced Tx
     * @param {bigint} lovelace
     * @param {Assets} assets
     * @returns {WalletEmulator}
     */
    createWallet(lovelace?: bigint, assets?: Assets): WalletEmulator;
    /**
     * Creates a UTxO using a GenesisTx.
     * @param {WalletEmulator} wallet
     * @param {bigint} lovelace
     * @param {Assets} assets
     */
    createUtxo(wallet: WalletEmulator, lovelace: bigint, assets?: Assets): void;
    /**
     * Mint a block with the current mempool, and advance the slot.
     * @param {bigint} nSlots
     */
    tick(nSlots: bigint): void;
    /**
     * @param {Address} address
     * @returns {Promise<UTxO[]>}
     */
    getUtxos(address: Address): Promise<UTxO[]>;
    /**
     * @param {TxId} txId
     * @param {bigint} utxoIdx
     * @returns {boolean}
     */
    isConsumed(txId: TxId, utxoIdx: bigint): boolean;
    /**
     * @param {Tx} tx
     * @returns {Promise<TxId>}
     */
    submitTx(tx: Tx): Promise<TxId>;
    #private;
}
export namespace exportedForTesting {
    export { assert };
    export { setRawUsageNotifier };
    export { debug };
    export { setBlake2bDigestSize };
    export { dumpCostModels };
    export { Site };
    export { Source };
    export { Crypto };
    export { MapData };
    export { UplcData };
    export { CborData };
    export { ConstrData };
    export { IntData };
    export { ByteArrayData };
    export { ListData };
    export { UplcBool };
    export { UplcValue };
    export { UplcDataValue };
    export { ScriptPurpose };
    export { UplcTerm };
    export { UplcProgram };
    export { UplcLambda };
    export { UplcCall };
    export { UplcBuiltin };
    export { UplcVariable };
    export { UplcConst };
    export { UplcInt };
    export { IRProgram };
    export { Tx };
    export { TxBody };
}
/**
 * The inner 'any' is also Metadata, but jsdoc doesn't allow declaring recursive types
 * Metadata is essentially a JSON schema object
 */
export type Metadata = {
    map: [any, any][];
} | any[] | string | number;
/**
 * Function that generates a random number between 0 and 1
 */
export type NumberGenerator = () => number;
export type CodeMap = [number, Site][];
export type IRDefinitions = Map<string, IR>;
export type Decoder = (bytes: number[]) => void;
export type IDecoder = (i: number, bytes: number[]) => void;
export type HeliosDataClass<T extends HeliosData> = {
    new (...args: any[]): T;
    fromUplcCbor: (bytes: (string | number[])) => T;
    fromUplcData: (data: UplcData) => T;
};
export type Cost = {
    mem: bigint;
    cpu: bigint;
};
export type CostModelClass = {
    fromParams: (params: NetworkParams, baseName: string) => CostModel;
};
export type UplcRawStack = [string | null, UplcValue][];
export type UplcRTECallbacks = {
    onPrint?: (msg: string) => Promise<void>;
    onStartCall?: (site: Site, rawStack: import("./helios").UplcRawStack) => Promise<boolean>;
    onEndCall?: (site: Site, rawStack: import("./helios").UplcRawStack) => Promise<void>;
    onIncrCost?: (name: string, isTerm: boolean, cost: Cost) => void;
};
/**
 * We can't use StructStatement etc. directly because that would give circular dependencies
 */
export type UserTypeStatement = {
    name: Word;
    getTypeMember(key: Word): EvalEntity;
    getInstanceMember(key: Word): Instance;
    nFields(site: Site): number;
    hasField(key: Word): boolean;
    getFieldType(site: Site, i: number): Type;
    getFieldIndex(site: Site, name: string): number;
    getFieldName(i: number): string;
    getConstrIndex(site: Site): number;
    nEnumMembers(site: Site): number;
    path: string;
    use: () => void;
};
/**
 * We can't use ConstStatement directly because that would give a circular dependency
 */
export type ConstTypeStatement = {
    name: Word;
    path: string;
    use: () => void;
};
/**
 * We can't use EnumMember directly because that would give a circular dependency
 */
export type EnumMemberTypeStatement = UserTypeStatement & {
    parent: EnumTypeStatement;
    getConstrIndex(site: Site): number;
};
/**
 * We can't use EnumStatement directly because that would give a circular dependency
 */
export type EnumTypeStatement = UserTypeStatement & {
    nEnumMembers(site: Site): number;
    getEnumMember(site: Site, i: number): EnumMemberTypeStatement;
};
/**
 * We can't use FuncStatement directly because that would give a circular dependency
 */
export type RecurseableStatement = {
    path: string;
    use: () => void;
    setRecursive: () => void;
    isRecursive: () => boolean;
};
/**
 * We can't use Scope directly because that would give a circular dependency
 */
export type RecursivenessChecker = {
    isRecursive: (statement: RecurseableStatement) => boolean;
};
export type IRLiteralRegistry = Map<IRVariable, IRLiteralExpr>;
export type UserTypes = {
    [x: string]: HeliosDataClass<HeliosData>;
};
export type ValueGenerator = () => UplcValue;
export type PropertyTest = (args: UplcValue[], res: (UplcValue | UserError)) => (boolean | {
    [x: string]: boolean;
});
export type Wallet = {
    isMainnet(): Promise<boolean>;
    usedAddresses: Promise<Address[]>;
    unusedAddresses: Promise<Address[]>;
    utxos: Promise<UTxO[]>;
    signTx(tx: Tx): Promise<Signature[]>;
    submitTx(tx: Tx): Promise<TxId>;
};
export type Cip30Handle = {
    getNetworkId(): Promise<number>;
    getUsedAddresses(): Promise<string[]>;
    getUnusedAddresses(): Promise<string[]>;
    getUtxos(): Promise<string[]>;
    signTx(txHex: string, partialSign: boolean): Promise<string>;
    submitTx(txHex: string): Promise<string>;
};
export type Network = {
    getUtxos(address: Address): Promise<UTxO[]>;
    submitTx(tx: Tx): Promise<TxId>;
};
/**
 * collectUtxos removes tx inputs from the list, and appends txoutputs sent to the address to the end.
 */
export type EmulatorTx = {
    id(): TxId;
    consumes(txId: TxId, utxoIdx: bigint): boolean;
    collectUtxos(address: Address, utxos: UTxO[]): UTxO[];
};
/**
 * Function that generates a random number between 0 and 1
 * @typedef {() => number} NumberGenerator
 */
/**
 * A Source instance wraps a string so we can use it cheaply as a reference inside a Site.
 * @package
 */
declare class Source {
    /**
     * @param {string} raw
     * @param {?number} fileIndex
     */
    constructor(raw: string, fileIndex?: number | null);
    /**
     * @package
     * @type {string}
     */
    get raw(): string;
    /**
     * @package
     * @type {?number}
     */
    get fileIndex(): number;
    /**
     * Get char from the underlying string.
     * Should work fine utf-8 runes.
     * @package
     * @param {number} pos
     * @returns {string}
     */
    getChar(pos: number): string;
    /**
     * Returns word under pos
     * @package
     * @param {number} pos
     * @returns {?string}
     */
    getWord(pos: number): string | null;
    /**
     * @package
     * @type {number}
     */
    get length(): number;
    /**
     * Calculates the line number of the line where the given character is located (0-based).
     * @package
     * @param {number} pos
     * @returns {number}
     */
    posToLine(pos: number): number;
    /**
     * Calculates the column and line number where the given character is located (0-based).
     * @package
     * @param {number} pos
     * @returns {[number, number]}
     */
    posToColAndLine(pos: number): [number, number];
    /**
     * Creates a more human-readable version of the source by prepending the line-numbers to each line.
     * The line-numbers are at least two digits.
     * @example
     * (new Source("hello\nworld")).pretty() => "01  hello\n02  world"
     * @package
     * @returns {string}
     */
    pretty(): string;
    #private;
}
/**
 * Each Token/Expression/Statement has a Site, which encapsulates a position in a Source
 * @package
 */
declare class Site {
    static dummy(): Site;
    /**
     * @param {Source} src
     * @param {number} pos
     */
    constructor(src: Source, pos: number);
    get src(): Source;
    get pos(): number;
    get line(): number;
    get endSite(): Site;
    /**
     * @param {?Site} site
     */
    setEndSite(site: Site | null): void;
    /**
     * @type {string}
     */
    get part(): string;
    /**
     * @type {?Site}
     */
    get codeMapSite(): Site;
    /**
     * @param {Site} site
     */
    setCodeMapSite(site: Site): void;
    /**
     * Returns a SyntaxError
     * @param {string} info
     * @returns {UserError}
     */
    syntaxError(info?: string): UserError;
    /**
     * Returns a TypeError
     * @param {string} info
     * @returns {UserError}
     */
    typeError(info?: string): UserError;
    /**
     * Returns a ReferenceError
     * @param {string} info
     * @returns {UserError}
     */
    referenceError(info?: string): UserError;
    /**
     * Returns a RuntimeError
     * @param {string} info
     * @returns {UserError}
     */
    runtimeError(info?: string): UserError;
    /**
     * Calculates the column,line position in 'this.#src'
     * @returns {[number, number]}
     */
    getFilePos(): [number, number];
    #private;
}
/**
 * A Word token represents a token that matches /[A-Za-z_][A-Za-z_0-9]/
 * @package
 */
declare class Word extends Token {
    /**
     * @param {string} value
     * @returns {Word}
     */
    static new(value: string): Word;
    /**
     * Finds the index of the first Word(value) in a list of tokens
     * Returns -1 if none found
     * @param {Token[]} ts
     * @param {string | string[]} value
     * @returns {number}
     */
    static find(ts: Token[], value: string | string[]): number;
    /**
     * @param {Site} site
     * @param {string} value
     */
    constructor(site: Site, value: string);
    get value(): string;
    /**
     * @returns {Word}
     */
    assertNotInternal(): Word;
    /**
     * @returns {boolean}
     */
    isKeyword(): boolean;
    /**
     * @returns {Word}
     */
    assertNotKeyword(): Word;
    #private;
}
/**
 * Symbol token represent anything non alphanumeric
 * @package
 */
declare class SymbolToken extends Token {
    /**
     * Finds the index of the first Symbol(value) in a list of tokens.
     * Returns -1 if none found.
     * @param {Token[]} ts
     * @param {string | string[]} value
     * @returns {number}
     */
    static find(ts: Token[], value: string | string[]): number;
    /**
     * Finds the index of the last Symbol(value) in a list of tokens.
     * Returns -1 if none found.
     * @param {Token[]} ts
     * @param {string | string[]} value
     * @returns {number}
     */
    static findLast(ts: Token[], value: string | string[]): number;
    /**
     * @param {Site} site
     * @param {string} value
     */
    constructor(site: Site, value: string);
    get value(): string;
    /**
     * @param {?(string | string[])} value
     * @returns {SymbolToken}
     */
    assertSymbol(value: (string | string[]) | null): SymbolToken;
    #private;
}
/**
 * Group token can '(...)', '[...]' or '{...}' and can contain comma separated fields.
 * @package
 */
declare class Group extends Token {
    /**
     * @param {Token} t
     * @returns {boolean}
     */
    static isOpenSymbol(t: Token): boolean;
    /**
     * @param {Token} t
     * @returns {boolean}
     */
    static isCloseSymbol(t: Token): boolean;
    /**
     * Returns the corresponding closing bracket, parenthesis or brace.
     * Throws an error if not a group symbol.
     * @example
     * Group.matchSymbol("(") => ")"
     * @param {string | SymbolToken} t
     * @returns {string}
     */
    static matchSymbol(t: string | SymbolToken): string;
    /**
     * Finds the index of first Group(type) in list of tokens
     * Returns -1 if none found.
     * @param {Token[]} ts
     * @param {string} type
     * @returns {number}
     */
    static find(ts: Token[], type: string): number;
    /**
     * @param {Site} site
     * @param {string} type - "(", "[" or "{"
     * @param {Token[][]} fields
     * @param {?SymbolToken} firstComma
     */
    constructor(site: Site, type: string, fields: Token[][], firstComma?: SymbolToken | null);
    get fields(): Token[][];
    /**
     * @param {?string} type
     * @returns {boolean}
     */
    isGroup(type?: string | null): boolean;
    #private;
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
declare class IR {
    /**
     * Wraps 'inner' IR source with some definitions (used for top-level statements and for builtins)
     * @package
     * @param {IR} inner
     * @param {IRDefinitions} definitions - name -> definition
     * @returns {IR}
     */
    static wrapWithDefinitions(inner: IR, definitions: IRDefinitions): IR;
    /**
     * @param {string | IR[]} content
     * @param {?Site} site
     */
    constructor(content: string | IR[], site?: Site | null);
    /**
     * @package
     * @type {string | IR[]}
     */
    get content(): string | IR[];
    /**
     * @package
     * @type {?Site}
     */
    get site(): Site;
    /**
     * Returns a list containing IR instances that themselves only contain strings
     * @package
     * @returns {IR[]}
     */
    flatten(): IR[];
    /**
     * Intersperse nested IR content with a separator
     * @package
     * @param {string} sep
     * @returns {IR}
     */
    join(sep: string): IR;
    /**
     * @package
     * @returns {[string, CodeMap]}
     */
    generateSource(): [string, CodeMap];
    /**
     * @returns {string}
     */
    pretty(): string;
    #private;
}
/**
 * Base class of all hash-types
 * @package
 */
declare class Hash extends HeliosData {
    /**
     * @param {string | number[]} rawValue
     * @returns {number[]}
     */
    static cleanConstructorArg(rawValue: string | number[]): number[];
    /**
     * Used internally for metadataHash and scriptDataHash
     * @param {number[]} bytes
     * @returns {Hash}
     */
    static fromCbor(bytes: number[]): Hash;
    /**
     * Might be needed for internal use
     * @param {string} str
     * @returns {Hash}
     */
    static fromHex(str: string): Hash;
    /**
     * @param {Hash} a
     * @param {Hash} b
     * @returns {number}
     */
    static compare(a: Hash, b: Hash): number;
    /**
     * @param {number[]} bytes
     */
    constructor(bytes: number[]);
    /**
     * @returns {number[]}
     */
    get bytes(): number[];
    /**
     * @returns {string}
     */
    get hex(): string;
    /**
     * @returns {string}
     */
    dump(): string;
    /**
     * @param {Hash} other
     */
    eq(other: Hash): boolean;
    #private;
}
/**
 * Plutus-core Runtime Environment is used for controlling the programming evaluation (eg. by a debugger)
 * @package
 */
declare class UplcRte {
    /**
     * @typedef {[?string, UplcValue][]} UplcRawStack
     */
    /**
     * @param {UplcRTECallbacks} callbacks
     * @param {?NetworkParams} networkParams
     */
    constructor(callbacks?: UplcRTECallbacks, networkParams?: NetworkParams | null);
    /**
     * @param {string} name - for breakdown
     * @param {boolean} isTerm
     * @param {Cost} cost
     */
    incrCost(name: string, isTerm: boolean, cost: Cost): void;
    incrStartupCost(): void;
    incrVariableCost(): void;
    incrLambdaCost(): void;
    incrDelayCost(): void;
    incrCallCost(): void;
    incrConstCost(): void;
    incrForceCost(): void;
    incrBuiltinCost(): void;
    /**
     * @param {UplcBuiltin} fn
     * @param {UplcValue[]} args
     */
    calcAndIncrCost(fn: UplcBuiltin, ...args: UplcValue[]): void;
    /**
     * Gets variable using Debruijn index. Throws error here because UplcRTE is the stack root and doesn't contain any values.
     * @param {number} i
     * @returns {UplcValue}
     */
    get(i: number): UplcValue;
    /**
     * Creates a child stack.
     * @param {UplcValue} value
     * @param {?string} valueName
     * @returns {UplcStack}
     */
    push(value: UplcValue, valueName?: string | null): UplcStack;
    /**
     * Calls the print callback (or does nothing if print callback isn't defined)
     * @param {string} msg
     * @returns {Promise<void>}
     */
    print(msg: string): Promise<void>;
    /**
     * Calls the onStartCall callback.
     * @param {Site} site
     * @param {UplcRawStack} rawStack
     * @returns {Promise<void>}
     */
    startCall(site: Site, rawStack: import("./helios").UplcRawStack): Promise<void>;
    /**
     * Calls the onEndCall callback if '#notifyCalls == true'.
     * '#notifyCalls' is set to true if 'rawStack == #marker'.
     * @param {Site} site
     * @param {UplcRawStack} rawStack
     * @param {UplcValue} result
     * @returns {Promise<void>}
     */
    endCall(site: Site, rawStack: import("./helios").UplcRawStack, result: UplcValue): Promise<void>;
    /**
     * @returns {UplcRawStack}
     */
    toList(): import("./helios").UplcRawStack;
    #private;
}
/**
 * UplcStack contains a value that can be retrieved using a Debruijn index.
 */
declare class UplcStack {
    /**
     * @param {(?UplcStack) | UplcRte} parent
     * @param {?UplcValue} value
     * @param {?string} valueName
     */
    constructor(parent: (UplcStack | null) | UplcRte, value?: UplcValue | null, valueName?: string | null);
    incrStartupCost(): void;
    incrVariableCost(): void;
    incrLambdaCost(): void;
    incrDelayCost(): void;
    incrCallCost(): void;
    incrConstCost(): void;
    incrForceCost(): void;
    incrBuiltinCost(): void;
    /**
     * @param {UplcBuiltin} fn
     * @param {UplcValue[]} args
     */
    calcAndIncrCost(fn: UplcBuiltin, ...args: UplcValue[]): void;
    /**
     * Gets a value using the Debruijn index. If 'i == 1' then the current value is returned.
     * Otherwise 'i' is decrement and passed to the parent stack.
     * @param {number} i
     * @returns {UplcValue}
     */
    get(i: number): UplcValue;
    /**
     * Instantiates a child stack.
     * @param {UplcValue} value
     * @param {?string} valueName
     * @returns {UplcStack}
     */
    push(value: UplcValue, valueName?: string | null): UplcStack;
    /**
     * Calls the onPrint callback in the RTE (root of stack).
     * @param {string} msg
     * @returns {Promise<void>}
     */
    print(msg: string): Promise<void>;
    /**
     * Calls the onStartCall callback in the RTE (root of stack).
     * @param {Site} site
     * @param {UplcRawStack} rawStack
     * @returns {Promise<void>}
     */
    startCall(site: Site, rawStack: import("./helios").UplcRawStack): Promise<void>;
    /**
     * Calls the onEndCall callback in the RTE (root of stack).
     * @param {Site} site
     * @param {UplcRawStack} rawStack
     * @param {UplcValue} result
     * @returns {Promise<void>}
    */
    endCall(site: Site, rawStack: import("./helios").UplcRawStack, result: UplcValue): Promise<void>;
    /**
     * @returns {UplcRawStack}
    */
    toList(): import("./helios").UplcRawStack;
    #private;
}
/**
 * BitWriter turns a string of '0's and '1's into a list of bytes.
 * Finalization pads the bits using '0*1' if not yet aligned with the byte boundary.
 * @package
 */
declare class BitWriter {
    /**
     * @package
     * @type {number}
     */
    get length(): number;
    /**
     * Write a string of '0's and '1's to the BitWriter.
     * @package
     * @param {string} bitChars
     */
    write(bitChars: string): void;
    /**
     * @package
     * @param {number} byte
     */
    writeByte(byte: number): void;
    /**
     * Add padding to the BitWriter in order to align with the byte boundary.
     * If 'force == true' then 8 bits are added if the BitWriter is already aligned.
     * @package
     * @param {boolean} force
     */
    padToByteBoundary(force?: boolean): void;
    /**
     * Pads the BitWriter to align with the byte boundary and returns the resulting bytes.
     * @package
     * @param {boolean} force - force padding (will add one byte if already aligned)
     * @returns {number[]}
     */
    finalize(force?: boolean): number[];
    #private;
}
/**
 * Plutus-core const term (i.e. a literal in conventional sense)
 * @package
 */
declare class UplcConst extends UplcTerm {
    /**
     * @param {UplcValue} value
     */
    constructor(value: UplcValue);
    /**
     * @type {UplcValue}
     */
    get value(): UplcValue;
    #private;
}
/**
 * Base class of Plutus-core terms
 * @package
 */
declare class UplcTerm {
    /**
     * @param {Site} site
     * @param {number} type
     */
    constructor(site: Site, type: number);
    /**
     * @type {Site}
     */
    get site(): Site;
    /**
     * Generic term toString method
     * @returns {string}
     */
    toString(): string;
    /**
     * Calculates a value, and also increments the cost
     * @param {UplcRte | UplcStack} rte
     * @returns {Promise<UplcValue>}
     */
    eval(rte: UplcRte | UplcStack): Promise<UplcValue>;
    /**
     * Writes bits of flat encoded Plutus-core terms to bitWriter. Doesn't return anything.
     * @param {BitWriter} bitWriter
     */
    toFlat(bitWriter: BitWriter): void;
    #private;
}
/**
 * Base class of all builtin types (eg. IntType)
 * Note: any builtin type that inherits from BuiltinType must implement get path()
 * @package
 */
declare class BuiltinType extends DataType {
    allowMacros(): void;
    get macrosAllowed(): boolean;
    /**
     * Use 'path' getter instead of 'toIR()' in order to get the base path.
     */
    toIR(): void;
    #private;
}
/**
 * Intermediate Representation variable reference expression
 * @package
 */
declare class IRNameExpr extends IRExpr {
    /**
     * @param {Word} name
     * @param {?IRVariable} variable
     */
    constructor(name: Word, variable?: IRVariable | null);
    /**
     * @type {string}
     */
    get name(): string;
    /**
     * isVariable() should be used to check if a IRNameExpr.variable is equal to a IRVariable (includes special handling of "__core*")
     * @type {IRVariable}
     */
    get variable(): IRVariable;
    /**
     * @package
     * @returns {boolean}
     */
    isCore(): boolean;
    /**
     * @param {IRVariable} ref
     * @returns {boolean}
     */
    isVariable(ref: IRVariable): boolean;
    copy(): IRNameExpr;
    #private;
}
/**
 * IR class that represents function arguments
 * @package
 */
declare class IRVariable extends Token {
    /**
     * @param {Word} name
     */
    constructor(name: Word);
    /**
     * @type {string}
     */
    get name(): string;
    #private;
}
/**
 * Base class of all Intermediate Representation expressions
 * @package
 */
declare class IRExpr extends Token {
    /**
     * For pretty printing the IR
     * @param {string} indent
     * @returns {string}
     */
    toString(indent?: string): string;
    /**
     * Link IRNameExprs to variables
     * @param {IRScope} scope
     */
    resolveNames(scope: IRScope): void;
    /**
     * Turns all IRConstExpr istances into IRLiteralExpr instances
     * @param {IRCallStack} stack
     * @returns {IRExpr}
     */
    evalConstants(stack: IRCallStack): IRExpr;
    /**
     * Evaluates an expression to something (hopefully) literal
     * Returns null if it the result would be worse than the current expression
     * Doesn't return an IRLiteral because the resulting expression might still be an improvement, even if it isn't a literal
     * @param {IRCallStack} stack
     * @returns {?IRValue}
     */
    eval(stack: IRCallStack): IRValue | null;
    /**
     * Used to inline literals and to evaluate IRCoreCallExpr instances with only literal args.
     * @param {IRLiteralRegistry} literals
     * @returns {IRExpr}
     */
    simplifyLiterals(literals: IRLiteralRegistry): IRExpr;
    /**
     * Used before simplifyTopology
     * @param {IRNameExprRegistry} nameExprs
     */
    registerNameExprs(nameExprs: IRNameExprRegistry): void;
    /**
     * Used during inlining/expansion to make sure multiple inlines of IRNameExpr don't interfere when setting the Debruijn index
     * @returns {IRExpr}
     */
    copy(): IRExpr;
    /**
     * @param {IRExprRegistry} registry
     * @returns {IRExpr}
     */
    simplifyTopology(registry: IRExprRegistry): IRExpr;
    /**
     * @returns {UplcTerm}
     */
    toUplc(): UplcTerm;
}
/**
 * IR function call of non-core function
 * @package
 */
declare class IRUserCallExpr extends IRCallExpr {
    /**
     * @param {IRExpr} fnExpr
     * @param {IRExpr[]} argExprs
     * @param {Site} parensSite
     * @returns {IRUserCallExpr}
     */
    static new(fnExpr: IRExpr, argExprs: IRExpr[], parensSite: Site): IRUserCallExpr;
    /**
     * @param {IRExpr} fnExpr
     * @param {IRExpr[]} argExprs
     * @param {Site} parensSite
     */
    constructor(fnExpr: IRExpr, argExprs: IRExpr[], parensSite: Site);
    get fnExpr(): IRExpr;
    copy(): IRUserCallExpr;
    #private;
}
/**
 * IR function expression with some args, that act as the header, and a body expression
 * @package
 */
declare class IRFuncExpr extends IRExpr {
    /**
     * @param {Site} site
     * @param {IRVariable[]} args
     * @param {IRExpr} body
     */
    constructor(site: Site, args: IRVariable[], body: IRExpr);
    get args(): IRVariable[];
    get body(): IRExpr;
    /**
     * @param {IRCallStack} stack
     */
    evalConstants(stack: IRCallStack): IRFuncExpr;
    copy(): IRFuncExpr;
    #private;
}
/**
 * @package
 */
declare class IRCallStack {
    /**
     * @param {boolean} throwRTErrors
     * @param {?IRCallStack} parent
     * @param {?IRVariable} variable
     * @param {?IRValue} value
     */
    constructor(throwRTErrors: boolean, parent?: IRCallStack | null, variable?: IRVariable | null, value?: IRValue | null);
    get throwRTErrors(): boolean;
    /**
     * @param {IRVariable} variable
     * @returns {?IRValue}
     */
    get(variable: IRVariable): IRValue | null;
    /**
     * @param {IRVariable} variable
     * @param {IRValue} value
     * @returns {IRCallStack}
     */
    set(variable: IRVariable, value: IRValue): IRCallStack;
    #private;
}
/**
 * IR wrapper for UplcValues, representing literals
 * @package
 */
declare class IRLiteralExpr extends IRExpr {
    /**
     * @param {UplcValue} value
     */
    constructor(value: UplcValue);
    /**
     * @type {UplcValue}
     */
    get value(): UplcValue;
    /**
     * @param {IRCallStack} stack
     */
    evalConstants(stack: IRCallStack): IRLiteralExpr;
    copy(): IRLiteralExpr;
    /**
     * @returns {UplcConst}
     */
    toUplc(): UplcConst;
    #private;
}
/**
 * Wrapper for IRFuncExpr, IRCallExpr or IRLiteralExpr
 * @package
 */
declare class IRProgram {
    /**
     * @param {IRExpr} expr
     * @returns {IRFuncExpr | IRCallExpr | IRLiteralExpr}
     */
    static assertValidRoot(expr: IRExpr): IRFuncExpr | IRCallExpr | IRLiteralExpr;
    /**
     * @package
     * @param {IR} ir
     * @param {?number} purpose
     * @param {boolean} simplify
     * @param {boolean} throwSimplifyRTErrors - if true -> throw RuntimErrors caught during evaluation steps
     * @param {IRScope} scope
     * @returns {IRProgram}
     */
    static new(ir: IR, purpose: number | null, simplify?: boolean, throwSimplifyRTErrors?: boolean, scope?: IRScope): IRProgram;
    /**
     * @param {IRExpr} expr
     * @returns {IRExpr}
     */
    static simplify(expr: IRExpr): IRExpr;
    /**
     * @param {IRFuncExpr | IRCallExpr | IRLiteralExpr} expr
     * @param {?number} purpose
     */
    constructor(expr: IRFuncExpr | IRCallExpr | IRLiteralExpr, purpose: number | null);
    /**
     * @package
     * @type {IRFuncExpr | IRCallExpr | IRLiteralExpr}
     */
    get expr(): IRLiteralExpr | IRCallExpr | IRFuncExpr;
    /**
     * @package
     * @type {?number}
     */
    get purpose(): number;
    /**
     * @package
     * @type {Site}
     */
    get site(): Site;
    /**
     * @type {UplcData}
     */
    get data(): UplcData;
    toString(): string;
    /**
     * @returns {UplcProgram}
     */
    toUplc(): UplcProgram;
    /**
     * @returns {number}
     */
    calcSize(): number;
    #private;
}
/**
 * A Module is a collection of statements
 */
declare class Module {
    /**
     * @param {string} rawSrc
     * @param {?number} fileIndex - a unique optional index passed in from outside that makes it possible to associate a UserError with a specific file
     * @returns {Module}
     */
    static new(rawSrc: string, fileIndex?: number | null): Module;
    /**
     * @param {Word} name
     * @param {Statement[]} statements
     */
    constructor(name: Word, statements: Statement[]);
    /**
     * @type {Word}
     */
    get name(): Word;
    /**
     * @type {Statement[]}
     */
    get statements(): Statement[];
    toString(): string;
    /**
     * @param {ModuleScope} scope
     */
    evalTypes(scope: ModuleScope): void;
    /**
     * Cleans the program by removing everything that is unecessary for the smart contract (easier to audit)
     * @returns {string}
     */
    cleanSource(): string;
    /**
     * This module can depend on other modules
     * TODO: detect circular dependencies
     * @param {Module[]} modules
     * @param {Module[]} stack
     * @returns {Module[]}
     */
    filterDependencies(modules: Module[], stack?: Module[]): Module[];
    #private;
}
/**
 * The entrypoint module
 */
declare class MainModule extends Module {
    /**
     * @type {FuncStatement}
     */
    get mainFunc(): FuncStatement;
}
/**
 * Function statement
 * (basically just a named FuncLiteralExpr)
 * @package
 */
declare class FuncStatement extends Statement {
    /**
     * @param {Statement} s
     * @returns {boolean}
     */
    static isMethod(s: Statement): boolean;
    /**
     * @param {Site} site
     * @param {Word} name
     * @param {FuncLiteralExpr} funcExpr
     */
    constructor(site: Site, name: Word, funcExpr: FuncLiteralExpr);
    /**
     * @type {Type[]}
     */
    get argTypes(): Type[];
    /**
     * @type {string[]}
     */
    get argTypeNames(): string[];
    /**
     * @type {Type[]}
     */
    get retTypes(): Type[];
    /**
     * Evaluates a function and returns a func value
     * @param {Scope} scope
     * @returns {Instance}
     */
    evalInternal(scope: Scope): Instance;
    /**
     * Evaluates type of a funtion.
     * Separate from evalInternal so we can use this function recursively inside evalInternal
     * @param {Scope} scope
     * @returns {FuncType}
     */
    evalType(scope: Scope): FuncType;
    isRecursive(): boolean;
    /**
     * Called in FuncStatementScope as soon as recursion is detected
     */
    setRecursive(): void;
    /**
     * Returns IR of function.
     * @param {string} fullName - fullName has been prefixed with a type path for impl members
     * @returns {IR}
     */
    toIRInternal(fullName?: string): IR;
    #private;
}
/**
 * Base class for all statements
 * Doesn't return a value upon calling eval(scope)
 * @package
 */
declare class Statement extends Token {
    /**
     * @param {Site} site
     * @param {Word} name
     */
    constructor(site: Site, name: Word);
    /**
     * @param {string} basePath
     */
    setBasePath(basePath: string): void;
    get path(): string;
    /**
     * @type {Word}
     */
    get name(): Word;
    /**
     * @type {boolean}
     */
    get used(): boolean;
    /**
     * @param {ModuleScope} scope
     */
    eval(scope: ModuleScope): void;
    use(): void;
    /**
     * @param {Uint8Array} mask
     */
    hideUnused(mask: Uint8Array): void;
    /**
     * Returns IR of statement.
     * No need to specify indent here, because all statements are top-level
     * @param {IRDefinitions} map
     */
    toIR(map: IRDefinitions): void;
    #private;
}
/**
 * GlobalScope sits above the top-level scope and contains references to all the builtin Values and Types
 * @package
 */
declare class GlobalScope {
    /**
     * Initialize the GlobalScope with all the builtins
     * @param {number} purpose
     * @returns {GlobalScope}
     */
    static new(purpose: number): GlobalScope;
    /**
     * Checks if scope contains a name
     * @param {Word} name
     * @returns {boolean}
     */
    has(name: Word): boolean;
    /**
     * Sets a global name, doesn't check for uniqueness
     * Called when initializing GlobalScope
     * @param {string | Word} name
     * @param {EvalEntity} value
     */
    set(name: string | Word, value: EvalEntity): void;
    /**
     * Gets a named value from the scope.
     * Throws an error if not found.
     * @param {Word} name
     * @returns {EvalEntity}
     */
    get(name: Word): EvalEntity;
    /**
     * Check if funcstatement is called recursively (always false here)
     * @param {RecurseableStatement} statement
     * @returns {boolean}
     */
    isRecursive(statement: RecurseableStatement): boolean;
    /**
     * @returns {boolean}
     */
    isStrict(): boolean;
    allowMacros(): void;
    /**
     * @param {(name: string, type: Type) => void} callback
     */
    loopTypes(callback: (name: string, type: Type) => void): void;
    #private;
}
/**
 * TopScope is a special scope that can contain UserTypes
 * @package
 */
declare class TopScope extends Scope {
    /**
     * @param {GlobalScope} parent
     * @param {boolean} strict
     */
    constructor(parent: GlobalScope, strict?: boolean);
    /**
     * @param {boolean} s
     */
    setStrict(s: boolean): void;
    /**
     * @param {Word} name
     * @returns {ModuleScope}
     */
    getModuleScope(name: Word): ModuleScope;
    #private;
}
/**
 * Types are used during type-checking of Helios
 * @package
 */
declare class Type extends EvalEntity {
    /**
     * Compares two types. Throws an error if neither is a Type.
     * @example
     * Type.same(Site.dummy(), new IntType(), new IntType()) => true
     * @param {Site} site
     * @param {Type} a
     * @param {Type} b
     * @returns {boolean}
     */
    static same(site: Site, a: Type, b: Type): boolean;
    /**
     * Returns number of members of an enum type
     * Throws an error if not an enum type
     * @param {Site} site
     * @returns {number}
     */
    nEnumMembers(site: Site): number;
    /**
     * Returns the base path in the IR (eg. __helios__bool, __helios__error, etc.)
     * @type {string}
     */
    get path(): string;
    /**
     * @type {HeliosDataClass<HeliosData>}
     */
    get userType(): HeliosDataClass<HeliosData>;
}
/**
 * inputs, minted assets, and withdrawals need to be sorted in order to form a valid transaction
 */
declare class TxBody extends CborData {
    /**
     * @param {number[]} bytes
     * @returns {TxBody}
     */
    static fromCbor(bytes: number[]): TxBody;
    /**
     * @type {TxInput[]}
     */
    get inputs(): TxInput[];
    /**
     * @type {TxOutput[]}
     */
    get outputs(): TxOutput[];
    get fee(): bigint;
    /**
     * @param {bigint} fee
     */
    setFee(fee: bigint): void;
    /**
     * @type {Assets}
     */
    get minted(): Assets;
    /**
     * @type {TxInput[]}
     */
    get collateral(): TxInput[];
    /**
     * @returns {Object}
     */
    dump(): any;
    /**
     * For now simply returns minus infinity to plus infinity (WiP)
     * @param {NetworkParams} networkParams
     * @returns {ConstrData}
     */
    toValidTimeRangeData(networkParams: NetworkParams): ConstrData;
    /**
     * @param {NetworkParams} networkParams
     * @param {Redeemer[]} redeemers
     * @param {ListData} datums
     * @param {TxId} txId
     * @returns {ConstrData}
     */
    toTxData(networkParams: NetworkParams, redeemers: Redeemer[], datums: ListData, txId: TxId): ConstrData;
    /**
     * @param {NetworkParams} networkParams
     * @param {Redeemer[]} redeemers
     * @param {ListData} datums
     * @param {number} redeemerIdx
     * @returns {UplcData}
     */
    toScriptContextData(networkParams: NetworkParams, redeemers: Redeemer[], datums: ListData, redeemerIdx: number): UplcData;
    /**
     * @returns {Value}
     */
    sumInputValue(): Value;
    /**
     * Throws error if any part of the sum is negative (i.e. more is burned than input)
     * @returns {Value}
     */
    sumInputAndMintedValue(): Value;
    /**
     * @returns {Assets}
     */
    sumInputAndMintedAssets(): Assets;
    /**
     * @returns {Value}
     */
    sumOutputValue(): Value;
    /**
     * @returns {Assets}
     */
    sumOutputAssets(): Assets;
    /**
     * @param {bigint} slot
     */
    validFrom(slot: bigint): void;
    /**
     * @param {bigint} slot
     */
    validTo(slot: bigint): void;
    /**
     * Throws error if this.#minted already contains mph
     * @param {MintingPolicyHash} mph - minting policy hash
     * @param {[number[], bigint][]} tokens
     */
    addMint(mph: MintingPolicyHash, tokens: [number[], bigint][]): void;
    /**
     * @param {TxInput} input
     */
    addInput(input: TxInput): void;
    /**
     * @param {TxInput} input
     */
    addRefInput(input: TxInput): void;
    /**
     * @param {TxOutput} output
     */
    addOutput(output: TxOutput): void;
    /**
     * @param {PubKeyHash} hash
     */
    addSigner(hash: PubKeyHash): void;
    /**
     * @param {TxInput} input
     */
    addCollateral(input: TxInput): void;
    /**
     * @param {Hash} scriptDataHash
     */
    setScriptDataHash(scriptDataHash: Hash): void;
    /**
     * @param {Hash} metadataHash
     */
    setMetadataHash(metadataHash: Hash): void;
    /**
     * @param {TxOutput} output
     */
    setCollateralReturn(output: TxOutput): void;
    /**
     * Calculates the number of dummy signatures needed to get precisely the right tx size
     * @returns {number}
     */
    countUniqueSigners(): number;
    /**
     * Script hashes are found in addresses of TxInputs and hashes of the minted MultiAsset
     * @param {Set<string>} set - hashes in hex format
     */
    collectScriptHashes(set: Set<string>): void;
    /**
     * Makes sure each output contains the necessary min lovelace
     * @param {NetworkParams} networkParams
     */
    correctOutputs(networkParams: NetworkParams): void;
    /**
     * Checks that each output contains enough lovelace
     * @param {NetworkParams} networkParams
     */
    checkOutputs(networkParams: NetworkParams): void;
    /**
     * @param {NetworkParams} networkParams
     * @param {?bigint} minCollateral
     */
    checkCollateral(networkParams: NetworkParams, minCollateral: bigint | null): void;
    /**
     * Makes sore inputs, withdrawals, and minted assets are in correct order
     * Mutates
     */
    sort(): void;
    /**
     * Used by (indirectly) by emulator to check if slot range is valid.
     * @param {bigint} slot
     */
    isValid(slot: bigint): boolean;
    #private;
}
/**
 * @package
 */
declare class TxInput extends CborData {
    /**
     * @param {number[]} bytes
     * @returns {TxInput}
     */
    static fromCbor(bytes: number[]): TxInput;
    /**
     * Tx inputs must be ordered.
     * The following function can be used directly by a js array sort
     * @param {TxInput} a
     * @param {TxInput} b
     * @returns {number}
     */
    static comp(a: TxInput, b: TxInput): number;
    /**
     * @param {TxId} txId
     * @param {bigint} utxoIdx
     * @param {?TxOutput} origOutput - used during building, not part of serialization
     */
    constructor(txId: TxId, utxoIdx: bigint, origOutput?: TxOutput | null);
    /**
     * @type {TxId}
     */
    get txId(): TxId;
    /**
     * @type {bigint}
     */
    get utxoIdx(): bigint;
    /**
     * @type {TxOutput}
     */
    get origOutput(): TxOutput;
    /**
     * Shortcut
     * @type {Value}
     */
    get value(): Value;
    /**
     * Shortcut
     * @type {Address}
     */
    get address(): Address;
    /**
     * @returns {ConstrData}
     */
    toOutputIdData(): ConstrData;
    /**
     * @returns {ConstrData}
     */
    toData(): ConstrData;
    /**
     * @returns {Object}
     */
    dump(): any;
    #private;
}
/**
 * Inside helios this type is named OutputDatum::Inline in order to distinguish it from the user defined Datum,
 * but outside helios scripts there isn't much sense to keep using the name 'OutputDatum' instead of Datum
 */
declare class InlineDatum extends Datum {
    /**
     * @param {UplcData} data
     */
    constructor(data: UplcData);
    #private;
}
/**
 * Throws an error if 'cond' is false.
 * @package
 * @param {boolean} cond
 * @param {string} msg
 */
declare function assert(cond: boolean, msg?: string): void;
/**
 * Set the statistics collector (used by the test-suite)
 * @param {(name: string, count: number) => void} callback
 */
declare function setRawUsageNotifier(callback: (name: string, count: number) => void): void;
/**
 * Changes the value of DEBUG
 * @package
 * @param {boolean} b
 */
declare function debug(b: boolean): void;
/**
 * Changes the value of BLAKE2B_DIGEST_SIZE
 *  (because the nodejs crypto module only supports
 *   blake2b-512 and not blake2b-256, and we want to avoid non-standard dependencies in the
 *   test-suite)
 * @package
 * @param {number} s - 32 or 64
 */
declare function setBlake2bDigestSize(s: number): void;
/**
 * Use this function to check cost-model parameters
 * @package
 * @param {NetworkParams} networkParams
 */
declare function dumpCostModels(networkParams: NetworkParams): void;
declare namespace ScriptPurpose {
    export const Testing: number;
    export const Minting: number;
    export const Spending: number;
    export const Staking: number;
    const Module_1: number;
    export { Module_1 as Module };
}
/**
 * Plutus-core lambda term
 * @package
 */
declare class UplcLambda extends UplcTerm {
    /**
     * @param {Site} site
     * @param {UplcTerm} rhs
     * @param {?string} argName
     */
    constructor(site: Site, rhs: UplcTerm, argName?: string | null);
    #private;
}
/**
 * Plutus-core function application term (i.e. function call)
 * @package
 */
declare class UplcCall extends UplcTerm {
    /**
     * @param {Site} site
     * @param {UplcTerm} a
     * @param {UplcTerm} b
     */
    constructor(site: Site, a: UplcTerm, b: UplcTerm);
    #private;
}
/**
 * Plutus-core builtin function ref term
 * @package
 */
declare class UplcBuiltin extends UplcTerm {
    /**
     * Used by IRCoreCallExpr
     * @param {Word} name
     * @param {UplcValue[]} args
     * @returns {UplcValue}
     */
    static evalStatic(name: Word, args: UplcValue[]): UplcValue;
    /**
     * @param {Site} site
     * @param {string | number} name
     */
    constructor(site: Site, name: string | number);
    /**
     * @type {string}
     */
    get name(): string;
    /**
     * @param {NetworkParams} params
     * @param  {...UplcValue} args
     * @returns {Cost}
     */
    calcCost(params: NetworkParams, ...args: UplcValue[]): Cost;
    /**
     * @param {UplcRte | UplcStack} rte
     * @returns {UplcAnon}
     */
    evalInternal(rte?: UplcRte | UplcStack): UplcAnon;
    #private;
}
/**
 * Plutus-core variable ref term (index is a Debruijn index)
 * @package
 */
declare class UplcVariable extends UplcTerm {
    /**
     * @param {Site} site
     * @param {UplcInt} index
     */
    constructor(site: Site, index: UplcInt);
    #private;
}
/**
 * Each builtin has an associated CostModel.
 * The CostModel calculates the execution cost of a builtin, depending on the byte-size of the inputs.
 * @package
 */
declare class CostModel {
    /**
     * @param {NetworkParams} params
     * @param {string} baseName
     * @returns {CostModel}
     */
    static fromParams(params: NetworkParams, baseName: string): CostModel;
    /**
     * @param {number[]} args
     * @returns {bigint}
     */
    calc(args: number[]): bigint;
    /**
     * @returns {string}
     */
    dump(): string;
}
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
 * }} EnumMemberTypeStatement
 */
/**
 * We can't use EnumStatement directly because that would give a circular dependency
 * @typedef {UserTypeStatement & {
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
declare class EvalEntity {
    used_: boolean;
    /**
     * @param {Site} site
     * @returns {Type}
     */
    assertType(site: Site): Type;
    /**
     * @returns {boolean}
     */
    isType(): boolean;
    /**
     * @param {Site} site
     * @returns {Instance}
     */
    assertValue(site: Site): Instance;
    /**
     * @returns {boolean}
     */
    isValue(): boolean;
    /**
     * @returns {boolean}
     */
    isUsed(): boolean;
    /**
     * @returns {string}
     */
    toString(): string;
    /**
     * Used by Scope to mark named Values/Types as used.
     * At the end of the Scope an error is thrown if any named Values/Types aren't used.
     */
    markAsUsed(): void;
    /**
     * Gets type of a value. Throws error when trying to get type of type.
     * @param {Site} site
     * @returns {Type}
     */
    getType(site: Site): Type;
    /**
     * Returns 'true' if 'this' is a base-type of 'type'. Throws an error if 'this' isn't a Type.
     * @param {Site} site
     * @param {Type} type
     * @returns {boolean}
     */
    isBaseOf(site: Site, type: Type): boolean;
    /**
     * Returns 'true' if 'this' is an instance of 'type'. Throws an error if 'this' isn't a Instance.
     * 'type' can be a class, or a class instance.
     * @param {Site} site
     * @param {Type | TypeClass} type
     * @returns {boolean}
     */
    isInstanceOf(site: Site, type: Type | (new (...any: any[]) => Type)): boolean;
    /**
     * Returns the return type of a function (wrapped as a Instance) if the args have the correct types.
     * Throws an error if 'this' isn't a function value, or if the args don't correspond.
     * @param {Site} site
     * @param {Instance[]} args
     * @returns {Instance}
     */
    call(site: Site, args: Instance[]): Instance;
    /**
     * Gets a member of a Type (i.e. the '::' operator).
     * Throws an error if the member doesn't exist or if 'this' isn't a DataType.
     * @param {Word} name
     * @returns {EvalEntity} - can be Instance or Type
     */
    getTypeMember(name: Word): EvalEntity;
    /**
     * Gets a member of a Instance (i.e. the '.' operator).
     * Throws an error if the member doesn't exist or if 'this' isn't a DataInstance.
     * @param {Word} name
     * @returns {Instance} - can be FuncInstance or DataInstance
     */
    getInstanceMember(name: Word): Instance;
    /**
     * Returns the number of fields in a struct.
     * Used to check if a literal struct constructor is correct.
     * @param {Site} site
     * @returns {number}
     */
    nFields(site: Site): number;
    /**
     * Returns the type of struct or enumMember fields.
     * Used to check if literal struct constructor is correct.
     * @param {Site} site
     * @param {number} i
     * @returns {Type}
     */
    getFieldType(site: Site, i: number): Type;
    /**
     * Returns the index of struct or enumMember fields.
     * Used to order literal struct fields.
     * @param {Site} site
     * @param {string} name
     * @returns {number}
     */
    getFieldIndex(site: Site, name: string): number;
    /**
     * Returns the constructor index so Plutus-core data can be created correctly.
     * @param {Site} site
     * @returns {number}
     */
    getConstrIndex(site: Site): number;
}
/**
 * Base class for DataInstance and FuncInstance
 * @package
 */
declare class Instance extends NotType {
    /**
     * @param {Type | Type[]} type
     * @returns {Instance}
     */
    static new(type: Type | Type[]): Instance;
}
/**
 * Base class of non-FuncTypes.
 */
declare class DataType extends Type {
}
/**
 * Scope for IR names.
 * Works like a stack of named values from which a Debruijn index can be derived
 * @package
 */
declare class IRScope {
    /**
     * Checks if a named builtin exists
     * @param {string} name
     * @param {boolean} strict - if true then throws an error if builtin doesn't exist
     * @returns {boolean}
     */
    static isBuiltin(name: string, strict?: boolean): boolean;
    /**
     * Returns index of a named builtin
     * Throws an error if builtin doesn't exist
     * @param {string} name
     * @returns
     */
    static findBuiltin(name: string): number;
    /**
     * @param {?IRScope} parent
     * @param {?IRVariable} variable
     */
    constructor(parent: IRScope | null, variable: IRVariable | null);
    /**
     * Calculates the Debruijn index of a named value. Internal method
     * @param {Word | IRVariable} name
     * @param {number} index
     * @returns {[number, IRVariable]}
     */
    getInternal(name: Word | IRVariable, index: number): [number, IRVariable];
    /**
     * Calculates the Debruijn index.
     * @param {Word | IRVariable} name
     * @returns {[number, IRVariable]}
     */
    get(name: Word | IRVariable): [number, IRVariable];
    #private;
}
/**
 * @package
 */
declare class IRValue {
    /**
     * @param {IRValue[]} args
     * @returns {?IRValue}
     */
    call(args: IRValue[]): IRValue | null;
    /**
     * @type {UplcValue}
     */
    get value(): UplcValue;
}
/**
 * Base class of IRUserCallExpr and IRCoreCallExpr
 * @package
 */
declare class IRCallExpr extends IRExpr {
    /**
     * @param {Site} site
     * @param {IRExpr[]} argExprs
     * @param {Site} parensSite
     */
    constructor(site: Site, argExprs: IRExpr[], parensSite: Site);
    get argExprs(): IRExpr[];
    get parensSite(): Site;
    /**
     * @param {string} indent
     * @returns {string}
     */
    argsToString(indent?: string): string;
    /**
     * @param {IRScope} scope
     */
    resolveNamesInArgs(scope: IRScope): void;
    /**
     * @param {IRCallStack} stack
     * @returns {IRExpr[]}
     */
    evalConstantsInArgs(stack: IRCallStack): IRExpr[];
    /**
     * @param {IRCallStack} stack
     * @returns {?IRValue[]}
     */
    evalArgs(stack: IRCallStack): IRValue[] | null;
    /**
     * @param {IRLiteralRegistry} literals
     * @returns {IRExpr[]}
     */
    simplifyLiteralsInArgs(literals: IRLiteralRegistry): IRExpr[];
    /**
     * @param {IRNameExprRegistry} nameExprs
     */
    registerNameExprsInArgs(nameExprs: IRNameExprRegistry): void;
    /**
     * @param {IRExprRegistry} registry
     * @returns {IRExpr[]}
     */
    simplifyTopologyInArgs(registry: IRExprRegistry): IRExpr[];
    /**
     * @param {UplcTerm} term
     * @returns {UplcTerm}
     */
    toUplcCall(term: UplcTerm): UplcTerm;
    #private;
}
/**
 * @package
 */
declare class ModuleScope extends Scope {
}
/**
 * User scope
 * @package
 */
declare class Scope {
    /**
     * @param {GlobalScope | Scope} parent
     */
    constructor(parent: GlobalScope | Scope);
    /**
     * Used by top-scope to loop over all the statements
     */
    get values(): [Word, EvalEntity | Scope][];
    /**
     * Checks if scope contains a name
     * @param {Word} name
     * @returns {boolean}
     */
    has(name: Word): boolean;
    /**
     * Sets a named value. Throws an error if not unique
     * @param {Word} name
     * @param {EvalEntity | Scope} value
     */
    set(name: Word, value: EvalEntity | Scope): void;
    /**
     * Gets a named value from the scope. Throws an error if not found
     * @param {Word} name
     * @returns {EvalEntity | Scope}
     */
    get(name: Word): EvalEntity | Scope;
    /**
     * Check if function statement is called recursively
     * @param {RecurseableStatement} statement
     * @returns {boolean}
     */
    isRecursive(statement: RecurseableStatement): boolean;
    /**
     * @returns {boolean}
     */
    isStrict(): boolean;
    /**
     * Asserts that all named values are user.
     * Throws an error if some are unused.
     * Check is only run if we are in strict mode
     * @param {boolean} onlyIfStrict
     */
    assertAllUsed(onlyIfStrict?: boolean): void;
    /**
     * @param {Word} name
     * @returns {boolean}
     */
    isUsed(name: Word): boolean;
    /**
     * @param {Site} site
     * @returns {Type}
     */
    assertType(site: Site): Type;
    /**
     * @param {Site} site
     * @returns {Instance}
     */
    assertValue(site: Site): Instance;
    dump(): void;
    /**
     * @param {(name: string, type: Type) => void} callback
     */
    loopTypes(callback: (name: string, type: Type) => void): void;
    #private;
}
/**
 * Function type with arg types and a return type
 * @package
 */
declare class FuncType extends Type {
    /**
     * @param {Type[]} argTypes
     * @param {Type | Type[]} retTypes
     */
    constructor(argTypes: Type[], retTypes: Type | Type[]);
    get nArgs(): number;
    get argTypes(): Type[];
    get retTypes(): Type[];
    /**
     * Checks if the type of the first arg is the same as 'type'
     * Also returns false if there are no args.
     * For a method to be a valid instance member its first argument must also be named 'self', but that is checked elsewhere
     * @param {Site} site
     * @param {Type} type
     * @returns {boolean}
     */
    isMaybeMethod(site: Site, type: Type): boolean;
    /**
     * Checks if any of 'this' argTypes or retType is same as Type.
     * Only if this checks return true is the association allowed.
     * @param {Site} site
     * @param {Type} type
     * @returns {boolean}
     */
    isAssociated(site: Site, type: Type): boolean;
    /**
     * Checks if arg types are valid.
     * Throws errors if not valid. Returns the return type if valid.
     * @param {Site} site
     * @param {Instance[]} args
     * @returns {Type[]}
     */
    checkCall(site: Site, args: Instance[]): Type[];
    #private;
}
/**
 * (..) -> RetTypeExpr {...} expression
 * @package
 */
declare class FuncLiteralExpr extends ValueExpr {
    /**
     * @param {Site} site
     * @param {FuncArg[]} args
     * @param {(?TypeExpr)[]} retTypeExprs
     * @param {ValueExpr} bodyExpr
     */
    constructor(site: Site, args: FuncArg[], retTypeExprs: (TypeExpr | null)[], bodyExpr: ValueExpr);
    /**
     * @type {Type[]}
     */
    get argTypes(): Type[];
    /**
     * @type {string[]}
     */
    get argTypeNames(): string[];
    /**
     * @type {Type[]}
     */
    get retTypes(): Type[];
    /**
     * @param {Scope} scope
     * @returns
     */
    evalType(scope: Scope): FuncType;
    /**
     * @param {Scope} scope
     * @returns {FuncInstance}
     */
    evalInternal(scope: Scope): FuncInstance;
    isMethod(): boolean;
    /**
     * @returns {IR}
     */
    argsToIR(): IR;
    /**
     * @param {?string} recursiveName
     * @param {string} indent
     * @returns {IR}
     */
    toIRInternal(recursiveName: string | null, indent?: string): IR;
    /**
     * @param {string} recursiveName
     * @param {string} indent
     * @returns {IR}
     */
    toIRRecursive(recursiveName: string, indent?: string): IR;
    #private;
}
declare class Redeemer extends CborData {
    /**
     * @param {number[]} bytes
     * @returns {Redeemer}
     */
    static fromCbor(bytes: number[]): Redeemer;
    /**
     * @param {UplcData} data
     * @param {Cost} exUnits
     */
    constructor(data: UplcData, exUnits?: Cost);
    /**
     * @type {UplcData}
     */
    get data(): UplcData;
    /**
     * @type {bigint}
     */
    get memCost(): bigint;
    /**
     * @type {bigint}
     */
    get cpuCost(): bigint;
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
    toCborInternal(type: number, index: number): number[];
    /**
     * @returns {Object}
     */
    dumpInternal(): any;
    /**
     * @returns {Object}
     */
    dump(): any;
    /**
     * @param {TxBody} body
     * @returns {ConstrData}
     */
    toScriptPurposeData(body: TxBody): ConstrData;
    /**
     * @param {TxBody} body
     */
    updateIndex(body: TxBody): void;
    /**
     * @param {Cost} cost
     */
    setCost(cost: Cost): void;
    /**
     * @param {NetworkParams} networkParams
     * @returns {bigint}
     */
    estimateFee(networkParams: NetworkParams): bigint;
    #private;
}
/**
 * Anonymous Plutus-core function.
 * Returns a new UplcAnon whenever it is called/applied (args are 'accumulated'), except final application, when the function itself is evaluated.
 * @package
 */
declare class UplcAnon extends UplcValue {
    /**
     *
     * @param {Site} site
     * @param {UplcRte | UplcStack} rte
     * @param {string[] | number} args - args can be list of argNames (for debugging), or the number of args
     * @param {UplcAnonCallback} fn
     * @param {number} argCount
     * @param {?Site} callSite
     */
    constructor(site: Site, rte: UplcRte | UplcStack, args: string[] | number, fn: (callSite: Site, subStack: UplcStack, ...args: UplcValue[]) => (UplcValue | Promise<UplcValue>), argCount?: number, callSite?: Site | null);
    /**
     * @param {Site} newSite
     * @returns {UplcAnon}
     */
    copy(newSite: Site): UplcAnon;
    /**
     * @param {Site} callSite
     * @param {UplcStack} subStack
     * @param {UplcValue[]} args
     * @returns {UplcValue | Promise<UplcValue>}
     */
    callSync(callSite: Site, subStack: UplcStack, args: UplcValue[]): UplcValue | Promise<UplcValue>;
    #private;
}
declare class NotType extends EvalEntity {
}
/**
 * Base class of expression that evaluate to Values.
 * @package
 */
declare class ValueExpr extends Expr {
    /**
     * @type {Instance}
     */
    get value(): Instance;
    get type(): Type;
    /**
     * @param {Scope} scope
     * @returns {Instance}
     */
    evalInternal(scope: Scope): Instance;
    /**
     * @param {Scope} scope
     * @returns {Instance}
     */
    eval(scope: Scope): Instance;
    /**
     * Returns Intermediate Representation of a value expression.
     * The IR should be indented to make debugging easier.
     * @param {string} indent
     * @returns {IR}
     */
    toIR(indent?: string): IR;
    #private;
}
/**
 * A callable Instance.
 * @package
 */
declare class FuncInstance extends Instance {
    /**
     * @param {FuncType} type
     */
    constructor(type: FuncType);
    get nArgs(): number;
    /**
     * @param {RecursivenessChecker} scope
     * @returns {boolean}
     */
    isRecursive(scope: RecursivenessChecker): boolean;
    /**
     * Returns the underlying FuncType directly.
     * @returns {FuncType}
     */
    getFuncType(): FuncType;
    #private;
}
/**
 * Function argument class
 * @package
 */
declare class FuncArg extends NameTypePair {
}
/**
 * Base class of every Type expression
 * Caches evaluated Type.
 * @package
 */
declare class TypeExpr extends Expr {
    /**
     * @param {Site} site
     * @param {?Type} cache
     */
    constructor(site: Site, cache?: Type | null);
    get type(): Type;
    /**
     * @param {Scope} scope
     * @returns {Type}
     */
    evalInternal(scope: Scope): Type;
    /**
     * @param {Scope} scope
     * @returns {Type}
     */
    eval(scope: Scope): Type;
    #private;
}
/**
 * Base class of every Type and Instance expression.
 */
declare class Expr extends Token {
    use(): void;
}
/**
 * NameTypePair is base class of FuncArg and DataField (differs from StructLiteralField)
 * @package
 */
declare class NameTypePair {
    /**
     * @param {Word} name
     * @param {?TypeExpr} typeExpr
     */
    constructor(name: Word, typeExpr: TypeExpr | null);
    /**
     * @type {Site}
     */
    get site(): Site;
    /**
     * @type {Word}
     */
    get name(): Word;
    isIgnored(): boolean;
    /**
     * @returns {boolean}
     */
    hasType(): boolean;
    /**
     * Throws an error if called before evalType()
     * @type {Type}
     */
    get type(): Type;
    /**
     * @type {string}
     */
    get typeName(): string;
    toString(): string;
    /**
     * Evaluates the type, used by FuncLiteralExpr and DataDefinition
     * @param {Scope} scope
     * @returns {Type}
     */
    evalType(scope: Scope): Type;
    use(): void;
    toIR(): IR;
    #private;
}
export {};
//# sourceMappingURL=helios.d.ts.map