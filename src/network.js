//@ts-check
// Network

import {
    assertDefined,
    hexToBytes
} from "./utils.js";

import {
    ConstrData
} from "./uplc-data.js";

import {
    Address,
    Assets,
    MintingPolicyHash,
    TxId,
    Value
} from "./helios-data.js";

import {
    Datum,
    Tx,
    TxOutput,
    UTxO
} from "./tx-builder.js";

/**
 * @typedef {import("./wallets.js").Wallet} Wallet
 */

import {
    WalletHelper
} from "./wallets.js";

/**
 * @typedef {{
 *     getUtxos(address: Address): Promise<UTxO[]>,
 *     submitTx(tx: Tx): Promise<TxId>
 * }} Network
 */

/**
 * @implements {Network}
 */
export class BlockfrostV0 {
    #networkName;
    #projectId;

    /**
     * @param {string} networkName - "preview", "preprod" or "mainnet"
     * @param {string} projectId
     */
    constructor(networkName, projectId) {
        this.#networkName = networkName;
        this.#projectId = projectId
    }

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
    static async resolve(wallet, projectIds) {
        if (await wallet.isMainnet()) {
            return new BlockfrostV0("mainnet", assertDefined(projectIds["mainnet"]));
        } else {
            const helper = new WalletHelper(wallet);

            const refUtxo = await helper.refUtxo;

            if (refUtxo === null) {
                throw new Error("empty wallet, can't determine which testnet you are connecting to");
            } else {
                const preprodProjectId = projectIds["preprod"];
                const previewProjectId = projectIds["preview"];

                if (preprodProjectId !== undefined) {
                    const preprodNetwork = new BlockfrostV0("preprod", preprodProjectId);

                    if (await preprodNetwork.hasUtxo(refUtxo)) {
                        return preprodNetwork;
                    }
                }

                if (previewProjectId !== undefined) {
                    const previewNetwork = new BlockfrostV0("preview", previewProjectId);

                    if (!(await previewNetwork.hasUtxo(refUtxo))) {
                        throw new Error("not preview network (hint: provide project id for preprod");
                    } else {
                        return previewNetwork;
                    }
                } else {
                    if (preprodProjectId === undefined) {
                        throw new Error("no project ids for testnets");
                    } else {
                        throw new Error("no project id for preview testnet");
                    }
                }
            }
        }
    }

    /**
     * @param {any} obj
     * @returns
     */
    static parseValue(obj) {
        let value = new Value();

        for (let item of obj) {
            let qty = BigInt(item.quantity);

            if (item.unit == "lovelace") {
                value = value.add(new Value(qty));
            } else {
                let policyID = item.unit.substring(0, 56);
                let mph = MintingPolicyHash.fromHex(policyID);

                let token = hexToBytes(item.unit.substring(56));

                value = value.add(new Value(0n, new Assets([
                    [mph, [
                        [token, qty]
                    ]]
                ])));
            }
        }

        return value;
    }

    /**
     * Used by BlockfrostV0.resolve()
     * @param {UTxO} utxo
     * @returns {Promise<boolean>}
     */
    async hasUtxo(utxo) {
        const txId = utxo.txId;

        const url = `https://cardano-${this.#networkName}.blockfrost.io/api/v0/txs/${txId.hex}/utxos`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "project_id": this.#projectId
            }
        });

        return response.ok;
    }

    /**
     * Returns oldest UTxOs first, newest last.
     * TODO: pagination
     * @param {Address} address
     * @returns {Promise<UTxO[]>}
     */
    async getUtxos(address) {
        const url = `https://cardano-${this.#networkName}.blockfrost.io/api/v0/addresses/${address.toBech32()}/utxos?order=asc`;

        const response = await fetch(url, {
            headers: {
                "project_id": this.#projectId
            }
        });

        /**
         * @type {any}
         */
        let all = await response.json();

        if (all?.status_code >= 300) {
            all = [];
        }

        return all.map(obj => {
            return new UTxO(
                TxId.fromHex(obj.tx_hash),
                BigInt(obj.output_index),
                new TxOutput(
                    address,
                    BlockfrostV0.parseValue(obj.amount),
                    obj.inline_datum ? Datum.inline(ConstrData.fromCbor(hexToBytes(obj.inline_datum))) : undefined
                )
            );
        });
    }

    /**
     * @param {Tx} tx
     * @returns {Promise<TxId>}
     */
    async submitTx(tx) {
        const data = new Uint8Array(tx.toCbor());
        const url = `https://cardano-${this.#networkName}.blockfrost.io/api/v0/tx/submit`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "content-type": "application/cbor",
                "project_id": this.#projectId
            },
            body: data
        }).catch(e => {
            console.error(e);
            throw e;
        });

        const responseText = await response.text();

        if (response.status != 200) {
            throw new Error(responseText);
        } else {
            return new TxId(JSON.parse(responseText));
        }
    }
}
