//@ts-check
// Helios data objects

import {
    config
} from "./config.js";

import {
    assert,
    assertDefined,
    bytesToHex,
    bytesToText,
    eq,
    hexToBytes,
    textToBytes
} from "./utils.js";

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

/**
 * Base-type of all data-types that exist both on- and off-chain, and map directly to Helios instances.
 */
export class HeliosData extends CborData {
	constructor() {
        super();
	}

    /**
     * Name begins with underscore so it can never conflict with structure field names.
     * @package
     * @returns {UplcData}
     */
	_toUplcData() {
        throw new Error("not yet implemented");
	}

    /**
     * @returns {string}
     */
	toSchemaJson() {
		return this._toUplcData().toSchemaJson();
	}
}

/**
 * @template {HeliosData} T
 * 
 * @typedef {{
 *   new(...args: any[]): T
 *   fromUplcCbor: (bytes: (string | number[])) => T
 *   fromUplcData: (data: UplcData) => T
 * }} HeliosDataClass
 */

/**
 * Helios Int type
 */
export class HInt extends HeliosData {
    /** 
     * @type {bigint} 
     */
    #value;

    /**
     * @package
     * @param {number | bigint | string} rawValue
     * @returns {bigint}
     */
    static cleanConstructorArg(rawValue) {
        const value = BigInt(rawValue);

        if (value.toString() != rawValue.toString()) {
            throw new Error("not a valid integer");
        }

        return value;
    }

    /**
     * @param {number | bigint | string} rawValue
     */
    constructor(rawValue) {
        super();

        this.#value = HInt.cleanConstructorArg(rawValue);
    }

    /**
     * @type {bigint}
     */
    get value() {
        return this.#value;
    }

    /**
     * @package
     * @returns {UplcData}
     */
    _toUplcData() {
        return new IntData(this.#value);
    }

    /**
     * @param {UplcData} data
     * @returns {HInt}
     */
    static fromUplcData(data) {
        return new HInt(data.int);
    }

    /**
     * @param {string | number[]} bytes
     * @returns {HInt}
     */
    static fromUplcCbor(bytes) {
        return HInt.fromUplcData(UplcData.fromCbor(bytes));
    }
}

/**
 * Milliseconds since 1 jan 1970
 */
export class Time extends HInt {
     /**
     * @package
     * @param {number | bigint | string | Date} rawValue
     * @returns {bigint}
     */
	static cleanConstructorArg(rawValue) {
        if (rawValue instanceof Date) {
            return BigInt(rawValue.getTime());
        } else {
            const value = BigInt(rawValue);

            if (value.toString() != rawValue.toString()) {
                throw new Error("not a valid integer");
            } else {
                return value;
            }
        }
    }

    /**
     * @param {number | bigint | string | Date} rawValue
     */
    constructor(rawValue) {
        super(Time.cleanConstructorArg(rawValue));
    }

    /**
     * @param {UplcData} data
     * @returns {Time}
     */
    static fromUplcData(data) {
        return new Time(data.int);
    }

    /**
     * @param {string | number[]} bytes
     * @returns {Time}
     */
    static fromUplcCbor(bytes) {
        return Time.fromUplcData(UplcData.fromCbor(bytes));
    }
}

/**
 * Difference between two time values in milliseconds.
 */
export class Duration extends HInt {
    /**
     * @param {UplcData} data
     * @returns {Duration}
     */
    static fromUplcData(data) {
        return new Duration(data.int);
    }

    /**
     * @param {string | number[]} bytes
     * @returns {Duration}
     */
    static fromUplcCbor(bytes) {
        return Duration.fromUplcData(UplcData.fromCbor(bytes));
    }
}

/**
 * Helios Bool type
 */
export class Bool extends HeliosData {
    /** 
     * @type {boolean} 
     */
    #value;

    /**
     * @package
     * @param {boolean | string} rawValue 
     * @returns {boolean}
     */
    static cleanConstructorArg(rawValue) {
        if (typeof rawValue == "string") {
            if (rawValue == "false") {
                return false;
            } else if (rawValue == "true") {
                return true;
            } else {
                throw new Error("not a valid string representation of a Bool");
            }
        } else if (typeof rawValue == "boolean") {
            return rawValue;
        } else {
            throw new Error("can't convert to boolean");
        }
    }

    /**
     * @param {boolean | string} rawValue 
     */
    constructor(rawValue) {
        super();

        this.#value = Bool.cleanConstructorArg(rawValue);
    }

    get bool() {
        return this.#value;
    }
    
    /**
     * @package
     * @returns {UplcData}
     */
    _toUplcData() {
        return new ConstrData(this.#value ? 1 : 0, []);
    }

    /** 
     * @param {UplcData} data
     * @returns {Bool}
     */
    static fromUplcData(data) {
        assert(data.fields.length == 0, "bool data can't have fields");

        if (data.index == 0) {
            return new Bool(false);
        } else if (data.index == 1) {
            return new Bool(true);
        } else {
            throw new Error("expected 0 or 1 for ConstrData representing Bool");
        }
    }

    /**
     * @param {string | number[]} bytes 
     * @returns {Bool}
     */
    static fromUplcCbor(bytes) {
        return Bool.fromUplcData(UplcData.fromCbor(bytes));
    }
}

/**
 * Helios String type.
 * Can't be named 'String' because that would interfere with the javascript 'String'-type
 */
export class HString extends HeliosData {
    /**
     * @type {string}
     */
    #value;

    /**
     * @param {string} value 
     */
    constructor(value) {
        super();

        this.#value = value;
    }

    get string() {
        return this.#value;
    }

    /**
     * @package
     * @returns {UplcData}
     */
    _toUplcData() {
        return new ByteArrayData(textToBytes(this.#value));
    }

    /**
     * @param {UplcData} data 
     * @returns {HString}
     */
    static fromUplcData(data) {
        return new HString(bytesToText(data.bytes));
    }

    /**
     * @param {string | number[]} bytes 
     * @returns {HString}
     */
    static fromUplcCbor(bytes) {
        return HString.fromUplcData(UplcData.fromCbor(bytes));
    }
}

/**
 * Helios ByteArray type
 */
export class ByteArray extends HeliosData {
    /**
     * @type {number[]}
     */
    #bytes;

    /**
     * @package
     * @param {string | number[]} rawValue 
     */
    static cleanConstructorArg(rawValue) {
        if (Array.isArray(rawValue)) {
            return rawValue;
        } else if (typeof rawValue == "string") {
            if (rawValue.startsWith("#")) {
                rawValue = rawValue.slice(1);
            }

            return hexToBytes(rawValue);
        } else {
            throw new Error("unexpected bytes type");
        }
    }

    /**
     * @param {string | number[]} rawValue 
     */
    constructor(rawValue) {
        super();

        this.#bytes = ByteArray.cleanConstructorArg(rawValue);
    }

    /**
     * @type {number[]}
     */
    get bytes() {
        return this.#bytes;
    }

    /**
     * @type {string}
     */
    get hex() {
        return bytesToHex(this.#bytes);
    }

    /**
     * @package
     * @returns {UplcData}
     */
    _toUplcData() {
        return new ByteArrayData(this.#bytes);
    }

    /**
     * @param {UplcData} data 
     * @returns {ByteArray}
     */
    static fromUplcData(data) {
        return new ByteArray(data.bytes);
    }

    /**
     * @param {string | number[]} bytes
     * @returns {ByteArray}
     */
    static fromUplcCbor(bytes) {
        return ByteArray.fromUplcData(UplcData.fromCbor(bytes));
    }
}

/**
 * Dynamically constructs a new List class, depending on the item type.
 * @template {HeliosData} T
 * @param {HeliosDataClass<T>} ItemClass
 * @returns {HeliosDataClass<HList_>}
 */
export function HList(ItemClass) {
    assert(!new.target, "List can't be called with new");
    assert(ItemClass.prototype instanceof HeliosData);

    const typeName = `[]${ItemClass.name}`;

    class HList_ extends HeliosData {
        /** 
         * @type {T[]} 
         */
        #items;

        /**
         * @param {any[]} rawList 
         */
        constructor(rawList) {
            super();

            this.#items = rawList.map(item => {
                if (item instanceof ItemClass) {
                    return item;
                } else {
                    return new ItemClass(item);
                }
            });
        }

        /**
         * @package
         * @type {string}
         */
        get _listTypeName() {
            return typeName;
        }

        /**
         * Overload 'instanceof' operator
         * @package
         * @param {any} other 
         * @returns {boolean}
         */
        static [Symbol.hasInstance](other) {
            return (other._listTypeName === typeName) && (other instanceof HeliosData);
        }

        /**
         * @type {T[]}
         */
        get items() {
            return this.#items;
        }

        /**
         * @package
         * @returns {UplcData}
         */
        _toUplcData() {
            return new ListData(this.#items.map(item => item._toUplcData()))
        }

        /**
         * @param {UplcData} data 
         * @returns {HList_}
         */
        static fromUplcData(data) {
            return new HList_(data.list.map(d => ItemClass.fromUplcData(d)));
        }

        /**
         * @param {string | number[]} bytes 
         * @returns {HList_}
         */
        static fromUplcCbor(bytes) {
            return HList_.fromUplcData(UplcData.fromCbor(bytes));
        }
    }

    Object.defineProperty(HList_, "name", {
        value: typeName,
        writable: false
    });

    return HList_;
}

/**
 * @template {HeliosData} TKey
 * @template {HeliosData} TValue
 * @param {HeliosDataClass<TKey>} KeyClass 
 * @param {HeliosDataClass<TValue>} ValueClass
 * @returns {HeliosDataClass<HMap_>}
 */
export function HMap(KeyClass, ValueClass) {
    assert(!new.target, "HMap can't be called with new");
    assert(KeyClass.prototype instanceof HeliosData);
    assert(ValueClass.prototype instanceof HeliosData);
    
    const typeName = `Map[${KeyClass.name}]${ValueClass.name}`;

    class HMap_ extends HeliosData {
        /**
         * @type {[TKey, TValue][]}
         */
        #pairs;

        /**
         * @package
         * @param {...any} args
         * @returns {[any, any][]}
         */
        static cleanConstructorArgs(...args) {
            /** @type {[any, any][]} */
            let pairs = [];

            if (args.length == 1) {
                const arg = args[0];

                if (arg instanceof Map) {
                    return HMap_.cleanConstructorArgs(Array.from(arg.entries()));
                } else if (!Array.isArray(arg)) {
                    throw new Error("expected array or Map arg");
                } else {
                    const lst = arg;

                    pairs = lst.map(item => {
                        if (!Array.isArray(item)) {
                            throw new Error("expected array item (pair)");
                        } else if (item.length != 2) {
                            throw new Error("expected array item of length 2 (pair)");
                        } else {
                            return [item[0], item[1]];
                        }
                    });
                }
            } else if (args.length == 2) {
                const [keys, values] = args;

                if (!Array.isArray(keys)) {
                    throw new Error("expected keys array arg");
                } else if (!Array.isArray(values)) {
                    throw new Error("expected values array arg");
                } else if (keys.length != values.length) {
                    throw new Error("keys and values list don't have same length");
                } else {
                    pairs = keys.map((key, i) => {
                        const value = values[i];

                        return [key, value];
                    });
                }
            } else {
                throw new Error("unexpected number of args");
            }

            return pairs;
        }

        /**
         * @param  {...any} args
         */
        constructor(...args) {
            const rawPairs = HMap_.cleanConstructorArgs(...args);

            /**
             * @type {[TKey, TValue][]}
             */
            const pairs = rawPairs.map(([rawKey, rawValue]) => {
                const key = function() {
                    if (rawKey instanceof KeyClass) {
                        return rawKey;
                    } else {
                        return new KeyClass(rawKey);
                    }
                }();

                const value = function() {
                    if (rawValue instanceof ValueClass) {
                        return rawValue;
                    } else {
                        return new ValueClass(rawValue);
                    }
                }();

                return [key, value];
            });

            super();

            this.#pairs = pairs;
        }

        /**
         * @package
         * @type {string}
         */
        get _mapTypeName() {
            return typeName;
        }

        /**
         * Overload 'instanceof' operator
         * @package
         * @param {any} other 
         * @returns {boolean}
         */
        static [Symbol.hasInstance](other) {
            return (other._mapTypeName === typeName) && (other instanceof HeliosData);
        }

        /**
         * @type {[TKey, TValue][]}
         */
        get pairs() {
            return this.#pairs;
        }

        /**
         * @package
         * @returns {UplcData}
         */
        _toUplcData() {
            return new MapData(this.#pairs.map(([key, value]) => [key._toUplcData(), value._toUplcData()]));
        }

        /**
         * @param {UplcData} data 
         * @returns {HMap_}
         */
        static fromUplcData(data) {
            return new HMap_(data.map.map(([kd, vd]) => [KeyClass.fromUplcData(kd), ValueClass.fromUplcData(vd)]));
        }

        /**
         * @param {string | number[]} bytes 
         * @returns {HMap_}
         */
        static fromUplcCbor(bytes) {
            return HMap_.fromUplcData(UplcData.fromCbor(bytes));
        }
    }

    Object.defineProperty(HMap_, "name", {
        value: typeName,
        writable: false
    });

    return HMap_;
}

/**
 * @template {HeliosData} T
 * @param {HeliosDataClass<T>} SomeClass
 * @returns {HeliosDataClass<Option_>}
 */
export function Option(SomeClass) {
    assert(!new.target, "Option can't be called with new");
    assert(SomeClass.prototype instanceof HeliosData);

    const typeName = `Option[${SomeClass.name}]`;

    class Option_ extends HeliosData {
        /**
         * @type {?T}
         */
        #value;

        /**
         * @package
         * @param {?any} rawValue 
         * @returns {?T}
         */
        static cleanConstructorArg(rawValue) {
            if (rawValue == null) {
                return null;
            } else if (!(rawValue instanceof SomeClass)) {
                return new SomeClass(rawValue);
            } else {
                return rawValue;
            }
        }

        /** 
         * @param {?any} rawValue
         */
        constructor(rawValue = null) {
            super();

            this.#value = Option_.cleanConstructorArg(rawValue);
        }

        /**
         * @package
         * @type {string}
         */
        get _optionTypeName() {
            return typeName;
        }

        /**
         * Overload 'instanceof' operator
         * @package
         * @param {any} other 
         * @returns {boolean}
         */
        static [Symbol.hasInstance](other) {
            return (other._optionTypeName === typeName) && (other instanceof HeliosData);
        }

        /**
         * @type {?T}
         */
        get some() {
            return this.#value;
        }

        /**
         * @package
         * @returns {UplcData}
         */
        _toUplcData() {
            return new ConstrData(this.#value === null ? 1 : 0, this.#value === null ? [] : [this.#value._toUplcData()]);
        }

        /**
         * @param {UplcData} data 
         * @returns {Option_}
         */
        static fromUplcData(data) {
            if (data.index == 1) {
                assert(data.fields.length == 0);

                return new Option_(null);
            } else if (data.index == 0) {
                assert(data.fields.length == 1);

                return new Option_(SomeClass.fromUplcData(data.fields[0]))
            } else {
                throw new Error("unexpected option constr index");
            }
        }

        /**
         * @param {string | number[]} bytes
         * @returns {Option_}
         */
        static fromUplcCbor(bytes) {
            return Option_.fromUplcData(UplcData.fromCbor(bytes));
        }
    }

    Object.defineProperty(HList, "name", {
        value: typeName,
        writable: false
    });

    return Option_;
}


/**
 * Base class of all hash-types
 * @package
 */
export class Hash extends HeliosData {
	/** @type {number[]} */
	#bytes;

	/**
	 * @param {string | number[]} rawValue 
	 * @returns {number[]}
	 */
	static cleanConstructorArg(rawValue) {
		if (typeof rawValue == "string") {
			return hexToBytes(rawValue);
		} else {
			return rawValue;
		}
	}

	/**
	 * @param {number[]} bytes 
	 */
	constructor(bytes) {
		super();
		this.#bytes = bytes;
	}

	/**
	 * @returns {number[]}
	 */
	get bytes() {
		return this.#bytes;
	}

	/**
	 * @returns {string}
	 */
	get hex() {
		return bytesToHex(this.#bytes);
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return CborData.encodeBytes(this.#bytes);
	}

    /**
     * @returns {UplcData}
     */
    _toUplcData() {
        return new ByteArrayData(this.#bytes);
    }

	/**
	 * Used internally for metadataHash and scriptDataHash
	 * @param {number[]} bytes 
	 * @returns {Hash}
	 */
	static fromCbor(bytes) {
		return new Hash(CborData.decodeBytes(bytes));
	}

	/**
	 * Might be needed for internal use
	 * @param {string} str 
	 * @returns {Hash}
	 */
	static fromHex(str) {
		return new Hash(hexToBytes(str));
	}

	/**
	 * @returns {string}
	 */
	dump() {
		return bytesToHex(this.#bytes);
	}

	/**
	 * @param {Hash} other
	 */
	eq(other) {
		return eq(this.#bytes, other.#bytes);
	}

	/**
	 * @param {Hash} a 
	 * @param {Hash} b 
	 * @returns {number}
	 */
	static compare(a, b) {
		return ByteArrayData.comp(a.#bytes, b.#bytes);
	}
}

export class DatumHash extends Hash {
	/**
	 * @param {string | number[]} rawValue
	 */
	constructor(rawValue) {
		const bytes = Hash.cleanConstructorArg(rawValue);

		assert(bytes.length == 32);
		super(bytes);
	}

	/**
	 * @param {number[]} bytes 
	 * @returns {DatumHash}
	 */
	static fromCbor(bytes) {
		return new DatumHash(CborData.decodeBytes(bytes));
	}

	/**
	 * @param {UplcData} data 
	 * @returns {DatumHash}
	 */
	 static fromUplcData(data) {
		return new DatumHash(data.bytes);
	}
	
	/**
	 * @param {string | number[]} bytes 
	 * @returns {DatumHash}
	 */
	static fromUplcCbor(bytes) {
		return DatumHash.fromUplcData(UplcData.fromCbor(bytes));
	}

	/**
	 * @param {string} str 
	 * @returns {DatumHash}
	 */
	static fromHex(str) {
		return new DatumHash(hexToBytes(str));
	}
}

export class PubKey extends HeliosData {
	#bytes;

	/**
	 * @param {string | number[]} rawValue 
	 */
	constructor(rawValue) {
		super();
		const bytes = (typeof rawValue == "string") ? hexToBytes(rawValue) : rawValue;

		assert(bytes.length == 32, `expected 32 for PubKey, got ${bytes.length}`);
		this.#bytes = bytes;
	}

	/**
	 * @type {number[]}
	 */
	get bytes() {
		return this.#bytes;
	}

	/**
	 * @type {string}
	 */
	get hex() {
		return bytesToHex(this.#bytes);
	}

	/**
	 * @param {UplcData} data 
	 * @returns {PubKey}
	 */
	static fromUplcData(data) {
		return new PubKey(data.bytes)
	}

	/**
     * @returns {UplcData}
     */
    _toUplcData() {
        return new ByteArrayData(this.#bytes);
    }

	/**
	 * @returns {PubKeyHash}
	 */
	hash() {
		return new PubKeyHash(Crypto.blake2b(this.#bytes, 28));
	}
}

export class PubKeyHash extends Hash {
	
	/**
	 * @param {string | number[]} rawValue 
	 */
	constructor(rawValue) {
		const bytes = Hash.cleanConstructorArg(rawValue);

		assert(bytes.length == 28, `expected 28 bytes for PubKeyHash, got ${bytes.length}`);
		super(bytes);
	}

	/**
	 * @param {number[]} bytes 
	 * @returns {PubKeyHash}
	 */
	static fromCbor(bytes) {
		return new PubKeyHash(CborData.decodeBytes(bytes));
	}

	/**
	 * @param {UplcData} data 
	 * @returns {PubKeyHash}
	 */
	static fromUplcData(data) {
		return new PubKeyHash(data.bytes);
	}
	
	/**
	 * @param {string | number[]} bytes 
	 * @returns {PubKeyHash}
	 */
	static fromUplcCbor(bytes) {
		return PubKeyHash.fromUplcData(UplcData.fromCbor(bytes));
	}

	/**
	 * @param {string} str 
	 * @returns {PubKeyHash}
	 */
	static fromHex(str) {
		return new PubKeyHash(hexToBytes(str));
	}
}

export class ScriptHash extends Hash {
	/**
	 * @param {string | number[]} rawValue
	 */
	constructor(rawValue) {
		const bytes = Hash.cleanConstructorArg(rawValue);

		assert(bytes.length == 28, `expected 28 bytes for ScriptHash, got ${bytes.length}`);
		super(bytes);
	}
}

export class MintingPolicyHash extends ScriptHash {
	/**
	 * @param {number[]} bytes 
	 * @returns {MintingPolicyHash}
	 */
	static fromCbor(bytes) {
		return new MintingPolicyHash(CborData.decodeBytes(bytes));
	}

	/**
	 * @param {UplcData} data 
	 * @returns {MintingPolicyHash}
	 */
	static fromUplcData(data) {
		return new MintingPolicyHash(data.bytes);
	}
			
	/**
	 * @param {string | number[]} bytes 
	 * @returns {MintingPolicyHash}
	 */
	static fromUplcCbor(bytes) {
		return MintingPolicyHash.fromUplcData(UplcData.fromCbor(bytes));
	}

	/**
	 * @param {string} str 
	 * @returns {MintingPolicyHash}
	 */
	static fromHex(str) {
		return new MintingPolicyHash(hexToBytes(str));
	}

	/**
	 * Encodes as bech32 string using 'asset' as human readable part
	 * @returns {string}
	 */
	toBech32() {
		return Crypto.encodeBech32("asset", Crypto.blake2b(this.bytes, 20));
	}
}

export class StakeKeyHash extends Hash {
	/**
	 * @param {number[]} rawValue
	 */
	constructor(rawValue) {
		const bytes = Hash.cleanConstructorArg(rawValue);
		
		assert(bytes.length == 28, `expected 28 bytes for StakeKeyHash, got ${bytes.length}`);
		super(bytes);
	}

	/**
	 * @param {number[]} bytes 
	 * @returns {StakeKeyHash}
	 */
	static fromCbor(bytes) {
		return new StakeKeyHash(CborData.decodeBytes(bytes));
	}

	/**
	 * @param {UplcData} data 
	 * @returns {StakeKeyHash}
	 */
	static fromUplcData(data) {
		return new StakeKeyHash(data.bytes);
	}
		
	/**
	 * @param {string | number[]} bytes 
	 * @returns {StakeKeyHash}
	 */
	static fromUplcCbor(bytes) {
		return StakeKeyHash.fromUplcData(UplcData.fromCbor(bytes));
	}

	/**
	 * @param {string} str 
	 * @returns {StakeKeyHash}
	 */
	static fromHex(str) {
		return new StakeKeyHash(hexToBytes(str));
	}
}

export class StakingValidatorHash extends ScriptHash {
	/**
	 * @param {number[]} bytes 
	 * @returns {StakingValidatorHash}
	 */
	static fromCbor(bytes) {
		return new StakingValidatorHash(CborData.decodeBytes(bytes));
	}

	/**
	 * @param {UplcData} data 
	 * @returns {StakingValidatorHash}
	 */
	static fromUplcData(data) {
		return new StakingValidatorHash(data.bytes);
	}
			
	/**
	 * @param {string | number[]} bytes 
	 * @returns {StakingValidatorHash}
	 */
	static fromUplcCbor(bytes) {
		return StakingValidatorHash.fromUplcData(UplcData.fromCbor(bytes));
	}

	/**
	 * @param {string} str 
	 * @returns {StakingValidatorHash}
	 */
	static fromHex(str) {
		return new StakingValidatorHash(hexToBytes(str));
	}
}

export class ValidatorHash extends ScriptHash {
	/**
	 * @param {number[]} bytes 
	 * @returns {ValidatorHash}
	 */
	static fromCbor(bytes) {
		return new ValidatorHash(CborData.decodeBytes(bytes));
	}

	/**
	 * @param {UplcData} data 
	 * @returns {ValidatorHash}
	 */
	static fromUplcData(data) {
		return new ValidatorHash(data.bytes);
	}
		
	/**
	 * @param {string | number[]} bytes 
	 * @returns {ValidatorHash}
	 */
	static fromUplcCbor(bytes) {
		return ValidatorHash.fromUplcData(UplcData.fromCbor(bytes));
	}

	/**
	 * @param {string} str 
	 * @returns {ValidatorHash}
	 */
	static fromHex(str) {
		return new ValidatorHash(hexToBytes(str));
	}
}

/**
 * Hash of a transaction
 */
export class TxId extends Hash {
	/**
	 * @param {string | number[]} rawValue 
	 */
	constructor(rawValue) {
        const bytes = Hash.cleanConstructorArg(rawValue);

		assert(bytes.length == 32, `expected 32 bytes for TxId, got ${bytes.length}`);
		super(bytes);
	}

    /**
     * @returns {UplcData}
     */
    _toUplcData() {
        return new ConstrData(0, [new ByteArrayData(this.bytes)]);
    }

	/**
	 * @param {number[]} bytes 
	 * @returns {TxId}
	 */
	static fromCbor(bytes) {
		return new TxId(CborData.decodeBytes(bytes));
	}

    /**
     * @param {UplcData} data
     * @returns {TxId}
     */
    static fromUplcData(data) {
        assert(data.index == 0);
        assert(data.fields.length == 1);

        return new TxId(data.fields[0].bytes);
    }

    /**
     * @param {string | number[]} bytes 
     * @returns {TxId}
     */
    static fromUplcCbor(bytes) {
        return TxId.fromUplcData(UplcData.fromCbor(bytes));
    }

	/**
	 * @param {string} str 
	 * @returns {TxId}
	 */
	static fromHex(str) {
		return new TxId(hexToBytes(str));
	}

	/**
	 * Filled with 255 so that the internal show() function has max execution budget cost
	 * @param {number} fill
	 * @returns {TxId}
	 */
	static dummy(fill = 255) {
		return new TxId((new Array(32)).fill(fill));
	}
}

/**
 * Id of a Utxo
 */
export class TxOutputId extends HeliosData {
    /** @type {TxId} */
    #txId;

    /** @type {HInt} */
    #utxoIdx;

    /**
     * @param  {...any} args
     * @returns {[any, any]}
     */
    static cleanConstructorArgs(...args) {
        if (args.length == 1) {
            const arg = args[0];

            if (typeof arg == "string") {
                const parts = arg.split("#");

                assert(parts.length == 2);

                return [parts[0], parts[1]];
            } else {
                throw new Error("unexpected single arg type");
            }
        } else if (args.length == 2) {
            return [args[0], args[1]];
        } else {
            throw new Error("unexpected number of args");
        }
    }

    /**
     * @param {...any} args
     */
    constructor(...args) {
        const [rawTxId, rawUtxoIdx] = TxOutputId.cleanConstructorArgs(...args);

        const txId = (rawTxId instanceof TxId) ? rawTxId : new TxId(rawTxId);
        const utxoIdx = (rawUtxoIdx instanceof HInt) ? rawUtxoIdx : new HInt(rawUtxoIdx);

        super();

        this.#txId = txId;
        this.#utxoIdx = utxoIdx;
    }

    get txId() {
        return this.#txId;
    }

    get utxoIdx() {
        return this.#utxoIdx;
    }

    /**
     * @returns {UplcData}
     */
    _toUplcData() {
        return new ConstrData(0, [this.#txId._toUplcData(), this.#utxoIdx._toUplcData()])
    }

    /**
     * @param {UplcData} data
     * @returns {TxOutputId}
     */
    static fromUplcData(data) {
        assert(data.index == 0);
        assert(data.fields.length == 2);

        return new TxOutputId(TxId.fromUplcData(data.fields[0]), HInt.fromUplcData(data.fields[1]));
    }

    /**
     * @param {string | number[]} bytes 
     * @returns {TxOutputId}
     */
    static fromUplcCbor(bytes) {
        return TxOutputId.fromUplcData(UplcData.fromCbor(bytes));
    }
}

/**
 * See CIP19 for formatting of first byte
 */
export class Address extends HeliosData {
	/** @type {number[]} */
	#bytes;

    /**
	 * @param {number[] | string} rawValue
	 * @returns {number[]}
	 */
    static cleanConstructorArg(rawValue) {
        if (typeof rawValue == "string") {
            if (rawValue.startsWith("addr")) {
                return Address.fromBech32(rawValue).bytes;
            } else {
                if (rawValue.startsWith("#")) {
                    rawValue = rawValue.slice(1);
                }

                return hexToBytes(rawValue);
            }
        } else {
            return rawValue;
        }
    }

	/**
	 * @param {string | number[]} rawValue
	 */
	constructor(rawValue) {
		super();
		this.#bytes = Address.cleanConstructorArg(rawValue);

        assert(this.#bytes.length == 29 || this.#bytes.length == 57, `expected 29 or 57 bytes for Address, got ${this.#bytes.length}`);
	}

	get bytes() {
		return this.#bytes.slice();
	}

	toCbor() {
		return CborData.encodeBytes(this.#bytes);
	}

	/**
	 * @param {number[]} bytes
	 * @returns {Address}
	 */
	static fromCbor(bytes) {
		return new Address(CborData.decodeBytes(bytes));
	}

	/**
	 * @param {string} str
	 * @returns {Address}
	 */
	static fromBech32(str) {
		// ignore the prefix (encoded in the bytes anyway)
		let [prefix, bytes] = Crypto.decodeBech32(str);

		let result = new Address(bytes);

		assert(prefix == (Address.isForTestnet(result) ? "addr_test" : "addr"), "invalid Address prefix");

		return result;
	}

	/**
	 * Doesn't check validity
	 * @param {string} hex
	 * @returns {Address}
	 */
	static fromHex(hex) {
		return new Address(hexToBytes(hex));
	}

	/**
	 * Returns the raw Address bytes as a hex encoded string
	 * @returns {string}
	 */
	toHex() {
		return bytesToHex(this.#bytes);
	}

    /**
     * @param {PubKeyHash | ValidatorHash} hash 
     * @param {?(StakeKeyHash | StakingValidatorHash)} stakingHash 
     * @param {boolean} isTestnet
     * @returns {Address}
     */
    static fromHashes(hash, stakingHash = null, isTestnet = config.IS_TESTNET) {
        if (hash instanceof PubKeyHash) {
            return Address.fromPubKeyHash(hash, stakingHash, isTestnet);
        } else if (hash instanceof ValidatorHash) {
            return Address.fromValidatorHash(hash, stakingHash, isTestnet);
        } else {
            throw new Error("unexpected");
        }
    }

	/**
	 * Simple payment address without a staking part
	 * @param {PubKeyHash} hash
	 * @param {?(StakeKeyHash | StakingValidatorHash)} stakingHash
     * @param {boolean} isTestnet
	 * @returns {Address}
	 */
	static fromPubKeyHash(hash, stakingHash = null, isTestnet = config.IS_TESTNET) {
		if (stakingHash !== null) {
			if (stakingHash instanceof StakeKeyHash) {
				return new Address(
					[isTestnet ? 0x00 : 0x01].concat(hash.bytes).concat(stakingHash.bytes)
				);
			} else {
				assert(stakingHash instanceof StakingValidatorHash);
				return new Address(
					[isTestnet ? 0x20 : 0x21].concat(hash.bytes).concat(stakingHash.bytes)
				);
			}
		} else {
			return new Address([isTestnet ? 0x60 : 0x61].concat(hash.bytes));
		}
	}

	/**
	 * Simple script address without a staking part
	 * Only relevant for validator scripts
	 * @param {ValidatorHash} hash
	 * @param {?(StakeKeyHash | StakingValidatorHash)} stakingHash
     * @param {boolean} isTestnet
	 * @returns {Address}
	 */
	static fromValidatorHash(hash, stakingHash = null, isTestnet = config.IS_TESTNET) {
		if (stakingHash !== null) {
			if (stakingHash instanceof StakeKeyHash) {
				return new Address(
					[isTestnet ? 0x10 : 0x11].concat(hash.bytes).concat(stakingHash.bytes)
				);
			} else {
				assert(stakingHash instanceof StakingValidatorHash);
				return new Address(
					[isTestnet ? 0x30 : 0x31].concat(hash.bytes).concat(stakingHash.bytes)
				);
			}
		} else {
			return new Address([isTestnet ? 0x70 : 0x71].concat(hash.bytes));
		}
	}


	/**
	 * @returns {string}
	 */
	toBech32() {
		return Crypto.encodeBech32(
			Address.isForTestnet(this) ? "addr_test" : "addr",
			this.#bytes
		);
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		return {
			hex: bytesToHex(this.#bytes),
			bech32: this.toBech32(),
		};
	}

	/**
	 * @param {Address} address
	 * @returns {boolean}
	 */
	static isForTestnet(address) {
		let type = address.bytes[0] & 0b00001111;

		return type == 0;
	}

	/**
     * 
     * @private
	 * @returns {ConstrData}
	 */
	toCredentialData() {
		let vh = this.validatorHash;

		if (vh !== null) {
			return new ConstrData(1, [new ByteArrayData(vh.bytes)]);
		} else {
			let pkh = this.pubKeyHash;

			if (pkh === null) {
				throw new Error("unexpected");
			} else {
				return new ConstrData(0, [new ByteArrayData(pkh.bytes)]);
			}
		}
	}

	/**
	 * @returns {ConstrData}
	 */
	toStakingData() {
        const type = this.#bytes[0] >> 4;
		const sh = this.stakingHash;

		if (sh == null) {
			return new ConstrData(1, []); // none
		} else {
            if (type == 4 || type == 5) {
                throw new Error("not yet implemented");
            } else if (type == 3 || type == 2) {
                // some
                return new ConstrData(0, [
                    // staking credential -> 0, 1 -> pointer
                    new ConstrData(0, [
                        // StakingValidator credential
                        new ConstrData(1, [new ByteArrayData(sh.bytes)]),
                    ]),
                ]);
            } else if (type == 0 || type == 1) {
                // some
                return new ConstrData(0, [
                    // staking credential -> 0, 1 -> pointer
                    new ConstrData(0, [
                        // StakeKeyHash credential
                        new ConstrData(0, [new ByteArrayData(sh.bytes)]),
                    ]),
                ]);
            } else {
                throw new Error("unexpected");
            }
		}
	}

	/**
	 * @returns {UplcData}
	 */
	_toUplcData() {
		return new ConstrData(0, [this.toCredentialData(), this.toStakingData()]);
	}

    /**
     * @param {UplcData} data 
     * @param {boolean} isTestnet
     * @returns {Address}
     */
    static fromUplcData(data, isTestnet = config.IS_TESTNET) {
        assert(data.index == 0);
        assert(data.fields.length == 2);
        
        const credData = data.fields[0];
        const stakData = data.fields[1];

        assert(credData.fields.length == 1);

        /**
         * @type {?(StakeKeyHash | StakingValidatorHash)}
         */
        let sh;

		// for some weird reason Option::None has index 1
        if (stakData.index == 1) {
            sh = null;
        } else if (stakData.index == 0) {
            assert(stakData.fields.length == 1);

            const inner = stakData.fields[0];
            assert(inner.fields.length == 1);

            if (inner.index == 0) {
                const innerInner = inner.fields[0];
                assert(innerInner.fields.length == 1);

                if (innerInner.index == 0) {
                    sh = new StakeKeyHash(innerInner.fields[0].bytes);
                } else if (innerInner.index == 1) {
                    sh = new StakingValidatorHash(innerInner.fields[0].bytes);
                } else {
                    throw new Error("unexpected");
                }
            } else if (inner.index == 1) {
                throw new Error("staking pointer not yet handled");
            } else {
                throw new Error("unexpected");
            }
        } else {
            throw new Error("unexpected");
        }

        if (credData.index == 0) {
            return Address.fromPubKeyHash(new PubKeyHash(credData.fields[0].bytes), sh, isTestnet);
        } else if (credData.index == 1) {
            return Address.fromValidatorHash(new ValidatorHash(credData.fields[0].bytes), sh, isTestnet);
        } else {
            throw new Error("unexpected");
        }
    }

    /**
     * @param {string | number[]} bytes 
     * @param {boolean} isTestnet
     * @returns {Address}
     */
    static fromUplcCbor(bytes, isTestnet = config.IS_TESTNET) {
        return Address.fromUplcData(UplcData.fromCbor(bytes), isTestnet);
    }

	/**
	 * @type {?PubKeyHash}
	 */
	get pubKeyHash() {
		let type = this.#bytes[0] >> 4;

		if (type % 2 == 0) {
			return new PubKeyHash(this.#bytes.slice(1, 29));
		} else {
			return null;
		}
	}

	/**
	 * @type {?ValidatorHash}
	 */
	get validatorHash() {
		let type = this.#bytes[0] >> 4;

		if (type % 2 == 1) {
			return new ValidatorHash(this.#bytes.slice(1, 29));
		} else {
			return null;
		}
	}

	/**
	 * @type {?(StakeKeyHash | StakingValidatorHash)}
	 */
	get stakingHash() {
		let type = this.#bytes[0] >> 4;

        let bytes = this.#bytes.slice(29);
        

        if (type == 0 || type == 1) {
            assert(bytes.length == 28);
            return new StakeKeyHash(bytes);
        } else if (type == 2 || type == 3) {
            assert(bytes.length == 28);
            return new StakingValidatorHash(bytes);
        } else if (type == 4 || type == 5) {
            throw new Error("staking pointer not yet supported");
        } else {
			return null;
		}
	}

	/**
	 * Used to sort txbody withdrawals
	 * @param {Address} a
	 * @param {Address} b
	 * @return {number}
	 */
	static compStakingHashes(a, b) {
		return Hash.compare(assertDefined(a.stakingHash), assertDefined(b.stakingHash));
	}
}

export class AssetClass extends HeliosData {
	/**
	 * @type {MintingPolicyHash}
	 */
	#mph;

	/**
	 * @type {number[]}
	 */
	#tokenName;

	/**
	 * @param {any[]} args
	 * @returns {[MintingPolicyHash, number[]]}
	 */
	static cleanConstructorArgs(args) {
		if (args.length == 1) {
			const arg = args[0];	

			if (typeof arg == "string") {
				const fields = arg.split(".")

				assert(fields.length == 2, "expected '.' in hex encoded AssetClass");

				return [new MintingPolicyHash(fields[0]), hexToBytes(fields[1])];
			} else {
				throw new Error("unexpected AssetClass arg type");
			}
		} else if (args.length == 2) {
			const arg0 = args[0];
			const arg1 = args[1];

			return [
				arg0 instanceof MintingPolicyHash ? arg0 : new MintingPolicyHash(arg0),
				Array.isArray(arg1) ? arg1 : hexToBytes(arg1)
			];
		} else {
			throw new Error("unexpected number of AssetClass args");
		}
	}

	/**
	 * 
	 * @param {any[]} args 
	 */
	constructor(...args) {
		super();
		const [mph, tokenName] = AssetClass.cleanConstructorArgs(args);

		this.#mph = mph;
		this.#tokenName = tokenName;
	}

	/**
	 * Used when generating script contexts for running programs
	 * @returns {ConstrData}
	 */
	_toUplcData() {
		return new ConstrData(0, [
			this.#mph._toUplcData(),
			new ByteArrayData(this.#tokenName)
		])
	}

	/**
	 * 
	 * @param {UplcData} data 
	 * @returns {AssetClass}
	 */
	static fromUplcData(data) {
		assert(data.index == 0);
		assert(data.fields.length == 2);

		const mph = MintingPolicyHash.fromUplcData(data.fields[0]);
		const tokenName = data.fields[1].bytes;

		return new AssetClass(mph, tokenName);
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return CborData.encodeConstr(0, [
			this.#mph.toCbor(),
			CborData.encodeBytes(this.#tokenName)
		]);
	}

	/**
	 * @param {number[]} bytes 
	 */
	static fromCbor(bytes) {
		/**
		 * @type {MintingPolicyHash | null}
		 */
		let mph = null;

		/**
		 * @type {number[] | null}
		 */
		let tokenName = null;

		const tag = CborData.decodeConstr(bytes, (i, fieldBytes) => {
			switch (i) {
				case 0:
					mph = MintingPolicyHash.fromCbor(fieldBytes);
					break;
				case 1:
					tokenName = CborData.decodeBytes(fieldBytes);
					break;
				default:
					throw new Error("unexpected field");
			} 
		});

		assert(tag == 0);

		if (mph == null || tokenName == null) {
			throw new Error("insufficient fields");
		} else {
			return new AssetClass(mph, tokenName);
		}
	}

    /**
     * @param {string | number[]} bytes
     * @returns {AssetClass}
     */
    static fromUplcCbor(bytes) {
        return AssetClass.fromUplcData(UplcData.fromCbor(bytes));
    }

	/**
	 * @type {AssetClass}
	 */
	static get ADA() {
		return new AssetClass(new MintingPolicyHash(""), "");
	}
}


/**
 * Collection of non-lovelace assets
 */
export class Assets extends CborData {
	/** @type {[MintingPolicyHash, [number[], bigint][]][]} */
	#assets;

	/**
	 * @param {[MintingPolicyHash | number[] | string, [number[] | string, bigint | number][]][]} assets 
	 */
	constructor(assets = []) {
		super();
		this.#assets = assets.map(([rawMph, tokens]) => {
			const mph = rawMph instanceof MintingPolicyHash ? rawMph : new MintingPolicyHash(rawMph);

			return [
				mph,
				tokens.map(([rawName, amount]) => {
					const name = Array.isArray(rawName) ? rawName : hexToBytes(rawName);

					return [name, BigInt(amount)];
				})
			];
		});
	}

	/**
	 * @type {MintingPolicyHash[]}
	 */
	get mintingPolicies() {
		return this.#assets.map(([mph, _]) => mph);
	}

	/**
	 * @type {number}
	 */
	get nTokenTypes() {
		let count = 0;
		
		this.#assets.forEach(([mph, tokens]) => {
			tokens.forEach(([tokenName, _]) => {
				count += 1
			})
		})

		return count;
	}

	/**
	 * Returns empty if mph not found
	 * @param {MintingPolicyHash} mph
	 * @returns {[number[], bigint][]}
	 */
	getTokens(mph) {
		const i = this.#assets.findIndex(entry => entry[0].eq(mph));

		if (i != -1) {
			return this.#assets[i][1];
		} else {
			return [];
		}
	}

	/**
	 * @returns {boolean}
	 */
	isZero() {
		return this.#assets.length == 0;
	}

	/**
	 * @param {MintingPolicyHash} mph
	 * @param {number[]} tokenName 
	 * @returns {boolean}
	 */
	has(mph, tokenName) {
		let inner = this.#assets.find(asset => mph.eq(asset[0]));

		if (inner !== undefined) {
			return inner[1].findIndex(pair => eq(pair[0], tokenName)) != -1;
		} else {
			return false;
		}
	}

	/**
	 * @param {MintingPolicyHash} mph
	 * @param {number[]} tokenName 
	 * @returns {bigint}
	 */
	get(mph, tokenName) {
		let inner = this.#assets.find(asset => mph.eq(asset[0]));

		if (inner !== undefined) {
			let token = inner[1].find(pair => eq(pair[0], tokenName));

			if (token !== undefined) {
				return token[1];
			} else {
				return 0n;
			}
		} else {
			return 0n;
		}
	}

	/**
	 * Mutates 'this'
	 */
	removeZeroes() {
		for (let asset of this.#assets) {
			asset[1] = asset[1].filter(token => token[1] != 0n);
		}

		this.#assets = this.#assets.filter(asset => asset[1].length != 0);
	}

	/**
	 * Mutates 'this'
	 * @param {MintingPolicyHash} mph
	 * @param {number[]} tokenName 
	 * @param {bigint} quantity
	 */
	addComponent(mph, tokenName, quantity) {
		if (quantity == 0n) {
			return;
		}

		let inner = this.#assets.find(asset => mph.eq(asset[0]));

		if (inner === undefined) {
			this.#assets.push([mph, [[tokenName, quantity]]]);
		} else {
			let token = inner[1].find(pair => eq(pair[0], tokenName));

			if (token === undefined) {
				inner[1].push([tokenName, quantity]);
			} else {
				token[1] += quantity;
			}
		}

		this.removeZeroes();
	}

	/**
	 * @param {Assets} other 
	 * @param {(a: bigint, b: bigint) => bigint} op 
	 * @returns {Assets}
	 */
	applyBinOp(other, op) {
		let res = new Assets();

		for (let [mph, tokens] of this.#assets) {
			for (let [tokenName, quantity] of tokens) {
				res.addComponent(mph, tokenName, op(quantity, 0n));
			}
		}

		for (let [mph, tokens] of other.#assets) {
			for (let [tokenName, quantity] of tokens) {
				res.addComponent(mph, tokenName, op(0n, quantity));
			}
		}

		return res;
	}

	/**
	 * @param {Assets} other 
	 * @returns {Assets}
	 */
	add(other) {
		return this.applyBinOp(other, (a, b) => a + b);
	}

	/**
	 * @param {Assets} other 
	 * @returns {Assets}
	 */
	sub(other) {
		return this.applyBinOp(other, (a, b) => a - b);
	}

	/**
	 * @param {bigint} scalar 
	 * @returns {Assets}
	 */
	mul(scalar) {
		return new Assets(this.#assets.map(([mph, tokens]) => {
			return [mph, tokens.map(([token, qty]) => [token, qty*scalar])]
		}))
	}

	/**
	 * Mutates 'this'
	 * Throws error if mph is already contained in 'this'
	 * @param {MintingPolicyHash} mph
	 * @param {[number[], bigint][]} tokens
	 */
	addTokens(mph, tokens) {
		for (let asset of this.#assets) {
			if (asset[0].eq(mph)) {
				throw new Error(`MultiAsset already contains ${bytesToHex(mph.bytes)}`);
			}
		}

		this.#assets.push([mph, tokens.slice()]);

		// sort immediately
		this.sort();
	}

	/**
	 * @param {MintingPolicyHash} mph
	 * @returns {number[][]}
	 */
	getTokenNames(mph) {
		for (let [otherMph, tokens] of this.#assets) {
			if (otherMph.eq(mph)) {
				return tokens.map(([tokenName, _]) => tokenName);
			}
		}

		return [];
	}

	/**
	 * @param {Assets} other 
	 * @returns {boolean}
	 */
	eq(other) {
		for (let asset of this.#assets) {
			for (let token of asset[1]) {
				if (token[1] != other.get(asset[0], token[0])) {
					return false;
				}
			}
		}

		for (let asset of other.#assets) {
			for (let token of asset[1]) {
				if (token[1] != this.get(asset[0], token[0])) {
					return false;
				}
			}
		}

		return true;
	}

	/**
	 * Strict gt, if other contains assets this one doesn't contain => return false
	 * @param {Assets} other 
	 * @returns {boolean}
	 */
	gt(other) {
		if (this.isZero()) {
			return false;
		}

		for (let asset of this.#assets) {
			for (let token of asset[1]) {
				if (token[1] <= other.get(asset[0], token[0])) {
					return false;
				}
			}
		}

		for (let asset of other.#assets) {
			for (let token of asset[1]) {
				if (!this.has(asset[0], token[0])) {
					return false;
				}
			}
		}

		return true;
	}

	/**
	 * @param {Assets} other 
	 * @returns {boolean}
	 */
	ge(other) {
		if (this.isZero()) {
			return other.isZero();
		}

		for (let asset of this.#assets) {
			for (let token of asset[1]) {
				if (token[1] < other.get(asset[0], token[0])) {
					return false;
				}
			}
		}

		for (let asset of other.#assets) {
			for (let token of asset[1]) {
				if (!this.has(asset[0], token[0])) {
					return false;
				}
			}
		}

		return true;
	}

	/**
	 * @returns {boolean}
	 */
	allPositive() {
		for (let asset of this.#assets) {
			for (let pair of asset[1]) {
				if (pair[1] < 0n) {
					return false;
				} else if (pair[1] == 0n) {
					throw new Error("unexpected");
				}
			}
		}

		return true;
	}

	/**
	 * Throws an error if any contained quantity <= 0n
	 */
	assertAllPositive() {
		assert(this.allPositive(), "non-positive token amounts detected");
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return CborData.encodeMap(
			this.#assets.map(
				outerPair => {
					return [outerPair[0].toCbor(), CborData.encodeMap(outerPair[1].map(
						innerPair => {
							return [
								CborData.encodeBytes(innerPair[0]), CborData.encodeInteger(innerPair[1])
							]
						}
					))]
				}
			)
		)
	}

	/**
	 * @param {number[]} bytes
	 * @returns {Assets}
	 */
	static fromCbor(bytes) {
		let ms = new Assets();

		CborData.decodeMap(bytes, (_, pairBytes) => {
			let mph = MintingPolicyHash.fromCbor(pairBytes);

			/**
			 * @type {[number[], bigint][]}
			 */
			let innerMap = [];
			
			CborData.decodeMap(pairBytes, (_, innerPairBytes) => {
				innerMap.push([
					CborData.decodeBytes(innerPairBytes),
					CborData.decodeInteger(innerPairBytes),
				]);
			});

			ms.#assets.push([mph, innerMap]);
		});

		return ms;
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		let obj = {};

		for (let [mph, tokens] of this.#assets) {
			let innerObj = {};

			for (let [tokenName, quantity] of tokens) {
				innerObj[bytesToHex(tokenName)] = quantity.toString();
			}

			obj[mph.dump()] = innerObj;
		}

		return obj;
	}

	/**
	 * Used when generating script contexts for running programs
	 * @returns {MapData}
	 */
	_toUplcData() {
		/** @type {[UplcData, UplcData][]} */
		let pairs = [];

		for (let asset of this.#assets) {
			/** @type {[UplcData, UplcData][]} */
			let innerPairs = [];

			for (let token of asset[1]) {
				innerPairs.push([
					new ByteArrayData(token[0]),
					new IntData(token[1]),
				]);
			}

			pairs.push([
				new ByteArrayData(asset[0].bytes),
				new MapData(innerPairs),
			])
		}

		return new MapData(pairs);
	}

	/**
	 * Makes sure minting policies are in correct order
	 * Mutates 'this'
	 * Order of tokens per mintingPolicyHash isn't changed
	 */
	sort() {
		this.#assets.sort((a, b) => {
			return Hash.compare(a[0], b[0]);
		});
	}

	assertSorted() {
		this.#assets.forEach((b, i) => {
			if (i > 0) {
				const a = this.#assets[i-1];

				assert(Hash.compare(a[0], b[0]) == -1, "assets not sorted")
			}
		})
	}
}

export class Value extends HeliosData {
	/** @type {bigint} */
	#lovelace;

	/** @type {Assets} */
	#assets;
	
	/**
	 * @param {bigint} lovelace 
	 * @param {Assets} assets 
	 */
	constructor(lovelace = 0n, assets = new Assets()) {
		super();
		this.#lovelace = lovelace;
		this.#assets = assets;
	}

	/**
	 * @param {MintingPolicyHash} mph 
	 * @param {number[]} tokenName 
	 * @param {bigint} quantity 
	 * @returns {Value}
	 */
	static asset(mph, tokenName, quantity) {
		return new Value(0n, new Assets([
			[mph, [
				[tokenName, quantity]
			]]
		]));
	}

	/**
	 * @type {bigint}
	 */
	get lovelace() {
		return this.#lovelace;
	}

	/**
	 * Setter for lovelace
	 * Note: mutation is handy when balancing transactions
	 * @param {bigint} lovelace
	 */
	setLovelace(lovelace) {
		this.#lovelace = lovelace;
	}

	/**
	 * @type {Assets}
	 */
	get assets() {
		return this.#assets;
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		if (this.#assets.isZero()) {
			return CborData.encodeInteger(this.#lovelace);
		} else {
			return CborData.encodeTuple([
				CborData.encodeInteger(this.#lovelace),
				this.#assets.toCbor()
			]);
		}
	}

	/**
	 * @param {number[]} bytes 
	 * @returns {Value}
	 */
	static fromCbor(bytes) {
		let mv = new Value();

		if (CborData.isTuple(bytes)) {
			CborData.decodeTuple(bytes, (i, fieldBytes) => {
				switch(i) {
					case 0:
						mv.#lovelace = CborData.decodeInteger(fieldBytes);
						break;
					case 1:
						mv.#assets = Assets.fromCbor(fieldBytes);
						break;
					default:
						throw new Error("unrecognized field");
				}
			});
		} else {
			mv.#lovelace = CborData.decodeInteger(bytes);
		}

		return mv;
	}

	/**
	 * @param {Value[]} values 
	 * @returns {Value}
	 */
	static sum(values) {
		let s = new Value(0n);

		values.forEach(v => {
			s = s.add(v);
		});

		return s;
	}
	
	/**
	 * @param {Value} other 
	 * @returns {Value}
	 */
	add(other) {
		return new Value(this.#lovelace + other.#lovelace, this.#assets.add(other.#assets));
	}

	/**
	 * @param {Value} other 
	 * @returns {Value}
	 */
	sub(other) {
		return new Value(this.#lovelace - other.#lovelace, this.#assets.sub(other.#assets));
	}

	/**
	 * @param {bigint} scalar 
	 * @returns {Value}
	 */
	mul(scalar) {
		return new Value(this.#lovelace*scalar, this.#assets.mul(scalar))
	}

	/**
	 * @param {Value} other 
	 * @returns {boolean}
	 */
	eq(other) {
		return (this.#lovelace == other.#lovelace) && (this.#assets.eq(other.#assets));
	}

	/**
	 * Strictly greater than. Returns false if any asset is missing 
	 * @param {Value} other 
	 * @returns {boolean}
	 */
	gt(other) {
		return (this.#lovelace > other.#lovelace) && (this.#assets.gt(other.#assets));
	}

	/**
	 * Strictly >= 
	 * @param {Value} other 
	 * @returns {boolean}
	 */
	ge(other) {
		return (this.#lovelace >= other.#lovelace) && (this.#assets.ge(other.#assets));
	}

	/**
	 * Throws an error if any contained quantity is negative
	 * Used when building transactions because transactions can't contain negative values
	 * @returns {Value} - returns this
	 */
	assertAllPositive() {
		assert(this.#lovelace >= 0n);

		this.#assets.assertAllPositive();

		return this;
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		return {
			lovelace: this.#lovelace.toString(),
			assets: this.#assets.dump()
		};
	}

	/**
	 * Used when building script context
	 * @param {boolean} isInScriptContext
	 * @returns {MapData}
	 */
	_toUplcData(isInScriptContext = false) {
		let map = this.#assets._toUplcData();

		if (this.#lovelace != 0n || isInScriptContext) {
			let inner = map.map; 

			inner.unshift([
				new ByteArrayData([]),
				new MapData([
					[new ByteArrayData([]), new IntData(this.#lovelace)]
				]),
			]);

			// 'inner' is copy, so mutating won't change the original
			map = new MapData(inner);
		}

		return map;
	}

	/**
	 * Useful when deserializing inline datums
	 * @param {UplcData} data
	 * @returns {Value}
	 */
	static fromUplcData(data) {
		let sum = new Value();

		let outerMap = data.map;

		for (let [mphData, tokensData] of outerMap) {
			let mphBytes = mphData.bytes;

			let innerMap = tokensData.map;

			if (mphBytes.length == 0) {
				//lovelace
				assert(innerMap.length == 1 && innerMap[0][0].bytes.length == 0); 
				sum = sum.add(new Value(innerMap[0][1].int));
			} else {
				// other assets
				let mph = new MintingPolicyHash(mphBytes);

				for (let [tokenNameData, quantityData] of innerMap) {
					let tokenName = tokenNameData.bytes;
					let quantity = quantityData.int;

					sum = sum.add(Value.asset(mph, tokenName, quantity));
				}
			}
		}

		return sum;
	}

	/**
	 * @param {string | number[]} bytes 
	 * @returns {Value}
	 */
	static fromUplcCbor(bytes) {
		return Value.fromUplcData(UplcData.fromCbor(bytes));
	}
}