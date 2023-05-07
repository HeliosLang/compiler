//@ts-check
// Native scripts

import {
    assert,
    hexToBytes
} from "./utils.js"

import {
    Crypto
} from "./crypto.js";

import {
    CborData
} from "./cbor.js"

import { 
    MintingPolicyHash,
    PubKeyHash,
    ValidatorHash
} from "./helios-data.js";

/**
 * @package
 */
export class NativeContext {
    #firstValidSlot;
    #lastValidSlot;
    #keys;

    /**
     * 
     * @param {bigint | null} firstValidSlot 
     * @param {bigint | null} lastValidSlot 
     * @param {PubKeyHash[]} keys
     */
    constructor(firstValidSlot, lastValidSlot, keys) {
        this.#firstValidSlot = firstValidSlot;
        this.#lastValidSlot = lastValidSlot;
        this.#keys = keys;
    }

    /**
     * Used by NativeAfter
     * @param {bigint} slot 
     * @returns {boolean}
     */
    isAfter(slot) {
        if (this.#firstValidSlot !== null) {
            return this.#firstValidSlot >= slot;
        } else {
            console.error("Warning: tx validity time range start not set but checked in native script");
            return false;
        }
    }

    /**
     * 
     * @param {bigint} slot 
     * @returns {boolean}
     */
    isBefore(slot) {
        if (this.#lastValidSlot !== null) {
            return this.#lastValidSlot < slot;
        } else {
            console.error("Warning: tx validity time range end not set but checked in native script");
            return false;
        }
    }

    /**
     * 
     * @param {PubKeyHash} key
     * @returns {boolean}
     */
    isSignedBy(key) {
        return this.#keys.some((k => k.eq(key)));
    }
}

export class NativeScript extends CborData {
    #type;

    /**
     * @param {number} type 
     */
    constructor(type) {
        super();
        this.#type = type;
    }

    /**
     * @returns {number[]}
     */
    typeToCbor() {
        return CborData.encodeInteger(BigInt(this.#type));
    }

    /**
     * @param {string | number[]} raw 
     * @returns {NativeScript}
     */
    static fromCbor(raw) {
        const bytes = (typeof raw == "string") ? hexToBytes(raw) : raw;

        if (bytes[0] == 0) {
            bytes.shift();
        }

        let type = -1;

        /**
         * @type {bigint}
         */
        let nOrSlot = -1n;

        /**
         * @type {NativeScript | null}
         */
        let script = null;

        CborData.decodeTuple(bytes, (i, fieldBytes) => {
            if (i == 0) {
                type = Number(CborData.decodeInteger(fieldBytes))
            } else {
                switch(type) {
                    case 0:
                        assert(i == 1);

                        script = new NativeSig(PubKeyHash.fromCbor(fieldBytes));
                        
                        break;
                    case 1:
                    case 2: {
                            assert(i == 1);

                            /**
                             * @type {NativeScript[]}
                             */
                            const children = [];

                            CborData.decodeList(fieldBytes, (_, listBytes) => {
                                children.push(NativeScript.fromCbor(listBytes))
                            });

                            switch (type) {
                                case 1:
                                    script = new NativeAll(children);
                                    break;
                                case 2:
                                    script = new NativeAny(children);
                                    break;
                                default:
                                    throw new Error("unexpected");
                            }
                        }

                        break;
                    case 3:
                        if (i == 1) {
                            nOrSlot = CborData.decodeInteger(fieldBytes);
                        } else {
                            assert(i == 2);

                            /**
                             * @type {NativeScript[]}
                             */
                            const children = [];

                            CborData.decodeList(fieldBytes, (_, listBytes) => {
                                children.push(NativeScript.fromCbor(listBytes))
                            });

                            script = new NativeAtLeast(Number(nOrSlot), children);
                        }

                        break;
                    case 4:
                    case 5:
                        assert(i == 1);

                        nOrSlot = CborData.decodeInteger(fieldBytes);

                        switch(type) {
                            case 4:
                                script = new NativeAfter(nOrSlot);
                                break;
                            case 5:
                                script = new NativeBefore(nOrSlot);
                                break;
                            default:
                                throw new Error("unexpected");
                        }

                        break;
                    default:
                        throw new Error("unexpected");
                }
            }
        });

        if (!script) {
            throw new Error("unable to deserialize native script");
        } else {
            return script;
        }
    }

    /**
     * @param {string | Object} json 
     * @returns {NativeScript}
     */
    static fromJson(json) {
        const obj = (typeof json == "string") ? JSON.parse(json) : json;

        const type = obj.type;

        if (!type) {
            throw new Error("invalid Native script");
        }

        switch (type) {
            case "sig": {
                const keyHash = obj.keyHash;

                if (!keyHash) {
                    throw new Error("invalid NativeKey script");
                }

                return new NativeSig(PubKeyHash.fromHex(keyHash));
            }
            case "all": {
                /**
                 * @type {Object[]}
                 */
                const scripts = obj.scripts;

                if (!scripts) {
                    throw new Error("invalid NativeAll script");
                }

                return new NativeAll(scripts.map(s => NativeScript.fromJson(s)));
            }
            case "any": {
                /**
                 * @type {Object[]}
                 */
                const scripts = obj.scripts;

                if (!scripts) {
                    throw new Error("invalid NativeAny script");
                }

                return new NativeAny(scripts.map(s => NativeScript.fromJson(s)));
            }
            case "atLeast": {
                const n = obj.required;

                if (typeof n != "number") {
                    throw new Error("invalid NativeAtLeast script");
                }

                /**
                 * @type {Object[]}
                 */
                const scripts = obj.scripts;

                if (!scripts) {
                    throw new Error("invalid NativeAtLeast script");
                }
    

                return new NativeAtLeast(n, scripts.map(s => NativeScript.fromJson(s)));
            }
            case "after": {
                const slot = obj.slot;

                if (typeof slot != "number") {
                    throw new Error("invalid NativeAfter script");
                }

                return new NativeAfter(BigInt(slot));
            }
            case "before": {
                const slot = obj.slot;

                if (typeof slot != "number") {
                    throw new Error("invalid NativeAfter script");
                }

                return new NativeBefore(BigInt(slot));
            }
            default:
                throw new Error(`unrecognized NativeScript type '${type}'`);
        }
    }

    /**
     * @returns {Object}
     */
    toJson() {
        throw new Error("not implemented");
    }

    /**
     * @param {NativeContext} context 
     * @returns {boolean}
     */
    eval(context) {
       throw new Error("not implemented");
    }

    /**
     * @returns {number[]}
     */
    hash() {
        let innerBytes = this.toCbor();

		innerBytes.unshift(0);

		// used for both script addresses and minting policy hashes
		return Crypto.blake2b(innerBytes, 28);
    }

    /**
     * A NativeScript can be used both as a Validator and as a MintingPolicy
     * @type {ValidatorHash}
     */
    get validatorHash() {
        return new ValidatorHash(this.hash());
    }

    /**
     * A NativeScript can be used both as a Validator and as a MintingPolicy
     * @type {MintingPolicyHash}
     */
    get mintingPolicyHash() {
        return new MintingPolicyHash(this.hash());
    }
}

class NativeSig extends NativeScript {
    #pkh;

    /**
     * @param {PubKeyHash} pkh 
     */
    constructor(pkh) {
        super(0);
        this.#pkh = pkh;
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return CborData.encodeTuple([
            this.typeToCbor(),
            this.#pkh.toCbor()
        ]);
    }

    /**
     * @returns {Object}
     */
    toJson() {
        return {
            type: "sig",
            keyHash: this.#pkh.hex
        }
    }

    /**
     * @param {NativeContext} context 
     * @returns {boolean}
     */
    eval(context) {
        return context.isSignedBy(this.#pkh);
    }
}

class NativeAll extends NativeScript {
    #scripts;

    /**
     * @param {NativeScript[]} scripts 
     */
    constructor(scripts) {
        super(1);
        assert(scripts.length > 0);
        this.#scripts = scripts;
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return CborData.encodeTuple([
            this.typeToCbor(),
            CborData.encodeDefList(this.#scripts)
        ]);
    }

    /**
     * @returns {Object}
     */
    toJson() {
        return {
            type: "all",
            scripts: this.#scripts.map(s => s.toJson())
        }
    }

    /**
     * @param {NativeContext} context 
     * @returns {boolean}
     */
    eval(context) {
        return this.#scripts.every(s => s.eval(context));
    }
}

class NativeAny extends NativeScript {
    #scripts;

    /**
     * @param {NativeScript[]} scripts
     */
    constructor(scripts) {
        super(2);
        assert(scripts.length > 0);
        this.#scripts = scripts;
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return CborData.encodeTuple([
            this.typeToCbor(),
            CborData.encodeDefList(this.#scripts)
        ]);
    }

    /**
     * @returns {Object}
     */
    toJson() {
        return {
            type: "any",
            scripts: this.#scripts.map(s => s.toJson())
        }
    }

    /**
     * @param {NativeContext} context
     * @returns {boolean}
     */
    eval(context) {
        return this.#scripts.some(s => s.eval(context));
    }
}

class NativeAtLeast extends NativeScript {
    #required;
    #scripts;

    /**
     * @param {number} required
     * @param {NativeScript[]} scripts
     */
    constructor(required, scripts) {
        super(3);
        assert(scripts.length >= required);
        this.#required = required;
        this.#scripts = scripts;
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return CborData.encodeTuple([
            this.typeToCbor(),
            CborData.encodeInteger(BigInt(this.#required)),
            CborData.encodeDefList(this.#scripts)
        ]);
    }

    /**
     * @returns {Object}
     */
    toJson() {
        return {
            type: "atLeast",
            required: this.#required,
            scripts: this.#scripts.map(s => s.toJson())
        };
    }

    /**
     * @param {NativeContext} context
     * @returns {boolean}
     */
    eval(context) {
        const count = this.#scripts.reduce((prev, s) => prev + (s.eval(context) ? 1 : 0), 0);

        return count >= this.#required;
    }
}

class NativeAfter extends NativeScript {
    #slot;

    /**
     * @param {bigint} slot
     */
    constructor(slot) {
        super(4);
        this.#slot = slot;
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return CborData.encodeTuple([
            this.typeToCbor(),
            CborData.encodeInteger(this.#slot)
        ])
    }

    /**
     * @returns {Object}
     */
    toJson() {
        const slot = Number(this.#slot);

        if (BigInt(slot) != this.#slot) {
            console.error("Warning: slot overflow (not representable by Number in Native script Json)");
        }

        return {
            type: "after",
            slot: slot
        };
    }

    /**
     * @param {NativeContext} context
     * @returns {boolean}
     */
    eval(context) {
        return context.isAfter(this.#slot);
    }
}

class NativeBefore extends NativeScript {
    #slot;

    /**
     * @param {bigint} slot
     */
    constructor(slot) {
        super(5);
        this.#slot = slot;
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return CborData.encodeTuple([
            this.typeToCbor(),
            CborData.encodeInteger(this.#slot)
        ])
    }

    /**
     * @returns {Object}
     */
    toJson() {
        const slot = Number(this.#slot);

        if (BigInt(slot) != this.#slot) {
            console.error("Warning: slot overflow (not representable by Number in Native script Json)");
        }

        return {
            type: "before",
            slot: slot
        };
    }

    /**
     * @param {NativeContext} context
     * @returns {boolean}
     */
    eval(context) {
        return context.isBefore(this.#slot);
    }
}