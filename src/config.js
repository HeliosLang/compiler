//@ts-check
// Config

/**
 * A tab used for indenting of the IR.
 * 2 spaces.
 * @internal
 * @type {string}
 */
export const TAB = "  ";

/**
 * A Real in Helios is a fixed point number with REAL_PRECISION precision
 * @internal
 * @type {number}
 */
export const REAL_PRECISION = 6;

/**
 * Mutable global config variables.
 * @namespace
 */
export const config = {
    /**
     * Global debug flag. Currently unused.
     * 
     * Default: `false`.
     * @type {boolean}
     */
    DEBUG: false,

    /**
     * If true, `TxOutput` is serialized using strictly the Babagge cddl format (slightly more verbose).
     * 
     * Default: `false`.
     * @type {boolean}
     */
    STRICT_BABBAGE: false,


    /**
     * If true, `Address` instances are assumed to be for a Testnet when constructing from hashes or raw bytes, otherwise for mainnet.
     * 
     * Defaults: `true`.
     * @type {boolean}
     */
    IS_TESTNET: true,

    /**
     * Calculating the execution budget during tx building requires knowing all the inputs beforehand,
     * which is very difficult because balancing is done after the budget is calculated.
     * Instead we use at least 1 dummy input, which should act as a representative balancing input.
     * For increased robustness we use 2 dummy inputs, one with Txid 0 and other with TxId ffff...,
     * because eg. there are cases where the TxId is being printed,
     * and a Txid of ffff... would overestimate the fee for that.
     * This value must be '1' or '2'.
     * 
     * Default: 2.
     * @deprecated
     * @type {number}
     */
    N_DUMMY_INPUTS: 2,

    /**
     * The validity time range can be set automatically if a call to tx.time_range in a Helios script is detected.
     * If `false` the validity range is still set automatically if not set manually but a warning is printed.
     * 
     * Default: `false`.
     * @type {boolean}
     */
    AUTO_SET_VALIDITY_RANGE: false,


    /**
     * Lower offset wrt. the current system time when setting the validity range automatically.
     * 
     * Defaut: 60 seconds.
     * @type {number} seconds
     */
    VALIDITY_RANGE_START_OFFSET: 60,

    /**
     * Upper offset wrt. the current system time when setting the validity range automatically.
     * 
     * Default: 300 seconds.
     * @type {number} seconds
     */
    VALIDITY_RANGE_END_OFFSET: 300,


    /**
     * Evaluate UPLC program using the CEK algorithm instead of the recursive algorithm.
     * The CEK algorithm is more complex but is more efficient and creates a much better stack trace when errors are thrown.
     * 
     * Default: `false`.
     * @type {boolean}
     */
    EXPERIMENTAL_CEK: false,

    /**
     * Ignore constants that can't be evaluated during compile-time.
     * 
     * Default: `false`.
     * @type {boolean}
     */
    IGNORE_UNEVALUATED_CONSTANTS: false,
}
