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
    IS_TESTNET: true
}
