//@ts-check
// Wallets

import {
    assertDefined,
    hexToBytes
} from "./utils.js";

import {
    Address,
    PubKeyHash,
    Value
} from "./helios-data.js";

import {
    UTxO
} from "./tx-builder.js";


/**
 * @typedef {{
 *   usedAddresses: Promise<Address[]>,
 *   unusedAddresses: Promise<Address[]>,
 *   utxos: Promise<UTxO[]>
 * }} Wallet
 */

/**
 * @typedef {{
 *   getNetworkId(): Promise<number>,
 *   getUsedAddresses(): Promise<string[]>,
 *   getUnusedAddresses(): Promise<string[]>,
 *   getUtxos(): Promise<string[]>,
 *   signTx(txHex: string, partialSign: boolean): Promise<string>,
 *   submitTx(txHex: string): Promise<string>
 * }} Cip30
 */

/**
 * @implements {Wallet}
 */
export class Cip30Wallet {
    #fullApi;

    /**
     * @param {Cip30} fullApi 
     */
    constructor(fullApi) {
        this.#fullApi = fullApi;
    }

    /**
     * @type {Promise<Address[]>}
     */
    get usedAddresses() {
        return this.#fullApi.getUsedAddresses().then(addresses => addresses.map(a => new Address(a)));
    }

    /**
     * @type {Promise<Address[]>}
     */
    get unusedAddresses() {
        return this.#fullApi.getUnusedAddresses().then(addresses => addresses.map(a => new Address(a)));
    }

    /**
     * @type {Promise<UTxO[]>}
     */
    get utxos() {
        return this.#fullApi.getUtxos().then(utxos => utxos.map(u => UTxO.fromCbor(hexToBytes(u))));
    }
}

export class WalletHelper {
    #wallet;

    /**
     * @param {Wallet} wallet 
     */
    constructor(wallet) {
        this.#wallet = wallet;
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

        const utxos = await this.#wallet.utxos;

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
        return this.#wallet.unusedAddresses.then(addresses => assertDefined(addresses[0]));
    }

    /**
     * Returns the first UTxO, so the caller can check precisely which network the user is connected to (eg. preview or preprod)
     * @type {Promise<?UTxO>}
     */
    get refUtxo() {
        return this.#wallet.utxos.then(utxos => {
            if(utxos.length == 0) {
                return null;
            } else {
                return assertDefined(utxos[0])
            }
        });
    }

    /**
     * @param {Value} amount 
     * @returns {Promise<[UTxO[], UTxO[]]>} - [picked, not picked that can be used as spares]
     */ 
    async pickUtxos(amount) {
        let sum = new Value();

        /** @type {UTxO[]} */
        let notYetPicked = await this.#wallet.utxos;

        /** @type {UTxO[]} */
        const picked = [];

        const mphs = amount.assets.mintingPolicies;

        /**
         * Picks smallest utxos until 'needed' is reached
         * @param {bigint} neededQuantity
         * @param {(utxo: UTxO) => bigint} getQuantity
         */
        function picker(neededQuantity, getQuantity) {
            // first sort notYetPicked in ascending order
            notYetPicked.sort((a, b) => {
                return Number(getQuantity(a) - getQuantity(b));
            });


            let count = 0n;
            const remaining = [];

            while (count < neededQuantity) {
                const utxo = notYetPicked.shift();

                if (utxo === undefined) {
                    throw new Error("not enough utxos to cover amount");
                } else {
                    const qty = getQuantity(utxo);

                    if (qty > 0n) {
                        count += qty;
                        picked.push(utxo);
                        sum = sum.add(utxo.value);
                    } else {
                        remaining.push(utxo)
                    }
                }
            }

            notYetPicked = remaining;
        }

        for (const mph of mphs) {
            const tokenNames = amount.assets.getTokenNames(mph);

            for (const tokenName of tokenNames) {
                const need = amount.assets.get(mph, tokenName);
                const have = sum.assets.get(mph, tokenName);

                if (have < need) {
                    const diff = need - have;

                    picker(diff, (utxo) => utxo.value.assets.get(mph, tokenName));
                }
            }
        }

        // now use the same strategy for lovelace
        const need = amount.lovelace;
        const have = sum.lovelace;

        if (have < need) {
            const diff = need - have;

            picker(diff, (utxo) => utxo.value.lovelace);
        }

        return [picked, notYetPicked];
    }

    /**
     * Returned collateral can't contain an native assets (pure lovelace)
     * TODO: combine UTxOs if a single UTxO isn't enough
     * @param {bigint} amount - 2 Ada should cover most things
     * @returns {Promise<UTxO>}
     */
    async pickCollateral(amount = 2000000n) {
        const pureUtxos = (await this.#wallet.utxos).filter(utxo => utxo.value.assets.isZero());

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
}