//@ts-check
// Helios data objects

import {
    assert,
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
	#data;

	/**
	 * @param {UplcData} data
	 */
	constructor(data) {
        super();
		this.#data = data;
	}

    /**
     * Name begins with underscore so it can never conflict with structure field names.
     * @returns {UplcData}
     */
	_getUplcData() {
		return this.#data;
	}

    /**
     * @returns {string}
     */
	toSchemaJson() {
		return this.#data.toSchemaJson();
	}
}

/**
 * @typedef {{
 *   new(...args: any[]): HeliosData;
 *   fromUplcCbor: (bytes: (string | number[])) => HeliosData,
 *   fromUplcData: (data: UplcData) => HeliosData
 * }} HeliosDataClass
 */

/**
 * Helios Int type
 */
export class Int extends HeliosData {
    /** 
     * @type {bigint} 
     */
    #value;

    /**
     * @param {number | bigint | string} rawValue
     */
    constructor(rawValue) {
        const value = BigInt(rawValue);

        if (value.toString() != rawValue.toString()) {
            throw new Error("not an integer");
        }

        super(new IntData(value));

        this.#value = value;
    }

    /**
     * @type {bigint}
     */
    get int() {
        return this.#value;
    }

    /**
     * @param {UplcData} data
     * @returns {Int}
     */
    static fromUplcData(data) {
        return new Int(data.int);
    }

    /**
     * @param {string | number[]} bytes
     * @returns {Int}
     */
    static fromUplcCbor(bytes) {
        return Int.fromUplcData(UplcData.fromCbor(bytes));
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
     * @param {boolean | string} rawValue 
     */
    constructor(rawValue) {
        const value = function() {
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
        }();

        super(new ConstrData(value ? 1 : 0, []));

        this.#value = value;
    }

    get bool() {
        return this.#value;
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
export class HeliosString extends HeliosData {
    /**
     * @type {string}
     */
    #value;

    /**
     * @param {string} value 
     */
    constructor(value) {
        super(new ByteArrayData(textToBytes(value)));

        this.#value = value;
    }

    get string() {
        return this.#value;
    }

    /**
     * @param {UplcData} data 
     * @returns {HeliosString}
     */
    static fromUplcData(data) {
        return new HeliosString(bytesToText(data.bytes));
    }

    /**
     * @param {string | number[]} bytes 
     * @returns {HeliosString}
     */
    static fromUplcCbor(bytes) {
        return HeliosString.fromUplcData(UplcData.fromCbor(bytes));
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
     * @param {string | number[]} rawValue 
     */
    constructor(rawValue) {
        const bytes = function() {
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
        }();

        super(new ByteArrayData(bytes));

        this.#bytes = bytes;
    }

    get bytes() {
        return this.#bytes;
    }

    get hex() {
        return bytesToHex(this.#bytes);
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
 * @param {HeliosDataClass} ItemClass
 * @returns {HeliosDataClass}
 */
export function List(ItemClass) {
    assert(!new.target, "List can't be called with new");
    assert(ItemClass.prototype instanceof HeliosData);

    const typeName = `[]${ItemClass.name}`;

    class List extends HeliosData {
        /** 
         * @type {HeliosData[]} 
         */
        #items;

        /**
         * @param {any[]} rawList 
         */
        constructor(rawList) {
            const list = rawList.map(item => {
                if (item instanceof ItemClass) {
                    return item;
                } else {
                    return new ItemClass(item);
                }
            });

            super(new ListData(list.map(item => item._getUplcData())));

            this.#items = list;
        }

        /**
         * Overload 'instanceof' operator
         * @param {any} other 
         * @returns {boolean}
         */
        static [Symbol.hasInstance](other) {
            return Object.getPrototypeOf(other).name == typeName;
        }

        /**
         * @type {HeliosData[]}
         */
        get items() {
            return this.#items;
        }

        /**
         * @param {UplcData} data 
         * @returns {List}
         */
        static fromUplcData(data) {
            return new List(data.list.map(d => ItemClass.fromUplcData(d)));
        }

        /**
         * @param {string | number[]} bytes 
         * @returns {List}
         */
        static fromUplcCbor(bytes) {
            return List.fromUplcData(UplcData.fromCbor(bytes));
        }
    }

    Object.defineProperty(List, "name", {
        value: typeName,
        writable: false
    });

    return List;
}

/**
 * @param {HeliosDataClass} KeyClass 
 * @param {HeliosDataClass} ValueClass
 * @returns {HeliosDataClass}
 */
export function HeliosMap(KeyClass, ValueClass) {
    assert(!new.target, "HeliosMap can't be called with new");
    assert(KeyClass.prototype instanceof HeliosData);
    assert(ValueClass.prototype instanceof HeliosData);
    
    const typeName = `Map[${KeyClass.name}]${ValueClass.name}`;

    class HeliosMap extends HeliosData {
        /**
         * @type {[HeliosData, HeliosData][]}
         */
        #pairs;

        /**
         * @param {...any} args
         * @returns {[any, any][]}
         */
        static cleanConstructorArgs(...args) {
            /** @type {[any, any][]} */
            let pairs = [];

            if (args.length == 1) {
                const arg = args[0];

                if (arg instanceof Map) {
                    return HeliosMap.cleanConstructorArgs(Array.from(arg.entries()));
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
            const rawPairs = HeliosMap.cleanConstructorArgs(...args);

            /**
             * @type {[HeliosData, HeliosData][]}
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

            super(new MapData(pairs.map(([key, value]) => [key._getUplcData(), value._getUplcData()])));

            this.#pairs = pairs;
        }

        /**
         * Overload 'instanceof' operator
         * @param {any} other 
         * @returns {boolean}
         */
        static [Symbol.hasInstance](other) {
            return Object.getPrototypeOf(other).name == typeName;
        }

        /**
         * @type {[HeliosData, HeliosData][]}
         */
        get pairs() {
            return this.#pairs;
        }

        /**
         * @param {UplcData} data 
         * @returns {HeliosData}
         */
        static fromUplcData(data) {
            return new HeliosMap(data.map.map(([kd, vd]) => [KeyClass.fromUplcData(kd), ValueClass.fromUplcData(vd)]));
        }

        /**
         * @param {string | number[]} bytes 
         * @returns {HeliosData}
         */
        static fromUplcCbor(bytes) {
            return HeliosMap.fromUplcData(UplcData.fromCbor(bytes));
        }
    }

    Object.defineProperty(List, "name", {
        value: typeName,
        writable: false
    });

    return HeliosMap;
}

/**
 * @param {HeliosDataClass} SomeClass
 * @returns {HeliosDataClass}
 */
export function Option(SomeClass) {
    assert(!new.target, "Option can't be called with new");
    assert(SomeClass.prototype instanceof HeliosData);

    const typeName = `Option[${SomeClass.name}]`;

    class Option extends HeliosData {
        /**
         * @type {?HeliosData}
         */
        #value;

        /** 
         * @param {?any} rawValue
         */
        constructor(rawValue = null) {
            const value = function() {
                if (rawValue == null) {
                    return null;
                } else if (!(rawValue instanceof SomeClass)) {
                    return new SomeClass(rawValue);
                } else {
                    return rawValue;
                }
            }();

            super(new ConstrData(value === null ? 1 : 0, value === null ? [] : [value._getUplcData()]));

            this.#value = value;
        }

        /**
         * Overload 'instanceof' operator
         * @param {any} other 
         * @returns {boolean}
         */
        static [Symbol.hasInstance](other) {
            return Object.getPrototypeOf(other).name == typeName;
        }

        /**
         * @type {?HeliosData}
         */
        get some() {
            return this.#value;
        }

        /**
         * @param {UplcData} data 
         * @returns {Option}
         */
        static fromUplcData(data) {
            if (data.index == 1) {
                assert(data.fields.length == 0);

                return new Option(null);
            } else if (data.index == 0) {
                assert(data.fields.length == 1);

                return new Option(SomeClass.fromUplcData(data.fields[0]))
            } else {
                throw new Error("unexpected option constr index");
            }
        }

        /**
         * @param {string | number[]} bytes
         * @returns {HeliosData}
         */
        static fromUplcCbor(bytes) {
            return Option.fromUplcData(UplcData.fromCbor(bytes));
        }
    }

    Object.defineProperty(List, "name", {
        value: typeName,
        writable: false
    });

    return Option;
}


/**
 * Base class of all hash-types
 * @package
 */
export class Hash extends HeliosData {
	/** @type {number[]} */
	#bytes;

	/**
	 * @param {number[]} bytes 
	 */
	constructor(bytes) {
		super(new ByteArrayData(bytes));
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
	 * @param {number[]} bytes 
	 */
	constructor(bytes) {
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

export class PubKeyHash extends Hash {
	/**
	 * @param {number[]} bytes 
	 */
	constructor(bytes) {
		assert(bytes.length == 28);
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
	 * @param {number[]} bytes 
	 */
	constructor(bytes) {
		assert(bytes.length == 28);
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
	 * @param {number[]} bytes 
	 */
	constructor(bytes) {
		assert(bytes.length == 28);
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
	 * @param {string | number[]} rawBytes 
	 */
	constructor(rawBytes) {
        const bytes = (typeof rawBytes == "string") ? hexToBytes(rawBytes): rawBytes;
		assert(bytes.length == 32);
		super(bytes);
	}

    /**
     * @returns {UplcData}
     */
    _getUplcData() {
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
	 * @returns {TxId}
	 */
	static dummy() {
		return new TxId((new Array(32)).fill(0));
	}
}

/**
 * Id of a Utxo
 */
export class TxOutputId extends HeliosData {
    /** @type {TxId} */
    #txId;

    /** @type {Int} */
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
        const utxoIdx = (rawUtxoIdx instanceof Int) ? rawUtxoIdx : new Int(rawUtxoIdx);

        super(new ConstrData(0, [txId._getUplcData(), utxoIdx._getUplcData()]));

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
     * @param {UplcData} data
     * @returns {HeliosData}
     */
    static fromUplcData(data) {
        assert(data.index == 0);
        assert(data.fields.length == 2);

        return new TxOutputId(TxId.fromUplcData(data.fields[0]), Int.fromUplcData(data.fields[1]));
    }

    /**
     * @param {string | number[]} bytes 
     * @returns {HeliosData}
     */
    static fromUplcCbor(bytes) {
        return TxOutputId.fromUplcData(UplcData.fromCbor(bytes));
    }
}