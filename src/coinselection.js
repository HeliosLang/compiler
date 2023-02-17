//@ts-check
// CoinSelection

import {
    Value
} from "./helios-data.js";

import {
    UTxO
} from "./tx-builder.js";
import { assert } from "./utils.js";

/**
 * Collection of coin selection algorithms
 */
export class CoinSelection {
    /**
     * @param {UTxO[]} utxos 
     * @param {Value} amount 
     * @param {boolean} largestFirst
     * @returns {[UTxO[], UTxO[]]} - [picked, not picked that can be used as spares]
     */
    static selectExtremumFirst(utxos, amount, largestFirst) {
        let sum = new Value();

        /** @type {UTxO[]} */
        let notSelected = utxos.slice();

        /** @type {UTxO[]} */
        const selected = [];

        /**
         * Selects smallest utxos until 'needed' is reached
         * @param {bigint} neededQuantity
         * @param {(utxo: UTxO) => bigint} getQuantity
         */
        function select(neededQuantity, getQuantity) {
            // first sort notYetPicked in ascending order when picking smallest first,
            // and in descending order when picking largest first
            notSelected.sort((a, b) => {
                return Number(getQuantity(a) - getQuantity(b)) * (largestFirst ? -1 : 1);
            });

            let count = 0n;
            const remaining = [];

            while (count < neededQuantity || count == 0n) { // must select at least one utxo if neededQuantity == 0n
                const utxo = notSelected.shift();

                if (utxo === undefined) {
                    throw new Error("not enough utxos to cover amount");
                } else {
                    const qty = getQuantity(utxo);

                    if (qty > 0n) {
                        count += qty;
                        selected.push(utxo);
                        sum = sum.add(utxo.value);
                    } else {
                        remaining.push(utxo)
                    }
                }
            }

            notSelected = remaining;
        }

        /**
         * Select UTxOs while looping through (MintingPolicyHash,TokenName) entries
         */
        const mphs = amount.assets.mintingPolicies;

        for (const mph of mphs) {
            const tokenNames = amount.assets.getTokenNames(mph);

            for (const tokenName of tokenNames) {
                const need = amount.assets.get(mph, tokenName);
                const have = sum.assets.get(mph, tokenName);

                if (have < need) {
                    const diff = need - have;

                    select(diff, (utxo) => utxo.value.assets.get(mph, tokenName));
                }
            }
        }

        // now use the same strategy for lovelace
        const need = amount.lovelace;
        const have = sum.lovelace;

        if (have < need) {
            const diff = need - have;

            select(diff, (utxo) => utxo.value.lovelace);
        }

        assert(selected.length + notSelected.length == utxos.length, "internal error: select algorithm doesn't conserve utxos");

        return [selected, notSelected];
    }

    /**
     * @param {UTxO[]} utxos 
     * @param {Value} amount 
     * @returns {[UTxO[], UTxO[]]} - [selected, not selected]
     */
    static selectSmallestFirst(utxos, amount) {
        return CoinSelection.selectExtremumFirst(utxos, amount, false);
    }

    /**
     * @param {UTxO[]} utxos 
     * @param {Value} amount 
     * @returns {[UTxO[], UTxO[]]} - [selected, not selected]
     */
    static selectLargestFirst(utxos, amount) {
        return CoinSelection.selectExtremumFirst(utxos, amount, true);
    }
}