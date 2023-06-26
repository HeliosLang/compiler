//@ts-check
// CoinSelection

import { 
    assert
} from "./utils.js";

import {
    Value
} from "./helios-data.js";

import {
    UTxO
} from "./tx-builder.js";

/**
 * @typedef {(utxos: UTxO[], amount: Value) => [UTxO[], UTxO[]]} CoinSelectionAlgorithm
 */

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
            // sort UTxOs that contain more assets last
            notSelected.sort((a, b) => {
                const qa = getQuantity(a);
                const qb = getQuantity(b);

                const sign = largestFirst ? -1 : 1;

                if (qa != 0n && qb == 0n) {
                    return sign;
                } else if (qa == 0n && qb != 0n) {
                    return -sign;
                } else if (qa == 0n && qb == 0n) {
                    return 0;
                } else {
                    const na = a.value.assets.nTokenTypes;
                    const nb = b.value.assets.nTokenTypes;

                    if (na == nb) {
                        return Number(qa - qb)*sign;
                    } else if (na < nb) {
                        return sign;
                    } else {
                        return -sign
                    }
                }
            });

            let count = 0n;
            const remaining = [];

            while (count < neededQuantity || count == 0n) { // must select at least one utxo if neededQuantity == 0n
                const utxo = notSelected.shift();

                if (utxo === undefined) {
                    console.error(selected.map(s => JSON.stringify(s.dump(), undefined, "  ")));
                    console.error(JSON.stringify(amount.dump(), undefined, "  "));
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

            notSelected = notSelected.concat(remaining);
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
     * @type {CoinSelectionAlgorithm}
     */
    static selectSmallestFirst(utxos, amount) {
        return CoinSelection.selectExtremumFirst(utxos, amount, false);
    }

    /**
     * @type {CoinSelectionAlgorithm}
     */
    static selectLargestFirst(utxos, amount) {
        return CoinSelection.selectExtremumFirst(utxos, amount, true);
    }
}