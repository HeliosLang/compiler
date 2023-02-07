//@ts-check
// Network

import {
    assertDefined
} from "./utils.js";

import {
    TxId
} from "./helios-data.js";

import {
    Tx,
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
 *   submitTx(tx: Tx): Promise<TxId>
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
     *   preview?: string,
     *   preprod?: string,
     *   mainnet?: string
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