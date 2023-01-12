//@ts-check
// Network

import {
    TxId
} from "./helios-data.js";

import {
    Tx
} from "./tx-builder.js";

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