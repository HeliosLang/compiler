//@ts-check
// Global constants

/**
 * Global debug flag. Not currently used for anything though.
 * @package
 */
export var DEBUG = false;

/**
 * Changes the value of DEBUG
 * @package
 * @param {boolean} b
 */
export function debug(b) { DEBUG = b };

/**
 * Set this to true if you want to experiment with transactions serialized using the strict babbage cddl format
 * @package
 */
export var STRICT_BABBAGE = false;

/**
 * A tab used for indenting of the IR.
 * 2 spaces.
 * @package
 * @type {string}
 */
export const TAB = "  ";


/**
 * Set to false if using the library for mainnet (impacts Addresses)
 * @type {boolean}
 */
export var IS_TESTNET = true;