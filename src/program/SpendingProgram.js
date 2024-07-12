import { DatumRedeemerProgram } from "./DatumRedeemerProgram.js"
import { Module } from "./Module.js"

/**
 * @typedef {import("./Program.js").ProgramConfig} ProgramConfig
 */

export class SpendingProgram extends DatumRedeemerProgram {
    /**
     * @param {Module[]} modules
     * @param {ProgramConfig} config
     */
    constructor(modules, config) {
        super("spending", modules, config)
    }
}
