//@ts-check
// Emulator

import {
    assert,
    bigIntToBytes,
    eq
} from "./utils.js";

/**
 * @typedef {import("./crypto.js").NumberGenerator} NumberGenerator
 */

import {
    Crypto
} from "./crypto.js";

import {
    Address,
    Assets,
    PubKeyHash,
    TxId,
    Value
} from "./helios-data.js";

import {
    Signature,
    Tx,
    TxOutput,
    UTxO
} from "./tx-builder.js";

/**
 * @typedef {import("./wallets.js").Wallet} Wallet
 */

/**
 * @typedef {import("./network.js").Network} Network
 */

/**
 * Single address wallet emulator.
 * @implements {Wallet}
 */
export class WalletEmulator {
    #network;
    #privateKey;
    #publicKey;

    /** 
     * @param {Network} network
     * @param {NumberGenerator} random - used to generate the private key
     */
    constructor(network, random) {
        this.#network = network;
        this.#privateKey = WalletEmulator.genPrivateKey(random);
        this.#publicKey = Crypto.Ed25519.derivePublicKey(this.#privateKey);

        // TODO: staking credentials
    }

    /**
     * Generate a private key from a random number generator (not cryptographically secure!)
     * @param {NumberGenerator} random 
     * @returns {number[]} - Ed25519 private key is 32 bytes long
     */
    static genPrivateKey(random) {
        const key = [];

        for (let i = 0; i < 32; i++) {
            key.push(Math.floor(random()*256)%256);
        }

        return key;
    }

    /**
     * @type {PubKeyHash}
     */
    get pubKeyHash() {
        return new PubKeyHash(Crypto.blake2b(this.#publicKey, 28));
    }

    get address() {
        return Address.fromPubKeyHash(this.pubKeyHash);
    }

    /**
     * @returns {Promise<boolean>}
     */
    async isMainnet() {
        return false;
    }

    /**
     * Assumed wallet was initiated with at least 1 UTxO at the pubkeyhash address.
     * @returns {Promise<Address[]>}
     */
    get usedAddresses() {
        return new Promise((resolve, _) => {
            resolve([this.address])
        });
    }

    get unusedAddresses() {
        return new Promise((resolve, _) => {
            resolve([])
        });
    }

    get utxos() {
        return new Promise((resolve, _) => {
            resolve(this.#network.getUtxos(this.address));
        });
    }

    /**
     * Simply assumed the tx needs to by signed by this wallet without checking.
     * @param {Tx} tx
     * @returns {Promise<Signature[]>}
     */
    async signTx(tx) {
        return [
            new Signature(
                this.#publicKey,
                Crypto.Ed25519.sign(tx.bodyHash, this.#privateKey)
            )
        ];
    }

    /**
     * @param {Tx} tx 
     * @returns {Promise<TxId>}
     */
    async submitTx(tx) {
        return await this.#network.submitTx(tx);
    }
}

/**
 * collectUtxos removes tx inputs from the list, and appends txoutputs sent to the address to the end.
 * @typedef {{
 *     id(): TxId,
 *     consumes(txId: TxId, utxoIdx: bigint): boolean,
 *     collectUtxos(address: Address, utxos: UTxO[]): UTxO[]
 * }} EmulatorTx
 */

/**
 * @implements {EmulatorTx}
 */
class GenesisTx {
    #id;
    #address;
    #lovelace;
    #assets;

    /**
     * @param {number} id
     * @param {Address} address 
     * @param {bigint} lovelace
     * @param {Assets} assets 
     */
    constructor(id, address, lovelace, assets) {
        this.#id = id;
        this.#address = address;
        this.#lovelace = lovelace;
        this.#assets = assets;
    }

    /**
     * Simple incremental txId for genesis transactions.
     * It's very unlikely that regular transactions have the same hash.
     * @return {TxId}
     */
    id() {
        let bytes = bigIntToBytes(BigInt(this.#id));

        if (bytes.length < 32) {
            bytes = (new Array(32 - bytes.length)).fill(0).concat(bytes);
        }

        return new TxId(bytes);
    }

    /**
     * @param {TxId} txId 
     * @param {bigint} utxoIdx 
     * @returns 
     */
    consumes(txId, utxoIdx) {
        return false;
    }

    /**
     * @param {Address} address
     * @param {UTxO[]} utxos
     * @returns {UTxO[]}
     */
    collectUtxos(address, utxos) {
        if (eq(this.#address.bytes, address.bytes)) {
            utxos = utxos.slice();

            utxos.push(new UTxO(
                this.id(),
                0n,
                new TxOutput(
                    this.#address,
                    new Value(this.#lovelace, this.#assets)
                )
            ));

            return utxos;
        } else {
            return utxos;
        }
    }
}

/**
 * @implements {EmulatorTx}
 */
class RegularTx {
    #tx;

    /**
     * @param {Tx} tx 
     */
    constructor(tx) {
        this.#tx = tx;
    }

    /**
     * @returns {TxId}
     */
    id() {
        return this.#tx.id();
    }

    /**
     * @param {TxId} txId
     * @param {bigint} utxoIdx
     * @returns {boolean}
     */
    consumes(txId, utxoIdx) {
        const txInputs = this.#tx.body.inputs;

        return txInputs.some(txInput => {
            return txInput.txId.hex == txId.hex && txInput.utxoIdx == utxoIdx;
        });
    }

    /**
     * @param {Address} address 
     * @param {UTxO[]} utxos 
     * @returns {UTxO[]}
     */
    collectUtxos(address, utxos) {
        utxos = utxos.filter(utxo => !this.consumes(utxo.txId, utxo.utxoIdx));

        const txOutputs = this.#tx.body.outputs;

        txOutputs.forEach((txOutput, utxoId) => {
            if (eq(txOutput.address.bytes, address.bytes)) {
                utxos.push(new UTxO(
                    this.id(),
                    BigInt(utxoId),
                    txOutput
                ));
            }
        });

        return utxos;
    }
}

/**
 * @implements {Network}
 */
export class NetworkEmulator {
    /**
     * @type {bigint}
     */
    #slot;

    /**
     * @type {NumberGenerator}
     */
    #random;

    /**
     * @type {GenesisTx[]}
     */
    #genesis;

    /**
     * @type {EmulatorTx[]}
     */
    #mempool;

    /**
     * @type {EmulatorTx[][]}
     */
    #blocks;

    /**
     * @param {number} seed 
     */
    constructor(seed = 0) {
        this.#slot = 0n;
        this.#random = Crypto.mulberry32(seed);
        this.#genesis = [];
        this.#mempool = [];
        this.#blocks = [];
    }

    /**
     * Creates a WalletEmulator and adds a block with a single fake unbalanced Tx
     * @param {bigint} lovelace
     * @param {Assets} assets
     * @returns {WalletEmulator}
     */
    createWallet(lovelace = 0n, assets = new Assets([])) {
        const wallet = new WalletEmulator(this, this.#random);

        this.createUtxo(wallet, lovelace, assets);

        return wallet;
    }

    /**
     * Creates a UTxO using a GenesisTx.
     * @param {WalletEmulator} wallet 
     * @param {bigint} lovelace 
     * @param {Assets} assets 
     */
    createUtxo(wallet, lovelace, assets = new Assets([])) {
        if (lovelace != 0n || !assets.isZero()) {
            const tx = new GenesisTx(
                this.#genesis.length,
                wallet.address,
                lovelace,
                assets
            );

            this.#genesis.push(tx);
            this.#mempool.push(tx);
        }
    }

    /**
     * Mint a block with the current mempool, and advance the slot.
     * @param {bigint} nSlots 
     */
    tick(nSlots) {
        if (this.#mempool.length > 0) {
            this.#blocks.push(this.#mempool);

            this.#mempool = [];
        }

        this.#slot += nSlots;
    }

    /**
     * @param {Address} address
     * @returns {Promise<UTxO[]>}
     */
    async getUtxos(address) {
        /**
         * @type {UTxO[]}
         */
        let utxos = [];

        for (let block of this.#blocks) {
            for (let tx of block) {
                utxos = tx.collectUtxos(address, utxos);
            }
        }

        return utxos;
    }

    /**
     * @param {TxId} txId 
     * @param {bigint} utxoIdx 
     * @returns {boolean}
     */
    isConsumed(txId, utxoIdx) {
        return this.#blocks.some(b => {
            return b.some(tx => {
                return tx.consumes(txId, utxoIdx)
            })
        }) || this.#mempool.some(tx => {
            return tx.consumes(txId, utxoIdx);
        })
    }

    /**
     * @param {Tx} tx 
     * @returns {Promise<TxId>}
     */
    async submitTx(tx) {
        assert(tx.isValid(this.#slot), "tx invalid (not finalized or slot out of range)");

        // make sure that none of the inputs have been consumed before
        assert(tx.body.inputs.every(input => !this.isConsumed(input.txId, input.utxoIdx)), "input already consumed before");

        this.#mempool.push(new RegularTx(tx));

        return tx.id();
    }
}