export * from "@hyperionbt/helios"

import { Program } from "@hyperionbt/helios"

/**
 * @typedef {{
 *   optimize?: boolean
 * }} CompileOptions
 */

/**
 * @param {string} main 
 * @param {CompileOptions} options 
 * @returns {string} - cborHex of UplcProgram (UplcProgramV2)
 */
export function compile(main, options = {}) {
    const optimize = options.optimize ?? false

    const program = Program.new(main)

    return JSON.parse(program.compile(optimize).serialize()).cborHex
}