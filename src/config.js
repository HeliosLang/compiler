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
 * A Real in Helios is a fixed point number with REAL_PRECISION precision
 * @package
 * @type {number}
 */
export const REAL_PRECISION = 6;

/**
 * Modifiable config vars
 * @type {{
 *   DEBUG: boolean,
 *   STRICT_BABBAGE: boolean,
 *   IS_TESTNET: boolean,
 *   N_DUMMY_INPUTS: number,
 *   AUTO_SET_VALIDITY_RANGE: boolean,
 *   VALIDITY_RANGE_START_OFFSET: number | null,
 *   VALIDITY_RANGE_END_OFFSET: number | null
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
    N_DUMMY_INPUTS: 2,

    /**
     * The validatity time range can be set automatically if a call to tx.time_range is detected.
     * Helios defines some reasonable defaults.
     */
    AUTO_SET_VALIDITY_RANGE: true,
    VALIDITY_RANGE_START_OFFSET: 60, // seconds
    VALIDITY_RANGE_END_OFFSET: 300 // seconds
}
