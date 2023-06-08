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

/**
 * @template T
 * @typedef {import("./utils.js").ExpandAlias<T>} ExpandAlias<T>
 */

/**
 * @typedef {import("./utils.js").hexstring} hexstring
 */

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

	/**
	 * Defaults to cbor encoding of uplc data structure.
	 * @returns {number[]}
	 */
	toCbor() {
		return this._toUplcData().toCbor();
	}

	/**
	 * Most HeliosData classes are builtin
	 * @returns {boolean}
	 */
	static isBuiltin() {
		return true;
	}
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
     * @type {bigint} 
     */
    #value;

    /**
     * @package
     * @param {HIntProps} rawValue
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
     * @param {ExpandAlias<HIntProps>} rawValue
     */
    constructor(rawValue) {
        super();

        this.#value = HInt.cleanConstructorArg(rawValue);
    }

	/**
	 * @returns {string}
	 */
	toString() {
		return this.#value.toString();
	}

	/**
	 * @param {HInt | HIntProps} props 
	 * @returns {HInt}
	 */
	static fromProps(props) {
		return props instanceof HInt ? props : new HInt(props);
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

	/**
	 * @param {number[]} bytes 
	 * @returns {HInt}
	 */
	static fromCbor(bytes) {
		return new HInt(CborData.decodeInteger(bytes));
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return  CborData.encodeInteger(this.value);
	}

	/**
	 * @returns {string}
	 */
	dump() {
		return this.#value.toString();
	}

	/**
	 * @param {HInt | HIntProps} other 
	 * @returns {boolean}
	 */
	eq(other) {
		return this.#value == HInt.fromProps(other).#value
	}

	/**
	 * @param {HInt | HIntProps} other 
	 * @returns {boolean}
	 */
	neq(other) {
		return this.#value != HInt.fromProps(other).value;
	}

	/**
	 * @param {HInt | HIntProps} other 
	 * @returns {boolean}
	 */
	ge(other) {
		return this.#value >= HInt.fromProps(other).#value;
	}

	/**
	 * @param {HInt | HIntProps} other 
	 * @returns {boolean}
	 */
	gt(other) {
		return this.#value > HInt.fromProps(other).#value;
	}

	/**
	 * @param {HInt | HIntProps} other 
	 * @returns {boolean}
	 */
	le(other) {
		return this.#value <= HInt.fromProps(other).#value;
	}

	/**
	 * @param {HInt | HIntProps} other 
	 * @returns {boolean}
	 */
	lt(other) {
		return this.#value < HInt.fromProps(other).#value;
	}

	/**
	 * @param {HInt| HIntProps} other 
	 * @returns {HInt}
	 */
	add(other) {
		return new HInt(this.#value + HInt.fromProps(other).#value);
	}

	/**
	 * @param {HInt | HIntProps} other 
	 * @returns {HInt}
	 */
	sub(other) {
		return new HInt(this.#value - HInt.fromProps(other).#value);
	}

	/**
	 * @param {HInt| HIntProps} other 
	 * @returns {HInt}
	 */
	mul(other) {
		return new HInt(this.#value * HInt.fromProps(other).#value);
	}
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
	static cleanConstructorArg(props) {
        if (props instanceof Date) {
            return BigInt(props.getTime());
		} else if (typeof props == "string") {
			return BigInt(Date.parse(props));
        } else {
            const value = BigInt(props);

            if (value.toString() != props.toString()) {
                throw new Error("not a valid integer");
            } else {
                return value;
            }
        }
    }

    /**
     * @param {ExpandAlias<TimeProps>} props
     */
    constructor(props) {
        super(Time.cleanConstructorArg(props));
    }

	/**
	 * @param {Time | TimeProps} props 
	 * @returns {Time}
	 */
	static fromProps(props) {
		return props instanceof Time ? props : new Time(props);
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
 * @typedef {HIntProps} DurationProps
 */

/**
 * Difference between two time values in milliseconds.
 */
export class Duration extends HInt {
	/**
	 * @param {Duration | DurationProps} props 
	 */
	static fromProps(props) {
		return props instanceof Duration ? props : new Duration(props);
	}

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
 * @typedef {boolean | string} BoolProps
 */

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
     * @param {BoolProps} props 
     * @returns {boolean}
     */
    static cleanConstructorArg(props) {
        if (typeof props == "string") {
            if (props == "false") {
                return false;
            } else if (props == "true") {
                return true;
            } else {
                throw new Error("not a valid string representation of a Bool");
            }
        } else if (typeof props == "boolean") {
            return props;
        } else {
            throw new Error("can't convert to boolean");
        }
    }

    /**
     * @param {ExpandAlias<BoolProps>} props 
     */
    constructor(props) {
        super();

        this.#value = Bool.cleanConstructorArg(props);
    }

	/**
	 * @param {Bool | BoolProps} props 
	 * @returns {Bool}
	 */
	static fromProps(props) {
		return props instanceof Bool ? props : new Bool(props);
	}

	/**
	 * @type {boolean}
	 */
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
 * @typedef {string} HStringProps
 */

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
     * @param {ExpandAlias<HStringProps>} props 
     */
    constructor(props) {
        super();

        this.#value = props;
    }

	/**
	 * @param {HString | HStringProps} props
	 * @returns {HString}
	 */
	static fromProps(props) {
		return props instanceof HString ? props : new HString(props);
	}

	/**
	 * @type {string}
	 */
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
 * @typedef {hexstring | number[]} ByteArrayProps
 */

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
     * @param {ByteArrayProps} props 
     */
    static cleanConstructorArg(props) {
        if (Array.isArray(props)) {
            return props;
        } else if (typeof props == "string") {
            if (props.startsWith("#")) {
                props = props.slice(1);
            }

            return hexToBytes(props);
        } else {
            throw new Error("unexpected bytes type");
        }
    }

    /**
     * @param {ExpandAlias<ByteArrayProps>} props 
     */
    constructor(props) {
        super();

        this.#bytes = ByteArray.cleanConstructorArg(props);
    }

	/**
	 * @param {ByteArray | ByteArrayProps} props 
	 * @returns {ByteArray}
	 */
	static fromProps(props) {
		return props instanceof ByteArray ? props : new ByteArray(props);
	}

    /**
     * @type {number[]}
     */
    get bytes() {
        return this.#bytes;
    }

    /**
     * @type {hexstring}
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
	 * @returns {number[]}
	 */
	toCbor() {
		return CborData.encodeBytes(this.#bytes);
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

	/**
	 * @param {number[]} bytes 
	 * @returns {ByteArray}
	 */
	static fromCbor(bytes) {
		return new ByteArray(CborData.decodeBytes(bytes));
	}

	/**
	 * @param {ByteArray | ByteArrayProps} other 
	 * @returns {boolean}
	 */
	eq(other) {
		return eq(this.#bytes, ByteArray.fromProps(other).#bytes);
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
 * @typedef {hexstring | number[]} HashProps
 */

/**
 * Base class of all hash-types
 * @package
 */
export class Hash extends HeliosData {
	/** @type {number[]} */
	#bytes;

	/**
	 * @param {HashProps} props 
	 * @returns {number[]}
	 */
	static cleanConstructorArg(props) {
		if (typeof props == "string") {
			return hexToBytes(props);
		} else {
			return props;
		}
	}

	/**
	 * @param {ExpandAlias<HashProps>} props 
	 */
	constructor(props) {
		super();
		this.#bytes = Hash.cleanConstructorArg(props);
	}

	/**
	 * @param {Hash | HashProps} props 
	 * @returns {Hash}
	 */
	static fromProps(props) {
		return props instanceof Hash ? props : new Hash(props);
	}

	/**
	 * @returns {number[]}
	 */
	get bytes() {
		return this.#bytes;
	}

	/**
	 * @returns {hexstring}
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
	 * @param {hexstring} str 
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
	 * @returns {boolean}
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

/**
 * @typedef {HashProps} DatumHashProps
 */

export class DatumHash extends Hash {
	/**
	 * @param {ExpandAlias<DatumHashProps>} props
	 */
	constructor(props) {
		const bytes = Hash.cleanConstructorArg(props);

		assert(bytes.length == 32);
		super(bytes);
	}

	/**
	 * @param {DatumHash | DatumHashProps} props 
	 */
	static fromProps(props) {
		return props instanceof DatumHash ? props : new DatumHash(props);
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

/**
 * @typedef {hexstring | number[]} PubKeyProps
 */

export class PubKey extends HeliosData {
	#bytes;

	/**
	 * @param {ExpandAlias<PubKeyProps>} props 
	 */
	constructor(props) {
		super();
		const bytes = (typeof props == "string") ? hexToBytes(props) : props;

		assert(bytes.length == 32, `expected 32 for PubKey, got ${bytes.length}`);
		this.#bytes = bytes;
	}

	/**
	 * @param {PubKey | PubKeyProps} props 
	 * @returns {PubKey}
	 */
	static fromProps(props) {
		return props instanceof PubKey ? props : new PubKey(props);
	}

	/**
	 * @returns {PubKey}
	 */
	static dummy() {
		return new PubKey((new Array(32)).fill(0));
	}

	/**
	 * @type {number[]}
	 */
	get bytes() {
		return this.#bytes;
	}

	/**
	 * @type {hexstring}
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
	 * @param {number[]} bytes 
	 * @returns {PubKey}
	 */
	static fromCbor(bytes) {
		return new PubKey(CborData.decodeBytes(bytes));
	}

	/**
	 * @returns {boolean}
	 */
	isDummy() {
		return this.#bytes.every(b => b == 0);
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
	 * @returns {PubKeyHash}
	 */
	hash() {
		return new PubKeyHash(Crypto.blake2b(this.#bytes, 28));
	}

	/**
	 * @returns {string}
	 */
	dump() {
		return this.hex;
	}
}

/**
 * @typedef {HashProps} PubKeyHashProps
 */

export class PubKeyHash extends Hash {
	
	/**
	 * @param {ExpandAlias<PubKeyHashProps>} props 
	 */
	constructor(props) {
		const bytes = Hash.cleanConstructorArg(props);

		assert(bytes.length == 28, `expected 28 bytes for PubKeyHash, got ${bytes.length}`);
		super(bytes);
	}

	/**
	 * @param {PubKeyHash | PubKeyHashProps} props 
	 * @returns {PubKeyHash}
	 */
	static fromProps(props) {
		return props instanceof PubKeyHash ? props : new PubKeyHash(props);
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

/**
 * @typedef {HashProps} ScriptHashProps
 */

export class ScriptHash extends Hash {
	/**
	 * @param {ExpandAlias<ScriptHashProps>} rawValue
	 */
	constructor(rawValue) {
		const bytes = Hash.cleanConstructorArg(rawValue);

		assert(bytes.length == 28, `expected 28 bytes for ScriptHash, got ${bytes.length}`);
		super(bytes);
	}

	/**
	 * @param {ScriptHash | ScriptHashProps} props 
	 * @returns {ScriptHash}
	 */
	static fromProps(props) {
		return props instanceof ScriptHash ? props : new ScriptHash(props);
	}
}

/**
 * @typedef {HashProps} MintingPolicyHashProps
 */

export class MintingPolicyHash extends ScriptHash {
	/**
	 * @param {MintingPolicyHash | MintingPolicyHashProps} props 
	 * @returns {MintingPolicyHash}
	 */
	static fromProps(props) {
		return props instanceof MintingPolicyHash ? props : new MintingPolicyHash(props);
	}

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

/**
 * @typedef {HashProps} StakeKeyHashProps
 */

export class StakeKeyHash extends Hash {
	/**
	 * @param {ExpandAlias<StakeKeyHashProps>} props
	 */
	constructor(props) {
		const bytes = Hash.cleanConstructorArg(props);
		
		assert(bytes.length == 28, `expected 28 bytes for StakeKeyHash, got ${bytes.length}`);
		super(bytes);
	}

	/**
	 * @param {StakeKeyHash | StakeKeyHashProps} props 
	 */
	static fromProps(props) {
		return props instanceof StakeKeyHash ? props : new StakeKeyHash(props);
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

/**
 * @typedef {HashProps} StakingValidatorHashProps
 */

export class StakingValidatorHash extends ScriptHash {
	/**
	 * @param {StakingValidatorHash | StakingValidatorHashProps} props 
	 * @returns {StakingValidatorHash}
	 */
	static fromProps(props) {
		return props instanceof StakingValidatorHash ? props : new StakingValidatorHash(props);
	}

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

/**
 * @typedef {HashProps} ValidatorHashProps
 */

export class ValidatorHash extends ScriptHash {
	/**
	 * @param {ValidatorHash | ValidatorHashProps} props 
	 * @returns {ValidatorHash}
	 */
	static fromProps(props) {
		return props instanceof ValidatorHash ? props : new ValidatorHash(props);
	}

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
 * @typedef {HashProps} TxIdProps
 */

/**
 * Hash of a transaction
 */
export class TxId extends Hash {
	/**
	 * @param {ExpandAlias<TxIdProps>} props 
	 */
	constructor(props) {
        const bytes = Hash.cleanConstructorArg(props);

		assert(bytes.length == 32, `expected 32 bytes for TxId, got ${bytes.length}`);
		super(bytes);
	}

	/**
	 * @param {TxId | TxIdProps} props 
	 * @returns {TxId}
	 */
	static fromProps(props) {
		return props instanceof TxId ? props : new TxId(props);
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
	 * @param {hexstring} str 
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
    /** @type {TxId} */
    #txId;

    /** @type {HInt} */
    #utxoIdx;

    /**
     * @param  {TxOutputIdProps} props
     * @returns {[TxId | TxIdProps, HInt | HIntProps]}
     */
    static cleanConstructorArgs(props) {
        if (typeof props == "string") {
			const parts = props.split("#");

			assert(parts.length == 2);

			return [parts[0], parseInt(parts[1])];
        } else if (Array.isArray(props) && props.length == 2) {
            return [props[0], props[1]];
        } else if (typeof props == "object") {
			return [assertDefined(props.txId), assertDefined(props.utxoId)];
		} else {
            throw new Error("unexpected number of args");
        }
    }

    /**
     * @param {ExpandAlias<TxOutputIdProps>} props
     */
    constructor(props) {
        const [rawTxId, rawUtxoIdx] = TxOutputId.cleanConstructorArgs(props);

        super();

        this.#txId = TxId.fromProps(rawTxId);
        this.#utxoIdx = HInt.fromProps(rawUtxoIdx);
    }

	/**
	 * @param {TxOutputId | TxOutputIdProps} props 
	 * @returns {TxOutputId}
	 */
	static fromProps(props) {
		return props instanceof TxOutputId ? props : new TxOutputId(props);
	}

	/**
	 * @type {TxId}
	 */
    get txId() {
        return this.#txId;
    }

	/**
	 * @type {number}
	 */
    get utxoIdx() {
        return Number(this.#utxoIdx.value);
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
        assert(data.index == 0, `TxOutputId.fromUplcData: expected constructor index 0, got ${data.index}`);
        assert(data.fields.length == 2, "TxOutputId.fromUplcData: expected 2 fields");

        return new TxOutputId([TxId.fromUplcData(data.fields[0]), HInt.fromUplcData(data.fields[1])]);
    }

    /**
     * @param {string | number[]} bytes 
     * @returns {TxOutputId}
     */
    static fromUplcCbor(bytes) {
        return TxOutputId.fromUplcData(UplcData.fromCbor(bytes));
    }

	/**
	 * @returns {string}
	 */
	toString() {
		return `${this.#txId.hex}#${this.#utxoIdx.value.toString()}`;
	}
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
	/** @type {number[]} */
	#bytes;

    /**
	 * @package
	 * @param {AddressProps} props
	 * @returns {number[]}
	 */
    static cleanConstructorArg(props) {
        if (typeof props == "string") {
            if (props.startsWith("addr")) {
                return Address.fromBech32(props).bytes;
            } else {
                if (props.startsWith("#")) {
                    props = props.slice(1);
                }

                return hexToBytes(props);
            }
        } else {
            return props;
        }
    }

	/**
	 * @param {ExpandAlias<AddressProps>} props
	 */
	constructor(props) {
		super();
		this.#bytes = Address.cleanConstructorArg(props);

        assert(this.#bytes.length == 29 || this.#bytes.length == 57, `expected 29 or 57 bytes for Address, got ${this.#bytes.length}`);
	}

	/**
	 * @param {Address | AddressProps} props 
	 * @returns {Address}
	 */
	static fromProps(props) {
		return props instanceof Address ? props : new Address(props);
	}

	/**
	 * @type {number[]}
	 */
	get bytes() {
		return this.#bytes.slice();
	}

	/**
	 * @returns {number[]}
	 */
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
	 * @param {bech32string} str
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
	 * @param {hexstring} hex
	 * @returns {Address}
	 */
	static fromHex(hex) {
		return new Address(hexToBytes(hex));
	}

	/**
	 * Returns the raw Address bytes as a hex encoded string
	 * @returns {hexstring}
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
	 * @returns {bech32string}
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
	 * @type {null | PubKeyHash}
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
	 * @type {null | ValidatorHash}
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
	 * @type {null | StakeKeyHash | StakingValidatorHash}
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
	 * @type {MintingPolicyHash}
	 */
	#mph;

	/**
	 * @type {ByteArray}
	 */
	#tokenName;

	/**
	 * @param {AssetClassProps} props
	 * @returns {[MintingPolicyHash | MintingPolicyHashProps, ByteArray | ByteArrayProps]}
	 */
	static cleanConstructorArgs(props) {
		if (typeof props == "string") {
			const fields = props.split(".")

			assert(fields.length == 2, "expected '.' in hex encoded AssetClass");

			return [fields[0], hexToBytes(fields[1])];
		} else if (Array.isArray(props) && props.length == 2) {
			return [props[0], props[1]];
		} else if (typeof props == "object") {
			return [assertDefined(props.mph), assertDefined(props.tokenName)];
		} else {
			throw new Error("unexpected number of AssetClass args");
		}
	}

	/**
	 * 
	 * @param {ExpandAlias<AssetClassProps>} props
	 */
	constructor(props) {
		super();
		const [rawMph, rawTokenName] = AssetClass.cleanConstructorArgs(props);

		this.#mph = MintingPolicyHash.fromProps(rawMph);
		this.#tokenName = ByteArray.fromProps(rawTokenName);
	}

	/**
	 * @param {AssetClass | AssetClassProps} props 
	 * @returns {AssetClass}
	 */
	static fromProps(props) {
		return props instanceof AssetClass ? props : new AssetClass(props);
	}

	/**
	 * @type {MintingPolicyHash}
	 */
	get mintingPolicyHash() {
		return this.#mph;
	}

	/**
	 * @type {ByteArray}
	 */
	get tokenName() {
		return this.#tokenName;
	}

	/**
	 * Used when generating script contexts for running programs
	 * @returns {ConstrData}
	 */
	_toUplcData() {
		return new ConstrData(0, [
			this.#mph._toUplcData(),
			this.#tokenName._toUplcData()
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
		const tokenName = ByteArray.fromUplcData(data.fields[1]);

		return new AssetClass([mph, tokenName]);
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return CborData.encodeConstr(0, [
			this.#mph.toCbor(),
			this.#tokenName.toCbor()
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
		 * @type {ByteArray | null}
		 */
		let tokenName = null;

		const tag = CborData.decodeConstr(bytes, (i, fieldBytes) => {
			switch (i) {
				case 0:
					mph = MintingPolicyHash.fromCbor(fieldBytes);
					break;
				case 1:
					tokenName = ByteArray.fromCbor(fieldBytes);
					break;
				default:
					throw new Error("unexpected field");
			} 
		});

		assert(tag == 0);

		if (mph == null || tokenName == null) {
			throw new Error("insufficient fields");
		} else {
			return new AssetClass([mph, tokenName]);
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
		return new AssetClass(["", ""]);
	}
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
	 * @type {[MintingPolicyHash, [ByteArray, HInt][]][]} 
	 */
	#assets;

	/**
	 * Also normalizes the assets
	 * @param {AssetsProps} props
	 */
	constructor(props = []) {
		super();

		this.#assets = props.map((outerPair) => {
			if (Array.isArray(outerPair[1])) {
				const mph = MintingPolicyHash.fromProps(outerPair[0]);

				/**
				 * @type {[MintingPolicyHash, [ByteArray, HInt][]]}
				 */
				const mapped = [
					mph,
					outerPair[1].map((innerPair) => [ByteArray.fromProps(innerPair[0]), HInt.fromProps(innerPair[1])])
				];

				return mapped;
			} else {
				const assetClass = AssetClass.fromProps(outerPair[0]);
				const qty = HInt.fromProps(outerPair[1]);

				/**
				 * @type {[MintingPolicyHash, [ByteArray, HInt][]]}
				 */
				const mapped = [
					assetClass.mintingPolicyHash,
					[[assetClass.tokenName, qty]]
				];

				return mapped;
			}
		});

		this.normalize();
	}

	/**
	 * @param {Assets | AssetsProps} props 
	 * @returns {Assets}
	 */
	static fromProps(props) {
		return props instanceof Assets ? props : new Assets(props);
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
	 * @returns {[ByteArray, HInt][]}
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
	 * @param {MintingPolicyHash | MintingPolicyHashProps} mph
	 * @param {ByteArray | ByteArrayProps} tokenName 
	 * @returns {boolean}
	 */
	has(mph, tokenName) {
		const mph_ = MintingPolicyHash.fromProps(mph);
		const tokenName_ = ByteArray.fromProps(tokenName);

		const inner = this.#assets.find(asset => mph_.eq(asset[0]));

		if (inner !== undefined) {
			return inner[1].findIndex(pair => pair[0].eq(tokenName_)) != -1;
		} else {
			return false;
		}
	}

	/**
	 * @param {MintingPolicyHash | MintingPolicyHashProps} mph
	 * @param {ByteArray | ByteArrayProps} tokenName 
	 * @returns {bigint}
	 */
	get(mph, tokenName) {
		const mph_ = MintingPolicyHash.fromProps(mph);
		const tokenName_ = ByteArray.fromProps(tokenName);

		const inner = this.#assets.find(asset => mph_.eq(asset[0]));

		if (inner !== undefined) {
			const token = inner[1].find(pair => pair[0].eq(tokenName_));

			if (token !== undefined) {
				return token[1].value;
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
			asset[1] = asset[1].filter(token => !token[1].eq(0n));
		}

		this.#assets = this.#assets.filter(asset => asset[1].length != 0);
	}

	/**
	 * Removes zeros and merges duplicates
	 * In-place algorithm
	 * Keeps the same order as much as possible
	 */
	normalize() {
		/**
		 * @type {Map<string, Map<string, bigint>>}
		 */
		const assets = new Map();

		for (let [mph, tokens] of this.#assets) {
			let outerPrev = assets.get(mph.hex);

			if (!outerPrev) {
				outerPrev = new Map();
			} 

			for (let [tokenName, qty] of tokens) {
				let innerPrev = outerPrev.get(tokenName.hex);

				if (!innerPrev) {
					innerPrev = 0n;
				}

				innerPrev += qty.value;

				outerPrev.set(tokenName.hex, innerPrev);
			}

			assets.set(mph.hex, outerPrev);
		}

		const entries = Array.from(assets.entries());

		this.#assets = entries.map(([rawMph, rawTokens]) => {
			const tokens = Array.from(rawTokens.entries());

			return [MintingPolicyHash.fromProps(rawMph), tokens.map(([rawTokenName, rawQty]) => {
				return [ByteArray.fromProps(rawTokenName), HInt.fromProps(rawQty)];
			})];
		});
	}

	/**
	 * Mutates 'this'
	 * @param {MintingPolicyHash | MintingPolicyHashProps} mph
	 * @param {ByteArray | ByteArrayProps} tokenName 
	 * @param {HInt | HIntProps} qty
	 */
	addComponent(mph, tokenName, qty) {
		const mph_ = MintingPolicyHash.fromProps(mph);
		const tokenName_ = ByteArray.fromProps(tokenName);
		const qty_ = HInt.fromProps(qty);

		if (qty_.eq(0n)) {
			return;
		}

		const inner = this.#assets.find(asset => mph_.eq(asset[0]));

		if (inner === undefined) {
			this.#assets.push([mph_, [[tokenName_, qty_]]]);
		} else {
			const token = inner[1].find(pair => pair[0].eq(tokenName_));

			if (token === undefined) {
				inner[1].push([tokenName_, qty_]);
			} else {
				token[1] = token[1].add(qty_);
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
				res.addComponent(mph, tokenName, new HInt(op(quantity.value, 0n)));
			}
		}

		for (let [mph, tokens] of other.#assets) {
			for (let [tokenName, quantity] of tokens) {
				res.addComponent(mph, tokenName, new HInt(op(0n, quantity.value)));
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
	 * @param {HInt | HIntProps} scalar 
	 * @returns {Assets}
	 */
	mul(scalar) {
		const s = HInt.fromProps(scalar);

		return new Assets(this.#assets.map(([mph, tokens]) => {
			/**
			 * @type {[MintingPolicyHash, [ByteArray, HInt][]]}
			 */
			const mapped = [mph, tokens.map(([token, qty]) => [token, qty.mul(s)])]

			return mapped;
		}))
	}

	/**
	 * Mutates 'this'
	 * Throws error if mph is already contained in 'this'
	 * @param {MintingPolicyHash | MintingPolicyHashProps} mph
	 * @param {[ByteArray | ByteArrayProps, HInt | HIntProps][]} tokens
	 */
	addTokens(mph, tokens) {
		const mph_ = MintingPolicyHash.fromProps(mph);

		for (let asset of this.#assets) {
			if (asset[0].eq(mph_)) {
				throw new Error(`MultiAsset already contains ${mph_.hex}`);
			}
		}

		this.#assets.push([mph_, tokens.map(([tokenName, qty]) => [ByteArray.fromProps(tokenName), HInt.fromProps(qty)])]);

		// sort immediately
		this.sort();
	}

	/**
	 * @param {MintingPolicyHash | MintingPolicyHashProps} mph
	 * @returns {ByteArray[]}
	 */
	getTokenNames(mph) {
		const mph_ = MintingPolicyHash.fromProps(mph);

		for (let [otherMph, tokens] of this.#assets) {
			if (otherMph.eq(mph_)) {
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
				if (token[1].neq(other.get(asset[0], token[0]))) {
					return false;
				}
			}
		}

		for (let asset of other.#assets) {
			for (let token of asset[1]) {
				if (token[1].neq(this.get(asset[0], token[0]))) {
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
				if (token[1].le(other.get(asset[0], token[0]))) {
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
				if (token[1].lt(other.get(asset[0], token[0]))) {
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
				if (pair[1].lt(0n)) {
					return false;
				} else if (pair[1].eq(0n)) {
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
						innerPair => [innerPair[0].toCbor(), innerPair[1].toCbor()]
					))];
				}
			)
		);
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
			 * @type {[ByteArray, HInt][]}
			 */
			let innerMap = [];
			
			CborData.decodeMap(pairBytes, (_, innerPairBytes) => {
				innerMap.push([
					ByteArray.fromCbor(innerPairBytes),
					HInt.fromCbor(innerPairBytes)
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
				innerObj[tokenName.hex] = quantity.toString();
			}

			obj[mph.hex] = innerObj;
		}

		return obj;
	}

	/**
	 * Used when generating script contexts for running programs
	 * @returns {MapData}
	 */
	_toUplcData() {
		/** @type {[UplcData, UplcData][]} */
		const pairs = [];

		for (let asset of this.#assets) {
			/** @type {[UplcData, UplcData][]} */
			const innerPairs = [];

			for (let token of asset[1]) {
				innerPairs.push([
					token[0]._toUplcData(),
					token[1]._toUplcData()
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
	/** @type {HInt} */
	#lovelace;

	/** @type {Assets} */
	#assets;
	
	/**
	 * 
	 * @param {ValueProps} props 
	 * @param {null | Assets | AssetsProps} maybeAssets 
	 * @returns {[HInt | HIntProps, Assets | AssetsProps]}
	 */
	static cleanConstructorArgs(props, maybeAssets) {
		if (Array.isArray(props)) {
			assert(props.length == 2, "expected two entries for AssetsProps");

			if (maybeAssets) {
				throw new Error("can't combine assets arg with ValueProps that also contains assets");
			}

			return [props[0], props[1]];
		} else if (props instanceof HInt) {
			return [props, maybeAssets ? maybeAssets : new Assets()];
		} else if (typeof props == "object") {
			if (maybeAssets) {
				throw new Error("can't combine assets arg with ValueProps that also contains assets");
			}

			return [props.lovelace, props.assets ?? new Assets()];
		} else {
			return [props, maybeAssets ? maybeAssets : new Assets()];
		}
	}

	/**
	 * @param {ValueProps} props 
	 * @param {null | Assets | AssetsProps} assets 
	 */
	constructor(props = 0n, assets = null) {
		super();

		const [rawLovelace, rawAssets] = Value.cleanConstructorArgs(props, assets);

		this.#lovelace = HInt.fromProps(rawLovelace);
		this.#assets = Assets.fromProps(rawAssets);
	}

	/**
	 * @param {ValueProps | Value} props 
	 * @returns {Value}
	 */
	static fromProps(props) {
		if (props instanceof Value) {
			return props;
		} else {
			return new Value(props);
		}
	}

	/**
	 * @param {MintingPolicyHash | MintingPolicyHashProps} mph 
	 * @param {ByteArray | ByteArrayProps} tokenName 
	 * @param {HInt | HIntProps} qty 
	 * @returns {Value}
	 */
	static asset(mph, tokenName, qty) {
		const mph_ = MintingPolicyHash.fromProps(mph);
		const tokenName_ = ByteArray.fromProps(tokenName);
		const qty_ = HInt.fromProps(qty);

		return new Value({
			lovelace: 0n, 
			assets: new Assets([
				[mph_, [
					[tokenName_, qty_]
				]]
			])
		});
	}

	/**
	 * @type {Assets}
	 */
	get assets() {
		return this.#assets;
	}

	/**
	 * @type {bigint}
	 */
	get lovelace() {
		return this.#lovelace.value;
	}

	/**
	 * Setter for lovelace
	 * Note: mutation is handy when balancing transactions
	 * @param {HInt | HIntProps} lovelace
	 */
	setLovelace(lovelace) {
		this.#lovelace = HInt.fromProps(lovelace);
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		if (this.#assets.isZero()) {
			return this.#lovelace.toCbor()
		} else {
			return CborData.encodeTuple([
				this.#lovelace.toCbor(),
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
						mv.#lovelace = HInt.fromCbor(fieldBytes);
						break;
					case 1:
						mv.#assets = Assets.fromCbor(fieldBytes);
						break;
					default:
						throw new Error("unrecognized field");
				}
			});
		} else {
			mv.#lovelace = HInt.fromCbor(bytes);
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
		return new Value({
			lovelace: this.#lovelace.add(other.#lovelace), 
			assets: this.#assets.add(other.#assets)
		});
	}

	/**
	 * @param {Value} other 
	 * @returns {Value}
	 */
	sub(other) {
		return new Value({
			lovelace: this.#lovelace.sub(other.#lovelace), 
			assets: this.#assets.sub(other.#assets)
		});
	}

	/**
	 * @param {HInt | HIntProps} scalar 
	 * @returns {Value}
	 */
	mul(scalar) {
		return new Value({
			lovelace: this.#lovelace.mul(scalar), 
			assets: this.#assets.mul(scalar)
		})
	}

	/**
	 * @param {Value} other 
	 * @returns {boolean}
	 */
	eq(other) {
		return this.#lovelace.eq(other.#lovelace) && (this.#assets.eq(other.#assets));
	}

	/**
	 * Strictly greater than. Returns false if any asset is missing 
	 * @param {Value} other 
	 * @returns {boolean}
	 */
	gt(other) {
		return this.#lovelace.gt(other.#lovelace) && (this.#assets.gt(other.#assets));
	}

	/**
	 * Strictly >= 
	 * @param {Value} other 
	 * @returns {boolean}
	 */
	ge(other) {
		return this.#lovelace.ge(other.#lovelace) && (this.#assets.ge(other.#assets));
	}

	/**
	 * Throws an error if any contained quantity is negative
	 * Used when building transactions because transactions can't contain negative values
	 * @returns {Value} - returns this
	 */
	assertAllPositive() {
		assert(this.#lovelace.ge(0n));

		this.#assets.assertAllPositive();

		return this;
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		return {
			lovelace: this.#lovelace.dump(),
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

		if (this.#lovelace.neq(0n) || isInScriptContext) {
			const inner = map.map; 

			inner.unshift([
				new ByteArrayData([]),
				new MapData([
					[new ByteArrayData([]), this.#lovelace._toUplcData()]
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
				sum = sum.add(new Value({lovelace: innerMap[0][1].int}));
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