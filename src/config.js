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
 * Mutable global config properties.
 * @namespace
 */
export const config = {
    /**
     * Modify the config properties
     * @param {{
     *   DEBUG?: boolean
     *   STRICT_BABBAGE?: boolean
     *   IS_TESTNET?: boolean
     *   N_DUMMY_INPUTS?: number
     *   AUTO_SET_VALIDITY_RANGE?: boolean
     *   VALIDITY_RANGE_START_OFFSET?: number
     *   VALIDITY_RANGE_END_OFFSET?: number
     *   IGNORE_UNEVALUATED_CONSTANTS?: boolean
     *   CHECK_CASTS?: boolean
     *   MAX_ASSETS_PER_CHANGE_OUTPUT?: number
     * }} props 
     */
    set: (props) => {
        Object.keys(props).forEach(k => {
            config[k] = props[k];
        });
    },

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
     * Defaut: 90 seconds.
     * @type {number} seconds
     */
    VALIDITY_RANGE_START_OFFSET: 90,

    /**
     * Upper offset wrt. the current system time when setting the validity range automatically.
     * 
     * Default: 300 seconds.
     * @type {number} seconds
     */
    VALIDITY_RANGE_END_OFFSET: 300,

    /**
     * Ignore constants that can't be evaluated during compile-time.
     * 
     * Default: `false`.
     * @type {boolean}
     */
    IGNORE_UNEVALUATED_CONSTANTS: false,

    /**
     * Check that `from_data` casts make sense during runtime. This ony impacts unsimplified UplcPrograms.
     * 
     * Default: `false`.
     * @type {boolean}
     */
    CHECK_CASTS: false,

    /**
     * Maximum number of assets per change output. Used to break up very large asset outputs into multiple outputs.
     * 
     * Default: `undefined` (no limit).
     */
    MAX_ASSETS_PER_CHANGE_OUTPUT: undefined,
}
