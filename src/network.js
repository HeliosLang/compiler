//@ts-check
// Network

import {
    assert,
    assertDefined,
    hexToBytes
} from "./utils.js";

import {
    UplcData
} from "./uplc-data.js";

import {
    Address,
    Assets,
    AssetClass,
    DatumHash,
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
    TxInput,
    StakeAddress
} from "./tx-builder.js";

/**
 * @typedef {import("./wallets.js").Wallet} Wallet
 */

import {
    WalletHelper
} from "./wallets.js";
import { HashedDatum } from "./tx-builder.js";


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
     * @type {string}
     */
    get networkName() {
        return this.#networkName;
    }

    /**
     * Throws an error if a Blockfrost project_id is missing for that specific network.
     * @param {TxInput} refUtxo
     * @param {{
     *     preview?: string,
     *     preprod?: string,
     *     mainnet?: string
     * }} projectIds
     * @returns {Promise<BlockfrostV0>}
     */
    static async resolveUsingUtxo(refUtxo, projectIds) {
        const mainnetProjectId = projectIds["mainnet"];
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

            if (await previewNetwork.hasUtxo(refUtxo)) {
                return previewNetwork;
            }
        }

        if (mainnetProjectId !== undefined) {
            const mainnetNetwork = new BlockfrostV0("mainnet", mainnetProjectId);

            if (await mainnetNetwork.hasUtxo(refUtxo)) {
                return mainnetNetwork;
            }
        }

        throw new Error("refUtxo not found on a network for which you have a project id");
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
    static async resolveUsingWallet(wallet, projectIds) {
        if (await wallet.isMainnet()) {
            return new BlockfrostV0("mainnet", assertDefined(projectIds["mainnet"]));
        } else {
            const helper = new WalletHelper(wallet);

            const refUtxo = await helper.refUtxo;

            if (refUtxo === null) {
                throw new Error("empty wallet, can't determine which testnet you are connecting to");
            } else {
                return BlockfrostV0.resolveUsingUtxo(refUtxo, projectIds);
            }
        }
    }

     /**
     * Connects to the same network a given `Wallet` or the given `TxInput` (preview, preprod or mainnet).
     * 
     * Throws an error if a Blockfrost project_id is missing for that specific network.
     * @param {TxInput | Wallet} utxoOrWallet
     * @param {{
     *     preview?: string,
     *     preprod?: string,
     *     mainnet?: string
     * }} projectIds
     * @returns {Promise<BlockfrostV0>}
     */
    static async resolve(utxoOrWallet, projectIds) {
        if (utxoOrWallet instanceof TxInput) {
            return BlockfrostV0.resolveUsingUtxo(utxoOrWallet, projectIds);
        } else {
            return BlockfrostV0.resolveUsingWallet(utxoOrWallet, projectIds);
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

        // TODO: build networkParams from Blockfrost endpoints instead
        return new NetworkParams(await response.json());
    }

    /**
     * @returns {Promise<any>}
     */
    async getLatestEpoch() {
        const response = await fetch(`https://cardano-${this.#networkName}.blockfrost.io/api/v0/epochs/latest`, {
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

        const responseObj = await response.json();

        
        
        const outputs = responseObj.outputs;

        if (!outputs) {
            console.log(responseObj);
            throw new Error(`unexpected response from Blockfrost`);
        }

        const obj = outputs[id.utxoIdx];

        if (!obj) {
            console.log(responseObj);
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
            new TxOutputId(TxId.fromHex(obj.tx_hash), obj.output_index),
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

/**
 * Koios network interface.
 * @implements {Network}
 */
export class KoiosV0 {
    #networkName;

    /**
     * @param {"preview" | "preprod" | "mainnet"} networkName 
     */
    constructor(networkName) {
        this.#networkName = networkName;
    }

    /**
     * @private
     * @type {string}
     */
    get rootUrl() {
        return {
            preview: "https://preview.koios.rest",
            preprod: "https://preprod.koios.rest",
            guildnet: "https://guild.koios.rest",
            mainnet: "https://api.koios.rest"
        }[this.#networkName];
    }

     /**
     * @returns {Promise<NetworkParams>}
     */
     async getParameters() {
        const response = await fetch(`https://d1t0d7c2nekuk0.cloudfront.net/${this.#networkName}.json`);

        // TODO: build networkParams from Koios endpoints instead
        return new NetworkParams(await response.json());
    }

    /**
     * @private
     * @param {TxOutputId[]} ids 
     * @returns {Promise<TxInput[]>}
     */
    async getUtxosInternal(ids) {
        const url = `${this.rootUrl}/api/v0/tx_info`;

        /**
         * @type {Map<string, number[]>}
         */
        const txIds = new Map();
        
        ids.forEach(id => {
            const prev = txIds.get(id.txId.hex);

            if (prev) {
                prev.push(id.utxoIdx);
            } else {
                txIds.set(id.txId.hex, [id.utxoIdx]);
            }
        });

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "accept": "application/json",
                "content-type": "application/json"
            },
            body: JSON.stringify({
                _tx_hashes: Array.from(txIds.keys())
            })
        });

        const responseText = await response.text();

        if (response.status != 200) {
            // analyze error and throw a different error if it was detected that an input UTxO might not exist
            throw new Error(responseText);
        }

        const obj = JSON.parse(responseText);

        /**
         * @type {Map<string, TxInput>}
         */
        const result = new Map();

        const rawTxs = obj;

        if (!Array.isArray(rawTxs)) {
            throw new Error(`unexpected tx_info format: ${responseText}`);
        }

        rawTxs.forEach(rawTx => {
            const rawOutputs = rawTx["outputs"];
            
            if (!rawOutputs) {
                throw new Error(`unexpected tx_info format: ${JSON.stringify(rawTx)}`);
            }

            const utxoIdxs = assertDefined(txIds.get(rawTx.tx_hash));

            for (let utxoIdx of utxoIdxs) {
                const id = new TxOutputId(new TxId(rawTx.tx_hash), utxoIdx);
                
                const rawOutput = rawOutputs[id.utxoIdx]

                if (!rawOutput) {
                    throw new Error(`UTxO ${id.toString()} doesn't exist`);
                }

                const rawPaymentAddr = rawOutput.payment_addr?.bech32;

                if (!rawPaymentAddr || typeof rawPaymentAddr != "string") {
                    throw new Error(`unexpected tx_info format: ${JSON.stringify(rawTx)}`);
                }

                const rawStakeAddr = rawOutput.stake_addr;

                if (rawStakeAddr === undefined) {
                    throw new Error(`unexpected tx_info format: ${JSON.stringify(rawTx)}`);
                }

                const paymentAddr = Address.fromBech32(rawPaymentAddr);
                
                const stakeAddr = rawStakeAddr ? StakeAddress.fromBech32(rawStakeAddr) : null;

                const address = Address.fromHashes(
                    assertDefined(paymentAddr.pubKeyHash ?? paymentAddr.validatorHash),
                    stakeAddr?.stakingHash ?? null,
                    this.#networkName != "mainnet"
                );

                const lovelace = BigInt(parseInt(assertDefined(rawOutput.value)));

                assert(lovelace.toString() == rawOutput.value, `unexpected tx_info format: ${JSON.stringify(rawTx)}`)

                /**
                 * @type {[AssetClass, bigint][]}
                 */
                const assets = [];

                for (let rawAsset of rawOutput.asset_list) {
                    const qty = BigInt(parseInt(rawAsset.quantity));
                    assert(qty.toString() == rawAsset.quantity, `unexpected tx_info format: ${JSON.stringify(rawTx)}`)

                    assets.push([
                        new AssetClass(`${rawAsset.policy_id}.${rawAsset.asset_name ?? ""}`),
                        qty
                    ]);
                }

                const datum = rawOutput.inline_datum ? 
                    (Datum.inline(UplcData.fromCbor(rawOutput.inline_datum.bytes))) : 
                    (rawOutput.datum_hash ? new HashedDatum(new DatumHash(rawOutput.datum_hash)) : null);

                const refScript = rawOutput.reference_script ? UplcProgram.fromCbor(rawOutput.reference_script) : null;

                const txInput =  new TxInput(
                    id,
                    new TxOutput(
                        address,
                        new Value(lovelace, new Assets(assets)),
                        datum,
                        refScript
                    )
                );

                result.set(id.toString(), txInput);
            }
        });

        return ids.map(id => assertDefined(result.get(id.toString())));
    }

     /**
     * @param {TxInput} refUtxo
     * @returns {Promise<KoiosV0>}
     */
    static async resolveUsingUtxo(refUtxo) {
        const preprodNetwork = new KoiosV0("preprod");

        if (await preprodNetwork.hasUtxo(refUtxo)) {
            return preprodNetwork;
        }
        
        const previewNetwork = new KoiosV0("preview");

        if (await previewNetwork.hasUtxo(refUtxo)) {
            return previewNetwork;
        }

        const mainnetNetwork = new KoiosV0("mainnet");

        if (await mainnetNetwork.hasUtxo(refUtxo)) {
            return mainnetNetwork;
        }

        throw new Error("refUtxo not found on any network");
    }

    /** 
     * @param {TxOutputId} id 
     * @returns {Promise<TxInput>}
     */
    async getUtxo(id) {
        return assertDefined(await this.getUtxosInternal([id])[0]);
    }

     /**
     * Used by `KoiosV0.resolveUsingUtxo()`.
     * @param {TxInput} utxo
     * @returns {Promise<boolean>}
     */
     async hasUtxo(utxo) {
        const url = `${this.rootUrl}/api/v0/tx_info`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "accept": "application/json",
                "content-type": "application/json"
            },
            body: JSON.stringify({
                _tx_hashes: [utxo.outputId.txId.hex]
            })
        });

        return response.ok;
    }

    /**
     * @param {Address} address 
     * @returns {Promise<TxInput[]>}
     */
    async getUtxos(address) {
        const url = `${this.rootUrl}/api/v0/credential_utxos`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "accept": "application/json",
                "content-type": "application/json"
            },
            body: JSON.stringify({
                _payment_credentials: [assertDefined(address.pubKeyHash ?? address.validatorHash).hex]
            })
        });

        const responseText = await response.text();

        if (response.status != 200) {
            // analyze error and throw a different error if it was detected that an input UTxO might not exist
            throw new Error(responseText);
        }

        const obj = JSON.parse(responseText);

        if (!Array.isArray(obj)) {
            throw new Error(`unexpected credential_utxos format: ${responseText}`);
        }

        const ids = obj.map(rawId => {
            const utxoIdx = Number(rawId.tx_index);
            const id = new TxOutputId(new TxId(rawId.tx_hash), utxoIdx);

            return id;
        });

        return this.getUtxosInternal(ids);
    }

    /**
     * @param {Tx} tx 
     * @returns {Promise<TxId>}
     */
    async submitTx(tx) {
        const url = `${this.rootUrl}/api/v0/submittx`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "accept": "application/json",
                "content-type": "application/cbor"
            },
            body: new Uint8Array(tx.toCbor())
        });

        const responseText = await response.text();

        if (response.status != 200) {
            // analyze error and throw a different error if it was detected that an input UTxO might not exist
            throw new Error(responseText);
        }

        return new TxId(responseText);
    }
}