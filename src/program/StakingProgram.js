import { Module } from "./Module.js"
import { DEFAULT_PROGRAM_CONFIG } from "./Program.js"
import { RedeemerProgram } from "./RedeemerProgram.js"

/**
 * @typedef {import("./Program.js").ProgramConfig} ProgramConfig
 */

export class StakingProgram extends RedeemerProgram {
    /**
     * @param {Module[]} modules
     * @param {ProgramConfig} config
     */
    constructor(modules, config = DEFAULT_PROGRAM_CONFIG) {
        super("staking", modules, config)
    }
}
