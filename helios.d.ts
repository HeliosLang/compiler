
    /**
     * @typedef {string & {}} hexstring
     */
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
     * Converts a hexadecimal representation of bytes into an actual list of uint8 bytes.
     * @example
     * hexToBytes("00ff34") => [0, 255, 52]
     * @param {hexstring} hex
     * @returns {number[]}
     */
    export function hexToBytes(hex: hexstring): number[];
    /**
     * Converts a list of uint8 bytes into its hexadecimal string representation.
     * @example
     * bytesToHex([0, 255, 52]) => "00ff34"
     * @param {number[]} bytes
     * @returns {hexstring}
     */
    export function bytesToHex(bytes: number[]): hexstring;
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
     * @param {number[]} bytes
     * @param {ProgramProperties} properties
     * @returns {UplcProgram}
     */
    export function deserializeUplcBytes(bytes: number[], properties?: ProgramProperties): UplcProgram;
    /**
     * Parses a plutus core program. Returns a UplcProgram object
     * @param {string} jsonString
     * @returns {UplcProgram}
     */
    export function deserializeUplc(jsonString: string): UplcProgram;
    /**
     * @template {HeliosData} T
     */
    /**
     * Parses Helios quickly to extract the script purpose header.
     * Returns null if header is missing or incorrectly formed (instead of throwing an error)
     * @param {string} rawSrc
     * @returns {null | [ScriptPurpose, string]} - [purpose, name]
     */
    export function extractScriptPurposeAndName(rawSrc: string): null | [ScriptPurpose, string];
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
    export const VERSION: "0.15.0";
    /**
     * Modifiable config vars
     * @type {{
     *   DEBUG: boolean
     *   STRICT_BABBAGE: boolean
     *   IS_TESTNET: boolean
     *   N_DUMMY_INPUTS: number
     *   AUTO_SET_VALIDITY_RANGE: boolean
     *   VALIDITY_RANGE_START_OFFSET: number | null
     *   VALIDITY_RANGE_END_OFFSET: number | null
     *   EXPERIMENTAL_CEK: boolean
     *   IGNORE_UNEVALUATED_CONSTANTS: boolean
     * }}
     */
    export const config: {
        DEBUG: boolean;
        STRICT_BABBAGE: boolean;
        IS_TESTNET: boolean;
        N_DUMMY_INPUTS: number;
        AUTO_SET_VALIDITY_RANGE: boolean;
        VALIDITY_RANGE_START_OFFSET: number | null;
        VALIDITY_RANGE_END_OFFSET: number | null;
        EXPERIMENTAL_CEK: boolean;
        IGNORE_UNEVALUATED_CONSTANTS: boolean;
    };
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
        get endSite(): Site;
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
     * UserErrors are generated when the user of Helios makes a mistake (eg. a syntax error),
     * or when the user of Helios throws an explicit error inside a script (eg. division by zero).
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
        static catch<T>(fn: () => T, verbose?: boolean): T;
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
     * A collection of cryptography primitives are included here in order to avoid external dependencies
     *     mulberry32: random number generator
     *     base32 encoding and decoding
     *     bech32 encoding, checking, and decoding
     *     sha2_256, sha2_512, sha3 and blake2b hashing
     *     ed25519 pubkey generation, signing, and signature verification (NOTE: the current implementation is simple but slow)
     */
    export class Crypto {
        /**
         * Rfc 4648 base32 alphabet
         * @type {string}
         */
        static get DEFAULT_BASE32_ALPHABET(): string;
        /**
         * Bech32 base32 alphabet
         * @type {string}
         */
        static get BECH32_BASE32_ALPHABET(): string;
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
         * @param {number[]} bytes - uint8 numbers
         * @param {string} alphabet - list of chars
         * @return {string}
         */
        static encodeBase32(bytes: number[], alphabet?: string): string;
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
         * @param {string} encoded
         * @param {string} alphabet
         * @return {number[]}
         */
        static decodeBase32(encoded: string, alphabet?: string): number[];
        /**
         * Creates a bech32 checksummed string (used to represent Cardano addresses)
         * @example
         * Crypto.encodeBech32("foo", textToBytes("foobar")) => "foo1vehk7cnpwgry9h96"
         * @example
         * Crypto.encodeBech32("addr_test", hexToBytes("70a9508f015cfbcffc3d88ac4c1c934b5b82d2bb281d464672f6c49539")) => "addr_test1wz54prcptnaullpa3zkyc8ynfddc954m9qw5v3nj7mzf2wggs2uld"
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
         * @example
         * bytesToHex(Crypto.sha2_512(textToBytes("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"))) => "204a8fc6dda82f0a0ced7beb8e08a41657c16ef468b228a8279be331a703c33596fd15c13b1b07f9aa1d3bea57789ca031ad85c7a71dd70354ec631238ca3445"
         * @example
         * bytesToHex(Crypto.sha2_512(textToBytes("abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstuu"))) => "23565d109ac0e2aa9fb162385178895058b28489a6bc31cb55491ed83956851ab1d4bbd46440586f5c9c4b69c9c280118cbc55c71495d258cc27cc6bb25ee720"
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
         * @param {number[]} bytes - list of uint8 numbers
         * @returns {number[]} - list of uint8 numbers
         */
        static sha3(bytes: number[]): number[];
        /**
         * Calculates blake2b hash of a list of uint8 numbers (variable digest size).
         * Result is also a list of uint8 number.
         * Blake2b is a 64bit algorithm, so we need to be careful when replicating 64-bit operations with 2 32-bit numbers (low-word overflow must spill into high-word, and shifts must go over low/high boundary)
         * @example
         * bytesToHex(Crypto.blake2b([0, 1])) => "01cf79da4945c370c68b265ef70641aaa65eaa8f5953e3900d97724c2c5aa095"
         * @example
         * bytesToHex(Crypto.blake2b(textToBytes("abc"), 64)) => "ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d17d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923"
         * @param {number[]} bytes
         * @param {number} digestSize - at most 64
         * @returns {number[]}
         */
        static blake2b(bytes: number[], digestSize?: number): number[];
        /**
         * @example
         * bytesToHex(Crypto.hmacSha2_256(textToBytes("key"), textToBytes("The quick brown fox jumps over the lazy dog"))) => "f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8"
         * @param {number[]} key
         * @param {number[]} message
         * @returns {number[]}
         */
        static hmacSha2_256(key: number[], message: number[]): number[];
        /**
         * @example
         * bytesToHex(Crypto.hmacSha2_512(textToBytes("key"), textToBytes("The quick brown fox jumps over the lazy dog"))) => "b42af09057bac1e2d41708e48a902e09b5ff7f12ab428a4fe86653c73dd248fb82f948a549f7b791a5b41915ee4d1ec3935357e4e2317250d0372afa2ebeeb3a"
         * @param {number[]} key
         * @param {number[]} message
         * @returns {number[]}
         */
        static hmacSha2_512(key: number[], message: number[]): number[];
        /**
         * @example
         * bytesToHex(Crypto.pbkdf2(Crypto.hmacSha2_256, textToBytes("password"), textToBytes("salt"), 1, 20)) => "120fb6cffcf8b32c43e7225256c4f837a86548c9"
         * @example
         * bytesToHex(Crypto.pbkdf2(Crypto.hmacSha2_512, textToBytes("password"), textToBytes("salt"), 2, 20)) => "e1d9c16aa681708a45f5c7c4e215ceb66e011a2e"
         * @param {(key: number[], msg: number[]) => number[]} prf
         * @param {number[]} password
         * @param {number[]} salt
         * @param {number} iters
         * @param {number} dkLength
         * @returns {number[]}
         */
        static pbkdf2(prf: (key: number[], msg: number[]) => number[], password: number[], salt: number[], iters: number, dkLength: number): number[];
        /**
         * Crypto.Ed25519 exports the following functions:
         *  * Crypto.Ed25519.derivePublicKey(privateKey)
         *  * Crypto.Ed25519.sign(message, privateKey)
         *  * Crypto.Ed25519.verify(message, signature, publicKey)
         *
         * Ported from: https://ed25519.cr.yp.to/python/ed25519.py
         * ExtendedPoint implementation from: https://github.com/paulmillr/noble-ed25519
         */
        static get Ed25519(): {
            /**
             * @param {number[]} extendedKey
             * @returns {number[]}
             */
            deriveBip32PublicKey: (extendedKey: number[]) => number[];
            /**
             * @param {number[]} privateKey
             * @returns {number[]}
             */
            derivePublicKey: (privateKey: number[]) => number[];
            /**
             * @param {number[]} message
             * @param {number[]} extendedKey
             * @returns {number[]}
             */
            signBip32: (message: number[], extendedKey: number[]) => number[];
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
     * Standard English Bip39 dictionary consisting of 2048 words allowing wallet root keys to be formed by a phrase of 12, 15, 18, 21 or 24 of these words.
     */
    export const BIP39_DICT_EN: string[];
    /**
     * @typedef {(i: number, bytes: number[]) => void} Decoder
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
         * Strings can be split into lists with chunks of up to 64 bytes
         * to play nice with Cardano tx metadata constraints.
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
         * @param {Decoder} tupleDecoder
         * @returns {number} - returns the size of the tuple
         */
        static decodeTuple(bytes: number[], tupleDecoder: Decoder): number;
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
         * @param {Decoder} fieldDecoder
         * @returns {Set<number>}
         */
        static decodeObject(bytes: number[], fieldDecoder: Decoder): Set<number>;
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
        /**
         * @returns {string}
         */
        toCborHex(): string;
    }
    /**
     * Base class for Plutus-core data classes (not the same as Plutus-core value classes!)
     */
    export class UplcData extends CborData {
        /**
         * @param {hexstring | number[]} bytes
         * @returns {UplcData}
         */
        static fromCbor(bytes: hexstring | number[]): UplcData;
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
         * @example
         * ByteArrayData.comp(hexToBytes("0101010101010101010101010101010101010101010101010101010101010101"), hexToBytes("0202020202020202020202020202020202020202020202020202020202020202")) => -1
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
         * @returns {hexstring}
         */
        toHex(): hexstring;
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
     * @deprecated
     */
    export class HeliosData extends CborData {
        /**
         * Most HeliosData classes are builtin
         * @returns {boolean}
         */
        static isBuiltin(): boolean;
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
     * @typedef {hexstring | number[]} ByteArrayProps
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
         * @type {hexstring}
         */
        get hex(): hexstring;
        /**
         * @param {ByteArray | ByteArrayProps} other
         * @returns {boolean}
         */
        eq(other: ByteArray | ByteArrayProps): boolean;
        #private;
    }
    /**
     * @typedef {hexstring | number[]} HashProps
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
         * @param {hexstring} str
         * @returns {Hash}
         */
        static fromHex(str: hexstring): Hash;
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
         * @returns {hexstring}
         */
        get hex(): hexstring;
        /**
         * @param {Hash} other
         * @returns {boolean}
         */
        eq(other: Hash): boolean;
    }
    /**
     * @typedef {HashProps} DatumHashProps
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
        /**
         * @param {string} str
         * @returns {DatumHash}
         */
        static fromHex(str: string): DatumHash;
    }
    /**
     * @typedef {hexstring | number[]} PubKeyProps
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
         * @type {hexstring}
         */
        get hex(): hexstring;
        /**
         * @type {PubKeyHash}
         */
        get pubKeyHash(): PubKeyHash;
        /**
         * @type {StakeKeyHash}
         */
        get stakeKeyHash(): StakeKeyHash;
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
     * @typedef {HashProps} PubKeyHashProps
     */
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
         * @param {string} str
         * @returns {PubKeyHash}
         */
        static fromHex(str: string): PubKeyHash;
    }
    /**
     * Base class of MintingPolicyHash, ValidatorHash and StakingValidatorHash
     */
    export class ScriptHash extends Hash {
    }
    /**
     * @typedef {HashProps} MintingPolicyHashProps
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
     * @typedef {HashProps} StakeKeyHashProps
     */
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
        /**
         * @param {string} str
         * @returns {StakeKeyHash}
         */
        static fromHex(str: string): StakeKeyHash;
    }
    /**
     * @typedef {HashProps} StakingValidatorHashProps
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
        /**
         * @param {string} str
         * @returns {StakingValidatorHash}
         */
        static fromHex(str: string): StakingValidatorHash;
    }
    /**
     * @typedef {HashProps} ValidatorHashProps
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
        /**
         * @param {string} str
         * @returns {ValidatorHash}
         */
        static fromHex(str: string): ValidatorHash;
    }
    /**
     * @typedef {HashProps} TxIdProps
     */
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
         * @param {TxOutputIdProps} props
         */
        constructor(props: TxOutputIdProps);
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
     * A valid bech32 string
     * @typedef {string & {}} bech32string
     */
    /**
     * @typedef {bech32string | hexstring | number[]} AddressProps
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
         * @param {number[]} bytes
         * @returns {Address}
         */
        static fromCbor(bytes: number[]): Address;
        /**
         * @param {bech32string} str
         * @returns {Address}
         */
        static fromBech32(str: bech32string): Address;
        /**
         * Doesn't check validity
         * @param {hexstring} hex
         * @returns {Address}
         */
        static fromHex(hex: hexstring): Address;
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
         * @param {number[] | string} bytesOrBech32String
         */
        constructor(bytesOrBech32String: number[] | string);
        /**
         * @type {number[]}
         */
        get bytes(): number[];
        /**
         * Returns the raw Address bytes as a hex encoded string
         * @returns {hexstring}
         */
        toHex(): hexstring;
        /**
         * @returns {bech32string}
         */
        toBech32(): bech32string;
        /**
         * @returns {Object}
         */
        dump(): any;
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
         * @type {null | PubKeyHash}
         */
        get pubKeyHash(): PubKeyHash;
        /**
         * @type {null | ValidatorHash}
         */
        get validatorHash(): ValidatorHash;
        /**
         * @type {null | StakeKeyHash | StakingValidatorHash}
         */
        get stakingHash(): StakeKeyHash | StakingValidatorHash;
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
    export class AssetClass extends HeliosData {
        /**
         * @param {AssetClassProps} props
         * @returns {[MintingPolicyHash | MintingPolicyHashProps, ByteArray | ByteArrayProps]}
         */
        static cleanConstructorArgs(props: AssetClassProps): [MintingPolicyHash | MintingPolicyHashProps, ByteArray | ByteArrayProps];
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
         * @param {number[]} bytes
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
     * Collection of non-lovelace assets
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
         * Also normalizes the assets
         * @param {AssetsProps} props
         */
        constructor(props?: AssetsProps);
        /**
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
         * Removes zeros and merges duplicates
         * In-place algorithm
         * Keeps the same order as much as possible
         */
        normalize(): void;
        /**
         * Mutates 'this'
         * @param {MintingPolicyHash | MintingPolicyHashProps} mph
         * @param {ByteArray | ByteArrayProps} tokenName
         * @param {HInt | HIntProps} qty
         */
        addComponent(mph: MintingPolicyHash | MintingPolicyHashProps, tokenName: ByteArray | ByteArrayProps, qty: HInt | HIntProps): void;
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
         * @param {HInt | HIntProps} scalar
         * @returns {Assets}
         */
        mul(scalar: HInt | HIntProps): Assets;
        /**
         * Mutates 'this'
         * Throws error if mph is already contained in 'this'
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
         * Makes sure minting policies are in correct order
         * Mutates 'this'
         * Order of tokens per mintingPolicyHash isn't changed
         */
        sort(): void;
        assertSorted(): void;
        #private;
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
         * @param {ValueProps} props
         * @param {null | Assets | AssetsProps} assets
         */
        constructor(props?: ValueProps, assets?: null | Assets | AssetsProps);
        /**
         * @type {Assets}
         */
        get assets(): Assets;
        /**
         * @type {bigint}
         */
        get lovelace(): bigint;
        /**
         * Setter for lovelace
         * Note: mutation is handy when balancing transactions
         * @param {HInt | HIntProps} lovelace
         */
        setLovelace(lovelace: HInt | HIntProps): void;
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
         * @param {HInt | HIntProps} scalar
         * @returns {Value}
         */
        mul(scalar: HInt | HIntProps): Value;
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
     * @typedef {() => bigint} LiveSlotGetter
     */
    /**
     * NetworkParams contains all protocol parameters. These are needed to do correct, up-to-date, cost calculations.
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
        get liveSlot(): bigint;
        #private;
    }
    /**
     * A Helios/Uplc Program can have different purposes
     * @typedef {"testing" | "minting" | "spending" | "staking" | "linking" | "module" | "unknown"} ScriptPurpose
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
    }
    /**
     * Plutus-core ByteArray value class
     * Wraps a regular list of uint8 numbers (so not Uint8Array)
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
     * Plutus-core program class
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
         * Wrap the top-level term with consecutive UplcCall terms
         * No checks are performed whether this makes sense or not, so beware
         * Throws an error if you are trying to apply an  with anon func.
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
         * @param {null | UplcValue[]} args
         * @returns {Promise<[(UplcValue | RuntimeError), string[]]>}
         */
        runWithPrint(args: null | UplcValue[]): Promise<[(UplcValue | RuntimeError), string[]]>;
        /**
         * @param {UplcValue[]} args
         * @param {NetworkParams} networkParams
         * @returns {Promise<Profile>}
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
     * NativeScript allows creating basic multi-signature and time-based validators.
     *
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
         * @returns {number[]}
         */
        hash(): number[];
        /**
         * A NativeScript can be used both as a Validator and as a MintingPolicy
         * @type {ValidatorHash}
         */
        get validatorHash(): ValidatorHash;
        /**
         * A NativeScript can be used both as a Validator and as a MintingPolicy
         * @type {MintingPolicyHash}
         */
        get mintingPolicyHash(): MintingPolicyHash;
        #private;
    }
    export class Tx extends CborData {
        /**
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
         * @param {{[name: string]: UplcProgram}} scripts
         * @returns {Promise<Tx>}
         */
        static finalizeUplcData(data: UplcData, networkParams: NetworkParams, changeAddress: Address, spareUtxos: TxInput[], scripts: {
            [name: string]: UplcProgram;
        }): Promise<Tx>;
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
         * @returns {Object}
         */
        dump(): any;
        /**
         * @param {bigint | Date } slotOrTime
         * @returns {Tx}
         */
        validFrom(slotOrTime: bigint | Date): Tx;
        /**
         * @param {bigint | Date } slotOrTime
         * @returns {Tx}
         */
        validTo(slotOrTime: bigint | Date): Tx;
        /**
         * Throws error if assets of given mph are already being minted in this transaction
         * @param {MintingPolicyHash | MintingPolicyHashProps} mph
         * @param {[ByteArray | ByteArrayProps, HInt | HIntProps][]} tokens - list of pairs of [tokenName, quantity], tokenName can be list of bytes or hex-string
         * @param {UplcDataValue | UplcData | null} redeemer
         * @returns {Tx}
         */
        mintTokens(mph: MintingPolicyHash | MintingPolicyHashProps, tokens: [ByteArray | ByteArrayProps, HInt | HIntProps][], redeemer: UplcDataValue | UplcData | null): Tx;
        /**
         * @param {TxInput} input
         * @param {null | UplcDataValue | UplcData | HeliosData} rawRedeemer
         * @returns {Tx}
         */
        addInput(input: TxInput, rawRedeemer?: null | UplcDataValue | UplcData | HeliosData): Tx;
        /**
         * @param {TxInput[]} inputs
         * @param {?(UplcDataValue | UplcData | HeliosData)} redeemer
         * @returns {Tx}
         */
        addInputs(inputs: TxInput[], redeemer?: (UplcDataValue | UplcData | HeliosData) | null): Tx;
        /**
         * @param {TxInput} input
         * @param {null | UplcProgram} refScript
         * @returns {Tx}
         */
        addRefInput(input: TxInput, refScript?: null | UplcProgram): Tx;
        /**
         * @param {TxInput[]} inputs
         * @returns {Tx}
         */
        addRefInputs(inputs: TxInput[]): Tx;
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
         * @param {UplcProgram | NativeScript} program
         * @returns {Tx}
         */
        attachScript(program: UplcProgram | NativeScript): Tx;
        /**
         * Usually adding only one collateral input is enough
         * Must be less than the limit in networkParams (eg. 3), or else an error is thrown during finalization
         * @param {TxInput} input
         * @returns {Tx}
         */
        addCollateral(input: TxInput): Tx;
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
         * Calculates fee and balances transaction by sending an output back to changeAddress
         * First assumes that change output isn't needed, and if that assumption doesn't result in a balanced transaction the change output is created.
         * Iteratively increments the fee because the fee increase the tx size which in turn increases the fee (always converges within two steps though).
         * Throws error if transaction can't be balanced.
         * Shouldn't be used directly
         * @param {NetworkParams} networkParams
         * @param {Address} changeAddress
         * @param {TxInput[]} spareUtxos - used when there are yet enough inputs to cover everything (eg. due to min output lovelace requirements, or fees)
         * @returns {TxOutput} - changeOutput so the fee can be mutated furthers
         */
        balanceLovelace(networkParams: NetworkParams, changeAddress: Address, spareUtxos: TxInput[]): TxOutput;
        /**
         * @param {NetworkParams} networkParams
         * @param {TxOutput} changeOutput
         */
        correctChangeOutput(networkParams: NetworkParams, changeOutput: TxOutput): void;
        checkBalanced(): void;
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
         * @param {NetworkParams} networkParams
         */
        finalizeValidityTimeRange(networkParams: NetworkParams): void;
        /**
         * Assumes transaction hasn't yet been signed by anyone (i.e. witnesses.signatures is empty)
         * Mutates 'this'
         * Note: this is an async function so that a debugger can optionally be attached in the future
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
         * @type {bigint | null}
         */
        get firstValidSlot(): bigint;
        /**
         * @type {bigint | null}
         */
        get lastValidSlot(): bigint;
        /**
         * @type {PubKeyHash[]}
         */
        get signers(): PubKeyHash[];
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
         * A serialized tx throws away input information
         * This must be refetched from the network if the tx needs to be analyzed
         * @param {(id: TxOutputId) => Promise<TxOutput>} fn
         */
        completeInputData(fn: (id: TxOutputId) => Promise<TxOutput>): Promise<void>;
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
         * @param {MintingPolicyHash | MintingPolicyHashProps} mph - minting policy hash
         * @param {[ByteArray | ByteArrayProps, HInt | HIntProps][]} tokens
         */
        addMint(mph: MintingPolicyHash | MintingPolicyHashProps, tokens: [ByteArray | ByteArrayProps, HInt | HIntProps][]): void;
        /**
         * @param {TxInput} input
         * @param {boolean} checkUniqueness
         */
        addInput(input: TxInput, checkUniqueness?: boolean): void;
        /**
         * Used to remove dummy inputs
         * Dummy inputs are needed to be able to correctly estimate fees
         * Throws an error if input doesn't exist in list of inputs
         * Internal use only!
         * @param {TxInput} input
         */
        removeInput(input: TxInput): void;
        /**
         * @param {TxInput} input
         * @param {boolean} checkUniqueness
         */
        addRefInput(input: TxInput, checkUniqueness?: boolean): void;
        /**
         * @param {TxOutput} output
         */
        addOutput(output: TxOutput): void;
        /**
         * Used to remove dummy outputs
         * Dummy outputs are needed to be able to correctly estimate fees
         * Throws an error if the output doesn't exist in list of outputs
         * Internal use only!
         * @param {TxOutput} output
         */
        removeOutput(output: TxOutput): void;
        /**
         * @param {PubKeyHash} hash
         * @param {boolean} checkUniqueness
         */
        addSigner(hash: PubKeyHash, checkUniqueness?: boolean): void;
        /**
         * @param {TxInput} input
         */
        addCollateral(input: TxInput): void;
        /**
         * @param {Hash | null} scriptDataHash
         */
        setScriptDataHash(scriptDataHash: Hash | null): void;
        /**
         * @param {Hash} metadataHash
         */
        setMetadataHash(metadataHash: Hash): void;
        /**
         * @param {TxOutput | null} output
         */
        setCollateralReturn(output: TxOutput | null): void;
        /**
         * Calculates the number of dummy signatures needed to get precisely the right tx size
         * @returns {number}
         */
        countUniqueSigners(): number;
        /**
         * Script hashes are found in addresses of TxInputs and hashes of the minted MultiAsset
         * @param {Map<hexstring, number>} set - hashes in hex format
         */
        collectScriptHashes(set: Map<hexstring, number>): void;
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
         * @param {null | bigint} minCollateral
         */
        checkCollateral(networkParams: NetworkParams, minCollateral: null | bigint): void;
        /**
         * Makes sore inputs, withdrawals, and minted assets are in correct order
         * Mutates
         */
        sort(): void;
        /**
         * Used by (indirectly) by emulator to check if slot range is valid.
         * Note: firstValidSlot == lastValidSlot is allowed
         * @param {bigint} slot
         */
        isValid(slot: bigint): boolean;
        #private;
    }
    /**
     * TxWitnesses represents the non-hashed part of transaction. TxWitnesses contains the signatures, the datums, the redeemers, and the scripts, associated with a given transaction.
     */
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
         * @returns {boolean}
         */
        anyScriptCallsTxTimeRange(): boolean;
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
         * @param {NativeScript} script
         */
        attachNativeScript(script: NativeScript): void;
        /**
         * Throws error if script was already added before
         * @param {UplcProgram} program
         * @param {boolean} isRef
         */
        attachPlutusScript(program: UplcProgram, isRef?: boolean): void;
        /**
         * Retrieves either a regular script or a reference script
         * @param {Hash} scriptHash - can be ValidatorHash or MintingPolicyHash
         * @returns {UplcProgram}
         */
        getUplcProgram(scriptHash: Hash): UplcProgram;
        /**
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
         * @param {UplcData} data
         * @returns {TxInput}
         */
        static fromUplcData(data: UplcData): TxInput;
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
         * Tx inputs must be ordered.
         * The following function can be used directly by a js array sort
         * @param {TxInput} a
         * @param {TxInput} b
         * @returns {number}
         */
        static comp(a: TxInput, b: TxInput): number;
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
         * @deprecated
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
     * TxOutput
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
         * @param {Address} address
         * @param {Value} value
         * @param {null | Datum} datum
         * @param {null | UplcProgram} refScript
         */
        constructor(address: Address, value: Value, datum?: null | Datum, refScript?: null | UplcProgram);
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
    export class StakeAddress {
        /**
         * @param {StakeAddress} sa
         * @returns {boolean}
         */
        static isForTestnet(sa: StakeAddress): boolean;
        /**
         * Convert regular Address into StakeAddress.
         * Throws an error if the given Address doesn't have a staking part.
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
        /**
         * @param {boolean} isTestnet
         * @param {StakeKeyHash | StakingValidatorHash} hash
         * @returns {StakeAddress}
         */
        static fromHash(isTestnet: boolean, hash: StakeKeyHash | StakingValidatorHash): StakeAddress;
        /**
         * @param {number[]} bytes
         */
        constructor(bytes: number[]);
        /**
         * @type {number[]}
         */
        get bytes(): number[];
        /**
         * @returns {number[]}
         */
        toCbor(): number[];
        /**
         * @returns {string}
         */
        toBech32(): string;
        /**
         * Returns the raw StakeAddress bytes as a hex encoded string
         * @returns {string}
         */
        toHex(): string;
        /**
         * @returns {StakeKeyHash | StakingValidatorHash}
         */
        get stakingHash(): StakeKeyHash | StakingValidatorHash;
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
     * @typedef {{
     *   derivePubKey(): PubKey
     *   sign(msg: number[]): Signature
     * }} PrivateKey
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
     * Used during Bip32PrivateKey derivation, to create a new Bip32PrivateKey instance with a non-publicly deriveable PubKey.
     */
    export const BIP32_HARDEN: 2147483648;
    /**
     * Ed25519-Bip32 extendable PrivateKey (ss)
     * @implements {PrivateKey}
     */
    export class Bip32PrivateKey implements PrivateKey {
        /**
         * Generate a bip32private key from a random number generator.
         * This is not cryptographically secure, only use this for testing purpose
         * @param {NumberGenerator} random
         * @returns {Bip32PrivateKey}
         */
        static random(random: NumberGenerator): Bip32PrivateKey;
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
         * (new Bip32PrivateKey([0x60, 0xd3, 0x99, 0xda, 0x83, 0xef, 0x80, 0xd8, 0xd4, 0xf8, 0xd2, 0x23, 0x23, 0x9e, 0xfd, 0xc2, 0xb8, 0xfe, 0xf3, 0x87, 0xe1, 0xb5, 0x21, 0x91, 0x37, 0xff, 0xb4, 0xe8, 0xfb, 0xde, 0xa1, 0x5a, 0xdc, 0x93, 0x66, 0xb7, 0xd0, 0x03, 0xaf, 0x37, 0xc1, 0x13, 0x96, 0xde, 0x9a, 0x83, 0x73, 0x4e, 0x30, 0xe0, 0x5e, 0x85, 0x1e, 0xfa, 0x32, 0x74, 0x5c, 0x9c, 0xd7, 0xb4, 0x27, 0x12, 0xc8, 0x90, 0x60, 0x87, 0x63, 0x77, 0x0e, 0xdd, 0xf7, 0x72, 0x48, 0xab, 0x65, 0x29, 0x84, 0xb2, 0x1b, 0x84, 0x97, 0x60, 0xd1, 0xda, 0x74, 0xa6, 0xf5, 0xbd, 0x63, 0x3c, 0xe4, 0x1a, 0xdc, 0xee, 0xf0, 0x7a])).sign(textToBytes("Hello World")).bytes => [0x90, 0x19, 0x4d, 0x57, 0xcd, 0xe4, 0xfd, 0xad, 0xd0, 0x1e, 0xb7, 0xcf, 0x16, 0x17, 0x80, 0xc2, 0x77, 0xe1, 0x29, 0xfc, 0x71, 0x35, 0xb9, 0x77, 0x79, 0xa3, 0x26, 0x88, 0x37, 0xe4, 0xcd, 0x2e, 0x94, 0x44, 0xb9, 0xbb, 0x91, 0xc0, 0xe8, 0x4d, 0x23, 0xbb, 0xa8, 0x70, 0xdf, 0x3c, 0x4b, 0xda, 0x91, 0xa1, 0x10, 0xef, 0x73, 0x56, 0x38, 0xfa, 0x7a, 0x34, 0xea, 0x20, 0x46, 0xd4, 0xbe, 0x04]
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
        get programName(): string;
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
         * @param {UplcData} data
         * @returns {null | Datum}
         */
        static fromUplcData(data: UplcData): null | Datum;
        /**
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
         * @param {null | UplcData} origData
         */
        constructor(hash: DatumHash, origData?: null | UplcData);
        #private;
    }
    /**
     * @typedef {(utxos: TxInput[], amount: Value) => [TxInput[], TxInput[]]} CoinSelectionAlgorithm
     */
    /**
     * Collection of coin selection algorithms
     */
    export class CoinSelection {
        /**
         * @param {TxInput[]} utxos
         * @param {Value} amount
         * @param {boolean} largestFirst
         * @returns {[TxInput[], TxInput[]]} - [picked, not picked that can be used as spares]
         */
        static selectExtremumFirst(utxos: TxInput[], amount: Value, largestFirst: boolean): [TxInput[], TxInput[]];
        static selectSmallestFirst(utxos: TxInput[], amount: Value): [TxInput[], TxInput[]];
        static selectLargestFirst(utxos: TxInput[], amount: Value): [TxInput[], TxInput[]];
    }
    /**
     * @typedef {{
     *     isMainnet(): Promise<boolean>,
     *     usedAddresses: Promise<Address[]>,
     *     unusedAddresses: Promise<Address[]>,
     *     utxos: Promise<TxInput[]>,
     *     collateral: Promise<TxInput[]>,
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
     *     getCollateral(): Promise<string[]>,
     *     signTx(txHex: string, partialSign: boolean): Promise<string>,
     *     submitTx(txHex: string): Promise<string>,
     *     experimental: {
     *         getCollateral(): Promise<string[]>
     *     },
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
     * Wraps an instance implementing the Wallet interface in order to provide additional functionality.
     */
    export class WalletHelper {
        /**
         * @param {Wallet} wallet
         * @param {undefined | ((addr: Address[]) => Promise<TxInput[]>)} getUtxosFallback
         */
        constructor(wallet: Wallet, getUtxosFallback?: (addr: Address[]) => Promise<TxInput[]>);
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
         * @type {Promise<null | TxInput>}
         */
        get refUtxo(): Promise<TxInput>;
        /**
         * @returns {Promise<TxInput[]>}
         */
        getUtxos(): Promise<TxInput[]>;
        /**
         * @param {Value} amount
         * @param {CoinSelectionAlgorithm} algorithm
         * @returns {Promise<[TxInput[], TxInput[]]>} - [picked, not picked that can be used as spares]
         */
        pickUtxos(amount: Value, algorithm?: CoinSelectionAlgorithm): Promise<[TxInput[], TxInput[]]>;
        /**
         * Returned collateral can't contain an native assets (pure lovelace)
         * TODO: combine UTxOs if a single UTxO isn't enough
         * @param {bigint} amount - 2 Ada should cover most things
         * @returns {Promise<TxInput>}
         */
        pickCollateral(amount?: bigint): Promise<TxInput>;
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
        /**
         * @param {undefined | ((addrs: Address[]) => Promise<TxInput[]>)} utxosFallback
         * @returns {Promise<any>}
         */
        toJson(utxosFallback?: (addrs: Address[]) => Promise<TxInput[]>): Promise<any>;
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
     * @typedef {{
     *     getUtxos(address: Address): Promise<TxInput[]>
     *     getUtxo(id: TxOutputId): Promise<TxInput>
     *     getParameters(): Promise<NetworkParams>
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
         * @returns {Promise<NetworkParams>}
         */
        getParameters(): Promise<NetworkParams>;
        /**
         * @returns {Promise<any>}
         */
        getLatestEpoch(): Promise<any>;
        /**
         * @param {TxOutputId} id
         * @returns {Promise<TxInput>}
         */
        getUtxo(id: TxOutputId): Promise<TxInput>;
        /**
         * Used by BlockfrostV0.resolve()
         * @param {TxInput} utxo
         * @returns {Promise<boolean>}
         */
        hasUtxo(utxo: TxInput): Promise<boolean>;
        /**
         * Returns oldest UTxOs first, newest last.
         * TODO: pagination
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
     * Single address wallet emulator.
     * @implements {Wallet}
     */
    export class WalletEmulator implements Wallet {
        /**
         * @param {Network} network
         * @param {NumberGenerator} random - used to generate the private key
         */
        constructor(network: Network, random: NumberGenerator);
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
     * @implements {Network}
     */
    export class NetworkEmulator implements Network {
        /**
         * @param {number} seed
         */
        constructor(seed?: number);
        /**
         * Create a copy of networkParams that always has access to the current slot
         *  (for setting the validity range automatically)
         * @param {NetworkParams} networkParams
         * @returns {NetworkParams}
         */
        initNetworkParams(networkParams: NetworkParams): NetworkParams;
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
     * @typedef {() => UplcData} ValueGenerator
     */
    /**
     * @typedef {(args: UplcValue[], res: (UplcValue | RuntimeError), isSimplfied?: boolean) => (boolean | Object.<string, boolean>)} PropertyTest
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
    export type hexstring = string & {};
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
    export type Decoder = (i: number, bytes: number[]) => void;
    /**
     * Deprecated
     */
    export type HIntProps = number | bigint;
    export type ByteArrayProps = hexstring | number[];
    export type HashProps = hexstring | number[];
    export type DatumHashProps = HashProps;
    export type PubKeyProps = hexstring | number[];
    export type PubKeyHashProps = HashProps;
    export type MintingPolicyHashProps = HashProps;
    export type StakeKeyHashProps = HashProps;
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
     * A valid bech32 string
     */
    export type bech32string = string & {};
    export type AddressProps = bech32string | hexstring | number[];
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
    export type ScriptPurpose = "testing" | "minting" | "spending" | "staking" | "linking" | "module" | "unknown";
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
        size?: number;
        builtins?: {
            [name: string]: Cost;
        };
        terms?: {
            [name: string]: Cost;
        };
        result?: RuntimeError | UplcValue;
        messages?: string[];
    };
    export type UserTypes = {
        [name: string]: any;
    };
    export type ProgramConfig = {
        allowPosParams: boolean;
        invertEntryPoint: boolean;
    };
    export type PrivateKey = {
        derivePubKey(): PubKey;
        sign(msg: number[]): Signature;
    };
    export type CoinSelectionAlgorithm = (utxos: TxInput[], amount: Value) => [TxInput[], TxInput[]];
    export type Wallet = {
        isMainnet(): Promise<boolean>;
        usedAddresses: Promise<Address[]>;
        unusedAddresses: Promise<Address[]>;
        utxos: Promise<TxInput[]>;
        collateral: Promise<TxInput[]>;
        signTx(tx: Tx): Promise<Signature[]>;
        submitTx(tx: Tx): Promise<TxId>;
    };
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
    export type Network = {
        getUtxos(address: Address): Promise<TxInput[]>;
        getUtxo(id: TxOutputId): Promise<TxInput>;
        getParameters(): Promise<NetworkParams>;
        submitTx(tx: Tx): Promise<TxId>;
    };
    /**
     * collectUtxos removes tx inputs from the list, and appends txoutputs sent to the address to the end.
     */
    export type ValueGenerator = () => UplcData;
    export type PropertyTest = (args: UplcValue[], res: (UplcValue | RuntimeError), isSimplfied?: boolean) => (boolean | {
        [x: string]: boolean;
    });
    /**
     * UplcStack contains a value that can be retrieved using a Debruijn index.
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

