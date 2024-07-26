import { Module } from "./Module.js"
import { RedeemerEntryPoint } from "./RedeemerEntryPoint.js"

/**
 * @typedef {import("./EntryPoint.js").EntryPoint} EntryPoint
 */

/**
 * @implements {EntryPoint}
 */
export class MintingEntryPoint extends RedeemerEntryPoint {
    /**
     * @param {Module[]} modules
     */
    constructor(modules) {
        super("minting", modules)
    }
}
