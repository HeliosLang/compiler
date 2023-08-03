//@ts-check
// Wallets

import {
    assertDefined,
    bytesToHex,
    hexToBytes
} from "./utils.js";

import {
    Address,
    PubKeyHash,
    TxId,
    Value
} from "./helios-data.js";

import {
    Signature,
    Tx,
    TxWitnesses,
    TxInput
} from "./tx-builder.js";

/**
 * @typedef {import("./coinselection.js").CoinSelectionAlgorithm} CoinSelectionAlgorithm
 */

import {
    CoinSelection
} from "./coinselection.js";

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
export class Cip30Wallet {
    #handle;

    /**
     * @param {Cip30Handle} handle
     */
    constructor(handle) {
        this.#handle = handle;
    }

    /**
     * @returns {Promise<boolean>}
     */
    async isMainnet() {
        return (await this.#handle.getNetworkId()) == 1;
    }

    /**
     * @type {Promise<Address[]>}
     */
    get usedAddresses() {
        return this.#handle.getUsedAddresses().then(addresses => addresses.map(a => new Address(a)));
    }

    /**
     * @type {Promise<Address[]>}
     */
    get unusedAddresses() {
        return this.#handle.getUnusedAddresses().then(addresses => addresses.map(a => new Address(a)));
    }

    /**
     * @type {Promise<TxInput[]>}
     */
    get utxos() {
        return this.#handle.getUtxos().then(utxos => utxos.map(u => TxInput.fromFullCbor(hexToBytes(u))));
    }

    /**
     * @type {Promise<TxInput[]>}
     */
    get collateral() {
        const getCollateral = this.#handle.getCollateral || this.#handle.experimental.getCollateral;
        return getCollateral().then(utxos => utxos.map(u => TxInput.fromFullCbor(hexToBytes(u))));
    }

    /**
     * @param {Tx} tx
     * @returns {Promise<Signature[]>}
     */
    async signTx(tx) {
        const res = await this.#handle.signTx(bytesToHex(tx.toCbor()), true);

        return TxWitnesses.fromCbor(hexToBytes(res)).signatures;
    }

    /**
     * @param {Tx} tx
     * @returns {Promise<TxId>}
     */
    async submitTx(tx) {
        const responseText = await this.#handle.submitTx(bytesToHex(tx.toCbor()));

        return new TxId(responseText);
    }
}

/**
 * Wraps an instance implementing the Wallet interface in order to provide additional functionality.
 */
export class WalletHelper {
    #wallet;
    #getUtxosFallback;

    /**
     * @param {Wallet} wallet
     * @param {undefined | ((addr: Address[]) => Promise<TxInput[]>)} getUtxosFallback
     */
    constructor(wallet, getUtxosFallback = undefined) {
        this.#wallet = wallet;
        this.#getUtxosFallback = getUtxosFallback;
    }

    /**
     * @type {Promise<Address[]>}
     */
    get allAddresses() {
        return this.#wallet.usedAddresses.then(usedAddress => this.#wallet.unusedAddresses.then(unusedAddresses => usedAddress.concat(unusedAddresses)));
    }

    /**
     * @returns {Promise<Value>}
     */
    async calcBalance() {
        let sum = new Value();

        const utxos = await this.getUtxos();

        for (const utxo of utxos) {
            sum = sum.add(utxo.value);
        }

        return sum;
    }

    /**
     * @type {Promise<Address>}
     */
    get baseAddress() {
        return this.allAddresses.then(addresses => assertDefined(addresses[0]));
    }

    /**
     * @type {Promise<Address>}
     */
    get changeAddress() {
        return this.#wallet.unusedAddresses.then(addresses => {
            if (addresses.length == 0) {
                return this.#wallet.usedAddresses.then(addresses => {
                    if (addresses.length == 0) {
                        throw new Error("no addresses found")
                    } else {
                        return addresses[addresses.length-1];
                    }
                })
            } else {
                return addresses[0];
            }
        });
    }

    /**
     * Returns the first UTxO, so the caller can check precisely which network the user is connected to (eg. preview or preprod)
     * @type {Promise<null | TxInput>}
     */
    get refUtxo() {
        return this.getUtxos().then(utxos => {
            if(utxos.length == 0) {
                return null;
            } else {
                return assertDefined(utxos[0]);
            }
        });
    }

    /**
     * @returns {Promise<TxInput[]>}
     */
    async getUtxos() {
        try {
            return await this.#wallet.utxos;
        } catch (e) {
            if (this.#getUtxosFallback && e.message.includes("unknown error in getUtxos")) {
                return this.#getUtxosFallback(await this.#wallet.usedAddresses);
            } else {
                throw e
            }
        }
    }
    /**
     * @param {Value} amount
     * @param {CoinSelectionAlgorithm} algorithm
     * @returns {Promise<[TxInput[], TxInput[]]>} - [picked, not picked that can be used as spares]
     */
    async pickUtxos(amount, algorithm = CoinSelection.selectSmallestFirst) {
        return algorithm(await this.getUtxos(), amount);
    }

    /**
     * Returned collateral can't contain an native assets (pure lovelace)
     * TODO: combine UTxOs if a single UTxO isn't enough
     * @param {bigint} amount - 2 Ada should cover most things
     * @returns {Promise<TxInput>}
     */
    async pickCollateral(amount = 2000000n) {
        const pureUtxos = (await this.getUtxos()).filter(utxo => utxo.value.assets.isZero());

        if (pureUtxos.length == 0) {
            throw new Error("no pure UTxOs in wallet (needed for collateral)");
        }

        const bigEnough = pureUtxos.filter(utxo => utxo.value.lovelace >= amount);

        if (bigEnough.length == 0) {
            throw new Error("no UTxO in wallet that is big enough to cover collateral");
        }

        bigEnough.sort((a,b) => Number(a.value.lovelace - b.value.lovelace));

        return bigEnough[0];
    }

    /**
     * @param {Address} addr
     * @returns {Promise<boolean>}
     */
    async isOwnAddress(addr) {
        const pkh = addr.pubKeyHash;

        if (pkh === null) {
            return false;
        } else {
            return this.isOwnPubKeyHash(pkh);
        }
    }

    /**
     * @param {PubKeyHash} pkh
     * @returns {Promise<boolean>}
     */
    async isOwnPubKeyHash(pkh) {
        const addresses = await this.allAddresses;

        for (const addr of addresses) {
            const aPkh = addr.pubKeyHash;

            if (aPkh !== null && aPkh.eq(pkh)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param {undefined | ((addrs: Address[]) => Promise<TxInput[]>)} utxosFallback
     * @returns {Promise<any>}
     */
    async toJson(utxosFallback = undefined) {
        const isMainnet = (await this.#wallet).isMainnet();
        const usedAddresses = (await this.#wallet.usedAddresses);
        const unusedAddresses = (await this.#wallet.unusedAddresses);

        return {
            isMainnet: isMainnet,
            usedAddresses: usedAddresses.map(a => a.toBech32()),
            unusedAddresses: unusedAddresses.map(a => a.toBech32()),
            utxos: (await this.getUtxos()).map(u => bytesToHex(u.toFullCbor()))
        };
    }
}

/**
 * @implements {Wallet}
 */
export class RemoteWallet {
    #isMainnet;
    #usedAddresses;
    #unusedAddresses;
    #utxos;

    /**
     * @param {boolean} isMainnet
     * @param {Address[]} usedAddresses 
     * @param {Address[]} unusedAddresses 
     * @param {TxInput[]} utxos 
     */
    constructor(isMainnet, usedAddresses, unusedAddresses, utxos) {
        this.#isMainnet = isMainnet;
        this.#usedAddresses = usedAddresses;
        this.#unusedAddresses = unusedAddresses;
        this.#utxos = utxos;
    }

    /**
     * @param {string | Object} obj 
     * @returns {RemoteWallet}
     */
    static fromJson(obj) {
        if (typeof obj == "string") {
            return RemoteWallet.fromJson(JSON.parse(obj));
        } else {
            return new RemoteWallet(
                obj.isMainnet,
                obj.usedAddresses.map(a => Address.fromBech32(a)),
                obj.unusedAddresses.map(a => Address.fromBech32(a)),
                obj.utxos.map(u => TxInput.fromFullCbor(u))
            )
        }
    }

    /**
     * @returns {Promise<boolean>}
     */
    async isMainnet() {
        return this.#isMainnet;
    }

    /**
     * @type {Promise<Address[]>}
     */
    get usedAddresses() {
        return new Promise((resolve, _) => resolve(this.#usedAddresses));
    }
    
    /**
     * @type {Promise<Address[]>}
     */
    get unusedAddresses() {
        return new Promise((resolve, _) => resolve(this.#unusedAddresses));
    }

    /**
     * @type {Promise<TxInput[]>}
     */
    get utxos() {
        return new Promise((resolve, _) => resolve(this.#utxos));
    }

    /**
     * @type {Promise<TxInput[]>}
     */
    get collateral() {
        return new Promise((resolve, _) => resolve([]));
    }

    /**
     * @param {Tx} tx 
     * @returns {Promise<Signature[]>}
     */
    async signTx(tx) {
        throw new Error("a RemoteWallet can't sign a transaction");
    }

    /**
     * @param {Tx} tx 
     * @returns {Promise<TxId>}
     */
    async submitTx(tx) {
        throw new Error("a RemoteWallet can't submit a transaction");
    }
}
