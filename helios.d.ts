/**
 * @template Ta
 * @template Tb
 * @param {[Ta | null, Tb | null][]} pairs
 * @returns {null | [Ta, Tb][]}
 */
export function reduceNullPairs<Ta, Tb>(pairs: [Ta, Tb][]): [Ta, Tb][];
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
 * Dynamically constructs a new List class, depending on the item type.
 * @template {HeliosData} T
 * @param {HeliosDataClass<T>} ItemClass
 * @returns {HeliosDataClass<HList_>}
 */
export function HList<T extends HeliosData>(ItemClass: HeliosDataClass<T>): HeliosDataClass<{
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
     * Defaults to cbor encoding of uplc data structure.
     * @returns {number[]}
     */
    toCbor(): number[];
}>;
/**
 * @template {HeliosData} TKey
 * @template {HeliosData} TValue
 * @param {HeliosDataClass<TKey>} KeyClass
 * @param {HeliosDataClass<TValue>} ValueClass
 * @returns {HeliosDataClass<HMap_>}
 */
export function HMap<TKey extends HeliosData, TValue extends HeliosData>(KeyClass: HeliosDataClass<TKey>, ValueClass: HeliosDataClass<TValue>): HeliosDataClass<{
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
     * Defaults to cbor encoding of uplc data structure.
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
     * Defaults to cbor encoding of uplc data structure.
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
 * Tokenizes a string (wrapped in Source)
 * Also used by VSCode plugin
 * @param {Source} src
 * @returns {Token[] | null}
 */
export function tokenize(src: Source): Token[] | null;
/**
 * @template {HeliosData} T
 */
/**
 * @typedef {{
 *   type:  string
 * } | {
 *   type:     "List"
 *   itemType: TypeSchema
 * } | {
 *   type:      "Map"
 *   keyType:   TypeSchema
 *   valueType: TypeSchema
 * } | {
 *   type:     "Option"
 *   someType: TypeSchema
 * } | {
 *   type:       "Struct"
 *   fieldTypes: NamedTypeSchema[]
 * } | {
 *   type:         "Enum"
 *   variantTypes: {name: string, fieldTypes: NamedTypeSchema[]}[]
 * }} TypeSchema
 */
/**
 * @typedef {{
 * 	 name: string
 * } & TypeSchema} NamedTypeSchema
 */
/**
 * @typedef {{
 *   name: string
 *   typeClass: TypeClass
 * }} ParameterI
 */
/**
 * @typedef {Map<ParameterI, Type>} InferenceMap
 */
/**
 * Used by the bundle cli command to generate a typescript annotations and (de)serialization code
 * inputTypes form a type union
 * @typedef {{
 *   inputType:    string
 *   outputType:   string
 *   internalType: TypeSchema
 * }} TypeDetails
 */
/**
 * @typedef {Named & Type & {
 *   asDataType:   DataType
 *   fieldNames:   string[]
 *   offChainType: (null | HeliosDataClass<HeliosData>)
 *   typeDetails?: TypeDetails
 *   jsToUplc:     (obj: any) => UplcData
 *   uplcToJs:     (data: UplcData) => any
 *   ready:        boolean
 * }} DataType
 */
/**
 * @typedef {DataType & {
 *   asEnumMemberType: EnumMemberType
 *   constrIndex:      number
 *   parentType:       DataType
 * }} EnumMemberType
 */
/**
 * EvalEntities assert themselves
 * @typedef {{
 *   asDataType:       (null | DataType)
 *   asEnumMemberType: (null | EnumMemberType)
 *   asFunc:           (null | Func)
 *   asInstance:       (null | Instance)
 *   asMulti:          (null | Multi)
 *   asNamed:          (null | Named)
 *   asNamespace:      (null | Namespace)
 *   asParametric:     (null | Parametric)
 * 	 asType:           (null | Type)
 *   asTyped:          (null | Typed)
 *   asTypeClass:      (null | TypeClass)
 *   toString():       string
 * }} EvalEntity
 */
/**
 * @typedef {Typed & {
 *   asFunc: Func
 *   call(site: Site, args: Typed[], namedArgs?: {[name: string]: Typed}): (Typed | Multi)
 * }} Func
 */
/**
 * @typedef {Typed & {
 *   asInstance:      Instance
 *   fieldNames:      string[]
 *   instanceMembers: InstanceMembers
 * }} Instance
 */
/**
 * @typedef {EvalEntity & {
 *	 asMulti: Multi
 *   values:  Typed[]
 * }} Multi
 */
/**
 * @typedef {EvalEntity & {
 *   asNamed: Named
 *   name:    string
 *   path:    string
 * }} Named
 */
/**
 * @typedef {EvalEntity & {
 *   asNamespace: Namespace
 *   namespaceMembers: NamespaceMembers
 * }} Namespace
 */
/**
 * @typedef {EvalEntity & {
 *   asParametric: Parametric
 *   offChainType: (null | ((...any) => HeliosDataClass<HeliosData>))
 *   typeClasses: TypeClass[]
 *   apply(types: Type[], site?: Site): EvalEntity
 *   inferCall(site: Site, args: Typed[], namedArgs?: {[name: string]: Typed}, paramTypes?: Type[]): Func
 * 	 infer(site: Site, map: InferenceMap): Parametric
 * }} Parametric
 */
/**
 * @typedef {EvalEntity & {
 *   asType:               Type
 *   instanceMembers:      InstanceMembers
 *   typeMembers:          TypeMembers
 *   isBaseOf(type: Type): boolean
 *   infer(site: Site, map: InferenceMap, type: null | Type): Type
 *   toTyped():            Typed
 * }} Type
 */
/**
 * @typedef {EvalEntity & {
 *   asTyped: Typed
 *   type: Type
 * }} Typed
 */
/**
 * @typedef {EvalEntity & {
 *   asTypeClass:                        TypeClass
 *   genInstanceMembers(impl: Type):     TypeClassMembers
 *   genTypeMembers(impl: Type):         TypeClassMembers
 *   isImplementedBy(type: Type):        boolean
 *   toType(name: string, path: string, parameter?: null | ParameterI): Type
 * }} TypeClass
 */
/**
 * @typedef {{[name: string]: (Parametric | Type)}} InstanceMembers
 */
/**
 * @typedef {{[name: string]: EvalEntity}} NamespaceMembers
 */
/**
 * @typedef {{[name: string]: (Parametric | Type | Typed)}} TypeMembers
 */
/**
 * @typedef {{[name: string]: Type}} TypeClassMembers
 */
/**
 * @param {Parametric} parametric
 * @param {Type[]} types
 * @returns {DataType}
 */
export function applyTypes(parametric: Parametric, ...types: Type[]): DataType;
/**
 * @param {Type[]} itemTypes
 * @returns {Type}
 */
export function IteratorType$(itemTypes: Type[]): Type;
/**
 * @param {Type} itemType
 * @returns {DataType}
 */
export function ListType$(itemType: Type): DataType;
/**
 * @param {Type} keyType
 * @param {Type} valueType
 * @returns {DataType}
 */
export function MapType$(keyType: Type, valueType: Type): DataType;
/**
 * @param {Type} someType
 * @returns {DataType}
 */
export function OptionType$(someType: Type): DataType;
/**
 * Used by VSCode plugin
 * @param {(path: StringLiteral) => (string | null)} fn
 */
export function setImportPathTranslator(fn: (path: StringLiteral) => (string | null)): void;
/**
 * Also used by VSCode plugin
 * @param {Token[]} ts
 * @param {null | ScriptPurpose} expectedPurpose
 * @returns {[null | ScriptPurpose, Word | null, Statement[], number]}
 */
export function buildScript(ts: Token[], expectedPurpose?: null | ScriptPurpose): [null | ScriptPurpose, Word | null, Statement[], number];
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
 * @param {TypeSchema} schema
 * @param {any} obj
 * @returns {UplcData}
 */
export function jsToUplc(schema: TypeSchema, obj: any): UplcData;
/**
 * @param {TypeSchema} schema
 * @param {UplcData} data
 * @returns {any}
 */
export function uplcToJs(schema: TypeSchema, data: UplcData): any;
/**
 * Version of the Helios library.
 */
export const VERSION: "0.14.1";
/**
 * Modifiable config vars
 * @type {{
 *   DEBUG: boolean,
 *   STRICT_BABBAGE: boolean,
 *   IS_TESTNET: boolean,
 *   N_DUMMY_INPUTS: number,
 *   AUTO_SET_VALIDITY_RANGE: boolean,
 *   VALIDITY_RANGE_START_OFFSET: number | null,
 *   VALIDITY_RANGE_END_OFFSET: number | null
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
     * @param {null | number} fileIndex
     */
    constructor(raw: string, fileIndex?: null | number);
    /**
     * @param {TransferUplcAst} other
     * @returns {any}
     */
    transfer(other: TransferUplcAst): any;
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
     * @type {Error[]}
     */
    get errors(): Error[];
    throwErrors(): void;
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
    posToLineAndCol(pos: number): [number, number];
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
 * UserErrors are generated when the user of Helios makes a mistake (eg. a syntax error),
 * or when the user of Helios throws an explicit error inside a script (eg. division by zero).
 */
export class UserError extends Error {
    /**
     * @param {string} type
     * @param {Source} src
     * @param {number} startPos
     * @param {number} endPos
     * @param {string} info
     */
    static new(type: string, src: Source, startPos: number, endPos: number, info?: string): UserError;
    /**
     * Constructs a SyntaxError
     * @param {Source} src
     * @param {number} startPos
     * @param {number} endPos
     * @param {string} info
     * @returns {UserError}
     */
    static syntaxError(src: Source, startPos: number, endPos: number, info?: string): UserError;
    /**
     * Constructs a TypeError
     * @param {Source} src
     * @param {number} startPos
     * @param {number} endPos
     * @param {string} info
     * @returns {UserError}
     */
    static typeError(src: Source, startPos: number, endPos: number, info?: string): UserError;
    /**
     * @param {Error} e
     * @returns {boolean}
     */
    static isTypeError(e: Error): boolean;
    /**
     * Constructs a ReferenceError (i.e. name undefined, or name unused)
     * @param {Source} src
     * @param {number} startPos
     * @param {number} endPos
     * @param {string} info
     * @returns {UserError}
     */
    static referenceError(src: Source, startPos: number, endPos: number, info?: string): UserError;
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
     * @param {number} startPos
     * @param {number} endPos
     */
    constructor(msg: string, src: Source, startPos: number, endPos?: number);
    /**
     * @type {Source}
     */
    get src(): Source;
    /**
     * @type {Object}
     */
    get context(): any;
    get data(): void;
    /**
     * @type {number}
     */
    get startPos(): number;
    /**
     * Calculates column/line position in 'this.src'.
     * @returns {[number, number, number, number]} - [startLine, startCol, endLine, endCol]
     */
    getFilePos(): [number, number, number, number];
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
     * @returns {boolean}
     */
    isKeyword(): boolean;
    /**
     * Returns 'true' if 'this' is a Symbol token (eg. '+', '(' etc.)
     * @param {?(string | string[])} value
     * @returns {boolean}
     */
    isSymbol(value?: (string | string[]) | null): boolean;
    /**
     * Returns 'true' if 'this' is a group (eg. '(...)').
     * @param {?string} value
     * @param {number | null} nFields
     * @returns {boolean}
     */
    isGroup(value: string | null, nFields?: number | null): boolean;
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
     * @returns {Word | null}
     */
    assertWord(value?: (string | string[]) | null): Word | null;
    /**
     * Throws a SyntaxError if 'this' isn't a Symbol.
     * @param {?(string | string[])} value
     * @returns {SymbolToken | null}
     */
    assertSymbol(value?: (string | string[]) | null): SymbolToken | null;
    /**
     * Throws a SyntaxError if 'this' isn't a Group.
     * @param {?string} type
     * @param {?number} nFields
     * @returns {Group | null}
     */
    assertGroup(type?: string | null, nFields?: number | null): Group | null;
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
     * @example
     * bytesToHex(Crypto.sha2_512(textToBytes("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"))) => "204a8fc6dda82f0a0ced7beb8e08a41657c16ef468b228a8279be331a703c33596fd15c13b1b07f9aa1d3bea57789ca031ad85c7a71dd70354ec631238ca3445"
     * @example
     * bytesToHex(Crypto.sha2_512(textToBytes("abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstuu"))) => "23565d109ac0e2aa9fb162385178895058b28489a6bc31cb55491ed83956851ab1d4bbd46440586f5c9c4b69c9c280118cbc55c71495d258cc27cc6bb25ee720"
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
     * Calculates blake2b hash of a list of uint8 numbers (variable digest size).
     * Result is also a list of uint8 number.
     * Blake2b is a 64bit algorithm, so we need to be careful when replicating 64-bit operations with 2 32-bit numbers (low-word overflow must spill into high-word, and shifts must go over low/high boundary)
     * @example
     * bytesToHex(Crypto.blake2b([0, 1])) => "01cf79da4945c370c68b265ef70641aaa65eaa8f5953e3900d97724c2c5aa095"
     * @example
     * bytesToHex(Crypto.blake2b(textToBytes("abc"), 64)) => "ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d17d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923"
     * @package
     * @param {number[]} bytes
     * @param {number} digestSize - at most 64
     * @returns {number[]}
     */
    static blake2b(bytes: number[], digestSize?: number): number[];
    /**
     * Crypto.Ed25519 exports the following functions:
     *  * Crypto.Ed25519.derivePublicKey(privateKey)
     *  * Crypto.Ed25519.sign(message, privateKey)
     *  * Crypto.Ed25519.verify(message, signature, publicKey)
     *
     * Ported from: https://ed25519.cr.yp.to/python/ed25519.py
     * ExtendedPoint implementation from: https://github.com/paulmillr/noble-ed25519
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
 */
export class HeliosData extends CborData {
    /**
     * Most HeliosData classes are builtin
     * @returns {boolean}
     */
    static isBuiltin(): boolean;
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
 *
 * @typedef {{
 *   new(...args: any[]): T
 *   fromUplcCbor: (bytes: (string | number[])) => T
 *   fromUplcData: (data: UplcData) => T
 *   isBuiltin(): boolean
 * }} HeliosDataClass
 */
/**
 * @typedef {number | bigint} HIntProps
 */
/**
 * Helios Int type
 */
export class HInt extends HeliosData {
    /**
     * @package
     * @param {HIntProps} rawValue
     * @returns {bigint}
     */
    static cleanConstructorArg(rawValue: HIntProps): bigint;
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
     * @param {ExpandAlias<HIntProps>} rawValue
     */
    constructor(rawValue: ExpandAlias<HIntProps>);
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
 * @typedef {number | bigint | string | Date} TimeProps
 */
/**
 * Milliseconds since 1 jan 1970
 */
export class Time extends HInt {
    /**
    * @package
    * @param {TimeProps} props
    * @returns {bigint}
    */
    static cleanConstructorArg(props: TimeProps): bigint;
    /**
     * @param {Time | TimeProps} props
     * @returns {Time}
     */
    static fromProps(props: Time | TimeProps): Time;
    /**
     * @param {ExpandAlias<TimeProps>} props
     */
    constructor(props: ExpandAlias<TimeProps>);
}
/**
 * @typedef {HIntProps} DurationProps
 */
/**
 * Difference between two time values in milliseconds.
 */
export class Duration extends HInt {
}
/**
 * @typedef {boolean | string} BoolProps
 */
/**
 * Helios Bool type
 */
export class Bool extends HeliosData {
    /**
     * @package
     * @param {BoolProps} props
     * @returns {boolean}
     */
    static cleanConstructorArg(props: BoolProps): boolean;
    /**
     * @param {Bool | BoolProps} props
     * @returns {Bool}
     */
    static fromProps(props: Bool | BoolProps): Bool;
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
     * @param {ExpandAlias<BoolProps>} props
     */
    constructor(props: ExpandAlias<BoolProps>);
    /**
     * @type {boolean}
     */
    get bool(): boolean;
    #private;
}
/**
 * @typedef {string} HStringProps
 */
/**
 * Helios String type.
 * Can't be named 'String' because that would interfere with the javascript 'String'-type
 */
export class HString extends HeliosData {
    /**
     * @param {HString | HStringProps} props
     * @returns {HString}
     */
    static fromProps(props: HString | HStringProps): HString;
    /**
     * @param {UplcData} data
     * @returns {HString}
     */
    static fromUplcData(data: UplcData): HString;
    /**
     * @param {string | number[]} bytes
     * @returns {HString}
     */
    static fromUplcCbor(bytes: string | number[]): HString;
    /**
     * @param {ExpandAlias<HStringProps>} props
     */
    constructor(props: ExpandAlias<HStringProps>);
    /**
     * @type {string}
     */
    get string(): string;
    #private;
}
/**
 * @typedef {hexstring | number[]} ByteArrayProps
 */
/**
 * Helios ByteArray type
 */
export class ByteArray extends HeliosData {
    /**
     * @package
     * @param {ByteArrayProps} props
     */
    static cleanConstructorArg(props: ByteArrayProps): number[];
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
     * @param {ExpandAlias<ByteArrayProps>} props
     */
    constructor(props: ExpandAlias<ByteArrayProps>);
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
     * @param {ExpandAlias<PubKeyProps>} props
     */
    constructor(props: ExpandAlias<PubKeyProps>);
    /**
     * @type {number[]}
     */
    get bytes(): number[];
    /**
     * @type {hexstring}
     */
    get hex(): hexstring;
    /**
     * @returns {boolean}
     */
    isDummy(): boolean;
    /**
     * @returns {PubKeyHash}
     */
    hash(): PubKeyHash;
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
 * @typedef {HashProps} ScriptHashProps
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
 * 	 TxId | ExpandAlias<TxIdProps>,
 *   HInt | ExpandAlias<HIntProps>
 * ] | {
 *   txId: TxId | ExpandAlias<TxIdProps>
 *   utxoId: HInt | ExpandAlias<HIntProps>
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
     * @param {ExpandAlias<TxOutputIdProps>} props
     */
    constructor(props: ExpandAlias<TxOutputIdProps>);
    /**
     * @type {TxId}
     */
    get txId(): TxId;
    /**
     * @type {number}
     */
    get utxoIdx(): number;
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
 * See CIP19 for formatting of first byte
 */
export class Address extends HeliosData {
    /**
     * @package
     * @param {AddressProps} props
     * @returns {number[]}
     */
    static cleanConstructorArg(props: AddressProps): number[];
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
     * @param {ExpandAlias<AddressProps>} props
     */
    constructor(props: ExpandAlias<AddressProps>);
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
 *   MintingPolicyHash | ExpandAlias<MintingPolicyHashProps>,
 *   ByteArray | ExpandAlias<ByteArrayProps>
 * ] | {
 *   mph: MintingPolicyHash | ExpandAlias<MintingPolicyHashProps>,
 *   tokenName: ByteArray | ExpandAlias<ByteArrayProps>
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
     * @param {ExpandAlias<AssetClassProps>} props
     */
    constructor(props: ExpandAlias<AssetClassProps>);
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
export const UPLC_MACROS_OFFSET: number;
export const UPLC_MACROS: string[];
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
 * @package
 * @typedef {[?string, UplcValue][]} UplcRawStack
 */
/**
 * @typedef {{
 *	 onPrint: (msg: string) => Promise<void>
 *   onStartCall: (site: Site, rawStack: UplcRawStack) => Promise<boolean>
 *   onEndCall: (site: Site, rawStack: UplcRawStack) => Promise<void>
 *   onIncrCost: (name: string, isTerm: boolean, cost: Cost) => void
 *   macros?: {[name: string]: (args: UplcValue[]) => UplcValue}
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
 * TODO: purpose as enum type
 * @typedef {{
 *   purpose: null | ScriptPurpose
 *   callsTxTimeRange: boolean
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
 * Plutus-core program class
 */
export class UplcProgram {
    /**
     * @param {number[] | string} bytes
     * @returns {UplcProgram}
     */
    static fromCbor(bytes: number[] | string): UplcProgram;
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
     * @param {null | UplcValue[]} args - if null the top-level term is returned as a value
     * @param {UplcRTECallbacks} callbacks
     * @param {?NetworkParams} networkParams
     * @returns {Promise<UplcValue | UserError>}
     */
    run(args: null | UplcValue[], callbacks?: UplcRTECallbacks, networkParams?: NetworkParams | null): Promise<UplcValue | UserError>;
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
     * @param {Site} site
     * @param {string[]} chars
     * @param {boolean} reverse
     * @returns {string[]}
     */
    static assertCorrectDecimalUnderscores(site: Site, chars: string[], reverse?: boolean): string[];
    /**
     * Separates tokens in fields (separted by commas)
     * @param {Token[]} ts
     * @returns {Group | null}
     */
    static buildGroup(ts: Token[]): Group | null;
    /**
     * @param {Source} src
     * @param {?CodeMap} codeMap
     * @param {boolean} irMode - if true '@' is treated as a regular character
     */
    constructor(src: Source, codeMap?: CodeMap | null, irMode?: boolean);
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
     * @returns {string}
     */
    peekChar(): string;
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
     * @returns {Token[] | null}
     */
    tokenize(): Token[] | null;
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
    readDecimal(site: Site, c0: string): void;
    /**
     * @param {Site} site
     * @param {string} prefix
     * @param {(c: string) => boolean} valid - checks if character is valid as part of the radix
     */
    readRadixInteger(site: Site, prefix: string, valid: (c: string) => boolean): void;
    /**
     * @param {Site} site
     * @param {string[]} leading
     */
    readFixedPoint(site: Site, leading: string[]): void;
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
    /**
     * Match group open with group close symbols in order to form groups.
     * This is recursively applied to nested groups.
     * @param {Token[]} ts
     * @returns {Token[] | null}
     */
    nestGroups(ts: Token[]): Token[] | null;
    #private;
}
export const WalletType: GenericType<HeliosData>;
export const TxBuilderType: GenericType<HeliosData>;
/**
 * @type {{[name: string]: DataType}}
 */
export const builtinTypes: {
    [name: string]: DataType;
};
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
     * @param {IRFuncExpr} anon
     * @param {IRFuncExpr} defExpr
     * @param {Site} parensSite
     */
    constructor(anon: IRFuncExpr, defExpr: IRFuncExpr, parensSite: Site);
    /**
     * @param {IRExprRegistry} registry
     * @returns {[IRFuncExpr, IRExpr]}
     */
    simplifyRecursionArgs(registry: IRExprRegistry): [IRFuncExpr, IRExpr];
    #private;
}
export class IRParametricProgram {
    /**
     * @package
     * @param {IR} ir
     * @param {null | ScriptPurpose} purpose
     * @param {number} nParams
     * @param {boolean} simplify
     * @returns {IRParametricProgram}
     */
    static new(ir: IR, purpose: null | ScriptPurpose, nParams: number, simplify?: boolean): IRParametricProgram;
    /**
     * @param {IRProgram} irProgram
     * @param {number} nParams
     */
    constructor(irProgram: IRProgram, nParams: number);
    /**
     * @returns {UplcProgram}
     */
    toUplc(): UplcProgram;
    #private;
}
/**
 * @typedef {{[name: string]: any}} UserTypes
 */
/**
 * Helios root object
 */
export class Program {
    /**
     * @param {string} rawSrc
     * @returns {[purpose, Module[]]}
     */
    static parseMainInternal(rawSrc: string): [ScriptPurpose, Module[]];
    /**
     *
     * @param {string} mainName
     * @param {string[]} moduleSrcs
     * @returns {Module[]}
     */
    static parseImports(mainName: string, moduleSrcs?: string[]): Module[];
    /**
     * @param {string} mainSrc
     * @param {string[]} moduleSrcs
     * @returns {[null | ScriptPurpose, Module[]]}
     */
    static parseMain(mainSrc: string, moduleSrcs: string[]): [null | ScriptPurpose, Module[]];
    /**
     * Creates  a new program.
     * @param {string} mainSrc
     * @param {string[]} moduleSrcs - optional sources of modules, which can be used for imports
     * @param {{[name: string]: Type}} validatorTypes
     * @param {boolean} allowPosParams
     * @returns {Program}
     */
    static new(mainSrc: string, moduleSrcs?: string[], validatorTypes?: {
        [name: string]: Type;
    }, allowPosParams?: boolean): Program;
    /**
     * For top-level statements
     * @package
     * @param {IR} mainIR
     * @param {IRDefinitions} map
     * @returns {IR}
     */
    static injectMutualRecursions(mainIR: IR, map: IRDefinitions): IR;
    /**
     * Also merges builtins and map
     * @param {IR} mainIR
     * @param {IRDefinitions} map
     * @returns {IRDefinitions}
     */
    static applyTypeParameters(mainIR: IR, map: IRDefinitions): IRDefinitions;
    /**
     * @param {ScriptPurpose} purpose
     * @param {Module[]} modules
     * @param {boolean} allowPosParams
     */
    constructor(purpose: ScriptPurpose, modules: Module[], allowPosParams: boolean);
    /**
     * @type {boolean}
     */
    get allowPosParams(): boolean;
    /**
     * @type {number}
     */
    get nPosParams(): number;
    /**
     * @type {Type[]}
     */
    get posParams(): Type[];
    /**
     * @type {Module[]}
     */
    get mainImportedModules(): Module[];
    /**
     * @type {MainModule}
     */
    get mainModule(): MainModule;
    /**
     * @type {null | Module}
     */
    get postModule(): Module;
    /**
     * @type {ScriptPurpose}
     */
    get purpose(): ScriptPurpose;
    /**
     * @type {string}
     */
    get name(): string;
    /**
     * @type {FuncStatement}
     */
    get mainFunc(): FuncStatement;
    /**
     * @type {string[]}
     */
    get mainArgNames(): string[];
    /**
     * @type {DataType[]}
     */
    get mainArgTypes(): DataType[];
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
     * @param {GlobalScope} globalScope
     * @returns {TopScope}
     */
    evalTypesInternal(globalScope: GlobalScope): TopScope;
    /**
     * @param {{[name: string]: Type}} validatorTypes
     * @returns {TopScope}
     */
    evalTypes(validatorTypes?: {
        [name: string]: Type;
    }): TopScope;
    /**
     * @type {UserTypes}
     */
    get types(): UserTypes;
    /**
     * Fill #types with convenient javascript equivalents of Int, ByteArray etc.
     * @param {TopScope} topScope
     */
    fillTypes(topScope: TopScope): void;
    /**
     * @param {(name: string, cs: ConstStatement) => void} callback
     */
    loopConstStatements(callback: (name: string, cs: ConstStatement) => void): void;
    /**
     * @type {{[name: string]: DataType}}
     */
    get paramTypes(): {
        [name: string]: DataType;
    };
    /**
     * Change the literal value of a const statements
     * @package
     * @param {string} name
     * @param {UplcData} data
     */
    changeParamSafe(name: string, data: UplcData): void;
    /**
     * @param {string} name
     * @returns {ConstStatement | null}
     */
    findConstStatement(name: string): ConstStatement | null;
    /**
     * @param {ConstStatement} constStatement
     * @returns {UplcValue}
     */
    evalConst(constStatement: ConstStatement): UplcValue;
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
     * @package
     * @param {(s: Statement, isImport: boolean) => boolean} endCond
     * @returns {IRDefinitions}
     */
    statementsToIR(endCond: (s: Statement, isImport: boolean) => boolean): IRDefinitions;
    /**
     * @param {IR} ir
     * @param {IRDefinitions} definitions
     * @returns {Set<string>}
     */
    collectAllUsed(ir: IR, definitions: IRDefinitions): Set<string>;
    /**
     * @param {IR} ir
     * @param {IRDefinitions} definitions
     * @returns {IRDefinitions}
     */
    eliminateUnused(ir: IR, definitions: IRDefinitions): IRDefinitions;
    /**
     * Loops over all statements, until endCond == true (includes the matches statement)
     * Then applies type parameters
     * @package
     * @param {IR} ir
     * @param {(s: Statement) => boolean} endCond
     * @returns {IRDefinitions}
     */
    fetchDefinitions(ir: IR, endCond: (s: Statement) => boolean): IRDefinitions;
    /**
     * @param {IR} ir
     * @param {IRDefinitions} definitions
     * @param {null | IRDefinitions} extra
     * @returns {IR}
     */
    wrapInner(ir: IR, definitions: IRDefinitions, extra?: null | IRDefinitions): IR;
    /**
     * @package
     * @param {IR} ir
     * @param {null | IRDefinitions} extra
     * @returns {IR}
     */
    wrapEntryPoint(ir: IR, extra?: null | IRDefinitions): IR;
    /**
     * @returns {IR}
     */
    toIRInternal(): IR;
    /**
     * @package
     * @param {null | IRDefinitions} extra
     * @returns {IR}
     */
    toIR(extra?: null | IRDefinitions): IR;
    /**
     * Non-positional named parameters
     * @type {[string, Type][]}
     */
    get requiredParameters(): [string, Type][];
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
export class LinkingProgram extends GenericProgram {
    /**
     * Creates  a new program.
     * @param {string} mainSrc
     * @param {string[]} moduleSrcs - optional sources of modules, which can be used for imports
     * @param {{[name: string]: Type}} validatorTypes - generators for script hashes, used by ScriptCollection
     * @returns {LinkingProgram}
     */
    static new(mainSrc: string, moduleSrcs?: string[], validatorTypes?: {
        [name: string]: Type;
    }): LinkingProgram;
    /**
     * @param {Module[]} modules
     * @param {Program[]} validators
     */
    constructor(modules: Module[], validators: Program[]);
    /**
     * @package
     * @param {{[name: string]: Type}} validatorTypes
     * @returns {TopScope}
     */
    evalTypes(validatorTypes?: {
        [name: string]: Type;
    }): TopScope;
    #private;
}
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
     * @param {NativeContext} context
     * @returns {boolean}
     */
    eval(context: NativeContext): boolean;
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
     * @param {UTxO[]} spareUtxos
     * @param {{[name: string]: UplcProgram}} scripts
     * @returns {Promise<Tx>}
     */
    static finalizeUplcData(data: UplcData, networkParams: NetworkParams, changeAddress: Address, spareUtxos: UTxO[], scripts: {
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
     * @param {UTxO} input
     * @param {null | UplcDataValue | UplcData | HeliosData} rawRedeemer
     * @returns {Tx}
     */
    addInput(input: UTxO, rawRedeemer?: null | UplcDataValue | UplcData | HeliosData): Tx;
    /**
     * @param {UTxO[]} inputs
     * @param {?(UplcDataValue | UplcData | HeliosData)} redeemer
     * @returns {Tx}
     */
    addInputs(inputs: UTxO[], redeemer?: (UplcDataValue | UplcData | HeliosData) | null): Tx;
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
     * @param {UplcProgram | NativeScript} program
     * @returns {Tx}
     */
    attachScript(program: UplcProgram | NativeScript): Tx;
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
     * @param {NetworkParams} networkParams
     * @returns {Promise<void>}
     */
    checkExecutionBudgets(networkParams: NetworkParams): Promise<void>;
    /**
     * @param {Address} changeAddress
     */
    balanceAssets(changeAddress: Address): void;
    /**
     * Calculate the base fee which will be multiplied by the required min collateral percentage
     * @param {NetworkParams} networkParams
     * @param {Address} changeAddress
     * @param {UTxO[]} spareUtxos
     */
    estimateCollateralBaseFee(networkParams: NetworkParams, changeAddress: Address, spareUtxos: UTxO[]): bigint;
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
     * @param {NetworkParams} networkParams
     */
    finalizeValidityTimeRange(networkParams: NetworkParams): void;
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
     * @param {TxBody} body
     */
    updateRedeemerIndices(body: TxBody): void;
    /**
     * @param {NetworkParams} networkParams
     * @returns {Hash | null} - returns null if there are no redeemers
     */
    calcScriptDataHash(networkParams: NetworkParams): Hash | null;
    /**
     *
     * @param {NetworkParams} networkParams
     * @param {TxBody} body
     * @param {Redeemer} redeemer
     * @param {UplcData} scriptContext
     * @returns {Promise<Cost>}
     */
    executeRedeemer(networkParams: NetworkParams, body: TxBody, redeemer: Redeemer, scriptContext: UplcData): Promise<Cost>;
    /**
     * Executes the redeemers in order to calculate the necessary ex units
     * @param {NetworkParams} networkParams
     * @param {TxBody} body - needed in order to create correct ScriptContexts
     * @param {Address} changeAddress - needed for dummy input and dummy output
     * @returns {Promise<void>}
     */
    executeScripts(networkParams: NetworkParams, body: TxBody, changeAddress: Address): Promise<void>;
    /**
     * @param {TxBody} body
     */
    executeNativeScripts(body: TxBody): void;
    /**
     * Executes the redeemers in order to calculate the necessary ex units
     * @param {NetworkParams} networkParams
     * @param {TxBody} body - needed in order to create correct ScriptContexts
     * @param {Address} changeAddress - needed for dummy input and dummy output
     * @returns {Promise<void>}
     */
    executeRedeemers(networkParams: NetworkParams, body: TxBody, changeAddress: Address): Promise<void>;
    /**
     * Reruns all the redeemers to make sure the ex budgets are still correct (can change due to outputs added during rebalancing)
     * @param {NetworkParams} networkParams
     * @param {TxBody} body
     */
    checkExecutionBudgets(networkParams: NetworkParams, body: TxBody): Promise<void>;
    /**
     * Throws error if execution budget is exceeded
     * @param {NetworkParams} networkParams
     */
    checkExecutionBudgetLimits(networkParams: NetworkParams): void;
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
     * @param {number | bigint} utxoIdx
     * @param {TxOutput} origOutput
     */
    constructor(txId: TxId, utxoIdx: number | bigint, origOutput: TxOutput);
    /**
     * @type {TxId}
     */
    get txId(): TxId;
    /**
     * @type {number}
     */
    get utxoIdx(): number;
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
     *
     * @param {UTxO | TxInput} other
     * @returns {boolean}
     */
    eq(other: UTxO | TxInput): boolean;
    /**
     * @returns {number[]}
     */
    toCbor(): number[];
    #private;
}
export class TxRefInput extends TxInput {
    /**
     * @param {TxId} txId
     * @param {number | bigint} utxoId
     * @param {TxOutput} origOutput
     */
    constructor(txId: TxId, utxoId: number | bigint, origOutput: TxOutput);
}
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
export class PrivateKey extends HeliosData {
    /**
     * Generate a private key from a random number generator.
     * This is not cryptographically secure, only use this for testing purpose
     * @param {NumberGenerator} random
     * @returns {PrivateKey} - Ed25519 private key is 32 bytes long
     */
    static random(random: NumberGenerator): PrivateKey;
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
     * @returns {PrivateKey}
     */
    extend(): PrivateKey;
    /**
     * @returns {PubKey}
     */
    derivePubKey(): PubKey;
    /**
     * @param {number[] | string} message
     * @returns {Signature}
     */
    sign(message: number[] | string): Signature;
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
 * @typedef {(utxos: UTxO[], amount: Value) => [UTxO[], UTxO[]]} CoinSelectionAlgorithm
 */
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
    static selectSmallestFirst(utxos: UTxO[], amount: Value): [UTxO[], UTxO[]];
    static selectLargestFirst(utxos: UTxO[], amount: Value): [UTxO[], UTxO[]];
}
/**
 * @typedef {{
 *     isMainnet(): Promise<boolean>,
 *     usedAddresses: Promise<Address[]>,
 *     unusedAddresses: Promise<Address[]>,
 *     utxos: Promise<UTxO[]>,
 *     collateral: Promise<UTxO[]>,
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
     * @type {Promise<UTxO[]>}
     */
    get utxos(): Promise<UTxO[]>;
    /**
     * @type {Promise<UTxO[]>}
     */
    get collateral(): Promise<UTxO[]>;
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
     * @type {Promise<null | UTxO>}
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
 *     getUtxos(address: Address): Promise<UTxO[]>
 *     getUtxo(id: TxOutputId): Promise<UTxO>
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
     * @param {TxOutputId} id
     * @returns {Promise<UTxO>}
     */
    getUtxo(id: TxOutputId): Promise<UTxO>;
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
export namespace rawNetworkEmulatorParams {
    namespace shelleyGenesis {
        const activeSlotsCoeff: number;
        const epochLength: number;
        const genDelegs: {
            "637f2e950b0fd8f8e3e811c5fbeb19e411e7a2bf37272b84b29c1a0b": {
                delegate: string;
                vrf: string;
            };
            "8a4b77c4f534f8b8cc6f269e5ebb7ba77fa63a476e50e05e66d7051c": {
                delegate: string;
                vrf: string;
            };
            b00470cd193d67aac47c373602fccd4195aad3002c169b5570de1126: {
                delegate: string;
                vrf: string;
            };
            b260ffdb6eba541fcf18601923457307647dce807851b9d19da133ab: {
                delegate: string;
                vrf: string;
            };
            ced1599fd821a39593e00592e5292bdc1437ae0f7af388ef5257344a: {
                delegate: string;
                vrf: string;
            };
            dd2a7d71a05bed11db61555ba4c658cb1ce06c8024193d064f2a66ae: {
                delegate: string;
                vrf: string;
            };
            f3b9e74f7d0f24d2314ea5dfbca94b65b2059d1ff94d97436b82d5b4: {
                delegate: string;
                vrf: string;
            };
        };
        const initialFunds: {};
        const maxKESEvolutions: number;
        const maxLovelaceSupply: number;
        const networkId: string;
        const networkMagic: number;
        namespace protocolParams {
            const a0: number;
            const decentralisationParam: number;
            const eMax: number;
            namespace extraEntropy {
                const tag: string;
            }
            const keyDeposit: number;
            const maxBlockBodySize: number;
            const maxBlockHeaderSize: number;
            const maxTxSize: number;
            const minFeeA: number;
            const minFeeB: number;
            const minPoolCost: number;
            const minUTxOValue: number;
            const nOpt: number;
            const poolDeposit: number;
            namespace protocolVersion {
                const major: number;
                const minor: number;
            }
            const rho: number;
            const tau: number;
        }
        const securityParam: number;
        const slotLength: number;
        const slotsPerKESPeriod: number;
        namespace staking {
            const pools: {};
            const stake: {};
        }
        const systemStart: string;
        const updateQuorum: number;
    }
    namespace alonzoGenesis {
        const lovelacePerUTxOWord: number;
        namespace executionPrices {
            namespace prSteps {
                const numerator: number;
                const denominator: number;
            }
            namespace prMem {
                const numerator_1: number;
                export { numerator_1 as numerator };
                const denominator_1: number;
                export { denominator_1 as denominator };
            }
        }
        namespace maxTxExUnits {
            const exUnitsMem: number;
            const exUnitsSteps: number;
        }
        namespace maxBlockExUnits {
            const exUnitsMem_1: number;
            export { exUnitsMem_1 as exUnitsMem };
            const exUnitsSteps_1: number;
            export { exUnitsSteps_1 as exUnitsSteps };
        }
        const maxValueSize: number;
        const collateralPercentage: number;
        const maxCollateralInputs: number;
        namespace costModels {
            const PlutusV1: {
                "sha2_256-memory-arguments": number;
                "equalsString-cpu-arguments-constant": number;
                "cekDelayCost-exBudgetMemory": number;
                "lessThanEqualsByteString-cpu-arguments-intercept": number;
                "divideInteger-memory-arguments-minimum": number;
                "appendByteString-cpu-arguments-slope": number;
                "blake2b-cpu-arguments-slope": number;
                "iData-cpu-arguments": number;
                "encodeUtf8-cpu-arguments-slope": number;
                "unBData-cpu-arguments": number;
                "multiplyInteger-cpu-arguments-intercept": number;
                "cekConstCost-exBudgetMemory": number;
                "nullList-cpu-arguments": number;
                "equalsString-cpu-arguments-intercept": number;
                "trace-cpu-arguments": number;
                "mkNilData-memory-arguments": number;
                "lengthOfByteString-cpu-arguments": number;
                "cekBuiltinCost-exBudgetCPU": number;
                "bData-cpu-arguments": number;
                "subtractInteger-cpu-arguments-slope": number;
                "unIData-cpu-arguments": number;
                "consByteString-memory-arguments-intercept": number;
                "divideInteger-memory-arguments-slope": number;
                "divideInteger-cpu-arguments-model-arguments-slope": number;
                "listData-cpu-arguments": number;
                "headList-cpu-arguments": number;
                "chooseData-memory-arguments": number;
                "equalsInteger-cpu-arguments-intercept": number;
                "sha3_256-cpu-arguments-slope": number;
                "sliceByteString-cpu-arguments-slope": number;
                "unMapData-cpu-arguments": number;
                "lessThanInteger-cpu-arguments-intercept": number;
                "mkCons-cpu-arguments": number;
                "appendString-memory-arguments-intercept": number;
                "modInteger-cpu-arguments-model-arguments-slope": number;
                "ifThenElse-cpu-arguments": number;
                "mkNilPairData-cpu-arguments": number;
                "lessThanEqualsInteger-cpu-arguments-intercept": number;
                "addInteger-memory-arguments-slope": number;
                "chooseList-memory-arguments": number;
                "constrData-memory-arguments": number;
                "decodeUtf8-cpu-arguments-intercept": number;
                "equalsData-memory-arguments": number;
                "subtractInteger-memory-arguments-slope": number;
                "appendByteString-memory-arguments-intercept": number;
                "lengthOfByteString-memory-arguments": number;
                "headList-memory-arguments": number;
                "listData-memory-arguments": number;
                "consByteString-cpu-arguments-intercept": number;
                "unIData-memory-arguments": number;
                "remainderInteger-memory-arguments-minimum": number;
                "bData-memory-arguments": number;
                "lessThanByteString-cpu-arguments-slope": number;
                "encodeUtf8-memory-arguments-intercept": number;
                "cekStartupCost-exBudgetCPU": number;
                "multiplyInteger-memory-arguments-intercept": number;
                "unListData-memory-arguments": number;
                "remainderInteger-cpu-arguments-model-arguments-slope": number;
                "cekVarCost-exBudgetCPU": number;
                "remainderInteger-memory-arguments-slope": number;
                "cekForceCost-exBudgetCPU": number;
                "sha2_256-cpu-arguments-slope": number;
                "equalsInteger-memory-arguments": number;
                "indexByteString-memory-arguments": number;
                "addInteger-memory-arguments-intercept": number;
                "chooseUnit-cpu-arguments": number;
                "sndPair-cpu-arguments": number;
                "cekLamCost-exBudgetCPU": number;
                "fstPair-cpu-arguments": number;
                "quotientInteger-memory-arguments-minimum": number;
                "decodeUtf8-cpu-arguments-slope": number;
                "lessThanInteger-memory-arguments": number;
                "lessThanEqualsInteger-cpu-arguments-slope": number;
                "fstPair-memory-arguments": number;
                "modInteger-memory-arguments-intercept": number;
                "unConstrData-cpu-arguments": number;
                "lessThanEqualsInteger-memory-arguments": number;
                "chooseUnit-memory-arguments": number;
                "sndPair-memory-arguments": number;
                "addInteger-cpu-arguments-intercept": number;
                "decodeUtf8-memory-arguments-slope": number;
                "equalsData-cpu-arguments-intercept": number;
                "mapData-cpu-arguments": number;
                "mkPairData-cpu-arguments": number;
                "quotientInteger-cpu-arguments-constant": number;
                "consByteString-memory-arguments-slope": number;
                "cekVarCost-exBudgetMemory": number;
                "indexByteString-cpu-arguments": number;
                "unListData-cpu-arguments": number;
                "equalsInteger-cpu-arguments-slope": number;
                "cekStartupCost-exBudgetMemory": number;
                "subtractInteger-cpu-arguments-intercept": number;
                "divideInteger-cpu-arguments-model-arguments-intercept": number;
                "divideInteger-memory-arguments-intercept": number;
                "cekForceCost-exBudgetMemory": number;
                "blake2b-cpu-arguments-intercept": number;
                "remainderInteger-cpu-arguments-constant": number;
                "tailList-cpu-arguments": number;
                "encodeUtf8-cpu-arguments-intercept": number;
                "equalsString-cpu-arguments-slope": number;
                "lessThanByteString-memory-arguments": number;
                "multiplyInteger-cpu-arguments-slope": number;
                "appendByteString-cpu-arguments-intercept": number;
                "lessThanEqualsByteString-cpu-arguments-slope": number;
                "modInteger-memory-arguments-slope": number;
                "addInteger-cpu-arguments-slope": number;
                "equalsData-cpu-arguments-slope": number;
                "decodeUtf8-memory-arguments-intercept": number;
                "chooseList-cpu-arguments": number;
                "constrData-cpu-arguments": number;
                "equalsByteString-memory-arguments": number;
                "cekApplyCost-exBudgetCPU": number;
                "quotientInteger-memory-arguments-slope": number;
                "verifySignature-cpu-arguments-intercept": number;
                "unMapData-memory-arguments": number;
                "mkCons-memory-arguments": number;
                "sliceByteString-memory-arguments-slope": number;
                "sha3_256-memory-arguments": number;
                "ifThenElse-memory-arguments": number;
                "mkNilPairData-memory-arguments": number;
                "equalsByteString-cpu-arguments-slope": number;
                "appendString-cpu-arguments-intercept": number;
                "quotientInteger-cpu-arguments-model-arguments-slope": number;
                "cekApplyCost-exBudgetMemory": number;
                "equalsString-memory-arguments": number;
                "multiplyInteger-memory-arguments-slope": number;
                "cekBuiltinCost-exBudgetMemory": number;
                "remainderInteger-memory-arguments-intercept": number;
                "sha2_256-cpu-arguments-intercept": number;
                "remainderInteger-cpu-arguments-model-arguments-intercept": number;
                "lessThanEqualsByteString-memory-arguments": number;
                "tailList-memory-arguments": number;
                "mkNilData-cpu-arguments": number;
                "chooseData-cpu-arguments": number;
                "unBData-memory-arguments": number;
                "blake2b-memory-arguments": number;
                "iData-memory-arguments": number;
                "nullList-memory-arguments": number;
                "cekDelayCost-exBudgetCPU": number;
                "subtractInteger-memory-arguments-intercept": number;
                "lessThanByteString-cpu-arguments-intercept": number;
                "consByteString-cpu-arguments-slope": number;
                "appendByteString-memory-arguments-slope": number;
                "trace-memory-arguments": number;
                "divideInteger-cpu-arguments-constant": number;
                "cekConstCost-exBudgetCPU": number;
                "encodeUtf8-memory-arguments-slope": number;
                "quotientInteger-cpu-arguments-model-arguments-intercept": number;
                "mapData-memory-arguments": number;
                "appendString-cpu-arguments-slope": number;
                "modInteger-cpu-arguments-constant": number;
                "verifySignature-cpu-arguments-slope": number;
                "unConstrData-memory-arguments": number;
                "quotientInteger-memory-arguments-intercept": number;
                "equalsByteString-cpu-arguments-constant": number;
                "sliceByteString-memory-arguments-intercept": number;
                "mkPairData-memory-arguments": number;
                "equalsByteString-cpu-arguments-intercept": number;
                "appendString-memory-arguments-slope": number;
                "lessThanInteger-cpu-arguments-slope": number;
                "modInteger-cpu-arguments-model-arguments-intercept": number;
                "modInteger-memory-arguments-minimum": number;
                "sha3_256-cpu-arguments-intercept": number;
                "verifySignature-memory-arguments": number;
                "cekLamCost-exBudgetMemory": number;
                "sliceByteString-cpu-arguments-intercept": number;
            };
        }
    }
    namespace latestParams {
        const collateralPercentage_1: number;
        export { collateralPercentage_1 as collateralPercentage };
        export namespace costModels_1 {
            const PlutusScriptV1: {
                "addInteger-cpu-arguments-intercept": number;
                "addInteger-cpu-arguments-slope": number;
                "addInteger-memory-arguments-intercept": number;
                "addInteger-memory-arguments-slope": number;
                "appendByteString-cpu-arguments-intercept": number;
                "appendByteString-cpu-arguments-slope": number;
                "appendByteString-memory-arguments-intercept": number;
                "appendByteString-memory-arguments-slope": number;
                "appendString-cpu-arguments-intercept": number;
                "appendString-cpu-arguments-slope": number;
                "appendString-memory-arguments-intercept": number;
                "appendString-memory-arguments-slope": number;
                "bData-cpu-arguments": number;
                "bData-memory-arguments": number;
                "blake2b_256-cpu-arguments-intercept": number;
                "blake2b_256-cpu-arguments-slope": number;
                "blake2b_256-memory-arguments": number;
                "cekApplyCost-exBudgetCPU": number;
                "cekApplyCost-exBudgetMemory": number;
                "cekBuiltinCost-exBudgetCPU": number;
                "cekBuiltinCost-exBudgetMemory": number;
                "cekConstCost-exBudgetCPU": number;
                "cekConstCost-exBudgetMemory": number;
                "cekDelayCost-exBudgetCPU": number;
                "cekDelayCost-exBudgetMemory": number;
                "cekForceCost-exBudgetCPU": number;
                "cekForceCost-exBudgetMemory": number;
                "cekLamCost-exBudgetCPU": number;
                "cekLamCost-exBudgetMemory": number;
                "cekStartupCost-exBudgetCPU": number;
                "cekStartupCost-exBudgetMemory": number;
                "cekVarCost-exBudgetCPU": number;
                "cekVarCost-exBudgetMemory": number;
                "chooseData-cpu-arguments": number;
                "chooseData-memory-arguments": number;
                "chooseList-cpu-arguments": number;
                "chooseList-memory-arguments": number;
                "chooseUnit-cpu-arguments": number;
                "chooseUnit-memory-arguments": number;
                "consByteString-cpu-arguments-intercept": number;
                "consByteString-cpu-arguments-slope": number;
                "consByteString-memory-arguments-intercept": number;
                "consByteString-memory-arguments-slope": number;
                "constrData-cpu-arguments": number;
                "constrData-memory-arguments": number;
                "decodeUtf8-cpu-arguments-intercept": number;
                "decodeUtf8-cpu-arguments-slope": number;
                "decodeUtf8-memory-arguments-intercept": number;
                "decodeUtf8-memory-arguments-slope": number;
                "divideInteger-cpu-arguments-constant": number;
                "divideInteger-cpu-arguments-model-arguments-intercept": number;
                "divideInteger-cpu-arguments-model-arguments-slope": number;
                "divideInteger-memory-arguments-intercept": number;
                "divideInteger-memory-arguments-minimum": number;
                "divideInteger-memory-arguments-slope": number;
                "encodeUtf8-cpu-arguments-intercept": number;
                "encodeUtf8-cpu-arguments-slope": number;
                "encodeUtf8-memory-arguments-intercept": number;
                "encodeUtf8-memory-arguments-slope": number;
                "equalsByteString-cpu-arguments-constant": number;
                "equalsByteString-cpu-arguments-intercept": number;
                "equalsByteString-cpu-arguments-slope": number;
                "equalsByteString-memory-arguments": number;
                "equalsData-cpu-arguments-intercept": number;
                "equalsData-cpu-arguments-slope": number;
                "equalsData-memory-arguments": number;
                "equalsInteger-cpu-arguments-intercept": number;
                "equalsInteger-cpu-arguments-slope": number;
                "equalsInteger-memory-arguments": number;
                "equalsString-cpu-arguments-constant": number;
                "equalsString-cpu-arguments-intercept": number;
                "equalsString-cpu-arguments-slope": number;
                "equalsString-memory-arguments": number;
                "fstPair-cpu-arguments": number;
                "fstPair-memory-arguments": number;
                "headList-cpu-arguments": number;
                "headList-memory-arguments": number;
                "iData-cpu-arguments": number;
                "iData-memory-arguments": number;
                "ifThenElse-cpu-arguments": number;
                "ifThenElse-memory-arguments": number;
                "indexByteString-cpu-arguments": number;
                "indexByteString-memory-arguments": number;
                "lengthOfByteString-cpu-arguments": number;
                "lengthOfByteString-memory-arguments": number;
                "lessThanByteString-cpu-arguments-intercept": number;
                "lessThanByteString-cpu-arguments-slope": number;
                "lessThanByteString-memory-arguments": number;
                "lessThanEqualsByteString-cpu-arguments-intercept": number;
                "lessThanEqualsByteString-cpu-arguments-slope": number;
                "lessThanEqualsByteString-memory-arguments": number;
                "lessThanEqualsInteger-cpu-arguments-intercept": number;
                "lessThanEqualsInteger-cpu-arguments-slope": number;
                "lessThanEqualsInteger-memory-arguments": number;
                "lessThanInteger-cpu-arguments-intercept": number;
                "lessThanInteger-cpu-arguments-slope": number;
                "lessThanInteger-memory-arguments": number;
                "listData-cpu-arguments": number;
                "listData-memory-arguments": number;
                "mapData-cpu-arguments": number;
                "mapData-memory-arguments": number;
                "mkCons-cpu-arguments": number;
                "mkCons-memory-arguments": number;
                "mkNilData-cpu-arguments": number;
                "mkNilData-memory-arguments": number;
                "mkNilPairData-cpu-arguments": number;
                "mkNilPairData-memory-arguments": number;
                "mkPairData-cpu-arguments": number;
                "mkPairData-memory-arguments": number;
                "modInteger-cpu-arguments-constant": number;
                "modInteger-cpu-arguments-model-arguments-intercept": number;
                "modInteger-cpu-arguments-model-arguments-slope": number;
                "modInteger-memory-arguments-intercept": number;
                "modInteger-memory-arguments-minimum": number;
                "modInteger-memory-arguments-slope": number;
                "multiplyInteger-cpu-arguments-intercept": number;
                "multiplyInteger-cpu-arguments-slope": number;
                "multiplyInteger-memory-arguments-intercept": number;
                "multiplyInteger-memory-arguments-slope": number;
                "nullList-cpu-arguments": number;
                "nullList-memory-arguments": number;
                "quotientInteger-cpu-arguments-constant": number;
                "quotientInteger-cpu-arguments-model-arguments-intercept": number;
                "quotientInteger-cpu-arguments-model-arguments-slope": number;
                "quotientInteger-memory-arguments-intercept": number;
                "quotientInteger-memory-arguments-minimum": number;
                "quotientInteger-memory-arguments-slope": number;
                "remainderInteger-cpu-arguments-constant": number;
                "remainderInteger-cpu-arguments-model-arguments-intercept": number;
                "remainderInteger-cpu-arguments-model-arguments-slope": number;
                "remainderInteger-memory-arguments-intercept": number;
                "remainderInteger-memory-arguments-minimum": number;
                "remainderInteger-memory-arguments-slope": number;
                "sha2_256-cpu-arguments-intercept": number;
                "sha2_256-cpu-arguments-slope": number;
                "sha2_256-memory-arguments": number;
                "sha3_256-cpu-arguments-intercept": number;
                "sha3_256-cpu-arguments-slope": number;
                "sha3_256-memory-arguments": number;
                "sliceByteString-cpu-arguments-intercept": number;
                "sliceByteString-cpu-arguments-slope": number;
                "sliceByteString-memory-arguments-intercept": number;
                "sliceByteString-memory-arguments-slope": number;
                "sndPair-cpu-arguments": number;
                "sndPair-memory-arguments": number;
                "subtractInteger-cpu-arguments-intercept": number;
                "subtractInteger-cpu-arguments-slope": number;
                "subtractInteger-memory-arguments-intercept": number;
                "subtractInteger-memory-arguments-slope": number;
                "tailList-cpu-arguments": number;
                "tailList-memory-arguments": number;
                "trace-cpu-arguments": number;
                "trace-memory-arguments": number;
                "unBData-cpu-arguments": number;
                "unBData-memory-arguments": number;
                "unConstrData-cpu-arguments": number;
                "unConstrData-memory-arguments": number;
                "unIData-cpu-arguments": number;
                "unIData-memory-arguments": number;
                "unListData-cpu-arguments": number;
                "unListData-memory-arguments": number;
                "unMapData-cpu-arguments": number;
                "unMapData-memory-arguments": number;
                "verifyEd25519Signature-cpu-arguments-intercept": number;
                "verifyEd25519Signature-cpu-arguments-slope": number;
                "verifyEd25519Signature-memory-arguments": number;
            };
            const PlutusScriptV2: {
                "addInteger-cpu-arguments-intercept": number;
                "addInteger-cpu-arguments-slope": number;
                "addInteger-memory-arguments-intercept": number;
                "addInteger-memory-arguments-slope": number;
                "appendByteString-cpu-arguments-intercept": number;
                "appendByteString-cpu-arguments-slope": number;
                "appendByteString-memory-arguments-intercept": number;
                "appendByteString-memory-arguments-slope": number;
                "appendString-cpu-arguments-intercept": number;
                "appendString-cpu-arguments-slope": number;
                "appendString-memory-arguments-intercept": number;
                "appendString-memory-arguments-slope": number;
                "bData-cpu-arguments": number;
                "bData-memory-arguments": number;
                "blake2b_256-cpu-arguments-intercept": number;
                "blake2b_256-cpu-arguments-slope": number;
                "blake2b_256-memory-arguments": number;
                "cekApplyCost-exBudgetCPU": number;
                "cekApplyCost-exBudgetMemory": number;
                "cekBuiltinCost-exBudgetCPU": number;
                "cekBuiltinCost-exBudgetMemory": number;
                "cekConstCost-exBudgetCPU": number;
                "cekConstCost-exBudgetMemory": number;
                "cekDelayCost-exBudgetCPU": number;
                "cekDelayCost-exBudgetMemory": number;
                "cekForceCost-exBudgetCPU": number;
                "cekForceCost-exBudgetMemory": number;
                "cekLamCost-exBudgetCPU": number;
                "cekLamCost-exBudgetMemory": number;
                "cekStartupCost-exBudgetCPU": number;
                "cekStartupCost-exBudgetMemory": number;
                "cekVarCost-exBudgetCPU": number;
                "cekVarCost-exBudgetMemory": number;
                "chooseData-cpu-arguments": number;
                "chooseData-memory-arguments": number;
                "chooseList-cpu-arguments": number;
                "chooseList-memory-arguments": number;
                "chooseUnit-cpu-arguments": number;
                "chooseUnit-memory-arguments": number;
                "consByteString-cpu-arguments-intercept": number;
                "consByteString-cpu-arguments-slope": number;
                "consByteString-memory-arguments-intercept": number;
                "consByteString-memory-arguments-slope": number;
                "constrData-cpu-arguments": number;
                "constrData-memory-arguments": number;
                "decodeUtf8-cpu-arguments-intercept": number;
                "decodeUtf8-cpu-arguments-slope": number;
                "decodeUtf8-memory-arguments-intercept": number;
                "decodeUtf8-memory-arguments-slope": number;
                "divideInteger-cpu-arguments-constant": number;
                "divideInteger-cpu-arguments-model-arguments-intercept": number;
                "divideInteger-cpu-arguments-model-arguments-slope": number;
                "divideInteger-memory-arguments-intercept": number;
                "divideInteger-memory-arguments-minimum": number;
                "divideInteger-memory-arguments-slope": number;
                "encodeUtf8-cpu-arguments-intercept": number;
                "encodeUtf8-cpu-arguments-slope": number;
                "encodeUtf8-memory-arguments-intercept": number;
                "encodeUtf8-memory-arguments-slope": number;
                "equalsByteString-cpu-arguments-constant": number;
                "equalsByteString-cpu-arguments-intercept": number;
                "equalsByteString-cpu-arguments-slope": number;
                "equalsByteString-memory-arguments": number;
                "equalsData-cpu-arguments-intercept": number;
                "equalsData-cpu-arguments-slope": number;
                "equalsData-memory-arguments": number;
                "equalsInteger-cpu-arguments-intercept": number;
                "equalsInteger-cpu-arguments-slope": number;
                "equalsInteger-memory-arguments": number;
                "equalsString-cpu-arguments-constant": number;
                "equalsString-cpu-arguments-intercept": number;
                "equalsString-cpu-arguments-slope": number;
                "equalsString-memory-arguments": number;
                "fstPair-cpu-arguments": number;
                "fstPair-memory-arguments": number;
                "headList-cpu-arguments": number;
                "headList-memory-arguments": number;
                "iData-cpu-arguments": number;
                "iData-memory-arguments": number;
                "ifThenElse-cpu-arguments": number;
                "ifThenElse-memory-arguments": number;
                "indexByteString-cpu-arguments": number;
                "indexByteString-memory-arguments": number;
                "lengthOfByteString-cpu-arguments": number;
                "lengthOfByteString-memory-arguments": number;
                "lessThanByteString-cpu-arguments-intercept": number;
                "lessThanByteString-cpu-arguments-slope": number;
                "lessThanByteString-memory-arguments": number;
                "lessThanEqualsByteString-cpu-arguments-intercept": number;
                "lessThanEqualsByteString-cpu-arguments-slope": number;
                "lessThanEqualsByteString-memory-arguments": number;
                "lessThanEqualsInteger-cpu-arguments-intercept": number;
                "lessThanEqualsInteger-cpu-arguments-slope": number;
                "lessThanEqualsInteger-memory-arguments": number;
                "lessThanInteger-cpu-arguments-intercept": number;
                "lessThanInteger-cpu-arguments-slope": number;
                "lessThanInteger-memory-arguments": number;
                "listData-cpu-arguments": number;
                "listData-memory-arguments": number;
                "mapData-cpu-arguments": number;
                "mapData-memory-arguments": number;
                "mkCons-cpu-arguments": number;
                "mkCons-memory-arguments": number;
                "mkNilData-cpu-arguments": number;
                "mkNilData-memory-arguments": number;
                "mkNilPairData-cpu-arguments": number;
                "mkNilPairData-memory-arguments": number;
                "mkPairData-cpu-arguments": number;
                "mkPairData-memory-arguments": number;
                "modInteger-cpu-arguments-constant": number;
                "modInteger-cpu-arguments-model-arguments-intercept": number;
                "modInteger-cpu-arguments-model-arguments-slope": number;
                "modInteger-memory-arguments-intercept": number;
                "modInteger-memory-arguments-minimum": number;
                "modInteger-memory-arguments-slope": number;
                "multiplyInteger-cpu-arguments-intercept": number;
                "multiplyInteger-cpu-arguments-slope": number;
                "multiplyInteger-memory-arguments-intercept": number;
                "multiplyInteger-memory-arguments-slope": number;
                "nullList-cpu-arguments": number;
                "nullList-memory-arguments": number;
                "quotientInteger-cpu-arguments-constant": number;
                "quotientInteger-cpu-arguments-model-arguments-intercept": number;
                "quotientInteger-cpu-arguments-model-arguments-slope": number;
                "quotientInteger-memory-arguments-intercept": number;
                "quotientInteger-memory-arguments-minimum": number;
                "quotientInteger-memory-arguments-slope": number;
                "remainderInteger-cpu-arguments-constant": number;
                "remainderInteger-cpu-arguments-model-arguments-intercept": number;
                "remainderInteger-cpu-arguments-model-arguments-slope": number;
                "remainderInteger-memory-arguments-intercept": number;
                "remainderInteger-memory-arguments-minimum": number;
                "remainderInteger-memory-arguments-slope": number;
                "serialiseData-cpu-arguments-intercept": number;
                "serialiseData-cpu-arguments-slope": number;
                "serialiseData-memory-arguments-intercept": number;
                "serialiseData-memory-arguments-slope": number;
                "sha2_256-cpu-arguments-intercept": number;
                "sha2_256-cpu-arguments-slope": number;
                "sha2_256-memory-arguments": number;
                "sha3_256-cpu-arguments-intercept": number;
                "sha3_256-cpu-arguments-slope": number;
                "sha3_256-memory-arguments": number;
                "sliceByteString-cpu-arguments-intercept": number;
                "sliceByteString-cpu-arguments-slope": number;
                "sliceByteString-memory-arguments-intercept": number;
                "sliceByteString-memory-arguments-slope": number;
                "sndPair-cpu-arguments": number;
                "sndPair-memory-arguments": number;
                "subtractInteger-cpu-arguments-intercept": number;
                "subtractInteger-cpu-arguments-slope": number;
                "subtractInteger-memory-arguments-intercept": number;
                "subtractInteger-memory-arguments-slope": number;
                "tailList-cpu-arguments": number;
                "tailList-memory-arguments": number;
                "trace-cpu-arguments": number;
                "trace-memory-arguments": number;
                "unBData-cpu-arguments": number;
                "unBData-memory-arguments": number;
                "unConstrData-cpu-arguments": number;
                "unConstrData-memory-arguments": number;
                "unIData-cpu-arguments": number;
                "unIData-memory-arguments": number;
                "unListData-cpu-arguments": number;
                "unListData-memory-arguments": number;
                "unMapData-cpu-arguments": number;
                "unMapData-memory-arguments": number;
                "verifyEcdsaSecp256k1Signature-cpu-arguments": number;
                "verifyEcdsaSecp256k1Signature-memory-arguments": number;
                "verifyEd25519Signature-cpu-arguments-intercept": number;
                "verifyEd25519Signature-cpu-arguments-slope": number;
                "verifyEd25519Signature-memory-arguments": number;
                "verifySchnorrSecp256k1Signature-cpu-arguments-intercept": number;
                "verifySchnorrSecp256k1Signature-cpu-arguments-slope": number;
                "verifySchnorrSecp256k1Signature-memory-arguments": number;
            };
        }
        export { costModels_1 as costModels };
        export namespace executionUnitPrices {
            const priceMemory: number;
            const priceSteps: number;
        }
        const maxBlockBodySize_1: number;
        export { maxBlockBodySize_1 as maxBlockBodySize };
        export namespace maxBlockExecutionUnits {
            const memory: number;
            const steps: number;
        }
        const maxBlockHeaderSize_1: number;
        export { maxBlockHeaderSize_1 as maxBlockHeaderSize };
        const maxCollateralInputs_1: number;
        export { maxCollateralInputs_1 as maxCollateralInputs };
        export namespace maxTxExecutionUnits {
            const memory_1: number;
            export { memory_1 as memory };
            const steps_1: number;
            export { steps_1 as steps };
        }
        const maxTxSize_1: number;
        export { maxTxSize_1 as maxTxSize };
        const maxValueSize_1: number;
        export { maxValueSize_1 as maxValueSize };
        const minPoolCost_1: number;
        export { minPoolCost_1 as minPoolCost };
        export const monetaryExpansion: number;
        export const poolPledgeInfluence: number;
        export const poolRetireMaxEpoch: number;
        export namespace protocolVersion_1 {
            const major_1: number;
            export { major_1 as major };
            const minor_1: number;
            export { minor_1 as minor };
        }
        export { protocolVersion_1 as protocolVersion };
        export const stakeAddressDeposit: number;
        export const stakePoolDeposit: number;
        export const stakePoolTargetNum: number;
        export const treasuryCut: number;
        export const txFeeFixed: number;
        export const txFeePerByte: number;
        export const utxoCostPerByte: number;
    }
    namespace latestTip {
        const epoch: number;
        const hash: string;
        const slot: number;
        const time: number;
    }
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
     * @type {PrivateKey}
     */
    get privateKey(): PrivateKey;
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
     * @type {Promise<UTxO[]>}
     */
    get utxos(): Promise<UTxO[]>;
    /**
     * @type {Promise<UTxO[]>}
     */
    get collateral(): Promise<UTxO[]>;
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
     * @returns {Promise<UTxO>}
     */
    getUtxo(id: TxOutputId): Promise<UTxO>;
    /**
     * @param {Address} address
     * @returns {Promise<UTxO[]>}
     */
    getUtxos(address: Address): Promise<UTxO[]>;
    dump(): void;
    /**
     * @param {UTxO | TxInput} utxo
     * @returns {boolean}
     */
    isConsumed(utxo: UTxO | TxInput): boolean;
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
export namespace exportedForBundling {
    export { AddressType };
    export { AllType };
    export { ArgType };
    export { ByteArrayType };
    export { FuncType };
    export { IntType };
    export { IR };
    export { IRProgram };
    export { IRParametricProgram };
    export { MintingPolicyHashType };
    export { RealType };
    export { Site };
    export { StringType };
    export { TxType };
    export { ValidatorHashType };
    export { Word };
}
export namespace exportedForTesting {
    export { assert };
    export { assertClass };
    export { assertDefined };
    export { bigIntToBytes };
    export { bytesToBigInt };
    export { setRawUsageNotifier };
    export { setBlake2bDigestSize };
    export { dumpCostModels };
    export { Site };
    export { Source };
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
    export { TxInput };
    export { TxBody };
    export { REAL_PRECISION };
}
/**
 * <T>
 */
export type WrapAlias<T> = T extends any ? {
    key: T;
} : never;
/**
 * <T>
 */
export type UnwrapAlias<T> = T extends {
    key: any;
} ? T["key"] : never;
/**
 * <T>
 */
export type ExpandAlias<T> = UnwrapAlias<WrapAlias<T>>;
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
    transferSource: (raw: string, fileIndex: null | number) => any;
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
export type TypeSchema = {
    type: string;
} | {
    type: "List";
    itemType: TypeSchema;
} | {
    type: "Map";
    keyType: TypeSchema;
    valueType: TypeSchema;
} | {
    type: "Option";
    someType: TypeSchema;
} | {
    type: "Struct";
    fieldTypes: NamedTypeSchema[];
} | {
    type: "Enum";
    variantTypes: {
        name: string;
        fieldTypes: NamedTypeSchema[];
    }[];
};
export type NamedTypeSchema = {
    name: string;
} & TypeSchema;
export type ParameterI = {
    name: string;
    typeClass: TypeClass;
};
export type InferenceMap = Map<ParameterI, Type>;
/**
 * Used by the bundle cli command to generate a typescript annotations and (de)serialization code
 * inputTypes form a type union
 */
export type TypeDetails = {
    inputType: string;
    outputType: string;
    internalType: TypeSchema;
};
export type DataType = EvalEntity & {
    asNamed: Named;
    name: string;
    path: string;
} & {
    asType: Type;
    instanceMembers: InstanceMembers;
    typeMembers: TypeMembers;
    isBaseOf(type: Type): boolean;
    infer(site: Site, map: InferenceMap, type: Type): Type;
    toTyped(): Typed;
} & {
    asDataType: DataType;
    fieldNames: string[];
    offChainType: (null | HeliosDataClass<HeliosData>);
    typeDetails?: TypeDetails;
    jsToUplc: (obj: any) => UplcData;
    uplcToJs: (data: UplcData) => any;
    ready: boolean;
};
export type EnumMemberType = DataType & {
    asEnumMemberType: EnumMemberType;
    constrIndex: number;
    parentType: DataType;
};
/**
 * EvalEntities assert themselves
 */
export type EvalEntity = {
    asDataType: (null | DataType);
    asEnumMemberType: (null | EnumMemberType);
    asFunc: (null | Func);
    asInstance: (null | Instance);
    asMulti: (null | Multi);
    asNamed: (null | Named);
    asNamespace: (null | Namespace);
    asParametric: (null | Parametric);
    asType: (null | Type);
    asTyped: (null | Typed);
    asTypeClass: (null | TypeClass);
    toString(): string;
};
export type Func = EvalEntity & {
    asTyped: Typed;
    type: Type;
} & {
    asFunc: Func;
    call(site: Site, args: Typed[], namedArgs?: {
        [name: string]: Typed;
    }): (Typed | Multi);
};
export type Instance = Typed & {
    asInstance: Instance;
    fieldNames: string[];
    instanceMembers: InstanceMembers;
};
export type Multi = EvalEntity & {
    asMulti: Multi;
    values: Typed[];
};
export type Named = EvalEntity & {
    asNamed: Named;
    name: string;
    path: string;
};
export type Namespace = EvalEntity & {
    asNamespace: Namespace;
    namespaceMembers: NamespaceMembers;
};
export type Parametric = EvalEntity & {
    asParametric: Parametric;
    offChainType: (...any: any[]) => HeliosDataClass<HeliosData>;
    typeClasses: TypeClass[];
    apply(types: Type[], site?: Site): EvalEntity;
    inferCall(site: Site, args: Typed[], namedArgs?: {
        [name: string]: Typed;
    }, paramTypes?: Type[]): Func;
    infer(site: Site, map: InferenceMap): Parametric;
};
export type Type = EvalEntity & {
    asType: Type;
    instanceMembers: InstanceMembers;
    typeMembers: TypeMembers;
    isBaseOf(type: Type): boolean;
    infer(site: Site, map: InferenceMap, type: null | Type): Type;
    toTyped(): Typed;
};
export type Typed = EvalEntity & {
    asTyped: Typed;
    type: Type;
};
export type TypeClass = EvalEntity & {
    asTypeClass: TypeClass;
    genInstanceMembers(impl: Type): TypeClassMembers;
    genTypeMembers(impl: Type): TypeClassMembers;
    isImplementedBy(type: Type): boolean;
    toType(name: string, path: string, parameter?: null | ParameterI): Type;
};
export type InstanceMembers = {
    [name: string]: Type | Parametric;
};
export type NamespaceMembers = {
    [name: string]: EvalEntity;
};
export type TypeMembers = {
    [name: string]: Type | Typed | Parametric;
};
export type TypeClassMembers = {
    [name: string]: Type;
};
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
export type Throw = (error: UserError) => void;
export type CodeMap = [number, Site][];
export type IRDefinitions = Map<string, IR>;
export type Decoder = (i: number, bytes: number[]) => void;
export type HeliosDataClass<T extends HeliosData> = {
    new (...args: any[]): T;
    fromUplcCbor: (bytes: (string | number[])) => T;
    fromUplcData: (data: UplcData) => T;
    isBuiltin(): boolean;
};
export type HIntProps = number | bigint;
export type TimeProps = number | bigint | string | Date;
export type DurationProps = HIntProps;
export type BoolProps = boolean | string;
export type HStringProps = string;
export type ByteArrayProps = hexstring | number[];
export type HashProps = hexstring | number[];
export type DatumHashProps = HashProps;
export type PubKeyProps = hexstring | number[];
export type PubKeyHashProps = HashProps;
export type ScriptHashProps = HashProps;
export type MintingPolicyHashProps = HashProps;
export type StakeKeyHashProps = HashProps;
export type StakingValidatorHashProps = HashProps;
export type ValidatorHashProps = HashProps;
export type TxIdProps = HashProps;
export type TxOutputIdProps = string | [
    TxId | ExpandAlias<TxIdProps>,
    HInt | ExpandAlias<HIntProps>
] | {
    txId: TxId | ExpandAlias<TxIdProps>;
    utxoId: HInt | ExpandAlias<HIntProps>;
};
/**
 * A valid bech32 string
 */
export type bech32string = string & {};
export type AddressProps = bech32string | hexstring | number[];
export type AssetClassProps = string | [
    MintingPolicyHash | ExpandAlias<MintingPolicyHashProps>,
    ByteArray | ExpandAlias<ByteArrayProps>
] | {
    mph: MintingPolicyHash | ExpandAlias<MintingPolicyHashProps>;
    tokenName: ByteArray | ExpandAlias<ByteArrayProps>;
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
export type CostModelClass = {
    fromParams: (params: NetworkParams, baseName: string) => CostModel;
};
/**
 * A Helios/Uplc Program can have different purposes
 */
export type ScriptPurpose = "testing" | "minting" | "spending" | "staking" | "linking" | "module" | "unknown";
export type UplcRawStack = [string | null, UplcValue][];
export type UplcRTECallbacks = {
    onPrint: (msg: string) => Promise<void>;
    onStartCall: (site: Site, rawStack: import("./helios").UplcRawStack) => Promise<boolean>;
    onEndCall: (site: Site, rawStack: import("./helios").UplcRawStack) => Promise<void>;
    onIncrCost: (name: string, isTerm: boolean, cost: Cost) => void;
    macros?: {
        [name: string]: (args: UplcValue[]) => UplcValue;
    };
};
/**
 * TODO: purpose as enum type
 */
export type ProgramProperties = {
    purpose: null | ScriptPurpose;
    callsTxTimeRange: boolean;
};
/**
 * The constructor returns 'any' because it is an instance of TransferableUplcProgram, and the instance methods don't need to be defined here
 */
export type TransferableUplcProgram<TInstance> = {
    transferUplcProgram: (expr: any, properties: ProgramProperties, version: any[]) => TInstance;
    transferUplcAst: TransferUplcAst;
};
export type IRLiteralRegistry = Map<IRVariable, IRLiteralExpr>;
export type UserTypes = {
    [name: string]: any;
};
export type CoinSelectionAlgorithm = (utxos: UTxO[], amount: Value) => [UTxO[], UTxO[]];
export type Wallet = {
    isMainnet(): Promise<boolean>;
    usedAddresses: Promise<Address[]>;
    unusedAddresses: Promise<Address[]>;
    utxos: Promise<UTxO[]>;
    collateral: Promise<UTxO[]>;
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
    getUtxos(address: Address): Promise<UTxO[]>;
    getUtxo(id: TxOutputId): Promise<UTxO>;
    getParameters(): Promise<NetworkParams>;
    submitTx(tx: Tx): Promise<TxId>;
};
/**
 * collectUtxos removes tx inputs from the list, and appends txoutputs sent to the address to the end.
 */
export type EmulatorTx = {
    id(): TxId;
    consumes(utxo: UTxO | TxInput): boolean;
    collectUtxos(address: Address, utxos: UTxO[]): UTxO[];
    getUtxo(id: TxOutputId): (null | UTxO);
    dump(): void;
};
export type ValueGenerator = () => UplcData;
export type PropertyTest = (args: UplcValue[], res: (UplcValue | UserError)) => (boolean | {
    [x: string]: boolean;
});
/**
 * String literal token (utf8)
 * @package
 */
declare class StringLiteral extends PrimitiveLiteral {
    /**
     * @param {Site} site
     * @param {string} value
     */
    constructor(site: Site, value: string);
    get value(): string;
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
     * @returns {Word | null}
     */
    assertNotKeyword(): Word | null;
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
     * @type {Word}
     */
    get name(): Word;
    /**
     * @type {string}
     */
    get path(): string;
    /**
     * @param {ModuleScope} scope
     */
    eval(scope: ModuleScope): void;
    /**
     * @param {string} namespace
     * @param {(name: string, cs: ConstStatement) => void} callback
     */
    loopConstStatements(namespace: string, callback: (name: string, cs: ConstStatement) => void): void;
    /**
     * @param {string} basePath
     */
    setBasePath(basePath: string): void;
    /**
     * Returns IR of statement.
     * No need to specify indent here, because all statements are top-level
     * @param {IRDefinitions} map
     */
    toIR(map: IRDefinitions): void;
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
     * @param {number} startPos
     * @param {number} endPos
     */
    constructor(src: Source, startPos: number, endPos?: number, codeMapSite?: any);
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
     * Returns a RuntimeError
     * @param {string} info
     * @returns {UserError}
     */
    runtimeError(info?: string): UserError;
    /**
     * Calculates the column,line position in 'this.#src'
     * @returns {[number, number, number, number]} - [startLine, startCol, endLine, endCol]
     */
    getFilePos(): [number, number, number, number];
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
     * @param {number | null} nFields
     * @returns {boolean}
     */
    isGroup(type?: string | null, nFields?: number | null): boolean;
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
     * @param {null | Site} site
     */
    constructor(content: string | IR[], site?: null | Site);
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
     * @returns {any}
     */
    dump(): any;
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
     * @returns {string}
     */
    toString(): string;
    /**
     * @package
     * @returns {[string, CodeMap]}
     */
    generateSource(): [string, CodeMap];
    /**
     * @returns {string}
     */
    pretty(): string;
    /**
     * @param {string} str
     * @returns {boolean}
     */
    includes(str: string): boolean;
    /**
     * @param {RegExp} re
     * @param {string} newStr
     * @returns {IR}
     */
    replace(re: RegExp, newStr: string): IR;
    /**
     *
     * @param {RegExp} re
     * @param {(match: string) => void} callback
     */
    search(re: RegExp, callback: (match: string) => void): void;
    #private;
}
/**
 * @typedef {hexstring | number[]} HashProps
 */
/**
 * Base class of all hash-types
 * @package
 */
declare class Hash extends HeliosData {
    /**
     * @param {HashProps} props
     * @returns {number[]}
     */
    static cleanConstructorArg(props: HashProps): number[];
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
     * @param {ExpandAlias<HashProps>} props
     */
    constructor(props: ExpandAlias<HashProps>);
    /**
     * @returns {number[]}
     */
    get bytes(): number[];
    /**
     * @returns {hexstring}
     */
    get hex(): hexstring;
    /**
     * @returns {string}
     */
    dump(): string;
    /**
     * @param {Hash} other
     * @returns {boolean}
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
     * @param {null | NetworkParams} networkParams
     */
    constructor(callbacks?: UplcRTECallbacks, networkParams?: null | NetworkParams);
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
     * @param {string} name
     * @param {UplcValue[]} args
     * @returns {Promise<UplcValue>}
     */
    callMacro(name: string, args: UplcValue[]): Promise<UplcValue>;
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
     * @param {null | UplcStack | UplcRte} parent
     * @param {null | UplcValue} value
     * @param {null | string} valueName
     */
    constructor(parent: null | UplcStack | UplcRte, value?: null | UplcValue, valueName?: null | string);
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
     *
     * @param {string} name
     * @param {UplcValue[]} args
     * @returns {Promise<UplcValue>}
     */
    callMacro(name: string, args: UplcValue[]): Promise<UplcValue>;
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
     * @param {TransferUplcAst} other
     * @returns {any}
     */
    transfer(other: TransferUplcAst): any;
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
 * Created by statements
 * @package
 * @template {HeliosData} T
 * @implements {DataType}
 */
declare class GenericType<T extends HeliosData> extends Common implements DataType {
    /**
     * @param {({
     *   name: string,
     *   path?: string,
     *   offChainType?: HeliosDataClass<T> | null,
     *   genOffChainType?: (() => HeliosDataClass<T>) | null
     *   fieldNames?: string[],
     *   genInstanceMembers: (self: Type) => InstanceMembers,
     *   genTypeMembers: (self: Type) => TypeMembers
     *   genTypeDetails?: (self: Type) => TypeDetails,
     *   jsToUplc?: (obj: any) => UplcData
     *   uplcToJs?: (data: UplcData) => any
     * })} props
     */
    constructor({ name, path, offChainType, genOffChainType, fieldNames, genInstanceMembers, genTypeMembers, genTypeDetails, jsToUplc, uplcToJs }: {
        name: string;
        path?: string;
        offChainType?: HeliosDataClass<T> | null;
        genOffChainType?: (() => HeliosDataClass<T>) | null;
        fieldNames?: string[];
        genInstanceMembers: (self: Type) => InstanceMembers;
        genTypeMembers: (self: Type) => TypeMembers;
        genTypeDetails?: (self: Type) => TypeDetails;
        jsToUplc?: (obj: any) => UplcData;
        uplcToJs?: (data: UplcData) => any;
    });
    /**
     * @type {string[]}
     */
    get fieldNames(): string[];
    /**
     * @type {InstanceMembers}
     */
    get instanceMembers(): InstanceMembers;
    /**
     * @type {string}
     */
    get name(): string;
    /**
     * @type {null | HeliosDataClass<T>}
     */
    get offChainType(): HeliosDataClass<T>;
    /**
     * @type {TypeDetails}
     */
    get typeDetails(): TypeDetails;
    /**
     * @type {string}
     */
    get path(): string;
    /**
     * @type {TypeMembers}
     */
    get typeMembers(): TypeMembers;
    /**
     * @param {Site} site
     * @param {InferenceMap} map
     */
    inferInternal(site: Site, map: InferenceMap): {
        name: string;
        path: string;
        fieldNames: string[];
        genInstanceMembers: (self: any) => InstanceMembers;
        genTypeMembers: (self: any) => TypeMembers;
    };
    /**
     * @param {Site} site
     * @param {InferenceMap} map
     * @param {null | Type} type
     * @returns {Type}
     */
    infer(site: Site, map: InferenceMap, type: null | Type): Type;
    /**
     * @param {string} name
     * @param {string} path
     * @returns {GenericType}
     */
    changeNameAndPath(name: string, path: string): GenericType<any>;
    /**
     * @param {Type} other
     * @returns {boolean}
     */
    isBaseOf(other: Type): boolean;
    /**
     * @returns {Typed}
     */
    toTyped(): Typed;
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
     * @param {?IRValue} value
     */
    constructor(name: Word, variable?: IRVariable | null, value?: IRValue | null);
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
    /**
     * @param {IRVariable} fnVar
     * @param {number[]} remaining
     * @returns {IRExpr}
     */
    removeUnusedCallArgs(fnVar: IRVariable, remaining: number[]): IRExpr;
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
    /**
     * @param {Map<IRVariable, IRVariable>} newVars
     * @returns {IRVariable}
     */
    copy(newVars: Map<IRVariable, IRVariable>): IRVariable;
    /**
     * @returns {boolean}
     */
    isAlwaysInlineable(): boolean;
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
     * @param {Map<IRVariable, IRVariable>} newVars
     * @returns {IRExpr}
     */
    copy(newVars: Map<IRVariable, IRVariable>): IRExpr;
    /**
     * @param {IRExprRegistry} registry
     * @returns {IRExpr}
     */
    simplifyTopology(registry: IRExprRegistry): IRExpr;
    /**
     * @param {IRExprRegistry} registry
     * @returns {IRExpr}
     */
    simplifyUnused(registry: IRExprRegistry): IRExpr;
    /**
     * @param {IRVariable} fnVar
     * @param {number[]} remaining
     * @returns {IRExpr}
     */
    simplifyUnusedRecursionArgs(fnVar: IRVariable, remaining: number[]): IRExpr;
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
    /**
     * @param {IRLiteralRegistry} literals
     * @returns {(IRExpr[] | IRLiteralExpr)}
     */
    simplifyLiteralsInArgsAndTryEval(literals: IRLiteralRegistry): (IRExpr[] | IRLiteralExpr);
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
     * @returns {boolean}
     */
    hasOptArgs(): boolean;
    /**
     * @param {IRCallStack} stack
     */
    evalConstants(stack: IRCallStack): IRFuncExpr;
    /**
     * @param {IRExprRegistry} registry
     * @returns {IRFuncExpr}
     */
    simplifyUnused(registry: IRExprRegistry): IRFuncExpr;
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
    /**
     * @returns {string[]}
     */
    dump(): string[];
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
    /**
     * @param {IRVariable} fnVar
     * @param {number[]} remaining
     * @returns {IRExpr}
     */
    removeUnusedCallArgs(fnVar: IRVariable, remaining: number[]): IRExpr;
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
     * @param {null | ScriptPurpose} purpose
     * @param {boolean} simplify
     * @param {boolean} throwSimplifyRTErrors - if true -> throw RuntimErrors caught during evaluation steps
     * @param {IRScope} scope
     * @returns {IRProgram}
     */
    static new(ir: IR, purpose: null | ScriptPurpose, simplify?: boolean, throwSimplifyRTErrors?: boolean, scope?: IRScope): IRProgram;
    /**
     * @param {IRExpr} expr
     * @returns {IRExpr}
     */
    static simplify(expr: IRExpr): IRExpr;
    /**
     * @param {IRExpr} expr
     * @returns {IRExpr}
     */
    static simplifyLiterals(expr: IRExpr): IRExpr;
    /**
     * @param {IRExpr} expr
     * @returns {IRExpr}
     */
    static simplifyTopology(expr: IRExpr): IRExpr;
    /**
     * @param {IRExpr} expr
     * @returns {IRExpr}
     */
    static simplifyUnused(expr: IRExpr): IRExpr;
    /**
     * @param {IRFuncExpr | IRCallExpr | IRLiteralExpr} expr
     * @param {ProgramProperties} properties
     */
    constructor(expr: IRFuncExpr | IRCallExpr | IRLiteralExpr, properties: ProgramProperties);
    /**
     * @package
     * @type {IRFuncExpr | IRCallExpr | IRLiteralExpr}
     */
    get expr(): IRLiteralExpr | IRCallExpr | IRFuncExpr;
    /**
     * @package
     * @type {ProgramProperties}
     */
    get properties(): ProgramProperties;
    /**
     * @package
     * @type {Site}
     */
    get site(): Site;
    /**
     * @type {UplcData}
     */
    get data(): UplcData;
    /**
     * @returns {string}
     */
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
    /**
     * @param {string} namespace
     * @param {(name: string, cs: ConstStatement) => void} callback
     */
    loopConstStatements(namespace: string, callback: (name: string, cs: ConstStatement) => void): void;
    /**
     * @returns {string}
     */
    toString(): string;
    /**
     * @param {ModuleScope} scope
     */
    evalTypes(scope: ModuleScope): void;
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
     * @param {TypeParameters} parameters
     * @param {FuncLiteralExpr} funcExpr
     */
    constructor(site: Site, name: Word, parameters: TypeParameters, funcExpr: FuncLiteralExpr);
    /**
     * @type {number}
     */
    get nArgs(): number;
    /**
     * @type {string[]}
     */
    get argNames(): string[];
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
     * @returns {EvalEntity}
     */
    evalInternal(scope: Scope): EvalEntity;
    /**
     * Evaluates type of a funtion.
     * Separate from evalInternal so we can use this function recursively inside evalInternal
     * @param {Scope} scope
     * @returns {ParametricFunc | FuncType}
     */
    evalType(scope: Scope): ParametricFunc | FuncType;
    /**
     * Returns IR of function
     * @returns {IR}
     */
    toIRInternal(): IR;
    #private;
}
/**
 * GlobalScope sits above the top-level scope and contains references to all the builtin Values and Types
 * @package
 */
declare class GlobalScope {
    /**
     * Initialize the GlobalScope with all the builtins
     * @param {ScriptPurpose} purpose
     * @param {{[name: string]: Type}} validatorTypes
     * @returns {GlobalScope}
     */
    static new(purpose: ScriptPurpose, validatorTypes?: {
        [name: string]: Type;
    }): GlobalScope;
    /**
     * @param {{[name: string]: Type}} validatorTypes
     * @returns {GlobalScope}
     */
    static newLinking(validatorTypes: {
        [name: string]: Type;
    }): GlobalScope;
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
     * @returns {boolean}
     */
    isStrict(): boolean;
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
     * Prepends "__scope__" to name before actually setting scope
     * @param {Word} name
     * @param {Scope} value
     */
    setScope(name: Word, value: Scope): void;
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
 * Const value statement
 * @package
 */
declare class ConstStatement extends Statement {
    /**
     * @param {Site} site
     * @param {Word} name
     * @param {Expr} typeExpr - can be null in case of type inference
     * @param {null | Expr} valueExpr
     */
    constructor(site: Site, name: Word, typeExpr: Expr, valueExpr: null | Expr);
    /**
     * @type {DataType}
     */
    get type(): DataType;
    /**
     * @returns {boolean}
     */
    isSet(): boolean;
    /**
     * Use this to change a value of something that is already typechecked.
     * @param {UplcData} data
     */
    changeValueSafe(data: UplcData): void;
    /**
     * @param {Scope} scope
     * @returns {DataType}
     */
    evalType(scope: Scope): DataType;
    /**
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    evalInternal(scope: Scope): EvalEntity;
    /**
     * Evaluates rhs and adds to scope
     * @param {TopScope} scope
     */
    eval(scope: TopScope): void;
    /**
     * @returns {IR}
     */
    toIRInternal(): IR;
    #private;
}
declare class GenericProgram extends Program {
    /**
     * @package
     * @param {{[name: string]: Type}} validatorTypes
     * @returns {TopScope}
     */
    evalTypes(validatorTypes: {
        [name: string]: Type;
    }): TopScope;
}
/**
 * @package
 */
declare class NativeContext {
    /**
     *
     * @param {bigint | null} firstValidSlot
     * @param {bigint | null} lastValidSlot
     * @param {PubKeyHash[]} keys
     */
    constructor(firstValidSlot: bigint | null, lastValidSlot: bigint | null, keys: PubKeyHash[]);
    /**
     * Used by NativeAfter
     * @param {bigint} slot
     * @returns {boolean}
     */
    isAfter(slot: bigint): boolean;
    /**
     *
     * @param {bigint} slot
     * @returns {boolean}
     */
    isBefore(slot: bigint): boolean;
    /**
     *
     * @param {PubKeyHash} key
     * @returns {boolean}
     */
    isSignedBy(key: PubKeyHash): boolean;
    #private;
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
     */
    addRefInput(input: TxInput): void;
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
     */
    addSigner(hash: PubKeyHash): void;
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
 * @package
 */
declare class TxInput extends CborData {
    /**
     * @param {UplcData} data
     * @returns {TxInput}
     */
    static fromUplcData(data: UplcData): TxInput;
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
     * @param {number | bigint} utxoIdx
     * @param {null | TxOutput} origOutput - used during building, not part of serialization
     */
    constructor(txId: TxId, utxoIdx: number | bigint, origOutput?: null | TxOutput);
    /**
     * @type {TxId}
     */
    get txId(): TxId;
    /**
     * @type {number}
     */
    get utxoIdx(): number;
    /**
     *
     * @param {UTxO | TxInput} other
     * @returns {boolean}
     */
    eq(other: UTxO | TxInput): boolean;
    /**
     * @type {TxOutput}
     */
    get origOutput(): TxOutput;
    /**
     * @type {UTxO}
     */
    get utxo(): UTxO;
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
 * Buitin Address type
 * @package
 * @type {DataType}
 */
declare const AddressType: DataType;
/**
 * @package
 * @implements {DataType}
 */
declare class AllType extends Common implements DataType {
    /**
     * @type {HeliosDataClass<HeliosData> | null}
     */
    get offChainType(): HeliosDataClass<HeliosData>;
    /**
     * @type {string[]}
     */
    get fieldNames(): string[];
    /**
     * @type {InstanceMembers}
     */
    get instanceMembers(): InstanceMembers;
    /**
     * @type {string}
     */
    get name(): string;
    /**
     * @type {string}
     */
    get path(): string;
    /**
     * @type {TypeMembers}
     */
    get typeMembers(): TypeMembers;
    /**
     * @param {Site} site
     * @param {InferenceMap} map
     * @param {null | Type} type
     * @returns {Type}
     */
    infer(site: Site, map: InferenceMap, type: null | Type): Type;
    /**
     * @param {Type} other
     * @returns {boolean}
     */
    isBaseOf(other: Type): boolean;
    /**
     * @returns {Typed}
     */
    toTyped(): Typed;
}
/**
 * @package
 */
declare class ArgType {
    /**
     *
     * @param {null | Word} name
     * @param {Type} type
     * @param {boolean} optional
     */
    constructor(name: null | Word, type: Type, optional?: boolean);
    /**
     * @type {string}
     */
    get name(): string;
    /**
     * @type {Type}
     */
    get type(): Type;
    /**
     * @package
     * @param {Site} site
     * @param {InferenceMap} map
     * @param {null | Type} type
     * @returns {ArgType}
     */
    infer(site: Site, map: InferenceMap, type: null | Type): ArgType;
    /**
     * @param {ArgType} other
     * @returns {boolean}
     */
    isBaseOf(other: ArgType): boolean;
    /**
     * @returns {boolean}
     */
    isNamed(): boolean;
    /**
     * @returns {boolean}
     */
    isOptional(): boolean;
    /**
     * @returns {string}
     */
    toString(): string;
    #private;
}
/**
 * Builtin bytearray type
 * @package
 * @type {DataType}
 */
declare const ByteArrayType: DataType;
/**
 * Function type with arg types and a return type
 * @package
 * @implements {Type}
 */
declare class FuncType extends Common implements Type {
    /**
     * @param {Type[] | ArgType[]} argTypes
     * @param {Type | Type[]} retTypes
     */
    constructor(argTypes: Type[] | ArgType[], retTypes: Type | Type[]);
    /**
     * @type {Type[]}
     */
    get argTypes(): Type[];
    /**
     * @type {InstanceMembers}
     */
    get instanceMembers(): InstanceMembers;
    /**
     * @type {number}
     */
    get nArgs(): number;
    /**
     * @type {number}
     */
    get nNonOptArgs(): number;
    /**
     * @type {number}
     */
    get nOptArgs(): number;
    /**
     * @type {Type[]}
     */
    get retTypes(): Type[];
    /**
     * @type {TypeMembers}
     */
    get typeMembers(): TypeMembers;
    /**
     * Checks if arg types are valid.
     * Throws errors if not valid. Returns the return type if valid.
     * @param {Site} site
     * @param {Typed[]} posArgs
     * @param {{[name: string]: Typed}} namedArgs
     * @returns {Type[]}
     */
    checkCall(site: Site, posArgs: Typed[], namedArgs?: {
        [name: string]: Typed;
    }): Type[];
    /**
     * @package
     * @param {Site} site
     * @param {InferenceMap} map
     * @param {null | Type} type
     * @returns {Type}
     */
    infer(site: Site, map: InferenceMap, type: null | Type): Type;
    /**
     * @package
     * @param {Site} site
     * @param {InferenceMap} map
     * @param {Type[]} argTypes
     * @returns {FuncType}
     */
    inferArgs(site: Site, map: InferenceMap, argTypes: Type[]): FuncType;
    /**
     * Checks if any of 'this' argTypes or retType is same as Type.
     * Only if this checks return true is the association allowed.
     * @param {Site} site
     * @param {Type} type
     * @returns {boolean}
     */
    isAssociated(site: Site, type: Type): boolean;
    /**
     * Checks if 'this' is a base type of another FuncType.
     * The number of args needs to be the same.
     * Each argType of the FuncType we are checking against needs to be the same or less specific (i.e. isBaseOf(this.#argTypes[i]))
     * The retType of 'this' needs to be the same or more specific
     * @param {Type} other
     * @returns {boolean}
     */
    isBaseOf(other: Type): boolean;
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
     * Throws an error if name isn't found
     * @param {Site} site
     * @param {string} name
     * @returns {number}
     */
    getNamedIndex(site: Site, name: string): number;
    /**
     * @returns {Typed}
     */
    toTyped(): Typed;
    #private;
}
/**
 * @package
 * @type {DataType}
 */
declare const IntType: DataType;
/**
 * @package
 * @type {DataType}
 */
declare const MintingPolicyHashType: DataType;
/**
 * Builtin Real fixed point number type
 * @package
 * @type {DataType}
 */
declare const RealType: DataType;
/**
 * Builtin string type
 * @package
 * @type {DataType}
 */
declare const StringType: DataType;
/**
 * Builtin Tx type
 * @package
 * @type {DataType}
 */
declare const TxType: DataType;
/**
 * @package
 * @type {DataType}
 */
declare const ValidatorHashType: DataType;
/**
 * Part of a trick to force expansion of a type alias
 * @template T
 * @typedef {T extends any ? {key: T} : never} WrapAlias<T>
 */
/**
 * Part of a trick to force expansion of a type alias
 * @template T
 * @typedef {T extends {key: any} ? T["key"] : never} UnwrapAlias<T>
 */
/**
 * Explicit union type-aliases is sometimes more helpful in VSCode tooltips
 * Unalias forces an alias expansion
 * Trick taken from https://stackoverflow.com/questions/73588194
 * @template T
 * @typedef {UnwrapAlias<WrapAlias<T>>} ExpandAlias<T>
 */
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
* 	transferSite: (src: any, startPos: number, endPos: number, codeMapSite: null | any) => any,
*   transferSource: (raw: string, fileIndex: null | number) => any,
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
 * Throws an error if 'cond' is false.
 * @package
 * @param {boolean} cond
 * @param {string} msg
 */
declare function assert(cond: boolean, msg?: string): void;
/**
 * @package
 * @template Tin, Tout
 * @param {Tin} obj
 * @param {{new(...any): Tout}} C
 * @returns {Tout}
 */
declare function assertClass<Tin, Tout>(obj: Tin, C: new (...any: any[]) => Tout, msg?: string): Tout;
/**
 * Throws an error if 'obj' is undefined. Returns 'obj' itself (for chained application).
 * @package
 * @template T
 * @param {T | undefined | null} obj
 * @param {string} msg
 * @returns {T}
 */
declare function assertDefined<T>(obj: T, msg?: string): T;
/**
 * Converts an unbounded integer into a list of uint8 numbers (big endian)
 * Used by the CBOR encoding of data structures, and by Ed25519
 * @package
 * @param {bigint} x
 * @returns {number[]}
 */
declare function bigIntToBytes(x: bigint): number[];
/**
 * Converts a list of uint8 numbers into an unbounded int (big endian)
 * Used by the CBOR decoding of data structures.
 * @package
 * @param {number[]} b
 * @return {bigint}
 */
declare function bytesToBigInt(b: number[]): bigint;
/**
 * Set the statistics collector (used by the test-suite)
 * @param {(name: string, count: number) => void} callback
 */
declare function setRawUsageNotifier(callback: (name: string, count: number) => void): void;
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
/**
 * Plutus-core lambda term
 * @package
 */
declare class UplcLambda extends UplcTerm {
    /**
     * @param {Site} site
     * @param {UplcTerm} rhs
     * @param {null | string} argName
     */
    constructor(site: Site, rhs: UplcTerm, argName?: null | string);
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
 * A Real in Helios is a fixed point number with REAL_PRECISION precision
 * @package
 * @type {number}
 */
declare const REAL_PRECISION: number;
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
 * Base class of literal tokens
 * @package
 */
declare class PrimitiveLiteral extends Token {
}
/**
 * @package
 */
declare class ModuleScope extends Scope {
}
/**
 * @package
 */
declare class Common {
    /**
     * @param {Typed} i
     * @param {Type} t
     * @returns {boolean}
     */
    static instanceOf(i: Typed, t: Type): boolean;
    /**
     * @param {Type | Type[]} type
     * @returns {Typed | Multi}
     */
    static toTyped(type: Type | Type[]): Typed | Multi;
    /**
     * Compares two types. Throws an error if neither is a Type.
     * @example
     * Common.typesEq(IntType, IntType) => true
     * @param {Type} a
     * @param {Type} b
     * @returns {boolean}
     */
    static typesEq(a: Type, b: Type): boolean;
    /**
     * @param {Type} type
     */
    static isEnum(type: Type): boolean;
    /**
     * @param {Type} type
     */
    static countEnumMembers(type: Type): number;
    /**
     * @param {TypeClass} tc
     * @returns {string[]}
     */
    static typeClassMembers(tc: TypeClass): string[];
    /**
     * @param {Type} type
     * @param {TypeClass} tc
     * @returns {boolean}
     */
    static typeImplements(type: Type, tc: TypeClass): boolean;
    /**
     * @type {null | DataType}
     */
    get asDataType(): DataType;
    /**
     * @type {null | EnumMemberType}
     */
    get asEnumMemberType(): EnumMemberType;
    /**
     * @type {null | Func}
     */
    get asFunc(): Func;
    /**
     * @type {null | Instance}
     */
    get asInstance(): Instance;
    /**
     * @type {null | Multi}
     */
    get asMulti(): Multi;
    /**
     * @type {null | Named}
     */
    get asNamed(): Named;
    /**
     * @type {null | Namespace}
     */
    get asNamespace(): Namespace;
    /**
     * @type {null | Parametric}
     */
    get asParametric(): Parametric;
    /**
     * @type {null | Type}
     */
    get asType(): Type;
    /**
     * @type {null | Typed}
     */
    get asTyped(): Typed;
    /**
     * @type {null | TypeClass}
     */
    get asTypeClass(): TypeClass;
    /**
     * @type {boolean}
     */
    get ready(): boolean;
    /**
     * @param {any} obj
     * @returns {UplcData}
     */
    jsToUplc(obj: any): UplcData;
    /**
     * @param {UplcData} data
     * @returns {any}
     */
    uplcToJs(data: UplcData): any;
    /**
     * @returns {string}
     */
    toString(): string;
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
     * @returns {number}
     */
    static findBuiltin(name: string): number;
    /**
     * @param {null | IRScope} parent
     * @param {null | IRVariable} variable
     */
    constructor(parent: null | IRScope, variable: null | IRVariable);
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
     * @param {IRExprRegistry} registry
     * @returns {IRExpr[]}
     */
    simplifyUnusedInArgs(registry: IRExprRegistry): IRExpr[];
    /**
     * @param {UplcTerm} term
     * @returns {UplcTerm}
     */
    toUplcCall(term: UplcTerm): UplcTerm;
    #private;
}
/**
 * User scope
 * @package
 * @implements {EvalEntity}
 */
declare class Scope extends Common implements EvalEntity {
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
     * @param {Word} name
     */
    remove(name: Word): void;
    /**
     * @param {Word} name
     * @returns {Scope}
     */
    getScope(name: Word): Scope;
    /**
     * Gets a named value from the scope. Throws an error if not found
     * @param {Word} name
     * @returns {EvalEntity | Scope}
     */
    get(name: Word): EvalEntity | Scope;
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
    dump(): void;
    /**
     * @param {(name: string, type: Type) => void} callback
     */
    loopTypes(callback: (name: string, type: Type) => void): void;
    #private;
}
/**
 * Only func instances can be parametrics instances,
 *  there are no other kinds of parametric instances
 * @package
 * @implements {Parametric}
 */
declare class ParametricFunc extends Common implements Parametric {
    /**
     * @param {Parameter[]} params
     * @param {FuncType} fnType
     */
    constructor(params: Parameter[], fnType: FuncType);
    /**
     * @type {null | ((...any) => HeliosDataClass<HeliosData>)}
     */
    get offChainType(): (...any: any[]) => HeliosDataClass<HeliosData>;
    get params(): Parameter[];
    get fnType(): FuncType;
    /**
     * null TypeClasses aren't included
     * @type {TypeClass[]}
     */
    get typeClasses(): TypeClass[];
    /**
     * @param {Type[]} types
     * @param {Site} site
     * @returns {EvalEntity}
     */
    apply(types: Type[], site?: Site): EvalEntity;
    /**
     * Must infer before calling
     * @param {Site} site
     * @param {Typed[]} args
     * @param {{[name: string]: Typed}} namedArgs
     * @param {Type[]} paramTypes - so that paramTypes can be accessed by caller
     * @returns {Func}
     */
    inferCall(site: Site, args: Typed[], namedArgs?: {
        [name: string]: Typed;
    }, paramTypes?: Type[]): Func;
    /**
     * @param {Site} site
     * @param {InferenceMap} map
     * @returns {Parametric}
     */
    infer(site: Site, map: InferenceMap): Parametric;
    #private;
}
/**
 * @package
 */
declare class TypeParameters {
    /**
     * @param {TypeParameter[]} parameterExprs
     * @param {boolean} isForFunc
     */
    constructor(parameterExprs: TypeParameter[], isForFunc: boolean);
    /**
     * @returns {boolean}
     */
    hasParameters(): boolean;
    /**
     * @type {string[]}
     */
    get parameterNames(): string[];
    /**
     * @returns {Parameter[]}
     */
    getParameters(): Parameter[];
    /**
     * Always include the braces, even if there aren't any type parameters, so that the mutual recursion injection function has an easier time figuring out what can depend on what
     * @param {string} base
     * @returns {string}
     */
    genTypePath(base: string): string;
    /**
     * Always include the braces, even if there aren't any type parameters, so that the mutual recursion injection function has an easier time figuring out what can depend on what
     * @param {string} base
     * @returns {string}
     */
    genFuncPath(base: string): string;
    /**
     * @returns {string}
     */
    toString(): string;
    /**
     * @param {Scope} scope
     * @returns {Scope}
     */
    evalParams(scope: Scope): Scope;
    /**
     * @param {Scope} scope
     * @param {(scope: Scope) => FuncType} evalConcrete
     * @returns {ParametricFunc | FuncType}
     */
    evalParametricFuncType(scope: Scope, evalConcrete: (scope: Scope) => FuncType, impl?: any): ParametricFunc | FuncType;
    /**
     * @param {Scope} scope
     * @param {(scope: Scope) => FuncType} evalConcrete
     * @returns {EvalEntity}
     */
    evalParametricFunc(scope: Scope, evalConcrete: (scope: Scope) => FuncType): EvalEntity;
    /**
     * @param {Scope} scope
     * @param {Site} site
     * @param {(scope: Scope) => DataType} evalConcrete
     * @returns {[DataType | ParametricType, Scope]}
     */
    createParametricType(scope: Scope, site: Site, evalConcrete: (scope: Scope) => DataType): [DataType | ParametricType, Scope];
    #private;
}
/**
 * (..) -> RetTypeExpr {...} expression
 * @package
 */
declare class FuncLiteralExpr extends Expr {
    /**
     * @param {Site} site
     * @param {FuncArg[]} args
     * @param {(null | Expr)[]} retTypeExprs
     * @param {Expr} bodyExpr
     */
    constructor(site: Site, args: FuncArg[], retTypeExprs: (null | Expr)[], bodyExpr: Expr);
    /**
     * @type {number}
     */
    get nArgs(): number;
    /**
     * @type {string[]}
     */
    get argNames(): string[];
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
     * @returns {FuncType}
     */
    evalType(scope: Scope): FuncType;
    isMethod(): boolean;
    /**
     * @returns {IR}
     */
    argsToIR(): IR;
    /**
     * In reverse order, because later opt args might depend on earlier args
     * @param {IR} innerIR
     * @returns {IR}
     */
    wrapWithDefaultArgs(innerIR: IR): IR;
    /**
     * @param {string} indent
     * @returns {IR}
     */
    toIRInternal(indent?: string): IR;
    #private;
}
/**
 * Base class of every Type and Instance expression.
 * @package
 */
declare class Expr extends Token {
    /**
     * Used in switch cases where initial typeExpr is used as memberName instead
     * @param {null | EvalEntity} c
     */
    set cache(arg: EvalEntity);
    /**
     * @type {null | EvalEntity}
     */
    get cache(): EvalEntity;
    /**
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    evalInternal(scope: Scope): EvalEntity;
    /**
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    eval(scope: Scope): EvalEntity;
    /**
     * @param {Scope} scope
     * @returns {DataType}
     */
    evalAsDataType(scope: Scope): DataType;
    /**
     * @param {Scope} scope
     * @returns {Type}
     */
    evalAsType(scope: Scope): Type;
    /**
     * @param {Scope} scope
     * @returns {Typed}
     */
    evalAsTyped(scope: Scope): Typed;
    /**
     * @param {Scope} scope
     * @returns {Typed | Multi}
     */
    evalAsTypedOrMulti(scope: Scope): Typed | Multi;
    /**
     * @param {string} indent
     * @returns {IR}
     */
    toIR(indent?: string): IR;
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
/**
 * @package
 * @implements {ParameterI}
 */
declare class Parameter implements ParameterI {
    /**
     * @param {string} name - typically "a" or "b"
     * @param {string} path - typicall "__T0" or "__F0"
     * @param {TypeClass} typeClass
     */
    constructor(name: string, path: string, typeClass: TypeClass);
    /**
     * @type {string}
     */
    get name(): string;
    /**
     * @type {Type}
     */
    get ref(): Type;
    /**
     * A null TypeClass matches any type
     * @type {TypeClass}
     */
    get typeClass(): TypeClass;
    /**
     * @returns {string}
     */
    toString(): string;
    #private;
}
/**
 * @package
 * @implements {Parametric}
 */
declare class ParametricType extends Common implements Parametric {
    /**
     * @param {{
     * 	 name: string,
     *   offChainType?: ((...any) => HeliosDataClass<HeliosData>)
     *   parameters: Parameter[]
     *   apply: (types: Type[]) => DataType
     * }} props
     */
    constructor({ name, offChainType, parameters, apply }: {
        name: string;
        offChainType?: (...any: any[]) => HeliosDataClass<HeliosData>;
        parameters: Parameter[];
        apply: (types: Type[]) => DataType;
    });
    /**
     * @type {null | ((...any) => HeliosDataClass<HeliosData>)}
     */
    get offChainType(): (...any: any[]) => HeliosDataClass<HeliosData>;
    /**
     * @type {TypeClass[]}
     */
    get typeClasses(): TypeClass[];
    /**
     * @param {Type[]} types
     * @param {Site} site
     * @returns {EvalEntity}
     */
    apply(types: Type[], site?: Site): EvalEntity;
    /**
    * Must infer before calling
    * @param {Site} site
    * @param {Typed[]} args
    * @param {{[name: string]: Typed}} namedArgs
    * @param {Type[]} paramTypes - so that paramTypes can be accessed by caller
    * @returns {Func}
    */
    inferCall(site: Site, args: Typed[], namedArgs?: {
        [name: string]: Typed;
    }, paramTypes?: Type[]): Func;
    /**
     * @param {Site} site
     * @param {InferenceMap} map
     * @returns {Parametric}
     */
    infer(site: Site, map: InferenceMap): Parametric;
    #private;
}
/**
 * @package
 */
declare class TypeParameter {
    /**
     * @param {Word} name
     * @param {null | Expr} typeClassExpr
     */
    constructor(name: Word, typeClassExpr: null | Expr);
    /**
     * @type {string}
     */
    get name(): string;
    /**
     * @type {TypeClass}
     */
    get typeClass(): TypeClass;
    /**
     * @param {Scope} scope
     * @param {string} path
     */
    eval(scope: Scope, path: string): Parameter;
    /**
     * @returns {string}
     */
    toString(): string;
    #private;
}
/**
 * Function argument class
 * @package
 */
declare class FuncArg extends NameTypePair {
    /**
     * @param {IR} bodyIR
     * @param {string} name
     * @param {IR} defaultIR
     * @returns {IR}
     */
    static wrapWithDefaultInternal(bodyIR: IR, name: string, defaultIR: IR): IR;
    /**
     * @param {Word} name
     * @param {null | Expr} typeExpr
     * @param {null | Expr} defaultValueExpr
     */
    constructor(name: Word, typeExpr: null | Expr, defaultValueExpr?: null | Expr);
    /**
     * @param {Scope} scope
     */
    evalDefault(scope: Scope): void;
    /**
     * @param {Scope} scope
     * @returns {ArgType}
     */
    evalArgType(scope: Scope): ArgType;
    /**
     * (argName) -> {
     *   <bodyIR>
     * }(
     *   ifThenElse(
     * 		__useoptarg__argName,
     *  	() -> {
     *        argName
     *      },
     *      () -> {
     *        <defaultValueExpr>
     *      }
     *   )()
     * )
     * TODO: indentation
     * @param {IR} bodyIR
     * @returns {IR}
     */
    wrapWithDefault(bodyIR: IR): IR;
    #private;
}
/**
 * NameTypePair is base class of FuncArg and DataField (differs from StructLiteralField)
 * @package
 */
declare class NameTypePair {
    /**
     * @param {Word} name
     * @param {null | Expr} typeExpr
     */
    constructor(name: Word, typeExpr: null | Expr);
    /**
     * @type {Site}
     */
    get site(): Site;
    /**
     * @type {Word}
     */
    get name(): Word;
    /**
     * Throws an error if called before evalType()
     * @type {Type}
     */
    get type(): Type;
    /**
     * @type {null | Expr}
     */
    get typeExpr(): Expr;
    /**
     * @type {string}
     */
    get typeName(): string;
    /**
     * @returns {boolean}
     */
    isIgnored(): boolean;
    /**
     * @returns {boolean}
     */
    hasType(): boolean;
    /**
     * Evaluates the type, used by FuncLiteralExpr and DataDefinition
     * @param {Scope} scope
     * @returns {Type}
     */
    evalType(scope: Scope): Type;
    /**
     * @returns {IR}
     */
    toIR(): IR;
    /**
     *
     * @returns {string}
     */
    toString(): string;
    #private;
}
export {};
//# sourceMappingURL=helios.d.ts.map