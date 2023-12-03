//@ts-check
// Wallets

import {
    assertDefined,
    bytesToHex,
    hexToBytes,
    textToBytes
} from "./utils.js";

import {
    Address,
    PubKeyHash,
    TxId,
    Value
} from "./helios-data.js";

import {
    Signature,
    StakeAddress,
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
 * @property {() => Promise<boolean>} isMainnet Returns `true` if the wallet is connected to the mainnet.
 * @property {Promise<StakeAddress[]>} rewardAddresses Returns a list of the reward addresses.
 * @property {Promise<Address[]>} usedAddresses Returns a list of addresses which already contain UTxOs.
 * @property {Promise<Address[]>} unusedAddresses Returns a list of unique unused addresses which can be used to send UTxOs to with increased anonimity.
 * @property {Promise<TxInput[]>} utxos Returns a list of all the utxos controlled by the wallet.
 * @property {Promise<TxInput[]>} collateral
 * @property {(addr: Address, sigStructure: string) => Promise<{signature: string, key: string}>} signData Signs a message, returning an object containing the signature and key that can be used to verify/authenticate the message later.
 * @property {(tx: Tx) => Promise<Signature[]>} signTx Signs a transaction, returning a list of signatures needed for submitting a valid transaction.
 * @property {(tx: Tx) => Promise<TxId>} submitTx Submits a transaction to the blockchain and returns the id of that transaction upon success.
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
 *     getRewardAddresses(): Promise<string[]>,
 *     signData(addr: string, sigStructure: string): Promise<{signature: string, key: string}>,
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
export class Cip30Wallet {
    #handle;

    /**
     * Constructs Cip30Wallet using the Cip30Handle which is available in the browser window.cardano context.
     * 
     * ```ts
     * const handle: helios.Cip30Handle = await window.cardano.eternl.enable()
     * const wallet = new helios.Cip30Wallet(handle)
     * ```
     * @param {Cip30Handle} handle
     */
    constructor(handle) {
        this.#handle = handle;
    }

    /**
     * Returns `true` if the wallet is connected to the mainnet.
     * @returns {Promise<boolean>}
     */
    async isMainnet() {
        return (await this.#handle.getNetworkId()) == 1;
    }

    /**
     * Gets a list of unique reward addresses which can be used to UTxOs to.
     * @type {Promise<StakeAddress[]>}
     */
     get rewardAddresses() {
        return this.#handle.getRewardAddresses().then(
            addresses => {
                if (!Array.isArray(addresses)) {
                    throw new Error(`The wallet getRewardAddresses() call did not return an array.`);
                }

                return addresses.map(a => new StakeAddress(hexToBytes(a)));
            });
    }

    /**
     * Gets a list of addresses which contain(ed) UTxOs.
     * @type {Promise<Address[]>}
     */
    get usedAddresses() {
        return this.#handle.getUsedAddresses().then(addresses => addresses.map(a => new Address(a)));
    }

    /**
     * Gets a list of unique unused addresses which can be used to UTxOs to.
     * @type {Promise<Address[]>}
     */
    get unusedAddresses() {
        return this.#handle.getUnusedAddresses().then(addresses => addresses.map(a => new Address(a)));
    }

    /**
     * Gets the complete list of UTxOs (as `TxInput` instances) sitting at the addresses owned by the wallet.
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
     * Sign a data payload with the users wallet.
     *
     * @param {Address} addr - A Cardano address object
     * @param {string} sigStructure - The message to sign, in string format.
     * @return {Promise<{signature: string, key: string}>}
     */
    async signData(addr, sigStructure) {
        if (!(addr instanceof Address)) {
            throw new Error(`The value in the addr parameter is not a Cardano Address object.`);
        } else if (typeof sigStructure !== 'string' || sigStructure.length < 1) {
            throw new Error(`The sigStructure parameter is empty or invalid.  Must be a non-empty string`);
        }

        // Convert the string to a hex string since that is what
        //  the underlying signData() method expects.
        const hexStr = bytesToHex(textToBytes(sigStructure));

        return await this.#handle.signData(addr.toHex(), hexStr);
    }

    /**
     * Signs a transaction, returning a list of signatures needed for submitting a valid transaction.
     * @param {Tx} tx
     * @returns {Promise<Signature[]>}
     */
    async signTx(tx) {
        const res = await this.#handle.signTx(bytesToHex(tx.toCbor()), true);

        return TxWitnesses.fromCbor(hexToBytes(res)).signatures;
    }

    /**
     * Submits a transaction to the blockchain.
     * @param {Tx} tx
     * @returns {Promise<TxId>}
     */
    async submitTx(tx) {
        const responseText = await this.#handle.submitTx(bytesToHex(tx.toCbor()));

        return new TxId(responseText);
    }
}

/**
 * High-level helper class for instances that implement the `Wallet` interface.
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
     * Concatenation of `usedAddresses` and `unusedAddresses`.
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
     * First `Address` in `allAddresses`.
     * @type {Promise<Address>}
     */
    get baseAddress() {
        return this.allAddresses.then(addresses => assertDefined(addresses[0]));
    }

    /**
     * First `Address` in `unusedAddresses` (falls back to last `Address` in `usedAddresses` if not defined).
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
     * First UTxO in `utxos`. Can be used to distinguish between preview and preprod networks.
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
            const utxos = await this.#wallet.utxos;

            if (utxos.length > 0) {
                return utxos;
            }
        } catch (e) {
            if (!this.#getUtxosFallback) {
                console.error("fallback not set");
                throw e;
            }
        }

        if (this.#getUtxosFallback) {
            console.log("falling back to retrieving UTxOs through query layer");
            return this.#getUtxosFallback(await this.#wallet.usedAddresses);
        } else {
            throw new Error("wallet returned 0 utxos, set the helper getUtxosFallback callback to use an Api query layer instead");
        }
    }
    /**
     * Pick a number of UTxOs needed to cover a given Value. The default coin selection strategy is to pick the smallest first.
     * @param {Value} amount
     * @param {CoinSelectionAlgorithm} algorithm
     * @returns {Promise<[TxInput[], TxInput[]]>} The first list contains the selected UTxOs, the second list contains the remaining UTxOs.
     */
    async pickUtxos(amount, algorithm = CoinSelection.selectSmallestFirst) {
        return algorithm(await this.getUtxos(), amount);
    }

    /**
     * Picks a single UTxO intended as collateral.
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
     * Returns `true` if the `PubKeyHash` in the given `Address` is controlled by the wallet.
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
     * Returns `true` if the given `PubKeyHash` is controlled by the wallet.
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
     * @returns {Promise<any>}
     */
    async toJson() {
        const isMainnet = (await this.#wallet.isMainnet());
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
     * @type {Promise<StakeAddress[]>}
     */
    get rewardAddresses() {
        throw new Error("not yet implemented")
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
     * @param {Address} addr
     * @param {string} message
     * @return {Promise<{signature: string, key: string}>}
     */
    async signData(addr, message) {
        throw new Error("not yet implemented")
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
