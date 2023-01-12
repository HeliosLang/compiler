//@ts-check
// CoinSelection

import {
    Value
} from "./helios-data.js";

import {
    UTxO
} from "./tx-builder.js";

/**
 * Collection of coin selection algorithms
 */
export class CoinSelection {
    /**
     * @param {UTxO[]} utxos 
     * @param {Value} amount 
     * @returns {[UTxO[], UTxO[]]} - [picked, not picked that can be used as spares]
     */
    static pickSmallest(utxos, amount) {
        let sum = new Value();

        /** @type {UTxO[]} */
        let notYetPicked = utxos.slice();

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
}