//@ts-check
// Config

/**
 * A tab used for indenting of the IR.
 * 2 spaces.
 * @package
 * @type {string}
 */
export const TAB = "  ";

/**
 * Modifiable config vars
 * @type {{
 *   DEBUG: boolean,
 *   STRICT_BABBAGE: boolean,
 *   IS_TESTNET: boolean,
 *   N_DUMMY_INPUTS: number
 * }}
 */
export const config = {
    /**
     * Global debug flag. Not currently used for anything though.
     */
    DEBUG: false,

    /**
     * Set this to true if you want to experiment with transactions serialized using the strict babbage cddl format
     */
    STRICT_BABBAGE: false,

    /**
     * Set to false if using the library for mainnet (impacts Addresses)
     */
    IS_TESTNET: true,

    /**
     * Calculating the execution budget during tx building requires knowing all the inputs beforehand,
     *   which is very difficult because balancing is done after the budget is calculated.
     * Instead we use at least 1 dummy input, which should act as a representative balancing input.
     * For increased robustness we use 2 dummy inputs, one with Txid 0 and other with TxId ffff...,
     *   because eg. there are case where the TxId is being printed, and a Txid of ffff... would overestimate the fee
     * This value must be '1' or '2'
     */
    N_DUMMY_INPUTS: 2
}
