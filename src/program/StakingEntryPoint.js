import { ModuleCollection } from "./ModuleCollection.js"
import { RedeemerEntryPoint } from "./RedeemerEntryPoint.js"

/**
 * @typedef {import("./EntryPoint.js").EntryPoint} EntryPoint
 */

/**
 * @implements {EntryPoint}
 */
export class StakingEntryPoint extends RedeemerEntryPoint {
    /**
     * @param {ModuleCollection} modules
     */
    constructor(modules) {
        super("staking", modules)
    }
}
