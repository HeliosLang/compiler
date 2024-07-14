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
     * @param {boolean} allowPosParams
     * @param {boolean} invertEntryPoint
     */
    constructor(modules, allowPosParams, invertEntryPoint) {
        super("spending", modules, allowPosParams, invertEntryPoint)
    }
}
