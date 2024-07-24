import { SourceMappedString } from "@helios-lang/ir"
import { ParametricName } from "./ParametricName.js"
import { RE_BUILTIN, RawFunc } from "./RawFunc.js"
import { makeRawFunctions } from "./makeRawFuncs.js"
import { wrapWithDefs, TAB } from "./Definitions.js"

/**
 * @typedef {import("./Definitions.js").Definitions} Definitions
 */

export class ToIRContext {
    /**
     * @readonly
     * @type {boolean}
     */
    simplify

    /**
     * @readonly
     * @type {boolean}
     */
    isTestnet

    /**
     * @readonly
     * @type {string}
     */
    indent

    /**
     * @type {Map<string, RawFunc>}
     */
    #db

    /**
     * @param {boolean} simplify
     * @param {boolean} isTestnet
     * @param {string} indent
     * @param {Map<string, RawFunc>} db
     */
    constructor(simplify, isTestnet, indent = "", db = new Map()) {
        this.simplify = simplify
        this.isTestnet = isTestnet
        this.indent = indent

        this.#db = db
    }

    /**
     * @returns {ToIRContext}
     */
    tab() {
        return new ToIRContext(
            this.simplify,
            this.isTestnet,
            this.indent + TAB,
            this.#db
        )
    }

    /**
     * @type {Map<string, RawFunc>}
     */
    get db() {
        if (this.#db.size == 0) {
            this.#db = makeRawFunctions(this.simplify, this.isTestnet)
        }

        return this.#db
    }

    /**
     * Load all raw generics so all possible implementations can be generated correctly during type parameter injection phase
     * @returns {Map<string, ((ttp: string[], ftp: string[]) => SourceMappedString)>}
     */
    fetchRawGenerics() {
        /**
         * @type {Map<string, ((ttp: string[], ftp: string[]) => SourceMappedString)>}
         */
        const map = new Map()

        for (let [k, v] of this.db) {
            if (ParametricName.matches(k)) {
                // load without dependencies
                /**
                 *
                 * @param {string[]} ttp
                 * @param {string[]} ftp
                 * @returns {SourceMappedString}
                 */
                const fn = (ttp, ftp) => v.toIR(ttp, ftp)
                map.set(k, fn)
            }
        }

        return map
    }

    /**
     * Doesn't add templates
     * @param {SourceMappedString} ir
     * @param {Option<Definitions>} userDefs - some userDefs might have the __helios prefix
     * @returns {Definitions}
     */
    fetchRawFunctions(ir, userDefs = null) {
        let [src, _] = ir.toStringWithSourceMap()

        let matches = src.match(RE_BUILTIN)

        /**
         * @type {Definitions}
         */
        const map = new Map()

        if (matches) {
            for (let m of matches) {
                if (
                    !ParametricName.matches(m) &&
                    !map.has(m) &&
                    (!userDefs || !userDefs.has(m))
                ) {
                    const builtin = this.db.get(m)

                    if (!builtin) {
                        throw new Error(`builtin ${m} not found`)
                    }

                    builtin.load(this.db, map)
                }
            }
        }

        return map
    }

    /**
     * @param {SourceMappedString} ir
     * @returns {SourceMappedString}
     */
    wrapWithRawFunctions(ir) {
        const map = this.fetchRawFunctions(ir)

        return wrapWithDefs(ir, map)
    }
}
