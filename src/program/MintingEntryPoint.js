import { ModuleCollection } from "./ModuleCollection.js"
import { RedeemerEntryPoint } from "./RedeemerEntryPoint.js"

/**
 * @typedef {import("./EntryPoint.js").EntryPoint} EntryPoint
 */

/**
 * @implements {EntryPoint}
 */
export class MintingEntryPoint extends RedeemerEntryPoint {
    /**
     * @param {ModuleCollection} modules
     */
    constructor(modules) {
        super("minting", modules)
    }
}
