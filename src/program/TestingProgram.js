import { GenericProgram } from "./GenericProgram.js"
import { Module } from "./Module.js"
import { DEFAULT_PROGRAM_CONFIG } from "./Program.js"

export class TestingProgram extends GenericProgram {
    /**
     * @param {Module[]} modules
     */
    constructor(modules) {
        super("testing", modules, DEFAULT_PROGRAM_CONFIG)
    }
}
