import { GenericEntryPoint } from "./GenericEntryPoint.js"
import { ModuleCollection } from "./ModuleCollection.js"

/**
 * @typedef {import("./EntryPoint.js").EntryPoint} EntryPoint
 */

/**
 * @implements {EntryPoint}
 */
export class TestingEntryPoint extends GenericEntryPoint {
    /**
     * @param {ModuleCollection} modules
     */
    constructor(modules) {
        super("testing", modules)
    }
}
