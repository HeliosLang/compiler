import { DatumRedeemerEntryPoint } from "./DatumRedeemerEntryPoint.js"
import { Module } from "./Module.js"

/**
 * @typedef {import("./EntryPoint.js").EntryPoint} EntryPoint
 */

/**
 * @implements {EntryPoint}
 */
export class SpendingEntryPoint extends DatumRedeemerEntryPoint {
    /**
     * @param {Module[]} modules
     */
    constructor(modules) {
        super("spending", modules)
    }
}
