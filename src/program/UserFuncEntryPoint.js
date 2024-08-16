import { GenericEntryPoint } from "./GenericEntryPoint.js"
import { Module } from "./Module.js"

/**
 * @typedef {import("./EntryPoint.js").EntryPoint} EntryPoint
 */

/**
 * @implements {EntryPoint}
 */
export class UserFuncEntryPoint extends GenericEntryPoint {
    /**
     * @param {Module[]} modules
     */
    constructor(modules) {
        super("testing", modules)
    }
}
