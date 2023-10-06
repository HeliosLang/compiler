
/**
 * Needed by transfer() methods
 * @typedef {{
 *   transferByteArrayData: (bytes: number[]) => any,
 *   transferConstrData: (index: number, fields: any[]) => any,
 *   transferIntData: (value: bigint) => any,
 *   transferListData: (items: any[]) => any,
 *   transferMapData: (pairs: [any, any][]) => any,
 *   transferSite: (src: any, startPos: number, endPos: number, codeMapSite: null | any) => any,
 *   transferSource: (raw: string, name: string) => any,
 *   transferUplcBool: (site: any, value: boolean) => any,
 *   transferUplcBuiltin: (site: any, name: string | number) => any,
 *   transferUplcByteArray: (site: any, bytes: number[]) => any,
 *   transferUplcCall: (site: any, a: any, b: any) => any,
 *   transferUplcConst: (value: any) => any,
 *   transferUplcDataValue: (site: any, data: any) => any,
 *   transferUplcDelay: (site: any, expr: any) => any,
 *   transferUplcError: (site: any, msg: string) => any,
 *   transferUplcForce: (site: any, expr: any) => any,
 *   transferUplcInt: (site: any, value: bigint, signed: boolean) => any,
 *   transferUplcLambda: (site: any, rhs: any, name: null | string) => any,
 *   transferUplcList: (site: any, itemType: any, items: any[]) => any,
 *   transferUplcPair: (site: any, first: any, second: any) => any,
 *   transferUplcString: (site: any, value: string) => any,
 *   transferUplcType: (typeBits: string) => any,
 *   transferUplcUnit: (site: any) => any,
 *   transferUplcVariable: (site: any, index: any) => any
 * }} TransferUplcAst
 */
/**
 * Converts a hexadecimal string into a list of bytes.
 * @example
 * hexToBytes("00ff34") == [0, 255, 52]
 * @param {string} hex
 * @returns {number[]}
 */
export function hexToBytes(hex: string): number[];
/**
 * Converts a list of uint8 bytes into its hexadecimal string representation.
 * @example
 * bytesToHex([0, 255, 52]) == "00ff34"
 * @param {number[]} bytes
 * @returns {string}
 */
export function bytesToHex(bytes: number[]): string;
/**
 * Encodes a string into a list of uint8 bytes using UTF-8 encoding.
 * @example
 * textToBytes("hello world") == [104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]
 * @param {string} str
 * @returns {number[]}
 */
export function textToBytes(str: string): number[];
/**
 * Decodes a list of uint8 bytes into a string using UTF-8 encoding.
 * @example
 * bytesToText([104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]) == "hello world"
 * @param {number[]} bytes
 * @returns {string}
 */
export function bytesToText(bytes: number[]): string;
/**
 * Template string tag function that doesn't do anything and just returns the template string as a string.
 * Can be used as a marker of Helios sources so that syntax highlighting can work inside JS/TS files.
 * @example
 * hl`hello ${"world"}!` == "hello world!"
 * @param {string[]} a
 * @param  {...any} b
 * @returns {string}
 */
export function hl(a: string[], ...b: any[]): string;
/**
 * Deserializes a flat encoded `UplcProgram`.
 * @param {number[]} bytes
 * @param {ProgramProperties} properties
 * @returns {UplcProgram}
 */
export function deserializeUplcBytes(bytes: number[], properties?: ProgramProperties): UplcProgram;
/**
 * Parses a plutus core program. Returns a `UplcProgram` instance.
 * @param {string | {cborHex: string}} json a raw JSON string or a parsed JSON object
 * @returns {UplcProgram}
 */
export function deserializeUplc(json: string | {
    cborHex: string;
}): UplcProgram;
/**
 * @template {HeliosData} T
 */
/**
 * Quickly extract the script purpose header of a script source, by parsing only the minimally necessary characters.
 * @param {string} rawSrc
 * @returns {null | [ScriptPurpose, string]} Returns `null` if the script header is missing or syntactically incorrect. The first string returned is the script purpose, the second value returned is the script name.
 */
export function extractScriptPurposeAndName(rawSrc: string): null | [ScriptPurpose, string];
/**
 * Returns Uint8Array with the same length as the number of chars in the script.
 * Each resulting byte respresents a different syntax category.
 * This approach should be faster than a RegExp based a approach.
 * @param {string} src
 * @returns {Uint8Array}
 */
export function highlight(src: string): Uint8Array;
/**
 * Current version of the Helios library.
 */
export const VERSION: "0.15.11";
/**
 * Mutable global config properties.
 * @namespace
 */
export namespace config {
    /**
     * Modify the config properties
     * @param {{
     *   DEBUG?: boolean
     *   STRICT_BABBAGE?: boolean
     *   IS_TESTNET?: boolean
     *   N_DUMMY_INPUTS?: number
     *   AUTO_SET_VALIDITY_RANGE?: boolean
     *   VALIDITY_RANGE_START_OFFSET?: number
     *   VALIDITY_RANGE_END_OFFSET?: number
     *   IGNORE_UNEVALUATED_CONSTANTS?: boolean
     *   CHECK_CASTS?: boolean
     *   MAX_ASSETS_PER_CHANGE_OUTPUT?: number
     * }} props 
     */
    function set(props: {
        DEBUG?: boolean | undefined;
        STRICT_BABBAGE?: boolean | undefined;
        IS_TESTNET?: boolean | undefined;
        N_DUMMY_INPUTS?: number | undefined;
        AUTO_SET_VALIDITY_RANGE?: boolean | undefined;
        VALIDITY_RANGE_START_OFFSET?: number | undefined;
        VALIDITY_RANGE_END_OFFSET?: number | undefined;
        IGNORE_UNEVALUATED_CONSTANTS?: boolean | undefined;
        CHECK_CASTS?: boolean | undefined;
        MAX_ASSETS_PER_CHANGE_OUTPUT?: number | undefined;
    }): void;
    /**
     * Global debug flag. Currently unused.
     * 
     * Default: `false`.
     * @type {boolean}
     */
    const DEBUG: boolean;
    /**
     * If true, `TxOutput` is serialized using strictly the Babagge cddl format (slightly more verbose).
     * 
     * Default: `false`.
     * @type {boolean}
     */
    const STRICT_BABBAGE: boolean;
    /**
     * If true, `Address` instances are assumed to be for a Testnet when constructing from hashes or raw bytes, otherwise for mainnet.
     * 
     * Defaults: `true`.
     * @type {boolean}
     */
    const IS_TESTNET: boolean;
    /**
     * Calculating the execution budget during tx building requires knowing all the inputs beforehand,
     * which is very difficult because balancing is done after the budget is calculated.
     * Instead we use at least 1 dummy input, which should act as a representative balancing input.
     * For increased robustness we use 2 dummy inputs, one with Txid 0 and other with TxId ffff...,
     * because eg. there are cases where the TxId is being printed,
     * and a Txid of ffff... would overestimate the fee for that.
     * This value must be '1' or '2'.
     * 
     * Default: 2.
     * @deprecated
     * @type {number}
     */
    const N_DUMMY_INPUTS: number;
    /**
     * The validity time range can be set automatically if a call to tx.time_range in a Helios script is detected.
     * If `false` the validity range is still set automatically if not set manually but a warning is printed.
     * 
     * Default: `false`.
     * @type {boolean}
     */
    const AUTO_SET_VALIDITY_RANGE: boolean;
    /**
     * Lower offset wrt. the current system time when setting the validity range automatically.
     * 
     * Defaut: 90 seconds.
     * @type {number} seconds
     */
    const VALIDITY_RANGE_START_OFFSET: number;
    /**
     * Upper offset wrt. the current system time when setting the validity range automatically.
     * 
     * Default: 300 seconds.
     * @type {number} seconds
     */
    const VALIDITY_RANGE_END_OFFSET: number;
    /**
     * Ignore constants that can't be evaluated during compile-time.
     * 
     * Default: `false`.
     * @type {boolean}
     */
    const IGNORE_UNEVALUATED_CONSTANTS: boolean;
    /**
     * Check that `from_data` casts make sense during runtime. This ony impacts unsimplified UplcPrograms.
     * 
     * Default: `false`.
     * @type {boolean}
     */
    const CHECK_CASTS: boolean;
    /**
     * Maximum number of assets per change output. Used to break up very large asset outputs into multiple outputs.
     * 
     * Default: `undefined` (no limit).
     */
    const MAX_ASSETS_PER_CHANGE_OUTPUT: undefined;
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
    /**
     * @param {string} raw
     * @param {string} name
     */
    constructor(raw: string, name: string);
    /**
     * @param {TransferUplcAst} other
     * @returns {any}
     */
    transfer(other: TransferUplcAst): any;
    /**
     * @type {Error[]}
     */
    get errors(): Error[];
    throwErrors(): void;
    #private;
}
/**
 * Each Token/Expression/Statement has a Site, which encapsulates a position in a Source
 */
export class Site {
    static dummy(): Site;
    /**
     * @param {Source} src
     * @param {number} startPos
     * @param {number} endPos
     * @param {Site | null} codeMapSite
     */
    constructor(src: Source, startPos: number, endPos?: number, codeMapSite?: Site | null);
    /**
     *
     * @param {TransferUplcAst} other
     */
    transfer(other: TransferUplcAst): any;
    get src(): Source;
    get startPos(): number;
    get endPos(): number;
    get endSite(): Site | null;
    /**
     * @param {Site} other
     * @returns {Site}
     */
    merge(other: Site): Site;
    /**
     * @param {?Site} site
     */
    setEndSite(site: Site | null): void;
    /**
     * @type {?Site}
     */
    get codeMapSite(): Site | null;
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
     * Calculates the column,line position in 'this.#src'
     * @returns {[number, number, number, number]} - [startLine, startCol, endLine, endCol]
     */
    getFilePos(): [number, number, number, number];
    /**
     * @returns {string}
     */
    toString(): string;
    #private;
}
/**
 * UserErrors are generated when the user of Helios makes a mistake (eg. a syntax error).
 */
export class UserError extends Error {
    /**
     * @param {Error} e
     * @returns {boolean}
     */
    static isTypeError(e: Error): boolean;
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
    static catch<T>(fn: () => T, verbose?: boolean): T | undefined;
    /**
     * Filled with CBOR hex representations of Datum, Redeemer and ScriptContext by validation scripts throwing errors during `tx.finalize()`; and Redeemer and ScriptContext by minting scripts throwing errors.
     * @type {Object}
     */
    get context(): any;
    #private;
}
/**
 * Used for errors thrown during Uplc evaluation
 */
export class RuntimeError extends Error {
    get context(): any;
    #private;
}
/**
 * The Helios `Crypto` namespace contains a collection of cryptography primitives.
 * 
 * These functions have been implemented as part of the Helios library in order to avoid external dependencies
 * (there still isn't a standardized Javascript [Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto) that provides all the needed functionality).
 * @namespace
 */
export namespace Crypto {
    /**
     * A simple pseudo-random number generator for use in tests that requires some randomness but need to be deterministic
     * (i.e. each test run gives the same result).
     * @param {number} seed
     * @returns {NumberGenerator} The returned function returns a new random number between 0 and 1 upon each call.
     */
    function mulberry32(seed: number): NumberGenerator;
    /**
     * Alias for `mulberry32`.
     * @param {number} seed
     * @returns {NumberGenerator} The returned function returns a new random number between 0 and 1 upon each call.
     */
    function rand(seed: number): NumberGenerator;
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
    function encodeBase32(bytes: number[], alphabet?: string): string;
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
    function decodeBase32(encoded: string, alphabet?: string): number[];
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
    function encodeBech32(hrp: string, data: number[]): string;
    /**
     * Decomposes a Bech32 checksummed string (eg. a Cardano address), and returns the human readable part and the original bytes
     * Throws an error if checksum is invalid.
     * @example
     * bytesToHex(Crypto.decodeBech32("addr_test1wz54prcptnaullpa3zkyc8ynfddc954m9qw5v3nj7mzf2wggs2uld")[1]) == "70a9508f015cfbcffc3d88ac4c1c934b5b82d2bb281d464672f6c49539"
     * @param {string} addr 
     * @returns {[string, number[]]} First part is the human-readable part, second part is a list containing the underlying bytes.
     */
    function decodeBech32(addr: string): [string, number[]];
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
    function verifyBech32(encoded: string): boolean;
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
    function sha2_256(bytes: number[]): number[];
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
    function sha2_512(bytes: number[]): number[];
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
    function sha3(bytes: number[]): number[];
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
    function blake2b(bytes: number[], digestSize?: number): number[];
    /**
     * Hmac using sha2-256.
     * @example
     * bytesToHex(Crypto.hmacSha2_256(textToBytes("key"), textToBytes("The quick brown fox jumps over the lazy dog"))) == "f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8"
     * @param {number[]} key 
     * @param {number[]} message 
     * @returns {number[]}
     */
    function hmacSha2_256(key: number[], message: number[]): number[];
    /**
     * Hmac using sha2-512.
     * @example
     * bytesToHex(Crypto.hmacSha2_512(textToBytes("key"), textToBytes("The quick brown fox jumps over the lazy dog"))) == "b42af09057bac1e2d41708e48a902e09b5ff7f12ab428a4fe86653c73dd248fb82f948a549f7b791a5b41915ee4d1ec3935357e4e2317250d0372afa2ebeeb3a"
     * @param {number[]} key 
     * @param {number[]} message 
     * @returns {number[]}
     */
    function hmacSha2_512(key: number[], message: number[]): number[];
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
    function pbkdf2(prf: (key: number[], msg: number[]) => number[], password: number[], salt: number[], iters: number, dkLength: number): number[];
}
/**
 * The elliptic curve signature algorithm used by Cardano wallets.
 * 
 * Ported from: [https://ed25519.cr.yp.to/python/ed25519.py](https://ed25519.cr.yp.to/python/ed25519.py).
 * 
 * ExtendedPoint implementation taken from: [https://github.com/paulmillr/noble-ed25519](https://github.com/paulmillr/noble-ed25519).
 * @namespace
 */
export namespace Ed25519 {
    /**
     * Similar to `Ed25519.derivePublicKey`, but doesn't hash the input key.
     * @param {number[]} extendedKey
     * @returns {number[]} 32 byte public key.
     */
    function deriveBip32PublicKey(extendedKey: number[]): number[];
    /**
     * Derive a public key from a private key.
     * The private key can be any number of bytes (it's hashed internally).
     * The returned public key is 32 bytes long.
     * @param {number[]} privateKey
     * @returns {number[]} 32 byte public key.
     */
    function derivePublicKey(privateKey: number[]): number[];
    /**
     * Like `Ed25519.sign`, but doesn't hash the input key.
     * @param {number[]} message 
     * @param {number[]} extendedKey 
     * @returns {number[]} 64 byte signature.
     */
    function signBip32(message: number[], extendedKey: number[]): number[];
    /**
     * Creates a 64 byte signature.
     * @param {number[]} message 
     * @param {number[]} privateKey 
     * @returns {number[]} 64 byte signature.
     */
    function sign(message: number[], privateKey: number[]): number[];
    /**
     * Returns `true` if the signature is correct.
     * @param {number[]} signature 
     * @param {number[]} message 
     * @param {number[]} publicKey 
     * @returns {boolean}
     */
    function verify(signature: number[], message: number[], publicKey: number[]): boolean;
}
/**
 * Standard English Bip39 dictionary consisting of 2048 words allowing wallet root keys to be formed by a phrase of 12, 15, 18, 21 or 24 of these words.
 */
export const BIP39_DICT_EN: string[];
/**
 * @typedef {(i: number, bytes: number[]) => void} Decoder
 */
/**
 * Base class of any Cbor serializable data class
 * Also
 */
export class CborData {
    /**
     * @returns {number[]}
     */
    toCbor(): number[];
    /**
     * @returns {string}
     */
    toCborHex(): string;
}
/**
 * Helper methods for (de)serializing data to/from Cbor.
 * 
 * **Note**: Each decoding method mutates the input `bytes` by shifting it to the following CBOR element.
 * @namespace
 */
export namespace Cbor {
    function encodeHead(m: number, n: bigint): number[];
    function decodeHead(bytes: number[]): [number, bigint];
    function encodeIndefHead(m: number): number[];
    function decodeIndefHead(bytes: number[]): number;
    function isNull(bytes: number[]): boolean;
    function encodeNull(): number[];
    function decodeNull(bytes: number[]): void;
    function encodeBool(b: boolean): number[];
    function decodeBool(bytes: number[]): boolean;
    function isBytes(bytes: number[]): boolean;
    function isDefBytes(bytes: number[]): boolean;
    function isIndefBytes(bytes: number[]): boolean;
    function encodeBytes(bytes: number[], splitIntoChunks?: boolean): number[];
    function decodeBytes(bytes: number[]): number[];
    function isUtf8(bytes: number[]): boolean;
    function encodeUtf8(str: string, split?: boolean): number[];
    function decodeUtf8Internal(bytes: number[]): string;
    function decodeUtf8(bytes: number[]): string;
    function encodeInteger(n: bigint): number[];
    function decodeInteger(bytes: number[]): bigint;
    function isIndefList(bytes: number[]): boolean;
    function encodeIndefListStart(): number[];
    function encodeListInternal(list: CborData[] | number[][]): number[];
    function encodeIndefListEnd(): number[];
    function encodeList(list: CborData[] | number[][]): number[];
    function encodeIndefList(list: CborData[] | number[][]): number[];
    function isDefList(bytes: number[]): boolean;
    function encodeDefListStart(n: bigint): number[];
    function encodeDefList(list: CborData[] | number[][]): number[];
    function isList(bytes: number[]): boolean;
    function decodeList(bytes: number[], itemDecoder: Decoder): void;
    function isTuple(bytes: number[]): boolean;
    function encodeTuple(tuple: number[][]): number[];
    function decodeTuple(bytes: number[], tupleDecoder: Decoder): number;
    function isMap(bytes: number[]): boolean;
    function encodeMapInternal(pairList: [number[] | CborData, number[] | CborData][]): number[];
    function encodeMap(pairList: [number[] | CborData, number[] | CborData][]): number[];
    function decodeMap(bytes: number[], pairDecoder: Decoder): void;
    function isObject(bytes: number[]): boolean;
    function encodeObject(object: Map<number, number[] | CborData>): number[];
    function decodeObject(bytes: number[], fieldDecoder: Decoder): Set<number>;
    function encodeTag(tag: bigint): number[];
    function decodeTag(bytes: number[]): bigint;
    function isConstr(bytes: number[]): boolean;
    function encodeConstrTag(tag: number): number[];
    function encodeConstr(tag: number, fields: CborData[] | number[][]): number[];
    function decodeConstrTag(bytes: number[]): number;
    function decodeConstr(bytes: number[], fieldDecoder: Decoder): number;
}
/**
 * Base class for Plutus-core data classes (not the same as Plutus-core value classes!)
 */
export class UplcData extends CborData {
    /**
     * @param {number[] | string} bytes
     * @returns {UplcData}
     */
    static fromCbor(bytes: number[] | string): UplcData;
    /**
     * @param {TransferUplcAst} other
     * @returns {any}
     */
    transfer(other: TransferUplcAst): any;
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
     * @returns {string}
     */
    toSchemaJson(): string;
}
/**
 * Represents an unbounded integer (bigint).
 */
export class IntData extends UplcData {
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
     * @param {number[]} bytes
     */
    constructor(bytes: number[]);
    /**
     * @returns {string}
     */
    toHex(): string;
    /**
     * @type {string}
     */
    get hex(): string;
    #private;
}
/**
 * Represents a list of other `UplcData` instances.
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
 * Represents a list of pairs of other `UplcData` instances.
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
 * Represents a tag index and a list of `UplcData` fields.
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
 * @deprecated
 */
export class HeliosData extends CborData {
    /**
     * @returns {string}
     */
    toSchemaJson(): string;
}
/**
 * @deprecated
 * @typedef {number | bigint} HIntProps
 */
/**
 * Helios Int type
 * @deprecated
 */
export class HInt extends HeliosData {
    /**
     * @param {HInt | HIntProps} props
     * @returns {HInt}
     */
    static fromProps(props: HInt | HIntProps): HInt;
    /**
     * @param {UplcData} data
     * @returns {HInt}
     */
    static fromUplcData(data: UplcData): HInt;
    /**
     * @param {string | number[]} bytes
     * @returns {HInt}
     */
    static fromUplcCbor(bytes: string | number[]): HInt;
    /**
     * @param {number[]} bytes
     * @returns {HInt}
     */
    static fromCbor(bytes: number[]): HInt;
    /**
     * @param {HIntProps} rawValue
     */
    constructor(rawValue: HIntProps);
    /**
     * @type {bigint}
     */
    get value(): bigint;
    /**
     * @returns {string}
     */
    dump(): string;
    /**
     * @param {HInt | HIntProps} other
     * @returns {boolean}
     */
    eq(other: HInt | HIntProps): boolean;
    /**
     * @param {HInt | HIntProps} other
     * @returns {boolean}
     */
    neq(other: HInt | HIntProps): boolean;
    /**
     * @param {HInt | HIntProps} other
     * @returns {boolean}
     */
    ge(other: HInt | HIntProps): boolean;
    /**
     * @param {HInt | HIntProps} other
     * @returns {boolean}
     */
    gt(other: HInt | HIntProps): boolean;
    /**
     * @param {HInt | HIntProps} other
     * @returns {boolean}
     */
    le(other: HInt | HIntProps): boolean;
    /**
     * @param {HInt | HIntProps} other
     * @returns {boolean}
     */
    lt(other: HInt | HIntProps): boolean;
    /**
     * @param {HInt| HIntProps} other
     * @returns {HInt}
     */
    add(other: HInt | HIntProps): HInt;
    /**
     * @param {HInt | HIntProps} other
     * @returns {HInt}
     */
    sub(other: HInt | HIntProps): HInt;
    /**
     * @param {HInt| HIntProps} other
     * @returns {HInt}
     */
    mul(other: HInt | HIntProps): HInt;
    #private;
}
/**
 * @deprecated
 * @typedef {number[] | string} ByteArrayProps
 */
/**
 * Helios ByteArray type
 * @deprecated
 */
export class ByteArray extends HeliosData {
    /**
     * @param {ByteArray | ByteArrayProps} props
     * @returns {ByteArray}
     */
    static fromProps(props: ByteArray | ByteArrayProps): ByteArray;
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
     * @param {number[]} bytes
     * @returns {ByteArray}
     */
    static fromCbor(bytes: number[]): ByteArray;
    /**
     * @param {ByteArrayProps} props
     */
    constructor(props: ByteArrayProps);
    /**
     * @type {number[]}
     */
    get bytes(): number[];
    /**
     * Hexadecimal representation.
     * @type {string}
     */
    get hex(): string;
    /**
     * @param {ByteArray | ByteArrayProps} other
     * @returns {boolean}
     */
    eq(other: ByteArray | ByteArrayProps): boolean;
    #private;
}
/**
 * @typedef {number[] | string} HashProps
 */
/**
 * Base class of all hash-types
 */
export class Hash extends HeliosData {
    /**
     * @param {Hash | HashProps} props
     * @returns {Hash}
     */
    static fromProps(props: Hash | HashProps): Hash;
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
     * @param {HashProps} props
     */
    constructor(props: HashProps);
    /**
     * @readonly
     * @type {number[]}
     */
    readonly bytes: number[];
    /**
     * Hexadecimal representation.
     * @returns {string}
     */
    get hex(): string;
    /**
     * @param {Hash} other
     * @returns {boolean}
     */
    eq(other: Hash): boolean;
}
/**
 * @typedef {HashProps} DatumHashProps
 */
/**
 * Represents a blake2b-256 hash of datum data.
 */
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
}
/**
 * @typedef {number[] | string} PubKeyProps
 */
export class PubKey extends HeliosData {
    /**
     * @param {PubKey | PubKeyProps} props
     * @returns {PubKey}
     */
    static fromProps(props: PubKey | PubKeyProps): PubKey;
    /**
     * @returns {PubKey}
     */
    static dummy(): PubKey;
    /**
     * @param {UplcData} data
     * @returns {PubKey}
     */
    static fromUplcData(data: UplcData): PubKey;
    /**
     * @param {string | number[]} bytes
     * @returns {PubKey}
     */
    static fromUplcCbor(bytes: string | number[]): PubKey;
    /**
     * @param {number[]} bytes
     * @returns {PubKey}
     */
    static fromCbor(bytes: number[]): PubKey;
    /**
     * @param {PubKeyProps} props
     */
    constructor(props: PubKeyProps);
    /**
     * @type {number[]}
     */
    get bytes(): number[];
    /**
     * Hexadecimal representation.
     * @type {string}
     */
    get hex(): string;
    /**
     * Can also be used as a Stake key hash
     * @type {PubKeyHash}
     */
    get pubKeyHash(): PubKeyHash;
    /**
     * @returns {boolean}
     */
    isDummy(): boolean;
    /**
     * @returns {number[]}
     */
    hash(): number[];
    /**
     * @returns {string}
     */
    dump(): string;
    #private;
}
/**
 * Represents a blake2b-224 hash of a PubKey
 *
 * **Note**: A `PubKeyHash` can also be used as the second part of a payment `Address`, or to construct a `StakeAddress`.
 * @typedef {HashProps} PubKeyHashProps
 */
export class PubKeyHash extends Hash {
    /**
     * @returns {PubKeyHash}
     */
    static dummy(): PubKeyHash;
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
}
/**
 * Base class of MintingPolicyHash, ValidatorHash and StakingValidatorHash
 */
export class ScriptHash extends Hash {
}
/**
 * @typedef {HashProps} MintingPolicyHashProps
 */
/**
 * Represents a blake2b-224 hash of a minting policy script
 *
 * **Note**: to calculate this hash the script is first encoded as a CBOR byte-array and then prepended by a script version byte.
 */
export class MintingPolicyHash extends ScriptHash {
    /**
     * @param {MintingPolicyHash | MintingPolicyHashProps} props
     * @returns {MintingPolicyHash}
     */
    static fromProps(props: MintingPolicyHash | MintingPolicyHashProps): MintingPolicyHash;
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
/**
 * @typedef {HashProps} StakingValidatorHashProps
 */
/**
 * Represents a blake2b-224 hash of a staking script.
 *
 * **Note**: before hashing, the staking script is first encoded as a CBOR byte-array and then prepended by a script version byte.
 */
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
/**
 * @typedef {HashProps} ValidatorHashProps
 */
/**
 * Represents a blake2b-224 hash of a spending validator script (first encoded as a CBOR byte-array and prepended by a script version byte).
 */
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
 * @typedef {HashProps} TxIdProps
 */
/**
 * Represents the hash of a transaction.
 *
 * This is also used to identify an UTxO (along with the index of the UTxO in the list of UTxOs created by the transaction).
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
     * @param {number} fill
     * @returns {TxId}
     */
    static dummy(fill?: number): TxId;
}
/**
 * @typedef {string | [
 * 	 TxId | TxIdProps,
 *   HInt | HIntProps
 * ] | {
 *   txId: TxId | TxIdProps
 *   utxoId: HInt | HIntProps
 * }} TxOutputIdProps
 */
/**
 * Id of a Utxo
 */
export class TxOutputId extends HeliosData {
    /**
     * @param  {TxOutputIdProps} props
     * @returns {[TxId | TxIdProps, HInt | HIntProps]}
     */
    static cleanConstructorArgs(props: TxOutputIdProps): [TxId | TxIdProps, HInt | HIntProps];
    /**
     * @returns {TxOutputId}
     */
    static dummy(): TxOutputId;
    /**
     * @param {TxOutputId | TxOutputIdProps} props
     * @returns {TxOutputId}
     */
    static fromProps(props: TxOutputId | TxOutputIdProps): TxOutputId;
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
     * @param {string | number[]} rawBytes
     * @returns {TxOutputId}
     */
    static fromCbor(rawBytes: string | number[]): TxOutputId;
    /**
     *
     * @param {TxOutputId} a
     * @param {TxOutputId} b
     * @returns {number}
     */
    static comp(a: TxOutputId, b: TxOutputId): number;
    /**
     * @overload
     * @param {TxId} txId
     * @param {bigint | number} utxoId
     */
    /**
     * @overload
     * @param {TxOutputIdProps} props
     */
    /**
     * @param {([TxOutputIdProps] | [TxId, bigint | number])} args
     */
    constructor(...args: ([TxOutputIdProps] | [TxId, bigint | number]));
    /**
     * @type {TxId}
     */
    get txId(): TxId;
    /**
     * @type {number}
     */
    get utxoIdx(): number;
    /**
     * @param {TxOutputId} other
     * @returns {boolean}
     */
    eq(other: TxOutputId): boolean;
    /**
     * @returns {ConstrData}
     */
    _toUplcData(): ConstrData;
    #private;
}
/**
 * An array of bytes, a Bech32 encoded address, or the hexadecimal representation of the underlying bytes.
 * @typedef {number[] | string} AddressProps
 */
/**
 * Wrapper for Cardano address bytes. An `Address` consists of three parts internally:
 *   * Header (1 byte, see [CIP 19](https://cips.cardano.org/cips/cip19/))
 *   * Witness hash (28 bytes that represent the `PubKeyHash` or `ValidatorHash`)
 *   * Optional staking credential (0 or 28 bytes)
 */
export class Address extends HeliosData {
    /**
     * @param {Address | AddressProps} props
     * @returns {Address}
     */
    static fromProps(props: Address | AddressProps): Address;
    /**
     * Returns a dummy address (based on a PubKeyHash with all null bytes)
     * @returns {Address}
     */
    static dummy(): Address;
    /**
     * Deserializes bytes into an `Address`.
     * @param {number[]} bytes
     * @returns {Address}
     */
    static fromCbor(bytes: number[]): Address;
    /**
     * Converts a Bech32 string into an `Address`.
     * @param {string} str
     * @returns {Address}
     */
    static fromBech32(str: string): Address;
    /**
     * Constructs an `Address` using a hexadecimal string representation of the address bytes.
     * Doesn't check validity.
     * @param {string} hex
     * @returns {Address}
     */
    static fromHex(hex: string): Address;
    /**
    * Constructs an Address using either a `PubKeyHash` (i.e. simple payment address)
    * or `ValidatorHash` (i.e. script address),
    * without a staking hash.
    * @param {PubKeyHash | ValidatorHash} hash
    * @param {boolean} isTestnet Defaults to `config.IS_TESTNET`
    * @returns {Address}
    */
    static fromHash(hash: PubKeyHash | ValidatorHash, isTestnet?: boolean): Address;
    /**
     * Constructs an Address using either a `PubKeyHash` (i.e. simple payment address)
     * or `ValidatorHash` (i.e. script address),
     * in combination with an optional staking hash (`PubKeyHash` or `StakingValidatorHash`).
     * @param {PubKeyHash | ValidatorHash} hash
     * @param {null | (PubKeyHash | StakingValidatorHash)} stakingHash
     * @param {boolean} isTestnet Defaults to `config.IS_TESTNET`
     * @returns {Address}
     */
    static fromHashes(hash: PubKeyHash | ValidatorHash, stakingHash?: null | (PubKeyHash | StakingValidatorHash), isTestnet?: boolean): Address;
    /**
     * Returns `true` if the given `Address` is a testnet address.
     * @param {Address} address
     * @returns {boolean}
     */
    static isForTestnet(address: Address): boolean;
    /**
     * @param {UplcData} data
     * @param {boolean} isTestnet
     * @returns {Address}
     */
    static fromUplcData(data: UplcData, isTestnet?: boolean): Address;
    /**
     * @param {number[] | string} bytesOrBech32String
     */
    constructor(bytesOrBech32String: number[] | string);
    /**
     * @type {number[]}
     */
    get bytes(): number[];
    /**
     * Converts a `Address` into its hexadecimal representation.
     * @returns {string}
     */
    toHex(): string;
    /**
     * Converts a `Address` into its hexadecimal representation.
     * @returns {string}
     */
    get hex(): string;
    /**
     * Converts an `Address` into its Bech32 representation.
     * @returns {string}
     */
    toBech32(): string;
    /**
     * @param {Address} other
     * @returns {boolean}
     */
    eq(other: Address): boolean;
    /**
     * @returns {Object}
     */
    dump(): any;
    /**
     * Returns the underlying `PubKeyHash` of a simple payment address, or `null` for a script address.
     * @type {null | PubKeyHash}
     */
    get pubKeyHash(): PubKeyHash | null;
    /**
     * Returns the underlying `ValidatorHash` of a script address, or `null` for a regular payment address.
     * @type {null | ValidatorHash}
     */
    get validatorHash(): ValidatorHash | null;
    /**
     * Returns the underlying `PubKeyHash` or `StakingValidatorHash`, or `null` for non-staked addresses.
     * @type {null | PubKeyHash | StakingValidatorHash}
     */
    get stakingHash(): PubKeyHash | StakingValidatorHash | null;
    #private;
}
/**
 * @typedef {string | [
 *   MintingPolicyHash | MintingPolicyHashProps,
 *   ByteArray | ByteArrayProps
 * ] | {
 *   mph: MintingPolicyHash | MintingPolicyHashProps,
 *   tokenName: ByteArray | ByteArrayProps
 * }} AssetClassProps
 */
/**
 * Represents a `MintingPolicyHash` combined with a token name.
 */
export class AssetClass extends HeliosData {
    /**
     * @param {AssetClass | AssetClassProps} props
     * @returns {AssetClass}
     */
    static fromProps(props: AssetClass | AssetClassProps): AssetClass;
    /**
     *
     * @param {UplcData} data
     * @returns {AssetClass}
     */
    static fromUplcData(data: UplcData): AssetClass;
    /**
     * Deserializes bytes into an `AssetClass`.
     * @param {number[]} bytes
     * @returns {AssetClass}
     */
    static fromCbor(bytes: number[]): AssetClass;
    /**
     * @param {string | number[]} bytes
     * @returns {AssetClass}
     */
    static fromUplcCbor(bytes: string | number[]): AssetClass;
    /**
     * @type {AssetClass}
     */
    static get ADA(): AssetClass;
    /**
     * Intelligently converts arguments.
     *
     * The format for single argument string is "<hex-encoded-mph>.<hex-encoded-token-name>".
     * @param {AssetClassProps} props
     */
    constructor(props: AssetClassProps);
    /**
     * @type {MintingPolicyHash}
     */
    get mintingPolicyHash(): MintingPolicyHash;
    /**
     * @type {ByteArray}
     */
    get tokenName(): ByteArray;
    /**
     * Used when generating script contexts for running programs
     * @returns {ConstrData}
     */
    _toUplcData(): ConstrData;
    /**
     * Cip14 fingerprint
     * This involves a hash, so you can't use a fingerprint to calculate the underlying policy/tokenName.
     * @returns {string}
     */
    toFingerprint(): string;
    #private;
}
/**
 * @typedef {[
 *   AssetClass | AssetClassProps,
 *   HInt | HIntProps
 * ][] | [
 *   MintingPolicyHash | MintingPolicyHashProps,
 *   [
 *     ByteArray | ByteArrayProps,
 *     HInt | HIntProps
 *   ][]
 * ][]} AssetsProps
 */
/**
 * Represents a list of non-Ada tokens.
 */
export class Assets extends CborData {
    /**
     * @param {Assets | AssetsProps} props
     * @returns {Assets}
     */
    static fromProps(props: Assets | AssetsProps): Assets;
    /**
     * @param {number[]} bytes
     * @returns {Assets}
     */
    static fromCbor(bytes: number[]): Assets;
    /**
     * **Note**: the assets are normalized by removing entries with 0 tokens, and merging all entries with the same MintingPolicyHash and token name.
     * @param {AssetsProps} props Either a list of `AssetClass`/quantity pairs, or a list of `MintingPolicyHash`/`tokens` pairs (where each `tokens` entry is a bytearray/quantity pair).
     */
    constructor(props?: AssetsProps);
    /**
     * @private
     * @type {[MintingPolicyHash, [ByteArray, HInt][]][]}
     */
    private assets;
    /**
     * Returns a list of all the minting policies.
     * @type {MintingPolicyHash[]}
     */
    get mintingPolicies(): MintingPolicyHash[];
    /**
     * @type {number}
     */
    get nTokenTypes(): number;
    /**
     * Returns empty if mph not found
     * @param {MintingPolicyHash} mph
     * @returns {[ByteArray, HInt][]}
     */
    getTokens(mph: MintingPolicyHash): [ByteArray, HInt][];
    /**
     * @returns {boolean}
     */
    isZero(): boolean;
    /**
     * @param {MintingPolicyHash | MintingPolicyHashProps} mph
     * @param {ByteArray | ByteArrayProps} tokenName
     * @returns {boolean}
     */
    has(mph: MintingPolicyHash | MintingPolicyHashProps, tokenName: ByteArray | ByteArrayProps): boolean;
    /**
     * @param {MintingPolicyHash | MintingPolicyHashProps} mph
     * @param {ByteArray | ByteArrayProps} tokenName
     * @returns {bigint}
     */
    get(mph: MintingPolicyHash | MintingPolicyHashProps, tokenName: ByteArray | ByteArrayProps): bigint;
    /**
     * Mutates 'this'
     */
    removeZeroes(): void;
    /**
     * Removes zeros and merges duplicates.
     * In-place algorithm.
     * Keeps the same order as much as possible.
     */
    normalize(): void;
    /**
     * Mutates 'this'.
     * @param {MintingPolicyHash | MintingPolicyHashProps} mph
     * @param {ByteArray | ByteArrayProps} tokenName
     * @param {HInt | HIntProps} qty
     */
    addComponent(mph: MintingPolicyHash | MintingPolicyHashProps, tokenName: ByteArray | ByteArrayProps, qty: HInt | HIntProps): void;
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
     * @param {HInt | HIntProps} scalar
     * @returns {Assets}
     */
    mul(scalar: HInt | HIntProps): Assets;
    /**
     * Mutates 'this'.
     * Throws error if mph is already contained in 'this'.
     * @param {MintingPolicyHash | MintingPolicyHashProps} mph
     * @param {[ByteArray | ByteArrayProps, HInt | HIntProps][]} tokens
     */
    addTokens(mph: MintingPolicyHash | MintingPolicyHashProps, tokens: [ByteArray | ByteArrayProps, HInt | HIntProps][]): void;
    /**
     * @param {MintingPolicyHash | MintingPolicyHashProps} mph
     * @returns {ByteArray[]}
     */
    getTokenNames(mph: MintingPolicyHash | MintingPolicyHashProps): ByteArray[];
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
     * Makes sure minting policies are in correct order, and for each minting policy make sure the tokens are in the correct order
     * Mutates 'this'
     */
    sort(): void;
    assertSorted(): void;
}
/**
 * @typedef {HInt | HIntProps | [
 *   HInt | HIntProps,
 *   Assets | AssetsProps
 * ] | {
 *   lovelace: HInt| HIntProps,
 *   assets?:   Assets | AssetsProps
 * }} ValueProps
 */
/**
 * Represents a collection of tokens.
 */
export class Value extends HeliosData {
    /**
     * @param {ValueProps} props
     * @param {null | Assets | AssetsProps} maybeAssets
     * @returns {[HInt | HIntProps, Assets | AssetsProps]}
     */
    static cleanConstructorArgs(props: ValueProps, maybeAssets: null | Assets | AssetsProps): [HInt | HIntProps, Assets | AssetsProps];
    /**
     * @param {ValueProps | Value} props
     * @returns {Value}
     */
    static fromProps(props: ValueProps | Value): Value;
    /**
     * @param {MintingPolicyHash | MintingPolicyHashProps} mph
     * @param {ByteArray | ByteArrayProps} tokenName
     * @param {HInt | HIntProps} qty
     * @returns {Value}
     */
    static asset(mph: MintingPolicyHash | MintingPolicyHashProps, tokenName: ByteArray | ByteArrayProps, qty: HInt | HIntProps): Value;
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
     * Converts a `UplcData` instance into a `Value`. Throws an error if it isn't in the right format.
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
     * @param {ValueProps} props
     * @param {null | Assets | AssetsProps} assets
     */
    constructor(props?: ValueProps, assets?: null | Assets | AssetsProps);
    /**
     * Gets the `Assets` contained in the `Value`.
     * @type {Assets}
     */
    get assets(): Assets;
    /**
     * Gets the lovelace quantity contained in the `Value`.
     * @type {bigint}
     */
    get lovelace(): bigint;
    /**
     * Mutates the quantity of lovelace in a `Value`.
     * @param {HInt | HIntProps} lovelace
     */
    setLovelace(lovelace: HInt | HIntProps): void;
    /**
     * Adds two `Value` instances together. Returns a new `Value` instance.
     * @param {Value} other
     * @returns {Value}
     */
    add(other: Value): Value;
    /**
     * Substracts one `Value` instance from another. Returns a new `Value` instance.
     * @param {Value} other
     * @returns {Value}
     */
    sub(other: Value): Value;
    /**
     * Multiplies a `Value` by a whole number.
     * @param {HInt | HIntProps} scalar
     * @returns {Value}
     */
    mul(scalar: HInt | HIntProps): Value;
    /**
     * Checks if two `Value` instances are equal (`Assets` need to be in the same order).
     * @param {Value} other
     * @returns {boolean}
     */
    eq(other: Value): boolean;
    /**
     * Checks if a `Value` instance is strictly greater than another `Value` instance. Returns false if any asset is missing.
     * @param {Value} other
     * @returns {boolean}
     */
    gt(other: Value): boolean;
    /**
     * Checks if a `Value` instance is strictly greater or equal to another `Value` instance. Returns false if any asset is missing.
     * @param {Value} other
     * @returns {boolean}
     */
    ge(other: Value): boolean;
    /**
     * Throws an error if any of the `Value` entries is negative.
     *
     * Used when building transactions because transactions can't contain negative values.
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
 * @typedef {() => bigint} LiveSlotGetter
 */
/**
 * Wrapper for the raw JSON containing all the current network parameters.
 *
 * NetworkParams is needed to be able to calculate script budgets and perform transaction building checks.
 *
 * The raw JSON can be downloaded from the following CDN locations:
 *
 *  - Preview: [https://d1t0d7c2nekuk0.cloudfront.net/preview.json](https://d1t0d7c2nekuk0.cloudfront.net/preview.json)
 *  - Preprod: [https://d1t0d7c2nekuk0.cloudfront.net/preprod.json](https://d1t0d7c2nekuk0.cloudfront.net/preprod.json)
 *  - Mainnet: [https://d1t0d7c2nekuk0.cloudfront.net/mainnet.json](https://d1t0d7c2nekuk0.cloudfront.net/mainnet.json)
 *
 * These JSONs are updated every 15 minutes.
 */
export class NetworkParams {
    /**
     * @param {Object} raw
     * @param {null | LiveSlotGetter} liveSlotGetter
     */
    constructor(raw: any, liveSlotGetter?: null | LiveSlotGetter);
    /**
     * @type {Object}
     */
    get raw(): any;
    /**
     * @type {null | bigint}
     */
    get liveSlot(): bigint | null;
    /**
     * Calculates the time (in milliseconds in 01/01/1970) associated with a given slot number.
     * @param {bigint} slot
     * @returns {bigint}
     */
    slotToTime(slot: bigint): bigint;
    /**
     * Calculates the slot number associated with a given time. Time is specified as milliseconds since 01/01/1970.
     * @param {bigint} time Milliseconds since 1970
     * @returns {bigint}
     */
    timeToSlot(time: bigint): bigint;
    #private;
}
/**
 * A Helios/Uplc Program can have different purposes
 * @typedef {"testing" | "minting" | "spending" | "staking" | "endpoint" | "module" | "unknown"} ScriptPurpose
 */
/**
 * a UplcValue is passed around by Plutus-core expressions.
 */
export class UplcValue {
    /**
     * @param {Site} site
     */
    constructor(site: Site);
    /**
     * @param {TransferUplcAst} other
     * @returns {any}
     */
    transfer(other: TransferUplcAst): any;
    /**
     * @returns {boolean}
     */
    isAny(): boolean;
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
     * @returns {string}
     */
    toString(): string;
    #private;
}
/**
 * Represents the typeBits of a UPLC primitive.
 */
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
     * @param {TransferUplcAst} other
     * @returns {any}
     */
    transfer(other: TransferUplcAst): any;
    /**
     * @returns {string}
     */
    typeBits(): string;
    /**
     * @param {UplcValue} value
     * @returns {boolean}
     */
    isSameType(value: UplcValue): boolean;
    /**
     * @returns {boolean}
     */
    isData(): boolean;
    /**
     * @returns {boolean}
     */
    isDataPair(): boolean;
    #private;
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
 * Configures the Uplc evaluator to print messages to `console`.
 * @type {UplcRTECallbacks}
 */
export const DEFAULT_UPLC_RTE_CALLBACKS: UplcRTECallbacks;
/**
 * Primitive equivalent of `IntData`.
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
    /**
     * @readonly
     * @type {bigint}
     */
    readonly value: bigint;
    /**
     * @readonly
     * @type {boolean}
     */
    readonly signed: boolean;
    /**
     * @param {Site} newSite
     * @returns {UplcInt}
     */
    copy(newSite: Site): UplcInt;
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
    toUnsigned(): UplcInt;
    /**
     * Unapplies zigzag encoding
     * @example
     * (new UplcInt(Site.dummy(), 1n, false)).toSigned().int == -1n
     * @returns {UplcInt}
    */
    toSigned(): UplcInt;
}
/**
 * Primitive equivalent of `ByteArrayData`.
 */
export class UplcByteArray extends UplcValue {
    /**
     * @param {Site} site
     * @param {number[]} bytes
     */
    constructor(site: Site, bytes: number[]);
    #private;
}
/**
 * Primitive string value.
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
 * Primitive unit value.
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
 * JS/TS equivalent of the Helios language `Bool` type.
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
 * Primitive pair value.
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
    /**
     * @returns {boolean}
     */
    isDataList(): boolean;
    /**
     * @returns {boolean}
     */
    isDataMap(): boolean;
    #private;
}
/**
 *  Child type of `UplcValue` that wraps a `UplcData` instance.
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
 * Base class of Plutus-core terms
 */
export class UplcTerm {
    /**
     * @param {Site} site
     * @param {number} type
     */
    constructor(site: Site, type: number);
    /**
     * @type {number}
     */
    get type(): number;
    /**
     * @type {Site}
     */
    get site(): Site;
    /**
     * @param {TransferUplcAst} other
     * @returns {any}
     */
    transfer(other: TransferUplcAst): any;
    /**
     * Generic term toString method
     * @returns {string}
     */
    toString(): string;
    #private;
}
/**
 * Plutus-core variable ref term (index is a Debruijn index)
 */
export class UplcVariable extends UplcTerm {
    /**
     * @param {Site} site
     * @param {UplcInt} index
     */
    constructor(site: Site, index: UplcInt);
    /**
     * @readonly
     * @type {UplcInt}
     */
    readonly index: UplcInt;
}
/**
 * Plutus-core delay term.
 */
export class UplcDelay extends UplcTerm {
    /**
     * @param {Site} site
     * @param {UplcTerm} expr
     */
    constructor(site: Site, expr: UplcTerm);
    /**
     * @readonly
     * @type {UplcTerm}
     */
    readonly expr: UplcTerm;
}
/**
 * Plutus-core lambda term
 */
export class UplcLambda extends UplcTerm {
    /**
     * @param {Site} site
     * @param {UplcTerm} expr
     * @param {null | string} argName
     */
    constructor(site: Site, expr: UplcTerm, argName?: null | string);
    /**
     * @readonly
     * @type {UplcTerm}
     */
    readonly expr: UplcTerm;
    #private;
}
/**
 * Plutus-core function application term (i.e. function call)
 */
export class UplcCall extends UplcTerm {
    /**
     * @param {Site} site
     * @param {UplcTerm} fn
     * @param {UplcTerm} arg
     */
    constructor(site: Site, fn: UplcTerm, arg: UplcTerm);
    /**
     * @readonly
     * @type {UplcTerm}
     */
    readonly fn: UplcTerm;
    /**
     * @readonly
     * @type {UplcTerm}
     */
    readonly arg: UplcTerm;
}
/**
 * Plutus-core const term (i.e. a literal in conventional sense)
 */
export class UplcConst extends UplcTerm {
    /**
     * @param {UplcValue} value
     */
    constructor(value: UplcValue);
    /**
     * @readonly
     * @type {UplcValue}
     */
    readonly value: UplcValue;
}
/**
 * Plutus-core force term
 */
export class UplcForce extends UplcTerm {
    /**
     * @param {Site} site
     * @param {UplcTerm} expr
     */
    constructor(site: Site, expr: UplcTerm);
    /**
     * @readonly
     */
    readonly expr: UplcTerm;
}
/**
 * Plutus-core error term
 */
export class UplcError extends UplcTerm {
    /**
     * @param {Site} site
     * @param {string} msg
     */
    constructor(site: Site, msg?: string);
    #private;
}
/**
 * Plutus-core builtin function ref term
 */
export class UplcBuiltin extends UplcTerm {
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
     * @type {number}
     */
    get nArgs(): number;
    #private;
}
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
 * Result of `program.compile()`. Contains the Untyped Plutus-Core AST, along with a code-mapping to the original source.
 */
export class UplcProgram {
    /**
     * @param {number[] | string} bytes
     * @param {ProgramProperties} properties
     * @returns {UplcProgram}
     */
    static fromCbor(bytes: number[] | string, properties?: ProgramProperties): UplcProgram;
    /**
     * @param {number[]} bytes
     * @param {ProgramProperties} properties
     * @returns {UplcProgram}
     */
    static fromFlat(bytes: number[], properties?: ProgramProperties): UplcProgram;
    /**
     * Intended for transfer only
     * @param {any} expr
     * @param {ProgramProperties} properties
     * @param {any[]} version
     * @returns {UplcProgram}
     */
    static transferUplcProgram(expr: any, properties: ProgramProperties, version: any[]): UplcProgram;
    /**
     * @type {TransferUplcAst}
     */
    static get transferUplcAst(): TransferUplcAst;
    /**
     * @param {UplcTerm} expr
     * @param {ProgramProperties} properties
     * @param {UplcInt[]} version
     */
    constructor(expr: UplcTerm, properties?: ProgramProperties, version?: UplcInt[]);
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
     * @type {ProgramProperties}
     */
    get properties(): ProgramProperties;
    /**
     * Transfers a `UplcProgram` from an old version of Helios to a new version of Helios, keeping the script hash the same.
     *
     * The main benefit for calling this method instead of serializing/deserializing is that the code mapping is maintained.
     * @template TInstance
     * @param {TransferableUplcProgram<TInstance>} other
     * @returns {TInstance}
     */
    transfer<TInstance>(other: TransferableUplcProgram<TInstance>): TInstance;
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
     * Wrap the top-level term with consecutive UplcCall (not exported) terms.
     *
     * Returns a new UplcProgram instance, leaving the original untouched.
     *
     * Throws an error if you are trying to apply with an anon func.
     * @param {(UplcValue | HeliosData)[]} args
     * @returns {UplcProgram} - a new UplcProgram instance
     */
    apply(args: (UplcValue | HeliosData)[]): UplcProgram;
    /**
     * @param {null | UplcValue[]} args - if null the top-level term is returned as a value
     * @param {UplcRTECallbacks} callbacks
     * @param {null | NetworkParams} networkParams
     * @returns {Promise<UplcValue | RuntimeError>}
     */
    run(args: null | UplcValue[], callbacks?: UplcRTECallbacks, networkParams?: null | NetworkParams): Promise<UplcValue | RuntimeError>;
    /**
     * Run a `UplcProgram`. The printed messages are part of the return value.
     * @param {null | UplcValue[]} args
     * @returns {Promise<[(UplcValue | RuntimeError), string[]]>}
     */
    runWithPrint(args: null | UplcValue[]): Promise<[(UplcValue | RuntimeError), string[]]>;
    /**
     * Runs and profiles a `UplcProgram`. Needs the `NetworkParams` in order to calculate the execution budget.
     * @param {UplcValue[]} args
     * @param {NetworkParams} networkParams
     * @returns {Promise<Profile>} The returned profile contains a breakdown of the execution cost per Uplc term type and per Uplc builtin function type.
     */
    profile(args: UplcValue[], networkParams: NetworkParams): Promise<Profile>;
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
     * Returns the Cbor encoding of a script (flat bytes wrapped twice in Cbor bytearray).
     * @returns {number[]}
     */
    toCbor(): number[];
    /**
     * Returns the JSON representation of the serialized program (needed by cardano-cli).
     * @returns {string}
     */
    serialize(): string;
    /**
     * @returns {number[]} - 28 byte hash
     */
    hash(): number[];
    /**
     * Returns the `ValidatorHash` of the script. Throws an error if this isn't a spending validator script.
     * @type {ValidatorHash}
     */
    get validatorHash(): ValidatorHash;
    /**
     * Returns the `MintingPolicyHash` of the script. Throws an error if this isn't a minting policy.
     * @type {MintingPolicyHash}
     */
    get mintingPolicyHash(): MintingPolicyHash;
    /**
     * Returns the `StakingValidatorHash` of the script. Throws an error if this isn't a staking validator script.
     * @type {StakingValidatorHash}
     */
    get stakingValidatorHash(): StakingValidatorHash;
    #private;
}
/**
 * Helios root object
 */
export class Program {
    /**
     * Creates  a new program.
     * @param {string} mainSrc
     * @param {string[]} moduleSrcs - optional sources of modules, which can be used for imports
     * @param {ProgramConfig} config
     * @returns {Program}
     */
    static new(mainSrc: string, moduleSrcs?: string[], validatorTypes?: {}, config?: ProgramConfig): Program;
    /**
     * @type {ProgramConfig}
     */
    get config(): ProgramConfig;
    /**
     * @type {ScriptPurpose}
     */
    get purpose(): ScriptPurpose;
    /**
     * @type {string}
     */
    get name(): string;
    /**
     * @returns {string}
     */
    toString(): string;
    /**
     * @type {UserTypes}
     */
    get types(): UserTypes;
    /**
     * Doesn't use wrapEntryPoint
     * @param {string} name - can be namespace: "Type::ConstName" or "Module::ConstName" or "Module::Type::ConstName"
     * @returns {UplcValue}
     */
    evalParam(name: string): UplcValue;
    /**
     * Use proxy for setting
     * @param {{[name: string]: HeliosData | any}} values
     */
    set parameters(arg: {
        [name: string]: any;
    });
    /**
     * Alternative way to get the parameters as HeliosData instances
     * @returns {{[name: string]: HeliosData | any}}
     */
    get parameters(): {
        [name: string]: any;
    };
    /**
     * @returns {string}
     */
    prettyIR(simplify?: boolean): string;
    /**
     * @param {boolean} simplify
     * @returns {UplcProgram}
     */
    compile(simplify?: boolean): UplcProgram;
    #private;
}
/**
 * Helios supports Cardano [native scripts](https://cips.cardano.org/cips/cip29/).
 * See `Tx.attachScript()` for how `NativeScript` can be used when building a transaction.
 *
 * NativeScript allows creating basic multi-signature and time-based validators.
 * This is a legacy technology, but can be cheaper than using Plutus.
 */
export class NativeScript extends CborData {
    /**
     * @param {string | number[]} raw
     * @returns {NativeScript}
     */
    static fromCbor(raw: string | number[]): NativeScript;
    /**
     * @param {string | Object} json
     * @returns {NativeScript}
     */
    static fromJson(json: string | any): NativeScript;
    /**
     * @param {number} type
     */
    constructor(type: number);
    /**
     * @returns {number[]}
     */
    typeToCbor(): number[];
    /**
     * @returns {Object}
     */
    toJson(): any;
    /**
     * Calculates the blake2b-224 (28 bytes) hash of the NativeScript.
     *
     * **Note**: a 0 byte is prepended before to the serialized CBOR representation, before calculating the hash.
     * @returns {number[]}
     */
    hash(): number[];
    /**
     * A `NativeScript` can be used both as a Validator and as a MintingPolicy
     * @type {ValidatorHash}
     */
    get validatorHash(): ValidatorHash;
    /**
     * A `NativeScript` can be used both as a Validator and as a MintingPolicy
     * @type {MintingPolicyHash}
     */
    get mintingPolicyHash(): MintingPolicyHash;
    #private;
}
/**
 * Represents a Cardano transaction. Can also be used as a transaction builder.
 */
export class Tx extends CborData {
    /**
     * Create a new Tx builder.
     * @returns {Tx}
     */
    static new(): Tx;
    /**
     * Deserialize a CBOR encoded Cardano transaction (input is either an array of bytes, or a hex string).
     * @param {number[] | string} raw
     * @returns {Tx}
     */
    static fromCbor(raw: number[] | string): Tx;
    /**
     * Used by bundler for macro finalization
     * @param {UplcData} data
     * @param {NetworkParams} networkParams
     * @param {Address} changeAddress
     * @param {TxInput[]} spareUtxos
     * @param {{[name: string]: (UplcProgram | (() => UplcProgram))}} scripts UplcPrograms can be lazy
     * @returns {Promise<Tx>}
     */
    static finalizeUplcData(data: UplcData, networkParams: NetworkParams, changeAddress: Address, spareUtxos: TxInput[], scripts: {
        [name: string]: UplcProgram | (() => UplcProgram);
    }): Promise<Tx>;
    /**
     * Use `Tx.new()` instead of this constructor for creating a new Tx builder.
     * @param {TxBody} body
     * @param {TxWitnesses} witnesses
     * @param {boolean} valid
     * @param {null | TxMetadata} metadata
     * @param {null | bigint | Date} validTo
     * @param {null | bigint | Date} validFrom
     */
    constructor(body?: TxBody, witnesses?: TxWitnesses, valid?: boolean, metadata?: null | TxMetadata, validTo?: null | bigint | Date, validFrom?: null | bigint | Date);
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
     * Creates a new Tx without the metadata for client-side signing where the client can't know the metadata before tx-submission.
     * @returns {Tx}
     */
    withoutMetadata(): Tx;
    /**
     * @param {NetworkParams} networkParams
     * @returns {UplcData}
     */
    toTxData(networkParams: NetworkParams): UplcData;
    /**
     * A serialized tx throws away input information
     * This must be refetched from the network if the tx needs to be analyzed
     * @param {(id: TxOutputId) => Promise<TxOutput>} fn
     */
    completeInputData(fn: (id: TxOutputId) => Promise<TxOutput>): Promise<void>;
    /**
     * @param {null | NetworkParams} params If specified: dump all the runtime details of each redeemer (datum, redeemer, scriptContext)
     * @returns {Object}
     */
    dump(params?: null | NetworkParams): any;
    /**
     * Set the start of the valid time range by specifying either a Date or a slot.
     *
     * Mutates the transaction.
     * Only available during building the transaction.
     * Returns the transaction instance so build methods can be chained.
     *
     * > **Note**: since Helios v0.13.29 this is set automatically if any of the Helios validator scripts call `tx.time_range`.
     * @param {bigint | Date } slotOrTime
     * @returns {Tx}
     */
    validFrom(slotOrTime: bigint | Date): Tx;
    /**
     * Set the end of the valid time range by specifying either a Date or a slot.
     *
     * Mutates the transaction.
     * Only available during transaction building.
     * Returns the transaction instance so build methods can be chained.
     *
     * > **Note**: since Helios v0.13.29 this is set automatically if any of the Helios validator scripts call `tx.time_range`.
     * @param {bigint | Date } slotOrTime
     * @returns {Tx}
     */
    validTo(slotOrTime: bigint | Date): Tx;
    /**
     * Mint a list of tokens associated with a given `MintingPolicyHash`.
     * Throws an error if the given `MintingPolicyHash` was already used in a previous call to `mintTokens()`.
     * The token names can either by a list of bytes or a hexadecimal string.
     *
     * Mutates the transaction.
     * Only available during transaction building the transaction.
     * Returns the transaction instance so build methods can be chained.
     *
     * Also throws an error if the redeemer is `null`, and the minting policy isn't a known `NativeScript`.
     * @param {MintingPolicyHash | MintingPolicyHashProps} mph
     * @param {[ByteArray | ByteArrayProps, HInt | HIntProps][]} tokens - list of pairs of [tokenName, quantity], tokenName can be list of bytes or hex-string
     * @param {UplcDataValue | UplcData | null} redeemer
     * @returns {Tx}
     */
    mintTokens(mph: MintingPolicyHash | MintingPolicyHashProps, tokens: [ByteArray | ByteArrayProps, HInt | HIntProps][], redeemer: UplcDataValue | UplcData | null): Tx;
    /**
     * Add a UTxO instance as an input to the transaction being built.
     * Throws an error if the UTxO is locked at a script address but a redeemer isn't specified (unless the script is a known `NativeScript`).
     *
     * Mutates the transaction.
     * Only available during transaction building.
     * Returns the transaction instance so build methods can be chained.
     * @param {TxInput} input
     * @param {null | UplcDataValue | UplcData | HeliosData} rawRedeemer
     * @returns {Tx}
     */
    addInput(input: TxInput, rawRedeemer?: null | UplcDataValue | UplcData | HeliosData): Tx;
    /**
     * Add multiple UTxO instances as inputs to the transaction being built.
     * Throws an error if the UTxOs are locked at a script address but a redeemer isn't specified (unless the script is a known `NativeScript`).
     *
     * Mutates the transaction.
     * Only available during transaction building. Returns the transaction instance so build methods can be chained.
     * @param {TxInput[]} inputs
     * @param {?(UplcDataValue | UplcData | HeliosData)} redeemer
     * @returns {Tx}
     */
    addInputs(inputs: TxInput[], redeemer?: (UplcDataValue | UplcData | HeliosData) | null): Tx;
    /**
     * Add a `TxInput` instance as a reference input to the transaction being built.
     * Any associated reference script, as a `UplcProgram` instance, must also be included in the transaction at this point (so the that the execution budget can be calculated correctly).
     *
     * Mutates the transaction.
     * Only available during transaction building.
     * Returns the transaction instance so build methods can be chained.
     * @param {TxInput} input
     * @param {null | UplcProgram} refScript
     * @returns {Tx}
     */
    addRefInput(input: TxInput, refScript?: null | UplcProgram): Tx;
    /**
     * Add multiple `TxInput` instances as reference inputs to the transaction being built.
     *
     * Mutates the transaction.
     * Only available during transaction building.
     * Returns the transaction instance so build methods can be chained.
     * @param {TxInput[]} inputs
     * @returns {Tx}
     */
    addRefInputs(inputs: TxInput[]): Tx;
    /**
     * Add a `TxOutput` instance to the transaction being built.
     *
     * Mutates the transaction.
     * Only available during transaction building.
     * Returns the transaction instance so build methods can be chained.
     * @param {TxOutput} output
     * @returns {Tx}
     */
    addOutput(output: TxOutput): Tx;
    /**
     * Add multiple `TxOutput` instances at once.
     *
     * Mutates the transaction.
     * Only available during transaction building.
     * Returns the transaction instance so build methods can be chained.
     * @param {TxOutput[]} outputs
     * @returns {Tx}
     */
    addOutputs(outputs: TxOutput[]): Tx;
    /**
     * Add a signatory `PubKeyHash` to the transaction being built.
     * The added entry becomes available in the `tx.signatories` field in the Helios script.
     *
     * Mutates the transaction.
     * Only available during transaction building.
     * Returns the transaction instance so build methods can be chained.
     * @param {PubKeyHash} hash
     * @returns {Tx}
     */
    addSigner(hash: PubKeyHash): Tx;
    /**
     * Attaches a script witness to the transaction being built.
     * The script witness can be either a `UplcProgram` or a legacy `NativeScript`.
     * A `UplcProgram` instance can be created by compiling a Helios `Program`.
     * A legacy `NativeScript` instance can be created by deserializing its original CBOR representation.
     *
     * Throws an error if script has already been added.
     * Throws an error if the script isn't used upon finalization.
     *
     * Mutates the transaction.
     * Only available during transaction building.
     * Returns the transaction instance so build methods can be chained.
     *
     * > **Note**: a `NativeScript` must be attached before associated inputs are added or tokens are minted.
     * @param {UplcProgram | NativeScript} program
     * @returns {Tx}
     */
    attachScript(program: UplcProgram | NativeScript): Tx;
    /**
     * Add a UTxO instance as collateral to the transaction being built.
     * Usually adding only one collateral input is enough.
     * The number of collateral inputs must be greater than 0 if script witnesses are used in the transaction,
     * and must be less than the limit defined in the `NetworkParams`.
     *
     * Mutates the transaction.
     * Only available during transaction building.
     * Returns the transaction instance so build methods can be chained.
     * @param {TxInput} input
     * @returns {Tx}
     */
    addCollateral(input: TxInput): Tx;
    /**
     * Executes all the attached scripts with appropriate redeemers and calculates execution budgets.
     * Balances the transaction, and optionally uses some spare UTxOs if the current inputs don't contain enough lovelace to cover the fees and min output deposits.
     *
     * Inputs, minted assets, and withdrawals are sorted.
     *
     * Sets the validatity range automatically if a call to `tx.time_range` is detected in any of the attached Helios scripts.
     * @param {NetworkParams} networkParams
     * @param {Address}       changeAddress
     * @param {TxInput[]}        spareUtxos - might be used during balancing if there currently aren't enough inputs
     * @returns {Promise<Tx>}
     */
    finalize(networkParams: NetworkParams, changeAddress: Address, spareUtxos?: TxInput[]): Promise<Tx>;
    /**
     * @type {string}
     */
    get profileReport(): string;
    /**
     * Adds a signature created by a wallet. Only available after the transaction has been finalized.
     * Optionally verifies that the signature is correct.
     * @param {Signature} signature
     * @param {boolean} verify Defaults to `true`
     * @returns {Tx}
     */
    addSignature(signature: Signature, verify?: boolean): Tx;
    /**
     * Adds multiple signatures at once. Only available after the transaction has been finalized.
     * Optionally verifies each signature is correct.
     * @param {Signature[]} signatures
     * @param {boolean} verify
     * @returns {Tx}
     */
    addSignatures(signatures: Signature[], verify?: boolean): Tx;
    /**
     * Add metadata to a transaction.
     * Metadata can be used to store data on-chain,
     * but can't be consumed by validator scripts.
     * Metadata can for example be used for [CIP 25](https://cips.cardano.org/cips/cip25/).
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
/**
 * inputs, minted assets, and withdrawals need to be sorted in order to form a valid transaction
 */
export class TxBody extends CborData {
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
     * @type {TxInput[]}
     */
    get refInputs(): TxInput[];
    /**
     * @type {TxOutput[]}
     */
    get outputs(): TxOutput[];
    /**
     * @type {bigint}
     */
    get fee(): bigint;
    /**
     * @type {Assets}
     */
    get minted(): Assets;
    /**
     * @type {TxInput[]}
     */
    get collateral(): TxInput[];
    /**
     * @type {bigint | null}
     */
    get firstValidSlot(): bigint | null;
    /**
     * @type {bigint | null}
     */
    get lastValidSlot(): bigint | null;
    /**
     * @type {PubKeyHash[]}
     */
    get signers(): PubKeyHash[];
    /**
     * @returns {Object}
     */
    dump(): any;
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
    #private;
}
/**
 * Represents the pubkey signatures, and datums/redeemers/scripts that are witnessing a transaction.
 */
export class TxWitnesses extends CborData {
    /**
     * @param {number[]} bytes
     * @returns {TxWitnesses}
     */
    static fromCbor(bytes: number[]): TxWitnesses;
    /**
     * Gets the list of `Signature` instances contained in this witness set.
     * @type {Signature[]}
     */
    get signatures(): Signature[];
    /**
     * Returns all the scripts, including the reference scripts
     * @type {(UplcProgram | NativeScript)[]}
     */
    get scripts(): (UplcProgram | NativeScript)[];
    /**
     * @type {Redeemer[]}
     */
    get redeemers(): Redeemer[];
    /**
     * @type {ListData}
     */
    get datums(): ListData;
    /**
     * @param {ValidatorHash | MintingPolicyHash} h
     * @returns {boolean}
     */
    isNativeScript(h: ValidatorHash | MintingPolicyHash): boolean;
    /**
     * @param {null | NetworkParams} params
     * @param {null | TxBody} body
     * @returns {Object}
     */
    dump(params?: null | NetworkParams, body?: null | TxBody): any;
    /**
     * Compiles a report of each redeemer execution.
     * Only works after the tx has been finalized.
     * @type {string}
     */
    get profileReport(): string;
    #private;
}
/**
 * TxInput base-type
 */
export class TxInput extends CborData {
    /**
     * Deserializes TxOutput format used by wallet connector
     * @param {string | number[]} rawBytes
     * @returns {TxInput}
     */
    static fromFullCbor(rawBytes: string | number[]): TxInput;
    /**
     * @param {string | number[]} rawBytes
     * @returns {TxInput}
     */
    static fromCbor(rawBytes: string | number[]): TxInput;
    /**
     * @param {TxInput[]} inputs
     * @returns {Value}
     */
    static sumValue(inputs: TxInput[]): Value;
    /**
     * @param {TxOutputId} outputId
     * @param {null | TxOutput} output - used during building, not part of serialization
     */
    constructor(outputId: TxOutputId, output?: null | TxOutput);
    /**
     * @readonly
     * @type {TxOutputId}
     */
    readonly outputId: TxOutputId;
    /**
     * @deprecated
     * @type {TxId}
     */
    get txId(): TxId;
    /**
     * @deprecated
     * @type {number}
     */
    get utxoIdx(): number;
    /**
     *
     * @param {TxInput} other
     * @returns {boolean}
     */
    eq(other: TxInput): boolean;
    /**
     *
     * @type {TxOutput}
     */
    get output(): TxOutput;
    /**
     * Backward compatible alias for `TxInput.output`
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
     * @returns {number[]}
     */
    toFullCbor(): number[];
    /**
     * @returns {Object}
     */
    dump(): any;
    #private;
}
/**
 * Use TxInput instead
 * @deprecated
 */
export class UTxO extends TxInput {
}
/**
 * Use TxInput instead
 * @deprecated
 */
export class TxRefInput extends TxInput {
}
/**
 * Represents a transaction output that is used when building a transaction.
 */
export class TxOutput extends CborData {
    /**
     * @param {number[]} bytes
     * @returns {TxOutput}
     */
    static fromCbor(bytes: number[]): TxOutput;
    /**
     * @param {UplcData} data
     * @returns {TxOutput}
     */
    static fromUplcData(data: UplcData): TxOutput;
    /**
     * Constructs a `TxOutput` instance using an `Address`, a `Value`, an optional `Datum`, and optional `UplcProgram` reference script.
     * @param {Address} address
     * @param {Value} value
     * @param {null | Datum} datum
     * @param {null | UplcProgram} refScript
     */
    constructor(address: Address, value: Value, datum?: null | Datum, refScript?: null | UplcProgram);
    /**
     * Get the `Address` to which the `TxOutput` will be sent.
     * @type {Address}
     */
    get address(): Address;
    /**
     * Mutation is handy when correctin the quantity of lovelace in a utxo
     * @param {Address} addr
     */
    setAddress(addr: Address): void;
    /**
     * Get the `Value` contained in the `TxOutput`.
     * @type {Value}
     */
    get value(): Value;
    /**
     * Mutation is handy when correcting the quantity of lovelace in a utxo
     * @param {Value} val
     */
    setValue(val: Value): void;
    /**
     * Get the optional `Datum` associated with the `TxOutput`.
     * @type {null | Datum}
     */
    get datum(): Datum | null;
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
     * @type {null | UplcProgram}
     */
    get refScript(): UplcProgram | null;
    /**
     * @returns {Object}
     */
    dump(): any;
    /**
     * @returns {ConstrData}
     */
    toData(): ConstrData;
    /**
     * Each UTxO must contain some minimum quantity of lovelace to avoid that the blockchain is used for data storage.
     * @param {NetworkParams} networkParams
     * @returns {bigint}
     */
    calcMinLovelace(networkParams: NetworkParams): bigint;
    /**
     * Makes sure the `TxOutput` contains the minimum quantity of lovelace.
     * The network requires this to avoid the creation of unusable dust UTxOs.
     *
     * Optionally an update function can be specified that allows mutating the datum of the `TxOutput` to account for an increase of the lovelace quantity contained in the value.
     * @param {NetworkParams} networkParams
     * @param {null | ((output: TxOutput) => void)} updater
     */
    correctLovelace(networkParams: NetworkParams, updater?: ((output: TxOutput) => void) | null): void;
    #private;
}
/**
 * Wrapper for Cardano stake address bytes. An StakeAddress consists of two parts internally:
 *   - Header (1 byte, see CIP 8)
 *   - Staking witness hash (28 bytes that represent the `PubKeyHash` or `StakingValidatorHash`)
 *
 * Stake addresses are used to query the assets held by given staking credentials.
 */
export class StakeAddress {
    /**
     * Returns `true` if the given `StakeAddress` is a testnet address.
     * @param {StakeAddress} sa
     * @returns {boolean}
     */
    static isForTestnet(sa: StakeAddress): boolean;
    /**
     * Convert a regular `Address` into a `StakeAddress`.
     * Throws an error if the Address doesn't have a staking credential.
     * @param {Address} addr
     * @returns {StakeAddress}
     */
    static fromAddress(addr: Address): StakeAddress;
    /**
     * @param {number[]} bytes
     * @returns {StakeAddress}
     */
    static fromCbor(bytes: number[]): StakeAddress;
    /**
     * @param {string} str
     * @returns {StakeAddress}
     */
    static fromBech32(str: string): StakeAddress;
    /**
     * Doesn't check validity
     * @param {string} hex
     * @returns {StakeAddress}
     */
    static fromHex(hex: string): StakeAddress;
    /**
     * Converts a `PubKeyHash` or `StakingValidatorHash` into `StakeAddress`.
     * @param {boolean} isTestnet
     * @param {PubKeyHash | StakingValidatorHash} hash
     * @returns {StakeAddress}
     */
    static fromHash(isTestnet: boolean, hash: PubKeyHash | StakingValidatorHash): StakeAddress;
    /**
     * @param {number[]} bytes
     */
    constructor(bytes: number[]);
    /**
     * @type {number[]}
     */
    get bytes(): number[];
    /**
     * Converts a `StakeAddress` into its CBOR representation.
     * @returns {number[]}
     */
    toCbor(): number[];
    /**
     * Converts a `StakeAddress` into its Bech32 representation.
     * @returns {string}
     */
    toBech32(): string;
    /**
     * Converts a `StakeAddress` into its hexadecimal representation.
     * @returns {string}
     */
    toHex(): string;
    /**
     * Converts a `StakeAddress` into its hexadecimal representation.
     * @type {string}
     */
    get hex(): string;
    /**
     * Returns the underlying `PubKeyHash` or `StakingValidatorHash`.
     * @returns {PubKeyHash | StakingValidatorHash}
     */
    get stakingHash(): PubKeyHash | StakingValidatorHash;
    #private;
}
/**
 * Represents a Ed25519 signature.
 *
 * Also contains a reference to the PubKey that did the signing.
 */
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
     * @param {number[] | PubKey} pubKey
     * @param {number[]} signature
     */
    constructor(pubKey: number[] | PubKey, signature: number[]);
    /**
     * @type {number[]}
     */
    get bytes(): number[];
    /**
     * @type {PubKey}
     */
    get pubKey(): PubKey;
    /**
     * @type {PubKeyHash}
     */
    get pubKeyHash(): PubKeyHash;
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
 * @interface
 * @typedef {object} PrivateKey
 * @property {() => PubKey} derivePubKey Generates the corresponding public key.
 * @property {(msg: number[]) => Signature} sign Signs a byte-array payload, returning the signature.
 */
/**
 * @implements {PrivateKey}
 */
export class Ed25519PrivateKey extends HeliosData implements PrivateKey {
    /**
     * Generate a private key from a random number generator.
     * This is not cryptographically secure, only use this for testing purpose
     * @param {NumberGenerator} random
     * @returns {Ed25519PrivateKey} - Ed25519 private key is 32 bytes long
     */
    static random(random: NumberGenerator): Ed25519PrivateKey;
    /**
     * @param {string | number[]} bytes
     */
    constructor(bytes: string | number[]);
    /**
     * @type {number[]}
     */
    get bytes(): number[];
    /**
     * @type {string}
     */
    get hex(): string;
    /**
     * NOT the Ed25519-Bip32 hierarchial extension algorithm (see ExtendedPrivateKey below)
     * @returns {Ed25519PrivateKey}
     */
    extend(): Ed25519PrivateKey;
    /**
     * @returns {PubKey}
     */
    derivePubKey(): PubKey;
    /**
     * @param {number[]} message
     * @returns {Signature}
     */
    sign(message: number[]): Signature;
    #private;
}
/**
 * Used during `Bip32PrivateKey` derivation, to create a new `Bip32PrivateKey` instance with a non-publicly deriveable `PubKey`.
 */
export const BIP32_HARDEN: 2147483648;
/**
 * Ed25519-Bip32 extendable `PrivateKey`.
 * @implements {PrivateKey}
 */
export class Bip32PrivateKey implements PrivateKey {
    /**
     * Generate a Bip32PrivateKey from a random number generator.
     * This is not cryptographically secure, only use this for testing purpose
     * @param {NumberGenerator} random
     * @returns {Bip32PrivateKey}
     */
    static random(random?: NumberGenerator): Bip32PrivateKey;
    /**
     * @param {number[]} entropy
     * @param {boolean} force
     */
    static fromBip39Entropy(entropy: number[], force?: boolean): Bip32PrivateKey;
    /**
     * @param {number[]} bytes
     */
    constructor(bytes: number[]);
    /**
     * @type {number[]}
     */
    get bytes(): number[];
    /**
     * @private
     * @type {number[]}
     */
    private get k();
    /**
     * @private
     * @type {number[]}
     */
    private get kl();
    /**
     * @private
     * @type {number[]}
     */
    private get kr();
    /**
     * @private
     * @type {number[]}
     */
    private get c();
    /**
     * @private
     * @param {number} i - child index
     */
    private calcChildZ;
    /**
     * @private
     * @param {number} i
     */
    private calcChildC;
    /**
     * @param {number} i
     * @returns {Bip32PrivateKey}
     */
    derive(i: number): Bip32PrivateKey;
    /**
     * @param {number[]} path
     * @returns {Bip32PrivateKey}
     */
    derivePath(path: number[]): Bip32PrivateKey;
    /**
     * @returns {PubKey}
     */
    derivePubKey(): PubKey;
    /**
     * @example
     * (new Bip32PrivateKey([0x60, 0xd3, 0x99, 0xda, 0x83, 0xef, 0x80, 0xd8, 0xd4, 0xf8, 0xd2, 0x23, 0x23, 0x9e, 0xfd, 0xc2, 0xb8, 0xfe, 0xf3, 0x87, 0xe1, 0xb5, 0x21, 0x91, 0x37, 0xff, 0xb4, 0xe8, 0xfb, 0xde, 0xa1, 0x5a, 0xdc, 0x93, 0x66, 0xb7, 0xd0, 0x03, 0xaf, 0x37, 0xc1, 0x13, 0x96, 0xde, 0x9a, 0x83, 0x73, 0x4e, 0x30, 0xe0, 0x5e, 0x85, 0x1e, 0xfa, 0x32, 0x74, 0x5c, 0x9c, 0xd7, 0xb4, 0x27, 0x12, 0xc8, 0x90, 0x60, 0x87, 0x63, 0x77, 0x0e, 0xdd, 0xf7, 0x72, 0x48, 0xab, 0x65, 0x29, 0x84, 0xb2, 0x1b, 0x84, 0x97, 0x60, 0xd1, 0xda, 0x74, 0xa6, 0xf5, 0xbd, 0x63, 0x3c, 0xe4, 0x1a, 0xdc, 0xee, 0xf0, 0x7a])).sign(textToBytes("Hello World")).bytes == [0x90, 0x19, 0x4d, 0x57, 0xcd, 0xe4, 0xfd, 0xad, 0xd0, 0x1e, 0xb7, 0xcf, 0x16, 0x17, 0x80, 0xc2, 0x77, 0xe1, 0x29, 0xfc, 0x71, 0x35, 0xb9, 0x77, 0x79, 0xa3, 0x26, 0x88, 0x37, 0xe4, 0xcd, 0x2e, 0x94, 0x44, 0xb9, 0xbb, 0x91, 0xc0, 0xe8, 0x4d, 0x23, 0xbb, 0xa8, 0x70, 0xdf, 0x3c, 0x4b, 0xda, 0x91, 0xa1, 0x10, 0xef, 0x73, 0x56, 0x38, 0xfa, 0x7a, 0x34, 0xea, 0x20, 0x46, 0xd4, 0xbe, 0x04]
     * @param {number[]} message
     * @returns {Signature}
     */
    sign(message: number[]): Signature;
    #private;
}
/**
 * @implements {PrivateKey}
 */
export class RootPrivateKey implements PrivateKey {
    /**
     * @param {string[]} phrase
     * @param {string[]} dict
     * @returns {boolean}
     */
    static isValidPhrase(phrase: string[], dict?: string[]): boolean;
    /**
     * @param {string[]} phrase
     * @param {string[]} dict
     * @returns {RootPrivateKey}
     */
    static fromPhrase(phrase: string[], dict?: string[]): RootPrivateKey;
    /**
     * @param {number[]} entropy
     */
    constructor(entropy: number[]);
    /**
     * @type {number[]}
     */
    get bytes(): number[];
    /**
     * @type {number[]}
     */
    get entropy(): number[];
    /**
     * @param {string[]} dict
     * @returns {string[]}
     */
    toPhrase(dict?: string[]): string[];
    /**
     * @param {number} i - childIndex
     * @returns {Bip32PrivateKey}
     */
    derive(i: number): Bip32PrivateKey;
    /**
     * @param {number[]} path
     * @returns {Bip32PrivateKey}
     */
    derivePath(path: number[]): Bip32PrivateKey;
    /**
     * @param {number} accountIndex
     * @returns {Bip32PrivateKey}
     */
    deriveSpendingRootKey(accountIndex?: number): Bip32PrivateKey;
    /**
     * @param {number} accountIndex
     * @returns {Bip32PrivateKey}
     */
    deriveStakingRootKey(accountIndex: number): Bip32PrivateKey;
    /**
     * @param {number} accountIndex
     * @param {number} i
     * @returns {Bip32PrivateKey}
     */
    deriveSpendingKey(accountIndex?: number, i?: number): Bip32PrivateKey;
    /**
     * @param {number} accountIndex
     * @param {number} i
     * @returns {Bip32PrivateKey}
     */
    deriveStakingKey(accountIndex?: number, i?: number): Bip32PrivateKey;
    /**
     * @returns {PubKey}
     */
    derivePubKey(): PubKey;
    /**
     * @param {number[]} message
     * @returns {Signature}
     */
    sign(message: number[]): Signature;
    #private;
}
/**
 * Base-type of SpendingRedeemer and MintingRedeemer
 */
export class Redeemer extends CborData {
    /**
     * @param {number[]} bytes
     * @returns {Redeemer}
     */
    static fromCbor(bytes: number[]): Redeemer;
    /**
     * @param {UplcData} data
     * @param {Profile} profile
     */
    constructor(data: UplcData, profile?: Profile);
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
     * @param {string} name
     */
    setProgramName(name: string): void;
    /**
     * @type {null | string}
     */
    get programName(): string | null;
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
     * @param {Profile} profile
     */
    setProfile(profile: Profile): void;
    /**
     * @type {Profile}
     */
    get profile(): Profile;
    /**
     * @param {NetworkParams} networkParams
     * @returns {bigint}
     */
    estimateFee(networkParams: NetworkParams): bigint;
    #private;
}
export class SpendingRedeemer extends Redeemer {
    /**
     * @param {null | TxInput} input
     * @param {number} inputIndex
     * @param {UplcData} data
     * @param {Cost} exUnits
     */
    constructor(input: null | TxInput, inputIndex: number, data: UplcData, exUnits?: Cost);
    /**
     * @type {number}
     */
    get inputIndex(): number;
    #private;
}
export class MintingRedeemer extends Redeemer {
    /**
     * @param {?MintingPolicyHash} mph
     * @param {number} mphIndex
     * @param {UplcData} data
     * @param {Cost} exUnits
     */
    constructor(mph: MintingPolicyHash | null, mphIndex: number, data: UplcData, exUnits?: Cost);
    /**
     * @type {number}
     */
    get mphIndex(): number;
    #private;
}
/**
 * Represents either an inline datum, or a hashed datum.
 *
 * Inside the Helios language this type is named `OutputDatum` in order to distinguish it from user defined Datums,
 * But outside helios scripts there isn't much sense to keep using the name 'OutputDatum' instead of Datum.
 */
export class Datum extends CborData {
    /**
     * @param {number[]} bytes
     * @returns {Datum}
     */
    static fromCbor(bytes: number[]): Datum;
    /**
     * @param {UplcData} data
     * @returns {null | Datum}
     */
    static fromUplcData(data: UplcData): null | Datum;
    /**
     * Constructs a `HashedDatum`. The input data is hashed internally.
     * @param {UplcDataValue | UplcData | HeliosData} data
     * @returns {Datum}
     */
    static hashed(data: UplcDataValue | UplcData | HeliosData): Datum;
    /**
     * @param {UplcDataValue | UplcData | HeliosData} data
     * @returns {Datum}
     */
    static inline(data: UplcDataValue | UplcData | HeliosData): Datum;
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
    get data(): UplcData | null;
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
     * Constructs a `HashedDatum`. The input data is hashed internally.
     * @param {UplcData} data
     * @returns {HashedDatum}
     */
    static fromData(data: UplcData): HashedDatum;
    /**
     * @param {DatumHash} hash
     * @param {null | UplcData} origData
     */
    constructor(hash: DatumHash, origData?: null | UplcData);
    #private;
}
export class TxMetadata {
    /**
    * Decodes a TxMetadata instance from Cbor
    * @param {number[]} data
    * @returns {TxMetadata}
    */
    static fromCbor(data: number[]): TxMetadata;
    /**
     *
     * @param {number} tag
     * @param {Metadata} data
     */
    add(tag: number, data: Metadata): void;
    /**
     * @type {number[]}
     */
    get keys(): number[];
    /**
     * @returns {Object}
     */
    dump(): any;
    /**
     * @returns {number[]}
     */
    toCbor(): number[];
    #private;
}
/**
 * Collection of common [coin selection algorithms](https://cips.cardano.org/cips/cip2/).
 * @namespace
 */
export namespace CoinSelection {
    /**
     * @internal
     * @param {TxInput[]} utxos 
     * @param {Value} amount 
     * @param {boolean} largestFirst
     * @returns {[TxInput[], TxInput[]]} - [picked, not picked that can be used as spares]
     */
    function selectExtremumFirst(utxos: TxInput[], amount: Value, largestFirst: boolean): [TxInput[], TxInput[]];
    /**
     * Selects UTxOs from a list by iterating through the tokens in the given `Value` and picking the UTxOs containing the smallest corresponding amount first.
     * This method can be used to eliminate dust UTxOs from a wallet.
     * @type {CoinSelectionAlgorithm}
     */
    const selectSmallestFirst: CoinSelectionAlgorithm;
    /**
     * * Selects UTxOs from a list by iterating through the tokens in the given `Value` and picking the UTxOs containing the largest corresponding amount first.
     * @type {CoinSelectionAlgorithm}
     */
    const selectLargestFirst: CoinSelectionAlgorithm;
}
/**
 * An interface type for a wallet that manages a user's UTxOs and addresses.
 * @interface
 * @typedef {object} Wallet
*  @property {() => Promise<boolean>} isMainnet Returns `true` if the wallet is connected to the mainnet.
*  @property {Promise<Address[]>} usedAddresses Returns a list of addresses which already contain UTxOs.
*  @property {Promise<Address[]>} unusedAddresses Returns a list of unique unused addresses which can be used to send UTxOs to with increased anonimity.
*  @property {Promise<TxInput[]>} utxos Returns a list of all the utxos controlled by the wallet.
*  @property {Promise<TxInput[]>} collateral
*  @property {(tx: Tx) => Promise<Signature[]>} signTx Signs a transaction, returning a list of signatures needed for submitting a valid transaction.
*  @property {(tx: Tx) => Promise<TxId>} submitTx Submits a transaction to the blockchain and returns the id of that transaction upon success.
*/
/**
 * Convenience type for browser plugin wallets supporting the CIP 30 dApp connector standard (eg. Eternl, Nami, ...).
 *
 * This is useful in typescript projects to avoid type errors when accessing the handles in `window.cardano`.
 *
 * ```ts
 * // refer to this file in the 'typeRoots' list in tsconfig.json
 *
 * type Cip30SimpleHandle = {
 *   name: string,
 *   icon: string,
 *   enable(): Promise<helios.Cip30Handle>,
 *   isEnabled(): boolean
 * }
 *
 * declare global {
 *   interface Window {
 *     cardano: {
 *       [walletName: string]: Cip30SimpleHandle
 *     };
 *   }
 * }
 * ```
 *
 * @typedef {{
 *     getNetworkId(): Promise<number>,
 *     getUsedAddresses(): Promise<string[]>,
 *     getUnusedAddresses(): Promise<string[]>,
 *     getUtxos(): Promise<string[]>,
 *     getCollateral(): Promise<string[]>,
 *     signTx(txHex: string, partialSign: boolean): Promise<string>,
 *     submitTx(txHex: string): Promise<string>,
 *     experimental: {
 *         getCollateral(): Promise<string[]>
 *     },
 * }} Cip30Handle
 */
/**
 * Implementation of `Wallet` that lets you connect to a browser plugin wallet.
 * @implements {Wallet}
 */
export class Cip30Wallet implements Wallet {
    /**
     * Constructs Cip30Wallet using the Cip30Handle which is available in the browser window.cardano context.
     *
     * ```ts
     * const handle: helios.Cip30Handle = await window.cardano.eternl.enable()
     * const wallet = new helios.Cip30Wallet(handle)
     * ```
     * @param {Cip30Handle} handle
     */
    constructor(handle: Cip30Handle);
    /**
     * Returns `true` if the wallet is connected to the mainnet.
     * @returns {Promise<boolean>}
     */
    isMainnet(): Promise<boolean>;
    /**
     * Gets a list of addresses which contain(ed) UTxOs.
     * @type {Promise<Address[]>}
     */
    get usedAddresses(): Promise<Address[]>;
    /**
     * Gets a list of unique unused addresses which can be used to UTxOs to.
     * @type {Promise<Address[]>}
     */
    get unusedAddresses(): Promise<Address[]>;
    /**
     * Gets the complete list of UTxOs (as `TxInput` instances) sitting at the addresses owned by the wallet.
     * @type {Promise<TxInput[]>}
     */
    get utxos(): Promise<TxInput[]>;
    /**
     * @type {Promise<TxInput[]>}
     */
    get collateral(): Promise<TxInput[]>;
    /**
     * Signs a transaction, returning a list of signatures needed for submitting a valid transaction.
     * @param {Tx} tx
     * @returns {Promise<Signature[]>}
     */
    signTx(tx: Tx): Promise<Signature[]>;
    /**
     * Submits a transaction to the blockchain.
     * @param {Tx} tx
     * @returns {Promise<TxId>}
     */
    submitTx(tx: Tx): Promise<TxId>;
    #private;
}
/**
 * High-level helper class for instances that implement the `Wallet` interface.
 */
export class WalletHelper {
    /**
     * @param {Wallet} wallet
     * @param {undefined | ((addr: Address[]) => Promise<TxInput[]>)} getUtxosFallback
     */
    constructor(wallet: Wallet, getUtxosFallback?: ((addr: Address[]) => Promise<TxInput[]>) | undefined);
    /**
     * Concatenation of `usedAddresses` and `unusedAddresses`.
     * @type {Promise<Address[]>}
     */
    get allAddresses(): Promise<Address[]>;
    /**
     * @returns {Promise<Value>}
     */
    calcBalance(): Promise<Value>;
    /**
     * First `Address` in `allAddresses`.
     * @type {Promise<Address>}
     */
    get baseAddress(): Promise<Address>;
    /**
     * First `Address` in `unusedAddresses` (falls back to last `Address` in `usedAddresses` if not defined).
     * @type {Promise<Address>}
     */
    get changeAddress(): Promise<Address>;
    /**
     * First UTxO in `utxos`. Can be used to distinguish between preview and preprod networks.
     * @type {Promise<null | TxInput>}
     */
    get refUtxo(): Promise<TxInput | null>;
    /**
     * @returns {Promise<TxInput[]>}
     */
    getUtxos(): Promise<TxInput[]>;
    /**
     * Pick a number of UTxOs needed to cover a given Value. The default coin selection strategy is to pick the smallest first.
     * @param {Value} amount
     * @param {CoinSelectionAlgorithm} algorithm
     * @returns {Promise<[TxInput[], TxInput[]]>} The first list contains the selected UTxOs, the second list contains the remaining UTxOs.
     */
    pickUtxos(amount: Value, algorithm?: CoinSelectionAlgorithm): Promise<[TxInput[], TxInput[]]>;
    /**
     * Picks a single UTxO intended as collateral.
     * @param {bigint} amount - 2 Ada should cover most things
     * @returns {Promise<TxInput>}
     */
    pickCollateral(amount?: bigint): Promise<TxInput>;
    /**
     * Returns `true` if the `PubKeyHash` in the given `Address` is controlled by the wallet.
     * @param {Address} addr
     * @returns {Promise<boolean>}
     */
    isOwnAddress(addr: Address): Promise<boolean>;
    /**
     * Returns `true` if the given `PubKeyHash` is controlled by the wallet.
     * @param {PubKeyHash} pkh
     * @returns {Promise<boolean>}
     */
    isOwnPubKeyHash(pkh: PubKeyHash): Promise<boolean>;
    /**
     * @returns {Promise<any>}
     */
    toJson(): Promise<any>;
    #private;
}
/**
 * @implements {Wallet}
 */
export class RemoteWallet implements Wallet {
    /**
     * @param {string | Object} obj
     * @returns {RemoteWallet}
     */
    static fromJson(obj: string | any): RemoteWallet;
    /**
     * @param {boolean} isMainnet
     * @param {Address[]} usedAddresses
     * @param {Address[]} unusedAddresses
     * @param {TxInput[]} utxos
     */
    constructor(isMainnet: boolean, usedAddresses: Address[], unusedAddresses: Address[], utxos: TxInput[]);
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
     * @type {Promise<TxInput[]>}
     */
    get utxos(): Promise<TxInput[]>;
    /**
     * @type {Promise<TxInput[]>}
     */
    get collateral(): Promise<TxInput[]>;
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
/**
 * Blockchain query interface.
 * @interface
 * @typedef {object} Network
 * @property {(address: Address) => Promise<TxInput[]>} getUtxos Returns a complete list of UTxOs at a given address.
 * @property {(id: TxOutputId) => Promise<TxInput>} getUtxo Returns a single TxInput (that might already have been spent).
 * @property {() => Promise<NetworkParams>} getParameters Returns the latest network parameters.
 * @property {(tx: Tx) => Promise<TxId>} submitTx Submits a transaction to the blockchain and returns the id of that transaction upon success.
 */
/**
 * Blockfrost specific implementation of `Network`.
 * @implements {Network}
 */
export class BlockfrostV0 implements Network {
    /**
     * Throws an error if a Blockfrost project_id is missing for that specific network.
     * @param {TxInput} refUtxo
     * @param {{
     *     preview?: string,
     *     preprod?: string,
     *     mainnet?: string
     * }} projectIds
     * @returns {Promise<BlockfrostV0>}
     */
    static resolveUsingUtxo(refUtxo: TxInput, projectIds: {
        preview?: string;
        preprod?: string;
        mainnet?: string;
    }): Promise<BlockfrostV0>;
    /**
     * Connects to the same network a given `Wallet` is connected to (preview, preprod or mainnet).
     *
     * Throws an error if a Blockfrost project_id is missing for that specific network.
     * @param {Wallet} wallet
     * @param {{
     *     preview?: string,
     *     preprod?: string,
     *     mainnet?: string
     * }} projectIds
     * @returns {Promise<BlockfrostV0>}
     */
    static resolveUsingWallet(wallet: Wallet, projectIds: {
        preview?: string;
        preprod?: string;
        mainnet?: string;
    }): Promise<BlockfrostV0>;
    /**
    * Connects to the same network a given `Wallet` or the given `TxInput` (preview, preprod or mainnet).
    *
    * Throws an error if a Blockfrost project_id is missing for that specific network.
    * @param {TxInput | Wallet} utxoOrWallet
    * @param {{
    *     preview?: string,
    *     preprod?: string,
    *     mainnet?: string
    * }} projectIds
    * @returns {Promise<BlockfrostV0>}
    */
    static resolve(utxoOrWallet: TxInput | Wallet, projectIds: {
        preview?: string;
        preprod?: string;
        mainnet?: string;
    }): Promise<BlockfrostV0>;
    /**
     * Constructs a BlockfrostV0 using the network name (preview, preprod or mainnet) and your Blockfrost `project_id`.
     * @param {"preview" | "preprod" | "mainnet"} networkName
     * @param {string} projectId
     */
    constructor(networkName: "preview" | "preprod" | "mainnet", projectId: string);
    /**
     * @type {string}
     */
    get networkName(): string;
    /**
     * @returns {Promise<NetworkParams>}
     */
    getParameters(): Promise<NetworkParams>;
    /**
     * @returns {Promise<any>}
     */
    getLatestEpoch(): Promise<any>;
    /**
     * If the UTxO isn't found an error is throw with the following message format: "UTxO <txId.utxoId> not found".
     * @param {TxOutputId} id
     * @returns {Promise<TxInput>}
     */
    getUtxo(id: TxOutputId): Promise<TxInput>;
    /**
     * Used by `BlockfrostV0.resolve()`.
     * @param {TxInput} utxo
     * @returns {Promise<boolean>}
     */
    hasUtxo(utxo: TxInput): Promise<boolean>;
    /**
     * Gets a complete list of UTxOs at a given `Address`.
     * Returns oldest UTxOs first, newest last.
     * @param {Address} address
     * @returns {Promise<TxInput[]>}
     */
    getUtxos(address: Address): Promise<TxInput[]>;
    /**
     * Submits a transaction to the blockchain.
     * @param {Tx} tx
     * @returns {Promise<TxId>}
     */
    submitTx(tx: Tx): Promise<TxId>;
    /**
     * Allows inspecting the live Blockfrost mempool.
     */
    dumpMempool(): Promise<void>;
    #private;
}
/**
 * Koios network interface.
 * @implements {Network}
 */
export class KoiosV0 implements Network {
    /**
    * Throws an error if a Blockfrost project_id is missing for that specific network.
    * @param {TxInput} refUtxo
    * @returns {Promise<KoiosV0>}
    */
    static resolveUsingUtxo(refUtxo: TxInput): Promise<KoiosV0>;
    /**
     * @param {"preview" | "preprod" | "mainnet"} networkName
     */
    constructor(networkName: "preview" | "preprod" | "mainnet");
    /**
     * @private
     * @type {string}
     */
    private get rootUrl();
    /**
    * @returns {Promise<NetworkParams>}
    */
    getParameters(): Promise<NetworkParams>;
    /**
     * @private
     * @param {TxOutputId[]} ids
     * @returns {Promise<TxInput[]>}
     */
    private getUtxosInternal;
    /**
     * @param {TxOutputId} id
     * @returns {Promise<TxInput>}
     */
    getUtxo(id: TxOutputId): Promise<TxInput>;
    /**
    * Used by `KoiosV0.resolveUsingUtxo()`.
    * @param {TxInput} utxo
    * @returns {Promise<boolean>}
    */
    hasUtxo(utxo: TxInput): Promise<boolean>;
    /**
     * @param {Address} address
     * @returns {Promise<TxInput[]>}
     */
    getUtxos(address: Address): Promise<TxInput[]>;
    /**
     * @param {Tx} tx
     * @returns {Promise<TxId>}
     */
    submitTx(tx: Tx): Promise<TxId>;
    #private;
}
/**
 * This wallet only has a single private/public key, which isn't rotated. Staking is not yet supported.
 * @implements {Wallet}
 */
export class SimpleWallet implements Wallet {
    /**
     * @param {Network} network
     * @param {Bip32PrivateKey} privateKey
     */
    constructor(network: Network, privateKey: Bip32PrivateKey);
    /**
     * @type {Bip32PrivateKey}
     */
    get privateKey(): Bip32PrivateKey;
    /**
     * @type {PubKey}
     */
    get pubKey(): PubKey;
    /**
     * @type {PubKeyHash}
     */
    get pubKeyHash(): PubKeyHash;
    /**
     * @type {Address}
     */
    get address(): Address;
    /**
     * @returns {Promise<boolean>}
     */
    isMainnet(): Promise<boolean>;
    /**
     * Assumed wallet was initiated with at least 1 UTxO at the pubkeyhash address.
     * @type {Promise<Address[]>}
     */
    get usedAddresses(): Promise<Address[]>;
    /**
     * @type {Promise<Address[]>}
     */
    get unusedAddresses(): Promise<Address[]>;
    /**
     * @type {Promise<TxInput[]>}
     */
    get utxos(): Promise<TxInput[]>;
    /**
     * @type {Promise<TxInput[]>}
     */
    get collateral(): Promise<TxInput[]>;
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
 * A simple emulated Network.
 * This can be used to do integration tests of whole dApps.
 * Staking is not yet supported.
 * @implements {Network}
 */
export class NetworkEmulator implements Network {
    /**
     * Instantiates a NetworkEmulator at slot 0.
     * An optional seed number can be specified, from which all emulated randomness is derived.
     * @param {number} seed
     */
    constructor(seed?: number);
    /**
     * @type {bigint}
     */
    get currentSlot(): bigint;
    /**
     * Creates a new `NetworkParams` instance that has access to current slot
     * (so that the `Tx` validity range can be set automatically during `Tx.finalize()`).
     * @param {NetworkParams} networkParams
     * @returns {NetworkParams}
     */
    initNetworkParams(networkParams: NetworkParams): NetworkParams;
    /**
     * Creates a new SimpleWallet and populates it with a given lovelace quantity and assets.
     * Special genesis transactions are added to the emulated chain in order to create these assets.
     * @param {bigint} lovelace
     * @param {Assets} assets
     * @returns {SimpleWallet}
     */
    createWallet(lovelace?: bigint, assets?: Assets): SimpleWallet;
    /**
     * Creates a UTxO using a GenesisTx.
     * @param {SimpleWallet} wallet
     * @param {bigint} lovelace
     * @param {Assets} assets
     */
    createUtxo(wallet: SimpleWallet, lovelace: bigint, assets?: Assets): void;
    /**
     * Mint a block with the current mempool, and advance the slot by a number of slots.
     * @param {bigint} nSlots
     */
    tick(nSlots: bigint): void;
    /**
     * @returns {Promise<NetworkParams>}
     */
    getParameters(): Promise<NetworkParams>;
    warnMempool(): void;
    /**
     * Throws an error if the UTxO isn't found
     * @param {TxOutputId} id
     * @returns {Promise<TxInput>}
     */
    getUtxo(id: TxOutputId): Promise<TxInput>;
    /**
     * @param {Address} address
     * @returns {Promise<TxInput[]>}
     */
    getUtxos(address: Address): Promise<TxInput[]>;
    dump(): void;
    /**
     * @param {TxInput} utxo
     * @returns {boolean}
     */
    isConsumed(utxo: TxInput): boolean;
    /**
     * @param {Tx} tx
     * @returns {Promise<TxId>}
     */
    submitTx(tx: Tx): Promise<TxId>;
    #private;
}
/**
 * Helper that
 * @implements {Network}
 */
export class TxChain implements Network {
    /**
     * @param {Network} network
     */
    constructor(network: Network);
    /**
     * @param {Tx} tx
     * @returns {Promise<TxId>}
     */
    submitTx(tx: Tx): Promise<TxId>;
    /**
     * @returns {Promise<NetworkParams>}
     */
    getParameters(): Promise<NetworkParams>;
    /**
     * @param {TxOutputId} id
     * @returns {Promise<TxInput>}
     */
    getUtxo(id: TxOutputId): Promise<TxInput>;
    /**
     * @param {TxInput[]} utxos
     * @param {Address[]} addrs
     * @returns {Promise<TxInput[]>}
     */
    getUtxosInternal(utxos: TxInput[], addrs: Address[]): Promise<TxInput[]>;
    /**
     * @param {Address} addr
     * @returns {Promise<TxInput[]>}
     */
    getUtxos(addr: Address): Promise<TxInput[]>;
    /**
     * @param {Wallet} baseWallet
     * @returns {Wallet}
     */
    asWallet(baseWallet: Wallet): Wallet;
    #private;
}
/**
 * @typedef {{
 *   [address: string]: TxInput[]
 * }} NetworkSliceUTxOs
 */
/**
 * @implements {Network}
 */
export class NetworkSlice implements Network {
    /**
     * @param {Network} network
     * @param {Address[]} addresses
     * @returns {Promise<NetworkSlice>}
     */
    static init(network: Network, addresses: Address[]): Promise<NetworkSlice>;
    /**
     * @param {any} obj
     * @returns {NetworkSlice}
     */
    static fromJson(obj: any): NetworkSlice;
    /**
     * @param {NetworkParams} params
     * @param {NetworkSliceUTxOs} utxos
     */
    constructor(params: NetworkParams, utxos: NetworkSliceUTxOs);
    /**
     * @returns {any}
     */
    toJson(): any;
    /**
     * @returns {Promise<NetworkParams>}
     */
    getParameters(): Promise<NetworkParams>;
    /**
     * @param {TxOutputId} id
     * @returns {Promise<TxInput>}
     */
    getUtxo(id: TxOutputId): Promise<TxInput>;
    /**
     * @param {Address} addr
     * @returns {Promise<TxInput[]>}
     */
    getUtxos(addr: Address): Promise<TxInput[]>;
    /**
     * @param {Tx} tx
     * @returns {Promise<TxId>}
     */
    submitTx(tx: Tx): Promise<TxId>;
    #private;
}
/**
 * @typedef {() => UplcData} ValueGenerator
 */
/**
 * @typedef {(args: UplcValue[], res: (UplcValue | RuntimeError), isSimplfied?: boolean) => (boolean | Object.<string, boolean>)} PropertyTest
 */
/**
 * Helper class for performing fuzzy property-based tests of Helios scripts.
 */
export class FuzzyTest {
    /**
     * The simplify argument specifies whether optimized versions of the Helios sources should also be tested.
     * @param {number} seed
     * @param {number} runsPerTest
     * @param {boolean} simplify If true then also test the simplified program
     */
    constructor(seed?: number, runsPerTest?: number, simplify?: boolean);
    reset(): void;
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
     * @param {number} min
     * @param {number} max
     * @returns {ValueGenerator}
     */
    real(min?: number, max?: number): ValueGenerator;
    /**
     * Returns a generator for strings containing any utf-8 character.
     * @param {number} minLength
     * @param {number} maxLength
     * @returns {ValueGenerator}
     */
    string(minLength?: number, maxLength?: number): ValueGenerator;
    /**
     * Returns a generator for strings with ascii characters from 32 (space) to 126 (tilde).
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
     * Perform a fuzzy/property-based test-run of a Helios source. One value generator must be specified per argument of main.
     *
     * Throws an error if the propTest fails.
     *
     * The propTest can simply return a boolean, or can return an object with boolean values, and if any of these booleans is false the propTest fails (the keys can be used to provide extra information).
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
 * Needed by transfer() methods
 */
export type TransferUplcAst = {
    transferByteArrayData: (bytes: number[]) => any;
    transferConstrData: (index: number, fields: any[]) => any;
    transferIntData: (value: bigint) => any;
    transferListData: (items: any[]) => any;
    transferMapData: (pairs: [any, any][]) => any;
    transferSite: (src: any, startPos: number, endPos: number, codeMapSite: null | any) => any;
    transferSource: (raw: string, name: string) => any;
    transferUplcBool: (site: any, value: boolean) => any;
    transferUplcBuiltin: (site: any, name: string | number) => any;
    transferUplcByteArray: (site: any, bytes: number[]) => any;
    transferUplcCall: (site: any, a: any, b: any) => any;
    transferUplcConst: (value: any) => any;
    transferUplcDataValue: (site: any, data: any) => any;
    transferUplcDelay: (site: any, expr: any) => any;
    transferUplcError: (site: any, msg: string) => any;
    transferUplcForce: (site: any, expr: any) => any;
    transferUplcInt: (site: any, value: bigint, signed: boolean) => any;
    transferUplcLambda: (site: any, rhs: any, name: null | string) => any;
    transferUplcList: (site: any, itemType: any, items: any[]) => any;
    transferUplcPair: (site: any, first: any, second: any) => any;
    transferUplcString: (site: any, value: string) => any;
    transferUplcType: (typeBits: string) => any;
    transferUplcUnit: (site: any) => any;
    transferUplcVariable: (site: any, index: any) => any;
};
/**
 * Used by the bundle cli command to generate a typescript annotations and (de)serialization code
 * inputTypes form a type union
 */
/**
 * EvalEntities assert themselves
 */
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
export type CurvePoint<T extends CurvePoint<T>> = {
    add(other: T): T;
    mul(scalar: bigint): T;
    equals(other: T): boolean;
    encode(): number[];
};
export type Decoder = (i: number, bytes: number[]) => void;
/**
 * Deprecated
 */
export type HIntProps = number | bigint;
export type ByteArrayProps = number[] | string;
export type HashProps = number[] | string;
export type DatumHashProps = HashProps;
export type PubKeyProps = number[] | string;
/**
 * Represents a blake2b-224 hash of a PubKey
 *
 * **Note**: A `PubKeyHash` can also be used as the second part of a payment `Address`, or to construct a `StakeAddress`.
 */
export type PubKeyHashProps = HashProps;
export type MintingPolicyHashProps = HashProps;
export type StakingValidatorHashProps = HashProps;
export type ValidatorHashProps = HashProps;
export type TxIdProps = HashProps;
export type TxOutputIdProps = string | [
    TxId | TxIdProps,
    HInt | HIntProps
] | {
    txId: TxId | TxIdProps;
    utxoId: HInt | HIntProps;
};
/**
 * An array of bytes, a Bech32 encoded address, or the hexadecimal representation of the underlying bytes.
 */
export type AddressProps = number[] | string;
export type AssetClassProps = string | [
    MintingPolicyHash | MintingPolicyHashProps,
    ByteArray | ByteArrayProps
] | {
    mph: MintingPolicyHash | MintingPolicyHashProps;
    tokenName: ByteArray | ByteArrayProps;
};
export type AssetsProps = [
    AssetClass | AssetClassProps,
    HInt | HIntProps
][] | [
    MintingPolicyHash | MintingPolicyHashProps,
    [
        ByteArray | ByteArrayProps,
        HInt | HIntProps
    ][]
][];
export type ValueProps = HInt | HIntProps | [
    HInt | HIntProps,
    Assets | AssetsProps
] | {
    lovelace: HInt | HIntProps;
    assets?: Assets | AssetsProps;
};
export type Cost = {
    mem: bigint;
    cpu: bigint;
};
export type LiveSlotGetter = () => bigint;
/**
 * A Helios/Uplc Program can have different purposes
 */
export type ScriptPurpose = "testing" | "minting" | "spending" | "staking" | "endpoint" | "module" | "unknown";
export type UplcRawStack = [null | string, UplcValue][];
export type UplcRTECallbacks = {
    onPrint: (msg: string) => Promise<void>;
    onStartCall: (site: Site, rawStack: UplcRawStack) => Promise<boolean>;
    onEndCall: (site: Site, rawStack: UplcRawStack) => Promise<void>;
    onIncrCost: (name: string, isTerm: boolean, cost: Cost) => void;
};
/**
 * TODO: purpose as enum type
 */
export type ProgramProperties = {
    purpose: null | ScriptPurpose;
    callsTxTimeRange: boolean;
    name?: string;
};
/**
 * The constructor returns 'any' because it is an instance of TransferableUplcProgram, and the instance methods don't need to be defined here
 */
export type TransferableUplcProgram<TInstance> = {
    transferUplcProgram: (expr: any, properties: ProgramProperties, version: any[]) => TInstance;
    transferUplcAst: TransferUplcAst;
};
/**
 * mem:  in 8 byte words (i.e. 1 mem unit is 64 bits)
 * cpu:  in reference cpu microseconds
 * size: in bytes
 * builtins: breakdown per builtin
 * terms: breakdown per termtype
 * result: result of evaluation
 * messages: printed messages (can be helpful when debugging)
 */
export type Profile = {
    mem: bigint;
    cpu: bigint;
    size?: number | undefined;
    builtins?: {
        [name: string]: Cost;
    } | undefined;
    terms?: {
        [name: string]: Cost;
    } | undefined;
    result?: RuntimeError | UplcValue | undefined;
    messages?: string[] | undefined;
};
export type UserTypes = {
    [name: string]: any;
};
export type ProgramConfig = {
    allowPosParams: boolean;
    invertEntryPoint: boolean;
};
export interface PrivateKey  {
    /**
     * Generates the corresponding public key.
     */
    derivePubKey: () => PubKey;
    /**
     * Signs a byte-array payload, returning the signature.
     */
    sign: (msg: number[]) => Signature;
}
/**
 * Returns two lists. The first list contains the selected UTxOs, the second list contains the remaining UTxOs.
 */
export type CoinSelectionAlgorithm = (utxos: TxInput[], amount: Value) => [TxInput[], TxInput[]];
/**
 * An interface type for a wallet that manages a user's UTxOs and addresses.
 */
export interface Wallet  {
    /**
     * Returns `true` if the wallet is connected to the mainnet.
     */
    isMainnet: () => Promise<boolean>;
    /**
     * Returns a list of addresses which already contain UTxOs.
     */
    usedAddresses: Promise<Address[]>;
    /**
     * Returns a list of unique unused addresses which can be used to send UTxOs to with increased anonimity.
     */
    unusedAddresses: Promise<Address[]>;
    /**
     * Returns a list of all the utxos controlled by the wallet.
     */
    utxos: Promise<TxInput[]>;
    collateral: Promise<TxInput[]>;
    /**
     * Signs a transaction, returning a list of signatures needed for submitting a valid transaction.
     */
    signTx: (tx: Tx) => Promise<Signature[]>;
    /**
     * Submits a transaction to the blockchain and returns the id of that transaction upon success.
     */
    submitTx: (tx: Tx) => Promise<TxId>;
}
/**
 * Convenience type for browser plugin wallets supporting the CIP 30 dApp connector standard (eg. Eternl, Nami, ...).
 *
 * This is useful in typescript projects to avoid type errors when accessing the handles in `window.cardano`.
 *
 * ```ts
 * // refer to this file in the 'typeRoots' list in tsconfig.json
 *
 * type Cip30SimpleHandle = {
 *   name: string,
 *   icon: string,
 *   enable(): Promise<helios.Cip30Handle>,
 *   isEnabled(): boolean
 * }
 *
 * declare global {
 *   interface Window {
 *     cardano: {
 *       [walletName: string]: Cip30SimpleHandle
 *     };
 *   }
 * }
 * ```
 */
export type Cip30Handle = {
    getNetworkId(): Promise<number>;
    getUsedAddresses(): Promise<string[]>;
    getUnusedAddresses(): Promise<string[]>;
    getUtxos(): Promise<string[]>;
    getCollateral(): Promise<string[]>;
    signTx(txHex: string, partialSign: boolean): Promise<string>;
    submitTx(txHex: string): Promise<string>;
    experimental: {
        getCollateral(): Promise<string[]>;
    };
};
/**
 * Blockchain query interface.
 */
export interface Network  {
    /**
     * Returns a complete list of UTxOs at a given address.
     */
    getUtxos: (address: Address) => Promise<TxInput[]>;
    /**
     * Returns a single TxInput (that might already have been spent).
     */
    getUtxo: (id: TxOutputId) => Promise<TxInput>;
    /**
     * Returns the latest network parameters.
     */
    getParameters: () => Promise<NetworkParams>;
    /**
     * Submits a transaction to the blockchain and returns the id of that transaction upon success.
     */
    submitTx: (tx: Tx) => Promise<TxId>;
}
/**
 * collectUtxos removes tx inputs from the list, and appends txoutputs sent to the address to the end.
 */
export type NetworkSliceUTxOs = {
    [address: string]: TxInput[];
};
export type ValueGenerator = () => UplcData;
export type PropertyTest = (args: UplcValue[], res: (UplcValue | RuntimeError), isSimplfied?: boolean) => (boolean | {
    [x: string]: boolean;
});
/**
 * UplcStack contains a value that can be retrieved using a Debruijn index.
 */
/**
 * Wrapper for a builtin function (written in IR)
 */
/**
 * Parent class of EnumSwitchExpr and DataSwitchExpr
 */
/**
 * A Module is a collection of statements
 */
/**
 * The entrypoint module
 */
export {};

