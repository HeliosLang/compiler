import { DatumRedeemerEntryPoint } from "./DatumRedeemerEntryPoint.js"
import { ModuleCollection } from "./ModuleCollection.js"

/**
 * @typedef {import("./EntryPoint.js").EntryPoint} EntryPoint
 */

/**
 * @implements {EntryPoint}
 */
export class SpendingEntryPoint extends DatumRedeemerEntryPoint {
    /**
     * @param {ModuleCollection} modules
     */
    constructor(modules) {
        super("spending", modules)
    }
}
