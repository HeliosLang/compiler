//@ts-check
// Network

import {
    assertDefined,
    hexToBytes
} from "./utils.js";

import {
    UplcData
} from "./uplc-data.js";

import {
    Address,
    Assets,
    MintingPolicyHash,
    TxId,
    TxOutputId,
    Value
} from "./helios-data.js";

import { 
    NetworkParams
} from "./uplc-costmodels.js";

import { 
    UplcProgram
} from "./uplc-program.js";

import {
    Datum,
    Tx,
    TxOutput,
    TxInput
} from "./tx-builder.js";

/**
 * @typedef {import("./wallets.js").Wallet} Wallet
 */

import {
    WalletHelper
} from "./wallets.js";


/**
 * Blockchain query interface.
 * @interface
 * @typedef {object} Network
 * @property {(address: Address) => Promise<TxInput[]>} getUtxos Returns a complete list of UTxOs at a given address.
 * @property {(id: TxOutputId) => Promise<TxInput>} getUtxo Returns a single TxInput (that might already have been spent).
 * @property {() => Promise<NetworkParams>} getParameters Returns the latest network parameters.
 * @property {(tx: Tx) => Promise<TxId>} submitTx Submits a transaction to the blockchain and returns the id of that transaction upon success.
 */

/**
 * Blockfrost specific implementation of `Network`.
 * @implements {Network}
 */
export class BlockfrostV0 {
    #networkName;
    #projectId;

    /**
     * Constructs a BlockfrostV0 using the network name (preview, preprod or mainnet) and your Blockfrost `project_id`.
     * @param {"preview" | "preprod" | "mainnet"} networkName
     * @param {string} projectId
     */
    constructor(networkName, projectId) {
        this.#networkName = networkName;
        this.#projectId = projectId
    }

    /**
     * Connects to the same network a given `Wallet` is connected to (preview, preprod or mainnet).
     * 
     * Throws an error if a Blockfrost project_id is missing for that specific network.
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
     * @internal
     * @param {{unit: string, quantity: string}[]} obj
     * @returns {Value}
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
     * @returns {Promise<NetworkParams>}
     */
    async getParameters() {
        const response = await fetch(`https://d1t0d7c2nekuk0.cloudfront.net/${this.#networkName}.json`);

        // TODO: build networkParams from blockfrost endpoints instead (see lambda function)
        return new NetworkParams(await response.json());
    }

    /**
     * @returns {Promise<any>}
     */
    async getLatestEpoch() {
        const response = await fetch(`https://cardano-preview.blockfrost.io/api/v0/epochs/latest`, {
            method: "GET",
            headers: {
                "project_id": this.#projectId
            }
        });

        return (await response.json());
    }

    /**
     * If the UTxO isn't found an error is throw with the following message format: "UTxO <txId.utxoId> not found".
     * @param {TxOutputId} id
     * @returns {Promise<TxInput>}
     */
    async getUtxo(id) {
        const txId = id.txId;

        const url = `https://cardano-${this.#networkName}.blockfrost.io/api/v0/txs/${txId.hex}/utxos`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "project_id": this.#projectId
            }
        });

        if (!response.ok) {
            throw new Error(`UTxO ${id.toString()} not found`);
        } else if (response.status != 200) {
            throw new Error(`Blockfrost error: ${await response.text()}`);
        }
        
        const outputs = (await response.json()).outputs;

        const obj = outputs[id.utxoIdx];

        if (!obj) {
            throw new Error(`UTxO ${id.toString()} not found`);
        }

        obj["tx_hash"] = txId.hex;
        obj["output_index"] = Number(id.utxoIdx);

        return await this.restoreTxInput(obj);
    }

    /**
     * Used by `BlockfrostV0.resolve()`.
     * @param {TxInput} utxo
     * @returns {Promise<boolean>}
     */
    async hasUtxo(utxo) {
        const txId = utxo.outputId.txId;

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
     * @internal
     * @param {{
     *   address: string
     *   tx_hash: string
     *   output_index: number
     *   amount: {unit: string, quantity: string}[]
     *   inline_datum: null | string
     *   data_hash: null | string
     *   collateral: boolean
     *   reference_script_hash: null | string
     * }} obj 
     */
    async restoreTxInput(obj) {
        /**
         * @type {null | UplcProgram}
         */
        let refScript = null;
        if (obj.reference_script_hash !== null) {
            const url = `https://cardano-${this.#networkName}.blockfrost.io/api/v0/scripts/${obj.reference_script_hash}/cbor`;

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "project_id": this.#projectId
                }
            });

            const cbor = (await response.json()).cbor;

            refScript = UplcProgram.fromCbor(cbor);
        }

        return new TxInput(
            new TxOutputId({txId: TxId.fromHex(obj.tx_hash), utxoId: BigInt(obj.output_index)}),
            new TxOutput(
                Address.fromBech32(obj.address),
                BlockfrostV0.parseValue(obj.amount),
                obj.inline_datum ? Datum.inline(UplcData.fromCbor(hexToBytes(obj.inline_datum))) : null,
                refScript
            )
        );
    }

    /**
     * Gets a complete list of UTxOs at a given `Address`.
     * Returns oldest UTxOs first, newest last.
     * @param {Address} address
     * @returns {Promise<TxInput[]>}
     */
    async getUtxos(address) {
        /**
         * TODO: pagination
         */

        const url = `https://cardano-${this.#networkName}.blockfrost.io/api/v0/addresses/${address.toBech32()}/utxos?order=asc`;

        try {
            const response = await fetch(url, {
                headers: {
                    "project_id": this.#projectId
                }
            });

            if (response.status == 404) {
                return []; 
            }

            /**
             * @type {any}
             */
            let all = await response.json();

            if (all?.status_code >= 300) {
                all = [];
            }

            try {
                return await Promise.all(all.map(obj => {
                    return this.restoreTxInput(obj);
                }));
            } catch (e) {
                console.error("unable to parse blockfrost utxo format:", all);
                throw e;
            }
        } catch (e) {
            if (e.message.includes("The requested component has not been found")) {
                return []
            } else {
                throw e
            }
        }
    }

    /**
     * Submits a transaction to the blockchain.
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
            // analyze error and throw a different error if it was detected that an input UTxO might not exist
            throw new Error(responseText);
        } else {
            return new TxId(JSON.parse(responseText));
        }
    }

    /**
     * Allows inspecting the live Blockfrost mempool.
     */
    async dumpMempool() {
        const url = `https://cardano-${this.#networkName}.blockfrost.io/api/v0/mempool`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "project_id": this.#projectId
            }
        });

        console.log(await response.text());
    }
}
